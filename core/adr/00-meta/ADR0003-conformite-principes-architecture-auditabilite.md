---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architectes, {roles.change_board}"
informed: "équipes produit"
id: ADR0003
domain: "00"
invariant: false
standards: ["TOGAF ADM — Phase G (gouvernance de la mise en œuvre)", "ISO/IEC/IEEE 42010:2022 (conformité de la description d'architecture)"]
derived_controls: [CTL-D00-05, CTL-D00-09, CTL-D01-03, CTL-D01-06, CTL-D13-04]
---

# Conformité aux principes d'architecture et auditabilité

## Context and Problem Statement

Des décisions d'implémentation prises hors de tout cadre architectural produisent une
dérive silencieuse entre l'architecture cible documentée et ce qui tourne réellement en
production, jusqu'à rendre tout audit ultérieur invérifiable. Comment vérifier, de façon
continue et opposable, que chaque projet reste conforme aux principes d'architecture actés
et documente explicitement ses écarts éventuels ?

## Decision Drivers

* Détection précoce de la dérive entre architecture documentée et architecture réelle
* Opposabilité : un écart doit être visible et justifié, jamais silencieux
* Auditabilité : chaque décision de conception doit se retracer jusqu'à un principe ou un standard
* Applicabilité transverse, quel que soit le type de projet ou la pile technique retenue

## Considered Options

* Revue de conformité architecturale formalisée à des jalons du cycle de vie, avec registre des écarts
* Conformité laissée à l'appréciation de chaque équipe projet, sans jalon ni registre dédié
* Contrôle uniquement a posteriori, à l'occasion d'un audit externe ponctuel

## Decision Outcome

Chosen option: "Revue de conformité formalisée + registre des écarts", parce qu'elle seule
détecte la dérive au moment où elle est la moins coûteuse à corriger, et produit par
construction la preuve d'auditabilité qu'un contrôle a posteriori ne peut reconstituer
rétroactivement.

### Consequences

* Good, because chaque écart d'architecture est déclaré, motivé et daté au lieu d'être découvert tardivement.
* Good, because le registre des écarts alimente directement la preuve d'audit sans travail de reconstitution.
* Bad, because la revue ajoute un jalon de gouvernance au cycle de vie projet, dont la charge et le délai doivent être budgétés.
* Neutral, because le niveau d'exigence (fréquence, granularité des jalons) reste un paramètre de profil ou d'overlay.

### Confirmation

Contrôles dérivés : CTL-D01-01 (décisions de conception tracées jusqu'à un principe ou un
ADR core), CTL-D13-05 (registre des écarts d'architecture tenu à jour et accessible).
Preuve attendue : compte rendu de revue de conformité et registre des écarts avec statut
de remédiation. Grille : conforme = revue tenue à chaque jalon, écarts tous justifiés ;
partiel = revue tenue, écarts non tous justifiés ; non conforme = absence de revue ou de
registre des écarts.

## Pros and Cons of the Options

### Revue formalisée + registre des écarts
* Good, because dérive détectée tôt, preuve d'audit produite par construction.
* Bad, because jalon de gouvernance supplémentaire à instruire dans chaque projet.

### Conformité laissée à l'appréciation de l'équipe
* Good, because aucune charge de gouvernance centrale.
* Bad, because dérive non détectée avant l'audit, écarts non tracés ni justifiés.

### Contrôle a posteriori uniquement
* Good, because coût nul tant qu'aucun audit n'est déclenché.
* Bad, because la dérive constatée est déjà ancrée en production, correction coûteuse.

## More Information

Instanciations : `profil:suivi-tickets` → registre des écarts porté par un système de
gestion de tickets dédié ; `profil:leger` → écarts consignés directement en ADR liés. Le
jalon de revue s'aligne, à titre d'exemple, sur la phase de gouvernance de mise en œuvre
d'un cadre d'architecture (telle la Phase G d'une ADM).
