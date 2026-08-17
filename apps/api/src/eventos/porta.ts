/**
 * apps/api/src/eventos/porta.ts — portas que o gateway de eventos CONSOME.
 *
 * Nenhuma delas é implementada aqui de propósito:
 *
 * - `PortaAutorizacaoEventos` pertence a `ic-identidade-auth`
 *   (`apps/api/src/auth/**`). No momento desta entrega aquele diretório
 *   AINDA NÃO EXISTE (OBSERVADO: só `apps/api/src/auth.ts`, um stub de
 *   bearer sintético). Definimos aqui a interface MÍNIMA que o gateway
 *   precisa e a recebemos por injeção — o gateway não constrói identidade,
 *   não lê cabeçalho de autenticação e não decide autorização.
 * - `FonteEventosDuraveis` é a leitura do backbone durável (hoje
 *   `replayEvents` em `apps/api/src/db.ts`, que NÃO é arquivo deste
 *   agente). Injetada pelo orquestrador.
 * - `NotificadorDeMudanca` é o sinal de "algo mudou". Ele NÃO transporta
 *   evento nem dado clínico — é um despertador. Essa escolha é o que faz o
 *   push ser, por construção, derivação exclusiva do estado durável
 *   (ADR-0011 P1; DOM-0006; regra §3-9: o canal jamais é a fonte de
 *   verdade).
 *
 * Rastreio: ADR-0011 P1/P2/P3/P4/P8, ADR-0016 §4.1, ADR-0010 B3.
 */

import type { EventoFluxo, MotivoEncerramento, ProblemDetails } from "@intensicare/contratos";
import type { FastifyRequest } from "fastify";
import {
  type ChaveEscopadaPorTenant,
  marcarTenantVerificado,
  type TenantId,
} from "./chave-escopada.js";

/**
 * Contexto verificado da sessão — o que ADR-0011 P3 chama de "contexto
 * verificado da sessão no momento da entrega". Só existe como resultado da
 * verificação; nunca é montado a partir de valor do chamador.
 */
export interface ContextoVerificado {
  readonly tenantId: TenantId;
  readonly atorId: string;
  /** Papéis mínimos da fatia (ADR-0016 §4.1): leitor/atuante/administrador. */
  readonly papeis: readonly string[];
  /**
   * Instante de expiração da sessão, em epoch ms. `null` quando a porta
   * ainda não modela expiração (o stub atual não modela) — nesse caso a
   * expiração é responsabilidade exclusiva de `revalidarSessao`.
   */
  readonly expiraEm: number | null;
  /**
   * Impressão do contexto de autorização. Serve a ADR-0011 P3 ("mudança de
   * contexto invalida a decisão"): se mudar entre entregas, a assinatura é
   * encerrada com `contexto-alterado`.
   */
  readonly impressaoContexto: string;
}

/**
 * ÚNICA fábrica de `ContextoVerificado` (e, por consequência, de
 * `TenantId`). Deve ser chamada apenas pelo adaptador de autenticação, no
 * ponto em que a sessão foi de fato verificada.
 */
export function criarContextoVerificado(argumentos: {
  readonly tenantIdVerificado: string;
  readonly atorId: string;
  readonly papeis?: readonly string[];
  readonly expiraEm?: number | null;
  readonly impressaoContexto?: string;
}): ContextoVerificado {
  const tenantId = marcarTenantVerificado(argumentos.tenantIdVerificado);
  const papeis = argumentos.papeis ?? [];
  return {
    tenantId,
    atorId: argumentos.atorId,
    papeis,
    expiraEm: argumentos.expiraEm ?? null,
    impressaoContexto:
      argumentos.impressaoContexto ??
      `${tenantId as string}|${argumentos.atorId}|${[...papeis].sort().join(",")}`,
  };
}

/** Resultado da verificação de sessão no handshake. */
export type ResultadoVerificacao =
  | { readonly ok: true; readonly contexto: ContextoVerificado }
  | { readonly ok: false; readonly problema: ProblemDetails };

/**
 * Decisão de autorização. `permitido: false` SEMPRE traz um motivo do enum
 * do contrato — o encerramento nunca é mudo.
 */
export type DecisaoAutorizacao =
  | { readonly permitido: true }
  | { readonly permitido: false; readonly motivo: MotivoEncerramento };

/**
 * Porta de autorização do canal (ADR-0011 P3 + ADR-0016 §4.1). Três
 * momentos distintos, de propósito:
 *
 * 1. `verificarSessao` — handshake. Deriva o contexto verificado.
 * 2. `revalidarSessao` — periódica (a cada pulsação). Pega expiração e
 *    revogação mesmo em conexão silenciosa.
 * 3. `autorizarEntrega` — **por evento, no momento da entrega**. É a
 *    cláusula literal: "subscrição autorizada não é entrega
 *    pré-autorizada".
 */
export interface PortaAutorizacaoEventos {
  verificarSessao(request: FastifyRequest): Promise<ResultadoVerificacao> | ResultadoVerificacao;
  revalidarSessao(contexto: ContextoVerificado): Promise<DecisaoAutorizacao> | DecisaoAutorizacao;
  autorizarEntrega(
    contexto: ContextoVerificado,
    evento: EventoFluxo,
  ): Promise<DecisaoAutorizacao> | DecisaoAutorizacao;
}

/**
 * Leitura do backbone durável, sempre escopada por `ChaveEscopadaPorTenant`
 * — não há assinatura que aceite um tenant em `string`.
 */
export interface FonteEventosDuraveis {
  /**
   * Eventos com `sequencia` ESTRITAMENTE maior que `cursor`, em ordem
   * crescente, no máximo `limite`.
   *
   * `atorId` viaja junto porque a leitura é auditável: quem leu o quê
   * continua registrado em trilha append-only, exatamente como na rota de
   * replay anterior. O ESCOPO, porém, vem da `chave` — nunca do ator.
   */
  lerDesde(
    chave: ChaveEscopadaPorTenant,
    cursor: number,
    limite: number,
    atorId: string,
  ): Promise<readonly EventoFluxo[]>;

  /**
   * Menor cursor ainda retomável (ADR-0011 P4: "o servidor declara até
   * onde o cursor é retomável", alinhado à janela de replay B4).
   *
   * OBSERVADO: a fatia não implementa poda nem janela de retenção
   * (catálogo §3, B4 = "nenhuma janela/poda implementada"); o adaptador
   * atual devolve `0` porque nada foi podado — isso é um fato medido, não
   * um SLO. Quando a poda existir, este número passa a ser o piso real e o
   * caminho `cursor-irretomavel` deixa de ser apenas testado para ser
   * exercido em produção.
   */
  cursorMinimoRetomavel(chave: ChaveEscopadaPorTenant): Promise<number>;
}

/**
 * Sinal de "há novidade durável neste tenant". NÃO carrega o evento: o
 * gateway relê do backbone. Ver o cabeçalho deste arquivo.
 */
export interface NotificadorDeMudanca {
  /** Assina; devolve a função de cancelamento. */
  assinar(chave: ChaveEscopadaPorTenant, aoMudar: () => void): () => void;
}

/**
 * Notificador em processo. Suficiente para um processo único; um segundo
 * processo NÃO recebe o sinal do primeiro — nesse caso a entrega degrada
 * para a latência da pulsação (que também dispara releitura) e para o
 * polling de reconciliação (ADR-0011 P8), jamais para perda silenciosa.
 * Substituí-lo por um sinal entre processos é trabalho do relay (ADR-0010
 * B9/B10), que não existe nesta fatia.
 */
export class NotificadorEmMemoria implements NotificadorDeMudanca {
  readonly #ouvintesPorTenant = new Map<string, Set<() => void>>();

  assinar(chave: ChaveEscopadaPorTenant, aoMudar: () => void): () => void {
    const id = chave.tenantId as string;
    let conjunto = this.#ouvintesPorTenant.get(id);
    if (!conjunto) {
      conjunto = new Set();
      this.#ouvintesPorTenant.set(id, conjunto);
    }
    conjunto.add(aoMudar);
    return () => {
      conjunto.delete(aoMudar);
      if (conjunto.size === 0) this.#ouvintesPorTenant.delete(id);
    };
  }

  /**
   * Acorda as assinaturas do tenant. Aceita `string` porque é apenas um
   * despertador sem dado: acordar a conexão errada não vaza nada — a
   * releitura subsequente é escopada pela chave da PRÓPRIA conexão.
   */
  notificarMudancaEm(tenantIdBruto: string): void {
    const conjunto = this.#ouvintesPorTenant.get(tenantIdBruto);
    if (!conjunto) return;
    for (const ouvinte of [...conjunto]) ouvinte();
  }

  /** Número de assinaturas vivas — para observabilidade e teste. */
  contarAssinaturas(): number {
    let total = 0;
    for (const conjunto of this.#ouvintesPorTenant.values()) total += conjunto.size;
    return total;
  }
}
