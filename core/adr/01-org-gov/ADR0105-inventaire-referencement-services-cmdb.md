---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.remediation_team}, équipes d'exploitation"
informed: "équipes produit"
id: ADR0105
domain: "01"
invariant: false
standards: ["ITIL 4 — pratique Service Configuration Management", "ISO/IEC 20000-1:2018 (gestion des configurations et des actifs de service)"]
derived_controls: [CTL-D01-01, CTL-D01-08, CTL-D07-03, CTL-D12-01, CTL-D12-09]
---

# Inventaire et référencement des services (CMDB)

## Context and Problem Statement

Sans référentiel unique des services, applications et composants d'infrastructure,
l'organisation ne peut répondre de façon fiable à des questions d'audit élémentaires
(combien de services existent, qui les possède, de quoi dépendent-ils), et chaque exercice
d'inventaire redevient une collecte manuelle sujette à erreur. Comment maintenir un
référentiel central, à jour, faisant autorité sur l'existence et les relations des
services ?

## Decision Drivers

* Réponse fiable et immédiate aux questions d'inventaire et de dépendance en audit ou en crise
* Fraîcheur du référentiel : un référentiel obsolète est aussi dangereux qu'une absence de référentiel
* Réconciliation automatique avec la réalité technique, plutôt que déclaration purement manuelle
* Référentiel comme source d'autorité unique, pas un énième tableau parallèle

## Considered Options

* Référentiel central des services alimenté par déclaration et réconciliation automatique périodique
* Inventaire reconstitué à la demande, par extraction manuelle lors de chaque audit
* Inventaires locaux tenus par chaque équipe, sans consolidation centrale

## Decision Outcome

Chosen option: "Référentiel central alimenté et réconcilié automatiquement", parce qu'il
garantit seul la fraîcheur du référentiel dans la durée : la déclaration manuelle seule
dérive inévitablement, et l'absence de consolidation centrale rend toute question
transverse irrépondable en temps utile.

### Consequences

* Good, because une question d'audit ou de gestion de crise trouve une réponse immédiate et fiable.
* Good, because la réconciliation automatique détecte les services non déclarés avant qu'ils ne soient découverts lors d'un incident.
* Bad, because la réconciliation automatique exige une instrumentation minimale préalable (tags, interface d'inventaire — lien ADR0102/ADR0103).
* Neutral, because le niveau de détail attendu (jusqu'au composant applicatif ou au seul service) reste un paramètre de profil.

### Confirmation

Contrôles dérivés : CTL-D12-04 (référentiel exhaustif : tout service en production y est
référencé), CTL-D12-05 (réconciliation automatique périodique avec écarts tracés et
résorbés). Preuve attendue : export horodaté du référentiel et rapport de réconciliation
(écarts détectés et résorbés). Grille : conforme = réconciliation automatique active,
écarts résorbés dans un délai déclaré ; partiel = réconciliation manuelle périodique ; non
conforme = référentiel non maintenu ou jamais réconcilié.

## Pros and Cons of the Options

### Référentiel central alimenté et réconcilié automatiquement
* Good, because fraîcheur garantie, réponse immédiate aux questions d'inventaire.
* Bad, because exige une instrumentation préalable minimale (tags, interfaces d'inventaire).

### Inventaire reconstitué à la demande
* Good, because aucun outillage permanent à maintenir.
* Bad, because délai et fiabilité incompatibles avec une gestion de crise.

### Inventaires locaux sans consolidation
* Good, because autonomie complète de chaque équipe.
* Bad, because aucune vue transverse fiable, question d'audit sans réponse unique.

## More Information

Instanciations par profil : `profil:itsm-outille` → référentiel alimenté par découverte
automatique et interface d'inventaire cloud ; `profil:catalogue-developpeur` → catalogue
technique servant de référentiel léger en l'absence d'outil de gestion de services dédié.
