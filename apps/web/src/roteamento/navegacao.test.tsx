/**
 * apps/web/src/roteamento/navegacao.test.tsx
 *
 * LAC-L4 fim a fim na casca: URL por leito, deep link, histórico do navegador,
 * rota desconhecida como estado explícito, título por tela (WCAG 2.4.2), atalho
 * de pular blocos (WCAG 2.4.1), gestão de foco e anúncio da tela nova.
 *
 * O QUE NÃO EXISTIA ANTES DESTE ARQUIVO. `App.tsx` guardava a tela num
 * `useState<string|null>`: não havia endereço por leito, o "voltar" do
 * navegador SAÍA da aplicação, recarregar perdia o contexto, o `<title>` era o
 * mesmo em toda tela e a transição de tela não movia foco nem anunciava nada.
 *
 * O HISTÓRICO É INJETADO (`roteamento/historicoDeTeste.ts`). O botão "voltar" é
 * do NAVEGADOR: dirigi-lo de dentro do jsdom mede o agendador do jsdom, não o
 * produto. O comportamento real está em `e2e/navegacao.spec.ts`, com
 * `page.goBack()` num Chromium de verdade.
 *
 * Rastreio: LAC-L4, LAC-D4, HAZ-0001, HAZ-0002, HAZ-0046, ADR-0015, ADR-0021,
 * WCAG 2.2 SC 2.4.1/2.4.2/2.4.3.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../App.js";
import { criarSessaoControlada } from "../api/sessao.js";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import { criarHistoricoDeTeste, type HistoricoDeTeste } from "./historicoDeTeste.js";

const LEITO_A = "SYNTH-LEITO-01";
const LEITO_B = "SYNTH-LEITO-02";

function item(leitoId: string, apelido: string): ItemGradeLeito {
  return {
    leitoId,
    pacienteRef: `amh:psr:v1:${apelido}`,
    pacienteApelido: apelido,
    avaliacao: {
      estadoAvaliacao: "valida",
      news2Total: 4,
      bandaRisco: "atencao",
      contribuicoes: [],
      insumosAusentes: [],
      insumosVelhos: [],
      motivos: [],
      anotacoes: [],
      explicacao: `SYNTH — explicação agregada do backend (${leitoId}).`,
      parametroVermelho: false,
      calculadoEm: "2026-08-17T12:00:00.000Z",
      versaoRegra: "RULE-NEWS2@0.2.0",
    },
    alertas: [],
  };
}

const ITEM_A = item(LEITO_A, "Paciente SYNTH-P001");
const ITEM_B = item(LEITO_B, "Paciente SYNTH-P002");

interface Registro {
  readonly leitosPedidos: string[];
  readonly gradesPedidas: number;
}

function clienteQueResponde(registro: Registro): ClienteApiIntensiCare {
  return {
    listarGradeLeitos: async () => {
      (registro.gradesPedidas as number) += 1;
      return { estadoCarregamento: "pronto", dados: [ITEM_A, ITEM_B], problema: null };
    },
    obterAvaliacaoPaciente: async (leitoId: string) => {
      registro.leitosPedidos.push(leitoId);
      const dados = leitoId === LEITO_A ? ITEM_A : ITEM_B;
      return { estadoCarregamento: "pronto" as const, dados, problema: null };
    },
    reconhecerAlerta: async () => ({ estadoCarregamento: "erro", dados: null, problema: null }),
  };
}

function novoRegistro(): Registro {
  return { leitosPedidos: [], gradesPedidas: 0 };
}

const sessaoAtiva = () => criarSessaoControlada("ativa", "Bearer SYNTH-TESTE");

function montar(historico: HistoricoDeTeste, cliente: ClienteApiIntensiCare) {
  return render(
    <App
      cliente={cliente}
      sessao={sessaoAtiva()}
      historico={historico}
      leitorProntidao={null}
      portasDeEventos={null}
    />,
  );
}

// ---------------------------------------------------------------------------
// URL, deep link e histórico
// ---------------------------------------------------------------------------

describe("URL por leito, deep link e recarregamento", () => {
  it("selecionar um leito muda a URL e empilha uma entrada de histórico", async () => {
    const usuario = userEvent.setup();
    const historico = criarHistoricoDeTeste("/");
    montar(historico, clienteQueResponde(novoRegistro()));

    await usuario.click(await screen.findByRole("button", { name: new RegExp(LEITO_A) }));

    await screen.findByRole("heading", { name: LEITO_A });
    expect(historico.caminhoAtual()).toBe(`/leitos/${LEITO_A}`);
    expect(historico.entradas).toBe(2);
  });

  it("DEEP LINK: abrir `/leitos/:id` direto monta o detalhe, sem passar pela grade", async () => {
    const registro = novoRegistro();
    const historico = criarHistoricoDeTeste(`/leitos/${LEITO_A}`);
    montar(historico, clienteQueResponde(registro));

    await screen.findByRole("heading", { name: LEITO_A });
    expect(await screen.findByText("Paciente SYNTH-P001")).toBeTruthy();
    // Contexto preservado: é ESTE o comportamento de um recarregamento (F5) —
    // a casca é remontada do zero contra a mesma URL.
    expect(registro.leitosPedidos).toContain(LEITO_A);
    expect(registro.gradesPedidas).toBe(0);
  });

  it("VOLTAR volta para a grade e NÃO sai da aplicação", async () => {
    const usuario = userEvent.setup();
    const historico = criarHistoricoDeTeste("/");
    montar(historico, clienteQueResponde(novoRegistro()));

    await usuario.click(await screen.findByRole("button", { name: new RegExp(LEITO_A) }));
    await screen.findByRole("heading", { name: LEITO_A });

    historico.voltar();

    await screen.findByRole("heading", { name: "Grade de leitos" });
    expect(historico.caminhoAtual()).toBe("/");
    expect(
      historico.saiuDaAplicacao,
      "o voltar do navegador saiu da aplicação em vez de voltar para a grade",
    ).toBe(false);
  });

  it("o botão de voltar da própria tela também usa o histórico (não empilha ida e volta infinita)", async () => {
    const usuario = userEvent.setup();
    const historico = criarHistoricoDeTeste("/");
    montar(historico, clienteQueResponde(novoRegistro()));

    await usuario.click(await screen.findByRole("button", { name: new RegExp(LEITO_A) }));
    await usuario.click(await screen.findByRole("button", { name: /Voltar à grade/ }));

    await screen.findByRole("heading", { name: "Grade de leitos" });
    expect(historico.caminhoAtual()).toBe("/");
  });
});

// ---------------------------------------------------------------------------
// Rota desconhecida — estado explícito, jamais tela em branco
// ---------------------------------------------------------------------------

describe("rota desconhecida", () => {
  it("endereço sem tela produz estado EXPLÍCITO, mantém a URL e oferece saída", async () => {
    const usuario = userEvent.setup();
    const registro = novoRegistro();
    const historico = criarHistoricoDeTeste("/relatorio-inexistente");
    montar(historico, clienteQueResponde(registro));

    const bloco = await screen.findByTestId("endereco-nao-reconhecido");
    expect(bloco.textContent ?? "").toMatch(/Endereço não reconhecido/);
    expect(screen.getByTestId("caminho-nao-reconhecido").textContent).toBe(
      "/relatorio-inexistente",
    );
    // Nem redirecionamento silencioso, nem requisição especulativa.
    expect(historico.caminhoAtual()).toBe("/relatorio-inexistente");
    expect(registro.gradesPedidas).toBe(0);
    expect(registro.leitosPedidos).toEqual([]);

    await usuario.click(screen.getByRole("button", { name: /Ir para a grade/ }));
    await screen.findByRole("heading", { name: "Grade de leitos" });
  });

  it("URL com referência de SUJEITO na posição do leito não abre tela clínica alguma", async () => {
    const registro = novoRegistro();
    const historico = criarHistoricoDeTeste("/leitos/amh:psr:v1:SYNTH-P001");
    montar(historico, clienteQueResponde(registro));

    await screen.findByTestId("endereco-nao-reconhecido");
    expect(
      registro.leitosPedidos,
      "uma referência de sujeito na URL virou pedido de dado de paciente",
    ).toEqual([]);
  });

  it("o banner permanente continua exibido na tela de endereço não reconhecido (HAZ-0046)", async () => {
    const historico = criarHistoricoDeTeste("/nao-existe");
    montar(historico, clienteQueResponde(novoRegistro()));

    await screen.findByTestId("endereco-nao-reconhecido");
    expect(screen.getByTestId("rotulo-registro-institucional")).toBeTruthy();
    expect(screen.getByTestId("divulgacao-dados-sinteticos")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Sessão expirada por deep link
// ---------------------------------------------------------------------------

describe("deep link com sessão expirada", () => {
  it("NÃO renderiza dado de paciente, não pede o leito, e mantém o banner", async () => {
    const registro = novoRegistro();
    const historico = criarHistoricoDeTeste(`/leitos/${LEITO_A}`);
    render(
      <App
        cliente={clienteQueResponde(registro)}
        sessao={criarSessaoControlada("expirada", null)}
        historico={historico}
        leitorProntidao={null}
        portasDeEventos={null}
      />,
    );

    await screen.findByText(/Sessão expirada/);
    expect(screen.queryByRole("heading", { name: LEITO_A })).toBeNull();
    expect(screen.queryByText("Paciente SYNTH-P001")).toBeNull();
    expect(
      registro.leitosPedidos,
      "o deep link emitiu requisição de dado de paciente com a sessão expirada",
    ).toEqual([]);

    // HAZ-0046: a divulgação nunca sai, nem na tela de bloqueio.
    expect(screen.getByTestId("rotulo-registro-institucional")).toBeTruthy();
    // A URL NÃO é reescrita: reautenticar deve devolver a pessoa ao mesmo leito.
    expect(historico.caminhoAtual()).toBe(`/leitos/${LEITO_A}`);
    expect(document.title).toMatch(/^Sessão expirada —/);
  });
});

// ---------------------------------------------------------------------------
// WCAG 2.4.2 — Page Titled
// ---------------------------------------------------------------------------

describe("WCAG 2.4.2 — título dinâmico e distinto por tela", () => {
  it("grade, detalhe e endereço não reconhecido têm títulos diferentes e significativos", async () => {
    const usuario = userEvent.setup();
    const historico = criarHistoricoDeTeste("/");
    const { unmount } = montar(historico, clienteQueResponde(novoRegistro()));

    await screen.findByRole("heading", { name: "Grade de leitos" });
    const tituloGrade = document.title;
    expect(tituloGrade).toMatch(/^Grade de leitos —/);

    await usuario.click(await screen.findByRole("button", { name: new RegExp(LEITO_A) }));
    await screen.findByRole("heading", { name: LEITO_A });
    const tituloDetalhe = document.title;
    expect(tituloDetalhe).toContain(LEITO_A);
    expect(tituloDetalhe).not.toBe(tituloGrade);

    unmount();

    montar(criarHistoricoDeTeste("/nao-existe"), clienteQueResponde(novoRegistro()));
    await screen.findByTestId("endereco-nao-reconhecido");
    expect(document.title).toMatch(/^Endereço não reconhecido —/);
    expect(document.title).not.toBe(tituloGrade);
  });

  it("todo título carrega a divulgação de contexto (consultivo, sintético)", async () => {
    montar(criarHistoricoDeTeste("/"), clienteQueResponde(novoRegistro()));
    await screen.findByRole("heading", { name: "Grade de leitos" });
    expect(document.title).toMatch(/consultivo, dados sintéticos/);
  });
});

// ---------------------------------------------------------------------------
// WCAG 2.4.1 — Bypass Blocks
// ---------------------------------------------------------------------------

describe("WCAG 2.4.1 — atalho para o conteúdo principal", () => {
  it("o atalho é o PRIMEIRO ponto de tabulação do documento", async () => {
    const usuario = userEvent.setup();
    montar(criarHistoricoDeTeste("/"), clienteQueResponde(novoRegistro()));
    await screen.findByRole("heading", { name: "Grade de leitos" });

    await usuario.tab();
    expect(document.activeElement).toBe(screen.getByTestId("link-pular"));
  });

  it("ativá-lo move o foco para o conteúdo principal", async () => {
    const usuario = userEvent.setup();
    montar(criarHistoricoDeTeste("/"), clienteQueResponde(novoRegistro()));
    await screen.findByRole("heading", { name: "Grade de leitos" });

    await usuario.tab();
    await usuario.keyboard("{Enter}");

    const principal = document.querySelector("main");
    expect(principal).not.toBeNull();
    expect(document.activeElement).toBe(principal);
  });

  it("ativá-lo NÃO empilha entrada de histórico — o voltar continua indo à grade", async () => {
    const usuario = userEvent.setup();
    const historico = criarHistoricoDeTeste("/");
    montar(historico, clienteQueResponde(novoRegistro()));

    await usuario.click(await screen.findByRole("button", { name: new RegExp(LEITO_A) }));
    await screen.findByRole("heading", { name: LEITO_A });
    const entradasAntes = historico.entradas;

    await usuario.click(screen.getByTestId("link-pular"));
    expect(
      historico.entradas,
      "o atalho de âncora empilhou uma entrada e sequestrou o botão voltar",
    ).toBe(entradasAntes);

    historico.voltar();
    await screen.findByRole("heading", { name: "Grade de leitos" });
  });

  it("o atalho existe em TODA tela da casca, inclusive na de sessão expirada", async () => {
    const { unmount } = render(
      <App
        cliente={clienteQueResponde(novoRegistro())}
        sessao={criarSessaoControlada("expirada", null)}
        historico={criarHistoricoDeTeste("/")}
        leitorProntidao={null}
        portasDeEventos={null}
      />,
    );
    await screen.findByText(/Sessão expirada/);
    expect(screen.getByTestId("link-pular")).toBeTruthy();
    unmount();

    montar(criarHistoricoDeTeste("/nao-existe"), clienteQueResponde(novoRegistro()));
    await screen.findByTestId("endereco-nao-reconhecido");
    expect(screen.getByTestId("link-pular")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Foco e anúncio na transição
// ---------------------------------------------------------------------------

describe("gestão de foco na transição de tela", () => {
  it("a PRIMEIRA pintura não rouba o foco (deep link e recarregamento)", async () => {
    montar(criarHistoricoDeTeste(`/leitos/${LEITO_A}`), clienteQueResponde(novoRegistro()));
    await screen.findByRole("heading", { name: LEITO_A });

    // Se o foco fosse movido aqui, o atalho de pular deixaria de ser o primeiro
    // ponto de tabulação e quem recarregou a página no meio de outra coisa
    // perderia o cursor.
    expect(document.activeElement).toBe(document.body);
  });

  it("navegar move o foco para o conteúdo principal", async () => {
    const usuario = userEvent.setup();
    montar(criarHistoricoDeTeste("/"), clienteQueResponde(novoRegistro()));

    await usuario.click(await screen.findByRole("button", { name: new RegExp(LEITO_A) }));
    await screen.findByRole("heading", { name: LEITO_A });

    await waitFor(() => {
      expect(document.activeElement).toBe(document.querySelector("main"));
    });
  });

  it("re-render SEM navegação (aviso de sessão chegando) NÃO rouba o foco", async () => {
    // O caso real: a pessoa está com o cursor num leito e o provedor de sessão
    // anuncia "expira em breve". A tela precisa mudar; o foco, não. Uma casca
    // que reposiciona o foco a cada render arranca o cursor de quem opera.
    const sessao = criarSessaoControlada("ativa", "Bearer SYNTH-TESTE");
    render(
      <App
        cliente={clienteQueResponde(novoRegistro())}
        sessao={sessao}
        historico={criarHistoricoDeTeste("/")}
        leitorProntidao={null}
        portasDeEventos={null}
      />,
    );

    const cartao = await screen.findByRole("button", { name: new RegExp(LEITO_A) });
    cartao.focus();
    expect(document.activeElement).toBe(cartao);

    act(() => {
      sessao.definirEstado("expirando");
    });

    await screen.findByText(/Sua sessão expira em breve/);
    expect(
      document.activeElement,
      "um re-render sem navegação moveu o foco para o conteúdo principal",
    ).toBe(cartao);
  });
});

describe("anúncio da tela nova — polido, e sem atropelar o canal de alerta", () => {
  it("a região de anúncio existe desde a primeira pintura, vazia", async () => {
    montar(criarHistoricoDeTeste("/"), clienteQueResponde(novoRegistro()));
    const regiao = screen.getByTestId("anuncio-de-tela");
    expect(regiao.getAttribute("aria-live")).toBe("polite");
    expect(regiao.textContent).toBe("");
  });

  it("navegar anuncia a tela nova E a região ASSERTIVA de alertas segue sendo a de alerta", async () => {
    const usuario = userEvent.setup();
    montar(criarHistoricoDeTeste("/"), clienteQueResponde(novoRegistro()));
    await screen.findByRole("heading", { name: "Grade de leitos" });

    /*
      A COMPARAÇÃO É FEITA ONDE AS DUAS REGIÕES COEXISTEM — a grade. A versão
      anterior varria `[aria-live="assertive"]` DEPOIS de navegar para o detalhe,
      onde não existe região assertiva alguma (o canal assertivo é reservado ao
      clinicamente urgente: `RegiaoAoVivoAlertas` da grade, `offline` e sessão
      expirada). O laço iterava sobre um conjunto VAZIO e não verificava nada —
      passaria inclusive num mundo em que o canal de alerta tivesse sumido, que é
      exatamente a falha que ele deveria pegar (ACH-O3-14).
    */
    const assertivasNaGrade = document.querySelectorAll('[aria-live="assertive"]');
    expect(
      assertivasNaGrade.length,
      "a grade não tem região assertiva: a comparação abaixo não verificaria nada",
    ).toBeGreaterThan(0);
    for (const regiao of assertivasNaGrade) {
      expect(
        regiao,
        "o anúncio de navegação tomou o canal assertivo do alerta clínico (IA-P2, HAZ-0037)",
      ).not.toBe(screen.getByTestId("anuncio-de-tela"));
    }

    await usuario.click(await screen.findByRole("button", { name: new RegExp(LEITO_A) }));

    await waitFor(() => {
      expect(screen.getByTestId("anuncio-de-tela").textContent ?? "").toMatch(
        new RegExp(`Detalhe do leito ${LEITO_A}`),
      );
    });

    // O anúncio de navegação NUNCA é assertivo, nem depois de anunciar: duas
    // regiões assertivas competindo silenciam o alerta clínico.
    expect(screen.getByTestId("anuncio-de-tela").getAttribute("aria-live")).toBe("polite");
    expect(
      document.querySelector('[aria-live="assertive"][data-testid="anuncio-de-tela"]'),
    ).toBeNull();
  });

  it("o canal assertivo de alertas continua funcionando com o anúncio de rota presente", async () => {
    // Prova dos DOIS lados: a região de navegação não pode ter tomado o lugar
    // do anúncio clínico coalescido da grade.
    const cliente = clienteQueResponde(novoRegistro());
    const alerta: Alerta = {
      alertaId: "SYNTH-ALERTA-1",
      leitoId: LEITO_A,
      pacienteRef: ITEM_A.pacienteRef ?? "amh:psr:v1:SYNTH-P001",
      severidade: "alerta",
      descricao: "Alerta consultivo sintético.",
      criadoEm: "2026-08-17T10:00:00.000Z",
      estado: "nao_atribuido",
      versao: 0,
    };
    const comAlerta: ClienteApiIntensiCare = {
      ...cliente,
      listarGradeLeitos: async () => ({
        estadoCarregamento: "pronto",
        dados: [{ ...ITEM_A, alertas: [alerta] }],
        problema: null,
      }),
    };
    montar(criarHistoricoDeTeste("/"), comAlerta);

    const regiaoAssertiva = document.querySelector(
      '[aria-live="assertive"][aria-atomic="true"].sr-only',
    );
    expect(regiaoAssertiva).not.toBeNull();
    await waitFor(() => {
      expect(regiaoAssertiva?.textContent ?? "").toMatch(/1 alerta pendente na grade de leitos\./);
    });
  });
});

// ---------------------------------------------------------------------------
// O perigo clínico que a navegação cria (LAC-D4 no caminho quente)
// ---------------------------------------------------------------------------

describe("leito → leito SEM desmontagem, pela casca real", () => {
  it("o conteúdo do leito anterior não aparece sob o cabeçalho do leito novo", async () => {
    const historico = criarHistoricoDeTeste(`/leitos/${LEITO_A}`);
    const registro = novoRegistro();
    const cliente: ClienteApiIntensiCare = {
      ...clienteQueResponde(registro),
      obterAvaliacaoPaciente: async (leitoId: string) => {
        registro.leitosPedidos.push(leitoId);
        if (leitoId === LEITO_A) {
          return { estadoCarregamento: "pronto" as const, dados: ITEM_A, problema: null };
        }
        throw new Error("falha sintética de leitura do leito B");
      },
    };

    montar(historico, cliente);
    await screen.findByText("Paciente SYNTH-P001");

    // Salto de histórico entre duas entradas da MESMA aplicação: nada desmonta.
    historico.saltarPara(`/leitos/${LEITO_B}`);

    await screen.findByRole("heading", { name: LEITO_B });
    await screen.findByRole("button", { name: /Tentar novamente/i });

    expect(
      screen.queryByText("Paciente SYNTH-P001"),
      "o paciente do leito A apareceu sob o cabeçalho do leito B — atribuição errada (HAZ-0001/HAZ-0002)",
    ).toBeNull();
    expect(screen.queryByTestId("rotulo-frescor-visao")).toBeNull();
    expect(registro.leitosPedidos).toEqual([LEITO_A, LEITO_B]);
  });
});
