---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0702
domain: "07"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.21 (sécurité des services réseau)", "OWASP ASVS 5.0 — V12 (fichiers et ressources)", "ISO/IEC 27002:2022 — 8.12 (prévention de la fuite de données)"]
derived_controls: [CTL-D01-13]
---

# File Exchanges via Trusted Managed Service

## Context and Problem Statement

Large-scale or batch file exchanges (exports, imports, periodic transfers) often bypass
the application API and use ad hoc channels (folder sharing, messaging, isolated transfer
scripts). How can we guarantee that file exchanges between applications or partners remain
traced, secure, and governed on the same footing as API exchanges?

## Decision Drivers

* Traceability of every file drop or retrieval (who, what, when)
* Consistent access control and encryption, including for large files
* Detection of malicious or non-compliant content before downstream integration
* Elimination of ad hoc, non-inventoried transfer channels

## Considered Options

* File exchanges via a trusted managed service (governed drop-off, controlled access)
* Ad hoc file transfers via office channels (messaging, folder sharing)
* Point-to-point transfer scripts isolated per team

## Decision Outcome

Chosen option: "Trusted managed service", because it centralizes access control,
encryption, and content detection, and turns every file exchange into a traced event — the
only option that holds regardless of the volume or frequency of exchanges.

### Consequences

* Good, because every file drop or retrieval is logged and attributable to an identity.
* Good, because there is a single point of malicious content detection before downstream integration.
* Bad, because of dependency on the managed service's availability for every batch exchange.
* Neutral, because migration of existing scripts to the managed service needs to be planned.

### Confirmation

Derived controls: CTL-D01-02 (no file exchange outside the trusted managed service —
review mode), CTL-D02-02 (access control, encryption, and content detection active —
automatic mode). Expected evidence: inventory of file transfer channels + managed service
configuration. Scoring: compliant = 100% of exchanges via the managed service; partial =
residual ad hoc channels under a waiver; non-compliant = untracked ad hoc channel
detected.

## Pros and Cons of the Options

### Trusted Managed Service
* Good, because access control, encryption, and content detection are centralized.
* Bad, because it introduces a dependency point to govern (availability, capacity).

### Ad Hoc Office Transfers
* Good, because no tooling needs to be deployed.
* Bad, because there is no traceability, no content control, and data leakage is made easier.

### Point-to-Point Transfer Scripts
* Good, because it performs well for an isolated technical need.
* Bad, because channels are scattered, non-inventoried, with inconsistent security from one team to another.

## More Information

Instantiations: `profil:azure` → managed storage account with temporary signed access and
content scanning; other profiles → equivalent managed transfer service. Generalizes the
file exchange decisions from the reference profile (trusted managed service).
