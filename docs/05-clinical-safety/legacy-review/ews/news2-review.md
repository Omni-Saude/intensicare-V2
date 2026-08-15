---
id: LEGREV-EWS-NEWS2
title: Legacy review record — NEWS2 as implemented in IntensiCare V1 vs RCP NEWS2 (2017)
label: PROPOSAL
statement: >
  Forensic review of every NEWS2 score, rule, and threshold implemented in the legacy
  V1 repository, verified from source code at the cycle-1 pin, against the published
  Royal College of Physicians NEWS2 (2017) definition verified from the issuer's report.
  Verdict is a PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY) + intensicare-V2 + rcp.ac.uk
  path_or_url: /Users/familia/intensicare (see per-file citation table, section 0)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin; per-file SHA-256 below)
  section_or_lines: per-citation line references throughout
  date_collected: 2026-08-15
  collector: legacy EWS forensics reviewer (cycle-1 Task 1 agent); accountable reviewer rodaquino-OMNI
  transformation: verbatim code excerpts plus reviewer analysis; published bands transcribed from issuer PDF
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003]
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# NEWS2 — legacy review record (cycle 1, Task 1)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> This record reviews; it approves nothing. Verdict vocabulary per
> `docs/00-governance/legacy-import-policy.md` §4. Candidate: **CAND-0001**
> (`docs/05-clinical-safety/pathway-portfolio/candidate-inventory.md`).

## 0. Citation base — files and hashes

All legacy paths are relative to `/Users/familia/intensicare/` at HEAD
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79` (2026-08-15). Files marked **[pin]** match
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`; files marked **[reviewer-hash]**
are **not in that manifest** and were hashed by this reviewer at review time
(`shasum -a 256`, 2026-08-15) — OBSERVED.

| File | SHA-256 | Manifest |
|---|---|---|
| `src/intensicare/services/news2.py` | `d3399fe2bb9853222dde6b16167a4f6093c6daac7b1559474b628deeff246bc8` | [pin] |
| `src/intensicare/services/ews_nrt_runner.py` | `9ad826e9e31be584a17285a721697243e8654d9209ca68b9abec1230ed3c7fe6` | [pin] |
| `src/intensicare/services/vitals.py` | `dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64` | [pin] |
| `src/intensicare/services/threshold_resolver.py` | `0b02d8ace9bdc89695eeaa2e08d81b2a72070c27624265190b2005883c20ee6f` | [pin] |
| `src/intensicare/services/dashboard.py` | `ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489` | [pin] |
| `src/intensicare/models/clinical_score.py` | `fc987ad0d037b1f153451240178dc12ab988a1104d7bc4a88dc460972234ff43` | [pin] |
| `src/intensicare/schemas/vitals.py` | `f6afffd444038f2d1dec19d7047a0013f908d9a7106c52ce9895cbc1ba14308f` | [pin] |
| `alembic/versions/0038_seed_default_threshold_config.py` | `c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486` | [pin] |
| `src/intensicare/mllp_listener.py` | `2aaf592bf5855205aaf816c04386457ab7ee54158f3d7037df4d30cbb7543d94` | [reviewer-hash] |
| `alembic/versions/0008_seed_news2_v2_0_0.py` | `cb98588ea4460b355c2c3ac84d314c838f405903150b7019392e9a69db0d51c6` | [reviewer-hash] |
| `alembic/versions/0021_activate_news2_v3_0_0.py` | `2874d0306946472838a612ca73d78a311e8885cdbf5c11bf28172fcc36db15f4` | [reviewer-hash] |
| `alembic/versions/0029_ratification_record.py` | `cfd0e7e40d62f628fa6335018a547a6d418931ce5861f239bb3f2f5f7ce1afbe` | [reviewer-hash] |
| `docs/plan/_work/alerts/early-warning-scores.yaml` | `712d9ccde209d099f80c4d5abb11e77e33564e03f347f931a363537c1031e9b8` | [reviewer-hash] |
| `docs/audit/fullspectrum/CLINICAL_SIGNOFF.md` | `7499a00ddfa6309f0190177d9474ba8e0db781d515bd3cbe72b890e74c178f91` | [reviewer-hash] |
| `tests/test_news2.py` (intent evidence only) | `bbf8aaf7261f6e19659d7f7638d7cc988385ef00e317a5fc238f8f64a9e4ced0` | [reviewer-hash] |
| `tests/test_ews_nrt.py` (intent evidence only) | `89091fe372bb90c2131491d63b6bbe1ae2356e38854ffaa777c951ade422bde8` | [reviewer-hash] |
| `tests/property/test_scorer_properties.py` (intent evidence only) | `154bc0b0aaa41392ce25f36df8a8a5fde277f15d01a7995cc96ac185b276e964` | [reviewer-hash] |

## 1. Formula as implemented (OBSERVED, from source)

Scoring engine: `src/intensicare/services/news2.py`. Seven components summed
(`calculate_news2`, news2.py:244-308): respiratory rate, SpO2, supplemental O2,
systolic BP, heart rate, consciousness (AVPU string), temperature. Version constant
`NEWS2_VERSION = "NEWS2-v3.0.0"` (news2.py:14).

Band engine (news2.py:76-98), verbatim core:

```python
def _score_numeric(value, thresholds):
    if value is None:
        return 0
    if isinstance(value, float):
        value = round(value, 1)
    for lo, hi, score in thresholds:
        lo_ok = lo is None or value >= lo
        hi_ok = hi is None or value <= hi
        if lo_ok and hi_ok:
            return score
    return 0
```

Implemented bands (all OBSERVED at the cited lines):

- Respiratory rate (news2.py:101-115): `<=8:3, 9-11:1, 12-20:0, 21-24:2, >=25:3`.
- SpO2 Scale 1, non-hypercapnic (news2.py:161-170): `>=96:0, 94-95:1, 92-93:2, <=91:3`.
- SpO2 Scale 2, `hypercapnic=True, on_o2=True` (news2.py:139-148):
  `>=97:3, 95-96:2, 93-94:1, <=92:0`.
- SpO2 Scale 2, `hypercapnic=True, on_o2=False` (news2.py:149-159):
  `>=93:0, 88-92:1, 86-87:2, 84-85:3, <=83:3`.
- Supplemental O2 (news2.py:173-175): `return 2 if on_o2 else 0`.
- Systolic BP (news2.py:178-192): `<=90:3, 91-100:2, 101-110:1, 111-219:0, >=220:3`.
- Heart rate (news2.py:195-210): `<=40:3, 41-50:1, 51-90:0, 91-110:1, 111-130:2, >=131:3`.
- Consciousness (news2.py:213-224): `None -> 0`; `"A" -> 0`; **any other string -> 3**.
- Temperature (news2.py:227-241): `<=35.0:3, 35.1-36.0:1, 36.1-38.0:0, 38.1-39.0:1, >=39.1:2`.
- Scale-2 selection (news2.py:275-284): `use_scale2 = hypercapnic`;
  `on_o2=bool(supplemental_o2)` is passed into `score_spo2`.
- Aggregate risk (news2.py:22-27, 51-58): `>=7 -> "high"`, `>=5 -> "medium"`, else `"low"`.
- Red-score property (news2.py:60-73): `requires_urgent_assessment` is true when total
  `>=5` **or** any of the six physiological components equals 3 (supplemental O2 excluded).

Production call sites (OBSERVED):

- Ingestion (vitals.py:310-334): `calculate_news2(..., hypercapnic=False, ...)` —
  hard-coded `False`; result persisted as `ClinicalScore(score_type="NEWS2",
  algorithm_version=NEWS2_VERSION, components=asdict(...))` (models/clinical_score.py:13-32).
- Alerting (vitals.py:396-398 → `alert_engine.process_clinical_score`): compares
  **aggregate only** against `threshold_config` watch/urgent/critical
  (alert_engine.py:50-59); NEWS2 defaults seeded watch=3, urgent=5, critical=7
  (0038_seed_default_threshold_config.py:61-70).
- NRT runner (ews_nrt_runner.py:206-224): aggregate computed with `hypercapnic=False`
  (ews_nrt_runner.py:209), but the per-parameter SpO2 red-score is computed as
  `score_spo2(vs.spo2, hypercapnic=bool(vs.supplemental_o2))` (ews_nrt_runner.py:220).
- **The NRT runner has no production caller.** `process_ews_nrt` /
  `process_ews_after_vital_insert` are imported only by tests (grep across
  `src/`, 2026-08-15 — OBSERVED); `ingest_vitals` never calls them despite the
  docstring instruction (ews_nrt_runner.py:685).
- Bed severity (dashboard.py:79-115): `derive_bed_severity` maps the NEWS2 aggregate
  through watch/urgent/critical bands and floors at `"normal"` — "a bed with no
  alerts, no active pathways, and no scores is still 'normal'" (dashboard.py:100-107).

## 2. Authoritative published definition (SOURCE, verified from issuer)

**Royal College of Physicians. *National Early Warning Score (NEWS) 2: Standardising
the assessment of acute-illness severity in the NHS.* Updated report of a working
party. London: RCP, 2017.** URL (issuer PDF, fetched and read 2026-08-15):
`https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf` (report pages 29-31,
35 = Chart 1, Chart 2, Chart 3).

Chart 1 (transcribed from the fetched PDF — SOURCE):

| Parameter | 3 | 2 | 1 | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|---|
| Respiration rate (per min) | ≤8 | | 9–11 | 12–20 | | 21–24 | ≥25 |
| SpO2 Scale 1 (%) | ≤91 | 92–93 | 94–95 | ≥96 | | | |
| SpO2 Scale 2 (%) | ≤83 | 84–85 | 86–87 | 88–92; ≥93 on air | 93–94 on oxygen | 95–96 on oxygen | ≥97 on oxygen |
| Air or oxygen? | | Oxygen | | Air | | | |
| Systolic BP (mmHg) | ≤90 | 91–100 | 101–110 | 111–219 | | | ≥220 |
| Pulse (per min) | ≤40 | | 41–50 | 51–90 | 91–110 | 111–130 | ≥131 |
| Consciousness | | | | Alert | | | CVPU |
| Temperature (°C) | ≤35.0 | | 35.1–36.0 | 36.1–38.0 | 38.1–39.0 | ≥39.1 | |

Chart 2 (SOURCE, verbatim structure): aggregate 0–4 = Low → ward-based response;
**red score (3 in any individual parameter) = Low–medium → urgent ward-based
response**; aggregate 5–6 = Medium → key threshold for urgent response; aggregate
≥7 = High → urgent or emergency response.

Scale-2 governance (SOURCE, report p.31): "A competent clinical decision-maker
should make the decision about whether to use the Scale 2 oxygen saturation
section of the NEWS chart, which is specific to patients with hypercapnic
respiratory failure (usually COPD) who require their 'usual' oxygen saturations
to be set at 88–92% ... the Scale 1 oxygen saturation section of the chart should
be clearly crossed out." Chart 3 footnote: "ONLY use Scale 2 under the direction
of a qualified clinician."

Population (SOURCE, report §2): "The NEWS was designed for use in patients aged
16 years and more and is not recommended for use in children aged under 16 years
or during pregnancy." Consciousness scores **new-onset** confusion ("no score if
chronic" — Chart 3).

**December 2022 clarification: NOT VERIFIED.** The RCP resource pages
(`https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/`, fetched
2026-08-15) surface a November 2022 *Clinical Medicine* special issue but no
December 2022 clarification document. No claim from it is used in this review.
VALIDATION REQUIRED if V2 wishes to cite it.

## 3. Discrepancy analysis — implemented vs published

Faithful (OBSERVED = SOURCE): respiratory rate; SpO2 Scale 1; supplemental O2 (+2,
oxygen vs air); systolic BP; pulse; temperature; consciousness Alert=0 / CVPU=3
(API path); aggregate cut-points 5 and 7. Float inputs are rounded to 1 decimal
before banding (news2.py:87-90), matching the chart's 0.1 °C resolution; band
comparisons are inclusive and contiguous — no gap defects found in Scale 1/RR/SBP/HR/temperature.

Discrepancies (D-1 … D-9):

| # | Item | Implemented | Published (RCP 2017) | Direction / severity |
|---|---|---|---|---|
| D-1 | Scale 2, hypercapnic **on O2**, low SpO2 | `<=92 -> 0` (news2.py:144-147) | ≤83→3, 84–85→2, 86–87→1, 88–92→0 (low bands apply regardless of oxygen) | **Under-scores profound hypoxaemia to 0** (e.g. SpO2 70% on O2 scores 0 vs published 3). Most dangerous single-band defect in the file. |
| D-2 | Scale 2, hypercapnic **off O2** | 88–92→1, 86–87→2, 84–85→3 (news2.py:150-159) | 88–92→0, 86–87→1, 84–85→2 | Over-scores by one band, including scoring the BTS 88–92% target range as abnormal (alarm-fatigue direction). ≤83→3 and ≥93 on air→0 match. |
| D-3 | Scale-2 selection mechanism | `hypercapnic` parameter exists but no ingestion surface supplies it: `schemas/vitals.py` has no such field (schemas/vitals.py:16-88); both call sites hard-code `hypercapnic=False` (vitals.py:313; ews_nrt_runner.py:209) | Scale 2 chosen by "a competent clinical decision-maker" and used for hypercapnic respiratory failure | **Scale 2 is unreachable in every production aggregate path.** A COPD/hypercapnic patient is always scored on Scale 1 (see §4.1). |
| D-4 | Scale-2 misselection in NRT red-param path | `score_spo2(vs.spo2, hypercapnic=bool(vs.supplemental_o2))` (ews_nrt_runner.py:220) — supplemental O2 selects Scale 2, and `on_o2` defaults False so the off-O2 Scale-2 bands apply | Supplemental oxygen never selects Scale 2 | Any on-O2 non-hypercapnic patient with SpO2 88–92 gets param score 1 instead of Scale 1's red 3 → **suppresses the single-red-parameter trigger**; also internally inconsistent with the aggregate (computed Scale 1) in the same snapshot. Dead code today (runner unwired) but a latent trap. |
| D-5 | Risk tiers | `low / medium / high` only (news2.py:51-58; re-derived at vitals.py:511-519) | Four tiers: 0–4 Low; **red score = Low–medium**; 5–6 Medium; ≥7 High | The Low–medium (single red) tier is absent from the persisted/exposed category; `requires_urgent_assessment` (news2.py:60-73) captures the trigger but has **no production caller** (grep 2026-08-15). |
| D-6 | Red-score alerting | Production alerting compares aggregate only (alert_engine.py:50-59). The red-parameter alert exists only in the unwired NRT runner (ews_nrt_runner.py:265-316) and in a design YAML (early-warning-scores.yaml:11-58) | Score of 3 in any single parameter → urgent ward-based review | Partially mitigated by default watch=3 (a single red raises aggregate to ≥3 → "watch" alert), but severity is misgraded (watch vs urgent) and the mitigation collapses if a tenant raises `watch_threshold` (threshold_resolver.py:50-117 allows per-bed/unit/tenant overrides with no floor). |
| D-7 | Consciousness via HL7 path | MLLP parser accepts only `A/V/P/U`; `"C"` → `None` (mllp_listener.py:200-204) → consciousness scores **0** (news2.py:219-220) | New confusion (C) scores 3 | **New-onset confusion arriving via HL7 ORU scores 0.** The API path is correct (`AVPU_VALUES` admits C, schemas/vitals.py:13; scorer gives 3). Path-dependent under-scoring. |
| D-8 | Consciousness fallback | Any non-"A" string → 3 (news2.py:221-224); GCS is collected (schemas/vitals.py:73) but never mapped to consciousness when AVPU is absent | ACVPU assessment; chronic confusion scores 0 ("no score if chronic", Chart 3) | Over-scoring direction for unrecognized tokens (fail-loud, acceptable); but chronic confusion cannot be represented, and a comatose patient with GCS recorded and AVPU absent scores 0 (ties into HAZ-0005). |
| D-9 | Population gating | None anywhere in the scoring/ingestion path (no age, no pregnancy checks — OBSERVED across news2.py, vitals.py, schemas/vitals.py) | Designed for ≥16 years; not for children <16 or pregnancy | Out-of-population output is produced silently. Feeds VAL-0006/VAL-0007 (`docs/02-users-and-workflows/g1-validation-backlog.md`). |

Version-identity finding (OBSERVED): migration 0008 and 0021 describe NEWS2-v2/v3
Scale-2 behavior as "supplemental_o2 now auto-activates Scale 2" and "84-85: score
2 → 3" claimed "per RCP 2017" (0008_seed_news2_v2_0_0.py:8-11;
0021_activate_news2_v3_0_0.py:7-12, 34-38), and 0029 records NEWS2-v3.0.0 as
ratified with that behavior (0029_ratification_record.py:13-15). Both claims
contradict the published chart (Scale 2 84–85 = 2; supplemental O2 never selects
the scale), and the **current** code has since inverted the auto-activation
(news2.py:118-122, 275-280) **without changing the version string** — so persisted
`algorithm_version = "NEWS2-v3.0.0"` does not identify the algorithm that actually
ran. `RAT-NEWS2-SCALE-2` does not appear in the approved table of
`docs/audit/fullspectrum/CLINICAL_SIGNOFF.md` (only MEWS and threshold items do),
so the Scale-2 "ratification" trail terminates in a migration docstring.
INFERENCE: the legacy ratification record for NEWS2 cannot be relied on.

## 4. NEWS2-specific mandatory assessments

### 4.1 SpO2 Scale 1 vs Scale 2 (hypercapnic respiratory failure)

- **Implemented at all?** Yes, in the scorer (news2.py:123-170) — both Scale-2
  branches exist.
- **How selected?** By a `hypercapnic: bool` function argument only. There is no
  patient flag, no order, no clinician workflow, and no ingestion field that can
  set it; every production call passes `False` (vitals.py:313; ews_nrt_runner.py:209).
  The RCP requirement of a documented decision by a competent clinical
  decision-maker has no counterpart.
- **What happens to a COPD patient scored on Scale 1?** OBSERVED consequence: a
  hypercapnic patient held at the BTS target 88–92% on O2 scores SpO2 3 (≤91) or
  2 (=92) plus 2 for oxygen — a chronic aggregate of 4–5 from being *at target*,
  i.e. systematic over-scoring/alarm-fatigue and a permanently red SpO2 parameter.
  Conversely, if the Scale-2 ON-O2 branch were ever reached, D-1 would score
  profound hypoxaemia 0. Both directions are clinically wrong; only the
  over-scoring direction is reachable today.

### 4.2 Supplemental-oxygen scoring

`+2 if on_o2 else 0` (news2.py:173-175) matches the published "Air or oxygen?"
row. Defect: `None` (unknown) is indistinguishable from "on air" — both score 0
(zero-coercion of an unknown; see §5).

### 4.3 Consciousness mapping

AVPU string; A=0, C/V/P/U=3 (news2.py:213-224) — matches published CVPU=3 on the
API path (ACVPU admitted, schemas/vitals.py:13). Defects: HL7 path drops "C" to
None → 0 (D-7); no GCS fallback (D-8); no chronic-vs-new confusion distinction;
`None` → 0 (§5).

### 4.4 Single-parameter red-score trigger

Present in three disconnected forms, none effective in production: property
`requires_urgent_assessment` (news2.py:60-73, no caller); NRT runner red-param
edge trigger (ews_nrt_runner.py:265-316, runner unwired); design YAML
ALERT-EWS-NEWS2-DETERIORATION-01 (early-warning-scores.yaml:11-58, "docs/plan"
tier). Production behavior is aggregate-threshold-only (D-6).

### 4.5 Aggregate trigger thresholds vs implemented alerting

Published 0 / 1–4 / 5–6 / ≥7 map to implemented category cut-points 5 and 7
(faithful) but alerting uses configurable watch=3 / urgent=5 / critical=7
(0038_seed_default_threshold_config.py:61-70; resolver bed ≻ unit ≻ tenant,
threshold_resolver.py:50-117). watch=3 is an institutional addition (not RCP);
the 5/6 and ≥7 severities align with medium/high. No floor prevents an operator
raising thresholds above the published trigger levels; mutations are audited
(threshold_resolver.py:120-150) but not clinically bounded.

## 5. HAZ-0005 zero-coercion — per-input trace (OBSERVED from source)

Mechanism verified from source, independently of the assessment cited in
`docs/05-clinical-safety/hazard-log.md` HAZ-0005.

| Input | Missing-input path | Behavior | Verdict |
|---|---|---|---|
| respiratory_rate | `_score_numeric(None,...)` → news2.py:84-85 `if value is None: return 0` | contributes 0, no marker | **zero-coerced** |
| spo2 | news2.py:134-135 `if spo2 is None: return 0` | contributes 0, no marker | **zero-coerced** |
| supplemental_o2 | news2.py:175 `return 2 if on_o2 else 0` — `None` is falsy | unknown ≡ "on air" ≡ 0 | **zero-coerced** |
| systolic_bp | news2.py:84-85 | contributes 0, no marker | **zero-coerced** |
| heart_rate | news2.py:84-85 | contributes 0, no marker | **zero-coerced** |
| avpu | news2.py:219-220 `if avpu is None: return 0` | contributes 0, no marker | **zero-coerced** |
| temperature | news2.py:84-85 | contributes 0, no marker | **zero-coerced** |

No missing-input metadata exists anywhere in the NEWS2 result:
`NEWS2Components` defaults every field to 0 (news2.py:30-40) and carries no
status; `calculate_news2` never inspects which inputs were None
(news2.py:282-302). The all-absent case therefore yields `total_score == 0`,
`risk_category == "low"` (news2.py:54-58), persisted as a real
`ClinicalScore` row (vitals.py:320-334) and rendered as bed severity
`"normal"` (dashboard.py:84-90, 114-115). Intent evidence: the test suite
*asserts* this behavior as correct — `test_missing_values_default_to_zero`
expects `total_score == 0` with every input None (tests/test_news2.py:477-486),
and every per-parameter test class has a `test_none_returns_zero`
(e.g. tests/test_news2.py:52-53). The response schema's claim "None se dados
insuficientes" (schemas/vitals.py:99-101) is false for the implemented path —
documented intent contradicts implementation.

**Decisive line: news2.py:84-85.** HAZ-0005 is CONFIRMED for NEWS2 for all
seven inputs, at E1 severity as logged.

## 6. Clinical verdict — PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)

**Verdict: TRANSFORM** (per `legacy-import-policy.md` §4), with element-level
REJECT and VALIDATE as below. Rationale (INFERENCE from §§3–5): the published
instrument was transcribed mostly faithfully at the band level, but the
implementation is unsafe as a whole — missing data is coerced to reassurance
(HAZ-0005, all seven inputs), the hypercapnic pathway is simultaneously wrong
(D-1, D-2) and unreachable (D-3), the red-score tier required by Chart 2 is not
delivered in production (D-5, D-6), ingestion paths disagree on consciousness
(D-7), there is no population gating (D-9), and the version/ratification trail is
unreliable (§3, version-identity finding). Nothing may be imported as code.

Elements proposed to survive into a V2 specification (as *specification content
re-derived from RCP 2017*, not as legacy code):

- The seven-parameter band tables that match the published chart (RR, SpO2
  Scale 1, air/oxygen +2, SBP, pulse, temperature, consciousness) — RETAIN as
  *published* content, re-specified from the RCP source with V2 acceptance tests.
- The 5 / 7 aggregate cut-points and the four-tier response model **including the
  Low–medium single-red tier** — RETAIN from the published chart.
- The float-rounding guard concept (round to chart resolution before banding)
  and the versioned `algorithm_registry` idea — REFINE (concept only; V1's
  version-identity practice is itself a counter-example).
- Edge-triggered/cooldown alerting design intent in early-warning-scores.yaml —
  VALIDATE (plausible alarm-fatigue reasoning; unimplemented, unvalidated).

Elements proposed REJECT: both implemented Scale-2 band branches (D-1, D-2);
`hypercapnic`-by-parameter selection with no clinical workflow (D-3);
supplemental-O2-as-hypercapnia in the runner (D-4); zero-coercion of every
missing input (§5); the "NEWS2-v3.0.0" ratification/version trail (§3).

Blocking V2 prerequisites (VALIDATION REQUIRED, not closable by any agent):
Scale-2 clinical selection workflow design; evaluation-status contract per
`evaluation-status-semantics.md` (a NEWS2 result with any missing input must be
`not_evaluated`/`partial` per approved policy, never 0); population gating
(VAL-0006/VAL-0007); per-input freshness windows (VAL-0023 — V1 applies none:
a vital-sign row is scored as an atomic unit regardless of which fields are
stale); threshold-floor governance for configurable alerting.
