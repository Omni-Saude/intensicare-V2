/**
 * Registro de auditoria imutável e append-only (ADR-0009 W6; ADR-0010 B1).
 * Toda transição de `WorkItem` grava exatamente um `AuditEvent` na MESMA
 * transação do efeito e do evento de outbox — essa garantia de atomicidade
 * é responsabilidade do repositório (@intensicare/persistencia), não deste
 * tipo, que apenas descreve a forma do registro.
 */
import type { TenantId } from "./tenancy.js";
import type { TemporalValue } from "./time.js";

export type AuditEventId = string;

export interface AuditEvent {
  readonly id: AuditEventId;
  readonly tenantId: TenantId;
  /** Ator humano individual (W4) — conta compartilhada nunca aparece aqui. */
  readonly actorId: string;
  readonly command: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly previousState?: string;
  readonly newState?: string;
  readonly occurredAt: TemporalValue;
  /** Chave de idempotência do comando que originou este evento (W2). */
  readonly idempotencyKey: string;
}
