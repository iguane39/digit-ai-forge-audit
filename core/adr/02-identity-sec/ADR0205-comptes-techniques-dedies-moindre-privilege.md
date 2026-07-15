---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0205
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.2", "CIS Controls v8 — Contrôle 5", "NIST SP 800-53 — AC-2(9)"]
derived_controls: [CTL-D03-06]
---

# Comptes techniques dédiés, à moindre privilège

## Context and Problem Statement

Un service qui doit accéder à une autre ressource emprunte souvent un raccourci :
réutiliser un compte humain existant ou un compte technique déjà partagé par d'autres
usages. Il en résulte une perte de traçabilité individuelle et une accumulation de
privilèges par addition successive. Comment accorder un accès machine sans hériter de
cette dette de compte partagé et sur-privilégié ?

## Decision Drivers

* Traçabilité individuelle de chaque usage technique (quel service agit, et pourquoi)
* Confinement strict du rayon d'action de chaque compte technique (moindre privilège)
* Révocation ou rotation ciblée, sans effet de bord sur d'autres usages
* Élimination des comptes partagés entre plusieurs services ou entre humains et services

## Considered Options

* Un compte technique dédié par usage, à privilèges minimaux et cycle de vie propre
* Un compte technique mutualisé par domaine fonctionnel, privilèges cumulés
* Réutilisation d'un compte humain existant pour les usages techniques

## Decision Outcome

Chosen option: "Compte technique dédié par usage", parce qu'il est seul à garantir la
traçabilité individuelle, le confinement du rayon d'action et une révocation sans effet
de bord — les deux autres options accumulent des privilèges et diluent la responsabilité.

### Consequences

* Good, because tout incident est imputable à un usage précis, jamais à un compte fourre-tout.
* Good, because la révocation ou la rotation d'un compte technique n'affecte qu'un seul usage.
* Bad, because prolifération du nombre de comptes techniques à inventorier et à gouverner.
* Neutral, because un processus outillé de création/retrait est requis, sinon la prolifération devient elle-même un risque.

### Confirmation

Contrôle dérivé : CTL-D03-06 (comptes techniques dédiés, non partagés, moindre
privilège — mode revue). Preuve attendue : inventaire des comptes techniques avec usage
déclaré et périmètre de droits associé. Grille : conforme = un compte pour un usage
documenté, droits minimaux vérifiés ; partiel = comptes dédiés mais droits excessifs
constatés ; non conforme = compte partagé entre plusieurs usages ou entre un humain et
un service.

## Pros and Cons of the Options

### Compte technique dédié par usage
* Good, because traçabilité individuelle, confinement, révocation ciblée.
* Bad, because volume de comptes à gouverner en croissance continue.

### Compte technique mutualisé par domaine
* Good, because moins de comptes à créer initialement.
* Bad, because privilèges cumulés au-delà du besoin réel de chaque usage.

### Réutilisation d'un compte humain
* Good, because aucune création de compte supplémentaire.
* Bad, because confusion humain/machine ; blocage de l'usage technique si le compte humain est désactivé.

## More Information

Instanciations : `profil:azure` → identités managées attribuées par ressource, sans clé
statique ; `profil:aws` → rôles IAM assumés par service. Lien avec ADR0201 : le compte
technique porte l'identité d'exécution, le coffre-fort central ne porte que ce qui ne
peut être évité.
