/**
 * apps/web/src/api/sessaoDesenvolvimento.test.ts
 *
 * Testes da obtenção e renovação do bearer de desenvolvimento contra
 * `POST /v1/dev/sessao`.
 *
 * Cada bloco nomeia a regra (D1..D6) declarada no cabeçalho do módulo. O
 * relógio e o `fetch` são injetados — sem isso, "renova antes de expirar" só
 * poderia ser testado esperando uma hora, e um teste que ninguém roda não
 * protege nada.
 */
import { describe, expect, it, vi } from "vitest";
import { type AmbienteBuild, RecusaDePerfilError } from "../perfil.js";
import {
  CAMINHO_SESSAO_DESENVOLVIMENTO,
  criarSessaoSinteticaDeDesenvolvimento,
} from "./sessaoDesenvolvimento.js";

const DEV: AmbienteBuild = { DEV: true, PROD: false, MODE: "development" };
const PRODUCAO: AmbienteBuild = { DEV: false, PROD: true, MODE: "production" };

const T0 = Date.parse("2026-08-17T12:00:00.000Z");
const UMA_HORA_MS = 60 * 60 * 1000;

/** Relógio controlável. */
function relogio(inicial = T0) {
  let agora = inicial;
  return {
    agoraMs: () => agora,
    avancar: (ms: number) => {
      agora += ms;
    },
  };
}

/** Dublê do emissor: devolve 201 com um token novo a cada chamada. */
function emissorFalso(opcoes: { validadeMs?: number; base?: number } = {}) {
  let emissoes = 0;
  const validadeMs = opcoes.validadeMs ?? UMA_HORA_MS;
  const base = opcoes.base ?? T0;
  const fetchImpl = vi.fn(async (_entrada: RequestInfo | URL, _inicio?: RequestInit) => {
    emissoes += 1;
    return new Response(
      JSON.stringify({
        token: `SYNTH-JWS-EMISSAO-${emissoes}`,
        expiraEm: new Date(base + validadeMs).toISOString(),
      }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  });
  return { fetchImpl, emissoes: () => emissoes };
}

function respostaFixa(status: number, corpo: unknown) {
  return vi.fn(
    async (_entrada: RequestInfo | URL, _inicio?: RequestInit) =>
      new Response(corpo === null ? null : JSON.stringify(corpo), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
}

describe("guarda de perfil", () => {
  it("LANÇA fora de desenvolvimento, antes de qualquer requisição", () => {
    const emissor = emissorFalso();
    expect(() =>
      criarSessaoSinteticaDeDesenvolvimento({
        ambiente: PRODUCAO,
        fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
      }),
    ).toThrow(RecusaDePerfilError);
    // Nenhuma chamada de rede sequer foi tentada.
    expect(emissor.fetchImpl).not.toHaveBeenCalled();
  });
});

describe("obtenção do token (contrato do endpoint)", () => {
  it("faz POST em /v1/dev/sessao, SEM corpo — nada do chamador escolhe tenant ou ator", async () => {
    const emissor = emissorFalso();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
      agoraMs: relogio().agoraMs,
    });

    const cabecalho = await sessao.cabecalhoAutorizacao();

    expect(cabecalho).toBe("Bearer SYNTH-JWS-EMISSAO-1");
    const [url, init] = emissor.fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe(CAMINHO_SESSAO_DESENVOLVIMENTO);
    expect((init as RequestInit | undefined)?.method).toBe("POST");
    // A rota não aceita entrada (anti-padrão §10.3): não enviamos corpo.
    expect((init as RequestInit | undefined)?.body).toBeUndefined();
  });

  it("devolve o cabeçalho COMPLETO, nunca o token cru", async () => {
    const emissor = emissorFalso();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
    });
    expect(await sessao.cabecalhoAutorizacao()).toMatch(/^Bearer /);
  });

  it("D7 — NÃO repassa o AbortSignal do chamador ao fetch de emissão", async () => {
    // Este teste afirmava o OPOSTO e estava errado. A suíte de navegador
    // mostrou o preço: sendo a renovação compartilhada (D3), o sinal do
    // primeiro chamador derrubava a emissão para todos os outros.
    const emissor = emissorFalso();
    const controlador = new AbortController();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
    });
    await sessao.cabecalhoAutorizacao(controlador.signal);
    const init = emissor.fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.signal).toBeUndefined();
  });
});

describe("D7/D8 — regressão: cancelamento de um chamador não derruba os outros", () => {
  it("o aborto do PRIMEIRO chamador não faz o segundo herdar AbortError (React StrictMode)", async () => {
    // Reproduz a sequência do StrictMode: monta (pede credencial), desmonta
    // (aborta), remonta (pede credencial de novo). A segunda montagem não
    // cancelou nada e não pode receber a falha da primeira.
    // Holder em objeto (e não `let`) porque o TypeScript estreita a variável
    // para `never` após a atribuição dentro do executor da Promise.
    const emissaoPendente: { resolver?: (r: Response) => void } = {};
    const fetchImpl = vi.fn(
      async (_e: RequestInfo | URL, _i?: RequestInit) =>
        new Promise<Response>((resolver) => {
          emissaoPendente.resolver = resolver;
        }),
    );

    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      agoraMs: relogio().agoraMs,
    });

    const primeiro = new AbortController();
    const pedidoUm = sessao.cabecalhoAutorizacao(primeiro.signal);
    const pedidoDois = sessao.cabecalhoAutorizacao(new AbortController().signal);

    primeiro.abort(new Error("desmontagem do StrictMode"));

    emissaoPendente.resolver?.(
      new Response(
        JSON.stringify({
          token: "SYNTH-JWS-COMPARTILHADO",
          expiraEm: new Date(T0 + UMA_HORA_MS).toISOString(),
        }),
        { status: 201 },
      ),
    );

    // Nenhum dos dois REJEITA, e ambos recebem a mesma credencial.
    await expect(pedidoUm).resolves.toBe("Bearer SYNTH-JWS-COMPARTILHADO");
    await expect(pedidoDois).resolves.toBe("Bearer SYNTH-JWS-COMPARTILHADO");
    // D3: uma emissão só.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("D8 — falha de REDE na emissão vira `null`, nunca exceção para o chamador", async () => {
    const fetchImpl = vi.fn(async (_e: RequestInfo | URL, _i?: RequestInit) => {
      throw new TypeError("Failed to fetch");
    });
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    // Se isto lançasse, o hook de recurso classificaria a falha como "erro" de
    // carregamento — atribuindo à rede o que é ausência de credencial.
    await expect(sessao.cabecalhoAutorizacao()).resolves.toBeNull();
  });
});

describe("D1 — o token vive APENAS em memória", () => {
  it("nenhum armazenamento do navegador é tocado", async () => {
    const escritasLocal: string[] = [];
    const escritasSessao: string[] = [];
    const espiaLocal = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation((chave: string) => {
        escritasLocal.push(chave);
      });

    const emissor = emissorFalso();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
    });
    await sessao.cabecalhoAutorizacao();
    sessao.registrarRespostaNaoAutorizada(401);
    await sessao.cabecalhoAutorizacao();

    expect(escritasLocal).toEqual([]);
    expect(escritasSessao).toEqual([]);
    expect(globalThis.localStorage.length).toBe(0);
    expect(globalThis.sessionStorage.length).toBe(0);
    espiaLocal.mockRestore();
  });

  it("o token não aparece na URL da requisição de emissão", async () => {
    const emissor = emissorFalso();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
    });
    await sessao.cabecalhoAutorizacao();
    const url = String(emissor.fetchImpl.mock.calls[0]?.[0] ?? "");
    expect(url).not.toMatch(/token|bearer|\?/i);
  });
});

describe("D2 — renovação ANTECIPADA, antes de expirar", () => {
  it("reusa o mesmo token enquanto está longe da expiração", async () => {
    const emissor = emissorFalso();
    const tempo = relogio();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
      agoraMs: tempo.agoraMs,
    });

    expect(await sessao.cabecalhoAutorizacao()).toBe("Bearer SYNTH-JWS-EMISSAO-1");
    tempo.avancar(10 * 60 * 1000);
    expect(await sessao.cabecalhoAutorizacao()).toBe("Bearer SYNTH-JWS-EMISSAO-1");
    expect(emissor.emissoes()).toBe(1);
  });

  it("renova ANTES de `expiraEm`, dentro da margem — o usuário nunca vê o 401 de expiração", async () => {
    const tempo = relogio();
    const emissor = emissorFalso();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
      agoraMs: tempo.agoraMs,
      margemRenovacaoMs: 5 * 60 * 1000,
    });

    await sessao.cabecalhoAutorizacao();
    // 56 min: ainda não expirou (1 h), mas já está dentro da margem de 5 min.
    tempo.avancar(56 * 60 * 1000);
    expect(sessao.estadoAtual()).toBe("expirando");

    const cabecalho = await sessao.cabecalhoAutorizacao();
    expect(cabecalho).toBe("Bearer SYNTH-JWS-EMISSAO-2");
    expect(emissor.emissoes()).toBe(2);
  });

  it("`expirando` é derivado do expiraEm DA API, não de contagem inventada", async () => {
    const tempo = relogio();
    const emissor = emissorFalso({ validadeMs: 10 * 60 * 1000 });
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
      agoraMs: tempo.agoraMs,
      margemRenovacaoMs: 5 * 60 * 1000,
    });

    await sessao.cabecalhoAutorizacao();
    expect(sessao.estadoAtual()).toBe("ativa");
    tempo.avancar(6 * 60 * 1000); // faltam 4 min para o expiraEm da API
    expect(sessao.estadoAtual()).toBe("expirando");
  });
});

describe("D3 — renovações concorrentes são deduplicadas", () => {
  it("três chamadas simultâneas emitem UMA sessão", async () => {
    const emissor = emissorFalso();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
    });

    const [a, b, c] = await Promise.all([
      sessao.cabecalhoAutorizacao(),
      sessao.cabecalhoAutorizacao(),
      sessao.cabecalhoAutorizacao(),
    ]);

    expect(emissor.emissoes()).toBe(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});

describe("D4 — freio de laço: 401 logo após renovar não renova de novo", () => {
  it("401 imediatamente após a emissão EXPIRA a sessão em vez de re-emitir", async () => {
    const tempo = relogio();
    const emissor = emissorFalso();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
      agoraMs: tempo.agoraMs,
    });

    await sessao.cabecalhoAutorizacao();
    expect(emissor.emissoes()).toBe(1);

    // A API rejeita o token que ela mesma acabou de emitir.
    tempo.avancar(2000);
    sessao.registrarRespostaNaoAutorizada(401);

    expect(sessao.estadoAtual()).toBe("expirada");
    expect(await sessao.cabecalhoAutorizacao()).toBeNull();
    // Nenhuma emissão adicional: o laço foi freado.
    expect(emissor.emissoes()).toBe(1);
  });

  it("401 muito depois da emissão é expiração NORMAL — renova e segue", async () => {
    const tempo = relogio();
    const emissor = emissorFalso();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
      agoraMs: tempo.agoraMs,
    });

    await sessao.cabecalhoAutorizacao();
    tempo.avancar(UMA_HORA_MS + 60_000);
    sessao.registrarRespostaNaoAutorizada(401);

    expect(sessao.estadoAtual()).not.toBe("expirada");
    expect(await sessao.cabecalhoAutorizacao()).toBe("Bearer SYNTH-JWS-EMISSAO-2");
  });

  it("status diferente de 401 não mexe na sessão (403 é autorização, não autenticação)", async () => {
    const emissor = emissorFalso();
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: emissor.fetchImpl as unknown as typeof fetch,
    });
    await sessao.cabecalhoAutorizacao();
    sessao.registrarRespostaNaoAutorizada(403);
    expect(await sessao.cabecalhoAutorizacao()).toBe("Bearer SYNTH-JWS-EMISSAO-1");
    expect(emissor.emissoes()).toBe(1);
  });
});

describe("D5 — resposta malformada não vira credencial", () => {
  it("corpo sem token não produz cabeçalho", async () => {
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: respostaFixa(201, {
        expiraEm: new Date(T0).toISOString(),
      }) as unknown as typeof fetch,
    });
    expect(await sessao.cabecalhoAutorizacao()).toBeNull();
  });

  it("corpo com expiraEm inválido não produz cabeçalho", async () => {
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: respostaFixa(201, {
        token: "SYNTH-X",
        expiraEm: "nem-data",
      }) as unknown as typeof fetch,
    });
    expect(await sessao.cabecalhoAutorizacao()).toBeNull();
  });

  it("token vazio não produz cabeçalho", async () => {
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: respostaFixa(201, {
        token: "",
        expiraEm: new Date(T0 + UMA_HORA_MS).toISOString(),
      }) as unknown as typeof fetch,
    });
    expect(await sessao.cabecalhoAutorizacao()).toBeNull();
  });
});

describe("D6 — 404 é permanente; 5xx é transitório", () => {
  it("404 (perfil endurecido: a rota não existe) EXPIRA a sessão e para de tentar", async () => {
    const fetchFalso = respostaFixa(404, { title: "Not Found" });
    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: fetchFalso as unknown as typeof fetch,
    });

    expect(await sessao.cabecalhoAutorizacao()).toBeNull();
    expect(sessao.estadoAtual()).toBe("expirada");
    await sessao.cabecalhoAutorizacao();
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it("500 do emissor NÃO expira a sessão — uma nova tentativa do usuário repete a emissão", async () => {
    let deveFalhar = true;
    const fetchFalso = vi.fn(async (_e: RequestInfo | URL, _i?: RequestInit) => {
      if (deveFalhar) {
        return new Response(JSON.stringify({ title: "Erro interno inesperado" }), { status: 500 });
      }
      return new Response(
        JSON.stringify({
          token: "SYNTH-JWS-DEPOIS",
          expiraEm: new Date(T0 + UMA_HORA_MS).toISOString(),
        }),
        { status: 201 },
      );
    });

    const sessao = criarSessaoSinteticaDeDesenvolvimento({
      ambiente: DEV,
      fetchImpl: fetchFalso as unknown as typeof fetch,
      agoraMs: relogio().agoraMs,
    });

    expect(await sessao.cabecalhoAutorizacao()).toBeNull();
    expect(sessao.estadoAtual()).not.toBe("expirada");

    deveFalhar = false;
    expect(await sessao.cabecalhoAutorizacao()).toBe("Bearer SYNTH-JWS-DEPOIS");
  });
});
