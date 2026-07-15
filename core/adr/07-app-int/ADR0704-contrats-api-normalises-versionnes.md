---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0704
domain: "07"
invariant: false
standards: ["OpenAPI (spécification d'interface)", "SemVer 2.0.0 (versionnement sémantique)", "ISO/IEC 25010 (compatibilité, maintenabilité)"]
derived_controls: [CTL-D06-03, CTL-D06-06, CTL-D13-02]
---

# Contrats d'API normalisés, versionnés, documentés

## Context and Problem Statement

Une API sans contrat explicite oblige chaque consommateur à deviner son comportement en
lisant le code ou en observant les réponses, et la moindre évolution du fournisseur casse
ses consommateurs sans préavis. Comment garantir que toute API expose un contrat
explicite, versionné et compréhensible avant même son premier appel ?

## Decision Drivers

* Découverte et intégration d'une API sans accès au code de son fournisseur
* Détection automatisée des ruptures de compatibilité avant mise en production
* Communication claire des évolutions aux équipes consommatrices
* Génération d'outillage (clients, tests, documentation) à partir d'une source unique

## Considered Options

* Contrat d'interface normalisé, versionné explicitement et publié avec l'API
* Documentation prose libre maintenue séparément du code
* Aucun contrat formel : l'implémentation fait office de référence

## Decision Outcome

Chosen option: "Contrat d'interface normalisé et versionné", parce qu'il est la seule
option lisible par des humains et des outils, vérifiable automatiquement contre
l'implémentation, et porteur d'un numéro de version qui signale sans ambiguïté les
ruptures de compatibilité.

### Consequences

* Good, because le contrat sert de documentation, de source de génération de clients et de test.
* Good, because un incrément de version majeure signale sans ambiguïté une rupture de compatibilité.
* Bad, because discipline requise pour maintenir le contrat synchronisé avec l'implémentation réelle.
* Neutral, because un contrôle de conformité contrat/implémentation doit être outillé en CI.

### Confirmation

Contrôles dérivés : CTL-D01-04 (contrat d'interface publié et versionné pour chaque API
exposée — mode automatique), CTL-D02-04 (requêtes non conformes au contrat publié
rejetées à la frontière — mode automatique). Preuve attendue : contrat publié + rapport
de conformité contrat/implémentation. Grille : conforme = contrat publié, versionné et
vérifié en CI ; partiel = contrat publié non vérifié automatiquement ; non conforme =
absence de contrat explicite.

## Pros and Cons of the Options

### Contrat d'interface normalisé et versionné
* Good, because lisible par les outils, vérifiable en continu, signal de rupture explicite.
* Bad, because effort de maintenance du contrat à chaque évolution.

### Documentation prose libre
* Good, because rédaction sans outillage spécifique.
* Bad, because dérive silencieuse entre documentation et implémentation réelle.

### Aucun contrat formel
* Good, because aucun effort initial.
* Bad, because chaque consommateur devine le comportement ; toute évolution est une rupture non signalée.

## More Information

Instanciations : le format de contrat recommandé au niveau core est une spécification
d'interface ouverte (OpenAPI ou équivalent selon le protocole) publiée dans un registre
accessible ; `profil:azure` → validation du contrat intégrée au pipeline de livraison.
