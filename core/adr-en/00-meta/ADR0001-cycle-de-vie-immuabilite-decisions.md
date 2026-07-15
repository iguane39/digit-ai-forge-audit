---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architects, ADR domain leads"
informed: "all product teams"
id: ADR0001
domain: "00"
invariant: true
standards: ["MADR 4.0.0 — cycle de vie du statut", "ISO/IEC/IEEE 42010:2022 (rationale de la description d'architecture)"]
derived_controls: [CTL-D00-03, CTL-D01-10, CTL-D13-03]
---

# Lifecycle and Immutability of Architecture Decisions

## Context and Problem Statement

Without an explicit lifecycle rule, architecture decisions accumulate in inconsistent
states: drafts that are never finalized, decisions retroactively modified without a
trace, statuses that contradict one another across domains. Such a corpus can no longer
serve as audit evidence or as a shared source of truth. How can we guarantee that an
enacted decision remains a stable reference over time, while still allowing its evolution
to be tracked?

## Decision Drivers

* An enacted decision must remain binding and verifiable indefinitely (audit evidence)
* Any evolution must be visible: a new decision, never a silent rewrite
* Lifecycle consistency across all domains and all profiles of the corpus
* Native compatibility with docs-as-code tooling (review, history, publication)

## Considered Options

* Finite-status lifecycle (proposed → accepted → deprecated/superseded), body immutable after acceptance
* Free editing of the ADR body after acceptance, with a changelog at the bottom of the file
* No formal lifecycle: status left to each team's discretion

## Decision Outcome

Chosen option: "Finite-status lifecycle with post-acceptance immutability", because only
this option prevents the retroactive rewriting of decision history while still allowing
evolution through explicit replacement ("superseded by") — a necessary condition for an
ADR to stand as binding audit evidence.

### Consequences

* Good, because an "accepted" decision can no longer be modified in substance: any evolution creates a new ADR that explicitly supersedes it.
* Good, because the repository's version history alone is enough to reconstruct the complete chronology of decisions, with no additional tooling.
* Bad, because a minor erratum (typo, dead link) still requires a new ADR or an explicit, documented exception rule.
* Neutral, because status discipline must be enforced through review (gate), not merely through the stated convention.

### Confirmation

Derived controls: CTL-D13-01 (no ADR with status "accepted" modified outside the
status/succession-link field — verified via history diff), CTL-D13-02 (status transition
tracked by a distinct review and commit). Expected evidence: the ADR's version history
and, where applicable, the linked successor ADR. Grading: compliant = no substantive
post-acceptance modification detected; partial = minor modification documented as an
exception; non-compliant = untracked substantive rewrite.

## Pros and Cons of the Options

### Finite-status lifecycle, post-acceptance immutability
* Good, because the decision history is tamper-proof, providing direct audit evidence.
* Bad, because a minor erratum requires a new ADR or a documented exception.

### Free editing + changelog
* Good, because it offers flexibility to correct a decision without multiplying files.
* Bad, because the changelog at the bottom of the file is, in practice, optional: nothing prevents an unflagged rewrite.

### No formal lifecycle
* Good, because there is no additional governance overhead.
* Bad, because statuses become inconsistent across domains, and decisions are not binding in an audit.

## More Information

Profile instantiations: `profil:git-platform` → immutability verified through a branch
protection rule and mandatory review on the `adr/` folder; the generic format checker
rejects any status transition that does not conform to the adopted lifecycle.
