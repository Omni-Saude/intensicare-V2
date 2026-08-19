/**
 * apps/web/src/components/atribuicaoEntreLeitos.test.tsx
 *
 * O TESTE QUE A NAVEGAÇÃO DIRETA ENTRE LEITOS TORNA OBRIGATÓRIO (LAC-L4).
 *
 * `docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md`, LAC-D4,
 * registra que `useRecursoRemoto` PRESERVA o dado anterior numa recarga que
 * falha (invariante I2 — "a tela calma sem dado é proibida") e que o refetch do
 * detalhe é disparado por troca de `leitoId`. E registra também o limite dessa
 * correção: *"A navegação atual não alcança esse caminho (grade↔detalhe
 * desmonta o componente), mas nada o impede assim que houver navegação direta
 * entre leitos."*
 *
 * Este arquivo existe porque LAC-L4 constrói exatamente essa navegação. A
 * guarda de identidade de `DetalhePaciente` deixa de ser teoria e passa ao
 * caminho quente: sem ela, a tela mostraria o PACIENTE ANTERIOR sob o CABEÇALHO
 * DO LEITO NOVO — atribuição errada, o dano-raiz de HAZ-0001/HAZ-0002.
 *
 * A afirmação verificada aqui é mais forte que "o conteúdo de A some": é
 * NADA DE A SOBREVIVE VISUALMENTE SOB B. Um rótulo que afirma exibir "conteúdo
 * anterior a essa falha" quando não há conteúdo nenhum é a mesma mentira de
 * LAC-D4 ao contrário — a tela afirmando o que não mostra — e um "última
 * leitura bem-sucedida há 3 s" sob o cabeçalho de B afirma sobre B um fato que
 * só ocorreu em A.
 *
 * Rastreio: LAC-L4, LAC-D4, HAZ-0001, HAZ-0002, ADR-0021 F3/F4, WF-05.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { ItemGradeLeito } from "../domain/clinico.js";
import { INTERVALO_RECARGA_PADRAO_MS } from "../estado/recursoRemoto.js";
import { criarRelogioDeTeste } from "../teste/relogioDeTeste.js";
import { DetalhePaciente } from "./DetalhePaciente.js";

const LEITO_A = "SYNTH-LEITO-01";
const LEITO_B = "SYNTH-LEITO-02";
const APELIDO_A = "Paciente SYNTH-P001";

function itemDoLeitoA(): ItemGradeLeito {
  return {
    leitoId: LEITO_A,
    pacienteRef: "amh:psr:v1:SYNTH-P001",
    pacienteApelido: APELIDO_A,
    avaliacao: {
      estadoAvaliacao: "valida",
      news2Total: 7,
      bandaRisco: "alto",
      contribuicoes: [],
      insumosAusentes: [],
      insumosVelhos: [],
      motivos: [],
      anotacoes: [],
      explicacao: "SYNTH — explicação agregada do backend para o leito A.",
      parametroVermelho: false,
      calculadoEm: "2026-08-17T12:00:00.000Z",
      versaoRegra: "RULE-NEWS2@0.2.0",
    },
    alertas: [],
  };
}

/**
 * Cliente em que o leito A responde e o leito B REJEITA. É a combinação exata
 * do risco: há dado anterior em memória e a leitura da identidade nova falha.
 */
function clienteAResolveBRejeita(): ClienteApiIntensiCare {
  return {
    listarGradeLeitos: async () => ({
      estadoCarregamento: "pronto",
      dados: [itemDoLeitoA()],
      problema: null,
    }),
    obterAvaliacaoPaciente: async (leitoId: string) => {
      if (leitoId === LEITO_A) {
        return { estadoCarregamento: "pronto" as const, dados: itemDoLeitoA(), problema: null };
      }
      throw new Error("falha sintética de leitura do leito B");
    },
    reconhecerAlerta: async () => ({
      estadoCarregamento: "erro",
      dados: null,
      problema: null,
    }),
  };
}

describe("navegação direta entre leitos — nada do leito anterior sobrevive sob o novo", () => {
  it("troca A→B SEM desmontagem, com a leitura de B falhando: A não aparece sob o cabeçalho de B", async () => {
    const relogio = criarRelogioDeTeste();
    const cliente = clienteAResolveBRejeita();

    const { rerender } = render(
      <DetalhePaciente
        leitoId={LEITO_A}
        cliente={cliente}
        aoVoltar={() => {}}
        intervaloRecargaMs={INTERVALO_RECARGA_PADRAO_MS}
        relogio={relogio}
        sortear={() => 0.5}
      />,
    );

    // O leito A carregou de verdade — sem isto, o resto do teste seria vácuo.
    await screen.findByText(APELIDO_A);
    expect(screen.getByRole("heading", { name: LEITO_A })).toBeTruthy();

    // TROCA DE IDENTIDADE SEM DESMONTAGEM: `rerender` mantém a mesma instância
    // do componente, que é precisamente o que a navegação direta por URL faz.
    rerender(
      <DetalhePaciente
        leitoId={LEITO_B}
        cliente={cliente}
        aoVoltar={() => {}}
        intervaloRecargaMs={INTERVALO_RECARGA_PADRAO_MS}
        relogio={relogio}
        sortear={() => 0.5}
      />,
    );

    // A falha de B chegou e a tela declarou erro acionável (I3).
    await screen.findByRole("button", { name: /Tentar novamente/i });
    expect(screen.getByRole("heading", { name: LEITO_B })).toBeTruthy();

    // (1) ATRIBUIÇÃO — o conteúdo clínico de A não pode aparecer sob B.
    expect(
      screen.queryByText(APELIDO_A),
      "o apelido do paciente do leito A apareceu sob o cabeçalho do leito B",
    ).toBeNull();
    expect(
      screen.queryByText(/Escore NEWS2 total/),
      "o escore do leito A sobreviveu à troca de leito",
    ).toBeNull();
    expect(
      screen.queryByText(/Risco alto/),
      "a banda de risco do leito A sobreviveu à troca de leito",
    ).toBeNull();

    // (2) RÓTULO DE FRESCOR — ele afirma "o que está na tela é anterior a essa
    // falha". Sob B não há nada na tela vindo de leitura alguma; o rótulo
    // estaria afirmando a existência de um conteúdo que a guarda de identidade
    // (corretamente) suprimiu. É LAC-D4 ao contrário.
    expect(
      screen.queryByTestId("rotulo-frescor-visao"),
      "o rótulo de frescor afirma exibir conteúdo anterior à falha, mas o conteúdo " +
        "exibido pertenceria a OUTRO leito e foi suprimido — a tela afirma o que não mostra",
    ).toBeNull();

    // (3) IDADE DA VISÃO — "última leitura bem-sucedida há N s" sob o cabeçalho
    // de B afirmaria sobre B um fato que só ocorreu em A. Sob B, o único fato
    // verdadeiro é que ainda não houve leitura bem-sucedida NESTA tela.
    const idade = screen.queryByTestId("rotulo-idade-visao");
    if (idade !== null) {
      expect(
        idade.getAttribute("data-idade-visao"),
        "a idade da visão sob o leito B foi derivada da leitura do leito A",
      ).toBe("sem_leitura");
      expect(
        screen.getByTestId("idade-visao-texto").textContent ?? "",
        "a tela afirma uma leitura bem-sucedida que pertence a outro leito",
      ).toMatch(/Ainda não houve leitura bem-sucedida nesta tela/);
    }
  });

  it("dentro da MESMA identidade, a falha de recarga continua preservando o conteúdo rotulado (I2 intacta)", async () => {
    // Guarda contra a correção fácil e errada: suprimir o dado anterior sempre.
    // Dentro do mesmo leito, preservar o conteúdo ROTULADO é obrigação (I2,
    // WF-05) — "a tela calma sem dado é proibida".
    const relogio = criarRelogioDeTeste();
    let falhar = false;
    const cliente: ClienteApiIntensiCare = {
      ...clienteAResolveBRejeita(),
      obterAvaliacaoPaciente: async () => {
        if (falhar) throw new Error("falha sintética de recarga do mesmo leito");
        return { estadoCarregamento: "pronto" as const, dados: itemDoLeitoA(), problema: null };
      },
    };

    render(
      <DetalhePaciente
        leitoId={LEITO_A}
        cliente={cliente}
        aoVoltar={() => {}}
        intervaloRecargaMs={INTERVALO_RECARGA_PADRAO_MS}
        relogio={relogio}
        sortear={() => 0.5}
      />,
    );
    await screen.findByText(APELIDO_A);

    falhar = true;
    relogio.avancar(INTERVALO_RECARGA_PADRAO_MS + 1);

    await waitFor(() => {
      expect(screen.getByTestId("rotulo-frescor-visao")).toBeTruthy();
    });
    // O conteúdo do PRÓPRIO leito sobrevive — e sempre acompanhado do rótulo.
    expect(screen.getAllByText(APELIDO_A).length).toBeGreaterThan(0);
    expect(screen.getByTestId("rotulo-frescor-visao").getAttribute("data-frescor-visao")).toBe(
      "desatualizado_apos_falha",
    );
  });
});
