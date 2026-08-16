---
doc_id: OPS-13-SONDAS-SINTETICAS
status: PROPOSAL
owner: AUTH-OPERATIONS (detida por rodaquino-OMNI, DEC-G0-06) — ratificação VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.4 ("synthetic end-to-end safety probes with
  strict PHI redaction"), §15.3, §14 (camadas de teste exigidas), §20;
  docs/06-architecture/adrs/ADR-0020-observabilidade-slos-backup-dr.md O1/O3;
  GDEC-0013..0017 (dados sintéticos como default vinculante; marcador SYNTH-);
  packages/observabilidade/src/probes.ts e probes.test.ts
date_collected: 2026-08-16
collector: agente de prontidão operacional (ciclo 6, sprint SPR-G8-1)
last_updated: 2026-08-16
---

# Sondas sintéticas de segurança ponta a ponta

## 1. O problema que a sonda resolve

INFERENCE (do prompt §9.4 combinado com §1): um sistema de vigilância clínica cujo laço
quebrou em silêncio é **indistinguível, pelas métricas de volume, de um sistema em que
ninguém deteriorou**. As duas situações produzem exatamente o mesmo dado: zero alertas.

Nenhuma métrica de contagem separa essas duas hipóteses. A sonda sintética separa: ela
exercita o laço inteiro com dados fabricados que **deveriam** produzir um item de trabalho,
e reprova quando não produzem.

## 2. O que a sonda exercita

Passos, na ordem (`PROBE_STEPS` em `packages/observabilidade/src/probes.ts`):

| # | Passo | Verifica |
|---|---|---|
| 1 | `ingest` | A borda aceita observações sintéticas e as persiste com proveniência |
| 2 | `evaluate` | A regra clínica avalia e produz estado `valid` |
| 3 | `raise_work_item` | Um item de trabalho **durável** é criado a partir da avaliação |
| 4 | `read_projection` | O item aparece na projeção de leitura |
| 5 | `acknowledge` | O reconhecimento com controle de concorrência é aceito |

Um passo reprovado **interrompe** a sonda ali e classifica a falha em categoria fechada
(`ingest_rejected`, `rule_evaluation_failure`, `persistence_failure`,
`projection_rebuild_failure`, `delivery_failure`). Reprovação é **resultado publicado**, não
exceção — um sinal que ninguém publica não é sinal.

## 3. Dado real é proibido, e isso é verificado

`assertSyntheticSubject` recusa qualquer referência de sujeito sem o marcador `SYNTH-`, e a
recusa acontece **antes de qualquer passo** (teste: nenhum método do driver é chamado).

Razão: uma sonda rodando sobre um paciente real criaria um **alerta clínico falso sobre uma
pessoa** — e esse é o pior modo de falha imaginável desta funcionalidade. É pior do que a
sonda não existir.

Além disso, o identificador da própria sonda é varrido contra formas de PHI, e a referência
sintética **não aparece na telemetria**: o que viaja é `probe.ref` pseudonimizado
(`op_` + 16 hex). Verificado por teste de não-vazamento.

## 4. Limpeza obrigatória

O driver precisa implementar `cleanup`, e ele é executado **mesmo quando um passo lança**
(bloco `finally`, verificado por teste). Sem isso, a sonda poluiria a série clínica com
itens de trabalho fabricados — que apareceriam em painéis, em contagens de carga de alerta
e, potencialmente, na frente de um clínico.

## 5. Periodicidade sem relógio interno

`dueProbes(agendas, agora)` é uma função pura: o instante entra por parâmetro e não há
`setInterval`. Isso mantém o teste determinístico e mantém o pacote sem relógio próprio
(mesma disciplina do kernel clínico).

**O que falta:** um agendador real (job de plataforma, cron, verificador externo). Ele exige
ambiente de implantação — ADR-0019, não materializado. **Hoje nenhuma sonda é executada
periodicamente por ninguém** (P-OPS-07).

## 6. Inversão de dependência (por que o driver é injetado)

`packages/observabilidade` só pode depender de `@intensicare/dominio`
(`scripts/check_module_boundaries.mjs`). Ele não pode importar persistência nem a API. Por
isso a sonda define a interface `SafetyLoopProbeDriver` e quem tem acesso ao laço real a
implementa — hoje, apenas um driver falso no próprio teste.

Consequência honesta: **a sonda foi verificada contra um driver falso**. Ela ainda não
exercitou o laço real de `apps/api` nem uma vez. Isso é P-OPS-01.

## 7. Como interpretar o resultado

| Situação | Leitura correta |
|---|---|
| `passed` | O laço respondeu para dado sintético **neste processo, neste instante**. Não é prova de correção clínica nem de desempenho sob carga |
| `failed` em `evaluate` | A regra parou de produzir avaliação válida — candidato imediato a S1/S2 no runbook de incidente |
| `failed` em `raise_work_item` | O laço quebra **depois** de avaliar: pior caso silencioso, porque a avaliação parece funcionar |
| `failed` em `read_projection` ou `acknowledge` | O clínico pode não ver ou não conseguir agir sobre o que existe |
| sonda **não executada** | Estado atual. Ausência de execução não é `passed` — e não deve ser exibida como tal em painel algum |

## 8. O que a sonda NÃO prova

- Não prova correção clínica da regra (isso é vetor de referência e validação clínica).
- Não prova desempenho sob carga (isso é teste de carga medido, que não existe).
- Não prova que alertas reais chegam a pessoas reais (isso exige entrega e usuários).
- Não substitui o exercício de modo degradado exigido pelo Gate G8.
