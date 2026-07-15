---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, operations team"
informed: "all product teams"
id: ADR0210
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 5.24-5.28 (cycle de gestion des incidents de sécurité)", "CIS Controls v8 — 17 (Incident Response Management)"]
derived_controls: [CTL-D12-10]
---

# Security incident response: detection, containment, evidence

## Context and Problem Statement

The corpus already covers the generic operational incident (availability,
performance) and its post-mortem, but no decision distinguishes the security
incident: a compromise of confidentiality or integrity requires rapid containment
without destroying the evidence needed for the investigation. How can we guarantee
that such an incident is detected, qualified, contained, and documented in a way that
remains usable afterward, including legally?

## Decision Drivers

* Distinction between a generic operational incident and a security incident (confidentiality/integrity compromised)
* Rapid containment without destroying the evidence needed for the investigation
* Bounded qualification time: every security signal is triaged before a defined window expires
* Evidence chain usable afterward (forensics), including legally

## Considered Options

* Dedicated security incident response procedure (qualification, containment, evidence, remediation), named roles, and a bounded qualification time
* Handling via the existing generic operational incident process, with no dedicated evidence-preservation step
* Ad hoc handling by whichever team is available at the time of the incident, with no written procedure

## Decision Outcome

Chosen option: "Dedicated security incident response procedure", because it is the
only option that preserves evidence during containment, bounds the qualification
time, and names a clear accountability, independently of the hosting provider or the
nature of the incident.

### Consequences

* Good, because a security incident is contained without loss of evidence usable afterward.
* Good, because the qualification time becomes measurable and enforceable in an audit.
* Bad, because a dedicated on-call rotation and procedure must be maintained and exercised, a recurring cost.
* Neutral, because the escalation level depends on severity, left to the judgment of the designated authority in ambiguous cases.

### Confirmation

Derived control: CTL-D12-10 (documented security incident response procedure —
qualification, containment, write-protected timestamped evidence, remediation —
named roles and bounded qualification time, exercised at least annually — review
mode). Expected evidence: up-to-date procedure + evidence register from the last
incident or simulated exercise. Grid: compliant = up-to-date procedure AND
incident/exercise handled within 12 months, complete register; partial = procedure
not exercised for more than 12 months; non-compliant = absence of a procedure or
nonexistent evidence register.

## Pros and Cons of the Options

### Dedicated security incident response procedure
* Good, because it preserves evidence, bounds qualification, clear accountability.
* Bad, because of regular on-call duty and exercises to maintain, a recurring cost.

### Generic operational incident process
* Good, because of no additional process to create or maintain.
* Bad, because of no dedicated evidence preservation; risk of scene contamination.

### Ad hoc handling without a procedure
* Good, because of zero cost as long as no incident occurs.
* Bad, because of unpredictable response, no usable evidence, no audit trail.

## More Information

Instantiations: `profil:azure` → detection and automated containment playbook via the
platform's SIEM/SOAR; other profiles → equivalent SIEM/SOAR, documented playbook.
Linked to ADR0211 (detection signals) and ADR0213 (external notification, same
evidence chain). Gap closed: ISO/IEC 27002:2022 — 5.24-5.28 and CIS Controls v8 — 17,
not covered (EXTENSION-CORPUS.md §2).
