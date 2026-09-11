---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.architect}, {roles.data_roles.steward}, équipes d'intégration"
informed: "toutes les équipes produit"
id: ADR0623
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D05-17]
---

# Convention de nommage des flux d'échange de données

## Context and Problem Statement

Un flux d'échange de données — export vers un partenaire, reprise d'historique, alimentation d'un tiers — se nomme le plus souvent au moment où on le crée, d'après le projet qui l'a demandé. Un an plus tard, personne ne sait, à la seule lecture du nom, ce que le flux transporte, d'où il vient, où il va, ni à quelle fréquence il s'exécute ; la supervision liste des noms opaques, et un flux abandonné reste en service faute de pouvoir prouver qu'il ne sert plus. Comment garantir qu'un flux est identifiable par son nom seul, indépendamment du projet qui l'a créé ?

## Decision Drivers

* Lisibilité du parc de flux sans documentation annexe : le nom porte l'essentiel
* Supervision et alerting rattachables au flux sans table de correspondance manuelle
* Détection des flux orphelins : ce qui ne se nomme pas selon la convention se voit
* Neutralité vis-à-vis de l'outil d'orchestration et du protocole de transport

## Considered Options

* Convention de nommage unique et documentée pour tous les flux (source, destination, objet transporté, fréquence), dont le respect est vérifié
* Nommage libre, documenté dans un registre des flux tenu à part
* Nommage hérité de l'outil d'orchestration (identifiants techniques générés)

## Decision Outcome

Chosen option: "Convention de nommage unique et documentée", parce que c'est la seule option où le nom reste vrai sans dépendre d'un registre tenu en parallèle : le registre peut diverger, l'identifiant technique ne dit rien, le nom construit selon une convention porte l'information là où elle est lue — dans la supervision, les journaux et les alertes.

### Consequences

* Good, because un flux inconnu se qualifie en le lisant, sans ouvrir l'outil qui l'exécute.
* Good, because un flux hors convention se détecte mécaniquement, ce qui fait ressortir les flux non gouvernés.
* Bad, because renommer un flux existant a un coût (supervision, alertes, contrats en place).
* Neutral, because la convention doit être versionnée : la faire évoluer sans plan de migration recrée le désordre.

### Confirmation

Contrôle dérivé : CTL-D05-17 (chaque flux d'échange de données entrant ou sortant de l'application porte un nom conforme à la convention documentée, et aucun flux actif ne reste hors convention — mode automatique + revue). Preuve attendue : convention de nommage versionnée, inventaire des flux actifs de l'application, et résultat du contrôle de conformité des noms. Grille : conforme = 100 % des flux actifs conformes ; partiel = convention publiée mais conformité partielle ; non conforme = aucune convention, ou majorité de flux hors convention.

## Pros and Cons of the Options

### Convention unique documentée

* Good, because information portée par le nom, donc présente partout où le flux apparaît.
* Bad, because coût de renommage sur l'existant.

### Nommage libre + registre à part

* Good, because aucun coût sur l'existant.
* Bad, because le registre diverge du réel dès le premier flux créé hors processus.

### Identifiants techniques de l'outil

* Good, because unicité garantie sans effort.
* Bad, because illisible en supervision ; enferme le parc dans l'outil qui les a produits.

## More Information

Distinct d'ADR0603 (conventions de nommage des **actifs** de données : tables, jeux de données, schémas) : celui-ci gouverne les **flux** qui les déplacent, dont le cycle de vie, les propriétaires et la supervision diffèrent. Complète ADR0607 (contrats de données) : le contrat dit ce qui circule, la convention dit comment on le reconnaît.

**À compléter** (`a_completer: true`) : la source de référence dont cette décision est issue ne cite **aucune norme externe** — le champ `standards` reste vide et doit être renseigné avant toute opposabilité. À compléter également : la grammaire exacte du nom (ordre et séparateurs des segments), qui relève de l'organisation qui instancie la convention.
