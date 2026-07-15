---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0206
domain: "02"
invariant: true
standards: ["RGPD — art. 32", "RGPD — art. 9", "ISO/IEC 27701:2019 — §6", "ISO/IEC 27002:2022 — 5.12"]
derived_controls: [CTL-D02-07, CTL-D04-01, CTL-D04-02, CTL-D04-04, CTL-D04-05, CTL-D04-08, CTL-D04-09, CTL-D10-09, CTL-D13-08, CTL-D14-04, CTL-D14-08, CTL-D15-04, CTL-D16-04]
---

# Classification et protection des données personnelles/sensibles

## Context and Problem Statement

Toutes les données ne méritent pas le même niveau de protection. Sans classification
explicite, la protection est soit appliquée uniformément au maximum (effort
disproportionné sur des données non critiques), soit — pire — insuffisamment appliquée
aux données personnelles ou sensibles. Comment garantir que chaque donnée reçoit une
protection proportionnée et démontrable ?

## Decision Drivers

* Obligation réglementaire de protéger les données personnelles proportionnellement au risque
* Priorisation de l'effort de sécurité sur les actifs qui le requièrent réellement
* Traçabilité : démontrer, donnée par donnée, le niveau retenu et sa justification
* Portabilité : la classification ne dépend d'aucun entrepôt ni technologie particulière

## Considered Options

* Classification explicite par niveaux, portée par chaque actif de données, avec mesures de protection associées par niveau
* Protection uniforme maximale appliquée à toutes les données sans distinction
* Aucune classification formelle ; protection laissée à l'appréciation de chaque équipe projet

## Decision Outcome

Chosen option: "Classification explicite par niveaux", parce qu'elle seule permet de
démontrer une protection proportionnée et traçable — condition posée par le cadre
réglementaire — tout en évitant le surcoût d'une protection maximale indifférenciée.

### Consequences

* Good, because chaque donnée personnelle ou sensible reçoit des mesures proportionnées et démontrables en audit.
* Good, because priorisation claire de l'effort (chiffrement, minimisation, contrôle d'accès) sur les actifs qui le requièrent.
* Bad, because charge de gouvernance : chaque nouvel actif de données doit être classifié dès sa création.
* Neutral, because une autorité désignée doit trancher les cas ambigus.

### Confirmation

Contrôles dérivés : CTL-D04-01 (classification documentée et à jour pour tout actif de
données), CTL-D04-02 (mesures de protection conformes au niveau déclaré, vérifiées par
sondage). Preuve attendue : registre de classification + échantillon de mesures
techniques sur les actifs classés sensibles. Grille : conforme = classification à jour
ET mesures conformes au niveau ; partiel = classification à jour, mesures incomplètes ;
non conforme = absence de classification ou mesures absentes sur une donnée sensible.

## Pros and Cons of the Options

### Classification explicite par niveaux
* Good, because protection proportionnée, démontrable, priorisation claire de l'effort.
* Bad, because charge de gouvernance continue à chaque création d'actif.

### Protection uniforme maximale
* Good, because simplicité apparente : une seule règle pour tout.
* Bad, because surcoût massif et souvent contourné faute d'être réaliste à grande échelle.

### Absence de classification formelle
* Good, because aucun effort de gouvernance initial.
* Bad, because protection imprévisible ; incapacité à démontrer la conformité en audit.

## More Information

Instanciations : `profil:azure` → Purview : étiquettes de classification + découverte
automatique des données sensibles ; `profil:aws` → Macie : découverte et classification
automatisées. Le schéma de classification (niveaux, critères) est un pack tenant
instanciable ; le principe de proportionnalité reste core.
