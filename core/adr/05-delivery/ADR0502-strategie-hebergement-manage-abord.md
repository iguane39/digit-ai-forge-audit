---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architectes, responsables FinOps"
informed: "équipes produit"
id: ADR0502
domain: "05"
invariant: false
standards: ["12-Factor — IV. Backing services", "FinOps Foundation — principes de responsabilisation et d'optimisation continue", "NIST SSDF — PO.5", "NIST SP 800-145 (modèles de service — instanciation cloud de l'échelle de délégation)"]
derived_controls: [CTL-D01-09, CTL-D06-07, CTL-D06-08]
profile_bindings: optional
---

# Stratégie d'hébergement managé d'abord (délégation d'exploitation maximale)

## Context and Problem Statement

Pour chaque brique applicative ou d'infrastructure, une équipe doit choisir un mode
d'hébergement. Sans règle de priorité explicite, le réflexe par défaut se porte souvent sur
l'infrastructure la plus bas niveau, la plus coûteuse à exploiter et à sécuriser dans la
durée. Quelle règle de choix, valable pour tout hébergeur, réduit la charge d'exploitation
et la surface de responsabilité portée par les équipes produit ?

## Decision Drivers

* Réduction de la charge d'exploitation (patchs, durcissement, haute disponibilité)
* Maîtrise du coût total de possession, pas seulement du coût facial
* Time-to-market : disponibilité immédiate des services managés
* Réversibilité : ne pas s'interdire l'IaaS quand il est réellement justifié

## Considered Options

* Priorité managée par défaut : le service le plus délégué d'abord (service entièrement opéré par un tiers, puis plateforme d'exécution opérée, infrastructure brute en dernier recours justifié)
* Choix libre laissé à chaque équipe selon ses préférences techniques
* IaaS par défaut, avec plateforme interne standardisée sur machines ou conteneurs

## Decision Outcome

Chosen option: "Priorité managée par défaut (délégation d'exploitation maximale)", parce que
chaque palier de délégation abandonné transfère de la responsabilité d'exploitation (patching,
résilience, sécurité du socle) vers l'équipe produit ; l'infrastructure auto-administrée reste
possible mais devient un choix motivé et tracé, non un réflexe — la règle vaut pour tout mode
d'hébergement, cloud ou sur site.

### Consequences

* Good, because la charge d'exploitation et la surface de sécurité à couvrir diminuent mécaniquement.
* Good, because chaque descente de niveau est motivée et traçable en revue d'architecture.
* Bad, because dépendance accrue aux services managés de l'hébergeur choisi (réversibilité à évaluer séparément).
* Neutral, because certains cas (contraintes réglementaires, performance extrême) justifient légitimement l'IaaS.

### Confirmation

Contrôle dérivé : CTL-D09-03 (choix d'hébergement documenté par brique, écart à l'ordre
managé-first motivé et validé en revue d'architecture). Preuve attendue : registre des choix
d'hébergement par composant avec justification des exceptions. Grille : conforme = priorité
respectée ou écart motivé et validé ; partiel = écart non motivé mais isolé ; non conforme =
choix IaaS systématique sans analyse.

## Pros and Cons of the Options

### Priorité managée par défaut
* Good, because réduit la charge d'exploitation et le time-to-market ; règle universelle.
* Bad, because nécessite une revue d'architecture pour chaque exception légitime.

### Choix libre par équipe
* Good, because autonomie technique maximale.
* Bad, because dispersion des compétences d'exploitation, coût total non maîtrisé.

### IaaS par défaut, plateforme interne standardisée
* Good, because contrôle fin de l'infrastructure.
* Bad, because charge d'exploitation et de sécurisation du socle portée en continu.

## More Information

Dans un contexte cloud, l'échelle de délégation s'instancie « SaaS → PaaS → IaaS » (modèles
de service NIST SP 800-145). Instanciations : `profil:azure` → App Service/Functions avant
AKS avant machines virtuelles ; `profil:aws` → services managés équivalents avant conteneurs
orchestrés avant instances de calcul brutes. Le profil fournit le catalogue de services
managés éligibles ; sur site, l'échelle devient service infogéré → plateforme interne
standardisée → serveurs dédiés.
