---
id: LEGREV-OSMS-CATALOGS
title: Legacy review — the nine runtime domain alert YAML catalogs (docs/plan/_work/alerts/)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Consolidated audit of the nine runtime-loaded domain alert catalogs under
  legacy docs/plan/_work/alerts/. Full clinical review (thresholds, citation
  audit, verdict) for the five OSMS-assigned catalogs; structural audit only
  (alert_groups absence, integrity, ownership cross-reference) for the four
  catalogs owned by sibling workstreams, per the coverage map's exactly-one-
  owner rule. All verdicts are PROPOSALS; nothing is imported.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: /Users/familia/intensicare/docs/plan/_work/alerts/
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; files NOT in pin manifest — hashed at read time, marked (rt))
  section_or_lines: cited per finding
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy organ-support and medication-safety forensics reviewer (cycle 1, Task 1, wave 1b)
  transformation: read from source; parsed, counted, audited; no content imported
  confidence: high (mechanical) / medium (clinical assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0019, HAZ-0031]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — nine runtime domain alert catalogs

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> These files live under `docs/` but are **runtime clinical logic** — the
> domain services resolve them by repository path in production code paths
> (inventory §2.8 CRITICAL FINDING). They are outside the pin manifest; the
> (rt) hashes below are the pin of record.

## 1. Structural audit — all nine (OBSERVED 2026-08-15)

`grep -l alert_groups *.yaml` matches **0 of 9** — re-confirming the cycle-0
finding (NL-5) that underlies the false-green vector-coverage gate
(HAZ-0031): `scripts/check_vector_coverage.py` counts vectors per
`alert_groups`, so nine catalogs contribute zero required coverage and the
gate passes on "All 0".

| Catalog | Owner workstream | Alerts | Test vectors | Citations | SHA-256 (rt) |
|---|---|---|---|---|---|
| `aki.yaml` | THIS (OSMS) | 3 | 17 | 3 | `409f363d356311514b605df0876ffb0a1e9ec1f2d15017e7b42342778453e42c` |
| `electrolyte.yaml` | THIS (OSMS) | 6 | 39 | 11 | `0de2f4e7218d1acdd2c2c83ff8a25435bda5f996e577f073f3b9988f9e4085f3` |
| `hemodynamics.yaml` | THIS (OSMS) | 6 | 34 | 11 | `ed09ce34e5e7dde099cff41d8821d642021083a431f5c302ca3a2de173496190` |
| `respiratory.yaml` | THIS (OSMS) | 5 | 24 | 13 | `7186652bccffce6a99f1e8d5722913683c7009c875adaa15b1207715ea7634af` |
| `pharmaco-interaction.yaml` | THIS (OSMS) | 8 | 34 | 17 | `ee403fbe4d63d694993ac4858f83f8bc3cc920cbe413f3323b3e6c8fae6fc992` |
| `correlation-engine.yaml` | alert-threshold-engine | 4 | 26 | 15 | `51336b4cdce32905270b7dcb241824083c4003142527a8d7b71e6e576dbab06b` |
| `early-warning-scores.yaml` | ews | 4 | 25 | 10 | `712d9ccde209d099f80c4d5abb11e77e33564e03f347f931a363537c1031e9b8` |
| `neuro-sedation.yaml` | neuro-sedation-scores | 8 | 38 | 16 | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` |
| `sepsis.yaml` | sepsis-scores | 6 | 31 | 16 | `6d79efcb164b7989f9c3992a9f2647b9ea213cb329bef837681ad85bbaf0e5de` |

For the four non-OSMS rows this record asserts ONLY: existence, hash,
alert_groups absence, and counts. Clinical verdicts on their content belong
to the owning workstreams (coverage-map §1 rule 1); none is issued here.

## 2. Clinical audit — five OSMS catalogs

Per-catalog threshold tabulations live in the domain records (single write,
no duplication): `renal-aki-review.md` §1-2 (aki.yaml),
`electrolyte-review.md` §1-2 (electrolyte.yaml),
`hemodynamics-stability-review.md` §1,3 (hemodynamics.yaml),
`respiratory-ventilation-review.md` §1-2 (respiratory.yaml),
`medication-safety-review.md` §5,7 (pharmaco-interaction.yaml). Summary
audit:

| Catalog | Threshold set (summary) | Citation audit | Code parity | Verdict |
|---|---|---|---|---|
| `aki.yaml` | KDIGO staging (Cr ×1.5/×2.0/×3.0, ≥4.0, RRT; UO <0.5 at 6/12 h, <0.3 at 24 h, anuria 12 h); progression; nephrotoxin combo + Cr rise >0.2 | KDIGO 2012 real; "KDIGO Drug-Induced AKI 2023" UNVERIFIED; Rybak 2020 plausible | code diverges (UO stage-2 unreachable; RRT guard; no anuria) | VALIDATE (catalog is the correct master; code must be corrected to it) |
| `electrolyte.yaml` | K/Na/Ca/Mg absolute+cofactor bands; Na-correction rate from nadir >8/>10; PO4 mg/dL pending RAT-ELY-01 | UKKA, Adrogué-Madias, Sterns, Geerse, Hansen plausible; "ESICM-ESE-ERBP 2024 dysnatremia consensus" UNVERIFIED | code matches except phosphate (full contradiction) and dropped QTc emission | VALIDATE |
| `hemodynamics.yaml` | SI>0.9/MSI>1.3+corroborator; lactate-clearance <10%/2h; vaso escalation >50%/2nd agent; MAP<65+NE>1.0; fluid non-response; antiHTN conflict | Rady, Liu, Jones, SEPSISPAM, SSC 2021, ANDROMEDA-SHOCK, Marik/Monnet plausible | code implements these 6 faithfully **plus 6 uncataloged stability alerts** | VALIDATE (must be extended to cover alerts 07-12 or those retired) |
| `respiratory.yaml` | Berlin S/F-P/F staged gate; S/F trend −20%/6h; asynchrony RR+Pplat>30; weaning bundle (glasgow > 8 here); TOT >10 d/≥14 d COVID | Berlin, Rice 2007, ARMA, Amato, Thille, Boles, Yang-Tobin, TracMan plausible; "Rice 2017" UNVERIFIED | code adds 6 uncataloged alerts and drifts on weaning GCS (≥10 vs >8) | VALIDATE (same reconciliation requirement) |
| `pharmaco-interaction.yaml` | QTc >500 + ≥2 Known-Risk drugs or Δ>60 ms; serotonin ≥2 agents + Hunter sign; CNS depression ≥2 depressants + RR<10/SpO2<90 with controlled-vent suppression; duplication; withdrawal | CredibleMeds, Tisdale 2013, Boyer-Shannon 2005, Hunter criteria, Overdyk 2016, Lee 2015 — the strongest citation discipline in scope | loader is domain_pharmaco_delirium.py (neuro workstream cross-check); prescription-side KB diverges (medication-safety-review §5) | VALIDATE — candidate single source of truth for interactions |

All guideline attributions above are trained-knowledge checks, not
re-fetched — VALIDATION REQUIRED before any is relied upon.

## 3. Cross-cutting findings

1. **Catalog undercoverage of the runtime surface** (HAZ-0019):
   hemodynamics and respiratory catalogs describe 6 and 5 alerts while their
   loaders execute 12 and 11 evaluators. The WAVE-3A additions bypassed the
   catalog, the vector suite, and the definition seeds — the versioning
   invariant (ADR-0022 INV-3) is broken by the newest, least-reviewed logic.
2. **alert_groups absent everywhere** keeps the vector-coverage gate
   false-green (HAZ-0031); the 148 vectors across the five OSMS catalogs are
   therefore *unenforced* documentation, not gate assertions.
3. **Severity-tier semantics**: catalogs use normal|watch|urgent|critical
   consistently (good), but sibling surfaces (pathways, wrappers) attach the
   same words to eligibility/process meanings — reconciliation is a V2
   requirement recorded across the domain records.
4. The catalogs are uniformly the **highest-quality clinical artifacts** in
   the OSMS scope (typed inputs with LOINC bindings and staleness_max,
   dedup/cooldown/rate-limit budgets, PPV rationales, boundary-tested
   vectors). The correct V2 posture is catalog-as-master: TRANSFORM the
   loading architecture (out of docs/, into a governed rule registry per
   ADR-0022's own migration path), VALIDATE the content per domain records.

## 4. Verdicts (five OSMS catalogs; all PROPOSAL)

| Catalog | Verdict |
|---|---|
| `aki.yaml` | VALIDATE |
| `electrolyte.yaml` | VALIDATE |
| `hemodynamics.yaml` | VALIDATE (extend-or-retire uncataloged alerts) |
| `respiratory.yaml` | VALIDATE (extend-or-retire; resolve GCS drift) |
| `pharmaco-interaction.yaml` | VALIDATE |
| Loading location/mechanism (docs/-resident runtime logic, no alert_groups) | TRANSFORM — governed registry with enforced vector coverage |
