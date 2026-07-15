---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "accessibility focal points, product design teams"
informed: "all product teams"
id: ADR0901
domain: "09"
invariant: true
standards: ["WCAG 2.2 — niveau AA (ensemble des critères de succès)", "EN 301 549 (exigences d'accessibilité pour les produits et services TIC)"]
derived_controls: [CTL-D11-01, CTL-D11-02, CTL-D11-03, CTL-D11-04]
profile_bindings: optional
---

# Enforceable Digital Accessibility (WCAG AA Baseline)

## Context and Problem Statement

Dimension D11 (UX & Accessibility) has carried eight controls since v1.1 of the corpus,
but none of them was attached to a published architecture decision: the accessibility
baseline existed in the audit tooling without ever having been decided at the governance
level. An interface that does not comply with a measurable baseline effectively excludes
some users and exposes the organization to a growing enforceability risk. How can we
guarantee that every exposed interface meets a measurable accessibility baseline, verified
both before and after release, regardless of the platform or framework used?

## Decision Drivers

* Enforceability: a measurable baseline, not an unverifiable declarative intent
* Coverage of recognized criteria (perceivable, operable, understandable, robust) without favoring any single one
* Verifiability through reproducible tooling, complemented by human review of what the tooling does not detect
* Technology neutrality: the baseline applies to every interface, regardless of the framework used

## Considered Options

* WCAG 2.2 level AA baseline measured through tooled audits and manual verification, with an enforceable remediation plan
* Unmeasured accessibility recommendations, left to each product team's judgment
* Level A compliance only (minimal baseline), without exhaustive contrast or keyboard navigation requirements

## Decision Outcome

Chosen option: "WCAG 2.2 AA baseline measured and complemented by manual verification",
because it is the only option that makes accessibility enforceable and continuously
verifiable — level A leaves essential criteria out of the baseline, and the absence of
measurement makes any declaration unverifiable.

### Consequences

* Good, because the accessibility baseline becomes measurable, enforceable, and tracked with a dated remediation plan.
* Good, because tooled audits and manual verification complement each other: each covers what the other does not detect.
* Bad, because remediating gaps found on an existing interface can represent a significant correction effort.
* Neutral, because a level of accessibility beyond the AA baseline (AAA) remains an overlay choice, not required by the core.

### Confirmation

Derived controls (existing, attached — no new control created): CTL-D11-01 (WCAG 2.2 AA
compliance measured through tooled audit, remediation plan per gap), CTL-D11-02 (journeys
fully operable by keyboard, with no focus trap, focus always visible), CTL-D11-03 (color
contrasts measured above the required thresholds on every representative screen),
CTL-D11-04 (interface adapted without loss of functionality to the target screen widths
and interaction modes). Expected evidence: dated accessibility audit report per criterion
+ keyboard navigation record + contrast measurement report + multi-device screenshots.
Scoring: compliant = all four controls compliant or a documented waiver; partial = gaps
with a dated remediation plan; non-compliant = no audit or a blocking gap with no plan.

## Pros and Cons of the Options

### WCAG 2.2 AA Baseline Measured + Manual Verification
* Good, because it is enforceable, measurable, and covers the blind spots of automated audits.
* Bad, because it requires recurring manual-verification skill and time.

### Unmeasured Recommendations
* Good, because no tooling constraint needs to be set up.
* Bad, because nothing is verifiable or enforceable; the actual level of accessibility remains unknown.

### Level A Compliance Only
* Good, because the baseline is quicker to reach than level AA.
* Bad, because it excludes essential criteria (contrast, keyboard) that level AA requires.

## More Information

Instantiations: generic measurement tooling — automated analysis integrated into the
pipeline, complemented by a periodic expert manual audit on critical journeys; specific
accessibility audit products may be selected per profile, a choice that is not the core's
responsibility. Pure attachment: the four controls already existed in D11 with no declared
`adr_source`; no control is created by this ADR.
