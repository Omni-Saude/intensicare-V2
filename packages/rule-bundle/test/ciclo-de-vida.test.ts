/**
 * Ativação, rollback, kill switch, retirada e fronteira de configuração —
 * ADR-0007 eixos 4, 5, 6 e 7.
 *
 * Chaves e identidades sintéticas e efêmeras. Nenhuma ativação aqui tem
 * efeito clínico: o modo `actionable` é exercitado apenas para provar que é
 * RECUSADO enquanto houver bloqueio de prontidão.
 */

import { describe, expect, it } from "vitest";
import {
  type ApprovedBundle,
  assessActivationReadiness,
  buildKeyring,
  createDraft,
  evaluateSiteOverride,
  generateEphemeralKeyPair,
  type Keyring,
  RuleActivationLedger,
  signAsApprover,
  signAsAuthor,
  toAuditEvent,
} from "../src/index.js";
import { APROVACAO_EXEMPLO, manifestoExemplo, manifestoExemploVersao } from "./fixtures.js";

const T = {
  autoria: "2026-08-16T09:00:00.000Z",
  ativa100: "2026-09-01T10:00:00.000Z",
  ativa110: "2026-09-10T10:00:00.000Z",
  rollback: "2026-09-11T08:00:00.000Z",
  kill: "2026-09-12T08:00:00.000Z",
  retira: "2026-09-13T08:00:00.000Z",
} as const;

function aprovar(versao: string): { bundle: ApprovedBundle; keyring: Keyring } {
  const autor = generateEphemeralKeyPair("SYNTH-chave-autor-01");
  const aprovador = generateEphemeralKeyPair("SYNTH-chave-aprovador-02");
  const rascunho = createDraft(manifestoExemploVersao(versao));
  const autorado = signAsAuthor(rascunho, autor.signingKey, T.autoria);
  return {
    bundle: signAsApprover(autorado, aprovador.signingKey, APROVACAO_EXEMPLO),
    keyring: buildKeyring([autor.verificationKey, aprovador.verificationKey]),
  };
}

function livroComVersoes(versoes: readonly string[]): RuleActivationLedger {
  const livro = new RuleActivationLedger("RULE-SYNTH-EXEMPLO", "dev", "SYNTH-unidade-01");
  for (const versao of versoes) {
    const { bundle, keyring } = aprovar(versao);
    livro.registerApprovedBundle(bundle, keyring);
  }
  return livro;
}

const AUTORIZACAO = {
  authorizedBy: "SYNTH-autoridade-de-ativacao-01",
  privacySecurityCoAuthorization: "SYNTH-co-autorizacao-privacidade-seguranca-01",
} as const;

describe("admissão no livro-razão", () => {
  it("bundle verificado é admitido, com seus bloqueios de prontidão calculados", () => {
    const livro = new RuleActivationLedger("RULE-SYNTH-EXEMPLO", "dev", "SYNTH-unidade-01");
    const { bundle, keyring } = aprovar("1.0.0");

    const registrado = livro.registerApprovedBundle(bundle, keyring);

    expect(registrado.version).toBe("1.0.0");
    expect(registrado.authorKeyId).toBe("SYNTH-chave-autor-01");
    expect(registrado.approverKeyId).toBe("SYNTH-chave-aprovador-02");
    expect(registrado.blockers.length).toBeGreaterThan(0);
  });

  it("bundle adulterado é recusado JÁ na admissão", () => {
    const livro = new RuleActivationLedger("RULE-SYNTH-EXEMPLO", "dev", "SYNTH-unidade-01");
    const { bundle, keyring } = aprovar("1.0.0");

    const adulterado: ApprovedBundle = {
      ...bundle,
      manifest: {
        ...bundle.manifest,
        intendedUse: { ...bundle.manifest.intendedUse, admittedByGateG2: true },
      },
    };

    expect(() => livro.registerApprovedBundle(adulterado, keyring)).toThrow(/recusado na admissão/);
  });

  it("a mesma versão com OUTRO conteúdo é recusada — versão é imutável", () => {
    const livro = new RuleActivationLedger("RULE-SYNTH-EXEMPLO", "dev", "SYNTH-unidade-01");
    const primeiro = aprovar("1.0.0");
    livro.registerApprovedBundle(primeiro.bundle, primeiro.keyring);

    const autor = generateEphemeralKeyPair("SYNTH-chave-autor-01");
    const aprovador = generateEphemeralKeyPair("SYNTH-chave-aprovador-02");
    const base = manifestoExemploVersao("1.0.0");
    const outroConteudo = createDraft({
      ...base,
      evidence: { ...base.evidence, snapshotDate: "2026-08-17" },
    });
    const autorado = signAsAuthor(outroConteudo, autor.signingKey, T.autoria);
    const aprovado = signAsApprover(autorado, aprovador.signingKey, APROVACAO_EXEMPLO);

    expect(() =>
      livro.registerApprovedBundle(
        aprovado,
        buildKeyring([autor.verificationKey, aprovador.verificationKey]),
      ),
    ).toThrow(/já foi admitida com OUTRO conteúdo/);
  });

  it("livro de outra regra não aceita este bundle", () => {
    const livro = new RuleActivationLedger("RULE-OUTRA", "dev", "SYNTH-unidade-01");
    const { bundle, keyring } = aprovar("1.0.0");
    expect(() => livro.registerApprovedBundle(bundle, keyring)).toThrow(/este livro governa/);
  });
});

describe("ativação (eixo 4)", () => {
  it("antes de qualquer evento, nada está ativo — e a razão é explícita", () => {
    const livro = livroComVersoes(["1.0.0"]);
    expect(livro.activeVersionAt(T.ativa100)).toEqual({
      kind: "none",
      reason: "never_activated",
      since: null,
    });
  });

  it("ativação em modo shadow funciona e fica registrada", () => {
    const livro = livroComVersoes(["1.0.0"]);
    livro.activate({
      version: "1.0.0",
      mode: "shadow",
      occurredAt: T.ativa100,
      reason: "avaliação shadow, não acionante",
      ...AUTORIZACAO,
    });

    const estado = livro.activeVersionAt(T.ativa100);
    expect(estado.kind).toBe("active");
    if (estado.kind === "active") {
      expect(estado.version).toBe("1.0.0");
      expect(estado.mode).toBe("shadow");
    }
  });

  it("modo ACIONÁVEL é recusado enquanto houver bloqueio de prontidão (fail-closed)", () => {
    const livro = livroComVersoes(["1.0.0"]);
    expect(() =>
      livro.activate({
        version: "1.0.0",
        mode: "actionable",
        occurredAt: T.ativa100,
        reason: "tentativa de ativação acionável",
        ...AUTORIZACAO,
      }),
    ).toThrow(/ativação ACIONÁVEL recusada \(fail-closed\)/);
  });

  it("sem co-autorização de privacidade/segurança não ativa nem em shadow (A7-5)", () => {
    const livro = livroComVersoes(["1.0.0"]);
    expect(() =>
      livro.activate({
        version: "1.0.0",
        mode: "shadow",
        occurredAt: T.ativa100,
        reason: "tentativa sem co-autorização",
        authorizedBy: "SYNTH-autoridade-de-ativacao-01",
        privacySecurityCoAuthorization: null,
      }),
    ).toThrow(/co-autorização de privacidade\/segurança/);
  });

  it("versão não admitida nunca é ativável", () => {
    const livro = livroComVersoes(["1.0.0"]);
    expect(() =>
      livro.activate({
        version: "9.9.9",
        mode: "shadow",
        occurredAt: T.ativa100,
        reason: "versão inexistente",
        ...AUTORIZACAO,
      }),
    ).toThrow(/não foi admitida neste livro-razão/);
  });

  it("ativação é monotônica: retroceder exige rollback explícito", () => {
    const livro = livroComVersoes(["1.0.0", "1.1.0"]);
    livro.activate({
      version: "1.1.0",
      mode: "shadow",
      occurredAt: T.ativa100,
      reason: "shadow da 1.1.0",
      ...AUTORIZACAO,
    });

    expect(() =>
      livro.activate({
        version: "1.0.0",
        mode: "shadow",
        occurredAt: T.ativa110,
        reason: "tentativa de voltar por ativação",
        ...AUTORIZACAO,
      }),
    ).toThrow(/Retroceder é rollback explícito/);
  });

  it("evento fora de ordem cronológica é recusado", () => {
    const livro = livroComVersoes(["1.0.0"]);
    livro.activate({
      version: "1.0.0",
      mode: "shadow",
      occurredAt: T.ativa110,
      reason: "primeira",
      ...AUTORIZACAO,
    });

    expect(() =>
      livro.killSwitch({
        occurredAt: T.ativa100,
        authorizedBy: "SYNTH-autoridade-01",
        reason: "evento no passado",
      }),
    ).toThrow(/append-only e monotônica no tempo/);
  });
});

describe("rollback e kill switch (eixo 5)", () => {
  function livroComDuasAtivacoes(): RuleActivationLedger {
    const livro = livroComVersoes(["1.0.0", "1.1.0"]);
    livro.activate({
      version: "1.0.0",
      mode: "shadow",
      occurredAt: T.ativa100,
      reason: "primeira ativação shadow",
      ...AUTORIZACAO,
    });
    livro.activate({
      version: "1.1.0",
      mode: "shadow",
      occurredAt: T.ativa110,
      reason: "promoção da sucessora",
      ...AUTORIZACAO,
    });
    return livro;
  }

  it("rollback restaura a versão anterior SEM apagar nada da trilha", () => {
    const livro = livroComDuasAtivacoes();
    const antes = livro.history().length;

    livro.rollback({
      toVersion: "1.0.0",
      occurredAt: T.rollback,
      authorizedBy: "SYNTH-autoridade-01",
      reason: "regressão observada na 1.1.0",
    });

    const estado = livro.activeVersionAt(T.rollback);
    expect(estado.kind).toBe("active");
    if (estado.kind === "active") {
      expect(estado.version).toBe("1.0.0");
    }

    // A trilha CRESCE; o evento anterior continua lá, intacto.
    expect(livro.history()).toHaveLength(antes + 1);
    expect(livro.history()[1]?.targetVersion).toBe("1.1.0");
    expect(livro.history().at(-1)?.previousVersion).toBe("1.1.0");
  });

  it("a resposta de 'qual versão estava ativa' depende do INSTANTE consultado", () => {
    const livro = livroComDuasAtivacoes();
    livro.rollback({
      toVersion: "1.0.0",
      occurredAt: T.rollback,
      authorizedBy: "SYNTH-autoridade-01",
      reason: "regressão observada",
    });

    const em100 = livro.activeVersionAt(T.ativa100);
    const em110 = livro.activeVersionAt(T.ativa110);
    const depois = livro.activeVersionAt(T.rollback);

    expect(em100.kind === "active" && em100.version).toBe("1.0.0");
    expect(em110.kind === "active" && em110.version).toBe("1.1.0");
    expect(depois.kind === "active" && depois.version).toBe("1.0.0");
  });

  it("rollback para versão que nunca esteve ativa é recusado", () => {
    const livro = livroComVersoes(["1.0.0", "1.1.0"]);
    livro.activate({
      version: "1.1.0",
      mode: "shadow",
      occurredAt: T.ativa100,
      reason: "só a 1.1.0 esteve ativa",
      ...AUTORIZACAO,
    });

    expect(() =>
      livro.rollback({
        toVersion: "1.0.0",
        occurredAt: T.rollback,
        authorizedBy: "SYNTH-autoridade-01",
        reason: "tentativa",
      }),
    ).toThrow(/nunca esteve ativa neste escopo/);
  });

  it("rollback não promove modo: herda o modo da ativação anterior", () => {
    const livro = livroComDuasAtivacoes();
    livro.rollback({
      toVersion: "1.0.0",
      occurredAt: T.rollback,
      authorizedBy: "SYNTH-autoridade-01",
      reason: "regressão",
    });
    const estado = livro.activeVersionAt(T.rollback);
    expect(estado.kind === "active" && estado.mode).toBe("shadow");
  });

  it("kill switch desativa SEM substituição, com razão `rule_unavailable`", () => {
    const livro = livroComDuasAtivacoes();
    livro.killSwitch({
      occurredAt: T.kill,
      authorizedBy: "SYNTH-autoridade-01",
      reason: "defeito suspeito na própria fórmula — nem a versão anterior é confiável",
    });

    expect(livro.activeVersionAt(T.kill)).toEqual({
      kind: "none",
      reason: "rule_unavailable",
      since: T.kill,
    });
  });

  it("kill switch sem versão ativa é recusado", () => {
    const livro = livroComVersoes(["1.0.0"]);
    expect(() =>
      livro.killSwitch({
        occurredAt: T.kill,
        authorizedBy: "SYNTH-autoridade-01",
        reason: "nada ativo",
      }),
    ).toThrow(/não há versão ativa/);
  });
});

describe("retirada (eixo 6)", () => {
  it("a versão ATIVA não pode ser retirada sob os pés do runtime", () => {
    const livro = livroComVersoes(["1.0.0"]);
    livro.activate({
      version: "1.0.0",
      mode: "shadow",
      occurredAt: T.ativa100,
      reason: "ativa",
      ...AUTORIZACAO,
    });

    expect(() =>
      livro.retire({
        version: "1.0.0",
        supersededBy: null,
        occurredAt: T.retira,
        authorizedBy: "SYNTH-autoridade-01",
        reason: "tentativa de retirar a ativa",
      }),
    ).toThrow(/está ativa/);
  });

  it("versão retirada nunca reativa", () => {
    const livro = livroComVersoes(["1.0.0", "1.1.0"]);
    livro.activate({
      version: "1.0.0",
      mode: "shadow",
      occurredAt: T.ativa100,
      reason: "ativa",
      ...AUTORIZACAO,
    });
    livro.activate({
      version: "1.1.0",
      mode: "shadow",
      occurredAt: T.ativa110,
      reason: "sucessora",
      ...AUTORIZACAO,
    });
    livro.retire({
      version: "1.0.0",
      supersededBy: "1.1.0",
      occurredAt: T.retira,
      authorizedBy: "SYNTH-autoridade-01",
      reason: "substituída",
    });

    expect(() =>
      livro.rollback({
        toVersion: "1.0.0",
        occurredAt: "2026-09-14T08:00:00.000Z",
        authorizedBy: "SYNTH-autoridade-01",
        reason: "tentativa de ressuscitar",
      }),
    ).toThrow(/está retirada/);
  });
});

describe("integridade da trilha", () => {
  it("a cadeia de hash valida em uma trilha íntegra", () => {
    const livro = livroComVersoes(["1.0.0", "1.1.0"]);
    livro.activate({
      version: "1.0.0",
      mode: "shadow",
      occurredAt: T.ativa100,
      reason: "a",
      ...AUTORIZACAO,
    });
    livro.activate({
      version: "1.1.0",
      mode: "shadow",
      occurredAt: T.ativa110,
      reason: "b",
      ...AUTORIZACAO,
    });
    livro.killSwitch({
      occurredAt: T.kill,
      authorizedBy: "SYNTH-autoridade-01",
      reason: "c",
    });

    expect(livro.verifyChain()).toEqual({ ok: true });
    expect(livro.history().map((e) => e.sequence)).toEqual([1, 2, 3]);
    expect(livro.history()[0]?.previousEventHash).toBeNull();
    expect(livro.history()[1]?.previousEventHash).toBe(livro.history()[0]?.eventHash);
  });

  it("`history()` devolve cópia: mexer no retorno não mexe na trilha", () => {
    const livro = livroComVersoes(["1.0.0"]);
    livro.activate({
      version: "1.0.0",
      mode: "shadow",
      occurredAt: T.ativa100,
      reason: "a",
      ...AUTORIZACAO,
    });

    // Cada chamada devolve um array novo: quem recebe a trilha não tem
    // como encolhê-la por referência.
    expect(livro.history()).not.toBe(livro.history());
    expect(livro.history()).toHaveLength(1);
  });

  it("um evento de ativação projeta em `AuditEvent` do domínio", () => {
    const livro = livroComVersoes(["1.0.0"]);
    const evento = livro.activate({
      version: "1.0.0",
      mode: "shadow",
      occurredAt: T.ativa100,
      reason: "a",
      ...AUTORIZACAO,
    });

    const auditoria = toAuditEvent(evento, {
      tenantId: "SYNTH-tenant-0900",
      idempotencyKey: "SYNTH-idempotencia-01",
    });

    expect(auditoria.command).toBe("rule-bundle.activation");
    expect(auditoria.actorId).toBe("SYNTH-autoridade-de-ativacao-01");
    expect(auditoria.newState).toBe("1.0.0");
    expect(auditoria.occurredAt.kind).toBe("present");
  });
});

describe("prontidão de ativação — bloqueios declarados, não presumidos", () => {
  it("o manifesto de fixture acumula os bloqueios esperados", () => {
    const codigos = assessActivationReadiness(manifestoExemplo()).map((b) => b.code);

    expect(codigos).toContain("sem_fonte_populada_evidenciada");
    expect(codigos).toContain("portfolio_g2_nao_aprovado");
    expect(codigos).toContain("snapshot_de_terminologia_inexistente");
    expect(codigos).toContain("test_pack_sem_autoria_independente");
    expect(codigos).toContain("validacao_retrospectiva_incompleta");
    expect(codigos).toContain("envelope_de_configuracao_sem_piso");
  });

  it("cada bloqueio aponta a condição da ADR-0007 quando ela existe", () => {
    const bloqueios = assessActivationReadiness(manifestoExemplo());
    const g2 = bloqueios.find((b) => b.code === "portfolio_g2_nao_aprovado");
    expect(g2?.adrCondition).toBe("C4");
  });
});

describe("envelope de configuração — aperta-nunca-afrouxa (eixo 7, A7-2)", () => {
  const envelope = manifestoExemplo().configurationEnvelope;

  it("afrouxar é sempre recusado", () => {
    const decisao = evaluateSiteOverride(envelope, "SYNTH-limiar-01", 7);
    expect(decisao.accepted).toBe(false);
    if (!decisao.accepted) {
      expect(decisao.code).toBe("afrouxamento_proibido");
    }
  });

  it("apertar dentro do piso declarado é aceito e fica visível como sobrescrita", () => {
    const decisao = evaluateSiteOverride(envelope, "SYNTH-limiar-01", 4);
    expect(decisao.accepted).toBe(true);
    if (decisao.accepted) {
      expect(decisao.value).toBe(4);
      expect(decisao.note).toMatch(/sobrescrita de site/);
    }
  });

  it("apertar ALÉM do piso declarado é recusado", () => {
    const decisao = evaluateSiteOverride(envelope, "SYNTH-limiar-01", 1);
    expect(decisao.accepted).toBe(false);
    if (!decisao.accepted) {
      expect(decisao.code).toBe("aperto_alem_do_limite");
    }
  });

  it("sem piso declarado, nem apertar é aceito — recusar em vez de inventar", () => {
    const decisao = evaluateSiteOverride(envelope, "SYNTH-limiar-sem-piso", 4);
    expect(decisao.accepted).toBe(false);
    if (!decisao.accepted) {
      expect(decisao.code).toBe("piso_nao_declarado");
    }
  });

  it("campo não configurável nunca aceita sobrescrita", () => {
    const decisao = evaluateSiteOverride(envelope, "SYNTH-imutavel", 1);
    expect(decisao.accepted).toBe(false);
    if (!decisao.accepted) {
      expect(decisao.code).toBe("campo_nao_configuravel");
    }
  });

  it("campo que o bundle não publica não é configurável por definição", () => {
    const decisao = evaluateSiteOverride(envelope, "SYNTH-campo-inexistente", 1);
    expect(decisao.accepted).toBe(false);
    if (!decisao.accepted) {
      expect(decisao.code).toBe("campo_nao_publicado");
    }
  });
});
