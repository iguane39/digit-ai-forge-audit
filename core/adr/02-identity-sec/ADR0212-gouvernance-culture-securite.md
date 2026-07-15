---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes de développement"
informed: "toutes les équipes produit"
id: ADR0212
domain: "02"
invariant: false
standards: ["OWASP SAMM v2 — fonction Governance (Strategy & Metrics, Education & Guidance)", "NIST SSDF — PO.1/PO.2"]
derived_controls: [CTL-D02-13]
---

# Gouvernance et culture de la sécurité par la conception

## Context and Problem Statement

Le corpus impose de nombreuses pratiques de sécurité ponctuelles (secrets, authentification,
menaces, vulnérabilités) sans garantir qu'elles s'inscrivent dans une stratégie portée par
une autorité identifiée, mesurée dans la durée et diffusée par une formation continue. Sans
cela, chaque pratique reste une île sans levier pour faire progresser la maturité globale, ni
pour détecter sa régression. Comment gouverner la sécurité par une stratégie mesurée et diffusée ?

## Decision Drivers

* Cohérence : les pratiques de sécurité ponctuelles s'inscrivent dans une stratégie globale portée par une autorité nommée
* Mesure de la maturité de sécurité dans le temps, avec des indicateurs suivis et opposables
* Diffusion des compétences de sécurité aux équipes de développement, pas seulement à une équipe experte isolée
* Neutralité méthodologique : la gouvernance ne dépend d'aucun outil ni modèle de maturité particulier

## Considered Options

* Stratégie de sécurité formalisée (indicateurs de maturité suivis, autorité nommée), complétée par un programme de formation continue et des relais de sécurité dans les équipes
* Sécurité portée uniquement par une équipe experte centralisée, sans stratégie mesurée ni diffusion vers les équipes de développement
* Aucune gouvernance formelle : la sécurité reste l'addition des pratiques ponctuelles déjà décidées, sans mesure ni formation dédiée

## Decision Outcome

Chosen option: "Stratégie mesurée + programme de formation continue", seule option qui rend
la maturité de sécurité mesurable dans le temps et diffuse la compétence au-delà d'une
équipe experte isolée — condition de la tenue dans la durée des pratiques déjà décidées.

### Consequences

* Good, because la maturité de sécurité devient mesurable, comparable dans le temps et opposable en audit.
* Good, because les équipes de développement portent une part de la responsabilité de sécurité, réduisant la dépendance à une équipe isolée.
* Bad, because un programme de formation et des indicateurs doivent être maintenus dans la durée, charge récurrente indépendante de tout projet.
* Neutral, because le niveau de maturité cible reste à fixer par l'autorité désignée selon le contexte de risque.

### Confirmation

Contrôle dérivé : CTL-D02-13 (stratégie de sécurité documentée, indicateurs de maturité
suivis à fréquence régulière par une autorité nommée, programme de formation continue
couvrant les équipes de développement — mode revue). Preuve : document de stratégie +
historique des indicateurs + registre de formation (taux de couverture). Grille : conforme =
stratégie à jour, indicateurs suivis ET formation diffusée ; partiel = stratégie sans
formation diffusée ; non conforme = absence de stratégie ou d'indicateur suivi.

## Pros and Cons of the Options

### Stratégie mesurée + formation continue
* Good, because maturité mesurable, compétence diffusée au-delà d'une équipe experte isolée.
* Bad, because charge récurrente de pilotage et de formation à maintenir.

### Équipe experte centralisée sans stratégie mesurée
* Good, because expertise concentrée, rapide à mobiliser sur un sujet ponctuel.
* Bad, because aucune mesure de progression ; la compétence ne se diffuse jamais aux équipes.

### Addition de pratiques ponctuelles sans gouvernance
* Good, because aucun effort de gouvernance additionnel au-delà des ADR déjà décidés.
* Bad, because aucune vision d'ensemble ; une régression de maturité peut passer inaperçue.

## More Information

Instanciations : `profil:azure`/`profil:aws` → tableau de bord de posture de sécurité comme
source d'indicateurs, complété par un programme de formation propre à l'organisation. Le
modèle de maturité (ex. SAMM) est un choix d'outillage ; seule une stratégie mesurée et
diffusée est invariante. Manque comblé : fonction Governance OWASP SAMM et NIST SSDF
PO.1/PO.2 (EXTENSION-CORPUS.md §2).
