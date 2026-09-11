---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.architect}, équipes produit, équipe d'exploitation"
informed: "toutes les équipes produit"
id: ADR0626
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D16-11]
---

# Persistance applicative sur un moteur relationnel managé

## Context and Problem Statement

La persistance d'une application se choisit souvent au démarrage du projet, sur le critère de la vitesse de mise en route. Les plateformes de données à faible écriture de code rendent ce démarrage immédiat, mais enferment le schéma, les règles et les données dans un modèle dont la sortie se paie en réécriture complète — et dont la sauvegarde, la restauration et les évolutions de schéma ne s'outillent pas comme celles d'un moteur de base de données. Comment garantir qu'une application industrialisée repose sur une persistance sauvegardable, migrable et réversible ?

## Decision Drivers

* Réversibilité : le schéma et les données doivent pouvoir sortir dans un format standard
* Évolutions de schéma outillées, versionnées et rejouables
* Sauvegarde et restauration éprouvées, avec objectifs de perte et de reprise mesurables
* Exploitation déléguée : le moteur est managé, l'équipe produit ne gère pas le système hôte

## Considered Options

* Moteur relationnel managé par le fournisseur, schéma versionné et migrations outillées ; plateformes de données à faible écriture de code exclues comme socle de persistance applicative
* Plateforme de données à faible écriture de code comme socle de persistance
* Moteur de base de données auto-hébergé et exploité par l'équipe produit

## Decision Outcome

Chosen option: "Moteur relationnel managé", parce que c'est la seule option qui réunit la réversibilité (schéma et données exportables dans un format standard), l'outillage de migration et la sauvegarde éprouvée, sans charger l'équipe produit de l'exploitation du système hôte. Les plateformes à faible écriture de code restent possibles pour de l'outillage interne non industrialisé, jamais comme socle de persistance d'une application en production.

### Consequences

* Good, because la sortie de plateforme reste un export, pas une réécriture.
* Good, because les évolutions de schéma entrent dans la chaîne de livraison comme le reste du code.
* Bad, because le démarrage est plus lent qu'avec une plateforme à faible écriture de code.
* Neutral, because un besoin non relationnel avéré (document, graphe, série temporelle) justifie une dérogation documentée, pas un contournement silencieux.

### Confirmation

Contrôle dérivé : CTL-D16-11 (la persistance applicative repose sur un moteur relationnel managé, avec schéma versionné et migrations rejouables ; aucune plateforme de données à faible écriture de code ne porte de données applicatives de production sans dérogation documentée — mode revue). Preuve attendue : inventaire des socles de persistance de l'application, historique des migrations de schéma, et dérogation datée le cas échéant. Grille : conforme = persistance sur moteur relationnel managé, migrations versionnées ; partiel = moteur conforme mais migrations non versionnées ; non conforme = persistance de production sur plateforme à faible écriture de code sans dérogation.

## Pros and Cons of the Options

### Moteur relationnel managé

* Good, because réversible, migrable, sauvegardé, exploité par le fournisseur.
* Bad, because mise en route plus lente et modélisation à faire explicitement.

### Plateforme à faible écriture de code

* Good, because temps de mise en route très court, peu de compétences requises.
* Bad, because sortie coûteuse, migrations non outillées, sauvegarde et restauration peu vérifiables.

### Moteur auto-hébergé

* Good, because contrôle total sur la configuration et les versions.
* Bad, because l'équipe produit hérite du correctif, de la disponibilité et de la sauvegarde.

## More Information

Complète ADR0502 (stratégie d'hébergement managé d'abord) sur le volet persistance, ADR0611 (sauvegarde et restauration testées) qui en devient vérifiable, et ADR0108 (réversibilité et portabilité de sortie) qu'il rend applicable au socle de données. Instanciations par profil : `profil:azure` → moteur relationnel managé de la plateforme (service géré), plateforme low-code exclue du socle applicatif.

**À compléter** (`a_completer: true`) : la source de référence dont cette décision est issue ne cite **aucune norme externe** — le champ `standards` reste vide et doit être renseigné avant toute opposabilité. À compléter également : la procédure de dérogation pour un besoin non relationnel avéré, non fournie par la source.
