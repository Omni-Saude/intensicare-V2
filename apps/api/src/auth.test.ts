import type { FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";
import { autenticar, gerarTokenSintetico } from "./auth.js";

function requisicaoComAuthorization(valor: string | undefined): FastifyRequest {
  return {
    headers: valor === undefined ? {} : { authorization: valor },
    url: "/v1/exemplo",
  } as unknown as FastifyRequest;
}

describe("auth (stub bearer sintético — INTEGRAÇÃO PENDENTE ADR-0015)", () => {
  it("gerarTokenSintetico produz o formato SYNTH-TOKEN.<tenantId>.<atorId>", () => {
    const token = gerarTokenSintetico("SYNTH-TENANT-A", "SYNTH-USER-01");
    expect(token).toBe("SYNTH-TOKEN.SYNTH-TENANT-A.SYNTH-USER-01");
  });

  it("aceita um token bem formado e extrai tenantId/atorId", () => {
    const resultado = autenticar(
      requisicaoComAuthorization("Bearer SYNTH-TOKEN.SYNTH-TENANT-A.SYNTH-USER-01"),
    );
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.contexto.tenantId).toBe("SYNTH-TENANT-A");
      expect(resultado.contexto.atorId).toBe("SYNTH-USER-01");
    }
  });

  it("rejeita requisição sem cabeçalho Authorization com 401 pt-BR", () => {
    const resultado = autenticar(requisicaoComAuthorization(undefined));
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.problema.status).toBe(401);
      expect(resultado.problema.title).toBe("Não autenticado");
    }
  });

  it("rejeita esquema diferente de Bearer", () => {
    const resultado = autenticar(requisicaoComAuthorization("Basic dXNlcjpwYXNz"));
    expect(resultado.ok).toBe(false);
  });

  it("rejeita token fora do formato SYNTH-TOKEN.<tenantId>.<atorId>", () => {
    const resultado = autenticar(requisicaoComAuthorization("Bearer token-qualquer"));
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.problema.status).toBe(401);
      expect(resultado.problema.title).toBe("Token sintético malformado");
    }
  });
});
