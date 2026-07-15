#!/usr/bin/env node
// AuditCore — GOLDEN-TEST synthétique (RAF-027) : vérifie en CI la logique pivot du produit
// (dérivation des buckets par binding_authorities + flag de juridiction) sur le pack FICTIF
// tests/fixtures/pack-fixture.json — équivalent produit de l'iso-test 91/91, qui lui se joue
// dans le dépôt du tenant contre son historique réel. Ne lit RIEN hors auditcore/.
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auditcore-golden-'));
const run = (tenant, out) => {
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'merge-packs.mjs'),
    path.join(HERE, 'fixtures', tenant), '--out', out], { stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(fs.readFileSync(out, 'utf-8'));
};

let fails = 0;
const assert = (cond, label) => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}`); if (!cond) fails++; };

// ── Tenant EU (binding ACME, juridiction eu active)
const eu = run('tenant-golden-eu.yaml', path.join(tmp, 'eu.json'));
const by = Object.fromEntries(eu.constraints.map(c => [c.id, c]));
assert(eu.counts.total === 10, `fusion: 10 contraintes (reçu ${eu.counts.total})`);
assert(eu.counts.opposable === 7, `bucket: 7 opposables — authority ACME ∈ binding (reçu ${eu.counts.opposable})`);
assert(eu.counts.informatif === 3, `bucket: 3 informatives — authority Generique ∉ binding (reçu ${eu.counts.informatif})`);
assert(by['C-9001-02'].bucket === 'opposable', 'C-9001-02 (ACME) → opposable');
assert(by['C-9004-01'].bucket === 'informatif', 'C-9004-01 (Generique) → informatif');
assert(by['C-9005-01'].applicabilite_defaut !== 'sans_objet', 'C-9005-01 (jur. eu) NON exclu quand eu est active');

// ── Tenant APAC (juridiction eu inactive) — seul le contrôle eu bascule
const ap = run('tenant-golden-apac.yaml', path.join(tmp, 'apac.json'));
const byA = Object.fromEntries(ap.constraints.map(c => [c.id, c]));
assert(byA['C-9005-01'].applicabilite_defaut === 'sans_objet'
  && /juridiction/.test(byA['C-9005-01'].applicabilite_motif ?? ''), 'C-9005-01 → sans_objet motivé (juridiction eu inactive)');
assert(ap.constraints.filter(c => /juridiction/.test(c.applicabilite_motif ?? '')).length === 1, 'exactement 1 contrôle affecté par la juridiction');
assert(ap.counts.opposable === 7, `buckets inchangés hors juridiction (7 opposables, reçu ${ap.counts.opposable})`);

fs.rmSync(tmp, { recursive: true, force: true });
if (fails) { console.error(`\n✖ golden-test: ${fails} échec(s)`); process.exit(1); }
console.log('\n✔ golden-test buckets + juridictions : 9/9 — logique pivot du produit vérifiée sans dépendance tenant');
