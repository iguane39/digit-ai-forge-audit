// Non-régression du durcissement de maj-versions.mjs (prompt : ci-test-non-regression-transitif).
//
// FIGE le comportement acquis en 20260721a pour qu'aucune version future ne régresse en silence.
// Trois versions (e/f/g) ont été nécessaires pour verrouiller UNE vuln transitive, car le seul juge
// était un ré-audit manuel Windows. Ces tests déplacent le juge dans la CI (matrice ubuntu+windows).
//
// Lancer :  node --test __tests__/maj-versions.test.mjs
//
// Niveaux :
//  A) unitaires déterministes hors-ligne (fonctions pures + runCmd + hooks EOL/registre) ;
//  B) intégration déterministe hors-ligne (résolution, provenance, registre injoignable, sécurité en échec) ;
//  C) intégration réseau (audit natif capte la transitive) — DURE en CI, SKIP en local hors-ligne.
//
// Hooks de test (env, gérés par maj-versions.mjs) : MAJVER_TEST_FORCE_SEC_FAIL / _REGISTRY_FAIL / _EOL_FAIL.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cmpVer, pickStable, ecartKind, isPrerelease, yarnResolvedFor,
  parsePackageJson, runWithLadder, classer, runCmd, canRun, COVERS, eolMajor,
  nonRegistrySource, successorFromDeprecation,
} from '../../oracles/maj-versions.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MV = path.join(HERE, '..', '..', 'oracles', 'maj-versions.mjs');
const FIX = path.join(HERE, '..', 'fixtures', 'oracles');
const NATIVE = new Set(Object.keys(COVERS).filter(k => COVERS[k].t)); // barreaux couvrant le transitif
const IN_CI = !!process.env.CI; // GitHub Actions positionne CI=true

function runScript(fixtureDir, extraEnv = {}) {
  const out = path.join(os.tmpdir(), 'mv-' + fixtureDir.replace(/[^a-z0-9]/gi, '') + '-' + Object.keys(extraEnv).join('_') + '.json');
  const r = spawnSync(process.execPath, [MV, path.join(FIX, fixtureDir), '--out', out],
    { encoding: 'utf8', timeout: 240000, maxBuffer: 1e8, env: { ...process.env, ...extraEnv } });
  assert.equal(r.error, undefined, 'le script ne doit pas planter : ' + (r.error && r.error.code));
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}
const compByName = (d, n) => Object.values(d.composants).find(c => c.nom === n);

// ─────────────────────── A. Unitaires (hors-ligne, déterministes) ───────────────────────

test('cmpVer / pickStable / ecartKind', () => {
  assert.equal(cmpVer('1.9.0', '1.10.0'), -1);
  assert.equal(pickStable(['1.0.0', '1.9.0', '2.0.0-rc.1']), '1.9.0');
  assert.equal(ecartKind('1.2.3', '2.0.0'), 'major');
  assert.equal(ecartKind('1.2.3', '1.3.0'), 'minor');
  assert.ok(isPrerelease('2.0.0-beta.1') && !isPrerelease('2.0.0'));
});

test('yarnResolvedFor : bloc de la plage déclarée gagne (multi-blocs)', () => {
  const lock = fs.readFileSync(path.join(FIX, 'multiblock', 'yarn.lock'), 'utf8');
  assert.equal(yarnResolvedFor(lock, 'vite', '^8.0.0'), '8.1.5');
  assert.equal(yarnResolvedFor(lock, 'eslint', '^9.0.0'), '9.39.5');
});

test('runWithLadder : succès tracé / échec = non vérifié + tentatives / {} = succès', async () => {
  const ok = await runWithLadder([{ label: 'a', run: () => null }, { label: 'b', run: () => ({ v: 1 }) }]);
  assert.equal(ok.via, 'b'); assert.deepEqual(ok.tried, ['a']);
  const ko = await runWithLadder([{ label: 'x', run: () => null }, { label: 'y', run: () => null }]);
  assert.equal(ko.ok, false); assert.equal(ko.via, 'non vérifié'); assert.deepEqual(ko.tried, ['x', 'y']);
  const empty = await runWithLadder([{ label: 'e', run: () => ({}) }]);
  assert.equal(empty.ok, true); assert.equal(empty.via, 'e');
});

test('classer : EOL asymétrique — échec d\'acquisition ≠ « pas EOL »', () => {
  assert.equal(classer({ name: 'x' }, { eol: true }).statut, 'reco_eol');
  assert.notEqual(classer({ name: 'x' }, { eol: null }).statut, 'reco_eol');
  assert.equal(classer({ name: 'x' }, { vulns: ['GHSA-xxxx'], eol: null }).statut, 'reco_securite');
});

// Qualité de classification (défauts A & B) : exploiter l'info détenue, jamais un faux actionnable.
test('nonRegistrySource : specs hors-registre détectées, spec de registre → null', () => {
  assert.equal(nonRegistrySource('https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz'), 'cdn.sheetjs.com');
  assert.equal(nonRegistrySource('github:foo/bar'), 'github');
  assert.equal(nonRegistrySource('git+https://x/y.git'), 'git+https');
  assert.ok(['file', 'link', 'workspace', 'patch'].every(s => nonRegistrySource(s + ':../x')));
  assert.equal(nonRegistrySource('./local.tgz'), 'tarball');
  assert.equal(nonRegistrySource('^1.0.0'), null);
  assert.equal(nonRegistrySource('1.2.3'), null);
});

test('successorFromDeprecation : extrait le remplaçant nommé, sinon null', () => {
  assert.equal(successorFromDeprecation('Superseded by @hiogawa/vite-plugin-error-overlay'), '@hiogawa/vite-plugin-error-overlay');
  assert.equal(successorFromDeprecation('Deprecated, use fast-xml-parser instead.'), 'fast-xml-parser');
  assert.equal(successorFromDeprecation('replaced by got'), 'got');
  assert.equal(successorFromDeprecation('no longer maintained'), null);
  assert.equal(successorFromDeprecation(null), null);
});

test('classer : déprécié porte le successeur, masque la flèche x→x (défaut A)', () => {
  const withSucc = classer({ name: 'x', version_utilisee: '^0.0.1', version_resolue: '0.0.1', version_actuelle: '0.0.1' }, { deprecated: 'Superseded by @scope/next' });
  assert.equal(withSucc.statut, 'reco_deprecie');
  assert.equal(withSucc.remplacant, '@scope/next');
  assert.match(withSucc.reco, /@scope\/next/);
  assert.equal(withSucc.no_version_target, true); // pas de « cible » de version
  const noSucc = classer({ name: 'x', version_utilisee: '^1.0.0', version_resolue: '1.0.0', version_actuelle: '1.0.0' }, { deprecated: 'no longer maintained' });
  assert.equal(noSucc.remplacant, null);
  assert.match(noSucc.reco, /alternative/i);
});

test('classer : source hors-registre → hors_registre informatif, pas de faux actionnable (défaut B)', () => {
  const r = classer({ name: 'xlsx', version_utilisee: 'https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz', version_resolue: '0.20.3', version_actuelle: '0.18.5' }, {});
  assert.equal(r.statut, 'hors_registre');
  assert.equal(r.reco_flag, '—');
  assert.equal(r.source_hors_registre, 'cdn.sheetjs.com');
  assert.notEqual(r.statut, 'reco_correctif');
});

test('classer : garde anti-downgrade — jamais une cible inférieure à l\'installé (défaut B)', () => {
  const r = classer({ name: 'axios', version_utilisee: '^1.0.0', version_resolue: '1.18.1', version_actuelle: '1.10.0' }, {});
  assert.notEqual(r.reco_flag, 'Oui');
  assert.notEqual(r.statut, 'reco_correctif');
  assert.equal(r.anti_downgrade, true);
});

test('parsePackageJson : dépendances directes', () => {
  const pj = parsePackageJson(JSON.parse(fs.readFileSync(path.join(FIX, 'multiblock', 'package.json'), 'utf8')));
  const names = pj.map(d => d.name);
  assert.ok(names.includes('vite') && names.includes('eslint'));
});

test('runCmd : status ≠ 0 n\'est PAS un échec (convention « vulns trouvées »)', () => {
  const helper = path.join(os.tmpdir(), 'mv-exit3.mjs');
  fs.writeFileSync(helper, "process.stdout.write('OUT');process.exit(3);");
  const r = runCmd(os.tmpdir(), 'node', [helper]);
  assert.equal(r.ok, true); assert.equal(r.status, 3); assert.match(r.stdout, /OUT/);
});

test('runCmd + canRun : un binaire absent ne ressemble jamais à un succès propre (défaut 5)', () => {
  const r = runCmd(os.tmpdir(), 'binaire-qui-nexiste-pas-xyz', ['--version']);
  assert.ok(!(r.ok && r.status === 0));
  assert.equal(canRun('binaire-qui-nexiste-pas-xyz'), false);
  assert.equal(canRun('node'), true);
});

test('eolMajor : réseau forcé KO → { state:null, reason:\'unreachable\' } (défaut 4, hors-ligne)', async () => {
  const saved = process.env.MAJVER_TEST_FORCE_EOL_FAIL;
  process.env.MAJVER_TEST_FORCE_EOL_FAIL = '1';
  try {
    const r = await eolMajor('vite', '8', 1_800_000_000_000);
    assert.equal(r.state, null);
    assert.equal(r.reason, 'unreachable'); // JAMAIS 'not-eol' silencieux
  } finally { if (saved === undefined) delete process.env.MAJVER_TEST_FORCE_EOL_FAIL; else process.env.MAJVER_TEST_FORCE_EOL_FAIL = saved; }
});

// ─────────────────── B. Intégration déterministe (hors-ligne) ───────────────────

test('résolution multi-blocs exacte (vite@^8 → 8.1.5, pas le transitif 5.x)', () => {
  const d = runScript('multiblock');
  assert.equal(compByName(d, 'vite').version_resolue, '8.1.5');
  assert.equal(compByName(d, 'eslint').version_resolue, '9.39.5');
});

test('provenance (env + date EOL) écrite en sortie — défaut 7', () => {
  const d = runScript('multiblock');
  assert.equal(d.schema, 'auditcore.versions/v5');
  assert.ok(d.env && d.env.os && d.env.node);
  assert.match(d.env.eol_reference_date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok('corepack' in d.env.outils);
});

test('registre injoignable (forcé) → non_verifie, JAMAIS a_jour (défaut 6)', () => {
  const d = runScript('multiblock', { MAJVER_TEST_FORCE_REGISTRY_FAIL: '1' });
  assert.ok(d.resume.non_verifies >= 1, 'au moins un composant en non vérifié');
  const ajour = Object.values(d.composants).filter(c => c.statut === 'a_jour').map(c => c.nom);
  assert.equal(ajour.length, 0, 'aucun composant présenté « à jour » sur registre injoignable : ' + ajour.join(', '));
  assert.match(compByName(d, 'vite').version_actuelle, /non vérifié|inaccessible/i);
});

test('classification : xlsx (CDN) → hors_registre, jamais reco_correctif ni cible 0.18.5 (défaut B)', () => {
  const d = runScript('classification');
  const xlsx = compByName(d, 'xlsx');
  assert.ok(xlsx, 'xlsx présent');
  assert.equal(xlsx.statut, 'hors_registre');
  assert.equal(xlsx.reco_flag, '—');
  assert.notEqual(xlsx.statut, 'reco_correctif');
  assert.notEqual(xlsx.version_actuelle, '0.18.5', 'pas de « cible » npm périmée');
  assert.equal(xlsx.source_hors_registre, 'cdn.sheetjs.com');
});

// Invariant transverse (prompt §Tests) : aucun composant actionnable ne pointe vers une version PLUS BASSE.
const numeric = v => /^\d+(\.\d+)*$/.test(String(v || '').replace(/^[\^~>=<!\s]+/, ''));
for (const fx of ['multiblock', 'classification']) {
  test('anti-downgrade transverse (' + fx + ') : aucun reco_flag=Oui avec version_actuelle < version_resolue', () => {
    const d = runScript(fx);
    for (const c of Object.values(d.composants)) {
      if (c.reco_flag === 'Oui' && numeric(c.version_actuelle) && numeric(c.version_resolue)) {
        assert.ok(cmpVer(c.version_actuelle, c.version_resolue) >= 0,
          c.nom + ' : reco actionnable vers ' + c.version_actuelle + ' < installé ' + c.version_resolue + ' (downgrade)');
      }
    }
  });
}

// ASSERTION NÉGATIVE (prompt §3) : audit natif rendu indisponible → échec HONNÊTE, jamais un faux « 0 ».
test('sécurité forcée en échec → via « non vérifié » + tentatives, jamais transitives_vuln:0', () => {
  const d = runScript('yarn-transitive-vuln', { MAJVER_TEST_FORCE_SEC_FAIL: '1' });
  const sec = d.source_securite.npm;
  assert.equal(sec.via, 'non vérifié');
  assert.ok(Array.isArray(sec.tentatives) && sec.tentatives.length > 0, 'les tentatives échouées sont tracées');
  assert.ok(d.resume.transitif_non_couvert.includes('npm'));
  assert.ok(d.resume.securite_non_verifiee.includes('npm'));
  assert.notEqual(d.resume.transitives_vuln, 0, 'un « 0 » nu ne doit jamais être présenté comme propre');
  assert.equal(d.resume.transitives_vuln, 'non vérifié');
});

// ─────────────────── C. Intégration RÉSEAU (audit natif) ───────────────────
// ASSERTION POSITIVE (prompt §2) : l'audit natif capte la vuln TRANSITIVE (adm-zip).
// DURE en CI (réseau garanti) ; SKIP en local si aucun outil natif / réseau indisponible.

test('POSITIVE : audit natif capte adm-zip transitif (défauts 1+2+3)', (t) => {
  const d = runScript('yarn-transitive-vuln');
  const sec = d.source_securite.npm;
  const nativeAvailable = !!(d.env.outils.corepack || d.env.outils.yarn || d.env.outils.npm);

  if (!NATIVE.has(sec.via)) {
    const msg = 'audit natif non exécuté (via=' + sec.via + ')';
    if (IN_CI && nativeAvailable) assert.fail('CI : ' + msg + ' — régression shell/maxBuffer/périmètre, ou registre d\'audit injoignable');
    t.skip(msg + ' — hors CI / outil ou réseau indisponible');
    return;
  }
  // l'audit natif a tourné : il DOIT avoir vu la transitive.
  assert.equal(sec.transitif_couvert, true);
  assert.ok(!d.resume.transitif_non_couvert.includes('npm'));
  assert.ok(typeof d.resume.transitives_vuln === 'number' && d.resume.transitives_vuln >= 1,
    'transitives_vuln >= 1 attendu (adm-zip), obtenu : ' + d.resume.transitives_vuln);
  const adm = compByName(d, 'adm-zip');
  assert.ok(adm, 'adm-zip présent dans l\'inventaire');
  assert.equal(adm.statut, 'reco_securite');
  assert.equal(adm.perimetre, '(transitive)');
});

// Complément défaut 4 en intégration : endoflife injoignable → eol_non_verifies, pas « pas EOL » silencieux.
test('EOL injoignable (forcé) → eol_non_verifies >= 1, jamais silencieusement conforme', (t) => {
  const d = runScript('multiblock', { MAJVER_TEST_FORCE_EOL_FAIL: '1' });
  const currency = Object.values(d.composants).filter(c => ['a_jour', 'veille_majeur', 'couvert_plage'].includes(c.statut));
  if (!currency.length) { // registre currency injoignable en local → rien à évaluer côté EOL
    if (IN_CI) assert.fail('CI : aucun composant à statut de fraîcheur — registre injoignable ?');
    t.skip('aucun composant à statut de fraîcheur (registre injoignable hors CI)');
    return;
  }
  assert.ok(d.resume.eol_non_verifies >= 1, 'volet EOL marqué non vérifié');
  assert.ok(currency.every(c => c.eol_verifie === false), 'aucun composant EOL présenté comme vérifié');
});
