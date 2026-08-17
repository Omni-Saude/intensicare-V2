/**
 * apps/web/e2e/movimento-reduzido.spec.ts — WCAG 2.2 SC 2.3.3.
 *
 * Roda no projeto `chromium-movimento-reduzido` (`reducedMotion: "reduce"`).
 *
 * O que este teste realmente afirma: com a preferência do sistema declarada,
 * nenhum elemento da tela executa animação ou transição de duração
 * perceptível. Hoje a fatia não tem animação alguma, então o teste é uma
 * TRAVA DE REGRESSÃO — ele falha no dia em que alguém acrescentar uma
 * transição sem respeitar a preferência.
 *
 * Isso importa numa tela clínica por uma razão específica: movimento é um dos
 * gatilhos de desconforto vestibular, e uma tela de vigilância é olhada por
 * turnos inteiros.
 */
import { expect, test } from "@playwright/test";

const DURACAO_MAXIMA_SEGUNDOS = 0.05;

/**
 * A preferência é emulada AQUI, e não pela opção `reducedMotion` do projeto
 * em `playwright.config.ts`.
 *
 * OBSERVED (2026-08-17, Playwright 1.62.1): com `use: { ...devices["Desktop
 * Chrome"], reducedMotion: "reduce" }`, `matchMedia("(prefers-reduced-motion:
 * reduce)").matches` respondia `false` dentro da página — a opção não surtia
 * efeito. Com `page.emulateMedia({ reducedMotion: "reduce" })`, responde
 * `true`. O teste passaria de qualquer forma (esta fatia não tem animação
 * alguma), e é exatamente por isso que o verde sem emulação seria VAZIO: não
 * estaria provando nada sobre a preferência. O meta-teste no fim do arquivo
 * existe para que essa diferença nunca volte a passar despercebida.
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("com prefers-reduced-motion, nenhum elemento anima de forma perceptível", async ({ page }) => {
  // A varredura é sobre a folha de estilo aplicada a TODOS os elementos
  // renderizados; ela não depende de a carga de dados ter tido sucesso, e
  // amarrá-la a isso só acrescentaria uma causa de falha alheia ao critério.
  await page.goto("/");
  await expect(page.getByRole("note")).toBeVisible();

  const infratores = await page.evaluate((limite) => {
    function paraSegundos(valor: string): number {
      const primeiro = valor.split(",")[0]?.trim() ?? "0s";
      if (primeiro.endsWith("ms")) return Number.parseFloat(primeiro) / 1000;
      return Number.parseFloat(primeiro) || 0;
    }

    const encontrados: string[] = [];
    for (const elemento of Array.from(document.querySelectorAll("*"))) {
      const estilo = globalThis.getComputedStyle(elemento);
      const duracaoTransicao = paraSegundos(estilo.transitionDuration);
      const duracaoAnimacao = paraSegundos(estilo.animationDuration);
      const temAnimacao = estilo.animationName !== "none" && duracaoAnimacao > limite;
      if (duracaoTransicao > limite || temAnimacao) {
        encontrados.push(
          `${elemento.tagName}.${elemento.className || "(sem classe)"} ` +
            `transition=${estilo.transitionDuration} animation=${estilo.animationDuration}`,
        );
      }
    }
    return encontrados;
  }, DURACAO_MAXIMA_SEGUNDOS);

  expect(infratores).toEqual([]);
});

test("a preferência é de fato aplicada pelo navegador nesta execução", async ({ page }) => {
  // Sem esta verificação, o teste acima passaria trivialmente caso o projeto
  // do Playwright deixasse de aplicar `reducedMotion` — um verde vazio.
  await page.goto("/");
  const aplicada = await page.evaluate(
    () => globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  expect(aplicada, "o projeto não aplicou prefers-reduced-motion").toBe(true);
});
