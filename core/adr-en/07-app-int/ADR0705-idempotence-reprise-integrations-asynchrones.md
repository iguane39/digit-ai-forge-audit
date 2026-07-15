---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0705
domain: "07"
invariant: false
standards: ["EIP — Enterprise Integration Patterns (Idempotent Receiver, Dead Letter Channel)", "ISO/IEC 25010 (fiabilité)"]
derived_controls: [CTL-D06-01]
---

# Idempotency and Recovery of Asynchronous Integrations

## Context and Problem Statement

An asynchronous integration (message queue, event notification, deferred task) can deliver
a message more than once, fail partially, or be replayed after an incident. Without an
idempotency guarantee, a replay or duplicate produces a duplicated effect (double payment,
double creation). How can we guarantee that an asynchronous integration can be received
multiple times without side effects?

## Decision Drivers

* No duplication of business effect in case of multiple delivery of the same message
* Recovery possible after an incident without case-by-case manual intervention
* Traceability of the processing state of each message (processed, in progress, failed)
* Isolation of repeatedly failing messages so as not to block the healthy flow

## Considered Options

* Idempotent processing with a unique message identifier and a dedicated dead-letter queue
* Best-effort processing, with no idempotency guarantee or dead-letter queue
* Manual after-the-fact deduplication upon anomaly detection

## Decision Outcome

Chosen option: "Idempotent processing with a unique identifier and a dead-letter queue",
because it is the only option that neutralizes the effect of a duplicate delivery by
design and enables automated recovery after an incident, regardless of the underlying
messaging mechanism.

### Consequences

* Good, because a message delivered multiple times produces only a single business effect.
* Good, because repeatedly failing messages are isolated and replayable without blocking the healthy flow.
* Bad, because each process must maintain a deduplication state (design cost).
* Neutral, because a retry policy (delay, count) must be defined per integration.

### Confirmation

Derived controls: CTL-D01-05 (unique message identifier and idempotency check documented
per integration — review mode), CTL-D06-01 (bounded retry policy and active dead-letter
queue — automatic mode). Expected evidence: idempotency design per integration +
dead-letter queue configuration. Scoring: compliant = idempotency demonstrated and
dead-letter queue active; partial = idempotency demonstrated without a dead-letter queue;
non-compliant = no idempotency guarantee.

## Pros and Cons of the Options

### Idempotent Processing + Dead-Letter Queue
* Good, because it neutralizes duplicates, enables automated recovery, and isolates failures.
* Bad, because designing and storing the deduplication state is left to the integration.

### Best-Effort Processing With No Guarantee
* Good, because it is the simplest and fastest implementation.
* Bad, because a duplicate or lost message occurs at the slightest incident, undetected.

### Manual After-the-Fact Deduplication
* Good, because there is no upfront design effort.
* Bad, because detection is late, corrective, and cannot be industrialized at scale.

## More Information

Instantiations: `profil:azure` → managed message bus with native duplicate detection and
dead-letter queue; other profiles → equivalent message broker. The integration pattern
(idempotent receiver, dead-letter channel) remains an open standard, independent of the
broker chosen.
