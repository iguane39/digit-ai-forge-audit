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
| Authorization model | {{auth.rbac — rôles, granularité, ou « aucun rôle, aucune granularité » }} |
| **Population actually admitted** | {{auth.population_admise — WHO gets in, and HOW MANY: "tenant staff (N)", "any account from the identity provider, guests included (N of which M guests)"… }} |
| **Effective access restriction** | {{auth.restriction — role assignment required yes/no · allow-list populated yes/no and its content · or "none: any authenticated account gets in" }} |
| **External / guest accounts in scope** | {{auth.invites — count as of the sheet's date, and the command or screen that produced it }} |

> **Authenticating is not being admitted.** The three bold fields exist because a sheet once told
> the truth and conveyed a falsehood: "single-tenant identity provider, sign-in required" read as
> "restricted audience" while role assignment was off, allow-lists empty, and 3,128 directory guest
> accounts admitted on the same footing as staff. A control mechanism is described by WHAT IT LETS
> THROUGH, counted; "no restriction" is a valid answer and a finding for the report, never a blank.

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

## Service commitment

| Field | Value |
|---|---|
| Nature of the value | {{sla.nature — "objective" (targeted, not binding) or "commitment" (binding) }} |
| Availability | {{sla.disponibilite}} |
| Recovery time (RTO) | {{sla.rto — value, and its nature: target or commitment}} |
| Tolerated data loss (RPO) | {{sla.rpo — value, and its nature: target or commitment}} |
| Outage on each release | {{sla.coupure_livraison — duration, or "unknown"; never "none" without a measurement}} |
| Evidence it is attainable | {{sla.preuve — service plan, instance count, zone redundancy, deployment slots; THIS line is what licenses the word "commitment"}} |
| Approved by | {{sla.valide_par — who, when}} |

> **A commitment with no architectural evidence making it attainable is a mis-named objective.**
> This section exists because a sheet recorded "99.5 % availability, commitments approved by the
> owner, therefore binding" for a single-instance service with no zone redundancy and no deployment
> slot: every release restarted the only container. The commitment was not attainable, and nothing
> had required citing the measurement that would have shown it. **A target and a one-off measurement
> never mix** — "recovery targeted at 2-4 min" and "45 s observed on one failover" are two
> sentences, two rows, two natures.

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
