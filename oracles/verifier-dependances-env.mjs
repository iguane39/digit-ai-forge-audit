#!/usr/bin/env node
// =============================================================================
// verifier-dependances-env.mjs — Contrôle d'audit : DÉPENDANCES RUNTIME PROVISIONNÉES PAR ENV
// + SMOKES exécutés sur la RÉALITÉ DÉPLOYÉE (jamais sur un mock).
//
// Cas de référence : « Télécharger le modèle » → 404 en QUALIF seulement — l'objet de stockage
// existait en dev mais était absent en qualif (provisioning dev-only), la CSP connect-src était
// corrigée sur la branche principale mais pas sur la branche figée de qualif, et l'échec fetch
// était avalé silencieusement.
// Aucun test ne le voyait : tous mockés. « Le bouton appelle l'endpoint » ≠ « l'artefact existe dans CET env ».
//
//   node verifier-dependances-env.mjs --manifest <dependances-env.json> [--execute] [--source <dir>] [--out matrix.json]
//
// Sans --execute : validation STATIQUE (provisioning-as-code par env, smoke déclaré par env, parité des sources).
// Avec --execute  : joue les smokes http/header contre base_url de CHAQUE env (status attendu, en-tête servi
//                   contient l'hôte requis). --source : heuristique d'échecs silencieux (P5, avertissements).
//
// Exit 0 = ok · 1 = écart bloquant (dev-only/manuel, smoke manquant/échoué, dérive de source) · 2 = usage.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const has = (n) => args.includes(n);
const manifestArg = opt('--manifest'), sourceArg = opt('--source'), outArg = opt('--out'), doExecute = has('--execute');
if (!manifestArg) { console.error('usage: node verifier-dependances-env.mjs --manifest <dependances-env.json> [--execute] [--source <dir>] [--out matrix.json]'); process.exit(2); }
let man; try { man = JSON.parse(fs.readFileSync(manifestArg, 'utf8')); } catch (e) { console.error('manifeste illisible : ' + e.message); process.exit(2); }

const envs = man.environnements || [];
const envNames = envs.map(e => e.nom);
const canonical = man.canonical_source || null;
const findings = [], warns = [];
const fail = m => findings.push(m); const warn = m => warns.push(m);
const nonEmpty = v => v != null && String(v).trim() !== '';

// ---- P4 · parité des environnements : source ≠ canonique sans synchro explicite = dérive ----
for (const e of envs) {
  if (canonical && e.source && e.source !== canonical) {
    const sync = String(e.sync || '').toLowerCase();
    if (!sync || sync === 'none' || sync === 'aucune') fail(`[parité] env « ${e.nom} » bâti depuis « ${e.source} » ≠ source canonique « ${canonical} » sans mécanisme de synchro → rate les correctifs (cas CSP qualif). Déployer depuis la canonique ou déclarer un « sync » explicite.`);
    else warn(`[parité] env « ${e.nom} » depuis « ${e.source} » (≠ « ${canonical} ») — synchro déclarée : ${e.sync}. Vérifier qu'elle est effective.`);
  }
}

// ---- P1/P2 · provisioning-as-code par env + smoke déclaré par env ----
for (const d of (man.dependances || [])) {
  const id = d.id || d.type || '?';
  const prov = d.provisioning || {};
  const provMode = String(prov.mode || '').toLowerCase();
  if (provMode !== 'code' || !nonEmpty(prov.etape)) fail(`[P1 provisioning] « ${id} » : provisioning non codé (mode « ${prov.mode || '—'} »). Interdit : « ça marche en dev parce que quelqu'un l'a chargé une fois ». Exiger une étape idempotente versionnée.`);
  else {
    const provEnvs = prov.envs || [];
    const manquants = envNames.filter(n => !provEnvs.includes(n));
    if (manquants.length) fail(`[P1 provisioning] « ${id} » : provisionné pour [${provEnvs.join(', ') || '—'}] mais PAS pour [${manquants.join(', ')}] → tout env non provisionné démarre cassé (cas blob dev-only → 404 qualif).`);
  }
  const smoke = d.smoke || {};
  const smokeEnvs = smoke.par_env || [];
  const smokeManquants = envNames.filter(n => !smokeEnvs.includes(n));
  if (!smoke.type) fail(`[P2 smoke] « ${id} » : aucun smoke post-déploiement déclaré — un mock ne prouve pas la réalité provisionnée.`);
  else if (smokeManquants.length) fail(`[P2 smoke] « ${id} » : smoke absent pour [${smokeManquants.join(', ')}] (déclaré pour [${smokeEnvs.join(', ') || '—'}]) — le smoke doit tourner pour CHAQUE env.`);
}

// ---- P2 (exécuté) · jouer les smokes http/header sur la réalité de chaque env ----
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function callRetry(url, init = {}, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...init, headers: { connection: 'close', ...(init.headers || {}) }, signal: AbortSignal.timeout(init.timeoutMs || 15000) });
      try { await r.arrayBuffer(); } catch { } // consommer le corps → libère la socket (évite le crash libuv à la sortie sur Windows)
      return r;
    } catch { }
    if (i < tries - 1) await sleep(300);
  }
  return null;
}
const results = [];
if (doExecute) {
  for (const e of envs) {
    if (!e.base_url) { warn(`[exec] env « ${e.nom} » sans base_url — smokes non exécutables ici.`); continue; }
    const base = String(e.base_url).replace(/\/$/, '');
    for (const d of (man.dependances || [])) {
      const s = d.smoke || {}; if (!(s.par_env || []).includes(e.nom)) continue;
      const id = d.id || d.type;
      if (s.type === 'http') {
        const r = await callRetry(base + (s.path || '/'));
        if (!r) { fail(`[smoke ${e.nom}] « ${id} » : ${s.path || '/'} INJOIGNABLE — ne pas présumer disponible.`); results.push({ env: e.nom, id, etat: 'non_verifie' }); continue; }
        const cl = Math.floor(r.status / 100) + 'xx'; const ok = /^\d{3}$/.test(String(s.attendu)) ? r.status === Number(s.attendu) : (s.attendu || '2xx').split('|').some(x => x.trim() === cl);
        if (!ok) { fail(`[smoke ${e.nom}] « ${id} » : ${s.path} → HTTP ${r.status} (attendu ${s.attendu || '2xx'})${s.verifie ? ' — ' + s.verifie : ''}. La dépendance manque dans CET env (provisioning non appliqué ?).`); results.push({ env: e.nom, id, etat: 'echec', status: r.status }); }
        else results.push({ env: e.nom, id, etat: 'ok', status: r.status });
      } else if (s.type === 'header') {
        const r = await callRetry(base + (s.path || '/'));
        if (!r) { fail(`[smoke ${e.nom}] « ${id} » : ${s.path || '/'} INJOIGNABLE (vérif en-tête impossible).`); results.push({ env: e.nom, id, etat: 'non_verifie' }); continue; }
        const val = r.headers.get(s.header) || '';
        if (!val.includes(s.doit_contenir)) { fail(`[smoke ${e.nom}] « ${id} » : en-tête « ${s.header} » servi ne contient pas « ${s.doit_contenir} » (dérive de config par env — cas CSP qualif). Servi : « ${val.slice(0, 120) || '(absent)'} ».`); results.push({ env: e.nom, id, etat: 'echec' }); }
        else results.push({ env: e.nom, id, etat: 'ok' });
      } else {
        results.push({ env: e.nom, id, etat: 'non_executable_ici', note: 'smoke ' + s.type + ' à exécuter côté déploiement (blob/seed/env/flag)' });
      }
    }
  }
}

// ---- P5 · échecs silencieux (heuristique, avertissements) ----
if (sourceArg && fs.existsSync(sourceArg)) {
  const files = [];
  (function walk(dir) { for (const e of fs.readdirSync(dir)) { const f = path.join(dir, e); const st = fs.statSync(f); if (st.isDirectory()) { if (!/node_modules|\.git|dist|build/.test(e)) walk(f); } else if (/\.(ts|tsx|js|jsx)$/.test(f)) files.push(f); } })(sourceArg);
  const patterns = [
    { re: /\.catch\(\s*\(\s*\)?\s*\)?\s*=>\s*\{\s*\}\s*\)/, msg: 'catch de promesse vide (.catch(()=>{})) — erreur avalée' },
    { re: /catch\s*\([^)]*\)\s*\{\s*console\.(log|warn|error)\([^;]*\);?\s*\}/, msg: 'catch qui ne fait que logguer — pas de remontée visible' },
  ];
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    for (const p of patterns) if (p.re.test(txt)) warn(`[P5 échec silencieux] ${path.relative(sourceArg, f)} : ${p.msg} — une fonctionnalité qui échoue sans message est doublement invisible (utilisateur + test).`);
  }
}

const bloquant = findings.length > 0;
const result = {
  schema: 'auditcore.dependances-env/v1',
  verdict: bloquant ? 'bloquant' : 'ok',
  gate1b_implication: bloquant ? 'nogo' : null,
  environnements: envNames, canonical_source: canonical, execute: doExecute,
  resume: { dependances: (man.dependances || []).length, environnements: envNames.length, ecarts_bloquants: findings.length, avertissements: warns.length, smokes_executes: results.length },
  smokes: results, ecarts: findings, avertissements: warns
};
if (outArg) fs.writeFileSync(outArg, JSON.stringify(result, null, 2), 'utf8');

console.log('Dépendances runtime × env — verdict : ' + result.verdict.toUpperCase() + ' · ' + (man.dependances || []).length + ' dépendance(s) × ' + envNames.length + ' env [' + envNames.join(', ') + ']' + (doExecute ? ' · smokes exécutés : ' + results.length : ' (statique)'));
warns.forEach(w => console.log('  ⚠ ' + w));
if (bloquant) {
  console.log('❌ ' + findings.length + ' écart(s) BLOQUANT(S) (Gate 1b : NO GO) :');
  findings.forEach(f => console.log('   - ' + f));
  console.log('→ Un ✓ sans oracle exécuté sur la réalité provisionnée d\'un env n\'est pas un ✓. Provisioning-as-code idempotent + smoke bloquant PAR ENV sur la ressource réelle.');
  process.exitCode = 1; // pas de process.exit() : laisser l'event loop se vider proprement (sockets fetch)
} else {
  console.log('✓ Chaque dépendance runtime est provisionnée par code pour tous les env et couverte par un smoke exécuté sur la ressource réelle.');
  process.exitCode = 0;
}
