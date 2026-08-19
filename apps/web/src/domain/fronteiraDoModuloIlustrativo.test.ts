/**
 * apps/web/src/domain/fronteiraDoModuloIlustrativo.test.ts
 *
 * LAC-L8 — `./news2.ts` está rotulado "APENAS PARA FINS ILUSTRATIVOS" e, até
 * esta mudança, era importado por DOIS módulos do caminho de produção:
 * `../api/clienteHttp.ts:60` e `../components/DetalhePaciente.tsx:7`, ambos
 * por causa de `ROTULO_PARAMETRO` — que é mapa de RÓTULOS de exibição, não
 * semântica clínica, e por isso pertence a `./linguagem.ts`.
 *
 * POR QUE UM TESTE DE GRAFO DE IMPORTAÇÃO, E NÃO SÓ UM `grep` NO BUNDLE.
 * Medido antes da correção (`pnpm exec vite build` + `grep` em
 * `dist/assets/*.js`): a tabela de pontos NÃO aparecia no pacote emitido — o
 * tree-shaking a removia, porque só `ROTULO_PARAMETRO` era de fato consumido.
 * Ou seja, a afirmação "a tabela ilustrativa entra no bundle" era FALSA na
 * configuração atual. O que era verdade — e continua sendo o risco real — é
 * que existia uma ARESTA DE IMPORTAÇÃO do caminho de produção para o módulo
 * ilustrativo, e nada além de uma otimização do empacotador impedia o
 * vazamento. É o mesmo argumento que `../build/guardaArtefatoSintetico.ts` já
 * faz sobre si: "tree-shaking é uma otimização, não uma garantia contratual".
 *
 * `scripts/check_module_boundaries.mjs` nunca poderia cobrir isto: ele lê
 * `package.json` e jamais faz parse de `import`.
 *
 * O fonte é lido por `import.meta.glob(..., "?raw")` — mesmo recurso já usado
 * por `../api/guardas.test.ts`, porque o tsconfig deste app declara apenas
 * `vite/client` e não tem os tipos do Node.
 *
 * Rastreio: LAC-L8, ADR-0021, ACH-07 (terceira defesa), anti-padrão 9.
 */
import { describe, expect, it } from "vitest";
import { MARCADORES_PROIBIDOS } from "../build/guardaArtefatoSintetico.js";
import { VERSAO_REGRA_NEWS2_ILUSTRATIVA } from "./news2.js";

/**
 * Todo fonte de `src/**`, como texto, indexado por caminho a partir da raiz do
 * projeto. O padrão é ANCORADO NA RAIZ (`/src/...`) de propósito: um padrão
 * relativo (`../**`) faz o Vite reescrever as chaves do próprio diretório do
 * importador para `./x.ts`, e a lista de autorizados deixaria de casar em
 * silêncio — falso-verde na guarda, que é o pior defeito que ela poderia ter.
 */
const FONTES = import.meta.glob<string>("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

/**
 * Únicos módulos autorizados a depender da tabela ilustrativa.
 *
 * `api/fixtures.ts` é a fonte de dados do DUBLÊ (`api/clienteMock.ts`), que só
 * é alcançável por `import()` dinâmico sob `import.meta.env.DEV`
 * (`api/resolverCliente.ts`) e já é barrado no pacote de produção pelo marcador
 * `criarClienteMock`. É exatamente a dependência que o cabeçalho de
 * `./news2.ts` declara legítima.
 */
const AUTORIZADOS = new Set(["/src/api/fixtures.ts", "/src/domain/news2.ts"]);

/** Toda especificação de módulo importada/reexportada por um arquivo. */
function importacoesDe(conteudo: string): string[] {
  const especificacoes: string[] = [];
  const padrao = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
  let achado = padrao.exec(conteudo);
  while (achado !== null) {
    if (achado[1] !== undefined) especificacoes.push(achado[1]);
    achado = padrao.exec(conteudo);
  }
  return especificacoes;
}

function ehTeste(caminho: string): boolean {
  return /\.test\.tsx?$/.test(caminho);
}

describe("fronteira do módulo NEWS2 ilustrativo (LAC-L8)", () => {
  it("nenhum módulo de PRODUÇÃO importa `domain/news2` — só o alimentador do dublê", () => {
    const violacoes: string[] = [];

    for (const [caminho, conteudo] of Object.entries(FONTES)) {
      if (ehTeste(caminho) || AUTORIZADOS.has(caminho)) continue;
      if (caminho.startsWith("/src/teste/")) continue;

      const importa = importacoesDe(conteudo).some((especificacao) =>
        /(^|\/)news2(\.js|\.ts)?$/.test(especificacao),
      );
      if (importa) violacoes.push(caminho);
    }

    // Guarda de NÃO-VACUIDADE: a varredura precisa ter lido a árvore certa.
    // Sem isto, um glob que não casasse com nada faria este teste passar
    // trivialmente — o falso-verde que a fatia não pode ter.
    expect(Object.keys(FONTES)).toContain("/src/domain/news2.ts");
    expect(Object.keys(FONTES)).toContain("/src/api/clienteHttp.ts");
    expect(Object.keys(FONTES).length).toBeGreaterThan(20);
    expect(violacoes, "módulo ilustrativo alcançado pelo caminho de produção").toEqual([]);
  });

  it("o alimentador do dublê CONTINUA dependendo da tabela — o módulo não foi apagado", () => {
    const fixtures = FONTES["/src/api/fixtures.ts"];
    expect(fixtures, "fixtures.ts não foi lido pelo glob").toBeTypeOf("string");
    expect(importacoesDe(fixtures ?? "").some((e) => /news2/.test(e))).toBe(true);
  });

  it("a guarda de build proíbe o marcador da regra ilustrativa no pacote de produção", () => {
    const literais = MARCADORES_PROIBIDOS.map((marcador) => marcador.literal);
    expect(literais).toContain(VERSAO_REGRA_NEWS2_ILUSTRATIVA);
  });
});
