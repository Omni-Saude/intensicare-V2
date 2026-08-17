/**
 * apps/web/e2e/reflow.spec.ts — WCAG 2.2 SC 1.4.10 (Reflow).
 *
 * Roda no projeto `chromium-reflow-320` (viewport de 320 CSS px), que
 * equivale a 400% de zoom em 1280px. O critério exige que o conteúdo seja
 * apresentável sem rolagem em DOIS eixos simultâneos.
 *
 * A exigência local vai além da letra do critério: o
 * `docs/10-ux-and-accessibility/arquitetura-de-informacao.md` §2.2 pede
 * "zoom 400%/reflow SEM PERDA DE CONTEÚDO OU DE ESTADO DE SEGURANÇA VISÍVEL"
 * — por isso o teste também afirma que o banner de contexto e o rótulo de
 * limitação institucional continuam visíveis (HAZ-0046, RLI-3).
 */
import { expect, test } from "@playwright/test";
import { abrirAplicacaoComDubleDeDesenvolvimento } from "./apoio/base.js";

test("a 320 CSS px não há rolagem horizontal", async ({ page }) => {
  await abrirAplicacaoComDubleDeDesenvolvimento(page);

  const rolagem = await page.evaluate(() => ({
    larguraConteudo: document.documentElement.scrollWidth,
    larguraJanela: document.documentElement.clientWidth,
  }));

  // Tolerância de 1px para arredondamento de subpixel.
  expect(
    rolagem.larguraConteudo,
    "conteúdo mais largo que a janela ⇒ rolagem em dois eixos",
  ).toBeLessThanOrEqual(rolagem.larguraJanela + 1);
});

test("o rótulo de limitação institucional sobrevive ao reflow (HAZ-0046)", async ({ page }) => {
  // Deliberadamente NÃO usa `abrirAplicacao`: o banner de contexto é
  // permanente e independe de sessão, de rede e de qualquer estado de tela —
  // é justamente essa incondicionalidade que HAZ-0046 exige. Amarrar este
  // teste a uma carga bem-sucedida enfraqueceria o que ele prova.
  await page.goto("/");

  const banner = page.getByRole("note");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(/Registro limitado a esta instituição/);
  await expect(banner).toContainText(/CONSULTIVO/);
});

test("o estado de falha continua legível e acionável sob reflow", async ({ page }) => {
  await page.route("**/v1/projecoes/grade-leitos*", (rota) => rota.abort("connectionrefused"));
  await page.goto("/");

  const botao = page.getByRole("button", { name: /Tentar novamente/i });
  await expect(botao).toBeVisible();

  const caixa = await botao.boundingBox();
  expect(caixa).not.toBeNull();
  expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(24);

  const rolagem = await page.evaluate(() => ({
    larguraConteudo: document.documentElement.scrollWidth,
    larguraJanela: document.documentElement.clientWidth,
  }));
  expect(rolagem.larguraConteudo).toBeLessThanOrEqual(rolagem.larguraJanela + 1);
});
