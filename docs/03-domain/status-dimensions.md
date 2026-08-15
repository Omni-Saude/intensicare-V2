---
doc_id: DOM-STATUS-DIMENSIONS
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.6 (Anti-corruption and conformance layer — two independent status dimensions), §9.1 (Architecture principles, principle 1 "Safety state precedes severity"), §9.3 (Conceptual data model)
date_collected: 2026-08-14
collector: temporal-provenance domain modeler
last_updated: 2026-08-14
---

# IntensiCare V2 — Status Dimensions

## Status

This document is a **PROPOSAL**. It describes two independent status dimensions that
IntensiCare V2's domain model must keep separate, per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`
§7.6. **It does not, and must not, change the evaluation-status vocabulary** — the five
values `valid | partial | not_evaluated | stale | invalid` are quoted verbatim from the
prompt and are reproduced here exactly as given, not redefined. This document also does
**not** fill in the explicit mapping matrix between the two dimensions — that is
explicitly out of this document's decision authority (see "Placeholder" section below);
it is owned jointly by the AMH-data compatibility architect and a named safety engineer.

## The two dimensions

`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §7.6 states:

> "Keep two independent status dimensions throughout mapping:
> - source data quality, including AMH `valid | warning | quarantined`; and
> - V2 evaluation status, including `valid | partial | not_evaluated | stale | invalid`.
>
> Define an explicit mapping matrix but never collapse the dimensions. A source marked
> `valid` can still be stale or insufficient for a pathway; a quarantined source must not
> become a normal V2 value."

### Dimension 1 — Source data quality

**Definition (SOURCE, quoted):** the data-quality state a source system (currently
evidenced for AMH) assigns to the data it produces, with the values `valid | warning |
quarantined`.

**What it describes:** whether the *source system* considers the data it produced
trustworthy by its own internal validation rules — a property of the data's origin and
the source's own ingestion/validation pipeline, evaluated once (or as the source system
revises it) independent of any particular downstream consumer's needs.

**What it does not describe:** whether the data is fresh enough, complete enough, or
applicable enough for any specific IntensiCare pathway's evaluation at any specific
moment. A source-`valid` fact says nothing about staleness, about whether it is the right
input for a given `Criterion`, or about whether enough related inputs exist for a
`Pathway`'s `Evaluation` to proceed.

**Scope note:** this document treats AMH's `valid | warning | quarantined` vocabulary as
the currently evidenced instance of "source data quality," per this document's evidence
scope (§7.6 names AMH explicitly). IntensiCare V2 may integrate other source systems in
the future (HL7 v2 interfaces, other platforms) with their own source-data-quality
vocabularies; this dimension is conceptually generic to "whatever quality state the
originating source assigns," not permanently bound to AMH's specific enum. Confirming or
generalizing this is left to the AMH-data compatibility architect and the HL7 v2
interface-conformance engineer.

### Dimension 2 — V2 evaluation status

**Definition (SOURCE, quoted):** the status IntensiCare V2 itself assigns to an
`EvaluationRecord` (see `conceptual-model.md`), with the values `valid | partial |
not_evaluated | stale | invalid` (see `glossary.md` for each value's conceptual
definition).

**What it describes:** whether, and how completely, IntensiCare V2 was able to produce a
trustworthy clinical determination for a given `Pathway`/`RuleVersion` against a given
`Encounter`'s known `Observation`s at a given instant — a property of V2's own evaluation
process, evaluated fresh for (at minimum) every relevant change in inputs.

**What it does not describe:** the originating source system's own confidence in the raw
data it supplied. A V2 `invalid` evaluation status may be *caused* by a source
`quarantined` state, but it may equally be caused by conflicting Observations from two
otherwise source-`valid` inputs, by staleness alone, by a missing required Observation
that the source never flagged as low-quality at all, or by an evaluation-time error
unrelated to any source quality signal.

## Why the two dimensions must never be collapsed

1. **Different evaluators, different questions.** Source data quality answers "does the
   source system trust what it sent us?" V2 evaluation status answers "can IntensiCare
   trust the determination it just computed, right now, for this specific pathway?"
   These are different questions asked by different systems at different times, and a
   correct answer to one does not imply anything about the other.

2. **A source-`valid` fact can still be V2-`stale` or V2-`insufficient`.** Per §7.6's own
   example: a value the source considers perfectly good can still have aged past a
   pathway's freshness window (see `time-semantics.md`), or can still be only one of
   several required inputs a pathway needs, leaving the evaluation `partial` or
   `not_evaluated` regardless of that one input's source quality.

3. **A source-`quarantined` fact must never silently become a normal V2 value.** If the
   two dimensions were collapsed — for example, by mapping "no explicit V2 status yet
   assigned" to `valid` by default — a quarantined source value could flow through to a
   clinician as if evaluation had succeeded normally. This is precisely the class of
   failure DOM-0004 (`invariants/DOM-invariants.md`) exists to prevent: missing, stale, or
   untrustworthy data must never be coerced toward a "normal"-looking state.

4. **Independent evolution.** Source systems may add, remove, or redefine their own
   quality states over time (subject to their own contract-versioning process); V2's
   evaluation-status vocabulary is fixed by this program's own governance (this document
   is explicitly forbidden from changing it). Keeping the dimensions independent means a
   change on one side does not silently corrupt the meaning of the other; it only requires
   the mapping matrix (below) to be revisited and re-versioned.

5. **Traceability and audit.** Every `EvaluationRecord`'s `AuditEvidence` (see
   `conceptual-model.md`) should be able to show *both* which source data-quality states
   contributed to a determination *and* what V2 evaluation status resulted, so that an
   incident review can distinguish "the source told us this was bad" from "V2 judged this
   insufficient for its own reasons" — collapsing the dimensions would destroy that
   distinguishing power.

This requirement is captured as a permanent, verifiable domain invariant: see
`invariants/DOM-invariants.md`, entry **DOM-0008**.

## Placeholder — explicit mapping matrix (NOT filled in by this document)

`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §7.6 requires "an explicit mapping matrix"
between the two dimensions. Populating that matrix requires clinical-safety and
AMH-integration judgment that is explicitly **outside this document's decisions_allowed**
(this document's task packet prohibits "changing the evaluation-status vocabulary" and,
by extension, does not authorize deciding how source states should influence evaluation
outcomes). The matrix shape is proposed below; every cell is a placeholder.

| Source data quality ↓ / V2 evaluation status → | `valid` | `partial` | `not_evaluated` | `stale` | `invalid` |
|---|---|---|---|---|---|
| **`valid`** (AMH) | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED |
| **`warning`** (AMH) | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED |
| **`quarantined`** (AMH) | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED | TBD — VALIDATION REQUIRED |

**Owner:** AMH-data compatibility architect (source-side authority) jointly with a named
safety engineer (clinical-safety acceptance authority) — both **UNASSIGNED** as of this
document's authoring date. Per §7.6's own constraint, this mapping is not a simple
lookup table alone: it must also account for freshness, completeness, and per-pathway
sufficiency (dimension 2 depends on more than dimension 1 alone), so the eventual
artifact replacing this placeholder may need to be richer than a single matrix — that
determination belongs to its named owners, not to this document.

**Explicit non-defaults, to prevent silent collapse before the matrix is filled:** until
the matrix above is populated and ratified, no implementation may assume any default
mapping — in particular, it must not assume that an absent mapping means "treat as
`valid`," "treat as the AMH value unchanged," or any other implicit rule. An unmapped
combination must fail closed to an explicit `not_evaluated` or `invalid` V2 status (per
DOM-0004) with a visible reason, never a silent default.

## Cross-references

- `glossary.md` — Freshness, Staleness, Partial, Not evaluated, Invalid, Conflicted,
  Corrected entries.
- `conceptual-model.md` — `ClinicalObservation → Provenance/Quality/Correction/Conflict`
  (source-side `Quality`) and `EvaluationRecord` (V2-side status).
- `time-semantics.md` — freshness windows and the "quality state" preserved alongside
  every time point per non-negotiable rule 8.
- `invariants/DOM-invariants.md` — DOM-0004 (no silent coercion) and DOM-0008 (the two
  dimensions are independent and must never be collapsed).

## What this document deliberately does not decide

- The content of any cell in the mapping matrix above.
- Whether additional source systems beyond AMH introduce additional source-quality
  vocabularies, and how those would extend dimension 1.
- Per-pathway freshness windows or completeness thresholds that feed dimension 2.
- Any technology, schema, or storage representation for either dimension.
