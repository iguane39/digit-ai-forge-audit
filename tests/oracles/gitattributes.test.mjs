// TF-1276 (02/10/2026) — le dépôt n'avait AUCUN fichier de déclaration des fins de ligne alors
// que le poste de travail est sous Windows avec `core.autocrlf=true` : deux clones aux réglages
// différents (ce poste vs un runner Linux) peuvent finir avec des copies de travail DIFFÉRENTES
// pour le MÊME contenu versionné, et `git status` reste muet. Même piège que celui payé le même
// jour (20/09/2026) chez le dépôt frère digit-ai-forge-agents (8 copies de travail réécrites en
// CRLF). La preuve ne porte pas sur le contenu d'un fichier (git rend LF des deux côtés quel que
// soit l'OS une fois l'attribut posé) : elle porte sur le fait que `git check-attr` RÉSOUT bien
// `eol=lf` pour les extensions sensibles, et ne force RIEN sur les .json (même convention que le
// dépôt frère : des outils tiers peuvent les écrire en CRLF).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function checkAttr(fichier) {
  const sortie = execFileSync('git', ['check-attr', '--all', '--', fichier], { cwd: RACINE, encoding: 'utf8' });
  const attrs = {};
  for (const ligne of sortie.split(/\r?\n/)) {
    const m = /^.*:\s*(\S+):\s*(\S+)$/.exec(ligne);
    if (m) attrs[m[1]] = m[2];
  }
  return attrs;
}

test('TF-1276 — le dépôt déclare un .gitattributes', () => {
  assert.ok(fs.existsSync(path.join(RACINE, '.gitattributes')), '.gitattributes doit exister à la racine du dépôt');
});

test('TF-1276 — les extensions sensibles (scripts, fixtures SQL/YAML, pages) sont forcées en LF', () => {
  for (const f of ['tools/verifier.mjs', 'oracles/README.md', 'profiles/policy-as-code/policy/budget.rego']) {
    const a = checkAttr(f);
    assert.equal(a.text, 'set', `${f} doit être déclaré texte`);
    assert.equal(a.eol, 'lf', `${f} doit être forcé en LF des deux côtés`);
  }
});

test('TF-1276 — les .json ne sont PAS forcés (même convention que digit-ai-forge-agents : des outils tiers les écrivent en CRLF)', () => {
  const a = checkAttr('HERITAGE.json');
  assert.equal(a.eol, undefined, 'HERITAGE.json ne doit porter aucun eol imposé');
});
