/**
 * apps/api/src/auth/verificador.test.ts — matriz adversarial do verificador
 * único de token (ADR-0015 §4 direção aceita GDEC-0016; §8 V1/V2).
 *
 * Lente: o token chega de um atacante. Cada caso abaixo é uma forma
 * conhecida de forjar identidade contra um verificador JWS mal escrito;
 * todos precisam terminar em recusa, com `problem+json` genérico em pt-BR,
 * sem revelar QUAL verificação falhou e sem ecoar tenant, sujeito ou token.
 *
 * Rastreio: SEC-0001 (tenant nunca defaultado), SEC-0004 (validação contra
 * chave confiável sem fallback), THR-0021 (falha da fonte de chave ⇒ nega),
 * HAZ-0014 (o legado caía para JWT local em qualquer erro).
 */

import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { criarFonteDeChavesEmMemoria } from "./jwks.js";
import { criarEmissorDeTeste } from "./servidor-oidc-de-teste.js";
import { criarVerificadorDeToken } from "./verificador.js";

const AGORA = () => Math.floor(Date.now() / 1000);

function verificadorPara(
  emissor: ReturnType<typeof criarEmissorDeTeste>,
  extras: Parameters<typeof criarVerificadorDeToken>[0] extends infer C
    ? C extends { emissor: string }
      ? Partial<C>
      : never
    : never = {},
) {
  return criarVerificadorDeToken({
    emissor: emissor.emissor,
    audiencia: emissor.audiencia,
    fonteDeChaves: criarFonteDeChavesEmMemoria(() => emissor.jwks()),
    ...extras,
  });
}

describe("verificador de token — casos legítimos (ADR-0015 §4.1: seis claims obrigatórias)", () => {
  it("aceita token bem formado e deriva tenant/ator EXCLUSIVAMENTE da claim assinada", async () => {
    const e = criarEmissorDeTeste();
    const r = await verificadorPara(e).verificar(
      e.emitir({ tenant: "SYNTH-TENANT-G7", sub: "SYNTH-PROFISSIONAL-01" }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.contexto.tenantId).toBe("SYNTH-TENANT-G7");
      expect(r.contexto.atorId).toBe("SYNTH-PROFISSIONAL-01");
      expect(r.contexto.tipoIdentidade).toBe("usuario");
    }
  });

  it("aceita as três famílias de algoritmo assimétrico da lista branca", async () => {
    for (const algoritmo of ["ES256", "RS256", "EdDSA"] as const) {
      const e = criarEmissorDeTeste({ algoritmo });
      const r = await verificadorPara(e).verificar(e.emitir());
      expect(r.ok, `algoritmo legítimo recusado: ${algoritmo}`).toBe(true);
    }
  });

  it("aceita identidade de workload (client-credentials) e a marca como distinta da de usuário", async () => {
    const e = criarEmissorDeTeste();
    const r = await verificadorPara(e).verificar(
      e.emitir({
        sub: "SYNTH-WORKLOAD-RELAY-OUTBOX",
        scope: "m2m tenant:SYNTH-TENANT-G7",
        papeis: undefined,
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.contexto.tipoIdentidade).toBe("workload");
      expect(r.contexto.atorId).toBe("SYNTH-WORKLOAD-RELAY-OUTBOX");
    }
  });
});

describe("verificador de token — falsificação de algoritmo", () => {
  it("recusa alg=none (com e sem assinatura presente)", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    const semAssinatura = e.emitirBruto(
      { alg: "none", typ: "JWT", kid: e.kid },
      {
        iss: e.emissor,
        aud: e.audiencia,
        sub: "x",
        tenant: "SYNTH-T",
        scope: "clinico:leitura",
        exp: AGORA() + 60,
      },
      { semAssinatura: true },
    );
    const comLixo = e.emitirBruto(
      { alg: "none", typ: "JWT", kid: e.kid },
      {
        iss: e.emissor,
        aud: e.audiencia,
        sub: "x",
        tenant: "SYNTH-T",
        scope: "clinico:leitura",
        exp: AGORA() + 60,
      },
    );
    for (const token of [semAssinatura, comLixo]) {
      const r = await v.verificar(token);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.falha.codigo).toBe("algoritmo-nao-permitido");
        expect(r.falha.status).toBe(401);
      }
    }
  });

  it("recusa confusão HS/RS — token HS256 assinado com a chave PÚBLICA do emissor como segredo", async () => {
    const e = criarEmissorDeTeste({ algoritmo: "RS256" });
    const segredo = e.chavePublicaEmSpki();
    const token = e.emitirBruto(
      { alg: "HS256", typ: "JWT", kid: e.kid },
      {
        iss: e.emissor,
        aud: e.audiencia,
        sub: "SYNTH-ATACANTE",
        tenant: "SYNTH-TENANT-G7",
        scope: "clinico:leitura",
        exp: AGORA() + 60,
      },
      { segredoHmac: segredo },
    );
    // O token é criptograficamente coerente para quem tratar `alg` como
    // instrução — é exatamente essa a armadilha.
    const [cabecalho, payload, assinatura] = token.split(".");
    const recalculada = createHmac("sha256", segredo)
      .update(`${cabecalho}.${payload}`)
      .digest("base64url");
    expect(assinatura).toBe(recalculada);

    const r = await verificadorPara(e).verificar(token);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.falha.codigo).toBe("algoritmo-nao-permitido");
  });

  it("recusa algoritmo assimétrico fora da lista branca e algoritmo incoerente com a família da chave", async () => {
    const e = criarEmissorDeTeste({ algoritmo: "ES256" });
    const v = verificadorPara(e);

    const foraDaLista = e.emitirBruto(
      { alg: "RSA1_5", typ: "JWT", kid: e.kid },
      {
        iss: e.emissor,
        aud: e.audiencia,
        sub: "x",
        tenant: "SYNTH-T",
        scope: "s",
        exp: AGORA() + 60,
      },
    );
    const rFora = await v.verificar(foraDaLista);
    expect(rFora.ok).toBe(false);
    if (!rFora.ok) expect(rFora.falha.codigo).toBe("algoritmo-nao-permitido");

    // `alg: RS256` declarado sobre uma chave EC publicada no JWKS: o
    // verificador não pode "tentar assim mesmo".
    const familiaTrocada = e.emitirBruto(
      { alg: "RS256", typ: "JWT", kid: e.kid },
      {
        iss: e.emissor,
        aud: e.audiencia,
        sub: "x",
        tenant: "SYNTH-T",
        scope: "s",
        exp: AGORA() + 60,
      },
    );
    const rFamilia = await v.verificar(familiaTrocada);
    expect(rFamilia.ok).toBe(false);
    if (!rFamilia.ok) expect(rFamilia.falha.codigo).toBe("familia-de-chave-incompativel");
  });

  it("recusa cabeçalho JOSE com `crit` não suportado", async () => {
    const e = criarEmissorDeTeste();
    const token = e.emitirBruto(
      { alg: e.algoritmo, typ: "JWT", kid: e.kid, crit: ["exp"] },
      {
        iss: e.emissor,
        aud: e.audiencia,
        sub: "x",
        tenant: "SYNTH-T",
        scope: "s",
        exp: AGORA() + 60,
      },
    );
    const r = await verificadorPara(e).verificar(token);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.falha.codigo).toBe("parametro-crit-nao-suportado");
  });
});

describe("verificador de token — chave e assinatura", () => {
  it("recusa assinatura adulterada (um bit do payload trocado)", async () => {
    const e = criarEmissorDeTeste();
    const token = e.emitir({ tenant: "SYNTH-TENANT-G7" });
    const [cabecalho, payload, assinatura] = token.split(".");
    const claims = JSON.parse(Buffer.from(String(payload), "base64url").toString("utf8"));
    claims.tenant = "SYNTH-TENANT-INTRUSO";
    const payloadForjado = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
    const r = await verificadorPara(e).verificar(`${cabecalho}.${payloadForjado}.${assinatura}`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.falha.codigo).toBe("assinatura-invalida");
  });

  it("recusa token assinado por chave desconhecida, ainda que a assinatura seja válida", async () => {
    const legitimo = criarEmissorDeTeste();
    const invasor = criarEmissorDeTeste({
      emissor: legitimo.emissor,
      audiencia: legitimo.audiencia,
    });
    // Assinatura internamente válida — só que de outra chave.
    const r = await verificadorPara(legitimo).verificar(invasor.emitir());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.falha.codigo).toBe("kid-desconhecido");
  });

  it("recusa `kid` desconhecido e `kid` ausente", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    const claims = {
      iss: e.emissor,
      aud: e.audiencia,
      sub: "x",
      tenant: "SYNTH-T",
      scope: "s",
      exp: AGORA() + 60,
    };
    const rDesconhecido = await v.verificar(
      e.emitirBruto({ alg: e.algoritmo, typ: "JWT", kid: "kid-que-nunca-existiu" }, claims),
    );
    expect(rDesconhecido.ok).toBe(false);
    if (!rDesconhecido.ok) expect(rDesconhecido.falha.codigo).toBe("kid-desconhecido");

    const rAusente = await v.verificar(e.emitirBruto({ alg: e.algoritmo, typ: "JWT" }, claims));
    expect(rAusente.ok).toBe(false);
    if (!rAusente.ok) expect(rAusente.falha.codigo).toBe("kid-ausente");
  });

  it("após rotação de chave, o token da chave retirada deixa de ser aceito e o da nova passa a ser", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    const tokenAntigo = e.emitir();
    expect((await v.verificar(tokenAntigo)).ok).toBe(true);

    e.rotacionar();

    const rAntigo = await v.verificar(tokenAntigo);
    expect(rAntigo.ok, "token da chave retirada continuou aceito após rotação").toBe(false);
    if (!rAntigo.ok) expect(rAntigo.falha.codigo).toBe("kid-desconhecido");

    expect((await v.verificar(e.emitir())).ok).toBe(true);
  });

  it("fonte de chaves indisponível resulta em NEGAÇÃO, nunca em aceitação (THR-0021, HAZ-0014)", async () => {
    const e = criarEmissorDeTeste();
    const token = e.emitir();
    const v = criarVerificadorDeToken({
      emissor: e.emissor,
      audiencia: e.audiencia,
      fonteDeChaves: {
        obterChave: async () => ({
          ok: false as const,
          codigo: "fonte-de-chaves-indisponivel" as const,
        }),
      },
    });
    const r = await v.verificar(token);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.falha.codigo).toBe("fonte-de-chaves-indisponivel");
      expect(r.falha.status).toBe(401);
    }
  });
});

describe("verificador de token — emissor, audiência e janela temporal", () => {
  it("recusa issuer diferente do configurado (issuer confusion)", async () => {
    const e = criarEmissorDeTeste({ emissor: "https://idp-do-atacante.invalid" });
    const v = criarVerificadorDeToken({
      emissor: "https://idp-legitimo.invalid",
      audiencia: e.audiencia,
      fonteDeChaves: criarFonteDeChavesEmMemoria(() => e.jwks()),
    });
    const r = await v.verificar(e.emitir());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.falha.codigo).toBe("emissor-invalido");
  });

  it("recusa audiência incorreta, inclusive quando `aud` é lista sem a audiência esperada", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    for (const aud of ["outra-api", ["outra-api", "mais-outra"], []]) {
      const r = await v.verificar(e.emitir({ aud }));
      expect(r.ok, `audiência aceita indevidamente: ${JSON.stringify(aud)}`).toBe(false);
      if (!r.ok) expect(r.falha.codigo).toBe("audiencia-invalida");
    }
    // `aud` como lista CONTENDO a audiência esperada é legítimo (RFC 7519 §4.1.3).
    const rLista = await v.verificar(e.emitir({ aud: ["outra-api", e.audiencia] }));
    expect(rLista.ok).toBe(true);
  });

  it("recusa token expirado, com `nbf` futuro e com `iat` no futuro", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    const agora = AGORA();

    const expirado = await v.verificar(
      e.emitir({ exp: agora - 1, iat: agora - 600, nbf: agora - 600 }),
    );
    expect(expirado.ok).toBe(false);
    if (!expirado.ok) expect(expirado.falha.codigo).toBe("token-expirado");

    const futuro = await v.verificar(e.emitir({ nbf: agora + 600 }));
    expect(futuro.ok).toBe(false);
    if (!futuro.ok) expect(futuro.falha.codigo).toBe("token-ainda-nao-valido");

    const emitidoNoFuturo = await v.verificar(e.emitir({ iat: agora + 600 }));
    expect(emitidoNoFuturo.ok).toBe(false);
    if (!emitidoNoFuturo.ok) expect(emitidoNoFuturo.falha.codigo).toBe("token-emitido-no-futuro");
  });

  it("recusa `exp` ausente ou não numérico — sessão sem prazo não existe", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    for (const exp of [undefined, "9999999999", null]) {
      const r = await v.verificar(e.emitir({ exp }));
      expect(r.ok, `exp aceito indevidamente: ${JSON.stringify(exp)}`).toBe(false);
      if (!r.ok) expect(r.falha.codigo).toBe("expiracao-invalida");
    }
  });
});

describe("verificador de token — tenant e escopo (SEC-0001, ADR-0016 §4.1)", () => {
  it("recusa token sem claim `tenant`, com tenant vazio ou malformado — nunca defaulta", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    for (const tenant of [
      undefined,
      "",
      "   ",
      42,
      { id: "x" },
      "tenant com espaço",
      "a".repeat(200),
    ]) {
      const r = await v.verificar(e.emitir({ tenant }));
      expect(r.ok, `tenant aceito indevidamente: ${JSON.stringify(tenant)}`).toBe(false);
      if (!r.ok) {
        expect(["tenant-ausente", "tenant-malformado"]).toContain(r.falha.codigo);
      }
    }
  });

  it("recusa token sem `sub` e sem `scope`", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    const rSub = await v.verificar(e.emitir({ sub: undefined }));
    expect(rSub.ok).toBe(false);
    if (!rSub.ok) expect(rSub.falha.codigo).toBe("sujeito-ausente");

    for (const scope of [undefined, "", "   "]) {
      const r = await v.verificar(e.emitir({ scope }));
      expect(r.ok, `scope aceito indevidamente: ${JSON.stringify(scope)}`).toBe(false);
      if (!r.ok) expect(r.falha.codigo).toBe("escopo-ausente");
    }
  });

  it("recusa com 403 quando a claim `tenant` diverge do tenant afirmado no escopo assinado", async () => {
    const e = criarEmissorDeTeste();
    const r = await verificadorPara(e).verificar(
      e.emitir({ tenant: "SYNTH-TENANT-G7", scope: "clinico:leitura tenant:SYNTH-TENANT-INTRUSO" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.falha.codigo).toBe("tenant-divergente-do-escopo");
      expect(r.falha.status).toBe(403);
    }
  });

  it("recusa com 403 tenant fora da lista de tenants permitidos pela CONFIGURAÇÃO (nunca pelo chamador)", async () => {
    const e = criarEmissorDeTeste();
    const v = criarVerificadorDeToken({
      emissor: e.emissor,
      audiencia: e.audiencia,
      fonteDeChaves: criarFonteDeChavesEmMemoria(() => e.jwks()),
      tenantsPermitidos: ["SYNTH-TENANT-G7"],
    });
    const permitido = await v.verificar(
      e.emitir({ tenant: "SYNTH-TENANT-G7", scope: "clinico:leitura tenant:SYNTH-TENANT-G7" }),
    );
    expect(permitido.ok).toBe(true);

    const negado = await v.verificar(
      e.emitir({
        tenant: "SYNTH-TENANT-INTRUSO",
        scope: "clinico:leitura tenant:SYNTH-TENANT-INTRUSO",
      }),
    );
    expect(negado.ok).toBe(false);
    if (!negado.ok) {
      expect(negado.falha.codigo).toBe("tenant-nao-autorizado");
      expect(negado.falha.status).toBe(403);
    }
  });

  it("recusa com 403 identidade de workload que carregue escopo de leitura clínica ampla (ADR-0015 §4.1)", async () => {
    const e = criarEmissorDeTeste();
    const r = await verificadorPara(e).verificar(
      e.emitir({
        sub: "SYNTH-WORKLOAD-MCP",
        scope: "m2m clinico:leitura-ampla tenant:SYNTH-TENANT-G7",
        papeis: undefined,
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.falha.codigo).toBe("workload-com-escopo-clinico-amplo");
      expect(r.falha.status).toBe(403);
    }
  });
});

describe("verificador de token — forma do token e do erro", () => {
  it("recusa qualquer coisa que não seja um JWS compacto de três segmentos", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    const lixos = [
      "",
      "   ",
      "abc",
      "a.b",
      "a.b.c.d",
      "SYNTH-TOKEN.SYNTH-TENANT-G7.SYNTH-PROFISSIONAL-WEB",
      "....",
      `${e.emitir()}.extra`,
      "eyJhbGciOiJub25lIn0.eyJ0ZW5hbnQiOiJTWU5USC1URU5BTlQtRzcifQ.",
    ];
    for (const token of lixos) {
      const r = await v.verificar(token);
      expect(r.ok, `token aceito indevidamente: ${JSON.stringify(token)}`).toBe(false);
    }
  });

  it("recusa base64url inválido e payload que não seja objeto JSON", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    const cabecalho = Buffer.from(JSON.stringify({ alg: e.algoritmo, kid: e.kid })).toString(
      "base64url",
    );
    const casos = [
      `${cabecalho}.@@@nao-e-base64url@@@.aaaa`,
      `${cabecalho}.${Buffer.from("[1,2,3]").toString("base64url")}.aaaa`,
      `${cabecalho}.${Buffer.from('"texto"').toString("base64url")}.aaaa`,
      `${cabecalho}.${Buffer.from("nao-e-json").toString("base64url")}.aaaa`,
    ];
    for (const token of casos) {
      const r = await v.verificar(token);
      expect(r.ok, `token aceito indevidamente: ${JSON.stringify(token)}`).toBe(false);
    }
  });

  it("o problem+json de recusa é UNIFORME e não revela qual verificação falhou nem ecoa o token", async () => {
    const e = criarEmissorDeTeste();
    const v = verificadorPara(e);
    const tokenSensivel = e.emitir({
      tenant: "SYNTH-TENANT-SEGREDO",
      sub: "SYNTH-SUJEITO-SEGREDO",
      exp: AGORA() - 1,
    });
    const casosDe401 = [
      await v.verificar(tokenSensivel),
      await v.verificar(e.emitir({ aud: "outra-api" })),
      await v.verificar("lixo"),
      await v.verificar(e.emitir({ tenant: undefined })),
    ];
    const corpos = casosDe401.map((r) => {
      expect(r.ok).toBe(false);
      if (r.ok) throw new Error("caso deveria ter falhado");
      return JSON.stringify(r.falha.problema("urn:intensicare:requisicao:teste"));
    });
    // Todos idênticos: a resposta não é um oráculo do motivo da recusa.
    expect(new Set(corpos).size, `respostas distinguíveis: ${corpos.join(" | ")}`).toBe(1);
    const corpo = String(corpos[0]);
    expect(corpo).not.toContain("SYNTH-TENANT-SEGREDO");
    expect(corpo).not.toContain("SYNTH-SUJEITO-SEGREDO");
    expect(corpo).not.toContain(tokenSensivel);
    expect(corpo).not.toContain(e.emissor);
    expect(JSON.parse(corpo)).toMatchObject({ status: 401, title: "Não autenticado" });
  });
});
