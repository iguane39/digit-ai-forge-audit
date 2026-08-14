---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0202
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 5.17", "NIST SP 800-63B — §4.2.1 (AAL2) & §5.1.1 (MFA)", "OWASP ASVS 5.0 — V6.2/V6.3 + V6.5.1 (MFA) — 4.0.3 V2.1/V2.2 ; V2.2.5 déplacée en V12.3.5, V2.2.6 couverte par V6.5.1, V2.1.4 et V2.1.8 supprimées", "OpenID Connect / OAuth 2.0 (spécification ouverte)"]
derived_controls: [CTL-D03-01]
---

# Authentification déléguée à un IdP central + MFA par défaut

## Context and Problem Statement

Chaque application qui gère sa propre base d'identifiants crée un silo : politique de
mot de passe propre, MFA absent ou incohérent, et surtout un accès qui survit à un
départ tant que ce silo particulier n'est pas su ou traité. Comment garantir un niveau
d'authentification uniforme et fort pour tout accès humain, quelle que soit l'application ?

## Decision Drivers

* Suppression des silos d'identifiants applicatifs : une identité, un cycle de vie
* Élévation systématique du niveau d'assurance par facteur multiple (MFA)
* Révocation immédiate et centralisée en cas de départ ou de compromission
* Neutralité technologique : le protocole de délégation est ouvert, l'IdP est un choix de profil

## Considered Options

* Authentification déléguée à un fournisseur d'identité central via un protocole ouvert, MFA imposé par défaut
* Authentification locale par application, mot de passe seul
* Authentification locale par application, MFA laissé au choix de l'utilisateur

## Decision Outcome

Chosen option: "IdP central + MFA imposé", parce que seule cette option centralise le
cycle de vie des identités en un point, élève uniformément le niveau d'assurance et
autorise un audit unique des accès humains, indépendamment de la stack applicative.

### Consequences

* Good, because une identité unique par personne ; révocation immédiate en un point à l'offboarding.
* Good, because le niveau d'assurance (MFA) est garanti par construction, pas par la discipline de chaque équipe.
* Bad, because dépendance critique à la disponibilité de l'IdP central (mitigée par un plan de continuité dédié).
* Neutral, because une étape supplémentaire (MFA) s'ajoute à chaque nouvelle session utilisateur.

### Confirmation

Contrôle dérivé : CTL-D03-01 (authentification déléguée + MFA actif sur 100 % des accès
humains — mode revue). Preuve attendue : configuration de fédération + capture de
l'exigence MFA + liste des applications non fédérées, le cas échéant sous dérogation.
Grille : conforme = toutes les applications fédérées avec MFA actif ; partiel =
fédération sans MFA généralisé ; non conforme = authentification locale sans MFA sur
une application exposée.

## Pros and Cons of the Options

### IdP central + MFA imposé
* Good, because cycle de vie d'identité unique, MFA garanti, révocation centralisée.
* Bad, because point de dépendance critique à gouverner (continuité de service).

### Authentification locale, mot de passe seul
* Good, because aucune dépendance externe, mise en œuvre triviale.
* Bad, because silo d'identifiants par application ; MFA absent ; offboarding non garanti.

### Authentification locale, MFA optionnel
* Good, because progrès partiel sans changement d'architecture.
* Bad, because niveau d'assurance hétérogène : dépend du choix de chaque utilisateur.

## More Information

Instanciations : `profil:azure` → Entra ID + accès conditionnel imposant le MFA ;
`profil:aws` → IAM Identity Center fédéré à un IdP externe. Protocole de délégation
recommandé au niveau core : OpenID Connect / OAuth 2.0 (spécifications ouvertes,
admissibles au titre de la règle d'arrêt).
