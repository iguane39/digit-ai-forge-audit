---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.data_roles.architect}"
informed: "product teams, data teams"
id: ADR0602
domain: "06"
invariant: true
standards: ["DAMA-DMBOK2 — Chapitre 5 (Data Modeling and Design)", "ISO/IEC 25012:2008 — modèle de qualité des données", "RGPD — Art. 24 (responsabilité du responsable de traitement)"]
derived_controls: [CTL-D15-02, CTL-D16-01, CTL-D16-02, CTL-D16-03]
profile_bindings: optional
---

# Data modeling validated by a data authority, with column-level traceability

## Context and Problem Statement

A data model designed without review or column-level traceability produces divergent definitions between teams, incomplete sensitivity classification, and a comprehension debt that silently accumulates. How can we guarantee that every data model deployed to production has been validated by a competent authority and remains traceable down to the column?

## Decision Drivers

* Semantic consistency of definitions across domains and teams
* Column↔business-rule traceability, a prerequisite for sensitive data classification
* Prevention of modeling debt (redundancies, ambiguities, integrity breaks)
* Applicability independent of the modeling paradigm in use

## Considered Options

* Mandatory modeling review by a data authority, dictionary traced at column level
* Free modeling by each team, with informal peer review
* Free modeling with no review, documentation after the fact if time permits

## Decision Outcome

Chosen option: "Mandatory review and column-level traceability", because this is the only option that produces enforceable validation evidence and a dictionary usable for sensitive data classification, regardless of the modeling paradigm in use.

### Consequences

* Good, because definitions are consistent across domains, reducing divergent interpretations.
* Good, because column-level traceability directly feeds the classification of personal and sensitive data.
* Bad, because the review adds a delay before any production deployment.
* Neutral, because it requires a living data dictionary that must be maintained over time.

### Confirmation

Derived controls: CTL-D16-01 (column↔business-rule traceability documented in the dictionary), CTL-D15-02 (data modeling review by the data authority tracked before production deployment). Expected evidence: signed review report and extract from the data dictionary. Scoring: compliant = review tracked and dictionary up to date; partial = only one of the two; non-compliant = neither review nor dictionary.

## Pros and Cons of the Options

### Mandatory review and column-level traceability

* Good, because maximum consistency and auditability.
* Bad, because ongoing governance cost to maintain the dictionary.

### Informal peer review

* Good, because faster, preserving team culture.
* Bad, because it depends on individual discipline; no evidence enforceable in an audit.

### After-the-fact documentation

* Good, because it adds no delay to production deployment.
* Bad, because "after the fact" in practice becomes "never"; modeling debt goes unmanaged.

## More Information

Instantiations: `profil:databricks-lakehouse` → schema review tooled through the technical catalog and declarative constraints; `profil:powerbi` → semantic model certification by a center of excellence before publication.
