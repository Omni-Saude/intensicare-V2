---
doc_id: LEGREV-INV
title: "Inventário de conteúdo clínico legado do ciclo-1 (enumeração autoritativa)"
status: PROPOSAL
label: OBSERVED (fatos de enumeração) com rótulos INFERENCE/PROPOSAL por item
owner: rodaquino-OMNI (revisor clínico responsável, GDEC-0003)
collector: catalogador de conteúdo clínico legado (ciclo 1, Tarefa 1)
source: https://github.com/Omni-Saude/intensicare @ 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79; docs/archive/legacy-provenance/legacy-pin-cycle-1.md
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: https://github.com/Omni-Saude/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD, re-verificado 2026-08-15)
  section_or_lines: enumeração do repositório inteiro; hashes por arquivo citados inline
  date_collected: 2026-08-15
  collector: catalogador de conteúdo clínico legado (ciclo 1, Tarefa 1)
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (enumerado, contado, hasheado,
    classificado; nenhum conteúdo de regra legado importado)
  confidence: alta (enumeração) / média (classificações)
  owner: rodaquino-OMNI (revisor clínico responsável, GDEC-0003)
  validation_status: VALIDATION REQUIRED
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git. Nomes de workstream (ews, sepsis-scores, alert-threshold-engine, pathways, kpi, neuro-sedation-scores, WAVE-1B *, DEFERRED), caminhos de arquivo, IDs de regra e hashes SHA-256 são identificadores literais e permanecem inalterados.

# Inventário de conteúdo clínico legado do ciclo-1

> **Propósito.** A enumeração autoritativa de TODO conteúdo clínico localizado no
> repositório legado V1 (`https://github.com/Omni-Saude/intensicare`, READ-ONLY, fixado no HEAD
> `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`, re-verificado em 2026-08-15), para que
> o ciclo 1 possa provar que 100% do conteúdo clínico da V1 localizado está ou
> atribuído a um workstream de revisão ou explicitamente adiado com motivo (ver
> `coverage-map.md`).
>
> **Rótulos.** Conforme `docs/00-governance/evidence-notation.md`: fatos de
> enumeração (arquivo existe, contagens, docstrings, saídas de gate) são
> **OBSERVED** por este agente em 2026-08-15. Toda classificação (clínico vs
> não clínico) e toda atribuição de workstream é **INFERENCE/PROPOSAL** e aguarda
> revisão por **rodaquino-OMNI** (revisor clínico nomeado, GDEC-0003). Nada aqui é
> DECIDED. Nenhum conteúdo de regra legado (limiares, faixas, predicados, texto de
> recomendação) é reproduzido além do mínimo necessário para identificar cada
> artefato.
>
> **Hashes.** Valores SHA-256 simples são copiados do manifesto de pin
> `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`. Valores com o sufixo
> **`(rt)`** são de arquivos **não presentes no manifesto de pin** e foram
> computados no momento da leitura em 2026-08-15 com `shasum -a 256` (conforme a
> própria regra de re-hash do manifesto). Os caminhos são relativos a
> `https://github.com/Omni-Saude/intensicare`.

## 0. Método (OBSERVED)

1. Re-verificado que o HEAD legado é igual ao SHA fixado (`git rev-parse HEAD`).
2. Enumerado todo ponto de partida conhecido a partir do pacote de tarefa e
   estendido por busca em largura: varreduras `grep`/`find` sobre o repositório
   inteiro por nomes de escore (NEWS2, MEWS, SOFA, qSOFA, RASS, Glasgow/GCS,
   CAM-ICU, BPS/NRS, FOIS, ARDS/SDRA), vocabulário clínico pt-BR (sepse, trilha,
   escala, gravidade, lactato, criterio), termos de limiar/severidade, e cargas
   de catálogo YAML.
3. Rerodado o gate de pathway legado (`python3 scripts/validate_alerts.py`,
   somente leitura) para verificar as contagens estruturais do ciclo-0 contra a
   realidade.
4. Reconciliado `docs/rules/catalog-index.json`, `docs/rules/README.md`,
   `docs/rules/INVENTORY.md`, e os arquivos de regra em disco.
5. Verificada a cobertura do manifesto de pin: todas as 1.317 entradas do
   manifesto resolvem em disco; todo conjunto de arquivos hasheado (services,
   models, schemas, api, `_work/alerts`, `docs/rules`, `core/metrics.py`,
   migração 0038) está completo com zero arquivos faltando.

## 1. Verificação das contagens do ciclo-0 (OBSERVED vs as alegações da avaliação)

O ciclo-0 conhecia esses números apenas a partir do documento de avaliação legada
(`docs/05-clinical-safety/pathway-portfolio/candidate-inventory.md` seção 1). Esta
passada verificou cada um contra o próprio repositório:

| # | Alegação do ciclo-0 (da avaliação) | OBSERVED 2026-08-15 | Veredito |
|---|---|---|---|
| 1 | 12 definições de pathway | 12 arquivos YAML em `_work/alerts/pathways/` (ids de pathway 1-12); o gate legado carrega todas as 12 | **CONFIRMED** |
| 2 | 118 unidades | `scripts/validate_alerts.py` Gate A: "118 unit(s) resolved in canonical registry" | **CONFIRMED** (unidade = todo campo `unit:` entre entradas de avaliação, predicados e sub-predicados) |
| 3 | 38 conjuntos de faixas | Gate B: "38 band set(s) partition their domains correctly"; o parse YAML independente também conta 38 blocos `bands` | **CONFIRMED** |
| 4 | 58 predicados | Gate B/compile: "58 predicate(s) compiled"; igual aos 58 critérios (um predicado de topo cada; 81 contando sub-predicados aninhados) | **CONFIRMED** |
| 5 | 2 registros de rationale | Gate C: "2 rationale(s) match rendered predicate" | **CONFIRMED** |
| 6 | 959 regras | **959 arquivos `RULE-*.md` em disco** entre os dez diretórios de categoria; `docs/rules/README.md` alega 959; **`catalog-index.json` indexa apenas 947** — os 12 arquivos listados na seção 1.1 abaixo estão em disco mas ausentes do índice (README: "12 post-sweep gap rules") | **CONFIRMED em disco; DISCREPÂNCIA de índice (947 vs 959)** |
| 7 | 27 clusters | 27 valores `cluster` distintos em `catalog-index.json`; o README lista os mesmos 27 | **CONFIRMED** |
| 8 | As nove YAMLs de domínio todas carecem de `alert_groups` | `docs/plan/_work/alerts/` contém exatamente 9 YAMLs de domínio; `grep -l alert_groups` corresponde a 0 de 9 | **CONFIRMED** |
| 9 | Registro de pathway (`registry.json`) | **DISCREPÂNCIA de expectativa:** `_work/alerts/registry.json` NÃO é um registro de 12 pathways. É um registro de ALERTA (`schema_version 1.0.0`, ADR-021) registrando **6 alertas de sepse** compilados do `_work/alerts/sepse.yaml` raiz. Nenhum arquivo de registro em nível de pathway existe; as 12 YAMLs de pathway são carregadas diretamente do diretório. | **CLARIFIED** |

Deltas README vs catalog-index por cluster (as 12 regras não indexadas): sepse 99
vs 98, auth-usuarios 63 vs 62, operacional-infra 62 vs 59, comunicacao 46 vs 45,
formularios-clinicos 45 vs 43, documentacao-faturamento 32 vs 31, alertas 29 vs
26.

### 1.1 As 12 regras em disco ausentes de catalog-index.json (OBSERVED)

`docs/rules/access-control/RULE-AUTH-USUARIOS-063-...`,
`docs/rules/alert-threshold/RULE-ALERTAS-027/028/029-...`,
`docs/rules/alert-threshold/RULE-COMUNICACAO-046-...`,
`docs/rules/data-validation/RULE-DOCUMENTACAO-FATURAMENTO-032-...`,
`docs/rules/data-validation/RULE-FORMULARIOS-CLINICOS-044/045-...`,
`docs/rules/data-validation/RULE-OPERACIONAL-INFRA-060/061-...`,
`docs/rules/scheduling-operational/RULE-OPERACIONAL-INFRA-062-...`,
`docs/rules/triage-eligibility/RULE-SEPSE-099-...`.
Todas as 12 estão hasheadas no manifesto de pin. Os workstreams de revisão devem
tratar o **conjunto de arquivos em disco (959)**, não o índice (947), como a
população.

## 2. Inventário de localização

Total de localizações de conteúdo clínico: **14 áreas** (2.1-2.14). Todo arquivo
nomeado carrega seu SHA-256.

### 2.1 Serviços de escore/domínio — `src/intensicare/services/` (63 arquivos, todos no manifesto de pin)

| Arquivo | Conteúdo (OBSERVED a partir da docstring do módulo) | Classificação (INFERENCE) | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|---|
| `src/intensicare/services/__init__.py` | marcador de pacote (apenas docstring) | não clínico — sem lógica | DEFERRED | `b90d03862a075d619c5d3dbba776b800df2b8ef0473f81b9d0b4d69ebf82483d` |
| `src/intensicare/services/alert_compiler.py` | compilador declarativo de definição de alerta com gates de build A/B/C sobre `_work/alerts/*.yaml` | clinicamente substantivo | alert-threshold-engine | `a3d2223155e817d7463d4cefed29da98a9ca994d464f3fdb53cec117417b8a8a` |
| `src/intensicare/services/alert_copy.py` | copy clínico humanizado em pt-BR para títulos/corpos de alerta | clinicamente substantivo — a redação clínica é conteúdo | alert-threshold-engine | `5eec634394d5d146eb26849bcd63d91631197385b1764eed9434bf024f3da158` |
| `src/intensicare/services/alert_engine.py` | checa escores clínicos contra limiares e cria alertas | clinicamente substantivo | alert-threshold-engine | `80980e3966626480a95af4ebe4ba379794dd4b74eaa99fb455923c2530df20ee` |
| `src/intensicare/services/altb_trigger.py` | instrumentação de latência p95 disparando uma recomendação operacional | não clínico — instrumentação operacional | DEFERRED | `7bcde809fab96bd09f57061df37d1715ae4b40ccea772d1a6fa0b66d1396f3e1` |
| `src/intensicare/services/anvisa_drug_database.py` | stub de integração com base de dados de medicamentos ANVISA | clinicamente substantivo — stub, ainda assim nomeia semântica de medicamento | WAVE-1B organ-support-and-medication-safety | `158d465e46619339503573254e579a07b8a7630f19cb69891424de859eae5ac9` |
| `src/intensicare/services/arq_settings.py` | configuração de worker ARQ/Redis | não clínico — infra | DEFERRED | `08f40e5c128781207643e6dd7c38ef4fbdfc729cbbf55b2cf8828fa8681c3445` |
| `src/intensicare/services/correlation_engine.py` | motor de correlação de alerta entre domínios (carrega correlation-engine.yaml) | clinicamente substantivo | alert-threshold-engine | `80001a3664c84b746aa43068864a3dd1f01c2aee9e01d13c4dfa1f276ab8bb96` |
| `src/intensicare/services/dashboard.py` | agrega dados de paciente incl. severidade para o dashboard bed-grid | clínico-adjacente — semântica de rollup de severidade | alert-threshold-engine | `ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489` |
| `src/intensicare/services/deterioration_trend.py` | projeção determinística de tendência de deterioração (estimativa de lead-time) | clinicamente substantivo | ews | `61d80a379459f4769d5bf3ab14813f6985a0d00f038f349877d6382b85080870` |
| `src/intensicare/services/domain_aki.py` | domínio de AKI, avaliador micro-batch de estadiamento KDIGO 2012 (carrega aki.yaml) | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `82284ef37a681baca80daab55d00f65f8ba5b1a8e58edb2423954503bfb66e09` |
| `src/intensicare/services/domain_alertas.py` | runner de regras do cluster ALERTAS (UNVERIFIABLE RATIFY) | clinicamente substantivo | alert-threshold-engine | `122806b0dc39da514952f152bdfcf8fa296a7e684f41607fb2620dfd95baabb9` |
| `src/intensicare/services/domain_antimicrobiano.py` | catálogo de critérios de stewardship antimicrobiano + avaliação | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `d6d0e02f42a8a0bd412adffcaa3f4d13fb6688f3c1092ef114c445a5cab1e858` |
| `src/intensicare/services/domain_comunicacao.py` | runner de regras do cluster COMUNICACAO | não clínico — mecânica de mensageria | DEFERRED | `249f6612ab3c5edde23eb6773010945e8b98fc84756ac3f94ca84f9b4b8c7f5b` |
| `src/intensicare/services/domain_documentacao.py` | motor de documentação/faturamento Glosa Zero, 16 critérios | não clínico — faturamento | DEFERRED | `d543d55e6db949b6e4ccf5f06a237bafbc2a1f2fbd756166bd435a97e2b3e30f` |
| `src/intensicare/services/domain_eficiencia.py` | domínio de eficiência e stewardship, 12 critérios de adequação de transfusão | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `c9f779e3ef88ee0b807092b6ecc5c2784dafa3fd17cb5b9e7237254b011b5128` |
| `src/intensicare/services/domain_electrolyte.py` | avaliador micro-batch do domínio de eletrólitos (carrega electrolyte.yaml) | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `ffdd4f931c7b37c7e55079ad1dac2c4685bc4318566c2ccf646ea1175a4fc5cc` |
| `src/intensicare/services/domain_estabilidade.py` | domínio de estabilidade hemodinâmica, avaliador de 27 critérios envolvendo domain_hemo | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `2c838c4fbb5c368b1e8a1d5a4c8d4b0b22d6458079a3198ca1a0f69ba2b0f7b8` |
| `src/intensicare/services/domain_evolucoes.py` | domínio de notas clínicas/evolução, templates SBAR, 14 templates por papel | clinicamente substantivo | WAVE-1B clinical-documentation-and-forms | `d9eafc17a26cade0b7dc5c185c52d2fd3586048d8d1a9950a982109b8c2e4a6c` |
| `src/intensicare/services/domain_fluid_balance.py` | domínio de balanço hídrico (regras P1 ratificadas WAVE 2B) | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `1f7ac65c87da67ce0fee5d8953d1b8a3c3da9aba1c7f0c6f44c30521fb36b43b` |
| `src/intensicare/services/domain_formularios.py` | motor de scoring de formulários clínicos: SOFA, RASS, CAM-ICU, Glasgow, BPS/NRS | clinicamente substantivo — conteúdo de SOFA cruzado por sepsis-scores | neuro-sedation-scores | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` |
| `src/intensicare/services/domain_hemo.py` | avaliador híbrido NRT+micro-batch do domínio de hemodinâmica (carrega hemodynamics.yaml) | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `163357983e65e12dd4df643b97e3ad0e1e1310d57914fdaef14ddd6b6918dc04` |
| `src/intensicare/services/domain_movimentacao.py` | runner de regras do cluster MOVIMENTACAO-ADT | não clínico — mecânica de ADT; leito/unidade alimenta exibição (ver coverage-map DEF-3) | DEFERRED | `0391134b1fec054c39d6d3613db36396e17bfe4e35bf52706dfc561f227c1a5d` |
| `src/intensicare/services/domain_operacional.py` | runner de regras do cluster OPERACIONAL | não clínico — ops de infra | DEFERRED | `b0a3d04086a8a07c7a5fdec957232a40a52b9eab0e6b5276cf68f955dc3ff2ce` |
| `src/intensicare/services/domain_pharmaco_delirium.py` | runners micro-batch para os catálogos pharmaco-interaction.yaml e neuro-sedation.yaml | clinicamente substantivo — catálogo de farmacologia cruzado pelo wave-1b OSMS | neuro-sedation-scores | `f6c48a1d9545d66da3a744e0087b090f3648cfe3eb8d6a817f164138f2d9a401` |
| `src/intensicare/services/domain_piora_clinica.py` | domínio de deterioração clínica, scoring multi-domínio (13 regras) | clinicamente substantivo | ews | `ca8cbe35c00a8390a2d963ca5af9f235f0f454bf87c406cb5646d27d04221994` |
| `src/intensicare/services/domain_prescricao.py` | domínio de prescrição: máquina de estados, interação medicamentosa, calculadora de dose | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `31bb4dae220f129a9f56a27fa006adc0e507aae17d43487abba955f1e6c211de` |
| `src/intensicare/services/domain_profilaxia.py` | domínio de bundles de profilaxia (5 bundles de UTI) | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `de349e49f84dedf68a08cdaef4ec7fc488ad9e69184149dc7e24bb3816eaf921` |
| `src/intensicare/services/domain_respiratory.py` | avaliador do domínio respiratório incl. estadiamento SDRA de Berlim, faixas S/F e P/F | clinicamente substantivo — conteúdo de estadiamento SDRA cruzado por neuro-sedation-scores | WAVE-1B organ-support-and-medication-safety | `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` |
| `src/intensicare/services/domain_sedacao.py` | domínio de sedação: avaliações de RASS, BPS/NRS, CAM-ICU | clinicamente substantivo | neuro-sedation-scores | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` |
| `src/intensicare/services/domain_sepsis.py` | domínio de sepse: híbrido NRT+micro-batch, SIRS, temporizadores de bundle SSC-2021, stewardship PCT | clinicamente substantivo | sepsis-scores | `853d2e38a8167d28e7eb242872e871024abe00b4868fc22f7c02502f99d3ccf8` |
| `src/intensicare/services/domain_tenancy.py` | runner de regras do cluster TENANCY-ORGANIZACAO | não clínico — multi-tenancy | DEFERRED | `e9c766fbec622f079fcb84a32f562a47f844c42dff19b2c31ca4f54dcd032ced` |
| `src/intensicare/services/domain_trilhas_engine.py` | wrapper fino de retrocompatibilidade sobre o engine de trilhas | clinicamente substantivo | pathways | `6dca0013e99a6db21bf92303062bf033c40314a0c79c999896eea3aa04cadd56` |
| `src/intensicare/services/domain_ventilacao.py` | serviço de domínio de monitoramento de ventilação | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `ecd0a99fbf38aeaf4195cc60f75939b4fe18d96c13fd3eda2a8ae945f3422a1c` |
| `src/intensicare/services/drug_interactions.py` | base de conhecimento de interação medicamentosa e lógica de detecção | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `199afda58f6131dc57e985bc90120e0205ace1cf5fc94b40051d38a09ff08ed8` |
| `src/intensicare/services/drug_safety.py` | faixas de segurança de medicamentos, utilitários de conversão de dose, lógica de validação | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `f4197af10f451fd20f2a2320ca7a25baedc88202fd9458670faa567d2ad2bbb7` |
| `src/intensicare/services/ews_nrt_runner.py` | computação e alerting orientados a evento de escore de early-warning | clinicamente substantivo | ews | `9ad826e9e31be584a17285a721697243e8654d9209ca68b9abec1230ed3c7fe6` |
| `src/intensicare/services/gold_reader.py` | poller incremental da camada Gold do Athena (high-watermark, backpressure) | clínico-adjacente — carrega semântica de feed de lab/vitais | WAVE-1B data-quality-and-physiological-calculation | `c8eeddbe8b32974654b020d107a6c20a291ed142b7820a3480726a9c742ae9c7` |
| `src/intensicare/services/gold_schema.py` | schemas e templates SQL para tabelas da camada semântica Gold | clínico-adjacente | WAVE-1B data-quality-and-physiological-calculation | `3776fb674505079ab50e40da7a3fbe55bb0f85a8ce0f6928c0a493e0ee313740` |
| `src/intensicare/services/gold_writer.py` | write-back unidirecional para tabelas da camada Gold | clínico-adjacente | WAVE-1B data-quality-and-physiological-calculation | `c67edf33cd86147b3eaaff3abc88ba61a3b840653f59d2d7bee394313c42692f` |
| `src/intensicare/services/kms_keys.py` | hierarquia de chaves KMS por tenant para DEKs do pgcrypto | não clínico — infra de segurança | DEFERRED | `37c1e581bba4942729295d860fad7f3642eae9bccb455a1641c3d24665829a3c` |
| `src/intensicare/services/mews.py` | motor de scoring determinístico e versionado do MEWS | clinicamente substantivo | ews | `43f7a8e17a31ea21f61ec53b2bcee68ff64067387c687e23714382f4737e922c` |
| `src/intensicare/services/mpi_resolver.py` | resolvedor de MPI, sincronização de patient_cache com flush na alta | não clínico — encanamento de identidade; risco de identificação incorreta é um tópico de segurança, não conteúdo clínico | DEFERRED | `502f3902fa41ef7af721a7f9aea5da75b3b3b1496a468c8e31d2816034c4a60c` |
| `src/intensicare/services/news2.py` | motor de scoring do NEWS2 | clinicamente substantivo | ews | `d3399fe2bb9853222dde6b16167a4f6093c6daac7b1559474b628deeff246bc8` |
| `src/intensicare/services/notification_worker.py` | worker assíncrono ARQ de entrega de alerta com retry, DLQ, dedup | clínico-adjacente — a semântica de entrega afeta a segurança do alerta | alert-threshold-engine | `0b8d7293e23b476399f30b59192536ed8fa156bac7ecc95a48ca73de887e0976` |
| `src/intensicare/services/pathway_auto_evaluation.py` | liga a ingestão de vitais à avaliação de pathway; documenta os tipos de predicado embarcados nas YAMLs de pathway | clinicamente substantivo | pathways | `c23a7b427f224c910cd8f234ed7fe6bf0e2e854b521550b04122301e3c71028d` |
| `src/intensicare/services/pathway_definitions_sync.py` | sincronização no boot das definições de pathway YAML compiladas para o Postgres | clinicamente substantivo | pathways | `220b8bff114d043aeb5cd7bca7a7db3d7c514430dff0ef3271de70078ccd72d3` |
| `src/intensicare/services/pathway_enrollment.py` | serviço de matrícula/avaliação de pathway (apoiado em Postgres) | clinicamente substantivo | pathways | `ce54b79adc34936467466db488589051a0809428e6a3a5f08fcdd3bbc59f7d0c` |
| `src/intensicare/services/pathway_repository.py` | DAO de persistência de pathway | clinicamente substantivo | pathways | `ebca92edf5bb5d1c3d0cc7bb1ce71aeae696e9d11c478c3ec74e098efd7ebe1f` |
| `src/intensicare/services/patient_encryption.py` | criptografia/decriptografia de PHI via pgcrypto | não clínico — infra de segurança | DEFERRED | `ecece25cfbb540e8e0dee226d259dd9e550cc3ba0296facc3121e90b7debafdb` |
| `src/intensicare/services/patients.py` | serviço de consulta de status de paciente (estado agregado) | clínico-adjacente — apresentação de status/severidade | alert-threshold-engine | `f0515a1ac22183606214e88f1180052a41f3ac58da54609349811b8a8c0cc947` |
| `src/intensicare/services/ppv_tracker.py` | instrumentação de valor-preditivo-positivo de alerta (WO-036) | clinicamente substantivo | kpi | `da66f4aa946278618fb42684c1644feb4871e262fc742f96023d0992b1116783` |
| `src/intensicare/services/qsofa.py` | motor de scoring do qSOFA | clinicamente substantivo | sepsis-scores | `48b69f39f7b789c5f12f005931c9d02cc9b8da562c9aecee804d594530bab8ce` |
| `src/intensicare/services/sepsis_input_provider.py` | provider de entrada computada de sepse pré-computando entradas relativas para sepse.yaml v4 | clinicamente substantivo | sepsis-scores | `650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb` |
| `src/intensicare/services/sofa.py` | motor de scoring do SOFA | clinicamente substantivo | sepsis-scores | `731b3507cc07b2d5318f4759229527d2eac1f45b62eba269168d43560739b84a` |
| `src/intensicare/services/threshold_resolver.py` | resolvedor de limiar de 3 escopos: leito sobre unidade sobre tenant | clinicamente substantivo | alert-threshold-engine | `0b02d8ace9bdc89695eeaa2e08d81b2a72070c27624265190b2005883c20ee6f` |
| `src/intensicare/services/trilhas_compiler.py` | compilador de predicado seguro baseado em AST para YAML de pathway | clinicamente substantivo | pathways | `a2ef8717276699bd013ede8eac5d1dc618607e72b76e664c09525ca6c54f4734` |
| `src/intensicare/services/trilhas_definitions.py` | definições seed de pathway e funções de catálogo | clinicamente substantivo | pathways | `3425e844fbec012a67a60779ca30fd5af0b8d1c517051684ae5f5a1ebe2baabe` |
| `src/intensicare/services/trilhas_engine.py` | motor de regras declarativo sem estado para pathways de cuidado | clinicamente substantivo | pathways | `6c45cb65514c7d6b0c99cb150936f76f337e91a7ecab59d27ad71adc819aaab2` |
| `src/intensicare/services/trilhas_evaluator.py` | loop de avaliação sem estado para o engine de trilhas | clinicamente substantivo | pathways | `33db93cf4e3f7b6483ead7fb8a643261700277a5bd7ae1c2f9746f1fa1a9a154` |
| `src/intensicare/services/trilhas_state.py` | máquina de estados de pathway e lógica de transição | clinicamente substantivo | pathways | `1edd099ae2bf3ecdccdf4959c0feb73355095e2b1137f65f4e19bd56cd00290b` |
| `src/intensicare/services/units_normalizer.py` | valida e normaliza unidades de medição clínica | clinicamente substantivo | WAVE-1B data-quality-and-physiological-calculation | `1f95ec99c03f4d1e17548fb33e2f4d08431f1801b050765d77d6fa3bcc0f80c4` |
| `src/intensicare/services/vitals.py` | ingestão de sinal vital com idempotência mais scoring MEWS+NEWS2 | clinicamente substantivo | ews | `dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64` |

### 2.2 Models — `src/intensicare/models/` (27 arquivos, todos no manifesto de pin)

| Arquivo | Conteúdo (OBSERVED a partir da docstring do módulo) | Classificação (INFERENCE) | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|---|
| `src/intensicare/models/__init__.py` | marcador de pacote | não clínico | DEFERRED | `cfc68a90016ae04839a33524f26e166a7febf639db93f4c42f916629db8d0b65` |
| `src/intensicare/models/alert.py` | hypertable de alertas clínicos | clinicamente substantivo | alert-threshold-engine | `c86cde30ad675cde0cddd632a3a74f40c4d95bab013fd0abeb51880a8aff2f88` |
| `src/intensicare/models/alert_definition_version.py` | referência imutável e versionada de definição de alerta | clinicamente substantivo | alert-threshold-engine | `6eeb4024842c4e2332bb643cc048b0a69759664a2d3e9a49982de2a3d63588f7` |
| `src/intensicare/models/alert_routing.py` | regras de roteamento de alerta (condições/ações em JSONB) | clinicamente substantivo | alert-threshold-engine | `5cc4e450157b618bec5f7cc9473f5b311bd8f327cb8d06a5c7fbff45bb00afb1` |
| `src/intensicare/models/algorithm_registry.py` | registro imutável de versões de algoritmo clínico | clinicamente substantivo — versiona os quatro escores; cruzado por sepsis-scores | ews | `2a7ff1e52ce5d28259e06b705df2485e15353fad82812cded1af878546966e5e` |
| `src/intensicare/models/antimicrobial.py` | persistência de avaliação antimicrobiana | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `543b696f311da4adfd91c1c5043da659efab7c3fc50559492c6c88f0288231b2` |
| `src/intensicare/models/audit_trail.py` | hypertable imutável de trilha de auditoria | não clínico — infra de auditoria | DEFERRED | `02f3d2ba18d5155637eb3edab4a85ede1d90f86a5591000ee2f319012878a538` |
| `src/intensicare/models/clinical_form.py` | definições e submissões de formulário clínico | clinicamente substantivo | neuro-sedation-scores | `32daff3d59aa0e0a74945532ba7611f41cf9f0a760d3c04644baaa7fda827918` |
| `src/intensicare/models/clinical_score.py` | hypertable de escores clínicos | clinicamente substantivo — persiste todos os escores; cruzado por sepsis-scores | ews | `fc987ad0d037b1f153451240178dc12ab988a1104d7bc4a88dc460972234ff43` |
| `src/intensicare/models/correlation_event.py` | eventos de associação de alerta correlacionado | clinicamente substantivo | alert-threshold-engine | `ef93899feeede67132e45ea7c7670045fc0044ab53be14a612b60c794db07385` |
| `src/intensicare/models/deterioration.py` | modelo de deterioração clínica | clinicamente substantivo | ews | `36934798b1c26526c9cc4759b6d58221bb0329a0cb1be2f4f83cea489d5bdb27` |
| `src/intensicare/models/documentacao.py` | documentação clínica e rastreamento de glosa (faturamento) | não clínico — faturamento | DEFERRED | `292c1e4c0cf1f45930edd31c4efd7e9565c299d21d98c87af4e25e4ff13140fe` |
| `src/intensicare/models/evolucao.py` | modelos de notas clínicas (evolucoes) | clinicamente substantivo | WAVE-1B clinical-documentation-and-forms | `2f13fb10f552e7371dffd99fd07a31639fb49b187eb65ef1c138ea2cec1f0a1a` |
| `src/intensicare/models/lab_result.py` | hypertable de resultados laboratoriais | clinicamente substantivo — labs alimentam SOFA/lactato/PCT; cruzado pelo wave-1b OSMS | sepsis-scores | `218c8be98d6d6a3acb213afd235cfb8aff622f88f0a8cf2dcbe42a3f9899de1c` |
| `src/intensicare/models/medication.py` | prescrições e administrações de medicação | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `88ed99a3cfdd6935526f2f794f6b1bc0713f62a3e6ab3abfdce9dfc2c1e6cab2` |
| `src/intensicare/models/movimentacao.py` | movimentações de paciente, leitos, episódios de admissão (ADT) | não clínico — ver coverage-map DEF-3 | DEFERRED | `40e38e1f97d5b5b7218af72684ac2aaa595bae51b5526a1fe9e0246a2a1d93ab` |
| `src/intensicare/models/pathway.py` | modelos de pathway de cuidado (trilhas) | clinicamente substantivo | pathways | `c22bbf1cee440699065783c6be1beff51b97f948fe2bd52478c88d5205302a1f` |
| `src/intensicare/models/patient_cache.py` | cache local de demografia de paciente | não clínico — encanamento | DEFERRED | `9a1f8cd2028162e625a410a53ebd9f281570e7ca35db997452f76bb7db70ad94` |
| `src/intensicare/models/prescricao.py` | modelos do sistema de prescrição | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `f186fe95321270c06cea9b30c159c0ffa6f0539032b55cca6d6c8aa467de7e87` |
| `src/intensicare/models/prophylaxis.py` | avaliações de bundle de profilaxia | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `ce9d805dfcad2de9829194f7046980a1ca7f4954c4248cbc042210eea97d8c32` |
| `src/intensicare/models/ratification_event.py` | histórico de ratificação de algoritmo clínico | clinicamente substantivo — carreador de governança para todos os escores | ews | `27ded22fc2f58c285cdbd3f949d5da1a4c98894794a52dbe9c65fa049fce2c4c` |
| `src/intensicare/models/registry.py` | registro organizacional Empresa/Estabelecimento/Setor | não clínico — tenancy | DEFERRED | `ae9bf59338ce2f93ff383e1c6515553f4a5fa2a725a87a58ec24407b88cbea02` |
| `src/intensicare/models/sedacao.py` | modelo de monitoramento de sedação | clinicamente substantivo | neuro-sedation-scores | `b790b4b0e7be1550f7b5276a9ec8f1504b056b7db8f668a063f79913dd419c8b` |
| `src/intensicare/models/stability.py` | modelo de estabilidade hemodinâmica | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `a2a532b1b7933a3fd9a81bb472f07d9bd08efdd47f684ff4a3cda5c592b689d3` |
| `src/intensicare/models/threshold_config.py` | configuração de limiar de alerta por tenant/unidade/leito | clinicamente substantivo | alert-threshold-engine | `8c93cadddeacd7d6cce3f34e2ed0718410ab037ce15050279ad4af5baccecbbc` |
| `src/intensicare/models/user.py` | modelo de usuário/auth | não clínico | DEFERRED | `f00ea1fe900e078e1ca08aa51381a25e77dacf6be5828d24f519b7f15af581e0` |
| `src/intensicare/models/vital_sign.py` | hypertable de sinais vitais | clinicamente substantivo | ews | `4a145e9b4135fd943043d96c5efe3a3981f84053f78710b0f6fe66bd126d4a12` |

### 2.3 Schemas — `src/intensicare/schemas/` (21 arquivos, todos no manifesto de pin)

| Arquivo | Conteúdo (OBSERVED a partir da docstring do módulo) | Classificação (INFERENCE) | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|---|
| `src/intensicare/schemas/__init__.py` | marcador de pacote | não clínico | DEFERRED | `5e3bb4312bc4cb753367efd00aade3063bc530c4801b77872d9b37f4a041cb3a` |
| `src/intensicare/schemas/alert_routing.py` | schemas de API de roteamento de alerta | clinicamente substantivo | alert-threshold-engine | `c25440b15656dfc1ab2d1a451f809172f73f2b11e981ec0a9585223b7f3c9a05` |
| `src/intensicare/schemas/alerts.py` | schemas de resposta de alerta e agregação por sinal (ADR-0039) | clinicamente substantivo | alert-threshold-engine | `c23243f811fdd81c004f219e84f8c3154b4f73444dab149376ffb023854bd309` |
| `src/intensicare/schemas/antimicrobial.py` | schemas de API de stewardship antimicrobiano | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `24dbbbbb7d3836f4ed7cde6bc3b50a6ada279086ae6247fabc1bcc9cee83377a` |
| `src/intensicare/schemas/clinical_forms.py` | schemas de submissão de formulário clínico (RASS, CAM-ICU, BPS/NRS) | clinicamente substantivo | neuro-sedation-scores | `84c12c3de5525d70d7141c5ec8f883eb84f4dfaccff3020ce37bdc4a03e87fb0` |
| `src/intensicare/schemas/clinical_forms_extended.py` | schemas de definição/submissão de formulário | clinicamente substantivo | neuro-sedation-scores | `b91cb4447393c673f33b781e8a62214d30580885eb4f4ac6c7b45529d44d9362` |
| `src/intensicare/schemas/dashboard.py` | schemas do dashboard clínico | clínico-adjacente | alert-threshold-engine | `e3313341c18719efb9d43e4ffb8b669389cbc3939d65ec46274b2d002b686723` |
| `src/intensicare/schemas/deterioration.py` | schemas de API de deterioração clínica | clinicamente substantivo | ews | `0f9a7be4cb3f74ae2c9cec5630e01519b70c6c2e5cbb98c3e964b2c16a30fb58` |
| `src/intensicare/schemas/documentacao.py` | schemas de API de documentação/faturamento | não clínico — faturamento | DEFERRED | `902f0273b2f8b7e2f6918d82d0ce9aa870770eb7e7cecbb23e3b3f457bc1d56f` |
| `src/intensicare/schemas/evolucoes.py` | schemas de API de notas clínicas | clinicamente substantivo | WAVE-1B clinical-documentation-and-forms | `9e5d46c9dd3af34d7b561f11b4e82c6ba76cb2b3e2edc4538699afa7aa0b9f3c` |
| `src/intensicare/schemas/movimentacao.py` | schemas de API de ADT | não clínico | DEFERRED | `87f7606c9390e47d27db43a0ba0da5f586079bcfb5da34acf7b3dab1eff5021a` |
| `src/intensicare/schemas/pathways.py` | schemas de API de pathways de cuidado | clinicamente substantivo | pathways | `5d7a6a430cc5820082a92f2219232a88f4ea502b75cd52c13213796216aebcee` |
| `src/intensicare/schemas/patients.py` | schemas de status de paciente | clínico-adjacente | alert-threshold-engine | `36ec8a0da14d466ebb9509be1e39d3904fab8aab139bf762b238ff2503b595fd` |
| `src/intensicare/schemas/prescricao.py` | schemas de API de prescrição | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `d429742f59d5fe801471298796e2a0d1f8c5fe7335aee4ddb9340d00f4cfa0c5` |
| `src/intensicare/schemas/prophylaxis.py` | schemas de API de bundles de profilaxia | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `d99465de24233e1f5bf1b1d3fd5c5987e6b412ffa0f35edf3d848634a459d791` |
| `src/intensicare/schemas/registry.py` | schemas de API de registro/admin | não clínico | DEFERRED | `6fc7a42de9b4796dbc243ef2e4d63e0a2bdfa3bb04585787d7cb473ba42d9683` |
| `src/intensicare/schemas/sedacao.py` | schemas de API de monitoramento de sedação | clinicamente substantivo | neuro-sedation-scores | `bd432d9a5b4144380eaed1c6518b10465612c95d9d7e33468053114e0e44992d` |
| `src/intensicare/schemas/severity.py` | modelo de severidade canônico: normal < watch < urgent < critical, maior-severidade-vence | clinicamente substantivo | alert-threshold-engine | `9f383ab935f3e90e796e81473d158354736c95d0550ad0f2020ee0d8a4a4066f` |
| `src/intensicare/schemas/stability.py` | schemas de API de estabilidade hemodinâmica | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `e59649a3a27845b970c2f96957c1e4f976056007e41e9ed134ab435f65f383f8` |
| `src/intensicare/schemas/thresholds.py` | schemas de configuração de limiar | clinicamente substantivo | alert-threshold-engine | `d6804247eed80d90f8f0ca7b2e3af77ef7f1b61c79ec3bdc93dd4ec729ebb9ea` |
| `src/intensicare/schemas/vitals.py` | schemas de ingestão de sinal vital | clinicamente substantivo | ews | `f6afffd444038f2d1dec19d7047a0013f908d9a7106c52ce9895cbc1ba14308f` |

### 2.4 Superfícies clínicas de API — `src/intensicare/api/` (31 arquivos) e `core/metrics.py`

| Arquivo | Conteúdo (OBSERVED a partir da docstring do módulo) | Classificação (INFERENCE) | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|---|
| `src/intensicare/api/__init__.py` | marcador de pacote | não clínico | DEFERRED | `740c92ab55b79c078b0b6c9005c073b84773121c6e0c98f0c2c495c8f759bb03` |
| `src/intensicare/api/clinical_forms.py` | API de formulários clínicos (instrumentos pontuados) | clinicamente substantivo | neuro-sedation-scores | `8cdf3e5f21a9ef140fb7da8e38fe98d3544fc0f24a363c3b466f78f871d98755` |
| `src/intensicare/api/patients.py` | API de status de paciente | clínico-adjacente | alert-threshold-engine | `23c2df6d205a7a6f77e8a4a13fe255f1c4c3c67374f9c614ca32512abd18ce88` |
| `src/intensicare/api/reference_ranges.py` | API de faixas de referência vital/laboratorial | clinicamente substantivo | WAVE-1B data-quality-and-physiological-calculation | `79a7f055c8d33b4f8d0f2866bd136af0cbbe389bae079736b5f133c511605acc` |
| `src/intensicare/api/thresholds.py` | API de configuração de limiar | clinicamente substantivo | alert-threshold-engine | `d75b31f6dc474ae0d8c995dbf5adde9fdefb5fb9a3fa191652789d37e5f23a28` |
| `src/intensicare/api/vitals.py` | API de ingestão de vitais | clinicamente substantivo | ews | `5684fd24b31f93a4ed240964311cc82e17297bdef76cf4b1cc7b1d0b76b9a7c3` |
| `src/intensicare/api/v1/__init__.py` | marcador de pacote | não clínico | DEFERRED | `43d5a98999315ef1fc7ec564b906d50416979dcdcaaa4b0a8abe688643dba490` |
| `src/intensicare/api/v1/admin.py` | API de admin de tenant | não clínico | DEFERRED | `487244a585ae34a5363702ba93d66d164333250e5e65a8113d87063d11552608` |
| `src/intensicare/api/v1/alert_routing.py` | API de roteamento de alerta | clinicamente substantivo | alert-threshold-engine | `d95aa450b348069556e5bc2af91c498822716939d5b6e0a1d6e4b03c59244e30` |
| `src/intensicare/api/v1/alerts.py` | API de alertas | clinicamente substantivo | alert-threshold-engine | `46d6b5042ac6acb76bfe01068f614e87a5c3bd7ececa4e3123ea8c2b35a3c939` |
| `src/intensicare/api/v1/antimicrobial.py` | API de stewardship antimicrobiano | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `3038aa9c5a411e6491e6cc97458fcb00cf2722082e84400a3bff207d80c52d5d` |
| `src/intensicare/api/v1/auth.py` | API de autenticação | não clínico | DEFERRED | `c7e85fb38565071674b310aed338ef0871858dcf229e72b44d086b19cbaa3598` |
| `src/intensicare/api/v1/cds_hooks.py` | superfície de integração CDS Hooks | clinicamente substantivo — entrega de suporte à decisão | alert-threshold-engine | `22533068f7dfa3b5d06741fa5d66226773c8360fea3bc5ccbb8de8703fd1da73` |
| `src/intensicare/api/v1/dashboard.py` | API do dashboard bed-grid | clínico-adjacente | alert-threshold-engine | `dae65e2d6b8224d7b4d5802c6f20262f90215f2a69e0e59bbacc6ae01a644a6f` |
| `src/intensicare/api/v1/deterioration.py` | API de deterioração clínica | clinicamente substantivo | ews | `6a0c3bd1a14947f203be56bd0d2a678ab4d7870730f43816ab18c678154ce7f7` |
| `src/intensicare/api/v1/documentacao.py` | API de documentação/faturamento | não clínico — faturamento | DEFERRED | `e3c26419b90ff8d4c4ae7271ff1ad87105cd0076066d8d43e9caffd4e75a2a18` |
| `src/intensicare/api/v1/efficiency.py` | API de eficiência/adequação de transfusão | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `530a04f6bfc5ec539548c5de52e9b0609dc8e20743ecec958101ea6a23783559` |
| `src/intensicare/api/v1/events.py` | API de fluxo de eventos | não clínico — transporte | DEFERRED | `ecf8e01cdca74366295908f2a9dbb9ce48d1e583da98266a1b57aea86163755b` |
| `src/intensicare/api/v1/evolucoes.py` | API de notas clínicas | clinicamente substantivo | WAVE-1B clinical-documentation-and-forms | `44edf7ffbde4037a9daff5cc69a10a7e34833052626e764597545ce196b0ef96` |
| `src/intensicare/api/v1/formularios.py` | API de formulários clínicos (superfície pt-BR) | clinicamente substantivo | neuro-sedation-scores | `937e64dfe5369bc8e1c0f436135abd256d0eb1091da264bfd585fe7bf6e90929` |
| `src/intensicare/api/v1/health.py` | health checks | não clínico | DEFERRED | `1496f670ff9b4e746a36b03420ab793ee988793e5ea5a70eb97b96d403f0f54a` |
| `src/intensicare/api/v1/indicators.py` | API de indicadores clínicos/KPI | clinicamente substantivo | kpi | `dc54ca40408ec2a90d37bb412ea5e09c5889c1490abf4c479b57fde134f2d597` |
| `src/intensicare/api/v1/movimentacao.py` | API de ADT | não clínico | DEFERRED | `a869f617e25d9e68e734494ca65030a61b941e76b5aac8bc42138b8e4766e90b` |
| `src/intensicare/api/v1/pathways.py` | API de pathways de cuidado | clinicamente substantivo | pathways | `69e29b7fa1c828548b79bf419feb1a121f8c1d7c95fedc607f63b08af4bec013` |
| `src/intensicare/api/v1/prescricao.py` | API de prescrição | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `2bce7c481dfd0cb527f6ed9b653fb32ee61dce49cfa4082ea41e5acc0be655df` |
| `src/intensicare/api/v1/prophylaxis.py` | API de bundles de profilaxia | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `e467de1686914991217fce1ace20b59082f21e366e5fa93bc850b471243799c9` |
| `src/intensicare/api/v1/registry.py` | API de registro organizacional | não clínico | DEFERRED | `f886ef4f59d3082f07911ab924b7337105447bb184e55102a93412b8886d3eae` |
| `src/intensicare/api/v1/sedacao.py` | API de monitoramento de sedação | clinicamente substantivo | neuro-sedation-scores | `0873a4a862be30bab049c9ea240fd1de2352f7be39b12c0b30c5500192dada19` |
| `src/intensicare/api/v1/stability.py` | API de estabilidade hemodinâmica | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `0541fbb28cc9fd9267f89264f5715f63a929d1dea0f6da358c23c48afa8b07e0` |
| `src/intensicare/api/v1/ventilation.py` | API de monitoramento de ventilação | clinicamente substantivo | WAVE-1B organ-support-and-medication-safety | `b0f21471ff7488205e160edfcf2605647cd73efbcc5a041169964bbea38794b5` |
| `src/intensicare/api/v1/ws.py` | transporte websocket | não clínico | DEFERRED | `ec379f3c2e7a303e3525f61c4a4ec133d66ee5847491d53f5b3a766d2e8e39c0` |

| Arquivo | Conteúdo | Classificação (INFERENCE) | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|---|
| `src/intensicare/core/metrics.py` | definições de métricas Prometheus/OTEL incl. contadores clínicos (docstring OBSERVED) | clínico-adjacente | kpi | `a2ffd1fba94995030cff6b4d84ee92d4dc7f382c8294b4de72654bf6ebf8facd` |

Transporte clínico-adjacente não enumerado: `src/intensicare/mllp_listener.py`,
`src/intensicare/fhir/client.py`, `src/intensicare/clients/athena_client.py`,
`src/intensicare/clients/mpi_client.py` (OBSERVED como existente; ingestão/
transporte, não definição de lógica clínica; ausente do manifesto de pin;
classificado como encanamento não clínico — INFERENCE; adiado, ver coverage-map
DEF-6).

### 2.5 Definições de pathway — `_work/alerts/` (15 arquivos, todos no manifesto de pin)

| Arquivo | Id / papel de pathway | Versão | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|---|
| `_work/alerts/pathways/antimicrobiano.yaml` | id 8 | 3.0.0 | WAVE-1B organ-support-and-medication-safety | `0ef987c51ad18ab9dea0123da1fec8c2c07b96833abe6a5ce9ee6db8e4e3758f` |
| `_work/alerts/pathways/delirium.yaml` | id 11 | 3.0.2 | neuro-sedation-scores | `571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208` |
| `_work/alerts/pathways/desmame.yaml` | id 3 | 3.0.0 | WAVE-1B organ-support-and-medication-safety | `808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a` |
| `_work/alerts/pathways/equilibrio.yaml` | id 9 | 3.0.1 | WAVE-1B organ-support-and-medication-safety | `5d3af65ac19c81d4574a8c5848f4599949aad666ef0be808cdeb672607e60194` |
| `_work/alerts/pathways/estabilidade.yaml` | id 5 | 3.0.0 | WAVE-1B organ-support-and-medication-safety | `bf61744c263f40f630931293fcf4fc95b90e573609390abee42d37c7b3c5bcc9` |
| `_work/alerts/pathways/nutricao.yaml` | id 4 | 3.0.0 | WAVE-1B organ-support-and-medication-safety | `b2dc4ae2f7fff4bcad5e1923647053fdcfd1565c7b5a0f9cf850628bd561dd95` |
| `_work/alerts/pathways/profilaxia.yaml` | id 7 | 3.0.0 | WAVE-1B organ-support-and-medication-safety | `0e33e945a67e0671c7f6cc957215c1f221d7b1f13e5ef01f8d024ad0584598bc` |
| `_work/alerts/pathways/renal.yaml` | id 10 | 3.0.1 | WAVE-1B organ-support-and-medication-safety | `a052e6c26835e3c7c8ade5e62ed7272b779edf95cfd47c6a3105fc3d90db4153` |
| `_work/alerts/pathways/respiratorio.yaml` | id 12 | 3.0.1 | WAVE-1B organ-support-and-medication-safety | `9792ca62fc663d77315ae5e0ea41d9bbcb2b6bfa36c55eaeb42bb05533ad5d1e` |
| `_work/alerts/pathways/sedacao.yaml` | id 6 | 3.0.2 | neuro-sedation-scores | `21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657` |
| `_work/alerts/pathways/sepse.yaml` | id 2 | 4.0.0 | sepsis-scores | `b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0` |
| `_work/alerts/pathways/ventilacao.yaml` | id 1 | 3.0.0 | WAVE-1B organ-support-and-medication-safety | `d1c48956f19eb55633f034cd800b05ed35004664864942f75533e1635a6fd8d3` |
| `_work/alerts/sepse.yaml` | catálogo de alerta de sepse raiz (6 alertas compilados, sourced SSC-2021) | n/a | sepsis-scores | `1af8062d535ff0a9efa12a1606c7b37b975bd0635a8800f155491e958ced5dfa` |
| `_work/alerts/registry.json` | registro de ALERTA compilado (6 alertas de sepse; ver 1 linha 9) | 1.0.0 | sepsis-scores | `bb2db7f853a6ee8f9f420aa88dd078acb20cd0e4a09e7cb98ab7ed644c7fba77` |
| `_work/alerts/schema/pathway.schema.json` | JSON Schema de definição de pathway (ADR-0020) | draft-07 | pathways | `68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203` |

OBSERVED estrutura por YAML (parse de todas as 12): 60 entradas de avaliação, 58
critérios, 38 conjuntos de faixas, 48 estados no total. `ventilacao.yaml` (id 1)
é a menor definição (2 entradas, 2 critérios, 2 estados) e não define `active:`
— consistente com o achado do ciclo-0 de que "a pathway do ventilador é um
stub". `sepse.yaml` v4.0.0 é a maior (17 entradas, 15 critérios, 38 predicados
contando aninhados) e se declara a porta declarativa de `domain_sepsis.py`.

### 2.6 Catálogo de regras extraídas — `docs/rules/` (1.157 arquivos, TODOS no manifesto de pin)

| Sublocalização | Arquivos | Tipo de conteúdo | Classificação (INFERENCE) |
|---|---|---|---|
| dez diretórios de categoria (`access-control`, `alert-threshold`, `billing-administrative`, `care-pathway`, `clinical-scoring`, `data-validation`, `drug-dosing`, `physiological-calculation`, `scheduling-operational`, `triage-eligibility`) | 959 `RULE-*.md` | uma regra extraída por arquivo, front-matter + citações de fonte | misto — classificado por CLUSTER na seção 3 (cluster, não diretório, é a unidade de revisão) |
| `docs/rules/catalog-index.json` | 1 | índice de máquina (947 de 959 regras; ver 1.1) | meta/proveniência |
| `docs/rules/INVENTORY.md`, `README.md`, `AUDIT-REPORT.md`, `ESCALATIONS.md` | 4 | metodologia de extração, snapshots upstream auditados, escalonamentos | meta/proveniência |
| `docs/rules/extraction/` (phase1..3, phase3-verification) | 191 | notas de trabalho de extração por fase | meta/proveniência |
| `docs/rules/inventory/` | 2 | inventários TSV por arquivo dos dois repositórios Django UPSTREAM (ver seção 4, NL-1) | meta/proveniência |

Contagens de categoria em disco (OBSERVED): access-control 16, alert-threshold
116, billing-administrative 38, care-pathway 211, clinical-scoring 65,
data-validation 314, drug-dosing 29, physiological-calculation 47,
scheduling-operational 66, triage-eligibility 57 (= 959). Os totais de categoria
em `catalog-index.json` são menores pelas 12 regras não indexadas (p.ex.
data-validation 309, alert-threshold 112, access-control 15).

Nota de taxonomia de regra (OBSERVED): toda regra carrega TANTO uma `category`
(seu diretório, 10 valores) QUANTO um `cluster` (domínio, 27 valores). Os
clusters cruzam categorias — p.ex. o cluster `sepse` abrange 8 categorias. A
atribuição de cobertura é feita uma vez por regra via seu cluster (seção 3 +
coverage-map) para que nenhuma regra seja atribuída duas vezes.

### 2.7 Migrações de conteúdo clínico — `alembic/versions/` (25 de 43 migrações; apenas a 0038 era conhecida pelo ciclo 0)

| Arquivo | Semeia/ativa (OBSERVED a partir do nome/docstring) | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|
| `alembic/versions/0005_algorithm_registry.py` | tabela de registro de versão de algoritmo clínico | ews | `f013cfe7dbb297dde35c52dc1581f0356b5646f4e58df76742e5caae710b7cf5 (rt)` |
| `alembic/versions/0007_seed_mews_v1_0_1.py` | semeia a versão de algoritmo MEWS v1.0.1 | ews | `a14d9b244666d7dcf75be32418b828da86627d35ee3965027408e7dbdff966d8 (rt)` |
| `alembic/versions/0008_seed_news2_v2_0_0.py` | semeia a versão de algoritmo NEWS2 v2.0.0 | ews | `cb98588ea4460b355c2c3ac84d314c838f405903150b7019392e9a69db0d51c6 (rt)` |
| `alembic/versions/0009_canonical_severity_model.py` | migração do modelo de severidade canônico | alert-threshold-engine | `9a6b5ac334cb7ca80e3ecc16fdb5d461ec802124b1b24fdfbd42fb2defbde94d (rt)` |
| `alembic/versions/0010_seed_sofa_v1_1_0.py` | semeia a versão de algoritmo SOFA v1.1.0 | sepsis-scores | `1a064e037ea4a797ae3969b6b1708cefadfbd555b108205c9deab359e8611bf4 (rt)` |
| `alembic/versions/0013_seed_domain_definitions.py` | semeia definições de alerta de domínio | alert-threshold-engine | `ff33bf12292af10ed0e70a21ef7fec5677d4d0eb8a59d07c34c725648146965d (rt)` |
| `alembic/versions/0014_seed_sepsis_definitions.py` | semeia definições de alerta de sepse | sepsis-scores | `6914775eaad07546be3c51bd4cedea849966a22831a29232989ec74703ee5842 (rt)` |
| `alembic/versions/0015_seed_aki_definitions.py` | semeia definições de alerta de AKI | WAVE-1B organ-support-and-medication-safety | `e85170497ec0a5bca36cf618494063bc87b2388664515d3e88527f2bd0c331d6 (rt)` |
| `alembic/versions/0016_seed_electrolyte_definitions.py` | semeia definições de alerta de eletrólitos | WAVE-1B organ-support-and-medication-safety | `6018a06308c6d8b3cba2a9a3298826de8716cdfdfc4a45383bd167126aa152ba (rt)` |
| `alembic/versions/0017_seed_hemo_definitions.py` | semeia definições de alerta de hemodinâmica | WAVE-1B organ-support-and-medication-safety | `0afc04e82a64eb12485cb9a67c6308b124692fa84d73f155fdee79efe0c16b4a (rt)` |
| `alembic/versions/0018_seed_respiratory_definitions.py` | semeia definições de alerta respiratório | WAVE-1B organ-support-and-medication-safety | `26b916ff7ce6f2644da7e1e51822bbf516b67ef1848f4b5f8517dd1daa2cae85 (rt)` |
| `alembic/versions/0019_seed_correlation_definitions.py` | semeia definições de alerta de correlação | alert-threshold-engine | `be3491ec32e351dc0c925e9e531e3b49a04a56c541acb0945679b1e83413a78e (rt)` |
| `alembic/versions/0020_activate_mews_v2_0_0.py` | ativa o MEWS v2.0.0 | ews | `a8537f389dce039d707f59202c0df7f960c27c54b65e4ba20e37608600b256eb (rt)` |
| `alembic/versions/0021_activate_news2_v3_0_0.py` | ativa o NEWS2 v3.0.0 | ews | `2874d0306946472838a612ca73d78a311e8885cdbf5c11bf28172fcc36db15f4 (rt)` |
| `alembic/versions/0022_activate_sofa_v2_0_0.py` | ativa o SOFA v2.0.0 | sepsis-scores | `4e4eb2b628916c3c5511580f419457902898cf86f1216f482cd3408462bf3251 (rt)` |
| `alembic/versions/0023_activate_clinical_ratify.py` | ativação de ratificação clínica | ews | `e16cab0aff9c1b9a8300514cf8db1f6d9c5fd0522f4df48ed23bbcd34fe6f6b5 (rt)` |
| `alembic/versions/0024_wave1c_ratify_conversion.py` | conversão de ratificação wave-1c | alert-threshold-engine | `5e61ed94deb8760398af8845aeee9f41062f005db33796480cb9150d05d8e655 (rt)` |
| `alembic/versions/0025_seed_sepsis_ratified.py` | semeia conteúdo de sepse ratificado | sepsis-scores | `3cec1dd3ec4e39cb6f46584e10af4af426b1c737f100538170ca78dd22d5ddcf (rt)` |
| `alembic/versions/0026_seed_p1_clinical_ratified.py` | semeia conteúdo clínico P1 ratificado | alert-threshold-engine | `fa53576fed3ea6200f42f6701cca2e5e0df6dd5e1dda18154b8c0e538631d959 (rt)` |
| `alembic/versions/0027_seed_unverifiable_ratified.py` | semeia regras UNVERIFIABLE ratificadas | alert-threshold-engine | `7b7aa7203f0b89900b6bedc030094d587f0033f8749b24417d9a28a32dd3fd81 (rt)` |
| `alembic/versions/0028_wave3a_ratify_activation.py` | ativação de ratificação wave-3a | alert-threshold-engine | `412ff997650cdb938eb58c43a197c12b5a76a199a0ebcfdec59b89af78b6a9fb (rt)` |
| `alembic/versions/0029_ratification_record.py` | tabela de registro de ratificação | ews | `cfd0e7e40d62f628fa6335018a547a6d418931ce5861f239bb3f2f5f7ce1afbe (rt)` |
| `alembic/versions/0038_seed_default_threshold_config.py` | semeia limiares de MEWS/NEWS2 tenant-global com citações de diretriz | alert-threshold-engine | `c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486` |
| `alembic/versions/0039_activate_mews_v3_0_0.py` | ativa o MEWS v3.0.0 | ews | `da08277a162847d121ce8024f78bea2997481416437820265cadeeaaf9465e23 (rt)` |
| `alembic/versions/33909c9d8845_add_sofa_lab_columns_to_vital_sign.py` | adiciona colunas de laboratório de SOFA a vital_sign | sepsis-scores | `d86fad47a49548ba10b9ce9493eeac3885a6bba644e59e2a885247e73a5d25d8 (rt)` |

ACHADO DE EXTENSÃO (OBSERVED): o pacote de tarefa e o manifesto de pin listam
apenas a migração 0038, mas 24 outras migrações semeiam ou ativam conteúdo
clínico (versões de algoritmo de escore v1-v3, definições de alerta por
domínio, modelo de severidade canônico, ondas de ratificação). Todas as 24
estão hasheadas acima no momento da leitura. A migração 0038 adicionalmente
embarca limiares padrão de MEWS/NEWS2 (watch/urgent/critical) com citações de
diretriz em sua docstring — é conteúdo clínico, não apenas encanamento. As 18
migrações restantes são encanamento de schema (tabelas/índices/colunas) —
INFERENCE: revisadas estruturalmente via seus models (2.2), não enumeradas
aqui.

### 2.8 Catálogos de alerta de domínio em runtime — `docs/plan/_work/alerts/` (9 YAMLs, NÃO no manifesto de pin, hasheadas no momento da leitura)

| Arquivo | Carregado em runtime por (OBSERVED) | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|
| `docs/plan/_work/alerts/aki.yaml` | `domain_aki.py` (3 alertas, 17 vetores) | WAVE-1B organ-support-and-medication-safety | `409f363d356311514b605df0876ffb0a1e9ec1f2d15017e7b42342778453e42c (rt)` |
| `docs/plan/_work/alerts/correlation-engine.yaml` | `correlation_engine.py` | alert-threshold-engine | `51336b4cdce32905270b7dcb241824083c4003142527a8d7b71e6e576dbab06b (rt)` |
| `docs/plan/_work/alerts/early-warning-scores.yaml` | catálogo de domínio EWS | ews | `712d9ccde209d099f80c4d5abb11e77e33564e03f347f931a363537c1031e9b8 (rt)` |
| `docs/plan/_work/alerts/electrolyte.yaml` | `domain_electrolyte.py` (6 alertas, 39 vetores) | WAVE-1B organ-support-and-medication-safety | `0de2f4e7218d1acdd2c2c83ff8a25435bda5f996e577f073f3b9988f9e4085f3 (rt)` |
| `docs/plan/_work/alerts/hemodynamics.yaml` | `domain_hemo.py` (6 alertas, 34 vetores) | WAVE-1B organ-support-and-medication-safety | `ed09ce34e5e7dde099cff41d8821d642021083a431f5c302ca3a2de173496190 (rt)` |
| `docs/plan/_work/alerts/neuro-sedation.yaml` | `domain_pharmaco_delirium.py` | neuro-sedation-scores | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627 (rt)` |
| `docs/plan/_work/alerts/pharmaco-interaction.yaml` | `domain_pharmaco_delirium.py` | WAVE-1B organ-support-and-medication-safety | `ee403fbe4d63d694993ac4858f83f8bc3cc920cbe413f3323b3e6c8fae6fc992 (rt)` |
| `docs/plan/_work/alerts/respiratory.yaml` | `domain_respiratory.py` (5 alertas, 24 vetores) | WAVE-1B organ-support-and-medication-safety | `7186652bccffce6a99f1e8d5722913683c7009c875adaa15b1207715ea7634af (rt)` |
| `docs/plan/_work/alerts/sepsis.yaml` | catálogo de domínio de sepse | sepsis-scores | `6d79efcb164b7989f9c3992a9f2647b9ea213cb329bef837681ad85bbaf0e5de (rt)` |

ACHADO CRÍTICO (OBSERVED): estes nove arquivos vivem sob `docs/`, mas são
**lógica clínica em runtime** — os serviços os resolvem por caminho de
repositório e avaliam suas definições de alerta em caminhos de código em
produção. São os "nine domain YAML files, all lacking `alert_groups`" da
evidência do ciclo-0 (confirmado: 0 de 9 contêm `alert_groups`). NÃO são
cobertos pelo manifesto de pin; os hashes acima são o pin de registro para a
revisão do ciclo-1.

### 2.9 Corpus de disposições de regra e planejamento clínico — `docs/plan/` (NÃO no manifesto de pin, hasheado no momento da leitura)

OBSERVED: `docs/plan/_work/dispositions/` contém 40 shards de disposição por
cluster mais `merged.json`, que contém **exatamente 959 registros** — uma
disposição por regra extraída — com histograma: ADOPT 371, ADOPT-CORRECTED 57,
RETIRE 242, ADAPT 223, SUPERSEDE 66. Cada registro carrega uma citação de
fonte, justificativa com citações de evidência clínica, e uma âncora de
domain-spec alvo. INFERENCE: esta é a própria revisão clínica (não ratificada
sob a governança V2) da equipe legada do catálogo de 959 regras; ela acelera
materialmente a revisão do ciclo-1, mas NÃO tem autoridade — toda disposição
precisa de revisão V2 independente sob `legacy-import-policy.md`.

Arquivos-chave:

| Arquivo | Conteúdo | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|
| `docs/plan/_work/dispositions/merged.json` | todos os 959 registros de disposição | segue o cluster de cada regra (coverage-map seção 3) | `44f027ad78769ca57f1a9022fd5c58febcd208a69f2cda975d63552e0abb2d10 (rt)` |
| `docs/plan/traceability-matrix.md` | rastreabilidade regra-para-alvo incl. FOIS, escalas de dor | segue o cluster de cada regra | `eb060855f9b9390c016f6ec751b4aad3d645393be01a962c4a9f34ee7f1187f5 (rt)` |
| `docs/plan/clinical/hazard-log.md` | hazard log legado | DEFERRED (DEF-5: artefato de safety-case, pertence ao engenheiro de safety-case da V2, não a um workstream de conteúdo) | `3174e62f613c9fa482fc88fdf6eedbb2ecedcaff8dc371f1232ba5246127fa46 (rt)` |
| `docs/plan/clinical/units-registry.md` | registro canônico de unidades clínicas | WAVE-1B data-quality-and-physiological-calculation | `c8e4fccbb04e003763ade67fba0ba753b05a1e56ee97747cb98b8981efb6d8a7 (rt)` |
| `docs/plan/clinical/alert-catalog.md` | catálogo de alerta planejado | alert-threshold-engine | `39ad0821aea09cf4c90366029d96dd597a616d957dd38e5cd9e2b350a9e32eeb (rt)` |

| Shard de disposição (`docs/plan/_work/dispositions/`) | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|
| `alertas.yaml` | alert-threshold-engine | `32eaa675a04764296d3e99c7e8d285f00a98f33b948458d20162671cdfa788fa (rt)` |
| `antimicrobiano.yaml` | WAVE-1B organ-support-and-medication-safety | `272a109ae04f1eaa0a0e76e95a7d719b8f892616ee7b19353dd94a7ab51bf85b (rt)` |
| `auditoria-logs.yaml` | DEFERRED | `8d753c35826a913c879be4d275716ec98cc3902e5dc11c201b950581abd3b9c1 (rt)` |
| `auth-usuarios-p1.yaml` | DEFERRED | `5014a0d79981dbac8dd2316dff675db6ce8a4c950ea8fd3bd77b20d5f3005a97 (rt)` |
| `auth-usuarios-p2.yaml` | DEFERRED | `91034e8f8678341de1de49cf97c2c980610e843db1e2e342d6c03900dfc285b6 (rt)` |
| `balanco-hidrico-p1.yaml` | WAVE-1B organ-support-and-medication-safety | `052fb19981cad554802fb1409516db21abbf1a2b0b1efe50e16bb956b32f7bbb (rt)` |
| `balanco-hidrico-p2.yaml` | WAVE-1B organ-support-and-medication-safety | `64274ea086274f260f8e2ac7d5f1cbbe3f7db01c9a0829907617f5ae35b7c2a4 (rt)` |
| `cadastros-ui.yaml` | DEFERRED | `4729dd162b90919f94a54306029a49df91efa0924d7a295fd968468cffcebb40 (rt)` |
| `clinical-scoring.yaml` | SPLIT por regra (ver coverage-map seção 4) | `926f957e839ed6ba469706ee20590906666a4c4cae27644952b43c75bf3382f9 (rt)` |
| `comunicacao-p1.yaml` | DEFERRED | `eeeb1c959a728ee927e5f33664ee66be41a212855fc7347fb5a68dc580ab1e49 (rt)` |
| `comunicacao-p2.yaml` | DEFERRED | `941f9d2120a4cd9d3d7650545ba493dcac4693e8e1d2830414e798e669b0c052 (rt)` |
| `design-adrs.yaml` | DEFERRED | `56ebe5af782dd42947ea331c8580d6da076dcc9be317a033bfa3efacd7de4715 (rt)` |
| `documentacao-faturamento.yaml` | DEFERRED | `5474cf6db50ed5e955a5ba61bc58b378d96cf9ea16ac8ca01b8d99c7cec6f69d (rt)` |
| `eficiencia.yaml` | WAVE-1B organ-support-and-medication-safety | `626083cf87afb0164ff3a1f3e7951169042a0c4ffa836a6bf33696914956f9e8 (rt)` |
| `equilibrio.yaml` | WAVE-1B organ-support-and-medication-safety | `916aad59fb9e26f50c9dd08f4ffc0399f501b912e83d50131c443908d0bb1c8d (rt)` |
| `estabilidade.yaml` | WAVE-1B organ-support-and-medication-safety | `dca001aea509ef1812f6a006945d202c3fbd425e4c9b5dd8fd8a96155e9b6f65 (rt)` |
| `evolucoes-p1.yaml` | WAVE-1B clinical-documentation-and-forms | `3fd38ea4c444a2701eaaa5106b916384aa6df95351812f8dfc0e9ec0a8889357 (rt)` |
| `evolucoes-p2.yaml` | WAVE-1B clinical-documentation-and-forms | `410f1b0518e8c0775a706be217d454e683e0d216d21cb6e30b0b8ae9fd4fe0b5 (rt)` |
| `formularios-clinicos-p1.yaml` | neuro-sedation-scores | `02cd279333af8a655d3f57b936cd78872bd5da1f4ba8e7b45f2b5b45c8e7f988 (rt)` |
| `formularios-clinicos-p2.yaml` | neuro-sedation-scores | `705ad50b43d57644105f5b84bf2451b9e466015c8b6b4b74dd27371079f6ea9b (rt)` |
| `indicadores-etl.yaml` | kpi | `4ea805a9829be1ec95e406882f27fe41437df15328e1891ecff36b32c9f48524 (rt)` |
| `movimentacao-adt-p1.yaml` | DEFERRED | `a225dd7abafb50aca824ad101e08fc230741e3018bae7b086fb22096b5c6d8a6 (rt)` |
| `movimentacao-adt-p2.yaml` | DEFERRED | `9fecce4eef8e9def5b00e0176f0bc25b59ac4c68e241603b5e0a8434c011abe4 (rt)` |
| `nutricao.yaml` | WAVE-1B organ-support-and-medication-safety | `6068d67a78355b9eef8f77be65744721039fcecd0281944885f422651bdeb5bb (rt)` |
| `operacional-infra-p1.yaml` | DEFERRED | `45ace8f033c4520d65237048acababac7f97ef9ec6ba35fd88cbef69fd72e6b4 (rt)` |
| `operacional-infra-p2.yaml` | DEFERRED | `a980721ed35678dbaac3a2365074fa07d1395f5d9b808502010726448bfd557a (rt)` |
| `piora-clinica.yaml` | ews | `ce5d5d06297b42c52c71b032569d0339a55125440497ee03bc73a9e9204fc2d3 (rt)` |
| `prescricao-p1.yaml` | WAVE-1B organ-support-and-medication-safety | `f167717ac3d70ef4db58244ca40c7b55097b913d25a5623d0a5aa72175976c67 (rt)` |
| `prescricao-p2.yaml` | WAVE-1B organ-support-and-medication-safety | `9ead12b5fa539151aa0ebcc2e39263689d11c5c8c94e7c85df141e49f4e468cf (rt)` |
| `profilaxia.yaml` | WAVE-1B organ-support-and-medication-safety | `3afa829b4b9ebe12f8f5e487e12a7646e685a38ec5ffcf2136122ba053e91c09 (rt)` |
| `sedacao.yaml` | neuro-sedation-scores | `f3db93d1bdffb4bfd5ddcc012df107e8848ba2cec4638655e1e30cc5c24370f1 (rt)` |
| `sepse-p1.yaml` | sepsis-scores | `cd15c8b1968f0f1c72c0bb11862757a545b4b260fff0625d2b5275b4e3e57b90 (rt)` |
| `sepse-p2.yaml` | sepsis-scores | `505401e24645ac23f3dead66cd4a5ac1aed611f9efc7af905aaaa52f8bfc2633 (rt)` |
| `sepse-p3.yaml` | sepsis-scores | `dd556a47cad541e08ab1796ac77649cdc7f94f924f31c19ddf9573f4bbf9ece2 (rt)` |
| `sinais-vitais.yaml` | WAVE-1B data-quality-and-physiological-calculation | `932c69c46bfd9a659c3cdc7a11895a5bda905b9dbfda949266486aac3351e3f9 (rt)` |
| `tenancy-organizacao-p1.yaml` | DEFERRED | `beeca012d388f98d41744aa31ea88b5f86ec924af697a79fad455895aa816f75 (rt)` |
| `tenancy-organizacao-p2.yaml` | DEFERRED | `f090d52a242c45d649a495d4a95638bb8292399184818e436a8dd9e28fce49ab (rt)` |
| `trilhas-engine.yaml` | pathways | `c13a980f11b64e68b0b8d66b93a4b7645c90405d5594ef115aa01b1061a647a7 (rt)` |
| `ventilacao.yaml` | WAVE-1B organ-support-and-medication-safety | `cf21be18568b018a92dbee43f02cdabd2bd2af3245386adc2bad39b89a6bd230 (rt)` |

#### Specs clínicas por domínio — `docs/plan/clinical/domains/` (9 arquivos)

| Arquivo | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|
| `docs/plan/clinical/domains/aki.md` | WAVE-1B organ-support-and-medication-safety | `89e6f17cd3a7e8da89b3645159fd9f7a26eb1da21ef7f1d78afa1b5612e809cd (rt)` |
| `docs/plan/clinical/domains/correlation-engine.md` | alert-threshold-engine | `c4c7eb68dfeadfbcd159f4fca812329c316d7bdcb3aad3ebbc2c2b798f9be491 (rt)` |
| `docs/plan/clinical/domains/early-warning-scores.md` | ews | `80a381ca53b09fac028a3ff171e18e0b1f7e636ded2195160c675b51b7c7a286 (rt)` |
| `docs/plan/clinical/domains/electrolyte.md` | WAVE-1B organ-support-and-medication-safety | `02b439a76664655b4b44888ea3f9443a4b7412a24c12fffc4f585728b506e26b (rt)` |
| `docs/plan/clinical/domains/hemodynamics.md` | WAVE-1B organ-support-and-medication-safety | `0a2355218582e4bb7a59f83e22c9e2d1334217fd7b366dc70a5cf874703b15de (rt)` |
| `docs/plan/clinical/domains/neuro-sedation.md` | neuro-sedation-scores | `65dbe2163662244e30071f867361a5e7b3b85bfbed4826aa0415d699458784a4 (rt)` |
| `docs/plan/clinical/domains/pharmaco-interaction.md` | WAVE-1B organ-support-and-medication-safety | `4fd1bed23543bcf5244d4a078d55534fc1132745214041561641ab0ab7e5706d (rt)` |
| `docs/plan/clinical/domains/respiratory.md` | WAVE-1B organ-support-and-medication-safety | `d9246cf2254065fbbf27ca58214ad67a420fd1398e8de42430dd594c699e7d4b (rt)` |
| `docs/plan/clinical/domains/sepsis.md` | sepsis-scores | `0c6268c851931f01cd23cda19bef437c73fe65c8c13414f3bc27dd374e317686 (rt)` |

As demais subárvores `docs/plan/_work/` (adrs, barriers, briefs, budgets,
catalog, constraints, coverage, domain-interfaces, escalations, gates, panels,
platform, redteam, reviews, safety, schemas, scripts, state, units — 288
arquivos no total em `_work/`) são artefatos de processo de
extração/planejamento. INFERENCE: meta/proveniência, não conteúdo clínico
autônomo; adiadas como conjunto (coverage-map DEF-4), com exceção de `alerts/`
(2.8) e `dispositions/` (acima). `docs/plan/design/`, `product/`, `delivery/`,
`architecture/` foram amostrados e são documentos de design/processo
(referenciados a partir da matriz de rastreabilidade, p.ex.
`design/screens/clinical-forms.md` para níveis FOIS); adiados sob DEF-4 como
material de referência.

### 2.10 Documentação clínica e ADRs — `docs/clinical/`, `docs/adr/` (NÃO no manifesto de pin, hasheado no momento da leitura)

| Arquivo | Conteúdo | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|
| `docs/clinical/alert-catalog.md` | catálogo de alerta clínico proposto v1.0.0 (alertas por domínio com lógica de gatilho e base de evidência) | alert-threshold-engine | `fe740ee6a0e8b2261102400418f8244dc0a9e3122a427900683a4b210ebe07e1 (rt)` |
| `docs/clinical/sepse-criteria-migration.md` | registro de migração dos critérios de sepse legados C1-C20 para SSC-2021 | sepsis-scores | `fbb5337e01ff20cc5960b784b93e6e7ab15c9802bff6f2d0d645244f9e3ef022 (rt)` |
| `docs/adr/0013-clinical-severity-color-system.md` | ADR portadora de semântica clínica | alert-threshold-engine | `7938b405794ce5151abb3c2bad8ccfb7d0797bb88005bbc6be80f7c41ac19269 (rt)` |
| `docs/adr/0014-no-abnormal-value-threshold-flagging.md` | ADR portadora de semântica clínica | alert-threshold-engine | `0e748e0fb19a1aeee884f270f228367bff9663f9135cf50ee43ade7d82d81044 (rt)` |
| `docs/adr/0015-config-driven-dynamic-clinical-form-engine.md` | ADR portadora de semântica clínica | neuro-sedation-scores | `d2109596c17548104ffbb96c74d83f2f4714fbc1e7283d281c97d11317861839 (rt)` |
| `docs/adr/0020-trilhas-engine-architecture.md` | ADR portadora de semântica clínica | pathways | `3928b5c316ac8e60ef560e22b6b3d13281e262a1c0b468b43128f784eb97a7af (rt)` |
| `docs/adr/0021-trilhas-engine-data-model.md` | ADR portadora de semântica clínica | pathways | `85cb44afed85a5937be9f02892aa7fafc7766ed739579a6cae1476fd982004e2 (rt)` |
| `docs/adr/0022-ventilacao-service-architecture.md` | ADR portadora de semântica clínica | WAVE-1B organ-support-and-medication-safety | `0bc5085397cb2e2682790ee6b1a6594197924e3226bbb9b17ba962787781a50e (rt)` |
| `docs/adr/0023-estabilidade-scoring-model.md` | ADR portadora de semântica clínica | WAVE-1B organ-support-and-medication-safety | `b828f25fcb72b983ac9288f408f346ca45ecc0e8ce50b724460049a50620f323 (rt)` |
| `docs/adr/0024-piora-clinica-detection-strategy.md` | ADR portadora de semântica clínica | ews | `ae4a6493ed7f3464ff63145c38b62a07f2c657a2aa2c3249610f449791ff2cd2 (rt)` |
| `docs/adr/0025-movimentacao-adt-integration-pattern.md` | ADR portadora de semântica clínica | DEFERRED | `4d7ffc7b4d4654df040d362e313d5a9c92750057a4b2278d57086abbd9a2da3d (rt)` |
| `docs/adr/0026-prescricao-drug-interaction-safety.md` | ADR portadora de semântica clínica | WAVE-1B organ-support-and-medication-safety | `3d95b144f2a199594bf2cb7116ce7e08a4952a81a70f953e30159c16e45957e0 (rt)` |
| `docs/adr/0027-prescricao-lifecycle-state-machine.md` | ADR portadora de semântica clínica | WAVE-1B organ-support-and-medication-safety | `7385d8c3b5b1a5b76f77401268218cd8eaa8083ec0c5d3d48c9c304ebd55a00e (rt)` |
| `docs/adr/0028-evolucoes-clinical-notes-architecture.md` | ADR portadora de semântica clínica | WAVE-1B clinical-documentation-and-forms | `d478d0a9ec7b4754c98404f8bff8fe78cf7e8ab3a8720e61c91b954f71c195e8 (rt)` |
| `docs/adr/0029-formularios-clinicos-dynamic-form-engine.md` | ADR portadora de semântica clínica | neuro-sedation-scores | `3f3ba3118ac69f40917e6393192694c9d380a3c74c600f6507f39011ab287936 (rt)` |
| `docs/adr/ADR-0031-mvp-pathway-sepsis.md` | ADR portadora de semântica clínica | sepsis-scores | `2bde2405c46165730970f17e0b9b98b652e051358e6c10a7e35307eef747f031 (rt)` |
| `docs/adr/ADR-0035-sepsis-declarative-port.md` | ADR portadora de semântica clínica | sepsis-scores | `2e192f0890c3a2793e04374a1187e552b45c35d1965c2a88197c73616288155a (rt)` |
| `docs/adr/ADR-0038-clinical-coverage-scope.md` | ADR portadora de semântica clínica | pathways | `0df8aae0279c7206c0c1111d04d6b09444ad1eb826fdaa0c0097bbc0fb62236e (rt)` |

OBSERVED: `docs/adr/` contém 41 ADRs; as 16 acima carregam semântica clínica
(sistema de severidade, política de sinalização de limiar, modelos de
scoring, arquitetura de pathway, segurança de interação medicamentosa, porta
de sepse, escopo de cobertura clínica). O restante são decisões de
stack/UI/infra — INFERENCE: não clínicas, adiadas (DEF-4). `docs/regulatory/`
(`anvisa_cadastro.md`, `lgpd_ripd.md`) e `docs/compliance/opa-policies/` são
material regulatório/de política de acesso — conteúdo não clínico, adiado
(DEF-4). `docs/audit/` (49 arquivos) e `audit-results/` são relatórios de
auditoria/meta SOBRE o código clínico — adiados como referência (DEF-4).

### 2.11 Gates clínicos em tempo de build — `scripts/` (NÃO no manifesto de pin, hasheado no momento da leitura)

| Arquivo | Conteúdo | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|
| `scripts/validate_alerts.py` | gates de pathway A/B/C incl. registro canônico de unidade embarcado e checagens de partição de faixa | pathways | `22daccfb33d4be7f6708ae0b3e44f2d1fa635cf9e3d442e0e45ff55b98ae4c41 (rt)` |
| `scripts/verify_units.py` | registro canônico de unidades clínicas (fonte do Gate A) | WAVE-1B data-quality-and-physiological-calculation | `80513917eaf841f139aa8859b8f42f6f0fc2ce6a3e51a0b37154b4a6ebce4c7d (rt)` |
| `scripts/build_alert_registry.py` | compila `_work/alerts/*.yaml` em `registry.json` | alert-threshold-engine | `f0366b7a0966946751ace6d2fc28e20d168c23806a9776d425818221436857eb (rt)` |
| `scripts/check_vector_coverage.py` | gate de cobertura de vetor de alerta (o gate false-green evidenciado no ciclo-0) | alert-threshold-engine | `b8a38ebe4cb21894dafb913c0c28df223eda21555e0dbcdc54b2ef8e1fc37eb7 (rt)` |

### 2.12 Testes carregando expectativas clínicas — `tests/` (101 arquivos, NÃO no manifesto de pin, hasheados no momento da leitura; LISTADOS conforme a tarefa, não revisados)

| Arquivo | Workstream (PROPOSAL — segue seu assunto) | SHA-256 |
|---|---|---|
| `tests/contract/test_rest_contract.py` | DEFERRED | `d073260cfd82c7f93cf5323fb2281a067cc5bf8b2e99fcae0d1a545989c3da72 (rt)` |
| `tests/contract/test_ws_contract.py` | DEFERRED | `e965867f2b98d07cd1a5c082495680d48002bcaf38869541cb94456d44585747 (rt)` |
| `tests/drills/test_chaos_drills.py` | DEFERRED | `6ec92ee77949174746fdf73274b6ca2875b8e3d527f4b1796b9f27789375bd0d (rt)` |
| `tests/property/test_scorer_properties.py` | ews | `154bc0b0aaa41392ce25f36df8a8a5fde277f15d01a7995cc96ac185b276e964 (rt)` |
| `tests/rules/test_alert_vectors.py` | alert-threshold-engine | `bf97d97f24c892e8fc3269c8b833de51a4456d94777a4a1af366a5ba1984b6ac (rt)` |
| `tests/storm/test_alert_storm.py` | alert-threshold-engine | `169d7dfd425bed8dfd9fcaf434f6ef48b8feaa5a1f07837d81601cea6f8cd9a5 (rt)` |
| `tests/test_alert_compiler.py` | alert-threshold-engine | `0ab3a3def7f444d2d42b8668862ec38be80252d7c257645b87ed5714e48f6dd7 (rt)` |
| `tests/test_alert_copy.py` | alert-threshold-engine | `d92567eb51ed7ac51d8292327363ddca6a6b1121d0969ecb41f0766918b8164a (rt)` |
| `tests/test_alert_engine.py` | alert-threshold-engine | `2fd40a2a17b1d1e5cbbe5799a06bb529dccddf364e4400bc47373f666d0f3e5a (rt)` |
| `tests/test_alerts.py` | alert-threshold-engine | `02814d12b2a439298380e22ac726677252d92cfd0c2af0578d8c289a1e80ab82 (rt)` |
| `tests/test_algorithm_registry.py` | ews | `606140e631a674778179b97099454e155be265a034d0409e613d013669b30fea (rt)` |
| `tests/test_altb_trigger.py` | DEFERRED | `cd802b98ad73d32ea5067cb85d39f8c5a3d5e5288ff7d8ca368b3c589a8b1543 (rt)` |
| `tests/test_antimicrobial.py` | WAVE-1B organ-support-and-medication-safety | `3a128b1718006b2d6388778a8b32a3771b7b2eaee745ec05a8f65ca6be44af3f (rt)` |
| `tests/test_cds_hooks.py` | alert-threshold-engine | `ecba703bae909212f4398fa15c5a7ed3fb1a4148219a6adea6ad5992b57a2ef3 (rt)` |
| `tests/test_clinical_forms.py` | neuro-sedation-scores | `56245feb84aa57f8838b4cc467b2d000659c9ace10da4e99faf33aa7be6dc9f9 (rt)` |
| `tests/test_correlation_engine.py` | alert-threshold-engine | `db7dda9a97b647152b753f5c71e709c61c317b564225579aff1ae52ae8bded49 (rt)` |
| `tests/test_dashboard.py` | alert-threshold-engine | `ca74c593e4bdc51e96eaa3ba75a260b3c7dcc8575a08224373ad2c76a0b5693d (rt)` |
| `tests/test_deterioration_trend.py` | ews | `029bce854f7b7e883f8364133bbd5b496fec69e485515c6ef794c60fbcf86a7e (rt)` |
| `tests/test_domain_aki.py` | WAVE-1B organ-support-and-medication-safety | `f5ae7c2980fdc118ee6b6c2691846c77329a0ec626209badb0fd550fa96fa8c9 (rt)` |
| `tests/test_domain_alertas.py` | alert-threshold-engine | `e12785c4c0d61596f1aa787f2b785c2f3da9d056fd276bc044c0e83455e8f46a (rt)` |
| `tests/test_domain_antimicrobiano.py` | WAVE-1B organ-support-and-medication-safety | `d6875db8f61fdd2f208c47cdcd5f7100cac1a069003675e381634aa7d8e8a6f5 (rt)` |
| `tests/test_domain_comunicacao.py` | DEFERRED | `e2398fd799e43688f9b2bd8822d18ef2750998e0b128d190bc0777f84d8cb9fe (rt)` |
| `tests/test_domain_delirium.py` | neuro-sedation-scores | `a0f2bb6a69392ed9d4511c5e51c4387cb3971569bf4313f02538e04cae993193 (rt)` |
| `tests/test_domain_documentacao.py` | DEFERRED | `fd8d25d32a7e24c5146bf9269eaa495285b31cd5b4357627de5f746c609d10aa (rt)` |
| `tests/test_domain_eficiencia.py` | WAVE-1B organ-support-and-medication-safety | `ec8bbdc91e03c8e4c107c2a312704035e856270290ab32d7a66e3bdc368dc068 (rt)` |
| `tests/test_domain_electrolyte.py` | WAVE-1B organ-support-and-medication-safety | `ead2d7e79d4484997bf14db44d108dae63ba6c57453fef61dfb33b6cce9ae32b (rt)` |
| `tests/test_domain_estabilidade.py` | WAVE-1B organ-support-and-medication-safety | `b339278ec74904fcc37726defd920b066f005b22737356954694b9eb1a0c30fc (rt)` |
| `tests/test_domain_evolucoes.py` | WAVE-1B clinical-documentation-and-forms | `f120b1235ed301391a3124c56d26e69d2c53fedf4e048320639acbfafe001f14 (rt)` |
| `tests/test_domain_fluid_balance.py` | WAVE-1B organ-support-and-medication-safety | `ee5bb28e2e5df381b9de708745f201607507f731df7042e9dfbd57fcf976150f (rt)` |
| `tests/test_domain_formularios.py` | neuro-sedation-scores | `33ac907a5922170769b2c6ad0582f69db1033f5b532682444407c609778053e2 (rt)` |
| `tests/test_domain_hemo.py` | WAVE-1B organ-support-and-medication-safety | `316abf40e8abe6601407f1c29c9cee06b0383627471e39a063c906d373c76a5d (rt)` |
| `tests/test_domain_movimentacao.py` | DEFERRED | `46f9d4ffa1b83cf7793aacb17b5cc3e5bf18687c2548f5f888de4ab4d6f367ae (rt)` |
| `tests/test_domain_operacional.py` | DEFERRED | `588de3a875f6dca96c4c05dc0b7402d320fcab6821f63c86f29e2a8d49a32ca8 (rt)` |
| `tests/test_domain_pharmaco.py` | neuro-sedation-scores | `ffcbbc9f75ddca247c067c3d2a34345120f7f095d3f3bf511a244925af0ec0da (rt)` |
| `tests/test_domain_pharmaco_delirium.py` | neuro-sedation-scores | `4cba9f2b3faa459080e475992d97b0bcbf6077141f553e354ca3742c8315f257 (rt)` |
| `tests/test_domain_piora_clinica.py` | ews | `5194525b29eee9f8feed51eac48c94d768b65a670bf4a42982ed17e31abb2b60 (rt)` |
| `tests/test_domain_prescricao.py` | WAVE-1B organ-support-and-medication-safety | `d8adc14deb670822f660ee5a5163bcf6d9e7dd0c919f3ba81918c00ca6d5bc0c (rt)` |
| `tests/test_domain_profilaxia.py` | WAVE-1B organ-support-and-medication-safety | `9c2755128202244b080ce9c6751766565325ea487940259d77e8ef59affb26c4 (rt)` |
| `tests/test_domain_respiratory.py` | WAVE-1B organ-support-and-medication-safety | `ac332d63bb5c51f329a4f1251e5982f193490c54082026a75f578c21f94f563b (rt)` |
| `tests/test_domain_sedacao.py` | neuro-sedation-scores | `20f27aea93662d16276c988899a83018829095612f40fdaa40a3f761efe634a6 (rt)` |
| `tests/test_domain_sepsis.py` | sepsis-scores | `f86b57fa985705b279c8cbe0b0b212b3d47b0096d67db81ef39de82be81f22d5 (rt)` |
| `tests/test_domain_tenancy.py` | DEFERRED | `79a5db303064d933df89acc3973dd2c4e54f9112229465dcb6e462096706ec2f (rt)` |
| `tests/test_domain_ventilacao.py` | WAVE-1B organ-support-and-medication-safety | `9f2bc89a1811eee6459b7b2726bd327bc4bff2f65a8b59f5cbcdfb0bbdcba554 (rt)` |
| `tests/test_ews_nrt.py` | ews | `89091fe372bb90c2131491d63b6bbe1ae2356e38854ffaa777c951ade422bde8 (rt)` |
| `tests/test_ews_nrt_runner.py` | ews | `dda940edc6a53b697155bcf2c441820bfcad21fbe23f5be091c0ffc50eb5367f (rt)` |
| `tests/test_gold_reader.py` | WAVE-1B data-quality-and-physiological-calculation | `5141a6f37fdd787e09ed0fcadb3961b730b9a6cbfdaf2d578c3939f483f258c7 (rt)` |
| `tests/test_gold_schema.py` | WAVE-1B data-quality-and-physiological-calculation | `94e46dfbb050882352b8057993b297f7c1af88d68d91797389a9d25afdca7d7a (rt)` |
| `tests/test_gold_writer.py` | WAVE-1B data-quality-and-physiological-calculation | `ef4adeeaf1a32c6a53607cd3527436b89de12c1d736410a07b0ba4243556720b (rt)` |
| `tests/test_indicators.py` | kpi | `6cf5036379700e724b2e7631791274653278e4053683eef502782e839779ad54 (rt)` |
| `tests/test_mews.py` | ews | `a971ffc31f3c9ffffd3cfe861fae82e4914433a1660cf200e622a4f98ae443b6 (rt)` |
| `tests/test_news2.py` | ews | `bbf8aaf7261f6e19659d7f7638d7cc988385ef00e317a5fc238f8f64a9e4ced0 (rt)` |
| `tests/test_notification_worker.py` | alert-threshold-engine | `e9520d7df2d401dde82ca00c61646b553699e0c2c88d60e59cb6e9cef92c8b70 (rt)` |
| `tests/test_pathway_auto_evaluation.py` | pathways | `4e2144d41ffc17186a23450a3f62a3826babf7e97f65ad13879bb9842b619bc5 (rt)` |
| `tests/test_pathway_enrollment.py` | pathways | `9a0eab4b9dd7c0fa035ed390b6b633251b301b1db439d63808bad982a570bbbf (rt)` |
| `tests/test_pathway_persistence_e2e.py` | pathways | `3f88a36c98f2f5c26c794167010f666786ea1815a6b7bd61e924c87b2c14c510 (rt)` |
| `tests/test_pathway_repository.py` | pathways | `6aea262721aa15f4ca32eaf1e75ddc6f7e3b64683d228b901ec0f623cfb9c163 (rt)` |
| `tests/test_ppv_tracker.py` | kpi | `a97a982c641155f4192266dd1b5663857de971aab1d0694e94b3e3803ad7e200 (rt)` |
| `tests/test_prophylaxis.py` | WAVE-1B organ-support-and-medication-safety | `38dbf98c7624eac30948c6a50615f39af572b2c2c91a193dd5373637e0e5d950 (rt)` |
| `tests/test_qsofa.py` | sepsis-scores | `ed463f369f95d1a2ecd1766b5f095b149f78815a35b0927cdb43d590b3465e13 (rt)` |
| `tests/test_registry.py` | DEFERRED | `5e4dc3b1e864aa9e17f9b073b203556b2a7d213456de66d34051a05bd28a72c6 (rt)` |
| `tests/test_sepse_yaml_parity.py` | sepsis-scores | `8d7e5557db0cd8e92077f87fc3be2e76b7e129b8b9e006432170023415e77017 (rt)` |
| `tests/test_severity_model.py` | alert-threshold-engine | `299e7915e7b170c4ae948282b85cce9aae41ac2ace7aeb98e92220468a243f6c (rt)` |
| `tests/test_sofa.py` | sepsis-scores | `95278fe50179a4f7904eacb256285472f51cf86ea3bfbf6c92a5890ab42610c7 (rt)` |
| `tests/test_threshold_resolver.py` | alert-threshold-engine | `4149c15cacdda78f9b5a66ddd9092e33cde2cadb3c2bdd70db20b18e648b30f9 (rt)` |
| `tests/test_thresholds.py` | alert-threshold-engine | `b72ddec4201e42948e5b43c2f0c5d94a0f2e278df431dcc4a2d26371d9e15571 (rt)` |
| `tests/test_trilhas_compiler.py` | pathways | `90db49b70cee4822790af8027f58088d523c3c1665a54455dc6e822d6544469a (rt)` |
| `tests/test_trilhas_evaluator.py` | pathways | `dbb8409f9300653e8d6bda746a1940e694e910de2e590302d82045777a5cc574 (rt)` |
| `tests/test_trilhas_validation.py` | pathways | `91383f22fd10d4889a597e177fb1e3575e748623e47a5090a16fa615bd9a8931 (rt)` |
| `tests/test_units_normalizer.py` | WAVE-1B data-quality-and-physiological-calculation | `345583406893937287376f34c6e7d71a32091130af7e8918c5ee891dc092b863 (rt)` |
| `tests/test_vitals.py` | ews | `4d1cd34217b6f0a096130b98f9930bee3f8c0a6959d72d2420c525f2bb933f67 (rt)` |

| Arquivo de teste restante (infra/segurança/encanamento — INFERENCE: não clínico; DEFERRED DEF-6) | SHA-256 |
|---|---|
| `tests/__init__.py` | `34daee8c37c95b83d7397ade2b0b3b0279e9787d55a17cc6369170d1cd9538f9 (rt)` |
| `tests/conftest.py` | `fd7f447898b5fadb07f796b6f8e03077ad6c1261ce9ab098eb6fa93007ae299a (rt)` |
| `tests/contract/__init__.py` | `7bfd19009456ffd50aba8ee55b5737f8235f833c4187edd32a9d1fbb3e0b9013 (rt)` |
| `tests/drills/__init__.py` | `a03963161c756194466b7e4a575a8b937024b4464a9baf2a61036f506424da1b (rt)` |
| `tests/property/__init__.py` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (rt)` |
| `tests/rules/__init__.py` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (rt)` |
| `tests/storm/__init__.py` | `607914a47df14434dc54bcc1bba63aa2305356ac898dff02ac64917fcf59fb07 (rt)` |
| `tests/test_abac_clinical.py` | `a2b30e5602b291d68a9a68e6365eb829d8848e98c4e3f15539f7f53b879d8049 (rt)` |
| `tests/test_arq_settings.py` | `39f83d744a7ba97b0c6d25d900452524fa773fcda9341b87c5414e7a76cf3f99 (rt)` |
| `tests/test_audit_trail.py` | `dcd1ab29f55026014f7ec0792dbc608ac6f7b47fcb364a73869faf47638b462b (rt)` |
| `tests/test_auth.py` | `8650172f3661c8e214a6b9f00e64bf314f340e5d1651ed0c8048bf22da676c6d (rt)` |
| `tests/test_auth_dependencies.py` | `b3dbfa305acb7652ca23d37e6c64736c4644cc1e20e5035eae6f26f364d07c37 (rt)` |
| `tests/test_fase3_security.py` | `bc632391b471fb3bf16f1de16f68caf067e8da541f97708aea7649595ef37ea7 (rt)` |
| `tests/test_fhir.py` | `bd53c021540fb5b559e35cf36c6aeea3f95f3d24c30b0f4a4cdb56034503822f (rt)` |
| `tests/test_health.py` | `75576ad3178d8d9589e8ae7b4178eb8fdc90a98096f8efeec31e6f66a7bf7a79 (rt)` |
| `tests/test_ingestion_idempotency.py` | `6f0fa8fc1864867fafb2214ab16f8ae0e86e735befe510349540240a6ffb59d6 (rt)` |
| `tests/test_kms_keys.py` | `47f887f7b50528dcdaff35cee779cfd422696ed492370a281dac17b0bf734bee (rt)` |
| `tests/test_lifespan.py` | `2cdb43481f32ce15b53fe4ea83d5b5a6c779273e08b99700885eb16bf4d153a8 (rt)` |
| `tests/test_main.py` | `9175c23b6c39be28fc6302be5f8d07094fa86f426507b4ec557ca7b0f2a3f1b9 (rt)` |
| `tests/test_mllp_listener.py` | `eadf77541457bcc698dfa52edb83b32248864f3071083297b0d7c6c17aef06cd (rt)` |
| `tests/test_mpi_resolver.py` | `144df429d584283c859174183d395b3d20662e2d797dcb4e508ea0278ef3e1f5 (rt)` |
| `tests/test_patient_encryption.py` | `f368380cd62989e99000f048864e5ddd374636eae079d4d9dc1a6adbb3d2a779 (rt)` |
| `tests/test_patients.py` | `df91516980beb872599c99609eb5df0ee64ffa7d2726408dcc8687a9e72d5921 (rt)` |
| `tests/test_pgcrypto.py` | `be736aaca571571300fcd9c0e0b7119b79486c4e213ce104b4f5ee8699c31b38 (rt)` |
| `tests/test_phase2_tables.py` | `d2755c7644e3df0a91e513c31b564594e1250d2048a8f2f88c35066e61c41f87 (rt)` |
| `tests/test_rate_limit.py` | `6317b5c90b6e3db8ca11325080c34c8b81b7754e656a7929003a22235fa0588d (rt)` |
| `tests/test_schema_deltas.py` | `21f14daf5fa90c0a6061e34a6ebe574f0fdfa6b1b6cfd248d0bb76f2a623cade (rt)` |
| `tests/test_secrets.py` | `ef4029a6d47a7391ea9d6bb3bbe3b0ecc83a54f422b058333268d00eddfb432e (rt)` |
| `tests/test_seed_demo.py` | `972d18d6866a1e8b5270793a5fc297eb883704bce6bcb2ad3ec641eb765b295d (rt)` |
| `tests/test_telemetry.py` | `9ce7adf315f790162f8f9de4ca82eba19261feb025f4aabf866bc47fdfa8a6f6 (rt)` |
| `tests/test_websocket.py` | `a079494b8902999772adef5044bb370ba78f4b70bdef95e0d1d646c0b7fd1af4 (rt)` |

### 2.13 Semântica clínica do lado do cliente no frontend (achados; NÃO revisada em profundidade, conforme a tarefa)

| Arquivo | Achado (OBSERVED) | Workstream (PROPOSAL) | SHA-256 |
|---|---|---|---|
| `frontend-v3/components/dashboard/score-pair.tsx` | classificação em faixa de escore hardcoded: >=7 crítico, >=5 urgente; texto de risco em >=5 | ews | `ef879807d631e4216339594c02341c241a13fec5ae8bffa8d8be6f883c146e21 (rt)` |
| `frontend-v3/components/patient/score-timeline.tsx` | classificação em faixa hardcoded >=3/>=5/>=7 para cores da linha do tempo de escore | ews | `d1cd460019bf7ffc9a1d7e9f00368187107aea5400e93e0fd59b6ee8f05f7e99 (rt)` |
| `frontend-v3/components/patient/patient-header.tsx` | classificação em faixa separada para MEWS e NEWS2, ambas >=3/>=5/>=7 | ews | `499ed204bdfc9c4ab1afa4ab688d5681b39f3c3731e06d7c167a3a06efe4f24c (rt)` |
| `frontend-v2-archive/components/SeverityBadge.tsx` | classificação em faixa de escore >=5 / >=3; caso especial MEWS >=5 | ews | `e539c6bd3a7bb12de95b057fc991ffbf33c5faba2dc3feb6e23518ff611629d0 (rt)` |
| `frontend-v2-archive/components/ScoreDisplay.tsx` | renderização de severidade por instrumento para SOFA, Glasgow, LPP, RASS incl. escalas com direção invertida e flags críticas (SOFA >=13, Glasgow <=8, LPP <=9) | neuro-sedation-scores | `3fbe0dda4b4c0ed198c4fe44ed093861b03a911466485839ab9276b77e65588f (rt)` |
| `_legacy_frontend/src/components/BedCard.tsx` | classificação em faixa de escore >=5 vermelho / >=3 amarelo em cards de leito | ews | `19cc2176dee7c50ea09a5c0f9c3c237a7fc0ffd0946b772357ee74f8304be995 (rt)` |
| `_legacy_frontend/src/components/BedGrid.tsx` | semântica de exibição de severidade do bed-grid | alert-threshold-engine | `b6cc04ba713e06811ae3bd5239b4d6f75b3c83bc86ae947f2522dd7309401119 (rt)` |
| `_legacy_frontend/src/components/AlertPanel.tsx` | semântica de exibição/severidade de alerta | alert-threshold-engine | `477d86a9bd2e67156953387d47a84a5984f028ec74831310c96fa2925c37cb1e (rt)` |
| `_legacy_frontend/src/components/PatientDetail.tsx` | exibição de escore/severidade em nível de paciente | ews | `86cb130da36d72c51ef4ebc6462d3bd944d760ccb66a7f8f09c55f5e28432d76 (rt)` |
| `_legacy_frontend/src/components/ScoreTrendChart.tsx` | semântica de exibição de tendência de escore | ews | `34e6459e72e6c0c6160d54c0c48317013512c86a899cb6f6bd5ad2996be7b239 (rt)` |
| `_legacy_frontend/src/types/index.ts` | definições de tipo/enum clínico do frontend | alert-threshold-engine | `8b6eb73aa1ab41e5ad120ce79cce8beee931532df8b5bd608075edef1e108116 (rt)` |

Contexto (OBSERVED): as varreduras de termo corresponderam a 81 arquivos de
fonte em `frontend-v3` (app/components/lib) e 93 em `frontend-v2-archive` —
predominantemente exibição de severidade fornecida pelo servidor. Os arquivos
listados acima são aqueles onde a semântica clínica é **computada ou
duplicada do lado do cliente** (faixas de escore hardcoded que duplicam os
limiares semeados de MEWS/NEWS2 da migração 0038, e lógica de
severidade/direção por instrumento). INFERENCE: cada um é um hazard de
paridade — limiares do cliente podem divergir do `threshold_config` do
servidor. Os bundles de `storybook-static/` são artefatos de build dessas
fontes e não são inventariados separadamente.

### 2.14 Localizações checadas e encontradas sem conteúdo clínico autônomo (varredura OBSERVED, classificação INFERENCE)

`helm/`, `k8s/`, `infra/`, `infrastructure/`, `docker/`, `design-tokens/`,
`cspell.json`, `Makefile`, `pyproject.toml` (infra/config); `src/intensicare/auth/`
(ABAC/IAM — controle de acesso; vocabulário de papel clínico aparece, mas
nenhuma lógica clínica); `test_fixes.py` (script de dev na raiz);
`pendencias.md`, `PLANS.md`, `GATE_FINAL_BUILD.md`, `STACK_DECISION.md`,
`HANDOFF.yaml`, `audit-results/` (processo/meta); `coverage.xml` (artefato de
build); os três documentos de avaliação/auditoria/prompt não rastreados na
raiz (já fixados em proveniência pelo ciclo 0). Adiados sob DEF-4/DEF-6 no
mapa de cobertura.

## 3. Classificação de cluster — 27 clusters (INFERENCE, aguardando revisão de rodaquino-OMNI)

| Cluster | Regras (índice / em disco incl. regras de lacuna) | Classificação | Racional (uma linha) | IDs de regra de amostra | Workstream |
|---|---|---|---|---|---|
| sepse | 98 / 99 | **clinicamente substantivo** | lógica de rastreio/critérios/bundle de sepse ponta a ponta | RULE-SEPSE-001, RULE-SEPSE-020, RULE-SEPSE-099 | sepsis-scores |
| evolucoes | 77 / 77 | **clinicamente substantivo** | templates de nota clínica, imutabilidade e regras de autoria | RULE-EVOLUCOES-001, RULE-EVOLUCOES-014, RULE-EVOLUCOES-060 | WAVE-1B clinical-documentation-and-forms |
| movimentacao-adt | 70 / 70 | não clínico | mecânica de admissão/alta/transferência e leito, não lógica clínica | RULE-MOVIMENTACAO-ADT-001, RULE-MOVIMENTACAO-ADT-035, RULE-MOVIMENTACAO-ADT-070 | DEFERRED |
| auth-usuarios | 62 / 63 | não clínico | autenticação, RBAC, predicados de permissão | RULE-AUTH-USUARIOS-003, RULE-AUTH-USUARIOS-042, RULE-AUTH-USUARIOS-058 | DEFERRED |
| balanco-hidrico | 62 / 62 | **clinicamente substantivo** | cálculos e limiares de entrada/saída de balanço hídrico | RULE-BALANCO-HIDRICO-002, RULE-BALANCO-HIDRICO-003, RULE-BALANCO-HIDRICO-025 | WAVE-1B organ-support-and-medication-safety |
| operacional-infra | 59 / 62 | não clínico | infraestrutura, workers, mecânica de ambiente | RULE-OPERACIONAL-INFRA-001, RULE-OPERACIONAL-INFRA-060, RULE-OPERACIONAL-INFRA-062 | DEFERRED |
| tenancy-organizacao | 52 / 52 | não clínico | estrutura organizacional multi-tenant, totais de leito/setor ramificados por tipo | RULE-TENANCY-ORGANIZACAO-003, RULE-TENANCY-ORGANIZACAO-015, RULE-TENANCY-ORGANIZACAO-035 | DEFERRED |
| comunicacao | 45 / 46 | não clínico | mecânica de contadores e entrega de chat/notificação | RULE-COMUNICACAO-004, RULE-COMUNICACAO-009, RULE-COMUNICACAO-046 | DEFERRED |
| formularios-clinicos | 43 / 45 | **clinicamente substantivo** | vocabulários de formulário de avaliação clínica por disciplina incl. avaliações neuro/cardio | RULE-FORMULARIOS-CLINICOS-001, RULE-FORMULARIOS-CLINICOS-044, RULE-FORMULARIOS-CLINICOS-045 | neuro-sedation-scores |
| prescricao | 41 / 41 | **clinicamente substantivo** | ciclo de vida de prescrição, interação e segurança de dosagem | RULE-PRESCRICAO-001, RULE-PRESCRICAO-017, RULE-PRESCRICAO-041 | WAVE-1B organ-support-and-medication-safety |
| auditoria-logs | 36 / 36 | não clínico | mecânica de captura e retenção de log de auditoria | RULE-AUDITORIA-LOGS-001, RULE-AUDITORIA-LOGS-018, RULE-AUDITORIA-LOGS-036 | DEFERRED |
| sinais-vitais | 33 / 33 | **clinicamente substantivo** | captura de sinal vital, faixas de validação e semântica de unidade alimentando todo escore | RULE-SINAIS-VITAIS-001, RULE-SINAIS-VITAIS-015, RULE-SINAIS-VITAIS-033 | WAVE-1B data-quality-and-physiological-calculation |
| documentacao-faturamento | 31 / 32 | não clínico | compliance de documentação de faturamento/glosa | RULE-DOCUMENTACAO-FATURAMENTO-001, RULE-DOCUMENTACAO-FATURAMENTO-019, RULE-DOCUMENTACAO-FATURAMENTO-032 | DEFERRED |
| indicadores-etl | 27 / 27 | **clinicamente substantivo** | definições de ETL de indicador clínico/KPI (indicadores micro/macro) | RULE-INDICADORES-ETL-001, RULE-INDICADORES-ETL-014, RULE-INDICADORES-ETL-027 | kpi |
| sedacao | 27 / 27 | **clinicamente substantivo** | avaliação de sedação e regras de dosagem de medicamento (12 entradas de dosagem) | RULE-SEDACAO-001, RULE-SEDACAO-012, RULE-SEDACAO-027 | neuro-sedation-scores |
| alertas | 26 / 29 | **clinicamente substantivo** | contagem de critérios de alerta, mapeamento de cor, rollups em nível de leito | RULE-ALERTAS-001, RULE-ALERTAS-003, RULE-ALERTAS-029 | alert-threshold-engine |
| estabilidade | 26 / 26 | **clinicamente substantivo** | critérios e limiares de estabilidade hemodinâmica | RULE-ESTABILIDADE-001, RULE-ESTABILIDADE-013, RULE-ESTABILIDADE-026 | WAVE-1B organ-support-and-medication-safety |
| ventilacao | 26 / 26 | **clinicamente substantivo** | regras de pathway/cuidado de ventilação | RULE-VENTILACAO-001, RULE-VENTILACAO-015, RULE-VENTILACAO-026 | WAVE-1B organ-support-and-medication-safety |
| cadastros-ui | 20 / 20 | não clínico | mecânica de validação de formulário de UI/cadastro | RULE-CADASTROS-UI-001, RULE-CADASTROS-UI-010, RULE-CADASTROS-UI-020 | DEFERRED |
| clinical-scoring | 18 / 18 | **clinicamente substantivo** | fórmulas de instrumento publicado: sub-escores de SOFA, P/F, PAM, GCS, RASS, escalas de dor, ARDS, FOIS | RULE-CLINICAL-SCORING-001, RULE-CLINICAL-SCORING-013, RULE-CLINICAL-SCORING-018 | SPLIT: regras 001-012 sepsis-scores; 013-018 neuro-sedation-scores |
| trilhas-engine | 18 / 18 | **clinicamente substantivo** | semântica de avaliação/elegibilidade do engine de pathway | RULE-TRILHAS-ENGINE-001, RULE-TRILHAS-ENGINE-009, RULE-TRILHAS-ENGINE-018 | pathways |
| eficiencia | 12 / 12 | **clinicamente substantivo** | critérios de transfusão/adequação (p.ex. coma sem sedação) | RULE-EFICIENCIA-001, RULE-EFICIENCIA-005, RULE-EFICIENCIA-006 | WAVE-1B organ-support-and-medication-safety |
| piora-clinica | 12 / 12 | **clinicamente substantivo** | scoring de detecção de deterioração clínica | RULE-PIORA-CLINICA-001, RULE-PIORA-CLINICA-006, RULE-PIORA-CLINICA-012 | ews |
| nutricao | 11 / 11 | **clinicamente substantivo** | regras de pathway/elegibilidade de nutrição incl. enumeração FOIS | RULE-NUTRICAO-001, RULE-NUTRICAO-002, RULE-NUTRICAO-011 | WAVE-1B organ-support-and-medication-safety |
| profilaxia | 8 / 8 | **clinicamente substantivo** | critérios e dosagem de bundle de profilaxia | RULE-PROFILAXIA-001, RULE-PROFILAXIA-004, RULE-PROFILAXIA-008 | WAVE-1B organ-support-and-medication-safety |
| equilibrio | 4 / 4 | **clinicamente substantivo** | alerting e dosagem de equilíbrio eletrolítico/ácido-base | RULE-EQUILIBRIO-001, RULE-EQUILIBRIO-002, RULE-EQUILIBRIO-004 | WAVE-1B organ-support-and-medication-safety |
| antimicrobiano | 3 / 3 | **clinicamente substantivo** | regras de cor-de-alerta/pathway antimicrobiano | RULE-ANTIMICROBIANO-001, RULE-ANTIMICROBIANO-002, RULE-ANTIMICROBIANO-003 | WAVE-1B organ-support-and-medication-safety |

Resultado: **19 de 27 clusters clinicamente substantivos** (cobrindo 741 das
959 regras em disco), 9 não clínicos (218 regras). A classificação não
clínica é ela própria INFERENCE e reversível em revisão; os motivos de
adiamento são registrados por cluster em `coverage-map.md` seção 5 para que
nada seja silenciosamente descartado.

## 4. Esperado, mas NÃO localizável (itens de condição de parada — registrados, não reconstruídos)

| ID | Esperado | Achado (OBSERVED) |
|---|---|---|
| NL-1 | As fontes de extração upstream para as 959 regras: `Dev-Infra-Grupo-AMH/ahlabs-trilhas` @ `8166c07eaef97ad4f9b2a0e51235f3fc3d0feb7f` e `Dev-Infra-Grupo-AMH/trilhas-frontend` @ `f9656be2660ec2048ce6240b4ac418b7fe7d5a5b` (conforme `docs/rules/INVENTORY.md`) | **NÃO presente no repositório legado local.** Toda citação `repo:path:line` de regra aponta para repositórios que não estão montados. As citações de regra não podem ser re-verificadas contra a fonte última no ciclo 1; apenas os arquivos de regra extraídos (hasheados) podem ser revisados. |
| NL-2 | Implementação em runtime da FOIS (Functional Oral Intake Scale) | **Nenhuma implementação em runtime localizada** em `src/`. A FOIS existe apenas como conteúdo de catálogo/plano: `RULE-CLINICAL-SCORING-018`, `RULE-NUTRICAO-002`, linhas de `docs/plan/traceability-matrix.md`, e uma spec de tela de design. O workstream neuro-sedation-scores deve revisar o conteúdo do catálogo; não há contrapartida de código. |
| NL-3 | Um `registry.json` de 12 pathways | Não existe como tal — ver seção 1 linha 9. |
| NL-4 | Artefatos de sign-off clínico por pathway para as 12 YAMLs | **Não localizados.** Apenas 2 registros de rationale existem entre as 12 pathways (Gate C), confirmando o achado do ciclo-0 de "cobertura limitada de rationale". |
| NL-5 | Blocos `alert_groups` nos nove catálogos YAML de domínio | Confirmado ausente nos nove (a precondição do gate de cobertura de vetor false-green do ciclo-0). |

## 5. Status de revisão

Tudo neste arquivo aguarda revisão por **rodaquino-OMNI** (GDEC-0003). A
importação de qualquer artefato enumerado para a V2 permanece governada por
`docs/00-governance/legacy-import-policy.md` (padrão: não copiar; oito itens
registrados exigidos por importação). Este inventário não toma nenhuma
decisão de importação.
