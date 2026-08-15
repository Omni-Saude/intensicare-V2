---
id: RULE-SOFA-CRV-0300
title: RULE-SOFA v0.2.0 — clinical reference vectors (DRAFT set, release-package precursor)
label: PROPOSAL
status: clinicamente revisado (GDEC-0007, 2026-08-15); evidência de execução pendente — vetores permanecem DRAFT para fins de execução
last_updated: 2026-08-15
statement: >
  Thirty-eight active clinical reference vectors (plus three retired/superseded by the
  GDEC-0007 decisions, including the derived missing-dose floor) for RULE-SOFA v0.2.0
  per the clinical reference-vector standard,
  covering typical, band-boundary, missing-input, stale, conflicting, population-gating,
  invalid-value, sedation-confounded, provisional-first-hour, untabulated-agent-floor,
  missing-dose-floor, renal-declared-partial, and zero-is-a-value scenarios, including the HAZ-0005
  all-inputs-missing regression vector and the legacy-defect regression vectors.
  Clinicamente revisado (GDEC-0007); evidência de execução pendente. Every vector
  remains DRAFT for execution purposes: authored by the same agent that authored the
  specification, so authorship independence is NOT satisfied and no vector may be cited
  as release execution evidence.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/rule-releases/sofa/reference-vectors.md
  commit_sha_or_version: uncommitted (working tree on cycle-1/clinical-content)
  section_or_lines: whole document
  date_collected: 2026-08-15
  collector: SOFA-family V2 clinical-content specification author (cycle 1, Task 2); accountable reviewer rodaquino-OMNI
  transformation: >
    Expected outcomes derived from specification.md §4-§5 (itself re-derived from
    Vincent 1996 and Singer 2016); scenario selection from the CRV standard's
    boundary/edge taxonomy and the legacy defect catalog (LEGREV-SOFA-0001 §5-§6).
    All input values synthetic.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0006, SAF-0019, SAF-0030, SAF-0035]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0032, HAZ-0036]
  adrs: [ADR-0008 (pending)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RULE-SOFA v0.2.0 — clinical reference vectors

**Clinicamente revisado (GDEC-0007, 2026-08-15); evidência de execução pendente.** Os
vetores permanecem `status: DRAFT` **para fins de execução** per
`docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md` (the CRV
standard): the named review decided the clinical expectations (38 active vectors; 3
retired/superseded where a decision — including the derived missing-dose floor,
GDEC-0007 princípio 2 — changed the expected outcome), but execution
evidence and independent authorship remain outstanding. All patient data is synthetic.
No vector may be cited as clinical release execution evidence: per CRV standard §8,
`authorship.independence_confirmed: false` for every vector here, because the vector
author is the same agent as the rule-spec author. A future independent author/reviewer
must re-derive or independently confirm each expected outcome before any vector can
reach `RATIFIED`.

## 0. Conventions used in this file

1. **Vector IDs.** `CRV-SOFA-0301`..`CRV-SOFA-0341` (active: 38; retired:
   CRV-SOFA-0321 → CRV-SOFA-0340, CRV-SOFA-0322 → CRV-SOFA-0336, CRV-SOFA-0323 →
   CRV-SOFA-0335 — superseded after the GDEC-0007 decisions, including the derived
   missing-dose floor, changed their expected outcomes). **DECISÃO (GDEC-0007,
   2026-08-15, folha P-3 (a)):** esquema de prefixo por regra adotado — `CRV-SOFA-####`,
   `CRV-NEWS2-####`, `CRV-GCS-####`; partes numéricas mantidas, prefixo trocado —
   impossibilita a próxima colisão de namespace; renumeração executada nesta revisão
   (0.2.0). História: this file's block was originally self-claimed as CRV-0101–0199,
   which collided with RULE-NEWS2's concurrently claimed block; a first mechanical
   renumbering (steward, 2026-08-15) moved SOFA to the 03xx numeric block (old ID + 0200
   = 03xx ID), and the decided per-rule prefixes now make every ID globally unambiguous.
   References in files outside `rule-releases/` still citing bare `CRV-03xx`/`CRV-01xx`/
   `CRV-02xx` IDs are renumbered by the steward at their next revision (per P-3). See
   `../../../00-governance/traceability-policy.md` §1.1 for the range table. IDs remain
   provisional (PROPOSAL, not ratified into the taxonomy) until catalog registration
   (CRV standard §3).
2. **Compaction (documented deviation).** The CRV standard's principle "every field
   explicit" applies to materialized per-vector YAML files. This precursor uses one
   **common block** (§1) plus a **reference input panel** (§2); each vector then states
   only its identity, scenario, deltas from the panel, and full expected outcome.
   Absence is always explicit (`present: false`) — never an omitted key. When the
   catalog location is ratified, each vector must be materialized into a full-schema
   file; that materialization is mechanical and adds no clinical content.
3. **Evaluation instant** `T = 2026-08-15T12:00:00-03:00`. All windows per
   `specification.md` §3.2.
4. **`fires`.** RULE-SOFA 0.2.0 defines no alert/fire condition; every vector asserts
   `fires: false` and the score/status expectation carries the clinical content.
   `no_fire_reason: criteria_not_met` appears only with `expected_evaluation_status:
   valid` — or `partial` for the single ratified declared-partial class (renal
   worst-of-available, GDEC-0007 OQ-7), where a score is likewise readable (CRV
   standard §6 rule, extended by the decided partial class).

## 1. Common block (applies verbatim to every vector below)

```yaml
pathway_id: CAND-0003            # SOFA, per candidate-inventory.md
rule_version:
  bundle: "RULE-SOFA"
  version: "0.2.0"
  content_hash: "c13b22b3e9fada466a160fe0b263435fb809dff95cc3061d257fe90645a75a24"  # logic.yaml 0.2.0 (GDEC-0007 + derived missing-dose floor), unsigned working hash
  status: draft
context:
  tenant_id: "synthetic-tenant-0001"
  encounter_id: "synthetic-encounter-0001"
  facility_id: "synthetic-facility-0001"
  care_unit_id: "synthetic-icu-0001"
  bed_id: "synthetic-bed-0001"
  population: adult              # except where a vector overrides age
  data_provenance: synthetic-only
source_data_quality: valid       # AMH dimension; deliberately 'valid' everywhere so every
                                 # non-valid EVALUATION status is produced by V2's own
                                 # algebra, never inherited from source quality (DOM-0008/HAZ-0040)
explanation_requirements:
  must_show_inputs_used: true
  must_show_missing_inputs: true
  must_show_rule_version: true
  must_show_source_time_and_freshness: true
clinical_expectation_provenance:
  owner: UNASSIGNED — VALIDATION REQUIRED
  evidence_basis: "Vincent 1996 doi:10.1007/BF01709751; Singer 2016 doi:10.1001/jama.2016.0287; specification.md §4-§5"
  reviewed_independently_of_rule_author: false
  review_status: UNREVIEWED
  review_date: null
  reviewer: UNASSIGNED — VALIDATION REQUIRED
authorship:
  vector_author: "SOFA-family V2 clinical-content specification author (cycle 1, Task 2 agent)"
  rule_implementer: "same agent (spec author) — INDEPENDENCE NOT SATISFIED"
  independence_confirmed: false
status: DRAFT
supersedes: null
superseded_by: null
last_updated: "2026-08-15"
```

## 2. Reference input panel `PANEL-NORMAL`

All observed times carry offset `-03:00`, precision `minute`, `present: true`;
`received` times are within 5 minutes of observed (synthetic). A vector's `deltas`
replace, remove (`present: false`), or add entries. "Absent" inputs listed in a delta
are explicit `present: false` entries in the materialized form.

```yaml
age:            {value: 64, unit: "a"}                                  # demographic, encounter-constant
pao2:           {value: 96, unit: "mm[Hg]", observed: "2026-08-15T08:00"}
fio2:           {value: 0.21, unit: "1",     observed: "2026-08-15T08:00"}   # paired with pao2; ratio = 457
respiratory_support_status: {value: none,    observed: "2026-08-15T08:00"}
platelets:      {value: 250, unit: "10*3/uL", observed: "2026-08-15T06:00"}
bilirubin:      {value: 0.6, unit: "mg/dL",  observed: "2026-08-15T06:00"}
map:            {value: 85, unit: "mm[Hg]",  observed: "2026-08-15T10:00"}
vasoactive_agents: {value: none-active}
sedative_infusion: {value: none-active}                                  # documented absence
gcs:            {value: 15, unit: "{score}", observed: "2026-08-15T09:00"}
rass:           {value: 0,                    observed: "2026-08-15T09:00"}
creatinine:     {value: 0.8, unit: "mg/dL",  observed: "2026-08-15T06:00"}
urine_output_24h: {value: 1800, unit: "mL", interval: "2026-08-14T10:00/2026-08-15T10:00"}
body_weight:    {value: 70, unit: "kg",      observed: "2026-08-12T09:00"}
```

Expected under `PANEL-NORMAL` unmodified: all six components `valid`, scores
resp 0 / coag 0 / liver 0 / cv 0 / cns 0 / renal 0, total 0, status `valid`.

## 3. Vectors

### 3.1 Typical (2)

```yaml
- vector_id: CRV-SOFA-0301
  title: "All inputs present, in-window, normal — total 0, valid"
  scenario_class: typical
  boundary_edge_class: []
  deltas: {}   # PANEL-NORMAL as-is
  expected:
    components: {resp: 0, coag: 0, liver: 0, cv: 0, cns: 0, renal: 0}
    component_statuses: all valid
    total: 0
    expected_evaluation_status: valid
    outcome: {fires: false, no_fire_reason: criteria_not_met}
  note: "A genuine, fully assessed 0 — the state legacy could counterfeit from absence. Contrast CRV-SOFA-0317."

- vector_id: CRV-SOFA-0302
  title: "All components at maximal severity — total 24, valid"
  scenario_class: typical
  boundary_edge_class: []
  deltas:
    pao2: {value: 60, unit: "mm[Hg]", observed: "2026-08-15T08:00"}
    fio2: {value: 1.0, unit: "1", observed: "2026-08-15T08:00"}          # ratio 60
    respiratory_support_status: {value: invasive_mechanical_ventilation, observed: "2026-08-15T08:00"}
    platelets: {value: 10, unit: "10*3/uL"}
    bilirubin: {value: 15.0, unit: "mg/dL"}
    map: {value: 55, unit: "mm[Hg]"}
    vasoactive_agents: [{agent: norepinephrine, dose: 0.5, unit: "ug/kg/min", sustained_min: 180, last_confirmed: "2026-08-15T11:00"}]
    gcs: {value: 3}
    rass: {value: -5}
    sedative_infusion: {value: none-active}    # documented absence -> genuine coma, scores (spec §4.5)
    creatinine: {value: 6.0, unit: "mg/dL"}
    urine_output_24h: {value: 100, unit: "mL", interval: "2026-08-14T10:00/2026-08-15T10:00"}
  expected:
    components: {resp: 4, coag: 4, liver: 4, cv: 4, cns: 4, renal: 4}
    component_statuses: all valid
    total: 24
    expected_evaluation_status: valid
    outcome: {fires: false, no_fire_reason: criteria_not_met}
  note: "Unsedated structural coma (documented absence of sedatives) scores CNS 4 — I-8 refinement."
```

### 3.2 Band boundaries (14) — exact cut-points, ± epsilon, and named legacy regressions

```yaml
- vector_id: CRV-SOFA-0303
  title: "P/F exactly 400 — respiration 0"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas: {pao2: {value: 84, unit: "mm[Hg]"}, fio2: {value: 0.21, unit: "1"}}   # 84/0.21 = 400.0
  expected: {components: {resp: 0}, others: PANEL-NORMAL, total: 0, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}

- vector_id: CRV-SOFA-0304
  title: "P/F just below 400 — respiration 1"
  scenario_class: boundary
  boundary_edge_class: [threshold-just-below]
  deltas: {pao2: {value: 83.9, unit: "mm[Hg]"}, fio2: {value: 0.21, unit: "1"}}  # ratio 399.5
  expected: {components: {resp: 1}, others: PANEL-NORMAL, total: 1, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}

- vector_id: CRV-SOFA-0305
  title: "P/F exactly 100 on invasive ventilation — respiration 3"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas:
    pao2: {value: 100, unit: "mm[Hg]"}
    fio2: {value: 1.0, unit: "1"}
    respiratory_support_status: {value: invasive_mechanical_ventilation}
  expected: {components: {resp: 3}, others: PANEL-NORMAL, total: 3, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}
  note: "Exactly 100 is NOT <100: band 4 unsatisfied, band 3 (<200 with support) is the highest satisfied."

- vector_id: CRV-SOFA-0306
  title: "P/F just below 100 on invasive ventilation — respiration 4"
  scenario_class: boundary
  boundary_edge_class: [threshold-just-below]
  deltas:
    pao2: {value: 99.9, unit: "mm[Hg]"}
    fio2: {value: 1.0, unit: "1"}
    respiratory_support_status: {value: invasive_mechanical_ventilation}
  expected: {components: {resp: 4}, others: PANEL-NORMAL, total: 4, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}

- vector_id: CRV-SOFA-0307
  title: "P/F 150 WITHOUT respiratory support — respiration capped at 2 (I-2)"
  scenario_class: boundary
  boundary_edge_class: [multi-criteria-combination]
  deltas:
    pao2: {value: 52.5, unit: "mm[Hg]"}
    fio2: {value: 0.35, unit: "1"}          # ratio 150
    respiratory_support_status: {value: none}
  expected: {components: {resp: 2}, others: PANEL-NORMAL, total: 2, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}
  note: "Highest-satisfied-band reading: bands 3-4 require support. Ratification pending (OQ-2)."

- vector_id: CRV-SOFA-0308
  title: "Platelets exactly 20 — coagulation 3, not 4"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas: {platelets: {value: 20, unit: "10*3/uL"}}
  expected: {components: {coag: 3}, others: PANEL-NORMAL, total: 3, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}

- vector_id: CRV-SOFA-0309
  title: "Bilirubin 1.95 mg/dL — liver 1 (trilhas dead-gap [1.9,2.0) regression)"
  scenario_class: boundary
  boundary_edge_class: [threshold-just-below]
  deltas: {bilirubin: {value: 1.95, unit: "mg/dL"}}
  expected: {components: {liver: 1}, others: PANEL-NORMAL, total: 1, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}
  note: "Legacy trilhas rule 004 returned None here and could crash the whole score. Continuous bands make the gap unrepresentable."

- vector_id: CRV-SOFA-0310
  title: "Bilirubin 34 umol/L — converts to 1.99 mg/dL, liver 1 (conversion before banding)"
  scenario_class: boundary
  boundary_edge_class: [unit-conversion-boundary]
  deltas: {bilirubin: {value: 34, unit: "umol/L", unit_conversion_applied: "umol/L / 17.104 = 1.988 mg/dL"}}
  expected: {components: {liver: 1}, others: PANEL-NORMAL, total: 1, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}
  note: "34 read AS mg/dL would band 4 (a 3-point error). Proves exact conversion precedes comparison (HAZ-0032)."

- vector_id: CRV-SOFA-0311
  title: "MAP exactly 70, no vasoactives — cardiovascular 0"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas: {map: {value: 70, unit: "mm[Hg]"}}
  expected: {components: {cv: 0}, others: PANEL-NORMAL, total: 0, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}

- vector_id: CRV-SOFA-0312
  title: "Dopamine exactly 5.0 ug/kg/min sustained 90 min — cardiovascular 2"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas:
    vasoactive_agents: [{agent: dopamine, dose: 5.0, unit: "ug/kg/min", sustained_min: 90, last_confirmed: "2026-08-15T11:30"}]
  expected: {components: {cv: 2}, others: PANEL-NORMAL, total: 2, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}
  note: "<=5 is band 2; 5.0 is not >5."

- vector_id: CRV-SOFA-0313
  title: "Norepinephrine exactly 0.1 ug/kg/min sustained 90 min — cardiovascular 3"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas:
    vasoactive_agents: [{agent: norepinephrine, dose: 0.1, unit: "ug/kg/min", sustained_min: 90, last_confirmed: "2026-08-15T11:30"}]
  expected: {components: {cv: 3}, others: PANEL-NORMAL, total: 3, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}
  note: "<=0.1 is band 3; 0.1 is not >0.1. MAP present in panel but irrelevant to bands 2-4."

- vector_id: CRV-SOFA-0314
  title: "GCS exactly 6 — CNS 3, not 4"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas: {gcs: {value: 6}, rass: {value: -2}}
  expected: {components: {cns: 3}, others: PANEL-NORMAL, total: 3, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}

- vector_id: CRV-SOFA-0315
  title: "Creatinine exactly 5.0 mg/dL — renal 4 (trilhas dead-gap-at-5.0 regression)"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas: {creatinine: {value: 5.0, unit: "mg/dL"}}
  expected: {components: {renal: 4}, others: PANEL-NORMAL, total: 4, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}
  note: "Legacy trilhas rule 007 matched NO branch at exactly 5.0 and scored 0 — a 4-point undercount at the top of the scale."

- vector_id: CRV-SOFA-0316
  title: "Urine output exactly 200 mL/24h — renal 3, not 4"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas: {urine_output_24h: {value: 200, unit: "mL", interval: "2026-08-14T10:00/2026-08-15T10:00"}}
  expected: {components: {renal: 3}, others: PANEL-NORMAL, total: 3, expected_evaluation_status: valid,
             outcome: {fires: false, no_fire_reason: criteria_not_met}}
  note: "200 is not <200; <500 band applies. Creatinine 0.8 bands 0; component = max(0,3) = 3."
```

### 3.3 Missing inputs — the HAZ-0005 family (4 active + 3 retired/superseded per GDEC-0007)

```yaml
- vector_id: CRV-SOFA-0317
  title: "ALL inputs missing — not_evaluated, NEVER zero (HAZ-0005 primary regression)"
  scenario_class: edge
  boundary_edge_class: [all-inputs-missing]
  deltas: "every clinical input present: false (age present, 64 — population gate passes)"
  expected:
    components: all not_evaluated (reason missing_required_input per component)
    total: NOT EMITTED — no numeric value of any kind
    expected_evaluation_status: not_evaluated
    reasons: [missing_required_input:resp, missing_required_input:coag, missing_required_input:liver,
              missing_required_input:cv, missing_required_input:cns, missing_required_input:renal]
    outcome: {fires: false, no_fire_reason: insufficient_data}
  note: "Legacy returned SOFA 0 here and persisted it (LEGACY-TA:469-478). Any numeric output on this vector is a severity-1 release blocker (spec §9 M-2)."

- vector_id: CRV-SOFA-0318
  title: "Single component missing (GCS absent) — total not_evaluated, five components valid"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]
  deltas: {gcs: {present: false}, rass: {present: false}}
  expected:
    components: {resp: 0 valid, coag: 0 valid, liver: 0 valid, cv: 0 valid,
                 cns: not_evaluated(missing_required_input:gcs), renal: 0 valid}
    total: NOT EMITTED
    expected_evaluation_status: not_evaluated
    reasons: [missing_required_input:cns]
    outcome: {fires: false, no_fire_reason: insufficient_data}
  note: "No 5-of-6 partial sum exists (spec §5.2). Per-component detail remains available to the clinician."

- vector_id: CRV-SOFA-0319
  title: "Norepinephrine 0.5 ug/kg/min, MAP ABSENT — cardiovascular 4 (legacy D-07 regression)"
  scenario_class: edge
  boundary_edge_class: [single-input-missing, multi-criteria-combination]
  deltas:
    map: {present: false}
    vasoactive_agents: [{agent: norepinephrine, dose: 0.5, unit: "ug/kg/min", sustained_min: 240, last_confirmed: "2026-08-15T11:00"}]
  expected:
    components: {cv: 4 valid, others: PANEL-NORMAL valid}
    total: 4
    expected_evaluation_status: valid
    outcome: {fires: false, no_fire_reason: criteria_not_met}
  note: "The worst single legacy defect: sofa.py returned CV=0 'missing' here, discarding positive evidence of severe shock. Bands 2-4 do not reference MAP; vasopressor evidence must dominate."

- vector_id: CRV-SOFA-0320
  title: "MAP absent, NO vasoactive agents — cardiovascular not_evaluated"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]
  deltas: {map: {present: false}}
  expected:
    components: {cv: not_evaluated(missing_required_input:map), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: not_evaluated
    reasons: [missing_required_input:cv]
    outcome: {fires: false, no_fire_reason: insufficient_data}
  note: "Contrast CRV-SOFA-0319: MAP is required exactly when no tabulated agent is active."

- vector_id: CRV-SOFA-0321
  title: "APOSENTADO — norepinephrine active, dose missing → not_evaluated (expectativa 0.1.0/0.2.0 inicial, substituída por decisão derivada)"
  status: RETIRED
  superseded_by: CRV-SOFA-0340
  retirement_note: >
    DECISÃO DERIVADA (GDEC-0007, princípio 2 — escalar-nunca-tranquilizar; aplicação da
    lógica de OQ-5 (b)), sujeita a confirmação do revisor na próxima revisão: agente
    tabelado presente com dose ausente → piso pelo mínimo que a presença do agente
    garante em Vincent 1996, não not_evaluated (que tranquilizava um paciente em
    noradrenalina abaixo do piso do agente não tabelado). Ver CRV-SOFA-0340/0341
    (§3.10). O D-10 legado (tier exato adivinhado, sem marcador) permanece rejeitado.

- vector_id: CRV-SOFA-0322
  title: "RETIRADO — vasopressin only → not_evaluated (expectativa 0.1.0, substituída por decisão)"
  status: RETIRED
  superseded_by: CRV-SOFA-0336
  retirement_note: >
    DECISÃO (GDEC-0007, 2026-08-15, OQ-5 (b)): agente não tabelado presente → piso CV 3
    sinalizado, não not_evaluated. Expectativa original (not_evaluated,
    vasoactive_agent_unmapped) aposentada e superseded — nunca editada — conforme a
    convenção retire-and-supersede deste arquivo. Ver CRV-SOFA-0336 (§3.10).

- vector_id: CRV-SOFA-0323
  title: "RETIRADO — renal-half → not_evaluated (expectativa 0.1.0, substituída por decisão)"
  status: RETIRED
  superseded_by: CRV-SOFA-0335
  retirement_note: >
    DECISÃO (GDEC-0007, 2026-08-15, OQ-7 (b)): renal = pior-critério-disponível;
    creatinina-só escora como parcial declarado com flag do critério ausente. A nota
    original deste vetor previa exatamente este caminho: "retired and superseded, not
    edited". Ver CRV-SOFA-0335 (§3.10).
```

### 3.4 Stale and expired (2)

```yaml
- vector_id: CRV-SOFA-0324
  title: "Platelets 36 h old (window 24 h, expiry 48 h) — coagulation stale, total not_evaluated"
  scenario_class: edge
  boundary_edge_class: [freshness-window-edge]
  deltas: {platelets: {value: 250, unit: "10*3/uL", observed: "2026-08-14T00:00"}}
  expected:
    components: {coag: stale (age 36 h shown, score not readable), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: not_evaluated
    reasons: [stale_input:coagulation]
    outcome: {fires: false, no_fire_reason: stale_data}
  note: "Status recomputed at read time from source clinical time; last value and its age are displayed."

- vector_id: CRV-SOFA-0325
  title: "Platelets 50 h old (beyond 48 h expiry) — coagulation not_evaluated (expired), total not_evaluated"
  scenario_class: edge
  boundary_edge_class: [freshness-window-edge]
  deltas: {platelets: {value: 250, unit: "10*3/uL", observed: "2026-08-13T10:00"}}
  expected:
    components: {coag: not_evaluated(expired_input:platelets), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: not_evaluated
    reasons: [expired_input:coagulation]
    outcome: {fires: false, no_fire_reason: stale_data}
  note: "Beyond expiry, an old conclusion is no conclusion — stale degrades to not_evaluated (semantics §3.4)."
```

### 3.5 Conflicting inputs (1)

```yaml
- vector_id: CRV-SOFA-0326
  title: "Two simultaneous unreconciled platelet values (40 and 400) — coagulation invalid, total invalid"
  scenario_class: edge
  boundary_edge_class: [conflicting-sources]
  deltas:
    platelets: two observations, same observed time "2026-08-15T06:00", values 40 and 400 (10*3/uL),
               conflicts_with each other, no reconciliation record
  expected:
    components: {coag: invalid(conflicting_inputs), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: invalid
    reasons: [conflicting_inputs:coagulation]
    outcome: {fires: false, no_fire_reason: invalid_data}
  note: "Never resolved by picking the worse (or better) value; a detected integrity problem must not become a silently reduced assessment (semantics §3.5)."
```

### 3.6 Population gating (3)

```yaml
- vector_id: CRV-SOFA-0327
  title: "Age UNKNOWN, all inputs perfect — not_evaluated; the rule never assumes adult"
  scenario_class: edge
  boundary_edge_class: [population-exclusion-boundary]
  deltas: {age: {present: false}}
  expected:
    components: none evaluated
    total: NOT EMITTED
    expected_evaluation_status: not_evaluated
    reasons: [population_unverified]
    outcome: {fires: false, no_fire_reason: out_of_population_scope}
  note: "HAZ-0036/PH-11: adult-instrument output on an unverified-age patient is misleading, not merely absent. VAL-0006/0007 BLOCKING."

- vector_id: CRV-SOFA-0328
  title: "Age 17, all inputs perfect — not_evaluated (out of population)"
  scenario_class: edge
  boundary_edge_class: [population-exclusion-boundary]
  deltas: {age: {value: 17, unit: "a"}}
  expected:
    components: none evaluated
    total: NOT EMITTED
    expected_evaluation_status: not_evaluated
    reasons: [out_of_population_scope]
    outcome: {fires: false, no_fire_reason: out_of_population_scope}

- vector_id: CRV-SOFA-0329
  title: "Age exactly 18 — in population, evaluates normally"
  scenario_class: boundary
  boundary_edge_class: [population-exclusion-boundary, threshold-exact-match]
  deltas: {age: {value: 18, unit: "a"}}
  expected:
    components: {resp: 0, coag: 0, liver: 0, cv: 0, cns: 0, renal: 0} all valid
    total: 0
    expected_evaluation_status: valid
    outcome: {fires: false, no_fire_reason: criteria_not_met}
```

### 3.7 Invalid values and units (3)

```yaml
- vector_id: CRV-SOFA-0330
  title: "FiO2 value 40 with unit ABSENT — respiration invalid; never heuristic-divided (trilhas FiO2-percent regression)"
  scenario_class: adversarial
  boundary_edge_class: [unit-conversion-boundary]
  deltas: {fio2: {value: 40, unit: {present: false}}}
  expected:
    components: {resp: invalid(unmappable_unit), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: invalid
    reasons: [unmappable_unit:respiration]
    outcome: {fires: false, no_fire_reason: invalid_data}
  note: "A fraction cannot exceed 1.0 and no unit is declared. Trilhas-era code mixed percent and fraction, scoring nearly every patient resp 4. V2 never guesses /100; with unit '%' declared, 40 would convert to 0.40 lawfully."

- vector_id: CRV-SOFA-0331
  title: "GCS 20 — CNS invalid (out of range 3-15; legacy D-13 regression)"
  scenario_class: adversarial
  boundary_edge_class: [threshold-just-above]
  deltas: {gcs: {value: 20}}
  expected:
    components: {cns: invalid(out_of_range), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: invalid
    reasons: [out_of_range:cns]
    outcome: {fires: false, no_fire_reason: invalid_data}
  note: "Legacy scored GCS 20 as 1 point via the >=13 branch. A physiologically impossible value can never band."

- vector_id: CRV-SOFA-0332
  title: "Platelets 0 — coagulation invalid (implausible; known legacy missing-sentinel)"
  scenario_class: adversarial
  boundary_edge_class: [threshold-just-below]
  deltas: {platelets: {value: 0, unit: "10*3/uL"}}
  expected:
    components: {coag: invalid(implausible_value), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: invalid
    reasons: [implausible_value:coagulation]
    outcome: {fires: false, no_fire_reason: invalid_data}
  note: "Trilhas treated 0 as 'no data' -> 0 points; a real count of 0 is also incompatible with life. Either way 0 must never band as 4 or as 0 — it is invalid and must be investigated."
```

### 3.8 Sedation confounding (1)

```yaml
- vector_id: CRV-SOFA-0333
  title: "GCS 3 during active midazolam infusion, RASS -4 — CNS not_evaluated (sedation_confounded)"
  scenario_class: edge
  boundary_edge_class: [multi-criteria-combination]
  deltas:
    gcs: {value: 3, observed: "2026-08-15T09:00"}
    rass: {value: -4, observed: "2026-08-15T09:00"}
    sedative_infusion: {value: midazolam-active, interruption_window: none}
  expected:
    components: {cns: not_evaluated(sedation_confounded), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: not_evaluated
    reasons: [sedation_confounded:cns]
    outcome: {fires: false, no_fire_reason: insufficient_data}
  note: "Legacy scored this patient CNS 4 with no sedation covariate (REV-NS-01). Expectation CONFIRMED by DECISÃO (GDEC-0007, 2026-08-15, OQ-8 (b) — política fail-closed conjunta com RULE-GCS/ADR-0028). Contrast CRV-SOFA-0302 (unsedated coma scores) and CRV-SOFA-0338/0339 (unknown sedation, fail-closed)."
```

### 3.9 Zero is a value, not absence (1)

```yaml
- vector_id: CRV-SOFA-0334
  title: "Urine output 0 mL/24h (true anuria), creatinine 0.8 — renal 4, valid"
  scenario_class: edge
  boundary_edge_class: [threshold-just-below]
  deltas: {urine_output_24h: {value: 0, unit: "mL", interval: "2026-08-14T10:00/2026-08-15T10:00"}}
  expected:
    components: {renal: 4 valid (max of creatinine band 0, urine band 4), others: PANEL-NORMAL valid}
    total: 4
    expected_evaluation_status: valid
    outcome: {fires: false, no_fire_reason: criteria_not_met}
  note: "The inverse of HAZ-0005: a measured zero is maximal-severity evidence and must never be conflated with 'no measurement'. Anuric patient with still-normal creatinine — also shows why the mandatory lower-bound disclosure of the renal declared partial exists (GDEC-0007 OQ-7)."
```

### 3.10 Decision-driven vectors (GDEC-0007, 2026-08-15) — 7 new (3 superseding retired vectors; 0340/0341 per the derived missing-dose floor, GDEC-0007 princípio 2)

```yaml
- vector_id: CRV-SOFA-0335
  title: "Creatinine 1.0 present, urine output ABSENT — renal PARTIAL score 0 with mandatory flag (supersedes CRV-SOFA-0323; GDEC-0007 OQ-7 (b))"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]
  supersedes: CRV-SOFA-0323
  deltas: {urine_output_24h: {present: false}, creatinine: {value: 1.0, unit: "mg/dL"}}
  expected:
    components: {renal: "partial, score 0 (creatinine band), mandatory flag urine_output_not_assessed + lower-bound disclosure", others: PANEL-NORMAL valid}
    total: 0
    expected_evaluation_status: partial
    mandatory_disclosure: "débito urinário não avaliado — o escore renal é um limite inferior"
    outcome: {fires: false, no_fire_reason: criteria_not_met}
  note: "Pior-critério-disponível (GDEC-0007 OQ-7 (b)): critério único escora como parcial declarado por componente. Distinção vs legado D-16 (que escorava a metade presente SEM marcador de parcialidade): a flag e a divulgação de limite inferior são obrigatórias em toda exibição."

- vector_id: CRV-SOFA-0336
  title: "Vasopressin only (untabulated agent), MAP 55 — cardiovascular FLOOR 3 flagged (supersedes CRV-SOFA-0322; GDEC-0007 OQ-5 (b))"
  scenario_class: edge
  boundary_edge_class: [multi-criteria-combination]
  supersedes: CRV-SOFA-0322
  deltas:
    map: {value: 55, unit: "mm[Hg]"}
    vasoactive_agents: [{agent: vasopressin, dose: 0.04, unit: "U/min", sustained_min: 240}]
  expected:
    components: {cv: "valid, score 3 (floor), mandatory flag vasoactive_agent_untabulated ('agente não tabelado')", others: PANEL-NORMAL valid}
    total: 3
    expected_evaluation_status: valid
    mandatory_disclosure: "agente vasoativo não tabelado — piso CV 3; mapeamento com fonte VALIDATION REQUIRED"
    outcome: {fires: false, no_fire_reason: criteria_not_met}
  note: "The 1996 table has no vasopressin row. Legacy scored it 2 (below low-dose dopamine — D-10, still REJECTED). GDEC-0007 OQ-5 (b): not_evaluated tranquilizava indevidamente (INV-B); the decided floor never lowers, and a sourced exact mapping remains VALIDATION REQUIRED."

- vector_id: CRV-SOFA-0337
  title: "Norepinephrine 0.5 ug/kg/min started 30 min ago — cardiovascular 4 PROVISIONAL, flagged (GDEC-0007 OQ-3 (b))"
  scenario_class: edge
  boundary_edge_class: [multi-criteria-combination, freshness-window-edge]
  deltas:
    map: {value: 55, unit: "mm[Hg]"}
    vasoactive_agents: [{agent: norepinephrine, dose: 0.5, unit: "ug/kg/min", sustained_min: 30, last_confirmed: "2026-08-15T11:45"}]
  expected:
    components: {cv: "valid, score 4, mandatory flag provisional_infusion_lt_1h ('provisório — infusão <1h')", others: PANEL-NORMAL valid}
    total: 4
    expected_evaluation_status: valid
    mandatory_disclosure: "tier cardiovascular provisório — infusão qualificante com menos de 1 h"
    outcome: {fires: false, no_fire_reason: criteria_not_met}
  note: "First hour of a new qualifying infusion: the provisional escalation-capable tier applies immediately (GDEC-0007 OQ-3 (b)) — choque em início de noradrenalina é disfunção CV agora. Never lowers vs the no-vasopressor reading (MAP 55 alone would band 1; the provisional tier only raises). Declared adaptation vs Vincent verbatim; the >=1 h clause remains as anti-bolus filter for the confirmed tier."

- vector_id: CRV-SOFA-0338
  title: "GCS 5, RASS -4, sedative exposure UNKNOWN — CNS not_evaluated(sedation_confounded) — fail-closed (GDEC-0007 OQ-8 (b))"
  scenario_class: edge
  boundary_edge_class: [multi-criteria-combination]
  deltas:
    gcs: {value: 5, observed: "2026-08-15T09:00"}
    rass: {value: -4, observed: "2026-08-15T09:00"}
    sedative_infusion: {value: unknown}
  expected:
    components: {cns: not_evaluated(sedation_confounded), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: not_evaluated
    reasons: [sedation_confounded:cns]
    outcome: {fires: false, no_fire_reason: insufficient_data}
  note: "Fail-closed joint policy (GDEC-0007 OQ-8 (b) = RULE-GCS OQ-GCS-2 = ADR-0028 Q2): RASS <= -3 with active OR UNKNOWN sedative exposure is indistinguishable from deep sedation -> confounded. Under the retired 0.1.0 default this would have scored with a disclosure; that path is REMOVED. Contrast CRV-SOFA-0302 (documented absence of sedatives -> genuine coma scores)."

- vector_id: CRV-SOFA-0339
  title: "GCS 15 present, RASS ABSENT, sedative exposure unknown — CNS not_evaluated(sedation_state_unknown) — missing gating input (GDEC-0007 OQ-8 (b))"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]
  deltas:
    rass: {present: false}
    sedative_infusion: {value: unknown}
  expected:
    components: {cns: not_evaluated(sedation_state_unknown), others: PANEL-NORMAL valid}
    total: NOT EMITTED
    expected_evaluation_status: not_evaluated
    reasons: [sedation_state_unknown:cns]
    outcome: {fires: false, no_fire_reason: insufficient_data}
  note: "RASS missing/unpaired = sedation state unknown = missing gating input -> fail-closed (GDEC-0007 OQ-8 (b)). The 0.1.0 'score with sedation-state-not-assessed disclosure' default is removed; a GCS 15 without a paired RASS never reads as a valid CNS 0."

- vector_id: CRV-SOFA-0340
  title: "Norepinephrine active, dose MISSING — cardiovascular FLOOR 3 flagged (supersedes CRV-SOFA-0321; DECISÃO DERIVADA, GDEC-0007 princípio 2)"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]
  supersedes: CRV-SOFA-0321
  deltas:
    vasoactive_agents: [{agent: norepinephrine, dose: {present: false}, sustained_min: 240}]
  expected:
    components: {cv: "valid, score 3 (floor — norepinephrine any dose is at least the <=0.1 band), mandatory flag dose_missing_agent_presence_floor ('dose ausente — piso por presença do agente')", others: PANEL-NORMAL valid}
    total: 3
    expected_evaluation_status: valid
    mandatory_disclosure: "dose de noradrenalina ausente — piso 3 pela presença do agente; dose necessária para distinguir banda 3 de 4"
    outcome: {fires: false, no_fire_reason: criteria_not_met}
  note: "DECISÃO DERIVADA (GDEC-0007, princípio 2; aplicação da lógica de OQ-5 (b)) — sujeita a confirmação do revisor na próxima revisão. Distinção vs legado D-10 (rejeitado): o legado afirmava o tier exato 3 sem marcador, sub-escorando 4s verdadeiros como se fosse conclusão completa; o piso declara-se limite inferior com divulgação obrigatória e nunca rebaixa um escore por dose disponível."

- vector_id: CRV-SOFA-0341
  title: "Dopamine active, dose MISSING — cardiovascular FLOOR 2 flagged (DECISÃO DERIVADA, GDEC-0007 princípio 2)"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]
  deltas:
    vasoactive_agents: [{agent: dopamine, dose: {present: false}, sustained_min: 180}]
  expected:
    components: {cv: "valid, score 2 (floor — dopamine any dose is at least the <=5 band), mandatory flag dose_missing_agent_presence_floor", others: PANEL-NORMAL valid}
    total: 2
    expected_evaluation_status: valid
    mandatory_disclosure: "dose de dopamina ausente — piso 2 pela presença do agente; dose necessária para distinguir bandas 2/3/4"
    outcome: {fires: false, no_fire_reason: criteria_not_met}
  note: "Floor per agent presence in Vincent 1996: dobutamine/dopamine -> 2; norepinephrine/epinephrine -> 3. Composable with provisional_infusion_lt_1h (§4.4 I-3)."
```

## 4. Coverage summary

| Category | Vectors | Count |
|---|---|---|
| Typical (normal / maximal) | CRV-SOFA-0301, CRV-SOFA-0302 | 2 |
| Band boundaries (exact ± epsilon, incl. trilhas dead-gap and unit-conversion regressions) | CRV-SOFA-0303..CRV-SOFA-0316 | 14 |
| Missing inputs (HAZ-0005 family, incl. all-missing, single-missing, vasopressor-without-MAP D-07) | CRV-SOFA-0317..CRV-SOFA-0320 | 4 |
| Retired/superseded per GDEC-0007 (kept as historical record) | CRV-SOFA-0321 → CRV-SOFA-0340; CRV-SOFA-0322 → CRV-SOFA-0336; CRV-SOFA-0323 → CRV-SOFA-0335 | (3 retired) |
| Stale / expired | CRV-SOFA-0324, CRV-SOFA-0325 | 2 |
| Conflicting inputs | CRV-SOFA-0326 | 1 |
| Population gating (unknown age, under-age, exact 18) | CRV-SOFA-0327..CRV-SOFA-0329 | 3 |
| Invalid value/unit (FiO2 unitless, GCS out-of-range, platelet 0-sentinel) | CRV-SOFA-0330..CRV-SOFA-0332 | 3 |
| Sedation-confounded GCS | CRV-SOFA-0333 | 1 |
| Zero-is-a-value (anuria) | CRV-SOFA-0334 | 1 |
| Decision-driven (GDEC-0007): renal declared partial, untabulated-agent floor, provisional first hour, unknown-sedation fail-closed, missing-dose floors (derived, princípio 2) | CRV-SOFA-0335..CRV-SOFA-0341 | 7 |
| **Total active** | | **38** |

Every `fires: false` vector carries a non-null `no_fire_reason`; `criteria_not_met`
appears only with `expected_evaluation_status: valid` or the ratified renal declared
partial (`partial`, GDEC-0007 OQ-7). The LEGREV-SOFA-0001 §6 zero-coercion table rows
are all represented (CRV-SOFA-0317..0320, 0335, 0336, 0340, 0341); the §5 trilhas defects
(bilirubin 1.95, creatinine 5.0, FiO2 percent, platelet 0-sentinel) are all named
regression vectors (CRV-SOFA-0309, CRV-SOFA-0315, CRV-SOFA-0330, CRV-SOFA-0332).

*All values synthetic. No PHI. Authored by the RULE-SOFA spec author; independence NOT
satisfied; clinicamente revisado (GDEC-0007); evidência de execução pendente — nothing
here is release execution evidence.*
