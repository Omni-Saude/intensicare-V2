/**
 * apps/api/src/auth.test.ts — fachada `autenticar()` como as rotas a usam.
 *
 * Este arquivo cobre o ACHADO §6.2 (P0) pelo ângulo que importa ao chamador:
 * o tenant que a aplicação enxerga vem — e só pode vir — de claim assinada.
 * Antes desta mudança, `Bearer SYNTH-TOKEN.<qualquer-tenant>.<qualquer-ator>`
 * era aceito e o tenant saía do TEXTO do token.
 *
 * Rastreio: ADR-0015 §4/§8, ADR-0016 §4.1, SEC-0001, SEC-0004, HAZ-0014.
 */

import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAdaptadorOidc } from "./auth/adaptador-oidc.js";
import { perfilDoEmissorSintetico, reiniciarEmissorSintetico } from "./auth/adaptador-sintetico.js";
import {
  criarServidorOidcDeTeste,
  type ServidorOidcDeTeste,
} from "./auth/servidor-oidc-de-teste.js";
import {
  autenticar,
  criarPortaDeAutenticacao,
  gerarTokenSintetico,
  instalarPorta,
  registrarAutenticacao,
  reiniciarRegistroDeAutenticacao,
} from "./auth.js";

function requisicaoComAuthorization(valor: string | undefined): FastifyRequest {
  return {
    id: "SYNTH-REQ-AUTH",
    headers: valor === undefined ? {} : { authorization: valor },
    url: "/v1/pacientes/amh:psr:v1:SYNTH-PACIENTE-01/avaliacoes",
  } as unknown as FastifyRequest;
}

const TENANT = "SYNTH-TENANT-G7";
const ATOR = "SYNTH-PROFISSIONAL-WEB";

describe("gerarTokenSintetico — deixou de ser texto legível e passou a ser JWS assinado", () => {
  it("não produz mais o formato forjável `SYNTH-TOKEN.<tenant>.<ator>`", () => {
    const token = gerarTokenSintetico(TENANT, ATOR);
    expect(token).not.toContain("SYNTH-TOKEN.");
    expect(token.startsWith(`SYNTH-TOKEN.${TENANT}`)).toBe(false);
  });

  it("produz um JWS compacto com algoritmo assimétrico e `kid`", () => {
    const [cabecalhoB64, payloadB64, assinatura] = gerarTokenSintetico(TENANT, ATOR).split(".");
    expect(assinatura?.length ?? 0).toBeGreaterThan(0);
    const cabecalho = JSON.parse(Buffer.from(String(cabecalhoB64), "base64url").toString("utf8"));
    expect(cabecalho.alg).not.toBe("none");
    expect(String(cabecalho.alg)).not.toMatch(/^HS/);
    expect(typeof cabecalho.kid).toBe("string");
    const claims = JSON.parse(Buffer.from(String(payloadB64), "base64url").toString("utf8"));
    for (const obrigatoria of ["iss", "aud", "exp", "sub", "tenant", "scope"]) {
      expect(claims[obrigatoria], `claim obrigatória ausente: ${obrigatoria}`).toBeDefined();
    }
  });
});

describe("autenticar — o tenant vem EXCLUSIVAMENTE da claim assinada", () => {
  it("aceita o token sintético e devolve tenant/ator da claim", () => {
    const r = autenticar(requisicaoComAuthorization(`Bearer ${gerarTokenSintetico(TENANT, ATOR)}`));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.contexto.tenantId).toBe(TENANT);
      expect(r.contexto.atorId).toBe(ATOR);
      expect(r.contexto.tipoIdentidade).toBe("usuario");
      expect(r.contexto.expiraEm).toBeGreaterThan(Math.floor(Date.now() / 1000));
    }
  });

  it("REESCREVER o tenant dentro do token não muda o escopo lido — recusa em vez de trocar de tenant", () => {
    const token = gerarTokenSintetico(TENANT, ATOR);
    const [cabecalho, payload, assinatura] = token.split(".");
    const claims = JSON.parse(Buffer.from(String(payload), "base64url").toString("utf8"));
    claims.tenant = "SYNTH-TENANT-INTRUSO";
    claims.scope = "clinico:leitura clinico:acao tenant:SYNTH-TENANT-INTRUSO";
    const forjado = `${cabecalho}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.${assinatura}`;

    const r = autenticar(requisicaoComAuthorization(`Bearer ${forjado}`));
    expect(r.ok, "token com tenant reescrito foi aceito").toBe(false);
    if (!r.ok) {
      expect(r.codigo).toBe("assinatura-invalida");
      expect(r.problema.status).toBe(401);
    }
  });

  it("nenhum outro lugar da requisição influencia o tenant (header, query, corpo, URL)", () => {
    const token = gerarTokenSintetico(TENANT, ATOR);
    const requisicao = {
      id: "SYNTH-REQ-AUTH",
      headers: {
        authorization: `Bearer ${token}`,
        "x-tenant-id": "SYNTH-TENANT-INTRUSO",
        "x-forwarded-tenant": "SYNTH-TENANT-INTRUSO",
      },
      query: { tenant: "SYNTH-TENANT-INTRUSO" },
      body: { tenantId: "SYNTH-TENANT-INTRUSO" },
      url: "/v1/projecoes/grade-leitos?tenant=SYNTH-TENANT-INTRUSO",
    } as unknown as FastifyRequest;

    const r = autenticar(requisicao);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.contexto.tenantId).toBe(TENANT);
  });

  it("recusa `alg: none`, token de emissor desconhecido e sessão expirada — todos com 401", () => {
    const casos: readonly [string, string][] = [
      ["alg=none", "eyJhbGciOiJub25lIiwia2lkIjoieCJ9.eyJ0ZW5hbnQiOiJTWU5USC1URU5BTlQtRzcifQ."],
      ["texto arbitrário", "token-qualquer"],
      ["formato antigo", `SYNTH-TOKEN.${TENANT}.${ATOR}`],
      ["vazio", ""],
    ];
    for (const [rotulo, token] of casos) {
      const r = autenticar(requisicaoComAuthorization(`Bearer ${token}`));
      expect(r.ok, `aceito indevidamente: ${rotulo}`).toBe(false);
      if (!r.ok) expect(r.problema.status).toBe(401);
    }
  });

  it("recusa requisição sem `Authorization` e com esquema diferente de Bearer", () => {
    for (const valor of [undefined, "Basic dXNlcjpwYXNz", "SYNTH-TOKEN.a.b"]) {
      const r = autenticar(requisicaoComAuthorization(valor));
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.problema.status).toBe(401);
        expect(r.problema.title).toBe("Não autenticado");
      }
    }
  });

  it("o `instance` do problema é a URN de ocorrência, nunca a URL (SAF-0026/SEC-0015)", () => {
    const r = autenticar(requisicaoComAuthorization(undefined));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.problema.instance).toBe("urn:intensicare:requisicao:SYNTH-REQ-AUTH");
      expect(JSON.stringify(r.problema)).not.toContain("SYNTH-PACIENTE-01");
    }
  });
});

describe("porta instalada no servidor — hook único de verificação", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    reiniciarRegistroDeAutenticacao();
    app = Fastify({ logger: false });
    app.get("/publica", async () => ({ status: "ok" }));
    app.get("/protegida", async (request, reply) => {
      const auth = autenticar(request);
      if (!auth.ok) return reply.code(auth.problema.status ?? 401).send(auth.problema);
      return reply.code(200).send({ tenantId: auth.contexto.tenantId });
    });
  });

  afterEach(async () => {
    await app.close();
    reiniciarRegistroDeAutenticacao();
  });

  it("a rota pública continua pública: o hook computa, mas não responde por conta própria", async () => {
    registrarAutenticacao(
      app,
      criarPortaDeAutenticacao({ perfil: "test", adaptador: "sintetico" }),
    );
    const r = await app.inject({ method: "GET", url: "/publica" });
    expect(r.statusCode).toBe(200);
  });

  it("a rota protegida lê o resultado do hook e devolve o tenant verificado", async () => {
    registrarAutenticacao(
      app,
      criarPortaDeAutenticacao({ perfil: "test", adaptador: "sintetico" }),
    );
    const r = await app.inject({
      method: "GET",
      url: "/protegida",
      headers: { authorization: `Bearer ${gerarTokenSintetico(TENANT, ATOR)}` },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ tenantId: TENANT });
  });

  it("devolve 403 (e não 401) quando a identidade é válida mas o tenant não está na lista da configuração", async () => {
    registrarAutenticacao(
      app,
      criarPortaDeAutenticacao({
        perfil: "test",
        adaptador: "sintetico",
        tenantsPermitidos: ["SYNTH-TENANT-AUTORIZADO"],
      }),
    );
    const r = await app.inject({
      method: "GET",
      url: "/protegida",
      headers: { authorization: `Bearer ${gerarTokenSintetico(TENANT, ATOR)}` },
    });
    expect(r.statusCode).toBe(403);
    expect(r.json()).toMatchObject({ status: 403, title: "Acesso negado" });
  });
});

describe("ausência de fallback — a regressão que HAZ-0014 registra no legado", () => {
  let servidor: ServidorOidcDeTeste;
  let app: FastifyInstance;

  beforeEach(async () => {
    reiniciarRegistroDeAutenticacao();
    servidor = await criarServidorOidcDeTeste();
    app = Fastify({ logger: false });
    app.get("/protegida", async (request, reply) => {
      const auth = autenticar(request);
      if (!auth.ok) return reply.code(auth.problema.status ?? 401).send(auth.problema);
      return reply.code(200).send({ tenantId: auth.contexto.tenantId });
    });
  });

  afterEach(async () => {
    await app.close();
    await servidor.fechar();
    reiniciarRegistroDeAutenticacao();
  });

  it("com a porta OIDC instalada e o JWKS FORA DO AR, um token sintético VÁLIDO é recusado", async () => {
    const porta = criarAdaptadorOidc({
      perfil: "test",
      adaptador: "oidc",
      oidc: {
        emissor: servidor.emissorDeTeste.emissor,
        audiencia: servidor.emissorDeTeste.audiencia,
        jwksUri: servidor.jwksUri,
        tempoLimiteDeBuscaMs: 150,
        intervaloMinimoDeRefreshSegundos: 0,
      },
    });
    registrarAutenticacao(app, porta);
    servidor.definirModoDeFalha("http-500");

    // Token sintético legítimo — o que o fluxo de dev usa. Sob a porta real,
    // não vale nada, nem mesmo com o IdP indisponível.
    const sintetico = await app.inject({
      method: "GET",
      url: "/protegida",
      headers: { authorization: `Bearer ${gerarTokenSintetico(TENANT, ATOR)}` },
    });
    expect(sintetico.statusCode, "token sintético foi aceito pela porta OIDC").toBe(401);

    // E o token legítimo do IdP também é recusado enquanto a fonte de chaves
    // está fora: negar é o comportamento correto, não degradar.
    const doIdp = await app.inject({
      method: "GET",
      url: "/protegida",
      headers: { authorization: `Bearer ${servidor.emissorDeTeste.emitir()}` },
    });
    expect(doIdp.statusCode).toBe(401);

    // Restabelecida a fonte, o token do IdP passa a valer — prova de que a
    // recusa anterior era pela indisponibilidade, não por outro motivo.
    servidor.definirModoDeFalha("nenhum");
    const aposRestabelecer = await app.inject({
      method: "GET",
      url: "/protegida",
      headers: { authorization: `Bearer ${servidor.emissorDeTeste.emitir()}` },
    });
    expect(aposRestabelecer.statusCode).toBe(200);
  });
});

describe("contenção por perfil na fachada", () => {
  const perfilOriginal = process.env.INTENSICARE_PERFIL;
  const nodeEnvOriginal = process.env.NODE_ENV;

  beforeEach(() => {
    reiniciarRegistroDeAutenticacao();
    reiniciarEmissorSintetico();
  });

  afterEach(() => {
    if (perfilOriginal === undefined) delete process.env.INTENSICARE_PERFIL;
    else process.env.INTENSICARE_PERFIL = perfilOriginal;
    if (nodeEnvOriginal === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnvOriginal;
    reiniciarRegistroDeAutenticacao();
    reiniciarEmissorSintetico();
  });

  it("em perfil `producao` sem porta instalada, `autenticar` recusa com 401 em vez de cair para o sintético", () => {
    process.env.INTENSICARE_PERFIL = "producao";
    const r = autenticar(requisicaoComAuthorization("Bearer qualquer-coisa"));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.codigo).toBe("porta-nao-instalada");
      expect(r.problema.status).toBe(401);
    }
  });

  it("em perfil `producao`, emitir token sintético LANÇA", () => {
    process.env.INTENSICARE_PERFIL = "producao";
    expect(() => gerarTokenSintetico(TENANT, ATOR)).toThrowError(
      /Contenção de identidade sintética/,
    );
  });

  it("sem perfil declarado no ambiente, o comportamento é o de NÃO-dev (fail-closed)", () => {
    delete process.env.INTENSICARE_PERFIL;
    delete process.env.NODE_ENV;
    const r = autenticar(requisicaoComAuthorization("Bearer qualquer-coisa"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe("porta-nao-instalada");
    expect(() => gerarTokenSintetico(TENANT, ATOR)).toThrowError(
      /Contenção de identidade sintética/,
    );
  });
});

/**
 * DEFEITO REPRODUZIDO — `POST /v1/dev/sessao` respondia HTTP 500 no processo
 * real, e nenhum gate pegava.
 *
 * Raiz: assimetria entre CONSTRUÇÃO e EMISSÃO. Na construção o perfil chega
 * explícito, vindo da configuração tipada (`composicao/autenticacao.ts`
 * traduz `dev-synthetic` → `dev`) e a guarda de contenção passa. Na emissão,
 * feita POR REQUISIÇÃO, o perfil era **relido do ambiente** por
 * `perfilDoAmbiente()`, que conhece apenas `INTENSICARE_PERFIL` e `NODE_ENV`
 * — nunca `PERFIL`, que é a variável obrigatória do runtime real (ACH-03).
 * Resultado: `undefined` ⇒ a guarda lança ⇒ o `throw` sobe pela chamada
 * síncrona em `routes.ts` até o `setErrorHandler` e vira "Erro interno
 * inesperado".
 *
 * POR QUE A SUÍTE NÃO VIA: `apps/api/vitest.config.ts` declara
 * `env: { PERFIL: "test" }` e o próprio vitest define `NODE_ENV=test`. A
 * guarda era satisfeita por um caminho que a execução real não tem — verde
 * falso da classe que o §12 do pedido proíbe. Os testes abaixo removem
 * `NODE_ENV` e `INTENSICARE_PERFIL` e deixam só `PERFIL`, que é o ambiente
 * do processo real.
 *
 * Correção: a autorização para emitir é estabelecida UMA VEZ, na construção
 * do adaptador, e é CARREGADA daí em diante — não re-derivada de estado de
 * ambiente a cada requisição. Ensinar `perfilDoAmbiente()` a ler `PERFIL`
 * teria escondido o sintoma mantendo a releitura por requisição, que é a raiz.
 */
describe("emissão não pode re-derivar o perfil do ambiente a cada requisição", () => {
  const original = {
    PERFIL: process.env.PERFIL,
    INTENSICARE_PERFIL: process.env.INTENSICARE_PERFIL,
    NODE_ENV: process.env.NODE_ENV,
  };

  /**
   * Ambiente do processo REAL: só `PERFIL`, com o vocabulário de
   * `config/perfis.ts`. `NODE_ENV` é REMOVIDO de propósito — é a variável que
   * o vitest injeta e que mascarava o defeito.
   */
  function ambienteDeExecucaoReal(perfilDeRuntime = "dev-synthetic"): void {
    delete process.env.INTENSICARE_PERFIL;
    delete process.env.NODE_ENV;
    process.env.PERFIL = perfilDeRuntime;
  }

  beforeEach(() => {
    reiniciarRegistroDeAutenticacao();
    reiniciarEmissorSintetico();
  });

  afterEach(() => {
    for (const [chave, valor] of Object.entries(original)) {
      if (valor === undefined) delete process.env[chave];
      else process.env[chave] = valor;
    }
    reiniciarRegistroDeAutenticacao();
    reiniciarEmissorSintetico();
  });

  it("a porta construída com perfil explícito EMITE com `PERFIL` definido e `NODE_ENV` ausente", () => {
    // Construção primeiro, como no boot real (index.ts), ainda com o ambiente
    // da suíte — o perfil vem da CONFIGURAÇÃO, não do ambiente.
    const porta = criarPortaDeAutenticacao({ perfil: "dev", adaptador: "sintetico" });

    // Só então o ambiente vira o do processo real.
    ambienteDeExecucaoReal();

    const emitir = porta.emitirToken;
    expect(emitir).toBeTypeOf("function");
    const token = emitir?.(TENANT, ATOR);
    expect(typeof token).toBe("string");
    expect(String(token).split(".")).toHaveLength(3);

    // A autorização de emitir ficou registrada com o perfil da CONSTRUÇÃO,
    // não com o que o ambiente diria agora.
    expect(perfilDoEmissorSintetico()).toBe("dev");
  });

  it("o token emitido nesse ambiente PASSA no verificador da mesma porta — é o que `/v1/dev/sessao` exige antes de entregar", async () => {
    const porta = criarPortaDeAutenticacao({ perfil: "dev", adaptador: "sintetico" });
    ambienteDeExecucaoReal();

    const token = porta.emitirToken?.(TENANT, ATOR) ?? "";
    const verificado = await porta.autenticar({
      id: "SYNTH-REQ-DEV-SESSAO",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(verificado.ok).toBe(true);
    if (verificado.ok) {
      expect(verificado.contexto.tenantId).toBe(TENANT);
      expect(verificado.contexto.expiraEm).toBeGreaterThan(Math.floor(Date.now() / 1000));
    }
  });

  it("`gerarTokenSintetico` também para de reler o ambiente depois que o adaptador foi construído", () => {
    const porta = criarPortaDeAutenticacao({ perfil: "dev", adaptador: "sintetico" });
    ambienteDeExecucaoReal();

    // A emissão já não depende do ambiente: antes da correção, esta linha
    // lançava e derrubava a requisição inteira com 500.
    const token = gerarTokenSintetico(TENANT, ATOR);
    expect(token.split(".")).toHaveLength(3);

    // Construir NÃO é instalar. Sem porta instalada, e sem perfil derivável do
    // ambiente, `autenticar` recusa 401 — fail-closed, nunca 500 e nunca
    // aceitação. É o limite correto, fixado aqui de propósito.
    const semPorta = autenticar(requisicaoComAuthorization(`Bearer ${token}`));
    expect(semPorta.ok).toBe(false);
    if (!semPorta.ok) expect(semPorta.codigo).toBe("porta-nao-instalada");

    // Instalada a porta — o que `index.ts` faz no boot — o mesmo token verifica.
    instalarPorta(porta);
    const r = autenticar(requisicaoComAuthorization(`Bearer ${token}`));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.contexto.tenantId).toBe(TENANT);
  });

  it("uma rota que emite e verifica devolve 201, não 500 — a forma exata de `POST /v1/dev/sessao`", async () => {
    const porta = criarPortaDeAutenticacao({ perfil: "dev", adaptador: "sintetico" });
    ambienteDeExecucaoReal();

    const app = Fastify({ logger: false });
    app.setErrorHandler((_erro, _req, reply) => {
      reply.code(500).send({ title: "Erro interno inesperado" });
    });
    app.post("/v1/dev/sessao", async (request, reply) => {
      const emitir = porta.emitirToken;
      if (emitir === undefined) return reply.code(503).send({});
      const token = emitir(TENANT, ATOR);
      const verificado = await porta.autenticar({
        headers: { authorization: `Bearer ${token}` },
        id: String(request.id),
      });
      if (!verificado.ok) return reply.code(500).send({ title: "não verificável" });
      return reply
        .code(201)
        .send({ token, expiraEm: new Date(verificado.contexto.expiraEm * 1000).toISOString() });
    });

    const r = await app.inject({ method: "POST", url: "/v1/dev/sessao" });
    expect(r.statusCode, `corpo: ${r.body}`).toBe(201);
    expect(r.json()).toMatchObject({ token: expect.any(String) });
    await app.close();
  });

  it("CONTENÇÃO PRESERVADA: sem adaptador construído, `PERFIL=dev-synthetic` sozinho NÃO autoriza emissão", () => {
    ambienteDeExecucaoReal();
    // Nenhuma construção precedeu: nada estabeleceu autorização, e o
    // vocabulário de `config/` não é lido por este módulo de propósito.
    expect(perfilDoEmissorSintetico()).toBeUndefined();
    expect(() => gerarTokenSintetico(TENANT, ATOR)).toThrowError(
      /Contenção de identidade sintética/,
    );
    // A recusa não estabeleceu autorização por efeito colateral.
    expect(perfilDoEmissorSintetico()).toBeUndefined();
  });

  it("CONTENÇÃO PRESERVADA: construir em `producao` lança, logo a emissão nunca chega a ser autorizada", () => {
    // Processo de produção de verdade: `NODE_ENV` do vitest também sai, senão
    // o teste estaria medindo o ambiente da suíte em vez do cenário que diz medir.
    ambienteDeExecucaoReal("production");
    expect(() =>
      criarPortaDeAutenticacao({ perfil: "producao", adaptador: "sintetico" }),
    ).toThrowError(/Contenção de identidade sintética/);
    expect(() => gerarTokenSintetico(TENANT, ATOR)).toThrowError(
      /Contenção de identidade sintética/,
    );
  });
});
