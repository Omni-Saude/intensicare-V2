/**
 * `Segredo` — invólucro que torna difícil vazar material sensível por acidente.
 *
 * O anti-padrão 12 do contrato comum proíbe colocar bearer, PSR, tenant ou
 * identificador do sujeito em query string ou log. O acidente mais comum não é
 * alguém logar a senha de propósito: é um `JSON.stringify(config)` num handler
 * de erro, um `console.log(config)` de diagnóstico, ou um objeto de
 * configuração serializado numa resposta de prontidão.
 *
 * O valor fica num campo privado de classe (`#valor`), que não é enumerável,
 * não aparece em `Object.keys`, não é serializado por `JSON.stringify` e não
 * é impresso por `util.inspect`. Ler o segredo exige a chamada explícita
 * `revelar()` — que é rastreável por busca textual, ao contrário de uma
 * `string` solta.
 */
export class Segredo {
  /** Texto que substitui o valor em toda representação textual. */
  static readonly MARCADOR = "[REDIGIDO]";

  readonly #valor: string;

  constructor(valor: string) {
    this.#valor = valor;
  }

  /** Única forma de obter o valor. Chame no ponto de uso, nunca antes. */
  revelar(): string {
    return this.#valor;
  }

  toString(): string {
    return Segredo.MARCADOR;
  }

  toJSON(): string {
    return Segredo.MARCADOR;
  }

  /** Cobre `console.log`/`util.inspect`, que não passam por `toJSON`. */
  [Symbol.for("nodejs.util.inspect.custom")](): string {
    return `Segredo(${Segredo.MARCADOR})`;
  }
}
