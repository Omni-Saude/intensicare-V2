/**
 * @intensicare/kernel-clinico
 *
 * Núcleo clínico determinístico. PREMISSA (reversível, GDEC-0015/0017):
 * este pacote não tem NENHUMA dependência de runtime (ver
 * docs/06-architecture/premissas-de-construcao.md PRE-02) — apenas tipos e
 * funções puras, testáveis sem I/O, sem rede, sem banco de dados e SEM
 * relógio interno (todo tempo entra por parâmetro).
 *
 * Conteúdo desta fatia (SPR-G7-2): avaliador NEWS2 determinístico conforme
 * RULE-NEWS2 0.2.0 (docs/05-clinical-safety/rule-releases/news2/), com os
 * cinco estados de avaliação da ADR-0008, política de insumo ausente da
 * ADR-0026 (classe 1) e gating etário fail-closed da ADR-0027. Nenhuma
 * alegação de efetividade clínica, conformidade regulatória ou segurança
 * comprovada é feita por este pacote.
 */

/** Versão do pacote do núcleo clínico, para fins de diagnóstico. */
export const packageVersion = "0.0.0" as const;

// ---------------------------------------------------------------------------
// API da avaliação NEWS2 (RULE-NEWS2 0.2.0)
// ---------------------------------------------------------------------------

export type {
  AcvpuToken,
  AgeInput,
  ConflictResolutionRecord,
  EvaluationRecord,
  EvaluationStatus,
  News2EvaluationInput,
  News2ParameterId,
  O2StatusCode,
  ObservationInput,
  ObservationProvenance,
  ObservationValue,
  ParameterContribution,
  ParameterStatus,
  PopulationGateResult,
  PregnancyInput,
  ReadTimeReassessment,
  RiskTier,
  SedationState,
  SourceDataQuality,
  Spo2Scale,
  Spo2ScaleAssignmentInput,
} from "./types.js";

export { NEWS2_PARAMETER_ORDER } from "./types.js";

export {
  ESCALATION_SUPPRESSION_REASON_PT,
  evaluateNews2,
  evaluatePopulationGate,
  MINIMUM_AGE_YEARS,
  NEWS2_RULE_ID,
  NEWS2_RULE_VERSION,
  PREGNANCY_NOT_VERIFIED_ANNOTATION_PT,
  reassessNews2AtReadTime,
  roundToChartUnits,
} from "./news2.js";

// ---------------------------------------------------------------------------
// Exports legados do esqueleto SPR-G7-1 — mantidos porque @intensicare/dominio
// os importa; NÃO usar em código novo (o vocabulário real dos cinco estados é
// `EvaluationStatus`, da ADR-0008). Remoção planejada quando o consumidor
// migrar (fora do escopo de escrita desta fatia).
// ---------------------------------------------------------------------------

/** @deprecated Use `EvaluationStatus` (cinco estados da ADR-0008). */
export type EvaluationState = "complete" | "partial" | "unavailable";

/** @deprecated Função de fundação do esqueleto SPR-G7-1; sem uso clínico. */
export function normalizeEvaluationState(state: EvaluationState): EvaluationState {
  return state;
}
