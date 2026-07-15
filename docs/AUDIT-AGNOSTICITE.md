# AUDIT-AGNOSTICITE — Audit des 65 ADRs core (verdicts, corrections, pérennisation)

> Audit exhaustif du corpus `core/adr/` contre la règle d'arrêt du modèle d'abstraction
> ([PLAN/01 §3](../../PLAN/01-modele-abstraction.md)) — réalisé le 2026-07-12, corrections
> appliquées, non-régression prouvée, gate CI livré (`tools/lint-agnostic.mjs`).

## 1. Méthode (3 niveaux — ce que le simple grep ne voyait pas)

Point de départ honnête : le contrôle automatique de la batterie v1.0 (8 noms durs, corps
d'ADRs) donnait déjà **0 fuite** — la prémisse « certains ADRs ne semblent pas agnostiques
(ex azure) » était donc fausse au sens littéral. L'audit a élargi la question :

| Niveau | Ce qu'on cherche | Zone |
|---|---|---|
| **N1 · noms durs** | éditeurs/produits/services commerciaux (liste élargie ~40 termes : Entra, APIM, Key Vault, Purview, Unity Catalog, DirectQuery, sops…) — les **spécifications ouvertes** restent autorisées (OAuth2, OIDC, OpenAPI, OpenTelemetry, SemVer, SLSA, WCAG, Kimball…) | corps normatif (hors frontmatter `standards[]`, hors `## More Information`) |
| **N2 · biais conceptuels** | vocabulaire façonné éditeur ou présupposé de modèle de livraison (« zones d'atterrissage » = Cloud Adoption Framework ; « SaaS→PaaS→IaaS » = présuppose l'achat cloud ; « import » BI…) | corps normatif |
| **N3 · exceptions légitimes** | mentions produits dans `More Information → Instanciations par profil` et `standards[]` — **conformes par conception** (c'est le mécanisme core/profil qui fonctionne) | zones d'exception |

Chaque ADR audité par lecture intégrale (2 auditeurs indépendants par moitié de corpus),
priorité aux 58 ADRs marqués `core+profile` dans le mapping 91→core, preuves ligne à ligne.

## 2. Bilan 65/65

| Verdict | Nombre | Détail |
|---|---|---|
| **conforme** | **60** | corps normatif vierge ; 39 exceptions N3 recensées (preuve que les produits vivent bien dans la zone prévue) |
| **à reformuler** | **5** | 10 constats (1 N1 + 9 N2) — **tous corrigés le 2026-07-12** (§3) |
| **à déplacer en profil** | **0** | aucune exigence intrinsèquement liée à une technologie — le découpage core/profil de la conception tient |

## 3. Constats et corrections appliquées (avant → après)

| ADR | Niv. | Constat (ligne) | Correction appliquée |
|---|---|---|---|
| ADR0101 | N2 ×4 | « zones d'atterrissage » (vocabulaire CAF d'un éditeur) au titre (l.14), dans les options (l.33), la décision (l.39) et les pros/cons (l.62) | « **zonage cloisonné** (distinct) » — vocabulaire que l'ADR employait déjà dans sa section Confirmation |
| ADR0103 | N2 | « rattachement déduit du **groupe de ressources** » (l.34, option rejetée) | « rattachement déduit du **périmètre d'hébergement ou de gestion** » |
| ADR0201 | **N1** | « (**sops/age** ou équivalent) » (l.33, option rejetée) — produits OSS nommés ; constat notable : la fuite venait de **l'ADR exemplaire** lui-même | « (**outillage de chiffrement de fichiers**) » |
| ADR0502 | N2 ×3 | « SaaS → PaaS → IaaS » au titre (l.15), option (l.34), décision (l.40) — présuppose l'achat cloud | corps reformulé en « **délégation d'exploitation maximale** » (valable cloud **et** sur site) ; l'échelle SaaS→PaaS→IaaS **déplacée en More Information** comme instanciation cloud, sourcée **NIST SP 800-145** (ajouté aux `standards[]`) ; ajout de l'échelle sur-site équivalente |
| ADR0805 | N2 | « mode de connexion (**import** intégral, interrogation directe, cache intermédiaire) » (l.18) — trichotomie calquée sur un produit BI | « **stratégie d'accès** (extraction complète en mémoire, interrogation directe de la source, **ou approche hybride**) » — énumération ouverte, vocabulaire neutre |

Arbitrage documenté : SaaS/PaaS/IaaS sont des termes **NIST 800-145** (pas des marques) —
le problème n'était pas le vocabulaire mais le **présupposé cloud** de l'exigence ; la
correction conserve l'échelle comme exemple cloud dans la zone d'exception.

## 4. Non-régression (exécutée après corrections)

```
✔ lint agnosticité : 0 finding — 150 contrôles + corpus ADR conformes (zones normatives)
✔ assemble-core    : 150 contrôles, 0 invalide, 0 sans standard (0 ADR retouché par réconciliation)
✔ ISO-COMPORTEMENT : 91/91 (les reformulations ne touchent pas les buckets historiques)
✔ kits tenant réf. : régénérés (20260712b, compliance 7 + audit 23 entrées)
```

## 5. Pérennisation — `tools/lint-agnostic.mjs` (livré, pas seulement spécifié)

Gate CI exécutable : scanne le **corps normatif** des ADRs (hors frontmatter/More Information)
et les **champs textuels des 150 contrôles** contre la denylist N1 (~40 termes) et les motifs
N2 ; frontières **Unicode** (le `\b` ASCII de JS matchait « Entra » dans « entr**a**înement » —
faux positif corrigé) ; `exit 1` au moindre finding.

Règle d'usage : **tout nouvel ADR/contrôle passe le lint avant merge** ; enrichir la denylist
à chaque nouveau profil technologique ajouté. Limite assumée : le lint attrape les noms durs
et les motifs N2 *connus* — les biais conceptuels *nouveaux* restent du ressort de la revue
humaine (l'ajouter à la checklist de revue du corpus, P2.1 du plan).

## 6. Les 39 exceptions N3 (échantillon — le mécanisme fonctionne)

`profil:azure → Key Vault / API Management / Purview / groupes de gestion…`,
`profil:databricks-lakehouse → médaillon bronze/silver/gold`, `profil:powerbi → jeu de
données certifié`, `standards: SRE (Google)` — toutes confinées aux zones prévues par le
modèle ; c'est exactement la séparation *quoi (core) / comment (profil)* voulue par PADR-0001.
