/**
 * apps/web/playwright.config.ts — suíte E2E de NAVEGADOR REAL (ACH-07).
 *
 * POR QUE ESTA SUÍTE EXISTE. jsdom não computa cor, layout nem viewport, o
 * que torna estruturalmente inverificáveis por lá quatro critérios WCAG que
 * esta fatia precisa cobrir (1.4.3, 1.4.10, 1.4.11, 2.5.8 — ver
 * `src/a11y/matrizAcessibilidade.ts`). Além disso, uma tela clínica que
 * depende de rejeição de rede tratada precisa ser exercitada contra uma pilha
 * de rede de verdade, não contra um dublê que resolve promessas em memória.
 *
 * AUTENTICAÇÃO. A sessão de desenvolvimento é sintética e vive em memória do
 * processo do navegador (`src/api/sessaoDesenvolvimento.ts`), portanto NÃO há
 * `storageState` a persistir: cada teste sobe uma sessão nova ao carregar a
 * página, e os testes AFIRMAM que as requisições saem com `Authorization`.
 * Quando `ic-identidade-auth` entregar o provedor real, este arquivo ganha um
 * `globalSetup` que faz login uma vez e grava `storageState` — o ponto de
 * extensão está marcado abaixo.
 *
 * Sobe DOIS servidores: a API (`apps/api`, porta 3000) e o dev server do Vite
 * (porta 5173, que faz proxy de `/v1/*` para a API). Dados 100% sintéticos.
 */
import { defineConfig, devices } from "@playwright/test";

const PORTA_WEB = 5173;
const PORTA_API = 3000;
const URL_BASE = `http://localhost:${PORTA_WEB}`;

export default defineConfig({
  testDir: "./e2e",
  // Em falha de rede simulada há esperas reais; o limite acompanha a política
  // do workspace (ver `vitest.shared.ts`, mesma justificativa).
  timeout: 30_000,
  expect: { timeout: 10_000 },

  // `forbidOnly` impede que um `.only` esquecido faça a suíte passar
  // executando um único teste — falso-verde silencioso (THR-0055).
  forbidOnly: Boolean(process.env["CI"]),
  retries: 0, // nova tentativa mascara instabilidade; queremos vê-la.
  workers: 1, // API e banco sintéticos compartilhados: sem paralelismo.

  reporter: [["list"], ["json", { outputFile: "e2e-resultado.json" }]],

  use: {
    baseURL: URL_BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "pt-BR",
  },

  projects: [
    {
      name: "chromium-padrao",
      use: { ...devices["Desktop Chrome"] },
      // Sem `testIgnore`, o projeto padrão também executaria os specs de
      // reflow e de movimento reduzido — que só fazem sentido sob o viewport
      // de 320px e sob `reducedMotion: "reduce"`. Eles falhavam aqui por
      // rodar no ambiente errado, não por defeito do produto.
      testIgnore: [/reflow\.spec\.ts/, /movimento-reduzido\.spec\.ts/],
    },
    {
      // Projeto dedicado a reflow/zoom (WCAG 1.4.10): 320 CSS px de largura
      // equivalem a 400% de zoom em 1280px.
      name: "chromium-reflow-320",
      use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 720 } },
      testMatch: /reflow\.spec\.ts/,
    },
    {
      // Projeto dedicado a `prefers-reduced-motion` (WCAG 2.3.3).
      //
      // A preferência NÃO é declarada aqui: OBSERVED que `use.reducedMotion`
      // não surtia efeito nesta versão (a página seguia reportando
      // `no-preference`). O spec emula explicitamente via `emulateMedia` e
      // AFIRMA que a emulação pegou. Declarar a opção aqui além disso daria a
      // impressão falsa de que é ela que garante o comportamento.
      name: "chromium-movimento-reduzido",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /movimento-reduzido\.spec\.ts/,
    },
  ],

  webServer: [
    {
      // `PERFIL` é OBRIGATÓRIO e sem default: a API aborta a inicialização
      // antes de abrir a porta se ele faltar (ADR-0019 §5.2 P4, fail-closed).
      // `dev-synthetic` é o perfil que admite adaptador sintético — e portanto
      // o único em que `POST /v1/dev/sessao` chega a ser registrado.
      //
      // O comando passa pelo supervisor `scripts/api-webserver.mjs` (MAJ-1).
      // O runner é `tsx src/index.ts` SEM watch (via argv; `apps/api/package.json`
      // não muda): na execução 1 da unidade 2 ficou PROVADO que o `tsx watch`
      // engole a morte do próprio filho — o watcher sobrevive ocioso, a porta
      // 3000 fica permanentemente fechada (ECONNREFUSED) e nem um sinal é
      // anunciado. Sem watch, a morte sobe na hora ao supervisor, que registra
      // SPAWN/EXITED/RESTART (código ou SINAL) em `test-results/api-webserver.log`,
      // reinicia com limite e propagaria o encerramento ao grupo do processo.
      // O caminho do log já está coberto pelo padrão `test-results/` do `.gitignore`.
      command:
        "PERFIL=dev-synthetic node apps/web/scripts/api-webserver.mjs --cwd apps/api node_modules/.bin/tsx src/index.ts",
      // Liveness, NÃO readiness. `/v1/readyz` responde 503 PERMANENTE neste
      // estado (sem bundle GCS, sem alvo de frescor validado) — é o retrato
      // honesto, não um defeito. Usá-lo como sonda faria o servidor "nunca
      // subir" para o Playwright. Liveness prova apenas que o processo
      // responde, que é o que este `webServer` precisa saber (ADR-0020;
      // anti-padrão 10 do contrato comum: as três superfícies são distintas).
      url: `http://localhost:${PORTA_API}/v1/livez`,
      reuseExistingServer: !process.env["CI"],
      timeout: 120_000,
      cwd: "../..",
    },
    {
      command: "pnpm --filter @intensicare/web dev",
      url: URL_BASE,
      reuseExistingServer: !process.env["CI"],
      timeout: 120_000,
      cwd: "../..",
    },
  ],
});
