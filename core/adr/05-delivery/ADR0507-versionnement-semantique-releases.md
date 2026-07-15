---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes de développement, architectes"
informed: "équipes produit"
id: ADR0507
domain: "05"
invariant: false
standards: ["SemVer 2.0.0", "DORA (Accelerate) — traçabilité des releases", "NIST SSDF — PS.2"]
derived_controls: [CTL-D09-05]
profile_bindings: optional
---

# Versionnement sémantique et releases tracées

## Context and Problem Statement

Sans schéma de version explicite, il devient impossible de savoir si une nouvelle livraison
casse la compatibilité, corrige un défaut ou ajoute une fonctionnalité — et l'exploitation
ne peut pas corréler un incident à une version précise. Quel schéma de version, lisible par
des humains comme par des machines, une équipe doit-elle appliquer à ses releases ?

## Decision Drivers

* Signal explicite de rupture de compatibilité avant mise à jour
* Corrélation univoque entre un incident en production et une version livrée
* Automatisation possible des décisions de mise à jour par les consommateurs
* Applicabilité à tout type d'artefact (bibliothèque, service, image)

## Considered Options

* Versionnement sémantique (majeur.mineur.correctif) avec notes de release tracées
* Numéro de build incrémental sans signification portée par le numéro
* Version datée (année.mois.jour) sans distinction du niveau de rupture

## Decision Outcome

Chosen option: "Versionnement sémantique avec notes de release tracées", parce que c'est le
seul schéma des trois qui porte, dans le numéro lui-même, un engagement de compatibilité
vérifiable — permettant aux consommateurs et aux pipelines de décider automatiquement s'il
est sûr de monter de version.

### Consequences

* Good, because le numéro de version porte à lui seul un engagement de compatibilité explicite.
* Good, because chaque incident est corrélable à une version et à ses notes de release.
* Bad, because exige une discipline de classification du changement à chaque release.
* Neutral, because les artefacts internes non consommés par des tiers tirent un bénéfice moindre du signal.

### Confirmation

Contrôles dérivés : CTL-D09-09 (schéma de version appliqué et vérifié en CI sur chaque
artefact publié), CTL-D12-02 (notes de release publiées et accessibles en exploitation pour
chaque version déployée). Preuve : historique des versions publiées + notes de release
associées. Grille : conforme = schéma respecté et notes présentes pour 100 % des releases ;
partiel = schéma respecté sans notes systématiques ; non conforme = versions non
distinguables ou dupliquées.

## Pros and Cons of the Options

### Versionnement sémantique + notes tracées
* Good, because signal de compatibilité explicite, automatisable, corrélable en exploitation.
* Bad, because discipline de classification exigée à chaque changement.

### Numéro de build incrémental
* Good, because trivial à générer automatiquement.
* Bad, because aucune information de compatibilité portée par le numéro.

### Version datée
* Good, because lisible, ordonnée naturellement dans le temps.
* Bad, because ne distingue pas une rupture de compatibilité d'un correctif mineur.

## More Information

Instanciations : `profil:azure` → génération automatique de version et de notes de release
par le pipeline managé à partir de l'historique des changements. Le schéma de version choisi
au niveau core reste une spécification ouverte, non un outil.
