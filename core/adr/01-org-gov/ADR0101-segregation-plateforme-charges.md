---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0101
domain: "01"
invariant: true
standards: ["NIST SP 800-207 (zero trust — segmentation par ressource)", "CIS Controls v8 — 12 (gestion de l'infrastructure réseau)"]
derived_controls: [CTL-D01-11]
---

# Ségrégation plateforme / charges applicatives (zonage cloisonné)

## Context and Problem Statement

Faire cohabiter, dans le même périmètre de gestion, les ressources de plateforme partagée
(réseau, identité, journalisation) et les charges applicatives des produits multiplie les
risques de propagation d'incident, brouille l'imputation des coûts et empêche une
politique de sécurité homogène. Comment structurer l'environnement d'hébergement pour
isoler nettement le socle partagé des charges applicatives, quel que soit l'hébergeur ?

## Decision Drivers

* Confinement du rayon d'impact d'un incident ou d'une compromission (blast radius)
* Politique de sécurité et de réseau homogène et centralement gouvernée pour le socle partagé
* Imputation claire des coûts et des responsabilités entre plateforme et produits
* Portabilité du modèle de zonage, indépendamment de l'hébergeur retenu

## Considered Options

* Zonage cloisonné distinct (plateforme partagée vs charges applicatives), frontière de sécurité et de gestion étanche
* Périmètre unique partagé, cloisonnement par convention de nommage uniquement
* Zone dédiée par produit, sans zone de plateforme partagée centrale

## Decision Outcome

Chosen option: "Zonage cloisonné distinct", parce que c'est la seule option qui rend
le confinement d'incident et l'homogénéité des politiques de sécurité vérifiables
techniquement, et non simplement conventionnelles, tout en restant indépendante de
l'hébergeur.

### Consequences

* Good, because un incident dans une charge applicative ne peut se propager au socle partagé sans franchir une frontière de sécurité explicite.
* Good, because les politiques appliquées à la zone plateforme sont auditées une seule fois pour tous les produits qui en dépendent.
* Bad, because la création d'une nouvelle charge applicative exige un provisionnement initial de zone, friction à absorber par l'automatisation (lien ADR0104).
* Neutral, because le nombre de zones applicatives (par produit, par domaine) reste un paramètre d'overlay.

### Confirmation

Contrôles dérivés : CTL-D01-02 (zone plateforme et zones applicatives distinctes et
documentées dans la cartographie), CTL-D01-03 (aucune ressource applicative détectée dans
le périmètre de la zone plateforme). Preuve attendue : cartographie des zones et inventaire
des ressources par zone. Grille : conforme = zonage complet et étanche ; partiel = zonage
documenté avec exceptions tracées ; non conforme = mélange non tracé entre plateforme et
applicatif.

## Pros and Cons of the Options

### Zonage cloisonné distinct
* Good, because confinement d'incident et politiques homogènes vérifiables par construction.
* Bad, because friction d'onboarding pour toute nouvelle charge applicative.

### Périmètre unique, cloisonnement par convention
* Good, because mise en place immédiate, aucune structure additionnelle.
* Bad, because le cloisonnement conventionnel n'empêche techniquement aucune propagation.

### Zone dédiée par produit sans socle partagé central
* Good, because autonomie complète de chaque produit.
* Bad, because politiques de sécurité dupliquées et divergentes, coût d'audit multiplié par le nombre de produits.

## More Information

Instanciations par profil : `profil:azure` → zones d'atterrissage matérialisées par des
groupes de gestion et des abonnements dédiés plateforme/charges ; `profil:aws` → comptes
plateforme distincts des comptes charges, organisés via un service de gouvernance
multi-comptes.
