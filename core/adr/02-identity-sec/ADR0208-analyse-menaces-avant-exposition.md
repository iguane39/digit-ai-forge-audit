---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0208
domain: "02"
invariant: false
standards: ["OWASP SAMM v2 — Design: Threat Assessment (D-TA)", "NIST SSDF — PW.1/PW.1.1", "ISO/IEC 27002:2022 — 5.8"]
derived_controls: [CTL-D02-09, CTL-D04-03]
---

# Analyse de menaces avant exposition

## Context and Problem Statement

Le corpus gouverne déjà les secrets, l'authentification et l'exposition via un point de
contrôle unique, mais rien n'impose d'analyser les menaces propres à un composant avant
son exposition. Faute de cette analyse préalable, elles sont découvertes a posteriori —
incident ou test d'intrusion — quand leur correction coûte le plus cher. Comment les
identifier et les traiter systématiquement avant l'exposition ?

## Decision Drivers

* Détection des menaces spécifiques à un composant avant l'exposition, pas après
* Coût de correction très inférieur en conception qu'en production (shift-left)
* Traçabilité : preuve qu'une analyse a été menée, au-delà de l'intuition de l'architecte
* Applicabilité indépendante de la stack ou du type d'exposition

## Considered Options

* Analyse de menaces structurée (décomposition des flux + catégorisation), obligatoire avant toute exposition, avec plan de traitement tracé
* Revue de sécurité informelle laissée à l'appréciation de l'architecte, sans méthode ni trace
* Analyse de menaces réalisée a posteriori, à l'occasion d'un test d'intrusion périodique

## Decision Outcome

Chosen option: "Analyse de menaces structurée et préalable", parce qu'elle seule produit
une preuve d'audit exploitable, s'applique avant l'exposition à coût minimal, et ne
dépend d'aucune méthode propriétaire : toute décomposition des menaces documentée convient.

### Consequences

* Good, because les menaces majeures sont traitées en conception, à coût de correction minimal.
* Good, because trace exploitable en audit : décisions de traitement documentées (accepter/atténuer/transférer).
* Bad, because effort de modélisation à intégrer au cycle de conception, charge additionnelle sur le planning.
* Neutral, because la profondeur de l'analyse doit rester proportionnée à la criticité du composant exposé.

### Confirmation

Contrôles dérivés : CTL-D02-07 (analyse de menaces documentée avant exposition), CTL-D02-08
(plan de traitement des menaces majeures tracé jusqu'à clôture). Preuve : document de
modélisation + registre de traitement. Grille : conforme = analyse réalisée ET plan clos
ou suivi ; partiel = analyse sans suivi ; non conforme = aucune analyse avant exposition.

## Pros and Cons of the Options

### Analyse structurée et préalable
* Good, because preuve d'audit, coût de correction minimal, méthode non propriétaire.
* Bad, because charge de modélisation à intégrer au cycle de conception.

### Revue de sécurité informelle
* Good, because rapide, sans méthode à apprendre.
* Bad, because dépend entièrement de l'expérience individuelle ; aucune trace exploitable.

### Analyse a posteriori (test d'intrusion périodique)
* Good, because valide empiriquement l'état réel du composant exposé.
* Bad, because intervient trop tard : le composant est déjà exposé, correction coûteuse.

## More Information

Manque comblé : le corpus gouvernait déjà les secrets (ADR0201), l'exposition via
passerelle (ADR0301) et l'authentification (ADR0202), mais aucune décision n'imposait
une analyse préalable des menaces propres à un composant — l'inventaire du profil de
référence ne comportait aucun ADR équivalent. Instanciation : `profil:azure` → atelier
de modélisation des menaces (méthode par décomposition des flux) en revue de conception.
