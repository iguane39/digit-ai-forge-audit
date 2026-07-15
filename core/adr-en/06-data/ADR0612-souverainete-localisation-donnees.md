---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "{roles.security_officer}, all product teams"
id: ADR0612
domain: "06"
invariant: true
standards: ["RGPD — art. 25 (protection des données dès la conception, étendue architecturalement à la résidence)", "ISO/IEC 27018:2019 (protection des données à caractère personnel dans les services d'informatique en nuage publics)"]
derived_controls: [CTL-D05-16]
profile_bindings: optional
---

# Data sovereignty and localization by design

## Context and Problem Statement

ADR0304 governs the legal mechanism for transferring data that is already located somewhere, flow by flow; it says nothing about the upstream decision — knowing where data should reside from the design stage, based on its classification. Without a residency requirement declared at design time, the actual location of a data asset results from a default hosting choice, untracked, discovered after the fact — often during an incident or an audit. How can we guarantee that data residency is decided, declared, and verifiable from the design of every asset, independent of the transfer mechanism that would subsequently apply to a given flow?

## Decision Drivers

* Residency decision made at design time, not observed after the fact
* Residency traceability by data classification, not by hosting default
* Technical verifiability of the actual location, independent of the contractual declaration
* Clear distinction from the legal transfer mechanism (ADR0304), to avoid duplication

## Considered Options

* Residency requirement declared by classification from the design stage, technically verified
* Residency determined implicitly by the default hosting choice, with no dedicated declaration
* Residency addressed only at the time of a transfer, as an upstream extension of ADR0304's mechanism

## Decision Outcome

Chosen option: "Residency requirement declared by design and verified", because it is the only option that makes location enforceable from the design stage rather than discovered after the fact, while remaining distinct from and complementary to the transfer mechanism already covered by ADR0304.

### Consequences

* Good, because every data asset carries an explicit residency requirement, aligned with its classification.
* Good, because the actual location becomes technically verifiable, not merely declarative.
* Bad, because some existing hosting arrangements may prove non-compliant once the requirement is formalized, requiring migration.
* Neutral, because applicable residency requirements vary by classification and by the tenant's regulatory context; the generic body sets no jurisdiction.

### Confirmation

Derived controls: CTL-D05-16 (every classified data asset carries a residency requirement declared from its design, and the actual location of its storage and processing is technically verified for consistency with that requirement — automatic + review mode). Expected evidence: classification register with the residency requirement per asset, plus a technical verification report of the location (actual storage/processing region). Scoring: compliant = 100% of classified assets with a declared residency and verified compliant location; partial = residency declared but not technically verified; non-compliant = no declaration, or an observed location that is non-compliant.

## Pros and Cons of the Options

### Residency requirement declared and verified
* Good, because residency is enforceable from the design stage and technically verifiable.
* Bad, because it may reveal gaps on already-hosted assets, requiring migration.

### Residency implicit by hosting default
* Good, because it requires no additional declaration at the start.
* Bad, because the actual location is never tracked or verified; it depends on an ungoverned technical choice.

### Residency addressed only at the time of transfer
* Good, because it reuses ADR0304's existing mechanism with no new structure.
* Bad, because it does not cover initial storage; an asset that is never transferred remains without a declared residency requirement.

## More Information

Instantiations: `profil:azure` → region pinning and residency policies applied at the subscription or resource group level; `profil:aws` → region constraint per account or organization. Applicable residency requirements (jurisdictions covered, exemptions) are defined by the tenant's regulatory packs, not by this generic body. Distinct from ADR0304: this ADR covers the residency decision at design time, while ADR0304 covers the transfer mechanism for a flow already underway.
