/**
 * Suporte de teste da RULE-GCS: construção do painel `PANEL-GCS-NORMAL`
 * (reference-vectors.md §2) e aplicação do delta declarado em cada vetor.
 * Dados 100% sintéticos (prefixo "SYNTH-").
 *
 * O painel do documento-fonte usa o instante de avaliação
 * `T = 2026-08-15T12:00:00-03:00` e observações às 09:00 / 09:02 / 09:03
 * (mesmo ato de exame; contemporâneas dentro dos 30 min de §5.3), com RASS
 * pareado às 09:00. Aqui os horários são expressos como minutos ANTES de `T`
 * para que o delta de cada vetor seja legível e o cálculo permaneça exato.
 */

import type {
  GcsComponentId,
  GcsComponentObservationInput,
  GcsComponentValue,
  GcsEvaluationInput,
  GcsNtReason,
  RassObservationInput,
  SedativeExposureState,
  SourceDataQuality,
} from "../src/index.js";

/** `T` do documento de vetores: 2026-08-15T12:00:00-03:00. */
export const EVAL_TIME_GCS = "2026-08-15T15:00:00.000Z";

const EVAL_TIME_MS = Date.parse(EVAL_TIME_GCS);

/** Minutos antes de `T` para cada observação do painel (09:00 / 09:02 / 09:03). */
const BASELINE_MINUTES_BEFORE: Readonly<Record<GcsComponentId, number>> = {
  eye: 180,
  verbal: 178,
  motor: 177,
};

const BASELINE_VALUES: Readonly<Record<GcsComponentId, number>> = {
  eye: 4,
  verbal: 5,
  motor: 6,
};

/** RASS do painel: 0, observado às 09:00 (pareado). */
const BASELINE_RASS_MINUTES_BEFORE = 180;

/** Delta declarativo de um componente (schema do arquivo vetores-gcs.json). */
export interface GcsComponentDelta {
  readonly value?: number;
  readonly nt?: GcsNtReason;
  readonly absent?: boolean;
  readonly minutesBefore?: number;
  readonly unit?: string;
  readonly quarantined?: boolean;
  readonly noClinicalTime?: boolean;
  /** Observações simultâneas divergentes (conflito não reconciliado). */
  readonly conflictValues?: readonly number[];
}

/** Delta declarativo de um vetor. */
export interface GcsVectorDelta {
  readonly components?: Readonly<Partial<Record<GcsComponentId, GcsComponentDelta>>>;
  readonly rass?: {
    readonly value?: number;
    readonly minutesBefore?: number;
    readonly absent?: boolean;
    readonly quarantined?: boolean;
    readonly noClinicalTime?: boolean;
  };
  readonly sedativeExposure?: SedativeExposureState;
  readonly age?: number | "unknown";
  readonly sourceProvidedTotal?: number;
  readonly treatmentLimitationOrderDocumented?: boolean;
}

export interface GcsVectorExpected {
  readonly status: string;
  readonly total: number | null;
  readonly reasons: readonly string[];
  readonly primaryReason: string | null;
  readonly assessability: string;
  readonly noFireReason: string;
  readonly componentStatuses: Readonly<Partial<Record<GcsComponentId, string>>>;
  readonly componentValues?: Readonly<Partial<Record<GcsComponentId, number | null>>>;
  readonly componentDisplay?: string;
  readonly pairedRass?: number | null;
}

export interface GcsVectorEntry {
  readonly id: string;
  readonly source_section: string;
  readonly description: string;
  readonly delta: GcsVectorDelta;
  readonly expected: GcsVectorExpected;
}

export interface GcsRetiredVectorEntry {
  readonly id: string;
  readonly superseded_by: string;
  readonly retirement_note: string;
}

export interface GcsVectorFile {
  readonly provenance: Record<string, unknown>;
  readonly vectors: readonly GcsVectorEntry[];
  readonly retired: readonly GcsRetiredVectorEntry[];
}

function isoMinutesBefore(minutes: number): string {
  return new Date(EVAL_TIME_MS - minutes * 60_000).toISOString();
}

function componentObservation(
  component: GcsComponentId,
  value: GcsComponentValue,
  minutesBefore: number,
  quality: SourceDataQuality,
  noClinicalTime: boolean,
): GcsComponentObservationInput {
  return {
    component,
    value,
    effectiveTime: noClinicalTime ? null : isoMinutesBefore(minutesBefore),
    receivedTime: isoMinutesBefore(Math.max(0, minutesBefore - 1)),
    provenance: { sourceSystem: "SYNTH-beira-leito-01", sourceDataQuality: quality },
  };
}

/** Constrói a entrada de avaliação: painel `PANEL-GCS-NORMAL` + delta do vetor. */
export function buildGcsVectorInput(delta: GcsVectorDelta): GcsEvaluationInput {
  const observations: GcsComponentObservationInput[] = [];

  for (const component of ["eye", "verbal", "motor"] as const) {
    const componentDelta = delta.components?.[component] ?? {};
    if (componentDelta.absent === true) continue;
    const minutesBefore = componentDelta.minutesBefore ?? BASELINE_MINUTES_BEFORE[component];
    const quality: SourceDataQuality =
      componentDelta.quarantined === true ? "quarantined" : "valid";
    const noClinicalTime = componentDelta.noClinicalTime === true;

    if (componentDelta.conflictValues !== undefined) {
      for (const value of componentDelta.conflictValues) {
        observations.push(
          componentObservation(
            component,
            {
              kind: "score",
              value,
              ...(componentDelta.unit === undefined ? {} : { unit: componentDelta.unit }),
            },
            minutesBefore,
            quality,
            noClinicalTime,
          ),
        );
      }
      continue;
    }

    const value: GcsComponentValue =
      componentDelta.nt !== undefined
        ? { kind: "not_testable", ntReason: componentDelta.nt }
        : {
            kind: "score",
            value: componentDelta.value ?? BASELINE_VALUES[component],
            ...(componentDelta.unit === undefined ? {} : { unit: componentDelta.unit }),
          };
    observations.push(
      componentObservation(component, value, minutesBefore, quality, noClinicalTime),
    );
  }

  const rassDelta = delta.rass ?? {};
  const rass: RassObservationInput | null =
    rassDelta.absent === true
      ? null
      : {
          value: rassDelta.value ?? 0,
          effectiveTime:
            rassDelta.noClinicalTime === true
              ? null
              : isoMinutesBefore(rassDelta.minutesBefore ?? BASELINE_RASS_MINUTES_BEFORE),
          provenance: {
            sourceSystem: "SYNTH-beira-leito-01",
            sourceDataQuality: rassDelta.quarantined === true ? "quarantined" : "valid",
          },
        };

  return {
    evaluationTime: EVAL_TIME_GCS,
    age:
      delta.age === "unknown" ? { kind: "unknown" } : { kind: "verified", years: delta.age ?? 58 },
    components: observations,
    rass,
    sedativeExposure: delta.sedativeExposure ?? "none_active",
    ...(delta.sourceProvidedTotal === undefined
      ? {}
      : {
          sourceProvidedTotal: {
            value: delta.sourceProvidedTotal,
            effectiveTime: isoMinutesBefore(180),
          },
        }),
    ...(delta.treatmentLimitationOrderDocumented === undefined
      ? {}
      : { treatmentLimitationOrderDocumented: delta.treatmentLimitationOrderDocumented }),
  };
}
