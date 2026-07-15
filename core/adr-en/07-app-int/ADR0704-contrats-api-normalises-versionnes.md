---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0704
domain: "07"
invariant: false
standards: ["OpenAPI (spécification d'interface)", "SemVer 2.0.0 (versionnement sémantique)", "ISO/IEC 25010 (compatibilité, maintenabilité)"]
derived_controls: [CTL-D06-03, CTL-D06-06, CTL-D13-02]
---

# Standardized, Versioned, Documented API Contracts

## Context and Problem Statement

An API without an explicit contract forces every consumer to guess its behavior by reading
the code or observing responses, and the slightest change by the provider breaks its
consumers without warning. How can we guarantee that every API exposes an explicit,
versioned, and understandable contract before its very first call?

## Decision Drivers

* Discovery and integration of an API without access to its provider's code
* Automated detection of compatibility breaks before production release
* Clear communication of changes to consuming teams
* Generation of tooling (clients, tests, documentation) from a single source

## Considered Options

* Standardized interface contract, explicitly versioned and published with the API
* Free-form prose documentation maintained separately from the code
* No formal contract: the implementation serves as the reference

## Decision Outcome

Chosen option: "Standardized, versioned interface contract", because it is the only option
readable by both humans and tools, automatically verifiable against the implementation,
and carrying a version number that unambiguously signals compatibility breaks.

### Consequences

* Good, because the contract serves as documentation and as a source for generating clients and tests.
* Good, because a major version increment unambiguously signals a compatibility break.
* Bad, because discipline is required to keep the contract synchronized with the actual implementation.
* Neutral, because a contract/implementation compliance check must be tooled in CI.

### Confirmation

Derived controls: CTL-D01-04 (interface contract published and versioned for every exposed
API — automatic mode), CTL-D02-04 (requests non-compliant with the published contract
rejected at the boundary — automatic mode). Expected evidence: published contract +
contract/implementation compliance report. Scoring: compliant = contract published,
versioned, and verified in CI; partial = contract published but not automatically
verified; non-compliant = no explicit contract.

## Pros and Cons of the Options

### Standardized, Versioned Interface Contract
* Good, because it is machine-readable, continuously verifiable, and provides an explicit break signal.
* Bad, because of the maintenance effort required for the contract with every change.

### Free-Form Prose Documentation
* Good, because it can be written without specific tooling.
* Bad, because of silent drift between the documentation and the actual implementation.

### No Formal Contract
* Good, because there is no initial effort.
* Bad, because each consumer must guess the behavior; every change is an unsignaled break.

## More Information

Instantiations: the contract format recommended at the core level is an open interface
specification (OpenAPI or equivalent depending on the protocol) published in an accessible
registry; `profil:azure` → contract validation integrated into the delivery pipeline.
