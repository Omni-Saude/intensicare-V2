/**
 * packages/observabilidade/src/readiness.ts — prontidão = CAPACIDADE SEGURA,
 * não liveness de processo.
 *
 * SOURCE (prompt §15.3): "Readiness must represent safe capability, not only
 * process liveness." SOURCE (ADR-0020 O4): "Sondas de prontidão verificam
 * capacidade segura — bundle de regras carregado e íntegro (ADR-0007),
 * dependências obrigatórias, frescor de projeção, identidade/chaves
 * obrigatórias (fail-closed, §15.2) — e não apenas liveness de processo."
 * SOURCE (§20): "never ... accept an infrastructure render, health endpoint,
 * test count, sign-off document, or model-generated report as sufficient
 * release evidence."
 *
 * Consequência dessa última linha, aplicada a este arquivo: o veredito
 * calculado aqui NÃO é evidência de release. Ele é um sinal operacional.
 *
 * ESTADO REAL (atualizado em 2026-08-17, ACH-06): esta função PASSOU a ter
 * consumidor. `apps/api/src/saude/` a liga a `GET /v1/readyz`, superfície
 * distinta de `/v1/livez` (liveness pura) e de `/v1/startupz`. O
 * `/v1/healthz` que fazia `select 1` foi preservado e está documentado como
 * liveness legado, **não utilizável para promoção**. O texto anterior —
 * "continua sendo liveness até que alguém ligue esta função a ele" — deixou
 * de ser verdadeiro e fica como registro.
 *
 * CONSEQUÊNCIA QUE NÃO DEVE SURPREENDER: no estado atual `/v1/readyz`
 * responde **503 permanente**, porque o RULE-GCS não tem artefato de bundle e
 * nenhum alvo de frescor foi validado (Gate G1). Esse é o retrato honesto de
 * um safety case em M0 com 0 vias clínicas acionáveis — não um defeito a
 * contornar. Se uma instância `degraded` deve receber tráfego é decisão
 * humana, parametrizada e fail-closed por padrão.
 *
 * Nenhuma alegação de efetividade clínica é feita por este módulo.
 */
import type { ActiveDegradation } from "./degradation.js";
import type { RuleAvailability } from "./kill-switch.js";
import { count, label, type ReadinessVerdictLabel } from "./redaction.js";
import type { Telemetry } from "./telemetry.js";

/** Razões de não prontidão. Vocabulário fechado — nunca texto livre. */
export const READINESS_REASON_CODES = [
  "rule_bundle_unavailable",
  "required_dependency_unavailable",
  "identity_not_configured",
  "projection_stale",
  "projection_freshness_threshold_unvalidated",
  "degradation_active",
  "degradation_unsurfaced",
] as const;

export type ReadinessReasonCode = (typeof READINESS_REASON_CODES)[number];

export interface ReadinessReason {
  readonly code: ReadinessReasonCode;
  /** Texto pt-BR destinado ao console operacional. Nunca carrega dado de paciente. */
  readonly detalhePt: string;
}

export interface DependencyStatus {
  /** Identificador de dependência (nome de subsistema, nunca um endereço com credencial). */
  readonly id: string;
  readonly required: boolean;
  readonly available: boolean;
}

export interface ProjectionFreshness {
  readonly projection: string;
  readonly lagMs: number;
  /**
   * Limite aceitável em ms. `null` = **VALIDATION REQUIRED** (Gate G1). Um
   * limite ausente NÃO é tratado como "sem limite": ele impede o veredito
   * `ready`, porque afirmar capacidade segura sem alvo validado seria
   * exatamente a meta inventada que o ADR-0020 D2 proíbe.
   */
  readonly limitMs: number | null;
}

export interface ReadinessInput {
  readonly ruleBundles: readonly RuleAvailability[];
  readonly dependencies: readonly DependencyStatus[];
  readonly projections: readonly ProjectionFreshness[];
  readonly identityConfigured: boolean;
  readonly degradations: readonly ActiveDegradation[];
}

export interface ReadinessVerdict {
  readonly verdict: ReadinessVerdictLabel;
  readonly reasons: readonly ReadinessReason[];
}

/**
 * Calcula o veredito. Ordem de severidade: `not_ready` > `degraded` >
 * `ready`. Regras (todas fail-closed):
 *
 *   R1 — bundle de regra não `active`/`rolled_back` ⇒ `not_ready`.
 *   R2 — dependência obrigatória indisponível ⇒ `not_ready`.
 *   R3 — identidade/chaves não configuradas ⇒ `not_ready`.
 *   R4 — degradação ativa NÃO exibida em nenhum canal ⇒ `not_ready`
 *        (degradação silenciosa é condição proibida pelo §20; o sistema não
 *        pode declarar-se pronto enquanto esconde o próprio estado).
 *   R5 — projeção acima do limite declarado ⇒ `degraded`.
 *   R6 — limite de frescor `null` (VALIDATION REQUIRED) ⇒ no máximo
 *        `degraded`, com a razão explícita. Não é ruído: é o registro de que
 *        o programa de SLO ainda não tem alvo validado.
 *   R7 — qualquer degradação ativa (já exibida) ⇒ no máximo `degraded`.
 */
export function evaluateReadiness(input: ReadinessInput): ReadinessVerdict {
  const reasons: ReadinessReason[] = [];
  let blocked = false;
  let degraded = false;

  for (const availability of input.ruleBundles) {
    if (availability.kind === "active" || availability.kind === "rolled_back") continue;
    blocked = true;
    reasons.push({
      code: "rule_bundle_unavailable",
      detalhePt: `Bundle de regra em estado "${availability.kind}" — avaliações resolvem para não avaliado (ADR-0008 §8.3).`,
    });
  }

  for (const dependency of input.dependencies) {
    if (dependency.available) continue;
    if (dependency.required) {
      blocked = true;
      reasons.push({
        code: "required_dependency_unavailable",
        detalhePt: `Dependência obrigatória indisponível: ${dependency.id}.`,
      });
    } else {
      degraded = true;
      reasons.push({
        code: "degradation_active",
        detalhePt: `Dependência opcional indisponível: ${dependency.id}.`,
      });
    }
  }

  if (!input.identityConfigured) {
    blocked = true;
    reasons.push({
      code: "identity_not_configured",
      detalhePt:
        "Identidade/chaves obrigatórias não configuradas — fail-closed (§15.2): nenhuma capacidade clínica é declarada pronta.",
    });
  }

  for (const projection of input.projections) {
    if (projection.limitMs === null) {
      degraded = true;
      reasons.push({
        code: "projection_freshness_threshold_unvalidated",
        detalhePt: `Limite de frescor da projeção "${projection.projection}" é VALIDATION REQUIRED (Gate G1) — sem alvo validado não há como afirmar capacidade segura.`,
      });
      continue;
    }
    if (projection.lagMs > projection.limitMs) {
      degraded = true;
      reasons.push({
        code: "projection_stale",
        detalhePt: `Projeção "${projection.projection}" acima do limite declarado.`,
      });
    }
  }

  for (const degradation of input.degradations) {
    if (degradation.surfacedOn.length === 0) {
      blocked = true;
      reasons.push({
        code: "degradation_unsurfaced",
        detalhePt: `Degradação "${degradation.notice.modeId}" ativa e NÃO exibida em nenhum canal — condição proibida (§20).`,
      });
      continue;
    }
    degraded = true;
    reasons.push({
      code: "degradation_active",
      detalhePt: `Degradação ativa e exibida: ${degradation.notice.modeId}.`,
    });
  }

  const verdict: ReadinessVerdictLabel = blocked ? "not_ready" : degraded ? "degraded" : "ready";
  return { verdict, reasons };
}

/** Calcula o veredito e o publica como métrica + log estruturado. */
export function reportReadiness(telemetry: Telemetry, input: ReadinessInput): ReadinessVerdict {
  const result = evaluateReadiness(input);
  const span = telemetry.tracer.startSpan("ops.readiness_check");
  span.setAttribute("verdict", label(result.verdict));
  if (result.verdict === "not_ready") {
    span.setStatus("error", "dependency_unavailable");
  } else {
    span.setStatus("ok");
  }
  span.end();
  telemetry.meter.add("intensicare.ops.readiness.verdict.total", count(1), {
    verdict: label(result.verdict),
  });
  telemetry.logger.emit(result.verdict === "ready" ? "info" : "warn", "readiness.evaluated", {
    verdict: label(result.verdict),
  });
  return result;
}
