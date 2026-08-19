/**
 * apps/web/src/eventos/useFluxoDeEventos.ts
 *
 * Hook FINO: liga a máquina pura de `./maquina.ts` ao mundo (transporte,
 * relógio, polling) e devolve à tela apenas o que ela pode afirmar.
 *
 * DIVISÃO DE TRABALHO. Toda decisão vive na máquina pura; aqui só há execução
 * de `Efeito`. É por isso que os sete passos de `CONTRATO_CLIENTE_EVENTOS` são
 * testados sem DOM e sem temporizador real, e este arquivo precisa apenas
 * provar que executa o que a máquina manda e que cancela tudo ao desmontar.
 *
 * O QUE ESTE HOOK ENTREGA À TELA — e o que ele deliberadamente NÃO entrega.
 * Entrega: estado de conexão (vocabulário do fio e da 5ª família da UI), a
 * descrição pt-BR pronta do contrato, um booleano ADITIVO de degradação, o
 * cursor e um contador de sinais de releitura. NÃO entrega dado clínico algum:
 * o evento diz QUE releia, e quem relê é a projeção autoritativa via `reconciliar`
 * (ADR-0011 P7/P8). Não há caminho pelo qual uma carga de evento chegue à UI.
 *
 * CANCELAMENTO REAL. Desmontar fecha o transporte, cancela vigia e reconexão e
 * aborta a emissão de ticket em voo. Nenhuma Promise sai daqui sem tratamento
 * final (contrato comum §10-13).
 *
 * Rastreio: ADR-0011 P3/P4/P5/P6/P7/P8, HAZ-0025, SAF-0025, LAC-L1.
 */
import {
  DESCRICAO_ESTADO_CONEXAO,
  type EstadoConexao,
  type MensagemInstrucaoReconciliacao,
  type PoliticaReconexao,
} from "@intensicare/contratos";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EstadoConectividade } from "../domain/estados.js";
import { type IdAgendamento, RELOGIO_DO_NAVEGADOR, type Relogio } from "../estado/relogio.js";
import {
  type Efeito,
  type EstadoFluxo,
  type EventoDaMaquina,
  estadoInicialFluxo,
  type MotivoDeLacuna,
  type MotivoDeParada,
  pushDegradaATela,
  reduzirFluxo,
} from "./maquina.js";
import {
  type AbrirFluxo,
  CONECTIVIDADE_POR_ESTADO_CONEXAO,
  type EmitirTicket,
  ehFatoDeLeitura,
  type FluxoAberto,
  type ReconciliarPorPolling,
} from "./porta.js";

export interface OpcoesFluxoDeEventos {
  /** Porta de transporte. `./adaptadorNavegador.ts` traz a implementação real. */
  readonly abrirFluxo: AbrirFluxo;
  /** Porta de handshake — ticket efêmero de uso único, entregue por cookie. */
  readonly emitirTicket: EmitirTicket;
  /**
   * Releitura da projeção AUTORITATIVA. É o caminho de verdade (ADR-0011 P8);
   * o push só decide QUANDO chamá-la. Na árvore de UI isto é a fiação de
   * `../estado/reconciliacaoObservada.ts`, que devolve o FATO da leitura feita
   * por `useRecursoRemoto`.
   *
   * A ASSINATURA EXIGE EVIDÊNCIA, e isso é o fecho de ACH-O3-9. Antes ela era
   * `() => void | Promise<void>`: a fiação real devolvia `void`, o `await` sobre
   * `undefined` resolvia na microtarefa seguinte, e a reconciliação era dada por
   * concluída ANTES de qualquer leitura. Agora `void` não é atribuível, e quem
   * não leu nada só pode devolver `null` — caso em que a lacuna CONTINUA aberta.
   */
  readonly reconciliar: ReconciliarPorPolling;
  /** Porta de tempo (`../estado/relogio.ts`) — injetável para teste. */
  readonly relogio?: Relogio;
  /** Quando `false`, nenhum ticket é pedido e nenhum fluxo é aberto. */
  readonly habilitado?: boolean;
  /**
   * Política de reconexão conhecida antes de o servidor anunciar a sua.
   *
   * DEIXOU DE SER NECESSÁRIA, e continua sem padrão. O contrato passou a
   * anunciar `reconexao` já no PRIMEIRO quadro (`estado-conexao`), de modo que
   * uma queda depois da abertura reconecta com a política DO SERVIDOR sem que
   * ninguém precise semeá-la aqui. Ela sobrevive como semente para o caso
   * estreito que resta: queda ANTES do primeiro quadro (por exemplo, o ticket
   * indisponível na primeira tentativa). Sem semente, esse caso continua
   * PARANDO explicitamente (`sem-politica-de-reconexao`) — e parar declarando o
   * motivo é o comportamento correto: backoff/jitter são dirigidos pelo
   * servidor (ADR-0011 P5) e este cliente não inventa os números.
   */
  readonly politicaReconexaoInicial?: PoliticaReconexao;
  /** Fonte de aleatoriedade do jitter — injetável para teste determinístico. */
  readonly sortear?: () => number;
}

export interface FluxoDeEventosObservado {
  /** Estado no vocabulário do FIO (ADR-0011 P6). */
  readonly estadoConexao: EstadoConexao;
  /**
   * O mesmo estado na 5ª família da UI (`../domain/estados.ts`) — ou `null`
   * enquanto o push NÃO se provou vivo.
   *
   * POR QUE `null` (ACH-O3-11). Só `reproduzindo` e `reconciliado` chegam à tela
   * por este caminho (`refinarComEstadoDoPush`), e eles são INFORMATIVOS. Numa
   * janela em que os estados GRAVES do fio são mudos — a janela anterior à prova
   * de vida, em que a tela ainda não depende do push —, promover um informativo
   * seria inverter a precedência: a tela falaria do fio só quando o que há a
   * dizer é brando. `null` torna essa promoção estruturalmente impossível, em
   * vez de depender de qual estado chegou primeiro.
   */
  readonly conectividade: EstadoConectividade | null;
  /** Descrição pt-BR pronta — vem do contrato, não é redigida aqui. */
  readonly descricao: string;
  /**
   * O push tem algo CONTRA a tela? Booleano ADITIVO: `false` significa "o push
   * não acusa nada", jamais "a tela está em dia". Componha com `||` junto das
   * origens de degradação que já existem no ponto de uso.
   */
  readonly degradado: boolean;
  /** Cursor durável de retomada. */
  readonly cursor: number | null;
  /** Quantas vezes o servidor sinalizou que há algo novo a reler. */
  readonly sinalDeReleitura: number;
  readonly lacunas: number;
  readonly ultimaLacuna: MotivoDeLacuna | null;
  /** Instrução recebida e ainda não cumprida (traz motivo, ação e descrição). */
  readonly instrucaoPendente: MensagemInstrucaoReconciliacao | null;
  /** Por que o push parou, quando parou. Nunca morre em silêncio. */
  readonly motivoDeParada: MotivoDeParada | null;
}

export function useFluxoDeEventos(opcoes: OpcoesFluxoDeEventos): FluxoDeEventosObservado {
  const {
    abrirFluxo,
    emitirTicket,
    reconciliar,
    habilitado = true,
    relogio = RELOGIO_DO_NAVEGADOR,
    sortear = Math.random,
  } = opcoes;

  // Dependências injetadas vivem em refs para que `despachar` possa ser
  // estável: um `despachar` recriado a cada render remontaria o efeito de
  // ciclo de vida e reabriria o fluxo sem parar. Mesmo padrão já usado em
  // `../estado/recursoRemoto.ts`.
  const abrirRef = useRef(abrirFluxo);
  abrirRef.current = abrirFluxo;
  const ticketRef = useRef(emitirTicket);
  ticketRef.current = emitirTicket;
  const reconciliarRef = useRef(reconciliar);
  reconciliarRef.current = reconciliar;
  const relogioRef = useRef(relogio);
  relogioRef.current = relogio;
  const sortearRef = useRef(sortear);
  sortearRef.current = sortear;
  const politicaRef = useRef(opcoes.politicaReconexaoInicial);
  politicaRef.current = opcoes.politicaReconexaoInicial;

  const estadoRef = useRef<EstadoFluxo>(estadoInicialFluxo(opcoes.politicaReconexaoInicial));
  const [visao, setVisao] = useState<EstadoFluxo>(estadoRef.current);

  const fluxoRef = useRef<FluxoAberto | null>(null);
  const vigiaRef = useRef<IdAgendamento | null>(null);
  const reconexaoRef = useRef<IdAgendamento | null>(null);
  const controladorRef = useRef<AbortController | null>(null);
  // Quebra a recursão entre executar um efeito e despachar o evento que ele
  // produz, sem tornar nenhum dos dois instável.
  const despacharRef = useRef<(evento: EventoDaMaquina) => void>(() => undefined);

  const executar = useCallback((efeito: Efeito) => {
    const relogioAtual = relogioRef.current;

    function cancelarVigia(): void {
      if (vigiaRef.current === null) return;
      relogioAtual.cancelar(vigiaRef.current);
      vigiaRef.current = null;
    }

    switch (efeito.tipo) {
      case "emitir-ticket": {
        controladorRef.current?.abort();
        const controlador = new AbortController();
        controladorRef.current = controlador;
        void (async () => {
          try {
            const resultado = await ticketRef.current(controlador.signal);
            if (controlador.signal.aborted) return;
            const agoraMs = relogioRef.current.agoraMs();
            if (resultado.ok) {
              despacharRef.current({ tipo: "ticket-emitido", agoraMs });
              return;
            }
            if (resultado.motivo === "recusado") {
              // Decisão do servidor sobre AUTORIZAÇÃO: insistir é martelar 401.
              despacharRef.current({ tipo: "ticket-recusado", agoraMs });
              return;
            }
            // Indisponibilidade é transitória: trata-se como queda de
            // transporte e a reconexão segue a política DO SERVIDOR.
            despacharRef.current({
              tipo: "falha-de-transporte",
              agoraMs,
              sorteio: sortearRef.current(),
            });
          } catch {
            // Nada do erro bruto é lido, exibido ou registrado.
            if (controlador.signal.aborted) return;
            despacharRef.current({
              tipo: "falha-de-transporte",
              agoraMs: relogioRef.current.agoraMs(),
              sorteio: sortearRef.current(),
            });
          }
        })().catch(() => {
          /* já tratado acima; nada escapa deste hook. */
        });
        break;
      }

      case "abrir-fluxo": {
        fluxoRef.current?.fechar();
        fluxoRef.current = abrirRef.current({
          cursor: efeito.cursor,
          aoAbrir: () => {
            despacharRef.current({
              tipo: "fluxo-aberto",
              agoraMs: relogioRef.current.agoraMs(),
            });
          },
          aoQuadro: (quadro) => {
            despacharRef.current({
              tipo: "quadro",
              quadro,
              agoraMs: relogioRef.current.agoraMs(),
            });
          },
          aoFalhaDeTransporte: () => {
            despacharRef.current({
              tipo: "falha-de-transporte",
              agoraMs: relogioRef.current.agoraMs(),
              sorteio: sortearRef.current(),
            });
          },
        });
        break;
      }

      case "fechar-fluxo": {
        fluxoRef.current?.fechar();
        fluxoRef.current = null;
        break;
      }

      case "armar-vigia-de-silencio": {
        cancelarVigia();
        vigiaRef.current = relogioAtual.agendar(() => {
          vigiaRef.current = null;
          despacharRef.current({
            tipo: "silencio-detectado",
            agoraMs: relogioRef.current.agoraMs(),
            sorteio: sortearRef.current(),
          });
        }, efeito.prazoMs);
        break;
      }

      case "cancelar-vigia-de-silencio": {
        cancelarVigia();
        break;
      }

      case "agendar-reconexao": {
        if (reconexaoRef.current !== null) relogioAtual.cancelar(reconexaoRef.current);
        reconexaoRef.current = relogioAtual.agendar(() => {
          reconexaoRef.current = null;
          despacharRef.current({
            tipo: "reconectar-agora",
            agoraMs: relogioRef.current.agoraMs(),
          });
        }, efeito.esperaMs);
        break;
      }

      case "reconciliar-por-polling": {
        void (async () => {
          try {
            const fato = await reconciliarRef.current();
            // SÓ UM FATO DE LEITURA CONCLUI A RECONCILIAÇÃO (ACH-O3-9). `null`
            // (ou qualquer coisa que não seja um fato completo) significa que
            // nenhuma leitura bem-sucedida respondeu a este pedido: a lacuna
            // continua aberta e a tela segue declarando degradação.
            if (!ehFatoDeLeitura(fato)) {
              despacharRef.current({ tipo: "reconciliacao-falhou" });
              return;
            }
            despacharRef.current({
              tipo: "reconciliacao-concluida",
              agoraMs: relogioRef.current.agoraMs(),
              sorteio: sortearRef.current(),
              obtidoEm: fato.obtidoEm,
            });
          } catch {
            // A lacuna CONTINUA aberta: a tela segue declarando degradação, e
            // a recarga periódica de `useRecursoRemoto` é quem tenta de novo.
            despacharRef.current({ tipo: "reconciliacao-falhou" });
          }
        })().catch(() => {
          /* já tratado acima. */
        });
        break;
      }

      default:
        break;
    }
  }, []);

  const despachar = useCallback(
    (evento: EventoDaMaquina) => {
      const transicao = reduzirFluxo(estadoRef.current, evento);
      estadoRef.current = transicao.estado;
      setVisao(transicao.estado);
      for (const efeito of transicao.efeitos) executar(efeito);
    },
    [executar],
  );
  despacharRef.current = despachar;

  useEffect(() => {
    if (!habilitado) return;

    // REMONTAGEM recomeça a máquina — inclusive o duplo efeito do StrictMode,
    // que desmonta e remonta com os mesmos refs. Sem este recomeço, a máquina
    // ficaria `parado` por "desmontado" e o push morreria em silêncio no
    // ambiente de desenvolvimento. O cursor e a política APRENDIDA sobrevivem:
    // retomar exatamente do ponto é a razão de o cursor existir.
    const anterior = estadoRef.current;
    estadoRef.current = {
      ...estadoInicialFluxo(politicaRef.current),
      cursor: anterior.cursor,
      politicaReconexao: anterior.politicaReconexao ?? politicaRef.current ?? null,
    };
    setVisao(estadoRef.current);
    despachar({ tipo: "montar", agoraMs: relogioRef.current.agoraMs() });

    return () => {
      // `desmontar` já emite fechamento do fluxo e cancelamento do vigia; o que
      // sobra aqui é o que nenhum efeito da máquina cobre.
      despachar({ tipo: "desmontar" });
      controladorRef.current?.abort();
      controladorRef.current = null;
      if (reconexaoRef.current !== null) {
        relogioRef.current.cancelar(reconexaoRef.current);
        reconexaoRef.current = null;
      }
      if (vigiaRef.current !== null) {
        relogioRef.current.cancelar(vigiaRef.current);
        vigiaRef.current = null;
      }
      fluxoRef.current?.fechar();
      fluxoRef.current = null;
    };
  }, [habilitado, despachar]);

  return useMemo(
    () => ({
      estadoConexao: visao.estadoConexao,
      conectividade: visao.seProvouVivo
        ? CONECTIVIDADE_POR_ESTADO_CONEXAO[visao.estadoConexao]
        : null,
      descricao: DESCRICAO_ESTADO_CONEXAO[visao.estadoConexao],
      degradado: pushDegradaATela(visao),
      cursor: visao.cursor,
      sinalDeReleitura: visao.sinalDeReleitura,
      lacunas: visao.lacunas,
      ultimaLacuna: visao.ultimaLacuna,
      instrucaoPendente: visao.instrucaoPendente,
      motivoDeParada: visao.motivoDeParada,
    }),
    [visao],
  );
}
