/**
 * Assinatura, contra-assinatura e verificação — ADR-0007 eixo 2 (Opção A,
 * "dupla assinatura estrutural", alvo decidido em A7-4) e eixo 3 (Opção A,
 * máquina de estados com autor ≠ aprovador, decidida em A7-1 como princípio
 * PERMANENTE, sem processo de exceção).
 *
 * O que este módulo torna IMPOSSÍVEL DE EXPRIMIR (não apenas inválido)
 * --------------------------------------------------------------------
 * `signAsApprover` só aceita uma chave de assinatura cujo `keyId`, ao nível
 * de TIPO, difere do `keyId` do autor. Se forem o mesmo tipo literal, o
 * parâmetro exige a marca `SelfApprovalForbidden` — uma interface com um
 * `unique symbol` que nenhum código pode construir. O programa não compila.
 * A verificação em tempo de execução permanece assim mesmo (defesa em
 * profundidade: `as` e JavaScript puro contornam o compilador; nada contorna
 * `verifyBundle`).
 *
 * Falha fechada, por construção: quando os `keyId` são o tipo largo `string`
 * (identidades resolvidas só em tempo de execução), `[P] extends [A]` é
 * verdadeiro e o portão de tipo BLOQUEIA. Para usar o portão estático é
 * preciso carregar identidades como tipos literais — que é exatamente a
 * disciplina que se quer.
 *
 * LIMITE HONESTO, dito uma vez e válido para todo o módulo: aqui existe o
 * MECANISMO de assinatura, não a CUSTÓDIA da chave. Custódia real
 * (HSM/KMS), rotação, revogação e assinatura em CI são a cláusula adiada da
 * ADR-0007 (§1.4, A7-4: "custódia de chave concreta permanece diferida à
 * futura ADR-0022") e a condição C5, aberta. Nenhuma chave real existe ou
 * deve existir neste repositório; os testes geram par efêmero em memória.
 */

import type { KeyObject } from "node:crypto";
import { generateKeyPairSync, sign, verify } from "node:crypto";
import { canonicalBytes, contentDigest } from "./canonical.js";
import type { ApprovalRecord, RuleBundleManifest } from "./types.js";

/** Contexto de domínio da assinatura — impede reuso de assinatura entre sistemas. */
const SIGNATURE_CONTEXT = "intensicare.rule-bundle.signature.v1";

/** Algoritmos suportados. Dois, de propósito: agilidade de algoritmo (D9). */
export type SignatureAlgorithm = "ed25519" | "ecdsa-p256-sha256";

/** Papel da assinatura — assinado junto, para que uma não possa virar a outra. */
export type SignatureRole = "author" | "approval";

/** Chave privada de assinatura. `K` é o tipo literal da identidade. */
export interface SigningKey<K extends string = string> {
  readonly keyId: K;
  readonly algorithm: SignatureAlgorithm;
  readonly privateKey: KeyObject;
}

/** Chave pública de verificação. */
export interface VerificationKey<K extends string = string> {
  readonly keyId: K;
  readonly algorithm: SignatureAlgorithm;
  readonly publicKey: KeyObject;
}

/** Conjunto de chaves públicas confiáveis, indexado por `keyId`. */
export type Keyring = ReadonlyMap<string, VerificationKey>;

/** Assinatura destacada sobre o digest canônico. */
export interface DetachedSignature<
  R extends SignatureRole = SignatureRole,
  K extends string = string,
> {
  readonly role: R;
  readonly keyId: K;
  readonly algorithm: SignatureAlgorithm;
  readonly signedAt: string;
  readonly signatureBase64: string;
}

declare const selfApprovalBrand: unique symbol;

/**
 * Marca inconstruível. Aparece no tipo exigido do parâmetro exatamente
 * quando o aprovador é o autor; como nenhum valor pode tê-la, o programa
 * não compila. A mensagem do compilador aponta esta propriedade.
 */
export interface SelfApprovalForbidden {
  readonly [selfApprovalBrand]: "ADR-0007 A7-1: o autor de um bundle NUNCA pode aprová-lo";
}

/**
 * Chave de aprovador aceitável: uma `SigningKey<P>` cujo `P` difere de `A`.
 * `[P] extends [A]` compara em posição invariante (tupla) para não ser
 * distributiva sobre uniões.
 */
export type ApproverSigningKey<P extends string, A extends string> = SigningKey<P> &
  ([P] extends [A] ? SelfApprovalForbidden : unknown);

/** Fase `draft` — conteúdo montado, nada assinado. */
export interface DraftBundle {
  readonly phase: "draft";
  readonly manifest: RuleBundleManifest;
  readonly manifestDigest: string;
  /** Digest do manifesto que esta versão substitui, quando é uma revisão. */
  readonly revisionOf: string | null;
}

/** Fase `authored` — o autor assinou o digest do conteúdo. */
export interface AuthoredBundle<A extends string = string> {
  readonly phase: "authored";
  readonly manifest: RuleBundleManifest;
  readonly manifestDigest: string;
  readonly revisionOf: string | null;
  readonly authorSignature: DetachedSignature<"author", A>;
}

/** Fase `approved` — contra-assinado por identidade estruturalmente distinta. */
export interface ApprovedBundle<A extends string = string, P extends string = string> {
  readonly phase: "approved";
  readonly manifest: RuleBundleManifest;
  readonly manifestDigest: string;
  readonly revisionOf: string | null;
  readonly authorSignature: DetachedSignature<"author", A>;
  readonly approval: ApprovalRecord;
  readonly approvalDigest: string;
  readonly approvalSignature: DetachedSignature<"approval", P>;
}

/** Qualquer fase — útil para funções que só leem identidade/conteúdo. */
export type AnyBundle = DraftBundle | AuthoredBundle | ApprovedBundle;

/** Carga efetivamente assinada. Nunca se assina "o objeto"; assina-se isto. */
interface SigningPayload {
  readonly context: typeof SIGNATURE_CONTEXT;
  readonly role: SignatureRole;
  readonly bundleId: string;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly manifestDigest: string;
  readonly approvalDigest: string | null;
  readonly keyId: string;
  readonly signedAt: string;
}

function buildPayload(input: {
  readonly role: SignatureRole;
  readonly manifest: RuleBundleManifest;
  readonly manifestDigest: string;
  readonly approvalDigest: string | null;
  readonly keyId: string;
  readonly signedAt: string;
}): SigningPayload {
  return {
    context: SIGNATURE_CONTEXT,
    role: input.role,
    bundleId: input.manifest.bundleId,
    ruleId: input.manifest.identity.ruleId,
    ruleVersion: input.manifest.identity.ruleVersion,
    manifestDigest: input.manifestDigest,
    approvalDigest: input.approvalDigest,
    keyId: input.keyId,
    signedAt: input.signedAt,
  };
}

function digestAlgorithmFor(algorithm: SignatureAlgorithm): string | null {
  // Ed25519 assina a mensagem inteira (o Node exige `null` como algoritmo).
  return algorithm === "ed25519" ? null : "sha256";
}

function signPayload(payload: SigningPayload, key: SigningKey): string {
  const bytes = canonicalBytes(payload);
  return sign(digestAlgorithmFor(key.algorithm), bytes, key.privateKey).toString("base64");
}

function verifyPayload(
  payload: SigningPayload,
  signatureBase64: string,
  key: VerificationKey,
): boolean {
  const bytes = canonicalBytes(payload);
  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(signatureBase64, "base64");
  } catch {
    return false;
  }
  try {
    return verify(digestAlgorithmFor(key.algorithm), bytes, key.publicKey, signatureBytes);
  } catch {
    // Assinatura malformada faz o OpenSSL lançar; isso é "inválida", nunca "válida".
    return false;
  }
}

/** Monta a fase `draft` a partir de um manifesto já completo. */
export function createDraft(
  manifest: RuleBundleManifest,
  options?: { readonly revisionOf?: string },
): DraftBundle {
  return {
    phase: "draft",
    manifest,
    manifestDigest: contentDigest(manifest),
    revisionOf: options?.revisionOf ?? null,
  };
}

/**
 * `draft` → `authored`. O `keyId` do autor fica gravado no tipo do resultado;
 * é dele que o portão estático de `signAsApprover` deriva.
 */
export function signAsAuthor<A extends string>(
  draft: DraftBundle,
  authorKey: SigningKey<A>,
  signedAt: string,
): AuthoredBundle<A> {
  const payload = buildPayload({
    role: "author",
    manifest: draft.manifest,
    manifestDigest: draft.manifestDigest,
    approvalDigest: null,
    keyId: authorKey.keyId,
    signedAt,
  });

  return {
    phase: "authored",
    manifest: draft.manifest,
    manifestDigest: draft.manifestDigest,
    revisionOf: draft.revisionOf,
    authorSignature: {
      role: "author",
      keyId: authorKey.keyId,
      algorithm: authorKey.algorithm,
      signedAt,
      signatureBase64: signPayload(payload, authorKey),
    },
  };
}

/** Campos da aprovação que o aprovador preenche (o resto é derivado). */
export interface ApprovalInput {
  readonly approverRole: string;
  readonly reviewStatement: string;
  readonly reviewedAt: string;
  readonly outstandingConditions: readonly string[];
}

/**
 * `authored` → `approved`. Duas barreiras, deliberadamente redundantes:
 *
 * 1. TIPO — `ApproverSigningKey<P, A>` exige a marca inconstruível quando
 *    `P` e `A` são o mesmo literal. Autoaprovação não compila.
 * 2. EXECUÇÃO — a comparação de `keyId` lança. Protege contra `as`,
 *    JavaScript puro e identidades resolvidas em tempo de execução.
 */
export function signAsApprover<A extends string, P extends string>(
  authored: AuthoredBundle<A>,
  approverKey: ApproverSigningKey<P, A>,
  approval: ApprovalInput,
): ApprovedBundle<A, P> {
  const key = approverKey as SigningKey<P>;

  // Comparação alargada para `string` de propósito: dentro do corpo genérico,
  // `P` e `A` são parâmetros de tipo sem relação, e comparar diretamente faria
  // o compilador declarar a checagem "sem sobreposição" — apagando justamente
  // a defesa de runtime contra o caminho não tipado.
  const approverKeyId: string = key.keyId;
  const authorKeyId: string = authored.authorSignature.keyId;

  if (approverKeyId === authorKeyId) {
    throw new Error(
      "aprovação recusada: autor e aprovador são a mesma identidade " +
        `("${key.keyId}") — ADR-0007 A7-1, princípio permanente, sem processo de exceção. ` +
        "Um segundo revisor qualificado é o único caminho (condição C1, aberta).",
    );
  }

  const approvalRecord: ApprovalRecord = {
    bundleId: authored.manifest.bundleId,
    ruleId: authored.manifest.identity.ruleId,
    ruleVersion: authored.manifest.identity.ruleVersion,
    manifestDigest: authored.manifestDigest,
    authorKeyId: authored.authorSignature.keyId,
    approverKeyId: key.keyId,
    approverRole: approval.approverRole,
    reviewStatement: approval.reviewStatement,
    reviewedAt: approval.reviewedAt,
    outstandingConditions: approval.outstandingConditions,
    retirementReviewDueAt: authored.manifest.operations.retirement.reviewDueAt,
  };

  const approvalDigest = contentDigest(approvalRecord);

  const payload = buildPayload({
    role: "approval",
    manifest: authored.manifest,
    manifestDigest: authored.manifestDigest,
    approvalDigest,
    keyId: key.keyId,
    signedAt: approval.reviewedAt,
  });

  return {
    phase: "approved",
    manifest: authored.manifest,
    manifestDigest: authored.manifestDigest,
    revisionOf: authored.revisionOf,
    authorSignature: authored.authorSignature,
    approval: approvalRecord,
    approvalDigest,
    approvalSignature: {
      role: "approval",
      keyId: key.keyId,
      algorithm: key.algorithm,
      signedAt: approval.reviewedAt,
      signatureBase64: signPayload(payload, key),
    },
  };
}

/**
 * Revisão material de um bundle já assinado (ADR-0007 §4.3 Opção A).
 *
 * Rejeição/edição NUNCA é retrabalho no lugar: produz uma NOVA versão, em
 * `draft`, ligada à anterior por `revisionOf`. A reclassificação
 * "editor vira autor" cai fora de graça: quem assinar esta nova versão como
 * autor É o autor dela — e o portão de `signAsApprover` passa a bloqueá-lo
 * como aprovador. Não é preciso mecanismo extra; é a mesma regra.
 */
export function reviseAsNewVersion(
  previous: AuthoredBundle | ApprovedBundle,
  nextManifest: RuleBundleManifest,
): DraftBundle {
  if (nextManifest.identity.ruleVersion === previous.manifest.identity.ruleVersion) {
    throw new Error(
      "revisão recusada: conteúdo imutável não pode ser editado sob a MESMA versão " +
        `("${previous.manifest.identity.ruleVersion}") — ADR-0007 §4.3 exige nova versão ` +
        "(o defeito legado E7 é exatamente a atualização in place).",
    );
  }
  return createDraft(nextManifest, { revisionOf: previous.manifestDigest });
}

/** Falha de verificação, com código estável para teste e observabilidade. */
export interface VerificationFailure {
  readonly code: string;
  readonly detail: string;
}

/** Resultado da verificação — união discriminada, nunca booleano solto. */
export type BundleVerification =
  | {
      readonly ok: true;
      readonly manifestDigest: string;
      readonly authorKeyId: string;
      readonly approverKeyId: string;
    }
  | { readonly ok: false; readonly failures: readonly VerificationFailure[] };

/**
 * Verificação completa de um bundle aprovado. Recomputa TUDO a partir do
 * conteúdo: adulterar qualquer campo do manifesto muda o digest recomputado
 * e derruba as duas assinaturas de uma vez.
 *
 * Nenhuma etapa é opcional e nenhuma falha é "aviso" — a regra não
 * negociável 13 proíbe portão de segurança consultivo.
 */
export function verifyBundle(bundle: ApprovedBundle, keyring: Keyring): BundleVerification {
  const failures: VerificationFailure[] = [];

  const recomputedManifestDigest = contentDigest(bundle.manifest);
  if (recomputedManifestDigest !== bundle.manifestDigest) {
    failures.push({
      code: "manifest_digest_mismatch",
      detail: `digest declarado ${bundle.manifestDigest} ≠ recomputado ${recomputedManifestDigest}`,
    });
  }

  const recomputedApprovalDigest = contentDigest(bundle.approval);
  if (recomputedApprovalDigest !== bundle.approvalDigest) {
    failures.push({
      code: "approval_digest_mismatch",
      detail: `digest de aprovação declarado ${bundle.approvalDigest} ≠ recomputado ${recomputedApprovalDigest}`,
    });
  }

  if (bundle.approval.manifestDigest !== recomputedManifestDigest) {
    failures.push({
      code: "approval_targets_other_content",
      detail: "a aprovação referencia um digest de manifesto diferente do conteúdo apresentado",
    });
  }

  if (bundle.approval.authorKeyId !== bundle.authorSignature.keyId) {
    failures.push({
      code: "approval_author_mismatch",
      detail: "o autor registrado na aprovação difere de quem assinou o conteúdo",
    });
  }

  if (bundle.approval.approverKeyId !== bundle.approvalSignature.keyId) {
    failures.push({
      code: "approval_approver_mismatch",
      detail: "o aprovador registrado difere de quem contra-assinou",
    });
  }

  if (bundle.authorSignature.keyId === bundle.approvalSignature.keyId) {
    failures.push({
      code: "author_equals_approver",
      detail:
        `autor e aprovador são a mesma identidade ("${bundle.authorSignature.keyId}") — ` +
        "ADR-0007 A7-1; um bundle assim nunca pode ser ativado",
    });
  }

  const authorKey = keyring.get(bundle.authorSignature.keyId);
  const approverKey = keyring.get(bundle.approvalSignature.keyId);

  if (authorKey === undefined) {
    failures.push({
      code: "unknown_author_key",
      detail: `chave "${bundle.authorSignature.keyId}" não está no keyring confiável`,
    });
  } else if (authorKey.algorithm !== bundle.authorSignature.algorithm) {
    failures.push({
      code: "author_algorithm_mismatch",
      detail: `assinatura diz ${bundle.authorSignature.algorithm}, chave é ${authorKey.algorithm}`,
    });
  } else {
    const payload = buildPayload({
      role: "author",
      manifest: bundle.manifest,
      manifestDigest: recomputedManifestDigest,
      approvalDigest: null,
      keyId: bundle.authorSignature.keyId,
      signedAt: bundle.authorSignature.signedAt,
    });
    if (!verifyPayload(payload, bundle.authorSignature.signatureBase64, authorKey)) {
      failures.push({
        code: "author_signature_invalid",
        detail: "a assinatura do autor não valida contra o conteúdo apresentado",
      });
    }
  }

  if (approverKey === undefined) {
    failures.push({
      code: "unknown_approver_key",
      detail: `chave "${bundle.approvalSignature.keyId}" não está no keyring confiável`,
    });
  } else if (approverKey.algorithm !== bundle.approvalSignature.algorithm) {
    failures.push({
      code: "approver_algorithm_mismatch",
      detail: `assinatura diz ${bundle.approvalSignature.algorithm}, chave é ${approverKey.algorithm}`,
    });
  } else {
    const payload = buildPayload({
      role: "approval",
      manifest: bundle.manifest,
      manifestDigest: recomputedManifestDigest,
      approvalDigest: recomputedApprovalDigest,
      keyId: bundle.approvalSignature.keyId,
      signedAt: bundle.approvalSignature.signedAt,
    });
    if (!verifyPayload(payload, bundle.approvalSignature.signatureBase64, approverKey)) {
      failures.push({
        code: "approval_signature_invalid",
        detail: "a contra-assinatura do aprovador não valida contra o conteúdo apresentado",
      });
    }
  }

  if (failures.length > 0) {
    return { ok: false, failures };
  }

  return {
    ok: true,
    manifestDigest: recomputedManifestDigest,
    authorKeyId: bundle.authorSignature.keyId,
    approverKeyId: bundle.approvalSignature.keyId,
  };
}

/**
 * Gera um par de chaves EFÊMERO, em memória, para teste.
 *
 * Existe aqui — e não só no teste — porque o `keyId` precisa ser um tipo
 * literal para o portão estático funcionar, e essa amarração é parte do
 * contrato do módulo. NÃO É custódia de chave: não persiste, não exporta
 * material privado em PEM, não toca disco. Custódia real é ADR-0022 (C5).
 */
export function generateEphemeralKeyPair<K extends string>(
  keyId: K,
  algorithm: SignatureAlgorithm = "ed25519",
): { readonly signingKey: SigningKey<K>; readonly verificationKey: VerificationKey<K> } {
  const { privateKey, publicKey } =
    algorithm === "ed25519"
      ? generateKeyPairSync("ed25519")
      : generateKeyPairSync("ec", { namedCurve: "prime256v1" });

  return {
    signingKey: { keyId, algorithm, privateKey },
    verificationKey: { keyId, algorithm, publicKey },
  };
}

/** Monta um keyring a partir de chaves públicas; `keyId` duplicado é erro. */
export function buildKeyring(keys: readonly VerificationKey[]): Keyring {
  const map = new Map<string, VerificationKey>();
  for (const key of keys) {
    if (map.has(key.keyId)) {
      throw new Error(`keyring: identidade duplicada "${key.keyId}" — ambiguidade é inaceitável`);
    }
    map.set(key.keyId, key);
  }
  return map;
}
