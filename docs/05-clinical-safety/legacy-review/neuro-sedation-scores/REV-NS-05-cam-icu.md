---
id: REV-NS-05
title: Revisão legada — lógica de rastreio CAM-ICU / delirium
label: PROPOSAL
statement: >
  A V1 implementa a álgebra booleana correta do CAM-ICU (F1 AND F2 AND (F3 OR F4)) e um gate
  correto de sedação profunda (RASS <= -4 -> não avaliável) no serviço de sedação, mas o
  caminho paralelo de formulários clínicos assume por padrão um rastreio negativo para
  features ausentes e só bloqueia em RASS exatamente -5; o módulo de alert-runner é código
  morto não importável e uma citação de catálogo está errada. Veredito: REFINE em geral;
  caminho de formulários REJECT.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_formularios.py; _work/alerts/pathways/delirium.yaml; docs/plan/_work/alerts/neuro-sedation.yaml
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
  requirements: [SAF-0001, SAF-0002]
  hazards: [HAZ-0005, HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# REV-NS-05 — lógica CAM-ICU / delirium

## 1. Conforme implementado (OBSERVED, verbatim)

| Caminho | Linhas | SHA-256 | Manifesto |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 1-24, 47-68, 162-211, 268-291, 556-613 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 46-63, 110-165, 487-490, 700-725 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `src/intensicare/models/sedacao.py` | 40-47 | `b790b4b0e7be1550f7b5276a9ec8f1504b056b7db8f668a063f79913dd419c8b` | MATCH |
| `src/intensicare/schemas/sedacao.py` | 13-28 | `bd432d9a5b4144380eaed1c6518b10465612c95d9d7e33468053114e0e44992d` | MATCH |
| `_work/alerts/pathways/delirium.yaml` | 17-41, 91-114 | `571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208` | MATCH |
| `docs/plan/_work/alerts/neuro-sedation.yaml` | blocos ALERT-NEUROSED-DELIRIUM-04, -SCREEN-GAP-05 | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` | ABSENT (hash-notado) |
| `docs/rules/clinical-scoring/RULE-EFICIENCIA-010-…md` | arquivo inteiro | `28c5207f984644b194724b51bf844ff5775b25d0be819591dc0c308bd39dd74a` | MATCH |
| `tests/test_domain_sedacao.py` | suítes CAM-ICU + gate-sedação-profunda | ver README §4 | ABSENT (hash-notado) |

### 1.1 Algoritmo do serviço de sedação (`domain_sedacao.py`)

- `_evaluate_cam_icu` (`:162-211`), núcleo verbatim:
  `is_positive = f.inicio_agudo and f.desatencao and (f.pensamento_desorganizado or
  f.nivel_consciencia_alterado)` — isto é, Feature 1 AND Feature 2 AND (pensamento
  desorganizado OR nível de consciência alterado).
- **Gate de sedação profunda** (`:271-291` e `evaluate_cam_icu_batch:575-590`): se
  `rass_score <= -4`, o CAM-ICU não é avaliado — `cam_icu_positive = None`,
  `cam_icu_assessable = False`, recomendação "Paciente profundamente sedado (RASS <= -4).
  CAM-ICU não avaliável. Reavaliar após redução da sedação." Os testes asseguram isso
  (`tests/test_domain_sedacao.py`, suíte de gate-sedação-profunda).
- Numeração de feature: a V1 rotula Feature 3 = LOC alterado e Feature 4 = pensamento
  desorganizado (convenção de flowsheet); a álgebra é idêntica à regra publicada de
  qualquer forma. A **docstring** do módulo (`:16-23`) também assere "(Feature 1 OR
  Feature 2) AND Feature 3 AND Feature 4" como a "Standardized approach (PADIS 2018 /
  SCCM)" — essa fórmula está errada; o código não a implementa. Apenas divergência
  comentário/código.
- Features ausentes em `_evaluate_cam_icu` assumem `False` por padrão
  (`:194-199`; teste "Missing CAM-ICU feature keys default to False") — um dict vazio
  avalia como um rastreio **negativo**. O gate se aplica apenas quando `rass_score` é
  fornecido; com `rass_score=None` e features presentes, o CAM-ICU é avaliado sem gate
  (`:274`).
- Feature 3 ("LOC alterado = RASS atual != 0", nota de schema `schemas/sedacao.py:20-22`)
  é aceita como um booleano fornecido de forma independente pelo chamador; nunca é derivada
  de nem checada contra o RASS submetido.

### 1.2 Caminho de formulários clínicos (`domain_formularios.py`)

- `_calculate_cam_icu` (`:700-725`): mesma álgebra; **features ausentes assumem `False` por
  padrão → 0.0 → gravidade "delirium_negativo"** (`:487-490`) — um rastreio negativo
  persistido a partir de dado ausente.
- Invariante cross-field (`:110-134, 156-165`): a submissão de CAM-ICU é bloqueada **apenas
  quando o RASS mais recente é exatamente igual a -5.0** (`blocking_value: -5.0,
  blocking_condition: "eq"`). Um paciente com RASS -4 pode receber um CAM-ICU pontuado por
  esse caminho — contradizendo tanto o instrumento publicado quanto o próprio gate do
  serviço de sedação da V1.

### 1.3 Pathway e catálogos

- `delirium.yaml:31-41`: o critério `crit-del-cam` é `boolean cam_icu == true`; não há
  estado `nao_avaliavel` em nível de pathway, e uma entrada ausente simplesmente nunca
  dispara (não-disparo silencioso). Estados: CAM-ICU-positivo aciona
  `delirium_identificado`; a resolução exige ">48h negativo" (`:98-114`).
- `docs/plan/_work/alerts/neuro-sedation.yaml` (catálogo de planejamento): modela o CAM-ICU
  como enum `{positivo, negativo, nao_avaliavel}` com um vetor de fronteira explícito
  "não-avaliável NÃO é positivo; sem disparo, mas alimenta o relógio de cadência de
  SCREEN-GAP", mais um alerta de lacuna-de-rastreio >24h (vigilância de delirium
  hipoativo). **Defeito de citação**: cita "Ely EW et al. NEJM 2001;345(14):1013-1020"
  para a validade do CAM-ICU — o estudo de validade/confiabilidade é JAMA
  2001;286(21):2703-2710 (verificado em 2026-08-15). Este catálogo só é carregado pelo
  runner morto (§1.4).
- Bundle predecessor de risco de delirium RULE-EFICIENCIA-010: OR ad-hoc de fatores de
  risco tipo PRE-DELIRIC; desconectado e contém um crash (`int(rass) in range[1, 5]` —
  TypeError) e um subbloco de dor insatisfazível. Documentado para não ser reproposto.

### 1.4 Caminho de código morto

`domain_pharmaco_delirium.py` (runner do catálogo de delirium e do avaliador integrado
RASS/CAM-ICU) importa `maezo.rules.alert_compiler`; nenhum pacote `maezo` existe em lugar
algum do repositório. O próprio `pyproject.toml:240-246` e `:305-334` do repositório legado
(SHA-256 `716a9354b75face954281e215ee8f21d2d895cbab2ab2a31b159d561a2c4d800`, ausente do
manifesto, hash-notado) declara isso verbatim e exclui os testes. Tudo no catálogo de
planejamento do §1.3 é, portanto, **não-executante**.

## 2. Instrumento publicado (SOURCE)

- Ely EW et al. *Delirium in mechanically ventilated patients: validity and reliability of
  the Confusion Assessment Method for the intensive care unit (CAM-ICU).* JAMA.
  2001;286(21):2703-2710. Delirium = início agudo/curso flutuante AND desatenção AND
  (pensamento desorganizado OR nível de consciência alterado); pacientes não despertáveis à
  voz (RASS -4/-5) não são avaliáveis — reavaliar depois.
- Ely EW et al. *Evaluation of delirium in critically ill patients: validation of the
  CAM-ICU.* Crit Care Med. 2001;29(7):1370-1379.
- Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — rastreio de rotina
  com CAM-ICU (ou ICDSC); sequência de avaliação RASS-primeiro.

## 3. Análise de discrepância

| Dimensão | Achado | Rótulo |
|---|---|---|
| Algoritmo | A álgebra booleana corresponde a Ely 2001 em ambas as implementações. A troca de rótulo de numeração de feature é cosmética; a fórmula alternativa da docstring está errada mas não é executada. | OBSERVED |
| Gate de avaliabilidade | Serviço de sedação: RASS ≤ -4 → não avaliável (**corresponde ao publicado**). Caminho de formulários: bloqueia apenas RASS == -5 (**desvia** — RASS -4 também deveria ser não avaliável). Dois gates contraditórios para um instrumento. | OBSERVED |
| Dado ausente | Ambos os avaliadores assumem features ausentes como False por padrão → rastreio negativo. Um negativo produzido sem dado algum é indistinguível de um negativo verdadeiro no registro persistido (`cam_icu_positive=False`). | OBSERVED |
| Enumeração | A persistência é booleana/None (`models/sedacao.py:40-44`); a realidade clínica de três estados (positivo/negativo/não-avaliável) só é representável como None, que também significa "não tentado". O enum `{positivo, negativo, nao_avaliavel}` do catálogo de planejamento tem a forma correta, mas está morto. | OBSERVED / INFERENCE |
| Consistência interna | Feature 3 não é checada contra o RASS; o pathway não tem estado não-avaliável; erro de citação no catálogo (NEJM vs JAMA). | OBSERVED |
| População | CAM-ICU é validado para adultos (os equivalentes pediátricos psCAM-ICU/pCAM-ICU são instrumentos distintos); sem gating por idade → VAL-0006/0007, HAZ-0036. | INFERENCE |

## 4. Checagem de coerção-zero do HAZ-0005 (a partir da fonte)

**MISTO.** Conforme: o gate RASS ≤ -4 retorna `None` + "não avaliável" em vez de um valor
(o melhor comportamento de dado ausente encontrado em todo este cluster). VIOLAÇÃO:
features ausentes → `False` → "delirium_negativo" (o caminho de formulários persiste isso;
o serviço de sedação avalia um conjunto de features vazio como um negativo); entrada
ausente em nível de pathway → não-disparo silencioso sem motivo registrado (P-5); CAM-ICU
sem RASS acompanhante é avaliado sem gate.

## 5. Veredito

**REFINE** em geral — o algoritmo do serviço de sedação e seu gate de sedação profunda
estão corretos e valem a pena carregar como a semântica de referência da V2, estendida para
um resultado de três estados de primeira classe ({positive, negative, not_assessable}) com
o gate em RASS ≤ -4 aplicado em todo ponto de entrada. **REJEITAR** o bloqueio
apenas-RASS==-5 do caminho de formulários e todo padrão features-ausentes → negativo
(features ausentes = `not_evaluated`). Corrigir a citação JAMA. O módulo runner morto é
substituído pela arquitetura de alerting que a V2 decidir (referência cruzada REV-NS-09).

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
