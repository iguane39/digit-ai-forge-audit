---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.change_board}, {roles.remediation_team}"
informed: "équipes produit"
id: ADR0106
domain: "01"
invariant: false
standards: ["DORA (Accelerate) — Accelerate (fréquence de déploiement, lead time)", "12-Factor — X. Dev/prod parity"]
derived_controls: [CTL-D01-04]
---

# Chaîne de promotion d'environnements avec transfert de responsabilité

## Context and Problem Statement

Sans chaîne d'environnements formalisée ni règle explicite de transfert de responsabilité
entre eux, une même version logicielle peut se comporter différemment d'un environnement
à l'autre, et l'imputabilité d'une régression en production devient floue. Comment
structurer la promotion d'une livraison à travers les environnements en garantissant à la
fois la parité de configuration et une responsabilité claire à chaque transition ?

## Decision Drivers

* Parité maximale entre environnements pour qu'un test en amont soit prédictif de la production
* Clarté du point de transfert de responsabilité : qui est imputable, et à partir de quand
* Progressivité du risque : une anomalie doit être détectée le plus en amont possible
* Homogénéité du modèle, indépendamment de l'hébergeur ou de l'outillage de déploiement

## Considered Options

* Chaîne d'environnements ordonnée avec porte de promotion et transfert de responsabilité explicite à chaque étape
* Deux environnements seulement (développement, production), sans étape intermédiaire
* Environnements multiples mais promotion informelle, sans porte ni transfert documenté

## Decision Outcome

Chosen option: "Chaîne ordonnée avec portes de promotion et transfert explicite", parce
qu'elle seule détecte une anomalie avant qu'elle n'atteigne la production tout en rendant
traçable, à tout instant, qui est responsable de l'artefact en cours de promotion — les
deux autres options reportent le risque et l'ambiguïté sur la production elle-même.

### Consequences

* Good, because chaque porte de promotion constitue un point de contrôle qualité mesurable avant d'exposer l'environnement suivant.
* Good, because le transfert de responsabilité étant explicite, un incident en production n'ouvre pas de débat sur l'imputabilité.
* Bad, because la chaîne complète ajoute un délai de bout en bout à la livraison, à compenser par l'automatisation des portes.
* Neutral, because le nombre exact d'environnements intermédiaires reste un paramètre de profil ou d'overlay.

### Confirmation

Contrôles dérivés : CTL-D01-04 (topologie d'environnements déclarée avec parité de
configuration documentée), CTL-D09-03 (porte de promotion automatisée entre chaque
environnement, avec transfert de responsabilité tracé). Preuve attendue : schéma de la
chaîne d'environnements et journal de promotion d'une livraison (portes franchies,
approbateur, horodatage). Grille : conforme = chaîne complète, portes tracées et transfert
explicite ; partiel = chaîne présente, transfert non systématiquement tracé ; non conforme
= promotion directe sans porte ni traçabilité.

## Pros and Cons of the Options

### Chaîne ordonnée, portes de promotion et transfert explicite
* Good, because anomalies détectées en amont, imputabilité claire à tout instant.
* Bad, because délai de bout en bout ajouté par les portes intermédiaires.

### Deux environnements seulement
* Good, because chaîne minimale, délai de livraison réduit.
* Bad, because aucun palier de détection avant la production, transfert de responsabilité binaire et grossier.

### Environnements multiples sans porte formalisée
* Good, because souplesse apparente de promotion.
* Bad, because aucune garantie de parité ni de traçabilité du transfert de responsabilité.

## More Information

Instanciations par profil : `profil:git-platform` → portes de promotion matérialisées par
des environnements de déploiement protégés nécessitant une approbation. Le nombre et le
nommage exact des environnements relèvent du plan de standards de l'overlay.
