/**
 * apps/web/e2e/foco-nao-obscurecido.spec.ts
 *
 * WCAG 2.2 SC 2.4.11 — Focus Not Obscured (Minimum), nível AA.
 *
 * TEXTO DO CRITÉRIO (citado, não parafraseado): "When a user interface
 * component receives keyboard focus, the component is not entirely hidden due
 * to author-created content." O critério MÍNIMO fala em *entirely hidden*;
 * obscurecimento PARCIAL é permitido no nível AA (o nível AAA — 2.4.12,
 * Enhanced — é que exige nenhuma parte oculta, e este arquivo NÃO o afirma).
 * Um dos testes abaixo existe justamente para provar que o detector implementa
 * o mínimo e não algo mais severo por acidente.
 *
 * POR QUE ESTA SUÍTE, E POR QUE EM NAVEGADOR. `matrizAcessibilidade.ts`
 * registrava 2.4.11 como `nao_executado` com a justificativa de que "o banner
 * de contexto é permanente por obrigação de segurança clínica (HAZ-0046); se
 * ele chega a obscurecer o elemento focado sob rolagem não foi verificado".
 * A medição contradiz a hipótese: `.banner-contexto` é `position: static` e
 * sem `z-index`, não existe NENHUM `position: fixed` ou `sticky` na folha, e o
 * único `z-index` do repositório é o do próprio atalho de pular blocos
 * (`.link-pular`, que só ganha caixa visível quando é ELE o elemento focado).
 * Um elemento estático rola junto com a página e não tem como sobrepor
 * conteúdo. "Permanente" ali significa *sempre presente no documento*, não
 * *fixo na viewport* — e essa distinção era o núcleo da nota errada.
 *
 * Mas a medição do CSS é hipótese sobre o comportamento, não o comportamento.
 * O que este arquivo faz é observar o comportamento: pergunta ao navegador,
 * por hit-testing (`elementFromPoint`), quem de fato está pintado sobre a
 * caixa do elemento focado, em várias posições de rolagem.
 *
 * NADA AQUI DECLARA ACESSIBILIDADE VALIDADA (ADR-0021 F7, SPR-G4-5, MG-G4).
 * Este critério continua marcado com pendência de validação manual: se a parte
 * visível do elemento focado é SUFICIENTE para uma pessoa localizá-lo — ainda
 * mais sob ampliação — é juízo de quem usa, não de hit-testing.
 *
 * Rastreio: WCAG 2.2 SC 2.4.11, HAZ-0046, ADR-0004 §6.2, ACH-07.
 */
import { expect, type Page, test } from "@playwright/test";
import { abrirAplicacaoComDubleDeDesenvolvimento } from "./apoio/base.js";

/** O que o hit-testing viu na caixa do elemento que está com o foco. */
interface DiagnosticoDeFoco {
  readonly descricao: string;
  readonly larguraDaCaixa: number;
  readonly alturaDaCaixa: number;
  readonly intersectaViewport: boolean;
  readonly pontosAmostrados: number;
  readonly pontosVisiveis: number;
  readonly obscurecedores: readonly string[];
  readonly rolagemY: number;
}

/**
 * Diagnostica o elemento que está com o foco AGORA.
 *
 * MÉTODO. Amostra uma grade de pontos dentro da caixa do elemento focado,
 * descarta os que caem fora da viewport (fora dela não há o que obscurecer — o
 * critério fala de conteúdo do autor, não de recorte da janela) e pergunta ao
 * navegador quem está no topo em cada ponto. Um ponto conta como VISÍVEL
 * quando quem responde é o próprio elemento ou um descendente dele.
 *
 * Por que não `IntersectionObserver` nem `visibility`: nenhum dos dois enxerga
 * sobreposição. Um elemento coberto por uma barra fixa continua 100%
 * "intersectando" a viewport e continua `visible`. Só o hit-testing responde
 * "quem está por cima", que é literalmente o que o critério pergunta.
 */
async function diagnosticarFocoAtual(pagina: Page): Promise<DiagnosticoDeFoco | null> {
  return await pagina.evaluate(() => {
    const alvo = document.activeElement;
    if (!(alvo instanceof HTMLElement) || alvo === document.body) return null;

    const caixa = alvo.getBoundingClientRect();
    const larguraViewport = document.documentElement.clientWidth;
    const alturaViewport = document.documentElement.clientHeight;

    const descricao =
      `${alvo.tagName.toLowerCase()}` +
      (alvo.className !== "" ? `.${String(alvo.className).trim().split(/\s+/).join(".")}` : "") +
      ` "${(alvo.textContent ?? "").trim().slice(0, 40)}"`;

    const intersecta =
      caixa.width > 0 &&
      caixa.height > 0 &&
      caixa.right > 0 &&
      caixa.bottom > 0 &&
      caixa.left < larguraViewport &&
      caixa.top < alturaViewport;

    let amostrados = 0;
    let visiveis = 0;
    const obscurecedores = new Set<string>();

    // Grade 5×5 nos pontos internos — evita as bordas exatas, onde o
    // arredondamento de subpixel do hit-testing devolve o vizinho e produziria
    // falso positivo de obscurecimento.
    for (let i = 1; i <= 5; i += 1) {
      for (let j = 1; j <= 5; j += 1) {
        const x = caixa.left + (caixa.width * i) / 6;
        const y = caixa.top + (caixa.height * j) / 6;
        if (x < 0 || y < 0 || x >= larguraViewport || y >= alturaViewport) continue;
        amostrados += 1;
        const noTopo = document.elementFromPoint(x, y);
        if (noTopo !== null && (noTopo === alvo || alvo.contains(noTopo))) {
          visiveis += 1;
        } else if (noTopo !== null) {
          const classe = String(noTopo.className ?? "");
          obscurecedores.add(
            noTopo.tagName.toLowerCase() +
              (classe.trim() !== "" ? `.${classe.trim().split(/\s+/).join(".")}` : "") +
              ` [position: ${globalThis.getComputedStyle(noTopo).position}]`,
          );
        }
      }
    }

    return {
      descricao,
      larguraDaCaixa: caixa.width,
      alturaDaCaixa: caixa.height,
      intersectaViewport: intersecta,
      pontosAmostrados: amostrados,
      pontosVisiveis: visiveis,
      obscurecedores: [...obscurecedores],
      rolagemY: globalThis.scrollY,
    };
  });
}

/** `true` quando o elemento focado está INTEIRAMENTE oculto — a falha do 2.4.11. */
function estaInteiramenteOculto(d: DiagnosticoDeFoco): boolean {
  return d.pontosAmostrados > 0 && d.pontosVisiveis === 0;
}

/** Altura rolável da página, para posicionar a rolagem em frações reais. */
async function alturaRolavel(pagina: Page): Promise<number> {
  return await pagina.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
  );
}

/**
 * Percorre a tabulação com a página REPOSICIONADA antes de cada passo.
 *
 * Reposicionar antes de cada `Tab` é o que reproduz o cenário do critério:
 * alguém rolou a tela e continuou navegando por teclado. Um percurso que
 * rolasse uma vez só perderia o efeito, porque o próprio `Tab` faz o navegador
 * rolar até o elemento seguinte.
 */
async function percorrerComRolagem(
  pagina: Page,
  fracoes: readonly number[],
  passosPorFracao: number,
): Promise<PassoDoPercurso[]> {
  const rolavel = await alturaRolavel(pagina);
  const coletados: PassoDoPercurso[] = [];

  for (const fracao of fracoes) {
    const alvoDeRolagem = Math.round(rolavel * fracao);
    await pagina.evaluate((y) => globalThis.scrollTo(0, y), alvoDeRolagem);
    for (let passo = 0; passo < passosPorFracao; passo += 1) {
      // A posição ANTES do `Tab` é a que caracteriza o cenário. A posição
      // DEPOIS é decidida pelo navegador, que rola até o elemento focado — se
      // o percurso tiver um único ponto de tabulação, ela será sempre a mesma,
      // e medir só ela faria uma guarda de não-vacuidade acusar o produto por
      // uma propriedade do próprio percurso.
      const rolagemAntesDoTab = await pagina.evaluate(() => globalThis.scrollY);
      await pagina.keyboard.press("Tab");
      const d = await diagnosticarFocoAtual(pagina);
      if (d !== null) coletados.push({ ...d, rolagemAntesDoTab });
      await pagina.evaluate((y) => globalThis.scrollTo(0, y), alvoDeRolagem);
    }
  }
  return coletados;
}

/** Um passo do percurso: o diagnóstico mais a posição de onde o `Tab` partiu. */
type PassoDoPercurso = DiagnosticoDeFoco & { readonly rolagemAntesDoTab: number };

const FRACOES_DE_ROLAGEM = [0, 0.25, 0.5, 0.75, 1] as const;

/** Descreve um passo em uma linha, para mensagem de falha que aponta a causa. */
function descreverPasso(d: PassoDoPercurso): string {
  return (
    `${d.descricao} (Tab a partir de scrollY=${d.rolagemAntesDoTab}, ` +
    `foco em scrollY=${d.rolagemY}) — coberto por: ${d.obscurecedores.join(", ")}`
  );
}

test.describe("2.4.11 — o elemento focado nunca fica inteiramente oculto", () => {
  test("grade de leitos: percurso por Tab em cinco posições de rolagem", async ({ page }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);

    // MEDIDO nesta tela: 16 pontos de tabulação e 1.706 px de conteúdo numa
    // viewport de 720 px — a tela de trabalho é a que tem percurso de verdade.
    const passos = await percorrerComRolagem(page, FRACOES_DE_ROLAGEM, 6);

    // NÃO-VACUIDADE. Um percurso que não focasse nada, que focasse sempre o
    // mesmo elemento, ou que nunca saísse do topo, deixaria as asserções
    // abaixo verdes sem ter medido a tela. Conta-se o observado, não o iterado.
    expect(passos.length, "nenhum elemento recebeu foco no percurso").toBeGreaterThan(0);
    expect(
      new Set(passos.map((d) => d.descricao)).size,
      "o percurso focou sempre o mesmo elemento",
    ).toBeGreaterThan(1);
    expect(
      new Set(passos.map((d) => d.rolagemAntesDoTab)).size,
      "todos os Tab partiram da mesma posição de rolagem",
    ).toBeGreaterThan(1);
    expect(
      passos.filter((d) => d.pontosAmostrados === 0).map((d) => d.descricao),
      "elemento focado sem NENHUM ponto amostrável dentro da viewport",
    ).toEqual([]);

    expect(
      passos.filter(estaInteiramenteOculto).map(descreverPasso),
      "elemento focado INTEIRAMENTE oculto (WCAG 2.4.11)",
    ).toEqual([]);
  });

  test("galeria de estados: 3.144 px de conteúdo e um único ponto de tabulação", async ({
    page,
  }) => {
    // A galeria do §11 é a tela que MAIS rola nesta fatia (3.144 px numa
    // viewport de 720) e, MEDIDO, tem exatamente um ponto de tabulação: o
    // atalho de pular blocos — que por acaso é o único elemento com `z-index`
    // no repositório inteiro. É por isso que ela vale como caso extremo, e não
    // por ter muitos controles: é a maior distância de rolagem possível entre
    // "onde a pessoa está lendo" e "onde o foco vai parar".
    await page.goto("/?estados");
    await expect(page.getByRole("heading", { name: /Galeria de estados/ })).toBeVisible();
    const rolavel = await alturaRolavel(page);
    expect(rolavel, "a galeria não rola: o percurso seria vazio").toBeGreaterThan(500);

    const focaveis = await page
      .locator("a[href], button:not([disabled]), summary, input, select, textarea")
      .count();
    expect(focaveis, "nenhum ponto de tabulação na galeria").toBeGreaterThan(0);

    const passos = await percorrerComRolagem(page, FRACOES_DE_ROLAGEM, focaveis + 1);
    expect(passos.length, "nenhum elemento recebeu foco").toBeGreaterThanOrEqual(focaveis);
    expect(
      new Set(passos.map((d) => d.rolagemAntesDoTab)).size,
      "todos os Tab partiram da mesma posição de rolagem",
    ).toBeGreaterThan(1);
    expect(
      passos.filter((d) => !d.intersectaViewport).map(descreverPasso),
      "elemento recebeu foco FORA da área visível e o navegador não rolou até ele",
    ).toEqual([]);

    expect(
      passos.filter(estaInteiramenteOculto).map(descreverPasso),
      "elemento focado INTEIRAMENTE oculto (WCAG 2.4.11)",
    ).toEqual([]);
  });

  test("o atalho de pular blocos — o ÚNICO elemento com z-index — aparece visível com a página rolada", async ({
    page,
  }) => {
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const rolavel = await alturaRolavel(page);
    await page.evaluate((y) => globalThis.scrollTo(0, y), rolavel);
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });

    await page.keyboard.press("Tab");
    const d = await diagnosticarFocoAtual(page);

    expect(d, "nada recebeu foco após Tab a partir do fim da página").not.toBeNull();
    // `.link-pular` é o primeiro ponto de tabulação por projeto (SC 2.4.1).
    expect(d?.descricao).toMatch(/link-pular/);
    expect(d?.intersectaViewport, "o atalho recebeu foco fora da área visível").toBe(true);
    expect(
      d === null ? true : estaInteiramenteOculto(d),
      `o atalho focado está oculto atrás de: ${d?.obscurecedores.join(", ") ?? "?"}`,
    ).toBe(false);
  });

  test("o banner permanente de contexto NÃO é fixo na viewport — ele rola com a página", async ({
    page,
  }) => {
    // Esta é a verificação da hipótese que a matriz registrava como risco. O
    // banner é obrigação de segurança clínica (HAZ-0046, ADR-0004 §6.2) e não
    // pode ser removido; o que se verifica aqui é que ser PERMANENTE não o
    // torna FIXO — ele sai da área visível ao rolar, como qualquer conteúdo
    // estático, e portanto não tem como cobrir o foco.
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    const posicao = await page.evaluate(
      () =>
        globalThis.getComputedStyle(document.querySelector(".banner-contexto") as Element).position,
    );
    expect(posicao, "o banner passou a ser posicionado — 2.4.11 precisa ser reavaliado").toBe(
      "static",
    );

    const rolavel = await alturaRolavel(page);
    test.skip(rolavel < 50, "a viewport comporta a página inteira: não há rolagem a observar");
    await page.evaluate((y) => globalThis.scrollTo(0, y), rolavel);
    const aindaNoTopo = await page.evaluate(() => {
      const banner = document.querySelector(".banner-contexto");
      return banner === null ? false : banner.getBoundingClientRect().bottom > 0;
    });
    expect(aindaNoTopo, "o banner permaneceu na viewport após rolar até o fim: ele é fixo").toBe(
      false,
    );
  });
});

test.describe("2.4.11 — o detector tem dentes (meta-testes de não-vacuidade)", () => {
  /**
   * Injeta uma sobreposição fixa, como a que uma barra de navegação "sticky"
   * criaria. É conteúdo do autor, `position: fixed`, com `z-index` acima do
   * único z-index do produto (100, do `.link-pular`).
   */
  async function injetarSobreposicaoFixa(pagina: Page, alturaCss: string): Promise<void> {
    await pagina.evaluate((altura) => {
      const barra = document.createElement("div");
      barra.id = "sobreposicao-de-teste";
      barra.style.position = "fixed";
      barra.style.top = "0";
      barra.style.left = "0";
      barra.style.right = "0";
      barra.style.height = altura;
      barra.style.zIndex = "9999";
      barra.style.background = "#000000";
      document.body.append(barra);
    }, alturaCss);
  }

  test("com uma barra fixa cobrindo a viewport, o detector ACUSA obscurecimento total", async ({
    page,
  }) => {
    // Sem este teste, o verde dos anteriores poderia significar apenas "o
    // detector nunca acusa nada". Aqui o defeito é fabricado de propósito e o
    // detector precisa vê-lo.
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    await injetarSobreposicaoFixa(page, "100vh");
    await page.keyboard.press("Tab");

    const d = await diagnosticarFocoAtual(page);
    expect(d, "nada recebeu foco").not.toBeNull();
    expect(d === null ? 0 : d.pontosAmostrados).toBeGreaterThan(0);
    expect(
      d === null ? false : estaInteiramenteOculto(d),
      "o detector NÃO viu uma barra fixa que cobre a viewport inteira",
    ).toBe(true);
    expect(d?.obscurecedores.join(" ")).toMatch(/sobreposicao-de-teste|div .*position: fixed/);
  });

  test("com obscurecimento PARCIAL o detector não acusa — 2.4.11 é o mínimo, não o 2.4.12", async ({
    page,
  }) => {
    // Documentação executável do recorte: o nível AA permite que parte do
    // elemento focado fique coberta. Se este teste passasse a falhar, o
    // detector teria virado uma verificação de 2.4.12 (AAA) sem que ninguém
    // tivesse decidido isso — e a matriz estaria afirmando o critério errado.
    await abrirAplicacaoComDubleDeDesenvolvimento(page);
    await page.keyboard.press("Tab");
    const antes = await diagnosticarFocoAtual(page);
    expect(antes, "nada recebeu foco").not.toBeNull();

    // Cobre a metade superior da caixa do elemento focado, e só ela.
    const meio = Math.round(
      ((antes?.alturaDaCaixa ?? 0) / 2 +
        (await page.evaluate(
          () => (document.activeElement as HTMLElement).getBoundingClientRect().top,
        ))) as number,
    );
    await injetarSobreposicaoFixa(page, `${Math.max(meio, 1)}px`);

    const depois = await diagnosticarFocoAtual(page);
    expect(depois, "o elemento perdeu o foco ao injetar a sobreposição").not.toBeNull();
    expect(
      depois === null ? 0 : depois.pontosVisiveis,
      "obscurecimento parcial escondeu o elemento inteiro — a fabricação do caso falhou",
    ).toBeGreaterThan(0);
    expect(
      depois === null ? true : estaInteiramenteOculto(depois),
      "o detector acusou falha em obscurecimento PARCIAL, que o nível AA permite",
    ).toBe(false);
  });
});
