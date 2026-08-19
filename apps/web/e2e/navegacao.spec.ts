/**
 * apps/web/e2e/navegacao.spec.ts
 *
 * LAC-L4 em NAVEGADOR REAL. É aqui — e só aqui — que o botão "voltar" existe
 * de verdade: a History API do jsdom tem semântica própria de travessia, e um
 * teste de unidade que tentasse dirigi-la mediria o agendador do jsdom em vez
 * do produto. A suíte de componentes (`src/roteamento/navegacao.test.tsx`) usa
 * uma porta de histórico injetada; esta prova que a porta real se comporta como
 * a injetada.
 *
 * O DISCRIMINADOR DO "VOLTAR" É A PRÓPRIA URL. Antes de LAC-L4 a navegação era
 * estado de React: `page.goBack()` levava para fora da aplicação, porque ela
 * nunca empilhava entrada nenhuma. Um assert que só olhasse "a grade está
 * visível" passaria também com a aplicação inteira recarregada por navegação de
 * documento; por isso cada caso confere `page.url()` junto.
 *
 * DADOS 100% SINTÉTICOS. Os casos usam o dublê de desenvolvimento (`?mock`),
 * pelo mesmo motivo declarado em `apoio/base.ts`: o que se verifica aqui é
 * navegador, DOM, CSS, foco e histórico reais — não a pilha de rede até a API.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { abrirAplicacaoComDubleDeDesenvolvimento, cabecalhoDaGrade } from "./apoio/base.js";

const PADROES_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Identificador do primeiro leito, LIDO DA TELA. Não é constante: o dublê de
 * desenvolvimento e as fixtures da API usam formatos diferentes ("Leito 01" ×
 * "<unidade>-LEITO-01"), e um literal aqui amarraria a suíte a um deles.
 */
async function primeiroLeitoDaGrade(pagina: Page): Promise<string> {
  const texto = await pagina.locator(".cartao-leito h3").first().textContent();
  expect(texto, "a grade não trouxe nenhum cartão de leito").toBeTruthy();
  return (texto ?? "").trim();
}

function caminhoDoLeito(leitoId: string): string {
  return `/leitos/${encodeURIComponent(leitoId)}`;
}

test.describe("URL por leito, deep link e histórico do navegador", () => {
  test("selecionar um leito muda a URL da barra de endereço", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const leito = await primeiroLeitoDaGrade(page);

    await page.locator(".cartao-leito").first().click();
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();

    expect(new URL(page.url()).pathname).toBe(caminhoDoLeito(leito));
    // A query string do perfil de desenvolvimento é PRESERVADA: sem isso, um
    // recarregamento depois de navegar cairia noutro app (sem o dublê).
    expect(new URL(page.url()).search).toContain("mock");
  });

  test("DEEP LINK: abrir a URL do leito direto monta o detalhe", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const leito = await primeiroLeitoDaGrade(page);

    await page.goto(`${caminhoDoLeito(leito)}?mock`);
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Voltar à grade/ })).toBeVisible();
  });

  test("RECARREGAR preserva o contexto (a mesma tela volta)", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const leito = await primeiroLeitoDaGrade(page);

    await page.locator(".cartao-leito").first().click();
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(caminhoDoLeito(leito));
  });

  test("VOLTAR volta para a grade e NÃO sai da aplicação", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const urlDaGrade = page.url();
    const leito = await primeiroLeitoDaGrade(page);

    await page.locator(".cartao-leito").first().click();
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();

    await page.goBack();

    await expect(cabecalhoDaGrade(page)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/");
    // Antes de LAC-L4 este assert falhava: sem entrada empilhada, o "voltar"
    // levava para fora do documento da aplicação.
    expect(page.url()).toBe(urlDaGrade);
  });

  test("AVANÇAR devolve o detalhe (o histórico é de verdade, não simulado)", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const leito = await primeiroLeitoDaGrade(page);

    await page.locator(".cartao-leito").first().click();
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();
    await page.goBack();
    await expect(cabecalhoDaGrade(page)).toBeVisible();

    await page.goForward();
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(caminhoDoLeito(leito));
  });
});

test.describe("rota desconhecida — estado explícito, sem redirecionamento silencioso", () => {
  test("endereço sem tela declara o erro, mantém a URL e oferece saída", async ({ page }) => {
    await page.goto("/relatorio-que-nao-existe?mock");

    await expect(page.getByTestId("endereco-nao-reconhecido")).toBeVisible();
    await expect(page.getByTestId("caminho-nao-reconhecido")).toHaveText(
      "/relatorio-que-nao-existe",
    );
    // A URL não é reescrita: quem digitou errado consegue ver o que digitou.
    expect(new URL(page.url()).pathname).toBe("/relatorio-que-nao-existe");
    await expect(page).toHaveTitle(/^Endereço não reconhecido —/);

    await page.getByRole("button", { name: /Ir para a grade/ }).click();
    await expect(cabecalhoDaGrade(page)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("a tela de endereço não reconhecido não tem violação WCAG 2.2 AA", async ({ page }) => {
    await page.goto("/nao-existe?mock");
    await expect(page.getByTestId("endereco-nao-reconhecido")).toBeVisible();

    const resultado = await new AxeBuilder({ page }).withTags(PADROES_WCAG).analyze();
    const resumo = resultado.violations.map(
      (v) => `${v.id} [${v.impact ?? "sem impacto"}] ${v.help} — ${v.nodes.length} nó(s)`,
    );
    expect(resumo).toEqual([]);
  });

  test("o banner permanente de contexto continua exibido (HAZ-0046)", async ({ page }) => {
    await page.goto("/nao-existe?mock");
    await expect(page.getByTestId("endereco-nao-reconhecido")).toBeVisible();
    await expect(page.getByTestId("rotulo-registro-institucional")).toBeVisible();
    await expect(page.getByTestId("divulgacao-dados-sinteticos")).toBeVisible();
  });
});

test.describe("WCAG 2.4.1 — atalho para o conteúdo principal", () => {
  test("é o primeiro Tab, fica VISÍVEL ao receber foco e leva o foco ao conteúdo", async ({
    page,
  }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);

    await page.keyboard.press("Tab");
    const focado = page.locator(":focus");
    await expect(focado).toHaveAttribute("data-testid", "link-pular");

    // "Visível ao receber foco" medido de verdade: fora da tela ele tem `left:
    // -9999px`; com foco a caixa precisa entrar na viewport. Este é o assert
    // que jsdom não consegue fazer.
    const caixa = await focado.boundingBox();
    expect(caixa, "o atalho focado não tem caixa — está fora da tela").not.toBeNull();
    expect(caixa?.x ?? -1, "o atalho focado continua fora da área visível").toBeGreaterThanOrEqual(
      0,
    );
    // Alvo mínimo de 24×24 CSS px (WCAG 2.5.8) também vale para o atalho.
    expect(caixa?.width ?? 0).toBeGreaterThanOrEqual(24);
    expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(24);

    // Indicador de foco perceptível (2.4.7) no próprio atalho.
    const indicador = await page.evaluate(() => {
      const ativo = document.activeElement;
      if (!(ativo instanceof HTMLElement)) return null;
      const estilo = globalThis.getComputedStyle(ativo);
      return {
        largura: estilo.outlineWidth,
        estilo: estilo.outlineStyle,
        sombra: estilo.boxShadow,
      };
    });
    const temContorno =
      indicador !== null && indicador.estilo !== "none" && Number.parseFloat(indicador.largura) > 0;
    const temSombra = indicador !== null && indicador.sombra !== "none" && indicador.sombra !== "";
    expect(temContorno || temSombra, "o atalho focado não tem indicador de foco").toBe(true);

    await page.keyboard.press("Enter");
    const idFocado = await page.evaluate(() => document.activeElement?.id ?? "");
    expect(idFocado).toBe("conteudo-principal");
    // E não deixou fragmento na URL: o histórico continua servindo à navegação.
    expect(new URL(page.url()).hash).toBe("");
  });
});

test.describe("WCAG 2.4.2 — título por tela", () => {
  test("grade e detalhe têm títulos distintos e significativos", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    await expect(page).toHaveTitle(/^Grade de leitos —/);
    const tituloGrade = await page.title();

    const leito = await primeiroLeitoDaGrade(page);
    await page.locator(".cartao-leito").first().click();
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();

    const tituloDetalhe = await page.title();
    expect(tituloDetalhe).toContain(leito);
    expect(tituloDetalhe).not.toBe(tituloGrade);
    // A divulgação de contexto acompanha o título em toda tela.
    expect(tituloDetalhe).toMatch(/consultivo, dados sintéticos/);

    await page.goBack();
    await expect(cabecalhoDaGrade(page)).toBeVisible();
    await expect(page).toHaveTitle(tituloGrade);
  });
});

test.describe("foco e anúncio na transição de tela", () => {
  test("navegar move o foco para o conteúdo e anuncia a tela em região POLIDA", async ({
    page,
  }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const leito = await primeiroLeitoDaGrade(page);

    /*
      A REGIÃO ASSERTIVA É MEDIDA NA GRADE, onde ela existe: `RegiaoAoVivoAlertas`
      é renderizada por `GradeLeitos`, e a tela de detalhe só produz região
      assertiva quando há falha (`EstadoTela`). Este assert já falhou uma vez por
      ser feito na tela errada — registro para que ninguém o "conserte" mudando
      o produto: o anúncio de rota não pode ter substituído o canal de alerta.
    */
    const assertivasNaGrade = await page.locator('[aria-live="assertive"]').count();
    expect(assertivasNaGrade, "a grade perdeu a região assertiva de alertas").toBeGreaterThan(0);
    const anuncioNaGrade = page.getByTestId("anuncio-de-tela");
    await expect(anuncioNaGrade).toHaveAttribute("aria-live", "polite");

    await page.locator(".cartao-leito").first().click();
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();

    await expect
      .poll(async () => await page.evaluate(() => document.activeElement?.id ?? ""))
      .toBe("conteudo-principal");

    const anuncio = page.getByTestId("anuncio-de-tela");
    await expect(anuncio).toHaveAttribute("aria-live", "polite");
    await expect(anuncio).toContainText(leito);

    // O anúncio de navegação NUNCA vira assertivo: duas regiões assertivas
    // competindo silenciariam o alerta clínico (IA-P2, HAZ-0037).
    const anuncioEhAssertivo = await page.evaluate(
      () =>
        document.querySelector('[data-testid="anuncio-de-tela"]')?.getAttribute("aria-live") ===
        "assertive",
    );
    expect(anuncioEhAssertivo).toBe(false);
  });

  test("a primeira pintura (deep link) NÃO rouba o foco", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const leito = await primeiroLeitoDaGrade(page);

    await page.goto(`${caminhoDoLeito(leito)}?mock`);
    await expect(page.getByRole("heading", { name: leito, exact: true })).toBeVisible();

    const focado = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(focado, "a primeira pintura moveu o foco e pulou o atalho de teclado").toBe("BODY");
  });
});
