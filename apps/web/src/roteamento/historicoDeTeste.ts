/**
 * apps/web/src/roteamento/historicoDeTeste.ts
 *
 * Histórico EM MEMÓRIA para os testes de componente. Mesma convenção de
 * `teste/relogioDeTeste.ts`: importado apenas por `*.test.*`, portanto nunca
 * entra no grafo do pacote emitido (a guarda de build de
 * `build/guardaArtefatoSintetico.ts` continua sendo a defesa real).
 *
 * POR QUE NÃO USAR O HISTÓRICO DO JSDOM. `history.back()` do jsdom dispara
 * `popstate` de forma ASSÍNCRONA e sem garantia de ordem entre traversals;
 * um teste que precisa afirmar "o voltar leva à grade e NÃO sai da aplicação"
 * ficaria medindo o agendador do jsdom em vez do produto. O comportamento real
 * do botão "voltar" do navegador é verificado onde ele existe de verdade:
 * `e2e/navegacao.spec.ts`, com `page.goBack()`.
 *
 * `saiuDaAplicacao` é a asserção que dá sentido ao requisito: voltar além da
 * primeira entrada é, no navegador, sair para a página anterior — e é
 * exatamente o defeito que LAC-L4 descreve.
 */
import type { PortaHistorico } from "./historico.js";

export interface HistoricoDeTeste extends PortaHistorico {
  /** Pilha de caminhos, do mais antigo ao mais recente. */
  readonly pilha: readonly string[];
  /** `true` se `voltar()` foi chamado além da primeira entrada. */
  readonly saiuDaAplicacao: boolean;
  /** Quantidade de entradas empilhadas por `navegar` (nunca por `substituir`). */
  readonly entradas: number;
  /**
   * Modela um SALTO DE HISTÓRICO do navegador para outra entrada da MESMA
   * aplicação (avançar, ou voltar por cima de várias entradas): o caminho muda
   * e os assinantes são notificados, sem que nada desmonte.
   *
   * É o único jeito de alcançar, em teste, a transição LEITO → LEITO sem
   * desmontagem — a que torna a guarda de identidade de `DetalhePaciente`
   * obrigatória (LAC-D4/LAC-L4, HAZ-0001/HAZ-0002).
   */
  saltarPara(caminho: string): void;
}

export function criarHistoricoDeTeste(caminhoInicial = "/"): HistoricoDeTeste {
  const pilha: string[] = [caminhoInicial];
  let posicao = 0;
  let saiu = false;
  const ouvintes = new Set<() => void>();

  function notificar(): void {
    for (const ouvinte of [...ouvintes]) ouvinte();
  }

  return {
    caminhoAtual: () => pilha[posicao] ?? "/",

    navegar(caminho: string): void {
      // Empilhar sobre uma posição intermediária descarta o "avançar",
      // exatamente como o navegador faz.
      pilha.length = posicao + 1;
      pilha.push(caminho);
      posicao = pilha.length - 1;
    },

    substituir(caminho: string): void {
      pilha[posicao] = caminho;
    },

    assinar(ouvinte: () => void): () => void {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },

    saltarPara(caminho: string): void {
      pilha.length = posicao + 1;
      pilha.push(caminho);
      posicao = pilha.length - 1;
      notificar();
    },

    voltar(): void {
      if (posicao === 0) {
        // No navegador, isto é sair da aplicação para o documento anterior.
        saiu = true;
        return;
      }
      posicao -= 1;
      notificar();
    },

    get pilha() {
      return [...pilha];
    },

    get saiuDaAplicacao() {
      return saiu;
    },

    get entradas() {
      return pilha.length;
    },
  };
}
