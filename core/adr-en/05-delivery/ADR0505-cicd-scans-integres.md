---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "product teams"
id: ADR0505
domain: "05"
invariant: true
standards: ["NIST SSDF — PW.7", "NIST SSDF — PW.8", "NIST SSDF — PS.1", "OWASP SAMM — Verification"]
derived_controls: [CTL-D02-01, CTL-D02-08, CTL-D06-04, CTL-D08-02, CTL-D08-03, CTL-D08-06, CTL-D09-03]
profile_bindings: optional
---

# CI/CD with integrated scanning (SAST, secrets, dependencies)

## Context and Problem Statement

A code vulnerability, a forgotten secret, or a dependency known to be compromised must not depend on human vigilance to be detected before production. How can detection of these three risk classes be integrated directly into the delivery path, systematically and without possible bypass?

## Decision Drivers

* Detection before production rather than in reaction to an incident
* Systematicity: detection must not depend on a voluntary action
* Coverage of the three major surfaces: code, secrets, third-party dependencies
* Blocking effect proportionate to the severity observed

## Considered Options

* SAST, secrets, and dependency scans integrated as a blocking gate in the pipeline
* Scans run periodically outside the pipeline, with a report sent to teams
* Ad hoc manual security review before major production releases

## Decision Outcome

Chosen option: "Scans integrated as a blocking gate", because it is the only option that makes detection systematic and prior to production release, without depending on manual scheduling or the availability of a specialized reviewer.

### Consequences

* Good, because all three risk classes are covered before any production release.
* Good, because scan results become timestamped audit evidence per version.
* Bad, because poorly calibrated false positives can slow down delivery (mitigated by a tracked waiver).
* Neutral, because of the initial effort to calibrate rules per project type.

### Confirmation

Derived controls: CTL-D09-07 (SAST, secrets, and dependency scans run on every integration, blocking gate on any critical vulnerability), CTL-D08-02 (scan results tracked by version as a code quality criterion). Evidence: gate configuration + historical scan reports. Rating: compliant = 3 scans active and blocking; partial = scans active but not blocking; non-compliant = absence of scanning observed.

## Pros and Cons of the Options

### Scans integrated as a blocking gate
* Good, because it is systematic, prior to production, and tracked by version.
* Bad, because it requires continuous calibration to limit false positives.

### Periodic scans outside the pipeline
* Good, because it is simpler to implement initially.
* Bad, because a vulnerable version can be delivered before the next scan cycle.

### Ad hoc manual review
* Good, because it allows human judgment on complex cases.
* Bad, because it depends on an expert's availability; not systematic, not reproducible.

## More Information

Instantiations: `profil:azure` → scanning extensions integrated into the managed pipeline; other profiles → equivalent SAST/secrets/SCA tooling. The profile provides the blocking severity thresholds per project type.
