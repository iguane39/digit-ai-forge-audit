---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "référents accessibilité, équipes de conception produit"
informed: "toutes les équipes produit"
id: ADR0901
domain: "09"
invariant: true
standards: ["WCAG 2.2 — niveau AA (ensemble des critères de succès)", "EN 301 549 (exigences d'accessibilité pour les produits et services TIC)"]
derived_controls: [CTL-D11-01, CTL-D11-02, CTL-D11-03, CTL-D11-04]
profile_bindings: optional
---

# Accessibilité numérique opposable (socle WCAG AA)

## Context and Problem Statement

La dimension D11 (UX & accessibilité) porte huit contrôles depuis la v1.1 du corpus, mais aucun ne rattachait à une décision d'architecture publiée : le socle d'accessibilité existait dans l'outillage d'audit sans jamais avoir été décidé au niveau gouvernance. Une interface non conforme à un socle mesurable exclut de fait une partie des utilisateurs et expose à un risque d'opposabilité croissant. Comment garantir que toute interface exposée respecte un socle d'accessibilité mesurable, vérifié avant et après mise à disposition, quelle que soit la plateforme ou le framework retenu ?

## Decision Drivers

* Opposabilité : un socle mesurable, pas une intention déclarative non vérifiable
* Couverture des critères reconnus (perceptible, utilisable, compréhensible, robuste) sans en privilégier un seul
* Vérifiabilité par un outillage reproductible, complétée par un contrôle humain sur ce que l'outillage ne détecte pas
* Neutralité technologique : le socle s'applique à toute interface, quel que soit le framework retenu

## Considered Options

* Socle WCAG 2.2 niveau AA mesuré par audit outillé et vérification manuelle, avec plan de remédiation opposable
* Recommandations d'accessibilité non mesurées, laissées à l'appréciation de chaque équipe produit
* Conformité de niveau A seulement (socle minimal), sans exigence exhaustive de contraste ni de navigation clavier

## Decision Outcome

Chosen option: "Socle WCAG 2.2 AA mesuré et complété par vérification manuelle", parce que c'est la seule option qui rend l'accessibilité opposable et vérifiable en continu — le niveau A laisse des critères essentiels hors socle, et l'absence de mesure rend toute déclaration invérifiable.

### Consequences

* Good, because le socle d'accessibilité devient mesurable, opposable et suivi d'un plan de remédiation daté.
* Good, because l'audit outillé et la vérification manuelle se complètent : chacun couvre ce que l'autre ne détecte pas.
* Bad, because la remédiation d'écarts constatés sur une interface existante peut représenter un effort de correction significatif.
* Neutral, because un niveau d'accessibilité au-delà du socle AA (AAA) reste un choix d'overlay, non exigé par le core.

### Confirmation

Contrôles dérivés (existants, rattachés — aucun nouveau contrôle créé) : CTL-D11-01 (conformité WCAG 2.2 AA mesurée par audit outillé, plan de remédiation par écart), CTL-D11-02 (parcours intégralement opérables au clavier, sans piège de focus, focus toujours visible), CTL-D11-03 (contrastes de couleur mesurés au-dessus des seuils requis sur chaque écran type), CTL-D11-04 (interface adaptée sans perte de fonctionnalité aux largeurs d'écran et modes d'interaction cibles). Preuve attendue : rapport d'audit d'accessibilité daté par critère + relevé de navigation clavier + rapport de mesure de contraste + captures multi-devices. Grille : conforme = les quatre contrôles conformes ou dérogation documentée ; partiel = écarts avec plan de remédiation daté ; non conforme = absence d'audit ou écart bloquant sans plan.

## Pros and Cons of the Options

### Socle WCAG 2.2 AA mesuré + vérification manuelle
* Good, because opposable, mesurable, et couvre les angles morts de l'audit automatisé.
* Bad, because exige une compétence et un temps de vérification manuelle récurrents.

### Recommandations non mesurées
* Good, because aucune contrainte d'outillage à mettre en place.
* Bad, because rien n'est vérifiable ni opposable ; le niveau réel d'accessibilité reste inconnu.

### Conformité niveau A seulement
* Good, because socle plus rapide à atteindre que le niveau AA.
* Bad, because exclut des critères essentiels (contraste, clavier) que le niveau AA impose.

## More Information

Instanciations : outillage de mesure générique — analyse automatisée intégrée au pipeline complétée par un audit manuel expert périodique sur les parcours critiques ; des produits d'audit d'accessibilité spécifiques peuvent être retenus par profil, ce choix ne relevant pas du core. Rattachement pur : les quatre contrôles existaient déjà en D11 sans `adr_source` déclaré ; aucun contrôle n'est créé par cet ADR.
