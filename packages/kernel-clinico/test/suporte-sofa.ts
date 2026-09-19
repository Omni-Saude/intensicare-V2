/**
 * Suporte de teste do kernel para os vetores SOFA — expansão baseline (§2,
 * PANEL-NORMAL) + delta de cada vetor do `vetores-sofa.json` em uma entrada
 * `SofaEvaluationInput` autocontida.
 *
 * Duplicação registrada com honestidade (padrão E11 da ADR-0007, já anotado
 * no par NEWS2): a MESMA expansão baseline+delta existe em
 * `packages/rule-bundle/src/sofa-test-pack.ts` (o pack que o bundle carrega).
 * A rede de proteção enquanto a duplicação durar: o teste do rule-bundle
 * executa TODOS os vetores expandidos LÁ contra o kernel real e exige os
 * desfechos documentados — qualquer divergência de expansão que importe faz
 * o teste falhar, não passar silenciosamente.
 *
 * Todos os horários de observação do documento-fonte carram offset `-03:00`
 * (convenção §2); esta expansão materializa o offset explicitamente —
 * `Date.parse` de uma string sem offset dependeria do fuso do processo, o
 * que destruiria o determinismo byte a byte do kernel.
 *
 * Dados 100% sintéticos; nenhum dado real de paciente.
 */
import type {
  ObservationProvenance,
  RassObservationInput,
  SedativeExposureState,
  SofaEvaluationInput,
  SofaMapObservation,
  SofaQuantityObservation,
  SofaRespiratorySupportValue,
  SofaUrineOutputObservation,
  SofaVasoactiveAgentObservation,
} from "../src/index.js";

/** Instante de avaliação T dos vetores (documento §0.3): 2026-08-15T12:00:00-03:00. */
export const SOFA_VETORES_INSTANTE_AVALIACAO = "2026-08-15T12:00:00-03:00";

/** Proveniência sintética uniforme — qualidade `valid` em TODO o painel (§2). */
const PROCEDENCIA: ObservationProvenance = {
  sourceSystem: "SYNTH-amh-01",
  sourceDataQuality: "valid",
};

/** Materializa o offset -03:00 do documento em cada horário observado. */
export function horarioDoDocumento(observed: string): string {
  if (
    observed.includes("T") &&
    !observed.includes("Z") &&
    !observed.includes("+") &&
    !observed.includes("-", 10)
  ) {
    return `${observed}:00-03:00`;
  }
  return observed;
}

type QuantidadeDelta = {
  readonly value?: number;
  readonly unit?: string | null;
  readonly observed?: string;
  readonly present?: false;
  readonly conflict?: readonly number[];
};

type Delta = {
  readonly age?: { readonly value?: number; readonly present?: false };
  readonly pao2?: QuantidadeDelta;
  readonly fio2?: QuantidadeDelta;
  readonly respiratory_support_status?: {
    readonly value?: SofaRespiratorySupportValue;
    readonly observed?: string;
    readonly present?: false;
  };
  readonly platelets?: QuantidadeDelta;
  readonly bilirubin?: QuantidadeDelta;
  readonly map?: QuantidadeDelta;
  readonly vasoactive_agents?:
    | "none-active"
    | readonly {
        readonly agent: string;
        readonly dose?: { readonly value: number; readonly unit: string } | null;
        readonly sustained_min?: number;
        readonly last_confirmed?: string;
      }[];
  readonly gcs?: QuantidadeDelta;
  readonly rass?: QuantidadeDelta;
  readonly sedative_infusion?: "none-active" | "midazolam-active" | "unknown";
  readonly creatinine?: QuantidadeDelta;
  readonly urine_output_24h?: {
    readonly value?: number;
    readonly unit?: string;
    readonly interval?: readonly [string, string];
    readonly present?: false;
  };
};

// --- Horários do painel (§2), todos com offset -03:00 materializado ----------

const PANEL_OBSERVED = {
  pao2: "2026-08-15T08:00",
  fio2: "2026-08-15T08:00",
  respiratory_support_status: "2026-08-15T08:00",
  platelets: "2026-08-15T06:00",
  bilirubin: "2026-08-15T06:00",
  map: "2026-08-15T10:00",
  gcs: "2026-08-15T09:00",
  rass: "2026-08-15T09:00",
  creatinine: "2026-08-15T06:00",
} as const;

const URINE_INTERVAL: readonly [string, string] = ["2026-08-14T10:00", "2026-08-15T10:00"];

function quantidade(
  valor: number,
  unidade: string | null,
  observed: string,
): SofaQuantityObservation {
  return {
    value: valor,
    unit: unidade ?? "",
    effectiveTime: observed === null ? null : horarioDoDocumento(observed),
    provenance: PROCEDENCIA,
  };
}

function deltaParaQuantidades(
  delta: QuantidadeDelta | undefined,
  observedPadrao: string,
  valorPadrao: number,
  unidadePadrao: string | null,
): SofaQuantityObservation[] {
  // Chave ausente = PANEL-NORMAL se aplica; só `present: false` é ausência.
  if (delta !== undefined && delta.present === false) return [];
  if (delta === undefined) {
    return [quantidade(valorPadrao, unidadePadrao, observedPadrao)];
  }
  if (delta.conflict !== undefined) {
    const observed = delta.observed ?? observedPadrao;
    return delta.conflict.map((value) =>
      quantidade(value, delta.unit ?? unidadePadrao ?? "", observed),
    );
  }
  const observed = delta.observed ?? observedPadrao;
  return [quantidade(delta.value ?? valorPadrao, delta.unit ?? unidadePadrao, observed)];
}

/**
 * Expande baseline (PANEL-NORMAL) + delta do vetor em uma entrada completa
 * e autocontida. Puramente sintático: nenhum valor clínico é decidido aqui —
 * o delta É o documento.
 */
export function expandirVetorSofa(delta: Delta): SofaEvaluationInput {
  const agents = delta.vasoactive_agents;
  const vasoactiveAgents: SofaVasoactiveAgentObservation[] =
    agents === undefined || agents === "none-active"
      ? []
      : (agents as Exclude<typeof agents, "none-active">).map((agente) => ({
          agent: agente.agent,
          dose: agente.dose ?? null,
          sustainedMinutes: agente.sustained_min ?? 0,
          lastConfirmedAt:
            agente.last_confirmed === undefined ? null : horarioDoDocumento(agente.last_confirmed),
          provenance: PROCEDENCIA,
        }));

  const sedative: SedativeExposureState =
    delta.sedative_infusion === "midazolam-active"
      ? "active_infusion"
      : delta.sedative_infusion === "unknown"
        ? "unknown"
        : "none_active";

  const urineDelta = delta.urine_output_24h;
  const urineOutput24h: SofaUrineOutputObservation | null =
    urineDelta !== undefined && urineDelta.present === false
      ? null
      : {
          value: urineDelta?.value ?? 1800,
          unit: urineDelta?.unit ?? "mL",
          intervalStart: horarioDoDocumento(urineDelta?.interval?.[0] ?? URINE_INTERVAL[0]),
          intervalEnd: horarioDoDocumento(urineDelta?.interval?.[1] ?? URINE_INTERVAL[1]),
          provenance: PROCEDENCIA,
        };

  const mapDelta = delta.map;
  const map: SofaMapObservation | null =
    mapDelta !== undefined && mapDelta.present === false
      ? null
      : {
          kind: "measured",
          value: mapDelta?.value ?? 85,
          unit: mapDelta?.unit ?? "mm[Hg]",
          effectiveTime: horarioDoDocumento(mapDelta?.observed ?? PANEL_OBSERVED.map),
          provenance: PROCEDENCIA,
        };

  const supportDelta = delta.respiratory_support_status;
  const gcsDelta = delta.gcs;
  const rassDelta = delta.rass;

  return {
    evaluationTime: SOFA_VETORES_INSTANTE_AVALIACAO,
    age:
      delta.age === undefined
        ? { kind: "verified", years: 64 }
        : delta.age.present === false
          ? { kind: "unknown" }
          : { kind: "verified", years: delta.age.value ?? 64 },
    pao2: deltaParaQuantidades(delta.pao2, PANEL_OBSERVED.pao2, 96, "mm[Hg]"),
    fio2: deltaParaQuantidades(delta.fio2, PANEL_OBSERVED.fio2, 0.21, "1"),
    respiratorySupportStatus:
      supportDelta !== undefined && supportDelta.present === false
        ? null
        : {
            value: supportDelta?.value ?? "none",
            effectiveTime: horarioDoDocumento(
              supportDelta?.observed ?? PANEL_OBSERVED.respiratory_support_status,
            ),
            provenance: PROCEDENCIA,
          },
    platelets: deltaParaQuantidades(delta.platelets, PANEL_OBSERVED.platelets, 250, "10*3/uL"),
    bilirubin: deltaParaQuantidades(delta.bilirubin, PANEL_OBSERVED.bilirubin, 0.6, "mg/dL"),
    map,
    vasoactiveAgents,
    gcsTotal:
      gcsDelta !== undefined && gcsDelta.present === false
        ? null
        : quantidade(gcsDelta?.value ?? 15, "{score}", gcsDelta?.observed ?? PANEL_OBSERVED.gcs),
    rass:
      rassDelta !== undefined && rassDelta.present === false
        ? null
        : ({
            value: rassDelta?.value ?? 0,
            effectiveTime: horarioDoDocumento(rassDelta?.observed ?? PANEL_OBSERVED.rass),
            provenance: PROCEDENCIA,
          } satisfies RassObservationInput),
    sedativeExposure: sedative,
    creatinine: deltaParaQuantidades(delta.creatinine, PANEL_OBSERVED.creatinine, 0.8, "mg/dL"),
    urineOutput24h,
  };
}

export type VetorSofaArquivo = {
  readonly provenance: Record<string, unknown>;
  readonly vectors: readonly {
    readonly id: string;
    readonly source_section: string;
    readonly description: string;
    readonly retired?: boolean;
    readonly superseded_by?: string;
    readonly delta: Delta;
    readonly expected: {
      readonly status: string;
      readonly total: number | null;
      readonly noFireReason: string;
      readonly reasons: readonly string[];
      readonly componentScores?: Readonly<Record<string, number>>;
      readonly componentStatuses?: Readonly<Record<string, string>>;
      readonly annotationsContain?: readonly string[];
    } | null;
  }[];
};
