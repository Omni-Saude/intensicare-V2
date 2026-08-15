---
doc_id: LEGREV-KPI-DASH
title: Legacy KPI review — bed-grid dashboard metrics (V1 FastAPI backend + frontend-v3)
status: PROPOSAL
label: OBSERVED (definitions as implemented) + PROPOSAL (verdicts)
owner: UNASSIGNED — VALIDATION REQUIRED
reviewer: rodaquino-OMNI
source: /Users/familia/intensicare (legacy V1, READ-ONLY), pinned per docs/archive/legacy-provenance/legacy-pin-cycle-1.md
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare (legacy V1)
  path_or_url: see per-file provenance table in section 0
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin)
  date_collected: 2026-08-15
  collector: legacy clinical-KPI forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: definitions transcribed from code with line citations; verdicts are reviewer proposals
  confidence: high (code verified in place, hashes match pin manifest)
  validation_status: VALIDATION REQUIRED — every verdict is PROPOSAL — AWAITING NAMED CLINICAL REVIEW
---

# Legacy KPI review — bed-grid dashboard metrics

All verdicts in this file are **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer:
rodaquino-OMNI)**. Nothing here authorizes import; see
`docs/00-governance/legacy-import-policy.md` §3 (eight preconditions).

## 0. Provenance and hash verification

OBSERVED 2026-08-15. All paths relative to `/Users/familia/intensicare/` at commit
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`. Hashes verified against
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md` unless marked *hash-and-note*
(file absent from the pin manifest; SHA-256 computed in place on 2026-08-15).

| File | SHA-256 | In pin manifest |
|---|---|---|
| `src/intensicare/services/dashboard.py` | `ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489` | yes |
| `src/intensicare/schemas/dashboard.py` | `e3313341c18719efb9d43e4ffb8b669389cbc3939d65ec46274b2d002b686723` | yes |
| `src/intensicare/api/v1/dashboard.py` | `dae65e2d6b8224d7b4d5802c6f20262f90215f2a69e0e59bbacc6ae01a644a6f` | yes |
| `src/intensicare/services/mews.py` | see note | yes (services/ set) |
| `frontend-v3/components/dashboard/stats-bar.tsx` | `8d91c7eff98aa257630221cb6b0bc78bd0aa681ab72240fba68c3b1fd280a811` | no — hash-and-note |
| `frontend-v3/components/dashboard/bed-card.tsx` | `70858910af51152a0aaf12d45046e492876472d0c89fe8d8347fb1c97210d71e` | no — hash-and-note |
| `frontend-v3/lib/vitals-staleness.ts` | `b42d43092dc2dc33d2723a7d829a42b39a2e004de29c61669f53cc42c4b27d1e` | no — hash-and-note |
| `tests/test_dashboard.py` | `ca74c593e4bdc51e96eaa3ba75a260b3c7dcc8575a08224373ad2c76a0b5693d` | no — hash-and-note |

---

## KPI-DASH-01 — `total` (Total de pacientes / active-patient census)

1. **Name and location.** pt-BR display: "N pacientes" (`frontend-v3/components/dashboard/stats-bar.tsx:12`).
   Computed: `src/intensicare/services/dashboard.py:155-161,413` (`total=len(bed_summaries)`).
   Served by `src/intensicare/api/v1/dashboard.py:16-50` (`GET /api/v1/dashboard`).
2. **Definition as implemented.** Numerator: count of `PatientCache` rows with
   `is_active IS TRUE`, optionally filtered by `unit` (`dashboard.py:155-159`). No
   denominator (absolute count). Time window: instantaneous snapshot at request time.
   Aggregation: unit or whole tenant view.
3. **Evaluation-status handling.** None. Census does not distinguish patients with any
   evaluation from patients with none; combined with KPI-DASH-02 it forms the implicit
   denominator "everyone not shown critical is fine". No `not_evaluated` category exists
   anywhere in the response (`schemas/dashboard.py:102-123`). SAF-0006 (P-8: no
   unevaluated subject omitted from a count) is unimplementable in this shape.
4. **PPV** — n/a.
5. **Clinical meaningfulness.** Maps to no SM/HM directly; it is the denominator
   infrastructure for SM-04 (alert burden per patient-day) and SM-05 (evaluation
   coverage). Threat: as implemented it cannot support "valid patient-time" denominators
   (SM-03 rule) because it counts patients, not statused patient-time.
6. **Baseline timing.** Not itself baseline-bound.
7. **Verdict: REFINE.** The census is legitimate, but V2 must add per-status roll-up
   categories (`valid | partial | not_evaluated | stale | invalid`) per
   `evaluation-status-semantics.md` §3.3/P-8 before any other KPI divides by it.
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## KPI-DASH-02 — `critical_count` (Pacientes críticos / critical-patient count)

1. **Name and location.** pt-BR display: "N críticos" (`stats-bar.tsx:14-15,37-44`).
   Computed: `services/dashboard.py:314,367-368,414`. Schema contract:
   `schemas/dashboard.py:102-121` ("It MUST be a count of PATIENTS whose derived bed
   `severity` … is critical").
2. **Definition as implemented.** Numerator: active patients whose *derived bed
   severity* equals `critical`. Derived severity =
   `max(active-alert severity, active-pathway severities, MEWS band, NEWS2 band)` with
   **floor `normal`** (`services/dashboard.py:93-115`; decisive line 115:
   `return derived or SeverityLevel.NORMAL.value`). Thresholds: tenant-global
   `threshold_config` rows with hardcoded fallback MEWS (3,4,5), NEWS2 (3,5,7)
   (`dashboard.py:44-47`). Denominator (as displayed): KPI-DASH-01 census. Exclusions:
   none. Window: latest score row per patient regardless of age (`dashboard.py:209-265`
   — `row_number() over … order by calculated_at desc`, rn=1, **no freshness filter**).
   Aggregation: patient → unit/tenant.
3. **Evaluation-status handling — SM-03 VIOLATION, HAZ-0005 pattern, worst case in
   this review.** A patient with **no alerts, no pathways, and no scores at all** is
   assigned severity `normal` by design: comment at `services/dashboard.py:102-106`
   ("Floor is `normal`: a bed with no alerts, no active pathways, and no scores is
   still `normal`, not null") and the schema default `severity: SeverityLevel =
   SeverityLevel.NORMAL` (`schemas/dashboard.py:88`). An unscored patient is therefore
   counted as a *non-critical* (reassuring) member of the denominator, and rendered
   with the same visual vocabulary as an assessed-normal patient. Additionally the
   "latest score" carries no staleness cut — an arbitrarily old MEWS/NEWS2 keeps
   banding the bed (`dashboard.py:209-265`). This is precisely the failure mode of
   `hazard-log.md` HAZ-0005 and violates prohibitions P-2/P-3/P-8 of
   `evaluation-status-semantics.md` §4, and the SM-03 rule (compute only over valid
   patient-time; report other states as a separate denominator).
4. **PPV** — n/a.
5. **Clinical meaningfulness.** Maps loosely to SM-05's coverage complement and to
   HM-03 (false reassurance). Validity threats: denominator bias (unevaluated
   patient-time silently pooled as normal), surveillance bias (the count rises with
   measurement frequency, not only with acuity), and gaming (evaluating fewer patients
   lowers the critical count).
6. **Baseline timing — FLAGGED.** If V2 ever compares critical-census levels
   pre/post deployment, the pre-V2 distribution is only observable before deployment
   (joins `g1-validation-backlog.md` VAL-0035 / `pathway-portfolio/g2-validation-backlog.md`
   G2-VAL-0025 scope as part of the unit's baseline alarm/acuity environment).
7. **Verdict: TRANSFORM.** The headline "how many patients are critical right now" is
   clinically wanted, but the computation must be rebuilt on the V2 evaluation-status
   algebra: severity readable only in `valid`/approved-`partial` states; unscored
   patients surface as `not_evaluated` in their own counted category, never as normal.
   The floor-to-normal derivation must not be imported in any form.
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## KPI-DASH-03 — `active_alerts_total` (Total de alertas ativos / active-alert count)

1. **Name and location.** Computed `services/dashboard.py:180-207` (sum over per-patient
   window counts of `Alert.status == "active"`); response field
   `schemas/dashboard.py:112-114,122` — schema comment states it "is NOT rendered by the
   frontend today; kept for future use / diagnostics".
2. **Definition as implemented.** Numerator: count of `Alert` rows with status
   `active` for active patients (unit-filtered set). No denominator, no time window
   (an alert stays in the numerator until acknowledged/resolved), no per-rule-version
   attribution. Aggregation: tenant/unit.
3. **Evaluation-status handling.** None; but as a raw workload count the direct
   SM-03 exposure is lower. The real defect is the absence of *no-fire* visibility:
   zero alerts is indistinguishable from zero evaluation (P-5, SAF-0019).
4. **PPV** — n/a.
5. **Clinical meaningfulness.** Direct ancestor of SM-04 (alert burden per
   patient-day), but without per-patient-day normalization, severity split, or rule
   version attribution — all required by SM-04. Gaming threat: suppression/cooldowns
   lower it invisibly (anti-gaming pair HM-04/HM-03).
6. **Baseline timing — FLAGGED.** Alert burden is one of the four measurements
   VAL-0035 declares unobtainable after deployment; any V2 successor of this KPI
   requires the G2-VAL-0025 pre-deployment baseline.
7. **Verdict: TRANSFORM** into SM-04's shape (per patient-day, per severity, per rule
   version, with explicit no-fire accounting). PROPOSAL — AWAITING NAMED CLINICAL
   REVIEW (reviewer: rodaquino-OMNI).

---

## KPI-DASH-04 — `unit_counts` (Contagem por unidade / per-unit census)

1. **Name and location.** `services/dashboard.py:128-143` (GROUP BY unit over active
   patients, deliberately unfiltered — BUG-F2-01 note); response field
   `schemas/dashboard.py:123`. Displayed as unit-tab counts
   (`frontend-v3/components/dashboard/unit-filter.tsx` — pointer only).
2. **Definition as implemented.** Numerator: active patients per non-null unit.
   Patients with `unit IS NULL` are silently dropped from the map
   (`dashboard.py:141-143`: `if row[0]`). Instantaneous; unit aggregation.
3. **Evaluation-status handling.** Same limitation as KPI-DASH-01; additionally the
   null-unit exclusion silently removes patients from every tab count (P-8 concern:
   an unassigned-unit patient is omitted from the navigation aggregate).
4. **PPV** — n/a.
5. **Clinical meaningfulness.** Navigation aid; feeds occupancy-style displays.
6. **Baseline timing.** Not baseline-bound.
7. **Verdict: REFINE** — keep as navigation census; V2 must make the null-unit bucket
   explicit rather than dropped. PROPOSAL — AWAITING NAMED CLINICAL REVIEW
   (reviewer: rodaquino-OMNI).

---

## KPI-DASH-05 — `news2_risk` (Categoria de risco NEWS2 / NEWS2 risk category)

1. **Name and location.** `services/dashboard.py:33-35` (thresholds 7/5) and
   `:320-330`; field `schemas/dashboard.py:80`. Displayed on bed cards
   (`frontend-v3/components/dashboard/score-pair.tsx` — pointer only).
2. **Definition as implemented.** Latest NEWS2 aggregate score → `high` if ≥ 7,
   `medium` if ≥ 5, else `low` (`dashboard.py:325-330`). If no NEWS2 row exists,
   `news2_risk = None` (honest null at this field). No freshness window on the
   "latest" score. Patient-level.
3. **Evaluation-status handling.** The field itself keeps `None` for unscored
   patients — but the same absent score simultaneously floors the *bed severity* to
   normal via KPI-DASH-02/06, so the honest null is overridden by a reassuring signal
   one field away. A NEWS2 computed from partially missing vitals is a scoring-domain
   issue (see `services/mews.py:220-224` pattern where absent components contribute 0
   via `components.get(..., 0)`) — noted here because it silently degrades this KPI's
   input; the scores themselves are another reviewer's scope.
4. **PPV** — n/a.
5. **Clinical meaningfulness.** NEWS2 risk banding matches the published RCP NEWS2
   trigger levels; as a KPI it inherits every upstream completeness defect. Immortal-
   time/staleness threat: no expiry on "latest".
6. **Baseline timing.** Not baseline-bound.
7. **Verdict: VALIDATE** — banding is plausibly standard, but may only ship bound to a
   versioned rule artifact, a staleness/expiry policy, and evaluation status.
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## KPI-DASH-06 — Derived bed severity (Severidade do leito / bed severity)

1. **Name and location.** `services/dashboard.py:93-115` (`derive_bed_severity`),
   consumed at `:360-368`; schema default `schemas/dashboard.py:84-88`. Rendered as
   the bed card colour/status (`frontend-v3/components/dashboard/bed-card.tsx`,
   `severity-dot.tsx` — pointers).
2. **Definition as implemented.** `max(active-alert severity, active-pathway
   severities, MEWS threshold band, NEWS2 threshold band)`, floor `normal`
   (`dashboard.py:114-115`). Pathway severity defaults to `"normal"` when null
   (`dashboard.py:353`). Patient/bed level, instantaneous, no freshness filter.
3. **Evaluation-status handling — SM-03/HAZ-0005 VIOLATION.** Identical mechanism to
   KPI-DASH-02 (same decisive lines, 100-115 and schema :88): absence of evaluation is
   rendered in the severity vocabulary as `normal`. This is the exact defect class the
   V2 evaluation-status algebra exists to make unrepresentable (SAF-0001/0002).
4. **PPV** — n/a.
5. **Clinical meaningfulness.** This is the primary at-a-glance clinical display —
   HM-03(b) (non-valid states rendered in reassuring visual vocabulary, target zero)
   is violated structurally for every unevaluated bed.
6. **Baseline timing.** Not baseline-bound.
7. **Verdict: SUPERSEDE** — the V2-native design (severity readable only when status
   is `valid`/approved-`partial`, `evaluation-status-semantics.md` §2) replaces this
   derivation. Documented for context only; the max-severity composition idea (P0-10
   highest-severity-wins, `dashboard.py:179,203-205`) is the one preserved concept —
   it is the status-level precedence analogue and may inform V2's aggregation
   ordering. PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## KPI-DASH-07 — Score trend (Tendência MEWS/NEWS2 / score trend)

1. **Name and location.** Computed at scoring time and persisted on
   `ClinicalScore.trend`; the trend function is `services/mews.py:229-247`
   (`compute_trend`: last vs first of a consecutive-score list; returns
   `increasing | decreasing | stable`, or `None` with fewer than the minimum samples).
   Displayed per bed (`schemas/dashboard.py:81-82`; `frontend-v3` score-pair
   component — pointer). A separate, more rigorous projection exists in
   `services/deterioration_trend.py:38-70` (12 h window, minimum 3 points, R² floor,
   "sem dado, sem previsão" documented at :45).
2. **Definition as implemented.** Direction sign of (last − first) over a score list;
   no window control at the display site; no magnitude.
3. **Evaluation-status handling.** `None` below minimum samples — honest null. But a
   trend computed across scores of mixed completeness inherits the coerce-to-zero
   scoring defect upstream.
4. **PPV** — n/a.
5. **Clinical meaningfulness.** First-vs-last is noise-sensitive (a single artifactual
   endpoint flips it). The repo itself contains the better-specified alternative
   (`deterioration_trend.py`) with explicit no-data and confidence semantics.
6. **Baseline timing.** Not baseline-bound.
7. **Verdict: TRANSFORM** — keep "trend" as a display concept; redefine on statused,
   windowed data with explicit insufficient-data state (the `deterioration_trend.py`
   constants block is a reasonable starting sketch, not an approved method).
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## KPI-DASH-08 — Vitals staleness indicator (Indicador de dados antigos / staleness)

1. **Name and location — CLIENT-SIDE COMPUTED METRIC (finding).**
   `frontend-v3/lib/vitals-staleness.ts:44-60` (`computeStaleness`; tiers `fresh` <30
   min, `watch` 30-59 min, `stale` ≥60 min — constants at :25-26), consumed by
   `frontend-v3/components/dashboard/bed-card.tsx:41,113-120`. Input `last_vital_at`
   from `services/dashboard.py:371-388` — which **falls back to
   `PatientCache.synced_at` when a patient has no vitals row at all**
   (`dashboard.py:384-388`).
2. **Definition as implemented.** Age in whole minutes of the newest vital (or of the
   cache sync when no vitals exist), banded client-side; future timestamps and parse
   failures return `null` (indicator disappears entirely — absence of the staleness
   warning when the timestamp is invalid).
3. **Evaluation-status handling.** Staleness is exactly the `stale` dimension of the
   V2 status algebra, here computed in the browser from a timestamp whose fallback
   (`synced_at`) is not a clinical measurement time. A patient with no vitals ever can
   display a "fresh" indicator if the cache row synced recently — misattributed
   freshness (violates `evaluation-status-semantics.md` §3.4: staleness computed from
   source clinical time, never from receipt/sync time). The related patient-detail
   fallback (`services/dashboard.py:503-542`) serves the 50 most recent rows
   *regardless of age* when the 24 h window is empty; the staleness module's own
   header (:1-7, BUG-F3-01) documents that this data was previously rendered
   indistinguishable from live data.
4. **PPV** — n/a.
5. **Clinical meaningfulness.** Maps to SM-05/HM-03. Thresholds 30/60 min are
   unreferenced constants.
6. **Baseline timing.** Not baseline-bound.
7. **Verdict: TRANSFORM** — staleness must be a server-side evaluation-status output
   (per-input freshness windows, per rule version), never a client-side afterthought;
   the `synced_at` fallback must not be imported. PROPOSAL — AWAITING NAMED CLINICAL
   REVIEW (reviewer: rodaquino-OMNI).

---

## Test evidence (intent)

OBSERVED: `tests/test_dashboard.py` (hash above) exercises unit-count semantics,
`last_vital_at` source-of-truth (lines 136-238: latest-vital vs synced_at, including
the fallback), and NEWS2 band ordering (:21-29) — confirming the behaviours above are
intended, not accidental. No test asserts any behaviour for an unscored patient's
severity other than the normal floor.
