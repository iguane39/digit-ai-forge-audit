// Non-régression du JUGE DU RÉFÉRENTIEL (TF-1014). Le défaut d'origine, mesuré le 10/09/2026 :
// 17 dimensions sur 18 n'avaient dans le modèle ni thème de périmètre, ni type de preuve, ni
// livrable attendu — et le référentiel se rendait quand même, complet en apparence, parce
// qu'aucun juge ne regardait ce qu'il ne portait pas.
//
// Double sens, sur fixtures SYNTHÉTIQUES (aucune donnée réelle) :
//  · VERTE — toutes les dimensions applicables portent au moins un des trois objets, et une
//    dimension sans objet partout n'est pas jugée → PASS, exit 0, la non-jugée est DÉCLARÉE ;
//  · ROUGE — une dimension applicable n'a ni thème, ni preuve, ni livrable → FAIL, exit 1, et
//    elle est NOMMÉE ; la dimension sans objet partout ne produit AUCUN constat.
// Plus les portes d'usage : un pack absent sort 2, jamais un PASS par défaut.
//
// Lancer :  node --test tests/oracles/verifier-referentiel.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUTIL = path.join(HERE, '..', '..', 'tools', 'verifier-referentiel.mjs');
const FIX = path.join(HERE, '..', 'fixtures', 'oracles', 'referentiel');
const fixture = (couleur) => [
  '--dimensions', path.join(FIX, couleur, 'dimensions.yaml'),
  '--doctrine', path.join(FIX, couleur, 'doctrine.yaml'),
];
const run = (args) => spawnSync(process.execPath, [OUTIL, ...args], { encoding: 'utf8', timeout: 60000 });
const rapport = (r) => JSON.parse(r.stdout.slice(r.stdout.indexOf('{'), r.stdout.lastIndexOf('}') + 1));

test('référentiel vert : chaque dimension applicable porte au moins un thème, une preuve ou un livrable → PASS (exit 0)', () => {
  const r = run(fixture('verte'));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const j = rapport(r);
  assert.equal(j.oracle, 'verifier-referentiel');
  assert.equal(j.verdict, 'PASS');
  assert.deepEqual(j.findings, []);
  assert.equal(j.lu.dimensions_jugees, 2, 'la dimension sans objet partout n\'est pas jugée');
  assert.equal(j.lu.dimensions_completes, 2);
  assert.ok(Array.isArray(j.non_juge) && j.non_juge.length >= 3, 'ce qui n\'est pas jugé est déclaré');
  assert.ok(j.non_juge.some((n) => /D17/.test(n)), 'la dimension non jugée est NOMMÉE dans non_juge, pas comptée verte en silence');
});

test('référentiel rouge : une dimension applicable sans thème ni preuve ni livrable → FAIL (exit 1), dimension nommée', () => {
  const r = run(fixture('rouge'));
  assert.equal(r.status, 1, r.stdout + r.stderr);
  const j = rapport(r);
  assert.equal(j.verdict, 'FAIL');
  assert.equal(j.findings.length, 1, 'un seul constat : D17 est sans objet partout, elle ne doit pas en produire');
  const f = j.findings[0];
  assert.equal(f.regle, 'RF1');
  assert.equal(f.dimension, 'D02');
  assert.match(f.constat, /D02/, 'la dimension incomplète est nommée dans le constat');
  assert.match(f.constat, /ni thème.*ni type de preuve.*ni livrable/s);
  assert.match(r.stdout, /Dimension applicable sans doctrine/, 'le libellé de la dimension est rendu lisible');
  assert.ok(!j.findings.some((x) => x.dimension === 'D17'), 'aucune dimension sans objet partout ne produit de constat');
});

test('le même pack rouge jugé pour un type de projet où la dimension est sans objet → PASS (exit 0)', () => {
  // D02 est `off` sur `data` : pour ce type de projet, elle sort du périmètre et n'est plus jugée.
  const r = run([...fixture('rouge'), '--type', 'data']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const j = rapport(r);
  assert.equal(j.verdict, 'PASS');
  assert.equal(j.lu.type_de_projet, 'data');
  assert.ok(j.non_juge.some((n) => /D02/.test(n)), 'la dimension sortie du périmètre est déclarée non jugée');
});

test('usage : pack de doctrine absent → exit 2, jamais un PASS par défaut', () => {
  const r = run(['--dimensions', path.join(FIX, 'verte', 'dimensions.yaml'), '--doctrine', path.join(FIX, 'inexistant.yaml')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /introuvable/);
});

test('usage : type de projet inconnu → exit 2', () => {
  const r = run([...fixture('verte'), '--type', 'quantique']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /type de projet inconnu/);
});
