---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0707
domain: "07"
invariant: false
standards: ["OpenAPI (annotations de dépréciation)", "SemVer 2.0.0 (ruptures majeures)"]
derived_controls: [CTL-D01-14]
---

# Stratégie d'obsolescence et de retrait d'API (deprecation)

## Context and Problem Statement

Une version d'API qui reste accessible indéfiniment après la mise à disposition de sa
remplaçante accumule des consommateurs non migrés et des versions non maintenues, non
surveillées, dont la surface d'attaque grandit sans contrôle. Ce sujet n'est couvert par
aucune décision explicite : chaque équipe retire ou laisse vivre ses anciennes versions
selon sa propre appréciation. Comment organiser le retrait progressif d'une version d'API
sans rompre ses consommateurs par surprise ?

## Decision Drivers

* Prévisibilité du retrait pour les consommateurs (délai, communication, échéance)
* Réduction de la surface exposée aux versions non maintenues ou non surveillées
* Incitation mesurable à la migration vers la version courante
* Application uniforme de la règle de retrait, quelle que soit l'API concernée

## Considered Options

* Politique d'obsolescence formalisée : annonce, préavis, échéance de retrait publiée
* Retrait informel décidé au cas par cas par l'équipe propriétaire de l'API
* Maintien indéfini de toutes les versions publiées, sans retrait

## Decision Outcome

Chosen option: "Politique d'obsolescence formalisée", parce qu'elle donne aux
consommateurs une échéance opposable pour migrer, borne dans le temps la durée de vie
des versions non maintenues, et s'applique de façon identique à toute API du système,
contrairement à une appréciation au cas par cas.

### Consequences

* Good, because les consommateurs disposent d'un délai de préavis connu avant tout retrait.
* Good, because le nombre de versions actives simultanément reste borné et surveillé.
* Bad, because un suivi des consommateurs par version doit exister pour cibler la communication.
* Neutral, because certaines migrations tardives peuvent nécessiter une prolongation négociée.

### Confirmation

Contrôles dérivés : CTL-D01-06 (échéance de retrait publiée et respectée pour chaque
version dépréciée — mode revue), CTL-D02-06 (aucune version dépréciée au-delà de son
échéance ne reste accessible — mode automatique). Preuve attendue : registre des
versions avec statut et échéance + communication de dépréciation publiée. Grille :
conforme = dépréciation suit délai de préavis et échéance respectée ; partiel = échéance
dépassée sur périmètre limité et dérogé ; non conforme = version maintenue sans échéance.

## Pros and Cons of the Options

### Politique d'obsolescence formalisée
* Good, because délai opposable, surface exposée bornée, règle uniforme.
* Bad, because suivi des consommateurs par version à outiller.

### Retrait informel au cas par cas
* Good, because flexibilité maximale pour l'équipe propriétaire.
* Bad, because imprévisibilité pour les consommateurs, retraits non coordonnés.

### Maintien indéfini de toutes les versions
* Good, because aucun risque de rupture pour un consommateur non migré.
* Bad, because accumulation de versions non maintenues et surface d'attaque croissante.

## More Information

Instanciations : le signal de dépréciation (annotation dans le contrat d'interface,
en-tête de réponse signalant l'échéance) reste une convention ouverte ; `profil:azure` →
analytique de la passerelle d'API par version pour piloter le suivi des consommateurs.
