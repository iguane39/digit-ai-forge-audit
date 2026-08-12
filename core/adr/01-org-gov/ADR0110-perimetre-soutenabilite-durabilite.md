---
status: "proposed"
date: 2026-08-12
decision-makers: "{roles.decision_authority}"
consulted: "équipe produit, équipes FinOps"
informed: "toutes les équipes produit"
id: ADR0110
domain: "01"
invariant: false
standards: ["Green Software Foundation — Software Carbon Intensity (SCI)", "FinOps Foundation — FinOps Framework 2025/2026 (recoupement Cost × Carbone)"]
derived_controls: [CTL-D07-09]
---

# Périmètre du pilier soutenabilité : statuer sur son adoption

## Context and Problem Statement

Les référentiels Well-Architected 2026 (grands fournisseurs cloud) traitent désormais la
soutenabilité comme un pilier de plein rang, au même titre que le coût ou la fiabilité. Le
référentiel core actuel n'a ni dimension ni famille dédiée à ce sujet. Faut-il créer un pilier
de plein rang (dimension ou famille dédiée), l'ignorer, ou l'adopter sous une forme plus modeste
mais réellement exigible dès aujourd'hui ? La question doit être tranchée explicitement — un
silence sur ce point serait lui-même une décision non assumée.

## Decision Drivers

* Éviter un contrôle de façade : toute exigence introduite doit être vérifiable avec une preuve
  concrète, pas un vœu déclaratif sans grille de verdict actionnable
* Neutralité technologique et vis-à-vis du fournisseur : aucune API carbone propriétaire n'est
  disponible de façon uniforme sur les profils technologiques existants du corpus (cloud
  généraliste, entrepôt de données analytique, moteur de recherche, restitution décisionnelle) —
  aucun n'expose aujourd'hui de donnée carbone vérifiable en revue
* Réutiliser ce qui existe déjà plutôt que dupliquer : plusieurs leviers de la dimension D07
  (dimensionnement, extinction programmée, sélection de région) réduisent déjà la dépense ET
  l'empreinte, sans qu'aucun contrôle ne le nomme explicitement
* Ne pas fermer la porte à une mesure quantitative future dès qu'elle devient auditable

## Considered Options

* Écarter le sujet pour l'instant, sans aucune trace dans le corpus
* Créer immédiatement une dimension (ou famille) dédiée « Soutenabilité », en pilier de plein rang
* Adopter le sujet dès maintenant, mais en extension qualitative de la dimension FinOps existante
  (D07), avec promotion en pilier dédié explicitement différée à une condition datée

## Decision Outcome

Chosen option: "Adopter en extension qualitative de D07, promotion différée", parce que créer une
dimension dédiée aujourd'hui produirait une 19ᵉ dimension sans mesure quantitative fiable
derrière — contraire à l'invariant `dimensions.yaml` (« pas de score sans preuve ») — alors
qu'écarter purement et simplement le sujet ignorerait un pilier déjà consacré par l'état de l'art
2026 et à la portée immédiate via les leviers FinOps déjà présents. L'extension de D07
(`CTL-D07-09`) rend le sujet exigible dès aujourd'hui, sans fabriquer une métrique carbone que le
corpus ne peut pas encore vérifier de façon agnostique.

### Consequences

* Good, because le sujet devient réellement auditable dès v0 (`CTL-D07-09`, mode déclaratif +
  revue), pas seulement débattu.
* Good, because aucune duplication : les leviers d'optimisation déjà couverts par `CTL-D07-07`
  (dimensionnement, extinction, sélection) portent aussi la valeur environnementale.
* Bad, because tant qu'aucun profil n'expose de métrique carbone vérifiable, le contrôle reste
  qualitatif — pas de comparaison chiffrée inter-tenants possible.
* Neutral, because la question d'une dimension/famille dédiée reste ouverte et datée (ci-dessous),
  pas enterrée.

### Confirmation

Contrôle dérivé : `CTL-D07-09` (les décisions d'hébergement et de dimensionnement documentent
leur impact environnemental au moins qualitativement, en réutilisant les leviers FinOps existants ;
une mesure quantitative — ex. Software Carbon Intensity — est adoptée dès qu'un profil
technologique l'expose de façon vérifiable). Preuve attendue : voir `core/controls/D07.json`.
**Condition datée de réexamen** : à la revue `docs/GOUVERNANCE-STANDARDS.md` de **2027-01**, ou
dès qu'un profil technologique (`profiles/*`) expose une donnée carbone vérifiable en revue —
selon la première échéance atteinte, réévaluer si le sujet mérite sa propre dimension/famille au
lieu de rester une extension de D07.

## Pros and Cons of the Options

### Écarter sans trace
* Good, because aucun coût d'implémentation immédiat.
* Bad, because ignore un pilier déjà consacré par l'état de l'art 2026 ; silence non assumé sur
  un sujet explicitement posé à la décision.

### Dimension/famille dédiée immédiate
* Good, because visibilité maximale, alignement direct avec les référentiels Well-Architected.
* Bad, because aucune métrique quantitative agnostique disponible aujourd'hui derrière — violerait
  « pas de score sans preuve » ; une 19ᵉ dimension hors D17 la même semaine aurait aussi dilué la
  lisibilité du référentiel pour un gain immédiat nul.

### Extension qualitative de D07 (choisi)
* Good, because exigible immédiatement, réutilise l'existant, ne ferme pas la porte à une mesure
  quantitative future.
* Bad, because reste qualitatif tant qu'aucune métrique carbone vérifiable n'est disponible.

## More Information

Ce choix est symétrique à celui d'ADR0109 (D17) mais inverse dans sa conclusion : D17 a été promue
en dimension dédiée parce que ses quatre contrôles étaient immédiatement exigibles avec preuve
concrète (inventaire, dérive, supervision, documentation) ; la soutenabilité reste en extension
parce que sa seule preuve concrète disponible aujourd'hui est qualitative — la promotion en pilier
dédié est une question de calendrier (disponibilité d'une métrique), pas de principe. Ne pas
confondre cette extension avec un renoncement : elle est tracée, datée, et sa condition de
réexamen est explicite (ci-dessus), conformément à la loi transverse « l'oubli n'existe pas ».
