---
id: LEGREV-OSMS-CL-NUT
title: Legacy review — nutricao rule cluster (11 rules) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule cluster nutricao
  (11 rule records), with a per-rule disposition table under
  docs/00-governance/legacy-import-policy.md §4.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/*/RULE-NUTRICAO-*.md (11 files)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; rule files individually hashed in the cycle-1 pin manifest)
  section_or_lines: whole cluster; upstream citations inherit the records' own audit provenance (NL-1)
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy organ-support and medication-safety forensics reviewer (cycle 1, Task 1, wave 1b)
  transformation: every rule record read; verdicts are this reviewer's proposals
  confidence: high (record contents) / medium (dispositions)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0021]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Nutricao rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> FOIS note (NL-2): RULE-NUTRICAO-002 is catalog content only — no runtime
> implementation exists anywhere in src/; the FOIS instrument itself is also
> RULE-CLINICAL-SCORING-018 (neuro-sedation-scores workstream owns the
> instrument review; this row disposes the nutrition-cluster copy).
> Legacy shard `nutricao.yaml` proposes ADOPT 8 / ADAPT 2 / SUPERSEDE 1.

## Per-rule disposition table

| Rule ID | What it does (one line) | Verdict |
|---|---|---|
| RULE-NUTRICAO-001 | BMI auto-calculation (kg / m²) live in the dietitian form | VALIDATE |
| RULE-NUTRICAO-002 | FOIS 7-level ordinal enum (nada por via oral → via oral sem restrições) | VALIDATE — enum text faithful; instrument ownership cross-check per NL-2 |
| RULE-NUTRICAO-003 | Nutrition pathway texts: do-not-suspend list, VRG > 500 mL/6h intolerance handling, diarrhea management incl. C. difficile branch, trophic 30 mL/h on malperfusion; equates noradrenaline 30 mL/h to 0.05 mcg/kg/min | REFINE — clinically coherent (ASPEN-style) but the mL/h→mcg/kg/min equivalence is concentration-dependent and must not be hardcoded; Metronidazol-first C. difficile choice needs ID review |
| RULE-NUTRICAO-004 | Nutrition alert color: AMARELO requires amarelo > 2 with only 2 members — unreachable | REJECT — unreachable severity band (concordant ATE) |
| RULE-NUTRICAO-005 | Nutrition-therapy form block (diet routes, acceptance, vomit/VRG/HGT ranges, prophylaxis enum) shared by nursing and dietitian forms | VALIDATE (concordant ATE) |
| RULE-NUTRICAO-006 | Stress-ulcer/nutrition prophylaxis indication enum incl. "VM > 72h" | VALIDATE — note the SUP literature's classic MV threshold is 48 h; the 72 h option needs clinical decision |
| RULE-NUTRICAO-007 | Dietitian daily objectives: route toggles reveal prescribed volumes | VALIDATE |
| RULE-NUTRICAO-008 | Height bounds 0-3 m | VALIDATE |
| RULE-NUTRICAO-009 | Intolerance/aversion enums with conditional description | VALIDATE |
| RULE-NUTRICAO-010 | Care-risk checklist with food-allergy detail reveal | VALIDATE |
| RULE-NUTRICAO-011 | Dietitian abdominal assessment enums (extended) | VALIDATE |

## Tally

VALIDATE 9 · REJECT 1 · REFINE 1 (= 11).
The cluster is mostly sound capture vocabulary; the single alerting rule
(004) has an unreachable AMARELO band, so the legacy nutrition pathway could
only ever alert VERMELHO-or-nothing.
