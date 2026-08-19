/**
 * apps/web/src/estado/prontidao.ts
 *
 * Hook que mantém a declaração de prontidão do serviço viva na tela clínica.
 *
 * Reusa `useRecursoRemoto` de propósito, e o ganho não é economia de linhas: a
 * prontidão herda de graça o cancelamento REAL na desmontagem (I5), o tempo
 * limite, o tratamento final obrigatório de rejeição (nenhuma Promise solta) e
 * a MESMA recarga periódica da projeção clínica. Uma prontidão lida uma única
 * vez no carregamento envelheceria exatamente como a grade envelhecia — o
 * defeito que este trabalho existe para eliminar (LAC-L1/LAC-L2).
 *
 * Rastreio: ADR-0011 P6/P8, ADR-0020 O4, SAF-0025, QAS-0023, HAZ-0025.
 */
import { useCallback } from "react";
import {
  buscaDeProntidao,
  type LeitorDeProntidao,
  type LeituraDeProntidao,
  leituraInalcancavel,
  prontidaoObrigaDegradacao,
} from "../api/prontidao.js";
import type { RespostaApi } from "../api/tipos.js";
import { ehEstadoDeFalha, useRecursoRemoto } from "./recursoRemoto.js";
import type { Relogio } from "./relogio.js";

export interface OpcoesProntidao {
  /**
   * `null` desliga a observação de prontidão nesta montagem. Não é uma
   * degradação silenciosa: com `null` a tela não AFIRMA nada sobre prontidão
   * (nem "pronto", nem "degradado"), e `AvisoProntidao` não renderiza. O
   * caminho real de execução (`App`) sempre fornece um leitor.
   */
  readonly leitor: LeitorDeProntidao | null;
  readonly intervaloRecargaMs?: number | null;
  readonly relogio?: Relogio;
  /** Jitter da recarga periódica — injetável para teste determinístico. */
  readonly sortear?: () => number;
}

export interface ProntidaoObservada {
  /** Última leitura obtida; `null` enquanto não houver nenhuma. */
  readonly leitura: LeituraDeProntidao | null;
  /** `true` quando a prontidão obriga a tela a se declarar degradada. */
  readonly degradada: boolean;
}

export function useProntidao(opcoes: OpcoesProntidao): ProntidaoObservada {
  const { leitor, intervaloRecargaMs = null, relogio, sortear } = opcoes;

  const buscar = useCallback(
    async (sinal: AbortSignal): Promise<RespostaApi<LeituraDeProntidao>> => {
      // `habilitado: false` já impede a chamada quando não há leitor; o ramo
      // existe para que a função continue total e o tipo não precise mentir.
      if (leitor === null) {
        return { estadoCarregamento: "vazio", dados: null, problema: null };
      }
      return await buscaDeProntidao(leitor)(sinal);
    },
    [leitor],
  );

  const recurso = useRecursoRemoto<LeituraDeProntidao>({
    buscar,
    habilitado: leitor !== null,
    intervaloRecargaMs,
    ...(relogio !== undefined ? { relogio } : {}),
    ...(sortear !== undefined ? { sortear } : {}),
  });

  // FAIL-CLOSED, E ANTES DO DADO ANTERIOR — a ordem é o defeito P1 corrigido
  // aqui (revisão adversarial do PR #8).
  //
  // A versão anterior era `recurso.dados ?? (ehEstadoDeFalha(...) ? ... : null)`:
  // o fail-closed vinha DEPOIS do `??` e, portanto, só disparava quando não
  // havia NENHUMA leitura anterior. Bastava um `ready` bem-sucedido no
  // carregamento para que toda falha ou tempo esgotado posterior fosse
  // absorvido em silêncio — `recurso.dados` continuava sendo aquele `ready`,
  // `prontidaoObrigaDegradacao` devolvia `false`, e a tela seguia calma com a
  // leitura de prontidão MORTA. É literalmente o "appear healthy" que SAF-0025
  // proíbe, e o anti-padrão 14 do contrato comum ("exibir dado stale como atual
  // após erro") aplicado justamente ao insumo que existe para denunciar
  // degradação.
  //
  // POR QUE `inalcancavel` E NÃO O DADO ROTULADO. Para a projeção clínica, a
  // resposta certa a uma falha de recarga é preservar o conteúdo MARCADO como
  // desatualizado (invariante I2 de `recursoRemoto.ts`): o clínico ainda tira
  // valor de um NEWS2 de três minutos atrás, desde que saiba a idade dele. A
  // prontidão é o contrário: ela é uma AFIRMAÇÃO SOBRE O AGORA ("o serviço tem
  // capacidade segura neste instante"), e uma afirmação dessas envelhecida não
  // é informação parcial — é informação errada. Então a leitura velha não é
  // exibida rotulada; ela deixa de contar, e a tela declara o que de fato sabe:
  // não conseguiu ler a prontidão.
  //
  // `ehEstadoDeFalha` cobre `erro` (rejeição não-abortada), `tempo_esgotado`,
  // `indisponivel` e `proibido`. Aborto NÃO produz nenhum desses (I5), então
  // desmontar ou trocar de recurso não gera aviso espúrio.
  const leitura: LeituraDeProntidao | null = ehEstadoDeFalha(recurso.estadoTela)
    ? leituraInalcancavel()
    : recurso.dados;

  return { leitura, degradada: prontidaoObrigaDegradacao(leitura) };
}
