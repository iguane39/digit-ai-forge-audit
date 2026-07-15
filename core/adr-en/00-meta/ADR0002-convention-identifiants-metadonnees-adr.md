---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architects"
informed: "all product teams"
id: ADR0002
domain: "00"
invariant: false
standards: ["MADR 4.0.0 — en-tête et gabarit", "docs-as-code (Docs Like Code)"]
derived_controls: [CTL-D13-03]
---

# Convention for Decision Identifiers and Metadata

## Context and Problem Statement

Without a stable identifier scheme or stable metadata, cross-references between
decisions, controls, and profiles become fragile: accidental renames, identifier
collisions, orphaned ADRs that no tool can relate back to their context. How can each
decision be identified and described unambiguously, in a way usable both by humans and by
automated verification tools?

## Decision Drivers

* Uniqueness and stability of the identifier over the entire lifetime of the corpus
* Automatable traceability to derived controls and audit dimensions
* Human readability: the governance domain must be visible in the identifier
* Compatibility with a format checker run continuously

## Considered Options

* Domain-coded identifier (`ADR<domaine><séquence>`) combined with mandatory structured frontmatter
* Global sequential identifier, with no visible link to the governance domain
* Natural-language file title as the sole identifier, with no dedicated scheme

## Decision Outcome

Chosen option: "Domain-coded identifier + structured frontmatter", because it makes the
domain and rank readable without an external register, remains stable even as the corpus
grows, and provides the unique anchor that derived controls and profiles depend on.

### Consequences

* Good, because every cross-reference (control, profile, coverage matrix) targets a stable, self-descriptive identifier.
* Good, because an automated checker can reject a malformed identifier or incomplete frontmatter before publication.
* Bad, because an ADR that later changes governance domain requires a rename, mitigated by an alias table.
* Neutral, because sequential numbering inherited from a prior corpus becomes a simple legacy alias, not a deletion.

### Confirmation

Derived controls: CTL-D13-03 (identifier conforms to the domain-sequence scheme, unique
across the register), CTL-D13-04 (complete frontmatter: status, date, decision-makers,
identifier, domain, standards, derived controls). Expected evidence: format-checker output
across the entire `adr/` folder. Grading: compliant = 0 anomalies detected; partial =
minor anomalies limited to non-invariant ADRs; non-compliant = duplicate identifier or
incomplete frontmatter on an invariant ADR.

## Pros and Cons of the Options

### Domain-coded identifier + structured frontmatter
* Good, because it is self-descriptive, stable, and automatically verifiable.
* Bad, because a later domain change requires a rename, handled via alias.

### Global sequential identifier
* Good, because it is trivial to assign, with no ambiguity of rank.
* Bad, because there is no domain readability without an up-to-date external register.

### Natural-language title without a scheme
* Good, because it allows immediate drafting, with no convention overhead.
* Bad, because no reliable cross-referencing or automated verification is possible.

## More Information

Profile instantiations: `profil:git-platform` → format checker run in continuous
integration on every change proposal touching `adr/**`; an alias table (`adr.aliases`)
carried by the overlay absorbs identifiers from a legacy corpus.
