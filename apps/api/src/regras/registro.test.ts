/**
 * Testes de aceite do REGISTRO/DESPACHANTE de regras (achado §6.4, P1).
 *
 * Cobrem, na ordem do despacho: regra não registrada; bundle real do NEWS2
 * (não acionável) em sombra rotulada; assinatura adulterada; chave
 * desconhecida; kill switch (as DUAS primitivas); rollback provado por
 * `behaviorHash`; motor divergente; e coexistência NEWS2/GCS sem
 * contaminação.
 *
 * Todo artefato de mecanismo é sintético (prefixo `SYNTH-`). Os pares de
 * chaves são efêmeros e existem para EXERCITAR o mecanismo de assinatura —
 * jamais como evidência de aprovação: a condição C1 da ADR-0007 (segundo
 * revisor clínico real) e a C5 (custódia de chave) permanecem ABERTAS.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SYNTHETIC_CONCEPTS } from "@intensicare/fixtures-sinteticas";
import {
  createClinicalRuleSwitchboard,
  createInMemoryTelemetry,
} from "@intensicare/observabilidade";
import type { ClinicalObservationRow } from "@intensicare/persistencia";
import {
  type ApprovedBundle,
  buildKeyring,
  createDraft,
  generateEphemeralKeyPair,
  RuleActivationLedger,
  type RuleBundleManifest,
  signAsApprover,
  signAsAuthor,
} from "@intensicare/rule-bundle";
import { describe, expect, it } from "vitest";
import {
  BLOQUEIO_ASSINATURA_AUSENTE,
  CHAVE_GCS,
  CHAVE_NEWS2,
  chaveRegra,
  criarProvedorNews2,
  despacharGcs,
  despacharNews2,
  type IdentidadeRegra,
  montarManifestoNews2,
  montarRegistroDeRegras,
  type PortaDeBundle,
  type ProvedorDeRegra,
  portaDeBundleAusente,
  portaDeBundleDoLivroRazao,
  portaDeBundleNaoAssinado,
  RegistroDeRegras,
  RegraNaoRegistradaError,
  ROTULO_SOMBRA_PT,
  registrarBundleAprovado,
} from "./index.js";

// ---------------------------------------------------------------------------
// Instantes e insumos
// ---------------------------------------------------------------------------

const AUTORIA = "2026-08-16T09:00:00.000Z";
const REVISAO = "2026-08-16T10:00:00.000Z";
const ATIVACAO = "2026-08-16T11:00:00.000Z";
const AVALIACAO = "2026-08-16T12:00:00.000Z";
const OBS_TIME = "2026-08-16T11:58:00.000Z";
const KILL = "2026-08-16T13:00:00.000Z";

const CORRELACAO = "SYNTH-CORR-0001";
const CONTEXTO = { instanteIso: AVALIACAO, correlacaoId: CORRELACAO } as const;

const AUTORIZACAO = {
  authorizedBy: "SYNTH-autoridade-de-ativacao-01",
  privacySecurityCoAuthorization: "SYNTH-co-autorizacao-privacidade-seguranca-01",
} as const;

const APROVACAO = {
  approverRole:
    "SYNTH — aprovador independente FICTÍCIO. Nenhum segundo revisor clínico real existe " +
    "(ADR-0007 C1, aberta); esta contra-assinatura exercita o mecanismo e não é aprovação clínica.",
  reviewStatement: "SYNTH — revisão fictícia de mecanismo. NÃO é aprovação clínica de nada.",
  reviewedAt: REVISAO,
  outstandingConditions: [
    "C1 (segundo revisor clínico real) permanece aberta",
    "C5 (custódia de chave, ADR-0022) permanece aberta",
  ],
} as const;

const CAMINHO_VETORES = fileURLToPath(
  new URL("../../../../packages/kernel-clinico/test/vetores-news2.json", import.meta.url),
);

const { manifesto: MANIFESTO_NEWS2, vetores: VETORES_NEWS2 } = montarManifestoNews2({
  jsonDeVetores: readFileSync(CAMINHO_VETORES, "utf8"),
  authoredAt: AUTORIA,
});

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

/** Série NEWS2 completa (deterioração T2 do cenário G7). */
function serieNews2(): ClinicalObservationRow[] {
  return [
    linha(SYNTHETIC_CONCEPTS.respiratoryRate, 26, "rpm"),
    linha(SYNTHETIC_CONCEPTS.oxygenSaturation, 89, "%"),
    linha("SYNTH-CONCEPT-O2-FLOW", 0, "L/min"),
    linha(SYNTHETIC_CONCEPTS.systolicBloodPressure, 92, "mmHg"),
    linha(SYNTHETIC_CONCEPTS.heartRate, 122, "bpm"),
    linha("SYNTH-CONCEPT-CONSCIOUSNESS", null, null, "A"),
    linha(SYNTHETIC_CONCEPTS.temperature, 38.3, "Cel"),
  ];
}

/** Série GCS completa, no MESMO encontro. */
function serieGcs(): ClinicalObservationRow[] {
  return [
    linha("SYNTH-CONCEPT-GCS-EYE", 4, "{score}"),
    linha("SYNTH-CONCEPT-GCS-VERBAL", 5, "{score}"),
    linha("SYNTH-CONCEPT-GCS-MOTOR", 6, "{score}"),
    linha("SYNTH-CONCEPT-RASS", 0, "1"),
  ];
}

const INSUMO_NEWS2 = { observacoes: serieNews2(), contexto: { idadeAnos: 62 } } as const;

// ---------------------------------------------------------------------------
// Bundle real do NEWS2, assinado com pares efêmeros
// ---------------------------------------------------------------------------

function assinarNews2(manifesto: RuleBundleManifest = MANIFESTO_NEWS2): {
  readonly aprovado: ApprovedBundle;
  readonly chaveiroCompleto: ReturnType<typeof buildKeyring>;
  readonly chaveVerificacaoAprovador: ReturnType<typeof generateEphemeralKeyPair>;
} {
  const autor = generateEphemeralKeyPair("SYNTH-chave-autor-de-regra-01");
  const aprovador = generateEphemeralKeyPair("SYNTH-chave-aprovador-independente-02");
  const autorado = signAsAuthor(createDraft(manifesto), autor.signingKey, AUTORIA);
  const aprovado = signAsApprover(autorado, aprovador.signingKey, APROVACAO);
  return {
    aprovado,
    chaveiroCompleto: buildKeyring([autor.verificationKey, aprovador.verificationKey]),
    chaveVerificacaoAprovador: aprovador,
  };
}

/** Livro-razão com o bundle real do NEWS2 registrado e ativado em SOMBRA. */
function livroNews2Ativado(): RuleActivationLedger {
  const livro = new RuleActivationLedger("RULE-NEWS2", "dev", "SYNTH-unidade-01");
  const { aprovado, chaveiroCompleto } = assinarNews2();
  const registro = registrarBundleAprovado(livro, aprovado, chaveiroCompleto);
  expect(registro.ok, "bundle real do NEWS2 admitido no livro-razão").toBe(true);
  livro.activate({
    version: "0.2.0",
    mode: "shadow",
    occurredAt: ATIVACAO,
    reason: "SYNTH — ativação em sombra para exercitar o despachante; nenhuma via acionável",
    ...AUTORIZACAO,
  });
  return livro;
}

function portaNews2Ativa(): PortaDeBundle {
  return portaDeBundleDoLivroRazao({
    identidade: { ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" },
    livro: livroNews2Ativado(),
  });
}

// ---------------------------------------------------------------------------
// Regra SINTÉTICA de mecanismo — zero conteúdo clínico
// ---------------------------------------------------------------------------

const IDENTIDADE_SINT: IdentidadeRegra = { ruleId: "RULE-SYNTH-DESPACHO", ruleVersion: "1.0.0" };

/**
 * Manifesto estruturalmente válido de uma regra FICTÍCIA, para exercitar
 * rollback e `behaviorHash` sem tocar em nenhum artefato clínico. Nenhum
 * valor aqui tem significado clínico e nada aqui pode ser citado como regra.
 */
function manifestoSintetico(versao: string, behaviorHash: string): RuleBundleManifest {
  return {
    schema: { format: "intensicare.rule-bundle", formatVersion: "1.0.0" },
    bundleId: `${IDENTIDADE_SINT.ruleId}@${versao}`,
    authoredAt: AUTORIA,
    identity: {
      ruleId: IDENTIDADE_SINT.ruleId,
      ruleVersion: versao,
      canonicalEdition: "SYNTH — edição fictícia de teste, sem fonte clínica",
      editionCitation: "SYNTH — sem citação: este artefato não representa nenhuma regra real",
      isVariantOfCanonicalEdition: false,
      declaredDivergences: [],
    },
    intendedUse: {
      statement: "SYNTH — fixture estrutural; nenhum uso clínico pretendido ou permitido",
      population: "SYNTH — nenhuma",
      exclusions: ["SYNTH — todas"],
      evidencedPopulatedSource: false,
      admittedByGateG2: false,
      actionabilityClassification: "NOT ACTIONABLE — fixture de teste",
    },
    evidence: {
      primarySource: "SYNTH — nenhuma fonte primária",
      citation: "SYNTH",
      issuerUrl: "https://example.invalid/synth",
      snapshotDate: "2026-08-16",
      openSurveillanceItems: [],
    },
    accountability: {
      clinicalContentAuthor: "SYNTH-autor-de-conteudo-01",
      namedClinicalReviewOfContent: "SYNTH — nenhuma revisão clínica: fixture de teste",
      independentBundleApproverRequired: true,
      independenceRule: "ADR-0007 A7-1",
    },
    logic: {
      engine: "SYNTH-motor-de-exemplo",
      engineEntryPoint: "avaliarExemplo",
      engineRuleId: IDENTIDADE_SINT.ruleId,
      engineRuleVersion: versao,
      behaviorHash,
      behaviorHashMethod: "SYNTH — fixture; hash fixo, sem execução de motor",
      publishedTriggers: [
        {
          triggerId: "SYNTH-gatilho-01",
          statement: "SYNTH — gatilho fictício",
          value: 5,
          source: "SYNTH",
        },
      ],
    },
    terminology: {
      snapshotId: null,
      snapshotMechanism: "SYNTH — referência por ID; mecanismo pendente (ADR-0013)",
      bindings: [
        {
          parameter: "SYNTH-parametro-01",
          system: "http://example.invalid/synth",
          code: "SYNTH-0001",
          ucumUnit: null,
          bindingStatus: "candidate",
          note: "SYNTH",
        },
      ],
    },
    inputPolicy: [
      {
        parameter: "SYNTH-parametro-01",
        freshnessWindowMinutes: 60,
        expiryHorizonMinutes: 480,
        plausibleRange: [0, 100],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:SYNTH-parametro-01",
      },
    ],
    testPack: {
      standard: "docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md",
      setId: "SYNTH-CRV-SET",
      vectorCount: 1,
      vectors: [
        {
          id: "SYNTH-CRV-0001",
          description: "SYNTH — vetor fictício",
          input: { valor: 1 },
          expected: { status: "valid", total: 0 },
        },
      ],
      authorshipIndependenceConfirmed: false,
      lifecycleStatus: "DRAFT",
      provenanceNote: "SYNTH — fixture de teste",
    },
    safety: {
      hazards: ["HAZ-0005"],
      safetyRequirements: ["SAF-0020"],
      controls: ["SYNTH — controle fictício"],
    },
    explainability: {
      languageTags: ["pt-BR"],
      mandatoryRenderedElements: ["SYNTH"],
      mandatoryAnnotations: [],
      nonColourOnlyCue: true,
      wordingValidationStatus: "VALIDATION REQUIRED",
    },
    validation: { retrospective: "not_started", prospective: "not_started", notes: [] },
    operations: {
      monitoring: [
        {
          signalId: "SYNTH-sinal-01",
          statement: "SYNTH",
          threshold: null,
          thresholdStatus: "VALIDATION REQUIRED",
        },
      ],
      rollbackCriteria: ["SYNTH — critério fictício"],
      killSwitch: {
        resultingEvaluationStatus: "not_evaluated",
        resultingReason: "rule_unavailable",
        statement: "SYNTH",
      },
      retirement: {
        defaultCadenceMonths: 24,
        bundleCadenceMonths: 24,
        cadenceOverrideJustification: null,
        guidelineTriggers: [],
        reviewDueAt: "2028-08-16T09:00:00.000Z",
        supersededBy: null,
      },
    },
    configurationEnvelope: {
      enforcementPoint: "SYNTH — o mesmo carregador que verifica a assinatura",
      fields: [
        {
          fieldId: "SYNTH-imutavel",
          label: "SYNTH — campo não configurável",
          publishedValue: 3,
          direction: "not_configurable",
          tightestAllowedValue: null,
          rationale: "SYNTH — fixture",
        },
      ],
    },
    provenance: {
      sourceRepo: "intensicare-V2",
      pathOrUrl: "apps/api/src/regras/registro.test.ts",
      commitShaOrVersion: "SYNTH",
      dateCollected: "2026-08-16",
      collector: "SYNTH — fixture de teste",
      transformation: "SYNTH — nenhum conteúdo clínico transcrito",
      confidence: "high",
      dataProvenance: "synthetic-only",
    },
  };
}

const HASH_V1 = "sha256:1111111111111111111111111111111111111111111111111111111111111111";
const HASH_V2 = "sha256:2222222222222222222222222222222222222222222222222222222222222222";

/** Provedor sintético: "avalia" devolvendo o hash que o artefato pinou. */
function provedorSintetico(porta: PortaDeBundle): ProvedorDeRegra<{ readonly n: number }, string> {
  return {
    identidade: IDENTIDADE_SINT,
    porta,
    // Aceita qualquer hash pinado: o objeto de prova aqui é o ROLLBACK, e o
    // verificador de comportamento real é do NEWS2 (`computeNews2BehaviorHash`).
    verificarMotor: (p) => ({ ok: true, behaviorHash: p.behaviorHash }),
    digestDeEntradas: (insumo) => ({ total: insumo.n, digest: `sha256:synth-${insumo.n}` }),
    avaliar: () => "SYNTH-avaliado",
    razoesDe: () => ["SYNTH-sem-razao"],
  };
}

function assinarSintetico(manifesto: RuleBundleManifest): {
  readonly aprovado: ApprovedBundle;
  readonly chaveiro: ReturnType<typeof buildKeyring>;
} {
  const autor = generateEphemeralKeyPair("SYNTH-chave-autor-sint-01");
  const aprovador = generateEphemeralKeyPair("SYNTH-chave-aprovador-sint-02");
  const autorado = signAsAuthor(createDraft(manifesto), autor.signingKey, AUTORIA);
  return {
    aprovado: signAsApprover(autorado, aprovador.signingKey, APROVACAO),
    chaveiro: buildKeyring([autor.verificationKey, aprovador.verificationKey]),
  };
}

// ---------------------------------------------------------------------------
// 1. Regra não registrada
// ---------------------------------------------------------------------------

describe("regra não registrada", () => {
  it("erro EXPLÍCITO — jamais NEWS2 por default", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });

    expect(() => registro.despachar("RULE-SOFA@0.1.0", {}, CONTEXTO)).toThrow(
      RegraNaoRegistradaError,
    );
    expect(() => registro.despachar("RULE-SOFA@0.1.0", {}, CONTEXTO)).toThrow(
      /regra não registrada: "RULE-SOFA@0\.1\.0"/,
    );
    // A mensagem prova que nenhuma outra regra foi usada em seu lugar.
    expect(() => registro.despachar("RULE-SOFA@0.1.0", {}, CONTEXTO)).toThrow(
      /Nenhuma avaliação foi executada e nenhuma outra regra foi usada em seu lugar/,
    );
  });

  it("versão errada da MESMA regra também é não registrada (identidade inclui versão)", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });
    expect(registro.temRegra("RULE-NEWS2@0.2.0")).toBe(true);
    expect(registro.temRegra("RULE-NEWS2@0.3.0")).toBe(false);
    expect(() => registro.despachar("RULE-NEWS2@0.3.0", INSUMO_NEWS2, CONTEXTO)).toThrow(
      RegraNaoRegistradaError,
    );
  });

  it("a tabela é única e ordenada — as duas vias registradas, nada mais", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });
    expect(registro.chaves()).toEqual([CHAVE_GCS, CHAVE_NEWS2]);
  });
});

// ---------------------------------------------------------------------------
// 2. Bundle real do NEWS2: não acionável ⇒ sombra rotulada
// ---------------------------------------------------------------------------

describe("bundle REAL do NEWS2 (não acionável)", () => {
  it("o livro-razão recusa ativação ACIONÁVEL fail-closed (seis ou mais bloqueios)", () => {
    const livro = new RuleActivationLedger("RULE-NEWS2", "dev", "SYNTH-unidade-01");
    const { aprovado, chaveiroCompleto } = assinarNews2();
    const admissao = registrarBundleAprovado(livro, aprovado, chaveiroCompleto);
    expect(admissao.ok).toBe(true);
    if (!admissao.ok) throw new Error("estreitamento");
    expect(admissao.registrado.blockers.length).toBeGreaterThanOrEqual(6);

    expect(() =>
      livro.activate({
        version: "0.2.0",
        mode: "actionable",
        occurredAt: ATIVACAO,
        reason: "SYNTH — tentativa de ativação acionável",
        ...AUTORIZACAO,
      }),
    ).toThrow(/ativação ACIONÁVEL recusada \(fail-closed\)/);
  });

  it("em sombra: avalia de verdade, mas ROTULADA e NUNCA acionável", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });
    const despacho = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);

    expect(despacho.tipo).toBe("avaliada");
    if (despacho.tipo !== "avaliada") throw new Error("estreitamento");

    // A avaliação é a REAL do kernel — sombra não significa fingida.
    expect(despacho.resultado.registroKernel.status).toBe("valid");
    expect(despacho.resultado.resultado.escore).toBe(11);
    expect(despacho.resultado.resultado.banda).toBe("critico");

    // ...e é explicitamente rotulada como não acionável.
    expect(despacho.registro.modo).toBe("sombra");
    expect(despacho.registro.acionavel).toBe(false);
    expect(despacho.registro.rotuloPt).toBe(ROTULO_SOMBRA_PT);
    expect(despacho.registro.rotuloPt).toContain("NÃO acionável");
    expect(despacho.registro.bundle.bloqueiosDeAtivacao.length).toBeGreaterThanOrEqual(6);
  });

  it("nenhuma combinação de estado real torna a via acionável", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });
    const despacho = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);
    if (despacho.tipo !== "avaliada") throw new Error("estreitamento");
    // `acionavel` é DERIVADO: exige assinatura verificada + modo acionável +
    // zero bloqueios. O bundle real tem bloqueios, logo é impossível.
    expect(despacho.registro.acionavel).toBe(false);
    expect(despacho.registro.bundle.assinatura).toBe("assinatura_verificada");
  });

  it("o registro imutável carrega regra, bundle, entradas, razões, proveniência e correlação", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });
    const despacho = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);
    if (despacho.tipo !== "avaliada") throw new Error("estreitamento");
    const r = despacho.registro;

    expect(r.chaveRegra).toBe("RULE-NEWS2@0.2.0");
    expect(r.ruleVersion).toBe("0.2.0");
    expect(r.bundle.versaoBundle).toBe("0.2.0");
    expect(r.bundle.digestManifesto).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(r.bundle.behaviorHash).toBe(MANIFESTO_NEWS2.logic.behaviorHash);
    expect(r.bundle.autorKeyId).toBe("SYNTH-chave-autor-de-regra-01");
    expect(r.bundle.aprovadorKeyId).toBe("SYNTH-chave-aprovador-independente-02");
    expect(r.bundle.autorKeyId).not.toBe(r.bundle.aprovadorKeyId);
    expect(r.entradas.total).toBe(7);
    expect(r.entradas.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    // Avaliação VÁLIDA legitimamente não tem razão a explicar: o campo existe
    // e vem vazio. Já uma RECUSA sempre carrega razões (asserção abaixo).
    expect(Array.isArray(r.razoes)).toBe(true);
    expect(r.razoes).toEqual([...despacho.resultado.registroKernel.reasons]);
    expect(r.correlacaoId).toBe(CORRELACAO);
    expect(r.despachadoEm).toBe(AVALIACAO);

    // Imutável de fato, não por promessa.
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.bundle)).toBe(true);
    expect(Object.isFrozen(r.razoes)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Assinatura adulterada e chave desconhecida
// ---------------------------------------------------------------------------

describe("verificação de assinatura (fail-closed)", () => {
  it("manifesto adulterado depois de assinado é RECUSADO", () => {
    const livro = new RuleActivationLedger("RULE-NEWS2", "dev", "SYNTH-unidade-01");
    const { aprovado, chaveiroCompleto } = assinarNews2();
    const adulterado = {
      ...aprovado,
      manifest: { ...aprovado.manifest, authoredAt: "2026-08-16T09:00:00.001Z" },
    } as ApprovedBundle;

    const admissao = registrarBundleAprovado(livro, adulterado, chaveiroCompleto);
    expect(admissao.ok).toBe(false);
    if (admissao.ok) throw new Error("estreitamento");
    expect(admissao.falhas.join(" ")).toContain("manifest_digest_mismatch");
  });

  it("chave desconhecida no chaveiro é RECUSADA", () => {
    const livro = new RuleActivationLedger("RULE-NEWS2", "dev", "SYNTH-unidade-01");
    const { aprovado, chaveVerificacaoAprovador } = assinarNews2();
    // Chaveiro SEM a chave do autor.
    const chaveiroIncompleto = buildKeyring([chaveVerificacaoAprovador.verificationKey]);

    const admissao = registrarBundleAprovado(livro, aprovado, chaveiroIncompleto);
    expect(admissao.ok).toBe(false);
    if (admissao.ok) throw new Error("estreitamento");
    expect(admissao.falhas.join(" ")).toContain("unknown_author_key");
  });

  it("bundle recusado ⇒ nada ativo ⇒ despacho devolve NÃO AVALIADO, não uma avaliação", () => {
    const livro = new RuleActivationLedger("RULE-NEWS2", "dev", "SYNTH-unidade-01");
    const { aprovado, chaveVerificacaoAprovador } = assinarNews2();
    registrarBundleAprovado(
      livro,
      aprovado,
      buildKeyring([chaveVerificacaoAprovador.verificationKey]),
    );

    const registro = montarRegistroDeRegras({
      news2: {
        porta: portaDeBundleDoLivroRazao({
          identidade: { ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" },
          livro,
        }),
        vetores: VETORES_NEWS2,
      },
    });
    const despacho = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);

    expect(despacho.tipo).toBe("nao_avaliada");
    expect(despacho.registro.motivoRecusa).toBe("regra_nao_ativada");
    expect(despacho.registro.acionavel).toBe(false);
    expect(despacho.registro.mensagemRecusaPt).toContain("NÃO foram calculadas");
  });
});

// ---------------------------------------------------------------------------
// 4. Kill switch — as DUAS primitivas
// ---------------------------------------------------------------------------

describe("kill switch", () => {
  it("kill switch do LIVRO-RAZÃO ⇒ recusa com razão explícita e visível", () => {
    const livro = livroNews2Ativado();
    livro.killSwitch({
      occurredAt: KILL,
      authorizedBy: "SYNTH-autoridade-01",
      reason: "SYNTH — defeito suspeito na própria fórmula",
    });

    const registro = montarRegistroDeRegras({
      news2: {
        porta: portaDeBundleDoLivroRazao({
          identidade: { ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" },
          livro,
        }),
        vetores: VETORES_NEWS2,
      },
    });
    const despacho = despacharNews2(registro, INSUMO_NEWS2, {
      instanteIso: KILL,
      correlacaoId: CORRELACAO,
    });

    expect(despacho.tipo).toBe("nao_avaliada");
    expect(despacho.registro.motivoRecusa).toBe("regra_indisponivel");
    expect(despacho.registro.mensagemRecusaPt).toContain("Regra clínica indisponível");
    expect(despacho.registro.mensagemRecusaPt).toContain("não significa ausência de risco");
    expect(despacho.registro.razoes).toContain("livro-razão: rule_unavailable");
  });

  it("kill switch da OBSERVABILIDADE ⇒ recusa e o avaliador NÃO é invocado", () => {
    const telemetry = createInMemoryTelemetry(() => 1_000);
    const quadro = createClinicalRuleSwitchboard({ telemetry });
    quadro.activate({ ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" }, "SYNTH-ATOR-0001");

    let invocacoes = 0;
    const base = criarProvedorNews2({ porta: portaNews2Ativa(), vetores: VETORES_NEWS2 });
    const espiao = {
      ...base,
      avaliar: (insumo: Parameters<typeof base.avaliar>[0], t: string) => {
        invocacoes += 1;
        return base.avaliar(insumo, t);
      },
    };
    const registro = new RegistroDeRegras({ quadroDeChaves: quadro }).registrar(espiao);

    // Antes do desligamento: avalia.
    expect(registro.despachar(CHAVE_NEWS2, INSUMO_NEWS2, CONTEXTO).tipo).toBe("avaliada");
    expect(invocacoes).toBe(1);

    quadro.kill("RULE-NEWS2", {
      reasonCode: "defeito_de_regra_suspeito",
      actorId: "SYNTH-ATOR-0001",
    });

    const depois = registro.despachar(CHAVE_NEWS2, INSUMO_NEWS2, CONTEXTO);
    expect(depois.tipo).toBe("nao_avaliada");
    expect(depois.registro.motivoRecusa).toBe("regra_indisponivel");
    expect(invocacoes).toBe(1); // o avaliador NÃO rodou de novo
  });

  it("regra nunca ativada no quadro de chaves é recusada (fail-closed, não 'desconhecido logo ok')", () => {
    const telemetry = createInMemoryTelemetry(() => 1_000);
    const quadro = createClinicalRuleSwitchboard({ telemetry });
    const registro = new RegistroDeRegras({ quadroDeChaves: quadro }).registrar(
      criarProvedorNews2({ porta: portaNews2Ativa(), vetores: VETORES_NEWS2 }),
    );

    const despacho = registro.despachar(CHAVE_NEWS2, INSUMO_NEWS2, CONTEXTO);
    expect(despacho.tipo).toBe("nao_avaliada");
    expect(despacho.registro.motivoRecusa).toBe("regra_indisponivel");
  });
});

// ---------------------------------------------------------------------------
// 5. Rollback provado por behaviorHash (regra sintética)
// ---------------------------------------------------------------------------

describe("rollback de bundle", () => {
  it("volta ao comportamento anterior, e o behaviorHash prova", () => {
    const livro = new RuleActivationLedger(IDENTIDADE_SINT.ruleId, "dev", "SYNTH-unidade-01");
    for (const [versao, hash] of [
      ["1.0.0", HASH_V1],
      ["1.1.0", HASH_V2],
    ] as const) {
      const { aprovado, chaveiro } = assinarSintetico(manifestoSintetico(versao, hash));
      const admissao = registrarBundleAprovado(livro, aprovado, chaveiro);
      expect(admissao.ok, `versão ${versao} admitida`).toBe(true);
    }

    const porta = portaDeBundleDoLivroRazao({ identidade: IDENTIDADE_SINT, livro });
    const registro = new RegistroDeRegras().registrar(provedorSintetico(porta));
    const hashEm = (instante: string): string | null => {
      const d = registro.despachar(
        chaveRegra(IDENTIDADE_SINT),
        { n: 1 },
        {
          instanteIso: instante,
          correlacaoId: CORRELACAO,
        },
      );
      return d.registro.bundle.behaviorHash;
    };

    livro.activate({
      version: "1.0.0",
      mode: "shadow",
      occurredAt: "2026-08-16T11:00:00.000Z",
      reason: "SYNTH — ativação inicial",
      ...AUTORIZACAO,
    });
    expect(hashEm("2026-08-16T11:10:00.000Z")).toBe(HASH_V1);

    livro.activate({
      version: "1.1.0",
      mode: "shadow",
      occurredAt: "2026-08-16T11:20:00.000Z",
      reason: "SYNTH — promoção da versão sucessora",
      ...AUTORIZACAO,
    });
    expect(hashEm("2026-08-16T11:30:00.000Z")).toBe(HASH_V2);

    livro.rollback({
      toVersion: "1.0.0",
      occurredAt: "2026-08-16T11:40:00.000Z",
      authorizedBy: "SYNTH-autoridade-01",
      reason: "SYNTH — rollback para a versão anterior aprovada",
    });
    expect(hashEm("2026-08-16T11:50:00.000Z")).toBe(HASH_V1);

    // O passado permanece legível: replay no instante anterior devolve o
    // comportamento que vigorava então (trilha append-only, ADR-0007 eixo 4).
    expect(hashEm("2026-08-16T11:30:00.000Z")).toBe(HASH_V2);
  });
});

// ---------------------------------------------------------------------------
// 6. Motor divergente
// ---------------------------------------------------------------------------

describe("verificação de comportamento do motor", () => {
  it("test pack incompleto ⇒ behaviorHash não bate ⇒ recusa fail-closed", () => {
    const registro = montarRegistroDeRegras({
      // Subconjunto ESTRITO dos vetores publicados: nenhum vetor alterado,
      // apenas um conjunto incompleto — o hash de comportamento diverge.
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2.slice(0, 3) },
    });
    const despacho = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);

    expect(despacho.tipo).toBe("nao_avaliada");
    expect(despacho.registro.motivoRecusa).toBe("motor_divergente");
    expect(despacho.registro.mensagemRecusaPt).toContain("não reproduz o comportamento pinado");
  });

  it("sem vetores nenhum ⇒ motor NÃO verificado ⇒ recusa (nunca 'presume conforme')", () => {
    const registro = montarRegistroDeRegras({ news2: { porta: portaNews2Ativa() } });
    const despacho = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);

    expect(despacho.tipo).toBe("nao_avaliada");
    expect(despacho.registro.motivoRecusa).toBe("motor_divergente");
    expect(despacho.registro.razoes.join(" ")).toContain("vetores do test pack não fornecidos");
  });

  it("o conjunto COMPLETO e publicado reproduz o hash pinado", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });
    const despacho = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);
    expect(despacho.tipo).toBe("avaliada");
  });
});

// ---------------------------------------------------------------------------
// 7. Artefato sem cadeia de assinatura (ADR-0007 C5, aberta)
// ---------------------------------------------------------------------------

describe("artefato sem cadeia de assinatura", () => {
  it("é sempre sombra, nunca acionável, e a ausência de assinatura é visível", () => {
    const porta = portaDeBundleNaoAssinado({
      identidade: { ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" },
      manifesto: MANIFESTO_NEWS2,
      justificativaAdrC5:
        "SYNTH — não há custódia de chave neste repositório (ADR-0007 C5, aberta)",
    });
    const registro = montarRegistroDeRegras({ news2: { porta, vetores: VETORES_NEWS2 } });
    const despacho = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);

    expect(despacho.tipo).toBe("avaliada");
    if (despacho.tipo !== "avaliada") throw new Error("estreitamento");
    expect(despacho.registro.modo).toBe("sombra");
    expect(despacho.registro.acionavel).toBe(false);
    expect(despacho.registro.bundle.assinatura).toBe("assinatura_ausente");
    expect(despacho.registro.bundle.autorKeyId).toBeNull();
    expect(despacho.registro.bundle.bloqueiosDeAtivacao).toContain(BLOQUEIO_ASSINATURA_AUSENTE);
  });

  it("exige justificativa escrita — nunca é um caminho silencioso", () => {
    expect(() =>
      portaDeBundleNaoAssinado({
        identidade: { ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" },
        manifesto: MANIFESTO_NEWS2,
        justificativaAdrC5: "   ",
      }),
    ).toThrow(/exige justificativa escrita/);
  });
});

// ---------------------------------------------------------------------------
// 8. Coexistência NEWS2 + GCS no mesmo encontro
// ---------------------------------------------------------------------------

describe("coexistência NEWS2 e GCS no mesmo encontro", () => {
  const observacoes = [...serieNews2(), ...serieGcs()];

  it("dois registros independentes, com identidade de regra distinta em cada", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });
    const dNews2 = despacharNews2(registro, { observacoes, contexto: { idadeAnos: 62 } }, CONTEXTO);
    const dGcs = despacharGcs(registro, { observacoes, contexto: { idadeAnos: 62 } }, CONTEXTO);

    expect(dNews2.registro.chaveRegra).toBe("RULE-NEWS2@0.2.0");
    expect(dGcs.registro.chaveRegra).toBe("RULE-GCS@0.2.0");
    expect(dNews2.registro.chaveRegra).not.toBe(dGcs.registro.chaveRegra);
    expect(dNews2.registro.ruleId).not.toBe(dGcs.registro.ruleId);
    // Registros distintos, nenhum é o outro.
    expect(dNews2.registro).not.toBe(dGcs.registro);
    expect(dNews2.registro.entradas.digest).not.toBe(dGcs.registro.entradas.digest);
  });

  it("as observações do GCS NÃO alteram o resultado do NEWS2", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });
    const soNews2 = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);
    const comGcs = despacharNews2(registro, { observacoes, contexto: { idadeAnos: 62 } }, CONTEXTO);
    if (soNews2.tipo !== "avaliada" || comGcs.tipo !== "avaliada") {
      throw new Error("estreitamento");
    }

    expect(comGcs.resultado.resultado.escore).toBe(soNews2.resultado.resultado.escore);
    expect(comGcs.resultado.resultado.banda).toBe(soNews2.resultado.resultado.banda);
    expect(comGcs.resultado.resultado.parametros).toHaveLength(7);
    // Nenhum componente do GCS aparece entre os parâmetros do NEWS2.
    const parametros = comGcs.resultado.resultado.parametros.map((p) => String(p.parametro));
    for (const proibido of ["eye", "verbal", "motor"]) {
      expect(parametros).not.toContain(proibido);
    }
  });

  it("GCS sem artefato de regra é recusado — fail-closed, com razão explícita", () => {
    const registro = montarRegistroDeRegras({
      news2: { porta: portaNews2Ativa(), vetores: VETORES_NEWS2 },
    });
    const dGcs = despacharGcs(registro, { observacoes, contexto: { idadeAnos: 62 } }, CONTEXTO);

    expect(dGcs.tipo).toBe("nao_avaliada");
    expect(dGcs.registro.motivoRecusa).toBe("bundle_ausente");
    expect(dGcs.registro.acionavel).toBe(false);
    expect(dGcs.registro.razoes.join(" ")).toContain("buildNews2BundleManifest");
  });

  it("a porta de bundle de uma regra não pode governar a outra", () => {
    const registro = new RegistroDeRegras();
    expect(() =>
      registro.registrar(
        criarProvedorNews2({
          porta: portaDeBundleAusente({ ruleId: "RULE-GCS", ruleVersion: "0.2.0" }, "SYNTH"),
        }),
      ),
    ).toThrow(/não pode governar a regra/);
  });
});
