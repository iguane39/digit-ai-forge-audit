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
 * CE QU'IL NE FAIT PAS : deviner un shell. Les blocs `run:` d'un workflow GitHub sont du shell
 * POSIX (boucles `for`, `if`, `&&`). Sur un poste sans shell POSIX, l'outil s'arrête en le DISANT
 * plutôt que d'exécuter la moitié des étapes dans un interpréteur qui n'est pas le leur — un
 * contrôle qui joue autre chose que ce qu'il annonce est pire qu'un contrôle absent.
 *
 * Usage : node tools/verifier.mjs [--liste] [--job <nom>]
 * Exit : 0 = toutes les étapes vertes · 1 = au moins une rouge · 2 = aucun shell POSIX (SKIP dit).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ICI = join(import.meta.dirname, '..');
const WORKFLOWS = join(ICI, '.github', 'workflows');
const args = process.argv.slice(2);
const listeSeule = args.includes('--liste');
// `indexOf` rend -1 quand le drapeau est absent, et `args[-1 + 1]` vaut alors args[0] : le premier
// drapeau passe devenait un nom de job, et TOUTES les etapes etaient filtrees. Le symptome etait
// « 0 etape(s) lues » sur un workflow qui en porte onze — un outil qui se TAIT au lieu d echouer.
// Trouve en le jouant, pas en le relisant.
const iJob = args.indexOf('--job');
const jobVoulu = iJob >= 0 ? (args[iJob + 1] || '').trim() : '';

/** Une étape qui n'est pas un CONTRÔLE : installer des dépendances ne prouve rien. */
const PAS_UN_CONTROLE = /^(npm|yarn|pnpm)\s+(ci|install)\b/;

/** Les blocs `run:` du workflow, avec leur job et leur nom d'étape — pour que l'échec soit lisible. */
function etapes(brut) {
  const lignes = brut.split(/\r?\n/);
  const out = [];
  let job = '(sans job)';
  let nom = '(sans nom)';
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    const mJob = /^  ([a-z0-9_-]+):\s*$/i.exec(l);
    if (mJob) { job = mJob[1]; continue; }
    const mNom = /^\s*-?\s*name:\s*(.+)$/.exec(l);
    if (mNom) { nom = mNom[1].trim(); continue; }
    const enLigne = /^\s*-?\s*run:\s*(\S.*)$/.exec(l);
    if (enLigne && !/^[|>]/.test(enLigne[1].trim())) {
      out.push({ job, nom, script: enLigne[1].trim() });
      continue;
    }
    if (/^\s*-?\s*run:\s*[|>]/.test(l)) {
      const indent = (l.match(/^\s*/) || [''])[0].length;
      const corps = [];
      for (let k = i + 1; k < lignes.length; k++) {
        if (!lignes[k].trim()) { corps.push(''); continue; }
        if ((lignes[k].match(/^\s*/) || [''])[0].length <= indent) break;
        corps.push(lignes[k].trim());
        i = k;
      }
      out.push({ job, nom, script: corps.join('\n') });
    }
  }
  // Une étape entièrement faite d'installation ne se rejoue pas : elle ne prouve rien.
  return out.filter((e) => !e.script.split('\n').every((c) => !c.trim() || PAS_UN_CONTROLE.test(c.trim())));
}

function shellPosix() {
  for (const candidat of ['bash', 'sh']) {
    const r = spawnSync(candidat, ['-c', 'echo ok'], { encoding: 'utf8' });
    if (r.status === 0 && /ok/.test(r.stdout || '')) return candidat;
  }
  return null;
}

if (!existsSync(WORKFLOWS)) {
  console.log('verifier : aucun `.github/workflows/` — rien à rejouer');
  process.exit(0);
}

const toutes = [];
for (const f of readdirSync(WORKFLOWS).filter((x) => /\.ya?ml$/i.test(x))) {
  for (const e of etapes(readFileSync(join(WORKFLOWS, f), 'utf8'))) {
    if (jobVoulu && e.job !== jobVoulu) continue;
    toutes.push({ ...e, fichier: f });
  }
}

if (listeSeule) {
  for (const e of toutes) console.log(`[${e.job}] ${e.nom}\n    ${e.script.split('\n').join('\n    ')}`);
  console.log(`\n${toutes.length} étape(s) de contrôle lues dans le workflow`);
  process.exit(0);
}

const sh = shellPosix();
if (!sh) {
  console.log('verifier : SKIP — aucun shell POSIX (`bash` ni `sh`) sur ce poste. Les blocs `run:` du '
    + 'workflow sont du shell POSIX ; les jouer dans un autre interpréteur exécuterait autre chose '
    + 'que ce qu\'annonce la CI. Installer Git for Windows (qui fournit `bash`) suffit.');
  process.exit(2);
}

let rouges = 0;
for (const e of toutes) {
  const r = spawnSync(sh, ['-c', e.script], { cwd: ICI, encoding: 'utf8' });
  const vert = r.status === 0;
  if (!vert) rouges += 1;
  console.log(`${vert ? '[ok  ]' : '[ROUGE]'} [${e.job}] ${e.nom}`);
  if (!vert) {
    const sortie = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-6).join('\n      ');
    console.log(`      ${sortie || `exit ${r.status}`}`);
  }
}
console.log(`\nverifier : ${toutes.length - rouges}/${toutes.length} étape(s) du workflow rejouée(s) en local`
  + (rouges ? ` — ${rouges} ROUGE(S)` : ' — toutes vertes'));
process.exit(rouges ? 1 : 0);
