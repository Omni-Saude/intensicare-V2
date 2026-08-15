---
doc_id: LEGREV-KPI-INVENTORY
title: Legacy KPI inventory — master index and cycle-1 Task 1 review summary
status: PROPOSAL
label: OBSERVED (inventory) + PROPOSAL (all verdicts)
owner: UNASSIGNED — VALIDATION REQUIRED
reviewer: rodaquino-OMNI
source: /Users/familia/intensicare (legacy V1, READ-ONLY), pinned per docs/archive/legacy-provenance/legacy-pin-cycle-1.md
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare (legacy V1)
  path_or_url: whole-repo KPI sweep — see per-domain records in this directory
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin)
  date_collected: 2026-08-15
  collector: legacy clinical-KPI forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: inventory compiled from the four per-domain review records in this directory
  confidence: high for code-backed entries; medium for catalog-only rules
  validation_status: VALIDATION REQUIRED — every verdict is PROPOSAL — AWAITING NAMED CLINICAL REVIEW
---

# Legacy KPI inventory — master index (cycle 1, Task 1)

**Purpose.** Complete, source-verified inventory of every KPI/metric the legacy V1
system computes or displays, with per-KPI review records. This is the evidence base
for the Task 3 keep/drop/redefine policy
(`docs/05-clinical-safety/pathway-portfolio/clinical-kpi-review.md` — **not written
here**; a separate KPI methodologist authors it from these records).

**Method.** Assigned sources read in full (`services/dashboard.py`,
`domain_eficiencia.py`, `domain_operacional.py`, `ppv_tracker.py`, `core/metrics.py`,
`schemas/dashboard.py`, `api/v1/efficiency.py`), extended by grep for
`metric|kpi|indicador|taxa|tempo` (adding `api/v1/indicators.py`,
`api/v1/dashboard.py`, `api/v1/alerts.py`, `services/mews.py` trend,
`services/deterioration_trend.py`, frontend dashboard components, KPI tests), plus the
KPI-defining rules of `docs/rules/billing-administrative/`,
`docs/rules/scheduling-operational/`, and grep-extended `INDICADORES-ETL` rules.
Every cited file hashed and checked against
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`; files absent from the
manifest (frontend-v3 components, tests) carry hash-and-note SHA-256 values in the
per-domain records. Software telemetry (`core/metrics.py`) identified and excluded
from clinical review with a boundary note.

**Every verdict below is PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer:
rodaquino-OMNI).** Nothing in this directory authorizes import
(`docs/00-governance/legacy-import-policy.md` §3).

## 1. Inventory by domain

28 reviewed KPI/metric entries (counting the 31-indicator catalogue as one mechanism
entry plus its listed members), across five domains:

| Domain | Record file | Entries | IDs |
|---|---|---|---|
| Bed-grid dashboard | `kpi-bed-grid-dashboard.md` | 8 | KPI-DASH-01..08 |
| Indicators catalogue (31 mock indicators + summary) | `kpi-indicators-catalogue.md` | 2 mechanism entries (31 catalogued members tabulated) | KPI-IND mechanism + catalogue |
| Efficiency & stewardship | `kpi-efficiency-stewardship.md` | 5 | KPI-EFF-01..05 |
| PPV / alert precision | `kpi-ppv-tracker.md` | 2 (PPV, fatigue-rate) + resolve-endpoint capture | KPI-PPV-01 (a-e findings) |
| Operational/time-window + extracted ETL rules | `kpi-operational-time-and-etl-rules.md` | 3 code building blocks + 12 catalog rules reviewed/pointered | KPI-OPS-01..03 + rules table |

## 2. SM-03 / HAZ-0005 violations as implemented

The SM-03 rule (`docs/01-vision-and-intended-use/success-and-harm-metrics.md`):
compute only over `valid` patient-time; report non-valid patient-time as a separate
denominator. HAZ-0005 lens: does absence of evaluation read as normal/compliant?

**9 KPI entries violate the rule as implemented:**

| # | KPI | Violation | Decisive lines |
|---|---|---|---|
| 1 | KPI-DASH-02 critical_count | Unscored patient floors to `normal`, counted as non-critical | `src/intensicare/services/dashboard.py:100-115` (esp. 115); `schemas/dashboard.py:88` |
| 2 | KPI-DASH-06 derived bed severity | Same mechanism — absence rendered in severity vocabulary as `normal`; no staleness cut on "latest" score | `services/dashboard.py:93-115,209-265` |
| 3 | KPI-DASH-08 staleness indicator | Freshness computed client-side from a timestamp that falls back to cache `synced_at` — a patient with no vitals can show "fresh" | `services/dashboard.py:384-388`; `frontend-v3/lib/vitals-staleness.ts:44-60` |
| 4 | KPI-EFF-01 transfusion appropriateness | TF-003/TF-006 met with no data (absence-as-compliance); TF-002 direction inverted | `services/domain_eficiencia.py:310-311,356-357,290-304,479` |
| 5 | KPI-EFF-02 restraint criteria | `duration_hours` defaults 0 → `duration_within_limit=True` with no data | `domain_eficiencia.py:503-506,521-524` |
| 6 | KPI-EFF-04 LOS outlier | `days` defaults 0 → "dentro do esperado" with no admission data | `domain_eficiencia.py:588,594-598,231-237` |
| 7 | KPI-EFF-05 efficiency endpoint | Serves a full fabricated assessment from empty inputs for any mpi_id | `api/v1/efficiency.py:250-258` |
| 8 | KPI-PPV-01 PPV + fatigue targets | Targets report "met" with < 10 resolutions ("assume OK initially"); tracker is additionally dead code, so targets are permanently green | `services/ppv_tracker.py:142-153`; wiring absence per `kpi-ppv-tracker.md` §1.4(a) |
| 9 | KPI-IND indicators catalogue + summary | The limiting case: 31 clinical indicators served as `random` values generated inside their own target ranges; "alerts_out_of_range" is a random draw | `api/v1/indicators.py:366-368,394-408,521` |

**Worst single example:** `src/intensicare/services/dashboard.py:100-115` —
`derive_bed_severity` documents and implements "a bed with no alerts, no active
pathways, and no scores is still `normal`" (floor at line 115), feeding both the bed
colour and the headline "N críticos" figure. It is the operational KPI restatement of
HAZ-0005, the hazard log's highest-priority entry. (The indicators catalogue is a
*grosser* falsification but reaches fewer clinical eyes — no frontend-v3 consumer was
located; the bed grid is the primary clinical display.)

Honest-state counter-example, for preservation: frailty scoring returns
`{"category": "não avaliada", "assessed": false}` on missing CFS
(`domain_eficiencia.py:545-551`) — the only explicit not-assessed state found in the
legacy KPI surface.

## 3. PPV-tracker verdict (summary — full mechanism review in `kpi-ppv-tracker.md`)

The tracker computes TP/(TP+FP) where "TP" includes `intervention_done` (clinician
action counted as alert correctness), adjudicated solely by the resolving clinician's
own label at the resolve endpoint, over the biased subset of alerts anyone resolved
with feedback, in memory since process start — and it is **not wired to anything**:
no production path calls it, and its target properties return "met" below 10
resolutions, so it permanently reports both targets green on zero data. The measured
quantity is not PPV in any clinically defensible sense. Verdict: **SUPERSEDE** the
computation with SM-03's adjudicated design; **REJECT** the "fatigue rate" construct
(FP-share ≠ fatigue; HM-02 defines the real composite) and the assume-OK-below-n
target logic as a recorded anti-pattern; **REFINE** only the resolution-label capture
(`api/v1/alerts.py:420-430`) as a feedback signal, never ground truth.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 4. Pre-deployment-baseline flags (G2-VAL-0025 / VAL-0035)

KPIs whose V2 successors are meaningless or unauditable without a baseline captured
**before any deployment** (the one irreversible scheduling item):

| KPI | Reason |
|---|---|
| KPI-DASH-03 active_alerts_total (→ SM-04 alert burden) | Alert burden is explicitly in VAL-0035's unobtainable-after-deployment list |
| KPI-PPV-01/-02 (→ SM-03 precision, HM-02 fatigue) | Fatigue and total alarm environment baselines are pre-deployment-only |
| KPI-DASH-02 critical census | Pre-V2 acuity/alarm display environment is part of the same baseline study scope |
| Sector alert counts feeding RULE-INDICADORES-ETL-001/-002 | Same alert-burden family |
| ind-safe-001, ind-safe-003 (notification-based safety rates) | Reporting culture changes with deployment; pre-V2 reporting rate unrecoverable |
| ind-other-003 (FS-ICU 24 family satisfaction) | Survey-based; pre-V2 state only measurable before deployment |

Remaining catalogue indicators are marked ⏱ (retrospectively reconstructable from EHR
in principle, pending `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY`) in
`kpi-indicators-catalogue.md` §3.

## 5. Verdict tally (all PROPOSAL — AWAITING NAMED CLINICAL REVIEW)

| Verdict | Count | Entries |
|---|---|---|
| RETAIN | 0 | — |
| REFINE | 5 | KPI-DASH-01, KPI-DASH-04, KPI-EFF-03, KPI-OPS-01, RULE-DOCUMENTACAO-FATURAMENTO-019; plus resolution-label capture (sub-verdict of KPI-PPV-01) |
| TRANSFORM | 8 | KPI-DASH-02, KPI-DASH-03, KPI-DASH-07, KPI-DASH-08, KPI-EFF-01, KPI-EFF-02, RULE-INDICADORES-ETL-001/-002 (pair), RULE-INDICADORES-ETL-018 |
| VALIDATE | 5 | KPI-DASH-05, KPI-EFF-04, KPI-OPS-02, RULE-INDICADORES-ETL-005, RULE-INDICADORES-ETL-023 (the six macro-KPI names) |
| SUPERSEDE | 3 | KPI-DASH-06, KPI-PPV-01 (PPV computation), RULE-INDICADORES-ETL-013 |
| REJECT | 6 | KPI-IND mechanism (mock catalogue + summary), KPI-EFF-05, KPI-PPV fatigue-rate construct + assume-OK target logic, KPI-OPS-03 (`get_number`), RULE-INDICADORES-ETL-007 (as-is), RULE-INDICADORES-ETL-014 |
| Out of scope (pointered) | 3 | `core/metrics.py` telemetry; RULE-INDICADORES-ETL-006 (alerts reviewer); RULE-DOCUMENTACAO-FATURAMENTO-002 (billing) |

## 6. Client-side-computed metrics (findings)

1. Vitals staleness tiers — `frontend-v3/lib/vitals-staleness.ts` (KPI-DASH-08).
2. Sector alert-share and assisted-share percentages — DashboardCard.tsx per
   RULE-INDICADORES-ETL-001/-002 (previous-generation frontend; primary not mounted).
3. Occupancy colour banding — client thresholds per RULE-INDICADORES-ETL-005.
4. Evolution-note count-by-type — frontend util per RULE-DOCUMENTACAO-FATURAMENTO-019.

Per `evaluation-status-semantics.md` §6 ("status never inferred client-side") all
V2 successors must compute these server-side on statused data.

## 7. Not located / cannot review

Recorded in full in `kpi-operational-time-and-etl-rules.md` §4:

1. Primary sources `ahlabs-trilhas @ 8166c07e` and `trilhas-frontend @ f9656be2`
   (extracted-rule catalog primaries) — not mounted anywhere in the pinned tree.
2. Formulas for the six macro indicators (`vidas_salvas`, `obitos`,
   `tempo_permanencia`, `tx_mortalidade`, `tx_ocupacao`, `admissao`) — computed in
   upstream Tasy Oracle objects. **SOURCE NOT LOCATED — cannot review.**
3. Server-side `ocupacao` percentage formula. **SOURCE NOT LOCATED — cannot review.**
4. `total_assistidos` / `total_leitos_ocupados` counting rules (primary unmounted;
   related assistance semantics pointered to the alerts reviewer).
