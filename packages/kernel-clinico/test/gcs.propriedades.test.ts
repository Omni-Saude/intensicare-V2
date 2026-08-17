/**
 * Testes de propriedade (fast-check) do avaliador RULE-GCS 0.2.0:
 * - determinismo/idempotência e invariância a permutação das observações;
 * - sonda de insumo ausente como PROPRIEDADE (SAF-0002/HAZ-0005): remover
 *   qualquer componente NUNCA produz `valid` nem total numérico;
 * - sonda de NT (o defeito legado REV-NS-01 §1.2): marcar qualquer componente
 *   como NT NUNCA produz total, e o componente NT NUNCA vale 1;
 * - irrepresentabilidade: total existe se e somente se `status === "valid"`,
 *   e então total = E + V + M dentro de 3..15;
 * - oráculo de enumeração transcrito da spec §3.1 independentemente de src/;
 * - monotonicidade do total em cada componente;
 * - gate de sedação FAIL-CLOSED como propriedade universal (ADR-0028 A28-2);
 * - gate populacional fail-closed como propriedade universal (ADR-0027);
 * - monotonicidade de precedência (ADR-0008 N2/V2): injetar um estado pior
 *   nunca torna o agregado mais tranquilizador;
 * - bordas de janela/expiração e de contemporaneidade.
 *
 * Dados 100% sintéticos; nenhum relógio é lido (todo tempo por parâmetro).
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  evaluateGcs,
  GCS_COMPONENT_EXPIRY_MINUTES,
  GCS_COMPONENT_ORDER,
  GCS_COMPONENT_WINDOW_MINUTES,
  type GcsComponentId,
  type GcsComponentObservationInput,
  type GcsEvaluationInput,
  type GcsNtReason,
  type SedativeExposureState,
} from "../src/index.js";
import { EVAL_TIME_GCS } from "./suporte-gcs.js";

const EVAL_MS = Date.parse(EVAL_TIME_GCS);
const PROVENANCE = { sourceSystem: "SYNTH-beira-leito-01", sourceDataQuality: "valid" } as const;

function before(minutes: number): string {
  return new Date(EVAL_MS - minutes * 60_000).toISOString();
}

/**
 * Oráculo de enumeração TRANSCRITO da specification.md §3.1, independente das
 * tabelas de src/: ocular 1–4, verbal 1–5, motor 1–6.
 */
const ORACLE_RANGE: Readonly<Record<GcsComponentId, readonly [number, number]>> = {
  eye: [1, 4],
  verbal: [1, 5],
  motor: [1, 6],
};

const componentArb = (component: GcsComponentId): fc.Arbitrary<number> =>
  fc.integer({ min: ORACLE_RANGE[component][0], max: ORACLE_RANGE[component][1] });

const NT_REASON_BY_COMPONENT: Readonly<Record<GcsComponentId, GcsNtReason>> = {
  eye: "eye_trauma_or_edema",
  verbal: "endotracheal_intubation",
  motor: "paralysis_other",
};

function observation(
  component: GcsComponentId,
  value: number,
  minutesBefore = 180,
): GcsComponentObservationInput {
  return {
    component,
    value: { kind: "score", value },
    effectiveTime: before(minutesBefore),
    provenance: PROVENANCE,
  };
}

interface TriadeSintetica {
  readonly eye: number;
  readonly verbal: number;
  readonly motor: number;
}

const triadeArb: fc.Arbitrary<TriadeSintetica> = fc.record({
  eye: componentArb("eye"),
  verbal: componentArb("verbal"),
  motor: componentArb("motor"),
});

function inputFrom(
  triade: TriadeSintetica,
  overrides: Partial<GcsEvaluationInput> = {},
  minutesBefore = 180,
): GcsEvaluationInput {
  return {
    evaluationTime: EVAL_TIME_GCS,
    age: { kind: "verified", years: 58 },
    components: GCS_COMPONENT_ORDER.map((component) =>
      observation(component, triade[component], minutesBefore),
    ),
    rass: { value: 0, effectiveTime: before(minutesBefore), provenance: PROVENANCE },
    sedativeExposure: "none_active",
    ...overrides,
  };
}

/** Ordem de tranquilidade decrescente (ADR-0008 N2, P-a). */
const STATUS_RANK: Readonly<Record<string, number>> = {
  valid: 0,
  partial: 1,
  stale: 2,
  not_evaluated: 3,
  invalid: 4,
};

describe("RULE-GCS — propriedades de determinismo e forma", () => {
  it("determinismo: mesma entrada ⇒ registro idêntico", () => {
    fc.assert(
      fc.property(triadeArb, (triade) => {
        const input = inputFrom(triade);
        expect(JSON.stringify(evaluateGcs(input))).toBe(JSON.stringify(evaluateGcs(input)));
      }),
    );
  });

  it("invariância a permutação das observações", () => {
    fc.assert(
      fc.property(triadeArb, fc.integer({ min: 0, max: 5 }), (triade, rotacao) => {
        const input = inputFrom(triade);
        const permutada = [...input.components];
        for (let i = 0; i < rotacao % permutada.length; i++) {
          permutada.push(permutada.shift() as GcsComponentObservationInput);
        }
        const a = evaluateGcs(input);
        const b = evaluateGcs({ ...input, components: permutada });
        expect(b.status).toBe(a.status);
        expect(b.total).toBe(a.total);
        expect([...b.reasons].sort()).toEqual([...a.reasons].sort());
      }),
    );
  });

  it("total existe SE E SOMENTE SE o status é `valid`, e então vale E+V+M em 3..15", () => {
    fc.assert(
      fc.property(
        triadeArb,
        fc.constantFrom<SedativeExposureState>(
          "none_active",
          "active_infusion",
          "interrupted_window_documented",
          "unknown",
        ),
        fc.integer({ min: -5, max: 4 }),
        (triade, exposure, rass) => {
          const record = evaluateGcs(
            inputFrom(triade, {
              sedativeExposure: exposure,
              rass: { value: rass, effectiveTime: before(180), provenance: PROVENANCE },
            }),
          );
          if (record.status === "valid") {
            expect(record.total).toBe(triade.eye + triade.verbal + triade.motor);
            expect(record.total as number).toBeGreaterThanOrEqual(3);
            expect(record.total as number).toBeLessThanOrEqual(15);
            expect(record.reasons).toHaveLength(0);
          } else {
            expect(record.total).toBeNull();
            expect(record.reasons.length).toBeGreaterThan(0);
          }
          // `partial` é inalcançável nesta regra (spec §6).
          expect(record.status).not.toBe("partial");
          expect(record.fires).toBe(false);
        },
      ),
    );
  });

  it("o valor exibido de um componente válido é EXATAMENTE o observado (oráculo §3.1)", () => {
    fc.assert(
      fc.property(triadeArb, (triade) => {
        const record = evaluateGcs(inputFrom(triade));
        for (const component of GCS_COMPONENT_ORDER) {
          const contribution = record.components.find((c) => c.component === component);
          expect(contribution?.value).toBe(triade[component]);
          const [min, max] = ORACLE_RANGE[component];
          expect(contribution?.value as number).toBeGreaterThanOrEqual(min);
          expect(contribution?.value as number).toBeLessThanOrEqual(max);
        }
      }),
    );
  });

  it("monotonicidade: elevar um componente nunca reduz o total", () => {
    fc.assert(
      fc.property(
        triadeArb,
        fc.constantFrom<GcsComponentId>("eye", "verbal", "motor"),
        (triade, component) => {
          const [, max] = ORACLE_RANGE[component];
          if (triade[component] >= max) return;
          const maior = { ...triade, [component]: triade[component] + 1 } as TriadeSintetica;
          const base = evaluateGcs(inputFrom(triade)).total as number;
          const elevado = evaluateGcs(inputFrom(maior)).total as number;
          expect(elevado).toBeGreaterThan(base);
        },
      ),
    );
  });
});

describe("RULE-GCS — sondas de segurança como propriedades (HAZ-0005, SAF-0002)", () => {
  it("remover QUALQUER componente nunca produz `valid` nem total numérico", () => {
    fc.assert(
      fc.property(
        triadeArb,
        fc.constantFrom<GcsComponentId>("eye", "verbal", "motor"),
        (triade, removido) => {
          const input = inputFrom(triade);
          const record = evaluateGcs({
            ...input,
            components: input.components.filter((o) => o.component !== removido),
          });
          expect(record.status).not.toBe("valid");
          expect(record.total).toBeNull();
          expect(record.reasons).toContain(`missing_required_input:${removido}`);
          const contribution = record.components.find((c) => c.component === removido);
          expect(contribution?.status).toBe("missing");
          expect(contribution?.value).toBeNull();
        },
      ),
    );
  });

  it("marcar QUALQUER componente como NT nunca produz total, e o NT nunca vale 1", () => {
    fc.assert(
      fc.property(
        triadeArb,
        fc.constantFrom<GcsComponentId>("eye", "verbal", "motor"),
        (triade, alvo) => {
          const input = inputFrom(triade);
          const record = evaluateGcs({
            ...input,
            components: input.components.map((o) =>
              o.component === alvo
                ? {
                    ...o,
                    value: {
                      kind: "not_testable" as const,
                      ntReason: NT_REASON_BY_COMPONENT[alvo],
                    },
                  }
                : o,
            ),
          });
          expect(record.status).toBe("not_evaluated");
          expect(record.total).toBeNull();
          expect(record.reasons).toContain("component_not_testable");
          const contribution = record.components.find((c) => c.component === alvo);
          expect(contribution?.status).toBe("not_testable");
          expect(contribution?.value).toBeNull();
          expect(contribution?.value).not.toBe(1);
        },
      ),
    );
  });

  it("valor fora da enumeração ⇒ `invalid`, nunca clampado ao vizinho", () => {
    fc.assert(
      fc.property(
        triadeArb,
        fc.constantFrom<GcsComponentId>("eye", "verbal", "motor"),
        fc.integer({ min: 7, max: 40 }),
        (triade, alvo, foraDaFaixa) => {
          const input = inputFrom(triade);
          const record = evaluateGcs({
            ...input,
            components: input.components.map((o) =>
              o.component === alvo ? observation(alvo, foraDaFaixa) : o,
            ),
          });
          expect(record.status).toBe("invalid");
          expect(record.reasons).toContain(`out_of_range:${alvo}`);
          const contribution = record.components.find((c) => c.component === alvo);
          expect(contribution?.value).toBeNull();
        },
      ),
    );
  });

  it("gate de sedação FAIL-CLOSED: sem RASS pareado, nenhum total jamais (A28-2)", () => {
    fc.assert(
      fc.property(
        triadeArb,
        fc.constantFrom<SedativeExposureState>(
          "none_active",
          "active_infusion",
          "interrupted_window_documented",
          "unknown",
        ),
        (triade, exposure) => {
          const record = evaluateGcs(inputFrom(triade, { rass: null, sedativeExposure: exposure }));
          expect(record.status).not.toBe("valid");
          expect(record.total).toBeNull();
          expect(record.assessability).not.toBe("testable");
        },
      ),
    );
  });

  it("RASS ≤ −3 com exposição sedativa ativa/desconhecida ⇒ nunca escora (A28-1)", () => {
    fc.assert(
      fc.property(
        triadeArb,
        fc.integer({ min: -5, max: -3 }),
        fc.constantFrom<SedativeExposureState>(
          "active_infusion",
          "interrupted_window_documented",
          "unknown",
        ),
        (triade, rass, exposure) => {
          const record = evaluateGcs(
            inputFrom(triade, {
              rass: { value: rass, effectiveTime: before(180), provenance: PROVENANCE },
              sedativeExposure: exposure,
            }),
          );
          expect(record.assessability).toBe("sedation_confounded");
          expect(record.status).toBe("not_evaluated");
          expect(record.total).toBeNull();
        },
      ),
    );
  });

  it("gate populacional fail-closed: idade desconhecida ou <18 nunca escora", () => {
    fc.assert(
      fc.property(triadeArb, fc.integer({ min: 0, max: 17 }), (triade, idade) => {
        const desconhecida = evaluateGcs(inputFrom(triade, { age: { kind: "unknown" } }));
        expect(desconhecida.status).toBe("not_evaluated");
        expect(desconhecida.reasons).toEqual(["population_unverified"]);
        expect(desconhecida.total).toBeNull();

        const menor = evaluateGcs(inputFrom(triade, { age: { kind: "verified", years: idade } }));
        expect(menor.status).toBe("not_evaluated");
        expect(menor.reasons).toEqual(["out_of_population_scope"]);
        expect(menor.total).toBeNull();
      }),
    );
  });

  it("monotonicidade de precedência: injetar estado pior nunca melhora o agregado", () => {
    fc.assert(
      fc.property(
        triadeArb,
        fc.constantFrom<GcsComponentId>("eye", "verbal", "motor"),
        (triade, alvo) => {
          const input = inputFrom(triade);
          const base = evaluateGcs(input);
          const piorado = evaluateGcs({
            ...input,
            components: input.components.map((o) =>
              o.component === alvo ? observation(alvo, 99) : o,
            ),
          });
          expect(STATUS_RANK[piorado.status] as number).toBeGreaterThanOrEqual(
            STATUS_RANK[base.status] as number,
          );
        },
      ),
    );
  });
});

describe("RULE-GCS — propriedades de atualidade (spec §5.3)", () => {
  it("dentro da janela ⇒ nunca stale; entre janela e expiração ⇒ stale; além ⇒ expirado", () => {
    fc.assert(
      fc.property(triadeArb, fc.integer({ min: 0, max: 3000 }), (triade, idadeMinutos) => {
        const record = evaluateGcs(
          inputFrom(
            triade,
            {
              rass: { value: 0, effectiveTime: before(idadeMinutos), provenance: PROVENANCE },
            },
            idadeMinutos,
          ),
        );
        if (idadeMinutos <= GCS_COMPONENT_WINDOW_MINUTES) {
          expect(record.status).toBe("valid");
          expect(record.staleComponents).toHaveLength(0);
        } else if (idadeMinutos <= GCS_COMPONENT_EXPIRY_MINUTES) {
          expect(record.status).toBe("stale");
          expect(record.staleComponents).toHaveLength(3);
          expect(record.total).toBeNull();
        } else {
          expect(record.status).toBe("not_evaluated");
          expect(record.expiredComponents).toHaveLength(3);
          expect(record.total).toBeNull();
        }
      }),
    );
  });

  it("componentes de exames distintos (>30 min) nunca somam", () => {
    fc.assert(
      fc.property(triadeArb, fc.integer({ min: 31, max: 600 }), (triade, dispersao) => {
        const input = inputFrom(triade);
        const record = evaluateGcs({
          ...input,
          components: input.components.map((o) =>
            o.component === "motor" ? observation("motor", triade.motor, 180 - dispersao) : o,
          ),
        });
        expect(record.total).toBeNull();
        expect(record.reasons).toContain("component_set_not_contemporaneous");
      }),
    );
  });
});
