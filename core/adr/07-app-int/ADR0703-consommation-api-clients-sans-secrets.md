---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0703
domain: "07"
invariant: true
standards: ["OWASP ASVS 5.0 — V2.10 (secrets côté client)", "OAuth2 BCP (Best Current Practice)", "ISO/IEC 27002:2022 — 8.24 (usage de la cryptographie)"]
derived_controls: [CTL-D03-09]
---

# Consommation d'API depuis les clients sans exposition de secrets

## Context and Problem Statement

Un client public (application mobile, application exécutée dans un navigateur, script
distribué) qui embarque une clé d'API ou un secret d'application expose ce secret à
quiconque inspecte le client. Comment permettre à des clients publics de consommer des
API protégées sans jamais leur confier un secret qu'ils ne peuvent garder confidentiel ?

## Decision Drivers

* Aucun secret statique ne doit résider dans un client que l'utilisateur final contrôle
* Authentification de l'utilisateur final distincte de l'authentification de l'application
* Révocation immédiate d'un accès compromis sans redéploiement du client
* Compatibilité avec des clients publics multiples (web, mobile, poste de travail)

## Considered Options

* Délégation d'autorisation par jetons à courte durée de vie, sans secret client statique
* Clé d'API statique embarquée dans le client, envoyée à chaque appel
* Secret partagé distribué hors bande (documentation, fichier de configuration livré)

## Decision Outcome

Chosen option: "Délégation d'autorisation par jetons à courte durée de vie", parce que
c'est la seule option qui ne fait reposer la sécurité sur aucun secret que le client ne
peut protéger, autorise une révocation immédiate, et s'applique uniformément à tout type
de client public.

### Consequences

* Good, because aucun secret client compromis par inspection du poste, de l'app ou du trafic.
* Good, because révocation et durée de vie courte limitent la fenêtre d'exploitation d'un jeton volé.
* Bad, because un flux d'obtention et de renouvellement de jeton doit être implémenté par client.
* Neutral, because dépendance à un fournisseur d'identité pour l'émission des jetons.

### Confirmation

Contrôles dérivés : CTL-D02-03 (aucun secret statique détecté dans un client public —
mode automatique), CTL-D01-03 (flux de délégation d'autorisation documenté et testé pour
chaque client — mode revue). Preuve attendue : rapport d'inspection des artefacts client
(0 secret) + configuration du flux de délégation. Grille : conforme = 0 secret client
détecté et flux de jetons actif ; partiel = flux actif avec résidu non exploitable ; non
conforme = secret statique exploitable détecté.

## Pros and Cons of the Options

### Jetons à courte durée de vie, sans secret statique
* Good, because aucun secret à protéger côté client ; révocation immédiate possible.
* Bad, because complexité du flux d'obtention et de renouvellement des jetons.

### Clé d'API statique embarquée
* Good, because implémentation triviale côté client.
* Bad, because secret exposé dès la première inspection du client ; révocation = redéploiement.

### Secret partagé distribué hors bande
* Good, because ne nécessite aucune infrastructure d'émission de jetons.
* Bad, because diffusion incontrôlable une fois le secret communiqué ; aucune révocation ciblée.

## More Information

Instanciations : `profil:azure` → fournisseur d'identité central émettant les jetons +
PKCE pour les clients publics ; autres profils → fournisseur OpenID Connect équivalent.
Généralise la décision de consommation d'API sans secret du profil de référence.
