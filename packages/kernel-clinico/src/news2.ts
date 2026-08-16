/**
 * Avaliador NEWS2 determinístico — RULE-NEWS2 0.2.0 (precursor, não assinado).
 *
 * Implementa a spec docs/05-clinical-safety/rule-releases/news2/specification.md:
 * - Bandas RCP 2017 Chart 1 (spec §4.1) e tiers Chart 2 (spec §4.2, consultivos);
 * - Governança da Escala 2 de SpO2 (spec §3): SOMENTE ordem clínica documentada
 *   seleciona a Escala 2 — nunca O2 suplementar, diagnóstico ou dispositivo;
 * - Gate populacional fail-closed (ADR-0027 A27-1: >=18 produto-wide; idade
 *   desconhecida NUNCA presume adulto);
 * - Política de insumo ausente classe 1 (ADR-0026): qualquer parâmetro
 *   obrigatório ausente/fora de janela ⇒ total `not_evaluated` com razão por
 *   parâmetro; INV-B preservado via flag de parâmetro vermelho isolado;
 * - Proibição total de coerção a zero (HAZ-0005; spec §5.4);
 * - Arredondamento de chart com empate para a banda MAIS ANORMAL (N-7);
 * - Duplicatas conflitantes com tolerância de dispositivo (N-10);
 * - Precedência de status P-a: invalid > not_evaluated > stale > partial > valid.
 *
 * Determinismo: nenhuma leitura de relógio, nenhuma aleatoriedade, nenhuma
 * chamada externa — todo tempo entra por parâmetro; mesma entrada ⇒ mesmo
 * registro, byte a byte.
 *
 * PREMISSA (reversível, GDEC-0015/0017): sem conversão de unidade nesta fatia — unidade fora da UCUM normativa ⇒ invalid (unmappable_unit), fail-closed.
 * PREMISSA (reversível, GDEC-0015/0017): entre observações seriadas vale o tempo clínico mais recente; "mesmo tempo clínico" = effectiveTime idêntico.
 * PREMISSA (reversível, GDEC-0015/0017): integridade checada em TODAS as observações apresentadas do parâmetro (falha-alto), não só na mais recente.
 * PREMISSA (reversível, GDEC-0015/0017): desempate do pior valor dentro da tolerância por (pontuação desc, valor asc); empate de banda é clinicamente equivalente.
 * PREMISSA (reversível, GDEC-0015/0017): tempo clínico futuro ⇒ idade tratada como 0 (dentro da janela); caso não definido na spec — a arbitrar.
 * PREMISSA (reversível, GDEC-0015/0017): ACVPU aceito só em maiúscula exata; outra grafia ⇒ invalid (unmappable_code), fail-closed.
 * PREMISSA (reversível, GDEC-0015/0017): meio-passo exato com bandas de pontuação igual arredonda para o limite superior (determinístico, mesma pontuação).
 * PREMISSA (reversível, GDEC-0015/0017): estado de sedação ausente não gateia — é anotado "não informado"; gate por RASS é matéria da ADR-0028, fora desta fatia.
 */

import {
  type AcvpuToken,
  type AgeInput,
  type ConflictResolutionRecord,
  type EvaluationRecord,
  type EvaluationStatus,
  type News2EvaluationInput,
  type News2ParameterId,
  NEWS2_PARAMETER_ORDER,
  type O2StatusCode,
  type ObservationInput,
  type ObservationValue,
  type ParameterContribution,
  type ParameterStatus,
  type PopulationGateResult,
  type ReadTimeReassessment,
  type RiskTier,
  type Spo2Scale,
} from "./types.js";

export const NEWS2_RULE_ID = "RULE-NEWS2" as const;
/** Versão pinada da spec 0.2.0 (ADR-0025: edição canônica RCP 2017). */
export const NEWS2_RULE_VERSION = "0.2.0" as const;

/** Limiar etário produto-wide (ADR-0027, decisão A27-1). */
export const MINIMUM_AGE_YEARS = 18;

const EPS = 1e-9;
const MINUTE_MS = 60_000;

/** Janelas de atualidade e horizontes de expiração, em minutos (spec §2.1/§2.2, N-5). */
const FRESHNESS_MINUTES: Readonly<
  Record<News2ParameterId, { readonly windowMinutes: number; readonly expiryMinutes: number }>
> = {
  rr: { windowMinutes: 60, expiryMinutes: 480 },
  spo2: { windowMinutes: 60, expiryMinutes: 480 },
  o2_status: { windowMinutes: 240, expiryMinutes: 1440 },
  sbp: { windowMinutes: 60, expiryMinutes: 480 },
  pulse: { windowMinutes: 60, expiryMinutes: 480 },
  consciousness: { windowMinutes: 240, expiryMinutes: 1440 },
  temperature: { windowMinutes: 240, expiryMinutes: 1440 },
};

/** Faixas plausíveis — fora ⇒ `invalid` (spec §2.1; ratificadas N-9 como v0.1). */
const PLAUSIBLE_RANGE: Readonly<
  Partial<Record<News2ParameterId, { readonly min: number; readonly max: number }>>
> = {
  rr: { min: 0, max: 80 },
  spo2: { min: 40, max: 100 },
  sbp: { min: 30, max: 300 },
  pulse: { min: 10, max: 300 },
  temperature: { min: 25, max: 45 },
};

/** Unidade UCUM normativa por parâmetro numérico (spec §2.1). */
const EXPECTED_UCUM_UNIT: Readonly<Partial<Record<News2ParameterId, string>>> = {
  rr: "/min",
  spo2: "%",
  sbp: "mm[Hg]",
  pulse: "/min",
  temperature: "Cel",
};

/** Tolerâncias de dispositivo para duplicatas conflitantes (spec §2.3, N-10). */
const CONFLICT_TOLERANCE: Readonly<Partial<Record<News2ParameterId, number>>> = {
  pulse: 5,
  sbp: 10,
  rr: 3,
  spo2: 3,
  temperature: 0.3,
};

/** Resolução de chart por parâmetro numérico (N-7): inteiro, exceto T em 0,1 °C. */
const CHART_RESOLUTION: Readonly<Partial<Record<News2ParameterId, number>>> = {
  rr: 1,
  spo2: 1,
  sbp: 1,
  pulse: 1,
  temperature: 0.1,
};

const ACVPU_TOKENS: readonly string[] = ["A", "C", "V", "P", "U"];

/** Rótulos pt-BR por parâmetro, para explicações. */
const PARAMETER_LABEL_PT: Readonly<Record<News2ParameterId, string>> = {
  rr: "frequência respiratória (FR)",
  spo2: "saturação de oxigênio (SpO2)",
  o2_status: "suplementação de oxigênio (ar/oxigênio)",
  sbp: "pressão arterial sistólica (PAS)",
  pulse: "frequência cardíaca (FC)",
  consciousness: "nível de consciência (ACVPU)",
  temperature: "temperatura (T)",
};

const TIER_LABEL_PT: Readonly<Record<RiskTier, string>> = {
  low: "risco baixo",
  low_medium: "risco baixo-médio (parâmetro vermelho isolado)",
  medium: "risco médio",
  high: "risco alto",
};

/** Anotação obrigatória N-3 (GDEC-0007). */
export const ESCALATION_SUPPRESSION_REASON_PT =
  "escalonamento suprimido — ordem de limitação terapêutica documentada";

/** Anotação obrigatória N-2 (GDEC-0007). */
export const PREGNANCY_NOT_VERIFIED_ANNOTATION_PT = "gravidez não verificada";

// ---------------------------------------------------------------------------
// Bandas (spec §4.1 / §6) — funções totais sobre valores em unidades de chart.
// Temperatura opera em deci-graus Celsius inteiros (0,1 °C de resolução).
// ---------------------------------------------------------------------------

function scoreRr(v: number): number {
  if (v <= 8) return 3;
  if (v <= 11) return 1;
  if (v <= 20) return 0;
  if (v <= 24) return 2;
  return 3;
}

function scoreSpo2Scale1(v: number): number {
  if (v <= 91) return 3;
  if (v <= 93) return 2;
  if (v <= 95) return 1;
  return 0;
}

/**
 * Escala 2 (spec §3.3): bandas baixas (<=92) valem INDEPENDENTEMENTE do estado
 * de O2 (o defeito legado D-1 destruía exatamente isso); a região >=93 exige o
 * estado ar/oxigênio para pontuar — retorna null quando indeterminável.
 */
function scoreSpo2Scale2(v: number, o2: O2StatusCode | null): number | null {
  if (v <= 83) return 3;
  if (v <= 85) return 2;
  if (v <= 87) return 1;
  if (v <= 92) return 0;
  if (o2 === null) return null;
  if (o2 === "air") return 0;
  if (v <= 94) return 1;
  if (v <= 96) return 2;
  return 3;
}

function scoreSbp(v: number): number {
  if (v <= 90) return 3;
  if (v <= 100) return 2;
  if (v <= 110) return 1;
  if (v <= 219) return 0;
  return 3;
}

function scorePulse(v: number): number {
  if (v <= 40) return 3;
  if (v <= 50) return 1;
  if (v <= 90) return 0;
  if (v <= 110) return 1;
  if (v <= 130) return 2;
  return 3;
}

function scoreConsciousness(token: AcvpuToken): number {
  return token === "A" ? 0 : 3;
}

/** Temperatura em deci-graus (350 = 35,0 °C). */
function scoreTemperatureDeci(v: number): number {
  if (v <= 350) return 3;
  if (v <= 360) return 1;
  if (v <= 380) return 0;
  if (v <= 390) return 1;
  return 2;
}

function scoreO2(code: O2StatusCode): number {
  return code === "oxygen" ? 2 : 0;
}

/**
 * Arredondamento à resolução de chart (N-7, GDEC-0007): valor mais fino é
 * arredondado à resolução; no MEIO-PASSO EXATO, arredonda-se para a banda MAIS
 * ANORMAL (maior pontuação) — empate resolve para vigilância, nunca para
 * tranquilidade (INV-B). Retorna o valor em unidades inteiras de chart.
 */
export function roundToChartUnits(
  value: number,
  resolution: number,
  scoreOfChartUnit: (chartUnit: number) => number,
): number {
  const scaled = value / resolution;
  const nearest = Math.round(scaled);
  if (Math.abs(scaled - nearest) < EPS) return nearest;
  const lower = Math.floor(scaled);
  const upper = lower + 1;
  const frac = scaled - lower;
  if (Math.abs(frac - 0.5) < EPS) {
    // Meio-passo exato: banda mais anormal vence; empate de pontuação → limite
    // superior (determinístico; mesma banda de pontuação nos dois candidatos).
    return scoreOfChartUnit(upper) >= scoreOfChartUnit(lower) ? upper : lower;
  }
  return frac < 0.5 ? lower : upper;
}

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

function parseIsoTime(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

interface ResolvedNumericValue {
  readonly rawValue: number;
  readonly effectiveTimeMs: number;
  readonly effectiveTime: string;
  readonly conflictResolution: ConflictResolutionRecord | null;
}

type ParameterFailure = {
  readonly status: ParameterStatus;
  readonly reason: string;
  readonly explanation: string;
};

interface ParameterPipelineResult {
  readonly failure: ParameterFailure | null;
  readonly resolved: ResolvedNumericValue | null;
  readonly codeToken: string | null;
  readonly observationUsed: ObservationInput | null;
  readonly ageMinutes: number | null;
}

function failure(status: ParameterStatus, reason: string, explanation: string): ParameterFailure {
  return { status, reason, explanation };
}

/**
 * Pipeline por parâmetro (spec §2 e §5.2), na ordem de precedência P-a:
 * quarentena → integridade (unidade/código/plausibilidade) → conflito →
 * tempo clínico → atualidade. Qualquer insumo ofensor falha ALTO — jamais é
 * descartado para "salvar" a avaliação (evaluation-status-semantics §3.5).
 */
function runParameterPipeline(
  parameter: News2ParameterId,
  observations: readonly ObservationInput[],
  evaluationTimeMs: number,
  worstMetric?: (rawValue: number) => number,
): ParameterPipelineResult {
  const label = PARAMETER_LABEL_PT[parameter];
  const all = observations.filter((o) => o.parameter === parameter);

  if (all.length === 0) {
    return {
      failure: failure(
        "missing",
        `missing_required_input:${parameter}`,
        `${label} ausente — nenhum valor foi aferido; ausência NUNCA é tratada como normal (HAZ-0005).`,
      ),
      resolved: null,
      codeToken: null,
      observationUsed: null,
      ageMinutes: null,
    };
  }

  // Fonte em quarentena nunca contribui (spec §5.2; regra das duas dimensões).
  const usable = all.filter((o) => o.provenance.sourceDataQuality !== "quarantined");
  if (usable.length === 0) {
    return {
      failure: failure(
        "quarantined",
        `quarantined_input:${parameter}`,
        `${label} presente, porém com fonte em quarentena — insumo de fonte quarentenada jamais contribui.`,
      ),
      resolved: null,
      codeToken: null,
      observationUsed: null,
      ageMinutes: null,
    };
  }

  // Integridade: falha-alto sobre QUALQUER observação apresentada do parâmetro.
  for (const obs of usable) {
    const integrity = checkIntegrity(parameter, obs);
    if (integrity !== null) {
      return { failure: integrity, resolved: null, codeToken: null, observationUsed: null, ageMinutes: null };
    }
  }

  // Tempo clínico utilizável é pré-condição de atualidade (DOM-0009; ADR-0008 N5).
  const timed = usable.map((obs) => ({ obs, timeMs: parseIsoTime(obs.effectiveTime) }));
  const untimed = timed.find((t) => t.timeMs === null);
  if (untimed !== undefined) {
    return {
      failure: failure(
        "missing_clinical_time",
        `missing_clinical_time:${parameter}`,
        `${label} sem tempo clínico utilizável — atualidade indemonstrável; nunca se assume "agora" (DOM-0009).`,
      ),
      resolved: null,
      codeToken: null,
      observationUsed: null,
      ageMinutes: null,
    };
  }

  // Seleção: grupo com o tempo clínico mais recente.
  const latestMs = Math.max(...timed.map((t) => t.timeMs as number));
  const latestGroup = timed.filter((t) => t.timeMs === latestMs).map((t) => t.obs);
  const first = latestGroup[0] as ObservationInput;

  const ageMinutes = Math.max(0, (evaluationTimeMs - latestMs) / MINUTE_MS);
  const freshnessFailure = checkFreshness(parameter, ageMinutes);

  if (parameter === "consciousness" || parameter === "o2_status") {
    const tokens = latestGroup.map((o) => extractCodedToken(parameter, o));
    const distinct = [...new Set(tokens)].sort();
    if (distinct.length > 1) {
      return {
        failure: failure(
          "invalid",
          `conflicting_sources:${parameter}`,
          `${label}: valores simultâneos contraditórios (${distinct.join(" vs ")}) sem resolução registrada — conflito real, nunca resolvido às cegas.`,
        ),
        resolved: null,
        codeToken: null,
        observationUsed: null,
        ageMinutes,
      };
    }
    if (freshnessFailure !== null) {
      return { failure: freshnessFailure, resolved: null, codeToken: null, observationUsed: first, ageMinutes };
    }
    return {
      failure: null,
      resolved: null,
      codeToken: distinct[0] ?? null,
      observationUsed: first,
      ageMinutes,
    };
  }

  // Parâmetros numéricos: deduplicação exata + tolerância de dispositivo (N-10).
  const values = latestGroup.map((o) => (o.value as { kind: "quantity"; value: number; unit: string }).value);
  const distinctValues = [...new Set(values)].sort((a, b) => a - b);
  let conflictResolution: ConflictResolutionRecord | null = null;
  let chosenValue = distinctValues[0] as number;

  if (distinctValues.length > 1) {
    const tolerance = CONFLICT_TOLERANCE[parameter] ?? 0;
    const spread = (distinctValues[distinctValues.length - 1] as number) - (distinctValues[0] as number);
    if (spread > tolerance + EPS) {
      return {
        failure: failure(
          "invalid",
          `conflicting_sources:${parameter}`,
          `${label}: valores simultâneos ${distinctValues.join(" e ")} divergem além da tolerância de dispositivo (±${tolerance}) sem resolução registrada.`,
        ),
        resolved: null,
        codeToken: null,
        observationUsed: null,
        ageMinutes,
      };
    }
    // Dentro da tolerância: o PIOR (mais anormal) valor pontua, com registro.
    chosenValue = pickWorstValue(parameter, distinctValues, worstMetric);
    conflictResolution = {
      candidates: distinctValues,
      chosenValue,
      toleranceApplied: tolerance,
    };
  }

  if (freshnessFailure !== null) {
    return { failure: freshnessFailure, resolved: null, codeToken: null, observationUsed: first, ageMinutes };
  }

  return {
    failure: null,
    resolved: {
      rawValue: chosenValue,
      effectiveTimeMs: latestMs,
      effectiveTime: first.effectiveTime as string,
      conflictResolution,
    },
    codeToken: null,
    observationUsed: first,
    ageMinutes,
  };
}

/** Verificação de integridade de uma observação individual (INV-C; spec §5.2). */
function checkIntegrity(parameter: News2ParameterId, obs: ObservationInput): ParameterFailure | null {
  const label = PARAMETER_LABEL_PT[parameter];

  if (parameter === "consciousness") {
    if (obs.value.kind !== "code") {
      return failure(
        "invalid",
        `unmappable_code:consciousness`,
        `${label}: valor não codificado — apenas token ACVPU explícito é aceito (sem mapeamento GCS→ACVPU em 0.2.0).`,
      );
    }
    if (!ACVPU_TOKENS.includes(obs.value.code)) {
      return failure(
        "invalid",
        `unmappable_code:consciousness`,
        `${label}: token "${obs.value.code}" fora do conjunto {A, C, V, P, U} — inválido; NUNCA pontuado como 0 nem como 3 (defeitos legados D-7/D-8 rejeitados).`,
      );
    }
    return null;
  }

  if (parameter === "o2_status") {
    if (obs.value.kind === "code") {
      if (obs.value.code !== "air" && obs.value.code !== "oxygen") {
        return failure(
          "invalid",
          `unmappable_code:o2_status`,
          `${label}: código "${obs.value.code}" inmapeável — apenas "air"/"oxygen" documentados; desconhecido NUNCA é "ar".`,
        );
      }
      return null;
    }
    // Derivação por fluxo de O2 inalado (spec §2.1 linha 3): insumo em L/min >= 0.
    if (obs.value.unit !== "L/min") {
      return failure(
        "invalid",
        `unmappable_unit:o2_status`,
        `${label}: unidade "${obs.value.unit}" inmapeável para derivação de fluxo (esperado "L/min").`,
      );
    }
    if (!Number.isFinite(obs.value.value) || obs.value.value < 0) {
      return failure(
        "invalid",
        `implausible_value:o2_status`,
        `${label}: fluxo de O2 negativo ou não finito — insumo de derivação deve ser não negativo.`,
      );
    }
    return null;
  }

  // Parâmetros numéricos.
  if (obs.value.kind !== "quantity") {
    return failure(
      "invalid",
      `unmappable_code:${parameter}`,
      `${label}: valor codificado onde se esperava quantidade UCUM — inmapeável.`,
    );
  }
  const expectedUnit = EXPECTED_UCUM_UNIT[parameter];
  if (expectedUnit !== undefined && obs.value.unit !== expectedUnit) {
    return failure(
      "invalid",
      `unmappable_unit:${parameter}`,
      `${label}: unidade "${obs.value.unit}" inmapeável (UCUM normativa: "${expectedUnit}"); insumo nunca é descartado silenciosamente.`,
    );
  }
  if (!Number.isFinite(obs.value.value)) {
    return failure(
      "invalid",
      `implausible_value:${parameter}`,
      `${label}: valor não finito.`,
    );
  }
  const range = PLAUSIBLE_RANGE[parameter];
  if (range !== undefined && (obs.value.value < range.min - EPS || obs.value.value > range.max + EPS)) {
    return failure(
      "invalid",
      `implausible_value:${parameter}`,
      `${label}: valor ${obs.value.value} fora da faixa plausível ${range.min}–${range.max} — fail-closed em implausível (N-9).`,
    );
  }
  return null;
}

/** Atualidade (spec §2.1/§5.2): borda da janela é INCLUSIVA; além do horizonte ⇒ expirado. */
function checkFreshness(parameter: News2ParameterId, ageMinutes: number): ParameterFailure | null {
  const label = PARAMETER_LABEL_PT[parameter];
  const { windowMinutes, expiryMinutes } = FRESHNESS_MINUTES[parameter];
  if (ageMinutes > expiryMinutes + EPS) {
    return failure(
      "expired",
      `expired_input:${parameter}`,
      `${label} além do horizonte de expiração (${Math.round(ageMinutes)} min > ${expiryMinutes} min) — conclusão arbitrariamente velha não é conclusão degradada; é não-conclusão.`,
    );
  }
  if (ageMinutes > windowMinutes + EPS) {
    return failure(
      "stale",
      `stale_input:${parameter}`,
      `${label} fora da janela de atualidade (${Math.round(ageMinutes)} min > ${windowMinutes} min) — nenhum total novo é computado com insumo desatualizado.`,
    );
  }
  return null;
}

function extractCodedToken(parameter: News2ParameterId, obs: ObservationInput): string {
  if (obs.value.kind === "code") return obs.value.code;
  if (parameter === "o2_status") {
    // Derivação documentada: fluxo > 0 ⇒ oxigênio; fluxo == 0 ⇒ ar (spec §2.1 linha 3).
    return obs.value.value > 0 ? "oxygen" : "air";
  }
  // Inalcançável após checkIntegrity; retorno defensivo determinístico.
  return "__unmappable__";
}

/**
 * Pior valor (mais anormal) dentro da tolerância — decisão N-10. A métrica de
 * anormalidade é a pontuação de banda no contexto real do parâmetro (para a
 * SpO2, a escala governada e o estado de O2 são injetados via `metric`).
 */
function pickWorstValue(
  parameter: News2ParameterId,
  candidates: readonly number[],
  metric?: (rawValue: number) => number,
): number {
  const resolution = CHART_RESOLUTION[parameter] ?? 1;
  const scoreOf =
    metric ??
    ((raw: number): number => {
      const chart = roundToChartUnits(raw, resolution, (u) => bandScoreForChartUnit(parameter, u));
      return bandScoreForChartUnit(parameter, chart);
    });
  // Ordena por (pontuação desc, valor asc) — determinístico; empate de banda é
  // clinicamente equivalente no nível de chart.
  const sorted = [...candidates].sort((a, b) => scoreOf(b) - scoreOf(a) || a - b);
  return sorted[0] as number;
}

/**
 * Pontuação de banda por unidade de chart, para parâmetros numéricos SEM
 * dependência de contexto (a SpO2 é tratada à parte por depender de escala e
 * de estado de O2). Para SpO2 aqui usa-se a Escala 1 apenas como métrica de
 * "anormalidade" para desempate de tolerância; a pontuação real da SpO2 é
 * feita no agregador com a escala governada.
 */
function bandScoreForChartUnit(parameter: News2ParameterId, chartUnit: number): number {
  switch (parameter) {
    case "rr":
      return scoreRr(chartUnit);
    case "spo2":
      return scoreSpo2Scale1(chartUnit);
    case "sbp":
      return scoreSbp(chartUnit);
    case "pulse":
      return scorePulse(chartUnit);
    case "temperature":
      return scoreTemperatureDeci(chartUnit);
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Avaliador principal
// ---------------------------------------------------------------------------

/**
 * Avalia NEWS2 de forma determinística e pura. Nunca lança para entradas do
 * tipo declarado: toda condição resolve para um status explícito com razão
 * (ADR-0008 N9 — não existe caminho "desconhecido → presumir bem").
 */
export function evaluateNews2(input: News2EvaluationInput): EvaluationRecord {
  const evaluationTimeMs = parseIsoTime(input.evaluationTime);
  if (evaluationTimeMs === null) {
    return buildNonScoringRecord(input, "not_evaluated", ["unspecified_condition"], {
      passed: false,
      reason: null,
    }, [], "instante de avaliação inválido ou ausente");
  }

  // ---- Gate populacional PRIMEIRO (ADR-0027 Opção A: antes de qualquer lógica de regra).
  const gate = evaluatePopulationGate(input.age, input.pregnancy);
  if (!gate.passed) {
    const reason = gate.reason === "unknown_age" ? "unknown_age" : "out_of_population_scope";
    const detail =
      gate.reason === "unknown_age"
        ? "idade desconhecida — nunca se presume adulto (HAZ-0036)"
        : gate.reason === "under_age"
          ? `idade verificada abaixo do limiar de ${MINIMUM_AGE_YEARS} anos — fora da população V2 (A27-1)`
          : "gravidez documentada — instrumento não validado para gestação; instrumento obstétrico indicado (N-2)";
    return buildNonScoringRecord(input, "not_evaluated", [reason], gate, [], detail);
  }

  // ---- Escala de SpO2 governada (spec §3.2): default Escala 1; conflito ⇒ SpO2 inválida.
  const activeAssignments = (input.spo2ScaleAssignments ?? []).filter((a) => a.revoked !== true);
  const distinctScales = [...new Set(activeAssignments.map((a) => a.scale))].sort();
  const scaleConflict = distinctScales.length > 1;
  const spo2Scale: Spo2Scale = scaleConflict
    ? "scale1" // valor não usado quando em conflito (SpO2 fica inválida); mantido para tipagem
    : (distinctScales[0] ?? "scale1");
  const scale2Order = !scaleConflict && spo2Scale === "scale2" ? activeAssignments.find((a) => a.scale === "scale2") ?? null : null;

  // ---- Pipeline por parâmetro, ordem canônica; o2_status ANTES de spo2 porque a
  // métrica de anormalidade da SpO2 (desempate de tolerância N-10) depende da
  // escala governada e do estado de O2.
  const pipeline = new Map<News2ParameterId, ParameterPipelineResult>();
  for (const parameter of NEWS2_PARAMETER_ORDER) {
    if (parameter === "spo2") continue;
    pipeline.set(parameter, runParameterPipeline(parameter, input.observations, evaluationTimeMs));
  }

  const o2Result = pipeline.get("o2_status") as ParameterPipelineResult;
  const o2Code: O2StatusCode | null =
    o2Result.failure === null && o2Result.codeToken !== null ? (o2Result.codeToken as O2StatusCode) : null;

  const spo2ScoreForMetric = (chartUnit: number): number => {
    if (!scaleConflict && spo2Scale === "scale2") {
      const s = scoreSpo2Scale2(chartUnit, o2Code);
      return s === null ? -1 : s;
    }
    return scoreSpo2Scale1(chartUnit);
  };
  const spo2WorstMetric = (raw: number): number =>
    spo2ScoreForMetric(roundToChartUnits(raw, 1, spo2ScoreForMetric));
  pipeline.set("spo2", runParameterPipeline("spo2", input.observations, evaluationTimeMs, spo2WorstMetric));

  // ---- Contribuições por parâmetro.
  const contributions: ParameterContribution[] = [];
  for (const parameter of NEWS2_PARAMETER_ORDER) {
    const result = pipeline.get(parameter) as ParameterPipelineResult;
    contributions.push(buildContribution(parameter, result, spo2Scale, scaleConflict, o2Code));
  }

  // ---- Classificação agregada (precedência P-a; política classe 1 do ADR-0026).
  const missingInputs = paramsWith(contributions, ["missing"]);
  const missingTimeInputs = paramsWith(contributions, ["missing_clinical_time"]);
  const staleInputs = paramsWith(contributions, ["stale"]);
  const expiredInputs = paramsWith(contributions, ["expired"]);
  const invalidInputs = paramsWith(contributions, ["invalid"]);
  const quarantinedInputs = paramsWith(contributions, ["quarantined"]);

  const reasons: string[] = contributions
    .filter((c) => c.reason !== null)
    .map((c) => c.reason as string);

  // INV-B (A26-1): parâmetro vermelho presente e VÁLIDO pode escalar isoladamente
  // mesmo com o total não computável — a flag é computada independentemente do
  // status agregado e nunca é suprimida por ausência alheia.
  const redParameter = contributions.some((c) => c.status === "valid" && c.score === 3);

  let status: EvaluationStatus;
  if (invalidInputs.length > 0) {
    status = "invalid";
  } else if (
    missingInputs.length > 0 ||
    missingTimeInputs.length > 0 ||
    staleInputs.length > 0 ||
    expiredInputs.length > 0 ||
    quarantinedInputs.length > 0
  ) {
    status = "not_evaluated";
  } else {
    status = "valid";
  }

  // ---- Total e tier SOMENTE sob `valid` (spec §5.1; HAZ-0005).
  let totalScore: number | null = null;
  let riskTier: RiskTier | null = null;
  if (status === "valid") {
    const scores = contributions.map((c) => c.score);
    if (scores.some((s) => s === null)) {
      // Defensivo (ex.: Escala 2 >= 93 sem O2 já teria caído em not_evaluated por
      // o2_status ausente); nenhuma soma parcial jamais é produzida.
      status = "not_evaluated";
      reasons.push("unspecified_condition");
    } else {
      totalScore = (scores as number[]).reduce((a, b) => a + b, 0);
      riskTier =
        totalScore >= 7
          ? "high"
          : totalScore >= 5
            ? "medium"
            : redParameter
              ? "low_medium"
              : "low";
    }
  }

  const fires = status === "valid" && riskTier !== null && riskTier !== "low";

  // ---- Anotações obrigatórias (N-2/N-3/N-4/N-6), sempre visíveis quando aplicáveis.
  const annotations: string[] = [];
  if (input.pregnancy === "not_documented") {
    annotations.push(PREGNANCY_NOT_VERIFIED_ANNOTATION_PT);
  }
  const consciousnessObs = (pipeline.get("consciousness") as ParameterPipelineResult).observationUsed;
  if (consciousnessObs !== null) {
    const sedation = consciousnessObs.sedationState ?? "nao_informado";
    const sedationLabel =
      sedation === "sedado"
        ? "sedado — interpretar consciência como confundida, nunca como válida sem qualificação"
        : sedation === "nao_sedado"
          ? "não sedado"
          : "não informado";
    annotations.push(`estado de sedação do insumo de consciência: ${sedationLabel} (N-4)`);
  }
  if (scale2Order !== null) {
    annotations.push(
      `SpO2 pontuada na Escala 2 — ordem clínica documentada de ${scale2Order.orderedAt} (autoria: ${scale2Order.orderedBy})`,
    );
    const orderedAtMs = parseIsoTime(scale2Order.orderedAt);
    if (orderedAtMs !== null && evaluationTimeMs - orderedAtMs > 7 * 24 * 60 * MINUTE_MS) {
      annotations.push(
        "reconfirmação da ordem de Escala 2 solicitada (ciclo de 7 dias) — não bloqueante; a ordem não expira sozinha (N-6)",
      );
    }
  }

  const escalationSuppressed = input.treatmentLimitationOrderDocumented === true;
  if (escalationSuppressed) {
    annotations.push(ESCALATION_SUPPRESSION_REASON_PT);
  }

  const spo2Contribution = contributions.find((c) => c.parameter === "spo2") as ParameterContribution;
  const spo2ScaleUsed: Spo2Scale | null =
    spo2Contribution.status === "valid" && spo2Contribution.score !== null ? spo2Scale : null;

  const explanation = buildAggregateExplanationPt(
    status,
    totalScore,
    riskTier,
    reasons,
    contributions,
    spo2Scale,
    scale2Order?.orderedAt ?? null,
    input.lastValidEvaluationTime ?? null,
  );

  return {
    ruleId: NEWS2_RULE_ID,
    ruleVersion: NEWS2_RULE_VERSION,
    evaluationTime: input.evaluationTime,
    status,
    reasons,
    totalScore,
    riskTier,
    redParameter,
    fires,
    spo2ScaleUsed,
    populationGate: gate,
    parameters: contributions,
    missingInputs: [...missingInputs, ...missingTimeInputs],
    staleInputs,
    expiredInputs,
    invalidInputs,
    quarantinedInputs,
    annotations,
    escalationSuppressed,
    escalationSuppressionReason: escalationSuppressed ? ESCALATION_SUPPRESSION_REASON_PT : null,
    explanation,
  };
}

/** Gate populacional fail-closed (spec §1.2; ADR-0027 A27-1/A27-2). */
export function evaluatePopulationGate(age: AgeInput, pregnancy: "documented" | "not_documented"): PopulationGateResult {
  if (age.kind === "unknown" || !Number.isFinite((age as { years?: number }).years ?? Number.NaN)) {
    return { passed: false, reason: "unknown_age" };
  }
  if (age.kind === "verified" && age.years < MINIMUM_AGE_YEARS) {
    return { passed: false, reason: "under_age" };
  }
  if (pregnancy === "documented") {
    return { passed: false, reason: "pregnancy_documented" };
  }
  return { passed: true, reason: null };
}

function paramsWith(
  contributions: readonly ParameterContribution[],
  statuses: readonly ParameterStatus[],
): News2ParameterId[] {
  return contributions.filter((c) => statuses.includes(c.status)).map((c) => c.parameter);
}

function buildContribution(
  parameter: News2ParameterId,
  result: ParameterPipelineResult,
  spo2Scale: Spo2Scale,
  scaleConflict: boolean,
  o2Code: O2StatusCode | null,
): ParameterContribution {
  const label = PARAMETER_LABEL_PT[parameter];

  // Conflito de atribuição de escala torna a SpO2 inválida (spec §3.2, linha "Conflict").
  if (parameter === "spo2" && scaleConflict) {
    return {
      parameter,
      status: "invalid",
      score: null,
      reason: "conflicting_sources:spo2",
      valueUsed: null,
      effectiveTime: result.observationUsed?.effectiveTime ?? null,
      ageMinutes: result.ageMinutes,
      conflictResolution: null,
      explanation:
        "atribuições simultâneas contraditórias de escala de SpO2 (scale1 vs scale2) sem revogação — parâmetro inválido até resolução clínica.",
    };
  }

  if (result.failure !== null) {
    return {
      parameter,
      status: result.failure.status,
      score: null,
      reason: result.failure.reason,
      valueUsed: null,
      effectiveTime: result.observationUsed?.effectiveTime ?? null,
      ageMinutes: result.ageMinutes,
      conflictResolution: null,
      explanation: result.failure.explanation,
    };
  }

  // Parâmetros codificados válidos.
  if (parameter === "consciousness") {
    const token = result.codeToken as AcvpuToken;
    const score = scoreConsciousness(token);
    return {
      parameter,
      status: "valid",
      score,
      reason: null,
      valueUsed: { kind: "code", code: token },
      effectiveTime: result.observationUsed?.effectiveTime ?? null,
      ageMinutes: result.ageMinutes,
      conflictResolution: null,
      explanation:
        token === "A"
          ? `${label}: alerta (A) → 0 ponto.`
          : `${label}: token ${token} → 3 pontos (banda vermelha CVPU; nova confusão pontua 3 — RCP Recs 29–30).`,
    };
  }

  if (parameter === "o2_status") {
    const code = result.codeToken as O2StatusCode;
    const score = scoreO2(code);
    return {
      parameter,
      status: "valid",
      score,
      reason: null,
      valueUsed: { kind: "code", code },
      effectiveTime: result.observationUsed?.effectiveTime ?? null,
      ageMinutes: result.ageMinutes,
      conflictResolution: null,
      explanation:
        code === "oxygen"
          ? `${label}: em oxigênio suplementar → 2 pontos.`
          : `${label}: em ar ambiente documentado → 0 ponto (estado documentado, não coerção).`,
    };
  }

  // Parâmetros numéricos válidos: arredondamento de chart + banda.
  const resolved = result.resolved as ResolvedNumericValue;
  const resolution = CHART_RESOLUTION[parameter] ?? 1;
  const unit = EXPECTED_UCUM_UNIT[parameter] ?? "";

  if (parameter === "spo2") {
    const scoreOf = (chartUnit: number): number => {
      if (spo2Scale === "scale2") {
        const s = scoreSpo2Scale2(chartUnit, o2Code);
        return s === null ? -1 : s;
      }
      return scoreSpo2Scale1(chartUnit);
    };
    const chartValue = roundToChartUnits(resolved.rawValue, resolution, scoreOf);
    const score = spo2Scale === "scale2" ? scoreSpo2Scale2(chartValue, o2Code) : scoreSpo2Scale1(chartValue);
    if (score === null) {
      // Escala 2, região >= 93, estado de O2 indeterminável: a SpO2 em si é
      // íntegra; a avaliação agregada já falha por o2_status (insumo obrigatório).
      return {
        parameter,
        status: "valid",
        score: null,
        reason: null,
        valueUsed: { kind: "quantity", value: chartValue, unit },
        effectiveTime: resolved.effectiveTime,
        ageMinutes: result.ageMinutes,
        conflictResolution: resolved.conflictResolution,
        explanation: `${label}: ${chartValue} % na Escala 2, região ≥93 — requer estado ar/oxigênio para pontuar; estado de O2 indisponível.`,
      };
    }
    return {
      parameter,
      status: "valid",
      score,
      reason: null,
      valueUsed: { kind: "quantity", value: chartValue, unit },
      effectiveTime: resolved.effectiveTime,
      ageMinutes: result.ageMinutes,
      conflictResolution: resolved.conflictResolution,
      explanation: `${label}: ${chartValue} % (Escala ${spo2Scale === "scale2" ? "2, decisão clínica documentada" : "1"}) → ${score} ponto(s).`,
    };
  }

  const scoreOf = (chartUnit: number): number => bandScoreForChartUnit(parameter, chartUnit);
  const chartUnits = roundToChartUnits(resolved.rawValue, resolution, scoreOf);
  const score = scoreOf(chartUnits);
  const displayValue = parameter === "temperature" ? chartUnits / 10 : chartUnits;
  return {
    parameter,
    status: "valid",
    score,
    reason: null,
    valueUsed: { kind: "quantity", value: displayValue, unit },
    effectiveTime: resolved.effectiveTime,
    ageMinutes: result.ageMinutes,
    conflictResolution: resolved.conflictResolution,
    explanation: `${label}: ${displayValue} ${unit} → ${score} ponto(s).`,
  };
}

function buildAggregateExplanationPt(
  status: EvaluationStatus,
  totalScore: number | null,
  riskTier: RiskTier | null,
  reasons: readonly string[],
  contributions: readonly ParameterContribution[],
  spo2Scale: Spo2Scale,
  scale2OrderedAt: string | null,
  lastValidEvaluationTime: string | null,
): string {
  if (status === "valid" && totalScore !== null && riskTier !== null) {
    const inputsUsed = contributions
      .map((c) => {
        const v =
          c.valueUsed === null
            ? "—"
            : c.valueUsed.kind === "quantity"
              ? `${c.valueUsed.value} ${c.valueUsed.unit}`.trim()
              : c.valueUsed.code;
        return `${PARAMETER_LABEL_PT[c.parameter]}: ${v} (${c.effectiveTime ?? "sem horário"})`;
      })
      .join("; ");
    const scaleText =
      spo2Scale === "scale2"
        ? `Escala 2 (decisão clínica documentada, ${scale2OrderedAt ?? "horário não informado"})`
        : "Escala 1";
    return (
      `NEWS2 total ${totalScore} — ${TIER_LABEL_PT[riskTier]}. Informação consultiva; ` +
      `não é uma diretriz e não substitui o julgamento clínico. Dados utilizados: ${inputsUsed}. ` +
      `SpO2 pontuada na ${scaleText}. Regra RULE-NEWS2 v0.2.0.`
    );
  }
  const motivo = reasons.length > 0 ? reasons.join(", ") : "condição não especificada";
  if (status === "invalid") {
    return (
      `NEWS2 inválido — falha de integridade de dado detectada (${motivo}). ` +
      `Não existe pontuação para este paciente neste momento; a ausência de pontuação não significa normalidade. ` +
      `Última avaliação válida: ${lastValidEvaluationTime ?? "nenhuma"}. Regra RULE-NEWS2 v0.2.0.`
    );
  }
  return (
    `NEWS2 não avaliado — ${motivo}. Não existe pontuação para este paciente neste momento; ` +
    `a ausência de pontuação não significa normalidade. Última avaliação válida: ` +
    `${lastValidEvaluationTime ?? "nenhuma"}. Regra RULE-NEWS2 v0.2.0.`
  );
}

/** Registro não pontuável construído no curto-circuito do gate ou de entrada inválida. */
function buildNonScoringRecord(
  input: News2EvaluationInput,
  status: EvaluationStatus,
  reasons: readonly string[],
  gate: PopulationGateResult,
  _annotations: readonly string[],
  detailPt: string,
): EvaluationRecord {
  const contributions: ParameterContribution[] = NEWS2_PARAMETER_ORDER.map((parameter) => ({
    parameter,
    status: "not_evaluated",
    score: null,
    reason: null,
    valueUsed: null,
    effectiveTime: null,
    ageMinutes: null,
    conflictResolution: null,
    explanation: `não avaliado — ${detailPt}; nenhuma lógica de regra executou (gate pré-avaliação, ADR-0027).`,
  }));
  const annotations: string[] = [];
  if (input.pregnancy === "not_documented") {
    annotations.push(PREGNANCY_NOT_VERIFIED_ANNOTATION_PT);
  }
  const escalationSuppressed = input.treatmentLimitationOrderDocumented === true;
  if (escalationSuppressed) {
    annotations.push(ESCALATION_SUPPRESSION_REASON_PT);
  }
  return {
    ruleId: NEWS2_RULE_ID,
    ruleVersion: NEWS2_RULE_VERSION,
    evaluationTime: input.evaluationTime,
    status,
    reasons,
    totalScore: null,
    riskTier: null,
    redParameter: false,
    fires: false,
    spo2ScaleUsed: null,
    populationGate: gate,
    parameters: contributions,
    missingInputs: [],
    staleInputs: [],
    expiredInputs: [],
    invalidInputs: [],
    quarantinedInputs: [],
    annotations,
    escalationSuppressed,
    escalationSuppressionReason: escalationSuppressed ? ESCALATION_SUPPRESSION_REASON_PT : null,
    explanation:
      `NEWS2 não avaliado — ${detailPt}. Não existe pontuação para este paciente neste momento; ` +
      `a ausência de pontuação não significa normalidade. Última avaliação válida: ` +
      `${input.lastValidEvaluationTime ?? "nenhuma"}. Regra RULE-NEWS2 v0.2.0.`,
  };
}

/**
 * Reavaliação de status em TEMPO DE LEITURA (spec §5.3; ADR-0008 N5):
 * um registro `valid` envelhece — quando qualquer insumo contribuinte sai da
 * janela de atualidade no instante de leitura, o status exibido é `stale`
 * (com a idade do insumo mais antigo); além do horizonte de expiração,
 * `not_evaluated` com razão `expired_input:<param>`. Status é recomputado na
 * leitura, nunca congelado na escrita. Função pura: o instante de leitura é
 * parâmetro.
 */
export function reassessNews2AtReadTime(record: EvaluationRecord, readTime: string): ReadTimeReassessment {
  if (record.status !== "valid") {
    return { status: record.status, reasons: [...record.reasons], oldestInputAgeMinutes: null };
  }
  const readMs = parseIsoTime(readTime);
  if (readMs === null) {
    return { status: "not_evaluated", reasons: ["unspecified_condition"], oldestInputAgeMinutes: null };
  }
  const expiredReasons: string[] = [];
  const staleReasons: string[] = [];
  let oldestAge: number | null = null;
  for (const contribution of record.parameters) {
    const effMs = parseIsoTime(contribution.effectiveTime);
    if (effMs === null) continue;
    const ageMinutes = Math.max(0, (readMs - effMs) / MINUTE_MS);
    if (oldestAge === null || ageMinutes > oldestAge) oldestAge = ageMinutes;
    const { windowMinutes, expiryMinutes } = FRESHNESS_MINUTES[contribution.parameter];
    if (ageMinutes > expiryMinutes + EPS) {
      expiredReasons.push(`expired_input:${contribution.parameter}`);
    } else if (ageMinutes > windowMinutes + EPS) {
      staleReasons.push(`stale_input:${contribution.parameter}`);
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
