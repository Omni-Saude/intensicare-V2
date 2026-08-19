/**
 * apps/web/src/eventos/adaptadorNavegador.ts
 *
 * ADAPTADORES REAIS das portas de `./porta.ts`: `fetch` para o ticket efêmero
 * e `EventSource` para o fluxo SSE. Aqui, e só aqui, este módulo toca o
 * navegador.
 *
 * POR QUE TICKET, E NÃO CABEÇALHO. O `EventSource` nativo NÃO envia
 * `Authorization` — é a razão declarada de o gateway aceitar ticket por cookie
 * (`apps/api/src/eventos/ticket.ts`; ADR-0011 §5.3, premissa reversível). A
 * alternativa de pôr credencial na query string é o anti-padrão §10-12, e o
 * gateway a RECUSA com 400 antes de qualquer outra coisa.
 *
 * O QUE ESTE ARQUIVO NUNCA FAZ:
 *   - ler o valor do ticket: ele vem em cookie `HttpOnly` e é, por construção,
 *     invisível ao JavaScript. Nem mesmo se o corpo da resposta trouxesse um
 *     valor por engano ele seria lido — só os quatro campos declarados em
 *     `TicketEventosResposta` são consumidos;
 *   - registrar log: nenhuma chamada a `console` existe neste diretório. Uma
 *     URL de fluxo ou um erro bruto de rede em log é exatamente o vazamento que
 *     o contrato comum §10-12 proíbe;
 *   - propagar o erro bruto de transporte: a porta recebe apenas "falhou".
 *
 * LIMITAÇÃO ESTRUTURAL DECLARADA (não mascarada). O `EventSource` nativo não
 * tem escuta coringa: um quadro com `event:` NOMEADO que este adaptador não
 * registrou é invisível para ele — e ainda assim avança o cursor do servidor.
 * É por isso que a máquina confronta `pulsacao.cursor` com o cursor local
 * (`confrontarCursorDoServidor` em `./maquina.ts`): o tipo desconhecido nomeado
 * é detectado pelo AVANÇO DO CURSOR, não pela escuta. Quadros SEM `event:`
 * chegam pelo tipo padrão `message` e são reportados como desconhecidos.
 *
 * Rastreio: ADR-0011 P3/P4/P8, ADR-0016 §4.1, contrato comum §10 itens 12/13.
 */
import {
  EVENTOS_SSE_CONTROLE,
  TIPOS_EVENTO_FLUXO,
  type TicketEventosResposta,
} from "@intensicare/contratos";
import {
  type AbrirFluxo,
  CAMINHO_TICKET_EVENTOS,
  type EmitirTicket,
  type FluxoAberto,
  montarUrlDoFluxo,
  type QuadroRecebido,
} from "./porta.js";

// ---------------------------------------------------------------------------
// Superfície mínima do transporte nativo
// ---------------------------------------------------------------------------

/** O que o adaptador lê de um quadro entregue pelo `EventSource`. */
export interface MensagemDoTransporte {
  readonly data: string;
  readonly lastEventId?: string;
}

/**
 * Superfície MÍNIMA de `EventSource` usada aqui. Declarada estruturalmente (e
 * não como `EventSource` do lib.dom) porque o jsdom não traz a classe: sem esta
 * interface, o caminho inteiro de push seria inalcançável pela suíte — que é
 * como um defeito de transporte chega à produção sem nunca ficar vermelho.
 */
export interface TransporteSse {
  addEventListener(tipo: string, ouvinte: (evento: MensagemDoTransporte) => void): void;
  close(): void;
}

export type FabricaDeTransporteSse = (
  url: string,
  opcoes: { withCredentials: boolean },
) => TransporteSse;

/** Nome do tipo padrão do SSE — quadro sem campo `event:`. */
const TIPO_PADRAO_SSE = "message";

// ---------------------------------------------------------------------------
// Fluxo
// ---------------------------------------------------------------------------

export interface OpcoesAbridorDeFluxo {
  /** Prefixo da URL. Vazio em dev (o proxy do Vite roteia `/v1/*`). */
  readonly baseUrl?: string;
  /** Fábrica injetável — o jsdom não traz `EventSource`. */
  readonly fabrica?: FabricaDeTransporteSse;
}

export function criarAbridorDeFluxoNavegador(opcoes: OpcoesAbridorDeFluxo = {}): AbrirFluxo {
  const { baseUrl = "" } = opcoes;
  const fabrica: FabricaDeTransporteSse =
    opcoes.fabrica ??
    ((url, init) =>
      new (
        globalThis as unknown as { EventSource: new (u: string, i: unknown) => TransporteSse }
      ).EventSource(url, init));

  return (abertura): FluxoAberto => {
    // O cursor é o ÚNICO parâmetro; `montarUrlDoFluxo` descarta qualquer valor
    // que não seja inteiro não negativo (fail-closed para replay do início).
    let transporte: TransporteSse;
    try {
      transporte = fabrica(montarUrlDoFluxo(abertura.cursor, baseUrl), {
        // Necessário para que o cookie do ticket acompanhe a abertura quando a
        // API não está na mesma origem. O cookie é `HttpOnly; Secure;
        // SameSite=Strict` e tem `Path` restrito à rota do fluxo.
        withCredentials: true,
      });
    } catch {
      /*
        O TRANSPORTE PODE SIMPLESMENTE NÃO EXISTIR — e isso não pode derrubar a
        tela clínica.

        `EventSource` é ausente em ambientes de teste sem DOM, pode ser bloqueado
        por política do navegador e pode falhar na construção. Antes desta
        guarda, a construção lançava DE DENTRO do efeito de abertura, a exceção
        subia pela árvore React e a aplicação inteira caía — levando junto o
        POLLING, que é o caminho de verdade (ADR-0011 P8) e que não depende de
        push nenhum. Perder a tela porque a otimização não pôde ser montada é
        exatamente a inversão que P8 proíbe.

        A falha é reportada como falha de TRANSPORTE, que é o que ela é. A
        máquina então age como age com qualquer queda: reconecta se o servidor
        já anunciou política, ou PARA declarando `sem-politica-de-reconexao`.
        Nunca em silêncio.

        `queueMicrotask` e não chamada direta: `aoFalhaDeTransporte` despacha na
        máquina, e despachar de dentro da execução do efeito que abriu o fluxo
        seria reentrância — o estado corrente ainda está sendo montado.
      */
      queueMicrotask(() => {
        abertura.aoFalhaDeTransporte();
      });
      return { fechar() {} };
    }

    let aberto = false;
    function marcarAbertura(): void {
      if (aberto) return;
      aberto = true;
      abertura.aoAbrir();
    }

    // `open` é o sinal nativo de conexão estabelecida. Nem toda implementação
    // o entrega antes do primeiro quadro, então o primeiro quadro TAMBÉM marca
    // a abertura — a máquina precisa do instante de abertura para estimar a
    // primeira cadência de pulsação.
    transporte.addEventListener("open", () => {
      marcarAbertura();
    });

    function encaminhar(nomeDoEvento: string): (evento: MensagemDoTransporte) => void {
      return (evento) => {
        marcarAbertura();
        const id = evento.lastEventId;
        const quadro: QuadroRecebido = {
          nomeDoEvento,
          dados: evento.data,
          id: id === undefined || id === "" ? null : id,
        };
        abertura.aoQuadro(quadro);
      };
    }

    for (const nome of [...TIPOS_EVENTO_FLUXO, ...EVENTOS_SSE_CONTROLE, TIPO_PADRAO_SSE]) {
      transporte.addEventListener(nome, encaminhar(nome));
    }

    transporte.addEventListener("error", () => {
      // NADA do erro bruto viaja: `error` do `EventSource` não carrega motivo
      // utilizável, e o que ele carregasse não poderia ir para tela nem log.
      abertura.aoFalhaDeTransporte();
    });

    return {
      fechar() {
        transporte.close();
      },
    };
  };
}

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------

export interface OpcoesEmissorDeTicket {
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
  /**
   * Credencial da sessão para o handshake — a MESMA porta usada pelo cliente
   * HTTP (`ProvedorSessao.cabecalhoAutorizacao`).
   *
   * ESTE PARÂMETRO NASCEU DE UM DEFEITO REAL, encontrado pela suíte E2E ao
   * fiar o push na árvore de UI. O emissor confiava apenas em
   * `credentials: "include"`, e a sessão desta fatia é um BEARER EM MEMÓRIA
   * (`api/sessaoDesenvolvimento.ts`), não um cookie: `POST /v1/eventos/ticket`
   * saía ANÔNIMO. O servidor responderia 401, a máquina leria `ticket-recusado`
   * e o push PARARIA — declarando o motivo, mas nunca funcionando. Um recurso
   * que nunca funciona e sempre explica por quê continua sendo um recurso que
   * não funciona.
   *
   * `credentials: "include"` permanece: ele é necessário para o `Set-Cookie` do
   * ticket ser aceito e reenviado na abertura do fluxo. As duas coisas são
   * independentes — uma autentica o PEDIDO, a outra transporta o TICKET.
   */
  readonly autorizacao?: (sinal: AbortSignal) => Promise<string | null>;
}

function respostaDeTicket(corpo: unknown): TicketEventosResposta | null {
  if (typeof corpo !== "object" || corpo === null) return null;
  const bruto = corpo as Record<string, unknown>;
  // SOMENTE os quatro campos declarados são lidos. Se o servidor um dia
  // devolvesse o valor do ticket no corpo (que seria um defeito dele), este
  // cliente continuaria não o enxergando.
  if (typeof bruto.expiraEm !== "string") return null;
  if (typeof bruto.ttlSegundos !== "number") return null;
  if (bruto.usoUnico !== true) return null;
  if (bruto.entregaEm !== "cookie") return null;
  return {
    expiraEm: bruto.expiraEm,
    ttlSegundos: bruto.ttlSegundos,
    usoUnico: true,
    entregaEm: "cookie",
  };
}

/**
 * Emite o ticket efêmero. `credentials: "include"` é obrigatório nas DUAS
 * pontas: é ele que faz o `Set-Cookie` do ticket ser aceito aqui e reenviado na
 * abertura do fluxo.
 *
 * Distinção deliberada de resultado (a máquina age diferente em cada um):
 *   - 401/403 ⇒ `recusado`: decisão do servidor sobre autorização. O push PARA.
 *   - qualquer outra falha ⇒ `indisponivel`: transitório, elegível a nova
 *     tentativa segundo a política de reconexão do servidor.
 */
export function criarEmissorDeTicketNavegador(opcoes: OpcoesEmissorDeTicket = {}): EmitirTicket {
  const { baseUrl = "" } = opcoes;
  const executarFetch: typeof fetch =
    opcoes.fetchImpl ?? ((entrada, inicio) => globalThis.fetch(entrada, inicio));

  return async (sinal: AbortSignal) => {
    // S2: ausência de sessão NUNCA vira requisição anônima — a mesma regra que
    // `api/clienteHttp.ts` aplica a toda chamada clínica. Sem credencial, o
    // pedido NÃO é emitido; a indisponibilidade é transitória e elegível a nova
    // tentativa, ao contrário de uma recusa de autorização do servidor.
    let autorizacao: string | null = null;
    if (opcoes.autorizacao !== undefined) {
      try {
        autorizacao = await opcoes.autorizacao(sinal);
      } catch (erro) {
        if (sinal.aborted) throw erro;
        return { ok: false, motivo: "indisponivel" };
      }
      if (autorizacao === null) return { ok: false, motivo: "indisponivel" };
    }

    let resposta: Response;
    try {
      resposta = await executarFetch(`${baseUrl}${CAMINHO_TICKET_EVENTOS}`, {
        method: "POST",
        signal: sinal,
        credentials: "include",
        headers: {
          accept: "application/json",
          ...(autorizacao === null ? {} : { authorization: autorizacao }),
        },
        cache: "no-store",
      });
    } catch (erro) {
      if (sinal.aborted) throw erro;
      return { ok: false, motivo: "indisponivel" };
    }

    if (resposta.status === 401 || resposta.status === 403) {
      return { ok: false, motivo: "recusado" };
    }
    if (!resposta.ok) return { ok: false, motivo: "indisponivel" };

    const corpo: unknown = await resposta.json().catch(() => null);
    const declarado = respostaDeTicket(corpo);
    if (declarado === null) return { ok: false, motivo: "indisponivel" };
    return { ok: true, resposta: declarado };
  };
}
