---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, architectes data"
informed: "équipes produit"
id: ADR0806
domain: "08"
invariant: true
standards: ["DMBOK2 (gouvernance des données, métadonnées)", "data literacy / certification des contenus BI"]
derived_controls: [CTL-D05-15]
---

# Gouvernance de la couche de restitution (certification des rapports)

## Context and Problem Statement

Quand n'importe quel rapport peut être publié sans distinction entre une analyse
exploratoire et un rapport officiel engageant l'organisation, les utilisateurs ne savent
plus lequel faire foi parmi les versions concurrentes en circulation. Ce sujet n'est
couvert par aucune décision existante : la publication d'un rapport n'est soumise à
aucune revue ni à aucun statut. Comment distinguer et gouverner les rapports qui font
autorité de ceux qui restent exploratoires ?

## Decision Drivers

* Distinction claire, visible par l'utilisateur final, entre rapport certifié et exploratoire
* Revue et responsabilité nommée avant certification d'un rapport comme référence officielle
* Réduction de la prolifération de rapports concurrents répondant à la même question métier
* Confiance des utilisateurs dans les chiffres qu'ils consomment pour décider

## Considered Options

* Cycle de certification formel des rapports officiels, avec statut visible et revue nommée
* Convention de nommage informelle signalant les rapports de référence, sans revue
* Aucune distinction : tout rapport publié a le même statut apparent

## Decision Outcome

Chosen option: "Cycle de certification formel", parce qu'il est le seul à garantir
qu'un utilisateur peut distinguer, sans ambiguïté, un rapport revu qui engage
l'organisation d'un rapport exploratoire — les deux autres options laissent cette
distinction reposer sur une convention non vérifiée ou l'absence totale de signal.

### Consequences

* Good, because un utilisateur identifie immédiatement si le rapport consulté fait autorité.
* Good, because la prolifération de rapports concurrents devient visible et pilotable.
* Bad, because un processus de revue et une responsabilité nommée doivent être opérés en continu.
* Neutral, because les rapports existants doivent être triés entre candidats et exploratoires.

### Confirmation

Contrôles dérivés : CTL-D05-09 (rapport certifié revu par une autorité nommée — mode
revue), CTL-D11-02 (statut de certification visible par l'utilisateur final sur tout
rapport publié — mode automatique). Preuve attendue : registre des rapports certifiés +
capture du statut affiché. Grille : conforme = rapport de référence certifié et statut
visible ; partiel = certification existante sans affichage systématique ; non conforme =
aucune distinction entre certifié et exploratoire.

## Pros and Cons of the Options

### Cycle de certification formel
* Good, because distinction fiable, prolifération pilotable, confiance des utilisateurs.
* Bad, because processus de revue à opérer et à maintenir dans la durée.

### Convention de nommage informelle
* Good, because coût de mise en place minimal.
* Bad, because convention non vérifiée, contournable, aucune revue réelle derrière le signal.

### Aucune distinction de statut
* Good, because aucune friction à la publication d'un rapport.
* Bad, because l'utilisateur ne peut jamais savoir lequel des rapports concurrents fait foi.

## More Information

Instanciations : `profil:powerbi` → espace de travail certifié avec badge de confiance
visible et propriétaire nommé ; autres profils de restitution → mécanisme de
certification équivalent. Comble un manque du profil de référence : aucune décision
existante ne gouvernait la certification des rapports.
