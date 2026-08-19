/**
 * Execução red/green dos 18 vetores de referência clínica ATIVOS da RULE-GCS
 * 0.2.0, transcritos de docs/05-clinical-safety/rule-releases/gcs/
 * reference-vectors.md para ./vetores-gcs.json (com proveniência no próprio
 * arquivo), mais os 2 vetores aposentados registrados como histórico.
 *
 * Disciplina do conjunto CRV (§0 do documento-fonte): a aprovação destes
 * vetores serve APENAS à autoria red/green — não é evidência clínica; a
 * autoria independente dos vetores permanece pendente
 * (`authorship.independence_confirmed: false` para todos).
 */

import { describe, expect, it } from "vitest";
import { evaluateGcs, type GcsComponentId } from "../src/index.js";
import { buildGcsVectorInput, type GcsVectorFile } from "./suporte-gcs.js";
// `with { type: "json" }` é SINTAXE de módulo ES exigida por `module:
// "NodeNext"` (ACH-O3-2) — o vitest tolerava a ausência (resolução própria,
// não passa por `tsc`); o Node ESM estrito e o `tsc` exigem o atributo.
// NENHUM valor do vetor é tocado por esta linha — só a forma do import.
import vetoresJson from "./vetores-gcs.json" with { type: "json" };

const vetores = vetoresJson as unknown as GcsVectorFile;

const ATIVOS = [
  "CRV-GCS-0201",
  "CRV-GCS-0202",
  "CRV-GCS-0203",
  "CRV-GCS-0204",
  "CRV-GCS-0205",
  "CRV-GCS-0206",
  "CRV-GCS-0207",
  "CRV-GCS-0208",
  "CRV-GCS-0209",
  "CRV-GCS-0210",
  "CRV-GCS-0212",
  "CRV-GCS-0214",
  "CRV-GCS-0215",
  "CRV-GCS-0216",
  "CRV-GCS-0217",
  "CRV-GCS-0218",
  "CRV-GCS-0219",
  "CRV-GCS-0220",
];

describe("RULE-GCS 0.2.0 — vetores de referência clínica (CRV-GCS-0201..0220)", () => {
  it("o conjunto transcrito tem exatamente os 18 vetores ativos do documento-fonte", () => {
    expect(vetores.vectors).toHaveLength(18);
    expect(vetores.vectors.map((v) => v.id)).toEqual(ATIVOS);
  });

  it("os 2 vetores aposentados estão registrados e NÃO são executados (0211→0219, 0213→0220)", () => {
    expect(vetores.retired.map((v) => `${v.id}→${v.superseded_by}`)).toEqual([
      "CRV-GCS-0211→CRV-GCS-0219",
      "CRV-GCS-0213→CRV-GCS-0220",
    ]);
    const ativos = new Set(vetores.vectors.map((v) => v.id));
    for (const aposentado of vetores.retired) {
      expect(ativos.has(aposentado.id), `${aposentado.id} não pode estar ativo`).toBe(false);
      expect(ativos.has(aposentado.superseded_by)).toBe(true);
    }
  });

  for (const vetor of vetores.vectors) {
    it(`${vetor.id} — ${vetor.description.slice(0, 110)}`, () => {
      const record = evaluateGcs(buildGcsVectorInput(vetor.delta));

      expect(record.ruleId).toBe("RULE-GCS");
      expect(record.ruleVersion).toBe("0.2.0");

      expect(record.status, "status agregado").toBe(vetor.expected.status);
      expect(record.total, "total").toBe(vetor.expected.total);
      expect(record.primaryReason, "razão dominante").toBe(vetor.expected.primaryReason);
      expect([...record.reasons].sort(), "conjunto exato de razões").toEqual(
        [...vetor.expected.reasons].sort(),
      );
      expect(record.assessability, "estado de avaliabilidade").toBe(vetor.expected.assessability);
      expect(record.noFireReason, "motivo de não disparo").toBe(vetor.expected.noFireReason);
      expect(record.fires, "RULE-GCS 0.2.0 não define condição de disparo").toBe(false);

      if (vetor.expected.pairedRass !== undefined) {
        expect(record.pairedRass, "RASS pareado").toBe(vetor.expected.pairedRass);
      }
      if (vetor.expected.componentDisplay !== undefined) {
        expect(record.componentDisplay, "convenção de exibição (A28-8)").toBe(
          vetor.expected.componentDisplay,
        );
      }

      for (const [component, status] of Object.entries(vetor.expected.componentStatuses)) {
        const contribution = record.components.find(
          (c) => c.component === (component as GcsComponentId),
        );
        expect(contribution, `contribuição de ${component}`).toBeDefined();
        expect(contribution?.status, `status do componente ${component}`).toBe(status);
      }
      if (vetor.expected.componentValues !== undefined) {
        for (const [component, value] of Object.entries(vetor.expected.componentValues)) {
          const contribution = record.components.find(
            (c) => c.component === (component as GcsComponentId),
          );
          expect(contribution?.value, `valor exibido do componente ${component}`).toBe(value);
        }
      }

      // Invariante HAZ-0005: status não-válido JAMAIS carrega total numérico e
      // sempre carrega ao menos uma razão legível por máquina (ADR-0008 N3).
      if (record.status !== "valid") {
        expect(record.total).toBeNull();
        expect(record.reasons.length).toBeGreaterThan(0);
        expect(record.primaryReason).not.toBeNull();
      } else {
        expect(record.reasons).toHaveLength(0);
        expect(record.total).not.toBeNull();
      }

      // Toda contribuição tem explicação pt-BR não vazia (spec §10).
      for (const contribution of record.components) {
        expect(contribution.explanation.length).toBeGreaterThan(0);
      }
      expect(record.explanation.length).toBeGreaterThan(0);
      expect(record.explanation).toContain("RULE-GCS");
    });
  }
});
