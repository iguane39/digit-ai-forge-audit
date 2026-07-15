---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "équipes de conception produit, responsables de domaine"
informed: "toutes les équipes produit"
id: ADR0902
domain: "09"
invariant: false
standards: ["ISO 9241-210 (conception centrée sur l'humain)", "ISO 9241-11 (efficacité, efficience, satisfaction)"]
derived_controls: [CTL-D11-05, CTL-D11-06, CTL-D11-07, CTL-D11-08, CTL-D13-05]
profile_bindings: optional
---

# Validation utilisateur continue et gouvernance de l'expérience

## Context and Problem Statement

Un parcours peut être accessible au sens d'ADR0901 et rester inutilisable : l'accessibilité garantit qu'une interface est atteignable, pas qu'elle sert effectivement l'utilisateur. Sans validation par des utilisateurs réels ni gouvernance des retours, l'expérience se dégrade silencieusement — frictions non détectées, messages d'erreur inexploitables, performance perçue non mesurée — jusqu'à l'abandon ou la réclamation. Comment garantir que les parcours critiques sont validés avec des utilisateurs réels et que les retours collectés gouvernent effectivement l'amélioration continue de l'expérience ?

## Decision Drivers

* Validation par l'usage réel, pas seulement par conformité technique ou revue interne
* Boucle de retour continue plutôt qu'un test ponctuel avant lancement, jamais rejoué
* Gouvernance des retours (backlog priorisé) plutôt qu'une collecte sans suite
* Couverture des trois dimensions de l'utilisabilité : efficacité, efficience, satisfaction

## Considered Options

* Test utilisateur systématique des parcours critiques avant mise à disposition élargie, complété par une collecte continue de retours gouvernée
* Test utilisateur ponctuel au lancement seulement, sans collecte continue ensuite
* Aucun test utilisateur formel ; retours traités uniquement via le support client réactif

## Decision Outcome

Chosen option: "Test systématique + collecte continue gouvernée", parce que c'est la seule option qui valide l'expérience avant l'exposition à grande échelle et qui maintient cette validation dans la durée, plutôt que de la figer au jour du lancement.

### Consequences

* Good, because les frictions majeures sont détectées avant d'atteindre l'ensemble des utilisateurs.
* Good, because le backlog d'amélioration se nourrit de retours réels et priorisés, pas d'intuitions internes.
* Bad, because recruter des utilisateurs représentatifs et maintenir la collecte en continu représente un effort récurrent.
* Neutral, because la cadence des sessions de test et le canal de collecte des retours restent des paramètres d'overlay.

### Confirmation

Contrôles dérivés (existants, rattachés — aucun nouveau contrôle créé) : CTL-D11-06 (parcours critiques testés avec utilisateurs représentatifs avant mise à disposition élargie, plan de correction des frictions), CTL-D11-05 (performance perçue mesurée par outil générique sur les parcours principaux), CTL-D11-07 (messages d'erreur identifiant le problème et proposant une action concrète), CTL-D11-08 (mécanisme de collecte de retours utilisateurs continu alimentant un backlog priorisé), CTL-D13-05 (documentation utilisateur publiée et maintenue à jour). Preuve attendue : comptes-rendus de sessions de test utilisateur + rapport de performance perçue + export des retours collectés et de leur traitement en backlog. Grille : conforme = parcours critiques testés, retours collectés et tracés jusqu'au backlog ; partiel = couverture partielle des parcours ou collecte sans traçabilité ; non conforme = aucun test utilisateur ni mécanisme de collecte.

## Pros and Cons of the Options

### Test systématique + collecte continue gouvernée
* Good, because valide l'expérience avant et après l'exposition à grande échelle.
* Bad, because effort récurrent de recrutement d'utilisateurs et d'animation du backlog.

### Test ponctuel au lancement seulement
* Good, because coût limité à un seul exercice.
* Bad, because l'expérience dérive sans détection après le lancement ; aucune boucle de retour.

### Aucun test formel, support réactif seul
* Good, because aucun coût dédié en amont.
* Bad, because seuls les utilisateurs qui contactent le support sont entendus ; la majorité des frictions reste invisible.

## More Information

Instanciations par profil : `profil:web` → outil de mesure de performance perçue générique intégré au pipeline, complété par une plateforme de collecte de retours (sondage in-app, formulaire) ; le protocole de test utilisateur (nombre de participants, fréquence) relève de l'overlay. Complète ADR0901 (domaine 09) : l'accessibilité garantit l'atteignabilité, cet ADR gouverne l'utilisabilité et son amélioration continue.
