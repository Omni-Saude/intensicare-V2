/**
 * Normalizador de FiO2 (ORQ-4) — LEI CANÔNICA: a FiO2 é uma FRAÇÃO em
 * [0.21, 1.0]; o percentual é unidade de BORDA e a conversão
 * percentual → fração acontece SOMENTE pela função explícita
 * `fio2PercentualParaFracao` (units-registry.md §2.1, fator 0.01 = ÷100;
 * docs plan hemodynamics.md §4).
 *
 * O defeito V1 era aceitar o "50 nu" como fração silenciosa (50 ⇒ metade do
 * espaço de fração em vez de 50% de oxigênio). Aqui a porta de fração
 * rejeita [21, 100] com classe PRÓPRIA (`rejected_valor_percentual`) e a
 * mensagem aponta para a via explícita — o valor ambíguo nunca é
 * interpretado silenciosamente (fail-closed).
 */

import type { MarcaQuantidade, MotivoRejeicao, ResultadoQuantidade } from "./tipos.js";

export type Fio2Fracao = MarcaQuantidade<"Fio2Fracao">;
export type Fio2Percentual = MarcaQuantidade<"Fio2Percentual">;

/** Fração em [0.21, 1.0]: 0.21 é o ar ambiente (21%); 1.0 é oxigênio puro. */
const FIO2_FRACAO_MINIMA = 0.21;
const FIO2_FRACAO_MAXIMA = 1.0;
/** Percentual em [21, 100] — a mesma grandeza na unidade de borda %. */
const FIO2_PERCENTUAL_MINIMO = 21;
const FIO2_PERCENTUAL_MAXIMO = 100;

function convertido<T>(valor: T): ResultadoQuantidade<T> {
  return { status: "convertido", valor };
}

function rejeitado<T>(motivo: MotivoRejeicao, mensagem: string): ResultadoQuantidade<T> {
  return { status: "rejeitado", motivo, mensagem };
}

/**
 * Porta canônica da fração de FiO2. Aceita [0.21, 1.0]; rejeita [21, 100]
 * como `rejected_valor_percentual` (classe DISTINTA — o defeito V1 morre
 * aqui); o vão (1.0, 21) e todo o resto, incluindo não-finito, são
 * `rejected_fora_da_faixa`.
 */
export function fio2FracaoDeNumero(valor: number): ResultadoQuantidade<Fio2Fracao> {
  if (!Number.isFinite(valor)) {
    return rejeitado(
      "rejected_fora_da_faixa",
      `FiO2 fração deve estar em [${FIO2_FRACAO_MINIMA}, ${FIO2_FRACAO_MAXIMA}]; recebido valor não finito.`,
    );
  }
  if (valor >= FIO2_PERCENTUAL_MINIMO && valor <= FIO2_PERCENTUAL_MAXIMO) {
    return rejeitado(
      "rejected_valor_percentual",
      `FiO2 ${valor} parece percentual — use fio2PercentualDeNumero e converta via fio2PercentualParaFracao (via explícita, nunca fração implícita).`,
    );
  }
  if (valor >= FIO2_FRACAO_MINIMA && valor <= FIO2_FRACAO_MAXIMA) {
    return convertido(valor as Fio2Fracao);
  }
  return rejeitado(
    "rejected_fora_da_faixa",
    `FiO2 fração deve estar em [${FIO2_FRACAO_MINIMA}, ${FIO2_FRACAO_MAXIMA}]; recebido ${valor}.`,
  );
}

/** Porta da unidade de borda: percentual em [21, 100]; fora, rejeita. */
export function fio2PercentualDeNumero(valor: number): ResultadoQuantidade<Fio2Percentual> {
  if (
    Number.isFinite(valor) &&
    valor >= FIO2_PERCENTUAL_MINIMO &&
    valor <= FIO2_PERCENTUAL_MAXIMO
  ) {
    return convertido(valor as Fio2Percentual);
  }
  return rejeitado(
    "rejected_fora_da_faixa",
    `FiO2 percentual deve estar em [${FIO2_PERCENTUAL_MINIMO}, ${FIO2_PERCENTUAL_MAXIMO}]; recebido ${valor}.`,
  );
}

/**
 * Única via de conversão percentual → fração. DIVISÃO por 100 — NÃO
 * multiplicação por 0.01: em IEEE754, 21 × 0.01 ≠ 0.21 (diferem em 1 ulp) e
 * o contrato exige exatidão (`toBe(0.21)`). Semanticamente é o fator 0.01
 * do units-registry.md §2.1: dividir por 100.
 */
export function fio2PercentualParaFracao(percentual: Fio2Percentual): Fio2Fracao {
  return (percentual / 100) as Fio2Fracao;
}
