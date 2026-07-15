---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes d'exploitation, architectes"
informed: "équipes produit"
id: ADR0401
domain: "04"
invariant: true
standards: ["ISO/IEC 25010 (analysabilité, fiabilité)", "DORA (Accelerate) (MTTR)", "ISO/IEC 27002:2022 — 8.15"]
derived_controls: [CTL-D10-01, CTL-D10-02, CTL-D10-03, CTL-D10-04, CTL-D10-05, CTL-D10-06, CTL-D10-11, CTL-D10-13]
---

# Observabilité par défaut : logs structurés, métriques, traces

## Context and Problem Statement

Sans télémétrie normalisée dès la conception, chaque incident se diagnostique « à
l'aveugle » et chaque audit d'exploitation échoue faute de preuves. Quel socle minimal
d'observabilité toute application doit-elle embarquer, indépendamment de sa stack ?

## Decision Drivers

* Diagnostic rapide (MTTR) et preuves d'exploitation opposables en audit (D10, D12)
* Corrélation bout-en-bout des requêtes entre composants
* Neutralité technologique : le standard d'instrumentation ne doit pas imposer un éditeur
* Maîtrise du volume et du coût de télémétrie

## Considered Options

* Instrumentation normalisée des 3 signaux (logs structurés, métriques, traces) vers une plateforme unifiée
* Logs applicatifs seuls, collectés par fichier
* Laisser chaque équipe choisir son instrumentation et sa destination

## Decision Outcome

Chosen option: "Instrumentation normalisée des 3 signaux", parce qu'elle seule permet la
corrélation inter-composants, fournit les preuves attendues par le référentiel (D10 : 13
thèmes), et reste agnostique : le standard d'instrumentation est ouvert, la plateforme de
destination est un choix de profil.

### Consequences

* Good, because MTTR mesurable et amélioré ; les dashboards et alertes deviennent des preuves d'audit.
* Good, because la corrélation par identifiant de trace traverse les frontières de services.
* Bad, because volume/coût de télémétrie à gouverner (échantillonnage, rétention — lien ADR0404).
* Neutral, because effort d'instrumentation initial par service.

### Confirmation

Contrôles dérivés : CTL-D10-01 (logs structurés + niveaux normalisés), CTL-D10-02
(traces corrélées sur les parcours critiques), CTL-D10-06 (alertes fondées sur SLO —
lien ADR0405). Preuve : extraits de logs structurés, capture de trace bout-en-bout,
définition des SLO. Grille : conforme = 3 signaux actifs et corrélés ; partiel = logs
structurés seuls ; non conforme = logs non structurés ou absents.

## Pros and Cons of the Options

### Trois signaux normalisés vers une plateforme unifiée
* Good, because corrélation, preuves, MTTR ; agnostique par le standard ouvert.
* Bad, because coût de plateforme et discipline d'instrumentation.

### Logs fichiers seuls
* Good, because trivial à mettre en place.
* Bad, because pas de corrélation ni de métriques ; preuves faibles ; diagnostic lent.

### Choix libre par équipe
* Good, because autonomie maximale.
* Bad, because N plateformes, pas de corrélation transverse, audit d'exploitation impossible.

## More Information

Instanciations : `profil:elastic` → plateforme unifiée + schéma commun de champs ;
standard d'instrumentation recommandé au niveau core : OpenTelemetry (standard ouvert,
non lié à un éditeur — admissible dans le core au titre de la règle d'arrêt : c'est une
spécification, pas un produit).
