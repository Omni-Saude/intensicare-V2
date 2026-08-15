---
id: LEGREV-OSMS-CL-PRESC
title: Legacy review — prescricao rule cluster (41 rules) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule cluster prescricao
  (41 rule records), with a per-rule disposition table under
  docs/00-governance/legacy-import-policy.md §4.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/*/RULE-PRESCRICAO-*.md (41 files)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; rule files individually hashed in the cycle-1 pin manifest)
  section_or_lines: whole cluster; upstream citations inherit the records' own audit provenance (NL-1)
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy organ-support and medication-safety forensics reviewer (cycle 1, Task 1, wave 1b)
  transformation: every rule record read; verdicts are this reviewer's proposals
  confidence: high (record contents) / medium (dispositions)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0021, HAZ-0023, HAZ-0035]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Prescricao rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> This cluster is the medication administration/checking lifecycle (Tasy-fed
> continuous prescriptions, dose schedule slots, suspension, signing) — the
> patient-safety-relevant half is dose-checking integrity. Legacy shards
> `prescricao-p1.yaml`/`-p2.yaml` propose ADOPT 2 / ADAPT 10 /
> ADOPT-CORRECTED 3 / RETIRE 26 — the legacy team itself retired most of
> this cluster; this review is broadly concordant on the retire-heavy shape.

## Per-rule disposition table

| Rule ID | What it does (one line) | Verdict |
|---|---|---|
| RULE-PRESCRICAO-001 | mL-unit meds require "Quantidade em ml" whose value feeds the fluid-balance ledger | VALIDATE |
| RULE-PRESCRICAO-002 | Per-dose suspension check; each serializer also carries a shadowed never-executed inverted first definition | REJECT — shadowed inverted logic disqualifies the artifact (concordant ATE) |
| RULE-PRESCRICAO-003 | Order-level suspension once DT_SUSPENSAO ≤ now | TRANSFORM (concordant ATE) |
| RULE-PRESCRICAO-004 | Pre-07:00 dose export books quantity to previous day's balance | VALIDATE |
| RULE-PRESCRICAO-005 | Dose-time display grouping across the 07:00 boundary | VALIDATE |
| RULE-PRESCRICAO-006 | Offline prescription validity constant = 2 days | TRANSFORM |
| RULE-PRESCRICAO-007 | 5-tier item-type priority; unknown types → NULL priority; one path lists soft-deleted rows | REFINE — default tier and deleted-row exclusion required |
| RULE-PRESCRICAO-008 | Four mutually exclusive dose-update flows (not-administered / cancel / reschedule / check) with per-flow side effects | VALIDATE |
| RULE-PRESCRICAO-009 | PDF tri-state dose icon + actor label | SUPERSEDE |
| RULE-PRESCRICAO-010 | Daily materialisation eligibility for continuous prescriptions (display/validity/release/start gates) | VALIDATE |
| RULE-PRESCRICAO-011 | Dose-slot visual status priority: suspended > administered > not-administered > placeholder > pending | VALIDATE |
| RULE-PRESCRICAO-012 | POST/PATCH/DELETE routing from horarioId/body presence | TRANSFORM |
| RULE-PRESCRICAO-013 | Save vs save-and-check vs update-time branch when hour edited | VALIDATE |
| RULE-PRESCRICAO-014 | Dose delete authorization; two serializers diverge on permission source and missing-context fallback | REJECT — divergent authorization for the same action |
| RULE-PRESCRICAO-015 | Delete button only when can_delete, with confirmation | TRANSFORM |
| RULE-PRESCRICAO-016 | Add-new-horario eligibility (not suspended + permission) | TRANSFORM |
| RULE-PRESCRICAO-017 | Only the checking user may revert a check | VALIDATE |
| RULE-PRESCRICAO-018 | can_manage_prescricao gates all administration controls | TRANSFORM |
| RULE-PRESCRICAO-019 | Reconciliation vocabulary (high-risk classes, adherence, completeness) | VALIDATE |
| RULE-PRESCRICAO-020 | Dose-slot generation from "#"-delimited DS_HORARIOS with dedup | VALIDATE |
| RULE-PRESCRICAO-021 | Bulk check-off marks each slot administrado=True unconditionally; mutates one shared request dict across iterations | REJECT — no un-check path, shared-state mutation, no per-item failure handling (HAZ-0033 family) |
| RULE-PRESCRICAO-022 | Payload injection of prescription/leito ids from route kwargs | TRANSFORM |
| RULE-PRESCRICAO-023 | Suspended dose blocks all administration actions | VALIDATE |
| RULE-PRESCRICAO-024 | One-click "administered" without modal on pending dose | REFINE — single-tap administration of a medication record needs confirmation-by-design decision |
| RULE-PRESCRICAO-025 | Check-form payload construction (reason only when not administered; qtd default) | VALIDATE |
| RULE-PRESCRICAO-026 | Revert requires mandatory justification, sets administrado=false | VALIDATE |
| RULE-PRESCRICAO-027 | Antibiotic course tracking list; one malformed field key ("Data" not "label") | REJECT — malformed field renders the reajuste date uncapturable |
| RULE-PRESCRICAO-028 | Dose lifecycle shape (administrado/suspenso/motivo/can_delete), shape-only | TRANSFORM |
| RULE-PRESCRICAO-029 | Not-administered reason enum: frontend has 4 codes incl. "outros", backend humanizer has 3 → KeyError on "outros" | REJECT — enum mismatch crashes the PDF path on a legal value |
| RULE-PRESCRICAO-030 | Reason enum with "outros" free-text requirement | VALIDATE |
| RULE-PRESCRICAO-031 | New horario requires HH:mm time | VALIDATE |
| RULE-PRESCRICAO-032 | Authorless slots assigned to user "sistema" at save | REFINE — system-authored records must be explicit, not a username convention |
| RULE-PRESCRICAO-033 | Slots scoped to parent prescription, soft-deleted excluded | VALIDATE |
| RULE-PRESCRICAO-034 | Only the original checker may cancel a checked dose | VALIDATE |
| RULE-PRESCRICAO-035 | Reason-required validator only invoked where the reason is already guaranteed | REJECT — unreachable guard (validates nothing) |
| RULE-PRESCRICAO-036 | Checagem-lock validator (cannot alter administered status) exists but is never called | REJECT — the one integrity lock the flow needs is dead code |
| RULE-PRESCRICAO-037 | Pharmacist global assessment with all conditional reveals commented out | REJECT — dead conditionals (allergy/LPP details uncapturable) |
| RULE-PRESCRICAO-038 | Pharmacist prophylaxis checklist (free text) | VALIDATE |
| RULE-PRESCRICAO-039 | Pharmacist intervention vocabulary (30+ items with typos incl. "sinalizacao_de_alegria") | REFINE — vocabulary normalization needed |
| RULE-PRESCRICAO-040 | Pharmacist form exports a symbol named dataFormFisioterapeuta | REJECT — duplicate-symbol/naming hazard across professional forms |
| RULE-PRESCRICAO-041 | Continuous-prescription exact-day filter | VALIDATE |

## Tally

VALIDATE 19 · REJECT 9 · TRANSFORM 8 · REFINE 4 · SUPERSEDE 1 (= 41).
Safety-relevant core: the checking lifecycle's only alteration lock (036) is
dead, bulk check-off (021) can mass-mark administration with no per-item
integrity, and the not-administered reason enum (029) crashes on a legal
value — the administration record cannot currently be trusted as an audit
substrate (HAZ-0035).
