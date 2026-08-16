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

export type EstadoReconhecerAlerta =
  | { fase: "ocioso" }
  | { fase: "confirmando" }
  | { fase: "enviando" }
  | { fase: "sucesso"; reconhecidoEm: string }
  | { fase: "falha"; mensagem: string };

export type AcaoReconhecerAlerta =
  | { tipo: "iniciar" }
  | { tipo: "cancelar" }
  | { tipo: "confirmar" }
  | { tipo: "sucesso"; reconhecidoEm: string }
  | { tipo: "falha"; mensagem: string }
  | { tipo: "tentar_novamente" };

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
    case "tentar_novamente":
      return estado.fase === "falha" ? { fase: "confirmando" } : estado;
    default:
      return estado;
  }
}

export const ESTADO_INICIAL_RECONHECER_ALERTA: EstadoReconhecerAlerta = { fase: "ocioso" };
