---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "operations teams, architects"
informed: "product teams"
id: ADR0403
domain: "04"
invariant: false
standards: ["ISO/IEC 20000-1 (gestion des services)", "ITIL 4 — pratique de gestion des événements", "ISO/IEC 25010 (fiabilité)"]
derived_controls: [CTL-D10-10, CTL-D12-02]
---

# Monitoring of inter-application exchange flows

## Context and Problem Statement

An integration between applications that fails silently — a blocked queue, degraded
latency, abnormal traffic volume — is often detected only by its final impact, long after
the cause. How can we monitor the health of inter-application exchanges to detect
degradation before an incident becomes visible to the user?

## Decision Drivers

* Early detection of an exchange degradation before its final user impact
* Visibility over flows that cross multiple teams and systems
* Distinction between a component failure and a break in an integration flow
* Monitoring effort proportionate to the actual number and criticality of integrations

## Considered Options

* Dedicated monitoring of exchange flows (latency, errors, traffic volume, queue depth) with declared thresholds
* Indirect monitoring: only the components at the endpoints of the flow are monitored
* No dedicated monitoring, with the incident reported by end users

## Decision Outcome

Chosen option: "Dedicated monitoring of exchange flows", because it alone distinguishes an
integration break from a component failure and enables detection before user impact; its
intensity is calibrated to the criticality of each flow, which justifies its
non-invariant status.

### Consequences

* Good, because an exchange degradation is detected before it degrades the user experience.
* Good, because the cause (flow vs. component) is distinguished as soon as it is detected.
* Bad, because it adds probes and thresholds that must be defined and maintained per flow.
* Neutral, because the criticality of each flow must be declared to calibrate the monitoring effort.

### Confirmation

Derived controls: CTL-D10-05 (automated monitoring of exchange flows: latency, error rate,
traffic volume, queue depth, with declared thresholds per critical flow), CTL-D12-01
(procedure for detecting and escalating a break in an inter-application flow). Expected
evidence: flow monitoring dashboard + documented escalation procedure. Rating scale:
compliant = critical flows monitored with thresholds and tested escalation; partial =
partial monitoring or uncalibrated thresholds; non-compliant = no dedicated flow
monitoring.

## Pros and Cons of the Options

### Dedicated monitoring of exchange flows
* Good, because early detection, with the cause distinguished as soon as the alert fires.
* Bad, because it requires effort to define and maintain thresholds per flow.

### Indirect monitoring of endpoints only
* Good, because it reuses instrumentation already in place on the components.
* Bad, because a break in the flow itself (queue, transformation) remains invisible.

### No dedicated monitoring
* Good, because zero cost in the short term.
* Bad, because the end user becomes the incident detector.

## More Information

Instantiations: `profil:azure` → native metrics from the integration service (Service Bus,
API Management) + Azure Monitor alerts. Ties in with observability by default (ADR0401),
whose integration subset it specializes.
