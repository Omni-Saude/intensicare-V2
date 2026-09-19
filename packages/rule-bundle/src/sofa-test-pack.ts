/**
 * Test pack executável do RULE-SOFA — expansão dos vetores de referência
 * clínica (CRV-SOFA-0301..0341) da forma DECLARATIVA (painel PANEL-NORMAL +
 * delta, como o documento
 * `docs/05-clinical-safety/rule-releases/sofa/reference-vectors.md` os
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
 * Duplicação registrada com honestidade (padrão E11, já anotado no par
 * NEWS2)
 * ---------------------------------------------------------------------
 * A expansão painel+delta também existe em
 * `packages/kernel-clinico/test/suporte-sofa.ts` (suporte de teste do
 * kernel, fora do escopo de escrita desta fatia e não exportado pelo
 * pacote). Duas implementações da mesma expansão é o padrão E11 que a
 * ADR-0007 condena, e está anotado como pendência. A rede de proteção
 * enquanto durar: o teste `sofa-bundle.test.ts` executa TODOS os vetores
 * expandidos AQUI contra o kernel real e exige os desfechos documentados —
 * qualquer divergência de expansão que importe faz o teste falhar, não
 * passar silenciosamente.
 *
 * Corpus: 41 vetores transcritos — 38 ATIVOS executáveis + 3 APOSENTADOS
 * (CRV-SOFA-0321→0340, 0322→0336, 0323→0335, aposentados pelas decisões
 * GDEC-0007) mantidos como registro histórico; o test pack executável
 * carrega SOMENTE os ativos. Dados 100% sintéticos (prefixo `SYNTH-`).
 */

import type {
  SofaEvaluationInput,
  SofaQuantityObservation,
  SofaRespiratorySupportValue,
  SofaUrineOutputObservation,
  SofaVasoactiveAgentObservation,
} from "@intensicare/kernel-clinico";

/**
 * Instante de avaliação T dos vetores (documento §0.3):
 * 2026-08-15T12:00:00-03:00 = 2026-08-15T15:00:00.000Z. Pinado porque um
 * test pack cujo instante-base variasse produziria um `behaviorHash`
 * diferente a cada execução.
 */
export const SOFA_TEST_PACK_EVALUATION_TIME = "2026-08-15T15:00:00.000Z";

/** Proveniência sintética uniforme — qualidade `valid` em TODO o painel (§2). */
const PROCEDENCIA = {
  sourceSystem: "SYNTH-amh-01",
  sourceDataQuality: "valid",
} as const;

/** Materializa o offset `-03:00` do documento em cada horário observado. */
function horarioDoDocumento(observed: string): string {
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

/** Delta declarativo de um vetor, exatamente como o documento o traz. */
export type SofaVectorDelta = {
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

/** Desfecho esperado, transcrito do documento clínico — NUNCA derivado do código. */
export interface SofaExpectedOutcome {
  readonly status: string;
  readonly total: number | null;
  readonly noFireReason: string;
  readonly reasons: readonly string[];
  readonly componentScores?: Readonly<Record<string, number>>;
  readonly componentStatuses?: Readonly<Record<string, string>>;
  readonly annotationsContain?: readonly string[];
}

/** Vetor expandido: entrada autocontida + desfecho esperado. */
export interface SofaTestVector {
  readonly id: string;
  readonly description: string;
  readonly sourceSection: string;
  readonly retired: boolean;
  readonly supersededBy: string | null;
  readonly input: SofaEvaluationInput | null;
  readonly expected: SofaExpectedOutcome | null;
}

/** Test pack pronto para entrar no bundle (somente ativos em `vectors`). */
export interface SofaTestPack {
  readonly setId: string;
  readonly standard: string;
  readonly sourcePath: string;
  readonly dataProvenance: string;
  readonly evaluationTime: string;
  readonly activeVectorCount: number;
  readonly retiredVectorIds: readonly string[];
  readonly vectors: readonly SofaTestVector[];
}

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
    effectiveTime: horarioDoDocumento(observed),
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
  return [
    quantidade(
      delta.value ?? valorPadrao,
      delta.unit === undefined ? unidadePadrao : delta.unit,
      delta.observed ?? observedPadrao,
    ),
  ];
}

/**
 * Expande painel (§2 PANEL-NORMAL) + delta do vetor em uma entrada de
 * avaliação completa e autocontida. Puramente sintático: nenhum valor
 * clínico é decidido aqui — o delta É o documento.
 */
export function expandSofaVector(delta: SofaVectorDelta): SofaEvaluationInput {
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

  const sedative =
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
  const map =
    mapDelta !== undefined && mapDelta.present === false
      ? null
      : ({
          kind: "measured",
          value: mapDelta?.value ?? 85,
          unit: mapDelta?.unit ?? "mm[Hg]",
          effectiveTime: horarioDoDocumento(mapDelta?.observed ?? PANEL_OBSERVED.map),
          provenance: PROCEDENCIA,
        } as const);

  const supportDelta = delta.respiratory_support_status;
  const gcsDelta = delta.gcs;
  const rassDelta = delta.rass;

  return {
    evaluationTime: SOFA_TEST_PACK_EVALUATION_TIME,
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
        : {
            value: rassDelta?.value ?? 0,
            effectiveTime: horarioDoDocumento(rassDelta?.observed ?? PANEL_OBSERVED.rass),
            provenance: PROCEDENCIA,
          },
    sedativeExposure: sedative,
    creatinine: deltaParaQuantidades(delta.creatinine, PANEL_OBSERVED.creatinine, 0.8, "mg/dL"),
    urineOutput24h,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new Error(`test pack SOFA: campo "${path}" deveria ser string`);
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
 *
 * Os 3 vetores APOSENTADOS são carregados como registro histórico (sem
 * `input`/`expected` executáveis) e o `vectors` do test pack carrega
 * SOMENTE os 38 ativos.
 */
export function parseSofaTestPack(
  rawJson: string,
  options: { readonly setId: string; readonly standard: string },
): SofaTestPack {
  const parsed: unknown = JSON.parse(rawJson);
  if (!isRecord(parsed)) {
    throw new Error("test pack SOFA: o JSON de vetores deve ser um objeto");
  }

  const provenance = isRecord(parsed.provenance) ? parsed.provenance : {};
  const rawVectors = parsed.vectors;
  if (!Array.isArray(rawVectors)) {
    throw new Error('test pack SOFA: campo "vectors" ausente ou não é lista');
  }

  const todos: SofaTestVector[] = rawVectors.map((entry: unknown, index): SofaTestVector => {
    if (!isRecord(entry)) {
      throw new Error(`test pack SOFA: vetor no índice ${index} não é objeto`);
    }
    const id = requireString(entry.id, `vectors[${index}].id`);
    const retired = entry.retired === true;
    if (retired) {
      // Vetor aposentado: registro histórico — sem input/desfecho executável.
      return {
        id,
        description: requireString(entry.description, `vectors[${index}].description`),
        sourceSection: requireString(entry.source_section, `vectors[${index}].source_section`),
        retired: true,
        supersededBy: typeof entry.superseded_by === "string" ? entry.superseded_by : null,
        input: null,
        expected: null,
      };
    }
    if (!isRecord(entry.expected)) {
      throw new Error(`test pack SOFA: vetor "${id}" sem bloco "expected"`);
    }
    const delta = isRecord(entry.delta) ? (entry.delta as SofaVectorDelta) : {};
    return {
      id,
      description: requireString(entry.description, `vectors[${index}].description`),
      sourceSection: requireString(entry.source_section, `vectors[${index}].source_section`),
      retired: false,
      supersededBy: null,
      input: expandSofaVector(delta),
      expected: entry.expected as unknown as SofaExpectedOutcome,
    };
  });

  if (todos.length === 0) {
    throw new Error("test pack SOFA: conjunto vazio — nada a pinar");
  }

  const ativos = todos.filter((v) => !v.retired);
  if (ativos.length === 0) {
    throw new Error("test pack SOFA: nenhum vetor ATIVO executável no conjunto");
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
    evaluationTime: SOFA_TEST_PACK_EVALUATION_TIME,
    activeVectorCount: ativos.length,
    retiredVectorIds: todos.filter((v) => v.retired).map((v) => v.id),
    vectors: ativos,
  };
}
