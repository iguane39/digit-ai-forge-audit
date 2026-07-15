---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes d'exploitation, {roles.change_board}"
informed: "équipes produit"
id: ADR0509
domain: "05"
invariant: true
standards: ["DORA (Accelerate) — Time to Restore Service (MTTR)", "SRE (Google) — gestion des incidents", "ISO/IEC 27002:2022 — 5.30"]
derived_controls: [CTL-D01-05, CTL-D09-07, CTL-D12-04]
profile_bindings: optional
---

# Stratégie de retour arrière (rollback) testée

## Context and Problem Statement

Le corpus de référence documente comment déployer et promouvoir une version, mais aucune
décision équivalente ne couvrait le retour à un état antérieur connu lorsqu'une version
livrée s'avère défaillante — un manque qui expose au pire scénario : découvrir pendant un
incident en production qu'aucun chemin de retour n'a jamais été exercé. Comment garantir
qu'un retour arrière reste toujours possible et vérifié avant d'en avoir besoin ?

## Decision Drivers

* Réduction du temps de restauration du service (MTTR) en cas de version défaillante
* Confiance vérifiée : un rollback jamais exercé n'est qu'une hypothèse non prouvée
* Cohérence des données pendant et après le retour arrière
* Applicabilité du principe à tout type d'artefact et d'hébergeur

## Considered Options

* Stratégie de retour arrière définie, outillée par le pipeline et testée périodiquement
* Retour arrière possible en théorie, jamais exercé avant un incident réel
* Correction en avant uniquement (fix-forward), sans mécanisme de retour arrière

## Decision Outcome

Chosen option: "Stratégie testée périodiquement", parce qu'un mécanisme non exercé échoue
statistiquement au pire moment ; seul un exercice périodique, déclenché comme en situation
réelle, transforme le rollback d'une hypothèse en une capacité vérifiée et bornée dans le
temps — comblant l'angle mort jusqu'ici le plus critique du corpus de livraison.

### Consequences

* Good, because le temps de restauration en incident réel est mesuré et non estimé à l'avance.
* Good, because les migrations de données incompatibles avec un rollback sont identifiées avant l'incident.
* Bad, because l'exercice périodique consomme du temps d'ingénierie dédié.
* Neutral, because certains changements (migrations destructives) exigent une compensation plutôt qu'un rollback strict.

### Confirmation

Contrôles dérivés : CTL-D09-11 (retour arrière déclenchable depuis le pipeline sans
intervention manuelle sur la cible), CTL-D12-03 (exercice de retour arrière documenté et
rejoué à fréquence définie), CTL-D12-04 (temps de restauration déclaré et mesuré à chaque
exercice ou incident réel). Preuve : rapport du dernier exercice + mesure du temps de
restauration obtenu. Grille : conforme = exercice ≤ période définie et objectif tenu ;
partiel = exercice réalisé mais objectif dépassé ; non conforme = aucun exercice constaté.

## Pros and Cons of the Options

### Stratégie testée périodiquement
* Good, because capacité vérifiée, MTTR mesuré, angles morts de migration détectés à l'avance.
* Bad, because coût récurrent d'exercice à budgéter.

### Rollback théorique, jamais exercé
* Good, because coût nul tant qu'aucun incident ne survient.
* Bad, because la première exécution réelle a lieu sous pression, sans garantie de succès.

### Correction en avant uniquement
* Good, because évite la complexité de compensation d'un retour arrière sur les données.
* Bad, because le temps de restauration dépend d'un correctif à concevoir dans l'urgence.

## More Information

Instanciations : `profil:azure` → bascule vers le slot ou la révision précédente déclenchée
par le pipeline managé. Cette décision comble un manque du profil de référence : aucun ADR
existant n'y couvrait le retour arrière, alors que la restauration en incident (D12) en
dépend directement.
