import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
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
});
