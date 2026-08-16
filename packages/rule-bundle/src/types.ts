/**
 * Formato do bundle de regra clínica — ADR-0007 eixo 1, Opção A (aceita,
 * GDEC-0007): "arquivo único assinado, endereçado por conteúdo".
 *
 * O manifesto abaixo materializa os 12 campos obrigatórios que a ADR-0007
 * cita do prompt §6.4 (evidência E1), mais o envelope de configuração do
 * eixo 7 (decisão A7-2, tabela POR CAMPO) e a proveniência exigida pela
 * `evidence-notation.md`. Nada aqui é opcional por conveniência: um campo
 * que pode faltar é o buraco em forma de `null` que a própria ADR (§4.6
 * Opção Z) identifica como o defeito legado SF-2.
 *
 * Separação deliberada entre manifesto e aprovação
 * ------------------------------------------------
 * O `RuleBundleManifest` é o CONTEÚDO — assinado pelo autor. A aprovação
 * (`ApprovalRecord`) é um registro SEPARADO, contra-assinado por outra
 * identidade, que referencia o digest do manifesto. Elas não podem ser um
 * objeto só: o autor assina antes de a aprovação existir, e a ADR-0007 §4.2
 * Opção A exige que as DUAS assinaturas cubram o MESMO digest de conteúdo.
 *
 * Nada neste arquivo ativa nada, aprova nada nem afirma prontidão clínica.
 */

/** Formato e versão do envelope — migrável sem reassinar conteúdo (D6). */
export interface BundleSchemaHeader {
  readonly format: "intensicare.rule-bundle";
  readonly formatVersion: string;
}

/**
 * Campo 1 do §6.4 — identidade da regra e versão semântica, com a edição
 * canônica exigida pela ADR-0025 §5.1/§5.2.
 */
export interface RuleIdentity {
  readonly ruleId: string;
  readonly ruleVersion: string;
  /** Edição canônica ratificada (ADR-0025 A25-1). */
  readonly canonicalEdition: string;
  readonly editionCitation: string;
  /**
   * ADR-0025 §5.2 item 3: é PROIBIDO citar a edição canônica contendo valor
   * numérico divergente sem declarar a divergência. `true` obriga
   * `declaredDivergences` não vazio (verificado por `validateManifest`).
   */
  readonly isVariantOfCanonicalEdition: boolean;
  readonly declaredDivergences: readonly string[];
}

/** Campo 2 do §6.4 — uso pretendido, população e exclusões. */
export interface IntendedUse {
  readonly statement: string;
  readonly population: string;
  readonly exclusions: readonly string[];
  /**
   * HAZ-0043: admitir a regra em qualquer portfólio antes de uma fonte
   * populada evidenciada É o modo de falha. Enquanto `false`, nenhuma
   * ativação acionável é possível (ver `assessActivationReadiness`).
   */
  readonly evidencedPopulatedSource: boolean;
  /** Gate G2 — portfólio de vias aprovado. Enquanto `false`, C4 permanece aberta. */
  readonly admittedByGateG2: boolean;
  readonly actionabilityClassification: string;
}

/** Campo 3 do §6.4 — evidência externa e data do snapshot. */
export interface EvidenceDeclaration {
  readonly primarySource: string;
  readonly citation: string;
  readonly issuerUrl: string;
  readonly snapshotDate: string;
  readonly openSurveillanceItems: readonly string[];
}

/**
 * Campo 4 do §6.4 — titular clínico e a EXIGÊNCIA de aprovador independente.
 * A identidade do aprovador NÃO vive aqui: ela é registrada no
 * `ApprovalRecord`, que é contra-assinado. Guardá-la no manifesto permitiria
 * ao autor declarar seu próprio aprovador — exatamente o que o eixo 3 proíbe.
 */
export interface Accountability {
  readonly clinicalContentAuthor: string;
  readonly namedClinicalReviewOfContent: string;
  readonly independentBundleApproverRequired: true;
  readonly independenceRule: string;
}

/** Gatilho publicado — valor clínico que configuração local NUNCA pode afrouxar. */
export interface PublishedTrigger {
  readonly triggerId: string;
  readonly statement: string;
  readonly value: number | null;
  readonly source: string;
}

/**
 * Campo 5 do §6.4 — lógica legível por máquina e hash de conteúdo.
 *
 * Decisão de desenho registrada: a lógica do NEWS2 vive no kernel clínico
 * (`@intensicare/kernel-clinico`), não como dados dentro do bundle.
 * Duplicar as tabelas de banda aqui recriaria o defeito E11 da ADR-0007
 * ("uma semântica, três implementações, duas divergentes"). O bundle pina
 * COMPORTAMENTO em vez de texto: `behaviorHash` é o digest canônico dos
 * resultados que o motor produz sobre o test pack inteiro. É a resposta
 * direta ao defeito SF-2 ("strings de versão de algoritmo não identificam
 * comportamento": `NEWS2-v3.0.0` sobreviveu a uma inversão de comportamento
 * com a versão inalterada). Aqui, se o comportamento mudar, o hash muda, e
 * `verifyEngineBehavior` recusa o motor.
 */
export interface LogicReference {
  readonly engine: string;
  readonly engineEntryPoint: string;
  readonly engineRuleId: string;
  readonly engineRuleVersion: string;
  readonly behaviorHash: string;
  readonly behaviorHashMethod: string;
  readonly publishedTriggers: readonly PublishedTrigger[];
}

/** Vínculo de terminologia — REFERENCIADO por ID, nunca incorporado (ADR-0007 A2/C6). */
export interface TerminologyBinding {
  readonly parameter: string;
  readonly system: string;
  readonly code: string;
  readonly ucumUnit: string | null;
  readonly bindingStatus: "candidate" | "ratified";
  readonly note: string;
}

/** Campo 6 do §6.4 — snapshot de terminologia/value-set. */
export interface TerminologySnapshotRef {
  /** `null` enquanto a ADR-0013 não existir: C6 aberta, declarada, não fingida. */
  readonly snapshotId: string | null;
  readonly snapshotMechanism: string;
  readonly bindings: readonly TerminologyBinding[];
}

/** Campo 7 do §6.4 — política de completude e frescor, por insumo. */
export interface InputPolicyEntry {
  readonly parameter: string;
  readonly freshnessWindowMinutes: number;
  readonly expiryHorizonMinutes: number;
  readonly plausibleRange: readonly [number, number] | null;
  readonly missingBehavior: string;
  readonly missingReason: string;
}

/**
 * Vetor executável do test pack. `input`/`expected` são `unknown` de
 * propósito: o manifesto é agnóstico de regra, e a validação real é feita
 * pelo canonicalizador (fail-closed em qualquer coisa que não seja JSON
 * puro). O tipo forte por regra vive no módulo da regra.
 */
export interface TestPackVector {
  readonly id: string;
  readonly description: string;
  readonly input: unknown;
  readonly expected: unknown;
}

/** Campo 8 do §6.4 — vetores de referência, fronteiras e corpus de replay. */
export interface TestPackDeclaration {
  readonly standard: string;
  readonly setId: string;
  readonly vectorCount: number;
  readonly vectors: readonly TestPackVector[];
  /**
   * `clinical-reference-vector-standard.md` §8: autor do vetor deve diferir
   * do autor da regra. Hoje NÃO é satisfeito para o conjunto NEWS2 (o próprio
   * documento-fonte o declara em §0). Enquanto `false`, os vetores servem só
   * a autoria red/green e a ativação acionável é recusada.
   */
  readonly authorshipIndependenceConfirmed: boolean;
  readonly lifecycleStatus: "DRAFT" | "RATIFIED";
  readonly provenanceNote: string;
}

/** Campo 9 do §6.4 — vínculos de perigo e controle. */
export interface SafetyLinks {
  readonly hazards: readonly string[];
  readonly safetyRequirements: readonly string[];
  readonly controls: readonly string[];
}

/** Campo 10 do §6.4 — texto de explicação e critérios de aceitação de UX. */
export interface ExplainabilityContract {
  readonly languageTags: readonly string[];
  readonly mandatoryRenderedElements: readonly string[];
  readonly mandatoryAnnotations: readonly string[];
  readonly nonColourOnlyCue: boolean;
  readonly wordingValidationStatus: string;
}

/** Campo 11 do §6.4 — status de validação retrospectiva/prospectiva. */
export interface ValidationStatus {
  readonly retrospective: "not_started" | "in_progress" | "complete";
  readonly prospective: "not_started" | "in_progress" | "complete";
  readonly notes: readonly string[];
}

/** Sinal de monitoramento declarado pelo bundle (spec §9). */
export interface MonitoringSignal {
  readonly signalId: string;
  readonly statement: string;
  /** Sem número inventado: limiar permanece `null` até ratificação do titular. */
  readonly threshold: number | null;
  readonly thresholdStatus: string;
}

/**
 * Campo 12 do §6.4 — monitoramento, critérios de rollback, kill switch e
 * data/cadência de retirada. A cadência default de 24 meses é a decisão
 * A7-3 (GDEC-0007); um bundle pode APERTAR (cadência menor) com
 * justificativa registrada, nunca AFROUXAR.
 */
export interface OperationsPolicy {
  readonly monitoring: readonly MonitoringSignal[];
  readonly rollbackCriteria: readonly string[];
  readonly killSwitch: {
    readonly resultingEvaluationStatus: "not_evaluated";
    readonly resultingReason: "rule_unavailable";
    readonly statement: string;
  };
  readonly retirement: {
    readonly defaultCadenceMonths: 24;
    readonly bundleCadenceMonths: number;
    readonly cadenceOverrideJustification: string | null;
    readonly guidelineTriggers: readonly string[];
    readonly reviewDueAt: string;
    readonly supersededBy: string | null;
  };
}

/** Direção que conta como "apertar", POR CAMPO (decisão A7-2). */
export type TightenDirection = "lower_is_tighter" | "higher_is_tighter" | "not_configurable";

/** Um campo configurável e seu envelope declarado e assinado. */
export interface ConfigurableFieldEnvelope {
  readonly fieldId: string;
  readonly label: string;
  readonly publishedValue: number | null;
  readonly direction: TightenDirection;
  /**
   * Limite declarado além do qual nem apertar é permitido. `null` significa
   * PISO NÃO DECLARADO — e nesse caso nenhuma sobrescrita é aceita
   * (fail-closed). Um piso inventado por engenharia seria conteúdo clínico
   * fabricado; recusar é a única saída honesta enquanto C3 estiver aberta.
   */
  readonly tightestAllowedValue: number | null;
  readonly rationale: string;
}

/** Eixo 7 — fronteira config-vs-conteúdo, imposta pelo mesmo carregador. */
export interface ConfigurationEnvelope {
  readonly enforcementPoint: string;
  readonly fields: readonly ConfigurableFieldEnvelope[];
}

/** Proveniência conforme `docs/00-governance/evidence-notation.md`. */
export interface BundleProvenance {
  readonly sourceRepo: string;
  readonly pathOrUrl: string;
  readonly commitShaOrVersion: string;
  readonly dateCollected: string;
  readonly collector: string;
  readonly transformation: string;
  readonly confidence: "low" | "medium" | "high";
  readonly dataProvenance: string;
}

/** O manifesto imutável — é isto que o autor assina e o aprovador contra-assina. */
export interface RuleBundleManifest {
  readonly schema: BundleSchemaHeader;
  readonly bundleId: string;
  readonly authoredAt: string;
  readonly identity: RuleIdentity;
  readonly intendedUse: IntendedUse;
  readonly evidence: EvidenceDeclaration;
  readonly accountability: Accountability;
  readonly logic: LogicReference;
  readonly terminology: TerminologySnapshotRef;
  readonly inputPolicy: readonly InputPolicyEntry[];
  readonly testPack: TestPackDeclaration;
  readonly safety: SafetyLinks;
  readonly explainability: ExplainabilityContract;
  readonly validation: ValidationStatus;
  readonly operations: OperationsPolicy;
  readonly configurationEnvelope: ConfigurationEnvelope;
  readonly provenance: BundleProvenance;
}

/**
 * Registro de aprovação — objeto SEPARADO, contra-assinado. Liga-se ao
 * conteúdo pelo `manifestDigest`: aprovar é aprovar bytes exatos, nunca
 * "a regra NEWS2" em abstrato.
 */
export interface ApprovalRecord {
  readonly bundleId: string;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly manifestDigest: string;
  /** Registrado explicitamente para que autor≠aprovador seja verificável no artefato. */
  readonly authorKeyId: string;
  readonly approverKeyId: string;
  readonly approverRole: string;
  readonly reviewStatement: string;
  readonly reviewedAt: string;
  /** Condições que a aprovação NÃO fecha (permanecem abertas após aprovar). */
  readonly outstandingConditions: readonly string[];
  readonly retirementReviewDueAt: string;
}

/** Defeito estrutural encontrado em um manifesto. */
export interface ManifestDefect {
  readonly code: string;
  readonly detail: string;
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const SEMVER = /^\d+\.\d+\.\d+$/;

/**
 * Verificação estrutural do manifesto — o "portão de esquema" da ADR-0007 §9
 * V7. Não julga conteúdo clínico (isso é do aprovador humano); julga se o
 * artefato tem a forma que o formato exige.
 */
export function validateManifest(manifest: RuleBundleManifest): readonly ManifestDefect[] {
  const defects: ManifestDefect[] = [];

  const push = (code: string, detail: string): void => {
    defects.push({ code, detail });
  };

  if (!SEMVER.test(manifest.identity.ruleVersion)) {
    push("versao_nao_semantica", `ruleVersion "${manifest.identity.ruleVersion}" não é semver`);
  }
  if (!ISO_INSTANT.test(manifest.authoredAt)) {
    push("instante_nao_iso", `authoredAt "${manifest.authoredAt}" não é ISO 8601 UTC`);
  }
  if (manifest.bundleId !== `${manifest.identity.ruleId}@${manifest.identity.ruleVersion}`) {
    push(
      "bundle_id_incoerente",
      "bundleId deve ser exatamente `<ruleId>@<ruleVersion>` para que a identidade não divirja",
    );
  }
  if (
    manifest.identity.isVariantOfCanonicalEdition &&
    manifest.identity.declaredDivergences.length === 0
  ) {
    push(
      "variante_nao_declarada",
      "ADR-0025 §5.2 item 3: variante da edição canônica exige divergências declaradas",
    );
  }
  if (
    !manifest.identity.isVariantOfCanonicalEdition &&
    manifest.identity.declaredDivergences.length > 0
  ) {
    push(
      "divergencia_sem_variante",
      "divergências declaradas mas o bundle alega ser a edição canônica — contradição",
    );
  }
  if (manifest.testPack.vectorCount !== manifest.testPack.vectors.length) {
    push(
      "test_pack_contagem_divergente",
      `vectorCount=${manifest.testPack.vectorCount} mas o pacote traz ${manifest.testPack.vectors.length} vetores`,
    );
  }
  if (manifest.testPack.vectors.length === 0) {
    push("test_pack_vazio", "um bundle sem test pack não tem como pinar comportamento");
  }
  const vectorIds = new Set<string>();
  for (const vector of manifest.testPack.vectors) {
    if (vectorIds.has(vector.id)) {
      push("test_pack_id_duplicado", `vetor "${vector.id}" aparece mais de uma vez`);
    }
    vectorIds.add(vector.id);
  }
  if (
    manifest.operations.retirement.bundleCadenceMonths >
    manifest.operations.retirement.defaultCadenceMonths
  ) {
    push(
      "cadencia_afrouxada",
      "A7-3 fixa 24 meses como TETO: a cadência do bundle pode ser menor, nunca maior",
    );
  }
  if (
    manifest.operations.retirement.bundleCadenceMonths <
      manifest.operations.retirement.defaultCadenceMonths &&
    manifest.operations.retirement.cadenceOverrideJustification === null
  ) {
    push(
      "override_de_cadencia_sem_justificativa",
      "A7-3 exige override por bundle registrado E justificado",
    );
  }
  if (!ISO_INSTANT.test(manifest.operations.retirement.reviewDueAt)) {
    push("retirada_sem_data", "a data de revisão de retirada é campo obrigatório do §6.4");
  }
  if (manifest.explainability.languageTags.length === 0) {
    push("sem_idioma_de_explicacao", "o texto de explicação é campo obrigatório do §6.4");
  }
  if (manifest.safety.hazards.length === 0) {
    push("sem_vinculo_de_perigo", "vínculos de perigo/controle são campo obrigatório do §6.4");
  }
  for (const field of manifest.configurationEnvelope.fields) {
    if (field.direction !== "not_configurable" && field.publishedValue === null) {
      push(
        "campo_configuravel_sem_valor_publicado",
        `campo "${field.fieldId}" é configurável mas não publica valor de referência`,
      );
    }
  }

  return defects;
}
