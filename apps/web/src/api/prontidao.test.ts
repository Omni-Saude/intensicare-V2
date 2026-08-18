/**
 * apps/web/src/api/prontidao.test.ts
 *
 * Testes da leitura de `GET /v1/readyz` (LAC-L2, lado frontend).
 *
 * O QUE ESTES TESTES DEFENDEM. O 503 permanente desta superfície é o RETRATO
 * HONESTO do estado (safety case M0: sem bundle RULE-GCS, sem nenhum alvo de
 * frescor validado — Gate G1) e não um defeito a contornar. O risco que os
 * testes cercam é o oposto do usual: não "o 503 quebra a tela", e sim "a tela
 * some com a informação". Por isso as asserções afirmam que o CÓDIGO da razão
 * sobrevive à interpretação, inclusive um código que esta versão do frontend
 * não conhece.
 *
 * Rastreio: ADR-0011 P6, ADR-0020 O4, SAF-0025, QAS-0023, LAC-L2.
 */
import { describe, expect, it } from "vitest";
import {
  CAMINHO_PRONTIDAO,
  chavearRazoes,
  criarLeitorDeProntidaoHttp,
  interpretarProntidao,
  prontidaoObrigaDegradacao,
} from "./prontidao.js";

/**
 * Corpo real de `/v1/readyz` neste estado do repositório — a forma vem de
 * `packages/contratos/openapi.yaml` (`RelatorioProntidao`) e o conteúdo do
 * teste de aceite da API (`apps/api/src/index.test.ts`: veredito degradado,
 * `rule_bundle_unavailable` presente, `limiteMs` sempre `null`).
 */
const RELATORIO_503 = {
  veredito: "degraded",
  razoes: [
    {
      codigo: "rule_bundle_unavailable",
      detalhe: "Nenhum bundle de regra ativo para RULE-GCS.",
    },
    {
      codigo: "projection_freshness_threshold_unvalidated",
      detalhe: "Nenhum alvo de frescor de projeção foi validado.",
    },
  ],
  perfil: { somenteSintetico: true, declaracaoPt: "Perfil sintético." },
  degradacoes: [],
  limitesDeFrescorDeclarados: [{ projecao: "grade_leitos", limiteMs: null }],
};

describe("interpretarProntidao — vocabulário fechado, nada descartado", () => {
  it("503 com relatório preserva veredito e TODOS os códigos de razão", () => {
    const leitura = interpretarProntidao(503, RELATORIO_503);
    expect(leitura.origem).toBe("relatorio");
    expect(leitura.veredito).toBe("degraded");
    expect(leitura.statusHttp).toBe(503);
    expect(leitura.razoes.map((r) => r.codigo)).toEqual([
      "rule_bundle_unavailable",
      "projection_freshness_threshold_unvalidated",
    ]);
    expect(leitura.razoes.every((r) => r.reconhecido)).toBe(true);
    // O texto exibido é o do SERVIDOR, verbatim (ADR-0008 N3).
    expect(leitura.razoes[0]?.detalhe).toBe("Nenhum bundle de regra ativo para RULE-GCS.");
  });

  it("um código DESCONHECIDO é preservado e marcado, jamais descartado", () => {
    const leitura = interpretarProntidao(503, {
      veredito: "not_ready",
      razoes: [{ codigo: "razao_que_esta_versao_nao_conhece", detalhe: "Texto do servidor." }],
    });
    // Descartar seria produzir uma degradação sem representação visível —
    // exatamente o que QAS-0023 exige que seja ZERO.
    expect(leitura.razoes).toHaveLength(1);
    expect(leitura.razoes[0]?.codigo).toBe("razao_que_esta_versao_nao_conhece");
    expect(leitura.razoes[0]?.reconhecido).toBe(false);
  });

  it("`ProntidaoNaoAvaliada` é fail-closed: nunca vira 'pronto'", () => {
    const leitura = interpretarProntidao(503, {
      veredito: "not_ready",
      razoes: [],
      erroDeAvaliacao: "A própria avaliação de prontidão falhou.",
    });
    expect(leitura.origem).toBe("nao_avaliada");
    expect(prontidaoObrigaDegradacao(leitura)).toBe(true);
  });

  it("veredito fora do vocabulário fechado não é aceito como pronto", () => {
    for (const invalido of ["ok", "READY", "", 1, null, undefined]) {
      const leitura = interpretarProntidao(200, { veredito: invalido, razoes: [] });
      expect(leitura.veredito).toBeNull();
      expect(leitura.origem).toBe("ilegivel");
      expect(prontidaoObrigaDegradacao(leitura)).toBe(true);
    }
  });

  it("corpo não-objeto é ilegível, não 'pronto'", () => {
    for (const corpo of [null, "texto", 42]) {
      const leitura = interpretarProntidao(503, corpo);
      expect(leitura.origem).toBe("ilegivel");
      expect(prontidaoObrigaDegradacao(leitura)).toBe(true);
    }
  });

  it("200 com veredito `ready` é o ÚNICO caso que não obriga degradação", () => {
    const leitura = interpretarProntidao(200, { veredito: "ready", razoes: [] });
    expect(prontidaoObrigaDegradacao(leitura)).toBe(false);
  });

  it("nenhuma leitura (null) não afirma nada — a tela não inventa degradação", () => {
    expect(prontidaoObrigaDegradacao(null)).toBe(false);
  });
});

describe("chavearRazoes — códigos repetidos são fatos distintos, nunca deduplicados", () => {
  it("dá chave única a ocorrências repetidas do mesmo código", () => {
    const leitura = interpretarProntidao(503, {
      veredito: "degraded",
      razoes: [
        { codigo: "projection_freshness_threshold_unvalidated", detalhe: "grade_leitos" },
        { codigo: "projection_freshness_threshold_unvalidated", detalhe: "avaliacoes_paciente" },
        { codigo: "rule_bundle_unavailable", detalhe: "RULE-GCS" },
      ],
    });

    const chaveadas = chavearRazoes(leitura.razoes);
    // Nada some: três razões entram, três saem.
    expect(chaveadas).toHaveLength(3);
    expect(new Set(chaveadas.map((c) => c.chave)).size).toBe(3);
    expect(chaveadas.map((c) => c.razao.detalhe)).toEqual([
      "grade_leitos",
      "avaliacoes_paciente",
      "RULE-GCS",
    ]);
  });

  it("preserva a ORDEM do servidor", () => {
    const razoes = [
      { codigo: "identity_not_configured", reconhecido: true, detalhe: "a" },
      { codigo: "degradation_active", reconhecido: true, detalhe: "b" },
    ];
    expect(chavearRazoes(razoes).map((c) => c.razao.codigo)).toEqual([
      "identity_not_configured",
      "degradation_active",
    ]);
  });
});

describe("criarLeitorDeProntidaoHttp", () => {
  it("consulta o caminho do contrato e interpreta o 503", async () => {
    const urls: string[] = [];
    const leitor = criarLeitorDeProntidaoHttp({
      fetchImpl: async (entrada) => {
        urls.push(String(entrada));
        return new Response(JSON.stringify(RELATORIO_503), {
          status: 503,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const leitura = await leitor.obter();
    expect(urls).toEqual([CAMINHO_PRONTIDAO]);
    expect(leitura.veredito).toBe("degraded");
    expect(leitura.razoes.map((r) => r.codigo)).toContain("rule_bundle_unavailable");
  });

  it("NÃO envia credencial: a superfície é anônima por contrato (`security: []`)", async () => {
    let inicio: RequestInit | undefined;
    const leitor = criarLeitorDeProntidaoHttp({
      fetchImpl: async (_entrada, init) => {
        inicio = init;
        return new Response("{}", { status: 200 });
      },
    });
    await leitor.obter();

    const cabecalhos = (inicio?.headers ?? {}) as Record<string, string>;
    expect(Object.keys(cabecalhos).map((k) => k.toLowerCase())).not.toContain("authorization");
    expect(inicio?.cache).toBe("no-store");
  });

  it("falha de rede vira LEITURA 'inalcancavel' — nunca silêncio, nunca rejeição", async () => {
    const leitor = criarLeitorDeProntidaoHttp({
      fetchImpl: () => Promise.reject(new Error("rede sintética fora")),
    });
    const leitura = await leitor.obter();
    expect(leitura.origem).toBe("inalcancavel");
    expect(leitura.veredito).toBeNull();
    expect(prontidaoObrigaDegradacao(leitura)).toBe(true);
  });

  it("ABORTO propaga (o cancelamento continua real, invariante I5)", async () => {
    const controlador = new AbortController();
    const leitor = criarLeitorDeProntidaoHttp({
      fetchImpl: (_entrada, init) =>
        new Promise((_resolver, rejeitar) => {
          init?.signal?.addEventListener("abort", () => {
            rejeitar(new Error("abortado"));
          });
        }),
    });

    const promessa = leitor.obter(controlador.signal);
    controlador.abort(new Error("desmontagem sintética"));
    // Se o leitor engolisse o aborto e devolvesse `inalcancavel`, o hook não
    // conseguiria distinguir "cancelei" de "falhou" e a tela declararia uma
    // degradação que ninguém observou.
    await expect(promessa).rejects.toThrow();
  });

  it("corpo que não é JSON não derruba a leitura — vira 'ilegivel'", async () => {
    const leitor = criarLeitorDeProntidaoHttp({
      fetchImpl: async () => new Response("<html>502</html>", { status: 502 }),
    });
    const leitura = await leitor.obter();
    expect(leitura.origem).toBe("ilegivel");
    expect(leitura.statusHttp).toBe(502);
  });
});
