<!-- AuditCore template v1 — M1 · audit organization methodology (generalizes the reference profile's methodology) -->
# {{tenant.name}} — Audit Organization Methodology

> Unified document: naming convention, directory structures, mandatory rules. To be read
> **first** by every auditor (human or AI agent). Complements the conduct prompt
> (`prompt-conduite-audit`) which, in turn, drives execution.

## 1 · Deliverable naming convention

`{{tenant.name}} - <TRI> - <Nom Document> - <AAAAMMJJ><indice>.<ext>`
- `<TRI>`: trigram of the audited application.
- Reversed date, **verified** (never assumed); index `a`, then `b`, `c`… for
  iterations on the same day — **next free index**, counting both current files **and** `Old/`.
- No "v1/v2" in file names.

## 2 · Standardized directory structures

`input/` (audit inputs): `00 - Cadrage · 01 - Code & dépôt · 02 - Architecture & IaC ·
03 - Sécurité & secrets · 04 - Données · 05 - Tests & CI-CD · 06 - Observabilité ·
07 - Docs & gouvernance`
`output/` (produced deliverables): `00 - Rapport d'audit · 01 - Fiche Sécurité ·
02 - Présentation autorité de décision · 03 - Scans & preuves · 04 - Schémas & annexes · Old/`
Scaffolding: `node init-audit-workspace-standalone.mjs <dossier>` (idempotent).

## 3 · The 12 mandatory rules

1. **Blank slate** — no prior audit result used as a source or a starting point.
2. **Self-contained report** — no cross-reference to a previous audit, statuses in the present tense.
3. **Evidence-based** — every finding/score: `file:line` evidence, excerpt, command.
4. **No score without evidence** (invariant of the reference framework).
5. **Thoroughness & fair rigor** — all applicable rules assessed,
   no false positives, absence of evidence is a gap.
6. **Do not modify the engine** — only the **data** changes (templates, rendering
   engine, and verifiers are untouchable).
7. **Mandatory verification before release** — `node verifier-rapport-standalone.mjs
   <rapport-data.json>` must exit 0 (then the rendering verifier if HTML is produced).
8. **Never overwrite** — new version = new index; the old one goes into `Old/`.
9. **Audited projects do not create ADRs** — decisions live in the core corpus
   and the overlays, never in an audit's deliverables.
10. **Honest applicability** — dimensions and rules marked `sans objet`/`à évaluer` are always
    precisely justified (generic rationales are refused).
11. **Binding effect** — only rules with `bucket: opposable` and accepted status produce
    blockers; everything else is flagged.
12. **Communication in plain language** — messages to human interlocutors in plain text,
    never buried inside code blocks.

## 4 · Expected deliverables of an audit

| Deliverable | Location | Gate |
|---|---|---|
| `rapport-data.json` + rendered report | `output/00 - Rapport d'audit/` | verifiers (data + rendering) |
| Security sheet (8 sections, 0 placeholders) | `output/01 - Fiche Sécurité/` | review by {{roles.security_officer}} |
| Presentation to {{roles.decision_authority}} | `output/02 - Présentation autorité de décision/` | architecture diagram = the one in the report |
| Scans & evidence (+ manifest) | `output/03 - Scans & preuves/` | referenced as `file:line` |
| `remediation-actions.yaml` | `output/00 - Rapport d'audit/` | validated schema (forge backlog) |

## 5 · Kit tools

`init-audit-workspace-standalone.mjs` · `verifier-rapport-standalone.mjs` ·
`build-rapport-standalone.mjs` · `compliance-skill.md` (coding agent/CI) ·
`banc-de-preuves.md` · `constraints-merged.json` · `catalogue-adr.html` · `dimensions.yaml`.
