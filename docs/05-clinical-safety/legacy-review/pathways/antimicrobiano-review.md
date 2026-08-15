---
id: LEGREV-PATH-ANTIMICROBIANO
title: Legacy pathway review — Antimicrobiano (antimicrobiano.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 antimicrobial-stewardship pathway. Duration/PCT
  logic is consistent with the cited IDSA/SHEA 2016 stewardship guideline (DOI
  verified MATCH), but two of four criteria are presence-firing booleans and no input
  is auto-sourced. Proposed verdict VALIDATE.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/antimicrobiano.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (144 lines); SHA-256 0ef987c51ad18ab9dea0123da1fec8c2c07b96833abe6a5ce9ee6db8e4e3758f (pin manifest)
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

# Antimicrobiano (`antimicrobiano`) — legacy review

## 1. Identity and structure

OBSERVED (`antimicrobiano.yaml:3-10`): id 8, slug `antimicrobiano`, version `3.0.0`,
active, mode near-real-time. 4 inputs, 4 criteria (2 graded band sets + 2 boolean;
8 band rows), 4 states, suppression cooldown 30 min / rate 4/h.

## 2. Clinical intent and target condition

SOURCE (`antimicrobiano.yaml:9`, verbatim): "Programa de Stewardship de
Antimicrobianos (ASP) em UTI. Monitorização de duração de antibioticoterapia, revisão
diária, descalonamento guiado por biomarcadores (PCT) e culturas." — ICU antimicrobial
stewardship: therapy-duration surveillance, structured review, PCT/culture-guided
de-escalation.

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML. Manual enrollment (`pathway_enrollment.enroll_patient`).
No `antimicrobiano` branch in `check_pathway_eligibility`; generic fallback returns
`eligible=True` with or without data (`domain_trilhas_engine.py:359-362`).

## 4. Inputs (verbatim)

| name | source | unit | description (summarized) |
|---|---|---|---|
| `atb_dias` | amh_gold | dias | days of ongoing antibiotic therapy |
| `pct` | amh_gold | ng/mL | procalcitonin, de-escalation biomarker |
| `culturas_resultado` | amh_gold | ratio | culture result with antibiogram available (true) |
| `descalonamento_status` | amh_gold | ratio | de-escalation/stop performed (true) |

Auto-sourcing (OBSERVED): **none** — `_build_generic_vitals_inputs`
(`pathway_auto_evaluation.py:113-158`) provides no matching key. All criteria remain
pending unless manually PUT (HAZ-0043 shape: permanently unevaluated, displayed
normal).

## 5. Criteria, band sets, thresholds (verbatim, `antimicrobiano.yaml:32-105`)

**crit-atb-duracao — Duração da Antibioticoterapia** (graded, dias):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 3) | normal | 0 | "Início de antibioticoterapia" |
| [3, 7) | watch | 1 | "Revisão de antibioticoterapia indicada" |
| [7, 10) | urgent | 2 | "Reavaliação obrigatória — risco de uso prolongado" |
| [10, +inf) | critical | 3 | "Uso prolongado — descalonar ou justificar" |

**crit-atb-pct — Procalcitonina para Descalonamento** (graded, ng/mL):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 0.25) | normal | 0 | "PCT normal — provável resolução" |
| [0.25, 0.5) | watch | 1 | "PCT em queda — considerar descalonamento" |
| [0.5, 2.0) | urgent | 2 | "PCT elevada — manter antibioticoterapia" |
| [2.0, +inf) | critical | 3 | "PCT muito elevada — investigar foco" |

**crit-atb-cultura** (boolean): fires (urgent, hard-coded) when culture results ARE
available. **crit-atb-descalonamento** (boolean): fires (urgent) when de-escalation
WAS performed. INFERENCE: both are presence-firing "good news" notifications carrying
the same severity token as deterioration alerts — severity-semantics pollution
(cf. `profilaxia-review.md` §7; the harmful-state direction, "cultures back but no
de-escalation action", is not representable without `negate`, which this file never
uses).

States: `initial` → `revisao_72h` → `descalonamento` → `alta` (terminal).

## 6. Timing / cadence

Declared near-real-time; dead metadata (`engine-review.md` §3). Effective triggers:
vitals-ingestion hook (sources nothing here) and manual PUT. Note the 72h-review
concept lives only in state descriptions — no temporal predicate enforces it (the
engine has temporal predicates; this file uses none).

## 7. Missing-data behavior (HAZ-0005 lens)

Engine-generic: absent input → criterion silently skipped → `overall_severity normal`
(`trilhas_evaluator.py:388-397`, `472-481`); non-numeric graded input → normal
(`trilhas_compiler.py:565-575`); enrollment severity of all-pending = normal
(`pathway_enrollment.py:779-780`). Pathway-specific: since nothing auto-sources these
inputs, the realistic steady state is *all* criteria permanently pending — an ASP
pathway that displays as active/normal while auditing nothing.

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors.

## 9. Guideline anchoring

OBSERVED (`antimicrobiano.yaml:137-139`): `guideline: "IDSA/SHEA Guidelines for
Implementing an Antibiotic Stewardship Program (2016); SSC-2021 Antimicrobial
Recommendations"`, `doi: 10.1093/cid/ciw118`. Crossref (2026-08-15): Barlam TF et
al., "Implementing an Antibiotic Stewardship Program", Clin Infect Dis 2016 —
**MATCH**.

INFERENCE — implemented values vs. the cited anchor (labeled inference, not V1's
claim): the 48-72h structured review (`evidence.recommendations` line 141; watch band
opening at day 3) is consistent with IDSA/SHEA 2016 stewardship interventions
(antibiotic time-outs) and SSC-2021's daily de-escalation assessment. PCT-guided
discontinuation (<0.5 ng/mL, or the description's "redução >80% do pico",
`antimicrobiano.yaml:62`) is consistent with the PCT literature the stewardship
guideline reviews (e.g. de Jong E et al., SAPS trial, Lancet Infect Dis
2016;16(7):819-827 — proposal-level anchor for V2). The hard duration bands
(7/10 days) are an authoring choice: no guideline sets universal day cut-offs across
indications; band labels acknowledge this ("descalonar **ou justificar**"). Fixed
bands ignore indication-specific durations (e.g. endocarditis, osteomyelitis) —
a false-urgency vector for legitimately long courses.

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): VALIDATE.**
Rationale: intent and numeric content are plausible and the citation is real and
apposite, but duration cut-offs are uncited authoring choices needing stewardship
sign-off, the boolean criteria need directional redesign, and no data source exists.
Requires named clinical owner + empirical validation before any import decision. Not
DECIDED; import blocked until `legacy-import-policy.md` §3 is satisfied.
