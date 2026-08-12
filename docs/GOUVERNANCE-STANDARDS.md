# GOUVERNANCE-STANDARDS — Revue récurrente des standards sources (RAF-017)

> Le core cite ses standards (`standards[]` obligatoire) ; **eux évoluent**. Ce processus
> empêche la dérive silencieuse. Rythme : **semestriel** (janvier / juillet) — jamais
> « terminé », toujours re-planifié. Propriétaires : équipe produit (préparation IA) +
> `{roles.decision_authority}` du tenant de référence (arbitrages).

## Checklist de revue (à dérouler à chaque itération)

1. **Inventaire des versions** : pour chaque standard du CHANGELOG (état à la release),
   vérifier la version courante publiée (OWASP ASVS/Top 10/SAMM, WCAG, ISO/IEC 25010/27001/
   27002/27701/42001, NIST CSF/SSDF/800-63B/800-207/AI RMF, CIS v8, DORA (Accelerate), RGPD, AI Act
   (actes délégués !), SLSA, DMBOK, SemVer, OpenAPI, EN 301 549, FinOps Framework (Scopes,
   maturité Crawl/Walk/Run — TF-0110)).
2. **Delta → impact** : toute nouvelle version majeure → lister les clauses nouvelles/retirées
   → croiser avec la matrice standards↔corpus (EXTENSION-CORPUS §2, à re-générer).
3. **Issues** : chaque impact = un item RAF (ajout/modification d'ADR ou de contrôle),
   versionné SemVer (clause retirée = potentiel MAJEUR).
4. **Veille juridictions** (alimente RAF-011) : nouvelles réglementations applicables par
   juridiction active des tenants.
5. **Lint** : enrichir la denylist `lint-agnostic` des nouveaux produits rencontrés ;
   dérouler la checklist N2 (biais conceptuels) sur tout ADR ajouté depuis la dernière revue.
6. **Trace** : consigner la revue ci-dessous + mettre à jour le CHANGELOG produit (et le registre du dépôt d'engagement s'il y a lieu).

## Journal des revues

| # | Date | Conclusion | Prochaine échéance |
|---|---|---|---|
| 1 | 2026-07-12 | Revue initiale à la release 1.4/1.5 : versions des standards = état de l'art à date (corpus créé les 11-12/07/2026, aucun delta possible) ; ambiguïté « DORA » levée (renommage « DORA (Accelerate) », vigilance UE 2022/2554 tracée RAF-024) ; AI Act art. 26-27 en cours d'intégration (RAF-009). | **2027-01** |
| 2 | 2026-08-12 | TF-0110 : ajout NIST AI RMF (ISO 42001/EU AI Act déjà présents) → nouvelle dimension `D17 · Gouvernance IA` (ADR0109, PADR-0009) ; ADR0107 (coûts FinOps) réaligné sur le FinOps Framework 2025/2026 (Scopes, maturité Crawl/Walk/Run par capability) ; pilier soutenabilité statué (ADR0110 — adopté en extension de D07, promotion en dimension dédiée différée, cf. ADR0110). | **2027-01** |
