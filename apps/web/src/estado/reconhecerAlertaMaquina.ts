/**
 * apps/web/src/estado/reconhecerAlertaMaquina.ts
 *
 * Máquina de estados PURA (sem React, sem I/O) da ação "Reconhecer
 * alerta" — separada do componente para ser testável isoladamente e para
 * tornar auditável, por teste, a regra ADR-0021 F5: "nenhum otimismo que
 * mascare falha de comando relevante à segurança". O estado só avança
 * para `sucesso` após confirmação explícita do backend (aqui, do cliente
 * mock); uma falha nunca é silenciosamente tratada como sucesso, e o
 * estado antes da tentativa é sempre recuperável (`falha` mantém o botão
 * de ação disponível, nunca trava a tela).
 */

import type { EstadoItemTrabalho } from "../domain/estados.js";

export type EstadoReconhecerAlerta =
  | { fase: "ocioso" }
  | { fase: "confirmando" }
  | { fase: "enviando" }
  | { fase: "sucesso"; reconhecidoEm: string }
  | { fase: "falha"; mensagem: string }
  /**
   * Conflito de concorrência otimista (ADR-0009 W3): outro ator mudou o item
   * entre o momento em que este usuário o viu e o momento da confirmação.
   * É fase PRÓPRIA, e não uma variante de `falha`, porque a recuperação é
   * diferente: "tentar novamente" às cegas reintroduziria a última-escrita-
   * vence que W3 proíbe. A saída é humana e informada — o usuário vê o estado
   * corrente e decide de novo sobre ele.
   */
  | { fase: "conflito"; mensagem: string; versaoAtual: number; estadoAtual: EstadoItemTrabalho };

export type AcaoReconhecerAlerta =
  | { tipo: "iniciar" }
  | { tipo: "cancelar" }
  | { tipo: "confirmar" }
  | { tipo: "sucesso"; reconhecidoEm: string }
  | { tipo: "falha"; mensagem: string }
  | {
      tipo: "conflito";
      mensagem: string;
      versaoAtual: number;
      estadoAtual: EstadoItemTrabalho;
    }
  | { tipo: "tentar_novamente" }
  /** Descarta o conflito depois que o usuário viu o estado corrente. */
  | { tipo: "descartar_conflito" };

/**
 * Reduz `(estado, ação) -> novoEstado`. Transições não previstas
 * retornam o próprio estado inalterado (nunca lançam, nunca avançam para
 * `sucesso` por omissão) — uma ação desconhecida nunca é tratada como
 * confirmação implícita.
 */
export function reduzirReconhecerAlerta(
  estado: EstadoReconhecerAlerta,
  acao: AcaoReconhecerAlerta,
): EstadoReconhecerAlerta {
  switch (acao.tipo) {
    case "iniciar":
      return estado.fase === "ocioso" || estado.fase === "falha" ? { fase: "confirmando" } : estado;
    case "cancelar":
      return estado.fase === "confirmando" ? { fase: "ocioso" } : estado;
    case "confirmar":
      return estado.fase === "confirmando" ? { fase: "enviando" } : estado;
    case "sucesso":
      return estado.fase === "enviando"
        ? { fase: "sucesso", reconhecidoEm: acao.reconhecidoEm }
        : estado;
    case "falha":
      return estado.fase === "enviando" ? { fase: "falha", mensagem: acao.mensagem } : estado;
    case "conflito":
      return estado.fase === "enviando"
        ? {
            fase: "conflito",
            mensagem: acao.mensagem,
            versaoAtual: acao.versaoAtual,
            estadoAtual: acao.estadoAtual,
          }
        : estado;
    case "tentar_novamente":
      return estado.fase === "falha" ? { fase: "confirmando" } : estado;
    case "descartar_conflito":
      // Volta a `ocioso`, NUNCA direto a `confirmando`: o item mudou, e a
      // decisão precisa recomeçar a partir do estado que o usuário acabou de
      // ver. Reoferecer "confirmar" aqui seria reintroduzir, com um clique a
      // mais, a escrita cega que o conflito interrompeu.
      return estado.fase === "conflito" ? { fase: "ocioso" } : estado;
    default:
      return estado;
  }
}

export const ESTADO_INICIAL_RECONHECER_ALERTA: EstadoReconhecerAlerta = { fase: "ocioso" };
