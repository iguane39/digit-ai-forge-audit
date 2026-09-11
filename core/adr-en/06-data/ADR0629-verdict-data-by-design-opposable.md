---
status: "proposed"
date: 2026-09-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.data_roles.owner}, {roles.compliance_process}, product teams"
informed: "all product teams"
id: ADR0629
domain: "06"
invariant: false
a_completer: true
standards: []
derived_controls: [CTL-D15-11]
---

# Enforceable data-by-design verdict before go-live

## Context and Problem Statement

A data maturity assessment produces a score. A score, on its own, decides nothing: it gets commented, relativized, and go-live happens anyway. As long as the assessment does not conclude with an enforceable verdict, issued by a named authority before the switch, it documents a state without ever arbitrating it. How can we guarantee that a data-by-design assessment produces a decision that binds, and not a grade that informs?

## Decision Drivers

* Verdict issued **before** go-live, not observed afterwards
* Fatal criteria distinct from the score: a fatal shortcoming is not offset by a good average
* Named authority, dated decision, written reason — including for a conditional approval
* Auditability: the verdict and its reason can be re-read in the go-live file

## Considered Options

* An enforceable three-valued verdict (approval, conditional approval with dated reservations, refusal), issued by a named authority before go-live, motivated by the score **and** by the fatal criteria
* A maturity score published with no verdict, the go-live decision remaining implicit
* A verdict mechanically derived from a score threshold, with no fatal criteria and no authority

## Decision Outcome

Chosen option: "An enforceable three-valued verdict issued before go-live", because it is the only option that separates what the score measures from what the organization decides: the score motivates, the fatal criteria block independently of it, and the named authority takes a dated decision the audit can re-read. Conditional approval exists so that nuance is not paid for with tacit approval.

### Consequences

* Good, because no go-live can invoke an assessment that concluded nothing.
* Good, because a fatal shortcoming stays blocking, whatever the average obtained.
* Bad, because it adds a gate to the go-live path, with its delay.
* Neutral, because reservations must be tracked: with no deadline, a conditional approval becomes an approval.

### Confirmation

Derived control: CTL-D15-11 (the project's data-by-design assessment concludes with a dated verdict — approval, conditional approval with deadlines, or refusal — issued by a named authority before go-live, and motivated by the score and by the fatal criteria — review mode). Expected evidence: assessment record with score, statement of the fatal criteria, dated and signed verdict, reservations with deadlines. Scoring: compliant = dated verdict prior to go-live, motivated, reservations with deadlines; partial = verdict issued but unmotivated, or reservations without deadlines; non-compliant = no verdict, or a verdict later than go-live.

## Pros and Cons of the Options

### Enforceable three-valued verdict

* Good, because it decides, binds, and can be re-read; fatal criteria stay independent of the score.
* Bad, because of the cost of one more gate before the switch.

### Score published with no verdict

* Good, because no delay added to the go-live path.
* Bad, because no decision: the assessment informs and arbitrates nothing.

### Verdict derived from a score threshold

* Good, because entirely mechanical, no subjectivity.
* Bad, because a fatal shortcoming is offset by points earned elsewhere; nobody owns the decision.

## More Information

Third part of the triptych opened by ADR0627 (applicability scope): the scope says who is assessed, the computation says what the assessment is worth, this verdict says what it decides. Articulates with the decision gate of the audit reference framework (`gate1b`), of which it is the equivalent on the data side alone.

**To be completed** (`a_completer: true`): the reference source this decision comes from cites **no external standard** — the `standards` field stays empty and must be filled in before any enforcement. Also to be completed: the list of fatal criteria and the score threshold below which refusal is automatic, not provided by the source; as well as the ADR for the "computation" part (not cited by the source, therefore not created — it is not invented).
