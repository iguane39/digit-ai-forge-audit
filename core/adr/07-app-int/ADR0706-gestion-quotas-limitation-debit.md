---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architectes"
informed: "équipes produit"
id: ADR0706
domain: "07"
invariant: false
standards: ["OWASP ASVS 5.0 — V13 (limitation de débit)", "SRE — Site Reliability Engineering (gestion de la charge)"]
derived_controls: [CTL-D06-02, CTL-D06-05]
---

# Gestion des quotas et limitation de débit aux frontières

## Context and Problem Statement

Une API exposée sans limite de débit peut être saturée par un consommateur défaillant,
un pic légitime ou une attaque par volumétrie, avec un effet en cascade sur les
applications amont et aval. Ce risque n'est couvert par aucune décision explicite tant
que la limitation de débit reste un paramètre technique laissé à la discrétion de chaque
équipe ; il mérite une décision de principe à part entière, distincte du choix du tiers
de confiance qui expose l'API (ADR0701).

## Decision Drivers

* Continuité de service pour l'ensemble des consommateurs légitimes en cas de pic
* Protection contre les scénarios d'abus ou de déni de service par volumétrie
* Visibilité contractuelle du consommateur sur les limites qui s'appliquent à lui
* Application uniforme des quotas sans dépendre de la discipline de chaque équipe

## Considered Options

* Quotas et limitation de débit appliqués et gouvernés au point d'exposition commun
* Limitation de débit implémentée au cas par cas dans chaque application
* Absence de limitation, capacité dimensionnée pour absorber tout pic

## Decision Outcome

Chosen option: "Quotas gouvernés au point d'exposition commun", parce qu'elle applique
une règle uniforme et vérifiable à toute API exposée, protège les applications qui
n'auraient pas elles-mêmes implémenté de limite, et ne dépend pas d'un sur-dimensionnement
coûteux et sans plafond.

### Consequences

* Good, because une seule politique de quotas à auditer pour toutes les API exposées.
* Good, because les consommateurs reçoivent un rejet contrôlé au lieu d'une dégradation silencieuse.
* Bad, because un consommateur légitime mal dimensionné peut être bridé ; un ajustement est nécessaire.
* Neutral, because les seuils doivent être révisés périodiquement à mesure que l'usage évolue.

### Confirmation

Contrôles dérivés : CTL-D06-02 (quotas et seuils de débit définis, justifiés et
appliqués pour chaque API exposée — mode revue), CTL-D02-05 (dépassement de quota
rejeté au point d'exposition, jamais laissé à l'application — mode automatique). Preuve
attendue : politique de quotas documentée + configuration active au point d'exposition.
Grille : conforme = quotas actifs et documentés pour 100 % des API ; partiel = quotas
actifs sans justification documentée des seuils ; non conforme = API exposée sans quota.

## Pros and Cons of the Options

### Quotas gouvernés au point d'exposition commun
* Good, because règle uniforme, protège même les applications non instrumentées.
* Bad, because processus d'ajustement des seuils à opérer dans la durée.

### Limitation au cas par cas par application
* Good, because seuils ajustés finement au contexte de chaque application.
* Bad, because couverture incomplète et incohérente ; audit à refaire par application.

### Absence de limitation, sur-dimensionnement
* Good, because aucune contrainte perçue par les consommateurs en usage normal.
* Bad, because coût d'infrastructure non borné et vulnérabilité totale à un pic ou un abus.

## More Information

Instanciations : `profil:azure` → stratégies de quota au niveau de la passerelle d'API ;
autres profils → limitation de débit équivalente au point d'exposition commun (lien
ADR0701).
