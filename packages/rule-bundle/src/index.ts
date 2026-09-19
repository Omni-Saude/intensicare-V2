/**
 * @intensicare/rule-bundle
 *
 * Pacote de release clínico assinável — materializa a ADR-0007 (formato do
 * bundle, assinatura, fluxo de aprovação, ativação, rollback e retirada),
 * aceita em GDEC-0007, sobre a regra real do `@intensicare/kernel-clinico`.
 *
 * O que este pacote É
 * -------------------
 * Um formato de artefato imutável e endereçado por conteúdo (eixo 1, Opção
 * A), com serialização canônica determinística, dupla assinatura estrutural
 * (eixo 2, Opção A / A7-4), fluxo autor != aprovador codificado no SISTEMA
 * DE TIPOS além do runtime (eixo 3, Opção A / A7-1), livro-razão de
 * ativação append-only com rollback e kill switch separados (eixos 4 e 5) e
 * campo de retirada obrigatório com o teto de cadência de A7-3 (eixo 6).
 *
 * O que este pacote NÃO É
 * -----------------------
 * - Não é custódia de chave. Chave real, HSM/KMS, rotação, revogação e
 *   assinatura em CI são a cláusula adiada da ADR-0007 (§1.4 e A7-4) e a
 *   condição C5, ABERTA — pendência de G8, não simulada aqui. Nenhuma
 *   chave privada existe neste repositório.
 * - Não aprova nada. Aprovação exige uma segunda identidade humana
 *   qualificada que hoje não existe (condição C1, aberta — ver §11.2 da
 *   ADR-0007). Os testes usam pares efêmeros sintéticos gerados em memória
 *   PARA EXERCITAR O MECANISMO, jamais como evidência de aprovação.
 * - Não ativa nada para uso clínico. Ativação em modo `actionable` é
 *   recusada enquanto houver qualquer bloqueio de prontidão — e para o
 *   RULE-NEWS2 0.2.0 há vários, todos declarados no próprio manifesto.
 *
 * Estado factual preservado: 0 vias acionáveis; 47/47 candidatas
 * inelegíveis; caso de segurança clínica em M0; nenhum dado real acessado.
 * Nada aqui fecha gate, bloqueador, risco, hazard, ADR ou ordem de serviço.
 */

/** Versão do pacote, para diagnóstico. */
export const packageVersion = "0.0.0" as const;

export type {
  ActivationEvent,
  ActivationEventKind,
  ActivationMode,
  ActivationRequest,
  ActiveState,
  RegisteredBundle,
  RetirementRequest,
  RollbackRequest,
  TransitionRequest,
} from "./activation.js";
export {
  RuleActivationLedger,
  toAuditEvent,
} from "./activation.js";
export type { CanonicalJson } from "./canonical.js";
export {
  canonicalBytes,
  canonicalize,
  contentDigest,
  matchesDigest,
} from "./canonical.js";
export type { EngineBehaviorVerification, News2BundleBuildOptions } from "./news2-bundle.js";
export {
  buildNews2BundleManifest,
  computeNews2BehaviorHash,
  verifyNews2EngineBehavior,
} from "./news2-bundle.js";
export type {
  News2ExpectedOutcome,
  News2TestPack,
  News2TestVector,
  News2VectorDelta,
} from "./news2-test-pack.js";
export {
  expandNews2Vector,
  NEWS2_TEST_PACK_EVALUATION_TIME,
  parseNews2TestPack,
} from "./news2-test-pack.js";
export type { ActivationBlocker, SiteOverrideDecision } from "./readiness.js";
export { assessActivationReadiness, evaluateSiteOverride } from "./readiness.js";
export type {
  AnyBundle,
  ApprovalInput,
  ApprovedBundle,
  ApproverSigningKey,
  AuthoredBundle,
  BundleVerification,
  DetachedSignature,
  DraftBundle,
  Keyring,
  SelfApprovalForbidden,
  SignatureAlgorithm,
  SignatureRole,
  SigningKey,
  VerificationFailure,
  VerificationKey,
} from "./signing.js";
export {
  buildKeyring,
  createDraft,
  generateEphemeralKeyPair,
  reviseAsNewVersion,
  signAsApprover,
  signAsAuthor,
  verifyBundle,
} from "./signing.js";
export type { SofaBundleBuildOptions } from "./sofa-bundle.js";
export {
  buildSofaBundleManifest,
  computeSofaBehaviorHash,
  verifySofaEngineBehavior,
} from "./sofa-bundle.js";
export type {
  SofaExpectedOutcome,
  SofaTestPack,
  SofaTestVector,
  SofaVectorDelta,
} from "./sofa-test-pack.js";
export {
  expandSofaVector,
  parseSofaTestPack,
  SOFA_TEST_PACK_EVALUATION_TIME,
} from "./sofa-test-pack.js";
export type {
  Accountability,
  ApprovalRecord,
  BundleProvenance,
  BundleSchemaHeader,
  ConfigurableFieldEnvelope,
  ConfigurationEnvelope,
  EvidenceDeclaration,
  ExplainabilityContract,
  InputPolicyEntry,
  IntendedUse,
  LogicReference,
  ManifestDefect,
  MonitoringSignal,
  OperationsPolicy,
  PublishedTrigger,
  RuleBundleManifest,
  RuleIdentity,
  SafetyLinks,
  TerminologyBinding,
  TerminologySnapshotRef,
  TestPackDeclaration,
  TestPackVector,
  TightenDirection,
  ValidationStatus,
} from "./types.js";
export { validateManifest } from "./types.js";
