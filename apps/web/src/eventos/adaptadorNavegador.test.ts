/**
 * apps/web/src/eventos/adaptadorNavegador.test.ts
 *
 * O adaptador é a única superfície deste diretório que toca o navegador — e é
 * onde uma credencial poderia vazar para URL ou log. Estes testes provam que
 * ela não vaza, e que o handshake é o do contrato (ticket por cookie, nunca no
 * corpo, nunca na query).
 *
 * Rastreio: ADR-0011 §5.3 / P3, ADR-0016 §4.1, contrato comum §10 item 12.
 */
import { EVENTOS_SSE_CONTROLE, TIPOS_EVENTO_FLUXO } from "@intensicare/contratos";
import { describe, expect, it, vi } from "vitest";
import {
  criarAbridorDeFluxoNavegador,
  criarEmissorDeTicketNavegador,
  type MensagemDoTransporte,
  type TransporteSse,
} from "./adaptadorNavegador.js";
// `?raw`: lê o fonte como texto, sem API do Node (tsconfig só tem `vite/client`).
import fonteAdaptador from "./adaptadorNavegador.ts?raw";
import { interpretarQuadro } from "./maquina.js";
import fonteMaquina from "./maquina.ts?raw";
import type { QuadroRecebido } from "./porta.js";
import fontePorta from "./porta.ts?raw";

// ---------------------------------------------------------------------------
// Dublê do transporte nativo
// ---------------------------------------------------------------------------

interface TransporteDeTeste extends TransporteSse {
  readonly ouvintes: Map<string, (evento: MensagemDoTransporte) => void>;
  fechado: boolean;
  emitir(tipo: string, evento: MensagemDoTransporte): void;
}

function criarTransporteDeTeste(): TransporteDeTeste {
  const ouvintes = new Map<string, (evento: MensagemDoTransporte) => void>();
  return {
    ouvintes,
    fechado: false,
    addEventListener(tipo, ouvinte) {
      ouvintes.set(tipo, ouvinte);
    },
    close() {
      this.fechado = true;
    },
    emitir(tipo, evento) {
      ouvintes.get(tipo)?.(evento);
    },
  };
}

function abridorComDuble(baseUrl = "") {
  const registrado: { url: string | null; withCredentials: boolean | null } = {
    url: null,
    withCredentials: null,
  };
  const transporte = criarTransporteDeTeste();
  const abrir = criarAbridorDeFluxoNavegador({
    baseUrl,
    fabrica: (url, init) => {
      registrado.url = url;
      registrado.withCredentials = init.withCredentials;
      return transporte;
    },
  });
  return { abrir, transporte, registrado };
}

function aberturaEspia() {
  const quadros: QuadroRecebido[] = [];
  let aberturas = 0;
  let falhas = 0;
  return {
    quadros,
    get aberturas() {
      return aberturas;
    },
    get falhas() {
      return falhas;
    },
    aoAbrir: () => {
      aberturas += 1;
    },
    aoQuadro: (quadro: QuadroRecebido) => {
      quadros.push(quadro);
    },
    aoFalhaDeTransporte: () => {
      falhas += 1;
    },
  };
}

// ---------------------------------------------------------------------------
// Fluxo
// ---------------------------------------------------------------------------

describe("abertura do fluxo SSE", () => {
  it("abre sem parâmetro algum quando não há cursor", () => {
    const { abrir, registrado } = abridorComDuble();
    const espia = aberturaEspia();
    abrir({ cursor: null, ...espia });

    expect(registrado.url).toBe("/v1/eventos/stream");
    expect(registrado.withCredentials).toBe(true);
  });

  it("a URL leva o cursor e NADA que se pareça com credencial, tenant ou sujeito", () => {
    const { abrir, registrado } = abridorComDuble();
    abrir({ cursor: 128, ...aberturaEspia() });

    expect(registrado.url).toBe("/v1/eventos/stream?cursor=128");
    const url = (registrado.url ?? "").toLowerCase();
    for (const proibido of [
      "token",
      "ticket",
      "bearer",
      "authorization",
      "access_token",
      "tenant",
      "ator",
      "psr",
      "cpf",
      "paciente",
      "subject",
      "senha",
      "secret",
    ]) {
      expect(url, `parâmetro proibido em query: ${proibido}`).not.toContain(proibido);
    }
  });

  it("registra escuta para TODOS os nomes de evento do contrato, mais o tipo padrão", () => {
    const { abrir, transporte } = abridorComDuble();
    abrir({ cursor: null, ...aberturaEspia() });

    for (const nome of [...TIPOS_EVENTO_FLUXO, ...EVENTOS_SSE_CONTROLE]) {
      expect(transporte.ouvintes.has(nome), `sem escuta para ${nome}`).toBe(true);
    }
    expect(transporte.ouvintes.has("message")).toBe(true);
    expect(transporte.ouvintes.has("error")).toBe(true);
    expect(transporte.ouvintes.has("open")).toBe(true);
  });

  it("encaminha o quadro com nome, corpo bruto e `id:`", () => {
    const { abrir, transporte } = abridorComDuble();
    const espia = aberturaEspia();
    abrir({ cursor: null, ...espia });

    transporte.emitir("pulsacao", { data: '{"cursor":3}', lastEventId: "" });
    transporte.emitir(TIPOS_EVENTO_FLUXO[0], { data: '{"sequencia":3}', lastEventId: "3" });

    expect(espia.quadros).toEqual([
      { nomeDoEvento: "pulsacao", dados: '{"cursor":3}', id: null },
      { nomeDoEvento: TIPOS_EVENTO_FLUXO[0], dados: '{"sequencia":3}', id: "3" },
    ]);
  });

  it("quadro do tipo PADRÃO (`message`) vira lacuna observável, nunca silêncio", () => {
    // O `EventSource` nativo não tem escuta coringa; um quadro sem `event:`
    // chega por `message` e é, por definição, um tipo que este cliente não
    // conhece. A máquina precisa vê-lo como lacuna.
    const { abrir, transporte } = abridorComDuble();
    const espia = aberturaEspia();
    abrir({ cursor: null, ...espia });

    transporte.emitir("message", { data: "{}", lastEventId: "7" });

    const quadro = espia.quadros[0];
    expect(quadro).toBeDefined();
    expect(interpretarQuadro(quadro as QuadroRecebido)).toEqual({
      especie: "lacuna",
      motivo: "tipo-de-evento-desconhecido",
    });
  });

  it("marca abertura tanto por `open` quanto pelo primeiro quadro — uma única vez", () => {
    const { abrir, transporte } = abridorComDuble();
    const espia = aberturaEspia();
    abrir({ cursor: null, ...espia });

    transporte.emitir("open", { data: "" });
    transporte.emitir("pulsacao", { data: "{}" });
    expect(espia.aberturas).toBe(1);
  });

  it("erro de transporte chega SEM nenhum detalhe do erro", () => {
    const { abrir, transporte } = abridorComDuble();
    const espia = aberturaEspia();
    abrir({ cursor: null, ...espia });

    transporte.emitir("error", { data: "irrelevante" });
    expect(espia.falhas).toBe(1);
    // `aoFalhaDeTransporte` não tem parâmetro: é impossível, por tipo, vazar
    // o erro bruto para o resto do cliente.
    expect(espia.quadros).toEqual([]);
  });

  it("fechar o fluxo fecha o transporte de verdade", () => {
    const { abrir, transporte } = abridorComDuble();
    const fluxo = abrir({ cursor: null, ...aberturaEspia() });

    expect(transporte.fechado).toBe(false);
    fluxo.fechar();
    expect(transporte.fechado).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------

const CORPO_TICKET = {
  expiraEm: "2026-08-17T12:00:30.000Z",
  ttlSegundos: 30,
  usoUnico: true,
  entregaEm: "cookie",
};

describe("transporte indisponível não derruba a tela", () => {
  it("uma fábrica que LANÇA vira falha de transporte, não exceção na árvore", async () => {
    // `EventSource` não existe no jsdom, pode ser bloqueado por política do
    // navegador e pode falhar na construção. Antes desta guarda a exceção subia
    // pela árvore React e derrubava a aplicação INTEIRA — levando junto o
    // polling, que é o caminho de verdade (ADR-0011 P8) e não depende de push
    // nenhum. Perder a tela porque a otimização não montou é a inversão que P8
    // proíbe.
    const abrir = criarAbridorDeFluxoNavegador({
      fabrica: () => {
        throw new TypeError("EventSource is not a constructor");
      },
    });

    let falhas = 0;
    let aberturas = 0;
    const fluxo = abrir({
      cursor: null,
      aoAbrir: () => {
        aberturas += 1;
      },
      aoQuadro: () => undefined,
      aoFalhaDeTransporte: () => {
        falhas += 1;
      },
    });

    // A abertura RETORNA um `FluxoAberto` utilizável (fechar não pode explodir).
    expect(() => {
      fluxo.fechar();
    }).not.toThrow();

    // E a falha é reportada — em microtarefa, para não reentrar no despacho que
    // está montando o estado corrente.
    expect(falhas, "a falha foi reportada de forma síncrona (reentrância)").toBe(0);
    await Promise.resolve();
    expect(falhas, "a falha de construção do transporte não foi reportada").toBe(1);
    expect(aberturas, "um transporte que nem construiu foi declarado aberto").toBe(0);
  });
});

describe("o handshake do ticket leva a credencial da sessão", () => {
  /**
   * DEFEITO REAL, encontrado pela suíte E2E ao fiar o push na árvore de UI: o
   * emissor confiava só em `credentials: "include"`, e a sessão desta fatia é
   * um BEARER EM MEMÓRIA (`api/sessaoDesenvolvimento.ts`), não um cookie. O
   * `POST /v1/eventos/ticket` saía ANÔNIMO, o servidor responderia 401, a
   * máquina leria `ticket-recusado` e o push pararia — explicando o motivo e
   * jamais funcionando.
   */
  it("anexa `Authorization` ao POST do ticket", async () => {
    let cabecalhos: Record<string, string> | undefined;
    const emitir = criarEmissorDeTicketNavegador({
      autorizacao: async () => "Bearer SYNTH-TESTE",
      fetchImpl: (async (_url: string, init?: RequestInit) => {
        cabecalhos = init?.headers as Record<string, string>;
        return {
          status: 200,
          ok: true,
          json: async () => ({
            expiraEm: "2026-08-17T12:00:30.000Z",
            ttlSegundos: 30,
            usoUnico: true,
            entregaEm: "cookie",
          }),
        } as unknown as Response;
      }) as unknown as typeof fetch,
    });

    const resultado = await emitir(new AbortController().signal);
    expect(resultado.ok).toBe(true);
    expect(cabecalhos?.authorization, "o ticket foi pedido sem credencial").toBe(
      "Bearer SYNTH-TESTE",
    );
  });

  it("SEM credencial, nenhuma requisição é emitida (S2: nunca anônima)", async () => {
    let chamadas = 0;
    const emitir = criarEmissorDeTicketNavegador({
      autorizacao: async () => null,
      fetchImpl: (async () => {
        chamadas += 1;
        return { status: 200, ok: true, json: async () => ({}) } as unknown as Response;
      }) as unknown as typeof fetch,
    });

    const resultado = await emitir(new AbortController().signal);
    expect(chamadas, "emitiu requisição de ticket sem sessão").toBe(0);
    expect(resultado.ok).toBe(false);
    // `indisponivel`, não `recusado`: ausência de sessão é transitória e
    // elegível a nova tentativa; recusa é decisão do servidor sobre autorização.
    expect(resultado.ok === false && resultado.motivo).toBe("indisponivel");
  });
});

describe("emissão do ticket efêmero", () => {
  it("faz POST no caminho do ticket, com cookie e sem cache, e SEM corpo", async () => {
    const fetchFalso = vi.fn(
      async () => new Response(JSON.stringify(CORPO_TICKET), { status: 201 }),
    );
    const emitir = criarEmissorDeTicketNavegador({
      fetchImpl: fetchFalso as unknown as typeof fetch,
    });

    const resultado = await emitir(new AbortController().signal);

    expect(resultado.ok).toBe(true);
    const [url, init] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/v1/eventos/ticket");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.cache).toBe("no-store");
    expect(init.body).toBeUndefined();
  });

  it("NUNCA lê valor de ticket do corpo, mesmo que o servidor o mande por engano", async () => {
    const corpoIndevido = { ...CORPO_TICKET, valor: "VALOR-QUE-NAO-PODE-SER-LIDO" };
    const fetchFalso = vi.fn(
      async () => new Response(JSON.stringify(corpoIndevido), { status: 201 }),
    );
    const emitir = criarEmissorDeTicketNavegador({
      fetchImpl: fetchFalso as unknown as typeof fetch,
    });

    const resultado = await emitir(new AbortController().signal);

    expect(JSON.stringify(resultado)).not.toContain("VALOR-QUE-NAO-PODE-SER-LIDO");
  });

  it("401 e 403 são RECUSA (o push para); 500 e rede são INDISPONIBILIDADE", async () => {
    for (const status of [401, 403]) {
      const emitir = criarEmissorDeTicketNavegador({
        fetchImpl: (async () => new Response("{}", { status })) as unknown as typeof fetch,
      });
      expect(await emitir(new AbortController().signal)).toEqual({
        ok: false,
        motivo: "recusado",
      });
    }

    const emitir500 = criarEmissorDeTicketNavegador({
      fetchImpl: (async () => new Response("{}", { status: 500 })) as unknown as typeof fetch,
    });
    expect(await emitir500(new AbortController().signal)).toEqual({
      ok: false,
      motivo: "indisponivel",
    });

    const emitirRede = criarEmissorDeTicketNavegador({
      fetchImpl: (() => {
        throw new Error("rede caiu");
      }) as unknown as typeof fetch,
    });
    expect(await emitirRede(new AbortController().signal)).toEqual({
      ok: false,
      motivo: "indisponivel",
    });
  });

  it("corpo que não declara entrega por cookie é rejeitado (fail-closed)", async () => {
    const emitir = criarEmissorDeTicketNavegador({
      fetchImpl: (async () =>
        new Response(JSON.stringify({ ...CORPO_TICKET, entregaEm: "corpo" }), {
          status: 201,
        })) as unknown as typeof fetch,
    });

    expect(await emitir(new AbortController().signal)).toEqual({
      ok: false,
      motivo: "indisponivel",
    });
  });

  it("aborto continua sendo aborto — a rejeição é propagada, não convertida", async () => {
    const controlador = new AbortController();
    controlador.abort();
    const emitir = criarEmissorDeTicketNavegador({
      fetchImpl: (() => {
        throw new DOMException("abortado", "AbortError");
      }) as unknown as typeof fetch,
    });

    /*
      A IDENTIDADE DO ERRO É A ASSERÇÃO (ACH-O3-14). Antes isto era
      `rejects.toThrow()` sem tipo, que aceita QUALQUER rejeição — inclusive a
      conversão do `AbortError` num `Error` genérico, que é exatamente a
      degradação que o nome deste teste proíbe. Medido: com a conversão, a suíte
      inteira continuava verde.

      Por que a distinção importa: quem chama distingue "a requisição foi
      cancelada por nós" de "a rede falhou". Perder o `name` faz um cancelamento
      de desmontagem virar falha de transporte, e a máquina agenda reconexão
      para um componente que já saiu.
    */
    const erro: unknown = await emitir(controlador.signal).then(
      () => null,
      (motivo: unknown) => motivo,
    );

    expect(erro, "a emissão RESOLVEU em vez de rejeitar — o aborto foi engolido").not.toBeNull();
    expect(erro).toBeInstanceOf(DOMException);
    expect((erro as DOMException).name).toBe("AbortError");
  });
});

// ---------------------------------------------------------------------------
// Guardas de fonte — credencial não vaza para log
// ---------------------------------------------------------------------------

describe("guardas de fonte do diretório de eventos", () => {
  it("os fontes foram de fato carregados (guarda contra falso verde)", () => {
    expect(fonteAdaptador.length).toBeGreaterThan(1_000);
    expect(fonteMaquina.length).toBeGreaterThan(1_000);
    expect(fontePorta.length).toBeGreaterThan(1_000);
    expect(fonteAdaptador).toMatch(/criarEmissorDeTicketNavegador/);
  });

  it("nenhum módulo do diretório registra log — nem de URL, nem de erro bruto", () => {
    for (const fonte of [fonteAdaptador, fonteMaquina, fontePorta]) {
      expect(fonte).not.toMatch(/console\s*\./);
    }
  });

  it("nenhum módulo monta URL com credencial, ticket ou tenant", () => {
    for (const fonte of [fonteAdaptador, fonteMaquina, fontePorta]) {
      expect(fonte).not.toMatch(/[?&](token|ticket|bearer|tenant|access_token)=/i);
    }
  });
});
