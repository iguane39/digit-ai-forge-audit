---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, data architects"
informed: "product teams"
id: ADR0802
domain: "08"
invariant: true
standards: ["Kimball — bus matrix / source unique", "DMBOK2 (intégration et interopérabilité des données)"]
derived_controls: [CTL-D05-11]
---

# Single, Consistent Source for the BI Layer

## Context and Problem Statement

When multiple reports each draw from their own extract, copy, or calculation, two
dashboards supposed to describe the same reality can silently diverge — each being locally
correct, with none serving as the reference. How can we guarantee that the entire
reporting layer relies on a single, consistent data source, rather than on parallel copies
or extracts?

## Decision Drivers

* A single version of the figures for a given business question, regardless of the report
* Traceability of the path between the source of truth and each report
* Reduction of ungoverned parallel copies and extracts
* Proportionate maintenance effort (one source change, a single propagation)

## Considered Options

* BI layer fed exclusively from the governed source of truth
* Ad hoc extracts per report, refreshed on their own schedule
* Team-local copies, duplicated and manually resynchronized

## Decision Outcome

Chosen option: "Exclusive governed source of truth", because it is the only option that
eliminates divergence between reports by design: every report descends from the same data
path, with only a single propagation needed in the event of a change.

### Consequences

* Good, because two reports asking the same business question always return the same figure.
* Good, because a source change propagates only once, with no per-report replication.
* Bad, because the reporting layer depends on the availability and freshness of the source.
* Neutral, because historical extracts already in circulation must be migrated progressively.

### Confirmation

Derived controls: CTL-D05-03 (BI layer fed exclusively from the registered governed source
— review mode), CTL-D05-04 (no unregistered parallel extract or copy feeding a report —
automatic mode). Expected evidence: source mapping per report + inventory of active
extracts. Scoring: compliant = 100% of reports on a single, registered source; partial =
residual extracts under a dated waiver; non-compliant = unregistered parallel extract
detected.

## Pros and Cons of the Options

### Exclusive Governed Source of Truth
* Good, because consistency is guaranteed and changes propagate only once.
* Bad, because of strong dependency on the source's availability.

### Ad Hoc Extracts per Report
* Good, because of immediate responsiveness for an isolated need.
* Bad, because refresh schedules diverge and figures drift between reports.

### Team-Local Copies Manually Resynchronized
* Good, because of complete autonomy for the team that holds it.
* Bad, because resynchronization is forgotten or delayed; the source of truth is lost sight of.

## More Information

Instantiations: `profil:databricks-lakehouse` → single serving layer exposed to all
reporting tools; the reporting profile (e.g. `profil:powerbi`) exclusively consumes this
single source.
