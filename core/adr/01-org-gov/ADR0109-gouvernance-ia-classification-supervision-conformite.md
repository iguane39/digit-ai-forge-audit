---
status: "proposed"
date: 2026-08-12
decision-makers: "{roles.decision_authority}"
consulted: "équipe produit, responsables de domaine, autorité de conformité"
informed: "toutes les équipes produit"
id: ADR0109
domain: "01"
invariant: false
standards: ["ISO/IEC 42001:2023 — système de management de l'IA", "NIST AI RMF 1.0 — fonctions Govern/Map/Measure/Manage", "EU AI Act (Règlement UE 2024/1689) — obligations de classification, supervision et documentation"]
derived_controls: [CTL-D17-01, CTL-D17-02, CTL-D17-03, CTL-D17-04]
---

# Gouvernance des systèmes IA : classification du risque, dérive, supervision humaine, conformité

## Context and Problem Statement

Le référentiel audite déjà la robustesse technique des modèles et prompts (dimension D14) et la
conformité réglementaire générale (dimension D04), mais aucune des deux ne couvre le risque
*organisationnel* propre aux systèmes d'IA : absence de classification du niveau de risque,
absence de surveillance de la dérive de comportement après mise en production, supervision
humaine non vérifiée, documentation de conformité manquante face à des obligations qui deviennent
opposables (l'EU AI Act échelonne ses obligations jusqu'en 2027). Le constat est aggravé par le
fait que l'écosystème qui produit ET audite ce référentiel est lui-même piloté par des agents IA :
le point aveugle n'est pas hypothétique. Comment gouverner le risque des systèmes IA de façon
auditable, indépendamment du fournisseur de modèle et du cas d'usage ?

## Decision Drivers

* Couvrir un risque organisationnel distinct de la robustesse technique (D14) et de la conformité
  réglementaire générale (D04), sans dupliquer l'un ou l'autre
* Rester exécutable dès la v0 : chaque contrôle doit être vérifiable avec une preuve concrète, pas
  seulement déclaratif de principe
* Neutralité vis-à-vis du fournisseur de modèle, du mode d'hébergement et du cas d'usage (assistant,
  agent autonome, classification, génération)
* Alignement avec au moins un standard de gouvernance IA reconnu (pas une invention interne)

## Considered Options

* Nouvelle dimension dédiée D17 « Gouvernance IA », avec ses propres contrôles CTL-D17-xx
* Extension de la dimension D04 (Conformité réglementaire & IA) par de nouveaux contrôles
* Extension de la dimension D14 (Modèles IA & prompts) par de nouveaux contrôles

## Decision Outcome

Chosen option: "Nouvelle dimension D17 « Gouvernance IA »", parce que D04 traite de conformité
réglementaire généraliste (RGPD, résidence des données, transferts) et D14 traite de la qualité
technique des modèles et prompts (robustesse, évaluation, hallucination) — ni l'une ni l'autre ne
porte la question de gouvernance transverse (qui décide du niveau de risque d'un système IA, qui
surveille sa dérive, qui peut l'arrêter). Le précédent du domaine 09 (UX/accessibilité, PADR-0008)
montre qu'un sujet transverse mal logé dans un domaine voisin reste un point aveugle jusqu'à
recevoir son propre porteur ; le même raisonnement s'applique ici à l'échelle de la dimension
d'audit. C'est une évolution **additive** du pack `core-v1` (nouveaux contrôles, aucun retrait ni
fusion) — **MINEURE** au sens SemVer (PADR-0005), tracée en PADR-0009.

### Consequences

* Good, because un engagement client qui doit répondre à l'EU AI Act ou à une exigence ISO 42001
  trouve désormais une dimension d'audit dédiée, plutôt qu'un vide.
* Good, because la classification de risque (CTL-D17-01) devient le point d'entrée qui motive
  l'applicabilité des trois autres contrôles v0 — pas un déclaratif isolé.
* Bad, because la dimension démarre à 4 contrôles (dérive, supervision humaine, classification,
  documentation) : elle ne couvre pas encore l'auditabilité des décisions individuelles, la
  gestion des incidents IA ni les tests d'adversité — backlog v1 explicitement ouvert.
* Neutral, because aucun profil technologique n'instancie encore cette dimension (`profiles/`) ;
  l'audit s'appuie sur les `actions_audit` génériques du core jusqu'à un premier binding.

### Confirmation

Contrôles dérivés : CTL-D17-01 (inventaire et classification des systèmes IA par niveau de
risque), CTL-D17-02 (surveillance de la dérive de modèle avec seuil et action documentés),
CTL-D17-03 (supervision humaine effective, testée, non contournable silencieusement), CTL-D17-04
(documentation de conformité par système IA tenue à jour). Preuve attendue : voir le détail de
chaque contrôle (`core/controls/D17.json`). Grille : conforme = les quatre contrôles applicables
sont conformes ; partiel = classification faite mais un contrôle opérationnel manquant ou partiel ;
non conforme = aucune classification de risque des systèmes IA du périmètre.

## Pros and Cons of the Options

### Nouvelle dimension D17
* Good, because porteur dédié, visible au même titre que les 17 autres dimensions du rapport.
* Bad, because augmente la surface du référentiel (18e dimension) — coût de maintenance accru.

### Extension de D04
* Good, because aucune modification de schéma, aucun nouveau porteur à créer.
* Bad, because D04 resterait un fourre-tout conformité générale + gouvernance IA spécifique,
  perdant la lisibilité qui a justifié la création du domaine 09 par le passé (raisonnement
  symétrique).

### Extension de D14
* Good, because proximité thématique évidente (même famille `donnees-ia`).
* Bad, because D14 évalue la qualité technique du modèle/prompt lui-même, pas la gouvernance
  organisationnelle qui l'entoure — mélanger les deux brouille la grille de verdict de chacune.

## More Information

**Applicabilité v0** : `web-app`/`api`/`data`/`mobile` = partiel (systèmes qui embarquent une
fonctionnalité IA sans être eux-mêmes un produit IA) ; `ml` = plein (cœur de cible) ; `infra` = sans
objet par défaut (motif : aucun système IA propre à l'infrastructure elle-même, à réévaluer au cas
par cas). **Non fait en v0, backlog explicite** : binding de profil (aucun `profiles/*` n'instancie
encore D17), contrôle dédié à la gestion d'incident IA, contrôle de test d'adversité/robustesse
face aux attaques (prompt injection, jailbreak — périmètre proche de la forge candidate TF-0111,
non traité ici), traduction `core/adr-en/01-org-gov/` et `core/controls-en/D17.json` (le pack EN
n'est émis que si le corpus traduit est complet — `tools/assemble-core.mjs` §1bis). Revue prévue à
la prochaine échéance de `docs/GOUVERNANCE-STANDARDS.md` (2027-01).
