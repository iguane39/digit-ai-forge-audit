---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "équipes produit, équipes analytics"
id: ADR0604
domain: "06"
invariant: false
standards: ["DAMA-DMBOK2 — Chapitre 10 (Reference and Master Data)", "ISO 8000-110 — qualité syntaxique et sémantique des données maîtres"]
derived_controls: [CTL-D05-03]
profile_bindings: optional
---

# Référentiels comme sources d'or (golden sources)

## Context and Problem Statement

Quand une même entité de référence (client, produit, site, fournisseur) est répliquée et modifiée indépendamment dans plusieurs systèmes, aucune version ne fait autorité : les rapprochements deviennent manuels et les rapports divergent selon la source consultée. Comment désigner, pour chaque référentiel critique, une source qui fait autorité et empêcher l'émergence de sources concurrentes non déclarées ?

## Decision Drivers

* Unicité de la vérité pour les entités de référence partagées entre domaines
* Réduction des rapprochements manuels et des écarts constatés entre rapports
* Traçabilité de la provenance pour toute donnée de référence consommée en aval
* Compatibilité avec des référentiels hérités déjà dupliqués

## Considered Options

* Golden source déclarée par référentiel critique, publication en aval depuis elle seule
* Réplication tolérée entre systèmes, réconciliation périodique a posteriori
* Absence de désignation ; chaque consommateur choisit sa propre source de référence

## Decision Outcome

Chosen option: "Golden source déclarée par référentiel", parce qu'elle supprime la question de l'arbitrage a posteriori et rend la provenance vérifiable, alors que la réconciliation périodique ne fait que gérer la divergence après qu'elle s'est produite.

### Consequences

* Good, because les rapprochements manuels entre systèmes disparaissent pour les référentiels couverts.
* Good, because toute donnée de référence consommée est traçable jusqu'à sa source faisant autorité.
* Bad, because désigner une golden source suppose un arbitrage organisationnel parfois difficile entre systèmes historiques concurrents.
* Neutral, because les référentiels non encore couverts doivent être priorisés dans le temps.

### Confirmation

Contrôles dérivés : CTL-D05-03 (golden source déclarée et documentée par référentiel critique), CTL-D15-03 (absence de source concurrente non déclarée détectée en revue). Preuve attendue : registre des référentiels avec la golden source associée et résultat de la revue de détection de doublons. Grille : conforme = golden source déclarée et aucune source concurrente non déclarée ; partiel = golden source déclarée avec exceptions documentées ; non conforme = référentiel critique sans golden source.

## Pros and Cons of the Options

### Golden source déclarée par référentiel

* Good, because vérité unique, traçable et opposable.
* Bad, because arbitrage organisationnel initial parfois coûteux.

### Réplication tolérée avec réconciliation périodique

* Good, because n'impose pas de refonte immédiate des systèmes existants.
* Bad, because la divergence existe entre deux cycles de réconciliation, dont le coût reste récurrent.

### Absence de désignation

* Good, because aucun effort organisationnel requis.
* Bad, because chaque rapport peut légitimement afficher une valeur différente pour la même entité.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → référentiels gouvernés dans des schémas dédiés avec accès en écriture restreint à l'équipe productrice ; `profil:azure` → golden source publiée et badgée dans Microsoft Purview.
