---
id: LEGREV-DQPC-SINAIS-VITAIS
title: Legacy review — docs/rules sinais-vitais cluster (33 rule records) with per-rule dispositions, plus the legacy dispositions/sinais-vitais.yaml shard
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule catalog cluster
  `sinais-vitais` (33 rule records, `RULE-SINAIS-VITAIS-001`..`033`, all
  independently read and SHA-256 verified), with a per-rule disposition
  table under `docs/00-governance/legacy-import-policy.md`, plus this
  workstream's independent review of the legacy team's own unratified
  disposition shard for the same cluster
  (`docs/plan/_work/dispositions/sinais-vitais.yaml`).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/{alert-threshold,care-pathway,clinical-scoring,data-validation,drug-dosing}/RULE-SINAIS-VITAIS-*.md; docs/plan/_work/dispositions/sinais-vitais.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; every file individually SHA-256-verified in §0)
  section_or_lines: whole cluster (33 files) plus the whole disposition shard
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (legacy data-quality/physiological-calculation forensics reviewer, cycle 1 Task 1, wave 1b)
  transformation: >
    every rule record and the disposition shard read in full; one-line
    summaries condensed from the records; verdicts are this reviewer's
    independent proposals under V2 vocabulary, not a copy of the shard's
    own (unratified, legacy-team) ADOPT/RETIRE/ADAPT dispositions.
  confidence: high (record contents, hash verification) / medium (dispositions)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0006, HAZ-0032]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# `sinais-vitais` rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Nothing in this table is an import decision. A verdict here proposes a
> classification under `docs/00-governance/legacy-import-policy.md` §4;
> any actual import additionally requires all eight §3 preconditions,
> currently unmet.

## 0. Sources and integrity

OBSERVED 2026-08-15: `inventory.md` §3 records the `sinais-vitais` cluster
as **33/33** rules (index count equals on-disk count, no gap rules),
classified `clinically substantive`
(`docs/05-clinical-safety/legacy-review/00-inventory/inventory.md:672`).
This reviewer independently located, read in full, and SHA-256-verified
all 33 on-disk files against `docs/archive/legacy-provenance/
legacy-pin-cycle-1.md` — **zero mismatches, zero missing files.** They are
spread across five `docs/rules/` category directories (not one
`sinais-vitais/` directory — the extraction tool's category taxonomy is
orthogonal to its cluster taxonomy):

```text
docs/rules/alert-threshold/      RULE-SINAIS-VITAIS-001..005
docs/rules/care-pathway/         RULE-SINAIS-VITAIS-007
docs/rules/clinical-scoring/     RULE-SINAIS-VITAIS-011
docs/rules/data-validation/      RULE-SINAIS-VITAIS-006, 008-010, 012, 013-028, 032, 033
docs/rules/drug-dosing/          RULE-SINAIS-VITAIS-029, 030, 031
```

The legacy team's own unratified disposition shard is
`docs/plan/_work/dispositions/sinais-vitais.yaml` (608 lines, 33 records,
SHA-256 `932c69c4...` confirmed against `inventory.md`). Per `inventory.md`
§2.9 (OBSERVED): this shard is "the legacy team's own (unratified under
V2 governance) clinical review... it materially accelerates cycle-1
review but has NO authority — every disposition needs independent V2
review." **This record uses the shard as context (its `justification`
field is cited where informative) but assigns its own, independent
verdicts** using `legacy-import-policy.md` §4 vocabulary — not the
shard's own `ADOPT`/`RETIRE`/`ADAPT`/`ADOPT-CORRECTED` vocabulary, which
is a different, non-V2-governed scheme.

**Cross-cluster caution.** Five of these rules (001-005) also appear as
rows in the alert-threshold-engine workstream's
`alert-threshold-cluster-review.md` (that workstream's own cluster is a
*different*, topically-mixed `docs/rules/alert-threshold/` directory
that happens to contain a handful of `RULE-SINAIS-VITAIS-*` files
alongside `RULE-SEPSE-*`, `RULE-VENTILACAO-*`, etc.). Per
`coverage-map.md` §1 rule 3 ("cluster classification" governs assignment,
not the extraction tool's category folder), these five rules belong to
**this** workstream by cluster (`sinais-vitais`), and this record is their
authoritative disposition; the alert-threshold-engine table's verdicts for
the same five rule IDs are that reviewer's independent read of the same
source text and are **not duplicated or overridden here** — both are
PROPOSALs, cross-referenced, not reconciled into one.

## 1. Verdict method (units/data-quality lens, applied uniformly)

| Verdict | Applied when |
|---|---|
| **REJECT** | The bound cannot discriminate between two clinically-different units a legacy source conflates (a wrong-unit value passes undetected); OR the bound's unit is undocumented in code (unverifiable against a published dose range); OR validation is disabled/dead on a clinically load-bearing field; OR the bound is internally inconsistent with a paired field encoding the same concept. |
| **VALIDATE** | The bound is well-formed, unit-unambiguous, and (where checked) numerically consistent with its cross-form/backend counterpart and, where a published range exists, with that range — but no legacy plausibility bound may enter V2 without empirical/clinical validation and named approval; this is the ceiling for every genuinely clinical bound in the cluster. |
| **TRANSFORM** | The underlying pattern is sound (e.g. audit-on-delete, a unified capture concept) but the concrete legacy mechanism/encoding is not the artifact to carry forward. |
| **SUPERSEDE** | A dead/duplicate frontend re-expression of a backend validator already captured elsewhere in this cluster, or legacy write-path plumbing the shard's own justification claims is replaced by an AMH Gold/FHIR read model under ADR-001 — an assertion this reviewer has **not independently verified** (VALIDATION REQUIRED; ADR-001 is outside this workstream's item list). |
| **RETAIN / REFINE** | Not proposed for any row — no legacy validation bound imports as-is or with light modification without the unit-discrimination and clinical-ratification gaps below being closed first. |

## 2. Per-rule disposition table

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-SINAIS-VITAIS-001 | FE antd BP/HR bounds (PAS 50-250, PAD 0-150, HR 0-200) mirror backend validators 018/019/027 exactly (`dataFormMovimentacao.ts:72-92`) | SUPERSEDE — dead duplicate FE mechanic (VALIDATION REQUIRED on the shard's ADR-001 claim); numeric content carried by 018/019/027 |
| RULE-SINAIS-VITAIS-002 | FE bounds for 7 blood-gas/lab values (PO2, PaCO2, lactate, leukocytes, bilirubin, creatinine, platelets) mirror backend validators exactly (`dataFormMovimentacao.ts:145-198`) | SUPERSEDE — dead duplicate FE mechanic; numeric content carried by 014/016/022/024/025/026/028 |
| RULE-SINAIS-VITAIS-003 | FE bounds for urine output (0-10000 mL) and temperature (20-43 °C) mirror backend exactly (`dataFormMovimentacao.ts:199-212`) | SUPERSEDE — dead duplicate FE mechanic; numeric content carried by 021/023 |
| RULE-SINAIS-VITAIS-004 | Capillary refill (TEC) captured 3 incompatible ways (numeric 3-20s, boolean >5s, checkbox >5s); numeric floor of 3s excludes physiologically-normal refill (<=2-3s, ANDROMEDA-SHOCK) | REJECT as implemented — 3 divergent encodings of one concept, a defect at data-entry itself; TRANSFORM to one canonical `s` field per `units-registry.md` §2.3 `tempo_enchimento_capilar`. The shard's "[RATIFIED 2026-07-04]" is a **legacy-team self-ratification** — not a V2 clinical authority, void under V2 evidence-notation (no agent may self-apply DECIDED-equivalent status) |
| RULE-SINAIS-VITAIS-005 | Physician form leaves HR/FR/temp/SpO2 **unbounded**, unlike movimentacao form and backend validators which bound HR 0-200/FR 0-50/temp 20-43 | REJECT — inconsistent validation surface across entry points (accept-then-reject UX); a value the physician form accepts can be rejected by the backend on save |
| RULE-SINAIS-VITAIS-006 | `SinaisVitaisViewSet.get_queryset()` uses the default manager, not `objects_without_deleted` — soft-deleted vital-sign rows leak into listings | REJECT — deleted/superseded values can re-enter a clinical view; same defect pattern as balanco-hidrico entrada/saida |
| RULE-SINAIS-VITAIS-007 | Soft-delete logs an `AcaoHomecare` audit action; no fluid-balance field adjusted (correctly, vitals don't affect balance) | TRANSFORM — audit-on-delete concept is sound; the Tasy-specific `AcaoHomecare` call is legacy plumbing to rebuild |
| RULE-SINAIS-VITAIS-008 | Parent `balanco` id injected from URL kwarg; `assinar` flag passed through only if present | SUPERSEDE — Django viewset wiring for a legacy nested-route pattern, no clinical content (VALIDATION REQUIRED on the shard's ADR-001 claim) |
| RULE-SINAIS-VITAIS-009 | Generic 0-100 percentage-field validator, reusable across any percent-typed field | VALIDATE — sound generic bound, no unit ambiguity, still requires named clinical/independent validation per field it is applied to |
| RULE-SINAIS-VITAIS-010 | FiO2 21-100 (percent), zero-exempted as "not measured" | VALIDATE the bound itself (backend-confirmed, FE-matched); **this is the OLTP-side FiO2-percent field this workstream's units record (§3.1) shows correctly converts to fraction ONLY inside the Gold/Athena path — nothing here tags the value as "percent" for any other consumer.** |
| RULE-SINAIS-VITAIS-011 | Glasgow Coma Scale 3-15, zero-exempted; externally VERIFIED against Teasdale & Jennett 1974 / StatPearls | VALIDATE — highest external-evidence confidence in the cluster; still requires named V2 clinical approval before import (ceiling, not RETAIN) |
| RULE-SINAIS-VITAIS-012 | PEEP 0-40 cmH2O, no zero exemption (0 = no positive pressure is valid) | VALIDATE the bound; note `units-registry.md` §2.2 documents an unimplemented `mbar` ×1.01972 edge conversion for PEEP (units-normalization-review.md §4) |
| RULE-SINAIS-VITAIS-013 | TEC 3-20s, zero-exempted; range wider than clinical normal (<2-3s), entangled with rule 004's 3-encodings problem | REJECT as implemented — the 3s permissible floor collides with rule 004's clinical-cutoff finding; TRANSFORM once the encoding is unified |
| RULE-SINAIS-VITAIS-014 | PaO2 0-500 mmHg, no zero exemption | VALIDATE |
| RULE-SINAIS-VITAIS-015 | Respiratory rate 0-50, no zero exemption (0 = apnea representable) | VALIDATE |
| RULE-SINAIS-VITAIS-016 | Arterial lactate 0-20, the rule's own Unit column reads "mmol/L (mg/dl per some texts)" — unit is itself ambiguous in the record | REJECT as implemented — this bound cannot discriminate an mg/dL value from an mmol/L value (the OLTP-side manifestation of `units-registry.md` SYS-03, ~9× class); VALIDATE the plausibility concept once unit-tagged |
| RULE-SINAIS-VITAIS-017 | Tidal volume 0-1500 mL, no zero exemption | VALIDATE |
| RULE-SINAIS-VITAIS-018 | Systolic BP (PAS) 50-250 mmHg, zero-exempted | VALIDATE |
| RULE-SINAIS-VITAIS-019 | Diastolic BP (PAD) 0-150 mmHg, **no** zero exemption — inconsistent with the paired PASValidator, which does exempt 0 | REJECT as implemented — the same "not measured" event is encoded two different ways depending on which of a paired systolic/diastolic field is used; TRANSFORM to unify sentinel handling |
| RULE-SINAIS-VITAIS-020 | Mean arterial pressure (PAM/MAP) 0-200 mmHg validator **defined but commented out** on the model field — MAP is never stored or validated today | REJECT — a clinically load-bearing hemodynamic input (feeds shock index, `units-registry.md` §2.3) with validation silently disabled; a second HAZ-0005-adjacent silent gap alongside rule 033 |
| RULE-SINAIS-VITAIS-021 | 24h urine output 0-10000 mL, no zero exemption (0 = anuria representable) | VALIDATE |
| RULE-SINAIS-VITAIS-022 | Bilirubin 0-30 mg/dL, no zero exemption — SOFA-hepatic input | **REJECT as implemented** — same unit-blind-bound defect as rule 016, but for bilirubin: per `units-registry.md` §2.5 (µmol/L ×0.05848, ÷17.1) and `sofa-review.md` D-06, a **normal-range µmol/L value (~5-21) numerically fits inside this 0-30 "mg/dL" bound and passes undetected** — this is the same ~17× hazard `units-normalization-review.md` §3.2 finds unimplemented at the conversion layer, now confirmed to also pass unchecked at the **data-entry** layer. **Worst single finding in this cluster.** |
| RULE-SINAIS-VITAIS-023 | Temperature 20-43 °C, zero-exempted | VALIDATE — 0 °C sentinel is not distinguishable from a genuine extreme-hypothermia entry attempt; VALIDATION REQUIRED whether 0 should remain a sentinel or be rejected outright in V2 |
| RULE-SINAIS-VITAIS-024 | PaCO2 0-150 mmHg, no zero exemption | VALIDATE the bound; note `units-registry.md` §2.1 documents a `kPa` ×7.50062 edge conversion for PaCO2 that, unlike its sibling PaO2, is absent from `units_normalizer.py`'s runtime registry (`units-normalization-review.md` §4) |
| RULE-SINAIS-VITAIS-025 | Creatinine 0-20 mg/dL, no zero exemption | VALIDATE — the cluster's best-aligned example: OLTP bound and the Gold-pipeline unit conversion (`units_normalizer.py` `creatinina` µmol/L ×0.0113) agree on both unit and coverage |
| RULE-SINAIS-VITAIS-026 | Leukocyte count 0-40000 /mm3, no zero exemption | VALIDATE the bound; note `units-registry.md` §2.5 canonicalizes leukocytes as `10^3/uL` (a **different scale** than this raw `/mm3` count), unimplemented anywhere at runtime (`units-normalization-review.md` §4) |
| RULE-SINAIS-VITAIS-027 | Heart rate 0-200 bpm, no zero exemption (0 = asystole representable) | VALIDATE |
| RULE-SINAIS-VITAIS-028 | Platelet count 0-700000 /mm3, no zero exemption — SOFA-coagulation input | VALIDATE the bound; same scale-mismatch gap as leukocytes vs. `units-registry.md`'s `10^3/uL` canonical (`units-normalization-review.md` §4) |
| RULE-SINAIS-VITAIS-029 | Dobutamine dose 0-30, **unit undocumented in code** (ml/h per one capture, mcg/kg/min per another); own record marks Verification = UNVERIFIABLE | REJECT as implemented — a bound with no stated unit cannot be checked against the published 2-20 mcg/kg/min range; VALIDATION REQUIRED before any V2 use |
| RULE-SINAIS-VITAIS-030 | Noradrenaline dose 0-200, **unit undocumented** ("ml" per one capture); own record marks Verification = UNVERIFIABLE | REJECT as implemented — the OLTP-side instance of `units-registry.md` SYS-02 (vasopressor dose-unit chaos, ~60× class, explicitly a "needs a service, not a factor" hazard) |
| RULE-SINAIS-VITAIS-031 | Sedative dose 0-30 — aggregates an entire drug class (midazolam, propofol, dexmedetomidine, fentanyl) under one unit-less bound; backend test method is *named* `..._entre_0_e_200` but the enforced bound is 0-30 | REJECT — no single external clinical anchor for an aggregated drug class, plus an internal test-name/enforced-bound discrepancy |
| RULE-SINAIS-VITAIS-032 | Inspiratory pressure (PINS) 0-30 cmH2O, no zero exemption | VALIDATE the bound; `units-registry.md` §2.2 itself flags "Bounds 0-30 vs 5-40 (RATIFY)" for this parameter — a bounds-disagreement the design document already knows about, unresolved |
| RULE-SINAIS-VITAIS-033 | SpO2/SatO2 validator defined 21-100% but **disabled** on the model field — SpO2 is effectively **unvalidated**; also internally inconsistent (no zero-exemption vs. the structurally identical FiO2Validator, which does exempt 0) | REJECT — a required respiratory-domain input (`units-registry.md` §2.1: SpO2 is `percent`, "Stays percent; ≠ FiO2" — precisely the confusion this disabled validator invites) has **no live validation at all**; a second HAZ-0005-adjacent silent gap alongside rule 020 (MAP) |

## 3. Disposition tallies

| Verdict | Count | Rule IDs |
|---|---|---|
| RETAIN | 0 | — |
| REFINE | 0 | — |
| TRANSFORM | 1 | 007 |
| VALIDATE | 16 | 009, 010, 011, 012, 014, 015, 017, 018, 021, 023, 024, 025, 026, 027, 028, 032 |
| SUPERSEDE | 4 | 001, 002, 003, 008 |
| REJECT | 12 | 004, 005, 006, 013, 016, 019, 020, 022, 029, 030, 031, 033 |
| **Total** | **33** | |

## 4. Cluster-level findings

1. **Zero rules reach import-ready status.** No `RETAIN`/`REFINE` — even
   the externally-verified GCS bound (011) and the best-aligned creatinine
   pair (025) are `VALIDATE`-ceilinged pending named clinical approval,
   consistent with the alert-threshold-engine workstream's own finding
   that the ceiling applies cluster-wide.
2. **The bilirubin bound (022) is the single most severe finding across
   this entire workstream.** It is not merely a plausibility-range
   question — it is the concrete, data-entry-layer confirmation of the
   ~17× unit-conflation hazard `units-normalization-review.md` §3.2 and
   the sepsis-scores workstream's `sofa-review.md` D-06 both name from the
   registry/scoring side. All three findings triangulate on the same
   defect from three independent vantage points (design doc, runtime
   registry, OLTP validator) — nowhere in the pipeline is a wrong-unit
   bilirubin value caught.
3. **Two clinically load-bearing vitals have validation silently
   disabled, not merely absent**: MAP (020) and SpO2 (033). Both
   validator classes exist, are correctly formed, and are commented out
   on the model field — a stronger defect than "never built," because it
   reads as intentional at a glance and is easy to miss in a diff.
4. **Frontend/backend divergence is the dominant defect shape** among the
   `REJECT` rows for validation-surface rules (005, 019 by omission
   pattern) — a value accepted at one entry point can be silently rejected
   or differently sentineled at another, an accept-then-reject UX that
   erodes trust in the "the form already validated this" assumption any
   downstream code might make.
5. **The unit-ambiguous-bound pattern (016 lactate, 022 bilirubin)
   generalizes**: any plausibility bound wide enough to admit both a
   parameter's canonical-unit range and a common alternate-unit range for
   the *same clinically plausible* value cannot, by construction, catch a
   unit mix-up — only a unit-tagged value with an independent conversion
   check (reviewed in `units-normalization-review.md`) can. This is a
   structural argument, not a per-rule one: **every OLTP plausibility
   bound in this cluster should be re-derived alongside its
   `units-registry.md` canonical unit, not independently of it.**

All dispositions: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
