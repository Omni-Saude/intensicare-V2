/**
 * Bundle REAL do RULE-SOFA 0.2.0, montado a partir do kernel clínico e dos
 * vetores de referência clínica publicados (CRV-SOFA-0301..0341).
 *
 * O que este teste prova — e o que ele NÃO prova
 * ---------------------------------------------
 * PROVA: que o mecanismo de empacotamento, assinatura, verificação e ciclo
 * de vida funciona sobre a TERCEIRA via real, e que o `behaviorHash` pina o
 * comportamento observável do motor SOFA sobre os 38 vetores ativos.
 *
 * NÃO PROVA: nada de clínico. A disciplina §0 do conjunto CRV é explícita —
 * os vetores foram autorados pelo mesmo agente que autorou a especificação
 * (authorship.independence_confirmed: false), então a passagem deles serve
 * a autoria red/green e JAMAIS é evidência de release. O bundle montado
 * aqui é assinado por chaves sintéticas efêmeras e permanece NOT
 * ACTIONABLE: ativação acionável é recusada pelo próprio livro-razão, com
 * a lista de bloqueios.
 *
 * REDE DE PROTEÇÃO da duplicação E11 (expansão painel+delta vive também em
 * `packages/kernel-clinico/test/suporte-sofa.ts`): este arquivo executa
 * TODOS os vetores ativos expandidos PELO RULE-BUNDLE contra o kernel real
 * e exige os desfechos documentados — divergência de expansão que importe
 * falha aqui, não passa silenciosamente.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { evaluateSofa, type SofaComponentId } from "@intensicare/kernel-clinico";
import { describe, expect, it } from "vitest";
import {
  assessActivationReadiness,
  buildKeyring,
  buildSofaBundleManifest,
  computeSofaBehaviorHash,
  contentDigest,
  createDraft,
  generateEphemeralKeyPair,
  parseSofaTestPack,
  RuleActivationLedger,
  type SofaTestPack,
  signAsApprover,
  signAsAuthor,
  validateManifest,
  verifyBundle,
  verifySofaEngineBehavior,
} from "../src/index.js";
import { APROVACAO_EXEMPLO } from "./fixtures.js";

/**
 * Os vetores publicados vivem no diretório de teste do kernel. Ler dali é a
 * escolha honesta enquanto não existir um local canônico de primeira classe
 * para o conjunto CRV executável — registrado como pendência, não escondido
 * atrás de uma cópia divergente.
 */
const CAMINHO_VETORES = fileURLToPath(
  new URL("../../kernel-clinico/test/vetores-sofa.json", import.meta.url),
);

const INSTANTE_AUTORIA = "2026-09-19T09:00:00.000Z";

function carregarTestPack(): SofaTestPack {
  return parseSofaTestPack(readFileSync(CAMINHO_VETORES, "utf8"), {
    setId: "RULE-SOFA-CRV-SET",
    standard: "docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md",
  });
}

const testPack = carregarTestPack();
const manifesto = buildSofaBundleManifest({ testPack, authoredAt: INSTANTE_AUTORIA });

describe("test pack SOFA — contagem de máquina do corpus publicado", () => {
  it("transcreve exatamente 41 vetores: 38 ATIVOS executáveis + 3 aposentados", () => {
    expect(testPack.activeVectorCount).toBe(38);
    expect(testPack.retiredVectorIds).toEqual(["CRV-SOFA-0321", "CRV-SOFA-0322", "CRV-SOFA-0323"]);
    // O pack executável carrega SOMENTE os ativos — os aposentados tiveram
    // as expectativas substituídas pelas decisões GDEC-0007.
    expect(testPack.vectors).toHaveLength(38);
    const ids = new Set(testPack.vectors.map((v) => v.id));
    expect(ids.size).toBe(38);
    const aposentados = new Set(testPack.retiredVectorIds);
    for (let n = 301; n <= 341; n++) {
      const id = `CRV-SOFA-0${n}`;
      if (aposentados.has(id)) {
        expect(ids.has(id), `${id} NÃO é executável (aposentado)`).toBe(false);
      } else {
        expect(ids.has(id), `${id} presente e executável`).toBe(true);
      }
    }
  });

  it("cada vetor aposentado declara o substituto ativo correspondente", () => {
    const todosIds = new Set([...testPack.vectors.map((v) => v.id), ...testPack.retiredVectorIds]);
    const bruto = JSON.parse(readFileSync(CAMINHO_VETORES, "utf8")) as {
      vectors: { id: string; retired?: boolean; superseded_by?: string }[];
    };
    expect(bruto.vectors).toHaveLength(41);
    for (const vetor of bruto.vectors) {
      if (vetor.retired === true) {
        expect(vetor.superseded_by).toBeTruthy();
        expect(todosIds.has(vetor.superseded_by as string)).toBe(true);
      }
    }
  });

  it("cada vetor ativo é AUTOCONTIDO: entrada e desfecho presentes, sem baseline externo", () => {
    for (const vetor of testPack.vectors) {
      expect(vetor.input, vetor.id).not.toBeNull();
      expect(vetor.expected, vetor.id).not.toBeNull();
      expect(vetor.input?.evaluationTime).toBe(testPack.evaluationTime);
    }
  });

  it("todo dado é sintético (prefixo SYNTH- em toda proveniência de fonte)", () => {
    for (const vetor of testPack.vectors) {
      const fontes: string[] = [];
      for (const obs of vetor.input?.pao2 ?? []) fontes.push(obs.provenance.sourceSystem);
      for (const obs of vetor.input?.platelets ?? []) fontes.push(obs.provenance.sourceSystem);
      if (vetor.input?.gcsTotal) fontes.push(vetor.input.gcsTotal.provenance.sourceSystem);
      for (const agente of vetor.input?.vasoactiveAgents ?? []) {
        fontes.push(agente.provenance.sourceSystem);
      }
      for (const fonte of fontes) {
        expect(fonte.startsWith("SYNTH-"), `fonte sintética: ${fonte}`).toBe(true);
      }
    }
  });
});

describe("corpus executa VERDE contra o kernel real (rede de proteção E11)", () => {
  for (const vetor of testPack.vectors) {
    it(`${vetor.id} — ${vetor.description.slice(0, 100)}`, () => {
      const record = evaluateSofa(vetor.input as NonNullable<typeof vetor.input>);
      const esperado = vetor.expected as NonNullable<typeof vetor.expected>;

      expect(record.ruleId).toBe("RULE-SOFA");
      expect(record.ruleVersion).toBe("0.2.0");
      expect(record.status, "status agregado").toBe(esperado.status);
      expect(record.total, "total").toBe(esperado.total);
      expect(record.fires).toBe(false);
      expect(record.noFireReason).toBe(esperado.noFireReason);
      expect([...record.reasons].sort()).toEqual([...esperado.reasons].sort());

      for (const [componente, escore] of Object.entries(esperado.componentScores ?? {})) {
        const contribution = record.components.find(
          (c) => c.component === (componente as SofaComponentId),
        );
        expect(contribution?.score, `${vetor.id}: ${componente}`).toBe(escore);
      }
      for (const [componente, status] of Object.entries(esperado.componentStatuses ?? {})) {
        const contribution = record.components.find(
          (c) => c.component === (componente as SofaComponentId),
        );
        expect(contribution?.status, `${vetor.id}: status de ${componente}`).toBe(status);
      }
      for (const disclosure of esperado.annotationsContain ?? []) {
        expect(record.annotations, `${vetor.id}: ${disclosure}`).toContain(disclosure);
      }
    });
  }
});

describe("behaviorHash SOFA — a versão identifica COMPORTAMENTO (defeito SF-2)", () => {
  it("é estável: recomputar sobre o mesmo pacote dá o mesmo hash", () => {
    expect(computeSofaBehaviorHash(testPack.vectors)).toBe(manifesto.logic.behaviorHash);
    expect(computeSofaBehaviorHash(testPack.vectors)).toBe(
      computeSofaBehaviorHash(testPack.vectors),
    );
  });

  it("o motor em execução é verificado contra o hash assinado", () => {
    const resultado = verifySofaEngineBehavior(manifesto, testPack.vectors);
    expect(resultado.ok).toBe(true);
  });

  it("um motor que devolvesse OUTRO comportamento seria recusado", () => {
    // Simula deriva de comportamento alterando um único vetor do pacote: o
    // hash recomputado deixa de bater com o assinado.
    const primeiro = testPack.vectors[0];
    expect(primeiro).toBeDefined();
    if (primeiro === undefined || primeiro.input === null) {
      return;
    }

    const pacoteDerivado = [
      {
        ...primeiro,
        input: { ...primeiro.input, age: { kind: "verified", years: 17 } as const },
      },
      ...testPack.vectors.slice(1),
    ];

    const resultado = verifySofaEngineBehavior(manifesto, pacoteDerivado);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.actual).not.toBe(resultado.expected);
    }
  });
});

describe("manifesto do RULE-SOFA 0.2.0", () => {
  it("não tem defeito estrutural de esquema", () => {
    expect(validateManifest(manifesto)).toEqual([]);
  });

  it("é determinístico: mesma entrada, mesmos bytes, mesmo digest", () => {
    const outro = buildSofaBundleManifest({
      testPack: carregarTestPack(),
      authoredAt: INSTANTE_AUTORIA,
    });
    expect(contentDigest(outro)).toBe(contentDigest(manifesto));
  });

  it("carrega os doze campos do §6.4 preenchidos, não vazios", () => {
    expect(manifesto.identity.ruleId).toBe("RULE-SOFA");
    expect(manifesto.identity.ruleVersion).toBe("0.2.0");
    expect(manifesto.bundleId).toBe("RULE-SOFA@0.2.0");
    expect(manifesto.intendedUse.exclusions.length).toBeGreaterThan(0);
    expect(manifesto.evidence.issuerUrl).toContain("springer.com");
    expect(manifesto.accountability.independentBundleApproverRequired).toBe(true);
    expect(manifesto.logic.behaviorHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(manifesto.logic.publishedTriggers).toEqual([]);
    expect(manifesto.terminology.bindings.length).toBeGreaterThan(0);
    expect(manifesto.inputPolicy.length).toBeGreaterThan(0);
    expect(manifesto.testPack.vectorCount).toBe(38);
    expect(manifesto.safety.hazards).toContain("HAZ-0005");
    expect(manifesto.explainability.languageTags).toContain("pt-BR");
    expect(manifesto.validation.retrospective).toBe("not_started");
    expect(manifesto.operations.retirement.reviewDueAt).toBe("2027-09-19T09:00:00.000Z");
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

  it("não publica gatilho algum (a regra não define alerta; ΔSOFA fora do escopo)", () => {
    expect(manifesto.logic.publishedTriggers).toHaveLength(0);
    expect(manifesto.configurationEnvelope.fields).toHaveLength(0);
  });

  it("aperta a cadência de retirada (12 meses) com justificativa registrada", () => {
    expect(manifesto.operations.retirement.defaultCadenceMonths).toBe(24);
    expect(manifesto.operations.retirement.bundleCadenceMonths).toBe(12);
    expect(manifesto.operations.retirement.cadenceOverrideJustification).not.toBeNull();
  });

  it("não inventa limiar de monitoramento além do canário zero da própria spec", () => {
    for (const sinal of manifesto.operations.monitoring) {
      if (sinal.signalId === "m2_canario_zero_coercion") {
        // M-2: o limiar ZERO é fixado pela própria spec §9 (canário de
        // severidade 1) — não é invenção de engenharia.
        expect(sinal.threshold).toBe(0);
        continue;
      }
      if (sinal.signalId === "m5_replay_de_vetores") {
        // M-5: obrigação de replay sem limiar numérico — status próprio.
        expect(sinal.threshold).toBeNull();
        continue;
      }
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

describe("bundle assinável: fluxo completo sobre a terceira via real", () => {
  function assinarComChavesSinteticas() {
    const autor = generateEphemeralKeyPair("SYNTH-chave-autor-de-regra-sofa-01");
    const aprovador = generateEphemeralKeyPair("SYNTH-chave-aprovador-independente-sofa-02");
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

  it("verificação criptográfica passa sobre o bundle assinado (mecanismo)", () => {
    const { aprovado, keyring } = assinarComChavesSinteticas();
    const verificacao = verifyBundle(aprovado, keyring);
    expect(verificacao.ok).toBe(true);
  });

  it("mesmo ASSINADO, a ativação ACIONÁVEL é recusada — os bloqueios de prontidão permanecem", () => {
    const { aprovado, keyring } = assinarComChavesSinteticas();
    const livro = new RuleActivationLedger("RULE-SOFA", "dev", "SYNTH-unidade-01");
    livro.registerApprovedBundle(aprovado, keyring);

    const autorizacao = {
      authorizedBy: "SYNTH-autoridade-clinica-01",
      privacySecurityCoAuthorization: "SYNTH-co-autorizacao-01",
    };

    let mensagemRecusa = "";
    try {
      livro.activate({
        version: "0.2.0",
        mode: "actionable",
        occurredAt: "2026-09-19T10:00:00.000Z",
        reason: "tentativa de tornar a terceira via acionável",
        ...autorizacao,
      });
    } catch (erro) {
      mensagemRecusa = erro instanceof Error ? erro.message : String(erro);
    }
    // Fail-closed: a recusa NOMINEIA os bloqueios abertos.
    expect(mensagemRecusa).toContain("ativação ACIONÁVEL recusada (fail-closed)");
    expect(mensagemRecusa).toContain("sem_fonte_populada_evidenciada");
    expect(mensagemRecusa).toContain("portfolio_g2_nao_aprovado");
    expect(mensagemRecusa).toContain("test_pack_sem_autoria_independente");
    expect(mensagemRecusa).toContain("test_pack_draft");

    // Em modo SOMBRA, porém, o mecanismo permite avaliação não acionável.
    const evento = livro.activate({
      version: "0.2.0",
      mode: "shadow",
      occurredAt: "2026-09-19T10:00:00.000Z",
      reason: "avaliação shadow sintética, não acionante",
      ...autorizacao,
    });
    expect(evento.mode).toBe("shadow");
    const estado = livro.activeVersionAt("2026-09-19T10:00:00.000Z");
    expect(estado.kind === "active" && estado.mode).toBe("shadow");
  });

  it("os bloqueios de prontidão derivam dos campos REAIS do manifesto", () => {
    const bloqueios = assessActivationReadiness(manifesto).map((b) => b.code);
    expect(bloqueios).toContain("sem_fonte_populada_evidenciada");
    expect(bloqueios).toContain("portfolio_g2_nao_aprovado");
    expect(bloqueios).toContain("snapshot_de_terminologia_inexistente");
    expect(bloqueios).toContain("vinculos_de_terminologia_candidatos");
    expect(bloqueios).toContain("test_pack_sem_autoria_independente");
    expect(bloqueios).toContain("test_pack_draft");
    expect(bloqueios).toContain("validacao_retrospectiva_incompleta");
    expect(bloqueios).toContain("validacao_prospectiva_incompleta");
    expect(bloqueios).toContain("itens_de_vigilancia_de_diretriz_abertos");
    // Sem campo configurável, não há bloqueio de envelope.
    expect(bloqueios).not.toContain("envelope_de_configuracao_sem_piso");
  });
});
