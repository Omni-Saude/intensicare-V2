/**
 * Testes da tendência de 24h (MAJ-4 / WF-02): o componente apresenta a série
 * real do backend, com as lacunas que ela tem — e PROVA, estruturalmente, que
 * não interpola (`svg line/path/polyline` ausente por construção) e que não
 * fabrica série quando há menos de dois pontos na janela.
 *
 * O caso de integração ("o detalhe expõe a série") é o mesmo ponto do RED da
 * camada de dados: lá provou-se que `obterAvaliacaoPaciente` descartava tudo
 * além de `avaliacoes[0]`; aqui prova-se que o que atravessa chega à tela.
 */
import { render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { AvaliacaoPaciente, ItemGradeLeito } from "../domain/clinico.js";
import { criarRelogioDeTeste } from "../teste/relogioDeTeste.js";
import { DetalhePaciente } from "./DetalhePaciente.js";
import { TendenciaAvaliacoes } from "./TendenciaAvaliacoes.js";

const AGORA = Date.parse("2026-09-19T12:00:00.000Z");

function ponto(
  calculadoEm: string,
  escore: number | null,
  estado: AvaliacaoPaciente["estadoAvaliacao"] = escore === null ? "nao_avaliada" : "valida",
): AvaliacaoPaciente {
  return {
    estadoAvaliacao: estado,
    news2Total: escore,
    bandaRisco: escore === null ? null : "atencao",
    contribuicoes: [],
    insumosAusentes: [],
    insumosVelhos: [],
    motivos: [],
    anotacoes: [],
    explicacao: "",
    parametroVermelho: false,
    calculadoEm,
    versaoRegra: null,
  };
}

const SERIE_TRES = [
  ponto("2026-09-19T11:00:00.000Z", 7),
  ponto("2026-09-19T06:00:00.000Z", null), // fail-closed no meio da série
  ponto("2026-09-19T02:00:00.000Z", 2),
];

describe("TendenciaAvaliacoes — honestidade dos desfechos", () => {
  it("origem que não consultou o histórico (`undefined`) não afirma NADA", () => {
    const { container } = render(<TendenciaAvaliacoes serie={undefined} agoraMs={AGORA} />);
    expect(container.querySelector('[data-testid="tendencia-avaliacoes"]')).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("histórico INDISPONÍVEL (`null`) é declarado — nunca vira 'não há série'", () => {
    render(<TendenciaAvaliacoes serie={null} agoraMs={AGORA} />);
    expect(screen.getByTestId("tendencia-indisponivel").textContent).toContain(
      "não pôde ser obtido",
    );
    expect(screen.queryByTestId("tendencia-visual")).toBeNull();
    expect(screen.queryByTestId("tendencia-tabela")).toBeNull();
  });

  it("janela VAZIA diz 'nenhuma avaliação' — nunca uma linha lisa", () => {
    render(<TendenciaAvaliacoes serie={[]} agoraMs={AGORA} />);
    expect(screen.getByTestId("tendencia-vazia").textContent).toContain(
      "Nenhuma avaliação registrada nas últimas 24 horas",
    );
    expect(screen.queryByTestId("tendencia-visual")).toBeNull();
  });

  it("ponto único diz 'uma avaliação' — nunca vira série visual (§6.2/ACH-O3-12)", () => {
    render(<TendenciaAvaliacoes serie={[ponto("2026-09-19T11:00:00.000Z", 7)]} agoraMs={AGORA} />);
    expect(screen.getByTestId("tendencia-ponto-unico").textContent).toBe(
      "Uma avaliação nas últimas 24 horas.",
    );
    // O fato é único; o DESENHO de série não existe — a leitura vai pela tabela.
    expect(screen.queryByTestId("tendencia-visual")).toBeNull();
    const tabela = screen.getByTestId("tendencia-tabela");
    expect(tabela.querySelectorAll("tbody tr")).toHaveLength(1);
  });

  it("avaliações FORA da janela são CONTADAS e não somem: nunca fabricam série nem somem", () => {
    render(
      <TendenciaAvaliacoes
        serie={[ponto("2026-09-19T11:00:00.000Z", 7), ponto("2026-09-16T11:00:00.000Z", 12)]}
        agoraMs={AGORA}
      />,
    );
    expect(screen.getByTestId("tendencia-fora-da-janela").textContent).toContain(
      "Uma avaliação mais antiga",
    );
    const tabela = screen.getByTestId("tendencia-tabela");
    expect(tabela.querySelectorAll("tbody tr")).toHaveLength(1);
  });

  it("série real: cada ponto é uma linha com valor, status e instante de MÁQUINA preservado", () => {
    render(<TendenciaAvaliacoes serie={SERIE_TRES} agoraMs={AGORA} />);
    expect(screen.getByTestId("tendencia-visual")).toBeDefined();
    const tabela = screen.getByTestId("tendencia-tabela");
    const linhas = tabela.querySelectorAll("tbody tr");
    expect(linhas).toHaveLength(3);
    // Ordem do backend preservada: mais recente primeiro.
    expect(linhas[0]?.textContent).toContain("7");
    expect(linhas[2]?.textContent).toContain("2");
    // Os instantes de máquina sobrevivem no `dateTime` (formatação é de tela).
    const instantes = tabela.querySelectorAll("time");
    expect(instantes[0]?.getAttribute("datetime")).toBe("2026-09-19T11:00:00.000Z");
    expect(instantes[2]?.getAttribute("datetime")).toBe("2026-09-19T02:00:00.000Z");
  });

  it("ponto fail-closed no meio da série é DISTINCTO: 'não computável', nunca zero nem omissão", () => {
    render(<TendenciaAvaliacoes serie={SERIE_TRES} agoraMs={AGORA} />);
    const linha = screen.getByTestId("tendencia-tabela").querySelectorAll("tbody tr")[1];
    expect(linha?.getAttribute("data-estado-avaliacao")).toBe("nao_avaliada");
    expect(within(linha as HTMLElement).getByTestId("tendencia-escore").textContent).toBe(
      "não computável",
    );
  });

  it("NÃO INTERPOLA — prova estrutural: nenhum `line`, `path` ou `polyline` existe no desenho", () => {
    const { container } = render(<TendenciaAvaliacoes serie={SERIE_TRES} agoraMs={AGORA} />);
    const svg = container.querySelector("svg");
    expect(svg, "a série com ≥2 pontos deve ter eco visual").not.toBeNull();
    expect(svg?.querySelector("line, path, polyline")).toBeNull();
    // Marcadores existem (um por ponto com escore) — o eco não é vazio.
    expect(svg?.querySelectorAll("circle")).toHaveLength(2);
  });

  it("ponto SEM instante interpretável é exibido verbatim — nunca descartado, nunca suavizado", () => {
    render(
      <TendenciaAvaliacoes
        serie={[ponto("não-é-uma-data", 5), ponto("2026-09-19T11:00:00.000Z", 7)]}
        agoraMs={AGORA}
      />,
    );
    const tabela = screen.getByTestId("tendencia-tabela");
    expect(tabela.querySelectorAll("tbody tr")).toHaveLength(2);
    // Política de `textoInstante`: entrada não interpretável volta VERBATIM —
    // a malformação fica visível em vez de ser apagada por um "—".
    expect(tabela.textContent).toContain("não-é-uma-data");
  });

  it("duas instâncias no MESMO documento (o detalhe duplica o conteúdo no modo desatualizado) têm ids DISTINTOS", () => {
    render(
      <>
        <TendenciaAvaliacoes serie={SERIE_TRES} agoraMs={AGORA} />
        <TendenciaAvaliacoes serie={SERIE_TRES} agoraMs={AGORA} />
      </>,
    );
    const tabelas = screen.getAllByTestId("tendencia-tabela");
    expect(tabelas).toHaveLength(2);
    const ids = tabelas.map((t) => t.getAttribute("aria-labelledby"));
    expect(ids[0]).toBeTruthy();
    expect(ids[0]).not.toBe(ids[1]);
    // Cada id referenciado EXISTE no documento — o par título↔tabela resolve nas duas cópias.
    for (const id of ids) {
      expect(document.getElementById(id ?? "")).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// Axe na superfície nova (as regras dependentes de cor/caixa ficam na suíte
// de navegador, `e2e/` — em jsdom elas mentiriam).
// ---------------------------------------------------------------------------

const REGRAS_DESLIGADAS_EM_JSDOM = {
  "color-contrast": { enabled: false },
  "target-size": { enabled: false },
} as const;

describe("TendenciaAvaliacoes — axe (WCAG automatizável em jsdom)", () => {
  it("a série renderizada não introduz violação axe", async () => {
    const { container } = render(<TendenciaAvaliacoes serie={SERIE_TRES} agoraMs={AGORA} />);
    const alvo = container.querySelector('[data-testid="tendencia-avaliacoes"]');
    expect(alvo).not.toBeNull();
    const resultado = await axe.run(alvo as HTMLElement, {
      rules: REGRAS_DESLIGADAS_EM_JSDOM as unknown as axe.RuleObject,
    });
    // GUARDA DE NÃO-VACUIDADE (mesma do a11y/acessibilidade.test.tsx): um
    // `violations: []` sobre um container que o axe não avaliou seria falso.
    expect(resultado.passes.length).toBeGreaterThan(0);
    const resumo = resultado.violations.map(
      (v) =>
        `${v.id} (${v.impact ?? "sem impacto declarado"}): ${v.help} — ${v.nodes.length} nó(s)`,
    );
    expect(resumo).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Integração: o DETALHE expõe a série (o ponto do RED da camada de dados).
// ---------------------------------------------------------------------------

const ITEM_COM_SERIE: ItemGradeLeito = {
  leitoId: "SYNTH-LEITO-01",
  pacienteRef: "amh:psr:v1:SYNTH-P001",
  pacienteApelido: "Paciente SYNTH-P001",
  avaliacao: ponto("2026-09-19T11:00:00.000Z", 7),
  alertas: [],
  serieAvaliacoes: SERIE_TRES,
};

function clienteCom(item: ItemGradeLeito): ClienteApiIntensiCare {
  return {
    listarGradeLeitos: () =>
      Promise.resolve({ estadoCarregamento: "pronto", dados: [item], problema: null }),
    obterAvaliacaoPaciente: () =>
      Promise.resolve({ estadoCarregamento: "pronto", dados: item, problema: null }),
    reconhecerAlerta: () =>
      Promise.resolve({ estadoCarregamento: "erro", dados: null, problema: null }),
  };
}

describe("DetalhePaciente — a série chega à tela (WF-02)", () => {
  it("o detalhe de um leito com N>1 avaliações renderiza a tendência completa", async () => {
    render(
      <DetalhePaciente
        leitoId="SYNTH-LEITO-01"
        cliente={clienteCom(ITEM_COM_SERIE)}
        aoVoltar={() => undefined}
        intervaloRecargaMs={null}
        // Relógio PINADO no AGORA da série (bomba-relógio, HANDOFF DATA): o
        // `recortarSerie24h` do componente usaria `Date.now()` real e a
        // série sintética de 2026-09-19 sairia da janela 24h quando o
        // relógio real passasse de 2026-09-20T02:00Z — o ponto mais antigo
        // cairia e o teste morreria por passagem de tempo, não por regressão.
        relogio={criarRelogioDeTeste(AGORA)}
      />,
    );
    const secao = await screen.findByTestId("tendencia-avaliacoes");
    expect(secao).toBeDefined();
    expect(secao.querySelectorAll("tbody tr")).toHaveLength(3);
    // O desenho existe e não tem linha nenhuma — na árvore WIRED, não num dublê.
    expect(secao.querySelector("svg line, svg path, svg polyline")).toBeNull();
  });

  it("item sem série (dublê antigo, origem sem consulta) não quebra o detalhe nem afirma nada", () => {
    const itemSemSerie: ItemGradeLeito = { ...ITEM_COM_SERIE };
    delete itemSemSerie.serieAvaliacoes;
    render(
      <DetalhePaciente
        leitoId="SYNTH-LEITO-01"
        cliente={clienteCom(itemSemSerie)}
        aoVoltar={() => undefined}
        intervaloRecargaMs={null}
        relogio={criarRelogioDeTeste(AGORA)}
      />,
    );
    expect(screen.queryByTestId("tendencia-avaliacoes")).toBeNull();
  });
});
