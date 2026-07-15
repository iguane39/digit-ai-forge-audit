---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes, équipes réseau"
informed: "équipes produit"
id: ADR0302
domain: "03"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.22", "NIST SP 800-207 (zero trust)", "CIS Controls v8 — 12 (Network Infrastructure Management)"]
derived_controls: [CTL-D02-10]
---

# Segmentation réseau et cloisonnement des flux

## Context and Problem Statement

Une topologie réseau plate laisse un attaquant ayant compromis un composant périphérique
atteindre directement les composants sensibles (données, administration). Comment limiter
par construction la portée d'une compromission, quelle que soit la plateforme d'hébergement ?

## Decision Drivers

* Réduction du rayon d'impact (blast radius) d'une compromission
* Explicitation des flux autorisés entre zones de confiance
* Compatibilité avec une architecture zero-trust (pas de confiance implicite intra-réseau)
* Applicabilité indépendante du modèle d'hébergement (cloud, on-premise, hybride)

## Considered Options

* Cloisonnement en zones de confiance étanches, flux inter-zones explicitement autorisés (deny-by-default)
* Réseau plat unique avec contrôle d'accès uniquement au niveau applicatif
* Cloisonnement partiel limité à la séparation production / hors production

## Decision Outcome

Chosen option: "Cloisonnement en zones de confiance étanches", parce que c'est la seule
option qui contient une compromission à sa zone d'origine, rend la matrice de flux
auditable et ne présuppose aucune technologie de virtualisation réseau particulière.

### Consequences

* Good, because une compromission périphérique n'atteint plus directement les zones sensibles.
* Good, because la matrice de flux devient une preuve d'audit directement exploitable.
* Bad, because la gestion des règles de flux ajoute un effort d'exploitation continu.
* Neutral, because la granularité des zones doit être calibrée (trop de zones nuit à la maintenabilité).

### Confirmation

Contrôles dérivés : CTL-D02-05 (au moins trois zones de confiance distinctes — publique,
applicative, donnée — avec flux inter-zones nommés), CTL-D02-06 (matrice de flux
documentée, revue périodique, refus par défaut des flux non listés). Preuve attendue :
schéma de zonage + export de la matrice de flux + configuration de filtrage. Grille :
conforme = zonage complet et deny-by-default vérifié ; partiel = zonage partiel ou règles
non revues ; non conforme = réseau plat ou flux non maîtrisés.

## Pros and Cons of the Options

### Cloisonnement en zones de confiance étanches
* Good, because rayon d'impact contenu, matrice de flux auditable.
* Bad, because effort d'exploitation et de revue continu.

### Réseau plat avec contrôle applicatif seul
* Good, because simplicité d'exploitation initiale.
* Bad, because une compromission réseau contourne intégralement le contrôle applicatif.

### Séparation production / hors production uniquement
* Good, because couvre le risque le plus visible à moindre effort.
* Bad, because aucune contention à l'intérieur même de la production.

## More Information

Instanciations : `profil:azure` → Virtual Network + Network Security Groups + Azure
Firewall pour le filtrage inter-zone ; `profil:aws` → VPC + Security Groups + NACLs.
Généralise les pratiques de zonage du profil de référence.
