#!/usr/bin/env node
// AuditCore — initialise un espace de travail d'audit normalisé (généralise init-audit-workspace.mjs).
// Idempotent ; arborescence de la méthodologie conservée ; « Old/ » = ne jamais écraser, archiver.
// Usage: node tools/init-audit-workspace.mjs <dossier-cible> [--tenant <tenant.yaml>]
import fs from 'node:fs';
import path from 'node:path';
import { loadTenant } from './lib.mjs';

const target = process.argv[2];
if (!target) { console.error('Usage: node tools/init-audit-workspace.mjs <dossier-cible> [--tenant <tenant.yaml>]'); process.exit(2); }
const tIdx = process.argv.indexOf('--tenant');
const tenantName = tIdx > -1 ? loadTenant(process.argv[tIdx + 1]).cfg.tenant.name : '{{tenant}}';

const INPUT = ['00 - Cadrage', '01 - Code & dépôt', '02 - Architecture & IaC', '03 - Sécurité & secrets',
  '04 - Données', '05 - Tests & CI-CD', '06 - Observabilité', '07 - Docs & gouvernance'];
const OUTPUT = ["00 - Rapport d'audit", '01 - Fiche Sécurité', "02 - Présentation autorité de décision",
  '03 - Scans & preuves', '04 - Schémas & annexes', 'Old'];

let created = 0;
for (const d of [...INPUT.map(d => path.join(target, 'input', d)), ...OUTPUT.map(d => path.join(target, 'output', d))]) {
  if (!fs.existsSync(d)) { fs.mkdirSync(d, { recursive: true }); created++; }
  const keep = path.join(d, '.gitkeep');
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, '');
}
const readme = path.join(target, 'README.md');
if (!fs.existsSync(readme)) {
  fs.writeFileSync(readme, `# Espace d'audit — ${tenantName}

Convention : \`${tenantName} - <TRI> - <Nom Document> - <AAAAMMJJ><indice>.<ext>\`.
Règles : feuille blanche · rapport auto-portant · preuves \`fichier:ligne\` · ne jamais écraser
(versionner + archiver dans \`output/Old/\`) · vérificateur obligatoire avant diffusion
(\`node tools/verifier-rapport.mjs\`).
`, 'utf-8');
}
console.log(`✔ espace d'audit initialisé: ${target} (${created} dossier(s) créé(s), idempotent)`);
