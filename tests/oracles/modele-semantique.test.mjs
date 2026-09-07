// Non-régression du contrôle d'audit 8 : modèle sémantique Power BI jugé sur ses fichiers TMDL
// (TF-0862, lot L5 de l'étude d'opportunité du pilot du 07/09/2026). Double sens : la fixture
// verte (étoile à trois tables, table de dates marquée, une relation active par paire, modes
// homogènes, un rôle) rend OK ; la fixture rouge (mesure dupliquée entre deux tables, deux
// relations actives sur la même paire, relation vers une table absente, filtrage bidirectionnel,
// aucune table de dates, partition sans mode, modes hétérogènes, aucun rôle) rend BLOQUANT en
// nommant CHAQUE règle MS1-MS6 sauf MS1 (le modèle rouge a bien des tables et des relations).
//
// Lancer :  node --test tests/oracles/modele-semantique.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ORACLE = path.join(HERE, '..', '..', 'oracles', 'verifier-modele-semantique.mjs');
const FIX = path.join(HERE, '..', 'fixtures', 'oracles', 'modele-semantique');
const run = (args) => spawnSync(process.execPath, [ORACLE, ...args], { encoding: 'utf8', timeout: 60000 });
const rapport = (r) => JSON.parse(r.stdout.slice(0, r.stdout.lastIndexOf('}') + 1));

test('modèle sémantique vert : étoile lisible, table de dates marquée, une mesure par nom, un rôle → OK (exit 0)', () => {
  const r = run(['--modele', path.join(FIX, 'verte')]);
  assert.equal(r.status, 0, r.stdout);
  const j = rapport(r);
  assert.equal(j.verdict, 'OK');
  assert.equal(j.lu.tables, 3);
  assert.equal(j.lu.relations, 2);
  assert.equal(j.lu.roles, 1);
  assert.ok(Array.isArray(j.non_juge) && j.non_juge.length >= 3, 'ce qui n\'est pas jugé est déclaré');
});

test('modèle sémantique rouge : mesure dupliquée, relations ambiguës, pas de table de dates, mode absent, aucun rôle → BLOQUANT (exit 1)', () => {
  const r = run(['--modele', path.join(FIX, 'rouge')]);
  assert.equal(r.status, 1);
  const j = rapport(r);
  assert.equal(j.verdict, 'BLOQUANT');
  const regles = new Set(j.findings.map(f => f.regle));
  for (const attendue of ['MS2', 'MS3', 'MS4', 'MS5', 'MS6']) assert.ok(regles.has(attendue), `règle ${attendue} attendue dans les constats`);
  assert.match(r.stdout, /Montant HT/, 'la mesure dupliquée est nommée');
  assert.match(r.stdout, /deux relations ACTIVES/, 'l\'ambiguïté de chemin est nommée');
  assert.match(r.stdout, /Produit\.produit_sk/, 'la relation vers une table absente est localisée');
  assert.match(r.stdout, /CTL-D05-13/, 'chaque règle nomme le contrôle AuditCore qu\'elle mécanise');
});

test('usage : dossier absent → exit 2, jamais un OK par défaut', () => {
  const r = run(['--modele', path.join(FIX, 'inexistant')]);
  assert.equal(r.status, 2);
});
