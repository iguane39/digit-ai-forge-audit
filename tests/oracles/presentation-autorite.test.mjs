// TF-2142 (RU-8) — la présentation à l'autorité de décision tient son gabarit et dit la vérité du rapport.
// Relevé d'une campagne du 04/11/2026 sur `build-slides.mjs` :
//   · le filtre `severite === 'critique'` sort du vocabulaire du référentiel (Fatal / Bloquant / Majeur /
//     Standard) : « Aucun constat critique » s'affichait sur un NO-GO ;
//   · le plan était lu dans `data.actions` et non dans `buildPlan` (qui y ajoute les règles non conformes) ;
//   · 5 diapositives rendues contre 8 au gabarit `presentation-autorite.template.md` (manquaient le schéma
//     d'architecture et les contacts, entre autres).
// Classe de défaut : « générateur de livrable sans oracle ». `tools/verifier-presentation.mjs` juge désormais
// la présentation produite, et `build-slides.mjs` le joue à la production.
//
// Lancer : node --test tests/oracles/presentation-autorite.test.mjs
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
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'presentation-'));
const valide = () => JSON.parse(fs.readFileSync(path.join(RACINE, 'tests', 'fixtures', 'rapport-data-valid.json'), 'utf8'));
const ecrire = (nom, contenu) => { const p = path.join(dossier, nom); fs.writeFileSync(p, typeof contenu === 'string' ? contenu : JSON.stringify(contenu), 'utf8'); return p; };

/** Un audit NO-GO : six dimensions à 2, un constat Fatal, un Bloquant, un Majeur, une règle Fatal non conforme. */
function noGo() {
  const d = valide();
  d.gate = { verdict: 'NO-GO' };
  d.dimensions = d.dimensions.map((x) => (['D01', 'D02', 'D03', 'D04', 'D05', 'D06'].includes(x.id) ? { ...x, score: 2 } : x));
  d.constats = [
    { id: 'C-1', dimension: 'D02', titre: 'Secret de production dans le dépôt', severite: 'Fatal', desc: 'Une clé d\'accès au coffre est versionnée en clair.', preuves: [{ ref: 'config/prod.env:3' }] },
    { id: 'C-2', dimension: 'D03', titre: 'Aucune rotation des accès administrateur', severite: 'Bloquant', desc: 'Les comptes administrateur ne changent jamais de mot de passe.', preuves: [{ ref: 'infra/iam.tf:88' }] },
    { id: 'C-3', dimension: 'D05', titre: 'Jeux de données sans date de mise à jour', severite: 'Majeur', desc: 'Impossible de dater les données affichées.', preuves: [{ ref: 'etl/charge.py:41' }] },
  ];
  // une règle Fatal non conforme : son action n'existe QUE dans buildPlan (jamais dans data.actions)
  d.regles.push({ id: 'CTL-D03-07', verdict: 'non_conforme', criticite: 'Fatal', preuve: 'aucun coffre de secrets', possible: 'Migrer les secrets vers un coffre managé', verification_cloture: 'aucun secret en clair dans l\'historique git' });
  return d;
}
function produire(nom, d) {
  const json = ecrire(`${nom}.json`, d);
  const html = path.join(dossier, `${nom}.html`);
  const r = node([path.join(RACINE, 'tools', 'build-slides.mjs'), json, '--tenant', TENANT, '--out', html]);
  return { json, html, r, texte: fs.existsSync(html) ? fs.readFileSync(html, 'utf8') : '' };
}
const sections = (h) => [...h.matchAll(/<section class="slide[^"]*"[^>]*>([\s\S]*?)<\/section>/g)].map((m) => m[1]);
const brut = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const juge = (html, json, extra = []) => node([path.join(RACINE, 'tools', 'verifier-presentation.mjs'), html, '--rapport-data', json, '--tenant', TENANT, ...extra]);

test('TF-2142 ROUGE→VERT — un NO-GO se présente en 8 diapositives, au gabarit', () => {
  const { r, texte } = produire('nogo', noGo());
  assert.equal(r.status, 0, r.stderr);
  const s = sections(texte);
  assert.equal(s.length, 8, `${s.length} diapositives rendues au lieu de 8`);
  assert.match(r.stdout, /8 diapositives/);
});

test('TF-2142 ROUGE→VERT — les risques majeurs sont les constats Fatal et Bloquant, jamais « Aucun constat critique » sur un NO-GO', () => {
  const { texte } = produire('risques', noGo());
  assert.doesNotMatch(texte, /Aucun constat critique/, '« Aucun constat critique » est affiché sur un NO-GO qui porte un Fatal et un Bloquant');
  const risques = brut(sections(texte)[4] ?? '');
  assert.match(risques, /Secret de production dans le dépôt/, 'le constat Fatal manque');
  assert.match(risques, /Aucune rotation des accès administrateur/, 'le constat Bloquant manque');
  assert.doesNotMatch(risques, /Jeux de données sans date/, 'un constat Majeur est présenté comme risque majeur');
  assert.ok(risques.indexOf('Secret de production') < risques.indexOf('Aucune rotation'), 'le Fatal doit précéder le Bloquant');
});

test('TF-2142 ROUGE→VERT — le plan est lu dans buildPlan : l\'action d\'une règle non conforme y figure, les modes totalisent le plan', () => {
  const d = noGo();
  const { texte } = produire('plan', d);
  const plan = brut(sections(texte)[5] ?? '');
  assert.match(plan, /Migrer les secrets vers un coffre managé/, 'l\'action née d\'une règle non conforme (absente de data.actions) manque au plan');
  const total = [...(sections(texte)[5] ?? '').matchAll(/<td data-nb>(\d+)<\/td>/g)].reduce((n, m) => n + Number(m[1]), 0);
  const embarque = /<script type="application\/json" id="presentation-faits">([\s\S]*?)<\/script>/.exec(texte);
  assert.ok(embarque, 'la présentation embarque les faits qu\'elle affiche');
  assert.equal(total, JSON.parse(embarque[1].replace(/\\u003c/g, '<')).nb_actions, 'les modes d\'activation ne totalisent pas le plan');
  assert.ok(total >= 3, `le plan compte ${total} actions : la règle non conforme et l'action de dimension doivent y être`);
});

test('TF-2142 ROUGE→VERT — le schéma d\'architecture de la présentation est CELUI du rapport, et les contacts sont rendus', () => {
  const d = noGo();
  d.architecture = { bandes: [{ key: 'app', label: 'Application' }, { key: 'data', label: 'Données' }],
    nodes: [{ id: 'api', bande: 'app', label: 'API', sub: 'service', style: 'purple' }, { id: 'db', bande: 'data', label: 'Base', sub: 'relationnelle', style: 'teal' }],
    edges: [{ from: 'api', to: 'db' }] };
  const { json, texte } = produire('archi', d);
  const s = sections(texte);
  const svgDeck = /<svg viewBox[\s\S]*?<\/svg>/.exec(s[2] ?? '')?.[0];
  assert.ok(svgDeck, 'la diapositive 3 ne porte aucun schéma');
  const html = path.join(dossier, 'archi-rapport.html');
  assert.equal(node([path.join(RACINE, 'tools', 'build-rapport.mjs'), json, '--tenant', TENANT, '--out', html]).status, 0);
  const svgRapport = /<svg viewBox="0 0 1240[\s\S]*?<\/svg>/.exec(fs.readFileSync(html, 'utf8'))?.[0];
  assert.equal(svgDeck, svgRapport, 'second schéma divergent : celui de la présentation n\'est pas celui du rapport');
  const contacts = brut(s[7] ?? '');
  assert.match(contacts, /Design Authority/, 'l\'autorité de décision manque aux contacts');
  assert.match(contacts, /RSSI/, 'le responsable sécurité manque aux contacts');
});

test('TF-2142 — le verdict, le score et les bloquants de la présentation sont ceux du rapport (NO-GO déclaré, 6 bloquants)', () => {
  const { texte } = produire('verdict', noGo());
  const verdict = brut(sections(texte)[3] ?? '');
  assert.match(verdict, /NO-GO/);
  assert.match(verdict, /6 dimension\(s\) ≤ 2 ou Fatal/);
});

// ── L'oracle : tools/verifier-presentation.mjs ───────────────────────────────────────────────────
test('TF-2142 VERT — l\'oracle accepte la présentation produite (8 diapositives, gabarit, cohérence avec les données)', () => {
  const { json, html } = produire('oracle-vert', noGo());
  const r = juge(html, json);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /présentation conforme/);
});

test('TF-2142 ROUGE — l\'oracle refuse l\'état d\'avant : une présentation à 5 diapositives', () => {
  const { json, texte } = produire('oracle-rouge-cinq', noGo());
  // on retire le schéma, la décision et les contacts, comme le générateur d'avant ne les rendait pas
  const cinq = texte.replace(/<section class="slide[^"]*" data-gabarit="(Schéma d'architecture|Décision demandée|Contacts)">[\s\S]*?<\/section>/g, '');
  assert.equal(sections(cinq).length, 5);
  const r = juge(ecrire('oracle-rouge-cinq.html', cinq), json);
  assert.equal(r.status, 1, `accepté (exit ${r.status}) : ${r.stdout}`);
  assert.match(r.stderr, /5 diapositives rendues, le gabarit presentation-autorite en demande 8 diapositives/);
});

test('TF-2142 ROUGE — l\'oracle refuse « Aucun constat critique » sur un NO-GO qui porte un Fatal et un Bloquant', () => {
  const { json, texte } = produire('oracle-rouge-contresens', noGo());
  const faux = texte.replace(/(<section class="slide[^"]*" data-gabarit="3 risques majeurs">)[\s\S]*?(<div class="muted" style="margin-top:auto">)/,
    '$1<h2>3 risques majeurs</h2><p>Aucun constat critique.</p>$2');
  assert.match(faux, /Aucun constat critique/);
  const r = juge(ecrire('oracle-rouge-contresens.html', faux), json);
  assert.equal(r.status, 1, `accepté (exit ${r.status}) : ${r.stdout}`);
  assert.match(r.stderr, /« Aucun constat » affiché alors que les données portent 2 constat\(s\) Fatal ou Bloquant/);
});

test('TF-2142 ROUGE — l\'oracle refuse un chiffre qui contredit les données, un verdict faux, un placeholder, un schéma absent', () => {
  const d = noGo();
  d.architecture = { bandes: [{ key: 'app', label: 'Application' }], nodes: [{ id: 'api', bande: 'app', label: 'API', sub: 's', style: 'blue' }], edges: [] };
  const { json, texte } = produire('oracle-mutations', d);
  const cas = {
    'bloquants faux': [(h) => h.replace('6 dimension(s) ≤ 2 ou Fatal', '2 dimension(s) ≤ 2 ou Fatal'), /bloquants/i],
    'verdict faux': [(h) => h.replace(/NO-GO/g, 'GO'), /verdict|gate/i],
    'placeholder': [(h) => h.replace('Contexte', '{{contexte.objet}}'), /placeholder/i],
    'schéma absent': [(h) => h.replace(/<svg viewBox[\s\S]*?<\/svg>/, ''), /architecture/i],
    'ordre des diapositives': [(h) => h.replace(/data-gabarit="Contexte"/, 'data-gabarit="Contacts"'), /gabarit|ordre/i],
  };
  for (const [nom, [muter, motif]] of Object.entries(cas)) {
    const f = ecrire(`mut-${nom.replace(/\W+/g, '-')}.html`, muter(texte));
    const r = juge(f, json);
    assert.equal(r.status, 1, `${nom} : accepté (exit ${r.status})`);
    assert.match(r.stderr, motif, `${nom} : ${r.stderr}`);
  }
});

test('TF-2142 — l\'oracle déclare ce qu\'il ne juge pas quand on ne lui donne pas les données (jamais un PASS plein)', () => {
  const { html } = produire('oracle-sans-donnees', noGo());
  const r = node([path.join(RACINE, 'tools', 'verifier-presentation.mjs'), html]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout + r.stderr, /non jugé/i);
});

test('TF-2142 — build-slides joue l\'oracle à la production et le dit', () => {
  const { r } = produire('production', noGo());
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /présentation conforme/);
});

test('TF-2142 — sens vert : un GO sans constat grave dit « Aucun constat Fatal ou Bloquant », pas un faux risque', () => {
  const d = valide();
  const { r, texte } = produire('go', d);
  assert.equal(r.status, 0, r.stderr);
  assert.match(brut(sections(texte)[4] ?? ''), /Aucun constat Fatal ou Bloquant/);
});
