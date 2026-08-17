/**
 * packages/observabilidade/src/kill-switch.ts — kill switch e rollback de
 * regra clínica como CAPACIDADE DE CÓDIGO.
 *
 * SOURCE (ADR-0007 §4.5 eixo 5, Opção A): "Rollback apenas para versão
 * previamente aprovada + kill switch como primitiva separada ... o kill switch
 * é uma primitiva distinta — desativar sem substituição — usável quando até a
 * versão anterior é suspeita". SOURCE (ADR-0007 H3): "Um kill switch por
 * bundle, exercitável sem deploy de código, resolvendo avaliações afetadas
 * para `not_evaluated`". SOURCE (ADR-0008 §8.3): "as avaliações do release
 * morto transitam para `not_evaluated` (razão `rule_unavailable`), jamais
 * no-fire silencioso". SOURCE (prompt §11): estados visivelmente distintos
 * para avaliação não realizada. SOURCE (§20): nunca ocultar "not evaluated".
 *
 * O que este módulo É e o que NÃO É
 * ----------------------------------
 * É: o mecanismo em processo que (i) mantém o estado de disponibilidade de
 * cada bundle, (ii) obriga o chamador a lidar com o estado desligado por meio
 * do TIPO de retorno (uma união que não tem caminho "nulo"), (iii) torna a
 * degradação visível e contável.
 *
 * NÃO é: propagação multi-instância. SOURCE (ADR-0007 D3/H3): o "tempo de
 * atuação do kill switch" e o "drill multi-instância medindo tempo de
 * propagação" são medições que exigem várias instâncias implantadas — não
 * existem aqui, e a ausência está declarada em
 * docs/13-operations-and-reliability/. Um kill switch que só age no processo
 * corrente não é o kill switch do Gate G8.
 *
 * Nenhuma alegação de efetividade clínica é feita por este módulo.
 */
import {
  createDegradationRegistry,
  type DegradationRegistry,
  type DegradedNotice,
} from "./degradation.js";
import { count, flag, label, opaqueRef, type RuleAvailabilityLabel, ruleRef } from "./redaction.js";
import type { Telemetry } from "./telemetry.js";

/** Identidade de um bundle de regra clínica (ADR-0007). */
export interface RuleBundleRef {
  /** Ex.: "RULE-NEWS2". Forma verificada por `ruleRef` antes de virar rótulo. */
  readonly ruleId: string;
  /** Semver do bundle. Ex.: "0.2.0". */
  readonly ruleVersion: string;
}

/**
 * Estado de disponibilidade. União discriminada de propósito: não existe
 * "indisponível sem razão" — toda saída do estado `active` carrega razão
 * codificada, ator e instante.
 */
export type RuleAvailability =
  | { readonly kind: "active"; readonly bundle: RuleBundleRef }
  | {
      readonly kind: "killed";
      readonly bundle: RuleBundleRef;
      readonly reasonCode: KillReasonCode;
      readonly actorRef: string;
      readonly sinceMs: number;
    }
  | {
      readonly kind: "rolled_back";
      readonly from: RuleBundleRef;
      readonly to: RuleBundleRef;
      readonly reasonCode: KillReasonCode;
      readonly actorRef: string;
      readonly sinceMs: number;
    }
  | {
      readonly kind: "load_failed";
      readonly bundle: RuleBundleRef;
      readonly sinceMs: number;
    }
  | { readonly kind: "unknown"; readonly ruleId: string };

/**
 * Razões CODIFICADAS de desligamento — nunca texto livre (mesma disciplina
 * da supressão de item de trabalho, ADR-0009 W7: razão codificada, escopo,
 * expiração). Texto livre em razão é rota de PHI e é inauditável.
 */
export const KILL_REASON_CODES = [
  "defeito_de_regra_suspeito",
  "evidencia_clinica_retirada",
  "falha_de_verificacao_de_assinatura",
  "ordem_do_titular_clinico",
  "incidente_de_seguranca",
  "ensaio_operacional",
] as const;

export type KillReasonCode = (typeof KILL_REASON_CODES)[number];

const AVAILABILITY_LABEL: Readonly<Record<RuleAvailability["kind"], RuleAvailabilityLabel>> = {
  active: "active",
  killed: "killed",
  rolled_back: "rolled_back",
  load_failed: "load_failed",
  unknown: "unknown",
};

/**
 * Resultado de uma avaliação protegida pelo switch. NÃO existe `null` nem
 * `undefined` aqui: o chamador é obrigado pelo compilador a tratar o ramo
 * `not_evaluated`, e esse ramo carrega o aviso de degradação que a API/UI
 * devem transportar. É assim que "estado degradado visível, nunca
 * silencioso" vira propriedade do tipo, e não recomendação.
 */
export type GuardedEvaluation<T> =
  | { readonly kind: "evaluated"; readonly value: T }
  | {
      readonly kind: "not_evaluated";
      /** Razão fixa da ADR-0008 §8.3 para regra indisponível. */
      readonly reason: "rule_unavailable";
      readonly availability: RuleAvailability;
      readonly notice: DegradedNotice;
    };

export interface ClinicalRuleSwitchboard {
  /** Registra/ativa um bundle. */
  readonly activate: (bundle: RuleBundleRef, actorId: string) => RuleAvailability;
  /** Desliga um bundle SEM substituição (ADR-0007 eixo 5, primitiva distinta). */
  readonly kill: (
    ruleId: string,
    input: {
      readonly reasonCode: KillReasonCode;
      readonly actorId: string;
      readonly atMs?: number;
    },
  ) => RuleAvailability;
  /** Rollback para uma versão previamente aprovada (nunca uma edição corretiva). */
  readonly rollback: (
    ruleId: string,
    input: {
      readonly to: RuleBundleRef;
      readonly reasonCode: KillReasonCode;
      readonly actorId: string;
      readonly atMs?: number;
    },
  ) => RuleAvailability;
  /** Marca falha de carga do bundle (ADR-0008 §8.3: também resolve para não avaliado). */
  readonly markLoadFailed: (bundle: RuleBundleRef, atMs?: number) => RuleAvailability;
  readonly availabilityOf: (ruleId: string) => RuleAvailability;
  /**
   * Executa a avaliação SOMENTE se a regra estiver ativa. O sistema não cai:
   * o laço continua, e o resultado é um estado explícito.
   */
  readonly guardEvaluation: <T>(ruleId: string, evaluate: () => T) => GuardedEvaluation<T>;
  readonly degradation: DegradationRegistry;
}

export interface SwitchboardOptions {
  readonly telemetry: Telemetry;
  /** Compartilhe o registro de degradação com o resto do processo quando houver um. */
  readonly degradation?: DegradationRegistry;
}

export function createClinicalRuleSwitchboard(
  options: SwitchboardOptions,
): ClinicalRuleSwitchboard {
  const { telemetry } = options;
  const degradation = options.degradation ?? createDegradationRegistry({ telemetry });
  const state = new Map<string, RuleAvailability>();

  function bundleOf(availability: RuleAvailability): RuleBundleRef | null {
    switch (availability.kind) {
      case "active":
      case "killed":
      case "load_failed":
        return availability.bundle;
      case "rolled_back":
        return availability.to;
      case "unknown":
        return null;
    }
  }

  function publish(ruleId: string, next: RuleAvailability, previous: RuleAvailability): void {
    const previousBundle = bundleOf(previous);
    const nextBundle = bundleOf(next);
    if (previousBundle !== null) {
      telemetry.meter.adjust("intensicare.clinical.rule_bundle.availability", count(-1), {
        rule: ruleRef(previousBundle.ruleId, previousBundle.ruleVersion),
        availability: label(AVAILABILITY_LABEL[previous.kind]),
      });
    }
    if (nextBundle !== null) {
      telemetry.meter.adjust("intensicare.clinical.rule_bundle.availability", count(1), {
        rule: ruleRef(nextBundle.ruleId, nextBundle.ruleVersion),
        availability: label(AVAILABILITY_LABEL[next.kind]),
      });
    }
    state.set(ruleId, next);

    // Degradação: qualquer estado que não seja `active` é modo degradado
    // declarado — e o registro o marca como AINDA NÃO EXIBIDO até que a
    // API/UI o transporte.
    if (next.kind === "active") {
      degradation.exit("regra_clinica_desligada");
    } else {
      degradation.enter(
        "regra_clinica_desligada",
        next.kind === "unknown" ? undefined : next.sinceMs,
      );
    }
  }

  return {
    activate(bundle, actorId) {
      const previous = state.get(bundle.ruleId) ?? { kind: "unknown", ruleId: bundle.ruleId };
      const next: RuleAvailability = { kind: "active", bundle };
      publish(bundle.ruleId, next, previous);
      telemetry.logger.emit("info", "clinical_rule.activated", {
        rule: ruleRef(bundle.ruleId, bundle.ruleVersion),
        "actor.ref": opaqueRef(actorId),
        availability: label("active"),
      });
      return next;
    },

    kill(ruleId, input) {
      const previous = state.get(ruleId) ?? { kind: "unknown", ruleId };
      const bundle = bundleOf(previous) ?? { ruleId, ruleVersion: "0.0.0" };
      const next: RuleAvailability = {
        kind: "killed",
        bundle,
        reasonCode: input.reasonCode,
        actorRef: opaqueRef(input.actorId),
        sinceMs: input.atMs ?? telemetry.clock(),
      };
      publish(ruleId, next, previous);
      telemetry.logger.emit("error", "clinical_rule.killed", {
        rule: ruleRef(bundle.ruleId, bundle.ruleVersion),
        "actor.ref": opaqueRef(input.actorId),
        availability: label("killed"),
      });
      telemetry.meter.add("intensicare.ops.failure.total", count(1), {
        category: label("rule_load_failure"),
      });
      return next;
    },

    rollback(ruleId, input) {
      const previous = state.get(ruleId) ?? { kind: "unknown", ruleId };
      const from = bundleOf(previous) ?? { ruleId, ruleVersion: "0.0.0" };
      const next: RuleAvailability = {
        kind: "rolled_back",
        from,
        to: input.to,
        reasonCode: input.reasonCode,
        actorRef: opaqueRef(input.actorId),
        sinceMs: input.atMs ?? telemetry.clock(),
      };
      publish(ruleId, next, previous);
      telemetry.logger.emit("warn", "clinical_rule.rolled_back", {
        rule: ruleRef(input.to.ruleId, input.to.ruleVersion),
        "actor.ref": opaqueRef(input.actorId),
        availability: label("rolled_back"),
      });
      return next;
    },

    markLoadFailed(bundle, atMs) {
      const previous = state.get(bundle.ruleId) ?? { kind: "unknown", ruleId: bundle.ruleId };
      const next: RuleAvailability = {
        kind: "load_failed",
        bundle,
        sinceMs: atMs ?? telemetry.clock(),
      };
      publish(bundle.ruleId, next, previous);
      telemetry.meter.add("intensicare.ops.failure.total", count(1), {
        category: label("rule_load_failure"),
      });
      return next;
    },

    availabilityOf(ruleId) {
      return state.get(ruleId) ?? { kind: "unknown", ruleId };
    },

    guardEvaluation<T>(ruleId: string, evaluate: () => T): GuardedEvaluation<T> {
      const availability = state.get(ruleId) ?? { kind: "unknown", ruleId };
      if (availability.kind === "active") {
        return { kind: "evaluated", value: evaluate() };
      }
      // Rollback é um estado degradado, mas a versão de destino AVALIA. O
      // ramo abaixo cobre killed / load_failed / unknown, que não avaliam.
      if (availability.kind === "rolled_back") {
        return { kind: "evaluated", value: evaluate() };
      }
      const notice = degradation.enter("regra_clinica_desligada");
      // A avaliação NÃO REALIZADA é contada como avaliação de estado
      // `not_evaluated` — nunca omitida da série. Omiti-la faria a taxa de
      // insumo ausente e a prevalência do §15.3 b5 mentirem por construção.
      telemetry.meter.add("intensicare.clinical.evaluation.total", count(1), {
        status: label("not_evaluated"),
      });
      telemetry.logger.emit("warn", "evaluation.not_evaluated", {
        availability: label(AVAILABILITY_LABEL[availability.kind]),
        degraded: flag(true),
      });
      return { kind: "not_evaluated", reason: "rule_unavailable", availability, notice };
    },

    degradation,
  };
}
