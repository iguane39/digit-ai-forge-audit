// LA LISTE DES ORACLES DE LA FORGE SE LIT SUR LE DISQUE (TF-1319, 23/09/2026).
//
// Le juge d'enclenchement du pilot confronte ce que cette forge DÉCOUVRE aux verdicts consignés au
// ledger d'un run. Mesuré le jour de l'écriture : `oracles/` porte 12 scripts, le tableau de son
// README en décrit 9, la CI en nomme 2 — trois listes écrites à la main, aucune complète. La
// découverte les remplace, pour le juge, par une lecture du dossier. Deux sens se prouvent :
//
//   vert  · la forge découvre ses oracles sur son propre disque, au contrat
//           `digit-ai/decouverte-oracles@1` ; un script posé dans `oracles/` est découvert ; un
//           script AJOUTÉ l'est au passage suivant, sans liste à tenir ;
//   rouge · la découverte elle-même, une recette `*.test.mjs`, un sous-dossier, une fixture et un
//           vérificateur de LIVRABLES rangé sous `tools/` ne sont JAMAIS pris pour des oracles du
//           système audité ; un dépôt sans `oracles/` sort en 2 avec son motif.
//
// Lancer : node --test tests/oracles/decouvrir-oracles.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DECOUVRIR = path.join(RACINE, 'oracles', 'decouvrir-oracles.mjs');

const decouvre = (racine) => {
  const r = spawnSync(process.execPath, [DECOUVRIR, ...(racine ? ['--racine', racine] : [])], { encoding: 'utf8' });
  let j = null;
  try { j = JSON.parse(r.stdout); } catch { /* sortie illisible : les assertions la disent */ }
  return { code: r.status, j, brut: `${r.stdout}${r.stderr}` };
};

const arbre = (fichiers) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-decouverte-'));
  for (const rel of fichiers) {
    const p = path.join(d, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, '// fixture de découverte\n');
  }
  return d;
};

test('vert : la forge découvre ses oracles sur son propre disque, au contrat commun', () => {
  const r = decouvre(null);
  assert.equal(r.code, 0, r.brut);
  assert.equal(r.j.contrat, 'digit-ai/decouverte-oracles@1');
  assert.equal(r.j.forge, 'digit-ai-forge-audit');
  assert.ok(r.j.oracles.length > 0, 'aucun oracle découvert dans oracles/');
  for (const o of r.j.oracles) {
    assert.ok(fs.existsSync(path.join(RACINE, o.chemin)), `chemin rendu absent du disque : ${o.chemin}`);
    assert.match(o.chemin, /^oracles\/[^/]+\.mjs$/);
  }
  assert.ok(!r.j.oracles.some((o) => o.nom === 'decouvrir-oracles'), 'la découverte se découvre elle-même');
});

test('vert puis rouge : un script du dossier est un oracle ; recette, sous-dossier, fixture et vérificateur de livrables n\'en sont pas', () => {
  const leurres = ['oracles/decouvrir-oracles.mjs', 'oracles/verifier-x.test.mjs', 'oracles/lib/aide.mjs',
    'tests/fixtures/oracles/verifier-faux.mjs', 'tools/verifier-rapport.mjs'];
  const d = arbre(['oracles/verifier-alpha.mjs', 'oracles/smoke-beta.mjs', ...leurres]);
  try {
    const r = decouvre(d);
    assert.equal(r.code, 0, r.brut);
    assert.deepEqual(r.j.oracles.map((o) => o.nom), ['smoke-beta', 'verifier-alpha']);
    for (const l of leurres) assert.ok(!r.j.oracles.some((o) => o.chemin === l), `leurre pris pour un oracle : ${l}`);
    assert.ok(r.j.non_juge.some((n) => /tools/.test(n) && /verifier-rapport\.mjs/.test(n)),
      'le vérificateur de livrables laissé dehors n\'est pas DIT');
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

test('un oracle AJOUTÉ est découvert au passage suivant, sans liste à tenir', () => {
  const d = arbre(['oracles/verifier-alpha.mjs']);
  try {
    assert.deepEqual(decouvre(d).j.oracles.map((o) => o.nom), ['verifier-alpha']);
    fs.writeFileSync(path.join(d, 'oracles', 'verifier-gamma.mjs'), '// ajouté\n');
    assert.deepEqual(decouvre(d).j.oracles.map((o) => o.nom), ['verifier-alpha', 'verifier-gamma']);
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

test('rouge : un dépôt sans oracles/ sort en 2 avec son motif, jamais en liste vide muette', () => {
  const d = arbre(['tools/build-x.mjs']);
  try {
    const r = decouvre(d);
    assert.equal(r.code, 2, r.brut);
    assert.deepEqual(r.j.oracles, []);
    assert.match(r.j.motif, /introuvable/);
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});
