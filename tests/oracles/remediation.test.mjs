// Non-régression ECR-04/05/07 : double émission du plan de remédiation (YAML latéral +
// bloc embarqué dans le HTML) et PORTE DE CLÔTURE avant nouvel audit.
//
// L'enjeu du couple : les deux formes viennent d'un calcul UNIQUE côté moteur. Un test qui
// ne vérifierait qu'une forme laisserait l'autre dériver — on compare donc les deux.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const T = (n) => path.join(os.tmpdir(), `ecr04-${n}`);
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 60000, maxBuffer: 1e8 });
const tool = (n, args) => node([path.join(ROOT, 'tools', n), ...args]);

const HTML = T('rapport.html');
const YAML = HTML.replace(/\.html$/, '') + '.remediation-actions.yaml';
const gen = tool('build-rapport.mjs', [
  path.join(ROOT, 'tests', 'fixtures', 'rapport-data-valid.json'),
  '--tenant', path.join(ROOT, 'config', 'tenants', 'exemple', 'tenant.yaml'), '--out', HTML]);
assert.equal(gen.status, 0, 'le rapport de référence doit se générer : ' + gen.stderr);

test('double émission : le HTML embarque le plan ET le YAML latéral est écrit', () => {
  assert.ok(fs.existsSync(HTML) && fs.existsSync(YAML), 'les deux sorties existent');
  const h = fs.readFileSync(HTML, 'utf8');
  assert.match(h, /id="remediation-plan-json"/, 'bloc machine embarqué');
  assert.match(h, /function buildRemediationPlan\(/, 'accesseur exécutable');
});

test('les deux formes portent EXACTEMENT les mêmes actions (calcul unique, pas de dérive)', () => {
  const viaHtml = tool('verifier-remediation.mjs', [HTML]);
  const viaYaml = tool('verifier-remediation.mjs', [YAML]);
  assert.equal(viaHtml.status, 0, viaHtml.stdout + viaHtml.stderr);
  assert.equal(viaYaml.status, 0, viaYaml.stdout + viaYaml.stderr);
  const ids = (f) => JSON.parse(fs.readFileSync(f.replace(/\.(html|yaml)$/, '') + '.remediation-plan.json', 'utf8'))
    .actions.map(a => a.id).sort();
  assert.deepEqual(ids(HTML), ids(YAML), 'mêmes identifiants d\'action des deux côtés');
});

test('le YAML latéral est consommable par l\'adaptateur forge (contrat de bout en bout)', () => {
  const r = tool('forge-adapter.mjs', [YAML, '--out', T('forge'), '--dry-run']);
  assert.equal(r.status, 0, r.stderr);
});

test('PORTE : suivi vierge → NON PRÊT (exit 1), actions nommées', () => {
  const suivi = T('suivi-vierge.json');
  assert.equal(tool('verifier-remediation.mjs', [HTML, '--init', suivi]).status, 0);
  const r = tool('verifier-remediation.mjs', [HTML, '--status', suivi]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /NON CLÔTURÉES/);
  assert.match(r.stdout, /NON PRÊT/);
});

test('PORTE : action cochée SANS preuve → NON PRÊT (le ✓ déclaratif ne passe pas)', () => {
  const suivi = T('suivi-sans-preuve.json');
  tool('verifier-remediation.mjs', [HTML, '--init', suivi]);
  const st = JSON.parse(fs.readFileSync(suivi, 'utf8'));
  for (const k of Object.keys(st.suivi)) { st.suivi[k].done = true; st.suivi[k].preuve = '   '; }
  fs.writeFileSync(suivi, JSON.stringify(st));
  const r = tool('verifier-remediation.mjs', [HTML, '--status', suivi]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /CLÔTURÉES SANS PREUVE/);
});

test('PORTE : tout fait avec preuve → PRÊT (exit 0)', () => {
  const suivi = T('suivi-complet.json');
  tool('verifier-remediation.mjs', [HTML, '--init', suivi]);
  const st = JSON.parse(fs.readFileSync(suivi, 'utf8'));
  st.execute_par_llm = { modele: 'Modèle de remédiation', modele_id: 'exemple-1', editeur: 'éditeur', date: '2026-08-10' };
  for (const k of Object.keys(st.suivi)) { st.suivi[k].done = true; st.suivi[k].preuve = 'sortie de test jointe'; }
  fs.writeFileSync(suivi, JSON.stringify(st));
  const r = tool('verifier-remediation.mjs', [HTML, '--status', suivi]);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /PRÊT/);
  assert.match(r.stdout, /Remédiation réalisée par \(LLM\)/, 'ECR-07 : provenance du LLM affichée');
});

test('PORTE : provenance LLM absente → avertissement explicite, jamais silencieux', () => {
  const suivi = T('suivi-sans-llm.json');
  tool('verifier-remediation.mjs', [HTML, '--init', suivi]);
  const st = JSON.parse(fs.readFileSync(suivi, 'utf8'));
  for (const k of Object.keys(st.suivi)) { st.suivi[k].done = true; st.suivi[k].preuve = 'preuve'; }
  fs.writeFileSync(suivi, JSON.stringify(st));
  const r = tool('verifier-remediation.mjs', [HTML, '--status', suivi]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Provenance LLM.*non renseignée/);
});

test('un plan dont un critère de clôture manque rend le rapport NON DIFFUSABLE', () => {
  // Le critère n'est jamais inventé : absent des données, il sort en placeholder.
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'rapport-data-valid.json'), 'utf8'));
  delete data.actions[0].verification;
  const f = T('sans-critere.json'); fs.writeFileSync(f, JSON.stringify(data));
  const out = T('sans-critere.html');
  assert.equal(tool('build-rapport.mjs', [f, '--tenant', path.join(ROOT, 'config', 'tenants', 'exemple', 'tenant.yaml'), '--out', out]).status, 0);
  const g = tool('verifier-rapport-html.mjs', [out]);
  assert.equal(g.status, 1, 'le gate de rendu doit refuser un plan sans critère de clôture');
  assert.match(g.stderr, /placeholder|critere de cloture|critère de clôture/i);
});

test("l'auto-test interne détecte une règle non conforme sans action de remédiation", () => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'rapport-data-valid.json'), 'utf8'));
  const out = T('regle-orpheline.html');
  const f = T('regle-orpheline.json');
  fs.writeFileSync(f, JSON.stringify(data));
  assert.equal(tool('build-rapport.mjs', [f, '--tenant', path.join(ROOT, 'config', 'tenants', 'exemple', 'tenant.yaml'), '--out', out]).status, 0);
  // On retire l'action correspondante du bloc machine : le rapport se contredit lui-même.
  const h = fs.readFileSync(out, 'utf8').replace(/\{"id":"REM-D05-001".*?\}(,)?/s, '');
  const casse = T('regle-orpheline-casse.html'); fs.writeFileSync(casse, h);
  const g = tool('verifier-rapport-html.mjs', [casse]);
  assert.equal(g.status, 1, 'incohérence interne non détectée');
  assert.match(g.stderr, /auto-test interne/);
});
