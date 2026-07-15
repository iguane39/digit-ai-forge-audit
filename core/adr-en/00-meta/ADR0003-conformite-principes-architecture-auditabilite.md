---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architects, {roles.change_board}"
informed: "product teams"
id: ADR0003
domain: "00"
invariant: false
standards: ["TOGAF ADM — Phase G (gouvernance de la mise en œuvre)", "ISO/IEC/IEEE 42010:2022 (conformité de la description d'architecture)"]
derived_controls: [CTL-D00-05, CTL-D00-09, CTL-D01-03, CTL-D01-06, CTL-D13-04]
---

# Compliance with Architecture Principles and Auditability

## Context and Problem Statement

Implementation decisions made outside any architectural framework produce a silent drift
between the documented target architecture and what is actually running in production,
eventually making any subsequent audit unverifiable. How can we continuously and
verifiably confirm that every project remains compliant with the enacted architecture
principles, and that it explicitly documents any deviations?

## Decision Drivers

* Early detection of drift between documented architecture and actual architecture
* Enforceability: a deviation must be visible and justified, never silent
* Auditability: every design decision must be traceable back to a principle or a standard
* Cross-cutting applicability, regardless of project type or technology stack chosen

## Considered Options

* Formalized architecture compliance review at lifecycle milestones, with a deviation register
* Compliance left to each project team's discretion, with no dedicated milestone or register
* Control only after the fact, on the occasion of an ad hoc external audit

## Decision Outcome

Chosen option: "Formalized compliance review + deviation register", because it alone
detects drift at the point when it is least costly to correct, and produces, by
construction, the auditability evidence that an after-the-fact control cannot reconstruct
retroactively.

### Consequences

* Good, because every architecture deviation is declared, justified, and dated instead of being discovered late.
* Good, because the deviation register directly feeds the audit evidence without any reconstruction effort.
* Bad, because the review adds a governance milestone to the project lifecycle, whose effort and lead time must be budgeted.
* Neutral, because the level of requirement (frequency, milestone granularity) remains a profile or overlay parameter.

### Confirmation

Derived controls: CTL-D01-01 (design decisions traced back to a principle or a core ADR),
CTL-D13-05 (architecture deviation register kept up to date and accessible). Expected
evidence: compliance review minutes and the deviation register with remediation status.
Grading: compliant = review held at every milestone, all deviations justified; partial =
review held, not all deviations justified; non-compliant = no review or no deviation
register.

## Pros and Cons of the Options

### Formalized review + deviation register
* Good, because drift is detected early, and audit evidence is produced by construction.
* Bad, because it adds a governance milestone to be handled in every project.

### Compliance left to the team's discretion
* Good, because there is no central governance overhead.
* Bad, because drift goes undetected before the audit, and deviations are neither tracked nor justified.

### After-the-fact control only
* Good, because it costs nothing as long as no audit is triggered.
* Bad, because by the time drift is observed it is already entrenched in production, making correction costly.

## More Information

Instantiations: `profil:suivi-tickets` → deviation register carried by a dedicated
ticket-management system; `profil:leger` → deviations recorded directly in linked ADRs.
The review milestone aligns, for example, with the implementation-governance phase of an
architecture framework (such as Phase G of an ADM).
