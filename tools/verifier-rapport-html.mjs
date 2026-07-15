#!/usr/bin/env node
// AuditCore — vérificateur du RENDU HTML du rapport (RAF-006, complète le gate de données).
// Contrôle le fichier produit par rapport-engine : 0 placeholder, bandeau gate, 17 sections
// de dimensions, onglet règles, signature moteur, cohérence ERD/dictionnaire.
// Usage: node tools/verifier-rapport-html.mjs <rapport.html>
import fs from 'node:fs';
import { rel, loadYaml } from './lib.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node tools/verifier-rapport-html.mjs <rapport.html>'); process.exit(2); }
const h = fs.readFileSync(file, 'utf-8');
const errors = [];

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

if (errors.length) {
  for (const e of errors) console.error(`ERREUR: ${e}`);
  console.error(`\n✖ rendu NON diffusable (${errors.length} erreur(s))`);
  process.exit(1);
}
console.log(`✔ rendu diffusable — ${dims.length} dimensions présentes, gate et moteur intacts (${(h.length / 1024).toFixed(0)} Ko)`);
