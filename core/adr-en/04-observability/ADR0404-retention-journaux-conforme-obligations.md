---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, data protection officer"
informed: "product teams"
id: ADR0404
domain: "04"
invariant: true
standards: ["RGPD — art. 5, § 1, e) (limitation de la conservation)", "ISO/IEC 27002:2022 — 8.15", "ISO/IEC 27002:2022 — 8.10 (suppression des informations)"]
derived_controls: [CTL-D10-08]
---

# Log retention compliant with legal obligations

## Context and Problem Statement

Logs kept indefinitely accumulate risk (personal data exposed beyond what is necessary);
logs purged too early deprive the organization of the evidence required by a legal or
contractual obligation. How can we govern a log retention period that simultaneously
satisfies these two opposing constraints?

## Decision Drivers

* Compliance with legal retention obligations, which vary depending on the nature of the data
* Minimization: no personal data logged beyond the strictly necessary duration
* Availability of evidence throughout the entire period during which it may be required (audit, litigation, incident)
* Applicability independent of the log storage platform

## Considered Options

* Retention policy declared per log category, with automated and verifiable purging and archiving
* Indefinite retention by default, with occasional manual purging
* A single retention period applied uniformly to all logs with no distinction by category

## Decision Outcome

Chosen option: "Retention policy declared per category, automated purging", because it is
the only option that aligns each log category with the obligation that actually applies to
it, while making the purge verifiable rather than dependent on a manual action.

### Consequences

* Good, because each log category complies with the legal obligation specific to it.
* Good, because the purge becomes a verifiable mechanism, backed by audit evidence.
* Bad, because it requires an upfront classification of logs by category and associated obligation.
* Neutral, because a retention period longer than necessary must be explicitly justified.

### Confirmation

Derived controls: CTL-D10-07 (retention policy declared per log category, aligned with
the applicable legal obligation), CTL-D10-08 (purging and archiving executed and
verifiable, with evidence of application available). Expected evidence: retention policy
documented per category + purge execution report. Rating scale: compliant = policy
declared and purge verified as compliant with the periods; partial = policy declared with
no evidence of execution; non-compliant = indefinite retention or absence of a policy.

## Pros and Cons of the Options

### Policy declared per category, automated purging
* Good, because fine-grained alignment with actual obligations, with evidence of execution.
* Bad, because it requires an initial effort to classify log categories.

### Indefinite retention, occasional manual purging
* Good, because no accidental loss of evidence.
* Bad, because it accumulates personal data beyond what is necessary; de facto non-compliance.

### Single uniform period with no distinction by category
* Good, because it is simple to implement.
* Bad, because it over-retains some categories and under-retains others, with none matching the actual obligation.

## More Information

Instantiations: `profil:elastic` → index lifecycle (Index Lifecycle Management) with
automated purging and archiving per category. Ties in with observability by default
(ADR0401), whose retention component it governs.
