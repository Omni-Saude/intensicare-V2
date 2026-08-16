import { describe, expect, it } from "vitest";
import {
  getWorkItem,
  insertAlert,
  insertAuditEvent,
  insertClinicalObservationWithOutbox,
  insertWorkItem,
  listAuditEvents,
  listClinicalObservations,
  listOutboxEvents,
  transitionWorkItem,
} from "./repositories/clinical-repository.js";
import { withTenantTransaction } from "./session.js";
import { createTestDatabase, seedMinimalTenant, syntheticInstant } from "./test-support.js";

describe("outbox transacional (ADR-0010 opção A) — mesma transação da gravação clínica", () => {
  it("grava o fato clínico E o evento de outbox atomicamente (ambos presentes após commit)", async () => {
    const db = await createTestDatabase();
    try {
      const tenant = await seedMinimalTenant(db, "SYNTH-TENANT-A");

      await withTenantTransaction(db, tenant.tenantId, async (tx) => {
        await insertClinicalObservationWithOutbox(
          tx,
          {
            id: "SYNTH-OBS-ATOMIC-01",
            tenantId: tenant.tenantId,
            subjectRef: `amh:psr:v1:SYNTH-${tenant.tenantId}-P01`,
            encounterId: tenant.encounterId,
            concept: "SYNTH-CONCEPT-SPO2",
            value: { sourceValue: 90, sourceUnit: "%" },
            quality: "warning",
            provenance: {
              sourceSystem: "SYNTH-SOURCE-01",
              sourceEnvelopeId: "SYNTH-ENV-01",
              transformation: "none",
              mappingVersion: "0.0.0",
              collector: "test",
            },
            observedAt: syntheticInstant("2026-08-16T11:00:00.000Z"),
            effectiveAt: syntheticInstant("2026-08-16T11:00:00.000Z"),
            issuedAt: syntheticInstant("2026-08-16T11:00:01.000Z"),
            receivedAt: syntheticInstant("2026-08-16T11:00:02.000Z"),
            persistedAt: syntheticInstant("2026-08-16T11:00:03.000Z"),
          },
          `encounter:${tenant.encounterId}`,
        );
      });

      const [observations, outbox] = await withTenantTransaction(
        db,
        tenant.tenantId,
        async (tx) => [await listClinicalObservations(tx), await listOutboxEvents(tx)],
      );
      expect(observations).toHaveLength(1);
      expect(outbox).toHaveLength(1);
      expect(outbox[0]?.aggregateId).toBe("SYNTH-OBS-ATOMIC-01");
      expect(outbox[0]?.orderingScope).toBe(`encounter:${tenant.encounterId}`);
    } finally {
      await db.close();
    }
  });

  it("uma falha após a gravação clínica, antes do commit, reverte AMBAS as escritas — nunca fato-sem-evento", async () => {
    const db = await createTestDatabase();
    try {
      const tenant = await seedMinimalTenant(db, "SYNTH-TENANT-A");

      await expect(
        withTenantTransaction(db, tenant.tenantId, async (tx) => {
          await insertClinicalObservationWithOutbox(
            tx,
            {
              id: "SYNTH-OBS-ROLLBACK-01",
              tenantId: tenant.tenantId,
              subjectRef: `amh:psr:v1:SYNTH-${tenant.tenantId}-P01`,
              encounterId: tenant.encounterId,
              concept: "SYNTH-CONCEPT-SPO2",
              value: { sourceValue: 92, sourceUnit: "%" },
              quality: "valid",
              provenance: {
                sourceSystem: "SYNTH-SOURCE-01",
                sourceEnvelopeId: "SYNTH-ENV-01",
                transformation: "none",
                mappingVersion: "0.0.0",
                collector: "test",
              },
              observedAt: syntheticInstant("2026-08-16T11:05:00.000Z"),
              effectiveAt: syntheticInstant("2026-08-16T11:05:00.000Z"),
              issuedAt: syntheticInstant("2026-08-16T11:05:01.000Z"),
              receivedAt: syntheticInstant("2026-08-16T11:05:02.000Z"),
              persistedAt: syntheticInstant("2026-08-16T11:05:03.000Z"),
            },
            `encounter:${tenant.encounterId}`,
          );
          throw new Error("falha simulada depois da gravação, antes do commit");
        }),
      ).rejects.toThrow(/falha simulada/);

      const [observations, outbox] = await withTenantTransaction(
        db,
        tenant.tenantId,
        async (tx) => [await listClinicalObservations(tx), await listOutboxEvents(tx)],
      );
      expect(observations).toHaveLength(0);
      expect(outbox).toHaveLength(0);
    } finally {
      await db.close();
    }
  });
});

describe("auditoria append-only (ADR-0009 W6 / ADR-0010 B1)", () => {
  it("UPDATE em audit_events é bloqueado pelo trigger — mesmo tentado diretamente", async () => {
    const db = await createTestDatabase();
    try {
      const tenant = await seedMinimalTenant(db, "SYNTH-TENANT-A");
      await withTenantTransaction(db, tenant.tenantId, async (tx) => {
        await insertAuditEvent(tx, {
          id: "SYNTH-AUDIT-01",
          tenantId: tenant.tenantId,
          actorId: "SYNTH-CLINICIAN-01",
          command: "assign",
          aggregateType: "work_item",
          aggregateId: "SYNTH-WI-01",
          newState: "atribuido",
          occurredAt: syntheticInstant("2026-08-16T11:10:00.000Z"),
          idempotencyKey: "SYNTH-CMD-01",
        });
      });

      await expect(
        withTenantTransaction(db, tenant.tenantId, async (tx) => {
          await tx.query(`update audit_events set command = 'tampered' where id = $1`, [
            "SYNTH-AUDIT-01",
          ]);
        }),
      ).rejects.toThrow(/append-only/i);
    } finally {
      await db.close();
    }
  });

  it("DELETE em audit_events é bloqueado pelo trigger", async () => {
    const db = await createTestDatabase();
    try {
      const tenant = await seedMinimalTenant(db, "SYNTH-TENANT-A");
      await withTenantTransaction(db, tenant.tenantId, async (tx) => {
        await insertAuditEvent(tx, {
          id: "SYNTH-AUDIT-02",
          tenantId: tenant.tenantId,
          actorId: "SYNTH-CLINICIAN-01",
          command: "assign",
          aggregateType: "work_item",
          aggregateId: "SYNTH-WI-02",
          newState: "atribuido",
          occurredAt: syntheticInstant("2026-08-16T11:11:00.000Z"),
          idempotencyKey: "SYNTH-CMD-02",
        });
      });

      await expect(
        withTenantTransaction(db, tenant.tenantId, async (tx) => {
          await tx.query(`delete from audit_events where id = $1`, ["SYNTH-AUDIT-02"]);
        }),
      ).rejects.toThrow(/append-only/i);
    } finally {
      await db.close();
    }
  });
});

describe("transição de WorkItem com concorrência otimista (ADR-0009 Q2-A) + auditoria + outbox no mesmo commit", () => {
  async function seedAlertAndWorkItem(
    db: Awaited<ReturnType<typeof createTestDatabase>>,
    tenantId: string,
    encounterId: string,
  ) {
    await withTenantTransaction(db, tenantId, async (tx) => {
      await insertAlert(tx, {
        id: "SYNTH-ALERT-01",
        tenantId,
        encounterId,
        raisedAt: syntheticInstant("2026-08-16T11:20:00.000Z"),
        evaluatedAt: syntheticInstant("2026-08-16T11:20:00.000Z"),
        severity: "SYNTH-SEVERITY-PLACEHOLDER",
        reason: "SYNTH-REASON-DEMO",
      });
      await insertWorkItem(tx, { id: "SYNTH-WI-TX-01", tenantId, alertId: "SYNTH-ALERT-01" });
    });
  }

  it("transição aplicada quando a versão esperada confere; audita e publica no outbox na MESMA transação", async () => {
    const db = await createTestDatabase();
    try {
      const tenant = await seedMinimalTenant(db, "SYNTH-TENANT-A");
      await seedAlertAndWorkItem(db, tenant.tenantId, tenant.encounterId);

      const outcome = await withTenantTransaction(db, tenant.tenantId, (tx) =>
        transitionWorkItem(tx, {
          workItemId: "SYNTH-WI-TX-01",
          tenantId: tenant.tenantId,
          expectedVersion: 0,
          nextState: "atribuido",
          actorId: "SYNTH-CLINICIAN-01",
          command: "assign",
          idempotencyKey: "SYNTH-CMD-ASSIGN-01",
          assigneeId: "SYNTH-CLINICIAN-01",
          occurredAt: syntheticInstant("2026-08-16T11:21:00.000Z"),
          outboxEventType: "work_item_assigned",
          orderingScope: "work_item:SYNTH-WI-TX-01",
        }),
      );
      expect(outcome).toEqual({ outcome: "applied", newVersion: 1 });

      const [item, audit, outbox] = await withTenantTransaction(db, tenant.tenantId, async (tx) => [
        await getWorkItem(tx, "SYNTH-WI-TX-01"),
        await listAuditEvents(tx),
        await listOutboxEvents(tx),
      ]);
      expect(item?.state).toBe("atribuido");
      expect(item?.version).toBe(1);
      expect(item?.assigneeId).toBe("SYNTH-CLINICIAN-01");
      expect(audit).toHaveLength(1);
      expect(audit[0]?.previousState).toBe("nao_atribuido");
      expect(audit[0]?.newState).toBe("atribuido");
      expect(outbox).toHaveLength(1);
      expect(outbox[0]?.eventType).toBe("work_item_assigned");
    } finally {
      await db.close();
    }
  });

  it("conflito de versão (HAZ-0023): comando com versão desatualizada NÃO altera o item, NÃO audita e NÃO publica outbox", async () => {
    const db = await createTestDatabase();
    try {
      const tenant = await seedMinimalTenant(db, "SYNTH-TENANT-A");
      await seedAlertAndWorkItem(db, tenant.tenantId, tenant.encounterId);

      // Primeira transição real avança a versão para 1.
      await withTenantTransaction(db, tenant.tenantId, (tx) =>
        transitionWorkItem(tx, {
          workItemId: "SYNTH-WI-TX-01",
          tenantId: tenant.tenantId,
          expectedVersion: 0,
          nextState: "atribuido",
          actorId: "SYNTH-CLINICIAN-01",
          command: "assign",
          idempotencyKey: "SYNTH-CMD-ASSIGN-01",
          assigneeId: "SYNTH-CLINICIAN-01",
          occurredAt: syntheticInstant("2026-08-16T11:22:00.000Z"),
          outboxEventType: "work_item_assigned",
          orderingScope: "work_item:SYNTH-WI-TX-01",
        }),
      );

      // Um segundo ator, que ainda via versão 0 (concorrente), tenta agir — deve falhar explícito.
      const conflict = await withTenantTransaction(db, tenant.tenantId, (tx) =>
        transitionWorkItem(tx, {
          workItemId: "SYNTH-WI-TX-01",
          tenantId: tenant.tenantId,
          expectedVersion: 0,
          nextState: "reconhecido",
          actorId: "SYNTH-CLINICIAN-02",
          command: "acknowledge",
          idempotencyKey: "SYNTH-CMD-ACK-CONCORRENTE",
          occurredAt: syntheticInstant("2026-08-16T11:22:05.000Z"),
          outboxEventType: "work_item_acknowledged",
          orderingScope: "work_item:SYNTH-WI-TX-01",
        }),
      );
      expect(conflict).toEqual({ outcome: "conflict" });

      const [item, audit, outbox] = await withTenantTransaction(db, tenant.tenantId, async (tx) => [
        await getWorkItem(tx, "SYNTH-WI-TX-01"),
        await listAuditEvents(tx),
        await listOutboxEvents(tx),
      ]);
      // Estado continua exatamente o da primeira transição (atribuido/v1) —
      // o comando conflitante não regrediu nem sobrescreveu nada.
      expect(item?.state).toBe("atribuido");
      expect(item?.version).toBe(1);
      // Só o primeiro comando (aplicado) gerou auditoria e outbox.
      expect(audit).toHaveLength(1);
      expect(outbox).toHaveLength(1);
    } finally {
      await db.close();
    }
  });
});
