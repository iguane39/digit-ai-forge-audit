---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects, network teams"
informed: "product teams"
id: ADR0302
domain: "03"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.22", "NIST SP 800-207 (zero trust)", "CIS Controls v8 — 12 (Network Infrastructure Management)"]
derived_controls: [CTL-D02-10]
---

# Network segmentation and flow isolation

## Context and Problem Statement

A flat network topology allows an attacker who has compromised a peripheral component to
directly reach sensitive components (data, administration). How can the scope of a
compromise be limited by design, regardless of the hosting platform?

## Decision Drivers

* Reduction of the blast radius of a compromise
* Explicit definition of authorized flows between trust zones
* Compatibility with a zero-trust architecture (no implicit intra-network trust)
* Applicability independent of the hosting model (cloud, on-premises, hybrid)

## Considered Options

* Isolation into strictly separated trust zones, with inter-zone flows explicitly authorized (deny-by-default)
* Single flat network with access control only at the application level
* Partial isolation limited to production / non-production separation

## Decision Outcome

Chosen option: "Isolation into strictly separated trust zones", because it is the only
option that contains a compromise within its zone of origin, makes the flow matrix
auditable, and does not presuppose any particular network virtualization technology.

### Consequences

* Good, because a peripheral compromise no longer directly reaches sensitive zones.
* Good, because the flow matrix becomes a directly usable audit proof.
* Bad, because managing flow rules adds ongoing operational effort.
* Neutral, because zone granularity must be calibrated (too many zones harms maintainability).

### Confirmation

Derived controls: CTL-D02-05 (at least three distinct trust zones — public, application,
data — with named inter-zone flows), CTL-D02-06 (flow matrix documented, periodically
reviewed, unlisted flows denied by default). Expected evidence: zoning diagram + flow
matrix export + filtering configuration. Rating scale: compliant = complete zoning and
verified deny-by-default; partial = partial zoning or unreviewed rules; non-compliant =
flat network or uncontrolled flows.

## Pros and Cons of the Options

### Isolation into strictly separated trust zones
* Good, because contained blast radius, auditable flow matrix.
* Bad, because ongoing operational and review effort.

### Flat network with application-level control only
* Good, because simple initial operation.
* Bad, because a network compromise entirely bypasses application-level control.

### Production / non-production separation only
* Good, because covers the most visible risk at lower effort.
* Bad, because there is no containment within production itself.

## More Information

Instantiations: `profil:azure` → Virtual Network + Network Security Groups + Azure
Firewall for inter-zone filtering; `profil:aws` → VPC + Security Groups + NACLs.
Generalizes the zoning practices from the reference profile.
