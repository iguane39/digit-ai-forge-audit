---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.change_board}, domain leads"
informed: "all teams"
id: ADR0004
domain: "00"
invariant: false
standards: ["COBIT 2019 (composant Structures organisationnelles — RACI par pratique)", "ISO/IEC 38500:2015 — principe de responsabilité"]
derived_controls: [CTL-D00-02, CTL-D12-05]
---

# Roles and Responsibilities for Assets (RACI)

## Context and Problem Statement

Without an explicit responsibility matrix per asset (application, service, dataset,
infrastructure component), an incident or an audit question runs into the absence of an
identifiable point of contact, and responsibility becomes diluted across teams as
reorganizations occur. How can we guarantee that, at all times, an owner and the
associated stakeholders are unambiguously identifiable for every asset?

## Decision Drivers

* Reduction of the bus factor and incident resolution time
* No ambiguity: exactly one Accountable role per asset, never zero, never more than one
* Auditability of the responsibility chain (who decides, who operates, who is informed)
* Applicability to any type of asset, regardless of its technical nature

## Considered Options

* Mandatory RACI matrix per asset, declared in the inventory registry and reviewed periodically
* Implicit responsibility inferred from the team org chart, with no declaration per asset
* Owner declared at asset creation, with no planned review or update

## Decision Outcome

Chosen option: "Mandatory RACI matrix + periodic review", because it alone guarantees
that an asset never remains orphaned over time — the implicit org chart quickly becomes
obsolete after a reorganization — and it provides directly usable audit evidence.

### Consequences

* Good, because every asset retains a single Accountable and explicit Consulted/Informed roles, even after a reorganization.
* Good, because the bus factor becomes measurable (single-contributor assets) and manageable over time.
* Bad, because periodically reviewing the matrix is a recurring effort that must be owned and budgeted.
* Neutral, because the granularity of the matrix (per individual asset or per asset family) remains a profile parameter.

### Confirmation

Derived controls: CTL-D12-01 (RACI documented and resolved for all production assets),
CTL-D12-02 (matrix reviewed at an interval ≤ 12 months, with review evidence). Expected
evidence: timestamped export of the RACI matrix and review minutes. Grading: compliant =
matrix complete and review up to date; partial = matrix complete but review overdue; non-
compliant = at least one asset with no identified Accountable.

## Pros and Cons of the Options

### Mandatory RACI matrix + periodic review
* Good, because there is no orphaned asset, the bus factor is measurable, and audit evidence is direct.
* Bad, because it requires recurring effort to maintain the matrix.

### Implicit responsibility via the org chart
* Good, because there is no additional declaration to maintain.
* Bad, because it quickly becomes incorrect after a reorganization, with no usable evidence.

### Declaration at creation, without review
* Good, because the initial effort is minimal.
* Bad, because drift goes undetected: the declared owner may have left the asset or the organization.

## More Information

Profile instantiations: `profil:cmdb-outillee` → RACI matrix carried by the owner/team
fields of the inventory registry (see ADR0105); `profil:wiki-gouvernance` → matrix
published on a dedicated, versioned page.
