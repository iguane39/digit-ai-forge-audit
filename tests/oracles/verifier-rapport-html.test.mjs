// Non-régression du vérificateur de RENDU (ECR-02) : le contrôle est EXÉCUTÉ, pas statique.
// Un rapport dont le moteur ne compile pas, lève à l'initialisation, ou casse au clic d'un
// onglet passe TOUS les contrôles de chaînes — et se diffuserait. Ces cas doivent sortir 1.
//
// Les fixtures sont dérivées d'un rapport RÉELLEMENT généré (pas d'un HTML écrit à la main) :
// le test échoue donc aussi si le moteur de rendu cesse d'émettre un moteur JS pilotable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const TOOL = path.join(ROOT, 'tools', 'verifier-rapport-html.mjs');
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 60000, maxBuffer: 1e8 });

// Rapport de référence : produit par le moteur, comme en production.
const REF = path.join(os.tmpdir(), 'ecr02-rapport.html');
const gen = node([path.join(ROOT, 'tools', 'build-rapport.mjs'),
  path.join(ROOT, 'tests', 'fixtures', 'rapport-data-valid.json'),
  '--tenant', path.join(ROOT, 'config', 'tenants', 'exemple', 'tenant.yaml'), '--out', REF]);
assert.equal(gen.status, 0, 'le rapport de référence doit se générer : ' + gen.stderr);
const OK = fs.readFileSync(REF, 'utf8');

/** Écrit une variante du rapport dont le moteur JS est saboté, et la vérifie. */
const variante = (nom, muter) => {
  const p = path.join(os.tmpdir(), `ecr02-${nom}.html`);
  fs.writeFileSync(p, muter(OK), 'utf8');
  return node([TOOL, p]);
};

test('rapport intact → diffusable (exit 0), moteur compilé, exécuté et onglets pilotés', () => {
  const r = node([TOOL, REF]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /COMPILÉ et EXÉCUTÉ/);
  assert.match(r.stdout, /onglets pilotés/);
});

test('moteur qui ne COMPILE pas (accolade manquante) → exit 1', () => {
  const r = variante('syntax', (h) => h.replace('function tab(k,btn){', 'function tab(k,btn){ if(true{ '));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ne compile pas/);
});

test("moteur qui lève à l'INITIALISATION (ReferenceError) → exit 1", () => {
  const r = variante('init', (h) => h.replace('<script>\n', '<script>\nvariableJamaisDefinie.appel();\n'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /lève à l'initialisation/);
});

test('moteur qui casse AU CLIC d\'un onglet → exit 1 (invisible pour un contrôle statique)', () => {
  const r = variante('clic', (h) => h.replace('function tab(k,btn){', 'function tab(k,btn){ null.x; '));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /au clic/);
});

test('rapport sans moteur JS du tout → exit 1 (rapport inerte)', () => {
  const r = variante('inerte', (h) => h.replace(/<script>[\s\S]*?<\/script>/, ''));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /aucun moteur JS exploitable|navigation/);
});
