---
id: REV-NS-09
title: Revisão legada — lógica do domínio de sedação e desmame (weaning) e uso de instrumento em pathway
label: PROPOSAL
statement: >
  O serviço de avaliação de sedação da V1 é, em grande parte, sólido (validando, não
  coercivo, CAM-ICU com gate por RASS); sua camada de alerting é código morto atrás de um
  import inexistente, com runners que engolem exceção; os YAMLs de pathway de
  sedação/delirium/desmame usam RASS, BPS, CAM-ICU e GCS com faixas majoritariamente
  consistentes com o PADIS, mas com defeitos de fronteira; os critérios de sedação do
  predecessor incluem duas regras quebradas documentadas no catálogo (faixa de RASS
  insatisfazível, critério de desmame com limiares impossíveis e lógica de droga invertida).
  Veredito: REFINE com REJECTs específicos.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_pharmaco_delirium.py; src/intensicare/services/domain_respiratory.py; _work/alerts/pathways/{sedacao,delirium,desmame}.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (SHA-256 por arquivo em §1; MATCH contra legacy-pin-cycle-1.md salvo indicação em contrário)
  section_or_lines: citado por achado
  date_collected: 2026-08-15
  collector: revisor forense de instrumentos legados de neuro/sedação (ciclo 1, Tarefa 1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (trechos verbatim mais análise do revisor)
  confidence: alta
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0019]
  hazards: [HAZ-0005, HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# REV-NS-09 — lógica do domínio de sedação / desmame

## 1. Conforme implementado (OBSERVED, verbatim)

| Caminho | Linhas | SHA-256 | Manifesto |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 219-307, 346-498 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/services/domain_pharmaco_delirium.py` | 21-35, 84-106, 140-162, 176-261, 375-408 | `f6c48a1d9545d66da3a744e0087b090f3648cfe3eb8d6a817f164138f2d9a401` | MATCH |
| `src/intensicare/services/domain_respiratory.py` | 336-415, 735-804 | `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` | MATCH |
| `src/intensicare/services/domain_estabilidade.py` | 250-455, 509-656 | `2c838c4fbb5c368b1e8a1d5a4c8d4b0b22d6458079a3198ca1a0f69ba2b0f7b8` | MATCH |
| `src/intensicare/services/deterioration_trend.py` | 42-67, 189-263 | `61d80a379459f4769d5bf3ab14813f6985a0d00f038f349877d6382b85080870` | MATCH |
| `src/intensicare/services/domain_trilhas_engine.py` | 297-316 | `6dca0013e99a6db21bf92303062bf033c40314a0c79c999896eea3aa04cadd56` | MATCH |
| `_work/alerts/pathways/sedacao.yaml` | arquivo inteiro | `21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657` | MATCH |
| `_work/alerts/pathways/delirium.yaml` | arquivo inteiro | `571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208` | MATCH |
| `_work/alerts/pathways/desmame.yaml` | arquivo inteiro | `808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a` | MATCH |
| `_work/alerts/schema/pathway.schema.json` | 128-170 | `68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEDACAO-003-…md` / `RULE-SEDACAO-004-…md` | arquivos inteiros | `8e68b6414b818f9cbb9ec438ba5f6685d7b53cd64df1040e5b3b58d1d4d1485c` / `8b5a4c9559202a19e8ab3b7015e110a0c07e764d967dd4244c686241b5472588` | MATCH |
| `pyproject.toml` (legado) | 240-246, 305-334 | `716a9354b75face954281e215ee8f21d2d895cbab2ab2a31b159d561a2c4d800` | ABSENT (hash-notado) |
| `docs/plan/_work/alerts/neuro-sedation.yaml` | arquivo inteiro | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` | ABSENT (hash-notado) |

### 1.1 Serviço de avaliação de sedação (`domain_sedacao.py:219-307, 346-498`)

`assess_sedation_pure` valida as faixas de RASS/BPS/NRS (levantando exceção em violação),
mantém escores ausentes como `None`, computa o rótulo do RASS, aplica o gate CAM-ICU
RASS ≤ -4 (REV-NS-05), e persiste via `SedationAssessment`. Nenhuma coerção encontrada
nesse caminho. As consultas de histórico e avaliação-atual são diretas (`:346-418`).

### 1.2 Camada de alerting morta

- `domain_pharmaco_delirium.py:21` — `from maezo.rules.alert_compiler import …`: **nenhum
  pacote `maezo` existe no repositório**; o `pyproject.toml:240-246` legado declara isso
  verbatim ("maezo.rules.alert_compiler does not exist in this repository") e `:318-334`
  exclui os testes da coleta. O módulo — incluindo `run_delirium_batch`,
  `evaluate_sedation_morning_reduction` (checagem de redução matinal SAT ≥50%),
  `evaluate_sedation_rass_camicu`, e `evaluate_all_domains` — é código morto não
  importável. Seu caminho de catálogo também aponta para
  `docs/plan/_work/alerts/neuro-sedation.yaml` (um documento de planejamento), não o
  conjunto fixado `_work/alerts/pathways/`.
- Mesmo se fosse importável, ambos os runners em lote engolem toda exceção de avaliação e
  fazem `continue` (`:97-104`, `:153-160` — "Skip alerts that fail to evaluate (missing
  data, etc.)") — um não-disparo silencioso sem motivo registrado (viola a proibição P-5,
  `evaluation-status-semantics.md` §4).
- `evaluate_sedation_morning_reduction` (`:176-261`): doses ausentes → `fired=False` com
  strings de motivo ("Dados insuficientes…") mas sem status de avaliação; `sedativo_em_uso`
  assume False por padrão, de modo que um estado de sedação desconhecido lê como "nenhum
  sedativo ativo — não aplicável".

### 1.3 Uso de instrumento em pathway (`_work/alerts/pathways/`; semântica de faixa
limite inferior inclusive/superior exclusivo conforme `pathway.schema.json:156`)

- `sedacao.yaml`: faixas de RASS `[-5,-3) critical / [-3,-2) watch / [-2,1) normal / [1,∞)
  urgent` — -3 cai em *watch* embora a descrição defina sedação profunda como -3..-5
  (inconsistência de fronteira, referência cruzada REV-NS-02); as faixas de BPS sinalizam 5
  como moderada vs. >5 de Payen (REV-NS-04); faixas de dose de sedativo em "midazolam
  equivalente" mg/h sem lógica de conversão em lugar algum da src da V1 (a unidade existe
  apenas como rótulo). O bloco de evidência ancora corretamente o PADIS 2018 (doi
  10.1097/CCM.0000000000003299) e nomeia o monitoramento de SAT e CPOT/BPS.
- `delirium.yaml`: booleano CAM-ICU sem estado não-avaliável (REV-NS-05); a entrada de
  faixa de RASS é nomeada `rass_target` enquanto o pathway de sedação nomeia a mesma medição
  `rass_score` — dois nomes para uma entrada de stream; faixas de dose de haloperidol
  (0-5/5-15/≥15 mg/dia) são uma superfície de farmacoterapia com referência cruzada ao
  workstream de farmaco.
- `desmame.yaml`: faixas de RSBI 0-80/80-105/≥105 (ponto de corte 105 de Yang-Tobin
  preservado; a "zona de atenção" 80-105 é institucional); faixas de NIF com normal
  `[-100,-25)` — os valores fisiologicamente mais fortes (< -100, p. ex. -110) caem fora de
  toda faixa; faixas de GCS `[11,∞) normal / [9,11) watch / [0,9) critical` — GCS ≥ 11 como
  ponto de corte de adequação para desmame é uma escolha institucional dentro do debate 8-13
  publicado, e o piso 0 da faixa admite valores impossíveis (REV-NS-01); critérios
  booleanos (tosse eficaz, controle de secreção, gasometria) com rótulo errado `unit: ratio`
  em entradas booleanas/de escore (`glasgow` declarado `unit: ratio`, `:23-26`). Âncoras de
  evidência: diretrizes de desmame ACCP/SCCM/AARC 2001 (doi 10.1378/chest.120.6_suppl.375S).
- Lógica de desmame conectada na src da V1 (`domain_respiratory.py:336-415` bundle
  RATIFICADO: S/F > 315, PEEP ≤ 8, FiO2 ≤ fração 0,40, RSBI < 105, RASS ≥ -2, GCS ≥ 10,
  vasopressor ≤ 0,2, VM ≥ 1 dia — conjuntivo, ausente → não-pronto; `:735-804` bundle
  ancorado em ERS/ATS-2007: GCS > 8 OR RASS ≥ -2) — dois limiares de consciência
  diferentes para a mesma decisão em um mesmo arquivo. `domain_trilhas_engine.py:297-316`
  recusa a avaliação de desmame sem dados de neuro ou de mecânica, com um motivo explícito
  (padrão honesto de não-avaliado).

### 1.4 Critérios de sedação do predecessor (catálogo; `ahlabs-trilhas` não montado)

- RULE-SEDACAO-003: critério de sedação profunda escrito `-3 <= int(rass) <= -5` — um
  **intervalo vazio**; o critério nunca poderia disparar (desconectado). O vetor de teste
  TV-3 de ALERT-NEUROSED-OVERSED-01 no catálogo de planejamento corrige isso explicitamente.
- RULE-SEDACAO-004: critério de prontidão para desmame com `fio2 > 250` e `fr > 250`
  (limiares fisiologicamente impossíveis vs. a intenção documentada FiO2 < 50%, FR > 22),
  checagem de presença-em-vez-de-ausência em dexmedetomidina/morfina, e leituras de nomes
  de campo inexistentes assumindo 0 por padrão (desconectado).

### 1.5 Arquivos adjacentes no escopo (apenas uso de instrumento)

`domain_estabilidade.py` não usa **nenhum instrumento de neuro/sedação** (27 critérios
hemodinâmicos); seu padrão de dado ausente — todo `sem dados` → status "normal" → escore
0/27 → gravidade "estavel" com uma recomendação "ESTÁVEL … manter monitorização"
(`:250-455, 642-656`) — é evidência de HAZ-0005 para o workstream do lado-escore (referência
cruzada, não revisado aqui). `deterioration_trend.py` consome apenas séries persistidas de
MEWS/NEWS2; seu comportamento de dado ausente está conforme (< 3 pontos → `None`, "sem
dado, sem previsão", `:189-220`), embora herde quaisquer escores coagidos-a-zero na série
que ajusta (garbage-in).

## 2. Âncoras publicadas (SOURCE)

- Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — alvo de sedação
  leve, avaliação de rotina de dor/delirium, preferência não-benzodiazepínica.
- Kress JP et al. N Engl J Med. 2000;342(20):1471-1477 (interrupção diária de sedação);
  Girard TD et al. Lancet. 2008;371(9607):126-134 (SAT+SBT pareados).
- Desmame: MacIntyre NR et al. (diretrizes de desmame baseadas em evidência ACCP/SCCM/AARC).
  Chest. 2001;120(6 Suppl):375S-395S; Boles JM et al. Eur Respir J. 2007;29(5):1033-1056;
  ponto de corte de RSBI: Yang KL, Tobin MJ. N Engl J Med. 1991;324(21):1445-1450.

## 3. Análise de discrepância (em nível de domínio)

| Dimensão | Achado | Rótulo |
|---|---|---|
| Alinhamento com diretrizes | Os alvos e limiares que existem (RASS -2..0, conceito de SAT, RSBI 105, âncoras PADIS) são consistentes com a literatura primária citada. | OBSERVED |
| Vivacidade | Toda a camada de alerta de sedação/delirium está morta (erro de import); apenas a API de formulários, o serviço CRUD de sedação, e os alertas de desmame respiratório executam. Os YAMLs de pathway fixados e o catálogo de planejamento são duas definições de alerta divergentes para o mesmo domínio. | OBSERVED |
| Consistência interna | A mesma medição nomeada `rass_score` vs. `rass_target`; dois limiares de consciência para desmame (GCS ≥ 10 AND RASS ≥ -2 vs. GCS > 8 OR RASS ≥ -2); limite de faixa -3 vs. descrição; faixa normal de NIF aberta na extremidade forte; rótulos de unidade errados (`ratio` em GCS/booleanos); "midazolam equivalente" sem conversão. | OBSERVED |
| Dado ausente | Espectro que vai do correto (serviço de sedação, elegibilidade de trilhas, tendência "sem dado, sem previsão") passando por apenas-string-de-motivo (redução matinal) até silencioso (runners que engolem exceção, padrões booleanos). | OBSERVED |
| População | Todos os instrumentos/critérios são adultos; sem gating por idade → VAL-0006/0007, HAZ-0036. | INFERENCE |

## 4. Checagem de coerção-zero do HAZ-0005 (a partir da fonte)

**MISTO.** Conforme: `assess_sedation_pure` (validar-ou-levantar-exceção, `None`
preservado); recusa de desmame do `domain_trilhas_engine` com motivo; recusa por
pontos-mínimos do `deterioration_trend`; gates conjuntivos de desmame falhando com segurança
em ausente. VIOLAÇÕES: runners de alerta que engolem exceção (não-disparo silencioso, sem
motivo registrado — P-5); `sedativo_em_uso` assumindo False por padrão (desconhecido →
"sem sedação"); `cam_icu_positive` assumindo False por padrão em
`evaluate_sedation_rass_camicu` (desconhecido → "sem delirium"); gravidade "normal" emitida
para RASS ausente (REV-NS-02). Tudo no módulo morto, mas define a intenção legada que a V2
não deve herdar.

## 5. Veredito

**REFINE** — carregar adiante: o design de validação/persistência do serviço de sedação, os
alvos ancorados em PADIS, os conceitos pareados de SAT/SBT e de bundle de desmame, o padrão
de confirmação em duas avaliações consecutivas, e os padrões de recusa honesta de
trilhas/tendência. **REJEITAR** (com testes negativos): o intervalo vazio da
RULE-SEDACAO-003; a RULE-SEDACAO-004 por completo (limiares impossíveis, lógica invertida
de ausência-de-droga, leituras de campo erradas); a avaliação de alerta que engole exceção;
os padrões desconhecido-como-False em `sedativo_em_uso`/`cam_icu_positive`. **VALIDATE**
antes de reuso: todo limite de faixa de pathway nomeado em §1.3, o ponto de corte GCS ≥ 11
de desmame, os limiares duplos de consciência para desmame (escolher um, ratificado
clinicamente), e a unidade "midazolam equivalente" (exige uma tabela de equivalência real ou
remoção). A camada de alerta morta como arquitetura é **SUPERSEDE** — o design de alerting
da V2 a substitui; apenas o conteúdo clínico destilado acima sobrevive.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
