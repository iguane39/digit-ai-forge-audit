# Correspondance OWASP ASVS 4.0.x → 5.0.0 — et vérification des citations du corpus

**Établi le 2026-08-14** (mandat TF-0205, suite du §7 de `MAPPING-CONTROLES-ASVS.md`).
**Mis à jour le 2026-08-14** (TF-0221) : la direction est tranchée et **appliquée** — voir §6.
**Portée** : constat, correspondance, **et journal de la correction effectivement portée au
corpus**.

> **Verdict du constat : CONFIRMÉ sur le texte publié.** Le §7 de `MAPPING-CONTROLES-ASVS.md`
> avait établi par recoupement interne que les citations `OWASP ASVS 5.0 — Vxx` du corpus
> emploient la numérotation de chapitres d'ASVS **4.0.x**. Ce document lève la réserve de
> méthode : les huit lignes de ce constat sont vérifiées une à une contre les titres publiés
> des deux versions. **Les huit sont exactes.**
>
> **État de la correction au 2026-08-14 : FAITE.** Décision humaine du 2026-08-14, déléguée
> au pilot : **le corpus migre vers ASVS 5.0.0** (§6). Les **22 citations** distinctes
> (44 emplacements avec les miroirs EN) sont **toutes traitées** : 21 réécrites vers leur
> cible 5.0.0 réelle, 1 supprimée faute de successeur (`CTL-D02-01`). **Aucune citation
> n'est laissée en numérotation 4.0.x.** Détail et preuves : §6.

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

## 4. Les 44 emplacements — inventaire d'origine, recalculé le 2026-08-14

> **Cet inventaire est celui d'*avant* correction.** Il est conservé tel quel : c'est la
> pièce qui rend la correction du §6 vérifiable. Pour l'état actuel du corpus, lire le §6.

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

**Après correction (§6)** : les deux packs assemblés portent **9** occurrences chacun et les
deux `merged.json` **9** également — et non plus 10 : `CTL-D02-01` a perdu sa citation ASVS
(§6.4). Les `merged.json` sont ignorés de git (sous-produits de fusion, cf. `.gitignore`) :
ils se régénèrent, ils ne se relisent pas en revue de diff.

## 5. Les 44 ne se corrigent pas d'un seul geste — trois classes

C'est la raison de fond pour laquelle **aucune correction de masse mécanique** n'a été
appliquée : les 44 emplacements ne relèvent pas du même traitement. Cette typologie a servi
de plan de traitement au §6, classe par classe.

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

**Requalification du 2026-08-14** : `CTL-D02-04` figurait en classe A à cause de son libellé
`(API et services Web)` — titre exact de 4.0.3 V13. Sa **règle** porte en réalité sur la
**limitation de débit**, qui n'a jamais relevé de V13 dans aucune version : c'est un cas de
**classe C**, traité comme tel. Classe A effective : 6 citations ; classe C : 4.

## 6. Décision : le corpus MIGRE vers ASVS 5.0.0 — et la migration est faite

**Décision humaine du 2026-08-14, déléguée au pilot** (option 2 des trois qui étaient
ouvertes ; les options « rétablir 4.0.3 » et « les deux par étapes » sont **écartées**).

**Motif.** L'exécution juge déjà sur 5.0.0 : le référentiel curé de la forge de sécurité web
est `asvs-l1.md`, sous-ensemble **L1 d'ASVS 5.0.0**. Revenir à 4.0.3 rendrait le corpus vrai
d'un coup — mais ferait citer à la gouvernance une version que **personne n'applique**, et le
mapping gouvernance↔exécution construit le 2026-08-14
(`MAPPING-CONTROLES-ASVS.md`) deviendrait **inter-versions**. La migration aligne les deux
bouts de la chaîne sur une seule version.

**Méthode.** Chaque citation a été suivie **exigence par exigence** dans le fichier officiel
`mapping_v4.0.3_to_v5.0.0.yml`, jamais par translation de chapitre. Les cibles retenues sont
vérifiées contre le texte publié de 5.0.0 (export JSON officiel `…_5.0.0_en.json`). Le
préfixe `OWASP ASVS 5.0` est **conservé** : le défaut n'a jamais été l'étiquette de version
mais les numéros de chapitre, et un préfixe constant garde les 21 citations homogènes.

### 6.1 Classe B — sous-sections à cibles multiples (8 citations) : toutes réécrites

Une citation dont l'exigence éclate ne se remplace pas par une cible unique — une citation
multiple est exacte, une cible unique choisie arbitrairement serait fausse. Les exigences
supprimées ou fusionnées sont **nommées dans la citation**.

| Emplacement | Avant | Après (cibles réelles 5.0.0) |
|---|---|---|
| `ADR0201` | `V2.10` | `V13.3.1` + `V13.2.1`/`V13.2.3` — V2.10.1→13.2.1, V2.10.2→13.2.3, V2.10.3 *couverte* et V2.10.4 *fusionnée* dans 13.3.1 |
| `ADR0202` | `V2.1/V2.2` | `V6.2`/`V6.3` + `V6.5.1` — V2.2.5→12.3.5, V2.2.6 couverte par 6.5.1, V2.1.4 et V2.1.8 supprimées |
| `ADR0203` | `V4.1` | `V8.2.1`/`V8.3.1` — V4.1.1→8.3.1, V4.1.3→8.2.1, V4.1.2 supprimée (couverte par 8.2.1), V4.1.5→16.5.3 |
| `ADR0204` | `V2.1.7/V2.1.9` | `V6.2.4` + `V6.2.10`/`V6.2.12` (éclats de V2.1.7) + `V6.2.5` (V2.1.9) |
| `ADR0207` | `V4.1/V4.2` | `V8.2.1`/`V8.2.2`/`V8.3.1` — V4.1.5→16.5.3, V4.2.2→3.5.1, V4.1.2 supprimée |
| `ADR0703` | `V2.10 (secrets côté client)` | `V13.3.1` + `V7.2.2` (jetons dynamiques, jamais de secret statique) + `V10` (OAuth et OIDC) |
| `CTL-D03-02` | `V2.10` | `V13.3.1` + `V13.2.1`/`V13.2.3` |
| `CTL-D03-09` | `V2.10/V3` | `V13.3.1` (ex-V2.10) + `V7.2.2` (ex-V3.5.2) + `V10` |

### 6.2 Classe C — citations fausses dans les *deux* versions (4) : corrigées **et signalées**

Ce ne sont pas des renumérotations : ces citations n'ont **jamais** porté leur sujet. Chaque
ADR porteur reçoit, dans son corps (`## More Information`, FR **et** EN), une note qui dit
explicitement que la citation d'origine était **erronée** — sans quoi la correction se lirait
comme une simple renumérotation et l'erreur de fond se perdrait.

| Emplacement | Avant | Après | Pourquoi la citation d'origine était fausse |
|---|---|---|---|
| `ADR0303` | `V13` | `V12` (communication sécurisée) | Le chiffrement en transit relevait de 4.0.3 **V9 Communication** → 5.0.0 V12 (9.1.1→12.2.1, 9.1.3→12.1.1, 9.2.2→12.3.1…). V13 = *API and Web Service* en 4.0.3, *Configuration* en 5.0.0 |
| `ADR0305` | `V13` | `V1.2` + `V2.2` + `V2.4` | Le filtrage des attaques applicatives n'est ni *API and Web Service* ni *Configuration* ; cibles réelles de 4.0.3 V5, scindé entre V1 et V2 |
| `ADR0706` | `V13 (limitation de débit)` | `V2.4.1` (anti-automatisation) | La parenthèse était une **glose thématique**, jamais un titre de chapitre. Rate limiting = 4.0.3 **V11.1.4** (*Business Logic*) → `v4.0.3-11.1.4: MOVED TO v5.0.0-2.4.1` |
| `CTL-D02-04` | `V13 (API et services Web)` | `V2.4.1` | Même cas ; note portée par son ADR source `ADR0301` |

### 6.3 Classe A — mésnumérotation prouvée par le libellé (6) : 6/6 traitées

Trois l'avaient été le matin du 2026-08-14 (`ADR0701` V13→**V4**, `ADR0702` V12→**V5**,
`CTL-D02-05` V3→**V7**). Les trois restantes le sont ici, chacune selon sa nature :

| Emplacement | Avant | Après | Nature |
|---|---|---|---|
| `CTL-D02-02` | `V5 (Validation, Sanitization, Encoding)` | `V2.2` (validation des entrées) + `V1.3` (assainissement) | 4.0.3 V5 **se scinde** : V5.1→V2.2, V5.2/V5.3→V1.3/V1.2 → citer **les deux** |
| `CTL-D02-06` | `V14 (Configuration)` | `V3.4` (*Browser Security Mechanism Headers*) | Le titre *Configuration* survit (4.0.3 V14 → 5.0.0 V13) mais les **en-têtes HTTP l'ont quitté** : 14.4.3→3.4.3 (CSP), 14.4.5→3.4.1 (HSTS), 14.4.4→3.4.4, 14.4.6→3.4.5 |
| `CTL-D02-01` | `V1 (Architecture, conception, threat modeling)` | **citation supprimée** | Voir §6.4 |

### 6.4 Le cas `CTL-D02-01` — pourquoi la citation disparaît plutôt que de se déplacer

4.0.3 **V1 n'a aucun successeur** en 5.0.0 : ses exigences de processus (V1.1.1-V1.1.4,
V1.1.7, V1.10.1, V1.11.1, V1.14.1/2/4) sont marquées `DELETED, NOT IN SCOPE` — ASVS 5.0.0 a
délibérément sorti le SDLC et la modélisation de menaces de son périmètre. Le reste de V1 se
disperse (V1.6→V11, V1.8→V14, V1.9→V12, V1.7→V16…) sans qu'aucune destination ne porte le
sujet du contrôle. Or **ce contrôle exige une cartographie de l'OWASP Top 10** — qui n'a
jamais été une exigence ASVS, dans aucune version. Pointer vers un chapitre 5.0.0 fabriquerait
une référence *crédible et fausse*. La citation est donc **retirée** ; le contrôle conserve
`OWASP Top 10 2021 — A01 à A10`, qui est son référentiel réel. Effet mesurable : 10 → **9**
contrôles porteurs d'une citation ASVS.

### 6.5 Hors classe — les 4 numéros nus, vérifiés un par un

Quatre citations n'ont **aucun libellé** : elles ne se trahissent pas d'elles-mêmes et
devaient être confrontées au sujet réel de leur contrôle ou de leur ADR. **Aucune des quatre
n'était déjà juste en 5.0.0.**

| Emplacement | Avant | Sujet réel | Après |
|---|---|---|---|
| `ADR0301` | `V13` | Point de contrôle unique d'exposition ; contrôle dérivé = limitation de débit | `V4.1` (*Generic Web Service Security*) + `V2.4.1` (anti-automatisation) |
| `CTL-D01-12` | `V13` | Aucun échange inter-applicatif ne contourne le tiers de confiance (passerelle d'API) | `V4` (API et services web) — aligné sur son ADR source `ADR0701` |
| `CTL-D03-05` | `V4` | RBAC documenté + revue d'accès semestrielle | `V8.2.1`/`V8.3.1` — en 5.0.0, V4 = *API and Web Service*, l'autorisation est en **V8** |
| `CTL-D06-02` | `V13` | Quotas et seuils de débit sur les dépendances externes | `V2.4.1` — aligné sur son ADR source `ADR0706` |

### 6.6 Décompte final et preuves

| | Citations distinctes | Emplacements (FR + miroir EN) |
|---|---|---|
| Avant (2026-08-14, matin) | 22 | 44 |
| Corrigées le matin (classe A partielle) | 3 | 6 |
| **Réécrites par ce passage** | **18** | **36** |
| **Supprimées** (`CTL-D02-01`) | **1** | **2** |
| **Restant en numérotation 4.0.x** | **0** | **0** |
| État final du corpus | 21 | 42 |

**Miroirs FR/EN** : chaque correction est portée à l'identique dans `core/adr/` **et**
`core/adr-en/`, `core/controls/D0x.json` **et** `core/controls-en/D0x.json` — vérifié par
comparaison exhaustive des 175 contrôles (`standards[]` identiques champ à champ, la
localisation ne portant pas sur ce champ). Divergence FR/EN résiduelle : **aucune**.

**Preuves exécutées le 2026-08-14** : `lint-agnostic` 0 finding · `node --test
tests/oracles/*.test.mjs` 55/55 · golden buckets 9/9 · `verifier-rapport` rapport diffusable
(18 dimensions) · `assemble-core` **les deux packs émis** (175 FR + 175 EN) · `merge-packs`
175 contraintes fusionnées.

## 7. Ce que ce document n'est pas

- **Pas une table officielle.** OWASP ne publie pas de correspondance de chapitre à chapitre.
  Le §3 est une lecture dérivée d'un fichier de correspondance **par exigence**, et le §2 est
  seul à être directement attesté.
- **Pas une mesure de conformité.** Rien ici ne dit qu'une exigence ASVS est tenue. Une
  citation juste rend la traçabilité *suivable* ; elle ne prouve rien de la conformité.
- **Pas une revue de pertinence exhaustive.** Le §6 corrige la **cible** de chaque citation
  existante. Il ne réexamine pas si chaque ADR *devait* citer l'ASVS, ni n'ajoute les
  citations manquantes — c'est l'objet des trous n°1 et n°2 de `MAPPING-CONTROLES-ASVS.md`.
- **Une incohérence de source signalée** : `0x05-For-Users-Of-4.0.md` annonce « 286
  exigences » en introduction et « 278 » plus loin ; `mapping_v4.0.3_to_v5.0.0.yml` en
  contient 278. Le décompte 286 n'a pu être réconcilié — les comptages du §3 reposent sur les
  278 entrées effectivement présentes.
