/**
 * Conversores de EXAMES laboratoriais do RULE-SOFA — extensão ADITIVA ao
 * piso de unidades do ORQ-4 (que cobre hemodinâmica, FiO2, lactato e peso).
 *
 * Fatores EXATOS pinados na logic.yaml do RULE-SOFA (OQ-6 (a), GDEC-0007):
 * bilirrubina µmol/L ÷17.104; creatinina µmol/L ÷88.42; PaO2 kPa ×7.50062
 * (spec §3.1); plaquetas 10*3/uL ≡ 10*9/L. Lei do módulo-pai vale aqui
 * (HAZ-0032): entrada não conversível é REJEITADA ALTO, resultado tipado,
 * nunca adivinhada; a conversão acontece SOMENTE aqui. Funções puras, sem
 * I/O, sem relógio, sem exceção.
 */

/** Quantidade com unidade declarada; unidade vazia é AUSÊNCIA declarada, nunca implícita. */
export interface QuantidadeComUnidade {
  readonly value: number;
  readonly unit: string;
}

export type ConversaoEscalar =
  | { readonly ok: true; readonly valor: number; readonly convertido: boolean }
  | { readonly ok: false; readonly motivo: "unidade_inmapeavel" };

/** PaO2 para mm[Hg]; kPa converte ×7.50062 (spec SOFA §3.1 linha 2). */
export function paraPaO2MmHg(q: QuantidadeComUnidade): ConversaoEscalar {
  if (q.unit === "mm[Hg]") return { ok: true, valor: q.value, convertido: false };
  if (q.unit === "kPa") return { ok: true, valor: q.value * 7.50062, convertido: true };
  return { ok: false, motivo: "unidade_inmapeavel" };
}

/** Bilirrubina total para mg/dL; µmol/L converte ÷17.104 (fator EXATO, OQ-6 (a)). */
export function paraBilirrubinaMgDl(q: QuantidadeComUnidade): ConversaoEscalar {
  if (q.unit === "mg/dL") return { ok: true, valor: q.value, convertido: false };
  if (q.unit === "umol/L") return { ok: true, valor: q.value / 17.104, convertido: true };
  return { ok: false, motivo: "unidade_inmapeavel" };
}

/** Creatinina para mg/dL; µmol/L converte ÷88.42 (fator EXATO, OQ-6 (a)). */
export function paraCreatininaMgDl(q: QuantidadeComUnidade): ConversaoEscalar {
  if (q.unit === "mg/dL") return { ok: true, valor: q.value, convertido: false };
  if (q.unit === "umol/L") return { ok: true, valor: q.value / 88.42, convertido: true };
  return { ok: false, motivo: "unidade_inmapeavel" };
}

/** Plaquetas: `10*3/uL` e `10*9/L` são numericamente idênticos (spec §3.1 linha 5). */
export function paraPlaquetasContagem(q: QuantidadeComUnidade): ConversaoEscalar {
  if (q.unit === "10*3/uL" || q.unit === "10*9/L") {
    return { ok: true, valor: q.value, convertido: false };
  }
  return { ok: false, motivo: "unidade_inmapeavel" };
}
