---
id: LEGREV-OSMS-CL-EQ
title: Legacy review — equilibrio rule cluster (4 rules) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule cluster equilibrio
  (4 rule records — fluid/electrolyte balance alerting and rescue-protocol
  texts), with a per-rule disposition table under
  docs/00-governance/legacy-import-policy.md §4.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/*/RULE-EQUILIBRIO-*.md (4 files)
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
  hazards: [HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Equilibrio rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> All four rules embed prescriptive treatment protocols in alert text
> (drug substitutions, hyperkalemia rescue dosing) — HAZ-0036 gating: no
> such text may render in V2 without pharmacist+physician ratification.
> Rules 001/003 were previously verdicted VALIDATE by the ATE review —
> concordant. Legacy shard `equilibrio.yaml` proposes ADAPT 2 /
> ADOPT-CORRECTED 1 / SUPERSEDE 1.

## Per-rule disposition table

| Rule ID | What it does (one line) | Verdict |
|---|---|---|
| RULE-EQUILIBRIO-001 | Criteria 1-4 texts: 24h balance > +3000 mL, accumulated positive balance, unnecessary maintenance fluids, falling diuresis — each with de-resuscitation recommendations | VALIDATE (concordant ATE) — coherent de-resuscitation bundle; wording review |
| RULE-EQUILIBRIO-002 | Criteria 5-8/10 texts: nephrotoxic substitutions (cefepime→pip-tazo, vancomycin→linezolid, ACEi/ARB→calcium-channel blocker), morphine avoidance in renal impairment (→ fentanyl/ketamine/methadone), hypernatremia Na > 160 correction (filtered water 400 mL 6/6h; NaCl 0.22% at 84 mL/h) | REFINE — substitution pairs and fixed infusion rates are institution-specific prescriptive content requiring ID+pharmacist re-derivation; morphine-metabolite caution is sound |
| RULE-EQUILIBRIO-003 | v1 alert color: AMARELO {3,6,8}, VERMELHO {1,9}; get_detalhe surfaces criteria [1,3,6,8,9] only | VALIDATE (concordant ATE) — per-criterion mapping; surfaced-subset mismatch noted for rebuild |
| RULE-EQUILIBRIO-004 | Severe hyperkalemia K > 6 rescue: calcium gluconate, furosemide 60 mg IV, polarizing solution, inhaled beta-agonist q15min ×3; +4h reassessment, if K > 5.5 repeat + bicarbonate 8.4% 1 mL/kg + oral exchange resin; source writes the K unit as "mg/dl" | VALIDATE — recognizable hyperkalemia bundle (shift + eliminate); unit typo (should be mmol/L or mEq/L) and every dose require pharmacist ratification; catalog cross-ref: electrolyte.yaml RULE-EQUILIBRIO-004 rule_ref anchors the rescue bundle |

## Tally

VALIDATE 3 · REFINE 1 (= 4).
Small cluster of treatment-protocol text; nothing imports as logic — the
alerting thresholds this cluster references (balance +3000 mL, K > 6,
Na > 160) are re-derived with citations in hemodynamics.yaml and
electrolyte.yaml.
