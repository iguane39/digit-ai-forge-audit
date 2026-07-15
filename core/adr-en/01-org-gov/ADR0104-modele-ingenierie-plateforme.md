---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.remediation_team}, architects"
informed: "all product teams"
id: ADR0104
domain: "01"
invariant: false
standards: ["Team Topologies (équipe Platform)", "DORA (Accelerate) — State of DevOps (plateformes internes en self-service)"]
derived_controls: [CTL-D00-06, CTL-D01-02]
---

# Platform Engineering Model (Team and Tooled Foundation)

## Context and Problem Statement

When every product team has to independently re-solve the same infrastructure,
continuous delivery, and compliance problems, cognitive load explodes and practices
diverge to the point of making cross-cutting audits impractical. How can the common
technical foundation be shared without recreating a centralized bottleneck that slows
down every product team?

## Decision Drivers

* Reduced cognitive load for product teams, refocused on business value
* Consistency of cross-cutting practices (security, observability, delivery) without manual control
* Delivery speed: the foundation must accelerate teams, never create a blocking ticket
* Voluntary rather than imposed adoption, a condition for long-term sustainability

## Considered Options

* Dedicated platform team providing a self-service foundation, consumable without a ticket
* Central infrastructure team operating as a request desk, with every request handled manually
* No dedicated team: each product team maintains its own technical foundation

## Decision Outcome

Chosen option: "Platform team + self-service foundation", because it alone reconciles
sharing with speed: the request-desk model recreates a bottleneck, and the absence of a
dedicated team multiplies technical debt and compliance gaps across products.

### Consequences

* Good, because product teams inherit compliant practices by default, with no dedicated effort.
* Good, because the platform itself becomes a measurable product (adoption, satisfaction), not an opaque cost center.
* Bad, because building and tooling the platform team is an upfront investment with no direct business value.
* Neutral, because the foundation must remain compelling on its own merits: made mandatory without sufficient quality of service, it recreates the very bottleneck it was meant to eliminate.

### Confirmation

Derived controls: CTL-D09-01 (self-service foundation documented and consumable without a
blocking ticket), CTL-D09-02 (product team adoption rate and satisfaction measured
periodically). Expected evidence: catalog of published supported paths and
adoption/satisfaction survey results. Grading: compliant = foundation documented, adopted
by a majority of teams, satisfaction measured; partial = foundation documented but
adoption not measured; non-compliant = no shared foundation, or adoption not tracked.

## Pros and Cons of the Options

### Platform team + self-service foundation
* Good, because it preserves cross-cutting consistency and speed for product teams.
* Bad, because it requires an upfront investment to build and tool the team.

### Central team operating as a request desk
* Good, because consistency is guaranteed through centralized control.
* Bad, because every request becomes a point of contention, and product team speed depends on it.

### No dedicated team
* Good, because it offers total autonomy, with no cross-team dependency.
* Bad, because practices diverge, debt is duplicated, and cross-cutting audits become impractical.

## More Information

Profile instantiations: `profil:git-platform` → supported paths materialized as
repository templates and reusable pipelines; `profil:catalogue-developpeur` → developer
portal exposing the service catalog and the available supported paths.
