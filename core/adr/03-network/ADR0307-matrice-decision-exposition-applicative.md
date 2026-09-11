---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, équipe réseau, équipes produit"
informed: "toutes les équipes produit"
id: ADR0307
domain: "03"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D02-14]
---

# Voie d'exposition applicative déterminée par une matrice de décision

## Context and Problem Statement

Une application peut être exposée de plusieurs manières — directement depuis la zone qui héberge la charge de travail, derrière un pare-feu applicatif web, derrière une passerelle d'API, ou via un pare-feu réseau sortant. Quand ce choix se fait au cas par cas, deux applications de même criticité se retrouvent exposées différemment, et aucune revue ne peut dire si l'exposition retenue était la bonne. Comment garantir que la voie d'exposition d'une application découle de critères déclarés plutôt que de l'habitude de l'équipe qui l'a déployée ?

## Decision Drivers

* Reproductibilité : deux applications aux mêmes critères sortent avec la même voie d'exposition
* Aucune exposition depuis la zone des charges de travail — l'entrée passe par une zone de connectivité dédiée
* Décision argumentable en revue : la matrice est lisible avant le déploiement, pas reconstituée après
* Neutralité vis-à-vis de la plateforme d'hébergement et du fournisseur

## Considered Options

* Matrice de décision déclarée (sortie réseau, partenaires externes, criticité, obligation réglementaire) déterminant la voie d'exposition, l'entrée se faisant toujours depuis une zone de connectivité dédiée
* Voie d'exposition choisie projet par projet et validée en revue d'architecture, sans matrice
* Voie d'exposition unique imposée à toutes les applications, quelle que soit leur nature

## Decision Outcome

Chosen option: "Matrice de décision déclarée", parce que c'est la seule option qui rend le choix reproductible et vérifiable : le trafic web entrant passe par un pare-feu applicatif web, les API par une passerelle d'API, le filtrage réseau est systématique, le chiffrement en transit est exigé partout, et le pare-feu réseau n'est ajouté que lorsque la matrice le commande. Une exposition directe depuis la zone des charges de travail est refusée dans tous les cas.

### Consequences

* Good, because la voie d'exposition d'une application se justifie par des critères écrits, opposables en audit.
* Good, because la surface exposée reste concentrée sur un petit nombre de points de contrôle maintenus.
* Bad, because la matrice doit être tenue à jour : périmée, elle produit des décisions périmées.
* Neutral, because elle n'interdit aucune topologie, elle impose seulement de dire pourquoi celle-ci.

### Confirmation

Contrôle dérivé : CTL-D02-14 (la voie d'exposition de l'application correspond à celle que commande la matrice pour ses critères, et aucune exposition n'a lieu directement depuis la zone des charges de travail — mode revue). Preuve attendue : matrice d'exposition datée, critères renseignés pour l'application, et configuration réelle des points d'entrée. Grille : conforme = voie conforme à la matrice et entrée depuis la zone de connectivité ; partiel = voie conforme mais matrice non renseignée pour l'application ; non conforme = exposition directe depuis la zone des charges de travail, ou voie divergente non justifiée.

## Pros and Cons of the Options

### Matrice de décision déclarée

* Good, because reproductible, auditable, indépendante des personnes présentes au moment du déploiement.
* Bad, because exige une maintenance du référentiel de critères.

### Choix au cas par cas en revue d'architecture

* Good, because souplesse maximale, aucune structure à maintenir.
* Bad, because la décision dépend de qui siège en revue ; aucune non-régression entre projets.

### Voie unique imposée à toutes les applications

* Good, because simplicité de mise en œuvre et d'exploitation.
* Bad, because surdimensionne les cas simples et sous-protège les cas réglementés.

## More Information

Complète ADR0301 (point de contrôle unique d'exposition) et ADR0305 (protection périmétrique applicative) : celles-ci imposent les points de contrôle, celle-ci impose **comment on choisit** entre eux. Instanciations par profil : `profil:azure` → pare-feu applicatif web devant la passerelle applicative, passerelle d'API managée pour les API, pare-feu réseau conditionnel ; autres profils → équivalents fonctionnels.

**À compléter** (`a_completer: true`) : la source de référence dont cette décision est issue ne cite **aucune norme externe** — le champ `standards` reste donc vide et doit être renseigné avant toute opposabilité. À compléter également : les seuils exacts de la matrice (quelles valeurs de criticité commandent quelle voie), qui relèvent de l'organisation qui l'instancie.
