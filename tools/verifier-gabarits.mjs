#!/usr/bin/env node
/**
 * verifier-gabarits.mjs — la version d'un gabarit monte quand son contenu change (TF-1820).
 *
 * Le fait : TF-1752 a fait rendre aux 14 gabarits de livrables leur couple « Gabarit : gd-… ·
 * version du gabarit x.y.z », que les produits reportent dans leurs lots de retours (R-46). Rien
 * ne jouait la règle « incrémenter à chaque changement » : le couple pouvait mentir.
 *
 * Le contrôle : `deliverables/templates/gabarits-versions.json` associe à chaque gabarit son
 * identifiant, sa version et l'EMPREINTE (sha256) de son contenu hors ligne de version. Contenu
 * changé + version inchangée = FAIL nommant le gabarit. Toute autre divergence avec la référence
 * = FAIL aussi (référence à mettre à jour). La mise à jour est une commande explicite :
 *   node tools/verifier-gabarits.mjs --maj
 * qui REFUSE d'enregistrer un contenu changé dont la version n'est pas strictement supérieure.
 *
 * Usage : node tools/verifier-gabarits.mjs [--maj] · Exit : 0 vert · 1 rouge.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TPL_DIR = path.join(ROOT, 'deliverables', 'templates');
export const REF_FILE = 'gabarits-versions.json';
// Mêmes périmètre et exclusion déclarée que identite-gabarit.test.mjs : prompts et skill de
// conformité sont des consignes d'agent, pas des documents remis.
const HORS_LIVRABLES = /^(prompt-|compliance-skill\.)/;
const LIGNE_VERSION = /^.*gabarit\s*:\s*gd-[a-z0-9-]+.*version[_ ]du[_ ]gabarit.*$/gim;
const ID = /gabarit\s*:\s*(gd-[a-z0-9-]+)/i;
const VER = /version[_ ]du[_ ]gabarit\s*:?\s*(\d+\.\d+\.\d+)/i;

export const cmpSemver = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

/** Couple + empreinte du contenu, ligne de version exclue (fins de ligne normalisées). */
export function lire(fichier) {
  const brut = fs.readFileSync(fichier, 'utf8').replace(/\r\n/g, '\n');
  const id = ID.exec(brut)?.[1], version = VER.exec(brut)?.[1];
  const corps = brut.replace(LIGNE_VERSION, '');
  return { id, version, empreinte: createHash('sha256').update(corps).digest('hex') };
}

export function gabarits(tplDir = TPL_DIR) {
  return fs.readdirSync(tplDir)
    .filter((f) => /\.template(\.en)?\.md$/.test(f) && !HORS_LIVRABLES.test(f)).sort();
}

/** Liste des écarts (texte), vide si tout est cohérent. */
export function controler(tplDir = TPL_DIR) {
  const refPath = path.join(tplDir, REF_FILE);
  if (!fs.existsSync(refPath)) return [`${REF_FILE} absent : node tools/verifier-gabarits.mjs --maj`];
  const ref = JSON.parse(fs.readFileSync(refPath, 'utf8'));
  const ecarts = [];
  const fichiers = gabarits(tplDir);
  for (const f of fichiers) {
    const cur = lire(path.join(tplDir, f)), r = ref[f];
    if (!cur.id || !cur.version) { ecarts.push(`${f} : couple gabarit + version illisible`); continue; }
    if (!r) { ecarts.push(`${f} : absent de ${REF_FILE} (nouveau gabarit) — lancer --maj`); continue; }
    const contenuChange = cur.empreinte !== r.empreinte;
    if (cur.id !== r.id) ecarts.push(`${f} : identifiant ${r.id} -> ${cur.id}, référence à mettre à jour (--maj)`);
    else if (contenuChange && cur.version === r.version)
      ecarts.push(`${f} : contenu modifié sans montée de version (reste ${r.version}) — incrémenter la version, puis --maj`);
    else if (cur.version !== r.version && cmpSemver(cur.version, r.version) < 0)
      ecarts.push(`${f} : version ${r.version} -> ${cur.version} est une BAISSE`);
    else if (cur.version !== r.version || contenuChange)
      ecarts.push(`${f} : version ${r.version} -> ${cur.version}, référence non mise à jour — lancer --maj`);
  }
  for (const f of Object.keys(ref)) {
    if (!fichiers.includes(f)) ecarts.push(`${f} : dans ${REF_FILE} mais plus dans les gabarits — lancer --maj`);
  }
  return ecarts;
}

/** Réécrit la référence ; refuse un contenu changé dont la version ne monte pas. */
export function majReference(tplDir = TPL_DIR) {
  const refPath = path.join(tplDir, REF_FILE);
  const ancien = fs.existsSync(refPath) ? JSON.parse(fs.readFileSync(refPath, 'utf8')) : {};
  const nouveau = {}, refus = [];
  for (const f of gabarits(tplDir)) {
    const cur = lire(path.join(tplDir, f)), r = ancien[f];
    if (r && cur.empreinte !== r.empreinte && cmpSemver(cur.version, r.version) <= 0)
      refus.push(`${f} : contenu modifié, version ${cur.version} non supérieure à ${r.version}`);
    nouveau[f] = { id: cur.id, version: cur.version, empreinte: cur.empreinte };
  }
  if (refus.length) return { refus };
  fs.writeFileSync(refPath, JSON.stringify(nouveau, null, 2) + '\n', 'utf8');
  return { refus: [], n: Object.keys(nouveau).length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--maj')) {
    const r = majReference();
    if (r.refus.length) { console.error('REFUS de mise à jour :\n  ' + r.refus.join('\n  ')); process.exit(1); }
    console.log(`${REF_FILE} mis à jour (${r.n} gabarits).`); process.exit(0);
  }
  const e = controler();
  if (e.length) { console.error('FAIL version-gabarit :\n  ' + e.join('\n  ')); process.exit(1); }
  console.log(`PASS version-gabarit : ${gabarits().length} gabarits, versions cohérentes avec leur contenu.`);
}
