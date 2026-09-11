#!/usr/bin/env node
/**
 * verifier.mjs — LA CIBLE UNIQUE QUI REJOUE LA CI, en la LISANT au lieu de la recopier
 * (R-50 du pilot, TF-0545 / TF-0553, 24/08/2026).
 *
 * LE FAIT QUI A PRODUIT CET OUTIL, mesuré sur un produit puis retrouvé ici. Chez un produit :
 * l'intégration continue jouait deux contrôles, la session en jouait quatre autres en local, et le
 * recouvrement était NUL. Une régression est passée jusqu'à la branche principale, la CI est sortie
 * rouge avec douze contrôles en échec, et une bascule de domaine a été bloquée plusieurs heures.
 *
 * ICI, LE MÊME DÉFAUT, MESURÉ PAR L'ORACLE DU PILOT : sur les 12 commandes de contrôle du workflow,
 * **8 n'étaient rejouables par aucune cible locale**. Le `npm test` de ce dépôt jouait DEUX fichiers
 * d'oracles quand la CI en joue SEPT — il rassurait donc plus qu'il ne vérifiait.
 *
 * CE QUI EST REFUSÉ ICI, ET C'EST TOUT L'INTÉRÊT : recopier la liste des étapes. Une liste écrite à
 * la main dérive au premier ajout, et personne ne le voit — c'est le défaut d'origine, à un cran de
 * profondeur. Cet outil LIT `.github/workflows/*.yml` et rejoue ses blocs `run:`. Une étape ajoutée
 * là-bas est donc jouée ici sans un geste, et une étape qui casse en local casse aussi la CI.
 *
 * ── TF-1017 (11/09/2026) : LES ÉTAPES ÉTAIENT REJOUÉES, PAS L'ENVIRONNEMENT ────────────────────
 * Fait mesuré le 10/09/2026 : `gh run list` sur `main` rendait HUIT exécutions rouges d'affilée,
 * du 24/08 au 10/09, pendant que cette recette rendait VERT (11 groupes, 101 tests). Le job
 * `batterie` était vert de bout en bout ; les deux jobs `oracles` (ubuntu et windows) tombaient sur
 * les MÊMES deux tests. La cause n'était dans aucune étape : elle était dans ce qui ENTOURE les
 * étapes — `CI=true`, les `env:` déclarés dans le YAML, un runner sans moteur d'impression, un
 * registre de fraîcheur injoignable depuis le réseau du runner. Rejouer les étapes sans rejouer
 * leur environnement, c'est rejouer un autre contrôle en croyant rejouer celui-là.
 *
 * Ce que l'outil fait depuis :
 *  1. il pose `CI=true` sur chaque étape rejouée — c'est la variable que GitHub Actions pose, et
 *     dont du code de test se sert pour durcir ou relâcher un verdict ;
 *  2. il lit les blocs `env:` du YAML aux TROIS niveaux (workflow, job, étape) et les pose, l'étape
 *     l'emportant sur le job, le job sur le workflow — l'ordre de GitHub Actions ;
 *  3. il DIT, une ligne `[non rejouable] …` par condition, tout ce que ce poste ne peut pas
 *     reproduire du runner : plateformes de la matrice, actions `uses:`, version de Node imposée,
 *     valeurs `${{ … }}` résolues côté serveur, moteur d'impression, accès réseau aux registres.
 *     Une condition non rejouable ANNONCÉE reste une lacune ; non annoncée, c'est un mensonge.
 *
 * ── TF-1016 (11/09/2026) : LE JOURNAL DE VERSIONS NE DOIT PAS S'ENDORMIR ───────────────────────
 * Fait mesuré le 10/09/2026 : `CHANGELOG.md` portait une section « [Non publié] » ouverte depuis le
 * 14/08, dernier enregistrement la touchant le 15/08, et ONZE enregistrements touchant `tools/`,
 * `core/` et `oracles/` s'étaient empilés derrière sans une ligne de journal. Un journal qui dort
 * ne se signale jamais lui-même : il faut une règle qui le réveille. Elle est ici, plafond nommé.
 *
 * CE QU'IL NE FAIT PAS : deviner un shell. Les blocs `run:` d'un workflow GitHub sont du shell
 * POSIX (boucles `for`, `if`, `&&`). Sur un poste sans shell POSIX, l'outil s'arrête en le DISANT
 * plutôt que d'exécuter la moitié des étapes dans un interpréteur qui n'est pas le leur — un
 * contrôle qui joue autre chose que ce qu'il annonce est pire qu'un contrôle absent.
 *
 * Usage : node tools/verifier.mjs [--liste] [--job <nom>]
 * Exit : 0 = tout vert · 1 = au moins une étape rouge ou la règle de journal rouge · 2 = aucun
 *        shell POSIX (SKIP dit).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path, { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { NAVIGATEURS, trouverNavigateur } from './fiche-en-pdf.mjs';

export const ICI = join(import.meta.dirname, '..');
const WORKFLOWS = join(ICI, '.github', 'workflows');

/** Une étape qui n'est pas un CONTRÔLE : installer des dépendances ne prouve rien. */
const PAS_UN_CONTROLE = /^(npm|yarn|pnpm)\s+(ci|install)\b/;

/**
 * TF-1016 — plafond NOMMÉ d'enregistrements pouvant toucher le code sans une ligne de journal.
 * Cinq, et non zéro : un enregistrement de correction immédiate n'a pas à porter sa propre entrée.
 * Au-delà, ce n'est plus un retard, c'est un journal qui a cessé d'être tenu.
 */
export const PLAFOND_ENREGISTREMENTS_SANS_JOURNAL = 5;

/** Les chemins dont un changement DOIT finir au journal (PADR-0005 : contrôles, outils, oracles). */
export const CHEMINS_JOURNALISES = ['tools', 'core', 'oracles'];

/** Le fichier qui tient le journal. */
export const JOURNAL = 'CHANGELOG.md';

const indentDe = (l) => (l.match(/^[ ]*/) || [''])[0].length;

/**
 * Les paires `CLE: valeur` d'un bloc `env:` ouvert à la ligne `i`, et l'indice de sa dernière
 * ligne. Une valeur entre guillemets est dénudée ; hors guillemets, un `#` précédé d'un blanc
 * ouvre un commentaire YAML et n'appartient pas à la valeur.
 */
export function blocEnv(lignes, i) {
  const indent = indentDe(lignes[i]);
  const paires = {};
  let fin = i;
  for (let k = i + 1; k < lignes.length; k++) {
    const l = lignes[k];
    if (!l.trim()) { fin = k; continue; }
    if (indentDe(l) <= indent) break;
    fin = k;
    const m = /^\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*:\s*(.*)$/.exec(l);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"') && v.length > 1)
      || (v.startsWith("'") && v.endsWith("'") && v.length > 1)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '').trim();
    paires[m[1]] = v;
  }
  return { paires, fin };
}

/**
 * Les blocs `run:` du workflow, avec leur job, leur nom d'étape et l'ENVIRONNEMENT qui les entoure
 * — pour que l'échec soit lisible ET que le rejeu soit le même contrôle. Les trois niveaux `env:`
 * sont distingués par leur seule indentation : workflow en colonne 0, étape à l'indentation des
 * clés d'une étape, job pour tout ce qui est entre les deux.
 */
export function etapes(brut) {
  const lignes = brut.split(/\r?\n/);
  const out = [];
  let job = '(sans job)';
  let nom = '(sans nom)';
  let envWorkflow = {}, envJob = {}, envEtape = {};
  let indentEtape = -1;
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (!l.trim() || /^\s*#/.test(l)) continue;
    const indent = indentDe(l);

    if (/^\s*env:\s*$/.test(l)) {
      const { paires, fin } = blocEnv(lignes, i);
      if (indent === 0) envWorkflow = { ...envWorkflow, ...paires };
      else if (indentEtape >= 0 && indent >= indentEtape) envEtape = { ...envEtape, ...paires };
      else envJob = { ...envJob, ...paires };
      i = fin;
      continue;
    }

    const mJob = /^  ([A-Za-z0-9_-]+):\s*$/.exec(l);
    if (mJob) { job = mJob[1]; nom = '(sans nom)'; envJob = {}; envEtape = {}; indentEtape = -1; continue; }

    // Début d'étape : l'élément de liste sous `steps:`. Toute la portée `env:` d'étape s'y referme.
    const mTiret = /^(\s*)-\s+\S/.exec(l);
    if (mTiret) { envEtape = {}; indentEtape = mTiret[1].length + 2; }

    const mNom = /^\s*-?\s*name:\s*(.+)$/.exec(l);
    if (mNom) { nom = mNom[1].trim(); continue; }

    const env = () => ({ ...envWorkflow, ...envJob, ...envEtape });
    // Un `env:` d'étape peut être écrit APRÈS le `run:` — le YAML est un objet, pas une séquence.
    // Sans cette relecture, la moitié des workflows perdrait ses variables en silence.
    const envApres = (depuis) => {
      const apres = {};
      for (let k = depuis + 1; k < lignes.length; k++) {
        if (!lignes[k].trim()) continue;
        if (indentDe(lignes[k]) < indent) break;
        if (/^\s*-\s+\S/.test(lignes[k])) break;
        if (/^\s*env:\s*$/.test(lignes[k])) Object.assign(apres, blocEnv(lignes, k).paires);
      }
      return apres;
    };

    const enLigne = /^\s*-?\s*run:\s*(\S.*)$/.exec(l);
    if (enLigne && !/^[|>]/.test(enLigne[1].trim())) {
      out.push({ job, nom, script: enLigne[1].trim(), env: { ...env(), ...envApres(i) } });
      continue;
    }
    if (/^\s*-?\s*run:\s*[|>]/.test(l)) {
      const corps = [];
      let j = i;
      for (let k = i + 1; k < lignes.length; k++) {
        if (!lignes[k].trim()) { corps.push(''); continue; }
        if (indentDe(lignes[k]) <= indent) break;
        corps.push(lignes[k].trim());
        j = k;
      }
      out.push({ job, nom, script: corps.join('\n'), env: { ...env(), ...envApres(j) } });
      i = j;
    }
  }
  // Une étape entièrement faite d'installation ne se rejoue pas : elle ne prouve rien.
  return out.filter((e) => !e.script.split('\n').every((c) => !c.trim() || PAS_UN_CONTROLE.test(c.trim())));
}

/** La famille de runner d'une plateforme Node : `win32` → `windows`, `linux` → `ubuntu`. */
export const familleRunner = (plateforme) =>
  ({ win32: 'windows', darwin: 'macos', linux: 'ubuntu' })[plateforme] ?? String(plateforme);

/**
 * TOUT ce que ce poste ne reproduit pas du runner, une ligne par condition. Fonction PURE : elle
 * prend le texte du workflow et l'état observé du poste, pour qu'une fixture puisse la mettre dans
 * les deux sens. Elle ne juge rien — elle DIT. C'est la différence entre un écart connu et un
 * écart qui a coûté huit exécutions rouges avant d'être vu.
 */
export function nonRejouables(brut, { plateforme = process.platform, nodeVersion = process.version,
  navigateur = null, navigateursCherches = [] } = {}) {
  const lignes = [];
  const famille = familleRunner(plateforme);

  // 1. Plateformes déclarées (runs-on direct + matrice `os:`) qui ne sont pas celle-ci.
  const plateformes = new Set();
  for (const m of brut.matchAll(/^\s*runs-on:\s*(.+)$/gm)) {
    const v = m[1].trim();
    if (!/\$\{\{/.test(v)) plateformes.add(v.replace(/^["']|["']$/g, ''));
  }
  for (const m of brut.matchAll(/^\s*os:\s*\[([^\]]+)\]/gm))
    for (const o of m[1].split(',')) plateformes.add(o.trim().replace(/^["']|["']$/g, ''));
  for (const p of [...plateformes].sort()) {
    if (p.split('-')[0] === famille) continue;
    lignes.push(`plateforme « ${p} » déclarée par le workflow — ce poste est « ${famille} » `
      + `(${plateforme}). Un garde spécifique à cet OS n'est pas exercé ici.`);
  }

  // 2. Actions `uses:` : elles ne s'exécutent pas hors du runner.
  const actions = [...new Set([...brut.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1]))].sort();
  for (const a of actions)
    lignes.push(`action « ${a} » non rejouée — hors runner, c'est le poste qui tient lieu `
      + `de dépôt cloné et d'outillage installé.`);

  // 3. Version de Node imposée par le workflow contre celle qui joue ici.
  const mNode = /^\s*node-version:\s*['"]?(\d+)/m.exec(brut);
  const majeurLocal = String(nodeVersion).replace(/^v/, '').split('.')[0];
  if (mNode && mNode[1] !== majeurLocal)
    lignes.push(`Node ${mNode[1]} imposé par le workflow, Node ${majeurLocal} ici — un contrôle `
      + `qui dépend d'une capacité du runtime (WebSocket natif, par exemple) ne rend pas le même `
      + `verdict des deux côtés.`);

  // 4. Valeurs résolues côté serveur : elles n'ont aucune valeur locale.
  for (const m of brut.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*:\s*(.*\$\{\{[^}]*\}\}.*)$/gm))
    lignes.push(`« ${m[1]} » vaut « ${m[2].trim()} » — expression résolue par le runner, sans `
      + `équivalent local : l'étape qui s'en sert ne joue pas la même chose ici.`);

  // 5. Moteur d'impression : la dépendance qui a fait rougir le test PDF sur un runner sans
  //    navigateur alors qu'il était vert ici. Elle se DIT dans les deux sens.
  lignes.push(navigateur
    ? `moteur d'impression présent ici (${navigateur}) — un runner qui n'en a pas déclare ses `
      + `contrôles PDF en SKIP motivé ; cette recette, elle, les JOUE. Le verdict local est donc `
      + `plus fort que celui du runner, jamais l'inverse.`
    : `aucun moteur d'impression sur ce poste (cherchés : ${navigateursCherches.join(', ') || '—'}) `
      + `— les contrôles PDF se déclarent ici en SKIP motivé ; un runner qui en a un les joue.`);

  // 6. Réseau : les registres de fraîcheur et de sécurité répondent, ou non, selon le poste.
  lignes.push(`accès réseau aux registres (paquets, avis de sécurité, fins de support) — non `
    + `reproductible : ce qui répond depuis ce poste peut ne pas répondre depuis un runner, et `
    + `l'inverse. Les contrôles concernés doivent rendre le MÊME verdict des deux côtés : un `
    + `registre injoignable est un SKIP motivé, jamais un échec d'un côté et un silence de l'autre.`);

  return lignes;
}

/**
 * TF-1016 — le verdict de la règle de journal. Fonction PURE, pour que la fixture la joue dans les
 * deux sens sans dépôt git. `journalModifie` neutralise la règle : le journal n'est pas endormi,
 * il est en train d'être écrit — c'est exactement ce que cette règle demande d'obtenir.
 */
export function verdictJournal({ journalModifie = false, enregistrements = [],
  plafond = PLAFOND_ENREGISTREMENTS_SANS_JOURNAL } = {}) {
  const n = enregistrements.length;
  if (journalModifie)
    return { verdict: 'ok', message: `${JOURNAL} est modifié dans la copie de travail — le journal `
      + `est en cours d'écriture, les ${n} enregistrement(s) en attente ne comptent pas.` };
  if (n <= plafond)
    return { verdict: 'ok', message: `${n}/${plafond} enregistrement(s) touchant `
      + `${CHEMINS_JOURNALISES.join('/')} depuis la dernière entrée de ${JOURNAL}.` };
  return {
    verdict: 'rouge',
    message: `${n} enregistrement(s) touchant ${CHEMINS_JOURNALISES.join('/')} depuis la dernière `
      + `entrée de ${JOURNAL}, plafond ${plafond}. Un journal qui dort ne se signale pas lui-même : `
      + `il rend le dépôt illisible pour qui n'était pas là. À rattraper :\n      `
      + enregistrements.join('\n      '),
  };
}

const git = (args) => {
  const r = spawnSync('git', args, { cwd: ICI, encoding: 'utf8' });
  return { ok: r.status === 0, sortie: (r.stdout || '').trim() };
};

/** L'état observé du journal. Rend `{ disponible:false, motif }` quand git ne peut pas répondre. */
export function releveJournal() {
  if (!git(['rev-parse', '--is-inside-work-tree']).ok)
    return { disponible: false, motif: 'ce dossier n\'est pas un dépôt git' };
  const base = git(['log', '-1', '--format=%H', '--', JOURNAL]).sortie;
  if (!base) return { disponible: false, motif: `aucun enregistrement ne touche ${JOURNAL}` };
  const journalModifie = git(['status', '--porcelain', '--', JOURNAL]).sortie.length > 0;
  const liste = git(['log', '--oneline', `${base}..HEAD`, '--', ...CHEMINS_JOURNALISES]).sortie;
  return { disponible: true, base, journalModifie, enregistrements: liste ? liste.split('\n') : [] };
}

export function shellPosix() {
  for (const candidat of ['bash', 'sh']) {
    const r = spawnSync(candidat, ['-c', 'echo ok'], { encoding: 'utf8' });
    if (r.status === 0 && /ok/.test(r.stdout || '')) return candidat;
  }
  return null;
}

/**
 * Rejoue UNE étape dans l'environnement du runner : `CI=true` d'abord — c'est ce que pose GitHub
 * Actions — puis les `env:` du YAML, qui peuvent le surcharger s'ils le déclarent.
 */
export function rejouer(etape, sh, { cwd = ICI, base = process.env } = {}) {
  const env = { ...base, CI: 'true', ...(etape.env || {}) };
  const r = spawnSync(sh, ['-c', etape.script], { cwd, encoding: 'utf8', env });
  return { vert: r.status === 0, status: r.status, sortie: ((r.stdout || '') + (r.stderr || '')).trim() };
}

function principal(args) {
  const listeSeule = args.includes('--liste');
  // `indexOf` rend -1 quand le drapeau est absent, et `args[-1 + 1]` vaut alors args[0] : le premier
  // drapeau passe devenait un nom de job, et TOUTES les etapes etaient filtrees. Le symptome etait
  // « 0 etape(s) lues » sur un workflow qui en porte onze — un outil qui se TAIT au lieu d echouer.
  // Trouve en le jouant, pas en le relisant.
  const iJob = args.indexOf('--job');
  const jobVoulu = iJob >= 0 ? (args[iJob + 1] || '').trim() : '';

  if (!existsSync(WORKFLOWS)) {
    console.log('verifier : aucun `.github/workflows/` — rien à rejouer');
    return 0;
  }

  const toutes = [];
  const bruts = [];
  for (const f of readdirSync(WORKFLOWS).filter((x) => /\.ya?ml$/i.test(x))) {
    const brut = readFileSync(join(WORKFLOWS, f), 'utf8');
    bruts.push(brut);
    for (const e of etapes(brut)) {
      if (jobVoulu && e.job !== jobVoulu) continue;
      toutes.push({ ...e, fichier: f });
    }
  }

  const navigateur = trouverNavigateur();
  const ecarts = bruts.flatMap((b) => nonRejouables(b, { navigateur, navigateursCherches: NAVIGATEURS }));

  if (listeSeule) {
    for (const e of toutes) {
      const env = Object.entries({ CI: 'true', ...e.env }).map(([k, v]) => `${k}=${v}`).join(' ');
      console.log(`[${e.job}] ${e.nom}\n    env: ${env}\n    ${e.script.split('\n').join('\n    ')}`);
    }
    console.log(`\n${toutes.length} étape(s) de contrôle lues dans le workflow`);
    for (const l of ecarts) console.log(`[non rejouable] ${l}`);
    return 0;
  }

  const sh = shellPosix();
  if (!sh) {
    console.log('verifier : SKIP — aucun shell POSIX (`bash` ni `sh`) sur ce poste. Les blocs `run:` du '
      + 'workflow sont du shell POSIX ; les jouer dans un autre interpréteur exécuterait autre chose '
      + 'que ce qu\'annonce la CI. Installer Git for Windows (qui fournit `bash`) suffit.');
    return 2;
  }

  // Les écarts d'environnement sont DITS AVANT le rejeu : un verdict vert se lit à la lumière de ce
  // qui n'a pas été joué, pas après coup.
  for (const l of ecarts) console.log(`[non rejouable] ${l}`);
  console.log('');

  let rouges = 0;
  for (const e of toutes) {
    const r = rejouer(e, sh);
    if (!r.vert) rouges += 1;
    const env = Object.keys(e.env || {});
    console.log(`${r.vert ? '[ok  ]' : '[ROUGE]'} [${e.job}] ${e.nom}`
      + (env.length ? `  (env du YAML posé : ${env.join(', ')})` : ''));
    if (!r.vert) console.log(`      ${r.sortie.split('\n').slice(-6).join('\n      ') || `exit ${r.status}`}`);
  }
  console.log(`\nverifier : ${toutes.length - rouges}/${toutes.length} étape(s) du workflow rejouée(s) en local`
    + (rouges ? ` — ${rouges} ROUGE(S)` : ' — toutes vertes')
    + `  [CI=true posé sur chaque étape]`);

  // TF-1016 — la règle de journal : elle ne vient d'aucune étape du YAML, elle juge le DÉPÔT.
  const releve = releveJournal();
  if (!releve.disponible) {
    console.log(`[non rejouable] règle de journal : ${releve.motif} — non jugée.`);
  } else {
    const v = verdictJournal(releve);
    console.log(`${v.verdict === 'ok' ? '[ok  ]' : '[ROUGE]'} [journal] ${JOURNAL} tenu à jour — ${v.message}`);
    if (v.verdict !== 'ok') rouges += 1;
  }

  return rouges ? 1 : 0;
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url)))
  process.exit(principal(process.argv.slice(2)));
