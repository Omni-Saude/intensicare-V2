import type { ModoDemonstracao } from "../api/tipos.js";

interface ControleDemonstracaoProps {
  valor: ModoDemonstracao | null;
  aoMudar: (valor: ModoDemonstracao | null) => void;
}

const OPCOES: Array<{ valor: ModoDemonstracao; rotulo: string }> = [
  { valor: "carregando", rotulo: "Carregando" },
  { valor: "vazio", rotulo: "Vazio" },
  { valor: "indisponivel", rotulo: "Indisponível" },
  { valor: "erro", rotulo: "Erro" },
];

/**
 * Controle EXPLÍCITO e rotulado de demonstração — não é comportamento de
 * produção. Existe porque nem o mock em memória nem o fluxo dev feliz
 * produzem falha de rede organicamente; esta é a forma honesta de tornar
 * os estados de tela exigidos pela tarefa "visíveis e demonstráveis" em
 * revisão, sem fingir uma falha real. Nunca deve ser confundido com um
 * estado originado no backend real (o cliente HTTP real honra o mesmo
 * `forcarResultado` — ver `../api/clienteHttp.ts`).
 */
export function ControleDemonstracao({ valor, aoMudar }: ControleDemonstracaoProps) {
  return (
    <details className="controle-demonstracao">
      <summary>Modo de demonstração (apenas front-end sintético)</summary>
      <p>
        Força o estado de carregamento da grade de leitos, para fins de revisão desta
        fatia — não representa uma falha real de rede ou de servidor.
      </p>
      <div className="controle-demonstracao__opcoes" role="group" aria-label="Forçar estado de tela">
        <button
          type="button"
          className={valor === null ? "botao" : "botao botao--secundario"}
          aria-pressed={valor === null}
          onClick={() => aoMudar(null)}
        >
          Padrão (pronto)
        </button>
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            className={valor === opcao.valor ? "botao" : "botao botao--secundario"}
            aria-pressed={valor === opcao.valor}
            onClick={() => aoMudar(opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>
    </details>
  );
}
