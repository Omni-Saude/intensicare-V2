---
id: LEGREV-DQPC-GOLD
title: Legacy review — V1 Gold-layer read/normalize/write pipeline (gold_reader, gold_schema, gold_writer)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified forensic review of the V1 Athena Gold-layer incremental
  poller (`services/gold_reader.py`), its schemas and SQL templates
  (`services/gold_schema.py`), and the unidirectional write-back service
  (`services/gold_writer.py`), with an explicit HAZ-0005 trace of what
  happens to unparseable units / failed normalizations along the read path,
  and a timestamp-provenance check against non-negotiable rule 8 (never
  invent a source timestamp).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/gold_reader.py; src/intensicare/services/gold_schema.py; src/intensicare/services/gold_writer.py
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 in §0)
  section_or_lines: cited per finding as path:lines
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (legacy data-quality/physiological-calculation forensics reviewer, cycle 1 Task 1, wave 1b)
  transformation: read from source; summarized and analyzed; no code imported.
  confidence: high (source citations) / medium (clinical/architectural assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0006, HAZ-0021, HAZ-0025, HAZ-0030]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# V1 Gold-layer pipeline (reader / schema / writer) — forensic review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Verdicts use `docs/00-governance/legacy-import-policy.md` §4 vocabulary
> and are import *proposals* only; nothing here is imported.

## 0. Sources and integrity

Paths relative to `https://github.com/Omni-Saude/intensicare`. OBSERVED 2026-08-15
(re-hashed with `shasum -a 256`, compared against
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md` /
`inventory.md`): all match.

```text
c8eeddbe8b32974654b020d107a6c20a291ed142b7820a3480726a9c742ae9c7  src/intensicare/services/gold_reader.py
3776fb674505079ab50e40da7a3fbe55bb0f85a8ce0f6928c0a493e0ee313740  src/intensicare/services/gold_schema.py
c67edf33cd86147b3eaaff3abc88ba61a3b840653f59d2d7bee394313c42692f  src/intensicare/services/gold_writer.py
5141a6f37fdd787e09ed0fcadb3961b730b9a6cbfdaf2d578c3939f483f258c7  tests/test_gold_reader.py (rt) — LISTED per task packet, not reviewed
94e46dfbb050882352b8057993b297f7c1af88d68d91797389a9d25afdca7d7a  tests/test_gold_schema.py (rt) — LISTED per task packet, not reviewed
ef4adeeaf1a32c6a53607cd3527436b89de12c1d736410a07b0ba4243556720b  tests/test_gold_writer.py (rt) — LISTED per task packet, not reviewed
```

## 1. Architecture, as observed

Three components, one direction (`gold_reader.py:1-13`,
`gold_writer.py:1-9`):

1. **`AthenaPoller` (`gold_reader.py`)** — incremental poll of Gold-layer
   Athena tables per (tenant, domain), Redis-backed high-watermark,
   per-domain cadence (`gold_schema.DOMAIN_CADENCE`: sepsis 5 min,
   electrolytes 2 min, aki 1 h, ventilation 10 min, hemodynamics 5 min,
   neurology 15 min, medication 30 min — `gold_schema.py:17-25`),
   backpressure via a Redis lock (`gold_reader.py:140-165`), and
   edge-normalization of units via `units_normalizer.normalize_value`
   (`:27, 293-337` — reviewed for correctness in
   `units-normalization-review.md`).
2. **`GoldTableSchema` / query builders (`gold_schema.py`)** — three
   table schemas (`gold_vital_sign`, `gold_lab_result`,
   `gold_medication`), allowlist-validated table/column names for
   defense-in-depth against SQL injection (F-INT-001, `:42-74`), and two
   SQLAlchemy ORM models, `FactPatientScore` and `FactAlert`, that the
   writer targets.
3. **`GoldWriter` (`gold_writer.py`)** — one-directional write-back of
   already-computed `ClinicalScore`/`Alert` domain objects into
   `fact_patient_score`/`fact_alert`, with an explicit PHI denylist check
   before every insert (`:32-62`) and idempotent
   `ON CONFLICT DO NOTHING` inserts keyed on the source row id
   (`:114-126, 161-173`).

**Batch, not streaming.** The fastest cadence anywhere in this pipeline is
2 minutes (electrolytes). This corroborates, from the data-quality side,
the alert-threshold-engine workstream's `HAZ-0030` finding (batch Gold
reads cannot satisfy seconds-level bedside alerting) — cited here for
completeness, not re-reviewed; **HAZ-0030 is not this workstream's
finding to own**, it is an architectural fact this pipeline exhibits.

**Relationship to the `sinais-vitais` rule cluster (important scope
note).** The 33 `RULE-SINAIS-VITAIS-*` rules (own record,
`sinais-vitais-cluster-review.md`) govern **input validation on the OLTP
authoring side** (Django model-field validators, `movimentacao`/physician
forms) — a *different* data path from this Gold/Athena batch-read
pipeline. `DOMAIN_CADENCE` has no `"vitals"` domain at all; the domains
polled here (`sepsis`, `electrolytes`, `aki`, `ventilation`,
`hemodynamics`, `neurology`, `medication`) are downstream analytic/scoring
feeds, not the vital-signs capture surface itself. The two objects this
workstream reviews (OLTP plausibility validators and the Gold batch
pipeline) are related by clinical subject matter but are **structurally
independent** — a defect fixed in one does not fix the other. This is
itself a data-quality finding: there is no single, unified ingestion
boundary where every clinical value is unit-normalized exactly once, as
`units-registry.md` principle 1 demands (`units-normalization-review.md`
§6).

---

## 2. HAZ-0005 lens: what happens to a failed normalization?

OBSERVED (`gold_reader.py:293-337`, `_normalize_rows`):

```text
for row in rows:
    parameter = row.get("parameter"); value_str = row.get("value"); unit = row.get("unit_canonical")
    if parameter and value_str is not None and unit:
        try:
            canonical_value = normalize_value(parameter, value, unit)
            row["value"] = str(canonical_value)
        except (ValueError, UnitNormalizationError) as exc:
            errors += 1
            row["_normalization_error"] = str(exc)   # row NOT dropped
    normalized.append(row)   # every row reaches the caller, converted or not
```

**Finding: normalization failures are recorded, not enforced.** A row
whose `parameter` is unregistered (e.g. bilirubin — see
`units-normalization-review.md` §3.2), whose `unit` string is unrecognized
for that parameter, or whose conversion is a rejected affine transform,
is **not dropped, not blocked, and not converted** — it is appended to
`normalized_rows` with its **original, unconverted value** plus a
`_normalization_error` string field, and counted in the aggregate
`normalization_errors` integer returned to the caller
(`:283-291`). Nothing in this file's scope (`gold_reader.py`,
`gold_schema.py`, `gold_writer.py`) inspects `_normalization_error` again
— it is a per-row breadcrumb, not a gate. Whether any downstream consumer
of `poll_domain()`'s `normalized_rows`/`rows_processed` actually checks
this flag before feeding a value into a domain scorer is **outside this
workstream's file set** (the consumer would be a `domain_*.py` service
reviewed elsewhere) and is **VALIDATION REQUIRED** — this record can only
establish that the Gold-reader layer itself does not enforce the
"unmappable unit → invalid, never scored" contract the sepsis-scores
workstream's `sofa-review.md` (§9.2) proposes as a V2 requirement.

**Verdict: REJECT** the current fail-open row-survival behavior as the
sole control; **TRANSFORM** required — a row carrying
`_normalization_error` must be excluded from scoring (or explicitly
marked `not_evaluated`/`invalid`, never silently scored with the wrong
number) at a point downstream systems cannot bypass, not merely flagged
for an optional check.

**What does NOT fail open:** empty poll results (`:239-248`), Athena query
exceptions (`:225-237`, caught and returned as `status: "error"` with
`rows_processed: 0` — the watermark is *not* advanced on error, so a
retry will re-attempt the same window), and backpressure skips
(`:144-159`) all return an explicit, distinguishable status rather than
pretending success. This is good practice and is called out positively
below (§4).

---

## 3. Timestamp-preservation verdict (non-negotiable rule 8)

Checked every timestamp-producing code path in the three files for
fabrication (`datetime.now()`/`utcnow()` substituted for a source value):

- **`recorded_at` / `collected_at` / `resulted_at` / `ingested_at` /
  `administered_at`** (`gold_schema.py:118-119, 137-139, 156-157`): all
  declared as non-nullable schema columns sourced from the query result
  set — **no code in this file set writes a fabricated value into any of
  these columns.**
- **Watermark advancement** (`gold_reader.py:339-358`,
  `_compute_new_watermark`): computes the **maximum timestamp already
  present in the polled rows** for the domain's configured watermark
  column (`DOMAIN_WATERMARK_COLUMN`, `gold_schema.py:28-36`); if no row
  carries a timestamp, it explicitly **falls back to the prior
  watermark**, never to "now" (`:352-356`: `max_ts: str | None =
  current_watermark`, only overwritten by a value actually found in a
  row). This is the correct behavior — an empty poll cannot silently
  advance the high-watermark past data that has not yet arrived.
- **`FactPatientScore.calculated_at` / `FactAlert.created_at`**
  (`gold_schema.py:333, 363`): both are `Mapped[datetime]`, non-nullable,
  populated in `gold_writer.py` (`:108, 155`) directly from the source
  `ClinicalScore.calculated_at` / `Alert.created_at` object attributes —
  **not from `datetime.now()` at write time.** The writer never
  re-timestamps a value it is persisting.

**Verdict: RETAIN** this discipline as a hard V2 requirement — no
timestamp-fabrication defect was found anywhere in this file set. This is
the one unambiguous "clean" finding in this record; it should be written
into V2 as an explicit acceptance test (no code path may substitute a
wall-clock read for a source-provided clinical or ingestion timestamp),
not merely inherited by accident.

---

## 4. Data-quality-state handling — additional findings

1. **PHI denylist is an explicit, positive control.** OBSERVED
   (`gold_writer.py:32-62`, `_assert_phi_absent`): every write-back
   payload is checked against a fixed field-name denylist
   (`patient_name`, `dob`, `cpf`, `mrn`, etc.) before insert, raising
   `ValueError` on any match. This is a real, enforced invariant (not
   merely documented) and directly relevant to HAZ-0028 (PHI in
   analytics/audit stores) — **positive finding, VALIDATE the pattern**
   for V2 (still requires independent security review before import, per
   `legacy-import-policy.md` §3.5).
2. **`definition_version` silent-"unknown" fallback.** OBSERVED
   (`gold_writer.py:154`): `"definition_version": alert.definition_version_id
   or "unknown"` — if an `Alert` has no `definition_version_id`, the
   writer does not fail or flag it; it persists the **literal string**
   `"unknown"` into an analytics fact table. This is a smaller instance of
   the same silent-degradation pattern flagged elsewhere in this cycle's
   review (an absent value coerced into a plausible-looking placeholder
   rather than surfaced as a gap) — a `fact_alert` row with
   `definition_version = "unknown"` is indistinguishable, downstream, from
   one where the version genuinely could not be determined for a
   different reason. **Verdict: REJECT** the silent string-literal
   fallback; **TRANSFORM** — either require `definition_version_id` at
   the `Alert` domain-model level (fail before reaching the writer) or
   propagate a structured "version unknown, reason: X" rather than a bare
   string collision.
3. **`score_value: Mapped[int]`, non-nullable — evaluation-status
   resolution is assumed complete before this layer.** OBSERVED
   (`gold_schema.py:331`): `FactPatientScore.score_value` has no
   "not evaluated"/`null` representation at all. This means whatever
   missing-input semantics upstream domain scorers implement (HAZ-0005:
   absent input treated as numeric zero vs. a genuine
   not-evaluated/invalid state) **must already be resolved into a
   concrete integer before a score reaches this writer** — the Gold layer
   provides no structural way to distinguish "scored 0" from "not
   evaluated" once written. This is not a defect *in* this file set (the
   writer correctly requires a definite value, matching its own
   contract), but it is a load-bearing assumption this workstream must
   flag for the workstreams that own the upstream scorers (ews,
   sepsis-scores, neuro-sedation-scores): if HAZ-0005 zero-coercion
   happens upstream, this Gold layer has no mechanism to catch or reveal
   it after the fact. **VALIDATION REQUIRED**, cross-workstream.
4. **Idempotency is real but narrow.** `ON CONFLICT (source_score_id) DO
   NOTHING` / `ON CONFLICT (source_alert_id) DO NOTHING`
   (`gold_writer.py:114-118, 161-165`) — a second write of the same
   source row is silently skipped, not silently duplicated. Good
   invariant; note it is a "do nothing" conflict policy, not an upsert —
   if a source score/alert is later corrected, the Gold fact row is
   **not** updated (append-only by construction). Whether that matches
   the intended V2 correction/versioning model is a design question, not
   a defect — flagged as **VALIDATION REQUIRED** for whoever designs the
   V2 Gold-layer correction policy.

---

## 5. Verdict summary (this record)

| Artifact | Verdict |
|---|---|
| `AthenaPoller` architecture (watermark, backpressure, cadence, allowlisted SQL) | **VALIDATE** the mechanism (sound, defensively coded); note batch cadence corroborates HAZ-0030 (owned elsewhere) |
| `_normalize_rows` fail-open row survival on normalization error | **REJECT**; **TRANSFORM** to a hard not-evaluated/invalid gate |
| Timestamp handling (recorded_at/ingested_at/watermark/calculated_at/created_at) | **RETAIN** — no fabrication found; write into V2 as an explicit acceptance test |
| PHI denylist on write-back | **VALIDATE** the pattern (real, enforced control) |
| `definition_version` "unknown" string fallback | **REJECT**; **TRANSFORM** to a structured, surfaced gap |
| `score_value` non-nullable assumption | **VALIDATION REQUIRED** (cross-workstream dependency, not a defect in this file set) |
| Write-back idempotency (`ON CONFLICT DO NOTHING`) | **VALIDATE** the invariant; **VALIDATION REQUIRED** on whether append-only matches the intended correction model |

All verdicts: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
