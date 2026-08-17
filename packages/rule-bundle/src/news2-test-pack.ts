/**
 * Test pack executável do RULE-NEWS2 — expansão dos vetores de referência
 * clínica (CRV) da forma DECLARATIVA (baseline + delta, como o documento
 * `docs/05-clinical-safety/rule-releases/news2/reference-vectors.md` os
 * publica) para a forma AUTOCONTIDA que o bundle carrega.
 *
 * Por que o bundle carrega vetores expandidos, e não deltas
 * ---------------------------------------------------------
 * O campo 8 do §6.4 exige "vetores de referência, propriedades, casos de
 * fronteira e corpus de replay" DENTRO do artefato assinado. Um delta só
 * tem significado junto do baseline que o interpreta; se o baseline mudar
 * fora do bundle, o mesmo delta passa a descrever outro caso — e a
 * assinatura continuaria válida sobre um conteúdo cujo sentido mudou. Um
 * vetor expandido é autossuficiente: o que está assinado é exatamente o que
 * será executado.
 *
 * Duplicação registrada com honestidade
 * -------------------------------------
 * A expansão baseline+delta também existe em
 * `packages/kernel-clinico/test/suporte.ts` (suporte de teste do kernel,
 * fora do escopo de escrita desta tarefa e não exportado pelo pacote). Duas
 * implementações da mesma expansão é o padrão E11 que a ADR-0007 condena, e
 * está anotado como pendência. A rede de proteção enquanto durar: o teste
 * `news2-bundle.test.ts` executa os 93 vetores expandidos AQUI contra o
 * kernel real e exige os desfechos documentados — qualquer divergência de
 * expansão que importe faz o teste falhar, não passar silenciosamente.
 *
 * Dados 100% sintéticos (prefixo `SYNTH-`); nenhum dado real de paciente.
 */

import type {
  News2EvaluationInput,
  News2ParameterId,
  ObservationInput,
  SourceDataQuality,
} from "@intensicare/kernel-clinico";

/**
 * Instante de avaliação dos vetores. Sintético e ARBITRÁRIO — o documento
 * de origem especifica idades relativas ("10 min antes da avaliação"), não
 * um instante absoluto. Pinado aqui porque um test pack cujo instante-base
 * variasse produziria um `behaviorHash` diferente a cada execução.
 */
export const NEWS2_TEST_PACK_EVALUATION_TIME = "2026-08-16T12:00:00.000Z";

const EVALUATION_TIME_MS = Date.parse(NEWS2_TEST_PACK_EVALUATION_TIME);

/** Baseline do §1 do documento de vetores — perfil adulto sintético íntegro. */
const BASELINE_NUMERIC_VALUES: Readonly<Partial<Record<News2ParameterId, number>>> = {
  rr: 16,
  spo2: 97,
  sbp: 120,
  pulse: 70,
  temperature: 37.0,
};

const UCUM_UNIT_BY_PARAMETER: Readonly<Partial<Record<News2ParameterId, string>>> = {
  rr: "/min",
  spo2: "%",
  sbp: "mm[Hg]",
  pulse: "/min",
  temperature: "Cel",
};

const NUMERIC_PARAMETERS = ["rr", "spo2", "sbp", "pulse", "temperature"] as const;

const BASELINE_AGE_YEARS = 45;
const BASELINE_MINUTES_BEFORE = 10;
const SCALE2_ORDER_MINUTES_BEFORE = 120;

/** Delta declarativo de um vetor, exatamente como o JSON de origem o traz. */
export interface News2VectorDelta {
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
}

/** Desfecho esperado, transcrito do documento clínico — NUNCA derivado do código. */
export interface News2ExpectedOutcome {
  readonly status: string;
  readonly total: number | null;
  readonly tier: string | null;
  readonly fires: boolean;
  readonly redParameter: boolean;
  readonly reasons: readonly string[];
  readonly paramScores?: Readonly<Partial<Record<News2ParameterId, number>>>;
  readonly annotations?: readonly string[];
}

/** Vetor expandido: entrada autocontida + desfecho esperado. */
export interface News2TestVector {
  readonly id: string;
  readonly description: string;
  readonly sourceSection: string;
  readonly input: News2EvaluationInput;
  readonly expected: News2ExpectedOutcome;
}

/** Test pack pronto para entrar no bundle. */
export interface News2TestPack {
  readonly setId: string;
  readonly standard: string;
  readonly sourcePath: string;
  readonly dataProvenance: string;
  readonly evaluationTime: string;
  readonly vectors: readonly News2TestVector[];
}

function isoMinutesBefore(minutes: number): string {
  return new Date(EVALUATION_TIME_MS - minutes * 60_000).toISOString();
}

function numericObservation(
  parameter: News2ParameterId,
  value: number,
  minutesBefore: number,
  quality: SourceDataQuality,
): ObservationInput {
  return {
    parameter,
    value: { kind: "quantity", value, unit: UCUM_UNIT_BY_PARAMETER[parameter] ?? "" },
    effectiveTime: isoMinutesBefore(minutesBefore),
    receivedTime: isoMinutesBefore(Math.max(0, minutesBefore - 1)),
    provenance: { sourceSystem: "SYNTH-monitor-01", sourceDataQuality: quality },
  };
}

function codedObservation(
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
 * Expande baseline (§1) + delta do vetor em uma entrada de avaliação
 * completa e autocontida.
 */
export function expandNews2Vector(delta: News2VectorDelta): News2EvaluationInput {
  const absent = new Set<News2ParameterId>(delta.absent ?? []);
  const quarantined = new Set<News2ParameterId>(delta.quarantined ?? []);

  const minutesBefore = (parameter: News2ParameterId): number =>
    delta.observedMinutesBefore?.[parameter] ?? BASELINE_MINUTES_BEFORE;
  const quality = (parameter: News2ParameterId): SourceDataQuality =>
    quarantined.has(parameter) ? "quarantined" : "valid";

  const observations: ObservationInput[] = [];

  for (const parameter of NUMERIC_PARAMETERS) {
    if (absent.has(parameter)) {
      continue;
    }
    const conflicting = delta.conflictValues?.[parameter];
    if (conflicting !== undefined) {
      for (const value of conflicting) {
        observations.push(
          numericObservation(parameter, value, minutesBefore(parameter), quality(parameter)),
        );
      }
      continue;
    }
    const value = delta.values?.[parameter] ?? (BASELINE_NUMERIC_VALUES[parameter] as number);
    observations.push(
      numericObservation(parameter, value, minutesBefore(parameter), quality(parameter)),
    );
  }

  if (!absent.has("o2_status")) {
    observations.push(
      codedObservation(
        "o2_status",
        delta.o2 ?? "air",
        minutesBefore("o2_status"),
        quality("o2_status"),
      ),
    );
  }

  if (!absent.has("consciousness")) {
    observations.push(
      codedObservation(
        "consciousness",
        delta.consciousness ?? "A",
        minutesBefore("consciousness"),
        quality("consciousness"),
      ),
    );
  }

  return {
    evaluationTime: NEWS2_TEST_PACK_EVALUATION_TIME,
    age:
      delta.age === "unknown"
        ? { kind: "unknown" }
        : { kind: "verified", years: delta.age ?? BASELINE_AGE_YEARS },
    pregnancy: delta.pregnancy ?? "not_documented",
    observations,
    ...(delta.scale2Order === true
      ? {
          spo2ScaleAssignments: [
            {
              scale: "scale2" as const,
              orderedBy: "SYNTH-medico-01",
              orderedAt: isoMinutesBefore(SCALE2_ORDER_MINUTES_BEFORE),
            },
          ],
        }
      : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new Error(`test pack NEWS2: campo "${path}" deveria ser string`);
  }
  return value;
}

/**
 * Lê o JSON de vetores publicado e devolve o test pack expandido.
 *
 * A leitura de arquivo NÃO acontece aqui de propósito: este módulo é puro
 * (sem I/O), e quem tem o texto decide de onde ele veio. O acoplamento a um
 * caminho de disco seria uma dependência escondida dentro de um artefato
 * que precisa ser reproduzível byte a byte.
 */
export function parseNews2TestPack(
  rawJson: string,
  options: { readonly setId: string; readonly standard: string },
): News2TestPack {
  const parsed: unknown = JSON.parse(rawJson);
  if (!isRecord(parsed)) {
    throw new Error("test pack NEWS2: o JSON de vetores deve ser um objeto");
  }

  const provenance = isRecord(parsed.provenance) ? parsed.provenance : {};
  const rawVectors = parsed.vectors;
  if (!Array.isArray(rawVectors)) {
    throw new Error('test pack NEWS2: campo "vectors" ausente ou não é lista');
  }

  const vectors: News2TestVector[] = rawVectors.map((entry: unknown, index): News2TestVector => {
    if (!isRecord(entry)) {
      throw new Error(`test pack NEWS2: vetor no índice ${index} não é objeto`);
    }
    const id = requireString(entry.id, `vectors[${index}].id`);
    if (!isRecord(entry.expected)) {
      throw new Error(`test pack NEWS2: vetor "${id}" sem bloco "expected"`);
    }
    const delta = isRecord(entry.delta) ? (entry.delta as News2VectorDelta) : {};

    return {
      id,
      description: requireString(entry.description, `vectors[${index}].description`),
      sourceSection: requireString(entry.source_section, `vectors[${index}].source_section`),
      input: expandNews2Vector(delta),
      expected: entry.expected as unknown as News2ExpectedOutcome,
    };
  });

  if (vectors.length === 0) {
    throw new Error("test pack NEWS2: conjunto vazio — nada a pinar");
  }

  return {
    setId: options.setId,
    standard: options.standard,
    sourcePath:
      typeof provenance.source_path === "string" ? provenance.source_path : "desconhecido",
    dataProvenance:
      typeof provenance.data_provenance === "string"
        ? provenance.data_provenance
        : "synthetic-only",
    evaluationTime: NEWS2_TEST_PACK_EVALUATION_TIME,
    vectors,
  };
}
