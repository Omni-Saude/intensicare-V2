/**
 * Máquina de estados de alerta/item de trabalho (ADR-0009, opções Q1-A +
 * Q2-A aceitas em GDEC-0008, minuta W1-W12 aceita integralmente). `Alert` é
 * o fato clínico imutável (glossário §5); `WorkItem` é a ÚNICA entidade com
 * ciclo de vida operado por humanos. Nenhuma alegação de efetividade
 * clínica é feita por este módulo — a máquina calcula, roteia, registra e
 * explica; ela nunca reconhece, resolve, suprime ou sobrepõe por conta
 * própria (W12; regra não-negociável §3-15 do prompt).
 */
import type { EncounterId } from "./identity.js";
import type { TenantId } from "./tenancy.js";
import type { TemporalValue } from "./time.js";

export type AlertId = string;

/**
 * Fato clínico durável e explicável (glossário §5). Imutável — o que muda
 * com a ação humana é o `WorkItem` associado, nunca o `Alert` em si
 * (imutabilidade é imposta pelo repositório, não por este tipo).
 */
export interface Alert {
  readonly id: AlertId;
  readonly tenantId: TenantId;
  readonly encounterId: EncounterId;
  readonly raisedAt: TemporalValue;
  /**
   * PREMISSA (reversível, GDEC-0015/0017): campo mínimo desta fatia para o
   * tempo "avaliado" pedido pela tarefa. ADR-0005 M3 atribui o tempo
   * avaliado ao `EvaluationRecord` do ADR-0008 — fora do escopo desta
   * fatia, pois nenhuma regra clínica está implementada em
   * @intensicare/kernel-clinico ainda. Este campo registra apenas quando o
   * `Alert` foi levantado a partir de uma avaliação; não implementa a
   * semântica de completude/atualidade do ADR-0008.
   */
  readonly evaluatedAt: TemporalValue;
  /** Rótulo de severidade — placeholder didático desta fatia; nenhuma alegação clínica. */
  readonly severity: string;
  readonly reason: string;
  /**
   * Escore que originou o alerta (integração SPR-G7-2) — preservado no
   * próprio fato para que a explicação do alerta nunca dependa de uma
   * avaliação posterior (o `Alert` é imutável e explicável por si).
   */
  readonly score?: number;
}

export type WorkItemId = string;

/**
 * Os oito estados nucleares decididos em ADR-0009 W1 (Q1-A). `"nao_atribuido"`
 * corresponde ao "Levantado"/"unassigned" do prompt §11 (ADR-0009 DIV-3).
 */
export const WORK_ITEM_STATES = [
  "nao_atribuido",
  "atribuido",
  "reconhecido",
  "escalado",
  "sobreposto",
  "resolvido",
  "suprimido",
  "reaberto",
] as const;

export type WorkItemState = (typeof WORK_ITEM_STATES)[number];

/**
 * Grafo de transições legais (ADR-0009 W1/W7/W8/W9/W10). `"suprimido" →
 * "nao_atribuido"` modela a expiração de supressão para estado ATIVO —
 * nunca para silêncio (W7) — mesmo sem um comando desta fatia que a
 * dispare automaticamente (timers de escalada/expiração ficam fora de
 * escopo: ADR-0009 W5 marca os valores como VALIDATION REQUIRED).
 */
export const WORK_ITEM_TRANSITIONS: Readonly<Record<WorkItemState, readonly WorkItemState[]>> = {
  nao_atribuido: ["atribuido", "suprimido"],
  atribuido: ["atribuido", "reconhecido", "suprimido"],
  reconhecido: ["escalado", "sobreposto", "resolvido", "suprimido"],
  escalado: ["reconhecido", "sobreposto", "resolvido", "suprimido"],
  sobreposto: ["resolvido", "suprimido"],
  resolvido: ["reaberto"],
  suprimido: ["nao_atribuido"],
  reaberto: ["atribuido"],
};

export function isLegalWorkItemTransition(from: WorkItemState, to: WorkItemState): boolean {
  return WORK_ITEM_TRANSITIONS[from].includes(to);
}

/**
 * Supressão é SEMPRE ato explícito com razão CODIFICADA (nunca texto
 * livre), escopo declarado e prazo/condição de expiração (ADR-0009 W7).
 * Um `WorkItem` suprimido continua existindo e visível — supressão nunca
 * representa nem esconde um no-fire: um no-fire nunca chega a existir como
 * `WorkItem` (nenhuma função deste módulo cria um `WorkItem` sem `alertId`
 * de origem).
 */
export interface SuppressionInfo {
  readonly reasonCode: string;
  readonly scope: string;
  readonly expiresAt: TemporalValue;
}

/**
 * Item de trabalho — a ÚNICA entidade com ciclo de vida operado por
 * humanos (ADR-0009 Q1-A). `version` é o token de concorrência otimista
 * (Q2-A/W3): todo comando de transição deve carregar a versão vista pelo
 * ator; versão divergente falha explicitamente com o estado corrente —
 * NUNCA last-write-wins silencioso (HAZ-0023).
 */
export interface WorkItem {
  readonly id: WorkItemId;
  readonly tenantId: TenantId;
  readonly alertId: AlertId;
  readonly state: WorkItemState;
  readonly version: number;
  readonly assigneeId?: string;
  readonly suppression?: SuppressionInfo;
}

export type WorkItemCommandKind =
  | "assign"
  | "acknowledge"
  | "escalate"
  | "override"
  | "resolve"
  | "suppress"
  | "reopen";

export interface WorkItemCommand {
  readonly kind: WorkItemCommandKind;
  /** Chave de idempotência do comando (W2) — nunca derivada de dado do paciente. */
  readonly idempotencyKey: string;
  /** Versão do item que o ator viu (W3/Q2-A) — obrigatória para toda transição. */
  readonly expectedVersion: number;
  /** Ator humano individual (W4) — conta compartilhada não transiciona item. */
  readonly actorId: string;
  /** Obrigatório quando `kind === "suppress"` (W7). */
  readonly suppression?: SuppressionInfo;
}

const COMMAND_TARGET_STATE: Readonly<Record<WorkItemCommandKind, WorkItemState>> = {
  assign: "atribuido",
  acknowledge: "reconhecido",
  escalate: "escalado",
  override: "sobreposto",
  resolve: "resolvido",
  suppress: "suprimido",
  reopen: "reaberto",
};

export type WorkItemTransitionResult =
  | { readonly outcome: "applied"; readonly next: WorkItem }
  | { readonly outcome: "version_conflict"; readonly current: WorkItem }
  | {
      readonly outcome: "illegal_transition";
      readonly from: WorkItemState;
      readonly to: WorkItemState;
    };

/**
 * Aplica um comando de transição de forma pura (sem I/O). A checagem de
 * concorrência REAL (compare-and-swap na coluna `version`) é
 * responsabilidade do repositório (@intensicare/persistencia), que deve
 * chamar esta função para decidir o próximo estado ANTES de gravar, e
 * então gravar sob a MESMA condição `WHERE version = expectedVersion` —
 * as duas checagens (aqui e no `UPDATE`) devem concordar; divergência
 * entre elas é defeito, não variação aceitável.
 */
export function applyWorkItemCommand(
  current: WorkItem,
  command: WorkItemCommand,
): WorkItemTransitionResult {
  if (command.expectedVersion !== current.version) {
    return { outcome: "version_conflict", current };
  }

  const targetState = COMMAND_TARGET_STATE[command.kind];
  if (!isLegalWorkItemTransition(current.state, targetState)) {
    return { outcome: "illegal_transition", from: current.state, to: targetState };
  }

  const next: WorkItem = {
    ...current,
    state: targetState,
    version: current.version + 1,
    ...(command.kind === "assign" ? { assigneeId: command.actorId } : {}),
    ...(command.kind === "suppress" && command.suppression
      ? { suppression: command.suppression }
      : {}),
  };

  return { outcome: "applied", next };
}
