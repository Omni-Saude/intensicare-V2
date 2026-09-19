/**
 * Testes do adaptador da avaliação REAL (kernel-clinico ↔ contrato).
 * Funções puras — sem banco, sem rede. Inclui a garantia da correção 3 da
 * revisão única SPR-G7-2: a API integrada JAMAIS produz `parcial` para
 * NEWS2 (N-8/GDEC-0007; `parcial` reservado às classes 2+ do ADR-0026).
 */

import { SYNTHETIC_CONCEPTS } from "@intensicare/fixtures-sinteticas";
import type { EvaluationRecord } from "@intensicare/kernel-clinico";
import type { ClinicalObservationRow } from "@intensicare/persistencia";
import { describe, expect, it } from "vitest";
import {
  canonicalUnitFor,
  estadoAnteriorDeAvaliacao,
  evaluateEncounter,
  mapStatusNews2,
  requerAlerta,
  toResultadoAvaliacao,
} from "./avaliacao.js";

const EVAL_TIME = "2026-08-16T12:00:00.000Z";
const OBS_TIME = "2026-08-16T11:58:00.000Z";

function row(
  concept: string,
  sourceValue: number | null,
  sourceUnit: string | null,
  sourceCode: string | null = null,
  utc: string = OBS_TIME,
): ClinicalObservationRow {
  return {
    id: `SYNTH-OBS-${concept}-${utc}`,
    tenantId: "SYNTH-TENANT-G7",
    encounterId: "SYNTH-TENANT-G7-ENC-P002",
    concept,
    sourceValue,
    sourceUnit,
    sourceCode,
    canonicalValue: null,
    canonicalUnit: null,
    quality: "valid",
    effectiveAt: { kind: "present", instant: { utc, offset: "+00:00" } },
  };
}

/** Série completa (sete parâmetros), valores da deterioração T2 do cenário G7. */
function fullSeries(): ClinicalObservationRow[] {
  return [
    row(SYNTHETIC_CONCEPTS.respiratoryRate, 26, "rpm"),
    row(SYNTHETIC_CONCEPTS.oxygenSaturation, 89, "%"),
    row("SYNTH-CONCEPT-O2-FLOW", 0, "L/min"),
    row(SYNTHETIC_CONCEPTS.systolicBloodPressure, 92, "mmHg"),
    row(SYNTHETIC_CONCEPTS.heartRate, 122, "bpm"),
    row("SYNTH-CONCEPT-CONSCIOUSNESS", null, null, "A"),
    row(SYNTHETIC_CONCEPTS.temperature, 38.3, "Cel"),
  ];
}

describe("alias de unidade (identidade, sem conversão numérica)", () => {
  it("mapeia bpm→/min, rpm→/min, mmHg→mm[Hg]; unidade desconhecida fica sem canônica", () => {
    expect(canonicalUnitFor("pulse", "bpm")).toBe("/min");
    expect(canonicalUnitFor("rr", "rpm")).toBe("/min");
    expect(canonicalUnitFor("sbp", "mmHg")).toBe("mm[Hg]");
    expect(canonicalUnitFor("pulse", "batimentos")).toBeUndefined();
  });
});

describe("avaliação real de encontro (kernel NEWS2)", () => {
  it("série completa e fresca com deterioração → valido, escore 11, banda critico, gera alerta", () => {
    const record = evaluateEncounter(fullSeries(), { idadeAnos: 62 }, EVAL_TIME);
    expect(record.status).toBe("valid");
    expect(record.totalScore).toBe(11);
    expect(record.riskTier).toBe("high");
    expect(requerAlerta(record)).toBe(true);

    const resultado = toResultadoAvaliacao(record);
    expect(resultado.status).toBe("valido");
    expect(resultado.escore).toBe(11);
    expect(resultado.banda).toBe("critico");
    expect(resultado.versaoRegra).toBe("RULE-NEWS2@0.2.0");
    expect(resultado.parametros).toHaveLength(7);
  });

  it("SpO2 ausente → indisponivel com razão explícita; escore/banda null; JAMAIS parcial (HAZ-0005; N-8)", () => {
    const semSpo2 = fullSeries().filter((r) => r.concept !== SYNTHETIC_CONCEPTS.oxygenSaturation);
    const record = evaluateEncounter(semSpo2, { idadeAnos: 62 }, EVAL_TIME);
    expect(record.status).toBe("not_evaluated");
    expect(requerAlerta(record)).toBe(false);

    const resultado = toResultadoAvaliacao(record);
    expect(resultado.status).toBe("indisponivel");
    expect(resultado.status).not.toBe("parcial");
    expect(resultado.escore).toBeNull();
    expect(resultado.banda).toBeNull();
    expect(resultado.motivos).toContain("missing_required_input:spo2");
    expect(resultado.parametrosAusentes).toContain("SpO2");
  });

  it("contexto ausente → idade desconhecida → indisponivel (nunca presume adulto — HAZ-0036)", () => {
    const record = evaluateEncounter(fullSeries(), undefined, EVAL_TIME);
    expect(record.status).toBe("not_evaluated");
    const resultado = toResultadoAvaliacao(record);
    expect(resultado.status).toBe("indisponivel");
    expect(resultado.motivos).toContain("unknown_age");
    expect(resultado.escore).toBeNull();
  });

  it("unidade inmapeável → invalido fail-closed (nunca descartada para salvar a avaliação)", () => {
    const series = fullSeries().map((r) =>
      r.concept === SYNTHETIC_CONCEPTS.heartRate ? { ...r, sourceUnit: "batimentos" } : r,
    );
    const record = evaluateEncounter(series, { idadeAnos: 62 }, EVAL_TIME);
    expect(record.status).toBe("invalid");
    const resultado = toResultadoAvaliacao(record);
    expect(resultado.status).toBe("invalido");
    expect(resultado.motivos).toContain("unmappable_unit:pulse");
    expect(resultado.escore).toBeNull();
  });
});

describe("correção 3 (revisão única): 'parcial' inalcançável para NEWS2", () => {
  it("mapStatusNews2 degrada 'partial' (defeito hipotético do kernel) para 'indisponivel' — jamais 'parcial'", () => {
    expect(mapStatusNews2("partial")).toBe("indisponivel");
    expect(mapStatusNews2("valid")).toBe("valido");
    expect(mapStatusNews2("not_evaluated")).toBe("indisponivel");
    expect(mapStatusNews2("stale")).toBe("desatualizado");
    expect(mapStatusNews2("invalid")).toBe("invalido");
  });
});

describe("gatilho de borda do alerta de deterioração (CRIT-1; catálogo irmão ALERT-EWS-NEWS2-DETERIORATION-01)", () => {
  it("primeira medição (sem estado anterior) com total 11 → gatilho ARMADO dispara (premissa reversível documentada)", () => {
    const record = evaluateEncounter(fullSeries(), { idadeAnos: 62 }, EVAL_TIME);
    expect(record.alertCrossing).toBe(true);
    expect(record.alertCrossingReason).toBe("ascending_total_crossing");
    expect(record.alertCrossingInputs).toEqual({ news2Prev: null, prevRedParameters: null });
    expect(requerAlerta(record)).toBe(true);
  });

  it("estado anterior já alto com os MESMOS vermelhos (11 → 11) → patamar PERSISTENTE não dispara; exibição (fires) permanece", () => {
    const record = evaluateEncounter(fullSeries(), { idadeAnos: 62 }, EVAL_TIME, {
      totalScore: 11,
      redParameters: ["rr", "spo2"],
    });
    expect(record.totalScore).toBe(11);
    expect(record.fires).toBe(true);
    expect(record.alertCrossing).toBe(false);
    expect(record.alertCrossingReason).toBeNull();
    expect(requerAlerta(record)).toBe(false);
  });

  it("estado anterior abaixo de 7 (4 → 11) → cruzamento ascendente dispara", () => {
    const record = evaluateEncounter(fullSeries(), { idadeAnos: 62 }, EVAL_TIME, {
      totalScore: 4,
      redParameters: [],
    });
    expect(record.alertCrossing).toBe(true);
    expect(record.alertCrossingReason).toBe("ascending_total_crossing");
    expect(requerAlerta(record)).toBe(true);
  });

  it("banda média (5–6) NUNCA cria alerta de deterioração — rota da tendência (TV-2 do catálogo irmão)", () => {
    const media = [
      row(SYNTHETIC_CONCEPTS.respiratoryRate, 21, "rpm"),
      row(SYNTHETIC_CONCEPTS.oxygenSaturation, 94, "%"),
      row("SYNTH-CONCEPT-O2-FLOW", 0, "L/min"),
      row(SYNTHETIC_CONCEPTS.systolicBloodPressure, 105, "mmHg"),
      row(SYNTHETIC_CONCEPTS.heartRate, 95, "bpm"),
      row("SYNTH-CONCEPT-CONSCIOUSNESS", null, null, "A"),
      row(SYNTHETIC_CONCEPTS.temperature, 38.5, "Cel"),
    ];
    const record = evaluateEncounter(media, { idadeAnos: 62 }, EVAL_TIME);
    expect(record.totalScore).toBe(6);
    expect(record.fires).toBe(true);
    expect(record.alertCrossing).toBe(false);
    expect(requerAlerta(record)).toBe(false);
  });

  it("ordem de limitação terapêutica suprime o alerta mesmo com cruzamento (N-3)", () => {
    const record = evaluateEncounter(fullSeries(), { idadeAnos: 62 }, EVAL_TIME);
    const comLimitacao: EvaluationRecord = {
      ...record,
      escalationSuppressed: true,
      escalationSuppressionReason:
        "escalonamento suprimido — ordem de limitação terapêutica documentada",
    };
    expect(record.alertCrossing).toBe(true);
    expect(requerAlerta(comLimitacao)).toBe(false);
  });
});

describe("estadoAnteriorDeAvaliacao — extração do news2_prev da última linha persistida", () => {
  const base = {
    id: "SYNTH-AVAL-1",
    tenantId: "SYNTH-TENANT-G7",
    encounterId: "SYNTH-TENANT-G7-ENC-P002",
    subjectRef: "SYNTH-P002",
    evaluatedAt: { kind: "present" as const, instant: { utc: EVAL_TIME, offset: "+00:00" } },
    result: {},
    seq: 1,
  };

  it("linha válida com kernel_record íntegro → total + vermelhos extraídos", () => {
    const extraida = estadoAnteriorDeAvaliacao({
      ...base,
      status: "valid",
      totalScore: 11,
      riskTier: "high",
      redParameter: true,
      fires: true,
      kernelRecord: {
        parameters: [
          { parameter: "rr", status: "valid", score: 3 },
          { parameter: "spo2", status: "valid", score: 3 },
          { parameter: "pulse", status: "valid", score: 2 },
        ],
      },
    });
    expect(extraida).toEqual({ totalScore: 11, redParameters: ["rr", "spo2"] });
  });

  it("linha não computável → null (estado anterior DESCONHECIDO — kernel arma)", () => {
    expect(
      estadoAnteriorDeAvaliacao({
        ...base,
        status: "not_evaluated",
        totalScore: null,
        riskTier: null,
        redParameter: false,
        fires: false,
        kernelRecord: {},
      }),
    ).toBeNull();
  });

  it("kernel_record de forma inesperada → null (defensivo; nunca exceção de ingestão)", () => {
    expect(
      estadoAnteriorDeAvaliacao({
        ...base,
        status: "valid",
        totalScore: 7,
        riskTier: "high",
        redParameter: false,
        fires: true,
        kernelRecord: { parameters: "lixo" },
      }),
    ).toBeNull();
  });
});
