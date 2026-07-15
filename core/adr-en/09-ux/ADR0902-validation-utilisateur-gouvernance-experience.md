---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "product design teams, domain owners"
informed: "all product teams"
id: ADR0902
domain: "09"
invariant: false
standards: ["ISO 9241-210 (conception centrée sur l'humain)", "ISO 9241-11 (efficacité, efficience, satisfaction)"]
derived_controls: [CTL-D11-05, CTL-D11-06, CTL-D11-07, CTL-D11-08, CTL-D13-05]
profile_bindings: optional
---

# Continuous User Validation and Experience Governance

## Context and Problem Statement

A journey can be accessible within the meaning of ADR0901 and still be unusable:
accessibility guarantees that an interface is reachable, not that it actually serves the
user. Without validation by real users or governance of feedback, the experience degrades
silently — undetected friction points, unusable error messages, unmeasured perceived
performance — until users abandon the journey or file a complaint. How can we guarantee
that critical journeys are validated with real users and that the feedback collected
effectively governs the continuous improvement of the experience?

## Decision Drivers

* Validation through real usage, not only through technical compliance or internal review
* Continuous feedback loop rather than a one-off test before launch, never repeated
* Governance of feedback (prioritized backlog) rather than collection with no follow-up
* Coverage of the three dimensions of usability: effectiveness, efficiency, satisfaction

## Considered Options

* Systematic user testing of critical journeys before wide release, complemented by governed continuous feedback collection
* One-off user testing at launch only, with no continuous collection afterward
* No formal user testing; feedback handled only through reactive customer support

## Decision Outcome

Chosen option: "Systematic testing + governed continuous collection", because it is the
only option that validates the experience before large-scale exposure and sustains that
validation over time, rather than freezing it on launch day.

### Consequences

* Good, because major friction points are detected before reaching the entire user base.
* Good, because the improvement backlog is fed by real, prioritized feedback rather than internal intuitions.
* Bad, because recruiting representative users and maintaining continuous collection represents a recurring effort.
* Neutral, because the cadence of test sessions and the feedback collection channel remain overlay parameters.

### Confirmation

Derived controls (existing, attached — no new control created): CTL-D11-06 (critical
journeys tested with representative users before wide release, friction correction plan),
CTL-D11-05 (perceived performance measured by a generic tool on the main journeys),
CTL-D11-07 (error messages identifying the problem and proposing a concrete action),
CTL-D11-08 (continuous user feedback collection mechanism feeding a prioritized backlog),
CTL-D13-05 (user documentation published and kept up to date). Expected evidence: user
test session reports + perceived performance report + export of collected feedback and its
handling in the backlog. Scoring: compliant = critical journeys tested, feedback collected
and tracked through to the backlog; partial = partial journey coverage or collection with
no traceability; non-compliant = no user testing or collection mechanism.

## Pros and Cons of the Options

### Systematic Testing + Governed Continuous Collection
* Good, because it validates the experience both before and after large-scale exposure.
* Bad, because of the recurring effort of recruiting users and running the backlog.

### One-Off Testing at Launch Only
* Good, because the cost is limited to a single exercise.
* Bad, because the experience drifts undetected after launch; there is no feedback loop.

### No Formal Testing, Reactive Support Only
* Good, because there is no dedicated upfront cost.
* Bad, because only users who contact support are heard; the majority of friction points remain invisible.

## More Information

Instantiations per profile: `profil:web` → generic perceived-performance measurement tool
integrated into the pipeline, complemented by a feedback collection platform (in-app
survey, form); the user testing protocol (number of participants, frequency) falls under
the overlay. Complements ADR0901 (domain 09): accessibility guarantees reachability, this
ADR governs usability and its continuous improvement.
