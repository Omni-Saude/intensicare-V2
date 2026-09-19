/**
 * Repositório de tenancy — organizações, unidades de cuidado e leitos
 * (ADR-0003 opção A). Toda função aqui espera rodar dentro de uma
 * transação já escopada por tenant (ver `withTenantTransaction` em
 * `../session.js`) — fora desse escopo, a RLS nega qualquer linha.
 *
 * Integração SPR-G7-2: os tipos de entrada duplicados localmente foram
 * removidos — as entradas agora são os tipos canônicos de
 * `@intensicare/dominio` (`Organization`, `CareUnit`, `Bed`).
 */

import type { Bed, CareUnit, Organization } from "@intensicare/dominio";
import type { ExecutorTenant } from "../postgres/porta.js";

export async function insertOrganization(tx: ExecutorTenant, input: Organization): Promise<void> {
  await tx.query(`insert into organizations (id, tenant_id, name) values ($1, $2, $3)`, [
    input.id,
    input.tenantId,
    input.name,
  ]);
}

export async function insertCareUnit(tx: ExecutorTenant, input: CareUnit): Promise<void> {
  await tx.query(
    `insert into care_units (id, tenant_id, organization_id, name) values ($1, $2, $3, $4)`,
    [input.id, input.tenantId, input.organizationId, input.name],
  );
}

export async function insertBed(tx: ExecutorTenant, input: Bed): Promise<void> {
  await tx.query(`insert into beds (id, tenant_id, care_unit_id, code) values ($1, $2, $3, $4)`, [
    input.id,
    input.tenantId,
    input.careUnitId,
    input.code,
  ]);
}

export interface OrganizationRow {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
}

/** Lê todas as organizações VISÍVEIS na transação corrente (sujeito a RLS). */
export async function listOrganizations(tx: ExecutorTenant): Promise<readonly OrganizationRow[]> {
  const result = await tx.query<{ id: string; tenant_id: string; name: string }>(
    `select id, tenant_id, name from organizations order by id`,
  );
  return result.rows.map((row) => ({ id: row.id, tenantId: row.tenant_id, name: row.name }));
}

export interface BedRow {
  readonly id: string;
  readonly tenantId: string;
  readonly careUnitId: string;
  readonly code: string;
}

/** Lê todos os leitos VISÍVEIS na transação corrente (sujeito a RLS). */
export async function listBeds(tx: ExecutorTenant): Promise<readonly BedRow[]> {
  const result = await tx.query<{
    id: string;
    tenant_id: string;
    care_unit_id: string;
    code: string;
  }>(`select id, tenant_id, care_unit_id, code from beds order by id`);
  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    careUnitId: row.care_unit_id,
    code: row.code,
  }));
}
