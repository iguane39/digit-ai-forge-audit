---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "product teams, integration teams"
id: ADR0607
domain: "06"
invariant: true
standards: ["DAMA-DMBOK2 — Chapitre 8 (Data Integration and Interoperability)", "ISO/IEC 25010:2011 — compatibilité (interopérabilité)", "SemVer 2.0.0 — versionnement sémantique des schémas"]
derived_controls: [CTL-D05-06, CTL-D14-02, CTL-D15-05, CTL-D16-05, CTL-D16-06]
profile_bindings: optional
---

# Data contracts at integration

## Context and Problem Statement

When a producer freely modifies the structure of a data asset without notice, every downstream consumer suffers a silent break: a process fails or, worse, keeps running on misinterpreted data. How can we guarantee that a structural change to a shared asset never breaks a consumer without notice, regardless of the exchange mechanism?

## Decision Drivers

* Detection of a compatibility break before it reaches a consumer in production
* Decoupling of the change pace between producer and consumers
* Traceability of schema versions over time
* Applicability to any exchange mechanism (file, stream, API, shared table)

## Considered Options

* Versioned data contract between producer and consumers, verified before publication
* Tacit convention between teams, informal communication of changes
* No contract; the consumer adapts after the fact to observed changes

## Decision Outcome

Chosen option: "Versioned and verified data contract", because it is the only option that moves the detection of a break to before publication, rather than letting it manifest at a consumer in production.

### Consequences

* Good, because a compatibility break is detected and blocked before publication, never discovered in production.
* Good, because producer and consumers evolve at decoupled paces, against an explicit contract version.
* Bad, because the contract adds a verification step and formal process to publishing a change.
* Neutral, because the number of consumers to notify grows as the platform matures.

### Confirmation

Derived controls: CTL-D05-06 (data contracts versioned and verified at every publication), CTL-D16-04 (schema drift detected and governed, with a documented migration plan). Expected evidence: data contract register with version history, and compatibility verification report. Scoring: compliant = versioned contract and active automated verification; partial = documented contract without automated verification; non-compliant = no formalized contract.

## Pros and Cons of the Options

### Versioned and verified data contract

* Good, because it detects breaks before publication and decouples producer from consumers.
* Bad, because it requires formal process and verification effort for every change.

### Tacit convention between teams

* Good, because it is quick to put in place, requiring no tooling.
* Bad, because it depends on human communication; a single oversight is enough to break a consumer.

### No contract, after-the-fact adaptation

* Good, because it creates no friction for the producer.
* Bad, because the cost of the break is entirely shifted onto consumers.

## More Information

Instantiations: `profil:databricks-lakehouse` → schema constraints applied at the table level with compatibility checking before publication; `profil:azure` → contract schemas published and versioned in a schema registry for event streams.
