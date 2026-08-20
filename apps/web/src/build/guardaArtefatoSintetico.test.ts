// @vitest-environment node
// Este arquivo não toca DOM em NENHUM módulo do seu grafo (verificado). Em
// jsdom ele custava a construção de um ambiente inteiro sem usá-lo — ver a
// nota "CUSTO DE AMBIENTE" em `apps/web/vitest.config.ts`.
/**
 * Testes da guarda de bundle. Ela é PURA de propósito: a lógica que decide o
 * que reprova um build de produção precisa ser exercitável sem rodar um build.
 */
import { describe, expect, it } from "vitest";
import {
  formatarViolacoes,
  MARCADORES_PROIBIDOS,
  verificarArtefatosSinteticos,
} from "./guardaArtefatoSintetico.js";

describe("verificarArtefatosSinteticos", () => {
  it("aprova um bundle limpo", () => {
    const violacoes = verificarArtefatosSinteticos({
      "assets/indice-abc.js": "const a=1;export{a};",
    });
    expect(violacoes).toEqual([]);
  });

  it("reprova o token sintético", () => {
    const violacoes = verificarArtefatosSinteticos({
      "assets/indice-abc.js": 'const t="SYNTH-TOKEN.SYNTH-TENANT-G7.SYNTH-PROFISSIONAL-WEB";',
    });
    expect(violacoes.length).toBeGreaterThan(0);
    expect(violacoes.map((v) => v.marcador.literal)).toContain("SYNTH-TOKEN.");
  });

  it("reprova o cliente mock e o controle de demonstração", () => {
    const violacoes = verificarArtefatosSinteticos({
      "assets/a.js": "function criarClienteMock(){}",
      "assets/b.js": '"Modo de demonstração (apenas front-end sintético)"',
    });
    expect(violacoes.map((v) => v.arquivo).sort()).toEqual(["assets/a.js", "assets/b.js"]);
  });

  it("PERMITE a divulgação obrigatória 'dados 100% sintéticos (SYNTH)' (HAZ-0046)", () => {
    // Esta é a asserção que impede a guarda de virar pressão para remover o
    // banner de contexto — o rótulo de segurança clínica precisa sobreviver.
    const violacoes = verificarArtefatosSinteticos({
      "assets/indice.js":
        '"CONSULTIVO — dados 100% sintéticos (SYNTH); não é produção. Registro limitado a esta instituição"',
    });
    expect(violacoes).toEqual([]);
  });

  it("relata TODAS as violações, não apenas a primeira", () => {
    const violacoes = verificarArtefatosSinteticos({
      "assets/tudo.js": "SYNTH-TOKEN.x SYNTH-TENANT-G7 criarClienteMock",
    });
    expect(violacoes.length).toBe(3);
  });

  it("cada marcador declara nome e razão (a mensagem de build precisa ser acionável)", () => {
    for (const marcador of MARCADORES_PROIBIDOS) {
      expect(marcador.nome.length).toBeGreaterThan(0);
      expect(marcador.razao.length).toBeGreaterThan(0);
      expect(marcador.literal.length).toBeGreaterThan(0);
    }
  });

  it("a mensagem formatada nomeia arquivo, literal e razão", () => {
    const violacoes = verificarArtefatosSinteticos({
      "assets/x.js": "SYNTH-TOKEN.abc",
    });
    const mensagem = formatarViolacoes(violacoes);
    expect(mensagem).toMatch(/assets\/x\.js/);
    expect(mensagem).toMatch(/SYNTH-TOKEN\./);
    expect(mensagem).toMatch(/build interrompido/);
  });
});
