/**
 * Testes de unidade da RULE-GCS 0.2.0 — ramos que o conjunto CRV de 18 vetores
 * não exercita, todos derivados da própria especificação:
 * - distinção NT × ausente × inválido (spec §3.2/§3.4; INV-C da ADR-0026);
 * - vocabulário governado de motivos de NT (spec §3.3) e unidade adimensional;
 * - conflito simultâneo, quarentena, tempo clínico ausente e seriação;
 * - bordas exatas de janela (12 h), expiração (24 h), contemporaneidade
 *   (30 min) e pareamento de RASS (1 h) — spec §5.3 / ADR-0028 A28-7;
 * - todos os ramos do gate de sedação (ADR-0028 A28-1/A28-2/A28-5);
 * - cross-check do total fornecido pela fonte (spec §5.2, OQ-GCS-6);
 * - GCS pré-sedação display-only 72 h (A28-6) e carve-out paliativo (§1.3.1);
 * - reavaliação em tempo de leitura (spec §5.3; ADR-0008 N5);
 * - texto de explicação como CONTRATO DE SEGURANÇA (spec §10): a ausência de
 *   escore precisa ser legível como ausência, nunca como tranquilidade.
 *
 * Dados 100% sintéticos (prefixo "SYNTH-"); nenhum relógio é lido.
 */

import { describe, expect, it } from "vitest";
import {
  evaluateGcs,
  type GcsComponentId,
  type GcsComponentObservationInput,
  type GcsEvaluationInput,
  type GcsNtReason,
  reassessGcsAtReadTime,
} from "../src/index.js";
import { buildGcsVectorInput, EVAL_TIME_GCS } from "./suporte-gcs.js";

const EVAL_MS = Date.parse(EVAL_TIME_GCS);

function before(minutes: number): string {
  return new Date(EVAL_MS - minutes * 60_000).toISOString();
}

function after(minutes: number): string {
  return new Date(EVAL_MS + minutes * 60_000).toISOString();
}

const PROVENANCE = { sourceSystem: "SYNTH-beira-leito-01", sourceDataQuality: "valid" } as const;

function score(
  component: GcsComponentId,
  value: number,
  minutesBefore = 180,
  unit?: string,
): GcsComponentObservationInput {
  return {
    component,
    value: { kind: "score", value, ...(unit === undefined ? {} : { unit }) },
    effectiveTime: before(minutesBefore),
    provenance: PROVENANCE,
  };
}

function notTestable(
  component: GcsComponentId,
  ntReason: GcsNtReason,
  minutesBefore = 180,
): GcsComponentObservationInput {
  return {
    component,
    value: { kind: "not_testable", ntReason },
    effectiveTime: before(minutesBefore),
    provenance: PROVENANCE,
  };
}

/** Entrada base: três componentes íntegros, RASS 0 pareado, sem sedativo. */
function baseInput(overrides: Partial<GcsEvaluationInput> = {}): GcsEvaluationInput {
  return {
    evaluationTime: EVAL_TIME_GCS,
    age: { kind: "verified", years: 58 },
    components: [score("eye", 4), score("verbal", 5), score("motor", 6)],
    rass: { value: 0, effectiveTime: before(180), provenance: PROVENANCE },
    sedativeExposure: "none_active",
    ...overrides,
  };
}

describe("RULE-GCS — NT, ausência e invalidez são estados clínicos DIFERENTES", () => {
  it("NT nunca vira número: o componente NT tem value null e motivo governado", () => {
    const record = evaluateGcs(
      baseInput({
        components: [
          score("eye", 4),
          notTestable("verbal", "endotracheal_intubation"),
          score("motor", 6),
        ],
      }),
    );
    const verbal = record.components.find((c) => c.component === "verbal");
    expect(verbal?.status).toBe("not_testable");
    expect(verbal?.value).toBeNull();
    expect(verbal?.ntReason).toBe("endotracheal_intubation");
    expect(record.total).toBeNull();
    // Os três totais errados que o legado produzia estão excluídos por construção.
    expect(record.total).not.toBe(11);
    expect(record.total).not.toBe(10);
    expect(record.total).not.toBe(15);
  });

  it("ausente e NT produzem razões distintas e auditáveis para o MESMO componente", () => {
    const ausente = evaluateGcs(baseInput({ components: [score("eye", 4), score("motor", 6)] }));
    const nt = evaluateGcs(
      baseInput({
        components: [
          score("eye", 4),
          notTestable("verbal", "endotracheal_intubation"),
          score("motor", 6),
        ],
      }),
    );
    expect(ausente.reasons).toEqual(["missing_required_input:verbal"]);
    expect(nt.reasons).toEqual(["component_not_testable"]);
    expect(ausente.primaryReason).not.toBe(nt.primaryReason);
  });

  it("motivo de NT fora do vocabulário governado do componente ⇒ invalid (fail-closed)", () => {
    const record = evaluateGcs(
      baseInput({
        components: [
          // `aphasia` pertence ao vocabulário do componente verbal, não do ocular.
          notTestable("eye", "aphasia"),
          score("verbal", 5),
          score("motor", 6),
        ],
      }),
    );
    expect(record.status).toBe("invalid");
    expect(record.reasons).toEqual(["unmappable_code:eye"]);
    expect(record.total).toBeNull();
  });

  it("bloqueio neuromuscular é motivo admissível nos TRÊS componentes (OQ-GCS-4)", () => {
    for (const component of ["eye", "verbal", "motor"] as const) {
      const components = [score("eye", 4), score("verbal", 5), score("motor", 6)].filter(
        (o) => o.component !== component,
      );
      components.push(notTestable(component, "neuromuscular_blockade"));
      const record = evaluateGcs(baseInput({ components }));
      expect(record.status, `${component} NT por BNM`).toBe("not_evaluated");
      expect(record.reasons).toEqual(["component_not_testable"]);
    }
  });

  it("unidade dimensional inesperada ⇒ invalid(unmappable_unit) — a GCS é adimensional", () => {
    const record = evaluateGcs(
      baseInput({
        components: [score("eye", 4, 180, "mm[Hg]"), score("verbal", 5), score("motor", 6)],
      }),
    );
    expect(record.status).toBe("invalid");
    expect(record.reasons).toEqual(["unmappable_unit:eye"]);
  });

  it('unidades adimensionais aceitas ("{score}", "1", vazia) pontuam normalmente', () => {
    for (const unit of ["{score}", "1", ""]) {
      const record = evaluateGcs(
        baseInput({
          components: [score("eye", 4, 180, unit), score("verbal", 5), score("motor", 6)],
        }),
      );
      expect(record.status, `unidade ${unit}`).toBe("valid");
      expect(record.total).toBe(15);
    }
  });

  it("valor não inteiro ⇒ invalid(out_of_range), nunca arredondado", () => {
    const record = evaluateGcs(
      baseInput({ components: [score("eye", 3.5), score("verbal", 5), score("motor", 6)] }),
    );
    expect(record.status).toBe("invalid");
    expect(record.reasons).toEqual(["out_of_range:eye"]);
  });

  it("valor 0 (abaixo da enumeração) ⇒ invalid — 0 não é 'sem dado' nem mínimo", () => {
    const record = evaluateGcs(
      baseInput({ components: [score("eye", 0), score("verbal", 5), score("motor", 6)] }),
    );
    expect(record.status).toBe("invalid");
    expect(record.reasons).toEqual(["out_of_range:eye"]);
  });
});

describe("RULE-GCS — integridade de fonte, conflito e tempo clínico", () => {
  it("fonte em quarentena não contribui: not_evaluated(quarantined_input)", () => {
    const record = evaluateGcs(
      baseInput({
        components: [
          {
            component: "eye",
            value: { kind: "score", value: 4 },
            effectiveTime: before(180),
            provenance: { sourceSystem: "SYNTH-beira-leito-01", sourceDataQuality: "quarantined" },
          },
          score("verbal", 5),
          score("motor", 6),
        ],
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["quarantined_input:eye"]);
  });

  it("tempo clínico ausente ⇒ missing_clinical_time; nunca se assume 'agora'", () => {
    const record = evaluateGcs(
      baseInput({
        components: [
          {
            component: "eye",
            value: { kind: "score", value: 4 },
            effectiveTime: null,
            provenance: PROVENANCE,
          },
          score("verbal", 5),
          score("motor", 6),
        ],
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["missing_clinical_time:eye"]);
  });

  it("valores simultâneos divergentes ⇒ invalid(conflicting_sources)", () => {
    const record = evaluateGcs(
      baseInput({
        components: [score("eye", 4), score("eye", 2), score("verbal", 5), score("motor", 6)],
      }),
    );
    expect(record.status).toBe("invalid");
    expect(record.reasons).toEqual(["conflicting_sources:eye"]);
  });

  it("valor e NT simultâneos no mesmo componente ⇒ conflito, nunca escolha silenciosa", () => {
    const record = evaluateGcs(
      baseInput({
        components: [
          score("verbal", 5),
          notTestable("verbal", "endotracheal_intubation"),
          score("eye", 4),
          score("motor", 6),
        ],
      }),
    );
    expect(record.status).toBe("invalid");
    expect(record.reasons).toEqual(["conflicting_sources:verbal"]);
  });

  it("observações seriadas: vale o tempo clínico mais recente", () => {
    const record = evaluateGcs(
      baseInput({
        components: [
          score("eye", 2, 300),
          score("eye", 4, 180),
          score("verbal", 5),
          score("motor", 6),
        ],
      }),
    );
    expect(record.status).toBe("valid");
    expect(record.components.find((c) => c.component === "eye")?.value).toBe(4);
    expect(record.total).toBe(15);
  });
});

describe("RULE-GCS — bordas de atualidade, expiração e contemporaneidade", () => {
  const todos = (minutesBefore: number): GcsComponentObservationInput[] => [
    score("eye", 4, minutesBefore),
    score("verbal", 5, minutesBefore),
    score("motor", 6, minutesBefore),
  ];

  it("idade exatamente 12 h (borda inclusiva) permanece valid", () => {
    const record = evaluateGcs(
      baseInput({
        components: todos(720),
        rass: { value: 0, effectiveTime: before(720), provenance: PROVENANCE },
      }),
    );
    expect(record.status).toBe("valid");
    expect(record.total).toBe(15);
  });

  it("12 h + 1 min ⇒ stale; 24 h (borda inclusiva) ainda stale", () => {
    for (const minutes of [721, 1440]) {
      const record = evaluateGcs(
        baseInput({
          components: todos(minutes),
          rass: { value: 0, effectiveTime: before(minutes), provenance: PROVENANCE },
        }),
      );
      expect(record.status, `${minutes} min`).toBe("stale");
      expect(record.total).toBeNull();
      expect(
        record.components.every((c) => c.value !== null),
        "valor exibido em stale",
      ).toBe(true);
    }
  });

  it("além de 24 h ⇒ not_evaluated(expired_input) — não-conclusão, não conclusão degradada", () => {
    const record = evaluateGcs(
      baseInput({
        components: todos(1441),
        rass: { value: 0, effectiveTime: before(1441), provenance: PROVENANCE },
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect([...record.reasons].sort()).toEqual([
      "expired_input:eye",
      "expired_input:motor",
      "expired_input:verbal",
    ]);
    expect(record.components.every((c) => c.value === null)).toBe(true);
  });

  it("dispersão de exatamente 30 min entre componentes é aceita; 31 min não é", () => {
    const ok = evaluateGcs(
      baseInput({
        components: [score("eye", 4, 180), score("verbal", 5, 165), score("motor", 6, 150)],
      }),
    );
    expect(ok.status).toBe("valid");

    const nao = evaluateGcs(
      baseInput({
        components: [score("eye", 4, 180), score("verbal", 5, 165), score("motor", 6, 149)],
      }),
    );
    expect(nao.status).toBe("not_evaluated");
    expect(nao.reasons).toContain("component_set_not_contemporaneous");
    expect(nao.total).toBeNull();
  });
});

describe("RULE-GCS — gate de avaliabilidade (ADR-0028, FAIL-CLOSED)", () => {
  const todosNoMesmoInstante = [
    score("eye", 4, 180),
    score("verbal", 5, 180),
    score("motor", 6, 180),
  ];

  it("pareamento de RASS: 60 min exatos pareiam; 61 min não pareiam (fail-closed)", () => {
    const pareado = evaluateGcs(
      baseInput({
        components: todosNoMesmoInstante,
        rass: { value: 0, effectiveTime: before(240), provenance: PROVENANCE },
      }),
    );
    expect(pareado.assessability).toBe("testable");
    expect(pareado.status).toBe("valid");

    const naoPareado = evaluateGcs(
      baseInput({
        components: todosNoMesmoInstante,
        rass: { value: 0, effectiveTime: before(241), provenance: PROVENANCE },
      }),
    );
    expect(naoPareado.assessability).toBe("sedation_state_unknown");
    expect(naoPareado.reasons).toEqual(["sedation_state_unknown"]);
    expect(naoPareado.total).toBeNull();
  });

  it("RASS fora do domínio −5..+4 ⇒ invalid(out_of_range:rass), nunca clampado", () => {
    for (const value of [5, -6, 1.5]) {
      const record = evaluateGcs(
        baseInput({ rass: { value, effectiveTime: before(180), provenance: PROVENANCE } }),
      );
      expect(record.status, `RASS ${value}`).toBe("invalid");
      expect(record.reasons).toContain("out_of_range:rass");
      expect(record.assessability).toBe("sedation_state_unknown");
      expect(record.total).toBeNull();
    }
  });

  it("RASS de fonte quarentenada não destrava o gate", () => {
    const record = evaluateGcs(
      baseInput({
        rass: {
          value: 0,
          effectiveTime: before(180),
          provenance: { sourceSystem: "SYNTH-beira-leito-01", sourceDataQuality: "quarantined" },
        },
      }),
    );
    expect(record.assessability).toBe("sedation_state_unknown");
    expect(record.status).toBe("not_evaluated");
  });

  it("RASS sem tempo clínico não pareia ⇒ sedation_state_unknown", () => {
    const record = evaluateGcs(
      baseInput({ rass: { value: 0, effectiveTime: null, provenance: PROVENANCE } }),
    );
    expect(record.assessability).toBe("sedation_state_unknown");
  });

  it("infusão sedativa ativa sem janela de interrupção confunde MESMO com RASS 0", () => {
    const record = evaluateGcs(baseInput({ sedativeExposure: "active_infusion" }));
    expect(record.assessability).toBe("sedation_confounded");
    expect(record.reasons).toEqual(["sedation_confounded"]);
    expect(record.total).toBeNull();
  });

  it("RASS ≤ −3 com janela de interrupção documentada permanece confundida (fail-closed)", () => {
    const record = evaluateGcs(
      baseInput({
        rass: { value: -3, effectiveTime: before(180), provenance: PROVENANCE },
        sedativeExposure: "interrupted_window_documented",
      }),
    );
    expect(record.assessability).toBe("sedation_confounded");
  });

  it("RASS ≥ −2 com janela de interrupção documentada é testável (destrava o caso real)", () => {
    const record = evaluateGcs(
      baseInput({
        rass: { value: -2, effectiveTime: before(180), provenance: PROVENANCE },
        sedativeExposure: "interrupted_window_documented",
      }),
    );
    expect(record.assessability).toBe("testable");
    expect(record.status).toBe("valid");
  });

  it("limiar exato: RASS −2 destrava, RASS −3 com exposição desconhecida confunde", () => {
    const destrava = evaluateGcs(
      baseInput({
        rass: { value: -2, effectiveTime: before(180), provenance: PROVENANCE },
        sedativeExposure: "unknown",
      }),
    );
    expect(destrava.assessability).toBe("testable");
    expect(destrava.status).toBe("valid");

    const confunde = evaluateGcs(
      baseInput({
        rass: { value: -3, effectiveTime: before(180), provenance: PROVENANCE },
        sedativeExposure: "unknown",
      }),
    );
    expect(confunde.assessability).toBe("sedation_confounded");
    expect(confunde.status).toBe("not_evaluated");
  });

  it("gate não aplicável quando nenhum componente tem valor observado", () => {
    const record = evaluateGcs(
      baseInput({ components: [], rass: null, sedativeExposure: "unknown" }),
    );
    expect(record.assessability).toBe("not_applicable");
    expect([...record.reasons].sort()).toEqual([
      "missing_required_input:eye",
      "missing_required_input:motor",
      "missing_required_input:verbal",
    ]);
  });
});

describe("RULE-GCS — total fornecido pela fonte (spec §5.2, OQ-GCS-6)", () => {
  it("total da fonte que confere com a soma é apenas cross-check anotado", () => {
    const record = evaluateGcs(
      baseInput({ sourceProvidedTotal: { value: 15, effectiveTime: before(180) } }),
    );
    expect(record.status).toBe("valid");
    expect(record.total).toBe(15);
    expect(record.annotations.join(" ")).toContain("confere com a soma");
  });

  it("divergência soma × total da fonte ⇒ invalid(component_total_mismatch)", () => {
    const record = evaluateGcs(
      baseInput({ sourceProvidedTotal: { value: 14, effectiveTime: before(180) } }),
    );
    expect(record.status).toBe("invalid");
    expect(record.reasons).toContain("component_total_mismatch");
    expect(record.total).toBeNull();
  });

  it("total da fonte fora de 3–15 ⇒ invalid(out_of_range:source_total)", () => {
    const record = evaluateGcs(
      baseInput({ sourceProvidedTotal: { value: 2, effectiveTime: before(180) } }),
    );
    expect(record.status).toBe("invalid");
    expect(record.reasons).toContain("out_of_range:source_total");
  });

  it("total da fonte SEM componentes ⇒ not_evaluated(missing_required_input:components)", () => {
    const record = evaluateGcs(
      baseInput({
        components: [],
        sourceProvidedTotal: { value: 12, effectiveTime: before(180) },
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["missing_required_input:components"]);
    expect(record.total).toBeNull();
    expect(record.annotations.join(" ")).toContain("não aceito para computação");
  });
});

describe("RULE-GCS — anotações obrigatórias e carve-outs", () => {
  it("GCS pré-sedação dentro de 72 h é exibida como referência, jamais somada", () => {
    const record = evaluateGcs(
      baseInput({
        sedativeExposure: "active_infusion",
        lastPreSedationGcs: { total: 14, observedAt: before(60 * 24) },
      }),
    );
    expect(record.total).toBeNull();
    expect(record.annotations.join(" ")).toContain("EXIBIÇÃO APENAS");
    expect(record.annotations.join(" ")).toContain("14");
  });

  it("GCS pré-sedação acima de 72 h NÃO é exibida como referência (A28-6)", () => {
    const record = evaluateGcs(
      baseInput({
        sedativeExposure: "active_infusion",
        lastPreSedationGcs: { total: 14, observedAt: before(60 * 73) },
      }),
    );
    expect(record.annotations.join(" ")).toContain("excede 72 h");
    expect(record.total).toBeNull();
  });

  it("ordem de limitação terapêutica NÃO suprime a avaliação (spec §1.3.1)", () => {
    const record = evaluateGcs(baseInput({ treatmentLimitationOrderDocumented: true }));
    expect(record.status).toBe("valid");
    expect(record.total).toBe(15);
    expect(record.annotations.join(" ")).toContain("metas de cuidado");
  });

  it("o estado de avaliabilidade é sempre anotado em pt-BR", () => {
    const record = evaluateGcs(baseInput());
    expect(record.annotations[0]).toContain("estado de avaliabilidade");
  });
});

describe("RULE-GCS — curto-circuito de gate e fallback total", () => {
  it("gate populacional roda ANTES da lógica de regra: nada é avaliado", () => {
    const record = evaluateGcs(
      baseInput({
        age: { kind: "unknown" },
        components: [score("eye", 99), score("verbal", 5), score("motor", 6)],
      }),
    );
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["population_unverified"]);
    expect(record.components.every((c) => c.status === "not_evaluated")).toBe(true);
    expect(record.populationGate.passed).toBe(false);
  });

  it("instante de avaliação inutilizável ⇒ not_evaluated(unspecified_condition)", () => {
    const record = evaluateGcs(baseInput({ evaluationTime: "não é uma data" }));
    expect(record.status).toBe("not_evaluated");
    expect(record.reasons).toEqual(["unspecified_condition"]);
    expect(record.total).toBeNull();
  });
});

describe("RULE-GCS — reavaliação em tempo de leitura (spec §5.3; ADR-0008 N5)", () => {
  it("um registro valid envelhece para stale e depois para expirado na leitura", () => {
    const record = evaluateGcs(baseInput());
    expect(record.status).toBe("valid");

    expect(reassessGcsAtReadTime(record, EVAL_TIME_GCS).status).toBe("valid");

    const stale = reassessGcsAtReadTime(record, after(60 * 11));
    expect(stale.status).toBe("stale");
    expect(stale.reasons.length).toBeGreaterThan(0);

    const expirado = reassessGcsAtReadTime(record, after(60 * 23));
    expect(expirado.status).toBe("not_evaluated");
    expect(expirado.reasons.every((r) => r.startsWith("expired_input:"))).toBe(true);
  });

  it("registro não-válido é devolvido como está (nenhuma promoção de status)", () => {
    const record = evaluateGcs(baseInput({ rass: null, sedativeExposure: "unknown" }));
    const reavaliado = reassessGcsAtReadTime(record, after(60 * 30));
    expect(reavaliado.status).toBe(record.status);
    expect(reavaliado.reasons).toEqual([...record.reasons]);
  });

  it("instante de leitura inutilizável ⇒ not_evaluated, nunca 'ainda válido'", () => {
    const record = evaluateGcs(baseInput());
    expect(reassessGcsAtReadTime(record, "ontem").status).toBe("not_evaluated");
  });
});

describe("RULE-GCS — texto de explicação é contrato de segurança (spec §10)", () => {
  it("total válido: exibe total, componentes, versão da regra e enquadramento de apoio", () => {
    const record = evaluateGcs(baseInput());
    expect(record.explanation).toContain("15 de 15");
    expect(record.explanation).toContain("E4 V5 M6");
    expect(record.explanation).toContain("RULE-GCS v0.2.0");
    expect(record.explanation).toContain("não é uma diretriz");
  });

  it("componente NT: explica POR QUE nenhum total é exibido", () => {
    const record = evaluateGcs(
      baseInput({
        components: [
          score("eye", 4),
          notTestable("verbal", "endotracheal_intubation"),
          score("motor", 6),
        ],
      }),
    );
    expect(record.explanation).toContain("total não calculado");
    expect(record.explanation).toContain("artificialmente baixo");
    expect(record.explanation).toContain("glasgowcomascale.org");
    expect(record.explanation).toContain("componentes testados");
  });

  it("confundida por sedação: diz que os componentes refletem efeito de droga", () => {
    const record = evaluateGcs(baseInput({ sedativeExposure: "active_infusion" }));
    expect(record.explanation).toContain("confundida por sedação");
    expect(record.explanation).toContain("efeito de droga");
  });

  it("não avaliada: a ausência de escore é dita explicitamente como NÃO normalidade", () => {
    const record = evaluateGcs(baseInput({ components: [] }));
    expect(record.explanation).toContain("NÃO significa normalidade");
  });

  it("nenhuma superfície emite banda de severidade nem mapeamento GCS→ACVPU", () => {
    const record = evaluateGcs(baseInput());
    // Nenhum campo de banda/tier existe no registro (OQ-GCS-9: banda exigiria
    // fonte nomeada própria; OQ-GCS-10: nenhum mapeamento GCS→ACVPU em 0.2.0).
    for (const campo of ["riskTier", "tier", "band", "severity", "acvpu"]) {
      expect(Object.keys(record), `campo proibido: ${campo}`).not.toContain(campo);
    }
    const serializado = JSON.stringify(record);
    for (const proibido of ["ACVPU", "muito_grave", "moderado"]) {
      expect(serializado, `token proibido: ${proibido}`).not.toContain(proibido);
    }
    // A explicação declara a ausência de banda em vez de emitir uma.
    expect(record.explanation).toContain("nenhuma banda de severidade é emitida");
  });
});

describe("RULE-GCS — determinismo", () => {
  it("mesma entrada ⇒ mesmo registro, byte a byte", () => {
    const input = buildGcsVectorInput({});
    expect(JSON.stringify(evaluateGcs(input))).toBe(JSON.stringify(evaluateGcs(input)));
  });

  it("nenhum relógio interno: mudar apenas o instante de avaliação muda o resultado", () => {
    const dentro = evaluateGcs(baseInput());
    const fora = evaluateGcs(
      baseInput({ evaluationTime: new Date(EVAL_MS + 60 * 60 * 1000 * 20).toISOString() }),
    );
    expect(dentro.status).toBe("valid");
    expect(fora.status).not.toBe("valid");
  });
});
