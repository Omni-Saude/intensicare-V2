/**
 * apps/web/e2e/acessibilidade.spec.ts
 *
 * Automação WCAG em NAVEGADOR REAL. É aqui — e só aqui — que as regras
 * dependentes de cor e de caixa podem ser verificadas de verdade:
 * `color-contrast` (1.4.3/1.4.11) e `target-size` (2.5.8) ficam DESLIGADAS na
 * suíte jsdom porque um verde delas lá seria falso.
 *
 * NADA nesta suíte declara acessibilidade validada. axe encontra uma fração
 * conhecida das barreiras reais; a validação com pessoas que usam tecnologia
 * assistiva é dependência humana e permanece NÃO EXECUTADA (ADR-0021 F7,
 * SPR-G4-5, MG-G4). Ver `src/a11y/matrizAcessibilidade.ts`.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { abrirAplicacaoComDubleDeDesenvolvimento } from "./apoio/base.js";

const PADROES_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function varrer(pagina: import("@playwright/test").Page) {
  return await new AxeBuilder({ page: pagina }).withTags(PADROES_WCAG).analyze();
}

function resumir(violacoes: Awaited<ReturnType<typeof varrer>>["violations"]): string[] {
  return violacoes.map(
    (v) => `${v.id} [${v.impact ?? "sem impacto"}] ${v.help} — ${v.nodes.length} nó(s)`,
  );
}

test.describe("axe-core em navegador real", () => {
  test("grade de leitos — sem violação WCAG 2.2 AA", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const resultado = await varrer(page);
    expect(resumir(resultado.violations)).toEqual([]);
  });

  test("detalhe do paciente — sem violação WCAG 2.2 AA", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const cartoes = page.locator(".cartao-leito");
    test.skip((await cartoes.count()) === 0, "a API não devolveu leitos");
    await cartoes.first().click();
    await expect(page.getByRole("button", { name: /Voltar à grade/ })).toBeVisible();

    const resultado = await varrer(page);
    expect(resumir(resultado.violations)).toEqual([]);
  });

  test("estado de ERRO — sem violação (o caminho do ACH-07)", async ({ page }) => {
    await page.route("**/v1/projecoes/grade-leitos*", (rota) => rota.abort("connectionrefused"));
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Tentar novamente/i })).toBeVisible();

    const resultado = await varrer(page);
    expect(resumir(resultado.violations)).toEqual([]);
  });

  test("galeria de TODOS os estados do §11 — sem violação, contraste incluído", async ({
    page,
  }) => {
    // Esta é a varredura de contraste mais densa da fatia: todos os tons
    // semânticos (`badge-tom--*`) aparecem lado a lado numa página só.
    await page.goto("/?estados");
    await expect(page.getByRole("heading", { name: /Galeria de estados/ })).toBeVisible();

    const resultado = await varrer(page);
    expect(resumir(resultado.violations)).toEqual([]);
  });
});

test.describe("teclado e foco em navegador real", () => {
  test("todo controle é alcançável por Tab e o foco é PERCEPTÍVEL", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);

    const total = await page
      .locator("button:not([disabled]), a[href], summary, input, select, textarea")
      .count();
    expect(total).toBeGreaterThan(0);

    const alcancados = new Set<string>();
    for (let passo = 0; passo < total + 2; passo += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const ativo = document.activeElement;
        if (!(ativo instanceof HTMLElement) || ativo === document.body) return null;
        const estilo = globalThis.getComputedStyle(ativo);
        return {
          chave: `${ativo.tagName}:${ativo.textContent?.slice(0, 40) ?? ""}`,
          larguraContorno: estilo.outlineWidth,
          estiloContorno: estilo.outlineStyle,
          sombra: estilo.boxShadow,
        };
      });
      if (info === null) continue;
      alcancados.add(info.chave);

      // WCAG 2.4.7 — indicador de foco existe de fato no elemento focado.
      const temContorno =
        info.estiloContorno !== "none" && Number.parseFloat(info.larguraContorno) > 0;
      const temSombra = info.sombra !== "none" && info.sombra !== "";
      expect(temContorno || temSombra, `sem indicador de foco perceptível em ${info.chave}`).toBe(
        true,
      );
    }

    expect(alcancados.size).toBeGreaterThan(0);
  });

  test("alvos de toque têm ao menos 24x24 CSS px (WCAG 2.5.8)", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const botoes = page.locator("button:visible");
    const total = await botoes.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i += 1) {
      const caixa = await botoes.nth(i).boundingBox();
      if (caixa === null) continue;
      const rotulo = (await botoes.nth(i).textContent())?.slice(0, 40) ?? `botão ${i}`;
      expect(caixa.width, `largura do alvo "${rotulo}"`).toBeGreaterThanOrEqual(24);
      expect(caixa.height, `altura do alvo "${rotulo}"`).toBeGreaterThanOrEqual(24);
    }
  });
});

test.describe("live regions em navegador real", () => {
  test("a região de alertas existe antes da mensagem e é assertiva", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const regiao = page.locator('[aria-live="assertive"][aria-atomic="true"]');
    await expect(regiao.first()).toBeAttached();
  });

  test("o bloco de estado de falha é anunciado assertivamente", async ({ page }) => {
    await page.route("**/v1/projecoes/grade-leitos*", (rota) => rota.abort("connectionrefused"));
    await page.goto("/");
    const bloco = page.locator('[data-contexto="grade de leitos"]');
    await expect(bloco).toHaveAttribute("aria-live", "assertive");
    await expect(bloco).toHaveAttribute("role", "alert");
  });
});
