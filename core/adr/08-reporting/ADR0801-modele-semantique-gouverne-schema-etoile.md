---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, architectes data"
informed: "équipes produit"
id: ADR0801
domain: "08"
invariant: true
standards: ["Kimball — dimensional modeling (schéma en étoile)", "DMBOK2 (modélisation des données)"]
derived_controls: [CTL-D05-10]
---

# Modèle sémantique gouverné (schéma en étoile)

## Context and Problem Statement

Sans modèle sémantique partagé, chaque rapport recalcule ses propres agrégats et ses
propres définitions de dimension, si bien que deux rapports censés répondre à la même
question métier affichent des chiffres différents. Comment garantir que les rapports et
tableaux de bord s'appuient sur des définitions et des relations communes, gouvernées,
plutôt que sur des calculs recréés à chaque restitution ?

## Decision Drivers

* Cohérence des chiffres entre tous les rapports consommant les mêmes faits métier
* Compréhensibilité du modèle par des utilisateurs non techniques
* Performance des interrogations pour des volumes croissants de données
* Réutilisation d'un même modèle par plusieurs outils ou équipes de restitution

## Considered Options

* Modèle sémantique en schéma en étoile, gouverné, partagé par toute la restitution
* Modèle relationnel normalisé exposé directement aux outils de restitution
* Agrégats et définitions recalculés indépendamment dans chaque rapport

## Decision Outcome

Chosen option: "Modèle sémantique en schéma en étoile gouverné", parce qu'il offre le
meilleur compromis entre compréhensibilité pour un utilisateur métier, performance
d'interrogation et gouvernance centralisée des définitions, là où les deux autres options
font porter la cohérence sur chaque rapport pris isolément.

### Consequences

* Good, because une définition de mesure ou de dimension n'existe qu'à un seul endroit, gouverné.
* Good, because la structure en étoile reste lisible et navigable par un utilisateur non technicien.
* Bad, because une autorité de modélisation doit valider toute évolution du modèle (délai).
* Neutral, because une discipline de conception dimensionnelle est requise en amont d'un besoin.

### Confirmation

Contrôles dérivés : CTL-D05-01 (modèle sémantique documenté et validé par une autorité
de modélisation avant exposition — mode revue), CTL-D05-02 (toute mesure exposée est
définie une seule fois dans le modèle gouverné — mode revue). Preuve attendue : schéma
du modèle sémantique + registre des définitions de mesures. Grille : conforme = modèle
en étoile documenté, gouverné, sans définition dupliquée ; partiel = modèle documenté
avec dérogations ponctuelles ; non conforme = absence de modèle sémantique gouverné.

## Pros and Cons of the Options

### Schéma en étoile gouverné
* Good, because lisible, performant, définitions centralisées.
* Bad, because gouvernance de modélisation à opérer en continu.

### Modèle relationnel normalisé exposé tel quel
* Good, because aucune duplication de structure, fidèle au système source.
* Bad, because illisible pour un utilisateur métier, jointures coûteuses en restitution.

### Agrégats recalculés par rapport
* Good, because autonomie totale de chaque rapport.
* Bad, because divergence garantie des chiffres entre rapports, aucune définition commune.

## More Information

Instanciations : le motif de modélisation dimensionnelle (faits, dimensions, schéma en
étoile) reste un standard ouvert ; `profil:powerbi` → modèle sémantique publié en tant
que jeu de données partagé et certifié.
