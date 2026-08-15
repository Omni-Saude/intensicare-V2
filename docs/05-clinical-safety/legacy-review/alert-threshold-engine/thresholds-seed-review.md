---
id: LEGREV-ALTB-THRESHOLDS
title: Legacy review — V1 threshold configuration, resolver, API, and seeded clinical threshold values
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 threshold-configuration model, scope
  resolver, admin API, and every seeded clinical threshold value (migration
  0038 plus the hardcoded fallback threshold sets), each checked against the
  published primary source or flagged UNCITED. Governance findings are
  marked INPUT TO ADR-0007.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: alembic/versions/0038_seed_default_threshold_config.py and src/intensicare/ (models, services, schemas, api)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 in section 0)
  section_or_lines: cited per finding as path:lines
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (legacy alert-and-threshold engine forensics reviewer, cycle 1 Task 1)
  transformation: >
    read from source; seeded values compared against published guideline and
    primary-literature sources cited from reviewer knowledge — external
    documents were NOT re-fetched in this environment, so every published
    citation below carries VALIDATION REQUIRED for re-verification against
    the printed source before any reliance.
  confidence: high (code citations) / medium (published-source comparisons)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0019, HAZ-0021, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# V1 threshold configuration and seeded clinical values — forensic review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Citation honesty: the published sources below are cited from reviewer
> knowledge of the canonical literature. This environment did not re-fetch
> the documents; each citation therefore requires re-verification against
> the printed source by the clinical reviewer (VALIDATION REQUIRED) before
> any threshold is relied upon. Where no citable authority exists the value
> is flagged **UNCITED** — none was invented.

## 0. Cited files and integrity

Paths relative to `/Users/familia/intensicare/`. OBSERVED 2026-08-15: every
SHA-256 below matches `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

```text
c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486  alembic/versions/0038_seed_default_threshold_config.py
8c93cadddeacd7d6cce3f34e2ed0718410ab037ce15050279ad4af5baccecbbc  src/intensicare/models/threshold_config.py
0b02d8ace9bdc89695eeaa2e08d81b2a72070c27624265190b2005883c20ee6f  src/intensicare/services/threshold_resolver.py
d6804247eed80d90f8f0ca7b2e3af77ef7f1b61c79ec3bdc93dd4ec729ebb9ea  src/intensicare/schemas/thresholds.py
d75b31f6dc474ae0d8c995dbf5adde9fdefb5fb9a3fa191652789d37e5f23a28  src/intensicare/api/thresholds.py
79a7f055c8d33b4f8d0f2866bd136af0cbbe389bae079736b5f133c511605acc  src/intensicare/api/reference_ranges.py
ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489  src/intensicare/services/dashboard.py
80001a3664c84b746aa43068864a3dd1f01c2aee9e01d13c4dfa1f276ab8bb96  src/intensicare/services/correlation_engine.py
80980e3966626480a95af4ebe4ba379794dd4b74eaa99fb455923c2530df20ee  src/intensicare/services/alert_engine.py
```

Hash-and-note (absent from manifest; hashes in `README.md`):
`tests/test_threshold_resolver.py`, `tests/test_thresholds.py`.

---

## 1. Threshold configuration model (FINDING 5 — INPUT TO ADR-0007)

OBSERVED (`src/intensicare/models/threshold_config.py:11-39`): one mutable
row per (tenant, unit, bed, score_type) with `watch/urgent/critical`
integer thresholds, optional `rate_limit_per_hour`/`cooldown_minutes`,
evidence columns (`guideline_source`, `evidence_doi`, `evidence_level`),
and `updated_at`/`updated_by`. Unique constraint over the four scope
columns (`:21-23`).

**Versioning — none.** Rows are updated in place
(`src/intensicare/api/thresholds.py:146-215`); history exists only as
audit-trail JSON blobs (`before_state`/`after_state`). The
`alert_definition_version` table exists but no threshold row references a
version and the live alert path never stamps one (engine-review §2.2 F2.4).
A threshold change is therefore effective immediately, invisible on the
alerts it subsequently shapes, and reconstructable only by forensic audit
replay. **INPUT TO ADR-0007.**

**Who can change what.** All CRUD requires only the `admin` role
(`api/thresholds.py:24-28` router-level `require_admin`); there is no
clinical-approver step, no independent review, no ordering validation —
the schema accepts `watch=10, urgent=2, critical=1`
(`schemas/thresholds.py:9-38` validates only `ge=0` per field), which would
misclassify every score. Mutations ARE audited (REQ-INV-1-2,
`api/thresholds.py:45-67,129-139,200-211,248-257`) — the one governance
control present. Tests confirm intent: auth/audit are tested
(`tests/test_thresholds.py:16-49`, `tests/test_threshold_resolver.py:169-351`),
but **no test asserts watch <= urgent <= critical** and none exercises the
live engine against an inverted configuration. **INPUT TO ADR-0007.**

**Scope-coverage gaps.** `ThresholdConfigCreate` has **no `bed_id` field**
(`schemas/thresholds.py:9-25`), so bed-level rows cannot be created through
the API even though the resolver supports the bed tier — the most specific
scope is configurable only by direct DB write. **INPUT TO ADR-0007.**

**Verdict:** **REFINE** the model *concept* (scoped thresholds with evidence
columns and audited mutation) — with mandatory V2 changes: immutable
versioned releases, clinical approval workflow, ordering invariants
enforced at schema and DB level, complete scope surface. The mutable-in-place
implementation itself: **REJECT**.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 2. Threshold resolution — two engines, two semantics (INPUT TO ADR-0007)

- `threshold_resolver.resolve_threshold`
  (`src/intensicare/services/threshold_resolver.py:50-117`): bed over unit
  over tenant, most specific wins; unit tier correctly excludes bed rows
  (`:101`); tenant tier requires both unit and bed NULL (`:108-116`).
  Tested for precedence (`tests/test_threshold_resolver.py:47-167`).
- The **live alert path does not use it**: `alert_engine.py:32-44`
  implements its own two-tier lookup (unit, then tenant) with **no bed
  tier** and **without excluding bed rows from the unit query** — the
  defect documented in engine-review §2.2 F2.3. The only consumer of the
  real resolver is `deterioration_trend.py:171`.
- A third copy of the semantics exists as hardcoded fallbacks in
  `dashboard.py:44-76` (section 4 below).

One scope model, three implementations, two of them divergent. Threshold
governance is meaningless if the resolution semantics differ per consumer.
**INPUT TO ADR-0007.**

**Verdict:** resolver concept (bed over unit over tenant, audited)
**TRANSFORM** into a single V2 resolution service used by every consumer;
the duplicated engine-side resolution **REJECT**.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 3. Migration 0038 — every seeded clinical threshold value

OBSERVED (`alembic/versions/0038_seed_default_threshold_config.py:46-71`):
two rows seeded, tenant `default` only, unit/bed NULL, with
`guideline_source` and (for MEWS) `evidence_doi` columns populated;
`cooldown_minutes` and `rate_limit_per_hour` are NOT seeded (NULL — see
engine-review §4.2 for the clinical consequence: no cooldown at all).

### 3.1 Per-value review

| # | Score | Band | Seeded value | Published authority (primary source) | Agreement | Flag |
|---|---|---|---|---|---|---|
| 1 | MEWS | watch | >= 3 | none found in the cited primary source. Subbe CP, Kruger M, Rutherford P, Gemmel L. "Validation of a modified Early Warning score in medical admissions." QJM 2001;94(10):521-526. DOI 10.1093/qjmed/94.10.521 — the study's reported association is at score >= 5; no 3-point "watch" band is defined there | not derivable from cited source | **UNCITED** |
| 2 | MEWS | urgent | >= 4 | seed rationale attributes ">= 4 gatilho de resposta" to Subbe 2001 (`0038:14-17,54-57`). This reviewer cannot confirm a 4-point response trigger as a finding of that paper; a >= 4 call-out is a common local escalation convention, not (to this reviewer's knowledge) the cited study's threshold | attribution not confirmable | **UNCITED as attributed** — VALIDATION REQUIRED against the printed paper |
| 3 | MEWS | critical | >= 5 | Subbe 2001 (above): scores >= 5 associated with increased risk of death and ICU admission | consistent (association threshold; its relabeling as a "critical alert band" is an interpretive step the paper does not make) | VALIDATE |
| 4 | NEWS2 | watch | >= 3 (aggregate) | Royal College of Physicians. "National Early Warning Score (NEWS) 2 — Standardising the assessment of acute-illness severity in the NHS." Updated report of a working party. London: RCP, December 2017. In NEWS2, aggregate 1-4 is LOW risk (ward-based response); the "3" threshold in NEWS2 is the **single-parameter red score** rule (score of 3 in any one parameter), a different dimension from the aggregate | **DISCREPANT — dimension error**: a single-parameter rule applied as an aggregate cut. V1 computes no single-parameter red score at all | **UNCITED** (as an aggregate threshold) |
| 5 | NEWS2 | urgent | >= 5 | RCP NEWS2 2017 (above): aggregate 5-6 = MEDIUM risk, urgent ward-based review threshold ("key threshold") | consistent | VALIDATE |
| 6 | NEWS2 | critical | >= 7 | RCP NEWS2 2017 (above): aggregate >= 7 = HIGH risk, emergency assessment | consistent | VALIDATE |

Counts for migration 0038: **6 values reviewed; 3 consistent with the cited
primary source (rows 3, 5, 6 — subject to re-verification); 3 UNCITED or
discrepant (rows 1, 2, 4), of which row 4 is additionally a
dimension-misapplication discrepancy.**

Structural observations on 0038:

- Evidence columns on the seed are the right instinct (`0038:10-31`) —
  the only threshold artifact in V1 that records *why*.
- **Tenant coverage gap**: only tenant `default` is seeded (`0038:46`).
  Any other tenant has no config rows, and the engine's answer to no config
  is a silent no-alert (`alert_engine.py:46-48`) — alerting is silently
  disabled per-tenant while the dashboard still colors beds via hardcoded
  fallbacks. **INPUT TO ADR-0007** (seeding policy must be per-tenant with
  proof-of-coverage, or absence must fail loud).
- **Score coverage gap**: SOFA and qSOFA are scored and routed to the
  engine (`vitals.py:400-408`) with no seeded thresholds — structurally
  silent no-fire (engine-review F2.2). Under Sepsis-3 (Singer M, et al.
  "The Third International Consensus Definitions for Sepsis and Septic
  Shock (Sepsis-3)." JAMA 2016;315(8):801-810. DOI 10.1001/jama.2016.0287)
  an acute SOFA change of >= 2 defines organ dysfunction — the score with
  the strongest consensus definition is the one that can never alert.

**Verdict (0038):** seeding mechanism (idempotent, evidence-annotated)
**REFINE**; the six values **VALIDATE** (rows 3/5/6) / **REJECT as seeded**
(rows 1/2/4 — re-derive with clinical owner); the tenant- and
score-coverage gaps **REJECT**.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 4. Hardcoded threshold sets that shadow the configuration (INPUT TO ADR-0007)

### 4.1 `dashboard.py` fallback thresholds

OBSERVED (`src/intensicare/services/dashboard.py:33-47`): module constants
`NEWS2_HIGH_RISK_THRESHOLD = 7`, `NEWS2_MEDIUM_RISK_THRESHOLD = 5`
(consistent with RCP NEWS2 2017), and `FALLBACK_THRESHOLDS` duplicating the
0038 values (MEWS 3/4/5, NEWS2 3/5/7) "so severity derivation never breaks
due to missing configuration" (`:41-47,55-59`). Same six values, same review
as §3.1 — but as a **shadow copy in code** that silently substitutes for
missing configuration and reads only tenant `default` (`:37-39,67-72`),
regardless of the patient's actual tenant. Config-shadowing means an
operator change to `threshold_config` for a non-default tenant will never
affect bed coloring, and deleting config rows silently reverts to code
constants. **Verdict: REJECT** (shadow constants; single source of truth
required). **INPUT TO ADR-0007.**

### 4.2 `reference_ranges.py` fallback vital thresholds and SOFA bands

OBSERVED (`src/intensicare/api/reference_ranges.py:23-84`), served to the
frontend threshold hook (`:87-117`):

**24 vital-sign bound values** (six vitals, four bounds each,
`:23-72`), header comment claims "medical literature" with **no citation
anywhere** — all 24 **UNCITED**. Cross-checks against the physiological
bands of RCP NEWS2 2017 (where comparable) show discrepancies this
reviewer flags for the clinical owner (re-verify against the printed NEWS2
chart):

| Vital | V1 bound | NEWS2 2017 scoring-band comparison | Note |
|---|---|---|---|
| respiratory_rate high_critical = 35 | NEWS2 scores 3 points at RR >= 25 | V1 flags "critical" only 10 breaths above the NEWS2 red band |
| spo2 low_critical = 88 | NEWS2 (scale 1) scores 3 at <= 91 | V1 critical band starts 3 points lower |
| heart_rate high_critical = 130 | NEWS2 scores 3 at >= 131 | off-by-one, likely benign, still uncited |
| temperature low_critical = 35 | NEWS2 scores 3 at <= 35.0 | consistent, uncited |
| spo2 high_warn = 100 = high_critical | not a NEWS2 concept | incoherent: saturation of 100 is simultaneously warn and critical |

**SOFA display bands** (`:74-84`): normal 0-6, watch 7-9, urgent 10-12,
critical 13-24. **UNCITED and clinically indefensible**: under Sepsis-3
(Singer 2016, above) an acute SOFA change >= 2 signals organ dysfunction
with appreciable mortality; the original score description (Vincent JL,
et al. "The SOFA (Sepsis-related Organ Failure Assessment) score to
describe organ dysfunction/failure." Intensive Care Med
1996;22(7):707-710. DOI 10.1007/BF01709751) defines per-organ 0-4 grades
and no "normal up to 6" claim. A total SOFA of 6 rendered as green
"normal" is false reassurance by construction (HAZ-0005 class, display
layer).

**Shape defect**: when config rows DO exist, the endpoint maps score
configs into the vitals shape — `vital_name = score_type`,
`high_warn = watch_threshold`, `high_critical = critical_threshold`, unit
empty (`:102-115`) — i.e., MEWS/NEWS2 alert thresholds masquerade as vital
reference ranges, and the urgent threshold is dropped.

**Verdict: REJECT** (the endpoint, both fallback tables, and the mapping).
Reference ranges for V2 are new clinical content under ADR-0014's
successor decision (see §6), not an import.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

### 4.3 Correlation-engine clinical constants

OBSERVED (`src/intensicare/services/correlation_engine.py:60-102,165-415`).
Cut-points with their published anchors (all VALIDATION REQUIRED —
re-verify against printed sources):

| Constant | Value | Published authority | Agreement |
|---|---|---|---|
| QTc prolongation | > 500 ms | Drew BJ, et al. "Prevention of Torsade de Pointes in Hospital Settings." AHA/ACCF scientific statement. Circulation 2010;121(8):1047-1060 — QTc >= 500 ms marked risk | consistent |
| Hypokalemia | K < 3.5 mmol/L | conventional lower reference limit for serum potassium (widely published laboratory reference interval; no single primary trial) | consistent; cite a named laboratory-medicine reference at ratification |
| Hypomagnesemia | Mg < 0.7 mmol/L | conventional lower reference limit for serum magnesium | consistent; same note |
| ARDS moderate/severe | P/F <= 200 | ARDS Definition Task Force (Ranieri VM, et al.) "Acute Respiratory Distress Syndrome: The Berlin Definition." JAMA 2012;307(23):2526-2533. DOI 10.1001/jama.2012.5669 — moderate ARDS: P/F <= 200 | consistent |
| S/F surrogate | <= 235 | Rice TW, et al. "Comparison of the SpO2/FiO2 ratio and the PaO2/FiO2 ratio in patients with acute lung injury or ARDS." Chest 2007;132(2):410-417 — S/F 235 corresponds to P/F 200 | consistent |
| Shock | MAP < 65 mmHg + vasopressor dose > 0 | Sepsis-3 (Singer 2016, above): septic shock includes vasopressor requirement to maintain MAP >= 65 mmHg | consistent |
| AKI member | KDIGO stage >= 1 | KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl 2012;2(1):1-138 | consistent |
| SA-AKI join window | 72 h | consensus SA-AKI definitions (ADQI 28 workgroup, Zarbock A, et al., Nat Rev Nephrol 2023;19(6):401-417) use AKI within 7 days of sepsis | **narrower than consensus — UNCITED as a 72 h choice** |
| Resp+hemo window | 6 h; QTc window 24 h | none found | **UNCITED** (design choices) |
| Exam-redundancy windows | 5 classes, 120-720 h | none found (stewardship policy) | **UNCITED** |
| PPV budgets | fleet floor 0.60; per-rule 0.60-0.85 | none (product targets) | **UNCITED** (declared targets, unevidenced) |

**Verdict: VALIDATE** (largely well-anchored cut-points; windows and
suppression/amplification semantics require clinical validation; every
UNCITED value needs an owner decision).
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 5. Legacy ADR-0014 context

`docs/adr/0014-no-abnormal-value-threshold-flagging.md` (hash-and-note in
`README.md`; superseded by legacy ADR-0019) documents that V1's clinical
screens rendered **no value-driven severity encoding at all** (a SpO2 of 99
and of 60 rendered identically) and recommends a centralized
reference-range service pending clinical ratification. Two implications for
this review: (a) the `reference_ranges.py` endpoint reviewed in §4.2 is the
partial, uncited attempt at that recommendation — confirming the ranges
never received the ratification the ADR itself demanded; (b) the ADR's
"considered options" analysis (per-screen ad-hoc thresholds rejected
because prior severity systems were "reinvented 6-plus times with divergent
literals") is precisely the failure mode found live in §2 and §4.1 —
three copies of threshold semantics. Classification of the ADR itself:
**ARCHIVE-grade reference** (kept as context; nothing to import).

## 6. Consolidated seeded-value counts (for the cycle-1 return)

- Migration 0038: **6 values reviewed — 3 consistent with cited primary
  sources (pending re-verification), 3 UNCITED/discrepant (MEWS watch=3
  UNCITED; MEWS urgent=4 UNCITED-as-attributed; NEWS2 watch=3 aggregate
  dimension error).**
- `dashboard.py` shadow set: same 6 values (duplicates), plus 2 NEWS2 risk
  constants (5, 7 — consistent with RCP 2017).
- `reference_ranges.py`: **24 vital-bound values, all UNCITED** (5 of them
  additionally discrepant or incoherent per §4.2); **SOFA band set (4
  bands / 8 edge values) UNCITED and contradicting Sepsis-3.**
- Correlation engine: **7 clinical cut-points consistent with citable
  primary sources; 10 window/budget values UNCITED.**

Total clinical threshold values examined in this record: **57** (6 seed +
8 shadow + 24 vitals + 8 SOFA edges + 11 correlation and window/budget
values counted individually where clinically load-bearing).

All verdicts: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
