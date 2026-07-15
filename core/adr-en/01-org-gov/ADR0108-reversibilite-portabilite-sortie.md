---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.remediation_team}, architects, {roles.data_roles.owner}"
informed: "all product teams"
id: ADR0108
domain: "01"
invariant: true
standards: ["ISO/IEC 25010:2023 — portabilité (adaptabilité, capacité à être installé, remplaçabilité)", "ISO/IEC 19941:2017 (interopérabilité et portabilité en informatique en nuage)"]
derived_controls: [CTL-D01-15]
profile_bindings: optional
---

# Exit Reversibility and Portability

## Context and Problem Statement

A service or data asset that cannot be extracted into a usable format anywhere other than
its original platform creates an unmanaged dependency: exiting becomes a crisis
negotiation rather than an on-demand capability. The corpus currently carries no control
over exit portability — the Portability characteristic (ISO/IEC 25010) is not covered by
any existing control. How can we guarantee that every significant service and dataset can
be extracted, in a usable format, independently of the platform or hosting provider
chosen?

## Decision Drivers

* Management of dependency (lock-in) risk, whether technical, contractual, or organizational
* Portability verified through an actual export test, not through a clause that has never been exercised
* A bounded, documented exit timeline, rather than one discovered only at termination
* Neutrality with respect to the hosting provider, the vendor, and the form of service chosen

## Considered Options

* Reversibility plan documented per service/asset, with export tested periodically
* Contractual reversibility clause, with an export test never exercised
* No reversibility requirement declared; exit handled case by case

## Decision Outcome

Chosen option: "Documented and tested reversibility plan", because it is the only option
that makes exit portability verifiable before it is needed — a clause that has never been
exercised, or the total absence of a requirement, only reveal their gaps once the exit is
already urgent.

### Consequences

* Good, because an exit or a change of hosting provider becomes a plannable project again, not a crisis managed under pressure.
* Good, because the usable export format is verified before it is needed, through an actual test rather than a dormant clause.
* Bad, because keeping a reversibility plan up to date and testing it periodically is a recurring effort with no immediate business value.
* Neutral, because the scope of services deemed significant (and therefore subject to the plan) remains an overlay parameter.

### Confirmation

Derived controls: CTL-D01-15 (every significant service and data asset has a documented
reversibility plan — scope, export format, timeline — and an export actually tested at
least annually, in a format usable outside the original platform — review mode). Expected
evidence: a dated reversibility plan per service/asset, plus a report on the most recent
export test (or import into a third-party environment) with a finding of usability.
Grading: compliant = plan documented AND successful export test ≤ 12 months for all
significant services; partial = plan documented without a recent test; non-compliant = no
reversibility plan.

## Pros and Cons of the Options

### Documented and tested reversibility plan
* Good, because portability is verified before it is needed, through an actual test.
* Bad, because it requires a recurring maintenance and testing effort to be budgeted.

### Contractual clause with no test exercised
* Good, because setup cost is minimal (contractual negotiation alone).
* Bad, because the clause guarantees nothing as long as it has never been exercised.

### No requirement declared
* Good, because there is no effort or cost in the short term.
* Bad, because exit becomes a crisis negotiation, with neither timeline nor format known in advance.

## More Information

Profile instantiations: `profil:azure` → scheduled export of configurations and data into
open formats, with periodic import testing in a third-party environment; `profil:aws` →
equivalent export via native backup/export mechanisms, tested on the same cycle. Distinct
from a continuity plan (ADR0611, availability): this ADR covers voluntary or forced exit
to a third party, not disaster recovery.
