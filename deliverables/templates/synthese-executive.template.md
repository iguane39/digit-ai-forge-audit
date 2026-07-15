<!-- AuditCore template v1 -->
# {{tenant.name}} — Synthèse exécutive — {{projet.nom}} — {{date}}{{indice}}

> Une page. Ce que {{roles.decision_authority}} doit lire pour décider — le détail est dans le
> rapport complet, le registre des risques et le plan de remédiation.

## Verdict

**{{gate.verdict}}** — GO · GO sous réserve · NO-GO — prononcé par {{roles.decision_authority}} le {{gate.date}}

Score global : {{score.global}}/5 (moyenne pondérée, 17 dimensions) · Bloquants : {{gate.nb_bloquants}} dimension(s) ≤ 2 ou criticité Fatal

## 3 risques majeurs (impact métier)

| # | Risque | Dimension | Impact métier si non traité | Statut |
|---|---|---|---|---|
| 1 | {{risque1.libelle}} | {{risque1.dim}} | {{risque1.impact}} | {{risque1.statut}} |
| 2 | {{risque2.libelle}} | {{risque2.dim}} | {{risque2.impact}} | {{risque2.statut}} |
| 3 | {{risque3.libelle}} | {{risque3.dim}} | {{risque3.impact}} | {{risque3.statut}} |

## 3 décisions attendues de {{roles.decision_authority}}

1. {{decision1.intitule}} — échéance {{decision1.echeance}} ; sans arbitrage : {{decision1.consequence}}
2. {{decision2.intitule}} — échéance {{decision2.echeance}} ; sans arbitrage : {{decision2.consequence}}
3. {{decision3.intitule}} — échéance {{decision3.echeance}} ; sans arbitrage : {{decision3.consequence}}

## Coût et délai de remédiation estimés

| Priorité | Effort cumulé | Délai prévisionnel |
|---|---|---|
| urgent + prio | {{cout.urgent_prio.effort}} | {{cout.urgent_prio.delai}} |
| quick + norm | {{cout.quick_norm.effort}} | {{cout.quick_norm.delai}} |

Budget indicatif (si disponible) : {{cout.budget_indicatif}}

## Prochaine échéance

{{prochaine_echeance.libelle}} — {{prochaine_echeance.date}} ({{prochaine_echeance.nature}})

Nature : `revue Gate` · `re-audit ciblé` · `revue registre des risques`.

## Pour aller plus loin

Rapport complet (dimensions, matrices de traçabilité) · Registre des risques résiduels · Plan de remédiation priorisé · Manifeste de preuves (`{{audit_ref}}`)
