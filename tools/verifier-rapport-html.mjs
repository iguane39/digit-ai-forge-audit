#!/usr/bin/env node
// AuditCore — vérificateur du RENDU HTML du rapport (RAF-006, complète le gate de données).
// Contrôle le fichier produit par rapport-engine : 0 placeholder, bandeau gate, 17 sections
// de dimensions, vue des règles, signature moteur, cohérence ERD/dictionnaire.
//
// v1.6 (TF-0235 volet P4) — le rapport se lit désormais par VUES naviguées : le gate
// contrôle donc AUSSI le contrat de restitution, avec la même exigence de preuve que le
// reste du fichier. Deux principes, hérités des défauts qui ont motivé ce vérificateur :
//   • une vue déclarée au sommaire qui ne mène à aucune section, ou une section qui n'a
//     aucune entrée de sommaire, est un CHAPITRE PERDU — la génération échoue plutôt que
//     de laisser du contenu disparaître en silence ;
//   • un composant de lecture (KPI, figure, chemins, manifeste d'écarts, filtres de
//     tableau) se contrôle sur son câblage, pas sur sa présence nominale.
//
// v1.7 (TF-2145) — un rendu de la forme POC-to-Prod (rendu par défaut depuis D-171 (a)) passe en plus sa porte de
// conformité, tools/verifier-forme-rapport.mjs ; le rendu par vues (`build-rapport --forme vues`) n'en déclare pas.
// Usage: node tools/verifier-rapport-html.mjs <rapport.html>
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { rel, loadYaml, valeurFichierOuUsage } from './lib.mjs';
import { trouverRacineDesign, jouerOraclesDesign } from './oracles-design.mjs';
// TF-2145 : un rendu qui déclare la forme POC-to-Prod (rendu par défaut de build-rapport) passe AUSSI la porte de
// conformité de cette forme, en plus de tout ce qui suit — jamais à la place.
import { jugerForme } from './verifier-forme-rapport.mjs';
// TF-1737 : le check 10 juge aussi la STABILITÉ de la version actuelle, avec le prédicat même du
// producteur (une seule source, CONTRIBUTING des oracles) — jamais une regex recopiée.
import { isPrerelease } from '../oracles/maj-versions.mjs';

const USAGE = 'Usage: node tools/verifier-rapport-html.mjs <rapport.html> [--design-root <forge-design>] [--sans-oracles-design]';
const file = process.argv[2];
if (!file || file.startsWith('-')) { console.error(USAGE); process.exit(2); }
// TF-2139 (RU-6) — ORACLES DE DESIGN. Le rapport rendu est aussi jugé par `run-oracles-design` de la forge design
// (oracle-slop, oracle-tokens…), joué EN DERNIER et seulement si le reste est vert (5 s l'appel : inutile de juger
// le design d'un rapport déjà refusé). Point de branchement et résolution de la racine : `tools/oracles-design.mjs`
// (option `--design-root`, variable `FORGE_DESIGN_ROOT`, dépôt voisin `../digit-ai-forge-design`). Racine donnée
// introuvable : erreur (2). Rien trouvé : « NON JUGÉ » dit tout haut — un runner de CI ne clone pas les forges sœurs.
// `--sans-oracles-design` est le refus explicite, dit de la même façon ; il ne rend jamais le rapport « jugé ».
const designRoot = valeurFichierOuUsage(process.argv, '--design-root', USAGE);
const sansDesign = process.argv.includes('--sans-oracles-design');
const racineDesign = sansDesign ? { racine: null, motif: 'option --sans-oracles-design' }
  : trouverRacineDesign({ option: designRoot, env: process.env.FORGE_DESIGN_ROOT });
if (racineDesign.erreur) { console.error(`ERREUR: ${racineDesign.erreur}`); process.exit(2); }
const h = fs.readFileSync(file, 'utf-8');
const errors = [];
const checks = [];
const warnings = [];
// Comparaison de versions (contrat partagé avec oracles/maj-versions.mjs) : -1 / 0 / 1.
const cmpVer = (a, b) => {
  const P = v => String(v).replace(/^[^\d]*/, '').split('.').map(n => parseInt(n, 10) || 0);
  const x = P(a), y = P(b);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0) ? -1 : 1; }
  return 0;
};
/** Texte visible d'un fragment HTML (les contrôles de lisibilité portent sur ce que le lecteur lit). */
const txt = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const ph = h.match(/\{\{[^}]+\}\}/g) ?? [];
if (ph.length) errors.push(`${ph.length} placeholder(s) résiduel(s) — ex: ${[...new Set(ph)].slice(0, 3).join(', ')}`);
if (!/class="gate (std|maj|fatal)"/.test(h)) errors.push('bandeau de verdict gate absent');
// TF-1738 : deux règles bloquantes du socle HTML que le modèle du kit client violait (deux <h1>,
// aucun :root de jetons). Le moteur d'AuditCore les tient ; la porte de rendu les juge.
const nbH1 = (h.match(/<h1[\s>]/g) ?? []).length;
if (nbH1 !== 1) errors.push(`${nbH1} titre(s) <h1> — le socle HTML en exige un seul, le titre du document (TF-1738)`);
if (!/:root\s*\{[^}]*--[a-z]/i.test(h)) errors.push('aucun bloc :root de jetons CSS — le socle HTML exige les couleurs et cotes en jetons (TF-1738)');
if (!/<svg viewBox="0 0 460(?![0-9])/.test(h)) errors.push('radar par famille absent');   // garde TF-0438

const dims = loadYaml(rel('core', 'dimensions', 'dimensions.yaml')).dimensions.map(d => d.id);
const missing = dims.filter(d => !h.includes(`id="${d}"`));
if (missing.length) errors.push(`sections de dimensions manquantes: ${missing.join(', ')}`);

if (!h.includes('id="v-regles"')) errors.push('vue « toutes les règles » absente (traçabilité du référentiel)');
if (!h.includes('généré par AuditCore') && !h.includes('generated by AuditCore'))
  errors.push('signature moteur absente (fichier édité à la main ?)');
// TF-0940 — le schéma de base de données est rendu par le canevas vendoré (cartes `db-card`)
// et non plus par le moteur SVG `erd-t`. Le contrôle SUIT le marquage : un schéma sans son
// dictionnaire des tables reste refusé. Déplacer un contrôle n'est pas le désactiver — la
// fixture rouge du banc (`tests/oracles/verifier-rapport-html.test.mjs`) retire le marquage PII
// d'un rapport RICHE réellement généré et exige toujours un exit 1.
// TF-2139 : le marquage PII de l'en-tête est l'icône SVG `ico-pii` (l'emoji « 🔒 » est refusé par oracle-slop S6).
if (h.includes('class="db-card ') && !/<th>PII\s*<svg class="ico-pii"/.test(h)) errors.push('schéma de base de données présent sans dictionnaire des tables');
if (/audit précédent|rapport précédent/i.test(h)) errors.push('auto-portance: référence à un audit antérieur');

// ─────────────────────────────────────────────────────────────────────────────
// CONTRAT DE RESTITUTION (référentiel « restitution lisible », règles RL-1/3/4/9/10).
// Contrôlé ICI et pas seulement chez forge-design : le dépôt produit doit pouvoir
// refuser un rendu sans dépendre d'un dépôt frère, et sa CI tourne seule.
// ─────────────────────────────────────────────────────────────────────────────
if (!/<body[^>]*\bdata-restitution="rapport"/.test(h))
  errors.push('famille de restitution non déclarée (<body data-restitution="rapport">)');

// RL-1 · la vue d'ensemble conclut, chiffre et navigue
if (!/class="verdict"/.test(h)) errors.push('RL-1 : aucun bloc .verdict — la vue de synthèse ne conclut pas');
const kpis = [...h.matchAll(/<article class="kpi">([\s\S]*?)<\/article>/g)].map(m => m[1]);
if (kpis.length < 3) errors.push(`RL-1 : ${kpis.length} KPI (.kpi) — la synthèse en attend au moins 3`);
// RL-3 · un chiffre affiché porte sa valeur, sa définition et son repère de lecture
kpis.forEach((k, i) => {
  const val = txt((k.match(/class="k-valeur"[^>]*>([\s\S]*?)<\/span>/) ?? [])[1]);
  const def = txt((k.match(/class="kpi-d">([\s\S]*?)<\/span>/) ?? [])[1]);
  const rep = txt((k.match(/class="k-repere"[^>]*>([\s\S]*?)<\/span>/) ?? [])[1]);
  const ancre = (k.match(/class="k-valeur" aria-describedby="([^"]+)"/) ?? [])[1];
  if (!val) errors.push(`RL-3 : KPI n°${i + 1} sans valeur (.k-valeur)`);
  if (def.length < 12) errors.push(`RL-3 : KPI n°${i + 1} sans définition (.kpi-d ≥ 12 caractères)`);
  if (rep.length < 20) errors.push(`RL-3 : KPI n°${i + 1} sans repère de lecture (.k-repere ≥ 20 caractères)`);
  if (!ancre || !h.includes(`class="k-repere" id="${ancre}"`))
    errors.push(`RL-3 : KPI n°${i + 1} — la valeur ne renvoie pas à son repère (aria-describedby)`);
});

// RL-1 (suite) · vues et sommaire se répondent EXACTEMENT. Un chapitre sans entrée de
// sommaire est invisible ; une entrée sans section est un lien mort. Les deux échouent.
const entrees = [...h.matchAll(/data-vue="([^"]+)"/g)].map(m => m[1]);
const sections = [...h.matchAll(/<section class="vue(?: active)?" id="([^"]+)"/g)].map(m => m[1]);
if (entrees.length < 2) errors.push(`RL-1 : ${entrees.length} entrée(s) de navigation [data-vue] — une restitution s'organise en vues (≥ 2)`);
for (const e of entrees) if (!sections.includes(e)) errors.push(`RL-1 : entrée de sommaire « ${e} » sans section de destination (lien mort)`);
for (const s of sections) if (!entrees.includes(s)) errors.push(`RL-1 : vue « ${s} » absente du sommaire — contenu inatteignable`);
if (entrees.length && !errors.some(e => e.startsWith('RL-1'))) checks.push(`${entrees.length} vues appariées au sommaire`);

// RL-4 · un graphique énonce la question à laquelle il répond
for (const m of h.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)) {
  if (!/<svg|<canvas/.test(m[0])) continue;
  const q = txt((m[0].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/) ?? [])[1]);
  if (!q) errors.push("RL-4 : figure graphique sans figcaption — un graphique sans question n'existe pas");
  else if (!/\?$/.test(q)) errors.push(`RL-4 : figcaption « ${q.slice(0, 48)} » n'est pas une question`);
}

// RL-9 · « vous êtes X, commencez ici » — au moins deux lecteurs types
const chemins = (h.match(/class="chemin"/g) ?? []).length;
if (!/class="chemins"/.test(h) || chemins < 2)
  errors.push(`RL-9 : ${chemins} chemin(s) de lecteur — au moins 2 lecteurs types attendus (.chemins > .chemin)`);

// RL-10 · le manifeste d'écarts est présent ET dit quelque chose (« aucun écart » compris)
const manifeste = txt((h.match(/<footer class="ecarts">([\s\S]*?)<\/footer>/) ?? [])[1]);
if (!manifeste) errors.push("RL-10 : aucun manifeste d'écarts (.ecarts) — l'absence d'écart se déclare, elle ne se tait pas");
else if (manifeste.length < 20) errors.push("RL-10 : manifeste d'écarts vide");

// COMPLÉTUDE DU GABARIT `rapport-audit.template.md` (TF-2138, RU-5, voisin de TF-1001). Le rendu d'un rapport
// qui n'a pas rempli son gabarit DÉCLARE ses absences au manifeste d'écarts (RL-10) — et sortait pourtant
// « diffusable » : sans cartes de synthèse, sans périmètre D00, sans architecture, sans section
// tests/analyses/composants, sans plan d'action pour une dimension en écart. Une absence déclarée reste une
// absence : le gate la refuse, bloc par bloc. Le contrôle de DONNÉES (verifier-rapport.mjs) juge la source ;
// celui-ci juge ce qui sera LU — un HTML rendu par un moteur ancien, ou édité, passe par ici.
if (!/id="t-__syntheses"/.test(h) || !['fonctionnelle', 'technique', 'audit'].every(k => new RegExp(`<th>${k}</th>`, 'i').test(h)))
  errors.push('gabarit rapport-audit : cartes de synthèse absentes du rendu (fonctionnelle, technique, audit)');
const sectionDim = (id) => (h.match(new RegExp(`<section class="dim" id="${id}">([\\s\\S]*?)</section>`)) ?? [])[1] ?? '';
if (!/<\/h4>\s*<p>[^<]{10,}/.test(sectionDim('D00')))
  errors.push('gabarit rapport-audit : périmètre D00 non rédigé dans le rendu (la section D00 ne porte aucun résumé)');
if (!/aria-label="Schéma d'architecture"/.test(h)) errors.push('gabarit rapport-audit : schéma d\'architecture absent du rendu');
if (!h.includes('id="v-donnees"')) errors.push('gabarit rapport-audit : vue « Données analysées » (tests / analyses / composants) absente du rendu');
const sansPlan = [...h.matchAll(/<section class="dim" id="(D\d{2})">([\s\S]*?)<\/section>/g)]
  .filter(([, id, corps]) => /class="constat |class="badge v-(non_conforme|partiel)"/.test(corps) && !corps.includes(`id="t-plan-${id}"`))
  .map(([, id]) => id);
if (sansPlan.length)
  errors.push(`gabarit rapport-audit : plan d'action vide pour ${sansPlan.join(', ')} — la dimension porte un écart (constat ou règle non conforme) `
    + 'sans action ; mode « action par constat » : constat_ref + couvre, voir verifier-rapport.mjs');

// RL-5 · un tableau long se trie et se filtre, ou déclare MOTIVÉMENT qu'il ne le fait pas.
const SEUIL = 8;
let filtrables = 0;
for (const m of h.matchAll(/<table\b([^>]*)>([\s\S]*?)<\/table>/g)) {
  const [, attrs, corps] = m;
  const tb = corps.match(/<tbody>([\s\S]*?)<\/tbody>/);
  const n = tb ? (tb[1].match(/<tr[\s>]/g) ?? []).length : 0;
  if (n < SEUIL) continue;
  const id = (attrs.match(/id="([^"]+)"/) ?? [])[1];
  const nom = id ?? `tableau de ${n} lignes`;
  if (!id) { errors.push(`RL-5 : ${nom} sans id — prérequis du composant de filtres`); continue; }
  if (!/<thead>/.test(corps)) errors.push(`RL-5 : tableau « ${nom} » sans <thead> — prérequis du composant de filtres`);
  if (/data-filterable="off"/.test(attrs)) {
    if (!/data-filterable-reason="[^"]+"/.test(attrs))
      errors.push(`RL-5 : tableau « ${nom} » exempté sans motif — sans motif, ce n'est pas une exemption`);
  } else if (!/\sdata-filterable(?![-\w])/.test(attrs)) {
    errors.push(`RL-5 : tableau « ${nom} » de ${n} lignes sans data-filterable (tri et filtres dus au-delà de ${SEUIL} lignes)`);
  } else {
    filtrables++;
    if (!h.includes(`data-tf-count-for="${id}"`))
      errors.push(`RL-5 : tableau « ${nom} » filtrable sans compteur data-tf-count-for (état du filtre invisible)`);
  }
}
if (filtrables) {
  if (!/DigitAITableFilters/.test(h)) errors.push('RL-5 : tableaux filtrables sans le composant DigitAITableFilters embarqué');
  else if (!/initAll\s*\(/.test(h)) errors.push('RL-5 : composant de filtres embarqué mais jamais initialisé (initAll)');
  if (!/@media print[\s\S]{0,900}tr\[data-tf-hidden\][^}]*display:table-row/.test(h))
    errors.push("RL-5 : @media print ne réaffiche pas les lignes filtrées — l'export PDF sortirait tronqué");
  checks.push(`${filtrables} tableau(x) filtrable(s) câblé(s)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ECR-02 — du contrôle STATIQUE au contrôle EXÉCUTÉ.
// Chercher des chaînes dans le HTML ne prouve pas que le rapport FONCTIONNE : un
// `ReferenceError` ou une clé de données manquante ne casse qu'au clic, et passe
// tous les tests ci-dessus. On compile puis on EXÉCUTE réellement le moteur, en
// pilotant chaque vue comme le ferait un navigateur, sans avaler les erreurs.
// ─────────────────────────────────────────────────────────────────────────────
const scripts = [...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m => !/\bsrc=/i.test(m[1]) && !/type\s*=\s*["']application\/json["']/i.test(m[1]))
  .map(m => m[2]);
if (!scripts.length) errors.push('aucun moteur JS exploitable dans le rendu (rapport inerte ?)');

let sandbox = null;
if (scripts.length) {
  const src = scripts.join('\n;\n');
  // Check A — le moteur COMPILE (SyntaxError, const dupliqué, accolades déséquilibrées)
  try { new vm.Script(src, { filename: path.basename(file) }); }
  catch (e) { errors.push(`le moteur JS ne compile pas : ${e.message}`); }

  // Check B — le moteur S'EXÉCUTE (init) sans exception, sur un DOM minimal
  if (!errors.some(e => e.startsWith('le moteur JS ne compile pas'))) {
    const el = () => ({
      hidden: false, style: {}, textContent: '', value: '',
      classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
      querySelectorAll: () => [], appendChild(c) { return c; }, addEventListener() {},
      setAttribute() {}, removeAttribute() {}, hasAttribute: () => false, getAttribute: () => null,
    });
    // Les blocs <script type="application/json"> sont servis avec leur VRAI contenu :
    // sans cela l'auto-test interne s'exécuterait sur un rapport vide et dirait ✔ sur du néant.
    const jsonBlocks = Object.fromEntries([...h.matchAll(
      /<script\b[^>]*type\s*=\s*["']application\/json["'][^>]*id\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi,
    )].map(m => [m[1], m[2]]));
    const nodes = {};
    sandbox = {
      console: { log() {}, warn() {}, error() {}, info() {} },
      document: {
        getElementById: (id) => (nodes[id] ??= (id in jsonBlocks ? { ...el(), textContent: jsonBlocks[id] } : el())),
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener() {}, createElement: el, body: el(),
      },
      window: { addEventListener() {} }, JSON, Math, Date, setTimeout: (fn) => fn(),
    };
    sandbox.globalThis = sandbox;
    try { vm.createContext(sandbox); vm.runInContext(src, sandbox, { filename: path.basename(file) }); }
    catch (e) { errors.push(`le moteur JS lève à l'initialisation : ${e.message}`); sandbox = null; }
  }
}

// Check C — CHAQUE vue déclarée est réellement pilotable (c'est le clic qui casse)
if (sandbox && typeof sandbox.montreVue === 'function') {
  const keys = [...new Set([...h.matchAll(/onclick="return montreVue\('([^']+)'\)"/g)].map(m => m[1]))];
  if (!keys.length) errors.push('aucune vue pilotable déclarée — navigation du rapport absente');
  for (const k of keys) {
    try { sandbox.montreVue(k); }
    catch (e) { errors.push(`vue « ${k} » : le moteur lève au clic — ${e.message}`); }
  }
  if (keys.length && !errors.some(e => e.startsWith('vue «'))) checks.push(`${keys.length} vues pilotées`);
} else if (sandbox) {
  errors.push('fonction de navigation « montreVue » absente du moteur rendu');
}

// Check D — chaque recherche de tableau s'exécute (fonction interactive la plus exposée)
if (sandbox && typeof sandbox.filtreTableau === 'function') {
  const recherches = [...new Set([...h.matchAll(/oninput="filtreTableau\('([^']+)','([^']+)'\)"/g)]
    .map(m => `${m[1]}|${m[2]}`))];
  for (const r of recherches) {
    const [champ, table] = r.split('|');
    try { sandbox.filtreTableau(champ, table); }
    catch (e) { errors.push(`recherche du tableau « ${table} » : le moteur lève — ${e.message}`); }
  }
  if (recherches.length && !errors.some(e => e.startsWith('recherche du tableau')))
    checks.push(`${recherches.length} recherche(s) de tableau exécutée(s)`);
} else if (sandbox && /oninput="filtreTableau/.test(h)) {
  errors.push('recherche de tableau câblée dans le HTML sans fonction filtreTableau dans le moteur');
}

// Check E (ECR-02 check 9) — HÉRITAGE de l'auto-test interne du rapport.
// Le gate externe ne réimplémente pas les contrôles de cohérence : il exécute ceux que le
// rapport porte et hérite de leur verdict. Tout contrôle ajouté au moteur est donc couvert
// automatiquement, sans jamais modifier ce fichier.
if (sandbox) {
  if (typeof sandbox.auditSelfTest !== 'function') {
    errors.push('auto-test interne absent du rapport (auditSelfTest) — régénérer avec un moteur à jour');
  } else {
    try {
      const r = sandbox.auditSelfTest();
      if (!r || r.ok !== true) for (const e of (r?.errors ?? ['auto-test interne en échec sans détail'])) errors.push(`auto-test interne : ${e}`);
      else checks.push('auto-test interne hérité ✔');
    } catch (e) { errors.push(`auto-test interne : lève à l'exécution — ${e.message}`); }
  }
}

// Check F (ECR-02 check 9c) — le plan de remédiation embarqué est LISIBLE et non vide
// dès qu'il y a matière : un rapport qui expose une vue de remédiation vide, ou dont le
// bloc machine est illisible, force le projet à un export manuel — ce qu'on veut éliminer.
if (sandbox && typeof sandbox.buildRemediationPlan === 'function') {
  let plan = null;
  try { plan = sandbox.buildRemediationPlan(); }
  catch (e) { errors.push(`plan de remédiation embarqué illisible : ${e.message}`); }
  if (Array.isArray(plan)) {
    if (h.includes('id="v-plan"') && !plan.length)
      errors.push("vue « Plan d'action » présente mais bloc machine vide");
    const orphelines = plan.filter(a => !a.id || !String(a.action ?? '').trim());
    if (orphelines.length) errors.push(`${orphelines.length} action(s) de remédiation sans identifiant ou sans libellé`);
    if (plan.length) checks.push(`plan embarqué : ${plan.length} actions extractibles sans export`);
  }
} else if (sandbox && h.includes('id="v-plan"')) {
  errors.push('vue de remédiation présente sans accesseur machine (buildRemediationPlan)');
}

// Check G (ECR-02 check 10) — plausibilité « version actuelle », PILOTÉE PAR LE STATUT.
// Contrat partagé avec l'oracle de fraîcheur : pour ces statuts, une version de registre
// n'est pas applicable — l'exiger produirait un faux avertissement sur une donnée juste.
const STATUTS_VERSION_NA = new Set(['hors_registre', 'reco_deprecie', 'non_verifie']);
for (const m of h.matchAll(/<tr>(?:(?!<\/tr>)[\s\S])*?<\/tr>/g)) {
  const row = m[0];
  if (!/t-__composants|<\/td>/.test(row)) continue;
  const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1].replace(/<[^>]+>/g, '').trim());
  if (cells.length !== 6) continue;
  const [nom, resolue, actuelle, statut, reco] = cells;
  if (STATUTS_VERSION_NA.has(statut)) {
    if (statut === 'reco_deprecie' && !/remplac|alternative/i.test(row))
      warnings.push(`composant « ${nom} » déprécié sans successeur nommé`);
  } else if (!actuelle || actuelle === '—') {
    warnings.push(`composant « ${nom} » : statut « ${statut} » exige une version actuelle résolue, absente`);
  } else if (isPrerelease(actuelle)) {
    errors.push(`composant « ${nom} » : version actuelle « ${actuelle} » est une pré-version — la politique de fraîcheur interdit une pré-version en version actuelle ou en cible (TF-1737)`);
  }
  if (reco === 'Oui' && actuelle && resolue && cmpVer(actuelle, resolue) < 0)
    errors.push(`composant « ${nom} » : reco actionnable vers une version INFÉRIEURE à l'installée (${actuelle} < ${resolue})`);
}

// FORME POC-to-Prod (TF-2145, décision humaine D-171 (a)) — le rendu qui déclare la forme (<meta name="auditcore-forme"
// content="poc-to-prod">) est jugé par sa porte de conformité, `tools/verifier-forme-rapport.mjs` (F0–F16 : dimensions du
// référentiel, familles, réponses, moteur piloté mode par mode, plan auto-porté intègre, schéma tracé sans traversée ni
// flèches confondues, bascule de thème, pleine largeur, chiffres). L'auto-test interne n'y est pas rejoué : le check E
// ci-dessus l'hérite déjà. Tous les contrôles de ce fichier restent joués sur cette forme comme sur l'ancienne.
if (/<meta name="auditcore-forme" content="poc-to-prod">/.test(h)) {
  const f = jugerForme(h, { dimensions: dims, heriterAutotest: false });
  for (const w of f.avertissements) warnings.push(`forme POC-to-Prod [${w.check}] ${w.msg}`);
  for (const e of f.erreurs) errors.push(`forme POC-to-Prod [${e.check}] ${e.msg}`);
  if (!f.erreurs.length) checks.push(`forme POC-to-Prod conforme (${f.controles} contrôles F0–F16)`);
}

// ORACLES DE DESIGN (TF-2139) — en dernier, sur un rapport qui a passé tout le reste.
if (!errors.length) {
  if (!racineDesign.racine) {
    console.error(`NON JUGÉ: oracles de design (run-oracles-design) — ${racineDesign.motif}`);
  } else {
    const d = jouerOraclesDesign(file, racineDesign.racine);
    for (const a of d.avertissements) console.error(`NON JUGÉ: oracles de design — ${a}`);
    for (const e of d.erreurs) errors.push(`oracles de design : ${e}`);
    if (d.verdict === 'PASS') checks.push('oracles de design PASS (run-oracles-design)');
  }
}

for (const w of warnings) console.error(`AVERTISSEMENT: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERREUR: ${e}`);
  console.error(`\n✖ rendu NON diffusable (${errors.length} erreur(s))`);
  process.exit(1);
}
console.log(`✔ rendu diffusable — ${dims.length} dimensions présentes, gate intact, contrat de restitution tenu, moteur COMPILÉ et EXÉCUTÉ (${checks.join(', ')}) — ${(h.length / 1024).toFixed(0)} Ko`);
