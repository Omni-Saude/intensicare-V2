---
doc_id: API-EVENTS-MCP-CATALOGO-EVENTOS
status: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
source: >
  packages/persistencia/src/migrations/0001_init.sql (tabela outbox_events,
  OBSERVADO); packages/persistencia/src/repositories/clinical-repository.ts
  (insertOutboxEvent, insertClinicalObservationWithOutbox, transitionWorkItem,
  OBSERVADO); packages/persistencia/src/outbox-and-audit.test.ts (event_type
  concretos exercitados em teste, OBSERVADO); apps/api/src/store.ts (log de
  eventos em memória EventoFluxo, OBSERVADO — NÃO é o outbox real);
  packages/contratos/src/index.ts (tipo EventoFluxo); docs/06-architecture/
  adrs/ADR-0010-backbone-transacao-outbox-eventos-garantias-de-entrega.md
  (accepted, GDEC-0008, B1-B10); ADR-0009 (W1, estados de WorkItem, accepted
  GDEC-0008)
date_collected: 2026-08-16
collector: especialista de publicação de contratos como documentação (SPR-G4-4, ciclo 6)
last_updated: 2026-08-16
---

# Catálogo de eventos — outbox da fatia SPR-G7-2 (semente de AsyncAPI)

PREMISSA (reversível, GDEC-0015/0017): este catálogo é uma semente para uma
futura especificação AsyncAPI contract-first (no mesmo espírito de
`packages/contratos/openapi.yaml`) — **não é, ele mesmo, um documento
AsyncAPI**, e não substitui a publicação formal pendente (§7). Rótulos `EV-N`
usados abaixo são identificadores **documento-locais**, fora da taxonomia
global de `docs/00-governance/traceability-policy.md` §1 — pendente de
ratificação em `traceability-policy.md` §1.1 caso venham a precisar de
alcance global (mesmo regime do mapa MD/MG/SPR); citação cruzada fora deste
arquivo deve usar o `event_type` (nome real, entre aspas), não o rótulo
`EV-N`. Nenhuma alegação de efetividade clínica, conformidade regulatória ou
segurança comprovada é feita por este documento. Nenhum dado real foi
acessado — todo exemplo usa o marcador `SYNTH-` (GDEC-0014).

## 1. Duas superfícies distintas — não confundir

O código-fonte desta fatia contém **duas** coisas chamadas informalmente
"eventos", e são estruturalmente diferentes. Confundi-las seria uma alegação
de garantia que o código não sustenta.

| | (A) Outbox transacional real | (B) Log em memória de `apps/api` |
|---|---|---|
| Onde | `packages/persistencia` — tabela `outbox_events` | `apps/api/src/store.ts` — `Map` em memória, tipo `EventoFluxo` |
| Implementa ADR-0010? | Sim — B1 (mesma transação), B3 (`ordering_scope`), parcialmente B8 (ver §6, gaps) | **Não.** Comentário no próprio arquivo: "NÃO implementa outbox transacional real (ADR-0010)" |
| Durabilidade | Sim — tabela Postgres-compatível (PGlite), RLS por tenant, transação ACID | Nenhuma — perdido a cada reinício do processo |
| Conectado a `apps/api`? | **Não** nesta fatia (`// INTEGRAÇÃO PENDENTE`) | Sim — é o que `GET /v1/eventos/stream` serve |
| Consumidor/relay | Nenhum implementado (ADR-0010 B9/B10 pendente) | `GET /v1/eventos/stream`, catch-up por cursor apenas |
| Uso deste documento | §2-§6 catalogam **este** como o outbox real da fatia | §2.3 cataloga este separadamente, como o que o cliente HTTP hoje efetivamente recebe |

## 2. Outbox real — eventos observados (`packages/persistencia`)

### 2.1 Envelope físico da tabela `outbox_events` (OBSERVADO, SQL)

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `bigserial` | ordem global de inserção; monotônica — ordena corretamente qualquer subconjunto por `ordering_scope` sem exigir sequência por escopo nesta fatia |
| `tenant_id` | `text` | RLS forçado (`FORCE ROW LEVEL SECURITY`) |
| `ordering_scope` | `text` | escopo de ordenação declarado (ADR-0010 B3) |
| `event_type` | `text` | nome do evento — ver §2.2 |
| `aggregate_type` | `text` | `clinical_observation` \| `work_item` nesta fatia |
| `aggregate_id` | `text` | id do agregado afetado |
| `payload` | `jsonb` | corpo do evento — minimizado, ver §2.2 |
| `occurred_at` | `timestamptz` (default `now()`) | tempo de gravação — **não** distingue tempo do fato × emissão × publicação (gap, ver §6) |
| `published_at` | `timestamptz`, nulo | reservado para quando o relay existir (ADR-0010 B9/B10) — hoje sempre nulo, nenhum publicador grava aqui |

### 2.2 Eventos concretos (`EV-1`, `EV-2`, `EV-3` — OBSERVADO)

| Rótulo | `event_type` | Gatilho (código) | `aggregate_type` | `ordering_scope` (exemplo) | Payload observado | Status |
|---|---|---|---|---|---|---|
| EV-1 | `clinical_observation_recorded` | `insertClinicalObservationWithOutbox` — toda gravação de observação clínica canônica | `clinical_observation` | `encounter:<encounterId>` | `{ concept: string, quality: "valid"\|"warning"\|"quarantined"\|"unknown" }` | OBSERVADO — `event_type` fixo no código |
| EV-2 | `work_item_assigned` | `transitionWorkItem` com `outboxEventType: "work_item_assigned"` — exercitado em teste para a transição `nao_atribuido → atribuido` | `work_item` | `work_item:<workItemId>` | `{ state: string, version: number }` | OBSERVADO — string usada em `outbox-and-audit.test.ts`, **não é enum fixo no código** (ver §2.3) |
| EV-3 | `work_item_acknowledged` | `transitionWorkItem` com `outboxEventType: "work_item_acknowledged"` — exercitado em teste para a transição concorrente `atribuido → reconhecido` | `work_item` | `work_item:<workItemId>` | `{ state: string, version: number }` | OBSERVADO — idem EV-2 |

### 2.3 Gap: `event_type` de `WorkItem` não é um enum fechado nesta fatia

`transitionWorkItem` recebe `outboxEventType` como **parâmetro de string
livre do chamador** — o código de `packages/persistencia` não impõe um
catálogo fechado de nomes de evento por transição. Os dois nomes em §2.2
(EV-2, EV-3) são os únicos **OBSERVADOS** (usados em teste); não existe hoje
nenhum chamador de produção (`apps/api` usa o armazenamento em memória, não
este repositório — ver §1).

INFERENCE (a partir de ADR-0009 W1, aceito — oito estados de `WorkItem`:
`nao-atribuido`, `atribuido`, `reconhecido`, `escalado`, `sobreposto`,
`resolvido`, `suprimido`, `reaberto`): por analogia de nomenclatura com EV-2/
EV-3, um catálogo fechado completo teria um `event_type` por transição
(`work_item_escalated`, `work_item_resolved`, `work_item_suppressed`,
`work_item_reopened`, `work_item_overlapped`, ...). **Isto é PROPOSAL, não
OBSERVADO** — nenhum desses nomes existe em código nesta fatia. Fechar este
enum é pendência de um ADR/decisão de implementação futura, não algo que
este catálogo pode decidir.

## 3. Garantias de entrega (à luz de ADR-0010, accepted GDEC-0008)

| Garantia (cláusula ADR-0010) | O que a fatia OBSERVADA sustenta | Estado |
|---|---|---|
| B1 — fronteira transacional única (efeito + outbox na mesma transação) | Sim — `insertClinicalObservationWithOutbox` e `transitionWorkItem` gravam fato/transição e evento de outbox na mesma transação PGlite; testado (`outbox-and-audit.test.ts`: rollback reverte AMBOS) | OBSERVADO, testado |
| B2 — at-least-once + consumidores idempotentes | Sem publicador/consumidor real (§1), a garantia é **estrutural apenas** (nenhuma entrega de fato acontece ainda) | VALIDAÇÃO NECESSÁRIA — sem relay não é testável ponta a ponta |
| B3 — ordenação por escopo declarado | Sim, estruturalmente — `ordering_scope` é gravado e a ordem de leitura é `order by id` (monotônico); nenhum consumidor real ainda lê por escopo | OBSERVADO (estrutura); consumo não testado |
| B4 — janela de replay declarada | Nenhuma janela/poda implementada ou declarada nesta fatia | VALIDAÇÃO NECESSÁRIA |
| B5 — crash-points enumerados e testados | Apenas o crash-point "falha após gravação, antes do commit" está testado (rollback atômico); os demais cinco de ADR-0010 §5.2 B5 (crash pós-publish, crash de consumidor, indisponibilidade de transporte, restauração de backup) não têm harness nesta fatia | PARCIAL — 1 de 5 |
| B6 — DLQ/quarentena visível | Não existe — não há publicador que possa falhar em publicar ainda | NÃO APLICÁVEL AINDA |
| B7 — ACK na fronteira de persistência | Não há fonte externa nesta fatia emitindo ACK; a gravação em `outbox_events` em si respeita "durável antes de qualquer coisa" por construção (mesma transação) | OBSERVADO, parcial (não há ACK a terceiro) |
| B10 — produtor autorizado único (só o relay publica) | Não aplicável — nenhum relay existe; hoje só a própria aplicação grava (via `insertOutboxEvent`), nunca publica externamente | NÃO APLICÁVEL AINDA |

**Leitura honesta:** a fatia implementa a metade "escrita atômica" do
padrão outbox (ADR-0010 Opção A) com evidência de teste real; a metade
"transporte/entrega/consumo" (relay, B2 fim-a-fim, B4, B5 completo, B6, B9,
B10) é pendência integral — nenhum destes está implementado, nem parcial.

## 4. Consumidores conhecidos

| Evento | Consumidor(es) | Estado |
|---|---|---|
| EV-1 (`clinical_observation_recorded`) | Nenhum — nenhum relay/consumidor lê `outbox_events` fora dos próprios testes (`listOutboxEvents`, usado apenas para asserção em teste) | NENHUM implementado |
| EV-2/EV-3 (`work_item_*`) | Idem | NENHUM implementado |
| Futuro (PROPOSAL) | Projeções de leitura (ADR-0011), notificação/tempo real (ADR-0011 P3/P9), reconciliação (ADR-0006), conectores externos (via relay, quando existir) | Planejado em ADR-0010/0011, não implementado |

## 5. Superfície B — log em memória de `apps/api` (`EventoFluxo`, OBSERVADO)

Distinto do outbox real (§1). Serve **apenas** `GET /v1/eventos/stream`
(catch-up por cursor — sem push contínuo, ver `openapi.yaml x-pendencias`).

### 5.1 Tipo (OBSERVADO, `packages/contratos/src/index.ts`)

```ts
interface EventoFluxo {
  sequencia: number;      // monotônico por tenant (Map em memória)
  tipo: "observacoes-ingeridas" | "avaliacao-computada" | "alerta-criado" | "alerta-atualizado";
  tenantId: string;
  ocorridoEm: string;     // ISO 8601 — instante de publicação em memória, não distingue tempo do fato
  dados: unknown;         // payload NÃO tipado por variante de `tipo` nesta fatia
}
```

### 5.2 Eventos concretos (OBSERVADO, `apps/api/src/store.ts`)

| `tipo` | Gatilho | `dados` observado |
|---|---|---|
| `observacoes-ingeridas` | toda chamada bem-sucedida a `aplicarIngestao` | `{ encontroId, leitoId, pacienteRef }` |
| `avaliacao-computada` | idem, imediatamente após | `{ encontroId, leitoId, pacienteRef, avaliacao }` (inclui `ResultadoAvaliacao` completo) |
| `alerta-criado` | quando a avaliação válida cruza o limiar ilustrativo e gera `ItemTrabalho` | `{ id, estado, versao }` |
| `alerta-atualizado` | `POST /v1/alertas/{id}/reconhecer` bem-sucedido | `{ id, estado, versao }` |

### 5.3 Garantias — nenhuma das de ADR-0010 se aplica aqui

Este log **não** é uma implementação do outbox transacional. Escopo de
ordenação é "todo o tenant" (sequência global por `tenantId`), não por
`ordering_scope` declarado por tipo de evento (ADR-0010 B3); não há
persistência (perdido a cada reinício do processo, HAZ-0012-like em espírito
— mas fora de produção, apenas fatia de demonstração); não há dedup nem
`idempotency_key` no envelope; `dados: unknown` não é tipado por variante,
ao contrário do que um envelope de evento versionado (ADR-0010 B8) exigiria.
Este gap está **declarado no próprio código-fonte** (`store.ts`, comentário
de cabeçalho) e no `openapi.yaml` (`x-pendencias`) — não é uma omissão desta
tarefa, é herdado e citado.

## 6. Envelope-alvo (ADR-0010 B8) vs. o que existe — gaps declarados

ADR-0010 B8 (accepted, GDEC-0008) exige, por evento interno: id do evento,
tipo+versão, chave de idempotência, escopo de ordenação + sequência, tenant e
escopo de recurso, referência ao fato/comando de origem, tempos (fato ×
emissão × publicação — `time-semantics.md`), correlação/causalidade, e
marcador de replay.

| Campo exigido por B8 | Presente em `outbox_events` (§2.1)? |
|---|---|
| id do evento | Parcial — `id` bigserial é a posição na sequência, não um identificador estável do fato de negócio |
| tipo + versão | Parcial — `event_type` existe; **nenhuma versão de esquema de evento** é gravada |
| chave de idempotência | **Ausente** — nenhuma coluna `idempotency_key`; a idempotência de escrita HTTP (`Idempotency-Key`, ADR-0012 K3) não é a mesma coisa e não é propagada à linha de outbox |
| escopo de ordenação + sequência | Presente — `ordering_scope` + `id` |
| tenant e escopo de recurso | Presente — `tenant_id`; escopo de recurso é o `aggregate_id`/`aggregate_type` |
| referência ao fato/comando de origem | Presente via `aggregate_id`, mas o payload não referencia o `AuditEvent`/`idempotency_key` do comando que o gerou |
| tempos (fato × emissão × publicação) | **Ausente** — só `occurred_at` (tempo de gravação da linha) e `published_at` (sempre nulo); não distingue tempo do fato clínico |
| correlação/causalidade | **Ausente** — nenhuma coluna |
| marcador de replay | Implícito na monotonicidade de `id`, não explícito como campo |

Estes gaps são **VALIDAÇÃO NECESSÁRIA** — nenhum deles é uma decisão deste
catálogo; ficam registrados para a próxima iteração de implementação do
outbox fechar contra a minuta B8 já aceita.

## 7. Semente para AsyncAPI — o que falta para formalizar

1. Fechar o enum de `event_type` de `WorkItem` (§2.3) — decisão de
   implementação, não deste catálogo.
2. Preencher os gaps de envelope do §6 (idempotência, versão de esquema,
   tempos multi-campo, correlação/causalidade) antes de gerar um documento
   AsyncAPI que alegue conformidade com ADR-0010 B8.
3. Implementar o relay (ADR-0010 B9/B10) — sem produtor externo, um
   AsyncAPI descreveria uma API que ninguém publica ainda.
4. Decidir, contra `packages/contratos` (mesmo pacote do `openapi.yaml`), o
   caminho e formato do arquivo AsyncAPI (`asyncapi.yaml`) — este catálogo
   não escolhe ferramenta nem decide isso.
5. Reconciliar com o contrato **externo** AMH×V2 (§6 do `indice-de-
   contratos.md`) — hoje aquele contrato cobre só identidade, não fatos
   clínicos; qualquer AsyncAPI de saída da V2 precisa declarar que não
   reusa aquele envelope sem verificação de compatibilidade (ADR-0010 E8/C3).

## 8. Autoverificação

Todo `event_type`, coluna e tipo citado acima foi lido diretamente do
código-fonte antes de ser citado (§source do front matter). Nenhum evento
foi inventado; onde a nomenclatura é INFERENCE (§2.3), está rotulada como
tal e não como fato observado. Nenhum ADR foi promovido a `accepted`/
`DECIDED` no front matter deste arquivo. Nenhum dado real, CPF formatado ou
PSR real aparece neste documento.
