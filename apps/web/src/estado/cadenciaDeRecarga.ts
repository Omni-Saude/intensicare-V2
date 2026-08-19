/**
 * apps/web/src/estado/cadenciaDeRecarga.ts
 *
 * Cálculo PURO da espera até a próxima releitura autoritativa: jitter para
 * espalhar as abas, espaçamento progressivo após falhas repetidas — e, junto
 * com o número, a CLASSE que a tela precisa declarar.
 *
 * POR QUE A CLASSE VIAJA COM O NÚMERO. Uma releitura espaçada que não aparece
 * na tela é a mesma falha de segurança clínica que LAC-L1 fechou: um retrato
 * antigo com aparência de corrente (HAZ-0025, SAF-0025 — "the interface MUST
 * never appear healthy…"). Se a classe fosse recalculada na camada de
 * apresentação a partir do número, as duas poderiam divergir; devolvendo as
 * duas juntas, a tela exibe o que o agendador de fato usou.
 *
 * NENHUM NÚMERO AQUI É LIMIAR CLÍNICO. Fração de jitter, fator, teto e limiar
 * de falhas são premissas reversíveis de ENGENHARIA (GDEC-0015/0017), no mesmo
 * regime de `INTERVALO_RECARGA_PADRAO_MS` (`./recursoRemoto.ts`) e
 * `CICLOS_PARA_DECLARAR_PERDA` (`./idadeVisao.ts`). Não são SLO, não são alvo
 * de latência gerado→visível e não são janela de frescor — isso é conteúdo de
 * rule release e permanece `VALIDATION REQUIRED` (VAL-0023). Ninguém ratificou
 * estes valores; eles existem para que exista uma cadência, e são os primeiros
 * a mudar quando alguém com autoridade decidir (contrato comum §3).
 *
 * Rastreio: ADR-0011 P5/P8, HAZ-0025, SAF-0025, LAC-L1, VAL-0023.
 */

/**
 * Fração de jitter simétrico aplicada sobre a espera (±20%).
 *
 * PREMISSA REVERSÍVEL. O problema que ela resolve é medível e não é de estética:
 * sem jitter, N abas abertas no mesmo plantão relêem no mesmo instante da janela,
 * e a carga chega ao servidor em rajada alinhada em vez de distribuída. ±20%
 * sobre 30 s espalha as leituras por uma janela de 12 s — suficiente para
 * quebrar o alinhamento sem alterar a ordem de grandeza da cadência, que é o que
 * o clínico enxerga.
 */
export const FRACAO_DE_JITTER = 0.2;

/**
 * A partir de quantas falhas CONSECUTIVAS a releitura começa a espaçar.
 *
 * PREMISSA REVERSÍVEL, e o valor 2 é deliberado: espaçar já na primeira falha
 * transformaria um soluço de rede num atraso visível na tela clínica. A primeira
 * falha ainda tenta na cadência de regime; só a segunda seguida indica um
 * problema que insistir não resolve.
 */
export const FALHAS_ATE_ESPACAR = 2;

/** Quanto o espaçamento cresce a cada falha adicional. PREMISSA REVERSÍVEL. */
export const FATOR_DE_ESPACAMENTO = 2;

/**
 * Teto do espaçamento, em múltiplos do intervalo base. PREMISSA REVERSÍVEL.
 *
 * Existe teto porque um backoff sem limite acaba em "a tela relê uma vez por
 * hora" — e nenhum rótulo salva uma tela clínica nesse regime. Com a base de
 * 30 s, o teto de 8× significa 4 minutos, e a tela DECLARA isso o tempo todo.
 */
export const ESPACAMENTO_MAXIMO = 8;

/** Por que a cadência corrente é o que é. Vira texto em `../domain/linguagem.ts`. */
export type ClasseDeCadencia = "regime" | "espacada_por_falha";

export interface EntradaDeCadencia {
  /** Cadência declarada da tela, em ms. */
  readonly intervaloBaseMs: number;
  /** Falhas seguidas desde a última leitura bem-sucedida. */
  readonly falhasConsecutivas: number;
  /** Sorteio em [0,1] para o jitter — injetável, nunca `Math.random` aqui. */
  readonly sorteio: number;
}

export interface Cadencia {
  /** Espera até a próxima releitura, em ms. Sempre finita e ≥ 1. */
  readonly esperaMs: number;
  /** Múltiplo do intervalo base efetivamente usado (1 = regime). */
  readonly fator: number;
  readonly classe: ClasseDeCadencia;
}

/** Fixa um número no intervalo fechado, tratando `NaN` como o piso. */
function fixar(valor: number, minimo: number, maximo: number): number {
  if (!Number.isFinite(valor)) return minimo;
  return Math.min(maximo, Math.max(minimo, valor));
}

export function calcularCadenciaDeRecarga(entrada: EntradaDeCadencia): Cadencia {
  const base =
    Number.isFinite(entrada.intervaloBaseMs) && entrada.intervaloBaseMs > 0
      ? entrada.intervaloBaseMs
      : 1;

  const falhas = Number.isFinite(entrada.falhasConsecutivas)
    ? Math.max(0, Math.trunc(entrada.falhasConsecutivas))
    : 0;

  const fator =
    falhas < FALHAS_ATE_ESPACAR
      ? 1
      : Math.min(FATOR_DE_ESPACAMENTO ** (falhas - FALHAS_ATE_ESPACAR + 1), ESPACAMENTO_MAXIMO);

  // Jitter simétrico. O sorteio é FIXADO em [0,1] antes de qualquer conta: um
  // `sortear` injetado com defeito não pode produzir espera negativa (rajada de
  // requisições) nem uma espera dez vezes maior (tela parada) sem que ninguém
  // perceba.
  const sorteio = fixar(entrada.sorteio, 0, 1);
  const escala = 1 + FRACAO_DE_JITTER * (sorteio * 2 - 1);

  const esperaMs = Math.max(1, Math.round(base * fator * escala));

  return {
    esperaMs,
    fator,
    classe: fator > 1 ? "espacada_por_falha" : "regime",
  };
}
