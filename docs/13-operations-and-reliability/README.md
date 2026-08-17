---
doc_id: OPS-13-README
status: PROPOSAL
owner: AUTH-OPERATIONS (detida por rodaquino-OMNI, DEC-G0-06) — ratificação VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.3 (Operability), §9.4 (topologia candidata,
  sondas sintéticas), §11 (estados visíveis), §20 (condições de parada e atalhos proibidos),
  Gate G8; docs/06-architecture/adrs/ADR-0020-observabilidade-slos-backup-dr.md (O1–O10);
  ADR-0007 (kill switch/rollback de bundle), ADR-0008 §8.3, ADR-0010, ADR-0011, ADR-0019;
  docs/06-architecture/quality-attributes/quality-attribute-scenarios.md (QAS-0001..0029);
  docs/03-domain/invariants/DOM-invariants.md (DOM-0004, DOM-0007);
  código verificado em packages/observabilidade/, packages/persistencia/, apps/api/
date_collected: 2026-08-16
collector: agente de prontidão operacional (ciclo 6, sprint SPR-G8-1)
last_updated: 2026-08-16
---

# 13 — Operações e confiabilidade

> **Este diretório NÃO é evidência de prontidão.** SOURCE (prompt §20): nunca "accept an
> infrastructure render, health endpoint, test count, sign-off document, or model-generated
> report as sufficient release evidence". O que existe aqui é: (i) a instrumentação escrita
> e testada em `packages/observabilidade/`, (ii) os procedimentos escritos abaixo, e
> (iii) **o veredito honesto, dimensão a dimensão, do que ainda não foi exercido**. SLO
> medido em ambiente real, ensaio de restore, exercício de DR e treinamento de suporte
> exigem ambiente e pessoas — nada disso ocorreu.

## 0. Substituição do stub

Este diretório era deliberadamente vazio (`STUB-13-OPERATIONS-RELIABILITY`) porque o §15.3
deriva SLOs de necessidades validadas, que não existem (Gate G1 aberto), e porque
ADR-0019/ADR-0020 estavam `not-started`. O que mudou: a direção do **ADR-0020 foi aceita**
(GDEC-0016, 2026-08-16) e o modo construção (GDEC-0013..0017) desbloqueou a materialização.
O que **não** mudou: **nenhuma meta numérica existe**, e nenhuma passa a existir aqui. Toda
meta permanece `VALIDATION REQUIRED` até o G1 — ver `slos-propostos.md`.

## 1. Índice

| Documento | Conteúdo |
|---|---|
| [`slos-propostos.md`](./slos-propostos.md) | Definição dos SLIs/SLOs propostos, ligados aos QAS e às métricas nomeadas. Metas: `VALIDATION REQUIRED`. |
| [`runbook-incidente.md`](./runbook-incidente.md) | Runbook de incidente: classificação, papéis, decisão de kill switch, comunicação e pós-incidente. |
| [`runbook-degradacao-e-downtime.md`](./runbook-degradacao-e-downtime.md) | Runbook por modo degradado, procedimento de downtime clínico, fallback manual e reconciliação pós-recuperação. |
| [`backup-restore-e-rollback.md`](./backup-restore-e-rollback.md) | Procedimento proposto de backup/restore, ensaio de integridade, rollback de código/schema/regra clínica e DR. |
| [`sondas-sinteticas.md`](./sondas-sinteticas.md) | Sondas sintéticas ponta a ponta: o que verificam, como executar, por que dado real é proibido. |

## 2. Vocabulário de estado usado neste diretório

Para que "estado real" signifique a mesma coisa em toda linha da tabela do §3:

| Estado | Significado exato |
|---|---|
| **instrumentada, não conectada** | Existe código de emissão em `packages/observabilidade/` com teste verde, mas **nenhum ponto de `apps/api/` ou `packages/persistencia/` o chama**. A série existe como capacidade e mede zero na prática. |
| **parcial** | Parte do mecanismo existe e é exercitada; parte declarada como faltante na própria linha. |
| **não exercida — mecanismo ausente** | O mecanismo que produziria o dado não existe no repositório (não é questão de ligar fio). |
| **não exercida — bloqueada por terceiro/ambiente** | Depende de ambiente da AMH, de plataforma de implantação (ADR-0019) ou de ato humano. |

**Nenhuma linha diz "pronta".** Nenhuma dimensão foi medida em ambiente real, por ninguém,
nenhuma vez.

## 3. As 12 dimensões de operabilidade do §15.3 — estado REAL

INFERENCE (do prompt §15.3, corpo da seção): o §15.3 enumera dez itens de SLO em lista e
fecha com dois requisitos em prosa — prontidão como capacidade segura (D11) e exposição de
degradação com procedimentos de downtime (D12). A numeração `D01..D12` é desta
materialização (e do catálogo em `packages/observabilidade/src/metric-catalog.ts`), não do
prompt; ela existe para que esta tabela seja conferível item a item.

| # | Dimensão (§15.3) | O que existe HOJE no repositório (OBSERVED) | Estado real | O que falta / quem desbloqueia |
|---|---|---|---|---|
| **D01** | Latência e **perda** fonte→aceito | `intensicare.clinical.pipeline.latency` (atributo `stage=source_to_accepted`) e `...pipeline.loss.total` definidos e testados; a rota `POST /v1/ingestao/observacoes` aceita e quarentena entradas inválidas | instrumentada, não conectada | "Fonte" é a AMH: sem conector, o intervalo real não existe. Ligar o gravador à rota resolve metade; a outra metade é **ambiente da AMH** |
| **D02** | Latência aceito→avaliação | `intensicare.clinical.evaluation.duration` + `...evaluation.total`; a avaliação NEWS2 real roda em `apps/api/src/avaliacao.ts` | instrumentada, não conectada | Chamar `recordEvaluation` no caminho de ingestão (`apps/api` está fora do escopo de escrita desta fase) |
| **D03** | Latência avaliação→item de trabalho durável | Mesmo instrumento de etapa (`stage=evaluation_to_durable_work_item`) | instrumentada, não conectada | **Nota honesta:** nesta fatia o alerta é gravado na MESMA transação da avaliação, então esse intervalo é intratransacional e não representa o desenho assíncrono futuro. Medi-lo agora mediria o próprio commit |
| **D04** | Latência gerado→visível e gerado→reconhecido | Mesmo instrumento (`generated_to_visible`, `generated_to_acknowledged`); `intensicare.clinical.work_item.current` e `...transition.total` | instrumentada, não conectada | "Visível" exige instrumentar `apps/web` e o canal de entrega; "reconhecido" exige o `POST /v1/alertas/:id/reconhecer` gravar o instante e emitir a medição |
| **D05** | Prevalência de obsoleto/ausente/inválido/conflito | `intensicare.clinical.evaluation.total` por `status` (cinco estados da ADR-0008) e `...missing_input.total` por parâmetro; o kernel já devolve `status` e `missingInputs` reais | instrumentada, não conectada | É a dimensão **mais próxima de medir algo verdadeiro hoje**: o dado já é produzido pelo kernel, falta só emitir |
| **D06** | Lag de fila, backlog de replay, lag de projeção, divergência de reconciliação | `intensicare.backbone.outbox.depth`, `...replay.backlog`, `...projection.lag`, `...reconciliation.divergence.total` definidos e testados. A tabela `outbox_events` existe com coluna `published_at` | **não exercida — mecanismo ausente** | **Não existe relay/publicador**: `published_at` nunca é preenchido em nenhum caminho do código (OBSERVED em `packages/persistencia/src/migrations/0001_init.sql` e `repositories/clinical-repository.ts`). Sem publicador não há lag a medir — há apenas acúmulo. Também não há worker de projeção nem reconciliação entre lanes (ADR-0006) |
| **D07** | Saúde de rule bundle: versão e carga | `intensicare.clinical.rule_bundle.availability`; kill switch e rollback implementados em `packages/observabilidade/src/kill-switch.ts` com 9 testes; `packages/rule-bundle` existe | **parcial** | O kill switch age **apenas no processo corrente**. SOURCE (ADR-0007 H3/D3): a evidência exigida é um *drill multi-instância medindo tempo de propagação* — impossível sem várias instâncias implantadas (ADR-0019) |
| **D08** | Disponibilidade de conector e drift de contrato | `intensicare.ops.connector.unavailable.total` e `...contract_drift.total` definidos | **não exercida — bloqueada por terceiro** | Estado factual preservado: **0 vias acionáveis; 47/47 inelegíveis; `Observation` da AMH não consumível**. Não há conector para monitorar |
| **D09** | Negativas cross-tenant e acesso suspeito | `intensicare.ops.policy_denial.total`; RLS por tenant **forçada** em toda tabela clínica, com suítes de segurança em `packages/persistencia/src/seguranca.test.ts` e `apps/api/src/seguranca.test.ts` | instrumentada, não conectada | O **mecanismo de negativa existe e é testado**; o que falta é contar as negativas como série e definir o que é "acesso suspeito" (não inventado aqui) |
| **D10** | Backup, integridade de restore, RPO/RTO, integridade de exportação de evidência | `intensicare.ops.backup.result.total`, `...restore.integrity.total`, `...evidence_export.integrity.total` definidos; procedimento escrito em `backup-restore-e-rollback.md` | **não exercida — mecanismo ausente** | Não há backup: a persistência é PGlite **em memória**, sem `dataDir` (OBSERVED em `packages/persistencia/src/index.ts`) — não há estado durável entre execuções para copiar. SOURCE (ADR-0020 O6): "Restore que nunca foi ensaiado não conta como backup para G8" |
| **D11** | Prontidão = capacidade segura | `evaluateReadiness`/`reportReadiness` em `readiness.ts`, com teste negativo para bundle morto, dependência ausente, identidade não configurada e degradação silenciosa | instrumentada, não conectada | **`GET /v1/healthz` executa `select 1`. Isso é *liveness*, não prontidão, e não pode ser citado como evidência de capacidade segura** (§20). Ligar `evaluateReadiness` a um endpoint de readiness exige escrita em `apps/api` |
| **D12** | Degradação exposta sem vazar PHI; downtime, fallback manual, replay e reconciliação | Registro de degradação com 7 modos catalogados (condição de entrada, comportamento seguro, fallback manual, condição de saída); contador de degradação **não exibida**; redação de PHI imposta por tipo com teste de não-vazamento; runbooks neste diretório | **parcial** | O `DegradedNotice` **não é transportado pelo contrato de API nem renderizado por `apps/web`** — hoje ele existe só em memória do processo. Sem isso, "visível" é uma promessa, não um fato. O procedimento de downtime **não foi validado com clínicos** |

### 3.1 Resumo do veredito

- **0 de 12** dimensões medidas em ambiente real, por qualquer pessoa, em qualquer momento.
- **7 de 12** instrumentadas e não conectadas (D01–D05, D09, D11) — medem zero na prática.
- **2 de 12** parciais (D07, D12).
- **3 de 12** não exercidas por ausência de mecanismo ou bloqueio de terceiro (D06, D08, D10).
- **0 de 12** com meta numérica acordada. Todas seguem `VALIDATION REQUIRED` (Gate G1).

INFERENCE: a diferença entre "instrumentada" e "medindo" é a diferença entre um extintor
comprado e um extintor instalado. Uma série vazia é indistinguível de um sistema saudável
em qualquer painel — é por isso que "instrumentada, não conectada" está escrito assim, e
não como "pronta".

## 4. Separação obrigatória: sinal operacional ≠ alerta clínico

SOURCE (ADR-0020 O8): "alerta de operação ≠ alerta clínico; nomenclatura distinta
obrigatória". Materialização verificada por teste (`instrumentation.test.ts`):

- família `intensicare.clinical.*` — laço clínico (avaliação, item de trabalho);
- família `intensicare.backbone.*` — outbox, replay, projeção;
- família `intensicare.ops.*` — sinal **operacional**; nenhum nome desta família contém
  "alert"/"alerta", e o teste falha se contiver;
- família `intensicare.probe.*` — sondas sintéticas.

Um humano de plantão que recebe "alerta" precisa saber, sem pensar, se é um paciente
piorando ou uma fila crescendo.

## 5. PHI fora da telemetria — como está imposto

SOURCE (ADR-0020 O3; prompt §9.4 "strict PHI redaction"). Três camadas, nenhuma delas
suficiente sozinha e todas declaradas como tal em
`packages/observabilidade/src/redaction.ts`:

1. **Tipo** — atributos de telemetria só aceitam valores marcados (`SafeLabel`,
   `OpaqueRef`, `SafeCount`, `SafeDepth`, `SafeDurationMs`, `SafeFlag`). Uma `string` crua
   não compila. Verificado por asserções `@ts-expect-error` que o `typecheck` valida.
2. **Execução** — varredura de formas conhecidas (PSR, CPF, UUID, e-mail, instante ISO,
   sequência longa de dígitos, marcador de sujeito sintético) sobre toda string emitida.
   Um PSR **sintético** é bloqueado exatamente como um real.
3. **Nome de campo** — chaves reservadas a dado clínico bruto (`spo2`, `score`, `valor`,
   `paciente`, sufixos `.value`/`.raw`) são recusadas; toda chave terminada em `.ref` exige
   referência pseudonimizada (`op_` + 16 hex).

**Limite honesto:** isto impede o acidente, não o ato deliberado, e não prova ausência de
PHI em produção. A revisão humana da telemetria real continua exigida e não ocorreu.

## 6. O que este diretório deliberadamente NÃO faz

- **Não inventa metas.** Nem "p95 < 2s", nem "99,9%", nem RPO/RTO. SOURCE (ADR-0020 D2):
  "Medir desde já; fixar alvo depois — nunca inventar número".
- **Não declara Gate G8 satisfeito.** O G8 exige ensaios executados e medidos.
- **Não define procedimento clínico de downtime como acordado.** O texto em
  `runbook-degradacao-e-downtime.md` é PROPOSAL e precisa de validação clínica
  representativa (§11: "Validate with physicians, nurses, coordinators...").
- **Não escolhe backend de observabilidade.** Matéria do ADR-0019 (não materializado).

## 7. Pendências registradas (não fechadas por este documento)

| # | Pendência | Depende de |
|---|---|---|
| P-OPS-01 | Ligar os gravadores de `packages/observabilidade` a `apps/api` e `packages/persistencia` | escrita em `apps/api` (fora do escopo desta fase) |
| P-OPS-02 | Transportar `DegradedNotice` no contrato de API e renderizá-lo em `apps/web` | ADR-0012/ADR-0021 + escrita em contratos/web |
| P-OPS-03 | Endpoint de **readiness** distinto de `/v1/healthz` | escrita em `apps/api` |
| P-OPS-04 | Relay/publicador de outbox (sem ele, D06 não tem o que medir) | ADR-0010 B10 materializado |
| P-OPS-05 | Propagação multi-instância do kill switch e medição do tempo de atuação | ADR-0019 (plataforma), ambiente |
| P-OPS-06 | Persistência durável (PGlite com `dataDir` ou Postgres real) antes de qualquer conversa sobre backup | ADR-0019, ambiente |
| P-OPS-07 | Agendador real das sondas sintéticas | ADR-0019, ambiente |
| P-OPS-08 | Metas numéricas dos SLOs | **Gate G1** (necessidades validadas) — ato humano |
| P-OPS-09 | Validação clínica do procedimento de downtime | clínicos representativos — ato humano |
