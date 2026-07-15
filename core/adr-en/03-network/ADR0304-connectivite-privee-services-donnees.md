---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects, data teams"
informed: "product teams"
id: ADR0304
domain: "03"
invariant: true
standards: ["CIS Controls v8 — 12 (Network Infrastructure Management)", "NIST SP 800-207 (zero trust)", "ISO/IEC 27002:2022 — 8.20/8.22"]
derived_controls: [CTL-D04-07]
---

# Private connectivity for data services

## Context and Problem Statement

A database, storage account, or message queue accessible from the public internet is a
direct target, regardless of the strength of the authentication protecting it. How can we
guarantee that data services are never reachable other than through a private path,
regardless of the hosting provider?

## Decision Drivers

* Elimination of the direct attack surface on the data plane
* Defense in depth: an authentication failure is no longer sufficient to expose the data
* Consistency with runtime identity as the means of access (no static secret on the network)
* Uniform application regardless of the type of data service

## Considered Options

* Strictly private connectivity for every data service, no public access point
* Public access point protected by strong authentication and an authorized address list
* Public access point protected by authentication only

## Decision Outcome

Chosen option: "Strictly private connectivity", because it is the only option that makes
the data unreachable from the public internet by design, regardless of any authentication
failure or application configuration error.

### Consequences

* Good, because the data plane is no longer a direct target from the public internet.
* Good, because it naturally aligns with runtime identity (no static secret to transport).
* Bad, because it complicates access from third-party environments (tooling, support), which must go through a dedicated gateway.
* Neutral, because it requires consistent private network address planning across environments.

### Confirmation

Derived controls: CTL-D02-09 (no data service publishes a public endpoint — verified
automatically through network configuration), CTL-D03-04 (access to data services via
runtime identity over the private path, with no static secret). Expected evidence:
inventory of data services with exposure status + private connectivity configuration.
Rating scale: compliant = 0 public endpoints; partial = public endpoint restricted by an
address list with a documented waiver; non-compliant = unrestricted public endpoint.

## Pros and Cons of the Options

### Strictly private connectivity
* Good, because it eliminates the direct attack surface by design.
* Bad, because third-party access is more complex to tool.

### Restricted public access point (authentication + address list)
* Good, because it is simpler to implement for occasional third-party access.
* Bad, because it remains reachable from the public internet; the address list can be circumvented.

### Public access point with authentication only
* Good, because it is the simplest to enable.
* Bad, because it directly exposes the data plane to any intrusion attempt.

## More Information

Instantiations: `profil:azure` → Private Link/private endpoints + managed identities;
`profil:aws` → VPC Endpoints + IAM roles. The profile provides the executable
verification command for control CTL-D02-09.
