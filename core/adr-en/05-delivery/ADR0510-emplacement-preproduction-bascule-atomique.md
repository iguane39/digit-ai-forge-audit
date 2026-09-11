---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "product teams, {roles.remediation_team}"
informed: "all product teams"
id: ADR0510
domain: "05"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D09-08]
---

# Release through a pre-production slot and an atomic swap

## Context and Problem Statement

A release that overwrites the running instance carries two inseparable risks: the application is unavailable during deployment, and rolling back means replaying a full deployment — at the exact moment when confidence in the pipeline is lowest. How can a web application be released with no downtime window and with an immediate rollback, independently of the hosting platform?

## Decision Drivers

* No downtime window attributable to the deployment itself
* Rollback in a single gesture, with no rebuild or redeployment
* Verification of the version on an environment identical to production before it serves traffic
* Platform neutrality: a pre-production slot is a capability, not a product

## Considered Options

* Deployment to a pre-production slot provided by the managed hosting service, verification on that slot, then an atomic swap — rollback being the reverse swap
* In-place deployment on the running instance, redeploying the previous version on failure
* Deployment to a full parallel infrastructure (environment duplication) switched by routing

## Decision Outcome

Chosen option: "Pre-production slot and atomic swap", because it is the only option that provides both verification before service and immediate rollback without duplicating the whole infrastructure: the candidate version is deployed off traffic, checked, then put into service by a swap that reverses as fast as it applies.

### Consequences

* Good, because rollback no longer depends on the availability of the build pipeline.
* Good, because the candidate version is verified under production conditions, not in an approximate environment.
* Bad, because shared state (database, queues) does not swap: schema changes must stay compatible with both versions during the swap.
* Neutral, because the hosting service must offer this capability, which steers the platform choice.

### Confirmation

Derived control: CTL-D09-08 (releases of the application go through a verified pre-production slot and then a swap, and rollback is the reverse swap, proven — automatic + review mode). Expected evidence: pre-production slot configuration, log of the latest swaps with timestamps, and a trace of a rollback actually performed. Scoring: compliant = slot configured, swaps traced and rollback proven ≤ 12 months; partial = slot configured but rollback never performed; non-compliant = in-place deployment on the running instance.

## Pros and Cons of the Options

### Pre-production slot and atomic swap

* Good, because zero downtime and immediate rollback for marginal infrastructure cost.
* Bad, because it imposes compatibility discipline on shared state (schema, queues, cache).

### In-place deployment

* Good, because no platform prerequisite.
* Bad, because systematic downtime and rollback dependent on the build pipeline.

### Full parallel infrastructure

* Good, because it fully isolates the two versions, state included.
* Bad, because it doubles infrastructure cost and shifts the difficulty to data synchronization.

## More Information

Complements ADR0509 (tested rollback strategy) by giving it a default mechanism for web workloads, and ADR0506 (environment separation and promotion) by specifying the last link of the promotion chain. Instantiations: `profil:azure` → App Service deployment slots with swap; other profiles → equivalent blue/green deployment mechanism offered by the platform.

**To be completed** (`a_completer: true`): the reference source this decision comes from cites **no external standard** — the `standards` field stays empty and must be filled in before any enforcement. Also to be completed: the schema compatibility rule enforced during the swap, not provided by the source.
