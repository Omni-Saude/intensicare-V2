/**
 * Execução red/green dos 93 vetores de referência clínica do RULE-NEWS2 0.2.0,
 * transcritos de docs/05-clinical-safety/rule-releases/news2/reference-vectors.md
 * para ./vetores-news2.json (com proveniência no próprio arquivo).
 *
 * Disciplina do conjunto CRV (§0 do documento-fonte): a aprovação destes
 * vetores serve APENAS à autoria red/green — não é evidência clínica; a
 * autoria independente dos vetores permanece pendente.
 */

import { describe, expect, it } from "vitest";
import { evaluateNews2, type News2ParameterId } from "../src/index.js";
import { buildVectorInput, type VectorFile } from "./suporte.js";
// `with { type: "json" }` é SINTAXE de módulo ES exigida por `module:
// "NodeNext"` (ACH-O3-2) — o vitest tolerava a ausência (resolução própria,
// não passa por `tsc`); o Node ESM estrito e o `tsc` exigem o atributo.
// NENHUM valor do vetor é tocado por esta linha — só a forma do import.
import vetoresJson from "./vetores-news2.json" with { type: "json" };

const vetores = vetoresJson as unknown as VectorFile;

describe("RULE-NEWS2 0.2.0 — vetores de referência clínica (CRV-NEWS2-0101..0193, 0201..0211)", () => {
  it("o conjunto tem exatamente 104 vetores (93 CRV originais + 11 de gatilho de borda), sem lacunas de ID", () => {
    expect(vetores.vectors).toHaveLength(104);
    const ids = new Set(vetores.vectors.map((v) => v.id));
    for (let n = 101; n <= 193; n++) {
      expect(ids.has(`CRV-NEWS2-0${n}`), `CRV-NEWS2-0${n} presente`).toBe(true);
    }
    for (let n = 201; n <= 211; n++) {
      expect(ids.has(`CRV-NEWS2-0${n}`), `CRV-NEWS2-0${n} presente`).toBe(true);
    }
  });

  for (const vetor of vetores.vectors) {
    it(`${vetor.id} — ${vetor.description.slice(0, 110)}`, () => {
      const input = buildVectorInput(vetor.delta);
      const record = evaluateNews2(input);

      expect(record.ruleId).toBe("RULE-NEWS2");
      expect(record.ruleVersion).toBe("0.2.0");

      expect(record.status, "status agregado").toBe(vetor.expected.status);
      expect(record.totalScore, "total").toBe(vetor.expected.total);
      expect(record.riskTier, "tier").toBe(vetor.expected.tier);
      expect(record.fires, "fires (condição de exibição consultiva)").toBe(vetor.expected.fires);
      expect(record.redParameter, "parâmetro vermelho").toBe(vetor.expected.redParameter);

      // Razões legíveis por máquina: conjunto exato (ordem canônica por parâmetro).
      expect([...record.reasons].sort(), "razões").toEqual([...vetor.expected.reasons].sort());

      // Invariante HAZ-0005: status não-válido JAMAIS carrega total numérico.
      if (record.status !== "valid") {
        expect(record.totalScore).toBeNull();
        expect(record.riskTier).toBeNull();
        expect(
          record.reasons.length,
          "não-válido exige ao menos uma razão (ADR-0008 N3)",
        ).toBeGreaterThan(0);
      }

      // Contribuições por parâmetro esperadas.
      if (vetor.expected.paramScores !== undefined) {
        for (const [param, score] of Object.entries(vetor.expected.paramScores)) {
          const contribution = record.parameters.find(
            (c) => c.parameter === (param as News2ParameterId),
          );
          expect(contribution, `contribuição de ${param}`).toBeDefined();
          expect(contribution?.score, `pontuação de ${param}`).toBe(score);
          expect(contribution?.explanation.length, `explicação pt-BR de ${param}`).toBeGreaterThan(
            0,
          );
        }
      }

      // Anotações obrigatórias esperadas (ex.: "gravidez não verificada").
      if (vetor.expected.annotations !== undefined) {
        for (const annotation of vetor.expected.annotations) {
          expect(record.annotations).toContain(annotation);
        }
      }

      // Insumos ausentes são DECLARADOS, nunca silenciosos.
      for (const reason of vetor.expected.reasons) {
        if (reason.startsWith("missing_required_input:")) {
          const param = reason.split(":")[1] as News2ParameterId;
          expect(record.missingInputs).toContain(param);
        }
      }

      // Gatilho de borda (catálogo irmão ALERT-EWS-NEWS2-DETERIORATION-01):
      // veredito presente quando o vetor o declara — cruzamento ascendente
      // do total ou novo parâmetro vermelho, NUNCA patamar estático.
      if (vetor.expected.alertCrossing !== undefined) {
        expect(record.alertCrossing, "gatilho de borda (alertCrossing)").toBe(
          vetor.expected.alertCrossing,
        );
        expect(record.alertCrossingReason, "motivo do gatilho").toBe(
          vetor.expected.alertCrossingReason ?? null,
        );
      }
    });
  }
});
