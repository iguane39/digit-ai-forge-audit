---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0701
domain: "07"
invariant: true
standards: ["OWASP ASVS 5.0 — V4 (API et services web)", "ISO/IEC 27002:2022 — 8.21 (sécurité des services réseau)", "NIST SP 800-207 (zero trust)"]
derived_controls: [CTL-D01-12]
---

# Échanges inter-applicatifs via tiers de confiance (API)

## Context and Problem Statement

Deux applications qui échangent des données en direct (appel point à point, base
partagée, script ad hoc) créent un couplage fort, une politique de sécurité propre à
chaque liaison, et un flux invisible du reste du système d'information. Comment organiser
les échanges inter-applicatifs pour qu'ils restent gouvernés, sécurisés et observables,
quel que soit le nombre d'applications connectées ?

## Decision Drivers

* Traçabilité de tout échange inter-applicatif (inventaire des flux, pas de liaison cachée)
* Politique de sécurité homogène (authentification, autorisation, chiffrement) par échange
* Découplage : une application ne dépend pas de l'implémentation interne d'une autre
* Capacité à faire évoluer une application sans casser ses consommateurs

## Considered Options

* Échanges via un tiers de confiance exposant une interface API contractuelle
* Intégration point à point directe entre applications (appels ou partage de base)
* Intégration point à point avec documentation a posteriori des flux

## Decision Outcome

Chosen option: "Échanges via un tiers de confiance", parce que c'est la seule option qui
rend chaque échange inventoriable, applique une politique de sécurité unique et découple
les applications de l'implémentation de leurs partenaires — indépendamment du nombre de
liaisons en jeu.

### Consequences

* Good, because chaque échange est un contrat explicite, testable et versionné indépendamment des deux parties.
* Good, because l'inventaire des flux inter-applicatifs devient une preuve d'audit directe (D01, D02).
* Bad, because un effort de conception (contrat, contrôle d'accès) est requis avant tout premier échange.
* Neutral, because une latence d'appel supplémentaire par rapport à un accès direct.

### Confirmation

Contrôles dérivés : CTL-D01-01 (aucun échange inter-applicatif hors tiers de confiance
contractuel — mode revue), CTL-D02-01 (authentification et autorisation actives sur
chaque échange exposé — mode automatique). Preuve attendue : inventaire des flux
inter-applicatifs + contrat d'interface publié. Grille : conforme = tous les échanges
recensés passent par un tiers de confiance contractuel ; partiel = exceptions documentées
et dérogées ; non conforme = échange direct non tracé détecté.

## Pros and Cons of the Options

### Tiers de confiance contractuel
* Good, because contrat explicite, sécurité homogène, inventaire par construction.
* Bad, because effort de conception initial par échange.

### Intégration point à point directe
* Good, because rapide à mettre en œuvre pour un besoin isolé.
* Bad, because couplage fort, politiques divergentes, flux invisibles à l'échelle du système.

### Point à point + documentation a posteriori
* Good, because coût immédiat nul.
* Bad, because la documentation arrive après le couplage — l'inventaire reste toujours en retard.

## More Information

Instanciations : `profil:azure` → API Management en tiers de confiance entre
applications ; autres profils → passerelle d'intégration ou bus d'échange équivalent.
Généralise les décisions d'échange inter-applicatif du profil de référence (tiers de
confiance API).
