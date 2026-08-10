#!/usr/bin/env node
// =============================================================================
// smoke-parcours.mjs — Contrôle d'audit 2 : SMOKE RUNTIME des parcours critiques.
//
// Un « GO » sans avoir exercé le parcours principal N'EST PAS un GO. L'audit doit APPELER
// réellement les endpoints critiques contre l'environnement DÉPLOYÉ et exiger des 2xx —
// pas seulement analyser le code. Un 500 sur un parcours principal INTERDIT le GO (jamais « réserve »).
// (Cas de référence : un 500 sur le détail d'une ressource, non détecté par l'audit statique
// alors que le gate CI était vert.)
//
//   node smoke-parcours.mjs --manifest <parcours.json> [--out smoke.json]
//
// Manifeste : { base_url, auth?:{header, value_env}, parcours:[ {id, method?, path, critique?, attendu?} ] }
//   attendu : "2xx" (défaut) | code exact (ex. 200) | "2xx|3xx".
//
// Échelle de résolution (jamais présumer 2xx) : réessai borné → si 401/403 sans jeton, « non vérifié
// (jeton de service requis) » à escalader — JAMAIS un 2xx présumé.
//
// Exit 0 = tous les parcours critiques en 2xx · 1 = un parcours critique en échec (5xx/non-2xx) → NO GO
//        · 2 = un parcours critique NON VÉRIFIÉ (injoignable/auth) → pas de GO tant que non exercé · 3 = usage.
// =============================================================================
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const manifestArg = opt('--manifest');
const outArg = opt('--out');
if (!manifestArg) { console.error('usage: node smoke-parcours.mjs --manifest <parcours.json> [--out smoke.json]'); process.exit(3); }

let man; try { man = JSON.parse(fs.readFileSync(manifestArg, 'utf8')); } catch (e) { console.error('manifeste illisible : ' + e.message); process.exit(3); }
const base = String(man.base_url || '').replace(/\/$/, '');
if (!base) { console.error('base_url manquant dans le manifeste.'); process.exit(3); }
const authHeader = man.auth && man.auth.header;
const authValue = man.auth && man.auth.value_env ? process.env[man.auth.value_env] : (man.auth && man.auth.value) || null;

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function callRetry(url, init, tries = 2) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...init, headers: { connection: 'close', ...(init.headers || {}) }, signal: AbortSignal.timeout(init.timeoutMs || 15000) });
      try { await r.arrayBuffer(); } catch { } // consommer le corps → libère la socket (évite le crash libuv à la sortie sur Windows)
      return r;
    }
    catch (e) { last = e; }
    if (i < tries - 1) await sleep(400);
  }
  return { __neterror: last ? (last.name === 'TimeoutError' ? 'timeout' : (last.cause && last.cause.code) || last.message) : 'réseau' };
}
const attenduOk = (attendu, status) => {
  const a = String(attendu || '2xx').toLowerCase();
  if (/^\d{3}$/.test(a)) return status === Number(a);
  return a.split('|').some(cl => cl.trim() === Math.floor(status / 100) + 'xx');
};

const results = [];
for (const p of (man.parcours || [])) {
  const method = (p.method || 'GET').toUpperCase();
  const url = base + (p.path.startsWith('/') ? p.path : '/' + p.path);
  const critique = p.critique !== false; // critique par défaut
  const headers = {}; if (authHeader && authValue) headers[authHeader] = authValue;
  const r = await callRetry(url, { method, headers });
  let etat, detail;
  if (r.__neterror) { etat = 'non_verifie'; detail = 'injoignable (' + r.__neterror + ') — escalader (jeton de service, exec conteneur, preuve e2e CI) avant de conclure ; ne jamais présumer 2xx'; }
  else if ((r.status === 401 || r.status === 403) && !authValue) { etat = 'non_verifie'; detail = 'HTTP ' + r.status + ' — authentification requise, aucun jeton fourni (renseigner auth.value_env) ; ne pas présumer 2xx'; }
  else if (attenduOk(p.attendu, r.status)) { etat = 'ok'; detail = 'HTTP ' + r.status; }
  else if (r.status >= 500) { etat = 'echec'; detail = 'HTTP ' + r.status + ' — erreur serveur sur un parcours ' + (critique ? 'CRITIQUE' : 'secondaire'); }
  else { etat = 'anomalie'; detail = 'HTTP ' + r.status + ' — attendu ' + (p.attendu || '2xx'); }
  results.push({ id: p.id || p.path, method, path: p.path, critique, etat, detail });
}

const crit = results.filter(r => r.critique);
const echecs = crit.filter(r => r.etat === 'echec' || r.etat === 'anomalie');
const nonVerifies = crit.filter(r => r.etat === 'non_verifie');
let verdict, code;
if (echecs.length) { verdict = 'bloquant'; code = 1; }
else if (nonVerifies.length) { verdict = 'non_verifie'; code = 2; }
else { verdict = 'ok'; code = 0; }

const out = {
  schema: 'auditcore.smoke-parcours/v1', base_url: base, verdict,
  gate1b_implication: verdict === 'bloquant' ? 'nogo' : (verdict === 'non_verifie' ? 'pas de GO (parcours non exercé)' : null),
  resume: { total: results.length, critiques: crit.length, ok: crit.filter(r => r.etat === 'ok').length, echecs: echecs.length, non_verifies: nonVerifies.length },
  parcours: results
};
if (outArg) fs.writeFileSync(outArg, JSON.stringify(out, null, 2), 'utf8');

console.log('Smoke runtime — ' + base + '  · verdict : ' + verdict.toUpperCase());
results.forEach(r => console.log('  ' + ({ ok: '✓', echec: '❌', anomalie: '⚠', non_verifie: '?' }[r.etat] || '·') + ' [' + (r.critique ? 'critique' : 'secondaire') + '] ' + r.method + ' ' + r.path + ' — ' + r.detail));
if (verdict === 'bloquant') console.log('→ NO GO : un parcours principal est en échec runtime. Le format conforme et le gate CI ne prouvent pas que l\'application fonctionne.');
else if (verdict === 'non_verifie') console.log('→ PAS DE GO tant que le parcours critique n\'est pas exercé (2xx prouvé). Épuiser l\'échelle de résolution avant de conclure.');
process.exitCode = code; // pas de process.exit() : évite le crash libuv (fermeture des sockets fetch) à la sortie sur Windows
