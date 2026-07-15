---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, délégué à la protection des données"
informed: "équipes produit"
id: ADR0404
domain: "04"
invariant: true
standards: ["RGPD — art. 5, § 1, e) (limitation de la conservation)", "ISO/IEC 27002:2022 — 8.15", "ISO/IEC 27002:2022 — 8.10 (suppression des informations)"]
derived_controls: [CTL-D10-08]
---

# Rétention des journaux conforme aux obligations légales

## Context and Problem Statement

Des journaux conservés indéfiniment accumulent un risque (donnée personnelle exposée
au-delà du nécessaire) ; des journaux purgés trop tôt privent l'organisation de la preuve
exigée par une obligation légale ou contractuelle. Comment gouverner une durée de
conservation des journaux qui satisfait simultanément ces deux contraintes opposées ?

## Decision Drivers

* Conformité aux obligations légales de conservation, variables selon la nature de la donnée
* Minimisation : aucune donnée personnelle journalisée au-delà de la durée strictement nécessaire
* Disponibilité de la preuve pendant toute la durée où elle peut être exigée (contrôle, contentieux, incident)
* Applicabilité indépendante de la plateforme de stockage des journaux

## Considered Options

* Politique de rétention déclarée par catégorie de journal, purge et archivage automatisés et vérifiables
* Conservation indéfinie par défaut, purge manuelle ponctuelle
* Durée de rétention unique appliquée uniformément à tous les journaux sans distinction de catégorie

## Decision Outcome

Chosen option: "Politique de rétention déclarée par catégorie, purge automatisée", parce
que c'est la seule option qui aligne chaque catégorie de journal sur l'obligation qui la
concerne réellement, tout en rendant la purge vérifiable plutôt que dépendante d'une action
manuelle.

### Consequences

* Good, because chaque catégorie de journal respecte l'obligation légale qui lui est propre.
* Good, because la purge devient un mécanisme vérifiable, preuve d'audit à l'appui.
* Bad, because nécessite une classification préalable des journaux par catégorie et obligation associée.
* Neutral, because une durée de conservation plus longue que nécessaire doit être justifiée explicitement.

### Confirmation

Contrôles dérivés : CTL-D10-07 (politique de rétention déclarée par catégorie de journal,
alignée sur l'obligation légale applicable), CTL-D10-08 (purge et archivage exécutés et
vérifiables, preuve d'application disponible). Preuve attendue : politique de rétention
documentée par catégorie + rapport d'exécution de purge. Grille : conforme = politique
déclarée et purge vérifiée conforme aux durées ; partiel = politique déclarée sans preuve
d'exécution ; non conforme = conservation indéfinie ou absence de politique.

## Pros and Cons of the Options

### Politique déclarée par catégorie, purge automatisée
* Good, because alignement fin sur les obligations réelles, preuve d'exécution.
* Bad, because effort de classification initial des catégories de journaux.

### Conservation indéfinie, purge manuelle ponctuelle
* Good, because aucune perte accidentelle de preuve.
* Bad, because accumulation de données personnelles au-delà du nécessaire ; non-conformité de fait.

### Durée unique uniforme sans distinction de catégorie
* Good, because simplicité de mise en œuvre.
* Bad, because sur-conserve certaines catégories et sous-conserve d'autres, aucune ne correspondant à l'obligation réelle.

## More Information

Instanciations : `profil:elastic` → cycle de vie d'index (Index Lifecycle Management) avec
purge et archivage automatisés par catégorie. S'articule avec l'observabilité par défaut
(ADR0401), dont elle gouverne le volet conservation.
