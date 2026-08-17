/**
 * apps/api/src/auth.ts — FACHADA da porta de autenticação.
 *
 * O que mudou em relação à fatia SPR-G7-2 (ACHADO §6.2, P0)
 * ---------------------------------------------------------
 * Antes: `TOKEN_PATTERN = /^SYNTH-TOKEN\.([^.\s]+)\.([^.\s]+)$/` e o tenant era
 * lido do TEXTO do token. Qualquer chamador escrevia qualquer tenant — não
 * havia assinatura, emissor, audiência, expiração, `kid` nem rotação. O
 * cabeçalho do arquivo declarava honestamente que não era autenticação.
 *
 * Agora: tenant e ator só existem se vierem de um JWS verificado pelo
 * verificador único (`auth/verificador.ts`) contra uma fonte de chaves —
 * remota (adaptador OIDC) ou em memória (emissor sintético local de dev/test).
 * Forjar um tenant passa a exigir a chave privada do emissor.
 *
 * O que continua verdadeiro e NÃO pode ser alegado de outra forma
 * ---------------------------------------------------------------
 * Nenhum IdP foi selecionado (ADR-0015 §1; `threat-model.md` §2.2 — a
 * fronteira TB-06 não está decidida). O adaptador OIDC está verificado
 * **contra um servidor de teste local**, nunca contra provedor real: o item
 * "integração com IdP" permanece **BLOQUEADO**, não resolvido. Isto não é
 * autenticação de produção operante e não fecha `MG-G6`, `SEC-0004` nem
 * qualquer gate.
 *
 * Rastreio: ADR-0015 (autenticação/sessão/identidade m2m, direção aceita
 * GDEC-0016, Opção A), ADR-0016 §4.1 (escopo de tenant e papéis mínimos),
 * HAZ-0014 (o legado caía para JWT local em qualquer erro), SEC-0001,
 * SEC-0004, THR-0021.
 */

import type { FastifyRequest } from "fastify";
import { emitirTokenSintetico } from "./auth/adaptador-sintetico.js";
import { type RequisicaoAutenticavel, recusar } from "./auth/porta.js";
import {
  lerResultadoDaRequisicao,
  portaInstalada,
  portaPadraoDeDesenvolvimentoSeHouver,
} from "./auth/registro.js";
import type { ResultadoAutenticacao } from "./auth/tipos.js";

// ---------------------------------------------------------------------------
// Superfície consumida pelas rotas (forma preservada da fatia SPR-G7-2).
// ---------------------------------------------------------------------------

export type {
  ContextoAutenticado,
  PapelClinico,
  ResultadoAutenticacao,
  TipoIdentidade,
} from "./auth/tipos.js";

/**
 * Emite um token sintético ASSINADO para `tenantId`/`atorId`.
 *
 * Assinatura preservada, semântica trocada: o retorno já não é
 * `SYNTH-TOKEN.<tenant>.<ator>` (texto legível e forjável) e sim um JWS
 * compacto assinado pelo emissor local. LANÇA fora de `dev`/`test`
 * (ADR-0015 §4.1) — a contenção é do tipo "não compila em produção", não do
 * tipo "não deveria acontecer".
 */
export function gerarTokenSintetico(tenantId: string, atorId: string): string {
  return emitirTokenSintetico(tenantId, atorId);
}

/**
 * Devolve o contexto verificado da requisição.
 *
 * Ordem de resolução — e por que ela é fail-closed:
 *   1. resultado já computado pelo hook `onRequest` (`registrarAutenticacao`).
 *      Este é o caminho de produção: se uma porta está instalada, o hook
 *      SEMPRE anexa um resultado, inclusive quando a verificação falha. Logo,
 *      com IdP fora do ar o retorno é a recusa do hook — nunca outra coisa.
 *   2. sem hook: porta instalada no processo, se ela expuser caminho síncrono.
 *      O adaptador OIDC deliberadamente NÃO expõe, então esta linha só
 *      resolve para o adaptador sintético de `dev`/`test`.
 *   3. sem hook e sem porta: adaptador sintético padrão, e SÓ sob `dev`/`test`.
 *   4. qualquer outro caso (inclusive `homologacao`/`producao` sem fiação):
 *      recusa 401 `porta-nao-instalada`.
 *
 * Nenhum passo lê tenant de header, query string, corpo ou URL — a única
 * entrada é o cabeçalho `Authorization` e, dele, apenas o token assinado
 * (anti-padrão §10.3 do prompt; ADR-0015 §4 item 2).
 */
export function autenticar(request: FastifyRequest): ResultadoAutenticacao {
  const requisicao = request as unknown as RequisicaoAutenticavel;

  const doHook = lerResultadoDaRequisicao(requisicao);
  if (doHook !== undefined) return doHook;

  const porta = portaInstalada() ?? portaPadraoDeDesenvolvimentoSeHouver();
  const sincrono = porta?.autenticarSincrono;
  if (sincrono === undefined) return recusar(requisicao, "porta-nao-instalada");
  return sincrono(requisicao);
}

// ---------------------------------------------------------------------------
// Superfície de FIAÇÃO — consumida por `index.ts` (fora do escopo deste
// agente; ver o handoff para o trecho exato a aplicar).
// ---------------------------------------------------------------------------

export type {
  ConfiguracaoAutenticacao,
  ConfiguracaoOidc,
  ConfiguracaoSintetica,
  PerfilExecucao,
} from "./auth/configuracao.js";
export {
  PERFIS,
  PERFIS_DE_DESENVOLVIMENTO,
  perfilDoAmbiente,
  perfilPermiteSintetico,
} from "./auth/configuracao.js";
export { criarPortaDeAutenticacao } from "./auth/fabrica.js";
export type { PortaDeAutenticacao, RequisicaoAutenticavel } from "./auth/porta.js";
export {
  instalarPorta,
  registrarAutenticacao,
  reiniciarRegistroDeAutenticacao,
} from "./auth/registro.js";
