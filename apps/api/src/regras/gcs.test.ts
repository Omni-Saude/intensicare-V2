/**
 * Testes do adaptador do RULE-GCS 0.2.0 (kernel ↔ contrato pt-BR próprio).
 *
 * Funções puras — sem banco, sem rede. Provam que o GCS está integrado com
 * seus estados, razões de NT, sedação e temporalidade EXATAMENTE como o
 * kernel os define, e que seu resultado não empresta nem cede campo algum
 * ao NEWS2.
 */
import { SYNTHETIC_CONCEPTS } from "@intensicare/fixtures-sinteticas";
import {
  GCS_RULE_ID,
  GCS_RULE_VERSION,
  GCS_SEDATION_RASS_THRESHOLD,
  NT_REASON_LABEL_PT,
} from "@intensicare/kernel-clinico";
import type { ClinicalObservationRow } from "@intensicare/persistencia";
import { describe, expect, it } from "vitest";
import { evaluateEncounter, toResultadoAvaliacao } from "../avaliacao.js";
import {
  CHAVE_GCS,
  CONCEITO_COMPONENTE_GCS,
  CONCEITO_RASS,
  evaluateEncounterGcs,
  type InsumoGcs,
  mapStatusGcs,
  toComponenteGcs,
  toResultadoAvaliacaoGcs,
} from "./gcs.js";

const AVALIACAO = "2026-08-16T12:00:00.000Z";
const OBS_TIME = "2026-08-16T11:58:00.000Z";

function linha(
  concept: string,
  sourceValue: number | null,
  sourceUnit: string | null,
  sourceCode: string | null = null,
): ClinicalObservationRow {
  return {
    id: `SYNTH-OBS-${concept}`,
    tenantId: "SYNTH-TENANT-G7",
    encounterId: "SYNTH-TENANT-G7-ENC-P002",
    concept,
    sourceValue,
    sourceUnit,
    sourceCode,
    canonicalValue: null,
    canonicalUnit: null,
    quality: "valid",
    effectiveAt: { kind: "present", instant: { utc: OBS_TIME, offset: "+00:00" } },
  };
}

/** E4 V5 M6 + RASS 0 — série completa e contemporânea. */
function serieGcs(): ClinicalObservationRow[] {
  return [
    linha(CONCEITO_COMPONENTE_GCS.eye, 4, "{score}"),
    linha(CONCEITO_COMPONENTE_GCS.verbal, 5, "{score}"),
    linha(CONCEITO_COMPONENTE_GCS.motor, 6, "{score}"),
    linha(CONCEITO_RASS, 0, "1"),
  ];
}

function insumo(overrides: Partial<InsumoGcs> = {}): InsumoGcs {
  return {
    observacoes: serieGcs(),
    contexto: { idadeAnos: 58 },
    exposicaoSedativa: "none_active",
    ...overrides,
  };
}

describe("mapeamento de conceito persistido → componente do kernel", () => {
  it("mapeia os três componentes e ignora conceito que não é do GCS", () => {
    expect(toComponenteGcs(linha(CONCEITO_COMPONENTE_GCS.eye, 4, "{score}"))?.component).toBe(
      "eye",
    );
    expect(toComponenteGcs(linha(CONCEITO_COMPONENTE_GCS.verbal, 5, "{score}"))?.component).toBe(
      "verbal",
    );
    expect(toComponenteGcs(linha(CONCEITO_COMPONENTE_GCS.motor, 6, "{score}"))?.component).toBe(
      "motor",
    );
    expect(toComponenteGcs(linha(SYNTHETIC_CONCEPTS.heartRate, 80, "bpm"))).toBeNull();
  });

  it("aceita razão de NT SOMENTE do conjunto governado do kernel", () => {
    const nt = toComponenteGcs(
      linha(CONCEITO_COMPONENTE_GCS.verbal, null, null, "endotracheal_intubation"),
    );
    expect(nt?.value).toEqual({ kind: "not_testable", ntReason: "endotracheal_intubation" });

    // Código fora do conjunto NÃO é traduzido para nenhum motivo — traduzir
    // seria inventar mapeamento. Segue como quantidade não numérica e o
    // kernel o classifica fail-closed.
    const desconhecido = toComponenteGcs(
      linha(CONCEITO_COMPONENTE_GCS.verbal, null, null, "SYNTH-motivo-inexistente"),
    );
    expect(desconhecido?.value.kind).toBe("score");
  });
});

describe("avaliação real de GCS (kernel RULE-GCS)", () => {
  it("série completa, RASS pareado e sem sedativo → valido, total 15, SEM banda", () => {
    const registro = evaluateEncounterGcs(insumo(), AVALIACAO);
    expect(registro.status).toBe("valid");
    expect(registro.total).toBe(15);
    expect(registro.assessability).toBe("testable");

    const resultado = toResultadoAvaliacaoGcs(registro);
    expect(resultado.status).toBe("valido");
    expect(resultado.total).toBe(15);
    expect(resultado.versaoRegra).toBe(`${GCS_RULE_ID}@${GCS_RULE_VERSION}`);
    expect(resultado.versaoRegra).toBe(CHAVE_GCS);
    expect(resultado.componentes).toHaveLength(3);

    // A RULE-GCS 0.2.0 não define disparo nem banda. Nada foi inventado.
    expect(resultado.disparo).toBe(false);
    expect(Object.keys(resultado)).not.toContain("banda");
    expect(Object.keys(resultado)).not.toContain("escore");
    expect(Object.keys(resultado)).not.toContain("parametroVermelho");
  });

  it("RASS AUSENTE com exposição desconhecida ⇒ sedation_state_unknown, sem total (ADR-0028 A28-2)", () => {
    const semRass = serieGcs().filter((l) => l.concept !== CONCEITO_RASS);
    const registro = evaluateEncounterGcs(
      { observacoes: semRass, contexto: { idadeAnos: 58 } },
      AVALIACAO,
    );
    expect(registro.assessability).toBe("sedation_state_unknown");

    const resultado = toResultadoAvaliacaoGcs(registro);
    expect(resultado.status).not.toBe("valido");
    expect(resultado.total).toBeNull();
  });

  it("RASS ≤ limiar com exposição desconhecida ⇒ sedation_confounded, sem total (ADR-0028 A28-5)", () => {
    const observacoes = serieGcs().map((l) =>
      l.concept === CONCEITO_RASS ? { ...l, sourceValue: GCS_SEDATION_RASS_THRESHOLD } : l,
    );
    const registro = evaluateEncounterGcs({ observacoes, contexto: { idadeAnos: 58 } }, AVALIACAO);
    expect(registro.assessability).toBe("sedation_confounded");
    expect(toResultadoAvaliacaoGcs(registro).total).toBeNull();
  });

  it("RASS acima do limiar destrava mesmo com exposição desconhecida — quem decide o gate é a regra", () => {
    // Comportamento do kernel (gcs.ts §4.4): RASS pareado > limiar ⇒ testável,
    // independentemente da exposição. O adaptador NÃO sobrepõe esse julgamento.
    const registro = evaluateEncounterGcs(
      { observacoes: serieGcs(), contexto: { idadeAnos: 58 } },
      AVALIACAO,
    );
    expect(registro.assessability).toBe("testable");
    expect(registro.pairedRass).toBe(0);
  });

  it("componente NÃO TESTÁVEL preserva o motivo governado e seu rótulo pt-BR do kernel", () => {
    const observacoes = [
      linha(CONCEITO_COMPONENTE_GCS.eye, 4, "{score}"),
      linha(CONCEITO_COMPONENTE_GCS.verbal, null, null, "endotracheal_intubation"),
      linha(CONCEITO_COMPONENTE_GCS.motor, 6, "{score}"),
      linha(CONCEITO_RASS, 0, "1"),
    ];
    const registro = evaluateEncounterGcs(insumo({ observacoes }), AVALIACAO);
    expect(registro.notTestableComponents).toContain("verbal");

    const resultado = toResultadoAvaliacaoGcs(registro);
    const verbal = resultado.componentes.find((c) => c.componente === "verbal");
    expect(verbal?.motivoNaoTestavel).toBe("endotracheal_intubation");
    expect(verbal?.motivoNaoTestavelPt).toBe(NT_REASON_LABEL_PT.endotracheal_intubation);
    expect(resultado.exibicaoComponentes).toContain("NT");
  });

  it("idade desconhecida ⇒ gate populacional fail-closed, sem total (HAZ-0036)", () => {
    const registro = evaluateEncounterGcs(insumo({ contexto: undefined }), AVALIACAO);
    expect(registro.populationGate.passed).toBe(false);
    expect(toResultadoAvaliacaoGcs(registro).total).toBeNull();
  });

  it("componente ausente não vira zero — total permanece null (HAZ-0005)", () => {
    const observacoes = serieGcs().filter((l) => l.concept !== CONCEITO_COMPONENTE_GCS.motor);
    const registro = evaluateEncounterGcs(insumo({ observacoes }), AVALIACAO);
    expect(registro.missingComponents).toContain("motor");
    expect(toResultadoAvaliacaoGcs(registro).total).toBeNull();
  });

  it("'partial' é inalcançável (ADR-0026 classe 4) e degrada fail-closed", () => {
    expect(mapStatusGcs("partial")).toBe("indisponivel");
    expect(mapStatusGcs("valid")).toBe("valido");
    expect(mapStatusGcs("not_evaluated")).toBe("indisponivel");
    expect(mapStatusGcs("stale")).toBe("desatualizado");
    expect(mapStatusGcs("invalid")).toBe("invalido");
  });
});

describe("independência entre NEWS2 e GCS sobre as MESMAS linhas", () => {
  const observacoes = [
    linha(SYNTHETIC_CONCEPTS.respiratoryRate, 26, "rpm"),
    linha(SYNTHETIC_CONCEPTS.oxygenSaturation, 89, "%"),
    linha("SYNTH-CONCEPT-O2-FLOW", 0, "L/min"),
    linha(SYNTHETIC_CONCEPTS.systolicBloodPressure, 92, "mmHg"),
    linha(SYNTHETIC_CONCEPTS.heartRate, 122, "bpm"),
    linha("SYNTH-CONCEPT-CONSCIOUSNESS", null, null, "A"),
    linha(SYNTHETIC_CONCEPTS.temperature, 38.3, "Cel"),
    ...serieGcs(),
  ];

  it("cada regra lê só os seus conceitos e produz sua própria versão de regra", () => {
    const news2 = toResultadoAvaliacao(
      evaluateEncounter(observacoes, { idadeAnos: 62 }, AVALIACAO),
    );
    const gcs = toResultadoAvaliacaoGcs(
      evaluateEncounterGcs(insumo({ observacoes, contexto: { idadeAnos: 62 } }), AVALIACAO),
    );

    expect(news2.versaoRegra).toBe("RULE-NEWS2@0.2.0");
    expect(gcs.versaoRegra).toBe("RULE-GCS@0.2.0");
    expect(news2.versaoRegra).not.toBe(gcs.versaoRegra);

    // NEWS2 continua com seus sete parâmetros e seu escore.
    expect(news2.parametros).toHaveLength(7);
    expect(news2.escore).toBe(11);
    // GCS continua com seus três componentes e seu total.
    expect(gcs.componentes).toHaveLength(3);
    expect(gcs.total).toBe(15);

    // Nenhum campo de um existe no outro.
    const camposNews2 = new Set(Object.keys(news2));
    const camposGcs = new Set(Object.keys(gcs));
    for (const exclusivoNews2 of ["escore", "banda", "parametroVermelho", "parametrosAusentes"]) {
      expect(camposNews2.has(exclusivoNews2)).toBe(true);
      expect(camposGcs.has(exclusivoNews2)).toBe(false);
    }
    for (const exclusivoGcs of ["total", "avaliabilidade", "componentes", "rassPareado"]) {
      expect(camposGcs.has(exclusivoGcs)).toBe(true);
      expect(camposNews2.has(exclusivoGcs)).toBe(false);
    }
  });
});
