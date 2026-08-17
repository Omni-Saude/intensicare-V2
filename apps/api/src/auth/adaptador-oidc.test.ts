/**
 * apps/api/src/auth/adaptador-oidc.test.ts — adaptador OIDC contra um servidor
 * de teste LOCAL REAL (HTTP + JWKS), não contra um dublê.
 *
 * O que este arquivo prova e o que NÃO prova
 * ------------------------------------------
 * PROVA: o adaptador busca chaves por HTTP, cacheia, observa rotação, limita
 * re-busca por `kid` desconhecido e NEGA quando a fonte de chaves falha.
 * NÃO PROVA: compatibilidade com qualquer IdP real — nenhum foi selecionado
 * (ADR-0015 §1; `threat-model.md` §2.2). O item de integração permanece
 * BLOQUEADO; ver o pedido de desbloqueio no handoff.
 *
 * Rastreio: ADR-0015 §8 V1/V3, THR-0021, HAZ-0014, SEC-0004.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAdaptadorOidc, type PortaOidc } from "./adaptador-oidc.js";
import type { ConfiguracaoAutenticacao } from "./configuracao.js";
import type { RequisicaoAutenticavel } from "./porta.js";
import { criarServidorOidcDeTeste, type ServidorOidcDeTeste } from "./servidor-oidc-de-teste.js";

function requisicaoCom(token: string | undefined): RequisicaoAutenticavel {
  return {
    id: "SYNTH-REQ-0001",
    headers: token === undefined ? {} : { authorization: `Bearer ${token}` },
  };
}

let servidor: ServidorOidcDeTeste;

function configuracao(
  extras: Partial<ConfiguracaoAutenticacao["oidc"]> = {},
  raiz: Partial<ConfiguracaoAutenticacao> = {},
): ConfiguracaoAutenticacao {
  return {
    perfil: "test",
    adaptador: "oidc",
    oidc: {
      emissor: servidor.emissorDeTeste.emissor,
      audiencia: servidor.emissorDeTeste.audiencia,
      jwksUri: servidor.jwksUri,
      intervaloMinimoDeRefreshSegundos: 0,
      ...extras,
    },
    ...raiz,
  };
}

beforeEach(async () => {
  servidor = await criarServidorOidcDeTeste();
});

afterEach(async () => {
  await servidor.fechar();
});

describe("adaptador OIDC — caminho legítimo", () => {
  it("autentica um token assinado buscando a chave por HTTP e deriva tenant da claim", async () => {
    const porta: PortaOidc = criarAdaptadorOidc(configuracao());
    const r = await porta.autenticar(
      requisicaoCom(
        servidor.emissorDeTeste.emitir({
          tenant: "SYNTH-TENANT-G7",
          sub: "SYNTH-PROFISSIONAL-77",
        }),
      ),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.contexto.tenantId).toBe("SYNTH-TENANT-G7");
      expect(r.contexto.atorId).toBe("SYNTH-PROFISSIONAL-77");
      expect(r.contexto.papeis).toContain("atuante-clinico");
    }
    expect(servidor.buscasAoJwks()).toBe(1);
  });

  it("usa o cache: várias requisições com o mesmo `kid` não repetem a busca ao JWKS", async () => {
    const porta = criarAdaptadorOidc(configuracao({ ttlCacheJwksSegundos: 300 }));
    for (let i = 0; i < 5; i += 1) {
      const r = await porta.autenticar(requisicaoCom(servidor.emissorDeTeste.emitir()));
      expect(r.ok).toBe(true);
    }
    expect(servidor.buscasAoJwks()).toBe(1);
  });

  it("observa a ROTAÇÃO de chave: com o cache revalidado, o token da chave retirada é recusado e o da nova é aceito", async () => {
    // TTL zero = revalida a cada requisição. É a configuração que torna a
    // retirada de chave efetiva imediatamente.
    const porta = criarAdaptadorOidc(configuracao({ ttlCacheJwksSegundos: 0 }));
    const tokenAntigo = servidor.emissorDeTeste.emitir();
    expect((await porta.autenticar(requisicaoCom(tokenAntigo))).ok).toBe(true);

    servidor.emissorDeTeste.rotacionar();

    const rAntigo = await porta.autenticar(requisicaoCom(tokenAntigo));
    expect(rAntigo.ok, "token de chave retirada continuou aceito").toBe(false);
    if (!rAntigo.ok) expect(rAntigo.codigo).toBe("kid-desconhecido");

    const rNovo = await porta.autenticar(requisicaoCom(servidor.emissorDeTeste.emitir()));
    expect(rNovo.ok, "token da chave nova foi recusado após rotação").toBe(true);
  });

  /**
   * LIMITAÇÃO MEDIDA — não é otimismo nem descuido, e não deve ser "corrigida"
   * afrouxando a asserção.
   *
   * Enquanto o cache de JWKS estiver válido, uma chave RETIRADA pelo emissor
   * continua sendo aceita, porque o verificador não tem como saber da retirada
   * sem revalidar. A janela é exatamente `ttlCacheJwksSegundos`. Isto é o
   * comportamento de qualquer cliente JWKS com cache, e é por isso que
   * emissores publicam a chave antiga durante um período de graça.
   *
   * Consequência operacional que precisa de decisão humana (ver handoff):
   * revogar uma chave COMPROMETIDA não é instantâneo por este caminho. Um
   * mecanismo de revogação (ADR-0015 §4 "revogação quando aplicável") não está
   * decidido e permanece pendente — este teste existe para que a janela fique
   * registrada em código, não para declará-la aceitável.
   */
  it("LIMITAÇÃO: dentro do TTL do cache, a chave retirada permanece aceita — a janela é o TTL configurado", async () => {
    const porta = criarAdaptadorOidc(configuracao({ ttlCacheJwksSegundos: 300 }));
    const tokenAntigo = servidor.emissorDeTeste.emitir();
    expect((await porta.autenticar(requisicaoCom(tokenAntigo))).ok).toBe(true);

    servidor.emissorDeTeste.rotacionar();

    const rAntigo = await porta.autenticar(requisicaoCom(tokenAntigo));
    expect(
      rAntigo.ok,
      "janela de cache mudou de comportamento: revisar a limitação registrada acima",
    ).toBe(true);
    expect(servidor.buscasAoJwks(), "houve rebusca dentro do TTL").toBe(1);
  });
});

describe("adaptador OIDC — fonte de chaves hostil ou indisponível", () => {
  it("`kid` desconhecido não vira amplificador de tráfego: no máximo uma re-busca por janela", async () => {
    const porta = criarAdaptadorOidc(
      configuracao({ ttlCacheJwksSegundos: 300, intervaloMinimoDeRefreshSegundos: 300 }),
    );
    // Primeira busca legítima, para popular o cache.
    expect((await porta.autenticar(requisicaoCom(servidor.emissorDeTeste.emitir()))).ok).toBe(true);
    const aposPrimeira = servidor.buscasAoJwks();

    const forjado = servidor.emissorDeTeste.emitirBruto(
      { alg: servidor.emissorDeTeste.algoritmo, typ: "JWT", kid: "SYNTH-KID-FORJADO" },
      { iss: servidor.emissorDeTeste.emissor, aud: servidor.emissorDeTeste.audiencia },
    );
    for (let i = 0; i < 20; i += 1) {
      const r = await porta.autenticar(requisicaoCom(forjado));
      expect(r.ok).toBe(false);
    }
    expect(servidor.buscasAoJwks() - aposPrimeira).toBeLessThanOrEqual(1);
  });

  it("HTTP 500, corpo inválido e tempo esgotado resultam em 401 — nunca em aceitação (THR-0021)", async () => {
    for (const modo of ["http-500", "corpo-invalido", "silencio"] as const) {
      const servidorLocal = await criarServidorOidcDeTeste();
      servidorLocal.definirModoDeFalha(modo);
      const porta = criarAdaptadorOidc({
        perfil: "test",
        adaptador: "oidc",
        oidc: {
          emissor: servidorLocal.emissorDeTeste.emissor,
          audiencia: servidorLocal.emissorDeTeste.audiencia,
          jwksUri: servidorLocal.jwksUri,
          tempoLimiteDeBuscaMs: 150,
          intervaloMinimoDeRefreshSegundos: 0,
        },
      });
      const r = await porta.autenticar(requisicaoCom(servidorLocal.emissorDeTeste.emitir()));
      expect(r.ok, `modo de falha "${modo}" resultou em aceitação`).toBe(false);
      if (!r.ok) {
        expect(r.codigo).toBe("fonte-de-chaves-indisponivel");
        expect(r.problema.status).toBe(401);
      }
      await servidorLocal.fechar();
    }
  });

  it("cache VENCIDO não é usado como contingência quando a fonte cai — stale-if-error seria o caminho alternativo proibido", async () => {
    const porta = criarAdaptadorOidc(configuracao({ ttlCacheJwksSegundos: 0 }));
    const token = servidor.emissorDeTeste.emitir();
    expect((await porta.autenticar(requisicaoCom(token))).ok).toBe(true);

    servidor.definirModoDeFalha("http-500");
    const r = await porta.autenticar(requisicaoCom(token));
    expect(r.ok, "cache vencido foi usado após a fonte de chaves cair").toBe(false);
    if (!r.ok) expect(r.codigo).toBe("fonte-de-chaves-indisponivel");
  });

  it("host de JWKS inalcançável resulta em 401, não em exceção nem em 500", async () => {
    const porta = criarAdaptadorOidc({
      perfil: "test",
      adaptador: "oidc",
      oidc: {
        emissor: "http://127.0.0.1:1/",
        audiencia: "urn:intensicare:api:v1",
        // Porta 1 em loopback: recusa de conexão determinística.
        jwksUri: "http://127.0.0.1:1/jwks.json",
        tempoLimiteDeBuscaMs: 150,
      },
    });
    const r = await porta.autenticar(requisicaoCom(servidor.emissorDeTeste.emitir()));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.problema.status).toBe(401);
  });
});

describe("adaptador OIDC — recusas de identidade e de concessão", () => {
  it("recusa cabeçalho ausente, esquema errado e token vazio", async () => {
    const porta = criarAdaptadorOidc(configuracao());
    const casos: readonly [string, Record<string, string>][] = [
      ["cabecalho-ausente", {}],
      ["esquema-invalido", { authorization: "Basic YWJjOmRlZg==" }],
      ["esquema-invalido", { authorization: "abcdef" }],
      ["token-vazio", { authorization: "Bearer    " }],
    ];
    for (const [codigoEsperado, headers] of casos) {
      const r = await porta.autenticar({ id: "SYNTH-REQ-0002", headers });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.codigo, JSON.stringify(headers)).toBe(codigoEsperado);
        expect(r.problema.status).toBe(401);
      }
    }
    // Nenhuma dessas recusas precisou tocar a rede.
    expect(servidor.buscasAoJwks()).toBe(0);
  });

  it("`Bearer` é case-insensitive (RFC 6750 §2.1) e o token é aceito do mesmo jeito", async () => {
    const porta = criarAdaptadorOidc(configuracao());
    const r = await porta.autenticar({
      id: "SYNTH-REQ-0003",
      headers: { authorization: `bearer ${servidor.emissorDeTeste.emitir()}` },
    });
    expect(r.ok).toBe(true);
  });

  it("recusa `Authorization` repetido — contrabando de cabeçalho não escolhe uma das ocorrências", async () => {
    const porta = criarAdaptadorOidc(configuracao());
    const r = await porta.autenticar({
      id: "SYNTH-REQ-0004",
      headers: { authorization: [`Bearer ${servidor.emissorDeTeste.emitir()}`, "Bearer x"] },
    });
    expect(r.ok).toBe(false);
  });

  it("aplica a lista branca de tenants da CONFIGURAÇÃO com 403 (ADR-0016 §4.1)", async () => {
    const porta = criarAdaptadorOidc(configuracao({}, { tenantsPermitidos: ["SYNTH-TENANT-G7"] }));
    const permitido = await porta.autenticar(
      requisicaoCom(servidor.emissorDeTeste.emitir({ tenant: "SYNTH-TENANT-G7" })),
    );
    expect(permitido.ok).toBe(true);

    const negado = await porta.autenticar(
      requisicaoCom(
        servidor.emissorDeTeste.emitir({
          tenant: "SYNTH-TENANT-INTRUSO",
          scope: "clinico:leitura tenant:SYNTH-TENANT-INTRUSO",
        }),
      ),
    );
    expect(negado.ok).toBe(false);
    if (!negado.ok) {
      expect(negado.codigo).toBe("tenant-nao-autorizado");
      expect(negado.problema.status).toBe(403);
    }
  });

  it("autentica identidade m2m (client credentials) sem escopo clínico amplo e a distingue do usuário", async () => {
    const porta = criarAdaptadorOidc(configuracao());
    const r = await porta.autenticar(
      requisicaoCom(
        servidor.emissorDeTeste.emitir({
          sub: "SYNTH-WORKLOAD-RELAY",
          scope: "m2m tenant:SYNTH-TENANT-G7",
          papeis: undefined,
        }),
      ),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.contexto.tipoIdentidade).toBe("workload");
      expect(r.contexto.papeis).toEqual([]);
    }
  });

  it("o corpo da recusa nunca ecoa token, tenant, sujeito, emissor nem `kid`", async () => {
    const porta = criarAdaptadorOidc(configuracao());
    const token = servidor.emissorDeTeste.emitir({
      tenant: "SYNTH-TENANT-SEGREDO",
      sub: "SYNTH-SUJEITO-SEGREDO",
      aud: "audiencia-errada",
    });
    const r = await porta.autenticar(requisicaoCom(token));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const corpo = JSON.stringify(r.problema);
      for (const proibido of [
        token,
        "SYNTH-TENANT-SEGREDO",
        "SYNTH-SUJEITO-SEGREDO",
        servidor.emissorDeTeste.kid,
        servidor.emissorDeTeste.emissor,
        "audiencia",
      ]) {
        expect(corpo, `vazou "${proibido}"`).not.toContain(proibido);
      }
      expect(r.problema.instance).toBe("urn:intensicare:requisicao:SYNTH-REQ-0001");
    }
  });
});
