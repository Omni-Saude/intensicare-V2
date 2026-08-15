---
id: LEGREV-OSMS-ELY
title: Legacy review — electrolyte domain (six-analyte evaluator, catalog, pathway, seed)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Forensic review of the legacy V1 electrolyte clinical content:
  domain_electrolyte.py (potassium, sodium, sodium-correction-rate, calcium,
  magnesium, phosphate evaluators), the runtime catalog electrolyte.yaml, the
  pathway equilibrio.yaml, the domain spec electrolyte.md, and migration 0016.
  All verdicts are PROPOSALS; nothing is imported.
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
  hazards: [HAZ-0005, HAZ-0006, HAZ-0019, HAZ-0022, HAZ-0035]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — electrolyte domain

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Guideline comparisons rely on trained knowledge (not re-fetched):
> European hyponatraemia guideline (Spasovski et al. 2014), UK Kidney
> Association hyperkalaemia guidance, Sterns JASN 2015 (osmotic
> demyelination), Geerse et al. Crit Care 2010 (hypophosphatemia). All such
> statements are VALIDATION REQUIRED.

## 0. Artifacts and integrity (OBSERVED 2026-08-15; hashes match inventory)

| Artifact | SHA-256 |
|---|---|
| `src/intensicare/services/domain_electrolyte.py` | `ffdd4f931c7b37c7e55079ad1dac2c4685bc4318566c2ccf646ea1175a4fc5cc` |
| `docs/plan/_work/alerts/electrolyte.yaml` | `0de2f4e7218d1acdd2c2c83ff8a25435bda5f996e577f073f3b9988f9e4085f3` (rt) |
| `_work/alerts/pathways/equilibrio.yaml` | `5d3af65ac19c81d4574a8c5848f4599949aad666ef0be808cdeb672607e60194` |
| `docs/plan/clinical/domains/electrolyte.md` | `02b439a76664655b4b44888ea3f9443a4b7412a24c12fffc4f585728b506e26b` (rt) |
| `alembic/versions/0016_seed_electrolyte_definitions.py` | `6018a06308c6d8b3cba2a9a3298826de8716cdfdfc4a45383bd167126aa152ba` (rt) |

## 1. Implemented thresholds, verbatim (`domain_electrolyte.py`)

| Analyte (unit per catalog) | critical | urgent | watch (cofactor-gated) | Lines |
|---|---|---|---|---|
| Potassium hyper (mmol/L) | >6.5 | >6.0 | >5.5 AND delta_k_24h>0.5 AND (CKD or hyperkalemiant drug or digoxin) | 95-104 |
| Potassium hypo | <2.5 | <3.0 | <3.5 AND (QTc>500 or high-dose furosemide or digoxin or Mg<0.7) | 107-117 |
| Sodium hyper (mmol/L, glucose-corrected: Na + 0.024×(glicemia−100) when glicemia>100) | >160 | >155 | >150 AND trailing Δ24h>+5 | 189-203 |
| Sodium hypo | <120 | <125 | <130 AND trailing Δ24h≤−5 | 206-212 |
| Na correction rate (from 24h nadir, NOT trailing delta) | >10 mmol/L/24h | >8 | — | 264-272 |
| Ionized calcium hypo (mmol/L) | <0.80 (fallback: corrected total <7.0 mg/dL) | <0.90 | — | 327-335 |
| Ionized calcium hyper | >1.60 (fallback: corrected total >14.0 mg/dL) | >1.45 | — | 338-344 |
| Magnesium (mmol/L) | <0.5 | <0.7 | <0.9 AND (K<3.5 or QTc>500) | 404-410 |
| Phosphate — **code** (mmol/L) | hyper >2.5 | hypo <0.3 | hypo <0.8; hyper >1.5 | 458-467 |
| Phosphate — **catalog/seed/spec** (mg/dL) | hypo <1.0 | hypo <1.5 | hyper >7.0 | electrolyte.yaml:353-356 |

Corrected total calcium: `calcio_total + 0.8*(4.0 − albumina)` (line 319) —
the standard Payne-style albumin correction (VALIDATION REQUIRED).

## 2. Discrepancy analysis

### 2.1 Phosphate — four-way contradiction (worst finding)

- Catalog `electrolyte.yaml:346-356`: "**THRESHOLDS PENDING RATIFICATION
  (pending RAT-ELY-01)**", canonical unit **mg/dL**, bands hypo **critical**
  <1.0 / urgent <1.5, hyper **watch** >7.0 (deliberately capped — marker,
  not emergency), citing Geerse 2010 (severe <0.32 mmol/L ≈ 1.0 mg/dL).
- Spec `domains/electrolyte.md:26,57,189`: same as catalog — mg/dL, pending
  RAT-ELY-01.
- Migration 0016 seeds `ALERT-ELY-PHOSPHATE-01-f6a7b8` with the
  catalog bands ("<1.0 crit, <1.5 urg / >7.0 watch, capped. Pending
  RAT-ELY-01").
- **Code** `domain_electrolyte.py:429-467` claims "**CLINICALLY RATIFIED:
  RAT-ELY-01**", switches the unit to **mmol/L**, demotes severe
  hypophosphatemia to **urgent** (no critical hypo band at all), and
  promotes hyperphosphatemia >2.5 mmol/L to **critical** — the exact
  opposite severity topology of the pending-ratification design. Its
  in-module seed entry uses a different definition suffix
  (`...-g7h8i9`) than the DB-seeded one (`...-f6a7b8`), so the persisted
  definition registry **describes a rule the runtime does not execute**
  (HAZ-0019 / HAZ-0035).
- Consequence if a Brazilian lab feeds mg/dL (the declared canonical unit)
  into the mmol/L code: normal PO4 3.5 mg/dL → >2.5 → false CRITICAL
  hyperphosphatemia; severe hypophosphatemia 1.2 mg/dL → no fire at all.
- The code's docstring citation "KDIGO phosphate management guidelines" for
  ICU acute phosphate alerting is a mis-anchor (KDIGO CKD-MBD is a chronic
  disease guideline) — UNVERIFIED/INAPPLICABLE CITATION.

### 2.2 Calcium — promised QTc signal dropped

Catalog `electrolyte.yaml:238` requires: "QTc context: hypocalcemia prolongs
QTc — emit qtc_risk_electrolyte to pharmaco when qtc > 500 ms" (TV-7 asserts
it). Code reads the input and discards it (`inputs.get("qtc")`,
`domain_electrolyte.py:314` — a bare expression) and never emits any
cross-domain context. Cross-domain Torsades correlation silently missing.

### 2.3 Fallback asymmetry

When ionized calcium is unavailable, corrected-total fallback fires only the
critical bands (<7.0 / >14.0 mg/dL); there is no urgent fallback band
(`domain_electrolyte.py:332-344`) — moderate disturbances invisible on the
fallback path (catalog specifies the same; design gap, both surfaces).

### 2.4 Pathway `equilibrio.yaml` — parallel divergent surface

| Analyte | Pathway (unit) | Catalog/code | Conflict |
|---|---|---|---|
| K hyper | [6.0, ∞) critical (mEq/L) | >6.5 critical, 6.0-6.5 urgent | K 6.2: critical vs urgent |
| K watch | [5.0, 6.0) watch unconditional | watch needs >5.5 + trend + risk factor | over-alerting band |
| Na | <125 / ≥155 critical; no urgent tier | crit <120/>160, urg <125/>155 | Na 156: critical vs urgent; Na 122: critical vs urgent |
| Mg | **mg/dL** bands (<1.5 critical ≈ 0.62 mmol/L) | mmol/L (<0.5 critical) | unit divergence for same analyte across surfaces; Mg 0.62 mmol/L: critical vs urgent |
| iCa hyper | [1.3, ∞) watch — capped | >1.45 urgent, >1.60 critical | severe hypercalcemia (iCa 1.8) shown as watch on pathway |
| Phosphate | removed as "órfão" (orphan note, lines 14-16) | active alert | pathway silent on PO4 |

Same patient, same value, different severity depending on surface — the
cross-surface inconsistency HAZ class the alert-threshold-engine review
documented for scores recurs here for electrolytes.

### 2.5 Citation audit (catalog)

11 citations; the potassium (UKKA hyperkalaemia; Clase/KDIGO conference BMJ
2020), sodium (Adrogué-Madias NEJM 2000; Sterns JASN 2015), magnesium
(Hansen & Bruserud ICMx 2018;6:21) and phosphate (Geerse Crit Care 2010)
anchors are plausible primary sources — none re-fetched, all VALIDATION
REQUIRED. "Spasovski / ESICM-ESE-ERBP 2024 consensus on acute hyponatraemia
and hypernatraemia" — the 2014 European hyponatraemia guideline is real; a
2024 combined dysnatremia consensus is not known to this reviewer:
UNVERIFIED CITATION. "Mousseaux NDT 2022" and "Cooper ICM 2022" —
plausible, unverified.

## 3. HAZ-0005 zero-coercion assessment

| Path | Behavior on absent input | Assessment |
|---|---|---|
| Every evaluator | primary analyte `None` → `fired=False` | no numeric coercion, but no-fire is indistinguishable from evaluated-normal; no evaluation-status contract (HAZ-0021) |
| Potassium watch bands | missing `delta_k_24h` or cofactors → watch cannot fire | K 5.5-6.0 with absent trend data silently unflagged; absence suppresses a designed signal |
| Sodium watch bands | missing trailing delta → watch cannot fire | same pattern |
| Calcium fallback | missing albumin → no corrected total → no fallback | hypocalcemia invisible without albumin; silent |
| `should_auto_resolve` (532-551) | stale → watch/urgent auto-resolve | staleness treated as recovery — HAZ-0006/0022, identical to the AKI module |
| Digoxin/CKD/drug flags | default False | unrecorded medication = no risk |

## 4. Verdicts (all PROPOSAL)

| Artifact / path | Verdict | Rationale |
|---|---|---|
| Potassium evaluator | VALIDATE | bands plausible and catalog-consistent; cofactor-gated watch design is good alarm hygiene; primary-source confirmation needed |
| Sodium evaluator | VALIDATE | glucose correction + absolute bands match catalog; correction factor 0.024/(mg/dL) plausible |
| Sodium correction-rate evaluator | VALIDATE | nadir-based (not trailing) design is correct and guards the documented ODS-miss failure (catalog TV-6); ceiling 8-10 mmol/L/24h consistent with published guidance |
| Calcium evaluator | REFINE | bands match catalog, but the promised qtc_risk_electrolyte emission is unimplemented (dead input) and fallback lacks urgent tier |
| Magnesium evaluator | VALIDATE | plausible; no hypermagnesemia axis (accepted scope: alert named hypomagnesemia) |
| Phosphate evaluator | REJECT as implemented | contradicts its own catalog, seed, and spec in unit, bands, and severity ceilings; carries a false "CLINICALLY RATIFIED" claim against a recorded "pending RAT-ELY-01" |
| `electrolyte.yaml` catalog | VALIDATE | strong: 39 boundary vectors, cofactor gates, explicit pending-ratification honesty for PO4 |
| `equilibrio.yaml` pathway bands | REJECT (bands) / TRANSFORM (concept) | four analyte bands conflict with the catalog in value, tier, or unit |
| `domains/electrolyte.md` spec | VALIDATE | unit discipline (mmol/L vs mEq/L vs mg/dL) explicitly reasoned |
| migration 0016 | VALIDATE (content) with REJECT note | descriptions match catalog; but the seeded PHOSPHATE definition mis-describes actual runtime behavior — the registry/runtime pair violates the versioning invariant |

**Worst finding:** the phosphate evaluator ships thresholds that its own
catalog, spec, and migration record as *pending clinical ratification*,
under a false in-code "CLINICALLY RATIFIED" claim, with a changed canonical
unit — a governance and clinical-safety breach in one artifact
(HAZ-0019/HAZ-0035 lineage).
