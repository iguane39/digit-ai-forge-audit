---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0204
domain: "02"
invariant: false
standards: ["NIST SP 800-63B — §5.1.1 (memorized secrets)", "ISO/IEC 27002:2022 — 5.17", "OWASP ASVS 5.0 — V6.2.4 + V6.2.10/V6.2.12 (éclats de 4.0.3 V2.1.7) + V6.2.5 (4.0.3 V2.1.9)"]
derived_controls: [CTL-D02-05]
---

# Politique de mots de passe et de comptes alignée sur l'état de l'art

## Context and Problem Statement

Les politiques historiques (rotation périodique imposée, complexité artificielle) sont
aujourd'hui documentées comme contre-productives : elles poussent au contournement
(motifs prévisibles, mots de passe notés) sans élever la sécurité réelle. Quelle
politique de mots de passe et de comptes adopter pour qu'elle renforce la sécurité au
lieu de la dégrader par la pratique des utilisateurs ?

## Decision Drivers

* Alignement sur l'état de l'art normatif (longueur et vérification plutôt que complexité imposée)
* Réduction du taux de contournement utilisateur (post-it, incrémentation prévisible)
* Protection contre le bourrage d'identifiants et les mots de passe déjà compromis
* Compatibilité avec une éventuelle bascule ultérieure vers une authentification sans mot de passe

## Considered Options

* Politique fondée sur une longueur minimale, la vérification contre des listes de mots de passe compromis et un verrouillage anti-force-brute, sans rotation périodique imposée ni complexité artificielle
* Politique historique : rotation périodique obligatoire et règles de complexité imposées
* Aucune politique formelle, laissée à la discrétion de chaque application

## Decision Outcome

Chosen option: "Politique fondée sur la longueur et l'anti-compromission", parce qu'elle
est la seule appuyée sur des preuves de réduction du contournement utilisateur et
alignée sur le référentiel normatif de référence, tout en restant vérifiable
indépendamment de la stack.

### Consequences

* Good, because réduction mesurable des pratiques de contournement (réutilisation, incrémentation).
* Good, because protection effective contre les identifiants déjà exposés publiquement.
* Bad, because rupture avec des habitudes historiques ; pédagogie nécessaire côté utilisateurs et auditeurs.
* Neutral, because cette politique s'efface naturellement si une méthode sans mot de passe est adoptée (ADR0202).

### Confirmation

Contrôle dérivé : CTL-D03-09 (longueur minimale, vérification anti-compromission,
verrouillage anti-force-brute, absence de rotation périodique injustifiée — mode
revue). Preuve attendue : configuration de la politique de comptes + résultat d'un test
de verrouillage. Grille : conforme = les trois exigences réunies ; partiel = deux sur
trois ; non conforme = politique absente ou fondée uniquement sur la complexité/rotation imposées.

## Pros and Cons of the Options

### Longueur et anti-compromission
* Good, because fondée sur des preuves, réduit le contournement, vérifiable.
* Bad, because change des habitudes établies de longue date.

### Politique historique (rotation + complexité)
* Good, because perçue comme rigoureuse, familière aux auditeurs habitués.
* Bad, because démontrée contre-productive : contournement, prévisibilité.

### Absence de politique formelle
* Good, because aucun effort de mise en œuvre.
* Bad, because niveau de robustesse imprévisible, hétérogène d'une application à l'autre.

## More Information

Instanciations : `profil:azure` → Entra ID : protection par mots de passe interdits +
verrouillage intelligent ; `profil:aws` → politique de mots de passe IAM avec liste de
blocage personnalisée. Vers une authentification sans mot de passe (spécification
ouverte de type clé de sécurité) quand le profil le permet, en remplacement progressif.
