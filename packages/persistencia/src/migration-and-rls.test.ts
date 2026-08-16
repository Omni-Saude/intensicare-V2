import { describe, expect, it } from "vitest";
import { listBeds, listOrganizations } from "./repositories/tenancy-repository.js";
import { listClinicalObservations } from "./repositories/clinical-repository.js";
import { insertClinicalObservationWithOutbox, listOutboxEvents } from "./repositories/clinical-repository.js";
import { withTenantTransaction } from "./session.js";
import { createTestDatabase, seedMinimalTenant, syntheticInstant } from "./test-support.js";

describe("migração SQL pura (0001_init.sql)", () => {
  it("aplica sem erro e deixa o banco pronto para uso rebaixado do papel de aplicação", async () => {
    const db = await createTestDatabase();
    try {
      const current = await db.query<{ current_user: string }>("select current_user");
      expect(current.rows[0]?.current_user).toBe("intensicare_app");
    } finally {
      await db.close();
    }
  });

  it("cria todas as tabelas clínicas esperadas", async () => {
    const db = await createTestDatabase();
    try {
      const tables = await db.query<{ table_name: string }>(
        `select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
      );
      const names = tables.rows.map((r) => r.table_name);
      expect(names).toEqual(
        expect.arrayContaining([
          "organizations",
          "care_units",
          "beds",
          "patient_identities",
          "encounters",
          "source_envelopes",
          "clinical_observations",
          "alerts",
          "work_items",
          "audit_events",
          "outbox_events",
        ]),
      );
    } finally {
      await db.close();
    }
  });
});

describe("RLS por tenant_id (ADR-0003) — isolamento entre tenants sintéticos", () => {
  it("tenant A não lê linhas do tenant B em organizations, beds e clinical_observations", async () => {
    const db = await createTestDatabase();
    try {
      const tenantA = await seedMinimalTenant(db, "SYNTH-TENANT-A");
      const tenantB = await seedMinimalTenant(db, "SYNTH-TENANT-B");

      await withTenantTransaction(db, tenantA.tenantId, async (tx) => {
        await insertClinicalObservationWithOutbox(
          tx,
          {
            id: `${tenantA.tenantId}-OBS-01`,
            tenantId: tenantA.tenantId,
            subjectRef: `amh:psr:v1:SYNTH-${tenantA.tenantId}-P01`,
            encounterId: tenantA.encounterId,
            concept: "SYNTH-CONCEPT-SPO2",
            value: { sourceValue: 96, sourceUnit: "%" },
            quality: "valid",
            provenance: { sourceSystem: "SYNTH-SOURCE-01", sourceEnvelopeId: "SYNTH-ENV-01", transformation: "none", mappingVersion: "0.0.0", collector: "test" },
            observedAt: syntheticInstant("2026-08-16T10:05:00.000Z"),
            effectiveAt: syntheticInstant("2026-08-16T10:05:00.000Z"),
            issuedAt: syntheticInstant("2026-08-16T10:05:01.000Z"),
            receivedAt: syntheticInstant("2026-08-16T10:05:02.000Z"),
            persistedAt: syntheticInstant("2026-08-16T10:05:03.000Z"),
          },
          `encounter:${tenantA.encounterId}`,
        );
      });

      // Visão do tenant A: enxerga só a própria organização, o próprio leito
      // e a própria observação — nunca as do tenant B.
      const asTenantA = await withTenantTransaction(db, tenantA.tenantId, async (tx) => ({
        organizations: await listOrganizations(tx),
        beds: await listBeds(tx),
        observations: await listClinicalObservations(tx),
      }));
      expect(asTenantA.organizations.map((o) => o.id)).toEqual([tenantA.organizationId]);
      expect(asTenantA.beds.map((b) => b.id)).toEqual([tenantA.bedId]);
      expect(asTenantA.observations).toHaveLength(1);
      expect(asTenantA.observations[0]?.tenantId).toBe(tenantA.tenantId);

      // Visão do tenant B: enxerga só a própria organização e o próprio
      // leito — zero observações (nunca criou nenhuma) e nunca nada do A.
      const asTenantB = await withTenantTransaction(db, tenantB.tenantId, async (tx) => ({
        organizations: await listOrganizations(tx),
        beds: await listBeds(tx),
        observations: await listClinicalObservations(tx),
      }));
      expect(asTenantB.organizations.map((o) => o.id)).toEqual([tenantB.organizationId]);
      expect(asTenantB.beds.map((b) => b.id)).toEqual([tenantB.bedId]);
      expect(asTenantB.observations).toHaveLength(0);
    } finally {
      await db.close();
    }
  });

  it("uma transação sem contexto de tenant (app.tenant_id nunca definido) não enxerga NENHUMA linha clínica", async () => {
    const db = await createTestDatabase();
    try {
      await seedMinimalTenant(db, "SYNTH-TENANT-A");
      // Fora de withTenantTransaction — nenhum set_config('app.tenant_id', ...) rodou.
      const rows = await db.query("select * from organizations");
      expect(rows.rows).toHaveLength(0);
    } finally {
      await db.close();
    }
  });

  it("tentativa de gravar uma linha marcada para outro tenant é rejeitada pela política WITH CHECK", async () => {
    const db = await createTestDatabase();
    try {
      const tenantA = await seedMinimalTenant(db, "SYNTH-TENANT-A");
      await expect(
        withTenantTransaction(db, tenantA.tenantId, async (tx) => {
          await tx.query(`insert into organizations (id, tenant_id, name) values ($1, $2, $3)`, [
            "SYNTH-TENANT-B",
            "SYNTH-TENANT-B",
            "Tentativa cross-tenant",
          ]);
        }),
      ).rejects.toThrow(/row-level security/i);
    } finally {
      await db.close();
    }
  });

  it("outbox_events também está sujeito a RLS por tenant", async () => {
    const db = await createTestDatabase();
    try {
      const tenantA = await seedMinimalTenant(db, "SYNTH-TENANT-A");
      const tenantB = await seedMinimalTenant(db, "SYNTH-TENANT-B");

      await withTenantTransaction(db, tenantA.tenantId, async (tx) => {
        await insertClinicalObservationWithOutbox(
          tx,
          {
            id: `${tenantA.tenantId}-OBS-02`,
            tenantId: tenantA.tenantId,
            subjectRef: `amh:psr:v1:SYNTH-${tenantA.tenantId}-P01`,
            encounterId: tenantA.encounterId,
            concept: "SYNTH-CONCEPT-FC",
            value: { sourceValue: 88, sourceUnit: "bpm" },
            quality: "valid",
            provenance: { sourceSystem: "SYNTH-SOURCE-01", sourceEnvelopeId: "SYNTH-ENV-01", transformation: "none", mappingVersion: "0.0.0", collector: "test" },
            observedAt: syntheticInstant("2026-08-16T10:06:00.000Z"),
            effectiveAt: syntheticInstant("2026-08-16T10:06:00.000Z"),
            issuedAt: syntheticInstant("2026-08-16T10:06:01.000Z"),
            receivedAt: syntheticInstant("2026-08-16T10:06:02.000Z"),
            persistedAt: syntheticInstant("2026-08-16T10:06:03.000Z"),
          },
          `encounter:${tenantA.encounterId}`,
        );
      });

      const outboxAsB = await withTenantTransaction(db, tenantB.tenantId, (tx) => listOutboxEvents(tx));
      expect(outboxAsB).toHaveLength(0);

      const outboxAsA = await withTenantTransaction(db, tenantA.tenantId, (tx) => listOutboxEvents(tx));
      expect(outboxAsA).toHaveLength(1);
    } finally {
      await db.close();
    }
  });
});
