-- 0002_g7_integration.sql — integração real da fatia G7 (SPR-G7-2, INTEGRADOR)
--
-- PREMISSA (reversível, GDEC-0015/0017): esta migração acrescenta o mínimo
-- exigido pela fiação real da fatia (kernel clínico + API): valor codificado
-- em observação (ACVPU), registros de avaliação imutáveis (ADR-0008),
-- idempotência de escrita com hash do corpo (draft IETF Idempotency-Key) e
-- carimbo de criação em work_items para a projeção de leitura. O esquema
-- físico definitivo segue fora do escopo de ADR-0005 (futuro docs/07).

-- 1) Observação clínica com valor codificado (ex.: ACVPU) -------------------
-- O par numérico (source_value/source_unit) deixa de ser obrigatório; um
-- CHECK garante que SEMPRE existe ou o par numérico completo ou um código —
-- nunca uma observação sem valor de nenhuma forma (fail-closed).
alter table clinical_observations add column source_code text;
alter table clinical_observations alter column source_value drop not null;
alter table clinical_observations alter column source_unit drop not null;
alter table clinical_observations add constraint clinical_observations_value_present
  check ((source_value is not null and source_unit is not null) or source_code is not null);

-- 2) Registros de avaliação (ADR-0008) — imutáveis, append-only --------------
-- `result` guarda o payload no formato do contrato de API; `kernel_record`
-- guarda o registro integral do kernel clínico (replay determinístico).
-- `seq` é a ordem global de gravação (mais recente = maior).
create table evaluation_records (
  id text primary key,
  tenant_id text not null,
  encounter_id text not null,
  subject_ref text not null,
  status text not null,
  total_score double precision,
  risk_tier text,
  red_parameter boolean not null default false,
  fires boolean not null default false,
  evaluated_at jsonb not null,
  result jsonb not null,
  kernel_record jsonb not null,
  seq bigserial,
  constraint evaluation_records_tenant_id_key unique (tenant_id, id),
  constraint evaluation_records_encounter_fk foreign key (tenant_id, encounter_id)
    references encounters (tenant_id, id)
);
alter table evaluation_records enable row level security;
alter table evaluation_records force row level security;
create policy evaluation_records_tenant_isolation on evaluation_records
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
-- Ver nota em source_envelopes (0001): append-only é garantia do TRIGGER.
grant select, insert, update, delete on evaluation_records to intensicare_app;
create trigger evaluation_records_no_update before update on evaluation_records
  for each row execute function intensicare_forbid_mutation();
create trigger evaluation_records_no_delete before delete on evaluation_records
  for each row execute function intensicare_forbid_mutation();

-- 3) Idempotência de escrita com hash do corpo -------------------------------
-- Replays da MESMA chave com corpo idêntico devolvem a resposta original;
-- corpo divergente é rejeitado (422) — alinhado ao draft IETF
-- draft-ietf-httpapi-idempotency-key-header.
create table idempotency_records (
  tenant_id text not null,
  idempotency_key text not null,
  request_hash text not null,
  status_code integer not null,
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, idempotency_key)
);
alter table idempotency_records enable row level security;
alter table idempotency_records force row level security;
create policy idempotency_records_tenant_isolation on idempotency_records
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
grant select, insert on idempotency_records to intensicare_app;

-- 4) Carimbo de criação em work_items (projeção "alerta mais recente") -------
alter table work_items add column created_at timestamptz not null default now();

-- 5) Escore de origem no alerta (fato imutável e explicável por si) ----------
alter table alerts add column score double precision;

grant usage, select on all sequences in schema public to intensicare_app;
