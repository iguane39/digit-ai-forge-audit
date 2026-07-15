---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "{roles.security_officer}, équipes d'exploitation"
id: ADR0611
domain: "06"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.13 (sauvegarde des informations)", "RGPD — Art. 32.1.c (capacité à rétablir la disponibilité et l'accès)", "DORA (Accelerate) (DevOps Research and Assessment) — reprise de service"]
derived_controls: [CTL-D05-09, CTL-D12-06, CTL-D12-07, CTL-D14-06, CTL-D15-09, CTL-D16-09]
profile_bindings: optional
---

# Sauvegarde et restauration testées, RPO/RTO déclarés

## Context and Problem Statement

Une sauvegarde qui n'a jamais été restaurée est une hypothèse, pas une garantie : de nombreux incidents de perte de données révèlent, au moment de la restauration, qu'elle était incomplète, corrompue ou trop ancienne pour répondre au besoin métier. Ce manque n'était couvert par aucune décision explicite du corpus existant, la sauvegarde étant traitée comme un détail d'exploitation implicite plutôt qu'un engagement d'architecture déclaré et vérifié. Comment garantir que la capacité à restaurer une donnée est prouvée, et non supposée, avec des objectifs de perte et de délai explicites ?

## Decision Drivers

* Preuve effective de restauration, plutôt que simple existence d'une sauvegarde
* Objectifs explicites de perte de données tolérée (RPO) et de délai de restauration (RTO) par actif critique
* Détection d'une sauvegarde corrompue ou incomplète avant l'incident, pas pendant
* Applicabilité indépendante du support et du mécanisme de sauvegarde retenus

## Considered Options

* RPO/RTO déclarés par actif critique, restauration testée périodiquement, preuve conservée
* Sauvegarde automatisée sans test de restauration ni objectif déclaré
* Sauvegarde ponctuelle manuelle, déclenchée à la discrétion de l'équipe opérationnelle

## Decision Outcome

Chosen option: "RPO/RTO déclarés avec restauration testée", parce que c'est la seule option qui transforme une hypothèse de récupération en une capacité prouvée, mesurable et opposable en audit.

### Consequences

* Good, because une restauration réelle et chronométrée révèle les défauts d'une sauvegarde avant qu'un incident ne les révèle à un moment critique.
* Good, because le RPO/RTO déclaré donne un engagement de résilience vérifiable par actif, au lieu d'une promesse générique.
* Bad, because tester la restauration périodiquement consomme du temps d'exploitation et parfois un environnement dédié.
* Neutral, because le RPO/RTO doit être négocié avec le Data Owner selon la criticité réelle de l'actif.

### Confirmation

Contrôles dérivés : CTL-D05-09 (sauvegardes exécutées conformément au RPO déclaré par actif critique), CTL-D15-07 (restauration testée périodiquement avec preuve de conformité au RTO). Preuve attendue : rapport du dernier exercice de restauration (durée, intégrité constatée) et RPO/RTO déclarés par actif. Grille : conforme = RPO/RTO déclarés et restauration testée avec succès ≤ 12 mois ; partiel = objectifs déclarés sans test récent ; non conforme = absence d'objectifs déclarés ou dernier test en échec non corrigé.

## Pros and Cons of the Options

### RPO/RTO déclarés avec restauration testée

* Good, because capacité de récupération prouvée et mesurable, pas supposée.
* Bad, because coût récurrent de test, en temps et parfois en environnement dédié.

### Sauvegarde automatisée sans test de restauration

* Good, because couverture immédiate, effort d'exploitation minimal.
* Bad, because une sauvegarde jamais restaurée peut être corrompue sans que personne ne le sache avant l'incident.

### Sauvegarde ponctuelle manuelle

* Good, because aucun coût d'automatisation initial.
* Bad, because couverture et fréquence non garanties, objectifs de reprise absents.

## More Information

Instanciations par profil : `profil:databricks-lakehouse` → clichés versionnés avec fenêtre d'historique bornée et réplication testée en restauration croisée ; `profil:azure` → sauvegardes gérées avec exercices de restauration programmés, rapport d'exercice conservé comme preuve d'audit.
