---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0705
domain: "07"
invariant: false
standards: ["EIP — Enterprise Integration Patterns (Idempotent Receiver, Dead Letter Channel)", "ISO/IEC 25010 (fiabilité)"]
derived_controls: [CTL-D06-01]
---

# Idempotence et reprise des intégrations asynchrones

## Context and Problem Statement

Une intégration asynchrone (file de messages, notification d'événement, tâche différée)
peut livrer un message plus d'une fois, échouer partiellement, ou être rejouée après
incident. Sans garantie d'idempotence, un rejeu ou un doublon produit un effet dupliqué
(double paiement, double création). Comment garantir qu'une intégration asynchrone peut
être reçue plusieurs fois sans effet de bord ?

## Decision Drivers

* Aucune duplication d'effet métier en cas de livraison multiple d'un même message
* Reprise possible après incident sans intervention manuelle au cas par cas
* Traçabilité de l'état de traitement de chaque message (traité, en cours, en échec)
* Isolation des messages en échec répété pour ne pas bloquer le flux sain

## Considered Options

* Traitement idempotent avec identifiant unique de message et file de rejet dédiée
* Traitement au mieux, sans garantie d'idempotence ni file de rejet
* Déduplication manuelle a posteriori sur constat d'anomalie

## Decision Outcome

Chosen option: "Traitement idempotent avec identifiant unique et file de rejet", parce
que c'est la seule option qui neutralise par construction l'effet d'une livraison
dupliquée et permet une reprise automatisée après incident, quel que soit le mécanisme de
messagerie sous-jacent.

### Consequences

* Good, because un message livré plusieurs fois ne produit qu'un seul effet métier.
* Good, because les messages en échec répété sont isolés et rejouables sans bloquer le flux sain.
* Bad, because chaque traitement doit conserver un état de déduplication (coût de conception).
* Neutral, because une politique de nouvelle tentative (délai, nombre) doit être définie par intégration.

### Confirmation

Contrôles dérivés : CTL-D01-05 (identifiant unique de message et vérification
d'idempotence documentés par intégration — mode revue), CTL-D06-01 (politique de
nouvelle tentative bornée et file de rejet active — mode automatique). Preuve attendue :
conception de l'idempotence par intégration + configuration de la file de rejet. Grille :
conforme = idempotence démontrée et file de rejet active ; partiel = idempotence
démontrée sans file de rejet ; non conforme = aucune garantie d'idempotence.

## Pros and Cons of the Options

### Traitement idempotent + file de rejet
* Good, because neutralise les doublons, reprise automatisée, isolation des échecs.
* Bad, because conception et stockage d'état de déduplication à charge de l'intégration.

### Traitement au mieux sans garantie
* Good, because implémentation la plus simple et la plus rapide.
* Bad, because doublon ou message perdu au moindre incident, sans détection.

### Déduplication manuelle a posteriori
* Good, because aucun effort de conception préalable.
* Bad, because détection tardive, corrective, non industrialisable à l'échelle.

## More Information

Instanciations : `profil:azure` → bus de messages géré avec détection de doublons et
file de lettres mortes native ; autres profils → courtier de messages équivalent. Le
motif d'intégration (récepteur idempotent, canal de lettres mortes) reste un standard
ouvert, indépendant du courtier retenu.
