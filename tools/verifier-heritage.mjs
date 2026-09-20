#!/usr/bin/env node
// =============================================================================
// verifier-heritage.mjs — LA DÉRIVE D'UNE COPIE CONFORME (TF-0940, décision D-4 (b) du
// 20/09/2026). `HERITAGE.json` déclare ce que ce dépôt a copié d'un dépôt frère et sur quelle
// version. Ce contrôle recalcule l'empreinte de la SOURCE et la compare à celle qui est
// enregistrée.
//
//   node tools/verifier-heritage.mjs [--self-test]
//
// TROIS ISSUES, jamais deux (invariant d'acquisition du dossier oracles/) :
//   1. source présente et empreinte ÉGALE       → OK ;
//   2. source présente et empreinte DIFFÉRENTE  → DÉRIVE, exit 1, la copie est nommée ;
//   3. source ABSENTE du poste                  → SKIP NOMMÉ, exit 0. C'est le cas de TOUT
//      runner de CI, qui ne clone qu'un dépôt. Un dépôt frère absent n'est pas un rouge
//      d'environnement : c'est une mesure qu'on n'a pas pu faire, et elle se DIT — avec le
//      chemin cherché, pour que personne ne prenne ce vert pour une comparaison réussie.
//
// LE PIÈGE DES FINS DE LIGNE (leçon du 20/09). Ce poste est sous Windows, `core.autocrlf=true`,
// sans `.gitattributes` : le même contenu vit en CRLF dans la copie de travail et en LF dans
// l'objet git. Une empreinte prise sur les octets bruts crierait à la dérive au premier passage
// du fichier par un outil Windows. La normalisation ramène donc les fins de ligne à LF AVANT de
// hacher, et l'auto-test le PROUVE dans les deux sens (même contenu en CRLF → même empreinte).
//
// Exit 0 = tout conforme ou skippé avec motif · 1 = au moins une dérive · 2 = usage/lecture.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
export const HERITAGE = path.join(RACINE, 'HERITAGE.json');

/**
 * La normalisation qui rend une empreinte comparable d'un poste à l'autre. Elle est DÉCLARÉE
 * dans HERITAGE.json à côté de chaque valeur : une empreinte dont on ignore la normalisation
 * n'est pas vérifiable, elle est seulement impressionnante.
 */
export function normaliser(texte) {
  return String(texte)
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\/\* POLICES-EMBARQUEES:DEBUT[\s\S]*?POLICES-EMBARQUEES:FIN \*\//,
      '/* POLICES-EMBARQUEES: RETIRE DE L EMPREINTE */');
}
export function empreinte(texte) {
  return crypto.createHash('sha256').update(normaliser(texte), 'utf8').digest('hex');
}

/** La racine de la forge : $FORGE_ROOT s'il est posé, sinon le parent de ce dépôt. */
export function racineForge() {
  return process.env.FORGE_ROOT || path.dirname(RACINE);
}

/** Juge UNE copie. Fonction pure sur le contenu lu : l'auto-test la joue sans aucun dépôt frère. */
export function verdictCopie(copie, contenuSource) {
  if (contenuSource == null) {
    return { etat: 'skip', message: `source absente du poste — comparaison NON FAITE (ni réussie, ni échouée)` };
  }
  const calculee = empreinte(contenuSource);
  if (calculee === copie.empreinte?.valeur) return { etat: 'ok', message: `empreinte identique (${calculee.slice(0, 12)}…)`, calculee };
  return {
    etat: 'derive', calculee,
    message: `DÉRIVE — la source a changé depuis la copie. Enregistrée ${String(copie.empreinte?.valeur).slice(0, 12)}…, `
      + `calculée ${calculee.slice(0, 12)}…. Relire la source, re-vendorer « ${copie.cible} », puis mettre à jour `
      + `HERITAGE.json (empreinte ET source_version). Ne jamais réaligner l'empreinte sans avoir relu la source : `
      + `ce serait effacer la question au lieu d'y répondre.`,
  };
}

// ── auto-test à double sens ──────────────────────────────────────────────────
function selfTest() {
  const cas = [];
  const dit = (nom, ok, detail) => { cas.push({ nom, ok, detail }); };
  const source = '/* POLICES-EMBARQUEES:DEBUT */\nAAA\n/* POLICES-EMBARQUEES:FIN */\nfunction moteur(){ return 1; }\n';
  const copie = { cible: 'fixture', empreinte: { valeur: empreinte(source) } };

  // VERT · la source inchangée ne dérive pas.
  dit('source inchangée → ok', verdictCopie(copie, source).etat === 'ok');

  // VERT · le PIÈGE CRLF : le même contenu réécrit par un outil Windows ne doit PAS dériver.
  const crlf = source.replace(/\n/g, '\r\n');
  dit('même contenu en CRLF → ok (empreinte insensible aux fins de ligne)',
    verdictCopie(copie, crlf).etat === 'ok', `crlf=${empreinte(crlf).slice(0, 12)}`);

  // VERT · le bloc de polices change, le moteur non → pas de dérive (il est hors empreinte).
  const autresPolices = source.replace('AAA', 'BBBBBBBB');
  dit('bloc de polices modifié, moteur intact → ok', verdictCopie(copie, autresPolices).etat === 'ok');

  // ROUGE · le moteur change d'un caractère → dérive.
  const modifie = source.replace('return 1', 'return 2');
  const v = verdictCopie(copie, modifie);
  dit('moteur modifié → dérive détectée', v.etat === 'derive' && /DÉRIVE/.test(v.message));

  // ROUGE · un octet de plus dans le moteur → dérive.
  dit('moteur allongé → dérive détectée', verdictCopie(copie, source + '// ajout\n').etat === 'derive');

  // SKIP · source absente → ni ok, ni dérive, et le mot « skip » est rendu.
  const s = verdictCopie(copie, null);
  dit('source absente → skip nommé, jamais un OK silencieux', s.etat === 'skip' && /NON FAITE/.test(s.message));

  // Le fichier d'héritage du dépôt est lisible et complet.
  let decl = null;
  try { decl = JSON.parse(fs.readFileSync(HERITAGE, 'utf8')); } catch (e) { /* rendu ci-dessous */ }
  dit('HERITAGE.json lisible', !!decl);
  dit('chaque copie déclare cible, source, version, normalisation et empreinte',
    !!decl && (decl.copies ?? []).length > 0 && decl.copies.every(c =>
      c.cible && c.source_depot && c.source_chemin && c.source_version
      && c.empreinte?.algo && c.empreinte?.normalisation && /^[0-9a-f]{64}$/.test(c.empreinte?.valeur ?? '')));
  dit('chaque cible déclarée existe dans le dépôt',
    !!decl && (decl.copies ?? []).every(c => fs.existsSync(path.join(RACINE, c.cible))));

  for (const c of cas) console.log(`${c.ok ? '[ok  ]' : '[ROUGE]'} ${c.nom}${c.detail ? ` — ${c.detail}` : ''}`);
  const ko = cas.filter(c => !c.ok).length;
  console.log(ko ? `\nauto-test : ${ko}/${cas.length} cas ROUGE` : `\nauto-test : ${cas.length}/${cas.length} cas verts (dont 3 à sens rouge et 1 skip)`);
  return ko ? 1 : 0;
}

// ── exécution ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) process.exit(selfTest());

let decl;
try { decl = JSON.parse(fs.readFileSync(HERITAGE, 'utf8')); }
catch (e) { console.error(`HERITAGE.json illisible : ${e.message}`); process.exit(2); }

const forge = racineForge();
let derives = 0, skips = 0, ok = 0;
for (const copie of decl.copies ?? []) {
  const src = path.join(forge, copie.source_depot, copie.source_chemin);
  const contenu = fs.existsSync(src) ? fs.readFileSync(src, 'utf8') : null;
  const v = verdictCopie(copie, contenu);
  if (v.etat === 'ok') { ok++; console.log(`[ok  ] ${copie.nom} ← ${copie.source_depot} — ${v.message}`); }
  else if (v.etat === 'skip') {
    skips++;
    console.log(`[skip] ${copie.nom} — ${v.message}. Cherchée à : ${src} (racine de forge : ${forge}`
      + `${process.env.FORGE_ROOT ? ', posée par FORGE_ROOT' : ', déduite du parent de ce dépôt'}). `
      + `Version enregistrée lors de la copie : ${copie.source_version}.`);
  } else { derives++; console.error(`[ROUGE] ${copie.nom} — ${v.message}`); }
}
console.log(`\nhéritage : ${ok} copie(s) conforme(s), ${derives} dérive(s), ${skips} non comparée(s) faute de source sur ce poste.`);
process.exit(derives ? 1 : 0);
