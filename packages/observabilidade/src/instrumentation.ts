/**
 * packages/observabilidade/src/instrumentation.ts — gravadores de alto nível.
 *
 * Esta unidade é a superfície que `apps/api` e os workers usariam. Ela existe
 * para que o ponto de emissão não precise conhecer o catálogo nem os
 * construtores de redação: o chamador passa dados de DOMÍNIO (estado de item
 * de trabalho, status de avaliação, parâmetro ausente) e a redação acontece
 * aqui, uma vez, em vez de em cada `apps/api/src/*.ts`.
 *
 * SOURCE (ADR-0020 O2): a lista de medições do §15.3. SOURCE (ADR-0020 O8):
 * "alerta de operação ≠ alerta clínico; nomenclatura distinta obrigatória" —
 * por isso `recordFailure` (operação) e `recordWorkItemTransition` (clínico)
 * vivem em famílias de métrica distintas e nenhuma função aqui chama de
 * "alerta" um sinal operacional.
 *
 * ESTADO REAL: nada em `apps/api` chama estas funções ainda. A instrumentação
 * existe e é testada; ela NÃO está ligada ao laço em execução. Isso está
 * declarado como pendência — instrumentação não conectada mede zero, e um
 * gráfico vazio parece um sistema saudável.
 */
import type { WorkItemState } from "@intensicare/dominio";
import {
  type ClinicalParameterLabel,
  count,
  durationMs,
  type EvaluationStatusLabel,
  type FailureCategory,
  label,
  type OutcomeLabel,
  opaqueRef,
  type PipelineStage,
  type PolicyDenialKind,
  type ProjectionLabel,
  ruleRef,
} from "./redaction.js";
import type { Telemetry } from "./telemetry.js";

export interface EvaluationTelemetryInput {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly status: EvaluationStatusLabel;
  readonly durationMs: number;
  /** Parâmetros SEM valor utilizável — apenas o NOME do parâmetro viaja. */
  readonly missingParameters: readonly ClinicalParameterLabel[];
}

/**
 * Latência de avaliação + estado resultante + insumos ausentes.
 * O VALOR clínico nunca entra: `missingParameters` transporta o nome do
 * parâmetro, que é a informação necessária para a dimensão D05 do §15.3.
 */
export function recordEvaluation(telemetry: Telemetry, input: EvaluationTelemetryInput): void {
  const rule = ruleRef(input.ruleId, input.ruleVersion);
  const status = label(input.status);
  telemetry.meter.record("intensicare.clinical.evaluation.duration", durationMs(input.durationMs), {
    rule,
    status,
  });
  telemetry.meter.add("intensicare.clinical.evaluation.total", count(1), { rule, status });
  for (const parameter of input.missingParameters) {
    telemetry.meter.add("intensicare.clinical.evaluation.missing_input.total", count(1), {
      rule,
      parameter: label(parameter),
    });
  }
  telemetry.logger.emit(
    input.status === "valid" ? "info" : "warn",
    input.status === "valid" ? "evaluation.completed" : "evaluation.not_evaluated",
    { rule, status },
  );
}

/** Latência de uma etapa do laço mínimo de segurança (§15.3 b1–b4). */
export function recordPipelineLatency(
  telemetry: Telemetry,
  stage: PipelineStage,
  elapsedMs: number,
): void {
  telemetry.meter.record("intensicare.clinical.pipeline.latency", durationMs(elapsedMs), {
    stage: label(stage),
  });
}

/** Perda por etapa (§15.3 b1 — "loss"). */
export function recordPipelineLoss(
  telemetry: Telemetry,
  stage: PipelineStage,
  category: FailureCategory,
  quantidade = 1,
): void {
  telemetry.meter.add("intensicare.clinical.pipeline.loss.total", count(quantidade), {
    stage: label(stage),
    category: label(category),
  });
}

/**
 * Transição de item de trabalho. Mantém a contagem por estado corrente (o
 * "contagem de alertas por estado" da fase 8) coerente: −1 na origem, +1 no
 * destino. `from === null` representa a criação do item.
 */
export function recordWorkItemTransition(
  telemetry: Telemetry,
  from: WorkItemState | null,
  to: WorkItemState,
): void {
  if (from !== null) {
    telemetry.meter.adjust("intensicare.clinical.work_item.current", count(-1), {
      state: label(from),
    });
    telemetry.meter.add("intensicare.clinical.work_item.transition.total", count(1), {
      from: label(from),
      to: label(to),
    });
  }
  telemetry.meter.adjust("intensicare.clinical.work_item.current", count(1), { state: label(to) });
}

/**
 * Profundidade do outbox por escopo de ordenação. O escopo é pseudonimizado:
 * o escopo de ordenação do ADR-0010 costuma derivar de encontro/paciente, e
 * publicá-lo cru transformaria a série de profundidade em uma lista de
 * pacientes ativos.
 */
export function recordOutboxDepth(
  telemetry: Telemetry,
  orderingScope: string,
  currentDepth: number,
  previousDepth = 0,
): void {
  const delta = currentDepth - previousDepth;
  if (delta !== 0) {
    telemetry.meter.adjust("intensicare.backbone.outbox.depth", count(delta), {
      "scope.ref": opaqueRef(orderingScope),
    });
  }
  telemetry.logger.emit("debug", "outbox.depth_sampled", {
    "scope.ref": opaqueRef(orderingScope),
  });
}

/**
 * Variação do backlog de replay (ADR-0010 B4). Recebe um DELTA, não o valor
 * absoluto: o instrumento é `up_down_counter`, e passar o absoluto a cada
 * amostra somaria o backlog consigo mesmo — erro clássico de instrumentação
 * que produziria uma série crescente e falsa.
 */
export function recordReplayBacklogDelta(telemetry: Telemetry, delta: number): void {
  telemetry.meter.adjust("intensicare.backbone.replay.backlog", count(delta));
}

/** Atraso da projeção de leitura (ADR-0011 P5). */
export function recordProjectionLag(
  telemetry: Telemetry,
  projection: ProjectionLabel,
  lagMs: number,
): void {
  telemetry.meter.record("intensicare.backbone.projection.lag", durationMs(lagMs), {
    projection: label(projection),
  });
}

/** Divergência de reconciliação entre lanes (ADR-0006). */
export function recordReconciliationDivergence(
  telemetry: Telemetry,
  projection: ProjectionLabel,
  quantidade = 1,
): void {
  telemetry.meter.add("intensicare.backbone.reconciliation.divergence.total", count(quantidade), {
    projection: label(projection),
  });
}

/** Falha operacional por categoria fechada. NÃO é alerta clínico (ADR-0020 O8). */
export function recordFailure(
  telemetry: Telemetry,
  category: FailureCategory,
  quantidade = 1,
): void {
  telemetry.meter.add("intensicare.ops.failure.total", count(quantidade), {
    category: label(category),
  });
  telemetry.logger.emit("error", "failure.recorded", { category: label(category) });
}

/** Negativa de política de acesso, incluindo tentativa cross-tenant (§15.3 b9). */
export function recordPolicyDenial(
  telemetry: Telemetry,
  kind: PolicyDenialKind,
  tenantId: string,
): void {
  telemetry.meter.add("intensicare.ops.policy_denial.total", count(1), {
    kind: label(kind),
    "tenant.ref": opaqueRef(tenantId),
  });
}

/** Indisponibilidade de conector externo (§15.3 b8). */
export function recordConnectorUnavailable(telemetry: Telemetry, connectorId: string): void {
  telemetry.meter.add("intensicare.ops.connector.unavailable.total", count(1), {
    "connector.ref": opaqueRef(connectorId),
  });
}

/** Drift de contrato detectado em conector externo (§15.3 b8). */
export function recordContractDrift(telemetry: Telemetry, connectorId: string): void {
  telemetry.meter.add("intensicare.ops.contract_drift.total", count(1), {
    "connector.ref": opaqueRef(connectorId),
  });
}

/** Resultado de execução de backup (§15.3 b10). Sem meta de RPO/RTO — G1. */
export function recordBackupResult(telemetry: Telemetry, outcome: OutcomeLabel): void {
  telemetry.meter.add("intensicare.ops.backup.result.total", count(1), {
    outcome: label(outcome),
  });
  if (outcome === "failure") recordFailure(telemetry, "backup_failure");
}

/** Resultado de um ENSAIO de restore (§15.3 b10; ADR-0020 O6). */
export function recordRestoreIntegrity(telemetry: Telemetry, outcome: OutcomeLabel): void {
  telemetry.meter.add("intensicare.ops.restore.integrity.total", count(1), {
    outcome: label(outcome),
  });
  if (outcome === "failure") recordFailure(telemetry, "restore_integrity_failure");
}

/** Integridade de exportação de evidência (§15.3 b10; ADR-0020 O9). */
export function recordEvidenceExportIntegrity(telemetry: Telemetry, outcome: OutcomeLabel): void {
  telemetry.meter.add("intensicare.ops.evidence_export.integrity.total", count(1), {
    outcome: label(outcome),
  });
  if (outcome === "failure") recordFailure(telemetry, "evidence_export_integrity_failure");
}
