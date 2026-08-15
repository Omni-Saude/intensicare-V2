---
id: LEGREV-PATH-RESPIRATORIO
title: Legacy pathway review — Insuficiência Respiratória (respiratorio.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 acute-respiratory-failure pathway. SpO2/RR/PaCO2
  bands are consistent with the verified BTS 2017 oxygen guideline; the FiO2 band set
  starts at 21, so an FiO2 charted as a fraction (0.21-1.0) matches no band and
  evaluates normal — a live unit-convention false-normal vector. Proposed verdict
  VALIDATE.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/respiratorio.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (191 lines); SHA-256 9792ca62fc663d77315ae5e0ea41d9bbcb2b6bfa36c55eaeb42bb05533ad5d1e (pin manifest)
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: read in full; thresholds tabulated verbatim; verdict proposed
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0032, HAZ-0043]
supersedes: null
superseded_by: null
---

# Insuficiência Respiratória (`respiratorio`) — legacy review

## 1. Identity and structure

OBSERVED (`respiratorio.yaml:3-10`): id 12, slug `respiratorio`, version `3.0.1`,
active, mode hybrid. 4 inputs, 4 criteria (all graded → 4 band sets, 18 band rows),
5 states, suppression cooldown 15 min / rate 6/h.

Version note (`respiratorio.yaml:14-15`, verbatim comment): "NOTA: gaso_ph removido
(órfão — critério que o consuma pendente de autoria clínica; ver states.insuficiencia
sobre hipercapnia + pH < 7.35)" — arterial pH was removed for lack of clinical
authorship even though the state definitions still condition ventilatory failure on
pH < 7.35. Evaluated content and state semantics have drifted apart.

## 2. Clinical intent and target condition

SOURCE (`respiratorio.yaml:9`, verbatim): "Monitorização e manejo de insuficiência
respiratória aguda (IRpA) em pacientes críticos. Avaliação de oxigenação (SpO₂,
PaO₂/FiO₂), ventilação (PaCO₂, FR) e suporte ventilatório (VNI, VM)." Target: acute
respiratory failure — hypoxemic and hypercapnic. Note: the description promises
PaO2/FiO2, but no P/F input or criterion exists in this file (P/F lives only in
`ventilacao`).

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML. Manual enrollment; no `respiratorio` branch in
`check_pathway_eligibility` — generic fallback `eligible=True`
(`domain_trilhas_engine.py:359-362`).

## 4. Inputs (verbatim) and auto-sourcing

| name | source | unit | auto-sourced? |
|---|---|---|---|
| `spo2` | vitals_stream | % | **yes** (`pathway_auto_evaluation.py:145-146`) |
| `fr` | vitals_stream | irpm | **yes** (`respiratory_rate`) |
| `fio2` | vitals_stream | % | no |
| `gaso_paco2` | amh_gold | mmHg | no |

## 5. Criteria, band sets, thresholds (verbatim, `respiratorio.yaml:34-145`)

**crit-resp-spo2 — SpO₂** (graded, %):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 85) | critical | 3 | "Hipoxemia grave" |
| [85, 92) | urgent | 2 | "Hipoxemia moderada" |
| [92, 96) | normal | 0 | "SpO₂ adequada" |
| [96, +inf) | watch | 1 | "Hiperóxia — avaliar redução de FiO₂" |

**crit-resp-fr — Frequência Respiratória** (graded, irpm): [0,8) critical
"Bradipneia grave — risco de apneia"; [8,12) watch; [12,24) normal; [24,35) watch;
[35,+inf) urgent "Taquipneia grave — risco de falência".

**crit-resp-fio2 — FiO₂ Necessária** (graded, %): **[21**,40) normal; [40,60) watch;
[60,80) urgent "avaliar VNI/IOT"; [80,+inf) critical "SDRA grave".

**crit-resp-paco2 — PaCO₂** (graded, mmHg): [0,35) watch "Hipocapnia"; [35,45)
normal; [45,55) watch; [55,70) urgent; [70,+inf) critical "risco de narcose CO₂".

States: `initial` → `insuficiencia` → `suporte` → `recuperacao` → `alta` (terminal).

## 6. Timing / cadence

Declared hybrid; dead metadata (`engine-review.md` §3). Effective triggers:
vitals-ingestion hook (carries spo2 and fr) and manual PUT; fio2/gaso_paco2 have no
live source (partial surveillance presented as whole — the ventilation axis is
silent).

## 7. Missing-data behavior (HAZ-0005 lens) — and the FiO2 fraction vector

- Engine-generic silent-skip → `normal` (`trilhas_evaluator.py:388-397`, `472-481`).
- **FiO2 fraction-vs-percent false-normal (OBSERVED mechanism, INFERENCE on data
  convention):** the band set starts at lower bound 21 (%). The compiler's band
  lookup returns `met=False, severity normal` for any value below the lowest band
  (`trilhas_compiler.py:584-593`). FiO2 is routinely charted as a fraction
  (0.21-1.0) in ventilator data streams; every fractional value — including 1.0,
  i.e. 100% oxygen — falls below 21, matches no band, and evaluates **normal**. No
  unit checking exists at evaluation time to catch this (Gate A validates unit
  *strings* at build time only, `scripts/validate_alerts.py:62-87`). A patient on
  100% FiO2 charted as 1.0 reads "normal".
- SpO2 sourced from the latest persisted VitalSign with no freshness window
  (`pathway_auto_evaluation.py:131-146`) — stale readings evaluate as current.
- PaCO2 permanently pending (no source) → hypercapnic failure axis silent; combined
  with the removed pH input (§1), the `insuficiencia` state's own definition
  ("PaCO₂ > 50 com pH < 7.35") is unevaluable as implemented.

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors.

## 9. Guideline anchoring

OBSERVED (`respiratorio.yaml:184-185`): `guideline: "ARDSNet Protocol (2000); ATS/ERS
Guidelines on Acute Respiratory Failure; British Thoracic Society Guidelines on
Oxygen Therapy (2017)"`, `doi: 10.1136/thoraxjnl-2016-209729`. Crossref (2026-08-15):
O'Driscoll BR et al., "BTS guideline for oxygen use in adults in healthcare and
emergency settings", Thorax 2017 — **MATCH** (ARDSNet and "ATS/ERS" named without
DOI; "ATS/ERS Guidelines on Acute Respiratory Failure" is not identifiable as a
specific edition).

INFERENCE — implemented values vs. anchors (labeled inference): SpO2 target 92-96%
with a hyperoxia caution band >= 96% and the 88-92% caveat for hypercapnia risk (in
description text) follow BTS 2017 closely — the strongest threshold-to-anchor fit in
the portfolio. RR and PaCO2 bands are physiological convention (uncited as specific
values). The hypercapnia-risk population needs a *different* SpO2 band set (88-92%),
which the single-band-set model cannot express — a population-conditionality gap the
YAML acknowledges only in prose.

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): VALIDATE.**
Rationale: the best threshold-to-anchor fit among the twelve and two live inputs,
but the FiO2 fraction vector is a real false-normal trap, the ventilation axis is
unevaluable as wired, population-conditional SpO2 targets are unexpressed, and no
threshold has a named clinical author. Requires named owner, typed units, and
conditional-target design before any import decision. Not DECIDED; import blocked
until `legacy-import-policy.md` §3 is satisfied.
