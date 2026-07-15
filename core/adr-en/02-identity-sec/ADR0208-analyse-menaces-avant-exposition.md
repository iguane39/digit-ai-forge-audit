---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0208
domain: "02"
invariant: false
standards: ["OWASP SAMM v2 — Design: Threat Assessment (D-TA)", "NIST SSDF — PW.1/PW.1.1", "ISO/IEC 27002:2022 — 5.8"]
derived_controls: [CTL-D02-09, CTL-D04-03]
---

# Threat analysis before exposure

## Context and Problem Statement

The corpus already governs secrets, authentication, and exposure through a single
control point, but nothing requires analyzing the threats specific to a component
before it is exposed. Without this prior analysis, they are discovered after the
fact — an incident or a penetration test — when fixing them costs the most. How can
we systematically identify and address them before exposure?

## Decision Drivers

* Detection of threats specific to a component before exposure, not after
* Much lower remediation cost at design time than in production (shift-left)
* Traceability: proof that an analysis was conducted, beyond the architect's intuition
* Applicability independent of the stack or the type of exposure

## Considered Options

* Structured threat analysis (flow decomposition + categorization), mandatory before any exposure, with a tracked remediation plan
* Informal security review left to the architect's judgment, with no method or trace
* Threat analysis performed after the fact, during a periodic penetration test

## Decision Outcome

Chosen option: "Structured, prior threat analysis", because it alone produces
evidence usable in an audit, applies before exposure at minimal cost, and does not
depend on any proprietary method: any documented threat decomposition is suitable.

### Consequences

* Good, because major threats are addressed at design time, at minimal remediation cost.
* Good, because of a trace usable in an audit: documented treatment decisions (accept/mitigate/transfer).
* Bad, because of a modeling effort to integrate into the design cycle, an additional burden on the schedule.
* Neutral, because the depth of the analysis must remain proportionate to the criticality of the exposed component.

### Confirmation

Derived controls: CTL-D02-07 (threat analysis documented before exposure), CTL-D02-08
(major threat remediation plan tracked to closure). Evidence: modeling document +
remediation register. Grid: compliant = analysis performed AND plan closed or
tracked; partial = analysis without follow-up; non-compliant = no analysis before
exposure.

## Pros and Cons of the Options

### Structured, prior analysis
* Good, because of audit evidence, minimal remediation cost, non-proprietary method.
* Bad, because of a modeling burden to integrate into the design cycle.

### Informal security review
* Good, because it is fast, with no method to learn.
* Bad, because it depends entirely on individual experience; no usable trace.

### After-the-fact analysis (periodic penetration test)
* Good, because it empirically validates the actual state of the exposed component.
* Bad, because it comes too late: the component is already exposed, remediation is costly.

## More Information

Gap closed: the corpus already governed secrets (ADR0201), exposure via a gateway
(ADR0301), and authentication (ADR0202), but no decision required a prior analysis of
threats specific to a component — the reference profile's inventory contained no
equivalent ADR. Instantiation: `profil:azure` → threat-modeling workshop (flow
decomposition method) during design review.
