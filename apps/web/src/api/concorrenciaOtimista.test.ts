/**
 * apps/web/src/api/concorrenciaOtimista.test.ts
 *
 * Testes do comando "reconhecer alerta" no cliente HTTP real, com `fetch`
 * injetado — a superfície que NENHUM teste desta fatia exercitava.
 *
 * O que está sob teste é a cláusula W3 da ADR-0009: o `If-Match` carrega a
 * **versão vista pelo ator humano**, não a versão corrente no servidor. A
 * distinção não é acadêmica:
 *
 *   - carregar a versão CORRENTE torna o 412 inalcançável pela UI, porque o
 *     cliente adota, no instante do envio, qualquer mudança feita por outro
 *     clínico entre a renderização e a confirmação. É a "última-escrita-vence
 *     silenciosa" que W3 proíbe e que HAZ-0023 descreve;
 *   - a `AuditEvidence` gravada pelo backend (W6) registra "versão vista". Se
 *     o cliente mente sobre ela, o rastro de auditoria fica falso na única
 *     coluna que liga o registro à decisão humana.
 *
 * Rastreio: ADR-0009 W2/W3/W6; ADR-0021 F5; HAZ-0023.
 */

import { IDEMPOTENCY_KEY_HEADER, IF_MATCH_HEADER } from "@intensicare/contratos";
import { describe, expect, it } from "vitest";
import { criarClienteHttp } from "./clienteHttp.js";
import type { ProvedorSessao } from "./sessao.js";

const CABECALHO_AUTORIZACAO = "Bearer SYNTH-TOKEN.SYNTH-TENANT-G7.SYNTH-PROFISSIONAL-WEB";

function sessaoDeTeste(): ProvedorSessao {
  return {
    estadoAtual: () => "ativa",
    cabecalhoAutorizacao: () => Promise.resolve(CABECALHO_AUTORIZACAO),
    registrarRespostaNaoAutorizada: () => undefined,
    assinar: () => () => undefined,
  };
}

interface ChamadaRegistrada {
  readonly url: string;
  readonly metodo: string;
  readonly cabecalhos: Record<string, string>;
}

/**
 * `fetch` de mentira que REGISTRA cada chamada e devolve a resposta
 * programada. Registrar é o ponto: parte do defeito só é observável na
 * SEQUÊNCIA de requisições, não no valor de retorno.
 */
function fetchGravador(resposta: () => Response): {
  readonly chamadas: ChamadaRegistrada[];
  readonly impl: typeof fetch;
} {
  const chamadas: ChamadaRegistrada[] = [];
  const impl = ((entrada: RequestInfo | URL, inicio?: RequestInit) => {
    const cabecalhos: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(
      (inicio?.headers ?? {}) as Record<string, string>,
    )) {
      cabecalhos[chave.toLowerCase()] = valor;
    }
    chamadas.push({
      url: String(entrada),
      metodo: inicio?.method ?? "GET",
      cabecalhos,
    });
    return Promise.resolve(resposta());
  }) as unknown as typeof fetch;
  return { chamadas, impl };
}

function respostaJson(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ITEM_RECONHECIDO = {
  item: {
    id: "SYNTH-ALERTA-1",
    leitoId: "SYNTH-LEITO-02",
    pacienteRef: "amh:psr:v1:SYNTH-P002",
    banda: "critico" as const,
    motivo: "Alerta consultivo NEWS2.",
    criadoEm: "2026-08-16T12:00:00.000Z",
    estado: "reconhecido" as const,
    versao: 8,
    reconhecidoPor: "SYNTH-PROFISSIONAL-WEB",
    reconhecidoEm: "2026-08-16T12:05:00.000Z",
  },
};

describe("reconhecer alerta — concorrência otimista (ADR-0009 W3)", () => {
  it("envia no If-Match a VERSÃO VISTA pelo ator, não a versão corrente do servidor", async () => {
    const { chamadas, impl } = fetchGravador(() => respostaJson(ITEM_RECONHECIDO));
    const cliente = criarClienteHttp({ sessao: sessaoDeTeste(), fetchImpl: impl });

    // O ator viu a versão 7 na tela. O servidor pode já estar em 9 — é
    // exatamente esse desencontro que o 412 existe para expor.
    await cliente.reconhecerAlerta("SYNTH-ALERTA-1", "SYNTH-CHAVE-1", { versaoVista: 7 });

    const post = chamadas.find((c) => c.metodo === "POST");
    expect(post, "nenhuma requisição POST foi emitida").toBeDefined();
    expect(post?.cabecalhos[IF_MATCH_HEADER.toLowerCase()]).toBe("7");
    expect(post?.cabecalhos[IDEMPOTENCY_KEY_HEADER.toLowerCase()]).toBe("SYNTH-CHAVE-1");
  });

  it("não relê a grade antes de enviar o comando — a releitura destruiria a versão vista", async () => {
    const { chamadas, impl } = fetchGravador(() => respostaJson(ITEM_RECONHECIDO));
    const cliente = criarClienteHttp({ sessao: sessaoDeTeste(), fetchImpl: impl });

    await cliente.reconhecerAlerta("SYNTH-ALERTA-1", "SYNTH-CHAVE-2", { versaoVista: 3 });

    expect(chamadas.map((c) => `${c.metodo} ${c.url}`)).toEqual([
      "POST /v1/alertas/SYNTH-ALERTA-1/reconhecer",
    ]);
  });

  it("412 devolve estado de conflito com versão e estado CORRENTES para redecisão humana", async () => {
    const { impl } = fetchGravador(() =>
      respostaJson(
        {
          type: "about:blank",
          title: "Conflito de versão",
          status: 412,
          detail: "O alerta mudou desde que você o viu.",
          versaoAtual: 9,
          estadoAtual: "escalado",
        },
        412,
      ),
    );
    const cliente = criarClienteHttp({ sessao: sessaoDeTeste(), fetchImpl: impl });

    const resposta = await cliente.reconhecerAlerta("SYNTH-ALERTA-1", "SYNTH-CHAVE-3", {
      versaoVista: 7,
    });

    // O conflito NÃO vira um décimo estado da família de carregamento do §11:
    // ele pertence ao item de trabalho (ADR-0009 W3), não ao carregamento da
    // tela. A resposta falha como comando e carrega o contexto à parte.
    expect(resposta.estadoCarregamento).toBe("erro");
    expect(resposta.dados).toBeNull();
    // Sem estes dois campos o clínico não tem como redecidir: saberia que
    // falhou, não POR QUE nem CONTRA O QUÊ (W3).
    expect(resposta.conflito?.versaoAtual).toBe(9);
    expect(resposta.conflito?.estadoAtual).toBe("escalado");
  });

  it("nunca fabrica uma versão: sem versão vista o comando não é emitido", async () => {
    const { chamadas, impl } = fetchGravador(() => respostaJson(ITEM_RECONHECIDO));
    const cliente = criarClienteHttp({ sessao: sessaoDeTeste(), fetchImpl: impl });

    const resposta = await cliente.reconhecerAlerta("SYNTH-ALERTA-1", "SYNTH-CHAVE-4", {
      // biome-ignore lint/suspicious/noExplicitAny: exercita o contorno de tipo em runtime
      versaoVista: undefined as any,
    });

    expect(chamadas).toHaveLength(0);
    expect(resposta.estadoCarregamento).toBe("erro");
    expect(resposta.problema?.status).toBe(428);
  });
});
