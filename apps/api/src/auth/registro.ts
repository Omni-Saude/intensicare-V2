/**
 * apps/api/src/auth/registro.ts — instalação da porta no ciclo de vida HTTP.
 *
 * DESENHO (o porquê da forma escolhida)
 * -------------------------------------
 * A verificação real é assíncrona (busca de JWKS, rotação de chave). As rotas
 * da fatia, porém, consomem `autenticar(request)` de forma SÍNCRONA. Em vez de
 * espalhar `await` por cinco pontos de chamada — e correr o risco de um deles
 * ficar para trás e virar rota sem autenticação —, a verificação acontece uma
 * única vez, no hook `onRequest`, e o resultado fica preso à requisição.
 *
 * Consequências desejadas:
 *   - existe UM ponto de verificação por requisição, não cinco;
 *   - `autenticar()` não pode ser "esquecido de await";
 *   - o hook NÃO responde nada: ele só computa. Rotas públicas (`/health`,
 *     `/v1/healthz`) continuam públicas porque simplesmente não consultam o
 *     resultado — e nenhuma rota nova fica autenticada por acidente;
 *   - com a porta OIDC instalada, o resultado do hook é o ÚNICO que
 *     `autenticar()` enxerga; não há como o caminho sintético entrar.
 */

import type { FastifyInstance, FastifyRequest } from "fastify";
import { perfilDoAmbiente, perfilPermiteSintetico } from "./configuracao.js";
import { criarPortaDeAutenticacao } from "./fabrica.js";
import { type PortaDeAutenticacao, type RequisicaoAutenticavel, recusar } from "./porta.js";
import type { ResultadoAutenticacao } from "./tipos.js";

const CHAVE_RESULTADO = Symbol("intensicare.autenticacao.resultado");

type RequisicaoComResultado = {
  [CHAVE_RESULTADO]?: ResultadoAutenticacao;
};

let portaDoProcesso: PortaDeAutenticacao | undefined;
let portaPadraoDeDesenvolvimento: PortaDeAutenticacao | undefined;

export function instalarPorta(porta: PortaDeAutenticacao | undefined): void {
  portaDoProcesso = porta;
}

export function portaInstalada(): PortaDeAutenticacao | undefined {
  return portaDoProcesso;
}

/**
 * Porta usada quando NENHUMA foi instalada — e somente sob perfil `dev`/`test`.
 *
 * Isto NÃO é fallback de provedor indisponível (o que o ADR-0015 §4 D1 e o
 * anti-padrão §10.8 proíbem): quando uma porta está instalada, ela tem
 * precedência absoluta e este caminho é inalcançável, inclusive — e
 * principalmente — quando o IdP está fora do ar. É apenas o adaptador padrão
 * de desenvolvimento, e em `homologacao`/`producao` devolve `undefined`, o que
 * resulta em 401.
 */
export function portaPadraoDeDesenvolvimentoSeHouver(): PortaDeAutenticacao | undefined {
  if (portaPadraoDeDesenvolvimento !== undefined) return portaPadraoDeDesenvolvimento;
  const perfil = perfilDoAmbiente();
  if (!perfilPermiteSintetico(perfil) || perfil === undefined) return undefined;
  portaPadraoDeDesenvolvimento = criarPortaDeAutenticacao({
    perfil,
    adaptador: "sintetico",
  });
  return portaPadraoDeDesenvolvimento;
}

/** Descarta o estado global — usado por testes que trocam de perfil. */
export function reiniciarRegistroDeAutenticacao(): void {
  portaDoProcesso = undefined;
  portaPadraoDeDesenvolvimento = undefined;
}

export function lerResultadoDaRequisicao(
  request: RequisicaoAutenticavel,
): ResultadoAutenticacao | undefined {
  return (request as RequisicaoAutenticavel & RequisicaoComResultado)[CHAVE_RESULTADO];
}

/**
 * Registra a porta no servidor. Chamar ANTES de registrar as rotas.
 *
 * O hook nunca lança: uma exceção aqui viraria 500 e, pior, poderia deixar a
 * requisição sem resultado anexado. Erro inesperado vira recusa.
 */
export function registrarAutenticacao(app: FastifyInstance, porta: PortaDeAutenticacao): void {
  instalarPorta(porta);
  app.addHook("onRequest", async (request: FastifyRequest) => {
    const requisicao = request as unknown as RequisicaoAutenticavel & RequisicaoComResultado;
    let resultado: ResultadoAutenticacao;
    try {
      resultado = await porta.autenticar(requisicao);
    } catch {
      resultado = recusar(requisicao, "erro-inesperado-na-verificacao");
    }
    requisicao[CHAVE_RESULTADO] = resultado;
  });
}
