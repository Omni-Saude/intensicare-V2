/**
 * Testes dos conversores de exames do RULE-SOFA (`src/unidades/exames.ts`):
 * fatores EXATOS da logic.yaml (÷17.104, ÷88.42, ×7.50062) e rejeição alta
 * de unidade inmapeável (HAZ-0032). FiO2/dose têm piso próprio do ORQ-4
 * (`unidades.unidade.test.ts`/`unidades.propriedades.test.ts`); a triagem
 * SOFA de unidade ausente/reconhecida vive em `sofa.unidade.test.ts`.
 */

import { describe, expect, it } from "vitest";
import {
  paraBilirrubinaMgDl,
  paraCreatininaMgDl,
  paraPaO2MmHg,
  paraPlaquetasContagem,
} from "../src/index.js";

describe("unidades/exames — conversões exatas antes da comparação (OQ-6 (a))", () => {
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

  it("PaO2: mm[Hg] identidade; kPa ×7.50062; resto inmapeável", () => {
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
