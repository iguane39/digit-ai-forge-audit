// TF-1376 (02/10/2026) — .github/workflows/ci.yml nommait « 162 tests » EN DUR dans le libellé
// de l'étape « Batterie des oracles » : la même famille de défaut que le « 41 tests » du README
// corrigé par TF-1332 (oracles/README.md) — un compte écrit à la main périme dès le prochain
// fichier de test ajouté sous tests/oracles/, sans qu'aucune recette ne le voie. Le compte réel
// se lit dans le résumé que `node --test` imprime lui-même en fin de run, jamais dans un libellé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CI = fs.readFileSync(path.join(RACINE, '.github', 'workflows', 'ci.yml'), 'utf8');

test('TF-1376 — le libellé de l\'étape « Batterie des oracles » ne porte plus de compte écrit en dur', () => {
  const ligne = CI.split(/\r?\n/).find((l) => /name:\s*Batterie des oracles/.test(l));
  assert.ok(ligne, 'l\'étape « Batterie des oracles » doit exister dans le workflow');
  assert.doesNotMatch(ligne, /\d+\s*tests?\b/i,
    `le libellé porte encore un compte écrit à la main, voué à périmer au prochain test ajouté : ${ligne}`);
});

test('TF-1376 — le compte se lit dans le résumé node --test, jamais en dur dans le workflow', () => {
  assert.match(CI, /node --test/, 'le workflow doit toujours exécuter la batterie via node --test (sa sortie porte le compte)');
});
