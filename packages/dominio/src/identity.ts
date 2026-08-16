/**
 * Identidade de paciente e encontro. A chave de todo fato clínico é
 * `(tenant, PSR, encontro)` (ADR-0005 M2, aceito em GDEC-0008). `subjectRef`
 * segue a forma de `portable_subject_ref` (PSR) — `amh:psr:v1:<...>`; este
 * pacote NÃO impõe o marcador `SYNTH-` porque a forma real de produção
 * (`amh:psr:v1:<uuidv4>`) também é uma instância válida deste tipo — quem
 * garante que toda referência usada em desenvolvimento/teste carrega
 * `SYNTH-` é @intensicare/fixtures-sinteticas, nunca este pacote.
 */
import type { BedId, TenantId } from "./tenancy.js";
import type { TemporalValue } from "./time.js";

export type PatientIdentityId = string;
export type EncounterId = string;

export interface PatientIdentity {
  readonly id: PatientIdentityId;
  readonly tenantId: TenantId;
  /** Forma de portable_subject_ref (PSR) — `amh:psr:v1:<...>`. */
  readonly subjectRef: string;
}

export interface Encounter {
  readonly id: EncounterId;
  readonly tenantId: TenantId;
  readonly patientId: PatientIdentityId;
  /** Atribuição de leito corrente; ausente (campo omitido) = paciente sem leito atribuído. */
  readonly bedId?: BedId;
  readonly admittedAt: TemporalValue;
  /**
   * Ausente (campo omitido) = encontro em andamento — esta é uma ausência
   * de ESTADO DE NEGÓCIO ("ainda não recebeu alta"), distinta da ausência
   * de DADO-DE-FONTE que `TemporalValue.kind === "absent"` representa
   * (ADR-0005 M3/DOM-0009). Quando o encontro É encerrado mas o instante de
   * alta não foi capturado pela fonte, use `TemporalValue` presente ausente
   * (`absentInstant(...)`), nunca omita o campo.
   */
  readonly dischargedAt?: TemporalValue;
}
