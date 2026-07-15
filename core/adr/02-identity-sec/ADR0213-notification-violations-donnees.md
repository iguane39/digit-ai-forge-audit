---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipes juridique et conformité"
informed: "toutes les équipes produit"
id: ADR0213
domain: "02"
invariant: false
standards: ["RGPD — art. 33-34 (notification des violations de données à caractère personnel)"]
derived_controls: [CTL-D04-12]
---

# Notification des violations de données à caractère personnel

## Context and Problem Statement

Le corpus gouverne déjà la classification des données personnelles (ADR0206) et, une fois un
incident de sécurité confiné, sa preuve et son post-mortem (ADR0210) — mais aucune décision
n'impose la notification externe d'une violation de données personnelles lorsque le cadre
réglementaire applicable l'exige. Sans procédure dédiée, un délai souvent bref — compté dès
la connaissance de la violation, pas sa confirmation complète — risque d'être manqué faute
de rôle nommé et de modèle pré-rédigé. Comment garantir la notification, dans les délais que fixe le cadre réglementaire applicable, à l'autorité compétente et, si requis, aux personnes concernées ?

## Decision Drivers

* Délai de notification souvent bref, déclenché dès la connaissance de la violation, pas sa confirmation complète
* Distinction entre notification à l'autorité de contrôle et notification aux personnes concernées, à seuils différents
* Continuité avec la chaîne de preuve de l'incident de sécurité déjà confiné (ADR0210)
* Applicabilité conditionnée au cadre réglementaire du tenant : toutes les organisations n'y sont pas soumises

## Considered Options

* Procédure de notification dédiée (rôle nommé, modèle pré-rédigé, délai contractualisé dès la connaissance de la violation), activée par le cadre réglementaire applicable au tenant
* Notification traitée au cas par cas par l'autorité juridique sollicitée après l'incident, sans procédure ni modèle préparés à l'avance
* Aucune procédure : la notification externe n'est considérée qu'à la demande explicite d'une autorité de contrôle

## Decision Outcome

Chosen option: "Procédure de notification dédiée et conditionnelle", seule option qui tient
un délai bref compté dès la connaissance de la violation grâce à un rôle nommé et un modèle
préparés à l'avance, tout en restant neutre sur la juridiction d'application.

### Consequences

* Good, because le délai de notification devient tenable même compté en heures, grâce à un modèle et un rôle préparés à l'avance.
* Good, because la notification s'appuie sur la même chaîne de preuve que la réponse à incident (ADR0210), sans reconstruction a posteriori.
* Bad, because un modèle de notification et un rôle nommé doivent être maintenus à jour même en l'absence de violation.
* Neutral, because le déclenchement effectif de l'obligation dépend du cadre réglementaire applicable au tenant, à qualifier au cas par cas.

### Confirmation

Contrôle dérivé : CTL-D04-12 (procédure de notification des violations de données
documentée — rôle nommé, modèle pré-rédigé, délai contractualisé dès la connaissance de la
violation — activée dès lors que le cadre réglementaire applicable l'exige — mode revue).
Preuve : procédure à jour + modèle +, le cas échéant, trace de la dernière notification dans
les délais. Grille : conforme = procédure à jour ET délai respecté ; partiel = procédure
jamais exercée ni testée ; non conforme = absence de procédure alors que le cadre l'exige.

## Pros and Cons of the Options

### Procédure dédiée et conditionnelle
* Good, because délai tenable, rôle nommé, appuyée sur la chaîne de preuve de l'incident.
* Bad, because modèle et rôle à maintenir à jour même sans violation à notifier.

### Traitement au cas par cas par l'autorité juridique
* Good, because aucune procédure à maintenir en l'absence de violation.
* Bad, because délai bref difficile à tenir sans modèle ni rôle préparés à l'avance.

### Notification seulement sur demande d'une autorité de contrôle
* Good, because effort nul en l'absence de sollicitation externe.
* Bad, because contrevient à l'obligation de notification proactive du cadre réglementaire lorsqu'il s'applique.

## More Information

Instanciations : `profil:ue` (RGPD, art. 33-34) → notification à l'autorité de contrôle sous
72 heures et aux personnes concernées si risque élevé ; autres profils → délai et destinataires
fixés par le cadre réglementaire local, ou contrôle sans objet en son absence. Distinct
d'ADR0210 (confinement et preuve internes) : cet ADR couvre l'obligation externe. Manque
comblé : RGPD art. 33-34, 0 occurrence de « notification »/« violation » dans les 150 contrôles (EXTENSION-CORPUS.md §2).
