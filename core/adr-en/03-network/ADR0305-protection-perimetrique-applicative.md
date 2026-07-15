---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0305
domain: "03"
invariant: false
standards: ["OWASP ASVS 5.0 — V13", "OWASP Top 10", "ISO/IEC 27002:2022 — 8.20"]
derived_controls: [CTL-D02-02]
---

# Application perimeter protection

## Context and Problem Statement

Every publicly exposed application or API is subject to automated exploitation attempts
(injection, bots, abnormal traffic volume) even before any targeted action occurs. How can
this malicious traffic be filtered as close to the boundary as possible, without shifting
this burden onto each application?

## Decision Drivers

* Filtering of known application-layer attacks before they reach business logic
* Absorption of malicious traffic spikes without degrading legitimate service
* Shared defense for every publicly exposed surface
* Proportionality: the level of protection must match the actual level of exposure

## Considered Options

* Shared application perimeter protection in front of every publicly exposed surface
* Embedded application protection within each application (filtering libraries)
* No dedicated protection, with application-level input validation as the only filter

## Decision Outcome

Chosen option: "Shared perimeter protection", because it filters known attacks and
abnormal traffic volumes before business logic, is updated once for all exposed
applications, and is calibrated to the actual exposure level of each surface — hence its
non-invariant status: a strictly internal application, not publicly exposed, may
legitimately do without it.

### Consequences

* Good, because it reduces the volume of automated attacks that reach the application code.
* Good, because rules are shared and updated centrally for all exposed surfaces.
* Bad, because false positives are possible, requiring fine-tuning per surface.
* Neutral, because it adds an additional inspection point in the request path.

### Confirmation

Derived controls: CTL-D02-10 (application perimeter protection active and up to date on
every publicly exposed route), CTL-D02-11 (volumetric mitigation thresholds defined and
tested). Expected evidence: protection rule configuration + report of a simulated
load/attack test. Rating scale: compliant = active protection with up-to-date rules on
100% of public surfaces; partial = active protection but outdated rules or partial
coverage; non-compliant = public surface with no protection and no justification for the
absence of exposure.

## Pros and Cons of the Options

### Shared perimeter protection
* Good, because shared defense, centralized updates, calibrated to actual exposure.
* Bad, because fine-tuning is required to limit false positives.

### Embedded protection per application
* Good, because fine-grained control specific to each application.
* Bad, because N implementations to maintain, with consistency not guaranteed across applications.

### No dedicated protection
* Good, because zero cost.
* Bad, because the entire filtering burden rests on application code that is never infallible.

## More Information

Instantiations: `profil:azure` → Web Application Firewall on Front Door/Application
Gateway + Azure DDoS Protection. Ties in with the single exposure control point
(ADR0301), which is its natural anchor point.
