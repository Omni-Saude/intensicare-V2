/**
 * Serialização canônica — a base sem a qual a assinatura não vale nada.
 *
 * A própria ADR-0007 §4.1 registra que a determinicidade da serialização
 * "pode falhar sutilmente (ordem de chaves, espaços em branco) e precisa de
 * teste dedicado". Este é esse teste.
 */

import { describe, expect, it } from "vitest";
import { canonicalBytes, canonicalize, contentDigest, matchesDigest } from "../src/index.js";

describe("serialização canônica — determinismo", () => {
  it("ordem de escrita das chaves não muda os bytes", () => {
    const a = { zeta: 1, alfa: 2, meio: { y: true, x: null } };
    const b = { meio: { x: null, y: true }, alfa: 2, zeta: 1 };

    expect(canonicalize(a)).toBe(canonicalize(b));
    expect(contentDigest(a)).toBe(contentDigest(b));
  });

  it("chaves saem em ordem crescente de unidade de código UTF-16", () => {
    expect(canonicalize({ b: 1, A: 2, a: 3, B: 4 })).toBe('{"A":2,"B":4,"a":3,"b":1}');
  });

  it("ordem de ARRAY é significativa e preservada", () => {
    expect(canonicalize([1, 2, 3])).not.toBe(canonicalize([3, 2, 1]));
    expect(canonicalize([1, 2, 3])).toBe("[1,2,3]");
  });

  it("propriedade `undefined` é omitida de forma determinística", () => {
    expect(canonicalize({ a: 1, b: undefined })).toBe('{"a":1}');
    expect(contentDigest({ a: 1, b: undefined })).toBe(contentDigest({ a: 1 }));
  });

  it("`null` NÃO é o mesmo que ausente — nunca colapsam", () => {
    expect(canonicalize({ a: 1, b: null })).not.toBe(canonicalize({ a: 1 }));
  });

  it("mil execuções produzem exatamente os mesmos bytes", () => {
    const valor = { lista: [1, "dois", null, { tres: true }], texto: "sem total computavel" };
    const primeiro = canonicalize(valor);
    for (let i = 0; i < 1000; i++) {
      expect(canonicalize(valor)).toBe(primeiro);
    }
  });
});

describe("serialização canônica — normalização Unicode (pt-BR)", () => {
  // Escapes explícitos, de propósito: o MESMO texto pt-BR escrito com
  // caracteres pré-compostos (NFC) e decompostos (NFD) tem bytes UTF-8
  // DIFERENTES. Sem normalização, "avaliação" vindo de dois teclados
  // assinaria dois digests distintos para conteúdo idêntico — e ninguém
  // descobriria isso lendo o texto na tela, porque ele parece o mesmo.
  const TEXTO_NFC = "avalia\u00e7\u00e3o";
  const TEXTO_NFD = "avaliac\u0327a\u0303o";
  const CHAVE_NFC = "a\u00e7\u00e3o";
  const CHAVE_NFD = "ac\u0327a\u0303o";

  it("NFC e NFD do mesmo texto produzem os MESMOS bytes", () => {
    expect(TEXTO_NFC).not.toBe(TEXTO_NFD);
    expect(TEXTO_NFC.normalize("NFD")).toBe(TEXTO_NFD);

    expect(canonicalize({ t: TEXTO_NFC })).toBe(canonicalize({ t: TEXTO_NFD }));
    expect(contentDigest({ t: TEXTO_NFC })).toBe(contentDigest({ t: TEXTO_NFD }));
  });

  it("nomes de chave também são normalizados", () => {
    expect(canonicalize({ [CHAVE_NFC]: 1 })).toBe(canonicalize({ [CHAVE_NFD]: 1 }));
  });

  it("colisão de chaves após NFC é ERRO, nunca desempate arbitrário", () => {
    expect(() => canonicalize({ [CHAVE_NFC]: 1, [CHAVE_NFD]: 2 })).toThrow(
      /colidem após normalização NFC/,
    );
  });
});

describe("serialização canônica — o que é recusado (fail-closed)", () => {
  it("NaN e Infinity", () => {
    expect(() => canonicalize({ x: Number.NaN })).toThrow(/não finito/);
    expect(() => canonicalize({ x: Number.POSITIVE_INFINITY })).toThrow(/não finito/);
  });

  it("`undefined` dentro de array", () => {
    expect(() => canonicalize([1, undefined, 3])).toThrow(/dentro de array é ambíguo/);
  });

  it("Date, Map, Set e instância de classe — sem coerção silenciosa", () => {
    expect(() => canonicalize({ d: new Date(0) })).toThrow(/tipo não suportado/);
    expect(() => canonicalize({ m: new Map() })).toThrow(/tipo não suportado/);
    expect(() => canonicalize({ s: new Set() })).toThrow(/tipo não suportado/);

    class Coisa {
      valor = 1;
    }
    expect(() => canonicalize({ c: new Coisa() })).toThrow(/tipo não suportado/);
  });

  it("bigint, função e símbolo", () => {
    expect(() => canonicalize({ b: 1n })).toThrow(/bigint/);
    expect(() => canonicalize({ f: () => 1 })).toThrow(/function/);
    expect(() => canonicalize({ s: Symbol("x") })).toThrow(/symbol/);
  });

  it("a mensagem de erro aponta o caminho do defeito", () => {
    expect(() => canonicalize({ a: { b: [{ c: Number.NaN }] } })).toThrow(
      /caminho: \.a\.b\[0\]\.c/,
    );
  });

  it("`-0` é normalizado para `0`", () => {
    expect(canonicalize({ x: -0 })).toBe('{"x":0}');
    expect(contentDigest({ x: -0 })).toBe(contentDigest({ x: 0 }));
  });
});

describe("digest de conteúdo", () => {
  it("declara o algoritmo no próprio valor", () => {
    expect(contentDigest({ a: 1 })).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("qualquer diferença de conteúdo muda o digest", () => {
    expect(contentDigest({ a: 1 })).not.toBe(contentDigest({ a: 2 }));
    expect(contentDigest({ a: 1 })).not.toBe(contentDigest({ a: "1" }));
    expect(contentDigest([1])).not.toBe(contentDigest({ 0: 1 }));
  });

  it("`matchesDigest` confirma o próprio digest e recusa o alheio", () => {
    const valor = { regra: "SYNTH-EXEMPLO", versao: "1.0.0" };
    expect(matchesDigest(valor, contentDigest(valor))).toBe(true);
    expect(matchesDigest(valor, contentDigest({ ...valor, versao: "1.0.1" }))).toBe(false);
  });

  it("os bytes assinados são UTF-8 da forma canônica", () => {
    const bytes = canonicalBytes({ t: "\u00e7" });
    expect(new TextDecoder().decode(bytes)).toBe('{"t":"\u00e7"}');
  });
});
