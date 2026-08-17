import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "./index.js";

describe("apps/api (fundação executável — servidor sobre persistência real)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health responde 200 { status: 'ok' }", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  // ACHADO-03 (verificação de controles da fatia G7): a rota de exemplo
  // `POST /idempotency-example` foi removida por aceitar escrita sem
  // autenticação. Estes testes provam a remoção e que a convenção de
  // idempotência segue exercida na rota real, autenticada.
  it("POST /idempotency-example não existe mais (superfície de escrita sem authz removida)", async () => {
    const response = await app.inject({ method: "POST", url: "/idempotency-example" });
    expect(response.statusCode).toBe(404);
  });

  it("a rota de escrita real exige autenticação antes de qualquer validação de corpo", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { "idempotency-key": "SYNTH-idem-0001" },
      payload: {},
    });
    expect(response.statusCode).toBe(401);
    expect(response.headers["content-type"]).toContain("application/problem+json");
  });

  it("nenhum corpo de erro ecoa a URL da requisição (ACHADO-02: SAF-0026/SEC-0015)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/pacientes/SYNTH-PACIENTE-INEXISTENTE/avaliacoes",
    });
    const body = response.json();
    expect(JSON.stringify(body)).not.toContain("SYNTH-PACIENTE-INEXISTENTE");
    expect(body.instance).toMatch(/^urn:intensicare:requisicao:/);
  });

  // -------------------------------------------------------------------------
  // As TRÊS superfícies de saúde, compostas em `buildServer` (anti-padrão 10:
  // nunca o mesmo endpoint/status para liveness, readiness e startup).
  // -------------------------------------------------------------------------

  describe("superfícies de saúde separadas", () => {
    it("GET /v1/livez responde 200 sem tocar dependência, e declara não ser critério de promoção", async () => {
      const r = await app.inject({ method: "GET", url: "/v1/livez" });
      expect(r.statusCode).toBe(200);
      const corpo = r.json();
      expect(corpo.vivo).toBe(true);
      expect(corpo.declaracaoPt).toContain("/v1/readyz");
      // Sonda em cache é sonda mentirosa.
      expect(r.headers["cache-control"]).toBe("no-store");
    });

    it("GET /v1/startupz responde 200 'concluida' depois que buildServer resolveu", async () => {
      const r = await app.inject({ method: "GET", url: "/v1/startupz" });
      expect(r.statusCode).toBe(200);
      const corpo = r.json();
      expect(corpo.estado).toBe("concluida");
      expect(corpo.etapasPendentes).toEqual([]);
      expect(r.headers["cache-control"]).toBe("no-store");
    });

    /**
     * 503 aqui é o RETRATO HONESTO do estado, não um defeito: o RULE-GCS não
     * tem artefato de bundle no repositório (`rule-bundle` não constrói
     * manifesto para ele), então a regra R1 do avaliador bloqueia a prontidão.
     * Enquanto nenhum alvo de frescor for validado (Gate G1) e o perfil for
     * sintético, esta superfície NÃO fica verde — e é assim que ela distingue
     * "processo vivo" de "capacidade clínica segura".
     */
    it("GET /v1/readyz responde 503 com veredito e razões do vocabulário fechado", async () => {
      const r = await app.inject({ method: "GET", url: "/v1/readyz" });
      expect(r.statusCode).toBe(503);
      const corpo = r.json();
      expect(["not_ready", "degraded"]).toContain(corpo.veredito);
      expect(corpo.razoes.length).toBeGreaterThan(0);
      expect(corpo.razoes.map((razao: { codigo: string }) => razao.codigo)).toContain(
        "rule_bundle_unavailable",
      );
      expect(corpo.perfil.somenteSintetico).toBe(true);
      // Guarda de não-vacuidade, simétrica à de `razoes` acima: um laço sobre
      // lista vazia prova o invariante M0 por AUSÊNCIA de dado, não por
      // evidência. Sem esta linha, deixar de declarar qualquer limite deixa o
      // teste verde afirmando "nenhum alvo de frescor decidido".
      expect(
        corpo.limitesDeFrescorDeclarados.length,
        "nenhum limite de frescor foi declarado — o invariante M0 não foi exercido",
      ).toBeGreaterThan(0);
      // Nenhum alvo numérico de frescor foi decidido — VALIDATION REQUIRED.
      for (const limite of corpo.limitesDeFrescorDeclarados) {
        // A projeção precisa estar NOMEADA: `{}` satisfaria `limiteMs == null`
        // por ausência de campo, não por declaração honesta.
        expect(typeof limite.projecao).toBe("string");
        expect(limite.projecao.length).toBeGreaterThan(0);
        expect(limite.limiteMs).toBeNull();
      }
      expect(r.headers["cache-control"]).toBe("no-store");
    });

    it("as três superfícies não são o mesmo endpoint nem o mesmo status", async () => {
      const [liveness, prontidao, startup] = await Promise.all([
        app.inject({ method: "GET", url: "/v1/livez" }),
        app.inject({ method: "GET", url: "/v1/readyz" }),
        app.inject({ method: "GET", url: "/v1/startupz" }),
      ]);
      expect(liveness.statusCode).toBe(200);
      expect(startup.statusCode).toBe(200);
      // Vivo e iniciado, e mesmo assim SEM capacidade segura: é exatamente a
      // distinção que colapsar as três superfícies destruiria.
      expect(prontidao.statusCode).toBe(503);
    });

    it("a prontidão não vaza endereço, credencial nem identificador de sujeito", async () => {
      const r = await app.inject({ method: "GET", url: "/v1/readyz" });
      const bruto = r.body;
      expect(bruto).not.toMatch(/:\/\//);
      expect(bruto).not.toMatch(/senha|password|secret|token/i);
    });
  });
});
