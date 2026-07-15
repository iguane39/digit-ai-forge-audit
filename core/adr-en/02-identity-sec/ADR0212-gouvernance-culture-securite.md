---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0212
domain: "02"
invariant: false
standards: ["OWASP SAMM v2 — fonction Governance (Strategy & Metrics, Education & Guidance)", "NIST SSDF — PO.1/PO.2"]
derived_controls: [CTL-D02-13]
---

# Security governance and culture by design

## Context and Problem Statement

The corpus imposes many individual security practices (secrets, authentication,
threats, vulnerabilities) without guaranteeing that they fit within a strategy
carried by an identified authority, measured over time, and disseminated through
continuous training. Without this, each practice remains an island with no lever to
advance overall maturity, nor to detect its regression. How can security be governed
through a measured, disseminated strategy?

## Decision Drivers

* Consistency: individual security practices fit within an overall strategy carried by a named authority
* Measurement of security maturity over time, with tracked, enforceable indicators
* Dissemination of security skills to development teams, not only to an isolated expert team
* Methodological neutrality: governance does not depend on any particular tool or maturity model

## Considered Options

* Formalized security strategy (tracked maturity indicators, named authority), complemented by a continuous training program and security relays within the teams
* Security carried solely by a centralized expert team, with no measured strategy nor dissemination to development teams
* No formal governance: security remains the sum of the individual practices already decided, with no dedicated measurement or training

## Decision Outcome

Chosen option: "Measured strategy + continuous training program", the only option
that makes security maturity measurable over time and disseminates the skill beyond
an isolated expert team — a condition for sustaining over time the practices already
decided.

### Consequences

* Good, because security maturity becomes measurable, comparable over time, and enforceable in an audit.
* Good, because development teams carry a share of security accountability, reducing dependency on an isolated team.
* Bad, because a training program and indicators must be maintained over time, a recurring burden independent of any project.
* Neutral, because the target maturity level is left to be set by the designated authority according to the risk context.

### Confirmation

Derived control: CTL-D02-13 (documented security strategy, maturity indicators
tracked at a regular frequency by a named authority, continuous training program
covering development teams — review mode). Evidence: strategy document + indicator
history + training register (coverage rate). Grid: compliant = up-to-date strategy,
tracked indicators AND training disseminated; partial = strategy without
disseminated training; non-compliant = absence of a strategy or of a tracked
indicator.

## Pros and Cons of the Options

### Measured strategy + continuous training
* Good, because of measurable maturity, skill disseminated beyond an isolated expert team.
* Bad, because of a recurring burden of steering and training to maintain.

### Centralized expert team without a measured strategy
* Good, because of concentrated expertise, quick to mobilize on a specific topic.
* Bad, because of no measurement of progress; the skill never spreads to the teams.

### Sum of individual practices without governance
* Good, because of no additional governance effort beyond the ADRs already decided.
* Bad, because of no overall vision; a maturity regression can go unnoticed.

## More Information

Instantiations: `profil:azure`/`profil:aws` → security posture dashboard as a source
of indicators, complemented by a training program specific to the organization. The
maturity model (e.g., SAMM) is a tooling choice; only a measured, disseminated
strategy is invariant. Gap closed: OWASP SAMM Governance function and NIST SSDF
PO.1/PO.2 (EXTENSION-CORPUS.md §2).
