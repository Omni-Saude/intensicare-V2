import { describe, expect, it } from "vitest";
import {
  alertaSintetico,
  avaliacaoSintetica,
  ocupacaoSintetica,
  PARAMETROS_DIA_CIVIL,
  PARAMETROS_SETE_AS_SETE,
  REGRA_NEWS2,
  utcLocal,
} from "./apoio-de-teste.js";
import {
  type AlertaObservado,
  type AvaliacaoObservada,
  calcularCargaDeAlarmes,
  type EntradaDeCargaDeAlarmes,
  type OcupacaoObservada,
  tendenciaDaCarga,
} from "./carga-de-alarmes.js";
import { criarJanela, instanteAusente } from "./tipos.js";

const DIAS = ["2026-08-10", "2026-08-11", "2026-08-12"] as const;
const JANELA = criarJanela(utcLocal("2026-08-10", 0), utcLocal("2026-08-13", 0));

/** Dois encontros ocupando os três dias, com uma avaliação válida por dia. */
function baseSintetica(): {
  readonly ocupacoes: readonly OcupacaoObservada[];
  readonly avaliacoes: readonly AvaliacaoObservada[];
} {
  const encontros = ["SYNTH-ENC-01", "SYNTH-ENC-02"];
  return {
    ocupacoes: encontros.map((encontroId) =>
      ocupacaoSintetica({ encontroId, admissaoUtc: utcLocal("2026-08-10", 0) }),
    ),
    avaliacoes: encontros.flatMap((encontroId) =>
      DIAS.map((dia) =>
        avaliacaoSintetica({ id: `${encontroId}-${dia}`, encontroId, utc: utcLocal(dia, 12) }),
      ),
    ),
  };
}

function alertasCrescentes(): readonly AlertaObservado[] {
  // 2 alertas no dia 10, 4 no dia 11, 8 no dia 12 — carga por paciente-dia
  // avaliado sobe de 1 para 2 para 4 (2 paciente-dias avaliados por dia).
  const porDia: Readonly<Record<string, number>> = {
    "2026-08-10": 2,
    "2026-08-11": 4,
    "2026-08-12": 8,
  };
  return DIAS.flatMap((dia) =>
    Array.from({ length: porDia[dia] ?? 0 }, (_, i) =>
      alertaSintetico({
        id: `SYNTH-ALERTA-${dia}-${i}`,
        encontroId: i % 2 === 0 ? "SYNTH-ENC-01" : "SYNTH-ENC-02",
        utc: utcLocal(dia, 9 + (i % 12)),
        severidade: i % 3 === 0 ? "critico" : "alerta",
        regra: REGRA_NEWS2,
      }),
    ),
  );
}

function entrada(sobrescrever: Partial<EntradaDeCargaDeAlarmes> = {}): EntradaDeCargaDeAlarmes {
  const base = baseSintetica();
  return {
    janela: JANELA,
    parametros: PARAMETROS_DIA_CIVIL,
    ocupacoes: base.ocupacoes,
    avaliacoes: base.avaliacoes,
    alertas: [],
    ...sobrescrever,
  };
}

describe("carga de alarmes — denominador de paciente-dia", () => {
  it("expande ocupação em curso até o fim da janela, um paciente-dia por dia", () => {
    const carga = calcularCargaDeAlarmes(entrada());
    expect(carga.agregado.pacienteDiasOcupados).toBe(6);
    expect(carga.agregado.pacienteDiasAvaliados).toBe(6);
    expect(carga.porDia.map((d) => d.chave)).toEqual([...DIAS]);
  });

  it("paciente-dia sem avaliação sai dos DOIS lados e aparece no companheiro", () => {
    const base = baseSintetica();
    const carga = calcularCargaDeAlarmes(
      entrada({
        // remove todas as avaliações do dia 11
        avaliacoes: base.avaliacoes.filter((a) => !a.avaliacaoId.endsWith("2026-08-11")),
      }),
    );
    expect(carga.agregado.pacienteDiasOcupados).toBe(6);
    expect(carga.agregado.pacienteDiasAvaliados).toBe(4);
    const dia11 = carga.porDia.find((d) => d.chave === "2026-08-11");
    expect(dia11?.taxa.tipo).toBe("nao_computavel");
    expect(dia11?.taxa.completude.motivosDeExclusao).toEqual([
      { chave: "sem-avaliacao-no-dia", contagem: 2 },
    ]);
  });

  it("zero alerta sobre tempo NÃO avaliado é 'não computável', jamais carga zero", () => {
    const carga = calcularCargaDeAlarmes(entrada({ avaliacoes: [], alertas: [] }));
    expect(carga.agregado.taxa.tipo).toBe("nao_computavel");
    if (carga.agregado.taxa.tipo === "nao_computavel") {
      expect(carga.agregado.taxa.motivo).toContain("nunca carga zero");
    }
    expect(carga.agregado.pacienteDiasOcupados).toBe(6);
  });

  it("estado não reconhecido NÃO conta como avaliado (fail-closed)", () => {
    const carga = calcularCargaDeAlarmes(
      entrada({
        avaliacoes: [
          avaliacaoSintetica({
            id: "a1",
            encontroId: "SYNTH-ENC-01",
            utc: utcLocal("2026-08-10", 12),
            estadoBruto: "normal",
          }),
        ],
      }),
    );
    expect(carga.agregado.pacienteDiasAvaliados).toBe(0);
    expect(carga.agregado.taxa.completude.motivosDeExclusao).toContainEqual({
      chave: "estado-nao-computavel:nao_reconhecido",
      contagem: 1,
    });
  });

  it("âncora de admissão/alta ausente não produz paciente-dia e vira série própria", () => {
    const carga = calcularCargaDeAlarmes(
      entrada({
        ocupacoes: [
          {
            encontroId: "SYNTH-ENC-09",
            unidadeId: "SYNTH-UTI-01",
            admissao: instanteAusente("fonte-nao-enviou-admissao"),
            fim: { tipo: "em_curso" },
          },
          {
            encontroId: "SYNTH-ENC-10",
            unidadeId: "SYNTH-UTI-01",
            admissao: { tipo: "presente", utc: utcLocal("2026-08-10", 0) },
            fim: { tipo: "ausente", motivo: "alta-implausivel" },
          },
        ],
        avaliacoes: [],
      }),
    );
    expect(carga.agregado.pacienteDiasOcupados).toBe(0);
    expect(carga.ocupacoesExcluidas).toEqual([
      { chave: "ancora-de-admissao-ausente:fonte-nao-enviou-admissao", contagem: 1 },
      { chave: "ancora-de-alta-ausente-ou-invalida:alta-implausivel", contagem: 1 },
    ]);
  });
});

describe("carga de alarmes — numerador e recortes obrigatórios de SM-04", () => {
  it("produz os quatro recortes (severidade, unidade, turno, versão de regra)", () => {
    const carga = calcularCargaDeAlarmes(entrada({ alertas: alertasCrescentes() }));
    expect(carga.agregado.alertasNoNumerador).toBe(14);
    expect(carga.porSeveridade.map((s) => s.chave).sort()).toEqual(["alerta", "critico"]);
    expect(carga.porUnidade.map((u) => u.chave)).toEqual(["SYNTH-UTI-01"]);
    expect(carga.porTurno.length).toBeGreaterThan(0);
    expect(carga.porVersaoDeRegra).toEqual([{ chave: "RULE-NEWS2@0.2.0", contagem: 14 }]);
    expect(carga.defeitosDeRelatorio).toEqual([]);
  });

  it("declara defeito de relatório quando a versão de regra não está atribuída", () => {
    const semVersao = alertasCrescentes().map((a) => ({
      ...a,
      regra: { tipo: "ausente" as const, motivo: "sem-atribuicao-no-esquema" },
    }));
    const carga = calcularCargaDeAlarmes(entrada({ alertas: semVersao }));
    expect(carga.porVersaoDeRegra).toEqual([{ chave: "versao-de-regra-ausente", contagem: 14 }]);
    expect(carga.defeitosDeRelatorio).toHaveLength(1);
    expect(carga.defeitosDeRelatorio[0]).toContain("INDISPONÍVEL");
  });

  it("alerta em paciente-dia não avaliado sai do numerador e é reportado", () => {
    const base = baseSintetica();
    const carga = calcularCargaDeAlarmes(
      entrada({
        avaliacoes: base.avaliacoes.filter((a) => !a.avaliacaoId.endsWith("2026-08-11")),
        alertas: [
          alertaSintetico({
            id: "SYNTH-ALERTA-X",
            encontroId: "SYNTH-ENC-01",
            utc: utcLocal("2026-08-11", 10),
          }),
        ],
      }),
    );
    expect(carga.agregado.alertasNoNumerador).toBe(0);
    expect(carga.agregado.alertasObservados).toBe(1);
    expect(carga.alertasForaDoNumerador).toEqual([
      { chave: "paciente-dia-nao-avaliado:sem-avaliacao-no-dia", contagem: 1 },
    ]);
  });

  it("alerta sem instante de criação não é descartado — vira balde com motivo", () => {
    const carga = calcularCargaDeAlarmes(
      entrada({
        alertas: [
          alertaSintetico({
            id: "SYNTH-ALERTA-Y",
            encontroId: "SYNTH-ENC-01",
            motivoDeAusencia: "fonte-nao-enviou-raised-at",
          }),
        ],
      }),
    );
    expect(carga.alertasForaDoNumerador).toEqual([
      { chave: "instante-de-criacao-ausente:fonte-nao-enviou-raised-at", contagem: 1 },
    ]);
  });

  it("o balde de unidade não atribuída é explícito (KPI-DASH-04, P-8)", () => {
    const carga = calcularCargaDeAlarmes(
      entrada({
        ocupacoes: [
          ocupacaoSintetica({
            encontroId: "SYNTH-ENC-03",
            unidadeId: null,
            admissaoUtc: utcLocal("2026-08-10", 0),
          }),
        ],
        avaliacoes: [
          avaliacaoSintetica({
            id: "a",
            encontroId: "SYNTH-ENC-03",
            utc: utcLocal("2026-08-10", 12),
          }),
        ],
        alertas: [],
      }),
    );
    expect(carga.porUnidade.map((u) => u.chave)).toContain("unidade-nao-atribuida");
  });
});

describe("carga de alarmes — série de supressão (SAF-0019)", () => {
  it("supressão NÃO instrumentada é distinta de zero supressões", () => {
    const semSerie = calcularCargaDeAlarmes(entrada());
    expect(semSerie.supressao.tipo).toBe("nao_instrumentada");

    const comSerie = calcularCargaDeAlarmes(entrada({ supressoes: [] }));
    expect(comSerie.supressao).toEqual({ tipo: "observada", total: 0, porMotivo: [] });
  });

  it("conta supressões observadas por motivo", () => {
    const carga = calcularCargaDeAlarmes(
      entrada({
        supressoes: [
          {
            encontroId: "SYNTH-ENC-01",
            instante: { tipo: "presente", utc: utcLocal("2026-08-10", 10) },
            motivo: "cooldown",
          },
          {
            encontroId: "SYNTH-ENC-01",
            instante: { tipo: "presente", utc: utcLocal("2026-08-10", 11) },
            motivo: "cooldown",
          },
          {
            encontroId: "SYNTH-ENC-02",
            instante: { tipo: "presente", utc: utcLocal("2026-08-11", 11) },
            motivo: "deduplicacao",
          },
        ],
      }),
    );
    expect(carga.supressao).toEqual({
      tipo: "observada",
      total: 3,
      porMotivo: [
        { chave: "cooldown", contagem: 2 },
        { chave: "deduplicacao", contagem: 1 },
      ],
    });
  });
});

describe("CASO EXIGIDO — a carga de alarmes CRESCE ao longo dos dias", () => {
  it("mede taxa crescente por paciente-dia avaliado sem emitir juízo de bom/ruim", () => {
    const carga = calcularCargaDeAlarmes(entrada({ alertas: alertasCrescentes() }));

    const taxas = carga.porDia.map((d) =>
      d.taxa.tipo === "computada" ? d.taxa.alertasPorPacienteDiaAvaliado : null,
    );
    expect(taxas).toEqual([1, 2, 4]);

    const tendencia = tendenciaDaCarga(carga);
    expect(tendencia.tipo).toBe("serie");
    if (tendencia.tipo === "serie") {
      expect(tendencia.direcao).toBe("crescente");
      expect(tendencia.primeira).toBe(1);
      expect(tendencia.ultima).toBe(4);
      expect(tendencia.variacaoAbsoluta).toBe(3);
      expect(tendencia.diasComputaveis).toBe(3);
    }

    // A taxa agregada nunca aparece sem o companheiro de completude.
    expect(carga.agregado.taxa.tipo).toBe("computada");
    expect(carga.agregado.taxa.completude.fracaoComputavel).toBe(1);
    expect(carga.agregado.taxa.completude.pisoDeCompletude).toBe("NAO_RATIFICADO_AUTH_CLINSAFETY");
  });

  it("abaixo do n mínimo a tendência é 'amostra_insuficiente', NUNCA 'estável'", () => {
    const carga = calcularCargaDeAlarmes(entrada({ alertas: alertasCrescentes() }));
    const tendencia = tendenciaDaCarga(carga, 10);
    expect(tendencia.tipo).toBe("amostra_insuficiente");
    if (tendencia.tipo === "amostra_insuficiente") {
      expect(tendencia.diasComputaveis).toBe(3);
      expect(tendencia.nMinimo).toBe(10);
    }
  });
});

describe("a convenção de dia declarada muda o resultado — e viaja com ele", () => {
  it("um alerta às 05:00 locais cai em dias diferentes sob dia civil e sob 7-às-7", () => {
    const alerta = alertaSintetico({
      id: "SYNTH-ALERTA-MADRUGADA",
      encontroId: "SYNTH-ENC-01",
      utc: utcLocal("2026-08-11", 5),
    });
    const civil = calcularCargaDeAlarmes(entrada({ alertas: [alerta] }));
    const seteAsSete = calcularCargaDeAlarmes(
      entrada({ parametros: PARAMETROS_SETE_AS_SETE, alertas: [alerta] }),
    );

    const diaCivil = civil.porDia.find((d) => d.alertasNoNumerador > 0)?.chave;
    const dia7 = seteAsSete.porDia.find((d) => d.alertasNoNumerador > 0)?.chave;
    expect(diaCivil).toBe("2026-08-11");
    expect(dia7).toBe("2026-08-10");

    expect(civil.parametros.convencaoDeDia.proveniencia).toBe(
      "convencao-de-dia-nao-ratificada-KPI-OPS-02",
    );
    expect(civil.politicaDeDiaParcial).toBe(
      "dia-parcial-conta-como-um-paciente-dia-VALIDATION-REQUIRED",
    );
  });
});
