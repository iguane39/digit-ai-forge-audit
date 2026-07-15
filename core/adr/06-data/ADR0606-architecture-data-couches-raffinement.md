---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "équipes data, équipes analytics"
id: ADR0606
domain: "06"
invariant: false
standards: ["DAMA-DMBOK2 — Chapitre 4 (Data Architecture)", "DAMA-DMBOK2 — Chapitre 6 (Data Storage and Operations)", "ISO/IEC 25010:2011 — maintenabilité (modularité)"]
derived_controls: [CTL-D05-05, CTL-D16-06]
profile_bindings: optional
---

# Architecture data en couches de raffinement progressif

## Context and Problem Statement

Transformer une donnée brute directement en un modèle consommable, en une seule étape opaque, empêche de rejouer un traitement, de localiser où une anomalie a été introduite, et de réutiliser un état intermédiaire pour un autre usage. Comment structurer le traitement des données en étapes distinctes, traçables et réutilisables, indépendamment de la plateforme de traitement ?

## Decision Drivers

* Capacité à rejouer un traitement depuis un état intermédiaire, sans revenir à la source brute
* Localisation rapide de l'étape où une anomalie de qualité a été introduite
* Réutilisation d'une couche intermédiaire par plusieurs cas d'usage
* Indépendance vis-à-vis du moteur de traitement et du format de stockage retenus

## Considered Options

* Couches de raffinement progressif (brute → nettoyée/conforme → métier/consommable), chacune contractuelle et traçable
* Transformation en une seule étape, de la source brute directement au modèle consommable
* Couches ad hoc, définies librement par chaque équipe sans contrat commun

## Decision Outcome

Chosen option: "Couches de raffinement progressif contractuelles", parce que c'est la seule option qui rend chaque étape rejouable, traçable et réutilisable, sans imposer de moteur ni de format particulier.

### Consequences

* Good, because une anomalie se localise à la couche où elle apparaît, sans réexaminer tout le pipeline.
* Good, because une couche intermédiaire nettoyée devient réutilisable par plusieurs cas d'usage sans retraiter la source brute.
* Bad, because chaque couche additionnelle ajoute de la latence et un coût de stockage intermédiaire.
* Neutral, because le nombre exact de couches et leur contrat précis restent un choix d'implémentation.

### Confirmation

Contrôles dérivés : CTL-D05-05 (couches de raffinement documentées avec contrat d'entrée/sortie par couche), CTL-D16-03 (migrations de schéma tracées par couche, avec réversibilité). Preuve attendue : schéma d'architecture des couches et contrats documentés entre couches. Grille : conforme = couches documentées avec contrats et traçabilité de bout en bout ; partiel = couches présentes sans contrat formalisé ; non conforme = transformation opaque en une seule étape non traçable.

## Pros and Cons of the Options

### Couches de raffinement progressif contractuelles

* Good, because rejouabilité, localisation des anomalies et réutilisation inter-cas d'usage.
* Bad, because latence et coût de stockage additionnels.

### Transformation en une seule étape

* Good, because latence minimale, architecture apparemment plus simple.
* Bad, because aucune rejouabilité intermédiaire ; une anomalie oblige à retraiter depuis la source brute.

### Couches ad hoc sans contrat commun

* Good, because liberté totale laissée à chaque équipe.
* Bad, because aucune garantie de compatibilité entre couches produites par des équipes différentes.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → architecture médaillon (bronze/silver/gold) portée nativement par le catalogue technique ; `profil:azure` → zones raw/curated/enriched sur le compte de stockage, droits différenciés par zone.
