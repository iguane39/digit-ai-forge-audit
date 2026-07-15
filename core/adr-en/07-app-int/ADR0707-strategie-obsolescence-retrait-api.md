---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0707
domain: "07"
invariant: false
standards: ["OpenAPI (annotations de dépréciation)", "SemVer 2.0.0 (ruptures majeures)"]
derived_controls: [CTL-D01-14]
---

# API Deprecation and Retirement Strategy

## Context and Problem Statement

An API version that remains accessible indefinitely after its replacement becomes
available accumulates unmigrated consumers and unmaintained, unmonitored versions whose
attack surface grows unchecked. This topic is not covered by any explicit decision: each
team retires or keeps its old versions alive according to its own judgment. How can the
progressive retirement of an API version be organized without breaking its consumers by
surprise?

## Decision Drivers

* Predictability of retirement for consumers (timeline, communication, deadline)
* Reduction of the surface exposed to unmaintained or unmonitored versions
* Measurable incentive to migrate to the current version
* Uniform application of the retirement rule, regardless of the API concerned

## Considered Options

* Formalized deprecation policy: announcement, notice period, published retirement deadline
* Informal retirement decided case by case by the team owning the API
* Indefinite maintenance of all published versions, with no retirement

## Decision Outcome

Chosen option: "Formalized deprecation policy", because it gives consumers an enforceable
deadline to migrate, bounds in time the lifespan of unmaintained versions, and applies
identically to every API in the system, unlike a case-by-case judgment.

### Consequences

* Good, because consumers have a known notice period before any retirement.
* Good, because the number of simultaneously active versions remains bounded and monitored.
* Bad, because consumer tracking per version must exist to target communication.
* Neutral, because some late migrations may require a negotiated extension.

### Confirmation

Derived controls: CTL-D01-06 (retirement deadline published and honored for each
deprecated version — review mode), CTL-D02-06 (no deprecated version remains accessible
beyond its deadline — automatic mode). Expected evidence: version registry with status and
deadline + published deprecation notice. Scoring: compliant = deprecation follows the
notice period and the deadline is honored; partial = deadline exceeded on a limited,
waived scope; non-compliant = version maintained with no deadline.

## Pros and Cons of the Options

### Formalized Deprecation Policy
* Good, because of the enforceable deadline, bounded exposed surface, and uniform rule.
* Bad, because consumer tracking per version needs to be tooled.

### Informal Case-by-Case Retirement
* Good, because of maximum flexibility for the owning team.
* Bad, because of unpredictability for consumers and uncoordinated retirements.

### Indefinite Maintenance of All Versions
* Good, because there is no risk of breakage for an unmigrated consumer.
* Bad, because of the accumulation of unmaintained versions and a growing attack surface.

## More Information

Instantiations: the deprecation signal (annotation in the interface contract, response
header signaling the deadline) remains an open convention; `profil:azure` → per-version
API gateway analytics to drive consumer tracking.
