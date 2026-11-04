// TF-2104 — la batterie d'intégration continue doit nommer CHAQUE fichier de tests/oracles/.
// Relevé du 03/11/2026 : sept fichiers (build-kit-compliance-fiche, ci-workflow-labels, gitattributes,
// methode-audit-capture, onboarding-doc, rapport-socle-page, verifier-schema-modele) existaient sous
// tests/oracles/ sans figurer dans l'étape « Batterie des oracles » de .github/workflows/ci.yml : ils
// passaient en local, jamais sur le runner, et leur régression n'aurait rien fait rougir. La liste de
// la CI est écrite à la main (TF-0553 : `npm test` la relit, il ne la recopie pas) ; elle dérive donc
// au premier fichier ajouté sans qu'on pense à l'y inscrire. Ce contrôle ferme la dérive : un fichier
// de test absent du workflow fait échouer la recette, et le message dit lequel.
//
// Un nom cité seulement dans un COMMENTAIRE du workflow ne compte pas : il n'est pas joué.
//
// Lancer : node --test tests/oracles/batterie-ci-complete.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Les fichiers `*.test.mjs` de `tests/oracles/` que le workflow de `racine` ne joue pas. */
function absentsDeLaBatterie(racine) {
  const surDisque = fs.readdirSync(path.join(racine, 'tests', 'oracles')).filter((f) => f.endsWith('.test.mjs')).sort();
  const workflow = fs.readFileSync(path.join(racine, '.github', 'workflows', 'ci.yml'), 'utf8');
  const joue = workflow.split(/\r?\n/).filter((l) => !/^\s*#/.test(l)).join('\n');
  const nommes = new Set([...joue.matchAll(/tests\/oracles\/([A-Za-z0-9._-]+\.test\.mjs)/g)].map((m) => m[1]));
  return { surDisque, absents: surDisque.filter((f) => !nommes.has(f)) };
}

/** Une racine factice : les fichiers de test déclarés, et le texte du workflow donné. */
function racineFactice(fichiers, workflow) {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'batterie-ci-'));
  fs.mkdirSync(path.join(racine, 'tests', 'oracles'), { recursive: true });
  fs.mkdirSync(path.join(racine, '.github', 'workflows'), { recursive: true });
  for (const f of fichiers) fs.writeFileSync(path.join(racine, 'tests', 'oracles', f), '// fixture\n');
  fs.writeFileSync(path.join(racine, '.github', 'workflows', 'ci.yml'), workflow);
  return racine;
}

const nettoyer = (d) => fs.rmSync(d, { recursive: true, force: true });

test('TF-2104 — fixture VERTE : tous les fichiers sont nommés dans le run de la batterie, aucun absent', () => {
  const racine = racineFactice(['a.test.mjs', 'b.test.mjs'],
    'jobs:\n  oracles:\n    steps:\n      - run: node --test tests/oracles/a.test.mjs tests/oracles/b.test.mjs\n');
  try {
    assert.deepEqual(absentsDeLaBatterie(racine).absents, []);
  } finally { nettoyer(racine); }
});

test('TF-2104 — fixture ROUGE : un fichier de tests/oracles/ que le workflow ne nomme pas est rendu absent', () => {
  const racine = racineFactice(['a.test.mjs', 'b.test.mjs'],
    'jobs:\n  oracles:\n    steps:\n      - run: node --test tests/oracles/a.test.mjs\n');
  try {
    assert.deepEqual(absentsDeLaBatterie(racine).absents, ['b.test.mjs']);
  } finally { nettoyer(racine); }
});

test('TF-2104 — fixture ROUGE : un nom cité seulement dans un commentaire du workflow n\'est pas joué', () => {
  const racine = racineFactice(['a.test.mjs', 'b.test.mjs'],
    'jobs:\n  oracles:\n    steps:\n      # tests/oracles/b.test.mjs viendra plus tard\n'
    + '      - run: node --test tests/oracles/a.test.mjs\n');
  try {
    assert.deepEqual(absentsDeLaBatterie(racine).absents, ['b.test.mjs']);
  } finally { nettoyer(racine); }
});

test('TF-2104 — fixture ROUGE : un nom qui n\'est que le préfixe d\'un autre ne vaut pas le fichier', () => {
  const racine = racineFactice(['a.test.mjs', 'a.test.mjs.bak.test.mjs'],
    'jobs:\n  oracles:\n    steps:\n      - run: node --test tests/oracles/a.test.mjs\n');
  try {
    assert.deepEqual(absentsDeLaBatterie(racine).absents, ['a.test.mjs.bak.test.mjs']);
  } finally { nettoyer(racine); }
});

test('TF-2104 — le dépôt : chaque fichier de tests/oracles/ est joué par la batterie de la CI', () => {
  const { surDisque, absents } = absentsDeLaBatterie(RACINE);
  assert.ok(surDisque.length > 0, 'aucun fichier de test trouvé sous tests/oracles/ : le contrôle ne juge rien');
  assert.deepEqual(absents, [],
    `${absents.length} fichier(s) de tests/oracles/ sur ${surDisque.length} absent(s) de l'étape « Batterie des oracles » `
    + `de .github/workflows/ci.yml : ${absents.join(', ')}. Les ajouter à la commande \`node --test\` (un test rouge `
    + 'ne s\'ajoute pas en le neutralisant : le diagnostiquer).');
});
