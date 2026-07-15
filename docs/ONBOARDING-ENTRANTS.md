# Dossier d'entrants — Onboarding client AuditCore

> **Audience : toute entreprise cliente en cours d'onboarding, et l'équipe AuditCore qui l'accompagne.**
> Ce document est la checklist de référence citée par [`MANUEL-IA-ONBOARDING.md`](MANUEL-IA-ONBOARDING.md) (gate 1 : réception du dossier).
> Version : 1.0 · 2026-07-12.

AuditCore personnalise l'intégralité d'un audit — marque, domaines, contraintes, rôles,
environnements, remédiation — à partir d'**un seul fichier de configuration**, `tenant.yaml`,
validé par [`core/schemas/tenant.schema.json`](../core/schemas/tenant.schema.json). Ce document
liste les **entrants** que l'entreprise cliente doit fournir pour que ce fichier — et sa charte
graphique compagnon `DESIGN.md` — puissent être produits.

Principe directeur : **une seule mécanique de config, deux usages** (le tenant de référence
le tenant *exemple* (ACME, fictif) et tout tenant client suivent exactement le même schéma ; aucun comportement
n'est câblé en dur pour un client en particulier).

Deux règles gouvernent la complétude du dossier :
- **Tout entrant obligatoire manquant bloque l'onboarding** (le validateur de configuration
  échoue dès la gate 1 — aucun kit n'est généré tant que le manquant n'est pas fourni).
- **Tout entrant optionnel a un défaut sûr** appliqué automatiquement (palette générique,
  libellés core, environnements standards…) — son absence dégrade vers le comportement
  générique du framework, elle ne bloque jamais.

Les exemples cités (« exemple : … ») reprennent les valeurs du tenant *exemple* (ACME, fictif) à
titre d'illustration uniquement — aucune valeur nominative n'est imposée à un nouveau client.

## 1. Table des entrants

Mapping 1:1 avec les propriétés de `tenant.schema.json`, regroupé par thème métier.

### Identité & marque

| Entrant (langage métier) | Champ cible (`tenant.yaml`) | Obligatoire / Optionnel (défaut) | Format attendu | Exemple | Qui le fournit (rôle type : DSI, DirCom, RSSI, Achats…) |
|---|---|---|---|---|---|
| Nom de l'entreprise auditée | `tenant.name` | Obligatoire | Chaîne libre | exemple : « ACME » | DirCom / Direction générale |
| Sigle court (en-têtes, logo bloc) | `tenant.short_code` | Obligatoire | 1 à 3 lettres majuscules | exemple : « NH » | DirCom |
| Maison mère / holding | `tenant.parent_org` | Optionnel (déf. : `null`) | Chaîne libre ou vide | exemple : « Groupe ACME » | Direction générale / DSI |
| Langue des livrables | `tenant.language` | Obligatoire | Enum `fr` / `en` | exemple : `fr` | DirCom / DSI |
| Charte graphique complète, ou à défaut couleurs seules | `branding.design_md` **ou** `branding.colors` | Obligatoire (l'un des deux) | Fichier Markdown à frontmatter YAML **ou** objet de 5 à 8 codes hex | exemple : `DESIGN.md` ; couleurs accent `#0F4C81`, fatal `#a3231c`, bloquant `#9a4a06`, majeur `#8a6500`, standard `#136e34` | DirCom / Studio graphique |
| Logo | `branding.logo` | Optionnel (déf. : pas de fichier, bloc-lettre généré depuis `short_code`) | Fichier SVG ou PNG | exemple : `logo.svg` (bloc « NH » sur fond `#1A1A1A`) | DirCom / Studio graphique |
| Initiale de la favicon | `branding.favicon_letter` | Optionnel (déf. : 1ʳᵉ lettre de `tenant.name`) | 1 à 2 caractères | exemple : « N » | DirCom |
| Typographies (texte courant, code) | `branding.typography` | Optionnel (déf. : police système) | Objet `{ body, mono, … }` | exemple : body « Segoe UI, Roboto, system-ui » ; mono « JetBrains Mono, Consolas » | DirCom / Studio graphique |

### Gouvernance & rôles

| Entrant (langage métier) | Champ cible (`tenant.yaml`) | Obligatoire / Optionnel (défaut) | Format attendu | Exemple | Qui le fournit (rôle type : DSI, DirCom, RSSI, Achats…) |
|---|---|---|---|---|---|
| Version du schéma de configuration | `schema_version` | Obligatoire (figé par le framework) | Constante entière `1` | exemple : `1` | Équipe AuditCore |
| Version du socle AuditCore à suivre | `core_version` | Obligatoire | Chaîne SemVer (version figée ou plage) | exemple : « 1.0.x » | Équipe AuditCore (validé DSI) |
| Intitulés et couleurs des 9 domaines d'audit | `domains[]` | Obligatoire (les 9 codes `00`–`08` sont fixes, non modifiables) | Tableau de 9 objets `{ code, key, label, color? }` | exemple : `01 org-gov` « Organisation & Gouvernance » `#0F4C81` … `08 reporting` « Reporting & Analytics » `#BE2D78` | DSI / Architecture |
| Référentiel de dimensions d'audit | `dimensions.pack` | Obligatoire (figé : `core-v1`, non modifiable) | Chaîne (identifiant de pack) | exemple : « core-v1 » | Équipe AuditCore |
| Renommage cosmétique d'une dimension | `dimensions.relabel` | Optionnel (déf. : libellés core `D00`–`D16`) | Objet `{ D00..D16: libellé }` — renommage seul, jamais suppression | exemple : `D15` → « Data by Design » | Architecture / DSI |
| Rôles et instances nommées | `roles.*` | Optionnel (déf. : libellés génériques du core) | Objet libre `clé de rôle → nom instancié` | exemple : `decision_authority` « Design Authority », `security_officer` « RSSI », `remediation_team` « Data Forge » | DSI / RH-Organisation |
| Autorité(s) dont les décisions sont opposables | `enforcement.binding_authorities` | Obligatoire (tableau vide `[]` accepté) | Tableau de chaînes — doit correspondre au champ `authority` des contraintes internes | exemple : `["ACME"]` | RSSI / DSI |
| Règles de déclenchement des seuils (bloquant / conseil) | `enforcement.gate_policy` | Optionnel (déf. : règles core) | Objet libre de règles (`blocking_when`, `advisory_when`, …) | exemple : `blocking_when: ["criticite in [Fatal, Bloquant] and bucket == opposable"]` | RSSI / Architecture |

### Périmètre technologique

| Entrant (langage métier) | Champ cible (`tenant.yaml`) | Obligatoire / Optionnel (défaut) | Format attendu | Exemple | Qui le fournit (rôle type : DSI, DirCom, RSSI, Achats…) |
|---|---|---|---|---|---|
| Technologies du périmètre (cloud, data, BI…) | `profiles[]` | Optionnel (déf. : aucun profil, contrôles génériques seuls) | Tableau de clés de profils disponibles | exemple : `[azure, databricks-lakehouse, powerbi, elastic]` | DSI / Architecture / Achats |

### Contraintes & sources internes

| Entrant (langage métier) | Champ cible (`tenant.yaml`) | Obligatoire / Optionnel (défaut) | Format attendu | Exemple | Qui le fournit (rôle type : DSI, DirCom, RSSI, Achats…) |
|---|---|---|---|---|---|
| Packs de contraintes à appliquer | `constraint_packs[]` | Obligatoire (≥ 1 pack, le pack core en premier) | Tableau de chaînes (chemins/ids de packs) ; format interne : `core/schemas/control.schema.json` | exemple : `[core/controls/controls-core-v1.json, packs/acme-constraints.json]` | RSSI / Architecture |
| Référentiel de principes internes (ex. « Data by Design ») | `dimensions.principles_pack` | Optionnel (déf. : aucun principe additionnel) | Chaîne (chemin vers fichier de principes) | exemple : `packs/principles-data-by-design.yaml` | Architecture / Data |
| Schéma de numérotation des décisions d'architecture | `adr.id_scheme` | Optionnel (déf. : « domain-coded », seule valeur reconnue) | Enum `domain-coded` | exemple : « domain-coded » | Architecture |
| Table de correspondance ADR historiques → catalogue | `adr.aliases` | Optionnel (déf. : `{}` — pertinent seulement en migration depuis un référentiel existant) | Objet `{ ancien_id: nouvel_id }` | exemple : `{ ADR0005: ADR0101, ADR0006: ADR0102 }` | Architecture / DSI |
| ADR ajoutés, durcis ou désactivés par l'entreprise | `adr.overrides` | Optionnel (déf. : `add`/`tighten`/`disable` vides) | Objet `{ add: [...], tighten: {...}, disable: [...] }` — `disable` refusé sur un ADR core invariant | exemple : `add: [], tighten: {}, disable: []` | Architecture / RSSI |
| Documents normatifs internes cités en référence | `sources[]` | Optionnel (déf. : `[]`) | Tableau d'objets `{ id, title, version? }` | exemple : `{ id: SRC-01, title: "Principe d'architecture IT", version: "1.4" }` | DSI / Achats / RSSI |

### Environnements

| Entrant (langage métier) | Champ cible (`tenant.yaml`) | Obligatoire / Optionnel (défaut) | Format attendu | Exemple | Qui le fournit (rôle type : DSI, DirCom, RSSI, Achats…) |
|---|---|---|---|---|---|
| Chaîne de promotion des environnements | `environments[]` | Optionnel (déf. : chaîne standard sandbox → dev → staging → prod) | Tableau d'objets `{ key, label, zone?, code?, owner? }` | exemple : sandbox → dev-poc → dev-mvp → staging → prod | DSI / Squad Infra-Ops |

### Remédiation (forge)

| Entrant (langage métier) | Champ cible (`tenant.yaml`) | Obligatoire / Optionnel (défaut) | Format attendu | Exemple | Qui le fournit (rôle type : DSI, DirCom, RSSI, Achats…) |
|---|---|---|---|---|---|
| Activation de la remédiation automatisée | `forge.enabled` | Optionnel (déf. : `false`) | Booléen | exemple : `true` | DSI / RSSI |
| Outil de gestion de code pour la remédiation | `forge.repo_provider` | Optionnel (déf. : non défini tant que la forge est désactivée) | Enum `github` / `azure-devops` | exemple : « azure-devops » | DSI / Achats |
| Charte utilisée par le design-gate de la forge | `forge.brand_charter` | Optionnel (déf. : réutilise `branding.design_md`) | Chaîne (chemin fichier) | exemple : `DESIGN.md` | DirCom / DSI |

## 2. Entrants matériels (hors `tenant.yaml`)

Trois familles d'entrants ne se saisissent pas directement dans le yaml : fournies à l'état
brut, elles sont **transformées** par l'équipe AuditCore (ou un agent IA outillé, voir
[`MANUEL-IA-ONBOARDING.md`](MANUEL-IA-ONBOARDING.md)) en artefacts consommables par le framework.

- **Charte graphique brute** (logo, codes couleurs hex, polices, éventuellement gabarits
  PowerPoint/Word) → transformée en [`DESIGN.md`](../config/tenants/exemple/DESIGN.md) (frontmatter
  YAML unique, consommé à la fois par `tools/build-theme.mjs` et par le design-gate de la forge).
  L'entreprise fournit la matière brute, jamais le fichier `DESIGN.md` lui-même.
- **Documents normatifs internes** (principes d'architecture, standards techniques, nomenclatures
  de nommage, formulaires de reprise applicative…) → deviennent des entrées `sources[]`
  (référence citable) et/ou sont dépouillés en règles dans un pack de contraintes propre au
  tenant (`packs/<slug>-constraints.json`, référencé dans `constraint_packs` après le pack core).
  Chaque règle qui en découle porte un champ `authority` : si sa valeur figure dans
  `enforcement.binding_authorities`, la règle devient opposable pour ce client.
- **Liste des technologies du périmètre** (fournisseur cloud, plateforme data, outil BI, moteur
  de recherche…) → traduite en sélection de `profiles[]` parmi les profils disponibles du
  framework ; une technologie sans profil existant reste couverte par les contraintes génériques
  du pack core.

## 3. Checklist « prêt à onboarder »

À envoyer telle quelle à un client pour cadrer sa collecte interne.

**Obligatoire — bloque l'onboarding si manquant**
- [ ] Nom légal/commercial de l'entreprise + langue des livrables (`fr` ou `en`)
- [ ] Sigle de 2-3 lettres pour les en-têtes et le logo bloc
- [ ] Charte graphique complète (`DESIGN.md`) **ou**, à défaut, 5 à 8 codes hex (accent + 4
      sévérités : fatal/bloquant/majeur/standard)
- [ ] Intitulés des 9 domaines d'audit (couleurs recommandées mais non bloquantes)
- [ ] Version ou plage de version du socle AuditCore à suivre
- [ ] Au moins un pack de contraintes à appliquer (générique core et/ou propre à l'entreprise)
- [ ] Autorité(s) dont les décisions sont opposables (liste vide acceptée si aucune à ce stade)

**Optionnel — un défaut sûr s'applique si absent**
- [ ] Maison mère / holding, si applicable
- [ ] Logo en fichier SVG ou PNG (sinon bloc-lettre généré automatiquement)
- [ ] Initiale de favicon (sinon 1ʳᵉ lettre du nom)
- [ ] Polices de caractères — texte courant et code (sinon police système)
- [ ] Renommage cosmétique de dimensions (ex. « D15 → Data by Design »)
- [ ] Référentiel de principes internes à intégrer (ex. les 9 principes « Data by Design »)
- [ ] Rôles et instances nommées (autorité de décision, RSSI, CAB, équipe de remédiation…)
- [ ] Règles de seuils de gate (quand bloquer / quand conseiller)
- [ ] Liste des technologies du périmètre (cloud, data, BI…) pour sélection des profils
- [ ] Alias et durcissements d'ADR historiques (si migration depuis un référentiel existant)
- [ ] Documents normatifs internes à citer (principes d'architecture, nomenclatures, standards)
- [ ] Chaîne d'environnements avec zones et responsables (sinon sandbox/dev/staging/prod générique)
- [ ] Activation de la remédiation automatisée + outil Git cible (GitHub / Azure DevOps)

## 4. RACI

| Activité | Entreprise cliente | Équipe AuditCore | Agent IA |
|---|---|---|---|
| Fournir les entrants (table §1 + matériels §2) | R | C | I |
| Valider la conformité au schéma (gate 1) | C | A | R (pré-vérification outillée) |
| Transformer entrants bruts → `tenant.yaml` / `DESIGN.md` / packs | I | A | R |
| Approuver la configuration finale avant génération des kits | A | C | I |
| Faire évoluer le dossier (nouveaux profils, contraintes, rôles) | R | C | I |

*R = réalise, A = approuve, C = consulté, I = informé.*
