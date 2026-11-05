// TF-2131 (suite de TF-2105 et TF-2089) — la VALEUR d'une option de FICHIER ne doit pas être une autre option.
// Relevé d'une campagne du 04/11/2026 : `node tools/build-catalogue.mjs <tenant> --out --dry-run` écrivait un
// fichier littéralement nommé « --dry-run » ; une quinzaine d'outils lisaient `process.argv[indexOf('--out') + 1]`
// (ou un `opt()` équivalent) sans rien refuser. TF-2105 avait traité les options de DOSSIER (`--out` de
// build-kit, build-theme, forge-adapter) avec `valeurDossierOuUsage` ; celle-ci est étendue aux options de
// FICHIER (`--out`, `--tenant`, `--data`, `--status`, `--manifest`…), et les oracles de `oracles/`, autoportants
// et embarqués dans le kit, portent la même règle en ligne. Une valeur absente ou qui commence par « - » est
// refusée (sortie 2 — 3 pour smoke-parcours, dont c'est le code d'usage —, motif et usage dits), rien n'est créé.
//
// Chaque outil est joué DANS un dossier vide : toute création sauvage s'y verrait. La table couvre toutes les
// formes de lecture d'option rencontrées : `process.argv.indexOf` (build-*), `flag()` (merge-packs), `opt()` en
// ligne de commande (importer-doctrine, verifier-*), `args.indexOf` des oracles autoportants.
//
// Lancer : node --test tests/oracles/outils-option-fichier.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tool = (n) => path.join(RACINE, 'tools', n);
const oracle = (n) => path.join(RACINE, 'oracles', n);
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const DATA = path.join(RACINE, 'tests', 'fixtures', 'rapport-data-valid.json');
const FICHIER = TENANT;                       // n'importe quel fichier existant : le refus précède toute lecture
const DOSSIER_VIDE = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-projet-'));   // pour les oracles à dossier positionnel

/** [nom, script, arguments avant l'option, option, code d'usage attendu] */
const CAS = [
  ['build-banc', tool('build-banc.mjs'), [TENANT], '--out', 2],
  ['build-catalogue', tool('build-catalogue.mjs'), [TENANT], '--out', 2],
  ['build-referentiel', tool('build-referentiel.mjs'), [TENANT], '--out', 2],
  ['build-fiche --out', tool('build-fiche.mjs'), [TENANT, '--sans-pdf'], '--out', 2],
  ['build-fiche --data', tool('build-fiche.mjs'), [TENANT, '--out', 'f.html', '--sans-pdf'], '--data', 2],
  ['build-rapport --out', tool('build-rapport.mjs'), [DATA, '--tenant', TENANT], '--out', 2],
  ['build-rapport --tenant', tool('build-rapport.mjs'), [DATA], '--tenant', 2],
  ['build-slides --out', tool('build-slides.mjs'), [DATA, '--tenant', TENANT], '--out', 2],
  ['build-slides --tenant', tool('build-slides.mjs'), [DATA], '--tenant', 2],
  ['init-audit-workspace --tenant', tool('init-audit-workspace.mjs'), ['cible'], '--tenant', 2],
  ['merge-packs --out', tool('merge-packs.mjs'), [TENANT], '--out', 2],
  ['merge-packs --baseline', tool('merge-packs.mjs'), ['--derive-pack'], '--baseline', 2],
  ['importer-doctrine --out', tool('importer-doctrine.mjs'), [FICHIER], '--out', 2],
  ['importer-doctrine --ecart', tool('importer-doctrine.mjs'), [FICHIER], '--ecart', 2],
  ['importer-doctrine --ecarts-md', tool('importer-doctrine.mjs'), [FICHIER], '--ecarts-md', 2],
  ['verifier-rapport --tenant', tool('verifier-rapport.mjs'), [DATA], '--tenant', 2],
  ['verifier-remediation --status', tool('verifier-remediation.mjs'), [FICHIER], '--status', 2],
  ['verifier-referentiel --out', tool('verifier-referentiel.mjs'), [], '--out', 2],
  ['verifier-referentiel --doctrine', tool('verifier-referentiel.mjs'), [], '--doctrine', 2],
  ['fiche-en-pdf --out', tool('fiche-en-pdf.mjs'), [path.join(DOSSIER_VIDE, 'fiche.html')], '--out', 2],
  ['smoke-parcours --out', oracle('smoke-parcours.mjs'), ['--manifest', FICHIER], '--out', 3],
  ['verifier-couverture-fonctionnelle --out', oracle('verifier-couverture-fonctionnelle.mjs'), ['--manifest', FICHIER], '--out', 2],
  ['verifier-couverture-fonctionnelle --source', oracle('verifier-couverture-fonctionnelle.mjs'), ['--manifest', FICHIER], '--source', 2],
  ['verifier-dependances-env --out', oracle('verifier-dependances-env.mjs'), ['--manifest', FICHIER], '--out', 2],
  ['verifier-modele-semantique --out', oracle('verifier-modele-semantique.mjs'), ['--modele', DOSSIER_VIDE], '--out', 2],
  ['verifier-rapport-pbir --out', oracle('verifier-rapport-pbir.mjs'), ['--rapport', DOSSIER_VIDE], '--out', 2],
  ['verifier-roundtrip --candidate', oracle('verifier-roundtrip.mjs'), ['--reference', FICHIER], '--candidate', 2],
  ['verifier-schema-modele --out', oracle('verifier-schema-modele.mjs'), ['--model', FICHIER, '--schema', FICHIER], '--out', 2],
  ['verifier-migrations --out', oracle('verifier-migrations.mjs'), [DOSSIER_VIDE], '--out', 2],
  ['maj-versions --out', oracle('maj-versions.mjs'), [DOSSIER_VIDE], '--out', 2],
  ['verifier-pdf --source', oracle('verifier-pdf.mjs'), [path.join(DOSSIER_VIDE, 'x.pdf')], '--source', 2],
  ['decouvrir-oracles --racine', oracle('decouvrir-oracles.mjs'), [], '--racine', 2],
];

function jouer(script, ...args) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'option-fichier-'));
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd, timeout: 120000 });
  return { r, cwd, contenu: fs.readdirSync(cwd) };
}
const nettoyer = (d) => fs.rmSync(d, { recursive: true, force: true });

test('TF-2131 — la table couvre chaque outil dont une option nomme un fichier (aucun script à `--out` oublié)', () => {
  // Les scripts de tools/ et oracles/ qui lisent une option de valeur ET que la table ne joue pas doivent être
  // des cas déclarés hors de la garde : le seul reste connu est la valeur d'enum / de nombre (voir plus bas).
  const jouesNoms = new Set(CAS.map((c) => path.basename(c[1])));
  const lisentUneOption = [];
  for (const dir of ['tools', 'oracles']) {
    for (const f of fs.readdirSync(path.join(RACINE, dir)).filter((x) => x.endsWith('.mjs'))) {
      const src = fs.readFileSync(path.join(RACINE, dir, f), 'utf8');
      if (/indexOf\('--out'\)|opt\('--out'\)|flag\('--out'|argv, '--out'|args\.includes\('--out'\)/.test(src)) lisentUneOption.push(f);
    }
  }
  const oublies = lisentUneOption.filter((f) => !jouesNoms.has(f) && !['build-kit.mjs', 'build-theme.mjs', 'forge-adapter.mjs'].includes(f));
  assert.deepEqual(oublies, [], `outil(s) à option --out hors de la table et hors TF-2105 : ${oublies.join(', ')}`);
});

for (const [nom, script, base, option, exitAttendu] of CAS) {
  test(`TF-2131 — ${nom} : « ${option} --dry-run » est refusé (exit ${exitAttendu}, motif, usage) et RIEN n'est créé`, () => {
    for (const valeur of ['--dry-run', '-x']) {
      const { r, cwd, contenu } = jouer(script, ...base, option, valeur);
      try {
        assert.equal(r.status, exitAttendu, `${nom} ${option} ${valeur} : exit ${r.status} au lieu de ${exitAttendu} (${r.stderr.slice(0, 300)})`);
        assert.match(r.stderr, new RegExp(`Option ${option} : « ${valeur} » refusé comme (fichier|dossier)`), `${nom} ${option} ${valeur} : le refus ne dit pas pourquoi : ${r.stderr.slice(0, 300)}`);
        assert.match(r.stderr, /[Uu]sage ?:/, `${nom} : l'usage n'est pas dit`);
        assert.deepEqual(contenu, [], `${nom} ${option} ${valeur} a créé ${JSON.stringify(contenu)} dans le dossier courant`);
      } finally { nettoyer(cwd); }
    }
  });

  test(`TF-2131 — ${nom} : « ${option} » sans valeur (dernier argument) est refusé sans exception brute`, () => {
    const { r, cwd, contenu } = jouer(script, ...base, option);
    try {
      assert.equal(r.status, exitAttendu, `${nom} ${option} seul : exit ${r.status} (${r.stderr.slice(0, 300)})`);
      assert.match(r.stderr, new RegExp(`${option}`), `${nom} : le refus ne nomme pas l'option`);
      assert.doesNotMatch(r.stderr, /TypeError|ERR_INVALID_ARG|at .*\.mjs:\d+/, `${nom} : une exception brute s'affiche au lieu du refus`);
      assert.deepEqual(contenu, [], `${nom} ${option} seul a créé ${JSON.stringify(contenu)}`);
    } finally { nettoyer(cwd); }
  });
}

// ── Sens vert : une vraie valeur reste honorée, par une forme de lecture de chaque famille ───────────
const VERTS = [
  ['build-catalogue', tool('build-catalogue.mjs'), [TENANT], 'catalogue.html'],
  ['build-referentiel', tool('build-referentiel.mjs'), [TENANT], 'referentiel.html'],
  ['build-banc', tool('build-banc.mjs'), [TENANT], 'banc.md'],
  ['build-rapport', tool('build-rapport.mjs'), [DATA, '--tenant', TENANT], 'rapport.html'],
  ['build-slides', tool('build-slides.mjs'), [DATA, '--tenant', TENANT], 'presentation.html'],
  ['merge-packs', tool('merge-packs.mjs'), [TENANT], 'merged.json'],
  ['verifier-referentiel', tool('verifier-referentiel.mjs'), [], 'verdict.json'],
  ['verifier-migrations', oracle('verifier-migrations.mjs'), [DOSSIER_VIDE], 'migrations.json'],
];
for (const [nom, script, base, sortie] of VERTS) {
  test(`TF-2131 sens vert — ${nom} --out ${sortie} écrit le fichier demandé, et lui seul au nom demandé`, () => {
    const { r, cwd, contenu } = jouer(script, ...base, '--out', sortie);
    try {
      assert.ok(r.status === 0 || r.status === 1, `${nom} : exit ${r.status} (${r.stderr.slice(0, 300)})`);   // un verdict rouge reste un verdict
      assert.ok(contenu.includes(sortie), `${nom} : ${sortie} absent du dossier (${JSON.stringify(contenu)})`);
      assert.ok(!contenu.some((f) => f.startsWith('-')), `${nom} : fichier au nom d'option créé : ${JSON.stringify(contenu)}`);
    } finally { nettoyer(cwd); }
  });
}

test('TF-2131 — le facteur commun de lib.mjs : genre « fichier », message et valeurs rendues', async () => {
  const lib = await import(`file:///${path.join(RACINE, 'tools', 'lib.mjs').replace(/\\/g, '/')}`);
  assert.equal(lib.valeurDossierOuUsage(['x.yaml', '--kind', 'audit'], '--out', 'Usage: x', 'fichier'), undefined, 'option absente : pas de valeur');
  assert.equal(lib.valeurDossierOuUsage(['x.yaml', '--out', 'sortie.html'], '--out', 'Usage: x', 'fichier'), 'sortie.html');
  assert.equal(lib.valeurDossierOuUsage(['x.yaml', '--out', './-etrange.html'], '--out', 'Usage: x', 'fichier'), './-etrange.html',
    'un chemin qui CONTIENT « - » sans le commencer est un fichier');
  assert.equal(lib.valeurFichierOuUsage(['--out', 'a.md'], '--out', 'Usage: x'), 'a.md', 'le raccourci « fichier » rend la valeur');
  // le genre par défaut reste « dossier » (TF-2105) : son message ne change pas
  const src = fs.readFileSync(path.join(RACINE, 'tools', 'lib.mjs'), 'utf8');
  assert.match(src, /refusé comme \$\{genre\}/);
});

// ── Le rendu de rapport AUTONOME que le kit livre au projet audité porte la même règle ───────────────
test('TF-2131 — le rendu de rapport autonome du kit refuse « --out --dry-run » (le kit est autoportant, la règle y est recopiée)', async () => {
  const { inflateRawSync } = await import('node:zlib');
  const sortie = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-option-'));
  try {
    const b = spawnSync(process.execPath, [tool('build-kit.mjs'), TENANT, '--kind', 'audit', '--out', sortie], { encoding: 'utf8', cwd: RACINE, timeout: 120000 });
    assert.equal(b.status, 0, b.stderr);
    const buf = fs.readFileSync(path.join(sortie, fs.readdirSync(sortie).find((f) => f.endsWith('.zip'))));
    let o = 0, source = null;
    while (o + 4 <= buf.length && buf.readUInt32LE(o) === 0x04034b50) {       // lecteur ZIP minimal (en-têtes locaux)
      const method = buf.readUInt16LE(o + 8), comp = buf.readUInt32LE(o + 18);
      const nameLen = buf.readUInt16LE(o + 26), extraLen = buf.readUInt16LE(o + 28);
      const name = buf.toString('utf8', o + 30, o + 30 + nameLen);
      const debut = o + 30 + nameLen + extraLen, raw = buf.subarray(debut, debut + comp);
      const contenu = method === 8 ? inflateRawSync(raw) : Buffer.from(raw);
      if (name.endsWith('build-rapport-standalone.mjs')) source = contenu;
      o = debut + comp;
    }
    assert.ok(source, 'le kit ne livre pas build-rapport-standalone.mjs');
    const script = path.join(sortie, 'build-rapport-standalone.mjs');
    fs.writeFileSync(script, source);
    // TF-2169 : l'autonome embarque ses modules (il importait './canevas-modele-donnees.mjs', que le kit ne livre pas, et
    // levait ERR_MODULE_NOT_FOUND hors du dépôt — le banc le masquait en copiant ce voisin). Il est joué ici SEUL.
    for (const valeur of ['--dry-run', '-x']) {
      const { r, cwd, contenu } = jouer(script, DATA, '--out', valeur);
      try {
        assert.equal(r.status, 2, `exit ${r.status} : ${r.stderr.slice(0, 300)}`);
        assert.match(r.stderr, new RegExp(`Option --out : « ${valeur} » refusé comme fichier`));
        assert.deepEqual(contenu, [], `le rendu autonome a créé ${JSON.stringify(contenu)}`);
      } finally { nettoyer(cwd); }
    }
    const vert = jouer(script, DATA, '--out', 'rapport.html');
    try { assert.equal(vert.r.status, 0, vert.r.stderr); assert.deepEqual(vert.contenu, ['rapport.html']); } finally { nettoyer(vert.cwd); }
  } finally { nettoyer(sortie); }
});
