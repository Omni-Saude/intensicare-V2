---
id: LEGREV-OSMS-CL-PROF
title: Legacy review — profilaxia rule cluster (8 rules) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule cluster profilaxia
  (8 rule records — stress-ulcer, VTE, glycemic, mobilization, device
  bundles), with a per-rule disposition table under
  docs/00-governance/legacy-import-policy.md §4.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/*/RULE-PROFILAXIA-*.md (8 files)
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
  hazards: [HAZ-0005, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Profilaxia rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Prescriptive dosing is embedded in alert text throughout (insulin NPH
> regimen, enoxaparin/heparin doses) — under the V2 intended-use posture
> (advisory, physician-owned) all such texts require pharmacist+physician
> ratification before display (HAZ-0036: output that reads as a directive).
> Rules 003/004 were previously verdicted VALIDATE by the ATE review —
> concordant. Legacy shard `profilaxia.yaml` proposes ADOPT 4 / ADAPT 2 /
> SUPERSEDE 2.

## Per-rule disposition table

| Rule ID | What it does (one line) | Verdict |
|---|---|---|
| RULE-PROFILAXIA-001 | Hyperglycemia texts: insulin NPH 0.3-0.5 U/kg/day divided 3x + correction scale (+1 U per 50 mg/dL above 150); IV-insulin alternative | VALIDATE — recognizable regimen; pharmacist ratification of doses mandatory |
| RULE-PROFILAXIA-002 | VTE dosing tree: enoxaparin 40 mg/day; creatinine > 2.0 or RRT → heparin 5000 U (8/8h in criterio_4, 12/12h in criterio_5); BMI > 40 → enoxaparin 60 mg/day | REFINE — internally inconsistent heparin frequency between criteria 4 and 5 must be resolved; values otherwise CHEST-style prophylaxis conventions |
| RULE-PROFILAXIA-003 | v1 alert aggregation: criterio_1 AMARELO; criteria 4/9 VERMELHO | VALIDATE (concordant ATE) — per-criterion mapping, not count |
| RULE-PROFILAXIA-004 | v3 alert aggregation: criterio_1 AMARELO; criterio_9 VERMELHO; NEUTRO resets assistido | VALIDATE (concordant ATE) — assistido reset noted for the acknowledgment-semantics review |
| RULE-PROFILAXIA-005 | criterio_1 SUP indicated-but-absent predicate (no PPI/cimetidine AND any of: noradrenaline, MV > 48 h (coded 50 h), platelets ≤ 50k, no diet > 24 h, high-risk diagnosis); implicit string concatenation fuses two diagnosis labels into one | REJECT as implemented — fused-diagnosis bug silently drops "Grande queimado" from the risk list; 50h vs 48h drift; the concept is the bundle's most valuable signal and must be rebuilt |
| RULE-PROFILAXIA-006 | criterio_9 invasive-device prescription trigger (CVC/dialysis catheter/indwelling urinary catheter) | VALIDATE |
| RULE-PROFILAXIA-007 | v1 recommendation catalog: SUP start/stop (incl. deprescribing note that in-hospital PPI raises nosocomial pneumonia risk), early mobilization, insertion bundles, device-dwell reassessment | VALIDATE — wording review; deprescribing arm is good stewardship |
| RULE-PROFILAXIA-008 | v3 facade returns only criteria 1 and 9; criteria 2-8 commented out | REFINE — silent reduction of the active criteria set must be an explicit versioned decision |

## Tally

VALIDATE 5 · REJECT 1 · REFINE 2 (= 8).
The cluster's key signal — stress-ulcer prophylaxis indicated but absent
(005) — is exactly what the V1 successor `domain_profilaxia.py` lost
entirely (its LAMGD bundle has no prophylaxis-prescribed member;
medication-safety-review.md §2). Rebuild 005's concept with corrected
mechanics as the bundle's headline criterion.
