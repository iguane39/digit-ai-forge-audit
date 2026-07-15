---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.remediation_team}, équipes FinOps"
informed: "toutes les équipes produit"
id: ADR0102
domain: "01"
invariant: false
standards: ["FinOps Framework — domaine Allocation (tagging)", "ISO 55001:2014 (gestion d'actifs — identification)"]
derived_controls: [CTL-D07-01, CTL-D07-02]
---

# Stratégie de tagging et d'étiquetage des ressources

## Context and Problem Statement

Sans convention d'étiquetage obligatoire, l'imputation des coûts, la recherche de
ressources et l'application de politiques automatisées de cycle de vie deviennent
impossibles à l'échelle du portefeuille : chaque équipe invente sa propre nomenclature,
incompatible avec les autres. Comment garantir qu'une ressource, quel que soit son type ou
son hébergeur, porte dès sa création un socle minimal de métadonnées exploitables ?

## Decision Drivers

* Imputation fiable des coûts par produit, environnement et domaine de gouvernance
* Automatisation des politiques de cycle de vie fondée sur la métadonnée, pas sur le nom
* Recherche et inventaire transverses, indépendants de la mémoire d'une équipe
* Convention indépendante de l'hébergeur, applicable dès la création de la ressource

## Considered Options

* Taxonomie de tags obligatoire et normalisée, appliquée et contrôlée dès la création
* Convention de nommage des ressources comme seul vecteur de métadonnées, sans tag structuré
* Tagging recommandé mais laissé à la discrétion de chaque équipe, sans contrôle

## Decision Outcome

Chosen option: "Taxonomie de tags obligatoire et contrôlée", parce que seule une métadonnée
structurée et vérifiée à la création reste exploitable par des automatismes à l'échelle du
portefeuille, là où un nom de ressource ou une convention non contrôlée dérive rapidement.

### Consequences

* Good, because le coût est imputable par produit, environnement et domaine sans reconstruction manuelle.
* Good, because les politiques de cycle de vie peuvent cibler les ressources par métadonnée plutôt que par liste énumérée.
* Bad, because un contrôle bloquant à la création peut ralentir un provisionnement non conforme, effet recherché mais à outiller pour rester acceptable.
* Neutral, because la liste exacte des clés obligatoires au-delà du socle minimal relève de l'overlay.

### Confirmation

Contrôles dérivés : CTL-D07-01 (taxonomie de tags minimale définie et publiée), CTL-D07-02
(taux de conformité de tagging mesuré, avec alerte sur ressources non conformes). Preuve
attendue : rapport de conformité de tagging du portefeuille et politique de contrôle à la
création. Grille : conforme = au moins 98 % des ressources conformes avec contrôle
bloquant actif ; partiel = mesure en place sans contrôle bloquant ; non conforme = aucune
mesure de conformité disponible.

## Pros and Cons of the Options

### Taxonomie obligatoire et contrôlée à la création
* Good, because métadonnée fiable et exploitable par les automatismes à l'échelle.
* Bad, because friction possible au provisionnement en cas de non-conformité.

### Convention de nommage seule
* Good, because aucun outillage de contrôle à mettre en place.
* Bad, because non structurée, non requêtable, dérive dès qu'une équipe s'écarte de la convention.

### Tagging recommandé sans contrôle
* Good, because aucune contrainte perçue par les équipes.
* Bad, because conformité mesurée en pratique proche de zéro, imputation impossible.

## More Information

Instanciations par profil : `profil:azure` → politique de gouvernance pour le contrôle à
la création et tableau de gestion des coûts pour la mesure ; `profil:aws` → politiques de
tags au niveau de l'organisation et explorateur de coûts. Le socle minimal de clés
(application, environnement, domaine, propriétaire) est défini au niveau core.
