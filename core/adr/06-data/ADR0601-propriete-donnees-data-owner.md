---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "toutes les équipes produit"
id: ADR0601
domain: "06"
invariant: true
standards: ["DAMA-DMBOK2 — Chapitre 3 (Data Governance)", "RGPD — Art. 24 (responsabilité du responsable de traitement)", "ISO/IEC 38505-1:2017 — gouvernance des données"]
derived_controls: [CTL-D05-01, CTL-D14-01, CTL-D15-01, CTL-D15-08]
profile_bindings: optional
---

# Propriété des données : Data Owner métier nommé

## Context and Problem Statement

Sans responsable métier identifié pour un domaine ou un actif de données, les décisions de qualité, d'accès et de conservation n'ont pas d'arbitre : chaque incident se résout au cas par cas et aucune responsabilité n'est opposable en audit. Comment garantir qu'un actif de données possède toujours un responsable métier identifiable, indépendamment de l'organisation ou de l'outillage en place ?

## Decision Drivers

* Imputabilité claire des décisions relatives à un actif de données (accès, qualité, cycle de vie)
* Conformité à l'obligation de responsabilité du traitement (accountability)
* Arbitrage rapide en cas de conflit d'usage ou d'incident sur une donnée
* Neutralité vis-à-vis de l'organisation et de la plateforme technique retenue

## Considered Options

* Data Owner métier nommé par domaine de données, inscrit au registre de gouvernance
* Propriété portée par défaut par l'équipe technique qui a créé l'actif
* Propriété implicite, non déclarée, résolue au cas par cas lors des incidents

## Decision Outcome

Chosen option: "Data Owner métier nommé par domaine de données", parce que c'est la seule option qui rend la responsabilité vérifiable en audit, indépendante du turnover technique, et alignée avec l'obligation d'accountability portée par le responsable de traitement.

### Consequences

* Good, because chaque actif de données a un point de contact métier unique pour arbitrer accès, qualité et rétention.
* Good, because la responsabilité survit aux réorganisations techniques et aux départs d'équipe.
* Bad, because charge additionnelle pour les métiers, qui doivent s'approprier un rôle de gouvernance.
* Neutral, because nécessite un registre de propriété tenu à jour (lien ADR0610).

### Confirmation

Contrôles dérivés : CTL-D15-01 (Data Owner nommé et documenté pour chaque domaine de données — mode déclaratif), CTL-D05-01 (registre de propriété des sources et pipelines à jour — mode revue). Preuve attendue : registre de gouvernance avec un Data Owner par domaine et date de dernière revue. Grille : conforme = 100 % des domaines couverts et revus ≤ 12 mois ; partiel = couverture partielle ou revue expirée ; non conforme = domaine sans Data Owner identifié.

## Pros and Cons of the Options

### Data Owner métier nommé par domaine

* Good, because responsabilité claire, stable et opposable en audit.
* Bad, because exige un effort d'appropriation et de formation côté métier.

### Propriété par défaut de l'équipe technique créatrice

* Good, because aucune démarche organisationnelle supplémentaire au démarrage.
* Bad, because la responsabilité métier reste absente et se dilue au premier changement d'équipe.

### Propriété implicite, résolue au cas par cas

* Good, because coût nul à court terme.
* Bad, because aucun arbitre en cas d'incident ; non auditable par construction.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → attribut propriétaire porté par le catalogue technique au niveau schéma/table ; `profil:azure` → attribut Data Owner porté par Microsoft Purview. Le profil fournit le mécanisme de déclaration ; le registre de gouvernance reste la source de vérité.
