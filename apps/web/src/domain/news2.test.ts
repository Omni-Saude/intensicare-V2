// @vitest-environment node
// Este arquivo não toca DOM em NENHUM módulo do seu grafo (verificado). Em
// jsdom ele custava a construção de um ambiente inteiro sem usá-lo — ver a
// nota "CUSTO DE AMBIENTE" em `apps/web/vitest.config.ts`.
import { describe, expect, it } from "vitest";
import {
  calcularBandaRisco,
  pontuarFrequenciaCardiaca,
  pontuarFrequenciaRespiratoria,
  pontuarNivelConsciencia,
  pontuarPressaoSistolica,
  pontuarSaturacaoOxigenio,
  pontuarTemperatura,
  pontuarUsoOxigenioSuplementar,
  somarPontos,
} from "./news2.js";

describe("news2 (tabela de pontos ilustrativa)", () => {
  it("pontua frequência respiratória nas faixas conhecidas", () => {
    expect(pontuarFrequenciaRespiratoria(8)).toBe(3);
    expect(pontuarFrequenciaRespiratoria(10)).toBe(1);
    expect(pontuarFrequenciaRespiratoria(16)).toBe(0);
    expect(pontuarFrequenciaRespiratoria(23)).toBe(2);
    expect(pontuarFrequenciaRespiratoria(30)).toBe(3);
  });

  it("pontua saturação de oxigênio nas faixas conhecidas", () => {
    expect(pontuarSaturacaoOxigenio(90)).toBe(3);
    expect(pontuarSaturacaoOxigenio(92)).toBe(2);
    expect(pontuarSaturacaoOxigenio(95)).toBe(1);
    expect(pontuarSaturacaoOxigenio(98)).toBe(0);
  });

  it("pontua uso de oxigênio suplementar", () => {
    expect(pontuarUsoOxigenioSuplementar(true)).toBe(2);
    expect(pontuarUsoOxigenioSuplementar(false)).toBe(0);
  });

  it("pontua temperatura nas faixas conhecidas", () => {
    expect(pontuarTemperatura(34.9)).toBe(3);
    expect(pontuarTemperatura(35.5)).toBe(1);
    expect(pontuarTemperatura(37.0)).toBe(0);
    expect(pontuarTemperatura(38.5)).toBe(1);
    expect(pontuarTemperatura(39.5)).toBe(2);
  });

  it("pontua pressão arterial sistólica nas faixas conhecidas", () => {
    expect(pontuarPressaoSistolica(85)).toBe(3);
    expect(pontuarPressaoSistolica(95)).toBe(2);
    expect(pontuarPressaoSistolica(105)).toBe(1);
    expect(pontuarPressaoSistolica(150)).toBe(0);
    expect(pontuarPressaoSistolica(225)).toBe(3);
  });

  it("pontua frequência cardíaca nas faixas conhecidas", () => {
    expect(pontuarFrequenciaCardiaca(35)).toBe(3);
    expect(pontuarFrequenciaCardiaca(45)).toBe(1);
    expect(pontuarFrequenciaCardiaca(70)).toBe(0);
    expect(pontuarFrequenciaCardiaca(100)).toBe(1);
    expect(pontuarFrequenciaCardiaca(120)).toBe(2);
    expect(pontuarFrequenciaCardiaca(140)).toBe(3);
  });

  it("pontua nível de consciência (alerta vs. não-alerta)", () => {
    expect(pontuarNivelConsciencia(true)).toBe(0);
    expect(pontuarNivelConsciencia(false)).toBe(3);
  });

  it("somarPontos ignora nulos (insumo ausente nunca vira zero silencioso somado incorretamente)", () => {
    expect(somarPontos([1, null, 2, null, 0])).toBe(3);
    expect(somarPontos([])).toBe(0);
  });

  /**
   * A SAÍDA É O VOCABULÁRIO DO CONTRATO. Antes destes testes serem
   * reescritos, esta função devolvia `baixo/medio/alto/critico` — escala
   * própria da web, que já não existe (`./estados.ts` faz alias do contrato).
   * A correspondência entre os cortes e as bandas está transcrita da ancoragem
   * declarada em `packages/contratos/src/index.ts:207-213` (RCP 2017 Chart 2)
   * e explicada em `./news2.ts`; nada aqui ratifica limiar clínico.
   */
  describe("calcularBandaRisco", () => {
    it("`normal` quando total < 5 e nenhum parâmetro pontuou o máximo", () => {
      expect(calcularBandaRisco(0, false)).toBe("normal");
      expect(calcularBandaRisco(4, false)).toBe("normal");
    });

    it("`atencao` no parâmetro vermelho ISOLADO — distinto de `alerta`, não fundido nele", () => {
      // O contrato nomeia este caso: `atencao ↔ low_medium` (parâmetro
      // vermelho isolado). A escala antiga o misturava com total 5-6.
      expect(calcularBandaRisco(2, true)).toBe("atencao");
      expect(calcularBandaRisco(4, true)).toBe("atencao");
      expect(calcularBandaRisco(2, true)).not.toBe(calcularBandaRisco(5, false));
    });

    it("`alerta` quando total está em 5-6 (↔ medium)", () => {
      expect(calcularBandaRisco(5, false)).toBe("alerta");
      expect(calcularBandaRisco(6, false)).toBe("alerta");
      // Total na faixa domina o vermelho isolado — não rebaixa.
      expect(calcularBandaRisco(5, true)).toBe("alerta");
    });

    it("`critico` quando total >= 7 (↔ high) — a faixa `>= 10` era um nível inventado", () => {
      expect(calcularBandaRisco(7, false)).toBe("critico");
      expect(calcularBandaRisco(9, false)).toBe("critico");
      expect(calcularBandaRisco(10, false)).toBe("critico");
      expect(calcularBandaRisco(15, false)).toBe("critico");
    });

    it("nenhum caso do dublê é REBAIXADO pela mudança de escala", () => {
      // O yardstick comum entre as duas escalas é o TOM renderizado, que é o
      // sinal de severidade que o clínico de fato vê (`./linguagem.ts`).
      // Antes: baixo→positivo(0), medio→atencao(1), alto→alerta(2),
      // critico→critico(3). Depois: normal→positivo(0), atencao→atencao(1),
      // alerta→alerta(2), critico→critico(3).
      const tomDepois = { normal: 0, atencao: 1, alerta: 2, critico: 3 } as const;
      const tomAntes = (total: number, vermelho: boolean): number => {
        if (total >= 10) return 3; // critico → tom critico
        if (total >= 7) return 2; // alto    → tom alerta
        if (total >= 5 || vermelho) return 1; // medio → tom atencao
        return 0; // baixo → tom positivo
      };
      let subiuAlgum = false;
      for (let total = 0; total <= 20; total += 1) {
        for (const vermelho of [false, true]) {
          const depois = tomDepois[calcularBandaRisco(total, vermelho)];
          const antes = tomAntes(total, vermelho);
          expect(depois, `total=${total} vermelho=${vermelho}`).toBeGreaterThanOrEqual(antes);
          if (depois > antes) subiuAlgum = true;
        }
      }
      // Não-vacuidade: a comparação precisa ter encontrado diferença — se
      // nada mudasse, este teste passaria sem ter medido correção alguma.
      expect(subiuAlgum, "a mudança de escala não alterou nenhum caso").toBe(true);
    });
  });
});
