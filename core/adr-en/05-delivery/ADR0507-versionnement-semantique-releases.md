---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "development teams, architects"
informed: "product teams"
id: ADR0507
domain: "05"
invariant: false
standards: ["SemVer 2.0.0", "DORA (Accelerate) — traçabilité des releases", "NIST SSDF — PS.2"]
derived_controls: [CTL-D09-05]
profile_bindings: optional
---

# Semantic versioning and tracked releases

## Context and Problem Statement

Without an explicit version scheme, it becomes impossible to know whether a new release breaks compatibility, fixes a defect, or adds a feature — and operations cannot correlate an incident with a specific version. What version scheme, readable by both humans and machines, should a team apply to its releases?

## Decision Drivers

* Explicit signal of a compatibility break before an update
* Unambiguous correlation between a production incident and a delivered version
* Possible automation of update decisions by consumers
* Applicability to any type of artifact (library, service, image)

## Considered Options

* Semantic versioning (major.minor.patch) with tracked release notes
* Incremental build number with no meaning carried by the number
* Dated version (year.month.day) with no distinction of breakage level

## Decision Outcome

Chosen option: "Semantic versioning with tracked release notes", because it is the only scheme of the three that carries, in the number itself, a verifiable compatibility commitment — allowing consumers and pipelines to automatically decide whether it is safe to upgrade.

### Consequences

* Good, because the version number alone carries an explicit compatibility commitment.
* Good, because every incident can be correlated to a version and its release notes.
* Bad, because it requires disciplined change classification at every release.
* Neutral, because internal artifacts not consumed by third parties derive less benefit from the signal.

### Confirmation

Derived controls: CTL-D09-09 (version scheme applied and verified in CI on every published artifact), CTL-D12-02 (release notes published and accessible in operations for every deployed version). Evidence: history of published versions + associated release notes. Rating: compliant = scheme followed and notes present for 100% of releases; partial = scheme followed without systematic notes; non-compliant = versions not distinguishable or duplicated.

## Pros and Cons of the Options

### Semantic versioning + tracked notes
* Good, because it gives an explicit, automatable compatibility signal that can be correlated in operations.
* Bad, because it requires disciplined classification at every change.

### Incremental build number
* Good, because it is trivial to generate automatically.
* Bad, because no compatibility information is carried by the number.

### Dated version
* Good, because it is readable and naturally ordered in time.
* Bad, because it does not distinguish a compatibility break from a minor fix.

## More Information

Instantiations: `profil:azure` → automatic generation of version and release notes by the managed pipeline from the change history. The version scheme chosen at the core level remains an open specification, not a tool.
