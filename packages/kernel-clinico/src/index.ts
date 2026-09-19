/**
 * @intensicare/kernel-clinico
 *
 * Núcleo clínico determinístico. PREMISSA (reversível, GDEC-0015/0017):
 * este pacote não tem NENHUMA dependência de runtime (ver
 * docs/06-architecture/premissas-de-construcao.md PRE-02) — apenas tipos e
 * funções puras, testáveis sem I/O, sem rede, sem banco de dados e SEM
 * relógio interno (todo tempo entra por parâmetro).
 *
 * Conteúdo: DUAS vias clínicas determinísticas, independentes entre si —
 * - avaliador NEWS2 conforme RULE-NEWS2 0.2.0
 *   (docs/05-clinical-safety/rule-releases/news2/), classe 1 da ADR-0026;
 * - avaliador GCS conforme RULE-GCS 0.2.0
 *   (docs/05-clinical-safety/rule-releases/gcs/), classe 4 da ADR-0026
 *   (enumeração de instrumento único: NT de primeira classe, sem parcial),
 *   com o gate de confundimento por sedação FAIL-CLOSED da ADR-0028.
 *
 * Ambas usam os cinco estados de avaliação da ADR-0008 e o gate etário
 * fail-closed da ADR-0027. Nenhuma alegação de efetividade clínica,
 * conformidade regulatória ou segurança comprovada é feita por este pacote.
 */

/** Versão do pacote do núcleo clínico, para fins de diagnóstico. */
export const packageVersion = "0.0.0" as const;

// ---------------------------------------------------------------------------
// API da avaliação NEWS2 (RULE-NEWS2 0.2.0)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Gate etário compartilhado (ADR-0027) — mesma lógica nas duas regras.
// ---------------------------------------------------------------------------

export { type AgeGateReason, type AgeGateResult, evaluateAgeGate } from "./population.js";

// ---------------------------------------------------------------------------
// API da avaliação GCS (RULE-GCS 0.2.0)
// ---------------------------------------------------------------------------

export {
  evaluateGcs,
  GCS_CARE_GOALS_ANNOTATION_PT,
  GCS_COMPONENT_CONTEMPORANEITY_MINUTES,
  GCS_COMPONENT_EXPIRY_MINUTES,
  GCS_COMPONENT_WINDOW_MINUTES,
  GCS_PRE_SEDATION_MAX_AGE_MINUTES,
  GCS_RASS_PAIRING_MINUTES,
  GCS_RULE_ID,
  GCS_RULE_VERSION,
  GCS_SEDATION_RASS_THRESHOLD,
  NT_REASON_LABEL_PT,
  reassessGcsAtReadTime,
} from "./gcs.js";
export type {
  GcsAssessabilityState,
  GcsComponentContribution,
  GcsComponentId,
  GcsComponentObservationInput,
  GcsComponentValue,
  GcsEvaluationInput,
  GcsEvaluationRecord,
  GcsNoFireReason,
  GcsNtReason,
  GcsPreSedationReference,
  GcsSourceProvidedTotalInput,
  RassObservationInput,
  SedativeExposureState,
} from "./types.js";
export { GCS_COMPONENT_ORDER } from "./types.js";

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

// ---------------------------------------------------------------------------
// API dos normalizadores de unidades (ORQ-4, CRIT-3) — PISO APENAS, sem
// consumidor conectado (decisão de consumo é de stream a jusante, com
// evidência própria). Torna estruturalmente impossíveis os quatro vícios de
// unidade que corromperam o V1: FiO2 percento-vs-fração (~100×), taxa-vs-dose
// de vasopressor (60×/inconversível), lactato mg/dL-vs-mmol/L (~9×) e peso
// com vírgula decimal (~10×, SYS-09). Fontes normativas: hemodynamics.md §4
// (canônico mcg/kg/min; fórmula de taxa; vasopressina U/min apenas) e
// units-registry.md (FiO2 fração 0.21–1.0; lactato ×0.111; parse PT-BR).
// Quantidades são marcas opacas sobre `number`: número cru não compila onde a
// marca é exigida (prova em src/unidades/provas-de-tipo.ts). Rejeições
// devolvem resultado tipado — nunca lançam; `rejected_missing_inputs` é o
// único literal definido pela especificação, os demais são módulo-local
// pendentes de ratificação.
// ---------------------------------------------------------------------------

export {
  type CategoriaVasopressora,
  type DoseMcgKgMin,
  type DoseUmin,
  doseMcgKgMinDeMcgKgH,
  doseMcgKgMinDeMgKgMin,
  doseMcgKgMinDeTaxaInfusao,
  doseUminDeUh,
  doseUminDeUmin,
  normalizarDoseVasopressora,
  type UnidadeDoseVasopressora,
} from "./unidades/dose.js";
export {
  type Fio2Fracao,
  type Fio2Percentual,
  fio2FracaoDeNumero,
  fio2PercentualDeNumero,
  fio2PercentualParaFracao,
} from "./unidades/fio2.js";
export {
  type LactatoMgDl,
  type LactatoMmolL,
  lactatoMgDlDeNumero,
  lactatoMgDlParaMmolL,
  lactatoMmolLDeNumero,
} from "./unidades/lactato.js";
export {
  PESO_KG_LIMITES_PLAUSIBILIDADE,
  type PesoValidado,
  parsePesoPtBr,
  pesoDeNumeroKg,
  pesoDeTextoAscii,
} from "./unidades/peso.js";
export type { MotivoRejeicao, ResultadoQuantidade } from "./unidades/tipos.js";
