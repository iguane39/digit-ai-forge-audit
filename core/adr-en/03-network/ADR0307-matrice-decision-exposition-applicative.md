---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, network team, product teams"
informed: "all product teams"
id: ADR0307
domain: "03"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D02-14]
---

# Application exposure path determined by a decision matrix

## Context and Problem Statement

An application can be exposed in several ways — directly from the zone hosting the workload, behind a web application firewall, behind an API gateway, or through an egress network firewall. When that choice is made case by case, two applications of equal criticality end up exposed differently, and no review can tell whether the chosen exposure was the right one. How can we guarantee that an application's exposure path follows from declared criteria rather than from the habits of the team that deployed it?

## Decision Drivers

* Reproducibility: two applications with the same criteria come out with the same exposure path
* No exposure from the workload zone — ingress always goes through a dedicated connectivity zone
* A decision that can be argued in review: the matrix is readable before deployment, not reconstructed afterwards
* Neutrality with respect to the hosting platform and the provider

## Considered Options

* A declared decision matrix (network egress, external partners, criticality, regulatory obligation) determining the exposure path, with ingress always from a dedicated connectivity zone
* Exposure path chosen project by project and validated in architecture review, with no matrix
* A single exposure path imposed on all applications, whatever their nature

## Decision Outcome

Chosen option: "A declared decision matrix", because it is the only option that makes the choice reproducible and verifiable: inbound web traffic goes through a web application firewall, APIs through an API gateway, network filtering is systematic, encryption in transit is required everywhere, and a network firewall is added only when the matrix calls for it. Direct exposure from the workload zone is refused in every case.

### Consequences

* Good, because an application's exposure path is justified by written criteria, enforceable in an audit.
* Good, because the exposed surface stays concentrated on a small number of maintained control points.
* Bad, because the matrix must be kept current: out of date, it produces out-of-date decisions.
* Neutral, because it forbids no topology, it only requires stating why this one.

### Confirmation

Derived control: CTL-D02-14 (the application's exposure path matches the one the matrix prescribes for its criteria, and no exposure occurs directly from the workload zone — review mode). Expected evidence: dated exposure matrix, criteria filled in for the application, and the actual configuration of the entry points. Scoring: compliant = path consistent with the matrix and ingress from the connectivity zone; partial = consistent path but matrix not filled in for the application; non-compliant = direct exposure from the workload zone, or a divergent path with no justification.

## Pros and Cons of the Options

### Declared decision matrix

* Good, because reproducible, auditable, independent of who happens to be present at deployment time.
* Bad, because it requires maintaining a criteria reference.

### Case-by-case choice in architecture review

* Good, because maximum flexibility, no structure to maintain.
* Bad, because the decision depends on who sits in the review; no consistency between projects.

### Single path imposed on all applications

* Good, because simple to implement and operate.
* Bad, because it over-engineers simple cases and under-protects regulated ones.

## More Information

Complements ADR0301 (single exposure control point) and ADR0305 (application perimeter protection): those impose the control points, this one imposes **how the choice is made** between them. Instantiations: `profil:azure` → web application firewall in front of the application gateway, managed API gateway for APIs, conditional network firewall; other profiles → functional equivalents.

**To be completed** (`a_completer: true`): the reference source this decision comes from cites **no external standard** — the `standards` field therefore stays empty and must be filled in before any enforcement. Also to be completed: the exact matrix thresholds (which criticality values call for which path), which belong to the organization instantiating it.
