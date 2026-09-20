/**
 * Testes de fronteira do avaliador SOFA — todo par de limiar adjacente das
 * bandas pinadas, as conversões de unidade antes da comparação (HAZ-0032),
 * os pisos e tiers provisórios decididos (GDEC-0007), o gate de sedação
 * fail-closed (OQ-8 (b), espelho da ADR-0028), atualidade/expiração por
 * insumo (OQ-9 (a)), o parcial declarado renal (OQ-7 (b)) e os carve-outs
 * computar-com-anotação (OQ-11 (b)).
 *
 * Os vetores CRV pinam as arestas documentadas; esta suíte pina a SEMÂNTICA
 * completa da logic.yaml/specification.md §4-§5 nos pontos que o corpus não
 * materializa (ex.: janelas de frescor por insumo, PAM derivada, sinônimos
 * de vasopressor, unidade reconhecida porém não normalizável). Cada bloco
 * cita a seção normativa.
 */

import { describe, expect, it } from "vitest";
import {
  evaluateSofa,
  type SofaEvaluationInput,
  type SofaQuantityObservation,
  type SofaVasoactiveAgentObservation,
} from "../src/index.js";

const T = "2026-08-15T12:00:00-03:00";
const PROC = { sourceSystem: "SYNTH-amh-01", sourceDataQuality: "valid" } as const;

function q(value: number, unit: string, minutosAtras = 10): SofaQuantityObservation {
  const t = new Date(Date.parse(T) - minutosAtras * 60_000).toISOString();
  return { value, unit, effectiveTime: t, provenance: PROC };
}

/** Painel normal mínimo, parametrizável por teste. */
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

function agente(
  agent: string,
  dose: { value: number; unit: string } | null,
  sustainedMinutes: number,
): SofaVasoactiveAgentObservation {
  return {
    agent,
    dose,
    sustainedMinutes,
    lastConfirmedAt: new Date(Date.parse(T) - 10 * 60_000).toISOString(),
    provenance: PROC,
  };
}

// ---------------------------------------------------------------------------
// Bandas — respiratório (spec §4.1; pares de limiar 400/300/200/100)
// ---------------------------------------------------------------------------

describe("SOFA respiratório — pares de limiar P/F (§4.1)", () => {
  const casos: readonly {
    readonly pao2: number;
    readonly fio2: number;
    readonly suporte: boolean;
    readonly esperado: number;
  }[] = [
    { pao2: 400, fio2: 1, suporte: false, esperado: 0 },
    { pao2: 399.9, fio2: 1, suporte: false, esperado: 1 },
    { pao2: 300, fio2: 1, suporte: false, esperado: 1 },
    { pao2: 299.9, fio2: 1, suporte: false, esperado: 2 },
    { pao2: 200, fio2: 1, suporte: true, esperado: 2 },
    { pao2: 199.9, fio2: 1, suporte: true, esperado: 3 },
    { pao2: 100, fio2: 1, suporte: true, esperado: 3 },
    { pao2: 99.9, fio2: 1, suporte: true, esperado: 4 },
  ];
  for (const c of casos) {
    it(`P/F ${c.pao2}/${c.fio2} com suporte=${c.suporte} → ${c.esperado}`, () => {
      const record = evaluateSofa(
        entrada({
          pao2: [q(c.pao2, "mm[Hg]")],
          fio2: [q(c.fio2, "1")],
          respiratorySupportStatus: {
            value: c.suporte ? "invasive_mechanical_ventilation" : "none",
            effectiveTime: q(0, "", 5).effectiveTime,
            provenance: PROC,
          },
        }),
      );
      expect(record.status).toBe("valid");
      expect(componente(record, "resp").score).toBe(c.esperado);
    });
  }

  it("HFNC NÃO qualifica para bandas 3-4 (OQ-1 (a): excluída); P/F 150 com HFNC → 2", () => {
    const record = evaluateSofa(
      entrada({
        pao2: [q(52.5, "mm[Hg]")],
        fio2: [q(0.35, "1")],
        respiratorySupportStatus: {
          value: "hfnc",
          effectiveTime: q(0, "", 5).effectiveTime,
          provenance: PROC,
        },
      }),
    );
    expect(componente(record, "resp").score).toBe(2);
  });

  it("NIV/CPAP qualifica (I-1): P/F 150 com NIV/CPAP → 3", () => {
    const record = evaluateSofa(
      entrada({
        pao2: [q(52.5, "mm[Hg]")],
        fio2: [q(0.35, "1")],
        respiratorySupportStatus: {
          value: "niv_or_cpap",
          effectiveTime: q(0, "", 5).effectiveTime,
          provenance: PROC,
        },
      }),
    );
    expect(componente(record, "resp").score).toBe(3);
  });

  it("P/F < 200 sem estado de suporte → not_evaluated(missing_required_input:respiratory_support_status) — a regra nunca presume direção (§4.1)", () => {
    const record = evaluateSofa(
      entrada({
        pao2: [q(52.5, "mm[Hg]")],
        fio2: [q(0.35, "1")],
        respiratorySupportStatus: null,
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "resp").reason).toBe(
      "missing_required_input:respiratory_support_status",
    );
  });

  it("FiO2 40 com unidade '%' converte 0,40 legitimamente (nunca heurística); P/F 96/0,40 = 240 → 2", () => {
    // 240 min: mesmo tempo clínico do PaO2 do painel — pareamento intacto.
    const record = evaluateSofa(entrada({ fio2: [q(40, "%", 240)] }));
    expect(componente(record, "resp").score).toBe(2);
  });

  it("FiO2 40 sem unidade → invalid(unmappable_unit:respiration) — nunca dividir por 100 por adivinhação (HAZ-0032)", () => {
    const record = evaluateSofa(entrada({ fio2: [q(40, "", 240)] }));
    expect(record.status).toBe("invalid");
    expect(componente(record, "resp").status).toBe("invalid");
    expect(componente(record, "resp").reason).toBe("unmappable_unit:respiration");
  });

  it("PaO2 em kPa converte ×7.50062 antes da banda (§3.1 linha 2): 13.3 kPa ≈ 99.76 mm[Hg]", () => {
    const record = evaluateSofa(
      entrada({
        pao2: [q(13.3, "kPa", 10)],
        fio2: [q(0.5, "1", 10)],
        respiratorySupportStatus: {
          value: "none",
          effectiveTime: q(0, "", 10).effectiveTime,
          provenance: PROC,
        },
      }),
    );
    // 13.3 × 7.50062 = 99.758… → P/F ≈ 199.5 → banda 3 exige suporte; sem suporte → 2.
    expect(componente(record, "resp").score).toBe(2);
  });

  it("FiO2 fora da janela de pareamento de 30 min do espécime de PaO2 → not_evaluated(unpaired_fio2) (§3.1 linha 3)", () => {
    const record = evaluateSofa(
      entrada({
        pao2: [q(96, "mm[Hg]", 60)],
        fio2: [q(0.21, "1", 0)],
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "resp").reason).toBe("unpaired_fio2");
  });
});

// ---------------------------------------------------------------------------
// Bandas — coagulação (§4.2), hepático (§4.3), neurológico (§4.5), renal (§4.6)
// ---------------------------------------------------------------------------

describe("SOFA coagulação — pares de limiar (§4.2)", () => {
  const casos: readonly { readonly valor: number; readonly esperado: number }[] = [
    { valor: 150, esperado: 0 },
    { valor: 149.9, esperado: 1 },
    { valor: 100, esperado: 1 },
    { valor: 99.9, esperado: 2 },
    { valor: 50, esperado: 2 },
    { valor: 49.9, esperado: 3 },
    { valor: 20, esperado: 3 },
    { valor: 19.9, esperado: 4 },
    { valor: 1, esperado: 4 },
  ];
  for (const c of casos) {
    it(`plaquetas ${c.valor} → ${c.esperado}`, () => {
      const record = evaluateSofa(entrada({ platelets: [q(c.valor, "10*3/uL")] }));
      expect(record.status).toBe("valid");
      expect(componente(record, "coag").score).toBe(c.esperado);
    });
  }

  it("10*9/L é aceito como idêntico (§3.1 linha 5)", () => {
    const record = evaluateSofa(entrada({ platelets: [q(250, "10*9/L")] }));
    expect(componente(record, "coag").score).toBe(0);
  });

  it("unidade inmapeável → invalid(unmappable_unit:coagulation) (HAZ-0032)", () => {
    const record = evaluateSofa(entrada({ platelets: [q(250, "g/L")] }));
    expect(record.status).toBe("invalid");
    expect(componente(record, "coag").reason).toBe("unmappable_unit:coagulation");
  });
});

describe("SOFA hepático — bandas contínuas, sem região morta (§4.3)", () => {
  const casos: readonly { readonly valor: number; readonly esperado: number }[] = [
    { valor: 1.19, esperado: 0 },
    { valor: 1.2, esperado: 1 },
    { valor: 1.95, esperado: 1 },
    { valor: 2.0, esperado: 2 },
    { valor: 5.9, esperado: 2 },
    { valor: 6.0, esperado: 3 },
    { valor: 11.9, esperado: 3 },
    { valor: 12.0, esperado: 4 },
  ];
  for (const c of casos) {
    it(`bilirrubina ${c.valor} mg/dL → ${c.esperado}`, () => {
      const record = evaluateSofa(entrada({ bilirubin: [q(c.valor, "mg/dL")] }));
      expect(record.status).toBe("valid");
      expect(componente(record, "liver").score).toBe(c.esperado);
    });
  }

  it("umol/L converte ÷17.104 ANTES da comparação (OQ-6 (a)); 51.4 umol/L = 3.005 mg/dL → banda 2", () => {
    const record = evaluateSofa(entrada({ bilirubin: [q(51.4, "umol/L")] }));
    expect(componente(record, "liver").score).toBe(2);
    expect(record.annotations.join(" ")).toContain("conversão de unidade aplicada");
  });

  it("unidade inmapeável → invalid(unmappable_unit:liver)", () => {
    const record = evaluateSofa(entrada({ bilirubin: [q(1, "mg/L")] }));
    expect(record.status).toBe("invalid");
    expect(componente(record, "liver").reason).toBe("unmappable_unit:liver");
  });
});

describe("SOFA neurológico — bandas e faixa (§4.5)", () => {
  const casos: readonly { readonly gcs: number; readonly esperado: number }[] = [
    { gcs: 15, esperado: 0 },
    { gcs: 14, esperado: 1 },
    { gcs: 13, esperado: 1 },
    { gcs: 12, esperado: 2 },
    { gcs: 10, esperado: 2 },
    { gcs: 9, esperado: 3 },
    { gcs: 6, esperado: 3 },
    { gcs: 5, esperado: 4 },
    { gcs: 3, esperado: 4 },
  ];
  for (const c of casos) {
    it(`GCS ${c.gcs} → ${c.esperado}`, () => {
      // 180 min: mesmo tempo clínico do RASS do painel — pareamento intacto.
      const record = evaluateSofa(entrada({ gcsTotal: q(c.gcs, "{score}", 180) }));
      expect(record.status).toBe("valid");
      expect(componente(record, "cns").score).toBe(c.esperado);
    });
  }

  it("GCS 16 e GCS 2 → invalid(out_of_range:cns) (D-13); não inteiro → invalid", () => {
    for (const valor of [16, 2]) {
      const record = evaluateSofa(entrada({ gcsTotal: q(valor, "{score}", 180) }));
      expect(record.status).toBe("invalid");
      expect(componente(record, "cns").reason).toBe("out_of_range:cns");
    }
    const fracionado = evaluateSofa(entrada({ gcsTotal: q(13.5, "{score}", 180) }));
    expect(fracionado.status).toBe("invalid");
  });
});

describe("SOFA renal — pior-critério-disponível e parcial declarado (§4.6 I-7)", () => {
  it("bandas de creatinina contínuas: 1.19→0, 1.2→1, 2.0→2, 3.5→3, 5.0→4", () => {
    const casos: readonly { readonly valor: number; readonly esperado: number }[] = [
      { valor: 1.19, esperado: 0 },
      { valor: 1.2, esperado: 1 },
      { valor: 2.0, esperado: 2 },
      { valor: 3.5, esperado: 3 },
      { valor: 5.0, esperado: 4 },
    ];
    for (const c of casos) {
      const record = evaluateSofa(
        entrada({ creatinine: [q(c.valor, "mg/dL")], urineOutput24h: null }),
      );
      expect(record.status).toBe("partial");
      expect(componente(record, "renal").score).toBe(c.esperado);
      expect(componente(record, "renal").status).toBe("partial");
    }
  });

  it("apenas débito urinário: 500→0, 499→3, 200→3, 199→4, 0→4, com flag creatinine_not_assessed", () => {
    const casos: readonly { readonly valor: number; readonly esperado: number }[] = [
      { valor: 500, esperado: 0 },
      { valor: 499, esperado: 3 },
      { valor: 200, esperado: 3 },
      { valor: 199, esperado: 4 },
      { valor: 0, esperado: 4 },
    ];
    for (const c of casos) {
      const record = evaluateSofa(
        entrada({
          creatinine: [],
          urineOutput24h: {
            value: c.valor,
            unit: "mL",
            intervalStart: new Date(Date.parse(T) - 26 * 3_600_000).toISOString(),
            intervalEnd: new Date(Date.parse(T) - 2 * 3_600_000).toISOString(),
            provenance: PROC,
          },
        }),
      );
      expect(record.status).toBe("partial");
      expect(componente(record, "renal").score).toBe(c.esperado);
      expect(record.annotations.join(" ")).toContain("creatinina não avaliada");
    }
  });

  it("ambos presentes: max das bandas (creatinina 0,8 → 0; débito 100 → 4; componente 4, válido)", () => {
    const record = evaluateSofa(
      entrada({
        creatinine: [q(0.8, "mg/dL")],
        urineOutput24h: {
          value: 100,
          unit: "mL",
          intervalStart: new Date(Date.parse(T) - 26 * 3_600_000).toISOString(),
          intervalEnd: new Date(Date.parse(T) - 2 * 3_600_000).toISOString(),
          provenance: PROC,
        },
      }),
    );
    expect(record.status).toBe("valid");
    expect(componente(record, "renal").status).toBe("valid");
    expect(componente(record, "renal").score).toBe(4);
  });

  it("ambos ausentes → not_evaluated(missing_required_input:renal)", () => {
    const record = evaluateSofa(entrada({ creatinine: [], urineOutput24h: null }));
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "renal").reason).toBe("missing_required_input:renal");
  });

  it("intervalo de débito terminando há 6 h (janela 4 h, expiração 8 h) → stale_input:renal", () => {
    const record = evaluateSofa(
      entrada({
        creatinine: [],
        urineOutput24h: {
          value: 1800,
          unit: "mL",
          intervalStart: new Date(Date.parse(T) - 30 * 3_600_000).toISOString(),
          intervalEnd: new Date(Date.parse(T) - 6 * 3_600_000).toISOString(),
          provenance: PROC,
        },
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "renal").reason).toBe("stale_input:renal");
  });

  it("intervalo terminando há 10 h (além da expiração de 8 h) → expired_input:renal", () => {
    const record = evaluateSofa(
      entrada({
        creatinine: [],
        urineOutput24h: {
          value: 1800,
          unit: "mL",
          intervalStart: new Date(Date.parse(T) - 34 * 3_600_000).toISOString(),
          intervalEnd: new Date(Date.parse(T) - 10 * 3_600_000).toISOString(),
          provenance: PROC,
        },
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "renal").reason).toBe("expired_input:renal");
  });

  it("em TSR (RRT): renal avalia com anotação obrigatória 'em TSR' (OQ-11 (b))", () => {
    const record = evaluateSofa(entrada({ onRenalReplacementTherapy: true }));
    expect(componente(record, "renal").status).toBe("valid");
    expect(record.annotations.join(" ")).toContain("em TSR");
  });
});

// ---------------------------------------------------------------------------
// Cardiovascular — pisos, provisório, combinação, PAM derivada (§4.4)
// ---------------------------------------------------------------------------

describe("SOFA cardiovascular — bandas por dose (§4.4)", () => {
  const casos: readonly {
    readonly agente: string;
    readonly dose: number;
    readonly esperado: number;
  }[] = [
    { agente: "dopamine", dose: 5.0, esperado: 2 },
    { agente: "dopamine", dose: 5.1, esperado: 3 },
    { agente: "dopamine", dose: 15, esperado: 3 },
    { agente: "dopamine", dose: 15.1, esperado: 4 },
    { agente: "dobutamine", dose: 40, esperado: 2 },
    { agente: "epinephrine", dose: 0.1, esperado: 3 },
    { agente: "epinephrine", dose: 0.11, esperado: 4 },
    { agente: "norepinephrine", dose: 0.1, esperado: 3 },
    { agente: "norepinephrine", dose: 0.11, esperado: 4 },
  ];
  for (const c of casos) {
    it(`${c.agente} ${c.dose} ug/kg/min sustentado ≥1 h → ${c.esperado}`, () => {
      const record = evaluateSofa(
        entrada({
          vasoactiveAgents: [agente(c.agente, { value: c.dose, unit: "ug/kg/min" }, 120)],
        }),
      );
      expect(record.status).toBe("valid");
      expect(componente(record, "cv").score).toBe(c.esperado);
    });
  }

  it("sinônimos normalizados: noradrenalina ≡ norepinephrine, adrenaline ≡ epinephrine (§3.1 linha 8)", () => {
    const r1 = evaluateSofa(
      entrada({
        vasoactiveAgents: [agente("noradrenaline", { value: 0.5, unit: "ug/kg/min" }, 120)],
      }),
    );
    const r2 = evaluateSofa(
      entrada({ vasoactiveAgents: [agente("adrenaline", { value: 0.5, unit: "ug/kg/min" }, 120)] }),
    );
    expect(componente(r1, "cv").score).toBe(4);
    expect(componente(r2, "cv").score).toBe(4);
  });

  it("combinação: max das bandas por agente (I-4) — dopamina 5,0 (2) + noradrenalina 0,5 (4) → 4", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          agente("dopamine", { value: 5.0, unit: "ug/kg/min" }, 120),
          agente("norepinephrine", { value: 0.5, unit: "ug/kg/min" }, 120),
        ],
      }),
    );
    expect(componente(record, "cv").score).toBe(4);
  });

  it("1ª hora de infusão nova: tier provisório imediato da dose, flag obrigatória (OQ-3 (b)) — noradrenalina 0,5 há 30 min → 4", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [agente("norepinephrine", { value: 0.5, unit: "ug/kg/min" }, 30)],
      }),
    );
    expect(componente(record, "cv").score).toBe(4);
    expect(record.annotations.join(" ")).toContain("provisório — infusão <1h");
  });

  it("dose ausente com agente tabelado: piso por presença — dobutamina 2, dopamina 2, noradrenalina 3, adrenalina 3 (DECISÃO DERIVADA, GDEC-0008 item 4)", () => {
    const esperados: readonly { readonly nome: string; readonly piso: number }[] = [
      { nome: "dobutamine", piso: 2 },
      { nome: "dopamine", piso: 2 },
      { nome: "norepinephrine", piso: 3 },
      { nome: "epinephrine", piso: 3 },
    ];
    for (const e of esperados) {
      const record = evaluateSofa(entrada({ vasoactiveAgents: [agente(e.nome, null, 120)] }));
      expect(componente(record, "cv").score, e.nome).toBe(e.piso);
      expect(record.annotations.join(" "), e.nome).toContain("pela presença do agente");
    }
  });

  it("piso nunca rebaixa escore por dose disponível: dose fora do piso prevalece (noradrenalina 0,5 → 4, não 3)", () => {
    const record = evaluateSofa(
      entrada({
        vasoactiveAgents: [agente("norepinephrine", { value: 0.5, unit: "ug/kg/min" }, 120)],
      }),
    );
    expect(componente(record, "cv").score).toBe(4);
  });

  it("dose em ug/min (reconhecida, não normalizável sem peso/concentração — política VALIDATION REQUIRED) → piso por presença, não invalid (§4.4)", () => {
    const record = evaluateSofa(
      entrada({ vasoactiveAgents: [agente("norepinephrine", { value: 8, unit: "ug/min" }, 120)] }),
    );
    expect(record.status).toBe("valid");
    expect(componente(record, "cv").score).toBe(3);
  });

  it("dose com unidade inmapeável → invalid(unmappable_unit:cardiovascular) — o piso repara ausência, nunca falha de integridade (§4.4)", () => {
    const record = evaluateSofa(
      entrada({ vasoactiveAgents: [agente("norepinephrine", { value: 8, unit: "bag/dia" }, 120)] }),
    );
    expect(record.status).toBe("invalid");
    expect(componente(record, "cv").reason).toBe("unmappable_unit:cardiovascular");
  });

  it("dose fora da faixa plausível do agente → invalid (envenena o componente; §4.4)", () => {
    const record = evaluateSofa(
      entrada({ vasoactiveAgents: [agente("dopamine", { value: 500, unit: "ug/kg/min" }, 120)] }),
    );
    expect(record.status).toBe("invalid");
    expect(componente(record, "cv").status).toBe("invalid");
  });

  it("agente não tabelado ativo: piso 3 com flag obrigatória (OQ-5 (b)); combinado: max(3, tiers tabelados)", () => {
    const sozinho = evaluateSofa(
      entrada({ vasoactiveAgents: [agente("vasopressin", { value: 0.04, unit: "U/min" }, 240)] }),
    );
    expect(componente(sozinho, "cv").score).toBe(3);
    expect(sozinho.annotations.join(" ")).toContain(
      "agente vasoativo não tabelado — piso CV 3; mapeamento com fonte VALIDATION REQUIRED",
    );

    const combinado = evaluateSofa(
      entrada({
        vasoactiveAgents: [
          agente("vasopressin", { value: 0.04, unit: "U/min" }, 240),
          agente("dopamine", { value: 2, unit: "ug/kg/min" }, 120),
        ],
      }),
    );
    expect(componente(combinado, "cv").score).toBe(3);
  });

  it("PAM exatamente 70 sem vasoativos → 0; 69.9 → 1 (§4.4 bandas 0/1)", () => {
    const r70 = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: 70,
          unit: "mm[Hg]",
          effectiveTime: q(0, "mm[Hg]", 10).effectiveTime,
          provenance: PROC,
        },
      }),
    );
    expect(componente(r70, "cv").score).toBe(0);
    const r69 = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: 69.9,
          unit: "mm[Hg]",
          effectiveTime: q(0, "mm[Hg]", 10).effectiveTime,
          provenance: PROC,
        },
      }),
    );
    expect(componente(r69, "cv").score).toBe(1);
  });

  it("PAM derivada de PAS/PAD: (SBP + 2×DBP)/3 com flag 'derivada' (OQ-9 (a)); 90/60 → 70 → banda 0", () => {
    const record = evaluateSofa(
      entrada({
        map: {
          kind: "derivedFromSbpDbp",
          sbp: q(90, "mm[Hg]"),
          dbp: q(60, "mm[Hg]"),
        },
      }),
    );
    expect(record.status).toBe("valid");
    expect(componente(record, "cv").score).toBe(0);
    expect(record.annotations.join(" ")).toContain("PAM derivada");
  });

  it("PAM ausente + nenhum agente → not_evaluated(missing_required_input:cv); PAM ausente + agente tabelado → escora da dose (D-07)", () => {
    const semTudo = evaluateSofa(entrada({ map: null, vasoactiveAgents: [] }));
    expect(semTudo.status).toBe("not_evaluated");
    expect(componente(semTudo, "cv").reason).toBe("missing_required_input:cv");

    const semPamComAgente = evaluateSofa(
      entrada({
        map: null,
        vasoactiveAgents: [agente("norepinephrine", { value: 0.5, unit: "ug/kg/min" }, 240)],
      }),
    );
    expect(semPamComAgente.status).toBe("valid");
    expect(componente(semPamComAgente, "cv").score).toBe(4);
  });

  it("PAM fora da janela de 4 h (expiração 8 h) → stale_input:cardiovascular; além de 8 h → expired_input:cardiovascular (§3.2)", () => {
    const stale = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: 85,
          unit: "mm[Hg]",
          effectiveTime: new Date(Date.parse(T) - 6 * 3_600_000).toISOString(),
          provenance: PROC,
        },
      }),
    );
    expect(stale.status).toBe("not_evaluated");
    expect(componente(stale, "cv").reason).toBe("stale_input:cardiovascular");

    const expired = evaluateSofa(
      entrada({
        map: {
          kind: "measured",
          value: 85,
          unit: "mm[Hg]",
          effectiveTime: new Date(Date.parse(T) - 9 * 3_600_000).toISOString(),
          provenance: PROC,
        },
      }),
    );
    expect(expired.status).toBe("not_evaluated");
    expect(componente(expired, "cv").reason).toBe("expired_input:cardiovascular");
  });
});

// ---------------------------------------------------------------------------
// Gate de sedação fail-closed (§4.5 I-8; espelho ADR-0028)
// ---------------------------------------------------------------------------

describe("SOFA neurológico — gate de sedação (OQ-8 (b))", () => {
  it("RASS pareado ≥ −2 → testável (GCS escora)", () => {
    const record = evaluateSofa(
      entrada({
        rass: { value: -2, effectiveTime: q(0, "", 180).effectiveTime, provenance: PROC },
      }),
    );
    expect(componente(record, "cns").status).toBe("valid");
  });

  it("RASS pareado ≤ −3 com ausência documentada de sedativos → coma genuíno, escora (A28-1 refinada)", () => {
    const record = evaluateSofa(
      entrada({
        gcsTotal: q(3, "{score}", 180),
        rass: { value: -5, effectiveTime: q(0, "", 180).effectiveTime, provenance: PROC },
        sedativeExposure: "none_active",
      }),
    );
    expect(componente(record, "cns").score).toBe(4);
  });

  it("RASS pareado ≤ −3 com exposição sedativa ativa OU desconhecida → sedation_confounded", () => {
    for (const exposure of ["active_infusion", "unknown"] as const) {
      const record = evaluateSofa(
        entrada({
          gcsTotal: q(3, "{score}", 180),
          rass: { value: -4, effectiveTime: q(0, "", 180).effectiveTime, provenance: PROC },
          sedativeExposure: exposure,
        }),
      );
      expect(record.status, exposure).toBe("not_evaluated");
      expect(componente(record, "cns").reason, exposure).toBe("sedation_confounded:cns");
    }
  });

  it("infusão sedativa ativa sem janela de interrupção documentada → sedation_confounded INDEPENDENTE do RASS", () => {
    const record = evaluateSofa(
      entrada({
        gcsTotal: q(15, "{score}", 180),
        rass: { value: 0, effectiveTime: q(0, "", 180).effectiveTime, provenance: PROC },
        sedativeExposure: "active_infusion",
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "cns").reason).toBe("sedation_confounded:cns");
  });

  it("RASS ausente ou fora da janela de pareamento de 1 h → sedation_state_unknown (insumo de gate ausente)", () => {
    const ausente = evaluateSofa(entrada({ rass: null }));
    expect(ausente.status).toBe("not_evaluated");
    expect(componente(ausente, "cns").reason).toBe("sedation_state_unknown:cns");

    // GCS a 180 min, RASS a 115 min: desvio de 65 min > janela de 60 min.
    const defasado = evaluateSofa(
      entrada({ rass: { value: 0, effectiveTime: q(0, "", 115).effectiveTime, provenance: PROC } }),
    );
    expect(defasado.status).toBe("not_evaluated");
    expect(componente(defasado, "cns").reason).toBe("sedation_state_unknown:cns");
  });
});

// ---------------------------------------------------------------------------
// Atualidade por insumo (§3.2, OQ-9 (a)) e pior-valor-em-24h (OQ-10 (a))
// ---------------------------------------------------------------------------

describe("SOFA atualidade e agregação pior-valor (§3.2/§4.0)", () => {
  it("laboratório fora da janela de 24 h dentro da expiração de 48 h → stale; além de 48 h → expired", () => {
    const stale = evaluateSofa(entrada({ creatinine: [q(0.8, "mg/dL", 30 * 60)] }));
    expect(stale.status).toBe("not_evaluated");
    expect(componente(stale, "renal").reason).toBe("stale_input:renal");

    const expired = evaluateSofa(entrada({ creatinine: [q(0.8, "mg/dL", 50 * 60)] }));
    expect(expired.status).toBe("not_evaluated");
    expect(componente(expired, "renal").reason).toBe("expired_input:renal");
  });

  it("pior valor na janela prevalece (OQ-10 (a)): creatinina 0.8 há 2 h e 2.5 há 20 h → banda 2", () => {
    const record = evaluateSofa(
      entrada({
        creatinine: [q(0.8, "mg/dL", 120), q(2.5, "mg/dL", 20 * 60)],
        urineOutput24h: null,
      }),
    );
    expect(record.status).toBe("partial");
    expect(componente(record, "renal").score).toBe(2);
  });

  it("valores simultâneos distintos sem reconciliação → conflicting_inputs (§3.1; CRV-SOFA-0326 padrão)", () => {
    const mesmoTempo = q(40, "10*3/uL");
    const record = evaluateSofa(
      entrada({
        platelets: [mesmoTempo, { ...mesmoTempo, value: 400 }],
      }),
    );
    expect(record.status).toBe("invalid");
    expect(componente(record, "coag").reason).toBe("conflicting_inputs:coagulation");
  });

  it("insumo com fonte em quarentena nunca contribui → quarantined_input (§5.2; regra das duas dimensões)", () => {
    const record = evaluateSofa(
      entrada({
        platelets: [
          {
            value: 250,
            unit: "10*3/uL",
            effectiveTime: q(0, "", 10).effectiveTime,
            provenance: { sourceSystem: "SYNTH-x", sourceDataQuality: "quarantined" },
          },
        ],
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "coag").reason).toBe("quarantined_input:coagulation");
  });
});

// ---------------------------------------------------------------------------
// Gate populacional e carve-outs (§1.2, §1.3)
// ---------------------------------------------------------------------------

describe("SOFA gate populacional e carve-outs computar-com-anotação (§1.2/§1.3, OQ-11 (b))", () => {
  it("idade desconhecida → population_unverified; idade < 18 → out_of_population_scope; ≥ 18 avalia", () => {
    const desconhecida = evaluateSofa(entrada({ age: { kind: "unknown" } }));
    expect(desconhecida.status).toBe("not_evaluated");
    expect(desconhecida.reasons).toEqual(["population_unverified"]);
    expect(desconhecida.components.every((c) => c.score === null)).toBe(true);

    const menor = evaluateSofa(entrada({ age: { kind: "verified", years: 17 } }));
    expect(menor.status).toBe("not_evaluated");
    expect(menor.reasons).toEqual(["out_of_population_scope"]);

    const dezoito = evaluateSofa(entrada({ age: { kind: "verified", years: 18 } }));
    expect(dezoito.status).toBe("valid");
  });

  it("ECMO: respiratório not_evaluated(pf_not_interpretable_on_ecmo); outros cinco componentes avaliam (OQ-11 (b))", () => {
    const record = evaluateSofa(entrada({ ecmo: true }));
    expect(record.status).toBe("not_evaluated");
    expect(componente(record, "resp").reason).toBe("pf_not_interpretable_on_ecmo");
    expect(componente(record, "coag").status).toBe("valid");
    expect(componente(record, "renal").status).toBe("valid");
  });

  it("limitação terapêutica documentada: anotação visível de supressão de escalonamento (HAZ-0044)", () => {
    const record = evaluateSofa(entrada({ treatmentLimitationOrderDocumented: true }));
    expect(record.annotations.join(" ")).toContain("limitação terapêutica");
  });

  it("disfunção orgânica crônica documentada: anotação obrigatória; a explicação não afirma agudeza (§1.3.2)", () => {
    const record = evaluateSofa(
      entrada({ chronicOrganDysfunctionNote: "cirrose — bilirrubina basal elevada" }),
    );
    expect(record.annotations.join(" ")).toContain("cirrose — bilirrubina basal elevada");
    expect(record.explanation).not.toContain("disfunção aguda confirmada");
  });
});

// ---------------------------------------------------------------------------
// Invariantes estruturais (§5, HAZ-0005)
// ---------------------------------------------------------------------------

describe("SOFA invariantes de álgebra de status (§5)", () => {
  it("total nunca acompanha status não legível; razões enumeram TODO componente não legível", () => {
    const record = evaluateSofa(entrada({ gcsTotal: null, rass: null, platelets: [] }));
    expect(record.total).toBeNull();
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toContain("missing_required_input:coag");
    expect(record.reasons).toContain("missing_required_input:cns");
  });

  it("precedência P-a: invalid > not_evaluated > stale > partial > valid", () => {
    const invalidVence = evaluateSofa(
      entrada({ platelets: [q(0, "10*3/uL")], gcsTotal: null, rass: null }),
    );
    expect(invalidVence.status).toBe("invalid");

    const notEvaluatedVence = evaluateSofa(
      entrada({ gcsTotal: null, rass: null, urineOutput24h: null }),
    );
    expect(notEvaluatedVence.status).toBe("not_evaluated");
  });

  it("fires é SEMPRE false e noFireReason acompanha o status (a regra não define alerta — §0.4 dos vetores)", () => {
    const casos = [
      entrada({}),
      entrada({ gcsTotal: null, rass: null }),
      entrada({ platelets: [q(0, "10*3/uL")] }),
      entrada({ age: { kind: "unknown" } }),
      entrada({ creatinine: [q(0.8, "mg/dL", 30 * 60)] }),
    ];
    for (const caso of casos) {
      const record = evaluateSofa(caso);
      expect(record.fires).toBe(false);
      expect(record.noFireReason).toBeTruthy();
    }
  });

  it("explicação pt-BR carrega versão da regra, enquadramento consultivo e (quando legível) o total", () => {
    const valido = evaluateSofa(entrada({}));
    expect(valido.explanation).toContain("RULE-SOFA v0.2.0");
    expect(valido.explanation).toContain("Escore SOFA 0 de 24");
    expect(valido.explanation).toContain("Informação de apoio");

    const naoAvaliado = evaluateSofa(entrada({ gcsTotal: null, rass: null }));
    expect(naoAvaliado.explanation).toContain("não avaliado");
    expect(naoAvaliado.explanation).toContain("RULE-SOFA v0.2.0");
  });

  it("mesma entrada ⇒ mesmo registro, byte a byte (determinismo)", () => {
    const a = JSON.stringify(evaluateSofa(entrada({})));
    const b = JSON.stringify(evaluateSofa(entrada({})));
    expect(a).toBe(b);
  });
});
