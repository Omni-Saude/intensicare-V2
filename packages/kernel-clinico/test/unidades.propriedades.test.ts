/**
 * Testes de propriedade (fast-check) dos normalizadores de unidades (ORQ-4):
 * - ida-e-volta do FiO2: todo percentual inteiro [21,100] vira fração válida
 *   via ÷100 e essa fração é aceita pela porta de fração;
 * - irrepresentabilidade do hazard do "50 nu": nenhum inteiro [21,100] passa
 *   pela porta de fração — a classe `rejected_valor_percentual` é obrigatória;
 * - totalidade: toda fração em [0.21, 1.0] é aceita;
 * - proporcionalidade das doses (÷60 dobra/dobra) e do lactato (×0.111,
 *   sem arredondamento no módulo — HAZ-015; units-normalization-review.md:142);
 * - equivalência das DUAS portas de peso: a forma com vírgula via
 *   `parsePesoPtBr` e a forma com ponto via `pesoDeTextoAscii` convergem para
 *   o MESMO valor (SYS-09);
 * - a vírgula nunca vaza para número pela porta numérica (SYS-09/HAZ-028);
 * - linearidade da fórmula mL/h (hemodynamics.md §4:294-296).
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  doseMcgKgMinDeMcgKgH,
  doseMcgKgMinDeTaxaInfusao,
  fio2FracaoDeNumero,
  fio2PercentualDeNumero,
  fio2PercentualParaFracao,
  lactatoMgDlDeNumero,
  lactatoMgDlParaMmolL,
  type MotivoRejeicao,
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
): void {
  if (resultado.status !== "rejeitado") {
    throw new Error(`esperado rejeitado${contexto} — obtido: ${JSON.stringify(resultado)}`);
  }
  if (resultado.motivo !== motivo) {
    throw new Error(
      `esperado motivo "${motivo}"${contexto} — obtido "${resultado.motivo}" (${resultado.mensagem})`,
    );
  }
}

// Cadeias de dígitos para compor textos com vírgula (o conteúdo ao redor da
// vírgula é irrelevante — a propriedade é sobre a vírgula em si).
const arbDigitos = fc.nat({ max: 999_999 }).map((n) => String(n));

describe("Unidades — propriedades (fast-check)", () => {
  it("ida-e-volta do FiO2: todo percentual inteiro [21,100] vira fração válida via ÷100, aceita pela porta de fração", () => {
    fc.assert(
      fc.property(fc.integer({ min: 21, max: 100 }), (n) => {
        const percentual = exigirConvertido(fio2PercentualDeNumero(n));
        expect(fio2PercentualParaFracao(percentual)).toBe(n / 100);
        expect(fio2FracaoDeNumero(n / 100).status).toBe("convertido");
      }),
    );
  });

  it("o hazard do '50 nu' é irrepresentável: todo inteiro [21,100] é rejected_valor_percentual na porta de fração", () => {
    fc.assert(
      fc.property(fc.integer({ min: 21, max: 100 }), (n) => {
        exigirRejeitado(fio2FracaoDeNumero(n), "rejected_valor_percentual", ` (fração ${n})`);
      }),
    );
  });

  it("totalidade da porta de fração: toda fração em [0.21, 1.0] é aceita", () => {
    fc.assert(
      fc.property(fc.double({ min: 0.21, max: 1.0, noNaN: true }), (v) => {
        expect(fio2FracaoDeNumero(v).status).toBe("convertido");
      }),
    );
  });

  it("dose mcg/kg/h → mcg/kg/min é ÷60 e proporcional: dobrar a entrada dobra a saída", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (v) => {
        const simples = exigirConvertido(doseMcgKgMinDeMcgKgH(v));
        expect(simples).toBeCloseTo(v / 60, 12);
        const dobrada = exigirConvertido(doseMcgKgMinDeMcgKgH(2 * v));
        expect(dobrada).toBeCloseTo(2 * simples, 12);
      }),
    );
  });

  it("lactato é linear: paraMmolL(2x) ≈ 2×paraMmolL(x) dentro de 1e-9", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 100, noNaN: true }), (x) => {
        const simples = lactatoMgDlParaMmolL(exigirConvertido(lactatoMgDlDeNumero(x)));
        const dobrada = lactatoMgDlParaMmolL(exigirConvertido(lactatoMgDlDeNumero(2 * x)));
        expect(dobrada).toBeCloseTo(2 * simples, 9);
      }),
    );
  });

  it("lactato aplica o fator exato ×0.111 em [0,200] mg/dL — sem arredondamento no módulo", () => {
    // POLÍTICA DE ARREDONDAMENTO: nenhuma política de arredondamento está
    // documentada no registry, então exatidão é o padrão seguro. A HAZ-015
    // cita "18 mg/dL → 2.0 mmol/L" como valor de EXIBIÇÃO arredondado;
    // arredondar é da camada de apresentação, nunca deste módulo.
    fc.assert(
      fc.property(fc.double({ min: 0, max: 200, noNaN: true }), (mgDl) => {
        const mmolL = lactatoMgDlParaMmolL(exigirConvertido(lactatoMgDlDeNumero(mgDl)));
        expect(mmolL).toBeCloseTo(mgDl * 0.111, 12);
      }),
    );
  });

  it("equivalência das duas portas de peso: a forma com vírgula (parsePesoPtBr) e a forma com ponto (pesoDeTextoAscii) convergem para o MESMO valor", () => {
    // Parte inteira 1..200 com um dígito decimal ⇒ valor sempre em [1.0, 200.9],
    // dentro de [0.5, 350] por construção.
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 0, max: 9 }),
        (inteiro, decimal) => {
          const viaPtBr = parsePesoPtBr(`${inteiro},${decimal}`);
          const viaAscii = pesoDeTextoAscii(`${inteiro}.${decimal}`);
          expect(viaPtBr.status).toBe("convertido");
          expect(viaAscii.status).toBe("convertido");
          expect(exigirConvertido(viaPtBr)).toBe(exigirConvertido(viaAscii));
        },
      ),
    );
  });

  it("a vírgula nunca vaza para número pela porta numérica: todo texto com ',' é rejected_separador_virgula (SYS-09)", () => {
    fc.assert(
      fc.property(arbDigitos, arbDigitos, (esquerda, direita) => {
        exigirRejeitado(
          pesoDeTextoAscii(`${esquerda},${direita}`),
          "rejected_separador_virgula",
          ` ('${esquerda},${direita}')`,
        );
      }),
    );
  });

  it("linearidade da fórmula mL/h: dobrar taxaInfusaoMlH dobra a dose (hemodynamics.md §4:294-296)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500, noNaN: true }),
        fc.double({ min: 0.001, max: 10, noNaN: true }),
        fc.double({ min: 1, max: 200, noNaN: true }),
        (taxa, concentracao, kg) => {
          // kg ∈ [1, 200] ⊂ [0.5, 350]: o peso validado nasce de pesoDeNumeroKg.
          const peso = exigirConvertido(pesoDeNumeroKg(kg));
          const base = exigirConvertido(
            doseMcgKgMinDeTaxaInfusao({
              taxaInfusaoMlH: taxa,
              concentracaoFarmacoMgMl: concentracao,
              peso,
            }),
          );
          const dobrada = exigirConvertido(
            doseMcgKgMinDeTaxaInfusao({
              taxaInfusaoMlH: 2 * taxa,
              concentracaoFarmacoMgMl: concentracao,
              peso,
            }),
          );
          expect(dobrada).toBeCloseTo(2 * base, 12);
        },
      ),
    );
  });
});
