import { calcularFrescorGeral, type ItemGradeLeito } from "../domain/clinico.js";
import { textoAvaliacao, textoBandaRisco, textoFrescor } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";

interface CartaoLeitoProps {
  item: ItemGradeLeito;
  aoSelecionar: (leitoId: string) => void;
}

const ESTADOS_FAIL_CLOSED = new Set(["nao_avaliada", "invalida"]);

/**
 * Cartão de um leito na grade — escore NEWS2, banda de risco (cor
 * acessível + rótulo textual) e frescor do dado, conforme a tarefa.
 * `<button>` nativo (não `<div onClick>`): foco de teclado e ativação
 * por Enter/Espaço vêm de graça, sem `tabIndex`/`onKeyDown` manuais.
 */
export function CartaoLeito({ item, aoSelecionar }: CartaoLeitoProps) {
  const { avaliacao } = item;

  return (
    <li>
      <button type="button" className="cartao-leito" onClick={() => aoSelecionar(item.leitoId)}>
        <h3>{item.leitoId}</h3>
        <p>{item.pacienteApelido ?? "Leito vago — sem paciente associado."}</p>

        {avaliacao && ESTADOS_FAIL_CLOSED.has(avaliacao.estadoAvaliacao) && (
          <div className="cartao-leito__linha">
            <BadgeTom {...textoAvaliacao(avaliacao.estadoAvaliacao)} />
          </div>
        )}

        {avaliacao &&
          !ESTADOS_FAIL_CLOSED.has(avaliacao.estadoAvaliacao) &&
          avaliacao.news2Total !== null &&
          avaliacao.bandaRisco !== null && (
            <>
              <div className="cartao-leito__linha">
                <span>
                  NEWS2: <strong>{avaliacao.news2Total}</strong>
                </span>
                <BadgeTom {...textoBandaRisco(avaliacao.bandaRisco)} />
              </div>
              <div className="cartao-leito__linha">
                <BadgeTom {...textoFrescor(calcularFrescorGeral(avaliacao.contribuicoes))} />
                {avaliacao.estadoAvaliacao === "desatualizada" && (
                  <BadgeTom {...textoAvaliacao("desatualizada")} />
                )}
                {avaliacao.estadoAvaliacao === "parcial" && <BadgeTom {...textoAvaliacao("parcial")} />}
              </div>
            </>
          )}
      </button>
    </li>
  );
}
