import { describe, expect, it } from "vitest";
import { normalizeEvaluationState, packageVersion } from "./index.js";

describe("@intensicare/dominio (fundação executável)", () => {
  it("exporta uma versão de pacote não vazia", () => {
    expect(packageVersion).toBe("0.0.0");
  });

  it("consegue importar e usar @intensicare/kernel-clinico via workspace:*", () => {
    expect(normalizeEvaluationState("partial")).toBe("partial");
  });
});
