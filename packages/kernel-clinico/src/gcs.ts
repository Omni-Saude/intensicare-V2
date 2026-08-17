/**
 * Avaliador GCS determinístico — RULE-GCS 0.2.0 (precursor, não assinado).
 *
 * Segunda via clínica determinística do kernel (a primeira é RULE-NEWS2).
 * Implementa a spec docs/05-clinical-safety/rule-releases/gcs/specification.md:
 * - componentes E/V/M com estado NT (não testável) de PRIMEIRA CLASSE
 *   (spec §3.1–§3.4; glasgowcomascale.org: "do not use number '1' to record
 *   missing component"); o valor 1 é "testado e ausente", jamais "não testado";
 * - total 3–15 emitido SOMENTE com os três componentes testados, na janela,
 *   contemporâneos entre si, com gate populacional e gate de sedação
 *   satisfeitos (spec §3.5/§6.1) — nenhum total parcial, nunca (§6);
 * - gate de avaliabilidade por confusão sedativa FAIL-CLOSED (spec §4;
 *   ADR-0028 A28-1/A28-2/A28-5): RASS pareado ≥ −2 destrava; RASS ≤ −3 com
 *   exposição sedativa ativa OU desconhecida ⇒ `sedation_confounded`; coma
 *   documentadamente NÃO sedado escora; RASS ausente/não pareado ⇒
 *   `sedation_state_unknown`;
 * - gate populacional fail-closed (ADR-0027 A27-1: ≥18 produto-wide; idade
 *   desconhecida NUNCA presume adulto — HAZ-0036);
 * - política de insumo ausente da CLASSE 4 da ADR-0026 (enumeração de
 *   instrumento único — classe DIFERENTE da classe 1 do NEWS2): sem parcial,
 *   NT é valor de primeira classe, token fora da enumeração ⇒ `invalid`
 *   (INV-C), precondição de gate ausente ⇒ estado explícito (INV-D);
 * - proibição total de coerção (HAZ-0005; spec §6.2): ausência, NT, staleness,
 *   invalidez e confusão sedativa existem SOMENTE como status + razão;
 * - precedência de status (ADR-0008 N2, P-a): invalid > not_evaluated >
 *   stale > valid (`partial` é inalcançável nesta regra).
 *
 * Determinismo: nenhuma leitura de relógio, nenhuma aleatoriedade, nenhuma
 * chamada externa — todo tempo entra por parâmetro; mesma entrada ⇒ mesmo
 * registro, byte a byte.
 *
 * Esta regra NÃO emite banda de severidade ("leve/moderado/grave" — OQ-GCS-9)
 * nem mapeamento automático GCS→ACVPU (OQ-GCS-10/RULE-NEWS2 Q4), e não define
 * nenhuma condição de disparo (`fires` é sempre `false`).
 *
 * PREMISSA (reversível, GDEC-0015/0017): motivo de NT fora do vocabulário
 * admissível do componente ⇒ `invalid` (unmappable_code), fail-closed — a spec
 * §3.3 exige "exatamente um motivo do vocabulário governado" mas não nomeia o
 * status da violação.
 * PREMISSA (reversível, GDEC-0015/0017): `neuromuscular_blockade` é motivo
 * admissível nos TRÊS componentes (spec §3.3 texto decidido OQ-GCS-4 e vetor
 * CRV-GCS-0207); a tabela do bloco YAML §9 o lista só em `motor` — o texto
 * governa por declaração da própria §9.
 * PREMISSA (reversível, GDEC-0015/0017): o pareamento RASS de 1 h é medido
 * contra TODOS os componentes com tempo clínico utilizável (a maior distância
 * governa), não contra um componente eleito.
 * PREMISSA (reversível, GDEC-0015/0017): o gate de sedação só é avaliado
 * quando existe ao menos um componente com valor observado a interpretar;
 * sem nenhum valor observado o estado é `not_applicable` (nada a confundir).
 * PREMISSA (reversível, GDEC-0015/0017): entre observações seriadas do mesmo
 * componente vale o tempo clínico mais recente; valores/tokens divergentes no
 * MESMO tempo clínico ⇒ `conflicting_sources` (sem tolerância — a escala é
 * ordinal, não há tolerância de dispositivo).
 * PREMISSA (reversível, GDEC-0015/0017): integridade checada em TODAS as
 * observações apresentadas do componente (falha-alto), não só na mais recente
 * — mesma disciplina já adotada na RULE-NEWS2.
 * PREMISSA (reversível, GDEC-0015/0017): precedência dentro de um componente:
 * invalidez > expiração > NT > staleness > valid.
 * PREMISSA (reversível, GDEC-0015/0017): ordem das razões agregadas (define
 * `primaryReason`): invalidez → NT → ausência → tempo clínico ausente →
 * quarentena → expiração → não contemporaneidade → gate de sedação →
 * staleness; o conjunto `reasons` traz TODAS as razões aplicáveis (razão a
 * mais nunca tranquiliza).
 * PREMISSA (reversível, GDEC-0015/0017): total fornecido pela fonte fora de
 * 3–15 ⇒ `invalid` (out_of_range:source_total); com os três componentes
 * ausentes, a razão agregada é `missing_required_input:components` (spec §5.2).
 * PREMISSA (reversível, GDEC-0015/0017): tempo clínico futuro ⇒ idade tratada
 * como 0 (dentro da janela); caso não definido na spec — a arbitrar.
 */

import { evaluateAgeGate } from "./population.js";
import {
  type EvaluationStatus,
  GCS_COMPONENT_ORDER,
  type GcsAssessabilityState,
  type GcsComponentContribution,
  type GcsComponentId,
  type GcsComponentObservationInput,
  type GcsEvaluationInput,
  type GcsEvaluationRecord,
  type GcsNoFireReason,
  type GcsNtReason,
  type ParameterStatus,
  type PopulationGateResult,
  type RassObservationInput,
  type ReadTimeReassessment,
  type SedativeExposureState,
} from "./types.js";

export const GCS_RULE_ID = "RULE-GCS" as const;
/** Versão pinada da spec 0.2.0 (ADR-0025: edição Teasdale & Jennett 1974 + abordagem estruturada de glasgowcomascale.org). */
export const GCS_RULE_VERSION = "0.2.0" as const;

const EPS = 1e-9;
const MINUTE_MS = 60_000;

/** Janela de atualidade dos componentes E/V/M (spec §5.3; ADR-0028 A28-7). */
export const GCS_COMPONENT_WINDOW_MINUTES = 12 * 60;
/** Horizonte de expiração dos componentes E/V/M (spec §5.3; ADR-0028 A28-7). */
export const GCS_COMPONENT_EXPIRY_MINUTES = 24 * 60;
/** Janela de pareamento do RASS com a avaliação GCS (spec §4.1; A28-7). */
export const GCS_RASS_PAIRING_MINUTES = 60;
/** Contemporaneidade mútua dos três componentes (spec §5.3, OQ-GCS-5). */
export const GCS_COMPONENT_CONTEMPORANEITY_MINUTES = 30;
/** Limiar de sedação profunda (ADR-0028 A28-5: RASS ≤ −3, PADIS). */
export const GCS_SEDATION_RASS_THRESHOLD = -3;
/** Idade máxima da GCS pré-sedação exibível (ADR-0028 A28-6: 72 h). */
export const GCS_PRE_SEDATION_MAX_AGE_MINUTES = 72 * 60;

/** Enumerações publicadas por componente (spec §3.1) — nunca clampadas. */
const COMPONENT_RANGE: Readonly<
  Record<GcsComponentId, { readonly min: number; readonly max: number }>
> = {
  eye: { min: 1, max: 4 },
  verbal: { min: 1, max: 5 },
  motor: { min: 1, max: 6 },
};

/**
 * Vocabulário governado de motivos de NT admissíveis por componente
 * (spec §3.3). `neuromuscular_blockade` é admissível nos três componentes por
 * decisão OQ-GCS-4 (GDEC-0007): sob bloqueio neuromuscular nada além de
 * pupilas é testável.
 */
const ADMISSIBLE_NT_REASONS: Readonly<Record<GcsComponentId, readonly GcsNtReason[]>> = {
  eye: ["eye_trauma_or_edema", "neuromuscular_blockade", "other_documented"],
  verbal: [
    "endotracheal_intubation",
    "tracheostomy",
    "aphasia",
    "language_barrier",
    "deafness",
    "neuromuscular_blockade",
    "other_documented",
  ],
  motor: ["neuromuscular_blockade", "paralysis_other", "other_documented"],
};

/** Unidades UCUM aceitas para um escore adimensional (spec §5.1 nota). */
const DIMENSIONLESS_UNITS: readonly string[] = ["{score}", "1", ""];

const COMPONENT_LABEL_PT: Readonly<Record<GcsComponentId, string>> = {
  eye: "ocular (E)",
  verbal: "verbal (V)",
  motor: "motor (M)",
};

const COMPONENT_PREFIX: Readonly<Record<GcsComponentId, string>> = {
  eye: "E",
  verbal: "V",
  motor: "M",
};

/** Rótulos clínicos pt-BR das respostas publicadas (spec §3.1). */
const VALUE_LABEL_PT: Readonly<Record<GcsComponentId, Readonly<Record<number, string>>>> = {
  eye: {
    4: "abertura ocular espontânea",
    3: "abertura ocular ao som",
    2: "abertura ocular à pressão",
    1: "sem abertura ocular — testado, ausente",
  },
  verbal: {
    5: "orientado",
    4: "confuso",
    3: "palavras",
    2: "sons",
    1: "sem resposta verbal — testado, ausente",
  },
  motor: {
    6: "obedece comandos",
    5: "localiza",
    4: "flexão normal",
    3: "flexão anormal",
    2: "extensão",
    1: "sem resposta motora — testado, ausente",
  },
};

/** Rótulos pt-BR dos motivos governados de NT (spec §3.3). */
export const NT_REASON_LABEL_PT: Readonly<Record<GcsNtReason, string>> = {
  eye_trauma_or_edema: "trauma orbitário/periorbitário ou edema",
  endotracheal_intubation: "intubação endotraqueal",
  tracheostomy: "traqueostomia",
  aphasia: "afasia documentada",
  language_barrier: "barreira linguística documentada",
  deafness: "surdez documentada",
  neuromuscular_blockade: "bloqueio neuromuscular ativo",
  paralysis_other: "paralisia documentada de outra causa",
  other_documented: "outro impedimento documentado",
};

const ASSESSABILITY_LABEL_PT: Readonly<Record<GcsAssessabilityState, string>> = {
  testable: "testável — RASS pareado permite leitura do exame",
  sedation_confounded:
    "confundida por sedação — os componentes refletem efeito de droga, não o estado neurológico basal",
  sedation_state_unknown:
    "estado de sedação desconhecido — insumo de gate ausente (fail-closed, ADR-0028 A28-2)",
  not_applicable: "gate de sedação não aplicável — nenhum componente com valor observado",
};

/** Anotação obrigatória do carve-out paliativo (spec §1.3.1, HAZ-0044). */
export const GCS_CARE_GOALS_ANNOTATION_PT =
  "ordem de limitação terapêutica documentada — a avaliação NÃO é suprimida; qualquer vínculo futuro de alerta/work-item deve consultar as metas de cuidado (HAZ-0044)";

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

function parseIsoTime(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

interface ComponentPipelineResult {
  readonly status: ParameterStatus;
  /** Valor observado (exibível), inclusive sob `stale`; `null` nos demais. */
  readonly value: number | null;
  readonly ntReason: GcsNtReason | null;
  readonly reason: string | null;
  readonly effectiveTime: string | null;
  readonly effectiveTimeMs: number | null;
  readonly ageMinutes: number | null;
  readonly explanation: string;
}

/**
 * Representação canônica de uma observação de componente, usada para detectar
 * conflito no MESMO tempo clínico: um valor e um token NT simultâneos são
 * contraditórios tanto quanto dois valores diferentes.
 */
function canonicalRepresentation(observation: GcsComponentObservationInput): string {
  return observation.value.kind === "score"
    ? `score:${observation.value.value}`
    : `nt:${observation.value.ntReason}`;
}

/** Integridade de UMA observação de componente (INV-C; spec §3.1/§3.3/§5.1). */
function checkComponentIntegrity(
  component: GcsComponentId,
  observation: GcsComponentObservationInput,
): { readonly reason: string; readonly explanation: string } | null {
  const label = COMPONENT_LABEL_PT[component];

  if (observation.value.kind === "not_testable") {
    const admissible = ADMISSIBLE_NT_REASONS[component];
    if (!admissible.includes(observation.value.ntReason)) {
      return {
        reason: `unmappable_code:${component}`,
        explanation: `${label}: motivo de NT "${observation.value.ntReason}" fora do vocabulário governado deste componente (spec §3.3) — NT sem motivo admissível não é NT; é falha de integridade.`,
      };
    }
    return null;
  }

  const unit = observation.value.unit ?? "";
  if (!DIMENSIONLESS_UNITS.includes(unit)) {
    return {
      reason: `unmappable_unit:${component}`,
      explanation: `${label}: unidade "${unit}" inmapeável — a GCS é adimensional (UCUM "{score}"); insumo nunca é descartado silenciosamente.`,
    };
  }

  const { min, max } = COMPONENT_RANGE[component];
  const raw = observation.value.value;
  if (!Number.isInteger(raw) || raw < min || raw > max) {
    return {
      reason: `out_of_range:${component}`,
      explanation: `${label}: valor ${raw} fora da enumeração publicada ${min}–${max} — inválido; NUNCA clampado ao vizinho mais próximo nem descartado (spec §3.1, INV-C).`,
    };
  }
  return null;
}

/**
 * Pipeline de um componente, na ordem de precedência declarada:
 * ausência → quarentena → integridade (fail-alto sobre TODAS as observações
 * apresentadas) → tempo clínico → conflito no tempo mais recente →
 * expiração → NT → staleness → valid.
 */
function runComponentPipeline(
  component: GcsComponentId,
  observations: readonly GcsComponentObservationInput[],
  evaluationTimeMs: number,
): ComponentPipelineResult {
  const label = COMPONENT_LABEL_PT[component];
  const all = observations.filter((o) => o.component === component);

  if (all.length === 0) {
    return {
      status: "missing",
      value: null,
      ntReason: null,
      reason: `missing_required_input:${component}`,
      effectiveTime: null,
      effectiveTimeMs: null,
      ageMinutes: null,
      explanation: `${label}: AUSENTE — nenhuma observação registrada (nem valor, nem NT). Ausência NUNCA é tratada como normal (HAZ-0005) e NÃO é o mesmo que "não testável" (spec §3.4).`,
    };
  }

  const usable = all.filter((o) => o.provenance.sourceDataQuality !== "quarantined");
  if (usable.length === 0) {
    return {
      status: "quarantined",
      value: null,
      ntReason: null,
      reason: `quarantined_input:${component}`,
      effectiveTime: null,
      effectiveTimeMs: null,
      ageMinutes: null,
      explanation: `${label}: presente, porém com fonte em quarentena — insumo de fonte quarentenada jamais contribui (regra das duas dimensões, ADR-0008 N8).`,
    };
  }

  for (const observation of usable) {
    const integrity = checkComponentIntegrity(component, observation);
    if (integrity !== null) {
      return {
        status: "invalid",
        value: null,
        ntReason: null,
        reason: integrity.reason,
        effectiveTime: null,
        effectiveTimeMs: null,
        ageMinutes: null,
        explanation: integrity.explanation,
      };
    }
  }

  const timed = usable.map((o) => ({ observation: o, timeMs: parseIsoTime(o.effectiveTime) }));
  if (timed.some((t) => t.timeMs === null)) {
    return {
      status: "missing_clinical_time",
      value: null,
      ntReason: null,
      reason: `missing_clinical_time:${component}`,
      effectiveTime: null,
      effectiveTimeMs: null,
      ageMinutes: null,
      explanation: `${label}: sem tempo clínico utilizável — atualidade indemonstrável; nunca se assume "agora" (DOM-0009).`,
    };
  }

  const latestMs = Math.max(...timed.map((t) => t.timeMs as number));
  const latestGroup = timed.filter((t) => t.timeMs === latestMs).map((t) => t.observation);
  const first = latestGroup[0] as GcsComponentObservationInput;
  const ageMinutes = Math.max(0, (evaluationTimeMs - latestMs) / MINUTE_MS);
  const effectiveTime = first.effectiveTime as string;

  const distinct = [...new Set(latestGroup.map(canonicalRepresentation))].sort();
  if (distinct.length > 1) {
    return {
      status: "invalid",
      value: null,
      ntReason: null,
      reason: `conflicting_sources:${component}`,
      effectiveTime,
      effectiveTimeMs: latestMs,
      ageMinutes,
      explanation: `${label}: registros simultâneos contraditórios (${distinct.join(" vs ")}) sem resolução — conflito real, nunca resolvido às cegas (spec §5.1).`,
    };
  }

  if (ageMinutes > GCS_COMPONENT_EXPIRY_MINUTES + EPS) {
    return {
      status: "expired",
      value: null,
      ntReason: null,
      reason: `expired_input:${component}`,
      effectiveTime,
      effectiveTimeMs: latestMs,
      ageMinutes,
      explanation: `${label}: além do horizonte de expiração (${Math.round(ageMinutes)} min > ${GCS_COMPONENT_EXPIRY_MINUTES} min) — conclusão arbitrariamente velha não é conclusão degradada; é não-conclusão (spec §5.3).`,
    };
  }

  const chosen = first.value;
  if (chosen.kind === "not_testable") {
    return {
      status: "not_testable",
      value: null,
      ntReason: chosen.ntReason,
      reason: "component_not_testable",
      effectiveTime,
      effectiveTimeMs: latestMs,
      ageMinutes,
      explanation: `${label}: NÃO TESTÁVEL (NT) — ${NT_REASON_LABEL_PT[chosen.ntReason]}. NT é registro positivo: nunca 1, nunca 0, nunca mínimo, nunca ausência (spec §3.2/§3.4).`,
    };
  }

  const value = chosen.value;
  const valueLabel = VALUE_LABEL_PT[component][value] ?? "resposta registrada";
  if (ageMinutes > GCS_COMPONENT_WINDOW_MINUTES + EPS) {
    return {
      status: "stale",
      value,
      ntReason: null,
      reason: `stale_input:${component}`,
      effectiveTime,
      effectiveTimeMs: latestMs,
      ageMinutes,
      explanation: `${label}: ${value} (${valueLabel}) aferido há ${Math.round(ageMinutes)} min — fora da janela de ${GCS_COMPONENT_WINDOW_MINUTES} min; valor e idade exibidos, nenhum total legível (spec §5.3).`,
    };
  }

  return {
    status: "valid",
    value,
    ntReason: null,
    reason: null,
    effectiveTime,
    effectiveTimeMs: latestMs,
    ageMinutes,
    explanation: `${label}: ${value} — ${valueLabel} (aferido em ${effectiveTime}).`,
  };
}

interface SedationGateResult {
  readonly state: GcsAssessabilityState;
  readonly pairedRass: number | null;
  /** Razão agregada do gate (`sedation_confounded` / `sedation_state_unknown`). */
  readonly reason: string | null;
  /** Falha de integridade do próprio insumo de gate (RASS fora do domínio). */
  readonly invalidReason: string | null;
  readonly explanation: string;
}

/**
 * Gate de avaliabilidade — spec §4, ADR-0028 (A28-1 conjunção-com-exposição,
 * A28-2 FAIL-CLOSED, A28-5 limiar RASS ≤ −3). Nenhum ramo desta função pode
 * produzir "escora com divulgação": o default 0.1.0 foi REMOVIDO.
 */
function evaluateSedationGate(
  rass: RassObservationInput | null | undefined,
  sedativeExposure: SedativeExposureState,
  componentTimesMs: readonly number[],
  hasObservedValue: boolean,
): SedationGateResult {
  if (!hasObservedValue) {
    return {
      state: "not_applicable",
      pairedRass: null,
      reason: null,
      invalidReason: null,
      explanation:
        "gate de sedação não aplicável — nenhum componente com valor observado a interpretar.",
    };
  }

  let invalidReason: string | null = null;
  let pairedRass: number | null = null;
  let pairingNote = "";

  if (rass === null || rass === undefined) {
    pairingNote = "RASS ausente";
  } else if (rass.provenance.sourceDataQuality === "quarantined") {
    pairingNote = "RASS presente, porém com fonte em quarentena";
  } else if (!Number.isInteger(rass.value) || rass.value < -5 || rass.value > 4) {
    invalidReason = "out_of_range:rass";
    pairingNote = `RASS ${rass.value} fora do domínio −5..+4 — inválido, nunca clampado (spec §4.1)`;
  } else {
    const rassMs = parseIsoTime(rass.effectiveTime);
    if (rassMs === null) {
      pairingNote = "RASS sem tempo clínico utilizável";
    } else if (componentTimesMs.length === 0) {
      pairingNote = "nenhum componente com tempo clínico utilizável para parear o RASS";
    } else {
      const worstLagMinutes = Math.max(
        ...componentTimesMs.map((t) => Math.abs(rassMs - t) / MINUTE_MS),
      );
      if (worstLagMinutes > GCS_RASS_PAIRING_MINUTES + EPS) {
        pairingNote = `RASS defasado ${Math.round(worstLagMinutes)} min da avaliação GCS (janela de pareamento: ${GCS_RASS_PAIRING_MINUTES} min)`;
      } else {
        pairedRass = rass.value;
      }
    }
  }

  // §4.2 condição 2: infusão sedativa contínua ativa SEM janela de interrupção
  // documentada confunde independentemente do RASS.
  if (sedativeExposure === "active_infusion") {
    return {
      state: "sedation_confounded",
      pairedRass,
      reason: "sedation_confounded",
      invalidReason,
      explanation:
        "infusão sedativa ativa sem janela de interrupção documentada — a avaliação reflete efeito de droga; nenhum total é emitido (spec §4.2).",
    };
  }

  if (pairedRass === null) {
    return {
      state: "sedation_state_unknown",
      pairedRass: null,
      reason: "sedation_state_unknown",
      invalidReason,
      explanation: `estado de sedação desconhecido (${pairingNote}) — insumo de gate ausente; FAIL-CLOSED por decisão conjunta GDEC-0007 OQ-GCS-2 / ADR-0028 A28-2 (o default "escora com divulgação" foi removido).`,
    };
  }

  if (pairedRass > GCS_SEDATION_RASS_THRESHOLD) {
    return {
      state: "testable",
      pairedRass,
      reason: null,
      invalidReason,
      explanation: `RASS pareado ${pairedRass} (≥ ${GCS_SEDATION_RASS_THRESHOLD + 1}) — avaliação testável (spec §4.4).`,
    };
  }

  if (sedativeExposure === "none_active") {
    return {
      state: "testable",
      pairedRass,
      reason: null,
      invalidReason,
      explanation: `RASS pareado ${pairedRass} com AUSÊNCIA DOCUMENTADA de exposição sedativa — coma genuíno, escorável (spec §4.3; ADR-0028 A28-1).`,
    };
  }

  return {
    state: "sedation_confounded",
    pairedRass,
    reason: "sedation_confounded",
    invalidReason,
    explanation: `RASS pareado ${pairedRass} (≤ ${GCS_SEDATION_RASS_THRESHOLD}) com exposição sedativa ${sedativeExposure === "unknown" ? "DESCONHECIDA" : "documentada (janela de interrupção registrada)"} — indistinguível de sedação profunda; confundida (spec §4.2/§4.4).`,
  };
}

// ---------------------------------------------------------------------------
// Avaliador principal
// ---------------------------------------------------------------------------

/**
 * Avalia a GCS de forma determinística e pura. Nunca lança para entradas do
 * tipo declarado: toda condição resolve para um status explícito com razão
 * (ADR-0008 N9 — não existe caminho "desconhecido → presumir bem").
 */
export function evaluateGcs(input: GcsEvaluationInput): GcsEvaluationRecord {
  const evaluationTimeMs = parseIsoTime(input.evaluationTime);
  if (evaluationTimeMs === null) {
    return buildGateShortCircuitRecord(
      input,
      ["unspecified_condition"],
      { passed: false, reason: null },
      "instante de avaliação inválido ou ausente",
      "insufficient_data",
    );
  }

  // ---- Gate populacional PRIMEIRO (ADR-0027 Opção A: choke point aplicado
  // antes de qualquer lógica de regra).
  const ageGate = evaluateAgeGate(input.age);
  if (!ageGate.passed) {
    const reason =
      ageGate.reason === "unknown_age" ? "population_unverified" : "out_of_population_scope";
    const detail =
      ageGate.reason === "unknown_age"
        ? "idade desconhecida — nunca se presume adulto (spec §1.2, HAZ-0036)"
        : `idade verificada abaixo do limiar de 18 anos — fora da população V2 (ADR-0027 A27-1); uma GCS pediátrica é instrumento separadamente evidenciado`;
    return buildGateShortCircuitRecord(
      input,
      [reason],
      { passed: false, reason: ageGate.reason },
      detail,
      "out_of_population_scope",
    );
  }

  // ---- Pipeline por componente, na ordem canônica.
  const pipeline = new Map<GcsComponentId, ComponentPipelineResult>();
  for (const component of GCS_COMPONENT_ORDER) {
    pipeline.set(component, runComponentPipeline(component, input.components, evaluationTimeMs));
  }
  const results = GCS_COMPONENT_ORDER.map(
    (component) => pipeline.get(component) as ComponentPipelineResult,
  );

  // ---- Contemporaneidade mútua dos componentes presentes (spec §5.3).
  const componentTimesMs = results
    .map((r) => r.effectiveTimeMs)
    .filter((t): t is number => t !== null);
  const spreadMinutes =
    componentTimesMs.length > 1
      ? (Math.max(...componentTimesMs) - Math.min(...componentTimesMs)) / MINUTE_MS
      : 0;
  const notContemporaneous = spreadMinutes > GCS_COMPONENT_CONTEMPORANEITY_MINUTES + EPS;

  // ---- Gate de avaliabilidade (sedação).
  const hasObservedValue = results.some((r) => r.value !== null);
  const gate = evaluateSedationGate(
    input.rass ?? null,
    input.sedativeExposure,
    componentTimesMs,
    hasObservedValue,
  );

  // ---- Cross-check do total fornecido pela fonte (spec §5.2 — NUNCA insumo
  // de computação; só verificação).
  const allValid = results.every((r) => r.status === "valid");
  const allMissing = results.every((r) => r.status === "missing");
  const sourceTotal = input.sourceProvidedTotal ?? null;
  let sourceTotalInvalidReason: string | null = null;
  let sourceTotalNote: string | null = null;
  if (sourceTotal !== null) {
    if (!Number.isInteger(sourceTotal.value) || sourceTotal.value < 3 || sourceTotal.value > 15) {
      sourceTotalInvalidReason = "out_of_range:source_total";
    } else if (allValid) {
      const sum = results.reduce((acc, r) => acc + (r.value as number), 0);
      if (sum !== sourceTotal.value) {
        sourceTotalInvalidReason = "component_total_mismatch";
      } else {
        sourceTotalNote = `total da fonte (${sourceTotal.value}) confere com a soma dos componentes testados`;
      }
    } else if (allMissing) {
      sourceTotalNote =
        "total fornecido pela fonte SEM componentes — não aceito para computação (spec §5.2, OQ-GCS-6): um total nu não permite verificar NT nem auditar a soma";
    }
  }

  // ---- Razões agregadas, na precedência declarada.
  const invalidReasons: string[] = [];
  for (const result of results) {
    if (result.status === "invalid" && result.reason !== null) invalidReasons.push(result.reason);
  }
  if (gate.invalidReason !== null) invalidReasons.push(gate.invalidReason);
  if (sourceTotalInvalidReason !== null) invalidReasons.push(sourceTotalInvalidReason);

  const notEvaluatedReasons: string[] = [];
  if (results.some((r) => r.status === "not_testable")) {
    notEvaluatedReasons.push("component_not_testable");
  }
  if (allMissing && sourceTotal !== null) {
    // spec §5.2: total da fonte sem componentes.
    notEvaluatedReasons.push("missing_required_input:components");
  } else {
    for (const result of results) {
      if (result.status === "missing" && result.reason !== null) {
        notEvaluatedReasons.push(result.reason);
      }
    }
  }
  for (const result of results) {
    if (result.status === "missing_clinical_time" && result.reason !== null) {
      notEvaluatedReasons.push(result.reason);
    }
  }
  for (const result of results) {
    if (result.status === "quarantined" && result.reason !== null) {
      notEvaluatedReasons.push(result.reason);
    }
  }
  for (const result of results) {
    if (result.status === "expired" && result.reason !== null) {
      notEvaluatedReasons.push(result.reason);
    }
  }
  if (notContemporaneous) notEvaluatedReasons.push("component_set_not_contemporaneous");
  if (gate.reason !== null) notEvaluatedReasons.push(gate.reason);

  const staleReasons: string[] = results
    .filter((r) => r.status === "stale" && r.reason !== null)
    .map((r) => r.reason as string);

  let status: EvaluationStatus;
  if (invalidReasons.length > 0) {
    status = "invalid";
  } else if (notEvaluatedReasons.length > 0) {
    status = "not_evaluated";
  } else if (staleReasons.length > 0) {
    status = "stale";
  } else {
    status = "valid";
  }

  const reasons = [...invalidReasons, ...notEvaluatedReasons, ...staleReasons];
  const primaryReason = reasons[0] ?? null;

  // ---- Total SOMENTE sob `valid` (spec §3.5; HAZ-0005).
  const total =
    status === "valid" ? results.reduce((acc, r) => acc + (r.value as number), 0) : null;

  const contributions: GcsComponentContribution[] = GCS_COMPONENT_ORDER.map((component, index) => {
    const result = results[index] as ComponentPipelineResult;
    return {
      component,
      status: result.status,
      value: result.value,
      ntReason: result.ntReason,
      reason: result.reason,
      effectiveTime: result.effectiveTime,
      ageMinutes: result.ageMinutes,
      explanation: result.explanation,
    };
  });

  const noFireReason: GcsNoFireReason =
    status === "valid"
      ? "criteria_not_met"
      : status === "invalid"
        ? "invalid_data"
        : status === "stale"
          ? "stale_data"
          : "insufficient_data";

  const annotations: string[] = [`estado de avaliabilidade: ${ASSESSABILITY_LABEL_PT[gate.state]}`];
  if (sourceTotalNote !== null) annotations.push(sourceTotalNote);
  if (sourceTotalInvalidReason === "component_total_mismatch") {
    annotations.push(
      "divergência entre a soma dos componentes e o total fornecido pela fonte — nenhum dos dois é exibido como escore (spec §5.2)",
    );
  }
  annotations.push(...buildPreSedationAnnotations(input, evaluationTimeMs, gate.state));
  if (input.treatmentLimitationOrderDocumented === true) {
    annotations.push(GCS_CARE_GOALS_ANNOTATION_PT);
  }
  if (notContemporaneous) {
    annotations.push(
      `componentes observados em momentos distintos (dispersão de ${Math.round(spreadMinutes)} min > ${GCS_COMPONENT_CONTEMPORANEITY_MINUTES} min) — componentes de exames diferentes não somam (spec §5.3)`,
    );
  }

  return {
    ruleId: GCS_RULE_ID,
    ruleVersion: GCS_RULE_VERSION,
    evaluationTime: input.evaluationTime,
    status,
    reasons,
    primaryReason,
    total,
    components: contributions,
    assessability: gate.state,
    pairedRass: gate.pairedRass,
    populationGate: { passed: true, reason: null },
    notTestableComponents: componentsWith(contributions, "not_testable"),
    missingComponents: componentsWith(contributions, "missing"),
    staleComponents: componentsWith(contributions, "stale"),
    expiredComponents: componentsWith(contributions, "expired"),
    invalidComponents: componentsWith(contributions, "invalid"),
    quarantinedComponents: componentsWith(contributions, "quarantined"),
    componentDisplay: buildComponentDisplay(contributions),
    fires: false,
    noFireReason,
    annotations,
    explanation: buildExplanationPt(
      status,
      total,
      contributions,
      reasons,
      gate,
      input.lastValidEvaluationTime ?? null,
    ),
  };
}

function componentsWith(
  contributions: readonly GcsComponentContribution[],
  status: ParameterStatus,
): GcsComponentId[] {
  return contributions.filter((c) => c.status === status).map((c) => c.component);
}

/**
 * Convenção de exibição ratificada (OQ-GCS-7; ADR-0028 A28-8):
 * "E4 V-NT(intubação endotraqueal) M6" — APRESENTAÇÃO, nunca aritmética.
 */
function buildComponentDisplay(contributions: readonly GcsComponentContribution[]): string {
  return contributions
    .map((c) => {
      const prefix = COMPONENT_PREFIX[c.component];
      switch (c.status) {
        case "valid":
          return `${prefix}${c.value}`;
        case "stale":
          return `${prefix}${c.value}(fora da janela)`;
        case "not_testable":
          return `${prefix}-NT(${c.ntReason === null ? "motivo não informado" : NT_REASON_LABEL_PT[c.ntReason]})`;
        case "missing":
          return `${prefix}-ausente`;
        case "missing_clinical_time":
          return `${prefix}-sem tempo clínico`;
        case "expired":
          return `${prefix}-expirado`;
        case "quarantined":
          return `${prefix}-quarentena`;
        case "invalid":
          return `${prefix}-inválido`;
        default:
          return `${prefix}-não avaliado`;
      }
    })
    .join(" ");
}

/** GCS pré-sedação: EXIBIÇÃO APENAS, idade máxima 72 h (ADR-0028 A28-6). */
function buildPreSedationAnnotations(
  input: GcsEvaluationInput,
  evaluationTimeMs: number,
  state: GcsAssessabilityState,
): string[] {
  const reference = input.lastPreSedationGcs ?? null;
  if (reference === null || state !== "sedation_confounded") return [];
  const observedMs = parseIsoTime(reference.observedAt);
  if (observedMs === null) {
    return [
      "última GCS pré-sedação registrada sem tempo clínico utilizável — não exibida como referência (ADR-0028 A28-6)",
    ];
  }
  const ageMinutes = Math.max(0, (evaluationTimeMs - observedMs) / MINUTE_MS);
  if (ageMinutes > GCS_PRE_SEDATION_MAX_AGE_MINUTES + EPS) {
    return [
      `última GCS pré-sedação excede 72 h (${reference.observedAt}) — não exibida como referência (ADR-0028 A28-6)`,
    ];
  }
  return [
    `última GCS pré-sedação: ${reference.total} em ${reference.observedAt} — EXIBIÇÃO APENAS, jamais somada nem usada em cômputo (ADR-0028 A28-6)`,
  ];
}

function buildExplanationPt(
  status: EvaluationStatus,
  total: number | null,
  contributions: readonly GcsComponentContribution[],
  reasons: readonly string[],
  gate: SedationGateResult,
  lastValidEvaluationTime: string | null,
): string {
  const display = buildComponentDisplay(contributions);
  const detail = contributions.map((c) => c.explanation).join(" ");
  const advisory =
    "Informação de apoio à decisão da equipe assistente — não é uma diretriz e não determina conduta.";
  const rule = `Regra ${GCS_RULE_ID} v${GCS_RULE_VERSION}.`;

  if (status === "valid" && total !== null) {
    return (
      `Escala de Coma de Glasgow ${total} de 15 (${display}) — ${rule} ` +
      `Os três componentes foram testados. ${gate.explanation} ${detail} ` +
      `A GCS descreve o nível de consciência observado; nenhuma banda de severidade é emitida. ${advisory}`
    );
  }

  const motivos = reasons.length > 0 ? reasons.join(", ") : "condição não especificada";

  if (status === "invalid") {
    return (
      `Escala de Coma de Glasgow: **inválida** — falha de integridade de dado detectada (${motivos}). ` +
      `Componentes: ${display}. Nenhum total é exibido; o valor ofensor não é descartado nem corrigido às cegas. ` +
      `${detail} Última avaliação válida: ${lastValidEvaluationTime ?? "nenhuma"}. ${rule} ${advisory}`
    );
  }

  if (status === "stale") {
    return (
      `Escala de Coma de Glasgow: **desatualizada** (${motivos}). Componentes: ${display} — valores e idades exibidos, ` +
      `nenhum total legível. ${detail} Última avaliação válida: ${lastValidEvaluationTime ?? "nenhuma"}. ${rule} ${advisory}`
    );
  }

  if (reasons.includes("component_not_testable")) {
    return (
      `Escala de Coma de Glasgow: **total não calculado** — componente não testável (${motivos}). ` +
      `Componentes: ${display}. Nenhum total é exibido porque um total calculado com componente não testável seria ` +
      `artificialmente baixo e poderia confundir a equipe (orientação glasgowcomascale.org). Avalie e comunique pelos ` +
      `componentes testados. ${detail} ${rule} ${advisory}`
    );
  }

  if (reasons.includes("sedation_confounded")) {
    return (
      `Escala de Coma de Glasgow: **não avaliada — confundida por sedação** (${motivos}). ` +
      `Componentes observados sob sedação: ${display} — refletem efeito de droga, não o estado neurológico basal. ` +
      `${gate.explanation} ${detail} ${rule} ${advisory}`
    );
  }

  return (
    `Escala de Coma de Glasgow: **não avaliada** — ${motivos}. Componentes: ${display}. ` +
    `Não existe pontuação para este paciente neste momento; a ausência de pontuação NÃO significa normalidade. ` +
    `${detail} Última avaliação válida: ${lastValidEvaluationTime ?? "nenhuma"}. ${rule} ${advisory}`
  );
}

/**
 * Registro construído no curto-circuito do gate populacional (ou de instante
 * de avaliação inutilizável): nenhuma lógica de regra executou.
 */
function buildGateShortCircuitRecord(
  input: GcsEvaluationInput,
  reasons: readonly string[],
  populationGate: PopulationGateResult,
  detailPt: string,
  noFireReason: GcsNoFireReason,
): GcsEvaluationRecord {
  const contributions: GcsComponentContribution[] = GCS_COMPONENT_ORDER.map((component) => ({
    component,
    status: "not_evaluated" as ParameterStatus,
    value: null,
    ntReason: null,
    reason: null,
    effectiveTime: null,
    ageMinutes: null,
    explanation: `${COMPONENT_LABEL_PT[component]}: não avaliado — ${detailPt}; nenhuma lógica de regra executou (gate pré-avaliação, ADR-0027 Opção A).`,
  }));
  const annotations: string[] = [];
  if (input.treatmentLimitationOrderDocumented === true) {
    annotations.push(GCS_CARE_GOALS_ANNOTATION_PT);
  }
  return {
    ruleId: GCS_RULE_ID,
    ruleVersion: GCS_RULE_VERSION,
    evaluationTime: input.evaluationTime,
    status: "not_evaluated",
    reasons,
    primaryReason: reasons[0] ?? null,
    total: null,
    components: contributions,
    assessability: "not_applicable",
    pairedRass: null,
    populationGate,
    notTestableComponents: [],
    missingComponents: [],
    staleComponents: [],
    expiredComponents: [],
    invalidComponents: [],
    quarantinedComponents: [],
    componentDisplay: "E-não avaliado V-não avaliado M-não avaliado",
    fires: false,
    noFireReason,
    annotations,
    explanation:
      `Escala de Coma de Glasgow: **não avaliada** — ${detailPt}. Não existe pontuação para este paciente ` +
      `neste momento; a ausência de pontuação NÃO significa normalidade. Última avaliação válida: ` +
      `${input.lastValidEvaluationTime ?? "nenhuma"}. Regra ${GCS_RULE_ID} v${GCS_RULE_VERSION}. ` +
      `Informação de apoio à decisão da equipe assistente — não é uma diretriz e não determina conduta.`,
  };
}

/**
 * Reavaliação de status em TEMPO DE LEITURA (spec §5.3; ADR-0008 N5): um
 * registro `valid` envelhece — quando qualquer componente sai da janela de
 * 12 h no instante de leitura, o status exibido é `stale`; além de 24 h,
 * `not_evaluated` com razão `expired_input:<componente>`. Status é recomputado
 * na leitura, nunca congelado na escrita. Função pura: o instante de leitura é
 * parâmetro.
 */
export function reassessGcsAtReadTime(
  record: GcsEvaluationRecord,
  readTime: string,
): ReadTimeReassessment {
  if (record.status !== "valid") {
    return { status: record.status, reasons: [...record.reasons], oldestInputAgeMinutes: null };
  }
  const readMs = parseIsoTime(readTime);
  if (readMs === null) {
    return {
      status: "not_evaluated",
      reasons: ["unspecified_condition"],
      oldestInputAgeMinutes: null,
    };
  }
  const expiredReasons: string[] = [];
  const staleReasons: string[] = [];
  let oldestAge: number | null = null;
  for (const contribution of record.components) {
    const effMs = parseIsoTime(contribution.effectiveTime);
    if (effMs === null) continue;
    const ageMinutes = Math.max(0, (readMs - effMs) / MINUTE_MS);
    if (oldestAge === null || ageMinutes > oldestAge) oldestAge = ageMinutes;
    if (ageMinutes > GCS_COMPONENT_EXPIRY_MINUTES + EPS) {
      expiredReasons.push(`expired_input:${contribution.component}`);
    } else if (ageMinutes > GCS_COMPONENT_WINDOW_MINUTES + EPS) {
      staleReasons.push(`stale_input:${contribution.component}`);
    }
  }
  if (expiredReasons.length > 0) {
    return { status: "not_evaluated", reasons: expiredReasons, oldestInputAgeMinutes: oldestAge };
  }
  if (staleReasons.length > 0) {
    return { status: "stale", reasons: staleReasons, oldestInputAgeMinutes: oldestAge };
  }
  return { status: "valid", reasons: [], oldestInputAgeMinutes: oldestAge };
}
