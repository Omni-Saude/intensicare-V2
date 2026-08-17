---
doc_id: LEGREV-KPI-PPV
title: Legacy KPI review — PPV tracker and alert-fatigue rate (services/ppv_tracker.py)
status: PROPOSAL
label: OBSERVED (mechanism as implemented) + PROPOSAL (verdicts)
owner: UNASSIGNED — VALIDATION REQUIRED
reviewer: rodaquino-OMNI
source: https://github.com/Omni-Saude/intensicare (legacy V1, READ-ONLY), pinned per docs/archive/legacy-provenance/legacy-pin-cycle-1.md
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare (legacy V1)
  path_or_url: src/intensicare/services/ppv_tracker.py; src/intensicare/api/v1/alerts.py
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin)
  date_collected: 2026-08-15
  collector: legacy clinical-KPI forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: mechanism transcribed from code with line citations; verdicts are reviewer proposals
  confidence: high (hashes match pin manifest)
  validation_status: VALIDATION REQUIRED — every verdict is PROPOSAL — AWAITING NAMED CLINICAL REVIEW
---

# Legacy KPI review — PPV tracker (WO-036) mechanism review

All verdicts are **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)**.

## 0. Provenance

| File | SHA-256 | In pin manifest |
|---|---|---|
| `src/intensicare/services/ppv_tracker.py` | `da66f4aa946278618fb42684c1644feb4871e262fc742f96023d0992b1116783` | yes |
| `src/intensicare/api/v1/alerts.py` | `46d6b5042ac6acb76bfe01068f614e87a5c3bd7ececa4e3123ea8c2b35a3c939` | yes |
| `tests/test_ppv_tracker.py` | `a97a982c641155f4192266dd1b5663857de971aab1d0694e94b3e3803ad7e200` | no — hash-and-note |

## 1. KPI-PPV-01 — "PPV" (Valor preditivo positivo / alert positive predictive value)

1. **Name and location.** `src/intensicare/services/ppv_tracker.py` (class `PPVTracker`,
   `:66-354`; module singleton `:361`; convenience API `:364-386`). Stated targets:
   `PPV_TARGET = 0.60`, `FATIGUE_TARGET = 0.10` (`:60-63`). Emission designed for OTEL
   gauges/counters (`:224-311`). Snapshot intended "for API/dashboard use" (`:315-342`).
2. **Definition as implemented.** `ppv = TP / (TP + FP)` (`:127-132`) where **TP
   includes `intervention_done`** — `_POSITIVE_RESOLUTIONS = {"true_positive",
   "intervention_done"}` (`:56`), with the comment "action was taken (counts as TP for
   PPV)" (`:55`). FP = resolutions labelled `false_positive` (`:57`). Denominator
   excludes: unresolved alerts, acknowledged-but-never-resolved alerts, and any
   resolution string outside the three known values. Window: process lifetime —
   counters are in-memory and reset on restart (`:81-89`; `_started_at`); the
   docstring's "optional Redis sync for distributed deployments" (`:15`) has no
   implementation in this file. Aggregation: global singleton, with a per-severity
   TP/total breakdown (`:91-93,334-340`).
3. **Adjudication — who decides true/false positive.** The only production write path
   defined is the alert-resolve endpoint (`src/intensicare/api/v1/alerts.py:380-438`):
   the **resolving clinician selects one** of `true_positive | false_positive |
   intervention_done` (`alerts.py:74,420-425`) at resolution time. There is no blinded
   or independent adjudication, no outcome linkage, no reviewer identity requirement
   beyond authentication, and no later correction path.
4. **Mechanism review — is the measured quantity actually PPV? No.** Findings, each
   with decisive lines:
   - **(a) Not wired.** OBSERVED: no production code calls `record_resolution` /
     `record_alert_resolution` / `record_alert_created` — a repo-wide search finds
     references only in `ppv_tracker.py` itself and `tests/test_ppv_tracker.py`; the
     resolve endpoint stores `alert.resolution` (`alerts.py:428-430`) and never
     touches the tracker. The instrument is dead code: any PPV it ever reports
     derives from zero recorded events.
   - **(b) False-green targets.** `ppv_target_met` and `fatigue_target_met` return
     `True` whenever fewer than 10 resolutions exist — "Not enough data; assume OK
     initially" (`:142-153`). Combined with (a), the snapshot **permanently reports
     both targets as met**. `tests/test_ppv_tracker.py:41-45`
     ("with no data … target should be met by default") confirms this is intended.
     This is the zero-cases-validate-success pattern named as a stop condition in
     `success-and-harm-metrics.md` §0.
   - **(c) Treatment as ground truth.** Counting `intervention_done` as TP means
     "clinician acted" is scored as "alert was correct" — reflexive or defensive
     actions inflate PPV, and per `success-and-harm-metrics.md` HM-01, clinician
     response must never stand in for adjudicated outcome. Symmetrically, an ignored
     true alert resolved as `false_positive` deflates PPV; alert fatigue therefore
     *appears* as changing precision.
   - **(d) Denominator selection bias.** Only alerts that someone bothered to resolve
     with feedback enter the ratio; unresolved and abandoned alerts (plausibly the
     least useful ones) are excluded — the "evaluating only easy patient-time" gaming
     mode of `success-and-harm-metrics.md` §4 for SM-03 precision.
   - **(e) Internal inconsistencies.** `fatigue_rate = FP / total_resolved` where
     `total_resolved` increments for **any** resolution string, including invalid ones
     (`:167-186`; confirmed by `tests/test_ppv_tracker.py:355-360` "Invalid resolution
     strings should still be recorded (no validation)"), so junk strings deflate the
     fatigue rate; the computed `_ALL_FEEDBACK_RESOLUTIONS` set (`:58`) is never used
     to filter. `_interventions` is reported in the snapshot (`:332`) but never
     incremented — permanently 0. `record_batch` (`:202-220`) updates resolution
     counters but not `_total_alerts`. `emit_metrics_sync` (`:290-311`) `add()`s the
     *cumulative* TP/FP/total to monotonic OTEL counters on every call — repeated
     emission double-counts (quadratic growth); telemetry-side, noted and out of
     clinical scope.
5. **Clinical meaningfulness.** The intent maps directly to SM-03 (alert precision
   against adjudicated outcomes) and HM-02 (fatigue). As implemented it measures, at
   best, "share of feedback-labelled resolutions that clinicians chose to label
   positively, since last process restart" — and in practice, nothing (dead code).
   The 0.60 / 0.10 targets are unreferenced constants; adopting any threshold is an
   `AUTH-CLINSAFETY` decision.
6. **Baseline timing — FLAGGED 🚩.** Alert-precision and fatigue measurement both
   join VAL-0035 / G2-VAL-0025: the fatigue baseline (and total alarm environment) is
   unobtainable after deployment, and SM-03 requires a pre-registered adjudicated
   study, not runtime counters.
7. **Verdicts.**
   - **PPV computation and target logic: SUPERSEDE** — SM-03's design (blinded,
     pre-registered adjudication; precision computed only over `valid` patient-time;
     non-valid patient-time as a separate denominator) replaces this mechanism
     entirely. Documented for context; the false-green target default (finding b)
     must additionally be recorded as an anti-pattern (REJECT for re-use in any
     form).
   - **"Fatigue rate" construct: REJECT** — FP-share of feedback resolutions is not
     alert fatigue; HM-02 defines the real composite (dismissal drift, latency drift,
     validated instrument, bulk-dismissal rate).
   - **Resolution-label capture at the resolve endpoint (`alerts.py:420-430`):
     REFINE** — clinician feedback labels are worth keeping as a *feedback signal*
     with named-user attribution and timestamps, explicitly not as outcome ground
     truth.
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
