---
id: REV-NS-06
title: Legacy review — SDRA/ARDS severity enumeration
label: PROPOSAL
statement: >
  No ARDS severity classifier exists in V1 src; the only formal artifact is the
  predecessor catalog's SDRAChoices enum (leve/moderada/grave plus an empty sentinel), whose
  labels match the Berlin taxonomy but whose model field was commented out (dead), and which
  encodes no PaO2/FiO2 cut-points. V1 uses "SDRA grave" only as a free-text/derived-flag
  deep-sedation indication. Verdict: SUPERSEDE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-017-sdra-ards-severity-enumeration.md; src/intensicare/services/domain_pharmaco_delirium.py; docs/plan/_work/alerts/neuro-sedation.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (per-file SHA-256 in §1; MATCH against legacy-pin-cycle-1.md unless noted)
  section_or_lines: cited per finding
  date_collected: 2026-08-15
  collector: legacy neuro/sedation instrument forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001]
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# REV-NS-06 — SDRA/ARDS severity enumeration

## 1. As implemented (OBSERVED)

| Path | Lines | SHA-256 | Manifest |
|---|---|---|---|
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-017-…md` | whole file | `a4f9e9778397f504f4d45ebe7f6cbf72327f6737d9302baf95209334ceac20b5` | MATCH |
| `src/intensicare/services/domain_pharmaco_delirium.py` | 322-326 | `f6c48a1d9545d66da3a744e0087b090f3648cfe3eb8d6a817f164138f2d9a401` | MATCH |
| `docs/plan/_work/alerts/neuro-sedation.yaml` | `indicacao_sedacao_profunda` input rows | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` | ABSENT (hash-noted) |

- **V1 `src/intensicare` contains no ARDS/SDRA severity classifier, model field, schema
  field, or enumeration** (verified by repository-wide grep for `sdra`/`ards` across
  `src/intensicare/models/`, `schemas/`, `services/` at the pinned HEAD — the only hits are
  prose strings). "SDRA grave" appears solely: (a) inside a pt-BR recommendation string of
  the deep-sedation alert (`domain_pharmaco_delirium.py:322-326` — "…se não houver indicação
  específica (ex.: SDRA grave, hipertensão intracraniana, BNM)"); and (b) as one source of
  the *derived boolean* `indicacao_sedacao_profunda` ("SDRA grave/ECMO/BNM/HIC/EME") in the
  planning catalog, which is loaded only by the dead runner (REV-NS-05 §1.4).
- Predecessor catalog (RULE-CLINICAL-SCORING-017, secondary evidence — the `ahlabs-trilhas`
  source snapshot it cites is **not mounted** in the pinned legacy repo): `SDRAChoices` =
  `leve (Leve) / moderada (Moderada) / grave (Grave) / '' (Nao informado)`; the consuming
  `DadosProntuario.sdra` model field was **commented out** (dead code); legacy tests still
  referenced the removed field; no PaO2/FiO2 cut-points encoded anywhere; earlier sedation
  criteria referencing "SDRA moderada ou grave" were dropped.

## 2. Published instrument (SOURCE)

- ARDS Definition Task Force (Ranieri VM et al.). *Acute respiratory distress syndrome: the
  Berlin Definition.* JAMA. 2012;307(23):2526-2533. Mild 200 < PaO2/FiO2 ≤ 300; moderate
  100 < PaO2/FiO2 ≤ 200; severe PaO2/FiO2 ≤ 100 — all at PEEP/CPAP ≥ 5 cmH2O, with timing,
  imaging, and origin-of-edema criteria.
- 2023 global definition update: Matthay MA et al. *A New Global Definition of Acute
  Respiratory Distress Syndrome.* Am J Respir Crit Care Med. 2024;209(1):37-47 — admits
  SpO2/FiO2 ≤ 315 (SpO2 ≤ 97%) as a diagnostic oxygenation criterion, HFNO ≥ 30 L/min as a
  qualifying support modality, and ultrasound for imaging — directly relevant to V2 because
  V1's respiratory pipeline is S/F-ratio-centric (`domain_respiratory.py`, cross-ref
  respiratory workstream).

## 3. Discrepancy analysis

| Dimension | Finding | Label |
|---|---|---|
| Taxonomy | leve/moderada/grave maps 1:1 to Berlin mild/moderate/severe; the '' "Nao informado" sentinel has no Berlin counterpart (a missing-data value inside a clinical enum — the HAZ-0005-adjacent pattern of encoding absence in the value domain). | OBSERVED |
| Cut-points | None encoded anywhere; the enum is label-only, so severity was whatever the author typed — no computable relation to PaO2/FiO2, PEEP, timing, imaging. | OBSERVED |
| Liveness | Dead in the predecessor (field commented out) and never implemented in V1 src. The only live use of ARDS severity is as an unstructured suppression rationale for deep sedation, in dead alert code. | OBSERVED |
| Consequence | The deep-sedation-indication gate (`indicacao_sedacao_profunda`) depends on a classification the system cannot compute — if V2 carries that gate, it needs a real, evidenced ARDS classification input or an explicit human attestation field. | INFERENCE |
| Population | Berlin/2023 definitions are adult-focused (paediatric ARDS uses PALICC-2) → VAL-0006/0007. | INFERENCE |

## 4. HAZ-0005 zero-coercion check (from source)

No live coercion path exists (the instrument is not implemented). Hazard-relevant residue:
the '' "Nao informado" member inside the value enum (absence representable as a category of
the clinical dimension itself), and the dependence of a sedation-safety gate on an
uncomputable classification (a missing classification would silently read as "no indication
for deep sedation" via the boolean default) — flagged for V2 design.

## 5. Verdict

**SUPERSEDE** — there is nothing to import: the enum is dead, cut-point-free, and
label-only. V2 should design ARDS severity natively against Berlin 2012, deciding explicitly
(clinical governance) whether to adopt the 2023 global-definition extensions (S/F-based
oxygenation, HFNO), with `evaluation_status` instead of an in-band "Nao informado" sentinel,
and with the deep-sedation-indication linkage made an explicit, attestable input.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
