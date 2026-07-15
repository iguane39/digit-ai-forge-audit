---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "{roles.security_officer}, all product teams"
id: ADR0609
domain: "06"
invariant: true
standards: ["RGPD — Art. 5.1.e (limitation de la conservation)", "ISO/IEC 27002:2022 — 8.10 (suppression des informations)", "DAMA-DMBOK2 — Chapitre 6 (Data Storage and Operations)"]
derived_controls: [CTL-D05-08, CTL-D15-09, CTL-D16-04, CTL-D16-08]
profile_bindings: optional
---

# Governed retention, archiving, and purging

## Context and Problem Statement

Data kept indefinitely, for lack of an explicit policy, increases the exposure surface in the event of an incident and violates the obligation to limit retention to the period necessary for the purpose of processing. How can we guarantee that every data asset has a declared retention period and is effectively purged at its expiry, independent of the storage medium?

## Decision Drivers

* Compliance with the legal obligation to limit retention
* Reduced exposure surface in the event of an incident
* Control of storage cost, which grows with data age
* Uniform applicability to active data, archived data, and backup copies

## Considered Options

* Retention policy declared per asset, with automated archiving and purging at expiry
* Manual purge, triggered ad hoc during an audit or an incident
* Indefinite retention by default, with no declared policy

## Decision Outcome

Chosen option: "Declared retention policy with automated purging", because it is the only option that makes the limitation on retention continuously verifiable, rather than dependent on an ad hoc initiative.

### Consequences

* Good, because the retention period for each asset is explicit, documented, and enforceable in an audit.
* Good, because automated purging mechanically reduces the exposure surface and storage cost.
* Bad, because some purges are irreversible: the policy must be validated with the Data Owner before activation.
* Neutral, because retention obligations vary by data category and must be listed explicitly.

### Confirmation

Derived controls: CTL-D05-08 (retention/purge policy applied and verified per critical asset), CTL-D16-05 (column-level sensitivity classification driving the retention period). Expected evidence: register of retention policies per asset and execution report of scheduled purges. Scoring: compliant = policy declared and purge executed for all assets concerned; partial = policy declared without a verifiable automated purge; non-compliant = no policy.

## Pros and Cons of the Options

### Declared retention policy with automated purging

* Good, because it provides continuous compliance and a mechanical reduction in exposure.
* Bad, because the purge is irreversible, requiring rigorous prior validation.

### Ad hoc manual purge

* Good, because it requires no initial automation.
* Bad, because it depends on an external trigger; compliance is only continuous by accident.

### Indefinite retention by default

* Good, because there is no risk of losing useful data.
* Bad, because it is structurally non-compliant with the obligation to limit retention.

## More Information

Instantiations: `profil:databricks-lakehouse` → lifecycle policies applied at the table level, with scheduled purging and bounded history; `profil:azure` → storage lifecycle rules (hot/cool/archive) scheduled per data category.
