#!/usr/bin/env node
// AuditCore — vérificateur de rapport GÉNÉRIQUE (généralise verifier-rapport-audit.mjs).
// v2 : valide le CONTRAT DE DONNÉES du rapport (rapport-data.json) plutôt que le HTML —
// libellés/branding via tenant, règles core inchangées : 0 placeholder, dimensions core au complet,
// verdicts complets sur toutes les règles applicables. Gate BLOQUANT avant diffusion.
// Usage: node tools/verifier-rapport.mjs <rapport-data.json> [--tenant <tenant.yaml>]
import fs from 'node:fs';
import { rel, loadJson, loadYaml, loadTenant } from './lib.mjs';
import { STR } from './rapport-engine.mjs';
import { STYLES_CANEVAS } from './canevas-modele-donnees.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node tools/verifier-rapport.mjs <rapport-data.json> [--tenant <tenant.yaml>]'); process.exit(2); }
const tIdx = process.argv.indexOf('--tenant');
const tenant = tIdx > -1 ? loadTenant(process.argv[tIdx + 1]).cfg : null;

const errors = [];
const raw = fs.readFileSync(file, 'utf-8');
const data = JSON.parse(raw);

// 1. Zéro placeholder résiduel
const placeholders = raw.match(/\{\{[^}]+\}\}|__TODO__|À COMPLÉTER/g) ?? [];
if (placeholders.length) errors.push(`${placeholders.length} placeholder(s) résiduel(s) — ex: ${placeholders.slice(0, 3).join(', ')}`);

// 2. Les dimensions core (dimensions.yaml, source unique — TF-0113) présentes et valides
const dims = loadYaml(rel('core', 'dimensions', 'dimensions.yaml')).dimensions.map(d => d.id);
const got = (data.dimensions ?? []).map(d => d.id);
for (const d of dims) if (!got.includes(d)) errors.push(`dimension manquante: ${d}`);
for (const d of data.dimensions ?? []) {
  // TF-2143 : `null >= 1` et `'2' >= 1` se coercent ; un score est un nombre ou n'existe pas.
  if (!(typeof d.score === 'number' && d.score >= 1 && d.score <= 5) && d.applicability !== 'off')
    errors.push(`${d.id}: score invalide ou absent (${d.score}) — « pas de score sans preuve »`);
  if (d.score !== undefined && !(d.preuves?.length) && d.applicability !== 'off')
    errors.push(`${d.id}: score sans preuve — interdit (invariant)`);
  if (!['nogo', 'reserve', 'go', undefined].includes(d.gate1b)) errors.push(`${d.id}: gate1b invalide (${d.gate1b})`);
}

// 3. Verdicts complets sur toutes les règles applicables
const VERDICTS = ['conforme', 'partiel', 'non_conforme', 'sans_objet', 'a_evaluer'];
for (const r of data.regles ?? []) {
  if (!VERDICTS.includes(r.verdict)) errors.push(`règle ${r.id}: verdict manquant/invalide (${r.verdict})`);
  if (r.verdict === 'sans_objet' && !r.motif) errors.push(`règle ${r.id}: sans_objet exige une justification précise`);
  if (r.verdict === 'a_evaluer' && !r.motif) errors.push(`règle ${r.id}: a_evaluer exige un motif spécifique (à rendre rare)`);
}

// 3 bis. Couverture (D-7 (a), 10/09/2026) : une règle non conforme ou partielle peut être COUVERTE par
// une autre — même remédiation, une seule action au plan. Le déclaratif est vérifié ici, pas
// deviné : porteuse existante, non couverte elle-même, portant un écart ; couverte portant un écart.
const regleParId = Object.fromEntries((data.regles ?? []).map(r => [r.id, r]));
const PORTE_ECART = (r) => r && (r.verdict === 'non_conforme' || r.verdict === 'partiel');
for (const r of data.regles ?? []) {
  if (!r.couverte_par) continue;
  const p = regleParId[r.couverte_par];
  if (!p) errors.push(`règle ${r.id}: couverte_par ${r.couverte_par} — règle inconnue`);
  else if (p.id === r.id) errors.push(`règle ${r.id}: se déclare couverte par elle-même`);
  else if (p.couverte_par) errors.push(`règle ${r.id}: couverte_par ${p.id}, elle-même couverte par ${p.couverte_par} — une chaîne de couverture n'a pas de porteuse`);
  else if (!PORTE_ECART(p)) errors.push(`règle ${r.id}: couverte_par ${p.id} dont le verdict « ${p.verdict} » ne porte aucune action — la couverture effacerait l'écart`);
  else if (!PORTE_ECART(r)) errors.push(`règle ${r.id}: verdict « ${r.verdict} » — seule une règle non conforme ou partielle se déclare couverte`);
}

// 4. Traçabilité : tout constat référence ≥1 preuve ; toute action référence règle ou constat
for (const c of data.constats ?? []) if (!c.preuves?.length) errors.push(`constat « ${c.titre} »: aucune preuve (evidence-based fichier:ligne)`);
for (const a of data.actions ?? []) if (!a.adr?.length && !a.constat_ref) errors.push(`action « ${a.titre} »: orpheline (ni règle ni constat)`);

// 5. Auto-portance (rapport sans référence à un audit antérieur)
if (/audit précédent|rapport précédent|précédemment audité/i.test(raw)) errors.push('auto-portance: référence à un audit antérieur détectée (règle B.1)');

// 6. Six champs que le moteur (rapport-engine.mjs) sait rendre, absents ici sans qu'aucune porte
// ne le dise (TF-1001, 09/09/2026) : le rapport rendu les affiche vides/« — », le plan de
// remédiation embarqué porte un `date: null`, et le manifeste d'écarts du rapport DÉCLARE déjà
// l'absence de synthèse/reprise — sans qu'aucune chaîne automatique ne l'escalade. En
// AVERTISSEMENT (non bloquant) : ces six champs restent légitimement absents pour certains
// audits (ex. sans reprise applicative) — un rapport correctement rempli ne doit pas être refusé
// pour ce qu'il n'a rien à dire.
const warnings = [];
if (!data.projet?.nom && !data.titre) warnings.push('ni projet.nom ni titre : le document rendu porte un titre vide');
if (!data.date) warnings.push('date absente : le plan de remédiation embarqué (planJson.meta.date) sera null');
if (!data.indice) warnings.push('indice absent : la référence de document (audit_ref) est incomplète');
if (!data.auditeur) warnings.push('auditeur absent : affiché « — » dans l’en-tête du rapport');
if (!data.syntheses) warnings.push('aucune synthèse rédigée transmise (le manifeste d’écarts du rapport le déclare déjà, en silence)');
if (!(data.reprise ?? []).length) warnings.push('aucun élément de reprise applicative déclaré (le manifeste d’écarts du rapport le déclare déjà, en silence)');

// 7. Titre dédoublé (TF-1001) : rapport-engine.mjs COMPOSE déjà `${tenant} — ${L.rapport} —
// ${projet}` — si `projet.nom` (ou son repli `titre`) répète lui-même ce libellé de document,
// le titre rendu se dédouble (« Rapport d'audit — Rapport d'audit - Produit-61 », mesuré au
// 09/09/2026). Bloquant : contrairement aux six champs ci-dessus, un titre dédoublé n'est jamais
// un manque légitime — c'est une valeur incorrecte.
const projetAffiche = data.projet?.nom ?? data.titre ?? '';
if (projetAffiche && (projetAffiche.includes(STR.fr.rapport) || projetAffiche.includes(STR.en.rapport)))
  errors.push(`projet/titre « ${projetAffiche} » répète déjà le libellé de document que le moteur ajoute `
    + `(« ${STR.fr.rapport} » / « ${STR.en.rapport} ») — le titre rendu serait dédoublé`);

// 8. CONTRAT DU SCHÉMA DE BASE DE DONNÉES (TF-0940, décision humaine D-4 (b) du 20/09/2026).
// `db_schema` est étendu des attributs que le canevas attend — `role`, `style`, `card`, `tip`,
// plus `engine` pour le nom accessible du dessin. TOUS FACULTATIFS : un audit qui ne les
// renseigne pas doit rester RENDABLE, c'est la règle dure de la décision. Ce qui est contrôlé,
// c'est donc la FORME quand l'attribut est là — jamais sa présence. Une valeur de `style` hors
// palette est en revanche BLOQUANTE : elle serait silencieusement ramenée au style neutre par
// l'adaptateur, et un audit croirait avoir classé une table qui ne l'est pas.
const db = data.db_schema;
if (db) {
  const txt = (v) => v === undefined || (typeof v === 'string');
  if (db.engine !== undefined && typeof db.engine !== 'string') errors.push('db_schema.engine: doit être une chaîne quand il est présent');
  for (const b of db.bandes ?? []) if (!b.key) errors.push(`db_schema: bande sans « key » — la bande ne peut être rattachée`);
  for (const t of db.tables ?? []) {
    if (!t.id) { errors.push('db_schema: table sans « id »'); continue; }
    if (!txt(t.role)) errors.push(`db_schema table ${t.id}: « role » doit être une chaîne`);
    if (!txt(t.tip)) errors.push(`db_schema table ${t.id}: « tip » doit être une chaîne`);
    if (t.style !== undefined && !STYLES_CANEVAS.includes(t.style))
      errors.push(`db_schema table ${t.id}: style « ${t.style} » hors palette (${STYLES_CANEVAS.join(', ')}) — `
        + `il serait rendu en style neutre, et l'audit croirait avoir classé cette table. Retirer l'attribut `
        + `déclare franchement que la classification n'est pas faite ; une valeur fausse la cache.`);
  }
  for (const r of db.relations ?? []) {
    if (!txt(r.card)) errors.push(`db_schema relation ${r.from} → ${r.to}: « card » doit être une chaîne`);
    if (!txt(r.tip)) errors.push(`db_schema relation ${r.from} → ${r.to}: « tip » doit être une chaîne`);
    // AVERTISSEMENT et non erreur : une extrémité nommée « table » seule reste RENDABLE — l'arête
    // retombe au milieu de l'en-tête, ce que faisait déjà le moteur remplacé. Refuser ici
    // casserait des audits existants, ce que la décision D-4 (b) interdit explicitement.
    for (const bout of ['from', 'to'])
      if (typeof r[bout] === 'string' && !r[bout].includes('.'))
        warnings.push(`db_schema relation: « ${bout} » vaut « ${r[bout]} » sans « table.colonne » — l'arête est `
          + `ancrée au milieu de l'en-tête au lieu de la ligne de sa colonne`);
  }
}

// 9. COMPLÉTUDE DU GABARIT `rapport-audit.template.md` (TF-2138, RU-5, voisin de TF-1001).
// Relevé du 04/11/2026 : un rapport SANS cartes de synthèse, SANS périmètre D00, SANS architecture, SANS
// section tests/analyses/composants et SANS verdict de gate sortait exit 0 — « diffusable ». Les six champs
// du contrôle 6 sont des manques LÉGITIMES (un audit sans reprise n'a rien à dire) ; ceux-ci sont les blocs
// que le gabarit écrit en dur, et l'absence d'un bloc n'est pas une absence de matière : c'est un rapport
// qui n'a pas rempli son gabarit. BLOQUANT, chaque bloc nommé.
const GATES = ['GO', 'GO SOUS RÉSERVE', 'NO-GO'];
const rempli = (v) => (typeof v === 'string' ? v.trim().length > 0
  : Array.isArray(v) ? v.length > 0 : Boolean(v) && typeof v === 'object' && Object.keys(v).length > 0);
if (!data.gate?.verdict) errors.push('gabarit rapport-audit : verdict de gate absent (gate.verdict : GO, GO SOUS RÉSERVE ou NO-GO)');
else if (!GATES.includes(data.gate.verdict))
  errors.push(`gabarit rapport-audit : gate.verdict « ${data.gate.verdict} » hors vocabulaire (${GATES.join(', ')})`);
if (!rempli(data.syntheses)) errors.push('gabarit rapport-audit : cartes de synthèse absentes (syntheses.fonctionnelle, .technique et .audit)');
else for (const carte of ['fonctionnelle', 'technique', 'audit'])
  if (!rempli(data.syntheses[carte])) errors.push(`gabarit rapport-audit : carte de synthèse « ${carte} » absente ou vide (syntheses.${carte})`);
const d00 = (data.dimensions ?? []).find(d => d.id === 'D00');
if (d00 && !rempli(d00.resume)) errors.push('gabarit rapport-audit : périmètre D00 non rédigé (dimensions[D00].resume vide — cas d\'usage, personas, hors périmètre)');
if (!(data.architecture?.nodes ?? []).length) errors.push('gabarit rapport-audit : schéma d\'architecture absent (architecture.nodes vide)');
if (![data.tests, data.analyses, data.composants].some(rempli))
  errors.push('gabarit rapport-audit : section tests / analyses / composants vide (aucune des trois matières n\'est renseignée)');

// 10. MODE « ACTION PAR CONSTAT » (TF-2138). Vider `actions` pour passer le refus des redites (TF-0624)
// laissait vide le plan d'action de chaque dimension : le contrôle 4 n'exige l'existence d'aucune action. Une
// dimension qui porte un ÉCART (un constat, ou une règle non conforme / partielle) exige au moins une action.
// Pour que ce plan non vide ne retombe pas dans la redite que le plan refuse, l'action se rattache à un
// constat (`constat_ref`, par id ou par titre) et NOMME les règles qu'elle couvre (`couvre`) : le moteur
// n'ouvre alors pas de seconde action pour une règle couverte. Le déclaratif est vérifié ici, pas deviné.
const dimDeRegle = (r) => (r.dimension ?? r.dimension_audit ?? '').match(/D\d{2}/)?.[0] ?? r.id?.match(/\bD\d{2}\b/)?.[0] ?? null;
const enEcart = new Set();
for (const r of data.regles ?? []) if (PORTE_ECART(r) && dimDeRegle(r)) enEcart.add(dimDeRegle(r));
for (const c of data.constats ?? []) if (c.dimension) enEcart.add(c.dimension);
const sansAction = [...enEcart].filter(id => !(data.actions ?? []).some(a => a.dimension === id)
  && (data.dimensions ?? []).find(d => d.id === id)?.applicability !== 'off').sort();
if (sansAction.length)
  errors.push(`plan d'action vide pour ${sansAction.join(', ')} : une dimension qui porte un écart (constat, règle non conforme ou partielle) `
    + 'exige au moins une action — mode « action par constat » : action rattachée à un constat (constat_ref) qui nomme les règles qu\'elle couvre (couvre), sans redite');
const dejaCouverte = new Map();
for (const a of data.actions ?? []) {
  if (a.couvre === undefined) continue;
  const nom = `action « ${a.titre ?? '?'} »`;
  if (!Array.isArray(a.couvre)) { errors.push(`${nom}: couvre doit être une liste d'identifiants de règles`); continue; }
  for (const id of a.couvre) {
    const r = regleParId[id];
    if (!r) errors.push(`${nom}: couvre ${id} — règle inconnue`);
    else if (!PORTE_ECART(r)) errors.push(`${nom}: couvre ${id} dont le verdict « ${r.verdict} » ne porte aucun écart — seule une règle non conforme ou partielle se couvre`);
    else if (r.couverte_par) errors.push(`${nom}: couvre ${id}, déjà couverte par la règle ${r.couverte_par} — une règle n'a qu'une couverture`);
    else if (dejaCouverte.has(id)) errors.push(`${nom}: couvre ${id}, déjà couverte par l'action « ${dejaCouverte.get(id)} » — deux actions pour une règle sont une redite`);
    else dejaCouverte.set(id, a.titre ?? '?');
  }
  if (a.couvre.length) {
    if (!a.constat_ref) errors.push(`${nom}: couvre sans constat_ref — le mode « action par constat » rattache l'action à un constat`);
    else if (!(data.constats ?? []).some(c => c.id === a.constat_ref || c.titre === a.constat_ref))
      errors.push(`${nom}: constat_ref « ${a.constat_ref} » ne désigne aucun constat (id ou titre)`);
  }
}

if (warnings.length) for (const w of warnings) console.error(`AVERTISSEMENT: ${w}`);

if (errors.length) {
  for (const e of errors) console.error(`ERREUR: ${e}`);
  console.error(`\n✖ rapport NON diffusable (${errors.length} erreur(s))${tenant ? ` — tenant ${tenant.tenant.name}` : ''}`);
  process.exit(1);
}
console.log(`✔ rapport diffusable — ${got.length} dimensions, ${(data.regles ?? []).length} règles, ${(data.constats ?? []).length} constats${tenant ? ` — tenant ${tenant.tenant.name}` : ''}${warnings.length ? ` (${warnings.length} avertissement(s) ci-dessus)` : ''}`);
