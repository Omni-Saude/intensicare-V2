// @vitest-environment node
// Este arquivo não toca DOM em NENHUM módulo do seu grafo (verificado). Em
// jsdom ele custava a construção de um ambiente inteiro sem usá-lo — ver a
// nota "CUSTO DE AMBIENTE" em `apps/web/vitest.config.ts`.
import { describe, expect, it } from "vitest";
import { loadingStateLabel, packageVersion } from "./index.js";

describe("apps/web (fundação executável)", () => {
  it("exporta uma versão de pacote não vazia", () => {
    expect(packageVersion).toBe("0.0.0");
  });

  it("loadingStateLabel cobre os quatro estados ilustrativos, em pt-BR", () => {
    expect(loadingStateLabel("loading")).toMatch(/carregando/i);
    expect(loadingStateLabel("empty")).toMatch(/nenhum/i);
    expect(loadingStateLabel("error")).toMatch(/não foi possível/i);
    expect(loadingStateLabel("success")).toMatch(/carregado/i);
  });
});
