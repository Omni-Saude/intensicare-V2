/**
 * Montagem do bundle real do RULE-SOFA 0.2.0 (terceira via determinística).
 *
 * Todo valor clínico aqui é TRANSCRITO de artefato já revisado — nenhum
 * número é inventado por este módulo:
 * - `docs/05-clinical-safety/rule-releases/sofa/specification.md` 0.2.0
 *   (REVISADO CLINICAMENTE 2026-08-15, GDEC-0007; decisões OQ-1..OQ-14
 *   incorporadas; NOT ACTIONABLE);
 * - `.../logic.yaml` 0.2.0 (SHA-256 44d140f5…eb76, hash de trabalho);
 * - `.../reference-vectors.md` (CRV-SOFA-0301..0341: 38 ativos + 3
 *   aposentados);
 * - ADR-0007 (formato/assinatura/ciclo de vida), ADR-0025 (edição canônica),
 *   ADR-0008 (cinco estados — o parcial declarado renal é a ÚNICA classe
 *   ratificada, OQ-7 (b) / A8-2), ADR-0028 (gate de sedação conjunto).
 *
 * Onde a fonte diz `VALIDATION REQUIRED`, o campo carrega essa string ou
 * `null` — nunca um valor plausível fabricado para "completar" o artefato.
 *
 * Este módulo NÃO assina, NÃO aprova e NÃO ativa nada. Ele monta o
 * conteúdo; assinar é `signAsAuthor`, aprovar exige uma segunda identidade
 * humana que hoje não existe (condição C1 da ADR-0007, aberta).
 */

import {
  evaluateSofa,
  SOFA_RULE_ID,
  SOFA_RULE_VERSION,
  type SofaEvaluationInput,
} from "@intensicare/kernel-clinico";
import { contentDigest } from "./canonical.js";
import type { SofaTestPack, SofaTestVector } from "./sofa-test-pack.js";
import type { RuleBundleManifest, TestPackVector } from "./types.js";

/** Cadência-teto decidida em A7-3 (GDEC-0007). */
const DEFAULT_RETIREMENT_CADENCE_MONTHS = 24;

/**
 * Cadência deste bundle: 12 meses. Não é invenção — é a spec §9 ("scheduled
 * re-review every 12 months from ratification"), que APERTA o teto de 24
 * meses. Apertar é permitido e exige justificativa registrada; afrouxar não
 * é.
 */
const SOFA_RETIREMENT_CADENCE_MONTHS = 12;

/** Soma meses em UTC, saturando o dia no último dia do mês de destino. */
function addMonthsUtc(instant: string, months: number): string {
  const parsed = Date.parse(instant);
  if (Number.isNaN(parsed)) {
    throw new Error(`bundle SOFA: instante "${instant}" não é ISO 8601`);
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
 * Digest do COMPORTAMENTO do motor sobre o test pack inteiro (os 38 vetores
 * ativos). É a resposta direta ao defeito SF-2 do legado: a identidade do
 * bundle inclui o que o motor de fato produz. Trocar uma banda, inverter um
 * corte exato (o 5,0 da creatinina, o 400 da razão P/F) ou alterar uma
 * razão muda este hash, e `verifySofaEngineBehavior` recusa o motor antes
 * de qualquer ativação.
 */
export function computeSofaBehaviorHash(vectors: readonly SofaTestVector[]): string {
  return contentDigest(
    vectors.map((vector) => ({
      vectorId: vector.id,
      record: evaluateSofa(vector.input as SofaEvaluationInput),
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
 * (QAS-0011).
 */
export function verifySofaEngineBehavior(
  manifest: RuleBundleManifest,
  vectors: readonly SofaTestVector[],
): EngineBehaviorVerification {
  const actual = computeSofaBehaviorHash(vectors);
  if (actual !== manifest.logic.behaviorHash) {
    return { ok: false, expected: manifest.logic.behaviorHash, actual };
  }
  return { ok: true, behaviorHash: actual };
}

function toManifestVectors(pack: SofaTestPack): readonly TestPackVector[] {
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
export interface SofaBundleBuildOptions {
  readonly testPack: SofaTestPack;
  readonly authoredAt: string;
}

/**
 * Monta o manifesto imutável do RULE-SOFA 0.2.0.
 *
 * Determinístico: mesmos `testPack` e `authoredAt` ⇒ mesmos bytes canônicos
 * ⇒ mesmo digest ⇒ mesma assinatura verificável.
 */
export function buildSofaBundleManifest(options: SofaBundleBuildOptions): RuleBundleManifest {
  const { testPack, authoredAt } = options;

  return {
    schema: { format: "intensicare.rule-bundle", formatVersion: "1.0.0" },
    bundleId: `${SOFA_RULE_ID}@${SOFA_RULE_VERSION}`,
    authoredAt,

    identity: {
      ruleId: SOFA_RULE_ID,
      ruleVersion: SOFA_RULE_VERSION,
      canonicalEdition:
        "Vincent JL et al., SOFA 1996 (Intensive Care Med 22:707-710) — tabela de seis componentes, re-derivada; decisões GDEC-0007 incorporadas",
      editionCitation:
        "Vincent JL, Moreno R, Takala J, Willatts S, De Mendonça A, Bruining H, Reinhart CK, " +
        "Suter PM, Thijs LG. The SOFA (Sepsis-related Organ Failure Assessment) score to " +
        "describe organ dysfunction/failure. Intensive Care Medicine 1996;22(7):707-710. " +
        "doi:10.1007/BF01709751.",
      // A 0.2.0 declara adaptações DECIDIDAS vs Vincent verbatim (piso por
      // agente não tabelado I-5; tier provisório de 1ª hora I-3; piso por
      // presença com dose ausente — DECISÃO DERIVADA GDEC-0007 princípio 2).
      // Nenhuma delas altera VALOR DE BANDA publicado; são operacionalizações
      // declaradas na própria spec — portanto a edição canônica NÃO é
      // "variante" no sentido da ADR-0025 §5.2, e as adaptações vivem na
      // identidade, na intendedUse e nos controls.
      isVariantOfCanonicalEdition: false,
      declaredDivergences: [],
    },

    intendedUse: {
      statement:
        "Descrição consultiva da disfunção orgânica (seis componentes 0-4, total 0-24) " +
        "para apoio ao julgamento do intensivista adulto de UTI. Não é diagnóstico de " +
        "sepse (ΔSOFA ≥ 2 fora do escopo 0.2.0 — OQ-14), não é triagem (qSOFA é " +
        "instrumento separado), não emite banda de mortalidade (OQ-13) e não determina " +
        "conduta.",
      population:
        "Adulto com idade VERIFICADA >= 18 anos (gate ADR-0027; spec §1.2) — idade " +
        "desconhecida NUNCA presume adulto (population_unverified); < 18 fora da " +
        "população (out_of_population_scope). A decisão pediátrica/neonatal (IU-06) é " +
        "BLOQUEANTE e humana; uma variante pediátrica seria instrumento separado.",
      exclusions: [
        "idade verificada < 18 anos — instrumento adulto (VAL-0006/VAL-0007)",
        "idade desconhecida ou não verificável — nunca se presume adulto (HAZ-0036)",
        "carve-outs OQ-11 (b) — computar com anotação, NUNCA exclusão silenciosa: " +
          "paliativo/metas de cuidado (supressão de escalonamento com razão visível, " +
          "HAZ-0044); disfunção crônica documentada (anotação obrigatória; a explicação " +
          "não afirma agudeza); TSR (flag on_rrt); ECMO (respiratório " +
          "pf_not_interpretable_on_ecmo, demais componentes avaliam)",
      ],
      evidencedPopulatedSource: false,
      admittedByGateG2: false,
      actionabilityClassification:
        "NOT ACTIONABLE — zero observações populadas de qualquer categoria na AMH; " +
        "nenhum contrato de administração de medicamento com granularidade de dose; " +
        "nenhuma fonte de débito urinário (compatibility-finding §3). Zero de seis " +
        "componentes computáveis de fonte evidenciada. Classificação inalterada por " +
        "este empacotamento (spec §0).",
    },

    evidence: {
      primarySource: "Vincent JL et al., Intensive Care Medicine (Springer/ESICM), 1996",
      citation:
        "Vincent 1996 doi:10.1007/BF01709751 — tabela normativa única das bandas (§2 " +
        "da spec); Singer 2016 doi:10.1001/jama.2016.0287 (Sepsis-3: convenção de " +
        "baseline e advertência ΔSOFA); Evans 2021 doi:10.1007/s00134-021-06506-y (SSC " +
        "2021: restrição de triagem e vigilância de diretriz; nenhuma banda).",
      issuerUrl: "https://link.springer.com/article/10.1007/BF01709751",
      snapshotDate: "2026-08-15",
      openSurveillanceItems: [
        "HFNC: modalidade pós-1996, EXCLUÍDA das bandas 3-4 por decisão OQ-1 (a); " +
          "vigiar literatura (SOFA-HFNC é debate aberto) antes de qualquer reavaliação",
        "vínculo RxNorm dos quatro agentes tabelados: VALIDATION REQUIRED (spec §3.1 " +
          "linha 8; ATC candidatos registrados como candidatos)",
        "conceito de estado de suporte respiratório (dispositivo/procedimento): sem " +
          "código único — VALIDATION REQUIRED (spec §3.1 linha 4)",
        "vínculo de terminologia da RASS: VALIDATION REQUIRED (spec §3.1 linha 12)",
        "redação pt-BR do texto de explicação (§7): VALIDATION REQUIRED com clínicos " +
          "falantes de pt-BR — ato de comunicação clínica, não tradução",
        "precursor 0.2.0 expira em 2027-08-15 se não avançar ao mecanismo de bundle " +
          "assinado (ADR-0007); precursor expirado não pode ser reavivado sem reverificar " +
          "toda citação e todo pin (spec §9)",
      ],
    },

    accountability: {
      clinicalContentAuthor:
        "autor da especificação RULE-SOFA 0.2.0 (agente, ciclo 1 Tarefa 2) — conteúdo " +
        "re-derivado de Vincent 1996/Singer 2016; nada importado do sistema legado " +
        "(migration-notes: anti-proveniência)",
      namedClinicalReviewOfContent:
        "rodaquino-OMNI revisou o CONTEÚDO clínico em 2026-08-15 (GDEC-0007, decisões " +
        "OQ-1..OQ-14; GDEC-0008 item 4 confirmou o piso por presença). Isso NÃO é " +
        "aprovação de bundle sob a ADR-0007: a aprovação de bundle é um ato distinto, " +
        "contra-assinado por identidade diferente da que autorou o conteúdo.",
      independentBundleApproverRequired: true,
      independenceRule:
        "ADR-0007 A7-1: autor != aprovador é princípio PERMANENTE, sem processo de " +
        "exceção. Condição C1 permanece aberta. A autoria independente dos vetores " +
        "(CRV standard §8) também NÃO está satisfeita — o próprio conjunto o declara.",
    },

    logic: {
      engine: "@intensicare/kernel-clinico",
      engineEntryPoint: "evaluateSofa",
      engineRuleId: SOFA_RULE_ID,
      engineRuleVersion: SOFA_RULE_VERSION,
      behaviorHash: computeSofaBehaviorHash(testPack.vectors),
      behaviorHashMethod:
        "sha256 sobre a serialização canônica da lista [{vectorId, SofaEvaluationRecord}] " +
        "produzida pelo motor sobre os 38 vetores ativos do test pack, na ordem publicada",
      // RULE-SOFA 0.2.0 NÃO publica gatilho algum: nenhuma condição de alerta
      // existe (convenção §0.4 dos vetores), nenhuma banda de mortalidade
      // (OQ-13) e nenhum ΔSOFA (OQ-14). Lista vazia é a resposta honesta —
      // inventar gatilho aqui seria fabricar conteúdo clínico.
      publishedTriggers: [],
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
          parameter: "pao2",
          system: "http://loinc.org",
          code: "2703-7",
          ucumUnit: "mm[Hg]",
          bindingStatus: "candidate",
          note: "candidato (kPa ×7.50062 aceito como alternativa — §3.1 linha 2)",
        },
        {
          parameter: "fio2",
          system: "http://loinc.org",
          code: "3150-0",
          ucumUnit: "1",
          bindingStatus: "candidate",
          note:
            "candidato; 19994-3 registrado como alternativa; fração 0.21-1.0, % → ÷100, " +
            "unidade ausente JAMAIS é adivinhada (CRV-SOFA-0330)",
        },
        {
          parameter: "platelets",
          system: "http://loinc.org",
          code: "777-3",
          ucumUnit: "10*3/uL",
          bindingStatus: "candidate",
          note:
            "candidato; 26515-7 alternativo; 10*9/L numericamente idêntico; 0 é inválido " +
            "(sentinel legado — CRV-SOFA-0332)",
        },
        {
          parameter: "bilirubin_total",
          system: "http://loinc.org",
          code: "1975-2",
          ucumUnit: "mg/dL",
          bindingStatus: "candidate",
          note:
            "candidato; 14631-6 (molar) alternativo; µmol/L ÷17.104 exato antes da banda " +
            "(OQ-6 (a))",
        },
        {
          parameter: "map",
          system: "http://loinc.org",
          code: "8478-0",
          ucumUnit: "mm[Hg]",
          bindingStatus: "candidate",
          note:
            "candidato; derivação (PAS + 2×PAD)/3 admitida como fallback com flag " +
            "derived_map (OQ-9 (a))",
        },
        {
          parameter: "gcs_total",
          system: "http://loinc.org",
          code: "9269-2",
          ucumUnit: "{score}",
          bindingStatus: "candidate",
          note: "candidato; componentes 9267-6/9270-0/9268-4; fora de 3-15 ⇒ invalid (D-13)",
        },
        {
          parameter: "creatinine",
          system: "http://loinc.org",
          code: "2160-0",
          ucumUnit: "mg/dL",
          bindingStatus: "candidate",
          note: "candidato; 14682-9 (molar) alternativo; µmol/L ÷88.42 exato (OQ-6 (a))",
        },
        {
          parameter: "urine_output_24h",
          system: "http://loinc.org",
          code: "9187-6",
          ucumUnit: "mL",
          bindingStatus: "candidate",
          note:
            "candidato; 3167-4 alternativo; intervalo explícito de 24 h; 0 é valor válido " +
            "(anúria — CRV-SOFA-0334)",
        },
      ],
    },

    // Janelas e horizontes ratificados (OQ-9 (a) — VAL-0023 quitada para o
    // SOFA; spec §3.2). FiO2/RASS/suporte são restrições de PAREAMENTO.
    inputPolicy: [
      {
        parameter: "pao2",
        freshnessWindowMinutes: 1440,
        expiryHorizonMinutes: 2880,
        plausibleRange: [30, 700],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:resp",
      },
      {
        parameter: "fio2",
        freshnessWindowMinutes: 30,
        expiryHorizonMinutes: 30,
        plausibleRange: [0.21, 1],
        missingBehavior: "not_evaluated",
        missingReason: "unpaired_fio2",
      },
      {
        parameter: "respiratory_support_status",
        freshnessWindowMinutes: 60,
        expiryHorizonMinutes: 60,
        plausibleRange: null,
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:respiratory_support_status",
      },
      {
        parameter: "platelets",
        freshnessWindowMinutes: 1440,
        expiryHorizonMinutes: 2880,
        plausibleRange: [1, 2000],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:coag",
      },
      {
        parameter: "bilirubin_total",
        freshnessWindowMinutes: 1440,
        expiryHorizonMinutes: 2880,
        plausibleRange: [0.1, 60],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:liver",
      },
      {
        parameter: "map",
        freshnessWindowMinutes: 240,
        expiryHorizonMinutes: 480,
        plausibleRange: [20, 200],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:cv",
      },
      {
        parameter: "vasoactive_agent_e_dose",
        freshnessWindowMinutes: 120,
        expiryHorizonMinutes: 240,
        plausibleRange: null,
        missingBehavior: "floor_by_agent_presence",
        missingReason: "dose_missing_agent_presence_floor",
      },
      {
        parameter: "gcs_total",
        freshnessWindowMinutes: 720,
        expiryHorizonMinutes: 1440,
        plausibleRange: [3, 15],
        missingBehavior: "not_evaluated",
        missingReason: "missing_required_input:cns",
      },
      {
        parameter: "rass",
        freshnessWindowMinutes: 60,
        expiryHorizonMinutes: 60,
        plausibleRange: null,
        missingBehavior: "not_evaluated",
        missingReason: "sedation_state_unknown:cns",
      },
      {
        parameter: "creatinine",
        freshnessWindowMinutes: 1440,
        expiryHorizonMinutes: 2880,
        plausibleRange: [0.1, 25],
        missingBehavior: "partial",
        missingReason: "missing_required_input:renal",
      },
      {
        parameter: "urine_output_24h",
        freshnessWindowMinutes: 240,
        expiryHorizonMinutes: 480,
        plausibleRange: [0, 10000],
        missingBehavior: "partial",
        missingReason: "missing_required_input:renal",
      },
    ],

    testPack: {
      standard: "docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md",
      setId: testPack.setId,
      vectorCount: testPack.vectors.length,
      vectors: toManifestVectors(testPack),
      // §0 do documento de vetores declara textualmente que a condição de
      // independência de autoria NÃO é satisfeita (autor dos vetores = autor
      // da spec). Registrar `false` é o único registro honesto e é o que
      // bloqueia ativação acionável. Os 3 vetores aposentados
      // (CRV-SOFA-0321/0322/0323) NÃO entram no pack executável — suas
      // expectativas foram aposentadas pelas decisões GDEC-0007.
      authorshipIndependenceConfirmed: false,
      lifecycleStatus: "DRAFT",
      provenanceNote:
        `expandidos de ${testPack.sourcePath} (${testPack.dataProvenance}); instante de ` +
        `avaliação sintético pinado em ${testPack.evaluationTime} (T = 2026-08-15T12:00:00-03:00). ` +
        `38 vetores ativos executáveis + 3 aposentados (${testPack.retiredVectorIds.join(", ")}) ` +
        "mantidos fora do pack executável. A aprovação destes vetores NUNCA é evidência " +
        "clínica enquanto a autoria independente estiver pendente.",
    },

    safety: {
      hazards: ["HAZ-0005", "HAZ-0006", "HAZ-0032", "HAZ-0036", "HAZ-0043", "HAZ-0044"],
      safetyRequirements: [
        "SAF-0001",
        "SAF-0002",
        "SAF-0003",
        "SAF-0006",
        "SAF-0017",
        "SAF-0019",
        "SAF-0022",
        "SAF-0030",
        "SAF-0032",
        "SAF-0035",
        "SAF-0040",
        "SAF-0041",
      ],
      controls: [
        "HAZ-0005: proibição total de coerção a zero — ausência, staleness, invalidade " +
          "e confundimento são representáveis SOMENTE como status + razão (spec §5.2); " +
          "CRV-SOFA-0317/0318/0319 são os vetores de regressão permanentes; M-2 é o " +
          "canário de severidade 1",
        "HAZ-0006: janelas e expirações por insumo ratificadas (OQ-9 (a), §3.2); " +
          "`stale` nunca é renderizado como severidade; além da expiração é " +
          "not_evaluated (CRV-SOFA-0324/0325)",
        "HAZ-0032: disciplina UCUM — conversão exata ANTES da comparação (÷17.104, " +
          "÷88.42, ×7.50062, % → ÷100); unidade ausente/inmapeável ⇒ invalid, nunca " +
          "heurística (CRV-SOFA-0310/0330)",
        "HAZ-0036: gate populacional fail-closed — idade desconhecida nunca presume " +
          "adulto (CRV-SOFA-0327/0328/0329)",
        "HAZ-0043: classificação NOT ACTIONABLE mantida no próprio manifesto; admitting " +
          "a regra sem fonte populada evidenciada É o modo de falha (M-1 é a vigilância " +
          "de vazio)",
        "HAZ-0044: sob ordem de limitação terapêutica o escore é computado; " +
          "escalamento/work-item é suprimido com razão visível; future work-item layer " +
          "deve consultar contexto de metas de cuidado (OQ-11 (b))",
        "política de sedação FAIL-CLOSED conjunta (OQ-8 (b) = RULE-GCS OQ-GCS-2 = " +
          "ADR-0028 Q2): RASS ≤ −3 com exposição sedativa ativa OU desconhecida ⇒ " +
          "sedation_confounded; RASS ausente ⇒ sedation_state_unknown (CRV-SOFA-0333/" +
          "0338/0339; o default 0.1.0 'escora com divulgação' foi REMOVIDO)",
      ],
    },

    explainability: {
      languageTags: ["pt-BR", "en"],
      mandatoryRenderedElements: [
        "escore total e status — SOMENTE quando os seis componentes são legíveis; o " +
          "total parcial (renal declarado) carrega a flag do critério ausente e a " +
          "divulgação de limite inferior em TODA exibição — número nu nunca é emitido",
        "os seis componentes individualmente, cada um com seu próprio status e razão " +
          "(atribuição por órgão — número agregado nu não é exibição aceitável, CAND-0003)",
        "insumos utilizados com horário de origem e frescor do insumo mais antigo",
        "insumos ausentes/desatualizados/inválidos/confundidos NOMEADOS, um a um",
        "a versão da regra",
        "o enquadramento consultivo (não é diretriz; não é diagnóstico de sepse; não " +
          "distingue agudo de crônico)",
        "ausência de escore NUNCA é apresentada como tranquilidade",
      ],
      mandatoryAnnotations: [
        "provisório — infusão <1h (§4.4 I-3)",
        "agente vasoativo não tabelado — piso CV 3 (§4.4 I-5)",
        "dose ausente — piso por presença do agente (§4.4, DECISÃO DERIVADA GDEC-0007 " +
          "princípio 2)",
        "PAM derivada de PAS/PAD (§4.4/OQ-9 (a))",
        "flag do critério renal ausente + divulgação de limite inferior (§4.6 I-7)",
        "em TSR (§1.3.3)",
        "razão de supressão de escalonamento sob limitação terapêutica (§1.3.1, HAZ-0044)",
        "limitação orgânica crônica documentada — o escore não afirma agudeza (§1.3.2)",
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
          "populada evidenciada contra a qual executar (HAZ-0043; spec §10)",
        "a execução verde dos 38 vetores CRV ativos é evidência de AUTORIA red/green, " +
          "jamais evidência clínica (disciplina §0 do conjunto de vetores)",
      ],
    },

    operations: {
      monitoring: [
        {
          signalId: "m1_not_evaluated_por_unidade_dia",
          statement:
            "M-1 (HAZ-0043): participação de `not_evaluated` por motivo, por unidade-dia; " +
            "100% por 14 dias consecutivos ⇒ revisão obrigatória de portfólio; deslocamento " +
            ">20 p.p. dia-a-dia em qualquer motivo ⇒ alerta operacional",
          threshold: null,
          thresholdStatus:
            "VALIDATION REQUIRED — números PROPOSTOS pela spec §9, pendentes de ratificação",
        },
        {
          signalId: "m2_canario_zero_coercion",
          statement:
            "M-2 (HAZ-0005): qualquer total numérico com menos de seis componentes legíveis, " +
            "ou total renal-parcial exibido sem a divulgação de limite inferior ⇒ defeito " +
            "severidade 1, kill switch automático; taxa-alvo zero; UMA ocorrência bloqueia " +
            "release",
          threshold: 0,
          thresholdStatus: "limiar zero fixado pela própria spec §9 (canário)",
        },
        {
          signalId: "m3_invalid_por_razao",
          statement:
            "M-3 (HAZ-0032): taxa de `invalid` por razão; unmappable_unit > 1% do volume de " +
            "qualquer insumo em 7 dias ⇒ escalonamento de contrato de dados",
          threshold: null,
          thresholdStatus: "VALIDATION REQUIRED",
        },
        {
          signalId: "m4_gate_populacional",
          statement:
            "M-4 (HAZ-0036): proporção de avaliações bloqueadas por population_unverified; " +
            "qualquer avaliação de idade verificada < 18 ⇒ defeito severidade 1",
          threshold: null,
          thresholdStatus: "VALIDATION REQUIRED",
        },
        {
          signalId: "m5_replay_de_vetores",
          statement:
            "M-5: replay dos vetores de referência a cada deploy e mudança de terminologia; " +
            "qualquer divergência bloqueia o deploy",
          threshold: null,
          thresholdStatus: "obrigação de replay (sem limiar numérico)",
        },
      ],
      rollbackCriteria: [
        "um único evento M-2 ou M-4 de severidade 1 — automático (spec §9)",
        "divergência de replay de vetores (M-5)",
        "divergência detectada entre a lógica em execução e o hash de conteúdo assinado",
        "supersessão de diretriz de qualquer valor de banda",
      ],
      killSwitch: {
        resultingEvaluationStatus: "not_evaluated",
        resultingReason: "rule_unavailable",
        statement:
          "kill switch desativa a avaliação do RULE-SOFA platform-wide; todo consumidor " +
          "passa a mostrar `not_evaluated` (razão `rule_unavailable`) — nunca vazio, nunca " +
          "no-fire silencioso, nunca último valor congelado (spec §9).",
      },
      retirement: {
        defaultCadenceMonths: DEFAULT_RETIREMENT_CADENCE_MONTHS,
        bundleCadenceMonths: SOFA_RETIREMENT_CADENCE_MONTHS,
        cadenceOverrideJustification:
          "spec §9: 'scheduled re-review every 12 months from ratification' — APERTA o " +
          "teto de 24 meses fixado em A7-3 (apertar é permitido e registrado; afrouxar " +
          "não é). Revisão event-driven adicional: consenso Sepsis-4, atualização SSC que " +
          "toque SOFA, mudança de pin LOINC/UCUM, mudança de contrato de fonte AMH, " +
          "ratificação da ADR-0008 ou da ADR de sedação.",
        guidelineTriggers: [
          "publicação de consenso Sepsis-4 ou atualização SSC touching SOFA (spec §9)",
          "mudança de pin de value-set LOINC/UCUM de qualquer insumo (spec §3.1)",
          "mudança de contrato de fonte AMH afetando qualquer insumo do §3.1",
          "ratificação da ADR-0008 ou da ADR de confundimento por sedação (ambas " +
            "substituem partes do §4.5/§5 por desenho)",
        ],
        reviewDueAt: addMonthsUtc(authoredAt, SOFA_RETIREMENT_CADENCE_MONTHS),
        supersededBy: null,
      },
    },

    configurationEnvelope: {
      enforcementPoint:
        "o MESMO carregador que verifica a assinatura do bundle (ADR-0007 §4.7) — nunca " +
        "uma checagem de papel `admin` separada e contornável (defeito legado E8/SF-4)",
      // RULE-SOFA 0.2.0 não publica NENHUM campo configurável: não há gatilho
      // de alerta (a regra não define alerta), não há banda de mortalidade
      // (OQ-13) e as tabelas de banda são conteúdo clínico imutável que exige
      // nova versão de bundle. A ausência de fields é a resposta honesta.
      fields: [],
    },

    provenance: {
      sourceRepo: "intensicare-V2",
      pathOrUrl:
        "docs/05-clinical-safety/rule-releases/sofa/specification.md; " +
        "docs/05-clinical-safety/rule-releases/sofa/logic.yaml; " +
        "docs/05-clinical-safety/rule-releases/sofa/reference-vectors.md; " +
        "docs/05-clinical-safety/rule-releases/sofa/migration-notes.md; " +
        "packages/kernel-clinico/src/sofa.ts",
      commitShaOrVersion:
        `RULE-SOFA specification.md 0.2.0 (logic.yaml SHA-256 ` +
        `44d140f58488cbcb75ebd6b508dbfd9b374bc429181b236967f498fe38e5eb76); ` +
        `reference-vectors.md 0.2.0 (38 ativos + 3 aposentados); ` +
        `@intensicare/kernel-clinico SOFA_RULE_VERSION=${SOFA_RULE_VERSION}`,
      dateCollected: "2026-09-19",
      collector: "orquestrador ORQ-8 (fatia orq8/sofa-terceira-via)",
      transformation:
        "campos transcritos da especificação 0.2.0 (GDEC-0007 incorporado) e da " +
        "ADR-0007/ADR-0025; nenhum valor clínico foi derivado, arredondado ou completado " +
        "por este empacotamento. Onde a fonte diz VALIDATION REQUIRED, o campo carrega " +
        "essa declaração ou `null`.",
      confidence: "medium",
      dataProvenance: `synthetic-only — ${testPack.dataProvenance}`,
    },
  };
}
