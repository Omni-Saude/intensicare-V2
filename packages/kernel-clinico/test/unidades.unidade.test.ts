/**
 * Testes unitários dos normalizadores de unidades (ORQ-4) — contrato RED.
 *
 * Cobre, por domínio:
 * - FiO2: fração em [0.21, 1.0] com classe de rejeição DISTINTA para valores
 *   na faixa percentual [21, 100] — o "50 nu" nunca pode virar fração
 *   silenciosa; percentual exige a via explícita de `Fio2Percentual`
 *   (units-registry.md §2.1, fator 0.01 = ÷100; hemodynamics.md §4).
 * - Lactato: mg/dL → mmol/L com fator ×0.111 e PRECISÃO TOTAL, sem
 *   arredondamento no módulo (HAZ-015; units-normalization-review.md:142).
 * - Dose: conversões de vasopressores e a fórmula de taxa de infusão
 *   (hemodynamics.md §4:288-323).
 * - `normalizarDoseVasopressora`: matriz de rejeição por categoria —
 *   vasopressina é U/min, nunca indexada a peso, nunca coagida
 *   (hemodynamics.md §4:301-307).
 * - Peso: guardas de plausibilidade provisórias [0.5, 350] kg (HAZ-021
 *   aberta, aguardando ratificação) e as DUAS portas de parse — a porta
 *   numérica ascii, onde vírgula é rejeitada e "70,5" NUNCA vira 705
 *   (SYS-09; HAZ-028), e o parser PT-BR explícito.
 */

import { describe, expect, it } from "vitest";
import {
  doseMcgKgMinDeMcgKgH,
  doseMcgKgMinDeMgKgMin,
  doseMcgKgMinDeTaxaInfusao,
  doseUminDeUh,
  doseUminDeUmin,
  fio2FracaoDeNumero,
  fio2PercentualDeNumero,
  fio2PercentualParaFracao,
  lactatoMgDlDeNumero,
  lactatoMgDlParaMmolL,
  lactatoMmolLDeNumero,
  type MotivoRejeicao,
  normalizarDoseVasopressora,
  PESO_KG_LIMITES_PLAUSIBILIDADE,
  parsePesoPtBr,
  pesoDeNumeroKg,
  pesoDeTextoAscii,
  type ResultadoQuantidade,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Auxiliares de asserção — falham ALTO com contexto, nunca silenciosamente.
// ---------------------------------------------------------------------------

function exigirConvertido<T>(resultado: ResultadoQuantidade<T>, contexto = ""): T {
  if (resultado.status !== "convertido") {
    throw new Error(`esperado convertido${contexto} — obtido: ${JSON.stringify(resultado)}`);
  }
  return resultado.valor;
}

function exigirRejeitado<T>(
  resultado: ResultadoQuantidade<T>,
  motivo: MotivoRejeicao,
  contexto = "",
): asserts resultado is Extract<ResultadoQuantidade<T>, { status: "rejeitado" }> {
  if (resultado.status !== "rejeitado") {
    throw new Error(`esperado rejeitado${contexto} — obtido: ${JSON.stringify(resultado)}`);
  }
  if (resultado.motivo !== motivo) {
    throw new Error(
      `esperado motivo "${motivo}"${contexto} — obtido "${resultado.motivo}" (${resultado.mensagem})`,
    );
  }
}

/** Peso validado para insumos de teste — kg dentro de [0.5, 350] por construção. */
function pesoDeTeste(kg: number) {
  return exigirConvertido(pesoDeNumeroKg(kg), ` (peso de teste ${kg} kg)`);
}

describe("FiO2 — fração e percentual (units-registry.md §2.1; hemodynamics.md §4)", () => {
  it("aceita frações no limite inferior 0.21, interiores e no limite superior 1.0", () => {
    for (const valor of [0.21, 0.5, 1.0]) {
      expect(fio2FracaoDeNumero(valor).status, `FiO2 fração ${valor}`).toBe("convertido");
    }
  });

  it("rejeita 1.5, 20, 0.2, -1 e NaN como fora da faixa — o vão (1.0, 21) não é fração nem percentual", () => {
    for (const valor of [1.5, 20, 0.2, Number.NaN, -1]) {
      exigirRejeitado(fio2FracaoDeNumero(valor), "rejected_fora_da_faixa", ` (fração ${valor})`);
    }
  });

  it("rejeita 21, 50 e 100 como valor percentual — percentual exige a via explícita de Fio2Percentual", () => {
    for (const valor of [21, 50, 100]) {
      exigirRejeitado(fio2FracaoDeNumero(valor), "rejected_valor_percentual", ` (fração ${valor})`);
    }
  });

  it("aceita percentuais nos limites 21 e 100 e interiores (50)", () => {
    for (const valor of [21, 50, 100]) {
      expect(fio2PercentualDeNumero(valor).status, `FiO2 percentual ${valor}`).toBe("convertido");
    }
  });

  it("rejeita 0.5, 1.5, 20.9 e NaN como percentual fora da faixa", () => {
    for (const valor of [0.5, 1.5, 20.9, Number.NaN]) {
      exigirRejeitado(
        fio2PercentualDeNumero(valor),
        "rejected_fora_da_faixa",
        ` (percentual ${valor})`,
      );
    }
  });

  it("converte percentual para fração dividindo por 100 exatamente: 21→0.21, 40→0.4, 100→1.0, 50→0.5", () => {
    // units-registry.md: fator 0.01 — semanticamente, divisão por 100.
    expect(fio2PercentualParaFracao(exigirConvertido(fio2PercentualDeNumero(21)))).toBe(0.21);
    expect(fio2PercentualParaFracao(exigirConvertido(fio2PercentualDeNumero(40)))).toBe(0.4);
    expect(fio2PercentualParaFracao(exigirConvertido(fio2PercentualDeNumero(100)))).toBe(1.0);
    expect(fio2PercentualParaFracao(exigirConvertido(fio2PercentualDeNumero(50)))).toBe(0.5);
  });
});

describe("Lactato — mg/dL → mmol/L (HAZ-015; units-normalization-review.md:142)", () => {
  it("converte 2, 4 e 18 mg/dL em 0.222, 0.444 e 1.998 mmol/L com precisão total", () => {
    // POLÍTICA DE ARREDONDAMENTO: nenhuma política de arredondamento está
    // documentada no registry — portanto exatidão (precisão total) é o
    // padrão seguro. A HAZ-015 cita "18 mg/dL → 2.0 mmol/L", mas esse é o
    // valor de EXIBIÇÃO arredondado; arredondar é preocupação da camada de
    // apresentação, nunca deste módulo.
    expect(lactatoMgDlParaMmolL(exigirConvertido(lactatoMgDlDeNumero(2)))).toBeCloseTo(0.222, 9);
    expect(lactatoMgDlParaMmolL(exigirConvertido(lactatoMgDlDeNumero(4)))).toBeCloseTo(0.444, 9);
    expect(lactatoMgDlParaMmolL(exigirConvertido(lactatoMgDlDeNumero(18)))).toBeCloseTo(1.998, 9);
  });

  it("converte 9.008 mg/dL em 0.999888 mmol/L (âncora units-normalization-review.md:142)", () => {
    expect(lactatoMgDlParaMmolL(exigirConvertido(lactatoMgDlDeNumero(9.008)))).toBeCloseTo(
      0.999888,
      9,
    );
  });

  it("aceita lactato não negativo e finito em mmol/L e mg/dL", () => {
    expect(lactatoMmolLDeNumero(2).status).toBe("convertido");
    expect(lactatoMmolLDeNumero(0).status).toBe("convertido");
    expect(lactatoMgDlDeNumero(9.008).status).toBe("convertido");
    expect(lactatoMgDlDeNumero(0).status).toBe("convertido");
  });

  it("rejeita lactato negativo como valor inválido (mmol/L e mg/dL)", () => {
    exigirRejeitado(lactatoMmolLDeNumero(-1), "rejected_valor_invalido", " (mmol/L -1)");
    exigirRejeitado(lactatoMgDlDeNumero(-1), "rejected_valor_invalido", " (mg/dL -1)");
  });

  it("rejeita NaN como valor inválido (mmol/L e mg/dL)", () => {
    exigirRejeitado(lactatoMmolLDeNumero(Number.NaN), "rejected_valor_invalido", " (mmol/L NaN)");
    exigirRejeitado(lactatoMgDlDeNumero(Number.NaN), "rejected_valor_invalido", " (mg/dL NaN)");
  });
});

describe("Dose — conversões de vasopressores (hemodynamics.md §4:288-323)", () => {
  it("converte mcg/kg/h dividindo por 60: 3 mcg/kg/h → 0.05 mcg/kg/min", () => {
    expect(exigirConvertido(doseMcgKgMinDeMcgKgH(3))).toBeCloseTo(0.05, 12);
  });

  it("converte mg/kg/min multiplicando por 1000: 0.0005 mg/kg/min → 0.5 mcg/kg/min", () => {
    expect(exigirConvertido(doseMcgKgMinDeMgKgMin(0.0005))).toBeCloseTo(0.5, 12);
  });

  it("aplica a fórmula da spec: 10 mL/h × 0.016 mg/mL em 70 kg → 0.038 mcg/kg/min (0.038095238095238095 exato a 12 casas)", () => {
    // Exemplo trabalhado da hemodynamics.md §4:294-296 — noradrenalina 4 mg
    // em 250 mL = 0.016 mg/mL; (taxa × concentracao × 1000) / (peso × 60).
    const dose = exigirConvertido(
      doseMcgKgMinDeTaxaInfusao({
        taxaInfusaoMlH: 10,
        concentracaoFarmacoMgMl: 0.016,
        peso: pesoDeTeste(70),
      }),
    );
    // Oráculo fixo: 0.038095238095238095 (a 12 casas), escrito como o double
    // exato desse decimal em runtime (regra noPrecisionLoss do Biome).
    expect(dose).toBeCloseTo(0.03809523809523809, 12);
    // Exato a 3 casas decimais, como a spec publica.
    expect(Number(dose.toFixed(3))).toBe(0.038);
  });

  it("converte U/h dividindo por 60: 0.03 U/h → 0.0005 U/min", () => {
    expect(exigirConvertido(doseUminDeUh(0.03))).toBeCloseTo(0.0005, 12);
  });

  it("aceita U/min direto, validado", () => {
    expect(exigirConvertido(doseUminDeUmin(0.0005))).toBeCloseTo(0.0005, 12);
  });

  it("rejeita valores negativos como inválidos em todos os construtores de dose", () => {
    exigirRejeitado(doseMcgKgMinDeMcgKgH(-1), "rejected_valor_invalido", " (mcg/kg/h)");
    exigirRejeitado(doseMcgKgMinDeMgKgMin(-1), "rejected_valor_invalido", " (mg/kg/min)");
    exigirRejeitado(doseUminDeUh(-1), "rejected_valor_invalido", " (U/h)");
    exigirRejeitado(doseUminDeUmin(-1), "rejected_valor_invalido", " (U/min)");
  });

  it("rejeita NaN como inválido em todos os construtores de dose", () => {
    exigirRejeitado(doseMcgKgMinDeMcgKgH(Number.NaN), "rejected_valor_invalido", " (mcg/kg/h NaN)");
    exigirRejeitado(
      doseMcgKgMinDeMgKgMin(Number.NaN),
      "rejected_valor_invalido",
      " (mg/kg/min NaN)",
    );
    exigirRejeitado(doseUminDeUh(Number.NaN), "rejected_valor_invalido", " (U/h NaN)");
    exigirRejeitado(doseUminDeUmin(Number.NaN), "rejected_valor_invalido", " (U/min NaN)");
  });

  it("rejeita taxa ou concentração não finita/negativa na fórmula mL/h — NaN nunca sai de um construtor marcado", () => {
    // Emenda de contrato: os insumos numéricos da fórmula passam pela mesma
    // validação dos demais construtores — dose marcada nunca carrega NaN.
    exigirRejeitado(
      doseMcgKgMinDeTaxaInfusao({
        taxaInfusaoMlH: Number.NaN,
        concentracaoFarmacoMgMl: 0.016,
        peso: pesoDeTeste(70),
      }),
      "rejected_valor_invalido",
      " (taxa NaN)",
    );
    exigirRejeitado(
      doseMcgKgMinDeTaxaInfusao({
        taxaInfusaoMlH: -1,
        concentracaoFarmacoMgMl: 0.016,
        peso: pesoDeTeste(70),
      }),
      "rejected_valor_invalido",
      " (taxa -1)",
    );
    exigirRejeitado(
      doseMcgKgMinDeTaxaInfusao({
        taxaInfusaoMlH: 10,
        concentracaoFarmacoMgMl: Number.NaN,
        peso: pesoDeTeste(70),
      }),
      "rejected_valor_invalido",
      " (concentracao NaN)",
    );
  });
});

describe("normalizarDoseVasopressora — matriz de rejeição por categoria (hemodynamics.md §4:301-307)", () => {
  it("rejeita vasopressina com unidades indexadas a peso ou taxa: mcg/kg/min, mcg/kg/h, mg/kg/min e mL/h são categoria incompatível", () => {
    // Vasopressina é U/min APENAS — nunca indexada a peso, nunca coagida
    // (hemodynamics.md §4:307).
    for (const unidade of ["mcg/kg/min", "mcg/kg/h", "mg/kg/min", "mL/h"] as const) {
      exigirRejeitado(
        normalizarDoseVasopressora({ categoria: "vasopressina", valor: 0.04, unidade }),
        "rejected_categoria_incompativel",
        ` (vasopressina + ${unidade})`,
      );
    }
  });

  it("rejeita peso_indexada com U/min e U/h — unidades em unidades só existem na via vasopressina", () => {
    for (const unidade of ["U/min", "U/h"] as const) {
      exigirRejeitado(
        normalizarDoseVasopressora({ categoria: "peso_indexada", valor: 0.03, unidade }),
        "rejected_categoria_incompativel",
        ` (peso_indexada + ${unidade})`,
      );
    }
  });

  it("rejeita NaN como valor inválido ANTES da checagem de categoria (regra 1 da ordem)", () => {
    exigirRejeitado(
      normalizarDoseVasopressora({
        categoria: "vasopressina",
        valor: Number.NaN,
        unidade: "U/min",
      }),
      "rejected_valor_invalido",
      " (vasopressina + U/min NaN)",
    );
  });

  it("exige concentracaoFarmacoMgMl para peso_indexada + mL/h — rejected_missing_inputs é o literal da spec (§4:301-302)", () => {
    // Sem a chave e com a chave ausente de fato (undefined).
    exigirRejeitado(
      normalizarDoseVasopressora({
        categoria: "peso_indexada",
        valor: 10,
        unidade: "mL/h",
        peso: pesoDeTeste(70),
      }),
      "rejected_missing_inputs",
      " (sem concentracao)",
    );
  });

  it("exige peso para peso_indexada + mL/h — peso ausente é o MESMO literal rejected_missing_inputs (§4:305)", () => {
    exigirRejeitado(
      normalizarDoseVasopressora({
        categoria: "peso_indexada",
        valor: 10,
        unidade: "mL/h",
        concentracaoFarmacoMgMl: 0.016,
      }),
      "rejected_missing_inputs",
      " (sem peso)",
    );
  });

  it("trata concentracaoFarmacoMgMl NaN como ausente — rejected_missing_inputs", () => {
    exigirRejeitado(
      normalizarDoseVasopressora({
        categoria: "peso_indexada",
        valor: 10,
        unidade: "mL/h",
        concentracaoFarmacoMgMl: Number.NaN,
        peso: pesoDeTeste(70),
      }),
      "rejected_missing_inputs",
      " (concentracao NaN)",
    );
  });

  it("converte vasopressina U/h 0.03 para 0.0005 U/min", () => {
    const dose = exigirConvertido(
      normalizarDoseVasopressora({ categoria: "vasopressina", valor: 0.03, unidade: "U/h" }),
    );
    expect(dose).toBeCloseTo(0.0005, 12);
  });

  it("aceita peso_indexada mcg/kg/min direto: 0.05 permanece 0.05", () => {
    const dose = exigirConvertido(
      normalizarDoseVasopressora({
        categoria: "peso_indexada",
        valor: 0.05,
        unidade: "mcg/kg/min",
      }),
    );
    expect(dose).toBeCloseTo(0.05, 12);
  });

  it("calcula peso_indexada mL/h com insumos completos: 10 mL/h × 0.016 mg/mL, 70 kg → 0.038095238095238095 mcg/kg/min", () => {
    const dose = exigirConvertido(
      normalizarDoseVasopressora({
        categoria: "peso_indexada",
        valor: 10,
        unidade: "mL/h",
        concentracaoFarmacoMgMl: 0.016,
        peso: pesoDeTeste(70),
      }),
    );
    // Oráculo fixo: 0.038095238095238095 (a 12 casas), escrito como o double
    // exato desse decimal em runtime (regra noPrecisionLoss do Biome).
    expect(dose).toBeCloseTo(0.03809523809523809, 12);
  });
});

describe("Peso — guardas de plausibilidade e portas de parse (SYS-09; HAZ-021/HAZ-028)", () => {
  it("fixa os limites provisórios de plausibilidade 0.5–350 kg (HAZ-021 aberta, aguardando ratificação)", () => {
    expect(PESO_KG_LIMITES_PLAUSIBILIDADE).toEqual({ minimo: 0.5, maximo: 350 });
  });

  it("aceita peso 70.5 kg via número", () => {
    expect(pesoDeNumeroKg(70.5).status).toBe("convertido");
  });

  it("rejeita 705 kg como fora da faixa — o valor do defeito V1 está morto", () => {
    exigirRejeitado(pesoDeNumeroKg(705), "rejected_fora_da_faixa", " (705 kg)");
  });

  it("rejeita 0.3 kg como fora da faixa", () => {
    exigirRejeitado(pesoDeNumeroKg(0.3), "rejected_fora_da_faixa", " (0.3 kg)");
  });

  it("aceita os limites 0.5 e 350 kg — faixa fechada", () => {
    expect(pesoDeNumeroKg(0.5).status).toBe("convertido");
    expect(pesoDeNumeroKg(350).status).toBe("convertido");
  });

  it("rejeita NaN como valor inválido", () => {
    exigirRejeitado(pesoDeNumeroKg(Number.NaN), "rejected_valor_invalido", " (NaN kg)");
  });

  it("porta numérica ascii rejeita '70,5' com rejected_separador_virgula — nunca 705, nunca qualquer número", () => {
    // A porta numérica é onde o defeito SYS-09 morre: a vírgula nunca vaza
    // para um número aqui. A mensagem aponta para o parser PT-BR explícito.
    const resultado = pesoDeTextoAscii("70,5");
    exigirRejeitado(resultado, "rejected_separador_virgula", " ('70,5')");
    expect(resultado.mensagem).toContain("parsePesoPtBr");
  });

  it("porta numérica ascii aceita '70.5' — ponto decimal é o único separador válido", () => {
    expect(pesoDeTextoAscii("70.5").status).toBe("convertido");
  });

  it("parser PT-BR lê '70,5' como 70.5 — a vírgula é decimal, nunca descartada (SYS-09)", () => {
    expect(exigirConvertido(parsePesoPtBr("70,5"))).toBe(70.5);
  });

  it("parser PT-BR lê '70.5' como 70.5 (ponto decimal)", () => {
    expect(exigirConvertido(parsePesoPtBr("70.5"))).toBe(70.5);
  });

  it("parser PT-BR rejeita '1.234,5' como formato inválido — sem agrupamento de milhares nesta fronteira", () => {
    exigirRejeitado(parsePesoPtBr("1.234,5"), "rejected_formato_invalido", " ('1.234,5')");
  });

  it("parser PT-BR rejeita '705' como fora da faixa — 705 kg é implausível em qualquer porta", () => {
    exigirRejeitado(parsePesoPtBr("705"), "rejected_fora_da_faixa", " ('705')");
  });

  it("parser PT-BR rejeita 'abc' e '' como formato inválido", () => {
    exigirRejeitado(parsePesoPtBr("abc"), "rejected_formato_invalido", " ('abc')");
    exigirRejeitado(parsePesoPtBr(""), "rejected_formato_invalido", " ('')");
  });
});
