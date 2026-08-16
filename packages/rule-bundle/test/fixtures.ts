/**
 * Fixtures estruturais dos testes deste pacote.
 *
 * `manifestoExemplo()` NÃO é conteúdo clínico: é um manifesto mínimo e
 * completo, com uma regra fictícia `RULE-SYNTH-EXEMPLO`, usado para
 * exercitar o MECANISMO (serialização, assinatura, adulteração, ciclo de
 * vida) sem arrastar os 93 vetores do NEWS2 a cada iteração. Nenhum valor
 * aqui tem significado clínico e nada aqui pode ser citado como regra.
 *
 * Dados 100% sintéticos (prefixo `SYNTH-`).
 */

import type { RuleBundleManifest } from "../src/index.js";

export const INSTANTE_AUTORIA = "2026-08-16T09:00:00.000Z";

/**
 * Manifesto estruturalmente válido de uma regra fictícia. `override`
 * permite variar campos pontuais sem reescrever o objeto inteiro.
 */
export function manifestoExemplo(override: Partial<RuleBundleManifest> = {}): RuleBundleManifest {
  const base: RuleBundleManifest = {
    schema: { format: "intensicare.rule-bundle", formatVersion: "1.0.0" },
    bundleId: "RULE-SYNTH-EXEMPLO@1.0.0",
    authoredAt: INSTANTE_AUTORIA,
    identity: {
      ruleId: "RULE-SYNTH-EXEMPLO",
      ruleVersion: "1.0.0",
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
      engineRuleId: "RULE-SYNTH-EXEMPLO",
      engineRuleVersion: "1.0.0",
      behaviorHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
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
      vectorCount: 2,
      vectors: [
        {
          id: "SYNTH-CRV-0001",
          description: "SYNTH — vetor fictício 1",
          input: { valor: 1 },
          expected: { status: "valid", total: 0 },
        },
        {
          id: "SYNTH-CRV-0002",
          description: "SYNTH — vetor fictício 2",
          input: { valor: null },
          expected: { status: "not_evaluated", total: null },
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
    validation: {
      retrospective: "not_started",
      prospective: "not_started",
      notes: [],
    },
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
          fieldId: "SYNTH-limiar-01",
          label: "SYNTH — limiar fictício com piso declarado",
          publishedValue: 5,
          direction: "lower_is_tighter",
          tightestAllowedValue: 3,
          rationale: "SYNTH — fixture com piso declarado, para exercitar o caminho de aceite",
        },
        {
          fieldId: "SYNTH-limiar-sem-piso",
          label: "SYNTH — limiar fictício sem piso declarado",
          publishedValue: 5,
          direction: "lower_is_tighter",
          tightestAllowedValue: null,
          rationale: "SYNTH — fixture sem piso, para exercitar a recusa fail-closed",
        },
        {
          fieldId: "SYNTH-imutavel",
          label: "SYNTH — campo não configurável",
          publishedValue: 3,
          direction: "not_configurable",
          tightestAllowedValue: null,
          rationale: "SYNTH — conteúdo clínico imutável",
        },
      ],
    },
    provenance: {
      sourceRepo: "intensicare-V2",
      pathOrUrl: "packages/rule-bundle/test/fixtures.ts",
      commitShaOrVersion: "SYNTH",
      dateCollected: "2026-08-16",
      collector: "SYNTH — fixture de teste",
      transformation: "SYNTH — nenhum conteúdo clínico transcrito",
      confidence: "high",
      dataProvenance: "synthetic-only",
    },
  };

  return { ...base, ...override };
}

/** Manifesto de uma versão sucessora, para exercitar ativação e rollback. */
export function manifestoExemploVersao(versao: string): RuleBundleManifest {
  const base = manifestoExemplo();
  return {
    ...base,
    bundleId: `RULE-SYNTH-EXEMPLO@${versao}`,
    identity: { ...base.identity, ruleVersion: versao },
    logic: { ...base.logic, engineRuleVersion: versao },
  };
}

/** Entrada de aprovação padrão dos testes. */
export const APROVACAO_EXEMPLO = {
  approverRole: "SYNTH — segundo revisor clínico (identidade sintética de teste)",
  reviewStatement:
    "SYNTH — revisão fictícia para exercitar o mecanismo. NÃO é aprovação clínica de nada.",
  reviewedAt: "2026-08-16T10:00:00.000Z",
  outstandingConditions: [
    "C1 (segundo revisor clínico real) permanece aberta",
    "C5 (custódia de chave, ADR-0022) permanece aberta",
  ],
} as const;
