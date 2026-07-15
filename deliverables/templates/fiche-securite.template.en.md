<!-- AuditCore template v1 — generated for {{tenant.name}} via the config; do not manually edit the produced deliverables -->

# {{tenant.name}} — Deployment Security Sheet — {{projet.nom}} — {{date}}{{indice}}

> Sheet completed for every deployment of an environment (dev, sandbox…) within the audited scope.
> Generic core fields; additional tenant-specific fields added by pack (`packs/*`), never
> removed from the base set below (same invariant as the reference framework).

## Identification

| Field | Value |
|---|---|
| Project / application | {{projet.nom}} |
| Owner | {{porteur.nom}} ({{porteur.email}}) |
| Department / team | {{porteur.direction}} |
| Solution type | {{projet.type}} *(web-app · api · data · mobile · ml · infra)* |
| Environment | {{environnement.label}} ({{environnement.code}}) |
| Deployment date | {{date}} |
| URL / access point | {{environnement.url}} |

## Exposure

| Field | Value |
|---|---|
| Exposure level | {{exposition.niveau}} *(private internal network · internal gateway · public)* |
| Network / segmentation | {{exposition.reseau}} |
| Domain(s) / published IP(s) | {{exposition.domaines}} |
| Exposed ports & protocols | {{exposition.ports}} |
| Perimeter protection | {{exposition.waf_cdn — WAF, CDN, passerelle API, ou « aucune »}} |

## Authentication

| Field | Value |
|---|---|
| Authentication method | {{auth.mode}} |
| Identity provider | {{auth.idp}} |
| MFA | {{auth.mfa — activé/non}} |
| Test accounts | {{auth.comptes_test — nombre, portée, expiration}} |
| Authorization model | {{auth.rbac — rôles, granularité}} |

## Data

| Field | Value |
|---|---|
| Nature of data processed | {{donnees.nature}} |
| Personal data (PII) | {{donnees.pii — oui/non, catégories}} |
| Classification | {{donnees.classification}} |
| Location / residency | {{donnees.localisation}} |
| Retention period | {{donnees.retention}} |

## Flows

| Field | Value |
|---|---|
| Inbound flows | {{flux.entrants — sources, protocole, sens}} |
| Outbound flows | {{flux.sortants — destinations, protocole}} |
| Third-party integrations | {{flux.integrations}} |
| Encryption in transit | {{flux.chiffrement — version TLS, mTLS le cas échéant}} |

## Hardening

- {{durcissement.puce_1 — ex. gestion des secrets en coffre-fort dédié}}
- {{durcissement.puce_2 — ex. scan de dépendances vulnérables en CI}}
- {{durcissement.puce_3 — ex. en-têtes de sécurité HTTP, limitation de débit}}
- Remaining work: {{durcissement.gaps}}

## Contacts

| Role | Name | Contact |
|---|---|---|
| {{roles.security_officer}} | {{contacts.security_officer.nom}} | {{contacts.security_officer.email}} |
| Owner | {{porteur.nom}} | {{porteur.email}} |
| Technical lead | {{contacts.referent_technique.nom}} | {{contacts.referent_technique.email}} |
| On-call | {{contacts.astreinte}} | {{contacts.astreinte_canal}} |

## Validation

| Field | Value |
|---|---|
| {{roles.security_officer}} opinion | {{validation.avis — favorable/favorable sous réserve/défavorable}} |
| Reservations (if any) | {{validation.reserves}} |
| Validation date | {{validation.date}} |
