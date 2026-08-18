/**
 * apps/web/src/estado/idadeVisao.ts
 *
 * Cálculo PURO da idade da visão (LAC-L1, item 2 do despacho). Sem React, sem
 * I/O, sem `Date.now()` — o instante corrente é sempre um argumento.
 *
 * O QUE ESTE MÓDULO PODE AFIRMAR. Só dois fatos que o frontend de fato conhece:
 * quando ele obteve a última leitura bem-sucedida, e qual é a cadência de
 * recarga que ele mesmo agendou. A partir disso, a única classificação legítima
 * é "a recarga automática está produzindo leitura" × "não está".
 *
 * O QUE ESTE MÓDULO NÃO PODE AFIRMAR (e não afirma). Que o dado clínico está
 * velho, envelhecendo, expirado ou fora de janela. Isso é `EstadoFrescor`,
 * recomputado pelo BACKEND a cada leitura (ADR-0008 N5, ADR-0011 P7 "o cliente
 * não deriva status"), com janelas que são conteúdo de rule release (VAL-0023,
 * `VALIDATION REQUIRED`). Nenhum número deste arquivo é limiar clínico.
 *
 * Rastreio: LAC-L1, ADR-0011 P6/P8, HAZ-0025, SAF-0025, QAS-0023.
 */
import type { IdadeVisao } from "../domain/estados.js";

export interface ResumoIdadeVisao {
  /** Classificação (1ª classe, renderizada e testada) — ver `IdadeVisao`. */
  readonly classe: IdadeVisao;
  /** Idade da última leitura bem-sucedida, em ms. `null` se nunca houve. */
  readonly idadeMs: number | null;
  /**
   * Quantos intervalos INTEIROS de recarga venceram desde a última leitura
   * bem-sucedida. Fato bruto, exibido junto do rótulo: um número que o clínico
   * pode conferir contra o intervalo declarado, em vez de um adjetivo.
   */
  readonly ciclosVencidos: number;
  /** A cadência de recarga usada como referência (premissa de engenharia). */
  readonly intervaloRecargaMs: number;
}

/**
 * A partir de QUANTOS ciclos vencidos a visão é declarada `ciclo_perdido`.
 *
 * DOIS, e a razão não é arbitrária: a recarga é agendada para `1 × intervalo`
 * após o término da leitura anterior, então uma idade entre 1 e 2 intervalos é
 * explicada pela recarga que está EM VOO agora (ida e volta da rede incluídas).
 * Só a partir do segundo intervalo existe um ciclo que venceu e NÃO produziu
 * leitura — aí a afirmação "a atualização automática não está ocorrendo" é
 * verificável, e não um alarme que pisca uma vez por ciclo em regime normal.
 *
 * Isto é uma regra de ENGENHARIA sobre o próprio agendamento desta tela; não é
 * limiar clínico, não é SLO e não é alvo de frescor (contrato comum §3).
 */
export const CICLOS_PARA_DECLARAR_PERDA = 2;

export function calcularIdadeVisao(
  obtidoEmMs: number | null,
  agoraMs: number,
  intervaloRecargaMs: number,
): ResumoIdadeVisao {
  if (obtidoEmMs === null || !Number.isFinite(obtidoEmMs)) {
    return { classe: "sem_leitura", idadeMs: null, ciclosVencidos: 0, intervaloRecargaMs };
  }

  // Relógio para trás (ajuste de horário, resposta com carimbo futuro) não vira
  // idade negativa: vira zero. Uma idade negativa renderizaria "há -3 s", que é
  // ruído, e poderia esconder um `ciclo_perdido` legítimo logo em seguida.
  const idadeMs = Math.max(0, agoraMs - obtidoEmMs);

  // Intervalo não positivo não é referência utilizável: sem cadência declarada
  // não há como afirmar que um ciclo venceu. Fail-closed para "no_ciclo" (a
  // classe que NÃO faz afirmação), com os ciclos zerados.
  if (!Number.isFinite(intervaloRecargaMs) || intervaloRecargaMs <= 0) {
    return { classe: "no_ciclo", idadeMs, ciclosVencidos: 0, intervaloRecargaMs };
  }

  const ciclosVencidos = Math.floor(idadeMs / intervaloRecargaMs);
  return {
    classe: ciclosVencidos >= CICLOS_PARA_DECLARAR_PERDA ? "ciclo_perdido" : "no_ciclo",
    idadeMs,
    ciclosVencidos,
    intervaloRecargaMs,
  };
}
