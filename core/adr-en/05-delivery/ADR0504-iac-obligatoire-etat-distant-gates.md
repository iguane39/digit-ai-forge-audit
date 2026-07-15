---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architects, operations teams"
informed: "product teams"
id: ADR0504
domain: "05"
invariant: true
standards: ["NIST SSDF — PO.5", "CIS Benchmarks — contrôle par policy-as-code", "DORA (Accelerate) — capacité Infrastructure as Code"]
derived_controls: [CTL-D08-01, CTL-D09-02, CTL-D09-06]
profile_bindings: optional
---

# Mandatory Infrastructure as Code, remote state, quality gates

## Context and Problem Statement

Infrastructure configured by hand (console, interactive command line) is neither reproducible, nor reviewable, nor auditable: the only source of truth lives in the memory of the person who created it. How can we guarantee that every managed infrastructure resource is described, versioned, and verified before being applied, regardless of hosting provider?

## Decision Drivers

* Reproducibility and peer review of every infrastructure change
* Detection of drift between declared state and actual state
* Blocking non-compliant changes before they are applied (quality gate)
* Portability of the rule to any infrastructure description language

## Considered Options

* Mandatory Infrastructure as Code, shared remote state, blocking quality gates
* Recommended Infrastructure as Code, local per-workstation state, after-the-fact review
* Manual configuration tooled with helper scripts, without declarative state

## Decision Outcome

Chosen option: "Mandatory IaC, remote state, blocking gates", because only a shared remote state eliminates divergence between workstations, and only blocking gates prior to application prevent an unreviewed or non-compliant change from reaching a managed environment — independent of the description language chosen.

### Consequences

* Good, because every infrastructure change is reviewable before it is applied (peer review).
* Good, because the remote state eliminates divergence between workstations and people.
* Bad, because the remote state becomes a critical resource that must be protected and backed up.
* Neutral, because additional discipline is required for any urgent exception (tracked break-glass access).

### Confirmation

Derived controls: CTL-D09-05 (no managed resource modified outside the infrastructure code — verified through drift detection), CTL-D09-06 (remote, locked, versioned state), CTL-D08-01 (blocking quality gates before application: syntax validation, policy, review). Evidence: remote state configuration + drift detection report + gate log. Rating: compliant = 0 drift and active gates; partial = isolated drift corrected; non-compliant = undetected out-of-band modification.

## Pros and Cons of the Options

### Mandatory IaC, remote state, blocking gates
* Good, because it is reproducible and reviewable, with drift detected by construction.
* Bad, because the remote state is a critical point of dependency.

### Recommended IaC, local state, after-the-fact review
* Good, because it allows a quick start, with no shared infrastructure required.
* Bad, because divergences appear between workstations; review happens after the fact.

### Helper scripts without declarative state
* Good, because it is flexible, with no imposed formalism.
* Bad, because no drift detection or structured review is possible.

## More Information

Instantiations: `profil:azure` → remote state in locked managed storage, policies enforced at admission. The profile provides the description language and the policy-as-code engine adopted by the organization.
