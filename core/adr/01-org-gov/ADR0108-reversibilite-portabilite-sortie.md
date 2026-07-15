---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.remediation_team}, architectes, {roles.data_roles.owner}"
informed: "toutes les équipes produit"
id: ADR0108
domain: "01"
invariant: true
standards: ["ISO/IEC 25010:2023 — portabilité (adaptabilité, capacité à être installé, remplaçabilité)", "ISO/IEC 19941:2017 (interopérabilité et portabilité en informatique en nuage)"]
derived_controls: [CTL-D01-15]
profile_bindings: optional
---

# Réversibilité et portabilité de sortie

## Context and Problem Statement

Un service ou un actif de données qui ne peut être extrait dans un format exploitable ailleurs que sur sa plateforme d'origine crée une dépendance non maîtrisée : la sortie devient une négociation de crise plutôt qu'une capacité disponible sur demande. Le corpus ne porte aujourd'hui aucun contrôle sur la portabilité de sortie — la caractéristique Portabilité (ISO/IEC 25010) n'est couverte par aucun contrôle existant. Comment garantir que tout service et toute donnée significative peuvent être extraits, dans un format exploitable, indépendamment de la plateforme ou de l'hébergeur retenu ?

## Decision Drivers

* Maîtrise du risque de dépendance (lock-in), technique, contractuel ou organisationnel
* Portabilité vérifiée par un test d'export réel, pas par une clause non exercée
* Délai de sortie borné et documenté plutôt que découvert au moment d'une résiliation
* Neutralité vis-à-vis de l'hébergeur, de l'éditeur et de la forme du service retenue

## Considered Options

* Plan de réversibilité documenté par service/actif, export testé périodiquement
* Clause contractuelle de réversibilité, sans test d'export jamais exercé
* Aucune exigence de réversibilité déclarée ; sortie traitée au cas par cas

## Decision Outcome

Chosen option: "Plan de réversibilité documenté et testé", parce que c'est la seule option qui rend la portabilité de sortie vérifiable avant qu'elle ne soit nécessaire — une clause non exercée ou une absence totale d'exigence ne révèlent leurs lacunes qu'au moment où la sortie est déjà urgente.

### Consequences

* Good, because une sortie ou un changement d'hébergeur redevient un projet planifiable, pas une crise gérée dans l'urgence.
* Good, because le format d'export exploitable est vérifié avant d'être nécessaire, par un test réel et non une clause dormante.
* Bad, because maintenir un plan de réversibilité à jour et le tester périodiquement représente un effort récurrent sans valeur métier immédiate.
* Neutral, because le périmètre des services jugés significatifs (donc soumis au plan) reste un paramètre d'overlay.

### Confirmation

Contrôles dérivés : CTL-D01-15 (chaque service et actif de données significatif dispose d'un plan de réversibilité documenté — périmètre, format d'export, délai — et d'un export réellement testé au moins annuellement, dans un format exploitable hors de la plateforme d'origine — mode revue). Preuve attendue : plan de réversibilité daté par service/actif + rapport du dernier test d'export (ou d'import dans un environnement tiers) avec constat d'exploitabilité. Grille : conforme = plan documenté ET test d'export réussi ≤ 12 mois pour tous les services significatifs ; partiel = plan documenté sans test récent ; non conforme = absence de plan de réversibilité.

## Pros and Cons of the Options

### Plan de réversibilité documenté et testé
* Good, because la portabilité est vérifiée avant d'être nécessaire, par un test réel.
* Bad, because effort récurrent de maintenance et de test à budgéter.

### Clause contractuelle sans test exercé
* Good, because coût de mise en place minimal (négociation contractuelle seule).
* Bad, because la clause ne garantit rien tant qu'elle n'a jamais été exercée.

### Aucune exigence déclarée
* Good, because aucun effort ni coût à court terme.
* Bad, because la sortie devient une négociation de crise, sans délai ni format connus d'avance.

## More Information

Instanciations par profil : `profil:azure` → export programmé des configurations et des données dans des formats ouverts, test d'import périodique en environnement tiers ; `profil:aws` → export équivalent par les mécanismes natifs de sauvegarde/export, testé selon le même cycle. Distinct d'un plan de continuité (ADR0611, disponibilité) : cet ADR couvre la sortie volontaire ou contrainte vers un tiers, pas la reprise après sinistre.
