/**
 * Implementação de REFERÊNCIA da camada anticorrupção do consumidor —
 * as duas portas propostas em
 * `inventario-interfaces-e-matriz-compatibilidade.md` §2
 * (`PORTA-EVT-IDENT` e `PORTA-RESOLVE`) reduzidas a código executável para
 * que os cenários §7.6 deixem de ser prosa.
 *
 * LIMITE DURO, repetido no README e no relatório
 * ----------------------------------------------
 * Esta é a implementação de referência DO HARNESS. Ela prova que o
 * comportamento ESPECIFICADO é implementável e que as fixtures pinadas o
 * exercitam. Ela **não** é o caminho de ingestão de produção (`apps/api`),
 * e portanto **não** demonstra que o produto se comporta assim — ligar o
 * caminho de produção a este harness é trabalho pendente, registrado como
 * tal. E nada aqui demonstra compatibilidade com a AMH: a AMH não está
 * acessível, nenhum dado real foi acessado, o achado permanece
 * "candidato a integração" e a matriz 47/47 inelegíveis não se move.
 *
 * Ordem das verificações (não é arbitrária)
 * -----------------------------------------
 *  0. Propósito de uso (CTS-21) — recusa antes de qualquer leitura.
 *  1. Retenção durável do envelope ANTES de qualquer reconhecimento
 *     (HAZ-0012): reconhecer o que não está durável é perda silenciosa.
 *  2. Proibição de CONTEÚDO (invariante 1) antes de qualquer tolerância a
 *     campo extra — a regra de tolerant reader não cobre proibição de
 *     conteúdo (CTS-20).
 *  3. Envelope mínimo, vocabulário, escopo, invariantes 3/4/5.
 *  4. Deduplicação por `{amh_tenant, legal_entity, idempotency_key}`
 *     (jamais chave derivada de dado do paciente — HAZ-0009, ADR-0005 M9).
 *  5. Retenção pendente quando `correction_of` aponta evento não visto.
 *  6. Aplicação, com proveniência completa e `quality: unknown` explícito.
 *
 * Nenhuma alegação de efetividade clínica é feita por este módulo.
 */
import { createHash } from "node:crypto";
import type { SourceQuality } from "@intensicare/dominio";
import {
  detectRawSourceIdentifierFields,
  IDENTITY_EVENT_TYPES,
  type IdentityEventType,
  looksLikePsr,
  type ParsedEnvelope,
  parseEnvelope,
  requiredString,
  SUPPORTED_EVENT_TYPE_VERSION,
} from "./envelope.js";
import { formatReason, QUARANTINE_REASONS, type QuarantineReason, reason } from "./quarantine.js";
import { projectMesh, type RefMeshState, type RefTransition } from "./ref-mesh.js";

/** Versão da própria camada de tradução (proveniência: versão de mapeamento). */
export const MAPPING_VERSION = "conformidade-acl/0.1.0" as const;

/** Único propósito de uso admitido no laço clínico (AQ-3 = C, DECIDIDO). */
export const ALLOWED_PURPOSE = "tratamento" as const;

/**
 * Campos de permissão de CONTATO — base legal jamais deriva deles
 * (invariante declarada verificável em teste pela ata; CTS-21).
 */
export const CONTACT_PERMISSION_FIELDS = [
  "ie_perm_sms_email",
  "ie_perm_sms",
  "ie_perm_email",
  "ie_perm_whatsapp",
  "permissao_de_contato",
] as const;

export interface Scope {
  readonly amhTenant: string;
  readonly legalEntity: string;
}

export interface ConsumptionContext {
  readonly purpose: string;
  readonly authorizedScopes: readonly Scope[];
  /**
   * Campo do qual a base legal foi derivada. `"contrato-de-tratamento"` é
   * o único valor admitido nesta fatia; qualquer permissão de contato é
   * rejeitada por construção.
   */
  readonly legalBasisSource: string;
}

export interface DeliveryInput {
  readonly raw: string;
  /** Instante de recebimento GERADO PELA V2 — nunca confundido com os da fonte. */
  readonly receivedAtUtc: string;
}

/** Proveniência retida por transição aplicada (`mapeamento-semantico.md` §6). */
export interface TranslationProvenance {
  readonly retainedEnvelopeSha256: string;
  readonly retainedEnvelopeBytes: number;
  readonly eventId: string;
  readonly idempotencyKey: string;
  readonly sourceEventType: string;
  readonly occurredAtUtc: string;
  readonly emittedAtUtc: string;
  readonly receivedAtUtc: string;
  readonly persistedAtUtc: string;
  readonly contractEventTypeVersion: string;
  /**
   * Digest do manifesto de contrato PINADO no momento do consumo.
   * `null` porque nenhum manifesto foi publicado
   * (`contract-manifest.draft.yaml`: `manifest_sha256: null`,
   * `pinned: false`) — a ausência é registrada, jamais preenchida.
   */
  readonly pinnedContractManifestDigest: null;
  readonly mappingVersion: string;
  /** `unknown` EXPLÍCITO — perda L-02, jamais default silencioso a `valid`. */
  readonly sourceQuality: SourceQuality;
  /** Campos adicionais desconhecidos retidos e contados (invariante 6 / D3). */
  readonly retainedUnknownFields: readonly string[];
  /** Alcance calculado PELA V2, nunca afirmado pela fonte (perda L-03). */
  readonly derivedScopeRule: string;
}

export type DeliveryOutcome =
  | {
      readonly kind: "aplicado";
      readonly transition: RefTransition;
      readonly provenance: TranslationProvenance;
      readonly acknowledged: true;
    }
  | { readonly kind: "deduplicado"; readonly eventId: string; readonly acknowledged: true }
  | {
      readonly kind: "quarentenado";
      readonly reason: QuarantineReason;
      readonly segregated: boolean;
      readonly acknowledged: true;
    }
  | {
      readonly kind: "retencao-pendente";
      readonly awaitingEventId: string;
      readonly acknowledged: true;
    }
  | {
      readonly kind: "recusado";
      readonly reason: QuarantineReason;
      /** Recusa de consumo NÃO reconhece a mensagem: nada foi consumido. */
      readonly acknowledged: false;
    }
  | {
      readonly kind: "nao-durabilizado";
      readonly reason: QuarantineReason;
      /** HAZ-0012: sem persistência durável, NÃO se reconhece. */
      readonly acknowledged: false;
    };

export interface JournalEntry {
  readonly sequence: number;
  readonly raw: string;
  readonly sha256: string;
  readonly receivedAtUtc: string;
  readonly persistedAtUtc: string;
}

export interface QuarantineEntry {
  readonly reason: QuarantineReason;
  readonly journalSequence: number;
  readonly segregated: boolean;
  readonly eventId: string | null;
}

export interface PendingEntry {
  readonly journalSequence: number;
  readonly eventId: string;
  readonly awaitingEventId: string;
  readonly receivedAtUtc: string;
}

export interface LaneHealth {
  readonly status: "normal" | "degradada";
  readonly maxObservedDelayMs: number;
  readonly thresholdMs: number;
  readonly thresholdProvenance: string;
}

export interface AnticorruptionLayerOptions {
  readonly context: ConsumptionContext;
  /**
   * Limiar de atraso de lane. PREMISSA (reversível, GDEC-0015/0017): a
   * AMH **não declarou** latência (`OS-17` critério 3 permanece
   * `VALIDATION_REQUIRED`), logo este número é PARÂMETRO DO HARNESS para
   * tornar o comportamento observável — não é número da AMH e não é
   * requisito clínico.
   */
  readonly laneDelayThresholdMs?: number;
  /** Falha de durabilidade injetável (para exercitar HAZ-0012). */
  readonly durableJournalFails?: boolean;
}

const DEFAULT_LANE_DELAY_THRESHOLD_MS = 60_000;

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function isIdentityEventType(value: string): value is IdentityEventType {
  return (IDENTITY_EVENT_TYPES as readonly string[]).includes(value);
}

/** Sufixo `.vN` de `event_type` — base da checagem de discordância L-09. */
function eventTypeSuffixVersion(eventType: string): string | null {
  const match = /\.v(\d+)$/.exec(eventType);
  return match?.[1] ?? null;
}

export class AnticorruptionLayer {
  private readonly context: ConsumptionContext;
  private readonly laneDelayThresholdMs: number;
  private readonly durableJournalFails: boolean;

  private readonly journalEntries: JournalEntry[] = [];
  private readonly quarantineEntries: QuarantineEntry[] = [];
  private readonly pendingEntries: PendingEntry[] = [];
  private readonly appliedTransitions: RefTransition[] = [];
  private readonly provenances: TranslationProvenance[] = [];
  private readonly seenIdempotencyKeys = new Set<string>();
  private readonly appliedEventIds = new Set<string>();
  private readonly refsUnderReview = new Set<string>();
  private readonly refScopes = new Map<string, string>();
  private unknownFieldObservations = 0;
  private maxObservedDelayMs = 0;

  constructor(options: AnticorruptionLayerOptions) {
    this.context = options.context;
    this.laneDelayThresholdMs = options.laneDelayThresholdMs ?? DEFAULT_LANE_DELAY_THRESHOLD_MS;
    this.durableJournalFails = options.durableJournalFails ?? false;
  }

  get journal(): readonly JournalEntry[] {
    return this.journalEntries;
  }

  get quarantine(): readonly QuarantineEntry[] {
    return this.quarantineEntries;
  }

  get pending(): readonly PendingEntry[] {
    return this.pendingEntries;
  }

  get provenance(): readonly TranslationProvenance[] {
    return this.provenances;
  }

  get transitions(): readonly RefTransition[] {
    return this.appliedTransitions;
  }

  get unknownFieldCount(): number {
    return this.unknownFieldObservations;
  }

  get subjectsUnderReview(): readonly string[] {
    return [...this.refsUnderReview].sort();
  }

  /** A malha é sempre RECALCULADA do journal — projeção, nunca estado primário. */
  mesh(asOfUtc?: string): RefMeshState {
    return projectMesh(this.appliedTransitions, {
      ...(asOfUtc === undefined ? {} : { asOfUtc }),
      refsUnderReview: [...this.refsUnderReview],
    });
  }

  laneHealth(): LaneHealth {
    return {
      status: this.maxObservedDelayMs > this.laneDelayThresholdMs ? "degradada" : "normal",
      maxObservedDelayMs: this.maxObservedDelayMs,
      thresholdMs: this.laneDelayThresholdMs,
      thresholdProvenance:
        "PARÂMETRO DO HARNESS — a AMH não declarou latência (OS-17 crit. 3 VALIDATION_REQUIRED)",
    };
  }

  deliver(input: DeliveryInput): DeliveryOutcome {
    // 0. Propósito e base legal — recusa de consumo precede tudo (CTS-21).
    const refusal = this.checkConsumptionContext();
    if (refusal) return refusal;

    // 1. Retenção durável ANTES de reconhecer (HAZ-0012).
    if (this.durableJournalFails) {
      return {
        kind: "nao-durabilizado",
        acknowledged: false,
        reason: reason(
          QUARANTINE_REASONS.UNSPECIFIED_CONDITION,
          "HAZ-0012 — falha de persistência durável; a mensagem NÃO é reconhecida",
        ),
      };
    }
    const entry = this.appendToJournal(input);
    const envelope = parseEnvelope(input.raw);
    // Campo adicional desconhecido é contado UMA vez, na chegada — nunca
    // descartado em silêncio (invariante 6 + deriva D3).
    this.unknownFieldObservations += envelope.unknownFields.length;

    return this.process(entry, input.receivedAtUtc);
  }

  /**
   * Classifica (e aplica, se for o caso) um envelope JÁ retido no journal.
   * Separado de `deliver` para que a liberação de uma retenção pendente
   * reprocesse o envelope RETIDO sem re-journalizá-lo: o journal é
   * append-only de CHEGADAS, não de tentativas de processamento.
   */
  private process(entry: JournalEntry, receivedAtUtc: string): DeliveryOutcome {
    const envelope = parseEnvelope(entry.raw);
    const classified = this.classify(envelope, entry, receivedAtUtc);
    if (classified.kind === "quarentenado") {
      this.quarantineEntries.push({
        reason: classified.reason,
        journalSequence: entry.sequence,
        segregated: classified.segregated,
        eventId: requiredString(envelope, "event_id") ?? null,
      });
    }
    return classified;
  }

  private checkConsumptionContext(): DeliveryOutcome | null {
    if (this.context.purpose !== ALLOWED_PURPOSE) {
      return {
        kind: "recusado",
        acknowledged: false,
        reason: reason(
          QUARANTINE_REASONS.PURPOSE_NOT_PERMITTED,
          `AQ-3 = C (DECIDIDO): contrato mono-propósito "${ALLOWED_PURPOSE}"`,
          this.context.purpose,
        ),
      };
    }
    const lowered = this.context.legalBasisSource.toLowerCase();
    if (CONTACT_PERMISSION_FIELDS.some((field) => lowered.includes(field))) {
      return {
        kind: "recusado",
        acknowledged: false,
        reason: reason(
          QUARANTINE_REASONS.LEGAL_BASIS_FROM_CONTACT_PERMISSION,
          "ata AQ-3: base legal JAMAIS deriva de permissão de contato — invariante verificável em teste",
          this.context.legalBasisSource,
        ),
      };
    }
    return null;
  }

  private appendToJournal(input: DeliveryInput): JournalEntry {
    const entry: JournalEntry = {
      sequence: this.journalEntries.length + 1,
      raw: input.raw,
      sha256: sha256(input.raw),
      receivedAtUtc: input.receivedAtUtc,
      // Nesta fatia o instante de persistência coincide com o de
      // recebimento porque o journal é síncrono e em memória; os DOIS
      // campos existem separados de propósito (ADR-0005 M3) e nenhum deles
      // se confunde com `occurred_at`/`emitted_at` da fonte.
      persistedAtUtc: input.receivedAtUtc,
    };
    this.journalEntries.push(entry);
    return entry;
  }

  private quarantined(value: QuarantineReason, segregated = false): DeliveryOutcome {
    return { kind: "quarentenado", reason: value, segregated, acknowledged: true };
  }

  private classify(
    envelope: ParsedEnvelope,
    entry: JournalEntry,
    receivedAtUtc: string,
  ): DeliveryOutcome {
    if (envelope.fields === null) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.MALFORMED_ENVELOPE,
          `envelope não legível como objeto JSON: ${envelope.jsonError ?? "erro não descrito"}`,
        ),
      );
    }

    // 2. Proibição de CONTEÚDO antes da tolerância a campo extra (CTS-20).
    const rawIdentifierFields = detectRawSourceIdentifierFields(envelope);
    if (rawIdentifierFields.length > 0) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.RAW_SOURCE_IDENTIFIER_PRESENT,
          "invariante 1 / AQ-4 / XRD-05 — só refs opacas atravessam a fronteira; " +
            "o VALOR não é reproduzido em relatório (quarentena de acesso segregado)",
          rawIdentifierFields.join("+"),
        ),
        true,
      );
    }

    // 3. Envelope mínimo.
    if (envelope.missingRequiredFields.length > 0) {
      const missing = envelope.missingRequiredFields[0] ?? "desconhecido";
      const token =
        missing === "idempotency_key"
          ? QUARANTINE_REASONS.MISSING_IDEMPOTENCY_KEY
          : QUARANTINE_REASONS.MISSING_ENVELOPE_FIELD;
      return this.quarantined(
        reason(
          token,
          missing === "idempotency_key"
            ? "invariante 2 — sem chave, entrega at-least-once não é deduplicável e o replay deixa de ser determinístico"
            : "envelope mínimo §2 — campo obrigatório 1..1 ausente; jamais preenchido por default",
          missing,
        ),
      );
    }

    const eventId = requiredString(envelope, "event_id");
    const eventType = requiredString(envelope, "event_type");
    const eventTypeVersion = requiredString(envelope, "event_type_version");
    const idempotencyKey = requiredString(envelope, "idempotency_key");
    const amhTenant = requiredString(envelope, "amh_tenant");
    const legalEntity = requiredString(envelope, "legal_entity");
    const refAntiga = requiredString(envelope, "subject_ref_antiga");
    const occurredAt = requiredString(envelope, "occurred_at");
    const emittedAt = requiredString(envelope, "emitted_at");

    if (
      eventId === undefined ||
      eventType === undefined ||
      eventTypeVersion === undefined ||
      idempotencyKey === undefined ||
      amhTenant === undefined ||
      legalEntity === undefined ||
      refAntiga === undefined ||
      occurredAt === undefined ||
      emittedAt === undefined
    ) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.MISSING_ENVELOPE_FIELD,
          "campo obrigatório presente mas com tipo inesperado — jamais coagido para string",
        ),
      );
    }

    // Vocabulário e versão (deriva D2 e perda L-09).
    if (!isIdentityEventType(eventType)) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.UNKNOWN_EVENT_TYPE,
          "deriva D2 — tipo fora do enum dos seis; nunca interpretado 'por parecer com a v1'",
          eventType,
        ),
      );
    }
    if (eventTypeVersion !== SUPPORTED_EVENT_TYPE_VERSION) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.UNKNOWN_EVENT_TYPE_VERSION,
          "deriva D2 — versão de esquema desconhecida; quarentena + alarme",
          eventTypeVersion,
        ),
      );
    }
    if (eventTypeSuffixVersion(eventType) !== eventTypeVersion) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.EVENT_TYPE_VERSION_DISAGREEMENT,
          "perda L-09 — sufixo de event_type discorda de event_type_version; fail-closed, jamais escolha entre os dois",
        ),
      );
    }

    // Escopo autorizado (fail-closed).
    const authorized = this.context.authorizedScopes.some(
      (scope) => scope.amhTenant === amhTenant && scope.legalEntity === legalEntity,
    );
    if (!authorized) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.SCOPE_NOT_AUTHORIZED,
          "tenant/entidade fora do escopo autorizado — rejeição fail-closed, nunca 'aceita e resolve depois'",
          `${amhTenant}/${legalEntity}`,
        ),
      );
    }

    // Forma do PSR — jamais normalizada.
    if (!looksLikePsr(refAntiga)) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.MALFORMED_SUBJECT_REF,
          "PSR fora da forma amh:psr:v1:<...> — quarentena, nunca normalização 'quase certa'",
          "subject_ref_antiga",
        ),
      );
    }

    // Invariante 5 — `null` afirmado só em `erasure`; ausente ≠ `null` (L-08).
    const novaState = envelope.subjectRefNova;
    if (novaState.kind === "null-asserted" && eventType !== "identity.erasure.v1") {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.NULL_SUCCESSOR_OUTSIDE_ERASURE,
          "invariante 5 — subject_ref_nova nula só é válida em identity.erasure.v1",
          eventType,
        ),
      );
    }
    if (novaState.kind === "absent" && eventType !== "identity.erasure.v1") {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.MISSING_ENVELOPE_FIELD,
          "ausente ≠ null (perda L-08): sucessor ausente é envelope quebrado, não afirmação de inexistência",
          "subject_ref_nova",
        ),
      );
    }
    const refNova = novaState.kind === "present" ? novaState.value : null;
    if (refNova !== null && !looksLikePsr(refNova)) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.MALFORMED_SUBJECT_REF,
          "PSR fora da forma amh:psr:v1:<...> — quarentena, nunca normalização",
          "subject_ref_nova",
        ),
      );
    }

    // Invariante 3 — merge sem transição de ref é defeito do produtor.
    if (eventType === "identity.merge.v1" && refNova === refAntiga) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.MERGE_REFS_IDENTICAL,
          "invariante 3 — evento sem efeito é defeito do produtor, jamais no-op absorvido em silêncio",
        ),
      );
    }

    // Invariante 4 — emissão nunca anterior ao fato (HAZ-0026).
    if (emittedAt < occurredAt) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.EMITTED_BEFORE_OCCURRED,
          "invariante 4 — tempo implausível (ADR-0008 N5); jamais 'corrigido' invertendo campos",
        ),
      );
    }

    // Transição cruzando escopos já observados para as mesmas refs (CTS-18).
    const scopeKey = `${amhTenant}/${legalEntity}`;
    const crossing = [refAntiga, refNova]
      .filter((r): r is string => r !== null)
      .some((r) => {
        const seen = this.refScopes.get(r);
        return seen !== undefined && seen !== scopeKey;
      });
    if (crossing) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.CROSS_SCOPE_TRANSITION,
          "HAZ-0003/HAZ-0013/HAZ-0027 — nenhum histórico clínico é unido entre entidades legais",
          scopeKey,
        ),
        true,
      );
    }

    // Perda L-10 — alcance de reatribuição indefinido ⇒ fail-closed.
    if (eventType === "identity.reassignment.v1") {
      this.refsUnderReview.add(refAntiga);
      if (refNova !== null) this.refsUnderReview.add(refNova);
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.REASSIGNMENT_SCOPE_UNDEFINED,
          "perda L-10 / CONF-Q-08 — o envelope não carrega alcance; aplicar a todos os fatos da ref " +
            "arriscaria HAZ-0001/HAZ-0002. Sujeitos marcados como identidade em revisão",
        ),
      );
    }

    // 4. Deduplicação — chave DO CONTRATO, escopada por tenant/entidade.
    const dedupKey = `${scopeKey}#${idempotencyKey}`;
    if (this.seenIdempotencyKeys.has(dedupKey)) {
      return { kind: "deduplicado", eventId, acknowledged: true };
    }

    // Empate total de tempos no mesmo sujeito (CTS-06 / CONF-Q-12).
    const tied = this.appliedTransitions.find(
      (t) =>
        (t.from === refAntiga || t.to === refAntiga) &&
        t.occurredAtUtc === occurredAt &&
        t.emittedAtUtc === emittedAt,
    );
    if (tied) {
      return this.quarantined(
        reason(
          QUARANTINE_REASONS.TIE_BREAK_UNDECIDABLE,
          "CONF-Q-12 — o contrato desempata por ordem de emissão do produtor e o envelope só " +
            "carrega emitted_at; nenhuma ordem é escolhida arbitrariamente",
          tied.eventId,
        ),
      );
    }

    // 5. Retenção pendente — `correction_of` apontando evento não visto.
    const correctionState = envelope.correctionOf;
    const correctionOf = correctionState.kind === "present" ? correctionState.value : null;
    if (correctionOf !== null && !this.appliedEventIds.has(correctionOf)) {
      this.seenIdempotencyKeys.add(dedupKey);
      this.pendingEntries.push({
        journalSequence: entry.sequence,
        eventId,
        awaitingEventId: correctionOf,
        receivedAtUtc,
      });
      return { kind: "retencao-pendente", awaitingEventId: correctionOf, acknowledged: true };
    }

    // 6. Aplicação.
    const outcome = this.apply({
      envelope,
      entry,
      receivedAtUtc,
      eventId,
      eventType,
      eventTypeVersion,
      idempotencyKey,
      amhTenant,
      legalEntity,
      refAntiga,
      refNova,
      occurredAt,
      emittedAt,
      correctionOf,
      dedupKey,
      scopeKey,
    });
    this.releasePending();
    return outcome;
  }

  private apply(args: {
    envelope: ParsedEnvelope;
    entry: JournalEntry;
    receivedAtUtc: string;
    eventId: string;
    eventType: IdentityEventType;
    eventTypeVersion: string;
    idempotencyKey: string;
    amhTenant: string;
    legalEntity: string;
    refAntiga: string;
    refNova: string | null;
    occurredAt: string;
    emittedAt: string;
    correctionOf: string | null;
    dedupKey: string;
    scopeKey: string;
  }): DeliveryOutcome {
    const transition: RefTransition = {
      eventId: args.eventId,
      eventType: args.eventType,
      from: args.refAntiga,
      to: args.refNova,
      occurredAtUtc: args.occurredAt,
      emittedAtUtc: args.emittedAt,
      correctionOf: args.correctionOf,
      amhTenant: args.amhTenant,
      legalEntity: args.legalEntity,
    };

    const provenance: TranslationProvenance = {
      retainedEnvelopeSha256: args.entry.sha256,
      retainedEnvelopeBytes: Buffer.byteLength(args.entry.raw, "utf8"),
      eventId: args.eventId,
      idempotencyKey: args.idempotencyKey,
      sourceEventType: args.eventType,
      occurredAtUtc: args.occurredAt,
      emittedAtUtc: args.emittedAt,
      receivedAtUtc: args.receivedAtUtc,
      persistedAtUtc: args.entry.persistedAtUtc,
      contractEventTypeVersion: args.eventTypeVersion,
      pinnedContractManifestDigest: null,
      mappingVersion: MAPPING_VERSION,
      sourceQuality: "unknown",
      retainedUnknownFields: args.envelope.unknownFields,
      derivedScopeRule:
        "alcance = refs citadas no envelope; NENHUM fato clínico é re-chaveado (L-03; ADR-0004 §5.2)",
    };

    this.appliedTransitions.push(transition);
    this.provenances.push(provenance);
    this.seenIdempotencyKeys.add(args.dedupKey);
    this.appliedEventIds.add(args.eventId);
    this.refScopes.set(args.refAntiga, args.scopeKey);
    if (args.refNova !== null) this.refScopes.set(args.refNova, args.scopeKey);

    const delayMs = Date.parse(args.receivedAtUtc) - Date.parse(args.emittedAt);
    if (Number.isFinite(delayMs) && delayMs > this.maxObservedDelayMs) {
      this.maxObservedDelayMs = delayMs;
    }

    return { kind: "aplicado", transition, provenance, acknowledged: true };
  }

  /**
   * Reprocessa retenções pendentes cujo alvo de `correction_of` acabou de
   * chegar. Só o VÍNCULO é liberado — nenhuma suposição é aplicada.
   */
  private releasePending(): void {
    let released = true;
    while (released) {
      released = false;
      for (let i = this.pendingEntries.length - 1; i >= 0; i -= 1) {
        const pending = this.pendingEntries[i];
        if (pending === undefined) continue;
        if (!this.appliedEventIds.has(pending.awaitingEventId)) continue;
        const entry = this.journalEntries[pending.journalSequence - 1];
        if (entry === undefined) continue;
        this.pendingEntries.splice(i, 1);
        const dedupKey = this.dedupKeyOf(entry.raw);
        if (dedupKey !== null) this.seenIdempotencyKeys.delete(dedupKey);
        this.process(entry, pending.receivedAtUtc);
        released = true;
      }
    }
  }

  private dedupKeyOf(raw: string): string | null {
    const envelope = parseEnvelope(raw);
    const tenant = requiredString(envelope, "amh_tenant");
    const entity = requiredString(envelope, "legal_entity");
    const key = requiredString(envelope, "idempotency_key");
    if (tenant === undefined || entity === undefined || key === undefined) return null;
    return `${tenant}/${entity}#${key}`;
  }

  /**
   * Retenções pendentes além do prazo. Consultar NÃO é cosmético: marca os
   * sujeitos como **identidade em revisão** (CTS-10) — visíveis, nunca
   * silenciosos, e jamais aplicados por suposição.
   */
  markOverduePendingUnderReview(nowUtc: string, deadlineMs: number): readonly PendingEntry[] {
    const now = Date.parse(nowUtc);
    const overdue = this.pendingEntries.filter(
      (entry) => now - Date.parse(entry.receivedAtUtc) > deadlineMs,
    );
    for (const entry of overdue) {
      const envelope = parseEnvelope(this.journalEntries[entry.journalSequence - 1]?.raw ?? "");
      const refAntiga = requiredString(envelope, "subject_ref_antiga");
      if (refAntiga !== undefined) this.refsUnderReview.add(refAntiga);
    }
    return overdue;
  }

  /** Contagem por razão COMPLETA (`token:qualificador`) — visível e contada. */
  quarantineCounts(): Readonly<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const entry of this.quarantineEntries) {
      const key = formatReason(entry.reason);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }

  /** Contagem agregada por TOKEN, ignorando o qualificador. */
  quarantineCountsByToken(): Readonly<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const entry of this.quarantineEntries) {
      const key = entry.reason.token;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }
}
