---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.change_board}, operations teams"
informed: "product teams"
id: ADR0506
domain: "05"
invariant: true
standards: ["12-Factor — X. Dev/prod parity", "DORA (Accelerate) — capacité de livraison continue (gestion des environnements)", "NIST SSDF — PO.5"]
derived_controls: [CTL-D09-04]
profile_bindings: optional
---

# Separation and controlled promotion of environments

## Context and Problem Statement

Environments that share sensitive resources (data, identities, network), or that a change can reach by skipping a stage, negate the entire benefit of a progressive validation chain. How can we guarantee that every environment remains isolated and that a change progresses only through the planned stages, with no shortcut?

## Decision Drivers

* Real isolation of environments (not merely nominal) with respect to data and identities
* Impossibility of bypassing a stage of the promotion pipeline
* Sufficient similarity between environments for validation to be representative
* Auditability of every stage transition (who approved it, when)

## Considered Options

* Isolated environments, strictly sequential promotion via pipeline with approvals
* Isolated environments, but manual promotion possible in an emergency
* Partially shared environments (databases, identities) to reduce costs

## Decision Outcome

Chosen option: "Isolated environments, sequential promotion via pipeline", because it is the only option that makes a skipped stage technically impossible rather than merely discouraged, and that produces, by construction, evidence of every stage-transition approval.

### Consequences

* Good, because no change reaches an environment without having gone through the preceding stages.
* Good, because isolation limits the impact of a compromise to a single environment.
* Bad, because of the cost of duplicating resources per environment (data, identities, network).
* Neutral, because it requires a dataset that is representative but not sensitive for upstream environments.

### Confirmation

Derived controls: CTL-D09-08 (inter-environment promotion exclusively via the pipeline, with tracked approval at every stage), CTL-D12-01 (isolated environments: no sensitive resource shared between them). Evidence: promotion approval configuration + resource inventory per environment. Rating: compliant = complete isolation and tracked sequential promotion; partial = documented partial isolation; non-compliant = skipped stage or shared sensitive resource observed.

## Pros and Cons of the Options

### Full isolation, sequential promotion via pipeline
* Good, because a skipped stage is made impossible, with approval evidence by construction.
* Bad, because of the cost of duplicating resources per environment.

### Full isolation, manual emergency tolerated
* Good, because of the perceived flexibility in a critical incident.
* Bad, because the emergency becomes a recurring bypass of the validation chain.

### Partially shared environments
* Good, because of reduced short-term cost.
* Bad, because an incident on a shared resource impacts multiple environments.

## More Information

Instantiations: `profil:azure` → separate subscriptions or resource groups per environment, approvals carried by the managed pipeline. Generalizes, on the delivery-mechanics side, the promotion pipeline already governed in terms of responsibility by ADR0106 (domain 01).
