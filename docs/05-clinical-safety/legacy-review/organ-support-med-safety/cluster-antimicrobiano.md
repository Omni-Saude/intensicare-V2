---
id: LEGREV-OSMS-CL-AM
title: Legacy review — antimicrobiano rule cluster (3 rules) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule cluster antimicrobiano
  (3 rule records — stewardship alert colors and the 12-criteria catalog),
  with a per-rule disposition table under
  docs/00-governance/legacy-import-policy.md §4.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/*/RULE-ANTIMICROBIANO-*.md (3 files)
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
  hazards: [HAZ-0019, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Antimicrobiano rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Rules 001/002 were previously verdicted by the ATE review (001 VALIDATE,
> 002 REJECT); this file diverges on 001 and records why. Legacy shard
> `antimicrobiano.yaml` proposes SUPERSEDE / RETIRE / ADAPT respectively —
> its SUPERSEDE reasoning for 001 (V2 severity scale over the full
> 12-criterion catalog) matches this review.

## Per-rule disposition table

| Rule ID | What it does (one line) | Verdict |
|---|---|---|
| RULE-ANTIMICROBIANO-001 | Active alert color (calcular_alerta_v2): AMARELO {3,5,6}, VERMELHO {4,8} over only 5 of 12 stewardship criteria; NEUTRO resets assistido | SUPERSEDE — the arbitrary 5-criterion subset and legacy color enum are replaced by the full-catalog severity design (spec §3.7); DIVERGENCE: ATE proposed VALIDATE — recorded for the named reviewer; shard concurs with SUPERSEDE |
| RULE-ANTIMICROBIANO-002 | Legacy weighted alert variant (criterios > 3 → VERMELHO), not called by save() | REJECT — dead code (concordant ATE) |
| RULE-ANTIMICROBIANO-003 | 12-criteria stewardship catalog: duration > 7 d, spectrum escalation, weight/renal dose adjustment via S3 image tables (with a no-renal-adjust exception list: Polimixina B, Linezolida, Oxacilina, Tigeciclina, Clindamicina), duration review, administration delay, CVC > 7 d with fever, fever > 38.3 with CVC | VALIDATE — clinically coherent stewardship set; the S3-image dose tables are un-reviewable binary content and must be replaced by the versioned inline renal-dose table the pharmaco-interaction spec already defines (CON-0139); exception-list accuracy needs ID/pharmacist confirmation |

## Tally

VALIDATE 1 · REJECT 1 · SUPERSEDE 1 (= 3).
The stewardship criteria catalog is the keeper; both alert-color mappings
die with the legacy enum. Note the V1 successor `domain_antimicrobiano.py`
imported the criteria list but broke the evaluation entirely
(medication-safety-review.md §1).
