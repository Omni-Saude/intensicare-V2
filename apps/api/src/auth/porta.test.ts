/**
 * apps/api/src/auth/porta.test.ts — CONTENÇÃO por perfil.
 *
 * Teste de aceite do ADR-0015 §8 V5: "o emissor sintético não é habilitável
 * fora de dev/test — teste de inicialização por perfil (deve FALHAR ao
 * iniciar)". E do §4.1: "em qualquer outro perfil a aplicação falha ao iniciar
 * em vez de degradar".
 *
 * Rastreio adicional: anti-padrão §10.9 do prompt ("permitir PGlite em
 * memória, fixtures ou token sintético em perfil não-dev") e SEC-0017.
 */

import { describe, expect, it } from "vitest";
import { perfilDoAmbiente, perfilPermiteSintetico } from "./configuracao.js";
import { criarPortaDeAutenticacao } from "./fabrica.js";
import { criarEmissorDeTeste, criarServidorOidcDeTeste } from "./servidor-oidc-de-teste.js";

const OIDC_VALIDO = {
  emissor: "https://idp.exemplo.invalid",
  audiencia: "urn:intensicare:api:v1",
  jwksUri: "https://idp.exemplo.invalid/jwks.json",
} as const;

describe("contenção do adaptador sintético por perfil", () => {
  it("LANÇA ao construir a porta sintética em perfil `producao` e `homologacao`", () => {
    for (const perfil of ["producao", "homologacao"] as const) {
      expect(
        () => criarPortaDeAutenticacao({ perfil, adaptador: "sintetico" }),
        `perfil ${perfil} aceitou adaptador sintético`,
      ).toThrowError(/Contenção de identidade sintética/);
    }
  });

  it("LANÇA em perfil não-dev mesmo quando o adaptador escolhido é OIDC, se houver bloco `sintetico`", () => {
    expect(() =>
      criarPortaDeAutenticacao({
        perfil: "producao",
        adaptador: "oidc",
        oidc: OIDC_VALIDO,
        sintetico: {},
      }),
    ).toThrowError(/Contenção de identidade sintética/);
  });

  it("constrói a porta sintética em `dev` e `test`", () => {
    for (const perfil of ["dev", "test"] as const) {
      const porta = criarPortaDeAutenticacao({ perfil, adaptador: "sintetico" });
      expect(porta.nome).toBe("sintetico");
      expect(porta.autenticarSincrono).toBeTypeOf("function");
    }
  });

  it("o emissor e o servidor OIDC de teste também LANÇAM fora de dev/test", async () => {
    expect(() => criarEmissorDeTeste({ perfil: "producao" })).toThrowError(
      /Contenção de identidade sintética/,
    );
    await expect(criarServidorOidcDeTeste({ perfil: "producao" })).rejects.toThrowError(
      /Contenção de identidade sintética/,
    );
  });
});

describe("configuração fail-closed do adaptador OIDC", () => {
  it("LANÇA sem o bloco `oidc` — não existe modo degradado de autenticação", () => {
    expect(() => criarPortaDeAutenticacao({ perfil: "producao", adaptador: "oidc" })).toThrowError(
      /adaptador `oidc` exige o bloco `oidc`/,
    );
  });

  it("LANÇA com campo obrigatório vazio", () => {
    for (const campo of ["emissor", "audiencia", "jwksUri"] as const) {
      expect(
        () =>
          criarPortaDeAutenticacao({
            perfil: "producao",
            adaptador: "oidc",
            oidc: { ...OIDC_VALIDO, [campo]: "   " },
          }),
        `campo ${campo} vazio foi aceito`,
      ).toThrowError(new RegExp(`\`oidc.${campo}\` é obrigatório`));
    }
  });

  it("LANÇA com `jwksUri` sem TLS fora de loopback, e também em loopback sob perfil não-dev", () => {
    expect(() =>
      criarPortaDeAutenticacao({
        perfil: "producao",
        adaptador: "oidc",
        oidc: { ...OIDC_VALIDO, jwksUri: "http://idp.exemplo.invalid/jwks.json" },
      }),
    ).toThrowError(/precisa usar https/);

    expect(() =>
      criarPortaDeAutenticacao({
        perfil: "producao",
        adaptador: "oidc",
        oidc: { ...OIDC_VALIDO, jwksUri: "http://127.0.0.1:9999/jwks.json" },
      }),
    ).toThrowError(/precisa usar https/);

    expect(() =>
      criarPortaDeAutenticacao({
        perfil: "dev",
        adaptador: "oidc",
        oidc: { ...OIDC_VALIDO, jwksUri: "não-é-uri" },
      }),
    ).toThrowError(/não é uma URI absoluta/);
  });

  it("aceita `http` em loopback SOMENTE sob dev/test — é o que permite o servidor OIDC de teste", () => {
    const porta = criarPortaDeAutenticacao({
      perfil: "test",
      adaptador: "oidc",
      oidc: { ...OIDC_VALIDO, jwksUri: "http://127.0.0.1:9999/jwks.json" },
    });
    expect(porta.nome).toBe("oidc");
    // O adaptador real NÃO expõe caminho síncrono: é o que impede qualquer
    // chamador síncrono de autenticar quando o IdP está instalado.
    expect(porta.autenticarSincrono).toBeUndefined();
  });

  it("LANÇA para perfil e adaptador desconhecidos — não há default", () => {
    expect(() =>
      criarPortaDeAutenticacao({
        perfil: "producao-b" as never,
        adaptador: "oidc",
        oidc: OIDC_VALIDO,
      }),
    ).toThrowError(/não é um perfil conhecido/);
    expect(() =>
      criarPortaDeAutenticacao({ perfil: "dev", adaptador: "nenhum" as never }),
    ).toThrowError(/desconhecido/);
  });
});

describe("derivação de perfil a partir do ambiente", () => {
  it("ambiente sem perfil declarado NÃO é dev — fail-closed", () => {
    expect(perfilDoAmbiente({})).toBeUndefined();
    expect(perfilPermiteSintetico(undefined)).toBe(false);
  });

  it("`INTENSICARE_PERFIL` tem precedência sobre `NODE_ENV`", () => {
    expect(perfilDoAmbiente({ INTENSICARE_PERFIL: "producao", NODE_ENV: "test" })).toBe("producao");
    expect(perfilDoAmbiente({ NODE_ENV: "production" })).toBe("producao");
    expect(perfilDoAmbiente({ NODE_ENV: "test" })).toBe("test");
  });

  it("valor não reconhecido vira `undefined`, nunca `dev`", () => {
    for (const valor of ["", "qa", "sandbox", "DEV-ISH", "produção"]) {
      expect(perfilDoAmbiente({ INTENSICARE_PERFIL: valor }), `perfil "${valor}"`).toBeUndefined();
    }
  });
});
