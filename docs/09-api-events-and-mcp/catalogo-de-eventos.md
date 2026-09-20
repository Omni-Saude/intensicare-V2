---
doc_id: API-EVENTS-MCP-CATALOGO-EVENTOS
status: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
source: >
  packages/persistencia/src/migrations/0001_init.sql (tabela outbox_events,
  OBSERVADO); packages/persistencia/src/repositories/clinical-repository.ts
  (insertOutboxEvent, insertClinicalObservationWithOutbox, transitionWorkItem,
  OBSERVADO); packages/persistencia/src/outbox-and-audit.test.ts (event_type
  concretos exercitados em teste, OBSERVADO); apps/api/src/db.ts (replayEvents
  — leitura do outbox REAL por cursor, OBSERVADO; substituiu o log em memória
  de apps/api/src/store.ts, arquivo removido no SPR-G7-2); apps/api/src/eventos/
  (gateway de entrega contínua autorizada, ACH-05, OBSERVADO);
  packages/contratos/src/index.ts (tipo EventoFluxo); docs/06-architecture/
  adrs/ADR-0010-backbone-transacao-outbox-eventos-garantias-de-entrega.md
  (accepted, GDEC-0008, B1-B10); ADR-0009 (W1, estados de WorkItem, accepted
  GDEC-0008); packages/contratos/asyncapi.yaml e packages/contratos/src/
  asyncapi.ts (autoridade para as mensagens de plano de controle — §5.4,
  acrescentado 2026-08-18, OBSERVADO); apps/api/src/eventos/fila.ts
  (LIMITES_ILUSTRATIVOS) e apps/api/src/index.ts (RECONEXAO_ILUSTRATIVA),
  OBSERVADO
date_collected: 2026-08-16
collector: especialista de publicação de contratos como documentação (SPR-G4-4, ciclo 6)
last_updated: 2026-09-19
addenda:
  - "§5.4 (2026-08-18): três campos novos no plano de controle"
  - "§5.5 (2026-08-18): ACH-O3-16, ABERTO — o §5.2 diverge do código em três pontos; a divergência é REGISTRADA, o §5.2 fica intacto"
  - "§5.6 (2026-08-18): ACH-O3-6, fecho PARCIAL — sequencia negativa fechada; tipar `dados` por variante segue aberto"
  - "§5.8 (2026-09-19): contabilidade 6/5/1 do outbox — seis tipos emitidos, cinco mapeados ao contrato, `regra-despachada` deliberadamente fora do vocabulário e omitida no replay (achado MAJ-7)"
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

**Correção de estado (2026-08-17).** A dicotomia que esta tabela descrevia —
outbox real de um lado, log em memória de `apps/api` do outro — **deixou de
existir**. `apps/api/src/store.ts` foi removido no `SPR-G7-2`; a coluna (B) é
preservada abaixo apenas como registro do que o catálogo dizia, não como
descrição do presente.

| | (A) Outbox transacional real — **estado atual** | (B) Log em memória de `apps/api` — **HISTÓRICO, removido** |
|---|---|---|
| Onde | `packages/persistencia` — tabela `outbox_events` | `apps/api/src/store.ts` — `Map` em memória. **Arquivo não existe mais** |
| Implementa ADR-0010? | Sim — B1 (mesma transação), B3 (`ordering_scope`), parcialmente B8 (ver §6, gaps) | **Não.** Comentário no próprio arquivo: "NÃO implementa outbox transacional real (ADR-0010)" |
| Durabilidade | Sim — tabela Postgres-compatível, RLS por tenant, transação ACID | Nenhuma — perdido a cada reinício do processo |
| Conectado a `apps/api`? | **Sim** — `apps/api/src/db.ts::replayEvents` lê o outbox por cursor; a marca `// INTEGRAÇÃO PENDENTE` foi removida junto com `store.ts` | — |
| Consumidor/relay | Gateway de entrega **contínua** autorizada em `apps/api/src/eventos/` (ACH-05): pulsação, cursor monotônico, fila limitada com desconexão explícita, retomada e autorização por evento. **Relay externo (ADR-0010 B9/B10) segue não implementado** | `GET /v1/eventos/stream`, catch-up por cursor apenas |
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

### 5.2 Eventos concretos (OBSERVADO — hoje lidos do outbox real por `apps/api/src/db.ts::replayEvents`)

Os quatro `tipo` abaixo permanecem exatamente os mesmos; o que mudou é a
**origem**: deixaram de vir de um `Map` em processo e passaram a ser projetados
do `outbox_events` durável, por cursor e escopados por tenant. O mapeamento
`event_type` do outbox → `tipo` do contrato está em
`apps/api/src/db.ts` (`OUTBOX_TO_CONTRACT_EVENT`).

| `tipo` | Gatilho | `dados` observado |
|---|---|---|
| `observacoes-ingeridas` | toda chamada bem-sucedida a `aplicarIngestao` | `{ encontroId, leitoId, pacienteRef }` |
| `avaliacao-computada` | idem, imediatamente após | `{ encontroId, leitoId, pacienteRef, avaliacao }` (inclui `ResultadoAvaliacao` completo) |
| `alerta-criado` | quando a avaliação válida cruza o limiar ilustrativo e gera `ItemTrabalho` | `{ id, estado, versao }` |
| `alerta-atualizado` | `POST /v1/alertas/{id}/reconhecer` bem-sucedido | `{ id, estado, versao }` |

### 5.3 Garantias — o que passou a valer e o que continua em aberto

**Correção de estado (2026-08-17).** O título anterior desta seção era
"nenhuma das de ADR-0010 se aplica aqui", verdadeiro enquanto a superfície
servia um `Map` em memória. Deixou de ser verdadeiro quando `apps/api` passou
a ler o outbox durável.

**Passou a valer** (`OBSERVED`): persistência (tabela `outbox_events`, não mais
perdida a reinício); escopo por tenant imposto por RLS **e** por tipo
(`TenantScopedKey`, `ADR-0016` §4.1 — chave sem tenant é inexprimível);
ordenação por `ordering_scope` declarado (`ADR-0010` B3); cursor monotônico com
retomada sem lacuna e sem duplicata não idempotente; fila por conexão limitada
com **desconexão explícita e instrução de reconciliação** em vez de descarte
silencioso (`ADR-0011` P5); autorização reavaliada **a cada evento entregue**,
não apenas na abertura (`ADR-0011` P3).

**Continua em aberto** (`BLOQUEADO`/`PROPOSAL`, não mascarado): o envelope não
carrega todos os campos de `ADR-0010` B8 — os ausentes estão declarados em
`x-pendencias` do `asyncapi.yaml`, não preenchidos por suposição; `dados` ainda
não é tipado por variante, porque fechar o enum de `event_type` de `WorkItem`
depende de o catálogo §2.3 sair de `PROPOSAL`; não há dedup por
`idempotency_key` no envelope; e o **relay/publicador externo** (`ADR-0010`
B9/B10) segue não implementado. Ambas as mudanças pendentes exigem alteração de
esquema de persistência que não foi feita.

### 5.4 Três campos novos no plano de controle (correção de estado, 2026-08-18)

`packages/contratos/asyncapi.yaml` e `packages/contratos/src/asyncapi.ts` — a
autoridade deste catálogo para as mensagens de plano de controle — ganharam
três campos novos desde a última leitura deste documento (§ front matter,
`date_collected`). Todos são opcionais e de evolução COMPATÍVEL
(`POLITICA_EVOLUCAO_EVENTOS.compativel`: "acrescentar campo opcional a uma
mensagem"), e todos **populados de verdade pelo produtor**
(`apps/api/src/eventos/stream.ts`, OBSERVADO), não apenas declarados no
schema e deixados vazios:

| Campo | Mensagem(ns) | Tipo |
|---|---|---|
| `intervaloPulsacaoMs` | `MensagemPulsacao` **e** `MensagemEstadoConexao` | `number?` |
| `reconexao` (`PoliticaReconexao`) | `MensagemEstadoConexao` | objeto opcional |

**Por que importam — não é cosmético.** O contrato já afirmava que "a AUSÊNCIA
de pulsação dentro do intervalo anunciado é o sinal de que a conexão morreu" —
mas, até esta versão, nenhum campo carregava esse intervalo; ele só existia do
lado do servidor (`LimitesConexao.intervaloPulsacaoMs`,
`apps/api/src/eventos/fila.ts`). A consequência medida era uma **janela cega
entre a abertura da conexão e a primeira pulsação**: uma conexão meio-aberta
nessa janela só seria detectada pelo `error` do transporte, e a tela podia
parecer atual sem estar (`HAZ-0025`; `SAF-0025`; `ADR-0011` P6). Anunciando o
intervalo e a política de reconexão já no primeiro quadro
(`estado-conexao: replaying`), o cliente sabe, antes de qualquer pulsação,
quando cobrar silêncio e como reconectar.

**O gate não vê esta omissão — por isso o catálogo podia ficar um passo atrás
em silêncio.** `scripts/check_contratos.mjs` confronta `asyncapi.yaml`,
`asyncapi.ts` e este catálogo **apenas quanto ao enum de `TipoEventoFluxo`**
(§5.1, plano de DADOS) — nada nele compara os campos das mensagens de plano de
CONTROLE entre os três lados. Este §5.4 é a correção desse atraso, não a
descrição de um comportamento novo do produto.

**Pendência sem dono, sem `DECIDED` (`VALIDATION REQUIRED`).** Os números
anunciados no fio vêm de `RECONEXAO_ILUSTRATIVA` (`apps/api/src/index.ts`) e
de `LIMITES_ILUSTRATIVOS` (`apps/api/src/eventos/fila.ts`) — ambos rotulados
`VALIDATION REQUIRED` no próprio código (`ADR-0011` §3 D6/D7 não têm alvo
decidido; ver também `x-pendencias` do `asyncapi.yaml`). Antes desta mudança,
esses números só existiam do lado do servidor, sem efeito fora dele. Agora
trafegam no fio, e o próprio contrato de cliente **obriga** quem o segue a
"tratar ausência de `pulsacao` dentro do intervalo anunciado como conexão
morta" e a "reconectar respeitando a `PoliticaReconexao` recebida"
(`CONTRATO_CLIENTE_EVENTOS`, itens 4 e 6, `asyncapi.ts`) — e há indício (fora
da autoridade lida para esta tarefa, portanto não verificado com o mesmo rigor
do resto desta seção) de que um consumidor SSE do navegador, em construção em
paralelo, já lê exatamente estes dois campos do quadro recebido
(`apps/web/src/eventos/maquina.ts`). Decidir a cadência de pulsação e a
política de backoff deixou de ser um parâmetro interno sem efeito observável
fora do servidor e passou a ser uma decisão com **efeito clínico observável na
tela** (quanto tempo até ela se declarar `degraded`/`offline`; quanto tempo
até reconectar). Isto é matéria de `ADR-0011` §3 D6, `VALIDATION REQUIRED` —
não é decisão de nenhum agente, e este catálogo não a toma.

### 5.5 `ACH-O3-16` (ABERTO) — o §5.2 acima JÁ DIVERGE do código, em três pontos

**Aviso de leitura, e é o ponto desta subseção:** quem for tipar `dados` por
variante (§5.6, §7 item 1) **não pode copiar a tabela do §5.2** — ela está
errada em três lugares. A forma correta precisa ser redigida **contra o
código** e depois **ratificada**; ela não existe ainda, e este catálogo
**não a inventa aqui**.

**Por que esta subseção registra a divergência em vez de "consertar" a
tabela.** O §5.2 é o registro do que foi observado quando foi escrito. Editar
a tabela no lugar apagaria a evidência de que o catálogo derivou do código, e
substituiria uma observação datada por uma redação nova sem autoridade — que
é exatamente a armadilha que se quer evitar (o próximo leitor copiaria a
redação nova achando que ela foi verificada). O §5.2 fica **intacto**; esta
subseção diz, ponto a ponto, onde ele deixou de bater.

`OBSERVED` (leitura direta por este agente, 2026-08-18):

| # | O que o §5.2 diz | O que o código faz | Fonte lida |
|---|---|---|---|
| 1 | **quatro** `tipo` (e o mesmo vale para a união do §5.1) | o enum tem **cinco**: falta `observacao-clinica-registrada` | `packages/contratos/asyncapi.yaml:386-391` (enum FECHADO) e `apps/api/src/db.ts:1120-1126` (`OUTBOX_TO_CONTRACT_EVENT`, que mapeia `clinical_observation_recorded` → `observacao-clinica-registrada`) |
| 2 | `observacoes-ingeridas` carrega `{ encontroId, leitoId, pacienteRef }` | carrega **também** `aceitas` e `quarentena` (duas contagens) | `apps/api/src/db.ts:588-601` |
| 3 | `avaliacao-computada` carrega `{ encontroId, leitoId, pacienteRef, avaliacao }`, "inclui `ResultadoAvaliacao` completo" | carrega `{ encontroId, status, escore, banda }` — **sem** `leitoId`, **sem** `pacienteRef`, e **sem** `ResultadoAvaliacao` | `apps/api/src/db.ts:647-659` |

**O item 3 é o mais consequente, e na direção segura.** O payload NÃO carrega
o `ResultadoAvaliacao` completo — logo não carrega `explicacao`, `anotacoes`,
`motivos` nem o envelope de despacho. Um documento que afirmasse o contrário
levaria quem tipar `dados` a **declarar no contrato um payload clínico que o
produtor não emite**, e — pior — a construir consumidor que espera veredito
onde só há um resumo. Registrar isso agora é mais barato que descobrir depois
da tipagem.

**Por que o gate fica VERDE sobre as três divergências — verificado, não
suposto.** `scripts/check_contratos.mjs` (Parte C, linhas 683-720) lê deste
arquivo **um único padrão**: a união `tipo: "…" | "…";` do §5.1. Sobre ela faz
duas perguntas, e nenhuma das duas alcança o item 1:

- *"todo tipo documentado no catálogo existe no contrato?"* — os quatro do
  §5.1 existem; **verde**. A pergunta inversa (todo tipo do contrato está
  documentado no catálogo?) **não é feita nesses termos**;
- *"todo tipo do contrato aparece no catálogo §5.1 **ou** na imagem de
  `OUTBOX_TO_CONTRACT_EVENT`?"* — `observacao-clinica-registrada` está na
  imagem do mapa, logo é **permitido** mesmo ausente do catálogo; **verde**.
  Essa checagem existe para impedir evento **inventado** no contrato, não para
  impedir evento **omitido** no catálogo. Ela faz o que promete; o que não se
  pode é ler o verde dela como acordo entre catálogo e enum.

Os itens 2 e 3 (forma de `dados`) não são alcançados por checagem alguma:
enquanto `dados` for `unknown` no contrato, **não há o que um gate compare** —
a divergência é entre **prosa** e **código**, e nenhum verificador deste
repositório lê as duas. É a mesma limitação já registrada em §5.4 para o
plano de controle.

Vale ler isto junto com o achado de método registrado em
`docs/14-devsecops-and-delivery/ci-policy.md` §5: um gate verde sobre o enum
não diz nada sobre o payload, e a ausência de vermelho aqui nunca foi
evidência de acordo.

> **Pendência de decisão — o que fecharia `ACH-O3-16`.** *Quem decide:* o
> dono de `ADR-0010` (envelope e catálogo de eventos) — a redação da forma de
> `dados` por variante é conteúdo de contrato, não de agente. *Que evidência
> fecharia:* uma tabela de payload redigida **contra o código** (não contra
> este §5.2), ratificada, e um gate que a confronte com o produtor, de modo
> que a próxima divergência apareça em vermelho e não em prosa. *Efeito
> bloqueante hoje:* §7 item 1 e §5.6 não podem avançar a partir desta
> tabela. `owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA`.

### 5.6 `ACH-O3-6` (fecho PARCIAL) — `sequencia` negativa fechada; tipar `dados` por variante segue aberto

**Enquadramento corrigido, e a correção importa.** A revisão adversarial
apresentou este achado como "quebra a alegação de conformidade" do contrato.
Isso **não se sustenta**: não havia alegação a quebrar — o
`packages/contratos/asyncapi.yaml` declara explicitamente que `dados` **não é
tipado por variante nesta fatia**, e §5.1/§5.3 acima dizem o mesmo. Um
documento que declara a própria lacuna não a está violando. Registrar a
refutação do enquadramento é parte de registrar o achado: adotar a redação do
revisor teria criado, no catálogo, uma não-conformidade inexistente.

**A violação REAL, não declarada em lugar nenhum, e essa foi fechada.**
`asyncapi.yaml` declara `minimum: 0` para `sequencia` (`asyncapi.yaml:450`), e
uma linha de outbox plantada podia produzir um quadro com `sequencia`
**negativa** — valor que o próprio contrato proíbe, publicado sem que nada o
barrasse. Fecho: um quadro cuja `sequencia` não é publicável **não é
emitido**. Rastreio no código: `apps/api/src/db.ts:1147` e
`apps/api/src/db.test.ts:670-740` (*"quadro de fluxo com sequencia não
publicável não é emitido"*).

**O que continua ABERTO.** Tipar `dados` por variante de `tipo`. Isto exige
**decisão de contrato** — e, desde `ACH-O3-16` (§5.5), exige também que a
redação seja feita contra o código, não contra o §5.2. É a mesma pendência já
listada em §5.3 ("`dados` ainda não é tipado por variante") e em §7 item 1;
`ACH-O3-6` apenas a nomeia e a liga à evidência.

> **Pendência de decisão — o que fecharia a parte aberta de `ACH-O3-6`.**
> *Quem decide:* o dono de `ADR-0010` (fechar o enum de `event_type` de
> `WorkItem`, §2.3, é pré-requisito declarado) e quem ratificar a forma de
> `dados` por variante. *Que evidência fecharia:* schema por variante em
> `asyncapi.yaml`, tipo discriminado correspondente em `asyncapi.ts`, e gate
> que confronte os dois com o produtor. *Efeito bloqueante hoje:* §7 item 1.
> `owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA`.

### 5.7 Identificadores usados em §5.5/§5.6, e o que estas subseções NÃO fazem

`ACH-O3-6` e `ACH-O3-16` são **documento-locais, pendentes de ratificação em
`docs/00-governance/traceability-policy.md` §1.1** — mesmo regime já
declarado neste catálogo para os rótulos `EV-N`, e o mesmo usado para
`ACH-O3-1`/`ACH-O3-2` alhures. **Nenhum prefixo global novo é cunhado**: a
família `ACH-*` já está em uso neste repositório.

Estas subseções **não** tipam `dados`, **não** redigem a tabela de payload
correta, **não** promovem `ADR-0010` a `implemented`/`verified`, **não**
fecham `SR-*`/`MG-*` algum e **não** aceitam risco residual. Nenhum dado real
foi acessado; todo exemplo segue sob o marcador `SYNTH-` (GDEC-0014). Estado
factual duro inalterado: 0 vias clínicas acionáveis, 47/47 inelegíveis,
`Observation` da AMH não consumível, safety case **M0**.

### 5.8 Contabilidade 6/5/1 do outbox (adendo da varredura de verdade documental, 2026-09-19 — achado MAJ-7)

O outbox emite **seis** `event_type` distintos; o replay mapeia **cinco** ao
vocabulário de `EventoFluxo`; **um** fica deliberadamente de fora. Esta
contabilidade é o registro que não existia em lugar algum (achado MAJ-7 da
auditoria forense de 2026-09-19). **Reprovada contra o estado fundido pós-
ORQ-2/3 (7f8c541, 2026-09-19):** o fluxo ORQ-3 acrescentou supressão de
alerta auditada — `alerta-suprimido` é command do LIVRO DE AUDITORIA, não
`event_type` de outbox — de modo que a contabilidade 6/5/1 PERMANECE; as
linhas abaixo foram atualizadas (as originais, contra d7a49dd, eram 263 /
591 / 650 / 697 / 1068,1086 / 670-677 / 1120-1126 / 1145-1146):

| `event_type` (outbox) | Emitido em | Destino no replay |
|---|---|---|
| `clinical_observation_recorded` | `clinical-repository.ts:270` | → `observacao-clinica-registrada` |
| `observacoes-ingeridas` | `apps/api/src/db.ts:600` | → `observacoes-ingeridas` |
| `avaliacao-computada` | `apps/api/src/db.ts:683` | → `avaliacao-computada` |
| `alerta-criado` | `apps/api/src/db.ts:763` | → `alerta-criado` |
| `alerta-atualizado` | `apps/api/src/db.ts:1147,1165` (transição de item de trabalho, via `outboxEventType`) | → `alerta-atualizado` |
| `regra-despachada` | `apps/api/src/db.ts:703-710` | **SEM mapeamento — deliberado** |

O mapa é `OUTBOX_TO_CONTRACT_EVENT` (`apps/api/src/db.ts:1199-1205`). O
sexto tipo, `regra-despachada`, NÃO pertence ao vocabulário de `EventoFluxo`
do contrato — comentário de `db.ts:699-702`: "ele é registro durável
interno, não mensagem de canal" — e o replay o OMITE (`db.ts:1224-1225`,
`if (tipo === undefined) continue;`): o que não é publicável não é
publicado. O §5.2 permanece INTACTO (ver §5.5, ACH-O3-16): quem for redigir
payloads contra o código não pode copiar o §5.2, e esta subseção não tipa
`dados`, não fecha `ACH-O3-16` e não altera o estado factual duro acima.

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
