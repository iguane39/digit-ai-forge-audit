---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes d'exploitation, architectes"
informed: "équipes produit"
id: ADR0405
domain: "04"
invariant: false
standards: ["SRE (Google) — objectifs de niveau de service et budgets d'erreur", "DORA (Accelerate) — métriques de fiabilité et de reprise (MTTR)", "ISO/IEC 25010 (fiabilité)"]
derived_controls: [CTL-D10-06, CTL-D10-07, CTL-D12-02, CTL-D12-03]
---

# Alerting fondé sur SLO et budgets d'erreur

## Context and Problem Statement

Un seuil d'alerte fixé arbitrairement (CPU, latence brute) génère soit trop d'alertes
ignorées, soit trop peu d'alertes pertinentes, sans lien avec l'expérience réellement
promise à l'utilisateur. Comment fonder l'alerting sur un engagement de service explicite
plutôt que sur des seuils techniques déconnectés de cet engagement ?

## Decision Drivers

* Alerting relié à l'expérience utilisateur promise, pas à une métrique technique isolée
* Priorisation objective de la réponse à incident selon la consommation du budget d'erreur restant
* Réduction de la fatigue d'alerte (alertes nombreuses, non actionnables)
* Calibrage proportionné à la maturité et à la criticité réelles de chaque service

## Considered Options

* Objectifs de niveau de service déclarés par service critique, alerting fondé sur la consommation du budget d'erreur associé
* Seuils techniques fixes par métrique (CPU, mémoire, latence brute), indépendants de tout engagement de service
* Alerting réactif uniquement, déclenché par les signalements utilisateurs

## Decision Outcome

Chosen option: "SLO déclarés + alerting sur budget d'erreur", parce qu'elle relie chaque
alerte à un engagement de service explicite et priorise objectivement la réponse selon ce
qu'il reste de marge — sa mise en œuvre suppose une maturité de définition des SLO que tous
les services n'ont pas encore atteinte, d'où son caractère non invariant.

### Consequences

* Good, because chaque alerte est reliée à un engagement de service explicite et compris des parties prenantes.
* Good, because la consommation du budget d'erreur priorise objectivement les réponses à incident concurrentes.
* Bad, because suppose des SLO définis et révisés, absents par défaut pour un service nouveau.
* Neutral, because le budget d'erreur doit être recalculé à chaque révision du SLO.

### Confirmation

Contrôles dérivés : CTL-D10-06 (alertes fondées sur SLO et consommation du budget d'erreur
— établi par ADR0401, spécialisé ici), CTL-D12-02 (budget d'erreur suivi et action
déclenchée avant épuisement, reliée à la procédure d'astreinte). Preuve attendue :
déclaration des SLO par service critique + historique de consommation du budget d'erreur +
trace d'une action déclenchée par un seuil de budget. Grille : conforme = SLO déclarés et
alerting sur budget actif pour les services critiques ; partiel = SLO déclarés sans
alerting relié ; non conforme = seuils techniques seuls, aucun SLO déclaré.

## Pros and Cons of the Options

### SLO déclarés + alerting sur budget d'erreur
* Good, because alerte reliée à l'engagement de service, priorisation objective.
* Bad, because suppose une maturité de définition des SLO.

### Seuils techniques fixes indépendants de tout engagement
* Good, because rapide à mettre en place sans définition préalable de SLO.
* Bad, because déconnecté de l'expérience utilisateur réelle ; fatigue d'alerte fréquente.

### Alerting réactif par signalement utilisateur
* Good, because coût nul à court terme.
* Bad, because l'incident est détecté par celui qui le subit, jamais avant.

## More Information

Instanciations : `profil:elastic` → tableaux de bord de burn rate du budget d'erreur +
règles d'alerte associées. Généralise et complète l'observabilité par défaut (ADR0401), qui
pré-positionnait ce contrôle.
