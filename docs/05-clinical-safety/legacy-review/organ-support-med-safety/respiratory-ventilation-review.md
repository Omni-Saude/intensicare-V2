---
id: LEGREV-OSMS-RESP
title: Legacy review — respiratory + ventilation domain (Berlin staging, weaning, catalogs, API, seed, ADR-0022)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Forensic review of the legacy V1 respiratory/ventilation clinical content:
  domain_respiratory.py (11 evaluators incl. Berlin ARDS staging),
  domain_ventilacao.py (parameter extraction/trend), runtime catalog
  respiratory.yaml, pathways respiratorio.yaml / ventilacao.yaml /
  desmame.yaml, api/v1/ventilation.py, migration 0018, and ADR-0022. All
  verdicts are PROPOSALS; nothing is imported.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: https://github.com/Omni-Saude/intensicare
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
  hazards: [HAZ-0005, HAZ-0016, HAZ-0019, HAZ-0021, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — respiratory + ventilation domain

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Guideline comparisons (Berlin Definition JAMA 2012; Rice et al. Chest
> 2007 S/F surrogates; ARDSnet ARMA NEJM 2000; Boles et al. Eur Respir J
> 2007 weaning consensus; Yang-Tobin NEJM 1991; TracMan JAMA 2013) rely on
> trained knowledge, not re-fetched — VALIDATION REQUIRED throughout.

## 0. Artifacts and integrity (OBSERVED 2026-08-15; hashes match inventory)

| Artifact | SHA-256 |
|---|---|
| `src/intensicare/services/domain_respiratory.py` | `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` |
| `src/intensicare/services/domain_ventilacao.py` | `ecd0a99fbf38aeaf4195cc60f75939b4fe18d96c13fd3eda2a8ae945f3422a1c` |
| `src/intensicare/api/v1/ventilation.py` | `b0f21471ff7488205e160edfcf2605647cd73efbcc5a041169964bbea38794b5` |
| `docs/plan/_work/alerts/respiratory.yaml` | `7186652bccffce6a99f1e8d5722913683c7009c875adaa15b1207715ea7634af` (rt) |
| `_work/alerts/pathways/respiratorio.yaml` | `9792ca62fc663d77315ae5e0ea41d9bbcb2b6bfa36c55eaeb42bb05533ad5d1e` |
| `_work/alerts/pathways/ventilacao.yaml` | `d1c48956f19eb55633f034cd800b05ed35004664864942f75533e1635a6fd8d3` |
| `_work/alerts/pathways/desmame.yaml` | `808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a` |
| `docs/plan/clinical/domains/respiratory.md` | `d9246cf2254065fbbf27ca58214ad67a420fd1398e8de42430dd594c699e7d4b` (rt) |
| `alembic/versions/0018_seed_respiratory_definitions.py` | `26b916ff7ce6f2644da7e1e51822bbf516b67ef1848f4b5f8517dd1daa2cae85` (rt) |
| `docs/adr/0022-ventilacao-service-architecture.md` | `0bc5085397cb2e2682790ee6b1a6594197924e3226bbb9b17ba962787781a50e` (rt) |

## 1. Implemented thresholds, verbatim (`domain_respiratory.py`)

FiO2 is enforced as fraction 0-1 at every entry (`_ensure_fio2_fraction`,
62-81; values >1.0 auto-divided by 100).

| Alert | Trigger (verbatim summary) | Severity | Lines |
|---|---|---|---|
| ARDS-STAGING-01 | gate: PEEP≥5 AND infiltrado_bilateral AND edema_cardiogenico_excluido; S/F ≤315/≤235/≤148 → leve/moderada/grave; P/F ≤300/≤200/≤100 authoritative when ABG present | watch/urgent/critical | 120-215 |
| DETERIORATION-02 | ΔS/F 6h ≤ −20% OR (FiO2 > 1.30× 6h-ago AND SpO2 ≤ 6h-ago) | urgent | 223-278 |
| ASYNCHRONY-03 | spontaneous RR > set RR AND Pplat > 30 | watch | 286-328 |
| WEANING-READY-04 | S/F>315 AND PEEP≤8 AND FiO2≤0.40 AND (RSBI<105 if present) AND RASS≥−2 AND GCS≥10 AND (vasopressor ≤0.2 if present) AND days-on-MV≥1 | normal (positive signal) | 336-415 |
| PROLONGED-INTUB-05 | TOT AND (days>10 non-COVID, ≥14 COVID) | watch | 423-471 |
| HIGH-PPLAT-06 | Pplat>30 OR VT>8 mL/kg PBW (PBW: male 50, female 45.5, +0.91×(cm−152.4)) | watch | 480-547 |
| PEEP-FIO2-MODERATE-07 | 200<P/F≤300 AND PEEP < FiO2×15 − 2 | watch | 556-614 |
| PEEP-FIO2-SEVERE-08 | P/F≤200 AND PEEP < FiO2×18 − 2 | urgent | 623-667 |
| PROLONGED-COVID-09 | TOT AND COVID AND days≥14 | watch | 676-720 |
| EXTUBATION-BUNDLE-10 | 5 of 5: FiO2≤0.40; PEEP≤8; P/F≥150; (GCS>8 OR RASS≥−2); vasopressor ≤0.2 **or absent** | normal | 729-804 |
| PAIN-ASSESS-11 | NRS ≥9 critical, 7-8 urgent, 4-6 watch, 1-3 normal; BPS fallback ≥10/7-9/4-6/3 when NRS absent or RASS≤−3 | varies | 813-899 |

## 2. Published-definition comparison and discrepancies

1. **Berlin staging faithful** (P/F 100/200/300 with PEEP≥5 gate; S/F
   315/235 per Rice 2007; S/F 148 for severe is a common extrapolation but
   is not in Rice's regression — UNCITED at the severe cut in code; the
   catalog cites Berlin + Rice). Berlin's one-week-onset timing criterion is
   not represented (accepted simplification, note only).
2. **ARDS gate suppression**: `edema_cardiogenico_excluido is not True` and
   `infiltrado_bilateral is not True` fail the gate — an *undocumented*
   exclusion (imaging or echo not yet charted) silently disables ARDS
   surveillance with no not-evaluated record (HAZ-0021). The docstring's
   "on mechanical ventilation/CPAP" gate member is not checked in code
   (PEEP presence is the proxy).
3. **Invented PEEP-adequacy line.** Alerts 07/08 cite the ARDSnet FiO2×PEEP
   table in comments (591-594), then implement `min_peep = FiO2×15` (07) or
   `FiO2×18` (08) minus 2 cmH2O tolerance — a linear surrogate that matches
   no published table row-for-row (comment itself says "at least FiO2 * 10"
   while code uses ×15 — comment/code mismatch at 596-600). UNCITED
   construction.
4. **Duplicate alert channels** (HAZ-0016): PROLONGED-INTUB-05 already fires
   for COVID ≥14 d; PROLONGED-COVID-09 fires again for the same state.
   WEANING-READY-04 and EXTUBATION-BUNDLE-10 are two overlapping positive
   eligibility signals with different GCS/oxygenation members; both can fire
   simultaneously.
5. **Weaning GCS threshold drift across surfaces**: code `GCS >= 10`
   (claimed "RATIFIED", line 389-391); catalog `respiratory.yaml:160` and
   migration 0018 seed text say `glasgow > 8`; desmame.yaml pathway bands
   normal at ≥11 / watch 9-10 / critical <9. Three different weaning-GCS
   cutoffs live simultaneously; the persisted definition (seed) does not
   describe the runtime (HAZ-0019/0035).
6. **Extubation bundle omits the RR criterion** its cited consensus (Boles
   2007) includes — `rr` is read (750) but never tested; `total_needed = 5`
   counts only the five implemented members.
7. **Absence-as-eligible**: in both weaning alerts a missing vasopressor
   dose passes the vasopressor criterion (`if dose_vaso is not None and ... >
   0.2: return` / `if dose_vaso is None or <=0.2: vaso_ok`) — an unrecorded
   norepinephrine infusion produces a weaning-ready signal (HAZ-0005-pattern
   in the falsely-reassuring direction).
8. **Persistence clauses unimplemented**: DETERIORATION-02 docstring and
   catalog require ≥2-sample persistence; WEANING-READY-04 requires
   "sustained ≥2h" — evaluators are point-in-time; the guard exists only in
   prose.
9. **Definition-registry undercoverage**: migration 0018 seeds 5
   definitions; the module registers 11 evaluators and its in-code
   `RESPIRATORY_ALERT_DEFINITIONS` lists 6 (adds PAIN-ASSESS-11, semver
   3.0.0 vs seeded 1.0.0). Alerts 06-10 run with **no definition version
   anywhere** — direct violation of ADR-0022's INV-3 ("every alert must
   stamp the exact definition_version"), by the very domain the ADR uses as
   its exemplar.
10. **Unverified citations**: "Rice 2017" (deterioration trend; Rice's S/F
    work is 2007 — the 2017 attribution is unverified), "BURN Trial (2016)"
    (desmame.yaml evidence line — no such weaning trial known to this
    reviewer). Real anchors present: Berlin JAMA 2012, Rice Chest 2007,
    ARMA NEJM 2000, Amato NEJM 2015, Boles ERJ 2007, Yang-Tobin NEJM 1991,
    TracMan JAMA 2013, PADIS 2018 (all VALIDATION REQUIRED, none
    re-fetched).
11. **Pain scales in the respiratory module**: NRS/BPS banding
    (PADIS-adjacent) is implemented here, not in the sedation domain; the
    published-instrument content of NRS 0-10 and BPS 3-12 is owned by
    RULE-CLINICAL-SCORING-015/016 (neuro-sedation-scores workstream —
    cross-check note, no second assignment). Local defects: mild pain 1-3
    fires an alert with severity "normal" (noise channel);
    `scale_used` metadata reports "NRS" even when the BPS fallback was used
    for a sedated patient with an NRS value present (metadata lie, 887).

### Pathway surfaces

- `respiratorio.yaml` (id 12): SpO2 bands [0,85) critical / [85,92) urgent /
  [92,96) normal / ≥96 **watch** (hyperoxia de-escalation vigilance —
  defensible per BTS-style targets, but a SpO2 of 97% raising a watch flag
  needs deliberate acceptance); FR <8 critical, ≥35 urgent; **FiO2 declared
  in % (21-100)** while the respiratory domain's mission law demands
  fraction at every computation boundary — a declared, contained exception
  but a standing unit trap; PaCO2 bands generic (no chronic-retainer
  context).
- `ventilacao.yaml` (id 1) is a two-criterion stub (P/F Berlin bands ✓; a
  `peep >= 5` threshold criterion that is true for essentially every
  ventilated patient — meaningless as an alert predicate) and does not set
  `active:` — consistent with the cycle-0 "stub" finding.
- `desmame.yaml` (id 3): RSBI [0,80) normal / [80,105) watch / ≥105
  "critical" — Yang-Tobin 105 correct; NIF bands direction-correct
  (−25 boundary); severity "critical" used for weaning-ineligibility (a
  planning signal), overloading the emergency tier (severity-semantics
  finding shared with nutricao.yaml).

### `domain_ventilacao.py` and the API

- Extraction/trend only; no thresholds. Defect: trend map keys Pplat to raw
  field `pplat` (92-100) while `domain_respiratory` evaluators read
  `pressao_plato` — callers feeding one convention silently produce empty
  Pplat trends in the other (silent data mismatch).
- Trend direction = first-vs-last with ±5% band (179-209) — noise-sensitive
  display heuristic, tolerable for display only.
- **`api/v1/ventilation.py` serves fabricated data**: `_SAMPLE_PATIENTS` /
  `_SAMPLE_HISTORY` ("Sample in-memory data (for testing — no database
  yet)", line ~96; `_build_history` generates "random-like variations to
  simulate real clinical fluctuations", 166-170) are returned by
  `GET /patients/{mpi_id}/ventilation` for hardcoded MPI ids, with **no
  demo flag** (contrast api/v1/stability.py, which gates demo data behind
  `?demo=true`). A patient-facing clinical endpoint that returns synthetic
  ventilation parameters as if real is a first-order clinical hazard
  (HAZ-0036 family: output that reads as genuine clinical data).

## 3. HAZ-0005 zero-coercion assessment

| Path | Behavior on absent input | Assessment |
|---|---|---|
| ARDS gate | missing PEEP/infiltrate/exclusion → no staging | silent suppression of surveillance; no not-evaluated record (HAZ-0021) |
| S/F and P/F helpers | missing member → None → no band | no numeric coercion; opacity only |
| Weaning/extubation vasopressor member | absent dose → criterion passes | **absence coerced to eligible** — falsely reassuring positive signal |
| Asynchrony | absent plateau → no fire (documented "degrades") | acceptable design, still unrecorded |
| Prolonged intubation | `covid19_ativo` default False | unknown COVID status treated as non-COVID (higher threshold path is ≥14; default gives the stricter >10 — conservative direction, acceptable) |
| PBW sex handling | unknown sex → male formula | overestimates PBW for unrecorded-sex females → underestimates VT/kg → under-alerts on volutrauma |
| Stale auto-resolve (942-959) | watch/urgent auto-resolve when stale | HAZ-0006/0022, identical to AKI/electrolyte modules |

## 4. Verdicts (all PROPOSAL)

| Artifact / path | Verdict | Rationale |
|---|---|---|
| ARDS-STAGING-01 | VALIDATE | Berlin-faithful bands with P/F-authoritative override; gate-absence opacity must be fixed by an evaluation-status contract |
| DETERIORATION-02 | REFINE | sound trend concept; persistence guard must move from prose to code; "Rice 2017" citation unverified |
| ASYNCHRONY-03 | VALIDATE | conservative two-member proxy; plateau-gated |
| WEANING-READY-04 | REFINE | fix absence-as-eligible vasopressor member and the three-way GCS drift before any use |
| PROLONGED-INTUB-05 | VALIDATE | TracMan-era thresholds plausible |
| HIGH-PPLAT-06 | VALIDATE | ARDSnet-consistent (Pplat 30, VT>8 mL/kg PBW, correct PBW formulas); unknown-sex PBW noted |
| PEEP-FIO2-MODERATE-07 / SEVERE-08 | REJECT as implemented / TRANSFORM | invented linear min-PEEP line contradicts the cited table and its own comment; rebuild table-driven |
| PROLONGED-COVID-09 | REJECT | pure duplicate of 05's COVID arm (alarm duplication, HAZ-0016) |
| EXTUBATION-BUNDLE-10 | REFINE | missing RR member vs cited consensus; overlaps 04 — consolidate to one weaning-readiness channel |
| PAIN-ASSESS-11 | VALIDATE (bands) / REFINE (placement+metadata) | PADIS-adjacent bands plausible; wrong domain; normal-severity firing and scale_used bug |
| `respiratory.yaml` catalog | VALIDATE | well-cited, boundary-tested; but covers only 5 of 11 runtime alerts — must be reconciled |
| `respiratorio.yaml` pathway | VALIDATE (with unit-exception note) | bands defensible; FiO2-% declaration is a standing trap against the fraction law |
| `ventilacao.yaml` pathway | ARCHIVE | inactive stub; PEEP≥5 predicate meaningless as alert |
| `desmame.yaml` pathway | VALIDATE (values) / REFINE (severity semantics) | Yang-Tobin/NIF values right; "critical" tier misused for eligibility |
| `domain_ventilacao.py` | REFINE | field-name mismatch (`pplat` vs `pressao_plato`) must be unified |
| `api/v1/ventilation.py` | REJECT | fabricated sample data served as real patient data on a clinical endpoint |
| migration 0018 | REJECT (coverage+drift) | seeds 5 of 11 alerts; seeded GCS text diverges from runtime; placeholder-style spec_hash values |
| ADR-0022 | ARCHIVE (reference) | the versioning/INV-3 reasoning is sound and is precisely what the observed code violates — keep as evidence for V2's rule-registry requirement |

**Worst finding:** `api/v1/ventilation.py` returns fabricated ventilation
parameters and history for hardcoded patients with no demo gating — any
consumer treating this surface as real data is reading synthetic clinical
values. Runner-up: five of eleven live respiratory evaluators exist in no
definition registry (catalog or DB), violating the system's own ADR-0022
INV-3 versioning invariant.
