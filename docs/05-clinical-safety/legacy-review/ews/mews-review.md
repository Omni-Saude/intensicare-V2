---
id: LEGREV-EWS-MEWS
title: Legacy review record — MEWS as implemented in IntensiCare V1 vs Subbe et al. QJM 2001
label: PROPOSAL
statement: >
  Forensic review of every MEWS score, rule, and threshold implemented in the legacy V1
  repository, verified from source code at the cycle-1 pin, including identification of
  WHICH MEWS variant V1 implemented and comparison against the Subbe 2001 citation V1
  itself claims. Verdict is a PROPOSAL — AWAITING NAMED CLINICAL REVIEW
  (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY) + intensicare-V2 + academic.oup.com
  path_or_url: /Users/familia/intensicare (see per-file citation table, section 0)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin; per-file SHA-256 below)
  section_or_lines: per-citation line references throughout
  date_collected: 2026-08-15
  collector: legacy EWS forensics reviewer (cycle-1 Task 1 agent); accountable reviewer rodaquino-OMNI
  transformation: verbatim code excerpts plus reviewer analysis; publisher abstract verified online; primary Table 1 not retrievable (paywalled) — recorded honestly in section 2
  confidence: high for code observations; medium for published-table comparison (see section 2)
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

# MEWS — legacy review record (cycle 1, Task 1)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> This record reviews; it approves nothing. Verdict vocabulary per
> `docs/00-governance/legacy-import-policy.md` §4. Candidate: **CAND-0002**
> (`docs/05-clinical-safety/pathway-portfolio/candidate-inventory.md`).

## 0. Citation base — files and hashes

All legacy paths relative to `/Users/familia/intensicare/` at HEAD
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79` (2026-08-15). **[pin]** = in
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`; **[reviewer-hash]** = not in
that manifest, hashed by this reviewer 2026-08-15 (`shasum -a 256`) — OBSERVED.

| File | SHA-256 | Manifest |
|---|---|---|
| `src/intensicare/services/mews.py` | `43f7a8e17a31ea21f61ec53b2bcee68ff64067387c687e23714382f4737e922c` | [pin] |
| `src/intensicare/services/vitals.py` | `dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64` | [pin] |
| `src/intensicare/services/threshold_resolver.py` | `0b02d8ace9bdc89695eeaa2e08d81b2a72070c27624265190b2005883c20ee6f` | [pin] |
| `src/intensicare/services/dashboard.py` | `ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489` | [pin] |
| `src/intensicare/services/ews_nrt_runner.py` | `9ad826e9e31be584a17285a721697243e8654d9209ca68b9abec1230ed3c7fe6` | [pin] |
| `src/intensicare/services/deterioration_trend.py` | `61d80a379459f4769d5bf3ab14813f6985a0d00f038f349877d6382b85080870` | [pin] |
| `src/intensicare/models/clinical_score.py` | `fc987ad0d037b1f153451240178dc12ab988a1104d7bc4a88dc460972234ff43` | [pin] |
| `src/intensicare/schemas/vitals.py` | `f6afffd444038f2d1dec19d7047a0013f908d9a7106c52ce9895cbc1ba14308f` | [pin] |
| `alembic/versions/0038_seed_default_threshold_config.py` | `c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486` | [pin] |
| `alembic/versions/0007_seed_mews_v1_0_1.py` | `a14d9b244666d7dcf75be32418b828da86627d35ee3965027408e7dbdff966d8` | [reviewer-hash] |
| `alembic/versions/0020_activate_mews_v2_0_0.py` | `a8537f389dce039d707f59202c0df7f960c27c54b65e4ba20e37608600b256eb` | [reviewer-hash] |
| `alembic/versions/0039_activate_mews_v3_0_0.py` | `da08277a162847d121ce8024f78bea2997481416437820265cadeeaaf9465e23` | [reviewer-hash] |
| `src/intensicare/mllp_listener.py` | `2aaf592bf5855205aaf816c04386457ab7ee54158f3d7037df4d30cbb7543d94` | [reviewer-hash] |
| `docs/audit/fullspectrum/CLINICAL_SIGNOFF.md` | `7499a00ddfa6309f0190177d9474ba8e0db781d515bd3cbe72b890e74c178f91` | [reviewer-hash] |
| `tests/test_mews.py` (intent evidence only) | `a971ffc31f3c9ffffd3cfe861fae82e4914433a1660cf200e622a4f98ae443b6` | [reviewer-hash] |

## 1. Formula as implemented (OBSERVED, from source)

Scoring engine: `src/intensicare/services/mews.py`. Five components summed
(`calculate_mews`, mews.py:168-226): heart rate, systolic BP, respiratory rate,
temperature, AVPU. Version constant `MEWS_VERSION = "MEWS-v3.0.0"` with the
in-source note "RAT-MEWS-SUBBE-2001-R2 (pending clinical sign-off — ver migração)"
(mews.py:19).

Implemented bands (OBSERVED at the cited lines):

- Heart rate (mews.py:55-79): `<=39:2, 40-50:1, 51-100:0, 101-110:1, 111-129:2, >=130:3`.
- Systolic BP (mews.py:82-103): `<=70:3, 71-80:2, 81-100:1, 101-199:0, >=200:2`.
- Respiratory rate (mews.py:106-127): `<=8:2, 9-14:0, 15-20:1, 21-29:2, >=30:3`.
- Temperature (mews.py:130-148): `<35.0:2, 35.0-38.4:0, >=38.5:2` (float rounded
  to 1 decimal first, mews.py:139-141).
- AVPU (mews.py:151-165): `A:0, V:1, P:2, U:3`; **any other non-None string → 0**
  via `avpu_map.get(upper, 0)` (mews.py:162-164), with **no missing marker**.
- Missing inputs: each `None` returns 0 plus `"<param>_status": "missing"`
  (mews.py:65-66, 91-92, 115-116, 137-138, 159-160); statuses are collected into
  `missing_components`, then the status keys are deleted (mews.py:207-215); the
  total is `sum` of the five sub-scores with `.get(..., 0)` (mews.py:218-224).
- Trend: `compute_trend` compares last vs first of ≥2 consecutive scores →
  increasing/decreasing/stable (mews.py:229-247).

Production call sites (OBSERVED): ingestion computes and persists MEWS per
vital-sign row with trend/delta vs the previous score (vitals.py:246-307);
alerting compares the aggregate against `threshold_config`
watch=3/urgent=4/critical=5 defaults (0038_seed_default_threshold_config.py:48-59;
alert_engine via vitals.py:391-393); bed severity maps the aggregate through the
same bands with floor "normal" (dashboard.py:44-47, 79-115); deterioration-trend
projection consumes persisted MEWS history (deterioration_trend.py:61-66, 193).
The `missing_components` metadata is persisted inside the `components` JSONB
(vitals.py:295-306) but **no consumer reads it** — alert engine, threshold
resolver, dashboard, and trend projection all read `score_value` alone
(OBSERVED: alert_engine.py:50-59; dashboard.py:210-234; deterioration_trend.py).

## 2. Authoritative published definition — variant identification

**No single canonical MEWS exists.** Variant identification result (OBSERVED →
INFERENCE):

1. **V1 names its variant explicitly**: Subbe CP, Kruger M, Rutherford P,
   Gemmel L. *Validation of a modified Early Warning Score in medical
   admissions.* QJM 2001;94(10):521-526 — cited at mews.py:22-25,
   threshold_resolver.py:45, 0038_seed_default_threshold_config.py:54-58
   (DOI `10.1093/qjmed/94.10.521`), and 0039_activate_mews_v3_0_0.py:13-19.
2. **Parameter set matches Subbe**: five parameters (SBP, HR, RR, temperature,
   AVPU), no urine output — this excludes the Stenhouse-style variants that
   include urine output. The V1 variant is therefore **CITED (Subbe 2001), not
   home-grown**, at the parameter-set level.
3. **Primary-source verification status — recorded honestly.** From the
   publisher page (Oxford Academic,
   `https://academic.oup.com/qjmed/article/94/10/521/1558977`, fetched
   2026-08-15) this reviewer verified: title/authors/journal/year; study
   population ("709 medical emergency admissions", acute Medical Admissions
   Unit of a District General Hospital, i.e. **adult medical admissions**); and
   the outcome threshold — "Scores of 5 or more were associated with increased
   risk of death (OR 5.4, 95%CI 2.8–10.7), ICU admission (OR 10.9, 95%CI
   2.2–55.6) and HDU admission (OR 3.3, 95%CI 1.2–9.2)". **Table 1 (the
   per-parameter bands) is behind the journal paywall and was NOT retrievable
   from the primary source at review time.** The per-parameter comparison below
   therefore uses the commonly reproduced Subbe 2001 table as transcribed inside
   the legacy repository's own audit trail (mews.py:22-25 docstrings;
   0039_activate_mews_v3_0_0.py:13-19) cross-checked against this reviewer's
   domain knowledge of the most-cited transcription. **VALIDATION REQUIRED:
   obtain the original article and verify Table 1 cell-by-cell before any V2
   specification cites these bands as SOURCE.**

Most-cited Subbe 2001 transcription used for comparison (label: INFERENCE +
VALIDATION REQUIRED, per above): SBP ≤70:3, 71-80:2, 81-100:1, 101-199:0,
≥200:2 · HR <40:2, 41-50:1, 51-100:0, 101-110:1, 111-129:2, ≥130:3 · RR <9:2,
9-14:0, 15-20:1, 21-29:2, ≥30:3 · Temp <35:2, 35-38.4:0, ≥38.5:2 · AVPU
Alert:0, Voice:1, Pain:2, Unresponsive:3.

## 3. Discrepancy analysis — implemented vs (claimed) published variant

Faithful to the comparison table in §2: SBP (exact); RR (`<=8` ≡ `<9` for
integer inputs); temperature 3-band (exact, including the <35.0 exclusive edge:
35.0 itself scores 0 — mews.py:142-147); AVPU A/V/P/U ladder (exact); HR bands
51-100/101-110/111-129/≥130 (exact).

Discrepancies and deviations (M-1 … M-7):

| # | Item | Implemented | Published (Subbe 2001, per §2) | Assessment |
|---|---|---|---|---|
| M-1 | Missing inputs | Each `None` contributes 0; metadata generated then effectively discarded (see §5) | Instrument assumes a completed observation set; no published rule for absent inputs | **Zero-coercion — HAZ-0005.** Worst defect; see §5. |
| M-2 | AVPU unknown token | Any non-A/V/P/U string → **0, silently, no marker** (mews.py:162-164) | No such category | **Invalid-input coercion to the most reassuring value.** Concretely reachable: the API admits ACVPU `"C"` (schemas/vitals.py:13), so a patient charted with new confusion scores consciousness 0 in MEWS (while NEWS2 scores the same token 3). Contrast: NEWS2's scorer fails *loud* (non-"A" → 3); MEWS fails *reassuring*. |
| M-3 | HR exactly 40 | `<=39:2`, `40-50 → 1` (mews.py:29-30, 67-70) | Published table has a gap: "<40" vs "41-50"; 40 is uncovered | Deliberate gap-resolution (40→1, the milder band), documented in 0039_activate_mews_v3_0_0.py:16-19. Defensible but it is an **institutional interpretation, not published content** — must be declared in any V2 spec. |
| M-4 | Escalation thresholds | watch=3 / urgent=4 / critical=5, attributed to Subbe: "MEWS >=5 associated ... >=4 is the response-trigger threshold" (0038_seed_default_threshold_config.py:14-17, 50-58) | Verified from the abstract: **≥5** is the validated association threshold. No "≥4 response trigger" and no watch=3 appear in the primary source | **Misattribution.** The 4 and 3 cut-points are institutional additions wearing a Subbe citation. Direction is conservative (earlier alerting), but the provenance claim is false and must not be imported as "evidence-anchored". |
| M-5 | Trend rules | `compute_trend` first-vs-last of ≥2 samples (mews.py:229-247); ALERT-EWS-TREND delta ≥3 over 8h (ews_nrt_runner.py:322-356, unwired; early-warning-scores.yaml) | Not part of Subbe 2001 | Home-grown/UNCITED. The delta-≥3 alert is dead code (runner has no production caller); the persisted trend/delta (vitals.py:255-277) is live UI content. VALIDATE if wanted in V2. |
| M-6 | Population gating | None (no age/pregnancy/setting checks anywhere in the path) | Study population: adult medical admissions | Out-of-population output produced silently. Feeds VAL-0006/VAL-0007. |
| M-7 | Score-range documentation | Docstring claims total range "(0-15)" (mews.py:189) | Maximum reachable total is 14 (SBP 3 + HR 3 + RR 3 + Temp 2 + AVPU 3) | Minor documentation error; indicates the range was never derived from the implemented bands. |

Version history (OBSERVED): v1.0.1 → v2.0.0 → v3.0.0 corrected earlier inflated
bands (HR/RR/hypothermia: 0007_seed_mews_v1_0_1.py:8-11) and then the temperature
table and HR-40 boundary (0039_activate_mews_v3_0_0.py:8-19). `MEWS-v3.0.0` is
recorded as **approved** in `docs/audit/fullspectrum/CLINICAL_SIGNOFF.md`
(RAT-MEWS-SUBBE-2001-R2 row, "APROVADO", 2026-07-12) — but that document itself
records that the approver is the repository code-owner self-declared as an
intensivist, without verifiable registration/institution, and recommends formal
counter-signature for regulatory use (CLINICAL_SIGNOFF.md "Nota de identidade e
limites"). INFERENCE: the MEWS ratification trail is more coherent than NEWS2's
but still does not meet V2's named-authority bar (`evidence-notation.md` §2 rule 3).

Units: HR bpm, SBP mmHg, RR breaths/min, temperature °C throughout
(schemas/vitals.py:35-42) — consistent with the instrument; no unit conversion
happens in the scorer (a °F value would be banded as °C without error; ingestion
schema bounds 25.0-45.0 °C mitigate at the API path only, schemas/vitals.py:38).

## 4. NEWS2-specific mandatory assessments — applicability note

Scale 1/Scale 2, supplemental-O2 scoring, and the red-score tier are NEWS2
constructs and have no MEWS counterpart; MEWS as implemented contains no
oxygen-related component at all (OBSERVED, mews.py whole file). The
consciousness mapping issue analogous to NEWS2's is M-2 above. Aggregate
trigger: study threshold ≥5 vs implemented configurable 3/4/5 — see M-4;
the same no-floor override risk applies (threshold_resolver.py:50-117).

## 5. HAZ-0005 zero-coercion — per-input trace (OBSERVED from source)

| Input | Missing-input path | Behavior | Verdict |
|---|---|---|---|
| heart_rate | mews.py:65-66 `return {"heart_rate": 0, "heart_rate_status": "missing"}` | 0 + marker | **zero-coerced** (marker discarded downstream) |
| systolic_bp | mews.py:91-92 | 0 + marker | **zero-coerced** (marker discarded) |
| respiratory_rate | mews.py:115-116 | 0 + marker | **zero-coerced** (marker discarded) |
| temperature | mews.py:137-138 | 0 + marker | **zero-coerced** (marker discarded) |
| avpu (None) | mews.py:159-160 | 0 + marker | **zero-coerced** (marker discarded) |
| avpu (unmapped token) | mews.py:162-164 `avpu_map.get(upper, 0)` | 0, **no marker at all** | **invalid-input coerced** — strictly worse than the None path |

The sum ignores markers entirely: `score_total = int(components.get("heart_rate", 0)
+ ...)` (mews.py:218-224). With all inputs absent the function returns
`(0, {"algorithm_version": "MEWS-v3.0.0", "missing_components": [...5 items]})` —
and the legacy test suite asserts exactly this as intended behavior
(`test_calculate_mews_all_missing`: "Sem nenhum dado, score deve ser 0",
tests/test_mews.py:239-245; intent evidence, not authority). The 0 is persisted
as a real `ClinicalScore` (vitals.py:295-307), banded below watch → severity
contribution "normal" (dashboard.py:84-90), floored to a `"normal"` bed
(dashboard.py:114-115). Unlike NEWS2, MEWS *generates* the honest metadata — the
defect is that **no consumer elevates it into a status contract**, which is
precisely the finding quoted in HAZ-0005 ("The metadata is not elevated into an
evaluation-status contract").

**Decisive lines: mews.py:218-224 (sum over zeros) and mews.py:162-164 (silent
invalid-AVPU → 0).** HAZ-0005 is CONFIRMED for MEWS for all five inputs, plus an
aggravating invalid-input path the hazard log does not yet itemize (proposed as a
shared finding — see `shared-findings.md` SF-3).

## 6. Clinical verdict — PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)

**Verdict: VALIDATE** (per `legacy-import-policy.md` §4). Rationale (INFERENCE
from §§2–5): the implemented band tables are internally coherent and consistent
with the Subbe 2001 variant V1 claims — this is the *best-transcribed* scorer in
the legacy EWS family — but (a) the per-parameter bands cannot yet be traced to
the paywalled primary source (SOURCE-level verification outstanding); (b) the
escalation thresholds 3/4 are misattributed to Subbe (M-4); (c) the zero-coercion
and silent invalid-AVPU paths make the implementation unsafe as built (§5); and
(d) at portfolio level, CAND-0002 has "VERY HIGH overlap with CAND-0001 (NEWS2)"
and is the inventory's "clearest case ... for the remove-one-and-recheck step"
(candidate-inventory.md CAND-0002 row) — so whether MEWS should exist in V2 at
all is an open portfolio decision. If the portfolio decision removes MEWS, the
correct terminal classification is **SUPERSEDE** (by the NEWS2 pathway),
documented for context; this record deliberately does not preempt that decision.

Elements proposed to survive into a V2 spec *if* CAND-0002 proceeds:

- The five-parameter Subbe band tables — RETAIN as published content **after**
  primary-source Table 1 verification (blocking VALIDATION REQUIRED, §2.3),
  with the HR-40 gap resolution declared as an institutional decision (M-3).
- The ≥5 outcome-association threshold with its verified citation — RETAIN.
- The idea of per-component missing markers — TRANSFORM into the V2
  evaluation-status contract (`evaluation-status-semantics.md`): markers must
  *drive status*, never coexist with a summed 0.

Elements proposed REJECT: silent `avpu_map.get(upper, 0)` fallback (M-2); the
"Subbe" attribution on watch=3/urgent=4 (M-4 — thresholds may be kept only as
declared institutional parameters); summation over zero-coerced components (§5).

Blocking V2 prerequisites (VALIDATION REQUIRED): primary-source Table 1
verification; portfolio overlap decision NEWS2-vs-MEWS (CAND-0001/0002);
population gating (VAL-0006/VAL-0007); freshness windows (VAL-0023 — V1 scores a
vital-sign row atomically with no per-input freshness policy); named clinical
authority re-ratification (the legacy sign-off does not meet `evidence-notation.md`
§2 rule 3).
