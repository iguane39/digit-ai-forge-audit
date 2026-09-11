---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.compliance_process}, équipes produit"
informed: "toutes les équipes produit"
id: ADR0629
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D15-11]
---

# Verdict data by design opposable avant mise en production

## Context and Problem Statement

Une évaluation de maturité data produit un score. Un score, seul, ne décide de rien : il se commente, se relativise, et la mise en production a lieu quand même. Tant que l'évaluation ne se conclut pas par un verdict opposable, prononcé par une autorité nommée avant la bascule, elle documente un état sans jamais l'arbitrer. Comment garantir qu'une évaluation data by design produit une décision qui engage, et non une note qui informe ?

## Decision Drivers

* Verdict prononcé **avant** la mise en production, pas constaté après
* Critères fataux distincts du score : un manquement fatal ne se compense pas par une bonne moyenne
* Autorité nommée, décision datée, motif écrit — y compris pour un accord sous réserve
* Vérifiabilité : le verdict et son motif se relisent dans le dossier de mise en production

## Considered Options

* Verdict opposable à trois valeurs (accord, accord sous réserve avec réserves datées, refus), prononcé par une autorité nommée avant la mise en production, motivé par le score **et** par les critères fataux
* Score de maturité publié sans verdict, la décision de bascule restant implicite
* Verdict dérivé mécaniquement d'un seuil de score, sans critère fatal ni autorité

## Decision Outcome

Chosen option: "Verdict opposable à trois valeurs prononcé avant la mise en production", parce que c'est la seule option qui sépare ce que mesure le score de ce que décide l'organisation : le score motive, les critères fataux bloquent indépendamment de lui, et l'autorité nommée assume une décision datée que l'audit peut relire. L'accord sous réserve existe pour que la nuance ne se paie pas en accord tacite.

### Consequences

* Good, because aucune mise en production ne peut se prévaloir d'une évaluation qui n'a rien conclu.
* Good, because un manquement fatal reste bloquant, quelle que soit la moyenne obtenue.
* Bad, because ajoute une porte au chemin de mise en production, avec son délai.
* Neutral, because les réserves doivent être suivies : sans échéance, un accord sous réserve devient un accord.

### Confirmation

Contrôle dérivé : CTL-D15-11 (l'évaluation data by design du projet se conclut par un verdict daté — accord, accord sous réserve avec échéances, ou refus — prononcé par une autorité nommée avant la mise en production, et motivé par le score et par les critères fataux — mode revue). Preuve attendue : fiche d'évaluation avec score, relevé des critères fataux, verdict daté et signé, réserves avec échéances. Grille : conforme = verdict daté antérieur à la mise en production, motivé, réserves échéancées ; partiel = verdict prononcé mais non motivé, ou réserves sans échéance ; non conforme = aucun verdict, ou verdict postérieur à la mise en production.

## Pros and Cons of the Options

### Verdict opposable à trois valeurs

* Good, because décide, engage, et se relit ; les critères fataux restent indépendants du score.
* Bad, because coût d'une porte supplémentaire avant bascule.

### Score publié sans verdict

* Good, because aucun délai ajouté au chemin de mise en production.
* Bad, because aucune décision : l'évaluation informe et n'arbitre rien.

### Verdict dérivé d'un seuil de score

* Good, because entièrement mécanique, aucune subjectivité.
* Bad, because un manquement fatal se compense par des points gagnés ailleurs ; personne n'assume la décision.

## More Information

Troisième volet du triptyque ouvert par ADR0627 (périmètre d'applicabilité) : le périmètre dit qui est évalué, le calcul dit ce que vaut l'évaluation, ce verdict dit ce qu'elle décide. S'articule avec la porte décisionnelle du référentiel d'audit (`gate1b`), dont il est l'équivalent sur le seul volet data.

**À compléter** (`a_completer: true`) : la source de référence dont cette décision est issue ne cite **aucune norme externe** — le champ `standards` reste vide et doit être renseigné avant toute opposabilité. À compléter également : la liste des critères fataux et le seuil de score en deçà duquel le refus est automatique, non fournis par la source ; ainsi que l'ADR du volet « calcul » (non cité par la source, donc non créé — il n'est pas inventé).
