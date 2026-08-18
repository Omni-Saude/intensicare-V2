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
- nenhuma função `SECURITY DEFINER` **de terceiro** é executável pela aplicação
  fora do par selado — e a aplicação não pode plantar a própria (sem `CREATE`
  em esquema nenhum, sem `TEMP` no banco). Uma função assim, criada pelo
  migrador, **forja o selo e pivota de tenant**; o `EXECUTE` para `PUBLIC` é
  concedido pelo PostgreSQL **por padrão** (ACHADO-17);
- nenhuma relação alcançável é **ancestral** por herança/partição sem ter ela
  própria RLS+FORCE+política ancorada: numa consulta ao ancestral valem as
  políticas **dele**, e as das descendentes são ignoradas (ACHADO-18);
- **DDL executado depois do boot** não escapa: com o fecho de runtime da `0006`
  armado, o próprio banco aborta o `GRANT`/`INHERIT`/`DROP POLICY` que quebraria
  o invariante, e o dono do esquema não alcança nem desarma a âncora de escopo
  (F1/F2 — ver a seção da `0006`);
- o escopo **é a primeira escrita** da transação e não pode ser trocado depois,
  também pelo ponto de entrada que `apps/api` usa (F4);
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

**O contrato "o escopo é a primeira escrita" deixou de ser NÃO VERIFICADO.**
Ele era, até aqui, leitura de código. Hoje é exercido por tentativa, contra
PostgreSQL real, com quatro vetores: (1) dentro de `comTenant`, um
`instalar(B)` é recusado com `42501` e a mensagem **"já instalado nesta
transação"** — mensagem que discrimina os três estados possíveis e prova que o
escopo foi instalado **antes** de o corpo da transação rodar; (2) reinstalar o
mesmo tenant devolve o escopo vigente, o que só é possível se existir selo
válido para o id de transação corrente; (3) o mesmo pelo ponto de entrada que
`apps/api/src/db.ts` de fato usa (`withTenantTransaction` sobre a porta); (4)
controle **negativo**: numa transação crua, `pg_current_xact_id()` antes do
`instalar` faz o instalador recusar com "já escreveu sem selo de escopo
válido". `pg_current_xact_id()` atribui o id de forma determinística, ao
contrário de `nextval`.

**Medição descartada, registrada para que ninguém a reintroduza:**
`pg_stat_xact_user_tables` parecia a evidência independente ideal ("a única
tabela de usuário escrita até aqui é a âncora") e **falha de forma
intermitente** — as contagens pendentes de um backend só são liberadas por
`pgstat_report_stat`, limitado por intervalo mínimo, de modo que numa execução
rápida a transação seguinte ainda enxerga as 13 tabelas escritas pela semeadura
anterior. Uma asserção que depende de quanto tempo passou não é evidência.

### Fecho de privilégio: função de terceiro e herança (`0005_fecho_de_privilegio.sql`)

A `0004` recusa todo caminho de privilégio que **alcance**
`intensicare_escopo.selo`, com fecho transitivo por `pg_rewrite` — o que cobre
view e matview. Duas superfícies ficavam fora, e as duas foram **medidas como
exploráveis** contra PostgreSQL 16.14:

**ACHADO-17 — função `SECURITY DEFINER` de terceiro.** O corpo de uma função em
SQL/PL-pgSQL **não** gera dependência em `pg_depend` sobre as relações que
referencia (só `BEGIN ATOMIC` gera), e SQL dinâmico derrota qualquer análise de
texto — logo o fecho por alcance não a enxerga. Uma função criada pelo
**migrador** que escreve no selo reescopa a transação em voo: escopo instalado
em A, chamada à função, `tenant_atual()` passa a devolver B, leitura **e**
escrita cross-tenant passam. E o gatilho é o padrão do próprio PostgreSQL:
`CREATE FUNCTION` concede `EXECUTE` a `PUBLIC` **sem nenhum `GRANT` escrito**.
Fecho em duas camadas: a `0005` **desarma o padrão**
(`ALTER DEFAULT PRIVILEGES ... REVOKE EXECUTE ON ROUTINES FROM PUBLIC` para o
papel de migração, mais o revoke do que já existe) e **audita** — nenhuma função
`SECURITY DEFINER` de terceiro executável pela aplicação fora do par selado.
A regra é de **superfície, não de alcance**, e por isso é conservadora: recusa
também função que não toca o selo. Medido: num banco recém-provisionado esse
conjunto é exatamente {`instalar`, `tenant_atual`}, contando `pg_catalog` — zero
falso positivo na linha de base. Revogar `EXECUTE` de `PUBLIC` **não** quebra o
gatilho append-only: execução de função de gatilho não passa por verificação de
`EXECUTE` do usuário corrente (medido).

**ACHADO-18 — herança anexada depois das migrações.** A hipótese levantada era
que anexar uma **filha** a uma tabela protegida vazaria. Medido: **não vaza** —
numa consulta ao pai, a política do **pai** é aplicada às linhas vindas das
filhas (o plano mostra o `Filter` sobre a filha). O que vaza é o **sentido
inverso**: `ALTER TABLE organizations INHERIT public.novo_pai` seguido de
`GRANT SELECT ON public.novo_pai` entrega **todas** as linhas de **todos** os
tenants, porque numa consulta ao ancestral valem as políticas **dele** e as das
descendentes são ignoradas. O ancestral não precisa nem ter coluna `tenant_id`
(basta um subconjunto das colunas da descendente) — e era exatamente esse o
ponto cego: a guarda de runtime só olhava relações **com** `tenant_id`, então o
diagnóstico de `abrir()` devolvia **zero em todos os contadores** num banco onde
a aplicação lia e escrevia todos os tenants. A exposição é transitiva
(avô → pai → tabela protegida) e o elo do meio não precisa ser alcançável.

**Limite de TEMPO da `0005`.** As auditorias de migração rodam quando a
**migração** roda; a guarda de identidade roda quando o processo **abre** o
pool. Um `ALTER TABLE ... INHERIT`, um `CREATE FUNCTION ... SECURITY DEFINER`
ou um `GRANT` avulso executado **no meio da vida de um processo já aberto** não
é reavaliado por nenhuma das duas. Isso era **"fechado até o próximo deploy"**,
não "fechado" — e é o que a `0006` endereça.

### Âncora isolada e guarda de DDL (`0006_ancora_isolada.sql`)

Os dois limites acima foram **atacados contra PostgreSQL 16.14 real** antes de
serem fechados, e os dois ataques tiveram êxito:

- **F1** — como `intensicare_migrador`, pós-migração e pós-boot, uma função
  `SECURITY DEFINER` que faz `select ... from intensicare_escopo.selo`, com
  `GRANT EXECUTE` para a aplicação, devolveu a **tabela de selo inteira**: `pid`
  e `tenant_id` de todos os backends, isto é, **qual tenant cada conexão do pool
  atendeu por último**. O fecho da `0004` §6.2 é transitivo por `pg_rewrite` e
  cobre view/matview — **não cobre função**;
- **F2** — como `intensicare_migrador`, pós-boot: `create table synth_pai` +
  `alter table organizations inherit synth_pai` + `grant select on synth_pai`.
  Os três comandos passaram e o processo **já aberto** passou a devolver as
  linhas dos dois tenants.

O fecho tem duas naturezas diferentes, de propósito:

1. **Âncora isolada (estrutura, não auditoria).** O selo e as duas funções
   seladas deixam de pertencer ao dono do esquema e passam a pertencer a
   `intensicare_selo` — papel `NOLOGIN`, sem atributos, do qual **ninguém é
   membro**. Medido: a partir do migrador, passam a ser recusados **pelo banco**
   o `select` direto, o `update`, o `grant`, o `set role`, o
   `alter table ... owner to` e o `drop schema ... cascade`; a função
   `SECURITY DEFINER` até pode ser criada, mas **nunca lê**. Não existe instante
   "entre verificações". Vale contra qualquer papel que não seja superusuário.
   O migrador conserva apenas `USAGE` no esquema — necessário e suficiente para
   ele seguir criando políticas que citam `intensicare_escopo.tenant_atual()`.
2. **Guarda de DDL (`EVENT TRIGGER` em `ddl_command_end`).** Reexecuta os
   invariantes ao fim de **cada** comando de DDL e **aborta** o que os viole.
   Medido: aborta o `GRANT` que completa o vetor F2 (nas duas ordens), o `GRANT
   EXECUTE` sobre função `SECURITY DEFINER` de terceiro, o `DROP POLICY`, o
   `NO FORCE ROW LEVEL SECURITY` e o `DISABLE ROW LEVEL SECURITY` sobre tabela
   clínica. Criar event trigger exige **superusuário** — e é isso que o torna
   resistente ao próprio migrador, que recebe `must be owner of event trigger`
   ao tentar `DISABLE`/`DROP` e `must be owner of schema` ao tentar derrubar o
   esquema que hospeda a função.

A `0005` recusou o event trigger por ser "um controle presente em alguns
ambientes e ausente noutros". A objeção é respondida por **detecção**, não por
decreto: `AdaptadorPostgres.abrir({ exigirFechoDeRuntime: true })` **recusa
partir** contra um banco sem a âncora isolada ou sem a guarda armada, nomeando
F1 e F2 nos motivos. Ligar ou não é decisão de **topologia** (exige superusuário
no provisionamento), e por isso o padrão é `false` — não porque o controle seja
opcional.

**Como instalar.** O papel de migração não pode: `CREATE ROLE` e
`CREATE EVENT TRIGGER` estão fora do desenho da `0003`. Por isso a `0006` é
aplicada **duas vezes** — no passe do migrador ela só registra `notice`, e o
trabalho é feito por `instalarFechoDeRuntime(urlSuperusuarioNoBanco)`, que
`provisionarBanco` chama por padrão (`fechoDeRuntime: true`).

**Limites honestos da `0006`:**

1. **Superusuário** continua fora do modelo: lê o selo, desarma a guarda e
   ignora RLS.
2. **Reaplicar a cadeia inteira** (`0001..0006`) sobre um banco que já está em
   `0006` **falha, de propósito, dentro da `0004`** — ela contém
   `alter schema/table ... owner to intensicare_migrador` e
   `create or replace function intensicare_escopo.tenant_atual()`, e o migrador
   deixou de ser dono desses objetos. Reaplicar a `0006` sozinha é idempotente
   (asserido na suíte). O caminho suportado é provisionar do zero ou aplicar
   migrações novas. A `0004` **não** foi alterada retroativamente.
3. **Contrato novo para migrações futuras:** com a guarda armada, um `GRANT`
   para a aplicação sobre uma relação só passa **depois** de a relação ter
   `ROW LEVEL SECURITY` + `FORCE` + política ancorada. A ordem "cria, concede,
   protege" deixa de ser aceita; a correta é "cria, protege, concede".
4. As ~20 bases de ataque desta suíte são provisionadas **sem** o fecho
   (`fechoDeRuntime: false`), porque com ele o banco recusa o próprio `CREATE`
   do objeto malicioso e as asserções sobre as camadas de migração e de boot
   passariam **por vacuidade**. O fecho tem ataque próprio, no bloco `(h)`, com
   o par vermelho/verde medido na **mesma execução**.

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

97 testes Vitest, todos contra motor de verdade (sem mocks) e **sem nenhum
`expected fail`** (medido: `pnpm --filter @intensicare/persistencia test` →
5 arquivos, 97 testes, 0 pulados):

- 36 sobre o simulador PGlite: migração, RLS por tenant, outbox transacional,
  auditoria append-only, transição de `WorkItem` e a suíte adversarial de
  `seguranca.test.ts` — incluindo dois testes que **afirmam positivamente** a
  limitação do simulador descrita acima;
- 61 sobre PostgreSQL real e efêmero (`src/postgres/fronteira-postgres.test.ts`),
  descritos na seção "Fronteira de isolamento verificada" acima — dos quais 5
  no bloco `(h)`, que ataca o fecho de runtime da `0006` com o par
  vermelho/verde medido na mesma execução.

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
