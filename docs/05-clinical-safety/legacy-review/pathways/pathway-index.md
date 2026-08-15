---
id: LEGREV-PATH-INDEX
title: Legacy pathway definitions — index of all twelve V1 pathways (closes INV-GAP-1)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified enumeration of all twelve V1 care-pathway (trilhas) definitions in
  the legacy repository, with verification of the cycle-0 structural counts
  (12 paths / 118 units / 38 band sets / 58 predicates / 2 rationale records),
  the alert_groups audit, and the citation audit. This closes inventory gap
  INV-GAP-1 (candidate-inventory.md section 1.2): the eleven previously unnamed
  pathways are named here with per-file provenance.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/ (twelve YAML files), _work/alerts/registry.json, _work/alerts/schema/pathway.schema.json, _work/alerts/sepse.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole files; per-file SHA-256 in docs/archive/legacy-provenance/legacy-pin-cycle-1.md
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: read in full; counted computationally; summarized with verbatim citations
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: [HAZ-0005, HAZ-0043, HAZ-0044]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy pathway definitions — index (cycle 1, Task 1)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Nothing in this directory imports, approves, or activates any legacy content.
> Verdicts are proposals under `docs/00-governance/legacy-import-policy.md` and are
> not binding until a named human authority decides them.

## 0. Provenance and method

OBSERVED (2026-08-15): the legacy repository `/Users/familia/intensicare` was at git HEAD
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79` when every file cited below was read. Every
cited file's SHA-256 was verified against
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md` (the cycle-1 pin manifest). Files
not covered by the manifest (`scripts/`, `tests/`, `docs/plan/_work/alerts/`) were hashed
by this reviewer at read time; those hashes are stated inline and marked
"hashed by reviewer — absent from pin manifest".

All twelve pathway YAMLs were read in full. Counts were computed by script over the
parsed YAML (not estimated). The engine mechanics review is in `engine-review.md`; the
per-rule disposition table for `docs/rules/care-pathway/` (211 files) is in
`rules-cluster-disposition.md`.

## 1. The twelve pathways — INV-GAP-1 is closed

OBSERVED. `candidate-inventory.md` §1.2 INV-GAP-1 recorded that eleven of the twelve
pathways were never named in the legacy technical assessment. The twelve definitions
exist as YAML files at `_work/alerts/pathways/` and are:

| # | YAML `pathway.id` | Slug | Name (verbatim) | Version | One-line intent (from `pathway.description`, summarized) | Review record |
|---|---|---|---|---|---|---|
| 1 | 1 | `ventilacao` | Ventilação Mecânica | 3.0.0 | Mechanical-ventilation monitoring — P/F ratio and PEEP only; **a stub** (no description, 2 criteria, 2 states) | `ventilacao-review.md` |
| 2 | 2 | `sepse` | Sepse | 4.0.0 | Sepsis / septic shock per SSC-2021: screening, hour-1 and 3h bundle timers, PCT-guided response | `sepse-review.md` |
| 3 | 3 | `desmame` | Desmame | 3.0.0 | Ventilator weaning: readiness (RSBI, NIF, Glasgow), SBT, extubation, post-extubation | `desmame-review.md` |
| 4 | 4 | `nutricao` | Nutrição Enteral | 3.0.0 | Enteral nutrition: NRS-2002 screening, caloric/protein targets, tolerance monitoring | `nutricao-review.md` |
| 5 | 5 | `estabilidade` | Estabilidade Hemodinâmica | 3.0.0 | Hemodynamic stability: MAP, HR, lactate, vasopressor dose | `estabilidade-review.md` |
| 6 | 6 | `sedacao` | Sedação | 3.0.2 | Sedation management per PADIS: RASS target, BPS pain, sedative infusion dose | `sedacao-review.md` |
| 7 | 7 | `profilaxia` | Profilaxia | 3.0.0 | ICU prophylaxis bundle: VTE, stress-ulcer, early mobilization, head-of-bed elevation | `profilaxia-review.md` |
| 8 | 8 | `antimicrobiano` | Antimicrobiano | 3.0.0 | Antimicrobial stewardship: therapy duration, PCT-guided de-escalation, culture follow-up | `antimicrobiano-review.md` |
| 9 | 9 | `equilibrio` | Equilíbrio Hidroeletrolítico | 3.0.1 | Electrolyte disorders: Na, K, Mg, ionized Ca bands | `equilibrio-review.md` |
| 10 | 10 | `renal` | Função Renal / AKI | 3.0.1 | Renal function / AKI: creatinine, urine output, KDIGO stage | `renal-review.md` |
| 11 | 11 | `delirium` | Delirium | 3.0.2 | Delirium per PADIS 2018: CAM-ICU screening, RASS agitation, haloperidol dose | `delirium-review.md` |
| 12 | 12 | `respiratorio` | Insuficiência Respiratória | 3.0.1 | Acute respiratory failure: SpO2, RR, FiO2, PaCO2 | `respiratorio-review.md` |

Per-file SHA-256 (verbatim from the pin manifest, verified 2026-08-15):

```text
0ef987c51ad18ab9dea0123da1fec8c2c07b96833abe6a5ce9ee6db8e4e3758f  _work/alerts/pathways/antimicrobiano.yaml
571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208  _work/alerts/pathways/delirium.yaml
808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a  _work/alerts/pathways/desmame.yaml
5d3af65ac19c81d4574a8c5848f4599949aad666ef0be808cdeb672607e60194  _work/alerts/pathways/equilibrio.yaml
bf61744c263f40f630931293fcf4fc95b90e573609390abee42d37c7b3c5bcc9  _work/alerts/pathways/estabilidade.yaml
b2dc4ae2f7fff4bcad5e1923647053fdcfd1565c7b5a0f9cf850628bd561dd95  _work/alerts/pathways/nutricao.yaml
0e33e945a67e0671c7f6cc957215c1f221d7b1f13e5ef01f8d024ad0584598bc  _work/alerts/pathways/profilaxia.yaml
a052e6c26835e3c7c8ade5e62ed7272b779edf95cfd47c6a3105fc3d90db4153  _work/alerts/pathways/renal.yaml
9792ca62fc663d77315ae5e0ea41d9bbcb2b6bfa36c55eaeb42bb05533ad5d1e  _work/alerts/pathways/respiratorio.yaml
21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657  _work/alerts/pathways/sedacao.yaml
b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0  _work/alerts/pathways/sepse.yaml
d1c48956f19eb55633f034cd800b05ed35004664864942f75533e1635a6fd8d3  _work/alerts/pathways/ventilacao.yaml
```

## 2. Count verification — "12 paths, 118 units, 38 band sets, 58 predicates"

OBSERVED (computed by script over the parsed YAML, 2026-08-15). The cycle-0 counts
(candidate-inventory.md §1.1c, sourced from the legacy assessment) verify as follows:

| Claimed | Computed | Verdict | What the number actually counts |
|---|---|---|---|
| 12 paths | **12** | **TRUE** | Twelve YAML files, twelve distinct `pathway.id` 1..12, no duplicates |
| 118 units | **118** (Gate-A definition) / 123 (all `unit:` keys) | **TRUE under the gate's definition** | `scripts/validate_alerts.py` Gate A `_collect_units` (lines 129-161) counts input units + top-level predicate units + **first-level** sub-predicate units only. Five `unit:` strings inside depth-2 nested sub-predicates of `sepse.yaml` composites are invisible to the gate. 60 input units + 58 predicate-tree units (of which 5 uncounted by the gate) = 123 total; the gate sees 118. |
| 38 band sets | **38** | **TRUE** | Graded predicates (each carries one `bands` array). Per pathway: antimicrobiano 2, delirium 2, desmame 3, equilibrio 4, estabilidade 4, nutricao 6, profilaxia 1, renal 3, respiratorio 4, sedacao 3, sepse 5, ventilacao 1. (136 individual band rows in total.) |
| 58 predicates | **58** | **TRUE** | Top-level criterion predicates (= criteria count). Per pathway: 4/3/6/4/4/6/4/3/4/3/**15**/2. Counting nested sub-predicates too, the tree contains 81 predicate nodes. |
| 2 rationale records | **2** | **TRUE** | Only `ventilacao.yaml` criteria carry a `predicate.rationale` (lines 40, 51). The other 56 predicates across 11 pathways have **no rationale record**. |

Discrepancy notes:

- **"118 units" is a gate artifact, not a file property.** The true count of `unit:`
  declarations is 123; Gate A recurses only one level into `sub_predicates`
  (`scripts/validate_alerts.py:152-159`, SHA-256
  `22daccfb33d4be7f6708ae0b3e44f2d1fa635cf9e3d442e0e45ff55b98ae4c41`, hashed by
  reviewer — absent from pin manifest). The five unchecked unit strings sit inside
  `sepse.yaml` nested composites (e.g. `crit-sep-screen`, `crit-sep-shock`,
  `crit-sep-pct-deesc`).
- **`sepse.yaml` has 15 criteria and 17 inputs**, materially larger than every other
  pathway (next largest: 6 criteria). The "58 predicates" figure is dominated by it.
- OBSERVED: `registry.json` (`_work/alerts/registry.json`, SHA-256
  `bb2db7f853a6ee8f9f420aa88dd078acb20cd0e4a09e7cb98ab7ed644c7fba77`) does **not**
  register the twelve pathway definitions. It registers **six sepsis alerts** whose
  `source_file` is the *root* `_work/alerts/sepse.yaml` — see §5.

## 3. alert_groups audit

OBSERVED — the candidate-inventory §1.1h claim ("nine domain YAMLs lack `alert_groups`;
the vector gate then reported All 0 pass — false-green") verifies, with one important
clarification about **which** files are involved:

1. **None of the twelve pathway YAMLs has `alert_groups`, and none can.** The pathway
   schema (`_work/alerts/schema/pathway.schema.json:6-8`, SHA-256
   `68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203`) sets
   `"additionalProperties": false` with top-level keys `pathway|evaluation|criteria|states|suppression|evidence`
   only. `alert_groups` is not part of the pathway vocabulary at all.
2. **The nine `alert_groups`-less files are a different set**: the domain alert
   catalogs at `docs/plan/_work/alerts/` — `aki.yaml`, `correlation-engine.yaml`,
   `early-warning-scores.yaml`, `electrolyte.yaml`, `hemodynamics.yaml`,
   `neuro-sedation.yaml`, `pharmaco-interaction.yaml`, `respiratory.yaml`,
   `sepsis.yaml` (all hashed by reviewer — absent from pin manifest; hashes in
   `engine-review.md` §7). All nine use a top-level `alerts:` key; zero contain
   `alert_groups`.
3. **False-green reproduced live** (2026-08-15): running
   `python3 scripts/check_vector_coverage.py` at the pinned HEAD prints
   `WARNING: <file> missing 'alert_groups' key` for all nine files, then
   `Coverage: 0/0 (0.0%)` and exits **0** with
   `PASSED: All 0 alerts have test vectors and conditions.` The gate validates
   nothing while reporting success. Mechanics in `engine-review.md` §7.
4. Consequence for the twelve pathways: **the vector-coverage gate does not cover the
   pathway YAMLs at all** (it scans `docs/plan/_work/alerts/`, not
   `_work/alerts/pathways/`). The only test-vector coverage any pathway has is the
   sepse v4 parity suite (`tests/test_sepse_yaml_parity.py`, 31 vectors, sepse only).

Per-pathway alert_groups column (uniform): **absent** in all twelve — recorded in each
review record.

## 4. Citation audit (guideline anchoring)

OBSERVED. All twelve YAMLs carry an `evidence.guideline` string and an `evidence.doi`.
Every DOI was resolved against the Crossref registry (`api.crossref.org`, 2026-08-15):

| Pathway | Cited guideline (abbrev.) | DOI | Crossref resolution | Verdict |
|---|---|---|---|---|
| antimicrobiano | IDSA/SHEA ASP 2016; SSC-2021 | 10.1093/cid/ciw118 | Barlam TF et al., "Implementing an Antibiotic Stewardship Program", Clin Infect Dis 2016 | **MATCH** |
| delirium | PADIS 2018 | 10.1097/CCM.0000000000003299 | Devlin JW et al., PADIS guideline, Crit Care Med 2018 | **MATCH** |
| desmame | ACCP/SCCM/AARC/ATS weaning 2001; "BURN Trial (2016)" | 10.1378/chest.120.6_suppl.375S | MacIntyre NR et al., weaning guidelines, Chest 2001 | **MATCH** for DOI; "BURN Trial (2016)" **UNIDENTIFIABLE** as a primary source |
| equilibrio | "ESICM Guidelines on Electrolyte Disorders"; **UpToDate** | 10.1007/s00134-012-2768-4 | **HTTP 404 — DOI not registered at Crossref** | **BROKEN DOI**; named guideline unidentifiable; UpToDate is a tertiary source, not a primary authority |
| estabilidade | SSC 2021; ESICM shock consensus 2014 | 10.1007/s00134-014-3525-z | Cecconi M et al., ESICM circulatory-shock consensus, Intensive Care Med 2014 | **MATCH** |
| nutricao | ESPEN ICU 2019; ASPEN/SCCM 2016 | 10.1016/j.clnu.2018.08.037 | Singer P et al., ESPEN ICU guideline, Clin Nutr 2019 | **MATCH** (ASPEN/SCCM 2016 named without DOI) |
| profilaxia | "SCCM/ACCM Guidelines; IHI Ventilator Bundle; SSC; WHO Patient Safety" | 10.1097/CCM.0b013e3182783b72 | Barr J et al., **Pain/Agitation/Delirium guideline 2013** | **MISMATCH** — DOI resolves to a different guideline (PAD 2013, not prophylaxis); named sources are vague, none is a specific citable edition |
| renal | KDIGO AKI 2012; ADQI 2020 | 10.1038/kisup.2012.1 | "Notice", Kidney Int Suppl 2012 (front matter of the KDIGO AKI supplement) | **PARTIAL** — points into the correct supplement but at its front-matter page, not the guideline; ADQI 2020 named without DOI |
| respiratorio | ARDSNet 2000; ATS/ERS; BTS oxygen 2017 | 10.1136/thoraxjnl-2016-209729 | O'Driscoll BR et al., BTS oxygen guideline, Thorax 2017 | **MATCH** (ARDSNet and ATS/ERS named without DOI) |
| sedacao | PADIS 2018 | 10.1097/CCM.0000000000003299 | Devlin JW et al., PADIS 2018 | **MATCH** |
| sepse | SSC-2021 | 10.1007/s00134-021-06506-y | Evans L et al., SSC 2021, Intensive Care Med 2021 | **MATCH** (guideline-content analysis deferred to sepsis-scores workstream) |
| ventilacao | ARDSNet 2000; PROSEVA 2013 | 10.1056/NEJM200005043421801 | ARDSNet (Brower et al.), lower tidal volumes, N Engl J Med 2000 | **MATCH** (PROSEVA named without DOI) |

**Tally: 12/12 pathways carry a citation; 8 DOIs MATCH, 1 BROKEN (equilibrio),
1 MISMATCH (profilaxia), 1 PARTIAL (renal), plus 1 unidentifiable secondary citation
(desmame "BURN Trial"). Zero pathways are fully UNCITED.**

INFERENCE — and this is load-bearing: **a citation at the file level is not threshold
provenance.** No band boundary, cut-point, or score in any pathway carries its own
rationale or citation (only ventilacao's two mechanical `rationale` strings exist, and
they merely restate the predicate). Whether each implemented threshold agrees with the
cited authority is assessed per pathway in the review records; material disagreements
were found in `renal` (absolute-creatinine bands mislabeled as KDIGO stages) and
`delirium` (haloperidol framed as first-line, contrary to the cited PADIS 2018).

## 5. The root `_work/alerts/sepse.yaml` — not a duplicate, a second sepsis rule set

OBSERVED. `_work/alerts/sepse.yaml` (root, SHA-256
`1af8062d535ff0a9efa12a1606c7b37b975bd0635a8800f155491e958ced5dfa`) is a **different
artifact in a different format** from `_work/alerts/pathways/sepse.yaml`:

- The root file is a flat list of **six alert definitions** (`sepsis_sirs_alert`,
  `sepsis_qsofa_alert`, `sepsis_lactate_alert`, `sepsis_sofa_alert`,
  `sepsis_septic_shock`, `sepsis_clear_48h`) in the older F-ARCH-001 catalog format
  (`criteria: [{field, operator, value}]`), citing "Singer M et al. JAMA
  2016;315(8):801-10" (Sepsis-3) per alert.
- `registry.json` (ADR-021 content-addressed registry) registers exactly these six
  alerts with per-alert SHA-256 and `source_file: "_work/alerts/sepse.yaml"` —
  the root file, not the pathway file.
- The pathway file is the v4.0.0 SSC-2021 trilhas definition (15 criteria).

INFERENCE: V1 therefore carried **three coexisting sepsis rule sets** — the root
Sepsis-3 alert catalog (registered), the SSC-2021 pathway definition (loaded by the
engine), and the imperative `domain_sepsis.py` (which the pathway file describes itself
as porting). Which one was authoritative at any moment is not recorded anywhere read
this cycle. Full structural detail in `sepse-review.md`; guideline adjudication is the
sepsis-scores workstream's scope.

## 6. Cross-cutting findings (summarized; engine detail in engine-review.md)

1. **Missing input evaluates to silence, and silence renders as "normal"** —
   `trilhas_evaluator.py:388-397` skips a criterion whose input is absent
   (`KeyError` → `continue`, DEBUG log), and `build_alert` (`trilhas_evaluator.py:472-481`)
   yields `overall_severity="normal"` when nothing fired. A patient with **no data**
   produces the same output as a patient verified normal. This is the HAZ-0005
   failure shape, present in the *new* declarative engine, and it is **tested as
   intended behavior** (`tests/test_trilhas_evaluator.py:437-449`,
   `test_missing_input_produces_no_firing`).
2. **A missing input in one branch of an OR silences the whole criterion** —
   composite predicates do not short-circuit; a `KeyError` from any sub-predicate
   aborts the entire criterion (`trilhas_compiler.py:639-641` + evaluator catch).
   Documented, with workaround, in the legacy test suite itself
   (`tests/test_sepse_yaml_parity.py:118-131`).
3. **The severity vocabulary has no "not evaluated" member.** `normal | watch |
   urgent | critical` (CON-SEED-11, schema line 161) cannot express non-assessment
   anywhere in the pipeline.
4. **Boolean compliance criteria alert on the wrong side** in `profilaxia` (fires
   urgent when prophylaxis IS given; silent when missing) — see
   `profilaxia-review.md` §7.
5. **Unit-mismatch false-normals**: values below a band set's lowest bound match no
   band and return `normal` (`trilhas_compiler.py:584-593`); the auto-evaluation
   wiring feeds `renal.debito_urinario` (expected mL/kg/h) from a column named
   `urine_output_ml_day` (mL/day) — see `renal-review.md` §7.
6. **Declarative pathway alerts are never delivered**: `TrilhasEngine.evaluate` is
   invoked only as a logged "validation pass" (`src/intensicare/api/v1/pathways.py:796-817`);
   firings are written to the log and discarded.

## 7. Verdict summary (all PROPOSAL — AWAITING NAMED CLINICAL REVIEW, reviewer: rodaquino-OMNI)

| Artifact | Proposed verdict | One-line rationale |
|---|---|---|
| ventilacao | **REJECT** (as a pathway; concepts to desmame/respiratorio successor work) | A stub (2 criteria, no description) presented as a mechanical-ventilation pathway; Berlin P/F cut-points themselves are sound |
| sepse | **TRANSFORM** (structure); guideline adjudication deferred to sepsis-scores workstream | Richest definition, but bundle timers/composites inherit the composite missing-input silence and triple-rule-set ambiguity |
| desmame | **VALIDATE** | Thresholds broadly consistent with cited weaning literature; unowned, unratified, boolean semantics ambiguous |
| nutricao | **VALIDATE** | Mostly ESPEN/ASPEN-consistent; gastric-residual banding partially conflicts with cited ASPEN 2016 |
| estabilidade | **VALIDATE** | MAP/lactate bands consistent with SSC/ESICM; unowned, unratified |
| sedacao | **VALIDATE** | RASS/BPS bands consistent with PADIS; cross-pathway RASS inconsistency with delirium |
| profilaxia | **TRANSFORM** | Valuable bundle-audit intent; alerting direction inverted as implemented (silent on missing prophylaxis) |
| antimicrobiano | **VALIDATE** | PCT/duration logic consistent with cited stewardship literature; needs named clinical owner |
| equilibrio | **VALIDATE** | Conventional electrolyte bands; broken DOI, tertiary citation |
| renal | **TRANSFORM** | Absolute-creatinine bands mislabeled as KDIGO stages; UO input unit hazard; must be rebuilt baseline-relative |
| delirium | **VALIDATE** | CAM-ICU/RASS structure sound; haloperidol "first line" framing contradicts its own cited PADIS 2018 |
| respiratorio | **VALIDATE** | SpO2/RR/PaCO2 bands consistent with BTS targets; FiO2 fraction-vs-percent false-normal vector |
| trilhas engine (all runtimes) | **SUPERSEDE** | No evaluation-status algebra; missing→normal; dual/triple runtime; severity-semantics collision; non-operative alert wiring. Preserved intelligence: declarative AST compiler, band-continuity validation, content-addressing, no-eval discipline |

No verdict here is DECIDED. Import of any item additionally requires all eight
`legacy-import-policy.md` §3 preconditions, none of which is currently satisfied.
