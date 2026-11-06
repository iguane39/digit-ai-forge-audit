// AuditCore — rendu du rapport d'audit dans la forme POC-to-Prod (TF-2145, décision humaine D-171 (a) du 04/11/2026).
//
// LE FAIT. Le porteur, le 04/11/2026 : « Logiquement le format générique de la Factory, ce n'est pas celui généré. » La
// forme du rapport d'audit POC-to-Prod (rapport de référence de Produit-68 du 24/09/2026 et son modèle à champs) devient
// le RENDU PAR DÉFAUT de build-rapport ; le rendu par vues de rapport-engine.mjs reste derrière `--forme vues` pendant la
// transition.
//
// CE QUE FAIT CE MODULE, de façon déterministe (même donnée, même fichier, octet pour octet) :
//   1. il CORRESPOND chaque champ de rapport-data.json à ce que la forme affiche (`construireDonnees`) — familles,
//      dimensions, règles et réponses, constats, actions, reprise, tests, analyses, composants, schémas — et ce qui n'a
//      pas de source est DÉCLARÉ au manifeste d'écarts, jamais inventé (une introduction de famille est CALCULÉE et
//      le dit ; une note pour l'autorité absente de la donnée n'est pas rendue) ;
//   2. il fait rendre les vues interactives par le MOTEUR DU GABARIT lui-même, exécuté ici sans navigateur : le fichier
//      porte le rendu initial complet (lecture sans script, impression, portes statiques), et le navigateur rejoue le
//      même moteur pour filtrer, trier, chercher, déplier ;
//   3. il remplit les champs du gabarit `deliverables/templates/rapport-audit-poc-to-prod.template.html` ; un champ non
//      rempli reste visible (doubles accolades) et fait refuser le rendu par verifier-rapport-html.
//
// Le plan de remédiation est celui de `buildPlan` (rapport-engine.mjs) — calcul UNIQUE servi au bloc machine du HTML,
// au moteur et au YAML de la forge : les trois formes ne peuvent pas diverger. Les règles de cohérence du plan (redites,
// TF-0624 / TF-0625) sont reprises à la source, dans le moteur des vues, et jamais recopiées.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import {
  buildPlan, estBloquant, aUnScore, dimensionsConnues, estIdActionRattache, STR, RES, ICO_PII,
  faviconDataUri, adapterCanevasCss, adapterCanevasHtml,
} from './rapport-engine.mjs';
import { adapterDbSchema, renderDbSchema, renderDbLegend, CANEVAS_CSS, CANEVAS_FIT_JS } from './canevas-modele-donnees.mjs';
import { renderSchemaArchitecture, calculerSchema, SCHEMA_CSS } from './schema-architecture.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
export const GABARIT_FICHIER = path.join(ICI, '..', 'deliverables', 'templates', 'rapport-audit-poc-to-prod.template.html');
const MOTEUR_LEGACY = path.join(ICI, 'rapport-engine.mjs');

/** Le gabarit, son identifiant et sa version (lus dans le fichier : une seule source, TF-1752 / TF-1820). */
export function lireGabarit(fichier = GABARIT_FICHIER) {
  const texte = fs.readFileSync(fichier, 'utf8').replace(/\r\n/g, '\n');
  const id = /gabarit\s*:\s*(gd-[a-z0-9-]+)/i.exec(texte.replace(/<!--[\s\S]*?-->/g, ''))?.[1];
  const version = /version[_ ]du[_ ]gabarit\s*:?\s*(\d+\.\d+\.\d+)/i.exec(texte)?.[1];
  if (!id || !version) throw new Error(`gabarit sans couple « Gabarit : gd-… · version du gabarit x.y.z » : ${fichier}`);
  return { texte, id, version };
}
const GABARIT = lireGabarit();
export const GABARIT_ID = GABARIT.id;
export const GABARIT_VERSION = GABARIT.version;

/** Dimension qui porte le schéma de base de données, famille qui porte le schéma d'architecture (référentiel core-v1). */
export const DIMENSION_SCHEMA_BDD = 'D16';
const DIMENSION_ARCHITECTURE = 'D01';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028').replace(new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029');
const tronque = (s, n) => { const t = String(s ?? '').trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
/** Phrases d'un texte rédigé, découpées sans rien réécrire (une puce par phrase). */
export function phrases(texte) {
  return String(texte ?? '').trim().split(/(?<=[.!?;])\s+(?=[A-ZÀ-ÖØ-Þ0-9«“"(])/u).map((s) => s.trim()).filter(Boolean);
}

/**
 * TF-2262 (RT-53, Produit-84) — les 6 cartes de synthèse que DÉCLARE la forme POC-to-Prod, dans l'ordre du modèle. Une carte
 * porte sa clé de donnée (`syntheses.<cle>`) et son étiquette dans chaque langue. La porte de forme (verifier-forme-rapport,
 * F18) lit cette liste : une carte hors liste ou une carte du modèle absente rend le rapport non conforme. Les clés
 * `audit_bloque`, `audit_commencer` et `audit_limites` sont posées ici (le retour nomme les étiquettes du modèle, pas les clés).
 */
export const CARTES_SYNTHESE = [
  { cle: 'fonctionnelle', fr: 'Synthèse Fonctionnelle', en: 'Functional Summary' },
  { cle: 'technique', fr: 'Synthèse Technique', en: 'Technical Summary' },
  { cle: 'audit', fr: 'Synthèse Audit', en: 'Audit Summary' },
  { cle: 'audit_bloque', fr: 'Audit · Ce qui bloque', en: 'Audit · What blocks' },
  { cle: 'audit_commencer', fr: 'Audit · Par où commencer', en: 'Audit · Where to start' },
  { cle: 'audit_limites', fr: "Audit · Limites de l'audit", en: 'Audit · Limits of the audit' },
];

// ─────────────────────────────────────────────────────────────────────────────
// LIBELLÉS — moteur (I18N, injecté dans le fichier) et parties statiques. Français et anglais, mêmes clés.
// ─────────────────────────────────────────────────────────────────────────────
export const LIBELLES = {
  fr: {
    'verdict.conforme': 'Conforme', 'verdict.partiel': 'Partiel', 'verdict.non_conforme': 'Non conforme', 'verdict.sans_objet': 'Sans objet', 'verdict.a_evaluer': 'À évaluer',
    'crit.fatal': 'Fatal', 'crit.bloquant': 'Bloquant', 'crit.majeur': 'Majeur', 'crit.standard': 'Standard', 'crit.libelle': 'Criticité %1', 'crit.absente': 'Criticité non renseignée',
    'enf.blocking': 'Blocking · bloquant', 'enf.required': 'Required · impératif', 'enf.advisory': 'Advisory · opposable', 'enf.recommendation': 'Recommendation · informatif',
    'gate1b.nogo': 'NO-GO gate 1b', 'gate1b.reserve': 'GO sous réserve', 'gate1b.go': 'GO', 'gate1b.absente': 'Gate 1b non prononcée',
    'prio.urgent': 'Urgent', 'prio.prio': 'Prioritaire', 'prio.quick': 'Rapide', 'prio.norm': 'Planifié',
    'oui_non.oui': 'oui', 'oui_non.non': 'non',
    'score.libelle': 'Score %1/5 · %2', 'score.absent': 'Score non renseigné', 'score.off': 'Hors périmètre (sans objet)',
    'score.cran.1': 'Bloquant', 'score.cran.2': 'Insuffisant', 'score.cran.3': 'Acceptable', 'score.cran.4': 'Solide', 'score.cran.5': "État de l'art",
    'famille.nav': 'Familles de dimensions', 'famille.titre': 'Famille · %1', 'famille.moyenne': 'moy. %1/5', 'famille.sans_note': 'aucune note',
    'dim.abrege': 'dim.', 'dim.synthese': "Synthèse de l'audit", 'dim.perimetre0': 'Description du périmètre fonctionnel', 'dim.perimetre': 'Résumé de la dimension',
    'dim.off': 'Dimension hors périmètre : %1', 'dim.off_sans_motif': 'motif non renseigné', 'dim.note_titre': "Note pour l'autorité de décision", 'dim.note_label': 'Recommandation auditeur',
    'schema.onglet': "Schéma d'architecture", 'schema.eyebrow': 'Architecture logique · %1', 'schema.titre': "Schéma d'architecture",
    'schema.lead': 'Représentation logique relevée pendant l’audit : bandes, composants et flux. Chaque flèche a ses ports et sa voie propres ; survolez un nœud ou une flèche pour son détail.',
    'schema.legende': 'Figure — architecture logique de %1, d’après les données d’audit (%2 composants, %3 flux).',
    'schema.style.purple': 'Violet · acteurs et entrées', 'schema.style.blue': 'Bleu · modules applicatifs', 'schema.style.teal': 'Sarcelle · pilotage et données',
    'schema.style.coral': 'Corail · composants critiques', 'schema.style.amber': 'Ambré · intégrations externes', 'schema.style.gray': 'Gris · services transverses',
    'dict.titre': 'Dictionnaire des tables', 'dict.compte': '%1 table(s)', 'dict.vide': 'Aucune table déclarée.', 'dict.c.table': 'Table', 'dict.c.colonne': 'Colonne',
    'dict.c.type': 'Type', 'dict.c.cle': 'Clé', 'dict.c.note': 'Données traitées / note', 'dict.f.pii': 'Donnée personnelle',
    'tm.titre': 'Traçabilité — règles, preuves et actions', 'tm.indice': 'Constat · preuve · règle · action — filtres, tri, recherche',
    'tm.intro.regle': 'Chaque ligne est une règle du référentiel rattachée à cette dimension : son verdict, les constats qui la fondent et l’action du plan qui la traite. Cliquez une ligne pour le détail.',
    'tm.intro.constat': 'Aucune règle du référentiel n’est rattachée à cette dimension : la matrice relie ici chaque constat à ses preuves, et le plan d’action de la dimension les traite.',
    'tm.note': 'Une règle conforme s’adosse à une preuve ; une règle partielle, non conforme ou à évaluer pointe vers une action du plan. Une règle applicable sans preuve ni action est signalée « à couvrir ». Les règles sans objet sont hors du calcul de couverture.',
    'tm.exemption': 'filtrée par la barre de la matrice (cases à cocher par critère, recherche, tri par colonne)',
    'tm.chercher': 'Rechercher (règle, verdict, réponse, preuve, action…)', 'tm.ouvrir_regle': 'Ouvrir dans « Toutes les règles »',
    'tm.f.severite': 'Sévérité', 'tm.f.preuve': 'Preuve', 'tm.f.criticite': 'Criticité', 'tm.f.enforcement': 'Enforcement', 'tm.f.verdict': 'Verdict', 'tm.f.action': "Plan d'action",
    'tm.f.enforcement.aide': 'Portée normative : « required » impératif, « advisory » opposable, « recommendation » informatif.',
    'tm.f.preuve.aide': 'Isole les règles adossées à une preuve (constat ou réponse apportée), ou au contraire sans preuve.',
    'tm.f.action.aide': 'Isole les règles porteuses d’une action du plan, ou sans action.',
    'tm.preuve.avec': 'Avec preuve', 'tm.preuve.sans': 'Sans preuve', 'tm.action.avec': 'Avec action', 'tm.action.sans': 'Sans action',
    'tm.c.regle': 'Règle', 'tm.c.criticite': 'Criticité', 'tm.c.verdict': 'Verdict', 'tm.c.preuves_liees': 'Preuves — constats liés', 'tm.c.action': "Plan d'action",
    'tm.c.constat': 'Constat', 'tm.c.severite': 'Sévérité', 'tm.c.preuves': 'Preuves',
    'tm.p.constats': 'Constats', 'tm.p.graves': 'Fatals, bloquants, majeurs', 'tm.p.actions': 'Actions', 'tm.p.regles': 'Règles', 'tm.p.conformes': 'Conformes', 'tm.p.partiels': 'Partiels',
    'tm.p.non_conformes': 'Non conformes', 'tm.p.a_evaluer': 'À évaluer', 'tm.p.sans_objet': 'Sans objet', 'tm.p.couvertes': 'Applicables couvertes',
    'tm.preuve_regle': 'preuve portée par la réponse (détail)', 'tm.aucune_preuve': 'aucune preuve', 'tm.aucune_action': 'aucune action', 'tm.a_couvrir': 'à couvrir',
    'tm.action_non_requise': '— non requise', 'tm.action_plan': 'action du plan', 'tm.couverte_par': 'couverte par %1', 'tm.couverte_tip': 'Couverte par l’action %1 (%2)',
    'tm.preuve_type': 'PREUVE', 'tm.non_renseigne': 'non renseigné', 'tm.plan_dimension': "Plan d'action de la dimension (%1)",
    'tm.orphelins': 'Constats rattachés à aucune règle de la dimension (%1)', 'tm.vide_regles': 'Aucune règle instruite pour cette dimension.', 'tm.vide_constats': 'Aucun constat pour cette dimension.',
    'tm.d.col1': '▸ Règle et réponse', 'tm.d.col2': '▸ Constats et preuves (%1)', 'tm.d.col3': "▸ Plan d'action", 'tm.d.dimension': 'Dimension :', 'tm.d.criticite': 'Criticité :',
    'tm.d.enforcement': 'Enforcement :', 'tm.d.verdict': 'Verdict :', 'tm.d.regle': 'Règle :', 'tm.d.apportee': 'Réponse apportée (preuve) :', 'tm.d.motif': 'Motif :',
    'tm.d.possible': 'Réponse possible (remédiation) :', 'tm.d.critere': 'Critère de clôture :', 'tm.d.constat': '▸ Constat', 'tm.d.preuves': '▸ Preuves (%1)',
    'tm.d.sans_constat': 'Aucun constat rattaché : la règle s’appuie sur sa seule réponse apportée.', 'tm.d.sans_constat_so': 'Aucun constat : règle sans objet (motivée).',
    'liste.tous': 'Tous', 'liste.aucun': 'Aucun', 'liste.chercher': 'Rechercher…', 'liste.reinitialiser': 'Réinitialiser', 'liste.compte': '%1 ligne(s) affichée(s) sur %2',
    'liste.vide_filtre': 'Aucune ligne ne correspond aux filtres ou à la recherche.', 'liste.vide_valeur': '(vide)', 'liste.detail': 'Afficher le détail', 'liste.detail_vide': 'Aucun détail supplémentaire.',
    'liste.kpi_filtrer': 'Filtrer : %1', 'liste.kpi_tout': 'Tout afficher', 'liste.kpi_actif': 'filtre actif · tout afficher', 'liste.kpi_cliquer': 'cliquer pour filtrer', 'liste.kpi_reinit': 'réinitialiser',
    'liste.exemption': 'filtrée par la barre de la vue (cases à cocher par colonne, recherche surlignée, tri par colonne)',
    'regles.vide': 'Aucune règle instruite dans les données.', 'regles.chercher': 'Rechercher (règle, titre, verdict, réponse, dimension…)',
    'regles.f.dimension': 'Dimension', 'regles.f.criticite': 'Criticité', 'regles.f.enforcement': 'Enforcement', 'regles.f.verdict': 'Verdict', 'regles.f.bloquant': 'Bloquante',
    'regles.k.conformes': 'Conformes', 'regles.k.partiels': 'Partielles', 'regles.k.non_conformes': 'Non conformes', 'regles.k.bloquantes': 'Règles bloquantes', 'regles.k.sans_objet': 'Sans objet', 'regles.k.a_evaluer': 'À évaluer',
    'regles.c.regle': 'Règle', 'regles.c.dimension': 'Dimension', 'regles.c.criticite': 'Crit.', 'regles.c.enforcement': 'Enforcement', 'regles.c.verdict': 'Verdict',
    'regles.c.apportee': 'Réponse apportée', 'regles.c.possible': 'Réponse possible', 'regles.c.constats': 'Constats liés',
    'regles.bloquante_tip': 'Bloquante : criticité Fatal ou Bloquant, verdict non conforme ou partiel, action au plan',
    'plan.vide': 'Aucune action au plan.', 'plan.chercher': 'Rechercher (identifiant, action, règle, dimension, critère…)',
    'plan.f.priorite': 'Priorité', 'plan.f.criticite': 'Criticité', 'plan.f.source': 'Source', 'plan.f.dimension': 'Dimension', 'plan.source.regle': 'Règle', 'plan.source.dimension': 'Dimension',
    'plan.k.actions': 'Actions', 'plan.c.id': 'ID', 'plan.c.priorite': 'Priorité', 'plan.c.criticite': 'Criticité', 'plan.c.dimension': 'Dimension', 'plan.c.source': 'Source',
    'plan.c.action': 'Action', 'plan.c.critere': 'Critère de vérification (clôture)', 'plan.couvre': '(couvre %1)', 'plan.non_rattachee': 'non rattachée',
    'plan.note': 'Auto-porté : le rapport embarque ce plan en machine (bloc remediation-plan-json), le même calcul que remediation-actions.yaml. Extraction et contrôle de clôture sans export : node verifier-remediation.mjs <rapport>.html [--init | --status suivi.json].',
    'anx.vide': 'Aucune ligne dans les données.',
    'reprise.marque.ok': '[OK]', 'reprise.marque.partial': '[PARTIEL]', 'reprise.marque.gap': '[GAP]', 'reprise.marque.manual': '[Saisie porteur]', 'reprise.marque.autre': '[—]',
    'reprise.legende.ok': 'information collectée', 'reprise.legende.partial': 'information incomplète', 'reprise.legende.gap': 'information manquante', 'reprise.legende.manual': 'à compléter par le porteur',
    'reprise.non_collecte': 'Information non collectée pendant l’audit.',
    'vue.onglet': 'Onglet · %1',
    'vue.regles.titre': 'Toutes les règles', 'vue.regles.h': 'Conformité aux règles du référentiel',
    'vue.regles.intro': 'Une ligne par règle instruite : verdict, réponse apportée (preuve) et réponse possible (remédiation), reliées aux constats. Filtres cumulables, tri par colonne, recherche surlignée.',
    'vue.plan.titre': 'Plan de remédiation', 'vue.plan.h': 'Plan de remédiation consolidé',
    'vue.plan.intro': 'Liste exhaustive des actions : actions des dimensions et remédiations des règles non conformes ou partielles, chacune avec son identifiant stable, sa priorité et son critère de clôture.',
    'vue.reprise.titre': 'Reprise applicative', 'vue.reprise.h': 'Informations attendues par le RUN',
    'vue.reprise.intro': 'Ce que l’équipe d’exploitation doit savoir pour reprendre le produit. Chaque ligne porte son statut tel que relevé pendant l’audit.',
    'vue.tests.titre': 'Tests', 'vue.tests.h': 'Tests exécutés', 'vue.tests.intro': 'Une ligne par suite ou par campagne de tests déclarée dans les données d’audit ; les valeurs sont reprises telles que produites par la source.',
    'vue.analyses.titre': 'Analyses', 'vue.analyses.h': 'Analyses techniques (outillage exécuté)', 'vue.analyses.intro': 'Une ligne par outil exécuté, avec la version employée et son résultat. Une revue humaine n’est pas un outil : elle vit en constat de dimension.',
    'vue.composants.titre': 'Composants', 'vue.composants.h': 'Composants (inventaire versionné)', 'vue.composants.intro': 'Briques logicielles versionnées : version résolue, version actuelle stable du registre, statut et recommandation.',
    'qa.ok': 'Contrôle qualité : rapport conforme', 'qa.ok_detail': '%1 familles de contrôle passées · %2 avertissement(s).', 'qa.ko': 'Contrôle qualité : %1 anomalie(s) à corriger avant diffusion',
    'qa.avertissements': '+ %1 avertissement(s).',
    'st.gate': 'verdict de gate déclaré (%1) incohérent avec les dimensions saisies (calculé : %2)', 'st.bloquants': 'dimensions bloquantes recalculées (%1) ≠ déclarées (%2)',
    'st.sans_critere': '%1 action(s) de remédiation sans critère de clôture : %2', 'st.regle_sans_action': 'règle non conforme sans action de remédiation : %1',
    'st.id_double': 'identifiant d’action en double au plan : %1', 'st.rem_inconnu': 'la règle %1 renvoie à l’action %2, absente du plan',
    'st.analyses_sans_version': 'inventaire ANALYSES : %1 entrée(s) sans version utilisée — outillage non exécuté, ou revue humaine mal rangée (la déplacer en constat de dimension)',
    'st.nb_dimensions': '%1 dimension(s) dans le rapport, %2 au référentiel', 'st.dim_absente': 'dimension %1 déclarée mais absente des données', 'st.score': '%1 : score invalide (%2), attendu un entier de 1 à 5',
    'st.vues': 'restitution : moins de deux vues déclarées', 'st.a_evaluer_sans_motif': '%1 : « à évaluer » sans motif — une règle non instruite se motive',
    'st.a_evaluer': '%1 : règle encore à évaluer (motivée)', 'st.sans_preuve': '%1 : écart sans réponse apportée (preuve)', 'st.sans_possible': '%1 : écart sans réponse possible (remédiation rédigée)',
    'st.faits_illisibles': 'bloc audit-selftest-data illisible : le fichier a été modifié après sa génération', 'st.plan_illisible': 'bloc remediation-plan-json illisible : le fichier a été modifié après sa génération',
    'st.plan_modifie': 'le plan du bloc remediation-plan-json diffère du plan embarqué dans le moteur : le fichier a été modifié après sa génération',
  },
  en: {
    'verdict.conforme': 'Compliant', 'verdict.partiel': 'Partial', 'verdict.non_conforme': 'Non-compliant', 'verdict.sans_objet': 'Not applicable', 'verdict.a_evaluer': 'To assess',
    'crit.fatal': 'Fatal', 'crit.bloquant': 'Blocking', 'crit.majeur': 'Major', 'crit.standard': 'Standard', 'crit.libelle': 'Criticality %1', 'crit.absente': 'Criticality not set',
    'enf.blocking': 'Blocking', 'enf.required': 'Required', 'enf.advisory': 'Advisory', 'enf.recommendation': 'Recommendation',
    'gate1b.nogo': 'NO-GO gate 1b', 'gate1b.reserve': 'GO with reservations', 'gate1b.go': 'GO', 'gate1b.absente': 'Gate 1b not pronounced',
    'prio.urgent': 'Urgent', 'prio.prio': 'High priority', 'prio.quick': 'Quick win', 'prio.norm': 'Planned',
    'oui_non.oui': 'yes', 'oui_non.non': 'no',
    'score.libelle': 'Score %1/5 · %2', 'score.absent': 'Score not set', 'score.off': 'Out of scope (not applicable)',
    'score.cran.1': 'Blocking', 'score.cran.2': 'Insufficient', 'score.cran.3': 'Acceptable', 'score.cran.4': 'Solid', 'score.cran.5': 'State of the art',
    'famille.nav': 'Families of dimensions', 'famille.titre': 'Family · %1', 'famille.moyenne': 'avg %1/5', 'famille.sans_note': 'no score',
    'dim.abrege': 'dim.', 'dim.synthese': 'Audit summary', 'dim.perimetre0': 'Functional scope', 'dim.perimetre': 'Dimension summary',
    'dim.off': 'Dimension out of scope: %1', 'dim.off_sans_motif': 'reason not given', 'dim.note_titre': 'Note for the decision authority', 'dim.note_label': 'Auditor recommendation',
    'schema.onglet': 'Architecture diagram', 'schema.eyebrow': 'Logical architecture · %1', 'schema.titre': 'Architecture diagram',
    'schema.lead': 'Logical view recorded during the audit: bands, components and flows. Every arrow has its own ports and lane; hover a node or an arrow for its detail.',
    'schema.legende': 'Figure — logical architecture of %1, from the audit data (%2 components, %3 flows).',
    'schema.style.purple': 'Purple · actors and inputs', 'schema.style.blue': 'Blue · application modules', 'schema.style.teal': 'Teal · steering and data',
    'schema.style.coral': 'Coral · critical components', 'schema.style.amber': 'Amber · external integrations', 'schema.style.gray': 'Grey · shared services',
    'dict.titre': 'Table dictionary', 'dict.compte': '%1 table(s)', 'dict.vide': 'No table declared.', 'dict.c.table': 'Table', 'dict.c.colonne': 'Column',
    'dict.c.type': 'Type', 'dict.c.cle': 'Key', 'dict.c.note': 'Data processed / note', 'dict.f.pii': 'Personal data',
    'tm.titre': 'Traceability — rules, evidence and actions', 'tm.indice': 'Finding · evidence · rule · action — filters, sort, search',
    'tm.intro.regle': 'Each row is a baseline rule attached to this dimension: its verdict, the findings behind it and the plan action that handles it. Click a row for its detail.',
    'tm.intro.constat': 'No baseline rule is attached to this dimension: the matrix ties each finding to its evidence, and the dimension action plan handles them.',
    'tm.note': 'A compliant rule rests on evidence; a partial, non-compliant or to-assess rule points to a plan action. An applicable rule with neither evidence nor action is flagged "to cover". Not-applicable rules are out of the coverage count.',
    'tm.exemption': 'filtered by the matrix bar (checkboxes per criterion, search, sort by column)',
    'tm.chercher': 'Search (rule, verdict, answer, evidence, action…)', 'tm.ouvrir_regle': 'Open in "All rules"',
    'tm.f.severite': 'Severity', 'tm.f.preuve': 'Evidence', 'tm.f.criticite': 'Criticality', 'tm.f.enforcement': 'Enforcement', 'tm.f.verdict': 'Verdict', 'tm.f.action': 'Action plan',
    'tm.f.enforcement.aide': 'Normative scope: "required" mandatory, "advisory" binding, "recommendation" informative.',
    'tm.f.preuve.aide': 'Isolates the rules backed by evidence (finding or answer given), or without evidence.',
    'tm.f.action.aide': 'Isolates the rules carrying a plan action, or without action.',
    'tm.preuve.avec': 'With evidence', 'tm.preuve.sans': 'Without evidence', 'tm.action.avec': 'With action', 'tm.action.sans': 'Without action',
    'tm.c.regle': 'Rule', 'tm.c.criticite': 'Criticality', 'tm.c.verdict': 'Verdict', 'tm.c.preuves_liees': 'Evidence — linked findings', 'tm.c.action': 'Action plan',
    'tm.c.constat': 'Finding', 'tm.c.severite': 'Severity', 'tm.c.preuves': 'Evidence',
    'tm.p.constats': 'Findings', 'tm.p.graves': 'Fatal, blocking, major', 'tm.p.actions': 'Actions', 'tm.p.regles': 'Rules', 'tm.p.conformes': 'Compliant', 'tm.p.partiels': 'Partial',
    'tm.p.non_conformes': 'Non-compliant', 'tm.p.a_evaluer': 'To assess', 'tm.p.sans_objet': 'Not applicable', 'tm.p.couvertes': 'Applicable covered',
    'tm.preuve_regle': 'evidence carried by the answer (detail)', 'tm.aucune_preuve': 'no evidence', 'tm.aucune_action': 'no action', 'tm.a_couvrir': 'to cover',
    'tm.action_non_requise': '— not required', 'tm.action_plan': 'plan action', 'tm.couverte_par': 'covered by %1', 'tm.couverte_tip': 'Covered by action %1 (%2)',
    'tm.preuve_type': 'EVIDENCE', 'tm.non_renseigne': 'not given', 'tm.plan_dimension': 'Dimension action plan (%1)',
    'tm.orphelins': 'Findings attached to no rule of the dimension (%1)', 'tm.vide_regles': 'No rule assessed for this dimension.', 'tm.vide_constats': 'No finding for this dimension.',
    'tm.d.col1': '▸ Rule and answer', 'tm.d.col2': '▸ Findings and evidence (%1)', 'tm.d.col3': '▸ Action plan', 'tm.d.dimension': 'Dimension:', 'tm.d.criticite': 'Criticality:',
    'tm.d.enforcement': 'Enforcement:', 'tm.d.verdict': 'Verdict:', 'tm.d.regle': 'Rule:', 'tm.d.apportee': 'Answer given (evidence):', 'tm.d.motif': 'Reason:',
    'tm.d.possible': 'Possible answer (remediation):', 'tm.d.critere': 'Closure criterion:', 'tm.d.constat': '▸ Finding', 'tm.d.preuves': '▸ Evidence (%1)',
    'tm.d.sans_constat': 'No linked finding: the rule rests on its answer alone.', 'tm.d.sans_constat_so': 'No finding: not-applicable rule (reason given).',
    'liste.tous': 'All', 'liste.aucun': 'None', 'liste.chercher': 'Search…', 'liste.reinitialiser': 'Reset', 'liste.compte': '%1 row(s) shown out of %2',
    'liste.vide_filtre': 'No row matches the filters or the search.', 'liste.vide_valeur': '(empty)', 'liste.detail': 'Show detail', 'liste.detail_vide': 'No further detail.',
    'liste.kpi_filtrer': 'Filter: %1', 'liste.kpi_tout': 'Show all', 'liste.kpi_actif': 'filter on · show all', 'liste.kpi_cliquer': 'click to filter', 'liste.kpi_reinit': 'reset',
    'liste.exemption': 'filtered by the view bar (checkboxes per column, highlighted search, sort by column)',
    'regles.vide': 'No rule assessed in the data.', 'regles.chercher': 'Search (rule, title, verdict, answer, dimension…)',
    'regles.f.dimension': 'Dimension', 'regles.f.criticite': 'Criticality', 'regles.f.enforcement': 'Enforcement', 'regles.f.verdict': 'Verdict', 'regles.f.bloquant': 'Blocking',
    'regles.k.conformes': 'Compliant', 'regles.k.partiels': 'Partial', 'regles.k.non_conformes': 'Non-compliant', 'regles.k.bloquantes': 'Blocking rules', 'regles.k.sans_objet': 'Not applicable', 'regles.k.a_evaluer': 'To assess',
    'regles.c.regle': 'Rule', 'regles.c.dimension': 'Dimension', 'regles.c.criticite': 'Crit.', 'regles.c.enforcement': 'Enforcement', 'regles.c.verdict': 'Verdict',
    'regles.c.apportee': 'Answer given', 'regles.c.possible': 'Possible answer', 'regles.c.constats': 'Linked findings',
    'regles.bloquante_tip': 'Blocking: Fatal or Blocking criticality, non-compliant or partial verdict, action in the plan',
    'plan.vide': 'No action in the plan.', 'plan.chercher': 'Search (identifier, action, rule, dimension, criterion…)',
    'plan.f.priorite': 'Priority', 'plan.f.criticite': 'Criticality', 'plan.f.source': 'Source', 'plan.f.dimension': 'Dimension', 'plan.source.regle': 'Rule', 'plan.source.dimension': 'Dimension',
    'plan.k.actions': 'Actions', 'plan.c.id': 'ID', 'plan.c.priorite': 'Priority', 'plan.c.criticite': 'Criticality', 'plan.c.dimension': 'Dimension', 'plan.c.source': 'Source',
    'plan.c.action': 'Action', 'plan.c.critere': 'Verification criterion (closure)', 'plan.couvre': '(covers %1)', 'plan.non_rattachee': 'not attached',
    'plan.note': 'Self-carried: the report embeds this plan as machine data (remediation-plan-json block), the same computation as remediation-actions.yaml. Extraction and closure check without export: node verifier-remediation.mjs <report>.html [--init | --status tracking.json].',
    'anx.vide': 'No row in the data.',
    'reprise.marque.ok': '[OK]', 'reprise.marque.partial': '[PARTIAL]', 'reprise.marque.gap': '[GAP]', 'reprise.marque.manual': '[Owner input]', 'reprise.marque.autre': '[—]',
    'reprise.legende.ok': 'information collected', 'reprise.legende.partial': 'incomplete information', 'reprise.legende.gap': 'missing information', 'reprise.legende.manual': 'to be completed by the owner',
    'reprise.non_collecte': 'Information not collected during the audit.',
    'vue.onglet': 'Tab · %1',
    'vue.regles.titre': 'All rules', 'vue.regles.h': 'Compliance with the baseline rules',
    'vue.regles.intro': 'One row per assessed rule: verdict, answer given (evidence) and possible answer (remediation), linked to the findings. Cumulative filters, sort by column, highlighted search.',
    'vue.plan.titre': 'Remediation plan', 'vue.plan.h': 'Consolidated remediation plan',
    'vue.plan.intro': 'Exhaustive list of actions: dimension actions and remediations of non-compliant or partial rules, each with a stable identifier, a priority and a closure criterion.',
    'vue.reprise.titre': 'Handover', 'vue.reprise.h': 'Information expected by operations',
    'vue.reprise.intro': 'What the operations team must know to take over the product. Each row carries its status as recorded during the audit.',
    'vue.tests.titre': 'Tests', 'vue.tests.h': 'Tests run', 'vue.tests.intro': 'One row per test suite or campaign declared in the audit data; values are reproduced as produced by the source.',
    'vue.analyses.titre': 'Analyses', 'vue.analyses.h': 'Technical analyses (tooling run)', 'vue.analyses.intro': 'One row per tool run, with the version used and its result. A human review is not a tool: it lives as a dimension finding.',
    'vue.composants.titre': 'Components', 'vue.composants.h': 'Components (versioned inventory)', 'vue.composants.intro': 'Versioned software building blocks: resolved version, current stable registry version, status and recommendation.',
    'qa.ok': 'Quality check: report compliant', 'qa.ok_detail': '%1 check families passed · %2 warning(s).', 'qa.ko': 'Quality check: %1 issue(s) to fix before release',
    'qa.avertissements': '+ %1 warning(s).',
    'st.gate': 'declared gate verdict (%1) inconsistent with the dimensions entered (computed: %2)', 'st.bloquants': 'recomputed blocking dimensions (%1) ≠ declared (%2)',
    'st.sans_critere': '%1 remediation action(s) without closure criterion: %2', 'st.regle_sans_action': 'non-compliant rule without remediation action: %1',
    'st.id_double': 'duplicate action identifier in the plan: %1', 'st.rem_inconnu': 'rule %1 points to action %2, missing from the plan',
    'st.analyses_sans_version': 'ANALYSES inventory: %1 entry(ies) without version used — tooling not run, or a human review misfiled (move it to a dimension finding)',
    'st.nb_dimensions': '%1 dimension(s) in the report, %2 in the baseline', 'st.dim_absente': 'dimension %1 declared but missing from the data', 'st.score': '%1: invalid score (%2), an integer from 1 to 5 expected',
    'st.vues': 'restitution: fewer than two views declared', 'st.a_evaluer_sans_motif': '%1: "to assess" without reason — an unassessed rule is justified',
    'st.a_evaluer': '%1: rule still to assess (reason given)', 'st.sans_preuve': '%1: gap without answer given (evidence)', 'st.sans_possible': '%1: gap without possible answer (written remediation)',
    'st.faits_illisibles': 'audit-selftest-data block unreadable: the file was edited after generation', 'st.plan_illisible': 'remediation-plan-json block unreadable: the file was edited after generation',
    'st.plan_modifie': 'the plan of the remediation-plan-json block differs from the plan embedded in the engine: the file was edited after generation',
  },
};

// Textes des parties statiques (bloc titre, bandeau, synthèses, sommaire, méthode, manifeste, pied).
const FIXES = {
  fr: {
    exporter: 'Exporter PDF', bascule: 'Bascule thème sombre', label: "Rapport d'audit gate 1b · référentiel %1", h1: "Rapport d'audit — %1",
    sous_titre: 'Audit de %1 contre le référentiel AuditCore %2 (%3 dimensions, %4 familles, %5 règles instruites, notation de 1 à 5). La gate 1b rend GO, GO SOUS RÉSERVE ou NO-GO.',
    meta: { projet: 'Projet', version: 'Version auditée', date: "Date d'audit", rapport: 'Version rapport', auditeur: 'Auditeur', llm: "Moteur d'audit (LLM)", env: 'Environnement' },
    gb_label: 'Verdict gate 1b', gb_nogo: "Le périmètre n'est pas industrialisable en l'état : au moins une dimension rend un refus, ou cinq dimensions ou plus sont bloquantes. Le plan d'action consolidé, urgences en tête, doit être exécuté avant une nouvelle présentation à l'autorité de décision.",
    gb_reserve: "Industrialisation possible sous réserve de lever les bloquants identifiés ; le plan de remédiation donne l'ordre de traitement.", gb_go: 'Industrialisation possible : aucune dimension bloquante.',
    gb_prononce: 'Verdict prononcé par : %1.', gb_actions: '%1 actions au plan de remédiation', carte: 'Carte', texte: 'Texte',
    kpi_gate: ['Statut gate 1b', 'Verdict de la porte décisionnelle pour ce périmètre.', 'Calculé : %1 — lecture du verdict et de sa règle en vue Méthode et lecture.'],
    radar_q: 'Comment la maturité se répartit-elle entre les familles de dimensions ?', radar_note: 'Moyenne des scores des dimensions notées de chaque famille, sur 5.',
    chemins_titre: 'Par où commencer, selon qui vous êtes',
    nav: 'Sommaire', ecarts_lien: "Ce que ce rapport ne dit pas", meta_dim: '%1 dim.', meta_regles: '%1 règles', meta_actions: '%1 actions', meta_lignes: '%1 lignes', meta_methode: 'barèmes',
    vues: {
      'v-dimensions': ["Rapport d'audit", "Ce que cette vue vous apprend : pour chaque famille et chaque dimension, le score, la synthèse de l'audit, la matrice de traçabilité (règles, constats, actions) et le plan d'action de la dimension."],
      'v-reprise': ['Reprise applicative', "Ce que cette vue vous apprend : les informations attendues par l'équipe d'exploitation, chacune avec son statut."],
      'v-regles': ['Toutes les règles', 'Ce que cette vue vous apprend : chaque règle instruite, son verdict, sa preuve et sa remédiation, filtrable.'],
      'v-plan': ['Plan de remédiation', "Ce que cette vue vous apprend : les actions de remédiation consolidées, dans l'ordre de priorité, chacune avec son critère de clôture."],
      'v-tests': ['Tests', 'Ce que cette vue vous apprend : les tests exécutés et leur résultat, tels que la source les a produits.'],
      'v-analyses': ['Analyses', "Ce que cette vue vous apprend : l'outillage exécuté, sa version et son résultat."],
      'v-composants': ['Composants', "Ce que cette vue vous apprend : l'inventaire des composants versionnés et leur fraîcheur."],
      'v-methode': ['Méthode et lecture', 'Ce que cette vue vous apprend : comment ce rapport juge, d’où vient chaque bloc de la forme, et ce que le rapport ne peut pas dire.'],
    },
    provenance: 'Provenance et traçabilité', correspondance: "D'où vient chaque bloc de la forme", bloc: 'Bloc', source: 'Source dans rapport-data.json',
    exemption_correspondance: 'table de correspondance lue en place, une ligne par bloc de la forme, non parcourue',
    correspondances: [
      ['Cartes de synthèse', 'syntheses (une carte par entrée, découpée en phrases)'], ['Bandeau du verdict, KPI', 'gate.verdict, dimensions[].score, criticite, gate1b, applicability ; calculés par la règle de la vue Méthode'],
      ['Introduction de famille', 'calculée (scores, refus, règles, constats de la famille) : aucune description de famille au référentiel'],
      ['Synthèse de l’audit (dimension)', 'dimensions[].mesure et dimensions[].preuves ; périmètre : dimensions[].resume'],
      ['Matrice de traçabilité', 'regles[] (verdict, preuve, motif, possible, verification_cloture, couverte_par), constats[] (regles), actions[] (couvre, adr)'],
      ['Plan de remédiation', 'calcul unique buildPlan : actions[] puis règles non conformes ou partielles, même calcul que remediation-actions.yaml'],
      ['Toutes les règles', 'regles[] et métadonnées du référentiel fusionné du tenant (titre, dimension, criticité, enforcement)'],
      ['Schéma d’architecture', 'architecture (bandes, nodes, edges), tracé par ports et voies propres'], ['Schéma de base de données et dictionnaire', 'db_schema (canevas vendoré, TF-0940)'],
      ['Reprise applicative', 'reprise[] (label, value, status) ; identification : projet, date, auditeur'], ['Tests, analyses, composants', 'tests[], analyses[], composants[] tels quels'],
      ['Note pour l’autorité de décision', 'dimensions[].note_da ou note_da_bullets ; absente des données : bloc non rendu'],
    ],
    ecarts_titre: "Ce que ce rapport ne dit pas — manifeste d'écarts", ecarts_apprend: "Ce chapitre liste les absences déclarées : ce qu'aucune donnée ne couvre dans ce rapport, pour que rien ne se devine en silence.",
    ec: {
      aucun: "Aucun écart déclaré : chaque bloc de la forme a sa source dans les données de l'audit.",
      architecture: "Schéma d'architecture absent des données : l'onglet de la famille Architecture n'existe pas.",
      bdd: 'Schéma de base de données absent des données : la dimension %1 n’affiche que sa synthèse et sa matrice.',
      donnees: 'Aucun test, analyse ni composant déclaré : les vues correspondantes n’existent pas.',
      reprise: "Aucun élément de reprise applicative déclaré : la passation vers l'exploitation n'est pas instruite par ce rapport.",
      constats: "Aucun constat détaillé fourni : les matrices ne relient que des règles.",
      orphelins: '%1 constat(s) rattaché(s) à aucune dimension du référentiel (%2) : ils ne s’affichent nulle part — corriger leur champ « dimension ».',
      syntheses: 'Aucune synthèse rédigée transmise : le rapport ne porte pas de cartes de synthèse.',
      plan_incomplet: '%1 action(s) de remédiation sans critère de clôture rédigé : le rapport est incomplet et la porte de rendu le refuse.',
      non_rattachees: '%1 action(s) sans dimension de rattachement (%2) : visibles au plan, elles sortent du contrat YAML de la forge.',
      fleches: '%1 élément(s) du schéma d’architecture non tracé(s) : %2.',
      criticite: '%1 dimension(s) sans criticité renseignée (%2) : la pastille le dit, aucune criticité n’est supposée.',
      d00: 'Périmètre de %1 non rédigé (dimensions[%1].resume absent) : la dimension n’affiche pas de description de périmètre.',
      note: "Aucune note pour l'autorité de décision par dimension dans les données : ce bloc de la forme n'est pas rendu.",
      familles: 'Les introductions de famille sont calculées depuis les scores, refus, règles et constats : le référentiel ne porte aucune description de famille.',
      reprise_plate: 'La reprise applicative arrive en liste plate : la forme la rend en un groupe, sans rattachement par famille (aucune source de rattachement dans les données).',
    },
    pied: { projet: 'Projet', audit: 'Audit', audit_v: 'gate 1b · référentiel AuditCore %1', rapport: 'Version rapport', referentiel: 'Référentiel', referentiel_v: '%1 dimensions · %2 familles · %3 règles instruites', auditeur: 'Auditeur', llm: "Moteur d'audit (LLM)", prononce: 'Verdict prononcé par' },
  },
  en: {
    exporter: 'Export PDF', bascule: 'Dark theme toggle', label: 'Gate 1b audit report · %1 baseline', h1: 'Audit report — %1',
    sous_titre: 'Audit of %1 against the AuditCore %2 baseline (%3 dimensions, %4 families, %5 rules assessed, 1 to 5 scoring). Gate 1b returns GO, GO WITH RESERVATIONS or NO-GO.',
    meta: { projet: 'Project', version: 'Audited version', date: 'Audit date', rapport: 'Report version', auditeur: 'Auditor', llm: 'Audit engine (LLM)', env: 'Environment' },
    gb_label: 'Gate 1b verdict', gb_nogo: 'The scope cannot be industrialised as is: at least one dimension returns a refusal, or five dimensions or more block. The consolidated action plan, urgent items first, must be carried out before a new presentation to the decision authority.',
    gb_reserve: 'Industrialisation possible once the blockers identified are lifted; the remediation plan gives the processing order.', gb_go: 'Industrialisation possible: no blocking dimension.',
    gb_prononce: 'Verdict pronounced by: %1.', gb_actions: '%1 remediation plan actions', carte: 'Card', texte: 'Text',
    kpi_gate: ['Gate 1b status', 'Verdict of the decision gate for this scope.', 'Computed: %1 — reading of the verdict and its rule in the Method & reading view.'],
    radar_q: 'How is maturity spread across the families of dimensions?', radar_note: 'Average score of the scored dimensions of each family, out of 5.',
    chemins_titre: 'Where to start, depending on who you are',
    nav: 'Contents', ecarts_lien: 'What this report does not say', meta_dim: '%1 dim.', meta_regles: '%1 rules', meta_actions: '%1 actions', meta_lignes: '%1 rows', meta_methode: 'scales',
    vues: {
      'v-dimensions': ['Audit report', 'What this view tells you: for every family and dimension, the score, the audit summary, the traceability matrix (rules, findings, actions) and the dimension action plan.'],
      'v-reprise': ['Handover', 'What this view tells you: the information expected by the operations team, each with its status.'],
      'v-regles': ['All rules', 'What this view tells you: every rule assessed, its verdict, its evidence and its remediation, filterable.'],
      'v-plan': ['Remediation plan', 'What this view tells you: the consolidated remediation actions, in order of priority, each with its closure criterion.'],
      'v-tests': ['Tests', 'What this view tells you: the tests run and their result, as produced by the source.'],
      'v-analyses': ['Analyses', 'What this view tells you: the tooling run, its version and its result.'],
      'v-composants': ['Components', 'What this view tells you: the inventory of versioned components and their freshness.'],
      'v-methode': ['Method & reading', 'What this view tells you: how this report judges, where each block of the form comes from, and what the report cannot say.'],
    },
    provenance: 'Provenance and traceability', correspondance: 'Where each block of the form comes from', bloc: 'Block', source: 'Source in rapport-data.json',
    exemption_correspondance: 'mapping table read in place, one row per block of the form, not browsed',
    correspondances: [
      ['Summary cards', 'syntheses (one card per entry, split into sentences)'], ['Verdict banner, KPIs', 'gate.verdict, dimensions[].score, criticite, gate1b, applicability; computed by the rule of the Method view'],
      ['Family introduction', 'computed (scores, refusals, rules, findings of the family): the baseline carries no family description'],
      ['Audit summary (dimension)', 'dimensions[].mesure and dimensions[].preuves; scope: dimensions[].resume'],
      ['Traceability matrix', 'regles[] (verdict, preuve, motif, possible, verification_cloture, couverte_par), constats[] (regles), actions[] (couvre, adr)'],
      ['Remediation plan', 'single buildPlan computation: actions[] then non-compliant or partial rules, the same computation as remediation-actions.yaml'],
      ['All rules', 'regles[] and metadata of the tenant merged baseline (title, dimension, criticality, enforcement)'],
      ['Architecture diagram', 'architecture (bandes, nodes, edges), routed with own ports and lanes'], ['Database schema and dictionary', 'db_schema (vendored canvas, TF-0940)'],
      ['Handover', 'reprise[] (label, value, status); identification: projet, date, auditeur'], ['Tests, analyses, components', 'tests[], analyses[], composants[] as given'],
      ['Note for the decision authority', 'dimensions[].note_da or note_da_bullets; absent from the data: block not rendered'],
    ],
    ecarts_titre: 'What this report does not say — gap manifest', ecarts_apprend: 'This chapter lists the declared gaps: what no data covers in this report, so nothing is left to guess in silence.',
    ec: {
      aucun: 'No gap declared: every block of the form has its source in the audit data.',
      architecture: 'Architecture diagram absent from the data: the Architecture family tab does not exist.',
      bdd: 'Database schema absent from the data: dimension %1 only shows its summary and matrix.',
      donnees: 'No test, analysis or component declared: the matching views do not exist.',
      reprise: 'No handover item declared: the transfer to operations is not assessed by this report.',
      constats: 'No detailed finding supplied: the matrices only tie rules.',
      orphelins: '%1 finding(s) attached to no baseline dimension (%2): they appear nowhere — fix their "dimension" field.',
      syntheses: 'No written summary supplied: the report carries no summary cards.',
      plan_incomplet: '%1 remediation action(s) without a written closure criterion: the report is incomplete and the rendering gate rejects it.',
      non_rattachees: '%1 action(s) without an attached dimension (%2): visible in the plan, they fall out of the forge YAML contract.',
      fleches: '%1 element(s) of the architecture diagram not drawn: %2.',
      criticite: '%1 dimension(s) without criticality (%2): the pill says so, no criticality is assumed.',
      d00: 'Scope of %1 not written (dimensions[%1].resume missing): the dimension shows no scope description.',
      note: 'No note for the decision authority per dimension in the data: this block of the form is not rendered.',
      familles: 'Family introductions are computed from scores, refusals, rules and findings: the baseline carries no family description.',
      reprise_plate: 'The handover comes as a flat list: the form renders it as one group, with no family attachment (no attachment source in the data).',
    },
    pied: { projet: 'Project', audit: 'Audit', audit_v: 'gate 1b · AuditCore baseline %1', rapport: 'Report version', referentiel: 'Baseline', referentiel_v: '%1 dimensions · %2 families · %3 rules assessed', auditeur: 'Auditor', llm: 'Audit engine (LLM)', prononce: 'Verdict pronounced by' },
  },
};
const fmt = (s, ...a) => a.reduce((t, v, i) => t.split(`%${i + 1}`).join(String(v)), String(s));

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE SOMBRE dérivée des jetons du tenant (oracle-tokens T4 : un jeton de couleur du thème clair existe en sombre).
// Calculée ici, en littéraux, depuis les valeurs claires : la couche sémantique du gabarit (color-mix) suit d'elle-même.
// ─────────────────────────────────────────────────────────────────────────────
const hex = (v) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(v).trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const versHex = (c) => '#' + c.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const melanger = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const luminance = (c) => { const l = c.map((x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
const NOIR = [0, 0, 0], BLANC = [255, 255, 255];
/** Les jetons de couleur du bloc :root du thème (valeurs littérales). */
export function jetonsDuTheme(themeCss) {
  const bloc = /:root\s*\{([^}]*)\}/.exec(String(themeCss))?.[1] ?? '';
  return [...bloc.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]).filter(([, v]) => hex(v));
}
/** Le bloc :root[data-theme="dark"] et le bloc d'impression (clair forcé), en littéraux dérivés. */
export function cssSombre(themeCss) {
  const j = Object.fromEntries(jetonsDuTheme(themeCss));
  const encre = hex(j['--txt'] ?? '#1b2733'), fond = hex(j['--bg'] ?? '#f4f6f9');
  const fixe = {
    '--bg': melanger(encre, NOIR, 0.38), '--panel': encre, '--line': melanger(encre, BLANC, 0.16),
    '--txt': fond, '--muted': j['--muted'] ? melanger(hex(j['--muted']), BLANC, 0.45) : melanger(fond, encre, 0.35),
  };
  const sombres = Object.entries(j).map(([k, v]) => {
    if (fixe[k]) return [k, versHex(fixe[k])];
    if (k === '--brand-bg' || k === '--on-brand') return [k, v];
    const c = hex(v);
    return [k, versHex(luminance(c) > 0.45 ? melanger(encre, NOIR, 0.1) : melanger(c, BLANC, 0.45))];
  });
  const clairs = Object.entries(j);
  return `:root[data-theme="dark"]{${sombres.map(([k, v]) => `${k}:${v};`).join('')}}\n`
    + `@media print{:root,:root[data-theme="dark"]{${clairs.map(([k, v]) => `${k}:${v};`).join('')}}}`;
}

/**
 * Bloc de PARITÉ du thème sombre (oracle-bascule B-T4) : chaque jeton de couleur déclaré sous `:root` par une FORMULE
 * (color-mix, var) est redéclaré à l'identique sous `:root[data-theme="dark"]` — la même source, projetée sur les jetons
 * sombres du tenant. Les jetons littéraux du thème sont déjà dans le bloc de `cssSombre`, ils ne sont pas répétés.
 */
export function pariteSombre(cssLumineux, dejaSombres) {
  const decl = new Map();
  for (const m of String(cssLumineux).replace(/\/\*[\s\S]*?\*\//g, ' ').matchAll(/(?:^|[}\s;])(:root)\s*\{([^{}]*)\}/g))
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) if (/#|rgb|hsl|oklch/i.test(d[2]) && !dejaSombres.has(d[1])) decl.set(d[1], d[2].trim());
  return decl.size ? `:root[data-theme="dark"]{${[...decl].map(([k, v]) => `${k}:${v};`).join('')}}` : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// CORRESPONDANCE rapport-data.json → données de la forme.
// ─────────────────────────────────────────────────────────────────────────────
const CRIT_MIN = { Fatal: 'fatal', Bloquant: 'bloquant', Majeur: 'majeur', Standard: 'standard', fatal: 'fatal', bloquant: 'bloquant', majeur: 'majeur', standard: 'standard' };
const TAG_ORDRE = { urgent: 0, prio: 1, quick: 2, norm: 3 };
const SEV_ORDRE = { Fatal: 0, critique: 0, Bloquant: 1, Majeur: 2, majeur: 2, Standard: 3, mineur: 3 };
const PALETTE_FAMILLES = ['--r-sarcelle-encre', '--r-bleu-encre', '--r-rouge', '--r-violet', '--r-orange', '--r-vert'];
const ETAT_REPRISE = { ok: 'ok', ko: 'gap', gap: 'gap', manquant: 'gap', partiel: 'partial', partial: 'partial', manual: 'manual', manuel: 'manual' };
const MOTIF_DIM = /^D\d{2}$/;

/** Dimension d'une règle : métadonnée de la fusion, sinon la donnée, sinon l'identifiant — même dérivation que buildPlan. */
function dimensionDeRegle(r, index, connues) {
  const ok = (d) => MOTIF_DIM.test(d ?? '') && (!connues || connues.has(d));
  const d = String(index[r.id]?.dimension_audit ?? r.dimension_audit ?? '').split(' ')[0];
  if (ok(d)) return d;
  const deduite = String(r.id).match(/\bD\d{2}\b/)?.[0] ?? null;
  return ok(deduite) ? deduite : null;
}

/** Calculs partagés : plan, bloquants, gate, score — mêmes règles que le rendu par vues (rapport-engine.mjs). */
export function calculs(data, dims) {
  const byId = Object.fromEntries((data.dimensions ?? []).map((d) => [d.id, d]));
  const scored = dims.map((d) => ({ ...d, ...byId[d.id] })).filter((d) => byId[d.id]);
  const applicable = scored.filter((d) => d.applicability !== 'off' && aUnScore(d));
  const bloquants = scored.filter(estBloquant);
  const gateCalcule = scored.some((d) => d.gate1b === 'nogo') || bloquants.length >= 5 ? 'NO-GO'
    : scored.some((d) => d.gate1b === 'reserve') || bloquants.length ? 'GO SOUS RÉSERVE' : 'GO';
  const gate = data.gate?.verdict ?? gateCalcule;
  const scoreGlobal = applicable.length ? (applicable.reduce((s, d) => s + d.score, 0) / applicable.length).toFixed(1) : '—';
  return { byId, scored, applicable, bloquants, gate, gateCalcule, scoreGlobal, plan: buildPlan(data) };
}

/**
 * Les données de la forme, construites depuis rapport-data.json : FAMILIES, ORDERED_DOMAINS, DOMAINS, ADRS, ADR_RESP,
 * REPRISE, TESTS, ANALYSES, COMPOSANTS, DICTIONNAIRE, ARCHITECTURE_DATA, DB_SCHEMA_DATA — et la liste des écarts.
 */
export function construireDonnees(data, { dimensions, families, lang = 'fr' }) {
  const F = FIXES[lang] ?? FIXES.fr;
  const dims = dimensions ?? [];
  const fams = (families ?? []).filter((f) => dims.some((d) => d.family === f.key));
  const c = calculs(data, dims);
  const index = data._constraints_index ?? {};
  const connues = dimensionsConnues(data);
  const labelDim = Object.fromEntries(dims.map((d) => [d.id, d.label]));
  const famDe = Object.fromEntries(dims.map((d) => [d.id, d.family]));
  const libFam = Object.fromEntries(fams.map((f) => [f.key, f.label]));
  const ecarts = [];

  // Règles (ADRS) et réponses (ADR_RESP), reliées au plan par le calcul unique.
  const regles = data.regles ?? [];
  const parSource = new Map(c.plan.filter((a) => a.source_type === 'regle').map((a) => [a.source, a]));
  const couverture = new Map();
  for (const a of c.plan) for (const id of a.couvre ?? []) couverture.set(id, a);
  const ADRS = regles.map((r) => {
    const dim = dimensionDeRegle(r, index, connues);
    const meta = index[r.id] ?? {};
    const texteRegle = meta.regle ?? r.regle ?? '';
    return { id: r.id, titre: tronque(texteRegle, 110), synthese: texteRegle, dom: dim ? `${dim} · ${labelDim[dim] ?? ''}` : '—', daudit: dim ?? '—',
      crit: r.criticite ?? meta.criticite ?? null, enf: meta.enforcement ?? r.enforcement ?? null, bucket: meta.bucket ?? null };
  });
  const ADR_RESP = Object.fromEntries(regles.map((r) => {
    const porteuse = parSource.get(r.id), couvrante = couverture.get(r.id);
    return [r.id, {
      verdict: r.verdict ?? 'a_evaluer', apportee: r.preuve ?? '', motif: r.motif ?? '', possible: r.possible ?? r.remediation ?? '',
      verification: r.verification_cloture ?? '', rem_id: porteuse?.id ?? '', priorite: porteuse?.priorite ?? couvrante?.priorite ?? '',
      couvre: porteuse?.couvre ?? [], couverte_par: couvrante ? (couvrante.source_type === 'regle' ? couvrante.source : (couvrante.dimension ?? couvrante.source)) : '',
      rem_id_porteuse: couvrante?.id ?? '',
    }];
  }));

  // Actions de dimension : identifiants du plan (même attribution que buildPlan, séquence par dimension, dans l'ordre).
  const seq = {};
  const idsActions = (data.actions ?? []).map((a) => {
    if (a.id) return a.id;
    const d = a.dimension;
    if (MOTIF_DIM.test(d ?? '') && (!connues || connues.has(d))) { seq[d] = (seq[d] ?? 0) + 1; return `REM-${d}-${String(seq[d]).padStart(3, '0')}`; }
    return `REM-NR-${d ?? '—'}`;
  });

  const idsDims = new Set(dims.map((d) => d.id));
  const constats = data.constats ?? [];
  const orphelins = constats.filter((x) => !idsDims.has(x.dimension ?? '—'));
  const DOMAINS = {};
  for (const d of dims) {
    const info = c.byId[d.id] ?? {};
    const puces = [];
    if (info.mesure) puces.push(esc(info.mesure));
    for (const p of info.preuves ?? []) {
      const ref = typeof p === 'string' ? p : (p.ref ?? p.desc ?? '');
      const desc = typeof p === 'string' ? '' : (p.ref && p.desc ? p.desc : '');
      puces.push(`<strong>${esc(lang === 'en' ? 'Score evidence' : 'Preuve du score')}</strong> · <code>${esc(ref)}</code>${desc ? ` — ${esc(desc)}` : ''}`);
    }
    DOMAINS[d.id] = {
      family: libFam[d.family] ?? d.family, familyKey: d.family, name: d.label,
      score: aUnScore(info) ? info.score : null, applicability: info.applicability ?? 'full', motif: info.motif ?? '',
      criticality: CRIT_MIN[info.criticite ?? info.criticality] ?? null, gate1b: ['nogo', 'reserve', 'go'].includes(info.gate1b) ? info.gate1b : null,
      resume: info.resume ?? '', audit_summary_bullets: puces,
      constats: constats.filter((x) => x.dimension === d.id).sort((a, b) => (SEV_ORDRE[a.severite] ?? 9) - (SEV_ORDRE[b.severite] ?? 9))
        .map((x) => ({ titre: x.titre ?? '—', severite: x.severite ?? null, desc: x.desc ?? '',
          preuves: (x.preuves ?? []).map((p) => (typeof p === 'string' ? { type: null, ref: p, desc: '' } : { type: p.type ?? null, ref: p.ref ?? '', desc: p.desc ?? '' })),
          regles: [...new Set([...(x.regles ?? []), ...(x.adr ?? [])])] })),
      plan_action: (data.actions ?? []).map((a, i) => ({ a, i })).filter(({ a }) => a.dimension === d.id)
        .sort((x, y) => (TAG_ORDRE[x.a.tag] ?? 9) - (TAG_ORDRE[y.a.tag] ?? 9))
        .map(({ a, i }) => ({ id: idsActions[i], titre: a.titre ?? '', desc: a.desc ?? '', tag: TAG_ORDRE[a.tag] !== undefined ? a.tag : 'norm', effort: a.effort ?? '',
          severite: a.severite ?? '', verification: a.verification ?? '', regles: [...new Set([...(a.couvre ?? []), ...(a.adr ?? [])])] })),
      note_da_bullets: Array.isArray(info.note_da_bullets) ? info.note_da_bullets.map(String) : (info.note_da ? phrases(info.note_da) : []),
      schema_bdd: d.id === DIMENSION_SCHEMA_BDD && Boolean(data.db_schema?.tables?.length),
    };
  }

  // Familles : introduction CALCULÉE (le référentiel ne porte aucune description de famille) — dite au manifeste.
  const FAMILIES = fams.map((f) => {
    const ids = dims.filter((d) => d.family === f.key).map((d) => d.id);
    const notees = ids.map((id) => DOMAINS[id]).filter((x) => x.applicability !== 'off' && typeof x.score === 'number');
    const moy = notees.length ? (notees.reduce((s, x) => s + x.score, 0) / notees.length).toFixed(1) : null;
    const refus = ids.filter((id) => DOMAINS[id].gate1b === 'nogo').length;
    const rs = ADRS.filter((a) => ids.includes(a.daudit));
    const nc = rs.filter((a) => ADR_RESP[a.id].verdict === 'non_conforme').length, part = rs.filter((a) => ADR_RESP[a.id].verdict === 'partiel').length;
    const graves = constats.filter((x) => ids.includes(x.dimension) && ['Fatal', 'critique', 'Bloquant'].includes(x.severite)).length;
    const intro = lang === 'en'
      ? `${ids.length} dimension(s) (${ids.join(', ')}): average score ${moy ?? '—'} out of 5 over ${notees.length} scored dimension(s), ${refus} refusal(s) at gate 1b; ${rs.length} rule(s) assessed, ${nc} non-compliant and ${part} partial; ${graves} Fatal or Blocking finding(s).`
      : `${ids.length} dimension(s) (${ids.join(', ')}) : score moyen ${moy ? moy.replace('.', ',') : '—'} sur 5 sur ${notees.length} dimension(s) notée(s), dont ${refus} en refus à la gate 1b ; ${rs.length} règle(s) instruite(s), dont ${nc} non conforme(s) et ${part} partielle(s) ; ${graves} constat(s) Fatal ou Bloquant.`;
    return { key: f.key, name: f.label, color: `var(--fam-${f.key})`, domains: ids, intro };
  });

  // Reprise : identification (projet, date, auditeur) + éléments de la donnée, regroupés par `groupe` s'il existe.
  const projet = data.projet ?? {};
  const ident = [
    [F.meta.projet, projet.nom ?? data.titre], [F.meta.version, [projet.version, projet.commit].filter(Boolean).join(' · ')],
    [F.meta.env, projet.environnement], [lang === 'en' ? 'Repository' : 'Dépôt', projet.repo], [lang === 'en' ? 'Project type' : 'Type de projet', projet.type],
    [F.meta.date, data.date], [F.meta.auditeur, data.auditeur],
  ].filter(([, v]) => v).map(([label, value]) => ({ label, value: String(value), etat: 'ok' }));
  const elements = (data.reprise ?? []).map((r) => ({ label: r.label ?? '—', value: String(r.value ?? r.valeur ?? ''), etat: ETAT_REPRISE[String(r.status ?? r.statut ?? '').toLowerCase()] ?? 'autre', groupe: r.groupe ?? r.famille ?? null }));
  const groupesNommes = [...new Set(elements.map((e) => e.groupe).filter(Boolean))];
  const REPRISE = { groupes: [] };
  if (ident.length) REPRISE.groupes.push({ titre: lang === 'en' ? 'Project identification' : 'Identification du projet', description: lang === 'en' ? 'From the audit data (projet, date, auditeur).' : "D'après les données d'audit (projet, date, auditeur).", items: ident });
  if (elements.length) {
    for (const g of groupesNommes) REPRISE.groupes.push({ titre: g, description: '', items: elements.filter((e) => e.groupe === g) });
    const libres = elements.filter((e) => !e.groupe);
    if (libres.length) REPRISE.groupes.push({ titre: lang === 'en' ? 'Handover items' : 'Éléments de reprise', description: '', items: libres });
  }

  // Dictionnaire des tables (D16) — une ligne par colonne.
  const db = data.db_schema;
  const DICTIONNAIRE = [];
  for (const t of db?.tables ?? []) {
    (t.columns ?? []).forEach((col, i) => {
      const cle = col.k ?? [col.pk && 'PK', col.fk && 'FK'].filter(Boolean).join(' · ');
      DICTIONNAIRE.push({ table: t.label ?? t.id, role: t.role ?? '', ordre: i, colonne: col.n ?? '—', type: col.t ?? '', cle: [cle, col.nn ? 'NN' : ''].filter(Boolean).join(' · '),
        pii: col.pii ? 'oui' : 'non', note: col.note ?? (i === 0 ? [t.role, t.note].filter(Boolean).join(' — ') : '') });
    });
  }

  // Écarts déclarés (manifeste) — chaque absence de source se dit.
  const nonRattachees = c.plan.filter((a) => !estIdActionRattache(a.id, connues));
  const planIncomplet = c.plan.filter((a) => /\{\{/.test(`${a.action} ${a.verification}`));
  if (!(data.architecture?.nodes ?? []).length) ecarts.push(F.ec.architecture);
  if (!(db?.tables ?? []).length) ecarts.push(fmt(F.ec.bdd, DIMENSION_SCHEMA_BDD));
  if (![data.tests, data.analyses, data.composants].some((x) => (x ?? []).length)) ecarts.push(F.ec.donnees);
  if (!(data.reprise ?? []).length) ecarts.push(F.ec.reprise);
  else if (!groupesNommes.length) ecarts.push(F.ec.reprise_plate);
  if (!constats.length) ecarts.push(F.ec.constats);
  if (orphelins.length) ecarts.push(fmt(F.ec.orphelins, orphelins.length, orphelins.map((x) => x.titre ?? '—').join(', ')));
  if (!data.syntheses || !Object.keys(data.syntheses).length) ecarts.push(F.ec.syntheses);
  if (planIncomplet.length) ecarts.push(fmt(F.ec.plan_incomplet, planIncomplet.length));
  if (nonRattachees.length) ecarts.push(fmt(F.ec.non_rattachees, nonRattachees.length, nonRattachees.map((a) => a.source).join(', ')));
  const schema = (data.architecture?.nodes ?? []).length ? calculerSchema(data.architecture) : null;
  if (schema?.ignores.length) ecarts.push(fmt(F.ec.fleches, schema.ignores.length, schema.ignores.map((x) => `${x.id ?? '—'} (${x.motif})`).join(', ')));
  const sansCrit = dims.filter((d) => c.byId[d.id] && c.byId[d.id].applicability !== 'off' && !DOMAINS[d.id].criticality).map((d) => d.id);
  if (sansCrit.length) ecarts.push(fmt(F.ec.criticite, sansCrit.length, sansCrit.join(', ')));
  const premiere = dims[0]?.id;
  if (premiere && !DOMAINS[premiere].resume) ecarts.push(fmt(F.ec.d00, premiere));
  if (!dims.some((d) => DOMAINS[d.id].note_da_bullets.length)) ecarts.push(F.ec.note);
  ecarts.push(F.ec.familles);

  return {
    c, FAMILIES, ORDERED_DOMAINS: dims.map((d) => d.id), DOMAINS, ADRS, ADR_RESP, REPRISE,
    TESTS: data.tests ?? [], ANALYSES: data.analyses ?? [], COMPOSANTS: data.composants ?? [], DICTIONNAIRE,
    ARCHITECTURE_DATA: data.architecture?.nodes?.length ? { bandes: data.architecture.bandes ?? [], nodes: data.architecture.nodes, edges: data.architecture.edges ?? [] } : null,
    DB_SCHEMA_DATA: db?.tables?.length ? db : null,
    FAMILLE_SCHEMA: famDe[DIMENSION_ARCHITECTURE] ?? fams[0]?.key ?? '',
    ecarts, orphelins,
  };
}

/** Configuration des trois listes annexes : colonnes présentes dans la donnée, filtres, tuiles, détail. */
function annexes(D, lang) {
  const en = lang === 'en';
  const present = (lignes, cle) => lignes.some((r) => r[cle] !== undefined && r[cle] !== null && String(r[cle]) !== '');
  const L = (fr, eng) => (en ? eng : fr);
  const def = (lignes, colonnesVoulues, filtresVoulus, statut) => {
    const colonnes = colonnesVoulues.filter(([k, , , force]) => force || present(lignes, k));
    const pris = new Set(colonnes.map(([k]) => k));
    const detail = [...new Set(lignes.flatMap((r) => Object.keys(r)))].filter((k) => !pris.has(k)).map((k) => [k, k.replace(/_/g, ' ')]);
    const filtres = filtresVoulus.filter(([k]) => present(lignes, k) && new Set(lignes.map((r) => String(r[k] ?? ''))).size <= 14);
    const kpis = [[L('Total', 'Total'), 'v-todo', null, null]];
    if (statut && present(lignes, statut)) {
      const vals = [...new Set(lignes.map((r) => String(r[statut] ?? '')))].filter(Boolean).slice(0, 4);
      for (const v of vals) kpis.push([v, /passant|conforme|ok|jour|pass/i.test(v) ? 'v-ok' : /[ée]chou|bloquant|corriger|fail|ko|securite|sécurité/i.test(v) ? 'v-ko' : 'v-part', statut, v]);
    }
    if (present(lignes, 'reco_flag') && lignes.some((r) => r.reco_flag === 'Oui')) kpis.push([L('À mettre à jour', 'To update'), 'v-ko strong', 'reco_flag', 'Oui']);
    return { colonnes, filtres, kpis, detail };
  };
  return {
    tests: def(D.TESTS, [['statut', L('Statut', 'Status'), 'badge'], ['suite', 'Suite'], ['type', 'Type'], ['portee', L('Portée', 'Scope')], ['nom', 'Test'],
      ['resultat', L('Résultat', 'Result')], ['couverture', L('Couverture', 'Coverage')], ['outil', L('Outil', 'Tool')]],
    [['statut', L('Statut', 'Status')], ['type', 'Type'], ['suite', 'Suite'], ['outil', L('Outil', 'Tool')]], 'statut'),
    analyses: def(D.ANALYSES, [['statut', L('Statut', 'Status'), 'badge'], ['categorie', L('Catégorie', 'Category')], ['outil', L('Outil', 'Tool')],
      ['version_utilisee', L('Version utilisée', 'Version used')], ['version_actuelle', L('Version actuelle', 'Current version')], ['resultat', L('Résultat', 'Result')], ['constat', L('Constat', 'Finding')], ['reco_flag', 'Reco']],
    [['statut', L('Statut', 'Status')], ['categorie', L('Catégorie', 'Category')], ['outil', L('Outil', 'Tool')], ['reco_flag', 'Reco']], 'statut'),
    // Six colonnes FIXES, dans l'ordre que juge le contrôle 10 de la porte de rendu (plausibilité de la version actuelle) :
    // nom, version résolue, version actuelle, statut, reco, périmètre — les autres champs vont au détail.
    composants: def(D.COMPOSANTS, [['nom', L('Nom', 'Name'), null, true], ['version_resolue', L('Version résolue', 'Resolved version'), 'brut', true],
      ['version_actuelle', L('Version actuelle', 'Current version'), 'brut', true], ['statut', L('Statut', 'Status'), null, true], ['reco_flag', 'Reco', null, true], ['perimetre', L('Périmètre', 'Scope'), null, true]],
    [['statut', L('Statut', 'Status')], ['perimetre', L('Périmètre', 'Scope')], ['type', 'Type'], ['reco_flag', 'Reco']], 'statut'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDU
// ─────────────────────────────────────────────────────────────────────────────
/** Le moteur du gabarit (script principal), avec ses champs de données remplis. */
function sourceMoteur(gabarit, donneesJs, coherenceJs) {
  const debut = gabarit.indexOf('<script>\n/* ==== AuditCore — moteur de la forme POC-to-Prod');
  const fin = gabarit.indexOf('</script>', debut);
  if (debut < 0 || fin < 0) throw new Error('gabarit : script du moteur introuvable');
  return gabarit.slice(debut + '<script>'.length, fin).replace('{{DONNEES_JS}}', () => donneesJs).replace('{{JS_COHERENCE}}', () => coherenceJs);
}
/** Les règles de cohérence du plan (TF-0624 / TF-0625), prises À LA SOURCE dans le moteur des vues : une seule règle. */
export function coherenceJs() {
  // fins de ligne ramenées à LF : un poste en CRLF et un runner en LF rendent le même fichier, octet pour octet
  const s = fs.readFileSync(MOTEUR_LEGACY, 'utf8').replace(/\r\n/g, '\n');
  const a = s.indexOf('function motsUtiles('), b = s.indexOf('function auditSelfTest(');
  if (a < 0 || b <= a) throw new Error('rapport-engine.mjs : bloc de cohérence du plan introuvable (motsUtiles … auditSelfTest)');
  const bloc = s.slice(a, b);
  if (bloc.includes(String.fromCharCode(92)) || bloc.includes('$' + '{') || bloc.includes(String.fromCharCode(96)))
    throw new Error('bloc de cohérence du plan : échappement de gabarit inattendu, la copie à la source ne serait plus fidèle');
  return bloc;
}

const radarSvg = (famAvg, titre) => {
  const R = 110, CX = 230, CY = 140;
  const pt = (i, v) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / famAvg.length; return `${(CX + Math.cos(a) * R * (v / 5)).toFixed(1)},${(CY + Math.sin(a) * R * (v / 5)).toFixed(1)}`; };
  const ids = [...[1, 2, 3, 4, 5].map((v) => `radar-anneau-${v}`), 'radar-donnees', ...famAvg.map((_, i) => `radar-lab-${i}`)];
  const ok = (id) => ids.filter((x) => x !== id).join(' ');
  return `<svg viewBox="0 0 460 290" class="radar" role="img" aria-label="${esc(titre)}">`
    + [1, 2, 3, 4, 5].map((v) => `<polygon id="radar-anneau-${v}" data-overlap-ok="${ok(`radar-anneau-${v}`)}" points="${famAvg.map((_, i) => pt(i, v)).join(' ')}" fill="none" stroke="var(--r-trait)" stroke-width="${v === 5 ? 1.2 : 0.6}"/>`).join('')
    + `<polygon id="radar-donnees" data-overlap-ok="${ok('radar-donnees')}" points="${famAvg.map((f, i) => pt(i, f.avg ?? 0)).join(' ')}" fill="var(--r-bleu)" fill-opacity="0.18" stroke="var(--r-bleu)" stroke-width="2"/>`
    + famAvg.map((f, i) => { const [x, y] = pt(i, 5.75).split(','); return `<text id="radar-lab-${i}" data-overlap-ok="${ok(`radar-lab-${i}`)}" x="${x}" y="${y}" text-anchor="middle" class="rlab">${esc(f.label)} · ${f.avg === null ? '—' : f.avg.toFixed(1)}</text>`; }).join('')
    + '</svg>';
};

/**
 * Rend le rapport HTML de la forme POC-to-Prod. `opts` : { tenant, dimensions, families, themeCss, coreVersion, lang }.
 * Rend { html, donnees } — `donnees` sert aux tests et à la porte.
 */
export function rendreRapportPocToProd(data, { tenant, dimensions, families, themeCss = '', coreVersion = '', lang = 'fr' } = {}) {
  const L = STR[lang] ?? STR.fr;
  const Rz = RES[lang] ?? RES.fr;
  const F = FIXES[lang] ?? FIXES.fr;
  const I18N = LIBELLES[lang] ?? LIBELLES.fr;
  const dims = dimensions ?? [];
  const D = construireDonnees(data, { dimensions: dims, families, lang });
  const { c } = D;
  const projet = data.projet?.nom ?? data.titre ?? '';
  const refDatee = `${data.date ?? ''}${data.indice ?? ''}`.trim();
  const regles = data.regles ?? [];
  const nb = (v) => regles.filter((r) => r.verdict === v).length;
  const nbConf = nb('conforme'), nbPart = nb('partiel'), nbNC = nb('non_conforme'), nbSO = nb('sans_objet');
  const nbAutres = regles.length - (nbConf + nbPart + nbNC + nbSO);
  const urgentes = c.plan.filter((a) => a.priorite === 'urgent').length, prioritaires = c.plan.filter((a) => a.priorite === 'prio').length;
  const gateCle = c.gate === 'NO-GO' ? 'nogo' : c.gate === 'GO' ? 'go' : 'reserve';
  const gateClasse = c.gate === 'GO' ? 'std' : c.gate === 'NO-GO' ? 'fatal' : 'maj';

  // Vues présentes (une vue sans donnée n'existe pas : son absence est déclarée au manifeste).
  const VUES = [{ id: 'v-dimensions', mode: 'audit', meta: fmt(F.meta_dim, dims.length) }];
  if (D.REPRISE.groupes.length && (data.reprise ?? []).length) VUES.push({ id: 'v-reprise', mode: 'reprise', meta: fmt(F.meta_lignes, (data.reprise ?? []).length) });
  if (D.ADRS.length) VUES.push({ id: 'v-regles', mode: 'adr', meta: fmt(F.meta_regles, D.ADRS.length) });
  if (c.plan.length) VUES.push({ id: 'v-plan', mode: 'remediation', meta: fmt(F.meta_actions, c.plan.length) });
  for (const k of ['tests', 'analyses', 'composants']) if (D[k.toUpperCase()].length) VUES.push({ id: `v-${k}`, mode: k, meta: fmt(F.meta_lignes, D[k.toUpperCase()].length) });
  VUES.push({ id: 'v-methode', mode: 'methode', meta: F.meta_methode });

  // Faits d'auto-test (même forme que le rendu par vues : les bancs les lisent) et plan embarqué.
  const planJson = { schema: 'auditcore.remediation-plan/v1',
    meta: { projet: projet || null, date: refDatee || null, verdict_gate1b: c.gate, core_version: coreVersion || null, moteur_audit_llm: data.moteur_audit_llm ?? null, gabarit: `${GABARIT_ID}@${GABARIT_VERSION}` },
    actions: c.plan };
  const faits = {
    gate_declare: c.gate, bloquants: c.bloquants.map((b) => b.id), dimensions_nogo: c.scored.filter((d) => d.gate1b === 'nogo').map((d) => d.id),
    regles_non_conformes: regles.filter((r) => r.verdict === 'non_conforme').map((r) => r.id),
    analyses_sans_version: (data.analyses ?? []).filter((a) => !String(a.version_utilisee ?? '').trim()).map((a) => a.outil ?? '?'),
    vues: VUES.map((v) => v.id),
  };

  // Schémas : rendus ici, une fois (le moteur les insère tels quels). Le tracé du schéma d'architecture ne dépend QUE de
  // la donnée, pour que la présentation à l'autorité (build-slides, P6 de verifier-presentation) porte le même SVG
  // (TF-2142, « pas de second schéma divergent »). Seul son libellé accessible suit la langue du rendu (TF-2169) : en
  // français il vaut le défaut de renderSchemaArchitecture, donc la présentation (en français) reste octet pour octet
  // celle du rapport ; les portes reconnaissent le schéma à son marqueur `data-schema`, pas à ce libellé.
  const ARCHITECTURE_SVG = D.ARCHITECTURE_DATA ? renderSchemaArchitecture(data.architecture, { ariaLabel: I18N['schema.titre'] }) : '';
  const DB_SCHEMA_HTML = D.DB_SCHEMA_DATA
    ? `<div class="db-schema-hote"><div id="dbSchemaMount" data-rognage-assume="mise a l echelle par fitSchema : la hauteur du conteneur suit le facteur applique, aucun contenu n est masque"><div class="db-scaler">${adapterCanevasHtml(renderDbSchema(adapterDbSchema(D.DB_SCHEMA_DATA)))}</div></div>${adapterCanevasHtml(renderDbLegend())}</div>`
    : '';

  const donneesJs = [
    `const I18N = ${json(I18N)};`,
    `const META = ${json({ projet, date: data.date ?? null, indice: data.indice ?? null, gate: c.gate, tenant })};`,
    `const NB_DIMENSIONS = ${dims.length};`,
    `const FAMILLE_SCHEMA = ${json(D.FAMILLE_SCHEMA)};`,
    `const VUES = ${json(VUES.map(({ id, mode }) => ({ id, mode })))};`,
    `const FAMILIES = ${json(D.FAMILIES)};`,
    `const ORDERED_DOMAINS = ${json(D.ORDERED_DOMAINS)};`,
    `const DOMAINS = ${json(D.DOMAINS)};`,
    `const ARCHITECTURE_DATA = ${json(D.ARCHITECTURE_DATA)};`,
    `const ARCHITECTURE_SVG = ${json(ARCHITECTURE_SVG)};`,
    `const DB_SCHEMA_DATA = ${json(D.DB_SCHEMA_DATA)};`,
    `const DB_SCHEMA_HTML = ${json(DB_SCHEMA_HTML)};`,
    `const DB_TABLES = ${(D.DB_SCHEMA_DATA?.tables ?? []).length};`,
    `const DICTIONNAIRE = ${json(D.DICTIONNAIRE)};`,
    `const ICO_PII = ${json(ICO_PII)};`,
    `const REPRISE = ${json(D.REPRISE)};`,
    `const ADRS = ${json(D.ADRS)};`,
    `const ADR_RESP = ${json(D.ADR_RESP)};`,
    `const TESTS = ${json(D.TESTS)};`,
    `const ANALYSES = ${json(D.ANALYSES)};`,
    `const COMPOSANTS = ${json(D.COMPOSANTS)};`,
    `const ANNEXES = ${json(annexes(D, lang))};`,
    `const PLAN_EMBARQUE = ${json(planJson)};`,
    `const FAITS_AUTOTEST = ${json(faits)};`,
  ].join('\n');

  // ── Rendu côté serveur : le MOTEUR du gabarit, exécuté sans navigateur, écrit le rendu initial des vues.
  const moteur = sourceMoteur(GABARIT.texte, donneesJs, coherenceJs());
  const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {}, info() {} } });
  vm.runInContext(moteur, ctx, { filename: 'moteur-poc-to-prod.js' });
  const appel = (expr) => vm.runInContext(expr, ctx);
  const corps = {
    'v-dimensions': `<div id="panel-hote">${appel('htmlVueAudit()')}</div>`,
    'v-reprise': `<div id="reprisePanel">${VUES.some((v) => v.id === 'v-reprise') ? appel('htmlVueReprise()') : ''}</div>`,
    'v-regles': `<div id="adrPanel">${D.ADRS.length ? appel('htmlVueRegles()') : ''}</div>`,
    'v-plan': `<div id="remediationPanel">${c.plan.length ? appel('htmlVuePlan()') : ''}</div>`,
    'v-tests': `<div id="testsPanel">${D.TESTS.length ? appel("htmlVueAnnexe('tests')") : ''}</div>`,
    'v-analyses': `<div id="analysesPanel">${D.ANALYSES.length ? appel("htmlVueAnnexe('analyses')") : ''}</div>`,
    'v-composants': `<div id="composantsPanel">${D.COMPOSANTS.length ? appel("htmlVueAnnexe('composants')") : ''}</div>`,
  };
  const qa = appel('auditSelfTest()');
  const qaHtml = appel(`htmlQa(${json(qa)})`);

  // ── Méthode et lecture (contenu générique, une seule fois — RL-7).
  corps['v-methode'] = `<div class="methode lire" data-mesure-lecture>
    <h3>${esc(L.score)}</h3><p id="leg-score">${esc(Rz.leg.score)}</p>
    <h3><dfn>${esc(L.gate)}</dfn></h3><p id="leg-gate">${esc(Rz.leg.gate)}</p>
    <h3>${esc(L.verdict)}</h3><p id="leg-verdicts">${esc(Rz.leg.verdicts)}</p><p id="leg-criticites">${esc(Rz.leg.criticites)}</p>
    <h3>${esc(L.prio)}</h3><p id="leg-priorites">${esc(Rz.leg.priorites)}</p>
    <h3>${esc(L.preuve)}</h3><p id="leg-preuve">${esc(Rz.leg.preuve)}</p><p id="leg-mesures">${esc(Rz.leg.mesures)}</p>
    <h3>${esc(F.correspondance)}</h3>
    <table id="t-__correspondance"${F.correspondances.length >= 8 ? ` data-filterable="off" data-filterable-reason="${esc(F.exemption_correspondance)}"` : ''}><thead><tr><th>${esc(F.bloc)}</th><th>${esc(F.source)}</th></tr></thead><tbody>${F.correspondances.map(([b, s]) => `<tr class="ligne"><td>${esc(b)}</td><td>${esc(s)}</td></tr>`).join('')}</tbody></table>
    <h3>${esc(F.provenance)}</h3>
    <table id="t-__provenance"><thead><tr><th>${esc(L.info)}</th><th>${esc(L.valeur)}</th></tr></thead><tbody>
      <tr class="ligne"><td>${esc(L.auditeur)}</td><td>${esc(data.auditeur ?? '—')}</td></tr>
      <tr class="ligne"><td>core</td><td>${esc(coreVersion || '—')}</td></tr>
      <tr class="ligne"><td>${esc(L.moteur_llm)}</td><td>${esc(data.moteur_audit_llm ? [data.moteur_audit_llm.modele, data.moteur_audit_llm.modele_id, data.moteur_audit_llm.editeur, data.moteur_audit_llm.date].filter(Boolean).join(' · ') : '—')}</td></tr>
      <tr class="ligne"><td>${esc(L.rapport)}</td><td>${esc(`${projet} · ${refDatee}`)} · ${esc(`${GABARIT_ID} ${GABARIT_VERSION}`)}</td></tr>
    </tbody></table></div>`;

  // ── Sommaire (bascule des vues) et sections.
  const nav = `<nav class="toc vues" id="modeToggle" aria-label="${esc(F.nav)}" role="tablist">\n`
    + VUES.map((v, i) => `    <a id="tab-${v.id}" class="mode-btn${i === 0 ? ' active' : ''}" href="#${v.id}" data-mode="${v.mode}" data-vue="${v.id}" role="tab" aria-selected="${i === 0}" aria-controls="${v.id}" onclick="return montreVue('${v.id}')"><span>${esc(F.vues[v.id][0])}</span><span class="mb-meta">${esc(v.meta)}</span></a>`).join('\n')
    + `\n    <span class="toc-ecarts"><a href="#v-ecarts">${esc(F.ecarts_lien)}</a></span>\n  </nav>`;
  const section = (v, i) => `<section class="vue${i === 0 ? ' active' : ''}" id="${v.id}" role="tabpanel" aria-labelledby="tab-${v.id}">
    <h2 class="sr">${esc(F.vues[v.id][0])}</h2><div class="lire" data-mesure-lecture><p class="objectif ch-apprend">${esc(F.vues[v.id][1])}</p></div>
    ${corps[v.id]}</section>`;
  const donnees = VUES.filter((v) => ['v-tests', 'v-analyses', 'v-composants'].includes(v.id));
  const vuesHtml = VUES.map((v, i) => {
    if (donnees.length && v.id === donnees[0].id) return `<div id="v-donnees" class="vues-donnees">${donnees.map((x) => section(x, VUES.indexOf(x))).join('\n')}</div>`;
    if (donnees.some((x) => x.id === v.id)) return '';
    return section(v, i);
  }).filter(Boolean).join('\n');

  // ── Bloc titre, bandeau, synthèses, KPI, chemins.
  const llm = data.moteur_audit_llm ? [data.moteur_audit_llm.modele, data.moteur_audit_llm.modele_id, data.moteur_audit_llm.date].filter(Boolean).join(' · ') : '';
  const metaTitre = [[F.meta.projet, projet], [F.meta.version, [data.projet?.version, data.projet?.commit].filter(Boolean).join(' · ')], [F.meta.env, data.projet?.environnement],
    [F.meta.date, data.date], [F.meta.rapport, refDatee], [F.meta.auditeur, data.auditeur], [F.meta.llm, llm]].filter(([, v]) => v);
  const blocTitre = `      <div class="label">${esc(fmt(F.label, data.projet?.referentiel ?? 'POC-to-Prod'))}</div>
      <h1>${esc(fmt(F.h1, projet))}</h1>
      <p class="subtitle">${esc(fmt(F.sous_titre, projet, coreVersion, dims.length, D.FAMILIES.length, regles.length))}</p>
      <div class="meta">${metaTitre.map(([k, v]) => `<span><strong>${esc(k)}</strong> · ${esc(v)}</span>`).join('')}</div>`;
  const bandeau = `  <div class="gate-banner ${gateCle} lire" id="gateBanner" data-mesure-lecture>
    <div class="verdict"><p class="gb-label">${esc(F.gb_label)}</p><p class="gb-verdict"><span class="gate ${gateClasse}" title="${esc(Rz.t.gate)}">${esc(c.gate)}</span></p><p class="gb-chiffres">— ${c.bloquants.length} ${esc(L.bloquants.toLowerCase())}, ${nbNC} ${esc(L.regles.toLowerCase())} ${esc(L.nc)}, ${esc(fmt(F.gb_actions, c.plan.length))}.</p></div>
    <div class="gb-desc">${esc(c.gate === 'NO-GO' ? F.gb_nogo : c.gate === 'GO' ? F.gb_go : F.gb_reserve)}${data.gate?.prononce_par ? ' ' + esc(fmt(F.gb_prononce, data.gate.prononce_par)) : ''}</div>
  </div>`;
  const syn = data.syntheses && typeof data.syntheses === 'object' ? Object.entries(data.syntheses) : [];
  const etiquetteCarte = (k) => CARTES_SYNTHESE.find((c) => c.cle === k)?.[lang] ?? k;
  const classeCarte = (k) => (/fonc|func/i.test(k) ? 'sc-fonc' : /tech/i.test(k) ? 'sc-tech' : /audit/i.test(k) ? 'sc-audit' : '');
  const syntheses = syn.length ? `  <table id="t-__syntheses" class="summary-grid"${syn.length >= 8 ? ` data-filterable="off" data-filterable-reason="${esc(Rz.exempt_syntheses)}"` : ''}><thead><tr><th>${esc(F.carte)}</th><th>${esc(F.texte)}</th></tr></thead><tbody>${syn.map(([k, v]) => {
    const ph = phrases(typeof v === 'string' ? v : JSON.stringify(v));
    const titre = ph.length > 1 ? ph[0] : '';
    const puces = ph.length > 1 ? ph.slice(1) : ph;
    return `<tr class="summary-card ${classeCarte(k)}" data-carte="${esc(k)}"><th>${esc(etiquetteCarte(k))}</th><td>${titre ? `<div class="sc-title">${esc(titre)}</div>` : ''}<ul class="sc-bullets">${puces.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></td></tr>`;
  }).join('')}</tbody></table>` : '';
  // L'article reste `class="kpi"` exact et la valeur `class="k-valeur" aria-describedby=…` sans autre attribut : la porte
  // de rendu (RL-3) et les bancs lisent ces formes. L'état (refus, réserve, alerte) vit dans un élément intérieur.
  const kpi = (id, [label, def, repere], valeur, unite, cle, etat = '', extra = '') => `<article class="kpi">
      <span class="k-label">${esc(label)}</span>
      <span class="k-valeur" aria-describedby="${id}">${etat ? `<span class="kv-${etat}">${esc(valeur)}</span>` : esc(valeur)}${unite ? ` <small>${esc(unite)}</small>` : ''}</span>
      <span class="kpi-d">${esc(def)}</span>
      <span class="k-repere" id="${id}">${esc(repere)}</span>${extra}
      ${VUES.some((v) => v.id === `v-${cle}`) ? `<a class="k-action" href="#v-${cle}">${esc(Rz.a[cle] ?? '')}</a>` : ''}</article>`;
  const famAvg = D.FAMILIES.map((f) => { const ds = c.applicable.filter((d) => d.family === f.key); return { label: f.name, avg: ds.length ? ds.reduce((s, d) => s + d.score, 0) / ds.length : null }; });
  const puces = c.bloquants.map((b) => {
    const d = D.DOMAINS[b.id];
    const tip = [`${b.id} — ${d.name}`, `${d.score ?? '—'}/5 · ${d.criticality ?? '—'} · ${d.gate1b ?? '—'}`, (d.constats[0]?.titre ?? '')].filter(Boolean).join(' | ');
    return `<button class="kpi-block-chip" type="button" data-goto="${b.id}" data-tip="${esc(tip)}"><span class="bid">${b.id}</span><span class="bname">${esc(d.name)}</span><span class="bscore">${d.score ?? '—'}/5</span></button>`;
  }).join('');
  const kpis = `  <div class="kpi-grid">
    ${kpi('kr-score', [Rz.kpi.score[0], Rz.kpi.score[1], Rz.kpi.score[2](c.applicable.length, dims.length)], c.scoreGlobal, '/5', 'dimensions')}
    ${kpi('kr-gate', [F.kpi_gate[0], F.kpi_gate[1], fmt(F.kpi_gate[2], c.gateCalcule)], c.gate, '', 'methode', `gate kv-${gateCle}`)}
    ${kpi('kr-bloq', [Rz.kpi.bloquants[0], Rz.kpi.bloquants[1], Rz.kpi.bloquants[2](c.bloquants.length, c.bloquants.map((b) => b.id).join(' · '))], String(c.bloquants.length), '', 'dimensions', c.bloquants.length ? 'alerte' : '', puces ? `<div class="kpi-blocklist">${puces}</div>` : '')}
    ${kpi('kr-regles', [Rz.kpi.regles[0], Rz.kpi.regles[1], Rz.kpi.regles[2](nbNC, nbPart, nbSO, nbAutres, nbConf)], String(regles.length), '', 'regles')}
    ${kpi('kr-plan', [Rz.kpi.plan[0], Rz.kpi.plan[1], Rz.kpi.plan[2](urgentes, prioritaires)], String(c.plan.length), '', 'plan')}
    <figure class="kpi-radar"><figcaption>${esc(F.radar_q)}</figcaption>${radarSvg(famAvg, L.familles)}<p class="radar-note">${esc(F.radar_note)}</p></figure>
  </div>`;
  const lien = (cle) => (VUES.some((v) => v.id === `v-${cle}`) ? `<a href="#v-${cle}">${esc(F.vues[`v-${cle}`][0])}</a>` : esc(F.vues[`v-${cle}`]?.[0] ?? cle));
  const chemins = `  <p class="chemins-titre">${esc(F.chemins_titre)}</p>
  <ul class="chemins">
    <li class="chemin"><b>${esc(Rz.chemins[0][0])}</b>${esc(Rz.chemins[0][1])}${lien('plan')}.</li>
    <li class="chemin"><b>${esc(Rz.chemins[1][0])}</b>${esc(Rz.chemins[1][1])}${lien('plan')}${esc(lang === 'en' ? ', then the ' : ', puis le ')}${lien('dimensions')}.</li>
    <li class="chemin"><b>${esc(Rz.chemins[2][0])}</b>${esc(Rz.chemins[2][1])}${lien('methode')}${esc(lang === 'en' ? ', then ' : ', puis ')}${lien('regles')}.</li>
  </ul>`;

  const ecarts = `    <h2>${esc(F.ecarts_titre)}</h2><p class="ch-apprend">${esc(F.ecarts_apprend)}</p>
    <ul data-colonne-ok>${(D.ecarts.length ? D.ecarts : [F.ec.aucun]).map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;
  const P = F.pied;
  const pied = `    <ul class="rf-info">
      <li><b>${esc(P.projet)}</b> · ${esc(projet || '—')}</li>
      <li><b>${esc(P.audit)}</b> · ${esc(fmt(P.audit_v, coreVersion))}</li>
      <li><b>${esc(P.rapport)}</b> · ${esc(refDatee || '—')}</li>
      <li><b>${esc(P.referentiel)}</b> · ${esc(fmt(P.referentiel_v, dims.length, D.FAMILIES.length, regles.length))}</li>
      <li><b>${esc(P.auditeur)}</b> · ${esc(data.auditeur ?? '—')}</li>
      ${llm ? `<li><b>${esc(P.llm)}</b> · ${esc(llm)}</li>` : ''}${data.gate?.prononce_par ? `<li><b>${esc(P.prononce)}</b> · ${esc(data.gate.prononce_par)}</li>` : ''}
    </ul>
    <div class="rf-main"><div class="rf-brand">${esc(tenant)}</div><div class="rf-meta">${esc(L.footer.replace('{v}', coreVersion).replace('{t}', tenant))}</div></div>`;

  const accent = (/--accent:\s*([^;]+);/.exec(themeCss) || [])[1]?.trim() || '#2563eb';
  const cssFamilles = ':root{' + D.FAMILIES.map((f, i) => `--fam-${f.key}:var(--famille-${f.key},var(${PALETTE_FAMILLES[i % PALETTE_FAMILLES.length]}));--fam-${f.key}-fill:color-mix(in srgb,var(--fam-${f.key}) 8%,var(--r-surface));`).join('') + '}';
  const cssAnnexes = `${SCHEMA_CSS}\n${adapterCanevasCss(CANEVAS_CSS)}`;
  const sombre = cssSombre(themeCss);
  const styleGabarit = /<style>([\s\S]*?)<\/style>/.exec(GABARIT.texte)?.[1] ?? '';
  const parite = pariteSombre(`${styleGabarit}\n${cssFamilles}\n${cssAnnexes}`, new Set(jetonsDuTheme(themeCss).map(([k]) => k)));
  const champs = {
    LANG: esc(lang), TITRE_DOCUMENT: esc(`${tenant} — ${L.rapport} — ${projet}${refDatee ? ` — ${refDatee}` : ''}`),
    FAVICON: faviconDataUri(data._short_code || tenant, accent), CSS_THEME: themeCss, CSS_SOMBRE: sombre, CSS_FAMILLES: cssFamilles,
    CSS_ANNEXES: cssAnnexes, CSS_PARITE_SOMBRE: parite,
    EN_TETE_SIGLE: esc(data._short_code ?? String(tenant).slice(0, 2)), EN_TETE_TITRE: esc(`${tenant} · ${L.rapport}`),
    EN_TETE_SOUS_TITRE: esc([projet, 'gate 1b', refDatee].filter(Boolean).join(' · ')), LIB_EXPORTER: esc(F.exporter), LIB_BASCULE: esc(F.bascule),
    BLOC_TITRE: blocTitre, BANDEAU_GATE: bandeau, SYNTHESES: syntheses, KPI: kpis, QA: qaHtml, QA_CLASSE: qa.ok ? 'qa-ok' : 'qa-ko', CHEMINS: chemins,
    NAV: `  ${nav}`, VUES: vuesHtml, ECARTS: ecarts, JSON_PLAN: json(planJson), JSON_SELFTEST: json(faits), PIED: pied,
    DONNEES_JS: donneesJs, JS_COHERENCE: coherenceJs(), JS_CANEVAS: CANEVAS_FIT_JS.replace(/<\/script/gi, '<\\/script'),
  };
  // Remplissage en UNE passe : une valeur qui contiendrait elle-même des doubles accolades n'est jamais relue comme un champ.
  const html = GABARIT.texte.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(champs, k) ? champs[k] : m));
  return { html, donnees: D, plan: c.plan, vues: VUES, autotest: qa };
}
