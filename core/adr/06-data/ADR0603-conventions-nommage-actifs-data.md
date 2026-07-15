---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "équipes produit, équipes data"
id: ADR0603
domain: "06"
invariant: false
standards: ["DAMA-DMBOK2 — Chapitre 12 (Metadata Management)", "ISO/IEC 11179 — registres de métadonnées (désignation et définition des éléments de données)"]
derived_controls: [CTL-D05-02, CTL-D16-07]
profile_bindings: optional
---

# Conventions de nommage des actifs data

## Context and Problem Statement

Sans convention de nommage partagée, chaque équipe invente son propre vocabulaire pour désigner domaines, tables, colonnes et flux, rendant la recherche, l'automatisation et l'audit dépendants d'une connaissance tacite. Comment garantir que tout actif de données est nommé selon une convention unique, lisible et vérifiable mécaniquement ?

## Decision Drivers

* Recherche et découverte des actifs sans connaissance tacite de l'équipe créatrice
* Automatisation possible des contrôles de nommage et de la documentation générée
* Réduction du coût de compréhension à l'arrivée d'une nouvelle équipe
* Portabilité de la convention entre paradigmes de stockage et plateformes

## Considered Options

* Convention de nommage unique et documentée, vérifiée par un contrôle automatisé
* Convention recommandée mais non vérifiée, laissée à la discipline des équipes
* Absence de convention formelle ; chaque équipe nomme selon ses habitudes

## Decision Outcome

Chosen option: "Convention unique vérifiée automatiquement", parce que c'est la seule option qui rend le nommage prévisible et opposable sans dépendre de la bonne volonté de chaque équipe.

### Consequences

* Good, because la découverte d'un actif ne dépend plus de la mémoire d'une équipe.
* Good, because le contrôle automatisé détecte les écarts avant mise en production.
* Bad, because la migration des actifs existants non conformes représente un effort ponctuel.
* Neutral, because la convention elle-même doit être révisée à l'apparition de nouveaux types d'actifs.

### Confirmation

Contrôles dérivés : CTL-D16-02 (dictionnaire de données conforme à la convention de nommage déclarée), CTL-D05-02 (convention vérifiée par un contrôle automatisé en intégration continue ou en revue). Preuve attendue : rapport de contrôle de nommage et convention documentée et versionnée. Grille : conforme = convention documentée et contrôle automatisé actif ; partiel = convention documentée sans contrôle automatisé ; non conforme = absence de convention formalisée.

## Pros and Cons of the Options

### Convention unique vérifiée automatiquement

* Good, because prévisibilité et auditabilité maximales.
* Bad, because effort de migration des actifs hérités non conformes.

### Convention recommandée non vérifiée

* Good, because introduction sans friction technique.
* Bad, because dérive progressive sans mécanisme de rappel, ignorée sous pression de délai.

### Absence de convention formelle

* Good, because liberté totale laissée aux équipes.
* Bad, because coût de découverte et d'intégration croissant avec le nombre d'actifs.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → convention catalogue.schéma.table vérifiée à la publication ; `profil:powerbi` → convention de nommage des jeux de données et des rapports certifiés.
