/**
 * packages/observabilidade/src/degradation.ts — modo degradado como
 * capacidade de código, com estado VISÍVEL (nunca silencioso).
 *
 * SOURCE (ADR-0020 O5): "Degradação de dependência, regra, frescor, evento,
 * projeção e entrega é exposta como estado nomeado (DOM-0007) ... Cada modo
 * degradado tem: condição de entrada, comportamento seguro, fallback manual e
 * condição de saída com reconciliação pós-recuperação". SOURCE (§20): nunca
 * "hide 'unknown,' 'not evaluated,' degradation, partial failure, or
 * alert-delivery uncertainty". SOURCE (DOM-0007): a degradação é um estado
 * explícito e visível em cada nível.
 *
 * A ideia central: "visível" é verificável
 * ----------------------------------------
 * Entrar em modo degradado devolve um `DegradedNotice` e marca a degradação
 * como NÃO EXIBIDA. Ela só passa a contar como exibida quando alguém chama
 * `markSurfaced(noticeId, canal)` — isto é, quando o contrato de API, a UI ou
 * o console operacional efetivamente a transportou. Uma degradação ativa e
 * nunca exibida é contável (`intensicare.ops.degradation.unsurfaced`) e
 * derruba a prontidão (readiness.ts). "Degradação silenciosa" deixa de ser um
 * risco de revisão e vira uma condição detectável por teste.
 *
 * PREMISSA (reversível, GDEC-0015/0017): o catálogo `DEGRADATION_MODES` abaixo
 * enumera os modos que a fatia V2 já é capaz de exercer. Ele não é o conjunto
 * final: modos de conector, de writeback e de canal de tempo real dependem de
 * ADRs ainda não materializados (0013, 0019) e de ambiente da AMH.
 *
 * Nenhuma alegação de efetividade clínica é feita por este módulo.
 */
import type { LogEvent } from "./metric-catalog.js";
import {
  count,
  DEGRADATION_MODE_LABELS,
  type DegradationDomain,
  type DegradationModeLabel,
  type FailureCategory,
  label,
  type SurfaceChannel,
} from "./redaction.js";
import type { Telemetry } from "./telemetry.js";

export interface DegradationModeSpec {
  readonly domain: DegradationDomain;
  /** Condição de ENTRADA (ADR-0020 O5). */
  readonly entryCondition: string;
  /** Comportamento seguro enquanto o modo está ativo. */
  readonly safeBehavior: string;
  /** Fallback manual disponível ao clínico/operador. */
  readonly manualFallback: string;
  /** Condição de SAÍDA, incluindo a reconciliação pós-recuperação exigida. */
  readonly exitCondition: string;
  /** Texto pt-BR destinado à superfície visível (contrato/UI). */
  readonly uiMessagePt: string;
  /** Categoria de falha correlata, para o sinal operacional. */
  readonly failureCategory: FailureCategory;
}

export const DEGRADATION_MODES = {
  regra_clinica_desligada: {
    domain: "rule",
    entryCondition:
      "Kill switch acionado sobre um bundle de regra clínica (ADR-0007), ou falha de carga do bundle.",
    safeBehavior:
      "Toda avaliação da regra afetada resolve para 'não avaliado' com razão de regra indisponível (ADR-0008 §8.3) — jamais no-fire silencioso, jamais valor com escore anterior.",
    manualFallback:
      "Avaliação clínica à beira do leito pelo protocolo institucional vigente; o sistema não substitui o julgamento clínico em nenhum modo.",
    exitCondition:
      "Bundle reativado ou rollback concluído para versão previamente aprovada, com reavaliação das ocorrências do período (replay) e conferência de que nenhuma avaliação do intervalo permaneceu com status congelado.",
    uiMessagePt:
      "Regra clínica indisponível: as avaliações deste período NÃO foram calculadas. Isto não significa ausência de risco.",
    failureCategory: "rule_load_failure",
  },
  projecao_atrasada: {
    domain: "projection",
    entryCondition: "Lag da projeção de leitura acima do limite operacional declarado.",
    safeBehavior:
      "A projeção informa explicitamente o instante do último fato incorporado; nenhuma tela apresenta dado atrasado como corrente.",
    manualFallback: "Consulta direta ao registro durável pelo caminho de leitura autoritativo.",
    exitCondition:
      "Lag de volta ao limite E reconciliação por polling concluída (ADR-0011 P8), sem divergência pendente.",
    uiMessagePt:
      "Painel possivelmente desatualizado: verifique o horário do último dado incorporado.",
    failureCategory: "projection_rebuild_failure",
  },
  outbox_acumulando: {
    domain: "event",
    entryCondition:
      "Profundidade do outbox crescendo sem publicação — publicador parado ou broker indisponível.",
    safeBehavior:
      "O fato clínico e o item de trabalho continuam duráveis na mesma transação (ADR-0010); a ENTREGA é que está atrasada e é declarada como atrasada.",
    manualFallback:
      "Comunicação clínica pelo canal institucional de contingência, sem depender da entrega automática.",
    exitCondition:
      "Publicação retomada, backlog drenado e replay conferido sem lacuna de sequência.",
    uiMessagePt: "Entrega de eventos atrasada: notificações podem chegar com atraso.",
    failureCategory: "outbox_publish_failure",
  },
  entrega_tempo_real_indisponivel: {
    domain: "delivery",
    entryCondition: "Canal autorizado de tempo real indisponível ou desconectado.",
    safeBehavior:
      "A interface passa a estado 'reconectando'/'reproduzindo' explícito e retoma por cursor; nada é apresentado como ao vivo enquanto não estiver.",
    manualFallback: "Recarregar a consulta autoritativa; escalonamento por canal institucional.",
    exitCondition:
      "Canal restabelecido, cursor retomado e reconciliação por polling sem divergência.",
    uiMessagePt:
      "Atualização ao vivo indisponível: os dados podem não refletir os últimos minutos.",
    failureCategory: "delivery_failure",
  },
  insumo_sem_frescor: {
    domain: "freshness",
    entryCondition:
      "Insumo clínico fora da janela de frescor aplicável (ADR-0008 N5 — janelas ainda VALIDATION REQUIRED).",
    safeBehavior:
      "O estado da avaliação passa a 'desatualizado' ou 'não avaliado' com razão explícita; nunca a valor normal.",
    manualFallback: "Nova aferição à beira do leito.",
    exitCondition: "Insumo novo dentro da janela, com reavaliação registrada.",
    uiMessagePt: "Dado fora da janela de validade clínica: reavaliar antes de decidir.",
    failureCategory: "rule_evaluation_failure",
  },
  dependencia_indisponivel: {
    domain: "dependency",
    entryCondition: "Dependência obrigatória (banco, identidade, chave) inacessível.",
    safeBehavior:
      "Fail-closed: a operação afetada é recusada com estado explícito; nenhuma resposta parcial é apresentada como completa.",
    manualFallback: "Procedimento de downtime institucional.",
    exitCondition: "Dependência restabelecida e prontidão reavaliada como capacidade segura.",
    uiMessagePt: "Serviço indisponível no momento: use o procedimento de contingência da unidade.",
    failureCategory: "dependency_unavailable",
  },
  telemetria_indisponivel: {
    domain: "telemetry",
    entryCondition: "Coletor/emissor de telemetria indisponível ou descartando amostras.",
    safeBehavior:
      "O laço clínico segue funcionando (ADR-0020 §7); a PERDA DE OBSERVABILIDADE é ela própria declarada como modo degradado, não ignorada.",
    manualFallback: "Acompanhamento operacional manual até o restabelecimento.",
    exitCondition: "Emissão restabelecida; lacuna de série declarada no registro operacional.",
    uiMessagePt: "Monitoramento operacional degradado: a operação segue, a observabilidade não.",
    failureCategory: "telemetry_dropped",
  },
} as const satisfies Record<DegradationModeLabel, DegradationModeSpec>;

/**
 * Identidade de modo degradado. É EXATAMENTE `DegradationModeLabel`: o
 * `satisfies Record<DegradationModeLabel, ...>` acima obriga o catálogo a
 * cobrir todo o vocabulário de telemetria, e o vocabulário a não ter membro
 * sem procedimento definido. Um modo sem condição de saída não compila.
 */
export type DegradationModeId = DegradationModeLabel;

export const DEGRADATION_MODE_IDS: readonly DegradationModeId[] = DEGRADATION_MODE_LABELS;

/**
 * Aviso de degradação. É o objeto que ATRAVESSA a fronteira: contrato de API
 * e UI devem transportá-lo integralmente (ADR-0020 O5; §11 exige o estado
 * visível). `mensagemUi` é pt-BR porque é texto de interface.
 */
export interface DegradedNotice {
  readonly noticeId: string;
  readonly modeId: DegradationModeId;
  readonly domain: DegradationDomain;
  readonly sinceMs: number;
  readonly mensagemUi: string;
  readonly comportamentoSeguro: string;
  readonly fallbackManual: string;
  readonly condicaoSaida: string;
}

export interface ActiveDegradation {
  readonly notice: DegradedNotice;
  /** Canais em que a degradação já foi tornada visível. Vazio = silenciosa. */
  readonly surfacedOn: readonly SurfaceChannel[];
}

export interface DegradationRegistry {
  /** Entra em um modo degradado (idempotente por modo). */
  readonly enter: (modeId: DegradationModeId, atMs?: number) => DegradedNotice;
  /** Sai do modo degradado. Retorna `false` se ele não estava ativo. */
  readonly exit: (modeId: DegradationModeId) => boolean;
  /** Declara que a degradação foi efetivamente exibida em um canal. */
  readonly markSurfaced: (noticeId: string, channel: SurfaceChannel) => boolean;
  readonly active: () => readonly ActiveDegradation[];
  /** Degradações ativas que nenhum canal exibiu — condição proibida. */
  readonly unsurfaced: () => readonly ActiveDegradation[];
  /** Texto pt-BR consolidado para exibição; vazio quando nada está degradado. */
  readonly describePt: () => readonly string[];
}

interface RegistryEntry {
  notice: DegradedNotice;
  surfacedOn: SurfaceChannel[];
}

export interface DegradationRegistryOptions {
  readonly telemetry: Telemetry;
  /**
   * Gerador de identificador de aviso. Injetável para tornar o teste
   * determinístico; o default é sequencial e NÃO deriva de dado de paciente.
   */
  readonly noticeIdFactory?: (modeId: DegradationModeId, sequence: number) => string;
}

export function createDegradationRegistry(
  options: DegradationRegistryOptions,
): DegradationRegistry {
  const { telemetry } = options;
  const makeId =
    options.noticeIdFactory ?? ((modeId, sequence) => `DEG-${modeId}-${String(sequence)}`);
  const entries = new Map<DegradationModeId, RegistryEntry>();
  let sequence = 0;

  function emitLog(event: LogEvent, modeId: DegradationModeId): void {
    telemetry.logger.emit(event === "degradation.exited" ? "info" : "warn", event, {
      domain: label(DEGRADATION_MODES[modeId].domain),
      mode: label(modeId),
    });
  }

  function adjustCounters(modeId: DegradationModeId, delta: number, unsurfacedDelta: number): void {
    const spec = DEGRADATION_MODES[modeId];
    const attrs = { domain: label(spec.domain), mode: label(modeId) };
    if (delta !== 0) {
      telemetry.meter.adjust("intensicare.ops.degradation.active", count(delta), attrs);
    }
    if (unsurfacedDelta !== 0) {
      telemetry.meter.adjust(
        "intensicare.ops.degradation.unsurfaced",
        count(unsurfacedDelta),
        attrs,
      );
    }
  }

  return {
    enter(modeId, atMs) {
      const existing = entries.get(modeId);
      if (existing !== undefined) return existing.notice;

      const spec = DEGRADATION_MODES[modeId];
      sequence += 1;
      const notice: DegradedNotice = {
        noticeId: makeId(modeId, sequence),
        modeId,
        domain: spec.domain,
        sinceMs: atMs ?? telemetry.clock(),
        mensagemUi: spec.uiMessagePt,
        comportamentoSeguro: spec.safeBehavior,
        fallbackManual: spec.manualFallback,
        condicaoSaida: spec.exitCondition,
      };
      entries.set(modeId, { notice, surfacedOn: [] });
      adjustCounters(modeId, 1, 1);
      telemetry.meter.add("intensicare.ops.failure.total", count(1), {
        category: label(spec.failureCategory),
      });
      emitLog("degradation.entered", modeId);
      return notice;
    },

    exit(modeId) {
      const existing = entries.get(modeId);
      if (existing === undefined) return false;
      entries.delete(modeId);
      adjustCounters(modeId, -1, existing.surfacedOn.length === 0 ? -1 : 0);
      emitLog("degradation.exited", modeId);
      return true;
    },

    markSurfaced(noticeId, channel) {
      for (const [modeId, entry] of entries) {
        if (entry.notice.noticeId !== noticeId) continue;
        if (entry.surfacedOn.includes(channel)) return true;
        const wasSilent = entry.surfacedOn.length === 0;
        entry.surfacedOn.push(channel);
        if (wasSilent) adjustCounters(modeId, 0, -1);
        return true;
      }
      return false;
    },

    active() {
      return [...entries.values()].map((entry) => ({
        notice: entry.notice,
        surfacedOn: [...entry.surfacedOn],
      }));
    },

    unsurfaced() {
      return [...entries.values()]
        .filter((entry) => entry.surfacedOn.length === 0)
        .map((entry) => ({ notice: entry.notice, surfacedOn: [] }));
    },

    describePt() {
      return [...entries.values()].map(
        (entry) =>
          `${entry.notice.mensagemUi} (modo: ${entry.notice.modeId}; saída: ${entry.notice.condicaoSaida})`,
      );
    },
  };
}
