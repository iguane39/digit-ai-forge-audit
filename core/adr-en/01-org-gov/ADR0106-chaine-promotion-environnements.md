---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.change_board}, {roles.remediation_team}"
informed: "product teams"
id: ADR0106
domain: "01"
invariant: false
standards: ["DORA (Accelerate) — Accelerate (fréquence de déploiement, lead time)", "12-Factor — X. Dev/prod parity"]
derived_controls: [CTL-D01-04]
---

# Environment Promotion Chain with Responsibility Handover

## Context and Problem Statement

Without a formalized chain of environments or an explicit rule for handing over
responsibility between them, the same software version can behave differently from one
environment to another, and accountability for a production regression becomes unclear.
How can the promotion of a release across environments be structured in a way that
guarantees both configuration parity and clear responsibility at every transition?

## Decision Drivers

* Maximum parity between environments, so that an upstream test is predictive of production
* Clarity of the responsibility handover point: who is accountable, and from when
* Progressive risk exposure: an anomaly must be detected as far upstream as possible
* Consistency of the model, regardless of the hosting provider or deployment tooling

## Considered Options

* Ordered chain of environments with a promotion gate and an explicit responsibility handover at each stage
* Only two environments (development, production), with no intermediate stage
* Multiple environments but informal promotion, with no gate or documented handover

## Decision Outcome

Chosen option: "Ordered chain with promotion gates and explicit handover", because it
alone detects an anomaly before it reaches production while keeping it traceable, at all
times, who is responsible for the artifact being promoted — the other two options defer
both the risk and the ambiguity onto production itself.

### Consequences

* Good, because every promotion gate is a measurable quality-control point before the next environment is exposed.
* Good, because with the responsibility handover made explicit, a production incident does not open a debate over accountability.
* Bad, because the complete chain adds end-to-end lead time to delivery, to be offset by automating the gates.
* Neutral, because the exact number of intermediate environments remains a profile or overlay parameter.

### Confirmation

Derived controls: CTL-D01-04 (environment topology declared with documented configuration
parity), CTL-D09-03 (automated promotion gate between every environment, with
responsibility handover tracked). Expected evidence: a diagram of the environment chain
and a promotion log for a release (gates passed, approver, timestamp). Grading: compliant
= complete chain, gates tracked, and handover explicit; partial = chain present, handover
not systematically tracked; non-compliant = direct promotion with no gate or
traceability.

## Pros and Cons of the Options

### Ordered chain, promotion gates, and explicit handover
* Good, because anomalies are detected upstream, and accountability is clear at all times.
* Bad, because the intermediate gates add end-to-end lead time.

### Only two environments
* Good, because the chain is minimal, reducing delivery lead time.
* Bad, because there is no detection tier before production, and the responsibility handover is binary and coarse.

### Multiple environments without a formalized gate
* Good, because promotion appears more flexible.
* Bad, because there is no guarantee of parity or of traceability for the responsibility handover.

## More Information

Profile instantiations: `profil:git-platform` → promotion gates materialized as protected
deployment environments requiring approval. The exact number and naming of environments
fall under the overlay's standards plan.
