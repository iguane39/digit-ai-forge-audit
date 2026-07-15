---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams, operations team"
informed: "all product teams"
id: ADR0211
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.8 (gestion des vulnérabilités techniques)", "NIST SSDF — RV.1/RV.2/RV.3", "CIS Controls v8 — 7 (Continuous Vulnerability Management)"]
derived_controls: [CTL-D02-12]
---

# Continuous vulnerability and patch management

## Context and Problem Statement

The corpus already requires the analysis of application dependencies at build time
(SCA, SBOM — ADR0209) but says nothing about what comes after: a vulnerability
published on a component already deployed (OS, runtime, base image, library not
rebuilt) triggers no obligation of detection or correction deadline. How can we
guarantee that a known vulnerability in production is detected and corrected within a
bounded timeframe, regardless of when it is discovered relative to the last build?

## Decision Drivers

* Continuous detection of known vulnerabilities across the entire production fleet, not only at build time
* Remediation deadline bounded and proportionate to severity (critical, high, medium)
* Periodic verification by a means independent of automated scanning alone (penetration test)
* Technology neutrality: the practice applies to any runtime, cloud, or on-premises

## Considered Options

* Continuous monitoring of known vulnerabilities across the deployed fleet, a remediation deadline contracted by severity, complemented by an independent periodic penetration test
* Dependency rescanning only at the next scheduled build (status quo)
* Passive monitoring: handling only upon receipt of a spontaneous third-party alert

## Decision Outcome

Chosen option: "Continuous monitoring with a contracted deadline and independent
verification", the only option that covers the interval between two builds and
verifies automated detection by a distinct means, independent of the hosting
platform.

### Consequences

* Good, because no known vulnerability can remain silently unaddressed between two application builds.
* Good, because the remediation deadline becomes measurable and enforceable, by severity.
* Bad, because a monitoring capability and a remediation budget must be maintained on a recurring basis, independently of any project.
* Neutral, because a backlog of low/medium vulnerabilities may be tolerated if it is documented and bounded.

### Confirmation

Derived control: CTL-D02-12 (production fleet — application, runtime, infrastructure
— under continuous monitoring for known vulnerabilities, remediation deadline
documented and met by severity — automatic + review mode). Evidence: monitoring
report with deadlines measured by severity. Grid: compliant = continuous inventory
and deadlines met; partial = inventory without deadline tracking; non-compliant = no
inventory of the production fleet. (The independent penetration test, considered as a
second control, is part of the v1.6 backlog — not yet materialized at this stage.)

## Pros and Cons of the Options

### Continuous monitoring + independent verification
* Good, because it covers the interval between builds, verified by a distinct means.
* Bad, because of a recurring tooling and remediation cost to budget continuously.

### Rescan only at the next build
* Good, because of no additional tooling compared to what already exists (ADR0209).
* Bad, because a vulnerability discovered just after a build remains exposed until the next one, with no bounded deadline.

### Passive monitoring on spontaneous alert
* Good, because of zero cost in the absence of an alert.
* Bad, because it depends entirely on a third party's responsiveness; no detection of its own.

## More Information

Instantiations: `profil:azure` → Defender for Cloud + patch schedule managed by the
platform; other profiles → equivalent continuous infrastructure vulnerability
scanner. Distinct from ADR0209 (supply chain at build time), which covers the
post-deployment lifecycle. Gap closed: ISO/IEC 27002:2022 — 8.8, NIST SSDF —
RV.1-RV.3, CIS Controls v8 — 7 (EXTENSION-CORPUS.md §2).
