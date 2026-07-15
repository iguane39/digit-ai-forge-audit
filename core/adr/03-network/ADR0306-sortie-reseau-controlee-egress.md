---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes, équipes réseau"
informed: "équipes produit"
id: ADR0306
domain: "03"
invariant: false
standards: ["NIST SP 800-207 (zero trust)", "ISO/IEC 27002:2022 — 8.20/8.21", "CIS Controls v8 — 13 (Network Monitoring and Defense)"]
derived_controls: [CTL-D02-11]
---

# Sortie réseau contrôlée (egress)

## Context and Problem Statement

La gouvernance réseau se concentre historiquement sur l'entrée (exposition, ADR0301) et
néglige la sortie : un composant compromis peut exfiltrer des données ou dialoguer avec une
infrastructure malveillante sans qu'aucune règle ne l'en empêche. Comment gouverner ce
qu'une charge applicative est autorisée à joindre en sortie, et la résolution de noms qui
précède chaque connexion sortante ?

## Decision Drivers

* Confinement d'une compromission : un composant infecté ne doit pas exfiltrer librement
* Gouvernance de la résolution de noms, préalable à toute connexion sortante
* Détection d'un comportement de sortie anormal (nouvelle destination, volumétrie inhabituelle)
* Absence de ce contrôle dans la pratique courante : combler un angle mort de la posture zero-trust

## Considered Options

* Sortie réseau refusée par défaut, liste explicite de destinations autorisées, résolution de noms gouvernée
* Sortie réseau libre avec seule détection a posteriori (analyse de journaux)
* Sortie réseau libre sans contrôle ni détection

## Decision Outcome

Chosen option: "Sortie refusée par défaut avec liste explicite", parce qu'elle seule
empêche par construction l'exfiltration et la communication avec une infrastructure
malveillante, plutôt que de les constater après coup. Cette ADR est classée non invariante
en phase initiale : elle comble un manque identifié du corpus plutôt qu'une pratique déjà
universellement outillée, et sa montée en exigence (de recommandation à contrôle bloquant)
s'effectue progressivement avec la maturité de l'enforcement.

### Consequences

* Good, because une compromission ne peut plus dialoguer librement avec une destination arbitraire.
* Good, because la résolution de noms devient un signal de détection exploitable.
* Bad, because toute nouvelle dépendance externe légitime nécessite une ouverture explicite (délai d'exploitation).
* Neutral, because demande un inventaire initial des destinations légitimes, absent par défaut.

### Confirmation

Contrôles dérivés : CTL-D02-12 (sortie réseau refusée par défaut, liste explicite des
destinations autorisées), CTL-D02-13 (résolution de noms gouvernée et journalisée, pas de
résolveur arbitraire). Preuve attendue : configuration de la politique de sortie + extrait
du journal de résolution de noms. Grille : conforme = deny-by-default vérifié avec liste à
jour ; partiel = sortie libre mais détection a posteriori active ; non conforme = sortie
libre sans détection.

## Pros and Cons of the Options

### Sortie refusée par défaut, liste explicite
* Good, because empêche l'exfiltration par construction, résolution de noms auditable.
* Bad, because délai d'exploitation pour toute nouvelle dépendance externe.

### Sortie libre avec détection a posteriori
* Good, because n'entrave aucun développement, mise en œuvre rapide.
* Bad, because la détection intervient après l'exfiltration, jamais avant.

### Sortie libre sans contrôle
* Good, because coût nul, aucune friction opérationnelle.
* Bad, because aucune contention possible d'une compromission ; angle mort total.

## More Information

Instanciations : `profil:azure` → Azure Firewall (règles de sortie) + Private DNS Resolver
journalisé ; autres profils → NAT gateway filtrant ou proxy sortant équivalent. Ce contrôle
est absent du profil de référence historique : son ajout comble explicitement cet angle mort.
