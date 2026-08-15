---
id: LEGREV-OSMS-CL-EFI
title: Legacy review — eficiencia rule cluster (12 rules) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule cluster eficiencia
  (12 rule records — transfusion appropriateness, discharge/step-down
  readiness, frailty, delirium risk, restraint), with a per-rule disposition
  table under docs/00-governance/legacy-import-policy.md §4.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/*/RULE-EFICIENCIA-*.md (12 files)
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
  hazards: [HAZ-0005, HAZ-0021, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Eficiencia rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Four of these rules (001/005/006/012) were previously verdicted by the
> alert-threshold-engine review; divergences are flagged inline. Legacy
> shard `eficiencia.yaml` proposes ADOPT 6 / ADAPT 5 / ADOPT-CORRECTED 1 —
> far more permissive than this review; delta for the named reviewer.

## Per-rule disposition table

| Rule ID | What it does (one line) | Verdict |
|---|---|---|
| RULE-EFICIENCIA-001 | v3 wired path computes only criteria 3/5/10 (others commented out); AMARELO {10,3}, VERMELHO {5}; NEUTRO resets assistido | REJECT — silently reduced criteria set on the live path; assistido reset couples severity to acknowledgment. DIVERGENCE: ATE review proposed VALIDATE; recorded for the named reviewer |
| RULE-EFICIENCIA-002 | criterio_3 RBC transfusion at Hb≥7 (restrictive-trigger breach); WIRED AMARELO; `getattr(...) or 0 >= 7` precedence bug makes the Hb comparison inert | REJECT — fires on any recorded Hb; exclusion filters (fromkeys) inert |
| RULE-EFICIENCIA-003 | criterio_4 second RBC unit at Hb 6-7; unwired; same inert exclusion mechanics | REJECT as implemented — TRICC-consistent concept, broken mechanics |
| RULE-EFICIENCIA-004 | criterio_5 platelet transfusion at Plt>25000; WIRED VERMELHO; reads "diurna_plaquetas" from the CPOE model (field absent → default 0) and the "4h" window is coded as 6h | REJECT — the live VERMELHO criterion can never fire (dead alert with the appearance of coverage, HAZ-0021) |
| RULE-EFICIENCIA-005 | criterio_9 suspected brain death: documented GCS<6, code GCS<13, sedative filter AND-combined (single-query all-drugs) | REJECT — contradicts documented clinical intent (concordant ATE) |
| RULE-EFICIENCIA-006 | criterio_10 restraint without agitation: docstring requires delirium ABSENT, code requires PRESENT; WIRED AMARELO | REJECT — inverted predicate (concordant ATE) |
| RULE-EFICIENCIA-007 | criterio_1 repeated-exam minimum-repeat windows (5/7/14/21/30 d per exam class); unwired | VALIDATE — plausible stewardship windows; UNCITED |
| RULE-EFICIENCIA-008 | criterio_2 ICU discharge readiness; multiple miswired members (truthiness instead of ≥11 GCS; wrong aggregate key → always falsy; inverted TEC/lactate members) | REJECT — miswired beyond salvage as implemented |
| RULE-EFICIENCIA-009 | criterio_6 frailty/palliative patterns (age/LOS/SAPS3/SOFA/antecedents); antecedent membership test inert via fromkeys | REFINE — clinically reasonable patterns; fix inert membership checks; needs geriatric/palliative review |
| RULE-EFICIENCIA-010 | criterio_7 delirium risk bundle; `range[1, 5]` raises TypeError; inert antecedent filter; mutually exclusive pain clauses | REJECT — crashes when RASS present; unwired |
| RULE-EFICIENCIA-011 | criterio_8 step-down readiness; implemented clauses contradict the documented absence intent; duplicated clause | REJECT — inverted/contradictory members |
| RULE-EFICIENCIA-012 | Alert-label + recommendation catalog for the 10 criteria incl. restrictive transfusion texts (Hb≥7 no benefit absent bleeding/ACS/brain injury) | VALIDATE — TRICC/AABB-consistent wording; pharmacist/hematology wording review (concordant ATE) |

## Tally

VALIDATE 2 · REJECT 9 · REFINE 1 (= 12).
This cluster has the highest defect density in the OSMS scope: of the three
criteria actually wired to live alerts, one fires regardless of the value it
claims to test (002), one can never fire (004), and one is inverted against
its documented intent (006). The V1 successor `domain_eficiencia.py`
reproduces the restrictive-trigger inversion at TF-002
(medication-safety-review.md §6) — the defect survived the rewrite.
