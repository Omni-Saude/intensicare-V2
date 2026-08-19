/**
 * apps/web/src/estado/reconciliacaoObservada.ts
 *
 * A PONTE ENTRE "PEDI UMA RELEITURA" E "UMA LEITURA DE FATO ACONTECEU".
 *
 * O DEFEITO QUE ESTE MÓDULO FECHA (ACH-O3-9). A máquina de push
 * (`../eventos/maquina.ts`) só pode declarar `reconciled` depois de a projeção
 * autoritativa ter sido relida — é a única coisa que autoriza o cliente a dizer
 * "estou alinhado" (ADR-0011 P8). A fiação, porém, entregava ao hook um
 * `reconciliar` que apenas incrementava um contador e devolvia `void`. O hook
 * fazia `await` sobre `undefined`, que resolve na microtarefa seguinte, e a
 * máquina despachava `reconciliacao-concluida` ANTES de qualquer requisição
 * sair. A tela anunciava "Sincronizado — dados reconciliados após reconexão.",
 * tom informativo, no exato instante em que o cliente SABE ter perdido um
 * evento: o núcleo de HAZ-0025 e o oposto literal de SAF-0025.
 *
 * O QUE É O "FATO DE LEITURA" AQUI. Não é "o pedido saiu", nem "o contador
 * mudou": é uma leitura BEM-SUCEDIDA, com instante próprio (`obtidoEm`), que
 * COMEÇOU depois do pedido. O "depois" é decidido pelo número do sinal que a
 * tela já havia consumido quando a busca começou — e não por relógio, que
 * empataria com requisições em voo.
 *
 * POR QUE A COMPARAÇÃO POR SINAL, E NÃO POR AVANÇO DE `obtidoEm` SOZINHO. Uma
 * releitura periódica que já estava em voo quando o evento chegou também faz
 * `obtidoEm` avançar — e ela é anterior ao evento, logo pode não conter o que o
 * evento anunciou. Aceitá-la seria declarar reconciliação com base numa leitura
 * que não podia saber do fato. `sinalNoInicio >= sinalDoPedido` é a condição
 * exata: só responde ao pedido a leitura que começou depois dele.
 *
 * FAIL-CLOSED EM TODA BORDA. Leitura que falha, leitura sem `obtidoEm`,
 * desmontagem com pedido pendente — tudo devolve `null`. `null` significa
 * "nenhuma leitura respondeu": a lacuna CONTINUA aberta, a tela segue
 * declarando degradação, e quem tenta de novo é a releitura periódica de
 * `./recursoRemoto.ts`. Nunca há caminho pelo qual a ausência de evidência
 * produza `reconciliado`.
 *
 * Rastreio: ADR-0011 P7/P8, HAZ-0025, SAF-0025, QAS-0023, ACH-O3-9, ACH-O3-14.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { FatoDeLeitura, ReconciliarPorPolling } from "../eventos/porta.js";

/** O que uma tela relata ao terminar uma leitura da projeção autoritativa. */
export interface RelatoDeLeitura {
  /**
   * Valor de `sinalDeReleitura` que esta tela já havia consumido no instante em
   * que a busca COMEÇOU. É este número — não o do término — que decide a qual
   * pedido a leitura responde.
   */
  readonly sinalNoInicio: number;
  /** Instante ISO da última leitura bem-sucedida ao fim desta busca. */
  readonly obtidoEm: string | null;
  /** A busca terminou em estado de falha (erro, indisponível, tempo esgotado…). */
  readonly falhou: boolean;
}

export interface ReconciliacaoObservada {
  /**
   * Contador que desce às telas. Quando AVANÇA, a tela relê a projeção
   * autoritativa. É o único contador que desce: ver a nota em `../App.tsx`.
   */
  readonly sinal: number;
  /** Passado a `useFluxoDeEventos` como `reconciliar`. */
  readonly pedirReleitura: ReconciliarPorPolling;
  /** Chamado pela tela ao fim de cada leitura. */
  readonly relatarLeitura: (relato: RelatoDeLeitura) => void;
}

interface PedidoPendente {
  readonly sinal: number;
  readonly responder: (fato: FatoDeLeitura | null) => void;
}

export function useReconciliacaoObservada(): ReconciliacaoObservada {
  const [sinal, setSinal] = useState(0);
  // O contador vive num ref ALÉM do estado porque o pedido precisa conhecer o
  // PRÓPRIO número no instante em que é criado — uma atualização funcional de
  // estado só o revelaria no render seguinte, e o pedido já teria sido enfileirado.
  const proximoSinalRef = useRef(0);
  const pendentesRef = useRef<PedidoPendente[]>([]);

  const pedirReleitura = useCallback<ReconciliarPorPolling>(() => {
    proximoSinalRef.current += 1;
    const sinalDoPedido = proximoSinalRef.current;
    setSinal(sinalDoPedido);
    return new Promise<FatoDeLeitura | null>((responder) => {
      pendentesRef.current.push({ sinal: sinalDoPedido, responder });
    });
  }, []);

  const relatarLeitura = useCallback((relato: RelatoDeLeitura) => {
    const pendentes = pendentesRef.current;
    if (pendentes.length === 0) return;

    const atendidos: PedidoPendente[] = [];
    const restantes: PedidoPendente[] = [];
    for (const pedido of pendentes) {
      // Só responde ao pedido a leitura que COMEÇOU depois dele.
      if (relato.sinalNoInicio >= pedido.sinal) atendidos.push(pedido);
      else restantes.push(pedido);
    }
    if (atendidos.length === 0) return;

    pendentesRef.current = restantes;
    const fato: FatoDeLeitura | null =
      !relato.falhou && relato.obtidoEm !== null && relato.obtidoEm !== ""
        ? { obtidoEm: relato.obtidoEm }
        : null;
    for (const pedido of atendidos) pedido.responder(fato);
  }, []);

  // Nenhuma Promise fica pendurada além da vida da casca (contrato comum §10-13).
  // Desmontar responde `null`: nada foi lido, e a lacuna permanece aberta.
  useEffect(
    () => () => {
      const pendentes = pendentesRef.current;
      pendentesRef.current = [];
      for (const pedido of pendentes) pedido.responder(null);
    },
    [],
  );

  return { sinal, pedirReleitura, relatarLeitura };
}

// ---------------------------------------------------------------------------
// Lado da TELA: detectar o início e o fim de cada leitura
// ---------------------------------------------------------------------------

export interface EntradaDeRelatorio {
  /** `true` enquanto uma busca está em voo (`useRecursoRemoto`). */
  readonly buscaEmCurso: boolean;
  readonly obtidoEm: string | null;
  /** O estado de tela corrente é de falha. */
  readonly falhou: boolean;
  /** Sinal de releitura que ESTA tela recebe por prop. */
  readonly sinal: number;
  /** Ausente = esta montagem não relata nada a ninguém. */
  readonly relatar: ((relato: RelatoDeLeitura) => void) | undefined;
}

/**
 * Relata o INÍCIO e o FIM de cada leitura da projeção.
 *
 * A borda de subida de `buscaEmCurso` congela o sinal que a tela já havia
 * consumido; a de descida relata o resultado com aquele número. É por isso que
 * uma releitura periódica já em voo quando o evento chegou não pode ser
 * confundida com a resposta ao evento — ela carrega o sinal ANTERIOR.
 *
 * `useRecursoRemoto` colabora sem saber deste módulo: ao trocar de pedido ele
 * ABORTA a busca anterior e o efeito encerrado não mexe mais em
 * `buscaEmCurso`. Logo não existe descida órfã de uma busca cancelada.
 */
export function useRelatorioDeLeitura(entrada: EntradaDeRelatorio): void {
  const { buscaEmCurso, obtidoEm, falhou, sinal, relatar } = entrada;
  const emCursoAnteriorRef = useRef(buscaEmCurso);
  const sinalNoInicioRef = useRef(sinal);
  const relatarRef = useRef(relatar);
  relatarRef.current = relatar;

  useEffect(() => {
    const anterior = emCursoAnteriorRef.current;
    emCursoAnteriorRef.current = buscaEmCurso;

    if (!anterior && buscaEmCurso) {
      sinalNoInicioRef.current = sinal;
      return;
    }
    if (anterior && !buscaEmCurso) {
      relatarRef.current?.({ sinalNoInicio: sinalNoInicioRef.current, obtidoEm, falhou });
    }
  }, [buscaEmCurso, obtidoEm, falhou, sinal]);
}
