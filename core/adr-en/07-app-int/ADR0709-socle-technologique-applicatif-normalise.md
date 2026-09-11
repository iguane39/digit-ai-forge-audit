---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "product teams, {roles.remediation_team}, {roles.security_officer}"
informed: "all product teams"
id: ADR0709
domain: "07"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D01-16]
---

# Standardized application technology foundation

## Context and Problem Statement

Every project picks its languages and application frameworks at start-up, based on the skills available that day. A few years later, the organization runs an estate where each application requires distinct skills: taking over maintenance means hiring, fixing a vulnerability must be replayed in as many pipelines as there are technologies, and sharing internal libraries becomes impossible. How can we guarantee that an application stays maintainable by people other than those who wrote it?

## Decision Drivers

* Transferability: an application can be taken over with the skills already present
* Sharing of cross-cutting tooling (logging, authentication, vulnerability scanning)
* A vulnerability fix applicable to the whole estate, not to one application
* Freedom to innovate preserved where justified, but through a traced waiver

## Considered Options

* A short list of standardized languages and application frameworks, kept current and versioned, any deviation going through a justified and dated waiver
* Full freedom of technology choice per team
* A single technology imposed with no waiver possible

## Decision Outcome

Chosen option: "Short standardized list with traced waiver", because it is the only option that protects transferability without forbidding the exception: the estate stays maintainable by a bounded, cross-cut tooled skill pool, while a genuinely specific need remains possible — at the price of a written, dated decision reviewed at a deadline.

### Consequences

* Good, because an application can be taken over without dedicated hiring or specific upskilling.
* Good, because cross-cutting tooling is not reimplemented per technology.
* Bad, because a technology better suited to a precise case is paid for with a waiver to defend.
* Neutral, because the list must live: frozen, it ages and pushes teams to bypass it.

### Confirmation

Derived control: CTL-D01-16 (the languages and application frameworks used by the application appear in the standardized list in force, any deviation carrying a justified, dated waiver with a deadline — automatic + review mode). Expected evidence: versioned standardized list, inventory of the technologies actually used by the application (dependency manifests, build files), dated waivers where applicable. Scoring: compliant = all technologies used are in the list, or covered by a waiver still valid; partial = waiver present but with no deadline; non-compliant = technology outside the list with no waiver.

## Pros and Cons of the Options

### Short standardized list with waiver

* Good, because transferability and sharing, without closing the door to a justified exception.
* Bad, because the list must be maintained and waivers processed.

### Full freedom per team

* Good, because each team optimizes for its immediate use case.
* Bad, because the estate becomes a set of islands; maintenance depends on individuals.

### Single technology with no waiver

* Good, because maximum sharing of tooling and skills.
* Bad, because ill-suited to atypical cases, it gets bypassed silently rather than discussed.

## More Information

Complements ADR0104 (platform engineering model) on the technology side and ADR0209 (supply chain), whose tooling assumes a bounded number of dependency ecosystems. Instantiations: the list itself is organization data, never core — it lives in the tenant overlay, dated and sourced.

**To be completed** (`a_completer: true`): the reference source this decision comes from cites **no external standard** — the `standards` field stays empty and must be filled in before any enforcement. Also to be completed: the waiver review process and its validity period, not provided by the source.
