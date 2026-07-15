---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects, network teams"
informed: "product teams"
id: ADR0306
domain: "03"
invariant: false
standards: ["NIST SP 800-207 (zero trust)", "ISO/IEC 27002:2022 — 8.20/8.21", "CIS Controls v8 — 13 (Network Monitoring and Defense)"]
derived_controls: [CTL-D02-11]
---

# Controlled network egress

## Context and Problem Statement

Network governance has historically focused on ingress (exposure, ADR0301) and neglected
egress: a compromised component can exfiltrate data or communicate with malicious
infrastructure without any rule preventing it. How can we govern what an application
workload is allowed to reach on egress, and the name resolution that precedes every
outbound connection?

## Decision Drivers

* Containment of a compromise: an infected component must not exfiltrate freely
* Governance of name resolution, prior to every outbound connection
* Detection of abnormal egress behavior (new destination, unusual traffic volume)
* Absence of this control in common practice: closing a blind spot in the zero-trust posture

## Considered Options

* Network egress denied by default, with an explicit list of authorized destinations and governed name resolution
* Unrestricted network egress with only retrospective detection (log analysis)
* Unrestricted network egress with no control or detection

## Decision Outcome

Chosen option: "Egress denied by default with an explicit list", because it alone prevents
exfiltration and communication with malicious infrastructure by design, rather than merely
observing them after the fact. This ADR is classified as non-invariant in its initial
phase: it fills a gap identified in the corpus rather than codifying a practice that is
already universally tooled, and its escalation in requirement level (from recommendation
to blocking control) takes place progressively as enforcement maturity increases.

### Consequences

* Good, because a compromise can no longer freely communicate with an arbitrary destination.
* Good, because name resolution becomes a usable detection signal.
* Bad, because every new legitimate external dependency requires an explicit opening (operational lead time).
* Neutral, because it requires an initial inventory of legitimate destinations, which does not exist by default.

### Confirmation

Derived controls: CTL-D02-12 (network egress denied by default, with an explicit list of
authorized destinations), CTL-D02-13 (name resolution governed and logged, no arbitrary
resolver). Expected evidence: egress policy configuration + excerpt from the name
resolution log. Rating scale: compliant = verified deny-by-default with an up-to-date
list; partial = unrestricted egress but active retrospective detection; non-compliant =
unrestricted egress with no detection.

## Pros and Cons of the Options

### Egress denied by default, explicit list
* Good, because it prevents exfiltration by design, with auditable name resolution.
* Bad, because operational lead time is needed for every new external dependency.

### Unrestricted egress with retrospective detection
* Good, because it does not hinder any development, with rapid implementation.
* Bad, because detection occurs after exfiltration, never before.

### Unrestricted egress with no control
* Good, because zero cost, no operational friction.
* Bad, because no containment of a compromise is possible; a total blind spot.

## More Information

Instantiations: `profil:azure` → Azure Firewall (egress rules) + logged Private DNS
Resolver; other profiles → filtering NAT gateway or equivalent outbound proxy. This
control is absent from the historical reference profile: its addition explicitly fills
this blind spot.
