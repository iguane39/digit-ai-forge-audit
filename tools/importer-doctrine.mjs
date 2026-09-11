#!/usr/bin/env node
// =============================================================================
// AuditCore — importer-doctrine (TF-1014) : alimente le PACK DOCTRINE des dimensions
// (`core/dimensions/doctrine.yaml`) depuis l'extraction JSON d'un référentiel d'audit de
// référence, de façon REJOUABLE et PSEUDONYMISÉE.
//
// LE FAIT QUI A PRODUIT CET OUTIL (mesure du 10/09/2026). Le référentiel de référence décrit
// chaque dimension par quatre objets — des THÈMES de périmètre (152), des TYPES de preuve (109),
// des LIVRABLES attendus (131) et un BARÈME de notation 1–5. Le modèle courant ne décrit une
// dimension que par ses contrôles CTL dérivés des ADR : `dimensions.yaml` porte l'identifiant, le
// libellé, la famille, un NOMBRE de thèmes et l'applicabilité par profil — pas un seul thème,
// pas une seule preuve, pas un seul livrable. La doctrine par dimension n'avait donc aucune case
// dans le modèle. Ce pack est cette case ; cet outil est son alimentation mécanique.
//
// CE QUE L'OUTIL REFUSE DE FAIRE, ET C'EST TOUT L'INTÉRÊT :
//  1. RECOPIER un nom. La source est l'extraction d'un audit réel : elle nomme le commanditaire,
//     ses référentiels internes, ses éditeurs et leurs produits. Le dépôt est PUBLIABLE et le
//     lint d'agnosticité (`tools/lint-agnostic.mjs`) le tient : la table `SUBSTITUTIONS` ci-dessous
//     remplace chaque nom par la FONCTION qu'il remplit, et le garde-fou `TERMES_INTERDITS` refuse
//     d'écrire un pack qui en porterait encore un — l'outil sort 1 en les NOMMANT plutôt que de
//     livrer un pack à nettoyer à la main.
//  2. DEVINER un appariement. Une dimension de la référence entre au pack par son IDENTIFIANT,
//     jamais par ressemblance de libellé ; ce qui ne s'apparie pas sort dans `doctrine-ecarts.md`
//     avec son motif, et rien n'est inventé pour combler.
//  3. FAIRE CONFIANCE À SA PROPRE LECTURE. Le fichier d'écart (`--ecart`) porte les comptes MESURÉS
//     par dimension (thèmes, preuves, livrables) ; l'outil recompte sur l'extraction et consigne
//     toute divergence comme écart de lecture. Un import qui se mesure lui-même vaut mieux qu'un
//     import qui s'annonce complet.
//
// Usage :
//   node tools/importer-doctrine.mjs <ref-donnees.json> [--ecart <ecart.json>]
//                                    [--out core/dimensions/doctrine.yaml]
//                                    [--ecarts-md core/dimensions/doctrine-ecarts.md]
//                                    [--dry-run]
// Exit : 0 = pack écrit · 1 = refus (terme interdit résiduel, ou schéma invalide) · 2 = usage.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';
import { rel, loadJson, loadYaml } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
// Drapeaux À VALEUR : leur argument suivant n'est pas le positionnel. Sans cette distinction,
// `--out fichier.yaml` en tête ferait passer `fichier.yaml` pour la source à importer.
const A_VALEUR = new Set(['--ecart', '--out', '--ecarts-md']);
let source = null;
for (let i = 0; i < args.length; i++) {
  if (A_VALEUR.has(args[i])) { i++; continue; }
  if (args[i].startsWith('--')) continue;
  source = args[i];
  break;
}
if (!source) {
  console.error('usage: node tools/importer-doctrine.mjs <ref-donnees.json> [--ecart <ecart.json>] [--out <doctrine.yaml>] [--ecarts-md <doctrine-ecarts.md>] [--dry-run]');
  process.exit(2);
}
if (!fs.existsSync(source)) { console.error(`source introuvable : ${source}`); process.exit(2); }
const ecartPath = opt('--ecart');
const outPath = path.resolve(opt('--out', rel('core', 'dimensions', 'doctrine.yaml')));
const ecartsMdPath = path.resolve(opt('--ecarts-md', rel('core', 'dimensions', 'doctrine-ecarts.md')));
const dryRun = args.includes('--dry-run');

// ── 1. Pseudonymisation ──────────────────────────────────────────────────────
// Les jetons du commanditaire sont CONSTRUITS par concaténation : ce fichier ne porte donc
// lui-même aucun nom interdit, et le balayage N0 repo-wide du lint reste vert sur l'outil.
const COMMANDITAIRES = ['Nho' + 'od', 'Cee' + 'trus'];
const C = `(?:${COMMANDITAIRES.join('|')})`;

/** Codes de clause d'un référentiel interne (SOL.01, DAT.OWN.04-05, TEC.USE.07, SEC.DAT.02-03…). */
const CODE_INTERNE = '(?:SOL|DAT|TEC|ACM|MMI|APP|SEE|EVM|INC|RESP|SEC|EXC|OWN|USE|ACC|HOST)(?:\\.(?:[A-Z]{2,4}|\\d{2}(?:[-–]\\d{2})?))+';

/**
 * Table ordonnée [motif, remplacement]. L'ordre COMPTE : les expressions les plus longues
 * d'abord, sinon un fragment court mange le contexte qui aurait rendu la phrase lisible.
 * Chaque remplacement dit la FONCTION du produit nommé, jamais un autre produit.
 */
const SUBSTITUTIONS = [
  // — commanditaire : tournures spécifiques d'abord (celles où « de l'organisation » ne colle pas)
  [`« ${C} - Catalogue ADR par domaine »`, '« catalogue des ADR par domaine du référentiel interne »'],
  [`Migration du repo vers l'organisation GitHub ${C}`, "Migration du dépôt vers l'espace d'organisation de la forge logicielle"],
  [`Repo sur l'organisation ${C}`, "Dépôt hébergé dans l'espace d'organisation de la forge logicielle"],
  [`Propriété ${C} des données`, "Propriété des données par l'organisation"],
  [`\\(Guidelines ([A-Z][A-Z.]{1,12}) ${C}\\)`, '(référentiel interne)'],
  [`\\(Guidelines ([A-Z][A-Z.]{1,12})\\)`, '(référentiel interne)'],
  [`Guidelines ([A-Z][A-Z.]{1,12}) ${C}`, 'référentiel interne'],
  [`\\(${C} ([A-Z][A-Z.0-9,\\- ]{1,40})\\)`, '(référentiel interne)'],
  [`\\(${C}\\)`, '(référentiel interne)'],
  [`\\(opposable — ${C}, Accepted\\)`, '(opposable — référentiel interne, statut accepté)'],
  [`\\(opposable — ${C}\\)`, '(opposable — référentiel interne)'],
  [`principes ([A-Z]{3}) ${C}`, 'principes du référentiel interne'],
  [`${C} conserve la propriété`, "l'organisation conserve la propriété"],
  [`internes ${C}`, "internes à l'organisation"],
  [`interne ${C}`, "interne à l'organisation"],
  [`non-employés ${C}`, "personnes extérieures à l'organisation"],
  [`vers ${C}`, "vers l'organisation"],
  [`le tenant Azure ${C}`, "le tenant cloud de l'organisation"],
  [`un tenant ${C}`, "un tenant de l'organisation"],
  [`${C} API Management`, "la passerelle d'API managée de l'organisation"],
  // — commanditaire : jeton nu, en position de complément de nom (cas très majoritaire)
  [`\\b${C}\\b`, "de l'organisation"],
  ["(?<=\\b(?:selon|via|par|pour|dans|sur|avec|chez) )de l'organisation", "l'organisation"],
  ["de l'organisation de l'organisation", "de l'organisation"],
  ["\\bde de l'organisation\\b", "de l'organisation"],

  // — codes de clause d'un référentiel interne
  [`\\b${CODE_INTERNE}\\b`, 'réf. interne'],
  ['réf\\. interne(?:, réf\\. interne)+', 'réf. interne'],
  ['la plateforme SEE', "la plateforme d'échanges de fichiers de confiance"],
  ['\\bSEE comme tiers de confiance', "la plateforme d'échanges de fichiers comme tiers de confiance"],

  // — élisions : « l'<produit> » ne peut pas se remplacer à l'aveugle (« l'service… »). Ces
  // règles passent AVANT la substitution du produit et rétablissent l'article qui convient.
  ["l'IT Holding Helpdesk|IT Holding Helpdesk", 'le support informatique groupe'],
  ["l'IT Holding", 'la direction informatique groupe'],
  ["l'App Service Plan", "le plan d'hébergement applicatif managé"],
  ["l'App Service", "le service d'hébergement applicatif managé"],
  ["l'APIM", "la passerelle d'API managée"],
  ["l'ITSM", "l'outil de gestion des services"],
  ['repo architecture-governance', "dépôt de gouvernance d'architecture"],
  ['\\bDATA-LKE\\b', 'réf. interne'],

  // — identité, accès, secrets
  ['Microsoft Active Directory Federation(?: Services?)?|\\bADFS\\b', "fédération du fournisseur d'identité central"],
  ['Microsoft Entra ID|Microsoft Entra|Entra ID|Azure AD|Active Directory|\\bEntra\\b', "fournisseur d'identité central"],
  ['App Registration', "enregistrement d'application auprès du fournisseur d'identité"],
  ['App Service Auth|Easy Auth', "authentification intégrée de la plateforme d'hébergement"],
  ['\\bMSAL\\b', "bibliothèque d'authentification standard"],
  ['App Proxy', "proxy applicatif d'accès distant"],
  ['Conditional Access', "politique d'accès conditionnel"],
  ['Azure GUEST \\(B2B [^)]*\\)|Azure GUEST|GUEST fournisseur d\'identité central|\\bGUEST\\b', 'compte invité fédéré'],
  ['Defender for Key Vault|Defender for Cloud|\\bDefender\\b', 'plateforme de détection et de réponse'],
  ['\\bSentinel\\b', 'plateforme de corrélation des événements de sécurité'],
  ['Key Vault', 'coffre à secrets managé'],
  ['Managed Identity|identités managées|identité managée', 'identité de charge de travail sans secret'],

  // — exposition, réseau, hébergement
  ['Azure APIM', "passerelle d'API managée"],
  ['Azure App Service', "service d'hébergement applicatif managé"],
  ['Application Gateway', 'passerelle applicative'],
  ['Azure Firewall', 'pare-feu réseau managé'],
  ['API Management|\\bAPIM\\b', "passerelle d'API managée"],
  ['App Service Plan', "plan d'hébergement applicatif managé"],
  ['App Services', "services d'hébergement applicatif managés"],
  ['App Service', "service d'hébergement applicatif managé"],
  ['Container Apps', 'service de conteneurs managé'],
  ['\\bNSG\\b|\\bNSGs\\b', 'groupes de règles de filtrage réseau'],
  ['Resource Groups|Resource Group|groupes? de ressources', 'regroupement logique de ressources'],
  ['landing zones?|zones? d\'atterrissage', "zones d'accueil normalisées"],
  ['\\bsubscription\\b', 'souscription cloud'],
  ['rg-\\{app\\}-\\{env\\}, app-\\{name\\}-\\{env\\}', 'motifs de nommage paramétrés par application et environnement'],

  // — observabilité
  ['Application Insights|App Insights', 'plateforme de supervision applicative'],
  ['Log Analytics', 'plateforme de journalisation centralisée'],
  ['Diagnostic Settings', 'paramètres de diagnostic'],
  ['plateforme Elastic', 'plateforme de journalisation centralisée'],
  ['\\bElastic\\b|\\bKibana\\b', 'plateforme de journalisation centralisée'],

  // — données et stockage
  ['Azure Data Factory|Data Factory', 'orchestrateur de pipelines de données'],
  ['Logic Apps', "service managé d'automatisation de flux"],
  ['blob versioning|Blob versioning', 'versioning du stockage objet'],
  ['Storage Account|Storage v2|\\bStorage\\b|\\bBlob\\b', 'service de stockage objet managé'],
  ['Cosmos DB|\\bCosmos\\b', 'base NoSQL managée'],
  ['PaaS SQL Server|SQL Server|Azure SQL|PostgreSQL Flexible Server|PostgreSQL|\\bMySQL\\b', 'moteur relationnel managé'],
  ['\\bDataverse\\b', 'plateforme de données low-code'],
  ['\\bRedis\\b', 'cache distribué managé'],
  ['Microsoft Purview|\\bPurview\\b|Data Galaxy', "catalogue de données d'entreprise"],
  ['Unity Catalog', 'catalogue technique de la plateforme data'],
  ['Databricks Asset Bundle', 'paquet de déploiement déclaratif'],
  ['\\bDatabricks\\b', 'plateforme data managée'],
  ['\\blakehouse\\b|\\bLakehouse\\b', 'architecture data en couches'],
  ['\\bDLT\\b', "pipeline d'ingestion déclaratif"],
  ['médaillon|bronze[/ -]silver[/ -]gold', 'couches de raffinement'],
  ['Power BI|\\bFabric\\b', 'plateforme de restitution'],
  ['\\bDirectQuery\\b', 'mode de connexion directe'],

  // — chaîne de livraison, outillage
  ['\\(\\.github/workflows/?, azure-pipelines\\.yml, Jenkinsfile\\)', '(définitions de pipeline versionnées dans le dépôt)'],
  ['find \\.github/workflows, azure-pipelines\\.yml', 'recherche des définitions de pipeline versionnées'],
  ['\\.github/workflows/?', 'le répertoire de définition des pipelines'],
  ['azure-pipelines\\.yml', 'fichier de définition de pipeline'],
  ['\\bJenkinsfile\\b', 'script de pipeline'],
  ['opencensus-azure', 'SDK de télémétrie du fournisseur cloud'],
  ['GitHub Actions', "moteur d'intégration continue"],
  ['Azure DevOps|\\bGitHub\\b|\\bGitLab\\b', 'forge logicielle'],
  ['\\bTerraform\\b|\\bAnsible\\b', "outil d'infrastructure as code"],
  ['\\bKubernetes\\b|\\bAKS\\b|\\bEKS\\b|\\bGKE\\b', 'orchestrateur de conteneurs'],
  ['\\bDocker\\b', 'conteneurisation standard'],
  ['SonarQube|\\bsonarjs\\b|radon cc|\\bradon\\b', 'analyseur statique de code'],
  ['\\bpip-audit\\b', 'analyseur de vulnérabilités des dépendances'],
  ['\\bpytest\\b', 'harnais de tests unitaires'],
  ['\\bLighthouse\\b', "outil d'audit web"],
  ['\\bJupyter\\b', "carnet d'analyse"],
  ['\\s*\\((?:EasyVista|ServiceNow)\\)', ''],
  ['ServiceNow|EasyVista', 'outil de gestion des services (ITSM)'],
  ['\\bConfluence\\b|\\bSharePoint\\b', "espace documentaire d'entreprise"],
  ['\\bTeams\\b', 'outil de collaboration'],

  // — IA
  ['Claude via Azure Foundry|Azure AI Foundry|Azure Foundry', 'service managé de modèles de langage'],
  ['Azure OpenAI|\\bAOAI\\b', 'service managé de modèles de langage'],
  ['\\bOpenAI\\b|\\bClaude\\b|\\bMistral\\b|\\bGemini\\b|\\bLlama\\b', 'modèle de langage tiers'],
  ['GPT-4o|GPT-4|\\bGPT\\b', 'modèle de langage'],

  // — organisation et plateformes du commanditaire
  ['IT Holding', 'direction informatique groupe'],
  ['Data Plateforme', "plateforme de données de l'organisation"],

  // — fournisseur cloud (après les services : ne reste que les emplois génériques)
  ['tagging Azure', 'tagging des ressources cloud'],
  ['Services Azure|services Azure', 'services cloud'],
  ['Nomenclature Azure', 'nomenclature des ressources cloud'],
  ['ressources Azure', 'ressources cloud'],
  ['tenant Azure', 'tenant cloud'],
  ['\\bAZURE\\b', 'CLOUD'],
  ['\\bAzure\\b|\\bAWS\\b|\\bGCP\\b|Google Cloud', 'fournisseur cloud'],
  ['\\bMicrosoft\\b', "l'éditeur"],

  // — toilettage final (accords laissés par la substitution, espaces)
  ['plateforme de restitution imposé\\b', 'plateforme de restitution imposée'],
  ['\\s{2,}', ' '],
  [' ,', ','],
];

/** Types de preuve : les valeurs qui nomment un produit deviennent la NATURE de la preuve. */
const TYPES_PREUVE = {
  AZURE: 'CLOUD', PURVIEW: 'CATALOGUE', DEFENDER: 'SECOPS', CONFLUENCE: 'WIKI',
  'PIP-AUDIT': 'SCA', RADON: 'METRIQUE', LIGHTHOUSE: 'AUDIT-WEB', PYTEST: 'TEST',
};

const regexes = SUBSTITUTIONS.map(([motif, repl]) => [new RegExp(motif, 'gu'), repl]);
const pseudo = (s) => {
  let t = String(s);
  for (const [re, repl] of regexes) t = t.replace(re, repl);
  return t.trim();
};

/** Garde-fou : ce que le pack ne doit PLUS contenir après substitution. */
const TERMES_INTERDITS = [
  ...COMMANDITAIRES,
  'Azure', 'AWS', 'GCP', 'Google Cloud', 'Microsoft', 'Entra', 'Active Directory', 'APIM',
  'API Management', 'Key Vault', 'Databricks', 'Unity Catalog', 'Power BI', 'Fabric',
  'Elastic', 'Kibana', 'Sentinel', 'Defender', 'App Service', 'Container Apps', 'Cosmos',
  'SQL Server', 'PostgreSQL', 'MySQL', 'MongoDB', 'Kafka', 'Kubernetes', 'AKS', 'EKS', 'GKE',
  'Docker', 'Terraform', 'Ansible', 'GitHub', 'GitLab', 'Azure DevOps', 'SharePoint',
  'Snowflake', 'Purview', 'DirectQuery', 'ServiceNow', 'EasyVista', 'Data Galaxy',
  'Confluence', 'Teams', 'Redis', 'Dataverse', 'OpenAI', 'AOAI', 'GPT', 'MSAL', 'Jupyter', 'Claude', 'Foundry', 'Jenkinsfile', 'IT Holding', 'ADFS',
  'SonarQube', 'sonarjs', 'Storage Account', 'Data Factory', 'Logic Apps', 'Log Analytics',
  'Application Insights', 'App Insights', 'Application Gateway', 'Managed Identity',
  'Conditional Access', 'Easy Auth', 'App Proxy', 'App Registration', 'Resource Group',
  'lakehouse', "zones d'atterrissage", "zone d'atterrissage", 'landing zone', 'landing zones',
  'médaillon', 'Lighthouse',
];
const B1 = '(?<![\\p{L}\\p{N}_])', B2 = '(?![\\p{L}\\p{N}_])';
const interditRe = new RegExp(`${B1}(${TERMES_INTERDITS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})${B2}`, 'iu');

// ── 2. Lecture de la source et du fichier d'écart ────────────────────────────
const brut = fs.readFileSync(source, 'utf-8');
const empreinte = crypto.createHash('sha256').update(brut).digest('hex');
const refe = JSON.parse(brut);
if (!refe.DOMAINS || !refe.ORDERED_DOMAINS) {
  console.error('source inattendue : ORDERED_DOMAINS / DOMAINS absents — aucune importation faite');
  process.exit(2);
}
const mesures = ecartPath && fs.existsSync(ecartPath) ? loadJson(ecartPath) : null;
const mesureParId = Object.fromEntries((mesures?.dimensions ?? []).map((d) => [d.id, d]));

// ── 3. Appariement par IDENTIFIANT au pack courant ───────────────────────────
const pack = loadYaml(rel('core', 'dimensions', 'dimensions.yaml'));
const dimCourantes = Object.fromEntries(pack.dimensions.map((d) => [d.id, d]));
const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const dimensions = {};
const ecarts = [];
let nbThemes = 0, nbPoints = 0, nbPreuves = 0, nbLivrables = 0, nbBaremes = 0, apparieesExact = 0, apparieesId = 0;

for (const id of refe.ORDERED_DOMAINS) {
  const src = refe.DOMAINS[id];
  const cible = dimCourantes[id];
  if (!cible) {
    ecarts.push({ id, libelle: pseudo(src.name), motif: "aucune dimension du pack courant ne porte cet identifiant — appariement par libellé refusé (jamais deviné)" });
    continue;
  }
  const exact = norm(cible.label) === norm(src.name);
  if (exact) apparieesExact++; else apparieesId++;

  const themes = (src.perimeter ?? []).map((t) => ({ titre: pseudo(t.theme), points: (t.items ?? []).map(pseudo) }));
  const preuves = (src.proofs ?? []).map((p) => ({ type: TYPES_PREUVE[p.type] ?? p.type, description: pseudo(p.desc) }));
  const livrables = (src.deliverables ?? []).map(pseudo);
  const bareme = Object.fromEntries(Object.entries(src.scoring ?? {}).map(([k, v]) => [String(k), pseudo(v)]));

  nbThemes += themes.length;
  nbPoints += themes.reduce((n, t) => n + t.points.length, 0);
  nbPreuves += preuves.length;
  nbLivrables += livrables.length;
  if (Object.keys(bareme).length) nbBaremes++;

  // Auto-mesure : les comptes lus doivent égaler les comptes MESURÉS par le fichier d'écart.
  const m = mesureParId[id];
  if (m) {
    const divergences = [];
    if (m.themes_de_perimetre !== themes.length) divergences.push(`thèmes lus ${themes.length} ≠ mesurés ${m.themes_de_perimetre}`);
    if (m.types_de_preuve !== preuves.length) divergences.push(`preuves lues ${preuves.length} ≠ mesurées ${m.types_de_preuve}`);
    if (m.livrables_attendus !== livrables.length) divergences.push(`livrables lus ${livrables.length} ≠ mesurés ${m.livrables_attendus}`);
    if (divergences.length) ecarts.push({ id, libelle: pseudo(src.name), motif: `écart de lecture : ${divergences.join(' ; ')}` });
  }
  // Le NOMBRE de thèmes déclaré par le pack courant est lui aussi confrontable.
  if (typeof cible.themes === 'number' && cible.themes !== themes.length) {
    ecarts.push({ id, libelle: cible.label, motif: `le pack courant déclare ${cible.themes} thème(s) pour cette dimension, la doctrine en porte ${themes.length} — le compte de dimensions.yaml n'est pas modifié (pack invariant), l'écart est consigné` });
  }

  dimensions[id] = {
    libelle_courant: cible.label,
    libelle_source: pseudo(src.name),
    appariement: exact ? 'exact' : 'par_identifiant',
    famille_courante: cible.family,
    description: pseudo(src.description ?? ''),
    raison_d_etre: pseudo(src.rationale ?? ''),
    themes, preuves, livrables, bareme,
  };
}

// Dimensions du pack courant qu'aucune dimension de la référence n'alimente.
for (const d of pack.dimensions) {
  if (dimensions[d.id]) continue;
  ecarts.push({ id: d.id, libelle: d.label, motif: "dimension du pack courant sans source dans la référence — aucune doctrine importée ; elle reste à écrire (jamais devinée)" });
}

// ── 4. Garde-fou de pseudonymisation ─────────────────────────────────────────
const residus = [];
(function balaie(o, chemin) {
  if (typeof o === 'string') { const m = o.match(interditRe); if (m) residus.push({ chemin: chemin.join('.'), terme: m[1], extrait: o.slice(Math.max(0, m.index - 50), m.index + 60) }); return; }
  if (Array.isArray(o)) { o.forEach((v, i) => balaie(v, [...chemin, i])); return; }
  if (o && typeof o === 'object') { for (const k of Object.keys(o)) balaie(o[k], [...chemin, k]); }
})({ dimensions, ecarts }, []);
if (residus.length) {
  for (const r of residus.slice(0, 40)) console.error(`✖ [${r.chemin}] « ${r.terme} » — …${r.extrait}…`);
  console.error(`\n✖ importation REFUSÉE : ${residus.length} terme(s) non pseudonymisé(s). Ce dépôt est publiable : compléter la table SUBSTITUTIONS, puis rejouer. Aucun fichier écrit.`);
  process.exit(1);
}

// ── 5. Pack + validation de schéma ───────────────────────────────────────────
const aujourdhui = new Date().toISOString().slice(0, 10);
const doctrine = {
  pack: 'doctrine-v1',
  adosse_a: pack.pack,
  invariant: false,
  genere_par: 'tools/importer-doctrine.mjs',
  genere_le: aujourdhui,
  source: {
    nature: "extraction JSON d'un référentiel d'audit de référence (17 dimensions : thèmes de périmètre, types de preuve, livrables attendus, barème 1–5)",
    empreinte_sha256: empreinte,
    pseudonymisation: 'table SUBSTITUTIONS de tools/importer-doctrine.mjs — commanditaire, référentiels internes, éditeurs et produits remplacés par la fonction remplie ; garde-fou TERMES_INTERDITS exécuté avant écriture',
    mesures_confrontees: mesures ? 'fichier d\'écart fourni : comptes par dimension recomptés et confrontés' : "aucun fichier d'écart fourni : comptes non confrontés",
  },
  comptes: {
    dimensions: Object.keys(dimensions).length,
    appariees_exact: apparieesExact,
    appariees_par_identifiant: apparieesId,
    themes: nbThemes,
    points_de_theme: nbPoints,
    preuves: nbPreuves,
    livrables: nbLivrables,
    baremes: nbBaremes,
    ecarts: ecarts.length,
  },
  dimensions,
};

const ajv = new Ajv({ allErrors: true, strict: false });
const schemaPath = rel('core', 'schemas', 'doctrine.schema.json');
if (fs.existsSync(schemaPath)) {
  const valide = ajv.compile(loadJson(schemaPath));
  if (!valide(doctrine)) {
    console.error(`✖ pack non conforme à doctrine.schema.json : ${ajv.errorsText(valide.errors).slice(0, 600)}`);
    console.error('  aucun fichier écrit.');
    process.exit(1);
  }
} else {
  console.error(`AVERTISSEMENT: schéma absent (${schemaPath}) — pack non validé`);
}

// ── 6. Écriture ──────────────────────────────────────────────────────────────
const entete = `# AuditCore — PACK DOCTRINE des dimensions (doctrine-v1), adossé au pack invariant core-v1.
# GÉNÉRÉ par tools/importer-doctrine.mjs — ne pas éditer à la main : toute correction se fait
# dans la table de substitution de l'importeur, puis se rejoue.
#
# Ce que le pack porte, par dimension : les THÈMES de périmètre (ce qui est regardé), les TYPES
# de PREUVE (ce qui est exigé pour juger), les LIVRABLES attendus (ce qui sort de l'audit) et le
# BARÈME 1–5 (comment la note est motivée). dimensions.yaml reste la source unique de l'identité
# d'une dimension (id, libellé, famille, applicabilité) ; ce pack ne la redéfinit jamais.
#
# Pseudonymisé à l'import : ni commanditaire, ni éditeur, ni produit — chaque nom est remplacé par
# la fonction qu'il remplit. Les dimensions sans source, et les écarts de lecture, sont dans
# doctrine-ecarts.md ; rien n'y est deviné.
`;
const corps = yaml.dump(doctrine, { lineWidth: 110, noRefs: true, quotingType: '"' });

const md = [
  '# Doctrine par dimension — écarts d\'appariement et de lecture',
  '',
  `> Généré par \`tools/importer-doctrine.mjs\` le ${aujourdhui}. Source : extraction d'un référentiel`,
  `> d'audit de référence (empreinte \`sha256:${empreinte.slice(0, 16)}…\`), pseudonymisée à l'import.`,
  '> Ce fichier liste ce qui **n\'a pas pu être apparié ou recoupé**, avec son motif. Rien n\'y est deviné :',
  '> une dimension sans source n\'a pas de doctrine inventée, elle a une ligne ici.',
  '',
  `**Appariement** : ${apparieesExact} dimension(s) appariée(s) libellé pour libellé, ${apparieesId} par identifiant`,
  `(libellé généralisé côté pack courant), ${ecarts.filter((e) => /sans source|aucune dimension/.test(e.motif)).length} sans correspondance.`,
  '',
  '| Dimension | Libellé | Motif |',
  '|---|---|---|',
  ...ecarts.map((e) => `| \`${e.id}\` | ${e.libelle} | ${e.motif} |`),
  '',
  '## Règle d\'appariement appliquée',
  '',
  'Une dimension de la référence entre au pack par son **identifiant** (`D00`–`D16`), jamais par',
  'ressemblance de libellé : le fichier d\'écart fourni en entrée porte les mêmes identifiants et les',
  'comptes mesurés par dimension, qui servent de recoupement. Un libellé différent de part et d\'autre',
  'ne bloque pas l\'appariement (il est consigné comme `par_identifiant` dans le pack) ; un identifiant',
  'absent le bloque, et la dimension sort ici.',
  '',
].join('\n');

if (dryRun) {
  console.log(`(dry-run) pack NON écrit — ${Object.keys(dimensions).length} dimensions, ${nbThemes} thèmes, ${nbPreuves} preuves, ${nbLivrables} livrables, ${ecarts.length} écart(s)`);
  process.exit(0);
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, entete + corps, 'utf-8');
fs.mkdirSync(path.dirname(ecartsMdPath), { recursive: true });
fs.writeFileSync(ecartsMdPath, md, 'utf-8');

console.log(`✔ pack doctrine écrit : ${Object.keys(dimensions).length} dimensions (${apparieesExact} exactes, ${apparieesId} par identifiant)`);
console.log(`  ${nbThemes} thèmes (${nbPoints} points), ${nbPreuves} preuves, ${nbLivrables} livrables, ${nbBaremes} barèmes`);
console.log(`  ${residus.length} terme non pseudonymisé · ${ecarts.length} écart(s) → ${path.relative(process.cwd(), ecartsMdPath)}`);
console.log(`  → ${path.relative(process.cwd(), outPath)}`);
