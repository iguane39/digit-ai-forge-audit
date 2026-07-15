---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes FinOps, {roles.remediation_team}"
informed: "équipes produit, support applicatif"
id: ADR0103
domain: "01"
invariant: false
standards: ["FinOps Framework — domaine Allocation (chargeback)", "ITIL 4 — pratique Service Configuration Management"]
derived_controls: [CTL-D00-04, CTL-D07-03, CTL-D12-02]
---

# Traçabilité applicative de bout en bout (tag « application »)

## Context and Problem Statement

Même avec une taxonomie de tags en place, l'absence d'une clé unique et obligatoire
identifiant l'application propriétaire empêche de relier une ressource technique à un
produit, un budget ou une astreinte : un incident sur une ressource isolée ne permet pas
de savoir quelle équipe prévenir, ni quel budget imputer. Comment garantir qu'à partir de
n'importe quelle ressource, on retrouve sans ambiguïté l'application dont elle dépend ?

## Decision Drivers

* Routage immédiat d'un incident vers l'équipe applicative propriétaire
* Chargeback et allocation de coût fiables au niveau de l'application, pas seulement du domaine
* Cohérence entre l'inventaire technique des ressources et le référentiel de services
* Absence d'ambiguïté : une ressource appartient à une et une seule application

## Considered Options

* Clé de tag « application » obligatoire, alignée sur l'identifiant du référentiel de services, contrôlée et réconciliée périodiquement
* Rattachement déduit du périmètre d'hébergement ou de gestion, sans clé dédiée
* Rattachement documenté séparément dans un tableau de correspondance maintenu manuellement

## Decision Outcome

Chosen option: "Clé de tag application obligatoire et réconciliée", parce qu'elle seule
fournit un lien direct, machine-lisible et vérifiable entre chaque ressource et
l'application dont elle dépend, sans dépendre d'une convention de périmètre ni d'un
document annexe qui dérive avec le temps.

### Consequences

* Good, because tout incident ou anomalie de coût se résout par une simple consultation, plutôt qu'une enquête.
* Good, because la réconciliation périodique détecte les ressources orphelines avant qu'elles ne deviennent un angle mort d'audit.
* Bad, because les ressources partagées entre plusieurs applications exigent une règle explicite de rattachement ou de répartition (lien ADR0101).
* Neutral, because l'identifiant d'application utilisé dans le tag doit rester stable dans le temps, aligné sur le référentiel de services (lien ADR0105).

### Confirmation

Contrôles dérivés : CTL-D07-03 (totalité des ressources porteuses d'un tag application
valide, résolu dans le référentiel de services), CTL-D12-03 (délai de résolution
ressource → application → astreinte mesuré et borné). Preuve attendue : rapport de
réconciliation tag/référentiel et exemple de résolution d'incident chronométrée. Grille :
conforme = résolution à 100 %, réconciliation automatisée ; partiel = résolution manuelle
documentée pour les écarts ; non conforme = ressources orphelines non détectées.

## Pros and Cons of the Options

### Tag application obligatoire et réconcilié
* Good, because lien direct et vérifiable entre ressource et application propriétaire.
* Bad, because les ressources mutualisées exigent une règle de rattachement explicite.

### Rattachement déduit du périmètre de gestion
* Good, because aucune métadonnée additionnelle requise.
* Bad, because un périmètre peut héberger plusieurs applications : rattachement ambigu.

### Tableau de correspondance manuel
* Good, because mise en place immédiate sans automatisation.
* Bad, because dérive rapide, aucune détection automatique des ressources orphelines.

## More Information

Instanciations par profil : `profil:azure` → tag applicatif réconcilié par une fonction
planifiée interrogeant le graphe des ressources ; `profil:cmdb-outillee` → réconciliation
native lorsque le référentiel de services expose une interface d'inventaire technique.
