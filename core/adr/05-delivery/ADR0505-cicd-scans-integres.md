---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "équipes produit"
id: ADR0505
domain: "05"
invariant: true
standards: ["NIST SSDF — PW.7", "NIST SSDF — PW.8", "NIST SSDF — PS.1", "OWASP SAMM — Verification"]
derived_controls: [CTL-D02-01, CTL-D02-08, CTL-D06-04, CTL-D08-02, CTL-D08-03, CTL-D08-06, CTL-D09-03]
profile_bindings: optional
---

# CI/CD avec scans intégrés (SAST, secrets, dépendances)

## Context and Problem Statement

Une vulnérabilité de code, un secret oublié ou une dépendance connue pour être compromise
ne doivent pas dépendre d'une vigilance humaine pour être détectés avant la production.
Comment intégrer la détection de ces trois classes de risque directement dans le chemin de
livraison, de façon systématique et non contournable ?

## Decision Drivers

* Détection avant production plutôt qu'en réaction à un incident
* Systématicité : la détection ne doit pas dépendre d'une action volontaire
* Couverture des trois surfaces majeures : code, secrets, dépendances tierces
* Effet bloquant proportionné à la gravité constatée

## Considered Options

* Scans SAST, secrets et dépendances intégrés en gate bloquante dans le pipeline
* Scans exécutés périodiquement hors pipeline, rapport envoyé aux équipes
* Revue de sécurité manuelle ponctuelle avant les mises en production majeures

## Decision Outcome

Chosen option: "Scans intégrés en gate bloquante", parce que c'est la seule option qui rend
la détection systématique et antérieure à la mise en production, sans dépendre d'une
planification manuelle ni de la disponibilité d'un relecteur spécialisé.

### Consequences

* Good, because les trois classes de risque sont couvertes avant toute mise en production.
* Good, because le résultat des scans devient une preuve d'audit horodatée par version.
* Bad, because des faux positifs mal calibrés peuvent ralentir la livraison (mitigé par une dérogation tracée).
* Neutral, because effort initial de calibration des règles par type de projet.

### Confirmation

Contrôles dérivés : CTL-D09-07 (scans SAST, secrets et dépendances exécutés à chaque
intégration, gate bloquante sur toute vulnérabilité critique), CTL-D08-02 (résultat des
scans tracé par version comme critère de qualité du code). Preuve : configuration des gates
+ rapports de scan sur l'historique. Grille : conforme = 3 scans actifs et bloquants ;
partiel = scans actifs non bloquants ; non conforme = absence de scan constatée.

## Pros and Cons of the Options

### Scans intégrés en gate bloquante
* Good, because systématique, antérieur à la production, tracé par version.
* Bad, because exige une calibration continue pour limiter les faux positifs.

### Scans périodiques hors pipeline
* Good, because plus simple à mettre en œuvre initialement.
* Bad, because une version vulnérable peut être livrée avant le prochain cycle de scan.

### Revue manuelle ponctuelle
* Good, because jugement humain possible sur les cas complexes.
* Bad, because dépend de la disponibilité d'un expert ; non systématique, non reproductible.

## More Information

Instanciations : `profil:azure` → extensions de scan intégrées au pipeline managé ; autres
profils → outillage SAST/secrets/SCA équivalent. Le profil fournit les seuils de sévérité
bloquants par type de projet.
