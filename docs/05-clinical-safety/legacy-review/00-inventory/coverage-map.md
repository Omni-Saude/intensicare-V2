---
doc_id: LEGREV-COVMAP
title: "Mapa de cobertura do conteúdo clínico legado do ciclo-1 (atribuição de workstream)"
status: PROPOSAL
label: PROPOSAL (atribuições) sobre enumeração OBSERVED em inventory.md
owner: rodaquino-OMNI (revisor clínico responsável, GDEC-0003)
collector: catalogador de conteúdo clínico legado (ciclo 1, Tarefa 1)
source: docs/05-clinical-safety/legacy-review/00-inventory/inventory.md; https://github.com/Omni-Saude/intensicare @ 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: https://github.com/Omni-Saude/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD, reverificado em 2026-08-15)
  section_or_lines: enumeração de todo o repositório; hashes por arquivo citados inline
  date_collected: 2026-08-15
  collector: catalogador de conteúdo clínico legado (ciclo 1, Tarefa 1)
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (enumerado, contado, hasheado,
    classificado; nenhum conteúdo de regra legada importado)
  confidence: alta (enumeração) / média (classificações)
  owner: rodaquino-OMNI (revisor clínico responsável, GDEC-0003)
  validation_status: VALIDATION REQUIRED
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# Mapa de cobertura do conteúdo clínico legado do ciclo-1

> Prova que **todo item clinicamente substantivo** enumerado em
> [`inventory.md`](inventory.md) está atribuído a **exatamente um** workstream
> de revisão do ciclo-1, ou é **explicitamente adiado com um motivo
> registrado**. Todas as atribuições são **PROPOSAL** (o raciocínio deste
> agente está registrado por item em inventory.md), aguardando revisão por
> **rodaquino-OMNI** (GDEC-0003). Os pins SHA-256 de cada item vivem em
> inventory.md e não são repetidos aqui.

## 1. Regras de atribuição

1. **Exatamente um dono por item.** Granularidade do item: um ARQUIVO fonte
   para código, YAML, migrações, ADRs, testes, achados de frontend; um
   CLUSTER para as 959 regras extraídas (cada regra pertence a exatamente um
   cluster), exceto o cluster `clinical-scoring`, que é dividido em nível de
   REGRA (seção 4) porque suas 18 regras cobrem dois workstreams.
2. Diretórios de `category` de regra NÃO são unidades de atribuição (cada
   regra já tem exatamente um cluster); isso evita atribuição dupla.
3. Shards de disposição e linhas de rastreabilidade seguem o cluster das
   regras que dispõem.
4. Testes seguem o módulo que testam (listados, não revisados, conforme o
   pacote de tarefa).
5. Notas de cross-check em inventory.md (p. ex., conteúdo de SOFA dentro do
   motor de formulários clínicos) são consultivas para revisores e NÃO criam
   segundas atribuições.

## 2. Resumo de cobertura (contagens de item a partir de inventory.md)

| Workstream | Status | Itens atribuídos |
|---|---|---|
| ews (NEWS2/MEWS) | ciclo-1, em andamento | 44 |
| sepsis-scores (conteúdo SOFA/qSOFA/sepse) | ciclo-1, em andamento | 23 |
| alert-threshold-engine | ciclo-1, em andamento | 57 |
| pathways (12 defs YAML + motor de trilhas) | ciclo-1, em andamento | 25 |
| kpi | ciclo-1, em andamento | 6 |
| neuro-sedation-scores (GCS/RASS/dor/ARDS/FOIS/delirium/sedação) | ciclo-1, em andamento | 29 |
| **WAVE-1B (proposta)** organ-support-and-medication-safety | PROPOSAL — precisa de dono | 89 |
| **WAVE-1B (proposta)** data-quality-and-physiological-calculation | PROPOSAL — precisa de dono | 11 |
| **WAVE-1B (proposta)** clinical-documentation-and-forms | PROPOSAL — precisa de dono | 9 |
| ADIADO (explícito, com motivo — seção 5) | registrado | 65 |
| DIVIDIDO (cluster clinical-scoring + seu shard de disposição — seção 4) | resolvido em nível de regra | 2 |

**Alegação de completude (OBSERVED sobre inventory.md):** toda linha de toda
tabela de inventário carrega exatamente um valor de workstream ou ADIADO; a
divisão de clinical-scoring é total (regras 001-012 + 013-018 = todas as 18).
Nenhum item clinicamente substantivo está não-atribuído.

## 3. Mapa de atribuição por workstream

As listas de itens referenciam seções de inventory.md; o detalhe em nível de
arquivo e os hashes estão lá.

### ews — early warning NEWS2/MEWS
- Serviços (2.1): `news2.py`, `mews.py`, `ews_nrt_runner.py`, `vitals.py`, `deterioration_trend.py`, `domain_piora_clinica.py`
- Models/schemas/api (2.2-2.4): `vital_sign.py`, `clinical_score.py`, `deterioration.py`, `algorithm_registry.py`, `ratification_event.py`; `schemas/vitals.py`, `schemas/deterioration.py`; `api/vitals.py`, `api/v1/deterioration.py`
- Migrações (2.7): 0005, 0007, 0008, 0020, 0021, 0023, 0029, 0039
- Catálogos/specs (2.8-2.9): `early-warning-scores.yaml`, `domains/early-warning-scores.md`, shard de disposição `piora-clinica`
- Regras (3): cluster `piora-clinica` (12)
- ADRs (2.10): 0024
- Achados de paridade de frontend (2.13): `score-pair.tsx`, `score-timeline.tsx`, `patient-header.tsx`, `SeverityBadge.tsx`, `BedCard.tsx`, `PatientDetail.tsx`, `ScoreTrendChart.tsx`
- Testes (2.12): conjuntos news2/mews/ews-nrt/vitals/deterioration/piora/scorer-property/algorithm-registry

### sepsis-scores — conteúdo clínico SOFA/qSOFA/sepse
- Serviços (2.1): `sofa.py`, `qsofa.py`, `domain_sepsis.py`, `sepsis_input_provider.py`
- Models (2.2): `lab_result.py`
- Conteúdo de pathway (2.5): `pathways/sepse.yaml` (conteúdo clínico; o tratamento de MOTOR fica com pathways), `sepse.yaml` raiz, `registry.json`
- Migrações (2.7): 0010, 0014, 0022, 0025, `33909c9d8845`
- Catálogos/specs (2.8-2.10): `sepsis.yaml`, `domains/sepsis.md`, shards de disposição de sepse p1-p3, `docs/clinical/sepse-criteria-migration.md`, ADR-0031, ADR-0035
- Regras (3): cluster `sepse` (98/99) + regras `clinical-scoring` 001-012 (seção 4)
- Testes (2.12): sofa/qsofa/domain-sepsis/sepse-yaml-parity

### alert-threshold-engine
- Serviços (2.1): `alert_engine.py`, `alert_compiler.py`, `alert_copy.py`, `threshold_resolver.py`, `correlation_engine.py`, `domain_alertas.py`, `notification_worker.py`, `dashboard.py`, `patients.py`
- Models/schemas/api (2.2-2.4): alert, alert_definition_version, alert_routing, correlation_event, threshold_config; schemas alerts/alert_routing/severity/thresholds/dashboard/patients; api thresholds, v1 alerts/alert_routing/cds_hooks/dashboard; `api/patients.py`
- Migrações (2.7): 0009, 0013, 0019, 0024, 0026, 0027, 0028, 0038
- Catálogos/specs (2.8-2.10): `correlation-engine.yaml`, `domains/correlation-engine.md`, ambos os arquivos alert-catalog.md, shard de disposição `alertas`, ADR 0013, ADR 0014
- Regras (3): cluster `alertas` (26/29)
- Scripts (2.11): `build_alert_registry.py`, `check_vector_coverage.py`
- Achados de frontend (2.13): `BedGrid.tsx`, `AlertPanel.tsx`, `types/index.ts`
- Testes (2.12): alert-compiler/copy/engine/alerts/thresholds/threshold-resolver/correlation/severity-model/notification/dashboard/cds-hooks/alert-vectors/alert-storm

### pathways — 12 definições YAML + motor de trilhas
- Serviços (2.1): `trilhas_engine.py`, `trilhas_compiler.py`, `trilhas_evaluator.py`, `trilhas_definitions.py`, `trilhas_state.py`, `domain_trilhas_engine.py`, `pathway_enrollment.py`, `pathway_repository.py`, `pathway_auto_evaluation.py`, `pathway_definitions_sync.py`
- Models/schemas/api (2.2-2.4): `pathway.py`; `schemas/pathways.py`; `api/v1/pathways.py`
- Conteúdo (2.5): `pathway.schema.json`; revisão em nível de motor de todos os 12 YAMLs (o conteúdo clínico de `sepse.yaml` fica com sepsis-scores; o conteúdo clínico dos outros 11 YAMLs fica com os workstreams de domínio marcados em 2.5)
- Regras (3): cluster `trilhas-engine` (18)
- Specs (2.9-2.10): shard de disposição `trilhas-engine`; ADR 0020, 0021, ADR-0038
- Scripts (2.11): `validate_alerts.py`
- Testes (2.12): conjuntos trilhas/pathway

### kpi
- Serviços (2.1): `ppv_tracker.py`; `core/metrics.py` (2.4)
- API (2.4): `api/v1/indicators.py`
- Regras (3): cluster `indicadores-etl` (27)
- Specs (2.9): shard de disposição `indicadores-etl`
- Testes (2.12): ppv-tracker, indicators

### neuro-sedation-scores — GCS/RASS/dor/ARDS/FOIS/delirium/sedação
- Serviços (2.1): `domain_sedacao.py`, `domain_formularios.py`, `domain_pharmaco_delirium.py`
- Models/schemas/api (2.2-2.4): `clinical_form.py`, `sedacao.py`; schemas clinical_forms/clinical_forms_extended/sedacao; api clinical_forms, v1 formularios/sedacao
- Conteúdo de pathway (2.5): `pathways/delirium.yaml`, `pathways/sedacao.yaml` (conteúdo clínico)
- Catálogos/specs (2.8-2.10): `neuro-sedation.yaml`, `domains/neuro-sedation.md`, shards de disposição sedacao + formularios-clinicos, ADR 0015, 0029
- Regras (3): clusters `sedacao` (27), `formularios-clinicos` (43/45) + regras `clinical-scoring` 013-018 (GCS, RASS, escalas de dor, enum de ARDS, FOIS — seção 4)
- Achados de frontend (2.13): `ScoreDisplay.tsx`
- Testes (2.12): sedacao/delirium/pharmaco/clinical-forms/formularios
- NOTA (NL-2): o FOIS NÃO tem código em runtime; a população de revisão é apenas conteúdo de catálogo + planejamento.

### WAVE-1B (PROPOSAL) organ-support-and-medication-safety — precisa de um dono nomeado antes de poder abrir
- Serviços (2.1): `domain_aki.py`, `domain_electrolyte.py`, `domain_fluid_balance.py`, `domain_respiratory.py`, `domain_ventilacao.py`, `domain_hemo.py`, `domain_estabilidade.py`, `domain_antimicrobiano.py`, `domain_profilaxia.py`, `domain_prescricao.py`, `domain_eficiencia.py`, `drug_safety.py`, `drug_interactions.py`, `anvisa_drug_database.py`
- Models/schemas/api (2.2-2.4): models de antimicrobiano, medicação, prescrição, profilaxia, estabilidade; schemas correspondentes; api v1 antimicrobial/prescricao/prophylaxis/stability/ventilation/efficiency
- Conteúdo de pathway (2.5): conteúdo clínico de `antimicrobiano.yaml`, `desmame.yaml`, `equilibrio.yaml`, `estabilidade.yaml`, `nutricao.yaml`, `profilaxia.yaml`, `renal.yaml`, `respiratorio.yaml`, `ventilacao.yaml`
- Migrações (2.7): 0015, 0016, 0017, 0018
- Catálogos/specs (2.8-2.10): `aki.yaml`, `electrolyte.yaml`, `hemodynamics.yaml`, `respiratory.yaml`, `pharmaco-interaction.yaml` + seus quatro `domains/*.md`, shards de disposição correspondentes, ADR 0022, 0023, 0026, 0027
- Regras (3): clusters `balanco-hidrico` (62), `estabilidade` (26), `ventilacao` (26), `eficiencia` (12), `nutricao` (11), `profilaxia` (8), `equilibrio` (4), `antimicrobiano` (3), `prescricao` (41)
- Testes (2.12): conjunto de testes de domínio correspondente

### WAVE-1B (PROPOSAL) data-quality-and-physiological-calculation — precisa de um dono nomeado
- Serviços (2.1): `units_normalizer.py`, `gold_reader.py`, `gold_schema.py`, `gold_writer.py`
- API (2.4): `api/reference_ranges.py`
- Regras (3): cluster `sinais-vitais` (33)
- Specs (2.9, 2.11): `units-registry.md`, shard de disposição `sinais-vitais`, `scripts/verify_units.py`
- Testes (2.12): units-normalizer, gold-reader/schema/writer

### WAVE-1B (PROPOSAL) clinical-documentation-and-forms — precisa de um dono nomeado
- Serviços (2.1): `domain_evolucoes.py`
- Models/schemas/api (2.2-2.4): `evolucao.py`; `schemas/evolucoes.py`; `api/v1/evolucoes.py`
- Regras (3): cluster `evolucoes` (77)
- Specs (2.9-2.10): shards de disposição evolucoes, ADR 0028
- Testes (2.12): domain-evolucoes

## 4. A divisão do cluster clinical-scoring (em nível de regra, total)

| Regras | Conteúdo | Workstream |
|---|---|---|
| RULE-CLINICAL-SCORING-001 … 012 | SOFA total + seis subescores de órgão, razão P/F, derivação de MAP, entrada de idade, obtenção/montagem de entrada de SOFA | sepsis-scores |
| RULE-CLINICAL-SCORING-013 … 018 | Faixa válida de GCS, enumeração RASS, escala numérica de dor 0-10, escala comportamental de dor 3-12, enumeração de gravidade ARDS (SDRA), enumeração FOIS | neuro-sedation-scores |

O shard de disposição `clinical-scoring.yaml` é revisado por cada workstream
para suas próprias regras (o único artefato de dois leitores; cada regra
ainda tem exatamente um dono).

## 5. Registro de adiamento (explícito, com motivo — nada descartado silenciosamente)

| ID | Conjunto adiado | Motivo (INFERENCE, revisável) |
|---|---|---|
| DEF-1 | Clusters de regra não-clínicos: `auth-usuarios` (62/63), `auditoria-logs` (36), `tenancy-organizacao` (52), `cadastros-ui` (20), `operacional-infra` (59/62) + seus shards de disposição | Controle de acesso, auditoria, tenancy, registro de UI, infraestrutura — nenhuma lógica de avaliação de paciente ou de alerta. Reentra no escopo apenas se um workstream encontrar semântica clínica embutida (escalar para rodaquino-OMNI). |
| DEF-2 | Cluster `comunicacao` (45/46) + shards; `domain_comunicacao.py` | Mecânica de contador de mensageria/notificação. NOTA DE ADJACÊNCIA: a semântica de ENTREGA de alerta é coberta pelo alert-threshold-engine via `notification_worker.py`; apenas a mecânica de chat é adiada. |
| DEF-3 | Cluster `movimentacao-adt` (70) + shards; `domain_movimentacao.py`; model/schema/api de movimentacao; ADR 0025 | Mecânica de ADT/leito, não lógica clínica. NOTA DE ADJACÊNCIA: a atribuição de leito/unidade alimenta a exibição de gravidade no bed-grid (linhagem do hazard HAZ-0004 do ciclo-0); o alert-threshold-engine é dono da revisão de semântica de exibição e deve consumir esta nota. |
| DEF-4 | Cluster `documentacao-faturamento` (31/32) + `domain_documentacao.py` + model/schema/api de documentacao (faturamento); arquivos meta de `docs/rules/` + `extraction/` + `inventory/`; subárvores de processo `docs/plan/_work/`; ADRs não-clínicos; `docs/audit/`, `audit-results/`, `docs/regulatory/`, `docs/compliance/`, documentos de plano de design/produto/entrega | Artefatos de processo de faturamento e de extração/planejamento/auditoria — material de proveniência e referência, não lógica clínica a revisar. Retido como evidência; a política de importação ainda se aplica se algum dia usado. |
| DEF-5 | `docs/plan/clinical/hazard-log.md` | Artefato de safety case: pertence ao engenheiro de safety case clínico da V2 (dono do hazard-log), não a um workstream de conteúdo do ciclo-1. Registrado para não se perder. |
| DEF-6 | Serviços/testes de infra: `altb_trigger.py`, `arq_settings.py`, `kms_keys.py`, `mpi_resolver.py`, `patient_encryption.py`, arquivos de suporte de `patients.py`, superfícies de auth/api/transporte marcadas ADIADO no inventário 2.1-2.4, arquivos de teste de infra/segurança restantes (2.12), módulos de transporte (`mllp_listener.py`, `fhir/client.py`, clients) | Encanamento de infraestrutura, segurança, identidade e transporte sem conteúdo de regra clínica. NOTA DE ADJACÊNCIA: falhas de identidade de paciente (mpi) e de transporte de mensagem são tópicos de segurança para o hazard log da V2, não itens de revisão de conteúdo clínico. |

## 6. O que fecha este mapa

1. rodaquino-OMNI revisa as classificações (seção 3 do inventário) e estas
   atribuições; qualquer reclassificação move itens entre as seções 3 e 5 —
   a união permanece total por construção.
2. Os três workstreams WAVE-1B precisam de donos nomeados antes que seus
   89+11+9 itens possam ser revisados;
   até então esses itens estão ATRIBUÍDOS (não adiados) mas BLOQUEADOS por
   falta de pessoal.
3. NL-1 (seção 4 do inventário) limita toda revisão de regra aos arquivos
   extraídos; reverificação contra fontes upstream exige montar os dois
   repositórios upstream — uma decisão humana.
