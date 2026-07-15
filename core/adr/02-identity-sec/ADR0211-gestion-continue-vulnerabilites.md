---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement, équipe d'exploitation"
informed: "toutes les équipes produit"
id: ADR0211
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.8 (gestion des vulnérabilités techniques)", "NIST SSDF — RV.1/RV.2/RV.3", "CIS Controls v8 — 7 (Continuous Vulnerability Management)"]
derived_controls: [CTL-D02-12]
---

# Gestion continue des vulnérabilités et des correctifs

## Context and Problem Statement

Le corpus impose déjà l'analyse des dépendances applicatives à la construction (SCA, SBOM —
ADR0209) mais ne dit rien de l'après : une vulnérabilité publiée sur un composant déjà
déployé (OS, runtime, image de base, bibliothèque non reconstruite) ne déclenche aucune
obligation de détection ni de délai de correction. Comment garantir qu'une vulnérabilité
connue en production est détectée et corrigée dans un délai borné, quel que soit le moment
de sa découverte par rapport à la dernière construction ?

## Decision Drivers

* Détection continue des vulnérabilités sur tout le parc en production, pas seulement au moment de la construction
* Délai de remédiation borné et proportionné à la gravité (critique, haute, moyenne)
* Vérification périodique par un moyen indépendant du seul scan automatisé (test d'intrusion)
* Neutralité technologique : la pratique s'applique à tout runtime, cloud ou on-premise

## Considered Options

* Surveillance continue des vulnérabilités connues sur le parc déployé, délai de correction contractualisé par gravité, complétée par un test d'intrusion périodique indépendant
* Rescan des dépendances uniquement à la prochaine construction planifiée (statu quo)
* Veille passive : traitement seulement à réception d'une alerte spontanée d'un tiers

## Decision Outcome

Chosen option: "Surveillance continue avec délai contractualisé et vérification
indépendante", seule option qui couvre l'intervalle entre deux constructions et vérifie la
détection automatisée par un moyen distinct, indépendant de la plateforme d'hébergement.

### Consequences

* Good, because aucune vulnérabilité connue ne peut rester silencieusement non traitée entre deux constructions applicatives.
* Good, because le délai de remédiation devient mesurable et opposable, par gravité.
* Bad, because une capacité de surveillance et un budget de remédiation récurrents doivent être maintenus indépendamment de tout projet.
* Neutral, because un arriéré de vulnérabilités basses/moyennes peut être toléré s'il est documenté et borné.

### Confirmation

Contrôle dérivé : CTL-D02-12 (parc en production — applicatif, runtime, infrastructure —
sous surveillance continue des vulnérabilités connues, délai de remédiation documenté et
respecté par gravité — mode automatique + revue). Preuve : rapport de surveillance avec
délais mesurés par sévérité. Grille : conforme = inventaire continu et délais tenus ;
partiel = inventaire sans suivi de délais ; non conforme = pas d'inventaire du parc en
production. (Le test d'intrusion indépendant, envisagé comme second contrôle, relève du
backlog v1.6 — non matérialisé à ce stade.)

## Pros and Cons of the Options

### Surveillance continue + vérification indépendante
* Good, because couvre l'intervalle entre constructions, vérifiée par un moyen distinct.
* Bad, because coût récurrent d'outillage et de remédiation à budgéter en continu.

### Rescan à la prochaine construction seulement
* Good, because aucun outillage additionnel par rapport à l'existant (ADR0209).
* Bad, because une vulnérabilité découverte juste après une construction reste exposée jusqu'à la suivante, sans délai borné.

### Veille passive sur alerte spontanée
* Good, because coût nul en l'absence d'alerte.
* Bad, because dépend entièrement de la réactivité d'un tiers ; aucune détection propre.

## More Information

Instanciations : `profil:azure` → Defender for Cloud + calendrier de patch géré par la
plateforme ; autres profils → scanner de vulnérabilités infrastructure équivalent en continu.
Distinct d'ADR0209 (chaîne d'approvisionnement à la construction), qui couvre le cycle de vie
post-déploiement. Manque comblé : ISO/IEC 27002:2022 — 8.8, NIST SSDF — RV.1-RV.3, CIS Controls v8 — 7 (EXTENSION-CORPUS.md §2).
