import { describe, expect, it } from "vitest";
import { FUSO_SINTETICO, TURNOS_SINTETICOS, utcLocal } from "./apoio-de-teste.js";
import {
  chaveDeDia,
  chaveDeVersao,
  contarPorChave,
  criarJanela,
  dentroDaJanela,
  enumerarDias,
  estadoEhComputavel,
  instanteAusente,
  instanteLocal,
  instantePresente,
  montarCompletude,
  normalizarEstado,
  POLITICA_DE_PARCIAL_CONSERVADORA,
  parametrosDeInstrumentacao,
  turnoDe,
} from "./tipos.js";

/**
 * Executa e devolve o erro lançado; FALHA se nada for lançado.
 *
 * Existe para que classe E mensagem sejam asseridas sobre o MESMO erro. Duas
 * chamadas `.toThrow(Classe)` + `.toThrow(/regex/)` invocam a função duas
 * vezes e, a rigor, não provam que foi um único erro a satisfazer as duas.
 */
function capturarErro(executar: () => unknown): unknown {
  try {
    executar();
  } catch (erro) {
    return erro;
  }
  throw new Error("a chamada NÃO lançou — a recusa sob teste não foi exercida");
}

const CONVENCAO_CIVIL = {
  fusoHorario: FUSO_SINTETICO,
  horaDeCorte: 0,
  proveniencia: "convencao-de-dia-nao-ratificada-KPI-OPS-02",
} as const;

const CONVENCAO_7_AS_7 = { ...CONVENCAO_CIVIL, horaDeCorte: 7 } as const;

describe("normalizarEstado — fail-closed", () => {
  it("mapeia os dois vocabulários em uso (contrato pt-BR e kernel)", () => {
    expect(normalizarEstado("valido")).toBe("valido");
    expect(normalizarEstado("valid")).toBe("valido");
    expect(normalizarEstado("indisponivel")).toBe("nao_avaliado");
    expect(normalizarEstado("not_evaluated")).toBe("nao_avaliado");
    expect(normalizarEstado("stale")).toBe("desatualizado");
    expect(normalizarEstado("invalid")).toBe("invalido");
    expect(normalizarEstado("partial")).toBe("parcial");
  });

  it("NUNCA transforma um vocabulário desconhecido em estado computável", () => {
    for (const bruto of ["", "   ", "normal", "ok", "green", "computado", "0"]) {
      const estado = normalizarEstado(bruto);
      expect(estado).toBe("nao_reconhecido");
      expect(estadoEhComputavel(estado, POLITICA_DE_PARCIAL_CONSERVADORA)).toBe(false);
    }
  });

  it("parcial só é computável sob política explicitamente aprovada", () => {
    expect(estadoEhComputavel("parcial", POLITICA_DE_PARCIAL_CONSERVADORA)).toBe(false);
    expect(
      estadoEhComputavel("parcial", {
        parcialContaComoAvaliado: true,
        proveniencia: "politica-de-parcial-nao-aprovada-AUTH-CLINSAFETY",
      }),
    ).toBe(true);
  });
});

describe("convenção de dia — não ratificada, mas explícita e correta", () => {
  it("dia civil local difere do dia UTC perto da meia-noite (fuso -03:00)", () => {
    // 2026-08-11T02:00Z = 2026-08-10T23:00 local: dia civil local é 10, não 11.
    expect(chaveDeDia("2026-08-11T02:00:00.000Z", CONVENCAO_CIVIL)).toBe("2026-08-10");
    expect(chaveDeDia("2026-08-11T02:00:00.000Z", CONVENCAO_7_AS_7)).toBe("2026-08-10");
  });

  it("a convenção 7-às-7 joga a madrugada para o dia anterior", () => {
    // 05:00 local do dia 11 pertence ao dia 10 sob 7-às-7, e ao 11 no dia civil.
    const utc = utcLocal("2026-08-11", 5);
    expect(chaveDeDia(utc, CONVENCAO_CIVIL)).toBe("2026-08-11");
    expect(chaveDeDia(utc, CONVENCAO_7_AS_7)).toBe("2026-08-10");
  });

  it("instanteLocal converte para o fuso declarado, nunca para UTC implícito", () => {
    const local = instanteLocal("2026-08-10T15:30:00.000Z", FUSO_SINTETICO);
    expect(local).toEqual({ data: "2026-08-10", hora: 12, minuto: 30 });
  });

  it("enumerarDias cobre o intervalo inclusive e atravessa o mês", () => {
    expect(enumerarDias("2026-08-30", "2026-09-02")).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ]);
    expect(enumerarDias("2026-08-30", "2026-08-29")).toEqual([]);
  });
});

describe("parametrosDeInstrumentacao — turnos cobrem 24 h exatamente uma vez", () => {
  const base = {
    convencaoDeDia: CONVENCAO_CIVIL,
    politicaDeParcial: POLITICA_DE_PARCIAL_CONSERVADORA,
  };

  it("aceita a cobertura completa e resolve o turno de um instante", () => {
    const parametros = parametrosDeInstrumentacao({ ...base, turnos: [...TURNOS_SINTETICOS] });
    expect(turnoDe(utcLocal("2026-08-10", 9), parametros)).toBe("manha");
    expect(turnoDe(utcLocal("2026-08-10", 18), parametros)).toBe("tarde");
    expect(turnoDe(utcLocal("2026-08-10", 2), parametros)).toBe("noite");
  });

  it("recusa hora descoberta — alerta sem turno seria silêncio", () => {
    expect(() =>
      parametrosDeInstrumentacao({
        ...base,
        turnos: [
          { id: "manha", horaInicio: 7, horaFim: 15 },
          { id: "tarde", horaInicio: 15, horaFim: 23 },
        ],
      }),
    ).toThrow(/horas descobertas/);
  });

  it("recusa hora em mais de um turno", () => {
    expect(() =>
      parametrosDeInstrumentacao({
        ...base,
        turnos: [
          { id: "a", horaInicio: 0, horaFim: 0 },
          { id: "b", horaInicio: 7, horaFim: 15 },
        ],
      }),
    ).toThrow(/mais de um turno/);
  });

  it("recusa hora de corte fora de 0..23 e fuso vazio", () => {
    expect(() =>
      parametrosDeInstrumentacao({
        ...base,
        convencaoDeDia: { ...CONVENCAO_CIVIL, horaDeCorte: 24 },
        turnos: [...TURNOS_SINTETICOS],
      }),
    ).toThrow(/hora de corte/);
    expect(() =>
      parametrosDeInstrumentacao({
        ...base,
        convencaoDeDia: { ...CONVENCAO_CIVIL, fusoHorario: "  " },
        turnos: [...TURNOS_SINTETICOS],
      }),
    ).toThrow(/fuso horário/);
  });
});

describe("janela e instantes declarados", () => {
  const janela = criarJanela("2026-08-10T00:00:00.000Z", "2026-08-11T00:00:00.000Z");

  it("recusa janela vazia ou invertida", () => {
    // O NOME promete a regra de ORDENAÇÃO da janela, e `.toThrow()` sem tipo
    // não verificava isso. `criarJanela` (`tipos.ts`) tem TRÊS saídas de erro:
    // `TypeError` quando `Date.parse` falha no início, `TypeError` quando falha
    // no fim, e `RangeError` só quando `fim <= inicio`. Um único caractere a
    // mais num literal de data abaixo tornaria a data impassável, trocando a
    // recusa medida por falha de parse — e o teste seguiria VERDE medindo outra
    // coisa. `RangeError` é o discriminador: `TypeError` não é instância dele.
    //
    // Os instantes na mensagem distinguem os dois casos; sem eles, as duas
    // asserções seriam idênticas e a "vazia" poderia ser satisfeita pelo
    // caminho da "invertida". Os literais abaixo são cópia verbatim dos
    // argumentos já usados no teste — nenhuma janela nova é declarada aqui.
    const invertida = capturarErro(() =>
      criarJanela("2026-08-11T00:00:00.000Z", "2026-08-10T00:00:00.000Z"),
    );
    expect(invertida).toBeInstanceOf(RangeError);
    expect((invertida as Error).message).toMatch(
      /janela vazia ou invertida: 2026-08-11T00:00:00\.000Z.*2026-08-10T00:00:00\.000Z/,
    );

    const vazia = capturarErro(() =>
      criarJanela("2026-08-10T00:00:00.000Z", "2026-08-10T00:00:00.000Z"),
    );
    expect(vazia).toBeInstanceOf(RangeError);
    expect((vazia as Error).message).toMatch(
      /janela vazia ou invertida: 2026-08-10T00:00:00\.000Z.*2026-08-10T00:00:00\.000Z/,
    );
  });

  it("fim é exclusivo e instante ausente NUNCA está dentro da janela", () => {
    expect(dentroDaJanela(instantePresente("2026-08-10T00:00:00.000Z"), janela)).toBe(true);
    expect(dentroDaJanela(instantePresente("2026-08-11T00:00:00.000Z"), janela)).toBe(false);
    expect(dentroDaJanela(instanteAusente("fonte-nao-enviou"), janela)).toBe(false);
  });
});

describe("Completude — o companheiro DC(K) de §2.2", () => {
  it("sem elegíveis a fração é null — nunca 0, nunca 1", () => {
    const dc = montarCompletude({ elegiveis: 0, computaveis: 0, motivosDeExclusao: [] });
    expect(dc.fracaoComputavel).toBeNull();
    expect(dc.pisoDeCompletude).toBe("NAO_RATIFICADO_AUTH_CLINSAFETY");
  });

  it("registra os excluídos por motivo legível por máquina", () => {
    const dc = montarCompletude({
      elegiveis: 10,
      computaveis: 6,
      motivosDeExclusao: contarPorChave([
        "sem-avaliacao-no-dia",
        "sem-avaliacao-no-dia",
        "invalido",
      ]),
    });
    expect(dc.excluidos).toBe(4);
    expect(dc.fracaoComputavel).toBeCloseTo(0.6);
    expect(dc.motivosDeExclusao).toEqual([
      { chave: "invalido", contagem: 1 },
      { chave: "sem-avaliacao-no-dia", contagem: 2 },
    ]);
  });
});

describe("chaveDeVersao", () => {
  it("versão ausente tem chave própria — jamais herda a versão presente", () => {
    expect(chaveDeVersao({ tipo: "declarada", ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" })).toBe(
      "RULE-NEWS2@0.2.0",
    );
    expect(chaveDeVersao({ tipo: "ausente", motivo: "x" })).toBe("versao-de-regra-ausente");
  });
});
