/**
 * Testes do PROVEDOR do RULE-SOFA 0.2.0 (`./sofa.ts`): identidade tomada do
 * kernel, digest de entradas canônico (sem PHI, sem identificador de
 * sujeito), verificação de motor contra o `behaviorHash` pinado e o
 * caminho de recusa fail-closed.
 *
 * A realidade de DESPACHO (registrado + bloqueado, sombra rotulada, recusa
 * com `assinatura_ausente_adr0007_c5`) é provada em `registro.test.ts`.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BLOQUEIO_ASSINATURA_AUSENTE,
  CHAVE_SOFA,
  criarProvedorSofa,
  IDENTIDADE_SOFA,
  montarManifestoSofa,
  portaDeBundleNaoAssinado,
} from "./index.js";

const AUTORIA = "2026-09-19T09:00:00.000Z";

const CAMINHO_VETORES_SOFA = fileURLToPath(
  new URL("../../../../packages/kernel-clinico/test/vetores-sofa.json", import.meta.url),
);

const { manifesto: MANIFESTO_SOFA, vetores: VETORES_SOFA } = montarManifestoSofa({
  jsonDeVetores: readFileSync(CAMINHO_VETORES_SOFA, "utf8"),
  authoredAt: AUTORIA,
});

function painelSintetico() {
  const proc = { sourceSystem: "SYNTH-amh-01", sourceDataQuality: "valid" } as const;
  const T = "2026-09-19T12:00:00.000Z";
  const q = (value: number, unit: string, minutosAtras: number) => ({
    value,
    unit,
    effectiveTime: new Date(Date.parse(T) - minutosAtras * 60_000).toISOString(),
    provenance: proc,
  });
  return {
    evaluationTime: T,
    age: { kind: "verified" as const, years: 64 },
    pao2: [q(96, "mm[Hg]", 240)],
    fio2: [q(0.21, "1", 240)],
    respiratorySupportStatus: {
      value: "none" as const,
      effectiveTime: q(0, "", 240).effectiveTime,
      provenance: proc,
    },
    platelets: [q(250, "10*3/uL", 360)],
    bilirubin: [q(0.6, "mg/dL", 360)],
    map: {
      kind: "measured" as const,
      value: 85,
      unit: "mm[Hg]",
      effectiveTime: q(0, "mm[Hg]", 120).effectiveTime,
      provenance: proc,
    },
    vasoactiveAgents: [],
    gcsTotal: q(15, "{score}", 180),
    rass: { value: 0, effectiveTime: q(0, "", 180).effectiveTime, provenance: proc },
    sedativeExposure: "none_active" as const,
    creatinine: [q(0.8, "mg/dL", 360)],
    urineOutput24h: {
      value: 1800,
      unit: "mL",
      intervalStart: new Date(Date.parse(T) - 26 * 3_600_000).toISOString(),
      intervalEnd: new Date(Date.parse(T) - 2 * 3_600_000).toISOString(),
      provenance: proc,
    },
  };
}

describe("provedor do RULE-SOFA 0.2.0 — identidade e carimbo", () => {
  it("identidade tomada do kernel — nunca redigitada", () => {
    expect(IDENTIDADE_SOFA).toEqual({ ruleId: "RULE-SOFA", ruleVersion: "0.2.0" });
    expect(CHAVE_SOFA).toBe("RULE-SOFA@0.2.0");
  });

  it("avalia o kernel REAL: painel normal → seis zeros, valid, fires false", () => {
    const provedor = criarProvedorSofa({
      porta: portaDeBundleNaoAssinado({
        identidade: IDENTIDADE_SOFA,
        manifesto: MANIFESTO_SOFA,
        justificativaAdrC5: "justificativa SYNTH — mecanismo",
      }),
      vetores: VETORES_SOFA,
    });

    const saida = provedor.avaliar(painelSintetico(), "2026-09-19T12:00:00.000Z");
    expect(saida.registroKernel.ruleId).toBe("RULE-SOFA");
    expect(saida.registroKernel.ruleVersion).toBe("0.2.0");
    expect(saida.registroKernel.status).toBe("valid");
    expect(saida.registroKernel.total).toBe(0);
    expect(saida.registroKernel.fires).toBe(false);
    expect(provedor.razoesDe(saida)).toEqual([]);
  });
});

describe("digest de entradas do SOFA — canônico, estável, sem PHI", () => {
  it("mesma entrada ⇒ mesmo digest; entrada distinta ⇒ digest distinto", () => {
    const provedor = criarProvedorSofa({
      porta: portaDeBundleNaoAssinado({
        identidade: IDENTIDADE_SOFA,
        manifesto: MANIFESTO_SOFA,
        justificativaAdrC5: "justificativa SYNTH — mecanismo",
      }),
      vetores: VETORES_SOFA,
    });

    const a = provedor.digestDeEntradas(painelSintetico());
    const b = provedor.digestDeEntradas(painelSintetico());
    expect(a).toEqual(b);
    expect(a.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(a.total).toBeGreaterThan(0);

    const divergente = provedor.digestDeEntradas({
      ...painelSintetico(),
      gcsTotal: undefined,
      rass: null,
    });
    expect(divergente.digest).not.toBe(a.digest);
  });

  it("o digest não carrega identificador de sujeito nem texto livre", () => {
    const provedor = criarProvedorSofa({
      porta: portaDeBundleNaoAssinado({
        identidade: IDENTIDADE_SOFA,
        manifesto: MANIFESTO_SOFA,
        justificativaAdrC5: "justificativa SYNTH — mecanismo",
      }),
      vetores: VETORES_SOFA,
    });

    const digest = provedor.digestDeEntradas(painelSintetico()).digest;
    // Digest irreversível: nenhuma substring do insumo pode reaparecer.
    expect(digest).not.toContain("SYNTH");
    expect(digest).not.toContain("mm[Hg]");
  });
});

describe("verificação de motor do SOFA — QAS-0011", () => {
  it("com vetores fornecidos e hash pinado: motor verificado", () => {
    const provedor = criarProvedorSofa({
      porta: portaDeBundleNaoAssinado({
        identidade: IDENTIDADE_SOFA,
        manifesto: MANIFESTO_SOFA,
        justificativaAdrC5: "justificativa SYNTH — mecanismo",
      }),
      vetores: VETORES_SOFA,
    });

    const resultado = provedor.verificarMotor({
      versaoBundle: "0.2.0",
      digestManifesto: null,
      behaviorHash: MANIFESTO_SOFA.logic.behaviorHash,
      assinatura: "assinatura_ausente",
      autorKeyId: null,
      aprovadorKeyId: null,
      bloqueiosDeAtivacao: [BLOQUEIO_ASSINATURA_AUSENTE],
      ativoDesde: AUTORIA,
    });
    expect(resultado.ok).toBe(true);
  });

  it("sem vetores fornecidos: RECUSA fail-closed — motor não verificado nunca avalia", () => {
    const provedor = criarProvedorSofa({
      porta: portaDeBundleNaoAssinado({
        identidade: IDENTIDADE_SOFA,
        manifesto: MANIFESTO_SOFA,
        justificativaAdrC5: "justificativa SYNTH — mecanismo",
      }),
    });

    const resultado = provedor.verificarMotor({
      versaoBundle: "0.2.0",
      digestManifesto: null,
      behaviorHash: MANIFESTO_SOFA.logic.behaviorHash,
      assinatura: "assinatura_ausente",
      autorKeyId: null,
      aprovadorKeyId: null,
      bloqueiosDeAtivacao: [BLOQUEIO_ASSINATURA_AUSENTE],
      ativoDesde: AUTORIA,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.obtido).toContain("vetores do test pack não fornecidos");
    }
  });

  it("proveniência sem behaviorHash: RECUSA — nada é verificável sem hash pinado", () => {
    const provedor = criarProvedorSofa({
      porta: portaDeBundleNaoAssinado({
        identidade: IDENTIDADE_SOFA,
        manifesto: MANIFESTO_SOFA,
        justificativaAdrC5: "justificativa SYNTH — mecanismo",
      }),
      vetores: VETORES_SOFA,
    });

    const resultado = provedor.verificarMotor({
      versaoBundle: null,
      digestManifesto: null,
      behaviorHash: null,
      assinatura: "sem_bundle",
      autorKeyId: null,
      aprovadorKeyId: null,
      bloqueiosDeAtivacao: [],
      ativoDesde: null,
    });
    expect(resultado.ok).toBe(false);
  });
});
