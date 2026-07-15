---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0203
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 5.18", "NIST SP 800-53 — famille AC (AC-2/AC-3)", "OWASP ASVS 5.0 — V4.1", "SAML 2.0 / OIDC Federation (spécifications ouvertes)"]
derived_controls: [CTL-D03-07]
---

# Federated external access

## Context and Problem Statement

Partners, service providers, and external contributors need occasional access. The
most common shortcut — creating an ad hoc local account per team — produces access
with no expiry, invisible at the central level, and forgotten once the assignment is
over. How can we grant the necessary external access without creating this
ungoverned surface?

## Decision Drivers

* Centralized visibility of all external access (who, what scope, what expiry)
* Application of least privilege from the moment of grant, with no local exception
* Automatic revocation at expiry: no forgotten account
* Consistency with the central IdP (ADR0202), with no parallel identity store

## Considered Options

* Federation of external identities via the same identity control point, with limited scope and duration
* Local accounts created case by case by each application team
* A single generic account shared among all external contributors

## Decision Outcome

Chosen option: "Federation of external identities", because it alone maintains a
single identity store, makes every external access visible and time-bounded, and
applies least privilege without depending on each team's discipline.

### Consequences

* Good, because of an exhaustive inventory of active external access, viewable at any time.
* Good, because of automatic expiry: no external access silently outlives its assignment.
* Bad, because an invitation process (approval, scope, duration) must be defined and tooled.
* Neutral, because of a dependency on the same identity foundation as internal access.

### Confirmation

Derived control: CTL-D03-07 (federated external access, no local account outside a
waiver procedure — review mode). Expected evidence: export of active external
identities with declared scope and expiry. Grid: compliant = 100% of external access
federated and time-bounded; partial = federated without systematic expiry;
non-compliant = local or shared accounts detected.

## Pros and Cons of the Options

### Federation of external identities
* Good, because of a single store, visible and bounded access, least privilege by default.
* Bad, because of an invitation process to define and tool.

### Local accounts case by case
* Good, because of quick local setup, no coordination required.
* Bad, because of central invisibility, frequent oversight, expiry rarely enforced.

### Shared generic account
* Good, because of an apparently zero management cost.
* Bad, because of no individual accountability; revocation impossible without breaking everything.

## More Information

Instantiations: `profil:azure` → B2B guest identities with conditional access and an
expiration date; `profil:aws` → identities federated via an external IdP, roles with
temporary scope. Generalizes the use of guest identities already present in the
reference profile.
