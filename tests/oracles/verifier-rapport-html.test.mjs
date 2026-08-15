// Non-régression du vérificateur de RENDU (ECR-02) : le contrôle est EXÉCUTÉ, pas statique.
// Un rapport dont le moteur ne compile pas, lève à l'initialisation, ou casse au clic d'une
// vue passe TOUS les contrôles de chaînes — et se diffuserait. Ces cas doivent sortir 1.
//
// TF-0235 (volet P4) — le rapport se lit par VUES : le contrat de restitution (famille
// déclarée, KPI complets, appariement sommaire↔vues, manifeste d'écarts, tableaux longs
// filtrables) est contrôlé avec la MÊME exigence de preuve — chaque règle a sa fixture
// rouge, faute de quoi la règle n'est qu'une intention.
//
// Les fixtures sont dérivées d'un rapport RÉELLEMENT généré (pas d'un HTML écrit à la main) :
// le test échoue donc aussi si le moteur de rendu cesse d'émettre un moteur JS pilotable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const TOOL = path.join(ROOT, 'tools', 'verifier-rapport-html.mjs');
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 60000, maxBuffer: 1e8 });

// Rapport de référence : produit par le moteur, comme en production.
const REF = path.join(os.tmpdir(), 'ecr02-rapport.html');
const gen = node([path.join(ROOT, 'tools', 'build-rapport.mjs'),
  path.join(ROOT, 'tests', 'fixtures', 'rapport-data-valid.json'),
  '--tenant', path.join(ROOT, 'config', 'tenants', 'exemple', 'tenant.yaml'), '--out', REF]);
assert.equal(gen.status, 0, 'le rapport de référence doit se générer : ' + gen.stderr);
const OK = fs.readFileSync(REF, 'utf8');

/** Écrit une variante du rapport dont le moteur JS est saboté, et la vérifie. */
const variante = (nom, muter) => {
  const p = path.join(os.tmpdir(), `ecr02-${nom}.html`);
  fs.writeFileSync(p, muter(OK), 'utf8');
  return node([TOOL, p]);
};

test('rapport intact → diffusable (exit 0), moteur compilé, exécuté et vues pilotées', () => {
  const r = node([TOOL, REF]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /COMPILÉ et EXÉCUTÉ/);
  assert.match(r.stdout, /vues pilotées/);
  assert.match(r.stdout, /contrat de restitution tenu/);
});

test('le rendu déclare sa famille de restitution et ses composants de lecture', () => {
  assert.match(OK, /<body[^>]*data-restitution="rapport"/);
  assert.ok((OK.match(/<article class="kpi">/g) ?? []).length >= 3, 'au moins 3 KPI attendus');
  assert.ok((OK.match(/class="chemin"/g) ?? []).length >= 2, 'au moins 2 chemins de lecteur attendus');
  assert.match(OK, /<footer class="ecarts">/);
  assert.match(OK, /<figcaption>[^<]*\?<\/figcaption>/);
});

test('moteur qui ne COMPILE pas (accolade manquante) → exit 1', () => {
  const r = variante('syntax', (h) => h.replace('function montreVue(k){', 'function montreVue(k){ if(true{ '));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ne compile pas/);
});

test("moteur qui lève à l'INITIALISATION (ReferenceError) → exit 1", () => {
  const r = variante('init', (h) => h.replace('function montreVue(k){', 'variableJamaisDefinie.appel();\nfunction montreVue(k){'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /lève à l'initialisation/);
});

test("moteur qui casse AU CLIC d'une vue → exit 1 (invisible pour un contrôle statique)", () => {
  const r = variante('clic', (h) => h.replace('function montreVue(k){', 'function montreVue(k){ null.x; '));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /au clic/);
});

test('rapport sans moteur JS du tout → exit 1 (rapport inerte)', () => {
  const r = variante('inerte', (h) => h.replace(/<script>[\s\S]*?<\/script>/, ''));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /aucun moteur JS exploitable|navigation/);
});

test('famille de restitution non déclarée → exit 1 (RL-1)', () => {
  const r = variante('sans-famille', (h) => h.replace(' data-restitution="rapport"', ''));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /famille de restitution non déclarée/);
});

test('vue absente du sommaire → exit 1 (chapitre perdu, RL-1)', () => {
  const r = variante('vue-orpheline', (h) => h.replace('data-vue="v-methode"', 'data-vue-neutralise="v-methode"'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /absente du sommaire/);
});

test("entrée de sommaire sans destination → exit 1 (lien mort, RL-1)", () => {
  const r = variante('entree-morte', (h) => h.replace('<section class="vue" id="v-methode"', '<section class="vue" id="v-fantome"'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /sans section de destination|absente du sommaire/);
});

test('KPI sans repère de lecture → exit 1 (RL-3 : un chiffre ne se lit pas seul)', () => {
  const r = variante('kpi-nu', (h) => h.replace(/(class="k-repere" id="kr-score">)[^<]*/, '$1'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /sans repère de lecture/);
});

test("manifeste d'écarts retiré → exit 1 (RL-10 : l'absence d'écart se déclare)", () => {
  const r = variante('sans-manifeste', (h) => h.replace(/<footer class="ecarts">[\s\S]*?<\/footer>/, ''));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /manifeste d'écarts/);
});

test('tableau long sans filtres → exit 1 (RL-5 : au-delà de 8 lignes, tri et filtres sont dus)', () => {
  const r = variante('table-nue', (h) => {
    const i = h.indexOf('<table id="rtable"');
    const j = h.indexOf('</tbody>', i);
    assert.ok(i > 0 && j > i, 'le tableau des règles doit exister dans le rendu');
    return h.slice(0, j) + '<tr><td>ligne ajoutée</td></tr>'.repeat(8) + h.slice(j);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /sans data-filterable/);
});
