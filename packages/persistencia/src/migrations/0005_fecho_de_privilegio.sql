-- 0005_fecho_de_privilegio.sql — fecha as DUAS superfícies que a 5ª revisão
-- deixou nomeadas e abertas: código de terceiro que roda com privilégio de
-- terceiro, e herança anexada DEPOIS que as auditorias já correram.
--
-- POR QUE ESTA MIGRAÇÃO EXISTE
-- ---------------------------
-- ACHADO-17 (P1). O fecho da `0004` §6.2 recusa qualquer caminho de privilégio
-- que ALCANCE `intensicare_escopo.selo`, com fecho transitivo por `pg_rewrite`
-- — o que cobre VIEW e MATVIEW sobre o selo. O handoff daquela rodada registrou
-- por escrito o que ele NÃO cobre: "função `SECURITY DEFINER` de terceiro que
-- leia o selo não é coberta por esse fecho". Medido agora contra PostgreSQL
-- 16.14, o limite é explorável e o dano é total:
--
--   * o MIGRADOR cria `public.f(text)` `SECURITY DEFINER` que escreve no selo;
--   * o PostgreSQL concede `EXECUTE` a `PUBLIC` **por padrão**, sem nenhum
--     `GRANT` escrito — a aplicação já pode chamar;
--   * dentro de uma transação escopada em A, a chamada reescreve o selo,
--     `tenant_atual()` passa a devolver B, e leitura E escrita cross-tenant
--     passam. É o ACHADO-02 reaberto POR FORA da `0004`.
--
-- E há uma segunda porta para a mesma função, que NÃO depende de `EXECUTE`
-- nenhum: o GATILHO. Medido contra PostgreSQL 16.14, a execução de função de
-- gatilho não passa por verificação de `EXECUTE` do usuário corrente — o
-- privilégio é conferido na CRIAÇÃO do gatilho. Um gatilho `SECURITY DEFINER`
-- numa tabela que a aplicação escreve (`audit_events`, por exemplo) reescreve o
-- selo no meio de um INSERT legítimo, com `EXECUTE` revogado de PUBLIC e de
-- todo mundo. Reproduzido: `insert into audit_events ...` com escopo em A
-- terminou a instrução com `tenant_atual()` devolvendo B. Por isso a auditoria
-- 2.1 tem DOIS ramos.
--
-- Por que não dá para resolver por ALCANCE, como se fez com view: o corpo de
-- uma função em SQL ou PL/pgSQL NÃO gera dependência em `pg_depend` sobre as
-- relações que referencia (só `BEGIN ATOMIC` gera), e SQL dinâmico derrota
-- qualquer análise estática do texto. Logo a regra tem de ser de SUPERFÍCIE:
-- nenhuma função `SECURITY DEFINER` de terceiro é executável pela aplicação
-- fora do par selado. É deliberadamente CONSERVADORA — ela recusa também
-- funções que não tocam o selo. Medido contra PostgreSQL 16.14: num banco
-- recém-provisionado o conjunto dessas funções é EXATAMENTE
-- {`intensicare_escopo.instalar`, `intensicare_escopo.tenant_atual`}, inclusive
-- contando `pg_catalog` e `information_schema` — zero falso positivo na linha
-- de base, e por isso a varredura não precisa de lista de exceção por esquema.
--
-- ACHADO-18 (P1). As auditorias da `0003` e da `0004` correm DURANTE a
-- migração: o fecho recursivo por `pg_inherits` enxerga o que existe naquele
-- instante. Uma tabela anexada DEPOIS não é auditada por ninguém. Medido:
--
--   * anexar uma FILHA a uma tabela protegida NÃO vaza — numa consulta ao PAI,
--     a política do PAI é aplicada às linhas vindas das filhas (o plano mostra
--     o `Filter` sobre a filha). A hipótese na forma em que foi levantada está
--     REFUTADA, e a refutação virou teste;
--   * o sentido INVERSO vaza tudo. `alter table organizations inherit
--     public.novo_pai` + `grant select on novo_pai` entrega TODAS as linhas de
--     TODOS os tenants: numa consulta ao ancestral valem as políticas DELE, e
--     as das descendentes são IGNORADAS. E o ancestral não precisa ter coluna
--     `tenant_id` — basta ter um subconjunto das colunas da descendente. Era
--     exatamente esse o ponto cego: a guarda de runtime só olhava relações COM
--     `tenant_id`, então o diagnóstico de `abrir()` devolvia ZERO em todos os
--     contadores num banco onde a aplicação lia e escrevia todos os tenants.
--   * a exposição é TRANSITIVA (avô → pai → tabela protegida) e o elo do meio
--     não precisa ser alcançável.
--   * e o ancestral não precisa ser alcançável DIRETAMENTE: uma VIEW do
--     migrador sobre ele (sem `security_invoker`) roda com os direitos do DONO
--     e devolve todos os tenants. A `0003` já recusava esse objeto em tempo de
--     migração; o runtime é que era cego a ele — ver §2.3 e `pool.ts`.
--
-- LIMITE HONESTO — janela de tempo (leia isto antes de chamar de "fechado")
-- ------------------------------------------------------------------------
-- Esta auditoria roda quando a MIGRAÇÃO roda. A guarda irmã em `../postgres/
-- pool.ts` roda quando o processo ABRE o pool. Um `ALTER TABLE ... INHERIT`
-- executado por um superusuário (ou pelo migrador) NO MEIO da vida de um
-- processo já aberto NÃO é detectado por nenhuma das duas até o próximo boot
-- ou a próxima migração. Isso é "fechado até o próximo deploy", não "fechado",
-- e está declarado como tal — em `../README.md` e no cabeçalho de `pool.ts`.
-- Fechar a janela exigiria um EVENT TRIGGER de DDL, que no PostgreSQL 16 só
-- pode ser criado por SUPERUSUÁRIO — privilégio que o papel de migração, por
-- desenho (`0003`), não tem. Não foi feito aqui: seria um controle presente em
-- alguns ambientes e ausente noutros, e um controle intermitente é pior que um
-- limite declarado.
--
-- IDEMPOTENTE e reaplicável. PREMISSA reversível (ADR-0016, regime
-- GDEC-0015/GDEC-0017). Não fecha SEC-0009, SAF-0008, THR-0050 nem MG-G6.

-- 1) Desarmar o EXECUTE PADRÃO para PUBLIC ------------------------------------
-- Detectar não basta. O padrão do PostgreSQL — `EXECUTE` a `PUBLIC` em toda
-- função nova — é o que transforma um `create function` rotineiro numa
-- concessão de privilégio à aplicação. Aqui o padrão é desarmado para o papel
-- de migração (em qualquer esquema), e a auditoria abaixo fica como rede.
--
-- Não quebra o gatilho append-only: medido contra PostgreSQL 16.14, a execução
-- de função de GATILHO não passa por verificação de `EXECUTE` do usuário
-- corrente — o privilégio é conferido na CRIAÇÃO do gatilho.
do $$
begin
  if (select coalesce(rolsuper, false)
        or pg_has_role(current_user, 'intensicare_migrador', 'MEMBER')
      from pg_roles where rolname = current_user)
  then
    execute 'alter default privileges for role intensicare_migrador '
         || 'revoke execute on routines from public';
    -- E as que já existem. `ROUTINES` (e não `FUNCTIONS`) para alcançar também
    -- PROCEDURES, que `ALL FUNCTIONS` não cobre.
    execute 'revoke execute on all routines in schema public from public';
    execute 'revoke execute on all routines in schema intensicare_escopo from public';
  else
    raise notice
      'desarme do EXECUTE padrão pulado: papel atual (%) não é superusuário nem membro de intensicare_migrador; a auditoria abaixo é quem garante o invariante',
      current_user;
  end if;
end
$$;

-- As duas funções seladas continuam nominalmente concedidas à aplicação — o
-- revoke acima tira o privilégio de PUBLIC, não o desta concessão explícita.
grant execute on function intensicare_escopo.tenant_atual() to intensicare_app;
grant execute on function intensicare_escopo.instalar(text) to intensicare_app;

-- 2) VERIFICAÇÃO FAIL-CLOSED ---------------------------------------------------
do $$
declare
  pendentes text;
begin
  -- 2.1 ACHADO-17 — código de terceiro rodando com privilégio de terceiro.
  -- `has_function_privilege` é avaliado sobre TODOS os papéis alcançáveis:
  -- `intensicare_app` é NOINHERIT, então um `EXECUTE` herdado de papel só
  -- apareceria depois de um `SET ROLE`.
  select string_agg(
           n.nspname || '.' || p.proname || ' (dono ' || pg_get_userbyid(p.proowner) || ')',
           ', ' order by n.nspname, p.proname)
    into pendentes
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where p.prosecdef
     -- Função da PRÓPRIA aplicação não cruza fronteira de privilégio: ela já
     -- roda com os direitos que a aplicação tem. (Hoje é caso impossível — a
     -- aplicação não tem CREATE em esquema nenhum, e isso é asserido na suíte.)
     and pg_get_userbyid(p.proowner) <> 'intensicare_app'
     and not (n.nspname = 'intensicare_escopo' and p.proname in ('instalar', 'tenant_atual'))
     and (
       exists (
         select 1 from pg_roles alvo
          where pg_has_role('intensicare_app', alvo.oid, 'MEMBER')
            and has_function_privilege(alvo.oid, p.oid, 'EXECUTE')
       )
       -- Por GATILHO, e não por EXECUTE. Medido contra PostgreSQL 16.14: a
       -- execução de função de gatilho NÃO passa por verificação de EXECUTE do
       -- usuário corrente — o privilégio é conferido na CRIAÇÃO do gatilho.
       -- Um gatilho SECURITY DEFINER numa tabela que a aplicação escreve
       -- reescreve o selo no meio de um INSERT legítimo, com EXECUTE revogado
       -- de PUBLIC e de todo mundo. Contar só o EXECUTE deixava passar isto.
       or exists (
         select 1
           from pg_trigger tg
           join pg_class rel on rel.oid = tg.tgrelid
          where tg.tgfoid = p.oid
            and not tg.tgisinternal
            and exists (
              select 1 from pg_roles alvo
               where pg_has_role('intensicare_app', alvo.oid, 'MEMBER')
                 and has_table_privilege(alvo.oid, rel.oid,
                       'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
            )
       )
     );
  if pendentes is not null then
    raise exception
      'função(ões) SECURITY DEFINER de terceiro executáveis por intensicare_app fora do par selado: % — uma delas basta para FORJAR intensicare_escopo.selo e pivotar de tenant; revogue o EXECUTE (lembre que o PostgreSQL concede a PUBLIC por padrão) ou reescreva a função como SECURITY INVOKER',
      pendentes
      using errcode = '42501';
  end if;

  -- 2.2 ACHADO-18 — ancestral alcançável sem política ancorada.
  -- Basta o elo DIRETO: se a aplicação alcança uma relação que tem qualquer
  -- descendente, consultar essa relação expande a cadeia inteira sob as
  -- políticas DELA. Não é preciso recursão aqui — a recursão está no dano, não
  -- no detector, e todo topo de cadeia alcançável é pego por este predicado.
  select string_agg(n.nspname || '.' || c.relname, ', ' order by n.nspname, c.relname)
    into pendentes
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relkind in ('r', 'p', 'f')
     and exists (select 1 from pg_inherits i where i.inhparent = c.oid)
     and exists (
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
     and not (
       c.relrowsecurity
       and c.relforcerowsecurity
       and exists (
         select 1 from pg_policy pol
          where pol.polrelid = c.oid
            and pg_get_expr(pol.polqual, pol.polrelid) ilike '%tenant_atual%'
       )
     );
  if pendentes is not null then
    raise exception
      'relação(ões) ANCESTRAIS alcançáveis por intensicare_app sem RLS+FORCE+política ancorada na função selada: % — numa consulta ao ancestral valem as políticas DELE e as das descendentes são IGNORADAS, então isto expõe todo tenant de toda tabela descendente',
      pendentes
      using errcode = '42501';
  end if;

  -- 2.3 A `0003` já recusa view sem `security_invoker`, matview e tabela
  -- estrangeira ALCANÇÁVEIS, em tempo de migração. Esta cópia existe porque o
  -- caminho que a torna crítica só apareceu agora: uma VIEW do migrador sobre
  -- um ANCESTRAL sem política devolve todos os tenants, e o ancestral NÃO
  -- precisa ser alcançável pela aplicação — então a checagem 2.2 sozinha não o
  -- vê. Medido contra PostgreSQL 16.14. A guarda irmã em `../postgres/pool.ts`
  -- passa a fazer a mesma conta em tempo de execução, que era onde faltava.
  select string_agg(n.nspname || '.' || c.relname || ' (relkind=' || c.relkind::text || ')',
                    ', ' order by n.nspname, c.relname)
    into pendentes
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relkind in ('v', 'm', 'f')
     and n.nspname <> 'information_schema'
     and n.nspname not like 'pg\_%'
     and exists (
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
     and not (
       c.relkind = 'v'
       and coalesce(array_to_string(c.reloptions, ','), '') ~* 'security_invoker\s*=\s*(true|on|1)'
     );
  if pendentes is not null then
    raise exception
      'view/matview/tabela estrangeira alcançável por intensicare_app sem security_invoker=true: % — roda com os direitos do DONO e contorna a RLS de quem consulta (matview e tabela estrangeira não aceitam política nenhuma)',
      pendentes
      using errcode = '42501';
  end if;
end
$$;
