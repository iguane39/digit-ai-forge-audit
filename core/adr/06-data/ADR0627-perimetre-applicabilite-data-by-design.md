---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}, {roles.compliance_process}"
informed: "toutes les équipes produit"
id: ADR0627
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D15-10]
---

# Périmètre d'application des principes data by design, déclaré et tracé

## Context and Problem Statement

Un référentiel de principes data by design ne s'applique pas à tout : un outil interne sans donnée personnelle et une application exposant un référentiel métier n'appellent pas la même exigence. Quand le périmètre n'est pas déclaré, deux dérives coexistent — des projets s'y soustraient sans que personne ne l'ait décidé, et d'autres s'y plient inutilement. Comment garantir qu'un projet est dans le périmètre, ou hors périmètre, par une décision tracée plutôt que par omission ?

## Decision Drivers

* Applicabilité déterminée par des critères déclarés, pas par l'appréciation du moment
* Sortie de périmètre possible, mais seulement par décision datée et motivée
* Proportionnalité : l'exigence suit la nature des données et l'exposition, pas la taille du projet
* Vérifiabilité en audit : le périmètre se relit, projet par projet

## Considered Options

* Périmètre déterminé par des critères déclarés (nature des données traitées, exposition, criticité métier, caractère personnel ou sensible), consigné par projet, toute exclusion étant motivée et datée
* Application des principes à tous les projets sans distinction
* Applicabilité laissée à l'appréciation de l'équipe projet, sans critère écrit

## Decision Outcome

Chosen option: "Périmètre déterminé par des critères déclarés et consigné par projet", parce que c'est la seule option qui rend l'absence d'évaluation visible : un projet hors périmètre porte une décision datée, un projet dans le périmètre porte une évaluation, et un projet sans ni l'un ni l'autre est un constat d'audit, pas une zone grise.

### Consequences

* Good, because une exclusion devient un acte tracé, opposable, révisable.
* Good, because l'effort d'évaluation se concentre là où les données le justifient.
* Bad, because les critères doivent être maintenus : périmés, ils excluent ce qu'il faudrait inclure.
* Neutral, because un projet peut changer de périmètre en cours de vie — la décision doit alors être rejouée.

### Confirmation

Contrôle dérivé : CTL-D15-10 (l'applicabilité des principes data by design au projet est déterminée par les critères déclarés et consignée, toute exclusion portant un motif et une date — mode déclaratif + revue). Preuve attendue : critères d'applicabilité versionnés, fiche d'applicabilité du projet renseignée et datée, motif d'exclusion le cas échéant. Grille : conforme = applicabilité consignée et cohérente avec les critères ; partiel = applicabilité consignée sans motif, ou datée de plus de 12 mois sur un projet ayant évolué ; non conforme = aucune décision d'applicabilité tracée.

## Pros and Cons of the Options

### Critères déclarés, applicabilité consignée

* Good, because rend l'omission détectable et l'exclusion opposable.
* Bad, because maintenance des critères à assurer.

### Application universelle sans distinction

* Good, because aucune règle d'éligibilité à tenir.
* Bad, because charge disproportionnée sur les petits projets, qui finissent par contourner le dispositif.

### Appréciation libre de l'équipe

* Good, because coût nul, souplesse maximale.
* Bad, because aucune trace : impossible de distinguer un projet exclu d'un projet oublié.

## More Information

Premier volet d'un triptyque : ce périmètre (ADR0627), le calcul de maturité qui en découle, et le verdict opposable qui le conclut (ADR0629). Complète ADR0206 (classification et protection des données personnelles) dont il reprend les critères d'entrée.

**À compléter** (`a_completer: true`) : la source de référence dont cette décision est issue ne cite **aucune norme externe** — le champ `standards` reste vide et doit être renseigné avant toute opposabilité. À compléter également : la liste exacte des critères d'applicabilité et leurs seuils, ainsi que l'ADR du volet « calcul » (non cité par la source et donc non créé ici — il n'est pas inventé).
