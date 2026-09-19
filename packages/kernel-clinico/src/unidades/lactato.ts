/**
 * Normalizador de lactato (ORQ-4) — canônico mmol/L; borda mg/dL com fator
 * ×0.111 (units-registry.md §2.1; HAZ-015; âncora de verificação
 * units-normalization-review.md:142: 9.008 mg/dL × 0.111 ≈ 1.0 mmol/L).
 *
 * POLÍTICA DE ARREDONDAMENTO: nenhuma política de arredondamento está
 * documentada no registry — portanto este módulo mantém PRECISÃO TOTAL e
 * NUNCA arredonda. Arredondar é decisão da camada de apresentação ("18 mg/dL
 * → 2.0 mmol/L" na HAZ-015 é valor de EXIBIÇÃO); decidir arredondamento
 * silenciosamente aqui fixaria política clínica sem ratificação.
 */

import type { MarcaQuantidade, MotivoRejeicao, ResultadoQuantidade } from "./tipos.js";

export type LactatoMmolL = MarcaQuantidade<"LactatoMmolL">;
export type LactatoMgDl = MarcaQuantidade<"LactatoMgDl">;

function convertido<T>(valor: T): ResultadoQuantidade<T> {
  return { status: "convertido", valor };
}

function rejeitado<T>(motivo: MotivoRejeicao, mensagem: string): ResultadoQuantidade<T> {
  return { status: "rejeitado", motivo, mensagem };
}

/** Porta canônica: mmol/L finito não negativo; fora disso, rejeita. */
export function lactatoMmolLDeNumero(valor: number): ResultadoQuantidade<LactatoMmolL> {
  if (!Number.isFinite(valor) || valor < 0) {
    return rejeitado(
      "rejected_valor_invalido",
      `lactato em mmol/L deve ser número finito não negativo; recebido ${valor}.`,
    );
  }
  return convertido(valor as LactatoMmolL);
}

/** Porta de borda: mg/dL finito não negativo; fora disso, rejeita. */
export function lactatoMgDlDeNumero(valor: number): ResultadoQuantidade<LactatoMgDl> {
  if (!Number.isFinite(valor) || valor < 0) {
    return rejeitado(
      "rejected_valor_invalido",
      `lactato em mg/dL deve ser número finito não negativo; recebido ${valor}.`,
    );
  }
  return convertido(valor as LactatoMgDl);
}

/**
 * Borda mg/dL → canônico mmol/L com o fator EXATO ×0.111 e precisão total —
 * SEM arredondamento (a política de arredondamento, se houver, é da
 * apresentação; ver cabeçalho).
 */
export function lactatoMgDlParaMmolL(mgDl: LactatoMgDl): LactatoMmolL {
  return (mgDl * 0.111) as LactatoMmolL;
}
