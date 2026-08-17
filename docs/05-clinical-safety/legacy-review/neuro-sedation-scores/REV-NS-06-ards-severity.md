---
id: REV-NS-06
title: Revisão legada — enumeração de gravidade SDRA/ARDS
label: PROPOSAL
statement: >
  Nenhum classificador de gravidade de ARDS existe na src da V1; o único artefato formal é o
  enum SDRAChoices do catálogo predecessor (leve/moderada/grave mais um sentinela vazio), cujos
  rótulos correspondem à taxonomia de Berlim mas cujo campo de model foi comentado (morto), e
  que não codifica pontos de corte PaO2/FiO2. A V1 usa "SDRA grave" apenas como uma indicação
  de sedação profunda derivada/texto-livre. Veredito: SUPERSEDE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-017-sdra-ards-severity-enumeration.md; src/intensicare/services/domain_pharmaco_delirium.py; docs/plan/_work/alerts/neuro-sedation.yaml
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
  requirements: [SAF-0001]
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# REV-NS-06 — enumeração de gravidade SDRA/ARDS

## 1. Conforme implementado (OBSERVED)

| Caminho | Linhas | SHA-256 | Manifesto |
|---|---|---|---|
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-017-…md` | arquivo inteiro | `a4f9e9778397f504f4d45ebe7f6cbf72327f6737d9302baf95209334ceac20b5` | MATCH |
| `src/intensicare/services/domain_pharmaco_delirium.py` | 322-326 | `f6c48a1d9545d66da3a744e0087b090f3648cfe3eb8d6a817f164138f2d9a401` | MATCH |
| `docs/plan/_work/alerts/neuro-sedation.yaml` | linhas de entrada `indicacao_sedacao_profunda` | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` | ABSENT (hash-notado) |

- **A `src/intensicare` da V1 não contém classificador, campo de model, campo de schema ou
  enumeração de gravidade de ARDS/SDRA** (verificado por grep de todo o repositório por
  `sdra`/`ards` em `src/intensicare/models/`, `schemas/`, `services/` no HEAD fixado — os
  únicos hits são strings de texto livre). "SDRA grave" aparece apenas: (a) dentro de uma
  string de recomendação pt-BR do alerta de sedação profunda
  (`domain_pharmaco_delirium.py:322-326` — "…se não houver indicação específica (ex.: SDRA
  grave, hipertensão intracraniana, BNM)"); e (b) como uma das fontes do *booleano derivado*
  `indicacao_sedacao_profunda` ("SDRA grave/ECMO/BNM/HIC/EME") no catálogo de planejamento,
  que só é carregado pelo runner morto (REV-NS-05 §1.4).
- Catálogo predecessor (RULE-CLINICAL-SCORING-017, evidência secundária — o snapshot fonte
  `ahlabs-trilhas` que cita **não está montado** no repositório legado fixado):
  `SDRAChoices` = `leve (Leve) / moderada (Moderada) / grave (Grave) / '' (Nao informado)`;
  o campo de model consumidor `DadosProntuario.sdra` estava **comentado** (código morto);
  testes legados ainda referenciavam o campo removido; nenhum ponto de corte PaO2/FiO2
  codificado em lugar algum; critérios de sedação anteriores que referenciavam "SDRA
  moderada ou grave" foram removidos.

## 2. Instrumento publicado (SOURCE)

- ARDS Definition Task Force (Ranieri VM et al.). *Acute respiratory distress syndrome: the
  Berlin Definition.* JAMA. 2012;307(23):2526-2533. Leve 200 < PaO2/FiO2 ≤ 300; moderada
  100 < PaO2/FiO2 ≤ 200; grave PaO2/FiO2 ≤ 100 — todas com PEEP/CPAP ≥ 5 cmH2O, com critérios
  de tempo, imagem e origem do edema.
- Atualização da definição global 2023: Matthay MA et al. *A New Global Definition of Acute
  Respiratory Distress Syndrome.* Am J Respir Crit Care Med. 2024;209(1):37-47 — admite
  SpO2/FiO2 ≤ 315 (SpO2 ≤ 97%) como critério de oxigenação diagnóstico, HFNO ≥ 30 L/min como
  modalidade de suporte qualificadora, e ultrassom para imagem — diretamente relevante para a
  V2 porque o pipeline respiratório da V1 é centrado em razão S/F (`domain_respiratory.py`,
  referência cruzada ao workstream respiratório).

## 3. Análise de discrepância

| Dimensão | Achado | Rótulo |
|---|---|---|
| Taxonomia | leve/moderada/grave mapeia 1:1 para leve/moderada/grave de Berlim; o sentinela '' "Nao informado" não tem contrapartida em Berlim (um valor de dado ausente dentro de um enum clínico — o padrão adjacente ao HAZ-0005 de codificar ausência no domínio de valores). | OBSERVED |
| Pontos de corte | Nenhum codificado em lugar algum; o enum é apenas-rótulo, de modo que a gravidade era o que quer que o autor digitasse — nenhuma relação computável com PaO2/FiO2, PEEP, tempo, imagem. | OBSERVED |
| Vivacidade | Morto no predecessor (campo comentado) e nunca implementado na src da V1. O único uso vivo da gravidade de ARDS é como uma justificativa de supressão não estruturada para sedação profunda, em código de alerta morto. | OBSERVED |
| Consequência | O gate de indicação de sedação profunda (`indicacao_sedacao_profunda`) depende de uma classificação que o sistema não consegue computar — se a V2 carregar esse gate, precisará de uma entrada de classificação de ARDS real e evidenciada ou um campo de atestação humana explícito. | INFERENCE |
| População | As definições de Berlim/2023 são focadas em adultos (ARDS pediátrica usa PALICC-2) → VAL-0006/0007. | INFERENCE |

## 4. Checagem de coerção-zero do HAZ-0005 (a partir da fonte)

Nenhum caminho de coerção vivo existe (o instrumento não está implementado). Resíduo
relevante para hazard: o membro '' "Nao informado" dentro do enum de valores (ausência
representável como uma categoria da própria dimensão clínica), e a dependência de um gate de
segurança de sedação em uma classificação não-computável (uma classificação ausente leria
silenciosamente como "sem indicação para sedação profunda" via o padrão booleano) —
sinalizado para o design da V2.

## 5. Veredito

**SUPERSEDE** — não há nada a importar: o enum está morto, sem pontos de corte, e
apenas-rótulo. A V2 deve desenhar a gravidade de ARDS nativamente contra Berlim 2012,
decidindo explicitamente (governança clínica) se adota as extensões da definição global 2023
(oxigenação baseada em S/F, HFNO), com `evaluation_status` em vez de um sentinela "Nao
informado" dentro da faixa de valores, e com a vinculação à indicação de sedação profunda
tornada uma entrada explícita e atestável.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
