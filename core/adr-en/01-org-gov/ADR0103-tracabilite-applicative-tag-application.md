---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "FinOps teams, {roles.remediation_team}"
informed: "product teams, application support"
id: ADR0103
domain: "01"
invariant: false
standards: ["FinOps Framework — domaine Allocation (chargeback)", "ITIL 4 — pratique Service Configuration Management"]
derived_controls: [CTL-D00-04, CTL-D07-03, CTL-D12-02]
---

# End-to-End Application Traceability (the "application" Tag)

## Context and Problem Statement

Even with a tag taxonomy in place, the absence of a unique, mandatory key identifying the
owning application makes it impossible to link a technical resource to a product, a
budget, or an on-call rotation: an incident on an isolated resource gives no way of
knowing which team to notify or which budget to charge. How can we guarantee that,
starting from any resource, the application it depends on can be identified
unambiguously?

## Decision Drivers

* Immediate routing of an incident to the owning application team
* Reliable chargeback and cost allocation at the application level, not only at the domain level
* Consistency between the technical resource inventory and the service registry
* No ambiguity: a resource belongs to one, and only one, application

## Considered Options

* Mandatory "application" tag key, aligned with the service registry identifier, checked and reconciled periodically
* Ownership inferred from the hosting or management perimeter, with no dedicated key
* Ownership documented separately in a manually maintained mapping table

## Decision Outcome

Chosen option: "Mandatory, reconciled application tag key", because it alone provides a
direct, machine-readable, and verifiable link between each resource and the application it
depends on, without relying on a perimeter convention or a side document that drifts over
time.

### Consequences

* Good, because any incident or cost anomaly is resolved through a simple lookup rather than an investigation.
* Good, because periodic reconciliation detects orphaned resources before they become an audit blind spot.
* Bad, because resources shared across multiple applications require an explicit ownership or allocation rule (see ADR0101).
* Neutral, because the application identifier used in the tag must remain stable over time, aligned with the service registry (see ADR0105).

### Confirmation

Derived controls: CTL-D07-03 (all resources carry a valid application tag, resolved in
the service registry), CTL-D12-03 (resource → application → on-call resolution time
measured and bounded). Expected evidence: tag/registry reconciliation report and a timed
example of incident resolution. Grading: compliant = 100% resolution, automated
reconciliation; partial = manual resolution documented for deviations; non-compliant =
orphaned resources not detected.

## Pros and Cons of the Options

### Mandatory, reconciled application tag
* Good, because it provides a direct, verifiable link between a resource and its owning application.
* Bad, because shared resources require an explicit ownership rule.

### Ownership inferred from the management perimeter
* Good, because no additional metadata is required.
* Bad, because a perimeter can host several applications, making ownership ambiguous.

### Manual mapping table
* Good, because it can be put in place immediately, with no automation.
* Bad, because it drifts quickly, with no automatic detection of orphaned resources.

## More Information

Profile instantiations: `profil:azure` → application tag reconciled by a scheduled
function querying the resource graph; `profil:cmdb-outillee` → native reconciliation when
the service registry exposes a technical inventory interface.
