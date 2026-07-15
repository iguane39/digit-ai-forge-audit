---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "development teams, operations teams"
informed: "product teams"
id: ADR0501
domain: "05"
invariant: true
standards: ["NIST SSDF — PO.3", "DORA (Accelerate) — Deployment Automation (capacité de livraison continue)", "12-Factor — V. Build, release, run"]
derived_controls: [CTL-D08-04, CTL-D09-01]
profile_bindings: optional
---

# Industrialized deployment exclusively through the pipeline

## Context and Problem Statement

Any deployment performed manually (workstation, direct access to the target environment) escapes traceability, depends on a single person, and rarely reproduces the artifact validated upstream identically. How can we guarantee that every production release — regardless of language, platform, or hosting provider — results from a reproducible, traceable, and non-bypassable process?

## Decision Drivers

* Reproducibility: the same artifact must produce the same result on every execution
* Full traceability: who triggered what, when, on which version
* Reducing the bus factor and dependency on a single person to deploy
* Portability of the rule to any language, any platform, any hosting provider

## Considered Options

* Mandatory automated pipeline, the sole path to any managed environment
* Recommended pipeline, manual deployment tolerated in emergencies
* Manual deployment tooled with scripts, without centralized orchestration

## Decision Outcome

Chosen option: "Mandatory automated pipeline", because it is the only option that structurally eliminates the gap between what is validated and what is deployed, produces audit evidence by construction (execution log), and depends on no direct human action on the target environment.

### Consequences

* Good, because every deployment is reproducible and identically replayable.
* Good, because the pipeline's execution log becomes enforceable audit evidence (D09, D12).
* Bad, because pipeline unavailability blocks all deployment (mitigated by a dedicated tooling on-call rotation).
* Neutral, because of the initial effort required to bring legacy applications into the pipeline.

### Confirmation

Derived controls: CTL-D09-01 (100% of deployments to a managed environment go through the pipeline — verified via an inventory of deployment access), CTL-D09-02 (immutable log of every execution: author, version, target, result). Expected evidence: pipeline configuration + log excerpt covering the audit period. Rating: compliant = 0 deployments outside the pipeline; partial = documented and approved exceptions; non-compliant = untracked manual deployment observed.

## Pros and Cons of the Options

### Mandatory automated pipeline
* Good, because reproducible, traceable, independent of any single person.
* Bad, because the pipeline becomes a critical component that must be made reliable.

### Recommended pipeline, emergency exception tolerated
* Good, because apparent flexibility in the event of an incident.
* Bad, because the exception becomes the norm under pressure; traceability degrades.

### Manual scripts without orchestration
* Good, because quick to start, no prior tooling required.
* Bad, because no guarantee of reproducibility or centralized traceability.

## More Information

Instantiations: `profil:azure` → Azure Pipelines/GitHub Actions as the sole deployment path to managed environments; other profiles → equivalent CI/CD platform. Generalizes the industrialized deployment practice from the reference profile.
