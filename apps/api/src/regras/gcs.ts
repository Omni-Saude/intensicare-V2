/**
 * apps/api/src/regras/gcs.ts — provedor do RULE-GCS 0.2.0 para o
 * despachante (achado §6.4, P1).
 *
 * Este módulo TRADUZ: linha persistida ↔ vocabulário do avaliador GCS do
 * `@intensicare/kernel-clinico`. Nenhuma regra clínica vive aqui.
 *
 * O QUE ESTE MÓDULO DELIBERADAMENTE NÃO FAZ
 * -----------------------------------------
 * - NÃO cria banda de severidade para o GCS. O `GcsEvaluationRecord` não
 *   tem `riskTier` e a RULE-GCS 0.2.0 não define bandas; inventar uma seria
 *   conteúdo clínico normativo.
 * - NÃO mapeia GCS para ACVPU nem para qualquer parâmetro do NEWS2.
 * - NÃO inventa alerta: `GcsEvaluationRecord.fires` é do tipo literal
 *   `false` no kernel — a regra não define condição de disparo. O resultado
 *   pt-BR preserva isso como `disparo: false`.
 * - NÃO reaproveita `ResultadoAvaliacao` do contrato (que é modelado no
 *   NEWS2: tem `escore`, `banda`, `parametroVermelho` e `ParametroClinico`).
 *   O GCS tem tipo próprio, `ResultadoAvaliacaoGcs`, justamente para que
 *   nenhum campo de uma regra contamine a outra (requisito 6 do §6.4).
 *
 * PREMISSA (reversível, ADR-0026 classe 4): a RULE-GCS é enumeração de
 * instrumento único com "não testável" (NT) de primeira classe e SEM
 * parcial. `partial` é, portanto, inalcançável; se surgisse seria defeito
 * do kernel, e `mapStatusGcs` degrada fail-closed para `indisponivel` —
 * mesma disciplina já aplicada ao NEWS2 em `mapStatusNews2`.
 *
 * PREMISSA (reversível, ADR-0028): a exposição a sedativo NÃO está no
 * `ContextoAvaliacaoPaciente` do contrato. Na ausência de sinal explícito o
 * insumo entra como `"unknown"`, que é o valor MAIS CONSERVADOR do domínio
 * `SedativeExposureState` — nunca `"none_active"`, que afirmaria ausência
 * documentada de sedativo sem prova.
 *
 * Consequência VERIFICADA no kernel (gcs.ts §4.2–§4.4; ADR-0028 A28-1/A28-2/
 * A28-5), não presumida: `"unknown"` por si só não bloqueia. O gate resolve
 * pelo RASS pareado — RASS ausente/não pareado ⇒ `sedation_state_unknown`;
 * RASS ≤ GCS_SEDATION_RASS_THRESHOLD com exposição desconhecida ⇒
 * `sedation_confounded`; RASS acima do limiar ⇒ `testable`. Quem decide o
 * gate é a regra, não este adaptador.
 */
import type { ContextoAvaliacaoPaciente, StatusAvaliacao } from "@intensicare/contratos";
import {
  type EvaluationStatus,
  evaluateGcs,
  GCS_RULE_ID,
  GCS_RULE_VERSION,
  type GcsAssessabilityState,
  type GcsComponentContribution,
  type GcsComponentId,
  type GcsComponentObservationInput,
  type GcsComponentValue,
  type GcsEvaluationRecord,
  type GcsNoFireReason,
  type GcsNtReason,
  NT_REASON_LABEL_PT,
  type ParameterStatus,
  type RassObservationInput,
  type SedativeExposureState,
} from "@intensicare/kernel-clinico";
import type { ClinicalObservationRow } from "@intensicare/persistencia";
import { contentDigest } from "@intensicare/rule-bundle";
import { qualidadeParaKernel } from "../avaliacao.js";
import type { PortaDeBundle } from "./bundle.js";
import type { ProvedorDeRegra, VerificacaoDeMotor } from "./registro.js";
import { chaveRegra, type DigestDeEntradas, type IdentidadeRegra } from "./tipos.js";

/** Identidade versionada da regra, tomada do kernel — nunca redigitada. */
export const IDENTIDADE_GCS: IdentidadeRegra = {
  ruleId: GCS_RULE_ID,
  ruleVersion: GCS_RULE_VERSION,
};

/** Chave de registro do GCS: `RULE-GCS@0.2.0`. */
export const CHAVE_GCS = chaveRegra(IDENTIDADE_GCS);

/**
 * Conceitos sintéticos persistidos por componente. Identificadores INTERNOS
 * com prefixo `SYNTH-` (política de dados sintéticos) — não são vínculo
 * terminológico: não há LOINC/SNOMED aqui, e criar um seria mapeamento
 * terminológico, fora da autoridade deste serviço. Mesma forma já usada por
 * `PARAM_TO_CONCEPT` para `SYNTH-CONCEPT-O2-FLOW`/`-CONSCIOUSNESS`.
 */
export const CONCEITO_COMPONENTE_GCS: Readonly<Record<GcsComponentId, string>> = {
  eye: "SYNTH-CONCEPT-GCS-EYE",
  verbal: "SYNTH-CONCEPT-GCS-VERBAL",
  motor: "SYNTH-CONCEPT-GCS-MOTOR",
};

/** Conceito sintético da observação RASS pareada (ADR-0028). */
export const CONCEITO_RASS = "SYNTH-CONCEPT-RASS";

const CONCEITO_PARA_COMPONENTE: Readonly<Record<string, GcsComponentId>> = Object.fromEntries(
  (Object.entries(CONCEITO_COMPONENTE_GCS) as [GcsComponentId, string][]).map(
    ([componente, conceito]) => [conceito, componente],
  ),
);

/**
 * Conjunto GOVERNADO de razões de "não testável", lido do próprio kernel
 * (chaves de `NT_REASON_LABEL_PT`) — transcrição zero, invenção zero.
 */
const RAZOES_NT_GOVERNADAS: ReadonlySet<string> = new Set(Object.keys(NT_REASON_LABEL_PT));

function ehRazaoNt(codigo: string): codigo is GcsNtReason {
  return RAZOES_NT_GOVERNADAS.has(codigo);
}

// ---------------------------------------------------------------------------
// Linha persistida → insumo do kernel GCS
// ---------------------------------------------------------------------------

/**
 * Converte uma observação persistida em componente do GCS. `null` apenas
 * quando o conceito não é componente desta regra — nunca para "salvar" uma
 * avaliação.
 *
 * `sourceCode` é interpretado como razão de NT SOMENTE quando pertence ao
 * conjunto governado do kernel. Código fora do conjunto NÃO é traduzido
 * (traduzir seria inventar mapeamento): entra como quantidade não numérica
 * e o kernel o classifica `invalid` — fail-closed e visível, mesma
 * disciplina já usada para unidade inmapeável no NEWS2.
 */
export function toComponenteGcs(
  linha: ClinicalObservationRow,
): GcsComponentObservationInput | null {
  const componente = CONCEITO_PARA_COMPONENTE[linha.concept];
  if (componente === undefined) return null;

  const effectiveTime = linha.effectiveAt.kind === "present" ? linha.effectiveAt.instant.utc : null;
  const provenance = {
    sourceSystem: "SYNTH-api",
    sourceDataQuality: qualidadeParaKernel(linha.quality),
  };

  let value: GcsComponentValue;
  if (linha.sourceCode !== null && ehRazaoNt(linha.sourceCode)) {
    value = { kind: "not_testable", ntReason: linha.sourceCode };
  } else {
    const bruto = linha.canonicalValue ?? linha.sourceValue;
    const unidade = linha.canonicalUnit ?? linha.sourceUnit;
    value = {
      kind: "score",
      value: bruto ?? Number.NaN,
      ...(unidade !== null ? { unit: unidade } : {}),
    };
  }

  return { component: componente, value, effectiveTime, provenance };
}

/** Converte a observação RASS persistida em insumo pareado do kernel. */
export function toRassGcs(linha: ClinicalObservationRow): RassObservationInput | null {
  if (linha.concept !== CONCEITO_RASS) return null;
  const valor = linha.canonicalValue ?? linha.sourceValue;
  return {
    value: valor ?? Number.NaN,
    effectiveTime: linha.effectiveAt.kind === "present" ? linha.effectiveAt.instant.utc : null,
    provenance: {
      sourceSystem: "SYNTH-api",
      sourceDataQuality: qualidadeParaKernel(linha.quality),
    },
  };
}

export interface InsumoGcs {
  readonly observacoes: readonly ClinicalObservationRow[];
  readonly contexto: ContextoAvaliacaoPaciente | undefined;
  /** Ausente ⇒ `"unknown"` (fail-closed, ADR-0028). */
  readonly exposicaoSedativa?: SedativeExposureState | undefined;
  readonly ordemDeLimitacaoTerapeutica?: boolean | undefined;
}

/** Avalia GCS (kernel REAL) sobre as observações persistidas de um encontro. */
export function evaluateEncounterGcs(
  insumo: InsumoGcs,
  evaluationTimeIso: string,
): GcsEvaluationRecord {
  const components = insumo.observacoes
    .map(toComponenteGcs)
    .filter((c): c is GcsComponentObservationInput => c !== null);
  const rass = insumo.observacoes.map(toRassGcs).find((r): r is RassObservationInput => r !== null);
  const idade = insumo.contexto?.idadeAnos;

  return evaluateGcs({
    evaluationTime: evaluationTimeIso,
    age: typeof idade === "number" ? { kind: "verified", years: idade } : { kind: "unknown" },
    components,
    rass: rass ?? null,
    sedativeExposure: insumo.exposicaoSedativa ?? "unknown",
    ...(insumo.ordemDeLimitacaoTerapeutica !== undefined
      ? { treatmentLimitationOrderDocumented: insumo.ordemDeLimitacaoTerapeutica }
      : {}),
  });
}

// ---------------------------------------------------------------------------
// Registro do kernel → resultado pt-BR PRÓPRIO do GCS
// ---------------------------------------------------------------------------

const STATUS_MAP_GCS: Readonly<Record<EvaluationStatus, StatusAvaliacao>> = {
  valid: "valido",
  partial: "parcial",
  not_evaluated: "indisponivel",
  stale: "desatualizado",
  invalid: "invalido",
};

/** Ver PREMISSA ADR-0026 classe 4 no cabeçalho: `partial` é inalcançável. */
export function mapStatusGcs(status: EvaluationStatus): StatusAvaliacao {
  if (status === "partial") return "indisponivel";
  return STATUS_MAP_GCS[status];
}

/** Contribuição pt-BR de um componente. Não há pontuação de banda: só valor. */
export interface ContribuicaoComponenteGcs {
  componente: GcsComponentId;
  statusComponente: ParameterStatus;
  valor: number | null;
  motivoNaoTestavel: GcsNtReason | null;
  /** Rótulo pt-BR do kernel (`NT_REASON_LABEL_PT`) — nunca redigido aqui. */
  motivoNaoTestavelPt: string | null;
  motivo: string | null;
  coletadoEm: string | null;
  idadeMinutos: number | null;
  explicacao: string;
}

/**
 * Resultado pt-BR do GCS. Sem `escore`, sem `banda`, sem
 * `parametroVermelho`: esses campos são do NEWS2 e não têm contraparte
 * definida na RULE-GCS 0.2.0.
 */
export interface ResultadoAvaliacaoGcs {
  status: StatusAvaliacao;
  /** `null` sempre que `status !== "valido"` — nunca um número por omissão. */
  total: number | null;
  componentes: ContribuicaoComponenteGcs[];
  avaliabilidade: GcsAssessabilityState;
  rassPareado: number | null;
  componentesNaoTestaveis: GcsComponentId[];
  componentesAusentes: GcsComponentId[];
  /** Ex.: `E4 V-NT(intubação endotraqueal) M6` — string do kernel. */
  exibicaoComponentes: string;
  avaliadoEm: string;
  motivos: string[];
  motivoPrincipal: string | null;
  anotacoes: string[];
  explicacao: string;
  /** A RULE-GCS 0.2.0 não define condição de disparo. Sempre `false`. */
  disparo: false;
  motivoNaoDisparo: GcsNoFireReason;
  versaoRegra: string;
}

export function toResultadoAvaliacaoGcs(registro: GcsEvaluationRecord): ResultadoAvaliacaoGcs {
  const status = mapStatusGcs(registro.status);
  const valido = status === "valido";

  const componentes: ContribuicaoComponenteGcs[] = registro.components.map(
    (c: GcsComponentContribution) => ({
      componente: c.component,
      statusComponente: c.status,
      valor: c.value,
      motivoNaoTestavel: c.ntReason,
      motivoNaoTestavelPt: c.ntReason === null ? null : NT_REASON_LABEL_PT[c.ntReason],
      motivo: c.reason,
      coletadoEm: c.effectiveTime,
      idadeMinutos: c.ageMinutes,
      explicacao: c.explanation,
    }),
  );

  return {
    status,
    total: valido ? registro.total : null,
    componentes,
    avaliabilidade: registro.assessability,
    rassPareado: registro.pairedRass,
    componentesNaoTestaveis: [...registro.notTestableComponents],
    componentesAusentes: [...registro.missingComponents],
    exibicaoComponentes: registro.componentDisplay,
    avaliadoEm: registro.evaluationTime,
    motivos: [...registro.reasons],
    motivoPrincipal: registro.primaryReason,
    anotacoes: [...registro.annotations],
    explicacao: registro.explanation,
    disparo: false,
    motivoNaoDisparo: registro.noFireReason,
    versaoRegra: `${registro.ruleId}@${registro.ruleVersion}`,
  };
}

export interface SaidaGcs {
  readonly registroKernel: GcsEvaluationRecord;
  readonly resultado: ResultadoAvaliacaoGcs;
}

export function digestDeEntradasGcs(insumo: InsumoGcs): DigestDeEntradas {
  const relevantes = insumo.observacoes.filter(
    (linha) =>
      CONCEITO_PARA_COMPONENTE[linha.concept] !== undefined || linha.concept === CONCEITO_RASS,
  );
  return {
    total: relevantes.length,
    digest: contentDigest({
      observacoes: relevantes.map((linha) => ({
        concept: linha.concept,
        sourceValue: linha.sourceValue,
        sourceUnit: linha.sourceUnit,
        sourceCode: linha.sourceCode,
        canonicalValue: linha.canonicalValue,
        canonicalUnit: linha.canonicalUnit,
        quality: linha.quality,
        effectiveAt: linha.effectiveAt.kind === "present" ? linha.effectiveAt.instant.utc : null,
      })),
      idadeConhecida: typeof insumo.contexto?.idadeAnos === "number",
      exposicaoSedativa: insumo.exposicaoSedativa ?? "unknown",
    }),
  };
}

/**
 * Cria o provedor do GCS.
 *
 * `verificarMotor` RECUSA sempre que o artefato pinar um `behaviorHash`:
 * `@intensicare/rule-bundle` não expõe `computeGcsBehaviorHash` — só existe
 * o do NEWS2 (`news2-bundle.ts`). Verificar comportamento de um motor sem o
 * verificador correspondente é impossível, e presumir conformidade seria o
 * defeito SF-2 de novo. Pedido de export registrado no handoff.
 */
export function criarProvedorGcs(opcoes: {
  readonly porta: PortaDeBundle;
}): ProvedorDeRegra<InsumoGcs, SaidaGcs> {
  return {
    identidade: IDENTIDADE_GCS,
    porta: opcoes.porta,

    verificarMotor(proveniencia): VerificacaoDeMotor {
      if (proveniencia.behaviorHash === null) {
        return {
          ok: false,
          esperado: "<ausente no artefato>",
          obtido: "<não verificável sem hash pinado>",
        };
      }
      return {
        ok: false,
        esperado: proveniencia.behaviorHash,
        obtido: "<rule-bundle não expõe verificador de comportamento para RULE-GCS>",
      };
    },

    digestDeEntradas: digestDeEntradasGcs,

    avaliar(insumo: InsumoGcs, instanteIso: string): SaidaGcs {
      const registroKernel = evaluateEncounterGcs(insumo, instanteIso);
      return { registroKernel, resultado: toResultadoAvaliacaoGcs(registroKernel) };
    },

    razoesDe(saida: SaidaGcs): readonly string[] {
      return saida.registroKernel.reasons;
    },
  };
}
