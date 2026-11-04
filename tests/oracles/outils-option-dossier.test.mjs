// TF-2105 (variante de TF-2089) — la VALEUR d'une option de dossier ne doit pas être une autre option.
// `node tools/build-kit.mjs <tenant> --out --dry-run` créait un dossier nommé « --dry-run » et y rendait
// le kit ; `node tools/build-theme.mjs <tenant> --out --dry-run` aussi ; `node tools/forge-adapter.mjs
// <actions> --out -x` aurait écrit son arborescence dans un dossier « -x ». Les outils lisaient
// `process.argv[indexOf('--out') + 1]` tel quel. Une valeur absente ou qui commence par « - » est
// refusée (sortie 2, motif et usage dits), rien n'est créé.
//
// Périmètre : les options dont la valeur est un DOSSIER créé par l'outil — `--out` de build-kit.mjs,
// de build-theme.mjs et de forge-adapter.mjs (`--out <repo-cible>`). Les `--out <fichier>` des autres
// outils nomment un fichier, pas un dossier : ils sont hors de cette garde (voir le rapport de TF-2105).
// `--produit <racine>` de build-fiche.mjs refusait déjà une racine inexistante : sens vert joué ici
// pour qu'il ne régresse pas.
//
// Chaque outil est joué DANS un dossier vide : toute création sauvage s'y verrait.
//
// Lancer : node --test tests/oracles/outils-option-dossier.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outil = (n) => path.join(RACINE, 'tools', n);
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const ACTIONS = path.join(RACINE, 'tests', 'fixtures', 'remediation-actions.example.yaml');

/** Les trois outils à option de dossier, avec leurs arguments de base (avant `--out`). */
const OUTILS = [
  { nom: 'build-kit', script: outil('build-kit.mjs'), base: [TENANT, '--kind', 'compliance'] },
  { nom: 'build-theme', script: outil('build-theme.mjs'), base: [TENANT] },
  { nom: 'forge-adapter', script: outil('forge-adapter.mjs'), base: [ACTIONS] },
];

function jouerDansUnDossierVide(script, ...args) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'option-dossier-'));
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd, timeout: 120000 });
  return { r, cwd, contenu: fs.readdirSync(cwd) };
}
const nettoyer = (d) => fs.rmSync(d, { recursive: true, force: true });

test('TF-2105 — une valeur de --out qui commence par « - » est refusée (exit 2, motif, usage) et RIEN n\'est créé', () => {
  for (const o of OUTILS) {
    for (const valeur of ['--dry-run', '-x']) {
      const { r, cwd, contenu } = jouerDansUnDossierVide(o.script, ...o.base, '--out', valeur);
      try {
        assert.equal(r.status, 2, `${o.nom} --out ${valeur} : exit ${r.status} au lieu de 2 (${r.stderr})`);
        assert.match(r.stderr, new RegExp(`« ${valeur} » refusé comme dossier`), `${o.nom} --out ${valeur} : le refus ne dit pas pourquoi`);
        assert.match(r.stderr, /Usage: node tools\//, `${o.nom} --out ${valeur} : l'usage n'est pas dit`);
        assert.deepEqual(contenu, [], `${o.nom} --out ${valeur} a créé ${JSON.stringify(contenu)} dans le dossier courant`);
      } finally { nettoyer(cwd); }
    }
  }
});

test('TF-2105 — --out sans valeur (dernier argument) est refusé de la même façon, sans trace d\'exception', () => {
  for (const o of OUTILS) {
    const { r, cwd, contenu } = jouerDansUnDossierVide(o.script, ...o.base, '--out');
    try {
      assert.equal(r.status, 2, `${o.nom} --out seul : exit ${r.status} au lieu de 2 (${r.stderr})`);
      assert.match(r.stderr, /--out/, `${o.nom} : le refus ne nomme pas l'option`);
      assert.match(r.stderr, /Usage: node tools\//, `${o.nom} : l'usage n'est pas dit`);
      assert.doesNotMatch(r.stderr, /TypeError|at .*\.mjs:\d+/, `${o.nom} : une exception brute s'affiche au lieu du refus`);
      assert.deepEqual(contenu, [], `${o.nom} --out seul a créé ${JSON.stringify(contenu)}`);
    } finally { nettoyer(cwd); }
  }
});

test('TF-2105 — sens vert : un vrai dossier derrière --out est créé et rempli par chacun des trois outils', () => {
  const attendu = {
    'build-kit': (d) => fs.readdirSync(d).some((f) => f.endsWith('.zip')),
    'build-theme': (d) => fs.existsSync(path.join(d, 'theme.css')) && fs.existsSync(path.join(d, 'header.html')),
    'forge-adapter': (d) => fs.existsSync(path.join(d, 'plan-remediation.md')),
  };
  for (const o of OUTILS) {
    const { r, cwd } = jouerDansUnDossierVide(o.script, ...o.base, '--out', 'sortie-ok');
    try {
      assert.equal(r.status, 0, `${o.nom} --out sortie-ok : exit ${r.status} : ${r.stderr}`);
      assert.deepEqual(fs.readdirSync(cwd), ['sortie-ok'], `${o.nom} : un dossier de trop ou un manquant`);
      assert.ok(attendu[o.nom](path.join(cwd, 'sortie-ok')), `${o.nom} : le dossier de sortie est vide de ce qu'il doit porter`);
    } finally { nettoyer(cwd); }
  }
});

test('TF-2105 — forge-adapter : --dry-run reste honoré avec un dossier valide, et n\'écrit rien', () => {
  const { r, cwd, contenu } = jouerDansUnDossierVide(outil('forge-adapter.mjs'), ACTIONS, '--out', 'cible', '--dry-run');
  try {
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /\[dry-run\]/);
    assert.deepEqual(contenu, [], 'le dry-run a écrit dans le dossier courant');
  } finally { nettoyer(cwd); }
});

test('TF-2105 — build-fiche --produit : une valeur qui commence par « - » reste refusée, rien n\'est créé', () => {
  const { r, cwd, contenu } = jouerDansUnDossierVide(outil('build-fiche.mjs'), TENANT, '--produit', '--sans-pdf');
  try {
    assert.equal(r.status, 2, `exit ${r.status} : ${r.stderr}`);
    assert.deepEqual(contenu, [], `build-fiche a créé ${JSON.stringify(contenu)}`);
  } finally { nettoyer(cwd); }
});

test('TF-2105 — le facteur commun de lib.mjs : option absente → undefined, dossier → rendu tel quel', async () => {
  const { valeurDossierOuUsage } = await import(`file:///${path.join(RACINE, 'tools', 'lib.mjs').replace(/\\/g, '/')}`);
  assert.equal(valeurDossierOuUsage(['x.yaml', '--kind', 'audit'], '--out', 'Usage: x'), undefined, 'option absente : pas de valeur');
  assert.equal(valeurDossierOuUsage(['x.yaml', '--out', 'mon-dossier'], '--out', 'Usage: x'), 'mon-dossier');
  assert.equal(valeurDossierOuUsage(['x.yaml', '--out', 'C:\\audits\\a-b'], '--out', 'Usage: x'), 'C:\\audits\\a-b');
  assert.equal(valeurDossierOuUsage(['x.yaml', '--out', './-etrange'], '--out', 'Usage: x'), './-etrange',
    'un chemin qui CONTIENT « - » sans le commencer est un dossier');
});
