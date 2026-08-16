/**
 * Teste de NÃO-VAZAMENTO de PHI e da redação como tipo.
 *
 * SOURCE (ADR-0020 §8, V3): "Telemetria livre de PHI — vetores SYNTH- + CI de
 * conteúdo proibido sobre saídas".
 *
 * Os vetores abaixo são 100% sintéticos e existem apenas para provar que NÃO
 * atravessam. Nenhum dado real foi acessado em nenhum momento.
 */
import { describe, expect, it } from "vitest";
import { createInMemoryTelemetry, serializeSnapshot, type TelemetrySnapshot } from "./in-memory.js";
import { recordEvaluation, recordOutboxDepth, recordPolicyDenial } from "./instrumentation.js";
import {
  assertNoPhiShape,
  count,
  createRedactor,
  durationMs,
  isOpaqueRefShape,
  label,
  TelemetryRedactionError,
} from "./redaction.js";

/** PSR sintético — forma de `portable_subject_ref` com marcador SYNTH-. */
const PSR_SINTETICO = "amh:psr:v1:SYNTH-0001";
/** Identificador sintético de sujeito sem forma de PSR. */
const SUJEITO_SINTETICO = "SYNTH-PACIENTE-0001";
/** Escopo de ordenação sintético do outbox (deriva de encontro, no desenho real). */
const ESCOPO_SINTETICO = "SYNTH-ENCONTRO-0001";

function todoOTexto(snapshot: TelemetrySnapshot): string {
  return serializeSnapshot(snapshot);
}

describe("redação de PHI como tipo", () => {
  it("recusa um PSR sintético em atributo de métrica antes de qualquer gravação", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    expect(() =>
      telemetry.meter.add("intensicare.ops.failure.total", count(1), {
        // Só é possível chegar aqui com asserção de tipo — o `string` cru não
        // é atribuível. A camada de execução recusa mesmo assim.
        category: PSR_SINTETICO as never,
      }),
    ).toThrow(TelemetryRedactionError);
    expect(todoOTexto(telemetry.snapshot())).not.toContain("SYNTH-0001");
  });

  it("recusa identificador sintético de sujeito em atributo de log", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    expect(() =>
      telemetry.logger.emit("warn", "failure.recorded", {
        category: SUJEITO_SINTETICO as never,
      }),
    ).toThrow(TelemetryRedactionError);
    expect(todoOTexto(telemetry.snapshot())).not.toContain(SUJEITO_SINTETICO);
  });

  it("recusa identificador sintético em atributo de span e em evento de span", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    const span = telemetry.tracer.startSpan("clinical.evaluation");
    expect(() => span.setAttribute("status", PSR_SINTETICO as never)).toThrow(
      TelemetryRedactionError,
    );
    expect(() => span.addEvent("valid", { status: SUJEITO_SINTETICO as never })).toThrow(
      TelemetryRedactionError,
    );
    span.end();
    const texto = todoOTexto(telemetry.snapshot());
    expect(texto).not.toContain("SYNTH-0001");
    expect(texto).not.toContain("amh:psr");
  });

  it("recusa chave de atributo reservada a dado clínico bruto", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    for (const chave of ["spo2", "score", "valor", "paciente", "observacao.value"]) {
      expect(() =>
        telemetry.meter.add("intensicare.ops.failure.total", count(1), {
          [chave]: label("ingest_rejected"),
        }),
      ).toThrow(TelemetryRedactionError);
    }
    expect(telemetry.snapshot().counters).toHaveLength(0);
  });

  it("exige referência OPACA em qualquer chave terminada em .ref", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    expect(() =>
      telemetry.meter.add("intensicare.ops.connector.unavailable.total", count(1), {
        "connector.ref": label("valid"),
      }),
    ).toThrow(TelemetryRedactionError);
  });

  it("recusa texto fora do vocabulário fechado mesmo sem forma de PHI", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    expect(() =>
      telemetry.meter.add("intensicare.ops.failure.total", count(1), {
        category: "categoria_inventada" as never,
      }),
    ).toThrow(TelemetryRedactionError);
  });

  it("varre todas as formas conhecidas de identificador", () => {
    // Os vetores com forma de CPF e de e-mail são MONTADOS em tempo de
    // execução, jamais escritos como literal contíguo. Razão: o gate
    // `scripts/check_forbidden_content.py` varre `packages/` e recusaria o
    // literal — corretamente. Enfraquecer aquele gate para acomodar este
    // teste seria trocar uma proteção real por conveniência de teste
    // (proibido explicitamente na mensagem de erro do próprio gate). Esta é
    // a mesma técnica que o gate usa consigo mesmo (`PHI_CANARY`).
    const cpfShaped = `${["123", "456", "789"].join(".")}-00`;
    const emailShaped = ["sintetico", "exemplo.invalido"].join("@");
    const vetores = [
      "amh:psr:v1:SYNTH-abc",
      "SYNTH-PATIENT-77",
      cpfShaped,
      "000000012345678",
      "00000000-0000-4000-8000-000000000000",
      emailShaped,
      "2026-08-16T12:00",
    ];
    for (const vetor of vetores) {
      expect(() => assertNoPhiShape(vetor)).toThrow(TelemetryRedactionError);
    }
  });

  it("nunca ecoa o valor recusado na mensagem do erro", () => {
    try {
      assertNoPhiShape(PSR_SINTETICO, "category");
      throw new Error("deveria ter lançado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(TelemetryRedactionError);
      const mensagem = (erro as Error).message;
      expect(mensagem).not.toContain(PSR_SINTETICO);
      expect(mensagem).not.toContain("SYNTH-0001");
      expect((erro as TelemetryRedactionError).patternId).toBe("portable_subject_ref");
    }
  });
});

describe("pseudonimização", () => {
  it("produz referência opaca que não contém o identificador de origem", () => {
    const redactor = createRedactor({ salt: "sal-de-teste-fixo" });
    const ref = redactor.opaqueRef(PSR_SINTETICO);
    expect(isOpaqueRefShape(ref)).toBe(true);
    expect(ref).not.toContain("SYNTH");
    expect(ref).not.toContain("psr");
    expect(ref).toMatch(/^op_[0-9a-f]{16}$/);
  });

  it("é determinística com o mesmo sal e diferente com sal diferente", () => {
    const a = createRedactor({ salt: "sal-a" });
    const b = createRedactor({ salt: "sal-b" });
    expect(a.opaqueRef(PSR_SINTETICO)).toBe(a.opaqueRef(PSR_SINTETICO));
    expect(a.opaqueRef(PSR_SINTETICO)).not.toBe(b.opaqueRef(PSR_SINTETICO));
  });
});

describe("caminho feliz: nada do identificador sintético atravessa a telemetria", () => {
  it("uma sessão completa de instrumentação não contém nenhum vetor sintético", () => {
    const telemetry = createInMemoryTelemetry(() => 1_000);

    recordEvaluation(telemetry, {
      ruleId: "RULE-NEWS2",
      ruleVersion: "0.2.0",
      status: "not_evaluated",
      durationMs: 12,
      missingParameters: ["FR", "SpO2"],
    });
    recordOutboxDepth(telemetry, ESCOPO_SINTETICO, 3);
    recordPolicyDenial(telemetry, "cross_tenant", "SYNTH-TENANT-0001");

    const texto = todoOTexto(telemetry.snapshot());
    for (const vetor of [PSR_SINTETICO, SUJEITO_SINTETICO, ESCOPO_SINTETICO, "SYNTH-TENANT-0001"]) {
      expect(texto).not.toContain(vetor);
    }
    // Nem sequer o prefixo do marcador sintético sobrevive.
    expect(texto).not.toContain("SYNTH-");
    // ... mas a métrica FOI emitida (o teste não passa por telemetria vazia).
    expect(telemetry.snapshot().counters.length).toBeGreaterThan(0);
    expect(telemetry.snapshot().histograms.length).toBeGreaterThan(0);
  });
});

describe("construtores de medida", () => {
  it("recusa duração negativa ou não finita", () => {
    expect(() => durationMs(-1)).toThrow(TelemetryRedactionError);
    expect(() => durationMs(Number.NaN)).toThrow(TelemetryRedactionError);
    expect(durationMs(0)).toBe(0);
  });

  it("recusa contagem fracionária", () => {
    expect(() => count(1.5)).toThrow(TelemetryRedactionError);
    expect(count(-2)).toBe(-2);
  });

  it("recusa rótulo não registrado mesmo por asserção de tipo", () => {
    expect(() => label("nao_registrado" as never)).toThrow(TelemetryRedactionError);
  });
});

/**
 * Asserções de TEMPO DE COMPILAÇÃO. Cada `@ts-expect-error` abaixo falha o
 * `pnpm typecheck` se o erro esperado deixar de existir — é assim que "a
 * redação é um tipo" fica verificada, e não apenas afirmada em comentário.
 */
describe("barreira de tipo (verificada pelo typecheck, não em execução)", () => {
  it("não aceita string crua, número cru, métrica não catalogada nem instrumento errado", () => {
    const telemetry = createInMemoryTelemetry(() => 0);

    // @ts-expect-error — string crua não é atribuível a TelemetryAttributeValue
    telemetry.meter.add("intensicare.ops.failure.total", count(1), { category: "ingest_rejected" });

    // @ts-expect-error — número cru não é atribuível a SafeCount
    telemetry.meter.add("intensicare.ops.failure.total", 1);

    // @ts-expect-error — nome de métrica fora do catálogo
    telemetry.meter.add("intensicare.metrica.inventada", count(1));

    // @ts-expect-error — `add` só aceita instrumento `counter`, não histograma
    telemetry.meter.add("intensicare.clinical.evaluation.duration", count(1));

    // @ts-expect-error — nome de span fora do catálogo
    telemetry.tracer.startSpan("span.inventado");

    // @ts-expect-error — evento de log fora do catálogo
    telemetry.logger.emit("info", "evento.inventado");

    expect(telemetry.snapshot()).toBeDefined();
  });
});
