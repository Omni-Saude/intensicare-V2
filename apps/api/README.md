# apps/api

Backend do IntensiCare V2.

## Propósito

API contract-first sobre Fastify 5, com validação `zod`, erros no formato
`application/problem+json` (RFC 9457) em pt-BR, idempotência de escrita por
cabeçalho `Idempotency-Key` e concorrência otimista por cabeçalho
`If-Match`. PREMISSA (reversível, GDEC-0015/0017; ver
`docs/06-architecture/premissas-de-construcao.md` PRE-04/PRE-05).

## Estado atual (SPR-G7-2)

Implementa a fatia vertical sintética de `packages/contratos/openapi.yaml`:

- `GET /v1/healthz`
- `POST /v1/ingestao/observacoes` — envelope sintético com
  `Idempotency-Key`; observações inválidas vão para quarentena (nunca
  descarte silencioso); dispara avaliação → status explícito → alerta
  durável quando aplicável.
- `GET /v1/projecoes/grade-leitos` — projeção de leitura por leito,
  escopada ao tenant do chamador.
- `GET /v1/pacientes/{pacienteRef}/avaliacoes` — histórico de avaliações
  com explicação por parâmetro.
- `POST /v1/alertas/{id}/reconhecer` — reconhecimento com concorrência
  otimista via `If-Match` (409 transição inválida / 412 conflito de versão
  / 428 cabeçalho ausente).
- `GET /v1/eventos/stream` — replay de backlog de eventos por cursor (ver
  pendência abaixo).

`GET /health` e `POST /idempotency-example` (fundação SPR-G7-1) foram
mantidas por compatibilidade com os testes de fundação já existentes; não
fazem parte do contrato `/v1/*`.

### Fluxo implementado (INTEGRAÇÃO REAL — SPR-G7-2, integrador)

`ingestão → persistência real (PGlite, envelope de origem + proveniência,
RLS por tenant) → avaliação NEWS2 REAL (@intensicare/kernel-clinico,
RULE-NEWS2 0.2.0) → status explícito (cinco estados ADR-0008) → alerta
durável + item de trabalho + outbox na MESMA transação (ADR-0010 B1) →
projeção de grade de leitos LIDA DO BANCO (com reavaliação de status em
tempo de leitura, spec §5.3) → reconhecer com concorrência otimista
(If-Match/versão; grafo do ADR-0009 imposto pela máquina pura do dominio)
→ auditoria append-only em toda leitura/ação`. O banco de dev/teste é
semeado com o cenário G7 de `@intensicare/fixtures-sinteticas`. Os antigos
adaptadores em memória marcados `// INTEGRAÇÃO PENDENTE (fatia)`
(`store.ts` e o stub de `avaliacao.ts`) foram REMOVIDOS.

Premissas registradas nesta integração (reversíveis, GDEC-0015/0017) —
ver comentários nos arquivos: alias de unidade identidade na borda de
ingestão (`avaliacao.ts`); contexto demográfico no envelope de ingestão e
encontro previamente provisionado (`db.ts`); `WorkItem` 1:1 com `Alert` e
mesmo id (`db.ts`); "reconhecer" sobre item não atribuído = atribuição
implícita ao próprio ator + reconhecimento na mesma transação (`db.ts`).

### Pendências desta fatia

1. **Autenticação** (`src/auth.ts`): stub de bearer sintético
   (`SYNTH-TOKEN.<tenantId>.<atorId>`), sem verificação criptográfica —
   ADR-0015 segue `not-started`.
2. **`GET /v1/eventos/stream`**: replay do OUTBOX real por cursor
   (ADR-0011 P4) em `text/event-stream`, encerrando a conexão após o
   catch-up. Push contínuo em conexão aberta, autorizado a cada entrega
   (ADR-0011 P3/P5/P6, gateway único de tempo real), **não** está
   implementado — pendência de integração futura.
3. **Deduplicação de alerta ativo por leito**: cada ingestão que dispara
   condição de exibição cria um novo item de trabalho, mesmo que já exista
   um ativo para o mesmo leito — sem deduplicação nesta fatia.

### Correções da revisão única SPR-G7-2 aplicadas neste pacote

- Item 4 (baixa): idempotência com HASH do corpo (draft IETF
  idempotency-key-header) — replay da mesma `Idempotency-Key` com corpo
  idêntico devolve a resposta original com `Idempotency-Replayed: true`;
  corpo divergente responde 422 problem+json pt-BR; ambos testados
  (`routes.test.ts`, `e2e.fatia.test.ts`).
- Item 3 (baixa): a API integrada JAMAIS produz `parcial` para NEWS2
  (N-8/GDEC-0007) — mapeamento defensivo + teste em `avaliacao.test.ts`.
- Parte 2 (itens 9 e 11): fiação real completa descrita acima + teste E2E
  de fatia (`e2e.fatia.test.ts`: caminho feliz e degradados).

## Scripts

- `pnpm --filter @intensicare/api dev` — sobe o servidor com recarga
  (`tsx watch`).
- `pnpm --filter @intensicare/api build` — compila para `dist/`.
- `pnpm --filter @intensicare/api start` — roda o build compilado.
- `pnpm --filter @intensicare/api test` — roda os testes (vitest, via
  `app.inject(...)`, sem abrir porta de rede real). Cobre o caminho feliz
  (ingestão → alerta → reconhecer) e os caminhos degradados (insumo
  ausente, tenant errado, replay de `Idempotency-Key`, conflito de
  concorrência).

## Dependências de runtime

- `fastify` — servidor HTTP.
- `zod` — validação de entrada/saída.
- `@intensicare/contratos` (workspace) — tipos e convenções do contrato.
- `@intensicare/dominio` (workspace) — tipos de domínio + máquina de
  estados pura do `WorkItem` (legalidade de transição).
- `@intensicare/kernel-clinico` (workspace) — avaliador NEWS2 real.
- `@intensicare/persistencia` (workspace) — PGlite, RLS, outbox,
  auditoria, idempotência.
- `@intensicare/fixtures-sinteticas` (workspace) — semeadura do banco de
  dev/teste (cenário G7).
- `@electric-sql/pglite` — tipo/instância do banco de dev/teste.

## Dados de exemplo

Todo dado de exemplo/teste usa o marcador `SYNTH-` (política de dados
sintéticos, GDEC-0014) — nenhum identificador real aparece neste app.
