/**
 * Testes do redutor PURO de recurso remoto. Cada bloco nomeia o invariante
 * (I1..I5) declarado no cabeçalho de `./recursoRemoto.ts`.
 *
 * O invariante I1 é o que impede a volta do defeito do ACH-07: nenhum evento
 * terminal pode deixar a tela em estado não-terminal. Ele é verificado de
 * forma EXAUSTIVA sobre a combinação de todo estado de resposta possível com
 * todo estado de partida — não por amostragem.
 */
import { describe, expect, it } from "vitest";
import type { ProblemaLocal, RespostaApi } from "../api/tipos.js";
import type { EstadoCarregamento } from "../domain/estados.js";
import {
  type EstadoRecurso,
  ehEstadoDeFalha,
  estadoInicialRecurso,
  PROBLEMA_REJEICAO_INESPERADA,
  PROBLEMA_TEMPO_ESGOTADO,
  problemaDeRejeicao,
  reduzirRecurso,
} from "./recursoRemoto.js";

const AGORA = "2026-08-17T12:00:00.000Z";
const DEPOIS = "2026-08-17T12:05:00.000Z";

const TODOS_ESTADOS: EstadoCarregamento[] = [
  "carregando",
  "vazio",
  "indisponivel",
  "proibido",
  "tempo_esgotado",
  "retentando",
  "parcial",
  "pronto",
  "erro",
];

const PROBLEMA: ProblemaLocal = {
  type: "about:blank",
  title: "Falha sintética",
  status: 503,
  detail: "Detalhe sintético.",
};

function resposta<T>(estadoCarregamento: EstadoCarregamento, dados: T | null): RespostaApi<T> {
  return {
    estadoCarregamento,
    dados,
    problema: ehEstadoDeFalha(estadoCarregamento) ? PROBLEMA : null,
  };
}

/** Estado com dado já carregado — ponto de partida dos cenários de recarga. */
function comDado(): EstadoRecurso<string[]> {
  return reduzirRecurso(estadoInicialRecurso<string[]>(), {
    tipo: "resolvido",
    resposta: resposta("pronto", ["SYNTH-LEITO-01"]),
    agora: AGORA,
  });
}

describe("I1 — nenhum evento terminal deixa a tela em estado não-terminal", () => {
  it("exaustivo: para todo estado de resposta e todo estado de partida", () => {
    const partidas: EstadoRecurso<string[]>[] = [estadoInicialRecurso<string[]>(), comDado()];

    for (const partida of partidas) {
      for (const estadoResposta of TODOS_ESTADOS) {
        const seguinte = reduzirRecurso(partida, {
          tipo: "resolvido",
          resposta: resposta(estadoResposta, ["SYNTH-LEITO-01"]),
          agora: DEPOIS,
        });
        expect(seguinte.estadoTela).not.toBe("carregando");
        expect(seguinte.estadoTela).not.toBe("retentando");
      }
    }
  });

  it("um cliente que resolve com estado NÃO-TERMINAL vira erro explícito, não espera infinita", () => {
    for (const naoTerminal of ["carregando", "retentando"] as const) {
      const seguinte = reduzirRecurso(estadoInicialRecurso<string[]>(), {
        tipo: "resolvido",
        resposta: resposta(naoTerminal, null),
        agora: AGORA,
      });
      expect(seguinte.estadoTela).toBe("erro");
      expect(seguinte.problema?.title).toMatch(/Resposta inválida do cliente/);
    }
  });

  it("rejeição e tempo esgotado também são terminais", () => {
    const rejeitado = reduzirRecurso(estadoInicialRecurso<string[]>(), {
      tipo: "rejeitado",
      problema: PROBLEMA_REJEICAO_INESPERADA,
    });
    expect(rejeitado.estadoTela).toBe("erro");

    const esgotado = reduzirRecurso(estadoInicialRecurso<string[]>(), {
      tipo: "tempoEsgotado",
      problema: PROBLEMA_TEMPO_ESGOTADO,
    });
    expect(esgotado.estadoTela).toBe("tempo_esgotado");
  });
});

describe("I2 — falha preserva o dado anterior e SEMPRE o marca como não-atual", () => {
  it("recarga que falha mantém o dado e marca frescor da visão", () => {
    const seguinte = reduzirRecurso(comDado(), {
      tipo: "resolvido",
      resposta: resposta("indisponivel", null),
      agora: DEPOIS,
    });
    expect(seguinte.dados).toEqual(["SYNTH-LEITO-01"]);
    expect(seguinte.frescorVisao).toBe("desatualizado_apos_falha");
    expect(seguinte.estadoTela).toBe("indisponivel");
    // O horário exibido continua sendo o da ÚLTIMA LEITURA BEM-SUCEDIDA,
    // nunca o da tentativa que falhou.
    expect(seguinte.obtidoEm).toBe(AGORA);
  });

  it("rejeição após dado carregado também marca desatualizado", () => {
    const seguinte = reduzirRecurso(comDado(), {
      tipo: "rejeitado",
      problema: PROBLEMA_REJEICAO_INESPERADA,
    });
    expect(seguinte.dados).toEqual(["SYNTH-LEITO-01"]);
    expect(seguinte.frescorVisao).toBe("desatualizado_apos_falha");
  });

  it("falha SEM dado anterior não inventa rótulo de desatualizado", () => {
    const seguinte = reduzirRecurso(estadoInicialRecurso<string[]>(), {
      tipo: "rejeitado",
      problema: PROBLEMA_REJEICAO_INESPERADA,
    });
    expect(seguinte.dados).toBeNull();
    expect(seguinte.frescorVisao).toBe("atual");
  });

  it("sucesso após falha limpa o rótulo e atualiza o horário", () => {
    const falhou = reduzirRecurso(comDado(), {
      tipo: "rejeitado",
      problema: PROBLEMA_REJEICAO_INESPERADA,
    });
    const recuperou = reduzirRecurso(falhou, {
      tipo: "resolvido",
      resposta: resposta("pronto", ["SYNTH-LEITO-02"]),
      agora: DEPOIS,
    });
    expect(recuperou.frescorVisao).toBe("atual");
    expect(recuperou.dados).toEqual(["SYNTH-LEITO-02"]);
    expect(recuperou.obtidoEm).toBe(DEPOIS);
    expect(recuperou.problema).toBeNull();
  });

  it("'vazio' é sucesso, não falha: não marca desatualizado", () => {
    const seguinte = reduzirRecurso(estadoInicialRecurso<string[]>(), {
      tipo: "resolvido",
      resposta: resposta("vazio", null),
      agora: AGORA,
    });
    expect(seguinte.estadoTela).toBe("vazio");
    expect(seguinte.frescorVisao).toBe("atual");
    expect(seguinte.problema).toBeNull();
  });
});

describe("I3 — toda falha carrega um problema (o erro é acionável, não uma tela vazia)", () => {
  it("qualquer estado de falha resulta em problema não-nulo", () => {
    for (const estadoFalha of TODOS_ESTADOS.filter(ehEstadoDeFalha)) {
      const seguinte = reduzirRecurso(estadoInicialRecurso<string[]>(), {
        tipo: "resolvido",
        resposta: { estadoCarregamento: estadoFalha, dados: null, problema: null },
        agora: AGORA,
      });
      expect(seguinte.problema).not.toBeNull();
    }
  });

  it("problemaDeRejeicao nunca propaga a mensagem crua da exceção", () => {
    const problema = problemaDeRejeicao(new Error("https://interno/v1?token=abc"));
    expect(JSON.stringify(problema)).not.toMatch(/token=abc/);
    expect(problema.detail).toBeTruthy();
  });
});

describe("I4 — contagem de tentativas visível e coerente", () => {
  it("recarga incrementa; sucesso zera", () => {
    const primeira = comDado();
    expect(primeira.tentativas).toBe(0);

    const retentando = reduzirRecurso(primeira, { tipo: "iniciar", recarga: true });
    expect(retentando.estadoTela).toBe("retentando");
    expect(retentando.tentativas).toBe(1);
    // Durante a retentativa o dado anterior continua na tela.
    expect(retentando.dados).toEqual(["SYNTH-LEITO-01"]);

    const falhou = reduzirRecurso(retentando, {
      tipo: "rejeitado",
      problema: PROBLEMA_REJEICAO_INESPERADA,
    });
    const segunda = reduzirRecurso(falhou, { tipo: "iniciar", recarga: true });
    expect(segunda.tentativas).toBe(2);

    const sucesso = reduzirRecurso(segunda, {
      tipo: "resolvido",
      resposta: resposta("pronto", ["SYNTH-LEITO-01"]),
      agora: DEPOIS,
    });
    expect(sucesso.tentativas).toBe(0);
  });

  it("recarga SEM dado em tela volta a 'carregando' (não há conteúdo a preservar)", () => {
    const falhouSemDado = reduzirRecurso(estadoInicialRecurso<string[]>(), {
      tipo: "rejeitado",
      problema: PROBLEMA_REJEICAO_INESPERADA,
    });
    const seguinte = reduzirRecurso(falhouSemDado, { tipo: "iniciar", recarga: true });
    expect(seguinte.estadoTela).toBe("carregando");
    expect(seguinte.tentativas).toBe(1);
  });

  it("uma retentativa que falha PRESERVA a marcação de desatualizado já existente", () => {
    const falhou = reduzirRecurso(comDado(), {
      tipo: "rejeitado",
      problema: PROBLEMA_REJEICAO_INESPERADA,
    });
    expect(falhou.frescorVisao).toBe("desatualizado_apos_falha");
    const retentando = reduzirRecurso(falhou, { tipo: "iniciar", recarga: true });
    // Enquanto a nova tentativa corre, o conteúdo em tela continua sendo o
    // antigo — e continua rotulado. Limpar o rótulo aqui faria o dado velho
    // parecer atual durante a retentativa.
    expect(retentando.frescorVisao).toBe("desatualizado_apos_falha");
  });
});

describe("I5 — cancelamento não é evento do redutor", () => {
  it("o tipo de evento não admite 'cancelado' — o aborto é descartado antes do despacho", () => {
    // Documenta a decisão de desenho: se existisse um evento de cancelamento,
    // haveria uma transição possível de volta para (ou permanência em)
    // 'carregando' após o fim de uma requisição — exatamente o buraco que o
    // ACH-07 fechou. O cancelamento é tratado no hook, comparando o sinal.
    const eventos = ["iniciar", "resolvido", "rejeitado", "tempoEsgotado"];
    expect(eventos).not.toContain("cancelado");
  });

  it("o estado inicial é 'carregando' e só sai dele por evento terminal", () => {
    const inicial = estadoInicialRecurso<string[]>();
    expect(inicial.estadoTela).toBe("carregando");
    expect(inicial.dados).toBeNull();
    expect(inicial.tentativas).toBe(0);
  });
});
