/**
 * Bundle REAL do RULE-NEWS2 0.2.0, montado a partir do kernel clínico e dos
 * 93 vetores de referência clínica publicados.
 *
 * O que este teste prova — e o que ele NÃO prova
 * ---------------------------------------------
 * PROVA: que o mecanismo de empacotamento, assinatura, verificação e ciclo
 * de vida funciona sobre a regra real, e que o `behaviorHash` pina o
 * comportamento observável do motor.
 *
 * NÃO PROVA: nada de clínico. A disciplina §0 do conjunto CRV é explícita —
 * os vetores foram autorados pelo mesmo agente que autorou a especificação,
 * então a passagem deles serve a autoria red/green e JAMAIS é evidência de
 * release. O bundle montado aqui é assinado por chaves sintéticas efêmeras
 * e permanece NOT ACTIONABLE: ativação acionável é recusada pelo próprio
 * livro-razão, com a lista de bloqueios.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { evaluateNews2, type News2ParameterId } from "@intensicare/kernel-clinico";
import { describe, expect, it } from "vitest";
import {
  assessActivationReadiness,
  buildKeyring,
  buildNews2BundleManifest,
  computeNews2BehaviorHash,
  contentDigest,
  createDraft,
  generateEphemeralKeyPair,
  type News2TestPack,
  parseNews2TestPack,
  RuleActivationLedger,
  signAsApprover,
  signAsAuthor,
  validateManifest,
  verifyBundle,
  verifyNews2EngineBehavior,
} from "../src/index.js";
import { APROVACAO_EXEMPLO } from "./fixtures.js";

/**
 * Os vetores publicados vivem no diretório de teste do kernel. Ler dali é a
 * escolha honesta enquanto não existir um local canônico de primeira classe
 * para o conjunto CRV executável — registrado como pendência, não escondido
 * atrás de uma cópia divergente.
 */
const CAMINHO_VETORES = fileURLToPath(
  new URL("../../kernel-clinico/test/vetores-news2.json", import.meta.url),
);

const INSTANTE_AUTORIA = "2026-08-16T09:00:00.000Z";

function carregarTestPack(): News2TestPack {
  return parseNews2TestPack(readFileSync(CAMINHO_VETORES, "utf8"), {
    setId: "RULE-NEWS2-CRV-SET",
    standard: "docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md",
  });
}

const testPack = carregarTestPack();
const manifesto = buildNews2BundleManifest({ testPack, authoredAt: INSTANTE_AUTORIA });

describe("test pack expandido a partir dos vetores publicados", () => {
  it("traz os 93 vetores CRV-NEWS2, sem lacuna de ID", () => {
    expect(testPack.vectors).toHaveLength(93);
    const ids = new Set(testPack.vectors.map((v) => v.id));
    for (let n = 101; n <= 193; n++) {
      expect(ids.has(`CRV-NEWS2-0${n}`), `CRV-NEWS2-0${n} presente`).toBe(true);
    }
  });

  it("cada vetor é AUTOCONTIDO: a entrada não depende de baseline externo", () => {
    for (const vetor of testPack.vectors) {
      expect(vetor.input.evaluationTime).toBe(testPack.evaluationTime);
      expect(Array.isArray(vetor.input.observations)).toBe(true);
    }
  });

  it("todo dado é sintético (prefixo SYNTH- em toda proveniência de fonte)", () => {
    for (const vetor of testPack.vectors) {
      for (const observacao of vetor.input.observations) {
        expect(observacao.provenance.sourceSystem.startsWith("SYNTH-")).toBe(true);
      }
    }
  });
});

describe("o motor real reproduz os desfechos documentados dos 93 vetores", () => {
  it.each(testPack.vectors.map((vetor) => ({ id: vetor.id, vetor })))("$id", ({ vetor }) => {
    const registro = evaluateNews2(vetor.input);

    expect(registro.ruleId).toBe("RULE-NEWS2");
    expect(registro.ruleVersion).toBe("0.2.0");
    expect(registro.status, "status agregado").toBe(vetor.expected.status);
    expect(registro.totalScore, "total").toBe(vetor.expected.total);
    expect(registro.riskTier, "banda").toBe(vetor.expected.tier);
    expect(registro.fires, "condição de exibição de escalonamento").toBe(vetor.expected.fires);
    expect(registro.redParameter, "parâmetro vermelho").toBe(vetor.expected.redParameter);
    expect([...registro.reasons].sort()).toEqual([...vetor.expected.reasons].sort());

    // Invariante HAZ-0005, verificado em TODO vetor: status não-válido
    // jamais carrega total numérico.
    if (registro.status !== "valid") {
      expect(registro.totalScore).toBeNull();
      expect(registro.riskTier).toBeNull();
      expect(registro.reasons.length).toBeGreaterThan(0);
    }

    if (vetor.expected.paramScores !== undefined) {
      for (const [parametro, pontos] of Object.entries(vetor.expected.paramScores)) {
        const contribuicao = registro.parameters.find(
          (c) => c.parameter === (parametro as News2ParameterId),
        );
        expect(contribuicao?.score, `contribuição de ${parametro}`).toBe(pontos);
      }
    }
  });
});

describe("behaviorHash — a versão passa a identificar COMPORTAMENTO (defeito SF-2)", () => {
  it("é estável: recomputar sobre o mesmo pacote dá o mesmo hash", () => {
    expect(computeNews2BehaviorHash(testPack.vectors)).toBe(manifesto.logic.behaviorHash);
    expect(computeNews2BehaviorHash(testPack.vectors)).toBe(
      computeNews2BehaviorHash(testPack.vectors),
    );
  });

  it("o motor em execução é verificado contra o hash assinado", () => {
    const resultado = verifyNews2EngineBehavior(manifesto, testPack.vectors);
    expect(resultado.ok).toBe(true);
  });

  it("um motor que devolvesse OUTRO comportamento seria recusado", () => {
    // Simula deriva de comportamento alterando um único vetor do pacote: o
    // hash recomputado deixa de bater com o assinado.
    const primeiro = testPack.vectors[0];
    expect(primeiro).toBeDefined();
    if (primeiro === undefined) {
      return;
    }

    const pacoteDerivado = [
      {
        ...primeiro,
        input: { ...primeiro.input, age: { kind: "verified", years: 17 } as const },
      },
      ...testPack.vectors.slice(1),
    ];

    const resultado = verifyNews2EngineBehavior(manifesto, pacoteDerivado);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.actual).not.toBe(resultado.expected);
    }
  });
});

describe("manifesto do RULE-NEWS2 0.2.0", () => {
  it("não tem defeito estrutural de esquema", () => {
    expect(validateManifest(manifesto)).toEqual([]);
  });

  it("é determinístico: mesma entrada, mesmos bytes, mesmo digest", () => {
    const outro = buildNews2BundleManifest({
      testPack: carregarTestPack(),
      authoredAt: INSTANTE_AUTORIA,
    });
    expect(contentDigest(outro)).toBe(contentDigest(manifesto));
  });

  it("carrega os doze campos do §6.4 preenchidos, não vazios", () => {
    expect(manifesto.identity.ruleId).toBe("RULE-NEWS2");
    expect(manifesto.identity.ruleVersion).toBe("0.2.0");
    expect(manifesto.intendedUse.exclusions.length).toBeGreaterThan(0);
    expect(manifesto.evidence.issuerUrl).toContain("rcp.ac.uk");
    expect(manifesto.accountability.independentBundleApproverRequired).toBe(true);
    expect(manifesto.logic.behaviorHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(manifesto.terminology.bindings).toHaveLength(7);
    expect(manifesto.inputPolicy).toHaveLength(7);
    expect(manifesto.testPack.vectorCount).toBe(93);
    expect(manifesto.safety.hazards).toContain("HAZ-0005");
    expect(manifesto.explainability.languageTags).toContain("pt-BR");
    expect(manifesto.validation.retrospective).toBe("not_started");
    expect(manifesto.operations.retirement.reviewDueAt).toBe("2027-08-16T09:00:00.000Z");
  });

  it("mantém a classificação NOT ACTIONABLE e a ausência de fonte populada", () => {
    expect(manifesto.intendedUse.evidencedPopulatedSource).toBe(false);
    expect(manifesto.intendedUse.admittedByGateG2).toBe(false);
    expect(manifesto.intendedUse.actionabilityClassification).toContain("NOT ACTIONABLE");
  });

  it("declara a autoria dos vetores como NÃO independente (disciplina §0)", () => {
    expect(manifesto.testPack.authorshipIndependenceConfirmed).toBe(false);
    expect(manifesto.testPack.lifecycleStatus).toBe("DRAFT");
  });

  it("não alega ser variante da edição canônica nem declara divergência", () => {
    expect(manifesto.identity.isVariantOfCanonicalEdition).toBe(false);
    expect(manifesto.identity.declaredDivergences).toEqual([]);
  });

  it("aperta a cadência de retirada (12 meses) com justificativa registrada", () => {
    expect(manifesto.operations.retirement.defaultCadenceMonths).toBe(24);
    expect(manifesto.operations.retirement.bundleCadenceMonths).toBe(12);
    expect(manifesto.operations.retirement.cadenceOverrideJustification).not.toBeNull();
  });

  it("não inventa limiar de monitoramento: todos permanecem VALIDATION REQUIRED", () => {
    for (const sinal of manifesto.operations.monitoring) {
      expect(sinal.threshold).toBeNull();
      expect(sinal.thresholdStatus).toContain("VALIDATION REQUIRED");
    }
  });

  it("não inventa snapshot de terminologia: fica nulo e declarado (C6)", () => {
    expect(manifesto.terminology.snapshotId).toBeNull();
    for (const vinculo of manifesto.terminology.bindings) {
      expect(vinculo.bindingStatus).toBe("candidate");
    }
  });
});

describe("bundle assinável: fluxo completo sobre a regra real", () => {
  function assinarComChavesSinteticas() {
    const autor = generateEphemeralKeyPair("SYNTH-chave-autor-de-regra-01");
    const aprovador = generateEphemeralKeyPair("SYNTH-chave-aprovador-independente-02");
    const autorado = signAsAuthor(createDraft(manifesto), autor.signingKey, INSTANTE_AUTORIA);
    const aprovado = signAsApprover(autorado, aprovador.signingKey, {
      ...APROVACAO_EXEMPLO,
      approverRole:
        "SYNTH — aprovador independente FICTÍCIO. Nenhum segundo revisor clínico real " +
        "existe (ADR-0007 C1, aberta); esta contra-assinatura exercita o mecanismo e não " +
        "é aprovação de conteúdo clínico.",
    });
    return {
      aprovado,
      keyring: buildKeyring([autor.verificationKey, aprovador.verificationKey]),
    };
  }

  it("assina, contra-assina e verifica o bundle real do NEWS2", () => {
    const { aprovado, keyring } = assinarComChavesSinteticas();
    const resultado = verifyBundle(aprovado, keyring);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.authorKeyId).not.toBe(resultado.approverKeyId);
    }
  });

  it("adulterar um vetor do test pack dentro do bundle derruba a verificação", () => {
    const { aprovado, keyring } = assinarComChavesSinteticas();

    const vetores = [...aprovado.manifest.testPack.vectors];
    const primeiro = vetores[0];
    expect(primeiro).toBeDefined();
    if (primeiro === undefined) {
      return;
    }
    vetores[0] = { ...primeiro, expected: { status: "valid", total: 0 } };

    const adulterado = {
      ...aprovado,
      manifest: {
        ...aprovado.manifest,
        testPack: { ...aprovado.manifest.testPack, vectors: vetores },
      },
    };

    expect(verifyBundle(adulterado, keyring).ok).toBe(false);
  });

  it("adulterar um gatilho publicado (afrouxando o limiar 5) derruba a verificação", () => {
    const { aprovado, keyring } = assinarComChavesSinteticas();

    const gatilhos = aprovado.manifest.logic.publishedTriggers.map((gatilho) =>
      gatilho.triggerId === "aggregate_urgent" ? { ...gatilho, value: 8 } : gatilho,
    );

    const adulterado = {
      ...aprovado,
      manifest: {
        ...aprovado.manifest,
        logic: { ...aprovado.manifest.logic, publishedTriggers: gatilhos },
      },
    };

    expect(verifyBundle(adulterado, keyring).ok).toBe(false);
  });

  it("o bundle real acumula bloqueios de prontidão — nenhuma via fica acionável", () => {
    const bloqueios = assessActivationReadiness(manifesto);
    const codigos = bloqueios.map((b) => b.code);

    expect(bloqueios.length).toBeGreaterThan(0);
    expect(codigos).toContain("sem_fonte_populada_evidenciada");
    expect(codigos).toContain("portfolio_g2_nao_aprovado");
    expect(codigos).toContain("snapshot_de_terminologia_inexistente");
    expect(codigos).toContain("vinculos_de_terminologia_candidatos");
    expect(codigos).toContain("test_pack_sem_autoria_independente");
    expect(codigos).toContain("itens_de_vigilancia_de_diretriz_abertos");
  });

  it("shadow é possível; ACIONÁVEL é recusado — 0 vias acionáveis preservado", () => {
    const { aprovado, keyring } = assinarComChavesSinteticas();
    const livro = new RuleActivationLedger("RULE-NEWS2", "dev", "SYNTH-unidade-01");
    livro.registerApprovedBundle(aprovado, keyring);

    const autorizacao = {
      authorizedBy: "SYNTH-autoridade-clinica-01",
      privacySecurityCoAuthorization: "SYNTH-co-autorizacao-01",
    };

    expect(() =>
      livro.activate({
        version: "0.2.0",
        mode: "actionable",
        occurredAt: "2026-09-01T10:00:00.000Z",
        reason: "tentativa de tornar a via acionável",
        ...autorizacao,
      }),
    ).toThrow(/ativação ACIONÁVEL recusada \(fail-closed\)/);

    const evento = livro.activate({
      version: "0.2.0",
      mode: "shadow",
      occurredAt: "2026-09-01T10:00:00.000Z",
      reason: "avaliação shadow sintética, não acionante",
      ...autorizacao,
    });

    expect(evento.mode).toBe("shadow");
    const estado = livro.activeVersionAt("2026-09-01T10:00:00.000Z");
    expect(estado.kind === "active" && estado.mode).toBe("shadow");
  });
});
