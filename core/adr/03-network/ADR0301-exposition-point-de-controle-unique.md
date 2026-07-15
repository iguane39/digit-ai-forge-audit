---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0301
domain: "03"
invariant: true
standards: ["NIST SP 800-207 (zero trust)", "OWASP ASVS 5.0 — V13", "ISO/IEC 27002:2022 — 8.20/8.21/8.22"]
derived_controls: [CTL-D02-04]
---

# Exposition applicative via un point de contrôle unique

## Context and Problem Statement

Chaque application exposée directement multiplie les surfaces d'attaque, les politiques
divergentes (authentification, TLS, quotas) et les angles morts d'observabilité. Comment
exposer des applications et des API de façon uniforme, contrôlée et auditable ?

## Decision Drivers

* Uniformité des politiques de sécurité aux frontières (authN/Z, TLS, quotas, WAF)
* Inventaire exhaustif de ce qui est exposé (aucune exposition « sauvage »)
* Observabilité centralisée des accès entrants
* Découplage entre consommateurs et topologie interne

## Considered Options

* Point de contrôle d'exposition unique (passerelle) devant toute application/API
* Exposition directe par application, avec politique par équipe
* Exposition directe + revue de sécurité a posteriori

## Decision Outcome

Chosen option: "Point de contrôle unique", parce qu'il rend les politiques de frontière
uniformes et vérifiables en un lieu, produit l'inventaire d'exposition par construction,
et constitue le prérequis d'une posture zero-trust — quel que soit l'hébergeur.

### Consequences

* Good, because une seule politique TLS/authentification/quotas à auditer (D02, D03).
* Good, because tout ce qui est exposé est connu : l'inventaire d'exposition devient une preuve d'audit.
* Bad, because point de passage critique : dimensionnement et haute disponibilité à gouverner.
* Neutral, because latence marginale ajoutée à chaque appel.

### Confirmation

Contrôles dérivés : CTL-D03-05 (aucune exposition hors passerelle — vérification par
inventaire réseau), CTL-D02-04 (politiques de frontière actives sur 100 % des routes).
Preuve : inventaire des points d'entrée + configuration de la passerelle. Grille :
conforme = 0 exposition directe ; partiel = exceptions documentées avec dérogation ;
non conforme = exposition directe non tracée.

## Pros and Cons of the Options

### Point de contrôle unique
* Good, because politiques uniformes, inventaire par construction, audit en un point.
* Bad, because criticité du composant (HA requise).

### Exposition directe par application
* Good, because autonomie des équipes, pas de dépendance partagée.
* Bad, because politiques divergentes, inventaire introuvable, N surfaces à auditer.

### Exposition directe + revue a posteriori
* Good, because coût initial nul.
* Bad, because la revue constate les écarts après exposition — trop tard par conception.

## More Information

Instanciations : `profil:azure` → APIM en tiers de confiance + WAF ;
autres profils → passerelle équivalente (API gateway managée). Généralise les décisions
d'exposition du profil de référence (exposition applicative, connectivité comme point de
contrôle, APIM tiers de confiance).
