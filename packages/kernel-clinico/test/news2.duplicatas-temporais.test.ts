/**
 * Correção 2 da revisão única SPR-G7-2 — comportamento com timestamps
 * PRÓXIMOS-PORÉM-DISTINTOS.
 *
 * A premissa registrada (README do pacote; news2.ts topo) é: entre
 * observações seriadas do mesmo parâmetro vale o tempo clínico mais
 * recente; "mesmo tempo clínico" (spec §2.3) é operacionalizado como
 * `effectiveTime` IDÊNTICO. Estes testes DEMONSTRAM as consequências
 * dessa premissa — inclusive a de que valores muito divergentes com
 * segundos de diferença NÃO são tratados como conflito (o mais recente
 * vence sozinho). A premissa é MANTIDA nesta correção; a proposta de
 * janela de sobreposição temporal por parâmetro (VALIDATION REQUIRED —
 * ratificação clínica futura) está registrada no README do pacote, seção
 * "Proposta para ratificação clínica".
 *
 * Dados 100% sintéticos. Nenhuma alegação de efetividade clínica.
 */
import { describe, expect, it } from "vitest";
import { evaluateNews2 } from "../src/index.js";
import { buildVectorInput, EVAL_TIME } from "./suporte.js";
import type { ObservationInput } from "../src/index.js";

const EVAL_TIME_MS = Date.parse(EVAL_TIME);

function pulseObs(value: number, secondsBefore: number): ObservationInput {
  return {
    parameter: "pulse",
    value: { kind: "quantity", value, unit: "/min" },
    effectiveTime: new Date(EVAL_TIME_MS - secondsBefore * 1000).toISOString(),
    provenance: { sourceSystem: "SYNTH-monitor-01", sourceDataQuality: "valid" },
  };
}

function inputWithExtraPulse(extra: readonly ObservationInput[]) {
  const base = buildVectorInput({ absent: ["pulse"] });
  return { ...base, observations: [...base.observations, ...extra] };
}

describe("duplicatas temporais — premissa 'mesmo tempo clínico = effectiveTime idêntico'", () => {
  it("effectiveTime IDÊNTICO com divergência ALÉM da tolerância => invalid (conflito real)", () => {
    const record = evaluateNews2(inputWithExtraPulse([pulseObs(70, 600), pulseObs(120, 600)]));
    expect(record.status).toBe("invalid");
    expect(record.reasons).toContain("conflicting_sources:pulse");
    expect(record.totalScore).toBeNull();
  });

  it("effectiveTime IDÊNTICO com divergência DENTRO da tolerância (±5) => pior valor pontua, com registro", () => {
    // 88 e 92: mesmo instante, spread 4 <= tolerância 5 do pulso (N-10).
    // 92 está na banda 1 (91–110), 88 na banda 0 — o PIOR (92) pontua.
    const record = evaluateNews2(inputWithExtraPulse([pulseObs(88, 600), pulseObs(92, 600)]));
    expect(record.status).toBe("valid");
    const pulse = record.parameters.find((p) => p.parameter === "pulse");
    expect(pulse?.conflictResolution).not.toBeNull();
    expect(pulse?.conflictResolution?.chosenValue).toBe(92);
    expect(pulse?.score).toBe(1);
  });

  it("timestamps PRÓXIMOS-PORÉM-DISTINTOS (1 s de diferença): o mais recente vence SOZINHO — sem conflito, mesmo dentro da tolerância", () => {
    // 70 (600 s antes) e 74 (599 s antes): spread 4 estaria dentro da
    // tolerância SE fossem simultâneos — mas não são; só o 74 conta.
    const record = evaluateNews2(inputWithExtraPulse([pulseObs(70, 600), pulseObs(74, 599)]));
    expect(record.status).toBe("valid");
    const pulse = record.parameters.find((p) => p.parameter === "pulse");
    expect(pulse?.conflictResolution).toBeNull();
    expect(pulse?.valueUsed).toEqual({ kind: "quantity", value: 74, unit: "/min" });
  });

  it("timestamps PRÓXIMOS-PORÉM-DISTINTOS com divergência GRANDE (1 s, 70 vs 135): NÃO é conflito sob a premissa — o mais recente vence e pontua alto", () => {
    // Consequência documentada da premissa (e insumo da proposta de janela
    // de sobreposição no README): a 1 s de distância, 70→135 não dispara
    // `conflicting_sources` — o mais recente (135, banda 3) pontua sozinho.
    // Fail-open para vigilância (valor mais anormal vence), nunca para
    // tranquilidade — mas a ordem inversa (135 depois 70) daria 0 pontos,
    // e é exatamente essa assimetria que a ratificação clínica deve julgar.
    const record = evaluateNews2(inputWithExtraPulse([pulseObs(70, 600), pulseObs(135, 599)]));
    expect(record.status).toBe("valid");
    const pulse = record.parameters.find((p) => p.parameter === "pulse");
    expect(pulse?.conflictResolution).toBeNull();
    expect(pulse?.score).toBe(3);
    expect(record.redParameter).toBe(true);
  });

  it("ordem inversa do caso anterior (valor alto ANTES, normal 1 s DEPOIS): o normal vence — consequência a ratificar", () => {
    const record = evaluateNews2(inputWithExtraPulse([pulseObs(135, 600), pulseObs(70, 599)]));
    expect(record.status).toBe("valid");
    const pulse = record.parameters.find((p) => p.parameter === "pulse");
    expect(pulse?.score).toBe(0);
    // A observação de 135 NÃO é descartada do registro de entrada — ela
    // simplesmente não é a mais recente; a explicação por parâmetro
    // continua reconstruível a partir do insumo bruto persistido.
  });
});
