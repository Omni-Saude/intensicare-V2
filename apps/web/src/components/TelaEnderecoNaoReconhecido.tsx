/**
 * apps/web/src/components/TelaEnderecoNaoReconhecido.tsx
 *
 * Rota desconhecida como ESTADO EXPLÍCITO (LAC-L4). As duas alternativas
 * usuais são piores e ambas foram recusadas:
 *
 *   - tela em branco: indistinguível de uma falha de carregamento, e a pessoa
 *     não sabe se o sistema caiu ou se ela errou o endereço;
 *   - redirecionamento silencioso para a grade: apaga da barra de endereço
 *     exatamente a informação que permitiria descobrir o erro — e, num link de
 *     plantão compartilhado, faria todo mundo achar que abriu o leito certo.
 *
 * A URL PERMANECE como está. O caminho é exibido para que um link errado seja
 * conferível, e é exibido dentro de `<code>` sem virar HTML.
 *
 * NENHUM TEXTO AQUI É CLÍNICO. Nada sobre paciente, leito, risco ou estado de
 * dado é afirmado — esta tela fala de endereço. VALIDATION REQUIRED (ADR-0029
 * C2 ABERTA): redação provisória de engenharia.
 */

interface TelaEnderecoNaoReconhecidoProps {
  /** Caminho tal como veio da barra de endereço. */
  caminho: string;
  /** Ação de retorno — navega, não recarrega. */
  aoIrParaGrade: () => void;
}

export function TelaEnderecoNaoReconhecido({
  caminho,
  aoIrParaGrade,
}: TelaEnderecoNaoReconhecidoProps) {
  return (
    <section
      aria-labelledby="endereco-nao-reconhecido-titulo"
      data-testid="endereco-nao-reconhecido"
      data-rota="desconhecida"
    >
      <h2 id="endereco-nao-reconhecido-titulo">Endereço não reconhecido</h2>
      <div className="bloco-estado-tela">
        <p>
          Esta interface não tem tela para o endereço solicitado. Nenhum dado foi carregado e
          nenhuma tela foi aberta no lugar da pedida.
        </p>
        <p>
          Endereço solicitado: <code data-testid="caminho-nao-reconhecido">{caminho}</code>
        </p>
        <p>
          <button type="button" className="botao" onClick={aoIrParaGrade}>
            Ir para a grade de leitos
          </button>
        </p>
      </div>
    </section>
  );
}
