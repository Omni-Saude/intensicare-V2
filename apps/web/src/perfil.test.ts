// @vitest-environment node
// Este arquivo não toca DOM em NENHUM módulo do seu grafo (verificado). Em
// jsdom ele custava a construção de um ambiente inteiro sem usá-lo — ver a
// nota "CUSTO DE AMBIENTE" em `apps/web/vitest.config.ts`.
/**
 * Testes da guarda de perfil. O caso central é o TESTE VERMELHO do despacho
 * ACH-07: "perfil não-dev com `?mock` ou token sintético ⇒ recusa
 * observável". Aqui a recusa é observada como exceção — não como um `if`
 * silencioso, nem como log.
 */
import { describe, expect, it } from "vitest";
import {
  type AmbienteBuild,
  ehPerfilDesenvolvimento,
  exigirPerfilDesenvolvimento,
  pedeClienteMock,
  pedeGaleriaDeEstados,
  perfilDe,
  RecusaDePerfilError,
} from "./perfil.js";

const DEV: AmbienteBuild = { DEV: true, PROD: false, MODE: "development" };
const PRODUCAO: AmbienteBuild = { DEV: false, PROD: true, MODE: "production" };
const AMBIGUO: AmbienteBuild = { DEV: true, PROD: true, MODE: "ambiguo" };
const VAZIO: AmbienteBuild = { DEV: false, PROD: false, MODE: "" };

describe("perfil de execução", () => {
  it("só é 'desenvolvimento' com DEV verdadeiro e PROD falso", () => {
    expect(perfilDe(DEV)).toBe("desenvolvimento");
    expect(perfilDe(PRODUCAO)).toBe("nao-desenvolvimento");
  });

  it("ambiente ambíguo ou vazio é tratado como NÃO-dev (fail-closed)", () => {
    expect(perfilDe(AMBIGUO)).toBe("nao-desenvolvimento");
    expect(perfilDe(VAZIO)).toBe("nao-desenvolvimento");
    expect(ehPerfilDesenvolvimento(AMBIGUO)).toBe(false);
    expect(ehPerfilDesenvolvimento(VAZIO)).toBe(false);
  });
});

describe("exigirPerfilDesenvolvimento — recusa observável", () => {
  it("em perfil dev, não lança", () => {
    expect(() => exigirPerfilDesenvolvimento("cliente mock (?mock)", DEV)).not.toThrow();
  });

  it("em perfil de produção, LANÇA RecusaDePerfilError para o cliente mock", () => {
    expect(() => exigirPerfilDesenvolvimento("cliente mock (?mock)", PRODUCAO)).toThrow(
      RecusaDePerfilError,
    );
  });

  it("em perfil de produção, LANÇA RecusaDePerfilError para a sessão sintética", () => {
    expect(() =>
      exigirPerfilDesenvolvimento("sessão sintética de desenvolvimento", PRODUCAO),
    ).toThrow(RecusaDePerfilError);
  });

  it("a mensagem nomeia o recurso e o modo do build, sem vazar segredo algum", () => {
    let capturado: RecusaDePerfilError | null = null;
    try {
      exigirPerfilDesenvolvimento("controle de demonstração", PRODUCAO);
    } catch (erro) {
      capturado = erro as RecusaDePerfilError;
    }
    expect(capturado).toBeInstanceOf(RecusaDePerfilError);
    expect(capturado?.recurso).toBe("controle de demonstração");
    expect(capturado?.modo).toBe("production");
    expect(capturado?.message).toMatch(/controle de demonstração/);
    expect(capturado?.message).toMatch(/production/);
    // Nenhum token, nem sequer o prefixo sintético, aparece na mensagem.
    expect(capturado?.message).not.toMatch(/SYNTH/);
    expect(capturado?.message).not.toMatch(/Bearer/i);
  });

  it("nunca degrada silenciosamente: não existe retorno booleano de 'permitido'", () => {
    // A assinatura devolve void — a única saída negativa é a exceção.
    const resultado = exigirPerfilDesenvolvimento("recurso qualquer", DEV);
    expect(resultado).toBeUndefined();
  });
});

describe("leitura da URL (pura, sem window)", () => {
  it("reconhece ?mock em qualquer posição da busca", () => {
    expect(pedeClienteMock("?mock")).toBe(true);
    expect(pedeClienteMock("?leito=1&mock")).toBe(true);
    expect(pedeClienteMock("?mock=1")).toBe(true);
    expect(pedeClienteMock("")).toBe(false);
    expect(pedeClienteMock("?leito=1")).toBe(false);
  });

  it("reconhece ?estados para a galeria de estados", () => {
    expect(pedeGaleriaDeEstados("?estados")).toBe(true);
    expect(pedeGaleriaDeEstados("?outro")).toBe(false);
  });
});
