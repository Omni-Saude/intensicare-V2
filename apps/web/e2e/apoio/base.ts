/**
 * apps/web/e2e/apoio/base.ts — utilitários da suíte E2E.
 *
 * AUTENTICAÇÃO. A sessão de desenvolvimento é obtida em runtime pelo próprio
 * app, de `POST /v1/dev/sessao`, e vive só em memória — não há `storageState`
 * a persistir. Quando houver IdP real, este arquivo ganha um `globalSetup` que
 * faz login uma vez; os testes não mudam, porque já dependem apenas de "a
 * página está autenticada".
 *
 * BLOQUEIO HISTÓRICO, RESOLVIDO em 2026-08-17 — preservado como registro, não
 * como estado corrente. `POST /v1/dev/sessao` respondia HTTP 500 porque
 * `emitirTokenSintetico` re-derivava o perfil do ambiente a cada requisição,
 * por uma função que lê apenas `INTENSICARE_PERFIL` e `NODE_ENV`, nunca
 * `PERFIL`. A correção de raiz fez a autorização de emitir ser resolvida uma
 * vez na CONSTRUÇÃO do adaptador e carregada por fechamento léxico.
 *
 * Vale registrar por que o defeito sobreviveu a um gate verde: o vitest define
 * `NODE_ENV=test` por conta própria, satisfazendo a guarda por um caminho que o
 * processo real não tem. `pnpm verify` ficava verde com o defeito presente. Ele
 * só apareceu ao dirigir um navegador contra um servidor real — é o argumento
 * concreto para esta suíte existir e rodar num gate bloqueante.
 */
import { expect, type Page, type Request } from "@playwright/test";

export const SELETOR_BLOCO_ESTADO = "[data-contexto]";

/** Cabeçalho da TELA de grade (o `<h2>`), não o título da casca (`<h1>`). */
export function cabecalhoDaGrade(pagina: Page) {
  return pagina.getByRole("heading", { name: "Grade de leitos", exact: true });
}

/**
 * Registra todas as requisições à API e devolve um coletor. Usado para provar
 * que a sessão é REAL (o cabeçalho `Authorization` sai em toda chamada) e que
 * nenhuma requisição anônima escapa.
 */
export function coletarRequisicoesApi(pagina: Page): { requisicoes: Request[] } {
  const requisicoes: Request[] = [];
  pagina.on("request", (requisicao) => {
    if (requisicao.url().includes("/v1/")) requisicoes.push(requisicao);
  });
  return { requisicoes };
}

/**
 * Abre a aplicação autenticada e espera a primeira leitura terminar.
 *
 * "Terminar" aqui significa SAIR de `carregando` — para qualquer estado
 * terminal, inclusive falha. Um helper que esperasse por sucesso esconderia
 * exatamente os cenários que esta suíte precisa observar.
 */
export async function abrirAplicacao(pagina: Page, caminho = "/"): Promise<void> {
  await pagina.goto(caminho);

  // Diagnóstico ANTES do assert. Se a API rejeitar a credencial, o app faz a
  // coisa certa (bloqueia a tela clínica e declara `Sessão expirada`), mas o
  // teste falharia com "element(s) not found" — uma mensagem que aponta para
  // o seletor em vez de apontar para a causa. Uma suíte que mente sobre o
  // motivo da falha custa mais tempo do que uma que não existe.
  await esperarEstadoTerminalDaGrade(pagina);

  if (await sessaoIndisponivel(pagina)) {
    const estadoSessao = await pagina
      .getByTestId("aviso-sessao")
      .getAttribute("data-sessao")
      .catch(() => null);
    throw new Error(
      "A aplicação não pôde autenticar contra a API" +
        (estadoSessao === null
          ? " (não obteve credencial: o emissor de sessão não respondeu com token)."
          : `: estado de sessão "${estadoSessao}".`) +
        " O app está se comportando como projetado — fail-closed, sem exibir dado de " +
        "paciente e sem emitir requisição anônima. Ver a rubrica EM ABERTO do handoff " +
        "do ACH-07.",
    );
  }

  // `exact: true` é obrigatório: o `<h1>` da casca ("IntensiCare V2 — Grade de
  // leitos (fatia sintética)") e o `<h2>` da tela ("Grade de leitos") casariam
  // ambos com uma expressão regular parcial, e o modo estrito do Playwright
  // falha com dois resultados.
  await expect(cabecalhoDaGrade(pagina)).toBeVisible();
}

/**
 * Abre a aplicação em NAVEGADOR REAL com o cliente mock de desenvolvimento
 * (`?mock`), sem depender da API.
 *
 * POR QUE ESTE CAMINHO EXISTE (e por que não é um atalho preguiçoso).
 * Enquanto o emissor de sessão da API responder 500 (ver o bloqueio no topo
 * deste arquivo), nenhuma tela consegue dado autenticado. Este caminho mantém
 * verificável tudo que NÃO depende da API.
 *
 * O que este caminho preserva: navegador real, DOM real, CSS real cascateado,
 * layout real, foco real, teclado real — tudo que jsdom não computa e que é a
 * razão de existir desta suíte. O que ele NÃO cobre: a pilha de rede até a
 * API. Os testes que precisam disso vivem em `resiliencia-rede.spec.ts` e
 * declaram o bloqueio explicitamente, em vez de fingir cobertura.
 */
export async function abrirAplicacaoComDubleDeDesenvolvimento(pagina: Page): Promise<void> {
  await pagina.goto("/?mock");
  await expect(cabecalhoDaGrade(pagina)).toBeVisible();
  // Mesma razão de `abrirAplicacao`: o bootstrap é assíncrono, e um poll
  // ingênuo por "diferente de carregando" se satisfaz com a tela ainda vazia.
  await esperarEstadoTerminalDaGrade(pagina);
}

/**
 * `true` quando a aplicação NÃO conseguiu autenticar contra a API. Usado para
 * marcar como BLOQUEADO (skip com razão), nunca como verde, os testes que
 * exigem dado autenticado. Skip aparece no relatório; um `expect` complacente
 * não apareceria.
 */
export async function sessaoIndisponivel(pagina: Page): Promise<boolean> {
  // Dois sintomas distintos, ambos significando "não autenticado":
  //
  //  - `aviso-sessao`: o provedor DECLAROU a sessão expirada (a API rejeitou
  //    a credencial, ou o perfil não emite sessão sintética — 404).
  //  - bloco de estado `proibido`: o provedor não conseguiu OBTER credencial
  //    (o emissor respondeu 5xx), então o cliente HTTP recusou a chamada sem
  //    emitir requisição anônima. A sessão segue "ativa" — não há o que
  //    expirar — e por isso o primeiro sintoma não aparece.
  //
  // Checar só o primeiro deixaria os testes FALHAREM por indisponibilidade do
  // backend em vez de os marcar como bloqueados, que é uma leitura errada de
  // onde está o problema.
  return await pagina.evaluate(
    () =>
      document.querySelector('[data-testid="aviso-sessao"]') !== null ||
      document.querySelector('[data-estado="proibido"]') !== null,
  );
}

/** Estados de tela que ainda não são resultado — a tela segue em movimento. */
const ESTADOS_NAO_TERMINAIS = new Set(["indefinido", "carregando", "retentando"]);

/**
 * Espera a grade chegar a um estado TERMINAL e o devolve.
 *
 * POR QUE NÃO BASTA `expect.poll(estadoDaTela).not.toBe("carregando")`.
 * Durante o bootstrap assíncrono (`main.tsx` resolve perfil, sessão e cliente
 * antes de montar a árvore) NÃO EXISTE bloco de estado no DOM, e
 * `estadoDaTela` devolve `null`. Um poll por "diferente de carregando"
 * satisfaz-se com esse `null` na primeira tentativa e retorna antes de a tela
 * existir — foi essa corrida que fez a detecção de bloqueio falhar e vários
 * testes rodarem contra uma página ainda vazia.
 *
 * Aqui `null` só conta como terminal quando há conteúdo renderizado (cartões
 * de leito); caso contrário é "indefinido" e o poll continua.
 */
export async function esperarEstadoTerminalDaGrade(pagina: Page): Promise<string> {
  async function ler(): Promise<string> {
    const { estado, cartoes } = await lerInstantaneoDaGrade(pagina);
    if (estado !== null) return estado;
    return cartoes > 0 ? "pronto" : "indefinido";
  }

  await expect
    .poll(async () => ESTADOS_NAO_TERMINAIS.has(await ler()), {
      message: "a grade nunca chegou a um estado terminal",
    })
    .toBe(false);

  return await ler();
}

/**
 * Lê, num ÚNICO instantâneo do DOM, o estado da grade e a contagem de cartões.
 *
 * DEFEITO CORRIGIDO AQUI (era a causa da intermitência da suíte). A versão
 * anterior fazia DUAS chamadas ao navegador: `locator.count()` e, se houvesse
 * elemento, `locator.getAttribute()`. Entre as duas, o React podia
 * re-renderizar e o bloco de estado DESAPARECER — que é exatamente o que
 * acontece na transição para `pronto`, quando `EstadoTela` deixa de renderizar
 * o bloco e passa a renderizar os filhos. Nesse instante `getAttribute`
 * bloqueia ESPERANDO um elemento que nunca mais vai existir, e como não há
 * timeout de ação configurado, a chamada nunca retorna: o poll estourava os
 * 10 s com a página inteira já carregada. O sintoma ("a grade nunca chegou a
 * um estado terminal") acusava o produto por um defeito do observador.
 *
 * Um `evaluate` só lê tudo do mesmo instante e NUNCA espera por elemento.
 */
export async function lerInstantaneoDaGrade(
  pagina: Page,
): Promise<{ estado: string | null; cartoes: number }> {
  return await pagina.evaluate(() => {
    const bloco = document.querySelector('[data-contexto="grade de leitos"]');
    return {
      estado: bloco === null ? null : bloco.getAttribute("data-estado"),
      cartoes: document.querySelectorAll(".cartao-leito").length,
    };
  });
}

/**
 * Lê o identificador de estado corrente de uma tela, se houver bloco de
 * estado. Mesma razão do instantâneo acima: uma leitura, sem espera.
 */
export async function estadoDaTela(pagina: Page, contexto: string): Promise<string | null> {
  return await pagina.evaluate((ctx) => {
    const bloco = document.querySelector(`[data-contexto="${ctx}"]`);
    return bloco === null ? null : bloco.getAttribute("data-estado");
  }, contexto);
}
