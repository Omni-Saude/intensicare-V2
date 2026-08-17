---
id: LEGREV-DQPC-INDEX
title: "Legacy review — V1 data-quality and physiological-calculation surface (cycle 1, Task 1, wave 1b, workstream DQPC) — index"
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Index and provenance record for the cycle-1 forensic review of the legacy
  (V1) units-normalization registry, the Gold-layer read/normalize/write
  pipeline, the reference-ranges API surface, and the sinais-vitais rule
  cluster (33 extracted rules) — the data-quality-and-physiological-calculation
  (DQPC) workstream (WAVE-1B) assigned in
  docs/05-clinical-safety/legacy-review/00-inventory/coverage-map.md. Every
  finding in this directory is a PROPOSAL; nothing is imported, selected, or
  ratified.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: https://github.com/Omni-Saude/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin time; per-file SHA-256 below and in each record)
  section_or_lines: see per-record citations
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (legacy data-quality/physiological-calculation forensics reviewer, cycle 1 Task 1, wave 1b)
  transformation: >
    Read from source; summarized and analyzed. No legacy code, schema, rule,
    threshold, conversion factor, or YAML content is imported by this review.
  confidence: high (mechanical citations) / medium (clinical assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0006, HAZ-0021, HAZ-0025, HAZ-0030, HAZ-0032]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — data-quality and physiological-calculation (DQPC) workstream (index)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Per `docs/00-governance/legacy-import-policy.md` §1 the default is **do
> not copy**. These records document what the legacy system does,
> verified from source, and propose per-artifact verdicts. No verdict
> here is self-executing.

## Records in this directory

| Record | Scope |
|---|---|
| `units-normalization-review.md` | `services/units_normalizer.py` (5-parameter runtime registry, conversion-factor audit), `scripts/verify_units.py` (orphaned build-time checker), `docs/plan/clinical/units-registry.md` (legacy design corpus, ~35 parameters) |
| `gold-pipeline-review.md` | `services/gold_reader.py` (Athena poller + edge normalization), `services/gold_schema.py` (table/query schemas), `services/gold_writer.py` (one-directional fact write-back) — data-quality-state handling and timestamp-preservation verdict |
| `sinais-vitais-cluster-review.md` | Cluster `sinais-vitais` (33 rule records) with a per-rule disposition table, plus independent review of the legacy `docs/plan/_work/dispositions/sinais-vitais.yaml` shard |
| `reference-ranges-review.md` | `api/reference_ranges.py` — units/naming lens only; explicitly does not duplicate the alert-threshold-engine workstream's `thresholds-seed-review.md` §4.2 value-level review of the same file |

## Item coverage (11/11 assigned items, per `coverage-map.md`)

| # | Item | Record |
|---|---|---|
| 1 | `src/intensicare/services/units_normalizer.py` | `units-normalization-review.md` §1-4 |
| 2 | `scripts/verify_units.py` | `units-normalization-review.md` §5 |
| 3 | `docs/plan/clinical/units-registry.md` | `units-normalization-review.md` §6 |
| 4 | `src/intensicare/services/gold_reader.py` | `gold-pipeline-review.md` §1-2 |
| 5 | `src/intensicare/services/gold_schema.py` | `gold-pipeline-review.md` §1, §3-4 |
| 6 | `src/intensicare/services/gold_writer.py` | `gold-pipeline-review.md` §3-4 |
| 7 | `src/intensicare/api/reference_ranges.py` | `reference-ranges-review.md` |
| 8 | Cluster `sinais-vitais` (33 rules) | `sinais-vitais-cluster-review.md` §2 |
| 9 | Disposition shard `docs/plan/_work/dispositions/sinais-vitais.yaml` | `sinais-vitais-cluster-review.md` §0, §2 |
| 10 | Tests `tests/test_units_normalizer.py` (listed, not reviewed per task packet) | `units-normalization-review.md` §0 |
| 11 | Tests `tests/test_gold_reader.py`, `test_gold_schema.py`, `test_gold_writer.py` (listed, not reviewed per task packet) | `gold-pipeline-review.md` §0 |

Nothing assigned to this workstream was unlocatable; no `SOURCE NOT
LOCATED` items.

## Provenance discipline

- Legacy repo pinned at git HEAD `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`
  (2026-08-15), re-verified by this reviewer (`git rev-parse HEAD`).
- OBSERVED 2026-08-15: this reviewer independently re-hashed (`shasum -a
  256`) every cited service/script/design-doc file and all 33
  `RULE-SINAIS-VITAIS-*.md` rule records, and compared each against
  `docs/archive/legacy-provenance/legacy-pin-cycle-1.md` and the cycle-1
  `inventory.md`. **Zero mismatches, zero missing files.** Per-file hashes
  are repeated in each record's own §0.

## Headline findings (worst first; detail and citations inside the records)

1. **Bilirubin unit conversion (mg/dL vs µmol/L, ~17× risk) is absent
   end to end.** `units_normalizer.py`'s runtime registry has no
   bilirubin entry at all, despite `docs/plan/clinical/units-registry.md`
   — itself part of this workstream's item list — already specifying the
   exact needed factor (µmol/L ×0.05848, ÷17.1) and citing the SOFA-liver
   hazard class. The OLTP-side plausibility bound
   (`RULE-SINAIS-VITAIS-022`, 0–30 "mg/dL") cannot discriminate a
   normal-range µmol/L value from a valid mg/dL value, so a wrong-unit
   value passes undetected at data entry too. This independently
   confirms, from the units/data-quality side, finding D-06 of the
   sepsis-scores workstream's `sofa-review.md`. **Verdict: REJECT** the
   current state as unsafe by omission; **TRANSFORM** required
   (`units-normalization-review.md` §3.2, `sinais-vitais-cluster-review.md`
   rule 022).
2. **FiO2 percent-vs-fraction (~100× risk, SYS-01) is correctly
   implemented** in `units_normalizer.py` (percent/% → ×0.01 to
   fraction) — the one parameter where the runtime matches the design
   doc exactly. Residual risk is coverage, not arithmetic: the guard
   function `validate_fio2_fraction` is defined but called nowhere in
   `src/`, and normalization only fires on the single ingestion path that
   already tags a unit (`units-normalization-review.md` §3.1).
3. **The runtime units registry implements 5 of the ~35 parameters its
   own design document (`units-registry.md`) catalogs** —
   PaCO2, potassium, sodium, magnesium, calcium, glucose, hemoglobin
   (design-flagged 1000× risk), platelets, leukocytes, CRP (10× risk),
   and vasopressor dosing (design-flagged ~60× risk, requires a
   conversion *service*, not a factor) are all absent from
   `units_normalizer.py` (`units-normalization-review.md` §4).
4. **Three independently-maintained, mutually-diverged "canonical unit"
   vocabularies coexist in the legacy repo**: `units_normalizer.py`'s
   5-parameter registry, `scripts/verify_units.py`'s orphaned
   category-keyed dict (not wired into any gate, misdescribed by
   `inventory.md` as "source of Gate A" when it is not), and
   `scripts/validate_alerts.py`'s (pathways-owned) forked copy of the
   same dict that has since drifted from it. This is precisely the
   fragmentation `units-registry.md` principle 1 exists to end, already
   reproduced inside the legacy repo itself (`units-normalization-review.md`
   §5).
5. **Normalization failures fail open, not closed.** `gold_reader.py`
   catches `UnitNormalizationError`, increments an error counter, and
   tags the row `_normalization_error` — but does not drop, block, or
   otherwise gate the row; the original, unconverted value flows on
   unchanged. Whether any downstream consumer honors that flag before
   scoring is outside this workstream's file set and is VALIDATION
   REQUIRED (`gold-pipeline-review.md` §2).
6. **Timestamp preservation: clean.** No fabricated timestamp was found
   anywhere in `gold_reader.py`/`gold_schema.py`/`gold_writer.py` —
   `recorded_at`/`ingested_at`/watermark advancement/`calculated_at`/
   `created_at` are all sourced from the data, never substituted with a
   wall-clock read (`gold-pipeline-review.md` §3). This should become an
   explicit V2 acceptance test, not an inherited accident.
7. **Two clinically load-bearing vitals have validation silently
   disabled** (not merely never built): mean arterial pressure
   (`RULE-SINAIS-VITAIS-020`) and SpO2 (`RULE-SINAIS-VITAIS-033`) both
   have a correctly-formed validator class commented out on the model
   field (`sinais-vitais-cluster-review.md` §4).
8. **`api/reference_ranges.py`'s six vital names cannot resolve against
   `units_normalizer.py`'s parameter registry** — English names here
   (`heart_rate`, `temperature`, ...) vs. Portuguese keys there
   (`frequencia_cardiaca`, `temperatura`, ...), with no mapping layer
   between this workstream's own two files. FiO2, this review's
   highest-hazard-class parameter, has no entry in the exposed reference
   set at all (`reference-ranges-review.md` §2-3). This is additional,
   non-duplicated grounds for the REJECT verdict the alert-threshold-engine
   workstream already proposed for this endpoint's threshold values.

All of the above are PROPOSALS pending named clinical review.
