import { useReducer } from "react";
import { gerarChaveIdempotencia } from "../api/idempotencia.js";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { Alerta } from "../domain/clinico.js";
import {
  ESTADO_INICIAL_RECONHECER_ALERTA,
  reduzirReconhecerAlerta,
} from "../estado/reconhecerAlertaMaquina.js";

interface ReconhecerAlertaProps {
  alerta: Alerta;
  cliente: ClienteApiIntensiCare;
  /** Notifica o pai quando o backend confirma o reconhecimento (nunca antes — ADR-0021 F5). */
  aoReconhecido: (alertaAtualizado: Alerta) => void;
}

const ESTADOS_QUE_PERMITEM_RECONHECER = new Set([
  "nao_atribuido",
  "atribuido",
  "escalado",
  "reaberto",
]);

/**
 * Ação "Reconhecer alerta" com confirmação explícita em duas etapas.
 * Nunca mostra sucesso antes da confirmação do backend (aqui, do
 * cliente mock) — falha é sempre visível e recuperável, nunca engolida
 * (ADR-0021 F5, "nenhum otimismo que mascare falha de comando relevante
 * à segurança"; ver `../estado/reconhecerAlertaMaquina.ts`, testada à
 * parte).
 */
export function ReconhecerAlerta({ alerta, cliente, aoReconhecido }: ReconhecerAlertaProps) {
  const [estado, dispatch] = useReducer(reduzirReconhecerAlerta, ESTADO_INICIAL_RECONHECER_ALERTA);

  if (!ESTADOS_QUE_PERMITEM_RECONHECER.has(alerta.estado)) {
    return null;
  }

  async function lidarComConfirmar() {
    dispatch({ tipo: "confirmar" });
    const chave = gerarChaveIdempotencia(alerta.alertaId);
    const resposta = await cliente.reconhecerAlerta(alerta.alertaId, chave);

    if (resposta.estadoCarregamento === "pronto" && resposta.dados) {
      aoReconhecido(resposta.dados);
      dispatch({
        tipo: "sucesso",
        reconhecidoEm: resposta.dados.reconhecidoEm ?? new Date().toISOString(),
      });
      return;
    }

    dispatch({
      tipo: "falha",
      mensagem:
        resposta.problema?.detail ?? "Não foi possível reconhecer o alerta. Tente novamente.",
    });
  }

  if (estado.fase === "sucesso") {
    return (
      <p role="status" aria-live="polite">
        Ciência registrada em {estado.reconhecidoEm}.
      </p>
    );
  }

  if (estado.fase === "confirmando") {
    return (
      <div role="group" aria-label={`Confirmar reconhecimento do alerta ${alerta.alertaId}`}>
        <p>Confirma que tomou ciência deste alerta?</p>
        <button type="button" className="botao" onClick={lidarComConfirmar}>
          Confirmar
        </button>
        <button
          type="button"
          className="botao botao--secundario"
          onClick={() => dispatch({ tipo: "cancelar" })}
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (estado.fase === "enviando") {
    return (
      <p role="status" aria-live="polite">
        Enviando confirmação…
      </p>
    );
  }

  if (estado.fase === "falha") {
    return (
      <div role="alert">
        <p>{estado.mensagem}</p>
        <button
          type="button"
          className="botao"
          onClick={() => dispatch({ tipo: "tentar_novamente" })}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <button type="button" className="botao" onClick={() => dispatch({ tipo: "iniciar" })}>
      Reconhecer alerta
    </button>
  );
}
