---
id: LEGREV-PATH-SEPSE
title: Legacy pathway review — Sepse (pathways/sepse.yaml) — structure only
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Structure-scoped review of the V1 sepsis pathway definition (v4.0.0) per the task
  boundary: the sepsis-scores workstream owns guideline adjudication. Covers structure,
  counts, alert_groups, missing-data behavior, and the root-duplicate question. The
  root _work/alerts/sepse.yaml is a different artifact (six Sepsis-3 alerts, the ones
  registry.json registers) — V1 carried three coexisting sepsis rule sets.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/sepse.yaml; _work/alerts/sepse.yaml (root); _work/alerts/registry.json
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole files; SHA-256 b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0 (pathway), 1af8062d535ff0a9efa12a1606c7b37b975bd0635a8800f155491e958ced5dfa (root), bb2db7f853a6ee8f9f420aa88dd078acb20cd0e4a09e7cb98ab7ed644c7fba77 (registry) — all pin manifest
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: read in full; structure tabulated; guideline analysis deliberately withheld (owned by sepsis-scores workstream)
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0021, HAZ-0043]
supersedes: null
superseded_by: null
---

# Sepse (`sepse`) — legacy review (structure only)

> Scope note: per the cycle-1 task packet, **the sepsis-scores workstream owns this
> pathway's guideline analysis**. This record limits itself to structure, counts,
> alert_groups, missing-data behavior, and the root-duplicate question. The only
> guideline statement made is the mechanical DOI verification in §8.

## 1. Identity and structure

OBSERVED (`pathways/sepse.yaml:3-10`): id 2, slug `sepse`, version **4.0.0** (the only
v4 in the portfolio), active, mode near-real-time. **17 inputs, 15 criteria, 5 states**
— by far the largest definition (next largest has 6 criteria). Suppression: cooldown
15 min, rate limit 6/h, dedup `[mpi_id, criteria_id]`.

Criterion mix: 5 graded (band sets), 2 boolean, 8 composite (the composites contain
23 nested sub-predicates, including 2 temporal bundle timers — the only temporal
predicates in the portfolio).

SOURCE (`pathways/sepse.yaml:9`, verbatim, key sentence): "v4.0.0 porta para o modelo
declarativo a lógica rica anteriormente em domain_sepsis.py (SIRS, timers de bundle
SSC-2021, PCT stewardship — 31 vetores de validação), que passa a ser a
referência/oráculo de validação (ver tests/test_sepse_yaml_parity.py)."

## 2. Structure inventory

Criteria (id → type → intent, one line each, from `pathways/sepse.yaml:84-382`):

| id | type | intent (as documented) |
|---|---|---|
| crit-sep-qsofa | graded | qSOFA bands: [0,2) normal, [2,3) urgent, [3,+inf) critical |
| crit-sep-lactato | graded | lactate: [0,2) normal, [2,4) watch, [4,+inf) critical |
| crit-sep-pct | graded | PCT: [0,0.5) normal, [0.5,2) watch, [2,+inf) urgent |
| crit-sep-pam | graded | MAP: [0,65) critical, [65,+inf) normal |
| crit-sep-culturas | boolean | cultures collected (fires when done) |
| crit-sep-atb | boolean | antibiotic given within 1h (fires when done) |
| crit-sep-fluid | graded | crystalloid mL/kg: [0,20) critical, [20,30) urgent, [30,+inf) normal |
| crit-sep-screen | composite OR(AND,AND) | infection AND (qSOFA>=2 OR SIRS>=2) — ports ALERT-SEPSIS-SCREEN-01 |
| crit-sep-organ | composite AND | qSOFA>=2 AND lactate>2 — ports the absolute-lactate branch of ALERT-SEPSIS-ORGAN-02; the delta-lactate/hour trend branch is documented as NOT portable (xfail) |
| crit-sep-shock | composite OR(threshold,AND) | lactate>=4 OR (MAP<65 AND vasopressor active) — ports ALERT-SEPSIS-SHOCK-03 |
| crit-sep-bundle-atb-1h | composite AND(boolean negate, temporal) | antibiotic NOT given AND >60 min since protocol accept (strict overdue), severity critical |
| crit-sep-bundle-reaval-3h | composite AND(boolean negate, temporal) | cultures NOT collected AND >180 min since accept, severity critical |
| crit-sep-culturas-antes-atb | boolean | cultures-before-antibiotic sequencing confirmation (new in v4, no domain_sepsis counterpart) |
| crit-sep-pct-rising | composite AND | ATB >=48h AND delta-PCT-24h > 0.25 — therapy-failure signal |
| crit-sep-pct-deesc | composite AND(threshold, boolean, OR) | ATB >=48h AND stable 48h AND (PCT<0.25 OR PCT fall >80%) — de-escalation eligibility |

States: `initial` → `confirmacao` → `tratamento` → `estabilizacao` → `alta` (terminal).

Count contribution: 15 of the 58 top-level predicates; 5 of the 38 band sets; 17 of
the 60 declared inputs; 37 of the 123 `unit:` strings — of which 5 (inside depth-2
nested composites) are invisible to CI Gate A (`pathway-index.md` §2).

## 3. Enrollment and inputs

OBSERVED: no enrollment logic in the YAML. Manual enrollment via
`pathway_enrollment.enroll_patient`; the advisory `check_pathway_eligibility` Rule 16
(`domain_trilhas_engine.py:271-295`) returns eligible when any of
`{triagem,qsofa,crit-sep-qsofa}` or `{laboratorial,lactato,pct,crit-sep-lactato}`
keys are present, and `eligible=True` ("Elegibilidade presumida") with no data.

Unlike every other pathway, sepse has a dedicated input provider:
`sepsis_input_provider.build_sepsis_inputs` (SHA-256
`650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb`), wired via
`pathway_auto_evaluation.evaluate_enrolled_pathways` (`pathway_auto_evaluation.py:295-298`)
— itself only called best-effort after vitals ingestion (`services/vitals.py:416`).
The module docstring records that this provider **"had ZERO callers in the live
codebase"** until the Dim A re-audit wired it (`pathway_auto_evaluation.py:4-10`):
for some part of V1's life, sepsis pathway criteria were only ever evaluated by
manual PUT.

Two timing inputs (`minutes_since_accept_atb`, `minutes_since_accept_culturas`) make
the bundle timers deterministic — durations are computed upstream; the predicate never
reads a clock (`trilhas_compiler.py:152-173`). OBSERVED: correct engineering, but the
timers evaluate only when an evaluation is *triggered*; if no vitals arrive and no PUT
occurs, an overdue antibiotic alert is never raised — cadence risk documented in
`engine-review.md` §3.

## 4. Missing-data behavior (HAZ-0005 lens)

- General engine behavior applies (absent input → criterion silently skipped →
  `normal`; `trilhas_evaluator.py:388-397`, `472-481`).
- **Composite amplification (OBSERVED, decisive for this pathway):** composites do
  not short-circuit and a `KeyError` from ANY sub-predicate aborts the WHOLE
  criterion (`trilhas_compiler.py:639-641`; catch at `trilhas_evaluator.py:390`).
  Concrete vector: in `crit-sep-shock` (lactate>=4 **OR** (MAP<65 AND vasopressor)),
  a patient with lactate 6.0 but no `vasopressor_ativo` key produces **no septic-shock
  firing at all** — the satisfied OR branch is discarded with the criterion. The V1
  test suite documents this and works around it by injecting clinically neutral
  defaults ("PAM=999 'clearly not <65', vasopressor/peak-drop=0/False") so the parity
  vectors never exercise missing data (`tests/test_sepse_yaml_parity.py:118-131`,
  SHA-256 `8d7e5557db0cd8e92077f87fc3be2e76b7e129b8b9e006432170023415e77017`, hashed
  by reviewer — absent from pin manifest).
- Severity ceiling anomaly (OBSERVED): sub-predicate thresholds carry hard-coded
  severity `urgent` when met (`trilhas_compiler.py:545`), and a composite's severity
  is the max over sub-results (`trilhas_compiler.py:650-657`). `crit-sep-shock`
  (septic shock) can therefore never exceed severity **urgent**, while the simple
  graded `crit-sep-lactato` reports **critical** at lactate >=4. The bundle timers
  reach critical only via their explicit temporal `severity: critical` override.
- The 31-vector parity suite validates fire/no-fire logic against `domain_sepsis.py`
  as oracle; per its own docstring it has 1 strict xfail (delta-lactate trend not
  representable declaratively) out of a self-imposed maximum of 3.

## 5. The root `_work/alerts/sepse.yaml` question — resolved

OBSERVED: the root file is **not a duplicate** of the pathway file; it is a different
artifact in the older F-ARCH-001 flat alert-catalog format:

- Root file: 6 alerts (`sepsis_sirs_alert`, `sepsis_qsofa_alert`,
  `sepsis_lactate_alert`, `sepsis_sofa_alert`, `sepsis_septic_shock`,
  `sepsis_clear_48h`), each with `criteria: [{field, operator, value}]`,
  per-alert severity/rate-limit/cooldown, and per-alert
  `guideline_source: "Singer M et al. JAMA 2016;315(8):801-10"` (Sepsis-3).
- `registry.json` (ADR-021 content-addressed registry, `total_alerts: 6`) registers
  exactly these six with per-alert SHA-256 and
  `source_file: "_work/alerts/sepse.yaml"` — the root file. The twelve pathway
  definitions are NOT in the registry.
- The root file's content model (SIRS/qSOFA/SOFA-delta/lactate/shock/48h-clearance)
  is Sepsis-3-shaped; the pathway file is SSC-2021-shaped; and `domain_sepsis.py`
  (the declared validation oracle) is a third, imperative implementation.

INFERENCE: **three sepsis rule sets coexisted at the pinned commit** with no recorded
statement of which was authoritative for a live patient. The root file also carries
mode 0600 permissions (unlike its 0644 siblings) — noted as an anomaly, cause unknown.
Adjudication of the clinical content belongs to the sepsis-scores workstream; this
record hands over the structural facts.

## 6. alert_groups

Absent from both sepsis YAMLs (the pathway schema forbids the key; the root file
predates it). The vector-coverage gate covers neither (`pathway-index.md` §3). The
sepse pathway is, however, the ONLY pathway with any test-vector coverage at all
(31 parity vectors).

## 7. Timing / cadence

Declared `near-real-time`; dead metadata like all others (`engine-review.md` §3).
Effective triggers: vitals-ingestion hook (with the dedicated sepsis input provider)
and manual PUT. Suppression: cooldown 15 min / rate 6/h — OBSERVED: cooldown applies
per criterion including the critical bundle timers; a suppressed firing is excluded
from `overall_severity` (`trilhas_evaluator.py:469-481`).

## 8. Citation (mechanical verification only)

OBSERVED (`pathways/sepse.yaml:421-422`): `guideline: "Surviving Sepsis Campaign…
2021 (SSC-2021)"`, `doi: 10.1007/s00134-021-06506-y`. Crossref (2026-08-15): resolves
to Evans L et al., "Surviving sepsis campaign: international guidelines for management
of sepsis and septic shock 2021", Intensive Care Med 2021 — **MATCH**. Two criteria
descriptions carry "SSC-2021 RATIFICADO (RAT-SEPSE-01/02)" markers
(`pathways/sepse.yaml:221`) — the referent of these RAT- identifiers was not located
in the repository this cycle. Whether the implemented logic faithfully represents
SSC-2021 is **explicitly not assessed here** (sepsis-scores workstream scope).

## 9. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): TRANSFORM**
(structural verdict; clinical adjudication deferred to the sepsis-scores workstream).
Rationale: the v4 definition is the most mature artifact in the portfolio (composites,
deterministic timers, negated booleans used correctly, a real parity suite), and its
port-from-oracle discipline is preserved intelligence. But it inherits the engine's
missing-input silence with composite amplification (a septic-shock alert can be
silenced by one absent boolean), its severity ceiling understates septic shock, its
evaluation cadence is parasitic on vitals arrival, and it coexists with two other
sepsis rule sets with no declared authority. Not DECIDED; import blocked until
`legacy-import-policy.md` §3 is satisfied.
