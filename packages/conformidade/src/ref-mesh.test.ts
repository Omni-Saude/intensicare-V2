/**
 * Testes da projeção da malha de refs — a parte do harness onde um erro
 * silencioso viraria "o paciente errado resolve para a ref errada".
 */
import { describe, expect, it } from "vitest";
import { meshFingerprint, projectMesh, type RefTransition, resolveLocal } from "./ref-mesh.js";

const SCOPE = { amhTenant: "SYNTH-TENANT-A", legalEntity: "SYNTH-LE-00000001" } as const;

function transition(
  overrides: Partial<RefTransition> & Pick<RefTransition, "eventId" | "from" | "occurredAtUtc">,
): RefTransition {
  return {
    eventType: "identity.alias.v1",
    to: null,
    emittedAtUtc: overrides.occurredAtUtc,
    correctionOf: null,
    amhTenant: SCOPE.amhTenant,
    legalEntity: SCOPE.legalEntity,
    ...overrides,
  };
}

const REF_A = "amh:psr:v1:SYNTH-aaaa0001";
const REF_B = "amh:psr:v1:SYNTH-aaaa0002";
const REF_C = "amh:psr:v1:SYNTH-aaaa0003";

describe("projeção da malha", () => {
  it("dobra por `occurred_at`, não pela ordem da lista", () => {
    const older = transition({
      eventId: "e1",
      from: REF_A,
      to: REF_B,
      occurredAtUtc: "2026-01-01T00:00:00Z",
    });
    const newer = transition({
      eventId: "e2",
      from: REF_B,
      to: REF_C,
      occurredAtUtc: "2026-02-01T00:00:00Z",
    });

    expect(meshFingerprint(projectMesh([older, newer]))).toBe(
      meshFingerprint(projectMesh([newer, older])),
    );
  });

  it("aplica idempotência de EFEITO: o mesmo `event_id` dobrado duas vezes não muda a malha", () => {
    const t = transition({
      eventId: "e1",
      from: REF_A,
      to: REF_B,
      occurredAtUtc: "2026-01-01T00:00:00Z",
    });
    expect(meshFingerprint(projectMesh([t, t]))).toBe(meshFingerprint(projectMesh([t])));
  });

  it("`correction_of` REVOGA a aresta apontada a partir do seu `occurred_at`", () => {
    const merge = transition({
      eventId: "merge-1",
      eventType: "identity.merge.v1",
      from: REF_A,
      to: REF_B,
      occurredAtUtc: "2026-01-01T00:00:00Z",
    });
    const unmerge = transition({
      eventId: "unmerge-1",
      eventType: "identity.unmerge.v1",
      from: REF_B,
      to: REF_A,
      occurredAtUtc: "2026-03-01T00:00:00Z",
      correctionOf: "merge-1",
    });

    const before = projectMesh([merge, unmerge], { asOfUtc: "2026-02-01T00:00:00Z" });
    expect(resolveLocal(before, REF_A)).toMatchObject({ kind: "resolvida", target: REF_B });

    const after = projectMesh([merge, unmerge]);
    expect(resolveLocal(after, REF_A)).toMatchObject({ kind: "resolvida", target: REF_A });
    // O fato revogado permanece VISÍVEL — carimbo, não apagamento.
    expect(after.revokedTransitions.map((t) => t.eventId)).toEqual(["merge-1"]);
    expect(after.revocationTransitions.map((t) => t.eventId)).toEqual(["unmerge-1"]);
  });

  it("`erasure` aposenta a ref sem deletá-la, e `restore` devolve o estado anterior", () => {
    const erasure = transition({
      eventId: "erasure-1",
      eventType: "identity.erasure.v1",
      from: REF_A,
      to: null,
      occurredAtUtc: "2026-01-01T00:00:00Z",
    });
    const restore = transition({
      eventId: "restore-1",
      eventType: "identity.restore.v1",
      from: REF_A,
      to: REF_A,
      occurredAtUtc: "2026-02-01T00:00:00Z",
      correctionOf: "erasure-1",
    });

    const retired = projectMesh([erasure], {});
    expect(resolveLocal(retired, REF_A)).toMatchObject({ kind: "retired" });
    expect(retired.refs.some((r) => r.ref === REF_A)).toBe(true);

    const restored = projectMesh([erasure, restore]);
    expect(resolveLocal(restored, REF_A)).toMatchObject({ kind: "resolvida", target: REF_A });
  });

  it("devolve condição EXPLÍCITA para ref desconhecida — nunca 'resolve para si mesma'", () => {
    const mesh = projectMesh([]);
    expect(resolveLocal(mesh, REF_A)).toMatchObject({ kind: "desconhecida-no-consumidor" });
  });

  it("detecta ciclo de resolução em vez de laçar ou adivinhar", () => {
    const a = transition({
      eventId: "e1",
      from: REF_A,
      to: REF_B,
      occurredAtUtc: "2026-01-01T00:00:00Z",
    });
    const b = transition({
      eventId: "e2",
      from: REF_B,
      to: REF_A,
      occurredAtUtc: "2026-02-01T00:00:00Z",
    });
    expect(resolveLocal(projectMesh([a, b]), REF_A)).toMatchObject({ kind: "ciclo-detectado" });
  });

  it("não segue auto-aresta (`from === to`) como se fosse aliasing", () => {
    const selfEdge = transition({
      eventId: "e1",
      from: REF_A,
      to: REF_A,
      occurredAtUtc: "2026-01-01T00:00:00Z",
    });
    expect(resolveLocal(projectMesh([selfEdge]), REF_A)).toMatchObject({
      kind: "resolvida",
      target: REF_A,
    });
  });

  it("ref marcada em revisão devolve condição própria, distinta de resolvida", () => {
    const t = transition({
      eventId: "e1",
      from: REF_A,
      to: REF_B,
      occurredAtUtc: "2026-01-01T00:00:00Z",
    });
    const mesh = projectMesh([t], { refsUnderReview: [REF_A] });
    expect(resolveLocal(mesh, REF_A)).toMatchObject({ kind: "em-revisao" });
  });
});
