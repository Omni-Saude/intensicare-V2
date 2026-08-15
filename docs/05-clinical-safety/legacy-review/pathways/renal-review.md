---
id: LEGREV-PATH-RENAL
title: Legacy pathway review — Função Renal / AKI (renal.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 renal/AKI pathway. Bands are absolute-creatinine
  values mislabeled as KDIGO stages (KDIGO 2012 staging is baseline-relative); the
  auto-evaluation wiring feeds the mL/kg/h urine-output band set from a column named
  urine_output_ml_day, making oliguria detection structurally false-normal. Proposed
  verdict TRANSFORM.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/renal.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (153 lines); SHA-256 a052e6c26835e3c7c8ade5e62ed7272b779edf95cfd47c6a3105fc3d90db4153 (pin manifest)
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: read in full; thresholds tabulated verbatim; verdict proposed
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0032, HAZ-0043]
supersedes: null
superseded_by: null
---

# Função Renal / AKI (`renal`) — legacy review

## 1. Identity and structure

OBSERVED (`renal.yaml:3-10`): id 10, slug `renal`, name "Função Renal / AKI", version
`3.0.1`, active. 3 inputs, 3 criteria (all graded → 3 band sets, 12 band rows),
5 states, suppression cooldown 30 min / rate limit 4 per hour.

Version note (`renal.yaml:14-15`, verbatim comment): "NOTA: trs_status removido
(órfão — critério que o consuma pendente de autoria clínica…)" — an input for renal
replacement therapy was removed as an orphan because **no clinician ever authored the
criterion that would consume it**. OBSERVED: this is direct evidence of absent
clinical authorship in the definition lifecycle.

## 2. Clinical intent and target condition

SOURCE (`renal.yaml:9`, verbatim): "Monitorização da função renal e prevenção de lesão
renal aguda (AKI) conforme diretrizes KDIGO. Avaliação de creatinina, débito urinário,
estadiamento KDIGO e indicação de terapia renal substitutiva (TRS)." — renal-function
monitoring and AKI prevention per KDIGO; creatinine, urine output, KDIGO staging, RRT
indication. Target condition: acute kidney injury in ICU patients.

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML (the schema has no enrollment section). Enrollment is
manual via `pathway_enrollment.enroll_patient` (state `initial`, severity `normal`).
`check_pathway_eligibility` has no `renal` branch (Rules 15-18 cover only
ventilacao/sepse/desmame/nutricao); a renal eligibility check falls through to the
generic branch and, with no overlapping keys, returns verbatim `eligible=True` —
"Sem contraindicações automáticas identificadas. Elegível mediante avaliação clínica."
(`domain_trilhas_engine.py:359-362`).

## 4. Inputs (verbatim)

| name | source | unit | description (summarized) |
|---|---|---|---|
| `creatinina` | amh_gold | mg/dL | serum creatinine; "critério KDIGO para AKI" |
| `debito_urinario` | amh_gold | **mL/kg/h** | hourly urine output per kg; "Oligúria é critério KDIGO" |
| `kdigo_stage` | amh_gold | stage | externally computed KDIGO stage (0-3) |

Auto-sourcing (OBSERVED, `pathway_auto_evaluation.py:113-158`, SHA-256
`c23a7b427f224c910cd8f234ed7fe6bf0e2e854b521550b04122301e3c71028d`): `creatinina` is
fed from `VitalSign.creatinine`; **`debito_urinario` is fed from
`VitalSign.urine_output_ml_day`** (line 151-152) — a per-DAY milliliter quantity
assigned to an input whose band set is calibrated in **mL/kg/h**. `kdigo_stage` has no
auto source (never auto-evaluated).

## 5. Criteria, band sets, thresholds (verbatim, `renal.yaml:30-107`)

**crit-renal-creatinina — Creatinina Sérica** (graded, mg/dL). Description quotes the
real KDIGO trigger ("Aumento >=0.3 mg/dL em 48h ou >=1.5x basal define AKI (KDIGO
2012)") — but the predicate implements absolute bands:

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 1.2) | normal | 0 | "Função renal normal" |
| [1.2, 2.0) | watch | 1 | "Disfunção renal leve" |
| [2.0, 4.0) | urgent | 2 | "AKI moderada — KDIGO 2" |
| [4.0, +inf) | critical | 3 | "AKI grave — KDIGO 3 / risco de TRS" |

**crit-renal-debito — Débito Urinário** (graded, mL/kg/h):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 0.3) | critical | 3 | "Anúria — emergência nefrológica" |
| [0.3, 0.5) | urgent | 2 | "Oligúria — AKI oligúrica" |
| [0.5, 1.0) | watch | 1 | "Diurese reduzida — vigilância" |
| [1.0, +inf) | normal | 0 | "Diurese adequada" |

**crit-renal-kdigo — Estadiamento KDIGO** (graded, stage): [0,1) normal, [1,2) watch
"KDIGO 1", [2,3) urgent "KDIGO 2", [3,+inf) critical "KDIGO 3".

States: `initial` → `vigilancia` → `aki` → `recuperacao` → `alta` (terminal). Note
(engine-wide, `engine-review.md` §5): state advancement requires ALL criteria met,
and "met" for graded criteria is inverted to "severity==normal" by the auto-evaluation
adapter — so the state machine walks toward `alta` when values are normal, while the
state names (`aki`, `recuperacao`) imply a clinical course. The two readings are
incompatible; neither is documented as intended.

## 6. Timing / cadence

Declared `evaluation.mode: near-real-time` (`renal.yaml:13`). OBSERVED: the mode is
dead metadata (no consumer); actual cadence is the best-effort vitals-ingestion hook
plus manual PUT. Suppression: cooldown 30 min, rate limit 4/h, dedup
`[mpi_id, criteria_id]`.

## 7. Missing-data behavior (HAZ-0005 lens) — and the unit hazard

- Absent `creatinina`/`debito_urinario`/`kdigo_stage` → criterion silently skipped
  (`trilhas_evaluator.py:388-397`) → no firing → `overall_severity normal`. An
  unmeasured-creatinine patient reads identically to a normal-creatinine patient.
- **Unit-mismatch false-normal (OBSERVED, decisive):** the auto-evaluation feeds
  `debito_urinario` from `urine_output_ml_day` (mL/day). Any daily output of 1 mL or
  more lands in band [1.0, +inf) = "Diurese adequada"/normal. A profoundly oliguric
  patient at, e.g., 100 mL/day therefore evaluates **normal**; only an absolute 0
  would read critical. Oliguria detection via the auto path is structurally
  impossible. (Predicate: `renal.yaml:57-81`; wiring:
  `pathway_auto_evaluation.py:151-152`; band lookup: `trilhas_compiler.py:577-604`.)
  The engine performs no unit checking at evaluation time — `unit` strings are
  metadata validated only by CI Gate A against a string registry
  (`scripts/validate_alerts.py:62-87`).
- `kdigo_stage` is upstream-computed with no populated source identified; INFERENCE
  (HAZ-0043 shape): the staging criterion runs permanently unevaluated and silent.
- Non-numeric values → `met=False, severity normal` (`trilhas_compiler.py:565-575`).

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors exist for this pathway.

## 9. Guideline anchoring

OBSERVED (`renal.yaml:145-147`): `guideline: "KDIGO Clinical Practice Guideline for
Acute Kidney Injury (2012); ADQI Consensus on AKI Biomarkers (2020)"`,
`doi: 10.1038/kisup.2012.1`. Crossref (2026-08-15): the DOI resolves to "Notice",
Kidney International Supplements 2012 — the front matter of the KDIGO AKI supplement,
not the guideline body — **PARTIAL** match (correct publication vehicle, imprecise
target). ADQI 2020 is named without a DOI.

INFERENCE — where implemented values agree/disagree with the authoritative anchor
(KDIGO AKI 2012, the anchor the YAML itself names). **Clearly labeled inference; not
what V1 validated:**

- **Disagree (material):** KDIGO stages are defined *relative to baseline creatinine*
  (stage 1: 1.5-1.9x baseline or +0.3 mg/dL in 48h; stage 2: 2.0-2.9x; stage 3: >=3.0x
  or >=4.0 mg/dL with qualifiers, or RRT). The implemented bands are absolute
  (1.2/2.0/4.0 mg/dL) yet their labels claim KDIGO stages. A patient with baseline
  0.6 mg/dL rising to 1.9 mg/dL (>3x — KDIGO 3) reads "watch/Disfunção renal leve";
  a patient with stable chronic creatinine 2.5 reads "urgent/AKI moderada — KDIGO 2"
  with no injury at all. The description text and the predicate contradict each other
  inside the same criterion.
- **Disagree (material):** KDIGO urine-output criteria carry mandatory durations
  (<0.5 mL/kg/h for 6-12 h, etc.). The band set evaluates an instantaneous value with
  no duration logic (the engine's temporal predicate exists but is not used here).
- **Agree:** the numeric cut-points 0.3/0.5 mL/kg/h and the stage-severity mapping
  (1→watch, 2→urgent, 3→critical) are directionally consistent with KDIGO.
- The correct authoritative anchor for a V2 successor is KDIGO AKI 2012 (Kidney Int
  Suppl 2012;2(1):1-138) with baseline-relative staging and duration-qualified
  urine-output criteria. This is a PROPOSAL for V2 authorship, not a claim about V1.

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): TRANSFORM.**
Rationale: the intent (KDIGO-anchored AKI surveillance) is clinically valuable and the
YAML names the right authority, but the staging logic misrepresents KDIGO (absolute
bands labeled as stages), the urine-output criterion lacks KDIGO's duration semantics,
and the only live data wiring feeds it in the wrong unit. The definition must be
rebuilt baseline-relative with duration-qualified oliguria and typed units — only the
concept survives. Not DECIDED; import blocked until `legacy-import-policy.md` §3 is
satisfied.
