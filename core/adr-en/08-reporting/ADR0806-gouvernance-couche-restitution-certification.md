---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "Data Owners, data architects"
informed: "product teams"
id: ADR0806
domain: "08"
invariant: true
standards: ["DMBOK2 (gouvernance des données, métadonnées)", "data literacy / certification des contenus BI"]
derived_controls: [CTL-D05-15]
---

# Governance of the Reporting Layer (Report Certification)

## Context and Problem Statement

When any report can be published with no distinction between an exploratory analysis and
an official report committing the organization, users no longer know which one to trust
among the competing versions in circulation. This topic is not covered by any existing
decision: publishing a report is subject to no review and no status. How can we
distinguish and govern authoritative reports from those that remain exploratory?

## Decision Drivers

* Clear distinction, visible to the end user, between a certified report and an exploratory one
* Review and named accountability before certifying a report as the official reference
* Reduction of the proliferation of competing reports answering the same business question
* User trust in the figures they consume to make decisions

## Considered Options

* Formal certification cycle for official reports, with a visible status and named review
* Informal naming convention signaling reference reports, with no review
* No distinction: every published report has the same apparent status

## Decision Outcome

Chosen option: "Formal certification cycle", because it is the only one that guarantees a
user can unambiguously distinguish a reviewed report that commits the organization from an
exploratory one — the other two options leave this distinction resting on an unverified
convention or on the total absence of any signal.

### Consequences

* Good, because a user immediately identifies whether the report being consulted is authoritative.
* Good, because the proliferation of competing reports becomes visible and manageable.
* Bad, because a review process and named accountability must be operated continuously.
* Neutral, because existing reports must be sorted between candidates and exploratory ones.

### Confirmation

Derived controls: CTL-D05-09 (certified report reviewed by a named authority — review
mode), CTL-D11-02 (certification status visible to the end user on every published report
— automatic mode). Expected evidence: registry of certified reports + capture of the
displayed status. Scoring: compliant = reference report certified and status visible;
partial = certification exists but is not systematically displayed; non-compliant = no
distinction between certified and exploratory.

## Pros and Cons of the Options

### Formal Certification Cycle
* Good, because of the reliable distinction, manageable proliferation, and user trust.
* Bad, because of the review process that must be operated and maintained over time.

### Informal Naming Convention
* Good, because the setup cost is minimal.
* Bad, because the convention is unverified, can be bypassed, and no real review sits behind the signal.

### No Status Distinction
* Good, because there is no friction to publishing a report.
* Bad, because the user can never know which of the competing reports is authoritative.

## More Information

Instantiations: `profil:powerbi` → certified workspace with a visible trust badge and a
named owner; other reporting profiles → equivalent certification mechanism. Fills a gap in
the reference profile: no existing decision governed report certification.
