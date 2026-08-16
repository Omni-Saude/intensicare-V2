/**
 * Testes das verificações de semântica. O ponto que estes testes protegem
 * é o mais fácil de perder de vista: **encontro** e **unidade** não podem
 * aparecer como verificados contra o contrato AMH, porque o contrato v1
 * não os carrega.
 */
import { describe, expect, it } from "vitest";
import { loadPinnedFixtures } from "./pinned-fixtures.js";
import { runSemanticChecks } from "./semantic-checks.js";

const results = runSemanticChecks(loadPinnedFixtures());

function dimension(name: string) {
  const found = results.find((result) => result.dimension === name);
  if (!found) throw new Error(`dimensão semântica ausente: ${name}`);
  return found;
}

describe("verificações de semântica", () => {
  it("cobre as seis dimensões exigidas", () => {
    expect(results.map((r) => r.dimension)).toEqual([
      "identidade",
      "encontro",
      "timestamp",
      "unidade",
      "proveniencia",
      "replay",
    ]);
  });

  it("identidade, timestamp, proveniência e replay são verificados sobre as fixtures pinadas", () => {
    for (const name of ["identidade", "timestamp", "proveniencia", "replay"]) {
      expect(dimension(name).subject).toBe("contrato-amh (fixtures pinadas)");
      expect(dimension(name).checks.some((c) => c.status === "passou")).toBe(true);
    }
  });

  it("ENCONTRO não é verificável contra o contrato — o envelope v1 não o carrega (L-03)", () => {
    const encounter = dimension("encontro");
    expect(encounter.subject).toBe("modelo canônico V2 (cenário SYNTH G7)");
    const contractCheck = encounter.checks.find((c) => c.id === "SEM-ENC.1");
    expect(contractCheck?.status).toBe("nao-executavel");
    expect(contractCheck?.blockedBy).toBe("campo-inexistente-no-contrato");
    expect(contractCheck?.evidence).toContain("L-03");
  });

  it("UNIDADE não é verificável contra o contrato — `Observation` está excluída do v1", () => {
    const unit = dimension("unidade");
    expect(unit.subject).toBe("modelo canônico V2 (cenário SYNTH G7)");
    const contractCheck = unit.checks.find((c) => c.id === "SEM-UN.1");
    expect(contractCheck?.status).toBe("nao-executavel");
    expect(contractCheck?.blockedBy).toBe("campo-inexistente-no-contrato");
  });

  it("o critério de aceitação do replay permanece bloqueado por IF-07", () => {
    const replay = dimension("replay");
    const acceptance = replay.checks.find((c) => c.id === "SEM-RPL.4");
    expect(acceptance?.status).toBe("nao-executavel");
    expect(acceptance?.blockedBy).toBe("interface-inexistente");
  });

  it("a perda L-01 (offset/precisão do tempo) é declarada, nunca inferida", () => {
    const precision = dimension("timestamp").checks.find((c) => c.id === "SEM-TS.4");
    expect(precision?.status).toBe("nao-executavel");
    expect(precision?.evidence).toContain("L-01");
  });

  it("nenhuma verificação semântica passa por vacuidade (toda passagem tem evidência)", () => {
    for (const result of results) {
      for (const check of result.checks) {
        expect(check.evidence.trim().length).toBeGreaterThan(20);
      }
    }
  });
});
