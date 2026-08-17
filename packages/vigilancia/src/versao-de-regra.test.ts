import { describe, expect, it } from "vitest";
import { regra, utcLocal } from "./apoio-de-teste.js";
import { criarJanela, instanteAusente, instantePresente } from "./tipos.js";
import { type AvaliacaoVersionada, vigiarVersaoDeRegra } from "./versao-de-regra.js";

const JANELA = criarJanela(utcLocal("2026-08-10", 0), utcLocal("2026-08-13", 0));

function aval(entrada: {
  readonly id: string;
  readonly encontroId?: string;
  readonly utc: string;
  readonly versao?: string;
  readonly impressao?: string;
  readonly estado?: string;
}): AvaliacaoVersionada {
  return {
    avaliacaoId: entrada.id,
    encontroId: entrada.encontroId ?? "SYNTH-ENC-01",
    instante: instantePresente(entrada.utc),
    estadoBruto: entrada.estado ?? "valido",
    regra:
      entrada.versao === undefined
        ? { tipo: "ausente", motivo: "kernel_record-sem-ruleVersion" }
        : regra(entrada.versao, entrada.impressao),
  };
}

describe("vigilância de versão de regra — uma única versão", () => {
  const vigilancia = vigiarVersaoDeRegra(JANELA, [
    aval({ id: "a1", utc: utcLocal("2026-08-10", 8), versao: "0.2.0", impressao: "sha256:aaa" }),
    aval({
      id: "a2",
      utc: utcLocal("2026-08-11", 8),
      versao: "0.2.0",
      impressao: "sha256:aaa",
      encontroId: "SYNTH-ENC-02",
    }),
  ]);

  it("registra qual versão avaliou o quê, com primeiro e último instante", () => {
    expect(vigilancia.usos).toHaveLength(1);
    const uso = vigilancia.usos[0];
    expect(uso?.chave).toBe("RULE-NEWS2@0.2.0");
    expect(uso?.avaliacoes).toBe(2);
    expect(uso?.encontrosDistintos).toBe(2);
    expect(uso?.primeiroInstanteUtc).toBe(utcLocal("2026-08-10", 8));
    expect(uso?.ultimoInstanteUtc).toBe(utcLocal("2026-08-11", 8));
    expect(uso?.porEstado).toEqual([{ chave: "valido", contagem: 2 }]);
  });

  it("não reporta mistura nem instante de virada", () => {
    expect(vigilancia.misturaDeVersoes).toBe(false);
    expect(vigilancia.instanteDeViradaUtc).toBeNull();
    expect(vigilancia.achados.map((a) => a.id)).toEqual([]);
  });
});

describe("MISTURA de versões na janela (ADR-0025 §5.2/§5.3; HAZ-0020)", () => {
  const vigilancia = vigiarVersaoDeRegra(JANELA, [
    aval({ id: "a1", utc: utcLocal("2026-08-10", 8), versao: "0.2.0", impressao: "sha256:aaa" }),
    aval({ id: "a2", utc: utcLocal("2026-08-11", 8), versao: "0.2.0", impressao: "sha256:aaa" }),
    aval({ id: "a3", utc: utcLocal("2026-08-12", 8), versao: "0.3.0", impressao: "sha256:bbb" }),
  ]);

  it("alerta a mistura e aponta o instante de virada", () => {
    expect(vigilancia.misturaDeVersoes).toBe(true);
    expect(vigilancia.instanteDeViradaUtc).toBe(utcLocal("2026-08-12", 8));
    const achado = vigilancia.achados.find((a) => a.id === "mistura-de-versoes-na-janela");
    expect(achado?.severidade).toBe("achado");
    expect(achado?.versoesEnvolvidas).toEqual(["RULE-NEWS2@0.2.0", "RULE-NEWS2@0.3.0"]);
    expect(achado?.descricao).toContain("NÃO ATRIBUÍVEL");
    expect(achado?.referenciaNormativa).toContain("HAZ-0020");
  });
});

describe("defeito E3 — a MESMA string de versão com conteúdos diferentes", () => {
  it("reporta identidade de versão inconsistente", () => {
    const vigilancia = vigiarVersaoDeRegra(JANELA, [
      aval({ id: "a1", utc: utcLocal("2026-08-10", 8), versao: "0.2.0", impressao: "sha256:aaa" }),
      aval({ id: "a2", utc: utcLocal("2026-08-11", 8), versao: "0.2.0", impressao: "sha256:zzz" }),
    ]);
    const achado = vigilancia.achados.find((a) => a.id === "identidade-de-versao-inconsistente");
    expect(achado).toBeDefined();
    expect(achado?.versoesEnvolvidas).toEqual(["RULE-NEWS2@0.2.0"]);
    expect(achado?.avaliacoesAfetadas).toBe(2);
    expect(achado?.descricao).toContain("NEWS2-v3.0.0");
    expect(vigilancia.usos[0]?.impressoesDeConteudo).toEqual(["sha256:aaa", "sha256:zzz"]);
  });

  it("sem impressão de conteúdo o defeito é INDETECTÁVEL — e isso vira lacuna declarada", () => {
    const vigilancia = vigiarVersaoDeRegra(JANELA, [
      aval({ id: "a1", utc: utcLocal("2026-08-10", 8), versao: "0.2.0" }),
    ]);
    const lacuna = vigilancia.achados.find((a) => a.id === "impressao-de-conteudo-nao-registrada");
    expect(lacuna?.severidade).toBe("lacuna");
    expect(lacuna?.descricao).toContain("ausência do achado não é evidência de ausência");
    expect(vigilancia.achados.some((a) => a.id === "identidade-de-versao-inconsistente")).toBe(
      false,
    );
  });
});

describe("avaliação sem identidade de regra — jamais atribuída por inferência", () => {
  it("vai para o balde próprio, mesmo havendo uma única versão presente", () => {
    const vigilancia = vigiarVersaoDeRegra(JANELA, [
      aval({ id: "a1", utc: utcLocal("2026-08-10", 8), versao: "0.2.0", impressao: "sha256:aaa" }),
      aval({ id: "a2", utc: utcLocal("2026-08-11", 8) }),
      aval({ id: "a3", utc: utcLocal("2026-08-11", 9) }),
    ]);
    expect(vigilancia.usos).toHaveLength(1);
    expect(vigilancia.usos[0]?.avaliacoes).toBe(1);
    expect(vigilancia.semIdentidadeDeRegra.avaliacoes).toBe(2);
    expect(vigilancia.semIdentidadeDeRegra.motivos).toEqual([
      { chave: "kernel_record-sem-ruleVersion", contagem: 2 },
    ]);
    expect(vigilancia.achados.some((a) => a.id === "avaliacoes-sem-identidade-de-regra")).toBe(
      true,
    );
  });
});

describe("janela e instantes", () => {
  it("avaliação fora da janela ou sem instante não entra na vigilância", () => {
    const vigilancia = vigiarVersaoDeRegra(JANELA, [
      aval({ id: "dentro", utc: utcLocal("2026-08-10", 8), versao: "0.2.0" }),
      aval({ id: "fora", utc: utcLocal("2026-08-20", 8), versao: "0.9.9" }),
      {
        avaliacaoId: "sem-instante",
        encontroId: "SYNTH-ENC-01",
        instante: instanteAusente("fonte-nao-enviou"),
        estadoBruto: "valido",
        regra: regra("0.9.9"),
      },
    ]);
    expect(vigilancia.totalDeAvaliacoes).toBe(1);
    expect(vigilancia.usos.map((u) => u.chave)).toEqual(["RULE-NEWS2@0.2.0"]);
  });

  it("declara que NÃO substitui a vigilância de edição de ADR-0025 §5.3", () => {
    const vigilancia = vigiarVersaoDeRegra(JANELA, []);
    expect(vigilancia.nota).toContain("NÃO substitui");
    expect(vigilancia.nota).toContain("§5.3");
    expect(vigilancia.totalDeAvaliacoes).toBe(0);
    expect(vigilancia.misturaDeVersoes).toBe(false);
  });
});
