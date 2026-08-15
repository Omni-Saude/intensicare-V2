---
id: LEGREV-OSMS-FLUID
title: Legacy review — fluid-balance domain service and nutrition pathway content
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Forensic review of the legacy V1 fluid-balance domain service
  (domain_fluid_balance.py — the ratified nursing-day/aggregation
  re-implementation) and, colocated for coverage, the clinical content of the
  nutrition pathway nutricao.yaml. Rule-level review of the balanco-hidrico
  and nutricao clusters lives in the cluster files. All verdicts are
  PROPOSALS; nothing is imported.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: /Users/familia/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 below)
  section_or_lines: cited per finding
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy organ-support and medication-safety forensics reviewer (cycle 1, Task 1, wave 1b)
  transformation: read from source; summarized and analyzed; no content imported
  confidence: high (mechanical citations) / medium (clinical assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0008, HAZ-0021]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — fluid balance (and nutrition pathway content)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> ESPEN/ASPEN comparisons rely on trained knowledge (not re-fetched) and are
> VALIDATION REQUIRED.

## 0. Artifacts and integrity (OBSERVED 2026-08-15; hashes match inventory)

| Artifact | SHA-256 |
|---|---|
| `src/intensicare/services/domain_fluid_balance.py` | `1f7ac65c87da67ce0fee5d8953d1b8a3c3da9aba1c7f0c6f44c30521fb36b43b` |
| `_work/alerts/pathways/nutricao.yaml` | `b2dc4ae2f7fff4bcad5e1923647053fdcfd1565c7b5a0f9cf850628bd561dd95` |

## 1. Implemented logic (`domain_fluid_balance.py`)

The module is the V1 team's own "RATIFIED per WAVE 2B" re-implementation of
the balanco-hidrico P1 rules (docstring lines 1-21 names
RAT-BALANCO-HIDRICO-03/04/05/06/08/09). It contains **no alert thresholds**;
it is the aggregation substrate consumed by AKI (urine output), hemodynamics
(cumulative balance) and the sepsis criteria (recency windows).

Verbatim clinical semantics:

- Nursing day = 07:00→07:00 America/Sao_Paulo; pre-07:00 entries belong to
  the previous day (`get_nursing_day_window`, lines 95-131). This replaces
  the legacy month-agnostic `criado_em__day` window construction
  (RULE-BALANCO-HIDRICO-006..011 — the moderate-impact defect family) with a
  correct absolute-datetime window `window.start <= dt < window.end`.
- `tempo_criacao` (139-156) corrected from `timedelta.seconds` (intra-day
  only, the RULE-016 defect that let >24h-old records pass "<N hours"
  guards) to `total_seconds()/3600`.
- 24h balance = Σintake − Σoutput over the window; **"0 is a valid balance,
  never coerced to None"** (docstring line 16; RULE-006 behavior retained).
- Urine output = Σ Saida where `tipo ∈ {diurese_espontanea, diurese_sonda}`
  (line 43; matches RULE-008's tipo filter).
- Max temperature = MAX over window with None-stripping (268-296; RULE-010
  semantics, window corrected).
- 2h bucket grid anchored 08:00 with an explicit 22:00→00:00 wrap
  (304-384), fixing the degenerate SQL BETWEEN 22:00/00:00 range of
  RULE-013.

## 2. Discrepancy analysis

1. **Silent zero-coercion of unparseable quantities.**
   `_safe_float(value, 0.0)` (406-413) converts any unparseable or None
   `quantidade` to **0.0 mL** and keeps summing; `_safe_datetime` (392-403)
   silently drops records with unparseable timestamps. No count of
   dropped/zeroed records is surfaced in `FluidBalanceResult.metadata`. A
   balance computed over partially corrupt data is indistinguishable from a
   complete one — the ledger-level HAZ-0005 analogue. Note that a
   **comma-decimal** quantity string ("250,5") fails `float()` and becomes
   0.0 — the same Brazilian-locale parse family as the legacy weight defect
   (SYS-09) that masked oliguria.
2. **Naive-vs-aware datetime comparison crash path.**
   `_safe_datetime` returns naive datetimes for ISO strings without offsets;
   comparing them against the tz-aware window bounds raises `TypeError`
   (uncaught) rather than skipping — a data-dependent crash, not a silent
   error, but unhandled.
3. **Window semantics vs KDIGO consumers.** The AKI spec (domains/aki.md §2)
   explicitly replaces the 07:00 nursing day with rolling 6/12/24h windows
   for oliguria staging; this module serves the *ledger* view. The two
   window families coexist by design — V2 must keep the separation explicit
   or oliguria staging will silently inherit nursing-day windows again.
4. Default-volume rules of the source cluster (enteral diet 200 mL,
   presence-graded 100/200/300 mL — RULE-020/021/022) are **not**
   re-implemented here; they remain only in the legacy serializers. Any V2
   ledger must decide explicitly whether estimated default volumes are
   admissible input to KDIGO-bearing aggregates (they currently
   contaminate urine-output-adjacent totals upstream).

## 3. Nutrition pathway content (`nutricao.yaml`, pathway id 4, v3.0.0)

| Criterion | Bands (severity) | Anchor check (trained knowledge, VALIDATION REQUIRED) |
|---|---|---|
| NRS-2002 screening | [0,3) normal; [3,5) watch; ≥5 urgent | NRS-2002 ≥3 = at risk, ≥5 = high risk — consistent |
| Caloric intake (% target) | <60 critical; 60-80 watch; ≥80 normal | consistent with ESPEN ICU 2019 progression targets |
| Protein intake (g/kg/d) | <0.8 critical; 0.8-1.2 watch; ≥1.2 normal | ESPEN target ~1.3 g/kg/d; bands defensible |
| Gastric residual (mL) | ≥500 critical; 200-500 watch | 500 mL threshold consistent with ASPEN/SCCM 2016; "critical" severity overstated for a feeding-tolerance marker |
| Albumin (g/dL) | <2.5 critical; 2.5-3.0 watch | albumin is an inflammation marker, weak as a nutrition trigger; "critical" for 2.4 g/dL over-alerts — needs clinical re-derivation |
| Diarrhea (episodes/day) | ≥4 urgent; 1-4 watch | plausible |

Evidence block cites ESPEN 2019 and ASPEN/SCCM 2016 — both real guideline
families (not re-fetched). Severity-vocabulary note: "critical" here drives
the same escalation channel as physiologic emergencies; nutrition-process
lapses at CRITICAL tier are an alarm-fatigue risk (cross-ref
domain-catalogs-review.md §severity-semantics).

## 4. HAZ-0005 zero-coercion assessment

| Path | Behavior | Assessment |
|---|---|---|
| `_safe_float` on quantities | invalid → 0.0, silently summed | zero-coercion of ledger data; no dropped-record accounting (HAZ-0005 analogue at data layer) |
| `_safe_datetime` | invalid → record silently excluded | silent exclusion; same opacity |
| `compute_max_temperature` | no valid temps → None | correct: absence returns None, not a fabricated normal |
| balance = 0 semantics | documented as valid value | acceptable only with a completeness indicator; currently absent |

## 5. Verdicts (all PROPOSAL)

| Artifact / path | Verdict | Rationale |
|---|---|---|
| Nursing-day window + bucket engine | REFINE | correct fix of the legacy month-boundary/degenerate-range defects; carry the concept with explicit tz/DST tests |
| `tempo_criacao` total_seconds fix | RETAIN-candidate → VALIDATE | small, correct, well-documented correction; still requires V2 acceptance tests before any import |
| Quantity/timestamp coercion (`_safe_float`/`_safe_datetime`) | REJECT as implemented | invalid data must be counted and surfaced, never zeroed/dropped silently |
| Urine-output tipo filter | VALIDATE | matches RULE-008; tipo vocabulary must be governed with the intake/output decision trees (cluster file) |
| `nutricao.yaml` bands | VALIDATE | ESPEN/ASPEN-consistent except albumin band and severity-tier inflation, both flagged for clinical re-derivation |

**Worst finding:** the re-implemented ledger still coerces unparseable or
missing quantities to 0.0 mL with no completeness accounting — fluid
balances feeding AKI and hemodynamic decisions can be silently incomplete
(HAZ-0005 data-layer analogue; comma-decimal inputs are zeroed).
