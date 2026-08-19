/**
 * apps/web/src/estado/cadenciaNoPontoDeUso.test.tsx
 *
 * O ESPAÇAMENTO DA RELEITURA CHEGA À TELA — ou não vale.
 *
 * `./cadenciaDeRecarga.ts` calcula jitter e backoff, e tem teste próprio. Este
 * arquivo verifica a parte que a matemática não garante: que o hook AGENDA com
 * a cadência calculada, que a contagem de falhas consecutivas zera no primeiro
 * sucesso, e — o item de segurança clínica — que uma releitura espaçada
 * APARECE, com o fator, no ponto de uso.
 *
 * POR QUE ISSO É SEGURANÇA E NÃO ESTÉTICA. Uma tela que passou a reler de 4 em
 * 4 minutos por backoff, com a mesma aparência de uma que relê de 30 em 30
 * segundos, é um retrato antigo se apresentando como corrente: HAZ-0025, e o
 * oposto literal de SAF-0025 ("the interface MUST never appear healthy when it
 * is not"). O mesmo vale para a aba em segundo plano, onde quem espaça é o
 * navegador e o cliente não tem como impedir.
 *
 * Todo tempo passa pela porta `./relogio.ts`; o jitter passa por `sortear`
 * injetado. Nada aqui espera de verdade.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import { GradeLeitos } from "../components/GradeLeitos.js";
import type { ItemGradeLeito } from "../domain/clinico.js";
import { criarRelogioDeTeste } from "../teste/relogioDeTeste.js";
import { ESPACAMENTO_MAXIMO, FALHAS_ATE_ESPACAR } from "./cadenciaDeRecarga.js";
import { INTERVALO_RECARGA_PADRAO_MS } from "./recursoRemoto.js";

const ITEM: ItemGradeLeito = {
  leitoId: "SYNTH-LEITO-01",
  pacienteRef: "amh:psr:v1:SYNTH-P001",
  pacienteApelido: "Paciente SYNTH-P001",
  avaliacao: null,
  alertas: [],
};

interface Bancada {
  readonly relogio: ReturnType<typeof criarRelogioDeTeste>;
  readonly falhar: (valor: boolean) => void;
  readonly leituras: () => number;
}

function montarGrade(): Bancada {
  const relogio = criarRelogioDeTeste();
  let falhar = false;
  let leituras = 0;

  const cliente: ClienteApiIntensiCare = {
    listarGradeLeitos: async () => {
      leituras += 1;
      if (falhar) throw new Error("falha sintética de leitura");
      return { estadoCarregamento: "pronto" as const, dados: [ITEM], problema: null };
    },
    obterAvaliacaoPaciente: async () => ({
      estadoCarregamento: "pronto",
      dados: ITEM,
      problema: null,
    }),
    reconhecerAlerta: async () => ({ estadoCarregamento: "erro", dados: null, problema: null }),
  };

  render(
    <GradeLeitos
      cliente={cliente}
      aoSelecionarLeito={() => {}}
      intervaloRecargaMs={INTERVALO_RECARGA_PADRAO_MS}
      relogio={relogio}
    />,
  );

  return {
    relogio,
    falhar: (valor) => {
      falhar = valor;
    },
    leituras: () => leituras,
  };
}

/** Avança o relógio o bastante para vencer um ciclo, mesmo espaçado. */
async function passarUmCiclo(bancada: Bancada, fator = 1): Promise<void> {
  const antes = bancada.leituras();
  await act(async () => {
    bancada.relogio.avancar(INTERVALO_RECARGA_PADRAO_MS * fator * 1.5);
  });
  await waitFor(() => {
    expect(bancada.leituras()).toBeGreaterThan(antes);
  });
}

describe("espaçamento por falhas repetidas — e ele APARECE na tela", () => {
  it("em regime, nenhum selo de cadência é exibido (economia de sinal)", async () => {
    const bancada = montarGrade();
    await waitFor(() => expect(bancada.leituras()).toBe(1));
    await passarUmCiclo(bancada);

    expect(
      screen.queryByTestId("rotulo-cadencia-recarga"),
      "um aviso permanente de 'tudo normal' treina o olho a ignorar a região",
    ).toBeNull();
  });

  it("a PRIMEIRA falha ainda não espaça nem declara espaçamento", async () => {
    const bancada = montarGrade();
    await waitFor(() => expect(bancada.leituras()).toBe(1));

    bancada.falhar(true);
    await passarUmCiclo(bancada);

    expect(FALHAS_ATE_ESPACAR).toBe(2);
    const rotulo = screen.queryByTestId("rotulo-cadencia-recarga");
    if (rotulo !== null) {
      expect(rotulo.getAttribute("data-cadencia")).toBe("regime");
    }
  });

  it("falhas CONSECUTIVAS espaçam a releitura E declaram o fator na tela", async () => {
    const bancada = montarGrade();
    await waitFor(() => expect(bancada.leituras()).toBe(1));

    bancada.falhar(true);
    await passarUmCiclo(bancada);
    await passarUmCiclo(bancada);

    await waitFor(() => {
      const rotulo = screen.getByTestId("rotulo-cadencia-recarga");
      expect(
        rotulo.getAttribute("data-cadencia"),
        "a releitura espaçou sem que a tela dissesse por quê (HAZ-0025)",
      ).toBe("espacada_por_falha");
      expect(Number(rotulo.getAttribute("data-fator-espacamento"))).toBeGreaterThan(1);
    });

    // O texto exibido é FACTUAL e traz o número contra o qual conferir.
    expect(screen.getByTestId("rotulo-cadencia-recarga").textContent ?? "").toMatch(
      /Releitura automática ESPAÇADA/,
    );
  });

  it("o espaçamento tem TETO e a tela nunca declara fator além dele", async () => {
    const bancada = montarGrade();
    await waitFor(() => expect(bancada.leituras()).toBe(1));
    bancada.falhar(true);

    for (let i = 0; i < 8; i += 1) {
      await passarUmCiclo(bancada, ESPACAMENTO_MAXIMO);
    }

    await waitFor(() => {
      const fator = Number(
        screen.getByTestId("rotulo-cadencia-recarga").getAttribute("data-fator-espacamento"),
      );
      expect(fator).toBeLessThanOrEqual(ESPACAMENTO_MAXIMO);
    });
  });

  it("a tela declara UMA cadência, nunca duas contraditórias", async () => {
    /*
      ACH-O3-13. `RotuloIdadeVisao` imprimia sempre "Releitura automática a cada
      {intervalo BASE}". Com o backoff no teto, a tela dizia "a cada 30 s" e,
      três linhas abaixo, "ESPAÇADA — 8× o intervalo normal, agora a cada 4 min":
      duas descrições divergentes do MESMO fato — o padrão que este próprio
      código proíbe em outro lugar, citando ADR-0008 N3.
    */
    const bancada = montarGrade();
    await waitFor(() => expect(bancada.leituras()).toBe(1));

    // Em REGIME a frase existe: o teste não passa por a frase ter sumido.
    expect(screen.getByTestId("idade-visao-texto").textContent ?? "").toMatch(
      /Releitura automática a cada/,
    );

    bancada.falhar(true);
    await passarUmCiclo(bancada);
    await passarUmCiclo(bancada);
    await waitFor(() => {
      expect(screen.getByTestId("rotulo-cadencia-recarga").getAttribute("data-cadencia")).toBe(
        "espacada_por_falha",
      );
    });

    // Guarda de não-vacuidade: o selo espaçado de fato declara uma cadência.
    expect(screen.getByTestId("rotulo-cadencia-recarga").textContent ?? "").toMatch(/agora a cada/);
    expect(
      screen.getByTestId("idade-visao-texto").textContent ?? "",
      "a tela afirmou o intervalo BASE ao lado do espaçado — duas descrições do mesmo fato",
    ).not.toMatch(/Releitura automática a cada/);
  });

  it("voltar a ter sucesso REMOVE o selo — o espaçamento não fica pendurado", async () => {
    const bancada = montarGrade();
    await waitFor(() => expect(bancada.leituras()).toBe(1));

    bancada.falhar(true);
    await passarUmCiclo(bancada);
    await passarUmCiclo(bancada);
    await waitFor(() => {
      expect(screen.getByTestId("rotulo-cadencia-recarga")).toBeTruthy();
    });

    bancada.falhar(false);
    await passarUmCiclo(bancada, ESPACAMENTO_MAXIMO);
    await passarUmCiclo(bancada);

    await waitFor(() => {
      expect(
        screen.queryByTestId("rotulo-cadencia-recarga"),
        "a tela continuou declarando espaçamento depois de a leitura voltar",
      ).toBeNull();
    });
  });
});

describe("aba em segundo plano — o estrangulamento do navegador é declarado", () => {
  function definirVisibilidade(valor: "visible" | "hidden"): void {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => valor,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }

  it("aba oculta produz declaração explícita na tela", async () => {
    const bancada = montarGrade();
    await waitFor(() => expect(bancada.leituras()).toBe(1));
    expect(screen.queryByTestId("rotulo-cadencia-recarga")).toBeNull();

    act(() => {
      definirVisibilidade("hidden");
    });

    await waitFor(() => {
      const rotulo = screen.getByTestId("rotulo-cadencia-recarga");
      expect(rotulo.getAttribute("data-visibilidade")).toBe("oculta");
      expect(rotulo.textContent ?? "").toMatch(/Aba em segundo plano/);
    });

    act(() => {
      definirVisibilidade("visible");
    });
    await waitFor(() => {
      expect(screen.queryByTestId("rotulo-cadencia-recarga")).toBeNull();
    });
  });

  it("VOLTAR à aba dispara releitura IMEDIATA — sem esperar o próximo ciclo", async () => {
    const bancada = montarGrade();
    await waitFor(() => expect(bancada.leituras()).toBe(1));

    act(() => {
      definirVisibilidade("hidden");
    });
    const antes = bancada.leituras();

    act(() => {
      definirVisibilidade("visible");
    });

    await waitFor(() => {
      expect(
        bancada.leituras(),
        "voltar para a aba não releu: quem volta encontra um retrato antigo com cara de atual",
      ).toBeGreaterThan(antes);
    });
    // E nenhum tempo foi avançado: a releitura é do RETORNO, não do ciclo.
  });

  it("a releitura de retorno é ROTINA — a grade não pisca 'Tentando novamente…'", async () => {
    const bancada = montarGrade();
    await waitFor(() => expect(bancada.leituras()).toBe(1));
    await screen.findAllByText(/SYNTH-LEITO-01/);

    act(() => {
      definirVisibilidade("hidden");
    });
    act(() => {
      definirVisibilidade("visible");
    });

    // Invariante I6: recarga de rotina não altera nada visível ao iniciar.
    expect(screen.queryByText(/Tentando novamente/)).toBeNull();
    expect(screen.getAllByText(/SYNTH-LEITO-01/).length).toBeGreaterThan(0);
  });
});
