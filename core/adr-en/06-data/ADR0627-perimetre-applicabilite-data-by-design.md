---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}, {roles.compliance_process}"
informed: "all product teams"
id: ADR0627
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D15-10]
---

# Scope of the data-by-design principles, declared and traced

## Context and Problem Statement

A set of data-by-design principles does not apply to everything: an internal tool with no personal data and an application exposing a business reference do not call for the same level of requirement. When the scope is not declared, two drifts coexist — projects escape it without anyone having decided so, and others comply needlessly. How can we guarantee that a project is in scope, or out of scope, by a traced decision rather than by omission?

## Decision Drivers

* Applicability determined by declared criteria, not by the judgement of the moment
* Opting out is possible, but only through a dated and justified decision
* Proportionality: the requirement follows the nature of the data and the exposure, not the size of the project
* Auditability: the scope can be re-read, project by project

## Considered Options

* Scope determined by declared criteria (nature of the data processed, exposure, business criticality, personal or sensitive character), recorded per project, any exclusion being justified and dated
* The principles applied to all projects without distinction
* Applicability left to the project team's judgement, with no written criteria

## Decision Outcome

Chosen option: "Scope determined by declared criteria and recorded per project", because it is the only option that makes the absence of an assessment visible: an out-of-scope project carries a dated decision, an in-scope project carries an assessment, and a project with neither is an audit finding, not a grey area.

### Consequences

* Good, because an exclusion becomes a traced, enforceable, revisable act.
* Good, because assessment effort concentrates where the data justifies it.
* Bad, because the criteria must be maintained: out of date, they exclude what should be included.
* Neutral, because a project may change scope during its life — the decision must then be replayed.

### Confirmation

Derived control: CTL-D15-10 (the applicability of the data-by-design principles to the project is determined by the declared criteria and recorded, any exclusion carrying a reason and a date — declarative + review mode). Expected evidence: versioned applicability criteria, the project's applicability record filled in and dated, exclusion reason where applicable. Scoring: compliant = applicability recorded and consistent with the criteria; partial = applicability recorded without a reason, or older than 12 months on a project that has evolved; non-compliant = no traced applicability decision.

## Pros and Cons of the Options

### Declared criteria, applicability recorded

* Good, because it makes omission detectable and exclusion enforceable.
* Bad, because the criteria must be maintained.

### Universal application without distinction

* Good, because no eligibility rule to maintain.
* Bad, because disproportionate load on small projects, which end up bypassing the scheme.

### Free judgement by the team

* Good, because zero cost, maximum flexibility.
* Bad, because no trace: an excluded project cannot be told apart from a forgotten one.

## More Information

First part of a triptych: this scope (ADR0627), the maturity computation that follows from it, and the enforceable verdict that concludes it (ADR0629). Complements ADR0206 (classification and protection of personal data), whose entry criteria it reuses.

**To be completed** (`a_completer: true`): the reference source this decision comes from cites **no external standard** — the `standards` field stays empty and must be filled in before any enforcement. Also to be completed: the exact list of applicability criteria and their thresholds, and the ADR for the "computation" part (not cited by the source and therefore not created here — it is not invented).
