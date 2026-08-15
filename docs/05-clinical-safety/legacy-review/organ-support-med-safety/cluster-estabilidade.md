---
id: LEGREV-OSMS-CL-EST
title: Legacy review — estabilidade rule cluster (26 rules) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule cluster estabilidade
  (26 rule records), with a per-rule disposition table under
  docs/00-governance/legacy-import-policy.md §4.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/*/RULE-ESTABILIDADE-*.md (26 files)
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
  hazards: [HAZ-0005, HAZ-0019, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Estabilidade rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Thirteen of these rules were previously verdicted by the
> alert-threshold-engine review via the alert-threshold *category* directory;
> this cluster file is the owning review (coverage-map §1). All ATE verdicts
> are concordant with the rows below. Vasopressor doses throughout the v3
> rules are in **mL/h** — unconvertible without institutional concentration
> and weight (audit finding SYS-02/CON-0060); domain_hemo.py re-derives the
> wired criteria in mcg/kg/min (hemodynamics-stability-review.md §1).
> Legacy shard `estabilidade.yaml` proposes ADOPT 15 / ADAPT 7 /
> ADOPT-CORRECTED 3 / RETIRE 1 — far more permissive than this review; delta
> for the named reviewer.

## Per-rule disposition table

| Rule ID | What it does (one line) | Verdict |
|---|---|---|
| RULE-ESTABILIDADE-001 | v3 criterio_5 vasopressor+negative cumulative balance; code checks balance < +2000 (not < −2000) and lactate > 0.5 in place of the Ringer-bolus guard; unwired | REJECT — implementation contradicts documented intent twice |
| RULE-ESTABILIDADE-002 | Shock index (FC/PAS > 0.7 OR FC/PAM > 0.9) + antibiotic + no beta-blocker/noradrenaline; unwired | VALIDATE |
| RULE-ESTABILIDADE-003 | Noradrenaline in last 6h + (TEC > 3 s OR lactate ≥ 2); unwired | VALIDATE (concordant ATE) |
| RULE-ESTABILIDADE-004 | New vasopressor without sepsis work-up (no antibiotic/bolus/cultures); unwired | VALIDATE |
| RULE-ESTABILIDADE-005 | Docstring requires ABSENCE of noradrenaline, code checks PRESENCE; unwired | REJECT — inverted predicate (concordant ATE) |
| RULE-ESTABILIDADE-006 | FR > 20 + noradrenaline > 10 mL/h + (lactate > 2 OR TEC > 3) + spontaneous ventilation; unwired | VALIDATE — concept; mL/h dose must be re-derived |
| RULE-ESTABILIDADE-007 | Noradrenaline > 20 mL/h without vasopressin or hydrocortisone; WIRED VERMELHO | REJECT as implemented — unconvertible mL/h threshold on a live critical alert (concordant ATE) |
| RULE-ESTABILIDADE-008 | Refractory triple therapy: nora > 70 mL/h + vasopressin > 5 mL/h, adrenaline absent; unwired | REJECT as implemented (concordant ATE) |
| RULE-ESTABILIDADE-009 | Dobutamine > 10 mL/h + noradrenaline > 50 mL/h; unwired | REJECT as implemented (concordant ATE) |
| RULE-ESTABILIDADE-010 | Noradrenaline > 50 mL/h + any of 16 scheduled antihypertensives; WIRED VERMELHO | REJECT as implemented — mL/h on a live critical alert; concept re-derived as ANTIHTN-CONFLICT-06 |
| RULE-ESTABILIDADE-011 | Bicarbonate > 16 + pH > 7.2 flags inappropriate bicarbonate; prescription precondition missing per code comment; unwired | VALIDATE (concordant ATE) |
| RULE-ESTABILIDADE-012 | Scheduled antihypertensive + >2 records PAS<90 AND PAD<60 in 6h (docstring says OR); WIRED AMARELO | VALIDATE — with the AND/OR divergence resolved to clinical intent (concordant ATE) |
| RULE-ESTABILIDADE-013 | PAS>155 AND PAD>90 ==2 records (docstring OR), no nora 4h, no I64 diagnosis; WIRED AMARELO | VALIDATE — same AND/OR + count==2 fragility to resolve (concordant ATE) |
| RULE-ESTABILIDADE-014 | v3 alert: VERMELHO on criteria 7/10, AMARELO on 12/13, else NEUTRO; duplicate byte-identical method | VALIDATE (concordant ATE) — per-criterion mapping, not count-based |
| RULE-ESTABILIDADE-015 | Facade alert texts whose numeric thresholds diverge from evaluated predicates | REJECT — rendered thresholds must equal evaluated predicates (concordant ATE) |
| RULE-ESTABILIDADE-016 | Escalation-ladder texts: nora > 0.5 mcg/kg/min → hydrocortisone+vasopressin; > 1.5 → adrenaline with institutional dilutions | VALIDATE — clinically recognizable SSC-style ladder; institutional dilutions need pharmacist ratification |
| RULE-ESTABILIDADE-017 | Manual C1: TEC > 5 s + active noradrenaline | SUPERSEDE — replaced by ANDROMEDA-SHOCK 3 s in the v2-lineage code (CRT-NORAD-12) |
| RULE-ESTABILIDADE-018 | Manual C2: noradrenaline started within 24h | VALIDATE |
| RULE-ESTABILIDADE-019 | Manual C3: noradrenaline quantity > 21 mL without vasopressin/hydrocortisone | REJECT — absolute mL threshold, unit-invalid |
| RULE-ESTABILIDADE-020 | Manual C4: arterial lactate ≥ 2.5 | VALIDATE |
| RULE-ESTABILIDADE-021 | Manual C5: antihypertensive + (noradrenaline present OR PAS > 90) | VALIDATE |
| RULE-ESTABILIDADE-022 | Manual C6: dobutamine > 10 + noradrenaline EXACTLY == 50 mL | REJECT — exact-equality dose predicate (concordant ATE family) |
| RULE-ESTABILIDADE-023 | Manual pathway: count of satisfied criteria → 3-level color | REJECT — count-as-severity (concordant ATE) |
| RULE-ESTABILIDADE-024 | trilha2 shock work-up text catalog; criteria 7/10 have empty recommendation stubs | REFINE — complete or remove empty stubs; wording review |
| RULE-ESTABILIDADE-025 | v1 color with criterio_6 combination clause | VALIDATE (concordant ATE) |
| RULE-ESTABILIDADE-026 | Noradrenalina/PCR records default horario_inicio to now() at save | TRANSFORM — silent timestamp default must become explicit |

## Tally

VALIDATE 13 · REJECT 10 · REFINE 1 · TRANSFORM 1 · SUPERSEDE 1 (= 26).
Dominant defect families: unconvertible mL/h vasopressor thresholds (two of
them wired to live VERMELHO alerts), docstring-vs-code inversions
(005, 012/013 AND-OR), and count-as-severity in the manual pathway.
