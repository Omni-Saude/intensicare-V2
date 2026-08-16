/**
 * apps/api/src/db.ts — fiação REAL da fatia (integração SPR-G7-2).
 *
 * Substitui o antigo `store.ts` em memória ("INTEGRAÇÃO PENDENTE",
 * removido): todo estado agora vive em `@intensicare/persistencia`
 * (PGlite — classe PostgreSQL, PRE-03) sob RLS por tenant, com outbox
 * transacional (ADR-0010 B1: efeito + evento na MESMA transação),
 * auditoria append-only (ADR-0009 W6) em toda leitura/ação e concorrência
 * otimista por versão (ADR-0009 Q2-A; HAZ-0023).
 *
 * PREMISSA (reversível, GDEC-0015/0017): a ingestão exige encontro/leito
 * previamente provisionados (fixtures sintéticas) — provisionamento
 * ADT/censo é matéria de fatia futura; envelope para encontro inexistente
 * (ou de outro tenant) responde 404 sem distinguir os dois casos.
 *
 * PREMISSA (reversível, GDEC-0015/0017): nesta fatia o `WorkItem` nasce
 * 1:1 com o seu `Alert` e carrega o MESMO id — o contrato expõe um único
 * identificador de alerta acionável.
 */
import { createHash, randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import type {
  BandaRisco,
  ContextoAvaliacaoPaciente,
  EntradaGradeLeitos,
  EstadoItemTrabalho,
  EventoFluxo,
  Frescor,
  IngestaoObservacoesResposta,
  ItemTrabalho,
  ObservacaoEmQuarentena,
  ObservacaoEntrada,
  ResultadoAvaliacao,
  ResumoItemTrabalho,
  StatusAvaliacao,
} from "@intensicare/contratos";
import {
  absentInstant,
  isLegalWorkItemTransition,
  presentInstant,
  type TemporalValue,
  type WorkItemState,
} from "@intensicare/dominio";
import { reassessNews2AtReadTime, type EvaluationRecord } from "@intensicare/kernel-clinico";
import { loadIntoDatabase } from "@intensicare/fixtures-sinteticas";
import {
  bootstrapDatabase,
  createInMemoryDatabase,
  getWorkItem,
  insertAlert,
  insertAuditEvent,
  insertClinicalObservationWithOutbox,
  insertEvaluationRecord,
  insertIdempotencyRecord,
  insertOutboxEvent,
  insertSourceEnvelope,
  insertWorkItem,
  getIdempotencyRecord,
  listActiveEncounters,
  listBeds,
  listClinicalObservationsForEncounter,
  listEvaluationRecordsBySubject,
  listLatestEvaluationPerEncounter,
  listOutboxEvents,
  listWorkItemsWithAlerts,
  transitionWorkItem,
  withTenantTransaction,
  type ActiveEncounterRow,
  type WorkItemWithAlertRow,
} from "@intensicare/persistencia";
import {
  PARAM_TO_CONCEPT,
  canonicalUnitFor,
  evaluateEncounter,
  PARAM_TO_KERNEL,
  requerAlerta,
  toResultadoAvaliacao,
} from "./avaliacao.js";

// Limiares de frescor ilustrativos — VALIDATION REQUIRED no ADR-0011 §3
// (nenhum alvo numérico de latência/frescor foi decidido). Existem apenas
// para tornar `Frescor` observável e testável nesta fatia.
const FRESCOR_ATUAL_MS = 5 * 60 * 1000;
const FRESCOR_ENVELHECENDO_MS = 30 * 60 * 1000;

/**
 * Prepara o banco de desenvolvimento/teste: PGlite em memória, migrações
 * (0001/0002), rebaixamento para o papel de aplicação e SEMEADURA das
 * fixtures sintéticas (cenário G7 — política de dados sintéticos,
 * GDEC-0014). Quando `existing` é fornecido, assume-se JÁ migrado e
 * semeado pelo chamador (útil em teste E2E com semeadura própria).
 */
export async function prepareDatabase(existing?: PGlite): Promise<PGlite> {
  if (existing !== undefined) return existing;
  const db = createInMemoryDatabase();
  await bootstrapDatabase(db);
  await loadIntoDatabase(db);
  return db;
}

// --- utilidades de tempo e identidade ---------------------------------------

function nowInstant(): TemporalValue {
  return presentInstant({ utc: new Date().toISOString(), offset: "+00:00", timezone: "Etc/UTC" });
}

/** Constrói o instante clínico preservando UTC normalizado, offset e valor-fonte (ADR-0005 M3). */
export function clinicalInstantFromIso(iso: string): TemporalValue {
  const utc = new Date(iso).toISOString();
  const match = /(Z|[+-]\d{2}:\d{2})$/.exec(iso);
  const offset = match === null || match[1] === "Z" ? "+00:00" : (match[1] as string);
  return presentInstant({ utc, offset, sourceValue: iso });
}

/** Hash SHA-256 (hex) do corpo canônico — base do replay idempotente com detecção de divergência. */
export function hashRequestBody(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body) ?? "null").digest("hex");
}

function hyphenState(state: string): EstadoItemTrabalho {
  return state.replaceAll("_", "-") as EstadoItemTrabalho;
}

function toIsoOrNull(instant: TemporalValue): string | null {
  return instant.kind === "present" ? instant.instant.utc : null;
}

function pgTimestampToIso(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

async function auditAction(
  tx: Parameters<typeof insertAuditEvent>[0],
  input: {
    tenantId: string;
    actorId: string;
    command: string;
    aggregateType: string;
    aggregateId: string;
    outcome: "sucesso" | "recusada";
    idempotencyKey: string;
  },
): Promise<void> {
  await insertAuditEvent(tx, {
    id: `SYNTH-AUDIT-${randomUUID()}`,
    tenantId: input.tenantId,
    actorId: input.actorId,
    command: input.command,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    newState: input.outcome,
    occurredAt: nowInstant(),
    idempotencyKey: input.idempotencyKey,
  });
}

// --- ingestão ---------------------------------------------------------------

export type IngestOutcome =
  | { readonly kind: "created"; readonly body: IngestaoObservacoesResposta }
  | { readonly kind: "replayed"; readonly statusCode: number; readonly body: unknown }
  | { readonly kind: "key-conflict" }
  | { readonly kind: "encounter-not-found" }
  | { readonly kind: "mismatch"; readonly detail: string };

export interface IngestArgs {
  readonly tenantId: string;
  readonly actorId: string;
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly encontroId: string;
  readonly leitoId: string;
  readonly pacienteRef: string;
  readonly contexto: ContextoAvaliacaoPaciente | undefined;
  readonly aceitas: readonly ObservacaoEntrada[];
  readonly quarentena: readonly ObservacaoEmQuarentena[];
  readonly rawBody: unknown;
}

/**
 * Fluxo real de ingestão, TODO dentro de UMA transação escopada por tenant:
 * idempotência (hash do corpo) → envelope de origem imutável → fato clínico
 * canônico + outbox por observação → avaliação NEWS2 REAL sobre as
 * observações persistidas do encontro → registro de avaliação imutável →
 * alerta durável + item de trabalho + outbox quando a avaliação válida
 * atinge condição de exibição → auditoria da ação. Falha em qualquer etapa
 * reverte TUDO — nunca efeito sem evento nem evento sem efeito (ADR-0010 B1).
 */
export async function ingestObservations(db: PGlite, args: IngestArgs): Promise<IngestOutcome> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    // Idempotência com hash do corpo (draft IETF idempotency-key-header).
    const existing = await getIdempotencyRecord(tx, args.idempotencyKey);
    if (existing !== undefined) {
      if (existing.requestHash !== args.requestHash) {
        await auditAction(tx, {
          tenantId: args.tenantId,
          actorId: args.actorId,
          command: "ingestao-observacoes",
          aggregateType: "encounter",
          aggregateId: args.encontroId,
          outcome: "recusada",
          idempotencyKey: args.idempotencyKey,
        });
        return { kind: "key-conflict" } as const;
      }
      return { kind: "replayed", statusCode: existing.statusCode, body: existing.responseBody } as const;
    }

    // Encontro provisionado? (404 indistinguível entre inexistente e cross-tenant.)
    const encounters = await listActiveEncounters(tx);
    const encounter = encounters.find((e) => e.encounterId === args.encontroId);
    if (encounter === undefined) {
      await auditAction(tx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        command: "ingestao-observacoes",
        aggregateType: "encounter",
        aggregateId: args.encontroId,
        outcome: "recusada",
        idempotencyKey: args.idempotencyKey,
      });
      return { kind: "encounter-not-found" } as const;
    }
    if (encounter.subjectRef !== args.pacienteRef) {
      return { kind: "mismatch", detail: "pacienteRef não corresponde ao paciente do encontro." } as const;
    }
    if (encounter.bedId !== args.leitoId) {
      return { kind: "mismatch", detail: "leitoId não corresponde ao leito do encontro." } as const;
    }

    const agora = new Date();
    const agoraIso = agora.toISOString();

    // Envelope de origem imutável — payload cru retido para replay (ADR-0005 M1).
    const envelopeId = `SYNTH-ENV-${randomUUID()}`;
    await insertSourceEnvelope(tx, {
      id: envelopeId,
      tenantId: args.tenantId,
      sourceSystem: "SYNTH-api-ingest",
      receivedAt: nowInstant(),
      rawPayload: args.rawBody,
    });

    // Fatos clínicos canônicos + outbox por observação (mesma transação).
    for (const obs of args.aceitas) {
      const kernelParam = PARAM_TO_KERNEL[obs.parametro];
      const ucum = obs.unidade !== undefined ? canonicalUnitFor(kernelParam, obs.unidade) : undefined;
      const clinicalTime = clinicalInstantFromIso(obs.coletadoEm);
      await insertClinicalObservationWithOutbox(
        tx,
        {
          id: `SYNTH-OBS-${randomUUID()}`,
          tenantId: args.tenantId,
          subjectRef: args.pacienteRef,
          encounterId: args.encontroId,
          concept: PARAM_TO_CONCEPT[obs.parametro],
          value: {
            ...(obs.valor !== undefined ? { sourceValue: obs.valor } : {}),
            ...(obs.unidade !== undefined ? { sourceUnit: obs.unidade } : {}),
            ...(obs.codigo !== undefined ? { sourceCode: obs.codigo } : {}),
            // Par canônico por ALIAS de unidade (identidade — sem conversão numérica).
            ...(ucum !== undefined && obs.valor !== undefined
              ? { canonicalValue: obs.valor, canonicalUnit: ucum }
              : {}),
          },
          quality: "valid",
          provenance: {
            sourceSystem: "SYNTH-api-ingest",
            sourceEnvelopeId: envelopeId,
            transformation:
              ucum !== undefined && ucum !== obs.unidade ? `unit-alias:${obs.unidade ?? ""}->${ucum}` : "none",
            mappingVersion: "SYNTH-map-0",
            collector: "apps/api",
          },
          observedAt: clinicalTime,
          effectiveAt: clinicalTime,
          issuedAt: absentInstant("nao_informado_pela_fonte"),
          receivedAt: nowInstant(),
          persistedAt: nowInstant(),
        },
        `encounter:${args.encontroId}`,
      );
    }

    // Evento de nível de envelope (contrato pt-BR), mesma transação.
    await insertOutboxEvent(tx, {
      tenantId: args.tenantId,
      orderingScope: `encounter:${args.encontroId}`,
      eventType: "observacoes-ingeridas",
      aggregateType: "source_envelope",
      aggregateId: envelopeId,
      payload: {
        encontroId: args.encontroId,
        leitoId: args.leitoId,
        pacienteRef: args.pacienteRef,
        aceitas: args.aceitas.length,
        quarentena: args.quarentena.length,
      },
    });

    // Avaliação NEWS2 REAL sobre TODAS as observações persistidas do encontro.
    const persisted = await listClinicalObservationsForEncounter(tx, args.encontroId);
    const record = evaluateEncounter(persisted, args.contexto, agoraIso);
    const avaliacao: ResultadoAvaliacao = toResultadoAvaliacao(record);

    const evaluationId = `SYNTH-AVAL-${randomUUID()}`;
    await insertEvaluationRecord(tx, {
      id: evaluationId,
      tenantId: args.tenantId,
      encounterId: args.encontroId,
      subjectRef: args.pacienteRef,
      status: avaliacao.status,
      totalScore: avaliacao.escore,
      riskTier: avaliacao.banda,
      redParameter: avaliacao.parametroVermelho,
      fires: record.fires,
      evaluatedAt: nowInstant(),
      result: avaliacao as unknown as Record<string, unknown>,
      kernelRecord: record as unknown as Record<string, unknown>,
    });
    await insertOutboxEvent(tx, {
      tenantId: args.tenantId,
      orderingScope: `encounter:${args.encontroId}`,
      eventType: "avaliacao-computada",
      aggregateType: "evaluation_record",
      aggregateId: evaluationId,
      payload: {
        encontroId: args.encontroId,
        status: avaliacao.status,
        escore: avaliacao.escore,
        banda: avaliacao.banda,
      },
    });

    // Alerta durável + item de trabalho + outbox — MESMA transação.
    let alerta: ResumoItemTrabalho | null = null;
    if (requerAlerta(record)) {
      const alertId = `SYNTH-ALERTA-${randomUUID()}`;
      await insertAlert(tx, {
        id: alertId,
        tenantId: args.tenantId,
        encounterId: args.encontroId,
        raisedAt: nowInstant(),
        evaluatedAt: nowInstant(),
        severity: avaliacao.banda ?? "critico",
        reason: avaliacao.explicacao,
        ...(avaliacao.escore !== null ? { score: avaliacao.escore } : {}),
      });
      await insertWorkItem(tx, { id: alertId, tenantId: args.tenantId, alertId });
      await insertOutboxEvent(tx, {
        tenantId: args.tenantId,
        orderingScope: `encounter:${args.encontroId}`,
        eventType: "alerta-criado",
        aggregateType: "work_item",
        aggregateId: alertId,
        payload: { id: alertId, estado: "nao-atribuido", versao: 0 },
      });
      alerta = { id: alertId, estado: "nao-atribuido", versao: 0 };
    }

    await auditAction(tx, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      command: "ingestao-observacoes",
      aggregateType: "encounter",
      aggregateId: args.encontroId,
      outcome: "sucesso",
      idempotencyKey: args.idempotencyKey,
    });

    const body: IngestaoObservacoesResposta = {
      encontroId: args.encontroId,
      recebidoEm: agoraIso,
      aceitas: [...args.aceitas],
      quarentena: [...args.quarentena],
      avaliacao,
      alerta,
    };

    await insertIdempotencyRecord(tx, {
      tenantId: args.tenantId,
      idempotencyKey: args.idempotencyKey,
      requestHash: args.requestHash,
      statusCode: 201,
      responseBody: body as unknown as Record<string, unknown>,
    });

    return { kind: "created", body } as const;
  });
}

// --- projeção: grade de leitos ----------------------------------------------

function calcularFrescor(evaluatedAtIso: string | null, agora: Date): Frescor {
  if (evaluatedAtIso === null) return "desatualizado";
  const idadeMs = agora.getTime() - new Date(evaluatedAtIso).getTime();
  if (idadeMs <= FRESCOR_ATUAL_MS) return "atual";
  if (idadeMs <= FRESCOR_ENVELHECENDO_MS) return "envelhecendo";
  return "desatualizado";
}

/**
 * Projeção de leitura da grade de leitos, LIDA DO BANCO (leitos, encontros
 * ativos, avaliação mais recente por encontro, item de trabalho mais
 * recente), escopada ao tenant pela RLS (ADR-0011 P1/P2). O status
 * exibido é REAVALIADO em tempo de leitura (spec §5.3 via
 * `reassessNews2AtReadTime`): um `valido` envelhecido degrada para
 * `desatualizado`/`indisponivel` — escore some junto (nunca um número
 * velho parecendo fresco; HAZ-0005).
 */
export async function projectBedGrid(
  db: PGlite,
  args: { tenantId: string; actorId: string; correlationId: string },
): Promise<EntradaGradeLeitos[]> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    const [beds, encounters, evaluations, workItems] = [
      await listBeds(tx),
      await listActiveEncounters(tx),
      await listLatestEvaluationPerEncounter(tx),
      await listWorkItemsWithAlerts(tx),
    ];

    const agora = new Date();
    const entradas: EntradaGradeLeitos[] = beds.map((bed) => {
      const encounter = encounters.find((e) => e.bedId === bed.id);
      if (encounter === undefined) {
        return {
          leitoId: bed.id,
          encontroId: null,
          pacienteRef: null,
          escore: null,
          banda: null,
          statusAvaliacao: null,
          frescor: "desatualizado",
          atualizadoEm: null,
          alerta: null,
        };
      }

      const evaluation = evaluations.find((ev) => ev.encounterId === encounter.encounterId);
      const workItem = workItems.find((w) => w.encounterId === encounter.encounterId);
      const alerta: ResumoItemTrabalho | null =
        workItem === undefined
          ? null
          : { id: workItem.id, estado: hyphenState(workItem.state), versao: workItem.version };

      if (evaluation === undefined) {
        return {
          leitoId: bed.id,
          encontroId: encounter.encounterId,
          pacienteRef: encounter.subjectRef,
          escore: null,
          banda: null,
          statusAvaliacao: null,
          frescor: "desatualizado",
          atualizadoEm: null,
          alerta,
        };
      }

      const evaluatedAtIso = toIsoOrNull(evaluation.evaluatedAt);
      let statusAvaliacao = evaluation.status as StatusAvaliacao;
      let escore = evaluation.totalScore;
      let banda = evaluation.riskTier as BandaRisco | null;

      // Reavaliação em TEMPO DE LEITURA (spec §5.3): valido envelhecido
      // degrada explicitamente; escore/banda somem junto (HAZ-0005).
      if (statusAvaliacao === "valido") {
        const reassessed = reassessNews2AtReadTime(
          evaluation.kernelRecord as unknown as EvaluationRecord,
          agora.toISOString(),
        );
        if (reassessed.status === "stale") {
          statusAvaliacao = "desatualizado";
          escore = null;
          banda = null;
        } else if (reassessed.status === "not_evaluated") {
          statusAvaliacao = "indisponivel";
          escore = null;
          banda = null;
        }
      } else {
        escore = null;
        banda = null;
      }

      return {
        leitoId: bed.id,
        encontroId: encounter.encounterId,
        pacienteRef: encounter.subjectRef,
        escore,
        banda,
        statusAvaliacao,
        frescor: calcularFrescor(evaluatedAtIso, agora),
        atualizadoEm: evaluatedAtIso,
        alerta,
      };
    });

    await auditAction(tx, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      command: "leitura-grade-leitos",
      aggregateType: "tenant",
      aggregateId: args.tenantId,
      outcome: "sucesso",
      idempotencyKey: args.correlationId,
    });

    return entradas.sort((a, b) => a.leitoId.localeCompare(b.leitoId));
  });
}

// --- leitura: avaliações por paciente ---------------------------------------

/** `null` se o paciente é desconhecido OU pertence a outro tenant — indistinguíveis por desenho. */
export async function getPatientEvaluations(
  db: PGlite,
  args: { tenantId: string; actorId: string; pacienteRef: string; correlationId: string },
): Promise<ResultadoAvaliacao[] | null> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    const rows = await listEvaluationRecordsBySubject(tx, args.pacienteRef);
    await auditAction(tx, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      command: "leitura-avaliacoes-paciente",
      aggregateType: "patient",
      aggregateId: args.pacienteRef,
      outcome: rows.length > 0 ? "sucesso" : "recusada",
      idempotencyKey: args.correlationId,
    });
    if (rows.length === 0) return null;
    return rows.map((row) => row.result as unknown as ResultadoAvaliacao);
  });
}

// --- comando: reconhecer alerta (ADR-0009 W1/W3) ----------------------------

export type AcknowledgeOutcome =
  | { readonly kind: "not-found" }
  | { readonly kind: "version-conflict"; readonly atual: ItemTrabalho }
  | { readonly kind: "illegal-transition"; readonly atual: ItemTrabalho }
  | { readonly kind: "applied"; readonly item: ItemTrabalho };

function buildItemTrabalho(
  row: WorkItemWithAlertRow,
  encounter: ActiveEncounterRow | undefined,
  tenantId: string,
): ItemTrabalho {
  return {
    id: row.id,
    estado: hyphenState(row.state),
    versao: row.version,
    tenantId,
    encontroId: row.encounterId,
    leitoId: encounter?.bedId ?? "",
    pacienteRef: encounter?.subjectRef ?? "",
    escore: row.score ?? 0,
    banda: row.severity as BandaRisco,
    motivo: row.reason,
    criadoEm: pgTimestampToIso(row.createdAt),
    atualizadoEm: pgTimestampToIso(row.createdAt),
  };
}

/**
 * Reconhecimento com concorrência otimista REAL: legalidade da transição
 * decidida pela máquina pura de `@intensicare/dominio`
 * (`isLegalWorkItemTransition`) e efeito aplicado por comparação-e-troca
 * no repositório (`transitionWorkItem`), que grava auditoria + outbox na
 * MESMA transação (ADR-0009 W6; ADR-0010 B1). Conflito de versão devolve
 * o estado corrente para redecisão humana — nunca last-write-wins.
 *
 * PREMISSA (reversível, GDEC-0015/0017): "reconhecer" sobre item ainda
 * `nao_atribuido` executa atribuição implícita AO PRÓPRIO ator (comando
 * `assign`) seguida do reconhecimento, na MESMA transação — o grafo do
 * ADR-0009 W1 não admite `nao_atribuido → reconhecido` direto, e ambos os
 * comandos carregam o MESMO ator humano identificado (W4/W12); cada um
 * gera sua própria auditoria e evento de outbox.
 */
export async function acknowledgeAlert(
  db: PGlite,
  args: {
    tenantId: string;
    actorId: string;
    workItemId: string;
    expectedVersion: number;
    correlationId: string;
  },
): Promise<AcknowledgeOutcome> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    const found = await getWorkItem(tx, args.workItemId);
    if (found === undefined) {
      await auditAction(tx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        command: "acknowledge",
        aggregateType: "work_item",
        aggregateId: args.workItemId,
        outcome: "recusada",
        idempotencyKey: args.correlationId,
      });
      return { kind: "not-found" } as const;
    }

    const withAlert = (await listWorkItemsWithAlerts(tx)).find((w) => w.id === args.workItemId);
    const encounters = await listActiveEncounters(tx);
    const encounter = encounters.find((e) => e.encounterId === withAlert?.encounterId);
    if (withAlert === undefined) return { kind: "not-found" } as const;
    const atual = buildItemTrabalho(withAlert, encounter, args.tenantId);

    if (found.version !== args.expectedVersion) {
      await auditAction(tx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        command: "acknowledge",
        aggregateType: "work_item",
        aggregateId: args.workItemId,
        outcome: "recusada",
        idempotencyKey: args.correlationId,
      });
      return { kind: "version-conflict", atual } as const;
    }

    const state = found.state as WorkItemState;
    const viaAssign = state === "nao_atribuido";
    const legal = viaAssign
      ? isLegalWorkItemTransition("nao_atribuido", "atribuido") &&
        isLegalWorkItemTransition("atribuido", "reconhecido")
      : isLegalWorkItemTransition(state, "reconhecido");
    if (!legal) {
      await auditAction(tx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        command: "acknowledge",
        aggregateType: "work_item",
        aggregateId: args.workItemId,
        outcome: "recusada",
        idempotencyKey: args.correlationId,
      });
      return { kind: "illegal-transition", atual } as const;
    }

    let expectedVersion = args.expectedVersion;
    if (viaAssign) {
      // Atribuição implícita ao próprio ator — ver PREMISSA acima.
      const assignOutcome = await transitionWorkItem(tx, {
        workItemId: args.workItemId,
        tenantId: args.tenantId,
        expectedVersion,
        nextState: "atribuido",
        actorId: args.actorId,
        command: "assign",
        idempotencyKey: args.correlationId,
        assigneeId: args.actorId,
        occurredAt: nowInstant(),
        outboxEventType: "alerta-atualizado",
        orderingScope: `work_item:${args.workItemId}`,
      });
      if (assignOutcome.outcome === "conflict") {
        return { kind: "version-conflict", atual } as const;
      }
      expectedVersion = assignOutcome.newVersion;
    }

    const outcome = await transitionWorkItem(tx, {
      workItemId: args.workItemId,
      tenantId: args.tenantId,
      expectedVersion,
      nextState: "reconhecido",
      actorId: args.actorId,
      command: "acknowledge",
      idempotencyKey: args.correlationId,
      occurredAt: nowInstant(),
      outboxEventType: "alerta-atualizado",
      orderingScope: `work_item:${args.workItemId}`,
    });
    if (outcome.outcome === "conflict") {
      return { kind: "version-conflict", atual } as const;
    }

    const agoraIso = new Date().toISOString();
    const item: ItemTrabalho = {
      ...atual,
      estado: "reconhecido",
      versao: outcome.newVersion,
      atualizadoEm: agoraIso,
      reconhecidoPor: args.actorId,
      reconhecidoEm: agoraIso,
    };
    return { kind: "applied", item } as const;
  });
}

// --- fluxo de eventos (replay por cursor, ADR-0011 P4) ----------------------

const OUTBOX_TO_CONTRACT_EVENT: Readonly<Record<string, EventoFluxo["tipo"]>> = {
  clinical_observation_recorded: "observacao-clinica-registrada",
  "observacoes-ingeridas": "observacoes-ingeridas",
  "avaliacao-computada": "avaliacao-computada",
  "alerta-criado": "alerta-criado",
  "alerta-atualizado": "alerta-atualizado",
};

export async function replayEvents(
  db: PGlite,
  args: { tenantId: string; actorId: string; cursor: number; correlationId: string },
): Promise<EventoFluxo[]> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    const rows = await listOutboxEvents(tx, args.cursor);
    await auditAction(tx, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      command: "leitura-eventos-stream",
      aggregateType: "tenant",
      aggregateId: args.tenantId,
      outcome: "sucesso",
      idempotencyKey: args.correlationId,
    });
    return rows.map((row) => ({
      sequencia: row.id,
      tipo: OUTBOX_TO_CONTRACT_EVENT[row.eventType] ?? "observacao-clinica-registrada",
      tenantId: row.tenantId,
      ocorridoEm: pgTimestampToIso(row.occurredAt),
      dados: row.payload,
    }));
  });
}
