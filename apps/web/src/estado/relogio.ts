/**
 * apps/web/src/estado/relogio.ts
 *
 * PORTA DE TEMPO — leitura do instante corrente e agendamento, injetáveis.
 *
 * POR QUE ESTA PORTA EXISTE. A partir de LAC-L1 a tela de vigilância passa a
 * ter comportamento que DEPENDE DA PASSAGEM DO TEMPO (recarga autoritativa
 * periódica e idade da visão). Um teste que dependa de `Date.now()` real e de
 * `setTimeout` real só consegue provar esse comportamento esperando de fato —
 * o que produz suíte lenta, intermitente e, pior, testes que passam por
 * coincidência de escalonamento. Este repositório já pagou por relógio não
 * injetado (`HANDOFF.yaml`, chave `DATA`: "bomba-relógio").
 *
 * A porta é deliberadamente MÍNIMA: ler o agora em ms, agendar uma única
 * execução futura, cancelar um agendamento. Nada de intervalo repetitivo
 * (`setInterval`) — um intervalo repetitivo dispara mesmo com a execução
 * anterior ainda em voo, que é exatamente a sobreposição de requisições que a
 * recarga periódica não pode ter.
 *
 * FRONTEIRA CLÍNICA. Nada aqui decide janela, limiar ou horizonte de frescor
 * clínico (VAL-0023, `VALIDATION REQUIRED`). Esta porta só sabe contar
 * milissegundos de relógio de parede do navegador.
 *
 * Rastreio: ADR-0011 P8 (polling é o caminho de verdade), LAC-L1, HAZ-0025,
 * SAF-0025.
 */

/** Identificador opaco de um agendamento. */
export type IdAgendamento = number;

export interface Relogio {
  /** Instante corrente em milissegundos desde a época. */
  agoraMs(): number;
  /** Agenda UMA execução daqui a `atrasoMs`. Devolve o identificador. */
  agendar(callback: () => void, atrasoMs: number): IdAgendamento;
  /** Cancela um agendamento. Cancelar um identificador já disparado é no-op. */
  cancelar(id: IdAgendamento): void;
}

/**
 * Relógio real do navegador. `setTimeout` em ambiente DOM devolve `number`;
 * a conversão explícita evita o `Timeout` do Node quando a suíte roda em
 * jsdom com tipos de Node no escopo.
 */
export const RELOGIO_DO_NAVEGADOR: Relogio = {
  agoraMs: () => Date.now(),
  agendar: (callback, atrasoMs) => globalThis.setTimeout(callback, atrasoMs) as unknown as number,
  cancelar: (id) => {
    globalThis.clearTimeout(id);
  },
};
