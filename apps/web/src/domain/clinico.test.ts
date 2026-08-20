// @vitest-environment node
// Este arquivo não toca DOM em NENHUM módulo do seu grafo (verificado). Em
// jsdom ele custava a construção de um ambiente inteiro sem usá-lo — ver a
// nota "CUSTO DE AMBIENTE" em `apps/web/vitest.config.ts`.
/**
 * apps/web/src/domain/clinico.test.ts
 *
 * FRESCOR GERAL — O RESUMO QUE O CARTÃO DO LEITO EXIBE.
 *
 * `calcularFrescorGeral` prometia, no próprio comentário, "nunca inventa um
 * frescor melhor que o pior insumo real". O código fazia exatamente isso, por
 * duas portas independentes (ACH-O3-12):
 *
 *   1. `ORDEM_SEVERIDADE_FRESCOR` OMITIA `ausente` e `invalido`. `indexOf`
 *      devolve `-1` para o que não está na lista e o índice de partida era `0`:
 *      `-1 > 0` é sempre falso, então os DOIS PIORES estados de frescor nunca
 *      elevavam a severidade. Um insumo que o produtor declarou inválido
 *      (`quarantined`/`invalid`, ver `../api/clienteHttp.ts`) era ignorado, e o
 *      cartão exibia "✓ Dado atual." — tom positivo — sobre ele;
 *   2. lista de contribuições VAZIA devolvia `"atual"`. Não é um caso de borda:
 *      `mapearEntradaGrade` publica `contribuicoes: []` para TODO leito da
 *      grade, porque a projeção é um resumo. Ou seja, cada cartão da grade
 *      afirmava frescor a partir de ZERO evidência, sempre.
 *
 * ADR-0011 P7 é literal: "nenhuma projeção, gateway ou cliente promove status".
 *
 * O QUE ESTE ARQUIVO NÃO DECIDE. A ORDEM RELATIVA entre os nove estados e o
 * TEXTO exibido são apresentação clínica (ADR-0029, condição C2 ABERTA); aqui
 * só se fixa a DIREÇÃO fail-closed: ausência de evidência não vira afirmação, e
 * insumo ausente/inválido/desconhecido nunca é mais brando que um insumo bom.
 */
import { describe, expect, it } from "vitest";
import { type ContribuicaoParametro, calcularFrescorGeral } from "./clinico.js";
import type { EstadoFrescor } from "./estados.js";

function contribuicao(
  frescor: EstadoFrescor,
  valorObservado: number | string | null = 37,
): ContribuicaoParametro {
  return {
    parametro: "temperatura",
    rotulo: "Temperatura",
    valorObservado,
    pontos: 0,
    frescor,
    horarioFonte: "2026-08-17T12:00:00.000Z",
    explicacao: "SYNTH — explicação do backend.",
  };
}

describe("ausência de evidência não é evidência de frescor", () => {
  it("lista VAZIA não afirma frescor algum", () => {
    expect(
      calcularFrescorGeral([]),
      "a projeção da grade publica `contribuicoes: []` para todo leito — " +
        "devolver `atual` faz cada cartão afirmar frescor a partir de nada",
    ).toBeNull();
  });

  it("todas as contribuições sem valor observado também não afirmam frescor", () => {
    const semValor = [contribuicao("atual", null), contribuicao("ausente", null)];
    expect(calcularFrescorGeral(semValor)).toBeNull();
  });
});

describe("o pior insumo domina — inclusive os dois que estavam fora da ordem", () => {
  it("`invalido` sozinho NUNCA vira `atual`", () => {
    expect(
      calcularFrescorGeral([contribuicao("invalido")]),
      "o produtor declarou o insumo inválido e o cartão exibiu tom positivo sobre ele",
    ).toBe("invalido");
  });

  it("`ausente` com valor observado NUNCA vira `atual`", () => {
    expect(calcularFrescorGeral([contribuicao("ausente", "sem leitura")])).toBe("ausente");
  });

  it("`invalido` domina um insumo bom na mesma avaliação", () => {
    expect(calcularFrescorGeral([contribuicao("atual"), contribuicao("invalido")])).toBe(
      "invalido",
    );
    // E a ordem de chegada não muda o resultado: é o PIOR que vale, não o último.
    expect(calcularFrescorGeral([contribuicao("invalido"), contribuicao("atual")])).toBe(
      "invalido",
    );
  });

  it("`invalido` domina `envelhecendo` — a severidade não é apagada pelo vizinho", () => {
    // Mutação vizinha: com a ordem antiga (sem `invalido`), este caso devolvia
    // `envelhecendo` e escondia o insumo que o backend declarou inutilizável.
    expect(calcularFrescorGeral([contribuicao("invalido"), contribuicao("envelhecendo")])).toBe(
      "invalido",
    );
  });

  it("frescor DESCONHECIDO por esta versão da interface é tratado como o pior", () => {
    // Fail-closed contra evolução do vocabulário: um estado que esta versão não
    // conhece não pode ser descartado em silêncio, que era o efeito de `-1`.
    const desconhecido = { ...contribuicao("atual"), frescor: "estado-que-nao-existe-aqui" };
    expect(
      calcularFrescorGeral([contribuicao("atual"), desconhecido as ContribuicaoParametro]),
    ).toBe("estado-que-nao-existe-aqui");
  });
});

describe("o caminho feliz continua sendo o caminho feliz", () => {
  it("só insumos `atual` com valor observado devolvem `atual`", () => {
    expect(calcularFrescorGeral([contribuicao("atual"), contribuicao("atual", 98)])).toBe("atual");
  });

  it("insumo sem valor observado não eleva nem rebaixa o resumo", () => {
    // Insumo ausente é declarado à parte (`insumosAusentes`), nominalmente, em
    // `../components/DetalhePaciente.tsx`. O resumo fala do que foi OBSERVADO.
    expect(calcularFrescorGeral([contribuicao("atual"), contribuicao("expirado", null)])).toBe(
      "atual",
    );
  });
});
