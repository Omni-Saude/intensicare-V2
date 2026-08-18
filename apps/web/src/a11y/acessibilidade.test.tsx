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
 * FOI EXECUTADA: 17 testes verdes, 5 marcados BLOQUEADOS por dependência de
 * autenticação do backend. Cada regra desligada aqui tem cobertura declarada
 * na trilha `automatizado_navegador` de `./matrizAcessibilidade.ts` — e um
 * teste no fim deste arquivo verifica essa correspondência. Desligar sem
 * registrar seria o anti-padrão 7 do contrato comum.
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
const SC_COM_VALIDACAO_MANUAL_OBRIGATORIA = ["2.1.1", "2.4.3", "2.4.7", "2.4.11", "4.1.3"] as const;

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
      severidade: "alto",
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

// ---------------------------------------------------------------------------
// axe nas telas principais
// ---------------------------------------------------------------------------

describe("axe-core — telas principais sem violação", () => {
  it("grade de leitos carregada", async () => {
    const { container } = render(<App cliente={clienteQueResolve()} sessao={sessaoAtiva()} />);
    await screen.findAllByText(/SYNTH-LEITO-01/);
    await verificarAxe(container);
  });

  it("detalhe do paciente (com avaliação não computável)", async () => {
    const usuario = userEvent.setup();
    const { container } = render(<App cliente={clienteQueResolve()} sessao={sessaoAtiva()} />);
    await usuario.click(await screen.findByRole("button", { name: /SYNTH-LEITO-01/ }));
    await screen.findByRole("heading", { name: "SYNTH-LEITO-01" });
    await verificarAxe(container);
  });

  it("estado de ERRO da grade (o caminho do ACH-07)", async () => {
    const { container } = render(<App cliente={clienteQueFalha()} sessao={sessaoAtiva()} />);
    await waitFor(() => {
      expect(document.querySelector('[data-estado="erro"]')).not.toBeNull();
    });
    await verificarAxe(container);
  });

  it("tela de sessão expirada", async () => {
    const { container } = render(
      <App cliente={clienteQueResolve()} sessao={criarSessaoControlada("expirada", null)} />,
    );
    await screen.findByText(/Sessão expirada/);
    await verificarAxe(container);
  });

  it("galeria com TODOS os estados obrigatórios do §11", async () => {
    const { container } = render(<GaleriaEstados />);
    await verificarAxe(container);
  });
});

// ---------------------------------------------------------------------------
// Teclado e foco
// ---------------------------------------------------------------------------

describe("teclado — todos os controles alcançáveis, sem armadilha de foco", () => {
  it("a tabulação alcança cada controle interativo da grade e volta ao início", async () => {
    const usuario = userEvent.setup();
    render(<App cliente={clienteQueResolve()} sessao={sessaoAtiva()} />);
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
    render(<App cliente={clienteQueResolve()} sessao={sessaoAtiva()} />);
    const cartao = await screen.findByRole("button", { name: /SYNTH-LEITO-01/ });

    cartao.focus();
    expect(document.activeElement).toBe(cartao);
    await usuario.keyboard("{Enter}");

    await screen.findByRole("heading", { name: "SYNTH-LEITO-01" });
  });

  it("o botão de recuperação do estado de erro é alcançável por teclado", async () => {
    const usuario = userEvent.setup();
    render(<App cliente={clienteQueFalha()} sessao={sessaoAtiva()} />);
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
    render(<App cliente={clienteQueResolve()} sessao={sessaoAtiva()} />);
    const regiao = document.querySelector('[aria-atomic="true"][aria-live="assertive"]');
    expect(regiao).not.toBeNull();
    expect(regiao?.textContent).toBe("");
  });

  it("uma leitura com alertas pendentes produz UMA mensagem com contagem, não uma por alerta", async () => {
    render(<App cliente={clienteQueResolve()} sessao={sessaoAtiva()} />);
    const regiao = document.querySelector('[aria-atomic="true"][aria-live="assertive"]');
    await waitFor(() => {
      expect(regiao?.textContent ?? "").toMatch(/1 alerta pendente na grade de leitos\./);
    });
  });

  it("o estado de falha é anunciado assertivamente e o de rotina, educadamente", async () => {
    render(<App cliente={clienteQueFalha()} sessao={sessaoAtiva()} />);
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

  it("o que NÃO foi verificado continua marcado como não executado, não silenciado", () => {
    // 2.4.11 (foco não obscurecido) segue sem teste dedicado. Este assert
    // existe para que a lista de pendências não encolha por esquecimento: se
    // alguém marcar o critério como executado sem escrever o teste, aqui
    // quebra.
    const naoExecutados = criteriosNaoExecutados().map((c) => c.sc);
    expect(naoExecutados).toContain("2.4.11");
    expect(naoExecutados.length).toBeGreaterThan(0);
  });

  it("critérios só verificáveis em navegador declaram essa trilha de cobertura", () => {
    // Foram EXECUTADOS pela suíte Playwright (17 testes verdes), não por
    // jsdom — e a matriz precisa dizer por onde, não apenas que sim.
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
   * O RECORTE precisa aparecer na própria declaração. Uma matriz de 15
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
    // A aritmética do recorte é DERIVADA e verificada aqui: 55 − 14 = 41
    // (a matriz tem 15 entradas, mas uma delas é AAA — ver o caso seguinte).
    expect(criteriosAeAANaoEnumerados()).toHaveLength(41);
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
   * ESTE TESTE PROVA AUSÊNCIA, NÃO EXECUÇÃO — e o nome anterior ("guarda de
   * não-vacuidade") mentia sobre isso (revisão adversarial do PR #8, P2). Os
   * três critérios (2.4.1, 2.4.2, 2.2.1) NÃO estão na matriz: `find()` devolve
   * `undefined` e `undefined?.execucao !== "executado"` é verdadeiro por
   * vacuidade, independentemente de qualquer coisa. Ele continua valendo como
   * ESTOPIM DE REGRESSÃO FUTURA (se alguém os acrescentar como "executado" sem
   * fechar a lacuna de navegação, quebra), mas o estado de hoje passa a ser
   * afirmado às claras, com `toBeUndefined()` primeiro.
   */
  it("os critérios de navegação com lacuna conhecida seguem AUSENTES da matriz", () => {
    for (const sc of ["2.4.1", "2.4.2", "2.2.1"]) {
      const criterio = MATRIZ_ACESSIBILIDADE.find((c) => c.sc === sc);

      // O fato de HOJE, dito explicitamente: ausente. Se um dia entrar na
      // matriz, esta linha falha e a asserção seguinte deixa de ser vácua.
      expect(
        criterio,
        `${sc} entrou na matriz: reveja este teste — ele foi escrito provando AUSÊNCIA`,
      ).toBeUndefined();

      // Pertence ao padrão (logo, a ausência é uma LACUNA, não um número
      // inventado) e está entre os critérios A+AA fora do recorte.
      expect(CRITERIOS_WCAG_22_A_E_AA.map((c) => c.sc)).toContain(sc);
      expect(criteriosAeAANaoEnumerados()).toContain(sc);

      // Estopim de regressão: se entrar, não pode entrar como "executado".
      expect(
        criterio?.execucao,
        `${sc} apareceu na matriz como "executado" sem que a lacuna de navegação tenha sido fechada`,
      ).not.toBe("executado");
    }
  });
});
