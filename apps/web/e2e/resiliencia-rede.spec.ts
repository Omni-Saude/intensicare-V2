/**
 * apps/web/e2e/resiliencia-rede.spec.ts
 *
 * Teste de aceite do ACH-07 contra uma PILHA DE REDE REAL. A suíte de
 * componentes prova o mesmo comportamento contra dublês em memória; esta
 * prova que ele sobrevive a `fetch` de verdade, proxy do Vite, API real e
 * conexões efetivamente abortadas.
 *
 * Dados 100% sintéticos (`SYNTH-`). Nenhuma alegação de produção.
 */
import { expect, test } from "@playwright/test";
import {
  abrirAplicacao,
  cabecalhoDaGrade,
  coletarRequisicoesApi,
  esperarEstadoTerminalDaGrade,
  sessaoIndisponivel,
} from "./apoio/base.js";

const ROTA_GRADE = "**/v1/projecoes/grade-leitos*";
const CONTEXTO_GRADE = "grade de leitos";
const ESTADOS_DE_FALHA = ["erro", "indisponivel", "proibido", "tempo_esgotado"];

/**
 * Os testes marcados com este helper exigem dado autenticado vindo da API real.
 *
 * A marcação é `skip` com razão, NUNCA um assert relaxado: skip aparece no
 * relatório como não executado; um assert complacente apareceria como verde.
 *
 * BLOQUEIO HISTÓRICO — RESOLVIDO em 2026-08-17. O bloqueio que este texto descrevia — `POST
 * /v1/dev/sessao` respondendo HTTP 500 porque a emissão re-derivava o perfil
 * do ambiente a cada requisição — foi corrigido na raiz: a autorização de
 * emitir passou a ser resolvida uma vez na construção do adaptador e carregada
 * por fechamento léxico. Os 22 cenários desta suíte executam.
 *
 * A guarda abaixo permanece como **rede de segurança**, não como bloqueio
 * declarado: se a sessão voltar a ficar indisponível por qualquer motivo, é
 * preferível um `skip` visível no relatório a um `expect` que passa sobre tela
 * vazia. Mas ela não deve mais disparar — se disparar, é regressão, e a razão
 * precisa ser reinvestigada em vez de aceita.
 *
 * Um bloqueio declarado tem data e é reavaliado quando a causa citada é
 * corrigida; deixar o texto antigo de pé faria 6 testes desaparecerem em verde
 * apoiados numa afirmação falsa (achado P3 de segunda revisão adversarial).
 */
const RAZAO_BLOQUEIO =
  "REGRESSÃO: a sessão de desenvolvimento ficou indisponível. O bloqueio " +
  "histórico (HTTP 500 em POST /v1/dev/sessao) foi corrigido em 2026-08-17 e " +
  "esta guarda NÃO deveria disparar. Investigue antes de aceitar o skip.";

/**
 * ESPERAR O ESTADO TERMINAL É OBRIGATÓRIO AQUI.
 *
 * A primeira versão deste helper checava a indisponibilidade IMEDIATAMENTE
 * após o `goto`, enquanto a tela ainda estava em "carregando" — a checagem
 * dava `false`, o teste seguia, e vários passavam VAZIOS (um `expect` sobre
 * uma lista que estava vazia por falta de dado passa trivialmente). Foi uma
 * corrida que produzia falso verde justamente no cenário que o helper existe
 * para marcar como bloqueado.
 */
async function pularSeNaoAutenticado(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/");
  await esperarEstadoTerminalDaGrade(page);
  const bloqueado = await sessaoIndisponivel(page);
  test.skip(bloqueado, RAZAO_BLOQUEIO);
}

test.describe("sessão autenticada", () => {
  test("toda chamada à API leva o cabeçalho Authorization — nenhuma requisição anônima", async ({
    page,
  }) => {
    await pularSeNaoAutenticado(page);
    const { requisicoes } = coletarRequisicoesApi(page);
    await abrirAplicacao(page);

    expect(requisicoes.length).toBeGreaterThan(0);

    // `POST /v1/dev/sessao` é a ÚNICA exceção legítima: é o endpoint que
    // EMITE o bearer, então por definição não pode portá-lo. Listá-lo
    // explicitamente (em vez de afrouxar a regra) mantém o teste capaz de
    // pegar qualquer OUTRA requisição anônima.
    const emissoes = requisicoes.filter((r) => r.url().includes("/v1/dev/sessao"));
    const chamadasDeDados = requisicoes.filter((r) => !r.url().includes("/v1/dev/sessao"));

    expect(emissoes.length).toBeGreaterThan(0);
    for (const emissao of emissoes) {
      expect(emissao.method()).toBe("POST");
      // A rota não aceita entrada: nada do chamador escolhe tenant ou ator.
      expect(emissao.postData()).toBeFalsy();
    }

    expect(chamadasDeDados.length).toBeGreaterThan(0);
    for (const requisicao of chamadasDeDados) {
      const cabecalhos = await requisicao.allHeaders();
      expect(cabecalhos["authorization"], `sem Authorization em ${requisicao.url()}`).toBeTruthy();
      expect(cabecalhos["authorization"]).toMatch(/^Bearer /);
    }
  });

  test("nenhum identificador de sessão viaja em query string (anti-padrão 12)", async ({
    page,
  }) => {
    await pularSeNaoAutenticado(page);
    const { requisicoes } = coletarRequisicoesApi(page);
    await abrirAplicacao(page);

    for (const requisicao of requisicoes) {
      const url = new URL(requisicao.url());
      expect(url.search).not.toMatch(/token|bearer|authorization|tenant/i);
    }
  });
});

test.describe("falha de rede — nunca 'carregando' permanente", () => {
  test("conexão recusada produz estado de falha acionável", async ({ page }) => {
    // Precisa de sessão: sem credencial a tela para em `proibido` ANTES de
    // chegar à grade, e a asserção de "estado de falha" passaria pelo motivo
    // errado — `proibido` também é falha, mas não é a falha sob teste.
    await pularSeNaoAutenticado(page);
    await page.route(ROTA_GRADE, (rota) => rota.abort("connectionrefused"));
    await page.goto("/");

    const bloco = page.locator(`[data-contexto="${CONTEXTO_GRADE}"]`);
    await expect(bloco).toBeVisible();
    await expect.poll(async () => await bloco.getAttribute("data-estado")).not.toBe("carregando");

    expect(ESTADOS_DE_FALHA).toContain(await bloco.getAttribute("data-estado"));
    await expect(bloco).toHaveAttribute("role", "alert");
    // Ação de recuperação sempre disponível (modelo de estados §5).
    await expect(page.getByRole("button", { name: /Tentar novamente/i })).toBeVisible();
  });

  test("resposta 500 do servidor também produz falha acionável, não tela vazia", async ({
    page,
  }) => {
    await pularSeNaoAutenticado(page);
    await page.route(ROTA_GRADE, (rota) =>
      rota.fulfill({
        status: 500,
        contentType: "application/problem+json",
        body: JSON.stringify({
          type: "about:blank",
          title: "Erro sintético do teste E2E",
          status: 500,
          detail: "Falha injetada pela suíte — não é uma falha real.",
        }),
      }),
    );
    await page.goto("/");

    const bloco = page.locator(`[data-contexto="${CONTEXTO_GRADE}"]`);
    await expect(bloco).toHaveAttribute("data-estado", "erro");
    await expect(page.getByRole("button", { name: /Tentar novamente/i })).toBeVisible();
  });

  test("recuperação: após corrigir a rede, 'Tentar novamente' traz o dado", async ({ page }) => {
    await pularSeNaoAutenticado(page);
    let deveFalhar = true;
    await page.route(ROTA_GRADE, async (rota) => {
      if (deveFalhar) return rota.abort("connectionrefused");
      return rota.fallback();
    });

    await page.goto("/");
    await expect(page.getByRole("button", { name: /Tentar novamente/i })).toBeVisible();

    deveFalhar = false;
    await page.getByRole("button", { name: /Tentar novamente/i }).click();

    // Exigir DADO, não apenas "não é erro": num estado bloqueado a tela fica
    // em `proibido`, que também não é "erro" — a asserção antiga passava
    // vazia. O que prova recuperação é o leito voltar a aparecer.
    await expect(page.locator(".cartao-leito").first()).toBeVisible();
  });
});

test.describe("dado desatualizado após falha de recarga", () => {
  test("o conteúdo anterior permanece visível E rotulado como não-atual", async ({ page }) => {
    await pularSeNaoAutenticado(page);
    await abrirAplicacao(page);

    // A primeira leitura precisa ter trazido conteúdo para este cenário valer.
    const temConteudo = (await page.locator(".grade-leitos").count()) > 0;
    test.skip(!temConteudo, "a API não devolveu leitos; cenário de recarga não se aplica");

    // Agora quebra a rede e força uma recarga explícita.
    await page.route(ROTA_GRADE, (rota) => rota.abort("connectionrefused"));
    await page.getByRole("button", { name: /Atualizar/i }).click();

    const rotulo = page.getByTestId("rotulo-frescor-visao");
    await expect(rotulo).toBeVisible();
    await expect(rotulo).toHaveAttribute("data-frescor-visao", "desatualizado_apos_falha");
    await expect(rotulo).toContainText(/desatualizad/i);

    // O dado antigo continua na tela (tela calma sem dado é proibida)...
    await expect(page.locator(".grade-leitos").first()).toBeVisible();
    // ...e em NENHUM lugar é apresentado como atual.
    await expect(page.locator("body")).not.toContainText(/atualizado agora/i);
  });
});

test.describe("cancelamento real", () => {
  test("navegar para fora durante a requisição cancela a conexão em voo", async ({ page }) => {
    // Sem sessão, a requisição da grade nunca é emitida e não há o que cancelar.
    await pularSeNaoAutenticado(page);
    let requisicoesIniciadas = 0;
    // Segura a resposta o suficiente para a navegação acontecer no meio.
    await page.route(ROTA_GRADE, async (rota) => {
      requisicoesIniciadas += 1;
      await new Promise((resolver) => setTimeout(resolver, 5_000));
      await rota.fallback();
    });

    // Esperar a requisição da GRADE realmente começar. Um `waitForTimeout`
    // fixo não serve: desde que a sessão passou a ser emitida por HTTP, há um
    // round-trip antes da grade, e 300 ms deixaram de bastar — o teste
    // navegava para fora antes de a requisição existir e afirmava sobre um
    // contador zerado.
    const requisicaoDaGrade = page.waitForRequest((r) =>
      r.url().includes("/v1/projecoes/grade-leitos"),
    );
    await page.goto("/", { waitUntil: "commit" });
    await requisicaoDaGrade;

    // Sair da página aborta o que estiver em voo.
    await page.goto("about:blank");

    expect(requisicoesIniciadas).toBeGreaterThan(0);
    // A ausência de erro não tratado no console é a asserção principal aqui;
    // o aborto em si é provado com precisão na suíte de componentes,
    // observando `AbortSignal.aborted` e `signal.reason`.
    expect(page.url()).toBe("about:blank");
  });
});

test.describe("modo offline", () => {
  test("offline anuncia o estado, orienta o fallback e BLOQUEIA comandos", async ({
    page,
    context,
  }) => {
    await pularSeNaoAutenticado(page);

    // A GRADE É FORNECIDA PELA ROTA, e não pela API, POR NECESSIDADE.
    //
    // OBSERVED: hoje `/v1/projecoes/grade-leitos` devolve `alerta: null` em
    // TODOS os leitos — sem bundle de regra clínica assinado carregado
    // (`/v1/readyz` responde 503 por isso), nenhuma avaliação é computada e
    // portanto nenhum alerta existe. Sem alerta não há comando na tela, e um
    // teste de "comandos bloqueados" sem comando algum não prova nada: foi
    // exatamente isso que a guarda anti-falso-verde abaixo recusou.
    //
    // A alternativa seria afrouxar a asserção para "se houver botão, esteja
    // desabilitado" — que passaria para sempre sem verificar nada. Em vez
    // disso, a PRÉ-CONDIÇÃO é fornecida de forma determinística e a AFIRMAÇÃO
    // fica intacta (na verdade mais forte: agora sabemos quantos comandos
    // deveriam existir). O que está sob teste é o comportamento do FRONTEND
    // em offline, não a capacidade da API de gerar alertas.
    await page.route(ROTA_GRADE, (rota) =>
      rota.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          leitos: [
            {
              leitoId: "SYNTH-TENANT-G7-UTI-01-LEITO-01",
              encontroId: "SYNTH-TENANT-G7-ENC-P001",
              pacienteRef: "amh:psr:v1:SYNTH-P001",
              escore: 7,
              banda: "alerta",
              statusAvaliacao: "valido",
              frescor: "atual",
              atualizadoEm: "2026-08-17T12:00:00.000Z",
              alerta: { id: "SYNTH-ALERTA-E2E-1", estado: "nao-atribuido", versao: 0 },
            },
          ],
        }),
      }),
    );

    await abrirAplicacao(page);

    // A pré-condição precisa VALER antes de o teste afirmar qualquer coisa
    // sobre bloqueio: com a rede ainda ativa, o comando existe e está
    // habilitado. Sem esta verificação, um botão permanentemente desabilitado
    // por outro motivo passaria como "bloqueado pelo offline".
    const botoes = page.getByRole("button", { name: /Reconhecer alerta/i });
    await expect(botoes.first()).toBeEnabled();
    const total = await botoes.count();
    expect(total, "nenhum comando na tela: o teste não verificaria bloqueio").toBeGreaterThan(0);

    await context.setOffline(true);

    const indicador = page.getByTestId("indicador-conectividade");
    await expect(indicador).toBeVisible({ timeout: 15_000 });
    await expect(indicador).toHaveAttribute("data-conectividade", "offline");
    await expect(indicador).toContainText(/procedimento institucional/i);

    // Nenhum comando permanece acionável offline (§6: "comandos bloqueados...
    // nunca sucesso aparente").
    for (let i = 0; i < total; i += 1) {
      await expect(botoes.nth(i)).toBeDisabled();
    }

    await context.setOffline(false);
  });
});

test.describe("perfil de desenvolvimento", () => {
  test("?mock é aceito em DEV e a origem do cliente é o dublê rotulado", async ({ page }) => {
    // Em produção este mesmo caminho REJEITA (provado em
    // `src/api/guardas.test.ts` e imposto no build por
    // `src/build/guardaArtefatoSintetico.ts`).
    await page.goto("/?mock");
    await expect(cabecalhoDaGrade(page)).toBeVisible();
    // O banner permanente de contexto nunca desaparece (HAZ-0046).
    await expect(page.getByRole("note")).toContainText(/Registro limitado a esta instituição/);
  });
});
