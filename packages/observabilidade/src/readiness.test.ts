/**
 * Testes de prontidão como CAPACIDADE SEGURA (prompt §15.3; ADR-0020 O4).
 *
 * SOURCE (ADR-0020 §8, V2): "Readiness falha fechado sem bundle/dependência —
 * teste de prontidão negativo".
 */
import { describe, expect, it } from "vitest";
import type { ActiveDegradation } from "./degradation.js";
import { createInMemoryTelemetry, metricTotal } from "./in-memory.js";
import type { RuleAvailability } from "./kill-switch.js";
import { evaluateReadiness, type ReadinessInput, reportReadiness } from "./readiness.js";

const BUNDLE_ATIVO: RuleAvailability = {
  kind: "active",
  bundle: { ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" },
};

function baseSaudavel(): ReadinessInput {
  return {
    ruleBundles: [BUNDLE_ATIVO],
    dependencies: [{ id: "banco-operacional", required: true, available: true }],
    projections: [{ projection: "grade_leitos", lagMs: 100, limitMs: 5_000 }],
    identityConfigured: true,
    degradations: [],
  };
}

function degradacaoAtiva(surfaced: boolean): ActiveDegradation {
  return {
    notice: {
      noticeId: "DEG-1",
      modeId: "projecao_atrasada",
      domain: "projection",
      sinceMs: 0,
      mensagemUi: "Painel possivelmente desatualizado.",
      comportamentoSeguro: "instante do último fato incorporado é declarado",
      fallbackManual: "consulta autoritativa",
      condicaoSaida: "lag no limite e reconciliação concluída",
    },
    surfacedOn: surfaced ? ["ui"] : [],
  };
}

describe("prontidão", () => {
  it("é 'ready' apenas quando tudo está íntegro E há limite de frescor declarado", () => {
    expect(evaluateReadiness(baseSaudavel()).verdict).toBe("ready");
  });

  it("falha fechado quando o bundle de regra não está disponível", () => {
    const resultado = evaluateReadiness({
      ...baseSaudavel(),
      ruleBundles: [
        {
          kind: "killed",
          bundle: { ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" },
          reasonCode: "defeito_de_regra_suspeito",
          actorRef: "op_0000000000000000",
          sinceMs: 0,
        },
      ],
    });
    expect(resultado.verdict).toBe("not_ready");
    expect(resultado.reasons.map((r) => r.code)).toContain("rule_bundle_unavailable");
  });

  it("falha fechado quando uma dependência obrigatória está indisponível", () => {
    const resultado = evaluateReadiness({
      ...baseSaudavel(),
      dependencies: [{ id: "banco-operacional", required: true, available: false }],
    });
    expect(resultado.verdict).toBe("not_ready");
    expect(resultado.reasons.map((r) => r.code)).toContain("required_dependency_unavailable");
  });

  it("falha fechado sem identidade/chaves configuradas (§15.2)", () => {
    const resultado = evaluateReadiness({ ...baseSaudavel(), identityConfigured: false });
    expect(resultado.verdict).toBe("not_ready");
    expect(resultado.reasons.map((r) => r.code)).toContain("identity_not_configured");
  });

  it("NUNCA declara 'ready' enquanto o limite de frescor for VALIDATION REQUIRED", () => {
    const resultado = evaluateReadiness({
      ...baseSaudavel(),
      projections: [{ projection: "grade_leitos", lagMs: 10, limitMs: null }],
    });
    expect(resultado.verdict).toBe("degraded");
    expect(resultado.reasons.map((r) => r.code)).toContain(
      "projection_freshness_threshold_unvalidated",
    );
  });

  it("degradação ativa e EXIBIDA rebaixa para 'degraded', não bloqueia", () => {
    const resultado = evaluateReadiness({
      ...baseSaudavel(),
      degradations: [degradacaoAtiva(true)],
    });
    expect(resultado.verdict).toBe("degraded");
  });

  it("degradação ativa e NÃO exibida bloqueia — degradação silenciosa é proibida (§20)", () => {
    const resultado = evaluateReadiness({
      ...baseSaudavel(),
      degradations: [degradacaoAtiva(false)],
    });
    expect(resultado.verdict).toBe("not_ready");
    expect(resultado.reasons.map((r) => r.code)).toContain("degradation_unsurfaced");
  });

  it("publica o veredito como métrica, span e log sem texto livre", () => {
    const telemetry = createInMemoryTelemetry(() => 0);
    reportReadiness(telemetry, baseSaudavel());
    const snapshot = telemetry.snapshot();
    expect(
      metricTotal(snapshot, "intensicare.ops.readiness.verdict.total", { verdict: "ready" }),
    ).toBe(1);
    expect(snapshot.spans.map((s) => s.name)).toContain("ops.readiness_check");
    expect(snapshot.logs.map((l) => l.event)).toContain("readiness.evaluated");
  });

  it("razões são códigos fechados — nunca strings improvisadas", () => {
    const resultado = evaluateReadiness({
      ...baseSaudavel(),
      identityConfigured: false,
      dependencies: [{ id: "identidade", required: true, available: false }],
    });
    for (const razao of resultado.reasons) {
      expect(typeof razao.code).toBe("string");
      expect(razao.detalhePt.length).toBeGreaterThan(5);
    }
    expect(resultado.reasons.length).toBeGreaterThanOrEqual(2);
  });
});
