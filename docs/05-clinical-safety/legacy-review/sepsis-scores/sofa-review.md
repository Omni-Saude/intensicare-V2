---
id: LEGREV-SOFA-0001
title: Legacy review — SOFA scoring clinical content (V1 services/sofa.py and trilhas-era rule records)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Intensivist-rigor forensic review of the legacy V1 SOFA implementation against Vincent 1996
  and Sepsis-3, including per-component discrepancy tables, HAZ-0005 zero-coercion tracing,
  and the partial-SOFA analysis that feeds ADR-0008. Everything herein is PROPOSAL; no
  clinical authority has ratified any statement.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/sofa.py and docs/rules/clinical-scoring/ (see per-citation table §1)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 in §1)
  section_or_lines: per-citation line references throughout
  date_collected: 2026-08-15
  collector: legacy sepsis-score forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis; analysis labeled INFERENCE/PROPOSAL
  confidence: high (source verification); low (clinical dispositions — unratified)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0032, HAZ-0043]
  adrs: [ADR-0008 (pending — §7 is its input)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# SOFA — legacy clinical-content review

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).** No statement in
this record is a clinical decision. Verdicts use `docs/00-governance/legacy-import-policy.md`
§4 vocabulary and are import *proposals* only.

## 1. Sources verified, with hashes

All paths relative to `/Users/familia/intensicare` (READ-ONLY), pinned at git HEAD
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`, hashes re-computed at review time
(2026-08-15) and compared to `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

| Artifact | SHA-256 | Manifest |
|---|---|---|
| `src/intensicare/services/sofa.py` | `731b3507cc07b2d5318f4759229527d2eac1f45b62eba269168d43560739b84a` | match |
| `src/intensicare/models/clinical_score.py` | `fc987ad0d037b1f153451240178dc12ab988a1104d7bc4a88dc460972234ff43` | match |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-001…-007, -011, -012` | per manifest lines 453-461 (all match) | match |
| `docs/rules/physiological-calculation/RULE-CLINICAL-SCORING-008/-009/-010` | per manifest lines 1078-1080 (all match) | match |
| `tests/test_sofa.py` | `95278fe50179a4f7904eacb256285472f51cf86ea3bfbf6c92a5890ab42610c7` | **not in manifest — hashed at review time (hash-and-note)** |
| `docs/plan/_work/ratification-decisions.yaml` | `b90c3cbbf11f22e440d7258e1e9c8fd556009a4c572717b839f51e73f7ee4751` | **not in manifest — hashed at review time (hash-and-note)** |

**OBSERVED — two distinct SOFA lineages exist in the legacy evidence:**

1. **The live V1 engine**: `src/intensicare/services/sofa.py` (reviewed from code, §2-§6).
2. **The trilhas-era implementation** (`ahlabs-trilhas@8166c07eae`,
   `trilha_manual/models/sofa.py`), documented in RULE-CLINICAL-SCORING-001…-012. Its
   underlying code is **SOURCE NOT LOCATED — cannot review as code**: the `ahlabs-trilhas`
   repository is not mounted. It is reviewed here only *as documented* in the extracted
   rule records (§5), which are themselves in-repo, hashed evidence.

The task packet names "RULE-CLINICAL-SCORING-001 through -012"; -008, -009 and -010 live in
`docs/rules/physiological-calculation/` (same rule-ID series, different cluster directory).
All twelve were located and reviewed. No RULE-CLINICAL-SCORING file is missing.

## 2. Formula as implemented (verbatim, `services/sofa.py`)

Component cut-point constants — `sofa.py:62-100`:

```python
SOFA_RESP_PF_NORMAL = 400  # >= 400 -> 0
SOFA_RESP_PF_MILD = 300  # >= 300 -> 1
SOFA_RESP_PF_MODERATE = 200  # >= 200 -> 2
SOFA_RESP_PF_SEVERE = 100  # >= 100 (ventilated) -> 3, else -> 4
SOFA_PLATELETS_NORMAL = 150 ... SOFA_PLATELETS_SEVERE = 20
SOFA_BILIRUBIN_NORMAL = 1.2 ... SOFA_BILIRUBIN_SEVERE = 12.0
SOFA_MAP_NORMAL = 70
SOFA_DOPAMINE_LOW = 5
SOFA_DOPAMINE_HIGH = 15
SOFA_ADRENERGIC_LOW = 0.1
SOFA_GCS_NORMAL = 15 ... SOFA_GCS_SEVERE = 6
SOFA_CREATININE_NORMAL = 1.2 ... SOFA_CREATININE_SEVERE = 5.0
SOFA_URINE_OUTPUT_SEVERE = 200  # < 200 -> 4
SOFA_URINE_OUTPUT_MODERATE = 500  # < 500 -> 3
```

Respiration — `sofa.py:168-196` (excerpt):

```python
    if pao2_fio2 is None:
        return 0, "missing"
    if isinstance(pao2_fio2, bool):
        return 0, "invalid_type"
    if pao2_fio2 < 20:
        # FiO2 percent bug: P/F ratio should be ~200-500
        raise ValueError(...)
    if pao2_fio2 >= SOFA_RESP_PF_NORMAL: score = 0
    elif pao2_fio2 >= SOFA_RESP_PF_MILD: score = 1
    elif pao2_fio2 >= SOFA_RESP_PF_MODERATE: score = 2
    elif mechanical_ventilation:
        score = 3 if pao2_fio2 >= SOFA_RESP_PF_SEVERE else 4
    else:
        # pao2_fio2 < 200 and not ventilated: cap at 2
        score = 2
```

Cardiovascular — `sofa.py:301-335` (excerpt):

```python
    if map_value is None:
        return 0, "missing"
    if not vasopressor_type or vasopressor_type.lower() in ("none", ""):
        return (0 if map_value >= SOFA_MAP_NORMAL else 1), None
    vtype = vasopressor_type.lower().strip()
    dose = vasopressor_dose_mcg_kg_min
    if vtype == "dopamine":
        if dose is None: score = 2      # Unknown dose, default to moderate
        elif dose <= SOFA_DOPAMINE_LOW: score = 2
        elif dose <= SOFA_DOPAMINE_HIGH: score = 3
        else: score = 4
    elif vtype in ("epinephrine", "norepinephrine", "noradrenaline"):
        if dose is None: score = 3      # Unknown dose, default to moderate-high
        elif dose <= SOFA_ADRENERGIC_LOW: score = 3
        else: score = 4
    else:
        # Dobutamine or unknown vasopressor type — default to mid-range
        score = 2
```

Renal — `sofa.py:400-427` (excerpt):

```python
    both_missing = creatinine is None and urine_output_ml_day is None
    if both_missing:
        return 0, "missing"
    if creatinine is None or creatinine < SOFA_CREATININE_NORMAL:
        cr_score = 0
    ...
    if urine_output_ml_day is None:
        uo_score = 0
    elif urine_output_ml_day < SOFA_URINE_OUTPUT_SEVERE: uo_score = 4
    elif urine_output_ml_day < SOFA_URINE_OUTPUT_MODERATE: uo_score = 3
    else: uo_score = 0
    return max(cr_score, uo_score), None
```

Total — `sofa.py:504`: `total = resp_score + coag_score + liver_score + cv_score +
neuro_score + renal_score`. Coagulation (`sofa.py:219-230`), liver (`sofa.py:254-265`) and
neurological (`sofa.py:358-369`) are simple band lookups with `None -> (0, "missing")`.

Mortality-risk banding — `sofa.py:40-59`: `<=6 low, <=9 moderate, <=12 high, else
very_high`; docstring (`sofa.py:43-49`) quotes bands "SOFA 0-6: ~<10% … 13-14: ~50-60%,
15-24: ~80-90%, >15: ~>90%".

Version claim — `sofa.py:20`: `SOFA_VERSION = "SOFA-v2.0.0"  # CLINICALLY RATIFIED per
RAT-CLINICAL-SCORING-01/02/03`.

## 3. Authoritative definitions

- **Vincent JL, Moreno R, Takala J, Willatts S, De Mendonça A, Bruining H, Reinhart CK,
  Suter PM, Thijs LG.** The SOFA (Sepsis-related Organ Failure Assessment) score to
  describe organ dysfunction/failure. On behalf of the Working Group on Sepsis-Related
  Problems of the ESICM. *Intensive Care Medicine*. 1996;22(7):707-710.
  <https://link.springer.com/article/10.1007/BF01709751> — the defining table: respiration
  PaO2/FiO2 ≥400=0, 300-399=1, 200-299=2, 100-199 **with respiratory support**=3, <100
  **with respiratory support**=4; platelets (×10³/µL) ≥150/100-149/50-99/20-49/<20;
  bilirubin (mg/dL) <1.2 / 1.2-1.9 / 2.0-5.9 / 6.0-11.9 / ≥12.0 (µmol/L <20 / 20-32 /
  33-101 / 102-204 / >204); cardiovascular MAP ≥70=0, MAP <70=1, dopamine ≤5 or dobutamine
  (any dose)=2, dopamine >5 or epinephrine ≤0.1 or norepinephrine ≤0.1=3, dopamine >15 or
  epinephrine >0.1 or norepinephrine >0.1=4, **adrenergic doses in µg/kg/min administered
  for at least 1 h**; GCS 15=0, 13-14=1, 10-12=2, 6-9=3, <6=4; renal creatinine (mg/dL)
  <1.2 / 1.2-1.9 / 2.0-3.4 / 3.5-4.9 / ≥5.0 **or** urine output <500 mL/day=3, <200
  mL/day=4. (Verified against the publisher's article record and the secondary rendering at
  PMC6880479, Lambden S et al., *Crit Care* 2019;23:374, "The SOFA score — development,
  utility and challenges", <https://pmc.ncbi.nlm.nih.gov/articles/PMC6880479/>.)
- **Singer M, Deutschman CS, Seymour CW, et al.** The Third International Consensus
  Definitions for Sepsis and Septic Shock (Sepsis-3). *JAMA*. 2016;315(8):801-810.
  doi:10.1001/jama.2016.0287, <https://pmc.ncbi.nlm.nih.gov/articles/PMC4968574/> —
  sepsis is operationalized as "an acute increase in total SOFA score ≥2 points consequent
  to the infection", with "baseline SOFA score … assumed to be zero in patients not known
  to have preexisting organ dysfunction"; SOFA ≥2 associated with in-hospital mortality of
  "approximately 10%" in the presumed-infection population.
- **Evans L, Rhodes A, Alhazzani W, et al.** Surviving Sepsis Campaign: International
  Guidelines for Management of Sepsis and Septic Shock 2021. *Crit Care Med*
  2021;49(11):e1063-e1143 and *Intensive Care Med* 2021;47:1181-1247.
  doi:10.1007/s00134-021-06506-y — relevant to SOFA use context; screening-tool
  recommendations reviewed in `qsofa-review.md` §6.

SOURCE-quality note: the mortality percentages quoted in `sofa.py:43-49` are **not** part
of Vincent 1996. They resemble figures reported in the later serial-SOFA literature
(Ferreira FL, Bota DP, Bross A, Mélot C, Vincent JL. Serial evaluation of the SOFA score to
predict outcome in critically ill patients. *JAMA*. 2001;286(14):1754-1758), but the code
cites nothing; attribution is unverified. See D-10.

## 4. Per-component discrepancy table — `services/sofa.py` vs Vincent 1996

Legend: **MATCH** = numerically identical to the 1996 table; **DEV** = deviation or
uncited interpretive extension.

| # | Component | Finding | Verdict | Evidence |
|---|---|---|---|---|
| D-01 | Respiration cut-points | 400/300/200/100 mmHg, inclusive-low bands | MATCH | `sofa.py:184-192` |
| D-02 | Respiration ventilation gate | Scores 3-4 require `mechanical_ventilation=True`; `<200` unventilated capped at 2 | **DEV (interpretation)** — Vincent 1996 says "with respiratory support", which by common convention includes non-invasive support (CPAP/NIV); legacy narrows to a single mechanical-ventilation boolean, and the cap-at-2 handling of unsupported P/F <200 is an uncited (though widespread) convention. Both need explicit V2 ratification. | `sofa.py:190-195` |
| D-03 | SpO2/FiO2 surrogate | **Absent.** No SpO2/FiO2 fallback exists anywhere in the scorer. | Not a discrepancy; recorded because ADR-0008 partial policy (§7) must not assume one exists. Any V2 surrogate needs its own citation (e.g. Pandharipande et al. 2009 imputation) and ratification. | whole file |
| D-04 | Respiration in-band validation | P/F `< 20` raises `ValueError` (FiO2-percent heuristic); a bool input returns `(0, "invalid_type")` | **DEV (safety)** — three different failure algebras in one function (exception, coerced zero, coerced zero + status). The `invalid_type` status is **not** propagated: `calculate_sofa` checks only `== "missing"` (`sofa.py:468-469`), so an invalid input silently contributes 0 with no missing-flag. A genuine P/F of 20-99 with percent-coded FiO2 passes the guard undetected (e.g. PaO2 80/FiO2 "40" gives 2.0 → raises; PaO2 80/FiO2 "2.5"-style partial errors do not). | `sofa.py:171-182, 468-469` |
| D-05 | Coagulation platelets | ≥150=0, <150=1, <100=2, <50=3, <20=4 (×10³/µL) | MATCH | `sofa.py:222-230` |
| D-06 | Liver bilirubin | <1.2 / <2.0 / <6.0 / <12.0 / ≥12.0 mg/dL — continuous bands, no dead gaps | MATCH numerically, **DEV (units)** — the docstring reads "based on bilirubin (mg/dL or µmol/L)" (`sofa.py:239`) while thresholds are mg/dL-only. A µmol/L value passed as-is over-scores by ~17× (normal 10 µmol/L reads as 10 "mg/dL" → 3 points). No unit is carried on the argument; unit safety is wholly the caller's. HAZ-0032 territory. | `sofa.py:238-246, 254-265` |
| D-07 | Cardiovascular — MAP missing with vasopressor present | `map_value is None → (0, "missing")` **before** vasopressor evaluation: a patient on norepinephrine 0.5 µg/kg/min with no MAP recorded scores CV = 0 | **DEV (clinical, worst single defect in this file)** — the 1996 table scores vasopressor tiers independently of MAP; the legacy short-circuit discards positive evidence of severe shock and returns the healthiest value. | `sofa.py:301-302` |
| D-08 | Cardiovascular dose tiers | Dopamine ≤5→2, ≤15→3, >15→4; epinephrine/norepinephrine ≤0.1→3, >0.1→4; dobutamine any→2; doses in µg/kg/min | MATCH (tier values and unit) | `sofa.py:313-333` |
| D-09 | Cardiovascular duration condition | Vincent 1996 requires adrenergic agents "for at least 1 h"; legacy has **no duration condition** | **DEV** — transient bolus-driven rates tier identically to sustained infusions. | `sofa.py:273-335` |
| D-10 | Cardiovascular unknown dose / unknown agent | Unknown dopamine dose defaults to 2; unknown epi/norepi dose defaults to 3; unknown agent string (e.g. vasopressin, phenylephrine) defaults to 2 | **DEV (uncited guessing)** — silently under-scores (norepinephrine >0.1 with missing dose is a true 4 reported as 3; vasopressin — absent from the 1996 table — is scored *below* the low-dopamine tier). Single-string `vasopressor_type` cannot represent combination therapy (norepinephrine + vasopressin), which is routine in septic shock. | `sofa.py:314-333` |
| D-11 | Neurological GCS bands | 15=0, 13-14=1, 10-12=2, 6-9=3, <6=4 | MATCH | `sofa.py:361-369` |
| D-12 | Neurological sedation behavior | **No sedation handling of any kind.** A RASS −5 sedated patient's GCS 3 scores 4 points, indistinguishable from structural coma | **DEV (flag, do not adjudicate here)** — assessed-GCS-under-sedation policy belongs to the neuro workstream review; cross-reference only. Legacy has documented RASS content (`docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-014`, RULE-SEDACAO-003) but the SOFA scorer never consults it. | `sofa.py:343-369` |
| D-13 | Neurological input validation | GCS is not range-checked; a physiologically impossible GCS above 15 (e.g. 20) scores 1 point via the `>= 13` branch, and GCS < 3 scores 4 | **DEV (minor)** — valid range 3-15 is documented elsewhere in legacy (`RULE-CLINICAL-SCORING-013`) but not enforced here. | `sofa.py:358-369` |
| D-14 | Renal creatinine | <1.2 / <2.0 / <3.5 / <5.0 / ≥5.0 mg/dL — continuous, no dead gap at 5.0 | MATCH (and fixes the trilhas-era dead gap, §5) | `sofa.py:405-414` |
| D-15 | Renal urine output | <500 mL/day→3, <200 mL/day→4; final = `max(cr_score, uo_score)` | MATCH on cut-points; the `max()` combination is the accepted convention (the 1996 table lists creatinine *or* urine output per band). **DEV (window)** — the argument is a caller-supplied "24-hour urine output in mL" (`sofa.py:395`); no 24 h window assembly, pro-rating, or catheter-context check exists anywhere in the scorer, and the current input provider supplies no urine output at all (see `sepse-pathway-clinical-review.md` §5). The 24 h criterion is therefore a *label*, not an implemented measurement window. | `sofa.py:377-427` |
| D-16 | Renal partial-missing | Creatinine `None` with urine output present → `cr_score = 0` silently; urine output `None` with creatinine present → `uo_score = 0` silently. Only both-missing sets a `"missing"` status | **DEV (zero-coercion inside a "present" component)** — a one-input renal score is reported with no partiality marker. | `sofa.py:400-424` |
| D-17 | Total score | Plain sum; components that are missing contribute 0; total presented as 0-24 int | **DEV** — a 3-organ partial evaluates to the same type and range as a 6-organ complete score. `missing_components` exists on `SOFAResult` (`sofa.py:122`) but the persistence model `clinical_score.score_value` is a bare non-null int with no status column (`clinical_score.py:21`; `components` JSONB is nullable, `clinical_score.py:30`) — the metadata is structurally droppable, which is exactly the LEGACY-TA:478 finding behind HAZ-0005. | `sofa.py:504`, `clinical_score.py:21,30` |
| D-18 | Mortality banding | `classify_sofa_mortality_risk`: ≤6 low, ≤9 moderate, ≤12 high, ≥13 very_high | **DEV (uncited + internally inconsistent)** — not in Vincent 1996; docstring's own bands say 13-14 ≈ 50-60% yet 13-14 classifies `very_high` alongside ">15: ~>90%", and the quoted bands overlap ("15-24: ~80-90%" vs ">15: ~>90%"). No citation anywhere. Any V2 banding needs a named source and ratification. | `sofa.py:40-59, 124-138` |
| D-19 | Ratification claim | `# CLINICALLY RATIFIED per RAT-CLINICAL-SCORING-01/02/03` | **DEV (governance)** — the ratification register's authority line reads `authority: 'repository owner delegation (session directive: "use deep think to decide on the RATIFICATION items…")'` (`docs/plan/_work/ratification-decisions.yaml:1-3`), i.e. an en-bloc owner/agent delegation, not a named, verifiable clinical authority. Consistent with LEGACY-TA:125/465 (approver CRM/institution unverifiable). Under `evidence-notation.md` §2 rule 3 this cannot stand as DECIDED in V2; every legacy "RATIFIED" claim is void for V2 purposes. | `sofa.py:20`; `ratification-decisions.yaml:1-3` |

**Discrepancy count (live engine): 12 DEV findings (D-02, D-04, D-06, D-07, D-09, D-10,
D-12, D-13, D-15, D-16, D-17, D-18) plus one governance finding (D-19); 6 MATCH.**

Three worst: **D-07** (missing MAP silently zeroes the cardiovascular score of a patient on
vasopressors), **D-17** (partial totals typed and persisted identically to complete totals
— the HAZ-0005 mechanism), **D-06** (docstring invites a 17× bilirubin unit error).

## 5. The trilhas-era SOFA (RULE-CLINICAL-SCORING-001…-012) — reviewed as documented

Underlying code `ahlabs-trilhas@8166c07eae` — **SOURCE NOT LOCATED** (repo not mounted);
findings below are SOURCE statements from the hashed rule records, not re-verified code.

| Rule | Documented content | Documented verdict | Review comment |
|---|---|---|---|
| 001 (total) | Sum of six sub-scores, 0-24 | VERIFIED | Sum is correct *given* sub-scores; the record itself notes `None` sub-scores raise `TypeError` on sum — an availability failure mode V2 must not inherit. |
| 002 (respiration) | Cut-points 400/300/200/100 correct, but (a) FiO2 stored 21-100 (percent) upstream while thresholds assume fraction → ratio ~100× too small, nearly every patient scores 4; (b) **no ventilation gate on scores 3-4** | DISCREPANCY, high impact | Both defects independently corrupt the respiratory sub-score; V1 `services/sofa.py` fixed (b) and half-guards (a) via the `<20` heuristic (D-04). |
| 003 (coagulation) | Bands exact (/mm³ scale); platelets == 0 treated as no-data → 0 | VERIFIED | The 0-sentinel is another value-domain overload of "missing onto healthy". |
| 004 (liver) | Strict-`<` upper bounds create dead gaps [1.9,2.0), [5.9,6.0), [11.9,12.0) returning `None` → sum raises or mis-sums | DISCREPANCY, moderate | A scoring function that can *crash the whole SOFA* on bilirubin 1.95 mg/dL. Fixed in V1 `services/sofa.py` (continuous bands). |
| 005 (cardiovascular) | Noradrenaline read as raw **ml volume** with a 3-vs-4 split at ">10 ml"; dopamine and epinephrine absent entirely; MAP <70=1 and dobutamine-any=2 match | DISCREPANCY, high | An incoherent unit mapping (ml is not µg/kg/min); any norepinephrine patient can be mis-tiered either way. |
| 006 (CNS) | GCS bands exact | VERIFIED | GCS 0 / >15 fall to 0 ("no data") — same overload pattern as 003. |
| 007 (renal) | Creatinine exactly 5.0 (and (4.9,5.0]) matches **no branch** → 0 renal points at the top of the scale; 2-point band written 2.0-4.0 but shadowed; urine cut-points match | DISCREPANCY, high | A 4-point undercount on a common laboratory value. Fixed in V1 `services/sofa.py` (D-14). |
| 008 (P/F ratio) | `po2/fio2` with `False` sentinel for missing; FiO2 percent-vs-fraction internally inconsistent across the codebase | DISCREPANCY, high | The unit incoherence is systemic, not local — decisive argument for V2 requiring UCUM-coded quantities at the boundary (`compatibility-finding.md` §3.1). |
| 009 (MAP) | `((2·PAD)+PAS)/3`, falsy input → 0 | VERIFIED (formula) | MAP=0 as missing-sentinel feeds D-07-style coercion downstream. |
| 010 (age) | days//365 age; negative/0 quirks | DISCREPANCY, low | Out of SOFA scope; relevant only to population gating (VAL-0006/0007). |
| 011 (sourcing) | On save, copies prontuario fields; noradrenaline only when relation exists, otherwise **stale prior value retained** | VERIFIED (as workflow) | The stale-retention quirk is an HAZ-0006 mechanism. |
| 012 (assembly) | First-admission input assembly; all six organs represented | VERIFIED (as workflow) | Inherits every upstream unit hazard. |

INFERENCE: the trilhas lineage is not a candidate for import in any form; its value is the
failure catalog above, which V2's absent-input probe (SAF-0002) and unit-mapping tests
(HAZ-0032) should encode as regression vectors.

## 6. HAZ-0005 zero-coercion — traced per component (live engine)

HAZ-0005 (hazard-log.md:129) is **E1 — occurred**: all-absent inputs returned SOFA 0.
Mechanism, verified from code:

| Component | Missing input | Behavior | Decisive lines |
|---|---|---|---|
| Respiration | `pao2_fio2=None` | returns `(0, "missing")` | `sofa.py:168-169` |
| Respiration | bool passed | returns `(0, "invalid_type")` — **and the status is dropped**; `calculate_sofa` records only `"missing"` | `sofa.py:171-172, 468-469` |
| Coagulation | `platelets=None` | `(0, "missing")` | `sofa.py:219-220` |
| Liver | `bilirubin=None` | `(0, "missing")` | `sofa.py:254-255` |
| Cardiovascular | `map_value=None` | `(0, "missing")` — **even when vasopressor type/dose are present** | `sofa.py:301-302` |
| Cardiovascular | dose `None`, agent known | scored 2 or 3 by guess, status `None` — not even flagged missing | `sofa.py:314-315, 324-325` |
| Neurological | `gcs=None` | `(0, "missing")` | `sofa.py:358-359` |
| Renal | both `None` | `(0, "missing")` (single flag `"creatinine_and_urine_output"`) | `sofa.py:400-402, 492-493` |
| Renal | exactly one of the pair `None` | the absent half scores 0 **with no flag at all** | `sofa.py:405, 417-418` |
| Total | any/all missing | components sum as 0s; all-absent → `total_score=0` with `missing_components` list populated but the persisted `score_value` int carries no status | `sofa.py:504`; `clinical_score.py:21,30` |

Intent evidence: `tests/test_sofa.py` **asserts** this behavior as correct —
`(None, False, (0, "missing"))` (test_sofa.py:36), `(None, (0, "missing"))` for platelets,
bilirubin, GCS (test_sofa.py:95,121,234), `score_cardiovascular(None) == (0, "missing")`
(test_sofa.py:147-148). The zero-coercion is designed and test-enforced, not accidental.

**HAZ-0005 verdict per component class:** confirmed for all six components; aggravated in
cardiovascular (positive severity evidence discarded, `sofa.py:301-302`) and renal
(sub-component absence unflagged, `sofa.py:405,417`); aggravated at the type level by
`invalid_type` erasure (`sofa.py:171-172` + `468-469`). V2 SAF-0002's absent-input probe
must include every row of the table above as a negative test.

## 7. PARTIAL-SOFA ANALYSIS — INPUT TO ADR-0008

**Marked as mandatory input to ADR-0008. Everything in this section is PROPOSAL.**

### 7.1 What is computable from currently evidenced AMH sources

SOURCE (`docs/08-interoperability/amh-data/compatibility-finding.md` §3, pinned AMH
`0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`): at the evidence snapshot AMH has **zero
populated Observations of any category** — laboratory Observation is blocked by an empty
Bronze source, the only Observation profile pattern-fixes `category = laboratory`, and no
vital-signs profile exists at all. No medication-administration contract with dose
granularity was evidenced; no urine-output source of any kind was identified
(`candidate-inventory.md` CAND-0003).

**Consequence, stated without softening: today the number of SOFA components computable
from evidenced AMH sources is zero of six.** Not "partial" — zero. A V2 SOFA against
today's AMH evidence would run permanently in `not_evaluated`; admitting it would
instantiate HAZ-0043 (permanent emptiness habituated into reassuring quiet). This is the
compatibility finding's own inference (`AMH-CF §3.3`) applied to this instrument, and it is
why CAND-0003 is marked INELIGIBLE "twice over".

### 7.2 If laboratory Observations later populate conformantly (LOINC + UCUM)

Component-by-component source demand, from the input signature at `sofa.py:435-445`:

| Component | Inputs needed | Would labs-only populate it? |
|---|---|---|
| Coagulation | platelet count | **Yes** (laboratory) |
| Liver | total bilirubin | **Yes** (laboratory) |
| Renal (creatinine half) | serum creatinine | **Yes**; the urine-output half needs a fluid-balance source that does not exist — the renal component would itself be a *silent partial* unless V2 models it explicitly (D-16) |
| Respiration | PaO2 (blood gas — laboratory) **and** FiO2 + respiratory-support status (device/vitals context) | **No** — blood gas alone is insufficient; FiO2 and ventilation status have no evidenced source |
| Cardiovascular | MAP (vital sign) + vasopressor agent and dose in µg/kg/min (medication administration) | **No** — neither class is evidenced |
| Neurological | GCS (clinical assessment/vital-signs class) | **No** — structurally excluded by the laboratory-fixed profile |

So the *best* conformant-labs future yields **2 of 6 components fully, plus half of a
third**: coagulation + liver + creatinine-only renal. Maximum obtainable partial total:
12 of 24 points, from the three organ systems that least resemble the bedside
deterioration axes (no hemodynamics, no oxygenation, no consciousness).

### 7.3 Is a labs-only partial SOFA clinically defensible? — both sides

**For presenting a labs-only partial (steel-manned):**
- The three computable components are real organ-dysfunction signals; platelets, bilirubin
  and creatinine trends carry legitimate prognostic weight, and clinicians already reason
  on isolated laboratory trends.
- A partial with explicit bounds ("coag/liver/renal only; respiratory, cardiovascular and
  CNS NOT assessed") is more information than nothing, and evaluation-status-semantics.md
  §3.2 provides exactly the `partial` state for a declared, approved subset.
- Sepsis-3 itself tolerates missing-at-baseline assumptions (baseline SOFA assumed zero),
  so the instrument's literature is not allergic to pragmatic conventions.

**Against (steel-manned):**
- SOFA's validity claims attach to the six-organ aggregate; a 3-of-6 subset is **a
  different, unvalidated instrument** wearing SOFA's name. PROMPT:418 (quoted in
  evaluation-status-semantics.md §3.2) forbids silently altering a clinical definition; an
  honest subset would have to be *separately evidenced*, not badged "SOFA".
- The missing half is systematically the **acute** half. Labs cycle on hours-to-daily
  cadence; hemodynamic collapse, desaturation and coma evolve in minutes. A labs-only
  "SOFA 2" on a patient in vasopressor-dependent shock is D-07 at portfolio scale: the
  score is lowest exactly when the unmeasured axis is the one failing (candidate hazard
  PH-01/PH-03 mechanics, `candidate-inventory.md` §5).
- Sepsis-3's diagnostic use is **ΔSOFA ≥2 versus baseline**. A partial instrument cannot
  anchor a Δ, because the baseline and the current value may cover different component
  subsets on different days (PH-03: "a composite describing a patient state that never
  existed at any instant").
- The legacy lesson (HAZ-0005) is precisely that a low number produced from absence reads
  as reassurance. A labs-only partial is *structured* absence.

**Recommendation — PROPOSAL:** V2 must not compute a partial SOFA *total* under any
labs-only source state. If clinical governance wants the computable fragment surfaced, it
should be (a) presented as **per-organ component scores, never summed**, each with its own
evaluation status and freshness; and (b) admitted, if at all, as a separately named and
separately evidenced pathway per PROMPT:418 — not as "SOFA". The SOFA pathway itself
returns `not_evaluated` (reason `missing_required_input:<component>`) until all six
components have evidenced, in-window sources, unless a named clinical authority ratifies an
explicit partial policy under evaluation-status-semantics.md §3.2 — which today would fail
that section's own entry condition (no approved partial policy exists, and none can be
approved against nonexistent sources). ΔSOFA (the Sepsis-3 criterion) additionally requires
a ratified baseline convention before it can exist at all. **VALIDATION REQUIRED:**
`AUTH-CLINSAFETY`; feeds ADR-0008 directly; see also VAL-0023 (freshness windows per
input — unresolved) and VAL-0006/0007 (adult-only gating — unresolved and BLOCKING).

## 8. Clinical verdicts — PROPOSAL, per legacy-import-policy §4

| Artifact | Verdict | Rationale |
|---|---|---|
| `services/sofa.py` cut-point constants and band structure (D-01, D-05, D-06 numeric, D-08, D-11, D-14, D-15 cut-points) | **VALIDATE** | Numerically faithful to Vincent 1996; may inform a V2 spec as *reference values*, re-derived from the primary source with V2 acceptance tests — never copied as code. Import blocked anyway until legacy-import-policy §3 items (owner, license, clinical review) exist. |
| `services/sofa.py` missing/invalid-input handling (§6) | **REJECT** | The HAZ-0005 mechanism itself, test-enforced. V2's evaluation-status algebra (SAF-0001/0002) is its replacement; carry the table in §6 as negative-test vectors only. |
| `services/sofa.py` cardiovascular unknown-dose/unknown-agent defaults, missing-MAP short-circuit (D-07, D-10) | **REJECT** | Silent clinical guessing; discards severity evidence. |
| `services/sofa.py` mortality-risk banding (D-18) | **REJECT** | Uncited, internally inconsistent; any V2 banding must be sourced and ratified fresh. |
| Ventilation-gate and cap-at-2 interpretation (D-02) | **VALIDATE** | Common convention but uncited; V2 must decide "respiratory support" scope (invasive/NIV/HFNC) with a named source. |
| `SOFAResult.missing_components` concept (D-17) | **TRANSFORM** | The one good instinct in the file — absence is at least *recorded*. V2 supersedes it with a first-class evaluation status that is unconstructible without one; the legacy list shows the intent existed and was structurally dropped at persistence. |
| `clinical_score` persistence shape | **REJECT** | Non-null bare int score with no status column is the persistence half of HAZ-0005. |
| Trilhas-era rule set 001-012 (§5) | **REJECT (retain as failure catalog)** | Superseded twice over; unit incoherence and dead-gap defects are valuable only as regression vectors for V2 tests. |
| Legacy "RAT-*" ratification claims (D-19) | **REJECT** | Authority is an owner/agent delegation, not a named clinical approver; void under V2 evidence notation. |

## 9. Surviving elements proposed for V2 specs (PROPOSAL)

1. The Vincent 1996 table itself, cited from the primary source, as the single normative
   reference for any V2 SOFA content — with the four interpretation points that the
   primary source leaves open explicitly enumerated for ratification: respiratory-support
   scope (D-02), unsupported P/F <200 handling (D-02), vasopressor duration condition
   (D-09), combination-vasopressor handling (D-10).
2. Unit discipline as a contract precondition: UCUM-coded quantities for bilirubin
   (mg/dL vs µmol/L), creatinine, platelets, FiO2-as-fraction; unmappable unit →
   `invalid`, never scored (per evaluation-status-semantics.md §3.5; the trilhas FiO2
   catastrophe in §5 is the standing justification).
3. §6's table as SAF-0002 absent-input probe vectors; §5's trilhas defects (bilirubin
   1.95, creatinine 5.0, FiO2 percent) as named regression vectors.
4. Per-organ component explanation (candidate-inventory CAND-0003 requirement) and the
   §7.3 rule: no partial total, components never summed across missing organs, ΔSOFA only
   after a ratified baseline convention.

*Reviewed by rodaquino-OMNI (accountable reviewer of record, GDEC-0003). No PHI, no real
patient data; all values in this document are published thresholds or synthetic examples.*
