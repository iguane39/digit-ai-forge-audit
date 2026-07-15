---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.remediation_team}, operations teams"
informed: "product teams"
id: ADR0105
domain: "01"
invariant: false
standards: ["ITIL 4 — pratique Service Configuration Management", "ISO/IEC 20000-1:2018 (gestion des configurations et des actifs de service)"]
derived_controls: [CTL-D01-01, CTL-D01-08, CTL-D07-03, CTL-D12-01, CTL-D12-09]
---

# Service Inventory and Registration (CMDB)

## Context and Problem Statement

Without a single registry of services, applications, and infrastructure components, the
organization cannot reliably answer basic audit questions (how many services exist, who
owns them, what they depend on), and every inventory exercise reverts to an error-prone
manual collection effort. How can a central, up-to-date registry be maintained as the
authoritative source on the existence and relationships of services?

## Decision Drivers

* Reliable, immediate answers to inventory and dependency questions during an audit or a crisis
* Freshness of the registry: a stale registry is as dangerous as no registry at all
* Automatic reconciliation with technical reality, rather than purely manual declaration
* The registry as the single authoritative source, not yet another parallel spreadsheet

## Considered Options

* Central service registry fed by declaration and periodic automatic reconciliation
* Inventory reconstructed on demand, through manual extraction for each audit
* Local inventories kept by each team, with no central consolidation

## Decision Outcome

Chosen option: "Central registry, fed and automatically reconciled", because it alone
guarantees the registry's freshness over time: manual declaration alone inevitably drifts,
and the absence of central consolidation makes any cross-cutting question impossible to
answer in time.

### Consequences

* Good, because an audit or crisis-management question finds an immediate, reliable answer.
* Good, because automatic reconciliation detects undeclared services before they are discovered during an incident.
* Bad, because automatic reconciliation requires minimal upfront instrumentation (tags, inventory interface — see ADR0102/ADR0103).
* Neutral, because the expected level of detail (down to the application component, or the service level only) remains a profile parameter.

### Confirmation

Derived controls: CTL-D12-04 (exhaustive registry: every production service is registered
in it), CTL-D12-05 (periodic automatic reconciliation with deviations tracked and
resolved). Expected evidence: timestamped export of the registry and a reconciliation
report (deviations detected and resolved). Grading: compliant = automatic reconciliation
active, deviations resolved within a declared time frame; partial = periodic manual
reconciliation; non-compliant = registry not maintained, or never reconciled.

## Pros and Cons of the Options

### Central registry, fed and automatically reconciled
* Good, because freshness is guaranteed, and inventory questions get an immediate answer.
* Bad, because it requires minimal upfront instrumentation (tags, inventory interfaces).

### Inventory reconstructed on demand
* Good, because there is no permanent tooling to maintain.
* Bad, because the delay and reliability are incompatible with crisis management.

### Local inventories with no consolidation
* Good, because each team has complete autonomy.
* Bad, because there is no reliable cross-cutting view, and audit questions have no single answer.

## More Information

Profile instantiations: `profil:itsm-outille` → registry fed by automatic discovery and a
cloud inventory interface; `profil:catalogue-developpeur` → technical catalog serving as a
lightweight registry in the absence of a dedicated service-management tool.
