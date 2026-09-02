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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// TF-0624 et TF-0625 (lot Produit-11 du 25/08/2026) — LA COHÉRENCE DU PLAN.
//
// Le fait mesuré par le produit : un plan annonçait 64 actions pour 33 distinctes, onze paires
// disant exactement la même chose. La porte machine a rendu « CONFORME — rapport diffusable » :
// son périmètre est la FORME, et le plan est une DONNÉE destinée à être consommée par le projet.
//
// Les deux sens sont joués sur la logique elle-même, extraite du moteur, plutôt que sur un
// rapport complet : une fixture de rapport à 64 actions coûterait cher à maintenir et prouverait
// moins — ce qu'on veut savoir est si le seuil trie juste, et il se mesure sur des textes.
// ─────────────────────────────────────────────────────────────────────────────────────────────
const moteur = fs.readFileSync(path.join(ROOT, 'tools', 'rapport-engine.mjs'), 'utf8');

/** Extrait les trois fonctions du moteur et les rend jouables ici — un seul jeu de règles. */
const logiqueCoherence = () => {
  const debut = moteur.indexOf('function motsUtiles(');
  const fin = moteur.indexOf('function auditSelfTest(');
  assert.ok(debut > 0 && fin > debut, 'les fonctions de cohérence doivent vivre dans le moteur');
  const src = moteur.slice(debut, fin);
  // eslint-disable-next-line no-new-func
  return new Function(src + '\nreturn { coherencePlan, recouvrement, SEUIL_REDITE, SEUIL_REDITE_MEME_DOMAINE };')();
};

test('TF-0624 rouge — deux actions au texte quasi identique sont SIGNALÉES', () => {
  const { coherencePlan } = logiqueCoherence();
  const e = coherencePlan([
    { id: 'REM-D01-01', action: 'Placer le front derriere un WAF' },
    { id: 'REM-ADR0307', action: 'Placer le front derriere un WAF (Application Gateway ou Front Door)' },
  ]);
  assert.ok(e.length >= 1, 'la redite doit être signalée');
  assert.match(e[0], /REM-D01-01 ~ REM-ADR0307/, 'les deux identifiants doivent être nommés');
  assert.match(e[0], /DEUX CHARGES/, 'le motif doit dire ce que le doublon coûte');
});

test('TF-0624 vert — deux actions RÉELLEMENT différentes ne sont pas rapprochées', () => {
  const { coherencePlan } = logiqueCoherence();
  const e = coherencePlan([
    { id: 'REM-A', action: 'Placer le front derriere un pare-feu applicatif' },
    { id: 'REM-B', action: 'Documenter les durees de conservation des journaux applicatifs' },
  ]);
  assert.equal(e.length, 0, 'un rapprochement à tort ferait ignorer le contrôle : ' + e.join(' | '));
});

test('TF-0624 — les DEUX seuils viennent de la mesure, et l écart mince est la raison du second', () => {
  const { recouvrement, SEUIL_REDITE, SEUIL_REDITE_MEME_DOMAINE } = logiqueCoherence();
  assert.equal(SEUIL_REDITE, 0.45, 'le seuil global mesuré ne doit pas dériver sans mesure');
  assert.equal(SEUIL_REDITE_MEME_DOMAINE, 0.25, 'le seuil intra-domaine mesuré ne doit pas dériver sans mesure');

  // Les quatre paires que le produit cite comme redites RÉELLES, mesurées avec cette tokenisation.
  const vraies = [
    ['Placer le front derriere un WAF', 'Placer le front derriere un WAF (Application Gateway ou Front Door)'],
    ['Implementer la purge automatique des donnees', 'Specifier les durees de conservation et implementer une purge automatique'],
    ['Nommer un Data Owner pour chaque domaine', 'Designer un Data Owner par domaine de donnees'],
    ['Alimenter la CMDB', 'Alimenter la CMDB depuis le referentiel dinventaire'],
  ].map(([a, b]) => recouvrement(a, b));
  assert.ok(Math.min(...vraies) >= SEUIL_REDITE_MEME_DOMAINE,
    'toutes les redites réelles doivent franchir le seuil intra-domaine : ' + vraies.join(', '));

  // LE PIÈGE MESURÉ, et la raison pour laquelle un seuil unique bas serait faux : deux actions du
  // MÊME sujet et pourtant distinctes. Il doit rester SOUS le seuil intra-domaine.
  const piege = recouvrement('Chiffrer les donnees au repos', 'Chiffrer les echanges en transit');
  assert.ok(piege < SEUIL_REDITE_MEME_DOMAINE, 'le piège « au repos / en transit » doit rester sous le seuil (' + piege + ')');
  assert.ok(piege < Math.min(...vraies), 'l écart entre la plus faible vraie et la pire fausse justifie deux seuils');

  const etranger = recouvrement('Placer le front derriere un WAF', 'Nommer un Data Owner pour chaque domaine');
  assert.equal(etranger, 0, 'deux sujets étrangers ne partagent aucun vocabulaire plein');
});

test('TF-0625 — une redite DANS LE MÊME domaine est dite à part : c est le cas le plus fréquent', () => {
  const { coherencePlan } = logiqueCoherence();
  const e = coherencePlan([
    { id: 'REM-D05-01', domaine: 'D05', action: 'Nommer un Data Owner pour chaque domaine' },
    { id: 'REM-ADR0601', domaine: 'D05', action: 'Designer un Data Owner par domaine de donnees' },
  ]);
  assert.ok(e.some((m) => /MEME domaine/.test(m)), 'le cas le plus fréquent doit être distingué : ' + e.join(' | '));
  assert.ok(e.some((m) => /CONSTAT de dimension/.test(m)), 'le geste qui répare doit être nommé');
});

test('TF-0625 — deux actions du MÊME sujet mais distinctes ne sont PAS rapprochées, même dans un domaine', () => {
  const { coherencePlan } = logiqueCoherence();
  const e = coherencePlan([
    { id: 'REM-D03-01', domaine: 'D03', action: 'Chiffrer les donnees au repos' },
    { id: 'REM-D03-02', domaine: 'D03', action: 'Chiffrer les echanges en transit' },
  ]);
  assert.equal(e.length, 0, 'le piège mesuré ne doit pas être signalé : ' + e.join(' | '));
});

test('TF-0625 — un plan SAIN ne produit aucun constat : un contrôle qui crie toujours se fait ignorer', () => {
  const { coherencePlan } = logiqueCoherence();
  const e = coherencePlan([
    { id: 'REM-1', domaine: 'D01', action: 'Placer le front derriere un pare-feu applicatif' },
    { id: 'REM-2', domaine: 'D04', action: 'Specifier les durees de conservation des journaux' },
    { id: 'REM-3', domaine: 'D12', action: 'Alimenter la base de configuration depuis le referentiel' },
  ]);
  assert.equal(e.length, 0, 'aucun constat attendu sur un plan sain : ' + e.join(' | '));
});

test('TF-0625 — le contrôle est CÂBLÉ à l auto-test dont la porte hérite du verdict', () => {
  assert.match(moteur, /coherencePlan\(p\)\.forEach/,
    'un contrôle que l auto-test n appelle pas est un contrôle que la porte ne verra jamais');
});
