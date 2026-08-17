/**
 * apps/api/src/eventos/fila.ts — fila LIMITADA por conexão e a escrita SSE.
 *
 * ADR-0011 P5, verbatim: "Filas por conexão são limitadas (valores
 * VALIDATION REQUIRED); ao exceder, o servidor **desconecta explicitamente
 * com instrução de reconciliação** — jamais descarta deltas silenciosamente
 * mantendo a conexão com aparência de saúde."
 *
 * A consequência de projeto: `enfileirar` NÃO tem caminho de descarte. Ou
 * aceita, ou devolve `fila-excedida` — e quem chama é obrigado a tratar o
 * segundo caso, porque o tipo de retorno não deixa ignorar. Não existe
 * `evictarMaisAntigo()` neste arquivo, e a ausência é intencional.
 *
 * SOBRE OS NÚMEROS: os limites são parâmetros obrigatórios, sem valor
 * padrão. ADR-0011 §3 D6 registra os alvos deste gateway como `VALIDATION
 * REQUIRED` e o contrato comum §3 proíbe inventar banda/SLO. Quem sobe o
 * gateway escolhe explicitamente; `LIMITES_ILUSTRATIVOS` existe apenas para
 * a fatia sintética e está rotulado como tal.
 */

/** Limites por conexão. Nenhum valor aqui é um alvo aprovado. */
export interface LimitesConexao {
  /** Máximo de eventos aguardando escrita. Exceder ⇒ desconexão explícita. */
  readonly maximoEventosNaFila: number;
  /**
   * Máximo de bytes já entregues ao socket e ainda não drenados. Acima
   * disso o escritor é considerado saturado e a fila para de drenar — é
   * assim que um cliente lento vira backlog visível em vez de memória
   * infinita.
   */
  readonly maximoBytesPendentes: number;
  /** Intervalo entre pulsações, em ms. */
  readonly intervaloPulsacaoMs: number;
  /** Máximo de eventos lidos do backbone por rodada de releitura. */
  readonly loteMaximoLeitura: number;
  /**
   * Intervalo de reexame do escritor saturado, em ms. É botão de
   * escalonamento interno — NÃO é alvo de latência de entrega nem SLO
   * (esses seguem `VALIDATION REQUIRED` e não são decididos aqui).
   */
  readonly intervaloReexameDrenoMs: number;
}

/**
 * Valores ILUSTRATIVOS da fatia sintética G7 — mesmo regime dos limiares
 * de frescor já usados em `apps/api/src/store.ts`. **NÃO são SLO, não são
 * banda aceitável e não foram validados** (ADR-0011 §3 D6/D7 seguem
 * `VALIDATION REQUIRED`; nenhum alvo de latência de entrega é declarado
 * aqui nem em lugar algum desta entrega).
 */
export const LIMITES_ILUSTRATIVOS: LimitesConexao = {
  maximoEventosNaFila: 256,
  maximoBytesPendentes: 1_048_576,
  intervaloPulsacaoMs: 15_000,
  loteMaximoLeitura: 200,
  intervaloReexameDrenoMs: 50,
};

export type ResultadoEnfileiramento =
  | { readonly aceito: true; readonly tamanho: number }
  | { readonly aceito: false; readonly motivo: "fila-excedida"; readonly tamanho: number };

/**
 * Fila FIFO limitada. Sem descarte, sem sobrescrita, sem crescimento
 * indefinido — as três coisas que P5 proíbe.
 */
export class FilaLimitada<T> {
  readonly #itens: T[] = [];
  readonly #maximo: number;

  constructor(maximoEventosNaFila: number) {
    if (!Number.isInteger(maximoEventosNaFila) || maximoEventosNaFila <= 0) {
      throw new Error("maximoEventosNaFila precisa ser inteiro positivo (fail-closed).");
    }
    this.#maximo = maximoEventosNaFila;
  }

  get tamanho(): number {
    return this.#itens.length;
  }

  get maximo(): number {
    return this.#maximo;
  }

  enfileirar(item: T): ResultadoEnfileiramento {
    if (this.#itens.length >= this.#maximo) {
      // Nada é removido. A conexão será encerrada por quem chamou.
      return { aceito: false, motivo: "fila-excedida", tamanho: this.#itens.length };
    }
    this.#itens.push(item);
    return { aceito: true, tamanho: this.#itens.length };
  }

  desenfileirar(): T | undefined {
    return this.#itens.shift();
  }

  espiar(): T | undefined {
    return this.#itens[0];
  }
}

/**
 * Escritor de quadros SSE. Existe como interface para que o teste de
 * backpressure possa injetar um escritor que NUNCA drena — o modo de falha
 * "cliente lento" fica determinístico em vez de depender do tamanho do
 * buffer TCP da máquina que roda a suíte.
 */
export interface EscritorSse {
  escrever(quadro: string): void;
  /** Bytes entregues ao transporte e ainda não drenados. */
  bytesPendentes(): number;
  encerrar(): void;
  readonly encerrado: boolean;
}

/** Superfície mínima de `http.ServerResponse` que o escritor real usa. */
export interface RespostaBruta {
  write(pedaco: string): boolean;
  end(): void;
  readonly writableLength: number;
  readonly writableEnded: boolean;
  /**
   * `true` quando o fluxo subjacente foi DESTRUÍDO (aborto abrupto do
   * cliente). Distinto de `writableEnded`, que só cobre o encerramento
   * ordenado por `end()` — um socket destruído tem `writableEnded === false`
   * e continuaria parecendo escrevível.
   */
  readonly destroyed?: boolean;
}

/** Escritor real sobre o socket HTTP. */
export class EscritorSseHttp implements EscritorSse {
  readonly #resposta: RespostaBruta;
  #encerrado = false;

  constructor(resposta: RespostaBruta) {
    this.#resposta = resposta;
  }

  get encerrado(): boolean {
    // `destroyed` cobre o aborto abrupto do cliente: nesse caso
    // `writableEnded` continua `false` e, sem esta verificação, o escritor
    // se declararia vivo sobre um socket morto.
    return this.#encerrado || this.#resposta.writableEnded || this.#resposta.destroyed === true;
  }

  escrever(quadro: string): void {
    if (this.encerrado) return;
    this.#resposta.write(quadro);
  }

  bytesPendentes(): number {
    return this.#resposta.writableLength;
  }

  encerrar(): void {
    if (this.#encerrado) return;
    this.#encerrado = true;
    if (!this.#resposta.writableEnded) this.#resposta.end();
  }
}

// ---------------------------------------------------------------------------
// Montagem de quadros SSE
// ---------------------------------------------------------------------------

/**
 * Monta um quadro SSE. `dados` é serializado em JSON — que jamais produz
 * quebra de linha literal, condição para o quadro não ser truncado.
 */
export function montarQuadro(argumentos: { evento: string; dados: unknown; id?: number }): string {
  const linhas: string[] = [];
  if (argumentos.id !== undefined) linhas.push(`id: ${String(argumentos.id)}`);
  linhas.push(`event: ${argumentos.evento}`);
  linhas.push(`data: ${JSON.stringify(argumentos.dados)}`);
  return `${linhas.join("\n")}\n\n`;
}

/**
 * Campo `retry:` do SSE — o backoff base que o navegador respeita
 * sozinho. É a metade "dirigida pelo servidor" de P5 que não depende de o
 * cliente implementar coisa alguma.
 */
export function montarQuadroDeRetry(esperaMinimaMs: number): string {
  return `retry: ${String(esperaMinimaMs)}\n\n`;
}

/** Comentário SSE — usado para manter o canal aquecido sem semântica. */
export function montarComentario(texto: string): string {
  return `: ${texto}\n\n`;
}
