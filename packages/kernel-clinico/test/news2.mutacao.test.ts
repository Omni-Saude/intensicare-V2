/**
 * Testes de morte de mutantes (§14 do orquestrador; pendência PRE-08).
 *
 * Cada bloco abaixo existe porque a análise de mutação (Stryker, alvo
 * `src/news2.ts`) exibiu um mutante SOBREVIVENTE — isto é, uma alteração no
 * kernel de segurança que a suíte de 130 testes anteriores não detectava.
 * Nenhum teste aqui altera o código de produção: eles apenas fecham o vão de
 * observabilidade da suíte sobre limiares de banda, comparadores de fronteira,
 * sinais aritméticos, ramos fail-closed e o TEXTO obrigatório de explicação
 * (spec §7 — o texto é contrato de segurança, não cosmético: é o que impede a
 * ausência de escore de ser lida como tranquilidade).
 *
 * Convenções: dados 100% sintéticos (prefixo "SYNTH-"); instante de avaliação
 * fixo; nenhuma leitura de relógio. As comparações de texto são LITERAIS de
 * propósito — comparar contra a constante exportada não detectaria a mutação
 * da própria constante.
 */

import { describe, expect, it } from "vitest";
import {
  type EvaluationRecord,
  evaluateNews2,
  evaluatePopulationGate,
  type News2EvaluationInput,
  type News2ParameterId,
  type ObservationInput,
  reassessNews2AtReadTime,
  roundToChartUnits,
  type SedationState,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Construtores sintéticos
// ---------------------------------------------------------------------------

const EVAL = "2026-08-16T12:00:00.000Z";
const EVAL_MS = Date.parse(EVAL);
const T10 = "2026-08-16T11:50:00.000Z";

/** Instante ISO `minutes` minutos ANTES da avaliação. */
function before(minutes: number): string {
  return new Date(EVAL_MS - minutes * 60_000).toISOString();
}

/** Instante ISO `minutes` minutos DEPOIS da avaliação (tempo de leitura). */
function after(minutes: number): string {
  return new Date(EVAL_MS + minutes * 60_000).toISOString();
}

const PROVENANCE = { sourceSystem: "SYNTH-monitor-01", sourceDataQuality: "valid" } as const;

function quantity(
  parameter: News2ParameterId,
  value: number,
  unit: string,
  minutesBefore = 10,
): ObservationInput {
  return {
    parameter,
    value: { kind: "quantity", value, unit },
    effectiveTime: before(minutesBefore),
    provenance: PROVENANCE,
  };
}

function coded(
  parameter: News2ParameterId,
  code: string,
  minutesBefore = 10,
  sedationState?: SedationState,
): ObservationInput {
  return {
    parameter,
    value: { kind: "code", code },
    effectiveTime: before(minutesBefore),
    provenance: PROVENANCE,
    ...(sedationState === undefined ? {} : { sedationState }),
  };
}

/** Perfil baseline totalmente normal (total 0), observado 10 min antes. */
function baselineObservations(): ObservationInput[] {
  return [
    quantity("rr", 16, "/min"),
    quantity("spo2", 97, "%"),
    coded("o2_status", "air"),
    quantity("sbp", 120, "mm[Hg]"),
    quantity("pulse", 70, "/min"),
    coded("consciousness", "A", 10, "nao_sedado"),
    quantity("temperature", 37.0, "Cel"),
  ];
}

function evaluationInput(overrides: Partial<News2EvaluationInput> = {}): News2EvaluationInput {
  return {
    evaluationTime: EVAL,
    age: { kind: "verified", years: 45 },
    pregnancy: "not_documented",
    observations: baselineObservations(),
    ...overrides,
  };
}

/** Baseline com o parâmetro substituído (ou removido, se `replacement` for null). */
function replacing(
  parameter: News2ParameterId,
  replacement: ObservationInput | readonly ObservationInput[] | null,
): ObservationInput[] {
  const kept = baselineObservations().filter((o) => o.parameter !== parameter);
  if (replacement === null) return kept;
  return [
    ...kept,
    ...(Array.isArray(replacement) ? replacement : [replacement as ObservationInput]),
  ];
}

function contributionOf(record: EvaluationRecord, parameter: News2ParameterId) {
  const found = record.parameters.find((c) => c.parameter === parameter);
  expect(found, `contribuição de ${parameter}`).toBeDefined();
  return found as NonNullable<typeof found>;
}

// ---------------------------------------------------------------------------
// 1. Arredondamento de chart (N-7): fronteira, meio-passo e sinal aritmético
// ---------------------------------------------------------------------------

describe("N-7 — arredondamento à resolução de chart (mutantes de fronteira e de sinal)", () => {
  it("fração abaixo do meio-passo arredonda para BAIXO (FR 20,4 ⇒ 20, 0 ponto)", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", 20.4, "/min")) }),
    );
    const rr = contributionOf(record, "rr");
    expect(rr.valueUsed).toEqual({ kind: "quantity", value: 20, unit: "/min" });
    expect(rr.score).toBe(0);
  });

  it("fração acima do meio-passo arredonda para CIMA (FR 20,6 ⇒ 21, 2 pontos)", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", 20.6, "/min")) }),
    );
    const rr = contributionOf(record, "rr");
    expect(rr.valueUsed).toEqual({ kind: "quantity", value: 21, unit: "/min" });
    expect(rr.score).toBe(2);
  });

  it("meio-passo exato com bandas de MESMA pontuação resolve para o limite superior (FR 16,5 ⇒ 17)", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", 16.5, "/min")) }),
    );
    const rr = contributionOf(record, "rr");
    expect(rr.valueUsed).toEqual({ kind: "quantity", value: 17, unit: "/min" });
    expect(rr.score).toBe(0);
  });

  it("meio-passo exato resolve para a banda MAIS ANORMAL, ainda que seja o limite INFERIOR (SpO2 93,5 ⇒ 93, 2 pontos)", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("spo2", quantity("spo2", 93.5, "%")) }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.valueUsed).toEqual({ kind: "quantity", value: 93, unit: "%" });
    expect(spo2.score).toBe(2);
    expect(record.totalScore).toBe(2);
  });

  it("temperatura opera em resolução de 0,1 °C e é EXIBIDA em graus (38,05 ⇒ 38,1 °C, 1 ponto)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("temperature", quantity("temperature", 38.05, "Cel")),
      }),
    );
    const temperature = contributionOf(record, "temperature");
    expect(temperature.valueUsed).toEqual({ kind: "quantity", value: 38.1, unit: "Cel" });
    expect(temperature.score).toBe(1);
    expect(temperature.explanation).toBe("temperatura (T): 38.1 Cel → 1 ponto(s).");
  });

  it("roundToChartUnits é total e determinístico nas três regiões (abaixo, meio-passo, acima)", () => {
    const scoreOfChartUnit = (unit: number): number => (unit >= 21 ? 2 : 0);
    expect(roundToChartUnits(20.4, 1, scoreOfChartUnit)).toBe(20);
    expect(roundToChartUnits(20.5, 1, scoreOfChartUnit)).toBe(21);
    expect(roundToChartUnits(20.6, 1, scoreOfChartUnit)).toBe(21);
    expect(roundToChartUnits(20, 1, scoreOfChartUnit)).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// 2. Escala 2 de SpO2 (spec §3.3) — inclusive o defeito legado D-1
// ---------------------------------------------------------------------------

describe("spec §3.3 — Escala 2 de SpO2 sob governança de ordem clínica", () => {
  const scale2Order = [
    { scale: "scale2" as const, orderedBy: "SYNTH-medico-01", orderedAt: before(120) },
  ];

  it("região ≥93 sem estado de O2 NÃO pontua: SpO2 íntegra com score null e escala não declarada", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", null).filter((o) => o.parameter !== "spo2"),
          quantity("spo2", 95, "%"),
        ],
        spo2ScaleAssignments: scale2Order,
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.status).toBe("valid");
    expect(spo2.score).toBeNull();
    expect(spo2.valueUsed).toEqual({ kind: "quantity", value: 95, unit: "%" });
    expect(spo2.explanation).toBe(
      "saturação de oxigênio (SpO2): 95 % na Escala 2, região ≥93 — requer estado ar/oxigênio para pontuar; estado de O2 indisponível.",
    );
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["missing_required_input:o2_status"]);
    expect(record.spo2ScaleUsed).toBeNull();
    expect(record.totalScore).toBeNull();
  });

  it("região ≥93 sem estado de O2 também com meio-passo: arredonda pela Escala 2 e não pontua (93,5 ⇒ 94)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", null).filter((o) => o.parameter !== "spo2"),
          quantity("spo2", 93.5, "%"),
        ],
        spo2ScaleAssignments: scale2Order,
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.valueUsed).toEqual({ kind: "quantity", value: 94, unit: "%" });
    expect(spo2.score).toBeNull();
  });

  it("meio-passo na Escala 2 usa a MÉTRICA DA ESCALA 2 (93,5 em oxigênio ⇒ 94, não 93)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", coded("o2_status", "oxygen")).filter(
            (o) => o.parameter !== "spo2",
          ),
          quantity("spo2", 93.5, "%"),
        ],
        spo2ScaleAssignments: scale2Order,
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.valueUsed).toEqual({ kind: "quantity", value: 94, unit: "%" });
    expect(spo2.score).toBe(1);
  });

  it("SpO2 95 em oxigênio na Escala 2 pontua 2, com texto de escala e anotação de ordem (N-6)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", coded("o2_status", "oxygen")).filter(
            (o) => o.parameter !== "spo2",
          ),
          quantity("spo2", 95, "%"),
        ],
        spo2ScaleAssignments: scale2Order,
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.score).toBe(2);
    expect(spo2.explanation).toBe(
      "saturação de oxigênio (SpO2): 95 % (Escala 2, decisão clínica documentada) → 2 ponto(s).",
    );
    expect(record.spo2ScaleUsed).toBe("scale2");
    expect(record.annotations).toContain(
      "SpO2 pontuada na Escala 2 — ordem clínica documentada de 2026-08-16T10:00:00.000Z (autoria: SYNTH-medico-01)",
    );
    // Ordem recente: NENHUMA anotação de reconfirmação de 7 dias.
    expect(record.annotations.some((a) => a.includes("reconfirmação"))).toBe(false);
    expect(record.explanation).toContain(
      "SpO2 pontuada na Escala 2 (decisão clínica documentada, 2026-08-16T10:00:00.000Z). Regra RULE-NEWS2 v0.2.0.",
    );
  });

  it("bandas baixas da Escala 2 valem INDEPENDENTEMENTE do estado de O2 (regressão do defeito legado D-1)", () => {
    for (const [value, expected] of [
      [83, 3],
      [85, 2],
      [87, 1],
      [92, 0],
    ] as const) {
      const record = evaluateNews2(
        evaluationInput({
          observations: [
            ...replacing("o2_status", coded("o2_status", "oxygen")).filter(
              (o) => o.parameter !== "spo2",
            ),
            quantity("spo2", value, "%"),
          ],
          spo2ScaleAssignments: scale2Order,
        }),
      );
      expect(contributionOf(record, "spo2").score, `SpO2 ${value} na Escala 2`).toBe(expected);
    }
  });

  it("ordem de Escala 2 com EXATAMENTE 7 dias ainda não pede reconfirmação (fronteira do ciclo N-6)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("spo2", quantity("spo2", 90, "%")),
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: before(7 * 24 * 60) },
        ],
      }),
    );
    expect(record.annotations.some((a) => a.includes("reconfirmação"))).toBe(false);
  });

  it("ordem de Escala 2 com mais de 7 dias pede reconfirmação com o texto obrigatório e NÃO bloqueia", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("spo2", quantity("spo2", 90, "%")),
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: before(8 * 24 * 60) },
        ],
      }),
    );
    expect(record.status).toBe("valid");
    expect(record.annotations).toContain(
      "reconfirmação da ordem de Escala 2 solicitada (ciclo de 7 dias) — não bloqueante; a ordem não expira sozinha (N-6)",
    );
  });

  it("conflito de escala invalida SOMENTE a SpO2 e não produz anotação de Escala 2", () => {
    const record = evaluateNews2(
      evaluationInput({
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: before(120) },
          { scale: "scale1", orderedBy: "SYNTH-medico-02", orderedAt: before(60) },
        ],
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.status).toBe("invalid");
    expect(spo2.reason).toBe("conflicting_sources:spo2");
    expect(spo2.effectiveTime).toBe(T10);
    expect(spo2.explanation).toBe(
      "atribuições simultâneas contraditórias de escala de SpO2 (scale1 vs scale2) sem revogação — parâmetro inválido até resolução clínica.",
    );
    // Nenhum OUTRO parâmetro é contaminado pelo conflito de escala.
    expect(contributionOf(record, "rr").status).toBe("valid");
    expect(contributionOf(record, "pulse").status).toBe("valid");
    expect(record.invalidInputs).toEqual(["spo2"]);
    expect(record.annotations.some((a) => a.includes("Escala 2"))).toBe(false);
    expect(record.spo2ScaleUsed).toBeNull();
  });

  it("conflito de escala com SpO2 AUSENTE não quebra: contribuição sem tempo clínico, sem lançar", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("spo2", null),
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: before(120) },
          { scale: "scale1", orderedBy: "SYNTH-medico-02", orderedAt: before(60) },
        ],
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.status).toBe("invalid");
    expect(spo2.effectiveTime).toBeNull();
  });

  it("sem nenhuma atribuição de escala, a Escala 1 é o default declarado", () => {
    const record = evaluateNews2(evaluationInput());
    expect(record.spo2ScaleUsed).toBe("scale1");
    expect(contributionOf(record, "spo2").explanation).toBe(
      "saturação de oxigênio (SpO2): 97 % (Escala 1) → 0 ponto(s).",
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Duplicatas conflitantes (N-10) — ordenação, tolerância e pior valor
// ---------------------------------------------------------------------------

describe("N-10 — duplicatas conflitantes, tolerância de dispositivo e pior valor", () => {
  it("conflito além da tolerância é detectado mesmo com os valores entregues em ordem DECRESCENTE", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("pulse", [
          quantity("pulse", 100, "/min"),
          quantity("pulse", 60, "/min"),
        ]),
      }),
    );
    expect(record.status).toBe("invalid");
    expect(contributionOf(record, "pulse").explanation).toBe(
      "frequência cardíaca (FC): valores simultâneos 60 e 100 divergem além da tolerância de dispositivo (±5) sem resolução registrada.",
    );
  });

  it("dispersão EXATAMENTE igual à tolerância ainda está DENTRO dela (fronteira inclusiva)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("pulse", [
          quantity("pulse", 88, "/min"),
          quantity("pulse", 93, "/min"),
        ]),
      }),
    );
    expect(record.status).toBe("valid");
    const pulse = contributionOf(record, "pulse");
    expect(pulse.score).toBe(1);
    expect(pulse.conflictResolution).toEqual({
      candidates: [88, 93],
      chosenValue: 93,
      toleranceApplied: 5,
    });
  });

  it("o desempate do pior valor usa a resolução REAL do parâmetro (T em 0,1 °C, não em graus inteiros)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("temperature", [
          quantity("temperature", 38.0, "Cel"),
          quantity("temperature", 38.2, "Cel"),
        ]),
      }),
    );
    const temperature = contributionOf(record, "temperature");
    expect(temperature.conflictResolution?.chosenValue).toBe(38.2);
    expect(temperature.valueUsed).toEqual({ kind: "quantity", value: 38.2, unit: "Cel" });
    expect(temperature.score).toBe(1);
  });

  it("empate de pontuação entre candidatos resolve pelo MENOR valor, com meio-passo avaliado por banda", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("pulse", [
          quantity("pulse", 90.5, "/min"),
          quantity("pulse", 91, "/min"),
        ]),
      }),
    );
    const pulse = contributionOf(record, "pulse");
    expect(pulse.conflictResolution?.chosenValue).toBe(90.5);
    expect(pulse.valueUsed).toEqual({ kind: "quantity", value: 91, unit: "/min" });
    expect(pulse.score).toBe(1);
  });

  it("na Escala 2 em oxigênio, o PIOR valor da SpO2 é o MAIOR (a métrica de anormalidade inverte)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", coded("o2_status", "oxygen")).filter(
            (o) => o.parameter !== "spo2",
          ),
          quantity("spo2", 95, "%"),
          quantity("spo2", 97, "%"),
        ],
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: before(120) },
        ],
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.conflictResolution?.chosenValue).toBe(97);
    expect(spo2.score).toBe(3);
  });

  it("na Escala 2 com estado de O2 indeterminável, o desempate permanece determinístico e nada pontua", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", null).filter((o) => o.parameter !== "spo2"),
          quantity("spo2", 95, "%"),
          quantity("spo2", 97, "%"),
        ],
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: before(120) },
        ],
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.conflictResolution?.chosenValue).toBe(95);
    expect(spo2.score).toBeNull();
  });

  it("valores codificados simultâneos contraditórios são conflito real, com os tokens ORDENADOS no texto", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("consciousness", [
          coded("consciousness", "V", 10, "nao_sedado"),
          coded("consciousness", "A", 10, "nao_sedado"),
        ]),
      }),
    );
    expect(record.status).toBe("invalid");
    const consciousness = contributionOf(record, "consciousness");
    expect(consciousness.reason).toBe("conflicting_sources:consciousness");
    expect(consciousness.explanation).toBe(
      "nível de consciência (ACVPU): valores simultâneos contraditórios (A vs V) sem resolução registrada — conflito real, nunca resolvido às cegas.",
    );
  });

  it("estado de O2 simultâneo contraditório é conflito real (nunca se escolhe 'ar' às cegas)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("o2_status", [
          coded("o2_status", "oxygen"),
          coded("o2_status", "air"),
        ]),
      }),
    );
    expect(record.status).toBe("invalid");
    expect(contributionOf(record, "o2_status").explanation).toBe(
      "suplementação de oxigênio (ar/oxigênio): valores simultâneos contraditórios (air vs oxygen) sem resolução registrada — conflito real, nunca resolvido às cegas.",
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Integridade de insumo (INV-C; spec §5.2) — todos os ramos fail-closed
// ---------------------------------------------------------------------------

describe("spec §5.2 — integridade de insumo, sempre fail-closed e sempre declarada", () => {
  it("consciência entregue como quantidade é inmapeável (sem mapeamento GCS→ACVPU em 0.2.0)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("consciousness", quantity("consciousness", 15, "{score}")),
      }),
    );
    expect(record.status).toBe("invalid");
    const consciousness = contributionOf(record, "consciousness");
    expect(consciousness.reason).toBe("unmappable_code:consciousness");
    expect(consciousness.explanation).toBe(
      "nível de consciência (ACVPU): valor não codificado — apenas token ACVPU explícito é aceito (sem mapeamento GCS→ACVPU em 0.2.0).",
    );
  });

  it("token ACVPU fora do conjunto é inválido — NUNCA 0 e NUNCA 3 (defeitos legados D-7/D-8)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("consciousness", coded("consciousness", "a", 10, "nao_sedado")),
      }),
    );
    expect(record.status).toBe("invalid");
    const consciousness = contributionOf(record, "consciousness");
    expect(consciousness.score).toBeNull();
    expect(consciousness.explanation).toBe(
      'nível de consciência (ACVPU): token "a" fora do conjunto {A, C, V, P, U} — inválido; NUNCA pontuado como 0 nem como 3 (defeitos legados D-7/D-8 rejeitados).',
    );
  });

  it("código de O2 desconhecido é inválido — desconhecido NUNCA é 'ar'", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("o2_status", coded("o2_status", "unknown")) }),
    );
    expect(record.status).toBe("invalid");
    const o2 = contributionOf(record, "o2_status");
    expect(o2.reason).toBe("unmappable_code:o2_status");
    expect(o2.explanation).toBe(
      'suplementação de oxigênio (ar/oxigênio): código "unknown" inmapeável — apenas "air"/"oxygen" documentados; desconhecido NUNCA é "ar".',
    );
  });

  it("unidade de derivação de fluxo de O2 inmapeável é inválida", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("o2_status", quantity("o2_status", 4, "mL/min")) }),
    );
    expect(record.status).toBe("invalid");
    const o2 = contributionOf(record, "o2_status");
    expect(o2.reason).toBe("unmappable_unit:o2_status");
    expect(o2.explanation).toBe(
      'suplementação de oxigênio (ar/oxigênio): unidade "mL/min" inmapeável para derivação de fluxo (esperado "L/min").',
    );
  });

  it("fluxo de O2 negativo é inválido, com texto de derivação", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("o2_status", quantity("o2_status", -1, "L/min")) }),
    );
    expect(contributionOf(record, "o2_status").explanation).toBe(
      "suplementação de oxigênio (ar/oxigênio): fluxo de O2 negativo ou não finito — insumo de derivação deve ser não negativo.",
    );
  });

  it("fluxo de O2 > 0 deriva 'oxygen' (2 pontos) e fluxo 0 deriva 'air' documentado (0 ponto)", () => {
    const comOxigenio = evaluateNews2(
      evaluationInput({ observations: replacing("o2_status", quantity("o2_status", 4, "L/min")) }),
    );
    const o2ComOxigenio = contributionOf(comOxigenio, "o2_status");
    expect(o2ComOxigenio.valueUsed).toEqual({ kind: "code", code: "oxygen" });
    expect(o2ComOxigenio.score).toBe(2);
    expect(o2ComOxigenio.explanation).toBe(
      "suplementação de oxigênio (ar/oxigênio): em oxigênio suplementar → 2 pontos.",
    );

    const emAr = evaluateNews2(
      evaluationInput({ observations: replacing("o2_status", quantity("o2_status", 0, "L/min")) }),
    );
    const o2EmAr = contributionOf(emAr, "o2_status");
    expect(o2EmAr.valueUsed).toEqual({ kind: "code", code: "air" });
    expect(o2EmAr.score).toBe(0);
  });

  it("parâmetro numérico entregue como código é inmapeável", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", coded("rr", "normal")) }),
    );
    expect(record.status).toBe("invalid");
    const rr = contributionOf(record, "rr");
    expect(rr.reason).toBe("unmappable_code:rr");
    expect(rr.explanation).toBe(
      "frequência respiratória (FR): valor codificado onde se esperava quantidade UCUM — inmapeável.",
    );
  });

  it("unidade fora da UCUM normativa é inválida — insumo nunca é descartado silenciosamente", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", 16, "irpm")) }),
    );
    expect(contributionOf(record, "rr").explanation).toBe(
      'frequência respiratória (FR): unidade "irpm" inmapeável (UCUM normativa: "/min"); insumo nunca é descartado silenciosamente.',
    );
  });

  it("valor não finito é inválido — NaN não escapa pela checagem de faixa", () => {
    for (const valor of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const record = evaluateNews2(
        evaluationInput({ observations: replacing("rr", quantity("rr", valor, "/min")) }),
      );
      expect(record.status, `FR = ${valor}`).toBe("invalid");
      expect(contributionOf(record, "rr").reason).toBe("implausible_value:rr");
    }
    const comNaN = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", Number.NaN, "/min")) }),
    );
    expect(contributionOf(comNaN, "rr").explanation).toBe(
      "frequência respiratória (FR): valor não finito.",
    );
  });

  it("valor fora da faixa plausível é inválido, com a faixa citada no texto (N-9)", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", 200, "/min")) }),
    );
    expect(contributionOf(record, "rr").explanation).toBe(
      "frequência respiratória (FR): valor 200 fora da faixa plausível 0–80 — fail-closed em implausível (N-9).",
    );
  });

  it("os EXTREMOS da faixa plausível são aceitos (fronteira inclusiva; FR 0 e 80 pontuam 3)", () => {
    for (const valor of [0, 80]) {
      const record = evaluateNews2(
        evaluationInput({ observations: replacing("rr", quantity("rr", valor, "/min")) }),
      );
      expect(record.status, `FR = ${valor}`).toBe("valid");
      expect(contributionOf(record, "rr").score).toBe(3);
    }
  });

  it("insumo ausente é declarado por nome — ausência NUNCA é normalidade (HAZ-0005)", () => {
    const record = evaluateNews2(evaluationInput({ observations: replacing("rr", null) }));
    const rr = contributionOf(record, "rr");
    expect(rr.status).toBe("missing");
    expect(rr.explanation).toBe(
      "frequência respiratória (FR) ausente — nenhum valor foi aferido; ausência NUNCA é tratada como normal (HAZ-0005).",
    );
    expect(record.missingInputs).toEqual(["rr"]);
  });

  it("fonte em quarentena jamais contribui, com razão própria (regra das duas dimensões)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("rr", {
          ...quantity("rr", 16, "/min"),
          provenance: { sourceSystem: "SYNTH-monitor-01", sourceDataQuality: "quarantined" },
        }),
      }),
    );
    const rr = contributionOf(record, "rr");
    expect(rr.status).toBe("quarantined");
    expect(record.quarantinedInputs).toEqual(["rr"]);
    expect(rr.explanation).toBe(
      "frequência respiratória (FR) presente, porém com fonte em quarentena — insumo de fonte quarentenada jamais contribui.",
    );
  });

  it("tempo clínico ausente ou inutilizável entra na lista de indisponíveis, com razão própria (DOM-0009)", () => {
    for (const effectiveTime of [null, "não-é-uma-data"]) {
      const record = evaluateNews2(
        evaluationInput({
          observations: replacing("rr", { ...quantity("rr", 16, "/min"), effectiveTime }),
        }),
      );
      const rr = contributionOf(record, "rr");
      expect(rr.status, `effectiveTime = ${String(effectiveTime)}`).toBe("missing_clinical_time");
      expect(rr.reason).toBe("missing_clinical_time:rr");
      expect(record.status).toBe("not_evaluated");
      expect(record.reasons).toEqual(["missing_clinical_time:rr"]);
      expect(record.missingInputs).toEqual(["rr"]);
      expect(rr.explanation).toBe(
        'frequência respiratória (FR) sem tempo clínico utilizável — atualidade indemonstrável; nunca se assume "agora" (DOM-0009).',
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Atualidade em tempo de avaliação (spec §2.1/§5.2) — fronteiras exatas
// ---------------------------------------------------------------------------

describe("spec §2.1 — janelas de atualidade e horizontes de expiração (fronteiras)", () => {
  it("insumo com idade EXATAMENTE igual à janela permanece dentro dela (borda inclusiva)", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", 16, "/min", 60)) }),
    );
    expect(record.status).toBe("valid");
    expect(contributionOf(record, "rr").ageMinutes).toBe(60);
  });

  it("idade EXATAMENTE igual ao horizonte de expiração ainda é `stale`, nunca `expired`", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", 16, "/min", 480)) }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["stale_input:rr"]);
    expect(record.staleInputs).toEqual(["rr"]);
    expect(record.expiredInputs).toEqual([]);
    expect(contributionOf(record, "rr").explanation).toBe(
      "frequência respiratória (FR) fora da janela de atualidade (480 min > 60 min) — nenhum total novo é computado com insumo desatualizado.",
    );
  });

  it("um minuto além do horizonte é `expired`, com o texto de não-conclusão", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", 16, "/min", 481)) }),
    );
    expect(record.expiredInputs).toEqual(["rr"]);
    expect(contributionOf(record, "rr").explanation).toBe(
      "frequência respiratória (FR) além do horizonte de expiração (481 min > 480 min) — conclusão arbitrariamente velha não é conclusão degradada; é não-conclusão.",
    );
  });

  it("parâmetro CODIFICADO também envelhece: consciência fora da janela de 4 h é `stale` e mantém o tempo clínico", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("consciousness", coded("consciousness", "A", 300, "nao_sedado")),
      }),
    );
    const consciousness = contributionOf(record, "consciousness");
    expect(consciousness.status).toBe("stale");
    expect(consciousness.reason).toBe("stale_input:consciousness");
    expect(consciousness.effectiveTime).toBe(before(300));
    expect(consciousness.ageMinutes).toBe(300);
    expect(record.status).toBe("not_evaluated");
  });
});

// ---------------------------------------------------------------------------
// 6. Gate populacional (ADR-0027) — o choke point antes de qualquer regra
// ---------------------------------------------------------------------------

describe("ADR-0027 — gate populacional fail-closed", () => {
  it("idade desconhecida: registro não pontuável íntegro, com texto e anotações exatos", () => {
    const record = evaluateNews2(
      evaluationInput({
        age: { kind: "unknown" },
        lastValidEvaluationTime: "2026-08-16T10:00:00.000Z",
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["unknown_age"]);
    expect(record.populationGate).toEqual({ passed: false, reason: "unknown_age" });
    expect(record.explanation).toBe(
      "NEWS2 não avaliado — idade desconhecida — nunca se presume adulto (HAZ-0036). Não existe pontuação para este paciente neste momento; a ausência de pontuação não significa normalidade. Última avaliação válida: 2026-08-16T10:00:00.000Z. Regra RULE-NEWS2 v0.2.0.",
    );
    expect(record.annotations).toEqual(["gravidez não verificada"]);
    expect(record.missingInputs).toEqual([]);
    expect(record.staleInputs).toEqual([]);
    expect(record.expiredInputs).toEqual([]);
    expect(record.invalidInputs).toEqual([]);
    expect(record.quarantinedInputs).toEqual([]);
    expect(record.parameters).toHaveLength(7);
    expect(record.parameters[0]).toEqual({
      parameter: "rr",
      status: "not_evaluated",
      score: null,
      reason: null,
      valueUsed: null,
      effectiveTime: null,
      ageMinutes: null,
      conflictResolution: null,
      explanation:
        "não avaliado — idade desconhecida — nunca se presume adulto (HAZ-0036); nenhuma lógica de regra executou (gate pré-avaliação, ADR-0027).",
    });
  });

  it("idade verificada NÃO finita cai no mesmo ramo fail-closed de idade desconhecida", () => {
    const record = evaluateNews2(evaluationInput({ age: { kind: "verified", years: Number.NaN } }));
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["unknown_age"]);
    expect(record.populationGate).toEqual({ passed: false, reason: "unknown_age" });
  });

  it("abaixo do limiar etário: razão agregada out_of_population_scope e razão de gate under_age", () => {
    const record = evaluateNews2(evaluationInput({ age: { kind: "verified", years: 17 } }));
    expect(record.reasons).toEqual(["out_of_population_scope"]);
    expect(record.populationGate).toEqual({ passed: false, reason: "under_age" });
    expect(record.explanation).toContain(
      "idade verificada abaixo do limiar de 18 anos — fora da população V2 (A27-1)",
    );
    expect(record.explanation).toContain("Última avaliação válida: nenhuma.");
  });

  it("EXATAMENTE 18 anos passa o gate (fronteira inclusiva do limiar)", () => {
    const record = evaluateNews2(evaluationInput({ age: { kind: "verified", years: 18 } }));
    expect(record.status).toBe("valid");
    expect(record.populationGate).toEqual({ passed: true, reason: null });
  });

  it("gravidez documentada sai da população e NÃO carrega a anotação de gravidez não verificada", () => {
    const record = evaluateNews2(evaluationInput({ pregnancy: "documented" }));
    expect(record.reasons).toEqual(["out_of_population_scope"]);
    expect(record.populationGate).toEqual({ passed: false, reason: "pregnancy_documented" });
    expect(record.explanation).toContain(
      "gravidez documentada — instrumento não validado para gestação; instrumento obstétrico indicado (N-2)",
    );
    expect(record.annotations).toEqual([]);
  });

  it("instante de avaliação inutilizável curto-circuita ANTES do gate, sem inventar população", () => {
    const record = evaluateNews2(
      evaluationInput({
        evaluationTime: "não-é-uma-data",
        lastValidEvaluationTime: "2026-08-16T10:00:00.000Z",
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["unspecified_condition"]);
    expect(record.populationGate).toEqual({ passed: false, reason: null });
    expect(record.explanation).toBe(
      "NEWS2 não avaliado — instante de avaliação inválido ou ausente. Não existe pontuação para este paciente neste momento; a ausência de pontuação não significa normalidade. Última avaliação válida: 2026-08-16T10:00:00.000Z. Regra RULE-NEWS2 v0.2.0.",
    );
  });

  it("registro barrado no gate ainda expõe a supressão de escalonamento com a razão obrigatória (N-3)", () => {
    const record = evaluateNews2(
      evaluationInput({ age: { kind: "unknown" }, treatmentLimitationOrderDocumented: true }),
    );
    expect(record.escalationSuppressed).toBe(true);
    expect(record.escalationSuppressionReason).toBe(
      "escalonamento suprimido — ordem de limitação terapêutica documentada",
    );
    expect(record.annotations).toContain(
      "escalonamento suprimido — ordem de limitação terapêutica documentada",
    );
  });

  it("evaluatePopulationGate é total: as quatro saídas possíveis são explícitas", () => {
    expect(evaluatePopulationGate({ kind: "verified", years: 45 }, "not_documented")).toEqual({
      passed: true,
      reason: null,
    });
    expect(evaluatePopulationGate({ kind: "unknown" }, "not_documented")).toEqual({
      passed: false,
      reason: "unknown_age",
    });
    expect(evaluatePopulationGate({ kind: "verified", years: 17 }, "not_documented")).toEqual({
      passed: false,
      reason: "under_age",
    });
    expect(evaluatePopulationGate({ kind: "verified", years: 45 }, "documented")).toEqual({
      passed: false,
      reason: "pregnancy_documented",
    });
  });
});

// ---------------------------------------------------------------------------
// 7. Anotações obrigatórias (N-2/N-3/N-4) e supressão de escalonamento
// ---------------------------------------------------------------------------

describe("GDEC-0007 — anotações obrigatórias, sempre visíveis quando aplicáveis", () => {
  it.each([
    [
      "sedado",
      "sedado — interpretar consciência como confundida, nunca como válida sem qualificação",
    ],
    ["nao_sedado", "não sedado"],
  ] as const)("estado de sedação '%s' é anotado com o texto exato (N-4)", (estado, texto) => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("consciousness", coded("consciousness", "A", 10, estado)),
      }),
    );
    expect(record.annotations).toContain(
      `estado de sedação do insumo de consciência: ${texto} (N-4)`,
    );
  });

  it("estado de sedação ausente é anotado como 'não informado' — nunca lido como válido sem qualificação", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("consciousness", coded("consciousness", "A")) }),
    );
    expect(record.annotations).toContain(
      "estado de sedação do insumo de consciência: não informado (N-4)",
    );
  });

  it("sem ordem de limitação terapêutica, NADA é suprimido e nenhuma razão é inventada", () => {
    const record = evaluateNews2(evaluationInput());
    expect(record.escalationSuppressed).toBe(false);
    expect(record.escalationSuppressionReason).toBeNull();
    expect(record.annotations.some((a) => a.includes("escalonamento suprimido"))).toBe(false);
  });

  it("com ordem de limitação terapêutica, o escore continua visível e só o escalonamento é suprimido (N-3)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("temperature", quantity("temperature", 35.0, "Cel")),
        treatmentLimitationOrderDocumented: true,
      }),
    );
    expect(record.totalScore).toBe(3);
    expect(record.escalationSuppressed).toBe(true);
    expect(record.escalationSuppressionReason).toBe(
      "escalonamento suprimido — ordem de limitação terapêutica documentada",
    );
    expect(record.annotations).toContain(
      "escalonamento suprimido — ordem de limitação terapêutica documentada",
    );
  });
});

// ---------------------------------------------------------------------------
// 8. Explicação agregada (spec §7) — o texto é contrato de segurança
// ---------------------------------------------------------------------------

describe("spec §7 — texto de explicação agregada em pt-BR", () => {
  it("registro válido: template completo com total, tier, insumos com horários, escala e versão da regra", () => {
    const record = evaluateNews2(evaluationInput());
    expect(record.explanation).toBe(
      "NEWS2 total 0 — risco baixo. Informação consultiva; não é uma diretriz e não substitui o julgamento clínico. " +
        "Dados utilizados: frequência respiratória (FR): 16 /min (2026-08-16T11:50:00.000Z); " +
        "saturação de oxigênio (SpO2): 97 % (2026-08-16T11:50:00.000Z); " +
        "suplementação de oxigênio (ar/oxigênio): air (2026-08-16T11:50:00.000Z); " +
        "pressão arterial sistólica (PAS): 120 mm[Hg] (2026-08-16T11:50:00.000Z); " +
        "frequência cardíaca (FC): 70 /min (2026-08-16T11:50:00.000Z); " +
        "nível de consciência (ACVPU): A (2026-08-16T11:50:00.000Z); " +
        "temperatura (T): 37 Cel (2026-08-16T11:50:00.000Z). " +
        "SpO2 pontuada na Escala 1. Regra RULE-NEWS2 v0.2.0.",
    );
  });

  it("cada banda de risco tem seu rótulo próprio no texto (Chart 2, consultivo)", () => {
    const baixo = evaluateNews2(evaluationInput());
    expect(baixo.riskTier).toBe("low");
    expect(baixo.fires).toBe(false);
    expect(baixo.explanation.startsWith("NEWS2 total 0 — risco baixo.")).toBe(true);

    // Parâmetro vermelho isolado com total < 5 ⇒ baixo-médio (INV-B).
    const baixoMedio = evaluateNews2(
      evaluationInput({
        observations: replacing("consciousness", coded("consciousness", "V", 10, "nao_sedado")),
      }),
    );
    expect(baixoMedio.redParameter).toBe(true);
    expect(baixoMedio.riskTier).toBe("low_medium");
    expect(baixoMedio.fires).toBe(true);
    expect(
      baixoMedio.explanation.startsWith(
        "NEWS2 total 3 — risco baixo-médio (parâmetro vermelho isolado).",
      ),
    ).toBe(true);

    // Total 5 sem nenhum parâmetro vermelho ⇒ médio.
    const medio = evaluateNews2(
      evaluationInput({
        observations: [
          quantity("rr", 21, "/min"),
          quantity("spo2", 97, "%"),
          coded("o2_status", "air"),
          quantity("sbp", 105, "mm[Hg]"),
          quantity("pulse", 95, "/min"),
          coded("consciousness", "A", 10, "nao_sedado"),
          quantity("temperature", 38.5, "Cel"),
        ],
      }),
    );
    expect(medio.totalScore).toBe(5);
    expect(medio.redParameter).toBe(false);
    expect(medio.riskTier).toBe("medium");
    expect(medio.fires).toBe(true);
    expect(medio.explanation.startsWith("NEWS2 total 5 — risco médio.")).toBe(true);

    const alto = evaluateNews2(
      evaluationInput({
        observations: [
          quantity("rr", 25, "/min"),
          quantity("spo2", 91, "%"),
          coded("o2_status", "oxygen"),
          quantity("sbp", 120, "mm[Hg]"),
          quantity("pulse", 70, "/min"),
          coded("consciousness", "A", 10, "nao_sedado"),
          quantity("temperature", 37.0, "Cel"),
        ],
      }),
    );
    expect(alto.totalScore).toBe(8);
    expect(alto.riskTier).toBe("high");
    expect(alto.fires).toBe(true);
    expect(alto.explanation.startsWith("NEWS2 total 8 — risco alto.")).toBe(true);
  });

  it("registro inválido: texto de integridade com o motivo e a última avaliação válida", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("rr", quantity("rr", 200, "/min")),
        lastValidEvaluationTime: "2026-08-16T10:00:00.000Z",
      }),
    );
    expect(record.explanation).toBe(
      "NEWS2 inválido — falha de integridade de dado detectada (implausible_value:rr). " +
        "Não existe pontuação para este paciente neste momento; a ausência de pontuação não significa normalidade. " +
        "Última avaliação válida: 2026-08-16T10:00:00.000Z. Regra RULE-NEWS2 v0.2.0.",
    );
  });

  it("registro não avaliado: texto de não-conclusão com o motivo e a última avaliação válida", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: replacing("rr", null),
        lastValidEvaluationTime: "2026-08-16T10:00:00.000Z",
      }),
    );
    expect(record.explanation).toBe(
      "NEWS2 não avaliado — missing_required_input:rr. " +
        "Não existe pontuação para este paciente neste momento; a ausência de pontuação não significa normalidade. " +
        "Última avaliação válida: 2026-08-16T10:00:00.000Z. Regra RULE-NEWS2 v0.2.0.",
    );
  });

  it("sem última avaliação válida conhecida, o texto diz 'nenhuma' — nunca omite a linha", () => {
    const record = evaluateNews2(evaluationInput({ observations: replacing("rr", null) }));
    expect(record.explanation).toContain(
      "Última avaliação válida: nenhuma. Regra RULE-NEWS2 v0.2.0.",
    );
  });
});

// ---------------------------------------------------------------------------
// 9. Contribuições por parâmetro — valor usado, tempo clínico e texto
// ---------------------------------------------------------------------------

describe("spec §5.1 — contribuição por parâmetro sempre auditável", () => {
  it("consciência alerta: status, valor codificado, tempo clínico e texto exatos", () => {
    const record = evaluateNews2(evaluationInput());
    const consciousness = contributionOf(record, "consciousness");
    expect(consciousness.status).toBe("valid");
    expect(consciousness.valueUsed).toEqual({ kind: "code", code: "A" });
    expect(consciousness.effectiveTime).toBe(T10);
    expect(consciousness.explanation).toBe("nível de consciência (ACVPU): alerta (A) → 0 ponto.");
  });

  it.each(["C", "V", "P", "U"] as const)(
    "token CVPU '%s' pontua 3 com o texto de banda vermelha",
    (token) => {
      const record = evaluateNews2(
        evaluationInput({
          observations: replacing("consciousness", coded("consciousness", token, 10, "nao_sedado")),
        }),
      );
      const consciousness = contributionOf(record, "consciousness");
      expect(consciousness.score).toBe(3);
      expect(consciousness.explanation).toBe(
        `nível de consciência (ACVPU): token ${token} → 3 pontos (banda vermelha CVPU; nova confusão pontua 3 — RCP Recs 29–30).`,
      );
    },
  );

  it("ar ambiente documentado: valor codificado, tempo clínico e texto de não-coerção", () => {
    const record = evaluateNews2(evaluationInput());
    const o2 = contributionOf(record, "o2_status");
    expect(o2.valueUsed).toEqual({ kind: "code", code: "air" });
    expect(o2.effectiveTime).toBe(T10);
    expect(o2.explanation).toBe(
      "suplementação de oxigênio (ar/oxigênio): em ar ambiente documentado → 0 ponto (estado documentado, não coerção).",
    );
  });

  it("parâmetro numérico válido: valor de chart, unidade UCUM e texto", () => {
    const record = evaluateNews2(evaluationInput());
    const rr = contributionOf(record, "rr");
    expect(rr.valueUsed).toEqual({ kind: "quantity", value: 16, unit: "/min" });
    expect(rr.effectiveTime).toBe(T10);
    expect(rr.ageMinutes).toBe(10);
    expect(rr.explanation).toBe("frequência respiratória (FR): 16 /min → 0 ponto(s).");
  });
});

// ---------------------------------------------------------------------------
// 10. Reavaliação em tempo de leitura (spec §5.3) — fronteiras e insumo mais antigo
// ---------------------------------------------------------------------------

describe("spec §5.3 — reavaliação de status em tempo de leitura", () => {
  it("instante de leitura inutilizável não vira 'agora': resultado explícito de não-conclusão", () => {
    const record = evaluateNews2(evaluationInput());
    expect(reassessNews2AtReadTime(record, "não-é-uma-data")).toEqual({
      status: "not_evaluated",
      reasons: ["unspecified_condition"],
      oldestInputAgeMinutes: null,
    });
  });

  it("idade EXATAMENTE igual à janela mantém a leitura `valid` (borda inclusiva)", () => {
    const record = evaluateNews2(evaluationInput());
    // Baseline observado 10 min antes; ler 50 min após a avaliação ⇒ 60 min de idade.
    expect(reassessNews2AtReadTime(record, after(50))).toEqual({
      status: "valid",
      reasons: [],
      oldestInputAgeMinutes: 60,
    });
  });

  it("idade EXATAMENTE igual ao horizonte de expiração é `stale`, nunca `expired`", () => {
    const record = evaluateNews2(evaluationInput());
    const read = reassessNews2AtReadTime(record, after(470));
    expect(read.status).toBe("stale");
    expect(read.reasons).toContain("stale_input:rr");
    expect(read.reasons.some((r) => r.startsWith("expired_input:"))).toBe(false);
    expect(read.oldestInputAgeMinutes).toBe(480);
  });

  it("um minuto além do horizonte já é `expired` (não-conclusão)", () => {
    const record = evaluateNews2(evaluationInput());
    const read = reassessNews2AtReadTime(record, after(471));
    expect(read.status).toBe("not_evaluated");
    expect(read.reasons).toContain("expired_input:rr");
  });

  it("a idade reportada é a do insumo MAIS ANTIGO, esteja ele em qualquer posição da lista", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          quantity("rr", 16, "/min", 10),
          quantity("spo2", 97, "%", 50),
          coded("o2_status", "air", 5),
          quantity("sbp", 120, "mm[Hg]", 3),
          quantity("pulse", 70, "/min", 2),
          coded("consciousness", "A", 1, "nao_sedado"),
          quantity("temperature", 37.0, "Cel", 0),
        ],
      }),
    );
    expect(record.status).toBe("valid");
    expect(reassessNews2AtReadTime(record, EVAL).oldestInputAgeMinutes).toBe(50);
  });

  it("contribuição sem tempo clínico é IGNORADA no envelhecimento, jamais tratada como infinitamente velha", () => {
    const record = evaluateNews2(evaluationInput());
    const semTempo = JSON.parse(JSON.stringify(record)) as {
      parameters: { parameter: string; effectiveTime: string | null }[];
    };
    const alvo = semTempo.parameters.find((c) => c.parameter === "temperature");
    expect(alvo).toBeDefined();
    (alvo as { effectiveTime: string | null }).effectiveTime = null;

    const read = reassessNews2AtReadTime(semTempo as unknown as EvaluationRecord, EVAL);
    expect(read.status).toBe("valid");
    expect(read.oldestInputAgeMinutes).toBe(10);
  });

  it("idade zero é reportada como 0, nunca como 'sem idade' (leitura no próprio instante da aferição)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          quantity("rr", 16, "/min", 0),
          quantity("spo2", 97, "%", 0),
          coded("o2_status", "air", 0),
          quantity("sbp", 120, "mm[Hg]", 0),
          quantity("pulse", 70, "/min", 0),
          coded("consciousness", "A", 0, "nao_sedado"),
          quantity("temperature", 37.0, "Cel", 0),
        ],
      }),
    );
    expect(reassessNews2AtReadTime(record, EVAL)).toEqual({
      status: "valid",
      reasons: [],
      oldestInputAgeMinutes: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// 11. Tabelas de configuração por parâmetro — cada linha é exercida por si
// ---------------------------------------------------------------------------

describe("spec §2.1 — cada linha das tabelas de janela e de faixa plausível é exercida", () => {
  const janelas: readonly (readonly [News2ParameterId, number])[] = [
    ["rr", 60],
    ["spo2", 60],
    ["o2_status", 240],
    ["sbp", 60],
    ["pulse", 60],
    ["consciousness", 240],
    ["temperature", 240],
  ];

  it.each(janelas)(
    "um minuto além da janela de %s torna o insumo `stale` e a avaliação não-conclusiva",
    (parameter, windowMinutes) => {
      const idade = windowMinutes + 1;
      const observacao =
        parameter === "o2_status"
          ? coded("o2_status", "air", idade)
          : parameter === "consciousness"
            ? coded("consciousness", "A", idade, "nao_sedado")
            : quantity(
                parameter,
                { rr: 16, spo2: 97, sbp: 120, pulse: 70, temperature: 37.0 }[
                  parameter as "rr" | "spo2" | "sbp" | "pulse" | "temperature"
                ],
                { rr: "/min", spo2: "%", sbp: "mm[Hg]", pulse: "/min", temperature: "Cel" }[
                  parameter as "rr" | "spo2" | "sbp" | "pulse" | "temperature"
                ],
                idade,
              );
      const record = evaluateNews2(
        evaluationInput({ observations: replacing(parameter, observacao) }),
      );
      expect(record.status).toBe("not_evaluated");
      expect(record.staleInputs).toEqual([parameter]);
      expect(record.reasons).toEqual([`stale_input:${parameter}`]);
      expect(contributionOf(record, parameter).ageMinutes).toBe(idade);
    },
  );

  const faixas: readonly (readonly [News2ParameterId, string, number, number])[] = [
    ["rr", "/min", -1, 81],
    ["spo2", "%", 39, 101],
    ["sbp", "mm[Hg]", 29, 301],
    ["pulse", "/min", 9, 301],
    ["temperature", "Cel", 24, 46],
  ];

  it.each(faixas)(
    "fora da faixa plausível de %s (abaixo e acima) o insumo é `invalid`, nunca truncado",
    (parameter, unit, abaixo, acima) => {
      for (const valor of [abaixo, acima]) {
        const record = evaluateNews2(
          evaluationInput({ observations: replacing(parameter, quantity(parameter, valor, unit)) }),
        );
        expect(record.status, `${parameter} = ${valor}`).toBe("invalid");
        expect(record.invalidInputs).toEqual([parameter]);
        expect(contributionOf(record, parameter).reason).toBe(`implausible_value:${parameter}`);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// 12. Sobreviventes residuais de segunda rodada
// ---------------------------------------------------------------------------

describe("fechamento de vãos residuais da análise de mutação", () => {
  it("o conjunto de anotações de um registro válido é EXATAMENTE o previsto — nada a mais, nada a menos", () => {
    const record = evaluateNews2(evaluationInput());
    expect(record.annotations).toEqual([
      "gravidez não verificada",
      "estado de sedação do insumo de consciência: não sedado (N-4)",
    ]);
  });

  it("a contribuição do estado de O2 é marcada `valid` — o status do parâmetro nunca é omitido", () => {
    const record = evaluateNews2(evaluationInput());
    expect(contributionOf(record, "o2_status").status).toBe("valid");
    expect(record.parameters.map((c) => c.status)).toEqual(Array<string>(7).fill("valid"));
  });

  it("ordem de Escala 2 com instante inutilizável é exibida, mas NÃO dispara o ciclo de reconfirmação", () => {
    const record = evaluateNews2(
      evaluationInput({
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: "sem-horário-utilizável" },
        ],
      }),
    );
    expect(record.status).toBe("valid");
    expect(record.annotations).toContain(
      "SpO2 pontuada na Escala 2 — ordem clínica documentada de sem-horário-utilizável (autoria: SYNTH-medico-01)",
    );
    expect(record.annotations.some((a) => a.includes("reconfirmação"))).toBe(false);
  });

  it("o desempate de duplicatas de SpO2 usa a escala GOVERNADA, não a Escala 2 por padrão", () => {
    // Escala 1 (nenhuma ordem): pior valor é o MENOR. Se a métrica caísse na
    // Escala 2, o pior passaria a ser o MAIOR — inversão clínica silenciosa.
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", coded("o2_status", "oxygen")).filter(
            (o) => o.parameter !== "spo2",
          ),
          quantity("spo2", 95, "%"),
          quantity("spo2", 97, "%"),
        ],
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.conflictResolution?.chosenValue).toBe(95);
    expect(spo2.score).toBe(1);
    expect(record.spo2ScaleUsed).toBe("scale1");
  });

  it("na Escala 2 sem estado de O2, o valor PONTUÁVEL vence o indeterminável no desempate de duplicatas", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", null).filter((o) => o.parameter !== "spo2"),
          quantity("spo2", 92, "%"),
          quantity("spo2", 94, "%"),
        ],
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: before(120) },
        ],
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.conflictResolution?.chosenValue).toBe(92);
    expect(spo2.score).toBe(0);
  });

  it("meio-passo na Escala 2 sem estado de O2 prefere a banda PONTUÁVEL (92,5 ⇒ 92, 0 ponto)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", null).filter((o) => o.parameter !== "spo2"),
          quantity("spo2", 92.5, "%"),
        ],
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: before(120) },
        ],
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.valueUsed).toEqual({ kind: "quantity", value: 92, unit: "%" });
    expect(spo2.score).toBe(0);
  });

  it("meio-passo na região decrescente da Escala 2 resolve para a banda mais anormal (83,5 ⇒ 83, 3 pontos)", () => {
    const record = evaluateNews2(
      evaluationInput({
        observations: [
          ...replacing("o2_status", coded("o2_status", "oxygen")).filter(
            (o) => o.parameter !== "spo2",
          ),
          quantity("spo2", 83.5, "%"),
        ],
        spo2ScaleAssignments: [
          { scale: "scale2", orderedBy: "SYNTH-medico-01", orderedAt: before(120) },
        ],
      }),
    );
    const spo2 = contributionOf(record, "spo2");
    expect(spo2.valueUsed).toEqual({ kind: "quantity", value: 83, unit: "%" });
    expect(spo2.score).toBe(3);
  });

  it("múltiplas razões aparecem TODAS no texto, separadas por vírgula", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", null).filter((o) => o.parameter !== "sbp") }),
    );
    expect(record.explanation).toBe(
      "NEWS2 não avaliado — missing_required_input:rr, missing_required_input:sbp. " +
        "Não existe pontuação para este paciente neste momento; a ausência de pontuação não significa normalidade. " +
        "Última avaliação válida: nenhuma. Regra RULE-NEWS2 v0.2.0.",
    );
  });

  it("registro inválido sem histórico conhecido também declara 'nenhuma' última avaliação válida", () => {
    const record = evaluateNews2(
      evaluationInput({ observations: replacing("rr", quantity("rr", 200, "/min")) }),
    );
    expect(record.explanation).toBe(
      "NEWS2 inválido — falha de integridade de dado detectada (implausible_value:rr). " +
        "Não existe pontuação para este paciente neste momento; a ausência de pontuação não significa normalidade. " +
        "Última avaliação válida: nenhuma. Regra RULE-NEWS2 v0.2.0.",
    );
  });
});
