---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "operations teams, data teams"
id: ADR0608
domain: "06"
invariant: true
standards: ["DAMA-DMBOK2 — Chapitre 12 (Metadata Management — lignage)", "ISO 8000-8 — qualité de l'information : concepts et mesure", "ISO/IEC 27002:2022 — 8.15 (journalisation)"]
derived_controls: [CTL-D05-07, CTL-D14-07, CTL-D14-09, CTL-D15-06]
profile_bindings: optional
---

# Data observability: monitoring, alerting, and lineage

## Context and Problem Statement

Without dedicated lineage or monitoring, a data anomaly (delay, abnormal volume, distribution drift) is only detected when a business user notices an inconsistent result, and its origin remains untraceable within the processing chain. How can we guarantee that a data asset is monitored continuously and that its provenance remains traceable end to end?

## Decision Drivers

* Proactive detection of freshness, volume, and distribution anomalies
* Provenance traceability of an asset back to its sources, across all transformations
* Reduced delay between the introduction of an anomaly and its detection
* Neutrality with respect to the observability platform in use

## Considered Options

* Automatic end-to-end lineage and continuous monitoring with threshold-based alerting
* Logging of pipeline executions only, with no lineage or alerting
* No dedicated monitoring; anomalies are reported by end users

## Decision Outcome

Chosen option: "Automatic lineage and continuous monitoring", because it is the only option that connects the detection of an anomaly to its cause within the processing chain, instead of observing a symptom with no way to trace back to the origin.

### Consequences

* Good, because a freshness or volume anomaly is detected before it reaches a report or a business consumer.
* Good, because lineage makes it possible to trace any inconsistent result back to the source and the transformation responsible.
* Bad, because instrumenting lineage and monitoring requires an initial integration effort per pipeline.
* Neutral, because the volume of monitoring metadata must be sized according to its own retention policy (link ADR0609).

### Confirmation

Derived controls: CTL-D05-07 (end-to-end lineage tracked and viewable for critical assets), CTL-D15-05 (active alerting on freshness and volume, with declared thresholds). Expected evidence: capture of a critical asset's lineage graph and history of triggered alerts. Scoring: compliant = lineage viewable and alerting active on critical assets; partial = only one of the two; non-compliant = neither lineage nor alerting.

## Pros and Cons of the Options

### Automatic lineage and continuous monitoring

* Good, because it provides proactive detection and traceability to the root cause.
* Bad, because it requires an initial instrumentation effort per pipeline.

### Execution logging alone

* Good, because it is simple to set up and already present in most engines.
* Bad, because it does not connect an observed anomaly to its cause; no visibility into provenance.

### No dedicated monitoring

* Good, because zero cost in the short term.
* Bad, because every anomaly is discovered by a business user, often belatedly.

## More Information

Instantiations: `profil:databricks-lakehouse` → native column-level lineage exposed by the technical catalog and its system tables; `profil:elastic` → freshness and volume dashboards on the unified observability platform (link ADR0401).
