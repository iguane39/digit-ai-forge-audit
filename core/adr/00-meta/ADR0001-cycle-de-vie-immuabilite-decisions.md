---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architectes, responsables de domaine ADR"
informed: "toutes les équipes produit"
id: ADR0001
domain: "00"
invariant: true
standards: ["MADR 4.0.0 — cycle de vie du statut", "ISO/IEC/IEEE 42010:2022 (rationale de la description d'architecture)"]
derived_controls: [CTL-D00-03, CTL-D01-10, CTL-D13-03]
---

# Cycle de vie et immuabilité des décisions d'architecture

## Context and Problem Statement

Sans règle de cycle de vie explicite, les décisions d'architecture s'accumulent dans des
états incohérents : brouillons jamais tranchés, décisions modifiées rétroactivement sans
trace, statuts contradictoires selon les domaines. Un tel corpus ne peut plus servir de
preuve d'audit ni de source de vérité partagée. Comment garantir qu'une décision actée
demeure une référence stable dans le temps, tout en autorisant son évolution tracée ?

## Decision Drivers

* Une décision actée doit rester opposable et vérifiable indéfiniment (preuve d'audit)
* Toute évolution doit être visible : une nouvelle décision, jamais une réécriture silencieuse
* Cohérence du cycle de vie entre tous les domaines et tous les profils du corpus
* Compatibilité native avec un outillage docs-as-code (revue, historique, publication)

## Considered Options

* Cycle de vie à statuts finis (proposed → accepted → deprecated/superseded), corps immuable après acceptation
* Édition libre du corps de l'ADR après acceptation, avec journal de modifications en pied de fichier
* Absence de cycle de vie formel : le statut est laissé à l'appréciation de chaque équipe

## Decision Outcome

Chosen option: "Cycle de vie à statuts finis avec immuabilité post-acceptation", parce que
seule cette option empêche la réécriture rétroactive de l'historique décisionnel tout en
permettant l'évolution par remplacement explicite (« superseded by ») — condition
nécessaire pour qu'un ADR vaille comme preuve d'audit opposable.

### Consequences

* Good, because une décision "accepted" ne peut plus être modifiée sur le fond : toute évolution crée un nouvel ADR qui la remplace explicitement.
* Good, because l'historique de version du dépôt suffit à reconstituer la chronologie complète des décisions, sans outillage supplémentaire.
* Bad, because un errata mineur (faute de frappe, lien mort) impose malgré tout un nouvel ADR ou une règle d'exception explicite à documenter.
* Neutral, because la discipline de statut doit être portée par la revue (gate), pas seulement par la convention déclarée.

### Confirmation

Contrôles dérivés : CTL-D13-01 (aucun ADR au statut "accepted" modifié hors champ
statut/lien de succession — vérification par différentiel d'historique), CTL-D13-02
(transition de statut tracée par une revue et un commit distincts). Preuve attendue :
historique de version de l'ADR et, le cas échéant, ADR successeur lié. Grille : conforme
= aucune modification de fond post-acceptation détectée ; partiel = modification mineure
documentée en exception ; non conforme = réécriture de fond non tracée.

## Pros and Cons of the Options

### Cycle de vie à statuts finis, immuabilité post-acceptation
* Good, because historique décisionnel infalsifiable, preuve d'audit directe.
* Bad, because un errata mineur exige un nouvel ADR ou une exception documentée.

### Édition libre + journal de modifications
* Good, because souplesse pour corriger une décision sans multiplier les fichiers.
* Bad, because le journal en pied de fichier est facultatif dans les faits : rien n'empêche une réécriture non signalée.

### Absence de cycle de vie formel
* Good, because aucune charge de gouvernance additionnelle.
* Bad, because statuts incohérents entre domaines, décisions non opposables en audit.

## More Information

Instanciations par profil : `profil:git-platform` → immuabilité vérifiée par règle de
protection de branche et revue obligatoire sur le dossier `adr/` ; le vérificateur de
format générique refuse toute transition de statut non conforme au cycle de vie retenu.
