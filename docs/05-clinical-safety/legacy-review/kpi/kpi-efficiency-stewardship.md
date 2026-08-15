---
doc_id: LEGREV-KPI-EFF
title: Legacy KPI review — efficiency and stewardship metrics (domain_eficiencia.py + api/v1/efficiency.py)
status: PROPOSAL
label: OBSERVED (definitions as implemented) + PROPOSAL (verdicts)
owner: UNASSIGNED — VALIDATION REQUIRED
reviewer: rodaquino-OMNI
source: /Users/familia/intensicare (legacy V1, READ-ONLY), pinned per docs/archive/legacy-provenance/legacy-pin-cycle-1.md
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare (legacy V1)
  path_or_url: src/intensicare/services/domain_eficiencia.py; src/intensicare/api/v1/efficiency.py
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin)
  date_collected: 2026-08-15
  collector: legacy clinical-KPI forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: definitions transcribed from code with line citations; verdicts are reviewer proposals
  confidence: high (hashes match pin manifest)
  validation_status: VALIDATION REQUIRED — every verdict is PROPOSAL — AWAITING NAMED CLINICAL REVIEW
---

# Legacy KPI review — efficiency & stewardship metrics

All verdicts are **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)**.

## 0. Provenance

| File | SHA-256 | In pin manifest |
|---|---|---|
| `src/intensicare/services/domain_eficiencia.py` | `c9f779e3ef88ee0b807092b6ecc5c2784dafa3fd17cb5b9e7237254b011b5128` | yes |
| `src/intensicare/api/v1/efficiency.py` | `530a04f6bfc5ec539548c5de52e9b0609dc8e20743ecec958101ea6a23783559` | yes |

## 1. Cross-cutting finding — the endpoint always evaluates from empty inputs

**OBSERVED** (`src/intensicare/api/v1/efficiency.py:250-258`): the only caller of
`assess_efficiency` passes **no clinical inputs at all** — the code comment reads
"For now, evaluates with empty inputs — criteria default to not met. Future milestones
will populate inputs from the data ingestion pipeline." The endpoint
(`GET /patients/{mpi_id}/efficiency`) therefore returns, for any authenticated request
and **any** `mpi_id` string (no patient-existence check reaches the domain layer), a
complete-looking assessment — including the pt-BR recommendation text — computed from
zero data. With empty inputs the recommendation asserts, among others, "Contenção
mecânica sem intercorrências" and "Tempo de permanência na UTI dentro do esperado"
(`domain_eficiencia.py:221,237`) — affirmative clinical statements fabricated from
absence. The comment's claim that "criteria default to not met" is itself inaccurate:
TF-003 and TF-006 default to **met** (below).

**INFERENCE:** this is an HM-03 (false reassurance) generator at the API surface, in
the same class as the indicators catalogue mock, though partially mitigated by
`transfusion.appropriate=false` under no data.

## 2. KPI-EFF-01 — Adequação transfusional (Transfusion appropriateness, TF-001..TF-012)

1. **Name and location.** Criteria catalogue `domain_eficiencia.py:59-141`; evaluation
   `:247-486`; aggregate rule `:478-479`; served via `efficiency.py:139-147,197-270`.
2. **Definition as implemented.** Numerator: count of criteria evaluated `met` among
   the 12 (`met_count`). Denominator: fixed 12 (`:485`). Aggregate: `appropriate =
   met_count >= 8` (`:479` — the 8/12 cutoff is an unreferenced constant). Per
   *assessment* (single transfusion-event inputs dict), patient-level. No time window;
   no exclusions.
3. **Evaluation-status handling — SM-03 violation on individual criteria.** Missing
   inputs are not a distinct state; each criterion coerces absence to a boolean:
   - **TF-003** `units = inp.get("units", 0)` → `0 <= 1` → **met with no data**
     (`:310-311`): an undocumented transfusion counts as single-unit-strategy
     compliant.
   - **TF-006** `reaction = inp.get("reaction", False)` → `not False` → **met with no
     data** (`:356-357`): absence of a reaction record counts as "Ausência de reação
     transfusional".
   - TF-001/TF-005 treat absent Hb as not-met (documentation criteria — coherent);
     TF-004/TF-007..TF-011 treat absent booleans as not-met; TF-012 treats absent
     infusion time as not-met (`:460-466`).
   - **TF-002 has contradictory semantics** (`:290-304`): `met` is `hb_pre >= 7.0`,
     and `met` increments `met_count` toward "appropriate" — yet the criterion's own
     detail text labels the *not-met* branch as the appropriate one ("Gatilho
     restritivo respeitado — Hb < 7.0") and the met branch as "requer justificativa".
     As implemented, a transfusion given at Hb ≥ 7 g/dL (restrictive-trigger
     violation, absent documented justification) **raises** the appropriateness score.
   Net effect: `inputs=None` yields `met_count=2` (TF-003 + TF-006), `appropriate=false`
   — the aggregate happens to be safe under total absence, but any partially
   documented event mixes real compliance with absence-as-compliance and the inverted
   TF-002, making `met_count` clinically uninterpretable.
4. **PPV** — n/a.
5. **Clinical meaningfulness.** Transfusion stewardship audit is a legitimate
   guideline-anchored concept (restrictive threshold, single-unit strategy). Maps to
   no current SM/HM (candidate future stewardship metric). Validity threats:
   absence-as-compliance (denominator bias), TF-002 inversion (directional error),
   arbitrary 8/12 cutoff (gaming: four criteria may be permanently failed while the
   KPI reads "appropriate").
6. **Baseline timing.** ⏱ retrospective baseline possible from blood-bank/EHR records.
7. **Verdict: TRANSFORM.** Retain the stewardship-audit intent and the criterion
   *themes*; rebuild every criterion on the evaluation-status algebra (absent input →
   `not_evaluated`, never met/not-met), fix TF-002's direction under clinical review,
   and require a clinically ratified aggregate rule in place of 8/12.
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 3. KPI-EFF-02 — Contenção mecânica (Mechanical-restraint monitoring)

1. **Name and location.** `domain_eficiencia.py:489-525`; served via `efficiency.py:149-156`.
2. **Definition as implemented.** Two criteria: `duration_within_limit = duration <= 4`
   hours and `daily_reassessment = reassessed_today` (`:521-524`), from an inputs dict
   defaulting to `active=False, duration_hours=0, reassessed_today=False` (`:503-506`).
   Patient-level, instantaneous.
3. **Evaluation-status handling — SM-03 violation.** No data → `duration_hours=0` →
   `duration_within_limit=True`: an untracked restraint is compliant by default. The
   status state machine is vestigial: the `reassessed`/not-reassessed branches both
   assign `ACTIVE` (`:509-514` — dead `elif`), so `WEANING`, `REMOVED`,
   `CONTRAINDICATED`, `PLANNED` (`:36-44`) are unreachable from this function.
4. **PPV** — n/a.
5. **Clinical meaningfulness.** Restraint-duration and daily-reassessment auditing is
   a recognized safety practice; as implemented the compliant-by-absence default makes
   the metric an artifact of documentation coverage.
6. **Baseline timing.** ⏱.
7. **Verdict: TRANSFORM** (same rebuild rule: absence → `not_evaluated`; restore a
   real status machine). PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer:
   rodaquino-OMNI).

## 4. KPI-EFF-03 — Fragilidade (Frailty scoring, CFS)

1. **Name and location.** `domain_eficiencia.py:528-570`; served via `efficiency.py:158-162`.
2. **Definition as implemented.** CFS 1-9 banded: ≤3 "Robusto", 4 "Vulnerável", 5-6
   "Frágil", 7-8 "Muito frágil", 9 "Terminal" (`:553-563`). Patient-level.
3. **Evaluation-status handling — the ONLY honest not-assessed state in the legacy
   KPI surface.** `cfs_score is None` → `{"category": "não avaliada", "assessed":
   False}` (`:545-551`). No coercion, no default band. OBSERVED as the single
   positive exemplar; noted for preservation.
4. **PPV** — n/a.
5. **Clinical meaningfulness.** CFS banding is close to the published scale's
   categories; scale attribution (`CFS | mFI | FRAIL`, `:47-53`) is accepted but the
   banding logic only fits CFS — an mFI 0-1 value fed through the same integer bands
   would be nonsense (no guard).
6. **Baseline timing.** ⏱.
7. **Verdict: REFINE** — keep the explicit not-assessed pattern; add per-scale band
   logic and clinical ratification of the pt-BR band labels.
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 5. KPI-EFF-04 — Permanência UTI vs benchmark (ICU LOS outlier)

1. **Name and location.** `domain_eficiencia.py:573-605`; served via
   `efficiency.py:164-169,183-185`.
2. **Definition as implemented.** `is_outlier = days > expected_days * 1.5` when a
   benchmark exists and is > 0, else `days > 14` (`:594-598`). `days` defaults to `0`
   (`:588`). Patient-level.
3. **Evaluation-status handling — SM-03 violation.** No admission data → `days=0` →
   `is_outlier=False` → recommendation "Tempo de permanência na UTI dentro do
   esperado" (`:231-237`). Absence of an admission timestamp is reported as
   benchmark-conformant stay.
4. **PPV** — n/a.
5. **Clinical meaningfulness.** LOS benchmarking (expected vs actual) is standard
   ICU-efficiency practice, but 1.5× and the 14-day fallback are unreferenced
   constants, and no severity/case-mix adjustment source is implemented (the docstring
   mentions "DRG/severity" — `:581` — nothing supplies it).
6. **Baseline timing.** ⏱.
7. **Verdict: VALIDATE** — plausible concept; unusable until the benchmark source,
   multipliers, and case-mix adjustment are clinically specified; absence must map to
   `not_evaluated`. PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer:
   rodaquino-OMNI).

## 6. KPI-EFF-05 — The assessment endpoint itself

1. **Name and location.** `GET /api/v1/patients/{mpi_id}/efficiency`
   (`efficiency.py:197-270`).
2-3. See §1: fabricated full assessment from empty inputs; additionally the
   assessment `id` is built from Python's process-salted `hash(mpi_id)`
   (`efficiency.py:172`) — not stable across processes, so the "unique assessment
   identifier" is not reproducible or auditable.
7. **Verdict: REJECT** the serve-from-empty-inputs surface. A V2 endpoint with no data
   returns `not_evaluated` with reasons, never a synthesized narrative
   recommendation. PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer:
   rodaquino-OMNI).
