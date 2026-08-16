/**
 * Testes do kill switch, do rollback e da visibilidade obrigatória da
 * degradação.
 *
 * SOURCE (ADR-0008 §8.3): avaliações de release morto transitam para
 * `not_evaluated` com razão `rule_unavailable`, "jamais no-fire silencioso".
 * SOURCE (ADR-0007 eixo 5): kill switch é primitiva DISTINTA do rollback.
 * SOURCE (§20): nunca ocultar degradação.
 */
import { describe, expect, it } from "vitest";
import {
  createDegradationRegistry,
  DEGRADATION_MODE_IDS,
  DEGRADATION_MODES,
} from "./degradation.js";
import { createInMemoryTelemetry, metricTotal } from "./in-memory.js";
import { createClinicalRuleSwitchboard } from "./kill-switch.js";

const NEWS2 = { ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" };
const NEWS2_ANTERIOR = { ruleId: "RULE-NEWS2", ruleVersion: "0.1.0" };

function novaBancada() {
  const telemetry = createInMemoryTelemetry(() => 1_000);
  const switchboard = createClinicalRuleSwitchboard({ telemetry });
  return { telemetry, switchboard };
}

describe("catálogo de modos degradados", () => {
  it("todo modo tem condição de entrada, comportamento seguro, fallback manual e condição de saída", () => {
    for (const modeId of DEGRADATION_MODE_IDS) {
      const spec = DEGRADATION_MODES[modeId];
      expect(spec.entryCondition.length).toBeGreaterThan(10);
      expect(spec.safeBehavior.length).toBeGreaterThan(10);
      expect(spec.manualFallback.length).toBeGreaterThan(10);
      expect(spec.exitCondition.length).toBeGreaterThan(10);
      expect(spec.uiMessagePt.length).toBeGreaterThan(10);
    }
  });
});

describe("kill switch de regra clínica", () => {
  it("desliga a regra SEM derrubar o sistema e devolve estado explícito", () => {
    const { telemetry, switchboard } = novaBancada();
    switchboard.activate(NEWS2, "SYNTH-ATOR-0001");

    const antes = switchboard.guardEvaluation("RULE-NEWS2", () => "avaliado");
    expect(antes.kind).toBe("evaluated");

    switchboard.kill("RULE-NEWS2", {
      reasonCode: "defeito_de_regra_suspeito",
      actorId: "SYNTH-ATOR-0001",
    });

    // O sistema continua respondendo — nenhuma exceção, nenhum processo caído.
    const depois = switchboard.guardEvaluation("RULE-NEWS2", () => "avaliado");
    expect(depois.kind).toBe("not_evaluated");
    if (depois.kind !== "not_evaluated") throw new Error("estreitamento");
    expect(depois.reason).toBe("rule_unavailable");
    expect(depois.availability.kind).toBe("killed");
    expect(depois.notice.mensagemUi).toContain("Regra clínica indisponível");
    expect(depois.notice.condicaoSaida.length).toBeGreaterThan(10);

    // ... e a avaliação NÃO REALIZADA aparece na série, não some dela.
    expect(
      metricTotal(telemetry.snapshot(), "intensicare.clinical.evaluation.total", {
        status: "not_evaluated",
      }),
    ).toBe(1);
  });

  it("não executa a função de avaliação quando a regra está desligada", () => {
    const { switchboard } = novaBancada();
    switchboard.activate(NEWS2, "SYNTH-ATOR-0001");
    switchboard.kill("RULE-NEWS2", {
      reasonCode: "incidente_de_seguranca",
      actorId: "SYNTH-ATOR-0001",
    });

    let chamadas = 0;
    switchboard.guardEvaluation("RULE-NEWS2", () => {
      chamadas += 1;
      return 1;
    });
    expect(chamadas).toBe(0);
  });

  it("regra nunca registrada é 'unknown' e também não avalia (fail-closed)", () => {
    const { switchboard } = novaBancada();
    const resultado = switchboard.guardEvaluation("RULE-INEXISTENTE", () => "avaliado");
    expect(resultado.kind).toBe("not_evaluated");
  });

  it("rollback é primitiva distinta e a versão de destino volta a avaliar", () => {
    const { switchboard } = novaBancada();
    switchboard.activate(NEWS2, "SYNTH-ATOR-0001");
    const estado = switchboard.rollback("RULE-NEWS2", {
      to: NEWS2_ANTERIOR,
      reasonCode: "evidencia_clinica_retirada",
      actorId: "SYNTH-ATOR-0001",
    });
    expect(estado.kind).toBe("rolled_back");
    const resultado = switchboard.guardEvaluation("RULE-NEWS2", () => "avaliado");
    expect(resultado.kind).toBe("evaluated");
  });

  it("falha de carga de bundle também resolve para não avaliado", () => {
    const { switchboard } = novaBancada();
    switchboard.markLoadFailed(NEWS2);
    const resultado = switchboard.guardEvaluation("RULE-NEWS2", () => "avaliado");
    expect(resultado.kind).toBe("not_evaluated");
  });

  it("razão de desligamento é codificada, nunca texto livre", () => {
    const { switchboard } = novaBancada();
    switchboard.activate(NEWS2, "SYNTH-ATOR-0001");
    const estado = switchboard.kill("RULE-NEWS2", {
      reasonCode: "ordem_do_titular_clinico",
      actorId: "SYNTH-ATOR-0001",
    });
    if (estado.kind !== "killed") throw new Error("estreitamento");
    expect(estado.reasonCode).toBe("ordem_do_titular_clinico");
    expect(estado.actorRef).toMatch(/^op_[0-9a-f]{16}$/);
  });

  it("não vaza o identificador do ator na telemetria", () => {
    const { telemetry, switchboard } = novaBancada();
    switchboard.activate(NEWS2, "SYNTH-ATOR-0001");
    switchboard.kill("RULE-NEWS2", {
      reasonCode: "ensaio_operacional",
      actorId: "SYNTH-ATOR-0001",
    });
    expect(JSON.stringify(telemetry.snapshot())).not.toContain("SYNTH-ATOR-0001");
  });
});

describe("degradação visível, nunca silenciosa", () => {
  it("uma degradação recém-criada conta como NÃO EXIBIDA", () => {
    const { telemetry, switchboard } = novaBancada();
    switchboard.activate(NEWS2, "SYNTH-ATOR-0001");
    switchboard.kill("RULE-NEWS2", {
      reasonCode: "defeito_de_regra_suspeito",
      actorId: "SYNTH-ATOR-0001",
    });

    expect(switchboard.degradation.unsurfaced()).toHaveLength(1);
    expect(metricTotal(telemetry.snapshot(), "intensicare.ops.degradation.unsurfaced")).toBe(1);
    expect(metricTotal(telemetry.snapshot(), "intensicare.ops.degradation.active")).toBe(1);
  });

  it("deixa de contar como silenciosa depois que um canal a exibe", () => {
    const { telemetry, switchboard } = novaBancada();
    switchboard.activate(NEWS2, "SYNTH-ATOR-0001");
    switchboard.kill("RULE-NEWS2", {
      reasonCode: "defeito_de_regra_suspeito",
      actorId: "SYNTH-ATOR-0001",
    });
    const ativa = switchboard.degradation.active()[0];
    if (ativa === undefined) throw new Error("esperava uma degradação ativa");

    expect(switchboard.degradation.markSurfaced(ativa.notice.noticeId, "ui")).toBe(true);
    expect(switchboard.degradation.unsurfaced()).toHaveLength(0);
    expect(metricTotal(telemetry.snapshot(), "intensicare.ops.degradation.unsurfaced")).toBe(0);
    expect(metricTotal(telemetry.snapshot(), "intensicare.ops.degradation.active")).toBe(1);
  });

  it("reativar a regra encerra o modo degradado", () => {
    const { telemetry, switchboard } = novaBancada();
    switchboard.activate(NEWS2, "SYNTH-ATOR-0001");
    switchboard.kill("RULE-NEWS2", {
      reasonCode: "defeito_de_regra_suspeito",
      actorId: "SYNTH-ATOR-0001",
    });
    switchboard.activate(NEWS2, "SYNTH-ATOR-0001");

    expect(switchboard.degradation.active()).toHaveLength(0);
    expect(metricTotal(telemetry.snapshot(), "intensicare.ops.degradation.active")).toBe(0);
    expect(metricTotal(telemetry.snapshot(), "intensicare.ops.degradation.unsurfaced")).toBe(0);
  });

  it("descreve a degradação em pt-BR com condição de saída", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    const registry = createDegradationRegistry({ telemetry });
    registry.enter("outbox_acumulando");
    const descricoes = registry.describePt();
    expect(descricoes).toHaveLength(1);
    expect(descricoes[0]).toContain("Entrega de eventos atrasada");
    expect(descricoes[0]).toContain("saída:");
  });

  it("entrar duas vezes no mesmo modo é idempotente", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    const registry = createDegradationRegistry({ telemetry });
    const a = registry.enter("projecao_atrasada");
    const b = registry.enter("projecao_atrasada");
    expect(a.noticeId).toBe(b.noticeId);
    expect(metricTotal(telemetry.snapshot(), "intensicare.ops.degradation.active")).toBe(1);
  });
});
