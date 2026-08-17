# @intensicare/persistencia

Camada de persistência do IntensiCare V2.

## Propósito

Concentra o acesso a dados: migrações SQL puras, RLS (row-level security)
por tenant, outbox transacional (ADR-0010) e auditoria append-only. PREMISSA
(reversível, GDEC-0015/0017; ver
`docs/06-architecture/premissas-de-construcao.md` PRE-03): a classe de
tecnologia é PostgreSQL — `@electric-sql/pglite` em desenvolvimento e teste
(um Postgres compatível rodando via WebAssembly, sem servidor externo);
Postgres real fica para ambientes futuros.

## Estado atual (SPR-G7-2)

Implementa a fatia vertical sintética:

- **Migração SQL pura** (`migrations/0001_init.sql`): tabelas de
  `organizations`, `care_units`, `beds`, `patient_identities`,
  `encounters`, `source_envelopes`, `clinical_observations`, `alerts`,
  `work_items`, `audit_events`, `outbox_events`; chaves estrangeiras
  compostas `(tenant_id, id)` entre tabelas de negócio, para que nenhuma
  referência estrutural cruze tenant.
- **RLS por tenant forçado** em toda tabela clínica (`FORCE ROW LEVEL
  SECURITY` + política `USING`/`WITH CHECK` contra
  `current_setting('app.tenant_id', true)`), imposto sob um papel de
  aplicação sem privilégio de superusuário (`intensicare_app` —
  superusuário sempre ignora RLS, mesmo com `FORCE`; ver `session.ts`).
- **Auditoria append-only** (`audit_events`, e por extensão
  `source_envelopes`/`clinical_observations`/`alerts`): trigger que
  bloqueia `UPDATE`/`DELETE` incondicionalmente — os `GRANT`s de escrita
  existem deliberadamente, para que a garantia venha do trigger, não da
  ausência de privilégio.
- **Outbox transacional** (ADR-0010 opção A): gravação clínica + evento de
  outbox na MESMA transação (`insertClinicalObservationWithOutbox`,
  `transitionWorkItem`); ordenação por escopo via sequência global
  monotônica (`ordering_scope` + `id` bigserial).
- **Concorrência otimista** em `work_items` (ADR-0009 Q2-A):
  `transitionWorkItem` faz `UPDATE ... WHERE version = expectedVersion`;
  divergência retorna `{ outcome: "conflict" }` explícito, sem escrever
  nada — nunca sobrescreve silenciosamente (HAZ-0023).

### Nota de implementação sobre papel de sessão (OBSERVED, PGlite 0.5.5)

Sondagem manual confirmou que `SET LOCAL SESSION AUTHORIZATION` e `SET
LOCAL ROLE`, dentro de `db.transaction(...)`, **não revertem** ao final da
transação nesta versão do PGlite — diferente do comportamento padrão do
PostgreSQL. Por isso `downgradeToApplicationRole` (em `session.ts`) rebaixa
a conexão de forma **permanente** (sem `LOCAL`), uma única vez, logo após
migrar. O escopo por tenant — que precisa mesmo variar por transação — usa
`set_config('app.tenant_id', ..., true)`, cujo reset no commit/rollback FOI
verificado como correto na mesma sondagem.

## Testes

14 testes Vitest com PGlite em memória, real (sem mocks): migração (tabelas
criadas, papel de aplicação ativo), RLS (tenant A não lê organizações/
leitos/observações/outbox do tenant B; escrita cross-tenant rejeitada por
`WITH CHECK`; transação sem contexto de tenant não vê nada), outbox
(gravação atômica; rollback reverte fato E evento juntos), auditoria
append-only (`UPDATE`/`DELETE` bloqueados pelo trigger) e transição de
`WorkItem` (aplicada com auditoria+outbox no mesmo commit; conflito de
versão não muda nada).

## Integração SPR-G7-2 (PENDÊNCIA anterior resolvida)

A PENDÊNCIA registrada na fatia anterior foi resolvida pelo integrador:
este pacote agora declara `@intensicare/dominio` como dependência
(`pnpm-lock.yaml` atualizado) e os tipos duplicados de `temporal.ts` e das
entradas dos repositórios foram REMOVIDOS — as entradas são os tipos
canônicos do domínio (`Organization`, `CareUnit`, `Bed`, `PatientIdentity`,
`Encounter`, `SourceEnvelope`, `ClinicalObservation`, `Alert`,
`AuditEvent`; `TemporalValueInput` sobrevive só como alias de
`TemporalValue`).

Novidades da migração `0002_g7_integration.sql` (integração da fatia):
valor codificado em observação (`source_code`, ex.: ACVPU — com CHECK de
que sempre existe par numérico completo OU código), tabela
`evaluation_records` (registros de avaliação imutáveis/append-only,
ADR-0008 — com o registro integral do kernel para replay), tabela
`idempotency_records` (idempotência com hash do corpo — correção 4 da
revisão única, draft IETF), `created_at` em `work_items` e `score` no
alerta (fato explicável por si). Repositório ganhou as leituras usadas
pela API integrada (`listActiveEncounters`,
`listClinicalObservationsForEncounter`, `listLatestEvaluationPerEncounter`,
`listEvaluationRecordsBySubject`, `listWorkItemsWithAlerts`,
`get/insertIdempotencyRecord`).

## Scripts

- `pnpm --filter @intensicare/persistencia build` (copia
  `src/migrations/*.sql` para `dist/migrations/` após compilar)
- `pnpm --filter @intensicare/persistencia test`

## Dependências de runtime

- `@electric-sql/pglite` — Postgres compatível via WebAssembly, usado como
  banco de desenvolvimento/teste.
