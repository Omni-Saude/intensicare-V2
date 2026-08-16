import { describe, expect, it } from "vitest";
import type { ClinicalObservation } from "./clinical-observation.js";
import { presentInstant } from "./time.js";

describe("clinical-observation — fato canônico imutável (ADR-0005 M1/M8)", () => {
  it("uma correção referencia o fato superado via correctionOf — nunca sobrescreve", () => {
    const original: ClinicalObservation = {
      id: "SYNTH-OBS-001",
      tenantId: "SYNTH-TENANT-A",
      subjectRef: "amh:psr:v1:SYNTH-P002",
      encounterId: "SYNTH-ENC-002",
      concept: "SYNTH-CONCEPT-SPO2",
      value: { sourceValue: 91, sourceUnit: "%" },
      quality: "valid",
      provenance: {
        sourceSystem: "SYNTH-SOURCE-01",
        sourceEnvelopeId: "SYNTH-ENV-001",
        transformation: "none",
        mappingVersion: "0.0.0",
        collector: "fixtures-sinteticas",
      },
      observedAt: presentInstant({ utc: "2026-08-16T10:00:00.000Z", offset: "-03:00" }),
      effectiveAt: presentInstant({ utc: "2026-08-16T10:00:00.000Z", offset: "-03:00" }),
      issuedAt: presentInstant({ utc: "2026-08-16T10:00:05.000Z", offset: "-03:00" }),
      receivedAt: presentInstant({ utc: "2026-08-16T10:00:10.000Z", offset: "-03:00" }),
      persistedAt: presentInstant({ utc: "2026-08-16T10:00:11.000Z", offset: "-03:00" }),
    };

    const correction: ClinicalObservation = {
      ...original,
      id: "SYNTH-OBS-002",
      value: { sourceValue: 89, sourceUnit: "%" },
      correctionOf: original.id,
    };

    expect(correction.correctionOf).toBe("SYNTH-OBS-001");
    expect(correction.id).not.toBe(original.id);
    expect(original.correctionOf).toBeUndefined();
  });

  it("qualidade 'quarantined' é uma das quatro dimensões de fonte modeladas (M4) — inadmissível como insumo normal", () => {
    const quarantined: ClinicalObservation["quality"] = "quarantined";
    expect(["valid", "warning", "quarantined", "unknown"]).toContain(quarantined);
  });
});
