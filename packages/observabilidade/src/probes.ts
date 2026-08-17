/**
 * packages/observabilidade/src/probes.ts — sondas sintéticas de segurança
 * ponta a ponta.
 *
 * SOURCE (prompt §9.4): "OpenTelemetry-compatible metrics, traces, logs, and
 * **synthetic end-to-end safety probes** with strict PHI redaction". SOURCE
 * (§15.3): degradação exposta e recuperação verificáveis.
 *
 * O que a sonda verifica
 * ----------------------
 * Que o LAÇO (ingestão → avaliação → alerta durável → visível → reconhecível)
 * ainda funciona — de ponta a ponta, com dados sintéticos, sem depender de um
 * paciente real ter deteriorado. Um sistema cujo laço quebrou em silêncio é
 * indistinguível, pelas métricas de volume, de um sistema em que ninguém
 * deteriorou: as duas situações produzem "zero alertas". A sonda é o que
 * separa as duas.
 *
 * Inversão de dependência (fronteira de módulo ADR-0002)
 * ------------------------------------------------------
 * Este pacote NÃO pode depender de `@intensicare/persistencia` nem de
 * `apps/api` (ver `scripts/check_module_boundaries.mjs`: observabilidade →
 * apenas domínio). A sonda define, portanto, a INTERFACE do driver
 * (`SafetyLoopProbeDriver`) e quem tem acesso ao laço real a implementa. Esta
 * unidade traz um driver falso apenas para o próprio teste.
 *
 * Sem escalonador real
 * --------------------
 * "Verificação periódica" aqui é `SyntheticProbeSchedule` + `dueProbes(now)`:
 * o tempo entra por parâmetro, e não há `setInterval`. Um agendador real
 * (cron, job de plataforma, healthcheck externo) exige ambiente de
 * implantação — matéria do ADR-0019, declarada como não exercida em
 * docs/13-operations-and-reliability/.
 *
 * Dados sintéticos são obrigatórios, e isso é verificado
 * ------------------------------------------------------
 * `assertSyntheticSubject` recusa qualquer referência de sujeito sem o
 * marcador `SYNTH-`. Uma sonda que rodasse sobre um paciente real geraria
 * alerta clínico falso sobre uma pessoa — é o pior modo de falha possível
 * desta funcionalidade.
 */
import {
  assertNoPhiShape,
  count,
  durationMs,
  type FailureCategory,
  label,
  opaqueRef,
  type ProbeOutcome,
} from "./redaction.js";
import type { Telemetry } from "./telemetry.js";

/** Marcador obrigatório de dado sintético (política do repositório). */
export const SYNTHETIC_MARKER = "SYNTH-";

export class NonSyntheticProbeDataError extends Error {
  constructor() {
    super(
      "Sonda sintética recusada: a referência de sujeito não carrega o marcador " +
        `"${SYNTHETIC_MARKER}". Sonda jamais roda sobre sujeito real — ela criaria ` +
        "um alerta clínico falso sobre uma pessoa.",
    );
    this.name = "NonSyntheticProbeDataError";
  }
}

/**
 * Verifica o marcador sintético. Não valida a forma do PSR (isso é do
 * domínio); valida a única propriedade que importa aqui: é sintético?
 */
export function assertSyntheticSubject(subjectRef: string): void {
  if (!subjectRef.includes(SYNTHETIC_MARKER)) {
    throw new NonSyntheticProbeDataError();
  }
}

/** Passos do laço mínimo de segurança que a sonda exercita. */
export const PROBE_STEPS = [
  "ingest",
  "evaluate",
  "raise_work_item",
  "read_projection",
  "acknowledge",
] as const;

export type ProbeStep = (typeof PROBE_STEPS)[number];

/**
 * Contrato do driver. Cada método devolve APENAS um veredito estrutural — a
 * sonda nunca vê nem transporta valor clínico, e por isso não há caminho por
 * onde um resultado de sonda vaze PHI.
 */
export interface SafetyLoopProbeDriver {
  /** Injeta observações sintéticas que devem produzir avaliação e alerta. */
  readonly ingest: (subjectRef: string) => Promise<boolean> | boolean;
  /** Executa/lê a avaliação; `true` quando o estado é `valid`. */
  readonly evaluate: (subjectRef: string) => Promise<boolean> | boolean;
  /** `true` quando um item de trabalho durável foi criado a partir da avaliação. */
  readonly raiseWorkItem: (subjectRef: string) => Promise<boolean> | boolean;
  /** `true` quando o item aparece na projeção de leitura. */
  readonly readProjection: (subjectRef: string) => Promise<boolean> | boolean;
  /** `true` quando o reconhecimento com controle de versão é aceito. */
  readonly acknowledge: (subjectRef: string) => Promise<boolean> | boolean;
  /** Remove o resíduo sintético (obrigatório: sonda não polui a série clínica). */
  readonly cleanup: (subjectRef: string) => Promise<void> | void;
}

export interface SyntheticProbeDefinition {
  /** Identificador da sonda. Não é PHI; ainda assim viaja opaco na telemetria. */
  readonly probeId: string;
  readonly descricaoPt: string;
  /** Referência sintética de sujeito usada pela sonda (deve conter `SYNTH-`). */
  readonly subjectRef: string;
  /** Passos exigidos. Um passo `false` reprova a sonda. */
  readonly steps: readonly ProbeStep[];
}

export interface ProbeStepResult {
  readonly step: ProbeStep;
  readonly passed: boolean;
}

export interface SyntheticProbeResult {
  readonly probeId: string;
  readonly outcome: ProbeOutcome;
  readonly durationMs: number;
  readonly steps: readonly ProbeStepResult[];
  /** Primeiro passo reprovado, quando houver. */
  readonly failedStep: ProbeStep | null;
  /** Categoria de falha (fechada) quando reprovada. */
  readonly failureCategory: FailureCategory | null;
}

const STEP_INVOKER: Readonly<
  Record<
    ProbeStep,
    (driver: SafetyLoopProbeDriver, subjectRef: string) => Promise<boolean> | boolean
  >
> = {
  ingest: (driver, subjectRef) => driver.ingest(subjectRef),
  evaluate: (driver, subjectRef) => driver.evaluate(subjectRef),
  raise_work_item: (driver, subjectRef) => driver.raiseWorkItem(subjectRef),
  read_projection: (driver, subjectRef) => driver.readProjection(subjectRef),
  acknowledge: (driver, subjectRef) => driver.acknowledge(subjectRef),
};

const STEP_FAILURE_CATEGORY: Readonly<Record<ProbeStep, FailureCategory>> = {
  ingest: "ingest_rejected",
  evaluate: "rule_evaluation_failure",
  raise_work_item: "persistence_failure",
  read_projection: "projection_rebuild_failure",
  acknowledge: "delivery_failure",
};

/**
 * Executa a sonda. Nunca lança por causa de um passo reprovado — reprovação é
 * um RESULTADO, e um resultado precisa ser publicado. Só lança quando o dado
 * não é sintético (recusa de segurança, antes de qualquer efeito) ou quando o
 * próprio driver lança.
 */
export async function runSyntheticProbe(
  telemetry: Telemetry,
  definition: SyntheticProbeDefinition,
  driver: SafetyLoopProbeDriver,
): Promise<SyntheticProbeResult> {
  assertSyntheticSubject(definition.subjectRef);
  // O identificador da sonda também é varrido: uma sonda nomeada com o
  // identificador do paciente sintético seria um vazamento por nome.
  assertNoPhiShape(definition.probeId, "probe.ref");

  const probeRef = opaqueRef(definition.probeId);
  const startedAt = telemetry.clock();
  const span = telemetry.tracer.startSpan("probe.safety_loop", {
    attributes: { "probe.ref": probeRef },
  });
  telemetry.logger.emit("info", "probe.started", { "probe.ref": probeRef });

  const steps: ProbeStepResult[] = [];
  let failedStep: ProbeStep | null = null;

  try {
    for (const step of definition.steps) {
      const invoke = STEP_INVOKER[step];
      const passed = await invoke(driver, definition.subjectRef);
      steps.push({ step, passed });
      span.addEvent(passed ? "passed" : "failed", { "probe.ref": probeRef });
      if (!passed) {
        failedStep = step;
        break;
      }
    }
  } finally {
    await driver.cleanup(definition.subjectRef);
  }

  const elapsed = Math.max(0, telemetry.clock() - startedAt);
  const outcome: ProbeOutcome = failedStep === null ? "passed" : "failed";
  const failureCategory = failedStep === null ? null : STEP_FAILURE_CATEGORY[failedStep];

  span.setAttribute("outcome", label(outcome));
  if (failureCategory === null) {
    span.setStatus("ok");
  } else {
    span.setStatus("error", failureCategory);
  }
  span.end();

  telemetry.meter.add("intensicare.probe.run.total", count(1), {
    "probe.ref": probeRef,
    outcome: label(outcome),
  });
  telemetry.meter.record("intensicare.probe.loop.duration", durationMs(elapsed), {
    "probe.ref": probeRef,
  });
  if (failureCategory !== null) {
    telemetry.meter.add("intensicare.ops.failure.total", count(1), {
      category: label("probe_failure"),
    });
  }
  telemetry.logger.emit(outcome === "passed" ? "info" : "error", "probe.finished", {
    "probe.ref": probeRef,
    outcome: label(outcome),
  });

  return {
    probeId: definition.probeId,
    outcome,
    durationMs: elapsed,
    steps,
    failedStep,
    failureCategory,
  };
}

// ---------------------------------------------------------------------------
// Agendamento sem relógio próprio
// ---------------------------------------------------------------------------

export interface SyntheticProbeSchedule {
  readonly definition: SyntheticProbeDefinition;
  /** Intervalo desejado em ms. PREMISSA reversível: cadência é operação, não clínica. */
  readonly intervalMs: number;
  /** Instante da última execução; `null` = nunca executada (vence imediatamente). */
  readonly lastRunMs: number | null;
}

/** Quais sondas estão vencidas em `nowMs`. Puro — sem timers, sem relógio interno. */
export function dueProbes(
  schedules: readonly SyntheticProbeSchedule[],
  nowMs: number,
): readonly SyntheticProbeSchedule[] {
  return schedules.filter(
    (schedule) => schedule.lastRunMs === null || nowMs - schedule.lastRunMs >= schedule.intervalMs,
  );
}

/**
 * Definição padrão do laço avaliação→alerta. Usa uma referência sintética
 * genérica: o marcador `SYNTH-` é obrigatório e verificado na execução.
 */
export function defineSafetyLoopProbe(subjectRef: string): SyntheticProbeDefinition {
  assertSyntheticSubject(subjectRef);
  return {
    probeId: "PROBE-LACO-AVALIACAO-ALERTA",
    descricaoPt:
      "Verifica de ponta a ponta que ingestão → avaliação → item de trabalho durável → projeção → reconhecimento continua funcionando, com dados sintéticos.",
    subjectRef,
    steps: PROBE_STEPS,
  };
}
