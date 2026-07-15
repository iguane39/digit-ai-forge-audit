---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, architectes data"
informed: "équipes produit"
id: ADR0803
domain: "08"
invariant: false
standards: ["ELT patterns (transformation near the source)", "DMBOK2 (intégration des données)"]
derived_controls: [CTL-D05-12]
---

# Transformations au plus près de la source

## Context and Problem Statement

Quand la logique de transformation (jointures, calculs, agrégations complexes) est
recréée dans chaque outil de restitution plutôt que réalisée une fois près de la source,
elle est réécrite par chaque équipe de rapport, dans un langage propre à son outil, sans
contrôle de version ni test partagé. Comment garantir que la logique de transformation
des données est gouvernée et réutilisable plutôt que dispersée dans chaque outil de
restitution ?

## Decision Drivers

* Réutilisation d'une même logique de transformation par plusieurs rapports
* Testabilité et versionnement de la transformation indépendamment de l'outil de restitution
* Performance : éviter de recalculer la même transformation à chaque ouverture de rapport
* Portabilité : changer d'outil de restitution ne doit pas obliger à réécrire la logique métier

## Considered Options

* Transformations réalisées au plus près de la source, testées et versionnées
* Transformations réparties : une partie près de la source, une partie dans chaque outil
* Transformations intégralement réalisées dans l'outil de restitution, à l'affichage

## Decision Outcome

Chosen option: "Transformations au plus près de la source", parce qu'elle rend la
logique testable, versionnée et réutilisable indépendamment de l'outil de restitution,
alors que les deux autres options dispersent tout ou partie de cette logique dans des
couches non versionnées et non testées.

### Consequences

* Good, because une même transformation validée sert tous les rapports qui en dépendent.
* Good, because ajouter un outil de restitution ne nécessite pas de réécrire la logique métier.
* Bad, because toute évolution suit un cycle de livraison propre, plus lent qu'un calcul local.
* Neutral, because un socle de test dédié aux transformations doit être maintenu près de la source.

### Confirmation

Contrôles dérivés : CTL-D05-05 (logique de transformation testée et versionnée près de
la source, hors outil de restitution — mode revue), CTL-D05-06 (aucun calcul métier
significatif recréé dans l'outil de restitution — mode revue). Preuve attendue :
inventaire des transformations avec leur emplacement + suite de tests associée. Grille :
conforme = transformations significatives toutes près de la source, testées ; partiel =
calculs mineurs résiduels documentés ; non conforme = logique substantielle recréée en
restitution.

## Pros and Cons of the Options

### Transformations près de la source
* Good, because testable, versionné, réutilisable par tout outil de restitution.
* Bad, because cycle de livraison plus lent qu'un calcul local instantané.

### Transformations réparties
* Good, because compromis apparent entre rapidité locale et mutualisation.
* Bad, because logique dupliquée partiellement, incohérences difficiles à localiser.

### Transformations dans l'outil de restitution
* Good, because itération immédiate sans cycle de livraison.
* Bad, because logique non testée, non réutilisable, réécrite par rapport et par outil.

## More Information

Instanciations : le motif de transformation en amont (ELT gouverné près de la source)
reste un standard ouvert ; `profil:databricks-lakehouse` → orchestration et test des
transformations avant exposition à la restitution.
