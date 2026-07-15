---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "product teams, data teams"
id: ADR0605
domain: "06"
invariant: true
standards: ["ISO/IEC 25012:2008 — modèle de qualité des données", "DAMA-DMBOK2 — Chapitre 13 (Data Quality)", "ISO/IEC 25024:2015 — mesures de qualité des données"]
derived_controls: [CTL-D05-04, CTL-D14-03, CTL-D14-05, CTL-D15-03]
profile_bindings: optional
---

# Data quality: rules, thresholds, and automated checks

## Context and Problem Statement

Without explicit, automated quality rules, anomalies (missing values, duplicates, format breaks, statistical drift) are only detected once they cause a visible business incident, long after they were introduced. How can we guarantee that the quality of a data asset is measured continuously against explicit thresholds, independent of the checking tooling?

## Decision Drivers

* Anomaly detection as close as possible to its introduction, before downstream propagation
* Explicit, measurable thresholds, enforceable in an audit
* Automation needed to cover volumes that manual review cannot handle
* Neutrality with respect to the quality-checking engine in use

## Considered Options

* Declarative quality rules with thresholds, executed automatically on every cycle
* Manual quality checks, performed through periodic sampling
* No formalized checks; quality is observed by end users

## Decision Outcome

Chosen option: "Automated declarative rules", because it is the only option capable of detecting an anomaly before it reaches downstream consumers, at a constant cost regardless of data volume.

### Consequences

* Good, because anomalies are detected and blocked or flagged before propagation.
* Good, because declarative thresholds provide audit evidence that is directly usable.
* Bad, because the initial definition of rules and thresholds requires detailed business knowledge of the domain.
* Neutral, because thresholds must be revised as usage and volumes evolve.

### Confirmation

Derived controls: CTL-D05-04 (automated quality rules with declared thresholds per critical asset), CTL-D15-04 (blocking or alert tracked in the event of a threshold breach). Expected evidence: catalog of quality rules with thresholds, and history of executions and triggered alerts. Scoring: compliant = automated rules active on critical assets with documented thresholds; partial = rules defined but execution manual or partial; non-compliant = no formalized rules.

## Pros and Cons of the Options

### Automated declarative rules

* Good, because early detection and marginal cost independent of volume.
* Bad, because it requires an initial effort to define relevant rules and thresholds.

### Manual checks through sampling

* Good, because it requires no dedicated tooling.
* Bad, because coverage is partial by design; anomalies occurring between two sampling rounds go undetected.

### No formalized check

* Good, because zero cost in the short term.
* Bad, because quality is only observed at the moment of the incident, often by an external third party.

## More Information

Instantiations: `profil:databricks-lakehouse` → declarative quality constraints executed on every batch, with automatic quarantine of failing records; `profil:powerbi` → freshness and quality indicators displayed on certified datasets.
