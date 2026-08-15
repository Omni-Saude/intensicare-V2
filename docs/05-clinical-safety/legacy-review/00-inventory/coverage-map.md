---
doc_id: LEGREV-COVMAP
title: "Cycle-1 legacy clinical-content coverage map (workstream assignment)"
status: PROPOSAL
label: PROPOSAL (assignments) over OBSERVED enumeration in inventory.md
owner: rodaquino-OMNI (accountable clinical reviewer, GDEC-0003)
collector: legacy-clinical-content cataloguer (cycle 1, Task 1)
source: docs/05-clinical-safety/legacy-review/00-inventory/inventory.md; /Users/familia/intensicare @ 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: /Users/familia/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD, re-verified 2026-08-15)
  section_or_lines: whole-repository enumeration; per-file hashes cited inline
  date_collected: 2026-08-15
  collector: legacy-clinical-content cataloguer (cycle 1, Task 1)
  transformation: enumerated, counted, hashed, classified; no legacy rule content imported
  confidence: high (enumeration) / medium (classifications)
  owner: rodaquino-OMNI (accountable clinical reviewer, GDEC-0003)
  validation_status: VALIDATION REQUIRED
---

# Cycle-1 legacy clinical-content coverage map

> Proves that **every clinically substantive item** enumerated in
> [`inventory.md`](inventory.md) is assigned to **exactly one** cycle-1 review
> workstream, or is **explicitly deferred with a recorded reason**. All
> assignments are **PROPOSAL** (this agent's reasoning is recorded per item in
> inventory.md), awaiting review by **rodaquino-OMNI** (GDEC-0003). SHA-256
> pins for every item live in inventory.md and are not repeated here.

## 1. Assignment rules

1. **Exactly one owner per item.** Item granularity: one source FILE for code,
   YAML, migrations, ADRs, tests, frontend findings; one CLUSTER for the 959
   extracted rules (each rule belongs to exactly one cluster), except the
   `clinical-scoring` cluster, which is split at RULE level (section 4) because
   its 18 rules span two workstreams.
2. Rule `category` directories are NOT assignment units (each rule already has
   exactly one cluster); this prevents double assignment.
3. Disposition shards and traceability rows follow the cluster of the rules
   they disposition.
4. Tests follow the module they test (listed, not reviewed, per task packet).
5. Cross-check notes in inventory.md (e.g. SOFA content inside the
   clinical-forms engine) are advisory for reviewers and do NOT create second
   assignments.

## 2. Coverage summary (item counts from inventory.md)

| Workstream | Status | Assigned items |
|---|---|---|
| ews (NEWS2/MEWS) | cycle-1, running | 44 |
| sepsis-scores (SOFA/qSOFA/sepse content) | cycle-1, running | 23 |
| alert-threshold-engine | cycle-1, running | 57 |
| pathways (12 YAML defs + trilhas engine) | cycle-1, running | 25 |
| kpi | cycle-1, running | 6 |
| neuro-sedation-scores (GCS/RASS/pain/ARDS/FOIS/delirium/sedation) | cycle-1, running | 29 |
| **WAVE-1B (proposed)** organ-support-and-medication-safety | PROPOSAL — needs owner | 89 |
| **WAVE-1B (proposed)** data-quality-and-physiological-calculation | PROPOSAL — needs owner | 11 |
| **WAVE-1B (proposed)** clinical-documentation-and-forms | PROPOSAL — needs owner | 9 |
| DEFERRED (explicit, with reason — section 5) | recorded | 65 |
| SPLIT (clinical-scoring cluster + its disposition shard — section 4) | resolved at rule level | 2 |

**Completeness claim (OBSERVED over inventory.md):** every row of every
inventory table carries exactly one workstream value or DEFERRED; the
clinical-scoring split is total (rules 001-012 + 013-018 = all 18). No
clinically substantive item is unassigned.

## 3. Assignment map by workstream

Item lists reference inventory.md sections; file-level detail and hashes there.

### ews — NEWS2/MEWS early warning
- Services (2.1): `news2.py`, `mews.py`, `ews_nrt_runner.py`, `vitals.py`, `deterioration_trend.py`, `domain_piora_clinica.py`
- Models/schemas/api (2.2-2.4): `vital_sign.py`, `clinical_score.py`, `deterioration.py`, `algorithm_registry.py`, `ratification_event.py`; `schemas/vitals.py`, `schemas/deterioration.py`; `api/vitals.py`, `api/v1/deterioration.py`
- Migrations (2.7): 0005, 0007, 0008, 0020, 0021, 0023, 0029, 0039
- Catalogs/specs (2.8-2.9): `early-warning-scores.yaml`, `domains/early-warning-scores.md`, `piora-clinica` disposition shard
- Rules (3): cluster `piora-clinica` (12)
- ADRs (2.10): 0024
- Frontend parity findings (2.13): `score-pair.tsx`, `score-timeline.tsx`, `patient-header.tsx`, `SeverityBadge.tsx`, `BedCard.tsx`, `PatientDetail.tsx`, `ScoreTrendChart.tsx`
- Tests (2.12): news2/mews/ews-nrt/vitals/deterioration/piora/scorer-property/algorithm-registry sets

### sepsis-scores — SOFA/qSOFA/sepsis clinical content
- Services (2.1): `sofa.py`, `qsofa.py`, `domain_sepsis.py`, `sepsis_input_provider.py`
- Models (2.2): `lab_result.py`
- Pathway content (2.5): `pathways/sepse.yaml` (clinical content; its ENGINE handling stays with pathways), root `sepse.yaml`, `registry.json`
- Migrations (2.7): 0010, 0014, 0022, 0025, `33909c9d8845`
- Catalogs/specs (2.8-2.10): `sepsis.yaml`, `domains/sepsis.md`, sepse disposition shards p1-p3, `docs/clinical/sepse-criteria-migration.md`, ADR-0031, ADR-0035
- Rules (3): cluster `sepse` (98/99) + `clinical-scoring` rules 001-012 (section 4)
- Tests (2.12): sofa/qsofa/domain-sepsis/sepse-yaml-parity

### alert-threshold-engine
- Services (2.1): `alert_engine.py`, `alert_compiler.py`, `alert_copy.py`, `threshold_resolver.py`, `correlation_engine.py`, `domain_alertas.py`, `notification_worker.py`, `dashboard.py`, `patients.py`
- Models/schemas/api (2.2-2.4): alert, alert_definition_version, alert_routing, correlation_event, threshold_config; schemas alerts/alert_routing/severity/thresholds/dashboard/patients; api thresholds, v1 alerts/alert_routing/cds_hooks/dashboard; `api/patients.py`
- Migrations (2.7): 0009, 0013, 0019, 0024, 0026, 0027, 0028, 0038
- Catalogs/specs (2.8-2.10): `correlation-engine.yaml`, `domains/correlation-engine.md`, both alert-catalog.md files, `alertas` disposition shard, ADR 0013, ADR 0014
- Rules (3): cluster `alertas` (26/29)
- Scripts (2.11): `build_alert_registry.py`, `check_vector_coverage.py`
- Frontend findings (2.13): `BedGrid.tsx`, `AlertPanel.tsx`, `types/index.ts`
- Tests (2.12): alert-compiler/copy/engine/alerts/thresholds/threshold-resolver/correlation/severity-model/notification/dashboard/cds-hooks/alert-vectors/alert-storm

### pathways — 12 YAML definitions + trilhas engine
- Services (2.1): `trilhas_engine.py`, `trilhas_compiler.py`, `trilhas_evaluator.py`, `trilhas_definitions.py`, `trilhas_state.py`, `domain_trilhas_engine.py`, `pathway_enrollment.py`, `pathway_repository.py`, `pathway_auto_evaluation.py`, `pathway_definitions_sync.py`
- Models/schemas/api (2.2-2.4): `pathway.py`; `schemas/pathways.py`; `api/v1/pathways.py`
- Content (2.5): `pathway.schema.json`; engine-level review of all 12 YAMLs (clinical content of `sepse.yaml` sits with sepsis-scores; the other 11 YAMLs' clinical content sits with the domain workstreams marked in 2.5)
- Rules (3): cluster `trilhas-engine` (18)
- Specs (2.9-2.10): `trilhas-engine` disposition shard; ADR 0020, 0021, ADR-0038
- Scripts (2.11): `validate_alerts.py`
- Tests (2.12): trilhas/pathway sets

### kpi
- Services (2.1): `ppv_tracker.py`; `core/metrics.py` (2.4)
- API (2.4): `api/v1/indicators.py`
- Rules (3): cluster `indicadores-etl` (27)
- Specs (2.9): `indicadores-etl` disposition shard
- Tests (2.12): ppv-tracker, indicators

### neuro-sedation-scores — GCS/RASS/pain/ARDS/FOIS/delirium/sedation
- Services (2.1): `domain_sedacao.py`, `domain_formularios.py`, `domain_pharmaco_delirium.py`
- Models/schemas/api (2.2-2.4): `clinical_form.py`, `sedacao.py`; schemas clinical_forms/clinical_forms_extended/sedacao; api clinical_forms, v1 formularios/sedacao
- Pathway content (2.5): `pathways/delirium.yaml`, `pathways/sedacao.yaml` (clinical content)
- Catalogs/specs (2.8-2.10): `neuro-sedation.yaml`, `domains/neuro-sedation.md`, sedacao + formularios-clinicos disposition shards, ADR 0015, 0029
- Rules (3): clusters `sedacao` (27), `formularios-clinicos` (43/45) + `clinical-scoring` rules 013-018 (GCS, RASS, pain scales, ARDS enum, FOIS — section 4)
- Frontend findings (2.13): `ScoreDisplay.tsx`
- Tests (2.12): sedacao/delirium/pharmaco/clinical-forms/formularios
- NOTE (NL-2): FOIS has NO runtime code; review population is catalog + plan content only.

### WAVE-1B (PROPOSAL) organ-support-and-medication-safety — needs a named owner before it can open
- Services (2.1): `domain_aki.py`, `domain_electrolyte.py`, `domain_fluid_balance.py`, `domain_respiratory.py`, `domain_ventilacao.py`, `domain_hemo.py`, `domain_estabilidade.py`, `domain_antimicrobiano.py`, `domain_profilaxia.py`, `domain_prescricao.py`, `domain_eficiencia.py`, `drug_safety.py`, `drug_interactions.py`, `anvisa_drug_database.py`
- Models/schemas/api (2.2-2.4): antimicrobial, medication, prescricao, prophylaxis, stability models; matching schemas; api v1 antimicrobial/prescricao/prophylaxis/stability/ventilation/efficiency
- Pathway content (2.5): clinical content of `antimicrobiano.yaml`, `desmame.yaml`, `equilibrio.yaml`, `estabilidade.yaml`, `nutricao.yaml`, `profilaxia.yaml`, `renal.yaml`, `respiratorio.yaml`, `ventilacao.yaml`
- Migrations (2.7): 0015, 0016, 0017, 0018
- Catalogs/specs (2.8-2.10): `aki.yaml`, `electrolyte.yaml`, `hemodynamics.yaml`, `respiratory.yaml`, `pharmaco-interaction.yaml` + their four `domains/*.md`, matching disposition shards, ADR 0022, 0023, 0026, 0027
- Rules (3): clusters `balanco-hidrico` (62), `estabilidade` (26), `ventilacao` (26), `eficiencia` (12), `nutricao` (11), `profilaxia` (8), `equilibrio` (4), `antimicrobiano` (3), `prescricao` (41)
- Tests (2.12): matching domain test set

### WAVE-1B (PROPOSAL) data-quality-and-physiological-calculation — needs a named owner
- Services (2.1): `units_normalizer.py`, `gold_reader.py`, `gold_schema.py`, `gold_writer.py`
- API (2.4): `api/reference_ranges.py`
- Rules (3): cluster `sinais-vitais` (33)
- Specs (2.9, 2.11): `units-registry.md`, `sinais-vitais` disposition shard, `scripts/verify_units.py`
- Tests (2.12): units-normalizer, gold-reader/schema/writer

### WAVE-1B (PROPOSAL) clinical-documentation-and-forms — needs a named owner
- Services (2.1): `domain_evolucoes.py`
- Models/schemas/api (2.2-2.4): `evolucao.py`; `schemas/evolucoes.py`; `api/v1/evolucoes.py`
- Rules (3): cluster `evolucoes` (77)
- Specs (2.9-2.10): evolucoes disposition shards, ADR 0028
- Tests (2.12): domain-evolucoes

## 4. The clinical-scoring cluster split (rule-level, total)

| Rules | Content | Workstream |
|---|---|---|
| RULE-CLINICAL-SCORING-001 … 012 | SOFA total + six organ sub-scores, P/F ratio, MAP derivation, age input, SOFA input sourcing/assembly | sepsis-scores |
| RULE-CLINICAL-SCORING-013 … 018 | GCS valid range, RASS enumeration, numeric pain scale 0-10, behavioral pain scale 3-12, ARDS (SDRA) severity enumeration, FOIS enumeration | neuro-sedation-scores |

The `clinical-scoring.yaml` disposition shard is reviewed by each workstream
for its own rules (the only two-reader artifact; each rule still has exactly
one owner).

## 5. Deferral register (explicit, with reason — nothing silently dropped)

| ID | Deferred set | Reason (INFERENCE, reviewable) |
|---|---|---|
| DEF-1 | Non-clinical rule clusters: `auth-usuarios` (62/63), `auditoria-logs` (36), `tenancy-organizacao` (52), `cadastros-ui` (20), `operacional-infra` (59/62) + their disposition shards | Access control, audit, tenancy, UI registration, infrastructure — no patient-assessment or alerting logic. Re-enters scope only if a workstream finds clinical semantics embedded (escalate to rodaquino-OMNI). |
| DEF-2 | `comunicacao` cluster (45/46) + shards; `domain_comunicacao.py` | Messaging/notification counter mechanics. ADJACENCY NOTE: alert DELIVERY semantics are covered by alert-threshold-engine via `notification_worker.py`; only chat mechanics are deferred. |
| DEF-3 | `movimentacao-adt` cluster (70) + shards; `domain_movimentacao.py`; movimentacao model/schema/api; ADR 0025 | ADT/bed mechanics, not clinical logic. ADJACENCY NOTE: bed/unit assignment feeds bed-grid severity display (cycle-0 hazard HAZ-0004 lineage); alert-threshold-engine owns the display-semantics review and must consume this note. |
| DEF-4 | `documentacao-faturamento` cluster (31/32) + `domain_documentacao.py` + documentacao model/schema/api (billing); `docs/rules/` meta files + `extraction/` + `inventory/`; `docs/plan/_work/` process subtrees; non-clinical ADRs; `docs/audit/`, `audit-results/`, `docs/regulatory/`, `docs/compliance/`, design/product/delivery plan docs | Billing and extraction/planning/audit process artifacts — provenance and reference material, not clinical logic to review. Retained as evidence; import policy still applies if ever used. |
| DEF-5 | `docs/plan/clinical/hazard-log.md` | Safety-case artifact: belongs to the V2 clinical safety-case engineer (hazard-log owner), not to a cycle-1 content workstream. Recorded so it is not lost. |
| DEF-6 | Infra services/tests: `altb_trigger.py`, `arq_settings.py`, `kms_keys.py`, `mpi_resolver.py`, `patient_encryption.py`, `patients.py` support files, auth/api/transport surfaces marked DEFERRED in inventory 2.1-2.4, remaining infra/security test files (2.12), transport modules (`mllp_listener.py`, `fhir/client.py`, clients) | Infrastructure, security, identity and transport plumbing with no clinical rule content. ADJACENCY NOTE: patient-identity (mpi) and message-transport failures are safety topics for the V2 hazard log, not clinical-content review items. |

## 6. What closes this map

1. rodaquino-OMNI reviews classifications (inventory section 3) and these
   assignments; any reclassification moves items between sections 3 and 5 —
   the union stays total by construction.
2. The three WAVE-1B workstreams need named owners before their
   89+11+9 items can be reviewed;
   until then those items are ASSIGNED (not deferred) but BLOCKED on staffing.
3. NL-1 (inventory section 4) limits every rule review to the extracted files;
   re-verification against upstream sources requires mounting the two upstream
   repositories — a human decision.
