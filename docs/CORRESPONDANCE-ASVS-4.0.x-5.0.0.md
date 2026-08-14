# Correspondance OWASP ASVS 4.0.x → 5.0.0 — et vérification des citations du corpus

**Établi le 2026-08-14** (mandat TF-0205, suite du §7 de `MAPPING-CONTROLES-ASVS.md`).
**Portée** : document de constat et de correspondance. **Aucune citation n'est corrigée ici.**

> **Verdict : constat CONFIRMÉ sur le texte publié.** Le §7 de `MAPPING-CONTROLES-ASVS.md`
> avait établi par recoupement interne que les citations `OWASP ASVS 5.0 — Vxx` du corpus
> emploient la numérotation de chapitres d'ASVS **4.0.x**. Ce document lève la réserve de
> méthode : les huit lignes de ce constat sont vérifiées une à une contre les titres publiés
> des deux versions. **Les huit sont exactes.**

## 1. Sources

Relevées le 2026-08-14. Les titres proviennent du dépôt officiel `OWASP/ASVS`, croisés entre
trois pièces indépendantes par version : le **nom de fichier** de chaque chapitre, le **titre
de niveau 1** (`# V<n> <Nom>`) à l'intérieur du fichier, et l'**export structuré officiel**
(JSON livré par le projet).

| Version | Pièces |
|---|---|
| **5.0.0** | `https://api.github.com/repos/OWASP/ASVS/contents/5.0/en` (listage) · `https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/<fichier>.md` (titres H1) · `https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.json` (`Version: "5.0.0"`, 17 objets chapitre) |
| **4.0.3** | `https://api.github.com/repos/OWASP/ASVS/contents/4.0/en?ref=v4.0.3` · `https://raw.githubusercontent.com/OWASP/ASVS/v4.0.3/4.0/en/<fichier>.md` · `https://raw.githubusercontent.com/OWASP/ASVS/v4.0.3/4.0/docs_en/OWASP%20Application%20Security%20Verification%20Standard%204.0.3-en.json` (`Version: "4.0.3"`, 14 objets chapitre) |
| Récit du changement | `https://raw.githubusercontent.com/OWASP/ASVS/master/5.0/en/0x05-For-Users-Of-4.0.md` (« Changes Compared to v4.x ») |
| Correspondance **par exigence** | `https://github.com/OWASP/ASVS/tree/master/5.0/mappings` — `mapping_v4.0.3_to_v5.0.0.yml` (278 entrées) et son inverse |

**Il n'existe pas de table de correspondance officielle au niveau des chapitres.** L'officiel
est au niveau de l'**exigence** (fichier `mapping_v4.0.3_to_v5.0.0.yml`, entrées du type
`v4.0.3-1.1.5: { tag-v5.0.0: MOVED TO v5.0.0-13.1.1 }`, avec aussi `DELETED, NOT IN SCOPE`,
`MERGED TO`, `SPLIT TO`, `COVERED BY`). Toute correspondance de chapitre à chapitre — y
compris celle du §3 ci-dessous — est donc une **lecture dérivée**, jamais un artefact OWASP.

## 2. Les deux structures, côte à côte

**ASVS 4.0.3 — 14 chapitres** · **ASVS 5.0.0 — 17 chapitres.** Le nombre même de chapitres
distingue les deux versions : toute citation `V15`, `V16` ou `V17` est *nécessairement* du
5.0.0, et le corpus n'en contient aucune (il ne cite que V1…V14 — cohérent avec 4.0.x).

| N° | ASVS **4.0.3** | ASVS **5.0.0** |
|---|---|---|
| V1 | Architecture, Design and Threat Modeling | Encoding and Sanitization |
| V2 | Authentication | Validation and Business Logic |
| V3 | Session Management | **Web Frontend Security** |
| V4 | Access Control | API and Web Service |
| V5 | Validation, Sanitization and Encoding | File Handling |
| V6 | Stored Cryptography | Authentication |
| V7 | Error Handling and Logging | Session Management |
| V8 | Data Protection | Authorization |
| V9 | Communication | Self-contained Tokens |
| V10 | Malicious Code | OAuth and OIDC |
| V11 | Business Logic | Cryptography |
| V12 | Files and Resources | Secure Communication |
| V13 | API and Web Service | **Configuration** |
| V14 | Configuration | **Data Protection** |
| V15 | — | Secure Coding and Architecture |
| V16 | — | Security Logging and Error Handling |
| V17 | — | WebRTC |

**Le piège** : trois intitulés existent dans les **deux** versions, à des numéros
**différents** — « Session Management » (4.0.3 V3 → 5.0.0 V7), « API and Web Service »
(4.0.3 V13 → 5.0.0 V4), « Data Protection » (4.0.3 V8 → 5.0.0 V14), « Configuration »
(4.0.3 V14 → 5.0.0 V13). Une citation par numéro seul est donc **silencieusement ambiguë** :
elle ne se trahit que par son libellé.

### Vérification des trois assertions du mandat

| Assertion | Verdict | Preuve |
|---|---|---|
| 5.0.0 V3 = « Web Frontend Security », alors que 4.0.x V3 = « Session Management » | **CONFIRMÉE** | `0x12-V3-Web-Frontend-Security.md`, H1 `# V3 Web Frontend Security`, JSON `{"Shortcode":"V3","Name":"Web Frontend Security"}` · 4.0.3 : `0x12-V3-Session-management.md`, H1 `# V3 Session Management` |
| 5.0.0 V14 = « Data Protection », alors que 4.0.x V14 = « Configuration » | **CONFIRMÉE** | `0x23-V14-Data-Protection.md` · 4.0.3 `0x22-V14-Config.md`, H1 `# V14 Configuration` |
| 5.0.0 V13 = « Configuration », alors que 4.0.x V13 = « API and Web Service » | **CONFIRMÉE** | `0x22-V13-Configuration.md` · 4.0.3 `0x21-V13-API.md`, H1 `# V13 API and Web Service` |

Les cinq autres lignes du §7 de `MAPPING-CONTROLES-ASVS.md` (V1, V2, V4, V5, V12) sont
vérifiées de la même façon et sont **exactes** elles aussi.

## 3. Correspondance dérivée, chapitre par chapitre

Où le **sujet** d'un chapitre 4.0.3 se retrouve en 5.0.0. Colonne « Destinations » : dérivée
du comptage des 278 entrées de `mapping_v4.0.3_to_v5.0.0.yml` (une exigence éclatée compte
une fois par destination) — **calcul, pas artefact OWASP**.

| 4.0.3 | Sujet | Destination principale en 5.0.0 | Autres destinations notables |
|---|---|---|---|
| V1 | Architecture, Design, Threat Modeling | **aucune** — chapitre *supprimé*, exigences redistribuées | V13 (4), V15 (4), V11 (3), 13 exigences sans cible |
| V2 | Authentication | **V6** Authentication (38) | V13 (6), V11 (5), 8 sans cible |
| V3 | Session Management | **V7** Session Management (11) | V3 Web Frontend (5), V14 (2), V9, V10 |
| V4 | Access Control | **V8** Authorization (5) | V13 (2), V3, V16 |
| V5 | Validation, Sanitization, Encoding | **V1** Encoding and Sanitization (22) | V2 (2), V3 (2), V15 (2) |
| V6 | Stored Cryptography | **V11** Cryptography (11) | V14 (3), V13 (2) |
| V7 | Error Handling and Logging | **V16** Security Logging and Error Handling (11) | — |
| V8 | Data Protection | **V14** Data Protection (9) | V16, 7 sans cible |
| V9 | Communication | **V12** Secure Communication (6) | V16 |
| V10 | Malicious Code | **aucune** — dissous (9 sans cible) | V15 (1) |
| V11 | Business Logic | **V2** Validation and Business Logic (6) | V15 |
| V12 | Files and Resources | **V5** File Handling (10) | V13 (2), V1, V3, V15 |
| V13 | API and Web Service | **V4** API and Web Service (3) + V3 (3) | V2 (2), V1, V8, V14 |
| V14 | Configuration | **V3** Web Frontend Security (8) | V15 (5), V13 Configuration (4), V4 (2) |

Deux chapitres 5.0.0 ne reçoivent presque rien de 4.0.3 — **V10** OAuth and OIDC et **V17**
WebRTC : ce sont des contenus neufs.

**Deux conséquences opérationnelles**, décisives pour la suite :

1. **La correspondance n'est pas une bijection.** 4.0.3 V1 et V10 n'ont *aucun* successeur ;
   4.0.3 V14 se disperse sur quatre chapitres 5.0.0. Renuméroter `V1 → ?` n'a pas de réponse
   mécanique — c'est un arbitrage par ADR.
2. **Un numéro de chapitre ne suffit pas pour les citations à sous-section.** `V2.1.7`,
   `V4.1/V4.2`, `V2.10` désignent des exigences précises : leur cible 5.0.0 se lit dans
   `mapping_v4.0.3_to_v5.0.0.yml`, exigence par exigence, pas par translation de chapitre.

## 4. Les 44 emplacements — inventaire recalculé le 2026-08-14

Décompte reproduit à la source (jamais recopié du §7) : **12 ADR FR + 12 ADR EN + 10
contrôles FR + 10 contrôles EN = 44**.

> **Précision qui change le geste de correction** : les 10 + 10 citations de contrôles vivent
> dans les fichiers **par dimension** `core/controls/D0x.json` et `core/controls-en/D0x.json`.
> `controls-core-v1.json` et `controls-core-v1.en.json` sont **assemblés** par
> `tools/assemble-core.mjs`, tout comme `config/merged.json` et
> `config/tenants/exemple/merged.json` le sont par `merge-packs.mjs`. Corriger le pack
> assemblé serait écrasé au prochain assemblage : **la correction se fait dans les `D0x.json`,
> puis on régénère.**

### 4.1 ADR — 12 FR (`core/adr/`) + 12 miroirs EN (`core/adr-en/`, mêmes chemins), ligne 10 (`standards:`)

| # | ADR | Citation portée |
|---|---|---|
| 1 | `02-identity-sec/ADR0201-gestion-centralisee-des-secrets.md` | `OWASP ASVS 5.0 — V2.10` |
| 2 | `02-identity-sec/ADR0202-authentification-idp-central-mfa.md` | `OWASP ASVS 5.0 — V2.1/V2.2` |
| 3 | `02-identity-sec/ADR0203-acces-externes-federes.md` | `OWASP ASVS 5.0 — V4.1` |
| 4 | `02-identity-sec/ADR0204-politique-mots-de-passe-etat-art.md` | `OWASP ASVS 5.0 — V2.1.7/V2.1.9` |
| 5 | `02-identity-sec/ADR0207-rbac-revue-periodique-acces.md` | `OWASP ASVS 5.0 — V4.1/V4.2` |
| 6 | `03-network/ADR0301-exposition-point-de-controle-unique.md` | `OWASP ASVS 5.0 — V13` |
| 7 | `03-network/ADR0303-chiffrement-en-transit-systematique.md` | `OWASP ASVS 5.0 — V13` |
| 8 | `03-network/ADR0305-protection-perimetrique-applicative.md` | `OWASP ASVS 5.0 — V13` |
| 9 | `07-app-int/ADR0701-echanges-interapplicatifs-tiers-confiance-api.md` | `OWASP ASVS 5.0 — V13 (API et services web)` |
| 10 | `07-app-int/ADR0702-echanges-fichiers-service-manage-confiance.md` | `OWASP ASVS 5.0 — V12 (fichiers et ressources)` |
| 11 | `07-app-int/ADR0703-consommation-api-clients-sans-secrets.md` | `OWASP ASVS 5.0 — V2.10 (secrets côté client)` |
| 12 | `07-app-int/ADR0706-gestion-quotas-limitation-debit.md` | `OWASP ASVS 5.0 — V13 (limitation de débit)` |

### 4.2 Contrôles — 10 FR (`core/controls/D0x.json`) + 10 EN (`core/controls-en/D0x.json`)

| # | Contrôle | Fichier source | Citation portée |
|---|---|---|---|
| 13 | `CTL-D01-12` | `D01.json` | `OWASP ASVS 5.0 — V13` |
| 14 | `CTL-D02-01` | `D02.json` | `OWASP ASVS 5.0 — V1 (Architecture, conception, threat modeling)` |
| 15 | `CTL-D02-02` | `D02.json` | `OWASP ASVS 5.0 — V5 (Validation, Sanitization, Encoding)` |
| 16 | `CTL-D02-04` | `D02.json` | `OWASP ASVS 5.0 — V13 (API et services Web)` |
| 17 | `CTL-D02-05` | `D02.json` | `OWASP ASVS 5.0 — V3 (Session Management)` |
| 18 | `CTL-D02-06` | `D02.json` | `OWASP ASVS 5.0 — V14 (Configuration)` |
| 19 | `CTL-D03-02` | `D03.json` | `OWASP ASVS 5.0 — V2.10` |
| 20 | `CTL-D03-05` | `D03.json` | `OWASP ASVS 5.0 — V4` |
| 21 | `CTL-D03-09` | `D03.json` | `OWASP ASVS 5.0 — V2.10/V3` |
| 22 | `CTL-D06-02` | `D06.json` | `OWASP ASVS 5.0 — V13` |

### 4.3 Artefacts dérivés — à **régénérer**, pas à éditer

| Artefact | Occurrences `ASVS` | Producteur |
|---|---|---|
| `core/controls/controls-core-v1.json` | 10 | `tools/assemble-core.mjs` |
| `core/controls/controls-core-v1.en.json` | 10 | `tools/assemble-core.mjs` |
| `config/merged.json` | 10 | `tools/merge-packs.mjs` |
| `config/tenants/exemple/merged.json` | 10 | `tools/merge-packs.mjs` |

`CHANGELOG.md` (2 occurrences) est un **historique** : il relate ce qui a été écrit à une
date, et n'a pas à être réécrit. `docs/GOUVERNANCE-STANDARDS.md` et `docs/MANUEL-ENTREPRISE.md`
(1 chacun) citent le standard sans numéro de chapitre — non concernés.

## 5. Les 44 ne se corrigent pas d'un seul geste — trois classes

C'est la raison de fond pour laquelle la correction de masse est **refusée ici** : les 44
emplacements ne relèvent pas du même traitement.

**Classe A — mésnumérotation prouvée par le libellé** (7 citations distinctes ; **14
emplacements** avec les miroirs EN) : le libellé accolé *est* un titre de chapitre 4.0.x.
`ADR0701`, `ADR0702`, `CTL-D02-01`, `CTL-D02-02`, `CTL-D02-04`, `CTL-D02-05`, `CTL-D02-06`.
Ce sont ces 14 emplacements qui **portent la preuve** ; les 30 autres héritent du diagnostic
par cohérence de corpus (même convention, même chaîne `ASVS 5.0`, même lot d'écriture).

**Classe B — citation à sous-section** (`V2.10`, `V2.1/V2.2`, `V2.1.7/V2.1.9`, `V4.1`,
`V4.1/V4.2`, `V2.10/V3`) : la cible 5.0.0 ne se déduit **pas** d'une translation de chapitre.
Chaque exigence doit être suivie dans `mapping_v4.0.3_to_v5.0.0.yml`, où elle peut être
`MOVED`, `MERGED`, `SPLIT` ou `DELETED, NOT IN SCOPE`. Une renumérotation mécanique
fabriquerait ici des références **fausses mais crédibles** — le pire résultat possible pour un
corpus de gouvernance.

**Classe C — citation dont la pertinence est douteuse dans *les deux* versions** : `ADR0303`
(chiffrement en transit) cite `V13`. En 4.0.3, V13 = *API and Web Service* ; en 5.0.0,
V13 = *Configuration*. Le chiffrement en transit relève de 4.0.3 **V9 Communication** →
5.0.0 **V12 Secure Communication**. Cette citation n'est donc pas seulement mal numérotée :
elle vise le mauvais chapitre **dans les deux référentiels**. Même réserve pour `ADR0305`
(protection périmétrique) et `ADR0706` (`V13 (limitation de débit)`, glose thématique et non
titre de chapitre). Ces cas demandent un arbitrage **de fond**, pas de forme.

## 6. Ce qui reste à décider (humain)

Le choix n'est pas technique, il est **normatif** — il change le sens de citations opposables :

1. **Rétablir la version réellement citée** — remplacer `OWASP ASVS 5.0` par
   `OWASP ASVS 4.0.3` partout. Geste le plus sûr : il rend les citations *exactes* sans
   toucher aux numéros, et supprime le mensonge de version. Coût : le corpus déclare alors
   s'appuyer sur une version antérieure du standard.
2. **Migrer vers 5.0.0** — renuméroter chapitres *et* sous-sections d'après
   `mapping_v4.0.3_to_v5.0.0.yml`, en arbitrant au cas par cas les classes B et C, et en
   traitant à part 4.0.3 V1 (sans successeur). Coût : une revue par ADR, plus la mise à jour
   des miroirs EN et la régénération des packs.
3. **Les deux, par étapes** — (1) immédiatement pour rétablir la vérité de la citation, puis
   (2) comme évolution instruite en SemVer.

Quelle que soit l'option, la vérification finale passe par les oracles du dépôt
(`node tools/lint-agnostic.mjs`, `node --test tests/oracles/*.test.mjs`) et par la
régénération des artefacts du §4.3 — jamais par relecture seule.

## 7. Ce que ce document n'est pas

- **Pas une correction.** Aucune des 44 citations n'est modifiée. Le §7 de
  `MAPPING-CONTROLES-ASVS.md` reste le constat d'origine ; ce document en lève la seule
  réserve (« à confirmer sur le texte source ») et l'instruit.
- **Pas une table officielle.** OWASP ne publie pas de correspondance de chapitre à chapitre.
  Le §3 est une lecture dérivée d'un fichier de correspondance **par exigence**, et le §2 est
  seul à être directement attesté.
- **Pas une mesure de conformité.** Rien ici ne dit qu'une exigence ASVS est tenue.
- **Une incohérence de source signalée** : `0x05-For-Users-Of-4.0.md` annonce « 286
  exigences » en introduction et « 278 » plus loin ; `mapping_v4.0.3_to_v5.0.0.yml` en
  contient 278. Le décompte 286 n'a pu être réconcilié — les comptages du §3 reposent sur les
  278 entrées effectivement présentes.
