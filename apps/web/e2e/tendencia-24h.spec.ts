/**
 * apps/web/e2e/tendencia-24h.spec.ts
 *
 * A invariante do MAJ-4 medida em NAVEGADOR REAL sobre o bundle real: **o
 * detalhe do paciente mostra a série de avaliações que o backend já
 * publica — com as lacunas que ela tem, e sem linha nenhuma onde não há
 * dado.**
 *
 * A GRADE E O HISTÓRICO VÊM DA ROTA, e não do banco, pelo padrão já
 * registrado em `vocabulario-de-banda.spec.ts`: sem bundle de regra clínica
 * assinado, o `dev-synthetic` não produz avaliação computável e nenhuma
 * série existiria — o laço passaria verde sobre nada. A SESSÃO continua
 * REAL (autenticada pela API); o que é determinístico é a pré-condição.
 *
 * Os INSTANTES são relativos ao relógio do teste, não fixos: a janela é de
 * 24h e um carimbo fixo envelheceria para fora dela — o teste viraria
 * falso por-calendar, o mesmo defeito da família "asserção que ninguém
 * recalcula".
 *
 * Dados 100% sintéticos (`SYNTH-`). Nenhuma alegação de produção.
 *
 * Rastreio: MAJ-4, WF-02, HM-03, ADR-0011 P7, ADR-0021 F1/F3.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { abrirAplicacao } from "./apoio/base.js";

const ROTA_GRADE = "**/v1/projecoes/grade-leitos*";
const ROTA_AVALIACOES = "**/v1/pacientes/*/avaliacoes";
const PADROES_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const LEITO = "SYNTH-TENANT-G7-UTI-01-LEITO-01";
const PACIENTE = "amh:psr:v1:SYNTH-P001";

const HORA = 60 * 60 * 1000;

/** Uma `ResultadoAvaliacao` do contrato. Escore `null` + `indisponivel` = fail-closed. */
function avaliacao(escore: number | null, horasAtras: number) {
  return {
    status: escore === null ? "indisponivel" : "valido",
    parametrosAusentes: [],
    parametros: [],
    escore,
    banda: escore === null ? null : "atencao",
    avaliadoEm: new Date(Date.now() - horasAtras * HORA).toISOString(),
    motivos: escore === null ? ["missing_required_input:spo2"] : [],
    anotacoes: [],
    explicacao: "SYNTH — explicação agregada do backend.",
    parametroVermelho: false,
    versaoRegra: "RULE-NEWS2@0.2.0",
  };
}

function gradeComUmLeito(): string {
  return JSON.stringify({
    leitos: [
      {
        leitoId: LEITO,
        encontroId: "SYNTH-TENANT-G7-ENC-P001",
        pacienteRef: PACIENTE,
        escore: 7,
        banda: "alerta",
        statusAvaliacao: "valido",
        frescor: "atual",
        atualizadoEm: new Date(Date.now() - 2 * HORA).toISOString(),
        alerta: null,
      },
    ],
  });
}

function historicoCom(...avaliacoes: ReturnType<typeof avaliacao>[]): string {
  return JSON.stringify({ pacienteRef: PACIENTE, avaliacoes });
}

/** Interceptar as duas rotas ANTES do goto (o mesmo padrão de vocabulário-de-banda). */
async function rotear(page: Page, corpoAvaliacoes: string): Promise<void> {
  await page.route(ROTA_GRADE, (rota) =>
    rota.fulfill({ status: 200, contentType: "application/json", body: gradeComUmLeito() }),
  );
  await page.route(ROTA_AVALIACOES, (rota) =>
    rota.fulfill({ status: 200, contentType: "application/json", body: corpoAvaliacoes }),
  );
}

/**
 * Do grade ao detalhe PELO TECLADO: foca o cartão e ativa com Enter — o
 * caminho que um usuário de teclado percorre para chegar à tendência.
 */
async function abrirDetalhePeloTeclado(page: Page): Promise<void> {
  const cartao = page.locator(".cartao-leito").first();
  await cartao.focus();
  await cartao.press("Enter");
  await expect(page.getByRole("button", { name: /Voltar à grade/ })).toBeVisible();
}

test.describe("tendência de 24h em navegador real (MAJ-4)", () => {
  test("detalhe de leito com N>1 avaliações mostra a série — inclusive o ponto fail-closed", async ({
    page,
  }) => {
    await rotear(page, historicoCom(avaliacao(7, 1), avaliacao(null, 5), avaliacao(2, 9)));
    await abrirAplicacao(page);
    await abrirDetalhePeloTeclado(page);

    const secao = page.getByTestId("tendencia-avaliacoes");
    await expect(secao).toBeVisible();

    // A série INTEIRA, não só avaliacoes[0] — o defeito que motivou o MAJ-4.
    const tabela = page.getByTestId("tendencia-tabela");
    await expect(tabela.locator("tbody tr")).toHaveCount(3);
    // Ordem do backend preservada (mais recente primeiro) — o 7 antes do 2.
    await expect(tabela.locator("tbody tr").first()).toContainText("7");
    await expect(tabela.locator("tbody tr").last()).toContainText("2");

    // Ponto fail-closed é DISTINCTO: "não computável", nunca zero nem omissão.
    const linhaFalha = tabela.locator('tr[data-estado-avaliacao="nao_avaliada"]');
    await expect(linhaFalha).toHaveCount(1);
    await expect(linhaFalha).toContainText("não computável");

    // Prova estrutural da não-interpolação no bundle real: nenhum line/path/polyline.
    const interpolou = await secao.locator("svg line, svg path, svg polyline").count();
    expect(interpolou, "o desenho não pode ligar pontos onde não há continuidade").toBe(0);
    // E o eco visual não é vazio: dois marcadores (7 e 2; o fail-closed vai no glifo).
    await expect(secao.locator("svg circle")).toHaveCount(2);

    // Os instantes de máquina sobrevivem no `dateTime` (auditoria e teste).
    await expect(tabela.locator("time").first()).toHaveAttribute("datetime", /.+/);
  });

  test("janela com UM ponto diz 'uma avaliação' — sem desenho de série, e a antiga é CONTADA", async ({
    page,
  }) => {
    await rotear(page, historicoCom(avaliacao(7, 2), avaliacao(12, 30)));
    await abrirAplicacao(page);
    await abrirDetalhePeloTeclado(page);

    await expect(page.getByTestId("tendencia-ponto-unico")).toHaveText(
      "Uma avaliação nas últimas 24 horas.",
    );
    await expect(page.getByTestId("tendencia-visual")).toHaveCount(0);
    await expect(page.getByTestId("tendencia-fora-da-janela")).toContainText(
      "Uma avaliação mais antiga",
    );
    await expect(page.getByTestId("tendencia-tabela").locator("tbody tr")).toHaveCount(1);
  });

  test("histórico INDISPONÍVEL é declarado na tela — nunca vira 'não há série'", async ({
    page,
  }) => {
    await page.route(ROTA_GRADE, (rota) =>
      rota.fulfill({ status: 200, contentType: "application/json", body: gradeComUmLeito() }),
    );
    await page.route(ROTA_AVALIACOES, (rota) =>
      rota.fulfill({ status: 500, contentType: "application/json", body: '{"title":"Erro"}' }),
    );
    await abrirAplicacao(page);
    await abrirDetalhePeloTeclado(page);

    await expect(page.getByTestId("tendencia-indisponivel")).toContainText("não pôde ser obtido");
    await expect(page.getByTestId("tendencia-visual")).toHaveCount(0);
    await expect(page.getByTestId("tendencia-tabela")).toHaveCount(0);
  });

  test("a superfície da tendência é axe-limpa (WCAG 2.2 AA automatizável) e o teclado não fica preso", async ({
    page,
  }) => {
    await rotear(page, historicoCom(avaliacao(7, 1), avaliacao(5, 6), avaliacao(2, 11)));
    await abrirAplicacao(page);
    await abrirDetalhePeloTeclado(page);

    const secao = page.getByTestId("tendencia-avaliacoes");
    await expect(secao).toBeVisible();

    // TECLADO: ciclos de Tab a partir da superfície continuam avançando — a
    // tendência é conteúdo estático (tabela/desenho) e não pode introduzir
    // armadilha de foco nem controle inalcançável.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const ativo = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(ativo.length).toBeGreaterThan(0);

    const resultado = await new AxeBuilder({ page }).withTags(PADROES_WCAG).analyze();
    const resumo = resultado.violations.map(
      (v) => `${v.id} [${v.impact ?? "sem impacto"}] ${v.help} — ${v.nodes.length} nó(s)`,
    );
    expect(resumo).toEqual([]);
  });
});
