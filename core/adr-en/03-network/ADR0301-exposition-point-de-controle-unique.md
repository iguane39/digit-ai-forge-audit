---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0301
domain: "03"
invariant: true
standards: ["NIST SP 800-207 (zero trust)", "OWASP ASVS 5.0 — V4.1 (sécurité générique des services web) + V2.4.1 (anti-automatisation)", "ISO/IEC 27002:2022 — 8.20/8.21/8.22"]
derived_controls: [CTL-D02-04]
---

# Application exposure through a single control point

## Context and Problem Statement

Every directly exposed application multiplies attack surfaces, divergent policies
(authentication, TLS, quotas), and observability blind spots. How can applications and
APIs be exposed in a uniform, controlled, and auditable way?

## Decision Drivers

* Uniformity of security policies at the boundary (authN/Z, TLS, quotas, WAF)
* Exhaustive inventory of what is exposed (no "shadow" exposure)
* Centralized observability of inbound access
* Decoupling between consumers and internal topology

## Considered Options

* Single exposure control point (gateway) in front of every application/API
* Direct exposure per application, with policy defined per team
* Direct exposure + retrospective security review

## Decision Outcome

Chosen option: "Single control point", because it makes boundary policies uniform and
verifiable in one place, produces the exposure inventory by construction, and constitutes
the prerequisite for a zero-trust posture — regardless of the hosting provider.

### Consequences

* Good, because there is a single TLS/authentication/quota policy to audit (D02, D03).
* Good, because everything that is exposed is known: the exposure inventory becomes an audit proof.
* Bad, because it is a critical passage point: sizing and high availability must be governed.
* Neutral, because marginal latency is added to each call.

### Confirmation

Derived controls: CTL-D03-05 (no exposure outside the gateway — verified through network
inventory), CTL-D02-04 (boundary policies active on 100% of routes). Evidence: inventory
of entry points + gateway configuration. Rating scale: compliant = 0 direct exposure;
partial = documented exceptions with a waiver; non-compliant = untracked direct exposure.

## Pros and Cons of the Options

### Single control point
* Good, because uniform policies, inventory by construction, single-point audit.
* Bad, because component criticality (HA required).

### Direct exposure per application
* Good, because team autonomy, no shared dependency.
* Bad, because divergent policies, untraceable inventory, N surfaces to audit.

### Direct exposure + retrospective review
* Good, because zero upfront cost.
* Bad, because the review identifies gaps after exposure — too late by design.

## More Information

Instantiations: `profil:azure` → APIM as a trusted tier + WAF; other profiles →
equivalent gateway (managed API gateway). Generalizes the exposure decisions from the
reference profile (application exposure, connectivity as a control point, APIM as a
trusted tier).

**ASVS citation — corrected on 2026-08-14 (migration to ASVS 5.0.0).** The original citation
`OWASP ASVS 5.0 — V13` used 4.0.x numbering: in 4.0.3, V13 = *API and Web Service*; in
5.0.0, V13 = *Configuration*. Targets adopted: **V4.1** (*Generic Web Service Security*) for the
exposed boundary, and **V2.4.1** (*Anti-automation*) for what the derived control CTL-D02-04
actually carries. That control also cited `V13 (API et services Web)`: a citation **wrong in
both versions**, since rate limiting never belonged to V13 — it was 4.0.3 **V11.1.4**
(*Business Logic*), moved to 5.0.0 V2.4.1 (`mapping_v4.0.3_to_v5.0.0.yml`:
`v4.0.3-11.1.4: MOVED TO v5.0.0-2.4.1`).
