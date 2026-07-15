<!-- AuditCore template v1 — M3 · report verification/correction prompt -->
# Verification Prompt — Report Format Check ({{tenant.name}})

> **Usage**: after producing `rapport-data.json` (conduct prompt, phase 3), run a corrective
> loop until releasable. To be executed by the auditor agent or a dedicated agent.

## Loop (until exit 0)

1. Run: `node verifier-rapport-standalone.mjs rapport-data.json`
2. **Exit 0 → STOP**: the report is releasable; record the verifier's output as
   gate evidence in the audit dossier.
3. Otherwise, for **each** listed error, fix **the data only**:
   - residual placeholder → fill in the real value (never mask it);
   - missing dimension → assess it or declare it `off` per the applicability matrix
     (rationale mandatory) — **never remove it from the contract**;
   - score without evidence → add the real `file:line` evidence, or remove the score and
     reopen the investigation (rule: "no score without evidence");
   - missing/invalid verdict → assess the rule; `sans_objet`/`a_evaluer` require a
     precise, specific rationale (no generic copy-pasted rationale);
   - finding without evidence / orphan action → complete the finding↔evidence↔rule↔action traceability;
   - self-containment → remove any reference to a prior audit, rephrase in the present tense.
4. Restart from step 1.

## Absolute prohibitions

- Modifying the templates, the verifier, or the rendering engine to "make the gate pass."
- Inventing evidence, a rationale, or a value to clear an error.
- Downgrading a verdict to `sans_objet` without verifiable factual justification.

## Stop condition

**3 consecutive failures on the same error** → STOP: report the anomaly to a human
(exact error, corrections attempted, hypothesis on the cause), without releasing the report.
