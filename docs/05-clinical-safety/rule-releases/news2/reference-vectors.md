---
id: RULE-NEWS2-CRV-SET
title: NEWS2 clinical reference vectors — CRV set for RULE-NEWS2 0.2.0
label: PROPOSAL
status: clinicamente revisado (GDEC-0007, 2026-08-15); evidência de execução pendente — vetores permanecem DRAFT para fins de execução
last_updated: 2026-08-15
statement: >
  Clinical reference vectors (93) for RULE-NEWS2 0.2.0 per the clinical-reference-vector
  standard, including four decision-driven vectors added after the named clinical review
  (GDEC-0007: pregnancy, rounding-tie, conflict-tolerance). Clinicamente revisado
  (GDEC-0007); evidência de execução pendente. Authorship independence is NOT satisfied
  (vector author = specification author), so no vector here may be cited as release
  execution evidence; every vector remains DRAFT for execution purposes.
provenance:
  source_repo: rcp.ac.uk (expected outcomes derived from primary source) + intensicare-V2
  path_or_url: https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf
  commit_sha_or_version: "RCP NEWS2 (2017) issuer PDF; RULE-NEWS2 specification.md 0.2.0 (same directory, same authoring session)"
  section_or_lines: RCP Chart 1 p.29, Chart 2 p.30, Recs 26-30; specification.md sections 1-6
  date_collected: 2026-08-15
  collector: NEWS2 V2 clinical-content specification author (cycle-1 Task 2 agent); accountable reviewer rodaquino-OMNI
  transformation: expected outcomes computed by this author from the re-derived band tables; synthetic inputs only
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0006, SAF-0019]
  hazards: [HAZ-0005, HAZ-0036, HAZ-0040]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RULE-NEWS2 reference vectors (CRV set) — 0.2.0

> **Clinicamente revisado (GDEC-0007, 2026-08-15); evidência de execução pendente —
> vetores permanecem DRAFT para fins de execução. Author ≠ approver applies to vectors
> too; independent authorship remains outstanding.**

## 0. Authorship-independence disclosure (recorded honestly)

Per `docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md` §8,
`vector_author` must differ from the rule implementer/author. **That condition is NOT
met here:** these vectors were authored by the same agent that authored
`specification.md`, in the same session. Therefore, for every vector in this set:
`authorship.independence_confirmed: false`,
`clinical_expectation_provenance.review_status: UNREVIEWED`, lifecycle
`status: DRAFT`. Per the standard §4.1(4) and §8.2, these vectors are usable **only**
for red/green TDD authoring; their passing can never be cited as clinical evidence.
Independent re-authoring or independent review by a named clinician is required before
any vector may progress toward `RATIFIED`.

## 1. Conventions for this set

- **ID block:** `CRV-NEWS2-0101`–`CRV-NEWS2-0193` (93 vectors). **DECISÃO (GDEC-0007,
  2026-08-15, folha P-3 (a)):** esquema de prefixo por regra adotado — `CRV-SOFA-####`,
  `CRV-NEWS2-####`, `CRV-GCS-####`; partes numéricas mantidas, prefixo trocado —
  impossibilita a próxima colisão de namespace; renumeração executada nesta revisão
  (0.2.0). História: this set originally claimed a bare numeric block that collided
  with RULE-SOFA's concurrent claim; a first steward renumbering (2026-08-15) moved
  SOFA to the 03xx numeric block and left NEWS2's numerics unchanged; the decided
  per-rule prefixes now make every ID globally unambiguous. References in files outside
  `rule-releases/` still citing bare `CRV-01xx` IDs are renumbered by the steward at
  their next revision (per P-3). See `../../../00-governance/traceability-policy.md`
  §1.1 for the range table. No central CRV catalog exists yet; final IDs are assigned
  at catalog registration. `CRV-0000` remains reserved-illustrative per the standard.
- **Baseline profile** (all vectors start here; each vector states only its deltas):
  synthetic adult, age 45; RR 16 `/min`; SpO2 97 `%`; supplemental O2: **air**
  (documented); SBP 120 `mm[Hg]`; pulse 70 `/min`; consciousness `A`; temperature
  37.0 `Cel`; no `spo2_scale_assignment` (⇒ Scale 1 default); every input observed 10
  minutes before evaluation time (in-window); `source_data_quality: valid`
  (`amh_valid`); population gate passed. Baseline total = 0, tier low, status `valid`.
- **Context (all vectors):** `tenant_id: synthetic-tenant-0900`,
  `encounter_id: synthetic-encounter-09xx`, `population: adult`,
  `data_provenance: synthetic-only`. All values synthetic; no real patient data.
- **Fires mapping (PROPOSAL, from specification.md §4.2):** `fires: true` iff the
  advisory tier is `low_medium`, `medium`, or `high` (any single parameter = 3, or
  total ≥ 5). `fires` here means "an escalation-tier display condition is met" — it is
  advisory display semantics, not auto-escalation.
- **Expected-outcome shorthand in the tables:** `param=score`; Total; Tier; Status;
  fires; reason. Each row expands to the full §4.2 CRV YAML schema (as demonstrated in
  §3) when the TestPack is assembled; the row IS the vector's normative content.
- **Reason-taxonomy note:** the CRV standard routes source-`quarantined` under
  `invalid_data`; `specification.md` §5.2 routes quarantined inputs to `not_evaluated`
  (`quarantined_input`). CRV-NEWS2-0118 records this tension; resolution belongs to the
  status-semantics ratification, not to this file. The same ratification item also
  covers two implementation-introduced reasons OUTSIDE the spec §5.2 vocabulary, used
  by the RULE-NEWS2 0.2.0 implementation (`packages/kernel-clinico`):
  `missing_clinical_time:<param>` (input present but with no usable clinical time —
  DOM-0009/ADR-0008 N5) and `unspecified_condition` (defensive catch-all for
  unclassifiable evaluation-time failures); vectors and verdicts in this file are
  unchanged by this note (registrado na integração SPR-G7-2, correção 2 da revisão
  única).

## 2. Vector catalog

### 2.1 Typical (1 vector)

| ID | Scenario (delta vs baseline) | Expected | Status | fires | reason |
|---|---|---|---|---|---|
| CRV-NEWS2-0101 | none — baseline as stated | all params 0; Total 0; low | `valid` | false | `criteria_not_met` |

### 2.2 Missing data, staleness, integrity, population (17 vectors)

| ID | Scenario (delta vs baseline) | Expected | Status | fires | reason | boundary class |
|---|---|---|---|---|---|---|
| CRV-NEWS2-0102 | **ALL seven inputs absent** (`value.present: false` on every entry) | **no total — never 0** (HAZ-0005 standing regression vector; legacy returned total 0, risk "low") | `not_evaluated` | false | `insufficient_data` (per-param `missing_required_input:*` ×7) | `all-inputs-missing` |
| CRV-NEWS2-0103 | RR absent | no total | `not_evaluated` | false | `insufficient_data` (`missing_required_input:rr`) | `single-input-missing` |
| CRV-NEWS2-0104 | SpO2 absent | no total | `not_evaluated` | false | `insufficient_data` (`missing_required_input:spo2`) | `single-input-missing` |
| CRV-NEWS2-0105 | supplemental-O2 status absent (SpO2 present) | no total — **unknown is never "air"** | `not_evaluated` | false | `insufficient_data` (`missing_required_input:o2_status`) | `single-input-missing` |
| CRV-NEWS2-0106 | SBP absent | no total | `not_evaluated` | false | `insufficient_data` (`missing_required_input:sbp`) | `single-input-missing` |
| CRV-NEWS2-0107 | pulse absent | no total | `not_evaluated` | false | `insufficient_data` (`missing_required_input:pulse`) | `single-input-missing` |
| CRV-NEWS2-0108 | consciousness absent | no total — absent ACVPU is never 0 points | `not_evaluated` | false | `insufficient_data` (`missing_required_input:consciousness`) | `single-input-missing` |
| CRV-NEWS2-0109 | temperature absent | no total | `not_evaluated` | false | `insufficient_data` (`missing_required_input:temperature`) | `single-input-missing` |
| CRV-NEWS2-0110 | RR observed 90 min before evaluation (window 60 min, expiry 8 h) | no fresh total | `not_evaluated` | false | `stale_data` (`stale_input:rr`) | `freshness-window-edge` |
| CRV-NEWS2-0111 | RR observed exactly 60 min before evaluation (at window edge, inclusive) | Total 0; low | `valid` | false | `criteria_not_met` | `freshness-window-edge` |
| CRV-NEWS2-0112 | RR observed 9 h before evaluation (past 8 h expiry) | no total | `not_evaluated` | false | `stale_data` (`expired_input:rr`) | `freshness-window-edge` |
| CRV-NEWS2-0113 | two simultaneous SBP values, 80 and 150, same clinical time, no resolution | no total — difference 70 mmHg exceeds the decided PAS tolerance ±10 mmHg (GDEC-0007 N-10; §2.3 of the spec): real conflict, never resolved blindly | `invalid` | false | `invalid_data` (`conflicting_sources:sbp`) | `conflicting-sources` |
| CRV-NEWS2-0114 | age/DOB absent | no total — **never assume adult** (VAL-0006/0007) | `not_evaluated` | false | `insufficient_data` (`unknown_age`) | `population-exclusion-boundary` |
| CRV-NEWS2-0115 | age 17 (verified) | no total under the ≥18 gate; RCP-permitted band excluded — DECIDIDO N-1 (a), GDEC-0007 | `not_evaluated` | false | `out_of_population_scope` | `population-exclusion-boundary` |
| CRV-NEWS2-0116 | consciousness token `SEDATED` (schema-unmapped) | **`invalid`, never 0** (legacy D-7: HL7 'C'→None→0; D-8: any-non-A→3 — both rejected) | `invalid` | false | `invalid_data` (`unmappable_code:consciousness`) | `conflicting-sources`-adjacent; recorded as edge |
| CRV-NEWS2-0117 | SpO2 = 150 % | outside plausible range 40–100 | `invalid` | false | `invalid_data` (`implausible_value:spo2`) | `threshold-exact-match` (plausibility bound) |
| CRV-NEWS2-0118 | RR present and in-window but `source_data_quality: quarantined` | quarantined input never contributes | `not_evaluated` | false | `insufficient_data` (`quarantined_input:rr`) — taxonomy tension recorded in §1 | `source-quality-vs-evaluation-status-independence` |

### 2.3 SpO2 scale governance (5 vectors)

| ID | Scenario (delta vs baseline) | Expected | Status | fires | reason | boundary class |
|---|---|---|---|---|---|---|
| CRV-NEWS2-0119 | `spo2_scale_assignment: scale2` (documented order); SpO2 **70 %** on **oxygen** | SpO2 = **3** (low Scale-2 bands apply regardless of O2 — legacy D-1 scored this 0); O2 = 2; Total 5; medium + red param | `valid` | true | fire: red param + total ≥5 | `threshold-exact-match` |
| CRV-NEWS2-0120 | scale2 order; SpO2 **90 %** on oxygen (at BTS 88–92 target) | SpO2 = **0** (legacy D-2 scored 1; legacy production Scale-1 path scored 2–3); O2 = 2; Total 2; low | `valid` | false | `criteria_not_met` | `threshold-exact-match` |
| CRV-NEWS2-0121 | **NO scale2 order**; SpO2 91 % on oxygen | **Scale 1 stays** (supplemental O2 never flips scale — D-3/D-4 regression): SpO2 = 3; O2 = 2; Total 5; medium + red param | `valid` | true | fire: red param + total ≥5 | `multi-criteria-combination` |
| CRV-NEWS2-0122 | no scale2 order (absent governed input); SpO2 95 % on air | Scale 1 default per RCP Rec 27: SpO2 = 1; Total 1; low | `valid` | false | `criteria_not_met` | `single-input-missing` (governed input absent ⇒ safe default, not not_evaluated) |
| CRV-NEWS2-0123 | scale2 order; SpO2 94 %; supplemental-O2 status **absent** | ≥93 region needs air/oxygen to band; O2 status is required anyway | `not_evaluated` | false | `insufficient_data` (`missing_required_input:o2_status`) | `single-input-missing` |

### 2.4 SpO2 Scale 2 band boundaries — scale2 order present (14 vectors)

On air (O2 = 0) unless stated; on-oxygen rows add O2 = 2 to the total.

| ID | SpO2 % / O2 state | SpO2 score | Total | Tier | Status | fires |
|---|---|---|---|---|---|---|
| CRV-NEWS2-0124 | 83, air | 3 | 3 | low_medium (red) | `valid` | true |
| CRV-NEWS2-0125 | 84, air | 2 | 2 | low | `valid` | false |
| CRV-NEWS2-0126 | 85, air | 2 | 2 | low | `valid` | false |
| CRV-NEWS2-0127 | 86, air | 1 | 1 | low | `valid` | false |
| CRV-NEWS2-0128 | 87, air | 1 | 1 | low | `valid` | false |
| CRV-NEWS2-0129 | 88, air | 0 | 0 | low | `valid` | false |
| CRV-NEWS2-0130 | 92, air | 0 | 0 | low | `valid` | false |
| CRV-NEWS2-0131 | 93, air | 0 | 0 | low | `valid` | false |
| CRV-NEWS2-0132 | 92, oxygen | 0 | 2 | low | `valid` | false |
| CRV-NEWS2-0133 | 93, oxygen | 1 | 3 | low | `valid` | false |
| CRV-NEWS2-0134 | 94, oxygen | 1 | 3 | low | `valid` | false |
| CRV-NEWS2-0135 | 95, oxygen | 2 | 4 | low | `valid` | false |
| CRV-NEWS2-0136 | 96, oxygen | 2 | 4 | low | `valid` | false |
| CRV-NEWS2-0137 | 97, oxygen | 3 | 5 | medium + red | `valid` | true |

All 14 carry `boundary_edge_class: [threshold-exact-match]` (each value is the first or
last member of its published band).

### 2.5 Scale 1 and remaining parameter band boundaries (47 vectors)

Each value is the last member of one band or the first of the next (± epsilon at chart
resolution); `boundary_edge_class: [threshold-exact-match]`. Total = the varying
parameter's score (baseline contributes 0). Tier: score 3 ⇒ low_medium (red),
fires true; otherwise low, fires false, `criteria_not_met`.

| ID | Parameter | Value | Param score |
|---|---|---|---|
| CRV-NEWS2-0138 | RR | 8 | 3 (red) |
| CRV-NEWS2-0139 | RR | 9 | 1 |
| CRV-NEWS2-0140 | RR | 11 | 1 |
| CRV-NEWS2-0141 | RR | 12 | 0 |
| CRV-NEWS2-0142 | RR | 20 | 0 |
| CRV-NEWS2-0143 | RR | 21 | 2 |
| CRV-NEWS2-0144 | RR | 24 | 2 |
| CRV-NEWS2-0145 | RR | 25 | 3 (red) |
| CRV-NEWS2-0146 | SpO2 Scale 1 | 91 | 3 (red) |
| CRV-NEWS2-0147 | SpO2 Scale 1 | 92 | 2 |
| CRV-NEWS2-0148 | SpO2 Scale 1 | 93 | 2 |
| CRV-NEWS2-0149 | SpO2 Scale 1 | 94 | 1 |
| CRV-NEWS2-0150 | SpO2 Scale 1 | 95 | 1 |
| CRV-NEWS2-0151 | SpO2 Scale 1 | 96 | 0 |
| CRV-NEWS2-0152 | O2 status | oxygen (SpO2 97, Scale 1) | O2 = 2; Total 2 |
| CRV-NEWS2-0153 | O2 status | air (documented) | O2 = 0; Total 0 |
| CRV-NEWS2-0154 | SBP | 90 | 3 (red) |
| CRV-NEWS2-0155 | SBP | 91 | 2 |
| CRV-NEWS2-0156 | SBP | 100 | 2 |
| CRV-NEWS2-0157 | SBP | 101 | 1 |
| CRV-NEWS2-0158 | SBP | 110 | 1 |
| CRV-NEWS2-0159 | SBP | 111 | 0 |
| CRV-NEWS2-0160 | SBP | 219 | 0 |
| CRV-NEWS2-0161 | SBP | 220 | 3 (red) |
| CRV-NEWS2-0162 | Pulse | 40 | 3 (red) |
| CRV-NEWS2-0163 | Pulse | 41 | 1 |
| CRV-NEWS2-0164 | Pulse | 50 | 1 |
| CRV-NEWS2-0165 | Pulse | 51 | 0 |
| CRV-NEWS2-0166 | Pulse | 90 | 0 |
| CRV-NEWS2-0167 | Pulse | 91 | 1 |
| CRV-NEWS2-0168 | Pulse | 110 | 1 |
| CRV-NEWS2-0169 | Pulse | 111 | 2 |
| CRV-NEWS2-0170 | Pulse | 130 | 2 |
| CRV-NEWS2-0171 | Pulse | 131 | 3 (red) |
| CRV-NEWS2-0172 | Consciousness | A | 0 |
| CRV-NEWS2-0173 | Consciousness | C (new confusion) | 3 (red) — RCP Recs 29–30 |
| CRV-NEWS2-0174 | Consciousness | V | 3 (red) |
| CRV-NEWS2-0175 | Consciousness | P | 3 (red) |
| CRV-NEWS2-0176 | Consciousness | U | 3 (red) |
| CRV-NEWS2-0177 | Temperature | 35.0 | 3 (red) |
| CRV-NEWS2-0178 | Temperature | 35.1 | 1 |
| CRV-NEWS2-0179 | Temperature | 36.0 | 1 |
| CRV-NEWS2-0180 | Temperature | 36.1 | 0 |
| CRV-NEWS2-0181 | Temperature | 38.0 | 0 |
| CRV-NEWS2-0182 | Temperature | 38.1 | 1 |
| CRV-NEWS2-0183 | Temperature | 39.0 | 1 |
| CRV-NEWS2-0184 | Temperature | 39.1 | 2 |

### 2.6 Aggregate thresholds and tiers (5 vectors)

| ID | Scenario (deltas) | Component scores | Total | Tier | Status | fires | reason |
|---|---|---|---|---|---|---|---|
| CRV-NEWS2-0185 | RR 21; pulse 111 | 2 + 2, no single 3 | 4 | low | `valid` | false | `criteria_not_met` — 4/5 boundary, below |
| CRV-NEWS2-0186 | RR 21; pulse 111; temp 35.6 | 2 + 2 + 1 | 5 | medium | `valid` | true | fire: total ≥ 5 — 4/5 boundary, at |
| CRV-NEWS2-0187 | RR 21; pulse 111; temp 35.6; SBP 105 | 2 + 2 + 1 + 1 | 6 | medium | `valid` | true | fire: total ≥ 5 — 6/7 boundary, below |
| CRV-NEWS2-0188 | on oxygen (SpO2 96, Scale 1 = 0); RR 21; pulse 111; temp 35.6 | 2 + 2 + 2 + 1 | 7 | high | `valid` | true | fire: total ≥ 7 — 6/7 boundary, at |
| CRV-NEWS2-0189 | temp 35.0 only | single 3, aggregate 3 | 3 | **low_medium (red)** | `valid` | true | fire: single red param with low aggregate — RCP Chart 2 Low–medium tier |

All five carry `boundary_edge_class: [multi-criteria-combination, threshold-exact-match]`.

### 2.7 Decision-driven vectors (GDEC-0007, 2026-08-15) — 4 vectors

Added when the named review decided N-2 (pregnancy), N-7 (rounding tie) and N-10
(conflict tolerance); expectations transcribe the decisions.

| ID | Scenario (delta vs baseline) | Expected | Status | fires | reason | boundary class |
|---|---|---|---|---|---|---|
| CRV-NEWS2-0190 | **pregnancy documented** (trusted pregnancy datum present) | no total — instrument-inappropriate (RCP Rec 2); explanation must state that an obstetric instrument is indicated — DECIDIDO N-2 (a), GDEC-0007 | `not_evaluated` | false | `out_of_population_scope` (pregnancy) | `population-exclusion-boundary` |
| CRV-NEWS2-0191 | **no pregnancy documentation** (explicit: no pregnancy datum exists; all params baseline) | Total 0; low; **mandatory visible annotation "gravidez não verificada"** on the rendered result — DECIDIDO N-2 (a), GDEC-0007 (substitui o tratamento silencioso do 0.1.0) | `valid` | false | `criteria_not_met` | `single-input-missing` (governed absence ⇒ score-with-annotation, not not_evaluated) |
| CRV-NEWS2-0192 | temperature source value **38.05 °C** (finer precision than the 0.1 °C chart resolution; exact half-step between 38.0 → 0 and 38.1 → 1) | rounds **toward the more abnormal band** → 38.1 → temp = 1; Total 1; low — DECIDIDO N-7 (a), GDEC-0007 (INV-B: empate resolve para vigilância) | `valid` | false | `criteria_not_met` | `threshold-exact-match` (rounding tie) |
| CRV-NEWS2-0193 | two simultaneous SBP values, **108 and 112**, same clinical time, no resolution record (difference 4 mmHg ≤ decided PAS tolerance ±10 mmHg) | within tolerance → the **worst** value scores: SBP 108 → 1 point (101–110 band; 112 would band 0); resolution recorded; Total 1; low — DECIDIDO N-10 (a), GDEC-0007 | `valid` | false | `criteria_not_met` | `conflicting-sources` (within-tolerance branch) |

## 3. Fully expanded exemplar vectors (schema per CRV standard §4.2)

Three vectors expanded in full; every other catalog row expands identically at
TestPack assembly, with the row as its normative content.

### CRV-NEWS2-0102 — all inputs missing (HAZ-0005 standing regression)

```yaml
vector_id: CRV-NEWS2-0102
title: "All seven NEWS2 inputs absent yields not_evaluated - never total 0"
pathway_id: RULE-NEWS2
rule_version: {bundle: news2, version: 0.2.0, content_hash: UNASSIGNED-precursor, status: draft}
scenario_class: edge
boundary_edge_class: [all-inputs-missing]
description: >
  Every required NEWS2 input is absent. The legacy system returned total 0 / risk
  "low" and persisted it (news2-review.md section 5, HAZ-0005, E1 - occurred). The
  V2 evaluation must be not_evaluated with a machine-readable reason per missing
  input, and must never render 0, low, normal, or blank.
context:
  tenant_id: synthetic-tenant-0900
  encounter_id: synthetic-encounter-0902
  facility_id: synthetic-facility-0900
  care_unit_id: synthetic-unit-0900
  bed_id: synthetic-bed-0902
  population: adult
  data_provenance: synthetic-only
input_observations:
  - {observation_ref: rr,            code: {system: LOINC, value: 9279-1,  display: Respiratory rate},        value: {present: false}, time: {observed: {present: false}, received: {present: false}}, source_data_quality: not_applicable, provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}}
  - {observation_ref: spo2,          code: {system: LOINC, value: 59408-5, display: Oxygen saturation},       value: {present: false}, time: {observed: {present: false}, received: {present: false}}, source_data_quality: not_applicable, provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}}
  - {observation_ref: o2-status,     code: {system: LOINC, value: 3151-8,  display: Inhaled oxygen flow rate}, value: {present: false}, time: {observed: {present: false}, received: {present: false}}, source_data_quality: not_applicable, provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}}
  - {observation_ref: sbp,           code: {system: LOINC, value: 8480-6,  display: Systolic blood pressure}, value: {present: false}, time: {observed: {present: false}, received: {present: false}}, source_data_quality: not_applicable, provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}}
  - {observation_ref: pulse,         code: {system: LOINC, value: 8867-4,  display: Heart rate},              value: {present: false}, time: {observed: {present: false}, received: {present: false}}, source_data_quality: not_applicable, provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}}
  - {observation_ref: consciousness, code: {system: LOINC, value: 67775-7, display: Level of responsiveness}, value: {present: false}, time: {observed: {present: false}, received: {present: false}}, source_data_quality: not_applicable, provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}}
  - {observation_ref: temperature,   code: {system: LOINC, value: 8310-5,  display: Body temperature},        value: {present: false}, time: {observed: {present: false}, received: {present: false}}, source_data_quality: not_applicable, provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}}
expected_evaluation_status: not_evaluated
expected_outcome:
  fires: false
  fire_reason: null
  no_fire_reason: insufficient_data
  score_or_criterion_detail: >
    No total computed. Per-parameter detail: missing_required_input for all of
    rr, spo2, o2_status, sbp, pulse, consciousness, temperature. Any numeric
    total (including 0) is a HAZ-0005 regression and a release blocker.
explanation_requirements: {must_show_inputs_used: true, must_show_missing_inputs: true, must_show_rule_version: true, must_show_source_time_and_freshness: true}
clinical_expectation_provenance:
  owner: UNASSIGNED — VALIDATION REQUIRED
  evidence_basis: "evaluation-status-semantics.md section 3.3; HAZ-0005; SAF-0002 absent-input probe"
  reviewed_independently_of_rule_author: false
  review_status: UNREVIEWED
  review_date: null
  reviewer: UNASSIGNED — VALIDATION REQUIRED
authorship:
  vector_author: UNASSIGNED — VALIDATION REQUIRED   # authored by the spec author agent; see section 0
  rule_implementer: UNASSIGNED — VALIDATION REQUIRED
  independence_confirmed: false
status: DRAFT
supersedes: null
superseded_by: null
last_updated: "2026-08-15"
```

### CRV-NEWS2-0119 — Scale 2, SpO2 70 % on oxygen scores 3, never 0 (legacy D-1 defect case)

```yaml
vector_id: CRV-NEWS2-0119
title: "Scale 2 with documented order - profound hypoxaemia on oxygen scores 3, not 0"
pathway_id: RULE-NEWS2
rule_version: {bundle: news2, version: 0.2.0, content_hash: UNASSIGNED-precursor, status: draft}
scenario_class: adversarial
boundary_edge_class: [threshold-exact-match, multi-criteria-combination]
description: >
  Patient with a documented clinical order assigning SpO2 Scale 2 (hypercapnic
  respiratory failure, target 88-92 percent), receiving supplemental oxygen, SpO2
  70 percent. RCP Chart 1: the low Scale-2 bands (<=83 -> 3) apply regardless of
  air/oxygen. Legacy on-O2 Scale-2 branch scored <=92 as 0 (news2-review.md D-1) -
  the most dangerous single-band defect found. Expected: SpO2 parameter 3 (red),
  supplemental oxygen 2, total 5, tier medium with red-parameter flag.
context:
  tenant_id: synthetic-tenant-0900
  encounter_id: synthetic-encounter-0919
  facility_id: synthetic-facility-0900
  care_unit_id: synthetic-unit-0900
  bed_id: synthetic-bed-0919
  population: adult
  data_provenance: synthetic-only
input_observations:
  - observation_ref: spo2
    code: {system: LOINC, value: 59408-5, display: Oxygen saturation}
    value: {present: true, quantity: 70, unit: "%", unit_conversion_applied: null}
    time:
      observed: {value: "2026-08-15T10:00:00-03:00", offset: "-03:00", precision: minute, present: true}
      received: {value: "2026-08-15T13:00:05Z", present: true}
    source_data_quality: valid
    provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}
  - observation_ref: o2-status
    code: {system: LOINC, value: 3151-8, display: Inhaled oxygen flow rate}
    value: {present: true, quantity: 4, unit: "L/min", unit_conversion_applied: null}
    time:
      observed: {value: "2026-08-15T10:00:00-03:00", offset: "-03:00", precision: minute, present: true}
      received: {value: "2026-08-15T13:00:05Z", present: true}
    source_data_quality: valid
    provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}
  # rr 16, sbp 120, pulse 70, consciousness A, temperature 37.0 as baseline, all present/in-window
  # governed input: spo2_scale_assignment = scale2, documented order, authored by a
  # synthetic qualified clinician role, timestamped 2026-08-14, unrevoked
expected_evaluation_status: valid
expected_outcome:
  fires: true
  fire_reason: "Single red parameter (SpO2 Scale 2 = 3) and aggregate 5 - advisory tier medium; urgent-review display semantics per RCP Chart 2"
  no_fire_reason: null
  score_or_criterion_detail: "SpO2 (Scale 2, <=83 band applies regardless of oxygen) = 3; supplemental O2 = 2; all other parameters 0; total 5."
explanation_requirements: {must_show_inputs_used: true, must_show_missing_inputs: true, must_show_rule_version: true, must_show_source_time_and_freshness: true}
clinical_expectation_provenance:
  owner: UNASSIGNED — VALIDATION REQUIRED
  evidence_basis: "RCP NEWS2 (2017) Chart 1 p.29 (Scale 2 bands) and p.31 (scale governance); https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf"
  reviewed_independently_of_rule_author: false
  review_status: UNREVIEWED
  review_date: null
  reviewer: UNASSIGNED — VALIDATION REQUIRED
authorship:
  vector_author: UNASSIGNED — VALIDATION REQUIRED
  rule_implementer: UNASSIGNED — VALIDATION REQUIRED
  independence_confirmed: false
status: DRAFT
supersedes: null
superseded_by: null
last_updated: "2026-08-15"
```

### CRV-NEWS2-0116 — unmapped consciousness token is invalid, never 0 and never 3

```yaml
vector_id: CRV-NEWS2-0116
title: "Unmappable consciousness token yields invalid - never scored 0 or 3"
pathway_id: RULE-NEWS2
rule_version: {bundle: news2, version: 0.2.0, content_hash: UNASSIGNED-precursor, status: draft}
scenario_class: adversarial
boundary_edge_class: [conflicting-sources]
description: >
  Consciousness arrives as the token SEDATED, outside the ACVPU set {A,C,V,P,U}.
  Legacy behavior was path-dependent: the HL7 path parsed unknown tokens (including
  C) to None which scored 0 (news2-review.md D-7); the API scorer scored any
  non-A string as 3 (D-8). Both coercions are rejected: an unmappable clinical
  token is a detected integrity failure - evaluation status invalid with reason
  unmappable_code, per evaluation-status-semantics section 3.5.
context:
  tenant_id: synthetic-tenant-0900
  encounter_id: synthetic-encounter-0916
  facility_id: synthetic-facility-0900
  care_unit_id: synthetic-unit-0900
  bed_id: synthetic-bed-0916
  population: adult
  data_provenance: synthetic-only
input_observations:
  - observation_ref: consciousness
    code: {system: LOINC, value: 67775-7, display: Level of responsiveness}
    value: {present: true, quantity: null, unit: null, unit_conversion_applied: null}
    # coded token payload: "SEDATED" - not a member of {A, C, V, P, U}
    time:
      observed: {value: "2026-08-15T10:00:00-03:00", offset: "-03:00", precision: minute, present: true}
      received: {value: "2026-08-15T13:00:05Z", present: true}
    source_data_quality: valid
    provenance: {source_system: synthetic-source, correction_of: null, conflicts_with: []}
  # all six other inputs at baseline, present/in-window
expected_evaluation_status: invalid
expected_outcome:
  fires: false
  fire_reason: null
  no_fire_reason: invalid_data
  score_or_criterion_detail: >
    No total computed. Reason unmappable_code:consciousness. Scoring this token as
    0 reproduces legacy D-7; scoring it as 3 reproduces legacy D-8; both are
    regressions. Note the source_data_quality is amh_valid - source validity does
    not constrain evaluation status (two-dimension rule, HAZ-0040).
explanation_requirements: {must_show_inputs_used: true, must_show_missing_inputs: true, must_show_rule_version: true, must_show_source_time_and_freshness: true}
clinical_expectation_provenance:
  owner: UNASSIGNED — VALIDATION REQUIRED
  evidence_basis: "evaluation-status-semantics.md section 3.5; shared-findings.md SF-3; RCP Recs 29-30 (ACVPU token set)"
  reviewed_independently_of_rule_author: false
  review_status: UNREVIEWED
  review_date: null
  reviewer: UNASSIGNED — VALIDATION REQUIRED
authorship:
  vector_author: UNASSIGNED — VALIDATION REQUIRED
  rule_implementer: UNASSIGNED — VALIDATION REQUIRED
  independence_confirmed: false
status: DRAFT
supersedes: null
superseded_by: null
last_updated: "2026-08-15"
```

## 4. Count summary

| Category | Vectors |
|---|---|
| Typical/normal | 1 (CRV-NEWS2-0101) |
| Missing data, staleness, integrity, population | 17 (CRV-NEWS2-0102–0118) |
| SpO2 scale governance | 5 (CRV-NEWS2-0119–0123) |
| SpO2 Scale 2 band boundaries | 14 (CRV-NEWS2-0124–0137) |
| Scale 1 + remaining parameter band boundaries | 47 (CRV-NEWS2-0138–0184) |
| Aggregate thresholds and tiers | 5 (CRV-NEWS2-0185–0189) |
| Decision-driven (GDEC-0007: pregnancy N-2, rounding tie N-7, conflict tolerance N-10) | 4 (CRV-NEWS2-0190–0193) |
| **Total** | **93** |

## 5. Open items for this vector set

1. Independent re-authoring or independent clinical review of every expected outcome
   (section 0) — blocking for any progression beyond DRAFT. (A revisão clínica nomeada
   GDEC-0007 decidiu as expectativas; a autoria independente e a evidência de execução
   continuam pendentes.)
2. CRV ID block registration in a central catalog (none exists yet); references outside
   `rule-releases/` still citing bare `CRV-01xx` IDs are renumbered by the steward at
   their next revision (P-3, GDEC-0007).
3. Resolution of the quarantined-input reason-taxonomy tension (§1, CRV-NEWS2-0118).
4. RESOLVIDO (GDEC-0007 N-5 (a)): the window numbers inherited by CRV-NEWS2-0110–0112
   from `specification.md` §2.2 were ratified unchanged — no re-derivation needed.
5. RESOLVIDO (GDEC-0007 N-7 (a)): tie direction decided (toward the more abnormal
   band); first tie vector added (CRV-NEWS2-0192). Further ± half-step vectors for
   every numeric boundary may be added by the independent vector author.
