/**
 * Testes da fila limitada e da montagem de quadros SSE.
 *
 * O ponto normativo (ADR-0011 P5): fila cheia NÃO descarta. Se um dia
 * alguém acrescentar um caminho de descarte "para não derrubar a conexão",
 * o teste `não existe caminho de descarte silencioso` reprova — que é
 * exatamente o modo de falha que a cláusula proíbe.
 */

import { describe, expect, it } from "vitest";
import {
  FilaLimitada,
  LIMITES_ILUSTRATIVOS,
  montarComentario,
  montarQuadro,
  montarQuadroDeRetry,
} from "./fila.js";

describe("FilaLimitada", () => {
  it("aceita até o limite e recusa o excedente SEM descartar o que já entrou", () => {
    const fila = new FilaLimitada<number>(3);
    expect(fila.enfileirar(1).aceito).toBe(true);
    expect(fila.enfileirar(2).aceito).toBe(true);
    expect(fila.enfileirar(3).aceito).toBe(true);

    const excedente = fila.enfileirar(4);
    expect(excedente.aceito).toBe(false);
    if (!excedente.aceito) expect(excedente.motivo).toBe("fila-excedida");

    // Nenhum descarte silencioso: os três primeiros continuam lá, em ordem.
    expect(fila.tamanho).toBe(3);
    expect(fila.desenfileirar()).toBe(1);
    expect(fila.desenfileirar()).toBe(2);
    expect(fila.desenfileirar()).toBe(3);
    expect(fila.desenfileirar()).toBeUndefined();
  });

  it("não existe caminho de descarte silencioso na superfície pública", () => {
    const fila = new FilaLimitada<number>(1);
    const metodos = Object.getOwnPropertyNames(Object.getPrototypeOf(fila));
    for (const proibido of ["evictar", "descartar", "sobrescrever", "podar"]) {
      expect(metodos).not.toContain(proibido);
    }
  });

  it("preserva ordem FIFO", () => {
    const fila = new FilaLimitada<string>(10);
    for (const item of ["a", "b", "c"]) fila.enfileirar(item);
    expect([fila.desenfileirar(), fila.desenfileirar(), fila.desenfileirar()]).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("recusa limite não positivo (fail-closed)", () => {
    expect(() => new FilaLimitada<number>(0)).toThrow(/fail-closed/i);
    expect(() => new FilaLimitada<number>(-1)).toThrow(/fail-closed/i);
    expect(() => new FilaLimitada<number>(1.5)).toThrow(/fail-closed/i);
  });

  it("espiar não consome", () => {
    const fila = new FilaLimitada<number>(2);
    fila.enfileirar(7);
    expect(fila.espiar()).toBe(7);
    expect(fila.tamanho).toBe(1);
  });
});

describe("limites ilustrativos", () => {
  it("são um objeto de configuração, não uma constante embutida no gateway", () => {
    // O gateway EXIGE limites por parâmetro; este objeto existe só para a
    // fatia sintética e está rotulado como não-validado no próprio módulo.
    expect(LIMITES_ILUSTRATIVOS.maximoEventosNaFila).toBeGreaterThan(0);
    expect(LIMITES_ILUSTRATIVOS.maximoBytesPendentes).toBeGreaterThan(0);
    expect(LIMITES_ILUSTRATIVOS.intervaloPulsacaoMs).toBeGreaterThan(0);
    expect(LIMITES_ILUSTRATIVOS.loteMaximoLeitura).toBeGreaterThan(0);
    expect(LIMITES_ILUSTRATIVOS.intervaloReexameDrenoMs).toBeGreaterThan(0);
  });
});

describe("montagem de quadros SSE", () => {
  it("emite id, event e data, terminando em linha em branco", () => {
    const quadro = montarQuadro({ evento: "alerta-criado", dados: { a: 1 }, id: 42 });
    expect(quadro).toBe('id: 42\nevent: alerta-criado\ndata: {"a":1}\n\n');
  });

  it("omite o id quando não há cursor a declarar (plano de controle)", () => {
    const quadro = montarQuadro({ evento: "pulsacao", dados: { b: 2 } });
    expect(quadro).toBe('event: pulsacao\ndata: {"b":2}\n\n');
  });

  it("não quebra o quadro quando o payload contém quebras de linha", () => {
    // JSON.stringify escapa `\n` — o quadro continua com exatamente uma
    // linha `data:`. Um quadro truncado seria perda silenciosa.
    const quadro = montarQuadro({ evento: "x", dados: { texto: "linha1\nlinha2" }, id: 1 });
    const linhasDeDados = quadro.split("\n").filter((linha) => linha.startsWith("data:"));
    expect(linhasDeDados).toHaveLength(1);
    expect(quadro.endsWith("\n\n")).toBe(true);
  });

  it("emite o campo retry (backoff dirigido pelo servidor, P5)", () => {
    expect(montarQuadroDeRetry(1_000)).toBe("retry: 1000\n\n");
  });

  it("emite comentário SSE", () => {
    expect(montarComentario("oi")).toBe(": oi\n\n");
  });
});
