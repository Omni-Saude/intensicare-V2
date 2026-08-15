---
id: LEGREV-PATH-SEDACAO
title: Legacy pathway review — Sedação (sedacao.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 sedation-management pathway. RASS/BPS bands are
  consistent with the verified PADIS 2018 anchor; its RASS severity classification
  contradicts the delirium pathway's for identical values; RASS is the only
  auto-sourced input. Proposed verdict VALIDATE.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/sedacao.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (140 lines); SHA-256 21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657 (pin manifest)
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: read in full; thresholds tabulated verbatim; verdict proposed
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0016, HAZ-0043]
supersedes: null
superseded_by: null
---

# Sedação (`sedacao`) — legacy review

## 1. Identity and structure

OBSERVED (`sedacao.yaml:3-10`): id 6, slug `sedacao`, version `3.0.2`, active, mode
near-real-time. 3 inputs, 3 criteria (all graded → 3 band sets, 10 band rows),
4 states, suppression cooldown 30 min / rate 4/h.

Version note (`sedacao.yaml:14-16`, verbatim comment): "NOTA: interrupcao_diaria
removido (órfão — critério que o consuma pendente de autoria clínica; ver
evidence.recommendations sobre interrupção diária da sedação / SAT)" — the daily
sedation-interruption input was removed for lack of clinical authorship while the
`interrupcao` state and the recommendations still describe SAT as core content.
Same authorship-gap pattern as renal/delirium/equilibrio/respiratorio.

## 2. Clinical intent and target condition

SOURCE (`sedacao.yaml:9`, verbatim): "Manejo estruturado da sedação em pacientes
críticos conforme diretrizes PADIS. Avaliação diária com RASS, adequação do nível de
sedação, prevenção de sedação excessiva e interrupção diária." Target: sedation
adequacy (avoiding over-sedation), pain assessment, daily awakening.

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML. Manual enrollment; no `sedacao` branch in
`check_pathway_eligibility` — generic fallback `eligible=True`
(`domain_trilhas_engine.py:359-362`).

## 4. Inputs (verbatim) and auto-sourcing

| name | source | unit | auto-sourced? |
|---|---|---|---|
| `rass_score` | vitals_stream | points | **yes** — `SedationAssessment.rass_score` (`pathway_auto_evaluation.py:154-156`) |
| `bps_score` | vitals_stream | points | no |
| `sedativo_dose` | amh_gold | mg/h | no |

Note: this pathway's input is named `rass_score` and therefore DOES match the generic
builder's key — unlike `delirium`, whose `rass_target` never matches
(`delirium-review.md` §4). The same physiological datum reaches one pathway and not
the other purely through input-name divergence.

## 5. Criteria, band sets, thresholds (verbatim, `sedacao.yaml:31-100`)

**crit-sed-rass — RASS (Nível de Sedação)** (graded, points):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [-5, -3) | critical | 3 | "Sedação profunda — risco de super-sedação" |
| [-3, -2) | watch | 1 | "Sedação moderada — avaliar redução" |
| [-2, 1) | normal | 0 | "Sedação adequada (alvo leve)" |
| [1, +inf) | urgent | 2 | "Agitação — necessita intervenção" |

**crit-sed-bps — BPS (Avaliação de Dor)** (graded, points): [3,5) normal "Sem dor
significativa"; [5,8) watch "Dor moderada"; [8,+inf) urgent "Dor intensa — necessita
analgesia". (BPS scale minimum is 3; values below 3 are unreachable on the true
scale, so the below-lowest-band → normal guard is not clinically reachable here.)

**crit-sed-infusao — Dose de Sedativo Contínuo** (graded, mg/h, midazolam
equivalent): [0,3) normal; [3,10) watch "avaliar desmame"; [10,+inf) urgent "risco
de acúmulo".

States: `initial` → `ajuste` → `interrupcao` (Interrupção Diária / SAT) → `alta`
(terminal, "RASS adequado (0 a -1), sem infusão contínua…").

## 6. Timing / cadence

Declared near-real-time; dead metadata (`engine-review.md` §3). Effective triggers:
vitals-ingestion hook (carries RASS only — the hook fires on VitalSign ingestion, and
RASS rides along from the latest persisted SedationAssessment regardless of its age)
and manual PUT. No freshness window: a days-old RASS evaluates as current.

## 7. Missing-data behavior (HAZ-0005 lens)

Engine-generic silent-skip → `normal` (`trilhas_evaluator.py:388-397`, `472-481`).
Pathway-specific: pain (BPS) and sedative dose are permanently pending in practice —
the pathway degrades to a RASS-only monitor while presenting as a PADIS
sedation-and-analgesia pathway. An unassessed deeply sedated patient (no RASS
charted) reads `normal` — over-sedation is exactly the state least likely to
generate charting, which aligns the silent-normal default with the harm direction.
Cross-pathway contradiction (OBSERVED, decisive for consistency review): RASS -4 is
`critical` here and `watch` in `delirium.yaml` (crit-del-agitacao band [-5,-1)) —
identical value, three severity levels apart, both pathways active simultaneously on
the same patient is possible (HAZ-0016 shape).

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors.

## 9. Guideline anchoring

OBSERVED (`sedacao.yaml:133-134`): `guideline: "PADIS Guidelines… (CCM 2018)"`,
`doi: 10.1097/CCM.0000000000003299`. Crossref (2026-08-15): Devlin JW et al., PADIS
2018, Crit Care Med — **MATCH**.

INFERENCE — implemented values vs. anchor (labeled inference): light-sedation target
RASS -2 to 0, systematic pain assessment with BPS (or CPOT), daily SAT, and
benzodiazepine avoidance (recommendations text) all follow PADIS 2018 faithfully.
The sedative-dose bands (3/10 mg/h midazolam-equivalent) are authoring choices
without a cited basis, and "midazolam equivalent" conversion is undefined anywhere
in the file — an unstated conversion table is itself clinical content requiring
authorship. The deep-sedation band [-5,-3) = critical is defensible under PADIS's
association of deep sedation with worse outcomes but is a classification the
delirium pathway contradicts (§7).

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): VALIDATE.**
Rationale: faithful PADIS structure with a verified anchor and one genuinely live
input, but the SAT core content was silently de-scoped, the dose bands and
equivalence conversion are unauthored, staleness is unhandled, and the RASS severity
contradiction with delirium must be reconciled by a clinical owner. Not DECIDED;
import blocked until `legacy-import-policy.md` §3 is satisfied.
