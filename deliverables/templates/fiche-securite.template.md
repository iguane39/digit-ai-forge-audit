<!-- AuditCore template v1 — généré pour {{tenant.name}} via la config ; ne pas éditer les livrables produits à la main -->

# {{tenant.name}} — Fiche sécurité de mise à disposition — {{projet.nom}} — {{date}}{{indice}}

> Fiche remplie à chaque mise à disposition d'un environnement (dev, sandbox…) du périmètre audité.
> Champs génériques core ; champs additionnels propres au tenant ajoutés par pack (`packs/*`), jamais
> retirés de la base ci-dessous (même invariant que le référentiel).

## Identification

| Champ | Valeur |
|---|---|
| Projet / application | {{projet.nom}} |
| Porteur | {{porteur.nom}} ({{porteur.email}}) |
| Direction / équipe | {{porteur.direction}} |
| Type de solution | {{projet.type}} *(web-app · api · data · mobile · ml · infra)* |
| Environnement concerné | {{environnement.label}} ({{environnement.code}}) |
| Date de mise à disposition | {{date}} |
| URL / point d'accès | {{environnement.url}} |

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
| Modèle d'autorisation | {{auth.rbac — rôles, granularité}} |

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
