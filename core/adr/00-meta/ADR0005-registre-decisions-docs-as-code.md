---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architectes, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0005
domain: "00"
invariant: true
standards: ["docs-as-code (Docs Like Code)", "DORA (Accelerate) — Accelerate (gestion de configuration versionnée)"]
derived_controls: [CTL-D00-01, CTL-D00-08, CTL-D01-07, CTL-D13-01, CTL-D13-09]
---

# Registre des décisions docs-as-code, publié et versionné

## Context and Problem Statement

Des décisions d'architecture dispersées entre plusieurs outils (wiki isolé, tickets,
documents bureautiques non versionnés) perdent leur historique, échappent à la revue par
les pairs et deviennent invérifiables lors d'un audit. Comment garantir que l'ensemble des
décisions actées reste un corpus unique, versionné, publié et consultable par toutes les
parties prenantes, techniques comme non techniques ?

## Decision Drivers

* Source unique de vérité pour l'ensemble des décisions actées, sans doublon ni fourche
* Historique complet et infalsifiable : qui a proposé, revu, accepté, et quand
* Publication accessible à toutes les équipes, sans dépendre d'un outil propriétaire imposé
* Revue par les pairs intégrée au même flux que celui utilisé pour le code

## Considered Options

* Registre docs-as-code : fichiers versionnés dans le dépôt, revus par proposition de modification, publiés automatiquement
* Wiki collaboratif indépendant du dépôt de code, édition libre sans revue obligatoire
* Documents bureautiques partagés sur un espace de stockage collaboratif générique

## Decision Outcome

Chosen option: "Registre docs-as-code", parce qu'il est la seule option qui unifie
versionnement, revue par les pairs et publication dans un flux unique déjà maîtrisé par
les équipes techniques, sans dépendre d'un outil propriétaire ni d'une discipline
individuelle non vérifiable.

### Consequences

* Good, because l'historique de version fait foi : aucune décision ne peut être effacée ou réécrite sans laisser de trace.
* Good, because la revue par proposition de modification applique aux décisions la même rigueur que celle appliquée au code.
* Bad, because l'accès des parties prenantes non techniques suppose une étape de publication (génération de site ou de documentation).
* Neutral, because le choix de l'outil de publication (site statique, wiki généré) reste un paramètre de profil.

### Confirmation

Contrôles dérivés : CTL-D13-06 (registre publié, accessible, synchronisé avec le dépôt
source), CTL-D13-07 (historique de version intact — aucune réécriture d'un ADR accepté).
Preuve attendue : capture du registre publié et horodatage de sa synchronisation avec le
dépôt. Grille : conforme = registre publié et synchronisé en moins de 24 heures ; partiel
= registre publié avec latence de synchronisation documentée ; non conforme = registre
absent ou désynchronisé sans détection.

## Pros and Cons of the Options

### Registre docs-as-code
* Good, because versionnement, revue et publication unifiés dans un flux unique.
* Bad, because la publication vers un public non technique demande une étape dédiée.

### Wiki collaboratif indépendant
* Good, because accessible immédiatement à un public non technique.
* Bad, because aucune garantie de revue ni d'historique infalsifiable.

### Documents bureautiques partagés
* Good, because outillage minimal, aucune compétence technique requise.
* Bad, because historique fragile, revue absente, dérive rapide entre versions.

## More Information

Instanciations par profil : `profil:git-platform` → publication automatisée par pipeline
vers un site statique généré depuis `adr/**` à chaque fusion ; `profil:wiki-integre` →
miroir en lecture seule dans le wiki de la plateforme de dépôt.
