#!/usr/bin/env node
// AuditCore — vérificateur du RENDU HTML du rapport (RAF-006, complète le gate de données).
// Contrôle le fichier produit par rapport-engine : 0 placeholder, bandeau gate, 17 sections
// de dimensions, onglet règles, signature moteur, cohérence ERD/dictionnaire.
// Usage: node tools/verifier-rapport-html.mjs <rapport.html>
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { rel, loadYaml } from './lib.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node tools/verifier-rapport-html.mjs <rapport.html>'); process.exit(2); }
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

const ph = h.match(/\{\{[^}]+\}\}/g) ?? [];
if (ph.length) errors.push(`${ph.length} placeholder(s) résiduel(s) — ex: ${[...new Set(ph)].slice(0, 3).join(', ')}`);
if (!/class="gate (std|maj|fatal)"/.test(h)) errors.push('bandeau de verdict gate absent');
if (!h.includes('Score global')) errors.push('KPI « Score global » absent');
if (!/<svg viewBox="0 0 460/.test(h)) errors.push('radar par famille absent');

const dims = loadYaml(rel('core', 'dimensions', 'dimensions.yaml')).dimensions.map(d => d.id);
const missing = dims.filter(d => !h.includes(`id="${d}"`));
if (missing.length) errors.push(`sections de dimensions manquantes: ${missing.join(', ')}`);

if (!h.includes('Toutes les règles')) errors.push('onglet « Toutes les règles » absent');
if (!h.includes('généré par AuditCore')) errors.push('signature moteur absente (fichier édité à la main ?)');
if (h.includes('class="erd-t"') && !h.includes('PII 🔒')) errors.push('ERD présent sans dictionnaire des tables');
if (/audit précédent|rapport précédent/i.test(h)) errors.push('auto-portance: référence à un audit antérieur');

// ─────────────────────────────────────────────────────────────────────────────
// ECR-02 — du contrôle STATIQUE au contrôle EXÉCUTÉ.
// Chercher des chaînes dans le HTML ne prouve pas que le rapport FONCTIONNE : un
// `ReferenceError` ou une clé de données manquante ne casse qu'au clic, et passe
// tous les tests ci-dessus. On compile puis on EXÉCUTE réellement le moteur, en
// pilotant chaque onglet comme le ferait un navigateur, sans avaler les erreurs.
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
      classList: { add() {}, remove() {}, contains: () => false },
      querySelectorAll: () => [], appendChild(c) { return c; }, addEventListener() {},
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
      window: { addEventListener() {} }, JSON, Math, Date,
    };
    sandbox.globalThis = sandbox;
    try { vm.createContext(sandbox); vm.runInContext(src, sandbox, { filename: path.basename(file) }); }
    catch (e) { errors.push(`le moteur JS lève à l'initialisation : ${e.message}`); sandbox = null; }
  }
}

// Check C — CHAQUE onglet déclaré est réellement pilotable (c'est le clic qui casse)
if (sandbox && typeof sandbox.tab === 'function') {
  const keys = [...new Set([...h.matchAll(/onclick="tab\('([^']+)'/g)].map(m => m[1]))];
  if (!keys.length) errors.push('aucun onglet déclaré — navigation du rapport absente');
  const btn = { classList: { add() {}, remove() {} } };
  for (const k of keys) {
    try { sandbox.tab(k, btn); }
    catch (e) { errors.push(`onglet « ${k} » : le moteur lève au clic — ${e.message}`); }
  }
  if (keys.length && !errors.some(e => e.startsWith('onglet'))) checks.push(`${keys.length} onglets pilotés`);
} else if (sandbox) {
  errors.push('fonction de navigation « tab » absente du moteur rendu');
}

// Check D — le filtre des règles s'exécute (fonction interactive la plus exposée)
if (sandbox && typeof sandbox.filtreRegles === 'function') {
  try { sandbox.filtreRegles(); checks.push('filtre des règles exécuté'); }
  catch (e) { errors.push(`filtre des règles : le moteur lève — ${e.message}`); }
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
// dès qu'il y a matière : un rapport qui expose un onglet de remédiation vide, ou dont le
// bloc machine est illisible, force le projet à un export manuel — ce qu'on veut éliminer.
if (sandbox && typeof sandbox.buildRemediationPlan === 'function') {
  let plan = null;
  try { plan = sandbox.buildRemediationPlan(); }
  catch (e) { errors.push(`plan de remédiation embarqué illisible : ${e.message}`); }
  if (Array.isArray(plan)) {
    if (h.includes('id="fam-__remediation"') && !plan.length)
      errors.push('onglet « Plan de remédiation » présent mais bloc machine vide');
    const orphelines = plan.filter(a => !a.id || !String(a.action ?? '').trim());
    if (orphelines.length) errors.push(`${orphelines.length} action(s) de remédiation sans identifiant ou sans libellé`);
    if (plan.length) checks.push(`plan embarqué : ${plan.length} actions extractibles sans export`);
  }
} else if (sandbox && h.includes('id="fam-__remediation"')) {
  errors.push('onglet de remédiation présent sans accesseur machine (buildRemediationPlan)');
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
  }
  if (reco === 'Oui' && actuelle && resolue && cmpVer(actuelle, resolue) < 0)
    errors.push(`composant « ${nom} » : reco actionnable vers une version INFÉRIEURE à l'installée (${actuelle} < ${resolue})`);
}

for (const w of warnings) console.error(`AVERTISSEMENT: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERREUR: ${e}`);
  console.error(`\n✖ rendu NON diffusable (${errors.length} erreur(s))`);
  process.exit(1);
}
console.log(`✔ rendu diffusable — ${dims.length} dimensions présentes, gate intact, moteur COMPILÉ et EXÉCUTÉ (${checks.join(', ')}) — ${(h.length / 1024).toFixed(0)} Ko`);
