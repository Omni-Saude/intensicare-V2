---
id: LEGREV-PATH-VENTILACAO
title: Legacy pathway review — Ventilação Mecânica (ventilacao.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 "Ventilação Mecânica" pathway definition. It is the
  stub the legacy assessment named (candidate-inventory 1.1d): two criteria, two states,
  no description, and the only two rationale records in the entire portfolio. Proposed
  verdict REJECT as a pathway (Berlin P/F cut-points themselves are sound).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/ventilacao.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (71 lines); SHA-256 d1c48956f19eb55633f034cd800b05ed35004664864942f75533e1635a6fd8d3 (pin manifest)
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: read in full; thresholds tabulated verbatim; verdict proposed
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0043]
supersedes: null
superseded_by: null
---

# Ventilação Mecânica (`ventilacao`) — legacy review

## 1. Identity and structure

OBSERVED (`ventilacao.yaml:2-7`): id 1, slug `ventilacao`, version `3.0.0`,
content_hash declared `sha256:b40df6ec...` (verified: matches the hash computed over
the file excluding the `content_hash` field itself — see `engine-review.md` §6).
2 inputs, 2 criteria (1 graded band set + 1 threshold), 2 states, suppression
cooldown 30 min / rate limit 4 per hour / dedup `[mpi_id, criteria_id]`.

**This is the stub the legacy assessment named** (candidate-inventory 1.1d,
CAND-0005). OBSERVED: it is the only pathway with **no `pathway.description`**, no
criterion `description` fields, and no state `description` fields. It is also the only
pathway with `rationale` records (2 — the entire portfolio's rationale coverage).

## 2. Clinical intent and target condition

OBSERVED: the YAML itself states no intent (no description). The seed catalog
(`src/intensicare/services/trilhas_definitions.py:33-38`, SHA-256
`3425e844fbec012a67a60779ca30fd5af0b8d1c517051684ae5f5a1ebe2baabe`) describes the same
pathway id 1 as: "Acompanhamento de pacientes em ventilação mecânica invasiva.
Monitora parâmetros ventilatórios, oxigenação e mecânica pulmonar…" — but the seed
version has **5 criteria** (P/F, PEEP, tidal volume, plateau pressure, driving
pressure) and 5 states, while the YAML that the engine actually loads has 2 criteria
and 2 states, and the YAML **overrides** the seed at load time
(`trilhas_definitions.py:573-604`, "Duplicate pathway IDs from YAML override seeds").
INFERENCE: the loaded pathway silently monitors far less than its own catalog text
promises — a patient "on the ventilation pathway" is monitored for P/F and PEEP only.

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: the YAML contains no inclusion or enrollment logic; the pathway schema has no
enrollment section. Enrollment is a manual API action persisted by
`pathway_enrollment.enroll_patient` (starts at state `initial`, severity `normal` —
`pathway_enrollment.py:163-205`). Eligibility checking is advisory only:
`domain_trilhas_engine.check_pathway_eligibility` Rule 15 (`domain_trilhas_engine.py:248-269`,
SHA-256 `6dca0013e99a6db21bf92303062bf033c40314a0c79c999896eea3aa04cadd56`) requires
patient-data keys intersecting `{oxigenacao, pf_ratio, PaO2_FiO2, crit-vent-pf}` AND
`{parametros, peep, vc, plat, drive}`; verbatim, with **no** patient_data it returns
`eligible=True` — "Verificação automática indisponível (sem dados do paciente).
Elegibilidade presumida — requer avaliação clínica." (`domain_trilhas_engine.py:235-240`).

## 4. Inputs (verbatim)

| name | source | unit | note |
|---|---|---|---|
| `pf_ratio` | amh_gold | mmHg | no description |
| `peep` | amh_gold | cmH2O | no description |

OBSERVED: neither input is fed by the auto-evaluation input builder
(`pathway_auto_evaluation._build_generic_vitals_inputs`, lines 113-158, provides only
pam/fc/fr/temp/spo2/vasopressor_dose/creatinina/debito_urinario/rass_score). An
enrolled patient's ventilation criteria are therefore **never auto-evaluated**; they
change only via manual PUT.

## 5. Criteria, band sets, thresholds (verbatim, `ventilacao.yaml:19-51`)

**crit-vent-pf — Relação PaO₂/FiO₂** (graded, unit mmHg):

| Range | Severity | Score |
|---|---|---|
| [0, 100) | critical | 3 |
| [100, 200) | urgent | 2 |
| [200, 300) | watch | 1 |
| [300, +inf) | normal | 0 |

rationale (verbatim): `graded(pf_ratio [0, 100)=critical(3) [100, 200)=urgent(2) [200, 300)=watch(1) [300, +∞)=normal(0) unit=mmHg)`

**crit-vent-peep — PEEP** (threshold): `peep >= 5 cmH2O`; rationale (verbatim):
`peep >= 5 cmH2O`. When met, the compiler assigns hard-coded severity `urgent`,
score 1 (`trilhas_compiler.py:545-546`).

States: `initial` (order 0) → `alta` (order 1, terminal). No intermediate clinical
states; one all-criteria-met evaluation completes the pathway (see `engine-review.md` §5).

## 6. Timing / cadence

Declared `evaluation.mode: hybrid` (`ventilacao.yaml:10`). OBSERVED: the mode field is
loaded (`trilhas_engine.py:315`) but consumed by no scheduler; actual evaluation
occurs only best-effort after vitals ingestion (`services/vitals.py:416`, SHA-256
`dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64`) and on manual
criteria PUT — and per §4, the vitals hook can never source these inputs.

## 7. Missing-data behavior (HAZ-0005 lens)

- Absent `pf_ratio` or `peep` in patient_data → `KeyError` in
  `trilhas_compiler._lookup` (line 724-728) → criterion silently skipped at DEBUG
  level (`trilhas_evaluator.py:388-397`) → zero firings → `overall_severity="normal"`
  (`trilhas_evaluator.py:472-481`). **A never-measured patient is indistinguishable
  from a verified-normal patient.** Tested as intended:
  `tests/test_trilhas_evaluator.py:437-449` (SHA-256
  `dbb8409f9300653e8d6bda746a1940e694e910de2e590302d82045777a5cc574`, hashed by
  reviewer — absent from pin manifest).
- Non-numeric `pf_ratio` → graded evaluation returns `met=False, severity=normal`
  (`trilhas_compiler.py:565-575`) — invalid input coerced to normal.
- Enrollment severity: unevaluated criteria are excluded and an all-pending enrollment
  reads `normal` (`pathway_enrollment._determine_severity`, lines 684-782).
- INFERENCE (HAZ-0043 shape): because neither input is auto-sourced, an enrolled
  ventilation pathway runs permanently unevaluated while being displayed as an active
  pathway at severity `normal`.

## 8. alert_groups

Absent (schema forbids the key; see `pathway-index.md` §3). Not covered by the
vector-coverage gate. No test vectors exist for this pathway.

## 9. Guideline anchoring

OBSERVED (`ventilacao.yaml:68-70`): `guideline: "ARDSNet Protocol (2000), PROSEVA
(2013)"`, `doi: 10.1056/NEJM200005043421801`. Crossref (2026-08-15): that DOI resolves
to "Ventilation with Lower Tidal Volumes as Compared with Traditional Tidal Volumes
for Acute Lung Injury and the Acute Respiratory Distress Syndrome", N Engl J Med 2000
(the ARDSNet ARMA trial) — **MATCH**. PROSEVA (Guérin et al., prone positioning,
NEJM 2013) is named without a DOI.

INFERENCE — agreement of implemented values with the anchor: the P/F bands 300/200/100
reproduce the Berlin definition's mild/moderate/severe ARDS cut-points exactly, and
`peep >= 5` matches the Berlin definition's minimum-PEEP condition. However, the cited
ARMA trial is about tidal volume and plateau pressure — neither of which this pathway
monitors (they exist only in the superseded seed catalog). The citation anchors the
*domain*, not the *content*. No recommendation content exists (`evidence.recommendations`
absent — unique among the twelve).

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): REJECT** as a
pathway definition. Rationale: it is a stub — two parameters cannot represent
mechanical-ventilation surveillance, and its own seed-catalog description promises
five-parameter lung-protective monitoring the loaded definition does not perform
(silent capability shrinkage; HAZ-0043/PH-05 shape). The Berlin P/F cut-points and
minimum-PEEP idea are sound and should re-enter, if at all, through a V2-native,
clinically owned respiratory/weaning specification (see `desmame-review.md`,
`respiratorio-review.md`). Not DECIDED; import blocked until `legacy-import-policy.md`
§3 items 1-8 are satisfied.
