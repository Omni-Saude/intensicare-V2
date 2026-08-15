---
id: LEGREV-OSMS-INDEX
title: Legacy review — V1 organ-support and medication-safety (cycle 1, Task 1, wave 1b) — index and coverage manifest
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Index, provenance record, and 89-item coverage manifest for the cycle-1
  forensic review of the legacy (V1) organ-support and medication-safety
  clinical content (workstream OSMS per coverage-map.md). Every finding in
  this directory is a PROPOSAL; nothing is imported, selected, or ratified.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: /Users/familia/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD re-verified 2026-08-15; per-file SHA-256 cited in each record)
  section_or_lines: see per-record citations
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy organ-support and medication-safety forensics reviewer (cycle 1, Task 1, wave 1b)
  transformation: >
    Read from source; summarized and analyzed. No legacy code, schema, rule,
    threshold, or YAML content is imported by this review.
  confidence: high (mechanical citations) / medium (clinical assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0006, HAZ-0016, HAZ-0019, HAZ-0021, HAZ-0022, HAZ-0031, HAZ-0035, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — organ-support and medication-safety (index)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Per `docs/00-governance/legacy-import-policy.md` §1 the default is **do not
> copy**. Guideline anchors throughout this directory rely on the reviewer's
> trained knowledge unless a legacy artifact carries the citation; every such
> anchor is marked VALIDATION REQUIRED and none was re-fetched from a
> publisher. A named intensivist and a named clinical pharmacist are required
> co-validators for these records.

## Records in this directory

| Record | Scope |
|---|---|
| `renal-aki-review.md` | domain_aki.py, aki.yaml catalog, renal.yaml pathway, domains/aki.md, migration 0015 |
| `electrolyte-review.md` | domain_electrolyte.py, electrolyte.yaml catalog, equilibrio.yaml pathway, domains/electrolyte.md, migration 0016 |
| `fluid-balance-review.md` | domain_fluid_balance.py, nutricao.yaml pathway content |
| `respiratory-ventilation-review.md` | domain_respiratory.py, domain_ventilacao.py, respiratory.yaml catalog, respiratorio/ventilacao/desmame pathways, domains/respiratory.md, api/v1/ventilation.py, migration 0018, ADR-0022 |
| `hemodynamics-stability-review.md` | domain_hemo.py, domain_estabilidade.py, hemodynamics.yaml catalog, estabilidade.yaml pathway, domains/hemodynamics.md, stability model/schema/API, migration 0017, ADR-0023 |
| `medication-safety-review.md` | domain_antimicrobiano.py, domain_profilaxia.py, domain_prescricao.py, domain_eficiencia.py, drug_safety.py, drug_interactions.py, anvisa_drug_database.py, antimicrobial/medication/prescricao/prophylaxis models+schemas+APIs, api/v1/efficiency.py, antimicrobiano/profilaxia pathways, pharmaco-interaction catalog+spec, ADR-0026, ADR-0027 |
| `domain-catalogs-review.md` | the nine runtime domain alert YAML catalogs under legacy docs/plan/_work/alerts/ (five OSMS-owned in full; four sibling-owned structurally) |
| `cluster-balanco-hidrico.md` (62) · `cluster-estabilidade.md` (26) · `cluster-ventilacao.md` (26) · `cluster-prescricao.md` (41) · `cluster-eficiencia.md` (12) · `cluster-nutricao.md` (11) · `cluster-profilaxia.md` (8) · `cluster-equilibrio.md` (4) · `cluster-antimicrobiano.md` (3) | per-rule disposition tables, 193 rules total |

## Coverage manifest — 89 assigned items (coverage-map.md, OSMS row)

| # | Item group (inventory section) | Items | Reviewed in |
|---|---|---|---|
| 1-14 | Services (2.1): domain_aki, domain_electrolyte, domain_fluid_balance, domain_respiratory, domain_ventilacao, domain_hemo, domain_estabilidade, domain_antimicrobiano, domain_profilaxia, domain_prescricao, domain_eficiencia, drug_safety, drug_interactions, anvisa_drug_database | 14 | the six domain records |
| 15-19 | Models (2.2): antimicrobial, medication, prescricao, prophylaxis, stability | 5 | medication-safety (4), hemodynamics-stability (1) |
| 20-23 | Schemas (2.3): antimicrobial, prescricao, prophylaxis, stability | 4 | medication-safety (3), hemodynamics-stability (1) |
| 24-29 | APIs (2.4): v1 antimicrobial, efficiency, prescricao, prophylaxis, stability, ventilation | 6 | medication-safety (4), hemodynamics-stability (1), respiratory-ventilation (1) |
| 30-38 | Pathway clinical content (2.5): antimicrobiano, desmame, equilibrio, estabilidade, nutricao, profilaxia, renal, respiratorio, ventilacao | 9 | matching domain records |
| 39-42 | Migrations (2.7): 0015, 0016, 0017, 0018 | 4 | matching domain records |
| 43-47 | Runtime catalogs (2.8): aki, electrolyte, hemodynamics, respiratory, pharmaco-interaction | 5 | domain-catalogs-review + domain records |
| 48-52 | Domain specs (2.9): domains/aki.md, electrolyte.md, hemodynamics.md, respiratory.md, pharmaco-interaction.md | 5 | matching domain records |
| 53-63 | Disposition shards (2.9): antimicrobiano, balanco-hidrico-p1/p2, eficiencia, equilibrio, estabilidade, nutricao, prescricao-p1/p2, profilaxia, ventilacao | 11 | matching cluster files (histograms + concordance notes) |
| 64-67 | ADRs (2.10): 0022, 0023, 0026, 0027 | 4 | respiratory-ventilation (0022), hemodynamics-stability (0023), medication-safety (0026, 0027) |
| 68-76 | Rule clusters (3): balanco-hidrico 62, estabilidade 26, ventilacao 26, prescricao 41, eficiencia 12, nutricao 11, profilaxia 8, equilibrio 4, antimicrobiano 3 (= 193 rules) | 9 | the nine cluster files (100% of on-disk rule files per cluster, counts verified on disk) |
| 77-89 | Tests (2.12): test_antimicrobial, test_domain_aki, test_domain_antimicrobiano, test_domain_eficiencia, test_domain_electrolyte, test_domain_estabilidade, test_domain_fluid_balance, test_domain_hemo, test_domain_prescricao, test_domain_profilaxia, test_domain_respiratory, test_domain_ventilacao, test_prophylaxis | 13 | LISTED, NOT REVIEWED — per coverage-map §1 rule 4 and the task packet ("tests follow the module they test; listed, not reviewed"); hashes in inventory 2.12 |

**Coverage claim (OBSERVED):** 89/89 items covered — 76 reviewed in this
directory, 13 test files listed-not-reviewed per the assignment rule (an
explicit, rule-backed treatment, not a silent omission). No per-item
deferral was needed. One verdict is BLOCKED pending a cross-workstream
ruling (below), not deferred.

## Integrity verification (OBSERVED 2026-08-15)

- Legacy HEAD re-verified equal to the pin
  (`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`).
- SHA-256 recomputed for all 72 non-rule, non-test artifacts in scope
  (14 services, 5 models, 4 schemas, 6 APIs, 9 pathway YAMLs, 4 migrations,
  9 runtime catalogs, 5 specs, 11 shards, 4 ADRs, plus sibling-owned
  catalogs for the structural audit): **every value matches
  `00-inventory/inventory.md`** — including the `(rt)` values, whose
  outside-the-pin-manifest marking is preserved wherever cited.
- The 193 rule files and 13 test files are covered file-by-file by the
  cycle-1 pin manifest per inventory §2.6/§2.12; per-cluster on-disk file
  counts were re-verified (62/26/26/41/12/11/8/4/3).

## Headline findings (detail and citations inside the records)

1. **HAZ-0005 rebuilt at aggregate scale**: `domain_estabilidade.py` scores
   27 criteria by count (0-3 "estavel"); one active *critical* criterion, a
   patient with no data, or an evaluator exception all render "ESTÁVEL —
   routine monitoring".
2. **Fabricated clinical data on a live endpoint**: `api/v1/ventilation.py`
   serves synthetic ventilation parameters/history for hardcoded patients
   with no demo gating.
3. **Phosphate governance breach**: runtime thresholds contradict
   catalog+spec+seed in unit (mmol/L vs mg/dL), bands, and severity
   topology, under a false in-code "CLINICALLY RATIFIED" claim against a
   recorded "pending RAT-ELY-01".
4. **KDIGO under-staging**: the AKI UO stage-2 band is unreachable
   (overwritten dead block) and RRT is ignored when creatinine values are
   missing.
5. **Hollow medication-safety net**: the antimicrobial evaluator marks all
   12 criteria met whenever inputs are supplied (`is not None` on a
   never-None call); dose validation silently skips every non-mg drug
   (insulin, heparin, KCl, vasopressors, fentanyl); the allergy check never
   reads patient allergies; the interaction KB contains fabricated entries
   (vancomycin-amiodarone QT, "calcium-containing" hypertonic saline,
   norepinephrine-dobutamine incompatibility).
6. **Transfusion appropriateness inverted**: TF-002 counts Hb ≥7 g/dL
   *toward* appropriateness (against the restrictive-trigger direction);
   the legacy wired platelet criterion could never fire (wrong model field).
7. **Registry/runtime drift (HAZ-0019)**: hemodynamics runs 12 evaluators
   with 6 cataloged/seeded; respiratory runs 11 with 5; every seeded
   spec_hash is a placeholder string; ADR-0022's own INV-3 is violated by
   its exemplar domain.
8. **Stale-data auto-resolution**: all four micro-batch domains auto-resolve
   watch/urgent alerts *because* data went stale (HAZ-0006/HAZ-0022).
9. **alert_groups absent in all nine runtime catalogs** — the false-green
   vector-coverage gate precondition (HAZ-0031) re-confirmed at source.

## Verdict tallies

- **193 cluster rules**: VALIDATE 80 · REJECT 67 · REFINE 20 · TRANSFORM 18
  · SUPERSEDE 8 · RETAIN 0. Divergences from the alert-threshold-engine
  review's category-level verdicts are explicitly flagged
  (RULE-EFICIENCIA-001, RULE-ANTIMICROBIANO-001); all other overlapping
  rows are concordant. Legacy shard dispositions (ADOPT-heavy) are recorded
  per cluster file; the ADOPT-vs-REJECT delta is a named-reviewer decision
  point.
- **Domain artifacts** (services, catalogs, pathways, specs, migrations,
  ADRs — 80 verdict rows across the seven records): the five runtime
  catalogs and five domain specs are VALIDATE (highest-quality artifacts;
  catalog-as-master posture); the evaluator code is VALIDATE/REFINE where
  it matches its catalog and REJECT where it diverges (phosphate, AKI-UO,
  PEEP-FiO2 lines, stability aggregate, antimicrobial evaluator, dose/
  interaction internals, ventilation API); all four migrations carry
  placeholder spec_hash values.
- **BLOCKED (1)**: boolean-criterion polarity in profilaxia.yaml /
  antimicrobiano.yaml pathways (alert-on-true vs milestone semantics)
  awaits the pathways workstream's trilhas-engine ruling — flagged in
  medication-safety-review.md §7.

## HAZ-0005 summary (per-domain worst instance)

| Domain | Worst zero-coercion/absence path |
|---|---|
| Renal/AKI | RRT active + missing creatinine → stage 0; stale data auto-resolves urgent alerts |
| Electrolyte | missing cofactors silently close watch bands; no-fire indistinguishable from normal |
| Fluid balance | unparseable/comma-decimal quantities summed as 0.0 mL with no completeness accounting |
| Respiratory/ventilation | missing vasopressor dose passes weaning-readiness; undocumented ARDS-gate members suppress surveillance |
| Hemodynamics/stability | "sem dados" and evaluator exceptions scored as criterion-not-met → 0/27 "ESTÁVEL" |
| Medication safety | non-mg drugs skip dose validation silently; absent allergy data = no risk; ≤3 stewardship findings labeled "adequate" |

## What closes this review

1. rodaquino-OMNI (GDEC-0003) reviews all verdicts, the two ATE-divergence
   rows, and the shard ADOPT-vs-REJECT deltas.
2. A named clinical pharmacist co-validates every dosing/interaction row
   (medication-safety-review.md, cluster-profilaxia, cluster-equilibrio).
3. The pathways workstream rules on boolean-criterion polarity (unblocks
   the flagged pathway verdicts).
4. Unverified citations ("KDIGO Drug-Induced AKI 2023", "Rice 2017",
   "BURN Trial 2016", "ESICM-ESE-ERBP 2024") are located or the dependent
   thresholds re-anchored; all trained-knowledge guideline checks are
   re-verified against primary sources.
