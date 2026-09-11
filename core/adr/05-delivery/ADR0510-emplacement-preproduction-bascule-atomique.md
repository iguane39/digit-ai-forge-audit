---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes produit, {roles.remediation_team}"
informed: "toutes les équipes produit"
id: ADR0510
domain: "05"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D09-08]
---

# Mise en production par emplacement de préproduction et bascule atomique

## Context and Problem Statement

Une mise en production qui écrase l'instance en service expose deux risques inséparables : l'application est indisponible pendant le déploiement, et le retour arrière suppose de rejouer un déploiement complet — au moment précis où la confiance dans la chaîne est la plus faible. Comment mettre en production une application web sans fenêtre d'indisponibilité et avec un retour arrière immédiat, indépendamment de la plateforme d'hébergement ?

## Decision Drivers

* Aucune fenêtre d'indisponibilité imputable au déploiement lui-même
* Retour arrière en un geste, sans reconstruction ni redéploiement
* Vérification de la version sur un environnement identique à la production avant qu'elle serve du trafic
* Neutralité vis-à-vis de la plateforme : un emplacement de préproduction est une capacité, pas un produit

## Considered Options

* Déploiement sur un emplacement de préproduction porté par le service d'hébergement managé, vérification sur cet emplacement, puis bascule atomique — le retour arrière étant la bascule inverse
* Déploiement en place sur l'instance en service, avec redéploiement de la version précédente en cas d'échec
* Déploiement sur une infrastructure parallèle complète (duplication de l'environnement) commutée par le routage

## Decision Outcome

Chosen option: "Emplacement de préproduction et bascule atomique", parce que c'est la seule option qui offre à la fois la vérification avant service et le retour arrière immédiat sans dupliquer toute l'infrastructure : la version candidate est déployée hors trafic, contrôlée, puis mise en service par une bascule qui s'inverse aussi vite qu'elle s'applique.

### Consequences

* Good, because le retour arrière ne dépend plus de la disponibilité de la chaîne de construction.
* Good, because la version candidate est vérifiée dans les conditions de la production, pas dans un environnement approchant.
* Bad, because l'état partagé (base de données, files) ne bascule pas : les évolutions de schéma doivent rester compatibles avec les deux versions le temps de la bascule.
* Neutral, because le service d'hébergement doit offrir cette capacité, ce qui oriente le choix de plateforme.

### Confirmation

Contrôle dérivé : CTL-D09-08 (les mises en production de l'application passent par un emplacement de préproduction vérifié puis une bascule, et le retour arrière est la bascule inverse, éprouvée — mode automatique + revue). Preuve attendue : configuration de l'emplacement de préproduction, journal des dernières bascules avec horodatage, et trace d'un retour arrière joué. Grille : conforme = emplacement configuré, bascules tracées et retour arrière éprouvé ≤ 12 mois ; partiel = emplacement configuré mais retour arrière jamais joué ; non conforme = déploiement en place sur l'instance en service.

## Pros and Cons of the Options

### Emplacement de préproduction et bascule atomique

* Good, because indisponibilité nulle et retour arrière immédiat pour un coût d'infrastructure marginal.
* Bad, because impose une discipline de compatibilité sur l'état partagé (schéma, files, cache).

### Déploiement en place

* Good, because aucun prérequis de plateforme.
* Bad, because indisponibilité systématique et retour arrière dépendant de la chaîne de construction.

### Infrastructure parallèle complète

* Good, because isole totalement les deux versions, état compris.
* Bad, because double le coût d'infrastructure et déplace la difficulté vers la synchronisation des données.

## More Information

Complète ADR0509 (stratégie de retour arrière testée) en lui donnant son mécanisme par défaut pour les charges web, et ADR0506 (séparation et promotion des environnements) en précisant le dernier maillon de la promotion. Instanciations par profil : `profil:azure` → slots de déploiement d'App Service avec swap ; autres profils → mécanisme de déploiement bleu/vert équivalent offert par la plateforme.

**À compléter** (`a_completer: true`) : la source de référence dont cette décision est issue ne cite **aucune norme externe** — le champ `standards` reste vide et doit être renseigné avant toute opposabilité. À compléter également : la règle de compatibilité de schéma imposée pendant la bascule, non fournie par la source.
