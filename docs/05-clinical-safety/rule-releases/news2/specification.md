---
id: RULE-NEWS2
title: NEWS2 clinical-content specification — V2 rule-release precursor 0.1.0
label: PROPOSAL
statement: >
  Complete clinical-content specification for NEWS2 in IntensiCare V2, re-derived from the
  Royal College of Physicians NEWS2 (2017) primary source with corrected SpO2 scale
  governance and explicit missing-data behavior. PROPOSAL — AWAITING NAMED CLINICAL REVIEW
  (reviewer: rodaquino-OMNI). Classification: NOT ACTIONABLE — no evidenced populated source.
provenance:
  source_repo: rcp.ac.uk (primary) + intensicare-V2 (review records)
  path_or_url: https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf
  commit_sha_or_version: "RCP NEWS2 updated report of a working party, 2017 (issuer PDF); legacy pin 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (cited only via review records)"
  section_or_lines: report pp.29-31 (Chart 1, Chart 2, Scale-2 governance), Recommendations 1-2 and 26-30, section 6
  date_collected: 2026-08-15
  collector: NEWS2 V2 clinical-content specification author (cycle-1 Task 2 agent); accountable reviewer rodaquino-OMNI
  transformation: >
    Band tables and governance statements transcribed from the issuer PDF, independently
    re-fetched and text-extracted by this author on 2026-08-15; cross-checked against
    docs/05-clinical-safety/legacy-review/ews/news2-review.md section 2 (same-day issuer
    transcription). No clinical content copied from legacy code.
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003, SAF-0006, SAF-0019, SAF-0035]
  hazards: [HAZ-0005, HAZ-0036, HAZ-0040, HAZ-0043, HAZ-0044]
  adrs: [ADR-0007]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RULE-NEWS2 — clinical-content specification (rule-release precursor)

| Field | Value |
|---|---|
| Rule identifier | `RULE-NEWS2` |
| Semantic version | `0.1.0` (precursor — pre-review, pre-bundle, unsigned) |
| Status | **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)** |
| Classification | **NOT ACTIONABLE — no evidenced populated source.** OBSERVED (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §7.0; HAZ-0043): the AMH evidence snapshot demonstrates **no populated vital-signs profile and zero populated observations** for the seven NEWS2 inputs. This document is clinical-content authorship only. It claims no runtime readiness, no activation path, and no data feed. Admitting this rule to any portfolio before a populated source is evidenced is the HAZ-0043 failure mode. |
| Primary source | Royal College of Physicians. *National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS.* Updated report of a working party. London: RCP, 2017. Issuer PDF: `https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf` (fetched and text-extracted by this author 2026-08-15) |
| Legacy relationship | TRANSFORM with element-level REJECT, per `../../legacy-review/ews/news2-review.md` §6. Nothing in this file is imported from legacy code. See `migration-notes.md`. |
| Companion files | `reference-vectors.md` (CRV set), `migration-notes.md` |

Label discipline: every material claim below is tagged **SOURCE** (cited RCP content),
**INFERENCE**, **PROPOSAL**, or **VALIDATION REQUIRED**. This author approves nothing.

---

## 1. Intended population and exclusions

### 1.1 Published population (SOURCE)

SOURCE (RCP 2017, Recommendations 1–2; section 6, report p.30): NEWS2 is for
"routine clinical assessment of all adult patients (aged 16 years or more)";
it "should not be used in children (ie aged < 16 years) or in women who are
pregnant, because the physiological response to acute illness can be modified in
children and by pregnancy." SOURCE (report p.30): "The NEWS was designed for use in
patients aged 16 years and more and is not recommended for use in children aged under
16 years or during pregnancy."

SOURCE (RCP 2017, Recommendation 3): NEWS2 "may be unreliable in patients with spinal
cord injury (especially tetraplegia or high-level paraplegia)... Use with caution."

### 1.2 Enforceable V2 gate (PROPOSAL)

The RCP permits ≥16 years; the V2 intended-use statement proposes **adult ICU, ≥18
years** (`docs/01-vision-and-intended-use/intended-use-statement.md` IU-05, itself a
PROPOSAL). These must be resolved into one enforceable gate:

| Gate element | Behavior | Basis |
|---|---|---|
| **Age ≥ 18 (verified)** | In population; evaluate. | PROPOSAL — aligns with IU-05. Narrower than RCP's ≥16, therefore never applies the instrument outside its published population. |
| **Age 16–17 (verified)** | **Out of the proposed V2 population** → `not_evaluated`, reason `out_of_population_scope`, with an explicit UI disclosure that this band is RCP-permitted but excluded by V2 intended use. | PROPOSAL. The 16–17 band is a **named-reviewer decision** (open question Q1, §11): admitting it widens V2 intended use; excluding it forgoes RCP-permitted coverage. This spec proposes exclusion until decided. |
| **Age < 16 (verified)** | `not_evaluated`, reason `out_of_population_scope`. Never scored. | SOURCE (RCP Rec 2) + VAL-0006/VAL-0007. |
| **Age unknown / DOB missing, unparseable, or conflicting** | `not_evaluated`, reason `unknown_age`. **Never assume adult.** | PROPOSAL, per VAL-0006/VAL-0007 (BLOCKING) and HAZ-0036 (out-of-population evaluation from untrusted age). Legacy had no age gate at all (news2-review.md D-9 — REJECTED). |
| **Pregnancy documented** | `not_evaluated`, reason `out_of_population_scope` (pregnancy). | SOURCE (RCP Rec 2). The *detection input* (which resource evidences pregnancy, its freshness, its absence semantics) is **VALIDATION REQUIRED** — no trusted pregnancy source is evidenced in AMH. Absent any pregnancy datum, the patient is treated as not-documented-pregnant; whether that default is acceptable is reviewer decision Q2 (§11). |
| **Spinal cord injury** | Not gated; flagged. PROPOSAL: surface the RCP caution in explanation text when a relevant condition is documented; no exclusion. | SOURCE (RCP Rec 3) — "use with caution", not "do not use". |
| **Goals-of-care / palliative context** | Not an evaluation input in 0.1.0. **Flagged to reviewer** (HAZ-0044): a NEWS2-driven escalation display for a patient with documented treatment limitations is technically correct and clinically wrong. Whether care-goal context gates evaluation, gates display, or only annotates is reviewer decision Q3 (§11). | HAZ-0044; intended-use statement records palliative/obstetric/ECMO-CRRT sub-populations as neither included nor excluded. |

INFERENCE: because the gate consumes age/pregnancy inputs that have **no evidenced
populated source**, the gate itself is specifiable but not currently executable —
consistent with the NOT ACTIONABLE classification.

---

## 2. Inputs

### 2.1 Input table

Seven scored parameters plus one governed non-scored input (the SpO2 scale
assignment, §3). Terminology bindings are **candidate bindings (INFERENCE)** — the
terminology architect owns final value sets; UCUM units are normative for comparison.
Plausible ranges and freshness windows are **PROPOSAL — VALIDATION REQUIRED** (they are
clinical parameters; no numbers exist in the RCP source for either).

| # | Input | Candidate LOINC | UCUM | Plausible range (outside → `invalid`) | Freshness window | Expiry horizon | Missing behavior | Stale behavior | Conflict behavior |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Respiration rate | 9279-1 | `/min` | 0–80 | 1 h | 8 h | `not_evaluated` (`missing_required_input:rr`) | §5.3 | §2.3 |
| 2 | SpO2 (pulse oximetry) | 59408-5 (2708-6 noted as arterial-sat alternative — binding decision to terminology architect) | `%` | 40–100 | 1 h | 8 h | `not_evaluated` (`missing_required_input:spo2`) | §5.3 | §2.3 |
| 3 | Supplemental-oxygen status (air vs oxygen) | derived: 3151-8 (inhaled O2 flow rate) > 0, or documented O2 device/therapy in effect; binding VALIDATION REQUIRED | boolean (derivation inputs `L/min`) | n/a (derivation inputs must be non-negative) | 4 h | 24 h | `not_evaluated` (`missing_required_input:o2_status`). **Unknown is never "air"** (legacy §4.2 zero-coercion REJECTED). | §5.3 | §2.3 |
| 4 | Systolic blood pressure | 8480-6 | `mm[Hg]` | 30–300 | 1 h | 8 h | `not_evaluated` (`missing_required_input:sbp`) | §5.3 | §2.3 |
| 5 | Pulse | 8867-4 | `/min` | 10–300 | 1 h | 8 h | `not_evaluated` (`missing_required_input:pulse`) | §5.3 | §2.3 |
| 6 | Consciousness (ACVPU) | 67775-7 (level of responsiveness) — **answer list lacks a standard "C" concept; binding VALIDATION REQUIRED** | coded token ∈ {A, C, V, P, U} | any token outside the set → **`invalid`** (never 0 — §5.4) | 4 h | 24 h | `not_evaluated` (`missing_required_input:consciousness`) | §5.3 | §2.3 |
| 7 | Temperature | 8310-5 | `Cel` | 25–45 | 4 h | 24 h | `not_evaluated` (`missing_required_input:temperature`) | §5.3 | §2.3 |
| G | SpO2 scale assignment (governed order/flag, §3) | none — an order/flag resource, not an Observation | enum {scale1, scale2} + provenance | n/a | encounter-scoped (§3.3) | n/a | **Default Scale 1** (SOURCE-backed safe default, §3.2) | §3.3 | conflicting simultaneous assignments → `invalid` for SpO2 parameter |

Notes:

- **ACVPU 'C' (new confusion).** SOURCE (RCP Recs 29–30): "'new confusion' (including
  disorientation, delirium or any acute reduction in GCS score)" is part of the
  consciousness assessment; "new confusion scores 3 on the NEWS chart, ie a red score."
  SOURCE (RCP Chart 3, per `news2-review.md` §2 transcription): chronic confusion is not
  scored ("no score if chronic"). PROPOSAL: V2 accepts only an explicit ACVPU token; it
  performs **no automatic GCS→ACVPU mapping** in 0.1.0. The GCS-mapping question — and
  the ICU sedation confounder (a sedated/ventilated patient's consciousness reflects
  sedation, not deterioration; `pathway-portfolio/pathway-to-source-matrix.md` NEWS2-07)
  — is flagged to the pending sedation-confounding ADR (no sedation ADR exists yet in
  `docs/06-architecture/adrs/adr-index.md`). Reviewer decision Q4 (§11).
- **Chronic-vs-new confusion.** The 'C' token means *new* confusion by definition. A
  documented chronic-confusion state with no acute change maps to 'A'-equivalent per
  Chart 3; the capture workflow for that distinction is bedside-assessment content,
  VALIDATION REQUIRED.
- **Units.** Source units are preserved verbatim; comparison happens after explicit
  UCUM normalization. An unmappable unit → `invalid` (`unmappable_unit`), never dropped
  (evaluation-status-semantics §3.5).

### 2.2 Freshness-window rationale (discharges VAL-0023 for NEWS2 inputs; PROPOSAL)

SOURCE (RCP 2017, section 7): NEWS2 is anchored to intermittent **ward observation
cadence** — the score "should be used to guide the frequency of patient monitoring."
The RCP proposes no per-input validity windows; there is no legacy policy to import
(shared-findings SF-5: legacy scored whatever fields co-existed on one row, with no
freshness logic anywhere).

INFERENCE → PROPOSAL for the **adult ICU** context: ICU patients have continuous
electronic monitoring for RR, SpO2, pulse, and (via arterial line or ≥hourly NIBP)
blood pressure, so a 1-hour window is conservative for those four — a value older than
1 h in an ICU means the feed or charting has failed, which must surface as
`not_evaluated`, not be papered over. Temperature and consciousness are intermittent
assessments in ICU practice (typically each nursing assessment block), so 4 h.
Supplemental-oxygen status changes with therapy orders and respiratory assessments —
4 h. Expiry horizons (beyond which even a stale display becomes `not_evaluated`,
evaluation-status-semantics §3.4) are set at 8 h for continuous parameters and 24 h
for intermittent ones — 24 h being double the RCP's minimum ward observation interval.
**Every number in this table is a clinical parameter requiring named review
(VAL-0023 closure is the reviewer's act, not this document's).** The ICU adaptation
itself (shorter-than-ward windows) requires confirmation that it does not import a
ward instrument into a context where its calibration is unstudied — see Q5 (§11).

### 2.3 Conflicting duplicates (PROPOSAL)

Two or more values for the same parameter, same subject, overlapping clinical time,
that disagree beyond device tolerance and have no recorded resolution → the parameter
is **`invalid`** (`conflicting_sources`), per evaluation-status-semantics §3.5
(conflicting simultaneous values with no resolution policy). Exact-duplicate delivery
(same value, same idempotency identity) is not a conflict — deduplicate silently and
record the event. Tolerance bounds per parameter: VALIDATION REQUIRED.

---

## 3. SpO2 scale governance — the central fix

### 3.1 Published rule (SOURCE)

SOURCE (RCP 2017, report p.31): "A competent clinical decision-maker should make the
decision about whether to use the Scale 2 oxygen saturation section of the NEWS chart,
which is specific to patients with hypercapnic respiratory failure (usually COPD) who
require their 'usual' oxygen saturations to be set at 88–92% in accordance with BTS
guidelines. When this clinical decision is taken, the Scale 1 oxygen saturation section
of the chart should be clearly crossed out."

SOURCE (RCP Recommendations 26–28): "The decision to use SpO2 scale 2 should be made by
a competent clinical decision maker and should be recorded in the patient's clinical
notes. In all other circumstances, the regular NEWS SpO2 scale 1 should be used."

### 3.2 Governed input (PROPOSAL)

| Property | Specification |
|---|---|
| Name | `spo2_scale_assignment` |
| Values | `scale1` (default) \| `scale2` |
| Who sets it | A qualified clinician with authority to set oxygen-target orders for the patient ("competent clinical decision-maker" per RCP). Role mapping to V2 authorization model: VALIDATION REQUIRED. |
| Provenance required | Author identity, timestamp, and the clinical indication (hypercapnic respiratory failure, target 88–92%) — the RCP requires the decision "recorded in the patient's clinical notes"; V2 requires it as a structured, attributable order/flag, not free text. |
| Behavior when absent | **Scale 1.** SOURCE-backed default (RCP Rec 27: "In all other circumstances, the regular NEWS SpO2 scale 1 should be used"). Absence of an order is a real clinical state (no Scale-2 decision has been made), not missing data — so this default is not zero-coercion. |
| What must NEVER select Scale 2 | Supplemental-oxygen status, any diagnosis code alone, any device signal, any inference. The legacy mechanisms — a `hypercapnic` parameter no workflow could set (D-3) and supplemental-O2-selects-Scale-2 (D-4) — are REJECTED. Scale selection is a documented human clinical decision or it is Scale 1. |
| Freshness | Encounter-scoped: persists until explicitly revoked or the encounter ends. No silent automatic expiry — an auto-revert to Scale 1 would silently change banding without a clinical decision. PROPOSAL: surface order age; require re-confirmation cadence set by reviewer (Q6, §11). |
| Conflict | Simultaneous unrevoked contradictory assignments → SpO2 parameter `invalid` (`conflicting_sources`). |

### 3.3 Scale 2 band table (SOURCE — RCP 2017 Chart 1, re-derived from issuer PDF)

| SpO2 (%) | Condition | Score |
|---|---|---|
| ≤ 83 | regardless of air/oxygen | 3 |
| 84–85 | regardless of air/oxygen | 2 |
| 86–87 | regardless of air/oxygen | 1 |
| 88–92 | regardless of air/oxygen | 0 |
| ≥ 93 | **on air** | 0 |
| 93–94 | **on oxygen** | 1 |
| 95–96 | **on oxygen** | 2 |
| ≥ 97 | **on oxygen** | 3 |

INFERENCE (structural): the low bands (≤92) apply **regardless of oxygen status** —
this is exactly the content the legacy on-O2 branch destroyed (D-1: SpO2 70% on O2
scored 0). The ≥93 region requires the air/oxygen status to band; if
`spo2_scale_assignment = scale2` and SpO2 ≥ 93 but supplemental-O2 status is missing,
the SpO2 parameter is `not_evaluated` (O2 status is a required input in all cases —
§2.1 row 3).

### 3.4 What is rejected (cross-reference)

Both legacy Scale-2 band branches, the `hypercapnic`-parameter selection mechanism, and
the supplemental-O2-selects-Scale-2 path are REJECTED per `news2-review.md` §6
(D-1, D-2, D-3, D-4). See `migration-notes.md`.

---

## 4. Scoring

### 4.1 Parameter band tables (SOURCE — RCP 2017 Chart 1, report p.29, re-derived from the issuer PDF by this author, 2026-08-15)

| Parameter | 3 | 2 | 1 | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|---|
| Respiration rate (per minute) | ≤8 | | 9–11 | 12–20 | | 21–24 | ≥25 |
| SpO2 Scale 1 (%) | ≤91 | 92–93 | 94–95 | ≥96 | | | |
| SpO2 Scale 2 (%) | ≤83 | 84–85 | 86–87 | 88–92; ≥93 on air | 93–94 on oxygen | 95–96 on oxygen | ≥97 on oxygen |
| Air or oxygen? | | Oxygen | | Air | | | |
| Systolic blood pressure (mmHg) | ≤90 | 91–100 | 101–110 | 111–219 | | | ≥220 |
| Pulse (per minute) | ≤40 | | 41–50 | 51–90 | 91–110 | 111–130 | ≥131 |
| Consciousness | | | | Alert | | | CVPU |
| Temperature (°C) | ≤35.0 | | 35.1–36.0 | 36.1–38.0 | 38.1–39.0 | ≥39.1 | |

SOURCE (RCP 2017, section 7): "If supplemental oxygen is required to maintain oxygen
saturation, two additional points should be added to the aggregate score."

Resolution and rounding (PROPOSAL): band comparison happens at chart resolution —
integers for RR, SpO2, SBP, pulse; 0.1 °C for temperature. A finer-precision source
value is rounded to chart resolution before banding (round half away from zero), so no
value can fall between bands. The rounding direction at exact half-steps is a reviewer
question (Q7, §11): rounding *toward the more abnormal band* is the conservative
alternative. This is the REFINEd successor of the legacy float-rounding guard concept
(a concept retained; the legacy code is not).

### 4.2 Aggregate bands and response tiers (SOURCE — RCP 2017 Chart 2, report p.30)

| NEW score | Clinical risk | Response (RCP wording) |
|---|---|---|
| Aggregate 0–4 | Low | Ward-based response |
| **Red score** — a 3 in any individual parameter (aggregate 0–4) | Low–medium | Urgent ward-based response |
| Aggregate 5–6 | Medium | Key threshold for urgent response |
| Aggregate ≥7 | High | Urgent or emergency response |

SOURCE (RCP 2017, section 6): "An aggregate NEW score of 5 or more is a key threshold
that should trigger an urgent clinical review; a NEW score of 7 or more should trigger
a high-level clinical alert, ie an emergency clinical review." SOURCE (section 6, on
the single red score): it "does not warrant the same level of alert as a NEW score of
5 or more, but should prompt an urgent review by a clinician... to determine the cause
and decide whether an escalation of care is required."

**Advisory display semantics (PROPOSAL):** the four tiers are **display/advisory
semantics only**. V2 renders the tier and the RCP response wording as information for
a clinician; it makes **no auto-escalation claim**, dispatches no response, and pages
no team. The legacy red-score tier was absent from production (D-5, D-6 — REJECTED);
this specification restores the published four-tier model, including Low–medium, as
content. Structural note (INFERENCE from Chart 1): only the seven physiological
parameters can score 3; the air/oxygen row maxes at 2 and can never trigger the red
tier.

### 4.3 Monotonicity constraint — no configurable weakening (PROPOSAL)

Local configuration MAY tighten (alert earlier / at lower scores) and MUST NEVER
loosen: no configuration, tenant override, or deployment option may raise the
published trigger levels (red score; 5; 7), suppress the Low–medium tier, or reband
any parameter. Published triggers are clinical content under the same change control
as band tables (shared-findings SF-4: the legacy resolver allowed unbounded threshold
raises with no clinical floor — REJECTED). Governance hook: ADR-0007 (rule-bundle
format, signing, approval, activation, rollback, retirement) must enforce this floor
in the bundle schema so a weakening configuration is unrepresentable.

---

## 5. Evaluation-status mapping

Vocabulary per `docs/05-clinical-safety/evaluation-status-semantics.md`
(valid | partial | not_evaluated | stale | invalid), itself a PROPOSAL.

### 5.1 Core rule (PROPOSAL)

**The total computes only when all seven parameters are `valid` and in-window (and the
population gate passes and the required O2-status input is present).** In every other
condition the aggregate is **not** a number: the evaluation record carries the
aggregate status, a machine-readable reason, and **per-parameter status detail** (each
of the seven parameters individually reported as valid / missing / stale / invalid,
with source times).

### 5.2 Status table (PROPOSAL)

| Condition | Aggregate status | Reason (machine-readable) |
|---|---|---|
| All inputs present, plausible, mapped, in-window; population gate passed | `valid` | — (score + tier rendered) |
| Any required input absent | `not_evaluated` | `missing_required_input:<param>` |
| Any required input present only beyond its expiry horizon | `not_evaluated` | `expired_input:<param>` |
| Any required input out-of-window (within expiry) at evaluation time | `not_evaluated` | `stale_input:<param>` (no fresh total is computed; see §5.3 for display-time staleness of a previously valid total) |
| Any input out of plausible range | `invalid` | `implausible_value:<param>` |
| Any input unit/code unmappable | `invalid` | `unmappable_unit:<param>` / `unmappable_code:<param>` |
| Consciousness token outside {A, C, V, P, U} | `invalid` | `unmappable_code:consciousness` (§5.4) |
| Unresolved conflicting duplicates | `invalid` | `conflicting_sources:<param>` |
| Age unknown | `not_evaluated` | `unknown_age` |
| Age/pregnancy outside population | `not_evaluated` | `out_of_population_scope` |
| Rule killed / rolling back / failed to load | `not_evaluated` | `rule_unavailable` |
| Quarantined source input (AMH `quarantined`) | `not_evaluated` | `quarantined_input:<param>` — a quarantined source never contributes (two-dimension rule, semantics §5) |

Precedence when several conditions hold: `invalid` > `not_evaluated` > `stale` >
`partial` > `valid` (semantics §3.6).

**No partial policy is declared for RULE-NEWS2 0.1.0.** Therefore `partial` is
unreachable: any incompleteness resolves to `not_evaluated` (semantics §3.2 — partial
without an approved policy is prohibited). Whether a NEWS2 partial policy should ever
exist is Q8 (§11).

### 5.3 Staleness on display (PROPOSAL)

A `valid` evaluation ages: when any contributing input leaves its freshness window
*as of read time*, the displayed evaluation becomes `stale` (age of oldest input
shown, no tier color rendered as if current); beyond the expiry horizon it becomes
`not_evaluated` (`expired_input`). Status is recomputed on read, never frozen at write
(semantics §3.4).

### 5.4 No zero-coercion — anywhere (PROPOSAL, HAZ-0005)

There is no code path, band, default, or fallback in this specification in which a
missing, stale, invalid, conflicting, quarantined, or unmappable input contributes the
numeric value 0 to a total, or in which an unassessed patient renders as score 0 /
"low" / "normal". The legacy behavior — every one of the seven inputs zero-coerced
(news2-review.md §5, decisive line news2.py:84-85) and an invalid ACVPU token dropped
to `None` → 0 on the HL7 path (D-7) — is REJECTED in full. An invalid or unmapped
consciousness token is **`invalid`, never 0 and never silently 3**: the legacy
any-non-A-string→3 fallback (D-8) is also rejected — fail-loud in the correct
dimension (status), not by inventing a score. The all-inputs-absent case MUST yield
`not_evaluated` with reasons — CRV-0102 in `reference-vectors.md` is the standing
regression vector (HAZ-0005, E1 severity: this failure occurred in production
lineage).

The Scale-1 default for an absent scale assignment (§3.2) and "air = 0 points" for a
*documented* on-air status are not zero-coercion: both encode a documented or
SOURCE-defined clinical state. An **unknown** O2 status is `not_evaluated`, never
"air".

---

## 6. Deterministic machine-readable logic (PROPOSAL — declarative, no code)

```yaml
rule: RULE-NEWS2
version: 0.1.0
classification: NOT_ACTIONABLE_NO_EVIDENCED_POPULATED_SOURCE
source:
  citation: "RCP NEWS2 (2017), Chart 1 p.29, Chart 2 p.30, Scale-2 governance p.31, Recs 1-2, 26-30"
  url: "https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf"
population_gate:
  age_years: {gte: 18}                # PROPOSAL; 16-17 band = reviewer decision Q1
  age_unknown: not_evaluated:unknown_age
  pregnancy_documented: not_evaluated:out_of_population_scope
inputs:
  rr:            {ucum: "/min",   plausible: [0, 80],  window_h: 1, expiry_h: 8}
  spo2:          {ucum: "%",      plausible: [40, 100], window_h: 1, expiry_h: 8}
  o2_status:     {type: boolean_air_oxygen,            window_h: 4, expiry_h: 24}
  sbp:           {ucum: "mm[Hg]", plausible: [30, 300], window_h: 1, expiry_h: 8}
  pulse:         {ucum: "/min",   plausible: [10, 300], window_h: 1, expiry_h: 8}
  consciousness: {type: acvpu_token, allowed: [A, C, V, P, U], window_h: 4, expiry_h: 24}
  temperature:   {ucum: "Cel",    plausible: [25.0, 45.0], window_h: 4, expiry_h: 24}
governed_inputs:
  spo2_scale_assignment:
    values: [scale1, scale2]
    default_when_absent: scale1          # SOURCE: RCP Rec 27
    set_by: qualified_clinician_documented_order
    never_derived_from: [o2_status, diagnosis_code, device_signal]
rounding: {rr: 1, spo2: 1, sbp: 1, pulse: 1, temperature: 0.1, mode: half_away_from_zero}  # tie direction = reviewer Q7
bands:
  rr:            [{lte: 8, s: 3}, {r: [9, 11], s: 1}, {r: [12, 20], s: 0}, {r: [21, 24], s: 2}, {gte: 25, s: 3}]
  spo2_scale1:   [{lte: 91, s: 3}, {r: [92, 93], s: 2}, {r: [94, 95], s: 1}, {gte: 96, s: 0}]
  spo2_scale2:
    any_o2_state: [{lte: 83, s: 3}, {r: [84, 85], s: 2}, {r: [86, 87], s: 1}, {r: [88, 92], s: 0}]
    on_air:       [{gte: 93, s: 0}]
    on_oxygen:    [{r: [93, 94], s: 1}, {r: [95, 96], s: 2}, {gte: 97, s: 3}]
  o2_status:     [{eq: oxygen, s: 2}, {eq: air, s: 0}]
  sbp:           [{lte: 90, s: 3}, {r: [91, 100], s: 2}, {r: [101, 110], s: 1}, {r: [111, 219], s: 0}, {gte: 220, s: 3}]
  pulse:         [{lte: 40, s: 3}, {r: [41, 50], s: 1}, {r: [51, 90], s: 0}, {r: [91, 110], s: 1}, {r: [111, 130], s: 2}, {gte: 131, s: 3}]
  consciousness: [{eq: A, s: 0}, {in: [C, V, P, U], s: 3}]
  temperature:   [{lte: 35.0, s: 3}, {r: [35.1, 36.0], s: 1}, {r: [36.1, 38.0], s: 0}, {r: [38.1, 39.0], s: 1}, {gte: 39.1, s: 2}]
aggregate:
  total: sum(all seven parameter scores)     # computed ONLY under status: valid
  tiers:                                     # ADVISORY DISPLAY ONLY — no auto-escalation
    - {name: low,        when: {total: [0, 4], red_param: false}}
    - {name: low_medium, when: {total: [0, 4], red_param: true}}   # red_param: any single parameter score == 3
    - {name: medium,     when: {total: [5, 6]}}
    - {name: high,       when: {total: {gte: 7}}}
  monotonicity: config_may_tighten_never_loosen   # ADR-0007 enforcement hook
status_logic:
  valid: all_inputs(present, plausible, mapped, in_window) and population_gate_passed
  otherwise:
    precedence: [invalid, not_evaluated, stale]
    invalid_when: [implausible_value, unmappable_unit, unmappable_code, conflicting_sources]
    not_evaluated_when: [missing_required_input, expired_input, stale_input_at_eval,
                         unknown_age, out_of_population_scope, quarantined_input, rule_unavailable]
  partial: UNREACHABLE   # no partial policy declared for 0.1.0
  zero_coercion: FORBIDDEN_EVERYWHERE   # HAZ-0005
```

INFERENCE: every predicate above is decidable from the declared inputs alone; the
logic contains no clock reads other than the evaluation timestamp, no randomness, and
no external calls — deterministic by construction, replayable against the reference
vectors.

---

## 7. Explanation text (PROPOSAL — UX acceptance criteria; wording VALIDATION REQUIRED with pt-BR clinicians)

Every rendered NEWS2 result MUST show: the score and tier (only when `valid`), the
seven inputs used with source times and the scale in use, **any missing/stale/invalid
inputs by name**, the rule version, and the advisory framing. No rendering may show a
tier without its status.

**EN (valid):** "NEWS2 total {total} — {tier}. Advisory information only; not a
directive and not a substitute for clinical judgement. Inputs used: {list with source
times}. SpO2 scored on {Scale 1 | Scale 2 (documented clinical order, {order time})}.
Rule RULE-NEWS2 v0.1.0."

**EN (not evaluated):** "NEWS2 not evaluated — {reason, e.g. 'respiratory rate
missing'}. No score exists for this patient at this time; absence of a score is not
reassurance. Last valid assessment: {time or 'none'}."

**pt-BR (valid):** "NEWS2 total {total} — {tier}. Informação consultiva; não é uma
diretriz e não substitui o julgamento clínico. Dados utilizados: {lista com horários}.
SpO2 pontuada na {Escala 1 | Escala 2 (decisão clínica documentada, {horário})}.
Regra RULE-NEWS2 v0.1.0."

**pt-BR (não avaliado):** "NEWS2 não avaliado — {motivo, ex.: 'frequência
respiratória ausente'}. Não existe pontuação para este paciente neste momento; a
ausência de pontuação não significa normalidade. Última avaliação válida: {horário ou
'nenhuma'}."

---

## 8. Linked hazards and safety requirements

| Link | Relationship |
|---|---|
| HAZ-0005 | Zero-coercion of missing inputs — §5.4 forbids; CRV-0102 regression vector. |
| HAZ-0036 | Out-of-population evaluation — §1.2 gate; unknown age never assumed adult. |
| HAZ-0040 | `valid` token collision across dimensions — §5.2 quarantined-input row keeps dimensions separate. |
| HAZ-0043 | Premature admission with no populated source — the NOT ACTIONABLE classification exists to prevent exactly this. |
| HAZ-0044 | Escalation display contrary to goals of care — §1.2 flagged, reviewer Q3. |
| SAF-0001/0002/0003 | Status-bearing results, absent-input probe, completeness policy — §5. |
| SAF-0006 | `not_evaluated` counted, never hidden — §5.2/§7. |
| SAF-0019 | Machine-readable reasons for every non-firing/non-valid state — §5.2. |
| SAF-0035 | Population/setting enforcement — §1.2. |

---

## 9. Monitoring, rollback, kill switch, retirement (PROPOSAL)

- **Monitoring (from first shadow use, if ever activated):** distribution of evaluation
  statuses per unit-day (a high or rising `not_evaluated` share is a feed failure or a
  HAZ-0043 signal, never silence); rate of `invalid` by reason; red-score tier rate and
  aggregate-tier volumes against the interruptive-alert budget; Scale-2 assignment
  prevalence vs documented hypercapnic-respiratory-failure prevalence (a mismatch in
  either direction is a governance defect signal).
- **Rollback criteria:** any observed zero-coercion (automatic — release-blocking
  regression of HAZ-0005); any Scale-2 banding without a documented assignment; any
  tier weakening below published triggers; band-table mismatch against the reference
  vectors on replay.
- **Kill switch:** deactivation is total and honest — every consumer shows
  `not_evaluated` (`rule_unavailable`); the rule never half-runs. No silent no-fire.
- **Retirement/review cadence:** review at every RCP or BTS guideline change touching
  NEWS2, at every AMH contract re-pin affecting an input, and at minimum every 12
  months; retirement requires the same named-authority change control as activation
  (ADR-0007 lifecycle).
- **Guideline surveillance — open items:**
  1. **RCP "December 2022 clarification" — NOT VERIFIED** (news2-review.md §2 and
     SF-9: not surfaced on the RCP resource pages at collection time, 2026-08-15).
     Not cited as fact anywhere in this specification. Standing surveillance item:
     locate, verify from the issuer, and assess band/governance impact before any
     activation decision. VALIDATION REQUIRED.
  2. RCP NEWS2 resource page and BTS oxygen guideline (the 88–92% target underpinning
     Scale 2) — re-check at each review cadence.

---

## 10. What this specification does NOT do

It does not activate anything; select this pathway into any portfolio; claim any
populated data source (none is evidenced — zero populated observations, no
vital-signs profile at the pinned AMH snapshot); approve its own content (author ≠
approver); close VAL-0006/0007 (it proposes the gate; the decision is human); or
specify MEWS (family representative decision per portfolio records — see
`migration-notes.md`).

---

## 11. Open questions for the named reviewer (rodaquino-OMNI)

1. **Age 16–17 band:** RCP-permitted, outside the proposed V2 adult (≥18) intended
   use. Admit or exclude? (§1.2; interacts with IU-05 ratification.)
2. **Pregnancy default:** is "no pregnancy documentation ⇒ treat as not pregnant"
   acceptable given no trusted pregnancy source is evidenced, or must unknown
   pregnancy status gate to `not_evaluated` for defined cohorts (e.g. by age/sex)?
3. **Goals-of-care context (HAZ-0044):** should documented treatment limitations gate
   evaluation, gate display of response tiers, or only annotate?
4. **ACVPU capture and GCS mapping:** confirm no-automatic-GCS-mapping for 0.1.0, and
   route the sedation-confounder (NEWS2-07) into a dedicated ADR — is a
   sedation-state annotation required on every consciousness input?
5. **Freshness windows and expiry horizons (§2.2):** confirm or replace every number;
   confirm the ICU adaptation of a ward-calibrated instrument is acceptable within
   intended use.
6. **Scale-2 assignment re-confirmation cadence** (§3.2): encounter-persistent with
   what mandatory review interval?
7. **Rounding tie direction** (§4.1): half-away-from-zero vs round-toward-more-abnormal
   at exact half-steps.
8. **Partial policy:** should any approved partial-evaluation policy ever exist for
   NEWS2, or is all-or-`not_evaluated` permanent?
9. **Plausible ranges** (§2.1): confirm or replace each `invalid` boundary.
10. **Conflict tolerance bounds** (§2.3): per-parameter device-tolerance values for
    the conflicting-duplicates rule.
