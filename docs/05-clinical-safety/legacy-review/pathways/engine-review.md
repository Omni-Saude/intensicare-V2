---
id: LEGREV-TRILHAS-ENGINE
title: Legacy trilhas/pathway engine — clinical-safety mechanics review
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 trilhas engine mechanics with a clinical-safety
  lens: load/compile, enrollment, evaluation cadence, state machine, missing/invalid/
  stale-input behavior, suppression, alert delivery, and the false-green
  vector-coverage gate. Decisive finding: an absent input silently skips its
  criterion and the aggregate renders "normal" — the HAZ-0005 failure shape is
  present in the NEW declarative engine and is tested as intended behavior. Proposed
  verdict SUPERSEDE.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/ (trilhas_* and pathway_* modules), scripts/, tests/
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: per-citation below; SHA-256 per file listed in section 0
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: read in full; behavior traced line-by-line; false-green gate reproduced live; verdict proposed
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0016, HAZ-0021, HAZ-0022, HAZ-0040, HAZ-0043]
supersedes: null
superseded_by: null
---

# Trilhas / pathway engine — clinical-safety mechanics review

## 0. Files reviewed and hashes

All from the pin manifest (`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`)
unless marked "hashed by reviewer" (absent from manifest; hashed at read time,
2026-08-15):

```text
a2ef8717276699bd013ede8eac5d1dc618607e72b76e664c09525ca6c54f4734  src/intensicare/services/trilhas_compiler.py
6c45cb65514c7d6b0c99cb150936f76f337e91a7ecab59d27ad71adc819aaab2  src/intensicare/services/trilhas_engine.py
33db93cf4e3f7b6483ead7fb8a643261700277a5bd7ae1c2f9746f1fa1a9a154  src/intensicare/services/trilhas_evaluator.py
3425e844fbec012a67a60779ca30fd5af0b8d1c517051684ae5f5a1ebe2baabe  src/intensicare/services/trilhas_definitions.py
1edd099ae2bf3ecdccdf4959c0feb73355095e2b1137f65f4e19bd56cd00290b  src/intensicare/services/trilhas_state.py
6dca0013e99a6db21bf92303062bf033c40314a0c79c999896eea3aa04cadd56  src/intensicare/services/domain_trilhas_engine.py
c23a7b427f224c910cd8f234ed7fe6bf0e2e854b521550b04122301e3c71028d  src/intensicare/services/pathway_auto_evaluation.py
220b8bff114d043aeb5cd7bca7a7db3d7c514430dff0ef3271de70078ccd72d3  src/intensicare/services/pathway_definitions_sync.py
ce54b79adc34936467466db488589051a0809428e6a3a5f08fcdd3bbc59f7d0c  src/intensicare/services/pathway_enrollment.py
ebca92edf5bb5d1c3d0cc7bb1ce71aeae696e9d11c478c3ec74e098efd7ebe1f  src/intensicare/services/pathway_repository.py
650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb  src/intensicare/services/sepsis_input_provider.py
dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64  src/intensicare/services/vitals.py
69e29b7fa1c828548b79bf419feb1a121f8c1d7c95fedc607f63b08af4bec013  src/intensicare/api/v1/pathways.py
68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203  _work/alerts/schema/pathway.schema.json
```

Hashed by reviewer (absent from pin manifest):

```text
b8a38ebe4cb21894dafb913c0c28df223eda21555e0dbcdc54b2ef8e1fc37eb7  scripts/check_vector_coverage.py
22daccfb33d4be7f6708ae0b3e44f2d1fa635cf9e3d442e0e45ff55b98ae4c41  scripts/validate_alerts.py
dbb8409f9300653e8d6bda746a1940e694e910de2e590302d82045777a5cc574  tests/test_trilhas_evaluator.py
8d7e5557db0cd8e92077f87fc3be2e76b7e129b8b9e006432170023415e77017  tests/test_sepse_yaml_parity.py
90db49b70cee4822790af8027f58088d523c3c1665a54455dc6e822d6544469a  tests/test_trilhas_compiler.py
409f363d356311514b605df0876ffb0a1e9ec1f2d15017e7b42342778453e42c  docs/plan/_work/alerts/aki.yaml
51336b4cdce32905270b7dcb241824083c4003142527a8d7b71e6e576dbab06b  docs/plan/_work/alerts/correlation-engine.yaml
712d9ccde209d099f80c4d5abb11e77e33564e03f347f931a363537c1031e9b8  docs/plan/_work/alerts/early-warning-scores.yaml
0de2f4e7218d1acdd2c2c83ff8a25435bda5f996e577f073f3b9988f9e4085f3  docs/plan/_work/alerts/electrolyte.yaml
ed09ce34e5e7dde099cff41d8821d642021083a431f5c302ca3a2de173496190  docs/plan/_work/alerts/hemodynamics.yaml
b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627  docs/plan/_work/alerts/neuro-sedation.yaml
ee403fbe4d63d694993ac4858f83f8bc3cc920cbe413f3323b3e6c8fae6fc992  docs/plan/_work/alerts/pharmaco-interaction.yaml
7186652bccffce6a99f1e8d5722913683c7009c875adaa15b1207715ea7634af  docs/plan/_work/alerts/respiratory.yaml
6d79efcb164b7989f9c3992a9f2647b9ea213cb329bef837681ad85bbaf0e5de  docs/plan/_work/alerts/sepsis.yaml
```

## 1. Architecture: three coexisting runtimes

OBSERVED — at the pinned commit, three pathway runtimes coexist:

1. **TrilhasEngine** (`trilhas_engine.py`) — "stateless declarative rule engine…
   Replaces the imperative PathwayStore" (lines 1-6). Loads
   `_work/alerts/pathways/*.yaml`, pre-compiles predicates, evaluates via
   TrilhasEvaluator, emits `AlertFiring` records stamped with
   `definition_version` + `content_hash` (ADR-0020/021).
2. **PathwayStore** (`trilhas_state.py`) — deprecated in-memory state machine
   ("Migration deadline: 2026-09-01", line 16) still wired as the default store via
   `domain_trilhas_engine._default_store` (line 111) — and still what
   `TrilhasEngine.get_patient_pathways` itself delegates to
   (`trilhas_engine.py:213-234`): the *new* engine answers "what pathways is this
   patient on" from the *deprecated in-memory* store.
3. **pathway_enrollment.py + pathway_repository.py** — the Postgres-backed port of
   the state-machine rules (the actual production enrollment/evaluation path), which
   re-reads the YAML engine privately for severity classification
   (`pathway_enrollment.py:641-681`).

INFERENCE: three runtimes over one content set, with different missing-data
semantics each (see §4), reproduce the dual-runtime hazard the legacy assessment
already flagged (candidate-inventory CAND-0006 row, `LEGACY-TA:719-727`).

## 2. Load and compile-time validation

OBSERVED (`trilhas_engine.py:105-144, 273-382`):

- YAML loaded with `yaml.safe_load`; **the JSON schema
  (`pathway.schema.json`) is not applied at load time** — schema conformance is a
  CI-time concern only. Unparseable/dict-less/id-less files are skipped with a
  WARNING (`_load_file:279-297`) — a deleted or malformed pathway vanishes silently
  from the portfolio at runtime.
- Per-criterion predicate compilation at load; **fail-fast hybrid policy**: any
  predicate compile failure deactivates the whole pathway (never partial evaluation
  of a clinical pathway — lines 317-353, recorded in public `load_failures`), and
  zero active pathways raises `RuntimeError` at boot (lines 133-144). This is real,
  well-considered safety engineering.
- **But both production consumers neutralize the fail-fast**: the API's
  `_get_engine` catches any init exception and falls back to the legacy 4-pathway
  seed catalog (`api/v1/pathways.py:100-114`, "using legacy catalog"), and
  `pathway_enrollment._get_trilhas_engine` catches and degrades severity to
  `"normal"` (`pathway_enrollment.py:655-681`, docstring: "a definitions-load hiccup
  must degrade _determine_severity to its 'normal' fallback"). A boot that should
  fail loudly instead serves stale content or normal-severity answers.
- Compiler validation (`trilhas_compiler.py`) is genuinely strong: no eval/exec
  (AST + operator map, lines 1-46); band continuity enforced — no gaps/overlaps,
  last band must reach +inf (lines 372-389); NOT-combinator arity enforced;
  temporal fields validated. CI gates A/B/C (`scripts/validate_alerts.py`) re-run
  band partition through the real compiler and check unit strings and the two
  rationale facades. Preserved intelligence worth carrying forward as ideas.
- Band sets cover `[lowest lower bound, +inf)` only — a value below the lowest
  bound matches no band and evaluates `met=False, severity normal`
  (`trilhas_compiler.py:577-593`). See §4 for the clinical consequence.
- Content addressing: `compute_content_hash` (canonical JSON SHA-256,
  `trilhas_compiler.py:54-74`). OBSERVED via recomputation: all twelve YAMLs'
  declared `pathway.content_hash` values match the hash computed over the file
  excluding the `content_hash` field — the hashes are real, not placeholders (the
  `pathway_definitions_sync.py:16-23` docstring claiming "every YAML definition
  ships with a fake placeholder content_hash" is **stale** at the pinned commit).
  The boot-time sync recomputes and persists the real hash and logs mismatches
  without blocking (`pathway_definitions_sync.py:95-121`).

## 3. Enrollment triggers and evaluation cadence

OBSERVED:

- **Enrollment is exclusively manual** (API POST → `pathway_enrollment.enroll_patient`;
  starts at `initial`, severity `normal`; duplicate-active guarded by partial unique
  index with race fallback, lines 190-224). There is no automatic enrollment
  trigger anywhere. Eligibility checking (`check_pathway_eligibility`,
  `domain_trilhas_engine.py:184-362`) is advisory, exists for only 4 of 12 slugs
  (Rules 15-18), and **defaults to eligible**: with no patient data — "Elegibilidade
  presumida"; with non-matching data — "Sem contraindicações automáticas
  identificadas. Elegível mediante avaliação clínica."
- **Evaluation cadence**: the YAML `evaluation.mode`
  (micro-batch/near-real-time/hybrid) is parsed (`trilhas_engine.py:315`) and
  consumed by **nothing** — no scheduler exists. Actual triggers are exactly two:
  (a) best-effort after every vitals ingestion
  (`services/vitals.py:415-423` → `pathway_auto_evaluation.evaluate_enrolled_pathways`,
  exceptions swallowed: "NUNCA derruba a ingestão"), and (b) manual criteria PUT.
  Consequence: pathways whose inputs are not vitals (7 of 12 have zero auto-sourced
  inputs — see per-pathway reviews) are evaluated only if a human PUTs values; the
  sepse bundle timers only advance when an evaluation happens to be triggered — an
  overdue hour-1 antibiotic alert will not fire on a patient with no new vitals.
- Input sourcing: generic builder provides 9 keys (pam, fc, fr, temp, spo2,
  vasopressor_dose, creatinina, debito_urinario, rass_score) from the LATEST
  persisted rows **with no freshness window**
  (`pathway_auto_evaluation.py:113-158`); sepse has a dedicated provider
  (`sepsis_input_provider.build_sepsis_inputs`) which the module docstring records
  as having had **"ZERO callers in the live codebase"** before the Dim A re-audit
  wired it (`pathway_auto_evaluation.py:1-10`).

## 4. Missing, invalid, and stale input behavior — the decisive lines

OBSERVED, the HAZ-0005 lens:

1. **Absent input → silent skip → normal.**
   `trilhas_compiler._lookup` raises `KeyError` for a missing key (lines 717-729);
   `TrilhasEvaluator.evaluate_pathway` catches it and `continue`s past the criterion
   at DEBUG level (`trilhas_evaluator.py:388-397`); `build_alert` computes
   `overall_severity = "normal"` over zero active firings
   (`trilhas_evaluator.py:472-481`). **A patient with no data and a patient verified
   normal produce identical output.** There is no `not_evaluated` state anywhere —
   the severity vocabulary is closed at `normal|watch|urgent|critical`
   (`trilhas_evaluator.py:293-298`; schema CON-SEED-11). Tested as INTENDED:
   `tests/test_trilhas_evaluator.py:437-449` asserts missing input → no firing.
2. **Composite amplification.** Composites evaluate all sub-predicates without
   short-circuit (`trilhas_compiler.py:629-641`); a `KeyError` from ANY sub-input
   propagates and kills the WHOLE criterion — including an OR whose other branch is
   satisfied. The V1 parity suite documents this and pads inputs with neutral
   defaults ("PAM=999…") to avoid it (`tests/test_sepse_yaml_parity.py:118-131`).
   Clinical vector: septic shock silenced by one absent boolean
   (`sepse-review.md` §4).
3. **Invalid input → normal.** Non-numeric values in threshold/graded/temporal
   evaluation return `met=False, severity normal`
   (`trilhas_compiler.py:532-543, 565-575, 681-696`) — a detected type failure is
   coerced to the most reassuring state (prohibition P-1/P-2 shape,
   `evaluation-status-semantics.md` §4).
4. **Below-lowest-band → normal.** `matched_band is None` guard returns normal
   (`trilhas_compiler.py:584-593`). Live vectors: FiO2 charted as fraction
   (`respiratorio-review.md` §7); urine output fed in mL/day against a mL/kg/h band
   set (`renal-review.md` §7). **Units are never checked at evaluation time** —
   Gate A validates unit *strings* against a registry at CI time only.
5. **Stale input → treated as current.** No freshness/staleness concept exists in
   compiler, evaluator, engine, or auto-evaluation ("latest row" queries, unlimited
   age). The domain alert catalogs (docs/plan set) declare `staleness_max` fields —
   the pathway pipeline implements nothing of the kind.
6. **Enrollment-layer semantics differ per runtime.** (a) Deprecated in-memory Rule
   10: severity = met/total ratio — fewer met ⇒ MORE severe, so never-evaluated
   criteria inflate severity (`trilhas_state.py:633-658`); (b) the Postgres port
   explicitly calls that "a P0 clinical-safety bug (gatekeeper G-S2)" and replaces
   it with band-classification of evaluated criteria where **pending criteria are
   excluded and all-pending ⇒ "normal"** (`pathway_enrollment.py:63-71, 684-782`)
   — the fix removes false-critical and installs false-normal; (c) the declarative
   evaluator renders missing as normal per item 1. Three runtimes, three different
   wrong answers to "what does absence mean," none expressible as `not_evaluated`.
7. **Evaluation error → skip/normal.** Predicate compile failure at evaluation time
   → criterion skipped (`trilhas_evaluator.py:376-385`); auto-evaluation wraps each
   enrollment in try/except recording `outcome.error` but continuing
   (`pathway_auto_evaluation.py:331-341`); the vitals hook swallows everything
   (`services/vitals.py:415-423`). No evaluation error is ever surfaced to a
   clinical consumer.

## 5. State machine

OBSERVED (`pathway_enrollment.py:250-410`; port of `trilhas_state.py` Rules 3-14):

- States are ordered, forward-only; advancement rule: **if ALL criteria in the
  pathway are met, advance exactly one state** per evaluation (lines 340-355).
  Criteria are pathway-global — not scoped per state; the schema's `auto_advance`
  affordance (per-state conditions, timers) is used by **zero** YAMLs and ignored by
  the state machine. Terminal state ⇒ `status=completed`.
- **"Met" carries opposite meanings in the two live layers.** In the declarative
  evaluator, met = condition detected (alert-worthy). In the enrollment state
  machine, met = goal achieved (progress toward `alta`). The auto-evaluation bridge
  inverts graded results only ("met = severity == normal",
  `pathway_auto_evaluation.py:166-190`) and passes boolean/composite/temporal
  through unchanged — so for sepse v4, "septic shock present" counts as a *met*
  criterion pushing the enrollment toward resolution, and via
  `_determine_severity`'s boolean classification a true compliance boolean reads
  severity `urgent` (`profilaxia-review.md` §7). The semantics collision is
  documented in the bridge's own docstring.
- Trend: any transition history ⇒ "improving" (`pathway_enrollment.py:785-816`) —
  a one-transition enrollment is labeled improving forever ("worsening" is
  unreachable: transitions are forward-only).
- Recommendations: hard-coded PT-BR directive texts selected by pathway name +
  severity (`pathway_enrollment.py:819-1019`), including operational instructions
  ("Considerar… posição prona se P/F < 150", "iniciar cristaloide 30 mL/kg", "PSV
  5-7 cmH₂O ou tubo T por 30-120 min"). INFERENCE: system-generated directive
  clinical instructions keyed off a severity whose computation treats absence as
  normal — advisory-vs-directive boundary risk (HAZ-0044 adjacent; VAL-0011).
- State changes publish a best-effort `pathway.updated` WebSocket event; publish
  failure is swallowed (`pathway_enrollment.py:587-628`).

## 6. Suppression and alert delivery

OBSERVED:

- Suppression (`trilhas_evaluator.py:84-286`): per (mpi, pathway, criterion)
  cooldown + per-hour rate limit, Redis-backed with **silent per-process in-memory
  fallback** when Redis is unavailable (lines 108-120) — suppression state then
  diverges across workers (duplicate alerts, or uneven suppression; HAZ-0022 shape).
  Suppressed firings are carried in the record but **excluded from
  `overall_severity` and score** (lines 469-481): during a cooldown window a
  persisting critical condition can aggregate to `normal`.
- **Alert delivery: the declarative engine's output goes nowhere.** The only
  production call sites of `TrilhasEngine.evaluate` are two "validation pass
  (non-blocking)" blocks that **log** the firings and discard them
  (`api/v1/pathways.py:713, 796-817`: `logger.info("TrilhasEngine produced %d
  alert(s)…")`). No persistence, no notification, no routing. INFERENCE: the twelve
  pathway definitions, their band sets and suppression configs constitute an
  alerting capability that is displayed (catalog, enrollment, progress endpoints)
  but **cannot reach a clinician** — the structural form of HAZ-0043's "capability
  incapable of evaluating anything," here "capability incapable of delivering
  anything."

## 7. The false-green vector-coverage gate (candidate-inventory 1.1h) — located and explained

OBSERVED — `scripts/check_vector_coverage.py` (SHA-256 §0):

- The gate scans `docs/plan/_work/alerts/*.yaml` (line 24) — the nine **domain
  alert catalogs**, NOT the twelve pathway YAMLs.
- `load_all_catalogs` (lines 39-49): a file without a top-level `alert_groups` key
  gets a stderr WARNING and is **skipped from the catalog list** — it does not fail
  the gate.
- OBSERVED at the pinned HEAD: all nine domain YAMLs use a top-level `alerts:` key
  and none contains `alert_groups` (grep count 0 in each; hashes §0). So every file
  is skipped, `total = 0`, `missing = []`, `no_condition = []`.
- `main` (lines 114-145) prints threshold WARNINGS ("Expected >= 50 alerts, found
  0", "Expected >= 266 vectors, found 0") that are **not failures**, then, because
  `missing` and `no_condition` are empty, prints
  `✅ PASSED: All 0 alerts have test vectors and conditions.` and returns **exit 0**.
- Reproduced live 2026-08-15: `python3 scripts/check_vector_coverage.py` at the
  pinned HEAD prints exactly that and exits 0.

INFERENCE: the gate's pass condition is vacuously satisfiable — a structural-key
mismatch between the gate and its data converts "nothing was validated" into a green
check. The legacy assessment's "False-green gate; validates nothing"
(candidate-inventory 1.1h) is confirmed from source and from execution. Design
lesson for V2: coverage gates MUST fail on zero-population (denominator floor as a
hard error, not a warning), and schema drift between validator and content must
itself be a failure.

## 8. What is worth preserving (intelligence, not code)

INFERENCE — preserved-intelligence candidates for the migration manifest (ideas
only; `legacy-import-policy.md` §1 default do-not-copy applies):

1. Declarative content model: pathway-as-data with typed predicates
   (threshold/graded/boolean/composite/temporal), schema, and per-definition
   evidence block.
2. No-eval AST compiler with build-time band-partition enforcement (gaps/overlaps
   impossible to load).
3. Content-addressed definitions (SHA-256 canonical-JSON) stamped onto every firing
   for traceability; boot-time DB mirror with hash-drift logging.
4. Deterministic temporal predicates (duration computed upstream; no clock in the
   predicate).
5. Fail-fast whole-pathway deactivation on compile failure + refuse-to-boot on
   zero active definitions (the policy — provided consumers do not neutralize it).
6. Oracle-parity testing discipline (sepse v4's 31 golden vectors with bounded,
   documented xfails).

## 9. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): SUPERSEDE**
(engine, all three runtimes, as a whole). Rationale: the engine has no algebra in
which "not evaluated" is representable — absence, invalidity, staleness, evaluation
error, and suppression all collapse into `normal` or into silence; the state machine
and evaluator assign opposite meanings to "met"; eligibility defaults to eligible;
declared cadence is unimplemented; and the alert output is not delivered. These are
architectural properties, not bugs to patch — V2's evaluation-status contract
(`evaluation-status-semantics.md`) is the replacement design. The §8 items should be
carried forward as documented ideas in the migration manifest. Not DECIDED; nothing
here authorizes import or reuse.
