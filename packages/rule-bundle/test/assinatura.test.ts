/**
 * Assinatura, contra-assinatura, detecção de adulteração e recusa de
 * autoaprovação — ADR-0007 eixos 2 e 3.
 *
 * Todas as chaves aqui são EFÊMERAS e SINTÉTICAS, geradas em memória a cada
 * execução. Nenhuma chave privada existe no repositório e nenhuma
 * assinatura produzida aqui é evidência de aprovação de coisa alguma:
 * a condição C1 da ADR-0007 (segundo revisor clínico qualificado) segue
 * ABERTA, e a custódia de chave real é a cláusula adiada à ADR-0022 (C5).
 */

import { describe, expect, it } from "vitest";
import {
  type ApprovedBundle,
  type ApproverSigningKey,
  buildKeyring,
  contentDigest,
  createDraft,
  generateEphemeralKeyPair,
  type RuleBundleManifest,
  reviseAsNewVersion,
  signAsApprover,
  signAsAuthor,
  validateManifest,
  verifyBundle,
} from "../src/index.js";
import { APROVACAO_EXEMPLO, manifestoExemplo } from "./fixtures.js";

const INSTANTE_ASSINATURA = "2026-08-16T09:30:00.000Z";

function cenario() {
  const autor = generateEphemeralKeyPair("SYNTH-chave-autor-01");
  const aprovador = generateEphemeralKeyPair("SYNTH-chave-aprovador-02");
  const keyring = buildKeyring([autor.verificationKey, aprovador.verificationKey]);

  const rascunho = createDraft(manifestoExemplo());
  const autorado = signAsAuthor(rascunho, autor.signingKey, INSTANTE_ASSINATURA);
  const aprovado = signAsApprover(autorado, aprovador.signingKey, APROVACAO_EXEMPLO);

  return { autor, aprovador, keyring, rascunho, autorado, aprovado };
}

describe("ciclo assinatura → contra-assinatura → verificação", () => {
  it("um bundle íntegro verifica, com as duas identidades distintas", () => {
    const { aprovado, keyring } = cenario();
    const resultado = verifyBundle(aprovado, keyring);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.authorKeyId).toBe("SYNTH-chave-autor-01");
      expect(resultado.approverKeyId).toBe("SYNTH-chave-aprovador-02");
      expect(resultado.manifestDigest).toBe(aprovado.manifestDigest);
    }
  });

  it("as duas assinaturas cobrem o MESMO digest de conteúdo (ADR-0007 §4.2)", () => {
    const { aprovado } = cenario();
    expect(aprovado.approval.manifestDigest).toBe(aprovado.manifestDigest);
    expect(contentDigest(aprovado.manifest)).toBe(aprovado.manifestDigest);
  });

  it("Ed25519 é determinístico: assinar o mesmo conteúdo duas vezes dá os mesmos bytes", () => {
    const autor = generateEphemeralKeyPair("SYNTH-chave-autor-01");
    const rascunho = createDraft(manifestoExemplo());

    const primeira = signAsAuthor(rascunho, autor.signingKey, INSTANTE_ASSINATURA);
    const segunda = signAsAuthor(rascunho, autor.signingKey, INSTANTE_ASSINATURA);

    expect(segunda.authorSignature.signatureBase64).toBe(primeira.authorSignature.signatureBase64);
  });

  it("ECDSA P-256 também é suportado (agilidade de algoritmo, D9)", () => {
    const autor = generateEphemeralKeyPair("SYNTH-chave-autor-ec", "ecdsa-p256-sha256");
    const aprovador = generateEphemeralKeyPair("SYNTH-chave-aprovador-ec", "ecdsa-p256-sha256");
    const keyring = buildKeyring([autor.verificationKey, aprovador.verificationKey]);

    const autorado = signAsAuthor(
      createDraft(manifestoExemplo()),
      autor.signingKey,
      INSTANTE_ASSINATURA,
    );
    const aprovado = signAsApprover(autorado, aprovador.signingKey, APROVACAO_EXEMPLO);

    expect(verifyBundle(aprovado, keyring).ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Detecção de adulteração, CAMPO A CAMPO
// ---------------------------------------------------------------------------

interface Folha {
  readonly caminho: readonly (string | number)[];
  readonly rotulo: string;
  readonly valor: unknown;
}

/** Coleta toda folha (primitivo, `null` ou array/objeto vazio) do manifesto. */
function coletarFolhas(valor: unknown, caminho: readonly (string | number)[] = []): Folha[] {
  const rotulo = caminho.length === 0 ? "<raiz>" : caminho.join(".");

  if (Array.isArray(valor)) {
    if (valor.length === 0) {
      return [{ caminho, rotulo, valor }];
    }
    return valor.flatMap((item, indice) => coletarFolhas(item, [...caminho, indice]));
  }

  if (typeof valor === "object" && valor !== null) {
    const entradas = Object.entries(valor as Record<string, unknown>);
    if (entradas.length === 0) {
      return [{ caminho, rotulo, valor }];
    }
    return entradas.flatMap(([chave, item]) => coletarFolhas(item, [...caminho, chave]));
  }

  return [{ caminho, rotulo, valor }];
}

/** Adultera uma folha em uma CÓPIA do manifesto. */
function adulterar(manifesto: RuleBundleManifest, folha: Folha): RuleBundleManifest {
  const copia = structuredClone(manifesto) as unknown as Record<string, unknown>;

  let alvo: Record<string, unknown> | unknown[] = copia;
  for (const passo of folha.caminho.slice(0, -1)) {
    alvo = (alvo as Record<string | number, unknown>)[passo] as Record<string, unknown> | unknown[];
  }

  const ultimo = folha.caminho.at(-1);
  const atual = folha.valor;

  let novo: unknown;
  if (Array.isArray(atual)) {
    novo = ["SYNTH-item-injetado"];
  } else if (typeof atual === "object" && atual !== null) {
    novo = { injetado: true };
  } else if (typeof atual === "string") {
    novo = `${atual}#adulterado`;
  } else if (typeof atual === "number") {
    novo = atual + 1;
  } else if (typeof atual === "boolean") {
    novo = !atual;
  } else {
    novo = "SYNTH-valor-injetado-no-lugar-de-null";
  }

  if (ultimo === undefined) {
    throw new Error("folha na raiz não é adulterável neste teste");
  }
  (alvo as Record<string | number, unknown>)[ultimo] = novo;

  return copia as unknown as RuleBundleManifest;
}

describe("detecção de adulteração — campo a campo, sem exceção", () => {
  const { aprovado, keyring } = cenario();
  const folhas = coletarFolhas(aprovado.manifest);

  it("o manifesto de fixture tem folhas suficientes para o teste ser significativo", () => {
    expect(folhas.length).toBeGreaterThan(60);
  });

  it.each(folhas)("adulterar `$rotulo` derruba a verificação", (folha: Folha) => {
    const adulterado: ApprovedBundle = {
      ...aprovado,
      manifest: adulterar(aprovado.manifest, folha),
    };

    const resultado = verifyBundle(adulterado, keyring);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      const codigos = resultado.failures.map((falha) => falha.code);
      expect(codigos).toContain("manifest_digest_mismatch");
    }
  });

  it("adulterar o registro de APROVAÇÃO também derruba", () => {
    const { aprovado: base, keyring: chaves } = cenario();
    const adulterado: ApprovedBundle = {
      ...base,
      approval: { ...base.approval, reviewStatement: "aprovado sem ressalvas" },
    };

    const resultado = verifyBundle(adulterado, chaves);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.failures.map((f) => f.code)).toContain("approval_digest_mismatch");
    }
  });

  it("apagar uma condição pendente da aprovação é adulteração, não 'limpeza'", () => {
    const { aprovado: base, keyring: chaves } = cenario();
    const adulterado: ApprovedBundle = {
      ...base,
      approval: { ...base.approval, outstandingConditions: [] },
    };

    expect(verifyBundle(adulterado, chaves).ok).toBe(false);
  });

  it("trocar a assinatura do autor pela do aprovador não passa (papel vai assinado)", () => {
    const { aprovado: base, keyring: chaves } = cenario();
    const adulterado = {
      ...base,
      authorSignature: {
        ...base.authorSignature,
        signatureBase64: base.approvalSignature.signatureBase64,
      },
    } as ApprovedBundle;

    const resultado = verifyBundle(adulterado, chaves);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.failures.map((f) => f.code)).toContain("author_signature_invalid");
    }
  });

  it("chave fora do keyring confiável nunca vale", () => {
    const { aprovado: base, autor } = cenario();
    const somenteAutor = buildKeyring([autor.verificationKey]);

    const resultado = verifyBundle(base, somenteAutor);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.failures.map((f) => f.code)).toContain("unknown_approver_key");
    }
  });

  it("algoritmo declarado diferente do algoritmo da chave é recusado", () => {
    const { aprovado: base, keyring: chaves } = cenario();
    const adulterado = {
      ...base,
      authorSignature: { ...base.authorSignature, algorithm: "ecdsa-p256-sha256" as const },
    } as ApprovedBundle;

    const resultado = verifyBundle(adulterado, chaves);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.failures.map((f) => f.code)).toContain("author_algorithm_mismatch");
    }
  });
});

// ---------------------------------------------------------------------------
// Autor ≠ aprovador (ADR-0007 A7-1) — princípio permanente, sem exceção
// ---------------------------------------------------------------------------

describe("recusa de autoaprovação", () => {
  it("o TIPO impede autoaprovação: o programa nem compila", () => {
    const autor = generateEphemeralKeyPair("SYNTH-chave-autor-01");
    const autorado = signAsAuthor(
      createDraft(manifestoExemplo()),
      autor.signingKey,
      INSTANTE_ASSINATURA,
    );

    expect(() =>
      // @ts-expect-error ADR-0007 A7-1: `SigningKey<"SYNTH-chave-autor-01">` não carrega a
      // marca `SelfApprovalForbidden` exigida quando o aprovador é o próprio autor.
      // Esta diretiva é, ela mesma, a asserção: se o portão de tipo sumir, `tsc` passa a
      // reclamar de diretiva não usada e o typecheck falha.
      signAsApprover(autorado, autor.signingKey, APROVACAO_EXEMPLO),
    ).toThrow(/autor e aprovador são a mesma identidade/);
  });

  it("o RUNTIME impede autoaprovação mesmo com o compilador contornado", () => {
    const autor = generateEphemeralKeyPair("SYNTH-chave-autor-01");
    const autorado = signAsAuthor(
      createDraft(manifestoExemplo()),
      autor.signingKey,
      INSTANTE_ASSINATURA,
    );

    // Simula exatamente o que um `as` descuidado, ou JavaScript puro sem
    // tipos, faria: apresentar a chave do autor no lugar do aprovador.
    const contornado = autor.signingKey as unknown as ApproverSigningKey<string, never>;

    expect(() => signAsApprover(autorado, contornado, APROVACAO_EXEMPLO)).toThrow(
      /princípio permanente, sem processo de exceção/,
    );
  });

  it("um artefato forjado com autor = aprovador é recusado na verificação", () => {
    const { aprovado: base, keyring: chaves } = cenario();

    const forjado = {
      ...base,
      approval: { ...base.approval, approverKeyId: base.authorSignature.keyId },
      approvalSignature: { ...base.approvalSignature, keyId: base.authorSignature.keyId },
    } as ApprovedBundle;

    const resultado = verifyBundle(forjado, chaves);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.failures.map((f) => f.code)).toContain("author_equals_approver");
    }
  });

  it("duas chaves distintas com a MESMA identidade não são duas identidades", () => {
    const primeira = generateEphemeralKeyPair("SYNTH-chave-duplicada");
    const segunda = generateEphemeralKeyPair("SYNTH-chave-duplicada");

    expect(() => buildKeyring([primeira.verificationKey, segunda.verificationKey])).toThrow(
      /identidade duplicada/,
    );
  });
});

describe("revisão material: quem edita vira AUTOR (ADR-0007 §4.3)", () => {
  it("editar conteúdo sob a MESMA versão é recusado — imutabilidade", () => {
    const { autorado } = cenario();
    expect(() => reviseAsNewVersion(autorado, manifestoExemplo())).toThrow(
      /conteúdo imutável não pode ser editado sob a MESMA versão/,
    );
  });

  it("o aprovador que revisa perde o direito de aprovar a versão resultante", () => {
    const { autorado, aprovador } = cenario();

    // O aprovador edita materialmente o conteúdo: nasce uma NOVA versão.
    const base = manifestoExemplo();
    const revisado = reviseAsNewVersion(autorado, {
      ...base,
      bundleId: "RULE-SYNTH-EXEMPLO@1.1.0",
      identity: { ...base.identity, ruleVersion: "1.1.0" },
    });

    expect(revisado.phase).toBe("draft");
    expect(revisado.revisionOf).toBe(autorado.manifestDigest);

    // Ao assinar a versão revisada, ele É o autor dela.
    const revisadoAutorado = signAsAuthor(revisado, aprovador.signingKey, INSTANTE_ASSINATURA);
    expect(revisadoAutorado.authorSignature.keyId).toBe("SYNTH-chave-aprovador-02");

    // E, por isso, não pode aprová-la — mesmo portão, sem mecanismo extra.
    expect(() =>
      // @ts-expect-error ADR-0007 §4.3: reclassificação editor→autor, codificada no tipo.
      signAsApprover(revisadoAutorado, aprovador.signingKey, APROVACAO_EXEMPLO),
    ).toThrow(/autor e aprovador são a mesma identidade/);
  });
});

describe("portão de esquema do manifesto (ADR-0007 §9 V7)", () => {
  it("o manifesto de fixture não tem defeito estrutural", () => {
    expect(validateManifest(manifestoExemplo())).toEqual([]);
  });

  it("cadência de retirada acima do teto de 24 meses (A7-3) é defeito", () => {
    const base = manifestoExemplo();
    const defeitos = validateManifest({
      ...base,
      operations: {
        ...base.operations,
        retirement: { ...base.operations.retirement, bundleCadenceMonths: 36 },
      },
    });
    expect(defeitos.map((d) => d.code)).toContain("cadencia_afrouxada");
  });

  it("apertar a cadência sem justificativa registrada é defeito (A7-3)", () => {
    const base = manifestoExemplo();
    const defeitos = validateManifest({
      ...base,
      operations: {
        ...base.operations,
        retirement: { ...base.operations.retirement, bundleCadenceMonths: 12 },
      },
    });
    expect(defeitos.map((d) => d.code)).toContain("override_de_cadencia_sem_justificativa");
  });

  it("variante da edição canônica sem divergência declarada é defeito (ADR-0025 §5.2)", () => {
    const base = manifestoExemplo();
    const defeitos = validateManifest({
      ...base,
      identity: { ...base.identity, isVariantOfCanonicalEdition: true },
    });
    expect(defeitos.map((d) => d.code)).toContain("variante_nao_declarada");
  });

  it("bundleId incoerente com a identidade é defeito", () => {
    const base = manifestoExemplo();
    const defeitos = validateManifest({ ...base, bundleId: "OUTRA-COISA@9.9.9" });
    expect(defeitos.map((d) => d.code)).toContain("bundle_id_incoerente");
  });

  it("test pack vazio é defeito — sem vetores não há comportamento pinado", () => {
    const base = manifestoExemplo();
    const defeitos = validateManifest({
      ...base,
      testPack: { ...base.testPack, vectors: [], vectorCount: 0 },
    });
    expect(defeitos.map((d) => d.code)).toContain("test_pack_vazio");
  });
});
