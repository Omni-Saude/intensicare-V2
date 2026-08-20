/**
 * apps/web/src/components/fidelidadeDeApresentacao.test.tsx
 *
 * TESTE DE ACEITE de quatro defeitos em que a tela diz mais, ou menos, do que
 * o backend originou. Cada bloco corresponde a um defeito verificado por
 * leitura de código antes de existir correção:
 *
 *   D4 — o detalhe do paciente perdia todo o conteúdo numa recarga que falha,
 *        enquanto o rótulo de frescor acima continuava afirmando exibir
 *        "conteúdo anterior a essa falha". A tela afirmava o que não mostrava.
 *        E o caminho que expõe isso — troca de leito — expõe também o risco
 *        inverso: exibir o paciente ANTERIOR sob o cabeçalho do leito NOVO.
 *        Preservar conteúdo desatualizado só é seguro dentro da mesma
 *        identidade (HAZ-0001/HAZ-0002 — atribuição errada é dano-raiz).
 *
 *   D5 — o botão de reconhecer, quando bloqueado por falta de conexão, usava
 *        `disabled` (que o retira da ordem de foco) e um `aria-describedby`
 *        apontando para um `id` INEXISTENTE. Um usuário de leitor de tela não
 *        encontrava o botão nem descobria por que o comando não estava
 *        disponível (SAF-0034; HAZ-0037).
 *
 *   D7 — a linha do alerta identificava o item apenas pelo leito. IA-N10 exige
 *        que "a referência de paciente é parte irremovível da linha do
 *        alerta"; o leito é justamente o que muda numa transferência.
 *
 *   D8 — o banner fundia uma divulgação TEMPORÁRIA (dados sintéticos) com uma
 *        obrigação PERMANENTE de segurança clínica (registro limitado à
 *        instituição — ADR-0004 §6.2, ata AQ-1, HAZ-0046). Remover a primeira
 *        levaria a segunda junto. E não havia identificador estável: a
 *        telemetria não conseguia provar a exibição sem depender do texto
 *        (RLI-5; teste V1 da ADR-0021).
 *
 * Rastreio: ADR-0021 F1/F3/F4/F8, ADR-0009 W3, ADR-0004 §6.2, HAZ-0046,
 * HAZ-0037, HAZ-0001/0002, SAF-0034, IA-N10, RLI-2/RLI-5.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ClienteApiIntensiCare, RespostaApi } from "../api/tipos.js";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import { BannerContexto } from "./BannerContexto.js";
import { DetalhePaciente } from "./DetalhePaciente.js";
import { PainelAlertas } from "./PainelAlertas.js";

// ---------------------------------------------------------------------------
// Fixtures sintéticas
// ---------------------------------------------------------------------------

function leitoSintetico(sufixo: string): ItemGradeLeito {
  return {
    leitoId: `SYNTH-LEITO-${sufixo}`,
    pacienteRef: `amh:psr:v1:SYNTH-P${sufixo}`,
    pacienteApelido: `Paciente SYNTH-P${sufixo}`,
    avaliacao: {
      estadoAvaliacao: "valida",
      news2Total: 3,
      bandaRisco: "atencao",
      contribuicoes: [],
      insumosAusentes: [],
      insumosVelhos: [],
      motivos: [],
      anotacoes: [],
      explicacao: "Avaliação sintética.",
      parametroVermelho: false,
      calculadoEm: "2026-08-17T10:00:00.000Z",
      versaoRegra: "RULE-NEWS2@0.2.0",
    },
    alertas: [],
  };
}

const ALERTA_SINTETICO: Alerta = {
  alertaId: "SYNTH-ALERTA-1",
  leitoId: "SYNTH-LEITO-02",
  pacienteRef: "amh:psr:v1:SYNTH-P002",
  severidade: "critico",
  descricao: "Alerta consultivo NEWS2.",
  criadoEm: "2026-08-17T10:00:00.000Z",
  estado: "nao_atribuido",
  versao: 4,
};

function clienteInerte(): ClienteApiIntensiCare {
  return {
    listarGradeLeitos: async () => ({
      estadoCarregamento: "vazio",
      dados: null,
      problema: null,
    }),
    obterAvaliacaoPaciente: async () => ({
      estadoCarregamento: "vazio",
      dados: null,
      problema: null,
    }),
    reconhecerAlerta: async (): Promise<RespostaApi<Alerta>> => ({
      estadoCarregamento: "erro",
      dados: null,
      problema: null,
      conflito: null,
    }),
  };
}

const FALHA_SINTETICA: RespostaApi<ItemGradeLeito> = {
  estadoCarregamento: "indisponivel",
  dados: null,
  problema: {
    type: "about:blank",
    title: "API indisponível",
    status: 503,
    detail: "Falha sintética de recarga.",
  },
};

/**
 * Devolve o leito pedido na primeira leitura de cada leito e falha nas
 * seguintes. Trocar a IDENTIDADE do cliente é o mesmo caminho de recarga que
 * o hook usa em produção (`buscar` é `useCallback` sobre `cliente`/`leitoId`).
 */
function clienteQueFalhaNaSegundaLeitura(): {
  readonly primeiro: ClienteApiIntensiCare;
  readonly segundo: ClienteApiIntensiCare;
} {
  const ok = async (leitoId: string): Promise<RespostaApi<ItemGradeLeito>> => ({
    estadoCarregamento: "pronto",
    dados: { ...leitoSintetico("002"), leitoId },
    problema: null,
  });
  return {
    primeiro: { ...clienteInerte(), obterAvaliacaoPaciente: ok },
    segundo: { ...clienteInerte(), obterAvaliacaoPaciente: async () => FALHA_SINTETICA },
  };
}

// ---------------------------------------------------------------------------
// D4
// ---------------------------------------------------------------------------

describe("D4 — conteúdo desatualizado no detalhe do paciente", () => {
  it("recarga que falha no MESMO leito mantém o conteúdo, marcado desatualizado", async () => {
    const { primeiro, segundo } = clienteQueFalhaNaSegundaLeitura();
    const { rerender } = render(
      <DetalhePaciente leitoId="SYNTH-LEITO-02" cliente={primeiro} aoVoltar={() => undefined} />,
    );
    await screen.findByText("Paciente SYNTH-P002");

    rerender(
      <DetalhePaciente leitoId="SYNTH-LEITO-02" cliente={segundo} aoVoltar={() => undefined} />,
    );

    // A falha é declarada…
    await screen.findByText(/Indisponível no momento/i);
    // …e o rótulo de frescor afirma exibir conteúdo anterior à falha…
    expect(screen.getByTestId("rotulo-frescor-visao")).toBeTruthy();
    // …portanto o conteúdo TEM de estar lá. Antes da correção, sumia.
    expect(screen.getByText("Paciente SYNTH-P002")).toBeTruthy();
  });

  it("leito DIFERENTE nunca exibe o paciente anterior sob o cabeçalho novo", async () => {
    const { primeiro, segundo } = clienteQueFalhaNaSegundaLeitura();
    const { rerender } = render(
      <DetalhePaciente leitoId="SYNTH-LEITO-02" cliente={primeiro} aoVoltar={() => undefined} />,
    );
    await screen.findByText("Paciente SYNTH-P002");

    rerender(
      <DetalhePaciente leitoId="SYNTH-LEITO-07" cliente={segundo} aoVoltar={() => undefined} />,
    );

    await screen.findByText(/Indisponível no momento/i);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("SYNTH-LEITO-07");
    // Preservar dado desatualizado JAMAIS pode atravessar identidades.
    await waitFor(() => {
      expect(screen.queryByText("Paciente SYNTH-P002")).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// D5 e D7
// ---------------------------------------------------------------------------

describe("D5/D7 — a linha do alerta e o comando bloqueado", () => {
  it("o motivo do bloqueio é alcançável: o botão continua focável e descrito", () => {
    render(
      <PainelAlertas
        alertas={[ALERTA_SINTETICO]}
        cliente={clienteInerte()}
        aoAlertaAtualizado={() => undefined}
        tituloRegiao="Alertas"
        comandosBloqueados
      />,
    );

    const botao = screen.getByRole("button", { name: /Reconhecer alerta/i });
    // `disabled` retira o botão da ordem de foco: quem usa leitor de tela nem
    // chega ao elemento que explicaria o bloqueio.
    expect(botao.hasAttribute("disabled")).toBe(false);
    expect(botao.getAttribute("aria-disabled")).toBe("true");

    const idDescricao = botao.getAttribute("aria-describedby");
    expect(idDescricao, "botão bloqueado sem aria-describedby").toBeTruthy();
    // O defeito era este: o id apontava para um elemento que não existia.
    expect(document.getElementById(idDescricao ?? "")).not.toBeNull();
  });

  it("a linha do alerta carrega a referência de paciente, não só o leito (IA-N10)", () => {
    render(
      <PainelAlertas
        alertas={[ALERTA_SINTETICO]}
        cliente={clienteInerte()}
        aoAlertaAtualizado={() => undefined}
        tituloRegiao="Alertas"
      />,
    );

    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("SYNTH-LEITO-02");
    expect(item.textContent).toContain("SYNTH-P002");
  });
});

// ---------------------------------------------------------------------------
// D8
// ---------------------------------------------------------------------------

describe("D8 — divulgação temporária × obrigação permanente", () => {
  it("o rótulo institucional tem identificador estável, provável sem depender do texto", () => {
    render(<BannerContexto />);
    const rotulo = screen.getByTestId("rotulo-registro-institucional");
    // RLI-5 / ADR-0021 V1: telemetria e auditoria referenciam o
    // IDENTIFICADOR; alterar a redação não pode alterar a prova de exibição.
    expect(rotulo.getAttribute("data-divulgacao")).toBe("registro-limitado-instituicao");
  });

  it("a divulgação sintética é um elemento separado — removê-la não leva o rótulo junto", () => {
    render(<BannerContexto />);
    const sintetico = screen.getByTestId("divulgacao-dados-sinteticos");
    const institucional = screen.getByTestId("rotulo-registro-institucional");
    expect(sintetico).not.toBe(institucional);
    expect(sintetico.contains(institucional)).toBe(false);
    expect(institucional.contains(sintetico)).toBe(false);
  });
});
