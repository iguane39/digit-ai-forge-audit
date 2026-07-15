---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.change_board}, responsables de domaine"
informed: "toutes les équipes"
id: ADR0004
domain: "00"
invariant: false
standards: ["COBIT 2019 (composant Structures organisationnelles — RACI par pratique)", "ISO/IEC 38500:2015 — principe de responsabilité"]
derived_controls: [CTL-D00-02, CTL-D12-05]
---

# Rôles et responsabilités sur les actifs (RACI)

## Context and Problem Statement

Sans matrice de responsabilité explicite par actif (application, service, jeu de données,
composant d'infrastructure), un incident ou une question d'audit se heurte à l'absence
d'interlocuteur identifiable, et la responsabilité se dilue entre équipes au fil des
réorganisations. Comment garantir qu'à tout instant, pour chaque actif, un responsable et
les parties prenantes associées sont identifiables sans ambiguïté ?

## Decision Drivers

* Réduction du facteur bus (bus factor) et du temps de résolution d'incident
* Non-ambiguïté : un seul rôle Accountable par actif, jamais zéro, jamais plusieurs
* Auditabilité de la chaîne de responsabilité (qui décide, qui exploite, qui est informé)
* Applicabilité à tout type d'actif, indépendamment de sa nature technique

## Considered Options

* Matrice RACI obligatoire par actif, déclarée dans le référentiel d'inventaire et revue périodiquement
* Responsabilité implicite déduite de l'organigramme d'équipe, sans déclaration par actif
* Déclaration d'un responsable à la création de l'actif, sans revue ni mise à jour planifiée

## Decision Outcome

Chosen option: "Matrice RACI obligatoire + revue périodique", parce qu'elle seule garantit
qu'un actif ne reste jamais orphelin dans la durée — l'organigramme implicite devient
rapidement obsolète après réorganisation — et fournit une preuve d'audit directement
exploitable.

### Consequences

* Good, because chaque actif conserve un Accountable unique et des Consulted/Informed explicites, y compris après réorganisation.
* Good, because le facteur bus devient mesurable (actifs à contributeur unique) et pilotable dans le temps.
* Bad, because la revue périodique de la matrice constitue un effort récurrent à porter et à budgéter.
* Neutral, because le grain de la matrice (par actif unitaire ou par famille d'actifs) reste un paramètre de profil.

### Confirmation

Contrôles dérivés : CTL-D12-01 (RACI documenté et résolu pour la totalité des actifs en
production), CTL-D12-02 (revue de la matrice à intervalle ≤ 12 mois, avec preuve de
revue). Preuve attendue : export horodaté de la matrice RACI et compte rendu de revue.
Grille : conforme = matrice complète et revue à jour ; partiel = matrice complète mais
revue en retard ; non conforme = au moins un actif sans Accountable identifié.

## Pros and Cons of the Options

### Matrice RACI obligatoire + revue périodique
* Good, because aucun actif orphelin, bus factor mesurable, preuve d'audit directe.
* Bad, because effort récurrent de maintenance de la matrice.

### Responsabilité implicite via l'organigramme
* Good, because aucune déclaration additionnelle à maintenir.
* Bad, because devient rapidement fausse après réorganisation, aucune preuve exploitable.

### Déclaration à la création, sans revue
* Good, because effort initial minimal.
* Bad, because dérive non détectée : le responsable déclaré peut avoir quitté l'actif ou l'organisation.

## More Information

Instanciations par profil : `profil:cmdb-outillee` → matrice RACI portée par les champs
propriétaire/équipe du référentiel d'inventaire (lien ADR0105) ; `profil:wiki-gouvernance`
→ matrice publiée en page dédiée et versionnée.
