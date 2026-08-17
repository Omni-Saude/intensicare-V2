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
  EscritorSseHttp,
  FilaLimitada,
  LIMITES_ILUSTRATIVOS,
  montarComentario,
  montarQuadro,
  montarQuadroDeRetry,
  type RespostaBruta,
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

  /**
   * ACHADO 8a. A versão anterior deste teste conferia NOMES —
   * `evictar/descartar/sobrescrever/podar` ausentes do protótipo. O revisor
   * adversarial acrescentou um descarte silencioso público chamado
   * `liberarEspaco()` e os 11 testes do arquivo passaram: verificar nome
   * não é verificar comportamento, e a cláusula ADR-0011 P5 é sobre
   * comportamento.
   *
   * A regra que este teste impõe agora, independente de nomenclatura:
   * NENHUMA operação pública pode reduzir o tamanho da fila sem devolver o
   * que removeu. `desenfileirar` é a única remoção sancionada, e ela
   * entrega o item — quem chama fica sabendo. Um `liberarEspaco()` seria
   * reprovado por encolher a fila devolvendo `undefined`.
   */
  it("nenhuma operação pública remove item sem devolvê-lo (ADR-0011 P5)", () => {
    const prototipo = Object.getPrototypeOf(new FilaLimitada<number>(4)) as object;
    const nomes = Object.getOwnPropertyNames(prototipo).filter((nome) => {
      if (nome === "constructor") return false;
      const descritor = Object.getOwnPropertyDescriptor(prototipo, nome);
      // Acessores (`tamanho`, `maximo`) não são operações.
      return typeof descritor?.value === "function";
    });

    // Garante que a varredura enxerga a superfície real — se algum dia o
    // protótipo ficar vazio por refatoração, o teste não vira vácuo.
    expect(nomes).toContain("enfileirar");
    expect(nomes).toContain("desenfileirar");

    for (const nome of nomes) {
      const fila = new FilaLimitada<number>(4);
      fila.enfileirar(1);
      fila.enfileirar(2);
      fila.enfileirar(3);
      const antes = fila.tamanho;

      const metodo = (prototipo as Record<string, ((...args: unknown[]) => unknown) | undefined>)[
        nome
      ];
      if (metodo === undefined) continue;
      let devolvido: unknown;
      try {
        // Invocada SEM argumentos: é assim que um descarte silencioso
        // conveniente seria chamado. `enfileirar(undefined)` apenas cresce.
        devolvido = metodo.call(fila);
      } catch {
        continue; // método que exige argumento não é caminho de descarte
      }

      const removidos = antes - fila.tamanho;
      // `<= 0` cobre também o método que CRESCE a fila (`enfileirar()` sem
      // argumento) — crescer não é descartar.
      if (removidos <= 0) continue;
      expect(
        removidos,
        `'${nome}' removeu ${String(removidos)} item(ns) de uma vez — remoção em lote é descarte, não entrega`,
      ).toBe(1);
      expect(
        devolvido,
        `'${nome}' encolheu a fila sem devolver o item removido — descarte silencioso proibido por ADR-0011 P5`,
      ).not.toBeUndefined();
    }
  });

  it("desenfileirar devolve exatamente o item que removeu — remoção nunca é muda", () => {
    const fila = new FilaLimitada<string>(3);
    fila.enfileirar("a");
    fila.enfileirar("b");
    const antes = fila.tamanho;
    const item = fila.desenfileirar();
    expect(item).toBe("a");
    expect(fila.tamanho).toBe(antes - 1);
  });

  it("conserva todo item aceito: nada some entre enfileirar e desenfileirar", () => {
    // Propriedade de conservação sobre um entrelaçamento longo — o modo de
    // falha "sumiu um delta no meio" apareceria aqui como divergência de
    // sequência, sem depender de nome de método algum.
    const fila = new FilaLimitada<number>(8);
    const aceitos: number[] = [];
    const retirados: number[] = [];
    for (let i = 0; i < 200; i += 1) {
      if (i % 3 !== 2) {
        if (fila.enfileirar(i).aceito) aceitos.push(i);
      } else {
        const item = fila.desenfileirar();
        if (item !== undefined) retirados.push(item);
      }
    }
    for (;;) {
      const item = fila.desenfileirar();
      if (item === undefined) break;
      retirados.push(item);
    }
    expect(retirados).toEqual(aceitos);
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

describe("EscritorSseHttp — vivacidade do socket", () => {
  function respostaFalsa(estado: { writableEnded: boolean; destroyed: boolean }): RespostaBruta {
    return {
      write: () => true,
      end: () => {
        estado.writableEnded = true;
      },
      get writableLength() {
        return 0;
      },
      get writableEnded() {
        return estado.writableEnded;
      },
      get destroyed() {
        return estado.destroyed;
      },
    };
  }

  it("considera encerrado o socket DESTRUÍDO, não só o encerrado por end()", () => {
    // Aborto abrupto do cliente: `writableEnded` continua `false`. Sem
    // verificar `destroyed`, o escritor se declararia vivo sobre um socket
    // morto e seguiria "escrevendo" no vazio.
    const estado = { writableEnded: false, destroyed: true };
    const escritor = new EscritorSseHttp(respostaFalsa(estado));
    expect(escritor.encerrado).toBe(true);
  });

  it("continua reconhecendo o encerramento ordenado por end()", () => {
    const estado = { writableEnded: true, destroyed: false };
    expect(new EscritorSseHttp(respostaFalsa(estado)).encerrado).toBe(true);
  });

  it("um socket vivo não se declara encerrado", () => {
    const estado = { writableEnded: false, destroyed: false };
    expect(new EscritorSseHttp(respostaFalsa(estado)).encerrado).toBe(false);
  });

  it("não escreve em socket destruído", () => {
    const estado = { writableEnded: false, destroyed: true };
    let escritas = 0;
    const resposta: RespostaBruta = {
      ...respostaFalsa(estado),
      write: () => {
        escritas += 1;
        return true;
      },
    };
    new EscritorSseHttp(resposta).escrever("event: x\ndata: {}\n\n");
    expect(escritas).toBe(0);
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
