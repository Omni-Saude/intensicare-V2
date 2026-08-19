/**
 * apps/web/src/eventos/useFluxoDeEventos.test.tsx
 *
 * Testes de ACEITE do consumo de push no navegador. Cada um corresponde a um
 * critério do despacho de LAC-L1 (segunda metade) e falha antes desta entrega,
 * porque antes dela `apps/web` não tinha push algum — `../estado/conectividade.ts`
 * declarava, verbatim, "não há SSE, não há WebSocket, não há cursor de replay".
 *
 * TODO o tempo atravessa a porta `Relogio` (`../estado/relogio.ts`) através do
 * relógio determinístico de `../teste/relogioDeTeste.ts`: nenhum teste aqui
 * espera de verdade.
 *
 * Rastreio: ADR-0011 P4/P5/P6/P8, HAZ-0025, SAF-0025, LAC-L1.
 */
import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { criarRelogioDeTeste, type RelogioDeTeste } from "../teste/relogioDeTeste.js";
import type { FatoDeLeitura, ReconciliarPorPolling } from "./porta.js";
import { criarEmissorDeTeste, criarFluxoDeTeste } from "./teste/fluxoDeTeste.js";
import {
  POLITICA_DE_TESTE,
  quadroDeDados,
  quadroDeEstado,
  quadroDeInstrucao,
  quadroDePulsacao,
} from "./teste/quadros.js";
import { type FluxoDeEventosObservado, useFluxoDeEventos } from "./useFluxoDeEventos.js";

/** Fato de leitura sintético — instante fixo, nunca `Date.now()`. */
const FATO_DE_LEITURA: FatoDeLeitura = { obtidoEm: "2026-08-17T12:00:00.000Z" };

interface Bancada {
  readonly relogio: RelogioDeTeste;
  readonly fluxo: ReturnType<typeof criarFluxoDeTeste>;
  readonly emissor: ReturnType<typeof criarEmissorDeTeste>;
  readonly reconciliar: ReturnType<typeof vi.fn<ReconciliarPorPolling>>;
  readonly resultado: {
    readonly result: { readonly current: FluxoDeEventosObservado };
    readonly unmount: () => void;
  };
}

function montarBancada(
  opcoes: { reconciliar?: ReconciliarPorPolling; comPolitica?: boolean } = {},
): Bancada {
  const relogio = criarRelogioDeTeste();
  const fluxo = criarFluxoDeTeste();
  const emissor = criarEmissorDeTeste();
  /*
    A PORTA EXIGE FATO DE LEITURA (ACH-O3-9). O dublê padrão devolve um fato
    completo — é o caminho feliz. O que NÃO existe mais é a possibilidade de
    devolver `void`: a fiação real fazia isso, e `await undefined` resolvia na
    microtarefa seguinte, dando a reconciliação por concluída antes de qualquer
    leitura. Hoje isso é erro de compilação, não questão de disciplina.
  */
  const reconciliar = vi.fn<ReconciliarPorPolling>(
    opcoes.reconciliar ?? (async () => FATO_DE_LEITURA),
  );

  const resultado = renderHook(() =>
    useFluxoDeEventos({
      abrirFluxo: fluxo.abrir,
      emitirTicket: emissor.emitir,
      reconciliar,
      relogio,
      // Sorteio fixo: jitter determinístico, sem tocar em `Math.random`.
      sortear: () => 0.5,
      ...(opcoes.comPolitica === false ? {} : { politicaReconexaoInicial: POLITICA_DE_TESTE }),
    }),
  );

  return { relogio, fluxo, emissor, reconciliar, resultado };
}

/** Deixa as promessas pendentes (ticket, reconciliação) rodarem. */
async function assentar(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

/** Leva a bancada até um fluxo aberto, em catch-up concluído e pulsando. */
async function ateEmDia(bancada: Bancada, cursorInicial = 0): Promise<void> {
  await assentar();
  act(() => {
    bancada.fluxo.atual().aoAbrir();
    bancada.fluxo.atual().aoQuadro(quadroDeEstado("replaying", cursorInicial));
    bancada.fluxo.atual().aoQuadro(quadroDeEstado("online", cursorInicial));
  });
  act(() => {
    bancada.relogio.avancar(1_000);
    bancada.fluxo.atual().aoQuadro(quadroDePulsacao(cursorInicial));
  });
  await assentar();
}

// ---------------------------------------------------------------------------

describe("o fluxo permanece aberto depois do catch-up (não é replay finito)", () => {
  it("entrega evento produzido DEPOIS de a conexão estar estabelecida", async () => {
    const bancada = montarBancada();
    await ateEmDia(bancada);

    expect(bancada.resultado.result.current.estadoConexao).toBe("online");
    expect(bancada.fluxo.fechados).toBe(0);
    const releiturasAntes = bancada.reconciliar.mock.calls.length;

    // Evento gerado agora, com a conexão já aberta e em dia.
    act(() => {
      bancada.fluxo.atual().aoQuadro(quadroDeDados(1));
    });
    await assentar();

    expect(bancada.reconciliar.mock.calls.length).toBe(releiturasAntes + 1);
    expect(bancada.resultado.result.current.cursor).toBe(1);
    // A conexão SEGUE aberta — é o que distingue entrega contínua de catch-up.
    expect(bancada.fluxo.fechados).toBe(0);
    expect(bancada.fluxo.aberturas.length).toBe(1);
  });

  it("durante o catch-up, o estado exibido é `reproduzindo` — originado pelo fio", async () => {
    const bancada = montarBancada();
    await assentar();
    act(() => {
      bancada.fluxo.atual().aoAbrir();
      bancada.fluxo.atual().aoQuadro(quadroDeEstado("replaying", 0));
    });

    expect(bancada.resultado.result.current.estadoConexao).toBe("replaying");
    expect(bancada.resultado.result.current.conectividade).toBe("reproduzindo");
  });
});

describe("pulsação observável e detecção de conexão morta", () => {
  it("a pulsação mantém a tela em dia e arma o vigia de silêncio", async () => {
    const bancada = montarBancada();
    await ateEmDia(bancada);

    expect(bancada.resultado.result.current.degradado).toBe(false);
    // Há um agendamento vivo: é o vigia. Sem ele, o silêncio nunca seria visto.
    expect(bancada.relogio.pendentes).toBeGreaterThan(0);
  });

  it("ausência de pulsação dentro do intervalo aprendido DEGRADA a tela", async () => {
    const bancada = montarBancada();
    await ateEmDia(bancada);
    const disparosAntes = bancada.relogio.disparos;

    act(() => {
      // Duas cadências inteiras (1 s cada) em silêncio.
      bancada.relogio.avancar(2_000);
    });
    await assentar();

    // Guarda de não-vacuidade: a mudança veio de TEMPO, não de renderização.
    expect(bancada.relogio.disparos).toBeGreaterThan(disparosAntes);
    expect(bancada.resultado.result.current.degradado).toBe(true);
    expect(bancada.resultado.result.current.conectividade).toBe("offline");
    expect(bancada.fluxo.fechados).toBe(1);
    // Silêncio é dúvida: o polling autoritativo é acionado (ADR-0011 P8).
    expect(bancada.reconciliar).toHaveBeenCalled();
  });

  it("push que nunca se provou vivo NÃO degrada a tela do polling", async () => {
    const bancada = montarBancada();
    await assentar();

    expect(bancada.resultado.result.current.degradado).toBe(false);
  });
});

describe("retomada por cursor", () => {
  it("reconecta EXATAMENTE do cursor, sem lacuna e sem duplicata não idempotente", async () => {
    const bancada = montarBancada();
    await ateEmDia(bancada);

    act(() => {
      bancada.fluxo.atual().aoQuadro(quadroDeDados(1));
      bancada.fluxo.atual().aoQuadro(quadroDeDados(2));
      bancada.fluxo.atual().aoQuadro(quadroDeDados(3));
    });
    await assentar();
    expect(bancada.resultado.result.current.cursor).toBe(3);

    // Queda de transporte.
    act(() => {
      bancada.fluxo.atual().aoFalhaDeTransporte();
    });
    await assentar();
    expect(bancada.resultado.result.current.conectividade).toBe("offline");

    // A reconexão respeita a espera declarada pelo servidor (piso 1 s).
    expect(bancada.fluxo.aberturas.length).toBe(1);
    act(() => {
      bancada.relogio.avancar(999);
    });
    expect(bancada.fluxo.aberturas.length).toBe(1);
    act(() => {
      bancada.relogio.avancar(1);
    });
    await assentar();

    expect(bancada.fluxo.aberturas.length).toBe(2);
    expect(bancada.fluxo.cursores).toEqual([null, 3]);
    expect(bancada.emissor.chamadas).toBe(2); // ticket NOVO por conexão

    // O servidor reenvia o 3 (limite do cursor) e depois o 4.
    act(() => {
      bancada.fluxo.atual().aoAbrir();
      bancada.fluxo.atual().aoQuadro(quadroDeEstado("online", 3));
      bancada.fluxo.atual().aoQuadro(quadroDeDados(3));
    });
    await assentar();
    const releiturasAposDuplicata = bancada.reconciliar.mock.calls.length;

    act(() => {
      bancada.fluxo.atual().aoQuadro(quadroDeDados(4));
    });
    await assentar();

    expect(bancada.resultado.result.current.cursor).toBe(4);
    expect(bancada.reconciliar.mock.calls.length).toBe(releiturasAposDuplicata + 1);
    expect(bancada.resultado.result.current.lacunas).toBe(0);
  });

  it("sem política de reconexão declarada, PARA de forma explícita — não inventa espera", async () => {
    const bancada = montarBancada({ comPolitica: false });
    await assentar();
    act(() => {
      bancada.fluxo.atual().aoAbrir();
      bancada.fluxo.atual().aoFalhaDeTransporte();
    });
    await assentar();

    expect(bancada.resultado.result.current.motivoDeParada).toBe("sem-politica-de-reconexao");
    act(() => {
      bancada.relogio.avancar(60_000);
    });
    expect(bancada.fluxo.aberturas.length).toBe(1);
    // Mesmo parando o push, a dúvida foi encaminhada ao polling.
    expect(bancada.reconciliar).toHaveBeenCalled();
  });
});

describe("cliente lento e tempestade de releitura", () => {
  it("uma rajada de eventos não vira uma releitura por evento", async () => {
    // `reconciliar` que NUNCA resolve = polling lento. O cliente não pode
    // acumular pedidos sem limite por causa disso.
    const bancada = montarBancada({
      reconciliar: () => new Promise<FatoDeLeitura | null>(() => undefined),
    });
    await ateEmDia(bancada);
    const antes = bancada.reconciliar.mock.calls.length;

    act(() => {
      for (let sequencia = 1; sequencia <= 20; sequencia += 1) {
        bancada.fluxo.atual().aoQuadro(quadroDeDados(sequencia));
      }
    });
    await assentar();

    expect(bancada.reconciliar.mock.calls.length).toBe(antes + 1);
    expect(bancada.resultado.result.current.cursor).toBe(20);
  });

  it("o catch-up inteiro produz UMA releitura, ao servidor declarar `online`", async () => {
    const bancada = montarBancada();
    await assentar();
    act(() => {
      bancada.fluxo.atual().aoAbrir();
      bancada.fluxo.atual().aoQuadro(quadroDeEstado("replaying", 0));
      for (let sequencia = 1; sequencia <= 5; sequencia += 1) {
        bancada.fluxo.atual().aoQuadro(quadroDeDados(sequencia));
      }
    });
    await assentar();
    expect(bancada.reconciliar).not.toHaveBeenCalled();

    act(() => {
      bancada.fluxo.atual().aoQuadro(quadroDeEstado("online", 5));
    });
    await assentar();
    expect(bancada.reconciliar.mock.calls.length).toBe(1);
  });
});

describe("instrução de reconciliação", () => {
  /*
    ESTE BLOCO INJETA A PRÓPRIA `Promise`, E ISSO SÓ É LEGÍTIMO AGORA.

    A revisão adversarial mostrou que ele provava o DUBLÊ, não o produto: a
    fiação real devolvia `void`, e nenhum teste no nível da árvore exercitava a
    propriedade (ACH-O3-14). Duas coisas mudaram, e as duas eram necessárias:

      - a PORTA passou a exigir `FatoDeLeitura` (`./porta.ts`), de modo que uma
        fiação sem evidência é erro de COMPILAÇÃO, não descuido;
      - a asserção passou a existir no nível da ÁRVORE FIADA, com o `reconciliar`
        REAL de `../App.tsx`: `./fiacaoNaArvore.test.tsx`, bloco "`reconciliado`
        só existe a partir de um FATO de leitura".

    O que este bloco mede continua sendo do hook: que ele AGUARDA a porta e não
    despacha conclusão antes dela.
  */
  it("reconcilia ANTES de voltar a confiar na tela e só então reconecta", async () => {
    const bancada = montarBancada();
    await ateEmDia(bancada);

    let liberar: (() => void) | null = null;
    bancada.reconciliar.mockImplementation(
      () =>
        new Promise<FatoDeLeitura | null>((resolve) => {
          liberar = () => resolve(FATO_DE_LEITURA);
        }),
    );

    act(() => {
      bancada.fluxo.atual().aoQuadro(quadroDeInstrucao());
    });
    await assentar();

    // Enquanto a reconciliação não termina, a tela permanece degradada.
    expect(bancada.resultado.result.current.degradado).toBe(true);
    expect(bancada.resultado.result.current.instrucaoPendente?.motivo).toBe("fila-excedida");
    expect(bancada.fluxo.fechados).toBe(1);
    expect(bancada.resultado.result.current.estadoConexao).not.toBe("reconciled");

    await act(async () => {
      (liberar as unknown as () => void)();
      await Promise.resolve();
    });

    expect(bancada.resultado.result.current.estadoConexao).toBe("reconciled");
    expect(bancada.resultado.result.current.conectividade).toBe("reconciliado");
    expect(bancada.resultado.result.current.instrucaoPendente).toBeNull();
  });

  it("`cursor-irretomavel` declara a lacuna e retoma do mínimo do servidor", async () => {
    const bancada = montarBancada();
    await ateEmDia(bancada);

    act(() => {
      bancada.fluxo.atual().aoQuadro(
        quadroDeInstrucao({
          motivo: "cursor-irretomavel",
          cursor: 2,
          cursorMinimoRetomavel: 40,
        }),
      );
    });
    await assentar();

    expect(bancada.resultado.result.current.lacunas).toBe(1);
    expect(bancada.resultado.result.current.ultimaLacuna).toBe("cursor-irretomavel");
    expect(bancada.resultado.result.current.cursor).toBe(40);

    act(() => {
      bancada.relogio.avancar(POLITICA_DE_TESTE.esperaMinimaMs);
    });
    await assentar();
    expect(bancada.fluxo.cursores).toEqual([null, 40]);
  });
});

describe("handshake e ciclo de vida", () => {
  it("cada abertura é precedida de um ticket NOVO — nenhum ticket é reusado", async () => {
    const bancada = montarBancada();
    await ateEmDia(bancada);

    act(() => {
      bancada.fluxo.atual().aoFalhaDeTransporte();
    });
    await assentar();
    act(() => {
      bancada.relogio.avancar(POLITICA_DE_TESTE.esperaMinimaMs);
    });
    await assentar();

    expect(bancada.fluxo.aberturas.length).toBe(2);
    expect(bancada.emissor.chamadas).toBe(2);
  });

  it("ticket recusado para o push sem laço e sem deixar a tela presa", async () => {
    const bancada = montarBancada();
    bancada.emissor.responder({ ok: false, motivo: "recusado" });
    // Força nova emissão: a primeira já foi aceita na montagem.
    await assentar();
    act(() => {
      bancada.fluxo.atual().aoAbrir();
      bancada.fluxo.atual().aoFalhaDeTransporte();
    });
    await assentar();
    act(() => {
      bancada.relogio.avancar(POLITICA_DE_TESTE.esperaMinimaMs);
    });
    await assentar();

    expect(bancada.resultado.result.current.motivoDeParada).toBe("ticket-recusado");
    const chamadasAposRecusa = bancada.emissor.chamadas;
    act(() => {
      bancada.relogio.avancar(120_000);
    });
    await assentar();
    expect(bancada.emissor.chamadas).toBe(chamadasAposRecusa);
    expect(bancada.relogio.pendentes).toBe(0);
  });

  it("desmontar fecha o fluxo e não deixa temporizador vivo", async () => {
    const bancada = montarBancada();
    await ateEmDia(bancada);
    expect(bancada.relogio.pendentes).toBeGreaterThan(0);

    bancada.resultado.unmount();

    expect(bancada.fluxo.fechados).toBe(1);
    expect(bancada.relogio.pendentes).toBe(0);
  });

  it("quadro que chega DEPOIS da desmontagem não ressuscita nada", async () => {
    const bancada = montarBancada();
    await ateEmDia(bancada);
    const abertura = bancada.fluxo.atual();
    const chamadasAntes = bancada.reconciliar.mock.calls.length;

    bancada.resultado.unmount();
    act(() => {
      abertura.aoQuadro(quadroDeDados(99));
    });
    await assentar();

    expect(bancada.reconciliar.mock.calls.length).toBe(chamadasAntes);
    expect(bancada.relogio.pendentes).toBe(0);
  });

  it("sobrevive ao duplo efeito do StrictMode — o push não morre em desenvolvimento", async () => {
    // O StrictMode monta, desmonta e remonta com os MESMOS refs. Sem o
    // recomeço explícito da máquina, ela ficaria `parado` por "desmontado" e o
    // push simplesmente não existiria em desenvolvimento — uma capacidade
    // ausente que ninguém veria falhar.
    const relogio = criarRelogioDeTeste();
    const fluxo = criarFluxoDeTeste();
    const emissor = criarEmissorDeTeste();
    const resultado = renderHook(
      () =>
        useFluxoDeEventos({
          abrirFluxo: fluxo.abrir,
          emitirTicket: emissor.emitir,
          reconciliar: async () => FATO_DE_LEITURA,
          relogio,
          sortear: () => 0.5,
          politicaReconexaoInicial: POLITICA_DE_TESTE,
        }),
      { wrapper: StrictMode },
    );
    await act(async () => {
      await Promise.resolve();
    });

    // Há um fluxo VIVO depois do ciclo duplo, e ele não está parado.
    expect(fluxo.aberturas.length).toBeGreaterThan(0);
    expect(fluxo.aberturas.length).toBeGreaterThan(fluxo.fechados);
    expect(resultado.result.current.motivoDeParada).toBeNull();

    act(() => {
      fluxo.atual().aoAbrir();
      fluxo.atual().aoQuadro(quadroDeEstado("online", 0));
      fluxo.atual().aoQuadro(quadroDeDados(1));
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(resultado.result.current.cursor).toBe(1);
  });

  it("`habilitado: false` não abre fluxo nem pede ticket", async () => {
    const relogio = criarRelogioDeTeste();
    const fluxo = criarFluxoDeTeste();
    const emissor = criarEmissorDeTeste();
    renderHook(() =>
      useFluxoDeEventos({
        abrirFluxo: fluxo.abrir,
        emitirTicket: emissor.emitir,
        reconciliar: async () => FATO_DE_LEITURA,
        relogio,
        habilitado: false,
      }),
    );
    await assentar();

    expect(emissor.chamadas).toBe(0);
    expect(fluxo.aberturas.length).toBe(0);
    expect(relogio.pendentes).toBe(0);
  });
});
