---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "équipes d'exploitation, équipes data"
id: ADR0608
domain: "06"
invariant: true
standards: ["DAMA-DMBOK2 — Chapitre 12 (Metadata Management — lignage)", "ISO 8000-8 — qualité de l'information : concepts et mesure", "ISO/IEC 27002:2022 — 8.15 (journalisation)"]
derived_controls: [CTL-D05-07, CTL-D14-07, CTL-D14-09, CTL-D15-06]
profile_bindings: optional
---

# Observabilité des données : monitoring, alerting et lignage

## Context and Problem Statement

Sans lignage ni supervision dédiés, une anomalie de données (retard, volumétrie anormale, dérive de distribution) n'est détectée que lorsqu'un utilisateur métier constate un résultat incohérent, et son origine reste introuvable dans la chaîne de traitement. Comment garantir qu'un actif de données est supervisé en continu et que sa provenance reste traçable de bout en bout ?

## Decision Drivers

* Détection proactive des anomalies de fraîcheur, de volumétrie et de distribution
* Traçabilité de la provenance d'un actif jusqu'à ses sources, à travers toutes les transformations
* Réduction du délai entre l'introduction d'une anomalie et sa détection
* Neutralité vis-à-vis de la plateforme d'observabilité retenue

## Considered Options

* Lignage automatique de bout en bout et supervision continue avec alerting sur seuils
* Journalisation des exécutions de pipeline uniquement, sans lignage ni alerting
* Aucune supervision dédiée ; les anomalies sont remontées par les utilisateurs finaux

## Decision Outcome

Chosen option: "Lignage automatique et supervision continue", parce que c'est la seule option qui relie la détection d'une anomalie à sa cause dans la chaîne de traitement, au lieu de constater un symptôme sans pouvoir remonter à l'origine.

### Consequences

* Good, because une anomalie de fraîcheur ou de volumétrie est détectée avant d'atteindre un rapport ou un consommateur métier.
* Good, because le lignage permet de remonter de tout résultat incohérent jusqu'à la source et à la transformation en cause.
* Bad, because instrumenter le lignage et la supervision demande un effort d'intégration initial par pipeline.
* Neutral, because le volume de métadonnées de supervision doit être dimensionné selon une politique de rétention propre (lien ADR0609).

### Confirmation

Contrôles dérivés : CTL-D05-07 (lignage de bout en bout tracé et consultable pour les actifs critiques), CTL-D15-05 (alerting actif sur la fraîcheur et la volumétrie, avec seuils déclarés). Preuve attendue : capture du graphe de lignage d'un actif critique et historique des alertes déclenchées. Grille : conforme = lignage consultable et alerting actif sur les actifs critiques ; partiel = l'un des deux seulement ; non conforme = ni lignage ni alerting.

## Pros and Cons of the Options

### Lignage automatique et supervision continue

* Good, because détection proactive et remontée à la cause racine.
* Bad, because effort d'instrumentation initial par pipeline.

### Journalisation des exécutions seule

* Good, because simple à mettre en place, déjà présente dans la plupart des moteurs.
* Bad, because ne relie pas une anomalie constatée à sa cause ; aucune vision de la provenance.

### Aucune supervision dédiée

* Good, because coût nul à court terme.
* Bad, because chaque anomalie est découverte par un utilisateur métier, souvent tardivement.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → lignage natif au niveau colonne exposé par le catalogue technique et ses tables système ; `profil:elastic` → tableaux de bord de fraîcheur et de volumétrie sur la plateforme d'observabilité unifiée (lien ADR0401).
