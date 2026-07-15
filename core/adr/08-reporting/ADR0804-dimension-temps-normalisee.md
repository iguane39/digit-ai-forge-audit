---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, architectes data"
informed: "équipes produit"
id: ADR0804
domain: "08"
invariant: false
standards: ["Kimball — dimension de temps conformée", "DMBOK2 (modélisation des données)"]
derived_controls: [CTL-D05-13]
---

# Dimension de temps normalisée

## Context and Problem Statement

Quand chaque rapport définit sa propre notion de semaine, d'exercice fiscal ou de jour
ouvré, comparer deux rapports dans le temps devient impossible sans retraitement manuel —
un même mois ne recouvre pas la même période d'un rapport à l'autre. Comment garantir que
toute restitution s'appuie sur une définition unique et partagée du temps ?

## Decision Drivers

* Comparabilité directe des rapports entre eux sur les mêmes périodes
* Prise en compte homogène des calendriers spécifiques (exercice fiscal, jours ouvrés)
* Réduction des retraitements manuels de dates avant toute comparaison temporelle
* Cohérence des regroupements (semaine, mois, trimestre) quel que soit le rapport

## Considered Options

* Dimension de temps normalisée, gouvernée, partagée par tous les modèles sémantiques
* Colonnes de date brutes, retraitées séparément par chaque rapport
* Calendrier propre à chaque domaine métier, sans réconciliation entre eux

## Decision Outcome

Chosen option: "Dimension de temps normalisée partagée", parce qu'elle garantit que
deux rapports agrègent une période exactement de la même manière, ce qu'aucune des deux
autres options ne peut assurer une fois la définition du temps laissée à l'appréciation
de chaque équipe.

### Consequences

* Good, because toute comparaison temporelle repose sur les mêmes bornes de période.
* Good, because les calendriers spécifiques sont résolus une seule fois pour tous les rapports.
* Bad, because faire évoluer une règle de calendrier impacte potentiellement tous les rapports.
* Neutral, because les rapports existants sur dates brutes doivent être migrés vers la dimension.

### Confirmation

Contrôle dérivé : CTL-D05-07 (dimension de temps partagée utilisée par tout modèle
sémantique exposé en restitution — mode revue). Preuve attendue : définition de la
dimension de temps + liste des modèles sémantiques qui la référencent. Grille : conforme
= 100 % des modèles sémantiques référencent la dimension partagée ; partiel = migration
en cours sur périmètre limité et daté ; non conforme = dates brutes retraitées
indépendamment par rapport.

## Pros and Cons of the Options

### Dimension de temps normalisée partagée
* Good, because comparabilité garantie, calendriers spécifiques résolus une fois.
* Bad, because gouvernance centralisée requise sur toute évolution de calendrier.

### Colonnes de date brutes retraitées par rapport
* Good, because flexibilité totale laissée à chaque rapport.
* Bad, because retraitement dupliqué, risque d'erreur et de divergence entre rapports.

### Calendrier propre à chaque domaine métier
* Good, because adapté finement aux spécificités d'un domaine.
* Bad, because aucune réconciliation possible lors d'une comparaison transverse.

## More Information

Instanciations : la dimension de temps conformée (motif de modélisation dimensionnelle)
reste un standard ouvert ; `profil:powerbi` → table de dates certifiée publiée et
référencée par tout modèle sémantique.
