---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, development teams"
informed: "all product teams"
id: ADR0207
domain: "02"
invariant: true
standards: ["ISO/IEC 27002:2022 — 5.15/5.18", "OWASP ASVS 5.0 — V8.2.1/V8.2.2/V8.3.1 — 4.0.3 V4.1/V4.2 (V4.1.5 déplacée en V16.5.3, V4.2.2 en V3.5.1, V4.1.2 supprimée)", "NIST SP 800-53 — AC-2(j)"]
derived_controls: [CTL-D03-05, CTL-D04-06, CTL-D12-08]
---

# RBAC: role-based authorization, periodic access review

## Context and Problem Statement

Without a formal authorization model, rights accumulate from individual requests over
time, rarely revoked, until they converge toward a de facto excessive privilege for
everyone. How can we keep an authorization model that is readable, proportionate, and
whose fidelity to actual need remains demonstrable over time?

## Decision Drivers

* Readability of the authorization model (who can do what, at a glance)
* Prevention of silent privilege accumulation (permission creep)
* Periodic proof that the granted rights still correspond to an actual need
* Uniform applicability, regardless of the system carrying the rights

## Considered Options

* Role-based authorization (RBAC) with mandatory periodic review of granted access
* Ad hoc assignment of individual rights, with no formal role model
* Role-based authorization defined once, with no periodic review process

## Decision Outcome

Chosen option: "RBAC with periodic review", because the role-based model makes
authorization readable and auditable by construction, and only the periodic review
guarantees its fidelity to actual need over time — a model without review degrades
silently.

### Consequences

* Good, because of a clear, stable map of rights, understandable without archaeology through tickets.
* Good, because the periodic review detects and corrects deviations before they become an incident.
* Bad, because of a recurring governance burden to organize and document each review.
* Neutral, because role granularity remains a trade-off specific to each organization.

### Confirmation

Derived control: CTL-D03-05 (documented role-based authorization; access review
≤ 6 months — declarative + review mode). Expected evidence: role/rights map + signed
minutes of the last periodic review. Grid: compliant = up-to-date map AND review
≤ 6 months; partial = up-to-date map without a recent review; non-compliant = absence
of a role model or dominant ad hoc individual rights.

## Pros and Cons of the Options

### RBAC with periodic review
* Good, because of readability, auditability, fidelity maintained over time.
* Bad, because of a recurring governance burden.

### Ad hoc individual rights
* Good, because of maximum case-by-case flexibility.
* Bad, because of illegibility at scale, undetected privilege accumulation.

### RBAC without periodic review
* Good, because of initial readability of the role model.
* Bad, because of silent degradation: obsolete roles and orphaned rights go undetected.

## More Information

Instantiations: `profil:azure` → native RBAC roles + scheduled access reviews
(Entra ID); `profil:aws` → IAM roles + IAM Access Analyzer for review. Generalizes
the role-based authorization schemes already present in the reference profile.
