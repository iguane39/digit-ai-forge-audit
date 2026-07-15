---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes d'exploitation, architectes"
informed: "équipes produit"
id: ADR0403
domain: "04"
invariant: false
standards: ["ISO/IEC 20000-1 (gestion des services)", "ITIL 4 — pratique de gestion des événements", "ISO/IEC 25010 (fiabilité)"]
derived_controls: [CTL-D10-10, CTL-D12-02]
---

# Supervision des flux d'échange inter-applicatifs

## Context and Problem Statement

Une intégration entre applications qui échoue silencieusement — file bloquée, latence
dégradée, volumétrie anormale — n'est souvent détectée que par son impact final, bien après
la cause. Comment superviser la santé des échanges inter-applicatifs pour détecter une
dégradation avant l'incident visible par l'utilisateur ?

## Decision Drivers

* Détection précoce d'une dégradation d'échange avant son impact utilisateur final
* Visibilité sur des flux qui traversent plusieurs équipes et systèmes
* Distinction entre panne d'un composant et rupture d'un flux d'intégration
* Effort de supervision proportionné au nombre et à la criticité réels des intégrations

## Considered Options

* Supervision dédiée des flux d'échange (latence, erreurs, volumétrie, profondeur de file) avec seuils déclarés
* Supervision indirecte : seuls les composants aux extrémités du flux sont supervisés
* Aucune supervision dédiée, l'incident est signalé par les utilisateurs finaux

## Decision Outcome

Chosen option: "Supervision dédiée des flux d'échange", parce qu'elle seule distingue une
rupture d'intégration d'une panne de composant et permet une détection avant l'impact
utilisateur ; son intensité est calibrée à la criticité de chaque flux, ce qui justifie son
caractère non invariant.

### Consequences

* Good, because une dégradation d'échange est détectée avant de dégrader l'expérience utilisateur.
* Good, because la cause (flux vs composant) est distinguée dès la détection.
* Bad, because ajoute des sondes et des seuils à définir et maintenir par flux.
* Neutral, because la criticité de chaque flux doit être déclarée pour calibrer l'effort de supervision.

### Confirmation

Contrôles dérivés : CTL-D10-05 (supervision automatisée des flux d'échange : latence, taux
d'erreur, volumétrie, profondeur de file, avec seuils déclarés par flux critique),
CTL-D12-01 (procédure de détection et d'escalade d'une rupture de flux inter-applicatif).
Preuve attendue : tableau de bord de supervision des flux + procédure d'escalade
documentée. Grille : conforme = flux critiques supervisés avec seuils et escalade testée ;
partiel = supervision partielle ou seuils non calibrés ; non conforme = aucune supervision
dédiée des flux.

## Pros and Cons of the Options

### Supervision dédiée des flux d'échange
* Good, because détection précoce, cause distinguée dès l'alerte.
* Bad, because effort de définition et de maintenance des seuils par flux.

### Supervision indirecte des seules extrémités
* Good, because réutilise l'instrumentation déjà en place sur les composants.
* Bad, because une rupture du flux lui-même (file, transformation) reste invisible.

### Aucune supervision dédiée
* Good, because coût nul à court terme.
* Bad, because l'utilisateur final devient le détecteur d'incident.

## More Information

Instanciations : `profil:azure` → métriques natives du service d'intégration (Service Bus,
API Management) + alertes Azure Monitor. S'articule avec l'observabilité par défaut
(ADR0401), dont elle spécialise le sous-ensemble intégration.
