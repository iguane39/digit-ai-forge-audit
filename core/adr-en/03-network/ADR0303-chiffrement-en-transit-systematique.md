---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0303
domain: "03"
invariant: true
standards: ["NIST SP 800-52 (choix et configuration TLS)", "ISO/IEC 27002:2022 — 8.24", "OWASP ASVS 5.0 — V12 (communication sécurisée : V12.1 TLS, V12.2 HTTPS externe, V12.3 service à service)"]
derived_controls: [CTL-D02-06]
---

# Systematic encryption in transit

## Context and Problem Statement

Any data that travels unencrypted over a network — including internal networks — is
exposed to interception and tampering. How can the confidentiality and integrity of
exchanges be guaranteed across every network path, without exception or case-by-case
judgment?

## Decision Drivers

* Confidentiality and integrity of exchanges, including between internal components
* Resistance to interception on shared or unmanaged networks
* Alignment with an evolving cryptographic state of the art (versions, cipher suites)
* No tolerable exception: the rule must be binary and automatically verifiable

## Considered Options

* Mandatory encryption in transit on every flow, internal and external, with up-to-date versions and cipher suites
* Mandatory encryption on external flows only, internal flows unencrypted
* Encryption left to each team's discretion based on perceived sensitivity

## Decision Outcome

Chosen option: "Mandatory encryption in transit on every flow", because it eliminates, as
a matter of principle, the notion of a "trusted internal network" — precisely the
assumption invalidated by a zero-trust model — and because it is the only formulation that
is automatically verifiable, without contextual judgment.

### Consequences

* Good, because no flow, internal or external, remains a trivial interception surface.
* Good, because the rule is binary: it can be automated through continuous detection.
* Bad, because it adds computational overhead and certificate/key management on internal flows.
* Neutral, because it requires a cryptographic lifecycle policy (versions, deprecation).

### Confirmation

Derived controls: CTL-D02-07 (cryptographic version and cipher suites compliant with the
state of the art on every interface, exposed or internal), CTL-D02-08 (no unencrypted flow
detected by the automated network scan). Expected evidence: scan report of versions/suites
in use + inventory of covered interfaces. Rating scale: compliant = 100% of flows
encrypted with up-to-date versions; partial = external flows covered, residual internal
flows unencrypted; non-compliant = any unencrypted external flow.

## Pros and Cons of the Options

### Mandatory encryption on every flow
* Good, because a binary, verifiable rule with no internal blind spot.
* Bad, because widespread cryptographic management overhead.

### External encryption only
* Good, because it covers the risk perceived as the priority at lower cost.
* Bad, because internal lateral movement can intercept unencrypted flows.

### Encryption left to teams' discretion
* Good, because perceived maximum flexibility.
* Bad, because no verifiable rule exists; certain drift toward unencrypted-by-default.

## More Information

Instantiations: termination managed by the hosting platform or by the exposure control
point (ADR0301); `profil:azure` → managed certificates + minimum version policy enforced
at the gateway. Reference open specification: TLS (IETF), admissible at the core level.

**ASVS citation — corrected on 2026-08-14 (migration to ASVS 5.0.0).** The original citation
`OWASP ASVS 5.0 — V13` was **wrong in both versions of the standard**, not merely
misnumbered: in 4.0.3, V13 = *API and Web Service*; in 5.0.0, V13 = *Configuration*. Neither
carries encryption in transit, which belongs to 4.0.3 **V9 Communication** → 5.0.0 **V12 Secure
Communication** (`mapping_v4.0.3_to_v5.0.0.yml`: V9.1.1→V12.2.1, V9.1.2→V12.1.2,
V9.1.3→V12.1.1, V9.2.1→V12.3.4, V9.2.2→V12.3.1, V9.2.4→V12.1.4).
