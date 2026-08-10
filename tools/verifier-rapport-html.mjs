#!/usr/bin/env node
// AuditCore — vérificateur du RENDU HTML du rapport (RAF-006, complète le gate de données).
// Contrôle le fichier produit par rapport-engine : 0 placeholder, bandeau gate, 17 sections
// de dimensions, onglet règles, signature moteur, cohérence ERD/dictionnaire.
// Usage: node tools/verifier-rapport-html.mjs <rapport.html>
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { rel, loadYaml } from './lib.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node tools/verifier-rapport-html.mjs <rapport.html>'); process.exit(2); }
const h = fs.readFileSync(file, 'utf-8');
const errors = [];
const checks = [];

const ph = h.match(/\{\{[^}]+\}\}/g) ?? [];
if (ph.length) errors.push(`${ph.length} placeholder(s) résiduel(s) — ex: ${[...new Set(ph)].slice(0, 3).join(', ')}`);
if (!/class="gate (std|maj|fatal)"/.test(h)) errors.push('bandeau de verdict gate absent');
if (!h.includes('Score global')) errors.push('KPI « Score global » absent');
if (!/<svg viewBox="0 0 460/.test(h)) errors.push('radar par famille absent');

const dims = loadYaml(rel('core', 'dimensions', 'dimensions.yaml')).dimensions.map(d => d.id);
const missing = dims.filter(d => !h.includes(`id="${d}"`));
if (missing.length) errors.push(`sections de dimensions manquantes: ${missing.join(', ')}`);

if (!h.includes('Toutes les règles')) errors.push('onglet « Toutes les règles » absent');
if (!h.includes('généré par AuditCore')) errors.push('signature moteur absente (fichier édité à la main ?)');
if (h.includes('class="erd-t"') && !h.includes('PII 🔒')) errors.push('ERD présent sans dictionnaire des tables');
if (/audit précédent|rapport précédent/i.test(h)) errors.push('auto-portance: référence à un audit antérieur');

// ─────────────────────────────────────────────────────────────────────────────
// ECR-02 — du contrôle STATIQUE au contrôle EXÉCUTÉ.
// Chercher des chaînes dans le HTML ne prouve pas que le rapport FONCTIONNE : un
// `ReferenceError` ou une clé de données manquante ne casse qu'au clic, et passe
// tous les tests ci-dessus. On compile puis on EXÉCUTE réellement le moteur, en
// pilotant chaque onglet comme le ferait un navigateur, sans avaler les erreurs.
// ─────────────────────────────────────────────────────────────────────────────
const scripts = [...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m => !/\bsrc=/i.test(m[1]) && !/type\s*=\s*["']application\/json["']/i.test(m[1]))
  .map(m => m[2]);
if (!scripts.length) errors.push('aucun moteur JS exploitable dans le rendu (rapport inerte ?)');

let sandbox = null;
if (scripts.length) {
  const src = scripts.join('\n;\n');
  // Check A — le moteur COMPILE (SyntaxError, const dupliqué, accolades déséquilibrées)
  try { new vm.Script(src, { filename: path.basename(file) }); }
  catch (e) { errors.push(`le moteur JS ne compile pas : ${e.message}`); }

  // Check B — le moteur S'EXÉCUTE (init) sans exception, sur un DOM minimal
  if (!errors.some(e => e.startsWith('le moteur JS ne compile pas'))) {
    const el = () => ({
      hidden: false, style: {}, textContent: '', value: '',
      classList: { add() {}, remove() {}, contains: () => false },
      querySelectorAll: () => [], appendChild(c) { return c; }, addEventListener() {},
    });
    const nodes = {};
    sandbox = {
      console: { log() {}, warn() {}, error() {}, info() {} },
      document: {
        getElementById: (id) => (nodes[id] ??= el()),
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener() {}, createElement: el, body: el(),
      },
      window: { addEventListener() {} }, JSON, Math, Date,
    };
    sandbox.globalThis = sandbox;
    try { vm.createContext(sandbox); vm.runInContext(src, sandbox, { filename: path.basename(file) }); }
    catch (e) { errors.push(`le moteur JS lève à l'initialisation : ${e.message}`); sandbox = null; }
  }
}

// Check C — CHAQUE onglet déclaré est réellement pilotable (c'est le clic qui casse)
if (sandbox && typeof sandbox.tab === 'function') {
  const keys = [...new Set([...h.matchAll(/onclick="tab\('([^']+)'/g)].map(m => m[1]))];
  if (!keys.length) errors.push('aucun onglet déclaré — navigation du rapport absente');
  const btn = { classList: { add() {}, remove() {} } };
  for (const k of keys) {
    try { sandbox.tab(k, btn); }
    catch (e) { errors.push(`onglet « ${k} » : le moteur lève au clic — ${e.message}`); }
  }
  if (keys.length && !errors.some(e => e.startsWith('onglet'))) checks.push(`${keys.length} onglets pilotés`);
} else if (sandbox) {
  errors.push('fonction de navigation « tab » absente du moteur rendu');
}

// Check D — le filtre des règles s'exécute (fonction interactive la plus exposée)
if (sandbox && typeof sandbox.filtreRegles === 'function') {
  try { sandbox.filtreRegles(); checks.push('filtre des règles exécuté'); }
  catch (e) { errors.push(`filtre des règles : le moteur lève — ${e.message}`); }
}

if (errors.length) {
  for (const e of errors) console.error(`ERREUR: ${e}`);
  console.error(`\n✖ rendu NON diffusable (${errors.length} erreur(s))`);
  process.exit(1);
}
console.log(`✔ rendu diffusable — ${dims.length} dimensions présentes, gate intact, moteur COMPILÉ et EXÉCUTÉ (${checks.join(', ')}) — ${(h.length / 1024).toFixed(0)} Ko`);
