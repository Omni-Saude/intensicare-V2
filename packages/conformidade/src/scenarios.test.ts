/**
 * Testes de integridade do CATÁLOGO de cenários: que os 22 do harness
 * estejam presentes, que cada um cite a fonte que o justifica, e que a
 * matriz de cobertura do §7.6 continue coberta.
 */
import { describe, expect, it } from "vitest";
import { loadPinnedFixtures } from "./pinned-fixtures.js";
import { runAllScenarios, SCENARIOS } from "./scenarios.js";

const fixtures = loadPinnedFixtures();

/**
 * Cardinalidade e distribuição PINADAS EM LITERAL.
 *
 * POR QUÊ. Cinco testes deste arquivo eram laços sobre
 * `runAllScenarios(fixtures)` sem nenhuma guarda de cardinalidade, e dois
 * deles filtravam por veredito antes de asserir. Nada no arquivo media o
 * tamanho do retorno: um `runAllScenarios` que devolvesse `[]` — ou que
 * deixasse de produzir cenários `passou`, ou de produzir cenários
 * `nao-executavel` — deixava todos os cinco VERDES, afirmando propriedades
 * sobre um conjunto que não existia. Medido antes da correção: 22 resultados,
 * 12 `passou`, 0 `falhou`, 10 `nao-executavel`.
 *
 * Os números abaixo são LITERAIS deliberadamente, e não `SCENARIOS.length`
 * nem recontagem do próprio retorno: dado sob teste não pode ser a fonte da
 * própria expectativa.
 */
const RESULTADOS = runAllScenarios(fixtures);
const TOTAL_ESPERADO = 22;
const PASSOU_ESPERADO = 12;
const FALHOU_ESPERADO = 0;
const NAO_EXECUTAVEL_ESPERADO = 10;

describe("cardinalidade da execução — guarda de não-vacuidade dos laços abaixo", () => {
  it("runAllScenarios devolve os 22 resultados, na distribuição de veredito medida", () => {
    expect(RESULTADOS).toHaveLength(TOTAL_ESPERADO);
    expect(RESULTADOS.filter((r) => r.verdict === "passou")).toHaveLength(PASSOU_ESPERADO);
    expect(RESULTADOS.filter((r) => r.verdict === "falhou")).toHaveLength(FALHOU_ESPERADO);
    expect(RESULTADOS.filter((r) => r.verdict === "nao-executavel")).toHaveLength(
      NAO_EXECUTAVEL_ESPERADO,
    );
  });
});

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
    expect(RESULTADOS).toHaveLength(TOTAL_ESPERADO);
    for (const result of RESULTADOS) {
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
    // O `if` interno é um FILTRO: se nenhum cenário tivesse veredito `passou`,
    // o corpo nunca executaria e o teste passaria sem inspecionar nada. Conta
    // quantos entraram e compara com o literal medido.
    let inspecionados = 0;
    for (const result of RESULTADOS) {
      if (result.verdict === "passou") {
        expect(
          result.checks.length,
          `${result.id}: veredito passou sem verificação`,
        ).toBeGreaterThan(0);
        expect(result.checks.every((c) => c.status === "passou")).toBe(true);
        inspecionados += 1;
      }
    }
    expect(inspecionados, "nenhum cenário com veredito `passou` foi inspecionado").toBe(
      PASSOU_ESPERADO,
    );
  });

  it("todo cenário NÃO EXECUTÁVEL nomeia a causa em ao menos uma verificação", () => {
    // Mesmo filtro, mesmo risco: sem cenário `nao-executavel` nenhum, o
    // `continue` esvaziava o teste.
    let inspecionados = 0;
    for (const result of RESULTADOS) {
      if (result.verdict !== "nao-executavel") continue;
      expect(result.checks.some((c) => c.blockedBy !== undefined)).toBe(true);
      inspecionados += 1;
    }
    expect(inspecionados, "nenhum cenário `nao-executavel` foi inspecionado").toBe(
      NAO_EXECUTAVEL_ESPERADO,
    );
  });

  it("todo cenário declara ao menos uma limitação — nenhum se apresenta como prova completa", () => {
    expect(RESULTADOS).toHaveLength(TOTAL_ESPERADO);
    for (const result of RESULTADOS) {
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
