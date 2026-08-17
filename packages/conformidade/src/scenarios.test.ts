/**
 * Testes de integridade do CATÁLOGO de cenários: que os 22 do harness
 * estejam presentes, que cada um cite a fonte que o justifica, e que a
 * matriz de cobertura do §7.6 continue coberta.
 */
import { describe, expect, it } from "vitest";
import { loadPinnedFixtures } from "./pinned-fixtures.js";
import { runAllScenarios, SCENARIOS } from "./scenarios.js";

const fixtures = loadPinnedFixtures();

describe("catálogo dos 22 cenários", () => {
  it("tem exatamente 22 cenários, com identificadores únicos CTS-01..CTS-22", () => {
    expect(SCENARIOS).toHaveLength(22);
    const ids = SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(22);
    expect(ids).toEqual(
      Array.from({ length: 22 }, (_, index) => `CTS-${String(index + 1).padStart(2, "0")}`),
    );
  });

  it("todo cenário declara título, interfaces, fixtures e exigência do §7.6", () => {
    for (const scenario of SCENARIOS) {
      expect(scenario.title.length).toBeGreaterThan(0);
      expect(scenario.interfaces.length).toBeGreaterThan(0);
      expect(scenario.fixtures.length).toBeGreaterThan(0);
      expect(scenario.requirement).toContain("§7.6");
    }
  });

  it("todo cenário produz ao menos uma verificação — nenhum é decorativo", () => {
    for (const result of runAllScenarios(fixtures)) {
      expect(result.checks.length).toBeGreaterThan(0);
    }
  });

  it(
    "cobre as linhas da matriz do §7.6 (duplicate, delay, out-of-order, correction, " +
      "merge/unmerge, downtime, backfill, inválido, erasure, resolve, tenant, drift)",
    () => {
      const requirements = SCENARIOS.map((s) => s.requirement).join(" ");
      for (const row of [
        "duplicate",
        "delay",
        "out-of-order",
        "correction",
        "merge/unmerge com replay",
        "backfill",
        "evento inválido",
        "erasure",
        "resolve",
        "downtime",
        "tenant-isolation",
        "negative-auth",
        "drift detection",
      ]) {
        expect(requirements).toContain(row);
      }
    },
  );

  it("nenhum cenário reporta PASSOU com verificação bloqueada (execução parcial não passa)", () => {
    for (const result of runAllScenarios(fixtures)) {
      if (result.verdict === "passou") {
        expect(result.checks.every((c) => c.status === "passou")).toBe(true);
      }
    }
  });

  it("todo cenário NÃO EXECUTÁVEL nomeia a causa em ao menos uma verificação", () => {
    for (const result of runAllScenarios(fixtures)) {
      if (result.verdict !== "nao-executavel") continue;
      expect(result.checks.some((c) => c.blockedBy !== undefined)).toBe(true);
    }
  });

  it("todo cenário declara ao menos uma limitação — nenhum se apresenta como prova completa", () => {
    for (const result of runAllScenarios(fixtures)) {
      expect(result.limitations.length).toBeGreaterThan(0);
    }
  });

  it("os cenários que dependem de fixture ausente NÃO são executados como se existisse", () => {
    const results = runAllScenarios(fixtures);
    for (const id of ["CTS-03", "CTS-06", "CTS-18"]) {
      const result = results.find((r) => r.id === id);
      expect(result?.verdict).toBe("nao-executavel");
      expect(result?.checks.some((c) => c.blockedBy === "fixture-ausente")).toBe(true);
    }
  });

  it("os cenários que dependem de IF-07 `resolve` continuam bloqueados pela interface", () => {
    const results = runAllScenarios(fixtures);
    for (const id of ["CTS-11", "CTS-14", "CTS-15", "CTS-16", "CTS-19"]) {
      const result = results.find((r) => r.id === id);
      expect(result?.verdict).toBe("nao-executavel");
      expect(result?.checks.some((c) => c.blockedBy === "interface-inexistente")).toBe(true);
    }
  });

  it("CTS-22 permanece sem objeto enquanto não houver manifesto publicado", () => {
    const result = runAllScenarios(fixtures).find((r) => r.id === "CTS-22");
    expect(result?.verdict).toBe("nao-executavel");
    expect(result?.checks[0]?.blockedBy).toBe("manifesto-nao-publicado");
  });
});
