// TF-2089 (RÉCIDIVE de TF-1181) — `node tools/init-audit-workspace.mjs --help` a pris « --help » pour
// le dossier cible : il a créé un dossier nommé « --help » (avec ses .gitkeep et son README) dans le
// dépôt, au lieu d'afficher l'usage. L'outil lisait `process.argv[2]` tel quel. Un argument qui
// commence par « - » est une option, jamais un dossier : l'outil l'écarte et dit l'usage.
//
// Les outils qui prennent un dossier cible POSITIONNEL sont deux : `tools/init-audit-workspace.mjs`
// et sa version autonome `init-audit-workspace-standalone.mjs`, que `tools/build-kit.mjs` écrit dans
// le kit d'audit et qui ne peut rien importer (le kit est remis sans dépôt). La garde est donc un
// facteur commun dans `tools/lib.mjs` (`dossierCibleOuUsage`) pour le premier, et la même règle est
// inscrite dans le texte généré du second : les deux sont jouées ici, chacune à double sens.
//
// Lancer : node --test tests/oracles/outils-dossier-cible.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const INIT = path.join(RACINE, 'tools', 'init-audit-workspace.mjs');
const BUILD_KIT = path.join(RACINE, 'tools', 'build-kit.mjs');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');

/** Joue un outil DANS un dossier vide : toute création sauvage s'y verrait. */
function jouerDansUnDossierVide(script, ...args) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cible-'));
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd });
  return { r, cwd, contenu: fs.readdirSync(cwd) };
}

// Lecteur ZIP minimal (format de tools/ziplib.mjs : en-têtes locaux séquentiels).
function lireZip(buf) {
  const out = [];
  let o = 0;
  while (o + 4 <= buf.length && buf.readUInt32LE(o) === 0x04034b50) {
    const method = buf.readUInt16LE(o + 8);
    const compSize = buf.readUInt32LE(o + 18);
    const nameLen = buf.readUInt16LE(o + 26);
    const extraLen = buf.readUInt16LE(o + 28);
    const name = buf.toString('utf8', o + 30, o + 30 + nameLen);
    const dataStart = o + 30 + nameLen + extraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    out.push({ name, data: method === 8 ? inflateRawSync(raw) : Buffer.from(raw) });
    o = dataStart + compSize;
  }
  return out;
}

const nettoyer = (...dossiers) => { for (const d of dossiers) fs.rmSync(d, { recursive: true, force: true }); };

test('TF-2089 — init-audit-workspace --help (ou -h) affiche l\'usage et ne crée AUCUN dossier', () => {
  for (const option of ['--help', '-h']) {
    const { r, cwd, contenu } = jouerDansUnDossierVide(INIT, option);
    try {
      assert.equal(r.status, 0, `« ${option} » : exit ${r.status} : ${r.stderr}`);
      assert.match(r.stdout, /Usage: node tools\/init-audit-workspace\.mjs/, `« ${option} » : l'usage n'est pas affiché`);
      assert.deepEqual(contenu, [], `l'outil a créé ${JSON.stringify(contenu)} dans le dossier courant : « ${option} » pris pour un dossier`);
    } finally { nettoyer(cwd); }
  }
});

test('TF-2089 — toute autre option passée à la place du dossier est refusée (exit 2, usage, rien de créé)', () => {
  for (const option of ['--tenant', '--dry-run', '-x']) {
    const { r, cwd, contenu } = jouerDansUnDossierVide(INIT, option);
    try {
      assert.equal(r.status, 2, `« ${option} » : exit ${r.status} au lieu de 2`);
      assert.match(r.stderr, /Usage: node tools\/init-audit-workspace\.mjs/, `« ${option} » : l'usage n'est pas dit`);
      assert.match(r.stderr, new RegExp(`« ${option} » refusé comme dossier cible`), `« ${option} » : le refus ne dit pas pourquoi`);
      assert.deepEqual(contenu, [], `« ${option} » a créé ${JSON.stringify(contenu)}`);
    } finally { nettoyer(cwd); }
  }
});

test('TF-2089 — sens vert : un vrai dossier cible est toujours initialisé, et sans argument l\'usage sort en 2', () => {
  const { r, cwd } = jouerDansUnDossierVide(INIT, 'mon-audit', '--tenant', TENANT);
  try {
    assert.equal(r.status, 0, `exit ${r.status} : ${r.stderr}`);
    assert.ok(fs.existsSync(path.join(cwd, 'mon-audit', 'input', '00 - Cadrage', '.gitkeep')), 'l\'espace n\'a pas été créé');
    assert.ok(fs.existsSync(path.join(cwd, 'mon-audit', 'README.md')));
    assert.deepEqual(fs.readdirSync(cwd), ['mon-audit'], 'un dossier de trop a été créé à côté de la cible');
  } finally { nettoyer(cwd); }
  const sans = jouerDansUnDossierVide(INIT);
  try {
    assert.equal(sans.r.status, 2);
    assert.match(sans.r.stderr, /Usage:/);
    assert.deepEqual(sans.contenu, []);
  } finally { nettoyer(sans.cwd); }
});

test('TF-2089 — le facteur commun de lib.mjs : une option est écartée, un dossier passe', async () => {
  const { dossierCibleOuUsage } = await import(`file:///${path.join(RACINE, 'tools', 'lib.mjs').replace(/\\/g, '/')}`);
  assert.equal(dossierCibleOuUsage('mon-dossier', 'Usage: x'), 'mon-dossier');
  assert.equal(dossierCibleOuUsage('C:\\audits\\a-b', 'Usage: x'), 'C:\\audits\\a-b');
  assert.equal(dossierCibleOuUsage('./-etrange', 'Usage: x'), './-etrange', 'un chemin qui CONTIENT « - » sans le commencer est un dossier');
});

test('TF-2089 — la version autonome du kit d\'audit applique la même garde (--help : usage, rien de créé ; dossier : créé)', () => {
  const sortie = fs.mkdtempSync(path.join(os.tmpdir(), 'cible-kit-'));
  try {
    const b = spawnSync(process.execPath, [BUILD_KIT, TENANT, '--kind', 'audit', '--out', sortie], { encoding: 'utf8', cwd: RACINE });
    assert.equal(b.status, 0, `fabrication du kit rouge : ${b.stdout}${b.stderr}`);
    const zip = fs.readdirSync(sortie).find((f) => f.endsWith('.zip'));
    assert.ok(zip, 'aucun kit fabriqué');
    const autonome = lireZip(fs.readFileSync(path.join(sortie, zip))).find((e) => e.name.endsWith('init-audit-workspace-standalone.mjs'));
    assert.ok(autonome, 'le kit d\'audit ne porte pas init-audit-workspace-standalone.mjs');
    const script = path.join(sortie, 'init-audit-workspace-standalone.mjs');
    fs.writeFileSync(script, autonome.data);

    for (const option of ['--help', '-h']) {
      const { r, cwd, contenu } = jouerDansUnDossierVide(script, option);
      try {
        assert.equal(r.status, 0, `« ${option} » : exit ${r.status} : ${r.stderr}`);
        assert.match(r.stdout, /Usage: node init-audit-workspace-standalone\.mjs/);
        assert.deepEqual(contenu, [], `« ${option} » a créé ${JSON.stringify(contenu)} dans le dossier courant`);
      } finally { nettoyer(cwd); }
    }
    const autre = jouerDansUnDossierVide(script, '--force');
    try {
      assert.equal(autre.r.status, 2);
      assert.match(autre.r.stderr, /« --force » refusé comme dossier cible/);
      assert.deepEqual(autre.contenu, []);
    } finally { nettoyer(autre.cwd); }

    // Sens vert : un dossier, ou rien (le dossier courant, comportement historique).
    const ok = jouerDansUnDossierVide(script, 'espace');
    try {
      assert.equal(ok.r.status, 0, ok.r.stderr);
      assert.ok(fs.existsSync(path.join(ok.cwd, 'espace', 'output', 'Old', '.gitkeep')));
    } finally { nettoyer(ok.cwd); }
    const courant = jouerDansUnDossierVide(script);
    try {
      assert.equal(courant.r.status, 0, courant.r.stderr);
      assert.deepEqual(fs.readdirSync(courant.cwd).sort(), ['input', 'output'], 'sans argument, l\'espace doit se créer dans le dossier courant');
    } finally { nettoyer(courant.cwd); }
  } finally { nettoyer(sortie); }
});
