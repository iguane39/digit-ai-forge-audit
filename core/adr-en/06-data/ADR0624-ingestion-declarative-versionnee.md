---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.architect}, data teams, operations team"
informed: "all product teams"
id: ADR0624
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D05-18]
---

# Data ingestion defined declaratively and under version control

## Context and Problem Statement

An ingestion chain written as imperative scripts describes a sequence of actions, never the expected state. Its recovery after an incident depends on the order in which steps failed, its quality is checked after the fact, and reviewing it means reading the code to reconstruct what should come out. How can we guarantee that an ingestion chain is recoverable, checkable, and reviewable without executing the code that implements it?

## Decision Drivers

* Deterministic recovery after an incident: the pipeline knows how to recompute what is missing
* Quality expectations (schema, constraints, freshness) declared with the flow, not beside it
* Review possible on the declaration alone, before execution
* Version control and promotion by the delivery pipeline, like any code artifact

## Considered Options

* Ingestion described declaratively (target state, dependencies between datasets, quality expectations), versioned and promoted by the delivery pipeline
* Versioned imperative scripts, orchestrated by an external scheduler
* Ingestion configured in the orchestration tool's interface, with no versioned artifact

## Decision Outcome

Chosen option: "Declarative versioned ingestion", because it is the only option where recovery, quality, and review rest on the same artifact: the declaration carries the expected state, the dependencies, and the quality expectations, can be read without being executed, and follows the code lifecycle — review, promotion, rollback.

### Consequences

* Good, because recovery after an incident is derived from the declaration, not from the execution history.
* Good, because quality expectations live with the flow: they cannot be forgotten at go-live.
* Bad, because a genuinely imperative step (external call, sequential logic) expresses poorly in declarative form and will have to be isolated.
* Neutral, because it requires an ingestion tool able to execute a declaration, which constrains the platform choice.

### Confirmation

Derived control: CTL-D05-18 (the ingestion chains feeding the application are defined by a versioned declarative artifact carrying dependencies and quality expectations, and promoted by the delivery pipeline — automatic + review mode). Expected evidence: versioned pipeline definition artifacts, declared quality expectations, and evidence of promotion through the delivery pipeline. Scoring: compliant = 100% of ingestion chains declared and versioned, quality expectations present; partial = versioned declaration without quality expectations, or partial coverage; non-compliant = ingestion configured outside version control, or unreviewed imperative scripts.

## Pros and Cons of the Options

### Declarative versioned ingestion

* Good, because recovery, quality, and review carried by a single readable artifact.
* Bad, because limited expressiveness for genuinely sequential processing.

### Versioned imperative scripts

* Good, because no expressiveness limit; minimal tooling.
* Bad, because recovery and quality remain to be hand-written, hence often absent.

### Configuration in the tool's interface

* Good, because immediate go-live, with no delivery pipeline.
* Bad, because no version control, no review, no rollback — nobody can reconstruct the production state.

## More Information

Complements ADR0605 (data quality rules and thresholds) by imposing **where** those rules live, and ADR0504 (infrastructure as code, remote state and gates) by extending the same requirement to data chains. Instantiations: `profil:databricks-lakehouse` → declarative table pipelines and the associated deployment bundle; `profil:azure` → pipeline definitions versioned and promoted by the delivery pipeline.

**To be completed** (`a_completer: true`): the reference source this decision comes from cites **no external standard** — the `standards` field stays empty and must be filled in before any enforcement. Also to be completed: the exact boundary between what must stay declarative and what may stay imperative, not provided by the source.
