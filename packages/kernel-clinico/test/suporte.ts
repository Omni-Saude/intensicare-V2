/**
 * Suporte de teste: construção do perfil baseline dos vetores CRV NEWS2
 * (reference-vectors.md §1) e aplicação do delta declarado em cada vetor.
 * Dados 100% sintéticos (prefixo "SYNTH-").
 */

import type {
  News2EvaluationInput,
  News2ParameterId,
  ObservationInput,
  SourceDataQuality,
} from "../src/index.js";

/** Instante fixo e sintético da avaliação — nenhum relógio real é lido. */
export const EVAL_TIME = "2026-08-16T12:00:00.000Z";

const EVAL_TIME_MS = Date.parse(EVAL_TIME);

/** Delta declarativo de um vetor (schema do arquivo vetores-news2.json). */
export interface VectorDelta {
  readonly values?: Readonly<Partial<Record<News2ParameterId, number>>>;
  readonly absent?: readonly News2ParameterId[];
  readonly observedMinutesBefore?: Readonly<Partial<Record<News2ParameterId, number>>>;
  readonly consciousness?: string;
  readonly o2?: "air" | "oxygen";
  readonly scale2Order?: boolean;
  readonly age?: number | "unknown";
  readonly pregnancy?: "documented" | "not_documented";
  readonly quarantined?: readonly News2ParameterId[];
  readonly conflictValues?: Readonly<Partial<Record<News2ParameterId, readonly number[]>>>;
  /**
   * Estado ANTERIOR da série do paciente (gatilho de borda, catálogo irmão
   * ALERT-EWS-NEWS2-DETERIORATION-01): total e conjunto de parâmetros
   * vermelhos da medição anterior. Ausente ⇒ primeira medição conhecida
   * (premissa reversível: desconhecido ARMA o gatilho — pendente ratificação
   * RAT-EWS trigger policy).
   */
  readonly priorState?: {
    readonly total: number | null;
    readonly redParameters: readonly News2ParameterId[];
  };
}

export interface VectorExpected {
  readonly status: string;
  readonly total: number | null;
  readonly tier: string | null;
  readonly fires: boolean;
  readonly redParameter: boolean;
  readonly reasons: readonly string[];
  readonly paramScores?: Readonly<Partial<Record<News2ParameterId, number>>>;
  readonly annotations?: readonly string[];
  /** Veredito do gatilho de borda (opcional — vetores 0201+). */
  readonly alertCrossing?: boolean;
  readonly alertCrossingReason?: string | null;
}

export interface VectorEntry {
  readonly id: string;
  readonly source_section: string;
  readonly description: string;
  readonly delta: VectorDelta;
  readonly expected: VectorExpected;
}

export interface VectorFile {
  readonly provenance: Record<string, unknown>;
  readonly vectors: readonly VectorEntry[];
}

function isoMinutesBefore(minutes: number): string {
  return new Date(EVAL_TIME_MS - minutes * 60_000).toISOString();
}

const UNIT_BY_PARAM: Readonly<Partial<Record<News2ParameterId, string>>> = {
  rr: "/min",
  spo2: "%",
  sbp: "mm[Hg]",
  pulse: "/min",
  temperature: "Cel",
};

const BASELINE_VALUES: Readonly<Partial<Record<News2ParameterId, number>>> = {
  rr: 16,
  spo2: 97,
  sbp: 120,
  pulse: 70,
  temperature: 37.0,
};

function numericObs(
  parameter: News2ParameterId,
  value: number,
  minutesBefore: number,
  quality: SourceDataQuality,
): ObservationInput {
  return {
    parameter,
    value: { kind: "quantity", value, unit: UNIT_BY_PARAM[parameter] ?? "" },
    effectiveTime: isoMinutesBefore(minutesBefore),
    receivedTime: isoMinutesBefore(Math.max(0, minutesBefore - 1)),
    provenance: { sourceSystem: "SYNTH-monitor-01", sourceDataQuality: quality },
  };
}

function codedObs(
  parameter: News2ParameterId,
  code: string,
  minutesBefore: number,
  quality: SourceDataQuality,
): ObservationInput {
  return {
    parameter,
    value: { kind: "code", code },
    effectiveTime: isoMinutesBefore(minutesBefore),
    receivedTime: isoMinutesBefore(Math.max(0, minutesBefore - 1)),
    provenance: { sourceSystem: "SYNTH-beira-leito-01", sourceDataQuality: quality },
    ...(parameter === "consciousness" ? { sedationState: "nao_sedado" as const } : {}),
  };
}

/**
 * Constrói a entrada de avaliação: baseline dos vetores (§1) + delta do vetor.
 */
export function buildVectorInput(delta: VectorDelta): News2EvaluationInput {
  const absent = new Set<News2ParameterId>(delta.absent ?? []);
  const quarantined = new Set<News2ParameterId>(delta.quarantined ?? []);
  const minutes = (p: News2ParameterId): number => delta.observedMinutesBefore?.[p] ?? 10;
  const quality = (p: News2ParameterId): SourceDataQuality =>
    quarantined.has(p) ? "quarantined" : "valid";

  const observations: ObservationInput[] = [];

  for (const parameter of ["rr", "spo2", "sbp", "pulse", "temperature"] as const) {
    if (absent.has(parameter)) continue;
    const conflict = delta.conflictValues?.[parameter];
    if (conflict !== undefined) {
      for (const v of conflict) {
        observations.push(numericObs(parameter, v, minutes(parameter), quality(parameter)));
      }
      continue;
    }
    const value = delta.values?.[parameter] ?? (BASELINE_VALUES[parameter] as number);
    observations.push(numericObs(parameter, value, minutes(parameter), quality(parameter)));
  }

  if (!absent.has("o2_status")) {
    observations.push(
      codedObs("o2_status", delta.o2 ?? "air", minutes("o2_status"), quality("o2_status")),
    );
  }
  if (!absent.has("consciousness")) {
    observations.push(
      codedObs(
        "consciousness",
        delta.consciousness ?? "A",
        minutes("consciousness"),
        quality("consciousness"),
      ),
    );
  }

  return {
    evaluationTime: EVAL_TIME,
    age:
      delta.age === "unknown" ? { kind: "unknown" } : { kind: "verified", years: delta.age ?? 45 },
    pregnancy: delta.pregnancy ?? "not_documented",
    observations,
    ...(delta.priorState !== undefined
      ? {
          priorState: {
            totalScore: delta.priorState.total,
            redParameters: [...delta.priorState.redParameters],
          },
        }
      : {}),
    ...(delta.scale2Order === true
      ? {
          spo2ScaleAssignments: [
            {
              scale: "scale2" as const,
              orderedBy: "SYNTH-medico-01",
              orderedAt: isoMinutesBefore(120),
            },
          ],
        }
      : {}),
  };
}
