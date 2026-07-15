---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes de développement, équipes d'exploitation"
informed: "équipes produit"
id: ADR0501
domain: "05"
invariant: true
standards: ["NIST SSDF — PO.3", "DORA (Accelerate) — Deployment Automation (capacité de livraison continue)", "12-Factor — V. Build, release, run"]
derived_controls: [CTL-D08-04, CTL-D09-01]
profile_bindings: optional
---

# Déploiement industrialisé exclusivement par pipeline

## Context and Problem Statement

Tout déploiement réalisé manuellement (poste de travail, accès direct à l'environnement
cible) échappe à la traçabilité, dépend d'une personne et reproduit rarement à l'identique
l'artefact validé en amont. Comment garantir que toute mise en production — quel que soit
le langage, la plateforme ou l'hébergeur — résulte d'un processus reproductible, tracé et
non contournable ?

## Decision Drivers

* Reproductibilité : le même artefact doit produire le même résultat à chaque exécution
* Traçabilité complète : qui a déclenché quoi, quand, sur quelle version
* Réduction du facteur bus et de la dépendance à une personne pour déployer
* Portabilité de la règle à tout langage, toute plateforme, tout hébergeur

## Considered Options

* Pipeline automatisé obligatoire, seul chemin vers tout environnement géré
* Pipeline recommandé, déploiement manuel toléré en cas d'urgence
* Déploiement manuel outillé par des scripts, sans orchestration centralisée

## Decision Outcome

Chosen option: "Pipeline automatisé obligatoire", parce que c'est la seule option qui
élimine structurellement l'écart entre ce qui est validé et ce qui est déployé, produit une
preuve d'audit par construction (journal d'exécution) et ne dépend d'aucune action humaine
directe sur l'environnement cible.

### Consequences

* Good, because chaque déploiement est reproductible et rejouable à l'identique.
* Good, because le journal d'exécution du pipeline devient une preuve d'audit opposable (D09, D12).
* Bad, because l'indisponibilité du pipeline bloque tout déploiement (mitigée par une astreinte outillage dédiée).
* Neutral, because effort initial de mise en pipeline pour les applications historiques.

### Confirmation

Contrôles dérivés : CTL-D09-01 (100 % des déploiements en environnement géré transitent par
le pipeline — vérification par inventaire des accès de déploiement), CTL-D09-02 (journal
immuable de chaque exécution : auteur, version, cible, résultat). Preuve attendue :
configuration du pipeline + extrait de journal sur la période d'audit. Grille : conforme =
0 déploiement hors pipeline ; partiel = exceptions documentées et dérogées ; non conforme =
déploiement manuel non tracé constaté.

## Pros and Cons of the Options

### Pipeline automatisé obligatoire
* Good, because reproductible, tracé, indépendant d'une personne.
* Bad, because le pipeline devient un composant critique à fiabiliser.

### Pipeline recommandé, exception d'urgence tolérée
* Good, because souplesse apparente en cas d'incident.
* Bad, because l'exception devient la norme sous pression ; traçabilité dégradée.

### Scripts manuels sans orchestration
* Good, because rapide à démarrer, aucun outillage préalable.
* Bad, because aucune garantie de reproductibilité ni de traçabilité centralisée.

## More Information

Instanciations : `profil:azure` → Azure Pipelines/GitHub Actions comme unique voie de
déploiement vers les environnements gérés ; autres profils → plateforme CI/CD équivalente.
Généralise la pratique de déploiement industrialisé du profil de référence.
