---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes, équipes données"
informed: "équipes produit"
id: ADR0304
domain: "03"
invariant: true
standards: ["CIS Controls v8 — 12 (Network Infrastructure Management)", "NIST SP 800-207 (zero trust)", "ISO/IEC 27002:2022 — 8.20/8.22"]
derived_controls: [CTL-D04-07]
---

# Connectivité privée pour les services de données

## Context and Problem Statement

Une base de données, un stockage ou une file de messages accessible depuis l'internet
public est une cible directe, indépendamment de la robustesse de l'authentification qui la
protège. Comment garantir que les services de données ne sont jamais atteignables autrement
que par une voie privée, quel que soit l'hébergeur ?

## Decision Drivers

* Suppression de la surface d'attaque directe sur le plan de données
* Défense en profondeur : un défaut d'authentification ne suffit plus à exposer la donnée
* Cohérence avec l'identité d'exécution comme moyen d'accès (pas de secret statique sur le réseau)
* Application uniforme quel que soit le type de service de données

## Considered Options

* Connectivité strictement privée pour tout service de données, aucun point d'accès public
* Point d'accès public protégé par authentification forte et liste d'adresses autorisées
* Point d'accès public protégé par authentification uniquement

## Decision Outcome

Chosen option: "Connectivité strictement privée", parce que c'est la seule option qui rend
la donnée inatteignable depuis l'internet public par construction, indépendamment de toute
défaillance d'authentification ou d'erreur de configuration applicative.

### Consequences

* Good, because le plan de données n'est plus une cible directe depuis l'internet public.
* Good, because s'articule naturellement avec l'identité d'exécution (pas de secret statique à transporter).
* Bad, because complexifie les accès depuis des environnements tiers (outillage, support), qui doivent transiter par une passerelle dédiée.
* Neutral, because implique une planification d'adressage réseau privé cohérente entre environnements.

### Confirmation

Contrôles dérivés : CTL-D02-09 (aucun service de données ne publie d'endpoint public —
vérification automatique de la configuration réseau), CTL-D03-04 (accès aux services de
données via identité d'exécution sur la voie privée, sans secret statique). Preuve
attendue : inventaire des services de données avec statut d'exposition + configuration de
connectivité privée. Grille : conforme = 0 endpoint public ; partiel = endpoint public
restreint par liste d'adresses avec dérogation documentée ; non conforme = endpoint public
sans restriction.

## Pros and Cons of the Options

### Connectivité strictement privée
* Good, because supprime la surface d'attaque directe par construction.
* Bad, because accès tiers plus complexe à outiller.

### Point d'accès public restreint (authentification + liste d'adresses)
* Good, because plus simple à mettre en œuvre pour des accès tiers ponctuels.
* Bad, because reste atteignable depuis l'internet public ; la liste d'adresses est contournable.

### Point d'accès public avec authentification seule
* Good, because le plus simple à activer.
* Bad, because expose directement le plan de données à toute tentative d'intrusion.

## More Information

Instanciations : `profil:azure` → Private Link/endpoints privés + identités managées ;
`profil:aws` → VPC Endpoints + rôles IAM. Le profil fournit la commande de vérification
exécutable du contrôle CTL-D02-09.
