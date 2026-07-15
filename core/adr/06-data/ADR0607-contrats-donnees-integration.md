---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "équipes produit, équipes d'intégration"
id: ADR0607
domain: "06"
invariant: true
standards: ["DAMA-DMBOK2 — Chapitre 8 (Data Integration and Interoperability)", "ISO/IEC 25010:2011 — compatibilité (interopérabilité)", "SemVer 2.0.0 — versionnement sémantique des schémas"]
derived_controls: [CTL-D05-06, CTL-D14-02, CTL-D15-05, CTL-D16-05, CTL-D16-06]
profile_bindings: optional
---

# Contrats de données à l'intégration

## Context and Problem Statement

Quand un producteur modifie librement la structure d'un actif de données sans préavis, tout consommateur en aval subit une rupture silencieuse : un traitement échoue ou, pire, continue de s'exécuter sur des données mal interprétées. Comment garantir qu'un changement de structure d'un actif partagé ne casse jamais un consommateur sans préavis, quel que soit le mécanisme d'échange ?

## Decision Drivers

* Détection d'une rupture de compatibilité avant qu'elle n'atteigne un consommateur en production
* Découplage du rythme de changement entre producteur et consommateurs
* Traçabilité des versions de schéma dans le temps
* Applicabilité à tout mécanisme d'échange (fichier, flux, API, table partagée)

## Considered Options

* Contrat de données versionné entre producteur et consommateurs, vérifié avant publication
* Convention tacite entre équipes, communication informelle des changements
* Aucun contrat ; le consommateur s'adapte a posteriori aux changements constatés

## Decision Outcome

Chosen option: "Contrat de données versionné et vérifié", parce que c'est la seule option qui déplace la détection d'une rupture avant la publication, plutôt que de la laisser se manifester chez un consommateur en production.

### Consequences

* Good, because une rupture de compatibilité est détectée et bloquée avant publication, jamais découverte en production.
* Good, because producteur et consommateurs évoluent à des rythmes découplés, contre une version de contrat explicite.
* Bad, because le contrat ajoute une étape de vérification et un formalisme à la publication d'un changement.
* Neutral, because le nombre de consommateurs à notifier croît avec la maturité de la plateforme.

### Confirmation

Contrôles dérivés : CTL-D05-06 (contrats de données versionnés et vérifiés à chaque publication), CTL-D16-04 (dérive de schéma détectée et gouvernée, avec plan de migration documenté). Preuve attendue : registre des contrats de données avec historique de versions et rapport de vérification de compatibilité. Grille : conforme = contrat versionné et vérification automatisée active ; partiel = contrat documenté sans vérification automatisée ; non conforme = absence de contrat formalisé.

## Pros and Cons of the Options

### Contrat de données versionné et vérifié

* Good, because rupture détectée avant publication et découplage producteur/consommateurs.
* Bad, because formalisme et effort de vérification à chaque changement.

### Convention tacite entre équipes

* Good, because rapide à mettre en place, aucun outillage requis.
* Bad, because dépend de la communication humaine ; un oubli suffit à casser un consommateur.

### Absence de contrat, adaptation a posteriori

* Good, because aucune friction pour le producteur.
* Bad, because le coût de la rupture est intégralement reporté sur les consommateurs.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → contraintes de schéma appliquées au niveau de la table avec contrôle de compatibilité avant publication ; `profil:azure` → schémas de contrat publiés et versionnés dans un registre de schémas pour les flux évènementiels.
