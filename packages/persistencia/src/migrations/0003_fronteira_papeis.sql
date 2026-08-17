-- 0003_fronteira_papeis.sql — fronteira REAL de identidade de banco
--
-- POR QUE ESTA MIGRAÇÃO EXISTE (ACHADO-01 / ADR-0016 §4.1 / THR-0050, P0)
-- ----------------------------------------------------------------------
-- Até `0002`, o isolamento por tenant dependia de a aplicação REBAIXAR-SE de
-- superusuário para `intensicare_app` na mesma conexão
-- (`session.ts::downgradeToApplicationRole`). Isso não é fronteira de
-- segurança: quando o usuário AUTENTICADO da sessão é superusuário, o próprio
-- PostgreSQL permite `SET SESSION AUTHORIZATION` de volta ao superusuário — e
-- superusuário ignora RLS, inclusive com `FORCE ROW LEVEL SECURITY`. Qualquer
-- caminho capaz de executar SQL arbitrário no processo (injeção, dependência
-- comprometida) anulava o isolamento de TODOS os tenants.
--
-- ALCANCE DESTA MIGRAÇÃO — corrigido após revisão adversarial independente.
-- Uma versão anterior deste cabeçalho afirmava que a migração endereçava
-- "qualquer caminho capaz de executar SQL arbitrário no processo". Isso era
-- LARGO DEMAIS e foi refutado: fechar a recuperação de superusuário NÃO fecha
-- a TROCA DE TENANT, porque `app.tenant_id` era um parâmetro de sessão que o
-- próprio papel de aplicação podia reescrever (ACHADO-02). Essa segunda
-- metade é tratada em `0004_escopo_selado.sql`. Esta migração trata apenas da
-- identidade: qual PAPEL a conexão tem e o que esse papel alcança.
--
-- A correção não é SQL sozinha: é topológica — a aplicação precisa
-- AUTENTICAR-SE já como papel sem privilégio, nunca rebaixar-se a partir de
-- um. Esta migração estabelece a metade que vive no banco:
--
--   1. um papel de MIGRAÇÃO/PROPRIEDADE (`intensicare_migrador`), dono do
--      esquema, distinto do papel de aplicação;
--   2. o papel de APLICAÇÃO (`intensicare_app`) sem nenhum atributo
--      excedente e sem propriedade de objeto;
--   3. a recusa de CONCLUIR a migração se qualquer um desses invariantes não
--      se sustentar (fail-closed: um banco mal provisionado não migra).
--
-- A outra metade vive em `../postgres/pool.ts` (a aplicação recusa abrir o
-- pool se a identidade conectada for superusuário/BYPASSRLS) e no
-- provisionamento (`../postgres/provisionamento.ts`).
--
-- IDEMPOTENTE: pode ser reaplicada. Serve tanto para instalação limpa
-- (0001→0002→0003) quanto para atualização de um banco onde 0001/0002 já
-- rodaram sob superusuário.
--
-- PREMISSA (reversível, regime GDEC-0015/GDEC-0017; ancorada em ADR-0016 e
-- ADR-0006): os nomes de papel são fixos aqui porque já eram fixos em
-- `0001_init.sql`; a escolha de provedor, região e residência de dados NÃO é
-- feita aqui e permanece decisão do titular.
--
-- LIMITE HONESTO: esta migração não fecha SEC-0009, SAF-0008, THR-0050 nem o
-- gate MG-G6. Verificação exige terceiro independente (DEC-G0-02). O que ela
-- faz é tornar o controle VERIFICÁVEL — e a suíte
-- `../postgres/fronteira-postgres.test.ts` o exerce contra PostgreSQL real.

-- 1) Papel de MIGRAÇÃO/PROPRIEDADE -------------------------------------------
-- Dono das tabelas. NÃO é superusuário e NÃO tem BYPASSRLS: com
-- `FORCE ROW LEVEL SECURITY` (posto em 0001/0002), nem o dono escapa da RLS.
-- Num PostgreSQL real este papel já foi criado pelo provisionamento, que roda
-- com superusuário ANTES das migrações; o bloco abaixo só cria quando quem
-- migra tem poder para isso (caso do simulador PGlite, que roda tudo como
-- superusuário na conexão única).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'intensicare_migrador') then
    if (select rolsuper or rolcreaterole from pg_roles where rolname = current_user) then
      create role intensicare_migrador
        nosuperuser nobypassrls nocreatedb nocreaterole noreplication noinherit login;
    else
      raise exception
        'papel intensicare_migrador ausente e o papel atual (%) não pode criá-lo — provisione os papéis antes de migrar',
        current_user
        using errcode = '42501';
    end if;
  end if;
end
$$;

-- 2) Endurecimento do papel de APLICAÇÃO --------------------------------------
-- `alter role` sobre OUTRO papel exige superusuário ou CREATEROLE. Quando quem
-- migra não tem esse poder (o caso normal em produção: migração roda como
-- `intensicare_migrador`), o endurecimento já foi feito pelo provisionamento —
-- e o bloco 5 abaixo RECUSA a migração se, ainda assim, o papel estiver
-- superprivilegiado. Ou seja: pular aqui nunca vira permissão silenciosa.
do $$
begin
  if (select rolsuper or rolcreaterole from pg_roles where rolname = current_user) then
    alter role intensicare_app
      nosuperuser nobypassrls nocreatedb nocreaterole noreplication noinherit;
  else
    raise notice
      'endurecimento de atributos de intensicare_app pulado: papel atual (%) não tem CREATEROLE; o bloco de verificação abaixo é quem garante o invariante',
      current_user;
  end if;
end
$$;

-- 3) O papel de aplicação não cria objeto nenhum no schema `public` ------------
-- Sem CREATE no schema, a aplicação não consegue plantar uma função
-- `SECURITY DEFINER` própria — que seria um caminho de escalada independente
-- de `SET ROLE`.
revoke create on schema public from public;
revoke create on schema public from intensicare_app;
grant usage on schema public to intensicare_app;

-- 4) Propriedade dos objetos passa ao papel de MIGRAÇÃO ------------------------
-- Caminho de ATUALIZAÇÃO: num banco onde 0001/0002 rodaram sob superusuário, as
-- tabelas são do superusuário. Aqui elas passam ao papel de migração, para que
-- a propriedade e a aplicação sejam identidades distintas (o invariante
-- vinculante — "a aplicação não é dona de nada" — é imposto no bloco 5).
do $$
declare
  objeto record;
  pode_reatribuir boolean;
begin
  select coalesce(rolsuper, false) or pg_has_role(current_user, 'intensicare_migrador', 'MEMBER')
    into pode_reatribuir
    from pg_roles where rolname = current_user;

  if not coalesce(pode_reatribuir, false) then
    raise notice
      'reatribuição de propriedade pulada: papel atual (%) não é superusuário nem membro de intensicare_migrador',
      current_user;
    return;
  end if;

  -- Sequência OWNED (ligada a coluna por `serial`/`bigserial`/`identity`, isto
  -- é, com dependência `pg_depend.deptype = 'a'`) NÃO pode ter o dono trocado:
  -- o PostgreSQL recusa incondicionalmente, porque ela segue o dono da tabela
  -- por construção. `ALTER TABLE ... OWNER TO` já a arrasta junto — reatribuí-la
  -- aqui seria ao mesmo tempo impossível e redundante. Sequências
  -- INDEPENDENTES seguem no laço, porque essas precisam mesmo ser reatribuídas.
  --
  -- A ordem é EXPLÍCITA e adversa de propósito (sequências antes das tabelas).
  -- Medido contra PostgreSQL 16.14: `alter sequence ... owner to <dono atual>`
  -- é no-op e não ergue erro, então o defeito só aparecia quando a sequência
  -- era visitada ANTES da sua tabela. Sem `order by`, o resultado dependia da
  -- ordem de varredura de `pg_class` e o teste passava por sorte. Fixando a
  -- ordem adversa, uma regressão aqui falha sempre, nunca às vezes.
  for objeto in
    select c.oid::regclass as nome, c.relkind
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'p', 'S')
       and pg_get_userbyid(c.relowner) <> 'intensicare_migrador'
       and not (
         c.relkind = 'S'
         and exists (
           select 1 from pg_depend d
            where d.classid = 'pg_class'::regclass
              and d.objid = c.oid
              and d.deptype = 'a'
         )
       )
     order by case when c.relkind = 'S' then 0 else 1 end, c.relname
  loop
    if objeto.relkind = 'S' then
      execute format('alter sequence %s owner to intensicare_migrador', objeto.nome);
    else
      execute format('alter table %s owner to intensicare_migrador', objeto.nome);
    end if;
  end loop;

  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'intensicare_forbid_mutation'
       and pg_get_userbyid(p.proowner) <> 'intensicare_migrador'
  ) then
    execute 'alter function public.intensicare_forbid_mutation() owner to intensicare_migrador';
  end if;
end
$$;

-- 5) Contexto VAZIO passa a ser tratado como contexto AUSENTE -----------------
-- OBSERVED contra PostgreSQL 16 real (não reproduzível sob PGlite, que tem
-- conexão única e nunca recicla): um parâmetro personalizado que NUNCA foi
-- definido faz `current_setting('app.tenant_id', true)` devolver NULL; mas
-- depois de definido uma vez e limpo por `RESET ALL`/`DISCARD ALL` — o que o
-- pool faz a cada devolução de conexão — ele passa a devolver a CADEIA VAZIA.
--
-- Com a política original (`tenant_id = current_setting(...)`), uma conexão
-- RECICLADA e sem escopo avalia `tenant_id = ''`. Para os dados desta fatia o
-- efeito continua sendo zero linha, mas o fail-closed passaria a depender do
-- CONTEÚDO (uma linha com `tenant_id = ''` seria visível sem escopo numa
-- conexão reciclada e invisível numa conexão nova — isolamento assimétrico).
--
-- `nullif(..., '')` remove a assimetria: contexto vazio vira NULL, a comparação
-- vira NULL, e nem leitura nem escrita passam. A política é recriada em TODAS
-- as tabelas do esquema, com o mesmo nome, pela mesma expressão — nenhuma
-- regra de negócio muda, só a forma como a AUSÊNCIA de escopo é reconhecida.
do $$
declare
  tabela record;
  nome_politica text;
begin
  for tabela in
    select c.oid::regclass as referencia, c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p')
       -- Compatibilidade PARA A FRENTE: a `0004` substitui estas políticas por
       -- uma âncora mais forte (`intensicare_escopo.tenant_atual()`). Reaplicar
       -- a `0003` depois da `0004` NÃO pode rebaixar o controle de volta ao
       -- parâmetro de sessão — por isso a tabela já endurecida é pulada.
       and not exists (
         select 1 from pg_policy pol
          where pol.polrelid = c.oid
            and pg_get_expr(pol.polqual, pol.polrelid) ilike '%tenant_atual%'
       )
  loop
    nome_politica := tabela.relname || '_tenant_isolation';
    execute format('drop policy if exists %I on %s', nome_politica, tabela.referencia);
    execute format(
      'create policy %I on %s using (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')) with check (tenant_id = nullif(current_setting(''app.tenant_id'', true), ''''))',
      nome_politica, tabela.referencia);
  end loop;
end
$$;

-- 6) VERIFICAÇÃO FAIL-CLOSED — a migração RECUSA concluir se o invariante cair -
-- Este bloco é o controle, não um comentário: um banco em que o papel de
-- aplicação esteja superprivilegiado, seja dono de tabela, alcance um papel
-- com superusuário/BYPASSRLS, ou em que alguma tabela do schema `public` esteja
-- sem `tenant_id`/RLS/FORCE/política, NÃO chega ao fim desta migração.
do $$
declare
  papel record;
  quantidade integer;
  tabelas_sem_isolamento text;
  oids_auditados oid[];
begin
  -- CONJUNTO AUDITADO, calculado UMA vez e usado por TODOS os ramos abaixo.
  -- CORRIGIDO (5ª revisão adversarial, ACHADO-14/P1): o alargamento anterior
  -- foi aplicado só ao ramo relkind in ('r','p'); os ramos 'm'/'v'/'f'
  -- continuavam presos a `nspname = 'public'`. Como `intensicare_escopo` está
  -- na lista de esquemas permitidos (o app precisa de USAGE nele para chamar
  -- `instalar`), havia um esquema ALCANÇÁVEL, PERMITIDO e NÃO AUDITADO — uma
  -- matview criada ali devolvia linhas de outro tenant ao app.
  with recursive descendentes as (
    select c.oid
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p')
    union
    select i.inhrelid from pg_inherits i join descendentes d on d.oid = i.inhparent
  )
  select array_agg(c.oid) into oids_auditados
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relkind in ('r', 'p', 'm', 'v', 'f')
     and n.nspname <> 'information_schema'
     and n.nspname not like 'pg\_%'
     and (
       n.nspname in ('public', 'intensicare_escopo')
       or c.oid in (select oid from descendentes)
       or exists (
         select 1 from pg_roles alvo
          where pg_has_role('intensicare_app', alvo.oid, 'MEMBER')
            and (
              has_table_privilege(alvo.oid, c.oid,
                'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
              or exists (
                select 1 from pg_attribute a
                 where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
                   and has_column_privilege(alvo.oid, c.oid, a.attnum,
                         'SELECT, INSERT, UPDATE, REFERENCES')
              )
            )
       )
     );
  oids_auditados := coalesce(oids_auditados, '{}'::oid[]);
  select * into papel from pg_roles where rolname = 'intensicare_app';
  if not found then
    raise exception 'papel de aplicação intensicare_app ausente' using errcode = '42501';
  end if;

  if papel.rolsuper or papel.rolbypassrls or papel.rolcreaterole
     or papel.rolcreatedb or papel.rolreplication then
    raise exception
      'intensicare_app tem atributo excedente (super=%, bypassrls=%, createrole=%, createdb=%, replication=%)',
      papel.rolsuper, papel.rolbypassrls, papel.rolcreaterole,
      papel.rolcreatedb, papel.rolreplication
      using errcode = '42501';
  end if;

  -- CORRIGIDO após revisão adversarial (ACHADO-03): contar apenas papéis
  -- alcançáveis que fossem SUPERUSER/BYPASSRLS deixava passar o caso mais
  -- óbvio — `GRANT intensicare_migrador TO intensicare_app`. O migrador não é
  -- super nem bypassrls, mas é DONO das tabelas, e o dono pode remover o
  -- `FORCE ROW LEVEL SECURITY` e escapar da RLS. O invariante correto é: o
  -- papel de aplicação não alcança NENHUM papel que seja dono de tabela.
  select count(*) into quantidade
    from pg_roles alvo
   where alvo.rolname <> 'intensicare_app'
     and pg_has_role('intensicare_app', alvo.oid, 'MEMBER')
     and (
       alvo.rolsuper
       or alvo.rolbypassrls
       -- CORRIGIDO (ACHADO-05, 2ª revisão adversarial): filtrar só ('r','p')
       -- deixava passar o dono de uma MATERIALIZED VIEW, VIEW ou FOREIGN
       -- TABLE — objetos que também expõem dado de tenant e cujo dono era
       -- invisível a este contador.
       or exists (
         select 1
           from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where c.relowner = alvo.oid
            and c.relkind in ('r', 'p', 'm', 'v', 'f')
            and n.nspname <> 'information_schema'
            and n.nspname not like 'pg\_%'
       )
     );
  if quantidade > 0 then
    raise exception
      'intensicare_app alcança % papel(is) com superusuário, BYPASSRLS ou que são DONO DE TABELA do esquema, via SET ROLE',
      quantidade
      using errcode = '42501';
  end if;

  select count(*) into quantidade
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p', 'm', 'v', 'f')
     and pg_get_userbyid(c.relowner) = 'intensicare_app';
  if quantidade > 0 then
    raise exception
      'intensicare_app é dono de % objeto(s) do schema public — dono e aplicação devem ser identidades distintas',
      quantidade
      using errcode = '42501';
  end if;

  -- CORRIGIDO (ACHADO-05): a auditoria de isolamento só olhava relkind='r'.
  -- MATERIALIZED VIEW e FOREIGN TABLE não suportam política de RLS — logo não
  -- há como isolá-las, e a única resposta fail-closed é RECUSAR a existência
  -- delas no schema `public`. Uma matview sobre tabela de tenant devolvia
  -- linhas de TODOS os tenants a uma conexão sem escopo.
  -- `relkind` é do tipo "char": o cast explícito para text evita o erro
  -- "operator is not unique" na concatenação.
  select string_agg(n.nspname || '.' || c.relname || ' (relkind=' || c.relkind::text || ')',
                   ', ' order by n.nspname, c.relname)
    into tabelas_sem_isolamento
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.oid = any(oids_auditados) and c.relkind in ('m', 'f');
  if tabelas_sem_isolamento is not null then
    raise exception
      'objeto(s) alcançáveis que não podem receber política de RLS (matview / tabela estrangeira): % — remova-os ou substitua por tabela com RLS',
      tabelas_sem_isolamento
      using errcode = '42501';
  end if;

  -- Uma VIEW comum roda com os direitos do DONO e contorna a RLS de quem
  -- consulta. Com `security_invoker = true` (PostgreSQL 15+) ela passa a
  -- respeitar a RLS do chamador, que é o comportamento exigido aqui.
  select string_agg(n.nspname || '.' || c.relname, ', ' order by n.nspname, c.relname)
    into tabelas_sem_isolamento
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.oid = any(oids_auditados) and c.relkind = 'v'
     and coalesce(array_to_string(c.reloptions, ','), '') !~* 'security_invoker\s*=\s*(true|on|1)';
  if tabelas_sem_isolamento is not null then
    raise exception
      'view(s) alcançáveis sem security_invoker=true: % — sem isso a view roda com os direitos do DONO e contorna a RLS de quem consulta',
      tabelas_sem_isolamento
      using errcode = '42501';
  end if;

  -- CORRIGIDO (4ª revisão adversarial, ACHADO-11): esta auditoria partia de
  -- `nspname = 'public'`. Uma PARTIÇÃO criada em OUTRO esquema, de uma tabela
  -- particionada de `public`, nasce sem RLS, sem FORCE e sem política — e
  -- nenhuma camada a via. O invariante que importa não é sobre um ESQUEMA: é
  -- "nenhuma relação ALCANÇÁVEL pelo papel de aplicação guarda dado de tenant
  -- sem isolamento completo". O conjunto abaixo é, portanto:
  --   (a) tudo em `public`;
  --   (b) todo descendente (partição ou herança) de algo em `public`, esteja
  --       onde estiver;
  --   (c) toda relação sobre a qual o papel de aplicação alcance qualquer
  --       privilégio de tabela ou de coluna, em qualquer esquema.
  -- O privilégio é avaliado sobre os papéis ALCANÇÁVEIS, porque
  -- `intensicare_app` é NOINHERIT e um privilégio herdado só apareceria após
  -- `SET ROLE`.
  --
  -- Este conjunto é DELIBERADAMENTE mais largo que o laço que cria política
  -- (bloco 5, restrito a `public`): a migração não sai plantando política em
  -- objeto que talvez nem pertença ao papel de migração — ela RECUSA e obriga
  -- o operador a corrigir o esquema.
  select string_agg(n.nspname || '.' || c.relname, ', ' order by n.nspname, c.relname)
    into tabelas_sem_isolamento
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.oid = any(oids_auditados) and c.relkind in ('r', 'p')
     -- A ÂNCORA do escopo é a única exceção legítima: ela não guarda dado de
     -- tenant (guarda pid + id de transação + o tenant corrente da conexão) e
     -- por isso não tem `tenant_id` nem política. O que a protege é não ter
     -- privilégio NENHUM concedido à aplicação — verificado na `0004` §6.2,
     -- inclusive contra caminhos indiretos (view sobre ela).
     and c.oid is distinct from to_regclass('intensicare_escopo.selo')
     and (
       not c.relrowsecurity
       or not c.relforcerowsecurity
       or not exists (
         select 1 from pg_attribute a
          where a.attrelid = c.oid and a.attname = 'tenant_id'
            and a.attnum > 0 and not a.attisdropped
       )
       or not exists (select 1 from pg_policy pol where pol.polrelid = c.oid)
     );
  if tabelas_sem_isolamento is not null then
    raise exception
      'relação(ões) sem isolamento completo (tenant_id + RLS + FORCE + política): %',
      tabelas_sem_isolamento
      using errcode = '42501';
  end if;

  -- A aplicação não pode alcançar esquema fora da lista permitida. Sem isto, o
  -- conjunto auditado acima poderia crescer indefinidamente por concessão
  -- avulsa, e o operador não teria sinal nenhum de que isso aconteceu.
  select string_agg(n.nspname, ', ' order by n.nspname) into tabelas_sem_isolamento
    from pg_namespace n
   where n.nspname not in ('public', 'intensicare_escopo', 'information_schema')
     and n.nspname not like 'pg\_%'
     and exists (
       select 1 from pg_roles alvo
        where pg_has_role('intensicare_app', alvo.oid, 'MEMBER')
          and has_schema_privilege(alvo.oid, n.oid, 'USAGE')
     );
  if tabelas_sem_isolamento is not null then
    raise exception
      'intensicare_app alcança esquema(s) fora da lista permitida (public, intensicare_escopo): %',
      tabelas_sem_isolamento
      using errcode = '42501';
  end if;

  -- Toda política precisa reconhecer contexto VAZIO como AUSENTE (bloco 5).
  -- Sem isto, uma tabela nova poderia reintroduzir a forma fraca e o
  -- isolamento voltaria a depender do conteúdo numa conexão reciclada.
  select string_agg(distinct c.relname, ', ') into tabelas_sem_isolamento
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and (
       -- `ilike`: o PostgreSQL redeparsa a expressão com `NULLIF` em MAIÚSCULAS,
       -- então uma comparação sensível a caixa reprovaria a própria política
       -- que o bloco 5 acabou de criar.
       --
       -- `tenant_atual` é aceito como forma FORTE: é a âncora selada da `0004`,
       -- que já trata contexto ausente como NULL por construção. Aceitar as
       -- duas formas é o que permite reaplicar esta migração depois da `0004`
       -- sem rebaixar o controle.
       (pg_get_expr(pol.polqual, pol.polrelid) not ilike '%nullif%'
        and pg_get_expr(pol.polqual, pol.polrelid) not ilike '%tenant_atual%')
       or (coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') not ilike '%nullif%'
           and coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') not ilike '%tenant_atual%')
     );
  if tabelas_sem_isolamento is not null then
    raise exception
      'política(s) que não tratam contexto vazio como ausente (falta nullif ou tenant_atual): %',
      tabelas_sem_isolamento
      using errcode = '42501';
  end if;
end
$$;
