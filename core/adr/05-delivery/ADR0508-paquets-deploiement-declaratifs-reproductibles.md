---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architectes, équipes d'exploitation"
informed: "équipes produit"
id: ADR0508
domain: "05"
invariant: true
standards: ["12-Factor — V. Build, release, run", "SLSA — provenance et reproductibilité du build", "NIST SSDF — PS.3"]
derived_controls: [CTL-D09-04]
profile_bindings: optional
---

# Paquets de déploiement déclaratifs et reproductibles

## Context and Problem Statement

Si l'artefact déployé en production peut différer, même légèrement, de celui qui a été
construit et scanné en amont, toute la chaîne de preuve de la livraison (tests, scans,
approbations) devient invérifiable. Comment garantir qu'un seul et même paquet, construit
une fois, est promu inchangé jusqu'en production ?

## Decision Drivers

* Intégrité de la chaîne de preuve : ce qui est scanné est ce qui est déployé
* Reproductibilité : reconstruire un paquet doit produire un résultat identique
* Élimination des reconstructions spécifiques à un environnement
* Portabilité du principe à tout format de paquet ou d'image

## Considered Options

* Paquet déclaratif construit une seule fois, promu inchangé à travers les environnements
* Reconstruction du paquet à chaque environnement à partir des mêmes sources
* Configuration ajustée manuellement après déploiement selon l'environnement cible

## Decision Outcome

Chosen option: "Construction unique, promotion inchangée", parce que c'est la seule option
qui garantit que l'artefact validé (tests, scans, approbations) est identique, au bit près,
à l'artefact exécuté en production — toute reconstruction ou modification intermédiaire
rouvrant la question de ce qui a réellement été validé.

### Consequences

* Good, because la chaîne de preuve (tests, scans, approbations) reste valide jusqu'en production.
* Good, because un incident en production se diagnostique sur l'artefact exact qui a été validé.
* Bad, because la configuration propre à chaque environnement doit être externalisée du paquet.
* Neutral, because exige un registre de paquets versionné et accessible à tous les environnements.

### Confirmation

Contrôle dérivé : CTL-D09-10 (empreinte du paquet identique entre l'environnement de
validation et l'environnement de production — vérification par comparaison de hachage).
Preuve attendue : registre des paquets avec empreinte + journal de promotion inter-
environnements. Grille : conforme = empreinte identique sur 100 % des promotions ; partiel =
écart isolé documenté ; non conforme = reconstruction constatée entre environnements.

## Pros and Cons of the Options

### Construction unique, promotion inchangée
* Good, because chaîne de preuve intacte, reproductibilité garantie.
* Bad, because exige d'externaliser strictement la configuration par environnement.

### Reconstruction à chaque environnement
* Good, because permet d'ajuster la construction au contexte de chaque environnement.
* Bad, because rien ne garantit que deux constructions produisent un résultat identique.

### Configuration ajustée après déploiement
* Good, because souplesse immédiate perçue en exploitation.
* Bad, because l'artefact réellement en production diverge de tout ce qui a été validé.

## More Information

Instanciations : `profil:azure` → registre de paquets managé, promotion par référence
d'image entre environnements. Le profil fournit le format de paquet retenu (image de
conteneur, archive applicative ou équivalent).
