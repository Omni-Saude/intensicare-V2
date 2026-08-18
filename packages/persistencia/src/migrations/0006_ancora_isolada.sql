-- 0006_ancora_isolada.sql — a âncora de escopo sai da propriedade do migrador,
-- e a janela de DDL depois do boot deixa de existir onde houver superusuário.
--
-- POR QUE ESTA MIGRAÇÃO EXISTE
-- ---------------------------
-- A `0005` fechou DUAS superfícies (função `SECURITY DEFINER` de terceiro;
-- herança anexada) em DOIS instantes: quando a MIGRAÇÃO roda e quando o
-- processo ABRE o pool. Ela declarou por escrito, no próprio cabeçalho, o que
-- ficava aberto: "Um `ALTER TABLE ... INHERIT` executado por um superusuário
-- (ou pelo migrador) NO MEIO da vida de um processo já aberto NÃO é detectado
-- por nenhuma das duas até o próximo boot ou a próxima migração."
--
-- O `HANDOFF.yaml`, chave `SEXTA_REVISAO_NAO_CONCLUIDA`, registrou os mesmos
-- dois alvos como ABERTOS (F1 e F2). Eles foram ATACADOS contra PostgreSQL
-- 16.14 real ANTES desta migração, e os dois ataques TIVERAM ÊXITO:
--
--   F1 (leitura do selo por função de terceiro). Como `intensicare_migrador`,
--      pós-migração e pós-boot:
--        create function public.espiar_selo() returns table(pid int, tenant text)
--          language sql security definer
--          as $$ select s.pid, s.tenant_id from intensicare_escopo.selo s $$;
--        grant execute on function public.espiar_selo() to intensicare_app;
--      A aplicação, escopada em A, chamou e recebeu a tabela de selo INTEIRA —
--      pid e `tenant_id` de TODOS os backends vivos, isto é, quais tenants
--      estão sendo servidos naquele instante. Nem a `0004` §6.2 (fecho por
--      `pg_rewrite`, que só alcança view e matview) nem a `0005` §2.1 (que roda
--      em tempo de migração) viram nada: as duas já tinham corrido.
--      OBSERVAÇÃO medida no mesmo ataque: sem o `grant execute` explícito a
--      chamada é recusada — o `alter default privileges ... revoke execute on
--      routines from public` da `0005` funciona. O que faltava era impedir a
--      LEITURA, não só a concessão.
--
--   F2 (herança anexada depois). Como `intensicare_migrador`, pós-boot:
--        create table public.novo_pai (id text);
--        alter table public.organizations inherit public.novo_pai;
--        grant select on public.novo_pai to intensicare_app;
--      Os três comandos passaram. Numa consulta ao ancestral valem as políticas
--      DELE — e ele não tem nenhuma.
--
-- DOIS FECHOS, DE NATUREZAS DIFERENTES
-- ------------------------------------
-- §1 ÂNCORA ISOLADA (fecha F1 por ESTRUTURA, sem depender de auditoria).
--    O selo deixa de pertencer ao papel que é dono do esquema. Ele passa a
--    pertencer a um papel dedicado `intensicare_selo` — `NOLOGIN`, sem nenhum
--    atributo, do qual NINGUÉM é membro (nem o migrador, nem a aplicação). As
--    duas funções seladas passam a ser `SECURITY DEFINER` DESSE papel, que é o
--    único a alcançar a tabela.
--    Consequência medida contra PostgreSQL 16.14: a partir de
--    `intensicare_migrador`, TODOS estes caminhos passam a ser recusados PELO
--    BANCO, não por auditoria — `select` direto no selo; `update` direto;
--    `grant select on ... to intensicare_app`; `create view` sobre o selo (o
--    objeto até se cria, mas toda leitura dele falha); função `SECURITY
--    DEFINER` que o leia (idem: cria, nunca lê); `set role intensicare_selo`;
--    `alter table ... owner to`; `drop schema intensicare_escopo cascade`.
--    Isto NÃO é auditoria: não há instante em que o controle esteja "entre
--    verificações". Vale contra qualquer papel que não seja SUPERUSUÁRIO.
--
-- §2 GUARDA DE DDL (fecha F2, e reforça F1, por EVENT TRIGGER).
--    Um `EVENT TRIGGER` em `ddl_command_end` reexecuta os invariantes da `0005`
--    ao fim de CADA comando de DDL e ABORTA o comando que os viole. É o único
--    mecanismo do PostgreSQL que fecha a janela entre boots. Ele só pode ser
--    criado por SUPERUSUÁRIO — e é isso que o torna resistente ao próprio
--    migrador: medido contra 16.14, `intensicare_migrador` recebe "must be
--    owner of event trigger" ao tentar `ALTER EVENT TRIGGER ... DISABLE` e
--    `DROP EVENT TRIGGER`, e "must be owner of schema" ao tentar derrubar o
--    esquema que hospeda a função.
--    A `0005` recusou este caminho por ser "um controle presente em alguns
--    ambientes e ausente noutros". A objeção é respondida aqui de duas formas,
--    e não por decreto: (a) a instalação é EXPLÍCITA e pedida por quem
--    provisiona (`intensicare.instalar_guarda_ddl`), nunca implícita; (b) o
--    adaptador sabe perguntar se ela está lá — `AdaptadorPostgres` aceita
--    `exigirFechoDeRuntime`, e nesse modo RECUSA abrir contra um banco sem a
--    guarda. Um ambiente sem superusuário não ganha um controle silenciosamente
--    ausente: ele ganha uma recusa de partida, ou uma escolha registrada.
--
-- LIMITES HONESTOS — leia antes de chamar qualquer coisa de "fechada"
-- ------------------------------------------------------------------
-- 1. SUPERUSUÁRIO continua fora do modelo. Ele lê o selo, desabilita a guarda e
--    ignora RLS. É o mesmo limite já declarado na `0004` (item 3) e na `0003`.
-- 2. O migrador continua DONO das tabelas clínicas e das políticas delas. Um
--    migrador comprometido ainda pode `drop policy` — mas agora, com a guarda
--    instalada, esse `drop policy` é ABORTADO pelo event trigger. Sem a guarda,
--    não é. Isto está medido nos dois sentidos na suíte.
-- 3. REAPLICAR A CADEIA INTEIRA (0001..0006) sobre um banco que já está em
--    `0006` FALHA, de propósito, dentro da `0004`: ela contém
--    `alter schema/table ... owner to intensicare_migrador` e
--    `create or replace function intensicare_escopo.tenant_atual()`, e o
--    migrador deixou de ser dono desses objetos. Reaplicar a `0006` sozinha É
--    idempotente (asserido na suíte). O caminho exercitado e suportado é
--    provisionar do zero (`recriarBanco`) ou aplicar migrações NOVAS. Optou-se
--    por NÃO alterar a `0004` retroativamente: o defeito que ela tem é de
--    DESENHO (a âncora pertencer ao dono do esquema), e o conserto é esta
--    migração; mexer nos `owner to` dela para acomodar o `0006` seria reescrever
--    história de esquema já aplicada.
-- 4. A guarda de DDL impõe um CONTRATO NOVO às migrações futuras: um `GRANT`
--    para a aplicação sobre uma relação só passa DEPOIS de a relação ter
--    `ROW LEVEL SECURITY` + `FORCE` + política ancorada em
--    `intensicare_escopo.tenant_atual()`. A ordem "cria, concede, protege"
--    deixa de ser aceita; a ordem correta é "cria, protege, concede".
-- 5. Nada aqui fecha SEC-0009, SAF-0008, SEC-0001, THR-0001 nem THR-0050, e
--    nada aqui fecha MG-G6. PREMISSA reversível (ADR-0016, regime
--    GDEC-0015/GDEC-0017).
--
-- IDEMPOTENTE e reaplicável (ver limite 3 quanto à cadeia inteira).

-- ==========================================================================
-- §1 ÂNCORA ISOLADA
-- ==========================================================================

-- 1.1 O papel guardião. `NOLOGIN` e sem nenhum atributo: ele não é uma
-- identidade de conexão, é só um proprietário. Criá-lo exige SUPERUSER ou
-- CREATEROLE — atributos que o migrador, por desenho da `0003`, não tem. Por
-- isso esta migração é aplicada DUAS vezes pelo provisionamento: uma pelo
-- migrador (que registra o aviso abaixo) e outra pelo superusuário (que faz o
-- trabalho). Ver `../postgres/provisionamento.ts`.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'intensicare_selo') then
    if (select coalesce(rolsuper, false) or coalesce(rolcreaterole, false)
          from pg_roles where rolname = current_user) then
      execute 'create role intensicare_selo '
           || 'nologin nosuperuser nobypassrls nocreatedb nocreaterole noreplication noinherit';
    else
      raise notice
        'papel guardiao intensicare_selo AUSENTE e o papel atual (%) nao pode cria-lo: a ancora de escopo continua pertencendo ao dono do esquema, e F1 (funcao SECURITY DEFINER de terceiro lendo o selo) continua ABERTO. Reaplique esta migracao com um superusuario.',
        current_user;
    end if;
  end if;
end
$$;

-- 1.2 Transferência de propriedade. Só acontece quando o papel corrente pode
-- fazê-la — isto é, quando ele é membro de `intensicare_selo` (o superusuário
-- é membro de todo papel). O migrador NÃO é, e é exatamente esse o ponto.
do $$
declare
  v_pode boolean := false;
begin
  if exists (select 1 from pg_roles where rolname = 'intensicare_selo') then
    v_pode := pg_has_role(current_user, 'intensicare_selo', 'MEMBER');
  end if;

  if not v_pode then
    raise notice
      'transferencia da ancora pulada: o papel atual (%) nao e membro de intensicare_selo. A ancora segue pertencendo ao dono do esquema.',
      current_user;
    return;
  end if;

  -- O esquema inteiro muda de dono: sem isso o migrador ainda poderia
  -- `drop schema intensicare_escopo cascade` e recriar a âncora sob sua
  -- própria propriedade.
  execute 'alter schema intensicare_escopo owner to intensicare_selo';
  execute 'alter table intensicare_escopo.selo owner to intensicare_selo';
  execute 'alter function intensicare_escopo.tenant_atual() owner to intensicare_selo';
  execute 'alter function intensicare_escopo.instalar(text) owner to intensicare_selo';

  -- O migrador perde TUDO sobre a tabela de selo e mantém apenas `USAGE` no
  -- esquema. `USAGE` é necessário e suficiente para ele seguir criando
  -- POLÍTICAS que citam `intensicare_escopo.tenant_atual()` — medido: sem
  -- `USAGE`, `create policy ... using (tenant_id = intensicare_escopo.
  -- tenant_atual())` falha com "permission denied for schema", o que
  -- inutilizaria toda migração futura. E `USAGE` no esquema NÃO dá leitura da
  -- tabela: medido contra 16.14, `select * from intensicare_escopo.selo` como
  -- migrador responde "permission denied for table selo" mesmo com `USAGE`.
  execute 'revoke all on intensicare_escopo.selo from intensicare_migrador';
  execute 'revoke all on intensicare_escopo.selo from public';
  execute 'grant usage on schema intensicare_escopo to intensicare_migrador';
  execute 'grant execute on function intensicare_escopo.tenant_atual() to intensicare_migrador';

  -- A aplicação conserva exatamente o que a `0004` lhe deu: `USAGE` no esquema
  -- e `EXECUTE` no par selado. Nada sobre a tabela.
  execute 'grant usage on schema intensicare_escopo to intensicare_app';
  execute 'grant execute on function intensicare_escopo.tenant_atual() to intensicare_app';
  execute 'grant execute on function intensicare_escopo.instalar(text) to intensicare_app';
end
$$;

-- ==========================================================================
-- §2 GUARDA DE DDL
-- ==========================================================================
-- A instalação é EXPLÍCITA: só ocorre quando quem aplica a migração pede, com
-- `set intensicare.instalar_guarda_ddl = 'sim'`, e é superusuário. Isso
-- mantém o SIMULADOR PGlite (que aplica as migrações como superusuário, mas
-- não pede a guarda) livre de um event trigger que ele não precisa — e mantém
-- a instalação visível na chamada, em vez de implícita no privilégio.
do $$
declare
  v_pedido text := coalesce(current_setting('intensicare.instalar_guarda_ddl', true), '');
  v_super  boolean := (select coalesce(rolsuper, false) from pg_roles where rolname = current_user);
begin
  if v_pedido <> 'sim' then
    return;
  end if;
  if not v_super then
    raise exception
      'guarda de DDL pedida, mas o papel atual (%) nao e superusuario — CREATE EVENT TRIGGER exige superusuario no PostgreSQL 16. Aplique esta migracao com a credencial de superusuario do provisionamento, ou nao peca a guarda.',
      current_user
      using errcode = '42501';
  end if;

  -- Esquema do superusuário. O migrador não é dono e, medido contra 16.14,
  -- recebe "must be owner of schema" ao tentar derrubá-lo — que é o caminho
  -- pelo qual ele derrubaria a função e, por dependência, o próprio gatilho.
  if not exists (select 1 from pg_namespace where nspname = 'intensicare_guarda') then
    execute 'create schema intensicare_guarda';
  end if;
  execute format('alter schema intensicare_guarda owner to %I', current_user);
  execute 'revoke all on schema intensicare_guarda from public';

  -- A função de auditoria. NÃO é `SECURITY DEFINER` de propósito: ela só lê
  -- catálogo (legível por qualquer papel) e levanta exceção. Ser `SECURITY
  -- INVOKER` a mantém fora da contagem `prosecdef` da `0005` §2.1 e do
  -- diagnóstico do pool — ou seja, o controle não abre a superfície que ele
  -- mesmo existe para fechar.
  execute $corpo$
    create or replace function intensicare_guarda.auditar_ddl() returns event_trigger
      language plpgsql
      set search_path = pg_catalog, pg_temp
    as $fn$
    declare
      v_app oid;
      v_pendentes text;
    begin
      v_app := pg_catalog.to_regrole('intensicare_app');
      if v_app is null then
        return;
      end if;

      -- (a) função SECURITY DEFINER de terceiro alcançável — por EXECUTE ou
      -- por GATILHO em relação que a aplicação escreve (ACHADO-17 / F1).
      select string_agg(n.nspname || '.' || p.proname, ', ' order by n.nspname, p.proname)
        into v_pendentes
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where p.prosecdef
         and p.proowner <> v_app
         and not (n.nspname = 'intensicare_escopo'
                  and p.proname in ('instalar', 'tenant_atual'))
         and (
           exists (select 1 from pg_roles a
                    where pg_has_role(v_app, a.oid, 'MEMBER')
                      and has_function_privilege(a.oid, p.oid, 'EXECUTE'))
           or exists (select 1
                        from pg_trigger tg join pg_class rel on rel.oid = tg.tgrelid
                       where tg.tgfoid = p.oid and not tg.tgisinternal
                         and exists (select 1 from pg_roles a
                                      where pg_has_role(v_app, a.oid, 'MEMBER')
                                        and has_table_privilege(a.oid, rel.oid,
                                              'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')))
         );
      if v_pendentes is not null then
        raise exception
          'GUARDA-DDL recusou o comando: funcao(oes) SECURITY DEFINER de terceiro passariam a ser alcancaveis por intensicare_app fora do par selado: %',
          v_pendentes using errcode = '42501';
      end if;

      -- (b) ancestral alcançável sem RLS+FORCE+política ancorada (ACHADO-18/F2).
      select string_agg(n.nspname || '.' || c.relname, ', ' order by n.nspname, c.relname)
        into v_pendentes
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where c.relkind in ('r', 'p', 'f')
         and exists (select 1 from pg_inherits i where i.inhparent = c.oid)
         and exists (select 1 from pg_roles a
                      where pg_has_role(v_app, a.oid, 'MEMBER')
                        and (has_table_privilege(a.oid, c.oid,
                               'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
                          or exists (select 1 from pg_attribute at
                                      where at.attrelid = c.oid and at.attnum > 0
                                        and not at.attisdropped
                                        and has_column_privilege(a.oid, c.oid, at.attnum,
                                              'SELECT, INSERT, UPDATE, REFERENCES'))))
         and not (c.relrowsecurity and c.relforcerowsecurity
                  and exists (select 1 from pg_policy pol
                               where pol.polrelid = c.oid
                                 and pg_get_expr(pol.polqual, pol.polrelid) ilike '%tenant_atual%'));
      if v_pendentes is not null then
        raise exception
          'GUARDA-DDL recusou o comando: relacao(oes) ANCESTRAIS ficariam alcancaveis por intensicare_app sem RLS+FORCE+politica ancorada: % — numa consulta ao ancestral valem as politicas DELE, e as das descendentes sao IGNORADAS',
          v_pendentes using errcode = '42501';
      end if;

      -- (c) relação com `tenant_id` alcançável sem RLS+FORCE+política. É este
      -- ramo que aborta `DROP POLICY`, `ALTER TABLE ... NO FORCE ROW LEVEL
      -- SECURITY` e `DISABLE ROW LEVEL SECURITY` sobre tabela clínica.
      select string_agg(n.nspname || '.' || c.relname, ', ' order by n.nspname, c.relname)
        into v_pendentes
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where c.relkind in ('r', 'p')
         and n.nspname <> 'information_schema'
         and n.nspname not like 'pg\_%'
         and exists (select 1 from pg_attribute at
                      where at.attrelid = c.oid and at.attname = 'tenant_id'
                        and at.attnum > 0 and not at.attisdropped)
         and exists (select 1 from pg_roles a
                      where pg_has_role(v_app, a.oid, 'MEMBER')
                        and has_table_privilege(a.oid, c.oid,
                              'SELECT, INSERT, UPDATE, DELETE, REFERENCES'))
         and (not c.relrowsecurity
              or not c.relforcerowsecurity
              or not exists (select 1 from pg_policy pol
                              where pol.polrelid = c.oid
                                and pg_get_expr(pol.polqual, pol.polrelid) ilike '%tenant_atual%'));
      if v_pendentes is not null then
        raise exception
          'GUARDA-DDL recusou o comando: relacao(oes) com coluna tenant_id ficariam alcancaveis por intensicare_app sem RLS+FORCE+politica ancorada em intensicare_escopo.tenant_atual(): %',
          v_pendentes using errcode = '42501';
      end if;

      -- (d) view/matview/tabela estrangeira alcançável sem `security_invoker`.
      select string_agg(n.nspname || '.' || c.relname, ', ' order by n.nspname, c.relname)
        into v_pendentes
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where c.relkind in ('v', 'm', 'f')
         and n.nspname <> 'information_schema'
         and n.nspname not like 'pg\_%'
         and exists (select 1 from pg_roles a
                      where pg_has_role(v_app, a.oid, 'MEMBER')
                        and (has_table_privilege(a.oid, c.oid,
                               'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
                          or exists (select 1 from pg_attribute at
                                      where at.attrelid = c.oid and at.attnum > 0
                                        and not at.attisdropped
                                        and has_column_privilege(a.oid, c.oid, at.attnum,
                                              'SELECT, INSERT, UPDATE, REFERENCES'))))
         and not (c.relkind = 'v'
                  and coalesce(array_to_string(c.reloptions, ','), '')
                        ~* 'security_invoker\s*=\s*(true|on|1)');
      if v_pendentes is not null then
        raise exception
          'GUARDA-DDL recusou o comando: view/matview/tabela estrangeira ficaria alcancavel por intensicare_app sem security_invoker=true: %',
          v_pendentes using errcode = '42501';
      end if;

      -- (e) privilégio da aplicação sobre a âncora, com o mesmo fecho
      -- transitivo por `pg_rewrite` da `0004` §6.2.
      with recursive alcancam_o_selo as (
        select pg_catalog.to_regclass('intensicare_escopo.selo') as oid
        union
        select r.ev_class
          from pg_depend d
          join pg_rewrite r on r.oid = d.objid
          join alcancam_o_selo a on a.oid = d.refobjid
         where d.classid = 'pg_rewrite'::regclass
           and d.refclassid = 'pg_class'::regclass
           and r.ev_class is distinct from d.refobjid
      )
      select string_agg(rel.oid::regclass::text, ', ')
        into v_pendentes
        from pg_roles a
       cross join alcancam_o_selo rel
       where rel.oid is not null
         and pg_has_role(v_app, a.oid, 'MEMBER')
         and (has_table_privilege(a.oid, rel.oid,
                'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
           or exists (select 1 from pg_attribute at
                       where at.attrelid = rel.oid and at.attnum > 0
                         and not at.attisdropped
                         and has_column_privilege(a.oid, rel.oid, at.attnum,
                               'SELECT, INSERT, UPDATE, REFERENCES')));
      if v_pendentes is not null then
        raise exception
          'GUARDA-DDL recusou o comando: intensicare_app passaria a alcancar a ancora de escopo por %',
          v_pendentes using errcode = '42501';
      end if;
    end
    $fn$;
  $corpo$;

  execute 'revoke all on function intensicare_guarda.auditar_ddl() from public';

  -- `drop`+`create` em vez de `create or replace`: `CREATE EVENT TRIGGER` não
  -- tem forma `OR REPLACE`, e o `if exists` mantém a migração idempotente.
  execute 'drop event trigger if exists intensicare_guarda_ddl';
  execute 'create event trigger intensicare_guarda_ddl on ddl_command_end '
       || 'execute function intensicare_guarda.auditar_ddl()';
end
$$;

-- ==========================================================================
-- §3 VERIFICAÇÃO FAIL-CLOSED
-- ==========================================================================
-- Só levanta no passe que TINHA como fazer o trabalho. No passe do migrador a
-- migração já registrou `notice` explicando o que ficou por fazer — e quem dá
-- os dentes ali é o provisionamento (que aplica o passe de superusuário) e o
-- `AdaptadorPostgres` com `exigirFechoDeRuntime`.
do $$
declare
  v_super boolean := (select coalesce(rolsuper, false) from pg_roles where rolname = current_user);
  v_pediu_guarda boolean :=
    coalesce(current_setting('intensicare.instalar_guarda_ddl', true), '') = 'sim';
  v_quantidade integer;
begin
  if exists (select 1 from pg_roles where rolname = 'intensicare_selo')
     and pg_has_role(current_user, 'intensicare_selo', 'MEMBER')
  then
    -- 3.1 o selo pertence ao guardião, e não ao dono do esquema.
    if (select pg_get_userbyid(c.relowner)
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'intensicare_escopo' and c.relname = 'selo') <> 'intensicare_selo'
    then
      raise exception
        'intensicare_escopo.selo nao pertence a intensicare_selo — qualquer funcao SECURITY DEFINER do dono do esquema o le e o forja (F1)'
        using errcode = '42501';
    end if;

    -- 3.2 as duas funções seladas pertencem ao guardião e seguem SECURITY DEFINER.
    select count(*) into v_quantidade
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'intensicare_escopo'
       and p.proname in ('instalar', 'tenant_atual')
       and (not p.prosecdef or pg_get_userbyid(p.proowner) <> 'intensicare_selo');
    if v_quantidade > 0 then
      raise exception
        '% funcao(oes) de escopo sem SECURITY DEFINER ou fora da propriedade de intensicare_selo',
        v_quantidade using errcode = '42501';
    end if;

    -- 3.3 NENHUM papel alcançável pela APLICAÇÃO **ou pelo MIGRADOR** alcança o
    -- selo. Isto é mais forte que a `0004` §6.2, que perguntava só pelos papéis
    -- alcançáveis por `intensicare_app` — e é o que dá dentes ao fecho de F1,
    -- cujo atacante é justamente o dono do esquema.
    -- Os papéis PREDEFINIDOS (`pg_read_all_data`, `pg_write_all_data`) têm
    -- privilégio sobre toda tabela por construção e não são superusuários; eles
    -- só importam se ALGUÉM os alcançar, e é por isso que a varredura parte das
    -- duas identidades reais em vez de varrer `pg_roles` inteiro.
    select count(*) into v_quantidade
      from pg_roles a
     where a.rolname <> 'intensicare_selo'
       and not a.rolsuper
       and (pg_has_role('intensicare_app', a.oid, 'MEMBER')
            or pg_has_role('intensicare_migrador', a.oid, 'MEMBER'))
       and (has_table_privilege(a.oid, 'intensicare_escopo.selo',
              'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
         or exists (select 1 from pg_attribute at
                     where at.attrelid = 'intensicare_escopo.selo'::regclass
                       and at.attnum > 0 and not at.attisdropped
                       and has_column_privilege(a.oid, 'intensicare_escopo.selo'::regclass,
                             at.attnum, 'SELECT, INSERT, UPDATE, REFERENCES')));
    if v_quantidade > 0 then
      raise exception
        '% papel(is) nao-superusuario alem de intensicare_selo tem privilegio sobre a ancora de escopo',
        v_quantidade using errcode = '42501';
    end if;

    -- 3.4 ninguém é membro do guardião (fora superusuários, que são membros de
    -- tudo por definição). Membro = `SET ROLE` = propriedade emprestada.
    select count(*) into v_quantidade
      from pg_roles a
     where not a.rolsuper
       and a.rolname <> 'intensicare_selo'
       and pg_has_role(a.oid, 'intensicare_selo', 'MEMBER');
    if v_quantidade > 0 then
      raise exception
        '% papel(is) nao-superusuario sao MEMBROS de intensicare_selo — podem SET ROLE e reassumir a ancora',
        v_quantidade using errcode = '42501';
    end if;
  end if;

  if v_pediu_guarda and v_super then
    if not exists (
      select 1 from pg_event_trigger et
        join pg_proc p on p.oid = et.evtfoid
        join pg_namespace n on n.oid = p.pronamespace
       where et.evtname = 'intensicare_guarda_ddl'
         and et.evtenabled <> 'D'
         and n.nspname = 'intensicare_guarda')
    then
      raise exception 'guarda de DDL pedida mas ausente ou desabilitada apos a instalacao'
        using errcode = '42501';
    end if;
  end if;
end
$$;
