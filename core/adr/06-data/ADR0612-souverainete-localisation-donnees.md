---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "{roles.security_officer}, toutes les équipes produit"
id: ADR0612
domain: "06"
invariant: true
standards: ["RGPD — art. 25 (protection des données dès la conception, étendue architecturalement à la résidence)", "ISO/IEC 27018:2019 (protection des données à caractère personnel dans les services d'informatique en nuage publics)"]
derived_controls: [CTL-D05-16]
profile_bindings: optional
---

# Souveraineté et localisation des données par conception

## Context and Problem Statement

ADR0304 encadre le mécanisme légal de transfert d'une donnée déjà localisée, flux par flux ; il ne dit rien de la décision amont, celle de savoir où une donnée doit résider dès sa conception, selon sa classification. Sans exigence de résidence déclarée à la conception, la localisation effective d'un actif de données résulte d'un choix d'hébergement par défaut, non tracé, découvert a posteriori — souvent lors d'un incident ou d'un audit. Comment garantir que la résidence des données est décidée, déclarée et vérifiable dès la conception de chaque actif, indépendamment du mécanisme de transfert qui s'appliquerait ensuite à un flux donné ?

## Decision Drivers

* Décision de résidence prise à la conception, pas constatée après coup
* Traçabilité de la résidence par classification de donnée, pas par défaut d'hébergement
* Vérifiabilité technique de la localisation effective, indépendamment de la déclaration contractuelle
* Distinction claire avec le mécanisme légal de transfert (ADR0304), pour éviter la duplication

## Considered Options

* Exigence de résidence déclarée par classification dès la conception, vérifiée techniquement
* Résidence déterminée implicitement par le choix d'hébergement par défaut, sans déclaration dédiée
* Résidence traitée uniquement au moment d'un transfert, en extension amont du mécanisme d'ADR0304

## Decision Outcome

Chosen option: "Exigence de résidence déclarée par conception et vérifiée", parce que c'est la seule option qui rend la localisation opposable dès la conception plutôt que découverte a posteriori, tout en restant distincte et complémentaire du mécanisme de transfert déjà couvert par ADR0304.

### Consequences

* Good, because chaque actif de données porte une exigence de résidence explicite, alignée sur sa classification.
* Good, because la localisation effective devient vérifiable techniquement, pas seulement déclarative.
* Bad, because certains hébergements existants peuvent s'avérer non conformes une fois l'exigence formalisée, exigeant une migration.
* Neutral, because les exigences de résidence applicables varient par classification et par contexte réglementaire du tenant ; le corps générique ne fixe aucune juridiction.

### Confirmation

Contrôles dérivés : CTL-D05-16 (chaque actif de données classifié porte une exigence de résidence déclarée dès sa conception, et la localisation effective de son stockage et de son traitement est vérifiée techniquement en cohérence avec cette exigence — mode automatique + revue). Preuve attendue : registre de classification avec exigence de résidence par actif + rapport de vérification technique de la localisation (région de stockage/traitement effective). Grille : conforme = 100 % des actifs classifiés avec résidence déclarée et localisation vérifiée conforme ; partiel = résidence déclarée non vérifiée techniquement ; non conforme = absence de déclaration ou localisation constatée non conforme.

## Pros and Cons of the Options

### Exigence de résidence déclarée et vérifiée
* Good, because résidence opposable dès la conception, vérifiable techniquement.
* Bad, because peut révéler des écarts sur des actifs déjà hébergés, exigeant une migration.

### Résidence implicite par défaut d'hébergement
* Good, because aucune déclaration additionnelle requise au démarrage.
* Bad, because la localisation réelle n'est jamais tracée ni vérifiée, elle dépend d'un choix technique non gouverné.

### Résidence traitée seulement au moment du transfert
* Good, because réutilise le mécanisme existant d'ADR0304 sans nouvelle structure.
* Bad, because ne couvre pas le stockage initial ; un actif jamais transféré reste sans exigence de résidence déclarée.

## More Information

Instanciations par profil : `profil:azure` → épinglage de région et politiques de résidence appliquées au niveau de l'abonnement ou du groupe de ressources ; `profil:aws` → contrainte de région par compte ou organisation. Les exigences de résidence applicables (juridictions couvertes, dérogations) sont définies par les packs réglementaires du tenant, pas par ce corps générique. Distinct d'ADR0304 : cet ADR couvre la décision de résidence à la conception, ADR0304 le mécanisme de transfert d'un flux déjà en cours.
