---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architectes, équipes d'exploitation"
informed: "équipes produit"
id: ADR0504
domain: "05"
invariant: true
standards: ["NIST SSDF — PO.5", "CIS Benchmarks — contrôle par policy-as-code", "DORA (Accelerate) — capacité Infrastructure as Code"]
derived_controls: [CTL-D08-01, CTL-D09-02, CTL-D09-06]
profile_bindings: optional
---

# Infrastructure as Code obligatoire, état distant, gates qualité

## Context and Problem Statement

Une infrastructure configurée à la main (console, ligne de commande interactive) n'est ni
reproductible, ni relisable, ni auditable : le seul état de vérité vit dans la mémoire de
la personne qui l'a créée. Comment garantir que toute ressource d'infrastructure gérée est
décrite, versionnée et vérifiée avant application, quel que soit l'hébergeur ?

## Decision Drivers

* Reproductibilité et relecture par les pairs de tout changement d'infrastructure
* Détection des dérives entre l'état déclaré et l'état réel
* Blocage des changements non conformes avant application (gate de qualité)
* Portabilité de la règle à tout langage de description d'infrastructure

## Considered Options

* Infrastructure as Code obligatoire, état distant partagé, gates de qualité bloquantes
* Infrastructure as Code recommandée, état local par poste, revue a posteriori
* Configuration manuelle outillée par des scripts d'assistance, sans état déclaratif

## Decision Outcome

Chosen option: "IaC obligatoire, état distant, gates bloquantes", parce que seul l'état
distant partagé élimine la divergence entre postes, et seules des gates bloquantes avant
application empêchent qu'un changement non relu ou non conforme atteigne un environnement
géré — indépendamment du langage de description choisi.

### Consequences

* Good, because tout changement d'infrastructure est relisable avant application (revue de pairs).
* Good, because l'état distant élimine la divergence entre postes et personnes.
* Bad, because l'état distant devient une ressource critique à protéger et sauvegarder.
* Neutral, because discipline supplémentaire exigée pour toute exception urgente (accès de secours tracé).

### Confirmation

Contrôles dérivés : CTL-D09-05 (aucune ressource gérée modifiée hors du code
d'infrastructure — vérification par détection de dérive), CTL-D09-06 (état distant,
verrouillé, versionné), CTL-D08-01 (gates de qualité bloquantes avant application :
validation syntaxique, politique, revue). Preuve : configuration de l'état distant +
rapport de détection de dérive + journal des gates. Grille : conforme = 0 dérive et gates
actives ; partiel = dérive isolée corrigée ; non conforme = modification hors-bande non
détectée.

## Pros and Cons of the Options

### IaC obligatoire, état distant, gates bloquantes
* Good, because reproductible, relisable, dérive détectée par construction.
* Bad, because l'état distant est un point de dépendance critique.

### IaC recommandée, état local, revue a posteriori
* Good, because démarrage rapide, aucune infrastructure partagée requise.
* Bad, because divergences entre postes ; la revue arrive après le fait accompli.

### Scripts d'assistance sans état déclaratif
* Good, because flexible, aucun formalisme imposé.
* Bad, because aucune détection de dérive ni relecture structurée possible.

## More Information

Instanciations : `profil:azure` → état distant en stockage géré verrouillé, politiques
appliquées en admission. Le profil fournit le langage de description et le moteur de
policy-as-code retenus par l'organisation.
