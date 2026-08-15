---
id: REV-NS-03
title: Legacy review — NRS (Numeric Rating Scale, pain 0-10)
label: PROPOSAL
statement: >
  V1 validates NRS 0-10 correctly in the sedation service and uses published moderate/severe
  bands (4-6 / 7-10); the forms engine silently clamps out-of-range values into the valid
  range; the predecessor catalog documents an unreachable severe-pain band. Verdict: REFINE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_formularios.py; src/intensicare/services/domain_respiratory.py
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
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# REV-NS-03 — NRS (pain, 0-10)

## 1. As implemented (OBSERVED, verbatim)

| Path | Lines | SHA-256 | Manifest |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 130-133, 258-260 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/schemas/sedacao.py` | 45 | `bd432d9a5b4144380eaed1c6518b10465612c95d9d7e33468053114e0e44992d` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 787-795, 825-834 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `src/intensicare/services/domain_respiratory.py` | 813-824 | `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-015-…md` | whole file | `2fa87c2961503fc76a1afadb9eace2b06d49e0bd248fb266310cbcdba527d2e9` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEDACAO-001-…md` / `RULE-SEDACAO-002-…md` | whole files | `c700d576905f0e8e344f98e8272b2ee6d48a7951ef5998d4daee74ce1e3d5560` / `8b99b8f2f18753264b4e6bdb360b358ea6f070a22054aa26a0b25ed6ef7cb0db` | MATCH |
| `docs/rules/clinical-scoring/RULE-PIORA-CLINICA-006-…md` | whole file | `12773b3df82821d17e5ea49e1d31ad69a53813e856f2d8992048104a61109e5d` | MATCH |
| `docs/plan/_work/alerts/neuro-sedation.yaml` | ALERT-NEUROSED-PAIN-08 block | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` | ABSENT (hash-noted) |
| `tests/test_domain_formularios.py` | 324-332 | see README §4 | ABSENT (hash-noted) |

- Validator (`domain_sedacao.py:130-133`): `0 <= score <= 10`; violation raises `ValueError`
  (`:258-260`). Schema `schemas/sedacao.py:45`: `ge=0, le=10`, nullable.
- Forms engine (`domain_formularios.py:789-795`): `nrs None → (None, None)` (honest); a
  provided value is **clamped** — `max(0.0, min(10.0, nrs_val))` — so NRS 20 → 10
  ("dor_intensa") and -5 → 0 ("sem_dor"); asserted as expected in
  `tests/test_domain_formularios.py:324-332`.
- Severity bands (`_nrs_severity`, `domain_formularios.py:825-834`): 0 sem_dor / 1-3
  dor_leve / 4-6 dor_moderada / 7-10 dor_intensa. Same bands ratified in
  `domain_respiratory.py:813-824` (RAT-CLINICAL-SCORING-05: severe 7-10, moderate 4-6,
  mild 1-3, none 0).
- Predecessor catalog: 0-10 validator correct (RULE-CLINICAL-SCORING-015); sedation alert
  bands VISUAL 4-6 (moderate) / 7-10 (severe) on two consecutive fluid balances
  (RULE-SEDACAO-001/-002, verified); **RULE-PIORA-CLINICA-006 documents the severe band
  written as `7 <= dor > 10`, which is unsatisfiable given the 0-10 cap — severe pain 7-10
  scored "0" in the predecessor's piora criterion (impact rated high in the catalog).** The
  V1 planning catalog (`neuro-sedation.yaml`, ALERT-NEUROSED-PAIN-08) explicitly names and
  corrects this misparse class and restores a distinct urgent band for NRS ≥ 7.

## 2. Published instrument (SOURCE)

- NRS-11 for pain intensity: 11-point verbal numeric scale, 0 (no pain) to 10 (worst
  imaginable); standard band operationalisation mild 1-3, moderate 4-6, severe 7-10
  (e.g. Boonstra AM et al. Front Psychol. 2016;7:1466; band use endorsed in Devlin JW et
  al., SCCM PADIS, Crit Care Med. 2018;46(9):e825-e873, which anchors routine ICU pain
  assessment by self-report when the patient can communicate).

## 3. Discrepancy analysis

| Dimension | Finding | Label |
|---|---|---|
| Range | 0-10 inclusive everywhere — matches NRS-11. | OBSERVED |
| Cut-points | 4-6 moderate / 7-10 severe match the published bands; the two-consecutive-balance confirmation in the predecessor rules is an institutional false-positive filter, within range. | OBSERVED |
| Invalid data | Forms engine converts out-of-range input into a valid extreme instead of rejecting (`invalid` → plausible value), unlike the sedation service which raises. Two inconsistent policies for the same instrument in one codebase. | OBSERVED |
| Missing data | Forms engine returns `(None, None)`; sedation service keeps `None`. No zero-fill found for NRS. | OBSERVED |
| Instrument selection | The forms engine defaults `tipo` to "bps" (`domain_formularios.py:787`), so an NRS-capable patient whose form omits `tipo` is silently scored on the behavioural scale — an instrument-selection defect shared with REV-NS-04. | OBSERVED |
| Population | Adult self-report instrument; no age gating (VAL-0006/0007). | INFERENCE |

## 4. HAZ-0005 zero-coercion check (from source)

**PARTIAL VIOLATION.** No missing→0 coercion for NRS itself (missing → `None`/(None,None)).
The violation is the invalid→valid clamp (`domain_formularios.py:793`): a detected
out-of-range value — which `evaluation-status-semantics.md` §3.5 requires to surface as
`invalid` — is silently normalised, and NRS -5 becomes 0 "sem_dor", which is exactly a
coercion of bad data to the no-risk value. Predecessor severe-band unreachability
(RULE-PIORA-CLINICA-006) made real severe pain score "0" — the same hazard class, already
materialised once.

## 5. Verdict

**REFINE** — range, bands, and PADIS anchoring are correct and reusable; REJECT the clamp
(replace with `invalid` status), REJECT the silent default-to-BPS instrument selection, and
carry the predecessor `7 <= dor > 10` misparse into V2's negative-test suite so it can never
be reintroduced.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
