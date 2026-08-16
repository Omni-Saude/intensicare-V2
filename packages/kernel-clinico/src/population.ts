/**
 * Gate etário/populacional compartilhado pelas regras do kernel.
 *
 * Extraído de `news2.ts` SEM mudança de comportamento: a RULE-NEWS2 continua
 * aplicando exatamente a mesma ordem de verificação (idade desconhecida →
 * idade abaixo do limiar → gravidez documentada), apenas delegando a parte
 * etária a esta função. A RULE-GCS usa o mesmo gate etário, com o vocabulário
 * de razão da SUA especificação (`population_unverified` /
 * `out_of_population_scope`, RULE-GCS §1.2) — o gate é o mesmo, os tokens de
 * razão pertencem a cada rule release.
 *
 * Base normativa: ADR-0027 (A27-1: >=18 produto-wide; Opção A: choke point
 * aplicado ANTES de qualquer lógica de regra; idade desconhecida NUNCA presume
 * adulto — HAZ-0036).
 *
 * Função pura, total, sem relógio interno.
 */

import type { AgeInput } from "./types.js";

/** Limiar etário produto-wide (ADR-0027, decisão A27-1). */
export const MINIMUM_AGE_YEARS = 18;

/** Razão de reprovação do gate etário — nunca "presumido adulto". */
export type AgeGateReason = "unknown_age" | "under_age";

/** Resultado do gate etário isolado (sem cláusulas específicas de regra). */
export interface AgeGateResult {
  readonly passed: boolean;
  readonly reason: AgeGateReason | null;
}

/**
 * Gate etário fail-closed: idade não verificável ⇒ reprovado (`unknown_age`);
 * idade verificada abaixo do limiar ⇒ reprovado (`under_age`).
 */
export function evaluateAgeGate(age: AgeInput): AgeGateResult {
  if (age.kind === "unknown" || !Number.isFinite((age as { years?: number }).years ?? Number.NaN)) {
    return { passed: false, reason: "unknown_age" };
  }
  if (age.kind === "verified" && age.years < MINIMUM_AGE_YEARS) {
    return { passed: false, reason: "under_age" };
  }
  return { passed: true, reason: null };
}
