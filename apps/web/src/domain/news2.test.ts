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

  describe("calcularBandaRisco", () => {
    it("classifica baixo quando total < 5 e nenhum parâmetro pontuou o máximo", () => {
      expect(calcularBandaRisco(0, false)).toBe("baixo");
      expect(calcularBandaRisco(4, false)).toBe("baixo");
    });

    it("classifica médio quando total está em 5-6, ou quando um único parâmetro pontuou 3", () => {
      expect(calcularBandaRisco(5, false)).toBe("medio");
      expect(calcularBandaRisco(6, false)).toBe("medio");
      expect(calcularBandaRisco(2, true)).toBe("medio");
    });

    it("classifica alto quando total está em 7-9", () => {
      expect(calcularBandaRisco(7, false)).toBe("alto");
      expect(calcularBandaRisco(9, false)).toBe("alto");
    });

    it("classifica crítico quando total >= 10", () => {
      expect(calcularBandaRisco(10, false)).toBe("critico");
      expect(calcularBandaRisco(15, false)).toBe("critico");
    });
  });
});
