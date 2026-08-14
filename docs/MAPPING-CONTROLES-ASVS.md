# MAPPING — contrôles/ADR AuditCore ↔ exigences OWASP ASVS ↔ oracle qui les prouve

> **Date du document : 2026-08-14.** Établi sur le core **v1.7.0** (175 contrôles, 75 ADR)
> et sur le sous-ensemble ASVS curé **v0.1.0** de la forge de sécurité web (challenge
> 2026-08-12). À rejouer à chaque revue `GOUVERNANCE-STANDARDS.md` (prochaine : 2027-01)
> et à toute évolution du sous-ensemble curé.

## 1. Problème résolu

La gouvernance et l'exécution citaient jusqu'ici des référentiels **disjoints** :

- côté **gouvernance**, les ADR déclarent des `standards[]` (NIST SSDF, ISO/IEC 27002,
  OWASP SAMM, ASVS…) et des `derived_controls[]` — mais aucun ADR ne dit *quel contrôle
  automatisé prouve sa décision* ;
- côté **exécution**, l'oracle d'exposition (11 règles `EX-1..EX-11`) et l'oracle de
  composition logicielle (`SCA-NPM`, `SCA-PIP`) rendent des verdicts **par identifiant
  ASVS** — mais aucun verdict ne dit *quel contrôle d'audit il sert*.

Conséquence mesurable : la conformité se **déclare deux fois** et se **prouve zéro**. Ce
document est la table de rattachement manquante — dans les deux sens, **trous compris**.

Il **n'ajoute aucun contrôle, ne modifie aucun ADR, ne touche aucune CI**. C'est un
document de rattachement : il constate, il ne décide pas.

## 2. Périmètre, méthode et sources

**Périmètre de la colonne « contrôle »** : les **22 contrôles** des dimensions **D02
(Sécurité applicative, 13)** et **D03 (IAM & gestion des secrets, 9)**, et les ADR qui les
sourcent. Exclus **explicitement** (et non par omission) : `D04` (conformité réglementaire
& IA), `D17` (gouvernance IA), `D10` (observabilité) et les dimensions non-sécurité —
l'ASVS est un standard de vérification **applicative**, il n'a rien à dire du RGPD, de
l'AI Act ni de la gouvernance d'entreprise ; les confronter produirait des « trous »
faussement alarmants. Deux contrôles hors D02/D03 sont néanmoins cités là où ils portent
la matière (`CTL-D01-13`, `CTL-D10-09`).

**Périmètre de la colonne « ASVS »** : les **37 exigences de niveau L1** du sous-ensemble
curé par la forge de sécurité web — et **elles seules**. Les chapitres ASVS 5.0.0 non
curés en v0 (V2 Validation and Business Logic, V4 API and Web Service, V5 File Handling,
V7 Session Management, V8 Authorization, V9 Self-contained Tokens, V10 OAuth and OIDC,
V11 Cryptography, V16 Security Logging and Error Handling, V17 WebRTC) sont **hors de
portée de ce mapping** : un contrôle qui ne trouve pas d'ancrage parce que son chapitre
n'est pas curé est signalé comme tel au §5, avec le chapitre en cause nommé.

> **Note de comptage.** Le sous-ensemble curé annonce « 32 exigences L1 » dans les
> échanges amont ; le décompte réel des lignes de ses tableaux est de **37**
> (V1 : 8 · V3 : 8 · V6 : 13 · V12 : 3 · V13 : 1 · V14 : 2 · V15 : 2). Ce document
> retient **37** — vérifiable par la commande de l'annexe A.1. Écart à arbitrer côté
> forge de sécurité web (le chiffre « 32 » y est peut-être antérieur à un élargissement).

**Colonne « oracle »** — trois valeurs seulement, jamais inventées :
`oracle-exposition` (règle `EX-n` nommée) · `oracle-sca` (règle `SCA-n` nommée) ·
**« aucun oracle — revue humaine »**. Aucune ligne ne prétend à une automatisation qui
n'existe pas aujourd'hui.

**Licence et citation.** Le contenu de l'OWASP ASVS est publié sous **CC BY-SA 4.0** par
l'OWASP Foundation. Ce document **ne recopie aucun texte du standard** : il cite des
**identifiants** (`Vx.y.z`) et en donne un **résumé d'une ligne rédigé ici**, en français.
Pour le libellé normatif, se référer au texte source.

**Sources**

| # | Source | Version / date | Rôle ici |
|---|---|---|---|
| S1 | OWASP Application Security Verification Standard (ASVS) | **5.0.0**, publié **2025-05**, CC BY-SA 4.0 | Référentiel d'exigences cité par identifiant |
| S2 | Sous-ensemble curé L1 de la forge de sécurité web (`referentiels/asvs-l1.md`) | v0.1.0, challenge **2026-08-12** | Détermine **quelles** exigences ASVS sont dans le périmètre + la colonne « Vérification » |
| S3 | Core AuditCore — `core/controls/controls-core-v1.json` | pack `core-v1`, **175 contrôles** (v1.7.0) | Contrôles `CTL-Dxx-nn`, leur `adr_source` et leurs `standards[]` |
| S4 | Core AuditCore — `core/adr/**` | **75 ADR** (10 domaines) | Décisions, `derived_controls[]`, `standards[]` |
| S5 | Oracles de la forge de sécurité web (`oracle-exposition.mjs`, `oracle-sca.mjs`) | règles `EX-1..EX-11`, `SCA-NPM`/`SCA-PIP`/`SCA-SKIP` | Colonne « oracle qui le prouve » |

ADR cités nommément dans ce document : ADR0201, ADR0202, ADR0203, ADR0204, ADR0205,
ADR0206, ADR0207, ADR0208, ADR0209, ADR0210, ADR0211, ADR0212, ADR0213, ADR0301, ADR0302,
ADR0303, ADR0304, ADR0305, ADR0306, ADR0402, ADR0505, ADR0702, ADR0703, ADR0706.

## 3. Table A — rattachements avérés (19)

Une ligne = un rattachement : **contrôle (et son ADR source) ↔ exigence ASVS ↔ oracle**.

| # | Contrôle | ADR source | Exigence ASVS | Résumé de l'exigence (une ligne, rédigée ici) | Oracle qui le prouve |
|---|---|---|---|---|---|
| A01 | CTL-D02-02 | ADR0305 | V1.3.1 | Le HTML d'origine non fiable passe par une bibliothèque d'assainissement reconnue | aucun oracle — revue humaine |
| A02 | CTL-D02-02 | ADR0305 | V1.3.2 | L'exécution de code construit dynamiquement est évitée, l'entrée assainie si elle est inévitable | aucun oracle — revue humaine |
| A03 | CTL-D02-02 | ADR0305 | V1.5.1 | Les parseurs XML refusent les entités externes (surface XXE fermée) | aucun oracle — revue humaine |
| A04 | CTL-D02-03 | ADR0209 | **V15.2.1** | Aucun composant tiers en production ne dépasse le délai de remédiation documenté | **`oracle-sca` — `SCA-NPM`, `SCA-PIP`** |
| A05 | CTL-D02-03 | ADR0209 | V15.1.1 | Des délais de remédiation des composants tiers vulnérables sont écrits | aucun oracle — revue humaine (politique ; alimente `oracle-sca --seuils`) |
| A06 | CTL-D02-04 | ADR0301 | V6.1.1 | Les défenses anti-force-brute / anti-automatisation de l'authentification sont documentées | aucun oracle — revue humaine (rattachement **partiel** : le contrôle vise tout point d'entrée, l'exigence vise l'authentification) |
| A07 | CTL-D02-04 | ADR0301 | V6.3.1 | Ces défenses sont effectivement appliquées, conformément à ce qui est documenté | aucun oracle — revue humaine (partiel, même motif qu'A06) |
| A08 | CTL-D02-05 | ADR0204 | **V3.3.1** | Les cookies portent l'attribut `Secure` (et le préfixe de nom adéquat) | **`oracle-exposition` — `EX-8`** |
| A09 | CTL-D02-05 | ADR0204 | V3.5.1 | Les requêtes inter-origines vers des fonctions sensibles sont validées (jeton anti-CSRF ou en-tête non trivial) | aucun oracle — revue humaine |
| A10 | CTL-D02-05 | ADR0204 | V3.5.2 | Si la défense CSRF repose sur le préflight, aucun appel sensible ne peut l'éviter | aucun oracle — revue humaine |
| A11 | CTL-D02-05 | ADR0204 | V3.5.3 | Les fonctions sensibles ne sont atteignables que par des méthodes HTTP non « sûres » | aucun oracle — revue humaine |
| A12 | CTL-D02-05 | ADR0204 | V14.3.1 | Les données authentifiées sont purgées du stockage côté navigateur en fin de session | aucun oracle — revue humaine (rattachement partiel, volet « expiration bornée » du contrôle) |
| A13 | CTL-D02-06 | ADR0303 | **V3.4.1** | `Strict-Transport-Security` est présent, d'une durée d'au moins un an, sur les réponses HTTPS | **`oracle-exposition` — `EX-3`** |
| A14 | CTL-D02-06 | ADR0303 | V12.2.1 | Toute connectivité externe passe par TLS, sans repli en clair | **`oracle-exposition` — `EX-3` (partiel)** : juge l'URL observée et HSTS, **jamais la négociation TLS elle-même** |
| A15 | CTL-D02-10 | ADR0302 | V6.3.2 | Les comptes livrés par défaut sont absents ou désactivés | aucun oracle — revue humaine |
| A16 | CTL-D02-10 | ADR0302 | V13.4.1 | Les répertoires de gestion de version ne sont pas servis par l'application exposée | aucun oracle — revue humaine (candidat outillage v1 côté forge de sécurité web) |
| A17 | CTL-D02-12 | ADR0211 | V15.1.1 | Des délais de remédiation sont écrits (volet socle d'exécution) | aucun oracle — revue humaine (politique) |
| A18 | CTL-D02-12 | ADR0211 | **V15.2.1** | Aucun composant hors délai de remédiation | **`oracle-sca` (partiel)** : couvre les dépendances applicatives déclarées, **pas** le socle d'exécution (système, image de base) que vise pourtant le contrôle |
| A19 | CTL-D03-09 | ADR0703 | V14.3.1 | Les données authentifiées sont purgées du stockage côté client en fin de session | aucun oracle — revue humaine |

**Lecture.** 19 rattachements, dont **5 seulement portent une preuve outillée** (A04, A08,
A13, A14, A18) — et **2 de ces 5 sont explicitement partiels** (A14 : la négociation TLS
n'est pas jugée ; A18 : le socle d'exécution n'est pas scanné). Les **14 autres** reposent
sur une revue humaine. Ramené aux exigences : **4 exigences ASVS curées distinctes** sur 37
(V3.3.1, V3.4.1, V12.2.1, V15.2.1) sont adossées à un oracle exécuté. C'est le taux réel
d'automatisation de la conformité applicative aujourd'hui — mesuré, jamais objectivé.

## 4. Table B — règles d'oracle rattachées à un contrôle, hors L1 curé (9)

Ces règles d'oracle **s'exécutent déjà** et servent un contrôle du corpus, mais l'exigence
ASVS correspondante est classée **L2/L3** par la forge de sécurité web, donc **hors** du
sous-ensemble L1 curé. Sans cette table, ces neuf verdicts ne sauraient toujours pas quel
contrôle ils servent — c'est exactement la moitié du problème posé au §1.

| # | Règle d'oracle | Ce qu'elle constate | Contrôle servi | ADR source | Ancrage ASVS |
|---|---|---|---|---|---|
| B01 | `EX-1` | Content-Security-Policy absente | CTL-D02-06 | ADR0303 | L2/L3 (hors L1 curé) |
| B02 | `EX-2` | CSP présente mais trivialement permissive | CTL-D02-06 | ADR0303 | L2/L3 (hors L1 curé) |
| B03 | `EX-4` | `X-Content-Type-Options` absent ou non `nosniff` | CTL-D02-06 | ADR0303 | L2/L3 (hors L1 curé) |
| B04 | `EX-5` | Aucune protection anti-clickjacking | CTL-D02-06 | ADR0303 | L2/L3 (hors L1 curé) |
| B05 | `EX-6` | `Referrer-Policy` absente ou en fuite complète | CTL-D02-06 | ADR0303 | L2/L3 (hors L1 curé) — atténue par ailleurs V14.2.1, non réclamée (§6) |
| B06 | `EX-7` | `Permissions-Policy` absente | CTL-D02-06 | ADR0303 | L2/L3 (hors L1 curé) |
| B07 | `EX-9` | Cookie sans `HttpOnly` | CTL-D02-05 | ADR0204 | L2/L3 (hors L1 curé) |
| B08 | `EX-10` | Cookie sans `SameSite` explicite | CTL-D02-05 | ADR0204 | L2/L3 (hors L1 curé) — mécanisme adjacent de V3.5.1/V3.5.2 |
| B09 | `EX-11` | Fuite de version serveur via en-tête | CTL-D02-10 | ADR0302 | L2/L3 (hors L1 curé) |

**Bilan de couverture des oracles** : les **11 règles `EX-1..EX-11`** sont désormais toutes
rattachées à un contrôle (`EX-3`/`EX-8` en table A ; les 9 autres en table B). Les règles
`SCA-NPM`/`SCA-PIP` sont rattachées en A04/A18. La règle `SCA-SKIP` n'est pas un verdict de
conformité mais un **constat d'indisponibilité d'outillage** : elle ne se rattache à aucun
contrôle et doit être lue comme « non mesuré », jamais comme « conforme ».

## 5. TROU N°1 — contrôles/ADR sécurité qu'aucune exigence ASVS curée ne touche (14 + 12)

### 5.1 Contrôles D02/D03 sans aucun ancrage (14 sur 22)

| Contrôle | ADR source | Motif — pourquoi aucune exigence curée ne le touche |
|---|---|---|
| CTL-D02-01 | ADR0505 | Méta-contrôle : exige une cartographie des dix catégories de l'OWASP Top 10. Le Top 10 **n'est pas** un chapitre ASVS. Nuance importante : par sa catégorie « Injection », ce contrôle **revendique indirectement** V1.2.1-V1.2.5, qu'aucun contrôle ne réclame explicitement (cf. §6). |
| CTL-D02-07 | ADR0206 | Redaction des données sensibles avant journalisation → chapitre **V16 (Security Logging and Error Handling)**, **non curé** en v0. |
| CTL-D02-08 | ADR0505 | SAST + DAST bloquants en intégration continue. L'ASVS prescrit des **propriétés vérifiables**, pas un outillage ; et le volet DAST est explicitement hors v0 de la forge de sécurité web. |
| **CTL-D02-09** | **ADR0208** | **Modèle de menaces formalisé avant exposition.** Le seul chapitre curé de V15 porte les dépendances (V15.1.1/V15.2.1) ; l'analyse de menaces n'a **aucun ancrage curé**. ADR0208 exige donc une analyse qu'aucun oracle ni aucune exigence curée ne vient confirmer — c'est le **trou le plus structurant** de ce mapping : une décision invariante du corpus, sans contrepartie exécutable. |
| CTL-D02-11 | ADR0306 | Egress refusé par défaut + DNS gouverné → périmètre **réseau/infrastructure**, hors du remit applicatif de l'ASVS. Trou attendu, déclaré pour ne pas se taire. |
| CTL-D02-13 | ADR0212 | Programme de sécurité gouverné (responsabilités, sensibilisation, métriques) → relève d'OWASP **SAMM** (fonction Governance), pas de l'ASVS. |
| CTL-D03-01 | ADR0202 | Fournisseur d'identité central + MFA. Le sous-ensemble V6 curé ne couvre **que les mots de passe** (V6.2.x) et l'anti-automatisation (V6.1.1/V6.3.1) ; MFA et fédération ne sont pas curés. |
| CTL-D03-02 | ADR0201 | Aucun secret dans le code, l'historique ou les artefacts. Aucune exigence curée. V13.4.1 (répertoire de gestion de version non servi) traite la **conséquence** — l'exposition — pas la **cause** — le secret versionné. |
| CTL-D03-03 | ADR0201 | Coffre-fort central, rotation ≤ 90 jours, journal d'accès. Aucune exigence curée (gestion de secrets serveur). |
| CTL-D03-04 | ADR0201 | Authentification applicative par identité d'exécution. Aucune exigence curée. |
| CTL-D03-05 | ADR0207 | RBAC documenté + revue d'accès semestrielle → chapitre **V8 (Authorization)**, **non curé**. |
| CTL-D03-06 | ADR0205 | Comptes techniques dédiés, non partagés, à privilège minimal. Aucune exigence curée (V6.3.2 vise les comptes livrés par défaut du produit, pas les comptes de service). |
| CTL-D03-07 | ADR0203 | Accès externes par identités fédérées invitées → chapitre **V10 (OAuth and OIDC)**, **non curé**. |
| CTL-D03-08 | ADR0402 | Journalisation inviolable des opérations sensibles → chapitre **V16**, **non curé**. |

### 5.2 ADR des domaines sécurité (02, 03) sans aucun rattachement ASVS curé (12 sur 19)

`ADR0201` (secrets centralisés) · `ADR0202` (IdP central + MFA) · `ADR0203` (accès externes
fédérés) · `ADR0205` (comptes techniques dédiés) · `ADR0206` (classification et protection
des données personnelles) · **`ADR0208` (analyse de menaces avant exposition)** ·
`ADR0210` (réponse à incident de sécurité) · `ADR0212` (gouvernance et culture sécurité) ·
`ADR0213` (notification des violations de données) · `ADR0304` (connectivité privée aux
services de données) · `ADR0306` (sortie réseau contrôlée) · `ADR0207` (RBAC et revue
périodique des accès).

Les 7 ADR des domaines 02/03 **effectivement rattachés** sont : `ADR0204`, `ADR0209`,
`ADR0211`, `ADR0301`, `ADR0302`, `ADR0303`, `ADR0305` (+ `ADR0703`, domaine 07).

**Lecture honnête de ce trou.** Il ne se lit pas « le corpus est en défaut ». Trois causes
distinctes s'y mêlent, et les confondre serait une faute d'analyse :
1. **Hors remit ASVS** (ADR0210, ADR0212, ADR0213, ADR0304, ADR0306) — l'ASVS ne prétend
   pas couvrir la réponse à incident, la gouvernance ni le réseau ;
2. **Chapitre ASVS non curé en v0** (ADR0202/0203/0207 → V6 étendu/V8/V10 ; ADR0206 → V16)
   — le trou se referme en **élargissant la curation**, pas en écrivant un contrôle ;
3. **Vrai trou de preuve** (ADR0201, **ADR0208**) — sujet dans le remit applicatif, non
   couvert par la curation, non outillé. **ADR0208 est le cas nommé par ce mandat.**

## 6. TROU N°2 — exigences ASVS curées qu'aucun contrôle du corpus ne réclame (21 sur 37)

| Exigence | Résumé (une ligne, rédigée ici) | Constat |
|---|---|---|
| V1.2.1 | Encodage de sortie adapté au contexte de rendu | Aucun contrôle ne l'exige. CTL-D02-02 impose de **valider et assainir l'entrée** — jamais d'**encoder la sortie**. Revendiqué indirectement par CTL-D02-01 (catégorie « Injection »), jamais explicitement requis. |
| V1.2.2 | Encodage des URL construites dynamiquement, protocoles dangereux interdits | Idem — aucun contrôle. |
| V1.2.3 | Échappement des contenus JS/JSON construits dynamiquement | Idem — aucun contrôle. |
| V1.2.4 | Requêtes paramétrées ou ORM contre l'injection dans les moteurs de requête | **Aucun contrôle du corpus n'exige les requêtes paramétrées.** Défense la plus élémentaire contre l'injection, absente du référentiel en tant qu'exigence propre. |
| V1.2.5 | Appels système protégés contre l'injection de commandes | Idem — aucun contrôle. |
| V3.2.1 | Le contenu servi n'est pas interprété hors de son contexte prévu (fichier téléversé exécuté) | Aucun contrôle. CTL-D01-13/ADR0702 borne le **canal** d'échange de fichiers, jamais l'**exécution** du contenu servi. |
| V3.2.2 | Le texte est rendu par des fonctions sûres, jamais injecté comme balisage | Aucun contrôle — le corpus n'a aucune exigence de codage côté navigateur. |
| V3.4.2 | En-tête d'origine autorisée figé ou validé contre une liste blanche | Aucun contrôle. CTL-D02-06 énumère quatre familles d'en-têtes de sécurité ; la politique inter-origines n'en fait pas partie. Aucune règle `EX-n` ne la juge non plus. |
| V6.2.1 | Longueur minimale du mot de passe utilisateur | **Aucun contrôle.** Voir l'anomalie ci-dessous. |
| V6.2.2 | L'utilisateur peut changer son mot de passe | Aucun contrôle. |
| V6.2.3 | Le changement de mot de passe exige l'ancien et le nouveau | Aucun contrôle. |
| V6.2.4 | Le mot de passe est confronté à une liste de mots de passe très fréquents | Aucun contrôle. |
| V6.2.5 | Aucune règle de composition imposée | Aucun contrôle. |
| V6.2.6 | Le champ de saisie du mot de passe est masqué | Aucun contrôle. |
| V6.2.7 | Le collage et les gestionnaires de mots de passe restent autorisés | Aucun contrôle. |
| V6.2.8 | Le mot de passe est vérifié tel que reçu, sans troncature ni normalisation de casse | Aucun contrôle. |
| V6.4.1 | Les secrets générés par le système sont aléatoires, expirants, jamais définitifs | Aucun contrôle. |
| V6.4.2 | Ni indice de mot de passe ni question secrète | Aucun contrôle. |
| V12.1.1 | Seules les versions récentes du protocole de transport sont activées | Aucun contrôle. ADR0303 (chiffrement en transit) dérive `CTL-D02-06`, qui ne juge **que les en-têtes HTTP** — jamais la version négociée. |
| V12.2.2 | Les certificats externes proviennent d'une autorité publiquement reconnue | Aucun contrôle — même angle mort qu'au-dessus. |
| V14.2.1 | Aucune donnée sensible transmise par l'URL ou la chaîne de requête | Aucun contrôle. CTL-D02-07/CTL-D10-09 traitent la fuite **vers les journaux**, jamais **par l'URL**. `EX-6` (Referrer-Policy) atténue une conséquence, ne prouve pas l'exigence. |

### 6.1 Anomalie structurelle révélée par ce trou — ADR0204

Les **10 exigences V6.2.1-V6.2.8, V6.4.1 et V6.4.2** ne sont réclamées par aucun contrôle
alors que le corpus porte un ADR dédié : **ADR0204 « Politique de mots de passe et de
comptes alignée sur l'état de l'art »**. Cause vérifiée dans le frontmatter :

```
ADR0204 → derived_controls: [CTL-D02-05]
CTL-D02-05 → « Les sessions applicatives sont protégées contre le vol et le rejeu […] CSRF »
```

L'unique contrôle dérivé d'ADR0204 porte sur les **sessions et le CSRF**, pas sur la
**politique de mots de passe** que l'ADR décide. **Le corpus décide une politique de mots
de passe et n'en contrôle aucune clause.** Même schéma, un cran plus bas, pour ADR0303
(chiffrement en transit → CTL-D02-06, qui ne juge que des en-têtes HTTP : V12.1.1 et
V12.2.2 restent sans contrôle).

**Hors périmètre de ce document** (aucun contrôle n'est ajouté ici). À porter comme item
d'extension du corpus, conformément à `EXTENSION-CORPUS.md` §3-4.

## 7. Défaut de citation détecté dans les `standards[]` du corpus — **corrigé le 2026-08-14**

> **État au 2026-08-14 : CORRIGÉ.** Le constat ci-dessous a été établi pendant l'établissement
> du mapping, puis confirmé sur le texte publié (TF-0205), puis **instruit et appliqué**
> (TF-0221). Décision humaine du 2026-08-14, déléguée au pilot : **le corpus migre vers ASVS
> 5.0.0** — motif au §7 bis. Les **22 citations** distinctes (44 emplacements avec les miroirs
> EN) sont **toutes traitées** : 21 réécrites vers leur cible 5.0.0 réelle, 1 supprimée
> (`CTL-D02-01`, 4.0.3 V1 sans successeur). **Aucune citation ne reste en numérotation 4.0.x**
> — décompte, table avant/après par classe et preuves dans
> **`docs/CORRESPONDANCE-ASVS-4.0.x-5.0.0.md` §6**.
>
> Le tableau et l'ampleur ci-dessous décrivent l'**état d'origine** : ils sont conservés parce
> qu'ils sont la pièce qui rend la correction vérifiable.

Constat de forme, relevé pendant l'établissement du mapping (le périmètre de *ce* document
excluait toute modification d'ADR ou de contrôle ; la correction a été portée ailleurs) :

**Les citations `OWASP ASVS 5.0 — Vxx` du corpus employaient la numérotation de chapitres
d'ASVS 4.0.x, pas celle d'ASVS 5.0.0.** Les libellés accolés aux numéros le démontrent, en
les confrontant à la structure 5.0.0 attestée par le sous-ensemble curé (S2) :

| Cité par le corpus | Chapitre réellement porteur de ce libellé | Ce que le numéro cité désigne en **5.0.0** |
|---|---|---|
| `V1 (Architecture, conception, threat modeling)` | ASVS 4.0.x — V1 | V1 = Encoding and Sanitization |
| `V2.1/V2.2/V2.10 (authentification, secrets)` | ASVS 4.0.x — V2 Authentication | V2 = Validation and Business Logic |
| `V3 (Session Management)` | ASVS 4.0.x — V3 | V3 = Web Frontend Security (Session Management = **V7**) |
| `V4/V4.1/V4.2 (contrôle d'accès)` | ASVS 4.0.x — V4 Access Control | V4 = API and Web Service (Authorization = **V8**) |
| `V5 (Validation, Sanitization, Encoding)` | ASVS 4.0.x — V5 | V5 = File Handling |
| `V12 (fichiers et ressources)` | ASVS 4.0.x — V12 Files and Resources | V12 = Secure Communication (File Handling = **V5**) |
| `V13 (API et services Web)` | ASVS 4.0.x — V13 | V13 = Configuration (API and Web Service = **V4**) |
| `V14 (Configuration)` | ASVS 4.0.x — V14 | V14 = Data Protection (Configuration = **V13**) |

**Ampleur mesurée à l'origine** (commandes en annexe A.2) : **12 ADR** (miroir anglais :
12 de plus), **10 contrôles** du pack FR (10 de plus dans le pack EN), plus les occurrences
propagées dans les artefacts générés et le CHANGELOG. ADR concernés : ADR0201, ADR0202,
ADR0203, ADR0204, ADR0207, ADR0301, ADR0303, ADR0305, ADR0701, ADR0702, ADR0703, ADR0706.

**Conséquence** (avant correction) : un lecteur qui suivait une citation `ASVS 5.0 — V13`
depuis ADR0303 atterrissait sur le chapitre **Configuration** et n'y trouvait pas le
chiffrement en transit qu'il cherchait. La traçabilité gouvernance → standard était **rompue
en apparence tout en étant déclarée**. C'était le même défaut de fond que celui traité par ce
mapping, une couche plus haut.

~~**Réserve de méthode** : ce constat est établi par recoupement de pièces internes
(libellés du corpus × structure 5.0.0 attestée par S2), sans accès au texte publié des
deux versions. À confirmer sur le texte source avant toute correction de masse.~~

**Réserve levée le 2026-08-14 (TF-0205) — constat CONFIRMÉ.** Les huit lignes du tableau
ci-dessus ont été vérifiées contre le texte publié des deux versions (dépôt officiel
`OWASP/ASVS`, tags `v4.0.3` et `v5.0.0` : noms de fichiers, titres H1 et exports JSON
officiels). Les huit sont exactes. Voir **`docs/CORRESPONDANCE-ASVS-4.0.x-5.0.0.md`** :
sources, structures complètes (4.0.3 = **14** chapitres, 5.0.0 = **17**), correspondance
dérivée chapitre par chapitre, inventaire des **44** emplacements, et les trois classes de
citations qui interdisent une correction de masse mécanique.

## 7 bis. Décision et correction appliquée (2026-08-14, TF-0221)

**Décision humaine du 2026-08-14, déléguée au pilot : le corpus MIGRE vers ASVS 5.0.0.**
L'option « rétablir `ASVS 4.0.3` » est **écartée**.

**Motif à retenir** : l'exécution juge **déjà** sur 5.0.0 — le référentiel curé de la forge de
sécurité web (source S2, `referentiels/asvs-l1.md`) est un sous-ensemble **L1 d'ASVS 5.0.0**.
Revenir à 4.0.3 rendrait les citations de gouvernance vraies d'un coup, mais ferait citer à la
gouvernance **une version que personne n'applique** — et le mapping gouvernance↔exécution
construit par le présent document deviendrait **inter-versions**, ce qui en ruinerait l'usage.
La migration aligne les deux bouts de la chaîne sur une version unique.

**Ce qui a été fait** (détail par classe, table avant/après et preuves :
`docs/CORRESPONDANCE-ASVS-4.0.x-5.0.0.md` §6) :

| Classe | Citations | Traitement |
|---|---|---|
| **A** — mésnumérotation prouvée par le libellé | 6 | 6 corrigées (3 le matin : ADR0701→V4, ADR0702→V5, CTL-D02-05→V7 ; 3 ici : CTL-D02-02→V2.2+V1.3, CTL-D02-06→V3.4, **CTL-D02-01 : citation supprimée**) |
| **B** — sous-section à cibles multiples | 8 | 8 réécrites en **citations multiples**, exigences supprimées/fusionnées nommées |
| **C** — fausse dans les **deux** versions | 4 | 4 corrigées **et signalées comme erronées** dans le corps de l'ADR porteur (FR + EN) |
| **hors classe** — numéro nu sans libellé | 4 | 4 vérifiées une par une contre le sujet réel ; **aucune n'était juste en 5.0.0**, 4 corrigées |
| **Total** | **22** | **21 réécrites · 1 supprimée · 0 laissée en 4.0.x** |

**Incidence sur ce document** : le §3 (table A) et le §6 (trou n°2) citent des exigences
**5.0.0** issues du sous-ensemble curé — ils étaient déjà en 5.0.0 et **restent inchangés**.
Seules les citations `standards[]` du corpus bougeaient. L'annexe A.2 rend désormais **9** (et
non 10) contrôles porteurs d'une citation ASVS : `CTL-D02-01` a perdu la sienne.

À porter à la prochaine revue `GOUVERNANCE-STANDARDS.md` (étape 2 « Delta → impact ») comme
migration de version actée, et non plus comme recommandation ouverte.

## 8. Ce que ce document n'est pas

- **Pas une preuve de conformité.** Un rattachement dit *quel oracle prouverait* une
  exigence, jamais *qu'elle est tenue*. Le verdict reste celui de l'oracle exécuté.
- **Pas une couverture ASVS.** 16 exigences curées sur 37 sont réclamées par un contrôle,
  dont 4 outillées. Sur les 17 chapitres d'ASVS 5.0.0, 7 sont curés et 10 ne le sont pas.
- **Pas une modification du corpus.** Le rattachement établi ici n'ajoute ni contrôle, ni
  ADR, ni CI. L'anomalie du **§6.1** (ADR0204 décide une politique de mots de passe sans en
  contrôler aucune clause) reste **déclarée, non corrigée** — elle demande un contrôle
  nouveau, pas une citation. Celle du **§7** (numérotation 4.0.x) a été **corrigée le
  2026-08-14** par la migration du §7 bis, hors de ce document.
- **Pas figé.** Toute évolution du sous-ensemble curé, du corpus ou des oracles périme les
  décomptes de ce document. Les commandes de l'annexe A permettent de les recalculer.

## Annexe A — commandes de vérification (recalculables, jamais recopiées)

### A.1 Décompte des exigences L1 curées (source S2)

```bash
node -e "const t=require('fs').readFileSync('<forge-websec>/referentiels/asvs-l1.md','utf8');
const ids=[...t.matchAll(/^\|\s*\*{0,2}(V\d+\.\d+\.\d+)\*{0,2}\s*\|/gm)].map(m=>m[1]);
console.log(ids.length, ids.join(' '));"
```

Sortie du 2026-08-14 : `37` — `V1.2.1 … V15.2.1` (V1 : 8 · V3 : 8 · V6 : 13 · V12 : 3 ·
V13 : 1 · V14 : 2 · V15 : 2).

### A.2 Ampleur des citations ASVS dans le corpus (§7)

```bash
grep -rl "ASVS" core/adr/    | wc -l      # → 12 ADR (FR)
grep -rl "ASVS" core/adr-en/ | wc -l      # → 12 ADR (miroir EN)
node -e "const p=require('./core/controls/controls-core-v1.json');
console.log(p.constraints.filter(c=>(c.standards||[]).some(s=>/ASVS/.test(s))).length);"   # → 9 depuis le 2026-08-14 (10 avant : CTL-D02-01 a perdu sa citation, §7 bis)
```

Contrôle de non-régression de la migration (§7 bis) — **doit rendre 0** :

```bash
node -e "const p=require('./core/controls/controls-core-v1.json');
const bad=p.constraints.flatMap(c=>(c.standards||[]).filter(s=>/ASVS/.test(s)))
  .filter(s=>/— V(1|5|14) \(|— V13(?![.0-9])|— V2\.10|— V4\.[12](?![.0-9])|— V4$/.test(s));
console.log(bad.length, bad.join(' | '));"   # → 0
```

Idem côté ADR (frontmatter seul — les notes de correction du §7 bis *citent* les anciens
numéros dans le corps, à dessein) :

```bash
grep -rh "^standards:" core/adr/ core/adr-en/ \
  | grep -oE "OWASP ASVS 5\.0 — V[0-9./]*" | sort | uniq -c   # aucun V13 nu, aucun V2.10, aucun V4.1/V4.2
```

### A.3 Périmètre des contrôles confrontés (§2)

```bash
node -e "const p=require('./core/controls/controls-core-v1.json');
const s=p.constraints.filter(c=>['D02','D03'].includes(c.dimension_audit));
console.log(s.length, s.map(c=>c.id).join(' '));"   # → 22 (13 D02 + 9 D03)
```
