---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "all product teams"
id: ADR0601
domain: "06"
invariant: true
standards: ["DAMA-DMBOK2 — Chapitre 3 (Data Governance)", "RGPD — Art. 24 (responsabilité du responsable de traitement)", "ISO/IEC 38505-1:2017 — gouvernance des données"]
derived_controls: [CTL-D05-01, CTL-D14-01, CTL-D15-01, CTL-D15-08]
profile_bindings: optional
---

# Data ownership: named business Data Owner

## Context and Problem Statement

Without an identified business owner for a data domain or data asset, decisions about quality, access, and retention have no arbiter: every incident is resolved case by case, and no responsibility can be enforced in an audit. How can we guarantee that a data asset always has an identifiable business owner, independent of the organization or the tooling in place?

## Decision Drivers

* Clear accountability for decisions related to a data asset (access, quality, lifecycle)
* Compliance with the data controller's accountability obligation
* Fast arbitration in the event of a usage conflict or an incident affecting data
* Neutrality with respect to the organization and the technical platform in use

## Considered Options

* Named business Data Owner per data domain, recorded in the governance register
* Ownership held by default by the technical team that created the asset
* Implicit, undeclared ownership, resolved case by case during incidents

## Decision Outcome

Chosen option: "Named business Data Owner per data domain", because it is the only option that makes responsibility verifiable in an audit, independent of technical staff turnover, and aligned with the accountability obligation borne by the data controller.

### Consequences

* Good, because each data asset has a single business point of contact to arbitrate access, quality, and retention.
* Good, because responsibility survives technical reorganizations and team departures.
* Bad, because it adds a burden for business teams, who must take ownership of a governance role.
* Neutral, because it requires an ownership register that is kept up to date (link ADR0610).

### Confirmation

Derived controls: CTL-D15-01 (Data Owner named and documented for each data domain — declarative mode), CTL-D05-01 (source and pipeline ownership register kept up to date — review mode). Expected evidence: governance register with one Data Owner per domain and the date of the last review. Scoring: compliant = 100% of domains covered and reviewed ≤ 12 months ago; partial = partial coverage or expired review; non-compliant = domain without an identified Data Owner.

## Pros and Cons of the Options

### Named business Data Owner per domain

* Good, because responsibility is clear, stable, and enforceable in an audit.
* Bad, because it requires an effort of ownership and training on the business side.

### Default ownership by the creating technical team

* Good, because no additional organizational effort is needed at the start.
* Bad, because business responsibility remains absent and dilutes as soon as the team changes.

### Implicit ownership, resolved case by case

* Good, because zero cost in the short term.
* Bad, because there is no arbiter in the event of an incident; not auditable by design.

## More Information

Instantiations: `profil:databricks-lakehouse` → owner attribute carried by the technical catalog at the schema/table level; `profil:azure` → Data Owner attribute carried by Microsoft Purview. The profile provides the declaration mechanism; the governance register remains the source of truth.
