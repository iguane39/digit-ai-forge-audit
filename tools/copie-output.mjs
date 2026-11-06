#!/usr/bin/env node
// AuditCore — dépôt du rapport rendu dans output/ du produit, et contrôle d'un output/ en retard (TF-2261, RT-52).
//
// LE FAIT. Le 05/11/2026 à 11:47, un rapport d'audit (indice 20261104b) a été rendu sous l'espace d'audit
// (forge/audit/20261104/output/) et nulle part ailleurs : output/05-audits/ du produit a gardé 20261104a jusqu'au
// 06/11 à 10:15, relevé par le porteur. forge-tests dépose déjà sa pièce dans output/ du produit (--copie-output,
// TF-1808) ; build-rapport n'avait aucun équivalent, donc aucun geste ni aucun contrôle ne disait que le dépôt manquait.
//
// CE QUE FAIT CE MODULE, sans rien deviner :
//   · `deposerCopie` copie le rendu et ses compagnons (`.remediation-actions.yaml`, `.controles-evalues.json`, écrits
//     par build-rapport à côté du rendu) dans le dossier désigné, puis range sous `old/` de ce dossier chaque indice
//     PRÉCÉDENT de la même famille (même nom, jour+lettre plus ancien). Rien n'est écrasé : un fichier de même nom et de
//     contenu différent est REFUSÉ, avant toute écriture ; un fichier plus récent déjà déposé fait refuser le dépôt ;
//   · `verifierOutputAJour` compare le dossier du rendu (l'espace d'audit) au dossier de dépôt : pour chaque famille
//     (nom sans jour+lettre, avec son suffixe), le dernier indice de l'espace doit figurer au dépôt, ou un plus récent.
//     Un output/ en retard est REFUSÉ, et le message nomme le fichier manquant.
//
// Ce que ce module NE fait PAS, et c'est déclaré : il ne lit que le niveau du dossier (pas les sous-dossiers : `old/` et
// les rubriques de l'espace d'audit ne sont pas des rendus) ; il ne juge pas le contenu d'un rendu (verifier-rapport-html
// le fait) ; il ne connaît que le nom `<famille><AAAAMMJJ><lettre><suffixe>` de la convention de l'espace d'audit.
//
// Usage : node tools/copie-output.mjs --verifier <dossier-du-rendu> <output-du-produit>
// Exit : 0 à jour · 1 en retard · 2 usage / lecture.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Les suffixes que build-rapport écrit pour un rendu : le rendu lui-même et ses deux compagnons. */
export const SUFFIXES = ['.html', '.remediation-actions.yaml', '.controles-evalues.json'];
export const RANGEMENT = 'old';

/** Décompose `<famille><AAAAMMJJ><lettre><suffixe>` ; null si le nom ne suit pas la convention. */
export function decomposer(nom) {
  for (const suffixe of SUFFIXES) {
    if (!nom.endsWith(suffixe)) continue;
    const m = /^(.*?)(\d{8})([a-z])$/.exec(nom.slice(0, -suffixe.length));
    if (m) return { famille: m[1], jour: m[2], lettre: m[3], ref: m[2] + m[3], suffixe };
  }
  return null;
}

const memeContenu = (a, b) => Buffer.compare(fs.readFileSync(a), fs.readFileSync(b)) === 0;
const fichiersDe = (dossier) => (fs.existsSync(dossier)
  ? fs.readdirSync(dossier, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name) : []);

/**
 * Dépose `rendu` et ses compagnons dans `dossier`, range les indices précédents sous `dossier/old/`.
 * Rend { deposes, inchanges, ranges, refus }. Si `refus` n'est pas vide, RIEN n'a été écrit.
 */
export function deposerCopie({ rendu, dossier }) {
  const refus = [];
  const source = path.resolve(rendu), cible = path.resolve(dossier);
  const dirSource = path.dirname(source);
  if (dirSource.toLowerCase() === cible.toLowerCase()) return { deposes: [], inchanges: [], ranges: [], refus: [`le dossier de dépôt est celui du rendu (${cible}) : rien à copier`] };
  const radical = path.basename(source).replace(/\.html?$/i, '');
  const noms = SUFFIXES.map((s) => radical + s).filter((n) => fs.existsSync(path.join(dirSource, n)));
  if (!noms.includes(radical + '.html')) return { deposes: [], inchanges: [], ranges: [], refus: [`rendu introuvable : ${source}`] };

  const aDeposer = [], inchanges = [];
  for (const n of noms) {
    const dest = path.join(cible, n);
    if (!fs.existsSync(dest)) aDeposer.push(n);
    else if (memeContenu(path.join(dirSource, n), dest)) inchanges.push(n);
    else refus.push(`« ${n} » existe déjà dans ${cible} avec un contenu différent : jamais écrasé (le ranger sous ${RANGEMENT}/ à la main, ou rendre un nouvel indice)`);
  }

  // l'indice précédent : même famille et même suffixe, jour+lettre plus ancien ; un plus récent déjà déposé fait refuser
  const courant = decomposer(radical + '.html');
  const ranges = [];
  if (courant) {
    for (const n of fichiersDe(cible)) {
      const d = decomposer(n);
      if (!d || d.famille !== courant.famille || !SUFFIXES.includes(d.suffixe)) continue;
      if (d.ref > courant.ref) refus.push(`« ${n} » est plus récent que le rendu (${courant.ref}) : le dépôt serait en retard sur ${cible}`);
      else if (d.ref < courant.ref) {
        const rang = path.join(cible, RANGEMENT, n);
        if (fs.existsSync(rang) && !memeContenu(path.join(cible, n), rang)) refus.push(`« ${n} » existe déjà sous ${RANGEMENT}/ avec un contenu différent : jamais écrasé`);
        else ranges.push(n);
      }
    }
  }
  if (refus.length) return { deposes: [], inchanges, ranges: [], refus };

  fs.mkdirSync(cible, { recursive: true });
  if (ranges.length) fs.mkdirSync(path.join(cible, RANGEMENT), { recursive: true });
  for (const n of ranges) {
    const de = path.join(cible, n), vers = path.join(cible, RANGEMENT, n);
    if (fs.existsSync(vers)) fs.rmSync(de); else fs.renameSync(de, vers);
  }
  for (const n of aDeposer) fs.copyFileSync(path.join(dirSource, n), path.join(cible, n));
  return { deposes: aDeposer, inchanges, ranges, refus: [] };
}

/**
 * Un output/ en retard sur l'espace d'audit. Rend { erreurs, familles } : `familles` compte les familles comparées.
 */
export function verifierOutputAJour({ espace, output }) {
  const erreurs = [];
  const derniers = new Map();   // famille+suffixe → { ref, nom }
  for (const n of fichiersDe(espace)) {
    const d = decomposer(n);
    if (!d) continue;
    const cle = d.famille + '|' + d.suffixe;
    if (!derniers.has(cle) || derniers.get(cle).ref < d.ref) derniers.set(cle, { ref: d.ref, nom: n, famille: d.famille, suffixe: d.suffixe });
  }
  const deposes = new Map();
  for (const n of fichiersDe(output)) {
    const d = decomposer(n);
    if (!d) continue;
    const cle = d.famille + '|' + d.suffixe;
    if (!deposes.has(cle) || deposes.get(cle).ref < d.ref) deposes.set(cle, { ref: d.ref, nom: n });
  }
  for (const [cle, s] of derniers) {
    const o = deposes.get(cle);
    if (!o) erreurs.push(`« ${s.nom} » (espace d'audit) n'a aucun équivalent dans ${output} : output/ est en retard`);
    else if (o.ref < s.ref) erreurs.push(`« ${s.nom} » (espace d'audit) est plus récent que « ${o.nom} » déposé dans ${output} : output/ est en retard`);
  }
  return { erreurs, familles: derniers.size };
}

function principal(argv) {
  const USAGE = 'Usage: node tools/copie-output.mjs --verifier <dossier-du-rendu> <output-du-produit>';
  if (argv[0] !== '--verifier' || !argv[1] || !argv[2] || argv[1].startsWith('-') || argv[2].startsWith('-')) { console.error(USAGE); return 2; }
  for (const d of [argv[1], argv[2]]) if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) { console.error(`Dossier introuvable : ${d}`); return 2; }
  const r = verifierOutputAJour({ espace: argv[1], output: argv[2] });
  if (!r.familles) { console.error(`Aucun rendu de la convention <famille><AAAAMMJJ><lettre>.html dans ${argv[1]} : rien à comparer.`); return 2; }
  if (r.erreurs.length) {
    for (const e of r.erreurs) console.error(`ERREUR ${e}`);
    console.error(`\n✖ output/ en retard sur l'espace d'audit (${r.erreurs.length} écart(s) sur ${r.familles} famille(s)) — le déposer : node tools/build-rapport.mjs … --out <rendu> --copie-output ${argv[2]}`);
    return 1;
  }
  console.log(`✔ output/ à jour : ${r.familles} famille(s) de l'espace d'audit déposée(s) à leur dernier indice dans ${argv[2]}`);
  return 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) process.exit(principal(process.argv.slice(2)));
