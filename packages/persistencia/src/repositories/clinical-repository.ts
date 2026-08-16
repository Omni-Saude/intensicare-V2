/**
 * Repositório clínico — pacientes, encontros, envelopes de origem,
 * observações canônicas, avaliações, alertas, itens de trabalho, auditoria,
 * idempotência e outbox (ADR-0005, ADR-0008, ADR-0009, ADR-0010). Toda
 * função aqui espera rodar dentro de uma transação já escopada por tenant
 * (ver `withTenantTransaction` em `../session.js`) — fora desse escopo, a
 * RLS nega qualquer linha.
 *
 * Integração SPR-G7-2: os tipos de entrada duplicados localmente foram
 * removidos — as entradas agora são os tipos canônicos de
 * `@intensicare/dominio` (`PatientIdentity`, `Encounter`, `SourceEnvelope`,
 * `ClinicalObservation`, `Alert`, `AuditEvent`). Os tipos `*Row` de leitura
 * permanecem locais por serem a forma do banco, não do domínio.
 *
 * A garantia central deste repositório (ADR-0010 B1/DOM-0005) é que
 * gravação clínica e evento de outbox — e, no caso de item de trabalho,
 * também o `AuditEvent` — acontecem na MESMA transação: nunca existe uma
 * janela em que o efeito foi gravado e o evento não, nem o inverso.
 */
import type { Transaction } from "@electric-sql/pglite";
import type {
  Alert,
  AuditEvent,
  ClinicalObservation,
  Encounter,
  PatientIdentity,
  SourceEnvelope,
  TemporalValue,
} from "@intensicare/dominio";

// --- pacientes e encontros -------------------------------------------------

export async function insertPatientIdentity(tx: Transaction, input: PatientIdentity): Promise<void> {
  await tx.query(`insert into patient_identities (id, tenant_id, subject_ref) values ($1, $2, $3)`, [
    input.id,
    input.tenantId,
    input.subjectRef,
  ]);
}

export async function insertEncounter(tx: Transaction, input: Encounter): Promise<void> {
  await tx.query(
    `insert into encounters (id, tenant_id, patient_id, bed_id, admitted_at, discharged_at)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      input.id,
      input.tenantId,
      input.patientId,
      input.bedId ?? null,
      input.admittedAt,
      input.dischargedAt ?? null,
    ],
  );
}

export interface ActiveEncounterRow {
  readonly encounterId: string;
  readonly patientId: string;
  readonly bedId: string | null;
  readonly subjectRef: string;
}

/** Encontros SEM alta (em andamento) do tenant corrente, com o PSR do paciente. */
export async function listActiveEncounters(tx: Transaction): Promise<readonly ActiveEncounterRow[]> {
  const result = await tx.query<{
    id: string;
    patient_id: string;
    bed_id: string | null;
    subject_ref: string;
  }>(`select e.id, e.patient_id, e.bed_id, p.subject_ref
        from encounters e
        join patient_identities p on p.tenant_id = e.tenant_id and p.id = e.patient_id
       where e.discharged_at is null
       order by e.id`);
  return result.rows.map((row) => ({
    encounterId: row.id,
    patientId: row.patient_id,
    bedId: row.bed_id,
    subjectRef: row.subject_ref,
  }));
}

export async function insertSourceEnvelope(tx: Transaction, input: SourceEnvelope): Promise<void> {
  await tx.query(
    `insert into source_envelopes (id, tenant_id, source_system, received_at, raw_payload)
     values ($1, $2, $3, $4, $5)`,
    [input.id, input.tenantId, input.sourceSystem, input.receivedAt, input.rawPayload],
  );
}

// --- outbox (ADR-0010 opção A) ---------------------------------------------

export interface OutboxEventInput {
  readonly tenantId: string;
  readonly orderingScope: string;
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
}

export async function insertOutboxEvent(tx: Transaction, input: OutboxEventInput): Promise<void> {
  await tx.query(
    `insert into outbox_events (tenant_id, ordering_scope, event_type, aggregate_type, aggregate_id, payload)
     values ($1, $2, $3, $4, $5, $6)`,
    [input.tenantId, input.orderingScope, input.eventType, input.aggregateType, input.aggregateId, input.payload],
  );
}

export interface OutboxEventRow {
  readonly id: number;
  readonly tenantId: string;
  readonly orderingScope: string;
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
  readonly occurredAt: string;
}

/** Lê os eventos de outbox VISÍVEIS na transação corrente (sujeito a RLS), na ordem de inserção (B3). */
export async function listOutboxEvents(tx: Transaction, afterId = 0): Promise<readonly OutboxEventRow[]> {
  const result = await tx.query<{
    id: number;
    tenant_id: string;
    ordering_scope: string;
    event_type: string;
    aggregate_type: string;
    aggregate_id: string;
    payload: Record<string, unknown>;
    occurred_at: string;
  }>(
    `select id, tenant_id, ordering_scope, event_type, aggregate_type, aggregate_id, payload,
            occurred_at::text as occurred_at
        from outbox_events where id > $1 order by id`,
    [afterId],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    tenantId: row.tenant_id,
    orderingScope: row.ordering_scope,
    eventType: row.event_type,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    payload: row.payload,
    occurredAt: row.occurred_at,
  }));
}

// --- auditoria (append-only, ADR-0009 W6 / ADR-0010 B1) ---------------------

export async function insertAuditEvent(tx: Transaction, input: AuditEvent): Promise<void> {
  await tx.query(
    `insert into audit_events
       (id, tenant_id, actor_id, command, aggregate_type, aggregate_id, previous_state, new_state, occurred_at, idempotency_key)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      input.id,
      input.tenantId,
      input.actorId,
      input.command,
      input.aggregateType,
      input.aggregateId,
      input.previousState ?? null,
      input.newState ?? null,
      input.occurredAt,
      input.idempotencyKey,
    ],
  );
}

export interface AuditEventRow {
  readonly id: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly command: string;
  readonly aggregateId: string;
  readonly previousState: string | null;
  readonly newState: string | null;
}

/** Lê os eventos de auditoria VISÍVEIS na transação corrente (sujeito a RLS). */
export async function listAuditEvents(tx: Transaction): Promise<readonly AuditEventRow[]> {
  const result = await tx.query<{
    id: string;
    tenant_id: string;
    actor_id: string;
    command: string;
    aggregate_id: string;
    previous_state: string | null;
    new_state: string | null;
  }>(`select id, tenant_id, actor_id, command, aggregate_id, previous_state, new_state
        from audit_events order by id`);
  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    actorId: row.actor_id,
    command: row.command,
    aggregateId: row.aggregate_id,
    previousState: row.previous_state,
    newState: row.new_state,
  }));
}

// --- observações canônicas (ADR-0005 M1-M9) ---------------------------------

/**
 * Grava um fato clínico canônico E seu evento de outbox NA MESMA
 * transação (ADR-0010 B1) — a chamadora fornece a transação (ver
 * `withTenantTransaction`); se qualquer uma das duas gravações falhar, a
 * transação inteira reverte e nenhuma das duas fica persistida.
 */
export async function insertClinicalObservationWithOutbox(
  tx: Transaction,
  input: ClinicalObservation,
  orderingScope: string,
): Promise<void> {
  await tx.query(
    `insert into clinical_observations
       (id, tenant_id, subject_ref, encounter_id, concept, source_value, source_unit, source_code,
        canonical_value, canonical_unit, quality, provenance,
        observed_at, effective_at, issued_at, received_at, persisted_at, correction_of)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      input.id,
      input.tenantId,
      input.subjectRef,
      input.encounterId,
      input.concept,
      input.value.sourceValue ?? null,
      input.value.sourceUnit ?? null,
      input.value.sourceCode ?? null,
      input.value.canonicalValue ?? null,
      input.value.canonicalUnit ?? null,
      input.quality,
      input.provenance,
      input.observedAt,
      input.effectiveAt,
      input.issuedAt,
      input.receivedAt,
      input.persistedAt,
      input.correctionOf ?? null,
    ],
  );

  await insertOutboxEvent(tx, {
    tenantId: input.tenantId,
    orderingScope,
    eventType: "clinical_observation_recorded",
    aggregateType: "clinical_observation",
    aggregateId: input.id,
    payload: { concept: input.concept, quality: input.quality },
  });
}

export interface ClinicalObservationRow {
  readonly id: string;
  readonly tenantId: string;
  readonly encounterId: string;
  readonly concept: string;
  readonly sourceValue: number | null;
  readonly sourceUnit: string | null;
  readonly sourceCode: string | null;
  readonly canonicalValue: number | null;
  readonly canonicalUnit: string | null;
  readonly quality: string;
  readonly effectiveAt: TemporalValue;
}

const OBSERVATION_ROW_COLUMNS = `id, tenant_id, encounter_id, concept, source_value, source_unit, source_code,
        canonical_value, canonical_unit, quality, effective_at`;

interface RawObservationRow {
  id: string;
  tenant_id: string;
  encounter_id: string;
  concept: string;
  source_value: number | null;
  source_unit: string | null;
  source_code: string | null;
  canonical_value: number | null;
  canonical_unit: string | null;
  quality: string;
  effective_at: TemporalValue;
}

function mapObservationRow(row: RawObservationRow): ClinicalObservationRow {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    encounterId: row.encounter_id,
    concept: row.concept,
    sourceValue: row.source_value,
    sourceUnit: row.source_unit,
    sourceCode: row.source_code,
    canonicalValue: row.canonical_value,
    canonicalUnit: row.canonical_unit,
    quality: row.quality,
    effectiveAt: row.effective_at,
  };
}

/** Lê as observações VISÍVEIS na transação corrente (sujeito a RLS). */
export async function listClinicalObservations(tx: Transaction): Promise<readonly ClinicalObservationRow[]> {
  const result = await tx.query<RawObservationRow>(
    `select ${OBSERVATION_ROW_COLUMNS} from clinical_observations order by id`,
  );
  return result.rows.map(mapObservationRow);
}

/** Observações de UM encontro (insumo da avaliação pelo kernel clínico). */
export async function listClinicalObservationsForEncounter(
  tx: Transaction,
  encounterId: string,
): Promise<readonly ClinicalObservationRow[]> {
  const result = await tx.query<RawObservationRow>(
    `select ${OBSERVATION_ROW_COLUMNS} from clinical_observations where encounter_id = $1 order by id`,
    [encounterId],
  );
  return result.rows.map(mapObservationRow);
}

// --- registros de avaliação (ADR-0008 — imutáveis, append-only) --------------

export interface EvaluationRecordInput {
  readonly id: string;
  readonly tenantId: string;
  readonly encounterId: string;
  readonly subjectRef: string;
  /** Status explícito da avaliação (vocabulário do chamador — nunca vazio). */
  readonly status: string;
  readonly totalScore: number | null;
  readonly riskTier: string | null;
  readonly redParameter: boolean;
  readonly fires: boolean;
  readonly evaluatedAt: TemporalValue;
  /** Payload no formato do contrato de API (renderizável de volta ao chamador). */
  readonly result: Record<string, unknown>;
  /** Registro integral do kernel clínico (replay/auditoria — nunca truncado). */
  readonly kernelRecord: Record<string, unknown>;
}

export async function insertEvaluationRecord(tx: Transaction, input: EvaluationRecordInput): Promise<void> {
  await tx.query(
    `insert into evaluation_records
       (id, tenant_id, encounter_id, subject_ref, status, total_score, risk_tier,
        red_parameter, fires, evaluated_at, result, kernel_record)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      input.id,
      input.tenantId,
      input.encounterId,
      input.subjectRef,
      input.status,
      input.totalScore,
      input.riskTier,
      input.redParameter,
      input.fires,
      input.evaluatedAt,
      input.result,
      input.kernelRecord,
    ],
  );
}

export interface EvaluationRecordRow {
  readonly id: string;
  readonly tenantId: string;
  readonly encounterId: string;
  readonly subjectRef: string;
  readonly status: string;
  readonly totalScore: number | null;
  readonly riskTier: string | null;
  readonly redParameter: boolean;
  readonly fires: boolean;
  readonly evaluatedAt: TemporalValue;
  readonly result: Record<string, unknown>;
  readonly kernelRecord: Record<string, unknown>;
  readonly seq: number;
}

interface RawEvaluationRow {
  id: string;
  tenant_id: string;
  encounter_id: string;
  subject_ref: string;
  status: string;
  total_score: number | null;
  risk_tier: string | null;
  red_parameter: boolean;
  fires: boolean;
  evaluated_at: TemporalValue;
  result: Record<string, unknown>;
  kernel_record: Record<string, unknown>;
  seq: number;
}

function mapEvaluationRow(row: RawEvaluationRow): EvaluationRecordRow {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    encounterId: row.encounter_id,
    subjectRef: row.subject_ref,
    status: row.status,
    totalScore: row.total_score,
    riskTier: row.risk_tier,
    redParameter: row.red_parameter,
    fires: row.fires,
    evaluatedAt: row.evaluated_at,
    result: row.result,
    kernelRecord: row.kernel_record,
    seq: Number(row.seq),
  };
}

const EVALUATION_ROW_COLUMNS = `id, tenant_id, encounter_id, subject_ref, status, total_score, risk_tier,
        red_parameter, fires, evaluated_at, result, kernel_record, seq`;

/** Avaliações de um paciente (PSR), mais recente primeiro. */
export async function listEvaluationRecordsBySubject(
  tx: Transaction,
  subjectRef: string,
): Promise<readonly EvaluationRecordRow[]> {
  const result = await tx.query<RawEvaluationRow>(
    `select ${EVALUATION_ROW_COLUMNS} from evaluation_records where subject_ref = $1 order by seq desc`,
    [subjectRef],
  );
  return result.rows.map(mapEvaluationRow);
}

/** A avaliação MAIS RECENTE de cada encontro do tenant corrente. */
export async function listLatestEvaluationPerEncounter(
  tx: Transaction,
): Promise<readonly EvaluationRecordRow[]> {
  const result = await tx.query<RawEvaluationRow>(
    `select distinct on (encounter_id) ${EVALUATION_ROW_COLUMNS}
        from evaluation_records order by encounter_id, seq desc`,
  );
  return result.rows.map(mapEvaluationRow);
}

// --- idempotência de escrita (draft IETF idempotency-key-header) -------------

export interface IdempotencyRecordInput {
  readonly tenantId: string;
  readonly idempotencyKey: string;
  /** Hash SHA-256 (hex) do corpo canônico da requisição — detecta replay divergente. */
  readonly requestHash: string;
  readonly statusCode: number;
  readonly responseBody: Record<string, unknown>;
}

export async function insertIdempotencyRecord(tx: Transaction, input: IdempotencyRecordInput): Promise<void> {
  await tx.query(
    `insert into idempotency_records (tenant_id, idempotency_key, request_hash, status_code, response_body)
     values ($1, $2, $3, $4, $5)`,
    [input.tenantId, input.idempotencyKey, input.requestHash, input.statusCode, input.responseBody],
  );
}

export interface IdempotencyRecordRow {
  readonly tenantId: string;
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly statusCode: number;
  readonly responseBody: Record<string, unknown>;
}

export async function getIdempotencyRecord(
  tx: Transaction,
  idempotencyKey: string,
): Promise<IdempotencyRecordRow | undefined> {
  const result = await tx.query<{
    tenant_id: string;
    idempotency_key: string;
    request_hash: string;
    status_code: number;
    response_body: Record<string, unknown>;
  }>(
    `select tenant_id, idempotency_key, request_hash, status_code, response_body
        from idempotency_records where idempotency_key = $1`,
    [idempotencyKey],
  );
  const row = result.rows[0];
  if (row === undefined) return undefined;
  return {
    tenantId: row.tenant_id,
    idempotencyKey: row.idempotency_key,
    requestHash: row.request_hash,
    statusCode: row.status_code,
    responseBody: row.response_body,
  };
}

// --- alertas e itens de trabalho (ADR-0009) ---------------------------------

export async function insertAlert(tx: Transaction, input: Alert): Promise<void> {
  await tx.query(
    `insert into alerts (id, tenant_id, encounter_id, raised_at, evaluated_at, severity, reason, score)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      input.id,
      input.tenantId,
      input.encounterId,
      input.raisedAt,
      input.evaluatedAt,
      input.severity,
      input.reason,
      input.score ?? null,
    ],
  );
}

export interface NewWorkItemInput {
  readonly id: string;
  readonly tenantId: string;
  readonly alertId: string;
}

/** Cria um `WorkItem` no estado inicial `nao_atribuido`, versão 0 (ADR-0009 W1). */
export async function insertWorkItem(tx: Transaction, input: NewWorkItemInput): Promise<void> {
  await tx.query(
    `insert into work_items (id, tenant_id, alert_id, state, version) values ($1, $2, $3, 'nao_atribuido', 0)`,
    [input.id, input.tenantId, input.alertId],
  );
}

export interface WorkItemRow {
  readonly id: string;
  readonly tenantId: string;
  readonly alertId: string;
  readonly state: string;
  readonly version: number;
  readonly assigneeId: string | null;
}

export async function getWorkItem(tx: Transaction, id: string): Promise<WorkItemRow | undefined> {
  const result = await tx.query<{
    id: string;
    tenant_id: string;
    alert_id: string;
    state: string;
    version: number;
    assignee_id: string | null;
  }>(`select id, tenant_id, alert_id, state, version, assignee_id from work_items where id = $1`, [id]);
  const row = result.rows[0];
  if (row === undefined) return undefined;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    alertId: row.alert_id,
    state: row.state,
    version: row.version,
    assigneeId: row.assignee_id,
  };
}

export interface WorkItemWithAlertRow extends WorkItemRow {
  readonly encounterId: string;
  readonly severity: string;
  readonly reason: string;
  readonly score: number | null;
  readonly raisedAt: TemporalValue;
  readonly createdAt: string;
}

/** Itens de trabalho do tenant, com o alerta de origem, mais recente primeiro. */
export async function listWorkItemsWithAlerts(tx: Transaction): Promise<readonly WorkItemWithAlertRow[]> {
  const result = await tx.query<{
    id: string;
    tenant_id: string;
    alert_id: string;
    state: string;
    version: number;
    assignee_id: string | null;
    encounter_id: string;
    severity: string;
    reason: string;
    score: number | null;
    raised_at: TemporalValue;
    created_at: string;
  }>(`select w.id, w.tenant_id, w.alert_id, w.state, w.version, w.assignee_id,
             a.encounter_id, a.severity, a.reason, a.score, a.raised_at, w.created_at::text as created_at
        from work_items w
        join alerts a on a.tenant_id = w.tenant_id and a.id = w.alert_id
       order by w.created_at desc, w.id desc`);
  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    alertId: row.alert_id,
    state: row.state,
    version: row.version,
    assigneeId: row.assignee_id,
    encounterId: row.encounter_id,
    severity: row.severity,
    reason: row.reason,
    score: row.score,
    raisedAt: row.raised_at,
    createdAt: row.created_at,
  }));
}

export interface WorkItemTransitionInput {
  readonly workItemId: string;
  readonly tenantId: string;
  readonly expectedVersion: number;
  readonly nextState: string;
  readonly actorId: string;
  readonly command: string;
  readonly idempotencyKey: string;
  readonly assigneeId?: string;
  readonly suppression?: Record<string, unknown>;
  readonly occurredAt: TemporalValue;
  readonly outboxEventType: string;
  readonly orderingScope: string;
}

export type WorkItemTransitionOutcome =
  | { readonly outcome: "applied"; readonly newVersion: number }
  | { readonly outcome: "conflict" };

/**
 * Transiciona um `WorkItem` por comparação-e-troca (`WHERE version =
 * expectedVersion`, ADR-0009 W3/Q2-A) e, SOMENTE se a transição foi
 * aplicada, grava `AuditEvent` + evento de outbox na MESMA transação
 * (W6/ADR-0010 B1). Versão divergente retorna `"conflict"` explícito —
 * nunca sobrescreve silenciosamente (HAZ-0023). A legalidade da transição
 * em si (qual estado pode suceder qual) é responsabilidade da camada de
 * domínio que chama este repositório — aqui só se impõe a garantia de
 * concorrência e de atomicidade transacional.
 */
export async function transitionWorkItem(
  tx: Transaction,
  input: WorkItemTransitionInput,
): Promise<WorkItemTransitionOutcome> {
  const before = await tx.query<{ state: string }>(`select state from work_items where id = $1`, [
    input.workItemId,
  ]);
  const previousState = before.rows[0]?.state;

  const updated = await tx.query<{ version: number }>(
    `update work_items
        set state = $1,
            version = version + 1,
            assignee_id = coalesce($2, assignee_id),
            suppression = coalesce($3, suppression)
      where id = $4 and tenant_id = $5 and version = $6
      returning version`,
    [
      input.nextState,
      input.assigneeId ?? null,
      input.suppression ?? null,
      input.workItemId,
      input.tenantId,
      input.expectedVersion,
    ],
  );

  const updatedRow = updated.rows[0];
  if (updatedRow === undefined) {
    return { outcome: "conflict" };
  }

  await insertAuditEvent(tx, {
    id: `${input.workItemId}-v${input.expectedVersion}`,
    tenantId: input.tenantId,
    actorId: input.actorId,
    command: input.command,
    aggregateType: "work_item",
    aggregateId: input.workItemId,
    ...(previousState !== undefined ? { previousState } : {}),
    newState: input.nextState,
    occurredAt: input.occurredAt,
    idempotencyKey: input.idempotencyKey,
  });

  await insertOutboxEvent(tx, {
    tenantId: input.tenantId,
    orderingScope: input.orderingScope,
    eventType: input.outboxEventType,
    aggregateType: "work_item",
    aggregateId: input.workItemId,
    payload: { state: input.nextState, version: updatedRow.version },
  });

  return { outcome: "applied", newVersion: updatedRow.version };
}
