/**
 * apps/web/src/teste/relogioDeTeste.ts
 *
 * Relógio determinístico para os testes que dependem de passagem de tempo.
 * Vive em `src/teste/` (importado apenas por `*.test.*`) para não entrar no
 * pacote emitido; a guarda de artefato sintético continua sendo a defesa de
 * build.
 *
 * POR QUE NÃO `vi.useFakeTimers()`. Os temporizadores falsos do vitest
 * substituem o `setTimeout` GLOBAL, e portanto também o do React, do jsdom e
 * de `@testing-library/user-event` — o que mistura o tempo que o teste quer
 * controlar com o tempo que a biblioteca de testes usa internamente. Aqui o
 * tempo é uma DEPENDÊNCIA INJETADA do código sob teste (`Relogio`): avançar o
 * relógio de teste não afeta mais nada do processo, e o teste falha se o
 * código sob teste ler o relógio real por engano — porque então nada acontece.
 *
 * GUARDA DE NÃO-VACUIDADE. `disparos` conta quantos agendamentos de fato
 * executaram. Um teste que afirme "a contagem cresceu" pode exigir também que
 * `disparos` tenha crescido — provando que o crescimento veio de tempo
 * avançado, e não de uma renderização a mais.
 */
import type { IdAgendamento, Relogio } from "../estado/relogio.js";

export interface RelogioDeTeste extends Relogio {
  /** Avança o tempo, disparando em ordem tudo que vencer no caminho. */
  avancar(ms: number): void;
  /** Quantos agendamentos já dispararam (guarda de não-vacuidade). */
  readonly disparos: number;
  /** Quantos agendamentos estão pendentes agora (detecta vazamento). */
  readonly pendentes: number;
}

interface Agendado {
  readonly quando: number;
  readonly callback: () => void;
}

/** Instante inicial fixo e sintético — nunca `Date.now()`. */
export const INSTANTE_INICIAL_DE_TESTE = Date.UTC(2026, 7, 17, 12, 0, 0);

/** Teto de disparos por `avancar`, para que um laço de reagendamento falhe alto. */
const LIMITE_DE_DISPAROS = 10_000;

export function criarRelogioDeTeste(inicioMs: number = INSTANTE_INICIAL_DE_TESTE): RelogioDeTeste {
  let agora = inicioMs;
  let proximoId = 1;
  let disparos = 0;
  const agendados = new Map<IdAgendamento, Agendado>();

  function proximoVencido(alvo: number): { id: IdAgendamento; item: Agendado } | null {
    let escolhido: { id: IdAgendamento; item: Agendado } | null = null;
    for (const [id, item] of agendados) {
      if (item.quando > alvo) continue;
      if (escolhido === null || item.quando < escolhido.item.quando) {
        escolhido = { id, item };
      }
    }
    return escolhido;
  }

  return {
    agoraMs: () => agora,

    agendar(callback: () => void, atrasoMs: number): IdAgendamento {
      const id = proximoId;
      proximoId += 1;
      agendados.set(id, { quando: agora + Math.max(0, atrasoMs), callback });
      return id;
    },

    cancelar(id: IdAgendamento): void {
      agendados.delete(id);
    },

    avancar(ms: number): void {
      const alvo = agora + ms;
      let guarda = 0;
      for (;;) {
        guarda += 1;
        if (guarda > LIMITE_DE_DISPAROS) {
          throw new Error(
            `Relógio de teste: mais de ${LIMITE_DE_DISPAROS} disparos ao avançar ${ms} ms — ` +
              "provável reagendamento em laço sem avanço de tempo.",
          );
        }
        const vencido = proximoVencido(alvo);
        if (vencido === null) break;
        agendados.delete(vencido.id);
        agora = vencido.item.quando;
        disparos += 1;
        vencido.item.callback();
      }
      agora = alvo;
    },

    get disparos() {
      return disparos;
    },

    get pendentes() {
      return agendados.size;
    },
  };
}
