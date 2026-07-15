---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0101
domain: "01"
invariant: true
standards: ["NIST SP 800-207 (zero trust — segmentation par ressource)", "CIS Controls v8 — 12 (gestion de l'infrastructure réseau)"]
derived_controls: [CTL-D01-11]
---

# Platform / Application Workload Segregation (Segmented Zoning)

## Context and Problem Statement

Having shared platform resources (network, identity, logging) coexist within the same
management perimeter as product application workloads multiplies the risk of incident
propagation, blurs cost allocation, and prevents a consistent security policy. How can the
hosting environment be structured to clearly isolate the shared foundation from
application workloads, regardless of the hosting provider?

## Decision Drivers

* Containment of the blast radius of an incident or a compromise
* Consistent, centrally governed security and network policy for the shared foundation
* Clear allocation of costs and responsibilities between platform and products
* Portability of the zoning model, independent of the hosting provider chosen

## Considered Options

* Distinct segmented zoning (shared platform vs. application workloads), with a watertight security and management boundary
* A single shared perimeter, segregated only by naming convention
* A dedicated zone per product, with no central shared platform zone

## Decision Outcome

Chosen option: "Distinct segmented zoning", because it is the only option that makes
incident containment and security policy consistency technically verifiable, rather than
merely conventional, while remaining independent of the hosting provider.

### Consequences

* Good, because an incident in an application workload cannot propagate to the shared foundation without crossing an explicit security boundary.
* Good, because the policies applied to the platform zone are audited once for all the products that depend on it.
* Bad, because creating a new application workload requires initial zone provisioning, a friction to be absorbed through automation (see ADR0104).
* Neutral, because the number of application zones (per product, per domain) remains an overlay parameter.

### Confirmation

Derived controls: CTL-D01-02 (platform zone and application zones distinct and documented
in the mapping), CTL-D01-03 (no application resource detected within the platform zone's
perimeter). Expected evidence: zone mapping and resource inventory per zone. Grading:
compliant = zoning complete and watertight; partial = zoning documented with tracked
exceptions; non-compliant = untracked mixing between platform and application resources.

## Pros and Cons of the Options

### Distinct segmented zoning
* Good, because incident containment and consistent policies are verifiable by construction.
* Bad, because it creates onboarding friction for every new application workload.

### Single perimeter, segregation by convention
* Good, because it can be put in place immediately, with no additional structure.
* Bad, because conventional segregation technically prevents no propagation whatsoever.

### Dedicated zone per product with no central shared foundation
* Good, because each product has complete autonomy.
* Bad, because security policies are duplicated and diverge, multiplying the audit cost by the number of products.

## More Information

Profile instantiations: `profil:azure` → landing zones materialized through management
groups and dedicated platform/workload subscriptions; `profil:aws` → platform accounts
kept distinct from workload accounts, organized via a multi-account governance service.
