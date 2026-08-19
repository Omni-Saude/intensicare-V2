/**
 * apps/web/src/eventos/porta.test.ts
 *
 * DOIS TESTES CIRCULARES FORAM APAGADOS AQUI, E ISTO É O REGISTRO DE POR QUÊ.
 *
 * Enquanto `./porta.ts` mantinha cópias literais das rotas, dois casos
 * afirmavam que cada cópia aparecia dentro de `CONTRATO_CLIENTE_EVENTOS` — uma
 * defesa real contra deriva entre duas fontes independentes. O contrato passou
 * a EXPORTAR `CAMINHO_TICKET_EVENTOS`/`CAMINHO_FLUXO_EVENTOS` e a montar
 * `CONTRATO_CLIENTE_EVENTOS` a partir dessas mesmas constantes
 * (`packages/contratos/src/asyncapi.ts`). Com a cópia local apagada, aqueles
 * dois casos passariam a comparar a constante do contrato com o texto que o
 * contrato gera a partir dela: verdadeiros por construção, incapazes de
 * falhar, e ainda assim verdes no relatório. Este repositório acabou de fechar
 * três testes circulares; manter estes seria criar o quarto.
 *
 * O QUE SOBROU TEM CONTEÚDO. A deriva possível deixou de ser "duas constantes
 * discordam" e passou a ser "a função de montagem de URL ignora a constante do
 * contrato" ou "a URL carrega algo além do cursor". As duas são falseáveis, e
 * são o que este arquivo verifica agora.
 *
 * Rastreio: ADR-0011 P4/P6, contrato comum §10-12 (credencial jamais em query
 * string), anti-padrão 15 (otimizar contagem de teste).
 */
import {
  CAMINHO_FLUXO_EVENTOS,
  CAMINHO_TICKET_EVENTOS,
  ESTADOS_CONEXAO,
} from "@intensicare/contratos";
import { describe, expect, it } from "vitest";
import { CONECTIVIDADE_POR_ESTADO_CONEXAO, montarUrlDoFluxo, PARAMETRO_CURSOR } from "./porta.js";

describe("a URL do fluxo é montada a partir do caminho do CONTRATO", () => {
  it("sem cursor e sem prefixo, a URL é exatamente o caminho publicado", () => {
    // Falseável: se alguém reintroduzir um literal local divergente em
    // `montarUrlDoFluxo`, este caso quebra.
    expect(montarUrlDoFluxo(null)).toBe(CAMINHO_FLUXO_EVENTOS);
  });

  it("o prefixo de implantação entra ANTES do caminho, nunca dentro da query", () => {
    expect(montarUrlDoFluxo(7, "https://exemplo.invalid")).toBe(
      `https://exemplo.invalid${CAMINHO_FLUXO_EVENTOS}?${PARAMETRO_CURSOR}=7`,
    );
  });

  it("o cursor é o ÚNICO parâmetro que a URL pode carregar (§6.12)", () => {
    // O gateway RECUSA com 400 qualquer parâmetro de credencial, tenant ou
    // sujeito. Esta é a contraparte do cliente: nada além do cursor é montado
    // aqui, para nenhum valor de entrada.
    for (const cursor of [0, 1, 42, 2 ** 31]) {
      const url = new URL(montarUrlDoFluxo(cursor, "https://exemplo.invalid"));
      expect([...url.searchParams.keys()], `cursor ${cursor}`).toEqual([PARAMETRO_CURSOR]);
    }
  });

  it("cursor inválido é DESCARTADO — replay do início, nunca salto arbitrário", () => {
    for (const invalido of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(montarUrlDoFluxo(invalido), `cursor ${invalido}`).toBe(CAMINHO_FLUXO_EVENTOS);
    }
  });

  it("o caminho do ticket é o do contrato e não tem query alguma", () => {
    // O handshake é `POST` com a credencial normal; nada viaja na URL.
    expect(CAMINHO_TICKET_EVENTOS).not.toContain("?");
    expect(CAMINHO_TICKET_EVENTOS.startsWith("/v1/")).toBe(true);
  });
});

describe("ponte de vocabulário fio → tela", () => {
  it("cobre os SEIS estados de conexão do contrato, sem sobra nem falta", () => {
    expect(Object.keys(CONECTIVIDADE_POR_ESTADO_CONEXAO).sort()).toEqual(
      [...ESTADOS_CONEXAO].sort(),
    );
  });

  it("origina `reproduzindo` e `reconciliado` a partir de estados REAIS do fio", () => {
    // Até a fiação do transporte na árvore de UI, os dois só existiam como
    // catálogo de apresentação (`GaleriaEstados.tsx`), sem transporte que os
    // produzisse. Este mapa é o ponto em que passam a ter origem.
    expect(CONECTIVIDADE_POR_ESTADO_CONEXAO.replaying).toBe("reproduzindo");
    expect(CONECTIVIDADE_POR_ESTADO_CONEXAO.reconciled).toBe("reconciliado");
  });

  it("não promove nem rebaixa gravidade ao traduzir", () => {
    expect(CONECTIVIDADE_POR_ESTADO_CONEXAO.online).toBe("online");
    expect(CONECTIVIDADE_POR_ESTADO_CONEXAO.degraded).toBe("degradado");
    expect(CONECTIVIDADE_POR_ESTADO_CONEXAO.offline).toBe("offline");
    expect(CONECTIVIDADE_POR_ESTADO_CONEXAO.reconnecting).toBe("reconectando");
  });
});
