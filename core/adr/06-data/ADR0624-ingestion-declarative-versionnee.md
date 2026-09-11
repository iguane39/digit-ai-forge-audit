---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.architect}, équipes data, équipe d'exploitation"
informed: "toutes les équipes produit"
id: ADR0624
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D05-18]
---

# Ingestion des données définie de façon déclarative et versionnée

## Context and Problem Statement

Une chaîne d'ingestion écrite en scripts impératifs décrit une suite d'actions, jamais l'état attendu. Sa reprise après incident dépend de l'ordre dans lequel les étapes ont échoué, sa qualité se vérifie a posteriori, et sa revue suppose de lire le code pour reconstituer ce qui devrait sortir. Comment garantir qu'une chaîne d'ingestion est reprenable, contrôlable et revoyable sans exécuter le code qui l'implémente ?

## Decision Drivers

* Reprise après incident déterministe : le pipeline sait recalculer ce qui manque
* Attentes de qualité (schéma, contraintes, fraîcheur) déclarées avec le flux, pas à côté
* Revue possible sur la déclaration seule, avant exécution
* Versionnement et promotion par la chaîne de livraison, comme tout artefact de code

## Considered Options

* Ingestion décrite de façon déclarative (état cible, dépendances entre jeux de données, attentes de qualité), versionnée et promue par la chaîne de livraison
* Scripts impératifs versionnés, orchestrés par un ordonnanceur externe
* Ingestion configurée dans l'interface de l'outil d'orchestration, sans artefact versionné

## Decision Outcome

Chosen option: "Ingestion déclarative versionnée", parce que c'est la seule option où la reprise, la qualité et la revue reposent sur le même artefact : la déclaration porte l'état attendu, les dépendances et les attentes de qualité, se relit sans être exécutée, et suit le cycle de vie du code — revue, promotion, retour arrière.

### Consequences

* Good, because la reprise après incident se déduit de la déclaration, pas de l'historique d'exécution.
* Good, because les attentes de qualité vivent avec le flux : elles ne peuvent pas être oubliées à la mise en service.
* Bad, because un traitement franchement impératif (appel externe, logique séquentielle) s'exprime mal en déclaratif et devra être isolé.
* Neutral, because impose un outil d'ingestion capable d'exécuter une déclaration, ce qui contraint le choix de plateforme.

### Confirmation

Contrôle dérivé : CTL-D05-18 (les chaînes d'ingestion alimentant l'application sont définies par un artefact déclaratif versionné, portant les dépendances et les attentes de qualité, et promu par la chaîne de livraison — mode automatique + revue). Preuve attendue : artefacts de définition des pipelines versionnés, attentes de qualité déclarées, et trace de promotion par la chaîne de livraison. Grille : conforme = 100 % des chaînes d'ingestion déclarées et versionnées, attentes de qualité présentes ; partiel = déclaration versionnée sans attentes de qualité, ou couverture partielle ; non conforme = ingestion configurée hors versionnement, ou scripts impératifs non revus.

## Pros and Cons of the Options

### Ingestion déclarative versionnée

* Good, because reprise, qualité et revue portées par un artefact unique et relisible.
* Bad, because expressivité limitée sur les traitements franchement séquentiels.

### Scripts impératifs versionnés

* Good, because aucune limite d'expressivité ; outillage minimal.
* Bad, because la reprise et la qualité restent à écrire à la main, donc souvent absentes.

### Configuration dans l'interface de l'outil

* Good, because mise en service immédiate, sans chaîne de livraison.
* Bad, because aucun versionnement, aucune revue, aucun retour arrière — l'état de production n'est reconstituable par personne.

## More Information

Complète ADR0605 (règles et seuils de qualité des données) en imposant **où** ces règles vivent, et ADR0504 (infrastructure comme code, états distants et portes) en étendant la même exigence aux chaînes de données. Instanciations par profil : `profil:databricks-lakehouse` → pipelines de tables déclaratives et paquet de déploiement associé ; `profil:azure` → définitions de pipeline versionnées et promues par la chaîne de livraison.

**À compléter** (`a_completer: true`) : la source de référence dont cette décision est issue ne cite **aucune norme externe** — le champ `standards` reste vide et doit être renseigné avant toute opposabilité. À compléter également : la frontière exacte entre ce qui doit rester déclaratif et ce qui peut rester impératif, non fournie par la source.
