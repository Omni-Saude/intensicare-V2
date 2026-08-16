import { describe, expect, it } from "vitest";
import { normalizeEvaluationState, packageVersion } from "./index.js";

describe("@intensicare/kernel-clinico (fundação executável)", () => {
  it("exporta uma versão de pacote não vazia", () => {
    expect(packageVersion).toBe("0.0.0");
  });

  it("normalizeEvaluationState é identidade pura (sem I/O)", () => {
    expect(normalizeEvaluationState("complete")).toBe("complete");
    expect(normalizeEvaluationState("partial")).toBe("partial");
    expect(normalizeEvaluationState("unavailable")).toBe("unavailable");
  });
});
