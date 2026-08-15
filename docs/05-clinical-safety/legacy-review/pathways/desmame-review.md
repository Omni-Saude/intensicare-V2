---
id: LEGREV-PATH-DESMAME
title: Legacy pathway review — Desmame (desmame.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 ventilator-weaning pathway. RSBI/NIF/Glasgow
  thresholds are broadly consistent with the cited 2001 ACCP/SCCM/AARC/ATS weaning
  guideline (DOI verified MATCH); the secondary citation "BURN Trial (2016)" is
  unidentifiable. Three of six criteria are presence-firing booleans. Proposed
  verdict VALIDATE.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/desmame.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (178 lines); SHA-256 808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a (pin manifest)
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

# Desmame (`desmame`) — legacy review

## 1. Identity and structure

OBSERVED (`desmame.yaml:3-10`): id 3, slug `desmame`, version `3.0.0`, active, mode
hybrid. 6 inputs, 6 criteria (3 graded band sets + 3 boolean; 9 band rows), 4 states,
suppression cooldown 30 min / rate 4/h.

## 2. Clinical intent and target condition

SOURCE (`desmame.yaml:9`, verbatim): "Protocolo de desmame ventilatório baseado em
evidências. Avaliação sistemática de prontidão, teste de respiração espontânea (TRE),
extubação e monitorização pós-extubação." Target: readiness assessment and conduct of
ventilator weaning through post-extubation.

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML. Manual enrollment. Advisory eligibility Rule 17
(`domain_trilhas_engine.py:297-316`): eligible when patient-data keys intersect
`{mecanica, rsbi, nif, crit-des-frvt, crit-des-nif}` OR `{neurologico, glasgow,
crit-des-glasgow}`; `eligible=True` presumption with no data.

## 4. Inputs (verbatim)

| name | source | unit | note |
|---|---|---|---|
| `rsbi` | amh_gold | ratio | RSBI = RR/Vt(L) |
| `nif` | amh_gold | cmH2O | negative inspiratory force |
| `glasgow` | vitals_stream | ratio | GCS 3-15 |
| `tosse_eficaz` | vitals_stream | ratio | effective cough (true) |
| `controle_secrecao` | vitals_stream | ratio | secretion control adequate (true) |
| `gasometria_status` | amh_gold | ratio | post-extubation blood gas stable (true) |

Auto-sourcing (OBSERVED): **none** of the six is provided by
`_build_generic_vitals_inputs` (`pathway_auto_evaluation.py:113-158`); all criteria
are manual-PUT-only (HAZ-0043 shape). Unit-notation inconsistency: `glasgow` declares
input unit `ratio` but predicate unit `dimensionless` — cosmetic here (the engine
never checks units at evaluation), symptomatic of unit strings being decorative.

## 5. Criteria, band sets, thresholds (verbatim, `desmame.yaml:40-138`)

**crit-des-frvt — FR/Vt (RSBI)** (graded, ciclos/min/L):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 80) | normal | 0 | "Alta probabilidade de sucesso" |
| [80, 105) | watch | 1 | "Zona de atenção" |
| [105, +inf) | critical | 3 | "Alto risco de falha no desmame" |

**crit-des-nif — NIF** (graded, cmH2O):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [-100, -25) | normal | 0 | "Força inspiratória adequada" |
| [-25, -20) | watch | 1 | "Força inspiratória limítrofe" |
| [-20, +inf) | critical | 3 | "Fraqueza muscular inspiratória" |

OBSERVED edge: a NIF stronger than -100 cmH2O (e.g. -110) falls below the lowest
band's lower bound, matches no band, and returns `normal` by the compiler's
no-band-matched guard (`trilhas_compiler.py:584-593`) — benign in this direction, but
it demonstrates that band sets do not actually partition the real line; only [lowest
lower bound, +inf) is covered (the CI Gate B check starts at the first band's lower
bound, `scripts/validate_alerts.py:241-243`).

**crit-des-glasgow — Escala de Glasgow** (graded, dimensionless): [11,+inf) normal
"Nível de consciência adequado"; [9,11) watch; [0,9) critical "Rebaixamento
importante — risco de falha".

Booleans (each fires urgent when TRUE — i.e., when the favorable state is present):
`crit-des-tosse` (effective cough), `crit-des-secrecao` (secretion control),
`crit-des-gasometria` (post-extubation gas stable). INFERENCE: these are
readiness-signal notifications; unlike profilaxia the fired state is not a harm
state, but the severity token `urgent` on good news pollutes severity semantics, and
the harm direction (no cough, excessive secretions, deranged gas) is silent.

States: `initial` (Avaliação de Prontidão) → `tps` (Teste de Respiração Espontânea)
→ `extubacao` (Pós-Extubação) → `alta` (terminal, "ar ambiente… por >48h" — prose
only, no temporal predicate).

## 6. Timing / cadence

Declared hybrid; dead metadata (`engine-review.md` §3). Effective triggers:
vitals-ingestion hook (sources nothing here) and manual PUT. The daily
readiness-assessment cadence exists only in state prose.

## 7. Missing-data behavior (HAZ-0005 lens)

Engine-generic silent-skip → `normal` (`trilhas_evaluator.py:388-397`, `472-481`).
Pathway-specific: an unassessed RSBI/NIF and an excellent RSBI/NIF are rendered
identically; a weaning decision surface built on this pathway would show "normal"
for a patient whose readiness was never measured. Non-numeric RSBI (e.g. a free-text
entry) → normal (`trilhas_compiler.py:565-575`).

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors.

## 9. Guideline anchoring

OBSERVED (`desmame.yaml:171-172`): `guideline: "ACCP/SCCM/AARC/ATS Evidence-Based
Guidelines for Weaning and Discontinuing Ventilatory Support (2001); BURN Trial
(2016)"`, `doi: 10.1378/chest.120.6_suppl.375S`. Crossref (2026-08-15): MacIntyre NR
et al., "Evidence-Based Guidelines for Weaning and Discontinuing Ventilatory
Support", Chest 2001 — **MATCH**. "BURN Trial (2016)" — **UNIDENTIFIABLE**: no
primary source of that name and year could be located; flagged as an unverifiable
citation fragment.

INFERENCE — implemented values vs. the cited anchor (labeled inference):

- **Agree:** RSBI < 105 as the classic Yang-Tobin success threshold (the [80,105)
  caution zone is a reasonable authoring refinement); SBT of 30-120 min on T-piece or
  PSV 5-7 cmH2O (state prose) matches the 2001 guideline; daily readiness screening
  matches.
- **Authoring choices without cited basis:** NIF -20/-25 cut-points (literature
  commonly uses more-negative-than -20 to -30 as a weak predictor); Glasgow >= 11
  (published extubation-readiness thresholds vary, commonly GCS >= 8-13); the 48h
  post-extubation stability window.
- The 2001 anchor is 24 years old at pin time; a V2 successor should anchor to the
  contemporary weaning literature (e.g. ATS/ACCP 2017 liberation guidelines —
  Ouellette DR et al., Chest 2017;151(1):166-180 — proposal-level anchor, not V1's
  citation).

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): VALIDATE.**
Rationale: the readiness parameters and thresholds are recognizably drawn from real
weaning literature and the primary citation verifies, but several cut-points are
uncited authoring choices, the boolean direction/severity semantics need redesign,
the anchor is outdated, and no input has a live source. Requires a named clinical
owner and evidence refresh before any import decision. Not DECIDED; import blocked
until `legacy-import-policy.md` §3 is satisfied.
