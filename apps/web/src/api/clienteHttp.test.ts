/**
 * Testes dos mapeamentos PUROS do cliente HTTP real (contrato → domínio da
 * UI) — sem rede. O comportamento de fetch em si é coberto pelo E2E de
 * `apps/api`; aqui garante-se que nenhuma tradução inventa normalidade
 * (HAZ-0005) e que os identificadores de estado casam com a linguagem da
 * UI (ADR-0021 F1).
 */
import { describe, expect, it } from "vitest";
import type { EntradaGradeLeitos, ResultadoAvaliacao } from "@intensicare/contratos";
import {
  mapearAvaliacao,
  mapearBanda,
  mapearEntradaGrade,
  mapearEstadoItem,
  mapearFrescorParametro,
  mapearParametro,
  mapearStatusAvaliacao,
} from "./clienteHttp.js";

describe("mapeamento de status de avaliação (contrato → UI)", () => {
  it("cobre os cinco estados da ADR-0008 sem inventar normalidade", () => {
    expect(mapearStatusAvaliacao("valido")).toBe("valida");
    expect(mapearStatusAvaliacao("parcial")).toBe("parcial");
    expect(mapearStatusAvaliacao("indisponivel")).toBe("nao_avaliada");
    expect(mapearStatusAvaliacao("desatualizado")).toBe("desatualizada");
    expect(mapearStatusAvaliacao("invalido")).toBe("invalida");
  });

  it("banda: normal→baixo, atencao→medio, alerta→alto, critico→critico; null permanece null", () => {
    expect(mapearBanda("normal")).toBe("baixo");
    expect(mapearBanda("atencao")).toBe("medio");
    expect(mapearBanda("alerta")).toBe("alto");
    expect(mapearBanda("critico")).toBe("critico");
    expect(mapearBanda(null)).toBeNull();
  });

  it("parâmetros do contrato mapeiam para os sete ParametroId da UI", () => {
    expect(mapearParametro("FR")).toBe("frequencia_respiratoria");
    expect(mapearParametro("SpO2")).toBe("saturacao_oxigenio");
    expect(mapearParametro("FluxoO2")).toBe("uso_oxigenio_suplementar");
    expect(mapearParametro("PAS")).toBe("pressao_arterial_sistolica");
    expect(mapearParametro("FC")).toBe("frequencia_cardiaca");
    expect(mapearParametro("NivelConsciencia")).toBe("nivel_consciencia");
    expect(mapearParametro("Temperatura")).toBe("temperatura");
  });

  it("frescor de parâmetro: fail-closed visível (ausente/expirado/invalido), nunca 'atual' por omissão", () => {
    expect(mapearFrescorParametro("valid")).toBe("atual");
    expect(mapearFrescorParametro("missing")).toBe("ausente");
    expect(mapearFrescorParametro("missing_clinical_time")).toBe("ausente");
    expect(mapearFrescorParametro("stale")).toBe("desatualizado");
    expect(mapearFrescorParametro("expired")).toBe("expirado");
    expect(mapearFrescorParametro("invalid")).toBe("invalido");
    expect(mapearFrescorParametro(undefined)).toBe("ausente");
  });

  it("estado do item de trabalho troca hífen por sublinhado (contrato → UI)", () => {
    expect(mapearEstadoItem("nao-atribuido")).toBe("nao_atribuido");
    expect(mapearEstadoItem("reconhecido")).toBe("reconhecido");
  });
});

describe("mapeamento de avaliação completa", () => {
  const naoComputavel: ResultadoAvaliacao = {
    status: "indisponivel",
    parametrosAusentes: ["SpO2"],
    parametros: [
      {
        parametro: "SpO2",
        presente: false,
        statusParametro: "missing",
        motivo: "missing_required_input:spo2",
        coletadoEm: null,
        explicacao: "SpO2 ausente — ausência nunca é tratada como normal.",
      },
    ],
    escore: null,
    banda: null,
    avaliadoEm: "2026-08-16T12:00:00.000Z",
    motivos: ["missing_required_input:spo2"],
    anotacoes: [],
    explicacao: "NEWS2 não avaliado — a ausência de pontuação não significa normalidade.",
    parametroVermelho: false,
    versaoRegra: "RULE-NEWS2@0.2.0",
  };

  it("avaliação não computável vira 'nao_avaliada' com total/banda null e insumo ausente DECLARADO", () => {
    const avaliacao = mapearAvaliacao(naoComputavel);
    expect(avaliacao.estadoAvaliacao).toBe("nao_avaliada");
    expect(avaliacao.news2Total).toBeNull();
    expect(avaliacao.bandaRisco).toBeNull();
    expect(avaliacao.insumosAusentes).toEqual(["saturacao_oxigenio"]);
    expect(avaliacao.contribuicoes[0]?.valorObservado).toBeNull();
    expect(avaliacao.contribuicoes[0]?.frescor).toBe("ausente");
    expect(avaliacao.versaoRegra).toBe("RULE-NEWS2@0.2.0");
  });
});

describe("mapeamento de entrada da grade", () => {
  it("leito vago mapeia sem paciente e sem avaliação — nunca um 'normal' inventado", () => {
    const vago: EntradaGradeLeitos = {
      leitoId: "SYNTH-LEITO-03",
      encontroId: null,
      pacienteRef: null,
      escore: null,
      banda: null,
      statusAvaliacao: null,
      frescor: "desatualizado",
      atualizadoEm: null,
      alerta: null,
    };
    const item = mapearEntradaGrade(vago);
    expect(item.pacienteRef).toBeNull();
    expect(item.avaliacao).toBeNull();
    expect(item.alertas).toEqual([]);
  });

  it("leito em alerta carrega o alerta com versão (If-Match) e severidade mapeada", () => {
    const emAlerta: EntradaGradeLeitos = {
      leitoId: "SYNTH-LEITO-02",
      encontroId: "SYNTH-ENC-P002",
      pacienteRef: "amh:psr:v1:SYNTH-P002",
      escore: 11,
      banda: "critico",
      statusAvaliacao: "valido",
      frescor: "atual",
      atualizadoEm: "2026-08-16T12:00:00.000Z",
      alerta: { id: "SYNTH-ALERTA-1", estado: "nao-atribuido", versao: 0 },
    };
    const item = mapearEntradaGrade(emAlerta);
    expect(item.avaliacao?.estadoAvaliacao).toBe("valida");
    expect(item.avaliacao?.news2Total).toBe(11);
    expect(item.avaliacao?.bandaRisco).toBe("critico");
    expect(item.alertas[0]?.estado).toBe("nao_atribuido");
    expect(item.alertas[0]?.versao).toBe(0);
    expect(item.pacienteApelido).toBe("Paciente SYNTH-P002");
  });
});
