---
doc_id: OPS-13-SLOS-PROPOSTOS
status: PROPOSAL
owner: AUTH-OPERATIONS (detida por rodaquino-OMNI, DEC-G0-06) — ratificação VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.3 (lista de SLOs), Gate G8, §20;
  docs/06-architecture/adrs/ADR-0020-observabilidade-slos-backup-dr.md O2 (SLOs medidos,
  metas adiadas) e T1 (gatilho de revisita);
  docs/06-architecture/quality-attributes/quality-attribute-scenarios.md (QAS-0001..0029,
  todos com target VALIDATION REQUIRED);
  packages/observabilidade/src/metric-catalog.ts (catálogo de instrumentos)
date_collected: 2026-08-16
collector: agente de prontidão operacional (ciclo 6, sprint SPR-G8-1)
last_updated: 2026-08-16
---

# SLIs e SLOs propostos

> **Nenhum número aparece neste documento como se fosse acordado.** SOURCE (prompt §15.3):
> "Define SLOs and error budgets **from validated user/safety needs**". Essas necessidades
> não existem (Gate G1 aberto). SOURCE (ADR-0020 D2): "Medir desde já; fixar alvo depois —
> nunca inventar número". Este documento define **o que medir, com que instrumento e sob
> quais condições**; **quanto** é matéria do G1 e do titular clínico.

## 1. Por que uma meta inventada é pior do que uma lacuna

INFERENCE (de `quality-attribute-scenarios.md` §introdução, lido em disco): um número
plausível escrito aqui seria lido a jusante como requisito, propagaria para desenhos e
testes, e acabaria defendido como se tivesse sido validado. Esse modo de falha — um alvo
inventado adquirindo autoridade por repetição — é mais danoso do que uma lacuna admitida.
A lacuna é honesta e visível; o número falso é invisível e vira dívida clínica.

Consequência operacional: **não há orçamento de erro (error budget) nesta fase.** Orçamento
de erro é derivado da meta; sem meta, não existe. Qualquer painel que mostre "consumo de
orçamento" antes do G1 estará mostrando ficção.

## 2. Estrutura de cada SLI

| Campo | Significado |
|---|---|
| **SLI** | O indicador: o que é medido, em que unidade. |
| **Instrumento** | Nome catalogado em `packages/observabilidade/src/metric-catalog.ts`. Nome fora do catálogo não compila. |
| **QAS** | Cenário de atributo de qualidade correspondente. |
| **Condições obrigatórias** | Ambientes degradados em que o indicador também deve valer (prompt §1: normal, ausente, obsoleto, duplicado, atrasado, conflitante, corrigido, não autorizado, desconectado, parcialmente falho). |
| **Meta** | Sempre `VALIDATION REQUIRED (G1)`. |
| **Mensurável hoje?** | Veredito honesto sobre o estado atual (ver `README.md` §3). |

## 3. Catálogo de SLIs propostos

### 3.1 Laço mínimo de segurança — latência e perda (§15.3 b1–b4)

| SLI | Instrumento | QAS | Condições obrigatórias | Meta | Mensurável hoje? |
|---|---|---|---|---|---|
| Latência fonte→aceito | `intensicare.clinical.pipeline.latency` (`stage=source_to_accepted`) | QAS-0001 | fonte lenta, fonte intermitente, lote grande, relógio da fonte divergente | VALIDATION REQUIRED (G1) | Não — sem conector à AMH |
| **Perda** fonte→aceito | `intensicare.clinical.pipeline.loss.total` | QAS-0002 | rejeição de esquema, quarentena, duplicata | VALIDATION REQUIRED (G1) | Não — idem |
| Latência aceito→avaliação | `intensicare.clinical.evaluation.duration` | QAS-0003 | insumo ausente, insumo obsoleto, regra desligada | VALIDATION REQUIRED (G1) | Instrumentada, não conectada |
| Latência avaliação→item durável | `intensicare.clinical.pipeline.latency` (`stage=evaluation_to_durable_work_item`) | QAS-0004 | falha de commit, conflito de versão | VALIDATION REQUIRED (G1) | Instrumentada, não conectada — **e hoje intratransacional** (ver README §3, D03) |
| Latência gerado→visível | `...pipeline.latency` (`stage=generated_to_visible`) | QAS-0005 | canal de tempo real caído, projeção atrasada, cliente desconectado | VALIDATION REQUIRED (G1) | Não — `apps/web` não instrumentado |
| Latência gerado→reconhecido | `...pipeline.latency` (`stage=generated_to_acknowledged`) | QAS-0006 | plantão sobrecarregado, troca de turno | VALIDATION REQUIRED (G1) | Não |

**Pré-condição estrutural (SOURCE: `quality-attribute-scenarios.md` §1.3 P6):** todo SLI
acima é um intervalo entre dois instantes registrados. Um sistema que não persiste os
instantes distintos (observado, efetivo, emitido, recebido, persistido, avaliado, alertado,
exibido, reconhecido, agido, corrigido, reconciliado) **não consegue reportar estes SLOs
depois nem reconstruí-los retroativamente**. Instrumentar os pontos de tempo é
pré-condição do programa de SLO, não consequência dele.

### 3.2 Qualidade de dado e de avaliação (§15.3 b5)

| SLI | Instrumento | QAS | Meta | Mensurável hoje? |
|---|---|---|---|---|
| Prevalência por estado de avaliação (`valid`/`partial`/`not_evaluated`/`stale`/`invalid`) | `intensicare.clinical.evaluation.total` por `status` | QAS-0007 | VALIDATION REQUIRED (G1) | Instrumentada, não conectada — o kernel **já produz** o dado |
| Taxa de insumo ausente por parâmetro | `intensicare.clinical.evaluation.missing_input.total` ÷ `...evaluation.total` | QAS-0007 | VALIDATION REQUIRED (G1) | Idem |

**Regra de cálculo imposta em código:** quando o denominador é zero, a taxa é `null`
(indefinida), **nunca `0`**. Taxa zero e taxa indefinida significam coisas clinicamente
diferentes; colapsá-las é a mesma coerção que o DOM-0004 proíbe no dado clínico.
Verificado por teste (`instrumentation.test.ts`).

### 3.3 Backbone, projeções e reconciliação (§15.3 b6)

| SLI | Instrumento | QAS | Meta | Mensurável hoje? |
|---|---|---|---|---|
| Profundidade do outbox | `intensicare.backbone.outbox.depth` | QAS-0008 | VALIDATION REQUIRED (G1) | **Não — não existe publicador**; a profundidade só cresceria |
| Backlog de replay | `intensicare.backbone.replay.backlog` | QAS-0008 | VALIDATION REQUIRED (G1) | Não |
| Lag de projeção | `intensicare.backbone.projection.lag` | QAS-0009 | VALIDATION REQUIRED (G1) | Não — projeção é lida direto do banco, sem worker |
| Divergência de reconciliação entre lanes | `intensicare.backbone.reconciliation.divergence.total` | QAS-0010 | VALIDATION REQUIRED (G1) | Não — ADR-0006 não materializado em código |

### 3.4 Regra clínica (§15.3 b7)

| SLI | Instrumento | QAS | Meta | Mensurável hoje? |
|---|---|---|---|---|
| Disponibilidade do bundle por estado | `intensicare.clinical.rule_bundle.availability` | QAS-0011 | VALIDATION REQUIRED (G1) | Parcial — estado em processo |
| Avaliações contra versão de regra não verificada | derivado: `...evaluation.total` com `rule` fora do conjunto aprovado | QAS-0011 | **Zero é invariante, não meta** (SOURCE: QAS-0011) | Não verificado ponta a ponta |
| Tempo de atuação do kill switch | não instrumentado | QAS-0011 | VALIDATION REQUIRED (G1) | **Não — exige drill multi-instância** (ADR-0007 H3) |

> A linha "avaliações contra versão não verificada = zero" é a única do documento que tem
> um valor numérico, e ela **não é uma meta**: é um invariante já expresso pelo QAS-0011.
> Invariante violado é defeito, não consumo de orçamento.

### 3.5 Conectores (§15.3 b8)

| SLI | Instrumento | QAS | Meta | Mensurável hoje? |
|---|---|---|---|---|
| Disponibilidade de conector | `intensicare.ops.connector.unavailable.total` | QAS-0012 | VALIDATION REQUIRED (G1) | Não — **0 vias acionáveis; 47/47 inelegíveis; `Observation` AMH não consumível** |
| Drift de contrato | `intensicare.ops.contract_drift.total` | QAS-0013 | VALIDATION REQUIRED (G1) | Não |

### 3.6 Isolamento e acesso (§15.3 b9)

| SLI | Instrumento | QAS | Meta | Mensurável hoje? |
|---|---|---|---|---|
| Negativas cross-tenant | `intensicare.ops.policy_denial.total` (`kind=cross_tenant`) | QAS-0014 | **Zero acesso cross-tenant bem-sucedido é invariante**; a taxa de tentativas negadas é a série | Mecanismo testado (RLS forçada); série não conectada |
| Acesso suspeito | `...policy_denial.total` (`kind=suspicious_access`) | QAS-0014 | VALIDATION REQUIRED — **a definição de "suspeito" também é VALIDATION REQUIRED**, e não foi inventada aqui | Não |

### 3.7 Backup, restore e evidência (§15.3 b10)

| SLI | Instrumento | QAS | Meta | Mensurável hoje? |
|---|---|---|---|---|
| Sucesso de backup | `intensicare.ops.backup.result.total` | QAS-0015 | VALIDATION REQUIRED (G1) | **Não — não há estado durável** (PGlite em memória) |
| Integridade de restore (ensaio) | `intensicare.ops.restore.integrity.total` | QAS-0015 | VALIDATION REQUIRED (G1) | Não |
| RPO / RTO medidos | não instrumentado (medidos no ensaio, não em série contínua) | QAS-0015 | VALIDATION REQUIRED (G1) | **Não — exige ambiente e ensaio humano** |
| Integridade de exportação de evidência | `intensicare.ops.evidence_export.integrity.total` | QAS-0016 | VALIDATION REQUIRED (G1) | Não |

### 3.8 Prontidão e degradação (§15.3, parágrafo de fechamento)

| SLI | Instrumento | QAS | Meta | Mensurável hoje? |
|---|---|---|---|---|
| Vereditos de prontidão por classe | `intensicare.ops.readiness.verdict.total` | QAS-0029 | VALIDATION REQUIRED (G1) | Instrumentada, não conectada |
| Modos degradados ativos | `intensicare.ops.degradation.active` | QAS-0023 | VALIDATION REQUIRED (G1) | Instrumentada, não conectada |
| **Degradações ativas NÃO exibidas** | `intensicare.ops.degradation.unsurfaced` | QAS-0023 | **Zero é invariante** (§20: nunca ocultar degradação) — não é meta negociável | Instrumentada, não conectada |
| Execuções de sonda sintética por desfecho | `intensicare.probe.run.total` | QAS-0023 | VALIDATION REQUIRED (G1) | Instrumentada; **sem agendador real** |

### 3.9 Vigilância de desempenho de alerta (ADR-0020 O10)

SOURCE (ADR-0020 O10): métricas de carga de alerta (alertas por paciente-dia, taxa de
reconhecimento, tempo-até-ação) são coletadas como série operacional **desde o piloto** —
"sem meta clínica inventada; a interpretação clínica é matéria de G1/G2 e do titular
clínico".

Estado: os insumos (`intensicare.clinical.work_item.current` e
`...transition.total`) existem; a **normalização por paciente-dia não existe** porque
exigiria censo de leitos ocupados, que não é produzido hoje. Nenhum limiar de fadiga de
alarme é proposto aqui — isso é decisão clínica (HAZ de habituação; ADR-0008 T7).

## 4. Gatilho de conversão em SLO com meta

SOURCE (ADR-0020 T1): "Metas G1 validadas passam a existir → converter medições O2 em SLOs
com orçamento de erro".

Procedimento proposto quando o G1 fechar:

1. O titular clínico e AUTH-OPERATIONS fixam a meta por SLI, com justificativa ligada à
   necessidade validada (não a benchmark de mercado).
2. A meta entra no campo `target` do instrumento em `metric-catalog.ts` — que hoje é
   `null` por construção e verificado por teste (`target` nulo em **todos** os
   instrumentos).
3. Só então o orçamento de erro é derivado, e só então um painel pode falar em consumo.
4. Cada meta recebe regra de supersessão (o que dispara revisão).

## 5. O que este documento não fecha

- Não fecha o Gate G8 nem parte dele.
- Não converte nenhum QAS em requisito: `QAS-` continua sendo rótulo local de cenário,
  não ID de rastreabilidade (SOURCE: `quality-attribute-scenarios.md` §1.2).
- Não autoriza publicar painel de SLO: um painel com série vazia e sem meta comunica saúde
  onde há apenas ausência de medição.
