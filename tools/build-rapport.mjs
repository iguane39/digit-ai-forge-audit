#!/usr/bin/env node
// AuditCore — build-rapport (M5 v1) : rapport-data.json + tenant → rapport HTML autonome thémé.
// Recommandé : passer le gate machine d'abord (verifier-rapport). Usage :
//   node tools/build-rapport.mjs <rapport-data.json> --tenant <tenant.yaml> [--out <fichier.html>]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rel, loadTenant, loadJson, loadYaml } from './lib.mjs';
import { renderRapport } from './rapport-engine.mjs';

const file = process.argv[2];
const tIdx = process.argv.indexOf('--tenant');
if (!file || tIdx === -1) { console.error('Usage: node tools/build-rapport.mjs <rapport-data.json> --tenant <tenant.yaml> [--out <fichier.html>]'); process.exit(2); }
const { cfg, tenantDir } = loadTenant(process.argv[tIdx + 1]);
const outIdx = process.argv.indexOf('--out');

const data = loadJson(path.resolve(file));
const lang = cfg.tenant.language === 'en' ? 'en' : 'fr';
const dimsPack = loadYaml(rel('core', 'dimensions', 'dimensions.yaml'));
const relabel = cfg.dimensions?.relabel ?? {};
const baseLabel = (d) => (lang === 'en' ? (d.label_en ?? d.label) : d.label);
const dimensions = dimsPack.dimensions.map(d => ({ ...d, label: relabel[d.id] ?? baseLabel(d) }));
const families = dimsPack.families.map(f => ({ ...f, label: lang === 'en' ? (f.label_en ?? f.label) : f.label }));

// thème : généré si absent (le yaml peut porter n'importe quel nom)
const tenantAbs = path.resolve(process.argv[tIdx + 1]);
const themePath = path.join(tenantDir, 'theme', 'theme.css');
if (!fs.existsSync(themePath))
  execFileSync(process.execPath, [rel('tools', 'build-theme.mjs'), tenantAbs, '--out', path.join(tenantDir, 'theme')], { stdio: 'ignore' });
const themeCss = fs.readFileSync(themePath, 'utf-8');

// index des contraintes (métadonnées des règles) depuis la fusion du tenant
const mergedPath = path.join(tenantDir, 'merged.json');
if (!fs.existsSync(mergedPath))
  execFileSync(process.execPath, [rel('tools', 'merge-packs.mjs'), tenantAbs, '--out', mergedPath], { stdio: 'ignore' });
const merged = loadJson(mergedPath);
data._constraints_index = Object.fromEntries(merged.constraints.map(c => [c.id,
  { dimension_audit: c.dimension_audit, criticite: c.criticite, bucket: c.bucket, enforcement: c.enforcement, regle: c.regle }]));
data._short_code = cfg.tenant.short_code;

const html = renderRapport(data, {
  tenant: cfg.tenant.name, dimensions, families,
  themeCss, coreVersion: String(cfg.core_version), lang,
});
const out = outIdx > -1 ? path.resolve(process.argv[outIdx + 1])
  : rel('deliverables', 'generated', cfg.tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'rapport-audit.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf-8');
console.log(`✔ rapport rendu: ${(html.length / 1024).toFixed(0)} Ko → ${out}`);
console.log('  rappel gate machine : node tools/verifier-rapport.mjs <rapport-data.json> (exit 0 avant diffusion)');
