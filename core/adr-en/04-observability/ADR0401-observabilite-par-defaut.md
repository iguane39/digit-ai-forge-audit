---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "operations teams, architects"
informed: "product teams"
id: ADR0401
domain: "04"
invariant: true
standards: ["ISO/IEC 25010 (analysabilité, fiabilité)", "DORA (Accelerate) (MTTR)", "ISO/IEC 27002:2022 — 8.15"]
derived_controls: [CTL-D10-01, CTL-D10-02, CTL-D10-03, CTL-D10-04, CTL-D10-05, CTL-D10-06, CTL-D10-11, CTL-D10-13]
---

# Observability by default: structured logs, metrics, traces

## Context and Problem Statement

Without standardized telemetry from the design stage, every incident is diagnosed "blind"
and every operational audit fails for lack of evidence. What minimal observability
foundation must every application embed, regardless of its stack?

## Decision Drivers

* Fast diagnosis (MTTR) and operational evidence that holds up in audit (D10, D12)
* End-to-end correlation of requests across components
* Technological neutrality: the instrumentation standard must not impose a vendor
* Control over telemetry volume and cost

## Considered Options

* Standardized instrumentation of the 3 signals (structured logs, metrics, traces) toward a unified platform
* Application logs only, collected by file
* Letting each team choose its own instrumentation and destination

## Decision Outcome

Chosen option: "Standardized instrumentation of the 3 signals", because it alone enables
cross-component correlation, provides the evidence expected by the reference framework
(D10: 13 themes), and remains agnostic: the instrumentation standard is open, and the
destination platform is a profile choice.

### Consequences

* Good, because MTTR becomes measurable and improved; dashboards and alerts become audit evidence.
* Good, because correlation by trace identifier crosses service boundaries.
* Bad, because telemetry volume/cost must be governed (sampling, retention — see ADR0404).
* Neutral, because it requires an initial instrumentation effort per service.

### Confirmation

Derived controls: CTL-D10-01 (structured logs + standardized levels), CTL-D10-02
(correlated traces on critical paths), CTL-D10-06 (alerting based on SLOs — see ADR0405).
Evidence: structured log excerpts, end-to-end trace capture, SLO definitions. Rating
scale: compliant = 3 signals active and correlated; partial = structured logs only;
non-compliant = unstructured or absent logs.

## Pros and Cons of the Options

### Three standardized signals toward a unified platform
* Good, because correlation, evidence, MTTR; agnostic through the open standard.
* Bad, because platform cost and instrumentation discipline are required.

### File logs only
* Good, because trivial to set up.
* Bad, because no correlation or metrics; weak evidence; slow diagnosis.

### Free choice per team
* Good, because maximum autonomy.
* Bad, because N platforms, no cross-cutting correlation, operational audit becomes impossible.

## More Information

Instantiations: `profil:elastic` → unified platform + common field schema;
instrumentation standard recommended at the core level: OpenTelemetry (an open standard,
not tied to any vendor — admissible in the core under the stop rule: it is a
specification, not a product).
