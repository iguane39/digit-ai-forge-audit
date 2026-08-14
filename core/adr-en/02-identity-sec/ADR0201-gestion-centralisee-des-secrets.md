---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0201
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.24", "OWASP ASVS 5.0 — V13.3.1 (gestion des secrets) + V13.2.1/V13.2.3 (authentification de service) — 4.0.3 V2.10 éclatée, V2.10.3 couverte et V2.10.4 fusionnée dans V13.3.1", "NIST SSDF — PS.1", "12-Factor — III. Config"]
derived_controls: [CTL-D03-02, CTL-D03-03, CTL-D03-04]
---

# Centralized secrets management outside the source code

## Context and Problem Statement

Credentials (API keys, connection strings, certificates) present in code, versioned
configuration, or logs are the leading cause of application compromise. How can we
guarantee that no secret resides in a versioned or delivered artifact, while remaining
usable by applications at runtime?

## Decision Drivers

* Reduction of the leak surface (repositories, images, logs, tickets)
* Rotation and revocation possible without redeploying code
* Auditability of secret access (who, what, when)
* Portability: the rule holds for any language, platform, and hosting provider

## Considered Options

* Centralized secrets vault + runtime identities (no static secret)
* Secrets encrypted in the repository (file-encryption tooling), decrypted at deployment
* Environment variables managed solely by the runtime platform

## Decision Outcome

Chosen option: "Centralized vault + runtime identities", because it is the only option
that eliminates the static secret (the application authenticates via its runtime
identity), offers native rotation, revocation, and access logging, and satisfies all
drivers independently of the stack.

### Consequences

* Good, because no secret remains in code, artifacts, or CI; rotation without a delivery.
* Good, because an access log is usable for audit (D03) and incident response (D12).
* Bad, because of a runtime dependency on the vault: its availability becomes critical
  (mitigated by a short-lived encrypted local cache).
* Neutral, because of an initial learning cost for teams.

### Confirmation

Derived controls: CTL-D03-02 (no secret detected by scan — automatic mode),
CTL-D03-03 (rotation ≤ 90 days and active access log — review mode).
Expected evidence: clean secret-scan report over the history + capture of the
rotation policy. Grid: compliant = clean scan AND active rotation; partial = clean
scan without rotation; non-compliant = any secret detected.

## Pros and Cons of the Options

### Centralized vault + runtime identities
* Good, because it eliminates the static secret; native rotation/revocation/audit.
* Bad, because of a runtime dependency point.

### Secrets encrypted in the repository
* Good, because it is simple, auditable in Git.
* Bad, because decryption requires... a secret; rotation = commit; no access log.

### Platform environment variables
* Good, because it is the 12-Factor standard, portable.
* Bad, because of easy leakage (dumps, logs), no governed rotation nor access audit.

## More Information

Instantiations by profile: `profil:azure` → Key Vault + managed identities;
`profil:aws` → Secrets Manager + IAM roles. The profile supplies the executable
verification commands for control CTL-D03-02.
