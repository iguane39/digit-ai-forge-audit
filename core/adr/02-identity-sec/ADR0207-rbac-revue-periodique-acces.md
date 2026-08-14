---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0207
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 5.15/5.18", "OWASP ASVS 5.0 — V8.2.1/V8.2.2/V8.3.1 — 4.0.3 V4.1/V4.2 (V4.1.5 déplacée en V16.5.3, V4.2.2 en V3.5.1, V4.1.2 supprimée)", "NIST SP 800-53 — AC-2(j)"]
derived_controls: [CTL-D03-05, CTL-D04-06, CTL-D12-08]
---

# RBAC : autorisation par rôles, revue périodique des accès

## Context and Problem Statement

Sans modèle d'autorisation formel, les droits s'accumulent au fil des demandes
individuelles, rarement révoqués, jusqu'à converger vers un privilège de fait excessif
pour tous. Comment garder un modèle d'autorisation lisible, proportionné et dont la
fidélité au besoin réel reste démontrable dans la durée ?

## Decision Drivers

* Lisibilité du modèle d'autorisation (qui peut faire quoi, en un coup d'œil)
* Prévention de l'accumulation silencieuse de privilèges (permission creep)
* Preuve périodique que les droits accordés correspondent toujours à un besoin réel
* Applicabilité uniforme, quel que soit le système porteur des droits

## Considered Options

* Autorisation par rôles (RBAC) avec revue périodique obligatoire des accès accordés
* Attribution de droits individuels ad hoc, sans modèle de rôles formel
* Autorisation par rôles définie une fois, sans processus de revue périodique

## Decision Outcome

Chosen option: "RBAC avec revue périodique", parce que le modèle par rôles rend
l'autorisation lisible et auditable par construction, et que seule la revue périodique
garantit sa fidélité au besoin réel dans le temps — un modèle sans revue se dégrade
silencieusement.

### Consequences

* Good, because cartographie claire et stable des droits, compréhensible sans archéologie de tickets.
* Good, because la revue périodique détecte et corrige les écarts avant qu'ils ne deviennent un incident.
* Bad, because charge de gouvernance récurrente pour organiser et documenter chaque revue.
* Neutral, because la granularité des rôles reste un arbitrage propre à chaque organisation.

### Confirmation

Contrôle dérivé : CTL-D03-05 (autorisation par rôles documentée ; revue des accès
≤ 6 mois — mode déclaratif + revue). Preuve attendue : cartographie des rôles/droits +
compte-rendu signé de la dernière revue périodique. Grille : conforme = cartographie à
jour ET revue ≤ 6 mois ; partiel = cartographie à jour sans revue récente ; non
conforme = absence de modèle de rôles ou droits individuels ad hoc dominants.

## Pros and Cons of the Options

### RBAC avec revue périodique
* Good, because lisibilité, auditabilité, fidélité maintenue dans le temps.
* Bad, because charge de gouvernance récurrente.

### Droits individuels ad hoc
* Good, because flexibilité maximale au cas par cas.
* Bad, because illisible à l'échelle, accumulation de privilèges non détectée.

### RBAC sans revue périodique
* Good, because lisibilité initiale du modèle de rôles.
* Bad, because dégradation silencieuse : rôles obsolètes et droits orphelins non détectés.

## More Information

Instanciations : `profil:azure` → rôles RBAC natifs + revues d'accès programmées
(Entra ID) ; `profil:aws` → rôles IAM + IAM Access Analyzer pour la revue. Généralise
les schémas d'autorisation par rôle déjà présents dans le profil de référence.
