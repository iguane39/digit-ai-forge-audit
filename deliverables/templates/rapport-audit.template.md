<!-- AuditCore template v1 — généré pour {{tenant.name}} via la config ; ne pas éditer les livrables produits à la main -->

# {{tenant.name}} — Rapport d'audit — {{projet.nom}} — {{date}}{{indice}}

> Référentiel core {{core_version}} · 17 dimensions · 6 familles · scoring 1–5.
> Diffusion : {{roles.decision_authority}} · {{projet.sponsor}} · {{porteur.nom}}.

## Bandeau Gate

**{{gate.verdict}}** *(GO · GO sous réserve · NO-GO)* — prononcé par {{roles.decision_authority}}

| Projet | Version auditée | Date d'audit | Version rapport | Auditeur | Environnement audité |
|---|---|---|---|---|---|
| {{projet.nom}} | commit {{projet.commit}} | {{date_longue}} | V{{indice}} · {{date_longue}} | {{auditeur.nom}} | {{projet.lien_environnement}} |

## Synthèse

**Carte Fonctionnelle** — {{synthese.fonctionnelle.titre}}
{{synthese.fonctionnelle.puce_1}} · {{synthese.fonctionnelle.puce_2}} · {{synthese.fonctionnelle.puce_3}}

**Carte Technique** — {{synthese.technique.titre}}
{{synthese.technique.puce_1}} · {{synthese.technique.puce_2}} · {{synthese.technique.puce_3}}

**Carte Audit** — approche evidence-based
Audit conduit le {{date_longue}} par {{auditeur.nom}} · {{synthese.audit.nb_scans}} scans automatisés ({{synthese.audit.outils}}) + revue statique + inspections manuelles.

**KPI**

| Score global | Statut Gate | Bloquants |
|---|---|---|
| {{score.global}}/5 — moyenne pondérée sur 17 dimensions | {{gate.verdict}} | {{gate.nb_bloquants}} — dimensions notées ≤ 2 ou criticité Fatal |

## D00 — Périmètre fonctionnel & valeur métier

> Page dédiée, en tête du rapport : référence stable pour cadrer les dimensions techniques qui suivent (règle éditoriale conservée).

- Cas d'usage : {{d00.cas_usage}}
- Personas / utilisateurs : {{d00.personas}}
- Règles de gestion : {{d00.regles_gestion}}
- KPIs métier : {{d00.kpis_metier}}
- Hors périmètre : {{d00.hors_perimetre}}
- Gouvernance produit : {{d00.gouvernance}}

## Scores par famille

> Radar sur les 6 familles — chaque point = moyenne pondérée des dimensions de la famille.

| Famille | Score /5 |
|---|---|
| Fonctionnel | {{famille.fonctionnel.score}} |
| Architecture | {{famille.architecture.score}} |
| Sécurité | {{famille.securite.score}} |
| Données & IA | {{famille.donnees_ia.score}} |
| FinOps | {{famille.finops.score}} |
| Opérations | {{famille.operations.score}} |

## Familles → Dimensions (onglets)

Catalogue core par famille (relabel cosmétique autorisé, suppression interdite) :
- Fonctionnel : D00 · Architecture : D01, D06, D09 · Sécurité : D02, D03, D04
- Données & IA : D05, D14, D15, D16 · FinOps : D07 · Opérations : D08, D10, D11, D12, D13

Pour chaque dimension applicable au type de projet (matrice d'applicabilité du référentiel), dupliquer le bloc suivant :

### {{dim.id}} — {{dim.label}}
Famille {{dim.famille}} · criticité {{dim.criticite}} · gate1b {{dim.gate1b}}

- {{dim.resume_puce_1}}
- {{dim.resume_puce_2}}
- {{dim.resume_puce_3}}

Périmètre : {{dim.perimetre}} *(omis si redondant avec D00 — règle éditoriale B.2)*

**Matrice de traçabilité** — mode ADR si ≥ 1 règle rattachée à la dimension, sinon mode constat :

| Règle | Verdict | Constats & preuves (fichier:ligne) | Plan d'action |
|---|---|---|---|
| {{regle.id}} | {{regle.verdict}} | {{constat.titre}} — {{preuve.ref}} | {{action.titre}} ({{action.tag}}) |

*(Mode constat — aucune règle rattachée : 1ʳᵉ colonne = `Constat` (titre + sévérité) ; preuves et plan d'action inchangés.)*

Note de l'autorité : {{dim.note_da}}

## Toutes les règles (onglet transversal)

> 100 % des règles applicables renseignées — le vérificateur bloque la diffusion sinon.

| ID | Verdict (5 états) | Preuve constatée | Remédiation possible | Dim. | Crit. | Enforcement |
|---|---|---|---|---|---|---|
| {{regle.id}} | {{regle.verdict}} | {{regle.preuve_apportee}} | {{regle.remediation_possible}} | {{regle.dimension}} | {{regle.criticite}} | {{regle.enforcement}} |

*(Verdicts : conforme · partiel · non_conforme · sans_objet · a_evaluer — une ligne par règle applicable.)*

## Reprise applicative

> Un bloc par famille ; valeur en clair par item. Statuts : `ok` constaté · `partial` incomplet · `gap` manquant (plan d'action) · `manual` engagement porteur.

### {{famille.label}}

| Item | Valeur | Statut |
|---|---|---|
| {{item.label}} | {{item.valeur}} | {{item.statut}} |

## Annexes

- Manifeste de preuves : {{annexes.manifeste_preuves_lien}}
- Registre des dérogations : {{annexes.registre_derogations_lien}}
- Méthodologie & version du core : {{core_version}}

## Note d'intégration HTML

Le Markdown est la source de vérité versionnable. Le rendu HTML autonome injecte le thème via `{{theme.css}}` + `{{header.html}}`, générés par `build-theme.mjs` depuis `branding.*` de la config tenant — aucune couleur, police ou marque n'est en dur dans ce gabarit.

**Gates de diffusion conservés** : diffusable uniquement si le vérificateur de format passe (0 placeholder résiduel, 17 dimensions valides, verdicts complets) ; rapport **auto-portant** (aucune référence à un audit antérieur, statuts au présent).
