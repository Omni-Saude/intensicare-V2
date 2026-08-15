---
id: REV-NS-02
title: Legacy review — RASS (Richmond Agitation-Sedation Scale)
label: PROPOSAL
statement: >
  V1's RASS enumeration (-5..+4) and pt-BR labels match Sessler 2002; validation is correct
  in the sedation service; but the clinical-forms engine coerces a missing RASS to 0
  ("Alerta e calmo") and silently clamps out-of-range values, and the main RASS alert
  evaluator lives in an unimportable module. Verdict: REFINE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_formularios.py; src/intensicare/services/domain_pharmaco_delirium.py
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

# REV-NS-02 — RASS

## 1. As implemented (OBSERVED, verbatim)

| Path | Lines | SHA-256 | Manifest |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 101-154, 250-252 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 24-45, 676-694 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `src/intensicare/services/domain_pharmaco_delirium.py` | 269-367 | `f6c48a1d9545d66da3a744e0087b090f3648cfe3eb8d6a817f164138f2d9a401` | MATCH |
| `src/intensicare/services/domain_piora_clinica.py` | 443-466 | `ca8cbe35c00a8390a2d963ca5af9f235f0f454bf87c406cb5646d27d04221994` | MATCH |
| `src/intensicare/api/v1/deterioration.py` | 114-115 | `6a0c3bd1a14947f203be56bd0d2a678ab4d7870730f43816ab18c678154ce7f7` | MATCH |
| `src/intensicare/models/sedacao.py` | 24-31 | `b790b4b0e7be1550f7b5276a9ec8f1504b056b7db8f668a063f79913dd419c8b` | MATCH |
| `src/intensicare/schemas/sedacao.py` | 37-42 | `bd432d9a5b4144380eaed1c6518b10465612c95d9d7e33468053114e0e44992d` | MATCH |
| `_work/alerts/pathways/sedacao.yaml` | 31-56 | `21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657` | MATCH |
| `_work/alerts/pathways/delirium.yaml` | 43-67 | `571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-014-…md` | whole file | `5931aa164570c48fdff7c7be8c29a23ba80a6bdcaeab432a6ddb6b63d42e3187` | MATCH |
| `docs/rules/clinical-scoring/RULE-EVOLUCOES-003-…md` | whole file | `8090c997b3778d057db506f00b290305a73416515ae31627a9e4d4c1980f8d65` | MATCH |
| `tests/test_domain_formularios.py` | 316-322 | see README §4 | ABSENT (hash-noted) |

- Enumeration and labels (`domain_sedacao.py:101-112`): `-5 Não despertável, -4 Sedação
  profunda, -3 Sedação moderada, -2 Sedação leve, -1 Sonolento, 0 Alerta e calmo, +1
  Inquieto, +2 Agitado, +3 Muito agitado, +4 Combativo`; out-of-range label
  `"Desconhecido"` (`:140-154`). Identical map in `domain_formularios.py:33-44`.
- Validation (`domain_sedacao.py:120-122`): `-5 <= score <= 4`; violation raises
  `ValueError` (`:250-252`). Schema `schemas/sedacao.py:37-39` enforces `ge=-5, le=4`;
  model column `models/sedacao.py:24-28` is a plain nullable Integer (no DB constraint).
- Forms engine (`domain_formularios.py:676-687`), verbatim:
  ```text
  nivel = _num(data.get("nivel"))
  if nivel is None:
      return 0.0
  return max(-5.0, min(4.0, nivel))
  ```
  Missing RASS → **0.0 = "Alerta e calmo"**; out-of-range (+10, -10) → silently clamped to
  +4/-5. Both behaviours are asserted as expected in
  `tests/test_domain_formularios.py:316-322` (clamping) — designed behaviour.
- Alert evaluator (`domain_pharmaco_delirium.py:269-367`, `evaluate_sedation_rass_camicu`):
  deep sedation `<= -3` (urgent when `<= -4`), undersedation `>= +2`, default target
  `-2..0`; `rass is None` → `fired=False`, `severity="normal"`, plus recommendation string
  "RASS não registrado…". **The module is unimportable** (nonexistent `maezo` import —
  REV-NS-09 §1.4), so none of this runs.
- Deterioration criterion (`domain_piora_clinica.py:443-466`): `>=+3 critical`, `>=+2
  alert`, `<=-5 critical`, `<=-4 alert`; missing → `(False, "normal", "sem dados de
  RASS")`. The API feed hard-codes `"rass": None` (`api/v1/deterioration.py:114-115`), so
  this criterion is structurally dead on that route.
- Pathway bands (lower-inclusive/upper-exclusive per `pathway.schema.json:156`):
  `sedacao.yaml:38-56` — `[-5,-3) critical / [-3,-2) watch / [-2,1) normal / [1,∞) urgent`;
  `delirium.yaml:48-67` — `[-5,-1) watch / [-1,1) normal / [1,3) urgent / [3,∞) critical`.
- Predecessor-catalog findings retained: RULE-CLINICAL-SCORING-014 (numeric scale correct
  across three definitions, label divergence and an 11th "" sentinel in two of them);
  RULE-EVOLUCOES-003 (RASS typed number in one frontend model and string in another).

## 2. Published instrument (SOURCE)

- Sessler CN et al. *The Richmond Agitation-Sedation Scale: validity and reliability in
  adult ICU patients.* Am J Respir Crit Care Med. 2002;166(10):1338-1344. Ten levels
  +4 Combative … 0 Alert and calm … -5 Unarousable.
- Ely EW et al. *Monitoring sedation status over time in ICU patients: reliability and
  validity of the RASS.* JAMA. 2003;289(22):2983-2991.
- Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — light-sedation
  target (RASS -2 to 0 commonly operationalised).

## 3. Discrepancy analysis

| Dimension | Finding | Label |
|---|---|---|
| Enumeration | 10 levels, ordering and anchors match Sessler 2002 exactly; pt-BR labels are faithful translations (-1 "Sonolento" = Drowsy). | OBSERVED |
| Range/type | -5..+4 integer everywhere in V1 `src`; predecessor string-vs-number split (RULE-EVOLUCOES-003) not carried into V1 services, but no DB constraint. | OBSERVED |
| Cut-points | Deep sedation `<=-3`, agitation `>=+2`, target `-2..0` are PADIS-consistent. `sedacao.yaml` band semantics put RASS -3 in *watch* while its own description calls -3..-5 "sedação profunda" — internal inconsistency at the -3 boundary. RASS +1 (Inquieto) maps to *urgent* "Agitação" in `sedacao.yaml` (stricter than published labels; +1 is restless, not agitated). | OBSERVED |
| Missing data | Forms engine: **missing → 0.0 = normal target value** (worst finding of this record). Alert evaluator: missing → severity "normal". Deterioration: missing → status "normal". Sedation service: missing stays `None` (correct). | OBSERVED |
| Invalid data | Forms engine silently clamps out-of-range to a valid extreme rather than rejecting — converts a detected data-integrity error into a plausible clinical value (contra `evaluation-status-semantics.md` §3.5). | OBSERVED |
| Population | RASS validated in adult ICU patients; no age gating in V1 → VAL-0006/VAL-0007, HAZ-0036. | INFERENCE |

## 4. HAZ-0005 zero-coercion check (from source)

**VIOLATION.** `domain_formularios.py:685-686` coerces an unassessed sedation state to the
numeric normal (0, "Alerta e calmo") and persists it as a scored submission — the exact
HAZ-0005 mechanism (absence rendered as the reassuring value). Secondary violations:
severity-"normal" on missing in `domain_pharmaco_delirium.py:289-304` and
`domain_piora_clinica.py:448-449`; silent clamping of invalid values
(`domain_formularios.py:687`). Conformant path: `assess_sedation_pure`
(`domain_sedacao.py:250-252`) rejects invalid and preserves `None`.

## 5. Verdict

**REFINE** — the enumeration, labels, validation ranges, and PADIS-aligned cut-points are
sound and importable as concepts; the forms-engine missing→0 coercion and silent clamping
are REJECTED and must be replaced by evaluation-status semantics (`not_evaluated` /
`invalid`); the -3 band boundary and the +1→urgent mapping need explicit clinical
ratification; DB-level constraints required.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
