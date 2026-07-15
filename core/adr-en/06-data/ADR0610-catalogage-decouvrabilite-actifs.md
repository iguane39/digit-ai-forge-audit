---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "all product teams"
id: ADR0610
domain: "06"
invariant: false
standards: ["DAMA-DMBOK2 — Chapitre 12 (Metadata Management)", "FAIR Principles (GO FAIR, 2016) — Findable, Accessible, Interoperable, Reusable"]
derived_controls: [CTL-D13-07, CTL-D15-07, CTL-D16-07]
profile_bindings: optional
---

# Cataloging and discoverability of data assets

## Context and Problem Statement

A data asset that exists without being cataloged is, for the rest of the organization, equivalent to an asset that does not exist: it gets rediscovered every time it is needed, often by duplicating a process already carried out elsewhere. How can we guarantee that every data asset produced is findable, described, and reusable by teams other than the one that created it?

## Decision Drivers

* Reduced duplication of processes already carried out elsewhere in the organization
* Ability to search for an asset by its business meaning, without knowing its technical location
* Effective reusability, beyond the asset's mere technical existence
* Neutrality with respect to the cataloging tool in use

## Considered Options

* Central data asset catalog, populated at publication, with mandatory business description
* Documentation scattered by team (wiki, files), with no central register
* No formal documentation; discovery happens by word of mouth

## Decision Outcome

Chosen option: "Central catalog populated at publication", because it is the only option that makes an asset findable by a team unaware of its existence, a necessary condition for reuse at the organization's scale.

### Consequences

* Good, because an existing asset is found before an equivalent process gets redeveloped elsewhere.
* Good, because the associated business description reduces the need to contact the creating team.
* Bad, because populating the catalog at every publication adds a step to the delivery cycle.
* Neutral, because the quality of the description depends on the discipline of the producing teams.

### Confirmation

Derived controls: CTL-D15-06 (data catalog published and up to date for production assets), CTL-D16-06 (data dictionary discoverable and searchable by business meaning). Expected evidence: catalog extract showing description coverage and freshness, and the rate of production assets listed. Scoring: compliant = up-to-date catalog covering all production assets; partial = incomplete coverage; non-compliant = no central catalog.

## Pros and Cons of the Options

### Central catalog populated at publication

* Good, because it provides organization-wide discoverability and reduces duplication.
* Bad, because it adds an extra step to the publication cycle.

### Documentation scattered by team

* Good, because each team documents according to its own habits.
* Bad, because no cross-team search is possible; documentation gets lost with staff turnover.

### No formal documentation

* Good, because it requires no documentation effort.
* Bad, because every need retriggers an investigation or the duplication of an existing process.

## More Information

Instantiations: `profil:databricks-lakehouse` → native technical catalog with search by business tag and popularity indicators; `profil:powerbi` → portal of certified and promoted content, exposing reusable datasets.
