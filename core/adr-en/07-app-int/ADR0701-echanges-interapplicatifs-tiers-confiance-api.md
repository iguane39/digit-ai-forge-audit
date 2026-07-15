---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0701
domain: "07"
invariant: true
standards: ["OWASP ASVS 5.0 — V13 (API et services web)", "ISO/IEC 27002:2022 — 8.21 (sécurité des services réseau)", "NIST SP 800-207 (zero trust)"]
derived_controls: [CTL-D01-12]
---

# Inter-Application Exchanges via Trusted Intermediary (API)

## Context and Problem Statement

Two applications that exchange data directly (point-to-point calls, a shared database, an
ad hoc script) create tight coupling, a security policy specific to each connection, and a
flow that is invisible to the rest of the information system. How can inter-application
exchanges be organized so that they remain governed, secure, and observable, regardless of
the number of connected applications?

## Decision Drivers

* Traceability of every inter-application exchange (flow inventory, no hidden connections)
* Consistent security policy (authentication, authorization, encryption) per exchange
* Decoupling: one application does not depend on another's internal implementation
* Ability to evolve an application without breaking its consumers

## Considered Options

* Exchanges via a trusted intermediary exposing a contractual API interface
* Direct point-to-point integration between applications (calls or shared database)
* Point-to-point integration with after-the-fact documentation of flows

## Decision Outcome

Chosen option: "Exchanges via a trusted intermediary", because it is the only option that
makes every exchange inventoriable, enforces a single security policy, and decouples
applications from their partners' implementation — regardless of the number of connections
involved.

### Consequences

* Good, because each exchange is an explicit contract, testable and versioned independently of both parties.
* Good, because the inventory of inter-application flows becomes direct audit evidence (D01, D02).
* Bad, because a design effort (contract, access control) is required before any first exchange.
* Neutral, because there is additional call latency compared to direct access.

### Confirmation

Derived controls: CTL-D01-01 (no inter-application exchange outside a contractual trusted
intermediary — review mode), CTL-D02-01 (authentication and authorization active on every
exposed exchange — automatic mode). Expected evidence: inventory of inter-application
flows + published interface contract. Scoring: compliant = all identified exchanges go
through a contractual trusted intermediary; partial = documented and waived exceptions;
non-compliant = untracked direct exchange detected.

## Pros and Cons of the Options

### Contractual Trusted Intermediary
* Good, because of the explicit contract, consistent security, and inventory by design.
* Bad, because of the initial design effort per exchange.

### Direct Point-to-Point Integration
* Good, because it is quick to implement for an isolated need.
* Bad, because of tight coupling, divergent policies, and flows invisible at system scale.

### Point-to-Point + After-the-Fact Documentation
* Good, because there is zero immediate cost.
* Bad, because documentation arrives after coupling has already occurred — the inventory always lags behind.

## More Information

Instantiations: `profil:azure` → API Management acting as trusted intermediary between
applications; other profiles → equivalent integration gateway or exchange bus. Generalizes
the inter-application exchange decisions from the reference profile (API trusted
intermediary).
