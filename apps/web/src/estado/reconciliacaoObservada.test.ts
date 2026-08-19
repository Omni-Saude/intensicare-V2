/**
 * apps/web/src/estado/reconciliacaoObservada.test.ts
 *
 * O QUE ESTE ARQUIVO FIXA: que "pedi uma releitura" e "uma leitura aconteceu"
 * são fatos DIFERENTES, e que só o segundo autoriza a máquina de push a declarar
 * `reconciliado` (ACH-O3-9, ADR-0011 P8, HAZ-0025, SAF-0025).
 *
 * Cada caso aqui existe porque a ausência dele tinha custo observável: sem a
 * comparação por sinal, uma releitura periódica que já estava em voo quando o
 * evento chegou "responderia" ao evento — e ela é ANTERIOR a ele, logo pode não
 * conter o que ele anunciou.
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FatoDeLeitura } from "../eventos/porta.js";
import { useReconciliacaoObservada, useRelatorioDeLeitura } from "./reconciliacaoObservada.js";

const OBTIDO_EM = "2026-08-17T12:00:30.000Z";

/** Resolve a promessa no próximo tique e devolve o que ela produziu. */
async function assentar<T>(promessa: Promise<T>): Promise<T | "pendente"> {
  const marca = Symbol("pendente");
  const corrida = await Promise.race([
    promessa,
    Promise.resolve().then(() => Promise.resolve().then(() => marca)),
  ]);
  return corrida === marca ? "pendente" : (corrida as T);
}

describe("um pedido só é respondido por um FATO de leitura", () => {
  it("o pedido avança o sinal e fica PENDENTE até alguém relatar", async () => {
    const { result } = renderHook(() => useReconciliacaoObservada());
    expect(result.current.sinal).toBe(0);

    let promessa!: Promise<FatoDeLeitura | null>;
    act(() => {
      promessa = result.current.pedirReleitura();
    });

    expect(result.current.sinal).toBe(1);
    expect(
      await assentar(promessa),
      "a promessa resolveu sem que leitura alguma tivesse sido relatada",
    ).toBe("pendente");
  });

  it("leitura que COMEÇOU ANTES do pedido não responde a ele", async () => {
    const { result } = renderHook(() => useReconciliacaoObservada());
    let promessa!: Promise<FatoDeLeitura | null>;
    act(() => {
      promessa = result.current.pedirReleitura();
    });

    // Releitura periódica que já estava em voo: consumiu o sinal 0.
    act(() => {
      result.current.relatarLeitura({ sinalNoInicio: 0, obtidoEm: OBTIDO_EM, falhou: false });
    });

    expect(
      await assentar(promessa),
      "uma leitura anterior ao evento respondeu pelo evento — ela não podia saber dele",
    ).toBe("pendente");
  });

  it("leitura bem-sucedida iniciada DEPOIS do pedido devolve o fato", async () => {
    const { result } = renderHook(() => useReconciliacaoObservada());
    let promessa!: Promise<FatoDeLeitura | null>;
    act(() => {
      promessa = result.current.pedirReleitura();
    });
    act(() => {
      result.current.relatarLeitura({ sinalNoInicio: 1, obtidoEm: OBTIDO_EM, falhou: false });
    });

    expect(await assentar(promessa)).toEqual({ obtidoEm: OBTIDO_EM });
  });

  it("leitura que FALHOU devolve `null` — a lacuna continua aberta", async () => {
    const { result } = renderHook(() => useReconciliacaoObservada());
    let promessa!: Promise<FatoDeLeitura | null>;
    act(() => {
      promessa = result.current.pedirReleitura();
    });
    act(() => {
      result.current.relatarLeitura({ sinalNoInicio: 1, obtidoEm: OBTIDO_EM, falhou: true });
    });

    expect(await assentar(promessa)).toBeNull();
  });

  it("leitura sem instante de obtenção devolve `null`", async () => {
    const { result } = renderHook(() => useReconciliacaoObservada());
    let promessa!: Promise<FatoDeLeitura | null>;
    act(() => {
      promessa = result.current.pedirReleitura();
    });
    act(() => {
      result.current.relatarLeitura({ sinalNoInicio: 1, obtidoEm: null, falhou: false });
    });

    expect(await assentar(promessa)).toBeNull();
  });

  it("um relato tardio atende TODOS os pedidos que ele já podia responder", async () => {
    const { result } = renderHook(() => useReconciliacaoObservada());
    let primeiro!: Promise<FatoDeLeitura | null>;
    let segundo!: Promise<FatoDeLeitura | null>;
    act(() => {
      primeiro = result.current.pedirReleitura();
      segundo = result.current.pedirReleitura();
    });
    act(() => {
      result.current.relatarLeitura({ sinalNoInicio: 2, obtidoEm: OBTIDO_EM, falhou: false });
    });

    expect(await assentar(primeiro)).toEqual({ obtidoEm: OBTIDO_EM });
    expect(await assentar(segundo)).toEqual({ obtidoEm: OBTIDO_EM });
  });

  it("desmontar responde `null` — nenhuma Promise fica pendurada", async () => {
    const { result, unmount } = renderHook(() => useReconciliacaoObservada());
    let promessa!: Promise<FatoDeLeitura | null>;
    act(() => {
      promessa = result.current.pedirReleitura();
    });
    act(() => {
      unmount();
    });

    expect(await assentar(promessa)).toBeNull();
  });
});

describe("a tela relata o INÍCIO e o FIM de cada leitura", () => {
  interface Entrada {
    buscaEmCurso: boolean;
    obtidoEm: string | null;
    falhou: boolean;
    sinal: number;
  }

  function bancada(inicial: Entrada) {
    const relatos: { sinalNoInicio: number; obtidoEm: string | null; falhou: boolean }[] = [];
    const { rerender } = renderHook(
      (entrada: Entrada) =>
        useRelatorioDeLeitura({
          ...entrada,
          relatar: (relato) => {
            relatos.push(relato);
          },
        }),
      { initialProps: inicial },
    );
    return { relatos, rerender };
  }

  it("nada é relatado enquanto a busca está em voo", () => {
    const { relatos, rerender } = bancada({
      buscaEmCurso: false,
      obtidoEm: null,
      falhou: false,
      sinal: 0,
    });
    rerender({ buscaEmCurso: true, obtidoEm: null, falhou: false, sinal: 1 });

    expect(relatos).toEqual([]);
  });

  it("o relato carrega o sinal do INÍCIO, não o do fim", () => {
    // É esta distinção que impede uma leitura periódica anterior de "responder"
    // a um evento que chegou enquanto ela corria.
    const { relatos, rerender } = bancada({
      buscaEmCurso: false,
      obtidoEm: null,
      falhou: false,
      sinal: 3,
    });
    rerender({ buscaEmCurso: true, obtidoEm: null, falhou: false, sinal: 3 });
    // O sinal avança DURANTE a busca — e não pode ser o relatado.
    rerender({ buscaEmCurso: true, obtidoEm: null, falhou: false, sinal: 9 });
    rerender({ buscaEmCurso: false, obtidoEm: OBTIDO_EM, falhou: false, sinal: 9 });

    expect(relatos).toEqual([{ sinalNoInicio: 3, obtidoEm: OBTIDO_EM, falhou: false }]);
  });

  it("a falha também é relatada — silêncio deixaria o pedido pendurado", () => {
    const { relatos, rerender } = bancada({
      buscaEmCurso: false,
      obtidoEm: null,
      falhou: false,
      sinal: 0,
    });
    rerender({ buscaEmCurso: true, obtidoEm: null, falhou: false, sinal: 1 });
    rerender({ buscaEmCurso: false, obtidoEm: null, falhou: true, sinal: 1 });

    expect(relatos).toEqual([{ sinalNoInicio: 1, obtidoEm: null, falhou: true }]);
  });
});
