---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipe d'exploitation"
informed: "toutes les équipes produit"
id: ADR0210
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 5.24-5.28 (cycle de gestion des incidents de sécurité)", "CIS Controls v8 — 17 (Incident Response Management)"]
derived_controls: [CTL-D12-10]
---

# Réponse à incident de sécurité : détection, confinement, preuve

## Context and Problem Statement

Le corpus couvre déjà l'incident opérationnel générique (disponibilité, performance) et
son post-mortem, mais aucune décision ne distingue l'incident de sécurité : une
compromission de confidentialité ou d'intégrité y exige un confinement rapide sans détruire
les preuves nécessaires à l'investigation. Comment garantir qu'un tel incident est détecté,
qualifié, confiné et documenté de façon exploitable ensuite, y compris juridiquement ?

## Decision Drivers

* Distinction entre incident opérationnel générique et incident de sécurité (confidentialité/intégrité compromises)
* Confinement rapide sans détruire les preuves nécessaires à l'investigation
* Délai de qualification borné : tout signal de sécurité est trié avant expiration d'une fenêtre définie
* Chaîne de preuve exploitable a posteriori (forensic), y compris juridiquement

## Considered Options

* Procédure de réponse à incident de sécurité dédiée (qualification, confinement, preuve, remédiation), rôles nommés et délai de qualification borné
* Traitement via le processus d'incident opérationnel générique existant, sans étape de préservation de preuve dédiée
* Gestion ad hoc par l'équipe disponible au moment de l'incident, sans procédure écrite

## Decision Outcome

Chosen option: "Procédure de réponse à incident de sécurité dédiée", parce que c'est la
seule option qui préserve la preuve pendant le confinement, borne le délai de qualification
et nomme une responsabilité claire, indépendamment de l'hébergeur ou de la nature de l'incident.

### Consequences

* Good, because un incident de sécurité est confiné sans perte de preuve exploitable ensuite.
* Good, because le délai de qualification devient mesurable et opposable en audit.
* Bad, because une astreinte et une procédure dédiées doivent être maintenues et exercées, coût récurrent.
* Neutral, because le niveau d'escalade dépend de la gravité, laissée à l'appréciation de l'autorité désignée dans les cas ambigus.

### Confirmation

Contrôle dérivé : CTL-D12-10 (procédure de réponse à incident de sécurité documentée —
qualification, confinement, preuve horodatée protégée en écriture, remédiation — rôles
nommés et délai de qualification borné, exercée au moins annuellement — mode revue). Preuve
attendue : procédure à jour + registre de preuve du dernier incident ou exercice simulé.
Grille : conforme = procédure à jour ET incident/exercice traité sous 12 mois, registre
complet ; partiel = procédure non exercée depuis plus de 12 mois ; non conforme = absence de
procédure ou registre de preuve inexistant.

## Pros and Cons of the Options

### Procédure de réponse à incident de sécurité dédiée
* Good, because préserve la preuve, borne la qualification, responsabilité claire.
* Bad, because astreinte et exercice réguliers à maintenir, coût récurrent.

### Processus d'incident opérationnel générique
* Good, because aucun processus supplémentaire à créer ni à maintenir.
* Bad, because aucune préservation de preuve dédiée ; risque de contamination de la scène.

### Gestion ad hoc sans procédure
* Good, because coût nul tant qu'aucun incident ne survient.
* Bad, because réponse imprévisible, aucune preuve exploitable, aucune trace d'audit.

## More Information

Instanciations : `profil:azure` → détection et playbook de confinement automatisé via le
SIEM/SOAR de la plateforme ; autres profils → SIEM/SOAR équivalent, playbook documenté. Lié
à ADR0211 (signaux de détection) et ADR0213 (notification externe, même chaîne de preuve).
Manque comblé : ISO/IEC 27002:2022 — 5.24-5.28 et CIS Controls v8 — 17, non couverts
(EXTENSION-CORPUS.md §2).
