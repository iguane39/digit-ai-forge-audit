// Non-régression du contrôle « inventaire fonctionnel → matrice de couverture »
// (prompt : tests-fonctionnels-front-back-passants).
// Invariant : un ✓ de conformité fonctionnelle SANS test EXÉCUTÉ au bon niveau n'est pas un ✓.
//
// Lancer :  node --test __tests__/couverture-fonctionnelle.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOL = path.join(HERE, '..', '..', 'oracles', 'verifier-couverture-fonctionnelle.mjs');
const FIX = path.join(HERE, '..', 'fixtures', 'oracles', 'couverture');
const run = (args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', timeout: 60000, maxBuffer: 1e8 });

test('incomplet + source → BLOQUANT : faux ✓ (schéma/unit), non-testable non justifié, endpoint orphelin', () => {
  const r = run(['--manifest', path.join(FIX, 'incomplet.json'), '--source', path.join(FIX, 'src')]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /BLOQUANT/);
  assert.match(r.stdout, /get-listing.*sch[eé]ma/s, 'un ✓ adossé au schéma seul est rejeté');
  assert.match(r.stdout, /supprimer.*unit/s, 'un ✓ front adossé à l\'unitaire est rejeté');
  assert.match(r.stdout, /non-testable.*ORACLE DE SUBSTITUTION/s, 'non-testable sans oracle → rejeté');
  assert.match(r.stdout, /alerts\/process.*ABSENT du manifeste/s, 'endpoint du code non listé → défaut de complétude');
});

test('complet + source → OK : chaque point relié à un test exécuté au bon niveau', () => {
  const r = run(['--manifest', path.join(FIX, 'complet.json'), '--source', path.join(FIX, 'src')]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /verdict : OK/);
  assert.match(r.stdout, /back 4\/4/);
});

test('ratchet : la couverture ne peut que monter (régression → BLOQUANT)', () => {
  const base = path.join(os.tmpdir(), 'cov-ratchet.json');
  fs.writeFileSync(base, JSON.stringify({ back_couverts: 5, front_couverts: 1 })); // 5 > 4 réels
  const r = run(['--manifest', path.join(FIX, 'complet.json'), '--ratchet', base]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ratchet.*R[EÉ]GRESSION/s);
});

test('dépendance externe réelle → signalée FRAGILE (avertissement, non bloquant seul)', () => {
  const tmp = path.join(os.tmpdir(), 'cov-fragile.json');
  fs.writeFileSync(tmp, JSON.stringify({
    back: [{ id: 'geo', endpoint: 'POST /geocode', niveau: 'integration', tests: ['t::geo'], deps_externes_reelles: true }],
    front: [], non_testable: []
  }));
  const r = run(['--manifest', tmp]);
  assert.equal(r.status, 0, 'un fragile seul n\'est pas bloquant');
  assert.match(r.stdout, /fragile/i);
  assert.match(r.stdout, /mocker au bon point de couture/);
});
