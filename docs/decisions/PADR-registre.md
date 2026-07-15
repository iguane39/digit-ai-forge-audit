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
## PADR-0007 — Arborescence produit et nom : `auditcore/`, produit « AuditCore » (P0.3/P0.4)
status: **accepted** · date: 2026-07-11
**Décision** : arborescence `core/ profiles/ config/ deliverables/ tools/ tests/ docs/decisions/`
(cf. README). Nom produit **AuditCore** (éditeur : Digit-AI) — renommable à coût nul (config + README).
**Conséquences** : le dépôt actuel (input/, output/) devient l'espace du tenant de référence ;
les générateurs legacy `output/_generateurs/` sont dépréciés au profit de `auditcore/tools/`
(données d'entrée absentes du repo : chemins locaux du poste d'origine morts — constat d'inventaire).
