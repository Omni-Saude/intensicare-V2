/**
 * apps/api/src/eventos/stream.ts — gateway único de entrega em tempo real
 * autorizada (ADR-0011, Opção A aceita em GDEC-0008).
 *
 * O QUE MUDA EM RELAÇÃO AO QUE EXISTIA. A rota anterior
 * (`apps/api/src/routes.ts:304-334`) montava o backlog em texto SSE e
 * chamava `reply.send(corpo)` — resposta única, conexão encerrada logo
 * após o catch-up. Chamar isso de "tempo real" é o anti-padrão §10-11.
 * Aqui a conexão PERMANECE ABERTA depois do catch-up e segue entregando o
 * que ficar durável enquanto viver.
 *
 * COMO O PUSH CONTINUA SENDO DERIVAÇÃO DO DURÁVEL (ADR-0011 P1; regra
 * §3-9). O notificador é um DESPERTADOR: não transporta evento nem dado
 * clínico. Ao ser acordado, o gateway RELÊ o backbone durável a partir do
 * próprio cursor e entrega o que leu. Não existe caminho pelo qual um fato
 * não persistido chegue ao cliente — a propriedade é estrutural, não uma
 * disciplina de quem chama.
 *
 * AUTORIZAÇÃO EM TRÊS MOMENTOS (ADR-0011 P3; ADR-0016 §4.1):
 *   handshake  → `verificarSessao` + `revalidarSessao`
 *   pulsação   → `revalidarSessao` (pega expiração/revogação em conexão
 *                silenciosa)
 *   por evento → `autorizarEntrega`, imediatamente ANTES de escrever o
 *                quadro. É a cláusula literal "subscrição autorizada não é
 *                entrega pré-autorizada".
 *
 * O QUE ESTE ARQUIVO NÃO DECIDE: alvo de latência, banda aceitável, limite
 * numérico de fila (todos `VALIDATION REQUIRED` em ADR-0011 §3/P5 —
 * injetados por quem sobe o gateway), mecanismo de autenticação (porta de
 * `ic-identidade-auth`) e regra clínica (nenhuma).
 */

import {
  DESCRICAO_ESTADO_CONEXAO,
  DESCRICAO_MOTIVO_ENCERRAMENTO,
  type EstadoConexao,
  EVENTO_SSE_ESTADO_CONEXAO,
  EVENTO_SSE_INSTRUCAO_RECONCILIACAO,
  EVENTO_SSE_PULSACAO,
  type EventoFluxo,
  type MensagemEstadoConexao,
  type MensagemInstrucaoReconciliacao,
  type MensagemPulsacao,
  type MotivoEncerramento,
  type PoliticaReconexao,
  PROBLEM_JSON_MIME_TYPE,
  type ProblemDetails,
  type TicketEventosResposta,
} from "@intensicare/contratos";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  type ChaveEscopadaPorTenant,
  criarChaveEscopada,
  envelopePertenceAChave,
  RECURSO_CANAL_EVENTOS,
} from "./chave-escopada.js";
import {
  type EscritorSse,
  EscritorSseHttp,
  FilaLimitada,
  type LimitesConexao,
  montarQuadro,
  montarQuadroDeRetry,
  type RespostaBruta,
} from "./fila.js";
import type {
  ContextoVerificado,
  FonteEventosDuraveis,
  NotificadorDeMudanca,
  PortaAutorizacaoEventos,
} from "./porta.js";
import { criarContextoVerificado } from "./porta.js";
import {
  type EmissorDeTickets,
  lerTicketDoCookie,
  montarCookieDeExpurgo,
  montarCookieDeTicket,
} from "./ticket.js";

export const CAMINHO_STREAM = "/v1/eventos/stream" as const;
export const CAMINHO_TICKET = "/v1/eventos/ticket" as const;

/**
 * Nomes de parâmetro de consulta que este gateway RECUSA, com 400, antes
 * de qualquer outra coisa. Não é sanitização: é a recusa explícita do
 * anti-padrão §10-12 (credencial/tenant/sujeito em query string). Aceitar
 * um destes "por conveniência" é exatamente o defeito que a regra proíbe.
 */
const PARAMETROS_PROIBIDOS_NA_QUERY: readonly string[] = [
  "token",
  "ticket",
  "bearer",
  "authorization",
  "access_token",
  "acesso",
  "senha",
  "secret",
  "segredo",
  "tenant",
  "tenantid",
  "ator",
  "atorid",
  "psr",
  "cpf",
  "paciente",
  "pacienteref",
  "subject",
];

export interface OpcoesGatewayEventos {
  /** Porta de autorização — de `ic-identidade-auth`. NÃO implementada aqui. */
  readonly porta: PortaAutorizacaoEventos;
  /** Leitura do backbone durável (adaptador sobre `replayEvents`). */
  readonly fonte: FonteEventosDuraveis;
  /** Despertador de mudança — sem dado. */
  readonly notificador: NotificadorDeMudanca;
  /** Emissor de tickets efêmeros de uso único. */
  readonly emissorDeTickets: EmissorDeTickets<ContextoVerificado>;
  /** Limites por conexão. `VALIDATION REQUIRED` — ver `fila.ts`. */
  readonly limites: LimitesConexao;
  /** Backoff/jitter dirigidos pelo servidor (ADR-0011 P5). */
  readonly reconexao: PoliticaReconexao;
  /** Caminho da projeção autoritativa para reconciliação (ADR-0011 P8). */
  readonly caminhoReconciliacao: string;
  /** Costura de teste: escritor alternativo (ex.: um que nunca drena). */
  readonly criarEscritor?: (resposta: RespostaBruta) => EscritorSse;
  /** Costura de teste: relógio injetável. */
  readonly agora?: () => number;
  /**
   * Observador de falha assíncrona (ADR-0020). Recebe o erro BRUTO, para
   * que o servidor possa investigar; nada disso vai para o fio. Quem fia é
   * responsável por redigir o que registrar — o erro pode conter detalhe
   * de infraestrutura. Padrão: silêncio (nunca `console.log`).
   *
   * O retorno admite `Promise<void>` DE PROPÓSITO (ACHADO 9): declarar
   * `=> void` não impedia um observador `async` — a assinabilidade de
   * retorno `void` do TypeScript aceita `async` sem erro algum —, apenas
   * escondia o caso. Declarado assim, o gateway é obrigado a tratá-lo, e é.
   */
  readonly registrarFalha?: (origem: OrigemDeFalha, erro: unknown) => void | Promise<void>;
}

/**
 * As bordas assíncronas do gateway. Nomeadas para que a falha seja
 * atribuível a um ponto do ciclo de vida, em vez de virar "erro no
 * stream".
 */
export type OrigemDeFalha = "iniciar" | "bombear" | "pulsar" | "drenar" | "encerrar";

/** Estados que o SERVIDOR emite. `reconnecting`/`reconciled` são do cliente. */
type EstadoEmitidoPeloServidor = Extract<
  EstadoConexao,
  "replaying" | "online" | "degraded" | "offline"
>;

// ---------------------------------------------------------------------------
// Conexão
// ---------------------------------------------------------------------------

class ConexaoEventos {
  readonly #contexto: ContextoVerificado;
  readonly #chave: ChaveEscopadaPorTenant;
  readonly #opcoes: OpcoesGatewayEventos;
  readonly #escritor: EscritorSse;
  readonly #fila: FilaLimitada<EventoFluxo>;
  readonly #agora: () => number;

  /** Última sequência LIDA do backbone (pode estar à frente da entregue). */
  #cursorLido: number;
  /** Última sequência efetivamente ESCRITA no fio — o cursor do cliente. */
  #cursorEntregue: number;

  #estado: EstadoEmitidoPeloServidor = "replaying";
  #encerrada = false;
  #drenando = false;
  #bombeando = false;
  #relerNovamente = false;
  #cancelarAssinatura: (() => void) | undefined;
  #timerPulsacao: NodeJS.Timeout | undefined;
  #timerReexameDreno: NodeJS.Timeout | undefined;

  constructor(argumentos: {
    contexto: ContextoVerificado;
    chave: ChaveEscopadaPorTenant;
    opcoes: OpcoesGatewayEventos;
    escritor: EscritorSse;
    cursorInicial: number;
  }) {
    this.#contexto = argumentos.contexto;
    this.#chave = argumentos.chave;
    this.#opcoes = argumentos.opcoes;
    this.#escritor = argumentos.escritor;
    this.#fila = new FilaLimitada<EventoFluxo>(argumentos.opcoes.limites.maximoEventosNaFila);
    this.#agora = argumentos.opcoes.agora ?? Date.now;
    this.#cursorLido = argumentos.cursorInicial;
    this.#cursorEntregue = argumentos.cursorInicial;
  }

  get encerrada(): boolean {
    return this.#encerrada;
  }

  get cursorEntregue(): number {
    return this.#cursorEntregue;
  }

  /**
   * Abre a assinatura: anuncia o backoff, faz o catch-up, e SÓ ENTÃO passa
   * a `online` — mantendo a conexão aberta.
   */
  async iniciar(): Promise<void> {
    try {
      this.#escritor.escrever(montarQuadroDeRetry(this.#opcoes.reconexao.esperaMinimaMs));
      this.#emitirEstado("replaying");

      // Assinar ANTES do catch-up: o que for produzido durante o catch-up
      // apenas marca releitura — nunca se perde entre as duas fases.
      this.#cancelarAssinatura = this.#opcoes.notificador.assinar(this.#chave, () => {
        this.#dispararProtegido("bombear", () => this.#bombear());
      });

      await this.#bombear();
      if (this.#encerrada) return;

      // `online` só DEPOIS de o catch-up ter de fato terminado.
      this.#emitirEstado(this.#fila.tamanho > 0 ? "degraded" : "online");
      this.#timerPulsacao = setInterval(() => {
        this.#dispararProtegido("pulsar", () => this.#pulsar());
      }, this.#opcoes.limites.intervaloPulsacaoMs);
      // `unref` para que uma conexão viva não segure o encerramento do
      // processo (e não pendure a suíte de testes).
      this.#timerPulsacao.unref?.();
    } catch (erro) {
      // NUNCA rejeita: quem chama já executou `reply.hijack()` e não teria
      // como responder um erro HTTP — a rejeição viraria socket pendurado.
      await this.#encerrarPorFalha("iniciar", erro);
    }
  }

  /**
   * Tratamento final das bordas assíncronas (ACHADO 7; anti-padrão §10-13).
   * Toda promessa disparada sem `await` passa por aqui — a falha vira
   * encerramento INSTRUÍDO, nunca rejeição solta.
   */
  #dispararProtegido(origem: OrigemDeFalha, operacao: () => Promise<void>): void {
    operacao().catch((erro: unknown) => {
      void this.#encerrarPorFalha(origem, erro);
    });
  }

  /**
   * O servidor não consegue sustentar a assinatura. Registra para o
   * operador e encerra COM instrução — o cliente termina informado, não
   * iludido (ADR-0011 P5/P6/P10; prompt §20).
   */
  async #encerrarPorFalha(origem: OrigemDeFalha, erro: unknown): Promise<void> {
    // Não rejeita porque NENHUM dos dois passos rejeita — garantia
    // estrutural, não bloco defensivo morto.
    await this.#reportarFalha(origem, erro);
    await this.encerrarCom("falha-interna", null);
  }

  /**
   * Entrega a falha ao observador do servidor sem jamais deixá-la voltar.
   *
   * ACHADO 9: a versão anterior chamava o observador SEM `await`, dentro de
   * um `try/catch` síncrono. Como o tipo declarado devolvia `void` e o
   * TypeScript aceita uma função `async` nesse contrato sem erro, um
   * observador que rejeitasse escapava de dentro da própria função que
   * existe para impedir escapes. O `Promise.resolve` DENTRO do `try` cobre
   * os dois modos: o lançamento síncrono acontece antes dele e é pego pelo
   * `try`; a rejeição assíncrona é pega pelo `await`.
   */
  async #reportarFalha(origem: OrigemDeFalha, erro: unknown): Promise<void> {
    try {
      await Promise.resolve(this.#opcoes.registrarFalha?.(origem, erro));
    } catch {
      // Observador defeituoso não altera o fluxo de encerramento.
    }
  }

  /** Encerramento por desconexão do cliente — nada a instruir. */
  encerrarPorDesconexaoDoCliente(): void {
    if (this.#encerrada) return;
    this.#encerrada = true;
    this.#pararTimers();
    this.#cancelarAssinatura?.();
    this.#cancelarAssinatura = undefined;
  }

  /**
   * Encerramento pelo SERVIDOR. Sempre precedido de instrução de
   * reconciliação — ADR-0011 P4/P5, prompt §20: a lacuna é explícita,
   * jamais um socket que some.
   */
  async encerrarCom(
    motivo: MotivoEncerramento,
    cursorMinimoRetomavel: number | null,
  ): Promise<void> {
    if (this.#encerrada) return;
    this.#encerrada = true;

    // Este método NÃO PODE REJEITAR: é aguardado em dois sítios que já
    // executaram `reply.hijack()`, onde uma rejeição não teria como virar
    // resposta HTTP. A garantia é estrutural — todo passo abaixo está
    // isolado, e `#reportarFalha` também não rejeita.
    const falhas: unknown[] = [];
    try {
      this.#pararTimers();
    } catch (erro) {
      falhas.push(erro);
    }
    try {
      this.#cancelarAssinatura?.();
    } catch (erro) {
      falhas.push(erro);
    } finally {
      this.#cancelarAssinatura = undefined;
    }

    const instrucao: MensagemInstrucaoReconciliacao = {
      motivo,
      descricao: DESCRICAO_MOTIVO_ENCERRAMENTO[motivo],
      acao: motivo === "desligamento-servidor" ? "reconectar-do-cursor" : "reconciliar-por-polling",
      caminhoReconciliacao: this.#opcoes.caminhoReconciliacao,
      cursor: this.#cursorEntregue,
      cursorMinimoRetomavel,
      reconexao: this.#opcoes.reconexao,
      emitidoEm: new Date(this.#agora()).toISOString(),
    };
    try {
      this.#escritor.escrever(
        montarQuadro({ evento: EVENTO_SSE_INSTRUCAO_RECONCILIACAO, dados: instrucao }),
      );
      this.#emitirEstado("offline");
    } catch (erro) {
      // ACHADO 10: era `finally` SEM `catch`. Duas consequências, ambas
      // ruins: o método podia propagar para dois sítios pós-hijack sem
      // proteção, e uma falha em `encerrar()` SUBSTITUÍA a exceção
      // original. Agora cada passo é isolado e as falhas são coletadas na
      // ordem em que ocorrem.
      falhas.push(erro);
    }
    try {
      // O fechamento do socket não depende de a instrução ter sido
      // escrita: conexão pendurada é pior que instrução perdida.
      this.#escritor.encerrar();
    } catch (erro) {
      falhas.push(erro);
    }
    for (const falha of falhas) await this.#reportarFalha("encerrar", falha);
  }

  #pararTimers(): void {
    if (this.#timerPulsacao !== undefined) {
      clearInterval(this.#timerPulsacao);
      this.#timerPulsacao = undefined;
    }
    if (this.#timerReexameDreno !== undefined) {
      clearTimeout(this.#timerReexameDreno);
      this.#timerReexameDreno = undefined;
    }
  }

  #emitirEstado(estado: EstadoEmitidoPeloServidor): void {
    this.#estado = estado;
    const mensagem: MensagemEstadoConexao = {
      estado,
      descricao: DESCRICAO_ESTADO_CONEXAO[estado],
      emitidoEm: new Date(this.#agora()).toISOString(),
      cursor: this.#cursorEntregue,
    };
    this.#escritor.escrever(montarQuadro({ evento: EVENTO_SSE_ESTADO_CONEXAO, dados: mensagem }));
  }

  /**
   * Pulsação: prova de vida + reavaliação de sessão + releitura de
   * segurança (caso o despertador não tenha chegado — outra réplica, por
   * exemplo). A ausência dela é o sinal de conexão morta.
   */
  async #pulsar(): Promise<void> {
    if (this.#encerrada) return;

    const decisao = await this.#opcoes.porta.revalidarSessao(this.#contexto);
    if (!decisao.permitido) {
      await this.encerrarCom(decisao.motivo, null);
      return;
    }
    const expiraEm = this.#contexto.expiraEm;
    if (expiraEm !== null && expiraEm <= this.#agora()) {
      await this.encerrarCom("sessao-expirada", null);
      return;
    }

    // ORDEM DELIBERADA (ACHADO 7). A releitura do backbone vem ANTES de
    // anunciar o estado. Na ordem anterior, a pulsação com
    // `"estado":"online"` era escrita e só depois vinha o `await` que podia
    // rejeitar — o cliente ficava com um "estou em dia" que o servidor já
    // não sustentava. Isso é dado stale com aparência de atual
    // (anti-padrão §10-14) e o oposto do que ADR-0011 P6 exige. Se a
    // releitura falhar, `#dispararProtegido` encerra instruído e NENHUMA
    // pulsação é emitida nesta rodada.
    await this.#bombear();
    if (this.#encerrada) return;

    const estado: EstadoEmitidoPeloServidor = this.#fila.tamanho > 0 ? "degraded" : "online";
    if (estado !== this.#estado) this.#emitirEstado(estado);

    const pulsacao: MensagemPulsacao = {
      emitidoEm: new Date(this.#agora()).toISOString(),
      estado,
      cursor: this.#cursorEntregue,
      pendentes: this.#fila.tamanho,
    };
    this.#escritor.escrever(montarQuadro({ evento: EVENTO_SSE_PULSACAO, dados: pulsacao }));
  }

  /**
   * Relê o backbone durável a partir do cursor e enfileira. Reentrância
   * coalescida: um despertador que chega durante a releitura marca outra
   * rodada em vez de correr em paralelo.
   */
  async #bombear(): Promise<void> {
    if (this.#bombeando) {
      this.#relerNovamente = true;
      return;
    }
    this.#bombeando = true;
    try {
      do {
        this.#relerNovamente = false;
        for (;;) {
          if (this.#encerrada) return;
          const lote = await this.#opcoes.fonte.lerDesde(
            this.#chave,
            this.#cursorLido,
            this.#opcoes.limites.loteMaximoLeitura,
            this.#contexto.atorId,
          );
          if (lote.length === 0) break;

          for (const evento of lote) {
            if (this.#encerrada) return;
            let resultado = this.#fila.enfileirar(evento);
            if (!resultado.aceito) {
              // Tenta liberar espaço antes de desistir — só então P5.
              await this.#drenar();
              if (this.#encerrada) return;
              resultado = this.#fila.enfileirar(evento);
            }
            if (!resultado.aceito) {
              await this.encerrarCom("fila-excedida", null);
              return;
            }
            this.#cursorLido = evento.sequencia;
          }

          await this.#drenar();
          if (this.#encerrada) return;
          if (lote.length < this.#opcoes.limites.loteMaximoLeitura) break;
        }
      } while (this.#relerNovamente);
    } finally {
      this.#bombeando = false;
    }
  }

  /**
   * Escreve o que der. Cada evento é autorizado NO MOMENTO DA ENTREGA
   * (ADR-0011 P3) e reescopado a partir do próprio envelope (ADR-0016
   * §4.1) — divergência encerra a assinatura, jamais filtra em silêncio.
   */
  async #drenar(): Promise<void> {
    if (this.#drenando || this.#encerrada) return;
    this.#drenando = true;
    try {
      for (;;) {
        if (this.#encerrada) return;
        const proximo = this.#fila.espiar();
        if (proximo === undefined) return;

        if (this.#escritor.encerrado) {
          this.encerrarPorDesconexaoDoCliente();
          return;
        }
        if (this.#escritor.bytesPendentes() > this.#opcoes.limites.maximoBytesPendentes) {
          this.#agendarReexameDeDreno();
          return;
        }

        const decisao = await this.#opcoes.porta.autorizarEntrega(this.#contexto, proximo);
        if (this.#encerrada) return;
        if (!decisao.permitido) {
          await this.encerrarCom(decisao.motivo, null);
          return;
        }
        if (!envelopePertenceAChave(this.#chave, proximo.tenantId)) {
          await this.encerrarCom("escopo-divergente", null);
          return;
        }

        this.#fila.desenfileirar();
        this.#escritor.escrever(
          montarQuadro({ evento: proximo.tipo, dados: proximo, id: proximo.sequencia }),
        );
        this.#cursorEntregue = proximo.sequencia;
      }
    } finally {
      this.#drenando = false;
    }
  }

  /** Reexame do escritor saturado — cliente lento vira backlog visível. */
  #agendarReexameDeDreno(): void {
    if (this.#timerReexameDreno !== undefined || this.#encerrada) return;
    this.#timerReexameDreno = setTimeout(() => {
      this.#timerReexameDreno = undefined;
      this.#dispararProtegido("drenar", () => this.#drenar());
    }, this.#opcoes.limites.intervaloReexameDrenoMs);
    this.#timerReexameDreno.unref?.();
  }
}

// ---------------------------------------------------------------------------
// Problemas (RFC 9457) — nunca ecoam valor recebido
// ---------------------------------------------------------------------------

function problema(status: number, title: string, detail: string): ProblemDetails {
  return { type: "about:blank", title, status, detail };
}

/**
 * Resposta ÚNICA para ticket ausente, inválido, já usado ou expirado —
 * ADR-0016 §4.1: negação e inexistência não se distinguem para o chamador.
 * Nunca ecoa o valor recebido.
 */
function problemaDeTicket(): ProblemDetails {
  return problema(
    401,
    "Fluxo de eventos não autorizado",
    "Não foi possível abrir o fluxo com as credenciais apresentadas. Obtenha um novo ticket e tente de novo.",
  );
}

// ---------------------------------------------------------------------------
// Leitura de cursor e recusa de credencial em query
// ---------------------------------------------------------------------------

function detectarParametroProibido(query: unknown): boolean {
  if (typeof query !== "object" || query === null) return false;
  for (const chave of Object.keys(query)) {
    if (PARAMETROS_PROIBIDOS_NA_QUERY.includes(chave.toLowerCase())) return true;
  }
  return false;
}

type CursorSolicitado = { ok: true; cursor: number } | { ok: false };

function lerCursorSolicitado(request: FastifyRequest): CursorSolicitado {
  const bruto = request.headers["last-event-id"];
  const doCabecalho = Array.isArray(bruto) ? bruto[0] : bruto;
  const query = request.query as { cursor?: unknown } | undefined;
  const daQuery = query?.cursor;
  const candidato = doCabecalho ?? (typeof daQuery === "string" ? daQuery : undefined);
  if (candidato === undefined || candidato.trim() === "") return { ok: true, cursor: 0 };
  const numero = Number(candidato);
  if (!Number.isInteger(numero) || numero < 0) return { ok: false };
  return { ok: true, cursor: numero };
}

// ---------------------------------------------------------------------------
// Registro do gateway
// ---------------------------------------------------------------------------

/** Controle operacional do gateway, devolvido no registro. */
export interface ControleDoGateway {
  /**
   * Derruba TODAS as conexões vivas, cada uma com instrução de
   * reconciliação (ADR-0011 §8.3 iii: "conexões são derrubáveis em massa
   * com instrução de reconciliação [...] e a derrubada é explícita ao
   * usuário"). Devolve quantas foram encerradas.
   */
  encerrarTodas(motivo?: MotivoEncerramento): Promise<number>;
  /** Conexões vivas — observabilidade (ADR-0011 P10; ADR-0020). */
  conexoesVivas(): number;
}

/**
 * Registra `POST /v1/eventos/ticket` e `GET /v1/eventos/stream`.
 *
 * FIAÇÃO: a rota antiga de replay finito em `apps/api/src/routes.ts`
 * precisa ser REMOVIDA antes desta chamada — duas rotas no mesmo caminho
 * fazem o Fastify falhar no registro. Ver o handoff.
 *
 * DESLIGAMENTO. Um `onClose` é registrado aqui para derrubar as conexões
 * vivas COM instrução. Sem isso, `app.close()` esperaria indefinidamente
 * por conexões que, por projeto, não terminam sozinhas — e o operador veria
 * um desligamento travado em vez de um encerramento explícito.
 */
export function registrarGatewayEventos(
  app: FastifyInstance,
  opcoes: OpcoesGatewayEventos,
): ControleDoGateway {
  const criarEscritor =
    opcoes.criarEscritor ??
    ((resposta: RespostaBruta): EscritorSse => new EscritorSseHttp(resposta));
  const agora = opcoes.agora ?? Date.now;
  const conexoes = new Set<ConexaoEventos>();

  const controle: ControleDoGateway = {
    async encerrarTodas(motivo = "desligamento-servidor") {
      const vivas = [...conexoes];
      let encerradas = 0;
      for (const conexao of vivas) {
        try {
          await conexao.encerrarCom(motivo, null);
          encerradas += 1;
        } catch {
          // ACHADO 10: `conexoes.clear()` acontecia ANTES do laço, então
          // uma conexão que lançasse abortava o laço e deixava as demais
          // sem encerramento, sem instrução e já invisíveis ao controle.
          // Agora cada conexão é isolada e só sai do conjunto DEPOIS da
          // tentativa.
        } finally {
          conexoes.delete(conexao);
        }
      }
      return encerradas;
    },
    conexoesVivas: () => conexoes.size,
  };

  app.addHook("onClose", async () => {
    await controle.encerrarTodas("desligamento-servidor");
  });

  app.post(CAMINHO_TICKET, async (request: FastifyRequest, reply: FastifyReply) => {
    const verificacao = await opcoes.porta.verificarSessao(request);
    if (!verificacao.ok) {
      return reply.code(401).type(PROBLEM_JSON_MIME_TYPE).send(verificacao.problema);
    }
    const ticket = opcoes.emissorDeTickets.emitir(verificacao.contexto, agora());
    // O VALOR só sai daqui dentro do Set-Cookie — nunca no corpo.
    reply.header(
      "set-cookie",
      montarCookieDeTicket({
        valor: ticket.valor,
        ttlSegundos: ticket.ttlSegundos,
        caminhoDoFluxo: CAMINHO_STREAM,
      }),
    );
    reply.header("cache-control", "no-store");
    const corpo: TicketEventosResposta = {
      expiraEm: ticket.expiraEm,
      ttlSegundos: ticket.ttlSegundos,
      usoUnico: true,
      entregaEm: "cookie",
    };
    return reply.code(201).send(corpo);
  });

  app.get(CAMINHO_STREAM, async (request: FastifyRequest, reply: FastifyReply) => {
    if (detectarParametroProibido(request.query)) {
      return reply
        .code(400)
        .type(PROBLEM_JSON_MIME_TYPE)
        .send(
          problema(
            400,
            "Parâmetro de consulta proibido",
            "Credencial, tenant ou identificador de sujeito não trafegam em query string. Use o ticket por cookie ou o cabeçalho de autorização.",
          ),
        );
    }

    // 1. Handshake — ticket de navegador OU porta (cliente não-navegador).
    const ticketDoCookie = lerTicketDoCookie(request.headers.cookie);
    let contexto: ContextoVerificado;
    if (ticketDoCookie !== undefined) {
      // Consumido AQUI: uso único vale mesmo quando o resto falhar.
      reply.header("set-cookie", montarCookieDeExpurgo(CAMINHO_STREAM));
      const consumo = opcoes.emissorDeTickets.consumir(ticketDoCookie, agora());
      if (!consumo.ok) {
        return reply.code(401).type(PROBLEM_JSON_MIME_TYPE).send(problemaDeTicket());
      }
      contexto = consumo.carga;
    } else {
      const verificacao = await opcoes.porta.verificarSessao(request);
      if (!verificacao.ok) {
        return reply.code(401).type(PROBLEM_JSON_MIME_TYPE).send(verificacao.problema);
      }
      contexto = verificacao.contexto;
    }

    // 2. Ticket válido NÃO é entrega pré-autorizada (ADR-0011 P3).
    const revalidacao = await opcoes.porta.revalidarSessao(contexto);
    if (!revalidacao.permitido) {
      return reply.code(401).type(PROBLEM_JSON_MIME_TYPE).send(problemaDeTicket());
    }

    // 3. Chave escopada — impossível por tipo sem tenant verificado.
    const chave = criarChaveEscopada(contexto, RECURSO_CANAL_EVENTOS);

    // 4. Cursor de retomada.
    const cursor = lerCursorSolicitado(request);
    if (!cursor.ok) {
      return reply
        .code(400)
        .type(PROBLEM_JSON_MIME_TYPE)
        .send(
          problema(
            400,
            "Cursor de retomada inválido",
            "O cursor precisa ser um inteiro não negativo. Reconcilie por polling e reabra o fluxo sem cursor.",
          ),
        );
    }

    const minimoRetomavel = await opcoes.fonte.cursorMinimoRetomavel(chave);

    // 5. A partir daqui a resposta é o fluxo — assumimos o socket.
    //
    // TUDO abaixo roda DEPOIS do `reply.hijack()`, onde uma exceção não
    // tem como virar resposta HTTP: o Fastify já não é dono da resposta, e
    // o cliente ficaria com um socket aberto e mudo. Por isso a região
    // inteira — `writeHead`, criação do escritor e do objeto de conexão
    // incluídas — está protegida, não apenas as chamadas assíncronas
    // (ACHADO 10).
    reply.hijack();
    const bruta = reply.raw;
    let conexao: ConexaoEventos | undefined;
    try {
      bruta.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-store, no-transform",
        connection: "keep-alive",
        // Impede bufferização por proxy reverso — um heartbeat retido é um
        // heartbeat inútil.
        "x-accel-buffering": "no",
        ...(reply.getHeader("set-cookie") === undefined
          ? {}
          : { "set-cookie": String(reply.getHeader("set-cookie")) }),
      });

      const escritor = criarEscritor(bruta);
      conexao = new ConexaoEventos({
        contexto,
        chave,
        opcoes,
        escritor,
        cursorInicial: cursor.cursor,
      });
      const viva = conexao;

      conexoes.add(viva);
      request.raw.on("close", () => {
        viva.encerrarPorDesconexaoDoCliente();
        conexoes.delete(viva);
      });

      // 6. Cursor irretomável ⇒ lacuna EXPLÍCITA (ADR-0011 P4). Nunca se
      //    entrega um "pedaço do meio" fingindo continuidade.
      if (cursor.cursor < minimoRetomavel) {
        await viva.encerrarCom("cursor-irretomavel", minimoRetomavel);
        conexoes.delete(viva);
        return;
      }

      await viva.iniciar();
      if (viva.encerrada) conexoes.delete(viva);
    } catch (erro) {
      // Rede final da região pós-hijack. `encerrarCom` e `iniciar` já não
      // rejeitam; o que sobra aqui é falha do `writeHead`, da fábrica de
      // escritor ou do próprio construtor. O cliente não pode ficar com um
      // socket pendurado por causa disso.
      if (conexao !== undefined) conexoes.delete(conexao);
      try {
        await opcoes.registrarFalha?.("encerrar", erro);
      } catch {
        // observador defeituoso não impede o fechamento do socket
      }
      try {
        if (!bruta.writableEnded) bruta.end();
      } catch {
        // socket já destruído — nada a fazer, e nada a propagar
      }
    }
  });

  return controle;
}

// ---------------------------------------------------------------------------
// Adaptadores para a fiação (o orquestrador aplica; nada aqui edita rota)
// ---------------------------------------------------------------------------

/**
 * Adapta o stub sintético de `apps/api/src/auth.ts` à porta do gateway,
 * SEM importá-lo (a função entra por parâmetro) — assim `ic-identidade-auth`
 * pode substituir a implementação sem tocar neste arquivo.
 *
 * LIMITAÇÃO DECLARADA: o stub não modela expiração nem revogação, logo
 * `revalidarSessao` aqui só reconfirma a forma do contexto. Quando a porta
 * real existir, `revalidarSessao`/`autorizarEntrega` passam a ter conteúdo
 * — e é por isso que os três momentos já são chamados agora: o gateway não
 * precisa mudar quando a autorização ficar real.
 */
export function criarPortaDeStubSintetico(
  autenticar: (request: {
    readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  }) =>
    | { ok: true; contexto: { tenantId: string; atorId: string } }
    | { ok: false; problema: ProblemDetails },
): PortaAutorizacaoEventos {
  return {
    verificarSessao(request) {
      const resultado = autenticar(request);
      if (!resultado.ok) return { ok: false, problema: resultado.problema };
      return {
        ok: true,
        contexto: criarContextoVerificado({
          tenantIdVerificado: resultado.contexto.tenantId,
          atorId: resultado.contexto.atorId,
        }),
      };
    },
    revalidarSessao() {
      return { permitido: true };
    },
    autorizarEntrega() {
      return { permitido: true };
    },
  };
}

/**
 * Adapta `replayEvents` (de `apps/api/src/db.ts`, que NÃO é arquivo deste
 * agente) à `FonteEventosDuraveis`.
 *
 * `replayEvents` não recebe limite; o corte é aplicado aqui. Enquanto não
 * houver poda de outbox (ADR-0010 B4 não implementado — catálogo §3), o
 * piso retomável é `0` porque nada foi podado: um fato medido, não um
 * alvo. Quando a poda existir, basta passar `cursorMinimoRetomavel`.
 */
export function criarFonteDeReplay(argumentos: {
  replay: (parametros: {
    tenantId: string;
    actorId: string;
    cursor: number;
    correlationId: string;
  }) => Promise<EventoFluxo[]>;
  cursorMinimoRetomavel?: (chave: ChaveEscopadaPorTenant) => Promise<number>;
  correlationId?: () => string;
}): FonteEventosDuraveis {
  let contadorDeLeituras = 0;
  return {
    async lerDesde(chave, cursor, limite, atorId) {
      contadorDeLeituras += 1;
      const eventos = await argumentos.replay({
        tenantId: chave.tenantId as string,
        actorId: atorId,
        cursor,
        // Único por leitura: a trilha de auditoria de `replayEvents` usa
        // este valor como chave de idempotência.
        correlationId:
          argumentos.correlationId?.() ??
          `stream-${String(Date.now())}-${String(contadorDeLeituras)}`,
      });
      return eventos.slice(0, limite);
    },
    cursorMinimoRetomavel(chave) {
      return argumentos.cursorMinimoRetomavel?.(chave) ?? Promise.resolve(0);
    },
  };
}
