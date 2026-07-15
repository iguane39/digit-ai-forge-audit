---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "operations teams, architects"
informed: "product teams"
id: ADR0405
domain: "04"
invariant: false
standards: ["SRE (Google) — objectifs de niveau de service et budgets d'erreur", "DORA (Accelerate) — métriques de fiabilité et de reprise (MTTR)", "ISO/IEC 25010 (fiabilité)"]
derived_controls: [CTL-D10-06, CTL-D10-07, CTL-D12-02, CTL-D12-03]
---

# Alerting based on SLOs and error budgets

## Context and Problem Statement

An arbitrarily set alert threshold (CPU, raw latency) generates either too many ignored
alerts or too few relevant ones, with no connection to the experience actually promised to
the user. How can alerting be founded on an explicit service commitment rather than on
technical thresholds disconnected from that commitment?

## Decision Drivers

* Alerting tied to the promised user experience, not to an isolated technical metric
* Objective prioritization of incident response based on the consumption of the remaining error budget
* Reduction of alert fatigue (numerous, non-actionable alerts)
* Calibration proportionate to the actual maturity and criticality of each service

## Considered Options

* Service level objectives declared per critical service, with alerting based on the consumption of the associated error budget
* Fixed technical thresholds per metric (CPU, memory, raw latency), independent of any service commitment
* Reactive alerting only, triggered by user reports

## Decision Outcome

Chosen option: "Declared SLOs + alerting on error budget", because it ties every alert to
an explicit service commitment and objectively prioritizes the response according to the
remaining margin — its implementation assumes a maturity of SLO definition that not all
services have yet reached, hence its non-invariant status.

### Consequences

* Good, because every alert is tied to an explicit service commitment understood by stakeholders.
* Good, because error budget consumption objectively prioritizes competing incident responses.
* Bad, because it assumes defined and revised SLOs, which are absent by default for a new service.
* Neutral, because the error budget must be recalculated at every SLO revision.

### Confirmation

Derived controls: CTL-D10-06 (alerts based on SLOs and error budget consumption —
established by ADR0401, specialized here), CTL-D12-02 (error budget tracked and action
triggered before exhaustion, tied to the on-call procedure). Expected evidence: SLO
declaration per critical service + error budget consumption history + trace of an action
triggered by a budget threshold. Rating scale: compliant = SLOs declared and budget-based
alerting active for critical services; partial = SLOs declared with no linked alerting;
non-compliant = technical thresholds only, with no SLO declared.

## Pros and Cons of the Options

### Declared SLOs + alerting on error budget
* Good, because alerts are tied to the service commitment, with objective prioritization.
* Bad, because it assumes a maturity of SLO definition.

### Fixed technical thresholds independent of any commitment
* Good, because quick to set up without any prior SLO definition.
* Bad, because it is disconnected from actual user experience; frequent alert fatigue.

### Reactive alerting via user reports
* Good, because zero cost in the short term.
* Bad, because the incident is detected by the person experiencing it, never before.

## More Information

Instantiations: `profil:elastic` → error budget burn rate dashboards + associated alert
rules. Generalizes and completes observability by default (ADR0401), which had already
pre-positioned this control.
