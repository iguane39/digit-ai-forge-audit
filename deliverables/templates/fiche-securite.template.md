<!-- AuditCore template v1 — généré pour {{tenant.name}} via la config ; ne pas éditer les livrables produits à la main -->
<!-- UN GABARIT EST UN LIVRABLE : il suit la règle des versions datées (TF-0697, 27/08/2026).
     Corriger un gabarit se fait en CRÉANT une version datée (`…-AAAAMMJJa`) ; la précédente reste
     INTACTE, parce que des livrables déjà remis s'y réfèrent et qu'une correction rétroactive
     réécrirait leur histoire. Rien dans cette famille ne le rappelait, et le réflexe naturel est
     de l'éditer en place — c'est pour cela que le rappel est ici, dans le fichier qu'on ouvre
     pour le modifier, et pas dans une note que personne ne relit. -->
<!-- DEUX SORTIES, ET LE PDF EST IMPRIMÉ (TF-0700) : `.html` de référence + `.pdf` de diffusion,
     ce dernier IMPRIMÉ depuis le HTML (`node fiche-en-pdf.mjs <fiche.html>`), JAMAIS capturé, et
     du MÊME INDICE que lui. Porte avant diffusion : `node oracles/verifier-fiche-securite.mjs
     <fiche.html>` → exit 0. -->

# {{tenant.name}} — Fiche sécurité de mise à disposition — {{projet.nom}} — {{date}}{{indice}}

> Fiche remplie à chaque mise à disposition d'un environnement (dev, sandbox…) du périmètre audité.
> Champs génériques core ; champs additionnels propres au tenant ajoutés par pack (`packs/*`), jamais
> retirés de la base ci-dessous (même invariant que le référentiel).

## Identification

| Champ | Valeur |
|---|---|
| Projet / application | {{projet.nom}} |
| Porteur (construit) | {{porteur.nom}} ({{porteur.email}}) |
| **Business Owner (valide)** | {{business_owner.nom — QUI VALIDE la mise à disposition. Si c'est le porteur lui-même, l'ÉCRIRE : « même personne que le porteur » }} |
| Direction / équipe | {{porteur.direction}} |
| Type de solution | {{projet.type}} *(web-app · api · data · mobile · ml · infra)* |
| Environnement concerné | {{environnement.label}} ({{environnement.code}}) |
| Date de mise à disposition | {{date}} |
| URL / point d'accès | {{environnement.url}} |

> **Porteur et Business Owner ne se remplissent pas à l'identique en silence.** Quand les deux
> rôles sont tenus par la même personne, il n'y a AUCUNE relecture croisée entre construire et
> valider — c'est un fait que le responsable sécurité doit LIRE, pas déduire en comparant deux
> lignes. La phrase a dû être ajoutée à la main sur une fiche livrée le 27/08/2026 ; le canevas
> pose désormais la question. « Même personne » est une réponse valide, et c'est un constat à
> porter au rapport, jamais une case à laisser vide.

## Exposition

| Champ | Valeur |
|---|---|
| Niveau d'exposition | {{exposition.niveau}} *(privé réseau interne · passerelle interne · public)* |
| Réseau / segmentation | {{exposition.reseau}} |
| Domaine(s) / IP publiée(s) | {{exposition.domaines}} |
| Ports & protocoles exposés | {{exposition.ports}} |
| Protection en périphérie | {{exposition.waf_cdn — WAF, CDN, passerelle API, ou « aucune »}} |

## Authentification

| Champ | Valeur |
|---|---|
| Mode d'authentification | {{auth.mode}} |
| Fournisseur d'identité | {{auth.idp}} |
| MFA | {{auth.mfa — activé/non}} |
| Comptes de test | {{auth.comptes_test — nombre, portée, expiration}} |
| Modèle d'autorisation | {{auth.rbac — rôles, granularité, ou « aucun rôle, aucune granularité » }} |
| **Population effectivement admise** | {{auth.population_admise — QUI entre, et COMBIEN : « collaborateurs du tenant (N) », « tout compte du fournisseur d'identité, invités compris (N dont M invités) »… }} |
| **Restriction d'accès effective** | {{auth.restriction — assignation de rôle requise oui/non · liste d'autorisation renseignée oui/non et son contenu · ou « aucune : tout compte authentifié entre » }} |
| **Comptes externes / invités en portée** | {{auth.invites — nombre relevé à la date de la fiche, et la commande ou l'écran qui l'a donné }} |

> **S'authentifier n'est pas être admis.** Les trois champs en gras existent parce qu'une fiche a
> déjà dit vrai et fait comprendre faux : « fournisseur d'identité mono-tenant, connexion
> obligatoire » laissait lire « audience restreinte » alors que l'assignation de rôle était
> désactivée, les listes d'autorisation vides, et 3 128 comptes invités de l'annuaire admis au même
> titre que les collaborateurs. Un mécanisme de contrôle se décrit par CE QU'IL LAISSE PASSER,
> chiffré ; « aucune restriction » est une réponse valide et c'est un constat à porter au rapport,
> jamais une case à laisser vide.

## Données

| Champ | Valeur |
|---|---|
| Nature des données traitées | {{donnees.nature}} |
| Données personnelles (PII) | {{donnees.pii — oui/non, catégories}} |
| Classification | {{donnees.classification}} |
| Localisation / résidence | {{donnees.localisation}} |
| Durée de rétention | {{donnees.retention}} |

## Flux

| Champ | Valeur |
|---|---|
| Flux entrants | {{flux.entrants — sources, protocole, sens}} |
| Flux sortants | {{flux.sortants — destinations, protocole}} |
| Intégrations tierces | {{flux.integrations}} |
| Chiffrement en transit | {{flux.chiffrement — version TLS, mTLS le cas échéant}} |

## Durcissement

- {{durcissement.puce_1 — ex. gestion des secrets en coffre-fort dédié}}
- {{durcissement.puce_2 — ex. scan de dépendances vulnérables en CI}}
- {{durcissement.puce_3 — ex. en-têtes de sécurité HTTP, limitation de débit}}
- Reste à faire : {{durcissement.gaps}}

## Engagement de service

| Champ | Valeur |
|---|---|
| Nature de la valeur | {{sla.nature — « objectif » (visé, non opposable) ou « engagement » (opposable) }} |
| Disponibilité | {{sla.disponibilite}} |
| Délai de rétablissement (RTO) | {{sla.rto — valeur, et sa nature : cible ou engagement}} |
| Perte de données tolérée (RPO) | {{sla.rpo — valeur, et sa nature : cible ou engagement}} |
| Coupure à chaque livraison | {{sla.coupure_livraison — durée, ou « inconnue » ; jamais « aucune » sans mesure}} |
| Preuve de tenabilité | {{sla.preuve — plan de service, nombre d'instances, redondance de zone, emplacements de déploiement ; c'est CETTE ligne qui autorise le mot « engagement »}} |
| Validé par | {{sla.valide_par — qui, quand}} |

> **Un engagement sans preuve d'architecture qui le rende atteignable est un objectif mal nommé.**
> La section existe parce qu'une fiche a inscrit « disponibilité 99,5 %, engagements validés par le
> porteur, et donc opposables » sur un service à une seule instance, sans redondance de zone et sans
> emplacement de déploiement : chaque livraison redémarrait l'unique conteneur. L'engagement n'était
> pas tenable, et rien n'avait obligé à citer la mesure qui l'aurait montré. **Une cible et une
> mesure ponctuelle ne se mélangent jamais** — « rétablissement visé 2 à 4 min » et « 45 s observées
> sur une bascule » sont deux phrases, deux lignes, deux natures.

## Contacts

| Rôle | Nom | Contact |
|---|---|---|
| {{roles.security_officer}} | {{contacts.security_officer.nom}} | {{contacts.security_officer.email}} |
| Porteur | {{porteur.nom}} | {{porteur.email}} |
| Référent technique | {{contacts.referent_technique.nom}} | {{contacts.referent_technique.email}} |
| Astreinte | {{contacts.astreinte}} | {{contacts.astreinte_canal}} |

## Validation

| Champ | Valeur |
|---|---|
| Avis {{roles.security_officer}} | {{validation.avis — favorable/favorable sous réserve/défavorable}} |
| Réserves éventuelles | {{validation.reserves}} |
| Date de validation | {{validation.date}} |
