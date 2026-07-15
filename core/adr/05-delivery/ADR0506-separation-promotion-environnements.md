---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.change_board}, équipes d'exploitation"
informed: "équipes produit"
id: ADR0506
domain: "05"
invariant: true
standards: ["12-Factor — X. Dev/prod parity", "DORA (Accelerate) — capacité de livraison continue (gestion des environnements)", "NIST SSDF — PO.5"]
derived_controls: [CTL-D09-04]
profile_bindings: optional
---

# Séparation et promotion contrôlée des environnements

## Context and Problem Statement

Des environnements qui partagent des ressources sensibles (données, identités, réseau), ou
qu'un changement peut atteindre en sautant une étape, font perdre tout le bénéfice d'une
chaîne de validation progressive. Comment garantir que chaque environnement reste isolé et
qu'un changement ne progresse que par les étapes prévues, sans raccourci ?

## Decision Drivers

* Isolation réelle des environnements (pas seulement nominale) sur données et identités
* Impossibilité de contourner une étape de la chaîne de promotion
* Similarité suffisante entre environnements pour que la validation soit représentative
* Auditabilité de chaque franchissement d'étape (qui a approuvé, quand)

## Considered Options

* Environnements isolés, promotion strictement séquentielle via pipeline avec approbations
* Environnements isolés, mais promotion possible manuellement en cas d'urgence
* Environnements partiellement partagés (bases, identités) pour réduire les coûts

## Decision Outcome

Chosen option: "Environnements isolés, promotion séquentielle via pipeline", parce que
c'est la seule option qui rend une étape sautée techniquement impossible plutôt que
seulement déconseillée, et qui produit par construction la preuve de chaque approbation de
passage d'étape.

### Consequences

* Good, because aucun changement n'atteint un environnement sans avoir traversé les étapes précédentes.
* Good, because l'isolation limite l'impact d'une compromission à un seul environnement.
* Bad, because coût de duplication des ressources par environnement (données, identités, réseau).
* Neutral, because exige un jeu de données représentatif mais non sensible pour les environnements amont.

### Confirmation

Contrôles dérivés : CTL-D09-08 (promotion inter-environnements exclusivement via le
pipeline, avec approbation tracée à chaque étape), CTL-D12-01 (environnements isolés :
aucune ressource sensible partagée entre eux). Preuve : configuration des approbations de
promotion + inventaire des ressources par environnement. Grille : conforme = isolation
complète et promotion séquentielle tracée ; partiel = isolation partielle documentée ; non
conforme = étape sautée ou ressource sensible partagée constatée.

## Pros and Cons of the Options

### Isolation totale, promotion séquentielle via pipeline
* Good, because étape sautée rendue impossible, preuve d'approbation par construction.
* Bad, because coût de duplication des ressources par environnement.

### Isolation totale, urgence manuelle tolérée
* Good, because souplesse perçue en cas d'incident critique.
* Bad, because l'urgence devient un contournement récurrent de la chaîne de validation.

### Environnements partiellement partagés
* Good, because coût réduit à court terme.
* Bad, because un incident sur une ressource partagée impacte plusieurs environnements.

## More Information

Instanciations : `profil:azure` → abonnements ou groupes de ressources distincts par
environnement, approbations portées par le pipeline managé. Généralise, côté mécanique de
livraison, la chaîne de promotion déjà gouvernée en responsabilité par l'ADR0106 (domaine 01).
