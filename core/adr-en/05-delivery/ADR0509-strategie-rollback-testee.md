---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "operations teams, {roles.change_board}"
informed: "product teams"
id: ADR0509
domain: "05"
invariant: true
standards: ["DORA (Accelerate) — Time to Restore Service (MTTR)", "SRE (Google) — gestion des incidents", "ISO/IEC 27002:2022 — 5.30"]
derived_controls: [CTL-D01-05, CTL-D09-07, CTL-D12-04]
profile_bindings: optional
---

# Tested rollback strategy

## Context and Problem Statement

The reference corpus documents how to deploy and promote a version, but no equivalent decision covered returning to a known prior state when a delivered version proves faulty — a gap that exposes the organization to the worst-case scenario: discovering during a production incident that no return path has ever been exercised. How can we guarantee that a rollback always remains possible and verified before it is needed?

## Decision Drivers

* Reducing service restoration time (MTTR) in the event of a faulty version
* Verified confidence: a rollback that has never been exercised is only an unproven hypothesis
* Data consistency during and after the rollback
* Applicability of the principle to any type of artifact and hosting provider

## Considered Options

* Rollback strategy defined, tooled through the pipeline, and periodically tested
* Rollback theoretically possible, never exercised before a real incident
* Fix-forward only, with no rollback mechanism

## Decision Outcome

Chosen option: "Periodically tested strategy", because an unexercised mechanism statistically fails at the worst possible moment; only a periodic exercise, triggered as in a real situation, turns rollback from a hypothesis into a verified capability bounded in time — closing what has so far been the most critical blind spot in the delivery corpus.

### Consequences

* Good, because the restoration time during a real incident is measured rather than estimated in advance.
* Good, because data migrations incompatible with a rollback are identified before the incident.
* Bad, because the periodic exercise consumes dedicated engineering time.
* Neutral, because certain changes (destructive migrations) require compensation rather than a strict rollback.

### Confirmation

Derived controls: CTL-D09-11 (rollback triggerable from the pipeline with no manual intervention on the target), CTL-D12-03 (rollback exercise documented and replayed at a defined frequency), CTL-D12-04 (restoration time declared and measured at each exercise or real incident). Evidence: report of the latest exercise + measured restoration time obtained. Rating: compliant = exercise performed within the defined period and objective met; partial = exercise performed but objective exceeded; non-compliant = no exercise observed.

## Pros and Cons of the Options

### Periodically tested strategy
* Good, because it provides a verified capability, measured MTTR, and migration blind spots detected in advance.
* Bad, because of the recurring exercise cost to budget for.

### Theoretical rollback, never exercised
* Good, because it costs nothing as long as no incident occurs.
* Bad, because the first real execution happens under pressure, with no guarantee of success.

### Fix-forward only
* Good, because it avoids the complexity of compensating for a rollback on data.
* Bad, because restoration time depends on a fix that must be designed under urgency.

## More Information

Instantiations: `profil:azure` → switch to the previous slot or revision triggered by the managed pipeline. This decision closes a gap in the reference profile: no existing ADR there covered rollback, even though incident restoration (D12) depends directly on it.
