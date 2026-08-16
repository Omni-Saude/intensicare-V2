/**
 * Ativação, rollback, kill switch e retirada — ADR-0007 eixos 4, 5 e 6
 * (Opção A em todos, aceitas em GDEC-0007).
 *
 * Modelo
 * ------
 * Um `RuleActivationLedger` governa UM par (regra, escopo de ativação), onde
 * escopo = ambiente + unidade/tenant. Esse recorte é deliberado: SAF-0021
 * exige que "toda instância de runtime concorde em exatamente UMA versão
 * ativa", e um livro-razão por escopo torna a pergunta "qual versão está
 * ativa?" respondível sem desempate. Múltiplos escopos = múltiplos
 * livros-razão, nunca um livro com regras de precedência implícitas (o
 * defeito E11: uma semântica de resolução, três implementações).
 *
 * O livro-razão é APPEND-ONLY e ENCADEADO por hash: cada evento carrega o
 * hash do anterior. Rollback não apaga nada — acrescenta um evento que
 * aponta para a versão anterior. "Restaurar sem perder trilha" é
 * literalmente isso: a trilha só cresce.
 *
 * `activeVersionAt(instante)` é uma função pura do livro-razão: mesma
 * sequência de eventos ⇒ mesma resposta, sempre, para qualquer instante.
 *
 * Nada aqui ativa nada sozinho. Toda ativação exige `authorizedBy` (ato
 * humano nomeado, eixo 4 Opção A: "sem auto-ativação em merge/CI verde") e
 * o modo `actionable` é RECUSADO enquanto houver bloqueio de prontidão.
 */

import type { AuditEvent } from "@intensicare/dominio";
import { contentDigest } from "./canonical.js";
import type { ActivationBlocker } from "./readiness.js";
import { assessActivationReadiness } from "./readiness.js";
import type { ApprovedBundle, Keyring } from "./signing.js";
import { verifyBundle } from "./signing.js";
import type { RuleBundleManifest } from "./types.js";

/**
 * Modo de ativação. `shadow` = avaliado e registrado, NUNCA exposto como
 * alerta acionante (linguagem literal do Gate G2). `actionable` exige, além
 * de zero bloqueios, co-autorização de privacidade/segurança (A7-5) — que
 * este código exige como campo declarado, não como caixa marcada.
 */
export type ActivationMode = "shadow" | "actionable";

export type ActivationEventKind = "activation" | "rollback" | "kill_switch" | "retirement";

/** Evento imutável do livro-razão. */
export interface ActivationEvent {
  readonly sequence: number;
  readonly kind: ActivationEventKind;
  readonly occurredAt: string;
  readonly ruleId: string;
  readonly environment: string;
  readonly scope: string;
  readonly targetVersion: string | null;
  readonly targetManifestDigest: string | null;
  readonly previousVersion: string | null;
  readonly previousManifestDigest: string | null;
  readonly mode: ActivationMode | null;
  /** Identidade humana que autorizou — nunca um pipeline, nunca uma conta compartilhada. */
  readonly authorizedBy: string;
  readonly reason: string;
  readonly previousEventHash: string | null;
  readonly eventHash: string;
}

/** Estado de ativação resolvido para um instante. */
export type ActiveState =
  | {
      readonly kind: "active";
      readonly version: string;
      readonly manifestDigest: string;
      readonly mode: ActivationMode;
      readonly since: string;
      readonly sequence: number;
    }
  | {
      readonly kind: "none";
      /**
       * `rule_unavailable` é o vocabulário já fixado por
       * `evaluation-status-semantics.md` §3.3 / spec §5.2: bundle morto, em
       * rollback ou que falhou ao carregar resolve para `not_evaluated` com
       * esta razão — NUNCA um não-disparo silencioso.
       */
      readonly reason: "never_activated" | "rule_unavailable";
      readonly since: string | null;
    };

/** Bundle aprovado e verificado, admitido no livro-razão. */
export interface RegisteredBundle {
  readonly version: string;
  readonly manifestDigest: string;
  readonly manifest: RuleBundleManifest;
  readonly authorKeyId: string;
  readonly approverKeyId: string;
  readonly blockers: readonly ActivationBlocker[];
}

function compareSemver(left: string, right: string): number {
  const parse = (value: string): readonly number[] =>
    value.split(".").map((part) => Number.parseInt(part, 10));
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const leftPart = a[index] ?? 0;
    const rightPart = b[index] ?? 0;
    if (leftPart !== rightPart) {
      return leftPart < rightPart ? -1 : 1;
    }
  }
  return 0;
}

function requireInstant(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`livro-razão de ativação: ${label} "${value}" não é um instante ISO 8601`);
  }
}

/** Parâmetros comuns a toda transição — todos obrigatórios, por desenho. */
export interface TransitionRequest {
  readonly occurredAt: string;
  readonly authorizedBy: string;
  readonly reason: string;
}

export interface ActivationRequest extends TransitionRequest {
  readonly version: string;
  readonly mode: ActivationMode;
  /**
   * A7-5: modo shadow é autorizado pela MESMA autoridade clínica que
   * autoriza ativação acionante, em instância de decisão própria, MAIS
   * co-autorização de privacidade/segurança exigida pelo Gate G2.
   */
  readonly privacySecurityCoAuthorization: string | null;
}

export interface RollbackRequest extends TransitionRequest {
  readonly toVersion: string;
}

export interface RetirementRequest extends TransitionRequest {
  readonly version: string;
  readonly supersededBy: string | null;
}

/**
 * Livro-razão append-only de um par (regra, escopo).
 *
 * Invariantes impostos, cada um mapeado à sua fonte:
 * - eventos em ordem não decrescente de `occurredAt` (determinismo de
 *   `activeVersionAt`);
 * - só ativa bundle aprovado E verificado criptograficamente (D1: "zero
 *   regras ativas não assinadas" é invariante, não meta);
 * - `actionable` recusado com qualquer bloqueio de prontidão aberto;
 * - ativação monotônica por padrão: retroceder de versão só por `rollback`
 *   explícito (eixo 4 Opção A);
 * - rollback só para versão que JÁ ESTEVE ATIVA neste escopo (eixo 5:
 *   "sempre uma versão anterior específica que ela mesma passou pelo fluxo
 *   completo", nunca "o que estava lá antes");
 * - versão retirada nunca reativa;
 * - a versão ativa não pode ser retirada sem sucessão ou kill switch antes.
 */
export class RuleActivationLedger {
  private readonly events: ActivationEvent[] = [];
  private readonly registry = new Map<string, RegisteredBundle>();
  private readonly retired = new Set<string>();

  constructor(
    readonly ruleId: string,
    readonly environment: string,
    readonly scope: string,
  ) {}

  /**
   * Admite um bundle aprovado. A verificação criptográfica acontece AQUI,
   * na admissão, e de novo em cada ativação — um registro que o caminho ao
   * vivo não consulta é exatamente o defeito legado E12.
   */
  registerApprovedBundle(bundle: ApprovedBundle, keyring: Keyring): RegisteredBundle {
    const verification = verifyBundle(bundle, keyring);
    if (!verification.ok) {
      throw new Error(
        `livro-razão de ativação: bundle recusado na admissão — ${verification.failures
          .map((failure) => `${failure.code}: ${failure.detail}`)
          .join("; ")}`,
      );
    }
    if (bundle.manifest.identity.ruleId !== this.ruleId) {
      throw new Error(
        `livro-razão de ativação: este livro governa "${this.ruleId}", não ` +
          `"${bundle.manifest.identity.ruleId}"`,
      );
    }

    const version = bundle.manifest.identity.ruleVersion;
    const existing = this.registry.get(version);
    if (existing !== undefined && existing.manifestDigest !== bundle.manifestDigest) {
      throw new Error(
        `livro-razão de ativação: a versão "${version}" já foi admitida com OUTRO conteúdo ` +
          "— versão de regra é imutável (defeito legado SF-2)",
      );
    }

    const registered: RegisteredBundle = {
      version,
      manifestDigest: bundle.manifestDigest,
      manifest: bundle.manifest,
      authorKeyId: verification.authorKeyId,
      approverKeyId: verification.approverKeyId,
      blockers: assessActivationReadiness(bundle.manifest),
    };
    this.registry.set(version, registered);
    return registered;
  }

  /** Bundles admitidos, em ordem de versão. */
  registeredBundles(): readonly RegisteredBundle[] {
    return [...this.registry.values()].sort((a, b) => compareSemver(a.version, b.version));
  }

  /** Cópia imutável da trilha. A trilha nunca encolhe. */
  history(): readonly ActivationEvent[] {
    return [...this.events];
  }

  /** Ativa uma versão neste escopo. */
  activate(request: ActivationRequest): ActivationEvent {
    this.requireChronological(request.occurredAt);
    const registered = this.requireRegistered(request.version);

    if (this.retired.has(request.version)) {
      throw new Error(
        `ativação recusada: versão "${request.version}" está retirada — reativar exige nova ` +
          "versão pelo fluxo completo, nunca ressuscitar conteúdo aposentado",
      );
    }

    if (request.mode === "actionable" && registered.blockers.length > 0) {
      throw new Error(
        "ativação ACIONÁVEL recusada (fail-closed) — bloqueios abertos:\n" +
          registered.blockers
            .map((blocker) => `  - ${blocker.code}: ${blocker.statement}`)
            .join("\n"),
      );
    }

    if (request.privacySecurityCoAuthorization === null) {
      throw new Error(
        "ativação recusada: o Gate G2 exige co-autorização de privacidade/segurança mesmo " +
          "para modo shadow (A7-5) — campo obrigatório, sem default",
      );
    }

    const current = this.activeVersionAt(request.occurredAt);
    if (current.kind === "active") {
      if (current.version === request.version && current.mode === request.mode) {
        throw new Error(
          `ativação recusada: versão "${request.version}" já está ativa em modo ${request.mode}`,
        );
      }
      if (compareSemver(request.version, current.version) < 0) {
        throw new Error(
          `ativação recusada: "${request.version}" é anterior à ativa "${current.version}". ` +
            "Retroceder é rollback explícito, não ativação silenciosa (eixo 4, monotonicidade)",
        );
      }
    }

    return this.append({
      kind: "activation",
      occurredAt: request.occurredAt,
      targetVersion: registered.version,
      targetManifestDigest: registered.manifestDigest,
      mode: request.mode,
      authorizedBy: request.authorizedBy,
      reason:
        `${request.reason} | co-autorização privacidade/segurança: ` +
        request.privacySecurityCoAuthorization,
    });
  }

  /**
   * Rollback para uma versão anterior que já esteve ativa neste escopo.
   * NÃO é "voltar ao que estava antes": o alvo é nomeado explicitamente.
   */
  rollback(request: RollbackRequest): ActivationEvent {
    this.requireChronological(request.occurredAt);
    const registered = this.requireRegistered(request.toVersion);

    if (this.retired.has(request.toVersion)) {
      throw new Error(`rollback recusado: versão-alvo "${request.toVersion}" está retirada`);
    }

    const everActive = this.events.some(
      (event) =>
        (event.kind === "activation" || event.kind === "rollback") &&
        event.targetVersion === request.toVersion,
    );
    if (!everActive) {
      throw new Error(
        `rollback recusado: "${request.toVersion}" nunca esteve ativa neste escopo. ` +
          "Rollback aponta para versão previamente ativa e aprovada (ADR-0007 eixo 5)",
      );
    }

    const current = this.activeVersionAt(request.occurredAt);
    if (current.kind === "active" && current.version === request.toVersion) {
      throw new Error(`rollback recusado: "${request.toVersion}" já é a versão ativa`);
    }

    // O modo é herdado da ativação anterior daquela versão — um rollback não
    // é ocasião para promover shadow a acionável.
    const previousActivation = [...this.events]
      .reverse()
      .find(
        (event) =>
          (event.kind === "activation" || event.kind === "rollback") &&
          event.targetVersion === request.toVersion,
      );
    const inheritedMode: ActivationMode = previousActivation?.mode ?? "shadow";

    return this.append({
      kind: "rollback",
      occurredAt: request.occurredAt,
      targetVersion: registered.version,
      targetManifestDigest: registered.manifestDigest,
      mode: inheritedMode,
      authorizedBy: request.authorizedBy,
      reason: request.reason,
    });
  }

  /**
   * Kill switch — desativa SEM substituição (primitiva separada do rollback,
   * exatamente porque às vezes nem a versão anterior é confiável). Toda
   * avaliação afetada resolve `not_evaluated` / `rule_unavailable`; nunca
   * um não-disparo silencioso (SAF-0021).
   */
  killSwitch(request: TransitionRequest): ActivationEvent {
    this.requireChronological(request.occurredAt);
    const current = this.activeVersionAt(request.occurredAt);
    if (current.kind !== "active") {
      throw new Error("kill switch recusado: não há versão ativa neste escopo");
    }

    return this.append({
      kind: "kill_switch",
      occurredAt: request.occurredAt,
      targetVersion: null,
      targetManifestDigest: null,
      mode: null,
      authorizedBy: request.authorizedBy,
      reason: request.reason,
    });
  }

  /** Retirada de uma versão (eixo 6). Versão ativa não é retirável. */
  retire(request: RetirementRequest): ActivationEvent {
    this.requireChronological(request.occurredAt);
    const registered = this.requireRegistered(request.version);

    if (this.retired.has(request.version)) {
      throw new Error(`retirada recusada: versão "${request.version}" já está retirada`);
    }

    const current = this.activeVersionAt(request.occurredAt);
    if (current.kind === "active" && current.version === request.version) {
      throw new Error(
        `retirada recusada: "${request.version}" está ativa. Ative a sucessora ou acione o ` +
          "kill switch antes — retirar sob os pés do runtime é o padrão de deriva do HAZ-0020",
      );
    }

    const event = this.append({
      kind: "retirement",
      occurredAt: request.occurredAt,
      targetVersion: registered.version,
      targetManifestDigest: registered.manifestDigest,
      mode: null,
      authorizedBy: request.authorizedBy,
      reason:
        request.supersededBy === null
          ? request.reason
          : `${request.reason} | superseded_by: ${request.supersededBy}`,
    });
    this.retired.add(request.version);
    return event;
  }

  /**
   * Qual versão está ativa em `instant` — função pura da trilha.
   * Eventos posteriores ao instante são ignorados: consultar o passado
   * devolve o passado, o que é o que um replay de auditoria precisa.
   */
  activeVersionAt(instant: string): ActiveState {
    requireInstant(instant, "instant");
    const limit = Date.parse(instant);

    let state: ActiveState = { kind: "none", reason: "never_activated", since: null };

    for (const event of this.events) {
      if (Date.parse(event.occurredAt) > limit) {
        break;
      }
      if (event.kind === "activation" || event.kind === "rollback") {
        state = {
          kind: "active",
          version: event.targetVersion as string,
          manifestDigest: event.targetManifestDigest as string,
          mode: event.mode as ActivationMode,
          since: event.occurredAt,
          sequence: event.sequence,
        };
      } else if (event.kind === "kill_switch") {
        state = { kind: "none", reason: "rule_unavailable", since: event.occurredAt };
      }
    }

    return state;
  }

  /** Verifica a cadeia de hash da trilha — detecta remoção/edição de evento. */
  verifyChain(): { readonly ok: true } | { readonly ok: false; readonly brokenAtSequence: number } {
    let previousHash: string | null = null;
    for (const event of this.events) {
      const recomputed = hashEvent(event, previousHash);
      if (recomputed !== event.eventHash || event.previousEventHash !== previousHash) {
        return { ok: false, brokenAtSequence: event.sequence };
      }
      previousHash = event.eventHash;
    }
    return { ok: true };
  }

  private requireRegistered(version: string): RegisteredBundle {
    const registered = this.registry.get(version);
    if (registered === undefined) {
      throw new Error(
        `versão "${version}" não foi admitida neste livro-razão — só bundle aprovado e ` +
          "verificado criptograficamente pode ser alvo de qualquer transição",
      );
    }
    return registered;
  }

  /**
   * Invariante de livro-razão, verificado ANTES de qualquer regra específica
   * da transição: a trilha é append-only e não retrocede no tempo. Vem
   * primeiro de propósito — um evento datado no passado é um defeito de
   * integridade da trilha, e reportá-lo como "não há versão ativa" esconderia
   * a causa real atrás de um sintoma.
   */
  private requireChronological(occurredAt: string): void {
    requireInstant(occurredAt, "occurredAt");
    const last = this.events.at(-1);
    if (last !== undefined && Date.parse(occurredAt) < Date.parse(last.occurredAt)) {
      throw new Error(
        `livro-razão de ativação: evento em "${occurredAt}" é anterior ao último ` +
          `registrado ("${last.occurredAt}") — a trilha é append-only e monotônica no tempo`,
      );
    }
  }

  private append(
    partial: Omit<
      ActivationEvent,
      | "sequence"
      | "ruleId"
      | "environment"
      | "scope"
      | "previousVersion"
      | "previousManifestDigest"
      | "previousEventHash"
      | "eventHash"
    >,
  ): ActivationEvent {
    const last = this.events.at(-1);
    const before = last === undefined ? null : this.activeVersionAt(last.occurredAt);
    const previousEventHash = last?.eventHash ?? null;

    const withoutHash = {
      sequence: this.events.length + 1,
      kind: partial.kind,
      occurredAt: partial.occurredAt,
      ruleId: this.ruleId,
      environment: this.environment,
      scope: this.scope,
      targetVersion: partial.targetVersion,
      targetManifestDigest: partial.targetManifestDigest,
      previousVersion: before?.kind === "active" ? before.version : null,
      previousManifestDigest: before?.kind === "active" ? before.manifestDigest : null,
      mode: partial.mode,
      authorizedBy: partial.authorizedBy,
      reason: partial.reason,
      previousEventHash,
    } as const;

    const event: ActivationEvent = {
      ...withoutHash,
      eventHash: contentDigest({ ...withoutHash }),
    };

    this.events.push(event);
    return event;
  }
}

/**
 * Recomputa o hash de um evento. Os campos são listados explicitamente (em
 * vez de desestruturados por exclusão) para que acrescentar um campo ao
 * evento sem incluí-lo aqui seja um erro de compilação, não um campo
 * silenciosamente fora da cadeia de integridade.
 */
function hashEvent(event: ActivationEvent, previousEventHash: string | null): string {
  return contentDigest({
    sequence: event.sequence,
    kind: event.kind,
    occurredAt: event.occurredAt,
    ruleId: event.ruleId,
    environment: event.environment,
    scope: event.scope,
    targetVersion: event.targetVersion,
    targetManifestDigest: event.targetManifestDigest,
    previousVersion: event.previousVersion,
    previousManifestDigest: event.previousManifestDigest,
    mode: event.mode,
    authorizedBy: event.authorizedBy,
    reason: event.reason,
    previousEventHash,
  });
}

/**
 * Projeta um evento de ativação no `AuditEvent` append-only do domínio
 * (ADR-0009 W6). O tenant e a chave de idempotência vêm de fora porque
 * pertencem ao comando que originou a transição, não ao livro-razão.
 */
export function toAuditEvent(
  event: ActivationEvent,
  context: { readonly tenantId: string; readonly idempotencyKey: string },
): AuditEvent {
  return {
    id: event.eventHash,
    tenantId: context.tenantId,
    actorId: event.authorizedBy,
    command: `rule-bundle.${event.kind}`,
    aggregateType: "RuleBundleActivation",
    aggregateId: `${event.ruleId}@${event.environment}/${event.scope}`,
    ...(event.previousVersion === null ? {} : { previousState: event.previousVersion }),
    ...(event.targetVersion === null ? {} : { newState: event.targetVersion }),
    occurredAt: {
      kind: "present",
      // O livro-razão só aceita instante ISO 8601 em UTC; `sourceValue`
      // preserva o texto exato recebido (ADR-0005 M3) em vez de alegar uma
      // precisão que o autor da transição não declarou.
      instant: { utc: event.occurredAt, offset: "+00:00", sourceValue: event.occurredAt },
    },
    idempotencyKey: context.idempotencyKey,
  };
}
