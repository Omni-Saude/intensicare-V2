/**
 * Modelo de tenancy da fatia (ADR-0003, opção A aceita em GDEC-0008: tenant
 * V2 = tenant AMH, raiz de CNPJ, espelhado 1:1). Nesta fatia sintética,
 * `Organization.id` E `tenantId` são deliberadamente o MESMO valor — a
 * hierarquia interna `Organization → CareUnit → Bed` vive DENTRO do tenant
 * como estrutura clínico-operacional, nunca como fronteira de isolamento
 * (ADR-0003 §2.2 A3). A fronteira de isolamento é sempre o tenant.
 */

export type TenantId = string;
export type OrganizationId = TenantId;
export type CareUnitId = string;
export type BedId = string;

export interface Organization {
  readonly id: OrganizationId;
  readonly tenantId: TenantId;
  readonly name: string;
}

export interface CareUnit {
  readonly id: CareUnitId;
  readonly tenantId: TenantId;
  readonly organizationId: OrganizationId;
  readonly name: string;
}

export interface Bed {
  readonly id: BedId;
  readonly tenantId: TenantId;
  readonly careUnitId: CareUnitId;
  readonly code: string;
}

/**
 * Constrói uma `Organization` garantindo por construção que `tenantId`
 * nunca diverge de `id` (ADR-0003 opção A) — não é possível, usando esta
 * função, criar uma organização com tenant diferente de si mesma.
 */
export function createOrganization(input: {
  readonly id: OrganizationId;
  readonly name: string;
}): Organization {
  return { id: input.id, tenantId: input.id, name: input.name };
}
