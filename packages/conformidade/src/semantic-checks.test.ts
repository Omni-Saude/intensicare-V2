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

/**
 * Cardinalidade FIXADA das verificações semânticas, por dimensão, e o total.
 *
 * Em LITERAL de propósito. A asserção que existia no fim do teste de vacuidade
 * (`expect(verificacoesInspecionadas).toBeGreaterThanOrEqual(results.length)`)
 * era MORTA: o laço já assere `checks.length > 0` para CADA dimensão, portanto
 * cada iteração soma ao menos 1 ao contador e a comparação não podia falhar.
 * Uma asserção que não pode falhar, dentro do teste cujo propósito declarado é
 * impedir vacuidade, é o próprio defeito que ele existe para pegar.
 *
 * Derivar o esperado de `results` — como `results.length` fazia — reintroduz a
 * circularidade: o dado sob teste não pode ser a fonte da própria expectativa.
 * Com o literal, perder uma verificação (ou uma dimensão inteira) fica VERMELHO.
 */
const VERIFICACOES_POR_DIMENSAO = {
  identidade: 4,
  encontro: 2,
  timestamp: 4,
  unidade: 2,
  proveniencia: 6,
  replay: 4,
} as const;

const TOTAL_DE_VERIFICACOES = 22;

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
    // O próprio teste passava por vacuidade: `results` VAZIO é um estado
    // alcançável e documentado — `runner.test.ts` ("fixture adulterada em
    // BYTES") assere `expect(tampered.semantics).toEqual([])`. Sem as guardas
    // abaixo, uma execução que não produzisse nenhuma dimensão (ou uma
    // dimensão sem nenhuma verificação) satisfaria o teste chamado
    // "nenhuma verificação passa por vacuidade".
    expect(results.length, "nenhuma dimensão semântica foi produzida").toBeGreaterThan(0);

    let verificacoesInspecionadas = 0;
    for (const result of results) {
      expect(
        result.checks.length,
        `a dimensão '${result.dimension}' não produziu nenhuma verificação`,
      ).toBeGreaterThan(0);
      for (const check of result.checks) {
        expect(check.evidence.trim().length).toBeGreaterThan(20);
        verificacoesInspecionadas += 1;
      }
    }
    // O conjunto de verificações não pode encolher em silêncio: perder uma
    // verificação É a vacuidade que este teste existe para impedir. A asserção
    // que estava aqui era morta (ver nota em VERIFICACOES_POR_DIMENSAO).
    expect(
      Object.fromEntries(
        results.map((result) => [result.dimension, result.checks.length] as const),
      ),
      "a distribuição de verificações semânticas por dimensão mudou",
    ).toEqual(VERIFICACOES_POR_DIMENSAO);

    // Distinto do anterior, e não redundante: o mapa acima lê `checks.length`,
    // enquanto este contador só cresce DENTRO do laço interno. Ele prova que a
    // asserção de evidência executou 22 vezes — que o corpo rodou, não apenas
    // que o dado tinha o tamanho certo.
    expect(
      verificacoesInspecionadas,
      "a asserção de evidência não executou uma vez por verificação",
    ).toBe(TOTAL_DE_VERIFICACOES);
  });
});
