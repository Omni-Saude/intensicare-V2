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

  it("POST /idempotency-example sem Idempotency-Key responde 400 problem+json em pt-BR", async () => {
    const response = await app.inject({ method: "POST", url: "/idempotency-example" });
    expect(response.statusCode).toBe(400);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    const body = response.json();
    expect(body.title).toBe("Cabeçalho de idempotência ausente");
  });

  it("POST /idempotency-example com Idempotency-Key responde 201", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/idempotency-example",
      headers: { "idempotency-key": "SYNTH-idem-0001" },
    });
    expect(response.statusCode).toBe(201);
  });
});
