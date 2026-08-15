---
id: REV-NS-09
title: Legacy review — sedation and weaning (desmame) domain logic and pathway instrument usage
label: PROPOSAL
statement: >
  V1's sedation assessment service is largely sound (validating, non-coercing, RASS-gated
  CAM-ICU); its alerting layer is dead code behind a nonexistent import with
  exception-swallowing runners; the sedation/delirium/desmame pathway YAMLs use RASS, BPS,
  CAM-ICU, and GCS with mostly PADIS-consistent bands but boundary defects; the predecessor
  sedation criteria include two catalog-documented broken rules (unsatisfiable RASS band,
  weaning criterion with impossible thresholds and inverted drug logic). Verdict: REFINE
  with specific REJECTs. PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_pharmaco_delirium.py; src/intensicare/services/domain_respiratory.py; _work/alerts/pathways/{sedacao,delirium,desmame}.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (per-file SHA-256 in §1; MATCH against legacy-pin-cycle-1.md unless noted)
  section_or_lines: cited per finding
  date_collected: 2026-08-15
  collector: legacy neuro/sedation instrument forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0019]
  hazards: [HAZ-0005, HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# REV-NS-09 — Sedation / weaning domain logic

## 1. As implemented (OBSERVED, verbatim)

| Path | Lines | SHA-256 | Manifest |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 219-307, 346-498 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/services/domain_pharmaco_delirium.py` | 21-35, 84-106, 140-162, 176-261, 375-408 | `f6c48a1d9545d66da3a744e0087b090f3648cfe3eb8d6a817f164138f2d9a401` | MATCH |
| `src/intensicare/services/domain_respiratory.py` | 336-415, 735-804 | `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` | MATCH |
| `src/intensicare/services/domain_estabilidade.py` | 250-455, 509-656 | `2c838c4fbb5c368b1e8a1d5a4c8d4b0b22d6458079a3198ca1a0f69ba2b0f7b8` | MATCH |
| `src/intensicare/services/deterioration_trend.py` | 42-67, 189-263 | `61d80a379459f4769d5bf3ab14813f6985a0d00f038f349877d6382b85080870` | MATCH |
| `src/intensicare/services/domain_trilhas_engine.py` | 297-316 | `6dca0013e99a6db21bf92303062bf033c40314a0c79c999896eea3aa04cadd56` | MATCH |
| `_work/alerts/pathways/sedacao.yaml` | whole file | `21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657` | MATCH |
| `_work/alerts/pathways/delirium.yaml` | whole file | `571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208` | MATCH |
| `_work/alerts/pathways/desmame.yaml` | whole file | `808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a` | MATCH |
| `_work/alerts/schema/pathway.schema.json` | 128-170 | `68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEDACAO-003-…md` / `RULE-SEDACAO-004-…md` | whole files | `8e68b6414b818f9cbb9ec438ba5f6685d7b53cd64df1040e5b3b58d1d4d1485c` / `8b5a4c9559202a19e8ab3b7015e110a0c07e764d967dd4244c686241b5472588` | MATCH |
| `pyproject.toml` (legacy) | 240-246, 305-334 | `716a9354b75face954281e215ee8f21d2d895cbab2ab2a31b159d561a2c4d800` | ABSENT (hash-noted) |
| `docs/plan/_work/alerts/neuro-sedation.yaml` | whole file | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` | ABSENT (hash-noted) |

### 1.1 Sedation assessment service (`domain_sedacao.py:219-307, 346-498`)

`assess_sedation_pure` validates RASS/BPS/NRS ranges (raising on violation), keeps missing
scores as `None`, computes the RASS label, applies the RASS ≤ -4 CAM-ICU gate
(REV-NS-05), and persists via `SedationAssessment`. No coercion found in this path. History
and current-assessment queries are straightforward (`:346-418`).

### 1.2 Dead alerting layer

- `domain_pharmaco_delirium.py:21` — `from maezo.rules.alert_compiler import …`: **no
  `maezo` package exists in the repository**; the legacy `pyproject.toml:240-246` states
  this verbatim ("maezo.rules.alert_compiler does not exist in this repository") and
  `:318-334` excludes the tests from collection. The module — including
  `run_delirium_batch`, `evaluate_sedation_morning_reduction` (SAT ≥50% morning-reduction
  check), `evaluate_sedation_rass_camicu`, and `evaluate_all_domains` — is unimportable
  dead code. Its catalog path also points at `docs/plan/_work/alerts/neuro-sedation.yaml`
  (a planning document), not the pinned `_work/alerts/pathways/` set.
- Even if importable, both batch runners swallow every evaluation exception and `continue`
  (`:97-104`, `:153-160` — "Skip alerts that fail to evaluate (missing data, etc.)") — a
  silent no-fire with no recorded reason (violates prohibition P-5,
  `evaluation-status-semantics.md` §4).
- `evaluate_sedation_morning_reduction` (`:176-261`): missing doses → `fired=False` with
  reason strings ("Dados insuficientes…") but no evaluation status; `sedativo_em_uso`
  defaults False, so an unknown sedation state reads "no active sedative — not applicable".

### 1.3 Pathway instrument usage (`_work/alerts/pathways/`; band semantics
lower-inclusive/upper-exclusive per `pathway.schema.json:156`)

- `sedacao.yaml`: RASS bands `[-5,-3) critical / [-3,-2) watch / [-2,1) normal / [1,∞)
  urgent` — -3 lands in *watch* though the description defines deep sedation as -3..-5
  (boundary inconsistency, cross-ref REV-NS-02); BPS bands flag 5 as moderate vs Payen's >5
  (REV-NS-04); sedative-dose bands in "midazolam equivalente" mg/h with no conversion
  logic anywhere in V1 src (unit exists only as a label). Evidence block correctly anchors
  PADIS 2018 (doi 10.1097/CCM.0000000000003299) and names SAT and CPOT/BPS monitoring.
- `delirium.yaml`: CAM-ICU boolean with no not-assessable state (REV-NS-05); RASS band
  input is named `rass_target` while the sedação pathway names the same measurement
  `rass_score` — two names for one stream input; haloperidol dose bands (0-5/5-15/≥15
  mg/day) are a pharmacotherapy surface cross-referenced to the pharmaco workstream.
- `desmame.yaml`: RSBI bands 0-80/80-105/≥105 (Yang-Tobin 105 cut-point preserved; the
  80-105 "zona de atenção" is institutional); NIF bands with normal `[-100,-25)` — the
  physiologically strongest values (< -100, e.g. -110) fall outside every band; GCS bands
  `[11,∞) normal / [9,11) watch / [0,9) critical` — GCS ≥ 11 as the weaning-adequacy
  cut-point is an institutional choice within the published 8-13 debate, and the band floor
  0 admits impossible values (REV-NS-01); boolean criteria (tosse eficaz, controle de
  secreção, gasometria) with `unit: ratio` mislabels on boolean/score inputs (`glasgow`
  declared `unit: ratio`, `:23-26`). Evidence anchors: ACCP/SCCM/AARC 2001 weaning
  guidelines (doi 10.1378/chest.120.6_suppl.375S).
- Wired weaning logic in V1 src (`domain_respiratory.py:336-415` RATIFIED bundle:
  S/F > 315, PEEP ≤ 8, FiO2 ≤ 0.40 fraction, RSBI < 105, RASS ≥ -2, GCS ≥ 10, vasopressor
  ≤ 0.2, MV ≥ 1 day — conjunctive, missing → not-ready; `:735-804` ERS/ATS-2007-anchored
  bundle: GCS > 8 OR RASS ≥ -2) — two different consciousness thresholds for the same
  decision in one file. `domain_trilhas_engine.py:297-316` refuses desmame evaluation
  without neuro or mechanics data, with an explicit reason (honest not-evaluated pattern).

### 1.4 Predecessor sedation criteria (catalog; `ahlabs-trilhas` not mounted)

- RULE-SEDACAO-003: deep-sedation criterion written `-3 <= int(rass) <= -5` — an **empty
  interval**; criterion could never fire (unwired). The planning catalog's
  ALERT-NEUROSED-OVERSED-01 test vector TV-3 explicitly corrects this.
- RULE-SEDACAO-004: weaning-readiness criterion with `fio2 > 250` and `fr > 250`
  (physiologically impossible thresholds vs documented intent FiO2 < 50%, FR > 22),
  presence-instead-of-absence check on dexmedetomidine/morphine, and reads of nonexistent
  field names defaulting to 0 (unwired).

### 1.5 Adjacent files in scope (instrument use only)

`domain_estabilidade.py` uses **no neuro/sedation instrument** (27 hemodynamic criteria);
its missing-data pattern — every `sem dados` → status "normal" → score 0/27 → severity
"estavel" with an "ESTÁVEL … manter monitorização" recommendation (`:250-455, 642-656`) —
is HAZ-0005 evidence for the score-side workstream (cross-referenced, not reviewed here).
`deterioration_trend.py` consumes persisted MEWS/NEWS2 series only; its missing-data
behaviour is conformant (< 3 points → `None`, "sem dado, sem previsão", `:189-220`), though
it inherits any zero-coerced scores in the series it fits (garbage-in).

## 2. Published anchors (SOURCE)

- Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — light-sedation
  target, routine pain/delirium assessment, non-benzodiazepine preference.
- Kress JP et al. N Engl J Med. 2000;342(20):1471-1477 (daily sedation interruption);
  Girard TD et al. Lancet. 2008;371(9607):126-134 (paired SAT+SBT).
- Weaning: MacIntyre NR et al. (ACCP/SCCM/AARC evidence-based weaning guidelines). Chest.
  2001;120(6 Suppl):375S-395S; Boles JM et al. Eur Respir J. 2007;29(5):1033-1056; RSBI
  cut-point: Yang KL, Tobin MJ. N Engl J Med. 1991;324(21):1445-1450.

## 3. Discrepancy analysis (domain level)

| Dimension | Finding | Label |
|---|---|---|
| Guideline alignment | Targets and thresholds that exist (RASS -2..0, SAT concept, RSBI 105, PADIS anchors) are consistent with the cited primary literature. | OBSERVED |
| Liveness | The entire sedation/delirium alert layer is dead (import error); only the forms API, sedation CRUD service, and respiratory weaning alerts execute. The pinned pathway YAMLs and the planning catalog are two divergent alert definitions for the same domain. | OBSERVED |
| Internal consistency | Same measurement named `rass_score` vs `rass_target`; two weaning consciousness thresholds (GCS ≥ 10 AND RASS ≥ -2 vs GCS > 8 OR RASS ≥ -2); -3 band boundary vs description; NIF normal band open at the strong end; unit labels wrong (`ratio` on GCS/booleans); "midazolam equivalente" with no conversion. | OBSERVED |
| Missing data | Spectrum from correct (sedation service, trilhas eligibility, trend "sem dado, sem previsão") through reason-string-only (morning reduction) to silent (exception-swallowing runners, boolean defaults). | OBSERVED |
| Population | All adult instruments/criteria; no age gating → VAL-0006/0007, HAZ-0036. | INFERENCE |

## 4. HAZ-0005 zero-coercion check (from source)

**MIXED.** Conformant: `assess_sedation_pure` (validate-or-raise, `None` preserved);
`domain_trilhas_engine` desmame refusal with reason; `deterioration_trend` minimum-points
refusal; conjunctive weaning gates failing safe on missing. VIOLATIONS: exception-swallowing
alert runners (silent no-fire, no reason recorded — P-5); `sedativo_em_uso` defaulting
False (unknown → "no sedation"); `cam_icu_positive` defaulting False in
`evaluate_sedation_rass_camicu` (unknown → "no delirium"); severity "normal" emitted for
missing RASS (REV-NS-02). All in the dead module, but they define the legacy intent V2 must
not inherit.

## 5. Verdict

**REFINE** — carry forward: the sedation-service validation/persistence design, the
PADIS-anchored targets, the paired SAT/SBT and weaning-bundle concepts, the
two-consecutive-assessment confirmation pattern, and the trilhas/trend honest-refusal
patterns. **REJECT** (with negative tests): RULE-SEDACAO-003's empty interval;
RULE-SEDACAO-004 wholesale (impossible thresholds, inverted drug-absence logic, wrong field
reads); exception-swallowing alert evaluation; unknown-as-False defaults on
`sedativo_em_uso`/`cam_icu_positive`. **VALIDATE** before reuse: every pathway band
boundary named in §1.3, the GCS ≥ 11 desmame cut-point, the dual weaning consciousness
thresholds (pick one, clinically ratified), and the "midazolam equivalente" unit (requires
a real equivalence table or removal). The dead alert layer as an architecture is
**SUPERSEDE** — V2's alerting design replaces it; only the clinical content distilled above
survives.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
