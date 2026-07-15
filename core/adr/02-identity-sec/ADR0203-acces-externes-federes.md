---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0203
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 5.18", "NIST SP 800-53 — famille AC (AC-2/AC-3)", "OWASP ASVS 5.0 — V4.1", "SAML 2.0 / OIDC Federation (spécifications ouvertes)"]
derived_controls: [CTL-D03-07]
---

# Accès externes fédérés

## Context and Problem Statement

Partenaires, prestataires et intervenants externes ont besoin d'un accès ponctuel. Le
raccourci le plus fréquent — créer un compte local ad hoc par équipe — produit des accès
sans échéance, invisibles au niveau central et oubliés une fois la mission terminée.
Comment accorder l'accès externe nécessaire sans constituer cette surface non gouvernée ?

## Decision Drivers

* Visibilité centralisée de tout accès externe (qui, quel périmètre, quelle échéance)
* Application du moindre privilège dès l'octroi, sans exception locale
* Révocation automatique à l'échéance : aucun compte oublié
* Cohérence avec l'IdP central (ADR0202), sans référentiel d'identités parallèle

## Considered Options

* Fédération des identités externes via le même point de contrôle d'identité, portée et durée limitées
* Comptes locaux créés au cas par cas par chaque équipe applicative
* Compte générique unique partagé entre tous les intervenants externes

## Decision Outcome

Chosen option: "Fédération des identités externes", parce qu'elle seule maintient un
référentiel d'identités unique, rend tout accès externe visible et bornable dans le
temps, et applique le moindre privilège sans dépendre de la discipline de chaque équipe.

### Consequences

* Good, because inventaire exhaustif des accès externes actifs, consultable à tout moment.
* Good, because expiration automatique : aucun accès externe ne survit silencieusement à sa mission.
* Bad, because un processus d'invitation (approbation, portée, durée) doit être instruit et outillé.
* Neutral, because dépendance au même socle d'identité que les accès internes.

### Confirmation

Contrôle dérivé : CTL-D03-07 (accès externes fédérés, aucun compte local hors procédure
dérogatoire — mode revue). Preuve attendue : export des identités externes actives avec
portée et échéance déclarées. Grille : conforme = 100 % des accès externes fédérés et
bornés dans le temps ; partiel = fédérés sans échéance systématique ; non conforme =
comptes locaux ou partagés détectés.

## Pros and Cons of the Options

### Fédération des identités externes
* Good, because référentiel unique, accès visible et borné, moindre privilège par défaut.
* Bad, because processus d'invitation à instruire et outiller.

### Comptes locaux au cas par cas
* Good, because rapide à mettre en place localement, aucune coordination requise.
* Bad, because invisibilité centrale, oubli fréquent, échéance rarement appliquée.

### Compte générique partagé
* Good, because coût de gestion apparemment nul.
* Bad, because aucune imputabilité individuelle ; révocation impossible sans tout casser.

## More Information

Instanciations : `profil:azure` → identités invitées B2B avec accès conditionnel et date
d'expiration ; `profil:aws` → identités fédérées via un IdP externe, rôles à portée
temporaire. Généralise l'usage d'identités invitées déjà présent dans le profil de référence.
