import { describe, expect, it } from "vitest";
import {
  generateSyntheticPsr,
  generateSyntheticTenantId,
  packageVersion,
  SYNTHETIC_MARKER,
} from "./index.js";

describe("@intensicare/fixtures-sinteticas (fundação executável)", () => {
  it("exporta uma versão de pacote não vazia", () => {
    expect(packageVersion).toBe("0.0.0");
  });

  it("generateSyntheticPsr sempre carrega o marcador SYNTH- e nunca a forma de UUID real", () => {
    const psr = generateSyntheticPsr("01");
    expect(psr).toBe("amh:psr:v1:SYNTH-01");
    expect(psr).toContain(SYNTHETIC_MARKER);
    expect(psr).not.toMatch(
      /^amh:psr:v1:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    );
  });

  it("generateSyntheticTenantId sempre carrega o marcador SYNTH-", () => {
    expect(generateSyntheticTenantId("A")).toBe("SYNTH-TENANT-A");
  });
});
