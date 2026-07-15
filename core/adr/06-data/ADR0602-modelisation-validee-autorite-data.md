---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "équipes produit, équipes data"
id: ADR0602
domain: "06"
invariant: true
standards: ["DAMA-DMBOK2 — Chapitre 5 (Data Modeling and Design)", "ISO/IEC 25012:2008 — modèle de qualité des données", "RGPD — Art. 24 (responsabilité du responsable de traitement)"]
derived_controls: [CTL-D15-02, CTL-D16-01, CTL-D16-02, CTL-D16-03]
profile_bindings: optional
---

# Modélisation des données validée par une autorité data, avec traçabilité colonne

## Context and Problem Statement

Un modèle de données conçu sans revue ni traçabilité colonne produit des définitions divergentes entre équipes, une classification de sensibilité incomplète, et une dette de compréhension qui s'accumule silencieusement. Comment garantir que tout modèle de données mis en production a été validé par une autorité compétente et reste traçable jusqu'à la colonne ?

## Decision Drivers

* Cohérence sémantique des définitions entre domaines et entre équipes
* Traçabilité colonne↔règle de gestion, prérequis de la classification des données sensibles
* Prévention de la dette de modélisation (redondances, ambiguïtés, ruptures d'intégrité)
* Applicabilité indépendante du paradigme de modélisation retenu

## Considered Options

* Revue de modélisation obligatoire par une autorité data, dictionnaire tracé par colonne
* Modélisation libre par équipe, avec revue de pairs informelle
* Modélisation libre sans revue, documentation a posteriori si le temps le permet

## Decision Outcome

Chosen option: "Revue obligatoire et traçabilité colonne", parce que seule cette option produit une preuve de validation opposable et un dictionnaire exploitable pour la classification des données sensibles, quel que soit le paradigme de modélisation retenu.

### Consequences

* Good, because les définitions sont cohérentes entre domaines, réduisant les interprétations divergentes.
* Good, because la traçabilité colonne alimente directement la classification des données personnelles et sensibles.
* Bad, because la revue ajoute un délai avant toute mise en production.
* Neutral, because exige un dictionnaire de données vivant, à maintenir dans la durée.

### Confirmation

Contrôles dérivés : CTL-D16-01 (traçabilité colonne↔règle de gestion documentée dans le dictionnaire), CTL-D15-02 (revue de modélisation par l'autorité data tracée avant mise en production). Preuve attendue : compte rendu de revue signé et extrait du dictionnaire de données. Grille : conforme = revue tracée et dictionnaire à jour ; partiel = l'un des deux seulement ; non conforme = ni revue ni dictionnaire.

## Pros and Cons of the Options

### Revue obligatoire et traçabilité colonne

* Good, because cohérence et auditabilité maximales.
* Bad, because coût de gouvernance continu pour maintenir le dictionnaire.

### Revue de pairs informelle

* Good, because plus rapide, culture d'équipe préservée.
* Bad, because dépend de la discipline individuelle ; aucune preuve opposable en audit.

### Documentation a posteriori

* Good, because n'ajoute aucun délai de mise en production.
* Bad, because « a posteriori » devient en pratique « jamais » ; dette de modélisation non maîtrisée.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → revue de schéma outillée via le catalogue technique et des contraintes déclaratives ; `profil:powerbi` → certification du modèle sémantique par un centre de compétence avant publication.
