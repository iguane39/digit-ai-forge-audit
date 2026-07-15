---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "product teams, data teams"
id: ADR0603
domain: "06"
invariant: false
standards: ["DAMA-DMBOK2 — Chapitre 12 (Metadata Management)", "ISO/IEC 11179 — registres de métadonnées (désignation et définition des éléments de données)"]
derived_controls: [CTL-D05-02, CTL-D16-07]
profile_bindings: optional
---

# Naming conventions for data assets

## Context and Problem Statement

Without a shared naming convention, each team invents its own vocabulary to designate domains, tables, columns, and flows, making search, automation, and auditing dependent on tacit knowledge. How can we guarantee that every data asset is named according to a single, readable convention that can be verified mechanically?

## Decision Drivers

* Asset search and discovery without tacit knowledge of the creating team
* Feasible automation of naming checks and generated documentation
* Reduced comprehension cost when a new team joins
* Portability of the convention across storage paradigms and platforms

## Considered Options

* Single, documented naming convention, verified by an automated check
* Recommended but unverified convention, left to team discipline
* No formal convention; each team names assets according to its own habits

## Decision Outcome

Chosen option: "Single, automatically verified convention", because it is the only option that makes naming predictable and enforceable without depending on each team's goodwill.

### Consequences

* Good, because discovering an asset no longer depends on a team's memory.
* Good, because the automated check detects deviations before production deployment.
* Bad, because migrating existing non-compliant assets represents a one-time effort.
* Neutral, because the convention itself must be revised as new asset types emerge.

### Confirmation

Derived controls: CTL-D16-02 (data dictionary compliant with the declared naming convention), CTL-D05-02 (convention verified by an automated check in continuous integration or in review). Expected evidence: naming check report and documented, versioned convention. Scoring: compliant = convention documented and automated check active; partial = convention documented without an automated check; non-compliant = no formalized convention.

## Pros and Cons of the Options

### Single, automatically verified convention

* Good, because maximum predictability and auditability.
* Bad, because effort required to migrate non-compliant legacy assets.

### Recommended, unverified convention

* Good, because it introduces no technical friction.
* Bad, because it drifts progressively with no reminder mechanism, and gets ignored under deadline pressure.

### No formal convention

* Good, because it leaves teams complete freedom.
* Bad, because discovery and integration cost grows with the number of assets.

## More Information

Instantiations: `profil:databricks-lakehouse` → catalog.schema.table convention verified at publication; `profil:powerbi` → naming convention for certified datasets and reports.
