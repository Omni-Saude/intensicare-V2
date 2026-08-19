import type { ItemGradeLeito } from "../domain/clinico.js";
import { textoAvaliacao, textoBandaRisco, textoFrescor } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";
import { SeloModoDespacho } from "./SeloModoDespacho.js";

interface CartaoLeitoProps {
  item: ItemGradeLeito;
  aoSelecionar: (leitoId: string) => void;
}

const ESTADOS_FAIL_CLOSED = new Set(["nao_avaliada", "invalida"]);

/**
 * Cartão de um leito na grade — escore NEWS2, banda de risco (cor
 * acessível + rótulo textual), frescor do dado e modo de despacho da regra.
 * `<button>` nativo (não `<div onClick>`): foco de teclado e ativação
 * por Enter/Espaço vêm de graça, sem `tabIndex`/`onKeyDown` manuais.
 */
export function CartaoLeito({ item, aoSelecionar }: CartaoLeitoProps) {
  const { avaliacao } = item;
  /*
    FRESCOR VEM DO SERVIDOR (ADR-0011 P7: "a projeção entrega o status pronto;
    o cliente não o deriva"). Até aqui, esta linha era
    `calcularFrescorGeral(avaliacao.contribuicoes)` — e `mapearEntradaGrade`
    devolve `contribuicoes: []` para TODO leito, porque a projeção da grade é
    um resumo. A grade estava derivando frescor de uma lista vazia por
    construção, enquanto `EntradaGradeLeitos.frescor` — campo OBRIGATÓRIO do
    contrato — era descartado no mapeamento. Mesma família de LAC-D3.

    `undefined` (item montado à mão, sem passar pelo mapeador) continua sendo
    "nada é afirmado", e o cartão não exibe selo de frescor nenhum —
    exatamente o resultado que ACH-O3-12 fixou para ausência de evidência.
  */
  const frescorDaLinha = item.frescor;

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
                {frescorDaLinha !== undefined && <BadgeTom {...textoFrescor(frescorDaLinha)} />}
                {avaliacao.estadoAvaliacao === "desatualizada" && (
                  <BadgeTom {...textoAvaliacao("desatualizada")} />
                )}
                {avaliacao.estadoAvaliacao === "parcial" && (
                  <BadgeTom {...textoAvaliacao("parcial")} />
                )}
              </div>
            </>
          )}

        {/*
          MODO DE DESPACHO (LAC-L2), em TODA linha que faz alguma afirmação
          clínica — inclusive as fail-closed, onde a pergunta "isto autoriza
          conduta?" é ainda mais aguda. Um leito VAGO não o declara: não há
          avaliação a rotular, e um selo permanente sobre nada é o ruído que
          treina o olho a ignorar a região (a mesma economia de sinal aplicada
          a `online` e a `no_ciclo`).
        */}
        {avaliacao && <SeloModoDespacho envelope={item.modoAvaliacao} />}
      </button>
    </li>
  );
}
