#!/usr/bin/env node
// =============================================================================
// verifier-schema-modele.mjs — Contrôle d'audit 1 : DÉRIVE schéma ORM ↔ base cible.
//
// Détecte le cas « le modèle déclare une colonne/table que la base n'a PAS » (cas de
// référence : une colonne d'état déclarée par l'ORM, absente en DEV → 500 sur le détail
// de la ressource ; l'audit statique et le gate CI étaient verts). Une colonne
// que le modèle LIT mais absente de la base = FINDING BLOQUANT (jamais « réserve »).
//
//   node verifier-schema-modele.mjs --model <src|dir|.json> --schema <db.json|db.sql> [--out drift.json]
//
// --model  : source ORM (SQLAlchemy/Django .py, Prisma .schema) OU un JSON déclaré { "table": ["col", …] }
//            (fallback universel : tout ORM — EF, etc. — peut exporter son schéma déclaré en JSON).
// --schema : schéma de la BASE CIBLE — JSON { "table": ["col", …] } (dump information_schema)
//            OU un .sql de DDL APPLIQUÉE (CREATE TABLE / ALTER TABLE ADD COLUMN).
//
// Exit 0 = pas de dérive bloquante · 1 = dérive bloquante (colonnes/tables modèle absentes en base) · 2 = usage.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const modelArg = opt('--model');
const schemaArg = opt('--schema');
const outArg = opt('--out');
if (!modelArg || !schemaArg) { console.error('usage: node verifier-schema-modele.mjs --model <src|dir|.json> --schema <db.json|db.sql> [--out drift.json]'); process.exit(2); }

const norm = s => String(s || '').trim().replace(/^["'`\[]|["'`\]]$/g, '').toLowerCase();

// ---------- lecture des fichiers (fichier unique ou dossier récursif) ----------
function collect(p, exts) {
  const st = fs.existsSync(p) ? fs.statSync(p) : null;
  if (!st) { console.error('introuvable : ' + p); process.exit(2); }
  if (st.isFile()) return [p];
  const out = [];
  (function walk(d) { for (const e of fs.readdirSync(d)) { const f = path.join(d, e); const s = fs.statSync(f); if (s.isDirectory()) { if (!/node_modules|\.git/.test(e)) walk(f); } else if (exts.some(x => f.toLowerCase().endsWith(x))) out.push(f); } })(p);
  return out;
}

// ---------- schéma déclaré par le MODÈLE → { table: Set(colonnes) } ----------
function parseModel(p) {
  if (p.toLowerCase().endsWith('.json')) {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const m = {}; for (const [t, cols] of Object.entries(j)) m[norm(t)] = new Set((cols || []).map(norm)); return m;
  }
  const files = collect(p, ['.py', '.prisma']);
  const model = {};
  const add = (t, c) => { if (!t || !c) return; (model[t] = model[t] || new Set()).add(c); };
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    if (f.toLowerCase().endsWith('.prisma')) {
      // Prisma : model X { champs… @@map("table") } — colonne = @map("col") sinon nom du champ.
      const re = /model\s+\w+\s*\{([\s\S]*?)\}/g; let mm;
      while ((mm = re.exec(txt))) {
        const body = mm[1];
        const map = body.match(/@@map\(\s*["'`]([^"'`]+)["'`]\s*\)/);
        const table = norm(map ? map[1] : (txt.slice(0, mm.index).match(/model\s+(\w+)\s*\{?$/m) || [])[1] || mm[0].match(/model\s+(\w+)/)[1]);
        body.split(/\r?\n/).forEach(l => {
          const line = l.trim(); if (!line || line.startsWith('//') || line.startsWith('@@')) return;
          const fld = line.match(/^([a-zA-Z_]\w*)\s+[A-Za-z]/); if (!fld) return;
          if (/@relation\b/.test(line) && !/@map\(/.test(line)) return; // champ relation pur (pas une colonne)
          const col = line.match(/@map\(\s*["'`]([^"'`]+)["'`]\s*\)/);
          add(table, norm(col ? col[1] : fld[1]));
        });
      }
      continue;
    }
    // Python : SQLAlchemy (__tablename__, Column/mapped_column) + Django (Meta.db_table, models.XField).
    let table = null;
    const lines = txt.split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      let mt = line.match(/__tablename__\s*=\s*["'`]([^"'`]+)["'`]/) || line.match(/db_table\s*=\s*["'`]([^"'`]+)["'`]/);
      if (mt) { table = norm(mt[1]); continue; }
      // SQLAlchemy : status = Column(...) | status: Mapped[...] = mapped_column(...) | db.Column(...)
      let mc = line.match(/^([a-zA-Z_]\w*)\s*(?::\s*Mapped\[[^\]]*\])?\s*=\s*(?:db\.)?(?:Column|mapped_column)\s*\(/);
      if (mc) { add(table, norm(mc[1])); continue; }
      // Django : status = models.CharField(...) ; FK → colonne <name>_id
      let md = line.match(/^([a-zA-Z_]\w*)\s*=\s*models\.(\w+)\s*\(/);
      if (md) { const isFk = /ForeignKey|OneToOneField/.test(md[2]); add(table, norm(md[1]) + (isFk ? '_id' : '')); continue; }
    }
  }
  const out = {}; for (const [t, s] of Object.entries(model)) out[t] = s; return out;
}

// ---------- schéma réel de la BASE → { table: Set(colonnes) } ----------
function parseSchema(p) {
  if (p.toLowerCase().endsWith('.json')) {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const m = {}; for (const [t, cols] of Object.entries(j)) m[norm(t)] = new Set((cols || []).map(norm)); return m;
  }
  const sql = fs.readFileSync(p, 'utf8');
  const db = {};
  const add = (t, c) => { if (!t || !c) return; (db[t] = db[t] || new Set()).add(c); };
  // CREATE TABLE [IF NOT EXISTS] name ( colonnes… )
  const ct = /create\s+table\s+(?:if\s+not\s+exists\s+)?("?[\w.]+"?)\s*\(([\s\S]*?)\)\s*;/gi; let m;
  while ((m = ct.exec(sql))) {
    const table = norm(m[1].split('.').pop());
    // découper au niveau des virgules de premier niveau (ignorer celles entre parenthèses)
    let depth = 0, seg = '', segs = [];
    for (const ch of m[2]) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { segs.push(seg); seg = ''; } else seg += ch; }
    if (seg.trim()) segs.push(seg);
    for (const s of segs) {
      const t = s.trim(); if (!t) continue;
      if (/^(primary|foreign|constraint|unique|check|exclude|like)\b/i.test(t)) continue; // contrainte, pas colonne
      const cm = t.match(/^("?[\w]+"?)/); if (cm) add(table, norm(cm[1]));
    }
  }
  // ALTER TABLE name ADD [COLUMN] col
  const at = /alter\s+table\s+(?:if\s+exists\s+)?("?[\w.]+"?)\s+add\s+(?:column\s+)?(?:if\s+not\s+exists\s+)?("?[\w]+"?)/gi;
  while ((m = at.exec(sql))) add(norm(m[1].split('.').pop()), norm(m[2]));
  return db;
}

const model = parseModel(modelArg);
const db = parseSchema(schemaArg);

const driftModelNotInDb = [];  // BLOQUANT : le modèle lit une colonne absente de la base
const tablesModelAbsentes = []; // BLOQUANT : table entière déclarée mais absente
const driftDbNotInModel = [];   // informatif
for (const [t, cols] of Object.entries(model)) {
  if (!db[t]) { tablesModelAbsentes.push(t); [...cols].forEach(c => driftModelNotInDb.push({ table: t, column: c })); continue; }
  for (const c of cols) if (!db[t].has(c)) driftModelNotInDb.push({ table: t, column: c });
}
for (const [t, cols] of Object.entries(db)) { if (!model[t]) continue; for (const c of cols) if (!model[t].has(c)) driftDbNotInModel.push({ table: t, column: c }); }

const bloquant = driftModelNotInDb.length > 0;
const result = {
  schema: 'auditcore.schema-drift/v1',
  verdict: bloquant ? 'bloquant' : 'ok',
  gate1b_implication: bloquant ? 'nogo' : null,
  tables_modele_absentes_de_la_base: tablesModelAbsentes,
  drift_modele_absent_de_la_base: driftModelNotInDb,   // BLOQUANT
  drift_base_absente_du_modele: driftDbNotInModel,     // informatif
  resume: { tables_modele: Object.keys(model).length, tables_base: Object.keys(db).length, ecarts_bloquants: driftModelNotInDb.length, ecarts_informatifs: driftDbNotInModel.length }
};
if (outArg) fs.writeFileSync(outArg, JSON.stringify(result, null, 2), 'utf8');

if (bloquant) {
  console.log('❌ DÉRIVE SCHÉMA↔MODÈLE — BLOQUANT (Gate 1b : NO GO) : ' + driftModelNotInDb.length + ' colonne(s) déclarée(s) par le modèle, absente(s) de la base cible :');
  driftModelNotInDb.forEach(d => console.log('   - ' + d.table + '.' + d.column + (tablesModelAbsentes.includes(d.table) ? '  (table entière absente)' : '')));
  console.log('→ Une colonne lue par le modèle mais absente de la base casse le parcours à l\'exécution (ex. GET en 500). Appliquer les migrations avant tout GO.');
  process.exit(1);
}
console.log('✓ Aucune dérive bloquante — le modèle ORM et la base cible sont alignés' + (driftDbNotInModel.length ? ' (' + driftDbNotInModel.length + ' colonne(s) en base non déclarée(s) par le modèle — informatif).' : '.'));
process.exit(0);
