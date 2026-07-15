---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architectes, équipes de développement"
informed: "équipes produit"
id: ADR0503
domain: "05"
invariant: false
standards: ["docs-as-code — convention versionnée et opposable", "ISO/IEC 25010:2011 — Maintenabilité (analysabilité)"]
derived_controls: [CTL-D08-05]
profile_bindings: optional
---

# Convention de nommage unifiée des objets de livraison

## Context and Problem Statement

Sans convention partagée, chaque équipe nomme pipelines, environnements, artefacts et
ressources de déploiement selon ses propres habitudes. L'inventaire devient illisible, les
scripts d'automatisation se multiplient en variantes ad hoc, et l'audit ne peut plus
corréler un objet livré à l'application, l'environnement et la version qu'il représente.
Quelle convention rend tout objet de livraison identifiable sans ambiguïté ?

## Decision Drivers

* Identification univoque de tout objet livré (application, environnement, version)
* Automatisation fiable : les scripts dérivent un nom plutôt que de le demander en saisie
* Lisibilité humaine en exploitation et en audit
* Application uniforme quels que soient le langage et l'hébergeur

## Considered Options

* Convention documentée, versionnée et vérifiée automatiquement (linting de nommage)
* Convention documentée mais appliquée de façon déclarative, sans vérification outillée
* Absence de convention formelle, nommage laissé à l'appréciation de chaque équipe

## Decision Outcome

Chosen option: "Convention documentée et vérifiée automatiquement", parce qu'une règle non
vérifiée se dégrade au premier écart toléré ; la vérification outillée garantit dans la
durée que le nom d'un objet permet de reconstituer application, environnement et version
sans consulter de documentation externe.

### Consequences

* Good, because tout objet de livraison est identifiable et corrélable sans documentation annexe.
* Good, because l'automatisation peut dériver des noms au lieu de les demander en saisie libre.
* Bad, because un contrôle de nommage supplémentaire s'ajoute aux gates existantes.
* Neutral, because la migration des objets existants non conformes s'étale dans le temps.

### Confirmation

Contrôle dérivé : CTL-D09-04 (convention de nommage appliquée et vérifiée sur les objets de
livraison actifs — pipelines, environnements, artefacts). Preuve attendue : référence de la
convention documentée + rapport de vérification automatisée (ou échantillon d'audit
manuel). Grille : conforme = convention documentée et vérifiée ; partiel = documentée sans
vérification outillée ; non conforme = absence de convention constatée.

## Pros and Cons of the Options

### Convention documentée et vérifiée automatiquement
* Good, because garantie dans la durée, corrélation fiable pour l'audit.
* Bad, because coût d'outillage initial du contrôle de nommage.

### Convention documentée sans vérification
* Good, because coût de mise en place minimal.
* Bad, because l'écart s'accumule sans détection ; la convention devient indicative.

### Absence de convention formelle
* Good, because liberté totale des équipes.
* Bad, because inventaire illisible, corrélation impossible en audit et en incident.

## More Information

Instanciations : `profil:azure` → convention intégrée aux règles de nommage des groupes de
ressources et des pipelines. Tout profil peut enrichir le schéma de la convention sans en
supprimer les invariants (application, environnement, version).
