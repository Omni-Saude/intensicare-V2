/**
 * apps/api/src/auth/adaptador-oidc.ts — adaptador de identidade OIDC.
 *
 * Este adaptador NÃO seleciona fornecedor (prompt §3 regra 14; ADR-0015 §4
 * "Não vincula: seleção de IdP"). Ele consome três valores de configuração —
 * emissor, audiência e URI do JWKS — e verifica tokens contra as chaves
 * publicadas nessa URI. Qualquer IdP compatível com OIDC serve; nenhum é
 * escolhido aqui.
 *
 * ESTADO: verificável contra o servidor OIDC local de teste
 * (`servidor-oidc-de-teste.ts`). Contra um IdP real: **BLOQUEADO** — nenhum
 * provedor foi contratado, nenhum metadado real existe, e a compatibilidade
 * com o IdP futuro só é demonstrável quando ele existir (ADR-0015 §3 Opção A,
 * "Negativas"). Nada aqui é alegação de autenticação de produção operante.
 *
 * Ausência deliberada de caminho alternativo (ADR-0015 §4 D1; HAZ-0014): não
 * há verificação local de contingência, não há chave embutida, não há "modo
 * degradado de auth". Se o JWKS não responde, a resposta é 401.
 */

import type { ConfiguracaoAutenticacao, ConfiguracaoOidc } from "./configuracao.js";
import { criarFonteJwksRemota, type FonteJwksRemota } from "./jwks.js";
import { concluirAutenticacao, extrairBearer, type PortaDeAutenticacao, recusar } from "./porta.js";
import { criarVerificadorDeToken } from "./verificador.js";

export interface PortaOidc extends PortaDeAutenticacao {
  readonly nome: "oidc";
  /** Contagem de buscas ao JWKS — evidência de cache e de limite de re-busca. */
  estatisticasDaFonteDeChaves(): { readonly buscas: number; readonly falhas: number };
}

function exigirConfiguracaoOidc(config: ConfiguracaoAutenticacao): ConfiguracaoOidc {
  const oidc = config.oidc;
  if (oidc === undefined) {
    throw new Error(
      "Configuração de autenticação inválida: adaptador `oidc` exige o bloco `oidc` (emissor, audiencia, jwksUri). Sem ele o servidor NÃO inicia — não existe modo degradado de autenticação (ADR-0015 §4 D1).",
    );
  }
  for (const [campo, valor] of [
    ["emissor", oidc.emissor],
    ["audiencia", oidc.audiencia],
    ["jwksUri", oidc.jwksUri],
  ] as const) {
    if (typeof valor !== "string" || valor.trim().length === 0) {
      throw new Error(
        `Configuração de autenticação inválida: \`oidc.${campo}\` é obrigatório e não pode ser vazio.`,
      );
    }
  }
  return oidc;
}

export function criarAdaptadorOidc(
  config: ConfiguracaoAutenticacao,
  buscarHttp: typeof fetch = fetch,
): PortaOidc {
  const oidc = exigirConfiguracaoOidc(config);
  // `validarJwksUri` (dentro da fábrica) LANÇA para URI sem TLS fora de
  // loopback/dev: um JWKS em texto claro permite troca de chave em trânsito,
  // que é o mesmo que não verificar assinatura.
  const fonteDeChaves: FonteJwksRemota = criarFonteJwksRemota(oidc, config.perfil, buscarHttp);

  const verificador = criarVerificadorDeToken({
    emissor: oidc.emissor,
    audiencia: oidc.audiencia,
    fonteDeChaves,
    ...(oidc.algoritmosAceitos === undefined ? {} : { algoritmosAceitos: oidc.algoritmosAceitos }),
    ...(config.tenantsPermitidos === undefined
      ? {}
      : { tenantsPermitidos: config.tenantsPermitidos }),
    ...(config.toleranciaDeRelogioSegundos === undefined
      ? {}
      : { toleranciaDeRelogioSegundos: config.toleranciaDeRelogioSegundos }),
  });

  return {
    nome: "oidc",
    estatisticasDaFonteDeChaves: () => fonteDeChaves.estatisticas(),
    // NOTA: `autenticarSincrono` NÃO é exposto. É o que garante que nenhum
    // caminho síncrono do processo consiga autenticar quando o adaptador real
    // está instalado — em vez de "cair" para o sintético, o chamador síncrono
    // recebe `porta-nao-instalada` e a requisição termina em 401.
    autenticar: async (request) => {
      const bearer = extrairBearer(request);
      if (!bearer.ok) return recusar(request, bearer.codigo);
      return concluirAutenticacao(request, await verificador.verificar(bearer.token));
    },
  };
}
