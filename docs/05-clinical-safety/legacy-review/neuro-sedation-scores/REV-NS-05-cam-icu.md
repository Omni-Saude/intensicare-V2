---
id: REV-NS-05
title: Legacy review — CAM-ICU / delirium screening logic
label: PROPOSAL
statement: >
  V1 implements the correct CAM-ICU boolean algebra (F1 AND F2 AND (F3 OR F4)) and a correct
  deep-sedation gate (RASS <= -4 -> not assessable) in the sedation service, but the parallel
  clinical-forms path defaults absent features to a negative screen and only blocks at RASS
  exactly -5; the alert-runner module is unimportable dead code and one catalog citation is
  wrong. Verdict: REFINE overall; forms path REJECT.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_formularios.py; _work/alerts/pathways/delirium.yaml; docs/plan/_work/alerts/neuro-sedation.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (per-file SHA-256 in §1; MATCH against legacy-pin-cycle-1.md unless noted)
  section_or_lines: cited per finding
  date_collected: 2026-08-15
  collector: legacy neuro/sedation instrument forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002]
  hazards: [HAZ-0005, HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# REV-NS-05 — CAM-ICU / delirium logic

## 1. As implemented (OBSERVED, verbatim)

| Path | Lines | SHA-256 | Manifest |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 1-24, 47-68, 162-211, 268-291, 556-613 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 46-63, 110-165, 487-490, 700-725 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `src/intensicare/models/sedacao.py` | 40-47 | `b790b4b0e7be1550f7b5276a9ec8f1504b056b7db8f668a063f79913dd419c8b` | MATCH |
| `src/intensicare/schemas/sedacao.py` | 13-28 | `bd432d9a5b4144380eaed1c6518b10465612c95d9d7e33468053114e0e44992d` | MATCH |
| `_work/alerts/pathways/delirium.yaml` | 17-41, 91-114 | `571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208` | MATCH |
| `docs/plan/_work/alerts/neuro-sedation.yaml` | ALERT-NEUROSED-DELIRIUM-04, -SCREEN-GAP-05 blocks | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` | ABSENT (hash-noted) |
| `docs/rules/clinical-scoring/RULE-EFICIENCIA-010-…md` | whole file | `28c5207f984644b194724b51bf844ff5775b25d0be819591dc0c308bd39dd74a` | MATCH |
| `tests/test_domain_sedacao.py` | CAM-ICU + deep-sedation-gate suites | see README §4 | ABSENT (hash-noted) |

### 1.1 Sedation-service algorithm (`domain_sedacao.py`)

- `_evaluate_cam_icu` (`:162-211`), verbatim core:
  `is_positive = f.inicio_agudo and f.desatencao and (f.pensamento_desorganizado or
  f.nivel_consciencia_alterado)` — i.e. Feature 1 AND Feature 2 AND (disorganized thinking
  OR altered LOC).
- **Deep-sedation gate** (`:271-291` and `evaluate_cam_icu_batch:575-590`): if
  `rass_score <= -4`, CAM-ICU is not evaluated — `cam_icu_positive = None`,
  `cam_icu_assessable = False`, recommendation "Paciente profundamente sedado (RASS <= -4).
  CAM-ICU não avaliável. Reavaliar após redução da sedação." Tests assert this
  (`tests/test_domain_sedacao.py`, deep-sedation-gate suite).
- Feature numbering: V1 labels Feature 3 = altered LOC and Feature 4 = disorganized
  thinking (flowsheet convention); the algebra is identical to the published rule either
  way. The module **docstring** (`:16-23`) also asserts "(Feature 1 OR Feature 2) AND
  Feature 3 AND Feature 4" as the "Standardized approach (PADIS 2018 / SCCM)" — that
  formula is wrong; the code does not implement it. Comment/code divergence only.
- Missing features in `_evaluate_cam_icu` default to `False`
  (`:194-199`; test "Missing CAM-ICU feature keys default to False") — an empty dict
  evaluates to a **negative** screen. Gate applies only when `rass_score` is provided; with
  `rass_score=None` and features present, CAM-ICU is evaluated ungated (`:274`).
- Feature 3 ("altered LOC = current RASS != 0", schema note `schemas/sedacao.py:20-22`) is
  accepted as an independent caller-supplied boolean; it is never derived from or checked
  against the submitted RASS.

### 1.2 Clinical-forms path (`domain_formularios.py`)

- `_calculate_cam_icu` (`:700-725`): same algebra; **absent features default `False` → 0.0
  → severity "delirium_negativo"** (`:487-490`) — a persisted negative screen from absent
  data.
- Cross-field invariant (`:110-134, 156-165`): CAM-ICU submission is blocked **only when the
  latest RASS equals exactly -5.0** (`blocking_value: -5.0, blocking_condition: "eq"`). A
  RASS -4 patient can receive a scored CAM-ICU via this path — contradicting both the
  published instrument and V1's own sedation-service gate.

### 1.3 Pathway and catalogs

- `delirium.yaml:31-41`: criterion `crit-del-cam` is `boolean cam_icu == true`; there is no
  `nao_avaliavel` state at pathway level, and a missing input simply never fires (silent
  no-fire). States: CAM-ICU-positive drives `delirium_identificado`; resolution requires
  ">48h negative" (`:98-114`).
- `docs/plan/_work/alerts/neuro-sedation.yaml` (planning catalog): models CAM-ICU as enum
  `{positivo, negativo, nao_avaliavel}` with an explicit boundary vector "unassessable is
  NOT positive; no fire, but feeds SCREEN-GAP cadence clock", plus a >24h screening-gap
  alert (hypoactive-delirium surveillance). **Citation defect**: it cites "Ely EW et al.
  NEJM 2001;345(14):1013-1020" for CAM-ICU validity — the validity/reliability study is
  JAMA 2001;286(21):2703-2710 (verified 2026-08-15). This catalog is loaded only by the
  dead runner (§1.4).
- Predecessor delirium risk bundle RULE-EFICIENCIA-010: ad-hoc OR of PRE-DELIRIC-like risk
  factors; unwired and contains a crash (`int(rass) in range[1, 5]` — TypeError) and an
  unsatisfiable pain sub-block. Documented so it is not re-proposed.

### 1.4 Dead code path

`domain_pharmaco_delirium.py` (runner for the delirium catalog and the integrated
RASS/CAM-ICU evaluator) imports `maezo.rules.alert_compiler`; no `maezo` package exists
anywhere in the repository. The legacy repo's own `pyproject.toml:240-246` and `:305-334`
(SHA-256 `716a9354b75face954281e215ee8f21d2d895cbab2ab2a31b159d561a2c4d800`, absent from
manifest, hash-noted) state this verbatim and exclude the tests. Everything in §1.3's
planning catalog is therefore **non-executing**.

## 2. Published instrument (SOURCE)

- Ely EW et al. *Delirium in mechanically ventilated patients: validity and reliability of
  the Confusion Assessment Method for the intensive care unit (CAM-ICU).* JAMA.
  2001;286(21):2703-2710. Delirium = acute onset/fluctuating course AND inattention AND
  (disorganized thinking OR altered level of consciousness); patients unarousable to voice
  (RASS -4/-5) are not assessable — reassess later.
- Ely EW et al. *Evaluation of delirium in critically ill patients: validation of the
  CAM-ICU.* Crit Care Med. 2001;29(7):1370-1379.
- Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — routine CAM-ICU (or
  ICDSC) screening; RASS-first assessment sequence.

## 3. Discrepancy analysis

| Dimension | Finding | Label |
|---|---|---|
| Algorithm | Boolean algebra matches Ely 2001 in both implementations. Feature-numbering label swap is cosmetic; the docstring's alternative formula is wrong but not executed. | OBSERVED |
| Assessability gate | Sedation service: RASS ≤ -4 → not assessable (**matches published**). Forms path: blocks only RASS == -5 (**deviates** — RASS -4 must also be unassessable). Two contradictory gates for one instrument. | OBSERVED |
| Missing-data | Both evaluators default absent features to False → negative screen. A negative produced from no data is indistinguishable from a true negative in the persisted record (`cam_icu_positive=False`). | OBSERVED |
| Enumeration | Persistence is boolean/None (`models/sedacao.py:40-44`); the three-state clinical reality (positive/negative/not-assessable) is only representable as None, which also means "not attempted". The planning catalog's `{positivo, negativo, nao_avaliavel}` enum is the correct shape but dead. | OBSERVED / INFERENCE |
| Internal consistency | Feature 3 not cross-checked against RASS; pathway has no unassessable state; catalog citation error (NEJM vs JAMA). | OBSERVED |
| Population | CAM-ICU is adult-validated (paediatric equivalents psCAM-ICU/pCAM-ICU are distinct instruments); no age gating → VAL-0006/0007, HAZ-0036. | INFERENCE |

## 4. HAZ-0005 zero-coercion check (from source)

**MIXED.** Conformant: the RASS ≤ -4 gate returns `None` + "não avaliável" rather than a
value (the single best missing-data behaviour found in this whole cluster). VIOLATION:
absent features → `False` → "delirium_negativo" (forms path persists it; sedation service
evaluates an empty feature set to a negative); pathway-level missing input → silent no-fire
with no recorded reason (P-5); RASS-unaccompanied CAM-ICU evaluated ungated.

## 5. Verdict

**REFINE** overall — the sedation-service algorithm and its deep-sedation gate are correct
and worth carrying as the V2 reference semantics, extended to a first-class three-state
result ({positive, negative, not_assessable}) with the gate at RASS ≤ -4 enforced at every
entry point. **REJECT** the forms path's RASS==-5-only block and every absent-features →
negative default (absent features = `not_evaluated`). Fix the JAMA citation. The dead
runner module is superseded by whatever V2 alerting architecture is decided (cross-ref
REV-NS-09).

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
