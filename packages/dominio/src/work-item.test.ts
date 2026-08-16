import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { absentInstant } from "./time.js";
import {
  WORK_ITEM_STATES,
  applyWorkItemCommand,
  isLegalWorkItemTransition,
  type WorkItem,
  type WorkItemCommand,
} from "./work-item.js";

function baseWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: "SYNTH-WI-01",
    tenantId: "SYNTH-TENANT-A",
    alertId: "SYNTH-ALERT-01",
    state: "nao_atribuido",
    version: 0,
    ...overrides,
  };
}

function command(overrides: Partial<WorkItemCommand> & Pick<WorkItemCommand, "kind" | "expectedVersion">): WorkItemCommand {
  return {
    idempotencyKey: "SYNTH-CMD-01",
    actorId: "SYNTH-CLINICIAN-01",
    ...overrides,
  };
}

describe("work-item — máquina de estados (ADR-0009 Q1-A/Q2-A, minuta W1-W12)", () => {
  it("caminho nuclear: não-atribuído → atribuído → reconhecido → resolvido → reaberto → atribuído", () => {
    let item = baseWorkItem();

    const assign = applyWorkItemCommand(item, command({ kind: "assign", expectedVersion: 0 }));
    expect(assign.outcome).toBe("applied");
    if (assign.outcome !== "applied") throw new Error("esperava applied");
    item = assign.next;
    expect(item.state).toBe("atribuido");
    expect(item.version).toBe(1);
    expect(item.assigneeId).toBe("SYNTH-CLINICIAN-01");

    const ack = applyWorkItemCommand(item, command({ kind: "acknowledge", expectedVersion: 1 }));
    expect(ack.outcome).toBe("applied");
    if (ack.outcome !== "applied") throw new Error("esperava applied");
    item = ack.next;
    expect(item.state).toBe("reconhecido");
    expect(item.version).toBe(2);

    const resolve = applyWorkItemCommand(item, command({ kind: "resolve", expectedVersion: 2 }));
    expect(resolve.outcome).toBe("applied");
    if (resolve.outcome !== "applied") throw new Error("esperava applied");
    item = resolve.next;
    expect(item.state).toBe("resolvido");
    expect(item.version).toBe(3);

    const reopen = applyWorkItemCommand(item, command({ kind: "reopen", expectedVersion: 3 }));
    expect(reopen.outcome).toBe("applied");
    if (reopen.outcome !== "applied") throw new Error("esperava applied");
    item = reopen.next;
    expect(item.state).toBe("reaberto");
    expect(item.version).toBe(4);

    const reassign = applyWorkItemCommand(item, command({ kind: "assign", expectedVersion: 4 }));
    expect(reassign.outcome).toBe("applied");
    if (reassign.outcome !== "applied") throw new Error("esperava applied");
    expect(reassign.next.state).toBe("atribuido");
    expect(reassign.next.version).toBe(5);
  });

  it("conflito de concorrência (HAZ-0023): versão divergente falha explícito com o estado corrente — nunca last-write-wins silencioso", () => {
    const item = baseWorkItem({ state: "atribuido", version: 3 });
    const result = applyWorkItemCommand(item, command({ kind: "acknowledge", expectedVersion: 1 }));
    expect(result.outcome).toBe("version_conflict");
    if (result.outcome !== "version_conflict") throw new Error("esperava version_conflict");
    expect(result.current).toBe(item);
    expect(result.current.version).toBe(3);
  });

  it("transição ilegal (ex.: não-atribuído → resolvido direto) é rejeitada sem mutar o item", () => {
    const item = baseWorkItem({ state: "nao_atribuido", version: 0 });
    const result = applyWorkItemCommand(item, command({ kind: "resolve", expectedVersion: 0 }));
    expect(result.outcome).toBe("illegal_transition");
    if (result.outcome !== "illegal_transition") throw new Error("esperava illegal_transition");
    expect(result.from).toBe("nao_atribuido");
    expect(result.to).toBe("resolvido");
  });

  it("supressão (W7) carrega razão codificada, escopo e prazo — nunca texto livre implícito", () => {
    const item = baseWorkItem({ state: "atribuido", version: 1 });
    const result = applyWorkItemCommand(
      item,
      command({
        kind: "suppress",
        expectedVersion: 1,
        suppression: {
          reasonCode: "SYNTH-DUPLICATE-CONDITION",
          scope: "este-item",
          expiresAt: absentInstant("prazo_nao_definido_nesta_fatia"),
        },
      }),
    );
    expect(result.outcome).toBe("applied");
    if (result.outcome !== "applied") throw new Error("esperava applied");
    expect(result.next.state).toBe("suprimido");
    expect(result.next.suppression?.reasonCode).toBe("SYNTH-DUPLICATE-CONDITION");
    expect(result.next.suppression?.scope).toBe("este-item");
  });

  it("item suprimido permanece existente e pode voltar a estado ativo — supressão nunca é terminal silencioso", () => {
    expect(isLegalWorkItemTransition("suprimido", "nao_atribuido")).toBe(true);
  });

  it("nenhum estado fora dos oito nucleares do §11 é alcançável pelo grafo de transições", () => {
    for (const state of WORK_ITEM_STATES) {
      for (const command_ of ["assign", "acknowledge", "escalate", "override", "resolve", "suppress", "reopen"] as const) {
        const item = baseWorkItem({ state, version: 0 });
        const result = applyWorkItemCommand(item, command({ kind: command_, expectedVersion: 0 }));
        if (result.outcome === "applied") {
          expect(WORK_ITEM_STATES).toContain(result.next.state);
        }
      }
    }
  });

  it("propriedade: uma transição aplicada sempre incrementa a versão em exatamente 1 e nunca retrocede o estado para fora do grafo legal", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...WORK_ITEM_STATES),
        fc.nat({ max: 50 }),
        fc.constantFrom("assign", "acknowledge", "escalate", "override", "resolve", "suppress", "reopen"),
        (state, version, kind) => {
          const item = baseWorkItem({ state, version });
          const result = applyWorkItemCommand(
            item,
            command({
              kind,
              expectedVersion: version,
              ...(kind === "suppress"
                ? {
                    suppression: {
                      reasonCode: "SYNTH-PROPERTY-TEST",
                      scope: "este-item",
                      expiresAt: absentInstant("n/a"),
                    },
                  }
                : {}),
            }),
          );
          if (result.outcome === "applied") {
            expect(result.next.version).toBe(version + 1);
            expect(isLegalWorkItemTransition(state, result.next.state)).toBe(true);
          } else if (result.outcome === "illegal_transition") {
            expect(isLegalWorkItemTransition(state, result.to)).toBe(false);
          }
        },
      ),
    );
  });
});
