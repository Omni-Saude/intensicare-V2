/**
 * apps/web/e2e/contraste-tema-escuro.spec.ts
 *
 * OS SELOS DE ESTADO (`.badge-tom--*`) SOB `prefers-color-scheme: dark`.
 *
 * POR QUE ESTA SUÍTE EXISTE, E O QUE ELA NÃO É. O achado herdado dizia
 * "contraste quebrado nos selos em modo escuro, risco de WCAG 1.4.3". A
 * medição NÃO confirma isso, e este arquivo registra a medição em vez de
 * repetir a alegação: cada `.badge-tom--*` declara `background` E `color`, de
 * modo que o par texto/fundo é o MESMO nos dois esquemas — nenhum deles cai
 * abaixo de 4.5:1, e o axe passa (corretamente) com `color-contrast` ligado.
 *
 * O QUE A MEDIÇÃO ACHOU DE FATO (OBSERVED, valores em `src/estilo.css`):
 * `estilo.css` tinha sete blocos `@media (prefers-color-scheme: dark)` e
 * nenhum cobria os selos, então sob tema escuro os selos permaneciam com fundo
 * CLARO. A consequência não é o par texto/fundo — é a SALIÊNCIA relativa, e
 * ela invertia:
 *
 *   tema claro  → `--critico` (#7a1010) destaca 11,00:1 do cartão branco,
 *                 enquanto os seis tons claros ficam em 1,09–1,19:1;
 *   tema escuro → `--critico` caía para 1,47:1 contra o cartão (#1a212b) e os
 *                 seis tons benignos subiam a 13,66–14,86:1.
 *
 * Isto é, no tema escuro o selo que carrega o estado mais grave passava a ser
 * o MENOS destacado da tela, e os selos benignos viravam placas claras. É um
 * defeito de apresentação de estado de segurança clínica — o mecanismo do
 * requisito "nada depende só de cor" continua íntegro (texto + glifo,
 * `domain/linguagem.ts`), mas a hierarquia visual dizia o contrário do estado.
 *
 * ESTA SUÍTE NÃO DECLARA ACESSIBILIDADE VALIDADA (ADR-0021 F7, SPR-G4-5,
 * MG-G4). Contraste medido por ferramenta é condição necessária, nunca
 * suficiente: percepção real sob baixa visão, sensibilidade à luz e ampliação
 * segue sendo validação humana NÃO EXECUTADA.
 *
 * Rastreio: WCAG 2.2 SC 1.4.3, SC 1.4.1, HAZ-0046, ADR-0029 P1, ACH-07.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import {
  distanciaSrgb,
  fmt,
  lerCor,
  luminanciaRelativa,
  razaoDeContraste,
} from "../src/a11y/cor.js";

/** Os sete tons de `domain/estados.ts` — o union type inteiro, não uma amostra. */
const TONS = [
  "neutro",
  "positivo",
  "informativo",
  "atencao",
  "alerta",
  "critico",
  "inconclusivo",
] as const;

/**
 * Piso de contraste para o texto do selo. `.badge-tom` tem `font-size:
 * 0.85rem` (13,6 px) e `font-weight: 600` — está ABAIXO do limiar de "texto
 * grande" da WCAG (18,66 px em negrito, ou 24 px), portanto o piso aplicável é
 * 4.5:1, não 3:1. Citado da norma, não escolhido aqui.
 */
const PISO_TEXTO_NORMAL_AA = 4.5;

interface ParMedido {
  readonly tom: string;
  readonly fundoSelo: string;
  readonly textoSelo: string;
  readonly superficie: string;
  readonly seletorDaSuperficie: string;
}

/**
 * Lê, no navegador, os pares (texto, fundo) realmente computados de cada selo
 * e o fundo OPACO da superfície onde o selo está pousado.
 *
 * "Superfície" é o primeiro ancestral com fundo não transparente — subir a
 * árvore é obrigatório porque `.galeria-item` e `.cartao-leito__linha` são
 * transparentes, e medir contra `transparent` daria um número sem significado.
 */
async function medirSelos(pagina: Page, tons: readonly string[]): Promise<ParMedido[]> {
  return await pagina.evaluate((listaDeTons) => {
    function fundoOpaco(elemento: Element | null): { cor: string; seletor: string } {
      let atual: Element | null = elemento;
      while (atual !== null) {
        const cor = globalThis.getComputedStyle(atual).backgroundColor;
        const canais = cor.match(/[\d.]+/g);
        const alfa = canais !== null && canais.length >= 4 ? Number(canais[3]) : 1;
        if (cor !== "transparent" && alfa > 0) {
          const classe = atual.className;
          return {
            cor,
            seletor:
              atual.tagName.toLowerCase() +
              (typeof classe === "string" && classe.length > 0
                ? `.${classe.trim().split(/\s+/).join(".")}`
                : ""),
          };
        }
        atual = atual.parentElement;
      }
      // A raiz do documento sempre pinta algo; chegar aqui é anomalia real.
      return { cor: "rgb(255, 255, 255)", seletor: "(nenhum ancestral opaco)" };
    }

    const medidos: ParMedido[] = [];
    for (const tom of listaDeTons) {
      const selo = document.querySelector(`.badge-tom--${tom}`);
      if (selo === null) continue;
      // A cor é medida no span do TEXTO, não no selo: assumir herança seria
      // assumir justamente o que o teste deveria observar.
      const spanTexto = [...selo.querySelectorAll("span")].find(
        (s) => !s.classList.contains("badge-tom__glifo"),
      );
      const estiloSelo = globalThis.getComputedStyle(selo);
      const estiloTexto = globalThis.getComputedStyle(spanTexto ?? selo);
      const superficie = fundoOpaco(selo.parentElement);
      medidos.push({
        tom,
        fundoSelo: estiloSelo.backgroundColor,
        textoSelo: estiloTexto.color,
        superficie: superficie.cor,
        seletorDaSuperficie: superficie.seletor,
      });
    }
    return medidos;
  }, tons as string[]);
}

/**
 * Emula um esquema de cor e AFIRMA que a emulação pegou.
 *
 * O meta-assert não é zelo excessivo: este repositório já OBSERVOU que
 * `use.reducedMotion` do config não surtia efeito nesta versão do Playwright
 * (ver `playwright.config.ts`, projeto `chromium-movimento-reduzido`). Um teste
 * de tema escuro que não estivesse no tema escuro passaria medindo o tema
 * claro — verde vazio, a pior espécie.
 */
async function aplicarEsquema(pagina: Page, esquema: "dark" | "light"): Promise<void> {
  await pagina.emulateMedia({ colorScheme: esquema });
  const pegou = await pagina.evaluate(
    (alvo) => globalThis.matchMedia(`(prefers-color-scheme: ${alvo})`).matches,
    esquema,
  );
  expect(pegou, `a emulação de prefers-color-scheme: ${esquema} NÃO foi aplicada`).toBe(true);
}

async function abrirGaleria(pagina: Page): Promise<void> {
  await pagina.goto("/?estados");
  await expect(pagina.getByRole("heading", { name: /Galeria de estados/ })).toBeVisible();
}

test.describe("selos de estado sob tema escuro", () => {
  test("a emulação de tema escuro realmente muda a pintura da página", async ({ page }) => {
    // Meta-teste de não-vacuidade: sem ele, tudo que vem depois poderia estar
    // medindo o tema claro e passando por engano.
    await abrirGaleria(page);
    await aplicarEsquema(page, "light");
    const claro = await page.evaluate(
      () => globalThis.getComputedStyle(document.body).backgroundColor,
    );
    await aplicarEsquema(page, "dark");
    const escuro = await page.evaluate(
      () => globalThis.getComputedStyle(document.body).backgroundColor,
    );

    expect(claro, "o tema claro e o escuro pintam o body igual").not.toBe(escuro);
    expect(
      luminanciaRelativa(lerCor(escuro)),
      "o body do tema escuro não é mais escuro que o do tema claro",
    ).toBeLessThan(luminanciaRelativa(lerCor(claro)));
  });

  test("todos os sete tons existem na galeria e são medidos", async ({ page }) => {
    // Guarda de não-vacuidade: se a galeria deixar de renderizar um tom, os
    // testes abaixo iterariam sobre menos itens e ficariam verdes por omissão.
    await abrirGaleria(page);
    await aplicarEsquema(page, "dark");
    const medidos = await medirSelos(page, TONS);
    expect(medidos.map((m) => m.tom).sort()).toEqual([...TONS].sort());
  });

  test("o texto de cada selo mantém 4.5:1 contra o próprio fundo, no tema escuro", async ({
    page,
  }) => {
    await abrirGaleria(page);
    await aplicarEsquema(page, "dark");
    const medidos = await medirSelos(page, TONS);

    const abaixoDoPiso = medidos
      .map((m) => ({ ...m, razao: razaoDeContraste(lerCor(m.textoSelo), lerCor(m.fundoSelo)) }))
      .filter((m) => m.razao < PISO_TEXTO_NORMAL_AA)
      .map((m) => `${m.tom}: ${m.textoSelo} sobre ${m.fundoSelo} = ${fmt(m.razao)}:1`);

    expect(abaixoDoPiso, "selo com texto abaixo de 4.5:1 no tema escuro (WCAG 1.4.3)").toEqual([]);
  });

  test("no tema escuro o selo tem fundo ESCURO — não uma placa clara sobre página escura", async ({
    page,
  }) => {
    // ESTE É O DEFEITO. Não é o par texto/fundo (que nunca quebrou): é a
    // ausência de variante escura, que deixava seis dos sete selos pintados
    // com fundo claro dentro de uma página escura. A regra abaixo é a
    // coerência mínima com `:root { color-scheme: light dark }` — se o
    // documento declara suporte aos dois esquemas, a superfície do selo
    // acompanha o esquema, como TODA outra superfície desta folha já faz
    // (`.cartao-leito`, `.insumos-declarados`, `.aviso-sessao`, …).
    await abrirGaleria(page);
    await aplicarEsquema(page, "dark");
    const medidos = await medirSelos(page, TONS);

    const invertidos = medidos
      .filter(
        (m) => luminanciaRelativa(lerCor(m.fundoSelo)) >= luminanciaRelativa(lerCor(m.textoSelo)),
      )
      .map(
        (m) =>
          `${m.tom}: fundo ${m.fundoSelo} (L=${fmt(luminanciaRelativa(lerCor(m.fundoSelo)))}) ` +
          `mais claro que o texto ${m.textoSelo}`,
      );

    expect(invertidos, "selo pintado como no tema claro dentro do tema escuro").toEqual([]);
  });

  test("o selo CRÍTICO continua sendo o mais destacado da superfície nos DOIS temas", async ({
    page,
  }) => {
    // A hierarquia de saliência é propriedade OBSERVADA do tema claro
    // (`--critico` a 11,00:1 do cartão, os demais entre 1,09 e 1,19:1) — não é
    // um limiar inventado aqui. O tema escuro a invertia: `--critico` caía a
    // 1,47:1 e os tons benignos subiam acima de 13:1. Este teste exige apenas
    // que a ordem seja a MESMA nos dois esquemas.
    await abrirGaleria(page);

    for (const esquema of ["light", "dark"] as const) {
      await aplicarEsquema(page, esquema);
      const medidos = await medirSelos(page, TONS);
      const destaque = medidos.map((m) => ({
        tom: m.tom,
        superficie: m.seletorDaSuperficie,
        razao: razaoDeContraste(lerCor(m.fundoSelo), lerCor(m.superficie)),
      }));
      const critico = destaque.find((d) => d.tom === "critico");
      expect(critico, "tom crítico ausente da medição").toBeDefined();

      const maisDestacados = destaque
        .filter((d) => d.tom !== "critico" && d.razao > (critico?.razao ?? 0))
        .map((d) => `${d.tom}=${fmt(d.razao)}:1`);

      expect(
        maisDestacados,
        `no tema ${esquema} o selo crítico (${fmt(critico?.razao ?? 0)}:1 contra ` +
          `${critico?.superficie ?? "?"}) destaca MENOS que selos de menor severidade — ` +
          "a hierarquia de estado inverte",
      ).toEqual([]);
    }
  });

  test("a variante escura NÃO colapsa os tons: a distinção não piora em relação ao tema claro", async ({
    page,
  }) => {
    // "Não colapse tons em um cinza só" — verificado por comparação com o que
    // o tema claro já entrega, em vez de por um número escolhido a dedo. A
    // menor distância entre dois fundos no tema claro é 9,9 (neutro ×
    // informativo); a variante escura precisa ao menos igualar isso.
    await abrirGaleria(page);

    async function menorDistanciaEntreFundos(): Promise<{ valor: number; par: string }> {
      const medidos = await medirSelos(page, TONS);
      let valor = Number.POSITIVE_INFINITY;
      let par = "";
      for (let i = 0; i < medidos.length; i += 1) {
        for (let j = i + 1; j < medidos.length; j += 1) {
          const primeiro = medidos[i];
          const segundo = medidos[j];
          if (primeiro === undefined || segundo === undefined) continue;
          const d = distanciaSrgb(lerCor(primeiro.fundoSelo), lerCor(segundo.fundoSelo));
          if (d < valor) {
            valor = d;
            par = `${primeiro.tom} × ${segundo.tom}`;
          }
        }
      }
      return { valor, par };
    }

    await aplicarEsquema(page, "light");
    const claro = await menorDistanciaEntreFundos();
    await aplicarEsquema(page, "dark");
    const escuro = await menorDistanciaEntreFundos();

    expect(claro.valor, "dois tons já são indistinguíveis no tema claro").toBeGreaterThan(0);
    expect(
      escuro.valor,
      `no tema escuro os tons ${escuro.par} distam ${fmt(escuro.valor)} em sRGB, ` +
        `menos que o pior par do tema claro (${claro.par} = ${fmt(claro.valor)})`,
    ).toBeGreaterThanOrEqual(claro.valor);
  });

  test("axe não reporta violação na galeria sob tema escuro (contraste ligado)", async ({
    page,
  }) => {
    // REGISTRO HONESTO: o axe passava ANTES da correção também, e passar aqui
    // não é o que prova a correção. Ele está nesta suíte como rede contra o
    // erro que ELE sabe pegar — um par texto/fundo mal escolhido na variante
    // nova. O defeito de saliência, o axe não vê; quem o vê são os testes
    // acima.
    await abrirGaleria(page);
    await aplicarEsquema(page, "dark");
    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      resultado.violations.map((v) => `${v.id} [${v.impact ?? "sem impacto"}] ${v.help}`),
    ).toEqual([]);
  });

  test("axe não reporta violação na GRADE sob tema escuro (selos sobre cartão)", async ({
    page,
  }) => {
    // Superfície diferente da galeria: aqui os selos pousam em `.cartao-leito`,
    // que TEM variante escura própria (#1a212b). É a combinação que mais
    // importa clinicamente, porque é a tela de trabalho.
    await page.goto("/?mock");
    await expect(page.getByRole("heading", { name: "Grade de leitos", exact: true })).toBeVisible();
    await aplicarEsquema(page, "dark");
    await expect(page.locator(".cartao-leito").first()).toBeVisible();

    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      resultado.violations.map((v) => `${v.id} [${v.impact ?? "sem impacto"}] ${v.help}`),
    ).toEqual([]);
  });
});
