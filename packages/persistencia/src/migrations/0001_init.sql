-- 0001_init.sql — esquema inicial da fatia sintética G7 (IntensiCare V2)
--
-- PREMISSA (reversível, GDEC-0015/0017): esta migração usa colunas jsonb
-- para os instantes clínicos multi-campo do ADR-0005 M3 (utc/offset/
-- precisão/valor-fonte/fuso), em vez de uma coluna por campo — o esquema
-- físico está fora do escopo de ADR-0005 (futuro docs/07); esta é uma
-- escolha reversível de implementação desta fatia (SPR-G7-2), não uma
-- decisão de arquitetura ratificada.
--
-- Tenancy (ADR-0003 opção A aceita em GDEC-0008): tenant V2 = raiz de
-- organização (organizations.id = tenant_id); toda tabela clínica carrega
-- tenant_id e RLS forçado (FORCE ROW LEVEL SECURITY). Chaves estrangeiras
-- que cruzam tabelas de negócio são compostas por (tenant_id, id) para que
-- nenhuma referência possa apontar, mesmo estruturalmente, para uma linha
-- de outro tenant.
--
-- Papel de aplicação: esta migração roda com o papel padrão do PGlite
-- (superusuário). Depois de migrar, a aplicação DEVE rebaixar
-- permanentemente a conexão para o papel `intensicare_app` (ver
-- ../session.ts downgradeToApplicationRole) — RLS nunca é aplicado a
-- superusuário, mesmo com FORCE ROW LEVEL SECURITY (comportamento padrão
-- do PostgreSQL, não um defeito desta migração).

-- Papel de aplicação (sem privilégio de superusuário) ----------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'intensicare_app') then
    create role intensicare_app nosuperuser noinherit login;
  end if;
end
$$;

grant usage on schema public to intensicare_app;

-- Função de trigger reutilizável: bloqueia UPDATE/DELETE em tabela append-only.
create or replace function intensicare_forbid_mutation() returns trigger as $$
begin
  raise exception 'tabela % é append-only: operação % não é permitida', TG_TABLE_NAME, TG_OP
    using errcode = '0A000';
end;
$$ language plpgsql;

-- organizations --------------------------------------------------------------
-- Raiz de tenant (ADR-0003 opção A): tenant_id É o id da organização.
create table organizations (
  id text primary key,
  tenant_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint organizations_tenant_is_self check (tenant_id = id),
  constraint organizations_tenant_id_key unique (tenant_id, id)
);
alter table organizations enable row level security;
alter table organizations force row level security;
create policy organizations_tenant_isolation on organizations
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
grant select, insert on organizations to intensicare_app;

-- care_units -------------------------------------------------------------------
create table care_units (
  id text primary key,
  tenant_id text not null,
  organization_id text not null,
  name text not null,
  constraint care_units_tenant_id_key unique (tenant_id, id),
  constraint care_units_organization_fk foreign key (tenant_id, organization_id)
    references organizations (tenant_id, id)
);
alter table care_units enable row level security;
alter table care_units force row level security;
create policy care_units_tenant_isolation on care_units
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
grant select, insert on care_units to intensicare_app;

-- beds ---------------------------------------------------------------------------
create table beds (
  id text primary key,
  tenant_id text not null,
  care_unit_id text not null,
  code text not null,
  constraint beds_tenant_id_key unique (tenant_id, id),
  constraint beds_care_unit_fk foreign key (tenant_id, care_unit_id)
    references care_units (tenant_id, id)
);
alter table beds enable row level security;
alter table beds force row level security;
create policy beds_tenant_isolation on beds
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
grant select, insert on beds to intensicare_app;

-- patient_identities (SYNTH nesta fatia) ------------------------------------------
create table patient_identities (
  id text primary key,
  tenant_id text not null,
  subject_ref text not null,
  constraint patient_identities_tenant_id_key unique (tenant_id, id),
  constraint patient_identities_subject_ref_key unique (tenant_id, subject_ref)
);
alter table patient_identities enable row level security;
alter table patient_identities force row level security;
create policy patient_identities_tenant_isolation on patient_identities
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
grant select, insert on patient_identities to intensicare_app;

-- encounters -----------------------------------------------------------------------
create table encounters (
  id text primary key,
  tenant_id text not null,
  patient_id text not null,
  bed_id text,
  admitted_at jsonb not null,
  discharged_at jsonb,
  constraint encounters_tenant_id_key unique (tenant_id, id),
  constraint encounters_patient_fk foreign key (tenant_id, patient_id)
    references patient_identities (tenant_id, id),
  constraint encounters_bed_fk foreign key (tenant_id, bed_id)
    references beds (tenant_id, id)
);
alter table encounters enable row level security;
alter table encounters force row level security;
create policy encounters_tenant_isolation on encounters
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
grant select, insert, update on encounters to intensicare_app;

-- source_envelopes (imutável, ADR-0005 M1) -----------------------------------------
create table source_envelopes (
  id text primary key,
  tenant_id text not null,
  source_system text not null,
  received_at jsonb not null,
  raw_payload jsonb not null
);
alter table source_envelopes enable row level security;
alter table source_envelopes force row level security;
create policy source_envelopes_tenant_isolation on source_envelopes
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
-- UPDATE/DELETE são concedidos deliberadamente: a garantia de append-only
-- desta tabela vem do TRIGGER abaixo, não da ausência de privilégio — a
-- tentativa deve ser barrada com o erro do trigger, não com "permission
-- denied", para que a garantia seja a mesma mesmo se um papel futuro
-- ganhar privilégio de escrita mais amplo.
grant select, insert, update, delete on source_envelopes to intensicare_app;
create trigger source_envelopes_no_update before update on source_envelopes
  for each row execute function intensicare_forbid_mutation();
create trigger source_envelopes_no_delete before delete on source_envelopes
  for each row execute function intensicare_forbid_mutation();

-- clinical_observations (imutável; correção = novo registro, ADR-0005 M1/M8) -------
create table clinical_observations (
  id text primary key,
  tenant_id text not null,
  subject_ref text not null,
  encounter_id text not null,
  concept text not null,
  source_value double precision not null,
  source_unit text not null,
  canonical_value double precision,
  canonical_unit text,
  quality text not null check (quality in ('valid', 'warning', 'quarantined', 'unknown')),
  provenance jsonb not null,
  observed_at jsonb not null,
  effective_at jsonb not null,
  issued_at jsonb not null,
  received_at jsonb not null,
  persisted_at jsonb not null,
  correction_of text,
  constraint clinical_observations_tenant_id_key unique (tenant_id, id),
  constraint clinical_observations_encounter_fk foreign key (tenant_id, encounter_id)
    references encounters (tenant_id, id),
  constraint clinical_observations_correction_fk foreign key (tenant_id, correction_of)
    references clinical_observations (tenant_id, id)
);
alter table clinical_observations enable row level security;
alter table clinical_observations force row level security;
create policy clinical_observations_tenant_isolation on clinical_observations
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
-- Ver nota em source_envelopes acima: append-only é garantia do TRIGGER.
grant select, insert, update, delete on clinical_observations to intensicare_app;
create trigger clinical_observations_no_update before update on clinical_observations
  for each row execute function intensicare_forbid_mutation();
create trigger clinical_observations_no_delete before delete on clinical_observations
  for each row execute function intensicare_forbid_mutation();

-- alerts (imutável — ADR-0009 glossário §5) -----------------------------------------
create table alerts (
  id text primary key,
  tenant_id text not null,
  encounter_id text not null,
  raised_at jsonb not null,
  evaluated_at jsonb not null,
  severity text not null,
  reason text not null,
  constraint alerts_tenant_id_key unique (tenant_id, id),
  constraint alerts_encounter_fk foreign key (tenant_id, encounter_id)
    references encounters (tenant_id, id)
);
alter table alerts enable row level security;
alter table alerts force row level security;
create policy alerts_tenant_isolation on alerts
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
-- Ver nota em source_envelopes acima: append-only é garantia do TRIGGER.
grant select, insert, update, delete on alerts to intensicare_app;
create trigger alerts_no_update before update on alerts
  for each row execute function intensicare_forbid_mutation();
create trigger alerts_no_delete before delete on alerts
  for each row execute function intensicare_forbid_mutation();

-- work_items (mutável; concorrência otimista por version — ADR-0009 Q2-A) ----------
create table work_items (
  id text primary key,
  tenant_id text not null,
  alert_id text not null,
  state text not null check (state in (
    'nao_atribuido', 'atribuido', 'reconhecido', 'escalado',
    'sobreposto', 'resolvido', 'suprimido', 'reaberto'
  )),
  version integer not null default 0,
  assignee_id text,
  suppression jsonb,
  constraint work_items_tenant_id_key unique (tenant_id, id),
  constraint work_items_alert_fk foreign key (tenant_id, alert_id)
    references alerts (tenant_id, id)
);
alter table work_items enable row level security;
alter table work_items force row level security;
create policy work_items_tenant_isolation on work_items
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
grant select, insert, update on work_items to intensicare_app;

-- audit_events (append-only — ADR-0009 W6 / ADR-0010 B1) ---------------------------
create table audit_events (
  id text primary key,
  tenant_id text not null,
  actor_id text not null,
  command text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  previous_state text,
  new_state text,
  occurred_at jsonb not null,
  idempotency_key text not null
);
alter table audit_events enable row level security;
alter table audit_events force row level security;
create policy audit_events_tenant_isolation on audit_events
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
-- Ver nota em source_envelopes acima: append-only é garantia do TRIGGER —
-- esta é a tabela cujo append-only é vinculante nesta fatia (item 4 da
-- tarefa); as demais ganham a mesma proteção por reuso da mesma função.
grant select, insert, update, delete on audit_events to intensicare_app;
create trigger audit_events_no_update before update on audit_events
  for each row execute function intensicare_forbid_mutation();
create trigger audit_events_no_delete before delete on audit_events
  for each row execute function intensicare_forbid_mutation();

-- outbox_events (outbox transacional — ADR-0010 opção A; B3 ordenação por escopo) ---
-- `id` bigserial é a ordem global de inserção; como é monotônica, ela
-- também ordena corretamente qualquer subconjunto por `ordering_scope`
-- (B3) sem exigir uma sequência por escopo nesta fatia.
create table outbox_events (
  id bigserial primary key,
  tenant_id text not null,
  ordering_scope text not null,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null,
  occurred_at timestamptz not null default now(),
  published_at timestamptz
);
alter table outbox_events enable row level security;
alter table outbox_events force row level security;
create policy outbox_events_tenant_isolation on outbox_events
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
-- Somente o relay publica (ADR-0010 B10) — fora do escopo desta fatia; a
-- aplicação só grava (select para reconciliação/teste, insert para gravar).
grant select, insert on outbox_events to intensicare_app;

grant usage, select on all sequences in schema public to intensicare_app;
