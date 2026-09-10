// Couverture des règles au plan de remédiation (D-7 (a), décision humaine du 10/09/2026).
//
// LE FAIT : un rapport de référence jugeait 69 ADR ; le modèle courant juge 175 règles dérivées de
// ces ADR. En descendant les verdicts, 24 règles non conformes ressortaient derrière 13 ADR, et le
// plan portait 18 paires d'actions au TEXTE IDENTIQUE — refusées à raison par le contrôle de
// cohérence du plan (TF-0624), sans qu'aucun moyen n'existe de DÉCLARER qu'une seule remédiation
// répond à plusieurs règles. Une règle porte désormais `couverte_par`.
//
// CHAQUE SENS A SA FIXTURE, et les fixtures sont dérivées d'un rapport RÉELLEMENT généré :
//   rouge   — deux règles non conformes à la même remédiation, sans couverture : le rendu est
//             refusé (« se redisent »), c'est l'état d'avant ;
//   vert    — la seconde couverte par la première : contrat PASS, rendu PASS, UNE action au plan
//             qui NOMME la règle couverte, `covers` dans le YAML de la forge ;
//   contrat — une couverture vers une règle conforme, inconnue, ou elle-même couverte est REFUSÉE
//             par le gate machine, avec le motif ;
//   garde   — le moteur ne suit pas une couverture invalide : la règle garde sa propre action,
//             rien n'est écarté en silence (le contrat, lui, a déjà refusé).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlan, planToActions } from '../../tools/rapport-engine.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const TENANT = path.join(ROOT, 'config', 'tenants', 'exemple', 'tenant.yaml');
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 1e8 });

const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'rapport-data-valid.json'), 'utf8'));
const porteuse = base.regles.find(r => r.id === 'CTL-D05-01' && r.verdict === 'non_conforme');
assert.ok(porteuse, 'la fixture valide porte une règle non conforme CTL-D05-01');

/** Une variante des données : une seconde règle non conforme, MÊME remédiation que la première. */
const variante = (nom, mutation) => {
  const d = JSON.parse(JSON.stringify(base));
  const jumelle = { ...porteuse, id: 'CTL-D05-02', preuve: 'même écart, constaté sur le second pipeline' };
  d.regles.push(jumelle);
  mutation(d, jumelle);
  const json = path.join(os.tmpdir(), `couverture-${nom}.json`);
  fs.writeFileSync(json, JSON.stringify(d, null, 1), 'utf8');
  const html = path.join(os.tmpdir(), `couverture-${nom}.html`);
  return { d, json, html };
};
const contrat = (json) => node([path.join(ROOT, 'tools', 'verifier-rapport.mjs'), json, '--tenant', TENANT]);
const rendu = (json, html) => {
  const b = node([path.join(ROOT, 'tools', 'build-rapport.mjs'), json, '--tenant', TENANT, '--out', html]);
  assert.equal(b.status, 0, 'le rapport doit se générer : ' + b.stderr);
  return node([path.join(ROOT, 'tools', 'verifier-rapport-html.mjs'), html]);
};
const planEmbarque = (html) => {
  const m = /<script type="application\/json" id="remediation-plan-json">([\s\S]*?)<\/script>/.exec(fs.readFileSync(html, 'utf8'));
  assert.ok(m, 'le rapport embarque son plan');
  return JSON.parse(m[1].replace(/\\u003c/g, '<')).actions;
};

test('ROUGE — deux règles à la même remédiation sans couverture : le rendu est refusé (état d\'avant)', () => {
  const { json, html } = variante('rouge', () => {});
  assert.equal(contrat(json).status, 0, 'le contrat de données ne juge pas la redite, c\'est le rendu qui la juge');
  const r = rendu(json, html);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /se redisent/);
  const p = planEmbarque(html);
  assert.equal(p.filter(a => ['CTL-D05-01', 'CTL-D05-02'].includes(a.source)).length, 2, 'deux actions, une par règle');
});

test('VERT — la seconde couverte par la première : contrat PASS, rendu PASS, UNE action qui nomme la couverte', () => {
  const { json, html } = variante('vert', (d, j) => { j.couverte_par = 'CTL-D05-01'; });
  const c = contrat(json);
  assert.equal(c.status, 0, c.stderr);
  const r = rendu(json, html);
  assert.equal(r.status, 0, r.stderr);
  const p = planEmbarque(html);
  const dePorteuse = p.filter(a => a.source === 'CTL-D05-01');
  assert.equal(dePorteuse.length, 1, 'une seule action pour la porteuse');
  assert.deepEqual(dePorteuse[0].couvre, ['CTL-D05-02'], 'l\'action nomme la règle couverte');
  assert.equal(p.some(a => a.source === 'CTL-D05-02'), false, 'la règle couverte n\'a pas d\'action propre');
  // la colonne Source du tableau rendu nomme la couverture — le lecteur la voit, pas seulement la machine
  assert.match(fs.readFileSync(html, 'utf8'), /couvre CTL-D05-02/);
});

test('VERT — le YAML de la forge porte `covers` : une clôture en ferme plusieurs, et la forge le sait', () => {
  const { d } = variante('yaml', (dd, j) => { j.couverte_par = 'CTL-D05-01'; });
  const plan = buildPlan(d);
  const { doc } = planToActions(plan, d, '1.0.0');
  const a = doc.actions.find(x => x.control_ref === 'CTL-D05-01');
  assert.ok(a, 'l\'action de la porteuse est projetée');
  assert.deepEqual(a.covers, ['CTL-D05-02']);
  assert.equal(doc.actions.some(x => x.control_ref === 'CTL-D05-02'), false);
});

test('CONTRAT — couverture vers une règle CONFORME : refusée, l\'écart ne s\'efface pas', () => {
  const { json } = variante('conforme', (d, j) => { j.couverte_par = 'CTL-D02-01'; });
  const c = contrat(json);
  assert.equal(c.status, 1);
  assert.match(c.stderr, /ne porte aucune action/);
});

test('CONTRAT — couverture vers une règle INCONNUE : refusée', () => {
  const { json } = variante('inconnue', (d, j) => { j.couverte_par = 'CTL-D99-99'; });
  const c = contrat(json);
  assert.equal(c.status, 1);
  assert.match(c.stderr, /règle inconnue/);
});

test('CONTRAT — chaîne de couverture (A couverte par B, B couverte par A) : refusée', () => {
  const { json } = variante('chaine', (d, j) => {
    j.couverte_par = 'CTL-D05-01';
    d.regles.find(r => r.id === 'CTL-D05-01').couverte_par = 'CTL-D05-02';
  });
  const c = contrat(json);
  assert.equal(c.status, 1);
  assert.match(c.stderr, /chaîne de couverture/);
});

test('GARDE — le moteur ne suit pas une couverture invalide : la règle garde sa propre action', () => {
  const { d } = variante('garde', (dd, j) => { j.couverte_par = 'CTL-D02-01'; });
  const p = buildPlan(d);
  assert.equal(p.some(a => a.source === 'CTL-D05-02'), true, 'la règle couverte par une conforme n\'est pas écartée en silence');
  assert.equal(p.filter(a => (a.couvre ?? []).length).length, 0, 'aucune action ne prétend couvrir');
});
