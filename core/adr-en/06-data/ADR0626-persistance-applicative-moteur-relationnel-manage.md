---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.architect}, product teams, operations team"
informed: "all product teams"
id: ADR0626
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D16-11]
---

# Application persistence on a managed relational engine

## Context and Problem Statement

An application's persistence is often chosen at project start, on the criterion of how fast it can be set up. Low-code data platforms make that start immediate, but they lock the schema, the rules, and the data into a model whose exit is paid for with a full rewrite — and whose backup, restore, and schema changes cannot be tooled the way a database engine's can. How can we guarantee that an industrialized application rests on persistence that can be backed up, migrated, and exited?

## Decision Drivers

* Reversibility: schema and data must be exportable in a standard format
* Schema changes tooled, versioned, and replayable
* Proven backup and restore, with measurable loss and recovery objectives
* Delegated operations: the engine is managed, the product team does not run the host system

## Considered Options

* A relational engine managed by the provider, with versioned schema and tooled migrations; low-code data platforms excluded as an application persistence foundation
* A low-code data platform as the persistence foundation
* A self-hosted database engine operated by the product team

## Decision Outcome

Chosen option: "Managed relational engine", because it is the only option that combines reversibility (schema and data exportable in a standard format), migration tooling, and proven backup, without loading the product team with operating the host system. Low-code platforms remain possible for non-industrialized internal tooling, never as the persistence foundation of a production application.

### Consequences

* Good, because leaving the platform stays an export, not a rewrite.
* Good, because schema changes enter the delivery pipeline like the rest of the code.
* Bad, because startup is slower than with a low-code platform.
* Neutral, because a proven non-relational need (document, graph, time series) justifies a documented waiver, not a silent workaround.

### Confirmation

Derived control: CTL-D16-11 (application persistence rests on a managed relational engine, with versioned schema and replayable migrations; no low-code data platform holds production application data without a documented waiver — review mode). Expected evidence: inventory of the application's persistence foundations, schema migration history, and dated waiver where applicable. Scoring: compliant = persistence on a managed relational engine, versioned migrations; partial = compliant engine but migrations not versioned; non-compliant = production persistence on a low-code platform with no waiver.

## Pros and Cons of the Options

### Managed relational engine

* Good, because reversible, migratable, backed up, operated by the provider.
* Bad, because slower startup and modeling that must be done explicitly.

### Low-code data platform

* Good, because very short setup time, few skills required.
* Bad, because costly exit, untooled migrations, backup and restore hard to verify.

### Self-hosted engine

* Good, because full control over configuration and versions.
* Bad, because the product team inherits patching, availability, and backup.

## More Information

Complements ADR0502 (managed-hosting-first strategy) on the persistence side, ADR0611 (tested backup and restore) which becomes verifiable, and ADR0108 (reversibility and exit portability) which it makes applicable to the data foundation. Instantiations: `profil:azure` → the platform's managed relational engine, low-code platform excluded from the application foundation.

**To be completed** (`a_completer: true`): the reference source this decision comes from cites **no external standard** — the `standards` field stays empty and must be filled in before any enforcement. Also to be completed: the waiver process for a proven non-relational need, not provided by the source.
