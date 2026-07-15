---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0205
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.2", "CIS Controls v8 — Contrôle 5", "NIST SP 800-53 — AC-2(9)"]
derived_controls: [CTL-D03-06]
---

# Dedicated, least-privilege technical accounts

## Context and Problem Statement

A service that needs to access another resource often takes a shortcut: reusing an
existing human account or a technical account already shared by other uses. The
result is a loss of individual traceability and an accumulation of privileges through
successive additions. How can we grant machine access without inheriting this debt of
a shared, over-privileged account?

## Decision Drivers

* Individual traceability of each technical use (which service acts, and why)
* Strict confinement of each technical account's scope of action (least privilege)
* Targeted revocation or rotation, with no side effect on other uses
* Elimination of accounts shared between multiple services, or between humans and services

## Considered Options

* One dedicated technical account per use, with minimal privileges and its own lifecycle
* A technical account pooled per functional domain, with cumulative privileges
* Reuse of an existing human account for technical uses

## Decision Outcome

Chosen option: "Dedicated technical account per use", because it alone guarantees
individual traceability, confinement of the scope of action, and revocation without
side effects — the other two options accumulate privileges and dilute
accountability.

### Consequences

* Good, because every incident can be attributed to a specific use, never to a catch-all account.
* Good, because revoking or rotating a technical account affects only a single use.
* Bad, because of a proliferation of technical accounts to inventory and govern.
* Neutral, because a tooled creation/removal process is required, otherwise the proliferation itself becomes a risk.

### Confirmation

Derived control: CTL-D03-06 (dedicated technical accounts, not shared, least
privilege — review mode). Expected evidence: inventory of technical accounts with
declared use and associated rights scope. Grid: compliant = one account for one
documented use, minimal rights verified; partial = dedicated accounts but excessive
rights observed; non-compliant = an account shared between several uses or between a
human and a service.

## Pros and Cons of the Options

### Dedicated technical account per use
* Good, because of individual traceability, confinement, targeted revocation.
* Bad, because of a continuously growing volume of accounts to govern.

### Technical account pooled by domain
* Good, because of fewer accounts to create initially.
* Bad, because of privileges accumulated beyond the actual need of each use.

### Reuse of a human account
* Good, because of no additional account creation.
* Bad, because of human/machine confusion; the technical use is blocked if the human account is disabled.

## More Information

Instantiations: `profil:azure` → managed identities assigned per resource, with no
static key; `profil:aws` → IAM roles assumed per service. Link with ADR0201: the
technical account carries the runtime identity, the central vault carries only what
cannot be avoided.
