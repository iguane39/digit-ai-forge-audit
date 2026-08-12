#!/usr/bin/env node
// AuditCore — assemble le pack core (Dxx.json de dimensions.yaml → controls-core-v1.json), valide
// tout via ajv, RÉCONCILIE les derived_controls des ADRs (autorité = adr_source des contrôles),
// et génère core/invariants.json (consommé par validate-config règle 2).
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { rel, loadJson, saveJson, loadYaml } from './lib.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(loadJson(rel('core', 'schemas', 'control.schema.json')));

// ── 1. Assemblage + validation
// Source unique du nombre de dimensions : dimensions.yaml (TF-0113 — plus de compte en dur qui dérive).
const dims = loadYaml(rel('core', 'dimensions', 'dimensions.yaml')).dimensions.map(d => d.id);
const all = [];
const adr2ctl = new Map();
let invalid = 0;
for (const d of dims) {
  const f = rel('core', 'controls', `${d}.json`);
  if (!fs.existsSync(f)) { console.error(`MANQUANT: ${d}.json`); process.exitCode = 1; continue; }
  const pack = loadJson(f);
  for (const c of pack.controls) {
    if (!validate(c)) {
      invalid++;
      console.error(`✖ ${c.id}: ${ajv.errorsText(validate.errors).slice(0, 160)}`);
    }
    all.push(c);
    for (const a of c.adr_source ?? []) {
      if (!adr2ctl.has(a)) adr2ctl.set(a, []);
      adr2ctl.get(a).push(c.id);
    }
  }
}
const ids = new Set();
for (const c of all) { if (ids.has(c.id)) { console.error(`✖ id dupliqué: ${c.id}`); invalid++; } ids.add(c.id); }
const noStd = all.filter(c => !c.standards?.length).length;

saveJson(rel('core', 'controls', 'controls-core-v1.json'), {
  pack: 'controls-core', layer: 'core', pack_version: '1.0.0', generated: '2026-07-11',
  counts: { total: all.length, fatal: all.filter(c => c.criticite === 'Fatal').length,
            bloquant: all.filter(c => c.criticite === 'Bloquant').length,
            majeur: all.filter(c => c.criticite === 'Majeur').length,
            standard: all.filter(c => c.criticite === 'Standard').length },
  constraints: all,
});
console.log(`✔ pack core assemblé: ${all.length} contrôles (${dims.length} dimensions) — ${invalid} invalide(s), ${noStd} sans standard`);

// ── 1bis. Pack EN (RAF-012) : émis si le corpus traduit core/controls-en/ est complet
const enDir = rel('core', 'controls-en');
if (fs.existsSync(enDir)) {
  const enAll = [];
  let enMissing = 0;
  for (const d of dims) {
    const f = path.join(enDir, `${d}.json`);
    if (!fs.existsSync(f)) { enMissing++; continue; }
    enAll.push(...loadJson(f).controls);
  }
  if (enMissing === 0 && enAll.length === all.length) {
    saveJson(rel('core', 'controls', 'controls-core-v1.en.json'), {
      pack: 'controls-core', layer: 'core', lang: 'en', pack_version: '1.0.0', generated: '2026-07-12',
      constraints: enAll,
    });
    console.log(`✔ pack core EN émis: ${enAll.length} contrôles (controls-core-v1.en.json)`);
  } else {
    console.log(`AVERTISSEMENT: corpus EN incomplet (${enMissing} dimension(s) manquante(s), ${enAll.length}/${all.length} contrôles) — pack EN non émis`);
  }
}

// ── 2. Réconciliation derived_controls dans les ADRs (les contrôles font foi)
const adrDir = rel('core', 'adr');
let fixed = 0, invariants = [];
for (const domDir of fs.readdirSync(adrDir)) {
  const dd = path.join(adrDir, domDir);
  if (!fs.statSync(dd).isDirectory()) continue;
  for (const file of fs.readdirSync(dd).filter(f => f.endsWith('.md'))) {
    const p = path.join(dd, file);
    let src = fs.readFileSync(p, 'utf-8');
    const idm = src.match(/^id:\s*(ADR\d{4})\s*$/m);
    if (!idm) { console.error(`✖ ADR sans id frontmatter: ${file}`); continue; }
    const adrId = idm[1];
    const ctls = adr2ctl.get(adrId) ?? [];
    const line = `derived_controls: [${ctls.join(', ')}]`;
    const next = src.replace(/^derived_controls:.*$/m, line);
    if (next !== src) { fs.writeFileSync(p, next, 'utf-8'); fixed++; }
    if (/^invariant:\s*true\s*$/m.test(next)) invariants.push(adrId);
  }
}
invariants.sort();
saveJson(rel('core', 'invariants.json'), { generated: '2026-07-11', invariant_adrs: invariants });
console.log(`✔ réconciliation: ${fixed} ADR(s) mis à jour (derived_controls ← adr_source des contrôles)`);
console.log(`✔ invariants.json: ${invariants.length} ADR invariants [${invariants.join(', ')}]`);

// ── 3. Stats de couverture
const orphanAdrs = [...adr2ctl.keys()].filter(a => !fs.readdirSync(adrDir).some(d => {
  const dd = path.join(adrDir, d);
  return fs.statSync(dd).isDirectory() && fs.readdirSync(dd).some(f => f.startsWith(a));
}));
if (orphanAdrs.length) console.log(`AVERTISSEMENT: adr_source sans fichier ADR: ${orphanAdrs.join(', ')}`);
const adrFiles = fs.readdirSync(adrDir).flatMap(d => {
  const dd = path.join(adrDir, d);
  return fs.statSync(dd).isDirectory() ? fs.readdirSync(dd).filter(f => f.endsWith('.md')) : [];
});
const uncovered = adrFiles.map(f => f.match(/^(ADR\d{4})/)?.[1]).filter(a => a && !adr2ctl.has(a));
console.log(`couverture: ${adrFiles.length} ADRs · ${adr2ctl.size} référencés par ≥1 contrôle · ${uncovered.length} sans contrôle dérivé${uncovered.length ? ` (${uncovered.join(', ')})` : ''}`);
