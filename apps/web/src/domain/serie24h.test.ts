// @vitest-environment node
// Este arquivo não toca DOM em NENHUM módulo do seu grafo (verificado). Em
// jsdom ele custava a construção de um ambiente inteiro sem usá-lo — ver a
// nota "CUSTO DE AMBIENTE" em `apps/web/vitest.config.ts`.
/**
 * Testes do recorte puro da série de 24h (MAJ-4 / WF-02).
 *
 * O que está sob teste não é matemática de janela por si — é a HONESTIDADE
 * do recorte: nada é descartado em silêncio, pontos sem instante sobrevivem,
 * a ordem do backend é preservada, e a qualificação ("ponto único" ≠ série)
 * separa o que a tela pode desenhar do que ela deve confessar em texto.
 */

import { describe, expect, it } from "vitest";
import type { AvaliacaoPaciente } from "./clinico.js";
import {
  chavesDePontos,
  JANELA_TENDENCIA_MS,
  recortarSerie24h,
  situacaoDaSerie,
} from "./serie24h.js";

const AGORA = Date.parse("2026-09-19T12:00:00.000Z");

function avaliacao(calculadoEm: string | null, escore: number | null = 7): AvaliacaoPaciente {
  return {
    estadoAvaliacao: escore === null ? "nao_avaliada" : "valida",
    news2Total: escore,
    bandaRisco: escore === null ? null : "atencao",
    contribuicoes: [],
    insumosAusentes: [],
    insumosVelhos: [],
    motivos: [],
    anotacoes: [],
    explicacao: "",
    parametroVermelho: false,
    calculadoEm,
    versaoRegra: null,
  };
}

describe("recortarSerie24h — o recorte não apaga nem inventa nada", () => {
  it("separa dentro e fora da janela e CONTA os que ficaram fora", () => {
    const serie = [
      avaliacao("2026-09-19T11:00:00.000Z"), // 1h atrás — dentro
      avaliacao("2026-09-18T11:00:00.000Z"), // 25h atrás — fora
      avaliacao("2026-09-17T13:00:00.000Z"), // 47h atrás — fora
    ];
    const recorte = recortarSerie24h(serie, AGORA);
    expect(recorte.pontos).toHaveLength(1);
    expect(recorte.pontos[0]?.dentroDaJanela).toBe(true);
    expect(recorte.foraDaJanela).toBe(2);
  });

  it("a ordem do BACKEND (mais recente primeiro) é preservada, não refeita", () => {
    const serie = [
      avaliacao("2026-09-19T11:00:00.000Z", 7),
      avaliacao("2026-09-19T08:00:00.000Z", 5),
    ];
    const recorte = recortarSerie24h(serie, AGORA);
    expect(recorte.pontos[0]?.avaliacao.news2Total).toBe(7);
    expect(recorte.pontos[1]?.avaliacao.news2Total).toBe(5);
  });

  it("ponto SEM instante interpretável não é descartado — entra sem afirmação de janela", () => {
    const serie = [avaliacao(null)];
    const recorte = recortarSerie24h(serie, AGORA);
    expect(recorte.pontos).toHaveLength(1);
    expect(recorte.pontos[0]?.dentroDaJanela).toBe(false);
    expect(recorte.foraDaJanela).toBe(0);
  });

  it("instante malformado é tratado como sem instante — nunca descartado nem crasha", () => {
    const serie = [avaliacao("não-é-uma-data")];
    const recorte = recortarSerie24h(serie, AGORA);
    expect(recorte.pontos).toHaveLength(1);
    expect(recorte.pontos[0]?.dentroDaJanela).toBe(false);
  });

  it("o limite da janela é o próprio instante de corte (24h), inclusive na borda", () => {
    const naBorda = avaliacao(new Date(AGORA - JANELA_TENDENCIA_MS).toISOString());
    const umMsAntes = avaliacao(new Date(AGORA - JANELA_TENDENCIA_MS - 1).toISOString());
    const recorte = recortarSerie24h([naBorda, umMsAntes], AGORA);
    expect(recorte.pontos).toHaveLength(1);
    expect(recorte.pontos[0]?.avaliacao.calculadoEm).toBe(naBorda.calculadoEm);
    expect(recorte.foraDaJanela).toBe(1);
  });

  it("lista vazia recorta para vazio sem erro", () => {
    const recorte = recortarSerie24h([], AGORA);
    expect(recorte.pontos).toEqual([]);
    expect(recorte.foraDaJanela).toBe(0);
  });
});

describe("situacaoDaSerie — o que a tela pode afirmar", () => {
  it("`undefined` (origem não consultou) é `sem_serie`: nada é afirmado", () => {
    const recorte = recortarSerie24h([], AGORA);
    expect(situacaoDaSerie(undefined, recorte)).toBe("sem_serie");
  });

  it("`null` (consulta falhou) é `indisponivel`: a falha é declarada, nunca silenciada", () => {
    const recorte = recortarSerie24h([], AGORA);
    expect(situacaoDaSerie(null, recorte)).toBe("indisponivel");
  });

  it("vazio na janela é `vazia` — fato declarável, nunca 'linha plana'", () => {
    const recorte = recortarSerie24h([], AGORA);
    expect(situacaoDaSerie([], recorte)).toBe("vazia");
  });

  it("UM ponto na janela é `ponto_unico` — nunca vira série visual", () => {
    const recorte = recortarSerie24h([avaliacao("2026-09-19T11:00:00.000Z")], AGORA);
    expect(situacaoDaSerie([avaliacao("2026-09-19T11:00:00.000Z")], recorte)).toBe("ponto_unico");
  });

  it("dois pontos na janela são `serie` — exibível, com as lacunas que existem", () => {
    const serie = [avaliacao("2026-09-19T11:00:00.000Z"), avaliacao("2026-09-19T08:00:00.000Z")];
    const recorte = recortarSerie24h(serie, AGORA);
    expect(situacaoDaSerie(serie, recorte)).toBe("serie");
  });

  it("dois pontos FORA da janela NÃO fabricam série: são `vazia` + contagem", () => {
    // A inversão de segurança do WF-02: alargar a janela nunca fabrica
    // tranquilidade — e uma janela vazia não é "melhorada" por history antigo.
    const serie = [avaliacao("2026-09-17T11:00:00.000Z"), avaliacao("2026-09-16T11:00:00.000Z")];
    const recorte = recortarSerie24h(serie, AGORA);
    expect(situacaoDaSerie(serie, recorte)).toBe("vazia");
    expect(recorte.foraDaJanela).toBe(2);
  });
});

describe("chavesDePontos — keys por conteúdo, nunca por índice", () => {
  it("pontos distintos têm keys distintas", () => {
    const recorte = recortarSerie24h(
      [avaliacao("2026-09-19T11:00:00.000Z", 7), avaliacao("2026-09-19T08:00:00.000Z", 5)],
      AGORA,
    );
    const chaves = chavesDePontos(recorte.pontos);
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("dois pontos de CONTEÚDO idêntico (mesmo instante/escore/estado) NÃO colidem — nenhum pode sumir da tela", () => {
    const recorte = recortarSerie24h(
      [avaliacao("2026-09-19T11:00:00.000Z", 7), avaliacao("2026-09-19T11:00:00.000Z", 7)],
      AGORA,
    );
    const chaves = chavesDePontos(recorte.pontos);
    expect(new Set(chaves).size).toBe(2);
  });
});
