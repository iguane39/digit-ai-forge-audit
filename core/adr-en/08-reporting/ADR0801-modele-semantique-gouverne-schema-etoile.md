---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, data architects"
informed: "product teams"
id: ADR0801
domain: "08"
invariant: true
standards: ["Kimball — dimensional modeling (schéma en étoile)", "DMBOK2 (modélisation des données)"]
derived_controls: [CTL-D05-10]
---

# Governed Semantic Model (Star Schema)

## Context and Problem Statement

Without a shared semantic model, each report recalculates its own aggregates and its own
dimension definitions, so that two reports supposed to answer the same business question
display different figures. How can we guarantee that reports and dashboards rely on
common, governed definitions and relationships, rather than on calculations recreated for
every report?

## Decision Drivers

* Consistency of figures across all reports consuming the same business facts
* Understandability of the model by non-technical users
* Query performance for growing data volumes
* Reuse of the same model by multiple reporting tools or teams

## Considered Options

* Governed star-schema semantic model, shared across the entire reporting layer
* Normalized relational model exposed directly to reporting tools
* Aggregates and definitions recalculated independently in each report

## Decision Outcome

Chosen option: "Governed star-schema semantic model", because it offers the best
compromise between understandability for a business user, query performance, and
centralized governance of definitions, whereas the other two options make consistency
dependent on each report taken in isolation.

### Consequences

* Good, because a measure or dimension definition exists in only one place, and it is governed.
* Good, because the star structure remains readable and navigable by a non-technical user.
* Bad, because a modeling authority must validate every change to the model (delay).
* Neutral, because dimensional design discipline is required upstream of any need.

### Confirmation

Derived controls: CTL-D05-01 (semantic model documented and validated by a modeling
authority before exposure — review mode), CTL-D05-02 (every exposed measure is defined
only once in the governed model — review mode). Expected evidence: semantic model diagram
+ measure definition registry. Scoring: compliant = star schema documented, governed, with
no duplicated definition; partial = model documented with occasional waivers;
non-compliant = no governed semantic model.

## Pros and Cons of the Options

### Governed Star Schema
* Good, because it is readable, performant, and has centralized definitions.
* Bad, because modeling governance must be operated continuously.

### Normalized Relational Model Exposed As Is
* Good, because there is no structural duplication and it stays faithful to the source system.
* Bad, because it is unreadable for a business user, with costly joins in the reporting layer.

### Aggregates Recalculated per Report
* Good, because each report is fully autonomous.
* Bad, because figures are guaranteed to diverge between reports, with no common definition.

## More Information

Instantiations: the dimensional modeling pattern (facts, dimensions, star schema) remains
an open standard; `profil:powerbi` → semantic model published as a shared, certified
dataset.
