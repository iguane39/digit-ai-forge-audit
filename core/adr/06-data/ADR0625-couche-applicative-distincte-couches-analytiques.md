---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.architect}, {roles.data_roles.owner}, équipes produit"
informed: "toutes les équipes produit"
id: ADR0625
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D16-10]
---

# Couche applicative distincte des couches de raffinement analytiques

## Context and Problem Statement

Une application qui s'appuie sur une plateforme de données finit par y écrire : état applicatif, paramétrage, résultats intermédiaires, journaux fonctionnels. Ces écritures atterrissent dans les mêmes couches que les données analytiques raffinées, où elles n'ont ni propriétaire, ni contrat, ni rétention — et où elles deviennent, à la première réécriture de couche, une dépendance invisible qui casse l'application. Comment garantir que les données propres à une application ne se confondent jamais avec les couches de raffinement analytiques ?

## Decision Drivers

* Séparation des cycles de vie : l'état applicatif change au rythme de l'application, pas à celui des traitements analytiques
* Propriété et contrat explicites : une donnée applicative a un propriétaire applicatif, une donnée analytique un propriétaire data
* Reconstruction des couches analytiques sans casser une application
* Neutralité vis-à-vis de la plateforme de données retenue

## Considered Options

* Couche applicative dédiée, distincte des couches de raffinement analytiques, seule destination des écritures applicatives, consommant les couches analytiques en lecture
* Écriture applicative directe dans la couche de raffinement la plus aval
* Aucune séparation déclarée : chaque application choisit sa destination

## Decision Outcome

Chosen option: "Couche applicative dédiée", parce que c'est la seule option qui laisse les couches analytiques reconstructibles : elles restent alimentées par les traitements de raffinement seuls, tandis que l'état applicatif vit dans une couche qui lui appartient, avec sa propre rétention et son propre propriétaire. L'application lit les couches analytiques, elle n'y écrit pas.

### Consequences

* Good, because une couche analytique peut être reconstruite sans détruire d'état applicatif.
* Good, because chaque donnée a un propriétaire lisible : applicatif ou data, jamais les deux à moitié.
* Bad, because impose parfois une recopie de données de référence vers la couche applicative.
* Neutral, because la frontière doit être documentée : sans elle, la couche applicative devient un dépotoir.

### Confirmation

Contrôle dérivé : CTL-D16-10 (les données propres à l'application résident dans une couche applicative déclarée, distincte des couches de raffinement analytiques, et aucune écriture applicative n'est constatée dans ces dernières — mode revue). Preuve attendue : cartographie des couches avec la couche applicative identifiée, et inventaire des écritures réelles de l'application par couche. Grille : conforme = toutes les écritures applicatives dans la couche applicative ; partiel = couche déclarée mais écritures résiduelles ailleurs ; non conforme = aucune couche applicative déclarée, ou écritures directes dans les couches analytiques.

## Pros and Cons of the Options

### Couche applicative dédiée

* Good, because couches analytiques reconstructibles, propriétés lisibles.
* Bad, because recopie de données de référence dans certains cas.

### Écriture directe dans la couche aval

* Good, because aucune recopie, une seule copie de la donnée.
* Bad, because toute reconstruction de la couche détruit l'état applicatif ; propriété indéterminable.

### Aucune séparation déclarée

* Good, because liberté totale des équipes, zéro coordination.
* Bad, because la frontière se découvre au premier incident, et elle n'existe alors plus.

## More Information

Complète ADR0606 (architecture data en couches de raffinement) en ajoutant la couche qui lui manquait — celle de l'application — et ADR0601 (propriété des données) en rendant le propriétaire déductible de la couche. Instanciations par profil : `profil:databricks-lakehouse` → catalogue ou schéma dédié à l'application, distinct des couches de raffinement ; `profil:azure` → base applicative managée distincte de la plateforme analytique.

**À compléter** (`a_completer: true`) : la source de référence dont cette décision est issue ne cite **aucune norme externe** — le champ `standards` reste vide et doit être renseigné avant toute opposabilité. À compléter également : la liste des natures de données qui relèvent de la couche applicative, non fournie par la source.
