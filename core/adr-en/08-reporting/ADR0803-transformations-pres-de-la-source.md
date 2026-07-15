---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, data architects"
informed: "product teams"
id: ADR0803
domain: "08"
invariant: false
standards: ["ELT patterns (transformation near the source)", "DMBOK2 (intégration des données)"]
derived_controls: [CTL-D05-12]
---

# Transformations as Close to the Source as Possible

## Context and Problem Statement

When transformation logic (joins, calculations, complex aggregations) is recreated in
every reporting tool rather than being implemented once close to the source, it gets
rewritten by each reporting team, in a language specific to its own tool, with no version
control or shared testing. How can we guarantee that data transformation logic is governed
and reusable rather than scattered across every reporting tool?

## Decision Drivers

* Reuse of the same transformation logic by multiple reports
* Testability and versioning of the transformation independently of the reporting tool
* Performance: avoiding recalculation of the same transformation every time a report is opened
* Portability: changing reporting tools must not force a rewrite of the business logic

## Considered Options

* Transformations implemented as close to the source as possible, tested and versioned
* Split transformations: part close to the source, part in each tool
* Transformations implemented entirely in the reporting tool, at display time

## Decision Outcome

Chosen option: "Transformations as close to the source as possible", because it makes the
logic testable, versioned, and reusable independently of the reporting tool, whereas the
other two options scatter all or part of that logic across untested, unversioned layers.

### Consequences

* Good, because a single validated transformation serves every report that depends on it.
* Good, because adding a reporting tool does not require rewriting the business logic.
* Bad, because every change follows its own delivery cycle, slower than a local calculation.
* Neutral, because a dedicated test suite for transformations must be maintained close to the source.

### Confirmation

Derived controls: CTL-D05-05 (transformation logic tested and versioned close to the
source, outside the reporting tool — review mode), CTL-D05-06 (no significant business
calculation recreated in the reporting tool — review mode). Expected evidence: inventory
of transformations with their location + associated test suite. Scoring: compliant = all
significant transformations close to the source and tested; partial = documented residual
minor calculations; non-compliant = substantial logic recreated in the reporting layer.

## Pros and Cons of the Options

### Transformations Close to the Source
* Good, because it is testable, versioned, and reusable by any reporting tool.
* Bad, because the delivery cycle is slower than an instant local calculation.

### Split Transformations
* Good, because it appears to compromise between local speed and shared reuse.
* Bad, because logic is partially duplicated, making inconsistencies hard to locate.

### Transformations in the Reporting Tool
* Good, because of immediate iteration with no delivery cycle.
* Bad, because the logic is untested, non-reusable, and rewritten per report and per tool.

## More Information

Instantiations: the upstream transformation pattern (governed ELT close to the source)
remains an open standard; `profil:databricks-lakehouse` → orchestration and testing of
transformations before exposure to the reporting layer.
