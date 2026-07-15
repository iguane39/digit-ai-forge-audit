---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architects, development teams"
informed: "all product teams"
id: ADR0005
domain: "00"
invariant: true
standards: ["docs-as-code (Docs Like Code)", "DORA (Accelerate) — Accelerate (gestion de configuration versionnée)"]
derived_controls: [CTL-D00-01, CTL-D00-08, CTL-D01-07, CTL-D13-01, CTL-D13-09]
---

# Docs-as-Code Decision Register, Published and Versioned

## Context and Problem Statement

Architecture decisions scattered across multiple tools (an isolated wiki, tickets,
unversioned office documents) lose their history, escape peer review, and become
unverifiable during an audit. How can we guarantee that all enacted decisions remain a
single, versioned, published corpus that is accessible to all stakeholders, technical and
non-technical alike?

## Decision Drivers

* A single source of truth for all enacted decisions, with no duplication or forking
* Complete, tamper-proof history: who proposed, reviewed, accepted, and when
* Publication accessible to all teams, without depending on an imposed proprietary tool
* Peer review integrated into the same flow used for code

## Considered Options

* Docs-as-code register: files versioned in the repository, reviewed via change proposal, published automatically
* Collaborative wiki independent of the code repository, freely edited with no mandatory review
* Office documents shared on a generic collaborative storage space

## Decision Outcome

Chosen option: "Docs-as-code register", because it is the only option that unifies
versioning, peer review, and publication into a single flow already mastered by technical
teams, without depending on a proprietary tool or on unverifiable individual discipline.

### Consequences

* Good, because the version history is authoritative: no decision can be deleted or rewritten without leaving a trace.
* Good, because review via change proposal applies the same rigor to decisions as is applied to code.
* Bad, because access for non-technical stakeholders requires a publication step (site or documentation generation).
* Neutral, because the choice of publication tool (static site, generated wiki) remains a profile parameter.

### Confirmation

Derived controls: CTL-D13-06 (register published, accessible, synchronized with the
source repository), CTL-D13-07 (version history intact — no rewriting of an accepted
ADR). Expected evidence: a capture of the published register and the timestamp of its
synchronization with the repository. Grading: compliant = register published and
synchronized within less than 24 hours; partial = register published with a documented
synchronization latency; non-compliant = register missing or out of sync without
detection.

## Pros and Cons of the Options

### Docs-as-code register
* Good, because versioning, review, and publication are unified into a single flow.
* Bad, because publishing to a non-technical audience requires a dedicated step.

### Independent collaborative wiki
* Good, because it is immediately accessible to a non-technical audience.
* Bad, because there is no guarantee of review or of a tamper-proof history.

### Shared office documents
* Good, because tooling is minimal and no technical skill is required.
* Bad, because the history is fragile, review is absent, and versions drift apart quickly.

## More Information

Profile instantiations: `profil:git-platform` → automated publication via a pipeline to a
static site generated from `adr/**` on every merge; `profil:wiki-integre` → read-only
mirror in the repository platform's wiki.
