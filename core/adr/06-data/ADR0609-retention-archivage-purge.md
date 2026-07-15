---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "{roles.security_officer}, toutes les équipes produit"
id: ADR0609
domain: "06"
invariant: true
standards: ["RGPD — Art. 5.1.e (limitation de la conservation)", "ISO/IEC 27002:2022 — 8.10 (suppression des informations)", "DAMA-DMBOK2 — Chapitre 6 (Data Storage and Operations)"]
derived_controls: [CTL-D05-08, CTL-D15-09, CTL-D16-04, CTL-D16-08]
profile_bindings: optional
---

# Rétention, archivage et purge gouvernés

## Context and Problem Statement

Une donnée conservée indéfiniment, faute de politique explicite, accroît la surface d'exposition en cas d'incident et viole l'obligation de limiter la conservation à la durée nécessaire à la finalité du traitement. Comment garantir que chaque actif de données a une durée de conservation déclarée et une purge effective à son terme, indépendamment du support de stockage ?

## Decision Drivers

* Conformité à l'obligation légale de limitation de la conservation
* Réduction de la surface d'exposition en cas d'incident
* Maîtrise du coût de stockage croissant avec l'ancienneté des données
* Applicabilité uniforme aux données actives, archivées et aux copies de sauvegarde

## Considered Options

* Politique de rétention déclarée par actif, archivage et purge automatisés à l'échéance
* Purge manuelle, déclenchée ponctuellement lors d'un audit ou d'un incident
* Conservation indéfinie par défaut, sans politique déclarée

## Decision Outcome

Chosen option: "Politique de rétention déclarée avec purge automatisée", parce que c'est la seule option qui rend la limitation de la conservation vérifiable en continu, plutôt que dépendante d'une initiative ponctuelle.

### Consequences

* Good, because la durée de conservation de chaque actif est explicite, documentée et opposable en audit.
* Good, because la purge automatisée réduit mécaniquement la surface d'exposition et le coût de stockage.
* Bad, because certaines purges sont irréversibles : la politique doit être validée avec le Data Owner avant activation.
* Neutral, because les obligations de conservation varient par catégorie de donnée et doivent être répertoriées explicitement.

### Confirmation

Contrôles dérivés : CTL-D05-08 (politique de rétention/purge appliquée et vérifiée par actif critique), CTL-D16-05 (classification de sensibilité au niveau colonne pilotant la durée de conservation). Preuve attendue : registre des politiques de rétention par actif et rapport d'exécution des purges programmées. Grille : conforme = politique déclarée et purge exécutée pour tous les actifs concernés ; partiel = politique déclarée sans purge automatisée vérifiable ; non conforme = absence de politique.

## Pros and Cons of the Options

### Politique de rétention déclarée avec purge automatisée

* Good, because conformité continue et réduction mécanique de l'exposition.
* Bad, because irréversibilité de la purge, exigeant une validation préalable rigoureuse.

### Purge manuelle ponctuelle

* Good, because ne nécessite pas d'automatisation initiale.
* Bad, because dépend d'un déclencheur externe ; la conformité n'est continue que par accident.

### Conservation indéfinie par défaut

* Good, because aucun risque de perte de donnée utile.
* Bad, because non-conformité structurelle à l'obligation de limitation de la conservation.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → politiques de cycle de vie appliquées au niveau des tables avec purge programmée et bornage de l'historique ; `profil:azure` → règles de cycle de vie du stockage (chaud/froid/archive) programmées par catégorie de donnée.
