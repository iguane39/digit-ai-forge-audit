---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "{roles.security_officer}, operations teams"
id: ADR0611
domain: "06"
invariant: true
standards: ["ISO/IEC 27002:2022 — 8.13 (sauvegarde des informations)", "RGPD — Art. 32.1.c (capacité à rétablir la disponibilité et l'accès)", "DORA (Accelerate) (DevOps Research and Assessment) — reprise de service"]
derived_controls: [CTL-D05-09, CTL-D12-06, CTL-D12-07, CTL-D14-06, CTL-D15-09, CTL-D16-09]
profile_bindings: optional
---

# Tested backup and restoration, declared RPO/RTO

## Context and Problem Statement

A backup that has never been restored is a hypothesis, not a guarantee: many data-loss incidents reveal, at the moment of restoration, that the backup was incomplete, corrupted, or too old to meet the business need. This gap was not covered by any explicit decision in the existing corpus, backup having been treated as an implicit operational detail rather than a declared and verified architectural commitment. How can we guarantee that the ability to restore data is proven, not assumed, with explicit loss and delay objectives?

## Decision Drivers

* Actual proof of restoration, rather than the mere existence of a backup
* Explicit objectives for tolerated data loss (RPO) and restoration delay (RTO) per critical asset
* Detection of a corrupted or incomplete backup before the incident, not during it
* Applicability independent of the backup medium and mechanism in use

## Considered Options

* RPO/RTO declared per critical asset, restoration tested periodically, evidence retained
* Automated backup with no restoration test and no declared objective
* Ad hoc manual backup, triggered at the operational team's discretion

## Decision Outcome

Chosen option: "Declared RPO/RTO with tested restoration", because it is the only option that turns a recovery hypothesis into a proven, measurable capability that is enforceable in an audit.

### Consequences

* Good, because a real, timed restoration reveals a backup's flaws before an incident reveals them at a critical moment.
* Good, because the declared RPO/RTO provides a resilience commitment that is verifiable per asset, instead of a generic promise.
* Bad, because testing restoration periodically consumes operational time and sometimes a dedicated environment.
* Neutral, because the RPO/RTO must be negotiated with the Data Owner according to the asset's actual criticality.

### Confirmation

Derived controls: CTL-D05-09 (backups executed in accordance with the declared RPO per critical asset), CTL-D15-07 (restoration tested periodically with evidence of RTO compliance). Expected evidence: report of the latest restoration exercise (duration, integrity observed) and declared RPO/RTO per asset. Scoring: compliant = RPO/RTO declared and restoration successfully tested ≤ 12 months ago; partial = objectives declared with no recent test; non-compliant = no declared objectives, or the last test failed and was not remediated.

## Pros and Cons of the Options

### Declared RPO/RTO with tested restoration

* Good, because it provides a recovery capability that is proven and measurable, not assumed.
* Bad, because it incurs a recurring testing cost, in time and sometimes in a dedicated environment.

### Automated backup with no restoration test

* Good, because it provides immediate coverage with minimal operational effort.
* Bad, because a backup that is never restored can be corrupted without anyone knowing until the incident.

### Ad hoc manual backup

* Good, because it requires no initial automation cost.
* Bad, because coverage and frequency are not guaranteed, and recovery objectives are absent.

## More Information

Instantiations: `profil:databricks-lakehouse` → versioned snapshots with a bounded history window and replication tested through cross-restoration; `profil:azure` → managed backups with scheduled restoration exercises, exercise report retained as audit evidence.
