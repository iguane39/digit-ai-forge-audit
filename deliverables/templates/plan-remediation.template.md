<!-- AuditCore template v1 -->
# Plan de remédiation priorisé — {{tenant.name}} — {{projet.nom}}

> Vue consolidée et exécutable de toutes les actions REM issues des 17 dimensions — triées
> priorité × effort. **Entrée directe de la forge** : cette vue est une projection lisible de
> `remediation-actions.yaml` (voir `remediation-actions.schema.json`) ; l'adaptateur forge
> (composant à construire — voir `06-remediation-forge.md` §4) consomme le même fichier pour
> générer `epics.md` — aucune ressaisie manuelle entre l'audit et la forge.

## 1. Actions par priorité (tri urgent → prio → quick → norm, puis effort croissant)

### Urgent (`urgent`)
| ID | Titre | Dim. | Sévérité | Effort | Mode d'activation | Propriétaire | Statut |
|---|---|---|---|---|---|---|---|
| {{action.id}} | {{action.title}} | {{action.dim}} | {{action.severity}} | {{action.effort}} | {{action.activation.mode}} | {{action.owner}} | {{action.statut}} |

### Prio (`prio`)
| ID | Titre | Dim. | Sévérité | Effort | Mode d'activation | Propriétaire | Statut |
|---|---|---|---|---|---|---|---|
| {{action.id}} | {{action.title}} | {{action.dim}} | {{action.severity}} | {{action.effort}} | {{action.activation.mode}} | {{action.owner}} | {{action.statut}} |

### Quick win (`quick`)
| ID | Titre | Dim. | Sévérité | Effort | Mode d'activation | Propriétaire | Statut |
|---|---|---|---|---|---|---|---|
| {{action.id}} | {{action.title}} | {{action.dim}} | {{action.severity}} | {{action.effort}} | {{action.activation.mode}} | {{action.owner}} | {{action.statut}} |

### Normal (`norm`)
| ID | Titre | Dim. | Sévérité | Effort | Mode d'activation | Propriétaire | Statut |
|---|---|---|---|---|---|---|---|
| {{action.id}} | {{action.title}} | {{action.dim}} | {{action.severity}} | {{action.effort}} | {{action.activation.mode}} | {{action.owner}} | {{action.statut}} |

## 2. Modes d'activation (rappel de l'arbre de décision, `06-remediation-forge.md` §3)

| Mode | Sens | Propriétaire par défaut |
|---|---|---|
| `forge-auto` | Repo modifié, profil résolu, acceptation machine-vérifiable — story exécutée en worktree, double gate, HITL-2 au merge | {{roles.remediation_team}} |
| `forge-assisted` | Repo modifié mais gate ou acceptation non intégralement automatisable — exécution outillée, revue humaine obligatoire | {{roles.remediation_team}} |
| `manual` | Aucun changement de repo (nomination, comité, contrat, dérogation) | `activation.owner_role` (nommé, jamais « l'équipe ») |

Une action `manual` n'est **jamais** silencieusement écartée : elle reste dans ce plan avec son propriétaire, au même rang de priorité que les autres.

## 3. Taux d'automatisation (mesuré, affiché — jamais objectivé)

| Mode | Nombre d'actions | % du total |
|---|---|---|
| forge-auto | {{automatisation.forge_auto.n}} | {{automatisation.forge_auto.pct}} % |
| forge-assisted | {{automatisation.forge_assisted.n}} | {{automatisation.forge_assisted.pct}} % |
| manual | {{automatisation.manual.n}} | {{automatisation.manual.pct}} % |

> Garde-fou (`06-remediation-forge.md` §5) : ce taux est un **indicateur suivi, pas un objectif**.
> Le périmètre d'audit ne se réduit jamais à « ce que la forge sait réparer » — **l'audit juge
> tout, la forge exécute sa part**. Toute rétrogradation `forge-auto` → `forge-assisted` au moindre
> doute (règle §3.3) reste tracée ici avec son motif (`activation.reason`).

## 4. Traçabilité

Chaque ligne référence `finding_ref` (constat) et `control_ref` (contrôle violé) et, si la preuve est déjà capturée, une entrée de `manifeste-preuves.schema.json`. Le statut « soldé » n'est posé qu'après vérification (`verification.command` / `evidence_expected`) — jamais sur déclaratif seul.
