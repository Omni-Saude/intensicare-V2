/**
 * Coerência entre o perfil de RUNTIME e o perfil de AUTENTICAÇÃO.
 *
 * Regressão de um achado P1 de revisão adversarial (2026-08-17): a raiz de
 * composição fazia `options.autenticacao ?? configuracaoDeAutenticacaoDoPerfil(config)`.
 * A derivação era fail-closed, mas a INJEÇÃO a contornava inteiramente e nada
 * comparava o perfil injetado com `config.perfil` — um processo em runtime
 * `production` subia com emissor sintético ativo, sem lançar.
 *
 * Estes testes falham contra a árvore anterior ao achado por um motivo trivial:
 * `exigirCoerenciaDePerfil` não existia.
 */
import { describe, expect, it } from "vitest";
import type { ConfiguracaoAutenticacao } from "../auth.js";
import type { ConfiguracaoRuntime } from "../config/index.js";
import { PERFIS_ENDURECIDOS, PERFIS_SINTETICOS } from "../config/perfis.js";
import { ErroDePerfisIncoerentes, exigirCoerenciaDePerfil } from "./autenticacao.js";

/**
 * `exigirCoerenciaDePerfil` lê exclusivamente `config.perfil`. O recorte é
 * deliberado: montar uma `ConfiguracaoRuntime` produtiva completa exigiria
 * segredo, banco e identidade, e o invariante sob teste não depende de nenhum
 * deles. Um teste que precisasse do resto mediria a fábrica, não a guarda.
 */
function runtimeCom(perfil: ConfiguracaoRuntime["perfil"]): ConfiguracaoRuntime {
  return { perfil } as unknown as ConfiguracaoRuntime;
}

const OIDC_LEGITIMO: ConfiguracaoAutenticacao = {
  perfil: "producao",
  adaptador: "oidc",
  oidc: {
    emissor: "https://idp.exemplo.invalid/",
    audiencia: "intensicare-api",
    jwksUri: "https://idp.exemplo.invalid/.well-known/jwks.json",
  },
};

describe("exigirCoerenciaDePerfil", () => {
  it("recusa adaptador sintético INJETADO em todo perfil endurecido", () => {
    // O vetor exato do achado: a injeção contornava a derivação fail-closed.
    const injetada: ConfiguracaoAutenticacao = { perfil: "dev", adaptador: "sintetico" };

    for (const perfil of PERFIS_ENDURECIDOS) {
      expect(() => exigirCoerenciaDePerfil(runtimeCom(perfil), injetada)).toThrow(
        ErroDePerfisIncoerentes,
      );
    }
    // O laço precisa ter exercitado alguma coisa: uma lista vazia passaria vácua.
    expect(PERFIS_ENDURECIDOS.length).toBeGreaterThan(0);
  });

  it("recusa bloco `sintetico` mesmo com adaptador declarado `oidc`", () => {
    // Verificar só o adaptador deixaria este caso passar — e ele habilita o
    // emissor local por outro caminho.
    const disfarcada = {
      ...OIDC_LEGITIMO,
      sintetico: { emissor: "urn:intensicare:sintetico", validadeSegundos: 3600 },
    } as ConfiguracaoAutenticacao;

    expect(() => exigirCoerenciaDePerfil(runtimeCom("production"), disfarcada)).toThrow(
      ErroDePerfisIncoerentes,
    );
  });

  it("recusa perfil de autenticação que admite sintético, ainda que o adaptador seja oidc", () => {
    const perfilPermissivo = { ...OIDC_LEGITIMO, perfil: "dev" } as ConfiguracaoAutenticacao;

    expect(() => exigirCoerenciaDePerfil(runtimeCom("staging"), perfilPermissivo)).toThrow(
      ErroDePerfisIncoerentes,
    );
  });

  it("aceita OIDC legítimo em perfil endurecido", () => {
    // A guarda precisa recusar o inseguro SEM impedir o caminho correto —
    // senão perfil endurecido ficaria impossível de operar, e a "correção"
    // seria um bloqueio disfarçado.
    for (const perfil of PERFIS_ENDURECIDOS) {
      expect(() => exigirCoerenciaDePerfil(runtimeCom(perfil), OIDC_LEGITIMO)).not.toThrow();
    }
  });

  it("não interfere em perfil sintético — é lá que o adaptador sintético é legítimo", () => {
    const sintetica: ConfiguracaoAutenticacao = { perfil: "test", adaptador: "sintetico" };

    for (const perfil of PERFIS_SINTETICOS) {
      expect(() => exigirCoerenciaDePerfil(runtimeCom(perfil), sintetica)).not.toThrow();
    }
    expect(PERFIS_SINTETICOS.length).toBeGreaterThan(0);
  });

  it("a mensagem nomeia os dois perfis e o adaptador, sem vazar segredo", () => {
    const injetada: ConfiguracaoAutenticacao = { perfil: "dev", adaptador: "sintetico" };
    let mensagem = "";
    try {
      exigirCoerenciaDePerfil(runtimeCom("production"), injetada);
    } catch (erro) {
      mensagem = (erro as Error).message;
    }

    // Quem opera precisa saber QUAL par é incoerente para corrigir a fiação.
    expect(mensagem).toContain("production");
    expect(mensagem).toContain("dev");
    expect(mensagem).toContain("sintetico");
  });
});
