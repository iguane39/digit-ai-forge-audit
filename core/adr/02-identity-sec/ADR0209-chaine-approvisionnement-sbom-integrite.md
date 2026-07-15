---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0209
domain: "02"
invariant: false
standards: ["SLSA — niveau ≥ 2 (provenance)", "NIST SSDF — PS.3/PO.3", "Cyber Resilience Act (UE) — art. 13", "SBOM — SPDX/CycloneDX (formats ouverts)"]
derived_controls: [CTL-D02-03, CTL-D04-10]
---

# Chaîne d'approvisionnement logicielle : SBOM + intégrité

## Context and Problem Statement

Un logiciel livré compose de nombreux composants tiers. Sans inventaire précis de leur
nature et de leur provenance, une organisation ne peut ni répondre vite à une
vulnérabilité révélée dans une dépendance, ni détecter un artefact altéré entre sa
construction et son exécution. Comment savoir à tout moment ce que contient un artefact
livré, et garantir qu'il n'a pas été altéré en chemin ?

## Decision Drivers

* Réponse rapide à une vulnérabilité découverte dans une dépendance
* Détection d'une altération d'artefact entre la construction et l'exécution
* Conformité aux obligations réglementaires émergentes sur la sécurité des produits numériques
* Interopérabilité : l'inventaire doit être lisible par tout outil consommateur, pas propriétaire

## Considered Options

* Nomenclature des composants (SBOM) générée automatiquement à chaque construction, avec vérification d'intégrité et de provenance à l'exécution
* Inventaire des dépendances tenu manuellement dans un document séparé, mis à jour irrégulièrement
* Aucun inventaire formel ; confiance dans les seules alertes spontanées des fournisseurs de composants

## Decision Outcome

Chosen option: "SBOM automatisé + vérification d'intégrité", parce qu'il est le seul à
garantir un inventaire exhaustif et à jour par construction, sans dérive documentaire,
et à permettre une vérification technique de l'intégrité de la chaîne.

### Consequences

* Good, because réponse en minutes, et non en semaines, à une alerte de vulnérabilité sur une dépendance.
* Good, because toute altération de la chaîne entre construction et exécution devient détectable.
* Bad, because un outillage de génération et de vérification doit être intégré à chaque pipeline de construction.
* Neutral, because le volume de nomenclatures à archiver s'accroît dans la durée (lien rétention).

### Confirmation

Contrôles dérivés : CTL-D02-09 (nomenclature à jour pour chaque artefact livré — mode
automatique), CTL-D02-10 (provenance/intégrité vérifiée avant exécution — mode
automatique). Preuve : nomenclature au format ouvert + rapport de vérification de
provenance. Grille : conforme = nomenclature à jour ET provenance vérifiée ; partiel =
nomenclature sans vérification ; non conforme = absence de nomenclature.

## Pros and Cons of the Options

### SBOM automatisé + vérification d'intégrité
* Good, because inventaire exhaustif par construction, vérification technique de la provenance.
* Bad, because outillage à intégrer dans chaque pipeline de construction.

### Inventaire manuel des dépendances
* Good, because aucun outillage requis pour démarrer.
* Bad, because dérive rapide entre l'inventaire déclaré et la réalité du build.

### Aucun inventaire formel
* Good, because coût nul à court terme.
* Bad, because incapacité à répondre à une alerte de vulnérabilité ni à détecter une altération.

## More Information

Manque comblé : aucun ADR du profil de référence ne couvrait la chaîne
d'approvisionnement logicielle en tant que telle ; le sujet n'existait qu'implicitement
dans les scans de dépendances (D02). Formats admissibles au titre des spécifications
ouvertes : SBOM SPDX ou CycloneDX, niveau de provenance SLSA. Instanciation :
`profil:azure` → génération SBOM intégrée au pipeline + attestation de provenance.
