---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "équipes FinOps, responsables de domaine"
informed: "toutes les équipes produit"
id: ADR0107
domain: "01"
invariant: false
standards: ["FinOps Foundation — FinOps Framework 2025/2026 (Domaines/Capacités, Personas, phases Inform/Optimize/Operate, Scopes, maturité Crawl/Walk/Run par capacité)", "ISO/IEC 38500:2015 — principe d'acquisition"]
derived_controls: [CTL-D00-07, CTL-D07-04, CTL-D07-05, CTL-D07-06, CTL-D07-07, CTL-D07-08]
---

# Gouvernance des coûts : budgets, alertes, revues FinOps

## Context and Problem Statement

Sans gouvernance active des coûts, la dépense d'hébergement dérive silencieusement jusqu'à
sa constatation en facturation, bien après que la décision qui l'a causée a été prise —
trop tard pour l'infléchir efficacement. Comment instaurer une gouvernance continue des
coûts qui détecte la dérive au moment où elle se produit et implique les bonnes parties
prenantes dans la décision ?

## Decision Drivers

* Détection de la dérive de coût au plus près du fait générateur, pas en fin de cycle de facturation
* Imputabilité du budget par périmètre (produit, domaine) plutôt qu'un budget global opaque
* Décision collective récurrente plutôt que réaction ponctuelle à une alerte isolée
* Applicabilité indépendante de l'hébergeur et du modèle de facturation retenu
* Couverture de tous les postes de dépense technologique significatifs (cloud public, mais aussi
  SaaS, licences, IA/inférence générative) plutôt du seul calcul cloud historique
* Maturité mesurée capacité par capacité (une organisation peut être avancée sur l'allocation de
  coût et débutante sur l'optimisation de l'inférence IA) plutôt qu'un score global unique trompeur

## Considered Options

* Budgets déclarés par périmètre avec alertes automatiques de dérive et revue FinOps périodique
* Suivi de la facturation a posteriori, sans budget ni alerte préalable
* Plafond de dépense technique bloquant au dépassement, sans revue ni analyse

## Decision Outcome

Chosen option: "Budgets par périmètre + alertes + revue périodique", parce qu'elle seule
combine détection précoce, imputabilité par périmètre et décision éclairée récurrente — le
suivi a posteriori arrive trop tard, et le plafond bloquant sans revue risque d'interrompre
un service pour une cause non analysée.

### Consequences

* Good, because une dérive de coût est visible et discutée avant de devenir un écart budgétaire significatif.
* Good, because la revue périodique transforme la donnée de coût en décision d'arbitrage plutôt qu'en tableau de bord ignoré.
* Bad, because la déclaration de budgets par périmètre suppose un tagging déjà fiable (lien ADR0102/ADR0103), sans quoi l'imputation reste approximative.
* Neutral, because le seuil d'alerte et la cadence de revue restent des paramètres d'overlay.

### Confirmation

Contrôles dérivés : CTL-D07-04 (budget déclaré et alerte de dérive active pour chaque
périmètre significatif), CTL-D07-05 (revue FinOps périodique tracée avec décisions
consignées). Preuve attendue : configuration des budgets et alertes, et compte rendu de
revue FinOps daté. Grille : conforme = budgets couvrant tous les périmètres significatifs
et revue régulière tracée ; partiel = budgets partiels ou revue irrégulière ; non conforme
= absence de budget déclaré ou d'alerte de dérive.

## Pros and Cons of the Options

### Budgets par périmètre + alertes + revue périodique
* Good, because dérive détectée tôt et arbitrée collectivement de façon récurrente.
* Bad, because dépend d'un tagging déjà fiable pour une imputation précise par périmètre.

### Suivi de la facturation a posteriori
* Good, because aucun outillage préalable requis.
* Bad, because la dérive n'est constatée qu'après le fait, hors de toute capacité d'action rapide.

### Plafond bloquant sans revue
* Good, because protection immédiate contre un emballement de coût.
* Bad, because interrompt un service sans analyse de la cause, risque opérationnel non maîtrisé.

## More Information

Instanciations par profil : `profil:azure` → gestion de budgets et alertes, complétée par
des tableaux de bord FinOps pour la revue ; `profil:aws` → budgets et détection
d'anomalies de coût. Le rythme de revue (mensuel, trimestriel) relève de l'overlay.

**Réalignement TF-0110 (2026-08-12) — FinOps Framework 2025/2026.** La citation initiale
(« cycle Inform/Optimize/Operate ») décrivait le cœur du framework mais n'en couvrait plus
l'évolution récente : le cycle en 3 phases reste le moteur, mais le framework 2025/2026 y ajoute
les **Scopes** (le périmètre de dépense n'est plus seulement le cloud public : SaaS, licences,
centre de données, IA/GenAI sont des scopes distincts, chacun avec ses leviers propres) et une
**maturité déclarée par capacité** (Crawl/Walk/Run) plutôt qu'un score de maturité FinOps global —
une organisation « Run » sur l'allocation de coût peut être « Crawl » sur l'optimisation de
l'inférence IA, et les deux constats doivent rester visibles séparément. `CTL-D07-08` opérationnalise
cette maturité par capacité ; les contrôles existants (`CTL-D07-01..07`) restent valides tels quels
(taxonomie de tags, budgets, revue, coûts d'inférence IA déjà couverts par `CTL-D07-07`) — ce
réalignement **enrichit** la référence normative, il ne retire ni n'assouplit aucun contrôle.
