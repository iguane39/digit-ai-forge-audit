---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes produit, {roles.remediation_team}, {roles.security_officer}"
informed: "toutes les équipes produit"
id: ADR0709
domain: "07"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D01-16]
---

# Socle technologique applicatif normalisé

## Context and Problem Statement

Chaque projet choisit ses langages et ses cadres applicatifs au démarrage, selon les compétences présentes ce jour-là. Au bout de quelques années, l'organisation exploite un parc où chaque application demande des compétences distinctes : la reprise en maintenance suppose un recrutement, la correction d'une vulnérabilité doit être rejouée dans autant de chaînes qu'il y a de technologies, et la mutualisation des bibliothèques internes devient impossible. Comment garantir qu'une application reste maintenable par d'autres que ceux qui l'ont écrite ?

## Decision Drivers

* Transférabilité : une application se reprend avec les compétences déjà présentes
* Mutualisation de l'outillage transverse (journalisation, authentification, analyse de vulnérabilités)
* Correction d'une vulnérabilité applicable à l'ensemble du parc, pas à une application
* Liberté d'innovation préservée là où elle est justifiée, mais par dérogation tracée

## Considered Options

* Liste courte de langages et de cadres applicatifs normalisés, tenue à jour et versionnée, tout écart passant par une dérogation motivée et datée
* Liberté totale de choix technologique par équipe
* Technologie unique imposée sans dérogation possible

## Decision Outcome

Chosen option: "Liste courte normalisée avec dérogation tracée", parce que c'est la seule option qui protège la transférabilité sans interdire l'exception : le parc reste maintenable par un vivier de compétences borné et outillé transversalement, tandis qu'un besoin réellement spécifique reste possible — au prix d'une décision écrite, datée, et revue à échéance.

### Consequences

* Good, because une application se reprend sans recrutement dédié ni montée en compétence spécifique.
* Good, because l'outillage transverse ne se réimplémente pas par technologie.
* Bad, because une technologie mieux adaptée à un cas précis se paie d'une dérogation à défendre.
* Neutral, because la liste doit vivre : figée, elle vieillit et pousse les équipes à la contourner.

### Confirmation

Contrôle dérivé : CTL-D01-16 (les langages et cadres applicatifs employés par l'application figurent dans la liste normalisée en vigueur, tout écart portant une dérogation motivée, datée et à échéance — mode automatique + revue). Preuve attendue : liste normalisée versionnée, inventaire des technologies réellement employées par l'application (manifestes de dépendances, fichiers de construction), dérogations datées le cas échéant. Grille : conforme = technologies employées toutes dans la liste, ou couvertes par une dérogation en cours de validité ; partiel = dérogation présente mais sans échéance ; non conforme = technologie hors liste sans dérogation.

## Pros and Cons of the Options

### Liste courte normalisée avec dérogation

* Good, because transférabilité et mutualisation, sans fermer la porte à l'exception justifiée.
* Bad, because maintenance de la liste et instruction des dérogations à assurer.

### Liberté totale par équipe

* Good, because chaque équipe optimise pour son cas d'usage immédiat.
* Bad, because le parc devient un ensemble d'îlots ; la maintenance dépend des personnes.

### Technologie unique sans dérogation

* Good, because mutualisation maximale de l'outillage et des compétences.
* Bad, because inadaptée aux cas atypiques, elle se contourne en silence plutôt qu'elle ne se discute.

## More Information

Complète ADR0104 (modèle d'ingénierie de plateforme) sur le volet technologique et ADR0209 (chaîne d'approvisionnement) dont l'outillage suppose un nombre borné d'écosystèmes de dépendances. Instanciations par profil : la liste elle-même est une donnée d'organisation, jamais du core — elle vit dans l'overlay du tenant, datée et sourcée.

**À compléter** (`a_completer: true`) : la source de référence dont cette décision est issue ne cite **aucune norme externe** — le champ `standards` reste vide et doit être renseigné avant toute opposabilité. À compléter également : le processus d'instruction et la durée de validité d'une dérogation, non fournis par la source.
