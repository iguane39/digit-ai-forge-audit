---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0702
domain: "07"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.21 (sécurité des services réseau)", "OWASP ASVS 5.0 — V12 (fichiers et ressources)", "ISO/IEC 27002:2022 — 8.12 (prévention de la fuite de données)"]
derived_controls: [CTL-D01-13]
---

# Échanges de fichiers via service managé de confiance

## Context and Problem Statement

Les échanges de fichiers volumineux ou par lots (exports, imports, transferts
périodiques) contournent souvent l'API applicative et empruntent des canaux ad hoc
(partage de dossier, messagerie, script de transfert isolé). Comment garantir que les
échanges de fichiers entre applications ou partenaires restent tracés, sécurisés et
gouvernés au même titre que les échanges API ?

## Decision Drivers

* Traçabilité de chaque dépôt ou retrait de fichier (qui, quoi, quand)
* Contrôle d'accès et chiffrement homogènes, y compris pour des fichiers volumineux
* Détection de contenu malveillant ou non conforme avant intégration en aval
* Suppression des canaux de transfert ad hoc et non inventoriés

## Considered Options

* Échanges de fichiers via un service managé de confiance (dépôt gouverné, accès contrôlé)
* Transferts de fichiers ad hoc par canal bureautique (messagerie, partage de dossier)
* Scripts de transfert point à point isolés par équipe

## Decision Outcome

Chosen option: "Service managé de confiance", parce qu'il centralise le contrôle
d'accès, le chiffrement et la détection de contenu, et transforme chaque échange de
fichier en événement tracé — la seule option qui tient quel que soit le volume ou la
fréquence des échanges.

### Consequences

* Good, because chaque dépôt ou retrait de fichier est journalisé et attribuable à une identité.
* Good, because un point unique de détection de contenu malveillant avant intégration en aval.
* Bad, because dépendance à la disponibilité du service managé pour tout échange par lot.
* Neutral, because migration des scripts existants vers le service managé à planifier.

### Confirmation

Contrôles dérivés : CTL-D01-02 (aucun échange de fichier hors service managé de
confiance — mode revue), CTL-D02-02 (contrôle d'accès, chiffrement et détection de
contenu actifs — mode automatique). Preuve attendue : inventaire des canaux de transfert
de fichiers + configuration du service managé. Grille : conforme = 100 % des échanges
via le service managé ; partiel = canaux ad hoc résiduels dérogés ; non conforme = canal
ad hoc non tracé détecté.

## Pros and Cons of the Options

### Service managé de confiance
* Good, because contrôle d'accès, chiffrement et détection de contenu centralisés.
* Bad, because point de dépendance à gouverner (disponibilité, capacité).

### Transferts bureautiques ad hoc
* Good, because aucun outillage à déployer.
* Bad, because aucune traçabilité, aucun contrôle de contenu, fuite de données facilitée.

### Scripts de transfert point à point
* Good, because performant pour un besoin technique isolé.
* Bad, because canaux dispersés, non inventoriés, sécurité hétérogène d'une équipe à l'autre.

## More Information

Instanciations : `profil:azure` → compte de stockage géré avec accès signé temporaire et
analyse de contenu ; autres profils → service de transfert managé équivalent. Généralise
les décisions d'échange de fichiers du profil de référence (service managé de confiance).
