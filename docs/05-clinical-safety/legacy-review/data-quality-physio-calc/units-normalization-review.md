---
id: LEGREV-DQPC-UNITS
title: Legacy review — V1 units normalizer, verify_units.py, and the units-registry.md design corpus
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified forensic review of the V1 canonical-units runtime
  (`services/units_normalizer.py`), the build-time unit-verification script
  (`scripts/verify_units.py`), and the legacy team's own forward-looking
  units-registry design document (`docs/plan/clinical/units-registry.md`),
  with a conversion-factor-by-conversion-factor UCUM/published-source audit
  and an explicit gap analysis between what the design document specifies
  and what the runtime service actually implements. The FiO2 (~100x) and
  bilirubin (~17x) unit-conversion risks named in the task packet are
  answered directly in §3.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/units_normalizer.py; scripts/verify_units.py; docs/plan/clinical/units-registry.md
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 in §0)
  section_or_lines: cited per finding as path:lines
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (legacy data-quality/physiological-calculation forensics reviewer, cycle 1 Task 1, wave 1b)
  transformation: >
    read from source; conversion factors independently checked against this
    reviewer's knowledge of UCUM and standard clinical-chemistry reference
    conversions — external documents were NOT re-fetched in this
    environment, so every published comparison below carries VALIDATION
    REQUIRED for re-verification against the printed source before reliance.
  confidence: high (code citations, arithmetic checks) / medium (clinical-source comparisons)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0006, HAZ-0032]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# V1 units-normalization surface — forensic review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Nothing here is an import decision. Per
> `docs/00-governance/legacy-import-policy.md` §1 the default is **do not
> copy**; every verdict below is a classification proposal under §4 only.

## 0. Sources and integrity

Paths relative to `/Users/familia/intensicare/`. OBSERVED 2026-08-15 (this
reviewer re-hashed each file with `shasum -a 256` and compared against
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md` / the cycle-1
`inventory.md`): all three match.

```text
1f95ec99c03f4d1e17548fb33e2f4d08431f1801b050765d77d6fa3bcc0f80c4  src/intensicare/services/units_normalizer.py
80513917eaf841f139aa8859b8f42f6f0fc2ce6a3e51a0b37154b4a6ebce4c7d  scripts/verify_units.py (rt)
c8e4fccbb04e003763ade67fba0ba753b05a1e56ee97747cb98b8981efb6d8a7  docs/plan/clinical/units-registry.md (rt)
345583406893937287376f34c6e7d71a32091130af7e8918c5ee891dc092b863  tests/test_units_normalizer.py (rt) — LISTED per task packet, not reviewed
```

`(rt)` = hash-and-note, computed at read time 2026-08-15; matches
`inventory.md`'s own `(rt)` values for these paths.

---

## 1. `services/units_normalizer.py` — what it is

OBSERVED (`units_normalizer.py:1-14`): a small module providing (a) a single
guard function, `validate_fio2_fraction`, and (b) a registry-based
normalizer, `normalize_value`, "used at the Gold-layer read boundary
(`services.gold_reader`) to convert whatever unit a source system reports
into each parameter's canonical unit." The module's own docstring states
its scope precisely: fixed multiplicative factors only; affine conversions
(Fahrenheit→Celsius) are deliberately unsupported and rejected loudly
rather than silently mis-converted — a genuinely good HAZ-0005-aware design
choice (`:9-13`, `:88-93`), reviewed further in §4.

### 1.1 `validate_fio2_fraction` — defined, never wired in

OBSERVED (`:25-39`): raises `ValueError` if `value > 1.0`. OBSERVED
(repo-wide `grep`): this function is **imported and called nowhere else in
`src/`** — no scorer, no domain service, no API route references it. It is
dead code: a correct guard that protects nothing in the live system.
**Verdict: REJECT** the current (unwired) state; **TRANSFORM** the concept
— an FiO2 fraction guard is exactly the right idea, but it must be called
at every FiO2 ingestion/consumption boundary, not merely exist.

### 1.2 `normalize_value` and the canonical-unit registry

OBSERVED (`:54-94`): `_PARAMETER_REGISTRY` holds **exactly five**
parameters: `creatinina`, `fio2`, `lactato_arterial`, `pao2`,
`temperatura`. Each maps a `canonical_unit` and a `units` dict of
`{unit_name: factor}`, with `factor: None` reserved for recognized-but
unsupported affine conversions (used only for `degf`, `:91`).

OBSERVED (`:108-125`): unknown parameter, unrecognized unit, and
`factor is None` all raise `UnitNormalizationError` (a `ValueError`
subclass) — the function never silently returns a wrong number for those
three cases. This is the correct failure mode *for the function itself*;
whether the **caller** treats that exception as "not evaluated" rather
than passing the original value through is a `gold_reader.py` question,
answered in `gold-pipeline-review.md` §2 (short answer: the row survives
with its original, unconverted value and a `_normalization_error` flag —
not dropped, not blocked).

OBSERVED (repo-wide `grep`): `normalize_value` has **exactly one caller**
in `src/`: `gold_reader.py:320` (`AthenaPoller._normalize_rows`). No
domain scorer (`sofa.py`, `qsofa.py`, the `domain_*.py` services) and no
API route calls into this registry directly. Its reach is therefore
limited to whatever flows through the Athena/Gold batch-poll path; values
entering by the direct OLTP/API path that the `sinais-vitais` rule cluster
governs (see `sinais-vitais-cluster-review.md`) receive **no unit
conversion or unit-awareness at all** — those validators check numeric
plausibility only (§1.3 below and the cluster record cross this wire in
both directions).

---

## 2. Conversion-factor audit (all five implemented parameters)

Method: each factor is checked as `value_in_from_unit × factor ==
value_in_canonical_unit`, against this reviewer's knowledge of UCUM and
standard clinical-chemistry conversions (VALIDATION REQUIRED — re-verify
against a printed reference before reliance, per the front-matter above).

| # | Parameter | Canonical | Edge unit → factor | Arithmetic check | Published comparison | Result |
|---|---|---|---|---|---|---|
| 1 | `fio2` | `fraction` | `percent`/`%` → ×0.01 | 40 % × 0.01 = 0.40 fraction — correct direction and magnitude | Matches `units-registry.md` §2.1 (`LAW`, SYS-01) and standard FiO2 percent↔fraction convention | **VERIFIED** (arithmetic + design-doc agreement) |
| 2 | `creatinina` | `mg/dL` | `umol/l` → ×0.0113 | 88.4 µmol/L × 0.0113 = 0.999 mg/dL, vs. the textbook 1 mg/dL ≈ 88.4 µmol/L identity | Matches `units-registry.md` §2.5 (`÷88.42`, i.e. ×0.011310 — a 4th-significant-figure rounding difference, clinically immaterial) | **VERIFIED**, precision note below |
| 3 | `lactato_arterial` | `mmol/L` | `mg/dl` → ×0.111 | 9.008 mg/dL × 0.111 = 1.0000 mmol/L, vs. lactate MW 90.08 g/mol ⇒ 1 mmol/L = 9.008 mg/dL (1/9.008 = 0.11101) | Matches `units-registry.md` §2.1 (`×0.111 (÷9.01)`, SYS-03, "~9x legacy chaos") | **VERIFIED** |
| 4 | `pao2` | `mmHg` | `kpa` → ×7.50062 | Standard SI identity 1 kPa = 7.50062 mmHg (1/0.133322) | Matches `units-registry.md` §2.1 | **VERIFIED** |
| 5 | `temperatura` | `°C` | `degc`/`°c` → ×1.0; `degf` → `None` (rejected, not converted) | Fahrenheit needs `(F−32)×5/9`, not a multiplier — correctly refused rather than mis-applied | Matches `units-registry.md` §2.7 ("`°F` → (°F−32)×5/9 (affine, null)") | **VERIFIED** — the one row where "no conversion" is the *correct* behavior |

**Precision note (row 2):** `units-registry.md` cites `÷88.42` (⇒
×0.011307...); the implemented `0.0113` differs at the 4th significant
figure (≈0.06 % lower magnitude). Clinically immaterial at any creatinine
value in the validated plausibility range (0–20 mg/dL per
`RULE-SINAIS-VITAIS-025`), but no rounding/precision policy is documented
anywhere in the module — `normalize_value` returns the raw
floating-point product with no explicit `round()` — **VALIDATION
REQUIRED**: a named precision/storage policy (the design doc calls for
`DECIMAL(4,1)` storage for temperature, `:155` of `units-registry.md`, but
`units_normalizer.py` enforces no comparable precision contract for any
parameter it converts).

**Conversion-factor audit result for this record: 5 of 5 implemented
factors independently VERIFIED** against UCUM/standard clinical-chemistry
identities and against the legacy team's own design citations. **Zero
implemented factors found to be numerically wrong.** The defect in this
module is not an incorrect factor — it is **near-total absence of
coverage**, detailed in §3–§4.

---

## 3. The two named risks from the task packet, answered directly

### 3.1 FiO2 percent-vs-fraction (~100x risk, `units-registry.md` SYS-01)

**Correctly implemented.** `fio2` is registered with `fraction` as
canonical and both `percent` and `%` map to ×0.01 (`:65-68`). Fed a value
tagged `unit_canonical="percent"`, `normalize_value` returns the correct
fraction. This is the one parameter in the runtime registry that fully
matches its `units-registry.md` design entry (`fraction`, LAW, SYS-01).
**Residual risk is not in the arithmetic but in coverage**: this
conversion only fires for rows that pass through
`gold_reader._normalize_rows` **and** already carry a correct
`unit_canonical` tag of `"percent"`/`"%"`/`"fraction"`. Nothing in this
module's file set enforces that every FiO2-bearing row on every ingestion
path carries a unit tag at all — `validate_fio2_fraction` (§1.1) is the
dead guard that was presumably meant to backstop exactly this case and
does not. **Verdict: VALIDATE** the factor itself (arithmetically and
citation-verified); **REJECT** the coverage gap (single-path enforcement,
dead secondary guard) as insufficient to retire the hazard class.

### 3.2 Bilirubin mg/dL-vs-µmol/L (~17x risk, sofa-review.md D-06)

**Not implemented at all.** `bilirrubinas` (or any bilirubin spelling)
does **not appear** in `_PARAMETER_REGISTRY` (`:54-94`, confirmed by
direct read — the five keys are exhaustive). This is despite:

- `units-registry.md` §2.5 (part of **this same workstream's item list**)
  explicitly specifying the needed conversion: `bilirubina | total
  bilirubin | mg/dL | µmol/L ×0.05848 (÷17.1) | SOFA-liver bands; SYS-07
  boundary gaps are threshold bugs` (`units-registry.md:131`) — the
  legacy team's own design document already named the correct factor and
  cited the hazard class, and the runtime service never implemented it.
- The sepsis-scores workstream's independent review
  (`docs/05-clinical-safety/legacy-review/sepsis-scores/sofa-review.md`,
  finding D-06) found the identical hazard from the *scoring-function*
  side: `sofa.py`'s bilirubin bands are `mg/dL`-only despite a docstring
  inviting `µmol/L` input, and "a µmol/L value passed as-is over-scores by
  ~17× (normal 10 µmol/L reads as 10 'mg/dL' → 3 points)." **This record
  confirms, from the units-normalization side, that no layer of the
  pipeline catches that error before it reaches the scorer** — there is
  no unit-tagged edge conversion anywhere upstream for bilirubin, so a
  µmol/L value entering via the Gold/Athena path would raise
  `UnitNormalizationError: Parâmetro desconhecido` in `gold_reader.py`
  (caught, logged, row kept unconverted — see `gold-pipeline-review.md`
  §2) rather than being converted or blocked, and a value entering via the
  direct OLTP path (`RULE-SINAIS-VITAIS-022`, `0–30 mg/dL` plausibility
  bound) is not unit-tagged at all and a normal-range µmol/L value (≈5–21)
  passes that bound undetected as if it were `mg/dL` — see
  `sinais-vitais-cluster-review.md` rule 022.

**Verdict: REJECT** the current state as clinically unsafe by omission —
this is the single most severe finding in this workstream. **TRANSFORM**
required: implement the `bilirrubinas`/`bilirubina` entry using the exact
factor `units-registry.md` already specifies (×0.05848, VALIDATION
REQUIRED for independent re-verification against a clinical-chemistry
reference before any import), wired into every ingestion path that can
carry a bilirubin value, not only the Gold/Athena poller.

---

## 4. Coverage gap: the runtime registry vs. its own design document

`units-registry.md` §2 catalogs **≈35 parameters** with named canonical
units, cited edge conversions, and explicit hazard-class provenance
(`SYS-01` through `SYS-09` plus several "related unit mislabels", §3).
`units_normalizer.py` implements **5**. The following table lists every
`units-registry.md` parameter that is clinically load-bearing in this
workstream's own item set (the `sinais-vitais` cluster, §1.3) or named as
a systemic hazard in `units-registry.md` §3, cross-referenced against its
implementation status in the runtime registry.

| Parameter (`units-registry.md`) | Design canonical + edge factor | Hazard class named | Implemented in `units_normalizer.py`? |
|---|---|---|---|
| `bilirubina` | `mg/dL`; µmol/L ×0.05848 | 17× (D-06, this record §3.2) | **No** |
| `dose_vasopressor` | `mcg/kg/min`; `mL/h` needs a **service**, not a factor | SYS-02, ~60× | **No** (no fixed-factor entries, no service) |
| `potassio` | `mmol/L`; `mg/dL` ×0.2558 (design doc itself flags "suspected mislabel") | RULE-EQUILIBRIO-004 mislabel | **No** |
| `sodio` | `mmol/L`; `mg/dL` ×0.435 (design doc: "suspected mislabel") | Δ-Na correction safety (CON-0061) | **No** |
| `hemoglobina` | `g/dL`; legacy `mg/dl` label flagged **1000×** error | audit-named 1000× | **No** |
| `glicemia` | `mg/dL`; `mmol/L` ×18.016 | none named, but an 18× class by construction | **No** |
| `plaquetas` | `10^3/uL` (== `10^9/L`); `/uL`/`/mm^3` ÷1000 | scale mismatch vs. `RULE-SINAIS-VITAIS-028`'s raw `/mm3` bound | **No** |
| `leucocitos` | `10^3/uL`; `/uL`/`/mm^3` ÷1000 | scale mismatch vs. `RULE-SINAIS-VITAIS-026`'s raw `/mm3` bound | **No** |
| `proteina_c_reativa` (CRP) | `mg/L`; `mg/dL` ×10 | "frequent silent 10x error" | **No** |
| `paco2` | `mmHg`; `kPa` ×7.50062 | drives NEWS2 Scale 2 | **No** (only its sibling `pao2` is registered) |
| `peep`, `pressao_plato`, `pressao_inspiratoria` | `cmH2O`; `mbar` ×1.01972 | design doc itself flags bounds-disagreement needing ratification | **No** |
| `peso` (weight) | `kg`; comma/dot decimal-parse hazard | SYS-09, ~10× (a **parsing**, not conversion-factor, bug) | **No** (out of this module's scope entirely — no weight parameter exists here) |

**Verdict on the runtime registry as a whole: REJECT completeness.** The
five implemented conversions are individually sound (§2), but the module
cannot be relied upon as "the" canonical-units enforcer its own docstring
and `units-registry.md`'s principle 1 ("Canonical at every computation and
API boundary") require — it enforces that boundary for one in seven
clinical domains and for roughly one in seven cataloged parameters.
**TRANSFORM**: extend `_PARAMETER_REGISTRY` to the full `units-registry.md`
catalog (or a named, ratified subset) before any consumer is allowed to
assume unit safety from this module's presence alone.

---

## 5. `scripts/verify_units.py` — orphaned, stale, and internally divergent from its own claimed role

OBSERVED (`:1-7`): the script's own docstring calls it "a skeleton —
extend as the canonical unit registry grows" and states its purpose is to
validate YAML-declared threshold units against a `CANONICAL_UNITS`
dict (`:15-29`) by naive regex extraction of `unit:` keys (`:40-55`,
explicitly "naive").

**Not wired into anything.** OBSERVED (repo-wide `grep` for
`verify_units`): the only two hits outside the file itself are a
narrative mention in `INTENSICARE_TECHNICAL_ASSESSMENT.md` and an
**inconsistent claim** inside `scripts/validate_alerts.py` (see next
paragraph) — no CI workflow, `Makefile` target, or pre-commit hook
invokes `scripts/verify_units.py`. `inventory.md` describes it as "source
of Gate A" (`docs/05-clinical-safety/legacy-review/00-inventory/
inventory.md:508`); this is **not what the code does**.

**The claim is contradicted by the actual Gate A implementation.**
`scripts/validate_alerts.py` (owned by the **pathways** workstream per
`coverage-map.md` — not reviewed in depth here, cited only for the
cross-check) states in its own comment "Canonical unit registry (source:
scripts/verify_units.py)" (`validate_alerts.py:59-60`) but **does not
import `verify_units.py`** — `grep` for `import` in that file shows no
such import; it carries its **own, separately-maintained**
`CANONICAL_UNITS` dict (`validate_alerts.py:61-83`) that has **diverged**
from `verify_units.py`'s: it adds `irpm` to `respiratory_rate`,
`mL/kg/h` to `volume`, `dias`/`stage`/`dimensionless`/`ciclos/min/L` to
several categories, and three entirely new categories
(`events`, `dose_rate`, `position`) absent from `verify_units.py`. Two
independently-maintained copies of "the" canonical registry, forked and
drifting, is precisely the failure mode `units-registry.md` principle 1
exists to prevent ("There is no 'it depends on the site'... resolved
*before* the value enters the system") — and it has already happened
between two files in the *same* legacy repository.

**Category-based, not parameter-based — a design mismatch with
`units-registry.md`.** `verify_units.py`'s `CANONICAL_UNITS["lab"]`
accepts `{"mg/dL", "mmol/L", "mEq/L", "g/dL", "U/L", "ng/mL", "pg/mL"}` as
*all* canonical for the single bucket `"lab"` (`:23`) — meaning a lactate
value declared `unit: mg/dL` and one declared `unit: mmol/L` would **both
pass** this checker, even though `units-registry.md` §2.1 designates
exactly one of those as canonical for `lactato_arterial` (SYS-03, ~9×
class) and treats the other as an edge input requiring conversion. A
category-level "is this unit spelled correctly" checker is a materially
weaker guarantee than a parameter-level "is this the one canonical unit"
checker, and would not have caught any of the SYS-01/02/03 defects
`units-registry.md` §3 documents.

**Verdict: REJECT** the current script as neither wired-in nor structurally
capable of the single-canonical-unit-per-parameter guarantee the
workstream's own design document requires. **TRANSFORM** the *intent*
(build-time unit verification against a canonical registry, per
`units-registry.md` principle 4, "unit mismatch is a BUILD-TIME error, not
a runtime surprise") — this is exactly the right idea and should survive
into V2, rebuilt parameter-keyed against the single registry, actually
wired into CI, and de-duplicated against whatever gate the pathways
workstream's `validate_alerts.py` Gate A becomes.

---

## 6. `docs/plan/clinical/units-registry.md` — design corpus, not implemented code

This document (item in this workstream's own list) is the legacy team's
**own forward-looking design proposal** for a V2 units registry — it is
**not** running code, and per
`docs/00-governance/legacy-import-policy.md` §1/§2 it is "risk-informed
input, not authority": informative, unratified under V2 governance, and
independently reviewed here rather than trusted at face value.

**What it gets right (OBSERVED, read in full — §2.1-2.9, §3):**
- A genuinely single-canonical-unit-per-parameter design (principle 1),
  edge-conversion vs. 1:1-alias distinction (principle 2), and a named
  build-time-error requirement (principle 4) — directly addressing the
  exact failure class (§5 above) found live in this repository.
- Every factor carries a citation or a named provenance ("provenance
  duty," principle 5): molecular-weight-derived factors name the analyte,
  systemic hazard classes (SYS-01/02/03/09) each cite the specific legacy
  rule IDs and an approximate magnitude of the defect they close.
- It independently corroborates this record's §3 findings for FiO2
  (SYS-01, "~100x too small") and names the bilirubin factor this record's
  §3.2 shows is unimplemented, plus several risks not yet checked
  anywhere in this workstream's runtime-code file set (hemoglobin 1000×,
  vasopressor dosing ~60×, weight-parsing ~10×) — see §4 above.

**What requires independent validation before any reliance:**
- Every conversion factor is **VALIDATION REQUIRED** against a printed
  clinical-chemistry/UCUM reference regardless of how well-cited it reads
  here — this reviewer did not re-fetch external sources (front matter
  above), and the document is the legacy team's own unratified output,
  not a primary source itself.
- Two factors are flagged by the document's own authors as "⚠ suspected
  mislabel" (potassium `mg/dL` ×0.2558, sodium `mg/dL` ×0.435,
  `units-registry.md:113-114`) — these are explicitly **not** ready for
  any use, including as a citation, without independent clinical
  re-derivation.
- §4's "machine registry pointer" names
  `docs/plan/_work/units/registry.yaml` as the authoritative
  machine-readable source ("this markdown never overrides it"). That file
  is **outside this workstream's assigned item list** (not present in
  `coverage-map.md`'s WAVE-1B data-quality-and-physiological-calculation
  row); it is noted here only as a pointer for whichever workstream
  ultimately owns it, not reviewed.

**Verdict: VALIDATE** the document's content as a well-evidenced PROPOSAL
input to V2's actual units registry (ceiling per import policy — no
legacy artifact, however well-cited, may enter V2 without independent
clinical/empirical validation and named approval); **REJECT** treating it
as already true of the runtime system — §4 above shows the gap is large.

---

## 7. HAZ-0005 lens summary for this record

| Question | Answer |
|---|---|
| Unparseable/unrecognized unit | `UnitNormalizationError` raised (loud), not silently coerced — correct for the function itself (`:114-117`). |
| Out-of-range value | Not this module's job — plausibility bounds live in the `sinais-vitais` rule cluster (separate record); `normalize_value` only converts units, does not range-check. |
| Failed conversion (affine, e.g. °F) | Raised loud, not silently applied as if multiplicative (`:120-124`) — the one unambiguously HAZ-0005-safe design choice in this module. |
| Missing parameter entirely (e.g. bilirubin) | Raised loud from `normalize_value`'s perspective — but because the parameter was never registered, this is indistinguishable at the call site from "this system doesn't know bilirubin needs conversion at all," and (per `gold-pipeline-review.md` §2) the caller does not drop the row — it flows on with its original, unconverted value. **This is the residual HAZ-0005 exposure**: the guard is loud at the unit-registry layer but silent-by-omission one layer up. |

---

## 8. Verdict summary (this record)

| Artifact | Verdict |
|---|---|
| `units_normalizer.py` — 5 implemented conversion factors | **VALIDATE** (arithmetically and citation-verified; VALIDATION REQUIRED for external re-verification and named clinical approval before any import) |
| `units_normalizer.py` — registry completeness / coverage | **REJECT** (5 of ~35 design-cataloged parameters; bilirubin, the workstream's own headline risk, entirely absent) |
| `validate_fio2_fraction` | **REJECT** current (dead, unwired) state; **TRANSFORM** the concept |
| `scripts/verify_units.py` | **REJECT** (orphaned, stale, category- not parameter-keyed, diverged from `validate_alerts.py`'s copy, misdescribed as "source of Gate A" when it is not); **TRANSFORM** the intent |
| `docs/plan/clinical/units-registry.md` | **VALIDATE** the content as design input; **REJECT** any assumption it is already implemented |

All verdicts: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
