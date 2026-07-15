---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0202
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 5.17", "NIST SP 800-63B — §4.2.1 (AAL2) & §5.1.1 (MFA)", "OWASP ASVS 5.0 — V2.1/V2.2", "OpenID Connect / OAuth 2.0 (spécification ouverte)"]
derived_controls: [CTL-D03-01]
---

# Authentication delegated to a central IdP + MFA by default

## Context and Problem Statement

Every application that manages its own identifier base creates a silo: its own
password policy, missing or inconsistent MFA, and above all an access that survives a
departure as long as that particular silo remains unknown or unaddressed. How can we
guarantee a uniform, strong authentication level for every human access, regardless of
the application?

## Decision Drivers

* Elimination of application-level credential silos: one identity, one lifecycle
* Systematic elevation of the assurance level through multi-factor authentication (MFA)
* Immediate, centralized revocation in the event of departure or compromise
* Technology neutrality: the delegation protocol is open, the IdP is a profile choice

## Considered Options

* Authentication delegated to a central identity provider via an open protocol, MFA enforced by default
* Local authentication per application, password only
* Local authentication per application, MFA left to the user's choice

## Decision Outcome

Chosen option: "Central IdP + enforced MFA", because only this option centralizes the
identity lifecycle in a single place, uniformly raises the assurance level, and allows a
single audit of human access, independently of the application stack.

### Consequences

* Good, because there is a single identity per person; immediate revocation at a single point upon offboarding.
* Good, because the assurance level (MFA) is guaranteed by construction, not by each team's discipline.
* Bad, because of a critical dependency on the availability of the central IdP (mitigated by a dedicated continuity plan).
* Neutral, because an additional step (MFA) is added to every new user session.

### Confirmation

Derived control: CTL-D03-01 (delegated authentication + MFA active on 100% of human
access — review mode). Expected evidence: federation configuration + capture of the
MFA requirement + list of non-federated applications, where applicable under a
waiver. Grid: compliant = all applications federated with active MFA; partial =
federation without generalized MFA; non-compliant = local authentication without MFA
on an exposed application.

## Pros and Cons of the Options

### Central IdP + enforced MFA
* Good, because of a single identity lifecycle, guaranteed MFA, centralized revocation.
* Bad, because of a critical dependency point to govern (service continuity).

### Local authentication, password only
* Good, because of no external dependency, trivial implementation.
* Bad, because of a per-application credential silo; no MFA; offboarding not guaranteed.

### Local authentication, optional MFA
* Good, because of partial progress without an architecture change.
* Bad, because of a heterogeneous assurance level: dependent on each user's choice.

## More Information

Instantiations: `profil:azure` → Entra ID + conditional access enforcing MFA;
`profil:aws` → IAM Identity Center federated to an external IdP. Delegation protocol
recommended at the core level: OpenID Connect / OAuth 2.0 (open specifications,
admissible under the stop rule).
