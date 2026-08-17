import type { ContribuicaoParametro } from "../domain/clinico.js";
import { textoFrescor } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";

interface ContribuicaoParametroLinhaProps {
  contribuicao: ContribuicaoParametro;
}

/**
 * Uma linha de explicação por parâmetro na tela de detalhe do paciente:
 * valor observado (ou ausência declarada), pontos, frescor e explicação
 * clínica pt-BR — os insumos exigidos pela tarefa (prompt §11
 * "explainability showing inputs, missing inputs, source time, rule
 * version, rationale").
 */
export function ContribuicaoParametroLinha({ contribuicao }: ContribuicaoParametroLinhaProps) {
  return (
    <li className="contribuicao-parametro">
      <div className="contribuicao-parametro__cabecalho">
        <strong>{contribuicao.rotulo}</strong>
        <BadgeTom {...textoFrescor(contribuicao.frescor)} />
      </div>
      <p>
        Valor observado:{" "}
        {contribuicao.valorObservado === null ? (
          <em>não informado</em>
        ) : (
          <>
            {contribuicao.valorObservado}
            {contribuicao.unidade ? ` ${contribuicao.unidade}` : ""}
          </>
        )}
      </p>
      <p>Pontos: {contribuicao.pontos === null ? <em>não computado</em> : contribuicao.pontos}</p>
      <p>Horário da leitura de origem: {contribuicao.horarioFonte ?? <em>nunca recebida</em>}</p>
      <p>{contribuicao.explicacao}</p>
    </li>
  );
}
