---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, data architects"
informed: "product teams"
id: ADR0804
domain: "08"
invariant: false
standards: ["Kimball — dimension de temps conformée", "DMBOK2 (modélisation des données)"]
derived_controls: [CTL-D05-13]
---

# Standardized Time Dimension

## Context and Problem Statement

When each report defines its own notion of week, fiscal year, or business day, comparing
two reports over time becomes impossible without manual reprocessing — the same month does
not cover the same period from one report to another. How can we guarantee that the entire
reporting layer relies on a single, shared definition of time?

## Decision Drivers

* Direct comparability of reports with one another over the same periods
* Consistent handling of specific calendars (fiscal year, business days)
* Reduction of manual date reprocessing before any time-based comparison
* Consistency of groupings (week, month, quarter) regardless of the report

## Considered Options

* Standardized, governed time dimension, shared by all semantic models
* Raw date columns, reprocessed separately by each report
* Calendar specific to each business domain, with no reconciliation between them

## Decision Outcome

Chosen option: "Shared, standardized time dimension", because it guarantees that two
reports aggregate a period in exactly the same way, which neither of the other two options
can ensure once the definition of time is left to each team's judgment.

### Consequences

* Good, because every time-based comparison relies on the same period boundaries.
* Good, because specific calendars are resolved once for all reports.
* Bad, because changing a calendar rule potentially impacts every report.
* Neutral, because existing reports built on raw dates must be migrated to the dimension.

### Confirmation

Derived control: CTL-D05-07 (shared time dimension used by every semantic model exposed in
the reporting layer — review mode). Expected evidence: time dimension definition + list of
semantic models referencing it. Scoring: compliant = 100% of semantic models reference the
shared dimension; partial = migration in progress on a limited, dated scope; non-compliant
= raw dates reprocessed independently per report.

## Pros and Cons of the Options

### Shared, Standardized Time Dimension
* Good, because comparability is guaranteed and specific calendars are resolved once.
* Bad, because centralized governance is required for every calendar change.

### Raw Date Columns Reprocessed per Report
* Good, because full flexibility is left to each report.
* Bad, because reprocessing is duplicated, with a risk of error and divergence between reports.

### Calendar Specific to Each Business Domain
* Good, because it is finely tuned to a domain's specifics.
* Bad, because no reconciliation is possible during a cross-domain comparison.

## More Information

Instantiations: the conformed time dimension (dimensional modeling pattern) remains an
open standard; `profil:powerbi` → certified date table published and referenced by every
semantic model.
