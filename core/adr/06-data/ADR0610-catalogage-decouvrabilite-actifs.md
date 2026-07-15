---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "toutes les équipes produit"
id: ADR0610
domain: "06"
invariant: false
standards: ["DAMA-DMBOK2 — Chapitre 12 (Metadata Management)", "FAIR Principles (GO FAIR, 2016) — Findable, Accessible, Interoperable, Reusable"]
derived_controls: [CTL-D13-07, CTL-D15-07, CTL-D16-07]
profile_bindings: optional
---

# Catalogage et découvrabilité des actifs data

## Context and Problem Statement

Un actif de données qui existe sans être répertorié équivaut, pour le reste de l'organisation, à un actif qui n'existe pas : il est redécouvert à chaque besoin, souvent en dupliquant un traitement déjà réalisé ailleurs. Comment garantir que tout actif de données produit est trouvable, décrit et réutilisable par des équipes autres que celle qui l'a créé ?

## Decision Drivers

* Réduction de la duplication de traitements déjà réalisés ailleurs dans l'organisation
* Recherche d'un actif par son sens métier, sans connaître son emplacement technique
* Réutilisabilité effective, au-delà de la simple existence technique de l'actif
* Neutralité vis-à-vis de l'outil de catalogage retenu

## Considered Options

* Catalogue central des actifs data, alimenté à la publication, description métier obligatoire
* Documentation dispersée par équipe (wiki, fichiers), sans registre central
* Aucune documentation formelle ; la découverte se fait par le bouche-à-oreille

## Decision Outcome

Chosen option: "Catalogue central alimenté à la publication", parce que c'est la seule option qui rend un actif trouvable par une équipe qui ignore son existence, condition nécessaire à la réutilisation à l'échelle de l'organisation.

### Consequences

* Good, because un actif existant est retrouvé avant qu'un traitement équivalent ne soit redéveloppé ailleurs.
* Good, because la description métier associée réduit le besoin de solliciter l'équipe créatrice.
* Bad, because alimenter le catalogue à chaque publication ajoute une étape au cycle de livraison.
* Neutral, because la qualité de la description dépend de la discipline des équipes productrices.

### Confirmation

Contrôles dérivés : CTL-D15-06 (catalogue de données publié et à jour pour les actifs en production), CTL-D16-06 (dictionnaire de données découvrable et recherchable par sens métier). Preuve attendue : extrait du catalogue montrant couverture et fraîcheur des descriptions, et taux d'actifs en production répertoriés. Grille : conforme = catalogue à jour couvrant tous les actifs en production ; partiel = couverture incomplète ; non conforme = absence de catalogue central.

## Pros and Cons of the Options

### Catalogue central alimenté à la publication

* Good, because découvrabilité organisationnelle et réduction de la duplication.
* Bad, because étape supplémentaire au cycle de publication.

### Documentation dispersée par équipe

* Good, because chaque équipe documente selon ses propres habitudes.
* Bad, because aucune recherche transverse possible ; la documentation se perd avec le turnover.

### Aucune documentation formelle

* Good, because aucun effort de documentation requis.
* Bad, because chaque besoin redéclenche une enquête ou une duplication de traitement existant.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → catalogue technique natif avec recherche par tag métier et indicateurs de popularité ; `profil:powerbi` → portail de contenus certifiés et promus, exposant les jeux de données réutilisables.
