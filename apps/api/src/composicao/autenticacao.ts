/**
 * apps/api/src/composicao/autenticacao.ts — tradução do PERFIL DE RUNTIME
 * (`apps/api/src/config/perfis.ts`) para a configuração que a porta de
 * autenticação exige (`apps/api/src/auth/configuracao.ts`).
 *
 * Os dois vocabulários de perfil são distintos e nenhum ADR os reconcilia:
 * `config/` fala em `test | dev-synthetic | integration | staging | pilot |
 * production`; `auth/` fala em `dev | test | homologacao | producao`. A
 * reconciliação é decisão do titular (ver o cabeçalho de `config/perfis.ts`,
 * que registra a divergência). Este módulo NÃO a decide: ele traduz apenas os
 * dois perfis sintéticos, que são os únicos em que a fábrica de autenticação
 * pode produzir alguma coisa sem material externo, e RECUSA o resto.
 *
 * POR QUE PERFIL ENDURECIDO LANÇA EM VEZ DE MONTAR OIDC A PARTIR DA CONFIG.
 * `config/` já exige `IC_IDENTIDADE_EMISSOR`, `IC_IDENTIDADE_AUDIENCIA` e
 * `IC_IDENTIDADE_JWKS_URL` em perfil endurecido, e seria tecnicamente possível
 * montar `ConfiguracaoOidc` daqui. Não é feito porque nenhum IdP foi
 * selecionado (ADR-0015 §1; `threat-model.md` §2.2, fronteira TB-06 não
 * decidida) e o adaptador OIDC só foi verificado contra um servidor de teste
 * local. Deixar o processo subir sozinho contra um emissor arbitrário
 * transformaria uma decisão pendente do titular em comportamento herdado —
 * exatamente o que ADR-0019 §5.2 P4 proíbe. A porta continua INJETÁVEL: quem
 * decidir o IdP passa `options.autenticacao` e o caminho existe inteiro.
 *
 * Rastreio: ADR-0015 §4/§4.1 (Opção A, contenção de identidade sintética),
 * ADR-0019 §5.2 P4, anti-padrão 8 (sem fallback de OIDC para token local).
 */

import {
  type ConfiguracaoAutenticacao,
  type PerfilExecucao,
  perfilPermiteSintetico,
} from "../auth.js";
import type { ConfiguracaoRuntime } from "../config/index.js";
import { PERFIS_ENDURECIDOS, type Perfil } from "../config/perfis.js";

/**
 * Tradução PARCIAL e deliberada: só os perfis sintéticos têm equivalente. Os
 * demais devolvem `undefined`, que o resto do módulo lê como "não é
 * desenvolvimento" — nunca como "deve ser desenvolvimento".
 */
const PERFIL_DE_AUTENTICACAO: Readonly<Partial<Record<Perfil, PerfilExecucao>>> = {
  test: "test",
  "dev-synthetic": "dev",
};

/** `undefined` em perfil endurecido — ver o cabeçalho deste arquivo. */
export function perfilDeAutenticacaoDe(config: ConfiguracaoRuntime): PerfilExecucao | undefined {
  return PERFIL_DE_AUTENTICACAO[config.perfil];
}

export class ErroDePortaDeAutenticacaoAusente extends Error {
  constructor(perfil: string) {
    super(
      `Nenhuma porta de autenticação foi injetada e o perfil "${perfil}" não admite ` +
        "adaptador padrão. Em perfil endurecido a identidade é decisão do titular " +
        "(nenhum IdP foi selecionado — ADR-0015 §1) e o processo FALHA AO INICIAR em " +
        "vez de subir com identidade improvisada. Passe `options.autenticacao` com a " +
        "configuração do provedor decidido.",
    );
    this.name = "ErroDePortaDeAutenticacaoAusente";
  }
}

/**
 * Configuração da porta de autenticação derivada do perfil de runtime.
 * LANÇA em perfil endurecido — não devolve porta degradada, não desabilita
 * rotas, não registra aviso e segue (ADR-0015 §8 V5).
 */
export function configuracaoDeAutenticacaoDoPerfil(
  config: ConfiguracaoRuntime,
): ConfiguracaoAutenticacao {
  const perfil = perfilDeAutenticacaoDe(config);
  if (perfil === undefined) {
    throw new ErroDePortaDeAutenticacaoAusente(config.perfil);
  }

  if (config.identidade.modo === "oidc") {
    const { emissor, audiencia, jwksUrl } = config.identidade;
    if (emissor === null || audiencia === null || jwksUrl === null) {
      // Inalcançável com configuração validada; a guarda existe para que um
      // caminho futuro falhe aqui e não numa verificação de token.
      throw new Error(
        'identidade em modo "oidc" sem emissor, audiência ou JWKS — configuração ' +
          "incompleta recusa o boot em vez de degradar para identidade local " +
          "(anti-padrão 8).",
      );
    }
    return { perfil, adaptador: "oidc", oidc: { emissor, audiencia, jwksUri: jwksUrl } };
  }

  return { perfil, adaptador: "sintetico" };
}

export class ErroDePerfisIncoerentes extends Error {
  constructor(perfilRuntime: Perfil, perfilAutenticacao: PerfilExecucao, adaptador: string) {
    super(
      `Perfil de runtime "${perfilRuntime}" é endurecido, mas a configuração de ` +
        `autenticação recebida admite identidade sintética (perfil de autenticação ` +
        `"${perfilAutenticacao}", adaptador "${adaptador}"). O processo FALHA AO ` +
        "INICIAR: um emissor sintético num perfil endurecido cunha identidade sem " +
        "provedor, e nenhum caminho de injeção pode contornar essa recusa " +
        "(ADR-0015 §4.1; anti-padrão 9 e 11).",
    );
    this.name = "ErroDePerfisIncoerentes";
  }
}

/**
 * Coerência entre os DOIS vocabulários de perfil, imposta sobre qualquer
 * configuração de autenticação — derivada **ou injetada**.
 *
 * ACHADO DE REVISÃO ADVERSARIAL (2026-08-17, P1). `configuracaoDeAutenticacaoDoPerfil`
 * é fail-closed, mas a raiz de composição fazia
 * `options.autenticacao ?? configuracaoDeAutenticacaoDoPerfil(config)`: a injeção
 * **contornava inteiramente** a derivação, e nada comparava o perfil injetado com
 * `config.perfil`. Um processo em runtime `production` com
 * `options.autenticacao = {perfil:"dev", adaptador:"sintetico"}` subia com o emissor
 * sintético ativo, sem lançar. O `??` não era o defeito — o defeito era não haver
 * invariante sobre o resultado, viesse ele de onde viesse.
 *
 * Esta função é o invariante: ela roda depois da escolha, sobre o valor final.
 *
 * Atenuação que já existia e permanece: `POST /v1/dev/sessao` é barrada pelo perfil
 * de RUNTIME, então não havia endpoint cunhando token, e a chave do emissor
 * sintético é por processo. A porta ficava aberta, mas ninguém a atravessava por
 * uma superfície HTTP — razão de o achado ser P1 e não P0.
 */
export function exigirCoerenciaDePerfil(
  config: ConfiguracaoRuntime,
  autenticacao: ConfiguracaoAutenticacao,
): void {
  if (!PERFIS_ENDURECIDOS.includes(config.perfil)) return;

  // Três formas independentes de admitir identidade sintética. Verificar
  // apenas o adaptador deixaria passar `{adaptador:"oidc", sintetico:{...}}`.
  const admiteSintetico =
    autenticacao.adaptador === "sintetico" ||
    autenticacao.sintetico !== undefined ||
    perfilPermiteSintetico(autenticacao.perfil);

  if (admiteSintetico) {
    throw new ErroDePerfisIncoerentes(config.perfil, autenticacao.perfil, autenticacao.adaptador);
  }
}
