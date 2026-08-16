/**
 * Fato clínico canônico (ADR-0005, Opção A aceita em GDEC-0008: imutável,
 * append-only, com correções/conflitos explícitos e duas dimensões de
 * status independentes). Este pacote modela apenas a dimensão 1
 * (qualidade de fonte, M4) — a dimensão 2 (status de avaliação V2) mora no
 * `EvaluationRecord` do ADR-0008, fora do escopo desta fatia (nenhuma
 * regra clínica está implementada em @intensicare/kernel-clinico ainda).
 */
import type { EncounterId } from "./identity.js";
import type { TenantId } from "./tenancy.js";
import type { TemporalValue } from "./time.js";

export type SourceEnvelopeId = string;

/**
 * Envelope de origem imutável — payload cru retido para replay
 * determinístico (ADR-0005 M1). A validação produz ou um
 * `ClinicalObservation` canônico a partir daqui, ou uma entrada de
 * quarentena — nunca um valor coagido.
 */
export interface SourceEnvelope {
  readonly id: SourceEnvelopeId;
  readonly tenantId: TenantId;
  readonly sourceSystem: string;
  readonly receivedAt: TemporalValue;
  /** Payload exatamente como recebido — nenhuma transformação aplicada aqui. */
  readonly rawPayload: unknown;
}

/**
 * Qualidade de fonte (dimensão 1 independente, ADR-0005 M4) — jamais
 * colapsada com o status de avaliação V2 (dimensão 2, ADR-0008, fora de
 * escopo desta fatia). `"quarantined"` é INADMISSÍVEL como insumo de
 * avaliação; `"unknown"` representa fonte que não carrega sinal de
 * qualidade (fail-closed, M4 linha "sinal ausente").
 */
export type SourceQuality = "valid" | "warning" | "quarantined" | "unknown";

export interface Provenance {
  readonly sourceSystem: string;
  readonly sourceEnvelopeId: SourceEnvelopeId;
  /** `"none"` quando o valor é copiado verbatim da fonte. */
  readonly transformation: string;
  readonly mappingVersion: string;
  readonly collector: string;
}

/**
 * Valor observado. O par de origem (`sourceValue`/`sourceUnit`) é sempre
 * retido quando o valor é numérico; `sourceCode` carrega o token
 * codificado da fonte quando o valor não é numérico (ex.: ACVPU
 * "A"/"C"/"V"/"P"/"U" — SPR-G7-2, integração da fatia). Pelo menos uma das
 * duas formas deve estar presente — a imposição estrutural fica no
 * repositório (@intensicare/persistencia, CHECK da migração 0002). O par
 * canônico UCUM só existe quando a conversão é possível pela tabela
 * versionada do snapshot de terminologia (ADR-0005 M5) — unidade
 * não-conversível vai a quarentena (fora de escopo desta fatia: nenhuma
 * lógica de conversão/quarentena está implementada aqui, apenas a forma).
 */
export interface ObservationValue {
  readonly sourceValue?: number;
  readonly sourceUnit?: string;
  /** Token codificado da fonte, quando o valor não é numérico (ex.: ACVPU). */
  readonly sourceCode?: string;
  readonly canonicalValue?: number;
  readonly canonicalUnit?: string;
}

export type ObservationConceptCode = string;

/**
 * Fato clínico canônico imutável (ADR-0005 M1-M9). Correção jamais
 * sobrescreve: gera um NOVO registro com `correctionOf` apontando para o
 * superado (M8) — a imutabilidade em si é imposta pelo repositório
 * (@intensicare/persistencia), não por este tipo.
 */
export interface ClinicalObservation {
  readonly id: string;
  readonly tenantId: TenantId;
  /** Forma de portable_subject_ref (PSR) — chave do fato junto com `encounterId` (M2). */
  readonly subjectRef: string;
  readonly encounterId: EncounterId;
  readonly concept: ObservationConceptCode;
  readonly value: ObservationValue;
  readonly quality: SourceQuality;
  readonly provenance: Provenance;
  readonly observedAt: TemporalValue;
  readonly effectiveAt: TemporalValue;
  readonly issuedAt: TemporalValue;
  readonly receivedAt: TemporalValue;
  readonly persistedAt: TemporalValue;
  /** Presente somente quando este fato corrige um fato anterior (M8) — nunca sobrescreve. */
  readonly correctionOf?: string;
}
