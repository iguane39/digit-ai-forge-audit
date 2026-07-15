<!-- AuditCore template v1 — généré pour {{tenant.name}} via la config ; ne pas éditer les livrables produits à la main -->

# {{tenant.name}} — Banc de preuves — {{projet.nom}} — {{date}}{{indice}}

> Format conservé à l'identique : **Règle / Actions d'audit / Preuve attendue / Grille de verdict**,
> un bloc par contrôle applicable. Généré depuis `controls-core-v1.json` (core, ~150 contrôles)
> fusionné avec les bindings du/des profil(s) technologique(s) activé(s) par la config tenant et les
> éventuels durcissements tenant (`packs/constraints/tenant.json`). L'instanciation concrète du
> profil (commande, chemin, plateforme résolus) s'affiche **sous** la règle — jamais à la place de la
> règle générique, qui reste lisible sans le profil.

## {{dim_1.id}} — {{dim_1.label}}

{{dim_1.intro — 1 à 3 phrases de cadrage du domaine et de ses thèmes (cf. référentiel)}}

### {{control.id}} — {{criticite}} · {{bucket}} · enforcement {{enforcement}} · audit {{dimension_audit}}

*Profil(s) : {{control.profil}} · Mode de contrôle : {{control.mode_de_controle}}*

**Règle** : {{control.regle}}

**Actions d'audit** :
- {{control.actions_audit_1}}
- {{control.actions_audit_2}}
- {{control.actions_audit_3 — si écart : formuler l'action de remédiation}}

**Preuve attendue** : {{control.preuve_attendue}}

**Grille de verdict** : conforme = {{control.grille_conforme}} ; partiel = {{control.grille_partiel}} ; non conforme = {{control.grille_non_conforme}}

> Instanciation profil `{{profil.nom}}` : {{control.verification_resolue — commande/chemin/plateforme}}
> Standards : {{control.standards}} · ADR source : {{control.adr_source}} · Dérogation : {{control.derogation}} *(« aucune » par défaut)*

*(Répéter ce bloc `### {{control.id}}…` pour chaque contrôle applicable du domaine {{dim_1.id}}.)*

---

## {{dim_2.id}} — {{dim_2.label}}

{{dim_2.intro}}

### {{control.id}} — {{criticite}} · {{bucket}} · enforcement {{enforcement}} · audit {{dimension_audit}}

*Profil(s) : {{control.profil}} · Mode de contrôle : {{control.mode_de_controle}}*

**Règle** : {{control.regle}}

**Actions d'audit** :
- {{control.actions_audit_1}}
- {{control.actions_audit_2}}

**Preuve attendue** : {{control.preuve_attendue}}

**Grille de verdict** : conforme = {{control.grille_conforme}} ; partiel = {{control.grille_partiel}} ; non conforme = {{control.grille_non_conforme}}

> Instanciation profil `{{profil.nom}}` : {{control.verification_resolue}}
> Standards : {{control.standards}} · ADR source : {{control.adr_source}} · Dérogation : {{control.derogation}}

*(Répéter pour chaque contrôle applicable du domaine {{dim_2.id}}, puis reprendre depuis `## {{dim.id}}` pour chacune des 17 dimensions applicables au type de projet audité — un contrôle `sans_objet` reste tracé avec son motif d'applicabilité.)*
