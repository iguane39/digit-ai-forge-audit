---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes d'exploitation"
informed: "équipes produit"
id: ADR0402
domain: "04"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.15", "NIST SP 800-53 — famille AU (Audit and Accountability)", "CIS Controls v8 — 8 (Audit Log Management)"]
derived_controls: [CTL-D03-08, CTL-D10-09, CTL-D10-12]
---

# Événements de sécurité journalisés et accès aux journaux gouverné

## Context and Problem Statement

Sans catalogue explicite des événements de sécurité à journaliser, un incident
(authentification, élévation de privilège, accès à une donnée sensible) ne laisse aucune
trace exploitable ; et sans gouvernance de l'accès aux journaux, la trace elle-même devient
falsifiable. Quels événements journaliser systématiquement, et qui peut consulter ou
modifier ces journaux ?

## Decision Drivers

* Reconstitution fiable d'un incident de sécurité a posteriori
* Intégrité de la preuve : un journal modifiable par son sujet ne prouve rien
* Conformité aux obligations d'auditabilité, réglementaires et contractuelles
* Portée universelle : la règle s'applique à toute application, indépendamment de sa stack

## Considered Options

* Catalogue d'événements de sécurité normalisé, journal inviolable, accès restreint et journalisé
* Journalisation applicative libre, sans catalogue ni restriction d'accès
* Journalisation des seules erreurs techniques, événements de sécurité non distingués

## Decision Outcome

Chosen option: "Catalogue normalisé + journal inviolable + accès gouverné", parce que c'est
la seule option qui garantit à la fois l'exhaustivité des événements probants et
l'intégrité de la preuve — un journal accessible en écriture par celui qu'il surveille n'a
aucune valeur probante.

### Consequences

* Good, because tout incident de sécurité dispose d'une trace exploitable et fiable.
* Good, because l'accès aux journaux devient lui-même auditable (qui a consulté quoi, quand).
* Bad, because volume de journalisation supplémentaire à traiter et à stocker (lien ADR0404).
* Neutral, because nécessite un catalogue d'événements maintenu à jour au fil des évolutions applicatives.

### Confirmation

Contrôles dérivés : CTL-D10-03 (catalogue d'événements de sécurité journalisés
systématiquement : authentification, élévation de privilège, accès aux secrets et aux
données sensibles), CTL-D10-04 (accès aux journaux restreint à un rôle dédié et lui-même
journalisé). Preuve attendue : extrait du catalogue d'événements + extrait du journal
d'accès aux journaux. Grille : conforme = catalogue complet et accès gouverné démontré ;
partiel = catalogue incomplet ou accès non restreint ; non conforme = événements de
sécurité non distingués des journaux applicatifs génériques.

## Pros and Cons of the Options

### Catalogue normalisé + journal inviolable + accès gouverné
* Good, because preuve exploitable et intègre, accès lui-même auditable.
* Bad, because volume et discipline de maintenance du catalogue.

### Journalisation libre sans catalogue ni restriction
* Good, because aucun effort de conception préalable.
* Bad, because événements de sécurité noyés dans le bruit, accès non maîtrisé.

### Journalisation des seules erreurs techniques
* Good, because volume minimal.
* Bad, because les événements de sécurité (rarement des erreurs) ne sont jamais capturés.

## More Information

Instanciations : `profil:elastic` → schéma commun de champs de sécurité (ECS) + contrôle
d'accès par rôle sur l'index de journaux. S'articule avec l'observabilité par défaut
(ADR0401), dont elle spécialise le sous-ensemble sécurité.
