/**
 * Testes do piso de unidades SOFA-scoped (`src/unidades/`): rejeição ALTA e
 * tipada de entrada não conversível — nunca adivinhação (HAZ-0032). Cada
 * fator exato é o pinado na logic.yaml (÷17.104, ÷88.42) e na spec §3.1
 * (×7.50062 kPa; FiO2 % → ÷100 somente no intervalo legal).
 */

import { describe, expect, it } from "vitest";
import {
  doseUgKgMinDe,
  paraBilirrubinaMgDl,
  paraCreatininaMgDl,
  paraFio2Fracao,
  paraPaO2MmHg,
  paraPlaquetasContagem,
} from "../src/index.js";

describe("unidades — FiO2 fração (nunca adivinhar; CRV-SOFA-0330)", () => {
  it("unidade '1': fração legal 0.21–1.0 aceita; fora → fora_da_faixa", () => {
    expect(paraFio2Fracao({ value: 0.21, unit: "1" })).toMatchObject({
      ok: true,
      convertido: false,
    });
    expect(paraFio2Fracao({ value: 1.0, unit: "1" })).toMatchObject({
      ok: true,
      convertido: false,
    });
    expect(paraFio2Fracao({ value: 0.4, unit: "1" })).toMatchObject({
      ok: true,
      convertido: false,
    });
    expect(paraFio2Fracao({ value: 40, unit: "1" })).toMatchObject({
      ok: false,
      motivo: "fora_da_faixa",
    });
    expect(paraFio2Fracao({ value: 0.1, unit: "1" })).toMatchObject({
      ok: false,
      motivo: "fora_da_faixa",
    });
  });

  it("unidade '%': 21–100 converte ÷100; fora do intervalo → fora_da_faixa", () => {
    const convertido = paraFio2Fracao({ value: 40, unit: "%" });
    expect(convertido).toMatchObject({ ok: true, convertido: true });
    if (convertido.ok) expect(convertido.fracao).toBeCloseTo(0.4, 12);
    expect(paraFio2Fracao({ value: 150, unit: "%" })).toMatchObject({
      ok: false,
      motivo: "fora_da_faixa",
    });
  });

  it("unidade AUSENTE é rejeitada SEM adivinhação — nem fração, nem percentual", () => {
    expect(paraFio2Fracao({ value: 40, unit: "" })).toMatchObject({
      ok: false,
      motivo: "unidade_ausente",
    });
    expect(paraFio2Fracao({ value: 0.4, unit: "" })).toMatchObject({
      ok: false,
      motivo: "unidade_ausente",
    });
  });

  it("unidade inmapeável é rejeitada", () => {
    expect(paraFio2Fracao({ value: 40, unit: "vol%" })).toMatchObject({
      ok: false,
      motivo: "unidade_inmapeavel",
    });
  });
});

describe("unidades — conversões exatas antes da comparação (OQ-6 (a))", () => {
  it("bilirrubina: mg/dL identidade; umol/L ÷17.104 exato; outra unidade → inmapeável", () => {
    expect(paraBilirrubinaMgDl({ value: 1.95, unit: "mg/dL" })).toMatchObject({
      ok: true,
      valor: 1.95,
      convertido: false,
    });
    const convertido = paraBilirrubinaMgDl({ value: 34, unit: "umol/L" });
    expect(convertido).toMatchObject({ ok: true, convertido: true });
    if (convertido.ok) {
      // 34 / 17.104 = 1.98771… mg/dL — a conversão EXATA que põe 34 umol/L
      // na banda 1 (lida como mg/dL seria banda 4: erro de 17×).
      expect(convertido.valor).toBeCloseTo(34 / 17.104, 15);
      expect(convertido.valor).toBeLessThan(2.0);
    }
    expect(paraBilirrubinaMgDl({ value: 1, unit: "mg/L" })).toMatchObject({
      ok: false,
      motivo: "unidade_inmapeavel",
    });
  });

  it("creatinina: umol/L ÷88.42 exato; mg/dL identidade", () => {
    const convertido = paraCreatininaMgDl({ value: 442, unit: "umol/L" });
    expect(convertido).toMatchObject({ ok: true, convertido: true });
    if (convertido.ok) expect(convertido.valor).toBeCloseTo(442 / 88.42, 15);
    expect(paraCreatininaMgDl({ value: 5.0, unit: "mg/dL" })).toMatchObject({
      ok: true,
      valor: 5.0,
      convertido: false,
    });
    expect(paraCreatininaMgDl({ value: 5, unit: "µmol/l" })).toMatchObject({
      ok: false,
      motivo: "unidade_inmapeavel",
    });
  });

  it("PaO2: mm[Hg] identidade; kPa ×7.50062", () => {
    const convertido = paraPaO2MmHg({ value: 13.3, unit: "kPa" });
    expect(convertido).toMatchObject({ ok: true, convertido: true });
    if (convertido.ok) expect(convertido.valor).toBeCloseTo(13.3 * 7.50062, 15);
    expect(paraPaO2MmHg({ value: 96, unit: "mm[Hg]" })).toMatchObject({
      ok: true,
      valor: 96,
      convertido: false,
    });
    expect(paraPaO2MmHg({ value: 96, unit: "cmH2O" })).toMatchObject({
      ok: false,
      motivo: "unidade_inmapeavel",
    });
  });

  it("plaquetas: 10*3/uL e 10*9/L idênticos; resto inmapeável", () => {
    expect(paraPlaquetasContagem({ value: 250, unit: "10*3/uL" })).toMatchObject({
      ok: true,
      convertido: false,
    });
    expect(paraPlaquetasContagem({ value: 250, unit: "10*9/L" })).toMatchObject({
      ok: true,
      convertido: false,
    });
    expect(paraPlaquetasContagem({ value: 250, unit: "/nL" })).toMatchObject({
      ok: false,
      motivo: "unidade_inmapeavel",
    });
  });
});

describe("unidades — taxas de dose (piso vs integridade)", () => {
  it("ug/kg/min é a única unidade usável (branded)", () => {
    const dose = doseUgKgMinDe({ value: 0.5, unit: "ug/kg/min" });
    expect(dose).toMatchObject({ ok: true, convertido: false });
    if (dose.ok) expect(typeof dose.dose).toBe("number");
  });

  it("ug/min e mL/h são RECONHECIDAS mas não normalizáveis (piso por presença, não invalid)", () => {
    expect(doseUgKgMinDe({ value: 8, unit: "ug/min" })).toMatchObject({
      ok: false,
      motivo: "unidade_reconhecida_nao_normalizavel",
    });
    expect(doseUgKgMinDe({ value: 10, unit: "mL/h" })).toMatchObject({
      ok: false,
      motivo: "unidade_reconhecida_nao_normalizavel",
    });
  });

  it("unidade fora do conjunto reconhecido é INMAPEÁVEL (integridade)", () => {
    expect(doseUgKgMinDe({ value: 1, unit: "bag/dia" })).toMatchObject({
      ok: false,
      motivo: "unidade_inmapeavel",
    });
    expect(doseUgKgMinDe({ value: 1, unit: "" })).toMatchObject({
      ok: false,
      motivo: "unidade_inmapeavel",
    });
  });
});
