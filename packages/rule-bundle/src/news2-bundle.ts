/**
 * Montagem do bundle real do RULE-NEWS2 0.2.0.
 *
 * Todo valor clínico aqui é TRANSCRITO de artefato já revisado — nenhum
 * número é inventado por este módulo:
 * - `docs/05-clinical-safety/rule-releases/news2/specification.md` 0.2.0
 *   (§1.2 gate, §2.1 janelas/faixas/vínculos LOINC, §4.2 gatilhos
 *   publicados, §4.3 monotonicidade, §7 explicação, §8 perigos, §9
 *   monitoramento/rollback/kill switch/retirada);
 * - `.../reference-vectors.md` 0.2.0 (conjunto CRV, disciplina §0);
 * - ADR-0007 (formato/assinatura/ciclo de vida), ADR-0025 (edição
 *   canônica), ADR-0026/0027 (insumo ausente, gate etário).
 *
 * Onde a fonte diz `VALIDATION REQUIRED`, o campo carrega essa string ou
 * `null` — nunca um valor plausível fabricado para "completar" o artefato.
 *
 * Este módulo NÃO assina, NÃO aprova e NÃO ativa nada. Ele monta o
 * conteúdo; assinar é `signAsAuthor`, aprovar exige uma segunda identidade
 * humana que hoje não existe (condição C1 da ADR-0007, aberta).
 */

import { evaluateNews2, NEWS2_RULE_ID, NEWS2_RULE_VERSION } from "@intensicare/kernel-clinico";
import { contentDigest } from "./canonical.js";
import type { News2TestPack, News2TestVector } from "./news2-test-pack.js";
import type { RuleBundleManifest, TestPackVector } from "./types.js";

/** Cadência-teto decidida em A7-3 (GDEC-0007). */
const DEFAULT_RETIREMENT_CADENCE_MONTHS = 24;

/**
 * Cadência deste bundle: 12 meses. Não é invenção — é a spec §9
 * ("revisão ... no mínimo a cada 12 meses"), que APERTA o teto de 24 meses.
 * Apertar é permitido e exige justificativa registrada; afrouxar não é.
 */
const NEWS2_RETIREMENT_CADENCE_MONTHS = 12;

/** Soma meses em UTC, saturando o dia no último dia do mês de destino. */
function addMonthsUtc(instant: string, months: number): string {
  const parsed = Date.parse(instant);
  if (Number.isNaN(parsed)) {
    throw new Error(`bundle NEWS2: instante "${instant}" não é ISO 8601`);
  }
  const date = new Date(parsed);
  const targetMonthStart = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    1,
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );
  const target = new Date(targetMonthStart);
  const lastDayOfTargetMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDayOfTargetMonth));
  return target.toISOString();
}

/**
 * Digest do COMPORTAMENTO do motor sobre o test pack inteiro.
 *
 * É a resposta direta ao defeito SF-2 do legado (`NEWS2-v3.0.0` sobreviveu
 * a uma inversão de comportamento com a string de versão intacta): aqui, a
 * identidade do bundle inclui o que o motor de fato produz. Trocar uma
 * banda, inverter uma comparação ou alterar uma razão muda este hash, e
 * `verifyNews2EngineBehavior` recusa o motor antes de qualquer ativação.
 */
export function computeNews2BehaviorHash(vectors: readonly News2TestVector[]): string {
  return contentDigest(
    vectors.map((vector) => ({
      vectorId: vector.id,
      record: evaluateNews2(vector.input),
    })),
  );
}

/** Resultado da verificação do motor contra o comportamento pinado no bundle. */
export type EngineBehaviorVerification =
  | { readonly ok: true; readonly behaviorHash: string }
  | { readonly ok: false; readonly expected: string; readonly actual: string };

/**
 * Recomputa o comportamento do motor em execução e compara com o hash
 * assinado. Um motor que não bate NUNCA pode carregar este bundle
 * (QAS-0011: "contagem de avaliações executadas contra uma versão de regra
 * não verificada ou ambígua deve ser zero").
 */
export function verifyNews2EngineBehavior(
  manifest: RuleBundleManifest,
  vectors: readonly News2TestVector[],
): EngineBehaviorVerification {
  const actual = computeNews2BehaviorHash(vectors);
  if (actual !== manifest.logic.behaviorHash) {
    return { ok: false, expected: manifest.logic.behaviorHash, actual };
  }
  return { ok: true, behaviorHash: actual };
}

function toManifestVectors(pack: News2TestPack): readonly TestPackVector[] {
  return pack.vectors.map(
    (vector): TestPackVector => ({
      id: vector.id,
      description: `${vector.sourceSection} — ${vector.description}`,
      input: vector.input,
      expected: vector.expected,
    }),
  );
}

/** Parâmetros de montagem. `authoredAt` entra por fora: sem relógio interno. */
export interface News2BundleBuildOptions {
  readonly testPack: News2TestPack;
  readonly authoredAt: string;
}

/**
 * Monta o manifesto imutável do RULE-NEWS2 0.2.0.
 *
 * Determinístico: mesmos `testPack` e `authoredAt` ⇒ mesmos bytes
 * canônicos ⇒ mesmo digest ⇒ mesma assinatura verificável.
 */
export function buildNews2BundleManifest(options: News2BundleBuildOptions): RuleBundleManifest {
  const { testPack, authoredAt } = options;

  return {
    schema: { format: "intensicare.rule-bundle", formatVersion: "1.0.0" },
    bundleId: `${NEWS2_RULE_ID}@${NEWS2_RULE_VERSION}`,
    authoredAt,

    identity: {
      ruleId: NEWS2_RULE_ID,
      ruleVersion: NEWS2_RULE_VERSION,
      canonicalEdition: "RCP NEWS2 (2017) — edição canônica ratificada em ADR-0025 A25-1",
      editionCitation:
        "Royal College of Physicians. National Early Warning Score (NEWS) 2: Standardising " +
        "the assessment of acute-illness severity in the NHS. Updated report of a working " +
        "party. London: RCP, 2017.",
      // O estreitamento populacional para >=18 (ADR-0027) NÃO é variante no
      // sentido da ADR-0025 §5.2: variante exige divergência de VALOR DE
      // BANDA. Aqui os parâmetros, a agregação e as bandas são as
      // publicadas; o que muda é a população elegível, declarada em
      // `intendedUse.exclusions`.
      isVariantOfCanonicalEdition: false,
      declaredDivergences: [],
    },

    intendedUse: {
      statement:
        "Exibição consultiva do escore NEWS2 e de sua banda de risco para apoio ao " +
        "julgamento do intensivista. Não é diretriz, não auto-escalona, não despacha " +
        "resposta e não substitui avaliação clínica.",
      population:
        "Adulto com idade VERIFICADA >= 18 anos (ADR-0027 A27-1) — mais estreito que a " +
        "população publicada pelo RCP (>=16 anos), nunca mais largo.",
      exclusions: [
        "idade verificada < 18 anos — fora da população V2 (decisão N-1 (a), GDEC-0007); a " +
          "faixa 16-17 é permitida pelo RCP e EXCLUÍDA por uso pretendido do V2",
        "idade desconhecida ou não parseável — nunca se presume adulto (HAZ-0036)",
        "gravidez documentada — instrumento obstétrico indicado (RCP Rec 2)",
        "gravidez NÃO documentada não exclui, mas obriga anotação visível " +
          '"gravidez não verificada" (decisão N-2 (a), GDEC-0007)',
      ],
      evidencedPopulatedSource: false,
      admittedByGateG2: false,
      actionabilityClassification:
        "NOT ACTIONABLE — nenhuma fonte populada evidenciada para os sete insumos " +
        "(HAZ-0043). Classificação inalterada por este empacotamento.",
    },

    evidence: {
      primarySource: "Royal College of Physicians (RCP), relatório do emissor, 2017",
      citation:
        "RCP NEWS2 updated report of a working party, 2017 — Chart 1 (p.29), Chart 2 " +
        "(p.30), Recomendações 1-3 e 26-30, seções 6 e 7.",
      issuerUrl: "https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf",
      snapshotDate: "2026-08-15",
      openSurveillanceItems: [
        "clarificação do RCP de dezembro de 2022: NÃO LOCALIZADA nas páginas do emissor em " +
          "2026-08-15 (SF-9) — não é citada como fato em lugar nenhum; localizar, verificar " +
          "no emissor e avaliar impacto de banda/governança antes de qualquer decisão de " +
          "ativação (VALIDATION REQUIRED)",
        "página de recursos NEWS2 do RCP e diretriz de oxigênio da BTS (alvo 88-92% que " +
          "sustenta a Escala 2): reverificar a cada cadência de revisão",
      ],
    },

    accountability: {
      clinicalContentAuthor:
        "autor da especificação RULE-NEWS2 0.2.0 (agente, ciclo 1 Tarefa 2) — conteúdo " +
        "re-derivado do PDF do emissor, nada importado do sistema legado",
      namedClinicalReviewOfContent:
        "rodaquino-OMNI revisou o CONTEÚDO clínico em 2026-08-15 (GDEC-0007). Isso NÃO é " +
        "aprovação de bundle sob a ADR-0007: a aprovação de bundle é um ato distinto, " +
        "contra-assinado por identidade diferente da que autorou o conteúdo.",
      independentBundleApproverRequired: true,
      independenceRule:
        "ADR-0007 A7-1: autor != aprovador é princípio PERMANENTE, sem processo de exceção, " +
        "inclusive durante o período de clínico único. Condição C1 permanece aberta.",
    },

    logic: {
      engine: "@intensicare/kernel-clinico",
      engineEntryPoint: "evaluateNews2",
      engineRuleId: NEWS2_RULE_ID,
      engineRuleVersion: NEWS2_RULE_VERSION,
      behaviorHash: computeNews2BehaviorHash(testPack.vectors),
      behaviorHashMethod:
        "sha256 sobre a serialização canônica da lista [{vectorId, EvaluationRecord}] " +
        "produzida pelo motor sobre os vetores do test pack, na ordem publicada",
      publishedTriggers: [
        {
          triggerId: "red_score",
          statement:
            "pontuação 3 em QUALQUER parâmetro individual — banda low_medium, revisão " +
            "urgente à beira do leito (semântica de EXIBIÇÃO consultiva)",
          value: 3,
          source: "RCP 2017 Chart 2 / seção 6 (spec §4.2)",
        },
        {
          triggerId: "aggregate_urgent",
          statement: "escore agregado >= 5 — limiar-chave de revisão clínica urgente",
          value: 5,
          source: "RCP 2017 seção 6 (spec §4.2)",
        },
        {
          triggerId: "aggregate_emergency",
          statement: "escore agregado >= 7 — alerta clínico de alto nível",
          value: 7,
          source: "RCP 2017 seção 6 (spec §4.2)",
        },
      ],
    },

    terminology: {
      // C6 aberta: não existe mecanismo de snapshot referenciável (ADR-0013).
      // O campo fica NULO e declarado, jamais preenchido com um ID inventado.
      snapshotId: null,
      snapshotMechanism:
        "o bundle REFERENCIA um snapshot estável por ID/hash, nunca o incorpora " +
        "(ADR-0007 premissa A2). O mecanismo depende da ADR-0013; condição C6 aberta.",
      bindings: [
        {
          parameter: "rr",
          system: "http://loinc.org",
          code: "9279-1",
          ucumUnit: "/min",
          bindingStatus: "candidate",
          note: "vínculo candidato; arquiteto de terminologia é o titular do value set final",
        },
        {
          parameter: "spo2",
          system: "http://loinc.org",
          code: "59408-5",
          ucumUnit: "%",
          bindingStatus: "candidate",
          note: "2708-6 (saturação arterial) registrado como alternativa — decisão de vínculo pendente",
        },
        {
          parameter: "o2_status",
          system: "http://loinc.org",
          code: "3151-8",
          ucumUnit: null,
          bindingStatus: "candidate",
          note:
            "derivado: fluxo de O2 inalado > 0 OU dispositivo/terapia de O2 documentada; " +
            "vínculo VALIDATION REQUIRED. Desconhecido NUNCA é 'ar'.",
        },
        {
          parameter: "sbp",
          system: "http://loinc.org",
          code: "8480-6",
          ucumUnit: "mm[Hg]",
          bindingStatus: "candidate",
          note: "vínculo candidato",
        },
        {
          parameter: "pulse",
          system: "http://loinc.org",
          code: "8867-4",
          ucumUnit: "/min",
          bindingStatus: "candidate",
          note: "vínculo candidato",
        },
        {
          parameter: "consciousness",
          system: "http://loinc.org",
          code: "67775-7",
          ucumUnit: null,
          bindingStatus: "candidate",
          note:
            "a answer list não tem conceito padrão para 'C' (confusão) do ACVPU — vínculo " +
            "VALIDATION REQUIRED; token fora de {A,C,V,P,U} é `invalid`, nunca 0 nem 3",
        },
        {
          parameter: "temperature",
          system: "http://loinc.org",
          code: "8310-5",
          ucumUnit: "Cel",
          bindingStatus: "candidate",
          note: "vínculo candidato",
        },
      ],
    },

    // Janelas, horizontes e faixas plausíveis: spec §2.1, ratificadas em
    // GDEC-0007 (N-5 (a) frescor, N-9 (a) faixas plausíveis).
    inputPolicy: [
      {
        parameter: "rr",
        freshnessWindowMinutes: 60,
        expiryHorizonMinutes: 480,
        plausibleRange: [0, 80],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:rr",
      },
      {
        parameter: "spo2",
        freshnessWindowMinutes: 60,
        expiryHorizonMinutes: 480,
        plausibleRange: [40, 100],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:spo2",
      },
      {
        parameter: "o2_status",
        freshnessWindowMinutes: 240,
        expiryHorizonMinutes: 1440,
        plausibleRange: null,
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:o2_status",
      },
      {
        parameter: "sbp",
        freshnessWindowMinutes: 60,
        expiryHorizonMinutes: 480,
        plausibleRange: [30, 300],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:sbp",
      },
      {
        parameter: "pulse",
        freshnessWindowMinutes: 60,
        expiryHorizonMinutes: 480,
        plausibleRange: [10, 300],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:pulse",
      },
      {
        parameter: "consciousness",
        freshnessWindowMinutes: 240,
        expiryHorizonMinutes: 1440,
        plausibleRange: null,
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:consciousness",
      },
      {
        parameter: "temperature",
        freshnessWindowMinutes: 240,
        expiryHorizonMinutes: 1440,
        plausibleRange: [25, 45],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:temperature",
      },
    ],

    testPack: {
      standard: "docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md",
      setId: testPack.setId,
      vectorCount: testPack.vectors.length,
      vectors: toManifestVectors(testPack),
      // §0 do documento de vetores declara textualmente que a condição de
      // independência de autoria NÃO é satisfeita. Registrar `false` é o
      // único registro honesto e é o que bloqueia ativação acionável.
      authorshipIndependenceConfirmed: false,
      lifecycleStatus: "DRAFT",
      provenanceNote:
        `expandidos de ${testPack.sourcePath} (${testPack.dataProvenance}); instante de ` +
        `avaliação sintético pinado em ${testPack.evaluationTime}. A aprovação destes ` +
        "vetores NUNCA é evidência clínica enquanto a autoria independente estiver pendente.",
    },

    safety: {
      hazards: ["HAZ-0005", "HAZ-0036", "HAZ-0040", "HAZ-0043", "HAZ-0044"],
      safetyRequirements: [
        "SAF-0001",
        "SAF-0002",
        "SAF-0003",
        "SAF-0006",
        "SAF-0019",
        "SAF-0020",
        "SAF-0021",
        "SAF-0035",
      ],
      controls: [
        "HAZ-0005: proibição total de coerção a zero — nenhum insumo ausente, vencido, " +
          "inválido, conflitante ou em quarentena contribui 0 (spec §5.4); CRV-NEWS2-0102 é " +
          "o vetor de regressão permanente",
        "HAZ-0036: gate populacional fail-closed antes da avaliação (ADR-0027)",
        "HAZ-0040: qualidade da fonte e status de avaliação são dimensões SEPARADAS — " +
          "insumo em quarentena nunca contribui",
        "HAZ-0043: classificação NOT ACTIONABLE mantida no próprio manifesto",
        "HAZ-0044: sob ordem de limitação terapêutica o escore é computado e exibido; " +
          "apenas a exibição de escalonamento é suprimida, com razão visível",
      ],
    },

    explainability: {
      languageTags: ["pt-BR", "en"],
      mandatoryRenderedElements: [
        "escore e banda — SOMENTE quando o status é `valid`",
        "os sete insumos utilizados, com horário de origem e a escala de SpO2 em uso",
        "insumos ausentes/desatualizados/inválidos NOMEADOS, um a um",
        "a versão da regra",
        "o enquadramento consultivo (não é diretriz, não substitui julgamento clínico)",
        "nenhuma renderização mostra banda sem o status ao lado",
        "ausência de escore NUNCA é apresentada como tranquilidade",
      ],
      mandatoryAnnotations: [
        "gravidez não verificada (N-2)",
        "escalonamento suprimido — ordem de limitação terapêutica documentada (N-3)",
        "estado de sedação anotado no insumo de consciência (N-4)",
        "idade da ordem de Escala 2 e seu estado de reconfirmação de 7 dias (N-6)",
      ],
      nonColourOnlyCue: true,
      wordingValidationStatus:
        "VALIDATION REQUIRED — a redação pt-BR precisa de validação com clínicos falantes " +
        "de pt-BR (spec §7); os critérios de aceitação de UX acima são o que está fixado.",
    },

    validation: {
      retrospective: "not_started",
      prospective: "not_started",
      notes: [
        "nenhuma validação retrospectiva ou prospectiva foi executada: não existe fonte " +
          "populada evidenciada contra a qual executar (HAZ-0043)",
        "a execução verde dos vetores CRV é evidência de AUTORIA red/green, jamais " +
          "evidência clínica (disciplina §0 do conjunto de vetores)",
      ],
    },

    operations: {
      monitoring: [
        {
          signalId: "distribuicao_de_status_por_unidade_dia",
          statement:
            "distribuição dos status de avaliação por unidade-dia; participação alta ou " +
            "crescente de `not_evaluated` é falha de alimentação ou sinal de HAZ-0043 — " +
            "nunca silêncio",
          threshold: null,
          thresholdStatus: "VALIDATION REQUIRED — nenhum limiar é inventado por engenharia",
        },
        {
          signalId: "taxa_de_invalid_por_razao",
          statement: "taxa de `invalid` desagregada por razão legível por máquina",
          threshold: null,
          thresholdStatus: "VALIDATION REQUIRED",
        },
        {
          signalId: "volume_por_banda_vs_orcamento_de_interrupcao",
          statement:
            "taxa da banda de parâmetro vermelho e volumes por banda agregada contra o " +
            "orçamento de alerta interruptivo",
          threshold: null,
          thresholdStatus: "VALIDATION REQUIRED — o orçamento de interrupção ainda não existe",
        },
        {
          signalId: "prevalencia_de_escala2",
          statement:
            "prevalência de atribuição de Escala 2 versus prevalência documentada de " +
            "insuficiência respiratória hipercápnica; divergência em QUALQUER direção é " +
            "sinal de defeito de governança",
          threshold: null,
          thresholdStatus: "VALIDATION REQUIRED",
        },
      ],
      rollbackCriteria: [
        "qualquer coerção a zero observada — automático, regressão bloqueante de release (HAZ-0005)",
        "qualquer banding em Escala 2 sem ordem documentada",
        "qualquer enfraquecimento de banda abaixo dos gatilhos publicados",
        "divergência de tabela de banda contra os vetores de referência em replay",
      ],
      killSwitch: {
        resultingEvaluationStatus: "not_evaluated",
        resultingReason: "rule_unavailable",
        statement:
          "desativação é total e honesta: todo consumidor mostra `not_evaluated` com razão " +
          "`rule_unavailable`. A regra nunca roda pela metade e nunca há não-disparo " +
          "silencioso (SAF-0021; evaluation-status-semantics §3.3).",
      },
      retirement: {
        defaultCadenceMonths: DEFAULT_RETIREMENT_CADENCE_MONTHS,
        bundleCadenceMonths: NEWS2_RETIREMENT_CADENCE_MONTHS,
        cadenceOverrideJustification:
          "spec §9 exige revisão no mínimo a cada 12 meses — APERTA o teto de 24 meses " +
          "fixado em A7-3 (apertar é permitido e registrado; afrouxar não é)",
        guidelineTriggers: [
          "qualquer mudança de diretriz do RCP ou da BTS que toque o NEWS2",
          "qualquer re-pin de contrato da AMH que afete um insumo",
        ],
        reviewDueAt: addMonthsUtc(authoredAt, NEWS2_RETIREMENT_CADENCE_MONTHS),
        supersededBy: null,
      },
    },

    configurationEnvelope: {
      enforcementPoint:
        "o MESMO carregador que verifica a assinatura do bundle (ADR-0007 §4.7) — nunca " +
        "uma checagem de papel `admin` separada e contornável (defeito legado E8/SF-4)",
      // A taxonomia A7-2 também fixa direções para `cooldown` (menor aperta)
      // e `rate limit` (maior aperta). RULE-NEWS2 0.2.0 não publica nenhum
      // desses campos; declará-los aqui exigiria inventar valores clínicos.
      // Ficam de fora — e essa ausência é a resposta honesta, não um
      // esquecimento.
      fields: [
        {
          fieldId: "aggregate_urgent_threshold",
          label: "limiar agregado de revisão urgente",
          publishedValue: 5,
          direction: "lower_is_tighter",
          tightestAllowedValue: null,
          rationale:
            "spec §4.3: configuração local PODE apertar (alertar mais cedo) e NUNCA pode " +
            "elevar o gatilho publicado. O piso de aperto permanece não declarado pelo " +
            "titular clínico (C3 aberta), então o carregador recusa toda sobrescrita.",
        },
        {
          fieldId: "aggregate_emergency_threshold",
          label: "limiar agregado de alerta de alto nível",
          publishedValue: 7,
          direction: "lower_is_tighter",
          tightestAllowedValue: null,
          rationale: "idem `aggregate_urgent_threshold` (spec §4.3)",
        },
        {
          fieldId: "red_score_tier_display",
          label: "exibição da banda de parâmetro vermelho (3 isolado)",
          publishedValue: 3,
          direction: "not_configurable",
          tightestAllowedValue: null,
          rationale:
            "spec §4.3 proíbe suprimir a banda low_medium; a banda de parâmetro vermelho " +
            "é conteúdo clínico publicado, não opção de implantação",
        },
        {
          fieldId: "parameter_band_tables",
          label: "tabelas de banda por parâmetro (RCP Chart 1)",
          publishedValue: null,
          direction: "not_configurable",
          tightestAllowedValue: null,
          rationale:
            "rebanding de qualquer parâmetro exige nova versão de bundle pelo fluxo " +
            "completo de aprovação — jamais configuração (SF-4)",
        },
      ],
    },

    provenance: {
      sourceRepo: "intensicare-V2",
      pathOrUrl:
        "docs/05-clinical-safety/rule-releases/news2/specification.md; " +
        "docs/05-clinical-safety/rule-releases/news2/reference-vectors.md; " +
        "packages/kernel-clinico/src/news2.ts",
      commitShaOrVersion:
        `RULE-NEWS2 specification.md 0.2.0; reference-vectors.md 0.2.0; ` +
        `@intensicare/kernel-clinico NEWS2_RULE_VERSION=${NEWS2_RULE_VERSION}`,
      dateCollected: "2026-08-16",
      collector: "especialista de pacote de release clínico (ciclo 6, sprint SPR-G2-3)",
      transformation:
        "campos transcritos da especificação e da ADR-0007/ADR-0025 já revisadas; " +
        "nenhum valor clínico foi derivado, arredondado ou completado por este " +
        "empacotamento. Onde a fonte diz VALIDATION REQUIRED, o campo carrega essa " +
        "declaração ou `null`.",
      confidence: "high",
      dataProvenance: `synthetic-only — ${testPack.dataProvenance}`,
    },
  };
}
