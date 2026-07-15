---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "data teams, analytics teams"
id: ADR0606
domain: "06"
invariant: false
standards: ["DAMA-DMBOK2 — Chapitre 4 (Data Architecture)", "DAMA-DMBOK2 — Chapitre 6 (Data Storage and Operations)", "ISO/IEC 25010:2011 — maintenabilité (modularité)"]
derived_controls: [CTL-D05-05, CTL-D16-06]
profile_bindings: optional
---

# Data architecture in progressive refinement layers

## Context and Problem Statement

Transforming raw data directly into a consumable model in a single opaque step prevents replaying a process, locating where an anomaly was introduced, and reusing an intermediate state for another purpose. How can we structure data processing into distinct, traceable, and reusable steps, independent of the processing platform?

## Decision Drivers

* Ability to replay a process from an intermediate state, without going back to the raw source
* Fast localization of the step where a quality anomaly was introduced
* Reuse of an intermediate layer across multiple use cases
* Independence from the processing engine and storage format in use

## Considered Options

* Progressive refinement layers (raw → cleaned/conformed → business/consumable), each contractual and traceable
* Single-step transformation, straight from the raw source to the consumable model
* Ad hoc layers, freely defined by each team with no shared contract

## Decision Outcome

Chosen option: "Contractual progressive refinement layers", because it is the only option that makes each step replayable, traceable, and reusable, without imposing any particular engine or format.

### Consequences

* Good, because an anomaly can be located at the layer where it appears, without re-examining the entire pipeline.
* Good, because a cleaned intermediate layer becomes reusable across multiple use cases without reprocessing the raw source.
* Bad, because each additional layer adds latency and an intermediate storage cost.
* Neutral, because the exact number of layers and their precise contract remain an implementation choice.

### Confirmation

Derived controls: CTL-D05-05 (refinement layers documented with an input/output contract per layer), CTL-D16-03 (schema migrations tracked per layer, with reversibility). Expected evidence: layer architecture diagram and documented contracts between layers. Scoring: compliant = layers documented with contracts and end-to-end traceability; partial = layers present without a formalized contract; non-compliant = opaque, non-traceable single-step transformation.

## Pros and Cons of the Options

### Contractual progressive refinement layers

* Good, because it provides replayability, anomaly localization, and reuse across use cases.
* Bad, because it adds latency and additional storage cost.

### Single-step transformation

* Good, because it offers minimal latency and an apparently simpler architecture.
* Bad, because there is no intermediate replayability; an anomaly forces reprocessing from the raw source.

### Ad hoc layers with no shared contract

* Good, because it leaves each team complete freedom.
* Bad, because there is no guarantee of compatibility between layers produced by different teams.

## More Information

Instantiations: `profil:databricks-lakehouse` → medallion architecture (bronze/silver/gold) natively supported by the technical catalog; `profil:azure` → raw/curated/enriched zones on the storage account, with differentiated rights per zone.
