---
id: LEGREV-PATH-ESTABILIDADE
title: Legacy pathway review — Estabilidade Hemodinâmica (estabilidade.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 hemodynamic-stability pathway. MAP/lactate/
  vasopressor bands are consistent with SSC-2021 and the verified ESICM 2014 shock
  consensus; three of four inputs are auto-sourced (the most of any non-sepse
  pathway), but lactate is not, so the perfusion axis is silent in practice.
  Proposed verdict VALIDATE.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/estabilidade.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (171 lines); SHA-256 bf61744c263f40f630931293fcf4fc95b90e573609390abee42d37c7b3c5bcc9 (pin manifest)
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

# Estabilidade Hemodinâmica (`estabilidade`) — legacy review

## 1. Identity and structure

OBSERVED (`estabilidade.yaml:3-10`): id 5, slug `estabilidade`, version `3.0.0`,
active, mode near-real-time. 4 inputs, 4 criteria (all graded → 4 band sets, 15 band
rows), 4 states, suppression cooldown 15 min / rate 6/h (the tightest cadence
tolerance alongside respiratorio and sepse).

## 2. Clinical intent and target condition

SOURCE (`estabilidade.yaml:9`, verbatim): "Monitorização contínua da estabilidade
hemodinâmica em pacientes críticos. Avaliação de PAM, frequência cardíaca, perfusão
tecidual (lactato) e uso de vasopressores conforme diretrizes da Surviving Sepsis
Campaign e ESICM." Target: shock/instability surveillance in ICU patients.

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML. Manual enrollment; no `estabilidade` branch in
`check_pathway_eligibility` — generic fallback `eligible=True`
(`domain_trilhas_engine.py:359-362`).

## 4. Inputs (verbatim) and auto-sourcing

| name | source | unit | auto-sourced by `_build_generic_vitals_inputs`? |
|---|---|---|---|
| `pam` | vitals_stream | mmHg | **yes** — `map_value`, else derived from SBP/DBP (`pathway_auto_evaluation.py:133-138`) |
| `fc` | vitals_stream | bpm | **yes** — `heart_rate` |
| `lactato` | amh_gold | mmol/L | **no** — not provided by the generic builder |
| `vasopressor_dose` | amh_gold | mcg/kg/min | **yes** — `vasopressor_dose_mcg_kg_min` |

This is the best-wired non-sepse pathway (3 of 4 inputs live). The absent one —
lactate — is the perfusion axis its own description calls decisive.

## 5. Criteria, band sets, thresholds (verbatim, `estabilidade.yaml:32-131`)

**crit-est-pam — PAM** (graded, mmHg): [0,55) critical "Hipotensão grave — risco de
choque"; [55,65) urgent; [65,+inf) normal "PAM adequada".

**crit-est-fc — Frequência Cardíaca** (graded, bpm):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 50) | critical | 3 | "Bradicardia grave" |
| [50, 60) | watch | 1 | "Bradicardia leve" |
| [60, 100) | normal | 0 | "FC normal" |
| [100, 130) | watch | 1 | "Taquicardia leve" |
| [130, +inf) | urgent | 2 | "Taquicardia significativa" |

**crit-est-lactato — Lactato Sérico** (graded, mmol/L): [0,2.0) normal, [2.0,4.0)
watch "Hiperlactatemia moderada", [4.0,+inf) critical "Hipoperfusão grave / choque".

**crit-est-vasopressor — Dose de Vasopressor** (graded, mcg/kg/min): [0,0.1) normal,
[0.1,0.3) watch, [0.3,0.5) urgent "choque em evolução", [0.5,+inf) critical "choque
refratário".

States: `initial` → `ajuste` → `estabilizacao` → `alta` (terminal, ">24h sem
vasopressores, lactato normal" — prose only).

## 6. Timing / cadence

Declared near-real-time; dead metadata (`engine-review.md` §3). Effective triggers:
vitals-ingestion hook — which for this pathway actually carries three inputs — and
manual PUT. Suppression: 15 min cooldown per criterion; OBSERVED consequence: after
a MAP-critical firing, further MAP firings are suppressed for 15 min and a suppressed
firing is excluded from `overall_severity` (`trilhas_evaluator.py:469-481`) — a
persisting hypotension can read `normal` at the alert-aggregate level during the
cooldown window.

## 7. Missing-data behavior (HAZ-0005 lens)

Engine-generic silent-skip → `normal` (`trilhas_evaluator.py:388-397`, `472-481`).
Pathway-specific: (a) lactate is never auto-sourced, so the shock-defining criterion
is permanently silent unless manually PUT — the pathway degrades, silently, to a
MAP/HR/vasopressor monitor while claiming perfusion surveillance; (b) the MAP
derivation feeds from the LATEST persisted VitalSign row with **no freshness window**
(`pathway_auto_evaluation.py:131-138` uses `_fetch_latest_vital` — latest by
timestamp, unlimited age): an hours-old MAP evaluates as current (stale-input
hazard, `engine-review.md` §4); (c) overlap: MAP<65, vasopressor dose, and lactate
duplicate sepse and respiratorio inputs — correlated alerts on the same physiological
event (HAZ-0016; candidate-inventory §3 overlap cluster).

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors.

## 9. Guideline anchoring

OBSERVED (`estabilidade.yaml:164-165`): `guideline: "Surviving Sepsis Campaign 2021;
ESICM Consensus on Circulatory Shock and Hemodynamic Monitoring (2014)"`,
`doi: 10.1007/s00134-014-3525-z`. Crossref (2026-08-15): Cecconi M et al.,
"Consensus on circulatory shock and hemodynamic monitoring. Task force of the
European Society of Intensive Care Medicine", Intensive Care Med 2014 — **MATCH**.

INFERENCE — implemented values vs. anchors (labeled inference): MAP >= 65 mmHg as
the resuscitation target and lactate > 2 / >= 4 mmol/L thresholds agree with
SSC-2021 and Sepsis-3 usage; norepinephrine-equivalent dose banding (0.1/0.3/0.5
mcg/kg/min) matches common shock-severity conventions (e.g. high-dose thresholds in
refractory-shock literature) but carries no cited basis for those specific
cut-points; HR bands are physiological convention, uncited. The [55,65) "urgent"
(not critical) choice under-weights profound hypotension relative to the same file's
own lactate>=4 = critical framing — an internal severity-calibration question for
clinical review.

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): VALIDATE.**
Rationale: the most defensible and best-wired non-sepse definition — thresholds
match verified anchors and inputs mostly flow — but the perfusion axis is silent in
practice, stale inputs evaluate as current, cooldown can mask persisting hypotension
at the aggregate level, and no threshold has a named clinical author. Requires named
owner, lactate sourcing decision, and staleness policy before any import. Not
DECIDED; import blocked until `legacy-import-policy.md` §3 is satisfied.
