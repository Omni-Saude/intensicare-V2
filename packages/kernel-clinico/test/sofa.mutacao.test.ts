/**
 * Blocos caçadores de mutantes do avaliador SOFA — cada bloco abaixo existe
 * porque a análise de mutação (Stryker, `pnpm --filter
 * @intensicare/kernel-clinico run test:mutacao`) exibiu mutantes
 * SOBREVIVENTES ou SEM COBERTURA em: ramos de integridade por insumo
 * (tempo clínico ausente, quarentena, valor não finito, faixa plausível),
 * validação de PAM/suporte/dose, domínios de RASS/GCS, os templates pt-BR
 * de explicação (§7), as anotações obrigatórias (GDEC-0007) e a ordem
 * canônica de componentes.
 *
 * Disciplina idêntica à de `news2.mutacao.test.ts`: comparar contra
 * literais de propósito — comparar contra a constante exportada não
 * detectaria a mutação da própria constante.
 */

import { describe, expect, it } from "vitest";
import {
  evaluateSofa,
  fio2FracaoDeNumero,
  fio2PercentualDeNumero,
  SOFA_COMPONENT_ORDER,
  type SofaEvaluationInput,
  type SofaQuantityObservation,
  type SofaUrineOutputObservation,
  type SofaVasoactiveAgentObservation,
} from "../src/index.js";

const T = "2026-08-15T12:00:00-03:00";
const PROC = { sourceSystem: "SYNTH-amh-01", sourceDataQuality: "valid" } as const;

function q(value: number, unit: string, minutosAtras = 10): SofaQuantityObservation {
  const t = new Date(Date.parse(T) - minutosAtras * 60_000).toISOString();
  return { value, unit, effectiveTime: t, provenance: PROC };
}

function entrada(overrides: Partial<SofaEvaluationInput>): SofaEvaluationInput {
  return {
    evaluationTime: T,
    age: { kind: "verified", years: 64 },
    pao2: [q(96, "mm[Hg]", 240)],
    fio2: [q(0.21, "1", 240)],
    respiratorySupportStatus: {
      value: "none",
      effectiveTime: q(0, "1", 240).effectiveTime,
      provenance: PROC,
    },
    platelets: [q(250, "10*3/uL", 360)],
    bilirubin: [q(0.6, "mg/dL", 360)],
    map: {
      kind: "measured",
      value: 85,
      unit: "mm[Hg]",
      effectiveTime: q(0, "mm[Hg]", 120).effectiveTime,
      provenance: PROC,
    },
    vasoactiveAgents: [],
    gcsTotal: q(15, "{score}", 180),
    rass: { value: 0, effectiveTime: q(0, "", 180).effectiveTime, provenance: PROC },
    sedativeExposure: "none_active",
    creatinine: [q(0.8, "mg/dL", 360)],
    urineOutput24h: {
      value: 1800,
      unit: "mL",
      intervalStart: new Date(Date.parse(T) - 26 * 3_600_000).toISOString(),
      intervalEnd: new Date(Date.parse(T) - 2 * 3_600_000).toISOString(),
      provenance: PROC,
    },
    ...overrides,
  };
}

function componente(
  record: ReturnType<typeof evaluateSofa>,
  id: "resp" | "coag" | "liver" | "cv" | "cns" | "renal",
) {
  const c = record.components.find((x) => x.component === id);
  if (c === undefined) throw new Error(`componente ${id} ausente`);
  return c;
}

function semTempo(qty: SofaQuantityObservation): SofaQuantityObservation {
  return { ...qty, effectiveTime: null };
}

/** Instante ISO puro — para campos (intervalos, pareamentos) que exigem string não nula. */
function instante(minutosAtras: number): string {
  return new Date(Date.parse(T) - minutosAtras * 60_000).toISOString();
}

function agente(
  agent: string,
  dose: { value: number; unit: string } | null,
  sustainedMinutes: number,
): SofaVasoactiveAgentObservation {
  return {
    agent,
    dose,
    sustainedMinutes,
    lastConfirmedAt: instante(10),
    provenance: PROC,
  };
}

// ---------------------------------------------------------------------------
// Ramos de integridade SEM COBERTURA: tempo clínico ausente (DOM-0009)
// ---------------------------------------------------------------------------

describe("mutantes — tempo clínico ausente por insumo (missing_clinical_time)", () => {
  const casos: readonly {
    readonly nome: string;
    readonly entrada: SofaEvaluationInput;
    readonly componente: "resp" | "coag" | "liver" | "cv" | "cns" | "renal";
  }[] = [
    { nome: "pao2", componente: "resp", entrada: entrada({ pao2: [semTempo(q(96, "mm[Hg]"))] }) },
    { nome: "fio2", componente: "resp", entrada: entrada({ fio2: [semTempo(q(0.21, "1"))] }) },
    {
      nome: "plaquetas",
      componente: "coag",
      entrada: entrada({ platelets: [semTempo(q(250, "10*3/uL"))] }),
    },
    {
      nome: "bilirrubina",
      componente: "liver",
      entrada: entrada({ bilirubin: [semTempo(q(0.6, "mg/dL"))] }),
    },
    {
      nome: "creatinina",
      componente: "renal",
      entrada: entrada({ creatinine: [semTempo(q(0.8, "mg/dL"))] }),
    },
    { nome: "gcs", componente: "cns", entrada: entrada({ gcsTotal: semTempo(q(15, "{score}")) }) },
    {
      nome: "pam medida",
      componente: "cv",
      entrada: entrada({
        map: { kind: "measured", value: 85, unit: "mm[Hg]", effectiveTime: null, provenance: PROC },
      }),
    },
    {
      nome: "pam derivada — sbp",
      componente: "cv",
      entrada: entrada({
        map: { kind: "derivedFromSbpDbp", sbp: semTempo(q(90, "mm[Hg]")), dbp: q(60, "mm[Hg]") },
      }),
    },
    {
      nome: "pam derivada — dbp",
      componente: "cv",
      entrada: entrada({
        map: { kind: "derivedFromSbpDbp", sbp: q(90, "mm[Hg]"), dbp: semTempo(q(60, "mm[Hg]")) },
      }),
    },
    {
      nome: "débito urinário — fim do intervalo",
      componente: "renal",
      entrada: entrada({
        creatinine: [],
        urineOutput24h: {
          value: 1800,
          unit: "mL",
          intervalStart: instante(0),
          intervalEnd: null,
          provenance: PROC,
        } as unknown as SofaUrineOutputObservation,
      }),
    },
  ];
  for (const c of casos) {
    it(`${c.nome} sem tempo clínico → missing_clinical_time`, () => {
      const record = evaluateSofa(c.entrada);
      expect(record.status).toBe("not_evaluated");
      expect(componente(record, c.componente).reason).toBe(
        `missing_clinical_time:${
          {
            resp: "respiration",
            coag: "coagulation",
            liver: "liver",
            cv: "cardiovascular",
            cns: "cns",
            renal: "renal",
          }[c.componente]
        }`,
      );
      expect(componente(record, c.componente).explanation).toContain(
        "sem tempo clínico utilizável",
      );
      expect(componente(record, c.componente).explanation).toContain(
        "nunca se assume 'agora' (DOM-0009)",
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Ramos de integridade SEM COBERTURA: quarentena por insumo (duas dimensões)
// ---------------------------------------------------------------------------

describe("mutantes — fonte em quarentena por insumo (quarantined_input)", () => {
  const quarantined = { sourceSystem: "SYNTH-x", sourceDataQuality: "quarantined" } as const;
  const casos: readonly {
    readonly nome: string;
    readonly entrada: SofaEvaluationInput;
    readonly componente: "resp" | "coag" | "liver" | "cv" | "cns" | "renal";
  }[] = [
    {
      nome: "pao2",
      componente: "resp",
      entrada: entrada({ pao2: [{ ...q(96, "mm[Hg]"), provenance: quarantined }] }),
    },
    {
      nome: "fio2",
      componente: "resp",
      entrada: entrada({ fio2: [{ ...q(0.21, "1"), provenance: quarantined }] }),
    },
    {
      nome: "bilirrubina",
      componente: "liver",
      entrada: entrada({ bilirubin: [{ ...q(0.6, "mg/dL"), provenance: quarantined }] }),
    },
    {
      nome: "creatinina",
      componente: "renal",
      entrada: entrada({ creatinine: [{ ...q(0.8, "mg/dL"), provenance: quarantined }] }),
    },
    {
      nome: "gcs",
      componente: "cns",
      entrada: entrada({ gcsTotal: { ...q(15, "{score}"), provenance: quarantined } }),
    },
    {
      nome: "pam medida",
      componente: "cv",
      entrada: entrada({
        map: {
          kind: "measured",
          value: 85,
          unit: "mm[Hg]",
          effectiveTime: q(0, "mm[Hg]", 10).effectiveTime,
          provenance: quarantined,
        },
      }),
    },
    {
      nome: "pam derivada — sbp",
      componente: "cv",
      entrada: entrada({
        map: {
          kind: "derivedFromSbpDbp",
          sbp: { ...q(90, "mm[Hg]"), provenance: quarantined },
          dbp: q(60, "mm[Hg]"),
        },
      }),
    },
    {
      nome: "débito urinário",
      componente: "renal",
      entrada: entrada({
        creatinine: [],
        urineOutput24h: {
          value: 1800,
          unit: "mL",
          intervalStart: instante(0),
          intervalEnd: instante(10),
          provenance: quarantined,
        },
      }),
    },
  ];
  for (const c of casos) {
    it(`${c.nome} em quarentena → quarantined_input`, () => {
      const record = evaluateSofa(c.entrada);
      expect(record.status).toBe("not_evaluated");
      const longo = {
        resp: "respiration",
        coag: "coagulation",
        liver: "liver",
        cv: "cardiovascular",
        cns: "cns",
        renal: "renal",
      }[c.componente];
      expect(componente(record, c.componente).reason).toBe(`quarantined_input:${longo}`);
      expect(componente(record, c.componente).explanation).toContain("fonte em quarentena");
      expect(componente(record, c.componente).explanation).toContain("jamais contribui");
    });
  }

  it("agente vasoativo de fonte em quarentena → quarantined_input:cardiovascular", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "norepinephrine",
            dose: { value: 0.5, unit: "ug/kg/min" },
            sustainedMinutes: 120,
            lastConfirmedAt: q(0, "", 10).effectiveTime,
            provenance: quarantined,
          },
        ],
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "cv").reason).toBe("quarantined_input:cardiovascular");
  });
});

// ---------------------------------------------------------------------------
// Ramos SEM COBERTURA: valor não finito e faixa plausível por insumo
// ---------------------------------------------------------------------------

describe("mutantes — valor não finito e faixa plausível (implausible_value)", () => {
  const casos: readonly {
    readonly nome: string;
    readonly entrada: SofaEvaluationInput;
    readonly componente: "resp" | "coag" | "liver" | "cv" | "cns" | "renal";
    readonly motivo: string;
  }[] = [
    {
      nome: "pao2 não finito",
      componente: "resp",
      motivo: "implausible_value:respiration",
      entrada: entrada({ pao2: [q(Number.NaN, "mm[Hg]")] }),
    },
    {
      nome: "pao2 abaixo da faixa (29)",
      componente: "resp",
      motivo: "implausible_value:respiration",
      entrada: entrada({ pao2: [q(29, "mm[Hg]")] }),
    },
    {
      nome: "pao2 acima da faixa (701)",
      componente: "resp",
      motivo: "implausible_value:respiration",
      entrada: entrada({ pao2: [q(701, "mm[Hg]")] }),
    },
    {
      nome: "plaquetas não finito",
      componente: "coag",
      motivo: "implausible_value:coagulation",
      entrada: entrada({ platelets: [q(Number.NaN, "10*3/uL")] }),
    },
    {
      nome: "plaquetas acima da faixa (2001)",
      componente: "coag",
      motivo: "implausible_value:coagulation",
      entrada: entrada({ platelets: [q(2001, "10*3/uL")] }),
    },
    {
      nome: "bilirrubina não finito",
      componente: "liver",
      motivo: "implausible_value:liver",
      entrada: entrada({ bilirubin: [q(Number.NaN, "mg/dL")] }),
    },
    {
      nome: "bilirrubina abaixo (0.05)",
      componente: "liver",
      motivo: "implausible_value:liver",
      entrada: entrada({ bilirubin: [q(0.05, "mg/dL")] }),
    },
    {
      nome: "bilirrubina acima (61)",
      componente: "liver",
      motivo: "implausible_value:liver",
      entrada: entrada({ bilirubin: [q(61, "mg/dL")] }),
    },
    {
      nome: "creatinina abaixo (0.05)",
      componente: "renal",
      motivo: "implausible_value:renal",
      entrada: entrada({ creatinine: [q(0.05, "mg/dL")] }),
    },
    {
      nome: "creatinina acima (26)",
      componente: "renal",
      motivo: "implausible_value:renal",
      entrada: entrada({ creatinine: [q(26, "mg/dL")] }),
    },
    {
      nome: "FiO2 fração fora (0.1)",
      componente: "resp",
      motivo: "implausible_value:respiration",
      entrada: entrada({ fio2: [q(0.1, "1")] }),
    },
    {
      nome: "FiO2 % acima de 100",
      componente: "resp",
      motivo: "implausible_value:respiration",
      entrada: entrada({ fio2: [q(150, "%")] }),
    },
  ];
  for (const c of casos) {
    it(`${c.nome} → ${c.motivo}`, () => {
      const record = evaluateSofa(c.entrada);
      expect(record.status).toBe("invalid");
      expect(componente(record, c.componente).reason).toBe(c.motivo);
      expect(componente(record, c.componente).status).toBe("invalid");
    });
  }

  it("PAM medida fora da faixa (19 / 201) → implausible_value:cardiovascular", () => {
    for (const valor of [19, 201]) {
      const record = evaluateSofa(
        entrada({
          map: {
            kind: "measured",
            value: valor,
            unit: "mm[Hg]",
            effectiveTime: q(0, "mm[Hg]", 10).effectiveTime,
            provenance: PROC,
          },
        }),
      );
      expect(record.status, String(valor)).toBe("invalid");
      expect(componente(record, "cv").reason).toBe("implausible_value:cardiovascular");
    }
  });

  it("PAM derivada fora da faixa → implausible_value:cardiovascular", () => {
    const record = evaluateSofa(
      entrada({ map: { kind: "derivedFromSbpDbp", sbp: q(20, "mm[Hg]"), dbp: q(10, "mm[Hg]") } }),
    );
    expect(record.status).toBe("invalid");
    expect(componente(record, "cv").reason).toBe("implausible_value:cardiovascular");
  });

  it("débito urinário negativo ou acima de 10000 → implausible_value:renal; não finito idem", () => {
    for (const valor of [-1, 10001, Number.NaN]) {
      const record = evaluateSofa(
        entrada({
          creatinine: [],
          urineOutput24h: {
            value: valor,
            unit: "mL",
            intervalStart: instante(0),
            intervalEnd: instante(10),
            provenance: PROC,
          },
        }),
      );
      expect(record.status, String(valor)).toBe("invalid");
      expect(componente(record, "renal").reason).toBe("implausible_value:renal");
    }
  });

  it("dose não finita → unmappable_unit:cardiovascular (caminho de leitura de dose)", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "dopamine",
            dose: { value: Number.NaN, unit: "ug/kg/min" },
            sustainedMinutes: 120,
            lastConfirmedAt: q(0, "", 10).effectiveTime,
            provenance: PROC,
          },
        ],
      }),
    );
    expect(record.status).toBe("invalid");
    expect(componente(record, "cv").reason).toBe("unmappable_unit:cardiovascular");
  });

  it("dose fora da faixa por agente: dobutamine 41 e epinephrine 0.005 → implausible_value:cardiovascular", () => {
    for (const [agente, valor] of [
      ["dobutamine", 41],
      ["epinephrine", 0.005],
      ["norepinephrine", 6],
    ] as const) {
      const record = evaluateSofa(
        entrada({
          vasoactiveAgents: [
            {
              agent: agente,
              dose: { value: valor, unit: "ug/kg/min" },
              sustainedMinutes: 120,
              lastConfirmedAt: q(0, "", 10).effectiveTime,
              provenance: PROC,
            },
          ],
        }),
      );
      expect(record.status, `${agente} ${valor}`).toBe("invalid");
      expect(componente(record, "cv").reason).toBe("implausible_value:cardiovascular");
    }
  });
});

// ---------------------------------------------------------------------------
// Ramos SEM COBERTURA: unidades e domínios de GCS/PAM/suporte
// ---------------------------------------------------------------------------

describe("mutantes — unidades e domínios (unmappable_unit / out_of_range)", () => {
  it("GCS com unidade '1' é aceita (UCUM adimensional); unidade estranha → unmappable_unit:cns", () => {
    const aceita = evaluateSofa(entrada({ gcsTotal: q(15, "1", 180) }));
    expect(componente(aceita, "cns").status).toBe("valid");

    const rejeitada = evaluateSofa(entrada({ gcsTotal: q(15, "{bpm}", 180) }));
    expect(rejeitada.status).toBe("invalid");
    expect(componente(rejeitada, "cns").reason).toBe("unmappable_unit:cns");
  });

  it("débito urinário com unidade != mL → unmappable_unit:renal", () => {
    const record = evaluateSofa(
      entrada({
        creatinine: [],
        urineOutput24h: {
          value: 1800,
          unit: "L/24h",
          intervalStart: instante(0),
          intervalEnd: instante(10),
          provenance: PROC,
        },
      }),
    );
    expect(record.status).toBe("invalid");
    expect(componente(record, "renal").reason).toBe("unmappable_unit:renal");
  });

  it("PAM medida com unidade != mm[Hg] → unmappable_unit:cardiovascular; derivada com PAS/PAD erradas idem", () => {
    const medida = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: 85,
          unit: "kPa",
          effectiveTime: q(0, "mm[Hg]", 10).effectiveTime,
          provenance: PROC,
        },
      }),
    );
    expect(medida.status).toBe("invalid");
    expect(componente(medida, "cv").reason).toBe("unmappable_unit:cardiovascular");

    const derivada = evaluateSofa(
      entrada({ map: { kind: "derivedFromSbpDbp", sbp: q(90, "kPa"), dbp: q(60, "mm[Hg]") } }),
    );
    expect(derivada.status).toBe("invalid");
    expect(componente(derivada, "cv").reason).toBe("unmappable_unit:cardiovascular");
  });

  it("P/F < 200 com suporte fora da contemporaneidade de 1 h do espécime → stale_input:respiration", () => {
    const record = evaluateSofa(
      entrada({
        pao2: [q(52.5, "mm[Hg]", 240)],
        fio2: [q(0.35, "1", 240)],
        respiratorySupportStatus: {
          value: "invasive_mechanical_ventilation",
          effectiveTime: q(0, "", 10).effectiveTime,
          provenance: PROC,
        },
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "resp").status).toBe("stale");
    expect(componente(record, "resp").reason).toBe("stale_input:respiration");
    expect(componente(record, "resp").explanation).toContain("fora da contemporaneidade de 1 h");
  });

  it("instante de avaliação inválido → not_evaluated(unspecified_condition), sem total", () => {
    const record = evaluateSofa(entrada({ evaluationTime: "não-é-instante" }));
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["unspecified_condition"]);
    expect(record.total).toBeNull();
    expect(record.explanation).toContain("Escore SOFA: não avaliado");
  });
});

// ---------------------------------------------------------------------------
// Ramos SEM COBERTURA: recência de confirmação de dose e janelas do agente
// ---------------------------------------------------------------------------

describe("mutantes — recência da confirmação de dose (janela 2 h / expiração 4 h)", () => {
  it("confirmação entre 2 h e 4 h → stale_input:cardiovascular", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "norepinephrine",
            dose: { value: 0.5, unit: "ug/kg/min" },
            sustainedMinutes: 240,
            lastConfirmedAt: new Date(Date.parse(T) - 3 * 3_600_000).toISOString(),
            provenance: PROC,
          },
        ],
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "cv").status).toBe("stale");
    expect(componente(record, "cv").reason).toBe("stale_input:cardiovascular");
  });

  it("confirmação além de 4 h → expired_input:cardiovascular", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "norepinephrine",
            dose: { value: 0.5, unit: "ug/kg/min" },
            sustainedMinutes: 240,
            lastConfirmedAt: new Date(Date.parse(T) - 5 * 3_600_000).toISOString(),
            provenance: PROC,
          },
        ],
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "cv").reason).toBe("expired_input:cardiovascular");
  });

  it("lastConfirmedAt null: o registro de administração é a evidência — escora da dose sem checar recência", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "norepinephrine",
            dose: { value: 0.5, unit: "ug/kg/min" },
            sustainedMinutes: 240,
            lastConfirmedAt: null,
            provenance: PROC,
          },
        ],
      }),
    );
    expect(record.status).toBe("valid");
    expect(componente(record, "cv").score).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Ramos SEM COBERTURA: gate de sedação — domínio e janela interrompida
// ---------------------------------------------------------------------------

describe("mutantes — domínio de RASS e janela interrompida documentada", () => {
  it("RASS fora do domínio (−6, +5, 0.5) → sedation_state_unknown (nunca clampado)", () => {
    for (const valor of [-6, 5, 0.5]) {
      const record = evaluateSofa(
        entrada({
          rass: { value: valor, effectiveTime: q(0, "", 180).effectiveTime, provenance: PROC },
        }),
      );
      expect(record.status, String(valor)).toBe("not_evaluated");
      expect(componente(record, "cns").reason).toBe("sedation_state_unknown:cns");
    }
  });

  it("RASS ≤ −3 com janela de interrupção DOCUMENTADA → sedation_confounded (refinamento A28-1: só ausência documentada escora)", () => {
    const record = evaluateSofa(
      entrada({
        gcsTotal: q(3, "{score}", 180),
        rass: { value: -4, effectiveTime: q(0, "", 180).effectiveTime, provenance: PROC },
        sedativeExposure: "interrupted_window_documented",
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "cns").reason).toBe("sedation_confounded:cns");
    expect(componente(record, "cns").explanation).toContain("indistinguível de sedação profunda");
  });

  it("RASS sem tempo clínico → não pareado → sedation_state_unknown", () => {
    const record = evaluateSofa(
      entrada({ rass: { value: 0, effectiveTime: null, provenance: PROC } }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "cns").reason).toBe("sedation_state_unknown:cns");
  });
});

// ---------------------------------------------------------------------------
// Precedência de falhas no renal e flags exatos
// ---------------------------------------------------------------------------

describe("mutantes — precedência de falhas no renal e flags de máquina", () => {
  it("creatinina inválida + débito stale → invalid vence (precedência P-a entre critérios)", () => {
    const record = evaluateSofa(
      entrada({
        creatinine: [q(0.05, "mg/dL", 10)],
        urineOutput24h: {
          value: 1800,
          unit: "mL",
          intervalStart: new Date(Date.parse(T) - 30 * 3_600_000).toISOString(),
          intervalEnd: new Date(Date.parse(T) - 6 * 3_600_000).toISOString(),
          provenance: PROC,
        },
      }),
    );
    expect(record.status).toBe("invalid");
    expect(componente(record, "renal").reason).toBe("implausible_value:renal");
  });

  it("flags exatas: parcial renal declarado carrega renal_declared_partial + urine_output_not_assessed; TSR soma on_rrt", () => {
    const parcial = evaluateSofa(
      entrada({ creatinine: [q(1.0, "mg/dL", 10)], urineOutput24h: null }),
    );
    expect(componente(parcial, "renal").flags).toEqual([
      "renal_declared_partial",
      "urine_output_not_assessed",
    ]);

    const parcialTsr = evaluateSofa(
      entrada({
        creatinine: [q(1.0, "mg/dL", 10)],
        urineOutput24h: null,
        onRenalReplacementTherapy: true,
      }),
    );
    expect(componente(parcialTsr, "renal").flags).toEqual([
      "renal_declared_partial",
      "on_rrt",
      "urine_output_not_assessed",
    ]);

    const validoTsr = evaluateSofa(entrada({ onRenalReplacementTherapy: true }));
    expect(componente(validoTsr, "renal").flags).toEqual(["on_rrt"]);
    expect(componente(validoTsr, "renal").explanation).toContain("pior-critério-disponível");
  });

  it("flags exatas do cardiovascular: piso, não tabelado, provisório — combinados", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "vasopressin",
            dose: { value: 0.04, unit: "U/min" },
            sustainedMinutes: 30,
            lastConfirmedAt: q(0, "", 10).effectiveTime,
            provenance: PROC,
          },
          {
            agent: "dopamine",
            dose: null,
            sustainedMinutes: 30,
            lastConfirmedAt: q(0, "", 10).effectiveTime,
            provenance: PROC,
          },
        ],
      }),
    );
    expect(componente(record, "cv").flags).toEqual([
      "vasoactive_agent_untabulated",
      "dose_missing_agent_presence_floor",
      "provisional_infusion_lt_1h",
    ]);
    expect(componente(record, "cv").score).toBe(3);
  });

  it("flags de conversão de unidade por componente (unit_conversion_applied)", () => {
    const liver = evaluateSofa(entrada({ bilirubin: [q(34, "umol/L", 360)] }));
    expect(componente(liver, "liver").flags).toEqual(["unit_conversion_applied"]);
    expect(liver.annotations).toContain("conversão de unidade aplicada: umol/L → mg/dL (÷17,104)");

    const renal = evaluateSofa(
      entrada({ creatinine: [q(70, "umol/L", 360)], urineOutput24h: null }),
    );
    expect(componente(renal, "renal").score).toBe(0);
    expect(renal.annotations).toContain(
      "conversão de unidade aplicada: creatinina umol/L → mg/dL (÷88,42)",
    );

    const resp = evaluateSofa(entrada({ fio2: [q(40, "%", 240)] }));
    expect(resp.annotations).toContain("conversão de unidade aplicada: FiO2 % → fração (÷100)");
  });
});

// ---------------------------------------------------------------------------
// Anotações obrigatórias — literais exatos (matadores de string)
// ---------------------------------------------------------------------------

describe("mutantes — anotações obrigatórias (literais exatos, GDEC-0007)", () => {
  it("limitação terapêutica: literal integral", () => {
    const record = evaluateSofa(entrada({ treatmentLimitationOrderDocumented: true }));
    expect(record.annotations).toContain(
      "escalonamento suprimido — ordem de limitação terapêutica documentada (HAZ-0044)",
    );
  });

  it("TSR: literal integral", () => {
    const record = evaluateSofa(entrada({ onRenalReplacementTherapy: true }));
    expect(record.annotations).toContain(
      "em TSR — creatinina sob terapia renal substitutiva não reflete a função renal nativa",
    );
  });

  it("PAM derivada: literal integral", () => {
    const record = evaluateSofa(
      entrada({ map: { kind: "derivedFromSbpDbp", sbp: q(90, "mm[Hg]"), dbp: q(60, "mm[Hg]") } }),
    );
    expect(record.annotations).toContain(
      "PAM derivada de PAS/PAD ((PAS + 2×PAD)/3) — fallback admitido por OQ-9 (a)",
    );
  });

  it("agente não tabelado: literal integral", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "phenylephrine",
            dose: { value: 1, unit: "ug/kg/min" },
            sustainedMinutes: 120,
            lastConfirmedAt: q(0, "", 10).effectiveTime,
            provenance: PROC,
          },
        ],
      }),
    );
    expect(record.annotations).toContain(
      "agente vasoativo não tabelado — piso CV 3; mapeamento com fonte VALIDATION REQUIRED",
    );
  });

  it("provisório: literal exato 'provisório — infusão <1h'", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "epinephrine",
            dose: { value: 0.05, unit: "ug/kg/min" },
            sustainedMinutes: 45,
            lastConfirmedAt: q(0, "", 10).effectiveTime,
            provenance: PROC,
          },
        ],
      }),
    );
    expect(record.annotations).toContain("provisório — infusão <1h");
  });

  it("pisos por dose ausente: literais exatos por agente (dobutamina/dopamina/noradrenalina/adrenalina)", () => {
    const esperados: readonly { readonly agente: string; readonly literal: string }[] = [
      {
        agente: "dobutamine",
        literal:
          "dose de dobutamina ausente — piso 2 pela presença do agente; qualquer dose de dobutamina é banda 2",
      },
      {
        agente: "dopamine",
        literal:
          "dose de dopamina ausente — piso 2 pela presença do agente; dose necessária para distinguir bandas 2/3/4",
      },
      {
        agente: "norepinephrine",
        literal:
          "dose de noradrenalina ausente — piso 3 pela presença do agente; dose necessária para distinguir banda 3 de 4",
      },
      {
        agente: "epinephrine",
        literal:
          "dose de adrenalina ausente — piso 3 pela presença do agente; dose necessária para distinguir banda 3 de 4",
      },
    ];
    for (const e of esperados) {
      const record = evaluateSofa(
        entrada({
          vasoactiveAgents: [
            {
              agent: e.agente,
              dose: null,
              sustainedMinutes: 120,
              lastConfirmedAt: q(0, "", 10).effectiveTime,
              provenance: PROC,
            },
          ],
        }),
      );
      expect(record.annotations, e.agente).toContain(e.literal);
    }
  });

  it("disfunção crônica documentada: anotação carrega a nota e nega agudeza", () => {
    const record = evaluateSofa(entrada({ chronicOrganDysfunctionNote: "cirrose Child B" }));
    expect(record.annotations).toContain(
      "disfunção orgânica crônica documentada: cirrose Child B — o escore não afirma agudeza",
    );
  });
});

// ---------------------------------------------------------------------------
// Templates pt-BR de explicação (§7) — fragmentos literais
// ---------------------------------------------------------------------------

describe("mutantes — templates de explicação (§7)", () => {
  it("total válido: todos os blocos fixos presentes", () => {
    const record = evaluateSofa(entrada({}));
    expect(record.explanation).toContain("Escore SOFA 0 de 24 — regra RULE-SOFA v0.2.0.");
    expect(record.explanation).toContain(
      "Janela de avaliação: as 24 horas até 2026-08-15T12:00:00-03:00.",
    );
    expect(record.explanation).toContain("Componentes: ");
    expect(record.explanation).toContain("Insumo contribuinte mais antigo:");
    expect(record.explanation).toContain(
      "O SOFA descreve disfunção orgânica; não é, por si só, diagnóstico de sepse e não distingue disfunção aguda de crônica.",
    );
    expect(record.explanation).toContain(
      "Informação de apoio à decisão da equipe assistente — não é uma diretriz e não determina conduta.",
    );
  });

  it("total válido com total 24: interpolação do total", () => {
    const maxima = evaluateSofa(
      entrada({
        pao2: [q(60, "mm[Hg]", 240)],
        fio2: [q(1.0, "1", 240)],
        respiratorySupportStatus: {
          value: "invasive_mechanical_ventilation",
          effectiveTime: q(0, "", 240).effectiveTime,
          provenance: PROC,
        },
        platelets: [q(10, "10*3/uL", 360)],
        bilirubin: [q(15, "mg/dL", 360)],
        vasoactiveAgents: [
          {
            agent: "norepinephrine",
            dose: { value: 0.5, unit: "ug/kg/min" },
            sustainedMinutes: 180,
            lastConfirmedAt: q(0, "", 10).effectiveTime,
            provenance: PROC,
          },
        ],
        gcsTotal: q(3, "{score}", 180),
        rass: { value: -5, effectiveTime: q(0, "", 180).effectiveTime, provenance: PROC },
        creatinine: [q(6, "mg/dL", 360)],
        urineOutput24h: {
          value: 100,
          unit: "mL",
          intervalStart: new Date(Date.parse(T) - 26 * 3_600_000).toISOString(),
          intervalEnd: new Date(Date.parse(T) - 2 * 3_600_000).toISOString(),
          provenance: PROC,
        },
      }),
    );
    expect(maxima.total).toBe(24);
    expect(maxima.explanation).toContain("Escore SOFA 24 de 24 — regra RULE-SOFA v0.2.0.");
  });

  it("total inválido: blocos fixos + razão interpolada", () => {
    const record = evaluateSofa(entrada({ platelets: [q(0, "10*3/uL", 360)] }));
    expect(record.status).toBe("invalid");
    expect(record.explanation).toContain(
      "Escore SOFA: inválido — falha de integridade de dado detectada (implausible_value:coagulation).",
    );
    expect(record.explanation).toContain(
      "Nenhuma pontuação existe para este paciente neste momento; a ausência de pontuação não significa normalidade.",
    );
    expect(record.explanation).toContain(
      "Os sistemas avaliáveis são exibidos individualmente com seu próprio status. Informação de apoio apenas. regra RULE-SOFA v0.2.0.",
    );
  });

  it("total não avaliado: blocos fixos + razões interpoladas duas vezes", () => {
    const record = evaluateSofa(entrada({ gcsTotal: null, rass: null }));
    expect(record.explanation).toContain(
      "Escore SOFA: não avaliado. O total não foi calculado porque: missing_required_input:cns.",
    );
    expect(record.explanation).toContain(
      "Nenhum número é exibido porque um total calculado sem esses sistemas orgânicos poderia gerar falsa tranquilidade.",
    );
    expect(record.explanation).toContain(
      "O que falta para completar a avaliação: missing_required_input:cns.",
    );
    expect(record.explanation).toContain("Informação de apoio apenas. regra RULE-SOFA v0.2.0.");
  });

  it("explicação por componente: fragmentos por caminho", () => {
    const normal = evaluateSofa(entrada({}));
    expect(componente(normal, "resp").explanation).toContain(
      "PaO2/FiO2 457.143 mm[Hg] → 0 ponto(s)",
    );
    expect(componente(normal, "coag").explanation).toContain("plaquetas 250 ×10³/µL → 0 ponto(s)");
    expect(componente(normal, "liver").explanation).toContain("bilirrubina 0.6 mg/dL → 0 ponto(s)");
    expect(componente(normal, "cv").explanation).toContain(
      "PAM 85 mm[Hg] sem vasoativo ativo → 0 ponto(s)",
    );
    expect(componente(normal, "cns").explanation).toContain(
      "GCS 15 com RASS pareado 0 (≥ −2, testável) → 0 ponto(s)",
    );
    expect(componente(normal, "renal").explanation).toContain("pior-critério-disponível");
    expect(componente(normal, "renal").explanation).toContain(
      "componente = max → 0 ponto(s) (I-7, OQ-7 (b))",
    );

    const parcial = evaluateSofa(entrada({ urineOutput24h: null }));
    expect(componente(parcial, "renal").explanation).toContain("PARCIAL DECLARADO");
    expect(componente(parcial, "renal").explanation).toContain("LIMITE INFERIOR");
    expect(componente(parcial, "renal").explanation).toContain("distingue da D-16 legado");

    const pamDerivada = evaluateSofa(
      entrada({ map: { kind: "derivedFromSbpDbp", sbp: q(90, "mm[Hg]"), dbp: q(60, "mm[Hg]") } }),
    );
    expect(componente(pamDerivada, "cv").explanation).toContain(
      "PAM 70 mm[Hg] sem vasoativo ativo → 0 ponto(s)",
    );

    const doseBanda = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "dopamine",
            dose: { value: 2, unit: "ug/kg/min" },
            sustainedMinutes: 120,
            lastConfirmedAt: q(0, "", 10).effectiveTime,
            provenance: PROC,
          },
        ],
      }),
    );
    expect(componente(doseBanda, "cv").explanation).toContain(
      "max de tiers e pisos; bandas 2-4 não referenciam PAM — D-07 corrigido",
    );

    const naoPareado = evaluateSofa(entrada({ rass: null }));
    expect(componente(naoPareado, "cns").explanation).toContain(
      "FAIL-CLOSED por decisão conjunta GDEC-0007 OQ-8 (b) / ADR-0028 A28-2",
    );

    const confundido = evaluateSofa(entrada({ sedativeExposure: "active_infusion" }));
    expect(componente(confundido, "cns").explanation).toContain(
      "infusão sedativa ativa sem janela de interrupção documentada",
    );

    const ecmo = evaluateSofa(entrada({ ecmo: true }));
    expect(componente(ecmo, "resp").explanation).toContain(
      "P/F não interpretável em oxigenação por membrana extracorpórea (VV-ECMO)",
    );

    const respInvalido = evaluateSofa(entrada({ fio2: [q(40, "", 240)] }));
    expect(componente(respInvalido, "resp").explanation).toContain(
      "falha de integridade do dado — o valor ofensor nunca é descartado silenciosamente",
    );

    const coagAusente = evaluateSofa(entrada({ platelets: [] }));
    expect(componente(coagAusente, "coag").explanation).toContain(
      "insumo ausente — nenhum valor foi aferido; ausência NUNCA é tratada como normal (HAZ-0005)",
    );

    const labStale = evaluateSofa(entrada({ creatinine: [q(0.8, "mg/dL", 30 * 60)] }));
    expect(componente(labStale, "renal").explanation).toContain(
      "fora da janela de atualidade, dentro da expiração",
    );

    const labExpirado = evaluateSofa(entrada({ creatinine: [q(0.8, "mg/dL", 50 * 60)] }));
    expect(componente(labExpirado, "renal").explanation).toContain(
      "além do horizonte de expiração",
    );

    const conflito = evaluateSofa(
      entrada({ platelets: [q(40, "10*3/uL", 360), { ...q(400, "10*3/uL", 360) }] }),
    );
    expect(componente(conflito, "coag").explanation).toContain(
      "falha de integridade do dado — o valor ofensor nunca é descartado silenciosamente",
    );

    const curto = evaluateSofa(entrada({ age: { kind: "unknown" } }));
    expect(componente(curto, "resp").explanation).toContain(
      "nenhuma lógica de regra executou (gate pré-avaliação, ADR-0027)",
    );
    expect(componente(curto, "renal").explanation).toContain(
      "idade desconhecida — nunca se presume adulto (HAZ-0036)",
    );

    const menor = evaluateSofa(entrada({ age: { kind: "verified", years: 17 } }));
    expect(componente(menor, "coag").explanation).toContain(
      "idade verificada abaixo de 18 anos — instrumento adulto (VAL-0006/VAL-0007)",
    );
  });

  it("população reprovada: populationGate do registro reflete o gate e noFireReason out_of_population_scope", () => {
    const desconhecida = evaluateSofa(entrada({ age: { kind: "unknown" } }));
    expect(desconhecida.populationGate).toEqual({ passed: false, reason: "unknown_age" });
    expect(desconhecida.noFireReason).toBe("out_of_population_scope");

    const menor = evaluateSofa(entrada({ age: { kind: "verified", years: 17 } }));
    expect(menor.populationGate).toEqual({ passed: false, reason: "under_age" });

    const normal = evaluateSofa(entrada({}));
    expect(normal.populationGate).toEqual({ passed: true, reason: null });
  });

  it("primaryReason é a primeira razão em ordem canônica; null sob legível", () => {
    const multi = evaluateSofa(entrada({ platelets: [], gcsTotal: null, rass: null }));
    expect(multi.primaryReason).toBe("missing_required_input:coag");

    const legivel = evaluateSofa(entrada({}));
    expect(legivel.primaryReason).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Ordem canônica de componentes (tipos.ts) — literais exatos
// ---------------------------------------------------------------------------

describe("mutantes — ordem canônica SOFA_COMPONENT_ORDER", () => {
  it("é exatamente [resp, coag, liver, cv, cns, renal], nesta ordem", () => {
    expect(SOFA_COMPONENT_ORDER).toEqual(["resp", "coag", "liver", "cv", "cns", "renal"]);
    expect(evaluateSofa(entrada({})).components.map((c) => c.component)).toEqual([
      "resp",
      "coag",
      "liver",
      "cv",
      "cns",
      "renal",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Terceira onda — bordas de janela EXATAS, pareamentos no limite, seleção
// pior-valor com desempate, sinônimos pt-BR e fragmentos ainda vivos.
// ---------------------------------------------------------------------------

describe("mutantes — bordas exatas de janela e pareamento (limites INCLUSIVOS)", () => {
  it("laboratório EXATAMENTE na borda da janela (1440 min) → fresco; 1441 → stale; exatamente na expiração (2880) → stale; 2881 → expired", () => {
    const naBorda = evaluateSofa(entrada({ creatinine: [q(0.8, "mg/dL", 1440)] }));
    expect(naBorda.status).toBe("valid");

    const aposBorda = evaluateSofa(entrada({ creatinine: [q(0.8, "mg/dL", 1441)] }));
    expect(aposBorda.status).toBe("not_evaluated");
    expect(componente(aposBorda, "renal").reason).toBe("stale_input:renal");

    const naExpiracao = evaluateSofa(
      entrada({ creatinine: [q(0.8, "mg/dL", 2880)], urineOutput24h: null }),
    );
    expect(componente(naExpiracao, "renal").reason).toBe("stale_input:renal");

    const alemExpiracao = evaluateSofa(
      entrada({ creatinine: [q(0.8, "mg/dL", 2881)], urineOutput24h: null }),
    );
    expect(componente(alemExpiracao, "renal").reason).toBe("expired_input:renal");
  });

  it("PAM exatamente a 240 min → fresco; 241 → stale; 480 → stale; 481 → expired", () => {
    const borda = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: 85,
          unit: "mm[Hg]",
          effectiveTime: instante(240),
          provenance: PROC,
        },
      }),
    );
    expect(borda.status).toBe("valid");
    const stale = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: 85,
          unit: "mm[Hg]",
          effectiveTime: instante(241),
          provenance: PROC,
        },
      }),
    );
    expect(componente(stale, "cv").reason).toBe("stale_input:cardiovascular");
    const naExpiracao = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: 85,
          unit: "mm[Hg]",
          effectiveTime: instante(480),
          provenance: PROC,
        },
      }),
    );
    expect(componente(naExpiracao, "cv").reason).toBe("stale_input:cardiovascular");
    const expired = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: 85,
          unit: "mm[Hg]",
          effectiveTime: instante(481),
          provenance: PROC,
        },
      }),
    );
    expect(componente(expired, "cv").reason).toBe("expired_input:cardiovascular");
  });

  it("GCS exatamente a 720 min → fresco; 721 → stale; 1440 → stale; 1441 → expired", () => {
    const borda = evaluateSofa(
      entrada({
        gcsTotal: q(15, "{score}", 720),
        rass: { value: 0, effectiveTime: instante(720), provenance: PROC },
      }),
    );
    expect(componente(borda, "cns").status).toBe("valid");
    const stale = evaluateSofa(
      entrada({
        gcsTotal: q(15, "{score}", 721),
        rass: { value: 0, effectiveTime: instante(721), provenance: PROC },
      }),
    );
    expect(componente(stale, "cns").reason).toBe("stale_input:cns");
    const naExpiracao = evaluateSofa(
      entrada({
        gcsTotal: q(15, "{score}", 1440),
        rass: { value: 0, effectiveTime: instante(1440), provenance: PROC },
      }),
    );
    expect(componente(naExpiracao, "cns").reason).toBe("stale_input:cns");
    const expired = evaluateSofa(
      entrada({
        gcsTotal: q(15, "{score}", 1441),
        rass: { value: 0, effectiveTime: instante(1441), provenance: PROC },
      }),
    );
    expect(componente(expired, "cns").reason).toBe("expired_input:cns");
  });

  it("PaO2 além da expiração (48 h+) → expired_input:respiration; entre 24 e 48 h → stale_input:respiration", () => {
    const stale = evaluateSofa(entrada({ pao2: [q(96, "mm[Hg]", 36 * 60)] }));
    expect(componente(stale, "resp").reason).toBe("stale_input:respiration");
    const expired = evaluateSofa(entrada({ pao2: [q(96, "mm[Hg]", 49 * 60)] }));
    expect(componente(expired, "resp").reason).toBe("expired_input:respiration");
  });

  it("RASS pareado EXATAMENTE na borda de 60 min → pareado (janela inclusiva)", () => {
    const gcsT = instante(180);
    const record = evaluateSofa(
      entrada({
        rass: {
          value: 0,
          effectiveTime: new Date(Date.parse(gcsT) - 60 * 60_000).toISOString(),
          provenance: PROC,
        },
      }),
    );
    expect(componente(record, "cns").status).toBe("valid");
  });

  it("FiO2 pareada EXATAMENTE a 30 min do espécime → pareada", () => {
    const pao2T = instante(240);
    const record = evaluateSofa(
      entrada({
        pao2: [q(96, "mm[Hg]", 240)],
        fio2: [
          {
            value: 0.21,
            unit: "1",
            effectiveTime: new Date(Date.parse(pao2T) - 30 * 60_000).toISOString(),
            provenance: PROC,
          },
        ],
      }),
    );
    expect(componente(record, "resp").status).toBe("valid");
  });

  it("confirmação de dose EXATAMENTE a 120 min → fresca (janela inclusiva)", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "norepinephrine",
            dose: { value: 0.5, unit: "ug/kg/min" },
            sustainedMinutes: 240,
            lastConfirmedAt: instante(120),
            provenance: PROC,
          },
        ],
      }),
    );
    expect(record.status).toBe("valid");
    expect(componente(record, "cv").score).toBe(4);
  });

  it("intervalo de débito terminando EXATAMENTE a 4 h → fresco; a 8 h → stale; a 8 h + 1 min → expired", () => {
    const fresco = evaluateSofa(
      entrada({
        creatinine: [],
        urineOutput24h: {
          value: 1800,
          unit: "mL",
          intervalStart: instante(28 * 60),
          intervalEnd: instante(4 * 60),
          provenance: PROC,
        } as unknown as SofaUrineOutputObservation,
      }),
    );
    expect(componente(fresco, "renal").status).toBe("partial");
    const stale = evaluateSofa(
      entrada({
        creatinine: [],
        urineOutput24h: {
          value: 1800,
          unit: "mL",
          intervalStart: instante(32 * 60),
          intervalEnd: instante(8 * 60),
          provenance: PROC,
        } as unknown as SofaUrineOutputObservation,
      }),
    );
    expect(componente(stale, "renal").reason).toBe("stale_input:renal");
    const expired = evaluateSofa(
      entrada({
        creatinine: [],
        urineOutput24h: {
          value: 1800,
          unit: "mL",
          intervalStart: instante(33 * 60),
          intervalEnd: instante(8 * 60 + 1),
          provenance: PROC,
        } as unknown as SofaUrineOutputObservation,
      }),
    );
    expect(componente(expired, "renal").reason).toBe("expired_input:renal");
  });
});

describe("mutantes — pior-valor: desempates e pior-métrica (OQ-10 (a))", () => {
  it("duas creatininas na MESMA banda em tempos distintos → a mais RECENTE é exibida (desempate determinístico)", () => {
    const record = evaluateSofa(
      entrada({ creatinine: [q(1.0, "mg/dL", 60), q(1.0, "mg/dL", 120)], urineOutput24h: null }),
    );
    expect(componente(record, "renal").explanation).toContain("especime " + instante(60));
  });

  it("pior PaO2 (menor valor) prevalece entre dois espécimes frescos", () => {
    const record = evaluateSofa(
      entrada({
        pao2: [q(300, "mm[Hg]", 60), q(96, "mm[Hg]", 120)],
        fio2: [q(0.5, "1", 120)],
        respiratorySupportStatus: {
          value: "invasive_mechanical_ventilation",
          effectiveTime: instante(120),
          provenance: PROC,
        },
      }),
    );
    expect(componente(record, "resp").score).toBe(3);
    expect(componente(record, "resp").explanation).toContain("192");
  });
});

describe("mutantes — sinônimos pt-BR de vasopressor e fallback de nome", () => {
  it("noradrenalina/adrenalina (grafia pt-BR) normalizam para os agentes tabelados", () => {
    const r1 = evaluateSofa(
      entrada({
        vasoactiveAgents: [agente("noradrenalina", { value: 0.5, unit: "ug/kg/min" }, 120)],
      }),
    );
    const r2 = evaluateSofa(
      entrada({ vasoactiveAgents: [agente("adrenalina", { value: 0.5, unit: "ug/kg/min" }, 120)] }),
    );
    expect(componente(r1, "cv").score).toBe(4);
    expect(componente(r2, "cv").score).toBe(4);
  });

  it("maiusculas/espacos em torno do nome do agente são normalizados", () => {
    const record = evaluateSofa(
      entrada({ vasoactiveAgents: [agente("  DOPAMINE ", { value: 2, unit: "ug/kg/min" }, 120)] }),
    );
    expect(componente(record, "cv").score).toBe(2);
  });
});

describe("mutantes — fragmentos de explicação ainda vivos", () => {
  it("resp com apenas UM dos insumos ausentes → missing_required_input:resp", () => {
    const soPao2 = evaluateSofa(entrada({ fio2: [] }));
    expect(componente(soPao2, "resp").reason).toBe("missing_required_input:resp");
    expect(componente(soPao2, "resp").explanation).toContain(
      "PaO2 e/ou FiO2 ausentes — a razão é incomputável; ausência NUNCA é tratada como normal (HAZ-0005)",
    );

    const soFio2 = evaluateSofa(entrada({ pao2: [] }));
    expect(componente(soFio2, "resp").reason).toBe("missing_required_input:resp");
  });

  it("fragmentos de suporte respiratório: qualificante vs não qualificante", () => {
    const com = evaluateSofa(
      entrada({
        pao2: [q(52.5, "mm[Hg]", 240)],
        fio2: [q(0.35, "1", 240)],
        respiratorySupportStatus: {
          value: "niv_or_cpap",
          effectiveTime: instante(240),
          provenance: PROC,
        },
      }),
    );
    expect(componente(com, "resp").explanation).toContain("suporte qualificante (VMI ou VNI/CPAP)");

    const sem = evaluateSofa(
      entrada({
        pao2: [q(52.5, "mm[Hg]", 240)],
        fio2: [q(0.35, "1", 240)],
        respiratorySupportStatus: { value: "none", effectiveTime: instante(240), provenance: PROC },
      }),
    );
    expect(componente(sem, "resp").explanation).toContain(
      "sem suporte qualificante — bandas 3-4 exigem suporte (OQ-1/OQ-2)",
    );
  });

  it("FiO2 simultâneas contraditórias → conflicting_inputs:respiration", () => {
    const record = evaluateSofa(entrada({ fio2: [q(0.21, "1", 240), { ...q(0.5, "1", 240) }] }));
    expect(record.status).toBe("invalid");
    expect(componente(record, "resp").reason).toBe("conflicting_inputs:respiration");
  });

  it("map: undefined explicito comporta-se como ausente → missing_required_input:cv", () => {
    const record = evaluateSofa(entrada({ map: undefined }));
    expect(componente(record, "cv").reason).toBe("missing_required_input:cv");
  });

  it("PAM derivada carrega a flag derived_map; flags exatos", () => {
    const record = evaluateSofa(
      entrada({ map: { kind: "derivedFromSbpDbp", sbp: q(90, "mm[Hg]"), dbp: q(60, "mm[Hg]") } }),
    );
    expect(componente(record, "cv").flags).toEqual(["derived_map"]);
  });

  it("explicação do total parcial propaga a divulgação com ATENÇÃO", () => {
    const parcial = evaluateSofa(entrada({ urineOutput24h: null }));
    expect(parcial.explanation).toContain("ATENÇÃO:");
    expect(parcial.explanation).toContain(
      "débito urinário não avaliado — o escore renal é um limite inferior",
    );
  });

  it("renal apenas débito: fragmento do critério disponível na explicação", () => {
    const record = evaluateSofa(
      entrada({
        creatinine: [],
        urineOutput24h: {
          value: 300,
          unit: "mL",
          intervalStart: instante(28 * 60),
          intervalEnd: instante(120),
          provenance: PROC,
        } as unknown as SofaUrineOutputObservation,
      }),
    );
    expect(componente(record, "renal").explanation).toContain(
      "débito urinário 300 mL/24 h → banda 3",
    );
    expect(record.annotations).toContain(
      "creatinina não avaliada — o escore renal é um limite inferior",
    );
  });

  it("cv por dose: faixas de explicação por agente (noradrenalina 0,5 → banda 4 via tier)", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [agente("norepinephrine", { value: 0.5, unit: "ug/kg/min" }, 240)],
      }),
    );
    expect(componente(record, "cv").flags).toEqual([]);
    expect(componente(record, "cv").explanation).toContain(
      "tier 4 pela combinação de agentes ativos",
    );
  });
});

// ---------------------------------------------------------------------------
// Quarta onda — pinagem byte a byte das explicações (§7) e ramos finais
// ---------------------------------------------------------------------------

describe("mutantes — explicações pinadas byte a byte (matadores de string/regex)", () => {
  function painel(): SofaEvaluationInput {
    return entrada({});
  }

  it("total válido: string EXATA do painel normal", () => {
    const record = evaluateSofa(painel());
    expect(record.explanation).toBe(
      "Escore SOFA 0 de 24 — regra RULE-SOFA v0.2.0. Janela de avaliação: as 24 horas até " +
        "2026-08-15T12:00:00-03:00. Componentes: respiratório 0 (PaO2/FiO2 457.143 mm[Hg] → 0 ponto(s) " +
        "(especime 2026-08-15T11:00:00.000Z)); coagulação 0 (plaquetas 250 ×10³/µL → 0 ponto(s) (especime " +
        "2026-08-15T09:00:00.000Z)); hepático 0 (bilirrubina 0.6 mg/dL → 0 ponto(s) (especime " +
        "2026-08-15T09:00:00.000Z)); cardiovascular 0 (PAM 85 mm[Hg] sem vasoativo ativo → 0 ponto(s) " +
        "(especime 2026-08-15T13:00:00.000Z)); neurológico 0 (GCS 15 com RASS pareado 0 (≥ −2, testável) → " +
        "0 ponto(s) (especime 2026-08-15T12:00:00.000Z)); renal 0 (pior-critério-disponível — creatinina " +
        "0.8 mg/dL → banda 0 (especime 2026-08-15T09:00:00.000Z); débito urinário 1800 mL/24 h → banda 0 " +
        "(intervalo até 2026-08-15T13:00:00.000Z); componente = max → 0 ponto(s) (I-7, OQ-7 (b))). Insumo " +
        "contribuinte mais antigo: 360 min. O SOFA descreve disfunção orgânica; não é, por si só, " +
        "diagnóstico de sepse e não distingue disfunção aguda de crônica. Informação de apoio à decisão da " +
        "equipe assistente — não é uma diretriz e não determina conduta.",
    );
  });

  it("total inválido: string EXATA", () => {
    const record = evaluateSofa(entrada({ platelets: [q(0, "10*3/uL", 360)] }));
    expect(record.explanation).toBe(
      "Escore SOFA: inválido — falha de integridade de dado detectada (implausible_value:coagulation). " +
        "Nenhuma pontuação existe para este paciente neste momento; a ausência de pontuação não significa " +
        "normalidade. Os sistemas avaliáveis são exibidos individualmente com seu próprio status. " +
        "Informação de apoio apenas. regra RULE-SOFA v0.2.0.",
    );
  });

  it("total não avaliado: string EXATA", () => {
    const record = evaluateSofa(entrada({ gcsTotal: null, rass: null }));
    expect(record.explanation).toBe(
      "Escore SOFA: não avaliado. O total não foi calculado porque: missing_required_input:cns. " +
        "Nenhum número é exibido porque um total calculado sem esses sistemas orgânicos poderia gerar " +
        "falsa tranquilidade. O que falta para completar a avaliação: missing_required_input:cns. " +
        "Informação de apoio apenas. regra RULE-SOFA v0.2.0.",
    );
  });
});

describe("mutantes — ramos finais de PAM derivada, dose múltipla e seleção stale", () => {
  it("PAM derivada com PAS/PAD defasadas (6 h) → stale; além de 8 h → expired", () => {
    const stale = evaluateSofa(
      entrada({
        map: {
          kind: "derivedFromSbpDbp",
          sbp: q(90, "mm[Hg]", 6 * 60),
          dbp: q(60, "mm[Hg]", 6 * 60),
        },
      }),
    );
    expect(componente(stale, "cv").reason).toBe("stale_input:cardiovascular");

    const expired = evaluateSofa(
      entrada({
        map: {
          kind: "derivedFromSbpDbp",
          sbp: q(90, "mm[Hg]", 9 * 60),
          dbp: q(60, "mm[Hg]", 9 * 60),
        },
      }),
    );
    expect(componente(expired, "cv").reason).toBe("expired_input:cardiovascular");
  });

  it("idade do insumo do CV = MAIOR confirmação entre agentes (Math.max)", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          {
            agent: "dopamine",
            dose: { value: 2, unit: "ug/kg/min" },
            sustainedMinutes: 240,
            lastConfirmedAt: instante(60),
            provenance: PROC,
          },
          {
            agent: "norepinephrine",
            dose: { value: 0.5, unit: "ug/kg/min" },
            sustainedMinutes: 240,
            lastConfirmedAt: instante(10),
            provenance: PROC,
          },
        ],
      }),
    );
    expect(componente(record, "cv").ageMinutes).toBe(60);
  });

  it("fora de janela com idades DIFERENTES: a leitura MAIS RECENTE decide stale vs expired", () => {
    // 30 h (stale) e 50 h (expired): a mais recente (30 h) decide → stale.
    const stale = evaluateSofa(
      entrada({ platelets: [q(250, "10*3/uL", 30 * 60), q(250, "10*3/uL", 50 * 60)] }),
    );
    expect(stale.status).toBe("not_evaluated");
    expect(componente(stale, "coag").reason).toBe("stale_input:coagulation");

    // 49 h e 50 h: ambas além da expiração; a mais recente (49 h) → expired.
    const expired = evaluateSofa(
      entrada({ platelets: [q(250, "10*3/uL", 49 * 60), q(250, "10*3/uL", 50 * 60)] }),
    );
    expect(expired.status).toBe("not_evaluated");
    expect(componente(expired, "coag").reason).toBe("expired_input:coagulation");
  });

  it("FiO2 não finita → implausible_value:respiration (antes da checagem de unidade)", () => {
    const record = evaluateSofa(entrada({ fio2: [q(Number.NaN, "1", 240)] }));
    expect(record.status).toBe("invalid");
    expect(componente(record, "resp").reason).toBe("implausible_value:respiration");
  });

  it("PAM medida não finita → implausible_value:cardiovascular", () => {
    const record = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: Number.NaN,
          unit: "mm[Hg]",
          effectiveTime: instante(10),
          provenance: PROC,
        },
      }),
    );
    expect(record.status).toBe("invalid");
    expect(componente(record, "cv").reason).toBe("implausible_value:cardiovascular");
  });

  it("suporte respiratório SEM tempo clínico (P/F < 200) → stale_input:respiration", () => {
    const record = evaluateSofa(
      entrada({
        pao2: [q(52.5, "mm[Hg]", 240)],
        fio2: [q(0.35, "1", 240)],
        respiratorySupportStatus: {
          value: "invasive_mechanical_ventilation",
          effectiveTime: null,
          provenance: PROC,
        },
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "resp").status).toBe("stale");
    expect(componente(record, "resp").reason).toBe("stale_input:respiration");
  });

  it("unidades: limites exatos de percentual (21 → 0.21; 100 → 1.0; 20.9 e 101 rejeitados)", () => {
    expect(fio2PercentualDeNumero(21)).toMatchObject({ status: "convertido" });
    expect(fio2PercentualDeNumero(100)).toMatchObject({ status: "convertido" });
    expect(fio2PercentualDeNumero(20.9)).toMatchObject({ status: "rejeitado" });
    expect(fio2PercentualDeNumero(101)).toMatchObject({ status: "rejeitado" });
    expect(fio2FracaoDeNumero(1.01)).toMatchObject({ status: "rejeitado" });
    // A classe DISTINTA do ORQ-4: fração no vão percentual é rejeitada como
    // valor-percentual (o defeito V1 morre na porta).
    expect(fio2FracaoDeNumero(40)).toMatchObject({
      status: "rejeitado",
      motivo: "rejected_valor_percentual",
    });
  });
});

// ---------------------------------------------------------------------------
// Quinta onda — disCRIMINADORES da propagação ATENÇÃO e tempo da PAM derivada
// ---------------------------------------------------------------------------

describe("mutantes — disCRIMINADORES da propagação ATENÇÃO (filter §7)", () => {
  it("renal parcial: ATENÇÃO propaga via SOFA_DIVULGACAO_RENAL_PT", () => {
    const parcial = evaluateSofa(entrada({ urineOutput24h: null }));
    expect(parcial.explanation).toContain(
      "ATENÇÃO: débito urinário não avaliado — o escore renal é um limite inferior",
    );
  });

  it("agente não tabelado: ATENÇÃO propaga via 'não tabelado'", () => {
    const record = evaluateSofa(
      entrada({ vasoactiveAgents: [agente("vasopressin", { value: 0.04, unit: "U/min" }, 240)] }),
    );
    expect(record.explanation).toContain(
      "ATENÇÃO: agente vasoativo não tabelado — piso CV 3; mapeamento com fonte VALIDATION REQUIRED",
    );
  });

  it("provisório: ATENÇÃO propaga via 'provisório — infusão <1h'", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [agente("norepinephrine", { value: 0.5, unit: "ug/kg/min" }, 30)],
      }),
    );
    expect(record.explanation).toContain("ATENÇÃO: provisório — infusão <1h");
  });

  it("piso por dose ausente: ATENÇÃO propaga via 'ausente — piso'", () => {
    const record = evaluateSofa(entrada({ vasoactiveAgents: [agente("dopamine", null, 180)] }));
    expect(record.explanation).toContain(
      "ATENÇÃO: dose de dopamina ausente — piso 2 pela presença do agente",
    );
  });

  it("total válido SEM divulgação não carrega ATENÇÃO (o filter não inventa)", () => {
    const record = evaluateSofa(entrada({}));
    expect(record.explanation).not.toContain("ATENÇÃO:");
  });

  it("PAM derivada: o tempo EFETIVO é o mais ANTIGO de PAS/PAD (Math.min decide stale)", () => {
    const record = evaluateSofa(
      entrada({
        map: { kind: "derivedFromSbpDbp", sbp: q(90, "mm[Hg]", 5 * 60), dbp: q(60, "mm[Hg]", 10) },
      }),
    );
    // PAS a 5 h (fora da janela de 4 h), PAD fresca: o tempo EFETIVO é o
    // mais antigo (Math.min) → stale — mataria o mutant de Math.min→Math.max.
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "cv").reason).toBe("stale_input:cardiovascular");
  });
});

// ---------------------------------------------------------------------------
// Sexta onda — coalescência de insumo ausente (undefined ≡ []) e flags vazios
// ---------------------------------------------------------------------------

describe("mutantes — insumo undefined coalesce para ausente (?? [])", () => {
  const casos: readonly {
    readonly nome: string;
    readonly campo: "pao2" | "fio2" | "platelets" | "bilirubin" | "creatinine" | "vasoactiveAgents";
    readonly componente: "resp" | "coag" | "liver" | "cv" | "renal";
    readonly motivo: string;
  }[] = [
    { nome: "pao2", campo: "pao2", componente: "resp", motivo: "missing_required_input:resp" },
    { nome: "fio2", campo: "fio2", componente: "resp", motivo: "missing_required_input:resp" },
    {
      nome: "plaquetas",
      campo: "platelets",
      componente: "coag",
      motivo: "missing_required_input:coag",
    },
    {
      nome: "bilirrubina",
      campo: "bilirubin",
      componente: "liver",
      motivo: "missing_required_input:liver",
    },
    {
      nome: "creatinina",
      campo: "creatinine",
      componente: "renal",
      motivo: "missing_required_input:renal",
    },
  ];
  for (const c of casos) {
    it(`${c.nome}: undefined ⇒ ausente declarada`, () => {
      const base = entrada({});
      const overrides =
        c.campo === "creatinine"
          ? // Creatinina undefined com débito presente seria parcial declarado
            // (critério único, I-7); para a AUSÊNCIA ambos precisam faltar.
            { ...base, creatinine: undefined, urineOutput24h: null }
          : { ...base, [c.campo]: undefined };
      const record = evaluateSofa(overrides as SofaEvaluationInput);
      expect(componente(record, c.componente).reason).toBe(c.motivo);
    });
  }

  it("vasoactiveAgents: undefined ⇒ nenhum agente ativo (PAM obriga)", () => {
    const overrides: Partial<SofaEvaluationInput> = { vasoactiveAgents: undefined };
    const record = evaluateSofa(entrada(overrides));
    expect(componente(record, "cv").status).toBe("valid");
    expect(componente(record, "cv").flags).toEqual([]);
  });

  it("componentes válidos carregam flags vazios EXATOS", () => {
    const record = evaluateSofa(entrada({}));
    expect(componente(record, "resp").flags).toEqual([]);
    expect(componente(record, "coag").flags).toEqual([]);
    expect(componente(record, "liver").flags).toEqual([]);
    expect(componente(record, "cv").flags).toEqual([]);
    expect(componente(record, "cns").flags).toEqual([]);
  });

  it("instante inválido: detalhe por componente nomeia a condição", () => {
    const record = evaluateSofa(entrada({ evaluationTime: "não-é-instante" }));
    expect(componente(record, "resp").explanation).toContain(
      "instante de avaliação inválido ou ausente",
    );
    expect(componente(record, "renal").explanation).toContain("nenhuma lógica de regra executou");
  });
});
