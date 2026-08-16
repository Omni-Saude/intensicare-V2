/**
 * Testes das sondas sintéticas de segurança ponta a ponta (prompt §9.4).
 *
 * O driver aqui é falso, de propósito: este pacote não pode depender de
 * persistência nem de API (fronteira ADR-0002). O que se testa é o CONTRATO
 * da sonda — recusa de dado não sintético, detecção do laço quebrado,
 * publicação do desfecho, limpeza sempre executada e ausência de vazamento.
 */
import { describe, expect, it } from "vitest";
import { createInMemoryTelemetry, histogramSamples, metricTotal } from "./in-memory.js";
import {
  defineSafetyLoopProbe,
  dueProbes,
  NonSyntheticProbeDataError,
  PROBE_STEPS,
  runSyntheticProbe,
  type SafetyLoopProbeDriver,
  type SyntheticProbeSchedule,
} from "./probes.js";

const SUJEITO = "amh:psr:v1:SYNTH-SONDA-0001";

interface DriverFalso extends SafetyLoopProbeDriver {
  readonly chamadas: string[];
}

function driverFalso(falharEm: string | null = null): DriverFalso {
  const chamadas: string[] = [];
  const passo = (nome: string) => () => {
    chamadas.push(nome);
    return falharEm !== nome;
  };
  return {
    chamadas,
    ingest: passo("ingest"),
    evaluate: passo("evaluate"),
    raiseWorkItem: passo("raise_work_item"),
    readProjection: passo("read_projection"),
    acknowledge: passo("acknowledge"),
    cleanup: () => {
      chamadas.push("cleanup");
    },
  };
}

describe("recusa de dado não sintético", () => {
  it("não define sonda sobre referência sem marcador SYNTH-", () => {
    expect(() => defineSafetyLoopProbe("amh:psr:v1:paciente-real")).toThrow(
      NonSyntheticProbeDataError,
    );
  });

  it("não executa nenhum passo quando a referência não é sintética", async () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    const driver = driverFalso();
    const definicao = {
      probeId: "PROBE-TESTE",
      descricaoPt: "sonda de teste",
      subjectRef: "referencia-sem-marcador",
      steps: PROBE_STEPS,
    };
    await expect(runSyntheticProbe(telemetry, definicao, driver)).rejects.toBeInstanceOf(
      NonSyntheticProbeDataError,
    );
    expect(driver.chamadas).toHaveLength(0);
  });
});

describe("laço avaliação → alerta", () => {
  it("aprova quando o laço inteiro funciona e publica duração e desfecho", async () => {
    let agora = 0;
    const telemetry = createInMemoryTelemetry(() => {
      agora += 10;
      return agora;
    });
    const driver = driverFalso();
    const resultado = await runSyntheticProbe(telemetry, defineSafetyLoopProbe(SUJEITO), driver);

    expect(resultado.outcome).toBe("passed");
    expect(resultado.failedStep).toBeNull();
    expect(resultado.steps.map((s) => s.step)).toEqual([...PROBE_STEPS]);
    expect(driver.chamadas).toContain("cleanup");

    const snapshot = telemetry.snapshot();
    expect(metricTotal(snapshot, "intensicare.probe.run.total", { outcome: "passed" })).toBe(1);
    expect(histogramSamples(snapshot, "intensicare.probe.loop.duration").length).toBe(1);
  });

  it("reprova no primeiro passo quebrado e para ali", async () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    const driver = driverFalso("raise_work_item");
    const resultado = await runSyntheticProbe(telemetry, defineSafetyLoopProbe(SUJEITO), driver);

    expect(resultado.outcome).toBe("failed");
    expect(resultado.failedStep).toBe("raise_work_item");
    expect(resultado.failureCategory).toBe("persistence_failure");
    expect(resultado.steps).toHaveLength(3);
    expect(driver.chamadas).not.toContain("acknowledge");
    expect(
      metricTotal(telemetry.snapshot(), "intensicare.ops.failure.total", {
        category: "probe_failure",
      }),
    ).toBe(1);
  });

  it("distingue 'laço quebrado' de 'ninguém deteriorou' — reprovação é resultado, não exceção", async () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    const resultado = await runSyntheticProbe(
      telemetry,
      defineSafetyLoopProbe(SUJEITO),
      driverFalso("evaluate"),
    );
    expect(resultado.outcome).toBe("failed");
    // O sinal existe. Sem sonda, este cenário produziria "zero alertas",
    // exatamente como um dia sem deterioração.
    expect(metricTotal(telemetry.snapshot(), "intensicare.probe.run.total")).toBe(1);
  });

  it("limpa o resíduo sintético mesmo quando o driver lança", async () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    const chamadas: string[] = [];
    const driver: SafetyLoopProbeDriver = {
      ingest: () => {
        chamadas.push("ingest");
        throw new Error("falha do driver");
      },
      evaluate: () => true,
      raiseWorkItem: () => true,
      readProjection: () => true,
      acknowledge: () => true,
      cleanup: () => {
        chamadas.push("cleanup");
      },
    };
    await expect(
      runSyntheticProbe(telemetry, defineSafetyLoopProbe(SUJEITO), driver),
    ).rejects.toThrow("falha do driver");
    expect(chamadas).toEqual(["ingest", "cleanup"]);
  });

  it("não vaza a referência sintética de sujeito na telemetria", async () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    await runSyntheticProbe(telemetry, defineSafetyLoopProbe(SUJEITO), driverFalso());
    const texto = JSON.stringify(telemetry.snapshot());
    expect(texto).not.toContain(SUJEITO);
    expect(texto).not.toContain("SYNTH-SONDA-0001");
    expect(texto).not.toContain("amh:psr");
  });
});

describe("periodicidade sem relógio interno", () => {
  it("seleciona as sondas vencidas a partir do instante recebido", () => {
    const definicao = defineSafetyLoopProbe(SUJEITO);
    const agendas: SyntheticProbeSchedule[] = [
      { definition: definicao, intervalMs: 60_000, lastRunMs: null },
      { definition: definicao, intervalMs: 60_000, lastRunMs: 100_000 },
      { definition: definicao, intervalMs: 60_000, lastRunMs: 10_000 },
    ];
    expect(dueProbes(agendas, 120_000)).toHaveLength(2);
    expect(dueProbes(agendas, 100_000)).toHaveLength(2);
    expect(dueProbes([agendas[1] as SyntheticProbeSchedule], 100_000)).toHaveLength(0);
  });
});
