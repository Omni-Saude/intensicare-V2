/**
 * Tipos do núcleo clínico determinístico — avaliação NEWS2 (RULE-NEWS2 0.2.0).
 *
 * Fontes normativas (lidas integralmente na autoria):
 * - docs/05-clinical-safety/rule-releases/news2/specification.md (0.2.0)
 * - docs/06-architecture/adrs/ADR-0008-* (cinco estados de avaliação, precedência P-a)
 * - docs/06-architecture/adrs/ADR-0026-* (política de insumo ausente — classe 1, INV-A/INV-B)
 * - docs/06-architecture/adrs/ADR-0027-* (gating etário fail-closed, >=18 produto-wide)
 * - docs/06-architecture/adrs/ADR-0025-* (edição canônica: RCP 2017; versão pinada)
 *
 * Regras estruturais deste módulo:
 * - Nenhuma dependência de runtime; nenhum relógio interno (todo tempo é parâmetro).
 * - Nenhum caminho em que insumo ausente vire 0/normal/silêncio (HAZ-0005, INV-A).
 * - Nenhuma alegação de efetividade clínica, conformidade regulatória ou segurança
 *   comprovada é feita por este código.
 */

/**
 * Os cinco estados de avaliação da ADR-0008 (anexo normativo N1), EXPLÍCITOS.
 * Precedência (N2, opção P-a): invalid > not_evaluated > stale > partial > valid.
 *
 * Notas de alcançabilidade nesta regra (RULE-NEWS2 0.2.0):
 * - `partial` é INALCANÇÁVEL em tempo de avaliação (decisão N-8, GDEC-0007:
 *   all-or-not_evaluated é permanente para NEWS2).
 * - `stale` é um estado de TEMPO DE LEITURA (spec §5.3): em tempo de avaliação,
 *   insumo fora de janela produz `not_evaluated` (`stale_input:*`); um registro
 *   `valid` envelhecido transita para `stale` via `reassessNews2AtReadTime`.
 */
export type EvaluationStatus = "valid" | "partial" | "not_evaluated" | "stale" | "invalid";

/** Os sete parâmetros pontuados do NEWS2 (spec §2.1, linhas 1–7). */
export type News2ParameterId =
  | "rr"
  | "spo2"
  | "o2_status"
  | "sbp"
  | "pulse"
  | "consciousness"
  | "temperature";

/** Ordem canônica dos parâmetros — usada para determinismo de listas e razões. */
export const NEWS2_PARAMETER_ORDER: readonly News2ParameterId[] = [
  "rr",
  "spo2",
  "o2_status",
  "sbp",
  "pulse",
  "consciousness",
  "temperature",
];

/** Bandas de risco agregadas (spec §4.2, RCP 2017 Chart 2) — semântica CONSULTIVA. */
export type RiskTier = "low" | "low_medium" | "medium" | "high";

/** Token ACVPU válido (spec §2.1 linha 6; RCP Recs 29–30). */
export type AcvpuToken = "A" | "C" | "V" | "P" | "U";

/** Estado de suplementação de oxigênio documentado (spec §2.1 linha 3). */
export type O2StatusCode = "air" | "oxygen";

/** Escala de SpO2 governada (spec §3). */
export type Spo2Scale = "scale1" | "scale2";

/** Qualidade de dado da fonte — dimensão SEPARADA do status de avaliação (ADR-0008 N8). */
export type SourceDataQuality = "valid" | "warning" | "quarantined";

/** Estado de sedação anotado no insumo de consciência (decisão N-4, GDEC-0007). */
export type SedationState = "sedado" | "nao_sedado" | "nao_informado";

/** Proveniência mínima de uma observação (dados sintéticos: prefixo "SYNTH-"). */
export interface ObservationProvenance {
  /** Sistema de origem (sintético nesta fatia, ex.: "SYNTH-monitor-01"). */
  readonly sourceSystem: string;
  /** Qualidade de dado da fonte — nunca colapsa no status de avaliação (HAZ-0040). */
  readonly sourceDataQuality: SourceDataQuality;
}

/** Valor de observação: quantidade com unidade UCUM, ou token codificado. */
export type ObservationValue =
  | { readonly kind: "quantity"; readonly value: number; readonly unit: string }
  | { readonly kind: "code"; readonly code: string };

/**
 * Observação de entrada. `effectiveTime` é o tempo CLÍNICO da fonte (base do
 * cálculo de atualidade — SAF-0004); `receivedTime` é apenas registro.
 * `effectiveTime: null` significa tempo clínico ausente — o insumo entra como
 * indisponível com razão `missing_clinical_time:<param>` (ADR-0008 N5); nunca
 * se assume "agora" (DOM-0009).
 */
export interface ObservationInput {
  readonly parameter: News2ParameterId;
  readonly value: ObservationValue;
  readonly effectiveTime: string | null;
  readonly receivedTime?: string | null;
  readonly provenance: ObservationProvenance;
  /** Obrigatório em consciência por N-4; ausente ⇒ anotado como "não informado". */
  readonly sedationState?: SedationState;
}

/**
 * Atribuição governada de escala de SpO2 (spec §3.2): ordem clínica documentada.
 * Ausência ⇒ Escala 1 (default seguro com base na fonte — RCP Rec 27).
 */
export interface Spo2ScaleAssignmentInput {
  readonly scale: Spo2Scale;
  /** Identidade do autor da ordem (sintética nesta fatia, ex.: "SYNTH-medico-01"). */
  readonly orderedBy: string;
  /** Instante da ordem (ISO 8601) — idade da ordem é sempre visível (N-6). */
  readonly orderedAt: string;
  readonly revoked?: boolean;
}

/** Idade verificada ou desconhecida — nunca se presume adulto (spec §1.2, HAZ-0036). */
export type AgeInput =
  | { readonly kind: "verified"; readonly years: number }
  | { readonly kind: "unknown" };

/**
 * Estado documental de gravidez (decisão N-2, GDEC-0007):
 * - "documented"     → fora de população (instrumento obstétrico indicado);
 * - "not_documented" → pontua com anotação visível "gravidez não verificada".
 */
export type PregnancyInput = "documented" | "not_documented";

/** Entrada completa de uma avaliação NEWS2 — todo tempo vem por parâmetro. */
export interface News2EvaluationInput {
  /** Instante da avaliação (ISO 8601). Não há relógio interno no kernel. */
  readonly evaluationTime: string;
  readonly age: AgeInput;
  readonly pregnancy: PregnancyInput;
  readonly observations: readonly ObservationInput[];
  readonly spo2ScaleAssignments?: readonly Spo2ScaleAssignmentInput[];
  /**
   * Ordem de limitação terapêutica documentada (decisão N-3, GDEC-0007):
   * o escore é sempre computado; apenas a exibição do escalonamento é
   * suprimida, com razão visível (HAZ-0044).
   */
  readonly treatmentLimitationOrderDocumented?: boolean;
  /** Última avaliação válida conhecida (para o texto de não-avaliado da spec §7). */
  readonly lastValidEvaluationTime?: string | null;
}

/** Status de um parâmetro individual dentro da avaliação. */
export type ParameterStatus =
  | "valid"
  | "missing"
  | "missing_clinical_time"
  | "stale"
  | "expired"
  | "invalid"
  | "quarantined"
  | "not_evaluated";

/** Registro de resolução de duplicatas dentro da tolerância (decisão N-10). */
export interface ConflictResolutionRecord {
  /** Valores simultâneos candidatos (após deduplicação exata). */
  readonly candidates: readonly number[];
  /** Valor escolhido — o PIOR (mais anormal) dentro da tolerância. */
  readonly chosenValue: number;
  /** Tolerância de dispositivo aplicada (spec §2.3). */
  readonly toleranceApplied: number;
}

/** Contribuição por parâmetro, com explicação pt-BR — nunca "ausente → 0". */
export interface ParameterContribution {
  readonly parameter: News2ParameterId;
  readonly status: ParameterStatus;
  /** Pontos do parâmetro; null sempre que o parâmetro não pôde pontuar. */
  readonly score: number | null;
  /** Razão legível por máquina (vocabulário spec §5.2 / ADR-0008 N3), se não-válido. */
  readonly reason: string | null;
  /** Valor efetivamente usado na banda (após arredondamento de chart), se houver. */
  readonly valueUsed: ObservationValue | null;
  readonly effectiveTime: string | null;
  /** Idade do insumo em minutos no instante da avaliação (null se inaplicável). */
  readonly ageMinutes: number | null;
  /** Registro da resolução de duplicatas dentro de tolerância, quando ocorreu. */
  readonly conflictResolution: ConflictResolutionRecord | null;
  /** Explicação em pt-BR da contribuição (ou da razão de não contribuir). */
  readonly explanation: string;
}

/** Resultado do gate populacional (ADR-0027, Opção A — choke point pré-avaliação). */
export interface PopulationGateResult {
  readonly passed: boolean;
  readonly reason: "unknown_age" | "under_age" | "pregnancy_documented" | null;
}

/**
 * Registro de avaliação NEWS2 — imutável, determinístico, replayável.
 * Um total numérico existe SOMENTE quando `status === "valid"` (spec §5.1).
 */
export interface EvaluationRecord {
  readonly ruleId: "RULE-NEWS2";
  /** Versão pinada da regra, conforme a spec (precursor 0.2.0; ADR-0025). */
  readonly ruleVersion: "0.2.0";
  readonly evaluationTime: string;
  readonly status: EvaluationStatus;
  /** Razões legíveis por máquina; obrigatoriamente >= 1 quando não-válido (N3). */
  readonly reasons: readonly string[];
  /** Total agregado — null em QUALQUER status diferente de `valid` (HAZ-0005). */
  readonly totalScore: number | null;
  /** Banda de risco consultiva — null quando não há total válido. */
  readonly riskTier: RiskTier | null;
  /**
   * Parâmetro vermelho (pontuação 3 individual) presente entre os insumos
   * VÁLIDOS — pode escalar isoladamente mesmo com total não computável
   * (INV-B, ADR-0026 classe 1; A26-1).
   */
  readonly redParameter: boolean;
  /**
   * Condição de exibição de escalonamento consultivo atingida
   * (tier low_medium/medium/high) — semântica de EXIBIÇÃO, nunca
   * auto-escalonamento (spec §4.2).
   */
  readonly fires: boolean;
  /** Escala de SpO2 efetivamente usada (null quando SpO2 não pôde ser pontuada). */
  readonly spo2ScaleUsed: Spo2Scale | null;
  readonly populationGate: PopulationGateResult;
  /** Detalhe por parâmetro, na ordem canônica — sempre presente (spec §5.1). */
  readonly parameters: readonly ParameterContribution[];
  /** Insumos ausentes DECLARADOS — jamais silenciosamente normais (HAZ-0005). */
  readonly missingInputs: readonly News2ParameterId[];
  /** Insumos fora de janela (dentro do horizonte de expiração) declarados. */
  readonly staleInputs: readonly News2ParameterId[];
  /** Insumos além do horizonte de expiração declarados. */
  readonly expiredInputs: readonly News2ParameterId[];
  /** Insumos com falha de integridade (implausível/inmapeável/conflito). */
  readonly invalidInputs: readonly News2ParameterId[];
  /** Insumos com fonte em quarentena — nunca contribuem (regra das duas dimensões). */
  readonly quarantinedInputs: readonly News2ParameterId[];
  /** Anotações visíveis obrigatórias (N-2/N-3/N-4/N-6), em pt-BR. */
  readonly annotations: readonly string[];
  /** Supressão de exibição de escalonamento sob ordem de limitação (N-3). */
  readonly escalationSuppressed: boolean;
  readonly escalationSuppressionReason: string | null;
  /** Explicação agregada em pt-BR (spec §7). */
  readonly explanation: string;
}

/** Reavaliação de status em tempo de leitura (spec §5.3; ADR-0008 N5). */
export interface ReadTimeReassessment {
  /** `valid` | `stale` | `not_evaluated` — recomputado na leitura, nunca congelado. */
  readonly status: EvaluationStatus;
  readonly reasons: readonly string[];
  /** Idade do insumo mais antigo (minutos) no instante de leitura, se aplicável. */
  readonly oldestInputAgeMinutes: number | null;
}
