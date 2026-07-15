---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0209
domain: "02"
invariant: false
standards: ["SLSA — niveau ≥ 2 (provenance)", "NIST SSDF — PS.3/PO.3", "Cyber Resilience Act (UE) — art. 13", "SBOM — SPDX/CycloneDX (formats ouverts)"]
derived_controls: [CTL-D02-03, CTL-D04-10]
---

# Software supply chain: SBOM + integrity

## Context and Problem Statement

Delivered software is composed of many third-party components. Without a precise
inventory of their nature and origin, an organization can neither respond quickly to
a vulnerability revealed in a dependency, nor detect an artifact that has been altered
between its build and its execution. How can we know at all times what a delivered
artifact contains, and guarantee that it has not been altered along the way?

## Decision Drivers

* Rapid response to a vulnerability discovered in a dependency
* Detection of artifact tampering between build and execution
* Compliance with emerging regulatory obligations on digital product security
* Interoperability: the inventory must be readable by any consuming tool, not a proprietary one

## Considered Options

* Software bill of materials (SBOM) automatically generated at every build, with integrity and provenance verification at execution
* Dependency inventory maintained manually in a separate document, updated irregularly
* No formal inventory; reliance on component suppliers' spontaneous alerts alone

## Decision Outcome

Chosen option: "Automated SBOM + integrity verification", because it is the only one
that guarantees an exhaustive, up-to-date inventory by construction, with no
documentation drift, and that allows a technical verification of the chain's
integrity.

### Consequences

* Good, because of a response in minutes, not weeks, to a vulnerability alert on a dependency.
* Good, because any tampering with the chain between build and execution becomes detectable.
* Bad, because generation and verification tooling must be integrated into every build pipeline.
* Neutral, because the volume of bills of materials to archive grows over time (retention link).

### Confirmation

Derived controls: CTL-D02-09 (up-to-date bill of materials for every delivered
artifact — automatic mode), CTL-D02-10 (provenance/integrity verified before
execution — automatic mode). Evidence: bill of materials in an open format +
provenance verification report. Grid: compliant = up-to-date bill of materials AND
verified provenance; partial = bill of materials without verification; non-compliant
= absence of a bill of materials.

## Pros and Cons of the Options

### Automated SBOM + integrity verification
* Good, because of an exhaustive inventory by construction, technical verification of provenance.
* Bad, because of tooling to integrate into every build pipeline.

### Manual dependency inventory
* Good, because of no tooling required to get started.
* Bad, because of rapid drift between the declared inventory and the actual build.

### No formal inventory
* Good, because of zero cost in the short term.
* Bad, because of an inability to respond to a vulnerability alert or detect tampering.

## More Information

Gap closed: no ADR in the reference profile covered the software supply chain as
such; the topic only existed implicitly within dependency scans (D02). Formats
admissible under open specifications: SBOM SPDX or CycloneDX, SLSA provenance level.
Instantiation: `profil:azure` → SBOM generation integrated into the pipeline +
provenance attestation.
