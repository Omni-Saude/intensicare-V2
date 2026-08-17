/**
 * apps/api/src/auth/porta.ts — a PORTA de autenticação.
 *
 * O resto da aplicação depende só desta interface (ADR-0015 §4, Opção A: "o
 * provedor concreto é uma porta injetável e não é selecionado aqui"). Trocar
 * de IdP é trocar um adaptador; o domínio nunca vê um token.
 *
 * A fábrica `criarPortaDeAutenticacao` é FAIL-CLOSED por construção:
 *   - adaptador sintético fora de `dev`/`test` ⇒ LANÇA (não inicia degradado);
 *   - adaptador OIDC sem configuração completa ⇒ LANÇA;
 *   - `jwksUri` sem TLS fora de loopback/dev ⇒ LANÇA.
 * Não existe caminho em que a ausência de configuração resulte em aceitar
 * alguma coisa (HAZ-0014).
 */

import { instanciaSegura } from "../problema.js";
import {
  type CodigoFalhaAutenticacao,
  falha,
  type ResultadoAutenticacao,
  type ResultadoVerificacao,
  resultadoDeFalha,
} from "./tipos.js";

/**
 * Forma mínima da requisição que a porta consome. Deliberadamente estrutural
 * (não `FastifyRequest`): o que a porta lê é o cabeçalho `Authorization` e o
 * identificador da OCORRÊNCIA — nada mais. Em particular NÃO lê `request.url`,
 * `request.query` nem `request.body`, porque tenant vindo de qualquer um deles
 * é o anti-padrão §10.3 do prompt.
 */
export interface RequisicaoAutenticavel {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly id: string;
}

export interface PortaDeAutenticacao {
  readonly nome: "oidc" | "sintetico";
  autenticar(request: RequisicaoAutenticavel): Promise<ResultadoAutenticacao>;
  /**
   * Caminho síncrono — existe SOMENTE no adaptador sintético, cujo JWKS está
   * em memória. O adaptador OIDC não o expõe, e é por isso que nenhum caminho
   * síncrono do código consegue autenticar contra um IdP real "por engano".
   */
  readonly autenticarSincrono?: (request: RequisicaoAutenticavel) => ResultadoAutenticacao;
  /** Emissão de token — só no adaptador sintético. */
  readonly emitirToken?: (
    tenantId: string,
    atorId: string,
    sobrescritas?: Readonly<Record<string, unknown>>,
  ) => string;
}

export type ExtracaoDeBearer =
  | { readonly ok: true; readonly token: string }
  | { readonly ok: false; readonly codigo: CodigoFalhaAutenticacao };

const ESQUEMA = "bearer";

/**
 * Extrai o token do cabeçalho `Authorization`. Nenhuma outra origem é
 * consultada — nem query string (§10.12: bearer em query é vazamento em log),
 * nem cabeçalho customizado, nem corpo.
 */
export function extrairBearer(request: RequisicaoAutenticavel): ExtracaoDeBearer {
  const bruto = request.headers.authorization;
  // `Authorization` repetido é requisição malformada e vetor de contrabando —
  // recusar, nunca escolher uma das ocorrências.
  if (Array.isArray(bruto)) return { ok: false, codigo: "cabecalho-ausente" };
  if (typeof bruto !== "string" || bruto.length === 0) {
    return { ok: false, codigo: "cabecalho-ausente" };
  }
  const separador = bruto.indexOf(" ");
  if (separador < 0) return { ok: false, codigo: "esquema-invalido" };
  // RFC 6750 §2.1: o nome do esquema é case-insensitive.
  if (bruto.slice(0, separador).toLowerCase() !== ESQUEMA) {
    return { ok: false, codigo: "esquema-invalido" };
  }
  const token = bruto.slice(separador + 1).trim();
  if (token.length === 0) return { ok: false, codigo: "token-vazio" };
  return { ok: true, token };
}

/**
 * Converte o resultado do verificador na forma que as rotas consomem. Aqui, e
 * só aqui, o `instance` do `problem+json` é preenchido — sempre com a URN
 * opaca de ocorrência, jamais com `request.url`, que em rotas como
 * `/v1/pacientes/:pacienteRef/avaliacoes` carrega o identificador do sujeito
 * (SAF-0026/SEC-0015, ACHADO-02 da verificação de controles da fatia G7).
 */
export function concluirAutenticacao(
  request: RequisicaoAutenticavel,
  resultado: ResultadoVerificacao,
): ResultadoAutenticacao {
  if (resultado.ok) return { ok: true, contexto: resultado.contexto };
  return resultadoDeFalha(resultado.falha, instanciaSegura(request));
}

export function recusar(
  request: RequisicaoAutenticavel,
  codigo: CodigoFalhaAutenticacao,
): ResultadoAutenticacao {
  return resultadoDeFalha(falha(codigo), instanciaSegura(request));
}

/**
 * A FÁBRICA da porta (`criarPortaDeAutenticacao`) vive em `fabrica.ts`, não
 * aqui: os adaptadores importam esta interface, e manter a fábrica no mesmo
 * módulo criaria um ciclo de import em tempo de execução.
 */
