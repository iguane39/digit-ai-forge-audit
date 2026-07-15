---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, architectes data"
informed: "équipes produit"
id: ADR0805
domain: "08"
invariant: false
standards: ["Kimball — cohérence des modes d'accès BI", "ISO/IEC 25010 (efficacité de performance)"]
derived_controls: [CTL-D05-14, CTL-D11-05]
---

# Homogénéité des modes de stockage/connexion BI

## Context and Problem Statement

Quand chaque rapport choisit librement sa stratégie d'accès à la donnée (extraction
complète en mémoire, interrogation directe de la source, ou approche hybride), la
performance perçue et la fraîcheur des chiffres deviennent imprévisibles d'un rapport à
l'autre, pour des raisons invisibles à l'utilisateur final. Comment garantir un choix
homogène et justifié du mode de stockage et de connexion à travers toute la couche de
restitution ?

## Decision Drivers

* Performance perçue homogène et prévisible pour l'utilisateur final
* Fraîcheur des données cohérente avec le besoin métier de chaque rapport
* Maîtrise de la charge exercée sur la source par les outils de restitution
* Choix explicite et justifié plutôt que laissé à la convenance de chaque auteur

## Considered Options

* Modes de connexion standardisés par profil de besoin (fraîcheur, volumétrie, charge)
* Un seul mode de connexion imposé uniformément à tous les rapports
* Choix du mode de connexion laissé à la discrétion de chaque auteur de rapport

## Decision Outcome

Chosen option: "Modes standardisés par profil de besoin", parce qu'elle évite à la fois
la rigidité d'un mode unique inadapté à certains besoins et l'imprévisibilité d'un choix
laissé à chaque auteur, en associant explicitement chaque profil de besoin à un mode de
connexion justifié et documenté.

### Consequences

* Good, because performance perçue et fraîcheur des données prévisibles par profil de besoin.
* Good, because la charge exercée sur la source reste maîtrisée et anticipée.
* Bad, because chaque nouveau rapport doit être qualifié dans un profil de besoin avant conception.
* Neutral, because des rapports existants mal qualifiés doivent être reclassés dans le référentiel.

### Confirmation

Contrôles dérivés : CTL-D05-08 (mode de stockage/connexion choisi et documenté selon un
profil de besoin déclaré — mode revue), CTL-D11-01 (performance perçue par l'utilisateur
final mesurée et conforme au profil déclaré — mode automatique). Preuve attendue :
référentiel des profils de besoin + mesure de performance perçue par rapport. Grille :
conforme = mode documenté et performance conforme pour tout rapport ; partiel = mode
documenté sans mesure de performance perçue ; non conforme = mode non justifié.

## Pros and Cons of the Options

### Modes standardisés par profil de besoin
* Good, because prévisibilité et charge maîtrisée, choix toujours justifié.
* Bad, because qualification préalable de chaque rapport dans un profil de besoin.

### Mode unique imposé à tous les rapports
* Good, because règle la plus simple à auditer.
* Bad, because inadapté à certains besoins (temps réel ou gros volumes historiques).

### Choix laissé à chaque auteur de rapport
* Good, because liberté totale d'optimisation locale.
* Bad, because performance et fraîcheur imprévisibles, charge sur la source non anticipée.

## More Information

Instanciations : `profil:databricks-lakehouse` → connexion directe pour les gros volumes
historiques, extraction en mémoire pour les tableaux de bord interactifs ; le profil de
restitution (par ex. `profil:powerbi`) précise les modes disponibles et leurs seuils.
