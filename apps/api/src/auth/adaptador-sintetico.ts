/**
 * apps/api/src/auth/adaptador-sintetico.ts — adaptador de identidade
 * SINTÉTICA, exclusivo de `dev`/`test`.
 *
 * O que este adaptador NÃO é: um caminho alternativo. Ele é um EMISSOR local
 * (ADR-0015 §4.1: "na fatia G7 a autenticação é um emissor local sintético
 * (`dev-issuer`) que produz exatamente o mesmo conjunto de claims obrigatórias
 * do verificador de produção"). Os tokens que ele emite são JWS assinados de
 * verdade, com par de chaves gerado em runtime, e passam pelo MESMO
 * `criarVerificadorDeToken` que o adaptador OIDC usa — assinatura, `iss`,
 * `aud`, `exp`, `nbf`, `kid`, tudo.
 *
 * Diferença em relação ao stub anterior (`SYNTH-TOKEN.<tenant>.<ator>`): lá o
 * tenant era LIDO DO TEXTO do token e qualquer chamador podia escrever
 * qualquer tenant. Aqui, forjar um tenant exige a chave privada do emissor,
 * que só existe na memória deste processo.
 *
 * CONTENÇÃO: `criarAdaptadorSintetico` LANÇA fora de `dev`/`test`
 * (ADR-0015 §4.1, §8 V5; SEC-0017).
 */

import {
  type ConfiguracaoAutenticacao,
  type PerfilExecucao,
  perfilDoAmbiente,
  VALIDADE_SINTETICA_PADRAO_SEGUNDOS,
} from "./configuracao.js";
import { criarFonteDeChavesEmMemoria } from "./jwks.js";
import {
  concluirAutenticacao,
  extrairBearer,
  type PortaDeAutenticacao,
  type RequisicaoAutenticavel,
  recusar,
} from "./porta.js";
import {
  criarEmissorDeTeste,
  type EmissorDeTeste,
  exigirPerfilDeDesenvolvimento,
} from "./servidor-oidc-de-teste.js";
import type { ResultadoAutenticacao } from "./tipos.js";
import { criarVerificadorDeToken } from "./verificador.js";

/**
 * Emissor compartilhado do processo, junto do perfil que AUTORIZOU sua
 * criação.
 *
 * Único porque, se cada chamada gerasse um par novo, um token emitido por
 * `gerarTokenSintetico` não seria verificável pela porta e o teste "passaria"
 * por acidente de fixture em vez de por verificação criptográfica.
 *
 * Guarda o `perfil` porque a autorização para emitir é estabelecida UMA VEZ,
 * na construção, e daí em diante é CARREGADA — jamais re-derivada de estado de
 * ambiente. Ver `emitirTokenSintetico` para o defeito concreto que a releitura
 * por requisição causava.
 */
let compartilhado:
  | { readonly emissor: EmissorDeTeste; readonly perfil: PerfilExecucao }
  | undefined;

/**
 * Devolve o emissor do processo, criando-o na primeira chamada.
 *
 * `perfil` explícito (vindo da configuração tipada) é sempre validado. Quando
 * ele não é fornecido E já existe emissor criado sob perfil validado, o
 * emissor é reusado sem consultar o ambiente: o ambiente já não é fonte de
 * autoridade depois que a construção ocorreu. Só a PRIMEIRA criação, sem
 * perfil explícito, recorre a `perfilDoAmbiente()` — e essa é a única
 * situação em que a ausência de perfil reconhecível recusa.
 */
export function emissorSinteticoCompartilhado(perfil?: PerfilExecucao): EmissorDeTeste {
  if (perfil !== undefined) {
    exigirPerfilDeDesenvolvimento(perfil, "emissor sintético compartilhado");
  }
  const jaExiste = compartilhado;
  if (jaExiste !== undefined) return jaExiste.emissor;

  const resolvido = exigirPerfilDeDesenvolvimento(
    perfil ?? perfilDoAmbiente(),
    "emissor sintético compartilhado",
  );
  compartilhado = { emissor: criarEmissorDeTeste({ perfil: resolvido }), perfil: resolvido };
  return compartilhado.emissor;
}

/**
 * Perfil sob o qual o emissor do processo foi autorizado, ou `undefined` se
 * nenhum emissor foi criado. `undefined` significa que NADA estabeleceu
 * autorização de emissão neste processo — o estado de um processo endurecido.
 */
export function perfilDoEmissorSintetico(): PerfilExecucao | undefined {
  return compartilhado?.perfil;
}

/** Descarta o emissor do processo — usado por teste de rotação de chave. */
export function reiniciarEmissorSintetico(): void {
  compartilhado = undefined;
}

export function criarAdaptadorSintetico(config: ConfiguracaoAutenticacao): PortaDeAutenticacao {
  // Perfil resolvido e validado UMA VEZ, aqui. Ele é capturado no fechamento e
  // acompanha cada emissão — a porta nunca reconsulta o ambiente por
  // requisição, porque o ambiente não é a autoridade e, no processo real, nem
  // sequer usa o mesmo vocabulário (`PERFIL=dev-synthetic`).
  const perfilResolvido = exigirPerfilDeDesenvolvimento(
    config.perfil,
    "adaptador sintético de autenticação",
  );
  const emissor = emissorSinteticoCompartilhado(perfilResolvido);
  const validade = config.sintetico?.validadeSegundos ?? VALIDADE_SINTETICA_PADRAO_SEGUNDOS;

  const verificador = criarVerificadorDeToken({
    emissor: emissor.emissor,
    audiencia: emissor.audiencia,
    fonteDeChaves: criarFonteDeChavesEmMemoria(() => emissor.jwks()),
    ...(config.tenantsPermitidos === undefined
      ? {}
      : { tenantsPermitidos: config.tenantsPermitidos }),
    ...(config.toleranciaDeRelogioSegundos === undefined
      ? {}
      : { toleranciaDeRelogioSegundos: config.toleranciaDeRelogioSegundos }),
  });

  const verificar = verificador.verificarSincrono;
  if (verificar === undefined) {
    // Impossível por construção (JWKS em memória expõe caminho síncrono);
    // se algum dia deixar de ser, é falha de programação, não de entrada.
    throw new Error("Adaptador sintético exige fonte de chaves síncrona.");
  }

  const autenticarSincrono = (request: RequisicaoAutenticavel): ResultadoAutenticacao => {
    const bearer = extrairBearer(request);
    if (!bearer.ok) return recusar(request, bearer.codigo);
    return concluirAutenticacao(request, verificar(bearer.token));
  };

  return {
    nome: "sintetico",
    autenticar: async (request) => autenticarSincrono(request),
    autenticarSincrono,
    emitirToken: (tenantId, atorId, sobrescritas = {}) =>
      emitirTokenSintetico(tenantId, atorId, {
        validadeSegundos: validade,
        ...sobrescritas,
        // Depois do spread, de propósito: o perfil de construção é
        // autoritativo e não pode ser sobrescrito por quem chama a emissão.
        perfilDeConstrucao: perfilResolvido,
      }),
  };
}

export interface OpcoesDeEmissaoSintetica {
  readonly validadeSegundos?: number;
  /**
   * Perfil já resolvido e validado na CONSTRUÇÃO do adaptador. Presente ⇒ a
   * emissão não consulta o ambiente. É o campo que fecha a assimetria entre
   * construção e emissão descrita em `emitirTokenSintetico`.
   */
  readonly perfilDeConstrucao?: PerfilExecucao;
  readonly [claim: string]: unknown;
}

/**
 * Emite um token sintético ASSINADO para `tenantId`/`atorId`.
 *
 * O escopo emitido afirma o mesmo tenant da claim (`tenant:<id>`), de modo que
 * o verificador possa detectar remontagem: um token com claim e escopo
 * divergentes é recusado com 403 (ADR-0016 §4.1).
 *
 * DEFEITO CORRIGIDO (`POST /v1/dev/sessao` respondia HTTP 500). Esta função
 * chamava `emissorSinteticoCompartilhado()` **sem argumento**, caindo na
 * derivação por ambiente a CADA requisição. Como `perfilDoAmbiente()` conhece
 * apenas `INTENSICARE_PERFIL`/`NODE_ENV` e o runtime real exige `PERFIL`
 * (ACH-03, sem default), o perfil resolvia `undefined`, a guarda de contenção
 * lançava, o `throw` subia pela chamada síncrona em `routes.ts` até o
 * `setErrorHandler` e virava o envelope genérico "Erro interno inesperado".
 *
 * A raiz não era a variável faltante — era a assimetria: na construção o
 * perfil vem explícito da configuração e passa; na emissão ele era relido de
 * estado de ambiente mutável, com outro vocabulário. A correção carrega o
 * perfil da construção (`perfilDeConstrucao`) em vez de re-derivá-lo.
 * Ensinar `perfilDoAmbiente()` a ler `PERFIL` teria calado o sintoma e
 * preservado a raiz.
 */
export function emitirTokenSintetico(
  tenantId: string,
  atorId: string,
  opcoes: OpcoesDeEmissaoSintetica = {},
): string {
  const { validadeSegundos, perfilDeConstrucao, ...sobrescritas } = opcoes;
  const emissor = emissorSinteticoCompartilhado(perfilDeConstrucao);
  const agora = Math.floor(Date.now() / 1000);
  const validade = validadeSegundos ?? VALIDADE_SINTETICA_PADRAO_SEGUNDOS;
  return emissor.emitir({
    sub: atorId,
    tenant: tenantId,
    scope: `clinico:leitura clinico:acao tenant:${tenantId}`,
    papeis: ["atuante-clinico"],
    iat: agora,
    nbf: agora,
    exp: agora + validade,
    ...sobrescritas,
  });
}
