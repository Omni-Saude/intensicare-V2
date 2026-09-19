/**
 * Testes da primitiva PURA de supressão de alertas (dedup + cooldown +
 * teto de taxa + janela de manutenção). Determinismo total: todo instante
 * entra por parâmetro — um teste que dorme é defeito de desenho.
 */

import { describe, expect, it } from "vitest";
import {
  deveriaEmitirAlerta,
  type EstadoChaveSupressao,
  JANELA_TAXA_MS,
  type JanelaManutencao,
  type PoliticaSupressaoAlerta,
  PREMISSA_COOLDOWN_NEWS2_MS,
  PREMISSA_TAXA_MAXIMA_NEWS2_24H,
} from "../src/index.js";

const CHAVE = "SYNTH-PACIENTE-01+news2-deterioration";

const T0 = 1_700_000_000_000;

const politicaNews2: PoliticaSupressaoAlerta = {
  cooldownMs: PREMISSA_COOLDOWN_NEWS2_MS,
  taxaMaxima24h: PREMISSA_TAXA_MAXIMA_NEWS2_24H,
  conscienteJanelaManutencao: true,
};

const politicaCritica: PoliticaSupressaoAlerta = {
  cooldownMs: PREMISSA_COOLDOWN_NEWS2_MS,
  taxaMaxima24h: PREMISSA_TAXA_MAXIMA_NEWS2_24H,
  conscienteJanelaManutencao: false,
};

const semEstado: EstadoChaveSupressao = { ultimoEmitMs: null, emitesMs24h: [] };

const semJanela: JanelaManutencao | null = null;

describe("deveriaEmitirAlerta — primeira emissão da chave", () => {
  it("chave que nunca emitiu EMITE", () => {
    expect(deveriaEmitirAlerta(CHAVE, T0, semEstado, politicaNews2, semJanela)).toEqual({
      tipo: "emitir",
    });
  });

  it("as premissas do catálogo irmão valem PT4H e 3/24h", () => {
    expect(PREMISSA_COOLDOWN_NEWS2_MS).toBe(4 * 60 * 60 * 1000);
    expect(PREMISSA_TAXA_MAXIMA_NEWS2_24H).toBe(3);
    expect(JANELA_TAXA_MS).toBe(24 * 60 * 60 * 1000);
  });
});

describe("deveriaEmitirAlerta — cooldown", () => {
  it("emissão dentro do cooldown SUPRIME com motivo cooldown", () => {
    const estado: EstadoChaveSupressao = { ultimoEmitMs: T0 - 1, emitesMs24h: [T0 - 1] };
    expect(deveriaEmitirAlerta(CHAVE, T0, estado, politicaNews2, semJanela)).toEqual({
      tipo: "suprimir",
      motivo: "cooldown",
    });
  });

  it("no INSTANTE exato do fim do cooldown EMITE (fronteira meio-aberta)", () => {
    const estado: EstadoChaveSupressao = {
      ultimoEmitMs: T0 - PREMISSA_COOLDOWN_NEWS2_MS,
      emitesMs24h: [T0 - PREMISSA_COOLDOWN_NEWS2_MS],
    };
    expect(deveriaEmitirAlerta(CHAVE, T0, estado, politicaNews2, semJanela)).toEqual({
      tipo: "emitir",
    });
  });
});

describe("deveriaEmitirAlerta — teto de taxa por 24 h", () => {
  it("cooldown cumprido mas teto de 3 emissões atingido SUPRIME com motivo taxa_24h", () => {
    const emits = [
      T0 - 3 * PREMISSA_COOLDOWN_NEWS2_MS,
      T0 - 2 * PREMISSA_COOLDOWN_NEWS2_MS,
      T0 - PREMISSA_COOLDOWN_NEWS2_MS,
    ];
    const estado: EstadoChaveSupressao = {
      ultimoEmitMs: T0 - PREMISSA_COOLDOWN_NEWS2_MS,
      emitesMs24h: emits,
    };
    expect(deveriaEmitirAlerta(CHAVE, T0, estado, politicaNews2, semJanela)).toEqual({
      tipo: "suprimir",
      motivo: "taxa_24h",
    });
  });

  it("duas emissões na janela com cooldown cumprido EMITE (a terceira cabe)", () => {
    const emits = [T0 - 3 * PREMISSA_COOLDOWN_NEWS2_MS, T0 - 2 * PREMISSA_COOLDOWN_NEWS2_MS];
    const estado: EstadoChaveSupressao = {
      ultimoEmitMs: T0 - 2 * PREMISSA_COOLDOWN_NEWS2_MS,
      emitesMs24h: emits,
    };
    expect(deveriaEmitirAlerta(CHAVE, T0, estado, politicaNews2, semJanela)).toEqual({
      tipo: "emitir",
    });
  });

  it("a janela de taxa é responsabilidade do consumidor — emissões antigas apresentadas não contam", () => {
    const emitsAntigas = [
      T0 - JANELA_TAXA_MS - 1,
      T0 - JANELA_TAXA_MS - 2,
      T0 - JANELA_TAXA_MS - 3,
    ];
    const estado: EstadoChaveSupressao = { ultimoEmitMs: null, emitesMs24h: emitsAntigas };
    expect(deveriaEmitirAlerta(CHAVE, T0, estado, politicaNews2, semJanela)).toEqual({
      tipo: "emitir",
    });
  });
});

describe("deveriaEmitirAlerta — janela de manutenção", () => {
  const janela: JanelaManutencao = { inicioMs: T0 - 60_000, fimMs: T0 + 60_000 };

  it("alerta consciente de janela SUPRIME com motivo janela_de_manutencao (precedência sobre cooldown)", () => {
    const estado: EstadoChaveSupressao = { ultimoEmitMs: T0 - 1, emitesMs24h: [T0 - 1] };
    expect(deveriaEmitirAlerta(CHAVE, T0, estado, politicaNews2, janela)).toEqual({
      tipo: "suprimir",
      motivo: "janela_de_manutencao",
    });
  });

  it("alerta de segurança-crítica (não consciente) ATRAVESSA a janela", () => {
    expect(deveriaEmitirAlerta(CHAVE, T0, semEstado, politicaCritica, janela)).toEqual({
      tipo: "emitir",
    });
  });

  it("no instante exato do FIM da janela EMITE (meio-aberta: [início, fim))", () => {
    expect(deveriaEmitirAlerta(CHAVE, janela.fimMs, semEstado, politicaNews2, janela)).toEqual({
      tipo: "emitir",
    });
  });

  it("no instante exato do INÍCIO da janela SUPRIME (meio-aberta inclui o início)", () => {
    expect(deveriaEmitirAlerta(CHAVE, janela.inicioMs, semEstado, politicaNews2, janela)).toEqual({
      tipo: "suprimir",
      motivo: "janela_de_manutencao",
    });
  });
});
