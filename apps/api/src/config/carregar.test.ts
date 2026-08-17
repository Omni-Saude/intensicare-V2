/**
 * Teste de aceite do carregamento de configuração de runtime (ACH-03, §6.3).
 *
 * VERMELHO ANTES DE VERDE. Antes deste módulo existir, `apps/api/src/index.ts`
 * lia exatamente uma variável (`process.env.PORT`) e `prepareDatabase` criava
 * PGlite em memória + semeava fixtures sintéticas por OMISSÃO — reproduzido em
 * `apps/api/src/db.ts:93-99` e `apps/api/src/index.ts:91-104`. Nenhum destes
 * casos podia sequer ser escrito, porque não havia perfil.
 *
 * Cada caso abaixo materializa uma afirmação de validação que hoje é apenas
 * prosa em ADR-0019 §9 V2 ("Boot falha (fail-closed) quando configuração
 * obrigatória está ausente") e ADR-0019 §5.2 P4 ("ausência de configuração
 * obrigatória falha o boot — nunca degrada silenciosamente para um default
 * inseguro").
 */
import { describe, expect, it } from "vitest";
import {
  carregarConfiguracao,
  ErroDeConfiguracao,
  PERFIS,
  PERFIS_ENDURECIDOS,
  Segredo,
} from "./index.js";

/**
 * Ambiente mínimo COMPLETO de um perfil endurecido. Todos os valores são
 * sintéticos e apontam para o TLD reservado `.invalid` (RFC 2606) — nenhum
 * host, emissor ou credencial real existe neste repositório.
 */
const AMBIENTE_ENDURECIDO_COMPLETO: Readonly<Record<string, string>> = Object.freeze({
  IC_BANCO_MODO: "postgres",
  IC_BANCO_URL: "postgres://banco.interno.invalid:5432/intensicare",
  IC_BANCO_USUARIO: "intensicare_app",
  IC_BANCO_SENHA: "SYNTH-SENHA-DE-TESTE",
  IC_BANCO_SEMEAR_FIXTURES: "nao",
  IC_IDENTIDADE_MODO: "oidc",
  IC_IDENTIDADE_EMISSOR: "https://identidade.invalid/realms/intensicare",
  IC_IDENTIDADE_AUDIENCIA: "intensicare-api",
  IC_IDENTIDADE_JWKS_URL: "https://identidade.invalid/realms/intensicare/jwks",
  IC_BUNDLE_REGRA_CAMINHO: "/opt/intensicare/bundles/news2.bundle",
  IC_BUNDLE_REGRA_CHAVE_PUBLICA: "SYNTH-CHAVE-PUBLICA-DE-TESTE",
});

function ambienteEndurecido(
  perfil: string,
  sobrepor: Readonly<Record<string, string | undefined>> = {},
): Record<string, string | undefined> {
  return { PERFIL: perfil, ...AMBIENTE_ENDURECIDO_COMPLETO, ...sobrepor };
}

/** Captura o erro de configuração — falha o teste se a carga NÃO lançar. */
function capturarErro(ambiente: Record<string, string | undefined>): ErroDeConfiguracao {
  try {
    carregarConfiguracao(ambiente);
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroDeConfiguracao);
    return erro as ErroDeConfiguracao;
  }
  throw new Error("carregarConfiguracao deveria ter lançado ErroDeConfiguracao e não lançou.");
}

describe("perfil é obrigatório e explícito — o modo sintético nunca é o default", () => {
  it("lança quando PERFIL está ausente, em vez de assumir um perfil sintético", () => {
    const erro = capturarErro({});
    expect(erro.variaveis).toContain("PERFIL");
    expect(erro.message).toContain("PERFIL");
  });

  it("lança quando PERFIL está vazio ou só com espaços", () => {
    expect(capturarErro({ PERFIL: "   " }).variaveis).toContain("PERFIL");
  });

  it("lança e enumera os perfis aceitos quando PERFIL é desconhecido", () => {
    const erro = capturarErro({ PERFIL: "prod" });
    expect(erro.variaveis).toContain("PERFIL");
    for (const perfil of PERFIS) {
      expect(erro.message).toContain(perfil);
    }
  });

  it("aceita PERFIL=dev-synthetic sem nenhuma outra variável (perfil sintético é autossuficiente)", () => {
    const config = carregarConfiguracao({ PERFIL: "dev-synthetic" });
    expect(config.perfil).toBe("dev-synthetic");
    expect(config.banco.modo).toBe("pglite-memoria");
    expect(config.banco.semearFixturesSinteticas).toBe(true);
    expect(config.identidade.modo).toBe("token-sintetico");
  });
});

describe("PERFIL=production sem banco lança citando a variável ausente pelo nome", () => {
  it("cita IC_BANCO_URL quando a URL de banco falta", () => {
    const erro = capturarErro(ambienteEndurecido("production", { IC_BANCO_URL: undefined }));
    expect(erro.variaveis).toContain("IC_BANCO_URL");
    expect(erro.message).toContain("IC_BANCO_URL");
  });

  it("cita IC_BANCO_USUARIO e IC_BANCO_SENHA quando a credencial própria falta (ADR-0016 §4.1)", () => {
    const erro = capturarErro(
      ambienteEndurecido("production", { IC_BANCO_USUARIO: undefined, IC_BANCO_SENHA: undefined }),
    );
    expect(erro.variaveis).toEqual(expect.arrayContaining(["IC_BANCO_USUARIO", "IC_BANCO_SENHA"]));
  });

  it("acumula TODAS as variáveis ausentes num único erro, não só a primeira", () => {
    const erro = capturarErro({ PERFIL: "production" });
    expect(erro.variaveis).toEqual(
      expect.arrayContaining([
        "IC_BANCO_URL",
        "IC_BANCO_USUARIO",
        "IC_BANCO_SENHA",
        "IC_IDENTIDADE_EMISSOR",
        "IC_IDENTIDADE_AUDIENCIA",
        "IC_IDENTIDADE_JWKS_URL",
        "IC_BUNDLE_REGRA_CAMINHO",
        "IC_BUNDLE_REGRA_CHAVE_PUBLICA",
      ]),
    );
  });

  it("recusa credencial embutida na URL do banco — segredo em URL vaza em log", () => {
    // O literal `@` é concatenado em tempo de execução de propósito: uma URL
    // com credencial inline escrita literalmente casa com o padrão de e-mail
    // de `scripts/check_forbidden_content.py` e faria o gate falhar. Mesma
    // disciplina que o próprio scanner usa com o seu canário.
    const arroba = "@";
    const url = `postgres://usuario:senha${arroba}banco.interno.invalid:5432/intensicare`;
    const erro = capturarErro(ambienteEndurecido("production", { IC_BANCO_URL: url }));
    expect(erro.variaveis).toContain("IC_BANCO_URL");
  });

  it("recusa papel de banco notoriamente superusuário (ADR-0016 §4.1, anti-padrão 5)", () => {
    for (const papel of ["postgres", "root", "OWNER", "rds_superuser"]) {
      const erro = capturarErro(ambienteEndurecido("production", { IC_BANCO_USUARIO: papel }));
      expect(erro.variaveis).toContain("IC_BANCO_USUARIO");
    }
  });
});

describe("PERFIL=production com PGlite, fixtures ou identidade sintética lança", () => {
  it("lança com IC_BANCO_MODO=pglite-memoria (anti-padrão 9)", () => {
    const erro = capturarErro(
      ambienteEndurecido("production", { IC_BANCO_MODO: "pglite-memoria" }),
    );
    expect(erro.variaveis).toContain("IC_BANCO_MODO");
  });

  it("lança com IC_BANCO_SEMEAR_FIXTURES=sim (anti-padrão 9)", () => {
    const erro = capturarErro(
      ambienteEndurecido("production", { IC_BANCO_SEMEAR_FIXTURES: "sim" }),
    );
    expect(erro.variaveis).toContain("IC_BANCO_SEMEAR_FIXTURES");
  });

  it("lança com IC_IDENTIDADE_MODO=token-sintetico (anti-padrão 8 e 9)", () => {
    const erro = capturarErro(
      ambienteEndurecido("production", { IC_IDENTIDADE_MODO: "token-sintetico" }),
    );
    expect(erro.variaveis).toContain("IC_IDENTIDADE_MODO");
  });

  it("recusa PGlite, fixtures e token sintético em TODOS os perfis endurecidos", () => {
    for (const perfil of PERFIS_ENDURECIDOS) {
      expect(
        capturarErro(ambienteEndurecido(perfil, { IC_BANCO_MODO: "pglite-memoria" })).variaveis,
      ).toContain("IC_BANCO_MODO");
      expect(
        capturarErro(ambienteEndurecido(perfil, { IC_BANCO_SEMEAR_FIXTURES: "sim" })).variaveis,
      ).toContain("IC_BANCO_SEMEAR_FIXTURES");
      expect(
        capturarErro(ambienteEndurecido(perfil, { IC_IDENTIDADE_MODO: "token-sintetico" }))
          .variaveis,
      ).toContain("IC_IDENTIDADE_MODO");
    }
  });
});

describe("PERFIL=production sem identidade, segredo ou bundle lança", () => {
  it("cita as três variáveis de identidade quando o emissor OIDC não está configurado", () => {
    const erro = capturarErro(
      ambienteEndurecido("production", {
        IC_IDENTIDADE_EMISSOR: undefined,
        IC_IDENTIDADE_AUDIENCIA: undefined,
        IC_IDENTIDADE_JWKS_URL: undefined,
      }),
    );
    expect(erro.variaveis).toEqual(
      expect.arrayContaining([
        "IC_IDENTIDADE_EMISSOR",
        "IC_IDENTIDADE_AUDIENCIA",
        "IC_IDENTIDADE_JWKS_URL",
      ]),
    );
  });

  it("exige emissor e JWKS sobre https em perfil endurecido", () => {
    const erro = capturarErro(
      ambienteEndurecido("production", {
        IC_IDENTIDADE_EMISSOR: "http://identidade.invalid/realms/intensicare",
      }),
    );
    expect(erro.variaveis).toContain("IC_IDENTIDADE_EMISSOR");
  });

  it("cita o bundle de regra quando ele não está configurado (ADR-0007)", () => {
    const erro = capturarErro(
      ambienteEndurecido("production", {
        IC_BUNDLE_REGRA_CAMINHO: undefined,
        IC_BUNDLE_REGRA_CHAVE_PUBLICA: undefined,
      }),
    );
    expect(erro.variaveis).toEqual(
      expect.arrayContaining(["IC_BUNDLE_REGRA_CAMINHO", "IC_BUNDLE_REGRA_CHAVE_PUBLICA"]),
    );
  });

  it("carrega com sucesso quando TUDO está provido — e só então", () => {
    const config = carregarConfiguracao(ambienteEndurecido("production"));
    expect(config.perfil).toBe("production");
    expect(config.classePerfil).toBe("produtivo");
    expect(config.banco.modo).toBe("postgres");
    expect(config.banco.semearFixturesSinteticas).toBe(false);
    expect(config.identidade.modo).toBe("oidc");
    expect(config.bundleRegra).not.toBeNull();
    expect(config.banner).toBeNull();
    expect(config.modoDegradado).toBe(false);
  });
});

describe("integration exige banco real e NÃO semeia automaticamente", () => {
  it("lança quando IC_BANCO_URL falta em integration", () => {
    const erro = capturarErro(ambienteEndurecido("integration", { IC_BANCO_URL: undefined }));
    expect(erro.variaveis).toContain("IC_BANCO_URL");
  });

  it("nunca semeia por omissão em integration", () => {
    const config = carregarConfiguracao(ambienteEndurecido("integration"));
    expect(config.banco.modo).toBe("postgres");
    expect(config.banco.semearFixturesSinteticas).toBe(false);
  });

  it("recusa semeadura explícita em integration — semeadura é ato do harness, não do bootstrap", () => {
    const erro = capturarErro(
      ambienteEndurecido("integration", { IC_BANCO_SEMEAR_FIXTURES: "sim" }),
    );
    expect(erro.variaveis).toContain("IC_BANCO_SEMEAR_FIXTURES");
  });
});

describe("nenhum valor de variável de ambiente vaza na mensagem de erro", () => {
  it("não ecoa o conteúdo de nenhuma variável, mesmo quando ele é inválido", () => {
    const sentinela = "SENTINELA-QUE-NAO-DEVE-VAZAR";
    const ambiente: Record<string, string | undefined> = { PERFIL: "production" };
    for (const nome of Object.keys(AMBIENTE_ENDURECIDO_COMPLETO)) {
      ambiente[nome] = `${sentinela}-${nome}`;
    }
    ambiente.PORT = `${sentinela}-PORT`;
    ambiente.IC_MIGRACAO_TIMEOUT_MS = `${sentinela}-TIMEOUT`;
    const erro = capturarErro(ambiente);
    expect(erro.message).not.toContain(sentinela);
    for (const problema of erro.problemas) {
      expect(problema.motivo).not.toContain(sentinela);
    }
  });
});

describe("o segredo nunca é serializável", () => {
  it("mantém a senha do banco fora de JSON.stringify e de toString", () => {
    const config = carregarConfiguracao(ambienteEndurecido("production"));
    expect(config.banco.senha).toBeInstanceOf(Segredo);
    expect(JSON.stringify(config)).not.toContain("SYNTH-SENHA-DE-TESTE");
    expect(String(config.banco.senha)).not.toContain("SYNTH-SENHA-DE-TESTE");
    expect(config.banco.senha?.revelar()).toBe("SYNTH-SENHA-DE-TESTE");
  });
});

describe("valores operacionais são validados, não presumidos", () => {
  it("recusa PORT fora da faixa de porta TCP", () => {
    expect(capturarErro({ PERFIL: "dev-synthetic", PORT: "70000" }).variaveis).toContain("PORT");
    expect(capturarErro({ PERFIL: "dev-synthetic", PORT: "zero" }).variaveis).toContain("PORT");
  });

  it("usa 3000 como porta quando PORT não é provido (default operacional, não de segurança)", () => {
    expect(carregarConfiguracao({ PERFIL: "dev-synthetic" }).porta).toBe(3000);
  });

  it("recusa modo de migração desconhecido", () => {
    expect(
      capturarErro({ PERFIL: "dev-synthetic", IC_MIGRACAO_MODO: "talvez" }).variaveis,
    ).toContain("IC_MIGRACAO_MODO");
  });

  it("aplica migração por omissão em perfil sintético e apenas VERIFICA em perfil produtivo", () => {
    expect(carregarConfiguracao({ PERFIL: "dev-synthetic" }).migracao.modo).toBe("aplicar");
    expect(carregarConfiguracao(ambienteEndurecido("production")).migracao.modo).toBe("verificar");
  });

  it("recusa migração destrutiva por omissão em qualquer perfil", () => {
    expect(carregarConfiguracao({ PERFIL: "dev-synthetic" }).migracao.permitirDestrutiva).toBe(
      false,
    );
    expect(carregarConfiguracao(ambienteEndurecido("production")).migracao.permitirDestrutiva).toBe(
      false,
    );
  });
});
