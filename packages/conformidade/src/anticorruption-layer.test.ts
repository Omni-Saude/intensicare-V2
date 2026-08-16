/**
 * Testes da implementação de referência da camada anticorrupção.
 *
 * NOTA DE ESCOPO: estes são testes UNITÁRIOS da V2 — eles provam o que a
 * camada faz, não o que a AMH faz. Onde um teste precisa de um envelope
 * que NÃO existe entre as fixtures pinadas (o caso de transição cruzando
 * escopos), o envelope é construído AQUI, no teste, e o cenário
 * correspondente (CTS-18) permanece reportado como NÃO EXECUTÁVEL: um
 * envelope fabricado pela V2 não é evidência de contrato.
 */
import { describe, expect, it } from "vitest";
import { AnticorruptionLayer, type ConsumptionContext } from "./anticorruption-layer.js";
import { parseEnvelope, requiredString } from "./envelope.js";
import { fixtureByName, loadPinnedFixtures } from "./pinned-fixtures.js";

const fixtures = loadPinnedFixtures();

const CONTEXT: ConsumptionContext = {
  purpose: "tratamento",
  authorizedScopes: [{ amhTenant: "SYNTH-TENANT-A", legalEntity: "SYNTH-LE-00000001" }],
  legalBasisSource: "contrato-de-tratamento",
};

function deliver(fileName: string, layer: AnticorruptionLayer, delayMs = 1_000) {
  const raw = fixtureByName(fixtures, fileName).raw;
  const emittedAt = requiredString(parseEnvelope(raw), "emitted_at") ?? "2026-08-15T00:00:00Z";
  return layer.deliver({
    raw,
    receivedAtUtc: new Date(Date.parse(emittedAt) + delayMs).toISOString(),
  });
}

function newLayer(overrides?: Partial<ConsumptionContext>): AnticorruptionLayer {
  return new AnticorruptionLayer({ context: { ...CONTEXT, ...overrides } });
}

describe("invariantes do envelope — cada fixture inválida pela razão certa", () => {
  const cases: readonly [string, string][] = [
    ["alias.missing-idempotency-key.invalid.json", "missing_idempotency_key"],
    ["merge.ref-nova-igual-antiga.invalid.json", "merge_refs_identical"],
    ["unmerge.emissao-antes-do-fato.invalid.json", "emitted_before_occurred"],
    ["erasure.identificador-de-fonte-cru.invalid.json", "raw_source_identifier_present"],
  ];

  for (const [fileName, expectedToken] of cases) {
    it(`${fileName} → ${expectedToken}`, () => {
      const layer = newLayer();
      const outcome = deliver(fileName, layer);
      expect(outcome.kind).toBe("quarentenado");
      if (outcome.kind !== "quarentenado") return;
      expect(outcome.reason.token).toBe(expectedToken);
      expect(layer.transitions).toHaveLength(0);
      // Quarentena NÃO é descarte: o envelope permanece retido.
      expect(layer.journal).toHaveLength(1);
    });
  }

  it("o identificador de fonte cru vai para quarentena SEGREGADA e o valor não vaza", () => {
    const layer = newLayer();
    const outcome = deliver("erasure.identificador-de-fonte-cru.invalid.json", layer);
    expect(outcome.kind).toBe("quarentenado");
    if (outcome.kind !== "quarentenado") return;
    expect(outcome.segregated).toBe(true);
    // O qualificador carrega o NOME do campo, jamais o valor.
    expect(outcome.reason.qualifier).toBe("raw_source_identifier");
    const forbiddenValue = (
      JSON.parse(
        fixtureByName(fixtures, "erasure.identificador-de-fonte-cru.invalid.json").raw,
      ) as Record<string, unknown>
    ).raw_source_identifier;
    expect(JSON.stringify(layer.quarantine)).not.toContain(String(forbiddenValue));
  });
});

describe("aplicação, proveniência e deduplicação", () => {
  it("aplica evento válido com proveniência completa e qualidade `unknown` explícita", () => {
    const layer = newLayer();
    const outcome = deliver("alias.valid.json", layer);
    expect(outcome.kind).toBe("aplicado");
    if (outcome.kind !== "aplicado") return;
    expect(outcome.provenance.sourceQuality).toBe("unknown");
    expect(outcome.provenance.pinnedContractManifestDigest).toBeNull();
    expect(outcome.provenance.mappingVersion).toMatch(/^conformidade-acl\//);
    expect(outcome.provenance.retainedUnknownFields).toContain("_fixture");
  });

  it("deduplica redelivery exata sem contá-la como incidente", () => {
    const layer = newLayer();
    deliver("alias.valid.json", layer);
    const second = deliver("alias.valid.json", layer);
    expect(second.kind).toBe("deduplicado");
    expect(layer.transitions).toHaveLength(1);
    expect(layer.quarantine).toHaveLength(0);
    // O journal registra as DUAS chegadas — dedup não apaga o fato de ter chegado.
    expect(layer.journal).toHaveLength(2);
  });

  it("NÃO reconhece a mensagem quando a persistência durável falha (HAZ-0012)", () => {
    const layer = new AnticorruptionLayer({ context: CONTEXT, durableJournalFails: true });
    const outcome = deliver("alias.valid.json", layer);
    expect(outcome.kind).toBe("nao-durabilizado");
    expect(outcome.acknowledged).toBe(false);
    expect(layer.journal).toHaveLength(0);
  });
});

describe("recusas fail-closed", () => {
  it("recusa consumo sob propósito fora do vocabulário fechado", () => {
    const layer = newLayer({ purpose: "pesquisa" });
    const outcome = deliver("alias.valid.json", layer);
    expect(outcome.kind).toBe("recusado");
    expect(outcome.acknowledged).toBe(false);
    expect(layer.journal).toHaveLength(0);
  });

  it("recusa base legal derivada de permissão de contato", () => {
    const layer = newLayer({ legalBasisSource: "ie_perm_sms_email" });
    const outcome = deliver("alias.valid.json", layer);
    expect(outcome.kind).toBe("recusado");
    if (outcome.kind !== "recusado") return;
    expect(outcome.reason.token).toBe("legal_basis_from_contact_permission");
  });

  it("recusa escopo não autorizado", () => {
    const layer = new AnticorruptionLayer({
      context: {
        ...CONTEXT,
        authorizedScopes: [{ amhTenant: "SYNTH-TENANT-B", legalEntity: "SYNTH-LE-00000002" }],
      },
    });
    const outcome = deliver("alias.valid.json", layer);
    expect(outcome.kind).toBe("quarentenado");
    if (outcome.kind !== "quarentenado") return;
    expect(outcome.reason.token).toBe("scope_not_authorized");
  });

  it("quarentena `reassignment` por alcance indefinido e marca identidade em revisão (L-10)", () => {
    const layer = newLayer();
    const outcome = deliver("reassignment.valid.json", layer);
    expect(outcome.kind).toBe("quarentenado");
    if (outcome.kind !== "quarentenado") return;
    expect(outcome.reason.token).toBe("reassignment_scope_undefined");
    expect(layer.subjectsUnderReview).toHaveLength(2);
  });

  it("recusa transição que cruza escopos (envelope construído NO TESTE, não fixture)", () => {
    const layer = new AnticorruptionLayer({
      context: {
        ...CONTEXT,
        authorizedScopes: [
          { amhTenant: "SYNTH-TENANT-A", legalEntity: "SYNTH-LE-00000001" },
          { amhTenant: "SYNTH-TENANT-A", legalEntity: "SYNTH-LE-00000002" },
        ],
      },
    });
    deliver("alias.valid.json", layer);

    // Reusa a ref antiga de alias.valid.json em OUTRA entidade legal.
    const crossing = JSON.stringify({
      event_id: "99999999-9999-4999-8999-000000000001",
      event_type: "identity.merge.v1",
      event_type_version: "1",
      idempotency_key: "SYNTH-IDEM-CROSS-0001",
      amh_tenant: "SYNTH-TENANT-A",
      legal_entity: "SYNTH-LE-00000002",
      subject_ref_antiga: "amh:psr:v1:SYNTH-aaaa0001-0000-4000-8000-000000000001",
      subject_ref_nova: "amh:psr:v1:SYNTH-9999-0000-4000-8000-000000000099",
      occurred_at: "2026-08-15T12:00:00Z",
      emitted_at: "2026-08-15T12:00:01Z",
      correction_of: null,
    });
    const outcome = layer.deliver({ raw: crossing, receivedAtUtc: "2026-08-15T12:00:02Z" });

    expect(outcome.kind).toBe("quarentenado");
    if (outcome.kind !== "quarentenado") return;
    expect(outcome.reason.token).toBe("cross_scope_transition");
    expect(outcome.segregated).toBe(true);
  });
});

describe("retenção pendente de correção", () => {
  it("retém `restore` cujo `correction_of` ainda não foi visto e libera quando o alvo chega", () => {
    const layer = newLayer();
    const pendingOutcome = deliver("restore.valid.json", layer);
    expect(pendingOutcome.kind).toBe("retencao-pendente");
    expect(layer.transitions).toHaveLength(0);
    expect(layer.pending).toHaveLength(1);

    deliver("erasure.valid.json", layer);
    expect(layer.pending).toHaveLength(0);
    expect(layer.transitions.map((t) => t.eventType).sort()).toEqual([
      "identity.erasure.v1",
      "identity.restore.v1",
    ]);
  });

  it("marca identidade em revisão quando a retenção pendente vence", () => {
    const layer = newLayer();
    deliver("restore.valid.json", layer);
    expect(layer.subjectsUnderReview).toHaveLength(0);
    const overdue = layer.markOverduePendingUnderReview("2026-08-20T00:00:00Z", 24 * 3_600_000);
    expect(overdue).toHaveLength(1);
    expect(layer.subjectsUnderReview).toHaveLength(1);
  });
});
