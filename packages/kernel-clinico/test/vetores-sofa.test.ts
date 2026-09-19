/**
 * Execução red/green dos vetores de referência clínica do RULE-SOFA 0.2.0,
 * transcritos de
 * docs/05-clinical-safety/rule-releases/sofa/reference-vectors.md para
 * ./vetores-sofa.json (com proveniência no próprio arquivo).
 *
 * Corpus MÁQUINA-CONTADO: 41 vetores transcritos — 38 ATIVOS executáveis +
 * 3 APOSENTADOS (CRV-SOFA-0321→0340, 0322→0336, 0323→0335) mantidos como
 * registro histórico, sem desfecho executável (as decisões GDEC-0007
 * mudaram os desfechos; os substitutos ativos são executados).
 *
 * Disciplina do conjunto CRV (§0 do documento-fonte): a aprovação destes
 * vetores serve APENAS à autoria red/green — não é evidência clínica; a
 * autoria independente dos vetores permanece pendente
 * (authorship.independence_confirmed: false).
 */

import { describe, expect, it } from "vitest";
import { evaluateSofa, type SofaComponentId } from "../src/index.js";
import { expandirVetorSofa, type VetorSofaArquivo } from "./suporte-sofa.js";
// `with { type: "json" }` é SINTAXE de módulo ES exigida por `module:
// "NodeNext"` (ACH-O3-2) — o vitest tolera a ausência, o Node ESM estrito e
// o `tsc` exigem o atributo. NENHUM valor do vetor é tocado por esta linha.
import vetoresJson from "./vetores-sofa.json" with { type: "json" };

const vetores = vetoresJson as unknown as VetorSofaArquivo;
const ativos = vetores.vectors.filter((v) => v.retired !== true);
const aposentados = vetores.vectors.filter((v) => v.retired === true);

describe("RULE-SOFA 0.2.0 — contagem de máquina do corpus CRV-SOFA-0301..0341", () => {
  it("o conjunto transcrito tem exatamente 41 vetores, sem lacunas nem duplicatas de ID", () => {
    expect(vetores.vectors).toHaveLength(41);
    const ids = new Set(vetores.vectors.map((v) => v.id));
    expect(ids.size).toBe(41);
    for (let n = 301; n <= 341; n++) {
      expect(ids.has(`CRV-SOFA-0${n}`), `CRV-SOFA-0${n} presente`).toBe(true);
    }
  });

  it("38 vetores ATIVOS executáveis e 3 APOSENTADOS com substituto declarado", () => {
    expect(ativos).toHaveLength(38);
    expect(aposentados).toHaveLength(3);
    for (const aposentado of aposentados) {
      expect(aposentado.superseded_by, `${aposentado.id} declara substituto`).toBeTruthy();
      const substituto = vetores.vectors.find((v) => v.id === aposentado.superseded_by);
      expect(substituto, `${aposentado.superseded_by} existe no corpus`).toBeDefined();
      expect(substituto?.retired ?? false, "substituto é ativo").toBe(false);
    }
  });
});

describe("RULE-SOFA 0.2.0 — vetores de referência clínica ativos (CRV-SOFA-0301..0341)", () => {
  for (const vetor of ativos) {
    it(`${vetor.id} — ${vetor.description.slice(0, 110)}`, () => {
      const input = expandirVetorSofa(vetor.delta);
      const record = evaluateSofa(input);

      expect(record.ruleId).toBe("RULE-SOFA");
      expect(record.ruleVersion).toBe("0.2.0");

      expect(record.status, "status agregado").toBe(vetor.expected?.status);
      expect(record.total, "total").toBe(vetor.expected?.total);
      // RULE-SOFA 0.2.0 não define condição de disparo: fires é literal false.
      expect(record.fires, "fires (a regra não define alerta)").toBe(false);
      expect(record.noFireReason, "razão de não disparo").toBe(vetor.expected?.noFireReason);

      // Razões legíveis por máquina: conjunto exato (ordem canônica por componente).
      expect([...record.reasons].sort(), "razões").toEqual(
        [...(vetor.expected?.reasons ?? [])].sort(),
      );

      // Invariante HAZ-0005: status não-legível JAMAIS carrega total numérico.
      if (record.status !== "valid" && record.status !== "partial") {
        expect(record.total, "total ausente em status não legível").toBeNull();
      }
      if (vetor.expected?.status === "valid" || vetor.expected?.status === "partial") {
        expect(record.total, "total emitido sob status legível").not.toBeNull();
      }
      if (record.status === "not_evaluated" || record.status === "invalid") {
        expect(
          record.reasons.length,
          "não-legível exige ao menos uma razão (ADR-0008 N3)",
        ).toBeGreaterThan(0);
      }
      // O parcial declarado renal é LEGÍVEL com total e divulgação — a razão
      // permanece vazia e a divulgação vai nas anotações (spec §5.2).

      // Contribuições por componente esperadas (somente as pinadas pelo vetor).
      const scores = vetor.expected?.componentScores ?? {};
      for (const [componente, escore] of Object.entries(scores)) {
        const contribution = record.components.find(
          (c) => c.component === (componente as SofaComponentId),
        );
        expect(contribution, `contribuição de ${componente}`).toBeDefined();
        expect(contribution?.score, `pontuação de ${componente}`).toBe(escore);
        expect(
          contribution?.explanation.length,
          `explicação pt-BR de ${componente}`,
        ).toBeGreaterThan(0);
      }

      // Status por componente explicitamente esperado (ex.: renal parcial).
      const statusPorComponente = vetor.expected?.componentStatuses ?? {};
      for (const [componente, status] of Object.entries(statusPorComponente)) {
        const contribution = record.components.find(
          (c) => c.component === (componente as SofaComponentId),
        );
        expect(contribution?.status, `status de ${componente}`).toBe(status);
      }

      // Divulgações obrigatórias (GDEC-0007) presentes nas anotações.
      for (const disclosure of vetor.expected?.annotationsContain ?? []) {
        expect(record.annotations, `anotação obrigatória: ${disclosure}`).toContain(disclosure);
      }
    });
  }
});

describe("RULE-SOFA 0.2.0 — vetores APOSENTADOS não são executáveis (registro histórico)", () => {
  for (const vetor of aposentados) {
    it(`${vetor.id} é aposentado, declara substituto e NÃO carrega desfecho executável`, () => {
      expect(vetor.retired).toBe(true);
      expect(vetor.superseded_by).toBeTruthy();
      expect(vetor.expected).toBeNull();
    });
  }
});
