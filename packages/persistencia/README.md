# @intensicare/persistencia

Camada de persistência do IntensiCare V2.

## Propósito

Concentra o acesso a dados: migrações SQL puras, RLS (row-level security)
por tenant, outbox transacional (ADR-0010) e auditoria append-only. PREMISSA
(reversível, GDEC-0015/0017; ver
`docs/06-architecture/premissas-de-construcao.md` PRE-03): a classe de
tecnologia é PostgreSQL.

## Dois adaptadores, uma porta

Todo consumidor fala com a porta `PortaBancoDeDados`
(`src/postgres/porta.ts`) e não sabe qual motor está atrás:

| Adaptador | Motor | `fronteiraDeIsolamentoVerificavel` |
| --- | --- | --- |
| `AdaptadorPostgres` | PostgreSQL real, via TCP + SCRAM-SHA-256 | `true` |
| `AdaptadorPglite` | simulador WASM embarcado (dev/teste) | `false` |

**A distinção não é cosmética.** O isolamento por tenant só é uma fronteira
de segurança no `AdaptadorPostgres`, porque lá a aplicação **autentica-se já**
como `intensicare_app` — papel sem `SUPERUSER`, sem `BYPASSRLS`, sem
propriedade de tabela e sem `CREATE` no esquema — enquanto o dono do esquema é
outro papel (`intensicare_migrador`). No simulador a conexão é única e o
usuário autenticado é superusuário: a aplicação só chega ao papel de aplicação
**rebaixando-se**, e desse estado `SET SESSION AUTHORIZATION` devolve o
superusuário, que ignora RLS mesmo com `FORCE ROW LEVEL SECURITY`
(ACHADO-01, ADR-0016 §4.1, THR-0050 P0). Generalizar RLS de PGlite para
produção é anti-padrão explícito do contrato de agentes.

## Fronteira de isolamento verificada contra PostgreSQL real

`src/postgres/fronteira-postgres.test.ts` sobe um PostgreSQL **efêmero de
verdade** (via `scripts/pg-efemero.mjs`), provisiona papéis separados, aplica
as migrações e exercita, de forma **bloqueante**:

- a identidade da aplicação não recupera privilégio por **nenhum** caminho SQL
  (`SET SESSION AUTHORIZATION`, `SET ROLE`, `RESET SESSION AUTHORIZATION`,
  `ALTER ROLE`, `CREATE ROLE`, `GRANT`, DDL de política/gatilho,
  `COPY ... TO PROGRAM`, `pg_read_file`), e a **credencial** da aplicação não
  autentica como superusuário nem como migrador;
- a identidade conectada não alcança, por `SET ROLE`, nenhum papel com
  `SUPERUSER`, `BYPASSRLS` **ou que seja dono de tabela** — alcançar o dono
  basta para desligar o `FORCE ROW LEVEL SECURITY` e escapar da RLS;
- o escopo instalado é **imutável dentro da transação**: reescrever
  `app.tenant_id` não reescopa, o instalador recusa a troca, e um
  `ROLLBACK TO SAVEPOINT` que desfaça o selo deixa a transação **sem** escopo
  em vez de devolver o direito de instalar outro;
- a identidade conectada não alcança privilégio sobre a **âncora do escopo**
  (`intensicare_escopo.selo`, que por construção não tem RLS) — a verificação
  é feita sobre todos os papéis alcançáveis por `SET ROLE`, e não só sobre o
  papel conectado, porque ele é `NOINHERIT` e um `pg_write_all_data` concedido
  a ele só apareceria depois do `SET ROLE`; e cobre privilégio de **coluna**,
  porque `has_table_privilege` é cego a um `GRANT UPDATE (tenant_id)` e um
  `UPDATE` sem `WHERE` não exige `SELECT`;
- **tabela particionada** não escapa: os laços que criam política e a auditoria
  de isolamento cobrem `relkind in ('r','p')`;
- a auditoria e as guardas partem das relações **alcançáveis pelo papel de
  aplicação**, em qualquer esquema — não do esquema `public`. Uma partição
  criada **fora** de `public` nasce sem RLS/FORCE/política e era invisível às
  três camadas; o conjunto auditado é agora `public` ∪ descendentes (partição
  ou herança) ∪ relações que o app alcance por privilégio de tabela ou coluna.
  Esse conjunto é **deliberadamente mais largo** que o laço que cria política
  (restrito a `public`): a migração recusa e obriga o operador a corrigir, em
  vez de plantar política em objeto que talvez nem seja dela;
- a aplicação não pode ter `USAGE` em esquema fora de `public` /
  `intensicare_escopo` — é o que mantém o conjunto acima limitado;
- as sequências dão à aplicação apenas `USAGE`, nunca `SELECT`: `last_value` é
  um contador **global sobre todos os tenants** e nenhuma RLS o cobre
  (sequência não aceita política), logo `SELECT` seria oráculo de volume
  cross-tenant;
- nenhum objeto do schema `public` escapa da auditoria de isolamento:
  MATERIALIZED VIEW e FOREIGN TABLE são **recusadas** (não podem receber
  política de RLS) e VIEW exige `security_invoker=true` (sem isso roda com os
  direitos do dono e contorna a RLS de quem consulta);
- sem `app.tenant_id`, nenhuma das 13 tabelas devolve linha — e a escrita
  também é negada;
- tenant A não lê nem escreve linha de B;
- conexão devolvida ao pool e reusada (mesmo `pg_backend_pid`) não carrega o
  tenant anterior, **mesmo** quando o escopo foi instalado em nível de sessão;
- IDOR sem oráculo de enumeração: id que existe noutro tenant e id
  inexistente produzem resposta idêntica;
- transação abortada não vaza contexto nem escrita;
- migrações em instalação limpa **e** em atualização de banco legado.

Sem PostgreSQL na máquina, a suíte é **pulada com aviso ruidoso** em
desenvolvimento e **falha** em CI ou com `IC_FRONTEIRA_PG=obrigatoria`.
Com `PG_TEST_URL`/`DATABASE_URL` definidas, o servidor apontado é reusado e
nenhum cluster é criado (caminho de `services: postgres`).

```bash
# roda só a suíte de fronteira (sobe e derruba o cluster sozinha)
pnpm --filter @intensicare/persistencia test:fronteira

# ou controle o cluster à mão (útil para iterar)
node scripts/pg-efemero.mjs up      # imprime JSON com a URL de superusuário
node scripts/pg-efemero.mjs down    # derruba e apaga
```

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
- **Separação de identidades** (`migrations/0003_fronteira_papeis.sql`):
  papel dono do esquema (`intensicare_migrador`) distinto do papel de
  aplicação (`intensicare_app`), `CREATE` revogado no esquema `public`, e um
  bloco de **verificação fail-closed** que faz a própria migração **abortar**
  se o papel de aplicação tiver atributo excedente, for dono de tabela,
  alcançar um papel com `SUPERUSER`/`BYPASSRLS`, ou se alguma tabela ficar
  sem `tenant_id`/RLS/`FORCE`/política.

### Escopo selado: a aplicação não pode reescrever o próprio escopo

`migrations/0004_escopo_selado.sql`. Revisão adversarial independente refutou a
cláusula "tenant A não lê nem escreve de B": `app.tenant_id` era um **parâmetro
de sessão**, e o próprio papel de aplicação podia reescrevê-lo. Dentro de uma
transação já escopada em A, um `set_config('app.tenant_id','B',true)` reescopava
a transação em curso — leitura **e** escrita cross-tenant passavam.

Não havia como proteger o parâmetro: no PostgreSQL, um parâmetro personalizado
(`app.*`) é `PGC_USERSET` e não tem ACL — `GRANT SET ON PARAMETER` só alcança
parâmetros que exigem superusuário. A âncora tinha de sair do espaço de
parâmetros. Hoje o escopo vive numa tabela do esquema `intensicare_escopo`,
sobre a qual a aplicação **não tem nenhum privilégio**, chaveada por
`(pid do backend, id da transação)`. A aplicação só alcança duas funções
`SECURITY DEFINER`:

- `instalar(text)` — grava o escopo da transação corrente e **recusa** trocá-lo
  se já houver um instalado nesta transação;
- `tenant_atual()` — lê o escopo; é ela, e não `current_setting`, que as
  políticas de RLS consultam.

Uma transação que não chamou `instalar` não casa com linha nenhuma,
`tenant_atual()` devolve `NULL` e nada passa.

O selo é uma linha, e `ROLLBACK TO SAVEPOINT` desfaz linhas — então um savepoint
**anterior** ao `instalar` desfazia o selo e permitia instalar outro tenant na
mesma transação. A âncora contra isso é a **atribuição do id de transação**:
`pg_current_xact_id_if_assigned()` é `NULL` enquanto a transação não escreveu
nada e passa a ser o id de topo assim que qualquer escrita ocorre — inclusive
uma escrita dentro de subtransação depois revertida. Se a transação já escreveu
e não há selo válido dela, `instalar` recusa.

Medido contra PostgreSQL 16.14, **não** servem como âncora: linha de tabela
(desfeita pelo savepoint); advisory lock de transação (liberado no rollback da
subtransação, inclusive por `EXCEPTION` em plpgsql); parâmetro de sessão
(transacional); e **sequência** — que foi usada numa versão anterior e removida,
porque `DISCARD SEQUENCES` é irrestrito, session-local e, ao contrário de
`DISCARD ALL`, **permitido dentro de bloco de transação**, apagando o estado de
que `currval` dependia. O id de transação sobrevive a `ROLLBACK TO SAVEPOINT` e
a `DISCARD SEQUENCES`, e a aplicação não pode lê-lo, forjá-lo nem apagá-lo.

**Limites honestos (lista exaustiva conhecida):**

1. Não impede que a aplicação **encerre** a transação e abra outra com outro
   tenant (`COMMIT; BEGIN; instalar('B')`). Estrutural: a mesma conexão atende
   tenants diferentes em transações diferentes, que é como um pool multi-tenant
   funciona. Escolher o tenant ao abrir é matéria da identidade autenticada
   (SEC-0001 / THR-0001), que **não** está fechada nesta fatia.
2. Não impede que um `ROLLBACK TO SAVEPOINT` anterior ao `instalar` **destrua**
   o escopo. O que se garante nesse caso é fail-closed: a transação fica **sem**
   escopo (nenhuma linha visível) e **não** consegue instalar outro tenant.
   Perder o escopo é degradação segura; trocá-lo seria vazamento.
3. Não cobre quem executa SQL arbitrário **fora** do corpo da transação — isto
   é, quem controla o próprio `comTenant`. Contra esse adversário nenhuma
   âncora de banco ajuda; é SEC-0001.

O que se fecha é o pivô **dentro** de uma transação em voo (THR-0050), que é o
alcance realista de injeção de SQL e de dependência comprometida.

**Custo declarado — e ele não é só latência.** Toda transação escopada passa a
escrever uma linha, inclusive as de leitura. A tabela é `unlogged`, tem chave
primária no pid e é atualizada no lugar — guarda no máximo uma linha por pid de
backend já usado e não cresce com o tráfego. Nenhum alvo de latência foi
decidido (ADR-0011 §3, VALIDATION REQUIRED), então não há SLO a violar.

O custo **arquitetural** é maior e precisa entrar em qualquer decisão de
topologia:

- uma transação **somente-leitura fica inoperante** — `begin read only` seguido
  de `instalar` falha com `cannot execute INSERT in a read-only transaction`, e
  `default_transaction_read_only` é `PGC_USERSET` (a própria aplicação pode
  ligá-lo e se auto-inutilizar);
- portanto **nenhuma réplica de leitura (hot standby) pode servir esta
  aplicação**, porque nela toda transação é somente-leitura por definição.
  Escalar leitura por réplica exigirá outra âncora de escopo — decisão de
  arquitetura, não deste pacote;
- `nextval` atribui o id de transação de forma **condicional**: medido contra
  PostgreSQL 16.14, só nas chamadas que precisam gravar a tupla da sequência em
  WAL (a primeira, e a seguinte a um `setval`); dentro da janela de cache
  (`SEQ_LOG_VALS` = 32) não atribui. Um `nextval` antes do `instalar` portanto
  quebra o contrato **de forma intermitente**, cerca de 1 vez em 32. O que
  ancora o contrato é a atribuição de id por **escrita**, não `nextval` em si.
  Que os quatro caminhos de transação do produto instalem o escopo como
  primeira instrução após `begin` foi verificado por **leitura de código, não
  por teste** — está registrado como **NÃO VERIFICADO**.

### Contexto vazio ≠ contexto ausente (OBSERVED, PostgreSQL 16 real)

Um parâmetro personalizado que **nunca** foi definido faz
`current_setting('app.tenant_id', true)` devolver `NULL`. Mas depois de
definido uma vez e limpo por `RESET ALL`/`DISCARD ALL` — o que o pool faz a
cada devolução de conexão — ele passa a devolver a **cadeia vazia**. Com a
política original (`tenant_id = current_setting(...)`), uma conexão reciclada
e sem escopo avaliaria `tenant_id = ''`, e o fail-closed passaria a depender
do **conteúdo** da linha em vez da ausência de escopo. Por isso a `0003`
recria todas as políticas com
`tenant_id = nullif(current_setting('app.tenant_id', true), '')`.

Este comportamento **não é observável no simulador**, que tem conexão única e
nunca a recicla — é um exemplo direto de por que a fronteira precisa ser
verificada contra servidor real.

### Nota de implementação sobre papel de sessão (OBSERVED, PGlite 0.5.5)

Sondagem manual confirmou que `SET LOCAL SESSION AUTHORIZATION` e `SET
LOCAL ROLE`, dentro de `db.transaction(...)`, **não revertem** ao final da
transação nesta versão do PGlite (que embarca PostgreSQL 18.3) — diferente do
comportamento padrão do PostgreSQL. Por isso `downgradeToApplicationRole` (em
`session.ts`) rebaixa a conexão de forma **permanente** (sem `LOCAL`), uma
única vez, logo após migrar. **Isso vale só para o simulador e não é um
controle de segurança** — ver a seção "Dois adaptadores, uma porta". O escopo
por tenant usa `set_config('app.tenant_id', ..., true)`, cujo reset no
commit/rollback FOI verificado como correto, e é o mesmo mecanismo do
adaptador de PostgreSQL real.

## Testes

60 testes Vitest, todos contra motor de verdade (sem mocks) e **sem nenhum
`expected fail`**:

- 34 sobre o simulador PGlite: migração, RLS por tenant, outbox transacional,
  auditoria append-only, transição de `WorkItem` e a suíte adversarial de
  `seguranca.test.ts` — incluindo dois testes que **afirmam positivamente** a
  limitação do simulador descrita acima;
- 26 sobre PostgreSQL real e efêmero (`src/postgres/fronteira-postgres.test.ts`),
  descritos na seção "Fronteira de isolamento verificada" acima.

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
