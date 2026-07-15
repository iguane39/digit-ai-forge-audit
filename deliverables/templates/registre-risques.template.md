<!-- AuditCore template v1 -->
# Registre des risques résiduels — {{tenant.name}} — {{projet.nom}}

> Trace les non-conformités **sciemment acceptées** (dérogation accordée sur un contrôle
> `non_conforme`, champ `derogation` de `control.schema.json`). Un `non_conforme` **sans**
> dérogation n'entre pas ici : il va au plan de remédiation (`plan-remediation.template.md`).

## 1. Registre

| ID | Risque | Constat source | Dérogation | Propriétaire | Échéance de revue | Statut |
|---|---|---|---|---|---|---|
| {{risque.id}} | {{risque.libelle}} | {{risque.constat_ref}} | {{risque.derogation.motif}} — accordée le {{risque.derogation.date}} par {{risque.derogation.approbateur}} | {{risque.proprietaire}} | {{risque.echeance_revue}} | {{risque.statut}} |

- **ID** : `RISK-{{dim.id}}-{{seq}}` (ex. `RISK-D03-001`).
- **Risque** : reformulation métier du constat — l'impact si le risque se matérialise, pas la reformulation technique du contrôle.
- **Constat source** : référence de la matrice de traçabilité (`CST-{{dim.id}}-{{seq}}`, renvoi fichier:ligne du rapport).
- **Dérogation** : motif, date d'octroi, approbateur — reprend tel quel le champ `derogation` du contrôle ; jamais de dérogation sans échéance de revue.
- **Propriétaire** : un rôle `{{roles.*}}` nommé, jamais « l'équipe » — voir mapping §2.
- **Statut** : voir §3.

## 2. Mapping propriétaires (`roles.*`)

| Nature du risque | Propriétaire par défaut |
|---|---|
| Sécurité / IAM / conformité réglementaire | {{roles.security_officer}} |
| Architecture / dette technique / FinOps | {{roles.decision_authority}} |
| Données / IA / qualité | {{roles.data_roles.owner}} |
| Portée transverse / arbitrage | {{roles.change_board}} |

## 3. Statuts et cadence de revue périodique

| Statut | Signification |
|---|---|
| actif | dérogation valide, échéance non atteinte |
| sous surveillance | échéance proche (< 30 jours) ou indicateur associé en dégradation |
| expiré | échéance dépassée sans revue tracée — traité comme `non_conforme` sans dérogation jusqu'à revue |
| clos | contrôle redevenu conforme, ou risque supprimé (changement de périmètre) |

**Cadence de revue** (fonction de la criticité du contrôle sous dérogation) :

| Criticité | Cadence |
|---|---|
| Fatal | trimestrielle |
| Bloquant | trimestrielle |
| Majeur | semestrielle |
| Standard | annuelle |

**Règles** :
1. Une dérogation sans échéance de revue est refusée par le vérificateur de rapport.
2. À l'échéance dépassée sans revue tracée : statut → `expiré`, escalade automatique vers {{roles.change_board}}.
3. Toute revue (renouvellement, clôture, escalade) est elle-même une preuve : `fichier:ligne` ou entrée du manifeste de preuves.
4. Un registre non vide n'est pas un défaut d'audit — un registre non tenu (échéances dépassées non escaladées) l'est.
