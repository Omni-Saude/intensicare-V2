-- 0004_escopo_selado.sql — o escopo de tenant deixa de ser regravável pela aplicação
--
-- POR QUE ESTA MIGRAÇÃO EXISTE (ACHADO-02, P1)
-- --------------------------------------------
-- Revisão adversarial independente refutou a cláusula "tenant A não lê nem
-- escreve de B". Até a `0003`, o escopo vivia num parâmetro de sessão
-- (`app.tenant_id`) que o PRÓPRIO papel de aplicação podia reescrever: dentro
-- de uma transação já escopada em A, um `set_config('app.tenant_id','B',true)`
-- reescopava a transação em curso, e leitura E escrita cross-tenant passavam.
--
-- A `0003` fechou a recuperação de SUPERUSUÁRIO. Não fechou a TROCA DE TENANT.
-- O cabeçalho da `0003` afirmava endereçar "qualquer caminho capaz de executar
-- SQL arbitrário no processo" — afirmação larga demais, corrigida lá.
--
-- Por que não bastava proteger o `set_config`: no PostgreSQL, um parâmetro
-- personalizado (`app.*`) é `PGC_USERSET`. Não existe ACL para ele — `GRANT SET
-- ON PARAMETER` só alcança parâmetros que exigem superusuário. Qualquer papel
-- pode escrever qualquer `app.*` na própria sessão. Logo NENHUM esquema
-- baseado em parâmetro de sessão pode ser tornado imutável, e a âncora precisa
-- ser um objeto que a aplicação não tem privilégio de escrever.
--
-- DESENHO
-- -------
-- O escopo passa a ser gravado numa tabela do esquema `intensicare_escopo`,
-- de propriedade do papel de migração, sobre a qual a aplicação NÃO tem nenhum
-- privilégio. A aplicação só alcança duas funções `SECURITY DEFINER`:
--
--   `instalar(text)`      grava o escopo da transação corrente. RECUSA trocar
--                         um escopo já instalado nesta transação — inclusive
--                         quando o selo foi desfeito por `ROLLBACK TO
--                         SAVEPOINT`, graças ao marcador não-transacional.
--   `tenant_atual()`      lê o escopo da transação corrente. É esta função —
--                         e não mais `current_setting` — que as políticas de
--                         RLS consultam.
--
-- A linha é chaveada por `(pid do backend, id da transação)`. Uma transação que
-- não chamou `instalar` não casa com linha nenhuma, `tenant_atual()` devolve
-- NULL, a comparação vira NULL e nem leitura nem escrita passam (fail-closed).
-- Uma conexão devolvida ao pool e reusada abre transação NOVA, com id novo, e
-- portanto não herda escopo — a garantia deixa de depender do `DISCARD ALL`.
--
-- LIMITE HONESTO — o que esta migração NÃO faz (lista exaustiva conhecida)
-- ------------------------------------------------------------------------
-- 1. NÃO impede que a aplicação ENCERRE a transação e abra outra com outro
--    tenant (`COMMIT; BEGIN; instalar('B')`). Isso é estrutural e não é
--    decidível pelo banco: a mesma conexão, em transações diferentes, atende
--    tenants diferentes — é assim que um pool multi-tenant funciona, e o banco
--    não distingue "requisição legítima de outro tenant" de "requisição
--    forjada". Escolher o tenant ao ABRIR a transação é matéria da identidade
--    autenticada (SEC-0001 / THR-0001), que NÃO está fechada nesta fatia.
-- 2. NÃO impede que um `ROLLBACK TO SAVEPOINT` anterior ao `instalar` DESTRUA
--    o escopo. O que ela garante nesse caso é fail-closed: a transação fica
--    SEM escopo (nenhuma linha visível) e NÃO consegue instalar outro tenant
--    — o marcador não-transacional recusa. Perder o escopo é degradação
--    segura; trocá-lo seria vazamento.
-- 3. NÃO cobre quem já pode executar SQL arbitrário FORA do corpo da
--    transação da aplicação (isto é, quem controla o próprio `comTenant`).
--    Contra esse adversário nenhuma âncora de banco ajuda — é SEC-0001.
--
-- O que ela fecha é o pivô DENTRO de uma transação em voo (THR-0050, SQL
-- arbitrário injetado no corpo da transação), que é o alcance realista de
-- injeção de SQL e de dependência comprometida.
--
-- CUSTO OPERACIONAL (declarado, não escondido): toda transação escopada passa a
-- escrever uma linha, inclusive as de leitura. A tabela é `unlogged` (não gera
-- WAL), tem chave primária no pid e é atualizada no lugar, então guarda no
-- máximo uma linha por pid de backend já usado — não cresce com o tráfego.
-- Nenhum alvo de latência foi decidido (ADR-0011 §3, VALIDATION REQUIRED), logo
-- não há SLO a violar; o custo fica registrado para medição futura.
--
-- IDEMPOTENTE e reaplicável. PREMISSA reversível (ADR-0016, regime
-- GDEC-0015/GDEC-0017). Não fecha SEC-0009, SAF-0008, THR-0050 nem MG-G6.

-- 1) Esquema da âncora ---------------------------------------------------------
create schema if not exists intensicare_escopo;

do $$
begin
  if (select coalesce(rolsuper, false)
        or pg_has_role(current_user, 'intensicare_migrador', 'MEMBER')
      from pg_roles where rolname = current_user)
  then
    execute 'alter schema intensicare_escopo owner to intensicare_migrador';
  end if;
end
$$;

-- 2) Tabela de selo ------------------------------------------------------------
-- `unlogged`: é estado efêmero de sessão. Perdê-lo numa queda é correto — o que
-- não pode acontecer é uma transação ver o selo de OUTRA, e disso cuida a chave
-- `(pid, inicio_txn)`.
create unlogged table if not exists intensicare_escopo.selo (
  pid integer primary key,
  inicio_txn xid8 not null,
  tenant_id text not null,
  instalado_em timestamptz not null default clock_timestamp()
);

-- Marcador NÃO-TRANSACIONAL de "esta transação já instalou um escopo".
-- POR QUE UMA SEQUÊNCIA: o selo é uma LINHA, e `ROLLBACK TO SAVEPOINT` desfaz
-- linhas. Com um savepoint ANTERIOR ao `instalar`, o selo era desfeito e outro
-- tenant podia ser instalado na MESMA transação (ACHADO-04, 2ª revisão
-- adversarial). Verificado contra PostgreSQL 16.14 real que NÃO servem como
-- âncora: linha de tabela (desfeita), advisory lock de transação (liberado no
-- rollback da subtransação, inclusive por `EXCEPTION` em plpgsql) e parâmetro
-- de sessão (transacional). Sequência serve: `setval` sobrevive a
-- `ROLLBACK TO SAVEPOINT`, a `ROLLBACK` completo e a aborto de subtransação,
-- e `currval` é estado DE SESSÃO (verificado com duas sessões concorrentes).
-- A aplicação não recebe nenhum privilégio sobre ela: só as funções
-- `SECURITY DEFINER` a tocam, logo o marcador não é forjável nem zerável.
create sequence if not exists intensicare_escopo.marcador_txn as bigint minvalue 1;

do $$
begin
  if (select coalesce(rolsuper, false)
        or pg_has_role(current_user, 'intensicare_migrador', 'MEMBER')
      from pg_roles where rolname = current_user)
  then
    execute 'alter table intensicare_escopo.selo owner to intensicare_migrador';
    execute 'alter sequence intensicare_escopo.marcador_txn owner to intensicare_migrador';
  end if;
end
$$;

revoke all on sequence intensicare_escopo.marcador_txn from public;
revoke all on sequence intensicare_escopo.marcador_txn from intensicare_app;

-- A aplicação NÃO recebe nenhum privilégio sobre a tabela. Só `USAGE` no
-- esquema (para poder chamar as funções) — nunca `CREATE`.
revoke all on schema intensicare_escopo from public;
revoke all on intensicare_escopo.selo from public;
revoke all on intensicare_escopo.selo from intensicare_app;
grant usage on schema intensicare_escopo to intensicare_app;

-- 3) Leitura do escopo — é isto que a RLS consulta ------------------------------
-- `stable`: o planejador a avalia uma vez por consulta, não por linha.
-- `security definer`: só ela alcança a tabela de selo.
-- `search_path` fixo: fecha o sequestro de resolução de nome, que é o modo de
-- falha clássico de função `SECURITY DEFINER`.
create or replace function intensicare_escopo.tenant_atual() returns text
  language sql
  stable
  security definer
  set search_path = pg_catalog, pg_temp
as $$
  select s.tenant_id
    from intensicare_escopo.selo s
   where s.pid = pg_catalog.pg_backend_pid()
     and s.inicio_txn = pg_catalog.pg_current_xact_id_if_assigned()
$$;

-- 4) Instalação do escopo — write-once por transação ----------------------------
create or replace function intensicare_escopo.instalar(p_tenant text) returns text
  language plpgsql
  volatile
  security definer
  set search_path = pg_catalog, pg_temp
as $$
declare
  v_txn        xid8;
  v_existente  text;
  v_marcador   bigint;
begin
  if p_tenant is null or btrim(p_tenant) = '' then
    raise exception 'escopo de tenant vazio recusado — escopo ausente jamais vira consulta sem predicado de tenant'
      using errcode = '22023';
  end if;

  -- Força a atribuição do id de transação: é ele que amarra o selo a ESTA
  -- transação e faz uma transação vizinha (ou futura) não casar com a linha.
  v_txn := pg_catalog.pg_current_xact_id();

  select s.tenant_id into v_existente
    from intensicare_escopo.selo s
   where s.pid = pg_catalog.pg_backend_pid()
     and s.inicio_txn = v_txn;

  if found then
    if v_existente is distinct from p_tenant then
      -- O pivô de tenant no meio de uma transação em voo é EXATAMENTE o
      -- ACHADO-02. Recusa alta, com código de privilégio insuficiente.
      raise exception
        'escopo de tenant já instalado nesta transação (%) — troca para % recusada',
        v_existente, p_tenant
        using errcode = '42501';
    end if;
    return v_existente;
  end if;

  -- Não há selo para ESTA transação. Duas situações possíveis, e elas precisam
  -- ser distinguidas: (a) a transação nunca instalou escopo — caminho normal;
  -- (b) instalou e o selo foi DESFEITO por `ROLLBACK TO SAVEPOINT`. Só o
  -- marcador não-transacional sabe diferenciar, porque só ele sobrevive ao
  -- rollback da subtransação.
  begin
    v_marcador := pg_catalog.currval('intensicare_escopo.marcador_txn');
  exception
    when object_not_in_prerequisite_state then
      v_marcador := null;  -- nenhuma instalação nesta conexão ainda
  end;

  if v_marcador is not null and v_marcador = v_txn::text::bigint then
    raise exception
      'esta transação já instalou um escopo e o selo foi desfeito (rollback de savepoint) — instalar % é recusado; abra uma transação nova',
      p_tenant
      using errcode = '42501';
  end if;

  perform pg_catalog.setval('intensicare_escopo.marcador_txn', v_txn::text::bigint, true);

  insert into intensicare_escopo.selo (pid, inicio_txn, tenant_id)
       values (pg_catalog.pg_backend_pid(), v_txn, p_tenant)
  on conflict (pid) do update
       set inicio_txn   = excluded.inicio_txn,
           tenant_id    = excluded.tenant_id,
           instalado_em = clock_timestamp();

  -- Mantido apenas para observabilidade/diagnóstico. NENHUMA política depende
  -- mais deste parâmetro — reescrevê-lo não muda o que a RLS mostra.
  perform set_config('app.tenant_id', p_tenant, true);
  return p_tenant;
end
$$;

do $$
begin
  if (select coalesce(rolsuper, false)
        or pg_has_role(current_user, 'intensicare_migrador', 'MEMBER')
      from pg_roles where rolname = current_user)
  then
    execute 'alter function intensicare_escopo.tenant_atual() owner to intensicare_migrador';
    execute 'alter function intensicare_escopo.instalar(text) owner to intensicare_migrador';
  end if;
end
$$;

revoke all on function intensicare_escopo.tenant_atual() from public;
revoke all on function intensicare_escopo.instalar(text) from public;
grant execute on function intensicare_escopo.tenant_atual() to intensicare_app;
grant execute on function intensicare_escopo.instalar(text) to intensicare_app;

-- 5) As políticas passam a consultar o selo, não o parâmetro de sessão ----------
do $$
declare
  tabela record;
  nome_politica text;
begin
  for tabela in
    select c.oid::regclass as referencia, c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
  loop
    nome_politica := tabela.relname || '_tenant_isolation';
    execute format('drop policy if exists %I on %s', nome_politica, tabela.referencia);
    execute format(
      'create policy %I on %s using (tenant_id = intensicare_escopo.tenant_atual()) with check (tenant_id = intensicare_escopo.tenant_atual())',
      nome_politica, tabela.referencia);
  end loop;
end
$$;

-- 6) VERIFICAÇÃO FAIL-CLOSED ----------------------------------------------------
do $$
declare
  quantidade integer;
  pendentes text;
begin
  -- 6.1 nenhuma política pode ter ficado presa ao parâmetro de sessão
  select string_agg(distinct c.relname, ', ') into pendentes
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and (
       pg_get_expr(pol.polqual, pol.polrelid) not ilike '%tenant_atual%'
       or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') not ilike '%tenant_atual%'
     );
  if pendentes is not null then
    raise exception
      'política(s) ainda ancoradas em parâmetro de sessão regravável pela aplicação: %', pendentes
      using errcode = '42501';
  end if;

  -- 6.2 a aplicação não pode ter NENHUM privilégio sobre a tabela de selo.
  -- `has_table_privilege` (e não `information_schema.table_privileges`) porque
  -- ele resolve privilégio HERDADO de papel: `pg_write_all_data` concede
  -- INSERT/UPDATE/DELETE em todas as tabelas — inclusive nesta, que por
  -- construção não tem RLS — e permitiria FORJAR o selo. Concessão indireta
  -- não aparece em `information_schema` como concessão direta.
  -- Avaliado sobre TODOS os papéis alcançáveis: intensicare_app é NOINHERIT,
  -- então o privilégio de pg_write_all_data só aparece depois de um SET ROLE.
  select count(*) into quantidade
    from pg_roles alvo
   where pg_has_role('intensicare_app', alvo.oid, 'MEMBER')
     and has_table_privilege(alvo.oid, 'intensicare_escopo.selo',
           'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER');
  if quantidade > 0 then
    raise exception
      'intensicare_app alcança % papel(is) com privilégio sobre a âncora intensicare_escopo.selo (ex.: pg_write_all_data) — o selo ficaria forjável',
      quantidade
      using errcode = '42501';
  end if;

  -- 6.2b nem sobre o marcador não-transacional: poder chamar `setval` nele
  -- devolveria ao atacante a capacidade de apagar a memória de "já instalei".
  select count(*) into quantidade
    from pg_roles alvo
   where pg_has_role('intensicare_app', alvo.oid, 'MEMBER')
     and has_sequence_privilege(alvo.oid, 'intensicare_escopo.marcador_txn',
           'SELECT, UPDATE, USAGE');
  if quantidade > 0 then
    raise exception
      'intensicare_app alcança % papel(is) com privilégio sobre intensicare_escopo.marcador_txn — o marcador anti-savepoint ficaria forjável',
      quantidade
      using errcode = '42501';
  end if;

  -- 6.3 a aplicação não pode criar objeto no esquema da âncora
  if has_schema_privilege('intensicare_app', 'intensicare_escopo', 'CREATE') then
    raise exception 'intensicare_app tem CREATE em intensicare_escopo' using errcode = '42501';
  end if;

  -- 6.4 as funções precisam ser SECURITY DEFINER e do papel de migração
  select count(*) into quantidade
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'intensicare_escopo'
     and p.proname in ('instalar', 'tenant_atual')
     and (not p.prosecdef or pg_get_userbyid(p.proowner) <> 'intensicare_migrador');
  if quantidade > 0 then
    raise exception
      '% função(ões) de escopo sem SECURITY DEFINER ou fora da propriedade de intensicare_migrador',
      quantidade
      using errcode = '42501';
  end if;
end
$$;
