/**
 * Prontidão de ativação e fronteira config-vs-conteúdo.
 *
 * Duas responsabilidades, ambas do CARREGADOR (ADR-0007 §4.7: a sobrescrita
 * de configuração é rejeitada "pelo MESMO carregador que verifica a
 * assinatura do bundle", nunca por uma checagem de papel `admin` separada e
 * contornável — defeito legado E8/SF-4):
 *
 * 1. `assessActivationReadiness` — o que ainda impede este bundle de ser
 *    ativado em modo ACIONÁVEL. Cada bloqueio é derivado de um campo real
 *    do manifesto ou de uma condição aberta da própria ADR-0007 §5.1.
 * 2. `evaluateSiteOverride` — o envelope "aperta-nunca-afrouxa" por campo
 *    (decisão A7-2).
 *
 * Estado factual que este módulo preserva e não pode ser lido como
 * revogado: 0 vias acionáveis. Nenhum caminho aqui produz um bundle
 * acionável; a função existe para RECUSAR, com a lista de razões.
 */

import type { ConfigurationEnvelope, RuleBundleManifest } from "./types.js";

/** Um impedimento concreto à ativação acionável. */
export interface ActivationBlocker {
  /** Código estável (testável, observável). */
  readonly code: string;
  /** Condição da ADR-0007 §5.1 correspondente, quando existe. */
  readonly adrCondition: string | null;
  readonly statement: string;
}

/**
 * Lista os bloqueios de ativação ACIONÁVEL de um manifesto.
 *
 * Devolver `[]` NÃO significa "pode ativar": significa que este artefato
 * não carrega mais nenhum bloqueio VERIFICÁVEL POR CÓDIGO. Autorização
 * humana por ambiente (eixo 4, Opção A) continua sendo um ato humano que
 * nenhum agente pode praticar.
 */
export function assessActivationReadiness(
  manifest: RuleBundleManifest,
): readonly ActivationBlocker[] {
  const blockers: ActivationBlocker[] = [];

  if (!manifest.intendedUse.evidencedPopulatedSource) {
    blockers.push({
      code: "sem_fonte_populada_evidenciada",
      adrCondition: null,
      statement:
        "HAZ-0043: nenhuma fonte populada evidenciada para os insumos desta regra — " +
        "admitir a via em portfólio antes disso É o modo de falha",
    });
  }

  if (!manifest.intendedUse.admittedByGateG2) {
    blockers.push({
      code: "portfolio_g2_nao_aprovado",
      adrCondition: "C4",
      statement: "o Gate G2 não aprovou nenhum portfólio de vias — 47/47 candidatas inelegíveis",
    });
  }

  if (manifest.terminology.snapshotId === null) {
    blockers.push({
      code: "snapshot_de_terminologia_inexistente",
      adrCondition: "C6",
      statement:
        "não há mecanismo de snapshot de terminologia referenciável (ADR-0013 pendente); " +
        "o campo é declarado como ausente em vez de preenchido com um ID inventado",
    });
  }

  const unratifiedBindings = manifest.terminology.bindings.filter(
    (binding) => binding.bindingStatus !== "ratified",
  );
  if (unratifiedBindings.length > 0) {
    blockers.push({
      code: "vinculos_de_terminologia_candidatos",
      adrCondition: "C6",
      statement:
        `${unratifiedBindings.length} vínculo(s) de terminologia permanecem candidatos, ` +
        "não ratificados pelo arquiteto de terminologia",
    });
  }

  if (!manifest.testPack.authorshipIndependenceConfirmed) {
    blockers.push({
      code: "test_pack_sem_autoria_independente",
      adrCondition: "C1",
      statement:
        "autor dos vetores = autor da regra (clinical-reference-vector-standard §8): " +
        "o conjunto serve a autoria red/green e NUNCA a evidência de release",
    });
  }

  if (manifest.testPack.lifecycleStatus !== "RATIFIED") {
    blockers.push({
      code: "test_pack_draft",
      adrCondition: "C1",
      statement: "o test pack está DRAFT para fins de execução",
    });
  }

  if (manifest.validation.retrospective !== "complete") {
    blockers.push({
      code: "validacao_retrospectiva_incompleta",
      adrCondition: null,
      statement: `validação retrospectiva: ${manifest.validation.retrospective}`,
    });
  }

  if (manifest.validation.prospective !== "complete") {
    blockers.push({
      code: "validacao_prospectiva_incompleta",
      adrCondition: null,
      statement: `validação prospectiva: ${manifest.validation.prospective}`,
    });
  }

  const undeclaredFloors = manifest.configurationEnvelope.fields.filter(
    (field) => field.direction !== "not_configurable" && field.tightestAllowedValue === null,
  );
  if (undeclaredFloors.length > 0) {
    blockers.push({
      code: "envelope_de_configuracao_sem_piso",
      adrCondition: "C3",
      statement:
        `${undeclaredFloors.length} campo(s) configurável(is) sem piso declarado pelo titular ` +
        "clínico — enquanto isso durar, nenhuma sobrescrita local é aceita (fail-closed)",
    });
  }

  if (manifest.evidence.openSurveillanceItems.length > 0) {
    blockers.push({
      code: "itens_de_vigilancia_de_diretriz_abertos",
      adrCondition: null,
      statement:
        `${manifest.evidence.openSurveillanceItems.length} item(ns) de vigilância de diretriz ` +
        "em aberto — a spec exige verificá-los antes de qualquer decisão de ativação",
    });
  }

  return blockers;
}

/** Decisão do carregador sobre uma sobrescrita local de configuração. */
export type SiteOverrideDecision =
  | {
      readonly accepted: true;
      readonly fieldId: string;
      readonly value: number;
      readonly note: string;
    }
  | {
      readonly accepted: false;
      readonly fieldId: string;
      readonly code: string;
      readonly reason: string;
    };

/**
 * Aplica o envelope "aperta-nunca-afrouxa" a uma sobrescrita local.
 *
 * Quatro recusas possíveis, todas fechadas:
 * - campo desconhecido (não publicado pelo bundle);
 * - campo `not_configurable` (tabela de banda, gatilho publicado);
 * - direção de afrouxamento (o defeito SF-4: `watch_threshold` elevado
 *   apagando silenciosamente a mitigação de fato);
 * - direção de aperto MAS sem piso declarado — recusa igualmente, porque
 *   inventar um piso seria fabricar conteúdo clínico (C3 aberta).
 */
export function evaluateSiteOverride(
  envelope: ConfigurationEnvelope,
  fieldId: string,
  overrideValue: number,
): SiteOverrideDecision {
  const field = envelope.fields.find((candidate) => candidate.fieldId === fieldId);

  if (field === undefined) {
    return {
      accepted: false,
      fieldId,
      code: "campo_nao_publicado",
      reason:
        "o bundle não publica este campo como configurável — só o que o bundle assinado " +
        "declara pode ser sobrescrito",
    };
  }

  if (field.direction === "not_configurable" || field.publishedValue === null) {
    return {
      accepted: false,
      fieldId,
      code: "campo_nao_configuravel",
      reason: `"${field.label}" é conteúdo clínico imutável: muda por nova versão de bundle, nunca por configuração`,
    };
  }

  if (!Number.isFinite(overrideValue)) {
    return {
      accepted: false,
      fieldId,
      code: "valor_nao_finito",
      reason: "valor de sobrescrita não é um número finito",
    };
  }

  const tightens =
    field.direction === "lower_is_tighter"
      ? overrideValue < field.publishedValue
      : overrideValue > field.publishedValue;

  if (overrideValue === field.publishedValue) {
    return {
      accepted: true,
      fieldId,
      value: overrideValue,
      note: "sobrescrita idêntica ao valor publicado — sem efeito, registrada mesmo assim",
    };
  }

  if (!tightens) {
    return {
      accepted: false,
      fieldId,
      code: "afrouxamento_proibido",
      reason:
        `"${field.label}": publicado ${field.publishedValue}, sobrescrita ${overrideValue} ` +
        `afrouxa na direção declarada (${field.direction}) — proibido (SF-4, ADR-0007 eixo 7)`,
    };
  }

  if (field.tightestAllowedValue === null) {
    return {
      accepted: false,
      fieldId,
      code: "piso_nao_declarado",
      reason:
        `"${field.label}": a sobrescrita aperta, mas o bundle não declara limite de aperto ` +
        "(C3 aberta) — o carregador recusa em vez de inventar um piso clínico",
    };
  }

  const withinLimit =
    field.direction === "lower_is_tighter"
      ? overrideValue >= field.tightestAllowedValue
      : overrideValue <= field.tightestAllowedValue;

  if (!withinLimit) {
    return {
      accepted: false,
      fieldId,
      code: "aperto_alem_do_limite",
      reason:
        `"${field.label}": sobrescrita ${overrideValue} ultrapassa o limite de aperto ` +
        `declarado (${field.tightestAllowedValue})`,
    };
  }

  return {
    accepted: true,
    fieldId,
    value: overrideValue,
    note:
      `sobrescrita de site aceita: aperta de ${field.publishedValue} para ${overrideValue}, ` +
      "dentro do envelope assinado — deve aparecer na UI como 'sobrescrita de site'",
  };
}
