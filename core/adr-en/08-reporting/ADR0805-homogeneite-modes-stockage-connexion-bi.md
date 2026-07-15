---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, data architects"
informed: "product teams"
id: ADR0805
domain: "08"
invariant: false
standards: ["Kimball — cohérence des modes d'accès BI", "ISO/IEC 25010 (efficacité de performance)"]
derived_controls: [CTL-D05-14, CTL-D11-05]
---

# Consistency of BI Storage/Connection Modes

## Context and Problem Statement

When each report freely chooses its own data access strategy (full in-memory extraction,
direct source querying, or a hybrid approach), perceived performance and data freshness
become unpredictable from one report to another, for reasons invisible to the end user.
How can we guarantee a consistent, justified choice of storage and connection mode across
the entire reporting layer?

## Decision Drivers

* Consistent, predictable perceived performance for the end user
* Data freshness consistent with each report's business need
* Control of the load placed on the source by reporting tools
* Explicit, justified choice rather than one left to each author's convenience

## Considered Options

* Connection modes standardized by need profile (freshness, volume, load)
* A single connection mode imposed uniformly on all reports
* Choice of connection mode left to the discretion of each report author

## Decision Outcome

Chosen option: "Modes standardized by need profile", because it avoids both the rigidity
of a single mode unsuited to some needs and the unpredictability of a choice left to each
author, by explicitly associating each need profile with a justified, documented
connection mode.

### Consequences

* Good, because perceived performance and data freshness are predictable per need profile.
* Good, because the load placed on the source remains controlled and anticipated.
* Bad, because every new report must be qualified into a need profile before design.
* Neutral, because existing, poorly qualified reports must be reclassified within the reference framework.

### Confirmation

Derived controls: CTL-D05-08 (storage/connection mode chosen and documented according to a
declared need profile — review mode), CTL-D11-01 (perceived end-user performance measured
and consistent with the declared profile — automatic mode). Expected evidence:
need-profile reference framework + perceived performance measurement per report. Scoring:
compliant = mode documented and performance consistent for every report; partial = mode
documented without a perceived-performance measurement; non-compliant = unjustified mode.

## Pros and Cons of the Options

### Modes Standardized by Need Profile
* Good, because of predictability, controlled load, and an always-justified choice.
* Bad, because of the upfront qualification of each report into a need profile.

### Single Mode Imposed on All Reports
* Good, because it is the simplest rule to audit.
* Bad, because it is unsuited to certain needs (real time or large historical volumes).

### Choice Left to Each Report Author
* Good, because of total freedom for local optimization.
* Bad, because performance and freshness are unpredictable, and the load on the source is not anticipated.

## More Information

Instantiations: `profil:databricks-lakehouse` → direct connection for large historical
volumes, in-memory extraction for interactive dashboards; the reporting profile (e.g.
`profil:powerbi`) specifies the available modes and their thresholds.
