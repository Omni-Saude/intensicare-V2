/**
 * apps/web/src/domain/textoNaCamadaDeLinguagem.test.tsx
 *
 * O DEFEITO QUE ESTE ARQUIVO FIXA (existia em HEAD 1eda4f1): texto clínico
 * exibido ao profissional estava REDIGIDO FORA da camada de linguagem.
 *
 *   - `api/clienteHttp.ts:279` escrevia, dentro do cliente HTTP, a descrição
 *     "Alerta consultivo NEWS2 — a decisão clínica permanece com o
 *     profissional." — um transporte redigindo frase clínica;
 *   - `components/BannerContexto.tsx:42-43` e `:49-50` carregavam, como
 *     literais de JSX, as DUAS divulgações obrigatórias (HAZ-0046; ADR-0004
 *     §6.2).
 *
 * ADR-0021 F1 coloca o texto pt-BR em `domain/linguagem.ts` e em nenhum outro
 * lugar; texto duplicado fora dela é a via pela qual duas descrições
 * divergentes do mesmo fato aparecem em telas diferentes (ADR-0008 N3).
 *
 * O CUIDADO QUE ESTE ARQUIVO PRESERVA (LAC-D8). As duas divulgações são
 * elementos IRMÃOS e INDEPENDENTES: a de dados sintéticos é TEMPORÁRIA (sai
 * quando a fatia deixar de operar sobre `SYNTH-`), a institucional é
 * PERMANENTE e vinculante (ADR-0004 §6.2, HAZ-0046). Centralizar o texto não
 * pode fundi-las numa única string — quem removesse a primeira levaria a
 * segunda junto. Por isso são dois valores distintos, cada um com seu
 * identificador estável (`data-divulgacao`, RLI-5).
 *
 * Rastreio: ADR-0021 F1/V1, ADR-0004 §6.2, HAZ-0046, RLI-5, LAC-D8, ADR-0029
 * C2 (ABERTA — redação provisória).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BannerContexto } from "../components/BannerContexto.js";
import {
  DESCRICAO_ALERTA_CONSULTIVO_SEM_MOTIVO,
  DIVULGACAO_DADOS_SINTETICOS,
  DIVULGACAO_REGISTRO_INSTITUCIONAL,
  textoDaDivulgacao,
} from "./linguagem.js";

/** Todo fonte de `src/**` como texto — padrão ancorado na raiz do projeto. */
const FONTES = import.meta.glob<string>("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

const ARQUIVO_DA_LINGUAGEM = "/src/domain/linguagem.ts";

function fontesDeProducaoQueContem(literal: string): string[] {
  return Object.entries(FONTES)
    .filter(([caminho]) => !/\.test\.tsx?$/.test(caminho))
    .filter(([, conteudo]) => conteudo.includes(literal))
    .map(([caminho]) => caminho)
    .sort();
}

describe("fonte única do texto exibido (ADR-0021 F1)", () => {
  it("a varredura leu a árvore de fontes certa (não-vacuidade)", () => {
    expect(Object.keys(FONTES)).toContain(ARQUIVO_DA_LINGUAGEM);
    expect(Object.keys(FONTES)).toContain("/src/api/clienteHttp.ts");
    expect(Object.keys(FONTES)).toContain("/src/components/BannerContexto.tsx");
    expect(Object.keys(FONTES).length).toBeGreaterThan(20);
  });

  it("a descrição do alerta consultivo só existe na camada de linguagem", () => {
    expect(DESCRICAO_ALERTA_CONSULTIVO_SEM_MOTIVO.length).toBeGreaterThan(0);
    expect(fontesDeProducaoQueContem(DESCRICAO_ALERTA_CONSULTIVO_SEM_MOTIVO)).toEqual([
      ARQUIVO_DA_LINGUAGEM,
    ]);
  });

  it("as duas divulgações obrigatórias só existem na camada de linguagem", () => {
    for (const divulgacao of [DIVULGACAO_DADOS_SINTETICOS, DIVULGACAO_REGISTRO_INSTITUCIONAL]) {
      expect(divulgacao.complemento.length).toBeGreaterThan(0);
      expect(
        fontesDeProducaoQueContem(divulgacao.complemento),
        `divulgação "${divulgacao.id}" redigida fora de domain/linguagem.ts`,
      ).toEqual([ARQUIVO_DA_LINGUAGEM]);
    }
  });
});

describe("LAC-D8 — centralizar o texto não funde as duas divulgações", () => {
  it("são dois valores distintos, com identificadores estáveis distintos", () => {
    expect(DIVULGACAO_DADOS_SINTETICOS).not.toBe(DIVULGACAO_REGISTRO_INSTITUCIONAL);
    expect(DIVULGACAO_DADOS_SINTETICOS.id).toBe("dados-sinteticos");
    expect(DIVULGACAO_REGISTRO_INSTITUCIONAL.id).toBe("registro-limitado-instituicao");
    expect(DIVULGACAO_DADOS_SINTETICOS.id).not.toBe(DIVULGACAO_REGISTRO_INSTITUCIONAL.id);
  });

  /**
   * A PRIMEIRA VERSÃO DESTE TESTE DEIXOU PASSAR UMA MUTAÇÃO REAL. Ela
   * comparava apenas as frases INTEIRAS (`a.includes(b)`), e uma mutação que
   * colava o complemento da divulgação temporária dentro do complemento da
   * permanente sobrevivia: o destaque à frente ("Registro limitado…") fazia a
   * comparação de string inteira falhar, e a fusão passava verde. Agora a
   * comparação é sobre os PEDAÇOS DISTINTIVOS de cada uma — que é o que a
   * fusão de fato duplica.
   */
  it("nenhuma das duas contém a outra — remover a temporária não leva a permanente junto", () => {
    const divulgacoes = [DIVULGACAO_DADOS_SINTETICOS, DIVULGACAO_REGISTRO_INSTITUCIONAL];
    let paresComparados = 0;

    for (const a of divulgacoes) {
      for (const b of divulgacoes) {
        if (a.id === b.id) continue;
        paresComparados += 1;
        const textoDeA = textoDaDivulgacao(a);
        expect(textoDeA.includes(textoDaDivulgacao(b)), `${a.id} contém ${b.id}`).toBe(false);
        expect(textoDeA.includes(b.complemento), `${a.id} absorveu o complemento de ${b.id}`).toBe(
          false,
        );
        expect(textoDeA.includes(b.destaque), `${a.id} absorveu o destaque de ${b.id}`).toBe(false);
      }
    }

    // Não-vacuidade: os pares foram de fato percorridos e as frases não são
    // degeneradas (uma string vazia passaria por todos os `includes` acima).
    expect(paresComparados).toBe(2);
    for (const divulgacao of divulgacoes) {
      expect(divulgacao.destaque.length).toBeGreaterThan(5);
      expect(textoDaDivulgacao(divulgacao).length).toBeGreaterThan(20);
    }
  });

  it("o banner RENDERIZA exatamente o texto central, em dois elementos irmãos", () => {
    render(<BannerContexto />);

    const sintetico = screen.getByTestId("divulgacao-dados-sinteticos");
    const institucional = screen.getByTestId("rotulo-registro-institucional");

    expect(sintetico.getAttribute("data-divulgacao")).toBe(DIVULGACAO_DADOS_SINTETICOS.id);
    expect(institucional.getAttribute("data-divulgacao")).toBe(
      DIVULGACAO_REGISTRO_INSTITUCIONAL.id,
    );

    // O componente NÃO re-redige: o que está na tela é o texto da camada de
    // linguagem, caractere a caractere.
    expect(sintetico.textContent).toBe(textoDaDivulgacao(DIVULGACAO_DADOS_SINTETICOS));
    expect(institucional.textContent).toBe(textoDaDivulgacao(DIVULGACAO_REGISTRO_INSTITUCIONAL));

    // E continuam irmãos independentes (invariante do LAC-D8).
    expect(sintetico.contains(institucional)).toBe(false);
    expect(institucional.contains(sintetico)).toBe(false);
  });
});
