<!-- AuditCore template v1 — généré pour {{tenant.name}} via la config ; ne pas éditer les livrables produits à la main -->

# {{tenant.name}} — Présentation à {{roles.decision_authority}} — {{projet.nom}} — {{date}}{{indice}}

> Trame courte (8 diapositives) destinée à {{roles.decision_authority}} pour la décision Gate.
> Reprend les éléments-clés du rapport d'audit complet — jamais de contenu non tracé dans le rapport.

---

## 1 — Titre

{{tenant.name}} · Audit {{projet.nom}} · {{date_longue}} · présenté par {{auditeur.nom}}

---

## 2 — Contexte

- Objet du projet : {{contexte.objet}}
- Périmètre audité : {{contexte.perimetre}} *(renvoi à D00 du rapport d'audit)*
- Motif de la présentation : {{contexte.motif — passage de Gate, jalon, ré-audit}}

---

## 3 — Schéma d'architecture

> Réutilise **tel quel** le schéma d'architecture du rapport d'audit ({{rapport.lien}}, section D01) —
> règle conservée : pas de second schéma divergent.

{{architecture.image_ou_lien}}

---

## 4 — Verdict Gate

| Score global | Statut Gate | Bloquants |
|---|---|---|
| {{score.global}}/5 | **{{gate.verdict}}** | {{gate.nb_bloquants}} dimension(s) ≤ 2 ou Fatal |

---

## 5 — 3 risques majeurs

1. **{{risque_1.titre}}** — {{risque_1.impact}} *(dimension {{risque_1.dimension}}, preuve {{risque_1.preuve_ref}})*
2. **{{risque_2.titre}}** — {{risque_2.impact}} *(dimension {{risque_2.dimension}}, preuve {{risque_2.preuve_ref}})*
3. **{{risque_3.titre}}** — {{risque_3.impact}} *(dimension {{risque_3.dimension}}, preuve {{risque_3.preuve_ref}})*

---

## 6 — Plan de remédiation

| Mode d'activation | Nb actions | % du total | Portage |
|---|---|---|---|
| Automatique (forge-auto) | {{remediation.auto.nb}} | {{remediation.auto.pct}} % | {{roles.remediation_team}} |
| Assisté (forge-assisted) | {{remediation.assiste.nb}} | {{remediation.assiste.pct}} % | {{roles.remediation_team}} + revue humaine |
| Manuel | {{remediation.manuel.nb}} | {{remediation.manuel.pct}} % | Porteur / rôles métier concernés (engagement direct) |

Délai global estimé : {{remediation.delai}} · Effort global estimé : {{remediation.effort}}

---

## 7 — Décision demandée

- [ ] **GO** — mise en production sans réserve
- [ ] **GO sous réserve** — engagements : {{decision.reserves}}
- [ ] **NO-GO** — bloquants à lever : {{decision.bloquants}}

Décision de {{roles.decision_authority}} le {{decision.date}} : {{decision.verdict}}

---

## 8 — Contacts

{{roles.decision_authority}} · {{roles.security_officer}} · Porteur {{porteur.nom}} · Auditeur {{auditeur.nom}}
