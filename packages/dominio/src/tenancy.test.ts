import { describe, expect, it } from "vitest";
import { createOrganization } from "./tenancy.js";

describe("tenancy — grão de tenant (ADR-0003 opção A aceita)", () => {
  it("createOrganization sempre faz tenantId = id — nunca divergem", () => {
    const org = createOrganization({ id: "SYNTH-TENANT-A", name: "Hospital Sintético A" });
    expect(org.tenantId).toBe(org.id);
    expect(org.tenantId).toBe("SYNTH-TENANT-A");
    expect(org.name).toBe("Hospital Sintético A");
  });
});
