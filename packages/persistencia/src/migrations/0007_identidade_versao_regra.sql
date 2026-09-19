-- 0007_identidade_versao_regra.sql — a identidade do algoritmo que de facto
-- correu passa a ser durável e consultável em nível SQL.
--
-- POR QUE ESTA MIGRAÇÃO EXISTE
-- ---------------------------
-- ADR-0025 (§2.1 E3) registra a fraqueza que esta migração fecha: "a versão
-- persistida não identifica o algoritmo que de fato rodou". Hoje a identidade
-- da regra (`ruleId`/`ruleVersion`, p.ex. `RULE-NEWS2@0.2.0`,
-- `kernel-clinico/src/types.ts`) só existe DENTRO do blob JSON
-- `evaluation_records.kernel_record` (0002_g7_integration.sql:24-37): nenhuma
-- fatia SQL de retenção, vigilância de deriva de versão ou recomputação
-- consegue selecionar por identidade de regra sem parsear JSON. A direção é a
-- própria ADR-0025 §5.2 item 4 — a identidade é de ID DE REGRA, e uma variante
-- deliberada é um NOVO ID, nunca uma edição silenciosa. (Achado MAJ-5, fluxo
-- ORQ-5.)
--
-- O QUE MUDA
-- ----------
-- §1  Colunas `rule_id text` e `rule_versao text` + coluna GERADA `rule_ref`
--     (`ruleId@ruleVersion` — a forma composta que o contrato do kernel chama
--     de `versaoRegra`). Gerada, nunca escrita: a fonte única são as duas
--     colunas, e nenhuma inserção pode divergir delas.
-- §2  Backfill das linhas legadas a partir do PRÓPRIO `kernel_record`
--     (->>'ruleId' / ->>'ruleVersion'). DISCIPLINA APPEND-ONLY: o JSON NUNCA é
--     reescrito nem "normalizado" — só as colunas novas são preenchidas. O
--     UPDATE exige desligar o gatilho append-only
--     (`evaluation_records_no_update`, 0002) DENTRO desta migração; a
--     migração inteira entra numa só mensagem Query e, portanto, numa só
--     transação implícita (provisionamento.ts), de modo que não existe
--     janela observável de escrita sem o gatilho. Linhas cujo JSON NÃO
--     declara identidade (p.ex. recusas de despacho legadas,
--     `kernel_record = '{}'`) recebem o marcador honesto 'desconhecida' — a
--     identidade delas NÃO é inventada.
-- §3  NOT NULL nas duas colunas (falha fechada: a partir daqui NENHUMA
--     inserção sem identidade passa), CHECK `identidade_regra_coerente`
--     (quando o JSON DECLARA identidade, as colunas têm que concordar com
--     ele — forjar colunas divergentes do registro de kernel é recusado) e
--     índice `(rule_id, rule_versao)` para o fatiamento SQL.
-- §4  VERIFICAÇÃO FAIL-CLOSED.
--
-- ONDE A IDENTIDADE NASCE
-- -----------------------
-- A escrita de produção (`insertEvaluationRecord`, persistencia) passa a
-- receber `ruleId`/`ruleVersion` de `despacho.registro` (presente TANTO na
-- avaliação quanto na recusa — `apps/api/src/regras/registro.ts`), na MESMA
-- inserção que persiste `kernel_record`. Linhas novas de recusa carregam a
-- identidade da regra DESPACHADA (nada correu; o registro diz qual regra foi
-- despachada e recusada — `status: "indisponivel"` no `result`), e linhas de
-- avaliação carregam a identidade da regra que de fato computou o registro.
--
-- LIMITES HONESTOS
-- ----------------
-- 1. Nenhuma política RLS é tocada: `evaluation_records` já está sob
--    RLS+FORCE com política ancorada em `intensicare_escopo.tenant_atual()`
--    (0002 §2, 0004 §5). Colunas herdam os privilégios da tabela — nenhum
--    GRANT novo é emitido (a ordem "cria, protege, concede" da 0006 §4 não é
--    acionada porque não há concessão nova).
-- 2. O formato de identidade permanece o registro vivo
--    `RULE-<ESCORE>@M.m.p`. NÃO se adota o esquema `<SCORE>-vM.m.p` da
--    especificação irmã (contexto, não autoridade) e NÃO se "unificam" os
--    dois aqui — decisão entre-repositórios, fora do escopo deste fluxo.
-- 3. As colunas NÃO entram em contrato/OpenAPI: identidade de persistência
--    interna não é superfície REST. A projeção pública (`result`) não muda.
-- 4. `SET NOT NULL` valida por varredura da tabela — custo único, no momento
--    da aplicação, proporcional ao volume de `evaluation_records`.
-- 5. Reaplicar A CADEIA INTEIRA (0001..0007) sobre um banco que já está em
--    0006+ falha de propósito dentro da 0004 (ver 0006 LIMITES item 3). Esta
--    migração, SOZINHA, é idempotente e reaplicável: `if not exists` nas
--    colunas e no índice, UPDATE só onde a coluna é nula, e guardas por nome
--    para constraint e gatilho.
-- 6. Nada aqui fecha SEC-*, SAF-*, THR-* ou MG-*: é fechamento do registro de
--    achados forenses (MAJ-5) na direção já registrada pela ADR-0025.
--    PREMISSA (reversível, GDEC-0015/0017).
--
-- IDEMPOTENTE e reaplicável individualmente.

-- ==========================================================================
-- §1 COLUNAS DE IDENTIDADE
-- ==========================================================================
alter table evaluation_records add column if not exists rule_id text;
alter table evaluation_records add column if not exists rule_versao text;
alter table evaluation_records add column if not exists rule_ref text
  generated always as (rule_id || '@' || rule_versao) stored;

-- ==========================================================================
-- §2 BACKFILL A PARTIR DO JSON LEGADO (o JSON não é reescrito)
-- ==========================================================================
alter table evaluation_records disable trigger evaluation_records_no_update;
update evaluation_records
   set rule_id = coalesce(kernel_record->>'ruleId', 'desconhecida'),
       rule_versao = coalesce(kernel_record->>'ruleVersion', 'desconhecida')
 where rule_id is null
    or rule_versao is null;
alter table evaluation_records enable trigger evaluation_records_no_update;

-- ==========================================================================
-- §3 FALHA FECHADA + ÍNDICE
-- ==========================================================================
alter table evaluation_records alter column rule_id set not null;
alter table evaluation_records alter column rule_versao set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'evaluation_records_identidade_regra_coerente'
       and conrelid = 'evaluation_records'::regclass
  ) then
    alter table evaluation_records
      add constraint evaluation_records_identidade_regra_coerente check (
        (kernel_record->>'ruleId' is null or rule_id = kernel_record->>'ruleId')
        and
        (kernel_record->>'ruleVersion' is null or rule_versao = kernel_record->>'ruleVersion')
      );
  end if;
end
$$;

create index if not exists evaluation_records_identidade_regra_idx
  on evaluation_records (rule_id, rule_versao);

-- ==========================================================================
-- §4 VERIFICAÇÃO FAIL-CLOSED
-- ==========================================================================
do $$
declare
  v_nulos       integer;
  v_gatilho     text;
  v_constraint  text;
  v_indice      text;
begin
  -- 4.1 nenhuma linha sem identidade: o backfill cobriu tudo.
  select count(*) into v_nulos
    from evaluation_records
   where rule_id is null or rule_versao is null;
  if v_nulos > 0 then
    raise exception
      'backfill incompleto: % linha(s) de evaluation_records sem identidade de regra',
      v_nulos
      using errcode = '42501';
  end if;

  -- 4.2 o gatilho append-only voltou a estar LIGADO ('O' = origin, 'A' =
  -- always; 'D'/'R'/'X' = desligado ou inexistente — inaceitável). A guarda
  -- trata explicitamente o caso de NENHUMA linha (gatilho ausente): NULL
  -- `not in` seria NULL e passaria em silêncio.
  select coalesce(tgenabled, 'X') into v_gatilho
    from pg_trigger
   where tgrelid = 'evaluation_records'::regclass
     and tgname = 'evaluation_records_no_update';
  if v_gatilho is null or v_gatilho not in ('O', 'A') then
    raise exception
      'gatilho append-only evaluation_records_no_update não ficou ligado ao fim da migração (estado: %)',
      v_gatilho
      using errcode = '42501';
  end if;

  -- 4.3 a postura de RLS da tabela não mudou (0002 §2, 0004 §5).
  if not exists (
    select 1 from pg_class c
     where c.oid = 'evaluation_records'::regclass
       and c.relrowsecurity
       and c.relforcerowsecurity
       and exists (select 1 from pg_policy pol
                    where pol.polrelid = c.oid
                      and pg_get_expr(pol.polqual, pol.polrelid) ilike '%tenant_atual%')
  ) then
    raise exception
      'postura de RLS de evaluation_records alterada pela 0007 — recusado'
      using errcode = '42501';
  end if;

  -- 4.4 o CHECK de coerência e o índice existem ao fim da migração.
  select conname into v_constraint
    from pg_constraint
   where conname = 'evaluation_records_identidade_regra_coerente'
     and conrelid = 'evaluation_records'::regclass;
  if v_constraint is null then
    raise exception
      'constraint evaluation_records_identidade_regra_coerente ausente ao fim da migração'
      using errcode = '42501';
  end if;
  select relname into v_indice
    from pg_class
   where relname = 'evaluation_records_identidade_regra_idx'
     and relkind = 'i';
  if v_indice is null then
    raise exception
      'índice evaluation_records_identidade_regra_idx ausente ao fim da migração'
      using errcode = '42501';
  end if;
end
$$;
