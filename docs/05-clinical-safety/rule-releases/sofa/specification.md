---
id: RULE-SOFA-0100
title: RULE-SOFA v0.1.0 — SOFA clinical-content specification (release-package precursor)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Complete clinical-content specification for a V2 SOFA rule, re-derived from the primary
  sources (Vincent 1996; Singer 2016 Sepsis-3; SSC 2021) and never copied from legacy code.
  Semantic version 0.1.0 — a 0.x PRECURSOR to a clinical release package per orchestrator
  prompt §6.4, explicitly NOT a signed release. Classification: NOT ACTIONABLE — no
  evidenced populated source exists for any SOFA input (AMH constraint); this is an
  authorship artifact only and claims no runtime readiness.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/rule-releases/sofa/specification.md
  commit_sha_or_version: uncommitted (working tree on cycle-1/clinical-content)
  section_or_lines: whole document
  date_collected: 2026-08-15
  collector: SOFA-family V2 clinical-content specification author (cycle 1, Task 2); accountable reviewer rodaquino-OMNI
  transformation: >
    Re-derived from the primary sources cited in §2, cross-checked against the forensic
    review records LEGREV-SOFA-0001 and LEGREV-QSOFA-0001 for legacy-defect avoidance only.
    No legacy formula, constant, or code was copied. Author choices are labeled
    INFERENCE/PROPOSAL; published definitions are labeled SOURCE.
  confidence: medium (SOURCE band values: high; all clinical dispositions: unratified)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003, SAF-0006, SAF-0017, SAF-0019, SAF-0022, SAF-0023, SAF-0025, SAF-0027, SAF-0030, SAF-0033, SAF-0035, SAF-0040, SAF-0041]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0032, HAZ-0036, HAZ-0043, HAZ-0044]
  adrs: [ADR-0008 (pending — this spec is an input), sedation-confounding ADR (pending, input at legacy-review/neuro-sedation-scores/REV-NS-01-gcs.md §4)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RULE-SOFA v0.1.0 — clinical-content specification (release-package precursor)

## 0. Identity, status, classification

| Field | Value |
|---|---|
| Rule identifier | **RULE-SOFA** |
| Semantic version | **0.1.0** — a 0.x precursor; unsigned; not a release |
| Status | **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)** |
| Classification | **NOT ACTIONABLE — no evidenced populated source (AMH constraint); authorship artifact only** |
| Clinical owner | UNASSIGNED — VALIDATION REQUIRED |
| Independent approver | UNASSIGNED — VALIDATION REQUIRED (author ≠ approver; the author of this spec approves nothing) |
| Machine-readable logic | `logic.yaml` (this directory), SHA-256 `ccac846e1525e8cddb946ade9801bd48edd9191449148100b57c787c71455a4d` |
| Reference vectors | `reference-vectors.md` (this directory) — all DRAFT/PROPOSAL |
| Rule-local migration summary | `migration-notes.md` (this directory) |

**Why NOT ACTIONABLE, stated without softening.** SOURCE
(`docs/08-interoperability/amh-data/compatibility-finding.md` §3, AMH pinned at
`0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`; restated in LEGREV-SOFA-0001 §7.1): at the
evidence snapshot, AMH has zero populated Observations of any category; no
medication-administration contract with dose granularity; no urine-output source of any
kind. The number of SOFA components computable from evidenced sources is **zero of six**.
Admitting this rule to any runtime today would instantiate HAZ-0043 (permanent
`not_evaluated` habituated into reassuring quiet). This document therefore authors
clinical content for a future, source-evidenced release; it activates nothing and claims
no runtime readiness.

**What this rule emits (when a future signed release runs it):** six per-organ component
scores, each with its own evaluation status, and a total 0–24 emitted only under §5's
conditions. **What it never emits:** partial totals; mortality-risk bands (legacy D-18
REJECTED — any banding requires its own named source and ratification); any sepsis
determination (Sepsis-3 ΔSOFA ≥2 requires a ratified baseline convention that does not
exist — out of scope for 0.1.0, see OQ-14).

## 1. Intended use, population, exclusions

### 1.1 Intended use (advisory only)

PROPOSAL, subordinate to `docs/01-vision-and-intended-use/intended-use-statement.md`
(IU-03, IU-05, IU-09): RULE-SOFA describes organ-dysfunction severity for **adult ICU
patients** as **advisory information** supporting, never replacing, clinician judgement
(IU-09). The instrument characterizes dysfunction across six organ systems; it is not a
diagnostic test, not a sepsis screen (see LEGREV-QSOFA-0001 §6 for the SSC 2021 screening
constraint on the qSOFA sibling), and not a treatment directive. Cadence: periodic (daily
convention, §4.0); not a minute-scale surveillance instrument.

### 1.2 Population — ENFORCEABLE gate

| Condition | Behavior | Basis |
|---|---|---|
| Age ≥ 18 years, verified from a trusted demographic source | In population; evaluate | IU-05 (adult ≥18 PROPOSAL); VAL-0006/VAL-0007 |
| Age **unknown** (absent, unresolved identity, untrusted source) | **`not_evaluated` (reason `population_unverified`)** — the rule NEVER assumes adult | HAZ-0036 (PH-11 mechanism: adult instrument on unknown-age patient); evaluation-status-semantics.md §3.3 |
| Age < 18 | `not_evaluated` (reason `out_of_population_scope`) | VAL-0006/VAL-0007 are BLOCKING and undecided; SOFA is an adult instrument |

The paediatric/neonatal scope decision (IU-06) is a 🚩 BLOCKING human decision. Until it
is DECIDED, the gate above is the only safe behavior; a paediatric SOFA variant, if ever
wanted, is a separately evidenced instrument.

### 1.3 Exclusions and carve-outs — FLAGGED FOR REVIEWER DECISION (OQ-11)

None of the following is decided by this document; each is flagged per HAZ-0044 and the
intended-use statement's "neither included nor excluded" sub-populations:

1. **Palliative care / goals-of-care restriction (HAZ-0044).** A SOFA evaluation on a
   patient with a documented treatment-limitation order is technically correct and may be
   clinically unwanted as a work-item driver. PROPOSAL: evaluation itself is not
   suppressed (the score may still inform comfort-oriented decisions), but any future
   alert/work-item binding must consult care-goal context. Reviewer must decide.
2. **Chronic organ dysfunction.** SOFA measures dysfunction, not acuity. A cirrhotic
   patient's chronic hyperbilirubinemia, a dialysis patient's chronic creatinine, or
   chronic thrombocytopenia will score points that do not represent acute change.
   SOURCE (Singer 2016): baseline SOFA "can be assumed to be zero in patients not known
   to have preexisting organ dysfunction" — the converse (known chronic dysfunction)
   has no operational convention here. PROPOSAL: 0.1.0 scores measured physiology as-is
   and the explanation text must not claim acuity; interpretation caveat surfaces in the
   explanation (§7). Reviewer must decide whether chronic-dysfunction annotation or
   exclusion is required before any release.
3. **Renal replacement therapy.** Creatinine under RRT does not reflect native renal
   function. Flagged; no convention proposed without a source.
4. **ECMO.** PaO2/FiO2 is not interpretable on extracorporeal support. Flagged.
5. **Setting.** Adult ICU only (IU-03); all other settings UNDECIDED (IU-04a–f).

## 2. Normative sources — verified

Primary sources only; each verified by this author on 2026-08-15 (verification method
stated per citation). The legacy repository is NOT a source of clinical content.

1. **SOURCE — Vincent JL, Moreno R, Takala J, Willatts S, De Mendonça A, Bruining H,
   Reinhart CK, Suter PM, Thijs LG.** "The SOFA (Sepsis-related Organ Failure Assessment)
   score to describe organ dysfunction/failure. On behalf of the Working Group on
   Sepsis-Related Problems of the European Society of Intensive Care Medicine."
   *Intensive Care Medicine*. 1996;22(7):707–710. doi:10.1007/BF01709751.
   Publisher: Springer, on behalf of ESICM.
   URL: <https://link.springer.com/article/10.1007/BF01709751>.
   *Verification:* DOI resolution to the Springer article record confirmed 2026-08-15
   (publisher access control prevented full-text fetch in this environment); the defining
   six-component table was verified against the faithful reproduction in Lambden S,
   Laterre PF, Levy MM, Francois B, "The SOFA score—development, utility and challenges
   of accurate assessment in clinical trials," *Critical Care* 2019;23:374,
   <https://pmc.ncbi.nlm.nih.gov/articles/PMC6880479/> (secondary rendering used as a
   verification aid only, not as a normative source), and against the independently
   hashed forensic record LEGREV-SOFA-0001 §3. This is the **single normative reference**
   for all band values in §4.
2. **SOURCE — Singer M, Deutschman CS, Seymour CW, et al.** "The Third International
   Consensus Definitions for Sepsis and Septic Shock (Sepsis-3)." *JAMA*.
   2016;315(8):801–810. doi:10.1001/jama.2016.0287.
   URL: <https://jamanetwork.com/journals/jama/fullarticle/2492881> (also
   <https://pmc.ncbi.nlm.nih.gov/articles/PMC4968574/>).
   *Verification:* fetched live 2026-08-15; bibliographic identity, the ΔSOFA ≥2
   operationalization, and the baseline-assumed-zero convention confirmed. Used here for:
   contemporary standing of SOFA, the ΔSOFA caveat (OQ-14), and the baseline convention
   caveat (§1.3.2). NOT used to alter any 1996 band value.
3. **SOURCE — Evans L, Rhodes A, Alhazzani W, et al.** "Surviving Sepsis Campaign:
   International Guidelines for Management of Sepsis and Septic Shock 2021."
   *Intensive Care Medicine* 2021;47:1181–1247, doi:10.1007/s00134-021-06506-y (parallel
   publication *Critical Care Medicine* 2021;49(11):e1063–e1143,
   doi:10.1097/CCM.0000000000005337).
   URL: <https://pmc.ncbi.nlm.nih.gov/articles/PMC8486643/>.
   *Verification:* fetched live 2026-08-15; bibliographic identity and the screening
   recommendation ("recommend against using qSOFA … as a single screening tool", strong
   recommendation) confirmed. Used here for: guideline-surveillance triggers (§9) and
   use-context constraints; contributes no band values.

**Anti-provenance:** the legacy artifacts (`services/sofa.py`, trilhas rule records) are
cited only through the hashed review records in
`docs/05-clinical-safety/legacy-review/sepsis-scores/` and only as a defect catalog
(see `migration-notes.md`). No numeric constant in this specification was taken from
legacy code; identical numbers exist only where legacy happened to match Vincent 1996.

## 3. Canonical inputs

### 3.1 Inputs table

All LOINC bindings are **candidate** codes (PROPOSAL) pending the terminology
architect's pinned value sets (matrix rows SOFA-01..SOFA-06 record `NOT_SPECIFIED (R9)`).
All freshness windows are **PROPOSAL** — see §3.2. Canonical-unit choices are I-6.

| # | Input | LOINC candidate(s) | Canonical unit (UCUM) | Accepted alternates → conversion | Acceptable range | Freshness window (PROPOSAL) | Missing behavior | Stale behavior | Conflict behavior |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Age (demographic) | 30525-0 | a | — | 18–130 in-population | Encounter-constant | Whole-rule `not_evaluated` (`population_unverified`) | n/a | Unresolved identity → `population_unverified` |
| 2 | PaO2 (arterial) | 2703-7 | mm[Hg] | kPa → ×7.50062 | 30–700 | 24 h (expiry 48 h) | Respiration `not_evaluated` | Respiration `stale`/expired | Simultaneous unreconciled values → respiration `invalid` |
| 3 | FiO2 | 3150-0, 19994-3 | 1 (fraction) | % → ÷100; unitless value >1.0 → `invalid` (never heuristic-divide) | 0.21–1.0 | Paired: within 30 min of PaO2 specimen | Respiration `not_evaluated` (ratio incomputable) | Pairing failure → `not_evaluated` (`unpaired_fio2`) | As #2 |
| 4 | Respiratory-support status | none pinned — VALIDATION REQUIRED | coded concept | — | {invasive MV, NIV/CPAP, HFNC, none} | Within 1 h of qualifying PaO2 | Required only when ratio <200; then `not_evaluated` (`missing_required_input:respiratory_support_status`) | As window | Contradictory simultaneous states → `invalid` |
| 5 | Platelets | 777-3, 26515-7 | 10\*3/uL | 10\*9/L ≡ identical | 1–2000; **0 → `invalid`** (implausible; known legacy missing-sentinel) | 24 h (expiry 48 h) | Coagulation `not_evaluated` | Coagulation `stale`/expired | Coagulation `invalid` |
| 6 | Bilirubin, total | 1975-2 (mass), 14631-6 (molar) | mg/dL | µmol/L → ÷17.104 | 0.1–60 mg/dL | 24 h (expiry 48 h) | Liver `not_evaluated` | Liver `stale`/expired | Liver `invalid` |
| 7 | MAP | 8478-0 | mm[Hg] | — (derivation from SBP/DBP: OQ, not admitted in 0.1.0) | 20–200 | 4 h (expiry 8 h) | See CV logic §4.4 | CV `stale`/expired | CV `invalid` |
| 8 | Vasoactive agent identity | medication code; ATC candidates C01CA03 (norepinephrine), C01CA24 (epinephrine), C01CA04 (dopamine), C01CA07 (dobutamine); RxNorm pin VALIDATION REQUIRED | coded concept | synonym normalization (noradrenaline≡norepinephrine, adrenaline≡epinephrine) | tabulated set only | Administration interval overlapping T | No active agent = a valid state (CV from MAP) | n/a | Contradictory administration records → CV `invalid` |
| 9 | Vasoactive dose rate | (administration attribute) | ug/kg/min | µg/min or mL/h → conversion requires weight #10 and concentration; policy VALIDATION REQUIRED | dopamine 0.5–60; dobutamine 0.5–40; epi/norepi 0.01–5 | Active at T; rate sustained ≥1 h (I-3); last confirmation ≤2 h (expiry 4 h) | Agent active + dose missing → CV `not_evaluated` (`missing_dose`) — **never a guessed tier** | CV `stale`/expired | CV `invalid` |
| 10 | Body weight (dose normalization only) | 29463-7 | kg | — | 30–300 | 7 d (expiry 14 d) | Needed only for non-normalized dose units → then CV `not_evaluated` (`missing_weight`) | As window | CV `invalid` |
| 11 | GCS total (E/V/M) | 9269-2 (9267-6, 9270-0, 9268-4) | {score} | — | integers 3–15; outside → `invalid` | 12 h (expiry 24 h) | CNS `not_evaluated` | CNS `stale`/expired | CNS `invalid` |
| 12 | RASS (confounder gate only) | none pinned — VALIDATION REQUIRED | ordinal | — | −5..+4 | Within 1 h of qualifying GCS | RASS absent → sedation state unknown: see §4.5 | n/a | CNS `invalid` |
| 13 | Creatinine | 2160-0 (mass), 14682-9 (molar) | mg/dL | µmol/L → ÷88.42 | 0.1–25 mg/dL | 24 h (expiry 48 h) | Renal `not_evaluated` | Renal `stale`/expired | Renal `invalid` |
| 14 | Urine output (interval) | 9187-6, 3167-4 | mL over explicit 24-h interval | — | 0–10000; **0 is a VALID value (anuria)**, never a missing-marker | Interval ending ≤4 h before T (expiry: ending >8 h before T) | Renal `not_evaluated` (`missing_required_input:urine_output`) — default pending OQ-7 | Renal `stale`/expired | Renal `invalid` |

**Unit discipline (HAZ-0032 control):** every quantity arrives UCUM-coded; conversion to
the canonical unit uses the exact factor **before** band comparison, without pre-rounding,
and is recorded (`unit_conversion_applied`). An absent or unmappable unit on a
unit-bearing quantity makes the component `invalid` (reason `unmappable_unit`) — never
scored, never dropped to a reduced assessment (evaluation-status-semantics.md §3.5). The
trilhas FiO2 percent/fraction catastrophe (LEGREV-SOFA-0001 §5 rule 002/008) is the
standing justification.

**Bilirubin canonical unit — I-6 (PROPOSAL with rationale):** canonical unit is
**mg/dL**. Justification: (a) Vincent 1996's continuous band set is the mg/dL column; the
printed µmol/L bands (<20 / 20–32 / 33–101 / 102–204 / >204) are rounded conversions
whose printed edges are non-contiguous (e.g. 32.5 µmol/L falls between printed bands but
is exactly 1.90 mg/dL = band 1) and are therefore **not** an independent band set;
(b) the evidenced source environment reports mass units (matrix row SOFA-03: Brazilian
laboratories commonly report mass-per-volume), minimizing conversions. Conversion at the
boundary: µmol/L values are converted with the exact factor 17.104 (bilirubin molar mass
584.66 g/mol) and compared in mg/dL; the same policy applies to creatinine (factor
88.42). Reviewer must ratify (OQ-6).

### 3.2 Freshness windows — proposed discharge of VAL-0023 for SOFA

VAL-0023 asks: what freshness window applies to each clinical input, and which missing
components invalidate versus degrade a score? For RULE-SOFA this specification proposes
the concrete windows in §3.1 (summarized below) and the algebra in §5. Every number is
PROPOSAL with rationale; ratification by `AUTH-CLINSAFETY` closes VAL-0023 for this rule.

| Input class | Window | Expiry (→ `not_evaluated`) | Rationale (PROPOSAL) |
|---|---|---|---|
| Laboratory (platelets, bilirubin, creatinine, PaO2) | 24 h | 48 h | SOFA's published daily-scoring convention; ICU daily-lab cadence. A lab older than one scoring cycle no longer describes "today's" organ state; older than two cycles is no conclusion at all. |
| FiO2 | within 30 min of the PaO2 specimen | n/a (pairing constraint) | The ratio is only meaningful for the FiO2 at gas draw; FiO2 changes minute-scale with titration. |
| Respiratory-support status | within 1 h of the PaO2 specimen | n/a | Bands 3–4 are conditional on support contemporaneous with the measured ratio. |
| MAP | 4 h | 8 h | Hemodynamics evolve minute-to-hour scale; ICU vital cadence is ≤4 h even without continuous monitoring. A 24 h window (lab convention) would score yesterday's hemodynamics — the acute half of the score must be held to a tighter standard (LEGREV-SOFA-0001 §7.3). |
| Vasoactive agent + dose | active at T; rate sustained ≥1 h; last rate confirmation ≤2 h | 4 h | The ≥1 h condition is SOURCE (Vincent 1996). Titration cadence makes an unconfirmed hours-old rate untrustworthy for tiering. |
| GCS | 12 h | 24 h | Shift-cadence neurological assessment; more frequent in unstable patients but 12 h is the defensible outer bound for "current" consciousness. |
| RASS | within 1 h of the GCS | n/a | A sedation confounder must be contemporaneous with the assessment it confounds. |
| Urine output | 24-h interval ending ≤4 h before T | interval ending >8 h before T | An interval measure: the window constrains the interval's end lag, not an instant. Daily fluid-balance charting convention. |
| Body weight | 7 d | 14 d | Dosing-weight stability; only consumed for dose-unit normalization. |
| Age | encounter-constant | n/a | Population gate; no window concept. |

**Stale vs expired (per evaluation-status-semantics.md §3.4):** an input outside its
window but inside its expiry renders the component `stale` — the last value and its age
are shown, the component score is not readable, and the total does not compute. Beyond
expiry the component is `not_evaluated` (reason `expired_input`) — an arbitrarily old
conclusion is no conclusion. Staleness is computed from preserved source clinical time
against the evaluation clock at read time, never from receipt time or row order.

## 4. Per-component logic — re-derived from Vincent 1996

### 4.0 Evaluation semantics

- **Evaluation instant `T`; assessment window `[T−24h, T]`.** SOURCE (Vincent 1996): the
  score was designed for daily assessment. INFERENCE/PROPOSAL (I-9): within the window,
  the **most abnormal (worst) qualifying value** per input is selected, consistent with
  the serial-SOFA literature's daily-worst convention (Ferreira FL, et al. *JAMA*
  2001;286(14):1754–1758 — cited for convention identification only); the primary source
  does not fully specify aggregation, so this is an author choice requiring ratification
  (OQ-10). Selection happens **after** validity screening; an invalid in-window value
  poisons the component (§5), it is not silently skipped.
- **Band assignment:** each component's bands are evaluated as predicates and the
  **highest satisfied band** is assigned. This reading reproduces the published table's
  cumulative structure and resolves the unsupported-P/F case (§4.1) without inventing a
  rule.
- All cut-point comparisons occur in canonical units at full precision.

### 4.1 Respiration (SOFA-RESP)

SOURCE (Vincent 1996) — PaO2/FiO2 in mm[Hg]:

| Score | Condition |
|---|---|
| 0 | ratio ≥ 400 |
| 1 | ratio < 400 |
| 2 | ratio < 300 |
| 3 | ratio < 200 **and** on qualifying respiratory support |
| 4 | ratio < 100 **and** on qualifying respiratory support |

- **Ratio derivation:** ratio = PaO2 ÷ FiO2 from a validated, time-paired pair (§3.1
  rows 2–3). No SpO2/FiO2 surrogate exists in this rule (deliberate; legacy D-03 —
  any surrogate requires its own citation and separate ratification).
- **I-1 (PROPOSAL):** "respiratory support" (the 1996 term) is operationalized as
  invasive mechanical ventilation **or** non-invasive positive pressure (NIV/CPAP).
  HFNC does **not** qualify in 0.1.0 (post-1996 modality, uncited in the primary
  source) — reviewer decision OQ-1.
- **I-2 (INFERENCE, ratification required — OQ-2):** ratio < 200 **without** qualifying
  support: bands 3–4's conditions are unsatisfied, so the highest satisfied band is
  **2**. This follows from the band structure itself (not imported from legacy, whose
  identical outcome was an uncited convention — LEGREV-SOFA-0001 D-02).
- **Support status is a required input only when the ratio is < 200** (it cannot change
  the band otherwise). If ratio < 200 and support status is unknown → component
  `not_evaluated` (reason `missing_required_input:respiratory_support_status`) — the rule
  never assumes either direction.

### 4.2 Coagulation (SOFA-COAG)

SOURCE (Vincent 1996) — platelets ×10³/µL:

| Score | Condition |
|---|---|
| 0 | ≥ 150 |
| 1 | < 150 |
| 2 | < 100 |
| 3 | < 50 |
| 4 | < 20 |

Platelets = 0 is `invalid` (§3.1 row 5): physiologically implausible as a measured count
and a documented legacy missing-sentinel (trilhas rule 003) — it must never band as 4,
and never mean "no data".

### 4.3 Liver (SOFA-LIVER)

SOURCE (Vincent 1996) — total bilirubin, canonical mg/dL (I-6, §3.1), continuous bands
(no dead gaps — the trilhas [1.9, 2.0) crash region is unrepresentable here):

| Score | Condition |
|---|---|
| 0 | < 1.2 |
| 1 | ≥ 1.2 and < 2.0 |
| 2 | ≥ 2.0 and < 6.0 |
| 3 | ≥ 6.0 and < 12.0 |
| 4 | ≥ 12.0 |

### 4.4 Cardiovascular (SOFA-CV)

SOURCE (Vincent 1996) — adrenergic doses in µg/kg/min, **administered for at least 1 h**:

| Score | Condition |
|---|---|
| 0 | no tabulated vasoactive agent active and MAP ≥ 70 mm[Hg] |
| 1 | no tabulated vasoactive agent active and MAP < 70 mm[Hg] |
| 2 | dopamine ≤ 5 **or** dobutamine (any dose) |
| 3 | dopamine > 5 **or** epinephrine ≤ 0.1 **or** norepinephrine ≤ 0.1 |
| 4 | dopamine > 15 **or** epinephrine > 0.1 **or** norepinephrine > 0.1 |

Deterministic rules (each labeled):

- **Vasopressor evidence dominates (SOURCE-faithful; fixes legacy D-07).** Bands 2–4 do
  not reference MAP. A patient on a qualifying agent with a valid dose and duration is
  scoreable **with MAP absent**; missing MAP must never zero, downgrade, or block a
  tier-4 patient. MAP is a required input **only** when no tabulated agent is active
  (bands 0/1); then MAP absent → `not_evaluated` (`missing_required_input:map`).
- **I-3 (PROPOSAL — OQ-3):** the 1996 duration condition "for at least 1 h" is
  operationalized as: the administration record shows the qualifying rate sustained for
  ≥ 60 min at T. During the first hour of a newly started infusion the tier condition is
  not yet met → component `not_evaluated` (reason `duration_condition_unmet`) rather
  than a guessed tier; reviewer may prefer a different convention.
- **I-4 (PROPOSAL — OQ-4):** combination therapy (routine in shock): component score =
  **max** of the per-agent bands across all active tabulated agents. The primary source
  is silent on combinations; max-of-tiers is the only direction-safe choice (any other
  combiner can only under-score).
- **I-5 (PROPOSAL — OQ-5):** an active vasoactive agent **outside** the tabulated set
  (vasopressin, phenylephrine, …) has no band in the primary source. Default: component
  `not_evaluated` (reason `vasoactive_agent_unmapped`) — deliberately conservative;
  never a guessed tier (rejects legacy D-10, which scored vasopressin *below* low-dose
  dopamine). Reviewer may ratify a sourced mapping; until then the rule declines to
  score.
- **Agent active + dose missing → `not_evaluated` (reason `missing_dose`).** Never a
  default tier (legacy D-10 REJECTED). Dose rates must be weight-normalized µg/kg/min;
  non-normalized source units require weight (§3.1 row 10) and an explicit conversion
  policy (VALIDATION REQUIRED) or the component is `not_evaluated` (`missing_weight`) /
  `invalid` (`unmappable_unit`) as applicable.
- MAP source: a device-reported mean pressure (LOINC 8478-0). Deriving MAP from SBP/DBP
  is **not admitted** in 0.1.0 (formula exists in legacy but its admission is a clinical
  choice); flagged in OQ-9's window review as a candidate future input.

### 4.5 Central nervous system (SOFA-CNS)

SOURCE (Vincent 1996) — Glasgow Coma Scale:

| Score | Condition |
|---|---|
| 0 | GCS = 15 |
| 1 | GCS 13–14 |
| 2 | GCS 10–12 |
| 3 | GCS 6–9 |
| 4 | GCS < 6 |

- GCS is an integer in 3–15; values outside → `invalid` (reason `out_of_range`) —
  legacy D-13 control.
- **Sedation caveat — I-8 (PROPOSAL, cross-referenced to the pending
  sedation/neuro-assessment confounding ADR; input recorded at
  `docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-01-gcs.md` §4):**
  a GCS observed while a **sedative infusion is active** without a documented
  interruption window is pharmacologically confounded — default in 0.1.0: CNS component
  `not_evaluated` (reason `sedation_confounded`), with the last pre-sedation GCS
  surfaced in the explanation. Contemporaneous RASS ≤ −3 **with** active sedation
  confirms confounding; RASS ≤ −3 with **documented absence** of sedative exposure is
  genuine coma and scores normally (INFERENCE — this refines REV-NS-01 §4's coarser
  "RASS ≤ −3" trigger, which read alone would render unsedated structural coma
  unscoreable; the refinement is flagged for the pending ADR). If sedative-exposure
  information is unavailable, sedation state is unknown: 0.1.0 scores the GCS and the
  explanation must disclose "sedation state not assessed" — reviewer must decide whether
  unknown-sedation should instead block scoring (OQ-8). This entire clause is
  subordinate to the pending ADR and will be superseded by it.
- **Untestable components:** if any E/V/M component is untestable (e.g. verbal in an
  intubated patient) the total GCS is not computable → `not_evaluated` (reason
  `component_not_testable`). No minimum-fill, no imputation (REV-NS-01 REJECTED
  behaviors).

### 4.6 Renal (SOFA-RENAL)

SOURCE (Vincent 1996) — creatinine (canonical mg/dL) **or** urine output:

| Score | Creatinine condition | Urine-output condition |
|---|---|---|
| 0 | < 1.2 | ≥ 500 mL/day |
| 1 | ≥ 1.2 and < 2.0 | — |
| 2 | ≥ 2.0 and < 3.5 | — |
| 3 | ≥ 3.5 and < 5.0 | < 500 mL/day |
| 4 | ≥ 5.0 | < 200 mL/day |

- Component score = **max**(creatinine band, urine-output band) — the published "or"
  across a shared band scale. Creatinine bands are continuous: creatinine exactly 5.0
  is band 4 (the trilhas dead-gap defect is unrepresentable).
- Urine output 0 mL/24h is a **valid, maximal-severity value** (anuria → band 4), never
  a missing-marker. Missingness is representable only as an absent input.
- **I-7 (PROPOSAL — OQ-7, feeds ADR-0008):** default in 0.1.0, **both** sub-inputs are
  required for a `valid` renal component. Rationale: a creatinine-only renal score can
  under-score by up to 4 points (oliguric patient, still-normal creatinine) — exactly the
  false-reassurance direction of HAZ-0005 — and the legacy one-input renal score with no
  partiality marker (D-16) is REJECTED. Consequence stated honestly: with no urine-output
  source evidenced anywhere (matrix SOFA-06), the renal component is permanently
  `not_evaluated` under this default. The reviewer may instead ratify creatinine-only
  scoring as a **declared component-level partial policy** under
  evaluation-status-semantics.md §3.2 (with the mandatory disclosure "urine output not
  assessed — renal score is a lower bound"); this spec deliberately does not self-approve
  that policy.

## 5. Evaluation-status mapping

Component-level statuses use the five-state vocabulary of
`docs/05-clinical-safety/evaluation-status-semantics.md`; `partial` is currently
unusable anywhere in this rule because its entry condition (an explicitly approved
partial policy with an independent clinical approver) is unmet.

### 5.1 Component level

| Condition | Component status |
|---|---|
| All required inputs present, in-window, in-range, unit-mapped; predicates evaluated | `valid` (score 0–4 readable) |
| Any required input absent | `not_evaluated` (reason `missing_required_input:<input>`) |
| Required input present only outside window, inside expiry | `stale` (value + age shown; **score not readable**) |
| Required input beyond expiry | `not_evaluated` (reason `expired_input:<input>`) |
| Any in-window value out-of-range, unit-unmappable, or in unreconciled simultaneous conflict | `invalid` (reason) — the offending value is never silently dropped |
| Sedation-confounded GCS (§4.5), unmapped agent (§4.4), unmet duration (§4.4) | `not_evaluated` (specific reason) |

### 5.2 Total

- The total (0–24) is computed and emitted **only when all six components are `valid`**.
- Any component `invalid` → total `invalid`, reasons enumerating the offending
  components (integrity doubt propagates; precedence `invalid` > `not_evaluated` >
  `stale` > `valid`).
- Otherwise, any component not `valid` → total **`not_evaluated`**, with machine-readable
  reasons enumerating every non-valid component and its reason, and with per-component
  detail (including the components that *are* valid) available to the clinician.
- **No partial totals, ever** (partial-SOFA analysis, LEGREV-SOFA-0001 §7.3): a k-of-6
  sum is a different, unvalidated instrument wearing SOFA's name; if clinical governance
  wants the computable fragment surfaced, it is per-organ components, never summed.
- **No zero-coercion anywhere (HAZ-0005 primary control):** absence, staleness,
  invalidity, and confounding are representable **only** as status + reason. No numeric
  value, no "last known", no band, and no default may substitute. The SAF-0002
  absent-input probe applies to every value-producing surface of this rule, with
  LEGREV-SOFA-0001 §6's table as mandatory negative vectors.
- Fallback: any condition not covered by this specification →
  `not_evaluated` (reason `unspecified_condition`), and that occurrence is an
  operational signal. There is no "unknown → assume fine" path.
- Source data quality is a separate dimension and never maps into these statuses
  (two-dimension rule, evaluation-status-semantics.md §5); a quarantined input →
  `not_evaluated` (`quarantined_input`), and unknown source quality is not evidence of
  good quality.

## 6. Deterministic machine-readable logic

The declarative logic (bands, predicates, windows, status algebra — data, no code) is
`logic.yaml` in this directory.

- Content hash (SHA-256): `ccac846e1525e8cddb946ade9801bd48edd9191449148100b57c787c71455a4d`
- Precedence: where `logic.yaml` and this document disagree, **this document governs**
  and the disagreement is a defect to be fixed before any signing.
- A future signed release binds RuleBundle → RuleVersion 1.x + TerminologySnapshot +
  TestPack + Approval; none of these exist for 0.1.0 and this hash is a working-tree
  integrity aid, not a signature.

## 7. Explanation text (clinician display)

Wording is PROPOSAL; pt-BR phrasing requires validation with pt-BR clinicians
(evaluation-status-semantics.md §6) — this is a clinical-communication act, not a
translation exercise. Placeholders in `{}`.

**EN — total valid:**
> SOFA score {total} of 24 — rule RULE-SOFA v{version}. Assessment window: the 24 hours
> ending {T}. Components: respiration {s} (PaO2/FiO2 {v}, {t}); coagulation {s}
> (platelets {v} ×10³/µL, {t}); liver {s} (bilirubin {v} mg/dL, {t}); cardiovascular {s}
> ({basis: MAP {v} mm Hg | {agent} {dose} µg/kg/min ≥1 h}, {t}); neurological {s}
> (Glasgow {v}, {t}{, sedation state not assessed}); renal {s} (creatinine {v} mg/dL,
> {t}; urine output {v} mL/24 h). All six organ systems were assessed with in-window
> data. SOFA describes organ dysfunction; it is not by itself a diagnosis of sepsis and
> does not distinguish acute from chronic dysfunction. This is advisory information to
> support the care team's judgement — it is not a directive and mandates no action.

**EN — total not evaluated:**
> SOFA score: **not evaluated**. The total was not calculated because: {reasons, e.g.
> "platelet count missing; Glasgow not assessed (sedation)"}. No number is shown because
> a total computed without these organ systems could be falsely reassuring. Organ
> systems that could be assessed are shown individually with their own status. What is
> needed to complete the assessment: {missing measurements}. Advisory only.

**pt-BR — total valid:**
> Escore SOFA {total} de 24 — regra RULE-SOFA v{version}. Janela de avaliação: as 24
> horas até {T}. Componentes: respiratório {s} (PaO2/FiO2 {v}, {t}); coagulação {s}
> (plaquetas {v} ×10³/µL, {t}); hepático {s} (bilirrubina {v} mg/dL, {t});
> cardiovascular {s} ({base: PAM {v} mm Hg | {agente} {dose} µg/kg/min ≥1 h}, {t});
> neurológico {s} (Glasgow {v}, {t}{, estado de sedação não avaliado}); renal {s}
> (creatinina {v} mg/dL, {t}; débito urinário {v} mL/24 h). Todos os seis sistemas foram
> avaliados com dados dentro da janela. O SOFA descreve disfunção orgânica; não é, por si
> só, diagnóstico de sepse e não distingue disfunção aguda de crônica. Informação de
> apoio à decisão da equipe assistente — não é uma diretriz e não determina conduta.

**pt-BR — total não avaliado:**
> Escore SOFA: **não avaliado**. O total não foi calculado porque: {motivos, ex.
> "contagem de plaquetas ausente; Glasgow não avaliado (sedação)"}. Nenhum número é
> exibido porque um total calculado sem esses sistemas orgânicos poderia gerar falsa
> tranquilidade. Os sistemas avaliáveis são exibidos individualmente com seu próprio
> status. O que falta para completar a avaliação: {medidas ausentes}. Informação de
> apoio apenas.

Minimum content obligations (every display): inputs used with source times; missing-input
disclosure; rule version; freshness/age of oldest contributing input; advisory-only
framing; per-organ attribution (a bare aggregate number is not an acceptable display —
CAND-0003 explanation requirement).

## 8. Linked hazards and controls

| Hazard | Relevance to RULE-SOFA | Controls in this spec | Linked SAF |
|---|---|---|---|
| **HAZ-0005** (primary) | Missing input coerced to zero → false reassurance; occurred in legacy (E1) | §5 status algebra; no partial totals; no zero-coercion; reference vectors CRV-0117/0118/0119; SAF-0002 probe obligation | SAF-0001, SAF-0002, SAF-0003, SAF-0006, SAF-0019, SAF-0030 |
| **HAZ-0006** | Stale inputs scored as current | §3.2 per-input windows + expiry; `stale` never renders severity | SAF-0004 (via evaluation-status-semantics) |
| **HAZ-0032** | Unit mis-mapping (17× bilirubin error class) | §3.1 UCUM discipline; convert-then-compare; `invalid` on unmappable unit; CRV-0110/0130 | SAF-0032 (two-dimension rule per semantics §5) |
| **HAZ-0036** | Adult instrument evaluated outside approved population/setting | §1.2 enforceable age gate; unknown age never assumed adult; CRV-0127/0128 | SAF-0035, SAF-0027, SAF-0020, SAF-0023 |
| **HAZ-0043** | Admission with no populated sources → permanent `not_evaluated` read as quiet | §0 NOT ACTIONABLE classification; §9 M-1 emptiness surveillance; admission blocked until sources evidenced | SAF-0040, SAF-0035, SAF-0033, SAF-0025, SAF-0006 |
| **HAZ-0044** | Escalation contrary to documented goals of care | §1.3.1 carve-out flagged for reviewer; any future work-item binding must consult care-goal context | SAF-0041, SAF-0035, SAF-0022, SAF-0017, SAF-0023 |

## 9. Monitoring, rollback, kill switch, review cadence

All PROPOSAL; numbers require ratification. These apply to a future signed release; they
are specified now because §6.4 requires them in the package.

**Monitoring thresholds:**
- **M-1 (HAZ-0043):** share of evaluations `not_evaluated`, by reason, per unit per day.
  If `not_evaluated` = 100% for 14 consecutive days, mandatory portfolio review of the
  rule's admission. Any reason's share moving >20 percentage points day-over-day →
  operational alert.
- **M-2 (HAZ-0005 canary):** any emission of a numeric total with fewer than six `valid`
  components, observed by runtime assertion or synthetic probe → severity-1 defect,
  automatic kill-switch trigger. Target rate: zero; a single occurrence is a release
  blocker.
- **M-3 (HAZ-0032):** `invalid` rate by reason; `unmappable_unit` >1% of any input's
  volume over 7 days → data-contract escalation.
- **M-4 (HAZ-0036):** proportion of evaluations blocked `population_unverified`; any
  evaluation of a verified age <18 → severity-1 defect.
- **M-5:** reference-vector replay on every deploy and terminology change; any mismatch
  blocks the deploy.

**Rollback criteria:** a single M-2 or M-4 severity-1 event; vector-replay mismatch;
detected divergence between running logic and the signed content hash; guideline
supersession of any band value.

**Kill switch:** disables RULE-SOFA evaluation platform-wide; every consumer then shows
`not_evaluated` (reason `rule_unavailable`) — never blank, never silent no-fire, never a
frozen last value.

**Review cadence / retirement:**
- Scheduled re-review every 12 months from ratification.
- Event-driven re-review: publication of a Sepsis-4 consensus or any SSC guideline
  update touching SOFA use (guideline surveillance per §2 sources); LOINC/UCUM value-set
  pin changes; AMH source-contract changes affecting any §3.1 input; any status change
  of the linked hazards; ratification of ADR-0008 or the sedation-confounding ADR
  (both supersede parts of §4.5/§5 by design).
- This 0.1.0 precursor lapses if not advanced to named clinical review by 2027-08-15;
  a lapsed precursor may not be revived without re-verifying every citation and pin.

## 10. Coverage against orchestrator prompt §6.4 (release-package field list)

| §6.4 field | Where | 0.1.0 status |
|---|---|---|
| Rule identifier + semantic version | §0 | Present (0.1.0 precursor) |
| Intended use/population/exclusions | §1 | Proposed; exclusions flagged for reviewer |
| External evidence + snapshot date | §2 | Verified 2026-08-15 |
| Clinical owner + independent approver | §0 | **UNASSIGNED — VALIDATION REQUIRED (blocking for any release)** |
| Machine-readable logic/schema + content hash | §6, `logic.yaml` | Present (unsigned working hash) |
| Terminology/value-set versions | §3.1 | **Candidate codes only; no pin — VALIDATION REQUIRED** |
| Completeness and freshness policy | §3.2, §5 | Proposed (discharges VAL-0023 for SOFA upon ratification) |
| Reference vectors, properties, boundary cases, replay corpus | `reference-vectors.md` | Vectors drafted (34, all DRAFT); replay corpus none — requires populated sources |
| Hazard/control links | §8 | Present |
| Explanation text + UX acceptance criteria | §7 | Text proposed; UX acceptance criteria VALIDATION REQUIRED (pt-BR clinician validation) |
| Retrospective/prospective validation status | — | **None. No populated source exists; no validation of any kind has occurred.** |
| Monitoring, rollback, kill switch, retirement/review | §9 | Proposed |

An immutable **signed** bundle exists only at 1.x with every VALIDATION REQUIRED row
closed by named humans. Nothing in 0.1.0 is signable.

## 11. Open questions for the named reviewer (rodaquino-OMNI)

These go to the handoff; none may be closed by an agent.

1. **OQ-1 (I-1):** Respiratory-support scope for bands 3–4 — confirm invasive MV +
   NIV/CPAP; include or exclude HFNC (default here: excluded)?
2. **OQ-2 (I-2):** Confirm the highest-satisfied-band reading: unsupported P/F <200
   scores 2.
3. **OQ-3 (I-3):** Vasopressor duration — accept "qualifying rate sustained ≥60 min at
   T"; and is `not_evaluated` correct during the first hour of a new infusion, or should
   a provisional tier apply?
4. **OQ-4 (I-4):** Combination vasoactive therapy — accept max-of-tiers?
5. **OQ-5 (I-5):** Non-tabulated agents (vasopressin, phenylephrine) — accept
   `not_evaluated` default, or ratify a sourced mapping?
6. **OQ-6 (I-6):** Canonical units mg/dL (bilirubin ÷17.104; creatinine ÷88.42 from
   µmol/L) and convert-before-compare policy — confirm.
7. **OQ-7 (I-7):** Renal component — does the conservative both-inputs default stand, or
   is creatinine-only scoring ratified as a declared component-level partial policy
   (with lower-bound disclosure)? Feeds ADR-0008.
8. **OQ-8 (I-8):** GCS sedation confounding — confirm `not_evaluated` default at RASS
   ≤ −3 / active sedation; decide the unknown-sedation (no RASS) case; subordinate to
   the pending sedation-confounding ADR.
9. **OQ-9 (I-10):** Ratify or adjust every freshness window and expiry in §3.2
   (this is the VAL-0023 discharge decision for SOFA); decide whether SBP/DBP-derived
   MAP is admissible as a fallback input.
10. **OQ-10 (I-9):** Ratify worst-value-in-24h aggregation (convention cited to the
    serial-SOFA literature; not fully specified in Vincent 1996).
11. **OQ-11:** Carve-outs — palliative/goals-of-care (HAZ-0044), chronic organ
    dysfunction, RRT, ECMO: include, exclude, or annotate per §1.3?
12. **OQ-12:** Population gate — confirm ≥18 years and the `population_unverified`
    behavior (blocked on the IU-06 paediatric/neonatal decision).
13. **OQ-13:** Confirm exclusion of mortality-risk banding (legacy D-18 REJECTED) from
    this rule; any future banding needs a named source and its own ratification.
14. **OQ-14:** ΔSOFA (Sepsis-3 sepsis operationalization) — confirm out of scope for
    RULE-SOFA 0.1.0 and that any future ΔSOFA pathway requires a ratified baseline
    convention and its own release.

*Authored by the SOFA-family V2 clinical-content specification author (cycle 1, Task 2).
The author approves nothing; all values are published thresholds or synthetic proposals;
no PHI, no real patient data.*
