<!-- AuditCore template v1 — généré pour {{tenant.name}} via la config ; ne pas éditer les livrables produits à la main -->

# {{tenant.name}} — Matrice de traçabilité — {{projet.nom}} — {{date}}{{indice}}

> Moteur core inchangé : reliage **constat ↔ preuve ↔ règle ↔ action**, un jeu de lignes par
> dimension. Deux modes d'affichage, choisis automatiquement par dimension (jamais mélangés sur une
> même ligne) :
> - **Mode ADR** (≥ 1 règle/contrôle rattaché à la dimension) : la ligne part de la règle.
> - **Mode constat** (aucune règle rattachée) : la ligne part du constat brut.

## Règle absolue : aucun lien fabriqué

Un constat, une preuve ou une action n'apparaît sur une ligne que s'il existe un **lien réel et
vérifiable** entre les deux (même contrôle cité, même fichier/section, même échange tracé). Une
cellule sans lien authentique reste **vide** — jamais complétée par un rapprochement de circonstance
pour « faire complet ». Une ligne incomplète et honnête prévaut toujours sur une ligne fabriquée.

## Mode ADR

| Règle / Contrôle | Verdict | Constat(s) | Preuve(s) (fichier:ligne) | Plan d'action | ⚠ |
|---|---|---|---|---|---|
| {{regle.id}} — {{regle.libelle}} | {{regle.verdict}} | {{constat.titre}} | {{preuve.ref}} | {{action.titre}} ({{action.tag}}) | {{regle.flag}} |

## Mode constat

| Constat | Sévérité | Preuve(s) (fichier:ligne) | Règle/ADR lié (si applicable) | Plan d'action | ⚠ |
|---|---|---|---|---|---|
| {{constat.titre}} | {{constat.severite}} | {{preuve.ref}} | {{constat.adr_lies}} *(« — » si aucun)* | {{action.titre}} | {{constat.flag}} |

## Drapeau ⚠ « à couvrir »

Posé automatiquement quand au moins une condition est vraie :
- règle d'enforcement `blocking`/`required` sans aucun constat ni preuve associés ;
- constat de sévérité critique/majeur sans action de plan associée ;
- preuve citée sans référence `fichier:ligne` (ou type de preuve non résolu) ;
- verdict `a_evaluer` sans motif renseigné.

Une ligne « à couvrir » ne bloque pas à elle seule le Gate, mais le rapport n'est pas diffusable tant
qu'elle n'est pas résolue en `conforme / partiel / non_conforme / sans_objet` motivé (vérificateur de
format).

## Filtres

| Filtre | Valeurs | Usage |
|---|---|---|
| Dimension | D00 à D17 | isoler une dimension du référentiel |
| Criticité | Fatal · Bloquant · Majeur · Standard | prioriser la lecture par gravité |
| Enforcement | blocking · required · advisory · recommendation | isoler ce qui pèse sur le Gate |
| Verdict | conforme · partiel · non_conforme · sans_objet · a_evaluer | suivre l'avancement |
| Couverture | avec preuve · sans preuve · ⚠ à couvrir | auditer la matrice elle-même |
| Texte libre | — | recherche sur règle, constat ou preuve |

## Notes

- Une règle `sans_objet` reste sur la matrice avec son motif d'applicabilité — jamais simplement
  retirée (contrat de complétude du référentiel).
- Cette matrice alimente à l'identique la vue transversale « Toutes les règles » et les matrices
  intégrées par dimension du rapport d'audit — même source, plusieurs vues.
