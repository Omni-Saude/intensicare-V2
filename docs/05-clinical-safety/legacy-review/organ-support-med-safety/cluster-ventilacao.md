---
id: LEGREV-OSMS-CL-VENT
title: Legacy review — ventilacao rule cluster (26 rules) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule cluster ventilacao
  (26 rule records), with a per-rule disposition table under
  docs/00-governance/legacy-import-policy.md §4.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/*/RULE-VENTILACAO-*.md (26 files)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; rule files individually hashed in the cycle-1 pin manifest)
  section_or_lines: whole cluster; upstream citations inherit the records' own audit provenance (NL-1)
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy organ-support and medication-safety forensics reviewer (cycle 1, Task 1, wave 1b)
  transformation: every rule record read; verdicts are this reviewer's proposals
  confidence: high (record contents) / medium (dispositions)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0016, HAZ-0021]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Ventilacao rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Recurring cluster-wide hazard: **FiO2 unit chaos** — forms and validators
> declare FiO2 as percent (21-100: rules 018/019), while criterion C8 (rule
> 011) tests `fio2 < 0.4` (fraction) — if FiO2 is recorded as percent the
> extubation-readiness bundle can never fire its FiO2 member. The V1
> successor code enforces fraction (CANON_PINS; respiratory-ventilation-review.md).
> Legacy shard `ventilacao.yaml` proposes ADOPT 13 / ADAPT 8 /
> ADOPT-CORRECTED 1 / RETIRE 2 / SUPERSEDE 2 — more permissive than this
> review; delta for the named reviewer.

## Per-rule disposition table

| Rule ID | What it does (one line) | Verdict |
|---|---|---|
| RULE-VENTILACAO-001 | PBW (sex-specific Devine-style) + protective VT targets at 4/5/6 mL/kg (frontend calc) | VALIDATE — formula correct; non-"F" genders default to male base |
| RULE-VENTILACAO-002 | Days on mechanical ventilation from horario_inicio | VALIDATE |
| RULE-VENTILACAO-003 | C1: inspiratory pressure > 16 OR VT > 500 mL absolute; hard alert-forcing | REJECT — absolute VT threshold ignores PBW indexing; the protective standard is mL/kg PBW |
| RULE-VENTILACAO-004 | C2: PEEP not in FiO2→PEEP list + P/F 151-300; fio2 str-slice key bug; peep>0 guard malformed | REJECT — key-derivation bug (fraction FiO2 maps to "0.0") and malformed guard |
| RULE-VENTILACAO-005 | C3: PEEP not in severe FiO2→PEEP list + P/F < 150 | REJECT as implemented — same key-derivation family; table concept TRANSFORM |
| RULE-VENTILACAO-006 | Prior single-value FiO2→PEEP table (inactive) | REJECT — dead code |
| RULE-VENTILACAO-007 | C4 weaning consciousness: (long-VM bundle) OR RASS≥−2 OR GCS>8 | REJECT — OR structure lets RASS alone satisfy a "weaning readiness" flag; documented discrepancy |
| RULE-VENTILACAO-008 | C5 prolonged intubation: TOT > 10 days | VALIDATE |
| RULE-VENTILACAO-009 | C6 COVID prolonged intubation: TOT > 10 days AND COVID (documented intent 14) | REJECT — threshold contradicts the documented COVID policy |
| RULE-VENTILACAO-010 | C7: P/F < 150 + noradrenaline quantity < 25 + admission > 7 days | REFINE — absolute nora quantity unit-invalid; concept re-derivation |
| RULE-VENTILACAO-011 | C8 extubation-readiness bundle (GCS/RASS, days>1, PEEP≤8, FiO2<0.4, FR≤22, P/F≥200, no nora); hard alert-forcing | REJECT as implemented — FiO2 unit trap (impact high per the record); bundle re-derived in respiratory module |
| RULE-VENTILACAO-012 | C9 shock without ventilation: nora + lactate > 2.5 + no VM | VALIDATE |
| RULE-VENTILACAO-013 | C10 adequate oxygenation incl. COPD target (SatO2>96 / PO2>100 / COPD & >92) | VALIDATE — de-escalation prompt |
| RULE-VENTILACAO-014 | Manual pathway alert: VERMELHO if ≥3 criteria or C1/C8/C9; AMARELO if ≥1 | REJECT — count-as-severity with hard overrides |
| RULE-VENTILACAO-015 | v1 active alert (calcular_alerta_v2): amarelo {10,2,7}, vermelho {5}; NEUTRO resets assistido | REJECT — reduced criteria subset; assistido reset couples severity to acknowledgment |
| RULE-VENTILACAO-016 | v1 legacy alert variant, not called by save() | REJECT — dead code |
| RULE-VENTILACAO-017 | Ventilation/weaning facade protocol texts (protective VT 4 mL/kg, PEEP tables, TQT timing, PRONA 16-20 h, O2 targets incl. COPD 88-92%) | VALIDATE — clinically recognizable ARDSnet/PROSEVA-consistent text; wording review required |
| RULE-VENTILACAO-018 | Ventilator parameter validation ranges (FiO2 21-100, PEEP 0-40, PIns 0-30, VT 0-1500, FR 0-50) | VALIDATE — as capture bounds, with the FiO2-percent convention made explicit |
| RULE-VENTILACAO-019 | Physician ventilation decision tree (invasive params vs O2 flow) | VALIDATE |
| RULE-VENTILACAO-020 | Physiotherapy ventilation tree with PEEP 5-18 / PIns 5-40 ranges diverging from other forms | REFINE — reconcile divergent ranges |
| RULE-VENTILACAO-021 | Supplemental O2 flow bounds 1-15 L/min | VALIDATE |
| RULE-VENTILACAO-022 | PEEP model bounds 5-18 cmH2O (homecare) | REFINE — excludes clinically real values outside 5-18 |
| RULE-VENTILACAO-023 | Inspiratory pressure bounds 5-40 (homecare) — vs 0-30 in movimentacao form | REFINE — cross-form divergence |
| RULE-VENTILACAO-024 | Free-text ventilation-mode bucketing lists incl. misspellings ("estpotanea", "ar ambienten") | REJECT — misspelling-driven classification of a safety-relevant state |
| RULE-VENTILACAO-025 | Ventilation/device/modality enums; deactivated options; frontend copy omits some; label 'vm_invasiva' maps to "Cateter Nasal de O2" | REFINE — value/label mismatch must be fixed before any reuse |
| RULE-VENTILACAO-026 | Nursing secretion/cough/chest-tube assessment enums | VALIDATE |

## Tally

VALIDATE 10 · REJECT 11 · REFINE 5 (= 26).
Dominant defect families: FiO2 percent-vs-fraction chaos, absolute (non-PBW)
volume/pressure thresholds, FiO2→PEEP table key-derivation bugs, and
free-text/misspelt classification of ventilation modes. The clinically sound
members (Berlin bands, PBW math, protocol texts) are already re-derived in
`domain_respiratory.py`/`respiratory.yaml`.
