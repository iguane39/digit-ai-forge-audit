---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0305
domain: "03"
invariant: false
standards: ["OWASP ASVS 5.0 — V13", "OWASP Top 10", "ISO/IEC 27002:2022 — 8.20"]
derived_controls: [CTL-D02-02]
---

# Protection périmétrique applicative

## Context and Problem Statement

Toute application ou API exposée publiquement subit des tentatives d'exploitation
automatisées (injection, bots, volumétrie anormale) avant même toute action ciblée.
Comment filtrer ce trafic malveillant au plus près de la frontière, sans reporter cette
charge sur chaque application ?

## Decision Drivers

* Filtrage des attaques applicatives connues avant qu'elles n'atteignent le code métier
* Absorption des pics de trafic malveillant sans dégrader le service légitime
* Mutualisation de la défense pour toute surface exposée publiquement
* Proportionnalité : le niveau de protection doit suivre le niveau réel d'exposition

## Considered Options

* Protection périmétrique applicative mutualisée devant toute surface exposée publiquement
* Protection applicative embarquée dans chaque application (bibliothèques de filtrage)
* Aucune protection dédiée, seule la validation applicative des entrées fait office de filtre

## Decision Outcome

Chosen option: "Protection périmétrique mutualisée", parce qu'elle filtre les attaques
connues et les volumétries anormales avant le code métier, se met à jour une seule fois
pour toutes les applications exposées, et se calibre au niveau d'exposition réel de chaque
surface — d'où son caractère non invariant : une application strictement interne, non
exposée publiquement, peut légitimement s'en dispenser.

### Consequences

* Good, because réduit le volume d'attaques automatisées qui atteint le code applicatif.
* Good, because règles mutualisées et mises à jour centralement pour toutes les surfaces exposées.
* Bad, because faux positifs possibles nécessitant un réglage fin par surface.
* Neutral, because ajoute un point d'inspection supplémentaire dans le chemin de requête.

### Confirmation

Contrôles dérivés : CTL-D02-10 (protection périmétrique applicative active et à jour sur
toute route exposée publiquement), CTL-D02-11 (seuils d'atténuation volumétrique définis et
testés). Preuve attendue : configuration des règles de protection + rapport d'un test de
charge/attaque simulée. Grille : conforme = protection active avec règles à jour sur 100 %
des surfaces publiques ; partiel = protection active mais règles obsolètes ou couverture
partielle ; non conforme = surface publique sans protection et sans justification d'absence
d'exposition.

## Pros and Cons of the Options

### Protection périmétrique mutualisée
* Good, because défense mutualisée, mise à jour centralisée, calibrée à l'exposition réelle.
* Bad, because réglage fin nécessaire pour limiter les faux positifs.

### Protection embarquée par application
* Good, because contrôle fin propre à chaque application.
* Bad, because N implémentations à maintenir, cohérence non garantie entre applications.

### Aucune protection dédiée
* Good, because coût nul.
* Bad, because toute la charge de filtrage repose sur un code applicatif jamais infaillible.

## More Information

Instanciations : `profil:azure` → Web Application Firewall sur Front Door/Application
Gateway + Azure DDoS Protection. S'articule avec le point de contrôle d'exposition unique
(ADR0301), qui en est l'ancrage naturel.
