---
id: REV-NS-07
title: Revisão legada — FOIS (Functional Oral Intake Scale)
label: PROPOSAL
statement: >
  O FOIS não tem implementação na src da V1; existe apenas no catálogo de regras
  predecessor (enum de 7 níveis cujos rótulos correspondem a Crary 2005, com um typo de fonte
  no nível 6), capturado em código de frontend/homecare que não está montado no repositório
  legado fixado. Revisão além do catálogo não é possível. Veredito: VALIDATE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-018-fois-functional-oral-intake-scale-enumeration.md; docs/rules/clinical-scoring/RULE-NUTRICAO-002-fois-functional-oral-intake-scale-enum-of-7-levels.md
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (SHA-256 por arquivo em §1; MATCH contra legacy-pin-cycle-1.md)
  section_or_lines: arquivos inteiros
  date_collected: 2026-08-15
  collector: revisor forense de instrumentos legados de neuro/sedação (ciclo 1, Tarefa 1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (trechos verbatim mais análise do revisor)
  confidence: média
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001]
  hazards: [HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# REV-NS-07 — FOIS

## 1. Conforme implementado (OBSERVED, com limite de localização de fonte)

| Caminho | Linhas | SHA-256 | Manifesto |
|---|---|---|---|
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-018-…md` | arquivo inteiro | `cab66d9ebcdad1a1d1450a41d07cdc2dc2a443caa66e85aaeb224282d200bade` | MATCH |
| `docs/rules/clinical-scoring/RULE-NUTRICAO-002-…md` | arquivo inteiro | `907a3b0e9d99f7d564023476d3ee5e8f6a8dea86a9ce6bc92e88779e0fb1cf76` | MATCH |

- **A `src/intensicare` da V1 não contém implementação de FOIS** (grep de todo o
  repositório por `fois` em `src/` no HEAD fixado: zero hits). O pathway de nutrição
  (`_work/alerts/pathways/nutricao.yaml`) não usa o FOIS como entrada.
- Ambos os registros do catálogo (evidência secundária) documentam a captura do
  predecessor: um enum ordinal de 7 níveis `nivel1..nivel7`, pior→melhor, com rótulos
  pt-BR — `nivel1 Nada por via oral` … `nivel7 Via oral total sem restricoes`; formulário de
  frontend de fonoaudiologia e choices de backend de homecare; um typo de transcrição no
  rótulo do nível 6 ("oucompensacoes"); nenhuma computação realizada sobre o valor.
  Veredito de verificação dentro do catálogo: VERIFIED contra Crary 2005, todos os sete
  rótulos e a partição não-oral (1-3) / oral-total (4-7) corretos.
- **SOURCE NOT LOCATED — não é possível revisar além do catálogo.** As fontes primárias que
  o catálogo cita (`trilhas-frontend src/utils/dataForms/dataFormFonoaudiologo.ts:146-181` e
  `trilha_homecare/models/choices/formulario.py:375-403`, snapshots `f9656be266` /
  `8166c07eae`) são repositórios **não montados** dentro de `/Users/familia/intensicare` no
  HEAD fixado. Conforme a condição de parada, nenhuma reconstrução é tentada; o conteúdo da
  enumeração acima é atribuído ao catálogo, não a fonte verificada.

## 2. Instrumento publicado (SOURCE)

- Crary MA, Mann GDC, Groher ME. *Initial psychometric assessment of a functional oral
  intake scale for dysphagia in stroke patients.* Arch Phys Med Rehabil.
  2005;86(8):1516-1520. Sete níveis ordinais: 1 nada por via oral; 2 dependente de sonda,
  oral mínimo; 3 dependente de sonda, oral consistente; 4 oral total, consistência única;
  5 oral total, múltiplas consistências, preparo especial; 6 oral total, sem preparo
  especial mas com restrições específicas; 7 oral total, sem restrições.

## 3. Análise de discrepância

| Dimensão | Achado | Rótulo |
|---|---|---|
| Enumeração | Conforme o catálogo: 7 níveis, ordenação e rótulos correspondem a Crary 2005 (typo do nível 6 é cosmético). | SOURCE (catálogo) |
| Dado ausente | Não analisável — nenhuma lógica de pontuação/consumo existia; enum apenas-de-captura. | OBSERVED |
| População | O FOIS foi validado em pacientes adultos com AVC; o uso como escala geral de ingestão oral em UTI (o contexto do predecessor) é em si uma extensão de uso pretendido que precisa de aval clínico; uso pediátrico fora de escopo (VAL-0006/0007). | INFERENCE |
| Verificabilidade | Fonte primária não montada → confiança apenas-de-catálogo (média). | OBSERVED |

## 4. Checagem de coerção-zero do HAZ-0005

Não avaliável a partir da fonte disponível: nenhum caminho de código da V1 consome o FOIS. O
catálogo não mostra sentinela de dado ausente dentro do enum (diferente do '' da SDRA), nem
computação a coagir.

## 5. Veredito

**VALIDATE** — a ideia (captura estruturada de FOIS para disfagia/rastreamento de ingestão
oral) é plausível e a transcrição do catálogo corresponde à escala publicada, mas a fonte
primária é não-verificável neste pin e a questão de uso pretendido (população geral de UTI
vs. a população validada de AVC) está em aberto. Qualquer adoção pela V2 exige:
re-verificação contra uma fonte primária montada ou nova autoria a partir de Crary 2005,
ratificação clínica do uso pretendido em UTI, e semântica de evaluation-status para
pacientes não avaliados.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
