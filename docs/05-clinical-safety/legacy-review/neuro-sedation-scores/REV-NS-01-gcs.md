---
id: REV-NS-01
title: Legacy review — Glasgow Coma Scale (capture, computation, downstream consumers, sedation/intubation confounding)
label: PROPOSAL
statement: >
  V1 captures GCS as a nullable 3-15 integer, computes it in the forms engine by coercing
  untested E/V/M components to their minimum, feeds it to SOFA CNS and qSOFA with
  missing-scores-zero semantics, and has no representation whatsoever for
  "verbal-not-testable" (intubation) or sedation-confounded GCS. Verdict: TRANSFORM.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_formularios.py; src/intensicare/services/sofa.py; src/intensicare/services/qsofa.py; src/intensicare/models/vital_sign.py; src/intensicare/schemas/vitals.py
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (per-file SHA-256 in §1 table; all MATCH docs/archive/legacy-provenance/legacy-pin-cycle-1.md unless noted)
  section_or_lines: cited per finding below
  date_collected: 2026-08-15
  collector: legacy neuro/sedation instrument forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003]
  hazards: [HAZ-0005, HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# REV-NS-01 — Glasgow Coma Scale

## 1. As implemented (OBSERVED, verbatim)

Sources (paths relative to `/Users/familia/intensicare/`; manifest status per cycle-1 pin):

| Path | Lines | SHA-256 | Manifest |
|---|---|---|---|
| `src/intensicare/models/vital_sign.py` | 49 | `4a145e9b4135fd943043d96c5efe3a3981f84053f78710b0f6fe66bd126d4a12` | MATCH |
| `src/intensicare/schemas/vitals.py` | 73 | `f6afffd444038f2d1dec19d7047a0013f908d9a7106c52ce9895cbc1ba14308f` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 75-84, 131-133, 611-626, 731-765 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `src/intensicare/services/sofa.py` | 86-90, 343-369, 487-489 | `731b3507cc07b2d5318f4759229527d2eac1f45b62eba269168d43560739b84a` | MATCH |
| `src/intensicare/services/qsofa.py` | 28, 101-115, 148-158 | `48b69f39f7b789c5f12f005931c9d02cc9b8da562c9aecee804d594530bab8ce` | MATCH |
| `src/intensicare/services/domain_piora_clinica.py` | 335-351, 422-440 | `ca8cbe35c00a8390a2d963ca5af9f235f0f454bf87c406cb5646d27d04221994` | MATCH |
| `src/intensicare/api/v1/deterioration.py` | 108, 123 | `6a0c3bd1a14947f203be56bd0d2a678ab4d7870730f43816ab18c678154ce7f7` | MATCH |
| `src/intensicare/services/domain_respiratory.py` | 336-415, 747-778 | `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` | MATCH |
| `src/intensicare/services/ews_nrt_runner.py` | 403-406 | `9ad826e9e31be584a17285a721697243e8654d9209ca68b9abec1230ed3c7fe6` | MATCH |
| `src/intensicare/services/domain_trilhas_engine.py` | 297-316 | `6dca0013e99a6db21bf92303062bf033c40314a0c79c999896eea3aa04cadd56` | MATCH |
| `src/intensicare/services/sepsis_input_provider.py` | 215-216 | `650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb` | MATCH |
| `src/intensicare/services/domain_sepsis.py` | 248-261 | `853d2e38a8167d28e7eb242872e871024abe00b4868fc22f7c02502f99d3ccf8` | MATCH |
| `_work/alerts/pathways/desmame.yaml` | 23-26, 85-105 | `808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a` | MATCH |
| `_work/alerts/schema/pathway.schema.json` | 156 | `68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-013-…md` | whole file | `9e47872ed70d2411ea06cb3ab5ba42cca24b14e9e3d78efd3c92ef3b696656ea` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-006-…md` | whole file | `66750c00b709c23a5f18872d72160bc0bb72216f60f51b44ab0b43437a87eef0` | MATCH |
| `docs/rules/clinical-scoring/RULE-SINAIS-VITAIS-011-…md` | whole file | `5041e6afbb5ae8556030e7f109550d9a24d65a54a329c1264fd64df3f94ce0ad` | MATCH |
| `tests/test_sofa.py`, `tests/test_qsofa.py` | missing-input vectors | see README §4 | ABSENT (hash-noted) |

### 1.1 Capture

- `models/vital_sign.py:49` — `gcs: Mapped[int | None] = mapped_column(Integer)` — nullable,
  **no DB-level range constraint**, total score only (no E/V/M columns).
- `schemas/vitals.py:73` — `gcs: int | None = Field(None, ge=3, le=15, …)` — API ingestion
  validates 3-15 inclusive; `None` allowed. No zero-sentinel is accepted in the V1 API
  (unlike the predecessor's `GlasgowValidator`, which exempted 0 as "not measured" —
  RULE-SINAIS-VITAIS-011).

### 1.2 Forms-engine computation (`domain_formularios.py:731-753`)

```text
o = max(1, min(4, int(ocular)))  if ocular  is not None else 1
v = max(1, min(5, int(verbal)))  if verbal  is not None else 1
m = max(1, min(6, int(motora)))  if motora  is not None else 1
return float(o + v + m)
```

Docstring, verbatim (line 739): *"If any component is missing, scores minimum for that
component."* Severity bands (`_glasgow_severity`, lines 756-765): `>=13 leve`,
`>=9 moderado`, `>=6 grave`, else `muito_grave`.

### 1.3 Downstream consumers of GCS (the confounding propagation surface)

| Consumer | Code path | Behaviour with a value | Behaviour when missing |
|---|---|---|---|
| SOFA CNS | `sofa.py:343-369` (`15→0, 13-14→1, 10-12→2, 6-9→3, <6→4`) | matches Vincent 1996 bands exactly | `(0, "missing")` → contributes 0 to total; `"gcs"` appended to `missing_components` (`sofa.py:487-489`) |
| SOFA (forms path) | `domain_formularios.py:611-626` | same bands | component silently skipped → contributes 0, **no missing metadata at all** |
| qSOFA mentation | `qsofa.py:101-115` (`GCS<15 → 1`) | matches Sepsis-3 | `(0, "missing")` → contributes 0; listed in `missing_criteria` (`qsofa.py:148-158`) |
| qSOFA recompute in deterioration | `domain_piora_clinica.py:341-351` | same | each missing input contributes 0 with no marker |
| Deterioration criterion "Queda de GCS ≥2/24h" | `domain_piora_clinica.py:422-440` | `GCS<=8 → critical`; `ΔGCS<=-2/-3 → alert/critical` | `(False, "normal", "sem dados de GCS")` — **status literal "normal"** |
| Deterioration API feed | `api/v1/deterioration.py:108,123` | `"glasgow": vital.gcs` | `"glasgow_24h_ago": None` is **hard-coded** — the Δ-branch is structurally unreachable via this route |
| Weaning readiness | `domain_respiratory.py:389-391` (`GCS>=10` gate), `:771-778` (`GCS>8 OR RASS>=-2`) | conjunctive gate | `None` → criterion fails → NOT ready (conservative direction) |
| Desmame pathway | `desmame.yaml:85-105` — bands `[11,∞) normal / [9,11) watch / [0,9) critical` (lower-inclusive/upper-exclusive per `pathway.schema.json:156`) | GCS ≥11 adequate | band floor 0 silently admits the impossible values 0-2 into "critical" |
| Trilhas eligibility | `domain_trilhas_engine.py:297-316` | needs neuro or mechanics data | missing → `eligible=False` with an explicit pt-BR reason (honest not-evaluated pattern) |
| Step-down readiness | `ews_nrt_runner.py:403-406` | `GCS>=14` | `None` → failure `"GCS unavailable"` (fail-safe, explicit) |
| Sepsis inputs | `sepsis_input_provider.py:215-216`; `domain_sepsis.py:248-261` | passes `glasgow` only when present | absent key → qSOFA missing-as-zero downstream |

## 2. Published instrument (SOURCE)

- Teasdale G, Jennett B. *Assessment of coma and impaired consciousness: a practical scale.*
  Lancet. 1974;2(7872):81-84. Total = eye (1-4) + verbal (1-5) + motor (1-6); range 3-15.
- Current structured-assessment guidance: glasgowcomascale.org (Teasdale et al., the Glasgow
  structured approach; see also Teasdale G et al., *The Glasgow Coma Scale at 40 years*,
  Lancet Neurol. 2014;13(8):844-854). Verified 2026-08-15: when a component cannot be tested
  (e.g. verbal under endotracheal intubation/tracheostomy), it is recorded **"NT" (not
  testable)**; guidance is explicitly **do not report a total score when a component is NT**
  (a fabricated-low total misrepresents the patient), and **do not use "1" to record an
  untestable component**.
- SOFA CNS operationalisation of GCS: Vincent JL et al. Intensive Care Med.
  1996;22(7):707-710 (bands 15/13-14/10-12/6-9/<6). The original SOFA publication does not
  define how to score sedated patients; no published rule in it licenses substituting the
  sedated value.
- qSOFA: Singer M et al. (Sepsis-3). JAMA. 2016;315(8):801-810; altered mentation
  operationalised as GCS < 15 (Seymour CW et al. JAMA. 2016;315(8):762-774).
- Sedation practice anchor: Devlin JW et al. (SCCM PADIS). Crit Care Med.
  2018;46(9):e825-e873.

## 3. Discrepancy analysis

| Dimension | Finding | Label |
|---|---|---|
| Range | 3-15 inclusive at API and rules layer — matches Teasdale-Jennett. The predecessor's 0-exempt sentinel (RULE-SINAIS-VITAIS-011) is **not** carried into the V1 API schema, but `desmame.yaml`'s `[0,9)` band floor still accommodates it. No DB constraint backs the API validation. | OBSERVED |
| Component modelling | Vitals stream stores total only; only the forms engine has E/V/M and it **coerces an untested component to its minimum (1)** — the exact practice glasgowcomascale.org forbids ("do not use 1 for missing"). A fully empty form yields 3.0, indistinguishable from true deep coma. | OBSERVED |
| Severity bands | `_glasgow_severity` splits published "severe 3-8" into `grave 6-8` / `muito_grave 3-5`; 13/9 boundaries match the published mild/moderate cut-points. Institutional subdivision, not a numeric error. | OBSERVED |
| Missing-data behaviour | Divergent by consumer (table §1.3): zero-coercion (SOFA/qSOFA), coercion-to-worst (forms E/V/M), status-"normal" (deterioration), fail-safe refusal (weaning, step-down, trilhas). No single policy. | OBSERVED |
| Structural dead paths | `glasgow_24h_ago` hard-coded `None` in the deterioration API kills the ΔGCS criterion on that route. | OBSERVED |
| Population | GCS itself is used in adults and children, but every consumer here (SOFA, qSOFA, weaning bundles) is adult-validated; V1 has no age gating → VAL-0006/VAL-0007, HAZ-0036. | INFERENCE |

## 4. MANDATORY — GCS validity under sedation/intubation

**What V1 actually does (OBSERVED):**

1. **There is no "T"/"NT" designation, no verbal substitution, and no RASS-gating of GCS
   anywhere in the V1 codebase.** The only trace of awareness is a commented-out placeholder
   in the cross-field invariants registry — `domain_formularios.py:131-132`, verbatim:
   `# Future invariants can be added here:` / `# "glasgow_intubated_block": { ... },` —
   i.e. an intubation block for GCS was contemplated and never implemented.
2. For an **intubated patient** (verbal untestable) the system offers exactly two encodings,
   both wrong: (a) omit GCS → every scorer treats it as `missing` → SOFA CNS 0 / qSOFA
   mentation 0 (false reassurance, HAZ-0005 pattern); or (b) submit the forms engine with
   `verbal` absent or 1 → `_calculate_glasgow` coerces V=1, so an alert intubated patient
   (E4, M6) becomes GCS 11 → SOFA CNS 2 and qSOFA mentation 1 (false alarm and polluted
   scores in the opposite direction).
3. For a **deeply sedated patient (RASS ≤ -3)** the measured GCS reflects drug effect. V1
   computes SOFA CNS and qSOFA mentation from it with **no sedation covariate**: RASS is not
   an input to `sofa.py`, `qsofa.py`, or `domain_piora_clinica._eval_gcs_drop`; nothing
   marks the resulting CNS sub-score as sedation-confounded. A propofol-sedated RASS -4
   patient scores SOFA CNS 4 and permanently trips the `GCS<=8 → critical "coma"` branch of
   the deterioration criterion (`domain_piora_clinica.py:430-431`).
4. The contrast is stark with V1's own CAM-ICU handling, which **does** gate on RASS ≤ -4
   ("não avaliável", `domain_sedacao.py:271-291`) — proving the pattern was available and
   simply never applied to GCS.
5. Downstream propagation (cross-references; deep score review is other workstreams'):
   SOFA CNS → `sofa.py:487-504` total; qSOFA → `qsofa.py:148-158` total and
   `domain_sepsis.py:248-261` sepsis screening; EWS consciousness is AVPU-based, not
   GCS-based (`news2.py:213-224`, `mews.py:151-165` — see REV-NS-08), but a sedated,
   non-alert patient scores NEWS2 +3 / MEWS +1-3 with the same confounding and no gating;
   deterioration criteria per §1.3; weaning/step-down gates per §1.3 (these are the only
   consumers that fail safe).

### INPUT TO ADR — sedation/neuro-assessment confounding policy

PROPOSAL (clinical recommendation for the V2 ADR; requires named clinical ratification):

1. **Model GCS as E/V/M components with an explicit NT state per component.** A total is
   computable only when all three components are tested; an untested component makes the
   total unrepresentable (not 3, not 15, not minimum-filled), per glasgowcomascale.org.
   Record modality (e.g. "GCS 10T" display convention) as presentation, not arithmetic.
2. **Gate neuro-assessment validity on sedation state.** Require a contemporaneous RASS with
   every GCS intended for scoring. If RASS ≤ -3 (or a sedative infusion is active without an
   interruption window), the GCS is recorded but flagged `sedation_confounded`; SOFA CNS,
   qSOFA mentation, and EWS consciousness computed from it must carry
   `evaluation_status = partial` at best, under an explicitly ratified partial policy
   (`evaluation-status-semantics.md` §3.2) — never silently `valid`. The clinically honest
   default for the CNS sub-score of a pharmacologically sedated patient is
   `not_evaluated (reason: sedation_confounded)`, with the last pre-sedation GCS surfaced.
3. **Never coerce.** Missing/NT/confounded neuro inputs must be unrepresentable as 0, as
   component-minimum, or as "normal" (HAZ-0005, SAF-0002 absent-input probe). The three V1
   behaviours (zero, minimum-fill, status-"normal") are all rejected.
4. **Population gate**: adult-only until VAL-0006/VAL-0007 are decided.

## 5. HAZ-0005 zero-coercion check (from source)

**VIOLATION — multiple, live.** (a) `sofa.py:358-359` and `qsofa.py:113-114`: missing GCS →
0 points; the "missing" marker is metadata that no consumer elevates (the legacy-TA E1
pattern exactly). (b) `domain_formularios.py:611-626`: forms SOFA drops the component with
no marker at all. (c) `domain_piora_clinica.py:427-428`: missing GCS → status `"normal"`.
(d) `domain_formularios.py:749-751`: inverse coercion — missing component → worst value.
Only the weaning/step-down/trilhas gates (§1.3) behave safely. Intent evidence: the
missing→0 behaviour is asserted as expected in `tests/test_sofa.py` and
`tests/test_qsofa.py` missing-input vectors (hash-noted; absent from manifest), so this is
designed behaviour, not an accident.

## 6. Verdict

**TRANSFORM** — retain only the concept (GCS as the CNS severity input, Teasdale-Jennett
3-15, Vincent SOFA bands, Sepsis-3 GCS<15 cut-point — all numerically correct in V1); rebuild
the instrument model entirely: component-level capture with NT, sedation gating per §4, one
evaluation-status-governed missing-data policy, DB-level constraints, and adult population
gating. The V1 missing-data behaviours and the absence of any intubation/sedation handling
are REJECTED as clinical logic.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
