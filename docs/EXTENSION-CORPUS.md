# Extension du corpus AuditCore — analyse de couverture et propositions

> **✅ Implémentation v1.3 (2026-07-12)** : les 12 contrôles du §1 sont créés (150 → 162,
> D01+4, D02+1, D03+1, D05+6), les 2 rattachements appliqués (ADR0805→CTL-D11-05,
> ADR0602→CTL-D16-03), le relabel D05 « Données, qualité & restitution » effectué, le
> renommage « DORA (Accelerate) » propagé (30 occurrences). **Couverture : 65/65 ADRs ont
> ≥ 1 contrôle dérivé — 0 orphelin.** Les 8 ADRs proposés (§3) restent le backlog v1.4.

> Méthode : analyse programmatique de `controls-core-v1.json` (150 contrôles) croisée avec
> la taxonomie [PLAN/03 §2](../../PLAN/03-corpus-adr-generique.md) et lecture intégrale des
> 12 fichiers ADR concernés. Aucun manque n'est déclaré sans vérification préalable dans les
> contrôles existants — deux manques suggérés en exemple (RGPD 44-49, ISO 22301) se sont
> révélés **déjà couverts** et sont documentés comme tels ci-dessous (§2).

**Constat liminaire.** Les 12 ADR sans contrôle dérivé ne sont pas des trous béants : les
12 fichiers portent déjà, dans leur section `Confirmation`, un texte de contrôle entièrement
rédigé (règle, mode, preuve, grille de verdict) référençant des ID (`CTL-Dxx-yy`) qui soit
n'existent pas dans le JSON réel, soit ont été réattribués à une autre ADR lors de la
génération P3 (collision d'identifiants). Le §1 matérialise donc une intention déjà écrite.

## 1. Statut des 12 ADR sans contrôle dérivé (12/12)

| ADR | Statut | Slot proposé | Esquisse de règle |
|---|---|---|---|
| ADR0101 (zonage plateforme/charges) | Contrôle à créer | D01, `CTL-D01-11` | Le zonage plateforme/applicatif est documenté dans la cartographie ; aucune ressource applicative n'est détectée dans le périmètre plateforme. Reprend telle quelle la `Confirmation` de l'ADR (visait `CTL-D01-02/03`, déjà pris par ADR0104/ADR0003). |
| ADR0306 (egress + DNS gouverné) | Contrôle à créer | D02, `CTL-D02-11` | Sortie réseau refusée par défaut, liste explicite de destinations autorisées ; résolution de noms gouvernée et journalisée. Même logique que les autres ADR réseau (0301/0302/0303/0305 → tous dérivés en D02). |
| ADR0701 (échanges inter-app via tiers de confiance) | Contrôle à créer | D01, `CTL-D01-12` | Aucun échange inter-applicatif significatif ne contourne un tiers de confiance contractuel (API, bus d'événements) ; dérogations documentées. Volet sécurité complémentaire (authN/Z par échange) déjà couvert transversalement par D02. |
| ADR0702 (échanges fichiers via service managé) | Contrôle à créer | D01, `CTL-D01-13` | Aucun échange de fichiers ne transite hors du service managé de confiance recensé (pas de partage ad hoc). |
| ADR0703 (clients publics sans secret) | Contrôle à créer | D03, `CTL-D03-09` | Les clients publics (SPA, mobile) ne portent aucun secret statique ; authentification par jetons courts (PKCE/BFF). Distinct de `CTL-D03-02` (secrets absents du code/dépôt) : portée différente (client distribué vs artefact serveur) et mode de vérification différent (inspection client vs scan de dépôt) — pas de rattachement possible en l'état. |
| ADR0707 (obsolescence/retrait API) | Contrôle à créer | D01, `CTL-D01-14` | Chaque version d'API dépréciée porte une échéance de retrait publiée et respectée ; aucune version hors délai ne reste accessible (surface d'attaque non maintenue). L'ADR situe elle-même ce contrôle en D01 (registre) plutôt qu'en D13 (documentation) — confirmé après lecture. |
| ADR0801 (modèle sémantique en étoile) | Contrôle à créer | D05, `CTL-D05-10` | Le modèle sémantique de restitution est documenté et validé par une autorité de modélisation avant exposition ; chaque mesure n'est définie qu'une fois. |
| ADR0802 (source unique couche BI) | Contrôle à créer | D05, `CTL-D05-11` | La couche de restitution s'alimente exclusivement d'une source de vérité gouvernée recensée ; aucune extraction parallèle non recensée. |
| ADR0803 (transformations près de la source) | Contrôle à créer | D05, `CTL-D05-12` | Logique de transformation significative testée/versionnée près de la source, non recréée dans l'outil de restitution. *Rattachement à `CTL-D05-05`/ADR0606 envisagé puis écarté* : ADR0606 gouverne le découpage en couches de raffinement (medallion), ADR0803 gouverne où vit la logique métier de restitution — principes voisins, contrôles distincts. |
| ADR0804 (dimension de temps normalisée) | Contrôle à créer | D05, `CTL-D05-13` | Une dimension de temps partagée et normalisée (calendrier, exercice fiscal) est référencée par tout modèle sémantique exposé. |
| ADR0805 (homogénéité stockage/connexion BI) | Contrôle à créer **+ rattachement** | D05, `CTL-D05-14` | Mode de stockage/connexion choisi et documenté selon un profil de besoin déclaré. **Volet performance perçue** : l'ADR cible elle-même la performance perçue côté utilisateur — rattacher ADR0805 à `CTL-D11-05` (existant, actuellement orphelin, cf. §3) plutôt que dupliquer. |
| ADR0806 (certification des rapports) | Contrôle à créer | D05, `CTL-D05-15` | Chaque rapport publié porte un statut de certification (certifié / exploratoire / déprécié), revu par une autorité nommée et visible par l'utilisateur final. |

**Bilan §1** : 12/12 statués — 11 contrôles à créer, 1 rattachement complémentaire
identifié en prime (ADR0805 → CTL-D11-05), 0 « non auditable en l'état ». D05 passe
de 9 à 15 contrôles (absorbe tout le domaine ADR 08, faute de dimension BI dédiée) : je
recommande un **relabel cosmétique** (autorisé par l'invariant `dimensions.yaml`, pas de
fusion) de D05 en « Données, qualité & restitution » en v1.2.

**Trouvaille annexe (hors périmètre des 12)** : `CTL-D16-03` (alignement des index sur les
requêtes de production) porte aussi un `adr_source` vide, non signalé dans les faits donnés.
Recommandation : rattacher à ADR0602 (autorité de modélisation, déjà D16) — même famille.

## 2. Matrice standards ↔ corpus

| Standard | Clause/chapitre | Couvert par (CTL/ADR ou —) | Manque confirmé ? |
|---|---|---|---|
| ISO/IEC 27002:2022 | 8.8 (gestion des vulnérabilités techniques) | — (CTL-D02-03/ADR0209 ne couvre que le scan des dépendances applicatives *à la construction*) | **Oui** — rien sur le parc runtime/infra en production |
| ISO/IEC 27002:2022 | 5.24-5.28 (cycle de gestion des incidents, preuve) | Partiel — CTL-D12-02/04 (ADR0403,0405,0103,0509) couvrent l'incident opérationnel + post-mortem générique | **Oui** — volet preuve/forensic et notification absent |
| RGPD | art. 44-49 (transferts hors UE) | **CTL-D04-07 / ADR0304** — mécanisme encadré documenté flux par flux | Non — vérifié, déjà couvert (exemple de contrôle donné dans la mission) |
| RGPD | art. 33-34 (notification de violation) | — (0 occurrence de « notification », « violation », « 72 heures » dans les 150 contrôles) | **Oui** |
| ISO 22301:2019 | continuité d'activité | **CTL-D12-07 / ADR0611** — PCA, scénarios de sinistre majeur | Non — vérifié, déjà couvert (idem) |
| CIS Controls v8 | #7 Continuous Vulnerability Mgmt, #17 Incident Response Mgmt | — | **Oui** — corrobore les deux lignes ISO 27002 ci-dessus |
| NIST SSDF | groupe RV (RV.1-RV.3, réponse aux vulnérabilités) | — (seuls PO/PS/PW cités, RV totalement absent) | **Oui** — 3e corroboration indépendante du même manque |
| DAMA-DMBOK2 | Ch.11 Data Warehousing & BI | — | **Oui** — cohérent avec le domaine ADR 08 entier sans contrôle (§1) |
| AI Act | art. 26-27 (obligations du déployeur, analyse d'impact IA) | Partiel — D14 couvre supervision humaine (CTL-D14-08) et monitoring, pas l'analyse d'impact dédiée | Oui, **mineur** — extension de contrôle suffisante (v1.2), pas un nouvel ADR |
| OWASP SAMM | fonction Governance (Strategy & Metrics, Education & Guidance) | — (seules Threat Assessment et Verification citées) | **Oui** |
| ISO/IEC 25010 | caractéristique Portabilité | — (Fiabilité, Maintenabilité, Performance, Compatibilité tous cités ; Portabilité jamais) | **Oui** — corrobore l'absence totale de contrôle réversibilité/export (0 occurrence) |
| WCAG 2.2 niveau AA / ISO 9241 / EN 301 549 | ensemble | **Couvert** (8 CTL D11 dédiés) mais orphelins de tout ADR | Non — le manque n'est pas normatif, il est de gouvernance (cf. §1 fait acquis, §3) |
| SLSA | niveau de provenance | Couvert (ADR0209/0504/0508/0509) | Non — pas de manque majeur |
| « DORA » (citations du corpus) | — | **Point de vigilance, pas un manque** : toutes les citations « DORA » du corpus (MTTR, Deployment Automation, Accelerate) renvoient aux métriques *DevOps Research & Assessment*, jamais au règlement européen *Digital Operational Resilience Act* (UE 2022/2554). Si le corpus doit un jour couvrir DORA-réglementaire (secteur financier), le registre des prestataires TIC (art. 28), les tests TLPT et la surveillance des tiers critiques ne sont couverts par aucun ADR. | Ambiguïté de nommage à corriger en v1.2 (renommer en « DORA (Accelerate) » dans les `standards[]`), pas de nouvel ADR core (hors périmètre générique) |

**Bilan §2** : 8 manques confirmés (2 exemples de la mission vérifiés comme déjà couverts,
donc exclus du décompte ; 1 point de vigilance DORA traité à part, hors décompte).

## 3. ADRs proposés (8)

| ID proposé | Titre | Domaine | Standards (clauses précises) | Manque comblé |
|---|---|---|---|---|
| ADR0210 | Réponse à incident de sécurité : détection, confinement, preuve | 02 | ISO/IEC 27002:2022 — 5.24-5.28 ; CIS Controls v8 — 17 | Table §2, ligne ISO 27002 5.24-28 |
| ADR0211 | Gestion continue des vulnérabilités et des correctifs | 02 | ISO/IEC 27002:2022 — 8.8 ; NIST SSDF — RV.1-RV.3 ; CIS Controls v8 — 7 | Table §2, ligne ISO 27002 8.8 (triple corroboration) — **exemplaire rédigé en annexe** |
| ADR0212 | Gouvernance et culture de la sécurité par la conception | 02 | OWASP SAMM — fonction Governance ; NIST SSDF — PO.1/PO.2 | Table §2, ligne SAMM |
| ADR0213 | Notification des violations de données à caractère personnel | 02 | RGPD — art. 33-34 | Table §2, ligne RGPD 33-34 (distincte de 44-49, déjà couverte) |
| ADR0108 | Réversibilité et portabilité de sortie | 01 | ISO/IEC 25010:2023 — portabilité ; ISO/IEC 19941:2017 | Table §2, ligne ISO 25010 Portabilité + recherche mots-clés (réversibilité/export : 0 occurrence) |
| ADR0612 | Souveraineté et localisation des données par conception | 06 | RGPD (par extension architecturale) ; ISO/IEC 27018:2019 | Distinct d'ADR0304 (mécanisme légal réactif, déjà couvert) — aucun principe de résidence *by design* |
| ADR0901 | Accessibilité numérique opposable (socle WCAG AA) | **09 (nouveau)** | WCAG 2.2 niveau AA ; EN 301 549 | Résout le trou D11 (fait acquis §1) — rattache `CTL-D11-01..04` (0 nouveau contrôle) |
| ADR0902 | Validation utilisateur continue et gouvernance de l'expérience | **09 (nouveau)** | ISO 9241-210 ; ISO 9241-11 | Résout le trou D11 — rattache `CTL-D11-05..08` + `CTL-D13-05` (0 nouveau contrôle) |

**Sur le domaine 09** : la question posée était nouveau domaine vs rattachement à 07/08.
Rattacher à 07 (Application & Intégration, échanges API/fichiers) ou 08 (Reporting/BI)
serait arbitraire — aucun lien sémantique avec la gouvernance UX/accessibilité. Un domaine
09 dédié est proposé ; il ne crée **aucune nouvelle dimension d'audit** (D11 existe déjà,
invariant) et referme d'un coup 9 contrôles orphelins (8 D11 + CTL-D13-05) sans écrire une
seule nouvelle règle — le meilleur ratio effort/gain de tout le lot.

**Candidats évalués et écartés** (sur les 8 fournis) :
- **Continuité/DR système** — déjà substantiellement couvert (ADR0611 : RPO/RTO + sauvegarde
  testée ; CTL-D12-07 : PCA + ISO 22301, cf. §2). Pas de nouvel ADR.
- **Licences & conformité OSS (SPDX/CRA)** — ADR0209 existe déjà et cite CRA/SPDX/SLSA dans
  ses `standards[]`, mais son contrôle réel (`CTL-D02-03`) ne teste que le scan de
  vulnérabilités, jamais la génération/publication du SBOM ni l'inventaire de licences que
  l'ADR promet pourtant. **Rattachement en v1.2** (nouveau `CTL-D02-12` sous ADR0209), pas
  un nouvel ADR — le sujet a déjà sa décision, il lui manque juste son contrôle.
- **Gestion du changement (CAB générique)** — écarté par cohérence : le corpus est bâti sur
  le postulat inverse (ADR0501/0504/0506/0509 : changement exclusivement automatisé via
  pipeline, DORA/Accelerate). Ajouter un CAB manuel générique contredirait cet invariant
  plutôt que de combler un manque.
- **Documentation vivante** — déjà couvert : ADR0005 (docs-as-code, `CTL-D13-09`
  versionnée/revue/publiée comme le code), ADR0003 (`CTL-D13-04` doc archi à jour), ADR0704
  (`CTL-D13-02` contrat API synchronisé et vérifié en CI). Pas de manque résiduel identifié.

## 4. Séquencement recommandé

**v1.2 (rattachements gratuits + contrôles manquants des 12 — aucune nouvelle décision)**
1. Matérialiser les 11 contrôles du §1 (texte déjà rédigé dans les `Confirmation` des ADR
   concernées — travail de saisie, pas de conception).
2. Rattachement ADR0805 → `CTL-D11-05` ; rattachement CTL-D16-03 → ADR0602.
3. Nouveau `CTL-D02-12` (SBOM publié + inventaire de licences vérifié) sous ADR0209 existant.
4. Rattacher `CTL-D13-06` (onboarding développeur) à ADR0104 (modèle d'ingénierie de
   plateforme) plutôt que d'attendre un ADR UX — ce n'est pas un sujet UX, c'est de la DX.
5. Renommage cosmétique de D05 en « Données, qualité & restitution ».
6. Désambiguïsation des citations « DORA » → « DORA (Accelerate/DevOps Research &
   Assessment) » dans les `standards[]` concernés.
7. Extension mineure D04 pour AI Act art. 26-27 (analyse d'impact IA), sans nouvel ADR.

**v1.3 (nouveaux ADR rédigés en MADR complet + contrôles + bindings de profil)**
1. ADR0901/ADR0902 (domaine 09 UX) en priorité — 0 nouveau contrôle à concevoir, gain de
   visibilité immédiat (referme le trou D11 dénoncé depuis v1.1).
2. ADR0211 (vulnérabilités/correctifs) et ADR0210 (réponse à incident) — priorité sécurité,
   triple/double corroboration normative, exemplaire ADR0211 déjà rédigé (annexe).
3. ADR0213 (notification de violation) — dépend d'ADR0210 (même chaîne de preuve).
4. ADR0212 (culture sécurité), ADR0108 (réversibilité), ADR0612 (souveraineté) — pas
   urgents, aucun n'est bloquant pour un audit, à cadencer selon la charge P2.

## Annexe — ADR0211 (MADR complet)

```markdown
---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement, équipe d'exploitation"
informed: "toutes les équipes produit"
id: ADR0211
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.8 (gestion des vulnérabilités techniques)", "NIST SSDF — RV.1/RV.2/RV.3", "CIS Controls v8 — 7 (Continuous Vulnerability Management)"]
derived_controls: [CTL-D02-13, CTL-D02-14]
---

# Gestion continue des vulnérabilités et des correctifs

## Context and Problem Statement

Le corpus impose déjà l'analyse des dépendances applicatives à la construction (SCA, SBOM —
ADR0209) mais ne dit rien de l'après : une vulnérabilité publiée sur un composant déjà
déployé (système d'exploitation, runtime, image de base, bibliothèque non reconstruite) ne
déclenche aujourd'hui aucune obligation de détection ni de délai de correction. Comment
garantir qu'une vulnérabilité connue touchant un système en production est détectée et
corrigée dans un délai borné, indépendamment du moment où elle est découverte par rapport
à la dernière construction ?

## Decision Drivers

* Détection continue des vulnérabilités sur tout le parc en production, pas seulement au
  moment de la construction
* Délai de remédiation borné et proportionné à la gravité (critique, haute, moyenne)
* Vérification périodique par un moyen indépendant du seul scan automatisé (test d'intrusion)
* Neutralité technologique : la pratique s'applique à tout runtime, cloud ou on-premise

## Considered Options

* Surveillance continue des vulnérabilités connues sur le parc déployé, délai de correction
  contractualisé par gravité, complétée par un test d'intrusion périodique indépendant
* Rescan des dépendances uniquement à la prochaine construction planifiée (statu quo)
* Veille passive : traitement seulement à réception d'une alerte spontanée d'un tiers

## Decision Outcome

Chosen option: "Surveillance continue avec délai contractualisé et vérification
indépendante", parce que c'est la seule option qui couvre l'intervalle — souvent long pour
un composant d'infrastructure stable — entre deux constructions, et qui vérifie la
détection automatisée par un moyen distinct, indépendamment de la plateforme d'hébergement.

### Consequences

* Good, because aucune vulnérabilité connue ne peut rester silencieusement non traitée
  entre deux constructions applicatives.
* Good, because le délai de remédiation devient mesurable et opposable, par gravité.
* Bad, because une capacité de surveillance et un budget de remédiation récurrents doivent
  être maintenus indépendamment de tout projet.
* Neutral, because un arriéré de vulnérabilités basses/moyennes peut être toléré s'il est
  documenté et borné.

### Confirmation

Contrôles dérivés : CTL-D02-13 (le parc en production — applicatif, runtime,
infrastructure — fait l'objet d'une surveillance continue des vulnérabilités connues, avec
un délai de remédiation documenté et respecté par niveau de gravité — mode automatique +
revue), CTL-D02-14 (un test d'intrusion ou exercice offensif indépendant du scan automatisé
est réalisé au moins annuellement ou après toute évolution architecturale significative,
avec un plan de remédiation daté pour chaque constat — mode revue). Preuve attendue :
rapport de surveillance des vulnérabilités avec délais mesurés + rapport de test
d'intrusion le plus récent et son plan de remédiation. Grille : conforme = 0 vulnérabilité
critique hors délai ET test d'intrusion à jour ; partiel = délais partiellement respectés
ou test de plus de 12 mois ; non conforme = vulnérabilité critique non traitée hors délai
ou absence totale de test indépendant.

## Pros and Cons of the Options

### Surveillance continue + vérification indépendante
* Good, because couvre l'intervalle entre constructions, vérifiée par un moyen distinct.
* Bad, because coût récurrent d'outillage et de remédiation à budgéter en continu.

### Rescan à la prochaine construction seulement
* Good, because aucun outillage additionnel par rapport à l'existant (ADR0209).
* Bad, because une vulnérabilité découverte juste après une construction reste exposée
  jusqu'à la suivante, sans délai borné.

### Veille passive sur alerte spontanée
* Good, because coût nul en l'absence d'alerte.
* Bad, because dépend entièrement de la réactivité d'un tiers ; aucune détection propre.

## More Information

Instanciations : `profil:azure` → Defender for Cloud (surveillance continue) + calendrier
de patch management géré par la plateforme ; autres profils → scanner de vulnérabilités
infrastructure équivalent, exécuté en continu. Distinct d'ADR0209 (chaîne
d'approvisionnement à la construction) : cet ADR couvre le cycle de vie post-déploiement.
Manque comblé : ISO/IEC 27002:2022 — 8.8, NIST SSDF — RV.1-RV.3 et CIS Controls v8 — 7
n'étaient couverts par aucun ADR ni contrôle du corpus (EXTENSION-CORPUS.md §2).
```
