/**
 * Testes unitários de comportamentos não cobertos pelos vetores CRV:
 * transições em tempo de leitura (spec §5.3), conflito de atribuição de
 * escala, supressão de escalonamento (N-3), anotações de sedação (N-4) e de
 * reconfirmação da Escala 2 (N-6), derivação do estado de O2 por fluxo,
 * unidade inmapeável, tempo clínico ausente e precedência de status (P-a).
 */

import { describe, expect, it } from "vitest";
import {
  ESCALATION_SUPPRESSION_REASON_PT,
  evaluateNews2,
  reassessNews2AtReadTime,
  type News2EvaluationInput,
} from "../src/index.js";
import { buildVectorInput, EVAL_TIME } from "./suporte.js";

function minutesAfterEval(minutes: number): string {
  return new Date(Date.parse(EVAL_TIME) + minutes * 60_000).toISOString();
}

describe("NEWS2 — tempo de leitura (spec §5.3; ADR-0008 N5)", () => {
  it("registro válido envelhece para `stale` quando um insumo sai da janela no instante de leitura", () => {
    const record = evaluateNews2(buildVectorInput({}));
    expect(record.status).toBe("valid");
    // Baseline observado 10 min antes da avaliação; janela da FR = 60 min.
    // 70 min após a avaliação, a FR tem 80 min de idade → fora da janela.
    const read = reassessNews2AtReadTime(record, minutesAfterEval(70));
    expect(read.status).toBe("stale");
    expect(read.reasons).toContain("stale_input:rr");
    expect(read.oldestInputAgeMinutes).not.toBeNull();
  });

  it("além do horizonte de expiração, a leitura vira `not_evaluated` com `expired_input`", () => {
    const record = evaluateNews2(buildVectorInput({}));
    const read = reassessNews2AtReadTime(record, minutesAfterEval(8 * 60 + 10));
    expect(read.status).toBe("not_evaluated");
    expect(read.reasons.some((r) => r.startsWith("expired_input:"))).toBe(true);
  });

  it("leitura imediata de registro válido permanece `valid`", () => {
    const record = evaluateNews2(buildVectorInput({}));
    const read = reassessNews2AtReadTime(record, EVAL_TIME);
    expect(read.status).toBe("valid");
    expect(read.reasons).toEqual([]);
  });

  it("registro não-válido não é 'promovido' na leitura (P-7: nenhum consumidor promove status)", () => {
    const record = evaluateNews2(buildVectorInput({ absent: ["rr"] }));
    const read = reassessNews2AtReadTime(record, EVAL_TIME);
    expect(read.status).toBe("not_evaluated");
    expect(read.reasons).toEqual([...record.reasons]);
  });
});

describe("NEWS2 — governança da Escala 2 (spec §3.2)", () => {
  it("atribuições simultâneas contraditórias de escala tornam a SpO2 `invalid` (conflicting_sources)", () => {
    const base = buildVectorInput({});
    const input: News2EvaluationInput = {
      ...base,
      spo2ScaleAssignments: [
        { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: "2026-08-15T10:00:00.000Z" },
        { scale: "scale1", orderedBy: "SYNTH-medico-02", orderedAt: "2026-08-15T11:00:00.000Z" },
      ],
    };
    const record = evaluateNews2(input);
    expect(record.status).toBe("invalid");
    expect(record.reasons).toContain("conflicting_sources:spo2");
    expect(record.totalScore).toBeNull();
  });

  it("atribuição revogada não conta; ordem restante vale", () => {
    const base = buildVectorInput({ values: { spo2: 90 }, o2: "oxygen" });
    const input: News2EvaluationInput = {
      ...base,
      spo2ScaleAssignments: [
        { scale: "scale1", orderedBy: "SYNTH-medico-02", orderedAt: "2026-08-14T10:00:00.000Z", revoked: true },
        { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: "2026-08-15T10:00:00.000Z" },
      ],
    };
    const record = evaluateNews2(input);
    expect(record.status).toBe("valid");
    // Escala 2: SpO2 90 na banda-alvo BTS 88–92 → 0; O2 → 2.
    expect(record.totalScore).toBe(2);
    expect(record.spo2ScaleUsed).toBe("scale2");
  });

  it("ordem de Escala 2 com mais de 7 dias gera anotação de reconfirmação NÃO bloqueante (N-6)", () => {
    const base = buildVectorInput({ values: { spo2: 90 }, o2: "oxygen" });
    const input: News2EvaluationInput = {
      ...base,
      spo2ScaleAssignments: [
        // 8 dias antes da avaliação (2026-08-16T12:00Z).
        { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: "2026-08-08T12:00:00.000Z" },
      ],
    };
    const record = evaluateNews2(input);
    expect(record.status).toBe("valid"); // a ordem NÃO expira sozinha
    expect(record.annotations.some((a) => a.includes("reconfirmação da ordem de Escala 2"))).toBe(true);
  });
});

describe("NEWS2 — anotações e supressão de escalonamento (N-2/N-3/N-4)", () => {
  it("ordem de limitação terapêutica: escore computado; APENAS o escalonamento é suprimido, com razão visível", () => {
    const input: News2EvaluationInput = {
      ...buildVectorInput({ values: { temperature: 35.0 } }),
      treatmentLimitationOrderDocumented: true,
    };
    const record = evaluateNews2(input);
    expect(record.status).toBe("valid");
    expect(record.totalScore).toBe(3); // o número nunca é escondido
    expect(record.riskTier).toBe("low_medium");
    expect(record.escalationSuppressed).toBe(true);
    expect(record.escalationSuppressionReason).toBe(ESCALATION_SUPPRESSION_REASON_PT);
    expect(record.annotations).toContain(ESCALATION_SUPPRESSION_REASON_PT);
  });

  it("insumo de consciência sob sedação carrega anotação de sedação (N-4)", () => {
    const base = buildVectorInput({});
    const observations = base.observations.map((obs) =>
      obs.parameter === "consciousness" ? { ...obs, sedationState: "sedado" as const } : obs,
    );
    const record = evaluateNews2({ ...base, observations });
    expect(record.annotations.some((a) => a.includes("sedado"))).toBe(true);
  });

  it("estado de sedação ausente é anotado como 'não informado' — nunca lido como válido sem qualificação", () => {
    const base = buildVectorInput({});
    const observations = base.observations.map((obs) => {
      if (obs.parameter !== "consciousness") return obs;
      const { sedationState: _drop, ...rest } = obs;
      return rest;
    });
    const record = evaluateNews2({ ...base, observations });
    expect(record.annotations.some((a) => a.includes("não informado"))).toBe(true);
  });

  it("anotação 'gravidez não verificada' presente em resultado válido sem documentação de gravidez", () => {
    const record = evaluateNews2(buildVectorInput({}));
    expect(record.annotations).toContain("gravidez não verificada");
  });
});

describe("NEWS2 — derivação do estado de O2 e integridade de insumos", () => {
  function withO2Flow(flow: number): News2EvaluationInput {
    const base = buildVectorInput({ absent: ["o2_status"] });
    return {
      ...base,
      observations: [
        ...base.observations,
        {
          parameter: "o2_status",
          value: { kind: "quantity", value: flow, unit: "L/min" },
          effectiveTime: "2026-08-16T11:50:00.000Z",
          provenance: { sourceSystem: "SYNTH-ventilador-01", sourceDataQuality: "valid" },
        },
      ],
    };
  }

  it("fluxo de O2 inalado > 0 deriva 'oxygen' (spec §2.1 linha 3)", () => {
    const record = evaluateNews2(withO2Flow(4));
    expect(record.status).toBe("valid");
    const o2 = record.parameters.find((c) => c.parameter === "o2_status");
    expect(o2?.score).toBe(2);
  });

  it("fluxo de O2 igual a 0 deriva 'air' documentado", () => {
    const record = evaluateNews2(withO2Flow(0));
    expect(record.status).toBe("valid");
    const o2 = record.parameters.find((c) => c.parameter === "o2_status");
    expect(o2?.score).toBe(0);
  });

  it("fluxo de O2 negativo é `invalid` (insumo de derivação deve ser não negativo)", () => {
    const record = evaluateNews2(withO2Flow(-1));
    expect(record.status).toBe("invalid");
    expect(record.reasons).toContain("implausible_value:o2_status");
  });

  it("unidade inmapeável torna o parâmetro `invalid` — nunca descartado silenciosamente", () => {
    const base = buildVectorInput({ absent: ["rr"] });
    const record = evaluateNews2({
      ...base,
      observations: [
        ...base.observations,
        {
          parameter: "rr",
          value: { kind: "quantity", value: 16, unit: "irpm" },
          effectiveTime: "2026-08-16T11:50:00.000Z",
          provenance: { sourceSystem: "SYNTH-monitor-01", sourceDataQuality: "valid" },
        },
      ],
    });
    expect(record.status).toBe("invalid");
    expect(record.reasons).toContain("unmappable_unit:rr");
  });

  it("tempo clínico ausente ⇒ `missing_clinical_time` (distinto de ausência de insumo; DOM-0009)", () => {
    const base = buildVectorInput({ absent: ["rr"] });
    const record = evaluateNews2({
      ...base,
      observations: [
        ...base.observations,
        {
          parameter: "rr",
          value: { kind: "quantity", value: 16, unit: "/min" },
          effectiveTime: null,
          provenance: { sourceSystem: "SYNTH-monitor-01", sourceDataQuality: "valid" },
        },
      ],
    });
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toContain("missing_clinical_time:rr");
    expect(record.reasons).not.toContain("missing_required_input:rr");
  });

  it("precedência P-a: `invalid` domina `not_evaluated` quando ambos coexistem", () => {
    const record = evaluateNews2(buildVectorInput({ values: { spo2: 150 }, absent: ["rr"] }));
    expect(record.status).toBe("invalid");
    expect(record.reasons).toContain("implausible_value:spo2");
    expect(record.reasons).toContain("missing_required_input:rr");
    expect(record.totalScore).toBeNull();
  });

  it("conflito de FC além da tolerância ±5 bpm é `invalid`; dentro dela, o pior valor pontua com registro", () => {
    const beyond = evaluateNews2(buildVectorInput({ conflictValues: { pulse: [70, 80] } }));
    expect(beyond.status).toBe("invalid");
    expect(beyond.reasons).toContain("conflicting_sources:pulse");

    const within = evaluateNews2(buildVectorInput({ conflictValues: { pulse: [88, 92] } }));
    expect(within.status).toBe("valid");
    const pulse = within.parameters.find((c) => c.parameter === "pulse");
    // 92 está na banda 91–110 (1 ponto); 88 daria 0 — o pior vigia.
    expect(pulse?.score).toBe(1);
    expect(pulse?.conflictResolution?.chosenValue).toBe(92);
    expect(pulse?.conflictResolution?.candidates).toEqual([88, 92]);
  });

  it("duplicata exata (mesmo valor, mesmo tempo) é deduplicada silenciosamente — não é conflito", () => {
    const record = evaluateNews2(buildVectorInput({ conflictValues: { sbp: [120, 120] } }));
    expect(record.status).toBe("valid");
    const sbp = record.parameters.find((c) => c.parameter === "sbp");
    expect(sbp?.score).toBe(0);
    expect(sbp?.conflictResolution).toBeNull();
  });
});
