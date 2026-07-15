---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, operations teams"
informed: "product teams"
id: ADR0402
domain: "04"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.15", "NIST SP 800-53 — famille AU (Audit and Accountability)", "CIS Controls v8 — 8 (Audit Log Management)"]
derived_controls: [CTL-D03-08, CTL-D10-09, CTL-D10-12]
---

# Logged security events and governed access to logs

## Context and Problem Statement

Without an explicit catalog of security events to log, an incident (authentication,
privilege escalation, access to sensitive data) leaves no usable trace; and without
governance over access to logs, the trace itself becomes falsifiable. Which events should
be logged systematically, and who can view or modify these logs?

## Decision Drivers

* Reliable reconstruction of a security incident after the fact
* Integrity of evidence: a log that can be modified by its subject proves nothing
* Compliance with auditability obligations, both regulatory and contractual
* Universal scope: the rule applies to every application, regardless of its stack

## Considered Options

* Standardized catalog of security events, tamper-proof log, restricted and logged access
* Unrestricted application logging, with no catalog or access restriction
* Logging of technical errors only, with security events not distinguished

## Decision Outcome

Chosen option: "Standardized catalog + tamper-proof log + governed access", because it is
the only option that guarantees both the completeness of evidentiary events and the
integrity of the evidence — a log that is writable by the very party it monitors has no
evidentiary value.

### Consequences

* Good, because every security incident has a usable and reliable trace.
* Good, because access to logs itself becomes auditable (who viewed what, and when).
* Bad, because it adds logging volume that must be processed and stored (see ADR0404).
* Neutral, because it requires an event catalog kept up to date as the application evolves.

### Confirmation

Derived controls: CTL-D10-03 (catalog of security events systematically logged:
authentication, privilege escalation, access to secrets and sensitive data), CTL-D10-04
(access to logs restricted to a dedicated role and itself logged). Expected evidence:
excerpt from the event catalog + excerpt from the log-access log. Rating scale: compliant
= complete catalog and demonstrated governed access; partial = incomplete catalog or
unrestricted access; non-compliant = security events not distinguished from generic
application logs.

## Pros and Cons of the Options

### Standardized catalog + tamper-proof log + governed access
* Good, because usable and intact evidence, with access itself auditable.
* Bad, because it requires volume management and catalog maintenance discipline.

### Unrestricted logging with no catalog or restriction
* Good, because no upfront design effort is required.
* Bad, because security events are drowned in noise, with access uncontrolled.

### Logging technical errors only
* Good, because minimal volume.
* Bad, because security events (rarely errors) are never captured.

## More Information

Instantiations: `profil:elastic` → common security field schema (ECS) + role-based access
control on the log index. Ties in with observability by default (ADR0401), whose security
subset it specializes.
