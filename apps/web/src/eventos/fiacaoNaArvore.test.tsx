/**
 * apps/web/src/eventos/fiacaoNaArvore.test.tsx
 *
 * O TRANSPORTE ESTAVA COMPLETO E NUNCA FOI FIADO. `src/eventos/**` tinha 80
 * testes verdes e ZERO consumidores: nenhum componente da árvore chamava
 * `useFluxoDeEventos`, de modo que o módulo era código morto — verde e inerte.
 * Um transporte que não chega à tela não muda nada para quem olha a tela.
 *
 * O QUE ESTE ARQUIVO FIXA, e por que cada item é uma obrigação e não um gosto:
 *
 *   1. UMA CONEXÃO POR ABA. O navegador limita conexões SSE por origem, e o
 *      ticket é de USO ÚNICO: duas telas montando o hook abririam dois fluxos e
 *      consumiriam dois tickets. Por isso o hook vive em `App.tsx` e as telas
 *      recebem PROPS — nunca o hook.
 *   2. O SINAL DE RELEITURA CHEGA À PROJEÇÃO. O evento diz QUE releia; quem lê é
 *      a projeção autoritativa (ADR-0011 P7/P8). Se o sinal não descer, o push
 *      não faz diferença nenhuma.
 *   3. A DEGRADAÇÃO DO PUSH É A QUARTA ORIGEM, ADITIVA. Ela não pode apagar as
 *      três que já existem, e nenhuma delas pode apagá-la.
 *   4. `reproduzindo` e `reconciliado` passam a ter ORIGEM REAL — até aqui eram
 *      catálogo de apresentação sem transporte que os produzisse.
 *   5. O ESTADO DE CONEXÃO NÃO ALIMENTA `AvisoProntidao`. `/v1/readyz` é a
 *      declaração do SERVIÇO sobre a própria capacidade; deduzi-la de um socket
 *      do navegador faria a tela afirmar "o serviço não está pronto" a partir de
 *      evidência do cliente. Recusa registrada pelo autor do transporte.
 *
 * Rastreio: ADR-0011 P3/P4/P6/P7/P8, HAZ-0025, SAF-0025, LAC-L1, HAZ-0046.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App.js";
import { criarSessaoControlada } from "../api/sessao.js";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { ItemGradeLeito } from "../domain/clinico.js";
import { criarHistoricoDeTeste } from "../roteamento/historicoDeTeste.js";
import { criarRelogioDeTeste, type RelogioDeTeste } from "../teste/relogioDeTeste.js";
import type { QuadroRecebido } from "./porta.js";
import {
  criarEmissorDeTeste,
  criarFluxoDeTeste,
  type EmissorDeTeste,
  type FluxoDeTeste,
} from "./teste/fluxoDeTeste.js";
import {
  POLITICA_DE_TESTE,
  quadroDeDados,
  quadroDeEstado,
  quadroDeInstrucao,
  quadroDePulsacao,
} from "./teste/quadros.js";

const LEITO_A = "SYNTH-LEITO-01";

function item(leitoId: string, apelido: string): ItemGradeLeito {
  return {
    leitoId,
    pacienteRef: `amh:psr:v1:${apelido}`,
    pacienteApelido: apelido,
    avaliacao: {
      estadoAvaliacao: "valida",
      news2Total: 3,
      bandaRisco: "normal",
      contribuicoes: [],
      insumosAusentes: [],
      insumosVelhos: [],
      motivos: [],
      anotacoes: [],
      explicacao: "SYNTH — explicação agregada do backend.",
      parametroVermelho: false,
      calculadoEm: "2026-08-17T12:00:00.000Z",
      versaoRegra: "RULE-NEWS2@0.2.0",
    },
    alertas: [],
  };
}

const ITEM_A = item(LEITO_A, "Paciente SYNTH-P001");

interface Bancada {
  readonly fluxo: FluxoDeTeste;
  readonly emissor: EmissorDeTeste;
  readonly relogio: RelogioDeTeste;
  readonly leiturasDaGrade: () => number;
  readonly leiturasDoDetalhe: () => number;
  /** Quantas leituras da projeção começaram e ainda NÃO terminaram. */
  readonly leiturasEmVoo: () => number;
  /** A partir daqui, toda leitura fica pendurada até `liberarLeituras`. */
  readonly travarLeituras: () => void;
  /** Resolve as leituras penduradas e volta ao regime normal. */
  readonly liberarLeituras: () => void;
  /** A partir daqui, toda leitura REJEITA. */
  readonly falharLeituras: (valor: boolean) => void;
}

function montar(caminho = "/"): Bancada {
  const fluxo = criarFluxoDeTeste();
  const emissor = criarEmissorDeTeste();
  const relogio = criarRelogioDeTeste();
  let leiturasDaGrade = 0;
  let leiturasDoDetalhe = 0;
  let emVoo = 0;
  let travado = false;
  let falhando = false;
  const liberadores: (() => void)[] = [];

  /**
   * Pendura a leitura enquanto a bancada estiver travada. É isto que torna
   * observável a janela entre "a releitura começou" e "a releitura terminou" —
   * a janela em que o cliente NÃO pode afirmar estar reconciliado.
   */
  async function esperarLiberacao(): Promise<void> {
    if (!travado) return;
    await new Promise<void>((resolver) => {
      liberadores.push(resolver);
    });
  }

  const cliente: ClienteApiIntensiCare = {
    listarGradeLeitos: async () => {
      leiturasDaGrade += 1;
      emVoo += 1;
      try {
        await esperarLiberacao();
        if (falhando) throw new Error("falha sintética de releitura");
        return { estadoCarregamento: "pronto" as const, dados: [ITEM_A], problema: null };
      } finally {
        emVoo -= 1;
      }
    },
    obterAvaliacaoPaciente: async () => {
      leiturasDoDetalhe += 1;
      emVoo += 1;
      try {
        await esperarLiberacao();
        if (falhando) throw new Error("falha sintética de releitura");
        return { estadoCarregamento: "pronto" as const, dados: ITEM_A, problema: null };
      } finally {
        emVoo -= 1;
      }
    },
    reconhecerAlerta: async () => ({ estadoCarregamento: "erro", dados: null, problema: null }),
  };

  render(
    <App
      cliente={cliente}
      sessao={criarSessaoControlada("ativa", "Bearer SYNTH-TESTE")}
      historico={criarHistoricoDeTeste(caminho)}
      leitorProntidao={null}
      portasDeEventos={{
        abrirFluxo: fluxo.abrir,
        emitirTicket: emissor.emitir,
        relogio,
        sortear: () => 0.5,
      }}
    />,
  );

  return {
    fluxo,
    emissor,
    relogio,
    leiturasDaGrade: () => leiturasDaGrade,
    leiturasDoDetalhe: () => leiturasDoDetalhe,
    leiturasEmVoo: () => emVoo,
    travarLeituras: () => {
      travado = true;
    },
    liberarLeituras: () => {
      travado = false;
      const pendentes = liberadores.splice(0, liberadores.length);
      for (const liberar of pendentes) liberar();
    },
    falharLeituras: (valor) => {
      falhando = valor;
    },
  };
}

/** Deixa as microtarefas pendentes (ticket, releitura, despacho) rodarem. */
async function assentar(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** O que a tela declara de conectividade agora; `null` = nenhum banner. */
function conectividadeNaTela(): string | null {
  const indicador = screen.queryByTestId("indicador-conectividade");
  return indicador === null ? null : indicador.getAttribute("data-conectividade");
}

/** Entrega um quadro ao fluxo corrente, dentro de `act`. */
function entregar(bancada: Bancada, quadro: QuadroRecebido): void {
  act(() => {
    bancada.fluxo.atual().aoQuadro(quadro);
  });
}

function abrir(bancada: Bancada): void {
  act(() => {
    bancada.fluxo.atual().aoAbrir();
  });
}

// ---------------------------------------------------------------------------
// 1. Uma conexão por aba
// ---------------------------------------------------------------------------

describe("uma única conexão por aba", () => {
  it("montar a casca abre EXATAMENTE um fluxo", async () => {
    const bancada = montar();
    await waitFor(() => {
      expect(bancada.fluxo.aberturas.length).toBeGreaterThan(0);
    });
    expect(
      bancada.fluxo.aberturas,
      "mais de um fluxo aberto: o ticket é de uso único e o navegador limita conexões por origem",
    ).toHaveLength(1);
  });

  it("navegar da grade para o detalhe NÃO abre um segundo fluxo", async () => {
    const bancada = montar();
    await waitFor(() => {
      expect(bancada.fluxo.aberturas.length).toBe(1);
    });

    const cartao = await screen.findByRole("button", { name: new RegExp(LEITO_A) });
    act(() => {
      cartao.click();
    });
    await screen.findByRole("heading", { name: LEITO_A });

    expect(bancada.fluxo.aberturas).toHaveLength(1);
    expect(bancada.fluxo.fechados).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. O sinal de releitura chega à projeção autoritativa
// ---------------------------------------------------------------------------

describe("o evento não traz dado: ele dispara a releitura da projeção", () => {
  it("um evento de dados faz a GRADE reler a projeção", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    await waitFor(() => expect(bancada.leiturasDaGrade()).toBeGreaterThan(0));
    const antes = bancada.leiturasDaGrade();

    entregar(bancada, quadroDeDados(1));

    await waitFor(() => {
      expect(
        bancada.leiturasDaGrade(),
        "o sinal de releitura não chegou à grade — o push não muda nada na tela",
      ).toBeGreaterThan(antes);
    });
  });

  it("um evento de dados faz o DETALHE reler a projeção", async () => {
    const bancada = montar(`/leitos/${LEITO_A}`);
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    await waitFor(() => expect(bancada.leiturasDoDetalhe()).toBeGreaterThan(0));
    const antes = bancada.leiturasDoDetalhe();

    entregar(bancada, quadroDeDados(1));

    await waitFor(() => {
      expect(bancada.leiturasDoDetalhe()).toBeGreaterThan(antes);
    });
  });

  it("o catch-up inteiro produz UMA releitura NA TELA, não uma por evento", async () => {
    /*
      A máquina já suprimia a releitura por evento durante `replaying` — ela sai
      uma única vez quando o servidor declara `online` (anti-tempestade,
      ADR-0011 P5). A FIAÇÃO desfazia isso: a tela recebia
      `eventos.sinalDeReleitura + pedidosDeReconciliacao`, e o primeiro contador
      avança a CADA evento de dados, inclusive durante o catch-up. Resultado: uma
      requisição por evento replicado, exatamente a rajada que a máquina evita.

      Hoje desce só o contador de PEDIDOS, que é o que a máquina de fato decidiu.
    */
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("replaying", 0));
    await waitFor(() => expect(bancada.leiturasDaGrade()).toBeGreaterThan(0));
    const antes = bancada.leiturasDaGrade();

    for (let sequencia = 1; sequencia <= 5; sequencia += 1) {
      entregar(bancada, quadroDeDados(sequencia));
    }
    await assentar();

    expect(bancada.leiturasDaGrade(), "cada evento do catch-up virou uma requisição da tela").toBe(
      antes,
    );

    entregar(bancada, quadroDeEstado("online", 5));
    await waitFor(() => {
      expect(bancada.leiturasDaGrade()).toBe(antes + 1);
    });
    // …e UMA só: a rajada inteira coalesceu num único pedido.
    await assentar();
    expect(bancada.leiturasDaGrade()).toBe(antes + 1);
  });

  it("MONTAR uma tela com o sinal já adiantado não dispara releitura extra", async () => {
    // O contador de sinais é da ABA, não da tela. Quem monta depois herda um
    // número alto; tratá-lo como "sinal novo" faria toda navegação custar uma
    // requisição a mais, para sempre.
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    entregar(bancada, quadroDeDados(1));
    entregar(bancada, quadroDeDados(2));
    await waitFor(() => expect(bancada.leiturasDaGrade()).toBeGreaterThan(1));

    const cartao = await screen.findByRole("button", { name: new RegExp(LEITO_A) });
    act(() => {
      cartao.click();
    });
    await screen.findByRole("heading", { name: LEITO_A });
    await waitFor(() => expect(bancada.leiturasDoDetalhe()).toBe(1));

    // Uma leitura: a de montagem. Nenhuma extra pelos sinais anteriores.
    expect(bancada.leiturasDoDetalhe()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 3. Quarta origem de degradação, aditiva
// ---------------------------------------------------------------------------

describe("degradação do push é a QUARTA origem, e é aditiva", () => {
  it("o servidor declarando `degraded` degrada a tela", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("degraded", 0));

    await waitFor(() => {
      const indicador = screen.getByTestId("indicador-conectividade");
      expect(indicador.getAttribute("data-conectividade")).toBe("degradado");
    });
  });

  it("push saudável NÃO apaga a degradação declarada pelo polling", async () => {
    // `pushDegradaATela` é aditivo por projeto: `false` significa "o push não
    // acusa nada", jamais "a tela está em dia". Aqui o push está `online` e a
    // tela continua degradada por origem própria (falha de recarga).
    const fluxo = criarFluxoDeTeste();
    const emissor = criarEmissorDeTeste();
    let falhar = false;
    const cliente: ClienteApiIntensiCare = {
      listarGradeLeitos: async () => {
        if (falhar) throw new Error("falha sintética de recarga");
        return { estadoCarregamento: "pronto" as const, dados: [ITEM_A], problema: null };
      },
      obterAvaliacaoPaciente: async () => ({
        estadoCarregamento: "pronto",
        dados: ITEM_A,
        problema: null,
      }),
      reconhecerAlerta: async () => ({ estadoCarregamento: "erro", dados: null, problema: null }),
    };

    render(
      <App
        cliente={cliente}
        sessao={criarSessaoControlada("ativa", "Bearer SYNTH-TESTE")}
        historico={criarHistoricoDeTeste("/")}
        leitorProntidao={null}
        portasDeEventos={{ abrirFluxo: fluxo.abrir, emitirTicket: emissor.emitir }}
      />,
    );

    await waitFor(() => expect(fluxo.aberturas.length).toBe(1));
    act(() => {
      fluxo.atual().aoAbrir();
    });
    act(() => {
      fluxo.atual().aoQuadro(quadroDeEstado("online", 0));
    });
    await screen.findAllByText(new RegExp(LEITO_A));

    falhar = true;
    act(() => {
      screen.getByRole("button", { name: "Atualizar" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("rotulo-frescor-visao")).toBeTruthy();
    });
    expect(
      screen.getByTestId("indicador-conectividade").getAttribute("data-conectividade"),
      "o push online apagou a degradação que o polling declarou",
    ).toBe("degradado");
  });
});

// ---------------------------------------------------------------------------
// 4. `reproduzindo` e `reconciliado` com origem real
// ---------------------------------------------------------------------------

describe("`reproduzindo` e `reconciliado` deixam de ser só catálogo", () => {
  it("o servidor declarando `replaying` chega à tela como `reproduzindo`", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("replaying", 0));

    await waitFor(() => {
      expect(screen.getByTestId("indicador-conectividade").getAttribute("data-conectividade")).toBe(
        "reproduzindo",
      );
    });
  });

  it("o servidor declarando `reconciled` chega à tela como `reconciliado`", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("reconciled", 0));

    await waitFor(() => {
      expect(screen.getByTestId("indicador-conectividade").getAttribute("data-conectividade")).toBe(
        "reconciliado",
      );
    });
  });
});

// ---------------------------------------------------------------------------
// 5. A recusa: push NÃO alimenta a prontidão do serviço
// ---------------------------------------------------------------------------

describe("o estado do socket não vira declaração do SERVIÇO", () => {
  it("push degradado NÃO produz aviso de prontidão", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("degraded", 0));

    await waitFor(() => {
      expect(screen.getByTestId("indicador-conectividade").getAttribute("data-conectividade")).toBe(
        "degradado",
      );
    });
    expect(
      screen.queryByTestId("aviso-prontidao"),
      "o estado do socket do navegador virou declaração do SERVIÇO sobre a própria capacidade",
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Fronteiras: sessão expirada e pulsação
// ---------------------------------------------------------------------------

describe("fronteiras da fiação", () => {
  it("sessão EXPIRADA não abre fluxo nem pede ticket", async () => {
    const fluxo = criarFluxoDeTeste();
    const emissor = criarEmissorDeTeste();
    render(
      <App
        cliente={{
          listarGradeLeitos: async () => ({
            estadoCarregamento: "pronto",
            dados: [ITEM_A],
            problema: null,
          }),
          obterAvaliacaoPaciente: async () => ({
            estadoCarregamento: "pronto",
            dados: ITEM_A,
            problema: null,
          }),
          reconhecerAlerta: async () => ({
            estadoCarregamento: "erro",
            dados: null,
            problema: null,
          }),
        }}
        sessao={criarSessaoControlada("expirada", null)}
        historico={criarHistoricoDeTeste("/")}
        leitorProntidao={null}
        portasDeEventos={{ abrirFluxo: fluxo.abrir, emitirTicket: emissor.emitir }}
      />,
    );

    await screen.findByText(/Sessão expirada/);
    expect(emissor.chamadas, "pediu ticket com a sessão expirada").toBe(0);
    expect(fluxo.aberturas).toHaveLength(0);
  });

  it("uma pulsação com cadência ANUNCIADA arma o vigia sem esperar a segunda", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);

    const pendentesAntes = bancada.relogio.pendentes;
    entregar(bancada, quadroDeEstado("online", 0, { intervaloPulsacaoMs: 15_000 }));
    // O vigia é um agendamento no relógio INJETADO — se ele não existir, o
    // número de pendentes não muda e a janela cega continua aberta.
    expect(bancada.relogio.pendentes).toBeGreaterThan(pendentesAntes);
  });

  it("uma pulsação mantém a tela `online` (o caminho feliz não degrada nada)", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    entregar(bancada, quadroDePulsacao(0, "online"));

    await screen.findAllByText(new RegExp(LEITO_A));
    // `online` não produz selo permanente — economia de sinal já decidida.
    expect(screen.queryByTestId("indicador-conectividade")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. "Sincronizado" exige FATO de leitura (ACH-O3-9, ACH-O3-14)
// ---------------------------------------------------------------------------

/**
 * A DEFESA QUE FALTAVA ESTAR AQUI.
 *
 * `useFluxoDeEventos.test.tsx` já provava que o hook aguarda a `Promise` de
 * `reconciliar` — mas ele mesmo INJETAVA uma `Promise` controlada. A fiação real
 * devolvia `void`, e `await undefined` resolve na microtarefa seguinte: a
 * máquina despachava `reconciliacao-concluida` ANTES de qualquer leitura, e a
 * tela anunciava "Sincronizado — dados reconciliados após reconexão." no exato
 * instante em que o cliente SABE ter perdido um evento. `maquina.test.ts` provava
 * que o REDUTOR exige o evento; ninguém provava que quem o emite tinha lido algo.
 *
 * Por isso estas asserções vivem no nível da ÁRVORE FIADA, com o `reconciliar`
 * REAL de `App.tsx`: é o único nível em que o defeito era observável.
 *
 * Rastreio: HAZ-0025 ("clinicians trust a frozen board"), SAF-0025 ("the
 * interface MUST never appear healthy when it is not"), ADR-0011 P8.
 */
describe("`reconciliado` só existe a partir de um FATO de leitura", () => {
  it("com a releitura AINDA EM VOO, a tela NÃO afirma `reconciliado`", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    await screen.findAllByText(new RegExp(LEITO_A));

    bancada.travarLeituras();
    entregar(bancada, quadroDeInstrucao());
    await assentar();

    // GUARDA DE NÃO-VACUIDADE: a releitura de fato começou e não terminou. Sem
    // isto, o teste passaria também num mundo em que releitura nenhuma ocorre.
    expect(
      bancada.leiturasEmVoo(),
      "nenhuma releitura em voo: a bancada não está exercitando a janela em questão",
    ).toBeGreaterThan(0);

    expect(
      conectividadeNaTela(),
      "a tela declarou reconciliação com a leitura autoritativa ainda pendurada (HAZ-0025)",
    ).not.toBe("reconciliado");
    expect(
      conectividadeNaTela(),
      "a lacuna continua aberta: a tela tem de declarar degradação até a leitura concluir",
    ).toBe("degradado");
  });

  it("a tela afirma `reconciliado` DEPOIS de a releitura autoritativa concluir", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    await screen.findAllByText(new RegExp(LEITO_A));

    bancada.travarLeituras();
    entregar(bancada, quadroDeInstrucao());
    await assentar();
    expect(conectividadeNaTela()).toBe("degradado");

    await act(async () => {
      bancada.liberarLeituras();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(
        conectividadeNaTela(),
        "a leitura concluiu e a tela continuou declarando degradação",
      ).toBe("reconciliado");
    });
  });

  it("SEM tela clínica montada, nada é reconciliado — e a volta à grade resolve", async () => {
    /*
      A borda que o desenho deixa em aberto, medida em vez de suposta: numa rota
      sem tela clínica (endereço não reconhecido) NINGUÉM lê a projeção, logo
      não há fato de leitura e o pedido fica pendente. Isso é fail-closed — a
      lacuna permanece aberta —, e é preciso que a volta a uma tela clínica
      RESOLVA o pedido, em vez de deixá-lo pendurado para sempre.
    */
    const bancada = montar("/endereco-que-nao-existe");
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    entregar(bancada, quadroDeInstrucao());
    await assentar();

    // Guarda de não-vacuidade: não há tela clínica, e leitura alguma ocorreu.
    await screen.findByTestId("caminho-nao-reconhecido");
    expect(bancada.leiturasDaGrade()).toBe(0);
    expect(bancada.leiturasDoDetalhe()).toBe(0);

    act(() => {
      screen.getByRole("button", { name: "Ir para a grade de leitos" }).click();
    });
    await screen.findAllByText(new RegExp(LEITO_A));
    await assentar();

    // A primeira leitura da grade É o fato que faltava: o pedido se resolve.
    expect(bancada.leiturasDaGrade()).toBeGreaterThan(0);
    await waitFor(() => {
      expect(conectividadeNaTela()).toBe("reconciliado");
    });
  });

  it("releitura que FALHA nunca vira `reconciliado` — a lacuna continua aberta", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    await screen.findAllByText(new RegExp(LEITO_A));

    bancada.travarLeituras();
    bancada.falharLeituras(true);
    entregar(bancada, quadroDeInstrucao());
    await assentar();
    expect(bancada.leiturasEmVoo()).toBeGreaterThan(0);

    await act(async () => {
      bancada.liberarLeituras();
      await Promise.resolve();
    });
    await assentar();

    expect(
      conectividadeNaTela(),
      "a releitura falhou e a tela declarou reconciliação assim mesmo",
    ).not.toBe("reconciliado");
  });
});

// ---------------------------------------------------------------------------
// 8. Push que morre não pode custar ZERO pixels (ACH-O3-10)
// ---------------------------------------------------------------------------

/**
 * `QAS-0023` mede "count of degradations with no user-visible representation:
 * must be zero". A guarda `pulsacoesRecebidas === 0` de `./maquina.ts` estava
 * sobre o predicado ERRADO: um push que abriu o fluxo, recebeu o primeiro quadro
 * do servidor e então caiu — sem que nenhuma PULSAÇÃO tivesse chegado ainda —
 * era tratado como "push que nunca se provou vivo", e a tela ficava muda.
 *
 * "Se provou vivo" é o fluxo ABERTO (ou o primeiro quadro do servidor), não a
 * chegada de uma pulsação.
 */
describe("push que se provou vivo e morreu APARECE na tela", () => {
  it("queda de transporte ANTES da primeira pulsação degrada a tela", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    await screen.findAllByText(new RegExp(LEITO_A));
    expect(conectividadeNaTela(), "o caminho feliz não pode já estar degradado").toBeNull();

    act(() => {
      bancada.fluxo.atual().aoFalhaDeTransporte();
    });
    await assentar();

    expect(
      conectividadeNaTela(),
      "o push se provou vivo, caiu, e a tela se apresentou como saudável (SAF-0025)",
    ).toBe("degradado");
  });

  it("push PARADO por ticket recusado na reconexão não fica invisível", async () => {
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    // Com a política ANUNCIADA pelo servidor, a queda agenda reconexão — é o
    // caminho em que o ticket volta a ser pedido e pode ser recusado.
    entregar(bancada, quadroDeEstado("online", 0, { reconexao: POLITICA_DE_TESTE }));
    await screen.findAllByText(new RegExp(LEITO_A));

    bancada.emissor.responder({ ok: false, motivo: "recusado" });
    act(() => {
      bancada.fluxo.atual().aoFalhaDeTransporte();
    });
    await assentar();
    await act(async () => {
      bancada.relogio.avancar(POLITICA_DE_TESTE.esperaMaximaMs * 2);
      await Promise.resolve();
    });
    await assentar();

    // GUARDA DE NÃO-VACUIDADE: houve de fato uma segunda tentativa de ticket, e
    // ela foi recusada — sem isto o teste mediria apenas a queda anterior.
    expect(
      bancada.emissor.chamadas,
      "nenhuma reconexão foi tentada: o caminho de ticket recusado não foi exercitado",
    ).toBeGreaterThan(1);
    expect(
      conectividadeNaTela(),
      "o push morreu em definitivo e a tela não declarou nada (QAS-0023 exige contagem zero)",
    ).toBe("degradado");
  });

  it("push PARADO por falta de política de reconexão não fica invisível", async () => {
    // Sem política anunciada, a primeira queda PARA o push de forma explícita
    // (ADR-0011 P5: o cliente não inventa backoff). Parar é correto; parar em
    // silêncio, não.
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    abrir(bancada);
    entregar(bancada, quadroDeEstado("online", 0));
    await screen.findAllByText(new RegExp(LEITO_A));

    act(() => {
      bancada.fluxo.atual().aoFalhaDeTransporte();
    });
    await assentar();
    await act(async () => {
      bancada.relogio.avancar(60_000);
      await Promise.resolve();
    });
    await assentar();

    // GUARDA DE NÃO-VACUIDADE: nenhuma reconexão foi agendada — o push está
    // morto para sempre, e é exatamente por isso que a tela precisa declarar.
    expect(bancada.emissor.chamadas).toBe(1);
    expect(bancada.fluxo.aberturas).toHaveLength(1);
    expect(
      conectividadeNaTela(),
      "o push parou para sempre e a tela continuou se apresentando como saudável",
    ).toBe("degradado");
  });
});

// ---------------------------------------------------------------------------
// 9. Precedência: os graves não podem ser mudos onde o informativo fala
//    (ACH-O3-11)
// ---------------------------------------------------------------------------

/**
 * O MESMO estado de fio produzia DUAS afirmações diferentes conforme já ter
 * chegado uma pulsação: `offline` e `reconnecting` do fio davam tela SILENCIOSA
 * antes da primeira pulsação, enquanto `replaying` — informativo e menos grave —
 * produzia banner. Precedência invertida.
 */
describe("os estados GRAVES do fio entram em toda janela", () => {
  it.each(["offline", "reconnecting", "degraded"] as const)(
    "fio=%s antes da primeira pulsação NÃO deixa a tela silenciosa",
    async (estado) => {
      const bancada = montar();
      await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
      abrir(bancada);
      entregar(bancada, quadroDeEstado(estado, 0));
      await assentar();

      expect(
        conectividadeNaTela(),
        `fio=${estado} produziu tela sem banner: a tela se apresenta como 'online'`,
      ).not.toBeNull();
    },
  );

  it("`reproduzindo` NÃO é promovido numa janela em que os graves seriam mudos", async () => {
    // A janela muda é a que antecede a prova de vida do push (antes de o fluxo
    // abrir). Nela nenhum estado do fio pode chegar à tela — nem o grave, que a
    // máquina cala de propósito, nem o informativo, que a promoveria sozinho.
    const bancada = montar();
    await waitFor(() => expect(bancada.fluxo.aberturas.length).toBe(1));
    // Fluxo NÃO aberto: o quadro é tardio e a máquina o ignora.
    entregar(bancada, quadroDeEstado("replaying", 0));
    await assentar();

    expect(
      conectividadeNaTela(),
      "a tela promoveu `reproduzindo` numa janela em que um estado grave ficaria mudo",
    ).not.toBe("reproduzindo");
  });
});
