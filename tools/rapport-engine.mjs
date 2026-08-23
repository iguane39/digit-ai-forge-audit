// promesses-verifiees — ce fichier ADHÈRE au contrôle des promesses de commentaire
// (`oracle-promesses`, règle PR1 du pilot) : une classe ou un attribut nommé dans un commentaire
// ici DOIT exister dans le code. Un générateur de page est l'endroit où une promesse de prose coûte
// le plus cher — elle s'y lit comme une garantie de ce que la page contient. Signé le 23/08/2026,
// choix humain « signer tout ce qui est propre dans les forges » ; joué avant signature, zéro constat.
//
// AuditCore — moteur de rendu du rapport d'audit (M5 v1).
// Fonction PURE : (rapport-data, options) → HTML autonome thémé. Aucune E/S ici —
// consommée par build-rapport.mjs (repo) et inlinée dans les kits (standalone).
// v1 : bandeau gate + KPIs, radar par famille (SVG), onglets familles→dimensions
// (matrice de traçabilité, constats triés, plan d'action trié), onglet « Toutes les
// règles » filtrable, reprise applicative, impression. Hors v1 (v1.4) : ERD BDD,
// schéma d'architecture auto-layout.
//
// v1.6 — doctrine « RESTITUTION LISIBLE » (forge-design, REFERENTIEL-RESTITUTION.md,
// campagne TF-0235 volet P4). Le rapport d'audit est de la famille « rapport » : il
// s'adresse à trois lecteurs — le commanditaire (« quel est l'état, que dois-je
// décider ? »), le metteur en œuvre (« que faire, dans quel ordre ? »), l'expert
// (« les verdicts tiennent-ils ? »). Les onglets à plat deviennent des VUES naviguées,
// une question par vue, avec un routeur à ancres : un renvoi vers #D05 ouvre la vue qui
// contient D05 avant d'y défiler — sans quoi la moitié des liens du rapport seraient
// des affordances mortes. Aucun contenu n'est résumé ni supprimé : les blocs changent
// de conteneur, et ce qui est absent des données se déclare au manifeste d'écarts.
import { TABLE_FILTERS_JS } from './table-filters.mjs';

const SEV = { critique: 0, majeur: 1, mineur: 2 };
// Seuil du socle (check_html L4 / composant filtres-tableau G1) : au-delà, un tableau
// se trie et se filtre, ou déclare pourquoi il ne le fait pas.
const SEUIL_FILTRE = 8;
const TAG = { urgent: 0, prio: 1, quick: 2, norm: 3 };
// i18n du moteur (RAF-012) — self-contained : les kits standalone inlinent ce fichier.
const STR = {
  fr: { rapport: "Rapport d'audit", gate: 'Verdict gate', score: 'Score global', instruites: 'dimensions instruites',
    bloquants: 'Bloquants', regles: 'Règles instruites', nc: 'non conformes', familles: 'Scores par famille',
    toutes: 'Toutes les règles', reprise: 'Reprise applicative', schemas: 'Architecture & BDD',
    regle: 'Règle', verdict: 'Verdict', preuve: 'Preuve / motif', remede: 'Remédiation', constats: 'Constats',
    plan: "Plan d'action", action: 'Action', effort: 'Effort', dim: 'Dim.', crit: 'Crit.', sans_regle: 'Aucune règle rattachée à cette dimension.',
    preuves_score: 'Preuves du score', so: 'sans objet', filtrer: 'Filtrer (id, verdict, texte)…', info: 'Information', valeur: 'Valeur', statut: 'Statut',
    erd: 'Schéma physique (ERD)', archi: 'Architecture logique', table: 'Table', colonnes: 'Colonnes', note: 'Remarque',
    // Les mots-clés SQL vivent en <code> : cités, ils sont montrés — nus dans une phrase
    // française, « NULL » est un littéral de langage qui a fuité (socle check_html L11).
    legende_erd: '<code>*</code> = colonne obligatoire (<code>NOT NULL</code>) · <code>[PK]</code>/<code>[UK]</code>/<code>[FK]</code> = clés · 🔒 = donnée personnelle · trait plein = clé étrangère appliquée, pointillé = référence logique.',
    auditeur: 'auditeur', footer: "Rapport auto-portant · « pas de score sans preuve » · généré par AuditCore {v} pour {t} — vérifié par verifier-rapport (gate machine).",
    rem: 'Plan de remédiation', prio: 'Prio', source: 'Source', critere: 'Critère de clôture',
    rem_sans_critere: 'action(s) sans critère de clôture — rapport incomplet',
    rem_intro: "Plan exhaustif et auto-porté : actions des dimensions + règles non conformes. Extractible sans export manuel (verifier-remediation), et projeté en remediation-actions.yaml pour la forge.",
    tests: 'Tests', analyses: 'Analyses techniques', composants: 'Composants',
    type: 'Type', portee: 'Portée', resultat: 'Résultat', couverture: 'Couverture',
    outil: 'Outil', categorie: 'Catégorie', version_utilisee: 'Version utilisée',
    nom: 'Nom', version_resolue: 'Version résolue', version_actuelle: 'Version actuelle',
    reco: 'Reco', perimetre: 'Périmètre', moteur_llm: "Moteur d'audit (LLM)" },
  en: { rapport: 'Audit report', gate: 'Gate verdict', score: 'Overall score', instruites: 'dimensions assessed',
    bloquants: 'Blockers', regles: 'Rules assessed', nc: 'non-compliant', familles: 'Scores by family',
    toutes: 'All rules', reprise: 'Handover to operations', schemas: 'Architecture & DB',
    regle: 'Rule', verdict: 'Verdict', preuve: 'Evidence / reason', remede: 'Remediation', constats: 'Findings',
    plan: 'Action plan', action: 'Action', effort: 'Effort', dim: 'Dim.', crit: 'Crit.', sans_regle: 'No rule attached to this dimension.',
    preuves_score: 'Score evidence', so: 'not applicable', filtrer: 'Filter (id, verdict, text)…', info: 'Item', valeur: 'Value', statut: 'Status',
    erd: 'Physical schema (ERD)', archi: 'Logical architecture', table: 'Table', colonnes: 'Columns', note: 'Remark',
    legende_erd: '<code>*</code> = mandatory column (<code>NOT NULL</code>) · <code>[PK]</code>/<code>[UK]</code>/<code>[FK]</code> = keys · 🔒 = personal data · solid = enforced foreign key, dashed = logical reference.',
    auditeur: 'auditor', footer: 'Self-contained report · "no score without evidence" · generated by AuditCore {v} for {t} — checked by verifier-rapport (machine gate).',
    rem: 'Remediation plan', prio: 'Prio', source: 'Source', critere: 'Closure criterion',
    rem_sans_critere: 'action(s) without a closure criterion — incomplete report',
    rem_intro: 'Exhaustive, self-carried plan: dimension actions + non-compliant rules. Extractable without manual export (verifier-remediation), and projected to remediation-actions.yaml for the forge.',
    tests: 'Tests', analyses: 'Technical analyses', composants: 'Components',
    type: 'Type', portee: 'Scope', resultat: 'Result', couverture: 'Coverage',
    outil: 'Tool', categorie: 'Category', version_utilisee: 'Version used',
    nom: 'Name', version_resolue: 'Resolved version', version_actuelle: 'Current version',
    reco: 'Reco', perimetre: 'Scope', moteur_llm: 'Audit engine (LLM)' },
};
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CRIT_CLASS = { Fatal: 'fatal', Bloquant: 'bloq', Majeur: 'maj', Standard: 'std' };

// ─────────────────────────────────────────────────────────────────────────────
// Textes de la doctrine « restitution lisible ». Ils ne décrivent JAMAIS une donnée
// que le rapport n'a pas : les repères de lecture et le manifeste d'écarts sont des
// fonctions des chiffres réellement calculés, jamais des phrases figées.
// ─────────────────────────────────────────────────────────────────────────────
const RES = {
  fr: {
    sommaire: 'Sommaire — une question par vue',
    apprend: 'Ce que cette vue vous apprend',
    commencer: 'Par où commencer, selon qui vous êtes',
    ecarts_t: "Ce que ce rapport ne dit pas — manifeste d'écarts",
    aller_famille: 'Aller directement à une famille de dimensions',
    v: {
      synthese: ['Synthèse', "l'état du périmètre, ce qui bloque, par où commencer"],
      plan: ["Plan d'action", "les actions de remédiation, dans l'ordre de priorité"],
      dimensions: ['Constats par dimension', 'score, preuves, règles et constats, dimension par dimension'],
      regles: ['Toutes les règles', 'le référentiel instruit, règle par règle, filtrable'],
      schemas: ['Architecture & BDD', "les schémas d'architecture et de base de données relevés"],
      donnees: ['Données analysées', 'tests, outillage exécuté, composants et reprise applicative'],
      methode: ['Méthode & lecture', 'barèmes, légendes, provenance et limites de ce rapport'],
    },
    o: {
      synthese: "Ce que cette vue vous apprend : le verdict de porte, les chiffres qui le fondent, et le chemin de lecture qui correspond à votre rôle.",
      plan: "Ce que cette vue vous apprend : les actions de remédiation consolidées — dimensions et règles non conformes réunies —, triées par priorité, chacune avec son critère de clôture.",
      dimensions: "Ce que cette vue vous apprend : pour chaque dimension auditée, son score, les preuves qui le fondent, les règles instruites, les constats et les actions qui en découlent.",
      regles: "Ce que cette vue vous apprend : la traçabilité complète du référentiel — chaque règle instruite, son verdict, sa criticité et la preuve sur laquelle le verdict s'appuie.",
      schemas: "Ce que cette vue vous apprend : l'architecture logique et le schéma physique de la base relevés pendant l'audit, avec le dictionnaire des tables et les données personnelles repérées.",
      donnees: "Ce que cette vue vous apprend : la matière factuelle de l'audit — tests joués, outillage exécuté avec sa version, composants versionnés, et état de la reprise applicative.",
      methode: "Ce que cette vue vous apprend : comment ce rapport juge — barèmes des scores, définitions des verdicts et des priorités — et ce qu'il ne peut pas dire.",
    },
    q_radar: 'Comment la maturité se répartit-elle entre les familles de dimensions ?',
    radar_sous: 'Moyenne des scores des dimensions instruites de chaque famille, sur 5.',
    q_verdicts: 'Comment les règles instruites se répartissent-elles par verdict ?',
    kpi: {
      score: ['Score global', 'Moyenne des scores des dimensions instruites, sur une échelle de 0 à 5.',
        (n, tot) => `${n} dimension(s) instruite(s) sur ${tot} du référentiel — barème des crans en vue Méthode & lecture.`],
      bloquants: ['Bloquants', 'Dimensions au score inférieur ou égal à 2, ou de criticité Fatal.',
        (n, ids) => (n ? `Dimensions concernées : ${ids} — chacune ouvre une action au plan.` : 'Aucune dimension bloquante : le verdict de porte ne tient qu\'aux règles instruites.')],
      regles: ['Règles instruites', 'Règles du référentiel effectivement instruites sur ce périmètre.',
        (nc, part, so) => `${nc} non conforme(s), ${part} partielle(s), ${so} sans objet motivé — le reste est conforme.`],
      plan: ['Actions de remédiation', 'Actions consolidées : plans des dimensions et règles non conformes réunis.',
        (u, p) => `${u} urgente(s) et ${p} prioritaire(s) en tête de file — l'ordre de traitement est celui de la vue Plan d'action.`],
    },
    a: {
      dimensions: '→ Le détail par dimension',
      regles: '→ La traçabilité des règles',
      plan: "→ Le plan d'action complet",
      methode: '→ La méthode et les barèmes',
    },
    chemins: [
      ['Commanditaire', "Restez sur cette vue : le verdict, les quatre chiffres et leurs repères suffisent à décider. Passez ensuite au "],
      ['Metteur en œuvre', 'Allez au '],
      ['Expert du domaine', 'Commencez par '],
    ],
    t: {
      gate: 'Verdict de la porte 1b pour ce périmètre — définition et calcul en vue Méthode & lecture.',
      score: 'Score de maturité de la dimension, de 0 à 5 — barème détaillé en vue Méthode & lecture.',
      criticite: "Criticité de la dimension au sens du référentiel — définition en vue Méthode & lecture.",
      gate1b: 'Verdict de porte porté par cette dimension — définition en vue Méthode & lecture.',
      verdict: 'Verdict de la règle : conforme, partiel, non conforme ou sans objet — définitions en vue Méthode & lecture.',
      priorite: "Priorité de traitement de l'action — définition des quatre crans en vue Méthode & lecture.",
      severite: 'Sévérité du constat — définition des crans en vue Méthode & lecture.',
      statut: 'État de la reprise applicative pour cet élément — définition en vue Méthode & lecture.',
      sans_objet: 'Dimension hors périmètre ou non instruite : elle ne pèse pas dans le score global.',
    },
    leg: {
      mesures: 'Les valeurs chiffrées des tableaux de ce rapport sont reprises telles que produites par la source : « cas passés / cas total » pour un test, pourcentage pour une couverture, version littérale pour un composant. Aucune n\'est recalculée par le rendu.',
      score: 'Score de maturité par dimension, de 0 (rien en place) à 5 (industrialisé et contrôlé). Le score global est la moyenne arithmétique des seules dimensions instruites : une dimension sans objet ne pèse ni en bien ni en mal.',
      gate: "Verdict de porte 1b : GO si aucune dimension bloquante ; GO SOUS RÉSERVE si au moins une dimension est bloquante ou en réserve ; NO-GO si une dimension rend un verdict nogo, ou si cinq dimensions ou plus sont bloquantes.",
      verdicts: "Verdicts d'une règle : conforme (la preuve établit le respect), partiel (respect incomplet, preuve partielle), non conforme (la preuve établit l'écart), sans objet (la règle ne s'applique pas au périmètre, motif obligatoire), à évaluer (non instruite).",
      priorites: "Priorités du plan : urgent (à traiter avant mise en production), prio (avant la prochaine version), quick (gain rapide à effort faible), norm (fond de file). Elles sont dérivées de la criticité de la source, jamais saisies à la main.",
      criticites: 'Criticités du référentiel, du plus grave au moins grave : Fatal, Bloquant, Majeur, Standard. Une règle opposable de criticité Fatal ou Bloquant fait basculer la porte.',
      preuve: "Règle d'or de la méthode : pas de score sans preuve. Chaque score de dimension cite les éléments constatés qui le fondent ; chaque règle non conforme cite la preuve de l'écart et le critère qui clôturera sa remédiation.",
    },
    ex: {
      regles: (id, v) => `Lecture d'une ligne : la règle ${id} rend le verdict « ${v} » ; la colonne Preuve dit sur quoi ce verdict s'appuie, et la colonne Dim. rattache la règle à sa dimension.`,
      plan: (id) => `Lecture d'une ligne : l'action ${id} porte sa priorité de traitement, sa source (dimension ou règle) et le critère de clôture qui permettra de la déclarer faite, preuve à l'appui.`,
      donnees: 'Lecture d\'une ligne : chaque entrée nomme ce qui a été exécuté ou relevé, et la valeur constatée — aucune ligne n\'est une intention, seulement un fait.',
      dim: 'Lecture d\'une ligne : la règle, son verdict, la preuve qui le fonde, puis la remédiation possible si un écart est constaté.',
      erd: 'Lecture d\'une ligne : la table, son nombre de colonnes, les colonnes porteuses de données personnelles, puis la note de contexte.',
    },
    ec: {
      aucun: "Aucun écart déclaré : les règles RL-1 à RL-10 du référentiel de restitution sont tenues sur les données de cette mission.",
      schemas: "Architecture logique et schéma de base de données absents des données d'audit : la vue correspondante n'existe pas plutôt que d'afficher un cadre vide.",
      donnees: "Aucun test, outillage ni composant déclaré dans les données d'audit : la vue « Données analysées » n'existe pas.",
      constats: "Aucun constat détaillé fourni : les dimensions n'affichent que leur score, leurs preuves et leurs règles.",
      constats_orphelins: (n, titres) => `${n} constat(s) rattaché(s) à aucune dimension du référentiel (${titres}) : ils ne s'affichent nulle part dans le rapport — corriger le champ « dimension » des données d'audit.`,
      syntheses: "Aucune synthèse rédigée transmise avec les données : la vue Synthèse s'en tient aux chiffres calculés.",
      plan_incomplet: (n) => `${n} action(s) de remédiation sans critère de clôture rédigé : le rapport est incomplet sur ce point et le gate de rendu le refuse.`,
      non_rattachees: (n, ids) => `${n} action(s) sans dimension de rattachement (${ids}) : visibles au plan, elles sortent du contrat YAML de la forge.`,
      reprise: "Aucun élément de reprise applicative déclaré : la passation vers l'exploitation n'est pas instruite par ce rapport.",
      figures: "Une seule figure dans ce rapport : le moteur ne trace que ce dont il a la donnée chiffrée, il ne fabrique pas de graphique d'illustration.",
      radar: "Le radar par famille superpose par construction ses polygones de graduation : l'oracle visuel du socle les compte comme des chevauchements. Écart connu et assumé — le tracé est volontaire, et chaque valeur est aussi lisible en clair sur les étiquettes du radar.",
    },
    exempt_syntheses: 'synthèse rédigée à deux colonnes, lue en place et non parcourue',
    cherche: 'Rechercher dans ce tableau…',
    lignes: 'lignes affichées',
    provenance: 'Provenance et traçabilité',
  },
  en: {
    sommaire: 'Contents — one question per view',
    apprend: 'What this view tells you',
    commencer: 'Where to start, depending on who you are',
    ecarts_t: "What this report does not say — gap manifest",
    aller_famille: 'Jump to a family of dimensions',
    v: {
      synthese: ['Summary', 'the state of the scope, what blocks, where to start'],
      plan: ['Action plan', 'remediation actions, in order of priority'],
      dimensions: ['Findings by dimension', 'score, evidence, rules and findings, dimension by dimension'],
      regles: ['All rules', 'the assessed baseline, rule by rule, filterable'],
      schemas: ['Architecture & DB', 'the architecture and database schemas recorded'],
      donnees: ['Analysed data', 'tests, executed tooling, components and handover'],
      methode: ['Method & reading', 'scales, legends, provenance and limits of this report'],
    },
    o: {
      synthese: 'What this view tells you: the gate verdict, the figures behind it, and the reading path that matches your role.',
      plan: 'What this view tells you: the consolidated remediation actions — dimension plans and non-compliant rules together — sorted by priority, each with its closure criterion.',
      dimensions: 'What this view tells you: for every assessed dimension, its score, the evidence behind it, the rules assessed, the findings and the resulting actions.',
      regles: 'What this view tells you: the full traceability of the baseline — every rule assessed, its verdict, its criticality and the evidence the verdict rests on.',
      schemas: 'What this view tells you: the logical architecture and the physical database schema recorded during the audit, with the table dictionary and the personal data spotted.',
      donnees: 'What this view tells you: the factual material of the audit — tests run, tooling executed with its version, versioned components, and the state of the handover.',
      methode: 'What this view tells you: how this report judges — score scales, verdict and priority definitions — and what it cannot say.',
    },
    q_radar: 'How is maturity spread across the families of dimensions?',
    radar_sous: 'Average score of the assessed dimensions of each family, out of 5.',
    q_verdicts: 'How do the assessed rules break down by verdict?',
    kpi: {
      score: ['Overall score', 'Average of the scores of the assessed dimensions, on a 0 to 5 scale.',
        (n, tot) => `${n} dimension(s) assessed out of ${tot} in the baseline — scale of the steps in the Method & reading view.`],
      bloquants: ['Blockers', 'Dimensions scoring 2 or below, or of Fatal criticality.',
        (n, ids) => (n ? `Dimensions concerned: ${ids} — each opens an action in the plan.` : 'No blocking dimension: the gate verdict rests only on the assessed rules.')],
      regles: ['Rules assessed', 'Baseline rules actually assessed on this scope.',
        (nc, part, so) => `${nc} non-compliant, ${part} partial, ${so} not applicable with a reason — the rest are compliant.`],
      plan: ['Remediation actions', 'Consolidated actions: dimension plans and non-compliant rules together.',
        (u, p) => `${u} urgent and ${p} high priority at the head of the queue — the processing order is the one of the Action plan view.`],
    },
    a: {
      dimensions: '→ The detail by dimension',
      regles: '→ The rule traceability',
      plan: '→ The full action plan',
      methode: '→ The method and the scales',
    },
    chemins: [
      ['Sponsor', 'Stay on this view: the verdict, the four figures and their reading cues are enough to decide. Then move on to '],
      ['Implementer', 'Go to '],
      ['Domain expert', 'Start with '],
    ],
    t: {
      gate: 'Gate verdict for this scope — definition and computation in the Method & reading view.',
      score: 'Maturity score of the dimension, from 0 to 5 — detailed scale in the Method & reading view.',
      criticite: 'Criticality of the dimension in the baseline — definition in the Method & reading view.',
      gate1b: 'Gate verdict carried by this dimension — definition in the Method & reading view.',
      verdict: 'Verdict of the rule: compliant, partial, non-compliant or not applicable — definitions in the Method & reading view.',
      priorite: 'Processing priority of the action — definition of the four steps in the Method & reading view.',
      severite: 'Severity of the finding — definition of the steps in the Method & reading view.',
      statut: 'State of the handover for this item — definition in the Method & reading view.',
      sans_objet: 'Dimension out of scope or not assessed: it does not weigh in the overall score.',
    },
    leg: {
      mesures: 'The figures in the tables of this report are reproduced exactly as produced by the source: "cases passed / total cases" for a test, a percentage for coverage, the literal version for a component. None is recomputed by the renderer.',
      score: 'Maturity score per dimension, from 0 (nothing in place) to 5 (industrialised and controlled). The overall score is the arithmetic mean of the assessed dimensions only: a dimension marked not applicable weighs neither way.',
      gate: 'Gate verdict: GO when no dimension blocks; GO WITH RESERVATIONS when at least one dimension blocks or is reserved; NO-GO when a dimension returns a nogo verdict, or when five dimensions or more block.',
      verdicts: 'Verdicts of a rule: compliant (evidence establishes conformity), partial (incomplete conformity, partial evidence), non-compliant (evidence establishes the gap), not applicable (the rule does not apply to the scope, reason mandatory), to assess (not instructed).',
      priorites: 'Priorities of the plan: urgent (before going to production), prio (before the next release), quick (fast win at low effort), norm (back of the queue). They derive from the criticality of the source, never typed by hand.',
      criticites: 'Criticalities of the baseline, from the most to the least severe: Fatal, Blocking, Major, Standard. A binding rule of Fatal or Blocking criticality flips the gate.',
      preuve: 'Golden rule of the method: no score without evidence. Every dimension score cites the observed items behind it; every non-compliant rule cites the evidence of the gap and the criterion that will close its remediation.',
    },
    ex: {
      regles: (id, v) => `Reading a row: rule ${id} returns the verdict "${v}"; the Evidence column says what the verdict rests on, and the Dim. column ties the rule to its dimension.`,
      plan: (id) => `Reading a row: action ${id} carries its processing priority, its source (dimension or rule) and the closure criterion that will let it be declared done, with evidence.`,
      donnees: 'Reading a row: every entry names what was executed or recorded, and the value observed — no row is an intention, only a fact.',
      dim: 'Reading a row: the rule, its verdict, the evidence behind it, then the possible remediation when a gap is observed.',
      erd: 'Reading a row: the table, its number of columns, the columns carrying personal data, then the context note.',
    },
    ec: {
      aucun: 'No gap declared: rules RL-1 to RL-10 of the restitution baseline are met on the data of this engagement.',
      schemas: 'Logical architecture and database schema absent from the audit data: the matching view does not exist rather than showing an empty frame.',
      donnees: 'No test, tooling or component declared in the audit data: the "Analysed data" view does not exist.',
      constats: 'No detailed finding provided: dimensions only show their score, their evidence and their rules.',
      constats_orphelins: (n, titres) => `${n} finding(s) attached to no dimension of the baseline (${titres}): they appear nowhere in the report — fix the "dimension" field of the audit data.`,
      syntheses: 'No written summary supplied with the data: the Summary view sticks to the computed figures.',
      plan_incomplet: (n) => `${n} remediation action(s) without a written closure criterion: the report is incomplete on this point and the rendering gate rejects it.`,
      non_rattachees: (n, ids) => `${n} action(s) without an attached dimension (${ids}): visible in the plan, they fall out of the forge YAML contract.`,
      reprise: 'No handover item declared: the transfer to operations is not assessed by this report.',
      figures: 'A single figure in this report: the engine only draws what it has figures for, it does not manufacture illustrative charts.',
      radar: 'The family radar overlays its grid polygons by construction: the visual oracle of the base counts them as overlaps. A known and accepted gap — the drawing is deliberate, and every value is also readable in plain text on the radar labels.',
    },
    exempt_syntheses: 'written two-column summary, read in place and not browsed',
    cherche: 'Search this table…',
    lignes: 'rows shown',
    provenance: 'Provenance and traceability',
  },
};

// ── Tableau de données : au-delà du seuil du socle, il porte le câblage du composant
// « filtres de colonne » (id + thead + compteur aria-live + réaffichage à l'impression),
// ou une exemption MOTIVÉE. Sans motif ce n'est pas une exemption, c'est un oubli.
// `aria-describedby` du groupe : la légende de lecture des valeurs chiffrées vit une
// seule fois, en vue Méthode (règle RL-7), et couvre toutes les cellules du tableau.
function tableau({ id, thead, tbody, lignes, exemption = '', recherche = '', L }) {
  const long = lignes >= SEUIL_FILTRE;
  const attrs = !long ? ''
    : exemption ? ` data-filterable="off" data-filterable-reason="${esc(exemption)}"`
      : ' data-filterable';
  const outils = (long && !exemption)
    ? `<div class="t-outils">${recherche
      ? `<input type="search" id="${id}-q" aria-label="${esc(recherche)}" placeholder="${esc(recherche)}" oninput="filtreTableau('${id}-q','${id}')">`
      : ''}<span class="tf-count" data-tf-count-for="${id}" aria-live="polite">${lignes} ${L.lignes}</span></div>`
    : '';
  return `${outils}<table id="${id}"${attrs} aria-describedby="leg-mesures"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

/** Badge : une valeur mise en avant porte toujours sa légende (socle check_html L3). */
const badge = (cls, texte, titre) =>
  `<span class="badge${cls ? ' ' + cls : ''}" title="${esc(titre)}">${esc(texte)}</span>`;

// ── M5 v1.5 · ERD : data.db_schema = { bandes:[{key,label}], tables:[{id,bande,label,
//    columns:[{n,t,k(PK|UK|FK),nn,pii,note}]}], relations:[{from,to,enforced,label}] }
function renderERD(db, L = STR.fr, T = RES.fr) {
  if (!db?.tables?.length) return '';
  const bandes = db.bandes?.length ? db.bandes : [{ key: '_', label: '' }];
  const COLW = 250, GAPX = 60, ROWH = 15, HEADH = 26, GAPY = 26;
  const pos = {}; let maxY = 0;
  bandes.forEach((b, bi) => {
    let y = 34;
    for (const t of db.tables.filter(t => (t.bande ?? '_') === b.key)) {
      const h = HEADH + (t.columns?.length ?? 0) * ROWH + 8;
      pos[t.id] = { x: 20 + bi * (COLW + GAPX), y, w: COLW, h };
      y += h + GAPY;
    }
    maxY = Math.max(maxY, y);
  });
  const W = 20 + bandes.length * (COLW + GAPX), H = maxY + 10;
  const tbl = (t) => {
    const p = pos[t.id];
    return `<g class="erd-t"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="6"/>
      <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${HEADH - 6}" rx="6" class="erd-h"/>
      <text x="${p.x + p.w / 2}" y="${p.y + 14}" text-anchor="middle" class="erd-tt">${esc(t.label ?? t.id)}</text>
      ${(t.columns ?? []).map((c, i) => `<text x="${p.x + 10}" y="${p.y + HEADH + 6 + i * ROWH}" class="erd-c${c.pii ? ' pii' : ''}">${c.k ? `[${esc(c.k)}] ` : ''}${esc(c.n)}${c.nn ? ' *' : ''}${c.pii ? ' 🔒' : ''}</text>
       <text x="${p.x + p.w - 10}" y="${p.y + HEADH + 6 + i * ROWH}" text-anchor="end" class="erd-ty">${esc(c.t ?? '')}</text>`).join('')}</g>`;
  };
  const rel = (r) => {
    const a = pos[String(r.from).split('.')[0]], b = pos[String(r.to).split('.')[0]];
    if (!a || !b) return '';
    const x1 = a.x + a.w, y1 = a.y + 13, x2 = b.x, y2 = b.y + 13;
    const mid = x2 > x1 ? (x1 + x2) / 2 : x1 + 24;
    return `<path d="M ${x1} ${y1} L ${mid} ${y1} L ${mid} ${y2} L ${x2} ${y2}" class="erd-r${r.enforced === false ? ' soft' : ''}" marker-end="url(#erdArr)"><title>${esc(r.from)} → ${esc(r.to)}${r.enforced === false ? ' (référence logique)' : ' (FK)'}</title></path>`;
  };
  const dict = db.tables.map(t => `<tr><td><b>${esc(t.label ?? t.id)}</b></td><td>${(t.columns ?? []).length}</td>
    <td>${(t.columns ?? []).filter(c => c.pii).map(c => `<code>${esc(c.n)}</code>`).join(' ') || '—'}</td>
    <td class="muted">${esc(t.note ?? '')}</td></tr>`).join('');
  return `<h3>${L.erd}</h3>
  <div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W, 1200)}px" role="img" aria-label="Schéma de base de données">
    <defs><marker id="erdArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>
    ${bandes.map((b, bi) => b.label ? `<text x="${20 + bi * (COLW + GAPX)}" y="18" class="erd-band">${esc(b.label)}</text>` : '').join('')}
    ${(db.relations ?? []).map(rel).join('')}${db.tables.map(tbl).join('')}
  </svg></div>
  ${db.tables.length >= SEUIL_FILTRE ? `<p class="exemple-lecture muted small">${esc(T.ex.erd)}</p>` : ''}
  ${tableau({ id: 't-__erd', lignes: db.tables.length, L: T, recherche: T.cherche,
    thead: `<tr><th>${L.table}</th><th>${L.colonnes}</th><th>PII 🔒</th><th>${L.note}</th></tr>`, tbody: dict })}
  <p class="muted small">${L.legende_erd}</p>`;
}

// ── M5 v1.5 · Schéma d'architecture : data.architecture = { bandes:[{key,label}],
//    nodes:[{id,bande,label,sub,style}], edges:[{from,to,style,label}] } — auto-layout barycentre.
function renderArchi(arch, L = STR.fr) {
  if (!arch?.nodes?.length) return '';
  const bandes = arch.bandes?.length ? arch.bandes : [{ key: '_', label: '' }];
  const NW = 180, NH = 56, GX = 34, BH = 120, W = 1240;
  const byBande = bandes.map(b => arch.nodes.filter(n => (n.bande ?? '_') === b.key));
  const pos = {};
  byBande.forEach((nodes, bi) => {
    // barycentre : ordonner selon la position moyenne des voisins de la bande précédente
    if (bi > 0) {
      const score = (n) => {
        const nb = (arch.edges ?? []).filter(e => e.to === n.id || e.from === n.id)
          .map(e => pos[e.to === n.id ? e.from : e.to]).filter(Boolean);
        return nb.length ? nb.reduce((s, p) => s + p.x, 0) / nb.length : W / 2;
      };
      nodes.sort((a, b) => score(a) - score(b));
    }
    const total = nodes.length * NW + (nodes.length - 1) * GX;
    let x = Math.max(20, (W - total) / 2);
    for (const n of nodes) { pos[n.id] = { x, y: 40 + bi * BH, w: NW, h: NH }; x += NW + GX; }
  });
  const H = 40 + bandes.length * BH;
  const STYLE = { purple: 'a-purple', blue: 'a-blue', teal: 'a-teal', coral: 'a-coral', amber: 'a-amber', gray: 'a-gray' };
  const node = (n) => {
    const p = pos[n.id];
    return `<g class="${STYLE[n.style] ?? 'a-gray'}"><title>${esc(n.tip ?? n.label)}</title>
      <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="8"/>
      <text x="${p.x + p.w / 2}" y="${p.y + 24}" text-anchor="middle" class="a-t">${esc(n.label)}</text>
      <text x="${p.x + p.w / 2}" y="${p.y + 42}" text-anchor="middle" class="a-s">${esc(n.sub ?? '')}</text></g>`;
  };
  const edge = (e) => {
    const a = pos[e.from], b = pos[e.to];
    if (!a || !b) return '';
    const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y;
    const d = y2 > y1
      ? (Math.abs(x1 - x2) < 8 ? `M ${x1} ${y1} L ${x2} ${y2}` : `M ${x1} ${y1} L ${x1} ${(y1 + y2) / 2} L ${x2} ${(y1 + y2) / 2} L ${x2} ${y2}`)
      : `M ${a.x + a.w} ${a.y + a.h / 2} L ${b.x} ${b.y + b.h / 2}`;
    return `<path d="${d}" class="a-e${e.style === 'dashed' ? ' dashed' : ''}${e.style === 'coral' ? ' coral' : ''}" marker-end="url(#aArr)">${e.label ? `<title>${esc(e.label)}</title>` : ''}</path>`;
  };
  return `<h3>${L.archi}</h3>
  <div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" style="min-width:900px" role="img" aria-label="Schéma d'architecture">
    <defs><marker id="aArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#475569"/></marker></defs>
    ${bandes.map((b, bi) => `<text x="16" y="${34 + bi * BH}" class="erd-band">${esc(b.label)}</text>`).join('')}
    ${(arch.edges ?? []).map(edge).join('')}${arch.nodes.map(node).join('')}
  </svg></div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ECR-04/05 — PLAN DE REMÉDIATION consolidé, calculé UNE fois et servi sous trois
// formes : la vue lisible, le bloc JSON embarqué (le rapport est auto-porteur —
// le projet n'a aucun export à demander), et le YAML latéral consommé par la forge.
// Une seule source de calcul : les trois formes ne peuvent pas diverger.
//
// Le critère de clôture n'est JAMAIS inventé. Absent des données, il sort en
// placeholder — le rapport est alors incomplet et le gate de rendu le refuse.
// ─────────────────────────────────────────────────────────────────────────────
const PRIO_OF_SEV = { critique: 'urgent', Fatal: 'urgent', majeur: 'prio', Bloquant: 'prio', Majeur: 'prio', mineur: 'norm', Standard: 'norm' };
const SEV_OF_VERDICT = { non_conforme: 'Bloquant', partiel: 'Majeur' };
const CRITERE_ABSENT = '{{CRITERE_DE_CLOTURE}}';

/** Dimension d'une règle : métadonnée bakée par la fusion, sinon déduite de l'identifiant. */
const dimOfRule = (r, index = {}) => {
  const d = (index[r.id]?.dimension_audit ?? r.dimension_audit ?? '').split(' ')[0];
  return /^D(0\d|1[0-6])$/.test(d) ? d : (r.id.match(/\bD(0\d|1[0-6])\b/)?.[0] ?? null);
};

export function buildPlan(data) {
  const index = data._constraints_index ?? {};
  const brut = [];
  // 1 · plan d'action des dimensions
  (data.actions ?? []).forEach((a, i) => {
    brut.push({
      dim: /^D(0\d|1[0-6])$/.test(a.dimension ?? '') ? a.dimension : null,
      id_force: a.id ?? null,
      action: [a.titre, a.desc].filter(Boolean).join(' — '),
      titre: a.titre ?? `Action ${i + 1}`,
      priorite: a.tag ?? 'norm',
      effort: a.effort ?? '—',
      severite: a.severite ?? 'Standard',
      source: a.dimension ?? '—', source_type: 'dimension',
      verification: a.verification ?? CRITERE_ABSENT,
      activation: a.activation ?? null,
    });
  });
  // 2 · règles non conformes ou partielles — jamais écartées silencieusement
  (data.regles ?? []).filter(r => r.verdict === 'non_conforme' || r.verdict === 'partiel').forEach(r => {
    brut.push({
      dim: dimOfRule(r, index),
      id_force: null,
      action: r.possible ?? r.remediation ?? `Mettre en conformité ${r.id}`,
      titre: r.possible ?? r.remediation ?? `Conformité ${r.id}`,
      priorite: PRIO_OF_SEV[r.criticite ?? index[r.id]?.criticite] ?? (r.verdict === 'non_conforme' ? 'prio' : 'norm'),
      effort: r.effort ?? '—',
      severite: r.criticite ?? index[r.id]?.criticite ?? SEV_OF_VERDICT[r.verdict] ?? 'Standard',
      source: r.id, source_type: 'regle',
      verification: r.verification_cloture ?? CRITERE_ABSENT,
      activation: r.activation ?? null,
    });
  });
  // Identifiants stables au format du contrat forge : REM-D<nn>-<nnn>, séquence par dimension.
  // Une action dont la dimension est indéterminable garde un id explicite « non rattaché » :
  // elle reste VISIBLE au plan (jamais écartée), et sort du YAML avec une trace (cf. planToActions).
  const seq = {};
  const plan = brut.map(b => {
    let id = b.id_force;
    if (!id) {
      if (b.dim) { seq[b.dim] = (seq[b.dim] ?? 0) + 1; id = `${b.dim}-${String(seq[b.dim]).padStart(3, '0')}`; id = `REM-${id}`; }
      else id = `REM-NR-${b.source}`;
    }
    const { dim, id_force, ...reste } = b;
    return { id, dimension: dim, ...reste };
  });
  const ordre = { urgent: 0, prio: 1, quick: 2, norm: 3 };
  return plan.sort((a, b) => (ordre[a.priorite] ?? 9) - (ordre[b.priorite] ?? 9));
}

/** Projection du plan vers le contrat `remediation-actions.schema.json` (entrée de la forge). */
export function planToActions(plan, data, coreVersion) {
  const SEV_OK = new Set(['Fatal', 'Bloquant', 'Majeur', 'Standard']);
  const PRIO_OK = new Set(['urgent', 'prio', 'quick', 'norm']);
  // Le contrat forge impose un identifiant rattaché à une dimension. Une action non rattachée
  // n'est pas silencieusement supprimée : elle est exclue du YAML et RENDUE dans `non_projete`,
  // pour que l'écart se voie au lieu de se perdre (garde-fou « pas de troncature muette »).
  const projetables = plan.filter(a => /^REM-D(0\d|1[0-6])-\d{3}$/.test(a.id));
  const nonProjetees = plan.filter(a => !projetables.includes(a));
  const doc = {
    audit_ref: `${data.projet?.nom ?? data.titre ?? 'audit'} — ${data.date ?? ''}${data.indice ?? ''}`.trim(),
    core_version: String(coreVersion || '0.0.0'),
    project: { repo: data.projet?.repo ?? 'non renseigné', stack_profile: data.projet?.stack_profile ?? 'none' },
    actions: projetables.map(a => ({
      id: a.id,
      title: a.titre.slice(0, 120),
      control_ref: a.source_type === 'regle' ? a.source : `dimension:${a.source}`,
      severity: SEV_OK.has(a.severite) ? a.severite : 'Standard',
      priority: PRIO_OK.has(a.priorite) ? a.priorite : 'norm',
      ...(a.effort && a.effort !== '—' ? { effort: a.effort } : {}),
      // Règle d'honnêteté (PLAN/06 §5) : une activation non déclarée n'est JAMAIS
      // présumée automatisable — elle retombe en manuel avec un propriétaire à désigner.
      activation: a.activation ?? {
        mode: 'manual',
        reason: "mode d'activation non déclaré par le rapport d'audit — à qualifier avant bascule forge",
        owner_role: 'à désigner',
      },
      verification: { evidence_expected: a.verification },
      // La forge consomme des stories : toute action activable en forge doit en porter une,
      // dont le critère d'acceptation EST le critère de clôture (jamais deux vérités).
      ...(a.activation && a.activation.mode !== 'manual' ? {
        story: {
          epic: `Dimension ${a.dimension ?? a.source}`,
          title: a.titre.slice(0, 120),
          acceptance: [a.verification],
        },
      } : {}),
    })),
  };
  return { doc, nonProjetees };
}

export function renderRapport(data, { tenant, dimensions, families, themeCss = '', coreVersion = '', lang = 'fr' } = {}) {
  const L = STR[lang] ?? STR.fr;
  const T = RES[lang] ?? RES.fr;
  const dims = dimensions ?? [];
  const famList = families ?? [...new Set(dims.map(d => d.family))].map(k => ({ key: k, label: k }));
  const byId = Object.fromEntries((data.dimensions ?? []).map(d => [d.id, d]));
  const scored = dims.map(d => ({ ...d, ...byId[d.id] })).filter(d => byId[d.id]);
  const applicable = scored.filter(d => d.applicability !== 'off' && d.score !== undefined);

  const scoreGlobal = applicable.length
    ? (applicable.reduce((s, d) => s + d.score, 0) / applicable.length).toFixed(1) : '—';
  const bloquants = scored.filter(d => d.score <= 2 || d.criticite === 'Fatal' || d.criticality === 'fatal');
  const gate = data.gate?.verdict
    ?? (scored.some(d => d.gate1b === 'nogo') || bloquants.length >= 5 ? 'NO-GO'
      : scored.some(d => d.gate1b === 'reserve') || bloquants.length ? 'GO SOUS RÉSERVE' : 'GO');
  const gateClass = gate === 'GO' ? 'std' : gate === 'NO-GO' ? 'fatal' : 'maj';

  // index des règles (métadonnées bakées depuis la fusion : dimension, criticité, bucket…)
  const meta = data._constraints_index ?? {};
  const regles = (data.regles ?? []).map(r => ({ ...meta[r.id], ...r, id: r.id }));
  const dimOfRegle = (r) => r.dimension_audit?.split(' ')[0] ?? (r.id.match(/CTL-(D\d\d)/)?.[1] ?? '—');
  const cptVerdict = (v) => regles.filter(r => r.verdict === v).length;
  const nbConf = cptVerdict('conforme'), nbPartiel = cptVerdict('partiel');
  const nbNC = cptVerdict('non_conforme'), nbSO = cptVerdict('sans_objet');
  const nbAutres = regles.length - (nbConf + nbPartiel + nbNC + nbSO);
  const projet = data.projet?.nom ?? data.titre ?? '';

  // ── ECR-05 · plan de remédiation consolidé, calculé UNE fois et servi à toutes les vues
  const plan = buildPlan(data);
  const planIncomplet = plan.filter(a => /\{\{/.test(`${a.action} ${a.verification}`));
  const nonRattachees = plan.filter(a => !/^REM-D(0\d|1[0-6])-\d{3}$/.test(a.id));
  const urgentes = plan.filter(a => a.priorite === 'urgent').length;
  const prioritaires = plan.filter(a => a.priorite === 'prio').length;

  // ── radar par famille (SVG hexagone)
  const famAvg = famList.map(f => {
    const ds = applicable.filter(d => d.family === f.key);
    return { ...f, avg: ds.length ? ds.reduce((s, d) => s + d.score, 0) / ds.length : 0 };
  });
  const R = 110, CX = 150, CY = 140;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / famAvg.length;
    return `${(CX + Math.cos(a) * R * (v / 5)).toFixed(1)},${(CY + Math.sin(a) * R * (v / 5)).toFixed(1)}`;
  };
  const radar = `<svg viewBox="0 0 460 290" class="radar" role="img" aria-label="${esc(L.familles)}">
    ${[1, 2, 3, 4, 5].map(v => `<polygon points="${famAvg.map((_, i) => pt(i, v)).join(' ')}" fill="none" stroke="var(--line)" stroke-width="${v === 5 ? 1.2 : 0.6}"/>`).join('')}
    <polygon points="${famAvg.map((f, i) => pt(i, f.avg)).join(' ')}" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="2"/>
    ${famAvg.map((f, i) => { const [x, y] = pt(i, 5.65).split(','); return `<text x="${x}" y="${y}" text-anchor="middle" class="rlab">${esc(f.label)} · ${f.avg ? f.avg.toFixed(1) : '—'}</text>`; }).join('')}
  </svg>`;
  // RL-4 : un graphique énonce la question à laquelle il répond, sinon il n'existe pas.
  const figRadar = `<figure class="graphe"><figcaption>${esc(T.q_radar)}</figcaption>${radar}
    <p class="muted small">${esc(T.radar_sous)}</p></figure>`;

  // Répartition des verdicts : barre empilée, segments JUXTAPOSÉS (jamais superposés —
  // deux rects l'un sur l'autre sont un chevauchement, et rien ne dit lequel est devant).
  const segs = [['conforme', nbConf, 'var(--std)'], ['partiel', nbPartiel, 'var(--maj)'],
    ['non_conforme', nbNC, 'var(--fatal)'], ['sans_objet', nbSO, 'var(--muted)'],
    ['a_evaluer', nbAutres, 'var(--line)']].filter(s => s[1] > 0);
  const totalSeg = segs.reduce((s, x) => s + x[1], 0);
  let curseur = 0;
  const figVerdicts = totalSeg ? `<figure class="graphe"><figcaption>${esc(T.q_verdicts)}</figcaption>
    <svg class="g-empile" viewBox="0 0 100 8" preserveAspectRatio="none" role="img"
      aria-label="${esc(segs.map(s => `${s[0]} : ${s[1]}`).join(', '))}">
      ${segs.map(([, n, c]) => { const w = 100 * n / totalSeg, x = curseur; curseur += w; return `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="8" fill="${c}"/>`; }).join('')}
    </svg>
    <ul class="g-legende">${segs.map(([k, n, c]) => `<li><span class="g-puce" style="background:${c}" aria-hidden="true"></span><b>${n}</b> ${esc(k)}</li>`).join('')}</ul></figure>` : '';

  // ── section par dimension. Contenu inchangé : les tableaux passent par le composant de
  //    filtres dès le seuil du socle, et chaque badge porte sa légende (check_html L3).
  const dimSection = (d) => {
    const info = byId[d.id] ?? {};
    const rs = regles.filter(r => dimOfRegle(r) === d.id);
    const cs = (data.constats ?? []).filter(c => (c.dimension ?? '—') === d.id)
      .sort((a, b) => (SEV[a.severite] ?? 9) - (SEV[b.severite] ?? 9));
    const as_ = (data.actions ?? []).filter(a => (a.dimension ?? '—') === d.id)
      .sort((a, b) => (TAG[a.tag] ?? 9) - (TAG[b.tag] ?? 9));
    return `<section class="dim" id="${d.id}">
      <h4>${d.id} — ${esc(d.label)}
        <span class="badges">${info.score !== undefined ? badge('', `score ${info.score}/5`, T.t.score) : badge('', L.so, T.t.sans_objet)}
        ${info.criticite ? badge(`b-${CRIT_CLASS[info.criticite] ?? 'std'}`, info.criticite, T.t.criticite) : ''}
        ${info.gate1b ? badge(`b-${info.gate1b === 'go' ? 'std' : info.gate1b === 'nogo' ? 'fatal' : 'maj'}`, info.gate1b, T.t.gate1b) : ''}</span></h4>
      ${info.resume ? `<p>${esc(info.resume)}</p>` : ''}
      ${info.preuves?.length ? `<p class="muted">${L.preuves_score} : ${info.preuves.map(p => `<code>${esc(typeof p === 'string' ? p : p.ref ?? p.desc)}</code>`).join(' · ')}</p>` : ''}
      ${rs.length ? tableau({
      id: `t-regles-${esc(d.id)}`, lignes: rs.length, L: T, recherche: T.cherche,
      thead: `<tr><th>${L.regle}</th><th>${L.verdict}</th><th>${L.preuve}</th><th>${L.remede}</th></tr>`,
      tbody: rs.map(r => `<tr><td><code>${esc(r.id)}</code><div class="muted small">${esc((r.regle ?? '').slice(0, 90))}</div></td>
          <td>${badge(`v-${esc(r.verdict)}`, r.verdict ?? '—', T.t.verdict)}</td>
          <td>${esc(r.preuve ?? r.motif ?? '—')}</td><td>${esc(r.possible ?? r.remediation ?? '—')}</td></tr>`).join(''),
    }) : `<p class="muted">${L.sans_regle}</p>`}
      ${cs.length ? `<h5>${L.constats}</h5>${cs.map(c => `<div class="constat s-${esc(c.severite)}"><b>${esc(c.titre)}</b> ${badge('', c.severite ?? '—', T.t.severite)}<br>${esc(c.desc ?? '')}
        ${(c.preuves ?? []).map(p => `<div class="muted small">↳ ${esc(p.type ?? 'PREUVE')} · <code>${esc(p.ref ?? '')}</code> ${esc(p.desc ?? '')}</div>`).join('')}</div>`).join('')}` : ''}
      ${as_.length ? `<h5>${L.plan}</h5>${tableau({
      id: `t-plan-${esc(d.id)}`, lignes: as_.length, L: T, recherche: T.cherche,
      thead: `<tr><th>${L.prio}</th><th>${L.action}</th><th>${L.effort}</th></tr>`,
      tbody: as_.map(a => `<tr><td>${badge(`t-${esc(a.tag)}`, a.tag ?? '—', T.t.priorite)}</td><td><b>${esc(a.titre)}</b><div class="muted small">${esc(a.desc ?? '')}</div></td><td>${esc(a.effort ?? '—')}</td></tr>`).join(''),
    })}` : ''}
    </section>`;
  };

  // ── VUE « Constats par dimension » : les familles ne sont plus des onglets frères mais
  //    des sections d'une même vue, atteignables par ancre (le routeur ouvre la vue).
  const famAvecDims = famList.filter(f => dims.some(d => d.family === f.key));
  const famBlocs = famAvecDims.map(f => `<section class="famille" id="fam-${esc(f.key)}">
    <h3>${esc(f.label)}</h3>${dims.filter(d => d.family === f.key).map(dimSection).join('')}</section>`).join('');
  const famLiens = famAvecDims.map(f =>
    `<li><a href="#fam-${esc(f.key)}" title="${esc(T.aller_famille)} : ${esc(f.label)}">${esc(f.label)}</a></li>`).join('');
  const maxTableDim = Math.max(0, ...dims.map(d => regles.filter(r => dimOfRegle(r) === d.id).length),
    ...dims.map(d => (data.actions ?? []).filter(a => (a.dimension ?? '—') === d.id).length));

  // ── VUE « Toutes les règles » — traçabilité complète, filtrable
  const vueRegles = regles.length ? `${regles.length >= SEUIL_FILTRE ? `<p class="exemple-lecture muted small">${esc(T.ex.regles(regles[0].id, regles[0].verdict ?? '—'))}</p>` : ''}
    ${tableau({
    id: 'rtable', lignes: regles.length, L: T, recherche: T.cherche,
    thead: `<tr><th>ID</th><th>${L.dim}</th><th>${L.verdict}</th><th>${L.crit}</th><th>Bucket</th><th>Enforcement</th><th>${L.preuve}</th></tr>`,
    tbody: regles.map(r => `<tr><td><code>${esc(r.id)}</code></td><td>${esc(dimOfRegle(r))}</td>
      <td>${badge(`v-${esc(r.verdict)}`, r.verdict ?? '—', T.t.verdict)}</td>
      <td>${esc(r.criticite ?? '—')}</td><td>${esc(r.bucket ?? '—')}</td><td>${esc(r.enforcement ?? '—')}</td>
      <td>${esc(r.preuve ?? r.motif ?? '—')}</td></tr>`).join(''),
  })}` : '';

  // ── VUE « Plan d'action » (ECR-05) — plan consolidé, lisible
  const vuePlan = plan.length ? `<p class="muted small">${L.rem_intro}${planIncomplet.length ? ` — <b>${planIncomplet.length} ${L.rem_sans_critere}</b>` : ''}</p>
    ${plan.length >= SEUIL_FILTRE ? `<p class="exemple-lecture muted small">${esc(T.ex.plan(plan[0].id))}</p>` : ''}
    ${tableau({
    id: 'remtable', lignes: plan.length, L: T, recherche: T.cherche,
    thead: `<tr><th>ID</th><th>${L.action}</th><th>${L.prio}</th><th>${L.effort}</th><th>${L.source}</th><th>${L.critere}</th></tr>`,
    tbody: plan.map(a => `<tr><td><code>${esc(a.id)}</code></td><td>${esc(a.action)}</td>
      <td>${badge(`t-${esc(a.priorite)}`, a.priorite, T.t.priorite)}</td><td>${esc(a.effort)}</td>
      <td><code>${esc(a.source)}</code></td><td>${esc(a.verification)}</td></tr>`).join(''),
  })}` : '';

  // ── VUE « Données analysées ». Sémantique opposable (règle 18) : ANALYSES = outillage
  // EXÉCUTÉ (outil + version utilisée + sortie) ; COMPOSANTS = briques VERSIONNÉES.
  // Une revue humaine n'est ni l'un ni l'autre : elle vit en constat de dimension.
  const annexe = (key, titre, cols, rows) => rows?.length ? `<h3 id="bloc-${key}">${esc(titre)}</h3>
    ${tableau({
    id: `t-${key}`, lignes: rows.length, L: T, recherche: T.cherche,
    thead: `<tr>${cols.map(c => `<th>${esc(c[1])}</th>`).join('')}</tr>`,
    tbody: rows.map(r => `<tr>${cols.map(c => `<td>${esc(r[c[0]] ?? '—')}</td>`).join('')}</tr>`).join(''),
  })}` : '';
  const blocTests = annexe('__tests', L.tests,
    [['type', L.type], ['portee', L.portee], ['resultat', L.resultat], ['couverture', L.couverture]], data.tests);
  const blocAnalyses = annexe('__analyses', L.analyses,
    [['outil', L.outil], ['categorie', L.categorie], ['version_utilisee', L.version_utilisee], ['resultat', L.resultat]], data.analyses);
  const blocComposants = annexe('__composants', L.composants,
    [['nom', L.nom], ['version_resolue', L.version_resolue], ['version_actuelle', L.version_actuelle],
      ['statut', L.statut], ['reco_flag', L.reco], ['perimetre', L.perimetre]], data.composants);
  const blocReprise = (data.reprise ?? []).length ? `<h3 id="bloc-__reprise">${esc(L.reprise)}</h3>
    ${tableau({
    id: 't-__reprise', lignes: data.reprise.length, L: T, recherche: T.cherche,
    thead: `<tr><th>${L.info}</th><th>${L.valeur}</th><th>${L.statut}</th></tr>`,
    tbody: data.reprise.map(r => `<tr><td>${esc(r.label)}</td><td>${esc(r.value ?? r.valeur ?? '')}</td><td>${badge(`st-${esc(r.status ?? r.statut)}`, r.status ?? r.statut ?? '—', T.t.statut)}</td></tr>`).join(''),
  })}` : '';
  const maxDonnees = Math.max((data.tests ?? []).length, (data.analyses ?? []).length,
    (data.composants ?? []).length, (data.reprise ?? []).length);
  const vueDonnees = [blocTests, blocAnalyses, blocComposants, blocReprise].filter(Boolean).join('');

  // ── VUE « Architecture & BDD »
  const erd = renderERD(data.db_schema, L, T);
  const archi = renderArchi(data.architecture, L);
  const vueSchemas = (erd || archi) ? `${archi}${archi && erd ? '<hr class="sep">' : ''}${erd}` : '';

  // ── VUE « Méthode & lecture » — le contenu GÉNÉRIQUE vit ici une fois, et une seule
  //    (règle RL-7) ; le reste du rapport y renvoie par aria-describedby ou par ancre.
  const vueMethode = `<h3>${esc(L.score)}</h3><p id="leg-score">${esc(T.leg.score)}</p>
    <h3>${esc(L.gate)}</h3><p id="leg-gate">${esc(T.leg.gate)}</p>
    <h3>${esc(L.verdict)}</h3><p id="leg-verdicts">${esc(T.leg.verdicts)}</p>
    <p id="leg-criticites">${esc(T.leg.criticites)}</p>
    <h3>${esc(L.prio)}</h3><p id="leg-priorites">${esc(T.leg.priorites)}</p>
    <h3>${esc(L.preuve)}</h3><p id="leg-preuve">${esc(T.leg.preuve)}</p>
    <p id="leg-mesures">${esc(T.leg.mesures)}</p>
    <h3>${esc(T.provenance)}</h3>
    ${tableau({
    id: 't-__provenance', lignes: 4, L: T,
    thead: `<tr><th>${L.info}</th><th>${L.valeur}</th></tr>`,
    tbody: `<tr><td>${esc(L.auditeur)}</td><td>${esc(data.auditeur ?? '—')}</td></tr>
      <tr><td>core</td><td>${esc(coreVersion || '—')}</td></tr>
      <tr><td>${esc(L.moteur_llm)}</td><td>${esc(data.moteur_audit_llm ? [data.moteur_audit_llm.modele, data.moteur_audit_llm.modele_id, data.moteur_audit_llm.editeur, data.moteur_audit_llm.date].filter(Boolean).join(' · ') : '—')}</td></tr>
      <tr><td>${esc(L.rapport)}</td><td>${esc(`${projet} · ${data.date ?? ''}${data.indice ?? ''}`)}</td></tr>`,
  })}`;

  // ── Assemblage des vues. Une vue sans donnée n'existe pas : son absence est DÉCLARÉE
  //    au manifeste d'écarts, jamais laissée en cadre vide (règles RL-1 et RL-10).
  const vues = [];
  const ajoute = (id, cle, corps, exemple = '') => {
    if (!corps) return;
    vues.push({ id, titre: T.v[cle][0], annonce: T.v[cle][1], objectif: T.o[cle], corps, exemple });
  };
  const lien = (cle) => {
    const v = vues.find(x => x.id === `v-${cle}`);
    return v ? `<a href="#${v.id}">${esc(v.titre)}</a>` : esc(T.v[cle][0]);
  };

  ajoute('v-plan', 'plan', vuePlan, plan.length >= SEUIL_FILTRE ? T.ex.plan(plan[0].id) : '');
  ajoute('v-dimensions', 'dimensions', famBlocs, maxTableDim >= SEUIL_FILTRE ? T.ex.dim : '');
  ajoute('v-regles', 'regles', vueRegles);
  ajoute('v-schemas', 'schemas', vueSchemas);
  ajoute('v-donnees', 'donnees', vueDonnees, maxDonnees >= SEUIL_FILTRE ? T.ex.donnees : '');
  ajoute('v-methode', 'methode', vueMethode);

  const kpiHtml = (id, [label, def, repere], valeur, unite, cle) => `<article class="kpi">
    <span class="k-label">${esc(label)}</span>
    <span class="k-valeur" aria-describedby="${id}">${esc(valeur)}${unite ? ` <small>${esc(unite)}</small>` : ''}</span>
    <span class="kpi-d">${esc(def)}</span>
    <span class="k-repere" id="${id}">${esc(repere)}</span>
    ${vues.some(v => v.id === `v-${cle}`) ? `<a class="k-action" href="#v-${cle}">${esc(T.a[cle])}</a>` : ''}</article>`;

  // La synthèse cite les autres vues : elle se construit après elles, et s'insère en tête.
  const synthese = `<div class="verdict">
      <p><b>${L.gate} :</b> <span class="gate ${gateClass}" title="${esc(T.t.gate)}">${esc(gate)}</span>
      — ${bloquants.length} ${esc(L.bloquants.toLowerCase())}, ${nbNC} ${esc(L.regles.toLowerCase())} ${esc(L.nc)}, ${plan.length} ${esc(L.rem.toLowerCase())}.</p>
    </div>
    <div class="kpis">
      ${kpiHtml('kr-score', [T.kpi.score[0], T.kpi.score[1], T.kpi.score[2](applicable.length, dims.length)], scoreGlobal, '/5', 'dimensions')}
      ${kpiHtml('kr-bloq', [T.kpi.bloquants[0], T.kpi.bloquants[1], T.kpi.bloquants[2](bloquants.length, bloquants.map(b => b.id).join(' · '))], String(bloquants.length), '', 'dimensions')}
      ${kpiHtml('kr-regles', [T.kpi.regles[0], T.kpi.regles[1], T.kpi.regles[2](nbNC, nbPartiel, nbSO)], String(regles.length), '', 'regles')}
      ${kpiHtml('kr-plan', [T.kpi.plan[0], T.kpi.plan[1], T.kpi.plan[2](urgentes, prioritaires)], String(plan.length), '', 'plan')}
    </div>
    ${data.syntheses ? tableau({
    id: 't-__syntheses', lignes: Object.keys(data.syntheses).length, L: T, exemption: T.exempt_syntheses,
    thead: `<tr><th>${L.info}</th><th>${L.valeur}</th></tr>`,
    tbody: Object.entries(data.syntheses).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join(''),
  }) : ''}
    <h3>${L.familles}</h3>${figRadar}${figVerdicts}
    <h3>${esc(T.commencer)}</h3>
    <ul class="chemins">
      <li class="chemin"><b>${esc(T.chemins[0][0])}</b>${esc(T.chemins[0][1])}${lien('plan')}.</li>
      <li class="chemin"><b>${esc(T.chemins[1][0])}</b>${esc(T.chemins[1][1])}${lien('plan')}${esc(lang === 'en' ? ', then the ' : ', puis les ')}${lien('dimensions')}.</li>
      <li class="chemin"><b>${esc(T.chemins[2][0])}</b>${esc(T.chemins[2][1])}${lien('methode')}${esc(lang === 'en' ? ', then ' : ', puis ')}${lien('regles')}.</li>
    </ul>`;
  vues.unshift({ id: 'v-synthese', titre: T.v.synthese[0], annonce: T.v.synthese[1], objectif: T.o.synthese, corps: synthese, exemple: '' });

  const nav = `<nav class="toc vues" aria-label="Sommaire" role="tablist">
    <span class="toc-h">${esc(T.sommaire)}</span>
    <ol>${vues.map((v, i) => `<li><a href="#${v.id}" data-vue="${v.id}" role="tab" aria-selected="${i === 0}" onclick="return montreVue('${v.id}')"><span class="toc-t">${i + 1} · ${esc(v.titre)}</span><span class="toc-d">${esc(v.annonce)}</span></a></li>`).join('')}</ol></nav>`;
  const sections = vues.map((v, i) => `<section class="vue${i === 0 ? ' active' : ''}" id="${v.id}" role="tabpanel" aria-label="${esc(v.titre)}">
    <h2 class="sr">${esc(v.titre)}</h2>
    <p class="objectif ch-apprend">${esc(v.objectif)}</p>
    ${v.id === 'v-dimensions' ? `<nav class="familles" aria-label="${esc(T.aller_famille)}"><ul>${famLiens}</ul></nav>` : ''}
    ${v.exemple ? `<p class="exemple-lecture muted small">${esc(v.exemple)}</p>` : ''}
    ${v.corps}</section>`).join('');

  // ── Manifeste d'écarts (RL-10) : CALCULÉ sur l'état réel de la mission. « Aucun écart »
  //    se déclare aussi — l'absence du manifeste, elle, ne se tait pas.
  const ecarts = [];
  if (!vueSchemas) ecarts.push(T.ec.schemas);
  if (!vueDonnees) ecarts.push(T.ec.donnees);
  else if (!(data.reprise ?? []).length) ecarts.push(T.ec.reprise);
  if (!(data.constats ?? []).length) ecarts.push(T.ec.constats);
  // Un constat rattaché à une dimension inconnue ne s'affiche dans AUCUNE section : sans
  // cette déclaration, il disparaîtrait en silence — exactement ce que le manifeste refuse.
  const idsDims = new Set(dims.map(d => d.id));
  const constatsOrphelins = (data.constats ?? []).filter(c => !idsDims.has(c.dimension ?? '—'));
  if (constatsOrphelins.length) ecarts.push(T.ec.constats_orphelins(constatsOrphelins.length,
    constatsOrphelins.map(c => c.titre ?? '—').join(', ')));
  if (!data.syntheses) ecarts.push(T.ec.syntheses);
  if (planIncomplet.length) ecarts.push(T.ec.plan_incomplet(planIncomplet.length));
  if (nonRattachees.length) ecarts.push(T.ec.non_rattachees(nonRattachees.length, nonRattachees.map(a => a.source).join(', ')));
  if (!figVerdicts) ecarts.push(T.ec.figures);
  if (famAvg.length) ecarts.push(T.ec.radar);
  if (!ecarts.length) ecarts.push(T.ec.aucun);

  // ── ECR-04/05 · le rapport est AUTO-PORTEUR de sa remédiation : bloc machine embarqué.
  // Le projet n'a aucun export à demander — il lit le HTML qu'on lui a remis.
  const planJson = JSON.stringify({
    schema: 'auditcore.remediation-plan/v1',
    meta: {
      projet: data.projet?.nom ?? data.titre ?? null,
      date: `${data.date ?? ''}${data.indice ?? ''}` || null,
      verdict_gate1b: gate,
      core_version: coreVersion || null,
      // ECR-07 · quel LLM a réalisé l'AUDIT (distinct du LLM éventuel de l'application auditée)
      moteur_audit_llm: data.moteur_audit_llm ?? null,
    },
    actions: plan,
  });
  // Faits nécessaires à l'auto-test interne du rapport (check 9 du gate de rendu).
  const selfTestJson = JSON.stringify({
    gate_declare: gate,
    bloquants: bloquants.map(b => b.id),
    dimensions_nogo: scored.filter(d => d.gate1b === 'nogo').map(d => d.id),
    regles_non_conformes: regles.filter(r => r.verdict === 'non_conforme').map(r => r.id),
    analyses_sans_version: (data.analyses ?? []).filter(a => !String(a.version_utilisee ?? '').trim()).map(a => a.outil ?? '?'),
    vues: vues.map(v => v.id),
  });

  return `<!DOCTYPE html><html lang="${esc(lang)}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(tenant)} — ${L.rapport} — ${esc(projet)}</title>
<style>${themeCss}
.wrap{max-width:clamp(75vw,1680px,92vw);margin:0 auto;padding:24px}h1{font-size:26px;margin:6px 0}
h2{font-size:20px;margin:18px 0 8px}h3{margin:22px 0 8px}h4{margin:18px 0 6px}h5{margin:14px 0 6px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.gate{padding:10px 16px;border-radius:8px;font-weight:700;display:inline-block;color:#fff}
.gate.std{background:var(--std)}.gate.maj{background:var(--maj)}.gate.fatal{background:var(--fatal)}
.muted{color:var(--muted)}.small{font-size:11.5px}
/* — Vues (référentiel de restitution) : navigation permanente, une question par vue — */
nav.vues{margin:18px 0 10px;border-bottom:2px solid var(--line);padding-bottom:10px}
nav.vues .toc-h{display:block;font-weight:700;font-size:12.5px;margin-bottom:8px}
nav.vues ol{list-style:none;display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0}
nav.vues a{display:flex;flex-direction:column;justify-content:center;min-height:44px;border:1px solid var(--line);background:var(--panel);color:var(--txt);border-radius:8px;padding:6px 12px;text-decoration:none;max-width:280px}
nav.vues a[aria-selected="true"]{background:var(--accent);color:#fff;border-color:var(--accent)}
nav.vues .toc-t{font-weight:700;font-size:12.5px}nav.vues .toc-d{font-size:11px;opacity:.85}
section.vue{display:none}section.vue.active{display:block}
.objectif{color:var(--muted);font-size:13px;margin:6px 0 18px}
/* Pas de max-width en ch sur ces paragraphes : brider la prose sous 85 % de la largeur
   disponible laisse une marge droite vide aussi large que le texte (contrôle L2 du rendu). */
.exemple-lecture{margin:6px 0}
nav.familles ul{list-style:none;display:flex;flex-wrap:wrap;gap:6px;margin:0 0 16px;padding:0}
nav.familles a{border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:4px 12px;font-size:12px;text-decoration:none;color:var(--txt)}
.verdict{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;padding:14px 16px;margin:14px 0}
.verdict p{margin:0}
/* — KPI complets (RL-3) : valeur, définition, repère de lecture, action — */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:14px 0}
.kpi{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 16px;display:flex;flex-direction:column;gap:6px}
.kpi .k-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.kpi .k-valeur{font-size:24px;font-weight:700;line-height:1.1}
.kpi .kpi-d{font-size:12px;color:var(--muted)}
.kpi .k-repere{font-size:12px;background:var(--bg);border-radius:6px;padding:8px}
.kpi .k-action{font-size:12px;font-weight:700;color:var(--accent);text-decoration:none}
figure.graphe{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px;margin:0 0 16px}
figure.graphe figcaption{font-weight:700;margin-bottom:8px;font-size:13px}
.g-empile{width:100%;height:14px;border-radius:4px;display:block}
.g-legende{list-style:none;display:flex;flex-wrap:wrap;gap:12px;margin:8px 0 0;padding:0;font-size:12px}
.g-puce{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px}
.chemins{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin:0 0 16px;padding:0}
.chemin{font-size:12.5px;padding:10px 12px;background:var(--panel);border:1px solid var(--line);border-radius:8px}
.chemin b{display:block;margin-bottom:2px}
footer.ecarts{margin-top:26px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;font-size:12.5px}
footer.ecarts h2{font-size:14px;margin:0 0 8px}footer.ecarts ul{margin:0;padding-left:18px}
.sep{border:none;border-top:1px solid var(--line);margin:24px 0}
table{border-collapse:collapse;width:100%;margin:8px 0;background:var(--panel)}th,td{border:1px solid var(--line);padding:6px 9px;font-size:12.5px;text-align:left;vertical-align:top}
th{background:var(--bg);position:relative}
.badge{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:1px 9px;font-size:11px;margin-left:4px;background:var(--panel)}
.b-fatal,.v-non_conforme{color:#fff;background:var(--fatal);border-color:var(--fatal)}.b-bloq{color:#fff;background:var(--bloq);border-color:var(--bloq)}
.b-maj,.v-partiel,.t-prio,.st-partial{color:var(--maj);border-color:var(--maj)}.b-std,.v-conforme,.st-ok{color:var(--std);border-color:var(--std)}
.t-urgent{color:#fff;background:var(--fatal);border-color:var(--fatal)}.v-sans_objet,.v-a_evaluer,.st-manual{color:var(--muted)}.st-gap{color:var(--fatal);border-color:var(--fatal)}
.constat{border-left:3px solid var(--line);padding:6px 10px;margin:6px 0;background:var(--panel)}
.constat.s-critique{border-color:var(--fatal)}.constat.s-majeur{border-color:var(--maj)}
.radar{max-width:460px}.rlab{font-size:10.5px;fill:var(--txt)}
.erd-t rect{fill:var(--panel);stroke:var(--line);stroke-width:1.2}.erd-h{fill:var(--bg)!important}
.erd-tt{font-weight:700;font-size:11.5px;fill:var(--txt)}.erd-c{font-size:10px;fill:var(--txt)}.erd-c.pii{fill:var(--fatal)}
.erd-ty{font-size:9.5px;fill:var(--muted)}.erd-band{font-size:10px;font-weight:700;letter-spacing:.08em;fill:var(--muted);text-transform:uppercase}
.erd-r{fill:none;stroke:var(--muted);stroke-width:1.3}.erd-r.soft{stroke-dasharray:5 3}
.a-t{font-weight:700;font-size:12px}.a-s{font-size:10px}
.a-purple rect{fill:#ede9fe;stroke:#c4b5fd}.a-purple text{fill:#5b21b6}.a-blue rect{fill:#dbeafe;stroke:#93c5fd}.a-blue text{fill:#1d4ed8}
.a-teal rect{fill:#ccfbf1;stroke:#5eead4}.a-teal text{fill:#0f766e}.a-coral rect{fill:#fee2e2;stroke:#fca5a5}.a-coral text{fill:#b91c1c}
.a-amber rect{fill:#fef3c7;stroke:#fcd34d}.a-amber text{fill:#92400e}.a-gray rect{fill:#f1f3f7;stroke:#cbd5e1}.a-gray text{fill:#374151}
.a-e{fill:none;stroke:#475569;stroke-width:1.5}.a-e.dashed{stroke-dasharray:5 3;stroke:#94a3b8}.a-e.coral{stroke:#b91c1c}
/* — Filtres de colonne (composant du socle, G1-G6) + recherche libre — */
.t-outils{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:10px 0 2px}
.t-outils input[type=search]{flex:1 1 240px;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit}
.tf-count{font-size:11.5px;color:var(--muted)}.tf-count.zero{color:var(--fatal)}
.tf-btn{border:0;background:none;cursor:pointer;font:inherit;color:var(--muted)}
.tf-btn[aria-expanded="true"],.tf-btn.tf-on{color:var(--accent)}
.tf-panel{position:absolute;z-index:10;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px;min-width:180px}
.tf-panel[hidden]{display:none}.tf-opts{max-height:220px;overflow-y:auto;display:block}
.tf-opts label{display:block;font-size:12px}.tf-actions{display:flex;gap:6px;margin:6px 0}
.tf-search{width:100%;padding:4px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:12px}
tr[data-q-hidden]{display:none!important}
@media (max-width:720px){.wrap{padding:16px}.kpis{grid-template-columns:1fr}nav.vues a{max-width:none;flex:1 1 100%}}
@media print{nav.vues,nav.familles,.t-outils{display:none}
 section.vue{display:block!important}
 .tf-btn,.tf-panel{display:none!important}
 tr[data-tf-hidden],tr[data-q-hidden]{display:table-row!important}
 a{color:inherit;text-decoration:none}}
</style></head><body data-restitution="rapport"><div class="wrap">
<header><span class="brand">${esc(data._short_code ?? '')}</span> <b>${esc(tenant)}</b> — ${L.rapport}
 <span class="muted">· ${esc(data.date ?? '')}${esc(data.indice ?? '')} · core ${esc(coreVersion)} · ${L.auditeur} : ${esc(data.auditeur ?? '—')}${data.moteur_audit_llm ? ` · ${L.moteur_llm} : ${esc([data.moteur_audit_llm.modele, data.moteur_audit_llm.modele_id, data.moteur_audit_llm.date].filter(Boolean).join(' · '))}` : ''}</span></header>
<h1>${L.rapport} — ${esc(projet)}</h1>
${nav}
<main>${sections}</main>
<footer class="ecarts"><h2>${esc(T.ecarts_t)}</h2><ul>${ecarts.map(e => `<li>${esc(e)}</li>`).join('')}</ul></footer>
<footer class="muted small" style="margin-top:20px;border-top:1px solid var(--line);padding-top:10px">
${L.footer.replace('{v}', esc(coreVersion)).replace('{t}', esc(tenant))}</footer>
</div>
<script type="application/json" id="remediation-plan-json">${planJson.replace(/</g, '\\u003c')}</script>
<script type="application/json" id="audit-selftest-data">${selfTestJson.replace(/</g, '\\u003c')}</script>
<script>${TABLE_FILTERS_JS.replace(/<\/script/gi, '<\\/script')}
/* ── Navigation par VUES (référentiel de restitution, RL-1/RL-6). La fonction est GLOBALE
   et nommée : le gate de rendu pilote chaque vue déclarée comme le ferait un lecteur, et
   une vue qui casse au clic sort en erreur au lieu de se découvrir à l'usage. */
function montreVue(k){
 var vues=document.querySelectorAll('section.vue'),i;
 for(i=0;i<vues.length;i++){ if(vues[i].id===k) vues[i].classList.add('active'); else vues[i].classList.remove('active'); }
 var ong=document.querySelectorAll('nav.vues a[data-vue]');
 for(i=0;i<ong.length;i++){ ong[i].setAttribute('aria-selected', String(ong[i].getAttribute('data-vue')===k)); }
 try{ if(window.history&&window.history.replaceState) window.history.replaceState(null,'','#'+k); }catch(_){}
 return false;
}
/* Recherche libre dans un tableau. Elle marque les lignes exclues par data-q-hidden et ne
   touche PAS a style.display : le composant de filtres de colonne s'en sert, et les deux
   mecanismes se composent au lieu de s'ecraser l'un l'autre. */
function filtreTableau(idInput,idTable){
 var champ=document.getElementById(idInput), t=document.getElementById(idTable);
 if(!champ||!t) return 0;
 var q=String(champ.value||'').toLowerCase(), trs=t.querySelectorAll('tbody tr'), n=0, i;
 for(i=0;i<trs.length;i++){
  var tr=trs[i], ok=String(tr.textContent||'').toLowerCase().indexOf(q)>=0;
  if(ok){ tr.removeAttribute('data-q-hidden'); if(!tr.hasAttribute('data-tf-hidden')) n++; }
  else tr.setAttribute('data-q-hidden','');
 }
 var c=document.querySelector('[data-tf-count-for="'+idTable+'"]');
 if(c){ c.textContent=n+' / '+trs.length+' ${esc(T.lignes)}'; if(c.classList&&c.classList.toggle) c.classList.toggle('zero', n===0); }
 return n;
}
/* Routeur a ancres : toute ancre pointant DANS une vue masquee ouvre la vue avant d'y
   defiler — sans quoi la moitie des renvois du rapport seraient des liens morts. */
(function(){
 function vueDe(el){ while(el&&el.classList){ if(el.classList.contains('vue')) return el; el=el.parentNode; } return null; }
 document.addEventListener('click', function(ev){
  var a=ev.target&&ev.target.closest?ev.target.closest('a[href^="#"]'):null;
  if(!a) return;
  var href=a.getAttribute('href')||''; if(href.length<2) return;
  var cible=document.getElementById(decodeURIComponent(href.slice(1)));
  if(!cible) return;
  var v=vueDe(cible); if(!v) return;
  ev.preventDefault(); montreVue(v.id);
  if(cible!==v&&cible.scrollIntoView) cible.scrollIntoView({block:'start'});
 });
 var h=(window.location&&window.location.hash)||'';
 if(h.length>1){ var d=document.getElementById(decodeURIComponent(h.slice(1))); var v0=d?vueDe(d):null;
  if(v0){ montreVue(v0.id); if(d!==v0&&d.scrollIntoView) d.scrollIntoView({block:'start'}); } }
 /* Un changement de filtre de colonne recalcule le compteur en tenant compte de la
    recherche libre : sinon le compteur annoncerait des lignes que l'autre filtre cache. */
 var ts=document.querySelectorAll('table[data-filterable]');
 for(var i=0;i<ts.length;i++){ (function(t){
  if(!document.getElementById(t.id+'-q')) return;
  var relance=function(){ setTimeout(function(){ filtreTableau(t.id+'-q', t.id); },0); };
  t.addEventListener('change',relance); t.addEventListener('click',relance);
 })(ts[i]); }
 if(window.DigitAITableFilters) window.DigitAITableFilters.initAll(document);
})();
/* ECR-04 — plan de remédiation auto-porté : accessible sans export, sans navigateur. */
function __auditJson(id){var e=document.getElementById(id); if(!e) return null;
 try{return JSON.parse(e.textContent);}catch(_){return null;}}
function remMeta(){return (__auditJson('remediation-plan-json')||{}).meta||{};}
function buildRemediationPlan(){return (__auditJson('remediation-plan-json')||{}).actions||[];}
var REMEDIATION_PLAN=buildRemediationPlan();
try{window.REMEDIATION_PLAN=REMEDIATION_PLAN;}catch(_){}
/* ECR-02 check 9 — AUTO-TEST INTERNE. Le gate externe hérite de son verdict : tout
   contrôle ajouté ici est couvert automatiquement, sans toucher au vérificateur. */
function auditSelfTest(){
 var e=[], d=__auditJson('audit-selftest-data')||{}, p=buildRemediationPlan();
 var calc=(d.dimensions_nogo||[]).length? 'NO-GO' : ((d.bloquants||[]).length? 'GO SOUS RÉSERVE':'GO');
 if(d.gate_declare && d.gate_declare!==calc && !((d.bloquants||[]).length>=5 && d.gate_declare==='NO-GO'))
  e.push('verdict gate declare ('+d.gate_declare+') incoherent avec les dimensions saisies (calcule: '+calc+')');
 var sansCritere=p.filter(function(a){return /\\{\\{/.test(String(a.action)+' '+String(a.verification));});
 if(sansCritere.length) e.push(sansCritere.length+' action(s) de remediation sans critere de cloture: '+sansCritere.map(function(a){return a.id;}).join(', '));
 (d.regles_non_conformes||[]).forEach(function(id){
  if(!p.some(function(a){return a.source===id;})) e.push('regle non conforme sans action de remediation: '+id);});
 if((d.analyses_sans_version||[]).length)
  e.push('inventaire ANALYSES: '+d.analyses_sans_version.length+' entree(s) sans version utilisee — outillage non execute, ou revue humaine mal rangee (deplacer en constat de dimension)');
 if((d.vues||[]).length<2) e.push('restitution: moins de deux vues declarees — une restitution ne se lit pas a plat');
 return {ok:e.length===0, errors:e};
}
</script></body></html>`;
}
