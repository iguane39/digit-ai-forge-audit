---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, architectes data"
informed: "équipes produit"
id: ADR0802
domain: "08"
invariant: true
standards: ["Kimball — bus matrix / source unique", "DMBOK2 (intégration et interopérabilité des données)"]
derived_controls: [CTL-D05-11]
---

# Source unique et homogène pour la couche BI

## Context and Problem Statement

Quand plusieurs rapports puisent chacun dans une extraction, une copie ou un calcul qui
leur est propre, deux tableaux de bord censés décrire la même réalité peuvent diverger
silencieusement — chacun ayant raison localement, sans qu'aucun ne fasse référence.
Comment garantir que toute la couche de restitution s'appuie sur une source de données
unique et homogène, plutôt que sur des copies ou extractions parallèles ?

## Decision Drivers

* Une seule version des chiffres pour une même question métier, quel que soit le rapport
* Traçabilité du chemin entre la source de vérité et chaque restitution
* Réduction des copies et extractions parallèles non gouvernées
* Effort de maintenance proportionné (une évolution de source, une seule propagation)

## Considered Options

* Couche BI alimentée exclusivement depuis la source de vérité gouvernée
* Extractions ponctuelles par rapport, actualisées selon leur propre calendrier
* Copies locales aux équipes, dupliquées et resynchronisées manuellement

## Decision Outcome

Chosen option: "Source de vérité gouvernée exclusive", parce que c'est la seule option
qui élimine par construction la divergence entre rapports : toute restitution descend du
même chemin de données, avec une seule propagation à opérer en cas d'évolution.

### Consequences

* Good, because deux rapports posant la même question métier renvoient toujours le même chiffre.
* Good, because une évolution de la source se propage une seule fois, sans réplication par rapport.
* Bad, because la couche de restitution dépend de la disponibilité et de la fraîcheur de la source.
* Neutral, because les extractions historiques déjà en circulation doivent être migrées progressivement.

### Confirmation

Contrôles dérivés : CTL-D05-03 (couche BI alimentée exclusivement depuis la source
gouvernée recensée — mode revue), CTL-D05-04 (aucune extraction ou copie parallèle non
recensée alimentant un rapport — mode automatique). Preuve attendue : cartographie des
sources par rapport + inventaire des extractions actives. Grille : conforme = 100 % des
rapports sur source unique recensée ; partiel = extractions résiduelles dérogées et
datées ; non conforme = extraction parallèle non recensée détectée.

## Pros and Cons of the Options

### Source de vérité gouvernée exclusive
* Good, because cohérence garantie, propagation unique des évolutions.
* Bad, because dépendance forte à la disponibilité de la source.

### Extractions ponctuelles par rapport
* Good, because réactivité immédiate pour un besoin isolé.
* Bad, because calendriers d'actualisation divergents, chiffres qui dérivent entre rapports.

### Copies locales resynchronisées manuellement
* Good, because autonomie complète de l'équipe qui la détient.
* Bad, because resynchronisation oubliée ou retardée ; source de vérité perdue de vue.

## More Information

Instanciations : `profil:databricks-lakehouse` → couche de service unique exposée à
tous les outils de restitution ; le profil de restitution (par ex. `profil:powerbi`)
consomme exclusivement cette source unique.
