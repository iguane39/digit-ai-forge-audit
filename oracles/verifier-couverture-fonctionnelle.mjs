#!/usr/bin/env node
// =============================================================================
// verifier-couverture-fonctionnelle.mjs — Contrôle d'audit : INVENTAIRE FONCTIONNEL → MATRICE DE COUVERTURE.
//
// Invariant (quality-oracles) : « un ✓ de conformité fonctionnelle SANS test EXÉCUTÉ n'est pas un ✓ ».
// « Le build passe » ≠ « ça marche ». Chaque point fonctionnel (parcours front, endpoint back) doit être
// relié à un test EXÉCUTÉ au bon niveau de risque, OU marqué non-testable AVEC raison + oracle de substitution.
//
//   node verifier-couverture-fonctionnelle.mjs --manifest <couverture.json> [--source <dir>] [--ratchet <baseline.json>] [--out matrix.json]
//
// --source  : scanne le code des endpoints back (Flask/FastAPI/Express) ; tout endpoint présent dans le
//             code mais ABSENT du manifeste = défaut de complétude BLOQUANT (on ne cache pas un endpoint).
// --ratchet : baseline { front_couverts, back_couverts } ; la couverture ne peut que MONTER.
//
// Niveaux acceptés pour « couvert » : back → integration | e2e ; front → e2e.
// Un point « couvert » adossé seulement à unit/schema/build/lint/typecheck = BLOQUANT (faux ✓).
//
// Exit 0 = couverture complète (ou manques justifiés) · 1 = écart(s) bloquant(s) · 2 = usage.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const manifestArg = opt('--manifest'), sourceArg = opt('--source'), ratchetArg = opt('--ratchet'), outArg = opt('--out');
if (!manifestArg) { console.error('usage: node verifier-couverture-fonctionnelle.mjs --manifest <couverture.json> [--source <dir>] [--ratchet <baseline.json>] [--out matrix.json]'); process.exit(2); }
let man; try { man = JSON.parse(fs.readFileSync(manifestArg, 'utf8')); } catch (e) { console.error('manifeste illisible : ' + e.message); process.exit(2); }

const NIVEAUX_FAIBLES = new Set(['unit', 'unitaire', 'schema', 'schéma', 'build', 'lint', 'typecheck', 'type']);
const COUVERT_BACK = new Set(['integration', 'intégration', 'e2e']);
const COUVERT_FRONT = new Set(['e2e']);
const nonEmpty = v => v != null && String(v).trim() !== '';

const findings = []; // bloquants
const warns = [];
const fail = (m) => findings.push(m);
const warn = (m) => warns.push(m);

function evalPoint(p, side) {
  const id = p.id || p.endpoint || p.parcours || '?';
  const tests = Array.isArray(p.tests) ? p.tests.filter(nonEmpty) : [];
  const niveau = String(p.niveau || '').toLowerCase().trim();
  const okLevels = side === 'back' ? COUVERT_BACK : COUVERT_FRONT;
  let statut;
  if (!tests.length) { statut = 'non_couvert'; fail(`[${side}] « ${id} » : aucun test exécuté → point fonctionnel NON COUVERT (défaut de complétude).`); }
  else if (NIVEAUX_FAIBLES.has(niveau)) { statut = 'faux_couvert'; fail(`[${side}] « ${id} » : couverture adossée à « ${niveau || '?'} » seulement (build/lint/schéma/unit) — ce n'est pas un ✓ fonctionnel. Exiger ${side === 'back' ? 'un test d\'intégration niveau endpoint' : 'un e2e de parcours'}.`); }
  else if (!okLevels.has(niveau)) { statut = 'niveau_invalide'; fail(`[${side}] « ${id} » : niveau « ${niveau || '?'} » non reconnu comme couvrant (attendu : ${[...okLevels].join('|')}).`); }
  else { statut = 'couvert'; }
  if (p.deps_externes_reelles === true) warn(`[${side}] « ${id} » : test dépend d'un service externe RÉEL (réseau/credentials) — fragile ; mocker au bon point de couture (stockage/e-mail/push/géocodage).`);
  return { id, side, endpoint: p.endpoint, parcours: p.parcours, niveau, tests, statut };
}

const rows = [];
(man.back || []).forEach(p => rows.push(evalPoint(p, 'back')));
(man.front || []).forEach(p => rows.push(evalPoint(p, 'front')));

// non-testable : doit être justifié (raison + oracle de substitution)
const nonTestable = (man.non_testable || []).map(nt => {
  const id = nt.id || nt.point || '?';
  if (!nonEmpty(nt.raison) || !nonEmpty(nt.oracle_substitution)) fail(`[non-testable] « ${id} » : doit porter une RAISON + un ORACLE DE SUBSTITUTION nommé (test back/unitaire/smoke déployé). Interdit de compter comme couvert ou de fabriquer un test factice.`);
  return { id, raison: nt.raison || null, oracle_substitution: nt.oracle_substitution || null };
});

// --source : endpoints du code absents du manifeste = défaut de complétude bloquant
let endpointsCode = [];
if (sourceArg) {
  const files = [];
  (function walk(d) { for (const e of fs.readdirSync(d)) { const f = path.join(d, e); const s = fs.statSync(f); if (s.isDirectory()) { if (!/node_modules|\.git|__pycache__/.test(e)) walk(f); } else if (/\.(py|js|ts|mjs)$/.test(f)) files.push(f); } })(sourceArg);
  const normPath = pth => '/' + String(pth).replace(/^\/+/, '').replace(/\/+$/, '').replace(/<[^>]*>|:[A-Za-z_]\w*|\{[^}]*\}/g, ':param').toLowerCase();
  const key = (m, pth) => m.toUpperCase() + ' ' + normPath(pth);
  const seen = new Set();
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    let m;
    // Flask : @app.route("/x", methods=["GET","POST"]) | @bp.route("/x")
    const flask = /@\w+\.route\(\s*["'`]([^"'`]+)["'`]([^)]*)\)/g;
    while ((m = flask.exec(txt))) { const methods = (m[2].match(/methods\s*=\s*\[([^\]]*)\]/) || [, '"GET"'])[1].match(/["'`](\w+)["'`]/g) || ['"GET"']; methods.forEach(mm => { const meth = mm.replace(/["'`]/g, ''); seen.add(key(meth, m[1])); }); }
    // FastAPI / Flask 2 : @app.get("/x") @router.post("/x")
    const verb = /@\w+\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/gi;
    while ((m = verb.exec(txt))) seen.add(key(m[1], m[2]));
    // Express : app.get("/x" | router.post('/x'
    const exp = /\b(?:app|router)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/gi;
    while ((m = exp.exec(txt))) seen.add(key(m[1], m[2]));
  }
  endpointsCode = [...seen];
  const manifestKeys = new Set((man.back || []).map(p => { const mm = String(p.endpoint || '').trim().match(/^(\w+)\s+(.+)$/); return mm ? key(mm[1], mm[2]) : null; }).filter(Boolean));
  const orphans = endpointsCode.filter(k => !manifestKeys.has(k));
  orphans.forEach(k => fail(`[complétude] endpoint « ${k} » présent dans le code (--source) mais ABSENT du manifeste de couverture — inventaire incomplet (un endpoint non listé = un endpoint non testé qui passe inaperçu).`));
}

// ratchet : la couverture ne peut que monter
const couvertsBack = rows.filter(r => r.side === 'back' && r.statut === 'couvert').length;
const couvertsFront = rows.filter(r => r.side === 'front' && r.statut === 'couvert').length;
if (ratchetArg) {
  let base; try { base = JSON.parse(fs.readFileSync(ratchetArg, 'utf8')); } catch (e) { fail('ratchet illisible : ' + e.message); base = {}; }
  if (Number.isFinite(base.back_couverts) && couvertsBack < base.back_couverts) fail(`[ratchet] couverture back en RÉGRESSION : ${couvertsBack} < baseline ${base.back_couverts}.`);
  if (Number.isFinite(base.front_couverts) && couvertsFront < base.front_couverts) fail(`[ratchet] couverture front en RÉGRESSION : ${couvertsFront} < baseline ${base.front_couverts}.`);
}

const bloquant = findings.length > 0;
const result = {
  schema: 'auditcore.couverture-fonctionnelle/v1',
  projet: man.projet || null,
  verdict: bloquant ? 'bloquant' : 'ok',
  gate1b_implication: bloquant ? 'nogo' : null,
  resume: {
    back_total: (man.back || []).length, back_couverts: couvertsBack,
    front_total: (man.front || []).length, front_couverts: couvertsFront,
    non_testable: nonTestable.length, ecarts_bloquants: findings.length, fragiles: warns.length,
    endpoints_code: endpointsCode.length
  },
  matrice: rows, non_testable: nonTestable, ecarts: findings, fragiles: warns
};
if (outArg) fs.writeFileSync(outArg, JSON.stringify(result, null, 2), 'utf8');

console.log('Couverture fonctionnelle — verdict : ' + result.verdict.toUpperCase()
  + ' · back ' + couvertsBack + '/' + (man.back || []).length + ' couverts · front ' + couvertsFront + '/' + (man.front || []).length + ' couverts · non-testable ' + nonTestable.length);
warns.forEach(w => console.log('  ⚠ ' + w));
if (bloquant) {
  console.log('❌ ' + findings.length + ' écart(s) BLOQUANT(S) de complétude fonctionnelle (Gate 1b : NO GO) :');
  findings.forEach(f => console.log('   - ' + f));
  console.log('→ Un ✓ de conformité fonctionnelle sans test EXÉCUTÉ n\'est pas un ✓. La remédiation doit ÉCRIRE ces tests et les rendre verts, pas les signaler.');
  process.exit(1);
}
console.log('✓ Chaque point fonctionnel est relié à un test exécuté au bon niveau (ou marqué non-testable + oracle de substitution).');
process.exit(0);
