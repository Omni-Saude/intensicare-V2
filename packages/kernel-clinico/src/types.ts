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
  /**
   * Estado ANTERIOR da série do paciente, para o gatilho de borda do alerta
   * de deterioração (catálogo irmão ALERT-EWS-NEWS2-DETERIORATION-01:
   * edge_trigger := (news2 >= 7 E news2_prev < 7) OU novo parâmetro
   * vermelho). O kernel permanece PURO: comparação entra, veredito sai.
   *
   * `totalScore: null` ⇒ total anterior desconhecido (avaliação anterior não
   * computável ou ausente). `redParameters` vazio ⇒ anterior conhecido SEM
   * vermelho; a união inteira `priorState: undefined` ⇒ estado anterior
   * DESCONHECIDO — premissa reversível: desconhecido ARMA o gatilho (a
   * primeira piora observada alerta). Política de gatilho pendente de
   * ratificação (RAT-EWS trigger policy); NENHUMA banda ou escala é tocada
   * por este campo (NEWS2-C-01).
   */
  readonly priorState?: {
    readonly totalScore: number | null;
    readonly redParameters: readonly News2ParameterId[];
  } | null;
}

/**
 * Status de um parâmetro/componente individual dentro de uma avaliação.
 *
 * `not_testable` é o token NT de primeira classe da RULE-GCS (classe 4 da
 * ADR-0026: enumeração de instrumento único) — "o avaliador tentou e o
 * componente não era testável". É INALCANÇÁVEL na RULE-NEWS2 (nenhum
 * parâmetro NEWS2 tem convenção NT publicada) e NUNCA é conversível em
 * `missing` nem em número (glasgowcomascale.org: "do not use number '1' to
 * record missing component").
 */
export type ParameterStatus =
  | "valid"
  | "missing"
  | "missing_clinical_time"
  | "not_testable"
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
 * Motivo do veredito do gatilho de borda do alerta de deterioração
 * (catálogo irmão ALERT-EWS-NEWS2-DETERIORATION-01). Cruzamento ascendente
 * do total tem precedência sobre novo vermelho quando ambos ocorrem.
 */
export type AlertCrossingReason = "ascending_total_crossing" | "new_red_parameter";

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
   * auto-escalonamento (spec §4.2). NÃO é o gatilho do alerta de
   * deterioração: para o gatilho de borda, ver `alertCrossing`.
   */
  readonly fires: boolean;
  /**
   * Veredito do GATILHO DE BORDA do alerta de deterioração (catálogo irmão
   * ALERT-EWS-NEWS2-DETERIORATION-01): cruzamento ascendente do total
   * (>=7 com anterior <7 ou desconhecido) OU novo parâmetro vermelho (==3
   * não vermelho na medição anterior). `true` SOMENTE sob `status ===
   * "valid"`; patamar alto PERSISTENTE não é cruzamento. Política de
   * gatilho pendente de ratificação (RAT-EWS trigger policy).
   */
  readonly alertCrossing: boolean;
  /** Motivo do veredito; `null` quando `alertCrossing` é `false`. */
  readonly alertCrossingReason: AlertCrossingReason | null;
  /**
   * Estado anterior EFETIVAMENTE CONSIDERADO no veredito (`null` quando
   * nenhum veredito foi computado — registro não pontuável). `news2Prev:
   * null` e `prevRedParameters: null` preservam a distinção "desconhecido"
   * vs. "conhecido e vazio" para replay byte a byte.
   */
  readonly alertCrossingInputs: {
    readonly news2Prev: number | null;
    readonly prevRedParameters: readonly News2ParameterId[] | null;
  } | null;
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

// ---------------------------------------------------------------------------
// RULE-GCS 0.2.0 — Escala de Coma de Glasgow (segunda via determinística)
//
// Fontes normativas (lidas integralmente na autoria):
// - docs/05-clinical-safety/rule-releases/gcs/specification.md (0.2.0)
// - docs/05-clinical-safety/rule-releases/gcs/reference-vectors.md (18 ativos)
// - ADR-0008 (cinco estados; precedência P-a; N3 razões; N5 atualidade)
// - ADR-0026 (política de insumo ausente — CLASSE 4, enumeração de instrumento
//   único: sem parcial; NT é valor de primeira classe; token fora da
//   enumeração ⇒ `invalid`) — classe DIFERENTE da classe 1 do NEWS2
// - ADR-0027 (gate etário fail-closed >=18 produto-wide)
// - ADR-0028 (confundimento por sedação: A28-1 conjunção-com-exposição,
//   A28-2 FAIL-CLOSED para sedação desconhecida, A28-5 limiar RASS <= -3,
//   A28-6 GCS pré-sedação display-only 72 h, A28-7 janelas, A28-8 exibição)
// ---------------------------------------------------------------------------

/** Os três componentes observáveis do instrumento (spec §3.1). */
export type GcsComponentId = "eye" | "verbal" | "motor";

/** Ordem canônica dos componentes — determinismo de listas, razões e exibição. */
export const GCS_COMPONENT_ORDER: readonly GcsComponentId[] = ["eye", "verbal", "motor"];

/**
 * Vocabulário GOVERNADO de motivos de NT (spec §3.3). Extensão somente por
 * revisão da especificação e do registro de reason codes da ADR-0008 — nunca
 * ad hoc. Um motivo fora do vocabulário admissível do componente é falha de
 * integridade (`invalid`), nunca um NT silencioso.
 */
export type GcsNtReason =
  | "eye_trauma_or_edema"
  | "endotracheal_intubation"
  | "tracheostomy"
  | "aphasia"
  | "language_barrier"
  | "deafness"
  | "neuromuscular_blockade"
  | "paralysis_other"
  | "other_documented";

/**
 * Valor de um componente: inteiro TESTADO da enumeração, ou o token NT de
 * primeira classe com motivo. O valor 1 significa "testado e ausente" — jamais
 * "não testado" (spec §3.2; glasgowcomascale.org FAQ).
 */
export type GcsComponentValue =
  | {
      readonly kind: "score";
      readonly value: number;
      /** UCUM adimensional: "{score}", "1" ou vazio. Outra unidade ⇒ `invalid`. */
      readonly unit?: string;
    }
  | { readonly kind: "not_testable"; readonly ntReason: GcsNtReason };

/** Observação de um componente E/V/M (spec §5.1 linhas 2–4). */
export interface GcsComponentObservationInput {
  readonly component: GcsComponentId;
  readonly value: GcsComponentValue;
  /** Tempo CLÍNICO da fonte; `null` ⇒ atualidade indemonstrável (DOM-0009). */
  readonly effectiveTime: string | null;
  readonly receivedTime?: string | null;
  readonly provenance: ObservationProvenance;
}

/** Observação de RASS — entrada de GATE apenas (spec §5.1 linha 6). */
export interface RassObservationInput {
  /** Ordinal −5..+4 (Sessler 2002); fora do domínio ⇒ `invalid`, nunca clampado. */
  readonly value: number;
  readonly effectiveTime: string | null;
  readonly receivedTime?: string | null;
  readonly provenance: ObservationProvenance;
}

/**
 * Estado de exposição sedativa documentado (spec §5.1 linha 7).
 * `unknown` NÃO é "sem sedativo": é insumo de gate ausente (A28-2 fail-closed).
 */
export type SedativeExposureState =
  | "none_active"
  | "active_infusion"
  | "interrupted_window_documented"
  | "unknown";

/** Estado de avaliabilidade da avaliação (ADR-0028 §1.1; spec §4). */
export type GcsAssessabilityState =
  | "testable"
  | "sedation_confounded"
  | "sedation_state_unknown"
  | "not_applicable";

/**
 * GCS total fornecido pela fonte (LOINC candidato 9269-2). NUNCA é aceito como
 * entrada de computação (spec §5.2, OQ-GCS-6): serve só para cross-check da
 * soma dos três componentes testados.
 */
export interface GcsSourceProvidedTotalInput {
  readonly value: number;
  readonly effectiveTime: string | null;
}

/**
 * Última GCS pré-sedação — EXIBIÇÃO APENAS (ADR-0028 A28-6): idade máxima
 * 72 h, timestamp visível, jamais entra em cômputo.
 */
export interface GcsPreSedationReference {
  readonly total: number;
  readonly observedAt: string;
}

/** Entrada completa de uma avaliação RULE-GCS — todo tempo vem por parâmetro. */
export interface GcsEvaluationInput {
  /** Instante da avaliação (ISO 8601). Não há relógio interno no kernel. */
  readonly evaluationTime: string;
  readonly age: AgeInput;
  readonly components: readonly GcsComponentObservationInput[];
  /** RASS pareado; ausente ⇒ estado de sedação desconhecido (fail-closed). */
  readonly rass?: RassObservationInput | null;
  readonly sedativeExposure: SedativeExposureState;
  readonly sourceProvidedTotal?: GcsSourceProvidedTotalInput | null;
  readonly lastPreSedationGcs?: GcsPreSedationReference | null;
  /**
   * Ordem de limitação terapêutica documentada (spec §1.3.1, HAZ-0044): a
   * AVALIAÇÃO NÃO é suprimida; apenas anota-se que qualquer vínculo futuro de
   * alerta/work-item deve consultar as metas de cuidado.
   */
  readonly treatmentLimitationOrderDocumented?: boolean;
  readonly lastValidEvaluationTime?: string | null;
}

/** Contribuição de um componente, com explicação pt-BR — nunca "ausente → 0". */
export interface GcsComponentContribution {
  readonly component: GcsComponentId;
  readonly status: ParameterStatus;
  /**
   * Valor OBSERVADO do componente (exibição). Existe também sob `stale`
   * (spec §5.3: "último valor e idade exibidos"); é `null` sob NT, ausência,
   * expiração, quarentena e invalidez. Um valor de componente NUNCA é somável
   * por si — o único número somado é `total`, e só sob `status: "valid"` do
   * registro agregado.
   */
  readonly value: number | null;
  /** Motivo governado do NT, quando `status === "not_testable"`. */
  readonly ntReason: GcsNtReason | null;
  /** Razão legível por máquina quando o componente não é `valid`. */
  readonly reason: string | null;
  readonly effectiveTime: string | null;
  readonly ageMinutes: number | null;
  /** Explicação em pt-BR da contribuição (ou da razão de não contribuir). */
  readonly explanation: string;
}

/**
 * Motivo de não disparo (convenção §0.4 do documento de vetores). RULE-GCS
 * 0.2.0 não define NENHUMA condição de alerta: `fires` é sempre `false`.
 */
export type GcsNoFireReason =
  | "criteria_not_met"
  | "insufficient_data"
  | "stale_data"
  | "invalid_data"
  | "out_of_population_scope";

/**
 * Registro de avaliação RULE-GCS — imutável, determinístico, replayável.
 * O total 3–15 existe SOMENTE quando `status === "valid"` (spec §3.5/§6.1).
 */
export interface GcsEvaluationRecord {
  readonly ruleId: "RULE-GCS";
  /** Versão pinada da spec (precursor 0.2.0; ADR-0025). */
  readonly ruleVersion: "0.2.0";
  readonly evaluationTime: string;
  /** `partial` é INALCANÇÁVEL nesta regra (spec §6: nenhuma política parcial). */
  readonly status: EvaluationStatus;
  /** Razões legíveis por máquina; >= 1 sempre que o status não é `valid` (N3). */
  readonly reasons: readonly string[];
  /** Razão dominante pela precedência declarada; `null` apenas sob `valid`. */
  readonly primaryReason: string | null;
  /** Total 3–15 — `null` em QUALQUER status diferente de `valid` (HAZ-0005). */
  readonly total: number | null;
  readonly components: readonly GcsComponentContribution[];
  readonly assessability: GcsAssessabilityState;
  /** RASS efetivamente pareado (ordinal) — `null` quando não pareado/ausente. */
  readonly pairedRass: number | null;
  readonly populationGate: PopulationGateResult;
  readonly notTestableComponents: readonly GcsComponentId[];
  readonly missingComponents: readonly GcsComponentId[];
  readonly staleComponents: readonly GcsComponentId[];
  readonly expiredComponents: readonly GcsComponentId[];
  readonly invalidComponents: readonly GcsComponentId[];
  readonly quarantinedComponents: readonly GcsComponentId[];
  /**
   * Convenção de exibição ratificada (OQ-GCS-7, ADR-0028 A28-8), p.ex.
   * "E4 V-NT(intubação endotraqueal) M6" — APRESENTAÇÃO, jamais aritmética.
   */
  readonly componentDisplay: string;
  /** RULE-GCS 0.2.0 não define condição de disparo: sempre `false`. */
  readonly fires: false;
  readonly noFireReason: GcsNoFireReason;
  /** Anotações visíveis obrigatórias, em pt-BR. */
  readonly annotations: readonly string[];
  /** Explicação agregada em pt-BR (spec §10). */
  readonly explanation: string;
}
