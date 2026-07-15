---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "équipes produit, équipes data"
id: ADR0605
domain: "06"
invariant: true
standards: ["ISO/IEC 25012:2008 — modèle de qualité des données", "DAMA-DMBOK2 — Chapitre 13 (Data Quality)", "ISO/IEC 25024:2015 — mesures de qualité des données"]
derived_controls: [CTL-D05-04, CTL-D14-03, CTL-D14-05, CTL-D15-03]
profile_bindings: optional
---

# Qualité des données : règles, seuils et contrôles automatisés

## Context and Problem Statement

Sans règles de qualité explicites et automatisées, les anomalies (valeurs manquantes, doublons, ruptures de format, dérive statistique) ne sont détectées qu'au moment où elles causent un incident métier visible, bien après leur introduction. Comment garantir que la qualité d'un actif de données est mesurée en continu contre des seuils explicites, indépendamment de l'outillage de contrôle ?

## Decision Drivers

* Détection des anomalies au plus près de leur introduction, avant propagation en aval
* Seuils explicites et mesurables, opposables en audit
* Automatisation nécessaire pour couvrir des volumes que la revue manuelle ne peut pas traiter
* Neutralité vis-à-vis du moteur de contrôle de qualité retenu

## Considered Options

* Règles de qualité déclaratives avec seuils, exécutées automatiquement à chaque cycle
* Contrôles de qualité manuels, réalisés par sondage périodique
* Aucun contrôle formalisé ; la qualité est constatée par les utilisateurs finaux

## Decision Outcome

Chosen option: "Règles déclaratives automatisées", parce que c'est la seule option capable de détecter une anomalie avant qu'elle n'atteigne les consommateurs en aval, à un coût constant quel que soit le volume de données.

### Consequences

* Good, because les anomalies sont détectées et bloquées ou signalées avant propagation.
* Good, because les seuils déclaratifs constituent une preuve d'audit directement exploitable.
* Bad, because la définition initiale des règles et seuils demande une connaissance métier fine du domaine.
* Neutral, because les seuils doivent être révisés à mesure que les usages et volumes évoluent.

### Confirmation

Contrôles dérivés : CTL-D05-04 (règles de qualité automatisées avec seuils déclarés par actif critique), CTL-D15-04 (blocage ou alerte tracés en cas de franchissement de seuil). Preuve attendue : catalogue des règles de qualité avec seuils et historique des exécutions et alertes déclenchées. Grille : conforme = règles automatisées actives sur les actifs critiques avec seuils documentés ; partiel = règles définies mais exécution manuelle ou partielle ; non conforme = absence de règles formalisées.

## Pros and Cons of the Options

### Règles déclaratives automatisées

* Good, because détection précoce et coût marginal indépendant du volume.
* Bad, because effort initial de définition des règles et des seuils pertinents.

### Contrôles manuels par sondage

* Good, because ne nécessite pas d'outillage dédié.
* Bad, because couverture partielle par construction ; anomalies entre deux sondages non détectées.

### Aucun contrôle formalisé

* Good, because coût nul à court terme.
* Bad, because la qualité n'est constatée qu'au moment de l'incident, souvent par un tiers externe.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → contraintes de qualité déclaratives exécutées à chaque lot avec quarantaine automatique des enregistrements en échec ; `profil:powerbi` → indicateurs de fraîcheur et de qualité affichés sur les jeux de données certifiés.
