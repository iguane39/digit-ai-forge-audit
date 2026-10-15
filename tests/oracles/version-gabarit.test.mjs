// TF-1820 — la version d'un gabarit monte quand son contenu change : cas ROUGES et cas VERTS.
// Les cas jouent sur une COPIE des gabarits ; le dépôt n'est jamais modifié par ce test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TPL_DIR, controler, majReference } from '../../tools/verifier-gabarits.mjs';

const CIBLE = 'rapport-audit.template.md';
function copie() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'tf1820-'));
  fs.cpSync(TPL_DIR, d, { recursive: true });
  return d;
}
const lit = (d) => fs.readFileSync(path.join(d, CIBLE), 'utf8');
const ecrit = (d, t) => fs.writeFileSync(path.join(d, CIBLE), t, 'utf8');
const avec = (fn) => { const d = copie(); try { fn(d); } finally { fs.rmSync(d, { recursive: true, force: true }); } };

test('TF-1820 VERT — dépôt réel : chaque gabarit est cohérent avec la référence', () => {
  assert.deepEqual(controler(), []);
});

test('TF-1820 VERT — gabarit inchangé : PASS', () => avec((d) => assert.deepEqual(controler(d), [])));

test('TF-1820 ROUGE — contenu modifié, version inchangée : FAIL nommant le gabarit', () => avec((d) => {
  ecrit(d, lit(d) + '\nLigne ajoutée sans montée de version.\n');
  const e = controler(d);
  assert.equal(e.length, 1);
  assert.match(e[0], new RegExp(`^${CIBLE} : contenu modifié sans montée de version`));
  assert.ok(majReference(d).refus.length, '--maj doit refuser de blanchir ce cas');
}));

test('TF-1820 ROUGE — version montée mais référence non mise à jour : FAIL', () => avec((d) => {
  ecrit(d, lit(d).replace('version du gabarit 1.0.0', 'version du gabarit 1.1.0'));
  assert.match(controler(d)[0], /référence non mise à jour/);
}));

test('TF-1820 ROUGE — version en baisse : FAIL', () => avec((d) => {
  ecrit(d, lit(d).replace('version du gabarit 1.0.0', 'version du gabarit 1.1.0'));
  assert.equal(majReference(d).refus.length, 0);
  ecrit(d, lit(d).replace('version du gabarit 1.1.0', 'version du gabarit 1.0.5') + '\nx\n');
  assert.ok(controler(d).length > 0);
}));

test('TF-1820 VERT — modifié + version montée + référence à jour : PASS', () => avec((d) => {
  ecrit(d, lit(d).replace('version du gabarit 1.0.0', 'version du gabarit 1.1.0') + '\nLigne ajoutée.\n');
  assert.deepEqual(majReference(d).refus, []);
  assert.deepEqual(controler(d), []);
}));

test('TF-1820 ROUGE — gabarit nouveau absent de la référence : FAIL', () => avec((d) => {
  fs.copyFileSync(path.join(d, CIBLE), path.join(d, 'nouveau.template.md'));
  assert.match(controler(d)[0], /nouveau\.template\.md : absent/);
}));
