---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0206
domain: "02"
invariant: true
standards: ["RGPD — art. 32", "RGPD — art. 9", "ISO/IEC 27701:2019 — §6", "ISO/IEC 27002:2022 — 5.12"]
derived_controls: [CTL-D02-07, CTL-D04-01, CTL-D04-02, CTL-D04-04, CTL-D04-05, CTL-D04-08, CTL-D04-09, CTL-D10-09, CTL-D13-08, CTL-D14-04, CTL-D14-08, CTL-D15-04, CTL-D16-04]
---

# Classification and protection of personal/sensitive data

## Context and Problem Statement

Not all data deserves the same level of protection. Without explicit classification,
protection is either applied uniformly at the maximum level (disproportionate effort
on non-critical data), or — worse — insufficiently applied to personal or sensitive
data. How can we guarantee that each piece of data receives proportionate,
demonstrable protection?

## Decision Drivers

* Regulatory obligation to protect personal data in proportion to risk
* Prioritization of security effort on the assets that genuinely require it
* Traceability: demonstrating, data asset by data asset, the level chosen and its justification
* Portability: classification does not depend on any particular data store or technology

## Considered Options

* Explicit classification by levels, carried by each data asset, with protection measures associated per level
* Maximum uniform protection applied to all data without distinction
* No formal classification; protection left to the discretion of each project team

## Decision Outcome

Chosen option: "Explicit classification by levels", because it alone makes it
possible to demonstrate proportionate, traceable protection — a condition set by the
regulatory framework — while avoiding the extra cost of undifferentiated maximum
protection.

### Consequences

* Good, because every personal or sensitive piece of data receives proportionate measures, demonstrable in an audit.
* Good, because of a clear prioritization of effort (encryption, minimization, access control) on the assets that require it.
* Bad, because of a governance burden: every new data asset must be classified as soon as it is created.
* Neutral, because a designated authority must arbitrate ambiguous cases.

### Confirmation

Derived controls: CTL-D04-01 (documented, up-to-date classification for every data
asset), CTL-D04-02 (protection measures compliant with the declared level, verified by
sampling). Expected evidence: classification register + sample of technical measures
on assets classified as sensitive. Grid: compliant = up-to-date classification AND
measures compliant with the level; partial = up-to-date classification, incomplete
measures; non-compliant = absence of classification or absence of measures on a
sensitive piece of data.

## Pros and Cons of the Options

### Explicit classification by levels
* Good, because of proportionate, demonstrable protection, clear prioritization of effort.
* Bad, because of an ongoing governance burden with every asset creation.

### Maximum uniform protection
* Good, because of apparent simplicity: a single rule for everything.
* Bad, because of a massive extra cost, often bypassed as unrealistic at scale.

### No formal classification
* Good, because of no initial governance effort.
* Bad, because of unpredictable protection; inability to demonstrate compliance in an audit.

## More Information

Instantiations: `profil:azure` → Purview: classification labels + automatic discovery
of sensitive data; `profil:aws` → Macie: automated discovery and classification. The
classification scheme (levels, criteria) is an instantiable tenant pack; the
proportionality principle remains core.
