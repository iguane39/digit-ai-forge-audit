#!/usr/bin/env node
// AuditCore — vérificateur de rapport GÉNÉRIQUE (généralise verifier-rapport-audit.mjs).
// v2 : valide le CONTRAT DE DONNÉES du rapport (rapport-data.json) plutôt que le HTML —
// libellés/branding via tenant, règles core inchangées : 0 placeholder, dimensions core au complet,
// verdicts complets sur toutes les règles applicables. Gate BLOQUANT avant diffusion.
// Usage: node tools/verifier-rapport.mjs <rapport-data.json> [--tenant <tenant.yaml>]
import fs from 'node:fs';
import { rel, loadJson, loadYaml, loadTenant } from './lib.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node tools/verifier-rapport.mjs <rapport-data.json> [--tenant <tenant.yaml>]'); process.exit(2); }
const tIdx = process.argv.indexOf('--tenant');
const tenant = tIdx > -1 ? loadTenant(process.argv[tIdx + 1]).cfg : null;

const errors = [];
const raw = fs.readFileSync(file, 'utf-8');
const data = JSON.parse(raw);

// 1. Zéro placeholder résiduel
const placeholders = raw.match(/\{\{[^}]+\}\}|__TODO__|À COMPLÉTER/g) ?? [];
if (placeholders.length) errors.push(`${placeholders.length} placeholder(s) résiduel(s) — ex: ${placeholders.slice(0, 3).join(', ')}`);

// 2. Les dimensions core (dimensions.yaml, source unique — TF-0113) présentes et valides
const dims = loadYaml(rel('core', 'dimensions', 'dimensions.yaml')).dimensions.map(d => d.id);
const got = (data.dimensions ?? []).map(d => d.id);
for (const d of dims) if (!got.includes(d)) errors.push(`dimension manquante: ${d}`);
for (const d of data.dimensions ?? []) {
  if (!(d.score >= 1 && d.score <= 5) && d.applicability !== 'off')
    errors.push(`${d.id}: score invalide ou absent (${d.score}) — « pas de score sans preuve »`);
  if (d.score !== undefined && !(d.preuves?.length) && d.applicability !== 'off')
    errors.push(`${d.id}: score sans preuve — interdit (invariant)`);
  if (!['nogo', 'reserve', 'go', undefined].includes(d.gate1b)) errors.push(`${d.id}: gate1b invalide (${d.gate1b})`);
}

// 3. Verdicts complets sur toutes les règles applicables
const VERDICTS = ['conforme', 'partiel', 'non_conforme', 'sans_objet', 'a_evaluer'];
for (const r of data.regles ?? []) {
  if (!VERDICTS.includes(r.verdict)) errors.push(`règle ${r.id}: verdict manquant/invalide (${r.verdict})`);
  if (r.verdict === 'sans_objet' && !r.motif) errors.push(`règle ${r.id}: sans_objet exige une justification précise`);
  if (r.verdict === 'a_evaluer' && !r.motif) errors.push(`règle ${r.id}: a_evaluer exige un motif spécifique (à rendre rare)`);
}

// 4. Traçabilité : tout constat référence ≥1 preuve ; toute action référence règle ou constat
for (const c of data.constats ?? []) if (!c.preuves?.length) errors.push(`constat « ${c.titre} »: aucune preuve (evidence-based fichier:ligne)`);
for (const a of data.actions ?? []) if (!a.adr?.length && !a.constat_ref) errors.push(`action « ${a.titre} »: orpheline (ni règle ni constat)`);

// 5. Auto-portance (rapport sans référence à un audit antérieur)
if (/audit précédent|rapport précédent|précédemment audité/i.test(raw)) errors.push('auto-portance: référence à un audit antérieur détectée (règle B.1)');

if (errors.length) {
  for (const e of errors) console.error(`ERREUR: ${e}`);
  console.error(`\n✖ rapport NON diffusable (${errors.length} erreur(s))${tenant ? ` — tenant ${tenant.tenant.name}` : ''}`);
  process.exit(1);
}
console.log(`✔ rapport diffusable — ${got.length} dimensions, ${(data.regles ?? []).length} règles, ${(data.constats ?? []).length} constats${tenant ? ` — tenant ${tenant.tenant.name}` : ''}`);
