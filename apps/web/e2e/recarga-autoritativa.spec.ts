/**
 * apps/web/e2e/recarga-autoritativa.spec.ts
 *
 * Teste de aceite de LAC-L1 e LAC-L2 em NAVEGADOR REAL, contra a API real.
 *
 * O que só este arquivo consegue provar, e a suíte de componentes não:
 *   1. que o ciclo de recarga roda com o RELÓGIO REAL do navegador — a suíte de
 *      componentes injeta o relógio de propósito, e um erro de unidade (30 s
 *      escritos como 30 ms, ou vice-versa) passaria despercebido lá;
 *   2. que a requisição periódica de fato SAI pela pilha de rede, atravessa o
 *      proxy do Vite e chega à API — não apenas que um dublê foi chamado;
 *   3. que `/v1/readyz` responde 503 DE VERDADE nesta instalação e que a razão
 *      codificada que a API emite chega à tela clínica.
 *
 * O 503 de `/v1/readyz` NÃO é defeito a contornar: é o retrato honesto do
 * safety case M0 (sem bundle RULE-GCS, nenhum alvo de frescor validado — Gate
 * G1). Este teste afirma que ele é EXIBIDO, não que ele desaparece.
 *
 * Dados 100% sintéticos (`SYNTH-`). Nenhuma alegação de produção.
 */
import { expect, type Page, test } from "@playwright/test";
import { abrirAplicacao, esperarEstadoTerminalDaGrade, sessaoIndisponivel } from "./apoio/base.js";

/**
 * PREMISSA acoplada a `INTERVALO_RECARGA_PADRAO_MS` em
 * `src/estado/recursoRemoto.ts` (30 s, reversível, não é SLO). Este teste
 * espera pouco mais que um ciclo. Se a premissa mudar lá, este número muda
 * junto — e é deliberado que ele seja um espelho explícito, e não um `sleep`
 * anônimo: quem alterar a cadência precisa ver que existe um teste que a
 * observa em tempo real.
 */
const ESPERA_DE_UM_CICLO_MS = 45_000;

const RAZAO_BLOQUEIO =
  "REGRESSÃO: a sessão de desenvolvimento ficou indisponível. Investigue antes " +
  "de aceitar o skip — o bloqueio histórico foi corrigido em 2026-08-17.";

async function pularSeNaoAutenticado(page: Page): Promise<void> {
  await page.goto("/");
  await esperarEstadoTerminalDaGrade(page);
  test.skip(await sessaoIndisponivel(page), RAZAO_BLOQUEIO);
}

test.describe("LAC-L1 — a tela deixa de ser um instantâneo (navegador real)", () => {
  test("sem interação nenhuma, a projeção é RELIDA pela rede", async ({ page }) => {
    // Um ciclo de 30 s não cabe no limite padrão de 30 s por teste.
    test.setTimeout(150_000);
    await pularSeNaoAutenticado(page);

    const leiturasDaProjecao: string[] = [];
    page.on("request", (requisicao) => {
      if (requisicao.url().includes("/v1/projecoes/grade-leitos")) {
        leiturasDaProjecao.push(requisicao.url());
      }
    });

    await abrirAplicacao(page);

    // GUARDA DE NÃO-VACUIDADE (a): sem a primeira leitura, "cresceu" não
    // significaria nada.
    await expect
      .poll(() => leiturasDaProjecao.length, {
        timeout: 15_000,
        message: "a primeira leitura da projeção nunca saiu pela rede",
      })
      .toBeGreaterThanOrEqual(1);
    const antes = leiturasDaProjecao.length;

    // O rótulo de idade existe e carrega a idade em milissegundos.
    const rotuloIdade = page.getByTestId("rotulo-idade-visao");
    await expect(rotuloIdade).toBeVisible();
    const idadeInicial = Number(await rotuloIdade.getAttribute("data-idade-ms"));
    expect(Number.isFinite(idadeInicial)).toBe(true);

    // GUARDA DE NÃO-VACUIDADE (b): NENHUM clique acontece daqui em diante.
    // O único ator é o tempo.
    await expect
      .poll(() => leiturasDaProjecao.length, {
        timeout: ESPERA_DE_UM_CICLO_MS,
        intervals: [2_000],
        message: "a projeção não foi relida sozinha: a tela continua sendo um instantâneo (LAC-L1)",
      })
      .toBeGreaterThan(antes);

    // O botão "Atualizar" segue lá e segue sendo do usuário — a recarga
    // automática não o substitui nem o dispara.
    await expect(page.getByRole("button", { name: /Atualizar/i })).toBeVisible();
  });

  test("a idade da visão é exibida em texto factual, sem adjetivo de suficiência", async ({
    page,
  }) => {
    await pularSeNaoAutenticado(page);
    await abrirAplicacao(page);

    const texto = page.getByTestId("idade-visao-texto");
    await expect(texto).toBeVisible();
    await expect(texto).toContainText(/Última leitura bem-sucedida há \d+/);
    await expect(texto).toContainText(/Releitura automática a cada/);

    // Nada de juízo de suficiência — janelas de frescor são VAL-0023,
    // `VALIDATION REQUIRED`, e não pertencem a esta camada.
    await expect(texto).not.toContainText(/recente|há pouco|atualizado agora/i);
  });
});

test.describe("LAC-L2 — a degradação declarada por /v1/readyz chega ao ponto de uso", () => {
  test("readyz responde 503 REAL e a razão CODIFICADA aparece na tela clínica", async ({
    page,
  }) => {
    await pularSeNaoAutenticado(page);

    const statusDeProntidao: number[] = [];
    const prontidaoComCredencial: string[] = [];
    page.on("response", (resposta) => {
      if (!resposta.url().includes("/v1/readyz")) return;
      statusDeProntidao.push(resposta.status());
      const cabecalhos = resposta.request().headers();
      if (cabecalhos.authorization !== undefined) {
        prontidaoComCredencial.push(resposta.url());
      }
    });

    await abrirAplicacao(page);

    // GUARDA DE NÃO-VACUIDADE: o 503 precisa ter vindo do SERVIDOR nesta
    // execução; sem isso o aviso na tela poderia estar aí por outro motivo.
    await expect
      .poll(() => statusDeProntidao.length, {
        timeout: 15_000,
        message: "a tela clínica não consultou /v1/readyz",
      })
      .toBeGreaterThan(0);
    expect(
      statusDeProntidao,
      "esperado 503 permanente (M0: sem bundle RULE-GCS, sem alvo de frescor validado)",
    ).toContain(503);

    // A sonda é anônima por contrato (`security: []`).
    expect(prontidaoComCredencial).toEqual([]);

    const aviso = page.getByTestId("aviso-prontidao");
    await expect(aviso).toBeVisible();
    await expect(aviso).toHaveAttribute("data-status-http", "503");
    // O CÓDIGO do vocabulário fechado aparece — não um texto genérico.
    await expect(aviso.locator('[data-codigo-razao="rule_bundle_unavailable"]')).toHaveCount(1);
    await expect(aviso).toContainText("rule_bundle_unavailable");

    // E a degradação qualifica a tela inteira, no ponto de uso clínico
    // (SAF-0025: painel de operador não satisfaz o requisito).
    const indicador = page.getByTestId("indicador-conectividade");
    await expect(indicador).toBeVisible();
    await expect(indicador).toHaveAttribute("data-conectividade", "degradado");
    await expect(indicador).toContainText(/procedimento institucional/i);

    // A tela clínica CONTINUA visível: a degradação qualifica, não apaga.
    await expect(page.getByRole("heading", { name: "Grade de leitos", exact: true })).toBeVisible();
  });

  test("o detalhe do paciente também declara a prontidão do serviço", async ({ page }) => {
    await pularSeNaoAutenticado(page);
    await abrirAplicacao(page);

    const cartao = page.locator(".cartao-leito").first();
    test.skip(
      (await page.locator(".cartao-leito").count()) === 0,
      "a API não devolveu leitos; o caminho de detalhe não se aplica",
    );
    await cartao.click();

    const aviso = page.getByTestId("aviso-prontidao");
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText("rule_bundle_unavailable");
  });
});
