#!/usr/bin/env node
// =============================================================================
// verifier-modele-semantique.mjs — Contrôle d'audit 8 : MODÈLE SÉMANTIQUE POWER BI jugé sur
// ses FICHIERS (projet PBIP, définition TMDL), sans point de terminaison XMLA.
//
// Le profil `profiles/powerbi` instancie CTL-D16-01/02, CTL-D05-04, CTL-D01-03 et CTL-D05-10/13/14
// « en priorité sur l'introspection … via les DMV exposées par le point de terminaison XMLA » et
// bascule « en revue outillée » sinon. Depuis que TMDL est le format texte par défaut d'un projet
// Power BI (disponibilité générale 2025-09), le modèle EST un dossier de fichiers : ce contrôle le
// lit et rend un verdict à chaque commit, sans capacité Premium ni Fabric (donnée du projet, jamais
// un achat de forge). Niveau : barre « TabularEditor/BestPracticeRules » (registre la-barre du
// pilot, validée humain le 07/09/2026) — TF-0862, lot L5 de l'étude d'opportunité du 07/09/2026.
//
//   node verifier-modele-semantique.mjs --modele <dossier definition/ ou .SemanticModel/> [--out rapport.json]
//
// Règles (chacune nomme le contrôle AuditCore qu'elle mécanise) :
//   MS1  au moins une table et au moins une relation lues (CTL-D16-01 : le modèle en étoile existe
//        dans les fichiers, pas seulement dans la vue Modèle) ;
//   MS2  toute mesure est définie UNE fois dans le modèle (CTL-D05-02 / CTL-D05-10) ; une mesure
//        sans formatString est un constat MAJEUR (règle BPA « les mesures ont un format ») ;
//   MS3  chaque relation référence des colonnes existantes ; deux relations ACTIVES entre la même
//        paire de tables sont AMBIGUËS (bloquant, CTL-D16-02) ; un filtrage bidirectionnel est
//        MAJEUR (règle BPA « éviter les relations bidirectionnelles ») ;
//   MS4  exactement une table de dates (`dataCategory: Time`) portant une colonne `isKey`
//        (CTL-D05-04 / CTL-D05-13) ;
//   MS5  chaque partition déclare son mode de stockage ; des modes hétérogènes sans justification
//        sont MAJEURS (CTL-D01-03 / CTL-D05-14 : mode choisi par profil de besoin déclaré) ;
//   MS6  au moins un rôle de sécurité (`role`) est défini — sinon MAJEUR (sécurité au niveau
//        ligne absente : à justifier dans le dossier de mise en production).
//
// Ce que ce contrôle ne juge PAS (déclaré, jamais tu) : le statut de certification et le
// propriétaire dans le portail (CTL-D05-01/15 : métadonnées de service, hors fichiers) ; la
// justesse des expressions DAX ; la performance ; l'accessibilité des rapports (D11) ; la
// contiguïté RÉELLE des dates (elle se mesure sur la donnée, pas sur la définition).
//
// Exit 0 = aucun constat bloquant ni majeur · 1 = au moins un constat bloquant ou majeur · 2 = usage.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const modeleArg = opt('--modele');
const outArg = opt('--out');
if (!modeleArg) { console.error('usage: node verifier-modele-semantique.mjs --modele <dossier definition/> [--out rapport.json]'); process.exit(2); }
if (!fs.existsSync(modeleArg) || !fs.statSync(modeleArg).isDirectory()) { console.error(`dossier introuvable : ${modeleArg}`); process.exit(2); }

const NON_JUGE = [
  'statut de certification et propriétaire du modèle (CTL-D05-01 / CTL-D05-15) : métadonnées du portail, hors fichiers',
  'justesse des expressions DAX — seule leur unicité et leur format sont jugés',
  'performance du modèle et contiguïté RÉELLE de la table de dates (mesure sur la donnée, pas sur la définition)',
  "accessibilité des rapports (D11) — hors du modèle sémantique",
];

// ── lecture des fichiers TMDL ────────────────────────────────────────────────
function fichiersTmdl(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...fichiersTmdl(p));
    else if (e.isFile() && /\.tmdl$/i.test(e.name)) out.push(p);
  }
  return out;
}
const niveau = (l) => { const m = l.match(/^(\t*| *)/)[0]; return m.includes('\t') ? m.length : Math.floor(m.length / 4); };
const nomDe = (s) => String(s || '').trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1');

const tables = new Map();      // nom → { colonnes:Set, mesures:[{nom, formatString, fichier}], partitions:[{nom, mode}], dataCategory, fichier }
const relations = [];          // { id, from, to, active, bidir, fichier }
const roles = [];
for (const f of fichiersTmdl(modeleArg)) {
  const lignes = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  let bloc = null;   // { type, nom }
  let sousBloc = null; // { type, ref }
  for (let i = 0; i < lignes.length; i++) {
    const brut = lignes[i];
    if (!brut.trim() || /^\s*\/\//.test(brut)) continue;
    const lvl = niveau(brut);
    const l = brut.trim();
    if (lvl === 0) {
      sousBloc = null;
      let m;
      if ((m = l.match(/^table\s+(.+)$/))) { bloc = { type: 'table', nom: nomDe(m[1]) }; if (!tables.has(bloc.nom)) tables.set(bloc.nom, { colonnes: new Set(), mesures: [], partitions: [], dataCategory: null, fichier: f }); }
      else if ((m = l.match(/^relationship\s+(.+)$/))) { bloc = { type: 'relationship', nom: nomDe(m[1]) }; relations.push({ id: bloc.nom, from: null, to: null, active: true, bidir: false, fichier: f, ligne: i + 1 }); }
      else if ((m = l.match(/^role\s+(.+)$/))) { bloc = { type: 'role', nom: nomDe(m[1]) }; roles.push({ nom: bloc.nom, fichier: f }); }
      else bloc = { type: 'autre', nom: l };
      continue;
    }
    if (!bloc) continue;
    if (bloc.type === 'table') {
      const t = tables.get(bloc.nom);
      let m;
      if (lvl === 1) {
        if ((m = l.match(/^measure\s+('[^']+'|"[^"]+"|\S+)\s*=/))) { sousBloc = { type: 'measure', ref: { nom: nomDe(m[1]), formatString: null, fichier: f, ligne: i + 1 } }; t.mesures.push(sousBloc.ref); }
        else if ((m = l.match(/^column\s+('[^']+'|"[^"]+"|\S+)/))) { sousBloc = { type: 'column', ref: { nom: nomDe(m[1]), isKey: false } }; t.colonnes.add(sousBloc.ref.nom); t.colonnesMeta = t.colonnesMeta || []; t.colonnesMeta.push(sousBloc.ref); }
        else if ((m = l.match(/^partition\s+('[^']+'|"[^"]+"|\S+)/))) { sousBloc = { type: 'partition', ref: { nom: nomDe(m[1]), mode: null, fichier: f, ligne: i + 1 } }; t.partitions.push(sousBloc.ref); }
        else if ((m = l.match(/^dataCategory\s*:\s*(\S+)/))) { t.dataCategory = m[1]; sousBloc = null; }
        else sousBloc = null;
      } else if (lvl >= 2 && sousBloc) {
        let m;
        if (sousBloc.type === 'measure' && (m = l.match(/^formatString\s*:\s*(.+)$/))) sousBloc.ref.formatString = m[1].trim();
        if (sousBloc.type === 'column' && /^isKey\b/.test(l)) sousBloc.ref.isKey = true;
        if (sousBloc.type === 'partition' && (m = l.match(/^mode\s*:\s*(\S+)/))) sousBloc.ref.mode = m[1].toLowerCase();
      }
    } else if (bloc.type === 'relationship') {
      const r = relations[relations.length - 1];
      let m;
      if ((m = l.match(/^fromColumn\s*:\s*(.+)$/))) r.from = m[1].trim();
      else if ((m = l.match(/^toColumn\s*:\s*(.+)$/))) r.to = m[1].trim();
      else if ((m = l.match(/^isActive\s*:\s*(\S+)/))) r.active = m[1].toLowerCase() !== 'false';
      else if ((m = l.match(/^crossFilteringBehavior\s*:\s*(\S+)/))) r.bidir = /bothDirections/i.test(m[1]);
    }
  }
}

// ── règles ────────────────────────────────────────────────────────────────────
const findings = [];
const add = (sev, regle, controle, msg, where) => findings.push({ sev, regle, controle, msg, where });
const rel = (f) => path.relative(modeleArg, f).replace(/\\/g, '/');

// MS1
if (!tables.size) add('bloquant', 'MS1', 'CTL-D16-01', 'aucune table lue dans les fichiers TMDL — le modèle n\'existe pas dans le dépôt', modeleArg);
if (!relations.length) add('bloquant', 'MS1', 'CTL-D16-01', 'aucune relation lue — un modèle en étoile relie ses faits à ses dimensions', modeleArg);

// MS2
const vues = new Map();
for (const [tn, t] of tables) for (const me of t.mesures) {
  const cle = me.nom.toLowerCase();
  if (vues.has(cle)) add('bloquant', 'MS2', 'CTL-D05-02', `mesure « ${me.nom} » définie dans ${tn} ET dans ${vues.get(cle)} — une mesure exposée n'est définie qu'une fois`, `${rel(me.fichier)}:${me.ligne}`);
  else vues.set(cle, tn);
  if (!me.formatString) add('majeur', 'MS2', 'CTL-D05-10', `mesure « ${me.nom} » sans formatString (règle BPA : les mesures ont un format)`, `${rel(me.fichier)}:${me.ligne}`);
}

// MS3
const colonneExiste = (ref) => {
  const m = String(ref || '').match(/^('([^']+)'|([^.]+))\.(.+)$/);
  if (!m) return false;
  const tn = m[2] || m[3];
  const cn = nomDe(m[4]);
  const t = tables.get(tn);
  return !!t && t.colonnes.has(cn);
};
const tableDe = (ref) => { const m = String(ref || '').match(/^('([^']+)'|([^.]+))\./); return m ? (m[2] || m[3]) : null; };
const pairesActives = new Map();
for (const r of relations) {
  const ou = `${rel(r.fichier)}:${r.ligne}`;
  if (!r.from || !r.to) { add('bloquant', 'MS3', 'CTL-D16-02', `relation ${r.id} incomplète (fromColumn/toColumn)`, ou); continue; }
  if (!colonneExiste(r.from)) add('bloquant', 'MS3', 'CTL-D16-02', `relation ${r.id} : fromColumn « ${r.from} » ne correspond à aucune colonne lue`, ou);
  if (!colonneExiste(r.to)) add('bloquant', 'MS3', 'CTL-D16-02', `relation ${r.id} : toColumn « ${r.to} » ne correspond à aucune colonne lue`, ou);
  if (r.bidir) add('majeur', 'MS3', 'CTL-D16-02', `relation ${r.id} en filtrage bidirectionnel (règle BPA : à éviter, ambiguïté de chemin)`, ou);
  if (r.active) {
    const paire = [tableDe(r.from), tableDe(r.to)].sort().join(' ↔ ');
    if (pairesActives.has(paire)) add('bloquant', 'MS3', 'CTL-D16-02', `deux relations ACTIVES entre ${paire} (${pairesActives.get(paire)} et ${r.id}) — chemin ambigu, une seule active par paire`, ou);
    else pairesActives.set(paire, r.id);
  }
}

// MS4
const tablesDates = [...tables.entries()].filter(([, t]) => /^time$/i.test(String(t.dataCategory || '')));
if (tablesDates.length === 0) add('bloquant', 'MS4', 'CTL-D05-13', 'aucune table de dates (dataCategory: Time) — la dimension temps partagée est exigée par tout modèle exposé', modeleArg);
else {
  if (tablesDates.length > 1) add('majeur', 'MS4', 'CTL-D05-13', `${tablesDates.length} tables de dates — une seule dimension temps partagée est attendue`, modeleArg);
  for (const [tn, t] of tablesDates) if (!(t.colonnesMeta || []).some(c => c.isKey)) add('bloquant', 'MS4', 'CTL-D05-04', `table de dates « ${tn} » sans colonne isKey — non marquée comme table de dates`, rel(t.fichier));
}

// MS5
const modes = new Set();
for (const [tn, t] of tables) for (const p of t.partitions) {
  if (!p.mode) add('bloquant', 'MS5', 'CTL-D05-14', `partition « ${p.nom} » de ${tn} sans mode de stockage déclaré (import | directQuery | dual | directLake)`, `${rel(p.fichier)}:${p.ligne}`);
  else modes.add(p.mode);
}
if (modes.size > 1) add('majeur', 'MS5', 'CTL-D01-03', `modes de stockage hétérogènes (${[...modes].join(', ')}) — un mode se choisit par profil de besoin déclaré, un mélange se justifie au dossier`, modeleArg);

// MS6
if (!roles.length) add('majeur', 'MS6', 'CTL-D05-10', 'aucun rôle de sécurité (role) défini — la sécurité au niveau ligne est absente ou vit hors du modèle : à justifier au dossier de mise en production', modeleArg);

const durs = findings.filter(f => f.sev === 'bloquant' || f.sev === 'majeur');
const verdict = durs.length ? (findings.some(f => f.sev === 'bloquant') ? 'BLOQUANT' : 'MAJEUR') : 'OK';
const rapport = {
  schema: 'auditcore.modele-semantique/v1', oracle: 'verifier-modele-semantique', modele: modeleArg,
  lu: { tables: tables.size, mesures: [...tables.values()].reduce((s, t) => s + t.mesures.length, 0), relations: relations.length, roles: roles.length },
  verdict, findings, non_juge: NON_JUGE,
};
const txt = JSON.stringify(rapport, null, 2);
if (outArg) fs.writeFileSync(outArg, txt + '\n');
console.log(txt);
console.log(durs.length ? `\nverdict : ${verdict} — ${durs.length} constat(s) bloquant(s) ou majeur(s)` : '\nverdict : OK — Aucun constat bloquant ni majeur (MS1-MS6)');
process.exit(durs.length ? 1 : 0);
