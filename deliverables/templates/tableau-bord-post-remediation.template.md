<!-- AuditCore template v1 -->
# Tableau de bord post-remédiation — {{tenant.name}} — {{projet.nom}} — {{audit.prev}} → {{audit.curr}}

> Mesure l'impact réel des remédiations entre deux audits. Ne remplace pas un audit complet :
> seuls les contrôles liés aux actions soldées sont rejoués (audit incrémental, `06-remediation-forge.md` §4) ;
> un audit complet reste nécessaire pour re-sceller le rapport (règle « feuille blanche »).

## 1. Delta de scores par dimension

| Dim. | Famille | Score {{audit.prev}} | Score {{audit.curr}} | Δ | Statut |
|---|---|---|---|---|---|
| {{dim.id}} | {{dim.family}} | {{dim.score_prev}} | {{dim.score_curr}} | {{dim.delta}} | {{dim.tendance}} |

Tendance : `progression` · `stable` · `régression`.

## 2. Delta de scores par famille (radar, 6 axes)

| Famille | Score {{audit.prev}} | Score {{audit.curr}} | Δ |
|---|---|---|---|
| Fonctionnel | {{f.fonctionnel.prev}} | {{f.fonctionnel.curr}} | {{f.fonctionnel.delta}} |
| Architecture | {{f.architecture.prev}} | {{f.architecture.curr}} | {{f.architecture.delta}} |
| Sécurité | {{f.securite.prev}} | {{f.securite.curr}} | {{f.securite.delta}} |
| Données & IA | {{f.donnees-ia.prev}} | {{f.donnees-ia.curr}} | {{f.donnees-ia.delta}} |
| FinOps | {{f.finops.prev}} | {{f.finops.curr}} | {{f.finops.delta}} |
| Opérations | {{f.operations.prev}} | {{f.operations.curr}} | {{f.operations.delta}} |

## 3. Avancement du plan de remédiation (% actions soldées par priorité)

| Priorité | Actions totales | Soldées | % soldé | Restantes |
|---|---|---|---|---|
| urgent | {{plan.urgent.total}} | {{plan.urgent.soldees}} | {{plan.urgent.pct}} % | {{plan.urgent.restantes}} |
| prio | {{plan.prio.total}} | {{plan.prio.soldees}} | {{plan.prio.pct}} % | {{plan.prio.restantes}} |
| quick | {{plan.quick.total}} | {{plan.quick.soldees}} | {{plan.quick.pct}} % | {{plan.quick.restantes}} |
| norm | {{plan.norm.total}} | {{plan.norm.soldees}} | {{plan.norm.pct}} % | {{plan.norm.restantes}} |

## 4. Taux d'automatisation constaté (exécuté vs planifié)

| Mode | Planifié (%) | Constaté (%) |
|---|---|---|
| forge-auto | {{auto.forge_auto.plan}} | {{auto.forge_auto.constate}} |
| forge-assisted | {{auto.forge_assisted.plan}} | {{auto.forge_assisted.constate}} |
| manual | {{auto.manual.plan}} | {{auto.manual.constate}} |

> **Rappel du garde-fou** (`06-remediation-forge.md` §5) : ce taux reste un indicateur suivi,
> jamais un objectif — **l'audit juge tout, la forge exécute sa part**. Un écart planifié/constaté
> ne justifie pas d'assouplir un contrôle ; il documente une rétrogradation `forge-assisted`/`manual` motivée.

## 5. Contrôles rejoués (re-audit ciblé)

| Contrôle | Dim. | Verdict {{audit.prev}} | Verdict {{audit.curr}} | Preuve rejouée |
|---|---|---|---|---|
| {{ctrl.id}} | {{ctrl.dim}} | {{ctrl.verdict_prev}} | {{ctrl.verdict_curr}} | {{ctrl.evid_ref}} (manifeste) |

Seuls les contrôles rattachés à une action **soldée** sont rejoués ici ; les autres restent au statut du rapport {{audit.prev}} jusqu'au prochain audit complet.
