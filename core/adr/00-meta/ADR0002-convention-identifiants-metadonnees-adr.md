---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architectes"
informed: "toutes les équipes produit"
id: ADR0002
domain: "00"
invariant: false
standards: ["MADR 4.0.0 — en-tête et gabarit", "docs-as-code (Docs Like Code)"]
derived_controls: [CTL-D13-03]
---

# Convention d'identifiants et de métadonnées des décisions

## Context and Problem Statement

Sans schéma d'identifiant ni de métadonnées stables, les références croisées entre
décisions, contrôles et profils deviennent fragiles : renommages accidentels, collisions
d'identifiants, ADR orphelins qu'aucun outil ne peut plus relier à leur contexte. Comment
identifier et décrire chaque décision de façon univoque, exploitable aussi bien par des
humains que par des outils de vérification automatisés ?

## Decision Drivers

* Unicité et stabilité de l'identifiant sur toute la durée de vie du corpus
* Traçabilité automatisable vers les contrôles dérivés et les dimensions d'audit
* Lisibilité humaine : le domaine de gouvernance doit être visible dans l'identifiant
* Compatibilité avec un vérificateur de format exécuté en continu

## Considered Options

* Identifiant codé par domaine (`ADR<domaine><séquence>`) associé à un frontmatter structuré obligatoire
* Identifiant séquentiel global, sans lien visible avec le domaine de gouvernance
* Titre de fichier en langage naturel comme seul identifiant, sans schéma dédié

## Decision Outcome

Chosen option: "Identifiant codé par domaine + frontmatter structuré", parce qu'il rend le
domaine et le rang lisibles sans registre externe, reste stable même si le corpus grossit,
et fournit l'ancrage unique dont dépendent les contrôles dérivés et les profils.

### Consequences

* Good, because toute référence croisée (contrôle, profil, matrice de couverture) cible un identifiant stable et auto-descriptif.
* Good, because un vérificateur automatisé peut rejeter un identifiant mal formé ou un frontmatter incomplet avant publication.
* Bad, because un ADR qui change de domaine de gouvernance a posteriori impose un renommage, mitigé par une table d'alias.
* Neutral, because la numérotation séquentielle héritée d'un corpus antérieur devient un simple alias legacy, pas une suppression.

### Confirmation

Contrôles dérivés : CTL-D13-03 (identifiant conforme au schéma domaine-séquence, unique
dans le registre), CTL-D13-04 (frontmatter complet : statut, date, décideurs, identifiant,
domaine, standards, contrôles dérivés). Preuve attendue : sortie du vérificateur de format
sur l'ensemble du dossier `adr/`. Grille : conforme = 0 anomalie détectée ; partiel =
anomalies mineures limitées à des ADR non invariants ; non conforme = identifiant dupliqué
ou frontmatter incomplet sur un ADR invariant.

## Pros and Cons of the Options

### Identifiant codé par domaine + frontmatter structuré
* Good, because auto-descriptif, stable, vérifiable automatiquement.
* Bad, because un changement de domaine a posteriori impose un renommage géré par alias.

### Identifiant séquentiel global
* Good, because trivial à attribuer, aucune ambiguïté de rang.
* Bad, because aucune lisibilité du domaine sans registre externe à jour.

### Titre en langage naturel sans schéma
* Good, because rédaction immédiate, aucune charge de convention.
* Bad, because aucune référence croisée fiable ni vérification automatisée possible.

## More Information

Instanciations par profil : `profil:git-platform` → vérificateur de format exécuté en
intégration continue sur toute proposition de modification touchant `adr/**` ; une table
d'alias (`adr.aliases`) portée par l'overlay absorbe les identifiants d'un corpus hérité.
