---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.architect}, {roles.data_roles.owner}, product teams"
informed: "all product teams"
id: ADR0625
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D16-10]
---

# Application layer kept distinct from the analytical refinement layers

## Context and Problem Statement

An application that relies on a data platform eventually writes to it: application state, configuration, intermediate results, functional logs. Those writes land in the same layers as refined analytical data, where they have no owner, no contract, and no retention — and where, at the first rebuild of the layer, they become an invisible dependency that breaks the application. How can we guarantee that data belonging to an application never gets confused with the analytical refinement layers?

## Decision Drivers

* Separate lifecycles: application state changes at the application's pace, not the analytical jobs'
* Explicit ownership and contract: application data has an application owner, analytical data a data owner
* Ability to rebuild the analytical layers without breaking an application
* Neutrality with respect to the chosen data platform

## Considered Options

* A dedicated application layer, distinct from the analytical refinement layers, the only destination for application writes, consuming the analytical layers read-only
* Application writes directly into the most downstream refinement layer
* No declared separation: each application picks its destination

## Decision Outcome

Chosen option: "Dedicated application layer", because it is the only option that leaves the analytical layers rebuildable: they stay fed by refinement jobs alone, while application state lives in a layer that belongs to it, with its own retention and its own owner. The application reads the analytical layers; it does not write to them.

### Consequences

* Good, because an analytical layer can be rebuilt without destroying application state.
* Good, because every piece of data has a readable owner: application or data, never half of each.
* Bad, because it sometimes forces a copy of reference data into the application layer.
* Neutral, because the boundary must be documented: without it, the application layer becomes a dumping ground.

### Confirmation

Derived control: CTL-D16-10 (data belonging to the application resides in a declared application layer, distinct from the analytical refinement layers, and no application write is observed in the latter — review mode). Expected evidence: layer map with the application layer identified, and inventory of the application's actual writes per layer. Scoring: compliant = all application writes in the application layer; partial = layer declared but residual writes elsewhere; non-compliant = no application layer declared, or direct writes into the analytical layers.

## Pros and Cons of the Options

### Dedicated application layer

* Good, because rebuildable analytical layers, readable ownership.
* Bad, because reference data copies in some cases.

### Direct writes into the downstream layer

* Good, because no copy, a single instance of the data.
* Bad, because any rebuild of the layer destroys application state; ownership becomes undeterminable.

### No declared separation

* Good, because total freedom for teams, zero coordination.
* Bad, because the boundary is discovered at the first incident, by which time it no longer exists.

## More Information

Complements ADR0606 (layered data refinement architecture) by adding the layer it was missing — the application's — and ADR0601 (data ownership) by making the owner deducible from the layer. Instantiations: `profil:databricks-lakehouse` → catalog or schema dedicated to the application, distinct from the refinement layers; `profil:azure` → managed application database distinct from the analytical platform.

**To be completed** (`a_completer: true`): the reference source this decision comes from cites **no external standard** — the `standards` field stays empty and must be filled in before any enforcement. Also to be completed: the list of data natures that belong to the application layer, not provided by the source.
