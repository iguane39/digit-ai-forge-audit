---
status: "proposed"
date: 2026-07-12
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, legal and compliance teams"
informed: "all product teams"
id: ADR0213
domain: "02"
invariant: false
standards: ["RGPD — art. 33-34 (notification des violations de données à caractère personnel)"]
derived_controls: [CTL-D04-12]
---

# Personal data breach notification

## Context and Problem Statement

The corpus already governs the classification of personal data (ADR0206) and, once a
security incident is contained, its evidence and post-mortem (ADR0210) — but no
decision requires external notification of a personal data breach when the
applicable regulatory framework requires it. Without a dedicated procedure, a
deadline that is often short — counted from the moment the breach becomes known, not
its full confirmation — risks being missed for lack of a named role and a
pre-drafted template. How can we guarantee notification, within the deadlines set by
the applicable regulatory framework, to the competent authority and, if required, to
the data subjects concerned?

## Decision Drivers

* A notification deadline that is often short, triggered as soon as the breach becomes known, not upon its full confirmation
* Distinction between notification to the supervisory authority and notification to the data subjects concerned, at different thresholds
* Continuity with the evidence chain of the security incident already contained (ADR0210)
* Applicability conditioned on the tenant's regulatory framework: not all organizations are subject to it

## Considered Options

* Dedicated notification procedure (named role, pre-drafted template, deadline contracted from the moment the breach becomes known), activated by the regulatory framework applicable to the tenant
* Notification handled case by case by the legal authority consulted after the incident, with no procedure or template prepared in advance
* No procedure: external notification is considered only upon the explicit request of a supervisory authority

## Decision Outcome

Chosen option: "Dedicated, conditional notification procedure", the only option that
meets a short deadline counted from the moment the breach becomes known, thanks to a
named role and a template prepared in advance, while remaining neutral on the
jurisdiction of application.

### Consequences

* Good, because the notification deadline becomes achievable even when counted in hours, thanks to a template and a role prepared in advance.
* Good, because notification relies on the same evidence chain as the incident response (ADR0210), with no after-the-fact reconstruction.
* Bad, because a notification template and a named role must be kept up to date even in the absence of a breach.
* Neutral, because the actual triggering of the obligation depends on the regulatory framework applicable to the tenant, to be qualified case by case.

### Confirmation

Derived control: CTL-D04-12 (documented data breach notification procedure — named
role, pre-drafted template, deadline contracted from the moment the breach becomes
known — activated whenever the applicable regulatory framework requires it — review
mode). Evidence: up-to-date procedure + template +, where applicable, a trace of the
last notification made within the deadline. Grid: compliant = up-to-date procedure
AND deadline met; partial = procedure never exercised or tested; non-compliant =
absence of a procedure although the framework requires it.

## Pros and Cons of the Options

### Dedicated, conditional procedure
* Good, because of an achievable deadline, a named role, backed by the incident's evidence chain.
* Bad, because of a template and role to keep up to date even without a breach to notify.

### Case-by-case handling by the legal authority
* Good, because of no procedure to maintain in the absence of a breach.
* Bad, because a short deadline is hard to meet without a template or role prepared in advance.

### Notification only upon a supervisory authority's request
* Good, because of zero effort in the absence of an external request.
* Bad, because it contravenes the regulatory framework's proactive notification obligation when it applies.

## More Information

Instantiations: `profil:ue` (RGPD, art. 33-34) → notification to the supervisory
authority within 72 hours and to the data subjects concerned if there is a high risk;
other profiles → deadline and recipients set by the local regulatory framework, or
the control is not applicable in its absence. Distinct from ADR0210 (internal
containment and evidence): this ADR covers the external obligation. Gap closed: RGPD
art. 33-34, 0 occurrences of "notification"/"breach" among the 150 controls
(EXTENSION-CORPUS.md §2).
