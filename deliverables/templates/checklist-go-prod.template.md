<!-- AuditCore template v1 — généré pour {{tenant.name}} via la config ; ne pas éditer les livrables produits à la main -->

# {{tenant.name}} — Checklist go-prod — {{projet.nom}} — {{date}}{{indice}}

> Liste de préparation à la mise en production : documents génériques core + items ajoutés par pack
> tenant (jamais retirés). Requis exprimé selon les profils d'audit `light` (sous-ensemble) et
> `complet` (liste intégrale) — même convention que le champ `profil` des contrôles du référentiel.

| Document | Requis (light/complet) | Statut | Preuve |
|---|---|---|---|
| Dossier d'architecture technique (DAT) | complet | {{statut.archi}} | {{preuve.archi}} |
| Dossier d'exploitation (DEX) | complet | {{statut.exploitation}} | {{preuve.exploitation}} |
| Documentation d'installation / déploiement (DIT) | complet | {{statut.installation}} | {{preuve.installation}} |
| Documentation utilisateur (DUT) | light | {{statut.utilisateur}} | {{preuve.utilisateur}} |
| Fiche sécurité de mise à disposition | complet | {{statut.securite}} | {{preuve.securite}} |
| Runbooks d'incident (par niveau de criticité) | complet | {{statut.runbooks}} | {{preuve.runbooks}} |
| Plan de réversibilité / rollback | complet | {{statut.reversibilite}} | {{preuve.reversibilite}} |
| Registre des ADR applicables | complet | {{statut.adr}} | {{preuve.adr}} |
| Manifeste de preuves d'audit | complet | {{statut.manifeste}} | {{preuve.manifeste}} |
| Registre des dérogations | light | {{statut.derogations}} | {{preuve.derogations}} |
| Enregistrement au référentiel des applications (CMDB ou équivalent) | light | {{statut.cmdb}} | {{preuve.cmdb}} |
| Rapport d'audit complet + Reprise applicative renseignée | complet | {{statut.rapport}} | {{preuve.rapport}} |
| Registre des risques résiduels (dérogations actives) | light | {{statut.risques}} | {{preuve.risques}} |
| {{item_tenant.label}} *(ajouté par pack tenant)* | {{item_tenant.profil}} | {{item_tenant.statut}} | {{item_tenant.preuve}} |

## Statuts

`fourni` · `partiel` · `manquant` · `sans objet` — même sémantique que la Reprise applicative du
rapport d'audit : valeur/preuve en clair attendue, jamais un simple renvoi à une source.

## Notes

- Sous-ensemble volontairement synthétique de la Reprise applicative du rapport d'audit : en cas de
  divergence, la Reprise applicative fait foi.
- Un document `complet` au statut `manquant` est reporté comme bloquant dans le plan de remédiation.

## Verdict de préparation

| Score global | Statut Gate | Documents manquants (requis) |
|---|---|---|
| {{score.global}}/5 | {{gate.verdict}} | {{gap.nb}} — {{gap.liste}} |

La mise en production n'est proposée à {{roles.decision_authority}} que lorsque tous les documents
`complet` sont au statut `fourni` (ou dérogation tracée dans le registre des dérogations).
