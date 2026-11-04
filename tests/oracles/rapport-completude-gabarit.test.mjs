// TF-2138 (RU-5, voisin de TF-1001) — un rapport qui ne remplit pas `rapport-audit.template.md` n'est pas
// diffusable. Relevé par une campagne du 04/11/2026 : `verifier-rapport` et `verifier-rapport-html` rendaient
// exit 0 sur un rapport SANS cartes de synthèse, SANS périmètre D00, SANS architecture, SANS section
// tests/analyses/composants et SANS verdict de gate ; et vider `actions` pour passer le refus des redites
// (TF-0624) laissait vide le plan d'action de chaque dimension.
//
// Deux contrôles, deux fixtures chacun (rouge, verte) :
//   · complétude du gabarit — données (`verifier-rapport`) ET rendu (`verifier-rapport-html`) ;
//   · mode « action par constat » : une dimension qui porte un écart (constat ou règle non conforme /
//     partielle) exige un plan d'action NON VIDE ; l'action se rattache à un constat (`constat_ref`) et
//     nomme les règles qu'elle COUVRE (`couvre`), si bien que la règle couverte n'ouvre pas une seconde
//     action au texte voisin — la redite que le plan refuse n'est plus le prix d'un plan non vide.
//
// Lancer : node --test tests/oracles/rapport-completude-gabarit.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 1e8 });
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'completude-'));
const clone = (o) => JSON.parse(JSON.stringify(o));
const fixture = (nom) => JSON.parse(fs.readFileSync(path.join(RACINE, 'tests', 'fixtures', nom), 'utf8'));

/**
 * Un rapport COMPLET au sens du gabarit, construit ici à partir de la fixture valide : gate prononcé, trois
 * cartes de synthèse, périmètre D00, architecture, matière de la vue « Données analysées », et un plan
 * d'action non vide pour chaque dimension qui porte un écart (D05 : règle non conforme CTL-D05-01).
 */
function complet() {
  const d = clone(fixture('rapport-data-valid.json'));
  d.gate = { verdict: 'GO' };
  d.syntheses = {
    fonctionnelle: 'Application de suivi de commandes pour les équipes logistiques ; trois profils d\'utilisateurs.',
    technique: 'Service web et base relationnelle, déployés en conteneurs sur un seul environnement.',
    audit: 'Audit conduit le 10/08/2026 : deux scans automatisés, revue statique et inspections manuelles.',
  };
  d.dimensions = d.dimensions.map((x) => (x.id === 'D00'
    ? { ...x, resume: 'Périmètre : suivi des commandes ; hors périmètre : facturation. Valeur métier : délai de préparation.' } : x));
  d.architecture = {
    bandes: [{ key: 'app', label: 'Application' }, { key: 'data', label: 'Données' }],
    nodes: [{ id: 'api', bande: 'app', label: 'API', sub: 'service', style: 'purple' },
      { id: 'db', bande: 'data', label: 'Base', sub: 'relationnelle', style: 'teal' }],
    edges: [{ from: 'api', to: 'db' }],
  };
  // idempotent : la fixture versionnée porte déjà ces blocs (elle les remplit aussi) — on les reprend à l'identique.
  d.constats = [...(d.constats ?? []).filter((c) => c.id !== 'C-D05-1').map((c) => ({ ...c, id: 'C-D02-1', dimension: 'D02' })),
    { id: 'C-D05-1', dimension: 'D05', titre: 'Aucun contrôle de la fraîcheur des données', severite: 'Majeur',
      desc: 'Les jeux de données ne portent aucune date de dernière mise à jour.', preuves: [{ ref: 'etl/charge.py:41' }] }];
  d.actions = [...(d.actions ?? []).filter((a) => a.dimension !== 'D05'),
    { id: 'REM-D05-090', titre: 'Horodater chaque jeu de données à sa publication', desc: 'Ajouter la date de dernière mise à jour au catalogue.',
      dimension: 'D05', tag: 'prio', effort: '1j', severite: 'Majeur', constat_ref: 'C-D05-1',
      verification: 'chaque jeu du catalogue porte une date de mise à jour de moins de 24 h' }];
  return d;
}
const ecrire = (nom, d) => { const p = path.join(dossier, `${nom}.json`); fs.writeFileSync(p, JSON.stringify(d), 'utf8'); return p; };
const donnees = (nom, d) => node([path.join(RACINE, 'tools', 'verifier-rapport.mjs'), ecrire(nom, d)]);
function rendre(nom, d) {
  const json = ecrire(nom, d);
  const html = path.join(dossier, `${nom}.html`);
  const b = node([path.join(RACINE, 'tools', 'build-rapport.mjs'), json, '--tenant', TENANT, '--out', html]);
  assert.equal(b.status, 0, b.stderr);
  return html;
}
const rendu = (html) => node([path.join(RACINE, 'tools', 'verifier-rapport-html.mjs'), html]);

// ── Verdict de référence : le rapport complet passe, sur les deux gates ──────────────────────────────
test('TF-2138 VERT — un rapport qui remplit le gabarit est diffusable : données ET rendu, exit 0', () => {
  const d = complet();
  const g = donnees('complet', d);
  assert.equal(g.status, 0, `données : ${g.stderr}`);
  const r = rendu(rendre('complet', d));
  assert.equal(r.status, 0, `rendu : ${r.stderr}`);
});

// ── Complétude des blocs du gabarit : une fixture rouge par bloc ─────────────────────────────────────
const BLOCS = [
  ['verdict de gate', (d) => { delete d.gate; }, /gate/i],
  ['cartes de synthèse (toutes)', (d) => { delete d.syntheses; }, /synthèse/i],
  ['carte de synthèse « technique »', (d) => { delete d.syntheses.technique; }, /synthèse.*technique|technique.*synthèse/i],
  ['périmètre D00', (d) => { d.dimensions = d.dimensions.map((x) => (x.id === 'D00' ? { id: 'D00', score: x.score, gate1b: x.gate1b, preuves: x.preuves } : x)); }, /D00/],
  ['schéma d\'architecture', (d) => { delete d.architecture; }, /architecture/i],
  ['section tests / analyses / composants', (d) => { delete d.tests; delete d.analyses; delete d.composants; }, /tests.*analyses.*composants/i],
];
for (const [nom, muter, motif] of BLOCS) {
  test(`TF-2138 ROUGE — gate de données : sans ${nom}, le rapport est NON diffusable (exit 1, bloc nommé)`, () => {
    const d = complet();
    muter(d);
    const g = donnees(`sans-${nom.replace(/\W+/g, '-')}`, d);
    assert.equal(g.status, 1, `accepté (exit ${g.status}) sans ${nom}`);
    assert.match(g.stderr, /gabarit/, 'le refus ne dit pas que le gabarit n\'est pas rempli');
    assert.match(g.stderr, motif, `le refus ne nomme pas le bloc manquant : ${g.stderr}`);
  });
}

test('TF-2138 ROUGE — gate de données : un verdict de gate hors vocabulaire est refusé', () => {
  const d = complet();
  d.gate = { verdict: 'PEUT-ÊTRE' };
  const g = donnees('gate-hors-vocabulaire', d);
  assert.equal(g.status, 1, g.stderr);
  assert.match(g.stderr, /gate.*PEUT-ÊTRE/i);
});

test('TF-2138 ROUGE — gate de rendu : un rapport rendu sans bloc du gabarit est NON diffusable', () => {
  const sans = {
    'cartes de synthèse': [(d) => { delete d.syntheses; }, /synthèse/i],
    'périmètre D00': [(d) => { d.dimensions = d.dimensions.map((x) => (x.id === 'D00' ? { id: 'D00', score: x.score, gate1b: x.gate1b, preuves: x.preuves } : x)); }, /D00/],
    'schéma d\'architecture': [(d) => { delete d.architecture; }, /architecture/i],
    'section tests / analyses / composants': [(d) => { delete d.tests; delete d.analyses; delete d.composants; }, /Données analysées|tests.*analyses.*composants/i],
  };
  for (const [nom, [muter, motif]] of Object.entries(sans)) {
    const d = complet();
    muter(d);
    const r = rendu(rendre(`rendu-sans-${nom.replace(/\W+/g, '-')}`, d));
    assert.equal(r.status, 1, `rendu accepté (exit ${r.status}) sans ${nom}`);
    assert.match(r.stderr, /gabarit/, `${nom} : le refus ne dit pas que le gabarit n'est pas rempli`);
    assert.match(r.stderr, motif, `${nom} : le refus ne nomme pas le bloc : ${r.stderr}`);
  }
});

// ── Mode « action par constat » : un plan d'action NON VIDE par dimension qui porte un écart ─────────
test('TF-2138 ROUGE — vider `actions` pour passer le refus des redites laisse un plan d\'action vide : refusé, dimension nommée', () => {
  const d = complet();
  d.actions = [];
  const g = donnees('actions-videes', d);
  assert.equal(g.status, 1, `accepté (exit ${g.status}) alors que le plan d'action de D02 et D05 est vide`);
  assert.match(g.stderr, /plan d'action/i);
  assert.match(g.stderr, /D05/, 'la dimension D05 (règle non conforme + constat) n\'est pas nommée');
  assert.match(g.stderr, /D02/, 'la dimension D02 (constat) n\'est pas nommée');
});

test('TF-2138 ROUGE — gate de rendu : une dimension qui porte un écart sans tableau de plan d\'action est refusée', () => {
  const d = complet();
  d.actions = [];
  const r = rendu(rendre('rendu-actions-videes', d));
  assert.equal(r.status, 1, `rendu accepté (exit ${r.status}) avec des dimensions en écart sans plan d'action`);
  assert.match(r.stderr, /plan d'action/i);
  assert.match(r.stderr, /D05/);
});

test('TF-2138 VERT — une dimension SANS écart n\'exige pas de plan d\'action (le plan vide n\'est refusé que s\'il y a quelque chose à traiter)', () => {
  const d = complet();
  d.regles = d.regles.filter((r) => r.verdict !== 'non_conforme');
  d.constats = [];
  d.actions = [];
  const g = donnees('sans-ecart', d);
  assert.equal(g.status, 0, g.stderr);
  const r = rendu(rendre('sans-ecart', d));
  assert.equal(r.status, 0, r.stderr);
});

/** D05 traitée « par constat » : l'action reprend, mot pour mot, la remédiation de la règle non conforme. */
function parConstat({ couvre }) {
  const d = complet();
  const regle = d.regles.find((r) => r.id === 'CTL-D05-01');
  d.actions = d.actions.filter((a) => a.dimension !== 'D05');
  d.actions.push({
    titre: regle.possible, dimension: 'D05', tag: 'prio', effort: '1j', severite: 'Majeur', constat_ref: 'C-D05-1',
    verification: regle.verification_cloture, ...(couvre ? { couvre: [regle.id] } : {}),
  });
  return d;
}

test('TF-2138 ROUGE — sans `couvre`, l\'action de dimension et la règle non conforme se REDISENT : le rendu refuse (le piège)', () => {
  const r = rendu(rendre('redite', parConstat({ couvre: false })));
  assert.equal(r.status, 1, 'la redite doit être refusée par le plan, sinon le piège n\'existe pas');
  assert.match(r.stderr, /se redisent|redite/);
});

test('TF-2138 VERT — avec `couvre`, UNE action traite le constat et la règle : plan non vide, aucune redite, rendu diffusable', () => {
  const d = parConstat({ couvre: true });
  const g = donnees('par-constat', d);
  assert.equal(g.status, 0, g.stderr);
  const html = rendre('par-constat', d);
  const r = rendu(html);
  assert.equal(r.status, 0, r.stderr);
  const m = /<script type="application\/json" id="remediation-plan-json">([\s\S]*?)<\/script>/.exec(fs.readFileSync(html, 'utf8'));
  const plan = JSON.parse(m[1].replace(/\\u003c/g, '<')).actions;
  const deD05 = plan.filter((a) => a.dimension === 'D05');
  assert.equal(deD05.length, 1, `D05 porte ${deD05.length} actions au plan au lieu d'une : la règle couverte ouvre sa propre action`);
  assert.deepEqual(deD05[0].couvre, ['CTL-D05-01'], 'l\'action nomme la règle qu\'elle couvre');
  assert.equal(plan.some((a) => a.source === 'CTL-D05-01'), false, 'la règle couverte garde une action propre');
});

test('TF-2138 ROUGE — `couvre` est un déclaratif vérifié : règle inconnue, règle conforme, constat_ref absent ou introuvable', () => {
  const cas = {
    'règle inconnue': [(a) => { a.couvre = ['CTL-D05-99']; }, /CTL-D05-99.*inconnue/],
    'règle conforme': [(a) => { a.couvre = ['CTL-D02-01']; }, /CTL-D02-01.*(conforme|aucune action|ne porte)/],
    'constat_ref absent': [(a) => { delete a.constat_ref; }, /constat_ref/],
    'constat_ref introuvable': [(a) => { a.constat_ref = 'C-INCONNU'; }, /C-INCONNU/],
  };
  for (const [nom, [muter, motif]] of Object.entries(cas)) {
    const d = parConstat({ couvre: true });
    muter(d.actions.find((a) => a.dimension === 'D05'));
    const g = donnees(`couvre-${nom.replace(/\W+/g, '-')}`, d);
    assert.equal(g.status, 1, `${nom} : accepté (exit ${g.status})`);
    assert.match(g.stderr, motif, `${nom} : ${g.stderr}`);
  }
});

// ── Les fixtures versionnées du dépôt remplissent le gabarit (la CI les joue) ────────────────────────
test('TF-2138 — les fixtures valides du dépôt passent la complétude ; les fixtures rouges restent refusées pour LEUR motif', () => {
  for (const f of ['rapport-data-valid.json', 'rapport-data-riche.json']) {
    const g = node([path.join(RACINE, 'tools', 'verifier-rapport.mjs'), path.join(RACINE, 'tests', 'fixtures', f)]);
    assert.equal(g.status, 0, `${f} : ${g.stderr}`);
  }
  for (const [f, motif] of [['rapport-data-titre-duplique.json', /dédoublé/], ['rapport-data-db-schema-invalid.json', /hors palette/]]) {
    const g = node([path.join(RACINE, 'tools', 'verifier-rapport.mjs'), path.join(RACINE, 'tests', 'fixtures', f)]);
    assert.equal(g.status, 1, f);
    assert.match(g.stderr, motif, `${f} est refusée pour une autre raison que la sienne : ${g.stderr}`);
    assert.doesNotMatch(g.stderr, /gabarit/, `${f} est refusée aussi pour un gabarit incomplet : la fixture rouge doit n'avoir QUE son défaut`);
  }
});
