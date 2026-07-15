---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.remediation_team}, architectes"
informed: "toutes les équipes produit"
id: ADR0104
domain: "01"
invariant: false
standards: ["Team Topologies (équipe Platform)", "DORA (Accelerate) — State of DevOps (plateformes internes en self-service)"]
derived_controls: [CTL-D00-06, CTL-D01-02]
---

# Modèle d'ingénierie de plateforme (équipe et socle outillé)

## Context and Problem Statement

Quand chaque équipe produit doit ré-résoudre seule les mêmes problèmes d'infrastructure,
de livraison continue et de conformité, la charge cognitive explose et les pratiques
divergent au point de rendre l'audit transverse impraticable. Comment mutualiser le socle
technique commun sans recréer un goulot d'étranglement centralisé qui ralentit chaque
équipe produit ?

## Decision Drivers

* Réduction de la charge cognitive des équipes produit, recentrées sur la valeur métier
* Cohérence des pratiques transverses (sécurité, observabilité, livraison) sans contrôle manuel
* Vitesse de livraison : le socle doit accélérer, jamais créer un ticket bloquant
* Adoption volontaire plutôt qu'imposée, condition de soutenabilité dans la durée

## Considered Options

* Équipe de plateforme dédiée fournissant un socle en self-service, consommable sans ticket
* Équipe centrale d'infrastructure opérant en mode guichet, toute demande traitée manuellement
* Aucune équipe dédiée : chaque équipe produit maintient son propre socle technique

## Decision Outcome

Chosen option: "Équipe de plateforme + socle en self-service", parce qu'elle seule concilie
mutualisation et vitesse : le mode guichet recrée un goulot d'étranglement, et l'absence
d'équipe dédiée démultiplie la dette technique et les écarts de conformité entre produits.

### Consequences

* Good, because les équipes produit héritent par défaut des pratiques conformes sans effort dédié.
* Good, because la plateforme devient elle-même un produit mesurable (adoption, satisfaction), pas un centre de coût opaque.
* Bad, because constituer et outiller l'équipe de plateforme est un investissement initial sans valeur métier directe.
* Neutral, because le socle doit rester incitatif : rendu obligatoire sans qualité de service suffisante, il recrée le goulot qu'il visait à éliminer.

### Confirmation

Contrôles dérivés : CTL-D09-01 (socle en self-service documenté et consommable sans
ticket bloquant), CTL-D09-02 (taux d'adoption et satisfaction des équipes produit mesurés
périodiquement). Preuve attendue : catalogue des parcours outillés publiés et résultats
d'enquête d'adoption/satisfaction. Grille : conforme = socle documenté, adopté par la
majorité des équipes, satisfaction mesurée ; partiel = socle documenté mais adoption non
mesurée ; non conforme = absence de socle mutualisé ou adoption non suivie.

## Pros and Cons of the Options

### Équipe de plateforme + socle en self-service
* Good, because cohérence transverse et vitesse préservée pour les équipes produit.
* Bad, because investissement initial pour constituer et outiller l'équipe.

### Équipe centrale en mode guichet
* Good, because cohérence garantie par contrôle centralisé.
* Bad, because chaque demande devient un point de contention : la vitesse des équipes produit en dépend.

### Aucune équipe dédiée
* Good, because autonomie totale, aucune dépendance transverse.
* Bad, because pratiques divergentes, dette dupliquée, audit transverse impraticable.

## More Information

Instanciations par profil : `profil:git-platform` → parcours outillés matérialisés en
gabarits de dépôt et pipelines réutilisables ; `profil:catalogue-developpeur` → portail
développeur exposant le catalogue de services et les parcours outillés disponibles.
