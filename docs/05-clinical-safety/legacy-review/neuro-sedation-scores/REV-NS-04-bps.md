---
id: REV-NS-04
title: Legacy review — BPS (Behavioral Pain Scale, 3-12)
label: PROPOSAL
statement: >
  V1 validates BPS 3-12 correctly; the forms engine computes it from the three Payen
  subscales but coerces any missing subscale to 1 (silently minimising pain), and pathway
  bands flag BPS 5 where Payen's actionable cutoff is >5. The predecessor catalog documents
  an unreachable severe band (10-12). Verdict: REFINE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_formularios.py; _work/alerts/pathways/sedacao.yaml
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

# REV-NS-04 — BPS (behavioural pain, 3-12)

## 1. As implemented (OBSERVED, verbatim)

| Path | Lines | SHA-256 | Manifest |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 125-128, 254-256 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/schemas/sedacao.py` | 44 | `bd432d9a5b4144380eaed1c6518b10465612c95d9d7e33468053114e0e44992d` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 771-823 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `_work/alerts/pathways/sedacao.yaml` | 58-78 | `21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-016-…md` | whole file | `863cb605485e37f13ca94bb8234728fe285fc073eeacde64b0ed281b76ef0d31` | MATCH |
| `docs/rules/clinical-scoring/RULE-BALANCO-HIDRICO-019-…md` | whole file | `5056d3e03695c79f56ef441b73a039fde594a828929b698338e053f471ca70e1` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEDACAO-001/-002-…md` | whole files | `c700d576905f0e8e344f98e8272b2ee6d48a7951ef5998d4daee74ce1e3d5560` / `8b99b8f2f18753264b4e6bdb360b358ea6f070a22054aa26a0b25ed6ef7cb0db` | MATCH |
| `docs/rules/clinical-scoring/RULE-PIORA-CLINICA-007-…md` | whole file | `023019ffb8119911085a6948aeafe1f3d9e039e44c69c2372a09796893278486` | MATCH |
| `tests/test_domain_formularios.py` | 334-352 | see README §4 | ABSENT (hash-noted) |

- Validator (`domain_sedacao.py:125-128`): `3 <= score <= 12`; violation raises
  (`:254-256`). Schema `ge=3, le=12`, nullable.
- Forms engine (`domain_formularios.py:796-810`), verbatim behaviour: three subscales
  `expressao_facial`, `membros_superiores`, `ventilacao_mecanica_indicador`, each clamped
  1-4; **all three `None` → `(None, None)`** (honest); **any subset missing → each missing
  subscale coerced to 1** (test name at `tests/test_domain_formularios.py:334`:
  "Missing BPS components default to 1 each"). Severity (`_bps_severity`, `:813-822`):
  `<=3 sem_dor / 4-6 dor_leve / 7-9 dor_moderada / >=10 dor_intensa`.
- Pathway (`sedacao.yaml:58-78`, bands lower-inclusive/upper-exclusive): `[3,5) normal /
  [5,8) watch "Dor moderada" / [8,∞) urgent "Dor intensa"`; description asserts "BPS ≥ 5
  indica dor presente".
- Predecessor catalog: 3-12 validator correct (RULE-CLINICAL-SCORING-016 identifies the
  scale unambiguously as BPS, not CPOT 0-8); NRS-vs-BPS branch by `dor` type
  (RULE-BALANCO-HIDRICO-019); institutional sub-bands 7-9 / 10-12 on two consecutive
  balances (RULE-SEDACAO-001/-002, within range); **RULE-PIORA-CLINICA-007 documents the
  severe band written `10 <= sinais > 12` — unsatisfiable under the 12 cap, so BPS 10-12
  scored "0" in the predecessor piora criterion (impact high).**
- CPOT: named as an alternative in `sedacao.yaml:138` (evidence recommendation) and as an
  example context key in `domain_pharmaco_delirium.py:126` (`cpot_score`), but **no CPOT
  implementation exists in V1 src** — BPS is the sole behavioural instrument implemented.

## 2. Published instrument (SOURCE)

- Payen JF et al. *Assessing pain in critically ill sedated patients by using a behavioral
  pain scale.* Crit Care Med. 2001;29(12):2258-2263. Three subscales (facial expression,
  upper-limb movements, compliance with ventilation), each 1-4; total 3 (no pain) to 12
  (maximum). The commonly operationalised actionable threshold is BPS > 5 (i.e. ≥ 6).
- Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — BPS (or CPOT) is the
  recommended behavioural pain instrument for non-communicative, mechanically ventilated
  adults.

## 3. Discrepancy analysis

| Dimension | Finding | Label |
|---|---|---|
| Range / subscales | 3-12 with three 1-4 subscales — matches Payen exactly. | OBSERVED |
| Cut-points | `sedacao.yaml` flags BPS 5 as "dor moderada" (watch); Payen's threshold is >5. One point more sensitive — institutional choice, not a numeric error, but it contradicts the file's own "BPS ≥ 5" description if bands were meant to encode >5. The 7-9/10-12 sub-bands (predecessor) and 4-6/7-9/≥10 severity map (forms) are institutional subdivisions with no published counterpart; internally consistent. | OBSERVED |
| Missing data | Partial submissions are silently minimised: one observed subscale plus two coerced 1s yields a plausible low total with no marker distinguishing it from a complete assessment — pain systematically understated in exactly the patients (sedated, ventilated) who cannot self-report. | OBSERVED |
| Applicability gating | BPS is validated for sedated/ventilated patients, yet nothing gates BPS use on ventilation status, and the forms engine defaults `tipo`→"bps" for any submission omitting the field (REV-NS-03 §3). Conversely nothing prevents BPS on a deeply-blocked (NMB) patient in whom behavioural scales are invalid. | OBSERVED / INFERENCE |
| Population | Adult instrument; no age gating (VAL-0006/0007, HAZ-0036). | INFERENCE |

## 4. HAZ-0005 zero-coercion check (from source)

**VIOLATION (floor-coercion variant).** `domain_formularios.py:804-806` coerces each missing
subscale to its floor (1 = "no pain" contribution), producing a valid-looking, minimised
total from an incomplete assessment — absence rendered as reassurance, the HAZ-0005
mechanism applied to pain. The all-missing → `(None, None)` branch is conformant. The
predecessor's unreachable 10-12 band (RULE-PIORA-CLINICA-007) is the same hazard class
already materialised (severe pain → "0").

## 5. Verdict

**REFINE** — the instrument encoding (3 subscales × 1-4, total 3-12) is correct and
importable; REJECT partial-subscale floor-coercion (a BPS with any untested subscale is
`not_evaluated` or `partial` under an explicit policy, never a silently minimised total);
require ventilation/communication-state gating of the NRS-vs-BPS choice; put the BPS-5
boundary and institutional sub-bands to clinical ratification; add the predecessor
`10 <= sinais > 12` misparse to V2's negative tests.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
