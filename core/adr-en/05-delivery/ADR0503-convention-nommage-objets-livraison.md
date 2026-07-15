---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architects, development teams"
informed: "product teams"
id: ADR0503
domain: "05"
invariant: false
standards: ["docs-as-code — convention versionnée et opposable", "ISO/IEC 25010:2011 — Maintenabilité (analysabilité)"]
derived_controls: [CTL-D08-05]
profile_bindings: optional
---

# Unified naming convention for delivery objects

## Context and Problem Statement

Without a shared convention, each team names pipelines, environments, artifacts, and deployment resources according to its own habits. The inventory becomes unreadable, automation scripts multiply into ad hoc variants, and auditing can no longer correlate a delivered object with the application, environment, and version it represents. What convention makes every delivery object unambiguously identifiable?

## Decision Drivers

* Unambiguous identification of every delivered object (application, environment, version)
* Reliable automation: scripts derive a name rather than requesting manual input
* Human readability in operations and audit
* Uniform application regardless of language or hosting provider

## Considered Options

* Documented, versioned convention, automatically verified (naming lint)
* Documented convention applied declaratively, without tooled verification
* No formal convention, naming left to each team's discretion

## Decision Outcome

Chosen option: "Documented and automatically verified convention", because an unverified rule degrades at the first tolerated deviation; tooled verification guarantees over time that an object's name allows application, environment, and version to be reconstructed without consulting external documentation.

### Consequences

* Good, because every delivery object is identifiable and correlatable without ancillary documentation.
* Good, because automation can derive names instead of requesting free-text input.
* Bad, because an additional naming check is added to the existing gates.
* Neutral, because migrating existing non-compliant objects is spread out over time.

### Confirmation

Derived control: CTL-D09-04 (naming convention applied and verified on active delivery objects — pipelines, environments, artifacts). Expected evidence: reference to the documented convention + automated verification report (or manual audit sample). Rating: compliant = convention documented and verified; partial = documented without tooled verification; non-compliant = absence of convention observed.

## Pros and Cons of the Options

### Documented and automatically verified convention
* Good, because it is guaranteed over time, with reliable correlation for audit.
* Bad, because of the initial tooling cost for the naming check.

### Documented convention without verification
* Good, because minimal setup cost.
* Bad, because deviation accumulates undetected; the convention becomes merely indicative.

### No formal convention
* Good, because total freedom for teams.
* Bad, because the inventory becomes unreadable, making correlation impossible during audit and incidents.

## More Information

Instantiations: `profil:azure` → convention integrated into the naming rules for resource groups and pipelines. Any profile may enrich the convention's schema without removing its invariants (application, environment, version).
