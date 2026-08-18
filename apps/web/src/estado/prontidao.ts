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
}

export interface ProntidaoObservada {
  /** Última leitura obtida; `null` enquanto não houver nenhuma. */
  readonly leitura: LeituraDeProntidao | null;
  /** `true` quando a prontidão obriga a tela a se declarar degradada. */
  readonly degradada: boolean;
}

export function useProntidao(opcoes: OpcoesProntidao): ProntidaoObservada {
  const { leitor, intervaloRecargaMs = null, relogio } = opcoes;

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
  });

  // FAIL-CLOSED na borda que o leitor não cobre. `criarLeitorDeProntidaoHttp`
  // converte falha de rede em `inalcancavel` e só propaga ABORTO — mas o hook
  // é genérico e um leitor injetado pode rejeitar por outro motivo. Se a
  // máquina de rede terminou em falha e não há leitura, a tela declara "não
  // consegui ler a prontidão", jamais silêncio (SAF-0025).
  const leitura: LeituraDeProntidao | null =
    recurso.dados ??
    (ehEstadoDeFalha(recurso.estadoTela)
      ? { veredito: null, razoes: [], origem: "inalcancavel", statusHttp: null }
      : null);

  return { leitura, degradada: prontidaoObrigaDegradacao(leitura) };
}
