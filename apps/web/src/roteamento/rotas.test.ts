/**
 * apps/web/src/roteamento/rotas.test.ts
 *
 * A gramática de rotas, incluindo a parte que é regra de SEGURANÇA e não de
 * conveniência: a URL desta fatia carrega LEITO, e nada mais (anti-padrão 12 do
 * contrato comum — nunca bearer, PSR, tenant ou identificador de sujeito em
 * query string/caminho).
 */
import { describe, expect, it } from "vitest";
import {
  analisarCaminho,
  caminhoDaRota,
  caminhoDoLeito,
  ehIdentificadorDeLeitoAceitavelNaUrl,
} from "./rotas.js";

describe("analisarCaminho — total, e nunca redireciona em silêncio", () => {
  it("a raiz é a grade de leitos", () => {
    expect(analisarCaminho("/")).toEqual({ tipo: "grade" });
    expect(analisarCaminho("")).toEqual({ tipo: "grade" });
    expect(analisarCaminho("/?mock")).toEqual({ tipo: "grade" });
  });

  it("`/leitos/:id` é o detalhe, e a query string não interfere", () => {
    expect(analisarCaminho("/leitos/SYNTH-LEITO-01")).toEqual({
      tipo: "detalhe",
      leitoId: "SYNTH-LEITO-01",
    });
    expect(analisarCaminho("/leitos/SYNTH-LEITO-01?mock")).toEqual({
      tipo: "detalhe",
      leitoId: "SYNTH-LEITO-01",
    });
    expect(analisarCaminho("/leitos/SYNTH-LEITO-01#alertas")).toEqual({
      tipo: "detalhe",
      leitoId: "SYNTH-LEITO-01",
    });
  });

  it("caminho não reconhecido vira ESTADO `desconhecida` preservando o caminho", () => {
    // Preservar o caminho é o que permite a tela dizer QUAL endereço falhou.
    // Devolver `grade` aqui seria o redirecionamento silencioso que apaga o
    // erro da barra de endereço.
    for (const caminho of ["/leitos", "/leitos/A/B", "/paciente/1", "/qualquer"]) {
      expect(analisarCaminho(caminho)).toEqual({ tipo: "desconhecida", caminho });
    }
  });

  it("percent-encoding inválido não derruba a tela: vira `desconhecida`", () => {
    expect(analisarCaminho("/leitos/%E0%A4%A")).toEqual({
      tipo: "desconhecida",
      caminho: "/leitos/%E0%A4%A",
    });
  });
});

describe("a URL carrega leito — nunca sujeito, PSR, tenant ou credencial (§6.12)", () => {
  it("referência PSR na posição do leito é RECUSADA", () => {
    // `amh:psr:v1:SYNTH-P001` é referência de SUJEITO. Ela não pode virar
    // endereço navegável, nem codificada.
    const psr = "amh:psr:v1:SYNTH-P001";
    expect(ehIdentificadorDeLeitoAceitavelNaUrl(psr)).toBe(false);
    expect(analisarCaminho(`/leitos/${encodeURIComponent(psr)}`).tipo).toBe("desconhecida");
    expect(analisarCaminho("/leitos/amh:psr:v1:SYNTH-P001").tipo).toBe("desconhecida");
  });

  it("credencial colada na barra de endereço é RECUSADA (teto de comprimento)", () => {
    const bearerish = `${"e".repeat(40)}.${"y".repeat(60)}.${"s".repeat(43)}`;
    expect(bearerish.length).toBeGreaterThan(64);
    expect(ehIdentificadorDeLeitoAceitavelNaUrl(bearerish)).toBe(false);
    expect(analisarCaminho(`/leitos/${bearerish}`).tipo).toBe("desconhecida");
  });

  it("separador contrabandeado por codificação não vira estrutura de caminho", () => {
    // `%2F` decodifica para `/`. Se o analisador aceitasse, `SYNTH/../x` viraria
    // travessia de caminho; a lista de permissão o recusa como identificador.
    expect(analisarCaminho("/leitos/SYNTH%2F..%2Fx").tipo).toBe("desconhecida");
    expect(analisarCaminho("/leitos/nao%40exemplo.org").tipo).toBe("desconhecida");
    expect(analisarCaminho("/leitos/a%00b").tipo).toBe("desconhecida");
  });

  it("a lista de permissão aceita AS DUAS formas de identificador que esta fatia produz", () => {
    // As duas fontes discordam, e o contrato não impõe padrão: o dublê de
    // desenvolvimento usa "Leito 01" e as fixtures da API usam
    // "<unidade>-LEITO-01". Uma lista que só aceitasse a segunda tornaria todo
    // clique do caminho `?mock` um "endereço não reconhecido".
    for (const id of ["SYNTH-LEITO-01", "Leito 01", "SYNTH-G7-UNIT-LEITO-01", "UTI_2.A", "A1"]) {
      expect(ehIdentificadorDeLeitoAceitavelNaUrl(id), id).toBe(true);
    }
    expect(analisarCaminho("/leitos/Leito%2001")).toEqual({ tipo: "detalhe", leitoId: "Leito 01" });
  });
});

describe("ida e volta — construir e analisar concordam", () => {
  it("`analisarCaminho(caminhoDoLeito(id))` devolve o MESMO id quando endereçável", () => {
    for (const id of ["SYNTH-LEITO-01", "Leito 01", "UTI_2.A", "A1"]) {
      expect(analisarCaminho(caminhoDoLeito(id))).toEqual({ tipo: "detalhe", leitoId: id });
    }
  });

  it("id não endereçável produz caminho que o analisador RECUSA — estado explícito, não crash", () => {
    // A alternativa (lançar no clique) derrubaria a grade inteira; a outra
    // (não navegar) faria o clique não fazer nada. Aqui o percurso termina em
    // "Endereço não reconhecido", com a URL visível.
    const caminho = caminhoDoLeito("amh:psr:v1:SYNTH-P001");
    expect(analisarCaminho(caminho).tipo).toBe("desconhecida");
  });

  it("`caminhoDaRota` é a inversa para as rotas endereçáveis", () => {
    expect(caminhoDaRota({ tipo: "grade" })).toBe("/");
    expect(caminhoDaRota({ tipo: "detalhe", leitoId: "SYNTH-LEITO-01" })).toBe(
      "/leitos/SYNTH-LEITO-01",
    );
    // `desconhecida` devolve o caminho original — serializar para "/" seria o
    // redirecionamento silencioso, por outro caminho.
    expect(caminhoDaRota({ tipo: "desconhecida", caminho: "/qualquer" })).toBe("/qualquer");
  });
});
