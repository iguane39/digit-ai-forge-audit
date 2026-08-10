// Non-régression de l'oracle de round-trip (prompt : reintegration-modifications-fiche-securite).
// Loi qualité : régénérer un livrable doit reproduire la version validée à l'identique (hors version) ;
// sinon une édition faite en aval sur la sortie est perdue → la génération détruit du travail.
//
// Lancer :  node --test __tests__/roundtrip.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOL = path.join(HERE, '..', '..', 'oracles', 'verifier-roundtrip.mjs');
const FIX = path.join(HERE, '..', 'fixtures', 'oracles', 'roundtrip');
const IGN = 'ACME-SEC-DEV-[0-9]{8}[a-z]?';
const run = (args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', timeout: 60000, maxBuffer: 1e8 });
const ref = path.join(FIX, 'ref.html');

test('round-trip OK : régénérée identique à la validée (hors référence de version) → exit 0', () => {
  const r = run(['--reference', ref, '--candidate', path.join(FIX, 'cand-ok.html'), '--ignore', IGN]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Round-trip vérifié/);
});

test('round-trip CASSÉ : un delta (note PII) manque dans la régénérée → exit 1, delta nommé', () => {
  const r = run(['--reference', ref, '--candidate', path.join(FIX, 'cand-delta.html'), '--ignore', IGN]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ROUND-TRIP CASSÉ/);
  assert.match(r.stdout, /Note PII/);
  assert.match(r.stdout, /réinjecter chaque delta dans la SOURCE/i);
});

test('placeholder résiduel dans la sortie → exit 1 (valeur non pilotée par les données)', () => {
  const r = run(['--reference', ref, '--candidate', path.join(FIX, 'cand-placeholder.html'), '--ignore', IGN]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /PLACEHOLDERS résiduels/);
  assert.match(r.stdout, /\{\{REF_FICHE\}\}/);
});

test('garde anti-écrasement : nouvelle sortie ≠ dernière livrée → exit 1, message anti-écrasement', () => {
  const r = run(['--guard', '--reference', ref, '--candidate', path.join(FIX, 'cand-delta.html'), '--ignore', IGN]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /GARDE ANTI-ÉCRASEMENT/);
  assert.match(r.stdout, /ne sont PAS reprises dans la source/);
});
