---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "FinOps teams, domain leads"
informed: "all product teams"
id: ADR0107
domain: "01"
invariant: false
standards: ["FinOps Foundation — cycle Inform/Optimize/Operate", "ISO/IEC 38500:2015 — principe d'acquisition"]
derived_controls: [CTL-D00-07, CTL-D07-04, CTL-D07-05, CTL-D07-06, CTL-D07-07]
---

# Cost Governance: Budgets, Alerts, FinOps Reviews

## Context and Problem Statement

Without active cost governance, hosting spend silently drifts until it is noticed on the
bill, long after the decision that caused it was made — too late to influence it
effectively. How can a continuous cost governance be established that detects drift as it
occurs and involves the right stakeholders in the decision?

## Decision Drivers

* Detection of cost drift as close as possible to the triggering event, not at the end of the billing cycle
* Budget accountability by perimeter (product, domain) rather than an opaque global budget
* Recurring collective decision-making rather than an ad hoc reaction to an isolated alert
* Applicability independent of the hosting provider and the billing model chosen

## Considered Options

* Budgets declared per perimeter with automatic drift alerts and periodic FinOps review
* After-the-fact billing tracking, with no upfront budget or alert
* A technical spending cap that blocks upon being exceeded, with no review or analysis

## Decision Outcome

Chosen option: "Budgets per perimeter + alerts + periodic review", because it alone
combines early detection, per-perimeter accountability, and recurring informed
decision-making — after-the-fact tracking arrives too late, and a blocking cap with no
review risks interrupting a service for a cause that was never analyzed.

### Consequences

* Good, because cost drift is visible and discussed before it becomes a significant budget deviation.
* Good, because the periodic review turns cost data into an arbitration decision rather than an ignored dashboard.
* Bad, because declaring budgets per perimeter presupposes tagging that is already reliable (see ADR0102/ADR0103), without which allocation remains approximate.
* Neutral, because the alert threshold and review cadence remain overlay parameters.

### Confirmation

Derived controls: CTL-D07-04 (budget declared and drift alert active for every
significant perimeter), CTL-D07-05 (periodic FinOps review tracked, with decisions
recorded). Expected evidence: budget and alert configuration, and a dated FinOps review
record. Grading: compliant = budgets covering all significant perimeters and regular
review tracked; partial = partial budgets or irregular review; non-compliant = no budget
declared or no drift alert.

## Pros and Cons of the Options

### Budgets per perimeter + alerts + periodic review
* Good, because drift is detected early and arbitrated collectively on a recurring basis.
* Bad, because it depends on tagging that is already reliable for precise per-perimeter allocation.

### After-the-fact billing tracking
* Good, because no upfront tooling is required.
* Bad, because drift is only noticed after the fact, beyond any capacity for a quick response.

### Blocking cap without review
* Good, because it provides immediate protection against runaway cost.
* Bad, because it interrupts a service without analyzing the cause, creating an uncontrolled operational risk.

## More Information

Profile instantiations: `profil:azure` → budget and alert management, complemented by
FinOps dashboards for review; `profil:aws` → budgets and cost anomaly detection. The
review cadence (monthly, quarterly) is an overlay concern.
