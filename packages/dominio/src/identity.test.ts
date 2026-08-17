import { describe, expect, it } from "vitest";
import type { Encounter, PatientIdentity } from "./identity.js";
import { presentInstant } from "./time.js";

describe("identity — PatientIdentity/Encounter (ADR-0005 M2: chave do fato = tenant, PSR, encontro)", () => {
  it("PatientIdentity carrega subjectRef na forma de PSR", () => {
    const patient: PatientIdentity = {
      id: "SYNTH-PAT-001",
      tenantId: "SYNTH-TENANT-A",
      subjectRef: "amh:psr:v1:SYNTH-P001",
    };
    expect(patient.subjectRef.startsWith("amh:psr:v1:")).toBe(true);
  });

  it("Encounter sem bedId nem dischargedAt representa admissão em andamento sem leito atribuído", () => {
    const encounter: Encounter = {
      id: "SYNTH-ENC-001",
      tenantId: "SYNTH-TENANT-A",
      patientId: "SYNTH-PAT-001",
      admittedAt: presentInstant({ utc: "2026-08-16T10:00:00.000Z", offset: "-03:00" }),
    };
    expect(encounter.bedId).toBeUndefined();
    expect(encounter.dischargedAt).toBeUndefined();
  });
});
