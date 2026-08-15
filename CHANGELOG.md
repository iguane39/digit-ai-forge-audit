# Changelog — AuditCore core

Versionnement SemVer (PADR-0005) : MAJEUR = rupture de schéma / retrait de contrôle ·
MINEUR = nouveaux contrôles/ADR · PATCH = corrections. Chaque release liste les standards
sources mis à jour.

## [Non publié] — 2026-08-14

> Numéro de version à figer à la release. **PATCH** au sens de PADR-0005 : corrections de
> citations et complétion d'un corpus de traduction — aucun contrôle ajouté ni retiré, aucun
> schéma touché.

### Corrigé
- **Migration des citations `standards[]` vers ASVS 5.0.0** (TF-0221, PADR-0010). Les 22
  citations `OWASP ASVS 5.0 — Vxx` employaient la numérotation de chapitres d'**ASVS 4.0.x** :
  **21 réécrites** vers leur cible 5.0.0 réelle, **1 supprimée** (`CTL-D02-01` — 4.0.3 V1
  n'a aucun successeur en 5.0.0), **0 laissée** en 4.0.x. Chaque cible est suivie *exigence par
  exigence* dans le fichier officiel `mapping_v4.0.3_to_v5.0.0.yml`, jamais par translation de
  chapitre : une exigence éclatée donne une **citation multiple**. Quatre citations étaient
  **fausses dans les deux versions** (`ADR0303` TLS, `ADR0305`, `ADR0706` et `CTL-D02-04`
  limitation de débit) — corrigées **et** signalées comme erronées dans le corps de l'ADR
  porteur (FR et EN). Détail par classe et preuves :
  `docs/CORRESPONDANCE-ASVS-4.0.x-5.0.0.md` §6, `docs/MAPPING-CONTROLES-ASVS.md` §7 bis.
  Contrôles porteurs d'une citation ASVS : 10 → **9**.

### Ajouté
- **Le rapport d'audit se lit par VUES** — doctrine « restitution lisible » portée dans le
  moteur de rendu (TF-0235 volet P4, référentiel `REFERENTIEL-RESTITUTION.md` de forge-design,
  famille `rapport`). Le livrable, c'est le GÉNÉRATEUR : la refonte entre dans
  `tools/rapport-engine.mjs` et `tools/verifier-rapport-html.mjs`, jamais dans un HTML produit.
  Les onglets à plat deviennent **7 vues naviguées**, une question par vue, servant trois
  lecteurs nommés — commanditaire, metteur en œuvre, expert : *Synthèse · Plan d'action ·
  Constats par dimension · Toutes les règles · Architecture & BDD · Données analysées ·
  Méthode & lecture*. Une vue sans donnée n'existe pas et son absence se **déclare**.
  Composants du référentiel : `<body data-restitution="rapport">` ; navigation `[data-vue]`
  tenant aussi le rôle de sommaire du socle (annonce `.toc-d`) ; **routeur à ancres** — un
  renvoi vers `#D05` ouvre la vue qui contient D05 avant d'y défiler, sans quoi les 22 liens
  internes du rapport seraient des affordances mortes ; **4 KPI complets** (valeur, définition,
  repère de lecture, lien d'action) là où trois chiffres s'affichaient nus ; **2 figures à
  question interrogative** (répartition par famille, répartition des verdicts, segments
  juxtaposés et jamais superposés) ; **chemins d'entrée par lecteur** ; **manifeste d'écarts
  calculé** sur l'état réel de la mission — « aucun écart » se déclare aussi.
  **Iso-contenu strict, mesuré** : aucune valeur des données d'audit n'est perdue (relevé
  jeton à jeton sur les deux fixtures) ; le générique — barèmes de score, définitions des
  verdicts, des criticités et des priorités, provenance — quitte les onglets pour vivre **une
  seule fois** en vue Méthode, où les chiffres y renvoient par `aria-describedby`. Deux
  reformulations assumées : la colonne « Note » du dictionnaire ERD devient « Remarque »
  (ce n'est pas une colonne calculée), et la légende ERD cite ses mots-clés SQL en `<code>`.
- **Tableaux longs exploitables** : au-delà de 8 lignes, tout tableau du rapport porte le
  composant de filtres de colonne du socle (asset vendoré `tools/table-filters.mjs`,
  checklist G1-G6 : `data-filterable`, `id`, `<thead>`, compteur `aria-live`, réaffichage des
  lignes filtrées à l'impression) et une recherche libre qui **se compose** avec les filtres
  au lieu de les écraser. Un tableau qui ne doit pas être filtré porte son motif — sans motif,
  ce n'est pas une exemption.
- **Le gate de rendu contrôle le contrat de restitution** (`verifier-rapport-html.mjs`) avec la
  même exigence de preuve que le reste : famille déclarée, KPI complets et reliés à leur repère,
  **appariement exact sommaire ↔ vues** (une vue sans entrée de sommaire est un chapitre perdu,
  une entrée sans section un lien mort — les deux font échouer la génération), figures
  interrogatives, chemins de lecteur, manifeste non vide, câblage des tableaux longs. Le moteur
  est toujours COMPILÉ puis EXÉCUTÉ, et **chaque vue déclarée est pilotée** comme au clic.
  Batterie des oracles : 55 → **62 tests**, chaque règle nouvelle ayant sa fixture rouge.
- **Corpus EN complété, pack anglais de nouveau émis** (TF-0220, PADR-0011) :
  `core/controls-en/D17.json` créé (4 contrôles de gouvernance IA) et `CTL-D07-08`/`CTL-D07-09`
  ajoutés à `core/controls-en/D07.json`. `assemble-core.mjs` refusait d'émettre
  `controls-core-v1.en.json` depuis l'ajout de D17 (169/175) : les **deux packs sortent à
  nouveau** (175 FR + 175 EN), parité FR/EN vérifiée contrôle à contrôle.

## [1.7.0] — 2026-08-12

> TF-0110 : gouvernance IA, policy-as-code, réalignement FinOps, pilier soutenabilité.

### Ajouté
- **Dimension `D17 · Gouvernance IA`** (18e dimension, famille `securite`) : classification du
  risque des systèmes IA, dérive de modèle, supervision humaine, documentation de conformité
  (ISO/IEC 42001, NIST AI RMF, EU AI Act) — `ADR0109`, 4 contrôles `CTL-D17-01..04` (PADR-0009,
  évolution additive, MINEURE). `control.schema.json`/`tenant.schema.json` étendent leur regex de
  dimension (`D00`–`D16` → `D00`–`D17`).
- **`CTL-D07-08`** (maturité FinOps Crawl/Walk/Run par capacité et par périmètre de dépense) et
  **`CTL-D07-09`** (impact environnemental des décisions d'hébergement, extension qualitative du
  pilier soutenabilité — `ADR0110`) : 175 contrôles au total.
- **Démonstrateur policy-as-code** (`profiles/policy-as-code/`) : 3 règles Rego (OPA/conftest)
  sur un sous-ensemble de contrôles (`CTL-D07-01`, `CTL-D07-04`, `CTL-D02-11`), fixtures IaC
  verte/rouge, exécutées via `conftest` (preuve, pas de migration du corpus).

### Modifié
- `ADR0107` (gouvernance des coûts) réaligné sur le FinOps Framework 2025/2026 (Scopes,
  Domaines/Capacités, Personas, maturité Crawl/Walk/Run par capacité) — les contrôles existants
  `CTL-D07-01..07` restent inchangés.
- `tools/assemble-core.mjs` : le nombre de dimensions n'est plus codé en dur, il se lit dans
  `dimensions.yaml` (évite la dérive documentaire signalée par TF-0113).

## [1.6.0] — 2026-07-15

> Découplage produit/tenant (RAF-027..030) : AuditCore devient un dépôt autonome
> (`digit-ai-forge-auditcore`, nommé `digit-ai-auditcore` à la date de cette release) qui ne
> connaît AUCUN tenant réel — l'espace de l'engagement
> historique (overlay, mapping, baseline d'iso-test, plan, registre) vit dans le dépôt client.

### Ajouté
- **Tenant `exemple`** (`config/tenants/exemple/`, ACME 100 % fictif) : base d'onboarding
  documentée — valide, kits compliance (8 entrées) + audit (32 entrées) générables.
- **Golden-test synthétique** (`tests/test-golden-buckets.mjs`, 9 assertions) : buckets
  `binding_authorities` + bascule de juridiction prouvés en CI sur `tests/fixtures/pack-fixture.json`
  (10 contraintes fictives) — plus aucune dépendance à un tenant réel dans la batterie.
- **Lint agnosticité v2** : niveau N0 repo-wide — aucun nom de tenant réel toléré dans le
  dépôt produit (gate CI, termes construits par concaténation pour rester auto-vérifiable).

### Modifié
- `merge-packs.mjs` : `--derive-pack` et `--iso-test` exigent `--baseline/--pack/--tenant`
  en flags (plus aucun défaut pointant un tenant) ; l'alias historique de dérivation du pack
  du tenant de référence est retiré. L'iso-comportement 91/91 se rejoue dans le dépôt de l'engagement.
- Fixtures `rapport-data-*.json` : tenant fictif ACME.
- Documentation produit neutralisée : les exemples pointent le tenant `exemple` ;
  le tenant historique n'est plus nommé (« tenant de référence »).

### Retiré
- `config/tenants/<tenant-réel>/` (overlay, packs, mapping 91→core, thème) — déplacé dans
  le dépôt d'engagement (`tenants/`), avec `STATUS`, `KIT-PARITE`, `RESTE-A-FAIRE`,
  `SEPARATION-PRODUIT-TENANT` (docs d'engagement) ; `deliverables/generated/` purgé (RAF-028).

## [1.5.0] — 2026-07-12

> Exécution des catégories A, C, D, E du registre RESTE-A-FAIRE (B — étapes humaines — inchangée).

### Ajouté
- **Domaine 09 · UX & Accessibilité** (PADR-0008) : OPTIONNEL → évolution MINEURE (00–08 requis,
  09 permis) ; ADR0901/0902 rédigés, contrôles D11/D13-05 rattachés — **couverture 73/73 ADRs**.
- **8 ADRs** (RAF-007/008) : incident (ADR0210), vulnérabilités (ADR0211), gouvernance sécurité
  (ADR0212), notification de violation (ADR0213), réversibilité (ADR0108), souveraineté (ADR0612),
  accessibilité (ADR0901), gouvernance UX (ADR0902) + **7 contrôles dérivés** (162 → 169).
- **Juridictions** (RAF-011) : champ `jurisdiction` (12 contrôles D04 « eu »), manifestes
  `profiles/jurisdictions/` (eu + démo), fusion → `sans_objet` motivé hors juridiction active
  (prouvé dans les deux sens) ; contrôle AI Act art. 26-27 (RAF-009, CTL-D04-11).
- **Moteur v1.5** (RAF-005) : ERD BDD (bandes, PII 🔒, FK/références logiques, dictionnaire) +
  schéma d'architecture auto-layout (barycentre) — onglet « Architecture & BDD » ; hérités par
  les kits standalone. **Double gate de rendu** (RAF-006) : `verifier-rapport-html.mjs`.
- **Générateurs** : `build-referentiel` (M4, 310 Ko consultable), `build-slides` (M6, 5 diapos),
  `build-fiche` (M9, 8 sections) + gabarit `methodologie.template.md` (M1) — kit audit **32 entrées** ;
  **PARITÉ 15/15 avec le kit tenant.**
- **i18n EN** (RAF-012) : corpus traduit (73 ADRs `adr-en/`, 169 contrôles `controls-en/` →
  pack `controls-core-v1.en.json` émis, 5 gabarits `.en`), moteur bilingue (STR), labels EN
  (17 dimensions + 6 familles), sélection automatique par `tenant.language` — **kit anglais
  prouvé E2E 6/6** (ACME en).
- **CI** (RAF-019) : `.github/workflows/ci.yml` — lint agnosticité + batterie complète en gate.
- **Gouvernance** (RAF-017) : `docs/GOUVERNANCE-STANDARDS.md` (checklist semestrielle, revue n°1).
- **Bindings azure étendus** (RAF-010) : couverture élargie au-delà des 42 Fatal/Bloquant.

### Modifié / hygiène
- Graphe de connaissance ré-étendu (RAF-021) : 901 → **1 064 nœuds**, 53 communautés.
- `rtk trust` appliqué (RAF-020) ; zip doublon supprimé, `tools/rtk.zip` conservé documenté (RAF-023).
- Exclusions E re-vérifiées : DORA-réglementaire, portage 1:1 moteur tenant, retrofit legacy — tracées.

## [1.4.0] — 2026-07-12

### Ajouté
- **M5 v1** — moteur de rendu du rapport : `tools/rapport-engine.mjs` (fonction pure
  données+config→HTML : bandeau gate, KPIs calculés, radar SVG par famille, onglets
  familles→dimensions avec matrice de traçabilité, constats/actions triés, onglet
  « Toutes les règles » filtrable, reprise, impression) + CLI `build-rapport.mjs` +
  **variante standalone bakée dans le kit audit** (thème, dimensions, index des 253 règles
  inlinés — zéro dépendance). Hors v1 (→ v1.5) : ERD BDD, schéma d'architecture auto-layout.
- **M7** — `tools/build-catalogue.mjs` : catalogue HTML navigable des 65 ADRs (filtre par
  domaine, recherche, standards et règles dérivées par carte), généré par tenant et
  **embarqué dans le kit audit**.
- Kits audit : 27 → **29 entrées** (`build-rapport-standalone.mjs` + `catalogue-adr.html`).
  **Plus aucun manquant bloquant à la parité** (KIT-PARITE : 10 ✅ · 3 🟠 · 0 ❌ · 1 ⚪).
- `docs/RESTE-A-FAIRE.md` — registre consolidé du reste-à-faire (26 items RAF-001..026,
  5 catégories, preuve d'exhaustivité par source) : LE point d'entrée des reprises de session.
- **Bascule du kit tenant officiel** : kit `20260712a` du tenant de référence (espace engagement) +
  `Kit Compliance Pack` désormais produits par `build-kit` (RAF-022) ; le kit manuel
  `20260710i` est archivé dans `output/old/`.

### Corrigé
- `build-catalogue`/`build-rapport` : le chemin du yaml tenant n'est plus supposé s'appeler
  `tenant.yaml` (les fixtures/kits marque-blanche à nom libre fonctionnent).

## [1.3.0] — 2026-07-12

### Ajouté
- **12 contrôles** matérialisant l'intention des ADRs orphelins (EXTENSION-CORPUS §1) :
  D01 (zonage, tiers de confiance API/fichiers, retrait d'API), D02 (egress), D03 (clients
  publics sans secret), D05 ×6 (restitution BI : modèle sémantique, source unique,
  transformations, dimension temps, modes d'accès, certification) — **150 → 162, couverture
  ADR 65/65, 0 orphelin** ; + 2 rattachements (ADR0805→CTL-D11-05, ADR0602→CTL-D16-03).
- **M2** `templates/prompt-conduite-audit.template.md` (prompt de conduite générique — parité
  avec le prompt tenant : règles d'or, 3 phases, sortie `rapport-data.json` + backlog forge).
- **M3** `templates/prompt-verification-rapport.template.md` (boucle corrective de gate).
- **M8** `templates/compliance-skill.template.md` + génération substituée par `build-kit`
  dans les deux kits (0 placeholder).

### Modifié
- Relabel D05 → « Données, qualité & restitution » (absorbe le domaine BI, recommandation
  EXTENSION §1) ; renommage `DORA` → `DORA (Accelerate)` (30 occ., lève l'ambiguïté avec le
  règlement UE 2022/2554) ; kits du tenant de référence `20260712c` (compliance 8 · audit 27 entrées), ACME `b`.

## [1.2.0] — 2026-07-12

### Ajouté
- **Documentation produit** (`docs/`) : KIT-PARITE (matrice 15/15 vs kit tenant `20260710i`,
  9 manquants M1–M9, backlog v1.2/v1.3), ONBOARDING-ENTRANTS (27 entrants mappés 1:1 sur le
  schéma, checklist client), MANUEL-IA-ONBOARDING (runbook 10 étapes, 3 gates + HITL client),
  MANUEL-ENTREPRISE (parcours complet, non technique), AUDIT-AGNOSTICITE, EXTENSION-CORPUS.
- **lint-agnostic** (`tools/lint-agnostic.mjs`) : gate CI d'agnosticité du core (denylist N1
  ~40 termes + motifs N2, frontières Unicode, corps ADRs + champs des contrôles).

### Modifié
- **Audit d'agnosticité 65/65** : 5 ADRs reformulés (ADR0101 « zonage cloisonné », ADR0103,
  ADR0201 (retrait produits OSS de l'exemplaire), ADR0502 « délégation d'exploitation
  maximale » + NIST SP 800-145 en standard, ADR0805 énumération ouverte) — lint 0 finding,
  iso-test 91/91 maintenu, kits du tenant de référence régénérés (`20260712b`).

## [1.1.0] — 2026-07-12

### Ajouté
- **build-kit** (`tools/build-kit.mjs`) : kits marque-blanche distribuables en zip par tenant —
  `--kind compliance` (part du projet audité : contraintes fusionnées, banc de preuves, **vérificateur
  autonome zéro dépendance**, gabarit fiche sécurité, thème) et `--kind audit` (équipe d'audit :
  + dimensions, 13 gabarits, schémas, init-workspace autonome). Indice de version quotidien auto (a, b, c…).
- **ziplib** (`tools/ziplib.mjs`) : écriture ZIP native Node (deflate `node:zlib`, CRC-32), zéro dépendance.
- Kits générés et vérifiés pour 2 tenants (tenant de référence : compliance 7 entrées + audit 23 ; ACME : compliance 7) —
  intégrité testée, vérificateur autonome exécuté hors kit avec verdicts corrects.

## [1.0.0] — 2026-07-11

Première release du core générique (exécution du plan [PLAN/](../PLAN/README.md)).

### Ajouté
- **Modèle 3 couches** core > profil > overlay, décisions PADR-0001…0007.
- **Corpus ADR core** : ~65 ADR de principe (MADR), 9 domaines, chacun mappé à ≥ 1 standard
  (ISO/IEC 25010 · 27001/27002:2022 · 27701 · NIST CSF/SSDF/800-63B/800-207 · OWASP ASVS 5.0/SAMM ·
  CIS · DORA · 12-Factor · SLSA · SemVer · OpenAPI · WCAG 2.2 · RGPD · AI Act · DMBOK · Kimball).
- **Référentiel de contrôles** : 17 dimensions D00–D16 (6 familles), ~140 contrôles CTL sourcés,
  applicabilité par type de projet (web-app, api, data, mobile, ml, infra).
- **Moteurs conservés** du terrain : scoring 1–5 « pas de score sans preuve », criticité 4 niveaux,
  verdicts 5 états, enforcement 4 niveaux, gates 1a/1b, matrice de traçabilité, banc de preuves.
- **Schémas** : tenant.yaml, control, remediation-actions (JSON Schema draft-07).
- **Outils** : validate-config · build-theme · merge-packs (+ test iso 91/91) · verifier-rapport ·
  init-audit-workspace · forge-adapter (formats forge vérifiés sur le dépôt digit-ai-forge-development,
  nommé `digit-ai-saas-forge` à la date de cette release).
- **Profils** : azure, databricks-lakehouse, powerbi, elastic. **Overlay de référence** : le tenant historique (espace engagement depuis 1.6.0).

### Standards sources (état à la release)
OWASP ASVS 5.0 · WCAG 2.2 · ISO/IEC 27002:2022 · NIST SSDF v1.1 · DORA (Accelerate) ·
RGPD (2016/679) · AI Act (2024/1689) · SLSA v1.0 · DMBOK v2.
