import { describe, expect, it } from "vitest";
import { observacaoSintetica, utcLocal } from "./apoio-de-teste.js";
import {
  type AvaliacaoParaDeriva,
  detectarDeriva,
  distanciaDeVariacaoTotal,
  limiarDeInstrumentacao,
  type ObservacaoObservada,
  perfilarInsumos,
  perfilarStatus,
} from "./deriva.js";
import { criarJanela, instantePresente, POLITICA_DE_PARCIAL_CONSERVADORA } from "./tipos.js";

const JANELA_REFERENCIA = criarJanela(utcLocal("2026-08-01", 0), utcLocal("2026-08-08", 0));
const JANELA_ATUAL = criarJanela(utcLocal("2026-08-08", 0), utcLocal("2026-08-15", 0));

/** Série saudável: volume estável, qualidade `valid`, dois conceitos, unidade presente. */
function serieSaudavel(
  prefixo: string,
  dia: string,
  quantidade: number,
): readonly ObservacaoObservada[] {
  return Array.from({ length: quantidade }, (_, i) =>
    observacaoSintetica({
      id: `${prefixo}-${i}`,
      conceito: i % 2 === 0 ? "SYNTH-CONCEPT-HR" : "SYNTH-CONCEPT-RR",
      utc: utcLocal(dia, i % 24),
    }),
  );
}

/**
 * Série DEGRADADA: volume caiu para 1/5, o conceito SYNTH-CONCEPT-RR sumiu da
 * fonte, 60% das observações vêm em quarentena e 40% chegam sem tempo clínico
 * e sem unidade canônica.
 */
function serieDegradada(dia: string, quantidade: number): readonly ObservacaoObservada[] {
  return Array.from({ length: quantidade }, (_, i) =>
    observacaoSintetica({
      id: `deg-${i}`,
      conceito: "SYNTH-CONCEPT-HR",
      utc: utcLocal(dia, i % 24),
      qualidade: i % 5 < 3 ? "quarantined" : "valid",
      unidadeCanonica: i % 5 < 2 ? null : "/min",
      semTempoClinico: i % 5 < 2,
    }),
  );
}

function avaliacoes(
  dia: string,
  quantidade: number,
  fracaoNaoComputavel: number,
): readonly AvaliacaoParaDeriva[] {
  const naoComputaveis = Math.round(quantidade * fracaoNaoComputavel);
  return Array.from({ length: quantidade }, (_, i) => ({
    avaliacaoId: `${dia}-aval-${i}`,
    instante: instantePresente(utcLocal(dia, i % 24)),
    estadoBruto: i < naoComputaveis ? "indisponivel" : "valido",
  }));
}

describe("distanciaDeVariacaoTotal", () => {
  it("é 0 para distribuições idênticas e 1 para disjuntas", () => {
    const a = [
      { chave: "x", contagem: 5 },
      { chave: "y", contagem: 5 },
    ];
    expect(distanciaDeVariacaoTotal(a, a)).toBe(0);
    expect(
      distanciaDeVariacaoTotal([{ chave: "x", contagem: 10 }], [{ chave: "y", contagem: 10 }]),
    ).toBe(1);
  });

  it("categoria presente em só um lado entra com massa zero do outro", () => {
    const referencia = [
      { chave: "hr", contagem: 50 },
      { chave: "rr", contagem: 50 },
    ];
    const atual = [{ chave: "hr", contagem: 50 }];
    expect(distanciaDeVariacaoTotal(referencia, atual)).toBeCloseTo(0.5);
  });
});

describe("perfis de janela", () => {
  it("perfila insumos por conceito, qualidade, unidade e ausência de tempo clínico", () => {
    const perfil = perfilarInsumos(
      "referencia",
      JANELA_REFERENCIA,
      serieSaudavel("ok", "2026-08-02", 100),
    );
    expect(perfil.total).toBe(100);
    expect(perfil.porConceito).toEqual([
      { chave: "SYNTH-CONCEPT-HR", contagem: 50 },
      { chave: "SYNTH-CONCEPT-RR", contagem: 50 },
    ]);
    expect(perfil.semTempoClinico).toBe(0);
  });

  it("taxa de status não-computável é null sem avaliação nenhuma — nunca 0", () => {
    const perfil = perfilarStatus("vazia", JANELA_ATUAL, [], POLITICA_DE_PARCIAL_CONSERVADORA);
    expect(perfil.total).toBe(0);
    expect(perfil.taxaNaoComputavel).toBeNull();
  });

  it("estado desconhecido conta como NÃO computável e aparece nomeado", () => {
    const perfil = perfilarStatus(
      "atual",
      JANELA_ATUAL,
      [
        {
          avaliacaoId: "a",
          instante: instantePresente(utcLocal("2026-08-09", 8)),
          estadoBruto: "verde",
        },
        {
          avaliacaoId: "b",
          instante: instantePresente(utcLocal("2026-08-09", 9)),
          estadoBruto: "valido",
        },
      ],
      POLITICA_DE_PARCIAL_CONSERVADORA,
    );
    expect(perfil.naoComputaveis).toBe(1);
    expect(perfil.porEstado).toContainEqual({ chave: "nao_reconhecido", contagem: 1 });
  });
});

describe("CASO EXIGIDO — deriva de fonte: a fonte está degradando", () => {
  const limiar = limiarDeInstrumentacao(0.1, 20);

  const relatorio = detectarDeriva({
    referencia: {
      insumos: perfilarInsumos(
        "semana-de-referencia",
        JANELA_REFERENCIA,
        serieSaudavel("ok", "2026-08-02", 200),
      ),
      status: perfilarStatus(
        "semana-de-referencia",
        JANELA_REFERENCIA,
        avaliacoes("2026-08-02", 100, 0.05),
        POLITICA_DE_PARCIAL_CONSERVADORA,
      ),
    },
    atual: {
      insumos: perfilarInsumos("semana-atual", JANELA_ATUAL, serieDegradada("2026-08-09", 40)),
      status: perfilarStatus(
        "semana-atual",
        JANELA_ATUAL,
        avaliacoes("2026-08-09", 100, 0.6),
        POLITICA_DE_PARCIAL_CONSERVADORA,
      ),
    },
    limiar,
  });

  const sinal = (id: string) => relatorio.sinais.find((s) => s.id === id);

  it("registra mudança na distribuição de conceitos (a fonte parou de enviar um parâmetro)", () => {
    const s = sinal("distribuicao-de-conceito");
    expect(s?.classificacao).toBe("mudanca_registrada");
    expect(s?.magnitude).toBeCloseTo(0.5);
    expect(s?.maioresContribuicoes[0]?.chave).toBeDefined();
    const rr = s?.maioresContribuicoes.find((c) => c.chave === "SYNTH-CONCEPT-RR");
    expect(rr?.proporcaoAtual).toBe(0);
  });

  it("registra migração de qualidade para quarentena", () => {
    const s = sinal("distribuicao-de-qualidade");
    expect(s?.classificacao).toBe("mudanca_registrada");
    expect(s?.maioresContribuicoes).toContainEqual({
      chave: "quarantined",
      proporcaoReferencia: 0,
      proporcaoAtual: 0.6,
    });
  });

  it("registra insumos chegando sem tempo clínico", () => {
    const s = sinal("proporcao-sem-tempo-clinico");
    expect(s?.classificacao).toBe("mudanca_registrada");
    expect(s?.magnitude).toBeCloseTo(0.4);
  });

  it("registra unidade canônica ausente aparecendo na fonte", () => {
    const s = sinal("distribuicao-de-unidade-canonica");
    expect(s?.classificacao).toBe("mudanca_registrada");
    expect(s?.maioresContribuicoes).toContainEqual({
      chave: "unidade-canonica-ausente",
      proporcaoReferencia: 0,
      proporcaoAtual: 0.4,
    });
  });

  it("registra a subida da taxa de status NÃO computável", () => {
    const s = sinal("taxa-de-status-nao-computavel");
    expect(s?.classificacao).toBe("mudanca_registrada");
    expect(s?.magnitude).toBeCloseTo(0.55);
    expect(s?.interpretacao).toContain("investigação humana");
  });

  it("registra a queda de volume — fonte que emudece não muda distribuição, some", () => {
    const s = sinal("variacao-de-volume-de-insumos");
    expect(s?.classificacao).toBe("mudanca_registrada");
    expect(s?.magnitude).toBeCloseTo(0.8);
  });

  it("resume os sinais com mudança e NÃO conclui que a fonte degradou", () => {
    expect(relatorio.sinaisComMudanca).toEqual(
      expect.arrayContaining([
        "distribuicao-de-conceito",
        "distribuicao-de-qualidade",
        "distribuicao-de-unidade-canonica",
        "proporcao-sem-tempo-clinico",
        "taxa-de-status-nao-computavel",
        "variacao-de-volume-de-insumos",
      ]),
    );
    expect(relatorio.nota).toContain("não conclui que a fonte degradou");
    // Guarda de não-vacuidade. A afirmação é que TODO sinal carrega a
    // proveniência de limiar NÃO RATIFICADO — um relatório sem sinal nenhum
    // satisfaria o laço por ausência de sinal, e um limiar sem proveniência
    // declarada passaria despercebido. São 8 sinais.
    expect(relatorio.sinais, "relatório sem sinal — laço vazio").toHaveLength(8);
    for (const s of relatorio.sinais) {
      expect(s.limiar.proveniencia).toBe("limiar-de-instrumentacao-nao-ratificado-AUTH-CLINSAFETY");
    }
  });
});

describe("série estável não produz mudança", () => {
  it("duas janelas equivalentes ficam abaixo do limiar", () => {
    const relatorio = detectarDeriva({
      referencia: {
        insumos: perfilarInsumos("r", JANELA_REFERENCIA, serieSaudavel("r", "2026-08-02", 200)),
        status: perfilarStatus(
          "r",
          JANELA_REFERENCIA,
          avaliacoes("2026-08-02", 100, 0.05),
          POLITICA_DE_PARCIAL_CONSERVADORA,
        ),
      },
      atual: {
        insumos: perfilarInsumos("a", JANELA_ATUAL, serieSaudavel("a", "2026-08-09", 200)),
        status: perfilarStatus(
          "a",
          JANELA_ATUAL,
          avaliacoes("2026-08-09", 100, 0.05),
          POLITICA_DE_PARCIAL_CONSERVADORA,
        ),
      },
      limiar: limiarDeInstrumentacao(0.1, 20),
    });
    expect(relatorio.sinaisComMudanca).toEqual([]);
  });
});

describe("amostra pequena NUNCA vira 'sem mudança' (anti-padrão KPI-PPV-01(c))", () => {
  it("classifica tudo como amostra_insuficiente abaixo do n mínimo", () => {
    const relatorio = detectarDeriva({
      referencia: {
        insumos: perfilarInsumos("r", JANELA_REFERENCIA, serieSaudavel("r", "2026-08-02", 3)),
        status: perfilarStatus(
          "r",
          JANELA_REFERENCIA,
          avaliacoes("2026-08-02", 2, 0),
          POLITICA_DE_PARCIAL_CONSERVADORA,
        ),
      },
      atual: {
        insumos: perfilarInsumos("a", JANELA_ATUAL, serieDegradada("2026-08-09", 2)),
        status: perfilarStatus(
          "a",
          JANELA_ATUAL,
          avaliacoes("2026-08-09", 2, 1),
          POLITICA_DE_PARCIAL_CONSERVADORA,
        ),
      },
      limiar: limiarDeInstrumentacao(0.1, 50),
    });
    // Guarda de não-vacuidade: `[].every(...)` é `true`. Sem esta linha, um
    // relatório que perdesse os sinais afirmaria "toda amostra é
    // insuficiente" sem ter avaliado amostra alguma — e o `.some(...)`
    // negativo logo abaixo também passaria por vacuidade.
    expect(relatorio.sinais, "relatório sem sinal — `.every` e `.some` vazios").toHaveLength(8);
    expect(relatorio.sinais.every((s) => s.classificacao === "amostra_insuficiente")).toBe(true);
    expect(relatorio.sinais.some((s) => s.classificacao === "sem_mudanca_acima_do_limiar")).toBe(
      false,
    );
    expect(relatorio.sinaisComMudanca).toEqual([]);
  });
});

describe("FONTE SILENCIOSA — silêncio nunca é classificado como 'nada a ver'", () => {
  it("volume zero na janela atual é mudança registrada, não amostra insuficiente", () => {
    const relatorio = detectarDeriva({
      referencia: {
        insumos: perfilarInsumos("r", JANELA_REFERENCIA, serieSaudavel("r", "2026-08-02", 200)),
        status: perfilarStatus(
          "r",
          JANELA_REFERENCIA,
          avaliacoes("2026-08-02", 100, 0.05),
          POLITICA_DE_PARCIAL_CONSERVADORA,
        ),
      },
      atual: {
        insumos: perfilarInsumos("a", JANELA_ATUAL, []),
        status: perfilarStatus("a", JANELA_ATUAL, [], POLITICA_DE_PARCIAL_CONSERVADORA),
      },
      limiar: limiarDeInstrumentacao(0.1, 20),
    });

    const volumeInsumos = relatorio.sinais.find((s) => s.id === "variacao-de-volume-de-insumos");
    const volumeAvaliacoes = relatorio.sinais.find(
      (s) => s.id === "variacao-de-volume-de-avaliacoes",
    );
    expect(volumeInsumos?.classificacao).toBe("mudanca_registrada");
    expect(volumeInsumos?.magnitude).toBe(1);
    expect(volumeInsumos?.maioresContribuicoes[0]?.chave).toBe("fonte-silenciosa-na-janela-atual");
    expect(volumeAvaliacoes?.classificacao).toBe("mudanca_registrada");
    expect(relatorio.sinaisComMudanca).toEqual(
      expect.arrayContaining(["variacao-de-volume-de-insumos", "variacao-de-volume-de-avaliacoes"]),
    );

    // As distribuições, sobre zero amostras, seguem honestamente insuficientes.
    expect(relatorio.sinais.find((s) => s.id === "distribuicao-de-conceito")?.classificacao).toBe(
      "amostra_insuficiente",
    );
  });

  it("com referência pequena demais, nem o volume é classificado", () => {
    const relatorio = detectarDeriva({
      referencia: {
        insumos: perfilarInsumos("r", JANELA_REFERENCIA, serieSaudavel("r", "2026-08-02", 3)),
        status: perfilarStatus(
          "r",
          JANELA_REFERENCIA,
          avaliacoes("2026-08-02", 3, 0),
          POLITICA_DE_PARCIAL_CONSERVADORA,
        ),
      },
      atual: {
        insumos: perfilarInsumos("a", JANELA_ATUAL, []),
        status: perfilarStatus("a", JANELA_ATUAL, [], POLITICA_DE_PARCIAL_CONSERVADORA),
      },
      limiar: limiarDeInstrumentacao(0.1, 20),
    });
    expect(
      relatorio.sinais.find((s) => s.id === "variacao-de-volume-de-insumos")?.classificacao,
    ).toBe("amostra_insuficiente");
  });
});

describe("limiarDeInstrumentacao", () => {
  it("recusa limiar fora de [0,1] e n mínimo não inteiro/positivo", () => {
    expect(() => limiarDeInstrumentacao(1.5, 10)).toThrow(/fora de/);
    expect(() => limiarDeInstrumentacao(0.1, 0)).toThrow(/n mínimo/);
    expect(() => limiarDeInstrumentacao(0.1, 2.5)).toThrow(/n mínimo/);
  });
});
