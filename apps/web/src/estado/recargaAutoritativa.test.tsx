/**
 * apps/web/src/estado/recargaAutoritativa.test.tsx
 *
 * TESTE DE ACEITE de LAC-L1 — a tela de vigilância deixa de ser um instantâneo.
 *
 * O ESTADO ANTERIOR, REPRODUZIDO ANTES DE EDITAR. Não havia atualização
 * automática de espécie alguma em `apps/web`: nem SSE, nem WebSocket, nem
 * `setInterval`, nem refetch, nem biblioteca de dados (verificado por ausência
 * total desses símbolos em `apps/web/src`; o único `setTimeout` era o tempo
 * limite de 15 s da requisição). A grade só mudava se alguém clicasse em
 * "Atualizar" — e o rótulo "Dado atual" envelhecia junto com a aba aberta.
 * Isto é HAZ-0025 ("clinicians trust a frozen board") e o oposto de SAF-0025
 * ("the interface MUST never appear healthy when feeds, workers, rules,
 * identity, or freshness are impaired"). ADR-0011 P8 define o polling
 * server-authoritative como "o caminho de verdade de recuperação de TODA
 * superfície"; ele passou a existir.
 *
 * RELÓGIO INJETADO EM TODOS OS CASOS. Nenhum teste aqui lê `Date.now()` nem
 * espera tempo real: o tempo é uma dependência (`../estado/relogio.ts`). Além
 * de determinismo, isso dá uma propriedade que o despacho exige — um teste que
 * passasse porque o código usa o relógio REAL falharia aqui, porque avançar o
 * relógio injetado não moveria nada.
 *
 * Rastreio: LAC-L1, ADR-0011 P6/P7/P8, ADR-0008 N5, HAZ-0025, SAF-0025,
 * QAS-0023, IA-P2/HAZ-0037.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ClienteApiIntensiCare, OpcoesChamada, RespostaApi } from "../api/tipos.js";
import { DetalhePaciente } from "../components/DetalhePaciente.js";
import { GradeLeitos } from "../components/GradeLeitos.js";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import { criarRelogioDeTeste, type RelogioDeTeste } from "../teste/relogioDeTeste.js";
import { CICLOS_PARA_DECLARAR_PERDA, calcularIdadeVisao } from "./idadeVisao.js";
import {
  INTERVALO_RECARGA_PADRAO_MS,
  INTERVALO_TIQUE_IDADE_MS,
  TEMPO_LIMITE_PADRAO_MS,
} from "./recursoRemoto.js";

// ---------------------------------------------------------------------------
// Dublês
// ---------------------------------------------------------------------------

const INTERVALO = INTERVALO_RECARGA_PADRAO_MS;

function leito(leitoId: string, alertas: Alerta[] = []): ItemGradeLeito {
  return {
    leitoId,
    pacienteRef: `amh:psr:v1:SYNTH-${leitoId}`,
    pacienteApelido: `Paciente ${leitoId}`,
    avaliacao: {
      estadoAvaliacao: "valida",
      news2Total: 3,
      bandaRisco: "medio",
      contribuicoes: [],
      insumosAusentes: [],
      insumosVelhos: [],
      motivos: [],
      anotacoes: [],
      explicacao: "SYNTH — explicação agregada do backend.",
      parametroVermelho: false,
      calculadoEm: "2026-08-17T10:00:00.000Z",
      versaoRegra: "RULE-NEWS2@0.2.0",
    },
    alertas,
  };
}

const LEITO = leito("SYNTH-LEITO-01");

function alertaPendente(alertaId: string): Alerta {
  return {
    alertaId,
    leitoId: "SYNTH-LEITO-01",
    pacienteRef: "amh:psr:v1:SYNTH-P001",
    severidade: "alto",
    descricao: "Alerta consultivo NEWS2 — a decisão clínica permanece com o profissional.",
    criadoEm: "2026-08-17T10:00:00.000Z",
    estado: "nao_atribuido",
    versao: 1,
  };
}

interface DubleDeGrade {
  readonly cliente: ClienteApiIntensiCare;
  /** Um `AbortSignal` por chamada, na ordem — o cancelamento é provado nele. */
  readonly sinais: AbortSignal[];
  /** Quantas chamadas a `listarGradeLeitos` já foram feitas. */
  readonly chamadas: () => number;
}

interface OpcoesDuble {
  /**
   * Quando `true`, uma chamada PENDURADA rejeita assim que o sinal aborta —
   * que é o que todo cliente HTTP real faz (`fetch` rejeita com `AbortError`;
   * `criarLeitorDeProntidaoHttp` PROPAGA o aborto de propósito).
   *
   * POR QUE ISTO PRECISA SER OPCIONAL E EXPLÍCITO. O padrão (`false`) devolve
   * uma Promise que NUNCA assenta; com ela, o `try/catch/finally` de
   * `executar` jamais roda, e todo o caminho de encerramento do ciclo fica
   * invisível ao teste. Foi essa cegueira que deixou passar o defeito coberto
   * pelo ACEITE L1-4 abaixo (revisão adversarial do PR #8): o dublê mudo
   * escondia o `finally`, e o `finally` era exatamente onde a releitura
   * periódica morria depois de um tempo esgotado.
   */
  readonly rejeitarNoAborto?: boolean;
}

/**
 * Cliente cuja resposta é decidida por chamada. `responder(n)` recebe o número
 * da chamada (1-based) e devolve a resposta, ou `null` para "esta chamada NÃO
 * resolve" (fica em voo até ser abortada).
 */
function dubleDeGrade(
  responder: (n: number) => RespostaApi<ItemGradeLeito[]> | null,
  opcoesDuble: OpcoesDuble = {},
): DubleDeGrade {
  const sinais: AbortSignal[] = [];
  let n = 0;

  const listar = (opcoes?: OpcoesChamada): Promise<RespostaApi<ItemGradeLeito[]>> => {
    n += 1;
    const sinal = opcoes?.sinal;
    if (sinal) sinais.push(sinal);
    const resposta = responder(n);
    if (resposta === null) {
      return new Promise<RespostaApi<ItemGradeLeito[]>>((_resolver, rejeitar) => {
        if (opcoesDuble.rejeitarNoAborto !== true || sinal === undefined) return;
        if (sinal.aborted) {
          rejeitar(sinal.reason);
          return;
        }
        sinal.addEventListener(
          "abort",
          () => {
            rejeitar(sinal.reason);
          },
          { once: true },
        );
      });
    }
    return Promise.resolve(resposta);
  };

  return {
    sinais,
    chamadas: () => n,
    cliente: {
      listarGradeLeitos: listar,
      obterAvaliacaoPaciente: async (): Promise<RespostaApi<ItemGradeLeito>> => ({
        estadoCarregamento: "pronto",
        dados: LEITO,
        problema: null,
      }),
      reconhecerAlerta: async (): Promise<RespostaApi<Alerta>> => ({
        estadoCarregamento: "erro",
        dados: null,
        problema: null,
      }),
    },
  };
}

const OK = (itens: ItemGradeLeito[]): RespostaApi<ItemGradeLeito[]> => ({
  estadoCarregamento: "pronto",
  dados: itens,
  problema: null,
});

const INDISPONIVEL: RespostaApi<ItemGradeLeito[]> = {
  estadoCarregamento: "indisponivel",
  dados: null,
  problema: {
    type: "about:blank",
    title: "API indisponível",
    status: 503,
    detail: "Falha sintética de recarga automática.",
  },
};

/** Avança o relógio injetado dentro de `act` e deixa as microtarefas correrem. */
async function avancar(relogio: RelogioDeTeste, ms: number): Promise<void> {
  await act(async () => {
    relogio.avancar(ms);
    await Promise.resolve();
  });
}

/**
 * Deixa passar um turno de macrotarefa do relógio REAL sem tocar no injetado.
 * É a metade "falha se crescer sem tempo avançar" da guarda de não-vacuidade:
 * se o código sob teste usasse o relógio real, algo se moveria aqui.
 */
async function turnoRealSemAvancarORelogio(): Promise<void> {
  await act(async () => {
    await new Promise((resolver) => {
      globalThis.setTimeout(resolver, 20);
    });
  });
}

function idadeExibida(): string {
  return screen.getByTestId("idade-visao-texto").textContent ?? "";
}

// ---------------------------------------------------------------------------
// Parte pura
// ---------------------------------------------------------------------------

describe("calcularIdadeVisao — parte pura, sem React e sem relógio real", () => {
  it("sem leitura bem-sucedida não inventa idade", () => {
    const resumo = calcularIdadeVisao(null, 1_000, INTERVALO);
    expect(resumo.classe).toBe("sem_leitura");
    expect(resumo.idadeMs).toBeNull();
    expect(resumo.ciclosVencidos).toBe(0);
  });

  it("dentro de um ciclo é 'no_ciclo'; a idade é o fato bruto", () => {
    const resumo = calcularIdadeVisao(0, INTERVALO - 1, INTERVALO);
    expect(resumo.classe).toBe("no_ciclo");
    expect(resumo.idadeMs).toBe(INTERVALO - 1);
    expect(resumo.ciclosVencidos).toBe(0);
  });

  it("um ciclo vencido ainda NÃO declara perda — a recarga pode estar em voo", () => {
    const resumo = calcularIdadeVisao(0, INTERVALO + 1, INTERVALO);
    expect(resumo.ciclosVencidos).toBe(1);
    expect(resumo.classe).toBe("no_ciclo");
  });

  it("a partir de dois ciclos vencidos declara 'ciclo_perdido'", () => {
    const resumo = calcularIdadeVisao(0, INTERVALO * CICLOS_PARA_DECLARAR_PERDA, INTERVALO);
    expect(resumo.classe).toBe("ciclo_perdido");
    expect(resumo.ciclosVencidos).toBe(CICLOS_PARA_DECLARAR_PERDA);
  });

  it("relógio para trás vira idade zero, nunca idade negativa", () => {
    const resumo = calcularIdadeVisao(10_000, 4_000, INTERVALO);
    expect(resumo.idadeMs).toBe(0);
    expect(resumo.classe).toBe("no_ciclo");
  });
});

// ---------------------------------------------------------------------------
// ACEITE 1 — sem interação nenhuma, a projeção é RELIDA
// ---------------------------------------------------------------------------

describe("ACEITE L1-1 — a projeção é relida sem interação do usuário", () => {
  it("a contagem de chamadas cresce quando (e somente quando) o tempo avança", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade(() => OK([LEITO]));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/SYNTH-LEITO-01/).length).toBeGreaterThan(0);
    });
    expect(duble.chamadas()).toBe(1);
    const disparosAposPrimeiraLeitura = relogio.disparos;

    // GUARDA DE NÃO-VACUIDADE (metade A): sem avanço do relógio injetado,
    // NADA acontece — nem com o relógio real correndo.
    await turnoRealSemAvancarORelogio();
    expect(
      duble.chamadas(),
      "a contagem cresceu SEM o relógio injetado avançar — o código está lendo outro relógio",
    ).toBe(1);

    // Nenhuma interação: só o tempo.
    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(duble.chamadas()).toBe(2);
    });

    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(duble.chamadas()).toBe(3);
    });

    // GUARDA DE NÃO-VACUIDADE (metade B): o crescimento veio de agendamentos
    // que DISPARARAM, não de renderizações a mais.
    expect(relogio.disparos).toBeGreaterThan(disparosAposPrimeiraLeitura);
  });

  it("o detalhe do paciente também é relido sem interação", async () => {
    const relogio = criarRelogioDeTeste();
    let chamadas = 0;
    const cliente: ClienteApiIntensiCare = {
      listarGradeLeitos: async () => OK([LEITO]),
      obterAvaliacaoPaciente: async (): Promise<RespostaApi<ItemGradeLeito>> => {
        chamadas += 1;
        return { estadoCarregamento: "pronto", dados: LEITO, problema: null };
      },
      reconhecerAlerta: async (): Promise<RespostaApi<Alerta>> => ({
        estadoCarregamento: "erro",
        dados: null,
        problema: null,
      }),
    };

    render(
      <DetalhePaciente
        leitoId="SYNTH-LEITO-01"
        cliente={cliente}
        aoVoltar={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );

    await waitFor(() => {
      expect(chamadas).toBe(1);
    });
    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(chamadas).toBe(2);
    });
  });

  it("nunca sobrepõe requisições: um ciclo lento NÃO acumula chamadas", async () => {
    const relogio = criarRelogioDeTeste();
    // A 1ª resolve; da 2ª em diante, nada resolve (servidor pendurado).
    const duble = dubleDeGrade((n) => (n === 1 ? OK([LEITO]) : null));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await waitFor(() => {
      expect(duble.chamadas()).toBe(1);
    });

    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(duble.chamadas()).toBe(2);
    });

    // Dez intervalos com a 2ª chamada AINDA EM VOO. Um `setInterval` teria
    // enfileirado dez requisições sobre uma conexão que não respondeu.
    await avancar(relogio, INTERVALO * 10);
    expect(
      duble.chamadas(),
      "houve sobreposição: o próximo ciclo foi agendado antes de o anterior terminar",
    ).toBe(2);
  });

  it("desligar a recarga (intervalo null) mantém o comportamento anterior: nada se move", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade(() => OK([LEITO]));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={null}
      />,
    );
    await waitFor(() => {
      expect(duble.chamadas()).toBe(1);
    });

    await avancar(relogio, INTERVALO * 5);
    expect(duble.chamadas()).toBe(1);
    // E sem cadência declarada a tela NÃO exibe idade — não há referência.
    expect(screen.queryByTestId("rotulo-idade-visao")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ACEITE 2 — a idade da visão aparece e MUDA com o relógio
// ---------------------------------------------------------------------------

describe("ACEITE L1-2 — a idade da visão está na tela e envelhece com o relógio", () => {
  it("o texto de idade muda quando o relógio avança sem leitura nova", async () => {
    const relogio = criarRelogioDeTeste();
    // A 1ª resolve; as demais ficam em voo — assim NENHUMA leitura nova ocorre
    // e a idade só pode crescer.
    const duble = dubleDeGrade((n) => (n === 1 ? OK([LEITO]) : null));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("rotulo-idade-visao")).toBeTruthy();
    });
    const inicial = idadeExibida();
    expect(inicial).toMatch(/Última leitura bem-sucedida há 0 s/);

    await avancar(relogio, INTERVALO_TIQUE_IDADE_MS);
    const depois = idadeExibida();
    expect(depois).not.toBe(inicial);
    expect(depois).toMatch(/há 5 s/);

    await avancar(relogio, 55_000);
    expect(idadeExibida()).toMatch(/há 1 min/);
  });

  it("dois ciclos sem leitura nova declaram 'ciclo_perdido' no ponto de uso clínico", async () => {
    const relogio = criarRelogioDeTeste();
    // A 1ª resolve com dado; as recargas automáticas FALHAM.
    const duble = dubleDeGrade((n) => (n === 1 ? OK([LEITO]) : INDISPONIVEL));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("rotulo-idade-visao")).toBeTruthy();
    });
    expect(screen.getByTestId("rotulo-idade-visao").getAttribute("data-idade-visao")).toBe(
      "no_ciclo",
    );

    await avancar(relogio, INTERVALO * CICLOS_PARA_DECLARAR_PERDA);

    await waitFor(() => {
      expect(screen.getByTestId("rotulo-idade-visao").getAttribute("data-idade-visao")).toBe(
        "ciclo_perdido",
      );
    });
    // A degradação chega ao indicador de conectividade, no ponto de uso —
    // não a um painel de operador (SAF-0025).
    expect(screen.getByTestId("indicador-conectividade").getAttribute("data-conectividade")).toBe(
      "degradado",
    );
    expect(screen.getByTestId("idade-visao-ciclos").textContent ?? "").toMatch(/: 2\./);
  });

  it("uma releitura bem-sucedida REJUVENESCE a idade — o rótulo não é congelado", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade(() => OK([LEITO]));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("rotulo-idade-visao")).toBeTruthy();
    });

    await avancar(relogio, INTERVALO_TIQUE_IDADE_MS);
    expect(idadeExibida()).toMatch(/há 5 s/);

    // O ciclo de recarga vence e a leitura dá certo: a idade volta a zero.
    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(idadeExibida()).toMatch(/há 0 s/);
    });
  });

  it("o número da idade NÃO vive numa live region (senão o leitor de tela vira metrônomo)", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade((n) => (n === 1 ? OK([LEITO]) : null));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("idade-visao-texto")).toBeTruthy();
    });

    // IA-P2/HAZ-0037: anúncio coalescido, nunca rajada. O parágrafo que muda a
    // cada tique não pode estar sob `aria-live`.
    expect(screen.getByTestId("idade-visao-texto").closest("[aria-live]")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ACEITE 3 — recarga AUTOMÁTICA que falha não apaga o conteúdo (I2 sob o novo caminho)
// ---------------------------------------------------------------------------

describe("ACEITE L1-3 — falha de recarga AUTOMÁTICA preserva e rotula o conteúdo", () => {
  it("mantém a grade visível e a declara desatualizada, sem clique nenhum", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade((n) => (n === 1 ? OK([LEITO]) : INDISPONIVEL));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await screen.findAllByText(/SYNTH-LEITO-01/);
    expect(screen.queryByTestId("rotulo-frescor-visao")).toBeNull();

    await avancar(relogio, INTERVALO);

    await waitFor(() => {
      expect(screen.getByTestId("rotulo-frescor-visao")).toBeTruthy();
    });
    // O conteúdo anterior CONTINUA visível (tela calma sem dado é proibida)...
    expect(screen.getAllByText(/SYNTH-LEITO-01/).length).toBeGreaterThan(0);
    // ...e rotulado como não-atual.
    expect(screen.getByTestId("rotulo-frescor-visao").getAttribute("data-frescor-visao")).toBe(
      "desatualizado_apos_falha",
    );
    // O erro é acionável, e não uma tela travada com texto bonito.
    expect(screen.getByRole("button", { name: /Tentar novamente/i })).toBeTruthy();
  });

  it("uma recarga automática BEM-SUCEDIDA não pisca 'Tentando novamente…' (I6)", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade(() => OK([LEITO]));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await screen.findAllByText(/SYNTH-LEITO-01/);

    // Dispara o ciclo SEM deixar as microtarefas resolverem: este é exatamente
    // o instante em que o antigo `iniciar` teria posto a tela em `retentando`
    // e apagado a grade.
    act(() => {
      relogio.avancar(INTERVALO);
    });

    expect(screen.queryByText(/Tentando novamente…/)).toBeNull();
    expect(screen.getAllByText(/SYNTH-LEITO-01/).length).toBeGreaterThan(0);
    expect(document.querySelector('[data-contexto="grade de leitos"]')).toBeNull();
  });

  it("a recarga automática se recupera sozinha: servidor que volta traz o dado de volta", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade((n) => {
      if (n === 1) return OK([LEITO]);
      if (n === 2) return INDISPONIVEL;
      return OK([leito("SYNTH-LEITO-02")]);
    });

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await screen.findAllByText(/SYNTH-LEITO-01/);

    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(screen.getByTestId("rotulo-frescor-visao")).toBeTruthy();
    });

    // Nenhum clique: o ciclo seguinte é agendado mesmo APÓS falha.
    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(screen.getAllByText(/SYNTH-LEITO-02/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByTestId("rotulo-frescor-visao")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ACEITE 4 — TEMPO ESGOTADO não pode matar o ciclo de releitura
// ---------------------------------------------------------------------------

/**
 * DEFEITO REPRODUZIDO ANTES DA CORREÇÃO (revisão adversarial do PR #8, P1).
 *
 * O caminho de TEMPO ESGOTADO é diferente do caminho de resposta de erro
 * RESOLVIDA — e só o segundo estava coberto (ACEITE L1-3). No primeiro, quando
 * o `finally` de `executar` rodava, `controlador.signal.aborted` já era `true`
 * (o próprio temporizador havia abortado), e as duas linhas do `finally`
 * estavam guardadas por essa condição:
 *
 *   - `if (!controlador.signal.aborted) setBuscaEmCurso(false)` — não rodava,
 *     e "Atualizando…" ficava na tela para sempre, SEM requisição em voo;
 *   - `agendarProximaRecarga()` — retornava cedo em
 *     `if (controlador.signal.aborted) return`, e nenhum ciclo seguinte era
 *     agendado: a releitura periódica morria em definitivo depois de UM único
 *     tempo esgotado.
 *
 * O resultado é a mesma família de HAZ-0025 que LAC-L1 existe para fechar — uma
 * tela que parece viva ("Atualizando…") sobre um polling morto é pior que uma
 * tela reconhecidamente parada. A correção distingue aborto por DESMONTAGEM
 * (não reagenda) de aborto por TEMPO ESGOTADO (reagenda e libera o indicador).
 *
 * Este teste só enxerga o defeito porque o dublê HONRA o aborto
 * (`rejeitarNoAborto`): com uma Promise que nunca assenta, o `finally` não roda
 * e o caminho inteiro fica invisível.
 */
describe("ACEITE L1-4 — um tempo esgotado NÃO mata a releitura periódica", () => {
  it("depois do tempo esgotado o ciclo seguinte ocorre e 'Atualizando…' desaparece", async () => {
    const relogio = criarRelogioDeTeste();
    // 1ª leitura OK; a 2ª PENDURA (e rejeita no aborto, como o `fetch` real);
    // da 3ª em diante o servidor volta — se ainda houver ciclo para perguntar.
    const duble = dubleDeGrade((n) => (n === 2 ? null : OK([LEITO])), {
      rejeitarNoAborto: true,
    });

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await waitFor(() => {
      expect(duble.chamadas()).toBe(1);
    });

    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(duble.chamadas()).toBe(2);
    });
    // Há requisição em voo AGORA — o indicador é legítimo neste instante.
    await waitFor(() => {
      expect(screen.getByTestId("idade-visao-em-curso")).toBeTruthy();
    });

    // O tempo limite estoura: o aborto é REAL e observável no próprio sinal.
    await avancar(relogio, TEMPO_LIMITE_PADRAO_MS);
    await waitFor(() => {
      expect(screen.getByTestId("rotulo-frescor-visao").getAttribute("data-frescor-visao")).toBe(
        "desatualizado_apos_falha",
      );
    });
    expect(duble.sinais[1]?.aborted).toBe(true);
    expect((duble.sinais[1]?.reason as { causaAborto?: string })?.causaAborto).toBe(
      "tempo_esgotado",
    );

    // (a) Nenhuma requisição em voo ⇒ nenhum "Atualizando…". Um indicador de
    //     atividade sobre coisa nenhuma é a mentira mais barata desta tela.
    expect(
      screen.queryByTestId("idade-visao-em-curso"),
      "'Atualizando…' permaneceu sem nenhuma requisição em voo",
    ).toBeNull();

    // (b) O ciclo seguinte CONTINUA sendo agendado: um servidor que volta
    //     sozinho não pode exigir clique para a tela voltar à vida.
    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(duble.chamadas(), "a releitura periódica morreu após UM único tempo esgotado").toBe(3);
    });
    // E a recuperação chega à tela: o rótulo de desatualizado some sozinho.
    await waitFor(() => {
      expect(screen.queryByTestId("rotulo-frescor-visao")).toBeNull();
    });
  });

  it("tempo esgotado repetido segue reagendando — o ciclo não decai a uma tentativa só", async () => {
    const relogio = criarRelogioDeTeste();
    // 1ª OK; TODAS as seguintes penduram e são abortadas por tempo esgotado.
    const duble = dubleDeGrade((n) => (n === 1 ? OK([LEITO]) : null), {
      rejeitarNoAborto: true,
    });

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await waitFor(() => {
      expect(duble.chamadas()).toBe(1);
    });

    /*
      Três ciclos completos (espera + tempo limite), um de cada vez: o relógio
      precisa deixar as microtarefas correrem entre eles, porque o
      reagendamento acontece no `finally`, depois da rejeição.

      A ESPERA DE CADA CICLO MUDOU, e o teste mudou junto — de propósito. Desde
      que o ESPAÇAMENTO POR FALHAS REPETIDAS existe (`./cadenciaDeRecarga.ts`),
      a partir da segunda falha seguida a espera é multiplicada pelo fator, e
      avançar sempre `INTERVALO` deixaria o terceiro ciclo sem vencer. Avançar
      pelo fator vigente é o que mantém o teste medindo o que ele diz medir: que
      o ciclo CONTINUA existindo depois de tempo esgotado repetido.

      O que este teste NÃO passa a tolerar: espaçamento silencioso. A asserção
      final exige que a tela o declare.
    */
    let fatorVigente = 1;
    for (const esperado of [2, 3, 4]) {
      await avancar(relogio, INTERVALO * fatorVigente);
      await waitFor(() => {
        expect(duble.chamadas()).toBe(esperado);
      });
      await avancar(relogio, TEMPO_LIMITE_PADRAO_MS);
      await waitFor(() => {
        expect(screen.getByTestId("rotulo-frescor-visao")).toBeTruthy();
      });
      fatorVigente = Number(
        screen.queryByTestId("rotulo-cadencia-recarga")?.getAttribute("data-fator-espacamento") ??
          "1",
      );
    }

    // Sem sobreposição: cada ciclo produziu UMA chamada, nunca uma rajada.
    expect(duble.chamadas()).toBe(4);

    // O espaçamento que tornou este teste diferente está DECLARADO na tela —
    // uma releitura mais lenta que ninguém anuncia é HAZ-0025 (SAF-0025: a
    // interface nunca pode parecer saudável quando não está).
    const cadencia = screen.getByTestId("rotulo-cadencia-recarga");
    expect(cadencia.getAttribute("data-cadencia")).toBe("espacada_por_falha");
    expect(Number(cadencia.getAttribute("data-fator-espacamento"))).toBeGreaterThan(1);
    // E a tela declara a perda de ciclos em vez de fingir atividade.
    expect(screen.getByTestId("rotulo-idade-visao").getAttribute("data-idade-visao")).toBe(
      "ciclo_perdido",
    );
    expect(screen.queryByTestId("idade-visao-em-curso")).toBeNull();
  });

  it("desmontar durante o tempo esgotado NÃO ressuscita o ciclo (nenhum temporizador órfão)", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade((n) => (n === 1 ? OK([LEITO]) : null), {
      rejeitarNoAborto: true,
    });

    const { unmount } = render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await waitFor(() => {
      expect(duble.chamadas()).toBe(1);
    });
    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(duble.chamadas()).toBe(2);
    });

    // Desmonta ANTES de o tempo limite estourar. A limpeza aborta com razão
    // "desmontagem"; a requisição rejeita e o `finally` roda com o componente
    // já fora — e não pode agendar nada.
    unmount();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(relogio.pendentes, "temporizador sobreviveu à desmontagem").toBe(0);
    await avancar(relogio, INTERVALO * 5);
    expect(duble.chamadas()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// ACEITE 5 — desmontar durante uma recarga AUTOMÁTICA aborta de verdade
// ---------------------------------------------------------------------------

describe("ACEITE L1-5 — desmontagem durante recarga automática aborta no SINAL", () => {
  it("o AbortSignal da recarga periódica é abortado por desmontagem", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade((n) => (n === 1 ? OK([LEITO]) : null));

    const { unmount } = render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await waitFor(() => {
      expect(duble.chamadas()).toBe(1);
    });

    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(duble.chamadas()).toBe(2);
    });

    const sinalDaRecarga = duble.sinais[1];
    expect(sinalDaRecarga).toBeDefined();
    expect(sinalDaRecarga?.aborted).toBe(false);

    unmount();

    // Observação do SINAL, não de uma flag do componente: uma implementação
    // que apenas ignorasse o resultado deixaria o sinal intocado.
    expect(sinalDaRecarga?.aborted).toBe(true);
    expect((sinalDaRecarga?.reason as { causaAborto?: string })?.causaAborto).toBe("desmontagem");
  });

  it("desmontar não deixa temporizador vivo — nenhuma recarga órfã", async () => {
    const relogio = criarRelogioDeTeste();
    const duble = dubleDeGrade(() => OK([LEITO]));

    const { unmount } = render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );
    await waitFor(() => {
      expect(duble.chamadas()).toBe(1);
    });
    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(duble.chamadas()).toBe(2);
    });

    unmount();
    expect(relogio.pendentes, "temporizador sobreviveu à desmontagem").toBe(0);

    await avancar(relogio, INTERVALO * 5);
    expect(duble.chamadas()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Propriedade que a recarga periódica NÃO pode quebrar
// ---------------------------------------------------------------------------

describe("a recarga periódica não reanuncia alertas antigos como novos", () => {
  it("com a mesma contagem de alertas, o texto da live region não muda entre ciclos", async () => {
    const relogio = criarRelogioDeTeste();
    const comAlerta = leito("SYNTH-LEITO-01", [alertaPendente("SYNTH-ALERTA-01")]);
    const duble = dubleDeGrade(() => OK([comAlerta]));

    render(
      <GradeLeitos
        cliente={duble.cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO}
      />,
    );

    const regiao = await waitFor(() => {
      const encontrada = document.querySelector('[aria-live="assertive"][role="alert"]');
      if (encontrada === null) throw new Error("região viva de alertas ausente");
      return encontrada;
    });
    await waitFor(() => {
      expect(regiao.textContent ?? "").toMatch(/1 alerta pendente/);
    });
    const nodo = regiao.firstChild;

    await avancar(relogio, INTERVALO);
    await waitFor(() => {
      expect(duble.chamadas()).toBe(2);
    });

    expect(regiao.textContent ?? "").toMatch(/1 alerta pendente/);
    // O NÓ DE TEXTO é o mesmo objeto: o React não o substituiu, logo o leitor
    // de tela não teve mudança para anunciar. Comparar só a string passaria
    // mesmo que o nó fosse recriado a cada ciclo — que é o que produz a rajada.
    expect(
      regiao.firstChild,
      "o texto da live region foi reescrito numa recarga de rotina: reanúncio de alerta antigo",
    ).toBe(nodo);
  });
});
