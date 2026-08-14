---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0201
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.24", "OWASP ASVS 5.0 — V13.3.1 (gestion des secrets) + V13.2.1/V13.2.3 (authentification de service) — 4.0.3 V2.10 éclatée, V2.10.3 couverte et V2.10.4 fusionnée dans V13.3.1", "NIST SSDF — PS.1", "12-Factor — III. Config"]
derived_controls: [CTL-D03-02, CTL-D03-03, CTL-D03-04]
---

# Gestion centralisée des secrets hors du code source

## Context and Problem Statement

Des identifiants (clés d'API, chaînes de connexion, certificats) présents dans le code, la
configuration versionnée ou les journaux constituent la première cause de compromission
d'applications. Comment garantir qu'aucun secret ne réside dans un artefact versionné ou
livré, tout en restant utilisable par les applications à l'exécution ?

## Decision Drivers

* Réduction de la surface de fuite (dépôts, images, logs, tickets)
* Rotation et révocation possibles sans redéploiement du code
* Auditabilité des accès aux secrets (qui, quoi, quand)
* Portabilité : la règle vaut pour tout langage, plateforme et hébergeur

## Considered Options

* Coffre-fort de secrets centralisé + identités d'exécution (pas de secret statique)
* Secrets chiffrés dans le dépôt (outillage de chiffrement de fichiers), déchiffrés au déploiement
* Variables d'environnement gérées par la plateforme d'exécution uniquement

## Decision Outcome

Chosen option: "Coffre-fort centralisé + identités d'exécution", parce que c'est la seule
option qui supprime le secret statique (l'application s'authentifie par son identité
d'exécution), offre rotation, révocation et journal d'accès natifs, et satisfait tous les
drivers indépendamment de la stack.

### Consequences

* Good, because plus aucun secret dans le code, les artefacts ou la CI ; rotation sans livraison.
* Good, because journal d'accès exploitable en audit (D03) et en réponse à incident (D12).
* Bad, because dépendance d'exécution au coffre-fort : sa disponibilité devient critique
  (mitigée par cache local chiffré à durée courte).
* Neutral, because coût d'apprentissage initial pour les équipes.

### Confirmation

Contrôles dérivés : CTL-D03-02 (aucun secret détecté par scan — mode automatique),
CTL-D03-03 (rotation ≤ 90 j et journal d'accès actif — mode revue).
Preuve attendue : rapport de scan de secrets vierge sur l'historique + capture de la
politique de rotation. Grille : conforme = scan vierge ET rotation active ; partiel = scan
vierge sans rotation ; non conforme = tout secret détecté.

## Pros and Cons of the Options

### Coffre-fort centralisé + identités d'exécution
* Good, because supprime le secret statique ; rotation/révocation/audit natifs.
* Bad, because point de dépendance d'exécution.

### Secrets chiffrés dans le dépôt
* Good, because simple, auditable en Git.
* Bad, because le déchiffrement exige… un secret ; rotation = commit ; journal d'accès absent.

### Variables d'environnement plateforme
* Good, because standard 12-Factor, portable.
* Bad, because fuite facile (dumps, logs), pas de rotation gouvernée ni d'audit d'accès.

## More Information

Instanciations par profil : `profil:azure` → Key Vault + identités managées ;
`profil:aws` → Secrets Manager + rôles IAM. Le profil fournit les commandes de
vérification exécutables du contrôle CTL-D03-02.
