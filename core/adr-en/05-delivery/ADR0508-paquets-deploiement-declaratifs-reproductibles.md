---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architects, operations teams"
informed: "product teams"
id: ADR0508
domain: "05"
invariant: true
standards: ["12-Factor — V. Build, release, run", "SLSA — provenance et reproductibilité du build", "NIST SSDF — PS.3"]
derived_controls: [CTL-D09-04]
profile_bindings: optional
---

# Declarative and reproducible deployment packages

## Context and Problem Statement

If the artifact deployed in production can differ, even slightly, from the one built and scanned upstream, the entire delivery evidence chain (tests, scans, approvals) becomes unverifiable. How can we guarantee that one single package, built once, is promoted unchanged all the way to production?

## Decision Drivers

* Integrity of the evidence chain: what is scanned is what is deployed
* Reproducibility: rebuilding a package must produce an identical result
* Elimination of environment-specific rebuilds
* Portability of the principle to any package or image format

## Considered Options

* Declarative package built once, promoted unchanged across environments
* Package rebuilt for each environment from the same sources
* Configuration manually adjusted after deployment according to the target environment

## Decision Outcome

Chosen option: "Single build, unchanged promotion", because it is the only option that guarantees the validated artifact (tests, scans, approvals) is bit-for-bit identical to the artifact running in production — any intermediate rebuild or modification reopens the question of what was actually validated.

### Consequences

* Good, because the evidence chain (tests, scans, approvals) remains valid all the way to production.
* Good, because a production incident is diagnosed on the exact artifact that was validated.
* Bad, because configuration specific to each environment must be externalized from the package.
* Neutral, because it requires a versioned package registry accessible to all environments.

### Confirmation

Derived control: CTL-D09-10 (package fingerprint identical between the validation environment and the production environment — verified by hash comparison). Expected evidence: package registry with fingerprint + inter-environment promotion log. Rating: compliant = identical fingerprint on 100% of promotions; partial = isolated deviation documented; non-compliant = rebuild observed between environments.

## Pros and Cons of the Options

### Single build, unchanged promotion
* Good, because the evidence chain stays intact, with guaranteed reproducibility.
* Bad, because it requires strictly externalizing configuration per environment.

### Rebuild for each environment
* Good, because it allows the build to be adjusted to each environment's context.
* Bad, because nothing guarantees that two builds produce an identical result.

### Configuration adjusted after deployment
* Good, because of the immediate flexibility perceived in operations.
* Bad, because the artifact actually in production diverges from everything that was validated.

## More Information

Instantiations: `profil:azure` → managed package registry, promotion by image reference between environments. The profile provides the chosen package format (container image, application archive, or equivalent).
