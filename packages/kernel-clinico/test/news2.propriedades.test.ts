/**
 * Testes de propriedade (fast-check) do avaliador NEWS2:
 * - determinismo/idempotência (mesma entrada ⇒ mesmo registro; QAS-0020/DOM-0003);
 * - invariância a permutação de observações;
 * - sonda de insumo ausente como propriedade (SAF-0002/HAZ-0005): remover
 *   qualquer insumo obrigatório NUNCA produz `valid` nem total numérico;
 * - irrepresentabilidade: total/tier só existem sob `valid` (ADR-0008 D1);
 * - limites de banda contra oráculo transcrito independentemente da
 *   implementação (reference-vectors.md §2.4/§2.5);
 * - monotonicidade onde a spec define (SpO2 Escala 1 e Escala 2 em ar:
 *   pontuação não crescente com a saturação);
 * - empate de arredondamento para a banda MAIS ANORMAL (N-7);
 * - bordas de janela/expiração de atualidade (spec §2.1);
 * - total = soma das contribuições; tier consistente com (total, vermelho).
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  evaluateNews2,
  NEWS2_PARAMETER_ORDER,
  type News2EvaluationInput,
  type News2ParameterId,
} from "../src/index.js";
import { buildVectorInput, EVAL_TIME, type VectorDelta } from "./suporte.js";

// ---------------------------------------------------------------------------
// Oráculos de banda — transcritos das tabelas de fronteira do documento de
// vetores (§2.4/§2.5), independentes das tabelas em src/.
// ---------------------------------------------------------------------------
function oracleRr(v: number): number {
  return v <= 8 ? 3 : v <= 11 ? 1 : v <= 20 ? 0 : v <= 24 ? 2 : 3;
}
function oracleSpo2Scale1(v: number): number {
  return v <= 91 ? 3 : v <= 93 ? 2 : v <= 95 ? 1 : 0;
}
function oracleSpo2Scale2Air(v: number): number {
  return v <= 83 ? 3 : v <= 85 ? 2 : v <= 87 ? 1 : 0;
}
function oracleSbp(v: number): number {
  return v <= 90 ? 3 : v <= 100 ? 2 : v <= 110 ? 1 : v <= 219 ? 0 : 3;
}
function oraclePulse(v: number): number {
  return v <= 40 ? 3 : v <= 50 ? 1 : v <= 90 ? 0 : v <= 110 ? 1 : v <= 130 ? 2 : 3;
}
function oracleTemperatureDeci(v: number): number {
  return v <= 350 ? 3 : v <= 360 ? 1 : v <= 380 ? 0 : v <= 390 ? 1 : 2;
}

function paramScore(input: News2EvaluationInput, parameter: News2ParameterId): number | null {
  const record = evaluateNews2(input);
  const contribution = record.parameters.find((c) => c.parameter === parameter);
  return contribution?.score ?? null;
}

// Gerador de deltas plausíveis e íntegros (todos os insumos presentes, dentro
// da janela) — usado como ponto de partida das propriedades.
const arbCompleteDelta: fc.Arbitrary<VectorDelta> = fc.record({
  values: fc.record({
    rr: fc.integer({ min: 0, max: 80 }),
    spo2: fc.integer({ min: 40, max: 100 }),
    sbp: fc.integer({ min: 30, max: 300 }),
    pulse: fc.integer({ min: 10, max: 300 }),
    temperature: fc.integer({ min: 250, max: 450 }).map((d) => d / 10),
  }),
  o2: fc.constantFrom("air" as const, "oxygen" as const),
  consciousness: fc.constantFrom("A", "C", "V", "P", "U"),
  scale2Order: fc.boolean(),
});

// Gerador de deltas arbitrários, incluindo ausências, valores implausíveis,
// tokens inválidos, staleness e quarentena.
const arbAnyDelta: fc.Arbitrary<VectorDelta> = fc.record(
  {
    values: fc.record(
      {
        rr: fc.oneof(fc.integer({ min: -10, max: 120 }), fc.constant(16)),
        spo2: fc.oneof(fc.integer({ min: 0, max: 160 }), fc.constant(97)),
        sbp: fc.oneof(fc.integer({ min: 0, max: 400 }), fc.constant(120)),
        pulse: fc.oneof(fc.integer({ min: 0, max: 400 }), fc.constant(70)),
        temperature: fc.oneof(
          fc.integer({ min: 200, max: 500 }).map((d) => d / 10),
          fc.constant(37.0),
        ),
      },
      { requiredKeys: [] },
    ),
    absent: fc.uniqueArray(fc.constantFrom(...NEWS2_PARAMETER_ORDER), { maxLength: 7 }),
    observedMinutesBefore: fc.record(
      {
        rr: fc.integer({ min: 0, max: 700 }),
        temperature: fc.integer({ min: 0, max: 2000 }),
      },
      { requiredKeys: [] },
    ),
    consciousness: fc.constantFrom("A", "C", "V", "P", "U", "SEDATED", "x"),
    o2: fc.constantFrom("air" as const, "oxygen" as const),
    scale2Order: fc.boolean(),
    age: fc.oneof(fc.integer({ min: 0, max: 110 }), fc.constant("unknown" as const)),
    pregnancy: fc.constantFrom("documented" as const, "not_documented" as const),
    quarantined: fc.uniqueArray(fc.constantFrom(...NEWS2_PARAMETER_ORDER), { maxLength: 2 }),
  },
  { requiredKeys: [] },
);

describe("NEWS2 — propriedades (fast-check)", () => {
  it("determinismo: mesma entrada ⇒ mesmo registro, byte a byte", () => {
    fc.assert(
      fc.property(arbAnyDelta, (delta) => {
        const input = buildVectorInput(delta);
        const a = evaluateNews2(input);
        const b = evaluateNews2(input);
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      }),
    );
  });

  it("invariância a permutação da ordem das observações", () => {
    fc.assert(
      fc.property(
        arbAnyDelta,
        fc.array(fc.nat(), { minLength: 7, maxLength: 7 }),
        (delta, seeds) => {
          const input = buildVectorInput(delta);
          // Permutação determinística derivada dos seeds gerados.
          const shuffled = [...input.observations]
            .map((obs, i) => ({ obs, key: (seeds[i % seeds.length] ?? 0) * 31 + i * 17 }))
            .sort((a, b) => (a.key % 7) - (b.key % 7) || a.key - b.key)
            .map((x) => x.obs);
          const a = evaluateNews2(input);
          const b = evaluateNews2({ ...input, observations: shuffled });
          expect(JSON.stringify(a)).toBe(JSON.stringify(b));
        },
      ),
    );
  });

  it("sonda de insumo ausente (SAF-0002/HAZ-0005): remover qualquer insumo obrigatório NUNCA deixa `valid` nem produz total", () => {
    fc.assert(
      fc.property(arbCompleteDelta, fc.constantFrom(...NEWS2_PARAMETER_ORDER), (delta, removed) => {
        const input = buildVectorInput({ ...delta, absent: [removed] });
        const record = evaluateNews2(input);
        expect(record.status).not.toBe("valid");
        expect(record.totalScore).toBeNull();
        expect(record.riskTier).toBeNull();
        expect(record.reasons).toContain(`missing_required_input:${removed}`);
        expect(record.missingInputs).toContain(removed);
      }),
    );
  });

  it("irrepresentabilidade: total e tier existem SOMENTE sob status `valid`; não-válido sempre tem razão", () => {
    fc.assert(
      fc.property(arbAnyDelta, (delta) => {
        const record = evaluateNews2(buildVectorInput(delta));
        if (record.status === "valid") {
          expect(record.totalScore).not.toBeNull();
          expect(record.riskTier).not.toBeNull();
        } else {
          expect(record.totalScore).toBeNull();
          expect(record.riskTier).toBeNull();
          expect(record.reasons.length).toBeGreaterThan(0);
        }
      }),
    );
  });

  it("bandas contra oráculo independente: FR, PAS, FC, T e SpO2 Escala 1 em toda a faixa plausível", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 80 }),
        fc.integer({ min: 40, max: 100 }),
        fc.integer({ min: 30, max: 300 }),
        fc.integer({ min: 10, max: 300 }),
        fc.integer({ min: 250, max: 450 }),
        (rr, spo2, sbp, pulse, tempDeci) => {
          const input = buildVectorInput({
            values: { rr, spo2, sbp, pulse, temperature: tempDeci / 10 },
          });
          expect(paramScore(input, "rr")).toBe(oracleRr(rr));
          expect(paramScore(input, "spo2")).toBe(oracleSpo2Scale1(spo2));
          expect(paramScore(input, "sbp")).toBe(oracleSbp(sbp));
          expect(paramScore(input, "pulse")).toBe(oraclePulse(pulse));
          expect(paramScore(input, "temperature")).toBe(oracleTemperatureDeci(tempDeci));
        },
      ),
    );
  });

  it("bandas Escala 2 em ar contra oráculo independente (≤92 independe de O2; ≥93 em ar = 0)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 40, max: 100 }), (spo2) => {
        const input = buildVectorInput({ scale2Order: true, values: { spo2 }, o2: "air" });
        expect(paramScore(input, "spo2")).toBe(oracleSpo2Scale2Air(spo2));
      }),
    );
  });

  it("monotonicidade (spec §4.1): SpO2 Escala 1 e Escala 2 em ar têm pontuação não crescente com a saturação", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 40, max: 100 }),
        fc.integer({ min: 40, max: 100 }),
        fc.boolean(),
        (a, b, scale2) => {
          const lo = Math.min(a, b);
          const hi = Math.max(a, b);
          const delta = scale2 ? { scale2Order: true, o2: "air" as const } : {};
          const scoreLo = paramScore(buildVectorInput({ ...delta, values: { spo2: lo } }), "spo2");
          const scoreHi = paramScore(buildVectorInput({ ...delta, values: { spo2: hi } }), "spo2");
          expect(scoreLo).not.toBeNull();
          expect(scoreHi).not.toBeNull();
          expect(scoreLo as number).toBeGreaterThanOrEqual(scoreHi as number);
        },
      ),
    );
  });

  it("empate de arredondamento (N-7): meio-passo exato de temperatura resolve para a banda MAIS ANORMAL", () => {
    fc.assert(
      fc.property(fc.integer({ min: 250, max: 449 }), (deci) => {
        // valor no meio-passo exato entre deci e deci+1 (em deci-graus): (2*deci+1)/20 °C
        const halfStep = (2 * deci + 1) / 20;
        const input = buildVectorInput({ values: { temperature: halfStep } });
        const expected = Math.max(oracleTemperatureDeci(deci), oracleTemperatureDeci(deci + 1));
        expect(paramScore(input, "temperature")).toBe(expected);
      }),
    );
  });

  it("bordas de atualidade da FR: ≤60 min contribui; 61–480 min ⇒ stale_input; >480 min ⇒ expired_input", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 700 }), (minutes) => {
        const record = evaluateNews2(buildVectorInput({ observedMinutesBefore: { rr: minutes } }));
        if (minutes <= 60) {
          expect(record.status).toBe("valid");
        } else if (minutes <= 480) {
          expect(record.status).toBe("not_evaluated");
          expect(record.reasons).toContain("stale_input:rr");
        } else {
          expect(record.status).toBe("not_evaluated");
          expect(record.reasons).toContain("expired_input:rr");
        }
      }),
    );
  });

  it("total = soma das 7 contribuições; tier consistente com (total, parâmetro vermelho); faixa 0..20", () => {
    fc.assert(
      fc.property(arbCompleteDelta, (delta) => {
        const record = evaluateNews2(buildVectorInput(delta));
        // Entradas completas e plausíveis: Escala 2 ≥93 requer O2, que está sempre
        // presente aqui — o resultado deve ser `valid`.
        expect(record.status).toBe("valid");
        const scores = record.parameters.map((c) => c.score);
        expect(scores.every((s) => s !== null)).toBe(true);
        const sum = (scores as number[]).reduce((x, y) => x + y, 0);
        expect(record.totalScore).toBe(sum);
        expect(sum).toBeGreaterThanOrEqual(0);
        expect(sum).toBeLessThanOrEqual(20);
        const red = (scores as number[]).some((s) => s === 3);
        expect(record.redParameter).toBe(red);
        const expectedTier = sum >= 7 ? "high" : sum >= 5 ? "medium" : red ? "low_medium" : "low";
        expect(record.riskTier).toBe(expectedTier);
        expect(record.fires).toBe(expectedTier !== "low");
        // O tempo da avaliação nunca é inventado: ecoa o parâmetro de entrada.
        expect(record.evaluationTime).toBe(EVAL_TIME);
      }),
    );
  });
});
