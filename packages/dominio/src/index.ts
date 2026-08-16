/**
 * @intensicare/dominio
 *
 * Modelos e tipos de domínio compartilhados entre os pacotes e apps do
 * IntensiCare V2. Esta fatia (SPR-G7-2) implementa o modelo conceitual
 * mínimo do prompt §9.3 para a fatia vertical sintética: tenancy
 * (ADR-0003), tempo clínico e fato canônico (ADR-0005) e a máquina de
 * estados de alerta/item de trabalho (ADR-0009). Nenhuma alegação de
 * efetividade clínica ou de conformidade regulatória é feita por este
 * pacote.
 */
import { normalizeEvaluationState, type EvaluationState } from "@intensicare/kernel-clinico";

export const packageVersion = "0.0.0" as const;

export type { EvaluationState };
export { normalizeEvaluationState };

export * from "./tenancy.js";
export * from "./time.js";
export * from "./identity.js";
export * from "./clinical-observation.js";
export * from "./work-item.js";
export * from "./audit-event.js";
