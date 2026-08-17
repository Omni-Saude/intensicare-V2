import type { ReactNode } from "react";
import type { EstadoCarregamento } from "../domain/estados.js";
import { textoCarregamento } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";

interface EstadoTelaProps {
  estado: EstadoCarregamento;
  /** Contexto lido por leitor de tela junto do texto de estado (ex.: "grade de leitos"). */
  contexto: string;
  detalhe?: string;
  children?: ReactNode;
}

const ESTADOS_QUE_RENDERIZAM_CONTEUDO: EstadoCarregamento[] = ["pronto", "parcial"];

/**
 * Wrapper de estado de tela/lista — cobre carregando/vazio/indisponível/
 * proibido/tempo-esgotado/retentando/parcial/erro (prompt §11, 1ª
 * família). `role="status"`/`aria-live="polite"` para que a transição de
 * "carregando" para o resultado seja anunciada sem interromper o
 * usuário; um `erro`/`indisponível` usa `role="alert"` (assertivo), pois
 * exige atenção mais imediata que uma atualização de rotina.
 */
export function EstadoTela({ estado, contexto, detalhe, children }: EstadoTelaProps) {
  if (ESTADOS_QUE_RENDERIZAM_CONTEUDO.includes(estado)) {
    return (
      <>
        {estado === "parcial" && (
          <div className="bloco-estado-tela" role="status" aria-live="polite">
            <BadgeTom {...textoCarregamento("parcial")} />
          </div>
        )}
        {children}
      </>
    );
  }

  const { texto, tom } = textoCarregamento(estado);
  const assertivo = estado === "erro" || estado === "indisponivel" || estado === "proibido";

  return (
    <div
      className="bloco-estado-tela"
      role={assertivo ? "alert" : "status"}
      aria-live={assertivo ? "assertive" : "polite"}
      data-estado={estado}
      data-contexto={contexto}
    >
      <BadgeTom texto={texto} tom={tom} />
      {detalhe && <p>{detalhe}</p>}
    </div>
  );
}
