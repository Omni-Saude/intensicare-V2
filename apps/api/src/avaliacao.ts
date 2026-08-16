/**
 * apps/api/src/avaliacao.ts — adaptador da avaliação REAL (integração
 * SPR-G7-2). O stub ilustrativo anterior ("INTEGRAÇÃO PENDENTE") foi
 * REMOVIDO: a avaliação agora é `evaluateNews2` de
 * `@intensicare/kernel-clinico` (RULE-NEWS2 0.2.0 — cinco estados da
 * ADR-0008, política de insumo ausente classe 1 da ADR-0026, gate
 * populacional fail-closed da ADR-0027). Este módulo apenas TRADUZ:
 * contrato pt-BR ↔ vocabulário do kernel; nenhuma regra clínica vive aqui.
 *
 * PREMISSA (reversível, GDEC-0015/0017): a borda de ingestão aplica ALIAS
 * de unidade (identidade, sem conversão numérica — ex.: "bpm" → "/min",
 * "mmHg" → "mm[Hg]") para a UCUM normativa da spec; unidade fora da tabela
 * de alias segue verbatim ao kernel e falha alto (`unmappable_unit`).
 *
 * PREMISSA (reversível, GDEC-0015/0017): qualidade de fonte "unknown"
 * (M4, sinal ausente) é apresentada ao kernel como "quarantined" —
 * fail-closed: fonte sem sinal de qualidade jamais contribui a escore.
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este módulo.
 */
import type {
  BandaRisco,
  ContribuicaoParametro,
  ContextoAvaliacaoPaciente,
  ParametroClinico,
  ResultadoAvaliacao,
  StatusAvaliacao,
} from "@intensicare/contratos";
import {
  evaluateNews2,
  type EvaluationRecord,
  type EvaluationStatus,
  type News2ParameterId,
  type ObservationInput,
  type RiskTier,
  type SourceDataQuality,
} from "@intensicare/kernel-clinico";
import { SYNTHETIC_CONCEPTS } from "@intensicare/fixtures-sinteticas";
import type { ClinicalObservationRow } from "@intensicare/persistencia";

// ---------------------------------------------------------------------------
// Vocabulários: contrato pt-BR ↔ kernel ↔ conceitos persistidos
// ---------------------------------------------------------------------------

export const PARAM_TO_KERNEL: Readonly<Record<ParametroClinico, News2ParameterId>> = {
  FR: "rr",
  SpO2: "spo2",
  FluxoO2: "o2_status",
  PAS: "sbp",
  FC: "pulse",
  NivelConsciencia: "consciousness",
  Temperatura: "temperature",
};

export const KERNEL_TO_PARAM: Readonly<Record<News2ParameterId, ParametroClinico>> = {
  rr: "FR",
  spo2: "SpO2",
  o2_status: "FluxoO2",
  sbp: "PAS",
  pulse: "FC",
  consciousness: "NivelConsciencia",
  temperature: "Temperatura",
};

/** Conceito sintético persistido por parâmetro do contrato (SYNTH- por política). */
export const PARAM_TO_CONCEPT: Readonly<Record<ParametroClinico, string>> = {
  FR: SYNTHETIC_CONCEPTS.respiratoryRate,
  SpO2: SYNTHETIC_CONCEPTS.oxygenSaturation,
  FC: SYNTHETIC_CONCEPTS.heartRate,
  PAS: SYNTHETIC_CONCEPTS.systolicBloodPressure,
  Temperatura: SYNTHETIC_CONCEPTS.temperature,
  FluxoO2: "SYNTH-CONCEPT-O2-FLOW",
  NivelConsciencia: "SYNTH-CONCEPT-CONSCIOUSNESS",
};

const CONCEPT_TO_KERNEL: Readonly<Record<string, News2ParameterId>> = Object.fromEntries(
  (Object.entries(PARAM_TO_CONCEPT) as [ParametroClinico, string][]).map(([param, concept]) => [
    concept,
    PARAM_TO_KERNEL[param],
  ]),
);

/** UCUM normativa por parâmetro do kernel (spec §2.1; FluxoO2 = insumo de derivação). */
const KERNEL_UCUM_UNIT: Readonly<Partial<Record<News2ParameterId, string>>> = {
  rr: "/min",
  spo2: "%",
  sbp: "mm[Hg]",
  pulse: "/min",
  temperature: "Cel",
  o2_status: "L/min",
};

/** Aliases de unidade (identidade — nunca conversão numérica). */
const UNIT_ALIASES: Readonly<Partial<Record<News2ParameterId, readonly string[]>>> = {
  rr: ["rpm", "irpm", "/min"],
  spo2: ["%"],
  sbp: ["mmHg", "mm[Hg]"],
  pulse: ["bpm", "/min"],
  temperature: ["Cel", "°C"],
  o2_status: ["L/min", "l/min"],
};

/**
 * Unidade UCUM canônica para um par (parâmetro, unidade de origem) — ou
 * `undefined` quando a unidade não tem alias conhecido (segue verbatim ao
 * kernel, que falha alto com `unmappable_unit`; jamais descartada).
 */
export function canonicalUnitFor(parameter: News2ParameterId, sourceUnit: string): string | undefined {
  const aliases = UNIT_ALIASES[parameter];
  if (aliases !== undefined && aliases.includes(sourceUnit)) {
    return KERNEL_UCUM_UNIT[parameter];
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Linha do banco → observação do kernel
// ---------------------------------------------------------------------------

function toKernelQuality(quality: string): SourceDataQuality {
  if (quality === "valid" || quality === "warning" || quality === "quarantined") return quality;
  // "unknown" (ou qualquer valor imprevisto): fail-closed — ver premissa no topo.
  return "quarantined";
}

/**
 * Converte uma observação persistida em insumo do kernel. Retorna `null`
 * apenas quando o conceito não é um parâmetro do NEWS2 (não é insumo desta
 * regra) — nunca para "salvar" uma avaliação.
 */
export function toKernelObservation(row: ClinicalObservationRow): ObservationInput | null {
  const parameter = CONCEPT_TO_KERNEL[row.concept];
  if (parameter === undefined) return null;

  const effectiveTime = row.effectiveAt.kind === "present" ? row.effectiveAt.instant.utc : null;

  if (row.sourceCode !== null) {
    return {
      parameter,
      value: { kind: "code", code: row.sourceCode },
      effectiveTime,
      provenance: { sourceSystem: "SYNTH-api", sourceDataQuality: toKernelQuality(row.quality) },
    };
  }

  const value = row.canonicalValue ?? row.sourceValue;
  const unit =
    row.canonicalUnit ??
    (row.sourceUnit !== null ? canonicalUnitFor(parameter, row.sourceUnit) ?? row.sourceUnit : "");
  return {
    parameter,
    value: { kind: "quantity", value: value ?? Number.NaN, unit },
    effectiveTime,
    provenance: { sourceSystem: "SYNTH-api", sourceDataQuality: toKernelQuality(row.quality) },
  };
}

// ---------------------------------------------------------------------------
// Avaliação real + tradução para o contrato
// ---------------------------------------------------------------------------

/** Avalia NEWS2 (kernel REAL) sobre as observações persistidas de um encontro. */
export function evaluateEncounter(
  rows: readonly ClinicalObservationRow[],
  contexto: ContextoAvaliacaoPaciente | undefined,
  evaluationTimeIso: string,
): EvaluationRecord {
  const observations = rows
    .map(toKernelObservation)
    .filter((obs): obs is ObservationInput => obs !== null);

  const idade = contexto?.idadeAnos;
  return evaluateNews2({
    evaluationTime: evaluationTimeIso,
    age: typeof idade === "number" ? { kind: "verified", years: idade } : { kind: "unknown" },
    pregnancy: contexto?.gravidezDocumentada === true ? "documented" : "not_documented",
    observations,
  });
}

const STATUS_MAP: Readonly<Record<EvaluationStatus, StatusAvaliacao>> = {
  valid: "valido",
  partial: "parcial",
  not_evaluated: "indisponivel",
  stale: "desatualizado",
  invalid: "invalido",
};

/**
 * Mapeia o status do kernel para o contrato. Para NEWS2, `partial` é
 * INALCANÇÁVEL (decisão N-8/GDEC-0007 — permanente); se algum dia surgisse
 * seria defeito do kernel, e este mapeamento degrada fail-closed para
 * `indisponivel` — a API integrada JAMAIS produz `parcial` para NEWS2
 * (correção da revisão única SPR-G7-2, item 3; `parcial` fica reservado às
 * classes 2+ do ADR-0026).
 */
export function mapStatusNews2(status: EvaluationStatus): StatusAvaliacao {
  if (status === "partial") return "indisponivel";
  return STATUS_MAP[status];
}

const TIER_MAP: Readonly<Record<RiskTier, BandaRisco>> = {
  low: "normal",
  low_medium: "atencao",
  medium: "alerta",
  high: "critico",
};

export function mapTier(tier: RiskTier | null): BandaRisco | null {
  return tier === null ? null : TIER_MAP[tier];
}

/** Traduz o registro do kernel para o `ResultadoAvaliacao` do contrato. */
export function toResultadoAvaliacao(record: EvaluationRecord): ResultadoAvaliacao {
  const status = mapStatusNews2(record.status);
  const valido = status === "valido";

  const parametros: ContribuicaoParametro[] = record.parameters.map((c) => ({
    parametro: KERNEL_TO_PARAM[c.parameter],
    presente: c.valueUsed !== null,
    ...(c.valueUsed?.kind === "quantity" ? { valor: c.valueUsed.value, unidade: c.valueUsed.unit } : {}),
    ...(c.valueUsed?.kind === "code" ? { codigo: c.valueUsed.code } : {}),
    ...(c.score !== null ? { pontos: c.score } : {}),
    statusParametro: c.status,
    motivo: c.reason,
    coletadoEm: c.effectiveTime,
    explicacao: c.explanation,
  }));

  return {
    status,
    parametrosAusentes: record.missingInputs.map((p) => KERNEL_TO_PARAM[p]),
    parametros,
    escore: valido ? record.totalScore : null,
    banda: valido ? mapTier(record.riskTier) : null,
    avaliadoEm: record.evaluationTime,
    motivos: [...record.reasons],
    anotacoes: [...record.annotations],
    explicacao: record.explanation,
    parametroVermelho: record.redParameter,
    versaoRegra: `${record.ruleId}@${record.ruleVersion}`,
  };
}

/**
 * Condição de criação de alerta durável: avaliação VÁLIDA cuja banda
 * consultiva atinge condição de exibição de escalonamento (`fires`, spec
 * §4.2) e sem ordem de limitação terapêutica suprimindo exibição.
 * Semântica consultiva: o alerta comunica, jamais decide (ADR-0009 W12).
 */
export function requerAlerta(record: EvaluationRecord): boolean {
  return record.status === "valid" && record.fires && !record.escalationSuppressed;
}
