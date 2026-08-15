---
id: LEGREV-PATH-DELIRIUM
title: Legacy pathway review — Delirium (delirium.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 delirium pathway (PADIS-based). CAM-ICU/RASS
  structure is sound and the PADIS 2018 DOI verifies, but the file frames haloperidol
  as first-line — contrary to its own cited guideline — and its RASS severity bands
  contradict the sedacao pathway's bands for the same physiological value. Proposed
  verdict VALIDATE.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/delirium.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (129 lines); SHA-256 571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208 (pin manifest)
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

# Delirium (`delirium`) — legacy review

## 1. Identity and structure

OBSERVED (`delirium.yaml:3-10`): id 11, slug `delirium`, version `3.0.2`, active,
mode near-real-time. 3 inputs, 3 criteria (1 boolean + 2 graded → 2 band sets,
7 band rows), 4 states, suppression cooldown 60 min / rate 3/h.

Version note (`delirium.yaml:14-16`, verbatim comment): "NOTA: dexmedetomidina_dose
removido (órfão — critério que o consuma pendente de autoria clínica…)" — an input
was removed because no clinician authored a consuming criterion. Direct evidence of
absent clinical authorship in the lifecycle (same pattern as renal, equilibrio,
respiratorio, sedacao).

## 2. Clinical intent and target condition

SOURCE (`delirium.yaml:9`, verbatim): "Prevenção, detecção e manejo de delirium em
pacientes críticos conforme diretrizes PADIS 2018. Screening diário com CAM-ICU,
manejo não farmacológico e farmacológico quando indicado." Target: ICU delirium
(hyperactive, hypoactive, mixed).

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML. Manual enrollment; no `delirium` branch in
`check_pathway_eligibility` — generic fallback `eligible=True`
(`domain_trilhas_engine.py:359-362`).

## 4. Inputs (verbatim)

| name | source | unit | description (summarized) |
|---|---|---|---|
| `cam_icu` | vitals_stream | ratio | CAM-ICU positive/negative |
| `rass_target` | vitals_stream | points | RASS agitation/sedation assessment |
| `haloperidol_dose` | amh_gold | mg/dia | daily haloperidol dose |

Auto-sourcing (OBSERVED, decisive detail): `_build_generic_vitals_inputs` emits the
key `rass_score` (from `SedationAssessment.rass_score`,
`pathway_auto_evaluation.py:154-156`) — but this pathway's input is named
**`rass_target`**. The names do not match, so the RASS criterion is **never
auto-evaluated** despite the datum being persisted and flowing. `cam_icu` and
`haloperidol_dose` have no auto source either. All three criteria are effectively
manual-PUT-only (HAZ-0043 shape).

## 5. Criteria, band sets, thresholds (verbatim, `delirium.yaml:31-89`)

**crit-del-cam — CAM-ICU** (boolean): fires (urgent, hard-coded severity;
`trilhas_compiler.py:614-619`) when CAM-ICU is positive. Correct direction (the
harm state fires) — unlike profilaxia's booleans.

**crit-del-agitacao — Agitação (RASS)** (graded, points):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [-5, -1) | watch | 1 | "Sedação ou hipoatividade — delirium hipoativo?" |
| [-1, 1) | normal | 0 | "Calmo e cooperativo" |
| [1, 3) | urgent | 2 | "Agitação moderada — investigar delirium" |
| [3, +inf) | critical | 3 | "Agitação grave — risco de autoextubação" |

**crit-del-haloperidol — Dose de Haloperidol** (graded, mg/dia): [0,5) normal,
[5,15) watch "monitorizar ECG", [15,+inf) urgent "risco de cardiotoxicidade".

States: `initial` (Prevenção e Screening) → `delirium_identificado` → `tratamento` →
`alta` (terminal, "CAM-ICU negativo por >48h…" — the 48h condition exists only as
state prose; no temporal predicate enforces it).

## 6. Timing / cadence

Declared near-real-time; dead metadata (`engine-review.md` §3). Effective triggers:
vitals-ingestion hook (sources nothing here — see §4 name mismatch) and manual PUT.

## 7. Missing-data behavior (HAZ-0005 lens)

Engine-generic silent-skip → `normal` applies (`trilhas_evaluator.py:388-397`,
`472-481`). Pathway-specific: a hypoactive-delirium patient whose CAM-ICU was simply
never charted is indistinguishable from CAM-ICU-negative — for a condition whose
hypoactive form is precisely the one that presents as quiet, the silent-normal
default is maximally aligned with the clinical failure mode (false reassurance,
HAZ-0005). RASS values below -5 are impossible on the scale, so the
below-lowest-band → normal vector (`trilhas_compiler.py:584-593`) is not clinically
reachable here.

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors.

## 9. Guideline anchoring

OBSERVED (`delirium.yaml:122-123`): `guideline: "PADIS Guidelines… (CCM 2018)"`,
`doi: 10.1097/CCM.0000000000003299`. Crossref (2026-08-15): Devlin JW et al., PADIS
guideline, Crit Care Med 2018 — **MATCH**.

INFERENCE — implemented values vs. the cited anchor (labeled inference):

- **Agree:** daily CAM-ICU screening; non-pharmacologic prevention (ABCDEF bundle
  named in `evidence.recommendations`); avoiding benzodiazepines; dexmedetomidine
  for agitated patients needing sedation — all consistent with PADIS 2018.
- **Disagree (material):** `crit-del-haloperidol`'s description calls haloperidol
  "Antipsicótico de primeira linha para delirium hiperativo" (`delirium.yaml:72`).
  PADIS 2018 — the file's own anchor — recommends **against** routine antipsychotic
  use to treat delirium (conditional recommendation). Dose-safety monitoring (QT
  risk) is defensible; the "first line" framing is not supported by the cited source.
- **Cross-pathway contradiction (OBSERVED):** for the same physiological value,
  RASS -4 is `watch` here but `critical` in `sedacao.yaml` (crit-sed-rass band
  [-5,-3) critical). Two active pathways can simultaneously classify one RASS
  reading one and three severity levels apart — a correlated-alert/consistency
  hazard (HAZ-0016 shape) that any V2 successor must reconcile explicitly.

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): VALIDATE.**
Rationale: structurally sound screening pathway with a real, apposite anchor and the
correct boolean direction; but the haloperidol framing contradicts the cited
guideline, the RASS bands conflict with sedacao's, the input naming defeats the only
live data path, and no criterion or threshold has a named clinical author. Requires
clinical ratification and reconciliation before any import decision. Not DECIDED;
import blocked until `legacy-import-policy.md` §3 is satisfied.
