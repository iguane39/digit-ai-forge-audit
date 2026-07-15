---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0303
domain: "03"
invariant: true
standards: ["NIST SP 800-52 (choix et configuration TLS)", "ISO/IEC 27002:2022 — 8.24", "OWASP ASVS 5.0 — V13"]
derived_controls: [CTL-D02-06]
---

# Chiffrement en transit systématique

## Context and Problem Statement

Toute donnée qui circule en clair sur un réseau — y compris interne — est exposée à
l'interception et à l'altération. Comment garantir que la confidentialité et l'intégrité
des échanges sont assurées sur tout trajet réseau, sans exception ni jugement au cas par cas ?

## Decision Drivers

* Confidentialité et intégrité des échanges, y compris entre composants internes
* Résistance aux interceptions sur des réseaux partagés ou non maîtrisés
* Alignement sur un état de l'art cryptographique qui évolue (versions, suites)
* Absence d'exception tolérable : la règle doit être binaire et vérifiable automatiquement

## Considered Options

* Chiffrement en transit obligatoire sur tout flux, interne et externe, versions et suites à jour
* Chiffrement obligatoire sur les flux externes uniquement, flux internes en clair
* Chiffrement laissé à l'appréciation de chaque équipe selon la sensibilité perçue

## Decision Outcome

Chosen option: "Chiffrement en transit obligatoire sur tout flux", parce qu'il élimine par
principe la notion de « réseau interne de confiance » — précisément l'hypothèse invalidée
par un modèle zero-trust — et parce que c'est la seule formulation vérifiable
automatiquement, sans jugement contextuel.

### Consequences

* Good, because plus aucun flux, interne ou externe, n'est une surface d'interception triviale.
* Good, because la règle est binaire : automatisable en détection continue.
* Bad, because surcoût de calcul et de gestion des certificats/clés sur les flux internes.
* Neutral, because nécessite une politique de cycle de vie cryptographique (versions, obsolescence).

### Confirmation

Contrôles dérivés : CTL-D02-07 (version et suites cryptographiques conformes à l'état de
l'art sur toute interface, exposée ou interne), CTL-D02-08 (aucun flux en clair détecté par
le scan réseau automatisé). Preuve attendue : rapport de scan des versions/suites en usage
+ inventaire des interfaces couvertes. Grille : conforme = 100 % des flux chiffrés avec
versions à jour ; partiel = flux externes couverts, flux internes résiduels en clair ;
non conforme = tout flux externe non chiffré.

## Pros and Cons of the Options

### Chiffrement obligatoire sur tout flux
* Good, because règle binaire, vérifiable, sans angle mort interne.
* Bad, because coût de gestion cryptographique généralisé.

### Chiffrement externe uniquement
* Good, because couvre le risque perçu comme prioritaire à moindre coût.
* Bad, because un mouvement latéral interne intercepte des flux en clair.

### Chiffrement laissé à l'appréciation des équipes
* Good, because flexibilité maximale perçue.
* Bad, because absence de règle vérifiable ; dérive certaine vers le clair par défaut.

## More Information

Instanciations : terminaison gérée par la plateforme d'hébergement ou par le point de
contrôle d'exposition (ADR0301) ; `profil:azure` → certificats gérés + politique de
version minimale imposée à la passerelle. Spécification ouverte de référence : TLS (IETF),
admissible au niveau core.
