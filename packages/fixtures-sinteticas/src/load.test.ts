import { describe, expect, it } from "vitest";
import {
  bootstrapDatabase,
  createInMemoryDatabase,
  listBeds,
  listClinicalObservations,
  listOrganizations,
  listOutboxEvents,
  withTenantTransaction,
} from "@intensicare/persistencia";
import { loadIntoDatabase } from "./load.js";

describe("loadIntoDatabase — cenário G7 semeado com os repositórios reais", () => {
  it("carrega organização, leitos, pacientes, encontros e observações com outbox na mesma transação", async () => {
    const db = createInMemoryDatabase();
    try {
      await bootstrapDatabase(db);
      const loaded = await loadIntoDatabase(db);

      expect(loaded.tenantId).toBe("SYNTH-TENANT-G7");

      const visto = await withTenantTransaction(db, loaded.tenantId, async (tx) => ({
        organizations: await listOrganizations(tx),
        beds: await listBeds(tx),
        observations: await listClinicalObservations(tx),
        outbox: await listOutboxEvents(tx),
      }));

      expect(visto.organizations.map((o) => o.id)).toEqual(["SYNTH-TENANT-G7"]);
      expect(visto.beds).toHaveLength(4);
      // 5 (P001) + 15 (P002, 3 instantes x 5 conceitos) observações do cenário.
      expect(visto.observations).toHaveLength(20);
      // Cada observação gravou exatamente um evento de outbox (ADR-0010 B1).
      expect(visto.outbox.filter((e) => e.eventType === "clinical_observation_recorded")).toHaveLength(20);
    } finally {
      await db.close();
    }
  });

  it("dados semeados de um tenant não são visíveis a outro tenant (RLS)", async () => {
    const db = createInMemoryDatabase();
    try {
      await bootstrapDatabase(db);
      await loadIntoDatabase(db);

      const comoOutroTenant = await withTenantTransaction(db, "SYNTH-TENANT-OUTRO", async (tx) => ({
        organizations: await listOrganizations(tx),
        observations: await listClinicalObservations(tx),
      }));
      expect(comoOutroTenant.organizations).toHaveLength(0);
      expect(comoOutroTenant.observations).toHaveLength(0);
    } finally {
      await db.close();
    }
  });
});
