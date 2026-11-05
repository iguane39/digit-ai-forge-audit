// TF-2145 (décision humaine D-171 (a) du 04/11/2026) — la forme du rapport d'audit POC-to-Prod est le RENDU PAR DÉFAUT
// de build-rapport. Le porteur : « Logiquement le format générique de la Factory, ce n'est pas celui généré. »
//
// Ce banc prouve, à double sens quand une règle est en jeu :
//   · le défaut et l'option : sans option, la forme POC-to-Prod ; `--forme vues`, l'ancien rendu ; une forme inconnue
//     est refusée (sortie 2) ;
//   · le rendu est DÉTERMINISTE (même donnée, même fichier) et alimenté par la donnée : chaque règle, chaque constat,
//     chaque action du plan (calcul unique buildPlan) y figure, et ce qui n'a pas de source est déclaré ;
//   · le schéma d'architecture est tracé par ports et voies : 0 flèche qui traverse un nœud non extrémité et 0 paire de
//     flèches confondues, sur les fixtures ET sur une architecture dense ; la mesure MORD (rouge construit) ;
//   · les libellés du moteur existent dans les deux langues ; la palette sombre redéclare chaque jeton de couleur ;
//   · la porte de conformité de la forme (`verifier-forme-rapport.mjs`) passe son auto-test à double sens, et
//     verifier-rapport-html la joue.
//
// Lancer : node --test tests/oracles/rapport-forme-poc-to-prod.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculerSchema, mesurerRoutage, mesurerRoutageSvg, renderSchemaArchitecture } from '../../tools/schema-architecture.mjs';
import { LIBELLES, construireDonnees, cssSombre, jetonsDuTheme, phrases, GABARIT_FICHIER } from '../../tools/rapport-poc-to-prod.mjs';
import { buildPlan } from '../../tools/rapport-engine.mjs';
import { loadYaml } from '../../tools/lib.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 180000, maxBuffer: 1e8 });
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'forme-poc-'));
const fixture = (nom) => JSON.parse(fs.readFileSync(path.join(RACINE, 'tests', 'fixtures', nom), 'utf8'));
const rendre = (nom, json, ...opts) => {
  const out = path.join(dossier, `${nom}.html`);
  const r = node([path.join(RACINE, 'tools', 'build-rapport.mjs'), json, '--tenant', TENANT, '--out', out, ...opts]);
  return { r, out, html: r.status === 0 ? fs.readFileSync(out, 'utf8') : '' };
};
const ecrire = (nom, d) => { const p = path.join(dossier, `${nom}.json`); fs.writeFileSync(p, JSON.stringify(d), 'utf8'); return p; };
const RICHE = path.join(RACINE, 'tests', 'fixtures', 'rapport-data-riche.json');
const VALIDE = path.join(RACINE, 'tests', 'fixtures', 'rapport-data-valid.json');

// ── Défaut, option, refus ───────────────────────────────────────────────────────────────────────
test('TF-2145 — sans option, build-rapport rend la forme POC-to-Prod ; --forme vues rend l\'ancien rendu ; une forme inconnue sort 2', () => {
  const defaut = rendre('defaut', VALIDE);
  assert.equal(defaut.r.status, 0, defaut.r.stderr);
  assert.match(defaut.html, /<meta name="auditcore-forme" content="poc-to-prod">/, 'le rendu par défaut ne déclare pas la forme POC-to-Prod');
  assert.match(defaut.html, /<div class="app" data-page="donnees">/);
  assert.match(defaut.r.stdout, /forme poc-to-prod/);
  const vues = rendre('vues', VALIDE, '--forme', 'vues');
  assert.equal(vues.r.status, 0, vues.r.stderr);
  assert.doesNotMatch(vues.html, /auditcore-forme/, 'le rendu par vues ne doit pas se déclarer forme POC-to-Prod');
  assert.match(vues.html, /<nav class="toc vues"/);
  const inconnue = rendre('inconnue', VALIDE, '--forme', 'tableau');
  assert.equal(inconnue.r.status, 2, 'une forme inconnue doit être refusée avec l\'usage');
  assert.match(inconnue.r.stderr, /--forme/);
});

test('TF-2145 — les deux formes émettent le MÊME plan de remédiation (bloc embarqué) et le même YAML', () => {
  const a = rendre('plan-poc', VALIDE), b = rendre('plan-vues', VALIDE, '--forme', 'vues');
  const plan = (h) => JSON.parse(/<script type="application\/json" id="remediation-plan-json">([\s\S]*?)<\/script>/.exec(h)[1].replace(/\\u003c/g, '<')).actions;
  assert.deepEqual(plan(a.html), plan(b.html));
  const yaml = (o) => fs.readFileSync(o.replace(/\.html$/, '.remediation-actions.yaml'), 'utf8');
  assert.equal(yaml(a.out), yaml(b.out));
});

test('TF-2145 — le rendu est déterministe : deux rendus de la même donnée sont identiques octet pour octet', () => {
  const a = rendre('det-a', RICHE), b = rendre('det-b', RICHE);
  assert.equal(a.r.status, 0, a.r.stderr);
  assert.ok(a.html.length > 100000);
  assert.equal(a.html, b.html, 'deux rendus de la même donnée diffèrent');
});

// ── Correspondance des champs : rien d'omis, rien d'inventé ─────────────────────────────────────
test('TF-2145 — chaque règle, chaque constat et chaque action de la donnée figurent dans la forme ; le plan est celui de buildPlan', () => {
  const d = fixture('rapport-data-riche.json');
  const dims = loadYaml(path.join(RACINE, 'core', 'dimensions', 'dimensions.yaml'));
  const D = construireDonnees(d, { dimensions: dims.dimensions, families: dims.families, lang: 'fr' });
  assert.equal(D.ORDERED_DOMAINS.length, 18, 'les 18 dimensions du référentiel');
  assert.deepEqual(D.ADRS.map((a) => a.id), d.regles.map((r) => r.id), 'une ligne par règle instruite');
  for (const r of d.regles) assert.equal(D.ADR_RESP[r.id].verdict, r.verdict, `${r.id} : verdict repris tel quel`);
  const constatsRendus = D.ORDERED_DOMAINS.flatMap((k) => D.DOMAINS[k].constats.map((c) => c.titre));
  for (const c of d.constats) assert.ok(constatsRendus.includes(c.titre), `constat « ${c.titre} » absent de sa dimension`);
  const plan = buildPlan(d);
  const ids = new Set(plan.map((a) => a.id));
  for (const k of D.ORDERED_DOMAINS) for (const a of D.DOMAINS[k].plan_action) assert.ok(ids.has(a.id), `action ${a.id} de ${k} absente du plan de buildPlan`);
  for (const [id, r] of Object.entries(D.ADR_RESP)) if (r.rem_id) assert.ok(ids.has(r.rem_id), `${id} renvoie à ${r.rem_id}, absente du plan`);
  // ce qui n'a pas de source est DÉCLARÉ (manifeste), jamais inventé
  assert.ok(D.ecarts.some((e) => /note pour l'autorité/i.test(e)), 'l\'absence de note pour l\'autorité doit être déclarée');
  assert.ok(D.ecarts.some((e) => /introductions de famille sont calculées/i.test(e)), 'le calcul des introductions de famille doit être déclaré');
  for (const f of D.FAMILIES) assert.ok(f.intro.length > 20 && !/\{\{/.test(f.intro));
});

test('TF-2145 — une donnée sans architecture ni base : pas d\'onglet de schéma, et le manifeste le dit', () => {
  const d = fixture('rapport-data-valid.json');
  delete d.architecture; delete d.db_schema;
  const { r, html } = rendre('sans-schemas', ecrire('sans-schemas', d));
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(html, /aria-label="Schéma d'architecture"/);
  assert.match(html, /Schéma d&#39;architecture absent des données|Schéma d'architecture absent des données/);
  assert.match(html, /Schéma de base de données absent des données/);
});

test('TF-2145 — les cartes de synthèse reprennent le texte rédigé sans le réécrire (une puce par phrase)', () => {
  assert.deepEqual(phrases('Première phrase. Deuxième phrase ; Troisième ?'), ['Première phrase.', 'Deuxième phrase ;', 'Troisième ?']);
  const { html } = rendre('syntheses', RICHE);
  const d = fixture('rapport-data-riche.json');
  for (const [k, v] of Object.entries(d.syntheses)) {
    assert.match(html, new RegExp(`<th>${k}</th>`), `carte « ${k} » absente`);
    for (const p of phrases(v)) assert.ok(html.includes(p.replace(/'/g, '&#39;')) || html.includes(p), `phrase de la carte « ${k} » absente ou réécrite : ${p}`);
  }
});

// ── Schéma : ports et voies, mesure à 0/0, et la mesure mord ────────────────────────────────────
function dense() {
  const B = ['a', 'b', 'c', 'd', 'e'], nodes = [], edges = [];
  B.forEach((b, i) => { for (let k = 0; k < [2, 4, 5, 3, 2][i]; k++) nodes.push({ id: `${b}${k}`, bande: b, label: `Nœud ${b}${k} au libellé long`, sub: 'sous-titre', style: ['blue', 'teal', 'gray', 'amber', 'purple', 'coral'][k % 6] }); });
  let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const ids = nodes.map((n) => n.id);
  for (let i = 0; i < 40; i++) { const a = ids[Math.floor(rnd() * ids.length)], b = ids[Math.floor(rnd() * ids.length)]; if (a !== b) edges.push({ from: a, to: b, style: i % 7 === 0 ? 'dashed' : i % 11 === 0 ? 'coral' : undefined }); }
  edges.push({ from: 'b0', to: 'b1' }, { from: 'b1', to: 'b0' }, { from: 'b0', to: 'b3' }, { from: 'a0', to: 'e1' }, { from: 'e0', to: 'a1' }, { from: 'a0', to: 'e1' });
  return { bandes: B.map((b) => ({ key: b, label: `Bande ${b}` })), nodes, edges };
}
const geometrie = (sc) => ({ noeuds: sc.noeuds.map((n) => ({ id: n.id, x1: n.x, y1: n.y, x2: n.x + n.w, y2: n.y + n.h })), aretes: sc.aretes.map((e) => ({ i: e.i, de: e.from, vers: e.to, points: e.points })) });

test('TF-2145 — routage à ports et voies : 0 traversée, 0 paire confondue (fixtures valide, riche, et 40 flèches denses ou plus)', () => {
  for (const [nom, arch] of [['valide', fixture('rapport-data-valid.json').architecture], ['riche', fixture('rapport-data-riche.json').architecture], ['dense', dense()]]) {
    const sc = calculerSchema(arch);
    const m = mesurerRoutage(geometrie(sc));
    assert.equal(m.traversees.length, 0, `${nom} : ${JSON.stringify(m.traversees.slice(0, 3))}`);
    assert.equal(m.confondues.length, 0, `${nom} : ${JSON.stringify(m.confondues.slice(0, 3))}`);
    const ms = mesurerRoutageSvg(renderSchemaArchitecture(arch));
    assert.equal(ms.noeuds, arch.nodes.length, `${nom} : chaque nœud est dessiné`);
    assert.equal(ms.traversees.length + ms.confondues.length, 0, `${nom} : la mesure sur le SVG rendu doit aussi rendre 0/0`);
  }
  const a = dense();
  assert.ok(a.edges.length >= 40, `la fixture dense porte au moins 40 flèches (${a.edges.length})`);
  assert.equal(calculerSchema(a).aretes.length, a.edges.length, 'chaque flèche de la fixture dense est tracée');
});

test('TF-2145 — la mesure MORD : un tracé à travers un nœud et deux flèches superposées sont comptés', () => {
  const g = { noeuds: [{ id: 'a', x1: 0, y1: 0, x2: 100, y2: 40 }, { id: 'b', x1: 0, y1: 200, x2: 100, y2: 240 }, { id: 'm', x1: 0, y1: 100, x2: 100, y2: 140 }],
    aretes: [{ i: 0, de: 'a', vers: 'b', points: [[50, 40], [50, 200]] }, { i: 1, de: 'b', vers: 'a', points: [[51, 200], [51, 40]] }] };
  const m = mesurerRoutage(g);
  assert.equal(m.traversees.length, 2, 'les deux flèches droites traversent le nœud intermédiaire m');
  assert.equal(m.confondues.length, 1, 'deux segments verticaux à 1 px l\'un de l\'autre, superposés, sont une paire confondue');
  // la même donnée, routée par le module : plus aucune traversée ni confusion
  const arch = { bandes: [{ key: 'h', label: 'H' }, { key: 'mi', label: 'M' }, { key: 'b', label: 'B' }],
    nodes: [{ id: 'a', bande: 'h', label: 'A' }, { id: 'm', bande: 'mi', label: 'M' }, { id: 'b', bande: 'b', label: 'B' }],
    edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }] };
  const m2 = mesurerRoutage(geometrie(calculerSchema(arch)));
  assert.deepEqual([m2.traversees.length, m2.confondues.length], [0, 0]);
});

test('TF-2145 — un nœud d\'une bande non déclarée et une flèche vers un nœud inconnu ne disparaissent pas en silence', () => {
  const sc = calculerSchema({ bandes: [{ key: 'a', label: 'A' }], nodes: [{ id: 'x', bande: 'a', label: 'X' }, { id: 'y', bande: 'inconnue', label: 'Y' }], edges: [{ from: 'x', to: 'y' }, { from: 'x', to: 'z' }] });
  assert.ok(sc.noeuds.some((n) => n.id === 'y'), 'le nœud d\'une bande non déclarée est dessiné dans une bande implicite');
  assert.equal(sc.ignores.length, 1, 'la flèche vers un nœud inconnu est déclarée ignorée');
});

// ── Libellés, palette sombre, agnosticité ──────────────────────────────────────────────────────
test('TF-2145 — chaque libellé appelé par le moteur existe en français ET en anglais', () => {
  const gabarit = fs.readFileSync(GABARIT_FICHIER, 'utf8');
  const directs = [...gabarit.matchAll(/\bT\('([a-z0-9_.]+)'/g)].map((m) => m[1]).filter((k) => !k.endsWith('.'));
  const conditionnels = [...gabarit.matchAll(/\? '([a-z][a-z0-9_]*\.[a-z0-9_.]+)' : '([a-z][a-z0-9_]*\.[a-z0-9_.]+)'/g)].flatMap((m) => [m[1], m[2]]);
  const familles = {
    'verdict.': ['conforme', 'partiel', 'non_conforme', 'sans_objet', 'a_evaluer'], 'crit.': ['fatal', 'bloquant', 'majeur', 'standard'],
    'enf.': ['blocking', 'required', 'advisory', 'recommendation'], 'gate1b.': ['nogo', 'reserve', 'go'], 'prio.': ['urgent', 'prio', 'quick', 'norm'],
    'oui_non.': ['oui', 'non'], 'score.cran.': ['1', '2', '3', '4', '5'], 'schema.style.': ['purple', 'blue', 'teal', 'coral', 'amber', 'gray'],
    'tm.preuve.': ['avec', 'sans'], 'tm.action.': ['avec', 'sans'], 'plan.source.': ['regle', 'dimension'],
    'reprise.marque.': ['ok', 'partial', 'gap', 'manual', 'autre'], 'reprise.legende.': ['ok', 'partial', 'gap', 'manual'],
  };
  const vues = ['regles', 'plan', 'reprise', 'tests', 'analyses', 'composants'].flatMap((v) => ['titre', 'h', 'intro'].map((x) => `vue.${v}.${x}`));
  const cles = new Set([...directs, ...conditionnels, ...vues, ...Object.entries(familles).flatMap(([p, s]) => s.map((x) => p + x))]);
  for (const lang of ['fr', 'en']) {
    const manquent = [...cles].filter((k) => !(k in LIBELLES[lang]));
    assert.deepEqual(manquent, [], `${lang} : libellé(s) appelé(s) par le moteur et absent(s) du dictionnaire`);
  }
  assert.deepEqual(Object.keys(LIBELLES.fr).sort(), Object.keys(LIBELLES.en).sort(), 'les deux dictionnaires portent les mêmes clés');
});

test('TF-2145 — rendu anglais : langue, libellés du moteur et signature anglaise', () => {
  const tenantDir = path.join(dossier, 'tenant-en');
  fs.cpSync(path.join(RACINE, 'config', 'tenants', 'exemple'), tenantDir, { recursive: true });
  const ty = path.join(tenantDir, 'tenant.yaml');
  fs.writeFileSync(ty, fs.readFileSync(ty, 'utf8').replace('language: fr', 'language: en'), 'utf8');
  const out = path.join(dossier, 'en.html');
  const r = node([path.join(RACINE, 'tools', 'build-rapport.mjs'), RICHE, '--tenant', ty, '--out', out]);
  assert.equal(r.status, 0, r.stderr);
  const html = fs.readFileSync(out, 'utf8');
  assert.match(html, /<html lang="en"/);
  assert.match(html, /<h1>Audit report — /);
  assert.match(html, /Traceability — rules, evidence and actions/);
  assert.match(html, /generated by AuditCore/);
  const v = node([path.join(RACINE, 'tools', 'verifier-rapport-html.mjs'), out, '--sans-oracles-design']);
  assert.equal(v.status, 0, v.stderr);
});

test('TF-2145 — palette sombre : chaque jeton de couleur littéral du thème est redéclaré sous [data-theme="dark"], en littéral dérivé', () => {
  const { html } = rendre('sombre', RICHE);   // génère aussi le thème du tenant s'il manque (runner neuf)
  const theme = fs.readFileSync(path.join(RACINE, 'config', 'tenants', 'exemple', 'theme', 'theme.css'), 'utf8');
  const sombre = cssSombre(theme);
  const bloc = /:root\[data-theme="dark"\]\{([^}]*)\}/.exec(sombre)[1];
  assert.ok(jetonsDuTheme(theme).length >= 10, 'le thème du tenant porte ses jetons de couleur');
  for (const [k] of jetonsDuTheme(theme)) assert.match(bloc, new RegExp(`${k}:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6});`), `${k} absent du thème sombre`);
  assert.match(sombre, /@media print\{:root,:root\[data-theme="dark"\]\{--bg:/, 'l\'impression revient aux jetons clairs');
  // le bloc de parité redéclare les formules (une source, deux projections)
  assert.match(html, /:root\[data-theme="dark"\]\{[^}]*--r-rouge-fond:color-mix\(/);
});

test('TF-2145 — le gabarit est agnostique : aucune couleur littérale hors des blocs de jetons, aucun champ de marque', () => {
  const g = fs.readFileSync(GABARIT_FICHIER, 'utf8');
  const style = /<style>([\s\S]*?)<\/style>/.exec(g)[1].replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\{\{[A-Z_]+\}\}/g, ' ');
  const fautes = [];
  for (const m of style.matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)) {
    const decls = m[2].split(';').map((x) => x.trim()).filter(Boolean);
    if (decls.length && decls.every((x) => x.startsWith('--'))) continue;
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(m[2].replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, ' '))) fautes.push(m[1].trim().slice(0, 40));
  }
  assert.deepEqual(fautes, [], 'couleur(s) en dur dans la feuille du gabarit');
  const champs = [...new Set([...g.matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1]))];
  assert.ok(champs.length >= 20, 'le gabarit porte ses champs');
  assert.ok(!champs.some((c) => /MARQUE|LOGO|CLIENT/.test(c)), `champ de marque inattendu : ${champs.join(', ')}`);
});

// ── Porte de conformité de la forme ────────────────────────────────────────────────────────────
test('TF-2145 — verifier-forme-rapport : auto-test à double sens (rendu réel conforme, chaque mutation refusée pour SA règle)', () => {
  const r = node([path.join(RACINE, 'tools', 'verifier-forme-rapport.mjs'), '--self-test']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PASS/);
});

test('TF-2145 — verifier-rapport-html joue la porte de la forme : un schéma qui traverse un nœud est REFUSÉ', () => {
  const { out, html } = rendre('porte', RICHE);
  const ok = node([path.join(RACINE, 'tools', 'verifier-rapport-html.mjs'), out, '--sans-oracles-design']);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /forme POC-to-Prod conforme/);
  const svg = /<svg viewBox="[^"]*"[^>]*aria-label="Schéma d'architecture"[\s\S]*?<\/svg>/.exec(html)[0];
  const premiere = /<polyline\b[^>]*points="([^"]*)"/.exec(svg)[1];
  const noeud = /<g class="a-[a-z]+" id="arch-n-(db|obs)"[^>]*>[\s\S]*?<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg);
  const cx = Number(noeud[2]) + Number(noeud[4]) / 2, cy = Number(noeud[3]) + Number(noeud[5]) / 2;
  const casse = path.join(dossier, 'porte-casse.html');
  fs.writeFileSync(casse, html.replace(svg, svg.replace(`points="${premiere}"`, `points="${premiere} ${cx},${cy - 30} ${cx},${cy + 30}"`)), 'utf8');
  const ko = node([path.join(RACINE, 'tools', 'verifier-rapport-html.mjs'), casse, '--sans-oracles-design']);
  assert.equal(ko.status, 1, 'une flèche qui traverse un nœud doit rendre le rapport non diffusable');
  assert.match(ko.stderr, /forme POC-to-Prod \[F13\]/);
});
