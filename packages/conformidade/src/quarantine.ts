/**
 * Vocabulário ENUMERADO de razões da camada anticorrupção.
 *
 * Procedência do vocabulário (declarada porque inventar token como se
 * existisse é o defeito que este repositório recusa)
 * ------------------------------------------------------------------
 * `cenarios-teste-consumidor.md` §2 diz que os tokens de razão citados
 * pelos cenários vêm de **ADR-0008 N3**, com `unspecified_condition` (N9)
 * como fallback total. Mas N3 governa razão de **status de AVALIAÇÃO**
 * (`missing_required_input`, `stale_input`, `expired`, ...), não razão de
 * **quarentena de envelope na fronteira**: nenhum token de N3 nomeia
 * "chave de idempotência ausente" ou "emissão anterior ao fato".
 *
 * PREMISSA (reversível, GDEC-0015/0017): os tokens abaixo são derivados
 * 1:1 das SEIS INVARIANTES do envelope
 * (`eventos-ciclo-de-vida-identidade.md` §2) e das regras de não-coerção
 * de `mapeamento-semantico.md` §7 — não são tokens de ADR-0008 N3 e não se
 * apresentam como tal. Toda condição não coberta cai no fallback total
 * `unspecified_condition` (N9), com a lacuna registrada. Consolidar este
 * vocabulário com o de N3 (ou publicá-lo no rule release) é decisão de
 * arquitetura pendente, não ajuste mecânico.
 */

export const QUARANTINE_REASONS = {
  /** Invariante 1 — identificador de fonte cru na fronteira (AQ-4/XRD-05). */
  RAW_SOURCE_IDENTIFIER_PRESENT: "raw_source_identifier_present",
  /** Invariante 2 — `idempotency_key` ausente. */
  MISSING_IDEMPOTENCY_KEY: "missing_idempotency_key",
  /** Invariante 3 — em `merge`, ref nova igual à antiga. */
  MERGE_REFS_IDENTICAL: "merge_refs_identical",
  /** Invariante 4 — `emitted_at < occurred_at` (tempo implausível). */
  EMITTED_BEFORE_OCCURRED: "emitted_before_occurred",
  /** Invariante 5 — `subject_ref_nova: null` fora de `erasure`. */
  NULL_SUCCESSOR_OUTSIDE_ERASURE: "null_successor_outside_erasure",
  /** Campo do envelope mínimo ausente (sufixo `:<campo>`). */
  MISSING_ENVELOPE_FIELD: "missing_envelope_field",
  /** Texto recebido não é um objeto JSON. */
  MALFORMED_ENVELOPE: "malformed_envelope",
  /** PSR fora da forma `amh:psr:v1:<...>` — jamais normalizado. */
  MALFORMED_SUBJECT_REF: "malformed_subject_ref",
  /** Deriva D2 — `event_type` fora do enum dos seis tipos. */
  UNKNOWN_EVENT_TYPE: "unknown_event_type",
  /** Deriva D2 — `event_type_version` desconhecida. */
  UNKNOWN_EVENT_TYPE_VERSION: "unknown_event_type_version",
  /** Perda L-09 — sufixo de `event_type` discorda de `event_type_version`. */
  EVENT_TYPE_VERSION_DISAGREEMENT: "event_type_version_disagreement",
  /** Perda L-10 — alcance de `reassignment` indefinido no contrato. */
  REASSIGNMENT_SCOPE_UNDEFINED: "reassignment_scope_undefined",
  /** Escopo `{amh_tenant, legal_entity}` não autorizado — fail-closed. */
  SCOPE_NOT_AUTHORIZED: "scope_not_authorized",
  /** Transição cruzando escopos distintos (CTS-18) — HAZ-0003/HAZ-0013. */
  CROSS_SCOPE_TRANSITION: "cross_scope_transition",
  /** Propósito fora do vocabulário fechado (`tratamento`) — CTS-21/AQ-3. */
  PURPOSE_NOT_PERMITTED: "purpose_not_permitted",
  /** Base legal derivada de permissão de contato — proibida (CTS-21). */
  LEGAL_BASIS_FROM_CONTACT_PERMISSION: "legal_basis_from_contact_permission",
  /** Empate total de `occurred_at` E `emitted_at` (CONF-Q-12) — CTS-06. */
  TIE_BREAK_UNDECIDABLE: "tie_break_undecidable",
  /** Fallback total (ADR-0008 N9) — condição não coberta. */
  UNSPECIFIED_CONDITION: "unspecified_condition",
} as const;

export type QuarantineReasonToken = (typeof QUARANTINE_REASONS)[keyof typeof QUARANTINE_REASONS];

/** Razão com qualificador opcional (ex.: `missing_envelope_field:event_id`). */
export interface QuarantineReason {
  readonly token: QuarantineReasonToken;
  /** Qualificador enumerado (nome de campo do envelope), nunca texto livre. */
  readonly qualifier?: string;
  /** Cláusula-fonte que sustenta a razão (invariante, perda, hazard). */
  readonly source: string;
}

export function reason(
  token: QuarantineReasonToken,
  source: string,
  qualifier?: string,
): QuarantineReason {
  return qualifier === undefined ? { token, source } : { token, qualifier, source };
}

/** Forma canônica em texto: `token` ou `token:qualificador`. */
export function formatReason(value: QuarantineReason): string {
  return value.qualifier === undefined ? value.token : `${value.token}:${value.qualifier}`;
}
