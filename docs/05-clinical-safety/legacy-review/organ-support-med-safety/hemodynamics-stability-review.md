---
id: LEGREV-OSMS-HEMO
title: Legacy review — hemodynamics + stability domain (12-alert evaluator, 27-criteria wrapper, catalog, pathway, seed, ADR-0023)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Forensic review of the legacy V1 hemodynamics/stability clinical content:
  domain_hemo.py (12 alert evaluators), domain_estabilidade.py (27-criteria
  count-scored wrapper), the runtime catalog hemodynamics.yaml, the pathway
  estabilidade.yaml, stability model/schema/API, migration 0017 and
  ADR-0023. All verdicts are PROPOSALS; nothing is imported.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: /Users/familia/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 below)
  section_or_lines: cited per finding
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy organ-support and medication-safety forensics reviewer (cycle 1, Task 1, wave 1b)
  transformation: read from source; summarized and analyzed; no content imported
  confidence: high (mechanical citations) / medium (clinical assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0019, HAZ-0021, HAZ-0022]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — hemodynamics + stability domain

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Guideline comparisons (SSC 2021 — Evans et al. Crit Care Med 2021;
> ANDROMEDA-SHOCK JAMA 2019; SEPSISPAM NEJM 2014; Rady 1994 shock index;
> Liu 2012 modified shock index; Jones JAMA 2010 lactate clearance) rely on
> trained knowledge, not re-fetched — VALIDATION REQUIRED throughout.

## 0. Artifacts and integrity (OBSERVED 2026-08-15; hashes match inventory)

| Artifact | SHA-256 |
|---|---|
| `src/intensicare/services/domain_hemo.py` | `163357983e65e12dd4df643b97e3ad0e1e1310d57914fdaef14ddd6b6918dc04` |
| `src/intensicare/services/domain_estabilidade.py` | `2c838c4fbb5c368b1e8a1d5a4c8d4b0b22d6458079a3198ca1a0f69ba2b0f7b8` |
| `src/intensicare/models/stability.py` | `a2a532b1b7933a3fd9a81bb472f07d9bd08efdd47f684ff4a3cda5c592b689d3` |
| `src/intensicare/schemas/stability.py` | `e59649a3a27845b970c2f96957c1e4f976056007e41e9ed134ab435f65f383f8` |
| `src/intensicare/api/v1/stability.py` | `0541fbb28cc9fd9267f89264f5715f63a929d1dea0f6da358c23c48afa8b07e0` |
| `docs/plan/_work/alerts/hemodynamics.yaml` | `ed09ce34e5e7dde099cff41d8821d642021083a431f5c302ca3a2de173496190` (rt) |
| `_work/alerts/pathways/estabilidade.yaml` | `bf61744c263f40f630931293fcf4fc95b90e573609390abee42d37c7b3c5bcc9` |
| `docs/plan/clinical/domains/hemodynamics.md` | `0a2355218582e4bb7a59f83e22c9e2d1334217fd7b366dc70a5cf874703b15de` (rt) |
| `alembic/versions/0017_seed_hemo_definitions.py` | `0afc04e82a64eb12485cb9a67c6308b124692fa84d73f155fdee79efe0c16b4a` (rt) |
| `docs/adr/0023-estabilidade-scoring-model.md` | `b828f25fcb72b983ac9288f408f346ca45ecc0e8ce50b724460049a50620f323` (rt) |

## 1. Implemented thresholds, verbatim (`domain_hemo.py`, 12 evaluators)

| Alert | Trigger (verbatim summary) | Severity | Lines |
|---|---|---|---|
| SHOCK-INDEX-01 | (SI=FC/PAS > 0.9 OR MSI=FC/PAM > 1.3) AND (lactate > 2 OR CRT > 3 s) | watch | 65-131 |
| LACTATE-CLEARANCE-02 | active resuscitation AND baseline lactate ≥2 AND (2h clearance <10% OR 6h lactate >2) | critical | 139-204 |
| VASO-ESCALATION-03 | dose>0 AND (dose > 1.5× 2h-ago OR any of vasopressin/epinephrine/dobutamine newly >0) | urgent | 212-270 |
| REFRACTORY-SHOCK-04 | MAP < 65 AND norepinephrine-equivalent dose > 1.0 mcg/kg/min | critical | 278-323 |
| FLUID-NONRESPONSIVE-05 | balance>3000 AND ((PPV<10 or SVV<10) AND ΔSV<10%) OR (fluid challenge AND ΔMAP<5 AND Δlactate<5%) | watch | 331-391 |
| ANTIHTN-CONFLICT-06 | (antihypertensive AND (SBP<90 or DBP<60 or vaso>0)) OR (vaso==0 AND (SBP>155 or DBP>90) AND no permissive indication) | watch | 399-467 |
| STABILITY-VASO-BALANCE-07 | norepinephrine started ≤6h AND cumulative balance < −2000 mL AND no ≥500 mL bolus ≤4h | urgent | 476-518 |
| STABILITY-LACTATE-SEPSIS-08 | lactate ≥2 AND antibiotic prescribed AND NO norepinephrine AND no MV ≤24h | watch | 527-576 |
| STABILITY-HIGH-NORAD-09 | norepinephrine > 0.5 mcg/kg/min AND (vasopressin absent OR hydrocortisone absent) | critical | 585-632 |
| STABILITY-REFRACTORY-10 | norepinephrine > 0.5 AND vasopressin > 0 AND epinephrine absent | critical | 641-683 |
| STABILITY-DOBUTAMINE-11 | norepinephrine > 0.5 AND dobutamine > 0; urgent if FC > 130, else watch (fires on combo alone when FC absent) | urgent/watch | 692-742 |
| STABILITY-CRT-NORAD-12 | CRT > 3 s AND active norepinephrine | watch | 751-790 |

All vasopressor doses are canonical mcg/kg/min (docstring 9-13) — the module
explicitly retires the legacy unconvertible mL/h thresholds
(RULE-ESTABILIDADE-007/008/009's >20/>50/>70 mL/h family), recording the
institutional-concentration item as open (line 609, metadata line 629).

Assessment against trained references: MAP 65 (SSC 2021 / SEPSISPAM), CRT 3 s
(ANDROMEDA-SHOCK, replacing legacy manual C1's > 5 s), SI > 0.9 (Rady),
lactate-clearance 10%/2h (Nguyen/Jones lineage), NE > 0.5 adjunct trigger
(SSC-adjacent) are all plausible and internally consistent. Docstring-only
persistence windows ("sustained > PT15M/PT30M") are not implemented in the
evaluators — prose-only guards, same defect family as respiratory.
"recurrent_hypotension/hypertension" in ANTIHTN-06 are computed from a
single reading (naming overstates persistence).

## 2. The stability wrapper (`domain_estabilidade.py`) — count-as-severity

27 criteria = 12 alert-backed + 12 directly-evaluated (lactate >2; lactate
≥4; SvO2 <65%; ΔPCO2 >6; CI <2.2; FC >130; MAP <65; balance>+3000;
cumulative <−2000; PPV/SVV>13 with ΔSV<10; Δlactate >0.5/h; 6h lactate >2)
+ 3 combined (≥2 domains altered; worsening ≥2 domains/6h; instability >6h).

```python
# domain_estabilidade.py:463-473
score = count(criteria with status warning|critical)   # 0-27
0-3  -> "estavel"    4-9 -> "atencao"    >=10 -> "critico"
```

Defects (verbatim-anchored):

1. **Criterion-level "critical" does not lift aggregate severity.** A patient
   whose only positive criterion is REFRACTORY-SHOCK-04 (MAP<65 on NE >1.0 —
   an emergency) scores 1/27 → severity "estavel" with recommendation
   "Manter monitorização de rotina" (497-501). Count-as-severity masks
   singular emergencies — the same pattern the alert-threshold-engine review
   REJECTed at RULE-ALERTAS-003, reproduced here at 27-criterion scale.
2. **HAZ-0005 textbook recurrence.** Every direct evaluator returns
   `(False, "sem dados")` on missing input (e.g. 250-257, 270-279,
   316-323); evaluator exceptions are caught and coerced to
   `fired=False` (566-570). A patient with **no hemodynamic data at all**
   scores 0/27 → "ESTÁVEL: 0/27 … monitorização de rotina" — absence
   coerced to stable, with even error states scored as normal.
3. **Severity vocabulary drift**: `estavel/atencao/critico` instead of the
   canonical normal|watch|urgent|critical of `schemas/severity.py`; the
   schema contract (`schemas/stability.py:21` "score 0-27") bakes the count
   in.
4. `_eval_delta_lactate_gt_05` defaults the sampling interval to 6 h when
   unknown (371-374), diluting the mmol/L/h rate up to 6× for closer draws —
   silent under-detection of rapidly rising lactate.
5. 7-day trend = first-vs-last score ±1 (707-717) — display heuristic only.

`api/v1/stability.py` gates synthetic data behind `?demo=true` with a
documented default of real VitalSign/LabResult queries — the correct pattern
(contrast the ventilation API; cross-ref respiratory record).

## 3. Catalog, pathway, seed, ADR

- `hemodynamics.yaml` declares **6** alerts / 34 vectors / 11 citations —
  alerts 07-12 (the WAVE-3A stability family) exist **only in code**, with
  in-code definitions absent too (`HEMO_ALERT_DEFINITIONS` lists 6,
  858-927); migration 0017 seeds the same 6. Half of the running hemo alert
  surface has no catalog entry, no test vectors, and no definition version
  (HAZ-0019; ADR-0022 INV-3 violation, same pattern as respiratory).
- `estabilidade.yaml` pathway (id 5): MAP [0,55) critical / [55,65) urgent /
  ≥65 normal; FC <50 critical, 100-130 watch, ≥130 urgent; lactate ≥4
  critical, 2-4 watch — internally coherent and roughly consistent with the
  catalog thresholds; note MAP 60 is urgent here but only feeds "critico"
  aggregation through counts in the wrapper.
- Migration 0017 seed descriptions match the catalog (real citation strings
  embedded); spec_hash values are the same placeholder-format family
  (`he01a1b2c3d4e5f6` etc.) — not content hashes.
- ADR-0023 (accepted): threshold-based MVP with ML as post-MVP advisory
  overlay; documents the legacy manual pathway's "count-to-color
  aggregation" as context. The ADR's discrete watch/urgent/critical band
  model is what the *catalog* implements; the wrapper's 0-27 count-severity
  is an extra layer the ADR does not sanction.

## 4. HAZ-0005 zero-coercion assessment

| Path | Behavior on absent input | Assessment |
|---|---|---|
| `domain_hemo` evaluators | missing member → no fire | opacity only (no numeric coercion); no evaluation-status contract |
| DOBUTAMINE-11 FC gate | missing FC → still fires at watch | conservative direction (fires more, not less) — acceptable |
| ANTIHTN-06 `dose_vaso` default 0 | unrecorded vasopressor treated as 0 → Branch B can mislabel uncontrolled HTN | absence-as-zero on a medication input |
| `domain_estabilidade` direct criteria | "sem dados" → not-met → score 0 contribution | **HAZ-0005 recurrence** — absence scored as stability |
| evaluator exception handler | error → not-met | errors scored as stability |
| stale auto-resolve (`domain_hemo:833-850`) | watch/urgent auto-resolve when stale | HAZ-0006/0022, same as sibling modules |

## 5. Verdicts (all PROPOSAL)

| Artifact / path | Verdict | Rationale |
|---|---|---|
| SHOCK-INDEX-01, LACTATE-CLEARANCE-02, VASO-ESCALATION-03, REFRACTORY-SHOCK-04, FLUID-NONRESPONSIVE-05, CRT-NORAD-12 | VALIDATE | guideline-plausible, catalog-backed, mcg/kg/min-canonical; persistence guards must move into code |
| ANTIHTN-CONFLICT-06 | REFINE | single-reading "recurrent" naming; dose-default-0 input |
| STABILITY-VASO-BALANCE-07, LACTATE-SEPSIS-08, HIGH-NORAD-09, REFRACTORY-10, DOBUTAMINE-11 | VALIDATE (logic) / REJECT (governance state) | corrected re-derivations of the defective legacy mL/h rules — but running unversioned, uncataloged, unvectored |
| `domain_estabilidade.py` aggregate (score/severity) | REJECT | count-as-severity masks singular emergencies; absence and errors scored as stable (HAZ-0005); non-canonical severity vocabulary |
| 27-criteria checklist concept | TRANSFORM | the criterion inventory is clinically useful as a structured review panel, never as a severity aggregate |
| `hemodynamics.yaml` catalog | VALIDATE | strong for its 6 alerts; must be extended to cover 07-12 or those alerts retired |
| `estabilidade.yaml` pathway | VALIDATE | bands coherent; MAP/FC/lactate cuts plausible |
| `domains/hemodynamics.md` spec | VALIDATE | consistent with catalog (spot-checked thresholds) |
| migration 0017 | VALIDATE (content) / REJECT (spec_hash + coverage) | placeholder hashes; covers half the runtime surface |
| stability model/schema/API | REFINE | schema hard-codes the 0-27 count contract; API demo-gating is the correct pattern to keep |
| ADR-0023 | ARCHIVE (reference) | decision reasoning sound; ML-overlay open questions (ANVISA SaMD classification) must re-enter V2 governance |

**Worst finding:** the stability wrapper converts 27 criteria into a
count-based severity in which one active *critical* criterion — or a patient
with no data, or an evaluator crash — all render as "ESTÁVEL / routine
monitoring": the predecessor system's confirmed HAZ-0005 failure mode
rebuilt at aggregate scale, on top of six clinically live alerts that exist
in no registry.
