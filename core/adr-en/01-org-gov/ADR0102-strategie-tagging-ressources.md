---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.remediation_team}, FinOps teams"
informed: "all product teams"
id: ADR0102
domain: "01"
invariant: false
standards: ["FinOps Framework — domaine Allocation (tagging)", "ISO 55001:2014 (gestion d'actifs — identification)"]
derived_controls: [CTL-D07-01, CTL-D07-02]
---

# Resource Tagging and Labeling Strategy

## Context and Problem Statement

Without a mandatory labeling convention, cost allocation, resource discovery, and
automated lifecycle policies become impossible at portfolio scale: each team invents its
own nomenclature, incompatible with the others. How can we guarantee that a resource,
regardless of its type or hosting provider, carries a minimal baseline of usable metadata
from the moment it is created?

## Decision Drivers

* Reliable cost allocation by product, environment, and governance domain
* Automation of lifecycle policies based on metadata, not on naming
* Cross-cutting search and inventory, independent of any one team's institutional memory
* A convention independent of the hosting provider, applicable from the moment the resource is created

## Considered Options

* Mandatory, standardized tag taxonomy, applied and checked at creation
* Resource naming convention as the sole metadata vehicle, with no structured tag
* Tagging recommended but left to each team's discretion, with no enforcement

## Decision Outcome

Chosen option: "Mandatory, enforced tag taxonomy", because only metadata that is
structured and verified at creation stays usable by automation at portfolio scale,
whereas a resource name or an unenforced convention drifts quickly.

### Consequences

* Good, because cost can be allocated by product, environment, and domain without manual reconstruction.
* Good, because lifecycle policies can target resources by metadata rather than by an enumerated list.
* Bad, because a blocking check at creation can slow down non-compliant provisioning — an intended effect, but one that must be tooled to remain acceptable.
* Neutral, because the exact list of mandatory keys beyond the minimal baseline is an overlay concern.

### Confirmation

Derived controls: CTL-D07-01 (minimal tag taxonomy defined and published), CTL-D07-02
(tagging compliance rate measured, with alerting on non-compliant resources). Expected
evidence: portfolio tagging compliance report and the creation-time enforcement policy.
Grading: compliant = at least 98% of resources compliant with an active blocking check;
partial = measurement in place without a blocking check; non-compliant = no compliance
measurement available.

## Pros and Cons of the Options

### Mandatory taxonomy enforced at creation
* Good, because metadata is reliable and usable by automation at scale.
* Bad, because it can introduce provisioning friction in case of non-compliance.

### Naming convention alone
* Good, because no enforcement tooling needs to be put in place.
* Bad, because it is unstructured, not queryable, and drifts as soon as one team departs from the convention.

### Recommended tagging without enforcement
* Good, because teams perceive no constraint.
* Bad, because measured compliance is, in practice, close to zero, making allocation impossible.

## More Information

Profile instantiations: `profil:azure` → governance policy for creation-time enforcement
and a cost management dashboard for measurement; `profil:aws` → organization-level tag
policies and a cost explorer. The minimal baseline of keys (application, environment,
domain, owner) is defined at the core level.
