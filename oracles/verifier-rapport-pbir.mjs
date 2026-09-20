#!/usr/bin/env node
// =============================================================================
// verifier-rapport-pbir.mjs — Contrôle d'audit 9 : LA FORME NATIVE DES EXPRESSIONS D'UN
// RAPPORT POWER BI en format texte (PBIR, dossier `*.Report/definition/`).
//
// Le fait, le 17/09/2026 (TF-1175, retour Produit-62 RF-21) : un projet Power BI généré passe
// 22 contrôles de recette et 7 contrôles d'audit, est publié sur GO humain — et ne rend AUCUN
// visuel. La référence de source de chaque requête visuelle portait la forme d'une ENTRÉE DE
// `From` (`SourceRef: { Entity, Name }`) là où une référence de source s'écrit `{ Source: alias }`
// et se résout dans le `From` de la même requête. Le service ACCEPTE le fichier, le rapport reste
// en « Chargement… », l'export PDF sort 943 octets et 0 caractère après 560 s. 29 contrôles PASS
// sur un livrable invisible : aucun ne jugeait la FORME du fichier de rapport. C'est ce trou-là
// que cet oracle ferme — `verifier-modele-semantique.mjs` lit le MODÈLE (TMDL) et laisse
// explicitement le rapport de côté ; celui-ci lit le RAPPORT (PBIR).
//
//   node verifier-rapport-pbir.mjs --rapport <dossier *.Report/ ou definition/> [--out rapport.json]
//
// Règles (chacune nomme le contrôle AuditCore qu'elle mécanise) :
//   PB1  toute référence de source est RÉSOLUBLE (CTL-D08-01 : validation de forme de l'artefact
//        versionné avant fusion) — deux sens :
//        PB1a un `SourceRef: { Source: alias }` dont l'alias n'est déclaré par AUCUN `From` en
//             portée est BLOQUANT : la requête ne se résout pas ;
//        PB1b un `SourceRef` portant À LA FOIS `Entity` ET `Name` est BLOQUANT — c'est la forme
//             d'une entrée de `From` recopiée à la place d'une référence de source, exactement le
//             défaut du 17/09. Un `SourceRef: { Entity }` SEUL reste licite (référence directe
//             d'entité, forme émise par Power BI Desktop) : la règle ne le touche pas.
//   PB2  les alias d'un `From` sont UNIQUES dans la même requête (CTL-D08-01) — un alias redéfini
//        rend le `Source` qui le cite ambigu, et c'est le moteur qui tranche, pas l'auteur ;
//   PB3  aucune projection `active: false` (CTL-D05-10) — un champ déclaré dans la requête et
//        désactivé ne parvient JAMAIS au lecteur : le rapport montre moins que ce que le modèle
//        expose, sans que rien ne le dise ;
//   PB4  chaque colonne d'un visuel tabulaire porte son EN-TÊTE dans `columnProperties`
//        (CTL-D11-01) — sans en-tête déclaré, le lecteur (et le lecteur d'écran) reçoit le nom
//        technique du champ. MAJEUR : le visuel rend, mal.
//
// Ce que ce contrôle ne juge PAS (déclaré, jamais tu) : LE RENDU. Une forme valide ne prouve pas
// qu'un lecteur voit quelque chose — c'est le « Succeeded » d'export cru sans téléchargement qui a
// coûté deux jours le 17/09. Il ne juge pas non plus la justesse métier des expressions, la
// cohérence des champs cités avec le modèle sémantique (l'oracle TMDL est à côté), la mise en page,
// ni l'accessibilité réelle du rapport publié (D11, revue outillée dans Power BI Desktop).
//
// Exit 0 = aucun constat bloquant ni majeur · 1 = au moins un constat bloquant ou majeur · 2 = usage.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const rapportArg = opt('--rapport');
const outArg = opt('--out');
if (!rapportArg) { console.error('usage: node verifier-rapport-pbir.mjs --rapport <dossier *.Report/ ou definition/> [--out rapport.json]'); process.exit(2); }
if (!fs.existsSync(rapportArg) || !fs.statSync(rapportArg).isDirectory()) { console.error(`dossier introuvable : ${rapportArg}`); process.exit(2); }

// Le geste que ce contrôle NE remplace PAS. Recopié de verifier-modele-semantique.mjs à dessein :
// une forme valide et un modèle irréprochable ne disent toujours rien de ce que le lecteur voit.
const GESTE_RENDU = 'publier le rapport, lancer un export PDF par l\'API du service (ExportTo), '
  + 'TÉLÉCHARGER le fichier produit et le rendre en image, puis juger sur la durée, le poids en '
  + 'octets, le texte extrait non vide page par page, et l\'absence des libellés d\'erreur du '
  + 'service — un « Succeeded » d\'export ne prouve rien.';

const NON_JUGE = [
  `LE RENDU DU RAPPORT DANS L'OUTIL — ce contrôle juge la FORME des expressions PBIR dans des `
  + `fichiers. Une forme valide ne prouve PAS qu'un lecteur voit quelque chose. Geste de `
  + `vérification manquant, à exécuter avant toute remise : ${GESTE_RENDU}`,
  'la cohérence des champs cités avec le modèle sémantique (tables, colonnes, mesures) — elle se juge '
  + 'sur les fichiers TMDL, par oracles/verifier-modele-semantique.mjs',
  'la justesse métier des expressions (filtres, agrégations, tris) et la performance des requêtes',
  "la mise en page, le thème et l'accessibilité RÉELLE du rapport publié (D11) — revue outillée",
];

// ── lecture de la définition PBIR ─────────────────────────────────────────────
/** Le dossier `definition/` du rapport, qu'on ait reçu le `*.Report/` ou le `definition/` lui-même. */
function racineDefinition(dossier) {
  const d = path.resolve(dossier);
  if (/^definition$/i.test(path.basename(d))) return d;
  const sous = path.join(d, 'definition');
  return fs.existsSync(sous) && fs.statSync(sous).isDirectory() ? sous : d;
}
function fichiersJson(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...fichiersJson(p));
    else if (e.isFile() && /\.json$/i.test(e.name)) out.push(p);
  }
  return out;
}

const RACINE = racineDefinition(rapportArg);
const findings = [];
const add = (sev, regle, controle, msg, where) => findings.push({ sev, regle, controle, msg, where });
const rel = (f) => path.relative(RACINE, f).replace(/\\/g, '/') || path.basename(f);

/** Les projections d'un sous-arbre, avec leur `queryRef` et leur drapeau `active`. */
function projectionsDe(noeud, acc = []) {
  if (!noeud || typeof noeud !== 'object') return acc;
  if (Array.isArray(noeud)) { for (const v of noeud) projectionsDe(v, acc); return acc; }
  if (Array.isArray(noeud.projections)) for (const p of noeud.projections) if (p && typeof p === 'object') acc.push(p);
  for (const v of Object.values(noeud)) projectionsDe(v, acc);
  return acc;
}

const TABULAIRES = /^(table|tableEx|pivotTable|matrix)$/i;

/**
 * Parcours d'un document PBIR. `alias` est l'ensemble des alias déclarés par le `From` le plus
 * proche EN AMONT : un `From` ouvre une portée pour son sous-arbre, c'est là que se résolvent les
 * `Source` qui le citent.
 */
function parcourir(noeud, ou, alias, fichier) {
  if (!noeud || typeof noeud !== 'object') return;
  if (Array.isArray(noeud)) { noeud.forEach((v, i) => parcourir(v, `${ou}[${i}]`, alias, fichier)); return; }

  let portee = alias;
  // PB2 — un `From` ouvre une portée d'alias ; deux entrées du même nom la rendent ambiguë.
  if (Array.isArray(noeud.From)) {
    portee = new Set();
    const vus = new Set();
    noeud.From.forEach((e, i) => {
      const nom = e && typeof e === 'object' ? e.Name : null;
      if (typeof nom !== 'string' || !nom) {
        add('bloquant', 'PB2', 'CTL-D08-01', `entrée ${i} du From sans alias « Name » — aucun Source ne peut s'y résoudre`, `${rel(fichier)} @ ${ou}.From[${i}]`);
        return;
      }
      if (vus.has(nom)) add('bloquant', 'PB2', 'CTL-D08-01', `alias « ${nom} » déclaré deux fois dans le même From — un Source qui le cite est ambigu, et c'est le moteur qui tranche`, `${rel(fichier)} @ ${ou}.From[${i}]`);
      vus.add(nom);
      portee.add(nom);
    });
  }

  // PB1 — la référence de source doit être résoluble.
  if (noeud.SourceRef && typeof noeud.SourceRef === 'object' && !Array.isArray(noeud.SourceRef)) {
    const sr = noeud.SourceRef;
    const ouSr = `${rel(fichier)} @ ${ou}.SourceRef`;
    if (Object.prototype.hasOwnProperty.call(sr, 'Entity') && Object.prototype.hasOwnProperty.call(sr, 'Name')) {
      add('bloquant', 'PB1', 'CTL-D08-01',
        `SourceRef { Entity: "${sr.Entity}", Name: "${sr.Name}" } — c'est la forme d'une ENTRÉE DE From recopiée à la place d'une référence de source. `
        + `Attendu : un From déclarant { Name: "${sr.Name}", Entity: "${sr.Entity}" } et, ici, { Source: "${sr.Name}" }. `
        + `C'est le défaut du 17/09/2026 : le service accepte le fichier et le rapport ne rend rien`, ouSr);
    } else if (Object.prototype.hasOwnProperty.call(sr, 'Source')) {
      if (typeof sr.Source !== 'string' || !sr.Source) add('bloquant', 'PB1', 'CTL-D08-01', 'SourceRef.Source vide ou non textuel', ouSr);
      else if (!portee.has(sr.Source)) add('bloquant', 'PB1', 'CTL-D08-01',
        `SourceRef.Source « ${sr.Source} » ne correspond à aucun alias du From en portée (${portee.size ? [...portee].map(a => `« ${a} »`).join(', ') : 'aucun From déclaré'}) — la requête ne se résout pas`, ouSr);
    } else if (!Object.prototype.hasOwnProperty.call(sr, 'Entity')) {
      add('bloquant', 'PB1', 'CTL-D08-01', `SourceRef sans « Source » ni « Entity » — référence de source vide`, ouSr);
    }
  }

  // PB3 — une projection désactivée ne parvient jamais au lecteur.
  if (Array.isArray(noeud.projections)) {
    noeud.projections.forEach((p, i) => {
      if (p && typeof p === 'object' && p.active === false)
        add('bloquant', 'PB3', 'CTL-D05-10',
          `projection « ${p.queryRef || p.nativeQueryRef || `#${i}`} » portant active: false — le champ est déclaré dans la requête et n'est JAMAIS rendu : le rapport montre moins que ce que le modèle expose`,
          `${rel(fichier)} @ ${ou}.projections[${i}]`);
    });
  }

  // PB4 — l'en-tête d'une colonne de visuel tabulaire se déclare, il ne se devine pas.
  if (typeof noeud.visualType === 'string' && TABULAIRES.test(noeud.visualType)) {
    const props = (noeud.columnProperties && typeof noeud.columnProperties === 'object' ? noeud.columnProperties : null)
      || (noeud.objects && noeud.objects.columnProperties && typeof noeud.objects.columnProperties === 'object' ? noeud.objects.columnProperties : null)
      || {};
    for (const p of projectionsDe(noeud.query || noeud)) {
      const ref = p.queryRef;
      if (typeof ref !== 'string' || !ref) continue;
      const entree = props[ref];
      const libelle = entree && typeof entree === 'object' ? (entree.displayName ?? entree.displayname) : undefined;
      if (typeof libelle !== 'string' || !libelle.trim())
        add('majeur', 'PB4', 'CTL-D11-01',
          `visuel « ${noeud.visualType} » : la colonne « ${ref} » n'a pas d'en-tête déclaré dans columnProperties — le lecteur, et le lecteur d'écran, reçoivent le nom technique du champ`,
          `${rel(fichier)} @ ${ou}.columnProperties`);
    }
  }

  for (const [k, v] of Object.entries(noeud)) parcourir(v, `${ou}.${k}`, portee, fichier);
}

// ── exécution ─────────────────────────────────────────────────────────────────
const fichiers = fichiersJson(RACINE);
let lus = 0;
for (const f of fichiers) {
  let doc;
  try { doc = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) {
    add('bloquant', 'PB0', 'CTL-D08-01', `définition illisible (JSON invalide) : ${e.message}`, rel(f));
    continue;
  }
  lus++;
  parcourir(doc, '$', new Set(), f);
}
// Jamais un OK par défaut : un dossier sans définition n'est pas un rapport conforme, c'est un
// rapport qu'on n'a pas lu. C'est la loi commune du dossier oracles/.
if (!lus) add('bloquant', 'PB0', 'CTL-D08-01', `aucune définition de rapport (.json) lue sous ${RACINE} — il n'y a rien à juger, et ce n'est pas un PASS`, RACINE);

const durs = findings.filter(f => f.sev === 'bloquant' || f.sev === 'majeur');
const verdict = durs.length ? (findings.some(f => f.sev === 'bloquant') ? 'BLOQUANT' : 'MAJEUR') : 'OK';
const rapport = {
  schema: 'auditcore.rapport-pbir/v1', oracle: 'verifier-rapport-pbir', rapport: rapportArg, definition: RACINE,
  lu: { fichiers: lus },
  verdict, findings, non_juge: NON_JUGE,
};
const txt = JSON.stringify(rapport, null, 2);
if (outArg) fs.writeFileSync(outArg, txt + '\n');
console.log(txt);
console.log(durs.length
  ? `\nverdict : ${verdict} — ${durs.length} constat(s) bloquant(s) ou majeur(s)`
  : `\nverdict : OK — Aucun constat bloquant ni majeur (PB1-PB4) SUR LA FORME DES EXPRESSIONS`);
console.log(`non jugé : LE RENDU DU RAPPORT DANS L'OUTIL. ${verdict === 'OK' ? 'Ce OK' : 'Ce verdict'} porte sur la FORME `
  + `des expressions PBIR et ne vaut PAS « livrable vérifié ».\ngeste manquant : ${GESTE_RENDU}`);
process.exit(durs.length ? 1 : 0);
