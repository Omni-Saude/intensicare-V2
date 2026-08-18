import { useEffect, useReducer, useRef } from "react";
import { gerarChaveIdempotencia } from "../api/idempotencia.js";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { Alerta } from "../domain/clinico.js";
import { textoItemTrabalho } from "../domain/linguagem.js";
import {
  ESTADO_INICIAL_RECONHECER_ALERTA,
  reduzirReconhecerAlerta,
} from "../estado/reconhecerAlertaMaquina.js";
import { MotivoAborto } from "../estado/recursoRemoto.js";
import { BadgeTom } from "./BadgeTom.js";

interface ReconhecerAlertaProps {
  alerta: Alerta;
  cliente: ClienteApiIntensiCare;
  /** Notifica o pai quando o backend confirma o reconhecimento (nunca antes — ADR-0021 F5). */
  aoReconhecido: (alertaAtualizado: Alerta) => void;
  /**
   * Bloqueia o comando (offline). Modelo de estados §6: "comandos bloqueados
   * ou enfileirados com aviso explícito — nunca sucesso aparente". Esta fatia
   * BLOQUEIA e explica; não enfileira, porque uma fila de comandos clínicos
   * exigiria política de conflito e de expiração que ninguém ratificou.
   */
  comandosBloqueados?: boolean;
}

const ESTADOS_QUE_PERMITEM_RECONHECER = new Set([
  "nao_atribuido",
  "atribuido",
  "escalado",
  "reaberto",
]);

/**
 * Ação "Reconhecer alerta" com confirmação explícita em duas etapas.
 * Nunca mostra sucesso antes da confirmação do backend — falha é sempre
 * visível e recuperável, nunca engolida (ADR-0021 F5, "nenhum otimismo que
 * mascare falha de comando relevante à segurança"; ver
 * `../estado/reconhecerAlertaMaquina.ts`, testada à parte).
 *
 * DUAS CORREÇÕES DO ACH-07 aqui:
 *
 *   1. `lidarComConfirmar` era um `async` cujo `await cliente.reconhecerAlerta(...)`
 *      não tinha `try/catch`, e era passado direto a `onClick`. Uma REJEIÇÃO
 *      do cliente virava rejeição não tratada e a UI ficava presa em
 *      "Enviando confirmação…" — o mesmo defeito de `GradeLeitos`/
 *      `DetalhePaciente`, numa forma que o `noFloatingPromises` do Biome não
 *      acusa (o handler de evento esconde a Promise).
 *
 *   2. A chave de idempotência era gerada A CADA confirmação, inclusive em
 *      "Tentar novamente". Se a primeira tentativa tivesse chegado ao
 *      servidor e só a RESPOSTA se perdesse, a nova tentativa levaria uma
 *      chave diferente e o efeito poderia ser aplicado duas vezes — o oposto
 *      do que ADR-0009 W2 garante. A chave passa a ser gerada uma vez por
 *      sequência de reconhecimento e REUTILIZADA nas novas tentativas.
 */
export function ReconhecerAlerta({
  alerta,
  cliente,
  aoReconhecido,
  comandosBloqueados = false,
}: ReconhecerAlertaProps) {
  const [estado, dispatch] = useReducer(reduzirReconhecerAlerta, ESTADO_INICIAL_RECONHECER_ALERTA);
  const chaveRef = useRef<string | null>(null);
  const controladorRef = useRef<AbortController | null>(null);

  // Aborta um envio em curso se o componente desmontar. Cancelamento real:
  // o sinal chega ao `fetch`, não a uma flag que descarta a resposta.
  useEffect(() => {
    return () => {
      controladorRef.current?.abort(
        new MotivoAborto("desmontagem", "Componente de reconhecimento desmontado."),
      );
    };
  }, []);

  if (!ESTADOS_QUE_PERMITEM_RECONHECER.has(alerta.estado)) {
    return null;
  }

  /** Nunca rejeita: todo caminho termina em um `dispatch`. */
  async function lidarComConfirmar(): Promise<void> {
    dispatch({ tipo: "confirmar" });

    // Uma chave por SEQUÊNCIA de reconhecimento (ADR-0009 W2).
    chaveRef.current ??= gerarChaveIdempotencia(alerta.alertaId);
    const controlador = new AbortController();
    controladorRef.current = controlador;

    try {
      const resposta = await cliente.reconhecerAlerta(alerta.alertaId, chaveRef.current, {
        sinal: controlador.signal,
        // A VERSÃO VISTA: exatamente a que este componente tem na tela, não a
        // que o servidor tem agora (ADR-0009 W3). É este valor que faz o 412
        // acontecer quando alguém mudou o item enquanto o usuário decidia.
        versaoVista: alerta.versao,
      });

      if (controlador.signal.aborted) return;

      if (resposta.estadoCarregamento === "pronto" && resposta.dados) {
        aoReconhecido(resposta.dados);
        dispatch({
          tipo: "sucesso",
          reconhecidoEm: resposta.dados.reconhecidoEm ?? new Date().toISOString(),
        });
        return;
      }

      if (resposta.conflito) {
        dispatch({
          tipo: "conflito",
          mensagem:
            resposta.problema?.detail ??
            "Este alerta mudou depois que você o abriu. Nada foi registrado.",
          versaoAtual: resposta.conflito.versaoAtual,
          estadoAtual: resposta.conflito.estadoAtual,
        });
        return;
      }

      dispatch({
        tipo: "falha",
        mensagem:
          resposta.problema?.detail ?? "Não foi possível reconhecer o alerta. Tente novamente.",
      });
    } catch (erro) {
      // Desmontagem não produz estado: o componente já não está na tela.
      if (controlador.signal.aborted) return;
      void erro;
      dispatch({
        tipo: "falha",
        mensagem:
          "Não foi possível reconhecer o alerta: a requisição falhou antes de produzir " +
          "resposta. Nada foi registrado. Tente novamente.",
      });
    }
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
        {comandosBloqueados ? (
          <p role="alert">
            Sem conexão com o servidor: o reconhecimento não pode ser registrado agora e NÃO foi
            enfileirado. Nada foi enviado. Use o procedimento institucional e repita quando a
            conexão voltar.
          </p>
        ) : (
          <button
            type="button"
            className="botao"
            onClick={() => {
              void lidarComConfirmar();
            }}
          >
            Confirmar
          </button>
        )}
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

  // Conflito de concorrência (ADR-0009 W3): a falha é explícita, o estado
  // CORRENTE é exibido, e não há "tentar novamente" — repetir às cegas seria
  // a última-escrita-vence que a cláusula proíbe. O usuário retoma a partir
  // do que acabou de ver.
  if (estado.fase === "conflito") {
    const { texto, tom } = textoItemTrabalho(estado.estadoAtual);
    return (
      <div role="alert" data-testid={`conflito-${alerta.alertaId}`}>
        <p>{estado.mensagem}</p>
        <p>
          Estado atual deste alerta: <BadgeTom texto={texto} tom={tom} /> (versão{" "}
          {estado.versaoAtual}; você viu a versão {alerta.versao}). Nada foi registrado.
        </p>
        <button
          type="button"
          className="botao"
          onClick={() => dispatch({ tipo: "descartar_conflito" })}
        >
          Entendi — revisar o alerta atualizado
        </button>
      </div>
    );
  }

  const idBloqueio = `bloqueio-${alerta.alertaId}`;
  if (comandosBloqueados) {
    // NÃO usa `disabled`: um botão desabilitado sai da ordem de foco, e quem
    // navega por teclado ou leitor de tela nunca chega ao elemento que
    // explica o bloqueio. O botão permanece focável, anuncia-se como
    // indisponível (`aria-disabled`) e aponta para um motivo que EXISTE no
    // DOM — o `aria-describedby` anterior referenciava um `id` inexistente
    // (SAF-0034; HAZ-0037).
    return (
      <>
        <button
          type="button"
          className="botao"
          aria-disabled="true"
          aria-describedby={idBloqueio}
          onClick={(evento) => evento.preventDefault()}
        >
          Reconhecer alerta
        </button>
        <p id={idBloqueio}>
          Indisponível sem conexão: o reconhecimento não pode ser registrado agora e não foi
          enfileirado. Use o procedimento institucional e repita quando a conexão voltar.
        </p>
      </>
    );
  }

  return (
    <button type="button" className="botao" onClick={() => dispatch({ tipo: "iniciar" })}>
      Reconhecer alerta
    </button>
  );
}
