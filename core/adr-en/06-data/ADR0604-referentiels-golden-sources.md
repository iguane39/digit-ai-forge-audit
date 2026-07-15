---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "product teams, analytics teams"
id: ADR0604
domain: "06"
invariant: false
standards: ["DAMA-DMBOK2 — Chapitre 10 (Reference and Master Data)", "ISO 8000-110 — qualité syntaxique et sémantique des données maîtres"]
derived_controls: [CTL-D05-03]
profile_bindings: optional
---

# Reference datasets as golden sources

## Context and Problem Statement

When the same reference entity (customer, product, site, supplier) is replicated and modified independently across multiple systems, no version is authoritative: reconciliation becomes manual and reports diverge depending on the source consulted. How can we designate, for each critical reference dataset, a source that is authoritative, and prevent the emergence of undeclared competing sources?

## Decision Drivers

* Single version of truth for reference entities shared across domains
* Reduced manual reconciliation and discrepancies observed between reports
* Provenance traceability for any reference data consumed downstream
* Compatibility with legacy reference datasets that are already duplicated

## Considered Options

* Golden source declared per critical reference dataset, with downstream publication from it alone
* Replication tolerated between systems, with periodic after-the-fact reconciliation
* No designation; each consumer chooses its own reference source

## Decision Outcome

Chosen option: "Golden source declared per reference dataset", because it removes the question of after-the-fact arbitration and makes provenance verifiable, whereas periodic reconciliation only manages divergence after it has already occurred.

### Consequences

* Good, because manual reconciliation between systems disappears for the reference datasets covered.
* Good, because any reference data consumed is traceable back to its authoritative source.
* Bad, because designating a golden source requires an organizational arbitration that can be difficult between competing legacy systems.
* Neutral, because reference datasets not yet covered must be prioritized over time.

### Confirmation

Derived controls: CTL-D05-03 (golden source declared and documented per critical reference dataset), CTL-D15-03 (absence of undeclared competing sources confirmed by review). Expected evidence: reference dataset register with the associated golden source, and the result of the duplicate-detection review. Scoring: compliant = golden source declared and no undeclared competing source; partial = golden source declared with documented exceptions; non-compliant = critical reference dataset with no golden source.

## Pros and Cons of the Options

### Golden source declared per reference dataset

* Good, because it provides a single, traceable, enforceable truth.
* Bad, because the initial organizational arbitration can sometimes be costly.

### Replication tolerated with periodic reconciliation

* Good, because it does not require an immediate overhaul of existing systems.
* Bad, because divergence exists between two reconciliation cycles, and its cost remains recurring.

### No designation

* Good, because it requires no organizational effort.
* Bad, because each report can legitimately display a different value for the same entity.

## More Information

Instantiations: `profil:databricks-lakehouse` → reference datasets governed in dedicated schemas with write access restricted to the producing team; `profil:azure` → golden source published and badged in Microsoft Purview.
