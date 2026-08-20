// @vitest-environment node
// Este arquivo não toca DOM em NENHUM módulo do seu grafo (verificado). Em
// jsdom ele custava a construção de um ambiente inteiro sem usá-lo — ver a
// nota "CUSTO DE AMBIENTE" em `apps/web/vitest.config.ts`.
/**
 * apps/web/src/api/guardas.test.ts
 *
 * TESTE DE ACEITE do ACH-07: "perfil não-dev com `?mock` ou token sintético
 * ⇒ recusa observável", mais o contrato de sessão e de cancelamento do
 * cliente HTTP.
 *
 * Todos os cenários de perfil não-dev usam ambiente INJETADO. Sem isso, a
 * guarda só poderia ser exercida por um build de produção, e um teste que
 * ninguém consegue rodar é um teste que não existe.
 */
import { describe, expect, it, vi } from "vitest";
import type { EstadoCarregamento } from "../domain/estados.js";
import { type AmbienteBuild, RecusaDePerfilError } from "../perfil.js";
import { criarClienteHttp, estadoDeFalhaHttp } from "./clienteHttp.js";
// `?raw`: lê o fonte como texto, sem API do Node (tsconfig só tem `vite/client`).
import fonteClienteHttp from "./clienteHttp.ts?raw";
import { criarClienteMock } from "./clienteMock.js";
import { resolverCliente } from "./resolverCliente.js";
import { criarSessaoAusente, criarSessaoControlada, type ProvedorSessao } from "./sessao.js";
import { criarSessaoSinteticaDeDesenvolvimento } from "./sessaoDesenvolvimento.js";

const DEV: AmbienteBuild = { DEV: true, PROD: false, MODE: "development" };
const PRODUCAO: AmbienteBuild = { DEV: false, PROD: true, MODE: "production" };

const SESSAO_VALIDA = () => criarSessaoControlada("ativa", "Bearer SYNTH-TESTE");

// ---------------------------------------------------------------------------
// Recusa observável em perfil não-dev
// ---------------------------------------------------------------------------

describe("recusa observável de dublê operacional em perfil não-dev", () => {
  it("criarClienteMock LANÇA em produção", () => {
    expect(() => criarClienteMock(PRODUCAO)).toThrow(RecusaDePerfilError);
  });

  it("criarClienteMock funciona em desenvolvimento", () => {
    expect(() => criarClienteMock(DEV)).not.toThrow();
  });

  it("criarSessaoSinteticaDeDesenvolvimento LANÇA em produção", () => {
    expect(() => criarSessaoSinteticaDeDesenvolvimento({ ambiente: PRODUCAO })).toThrow(
      RecusaDePerfilError,
    );
  });

  it("resolverCliente com ?mock em produção REJEITA (não cai para o mock)", async () => {
    await expect(resolverCliente({ busca: "?mock", ambiente: PRODUCAO })).rejects.toThrow(
      RecusaDePerfilError,
    );
  });

  it("resolverCliente SEM ?mock em produção devolve cliente HTTP com sessão AUSENTE", async () => {
    const resolvido = await resolverCliente({ busca: "", ambiente: PRODUCAO });
    expect(resolvido.origem).toBe("http");
    // Sem provedor real de sessão, o default é o que RECUSA — nunca um dublê.
    expect(await resolvido.sessao.cabecalhoAutorizacao()).toBeNull();
  });

  it("resolverCliente com ?mock em desenvolvimento devolve o mock", async () => {
    const resolvido = await resolverCliente({ busca: "?mock", ambiente: DEV });
    expect(resolvido.origem).toBe("mock-desenvolvimento");
  });
});

// ---------------------------------------------------------------------------
// Sessão por injeção — sem credencial compilada
// ---------------------------------------------------------------------------

describe("sessão por injeção no cliente HTTP", () => {
  it("sem sessão utilizável, NENHUMA requisição é emitida e a tela recebe 'proibido'", async () => {
    const fetchFalso = vi.fn();
    const cliente = criarClienteHttp({
      sessao: criarSessaoAusente(),
      fetchImpl: fetchFalso as unknown as typeof fetch,
    });

    const resposta = await cliente.listarGradeLeitos();

    expect(fetchFalso).not.toHaveBeenCalled();
    expect(resposta.estadoCarregamento).toBe("proibido");
    expect(resposta.dados).toBeNull();
    expect(resposta.problema?.status).toBe(401);
  });

  it("o cabeçalho Authorization vem do provedor, não de constante do módulo", async () => {
    const fetchFalso = vi.fn(
      async (_entrada: RequestInfo | URL, _inicio?: RequestInit) =>
        new Response(JSON.stringify({ leitos: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const cliente = criarClienteHttp({
      sessao: criarSessaoControlada("ativa", "Bearer SYNTH-INJETADO-NO-TESTE"),
      fetchImpl: fetchFalso as unknown as typeof fetch,
    });

    await cliente.listarGradeLeitos();

    const init = fetchFalso.mock.calls[0]?.[1] as RequestInit | undefined;
    const cabecalhos = init?.headers as Record<string, string> | undefined;
    expect(cabecalhos?.["authorization"]).toBe("Bearer SYNTH-INJETADO-NO-TESTE");
  });

  it("401 do servidor notifica o provedor de sessão e vira 'proibido'", async () => {
    const sessao = SESSAO_VALIDA();
    const espia = vi.spyOn(sessao, "registrarRespostaNaoAutorizada");
    const fetchFalso = vi.fn(
      async (_entrada: RequestInfo | URL, _inicio?: RequestInit) =>
        new Response("{}", { status: 401 }),
    );

    const cliente = criarClienteHttp({
      sessao,
      fetchImpl: fetchFalso as unknown as typeof fetch,
    });

    const resposta = await cliente.listarGradeLeitos();
    expect(espia).toHaveBeenCalledWith(401);
    expect(resposta.estadoCarregamento).toBe("proibido");
  });

  it("o fonte do cliente HTTP foi de fato carregado (guarda contra falso verde)", () => {
    // As duas asserções do teste seguinte são `not.toMatch` e passariam
    // trivialmente sobre string vazia — que é o que o Vite devolve para
    // certas importações `?raw` conforme a configuração. Verificar o
    // tamanho primeiro é o que impede aquele teste de virar decoração.
    expect(fonteClienteHttp.length).toBeGreaterThan(1000);
    expect(fonteClienteHttp).toMatch(/criarClienteHttp/);
  });

  it("o módulo do cliente HTTP não contém mais token sintético compilado", () => {
    // Prova por leitura do fonte: a constante `TOKEN_DEV` foi removida do
    // módulo que TODO build carrega. O único lugar do repositório com o
    // identificador sintético é `sessaoDesenvolvimento.ts`, alcançado apenas
    // por `import()` dinâmico sob `import.meta.env.DEV`.
    expect(fonteClienteHttp).not.toMatch(/const TOKEN_DEV/);
    expect(fonteClienteHttp).not.toMatch(/SYNTH-TOKEN\./);
  });
});

describe("estadoDeFalhaHttp — 401/403 não são achatados em 'erro' genérico", () => {
  it("mapeia status para os identificadores do §11", () => {
    const casos: Array<[number, EstadoCarregamento]> = [
      [401, "proibido"],
      [403, "proibido"],
      [0, "indisponivel"],
      [503, "indisponivel"],
      [408, "tempo_esgotado"],
      [504, "tempo_esgotado"],
      [500, "erro"],
      [404, "erro"],
    ];
    for (const [status, esperado] of casos) {
      expect(estadoDeFalhaHttp(status)).toBe(esperado);
    }
  });
});

// ---------------------------------------------------------------------------
// Cancelamento real no cliente HTTP
// ---------------------------------------------------------------------------

describe("cancelamento real — o sinal chega ao fetch e o aborto PROPAGA", () => {
  it("o AbortSignal recebido é repassado ao fetch", async () => {
    const fetchFalso = vi.fn(
      async (_entrada: RequestInfo | URL, _inicio?: RequestInit) =>
        new Response(JSON.stringify({ leitos: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const controlador = new AbortController();
    const cliente = criarClienteHttp({
      sessao: SESSAO_VALIDA(),
      fetchImpl: fetchFalso as unknown as typeof fetch,
    });

    await cliente.listarGradeLeitos({ sinal: controlador.signal });

    const init = fetchFalso.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.signal).toBe(controlador.signal);
  });

  it("aborto NÃO é traduzido em 'API indisponível' — a rejeição propaga", async () => {
    const controlador = new AbortController();
    const fetchFalso = vi.fn(async (_e: RequestInfo | URL, _i?: RequestInit) => {
      controlador.abort(new Error("abortado no teste"));
      throw new DOMException("The operation was aborted.", "AbortError");
    });

    const cliente = criarClienteHttp({
      sessao: SESSAO_VALIDA(),
      fetchImpl: fetchFalso as unknown as typeof fetch,
    });

    // Se o cliente engolisse o aborto e devolvesse 'indisponivel', a tela
    // declararia uma falha que não houve.
    await expect(cliente.listarGradeLeitos({ sinal: controlador.signal })).rejects.toThrow(
      /aborted/i,
    );
  });

  it("falha de rede REAL (sem aborto) continua virando 'indisponivel', não exceção", async () => {
    const fetchFalso = vi.fn(async (_e: RequestInfo | URL, _i?: RequestInit) => {
      throw new TypeError("Failed to fetch");
    });
    const cliente = criarClienteHttp({
      sessao: SESSAO_VALIDA(),
      fetchImpl: fetchFalso as unknown as typeof fetch,
    });

    const resposta = await cliente.listarGradeLeitos();
    expect(resposta.estadoCarregamento).toBe("indisponivel");
    expect(resposta.problema?.status).toBe(503);
  });
});

describe("provedor de sessão — contrato da porta", () => {
  it("criarSessaoAusente recusa sempre e se declara expirada", async () => {
    const sessao: ProvedorSessao = criarSessaoAusente();
    expect(sessao.estadoAtual()).toBe("expirada");
    expect(await sessao.cabecalhoAutorizacao()).toBeNull();
  });

  it("assinantes são notificados de mudança de estado de sessão", () => {
    const sessao = criarSessaoControlada("ativa", "Bearer SYNTH-TESTE");
    const vistos: string[] = [];
    const cancelar = sessao.assinar((estado) => vistos.push(estado));
    sessao.definirEstado("expirando");
    sessao.definirEstado("expirada");
    cancelar();
    sessao.definirEstado("ativa");
    expect(vistos).toEqual(["expirando", "expirada"]);
  });
});
