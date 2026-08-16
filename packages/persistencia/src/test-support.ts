/**
 * Utilitários exclusivos de teste (NÃO faz parte do build de produção —
 * ver exclusão em tsconfig.json). Cria um banco PGlite em memória já
 * migrado e rebaixado para o papel de aplicação, e semeia um cenário
 * mínimo 100% sintético (marcador `SYNTH-`) reutilizável pelos testes de
 * migração/RLS/outbox/auditoria deste pacote.
 *
 * Nota (integração SPR-G7-2): o cenário sintético COMPLETO (1 organização,
 * 1 UTI, 4 leitos, 2 pacientes, séries de sinais vitais) vive em
 * `@intensicare/fixtures-sinteticas` (`loadIntoDatabase`). Os literais
 * abaixo permanecem deliberadamente um subconjunto local mínimo, para que
 * os testes DESTE pacote não dependam do pacote de fixtures (que depende
 * deste — a dependência inversa criaria ciclo de workspace).
 */
import { PGlite } from "@electric-sql/pglite";
import { insertEncounter, insertPatientIdentity } from "./repositories/clinical-repository.js";
import {
  insertBed,
  insertCareUnit,
  insertOrganization,
} from "./repositories/tenancy-repository.js";
import { bootstrapDatabase, withTenantTransaction } from "./session.js";
import type { TemporalValueInput } from "./temporal.js";

export function syntheticInstant(utc: string): TemporalValueInput {
  return { kind: "present", instant: { utc, offset: "-03:00" } };
}

export async function createTestDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await bootstrapDatabase(db);
  return db;
}

export interface SeededTenant {
  readonly tenantId: string;
  readonly organizationId: string;
  readonly careUnitId: string;
  readonly bedId: string;
  readonly patientId: string;
  readonly encounterId: string;
}

/** Semeia organização → UTI → leito → paciente → encontro para um tenant sintético. */
export async function seedMinimalTenant(db: PGlite, tenantId: string): Promise<SeededTenant> {
  const organizationId = tenantId;
  const careUnitId = `${tenantId}-UTI-01`;
  const bedId = `${tenantId}-LEITO-01`;
  const patientId = `${tenantId}-PAT-01`;
  const encounterId = `${tenantId}-ENC-01`;

  await withTenantTransaction(db, tenantId, async (tx) => {
    await insertOrganization(tx, {
      id: organizationId,
      tenantId,
      name: `Organização Sintética ${tenantId}`,
    });
    await insertCareUnit(tx, { id: careUnitId, tenantId, organizationId, name: "UTI Sintética" });
    await insertBed(tx, { id: bedId, tenantId, careUnitId, code: "01" });
    await insertPatientIdentity(tx, {
      id: patientId,
      tenantId,
      subjectRef: `amh:psr:v1:SYNTH-${tenantId}-P01`,
    });
    await insertEncounter(tx, {
      id: encounterId,
      tenantId,
      patientId,
      bedId,
      admittedAt: syntheticInstant("2026-08-16T10:00:00.000Z"),
    });
  });

  return { tenantId, organizationId, careUnitId, bedId, patientId, encounterId };
}
