/**
 * apps/api/src/eventos/ticket.ts — ticket efêmero de uso único para abrir
 * o fluxo SSE a partir de um navegador.
 *
 * POR QUE ELE EXISTE. O `EventSource` nativo não envia cabeçalho
 * `Authorization`. As saídas possíveis são (a) cookie de sessão e (b)
 * ticket efêmero. Pôr credencial em query string é anti-padrão PROIBIDO
 * (prompt §10 item 12: "colocar bearer, PSR, tenant ou identificador do
 * sujeito em query string/log").
 *
 * PREMISSA REVERSÍVEL DECLARADA (ADR-0011 §5.3 — "Não vincula: transporte
 * concreto de push"; ADR-0015 segue `not-started`): adotamos o ticket
 * efêmero, de USO ÚNICO e escopo estreito, entregue e lido EXCLUSIVAMENTE
 * por cookie `HttpOnly; Secure; SameSite=Strict` com `Path` restrito à
 * rota do fluxo. Consequências que os testes cobram:
 *
 * - o valor NUNCA aparece em URL, corpo de resposta, corpo de erro ou log;
 * - o segundo uso do mesmo ticket é rejeitado (consumido na abertura);
 * - ticket expirado é rejeitado;
 * - rejeição por inexistência e por expiração devolvem o MESMO
 *   `problem+json` (ADR-0016 §4.1: negação e inexistência não se
 *   distinguem para o chamador).
 *
 * O ticket carrega o contexto JÁ VERIFICADO no instante da emissão — e
 * isso não o torna uma entrega pré-autorizada: quem abre o fluxo passa
 * imediatamente por `revalidarSessao`, e cada evento passa por
 * `autorizarEntrega` (ADR-0011 P3).
 *
 * Reversível: quando ADR-0015/0016 decidirem sessão de navegador, este
 * módulo é substituído sem alterar nenhuma mensagem do `asyncapi.yaml`.
 */

import { randomBytes } from "node:crypto";
import { TICKET_EVENTOS_COOKIE } from "@intensicare/contratos";

interface RegistroTicket<C> {
  readonly carga: C;
  readonly expiraEmMs: number;
}

export interface TicketEmitido {
  /** Valor opaco. Só sai deste processo dentro de um `Set-Cookie`. */
  readonly valor: string;
  readonly expiraEm: string;
  readonly ttlSegundos: number;
}

export type ResultadoConsumo<C> =
  | { readonly ok: true; readonly carga: C }
  /**
   * Motivo INTERNO (telemetria). A resposta ao chamador é idêntica nos
   * dois casos — ver o cabeçalho deste arquivo.
   */
  | { readonly ok: false; readonly motivoInterno: "inexistente-ou-ja-usado" | "expirado" };

/**
 * Emissor/validador de tickets em memória, genérico sobre a carga
 * verificada que ele transporta.
 *
 * LIMITAÇÃO DECLARADA (não mascarada): o armazenamento é do processo. Em
 * mais de uma réplica, um ticket emitido por uma não abre fluxo em outra —
 * o cliente recebe rejeição explícita e reemite. Compartilhar o
 * armazenamento é decisão de plataforma (ADR-0019, `not-started`), não
 * deste módulo.
 */
export class EmissorDeTickets<C> {
  readonly #tickets = new Map<string, RegistroTicket<C>>();
  readonly #ttlSegundos: number;
  readonly #bytesDeEntropia: number;

  /**
   * @param ttlSegundos validade do ticket. NÃO tem valor padrão de
   * propósito: é configuração do servidor e permanece `VALIDATION
   * REQUIRED` (ADR-0011 §3). Quem sobe o gateway escolhe explicitamente.
   */
  constructor(ttlSegundos: number, bytesDeEntropia = 32) {
    if (!Number.isInteger(ttlSegundos) || ttlSegundos <= 0) {
      throw new Error("ttlSegundos do ticket precisa ser inteiro positivo (fail-closed).");
    }
    this.#ttlSegundos = ttlSegundos;
    this.#bytesDeEntropia = bytesDeEntropia;
  }

  get ttlSegundos(): number {
    return this.#ttlSegundos;
  }

  emitir(carga: C, agoraMs = Date.now()): TicketEmitido {
    const valor = randomBytes(this.#bytesDeEntropia).toString("base64url");
    const expiraEmMs = agoraMs + this.#ttlSegundos * 1_000;
    this.#tickets.set(valor, { carga, expiraEmMs });
    return {
      valor,
      expiraEm: new Date(expiraEmMs).toISOString(),
      ttlSegundos: this.#ttlSegundos,
    };
  }

  /**
   * Consome o ticket. O registro é REMOVIDO antes de qualquer verificação
   * de validade — assim, mesmo um ticket expirado deixa de existir no
   * primeiro toque, e o uso único vale também para o caminho de erro.
   */
  consumir(valor: string, agoraMs = Date.now()): ResultadoConsumo<C> {
    const registro = this.#tickets.get(valor);
    if (!registro) return { ok: false, motivoInterno: "inexistente-ou-ja-usado" };
    this.#tickets.delete(valor);
    if (registro.expiraEmMs <= agoraMs) return { ok: false, motivoInterno: "expirado" };
    return { ok: true, carga: registro.carga };
  }

  /** Remove tickets vencidos. Idempotente; devolve quantos removeu. */
  podarExpirados(agoraMs = Date.now()): number {
    let removidos = 0;
    for (const [valor, registro] of [...this.#tickets]) {
      if (registro.expiraEmMs <= agoraMs) {
        this.#tickets.delete(valor);
        removidos += 1;
      }
    }
    return removidos;
  }

  /** Tickets vivos — observabilidade e teste. Nunca expõe valores. */
  contarVivos(): number {
    return this.#tickets.size;
  }
}

/**
 * Monta o `Set-Cookie` do ticket. `HttpOnly` (JS não lê, logo não pode
 * pôr em URL), `Secure`, `SameSite=Strict` e `Path` restrito à rota do
 * fluxo — o cookie não acompanha nenhuma outra requisição.
 */
export function montarCookieDeTicket(argumentos: {
  valor: string;
  ttlSegundos: number;
  caminhoDoFluxo: string;
}): string {
  return [
    `${TICKET_EVENTOS_COOKIE}=${argumentos.valor}`,
    `Path=${argumentos.caminhoDoFluxo}`,
    `Max-Age=${String(argumentos.ttlSegundos)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

/** `Set-Cookie` que apaga o ticket — enviado assim que ele é consumido. */
export function montarCookieDeExpurgo(caminhoDoFluxo: string): string {
  return [
    `${TICKET_EVENTOS_COOKIE}=`,
    `Path=${caminhoDoFluxo}`,
    "Max-Age=0",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

/**
 * Extrai o ticket do cabeçalho `Cookie`. Parser mínimo e deliberado — não
 * aceita o valor de nenhuma outra origem (query, cabeçalho customizado,
 * corpo).
 */
export function lerTicketDoCookie(cabecalhoCookie: string | undefined): string | undefined {
  if (cabecalhoCookie === undefined) return undefined;
  for (const parte of cabecalhoCookie.split(";")) {
    const separador = parte.indexOf("=");
    if (separador === -1) continue;
    const nome = parte.slice(0, separador).trim();
    if (nome !== TICKET_EVENTOS_COOKIE) continue;
    const valor = parte.slice(separador + 1).trim();
    return valor === "" ? undefined : valor;
  }
  return undefined;
}

/**
 * Redação para log/diagnóstico. NUNCA registre o valor de um ticket; use
 * isto quando precisar apenas provar "havia um ticket".
 */
export function redigirTicket(valor: string | undefined): string {
  return valor === undefined ? "<ausente>" : "<ticket-redigido>";
}
