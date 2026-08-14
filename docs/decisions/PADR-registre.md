# Registre des décisions produit (PADR) — AuditCore

> Format MADR minimal. Décisions actées lors de l'exécution du plan (ordre du propriétaire
> produit, session du 2026-07-11). Une revue formelle par l'autorité de décision du tenant
> reste recommandée mais non bloquante (propriétaire = décideur ici).

---
## PADR-0001 — Modèle à 3 couches avec précédence `core > profil > overlay`
status: **accepted** · date: 2026-07-11 · decision-makers: propriétaire produit
**Contexte** : tension exhaustif ∧ agnostique ∧ tous-types ([PLAN/01 §1-2](../../../PLAN/01-modele-abstraction.md)).
**Décision** : core invariant mappé aux standards ; profils technologiques enfichables ; overlay
tenant (ajouter/durcir/nommer/habiller, jamais affaiblir un `invariant: true` ; dérogation tracée sinon).
**Conséquences** : bon — généricité sans platitude ; mauvais — discipline de classement requise
(test des 3 questions, [PLAN/01 §3](../../../PLAN/01-modele-abstraction.md)).

---
## PADR-0002 — Numérotation ADR canonique : par domaine `ADR<xx><yy>` (ex-D1)
status: **accepted** · date: 2026-07-11
**Décision** : le schéma domaine-codé (déjà porté par les 91 ADR et `C-XXXX-YY`) est canonique ;
le schéma global séquentiel du repo git devient alias legacy (`adr.aliases` du tenant).

---
## PADR-0003 — Le domaine `08 · Reporting & Analytics` est un domaine core de plein droit (ex-D2)
status: **accepted** · date: 2026-07-11
**Décision** : les domaines sont déclarés **en config**, pas par l'arborescence d'un repo ;
08 existe au même titre que 00–07, libellé générique (tout produit BI = profil).

---
## PADR-0004 — Thème unique généré depuis la config (ex-D3)
status: **accepted** · date: 2026-07-11
**Décision** : `branding` → `theme.css` + en-tête HTML commun (`tools/build-theme.mjs`) ; interdiction
de palette en dur dans les livrables ; compatibilité charte `DESIGN.md` de la forge.

---
## PADR-0005 — Core versionné SemVer, démarrage `1.0.0` (ex-D4)
status: **accepted** · date: 2026-07-11
**Décision** : MAJEUR = rupture schéma/retrait contrôle ; MINEUR = ajouts ; PATCH = corrections.
Chaque release documente les standards sources mis à jour (CHANGELOG). Tenants épinglent `core_version`.

---
## PADR-0006 — Langue : core FR, en-têtes MADR EN, i18n EN post-v1 (ex-D5)
status: **accepted** · date: 2026-07-11

---
## PADR-0008 — Domaine `09 · UX & Accessibilité` : optionnel, évolution ADDITIVE (RAF-008)
status: **accepted** · date: 2026-07-12 · decision-makers: propriétaire produit *(revue DA : RAF-013)*
**Contexte** : les contrôles D11 (UX/accessibilité) et 2 contrôles D13 n'avaient aucun domaine
de gouvernance porteur (EXTENSION-CORPUS §3 : ADR0901/0902 proposent un domaine 09) ; or les
9 domaines 00–08 étaient un invariant strict du schéma → un 10ᵉ domaine obligatoire aurait été
une rupture MAJEURE pour tous les tenants.
**Décision** : le domaine `09` est **optionnel** — le schéma accepte 9 ou 10 domaines (00–08
requis, 09 permis) ; les tenants existants restent valides sans modification → évolution
**MINEURE** (SemVer), pas MAJEURE. Le tenant de référence l'active.
**Conséquences** : bon — ADR0901/0902 ont un domaine porteur, les contrôles D11/D13-05 gagnent
leurs `adr_source` ; bon — zéro migration forcée ; vigilance — le catalogue n'affiche 09 que
pour les tenants qui le déclarent (comportement voulu).

---
## PADR-0010 — Les citations ASVS du corpus migrent vers **ASVS 5.0.0** (TF-0221)
status: **accepted** · date: 2026-08-14 · decision-makers: propriétaire produit *(mandat humain, exécution déléguée au pilot)*
**Contexte** : les 22 citations `OWASP ASVS 5.0 — Vxx` des `standards[]` du corpus employaient
la **numérotation de chapitres d'ASVS 4.0.x** — constat établi par recoupement interne
(`MAPPING-CONTROLES-ASVS.md` §7), puis **confirmé sur le texte publié** des deux versions
(`CORRESPONDANCE-ASVS-4.0.x-5.0.0.md`, TF-0205 : 4.0.3 = 14 chapitres, 5.0.0 = 17, quatre
intitulés communs à des numéros différents). Deux options ouvertes : rétablir `ASVS 4.0.3`, ou
migrer vers 5.0.0.
**Décision** : **migration vers ASVS 5.0.0**. Motif : l'**exécution juge déjà sur 5.0.0** — le
référentiel curé de la forge de sécurité web (`referentiels/asvs-l1.md`) est un sous-ensemble
L1 d'ASVS 5.0.0. Rétablir 4.0.3 rendrait les citations exactes mais ferait citer à la
gouvernance une version que **personne n'applique**, et rendrait **inter-versions** le mapping
gouvernance↔exécution construit le 2026-08-14.
**Mise en œuvre** : chaque citation suivie **exigence par exigence** dans le fichier officiel
`mapping_v4.0.3_to_v5.0.0.yml` (278 entrées), jamais par translation de chapitre ; cibles
vérifiées contre l'export JSON officiel 5.0.0. Une exigence éclatée donne une **citation
multiple** (classe B) ; une citation fausse dans les deux versions est corrigée **et signalée
comme erronée** dans le corps de l'ADR (classe C) ; `CTL-D02-01` **perd** sa citation, 4.0.3 V1
n'ayant aucun successeur en 5.0.0. Bilan : **21 réécrites, 1 supprimée, 0 laissée en 4.0.x**
(42 emplacements, miroirs EN compris). Le préfixe `OWASP ASVS 5.0` est conservé : le défaut
portait sur les numéros, pas sur l'étiquette de version.
**Conséquences** : bon — la traçabilité gouvernance → standard redevient suivable, et sur la
même version que l'exécution ; bon — un contrôle porte désormais 0 citation ASVS au lieu d'une
fausse (`CTL-D02-01` : 10 → **9** contrôles cités) ; vigilance — les citations de classe B sont
**volontairement longues** (elles nomment les exigences supprimées/fusionnées) : une citation
courte y serait fausse ; vigilance — toute révision d'ASVS périme ce travail, à rejouer à la
revue `GOUVERNANCE-STANDARDS.md`. Évolution **PATCH** au sens de PADR-0005 (correction de
citations, aucun contrôle retiré ni schéma modifié).

---
## PADR-0011 — Le corpus EN devient **complet et régénérable** (TF-0220)
status: **accepted** · date: 2026-08-14 · decision-makers: propriétaire produit *(mandat humain)*
**Contexte** : `tools/assemble-core.mjs` refuse d'émettre `controls-core-v1.en.json` tant que
`core/controls-en/` ne couvre pas exactement le corpus FR. Il manquait la dimension **D17**
(4 contrôles, PADR-0009) et **2 contrôles de D07** (`CTL-D07-08`, `CTL-D07-09`) — 169/175.
Conséquence : toute correction portée à une source EN **divergeait de son pack** sans recours,
et le blocage était irrésorbable en aval.
**Décision** : compléter le corpus EN à la source (`core/controls-en/D17.json` créé,
`core/controls-en/D07.json` complété), jamais en éditant un fichier généré. Convention
respectée telle qu'elle est en place : `standards[]` **non localisé**, de même que `criticite`,
`profil`, `mode_de_controle`, `enforcement`, `applicabilite` ; formatage du fichier EN calqué
sur celui de son homologue FR.
**Conséquences** : bon — les **deux** packs sortent (175 FR + 175 EN), le refus d'émission n'est
plus un plafond ; bon — parité FR/EN vérifiable mécaniquement (mêmes identifiants, même ordre,
mêmes champs non localisés) ; vigilance — tout contrôle ajouté au FR doit l'être au EN dans le
même mouvement, sans quoi le pack EN cesse d'être émis, **silencieusement** (avertissement, pas
échec).

---
## PADR-0007 — Arborescence produit et nom : `auditcore/`, produit « AuditCore » (P0.3/P0.4)
status: **accepted** · date: 2026-07-11
**Décision** : arborescence `core/ profiles/ config/ deliverables/ tools/ tests/ docs/decisions/`
(cf. README). Nom produit **AuditCore** (éditeur : Digit-AI) — renommable à coût nul (config + README).
**Conséquences** : le dépôt actuel (input/, output/) devient l'espace du tenant de référence ;
les générateurs legacy `output/_generateurs/` sont dépréciés au profit de `auditcore/tools/`
(données d'entrée absentes du repo : chemins locaux du poste d'origine morts — constat d'inventaire).

---
## PADR-0009 — Dimension `D17 · Gouvernance IA` : nouvelle dimension core, additive (TF-0110)
status: **accepted** · date: 2026-08-12 · decision-makers: propriétaire produit
**Contexte** : aucune des 17 dimensions historiques ne porte le risque organisationnel des
systèmes IA (classification de risque, dérive, supervision humaine, documentation de conformité
ISO 42001/NIST AI RMF/EU AI Act) — D04 couvre la conformité réglementaire générale, D14 la qualité
technique des modèles/prompts, ni l'une ni l'autre la gouvernance transverse (ADR0109).
**Décision** : le schéma `core-v1` passe de 17 à **18 dimensions** par ajout de `D17` (famille
`securite`, 4 contrôles v0 `CTL-D17-01..04`) — évolution **additive**, aucun retrait ni fusion des
17 dimensions existantes (invariant `dimensions.yaml` respecté) → **MINEURE** (SemVer, PADR-0005),
pas MAJEURE.
**Conséquences** : bon — un engagement soumis à l'EU AI Act ou à ISO 42001 trouve une dimension
dédiée ; bon — `core/schemas/control.schema.json` et `tenant.schema.json` étendent leur regex de
dimension (`D00`–`D16` → `D00`–`D17`), changement rétrocompatible (aucun tenant existant ne
référence D17) ; vigilance — aucun profil technologique n'instancie encore D17 (backlog v1,
cf. ADR0109 « More Information »).
