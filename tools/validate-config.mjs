#!/usr/bin/env node
// AuditCore — validateur de configuration tenant (schéma + 5 règles sémantiques, PLAN/02 §3)
// Usage: node tools/validate-config.mjs <tenant.yaml> [--quiet]
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { ROOT, rel, loadTenant, loadJson, frontmatter, contrastRatio, ENFORCEMENT_ORDER } from './lib.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node tools/validate-config.mjs <tenant.yaml>'); process.exit(2); }
const quiet = process.argv.includes('--quiet');
const errors = [];
const warns = [];

const { cfg, resolveRef } = loadTenant(file);

// ── 0. Schéma JSON (structure)
const ajv = new Ajv({ allErrors: true, strict: false });
const schema = loadJson(rel('core', 'schemas', 'tenant.schema.json'));
if (!ajv.validate(schema, cfg)) {
  for (const e of ajv.errors) errors.push(`schéma: ${e.instancePath || '/'} ${e.message}`);
}

// ── 1. Domaines : les 9 codes 00–08 requis + 09 OPTIONNEL (PADR-0008, évolution additive) ;
//     dimensions : relabel ⊆ D00–D16 (jamais de retrait)
const codes = (cfg.domains ?? []).map(d => d.code).sort();
const required9 = ['00','01','02','03','04','05','06','07','08'];
const okBase = required9.every(c => codes.includes(c));
const okExtra = codes.every(c => required9.includes(c) || c === '09');
if (!okBase || !okExtra || new Set(codes).size !== codes.length)
  errors.push(`règle 1: domains doit déclarer les 9 codes 00–08 (09 optionnel — PADR-0008), sans doublon (reçu: ${codes.join(',') || 'aucun'})`);
const keys = new Set((cfg.domains ?? []).map(d => d.key));
if (keys.size !== (cfg.domains ?? []).length) errors.push('règle 1: clés de domaines non uniques');
for (const k of Object.keys(cfg.dimensions?.relabel ?? {}))
  if (!/^D(0[0-9]|1[0-6])$/.test(k)) errors.push(`règle 1: relabel de dimension inconnue ${k}`);

// ── 2. disable d'un élément invariant → erreur
const disables = cfg.adr?.overrides?.disable ?? [];
if (disables.length) {
  let invariants = null;
  const invFile = rel('core', 'invariants.json');
  if (fs.existsSync(invFile)) invariants = new Set(loadJson(invFile).invariant_adrs);
  for (const id of disables) {
    if (invariants === null) { errors.push(`règle 2: disable de ${id} refusé (manifest core/invariants.json absent → tout disable est refusé par défaut sûr)`); }
    else if (invariants.has(id)) errors.push(`règle 2: ${id} est invariant:true — non désactivable par overlay`);
  }
}

// ── 3. tighten ne peut qu'élever l'enforcement
const tighten = cfg.adr?.overrides?.tighten ?? {};
let baseEnf = {};
const corePack = rel('core', 'controls', 'controls-core-v1.json');
if (fs.existsSync(corePack)) {
  for (const c of loadJson(corePack).constraints ?? [])
    for (const a of c.adr_source ?? [])
      baseEnf[a] = Math.max(baseEnf[a] ?? 0, ENFORCEMENT_ORDER[c.enforcement] ?? 0);
}
for (const [adr, o] of Object.entries(tighten)) {
  const target = ENFORCEMENT_ORDER[o.enforcement];
  if (target === undefined) { errors.push(`règle 3: enforcement inconnu pour ${adr}`); continue; }
  if (adr in baseEnf && target < baseEnf[adr])
    errors.push(`règle 3: tighten de ${adr} ABAISSE l'enforcement (${o.enforcement}) — seul le durcissement est autorisé`);
  if (!(adr in baseEnf)) warns.push(`règle 3: base d'enforcement inconnue pour ${adr} (pack core absent ou ADR non couvert) — direction non vérifiée`);
}

// ── 4. ids de contraintes uniques après fusion des packs
const seen = new Map();
for (const packRef of cfg.constraint_packs ?? []) {
  const p = resolveRef(packRef);
  if (!fs.existsSync(p)) { errors.push(`règle 4: pack introuvable: ${packRef}`); continue; }
  const pack = loadJson(p);
  for (const c of pack.constraints ?? []) {
    if (seen.has(c.id)) errors.push(`règle 4: id dupliqué ${c.id} (${seen.get(c.id)} ∧ ${packRef})`);
    else seen.set(c.id, packRef);
  }
}

// ── 5. design_md lint-lite (missing-primary, broken-ref, contrast-ratio)
if (cfg.branding?.design_md) {
  const dm = resolveRef(cfg.branding.design_md);
  if (!fs.existsSync(dm)) errors.push(`règle 5: design_md introuvable: ${cfg.branding.design_md}`);
  else {
    const fm = frontmatter(dm);
    if (!fm?.colors?.primary) errors.push('règle 5 (missing-primary): DESIGN.md sans colors.primary');
    else {
      const bg = fm.colors.background ?? '#ffffff';
      const cr = contrastRatio(fm.colors.primary, bg);
      if (cr < 3) errors.push(`règle 5 (contrast-ratio): primary vs fond = ${cr.toFixed(2)} < 3.0 (WCAG lint-lite)`);
    }
    const body = fs.readFileSync(dm, 'utf-8');
    for (const m of body.matchAll(/\]\((?!https?:|#)([^)]+)\)/g)) {
      const refPath = path.resolve(path.dirname(dm), m[1]);
      if (!fs.existsSync(refPath)) errors.push(`règle 5 (broken-ref): ${m[1]} introuvable depuis DESIGN.md`);
    }
  }
}

// ── verdict
if (!quiet) { for (const w of warns) console.log(`AVERTISSEMENT: ${w}`); }
if (errors.length) {
  for (const e of errors) console.error(`ERREUR: ${e}`);
  console.error(`\n✖ configuration INVALIDE (${errors.length} erreur(s))`);
  process.exit(1);
}
console.log(`✔ configuration valide (${path.basename(file)}) — ${seen.size} contrainte(s) sur ${(cfg.constraint_packs ?? []).length} pack(s), ${warns.length} avertissement(s)`);
