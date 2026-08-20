/**
 * apps/web/src/components/resiliencia.test.tsx
 *
 * TESTE DE ACEITE do ACH-07 (§6.7). Cada bloco abaixo corresponde, um a um,
 * a uma linha do teste de aceite do despacho:
 *
 *   1. cliente HTTP que REJEITA ⇒ estado de erro acionável renderizado;
 *      jamais "carregando" permanente;
 *   2. desmontar durante a requisição ⇒ `AbortController` realmente aborta
 *      (provado OBSERVANDO O SINAL recebido pelo cliente, não uma flag);
 *   3. após falha de recarga, o dado anterior aparece rotulado desatualizado,
 *      nunca como atual;
 *   4. o estado de erro oferece ação de recuperação (§5 do modelo de estados:
 *      "ação de recuperação sempre disponível").
 *
 * Estes testes rodam em jsdom com montagem real — `useEffect` executa, o que
 * é a diferença estrutural em relação a `render.test.tsx` (renderização
 * estática, onde o defeito era inalcançável).
 *
 * Rastreio: ACH-07, PRE-07, ADR-0021 F4/F5, HAZ-0005, WF-05.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ClienteApiIntensiCare, OpcoesChamada, RespostaApi } from "../api/tipos.js";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import { DetalhePaciente } from "./DetalhePaciente.js";
import { GradeLeitos } from "./GradeLeitos.js";

// ---------------------------------------------------------------------------
// Dublês de cliente
// ---------------------------------------------------------------------------

const LEITO_SINTETICO: ItemGradeLeito = {
  leitoId: "SYNTH-LEITO-01",
  pacienteRef: "amh:psr:v1:SYNTH-P001",
  pacienteApelido: "Paciente SYNTH-P001",
  avaliacao: {
    estadoAvaliacao: "valida",
    news2Total: 3,
    bandaRisco: "atencao",
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
  alertas: [],
};

function clienteBase(): ClienteApiIntensiCare {
  return {
    listarGradeLeitos: async () => ({
      estadoCarregamento: "pronto",
      dados: [LEITO_SINTETICO],
      problema: null,
    }),
    obterAvaliacaoPaciente: async () => ({
      estadoCarregamento: "pronto",
      dados: LEITO_SINTETICO,
      problema: null,
    }),
    reconhecerAlerta: async (): Promise<RespostaApi<Alerta>> => ({
      estadoCarregamento: "erro",
      dados: null,
      problema: null,
    }),
  };
}

/** Cliente cuja leitura de grade REJEITA — o caminho que travava a tela. */
function clienteQueRejeita(erro: Error): ClienteApiIntensiCare {
  return {
    ...clienteBase(),
    listarGradeLeitos: () => Promise.reject(erro),
    obterAvaliacaoPaciente: () => Promise.reject(erro),
  };
}

/**
 * Cliente que registra o `AbortSignal` recebido e NUNCA resolve. É assim que
 * o aborto é provado: o teste inspeciona `sinal.aborted`/`sinal.reason` do
 * sinal que o COMPONENTE entregou ao cliente. Uma implementação que apenas
 * ignorasse o resultado (flag `cancelado`) deixaria o sinal intocado e este
 * teste continuaria vermelho.
 */
function clienteQueRegistraSinal(): {
  cliente: ClienteApiIntensiCare;
  sinais: AbortSignal[];
} {
  const sinais: AbortSignal[] = [];
  const registrar = (opcoes?: OpcoesChamada): Promise<never> => {
    if (opcoes?.sinal) sinais.push(opcoes.sinal);
    return new Promise<never>(() => {
      /* nunca resolve: a requisição fica em voo até ser abortada */
    });
  };
  return {
    sinais,
    cliente: {
      listarGradeLeitos: (opcoes?: OpcoesChamada) => registrar(opcoes),
      obterAvaliacaoPaciente: (_leitoId: string, opcoes?: OpcoesChamada) => registrar(opcoes),
      reconhecerAlerta: (_a: string, _b: string, opcoes?: OpcoesChamada) => registrar(opcoes),
    },
  };
}

/** Primeira chamada devolve dado; as seguintes falham (cenário de recarga). */
function clienteQueFalhaNaRecarga(): ClienteApiIntensiCare {
  let chamadas = 0;
  return {
    ...clienteBase(),
    listarGradeLeitos: async (): Promise<RespostaApi<ItemGradeLeito[]>> => {
      chamadas += 1;
      if (chamadas === 1) {
        return { estadoCarregamento: "pronto", dados: [LEITO_SINTETICO], problema: null };
      }
      return {
        estadoCarregamento: "indisponivel",
        dados: null,
        problema: {
          type: "about:blank",
          title: "API indisponível",
          status: 503,
          detail: "Falha sintética de recarga.",
        },
      };
    },
  };
}

/**
 * Localiza o BLOCO DE ESTADO de uma tela pelo seu contexto.
 *
 * Consultar por `data-contexto` em vez de `getByRole("alert")` é deliberado:
 * uma tela pode legitimamente ter mais de uma região viva ao mesmo tempo (a
 * região de alertas clínicos, o banner de conectividade e o bloco de estado
 * da lista), e um teste que exija unicidade de papel estaria testando uma
 * coincidência de layout, não o comportamento. O papel ARIA continua sendo
 * verificado — mas no elemento certo.
 */
function blocoDeEstado(contexto: string): HTMLElement {
  const elemento = document.querySelector<HTMLElement>(`[data-contexto="${contexto}"]`);
  if (elemento === null) {
    throw new Error(`Nenhum bloco de estado com contexto "${contexto}" foi renderizado.`);
  }
  return elemento;
}

const ESTADOS_DE_FALHA = ["erro", "indisponivel", "proibido", "tempo_esgotado"];

/** Afirma que a tela chegou a um estado de FALHA acionável (nunca carregando). */
function esperarFalhaAcionavel(contexto: string): HTMLElement {
  const bloco = blocoDeEstado(contexto);
  expect(ESTADOS_DE_FALHA).toContain(bloco.getAttribute("data-estado"));
  expect(bloco.getAttribute("role")).toBe("alert");
  expect(bloco.getAttribute("aria-live")).toBe("assertive");
  return bloco;
}

// ---------------------------------------------------------------------------
// 1. Rejeição ⇒ estado de erro acionável, nunca "carregando" permanente
// ---------------------------------------------------------------------------

describe("ACEITE 1 — cliente que rejeita nunca deixa a tela presa em 'carregando'", () => {
  it("GradeLeitos: rejeição da listagem produz estado de erro visível", async () => {
    render(
      <GradeLeitos
        cliente={clienteQueRejeita(new Error("falha sintética de rede"))}
        aoSelecionarLeito={() => {}}
      />,
    );

    await waitFor(() => {
      esperarFalhaAcionavel("grade de leitos");
    });
    expect(screen.queryByText(/Carregando…/)).toBeNull();
    // Acionável: a saída existe.
    expect(screen.getByRole("button", { name: /Tentar novamente/i })).toBeTruthy();
  });

  it("DetalhePaciente: rejeição da avaliação produz estado de erro visível", async () => {
    render(
      <DetalhePaciente
        leitoId="SYNTH-LEITO-01"
        cliente={clienteQueRejeita(new Error("falha sintética de rede"))}
        aoVoltar={() => {}}
      />,
    );

    await waitFor(() => {
      esperarFalhaAcionavel("detalhe do paciente — SYNTH-LEITO-01");
    });
    expect(screen.queryByText(/Carregando…/)).toBeNull();
  });

  it("uma rejeição com valor não-Error (string) também é tratada", async () => {
    const cliente: ClienteApiIntensiCare = {
      ...clienteBase(),
      // eslint-disable-next-line prefer-promise-reject-errors -- deliberado: valor arbitrário
      listarGradeLeitos: () => Promise.reject("falha sem instância de Error"),
    };
    render(<GradeLeitos cliente={cliente} aoSelecionarLeito={() => {}} />);

    await waitFor(() => {
      esperarFalhaAcionavel("grade de leitos");
    });
    expect(screen.queryByText(/Carregando…/)).toBeNull();
  });

  it("a mensagem de erro NÃO vaza a mensagem crua da exceção (anti-padrão 12)", async () => {
    render(
      <GradeLeitos
        cliente={clienteQueRejeita(new Error("https://interno/v1/segredo?token=abc"))}
        aoSelecionarLeito={() => {}}
      />,
    );

    await waitFor(() => {
      esperarFalhaAcionavel("grade de leitos");
    });
    // Nenhuma parte da tela repete a mensagem crua da exceção.
    const textoDaTela = document.body.textContent ?? "";
    expect(textoDaTela).not.toMatch(/token=abc/);
    expect(textoDaTela).not.toMatch(/https:\/\/interno/);
  });
});

// ---------------------------------------------------------------------------
// 4. Estado de erro ACIONÁVEL (a recuperação existe e funciona)
// ---------------------------------------------------------------------------

describe("ACEITE 4 — o estado de erro é acionável", () => {
  it("oferece 'Tentar novamente' e uma nova tentativa que resolve mostra o dado", async () => {
    let deveFalhar = true;
    const cliente: ClienteApiIntensiCare = {
      ...clienteBase(),
      listarGradeLeitos: async (): Promise<RespostaApi<ItemGradeLeito[]>> => {
        if (deveFalhar) throw new Error("falha sintética");
        return { estadoCarregamento: "pronto", dados: [LEITO_SINTETICO], problema: null };
      },
    };

    const usuario = userEvent.setup();
    render(<GradeLeitos cliente={cliente} aoSelecionarLeito={() => {}} />);

    const botao = await screen.findByRole("button", { name: /Tentar novamente/i });
    deveFalhar = false;
    await usuario.click(botao);

    await waitFor(() => {
      expect(screen.getByText(/SYNTH-LEITO-01/)).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Cancelamento REAL — provado no sinal
// ---------------------------------------------------------------------------

describe("ACEITE 2 — desmontar durante a requisição aborta de fato", () => {
  it("GradeLeitos: o AbortSignal entregue ao cliente é abortado na desmontagem", async () => {
    const { cliente, sinais } = clienteQueRegistraSinal();
    const { unmount } = render(<GradeLeitos cliente={cliente} aoSelecionarLeito={() => {}} />);

    await waitFor(() => {
      expect(sinais.length).toBeGreaterThan(0);
    });
    const sinal = sinais[0];
    expect(sinal).toBeDefined();
    expect(sinal?.aborted).toBe(false);

    unmount();

    // Observação do SINAL, não de uma flag do componente.
    expect(sinal?.aborted).toBe(true);
    expect((sinal?.reason as { causaAborto?: string })?.causaAborto).toBe("desmontagem");
  });

  it("DetalhePaciente: trocar de leito aborta a requisição anterior", async () => {
    const { cliente, sinais } = clienteQueRegistraSinal();
    const { rerender } = render(
      <DetalhePaciente leitoId="SYNTH-LEITO-01" cliente={cliente} aoVoltar={() => {}} />,
    );

    await waitFor(() => {
      expect(sinais.length).toBeGreaterThan(0);
    });
    const primeiroSinal = sinais[0];

    rerender(<DetalhePaciente leitoId="SYNTH-LEITO-02" cliente={cliente} aoVoltar={() => {}} />);

    await waitFor(() => {
      expect(primeiroSinal?.aborted).toBe(true);
    });
    await waitFor(() => {
      expect(sinais.length).toBeGreaterThan(1);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Dado anterior após falha de recarga — rotulado, nunca "atual"
// ---------------------------------------------------------------------------

describe("ACEITE 3 — dado anterior após falha de recarga aparece rotulado desatualizado", () => {
  it("mantém o leito visível E declara que o conteúdo não reflete a última tentativa", async () => {
    const usuario = userEvent.setup();
    render(<GradeLeitos cliente={clienteQueFalhaNaRecarga()} aoSelecionarLeito={() => {}} />);

    // 1ª carga: dado presente.
    await screen.findByText(/SYNTH-LEITO-01/);

    // Recarga explícita que falha.
    await usuario.click(screen.getByRole("button", { name: /Atualizar/i }));

    await waitFor(() => {
      esperarFalhaAcionavel("grade de leitos");
    });

    // O dado anterior CONTINUA visível (tela calma sem dado é proibida)...
    expect(screen.getAllByText(/SYNTH-LEITO-01/).length).toBeGreaterThan(0);
    // ...e está explicitamente rotulado como não-atual.
    const rotulo = screen.getByTestId("rotulo-frescor-visao");
    expect(rotulo.textContent ?? "").toMatch(/desatualizad/i);
    expect(rotulo.textContent ?? "").not.toMatch(/atualizado agora/i);
  });
});
