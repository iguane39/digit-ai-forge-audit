---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.architect}, {roles.data_roles.steward}, integration teams"
informed: "all product teams"
id: ADR0623
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D05-17]
---

# Naming convention for data exchange flows

## Context and Problem Statement

A data exchange flow — an export to a partner, a history migration, a feed to a third party — is usually named when it is created, after the project that asked for it. A year later, nobody can tell from the name alone what the flow carries, where it comes from, where it goes, or how often it runs; monitoring lists opaque names, and an abandoned flow stays in service because no one can prove it is no longer used. How can we guarantee that a flow is identifiable from its name alone, independently of the project that created it?

## Decision Drivers

* Readability of the flow estate without side documentation: the name carries the essentials
* Monitoring and alerting attachable to the flow with no manual lookup table
* Detection of orphan flows: whatever is not named according to the convention stands out
* Neutrality with respect to the orchestration tool and the transport protocol

## Considered Options

* A single documented naming convention for all flows (source, destination, object carried, frequency), whose compliance is verified
* Free naming, documented in a separately maintained flow register
* Naming inherited from the orchestration tool (generated technical identifiers)

## Decision Outcome

Chosen option: "A single documented naming convention", because it is the only option where the name stays true without depending on a register maintained in parallel: the register can drift, the technical identifier says nothing, whereas a name built to a convention carries the information where it is read — in monitoring, logs, and alerts.

### Consequences

* Good, because an unknown flow can be qualified by reading it, without opening the tool that runs it.
* Good, because a non-conforming flow is detected mechanically, which surfaces ungoverned flows.
* Bad, because renaming an existing flow has a cost (monitoring, alerts, contracts in place).
* Neutral, because the convention must be versioned: changing it without a migration plan recreates the disorder.

### Confirmation

Derived control: CTL-D05-17 (each data exchange flow into or out of the application carries a name compliant with the documented convention, and no active flow stays outside the convention — automatic + review mode). Expected evidence: versioned naming convention, inventory of the application's active flows, and the result of the name compliance check. Scoring: compliant = 100% of active flows compliant; partial = convention published but compliance partial; non-compliant = no convention, or a majority of flows outside it.

## Pros and Cons of the Options

### Single documented convention

* Good, because information is carried by the name, hence present everywhere the flow appears.
* Bad, because renaming cost on the existing estate.

### Free naming plus a separate register

* Good, because no cost on the existing estate.
* Bad, because the register drifts from reality as soon as a flow is created outside the process.

### Technical identifiers from the tool

* Good, because uniqueness guaranteed with no effort.
* Bad, because unreadable in monitoring; locks the estate into the tool that produced them.

## More Information

Distinct from ADR0603 (naming conventions for data **assets**: tables, datasets, schemas): this one governs the **flows** that move them, whose lifecycle, owners, and monitoring differ. Complements ADR0607 (data contracts): the contract says what circulates, the convention says how it is recognized.

**To be completed** (`a_completer: true`): the reference source this decision comes from cites **no external standard** — the `standards` field stays empty and must be filled in before any enforcement. Also to be completed: the exact grammar of the name (order and separators of the segments), which belongs to the organization instantiating the convention.
