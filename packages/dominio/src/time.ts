/**
 * Modelo de tempo clínico (ADR-0005 M3, aceito em GDEC-0008). Cada instante
 * clínico distinto é representado como um valor explicitamente presente ou
 * explicitamente ausente — nunca omitido, nunca defaultado a "agora" nem a
 * um instante vizinho (DOM-0009; regra não-negociável §3-8 do prompt;
 * HAZ-0007). Quando presente, o instante preserva UTC normalizado, offset
 * original, precisão original, valor-fonte cru e fuso horário quando
 * determinável — exatamente os campos que ADR-0005 M3 exige por ponto de
 * tempo.
 *
 * Nenhuma alegação de efetividade clínica é feita por este módulo.
 */

/** Precisão original do valor-fonte de um instante clínico. */
export type ClinicalInstantPrecision = "day" | "minute" | "second" | "millisecond";

/**
 * Um instante clínico presente, com toda a informação de origem
 * preservada (ADR-0005 M3) — nada aqui é inferido ou completado por este
 * pacote.
 */
export interface ClinicalInstant {
  /** UTC normalizado, ISO 8601 com sufixo "Z" (ex.: "2026-08-16T12:00:00.000Z"). */
  readonly utc: string;
  /** Offset original da fonte, preservado verbatim (ex.: "-03:00"). */
  readonly offset: string;
  /** Precisão original do valor-fonte, quando conhecida. */
  readonly precision?: ClinicalInstantPrecision;
  /** Valor cru exatamente como recebido da fonte, antes de qualquer normalização. */
  readonly sourceValue?: string;
  /** Fuso horário IANA de origem, quando determinável (ex.: "America/Sao_Paulo"). */
  readonly timezone?: string;
}

/**
 * Um instante clínico explicitamente ausente. A ausência é um estado de
 * primeira classe — nunca um campo simplesmente vazio nem um default
 * silencioso (DOM-0009; ADR-0005 M3/M7; HAZ-0007, HAZ-0005).
 */
export interface AbsentClinicalInstant {
  readonly reason: string;
}

/**
 * União discriminada que torna estruturalmente impossível esquecer de
 * declarar ausência: todo tempo clínico desta fatia é `"present"` (com
 * `ClinicalInstant`) ou `"absent"` (com motivo) — nunca um campo omitido
 * silenciosamente.
 */
export type TemporalValue =
  | { readonly kind: "present"; readonly instant: ClinicalInstant }
  | { readonly kind: "absent"; readonly absent: AbsentClinicalInstant };

/** Constrói um `TemporalValue` presente a partir de um `ClinicalInstant`. */
export function presentInstant(instant: ClinicalInstant): TemporalValue {
  return { kind: "present", instant };
}

/** Constrói um `TemporalValue` explicitamente ausente, com motivo obrigatório. */
export function absentInstant(reason: string): TemporalValue {
  return { kind: "absent", absent: { reason } };
}

export function isPresentInstant(
  value: TemporalValue,
): value is { kind: "present"; instant: ClinicalInstant } {
  return value.kind === "present";
}

export function isAbsentInstant(
  value: TemporalValue,
): value is { kind: "absent"; absent: AbsentClinicalInstant } {
  return value.kind === "absent";
}
