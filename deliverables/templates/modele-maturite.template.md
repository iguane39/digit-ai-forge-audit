<!-- AuditCore template v1 -->
# Modèle de maturité par dimension — {{tenant.name}} — {{projet.nom}}

> Formalise le scoring core (1–5, `dimensions.yaml`) en trajectoire de progression : ce que
> signifie concrètement passer d'un niveau au suivant, par famille. Aucun score n'est affecté
> sans preuve (invariant core) ; cette grille sert de référentiel de lecture, pas de barème auto-calculé.

## 1. Échelle core (invariante — structure non relabellisable)

| Niveau | Libellé | Lecture |
|---|---|---|
| 1 | Bloquant | Absence de contrôle, ou non-conformité de criticité Fatal/Bloquant non traitée |
| 2 | Insuffisant | Premiers éléments identifiés, non tenus dans la durée, preuves partielles |
| 3 | Acceptable | Exigences opposables couvertes, preuves recevables, marge de progrès identifiée |
| 4 | Solide | Pratiques consolidées, outillées, documentées, tenues dans la durée |
| 5 | État de l'art | Amélioration continue mesurée, benchmark externe, automatisation bout en bout |

## 2. Critères de passage génériques par famille

| Famille | 1 → 2 | 2 → 3 | 3 → 4 | 4 → 5 |
|---|---|---|---|---|
| Fonctionnel | Cas d'usage esquissé, non validé par le sponsor | Périmètre documenté et validé, hors-périmètre explicite | KPIs métier instrumentés, règles de gestion tracées jusqu'au code | Boucle de valeur mesurée en continu, réévaluation périodique du cas d'usage |
| Architecture | Cible d'architecture non validée | ADR clés tracées mais partielles | ADR complètes respectées, CI/CD industrialisé | Dette technique pilotée, scalabilité démontrée en charge, revue périodique |
| Sécurité | Inventaire des risques amorcé | Contrôles opposables couverts a minima (IAM, secrets) | Contrôles Fatal/Bloquant conformes, scans automatisés continus | Tests d'intrusion réguliers, zéro dérogation non revue |
| Données & IA | Premiers contrôles qualité ad hoc | Règles de qualité outillées partiellement, modèles non gouvernés | Qualité mesurée en continu, modèles documentés et évalués (biais, dérive) | Gouvernance mature, traçabilité complète, ré-entraînement piloté par métriques |
| FinOps | Relevés de coûts ponctuels | Suivi en place, budgets définis, écarts non expliqués | FinOps outillé (alertes, tagging), optimisations récurrentes | Coût unitaire piloté par métrique métier, forecast fiable |
| Opérations | Logs bruts non exploités | Observabilité minimale, run partiellement documenté | SLO définis et suivis, documentation à jour, CI testée | Amélioration continue outillée (post-mortems), documentation vivante |

## 3. Application par dimension (répéter pour les 17 dimensions applicables)

| Dim. | Libellé | Famille | Score {{audit.prev}} | Score {{audit.curr}} | Prochain palier | Preuve clé (fichier:ligne) |
|---|---|---|---|---|---|---|
| {{dim.id}} | {{dim.label}} | {{dim.family}} | {{dim.score_prev}} | {{dim.score_curr}} | {{dim.palier_suivant}} | {{dim.preuve_ref}} |

> Chaque ligne reprend la grille de sa famille (§2), ajustée aux thèmes propres de la dimension
> (voir contrôles `CTL-{{dim.id}}-*`). Le « prochain palier » cite le ou les critères non encore franchis.

## 4. Cible par type de projet

| Type de projet | Score cible global | Dimensions à seuil renforcé (≥4) |
|---|---|---|
| web-app | {{cible.web-app}} | D02, D03, D11 |
| api | {{cible.api}} | D02, D03, D06 |
| data | {{cible.data}} | D05, D15, D16 |
| mobile | {{cible.mobile}} | D02, D11 |
| ml | {{cible.ml}} | D05, D14, D15 |
| infra | {{cible.infra}} | D02, D03, D09 |

## 5. Radar de progression {{audit.prev}} → {{audit.curr}}

| Famille | Score {{audit.prev}} | Score {{audit.curr}} | Δ | Tendance |
|---|---|---|---|---|
| Fonctionnel | {{radar.fonctionnel.prev}} | {{radar.fonctionnel.curr}} | {{radar.fonctionnel.delta}} | {{radar.fonctionnel.tendance}} |
| Architecture | {{radar.architecture.prev}} | {{radar.architecture.curr}} | {{radar.architecture.delta}} | {{radar.architecture.tendance}} |
| Sécurité | {{radar.securite.prev}} | {{radar.securite.curr}} | {{radar.securite.delta}} | {{radar.securite.tendance}} |
| Données & IA | {{radar.donnees-ia.prev}} | {{radar.donnees-ia.curr}} | {{radar.donnees-ia.delta}} | {{radar.donnees-ia.tendance}} |
| FinOps | {{radar.finops.prev}} | {{radar.finops.curr}} | {{radar.finops.delta}} | {{radar.finops.tendance}} |
| Opérations | {{radar.operations.prev}} | {{radar.operations.curr}} | {{radar.operations.delta}} | {{radar.operations.tendance}} |

> 6 axes = 6 familles ; alimente le radar SVG de la sortie HTML. `{{audit.prev}}` absent au premier audit (radar à un seul axe rempli).

## 6. Règles

- « Pas de score sans preuve » : aucune case des §3/§5 ne se remplit sans preuve `fichier:ligne` ou entrée du manifeste (`manifeste-preuves.schema.json`).
- Score global = moyenne pondérée sur les 17 dimensions (`dimensions.yaml#scoring.global`).
- Bloquants = dimensions notées ≤ 2 ou de criticité Fatal — repris tels quels dans la synthèse exécutive.
