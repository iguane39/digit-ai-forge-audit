---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0706
domain: "07"
invariant: false
standards: ["OWASP ASVS 5.0 — V13 (limitation de débit)", "SRE — Site Reliability Engineering (gestion de la charge)"]
derived_controls: [CTL-D06-02, CTL-D06-05]
---

# Quota Management and Rate Limiting at the Boundaries

## Context and Problem Statement

An API exposed without a rate limit can be saturated by a malfunctioning consumer, a
legitimate spike, or a volumetric attack, with a cascading effect on upstream and
downstream applications. This risk is not covered by any explicit decision as long as rate
limiting remains a technical parameter left to each team's discretion; it deserves a
standalone policy decision, distinct from the choice of trusted intermediary that exposes
the API (ADR0701).

## Decision Drivers

* Service continuity for all legitimate consumers in the event of a spike
* Protection against abuse scenarios or volumetric denial-of-service attacks
* Contractual visibility for the consumer over the limits that apply to it
* Uniform enforcement of quotas without relying on each team's discipline

## Considered Options

* Quotas and rate limiting applied and governed at the common exposure point
* Rate limiting implemented case by case within each application
* No limiting, with capacity sized to absorb any spike

## Decision Outcome

Chosen option: "Quotas governed at the common exposure point", because it applies a
uniform, verifiable rule to every exposed API, protects applications that would not
themselves have implemented a limit, and does not depend on costly, uncapped
over-provisioning.

### Consequences

* Good, because there is only a single quota policy to audit for all exposed APIs.
* Good, because consumers receive a controlled rejection instead of silent degradation.
* Bad, because a poorly sized legitimate consumer may be throttled; an adjustment is then necessary.
* Neutral, because thresholds must be reviewed periodically as usage evolves.

### Confirmation

Derived controls: CTL-D06-02 (rate quotas and thresholds defined, justified, and applied
for every exposed API — review mode), CTL-D02-05 (quota overrun rejected at the exposure
point, never left to the application — automatic mode). Expected evidence: documented
quota policy + active configuration at the exposure point. Scoring: compliant = quotas
active and documented for 100% of APIs; partial = quotas active without documented
justification of thresholds; non-compliant = API exposed without a quota.

## Pros and Cons of the Options

### Quotas Governed at the Common Exposure Point
* Good, because the rule is uniform and protects even non-instrumented applications.
* Bad, because a threshold adjustment process must be operated over time.

### Case-by-Case Limiting per Application
* Good, because thresholds are finely tuned to each application's context.
* Bad, because coverage is incomplete and inconsistent; the audit must be redone per application.

### No Limiting, Over-Provisioning
* Good, because consumers perceive no constraint under normal usage.
* Bad, because infrastructure cost is unbounded and there is total vulnerability to a spike or abuse.

## More Information

Instantiations: `profil:azure` → quota policies at the API gateway level; other profiles →
equivalent rate limiting at the common exposure point (link ADR0701).
