/**
 * packages/observabilidade/src/redaction.ts — redação de PHI imposta pelo
 * TIPO, não por convenção.
 *
 * SOURCE (prompt §9.4): a topologia candidata exige "OpenTelemetry-compatible
 * metrics, traces, logs, and synthetic end-to-end safety probes with strict
 * PHI redaction". SOURCE (ADR-0020 O3): "Logs/traces/métricas carregam apenas
 * identificadores opacos (IDs internos), nunca payload clínico, nome,
 * documento ou identificador de paciente".
 *
 * Por que TIPO e não convenção
 * -----------------------------
 * Uma convenção ("não coloque PHI em log") é verificada por revisão humana e
 * falha silenciosamente sob pressa. Aqui o valor bruto não é ATRIBUÍVEL a
 * nenhuma superfície de telemetria: `TelemetryAttributeValue` é uma união de
 * tipos marcados (branded) cujos únicos construtores são os desta unidade —
 * `label()` (vocabulário FECHADO), `ruleRef()` (padrão estrito),
 * `opaqueRef()` (hash salgado, não reversível), `count()`, `depth()`,
 * `durationMs()`, `flag()`. Um `string` cru não compila.
 *
 * Limite honesto desta técnica (não superestimar)
 * -----------------------------------------------
 * O tipo impede o acidente, não o ato deliberado: quem escrever
 * `durationMs(spo2)` ou `label(valorClinico as ControlledLabel)` derrota
 * qualquer sistema de tipos. Por isso há TRÊS camadas, e nenhuma delas é
 * apresentada como suficiente sozinha:
 *   1. tipo marcado (bloqueia o acidente, em tempo de compilação);
 *   2. varredura de forma de PHI em tempo de execução sobre TODA string que
 *      entra em atributo/evento/log (bloqueia o valor de forma conhecida);
 *   3. chaves de atributo proibidas + exigência de sufixo `.ref` com valor
 *      opaco (bloqueia o vazamento por nome de campo).
 * Nenhuma delas prova ausência de PHI em produção — isso exige revisão
 * humana da telemetria real e ambiente real (ver
 * docs/13-operations-and-reliability/README.md, dimensão D12).
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este módulo.
 */

import { createHash, randomBytes } from "node:crypto";
import { WORK_ITEM_STATES, type WorkItemState } from "@intensicare/dominio";

// ---------------------------------------------------------------------------
// 1. Tipos marcados (brands) — a redação como TIPO
// ---------------------------------------------------------------------------

/**
 * Marca estrutural aplicada aos valores que a telemetria aceita. O campo
 * nunca existe em tempo de execução; ele existe apenas para que um `string`
 * ou `number` cru NÃO seja atribuível a `TelemetryAttributeValue`.
 */
type TelemetrySafe<Base, Kind extends string> = Base & {
  readonly __intensicareTelemetrySafe: Kind;
};

/** Rótulo de vocabulário fechado (estado, categoria, etapa...). */
export type SafeLabel = TelemetrySafe<string, "label">;

/**
 * Referência opaca e não reversível a um identificador interno. Forma de
 * execução: `op_` + 16 hex. A forma é verificável em runtime — é assim que a
 * regra do sufixo `.ref` (§3 abaixo) consegue exigir opacidade mesmo depois
 * de o brand ser apagado pela compilação.
 */
export type OpaqueRef = TelemetrySafe<string, "opaque-ref">;

/** Contagem inteira (pode ser negativa em instrumento `up_down_counter`). */
export type SafeCount = TelemetrySafe<number, "count">;

/** Profundidade/tamanho de fila — inteiro não negativo. */
export type SafeDepth = TelemetrySafe<number, "depth">;

/** Duração em milissegundos — finita e não negativa. */
export type SafeDurationMs = TelemetrySafe<number, "duration-ms">;

/** Booleano estrutural (nunca um achado clínico). */
export type SafeFlag = TelemetrySafe<boolean, "flag">;

export type TelemetryAttributeValue =
  | SafeLabel
  | OpaqueRef
  | SafeCount
  | SafeDepth
  | SafeDurationMs
  | SafeFlag;

export type TelemetryAttributes = Readonly<Record<string, TelemetryAttributeValue>>;

/** Valor numérico aceito por um histograma. */
export type SafeMeasurement = SafeDurationMs | SafeDepth | SafeCount;

// ---------------------------------------------------------------------------
// 2. Vocabulários fechados — o único texto que a telemetria pode carregar
// ---------------------------------------------------------------------------

/** Cinco estados de avaliação da ADR-0008 (vocabulário do kernel). */
export const EVALUATION_STATUS_LABELS = [
  "valid",
  "partial",
  "not_evaluated",
  "stale",
  "invalid",
] as const;

/**
 * Parâmetros do NEWS2 pelo NOME do parâmetro — o nome do parâmetro NÃO é PHI;
 * o VALOR dele é. Este vocabulário existe para permitir "taxa de insumo
 * ausente por parâmetro" sem jamais transportar a medida.
 */
export const CLINICAL_PARAMETER_LABELS = [
  "FR",
  "SpO2",
  "FluxoO2",
  "PAS",
  "FC",
  "NivelConsciencia",
  "Temperatura",
] as const;

/** Etapas de latência do prompt §15.3 (dimensões D01–D04). */
export const PIPELINE_STAGES = [
  "source_to_accepted",
  "accepted_to_evaluation",
  "evaluation_to_durable_work_item",
  "generated_to_visible",
  "generated_to_acknowledged",
] as const;

/**
 * Categorias de falha (dimensão D05/D08/D09/D10 do §15.3). Fechado de
 * propósito: uma categoria nova é uma decisão de operação, não um literal
 * improvisado no ponto de emissão.
 */
export const FAILURE_CATEGORIES = [
  "ingest_rejected",
  "persistence_failure",
  "rule_load_failure",
  "rule_evaluation_failure",
  "outbox_publish_failure",
  "projection_rebuild_failure",
  "delivery_failure",
  "dependency_unavailable",
  "contract_drift",
  "authorization_denied",
  "cross_tenant_denied",
  "telemetry_dropped",
  "probe_failure",
  "backup_failure",
  "restore_integrity_failure",
  "evidence_export_integrity_failure",
] as const;

/** Níveis de degradação do DOM-0007 combinados com os domínios do ADR-0020 O5. */
export const DEGRADATION_DOMAINS = [
  "dependency",
  "rule",
  "freshness",
  "event",
  "projection",
  "delivery",
  "telemetry",
] as const;

/** Estado de disponibilidade de um bundle de regra clínica (ADR-0007). */
export const RULE_AVAILABILITY_LABELS = [
  "active",
  "killed",
  "rolled_back",
  "load_failed",
  "unknown",
] as const;

/** Desfecho de uma sonda sintética (prompt §9.4). */
export const PROBE_OUTCOMES = ["passed", "failed", "skipped"] as const;

/** Tipos de negativa de política (dimensão D09). */
export const POLICY_DENIAL_KINDS = [
  "cross_tenant",
  "missing_scope",
  "expired_session",
  "suspicious_access",
] as const;

/** Veredito de prontidão (dimensão D11 — capacidade segura, não liveness). */
export const READINESS_VERDICT_LABELS = ["ready", "degraded", "not_ready"] as const;

/** Canal em que uma degradação foi tornada visível (D12). */
export const SURFACE_CHANNELS = ["api_contract", "ui", "operational_console"] as const;

/**
 * Identidade dos modos degradados. Vive aqui, e não em `degradation.ts`, para
 * que o vocabulário de telemetria não dependa do catálogo (o inverso é que
 * vale: `DEGRADATION_MODES` é obrigado a cobrir exatamente esta lista, sob
 * pena de não compilar).
 */
export const DEGRADATION_MODE_LABELS = [
  "regra_clinica_desligada",
  "projecao_atrasada",
  "outbox_acumulando",
  "entrega_tempo_real_indisponivel",
  "insumo_sem_frescor",
  "dependencia_indisponivel",
  "telemetria_indisponivel",
] as const;

/** Desfechos binários de execução operacional (backup, restore, exportação). */
export const OUTCOME_LABELS = ["success", "failure"] as const;

/**
 * Projeções de leitura existentes na fatia (ADR-0011). Fechado: uma projeção
 * nova é uma decisão de arquitetura, e o nome dela vira cardinalidade de
 * série temporal.
 */
export const PROJECTION_LABELS = ["grade_leitos", "avaliacoes_paciente", "fluxo_eventos"] as const;

export type EvaluationStatusLabel = (typeof EVALUATION_STATUS_LABELS)[number];
export type ClinicalParameterLabel = (typeof CLINICAL_PARAMETER_LABELS)[number];
export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export type FailureCategory = (typeof FAILURE_CATEGORIES)[number];
export type DegradationDomain = (typeof DEGRADATION_DOMAINS)[number];
export type RuleAvailabilityLabel = (typeof RULE_AVAILABILITY_LABELS)[number];
export type ProbeOutcome = (typeof PROBE_OUTCOMES)[number];
export type PolicyDenialKind = (typeof POLICY_DENIAL_KINDS)[number];
export type ReadinessVerdictLabel = (typeof READINESS_VERDICT_LABELS)[number];
export type SurfaceChannel = (typeof SURFACE_CHANNELS)[number];
export type DegradationModeLabel = (typeof DEGRADATION_MODE_LABELS)[number];
export type OutcomeLabel = (typeof OUTCOME_LABELS)[number];
export type ProjectionLabel = (typeof PROJECTION_LABELS)[number];

/**
 * União de TODO texto que a telemetria pode carregar. Os estados de item de
 * trabalho vêm de `@intensicare/dominio` de propósito: o vocabulário de
 * telemetria não pode divergir do vocabulário de domínio — se a ADR-0009
 * mudar a máquina de estados, este módulo deixa de compilar, que é o
 * comportamento desejado.
 */
export type ControlledLabel =
  | WorkItemState
  | EvaluationStatusLabel
  | ClinicalParameterLabel
  | PipelineStage
  | FailureCategory
  | DegradationDomain
  | RuleAvailabilityLabel
  | ProbeOutcome
  | PolicyDenialKind
  | ReadinessVerdictLabel
  | SurfaceChannel
  | DegradationModeLabel
  | OutcomeLabel
  | ProjectionLabel;

const CONTROLLED_LABELS: ReadonlySet<string> = new Set<string>([
  ...WORK_ITEM_STATES,
  ...EVALUATION_STATUS_LABELS,
  ...CLINICAL_PARAMETER_LABELS,
  ...PIPELINE_STAGES,
  ...FAILURE_CATEGORIES,
  ...DEGRADATION_DOMAINS,
  ...RULE_AVAILABILITY_LABELS,
  ...PROBE_OUTCOMES,
  ...POLICY_DENIAL_KINDS,
  ...READINESS_VERDICT_LABELS,
  ...SURFACE_CHANNELS,
  ...DEGRADATION_MODE_LABELS,
  ...OUTCOME_LABELS,
  ...PROJECTION_LABELS,
]);

// ---------------------------------------------------------------------------
// 3. Varredura de forma de PHI (camada 2) e chaves proibidas (camada 3)
// ---------------------------------------------------------------------------

export type RedactionErrorKind =
  | "phi_shaped_value"
  | "unknown_label"
  | "forbidden_attribute_key"
  | "opaque_ref_expected"
  | "invalid_measurement"
  | "invalid_rule_ref";

/**
 * Erro de redação. A mensagem NUNCA ecoa o valor ofensor — ecoar o valor
 * moveria o PHI do log de telemetria para o log de erro, que é o mesmo
 * vazamento com outro nome (mesma disciplina de `scripts/check_forbidden_content.py`,
 * que redige o excerto que reporta).
 */
export class TelemetryRedactionError extends Error {
  readonly kind: RedactionErrorKind;
  readonly attributeKey: string | null;
  readonly patternId: string | null;

  constructor(
    kind: RedactionErrorKind,
    detalhe: string,
    attributeKey: string | null = null,
    patternId: string | null = null,
  ) {
    super(`Telemetria recusada (${kind}): ${detalhe}`);
    this.name = "TelemetryRedactionError";
    this.kind = kind;
    this.attributeKey = attributeKey;
    this.patternId = patternId;
  }
}

/**
 * Formas conhecidas de identificador/PHI. Toda string que entra em telemetria
 * é varrida contra estas formas — inclusive as sintéticas: um PSR sintético
 * (`amh:psr:v1:SYNTH-...`) é bloqueado exatamente como um real, porque a
 * regra é "nenhum identificador de sujeito atravessa", não "nenhum
 * identificador REAL atravessa" (do contrário o teste de não-vazamento seria
 * inexecutável sem dado real).
 */
export const PHI_SHAPED_PATTERNS: readonly { readonly id: string; readonly pattern: RegExp }[] = [
  { id: "portable_subject_ref", pattern: /amh:psr:v[0-9]+:/i },
  { id: "subject_marker", pattern: /\bSYNTH-[A-Z0-9]*(PACIENTE|PATIENT|SUBJECT|PSR)/i },
  { id: "cpf_shaped", pattern: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/ },
  { id: "long_digit_run", pattern: /\d{8,}/ },
  {
    id: "uuid_shaped",
    pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  },
  { id: "email_shaped", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { id: "iso_instant", pattern: /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/ },
];

/**
 * Chaves de atributo proibidas por NOME. Conjunto de correspondência exata
 * (mais previsível que regex ampla) mais três sufixos que indicam valor cru.
 * Um vazamento por nome de campo é tão real quanto por valor: `spo2=94` não
 * precisa de forma de PHI para ser um dado clínico bruto em métrica.
 */
export const FORBIDDEN_ATTRIBUTE_KEYS: ReadonlySet<string> = new Set([
  "value",
  "valor",
  "score",
  "escore",
  "spo2",
  "fr",
  "fc",
  "pas",
  "pulse",
  "temperature",
  "temperatura",
  "respiratory_rate",
  "heart_rate",
  "systolic",
  "observation_value",
  "patient",
  "paciente",
  "paciente_ref",
  "subject",
  "psr",
  "cpf",
  "name",
  "nome",
  "email",
  "payload",
  "body",
  "note",
  "anotacao",
  "detail",
  "detalhe",
]);

const FORBIDDEN_KEY_SUFFIXES = [".value", ".valor", ".raw", ".bruto", ".payload"] as const;

/** Forma de execução de uma referência opaca (o brand não sobrevive à compilação). */
const OPAQUE_REF_SHAPE = /^op_[0-9a-f]{16}$/;

/** Toda chave terminada em `.ref` DEVE carregar uma referência opaca. */
const REF_KEY_SUFFIX = ".ref";

/**
 * Varre uma string contra as formas conhecidas de PHI/identificador e lança
 * se alguma casar. Exportada porque a fronteira de emissão não é o único
 * lugar onde vale a pena varrer (uma sonda sintética também varre o que
 * pretende publicar antes de publicar).
 */
export function assertNoPhiShape(value: string, attributeKey: string | null = null): void {
  for (const { id, pattern } of PHI_SHAPED_PATTERNS) {
    if (pattern.test(value)) {
      throw new TelemetryRedactionError(
        "phi_shaped_value",
        `valor com forma de identificador/PHI ("${id}") recusado antes de qualquer emissão; ` +
          "o valor NÃO é reproduzido nesta mensagem por política (ADR-0020 O3)",
        attributeKey,
        id,
      );
    }
  }
}

function assertAttributeKeyAllowed(key: string): void {
  const normalized = key.trim().toLowerCase();
  if (normalized.length === 0) {
    throw new TelemetryRedactionError("forbidden_attribute_key", "chave vazia", key);
  }
  if (FORBIDDEN_ATTRIBUTE_KEYS.has(normalized)) {
    throw new TelemetryRedactionError(
      "forbidden_attribute_key",
      "nome de chave reservado a dado clínico bruto ou identificador de sujeito",
      key,
    );
  }
  for (const suffix of FORBIDDEN_KEY_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      throw new TelemetryRedactionError(
        "forbidden_attribute_key",
        `sufixo "${suffix}" indica valor cru — use um rótulo de vocabulário fechado ou uma referência opaca`,
        key,
      );
    }
  }
}

/**
 * Validação de TODO conjunto de atributos, aplicada por cada superfície de
 * emissão (métrica, span, evento de span, log). Fail-closed: um atributo que
 * esta função não sabe validar é recusado, não deixado passar.
 */
export function assertSafeAttributes(attributes: TelemetryAttributes | undefined): void {
  if (attributes === undefined) return;
  for (const [key, raw] of Object.entries(attributes)) {
    assertAttributeKeyAllowed(key);
    const value: unknown = raw;
    if (typeof value === "boolean") continue;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new TelemetryRedactionError(
          "invalid_measurement",
          "valor numérico não finito em atributo",
          key,
        );
      }
      continue;
    }
    if (typeof value !== "string") {
      throw new TelemetryRedactionError(
        "forbidden_attribute_key",
        `tipo de valor não suportado (${typeof value}) — telemetria aceita apenas rótulo, referência opaca, número e booleano`,
        key,
      );
    }
    if (key.toLowerCase().endsWith(REF_KEY_SUFFIX) && !OPAQUE_REF_SHAPE.test(value)) {
      throw new TelemetryRedactionError(
        "opaque_ref_expected",
        `chave terminada em "${REF_KEY_SUFFIX}" exige referência opaca (opaqueRef), não texto`,
        key,
      );
    }
    if (OPAQUE_REF_SHAPE.test(value)) continue;
    assertNoPhiShape(value, key);
    if (!CONTROLLED_LABELS.has(value) && !RULE_REF_SHAPE.test(value)) {
      throw new TelemetryRedactionError(
        "unknown_label",
        "texto fora do vocabulário fechado de telemetria — registre o rótulo em redaction.ts antes de emiti-lo",
        key,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Construtores — a ÚNICA porta de entrada de valor em telemetria
// ---------------------------------------------------------------------------

/** Rótulo de vocabulário fechado. Um texto livre não é atribuível a `ControlledLabel`. */
export function label(value: ControlledLabel): SafeLabel {
  if (!CONTROLLED_LABELS.has(value)) {
    // Alcançável apenas por `as`/`any` — defesa em profundidade, não decoração.
    throw new TelemetryRedactionError("unknown_label", "rótulo não registrado", null);
  }
  return value as SafeLabel;
}

/** Forma aceita para identidade de regra clínica: `RULE-XXX@1.2.3` (ADR-0007). */
const RULE_REF_SHAPE = /^[A-Z][A-Z0-9-]{1,31}@\d+\.\d+\.\d+$/;

/**
 * Identidade de bundle de regra como rótulo (dimensão D07 — saúde de rule
 * bundle). Não é PHI: é a versão do artefato que avaliou.
 */
export function ruleRef(ruleId: string, ruleVersion: string): SafeLabel {
  const composed = `${ruleId}@${ruleVersion}`;
  if (!RULE_REF_SHAPE.test(composed)) {
    throw new TelemetryRedactionError(
      "invalid_rule_ref",
      "identidade de regra fora da forma RULE-ID@semver",
      null,
    );
  }
  return composed as SafeLabel;
}

export interface RedactorOptions {
  /**
   * Sal do pseudônimo. PREMISSA (reversível, GDEC-0015/0017): o default é um
   * sal ALEATÓRIO POR PROCESSO — a referência opaca é então correlacionável
   * dentro de um processo e NÃO correlacionável entre processos ou entre
   * reinícios. Isso é deliberado: maximiza a minimização (ADR-0020 O3) ao
   * custo de correlação distribuída. Quando a correlação entre processos for
   * um requisito medido, o sal passa a ser um segredo gerido (matéria do
   * ADR-0017/ADR-0019) — não uma constante no código.
   */
  readonly salt?: string;
}

export interface Redactor {
  /** Pseudonimiza um identificador interno; a saída não é reversível sem o sal. */
  readonly opaqueRef: (raw: string) => OpaqueRef;
}

export function createRedactor(options: RedactorOptions = {}): Redactor {
  const salt = options.salt ?? randomBytes(32).toString("hex");
  return {
    opaqueRef(raw: string): OpaqueRef {
      if (raw.length === 0) {
        throw new TelemetryRedactionError(
          "opaque_ref_expected",
          "identificador vazio não produz referência opaca",
        );
      }
      const digest = createHash("sha256").update(`${salt}|${raw}`, "utf8").digest("hex");
      return `op_${digest.slice(0, 16)}` as OpaqueRef;
    },
  };
}

const defaultRedactor = createRedactor();

/**
 * Pseudonimiza usando o redator default do processo. Preferir um `Redactor`
 * explícito em teste (sal fixo) para tornar a asserção determinística.
 */
export function opaqueRef(raw: string): OpaqueRef {
  return defaultRedactor.opaqueRef(raw);
}

export function count(value: number): SafeCount {
  if (!Number.isInteger(value)) {
    throw new TelemetryRedactionError("invalid_measurement", "contagem deve ser inteira");
  }
  return value as SafeCount;
}

export function depth(value: number): SafeDepth {
  if (!Number.isInteger(value) || value < 0) {
    throw new TelemetryRedactionError(
      "invalid_measurement",
      "profundidade deve ser inteira e não negativa",
    );
  }
  return value as SafeDepth;
}

export function durationMs(value: number): SafeDurationMs {
  if (!Number.isFinite(value) || value < 0) {
    throw new TelemetryRedactionError(
      "invalid_measurement",
      "duração deve ser finita e não negativa",
    );
  }
  return value as SafeDurationMs;
}

export function flag(value: boolean): SafeFlag {
  return value as SafeFlag;
}

/** Verifica a forma de execução de uma referência opaca (usado por testes e sondas). */
export function isOpaqueRefShape(value: string): boolean {
  return OPAQUE_REF_SHAPE.test(value);
}
