---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0204
domain: "02"
invariant: false
standards: ["NIST SP 800-63B — §5.1.1 (memorized secrets)", "ISO/IEC 27002:2022 — 5.17", "OWASP ASVS 5.0 — V6.2.4 + V6.2.10/V6.2.12 (éclats de 4.0.3 V2.1.7) + V6.2.5 (4.0.3 V2.1.9)"]
derived_controls: [CTL-D02-05]
---

# Password and account policy aligned with the state of the art

## Context and Problem Statement

Historical policies (mandatory periodic rotation, artificial complexity) are now
documented as counter-productive: they push users toward workarounds (predictable
patterns, written-down passwords) without actually raising security. What password and
account policy should be adopted so that it strengthens security instead of degrading
it through user practice?

## Decision Drivers

* Alignment with the normative state of the art (length and verification rather than imposed complexity)
* Reduction of the user workaround rate (sticky notes, predictable incrementing)
* Protection against credential stuffing and already-compromised passwords
* Compatibility with a possible later shift to passwordless authentication

## Considered Options

* Policy based on a minimum length, verification against lists of compromised passwords, and anti-brute-force lockout, with no mandatory periodic rotation nor artificial complexity
* Historical policy: mandatory periodic rotation and imposed complexity rules
* No formal policy, left to each application's discretion

## Decision Outcome

Chosen option: "Policy based on length and anti-compromise verification", because it
is the only one backed by evidence of reduced user workarounds and aligned with the
reference normative framework, while remaining verifiable independently of the stack.

### Consequences

* Good, because of a measurable reduction in workaround practices (reuse, incrementing).
* Good, because of effective protection against credentials already exposed publicly.
* Bad, because of a break from historical habits; user and auditor education is needed.
* Neutral, because this policy naturally fades away if a passwordless method is adopted (ADR0202).

### Confirmation

Derived control: CTL-D03-09 (minimum length, anti-compromise verification,
anti-brute-force lockout, absence of unjustified periodic rotation — review mode).
Expected evidence: account policy configuration + result of a lockout test. Grid:
compliant = all three requirements met; partial = two out of three; non-compliant =
policy absent or based solely on imposed complexity/rotation.

## Pros and Cons of the Options

### Length and anti-compromise verification
* Good, because it is evidence-based, reduces workarounds, is verifiable.
* Bad, because it changes long-established habits.

### Historical policy (rotation + complexity)
* Good, because it is perceived as rigorous, familiar to auditors used to it.
* Bad, because it has been shown to be counter-productive: workarounds, predictability.

### No formal policy
* Good, because of no implementation effort.
* Bad, because of an unpredictable robustness level, inconsistent from one application to another.

## More Information

Instantiations: `profil:azure` → Entra ID: banned-password protection + smart
lockout; `profil:aws` → IAM password policy with a custom block list. Toward
passwordless authentication (open specification such as a security key) where the
profile allows it, as a gradual replacement.
