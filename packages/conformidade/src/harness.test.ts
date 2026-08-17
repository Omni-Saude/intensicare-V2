/**
 * Testes da REGRA DE VEREDITO. Um harness cujo veredito é generoso é pior
 * que nenhum harness: ele produz alegação de conformidade a partir de
 * execução parcial.
 */
import { describe, expect, it } from "vitest";
import {
  blocked,
  type CheckResult,
  coverageOf,
  failed,
  passed,
  type ScenarioResult,
  verdictLabel,
  verdictOf,
} from "./harness.js";

const OK = passed("C1", "cláusula executável", "observado");
const NOK = failed("C2", "cláusula executável", "observado");
const BLOCKED = blocked("C3", "cláusula de produtor", "amh-indisponivel", "sem produtor");

function scenario(checks: readonly CheckResult[]): ScenarioResult {
  return {
    id: "CTS-XX",
    title: "cenário de teste da regra",
    interfaces: [],
    fixtures: [],
    requirement: "—",
    hazards: [],
    checks,
    limitations: [],
    verdict: verdictOf(checks),
    coverage: coverageOf(checks, []),
  };
}

describe("regra de veredito", () => {
  it("PASSOU exige TODAS as verificações executadas e passando", () => {
    expect(verdictOf([OK, OK])).toBe("passou");
  });

  it("execução PARCIAL nunca passa — vira NÃO EXECUTÁVEL", () => {
    expect(verdictOf([OK, BLOCKED])).toBe("nao-executavel");
  });

  it("qualquer verificação falhada domina o veredito, inclusive sobre bloqueio", () => {
    expect(verdictOf([OK, BLOCKED, NOK])).toBe("falhou");
  });

  it("ausência de verificação é NÃO EXECUTÁVEL, jamais PASSOU por vacuidade", () => {
    expect(verdictOf([])).toBe("nao-executavel");
  });
});

describe("cobertura", () => {
  it("`integral` só quando não há bloqueio NEM limitação declarada", () => {
    expect(coverageOf([OK, OK], [])).toBe("integral");
    expect(coverageOf([OK, OK], [{ cause: "amh-indisponivel", statement: "limitação" }])).toBe(
      "parcial",
    );
    expect(coverageOf([OK, BLOCKED], [])).toBe("parcial");
    expect(coverageOf([BLOCKED], [])).toBe("nenhuma");
  });
});

describe("rótulo de veredito", () => {
  it("distingue bloqueio por AMH de bloqueio por dependência interna", () => {
    expect(verdictLabel(scenario([OK, BLOCKED]))).toBe("NÃO EXECUTÁVEL SEM AMH");
    expect(
      verdictLabel(
        scenario([OK, blocked("C4", "cláusula", "fora-do-escopo-deste-pacote", "outro pacote")]),
      ),
    ).toBe("NÃO EXECUTÁVEL (dependência fora deste pacote)");
    expect(verdictLabel(scenario([OK]))).toBe("PASSOU");
    expect(verdictLabel(scenario([NOK]))).toBe("FALHOU");
  });
});
