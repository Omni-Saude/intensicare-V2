/**
 * apps/web/src/a11y/acessibilidade.test.tsx
 *
 * AUTOMAÇÃO WCAG (ACH-07) na suíte de componentes: axe-core sobre as telas
 * principais, mais testes de comportamento de teclado, foco e live regions.
 *
 * LIMITE DECLARADO DESTA SUÍTE. jsdom não computa estilo cascateado nem
 * layout, portanto as regras do axe que dependem de cor e de caixa
 * (`color-contrast`, alvo de toque, reflow) são DESLIGADAS aqui — não porque
 * sejam irrelevantes, mas porque um verde delas em jsdom seria falso. Elas
 * são cobertas pela suíte de navegador (`e2e/`, Playwright + @axe-core), que
 * FOI EXECUTADA. Este cabeçalho trazia uma contagem literal ("17 testes
 * verdes") que envelheceu em silêncio assim que a suíte cresceu; o número
 * corrente sai de `pnpm --filter @intensicare/web exec playwright test
 * --workers=1`, e não de uma frase que ninguém recalcula. Cada regra desligada
 * aqui tem cobertura declarada na trilha `automatizado_navegador` de
 * `./matrizAcessibilidade.ts` — e um teste no fim deste arquivo verifica essa
 * correspondência, inclusive que o spec citado EXISTE. Desligar sem registrar
 * seria o anti-padrão 7 do contrato comum.
 *
 * E, acima de tudo: nenhum verde aqui declara acessibilidade validada
 * (ADR-0021 F7).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { App } from "../App.js";
import { criarSessaoControlada } from "../api/sessao.js";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import { GaleriaEstados } from "../components/GaleriaEstados.js";
import type { ItemGradeLeito } from "../domain/clinico.js";
// `?raw` do Vite: lê a folha de estilo como texto sem depender de API do Node
// (o tsconfig deste app declara apenas `vite/client`, não `node`).
import cssFonte from "../estilo.css?raw";
import { criarHistoricoDeTeste } from "../roteamento/historicoDeTeste.js";
import { distanciaSrgb, lerCor, luminanciaRelativa, razaoDeContraste } from "./cor.js";
import {
  CRITERIOS_WCAG_22_A_E_AA,
  criteriosAeAANaoEnumerados,
  criteriosForaDoNivelAeAA,
  criteriosNaoExecutados,
  criteriosQueExigemValidacaoManual,
  declaracaoDeAcessibilidade,
  MATRIZ_ACESSIBILIDADE,
  TOTAL_CRITERIOS_WCAG_22_AA,
} from "./matrizAcessibilidade.js";

/**
 * Conjunto FIXADO dos critérios que exigem tecnologia assistiva ou juízo
 * humano — transcrição do rótulo `manual_obrigatorio` de
 * `matrizAcessibilidade.ts`, não uma decisão nova.
 *
 * Existe porque o teste "nenhum critério de cobertura manual obrigatória é
 * declarado dispensado" derivava a lista do próprio rótulo que ele deveria
 * proteger: remover o rótulo (o ato de dispensar) esvaziava a lista e o teste
 * passava sem asserção nenhuma.
 */
const SC_COM_VALIDACAO_MANUAL_OBRIGATORIA = [
  "2.1.1",
  // 2.4.1 e 2.4.2 entraram em LAC-L4 e entraram JÁ com pendência manual: o
  // atalho existe e o título muda (automação afirma isso), mas "o bloco pulado
  // é o que atrapalha" e "o título descreve tópico e propósito" são juízo de
  // quem usa. Incluir é reconhecer pendência — o que este teste permite.
  "2.4.1",
  "2.4.2",
  "2.4.3",
  "2.4.7",
  "2.4.11",
  "4.1.3",
] as const;

/**
 * Regras desligadas em jsdom, com a razão. Toda entrada aqui precisa ter
 * cobertura declarada em `matrizAcessibilidade.ts` na trilha de navegador.
 */
const REGRAS_DESLIGADAS_EM_JSDOM = {
  "color-contrast": { enabled: false },
  "target-size": { enabled: false },
} as const;

async function verificarAxe(container: HTMLElement): Promise<void> {
  const resultado = await axe.run(container, {
    rules: REGRAS_DESLIGADAS_EM_JSDOM as unknown as axe.RuleObject,
  });
  // GUARDA DE NÃO-VACUIDADE. `violations` vazio significa duas coisas
  // indistinguíveis: "o axe avaliou e nada violou" ou "o axe não avaliou nada".
  // Medido: sobre um container vazio, `violations.length === 0` E
  // `passes.length === 0` — a asserção abaixo ficava VERDE sobre zero
  // evidência, e os seis casos de axe deste arquivo dependiam dela. Se um
  // refactor passar o nó errado, ou o render sair vazio, é aqui que tem de
  // quebrar — não no silêncio. Ancora: contrato §6 (laço/asserção sobre
  // coleção possivelmente vazia sem guarda) e o padrão de estopim já usado
  // neste arquivo para os critérios não executados.
  expect(resultado.passes.length).toBeGreaterThan(0);

  const resumo = resultado.violations.map(
    (v) => `${v.id} (${v.impact ?? "sem impacto declarado"}): ${v.help} — ${v.nodes.length} nó(s)`,
  );
  expect(resumo).toEqual([]);
}

const LEITO: ItemGradeLeito = {
  leitoId: "SYNTH-LEITO-01",
  pacienteRef: "amh:psr:v1:SYNTH-P001",
  pacienteApelido: "Paciente SYNTH-P001",
  avaliacao: {
    estadoAvaliacao: "nao_avaliada",
    news2Total: null,
    bandaRisco: null,
    contribuicoes: [],
    insumosAusentes: ["saturacao_oxigenio"],
    insumosVelhos: [],
    motivos: [],
    anotacoes: [],
    explicacao: "SYNTH — explicação agregada do backend.",
    parametroVermelho: false,
    calculadoEm: null,
    versaoRegra: "RULE-NEWS2@0.2.0",
  },
  alertas: [
    {
      alertaId: "SYNTH-ALERTA-1",
      leitoId: "SYNTH-LEITO-01",
      pacienteRef: "amh:psr:v1:SYNTH-P001",
      severidade: "alerta",
      descricao: "Alerta consultivo sintético.",
      criadoEm: "2026-08-17T10:00:00.000Z",
      estado: "nao_atribuido",
      versao: 0,
    },
  ],
};

function clienteQueResolve(): ClienteApiIntensiCare {
  return {
    listarGradeLeitos: async () => ({
      estadoCarregamento: "pronto",
      dados: [LEITO],
      problema: null,
    }),
    obterAvaliacaoPaciente: async () => ({
      estadoCarregamento: "pronto",
      dados: LEITO,
      problema: null,
    }),
    reconhecerAlerta: async () => ({
      estadoCarregamento: "pronto",
      dados: { ...LEITO.alertas[0]!, estado: "reconhecido" },
      problema: null,
    }),
  };
}

function clienteQueFalha(): ClienteApiIntensiCare {
  return {
    ...clienteQueResolve(),
    listarGradeLeitos: () => Promise.reject(new Error("falha sintética")),
  };
}

const sessaoAtiva = () => criarSessaoControlada("ativa", "Bearer SYNTH-TESTE");

/**
 * Toda montagem de `App` desta suíte injeta um histórico PRÓPRIO (LAC-L4).
 *
 * POR QUE ISSO PASSOU A SER NECESSÁRIO. Com navegação por URL, clicar num
 * cartão chama `history.pushState` — e o jsdom tem UM único `location` por
 * arquivo de teste. O primeiro caso que navegasse para o detalhe deixava a URL
 * global em `/leitos/SYNTH-LEITO-01`, e todos os casos seguintes montavam a
 * TELA DE DETALHE achando que montavam a grade. OBSERVADO: seis casos desta
 * suíte passaram a falhar por isso, nenhum deles por defeito de acessibilidade.
 * Um histórico por montagem devolve o isolamento entre casos; a History API de
 * verdade é exercitada em `e2e/navegacao.spec.ts`, em navegador real.
 */
function montarApp(cliente: ClienteApiIntensiCare, caminho = "/") {
  return render(
    <App
      cliente={cliente}
      sessao={sessaoAtiva()}
      historico={criarHistoricoDeTeste(caminho)}
      leitorProntidao={null}
      portasDeEventos={null}
    />,
  );
}

// ---------------------------------------------------------------------------
// axe nas telas principais
// ---------------------------------------------------------------------------

describe("axe-core — telas principais sem violação", () => {
  it("grade de leitos carregada", async () => {
    const { container } = montarApp(clienteQueResolve());
    await screen.findAllByText(/SYNTH-LEITO-01/);
    await verificarAxe(container);
  });

  it("detalhe do paciente (com avaliação não computável)", async () => {
    const usuario = userEvent.setup();
    const { container } = montarApp(clienteQueResolve());
    await usuario.click(await screen.findByRole("button", { name: /SYNTH-LEITO-01/ }));
    await screen.findByRole("heading", { name: "SYNTH-LEITO-01" });
    await verificarAxe(container);
  });

  it("estado de ERRO da grade (o caminho do ACH-07)", async () => {
    const { container } = montarApp(clienteQueFalha());
    await waitFor(() => {
      expect(document.querySelector('[data-estado="erro"]')).not.toBeNull();
    });
    await verificarAxe(container);
  });

  it("tela de sessão expirada", async () => {
    const { container } = render(
      <App
        cliente={clienteQueResolve()}
        sessao={criarSessaoControlada("expirada", null)}
        historico={criarHistoricoDeTeste("/")}
        leitorProntidao={null}
        portasDeEventos={null}
      />,
    );
    await screen.findByText(/Sessão expirada/);
    await verificarAxe(container);
  });

  it("galeria com TODOS os estados obrigatórios do §11", async () => {
    const { container } = render(<GaleriaEstados />);
    await verificarAxe(container);
  });

  it("tela de endereço não reconhecido (LAC-L4)", async () => {
    const { container } = montarApp(clienteQueResolve(), "/nao-existe");
    await screen.findByTestId("endereco-nao-reconhecido");
    await verificarAxe(container);
  });
});

// ---------------------------------------------------------------------------
// Teclado e foco
// ---------------------------------------------------------------------------

describe("teclado — todos os controles alcançáveis, sem armadilha de foco", () => {
  it("a tabulação alcança cada controle interativo da grade e volta ao início", async () => {
    const usuario = userEvent.setup();
    montarApp(clienteQueResolve());
    await screen.findAllByText(/SYNTH-LEITO-01/);

    const interativos = Array.from(
      document.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, summary"),
    ).filter((el) => !el.hasAttribute("disabled"));
    expect(interativos.length).toBeGreaterThan(0);

    const alcancados = new Set<HTMLElement>();
    // Uma volta completa + 1: se houvesse armadilha, o laço pararia de
    // avançar e a contagem de alcançados ficaria abaixo do total.
    for (let passo = 0; passo < interativos.length + 1; passo += 1) {
      await usuario.tab();
      const ativo = document.activeElement;
      if (ativo instanceof HTMLElement && interativos.includes(ativo)) {
        alcancados.add(ativo);
      }
    }

    expect(alcancados.size).toBe(interativos.length);
  });

  it("o cartão de leito é ativável por teclado (Enter) e navega para o detalhe", async () => {
    const usuario = userEvent.setup();
    montarApp(clienteQueResolve());
    const cartao = await screen.findByRole("button", { name: /SYNTH-LEITO-01/ });

    cartao.focus();
    expect(document.activeElement).toBe(cartao);
    await usuario.keyboard("{Enter}");

    await screen.findByRole("heading", { name: "SYNTH-LEITO-01" });
  });

  it("o botão de recuperação do estado de erro é alcançável por teclado", async () => {
    const usuario = userEvent.setup();
    montarApp(clienteQueFalha());
    const botao = await screen.findByRole("button", { name: /Tentar novamente/i });
    botao.focus();
    expect(document.activeElement).toBe(botao);
    await usuario.keyboard("{Enter}");
    // Não trava: a tela continua respondendo após a tentativa.
    expect(await screen.findByRole("button", { name: /Tentar novamente/i })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Live regions
// ---------------------------------------------------------------------------

describe("live regions — mudança de alerta é anunciada, e de forma coalescida", () => {
  it("a região de alertas existe ANTES da mensagem (senão o anúncio não dispara)", () => {
    montarApp(clienteQueResolve());
    const regiao = document.querySelector('[aria-atomic="true"][aria-live="assertive"]');
    expect(regiao).not.toBeNull();
    expect(regiao?.textContent).toBe("");
  });

  it("uma leitura com alertas pendentes produz UMA mensagem com contagem, não uma por alerta", async () => {
    montarApp(clienteQueResolve());
    const regiao = document.querySelector('[aria-atomic="true"][aria-live="assertive"]');
    await waitFor(() => {
      expect(regiao?.textContent ?? "").toMatch(/1 alerta pendente na grade de leitos\./);
    });
  });

  it("o estado de falha é anunciado assertivamente e o de rotina, educadamente", async () => {
    montarApp(clienteQueFalha());
    await waitFor(() => {
      const bloco = document.querySelector('[data-contexto="grade de leitos"]');
      expect(bloco?.getAttribute("aria-live")).toBe("assertive");
      expect(bloco?.getAttribute("role")).toBe("alert");
    });
  });
});

// ---------------------------------------------------------------------------
// Folha de estilo: foco visível e movimento reduzido
// ---------------------------------------------------------------------------

describe("folha de estilo — foco visível e prefers-reduced-motion", () => {
  const css = cssFonte;

  /**
   * GUARDA CONTRA FALSO VERDE. Toda asserção deste bloco é da forma
   * `expect(css).toMatch(...)` ou `not.toMatch(...)`, e AMBAS passariam
   * trivialmente sobre uma string vazia. E vazia era exatamente o que o
   * Vite devolvia até `css: true` ser ligado em `vitest.config.ts`: a
   * importação `?raw` de um `.css` é curto-circuitada quando o processamento
   * de CSS está desligado. Sem esta verificação, o bloco inteiro viraria
   * decoração verde no dia em que essa opção fosse revertida.
   */
  it("o fonte da folha de estilo foi de fato carregado (senão tudo abaixo é falso verde)", () => {
    expect(typeof css).toBe("string");
    expect(css.length).toBeGreaterThan(500);
    expect(css).toMatch(/badge-tom/);
  });

  it("declara indicador de foco visível", () => {
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/outline:/);
  });

  it("respeita prefers-reduced-motion", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion/);
  });

  it("o atalho de pular blocos é focável e SAI do esconderijo ao receber foco (2.4.1)", () => {
    // Um atalho invisível quando focado é armadilha, não atalho. E ele NÃO pode
    // usar `.sr-only`: aquela técnica mantém a caixa em 1×1 px mesmo com foco.
    expect(css).toMatch(/\.link-pular\s*\{/);
    expect(css).toMatch(/\.link-pular:focus\s*\{[^}]*left:\s*0/);
    // `display:none`/`visibility:hidden` removeriam o elemento da ordem de
    // tabulação — que é exatamente o que o atalho precisa ter.
    const blocoAtalho = /\.link-pular\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(blocoAtalho.length).toBeGreaterThan(0);
    expect(blocoAtalho).not.toMatch(/display:\s*none/);
    expect(blocoAtalho).not.toMatch(/visibility:\s*hidden/);
    // Alvo de ao menos 24×24 CSS px (2.5.8) mesmo sendo um link de atalho.
    expect(blocoAtalho).toMatch(/min-height:\s*44px/);
  });

  it("a existência da regra CSS NÃO é declarada como prova de foco perceptível", () => {
    // 2.4.7 passou a ser EXECUTADO pela suíte de navegador (que afirma haver
    // `outline` ou `box-shadow` em cada elemento focado). Mas "existe
    // indicador" não é "o indicador é perceptível para quem tem baixa
    // visão" — a matriz precisa continuar dizendo isso em voz alta.
    const criterio = MATRIZ_ACESSIBILIDADE.find((c) => c.sc === "2.4.7");
    expect(criterio?.cobertura).toContain("manual_obrigatorio");
    expect(criterio?.nota).toMatch(/NÃO prova/);
    expect(criterio?.nota).toMatch(/humana|baixa visão/i);
  });
});

// ---------------------------------------------------------------------------
// Selos de estado sob tema escuro — a verificação RÁPIDA
// ---------------------------------------------------------------------------

/**
 * Separa a folha em "o que está dentro de `@media (prefers-color-scheme:
 * dark)`" e "todo o resto".
 *
 * Por contagem de chaves, e não por expressão regular: um `@media` contém
 * blocos aninhados, e `\{[^}]*\}` pararia na primeira chave de fechamento
 * interna — leria só a primeira regra e ficaria verde por ler menos. O
 * `restante` é necessário para comparar as duas paletas: a clara é a que
 * sobra quando os blocos escuros saem.
 */
function separarPorTema(fonteComComentarios: string): { escuro: string[]; restante: string } {
  // Comentários saem ANTES da separação. Esta folha documenta as próprias
  // decisões de cor em prosa longa — inclusive citando `prefers-color-scheme:
  // dark` e valores hex —, e deixar isso na entrada faria as asserções abaixo
  // medirem o comentário em vez da regra.
  const fonte = fonteComComentarios.replace(/\/\*[\s\S]*?\*\//g, "");
  const escuro: string[] = [];
  const partesForaDoEscuro: string[] = [];
  const abertura = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/g;
  let cursor = 0;
  let achado = abertura.exec(fonte);
  while (achado !== null) {
    partesForaDoEscuro.push(fonte.slice(cursor, achado.index));
    let profundidade = 1;
    let i = achado.index + achado[0].length;
    const inicio = i;
    while (i < fonte.length && profundidade > 0) {
      if (fonte[i] === "{") profundidade += 1;
      else if (fonte[i] === "}") profundidade -= 1;
      i += 1;
    }
    escuro.push(fonte.slice(inicio, i - 1));
    cursor = i;
    abertura.lastIndex = i;
    achado = abertura.exec(fonte);
  }
  partesForaDoEscuro.push(fonte.slice(cursor));
  return { escuro, restante: partesForaDoEscuro.join("\n") };
}

/** Os sete tons de `domain/estados.ts` — o union type inteiro. */
const TONS_SEMANTICOS = [
  "neutro",
  "positivo",
  "informativo",
  "atencao",
  "alerta",
  "critico",
  "inconclusivo",
] as const;

/**
 * Piso da WCAG para o texto do selo. `.badge-tom` é 0.85rem (13,6 px) com peso
 * 600 — abaixo do limiar de "texto grande" (18,66 px em negrito), portanto o
 * piso é 4.5:1. Citado da norma, não escolhido aqui.
 */
const PISO_TEXTO_NORMAL_AA = 4.5;

describe("folha de estilo — selos de estado sob prefers-color-scheme: dark", () => {
  const css = cssFonte;
  const temas = separarPorTema(css);
  const escuro = temas.escuro.join("\n");

  function parDeclarado(tom: string, fonte: string): { fundo: string; texto: string } | null {
    const bloco = new RegExp(`\\.badge-tom--${tom}\\s*\\{([^}]*)\\}`).exec(fonte)?.[1];
    if (bloco === undefined) return null;
    const fundo = /background:\s*(#[0-9a-f]{6})/i.exec(bloco)?.[1];
    const texto = /color:\s*(#[0-9a-f]{6})/i.exec(bloco)?.[1];
    return fundo === undefined || texto === undefined ? null : { fundo, texto };
  }

  it("a extração de blocos de tema escuro funciona (senão tudo abaixo é falso verde)", () => {
    // Mesma guarda do bloco anterior: `expect(escuro).toMatch(...)` sobre uma
    // string vazia falharia, mas `not.toMatch` passaria — e uma extração
    // quebrada esvaziaria os dois lados sem avisar.
    expect(temas.escuro.length).toBeGreaterThan(1);
    expect(escuro.length).toBeGreaterThan(100);
    // Âncoras conhecidas: o cartão de leito já tinha variante escura antes
    // desta mudança, e a paleta CLARA dos selos vive fora de qualquer `@media`.
    // Se qualquer uma sumir da separação, é a separação que está errada.
    expect(escuro).toMatch(/\.cartao-leito\s*\{/);
    expect(temas.restante).toMatch(/\.badge-tom--critico\s*\{/);
    expect(temas.restante).not.toMatch(/prefers-color-scheme:\s*dark/);
  });

  it("os SETE tons têm variante escura declarada — nenhum fica com a paleta clara", () => {
    // ESTE É O TESTE QUE FICA VERMELHO SE A VARIANTE FOR REMOVIDA. A suíte de
    // navegador mede a cor computada e é a prova forte; esta aqui é a prova
    // BARATA, que roda em toda execução de `vitest` e não depende de o
    // navegador do Playwright estar instalado.
    const semVariante = TONS_SEMANTICOS.filter((tom) => parDeclarado(tom, escuro) === null);
    expect(
      semVariante,
      "tom sem par (background + color) em @media (prefers-color-scheme: dark)",
    ).toEqual([]);
  });

  it("cada par da variante escura alcança 4.5:1, calculado — não conferido à mão", () => {
    const medidos = TONS_SEMANTICOS.map((tom) => {
      const par = parDeclarado(tom, escuro);
      if (par === null) throw new Error(`tom ${tom} sem variante escura`);
      return { tom, ...par, razao: razaoDeContraste(lerCor(par.fundo), lerCor(par.texto)) };
    });
    expect(medidos.length).toBe(TONS_SEMANTICOS.length);

    const abaixo = medidos
      .filter((m) => m.razao < PISO_TEXTO_NORMAL_AA)
      .map((m) => `${m.tom}: ${m.texto} sobre ${m.fundo} = ${m.razao.toFixed(2)}:1`);
    expect(abaixo, "par abaixo do piso AA de texto normal (WCAG 1.4.3)").toEqual([]);
  });

  it("no tema escuro o fundo do selo é escuro — a inversão de saliência não volta", () => {
    // O defeito não era o par texto/fundo (que nunca quebrou, porque cada
    // `.badge-tom--*` declara os dois): era o selo continuar com fundo CLARO
    // dentro de uma página escura, o que fazia `--critico` virar o elemento
    // menos destacado da tela. Ver `e2e/contraste-tema-escuro.spec.ts`.
    const invertidos = TONS_SEMANTICOS.filter((tom) => {
      const par = parDeclarado(tom, escuro);
      if (par === null) return true;
      return luminanciaRelativa(lerCor(par.fundo)) >= luminanciaRelativa(lerCor(par.texto));
    });
    expect(invertidos, "selo com fundo mais claro que o texto no tema escuro").toEqual([]);
  });

  it("a variante escura não colapsa os tons num cinza só", () => {
    // A distinção entre tons é requisito (`domain/estados.ts`: `inconclusivo`
    // é deliberadamente distinto de `neutro`). O piso não é escolhido a dedo:
    // é o pior par que a paleta CLARA já pratica.
    function menorDistancia(fonte: string): number {
      const fundos = TONS_SEMANTICOS.map((tom) => parDeclarado(tom, fonte)?.fundo).filter(
        (f): f is string => f !== undefined,
      );
      expect(fundos.length).toBe(TONS_SEMANTICOS.length);
      let menor = Number.POSITIVE_INFINITY;
      for (let i = 0; i < fundos.length; i += 1) {
        for (let j = i + 1; j < fundos.length; j += 1) {
          menor = Math.min(
            menor,
            distanciaSrgb(lerCor(fundos[i] as string), lerCor(fundos[j] as string)),
          );
        }
      }
      return menor;
    }

    // A paleta clara é o que sobra quando os blocos de tema escuro saem.
    expect(menorDistancia(escuro)).toBeGreaterThanOrEqual(menorDistancia(temas.restante));
  });
});

// ---------------------------------------------------------------------------
// A matriz é honesta sobre si mesma
// ---------------------------------------------------------------------------

describe("matriz de acessibilidade — honestidade de estado", () => {
  it("todo critério declara ao menos uma forma de cobertura", () => {
    for (const criterio of MATRIZ_ACESSIBILIDADE) {
      expect(criterio.cobertura.length).toBeGreaterThan(0);
      expect(criterio.nota.length).toBeGreaterThan(0);
    }
  });

  it("existem critérios que EXIGEM validação manual, e eles estão nomeados", () => {
    const manuais = criteriosQueExigemValidacaoManual();
    expect(manuais.length).toBeGreaterThan(0);
    expect(manuais.map((c) => c.sc)).toContain("4.1.3");
    expect(manuais.map((c) => c.sc)).toContain("2.1.1");
  });

  it("2.4.11 saiu de 'não executado' com teste, não com caneta", () => {
    // ESTE TESTE ERA O ESTOPIM. Ele afirmava `naoExecutados` conter "2.4.11",
    // para que ninguém marcasse o critério como executado sem escrever o
    // teste. O critério fechou — e o estopim mudou de alvo em vez de sumir:
    // agora exige as MARCAS de que fechou pelo caminho certo.
    //
    // Por que fechou: a nota antiga descrevia um risco que o CSS não realiza
    // (banner permanente obscurecendo o foco). `.banner-contexto` é
    // `position: static`, não há `fixed`/`sticky` na folha e o único
    // `z-index` é o do próprio atalho de pular blocos. A refutação foi por
    // medição em navegador (`e2e/foco-nao-obscurecido.spec.ts`), não por
    // releitura da nota.
    const criterio = MATRIZ_ACESSIBILIDADE.find((c) => c.sc === "2.4.11");
    expect(criterio, "2.4.11 desapareceu da matriz").toBeDefined();
    expect(criterio?.execucao).toBe("executado");
    expect(criterio?.cobertura).toContain("automatizado_navegador");
    // Fechar em automação NÃO dispensa a pendência humana: se a parte visível
    // do elemento focado basta para alguém localizá-lo é juízo de quem usa.
    expect(criterio?.cobertura).toContain("manual_obrigatorio");
    expect(criterio?.nota).toMatch(/NÃO prova/);
    expect(criterio?.nota).toMatch(/foco-nao-obscurecido\.spec\.ts/);
  });

  it("todo spec citado por uma nota da matriz EXISTE de fato", () => {
    // Sem esta guarda, "EXECUTADO em `e2e/algum.spec.ts`" seria uma alegação
    // que ninguém verifica — e citar um arquivo inexistente é a forma mais
    // barata de fingir cobertura. `import.meta.glob` lista o diretório em
    // tempo de build; nada é importado, só os caminhos são lidos.
    const specsExistentes = new Set(
      Object.keys(import.meta.glob("../../e2e/**/*.spec.ts")).map(
        (caminho) => caminho.split("/e2e/")[1] ?? caminho,
      ),
    );
    expect(specsExistentes.size, "nenhum spec e2e encontrado — o glob quebrou").toBeGreaterThan(0);

    const citados = MATRIZ_ACESSIBILIDADE.flatMap(
      (c) => c.nota.match(/e2e\/[\w./-]+\.spec\.ts/g)?.map((m) => m.replace("e2e/", "")) ?? [],
    );
    expect(citados.length, "nenhuma nota cita spec — a guarda ficaria vazia").toBeGreaterThan(0);
    expect(
      citados.filter((s) => !specsExistentes.has(s)),
      "a matriz cita spec de navegador que não existe no repositório",
    ).toEqual([]);
  });

  it("a lacuna que continua aberta segue nomeada, e FORA da matriz", () => {
    // Com 2.4.11 fechado, `criteriosNaoExecutados()` fica vazio DENTRO do
    // recorte — e um recorte vazio de pendências leria como cobertura
    // completa. O que impede essa leitura é o que segue fora: 2.2.1 (Timing
    // Adjustable) depende de sessão real (ADR-0015 tem direção aceita (GDEC-0016), mas nenhum IdP real foi contratado) e não pode
    // ser encerrado por esta fatia. Incluí-lo na matriz como "executado" seria
    // alegar cobertura sobre componente inexistente.
    expect(criteriosAeAANaoEnumerados()).toContain("2.2.1");
    expect(MATRIZ_ACESSIBILIDADE.map((c) => c.sc)).not.toContain("2.2.1");
    // O recorte continua sendo minoria do padrão — o número é derivado.
    expect(criteriosAeAANaoEnumerados().length).toBeGreaterThan(MATRIZ_ACESSIBILIDADE.length);
  });

  it("nenhum critério é declarado executado sem trilha de verificação", () => {
    // `criteriosNaoExecutados()` continua existindo e continua sendo a fonte
    // da declaração; o que este teste impede é o atalho de marcar
    // `executado` sem dizer POR ONDE.
    const semTrilha = MATRIZ_ACESSIBILIDADE.filter(
      (c) => c.execucao === "executado" && !c.cobertura.some((t) => t.startsWith("automatizado_")),
    ).map((c) => c.sc);
    expect(semTrilha, "critério executado só por cobertura manual — automação não o fecha").toEqual(
      [],
    );

    // `criteriosNaoExecutados()` está VAZIA hoje, e um `every` sobre lista
    // vazia é verdadeiro por vacuidade — seria um assert que não afirma nada.
    // O que se verifica é a PARTIÇÃO: executados e não-executados somam a
    // matriz inteira, o que continua tendo conteúdo quando a lista voltar a
    // ter itens.
    const executados = MATRIZ_ACESSIBILIDADE.filter((c) => c.execucao === "executado");
    expect(executados.length + criteriosNaoExecutados().length).toBe(MATRIZ_ACESSIBILIDADE.length);
    expect(criteriosNaoExecutados().filter((c) => c.execucao === "executado")).toEqual([]);
  });

  it("critérios só verificáveis em navegador declaram essa trilha de cobertura", () => {
    // Foram EXECUTADOS pela suíte Playwright, não por jsdom — e a matriz
    // precisa dizer por onde, não apenas que sim. 2.4.11 entrou nesta lista ao
    // ganhar `e2e/foco-nao-obscurecido.spec.ts`.
    for (const sc of ["1.4.3", "1.4.10", "1.4.11", "2.4.7", "2.5.8"]) {
      const criterio = MATRIZ_ACESSIBILIDADE.find((c) => c.sc === sc);
      expect(criterio, `critério ${sc} ausente da matriz`).toBeDefined();
      expect(criterio?.cobertura).toContain("automatizado_navegador");
      expect(criterio?.execucao).toBe("executado");
    }
  });

  it("nenhum critério de cobertura manual obrigatória é declarado dispensado", () => {
    const manuais = criteriosQueExigemValidacaoManual();

    // CEGUEIRA FECHADA (revisão adversarial): este teste era cego exatamente à
    // regressão que o seu nome descreve. `criteriosQueExigemValidacaoManual()`
    // é derivada do rótulo `manual_obrigatorio`, e REMOVER o rótulo É o ato de
    // "declarar dispensado" — a filtragem esvaziava, o laço não executava
    // nenhuma asserção, e o teste ficava verde. Fixar o conjunto transforma a
    // remoção do rótulo em vermelho. Não é decisão de produto: é a transcrição
    // do que `matrizAcessibilidade.ts` já declara hoje.
    expect(
      [...manuais.map((c) => c.sc)].sort(),
      "o conjunto de critérios que exigem validação manual mudou: incluir um é " +
        "reconhecer uma pendência; REMOVER um é declará-lo dispensado por automação",
    ).toEqual([...SC_COM_VALIDACAO_MANUAL_OBRIGATORIA].sort());

    // Automação nunca encerra um critério que exige tecnologia assistiva: a
    // nota tem de dizer o que o verde NÃO prova.
    for (const criterio of manuais) {
      expect(criterio.nota, `nota do critério ${criterio.sc}`).toMatch(
        /NÃO prova|não é decidível|exigindo validação|NÃO EXECUTADO|só um usuário|pode responder/i,
      );
    }
  });

  it("toda regra desligada em jsdom tem cobertura declarada na trilha de navegador", () => {
    // `color-contrast` ↔ 1.4.3/1.4.11 ; `target-size` ↔ 2.5.8
    const porNavegador = MATRIZ_ACESSIBILIDADE.filter((c) =>
      c.cobertura.includes("automatizado_navegador"),
    ).map((c) => c.sc);
    for (const sc of ["1.4.3", "1.4.11", "2.5.8"]) {
      expect(porNavegador).toContain(sc);
    }
  });

  it("a declaração oficial NUNCA afirma acessibilidade validada", () => {
    const declaracao = declaracaoDeAcessibilidade();
    expect(declaracao).toMatch(/NÃO VALIDADA/);
    expect(declaracao).toMatch(/NÃO EXECUTADA/);

    // FURO FECHADO (revisão adversarial do PR #8, P2). O padrão era
    // `/\bconforme\b/i`, e a fronteira de palavra falha exatamente onde mais
    // importa: "conformidade" é `conform|idade`, então `\bconforme\b` NÃO casa.
    // O revisor inseriu "Conformidade plena WCAG 2.2 AA atingida neste recorte."
    // na declaração, manteve a frase de recorte, e a suíte seguiu 24/24 verde —
    // uma guarda de honestidade que deixava passar a alegação mais grave que ela
    // existia para impedir. Sem fronteira, o padrão cobre conforme,
    // conformidade, "em conformidade", conformance.
    expect(declaracao, "a declaração alega conformidade").not.toMatch(/conform/i);
    // Mesma classe de furo: `\bacessível\b` não casaria "acessíveis".
    expect(declaracao, "a declaração se declara acessível").not.toMatch(/acess[íi]ve/i);
  });

  /**
   * O UNIVERSO, ENUMERADO — e não uma grandeza solta.
   *
   * P2 da revisão adversarial: `TOTAL_CRITERIOS_WCAG_22_AA` era o literal `56`
   * (errado; a WCAG 2.2 tem 55 no nível A+AA) e o teste que dizia verificar a
   * razão "15 de 56" só comparava `length < total` — mutá-lo para 999 mantinha
   * 24/24 verde. Um total agora só pode mudar mudando a ENUMERAÇÃO, e a
   * enumeração é auditável linha a linha contra a REC de 05-out-2023.
   */
  it("o universo A+AA da WCAG 2.2 tem 55 critérios: 31 de nível A e 24 de nível AA", () => {
    expect(TOTAL_CRITERIOS_WCAG_22_AA).toBe(55);
    expect(CRITERIOS_WCAG_22_A_E_AA).toHaveLength(55);
    expect(CRITERIOS_WCAG_22_A_E_AA.filter((c) => c.nivel === "A")).toHaveLength(31);
    expect(CRITERIOS_WCAG_22_A_E_AA.filter((c) => c.nivel === "AA")).toHaveLength(24);

    // Nenhum SC repetido — duplicata inflaria o total sem parecer erro.
    const numeros = CRITERIOS_WCAG_22_A_E_AA.map((c) => c.sc);
    expect(new Set(numeros).size, "há critério repetido na enumeração").toBe(numeros.length);
  });

  it("a enumeração reflete o delta 2.1 → 2.2: 4.1.1 removido, os 9 novos no nível certo", () => {
    const numeros = CRITERIOS_WCAG_22_A_E_AA.map((c) => c.sc);
    // 4.1.1 Parsing foi declarado obsoleto na 2.2. Mantê-lo é o erro que
    // produz o total 56 — este é o teste que o denuncia por nome.
    expect(numeros, "4.1.1 Parsing não existe na WCAG 2.2").not.toContain("4.1.1");

    // Os novos de nível A e AA precisam estar presentes, no nível correto.
    for (const sc of ["3.2.6", "3.3.7"]) {
      expect(CRITERIOS_WCAG_22_A_E_AA.find((c) => c.sc === sc)?.nivel, `${sc}`).toBe("A");
    }
    for (const sc of ["2.4.11", "2.5.7", "2.5.8", "3.3.8"]) {
      expect(CRITERIOS_WCAG_22_A_E_AA.find((c) => c.sc === sc)?.nivel, `${sc}`).toBe("AA");
    }
    // E os novos de nível AAA ficam FORA deste universo, por serem AAA.
    for (const sc of ["2.4.12", "2.4.13", "3.3.9"]) {
      expect(numeros, `${sc} é AAA e não pertence ao universo A+AA`).not.toContain(sc);
    }
  });

  /**
   * O RECORTE precisa aparecer na própria declaração. Uma matriz de 17
   * critérios sob o rótulo "WCAG 2.2 AA" lê como se cobrisse o padrão, que tem
   * 55 no nível A+AA — e um recorte não declarado é a forma silenciosa de
   * alegar conformidade que ninguém verificou (encargo §4.6).
   */
  it("a declaração informa que a matriz é um recorte, não o padrão inteiro", () => {
    expect(MATRIZ_ACESSIBILIDADE.length).toBeLessThan(TOTAL_CRITERIOS_WCAG_22_AA);
    const declaracao = declaracaoDeAcessibilidade();
    expect(declaracao).toContain(String(MATRIZ_ACESSIBILIDADE.length));
    expect(declaracao).toContain(String(TOTAL_CRITERIOS_WCAG_22_AA));
    expect(declaracao).toMatch(/recorte declarado/i);
    // A aritmética do recorte é DERIVADA e verificada aqui: 55 − 16 = 39
    // (a matriz tem 17 entradas, mas uma delas é AAA — ver o caso seguinte).
    // Era 41 antes de LAC-L4 fechar 2.4.1 e 2.4.2; o número muda porque a
    // COBERTURA mudou, e este teste existe para que ele não mude sozinho.
    expect(criteriosAeAANaoEnumerados()).toHaveLength(39);
    expect(declaracao).toContain(String(criteriosAeAANaoEnumerados().length));
  });

  /**
   * ACHADO PRÓPRIO desta rodada, ao ancorar a enumeração: 2.3.3 "Animation from
   * Interactions" é de nível AAA, não AA. A matriz o adota como ALVO (decisão
   * já escrita em `arquitetura-de-informacao.md` §2.2), e isso é legítimo — mas
   * a declaração dizia "a matriz enumera 15 dos N critérios A+AA", o que é
   * falso para 15 deles. Este teste fixa quais entradas estão fora do nível,
   * para que acrescentar outra passe a ser uma decisão explícita.
   */
  it("todo critério da matriz é A+AA, salvo o AAA declarado como alvo (2.3.3)", () => {
    expect(criteriosForaDoNivelAeAA().map((c) => c.sc)).toEqual(["2.3.3"]);

    const universo = new Set(CRITERIOS_WCAG_22_A_E_AA.map((c) => c.sc));
    for (const criterio of MATRIZ_ACESSIBILIDADE) {
      if (criterio.sc === "2.3.3") continue;
      expect(
        universo.has(criterio.sc),
        `${criterio.sc} não é um critério A+AA da WCAG 2.2 — número errado ou nível não declarado`,
      ).toBe(true);
    }
  });

  /**
   * ESTE TESTE PROVA AUSÊNCIA, NÃO EXECUÇÃO. Ele nasceu cobrindo três critérios
   * (2.4.1, 2.4.2, 2.2.1), todos ausentes da matriz por causa da lacuna de
   * roteamento — e o comentário anterior advertia que `undefined?.execucao !==
   * "executado"` é verdadeiro por vacuidade.
   *
   * LAC-L4 FECHOU DOIS DELES, e a ordem importa: o comportamento passou a
   * existir (`components/LinkPular.tsx`, `roteamento/tituloDocumento.ts`) e a
   * ser exercitado (`roteamento/navegacao.test.tsx`, `e2e/navegacao.spec.ts`)
   * ANTES de o rótulo mudar. 2.4.1 e 2.4.2 saíram desta lista e entraram na
   * matriz; o teste que os protege agora é o de coerência com a lista fixa de
   * validação manual, mais os casos de comportamento.
   *
   * 2.2.1 CONTINUA AQUI e continua sozinho. Ele depende de sessão real
   * (ADR-0015 tem direção aceita (GDEC-0016), mas nenhum IdP real foi contratado): o provedor de hoje é sintético e não expira por
   * tempo, então não existe temporização a ajustar. Marcá-lo executado seria
   * alegar cobertura sobre componente inexistente.
   */
  it("2.2.1 (Timing Adjustable) segue AUSENTE da matriz — depende de sessão real", () => {
    const sc = "2.2.1";
    const criterio = MATRIZ_ACESSIBILIDADE.find((c) => c.sc === sc);

    expect(
      criterio,
      `${sc} entrou na matriz: ele depende de sessão real (ADR-0015 com direção aceita em GDEC-0016, sem IdP real contratado)`,
    ).toBeUndefined();

    // Pertence ao padrão (logo, a ausência é uma LACUNA, não um número
    // inventado) e está entre os critérios A+AA fora do recorte.
    expect(CRITERIOS_WCAG_22_A_E_AA.map((c) => c.sc)).toContain(sc);
    expect(criteriosAeAANaoEnumerados()).toContain(sc);

    // Estopim de regressão: se entrar, não pode entrar como "executado".
    expect(
      criterio?.execucao,
      `${sc} apareceu na matriz como "executado" sem que exista sessão real para expirar`,
    ).not.toBe("executado");
  });

  /**
   * O CONTRAPESO do caso acima: 2.4.1 e 2.4.2 só podem estar na matriz como
   * "executado" enquanto o COMPORTAMENTO existir. Este teste amarra o rótulo ao
   * artefato — se `LinkPular` ou o título dinâmico sumirem, os casos de
   * comportamento deste arquivo quebram primeiro, e aqui fica registrado por
   * que a entrada existe.
   */
  it("2.4.1 e 2.4.2 entraram na matriz COM pendência manual declarada", () => {
    for (const sc of ["2.4.1", "2.4.2"]) {
      const criterio = MATRIZ_ACESSIBILIDADE.find((c) => c.sc === sc);
      expect(criterio, `${sc} ausente da matriz`).toBeDefined();
      expect(criterio?.execucao).toBe("executado");
      expect(
        criterio?.cobertura,
        `${sc} foi declarado encerrado por automação — automação não encerra usabilidade`,
      ).toContain("manual_obrigatorio");
      expect(criterio?.nota).toMatch(/NÃO prova|não prova/);
    }
  });
});
