/**
 * Testes das medições exigidas pela fase 8: latência de avaliação, contagem
 * de alertas por estado, taxa de insumo ausente, profundidade do outbox e
 * falhas por categoria.
 *
 * SOURCE (ADR-0020 §8, V1): "Medições O2 existem e são corretas — testes de
 * instrumentação com exportador em memória".
 */
import { WORK_ITEM_STATES } from "@intensicare/dominio";
import { describe, expect, it } from "vitest";
import {
  createInMemoryTelemetry,
  failuresByCategory,
  histogramSamples,
  metricTotal,
  missingInputRate,
  outboxDepth,
  workItemCountsByState,
} from "./in-memory.js";
import {
  recordConnectorUnavailable,
  recordEvaluation,
  recordFailure,
  recordOutboxDepth,
  recordPipelineLatency,
  recordProjectionLag,
  recordWorkItemTransition,
} from "./instrumentation.js";
import { METRIC_CATALOG, METRIC_NAMES, OPERABILITY_DIMENSIONS } from "./metric-catalog.js";

describe("catálogo de métricas", () => {
  it("não declara nenhuma meta numérica (toda meta é VALIDATION REQUIRED até o G1)", () => {
    for (const name of METRIC_NAMES) {
      expect(METRIC_CATALOG[name].target).toBeNull();
    }
  });

  it("cobre todas as 12 dimensões do §15.3 exceto as que dependem de terceiros", () => {
    const cobertas: ReadonlySet<string> = new Set<string>(
      METRIC_NAMES.map((name) => METRIC_CATALOG[name].dimension),
    );
    const todas = Object.keys(OPERABILITY_DIMENSIONS);
    // D03 e D04 são medidas pelo MESMO instrumento de etapa que a D01
    // (`intensicare.clinical.pipeline.latency`, atributo `stage`), por isso
    // nem toda dimensão tem instrumento próprio. A asserção honesta é sobre
    // as que precisam de instrumento dedicado.
    for (const dimensao of ["D01", "D05", "D06", "D07", "D08", "D09", "D10", "D11", "D12"]) {
      expect(cobertas.has(dimensao)).toBe(true);
    }
    expect(todas).toHaveLength(12);
  });

  it("separa sinal operacional de alerta clínico por prefixo (ADR-0020 O8)", () => {
    for (const name of METRIC_NAMES) {
      expect(name.startsWith("intensicare.")).toBe(true);
      if (name.startsWith("intensicare.ops.")) {
        expect(name).not.toContain("alert");
        expect(name).not.toContain("alerta");
      }
    }
  });
});

describe("latência de avaliação e taxa de insumo ausente", () => {
  it("registra duração, estado e cada parâmetro ausente", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    recordEvaluation(telemetry, {
      ruleId: "RULE-NEWS2",
      ruleVersion: "0.2.0",
      status: "valid",
      durationMs: 7,
      missingParameters: [],
    });
    recordEvaluation(telemetry, {
      ruleId: "RULE-NEWS2",
      ruleVersion: "0.2.0",
      status: "not_evaluated",
      durationMs: 11,
      missingParameters: ["FR", "SpO2", "Temperatura"],
    });

    const snapshot = telemetry.snapshot();
    expect(histogramSamples(snapshot, "intensicare.clinical.evaluation.duration")).toEqual(
      expect.arrayContaining([7, 11]),
    );
    expect(metricTotal(snapshot, "intensicare.clinical.evaluation.total")).toBe(2);
    expect(
      metricTotal(snapshot, "intensicare.clinical.evaluation.total", { status: "not_evaluated" }),
    ).toBe(1);

    const taxa = missingInputRate(snapshot);
    expect(taxa.missingInputs).toBe(3);
    expect(taxa.evaluations).toBe(2);
    expect(taxa.rate).toBeCloseTo(1.5);
  });

  it("devolve taxa INDEFINIDA (null), não zero, quando não houve avaliação", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    const taxa = missingInputRate(telemetry.snapshot());
    expect(taxa.evaluations).toBe(0);
    expect(taxa.rate).toBeNull();
  });
});

describe("contagem de itens de trabalho por estado", () => {
  it("mantém a contagem corrente coerente ao longo das transições", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    recordWorkItemTransition(telemetry, null, "nao_atribuido");
    recordWorkItemTransition(telemetry, null, "nao_atribuido");
    recordWorkItemTransition(telemetry, "nao_atribuido", "atribuido");
    recordWorkItemTransition(telemetry, "atribuido", "reconhecido");

    const contagens = workItemCountsByState(telemetry.snapshot());
    expect(contagens.nao_atribuido).toBe(1);
    expect(contagens.atribuido).toBe(0);
    expect(contagens.reconhecido).toBe(1);
    expect(
      metricTotal(telemetry.snapshot(), "intensicare.clinical.work_item.transition.total"),
    ).toBe(2);
  });

  it("aceita os oito estados vindos de @intensicare/dominio (vocabulário único)", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    for (const estado of WORK_ITEM_STATES) {
      recordWorkItemTransition(telemetry, null, estado);
    }
    const contagens = workItemCountsByState(telemetry.snapshot());
    expect(Object.keys(contagens).sort()).toEqual([...WORK_ITEM_STATES].sort());
  });
});

describe("profundidade do outbox e latências de etapa", () => {
  it("acumula a variação de profundidade sem publicar o escopo de ordenação", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    recordOutboxDepth(telemetry, "SYNTH-ENCONTRO-0001", 5);
    recordOutboxDepth(telemetry, "SYNTH-ENCONTRO-0001", 2, 5);
    expect(outboxDepth(telemetry.snapshot())).toBe(2);

    const serializado = JSON.stringify(telemetry.snapshot());
    expect(serializado).not.toContain("SYNTH-ENCONTRO-0001");
    expect(serializado).toMatch(/op_[0-9a-f]{16}/);
  });

  it("registra latência por etapa e lag de projeção", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    recordPipelineLatency(telemetry, "source_to_accepted", 40);
    recordPipelineLatency(telemetry, "generated_to_acknowledged", 900);
    recordProjectionLag(telemetry, "grade_leitos", 250);

    const snapshot = telemetry.snapshot();
    expect(
      histogramSamples(snapshot, "intensicare.clinical.pipeline.latency", {
        stage: "source_to_accepted",
      }),
    ).toEqual([40]);
    expect(histogramSamples(snapshot, "intensicare.backbone.projection.lag")).toEqual([250]);
  });
});

describe("falhas por categoria", () => {
  it("agrega por categoria fechada e emite log de erro", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    recordFailure(telemetry, "outbox_publish_failure");
    recordFailure(telemetry, "outbox_publish_failure", 2);
    recordFailure(telemetry, "cross_tenant_denied");
    recordConnectorUnavailable(telemetry, "SYNTH-CONECTOR-AMH");

    const snapshot = telemetry.snapshot();
    const porCategoria = failuresByCategory(snapshot);
    expect(porCategoria.outbox_publish_failure).toBe(3);
    expect(porCategoria.cross_tenant_denied).toBe(1);
    expect(snapshot.logs.filter((log) => log.event === "failure.recorded")).toHaveLength(3);
    expect(JSON.stringify(snapshot)).not.toContain("SYNTH-CONECTOR-AMH");
  });
});
