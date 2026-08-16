import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_REPLAYED_HEADER,
  IF_MATCH_HEADER,
  PROBLEM_JSON_MIME_TYPE,
  packageVersion,
  type AvaliacoesPacienteResposta,
  type EntradaGradeLeitos,
  type EstadoItemTrabalho,
  type EventoFluxo,
  type GradeLeitosResposta,
  type HealthzResposta,
  type IngestaoObservacoesRequisicao,
  type IngestaoObservacoesResposta,
  type ItemTrabalho,
  type ObservacaoEmQuarentena,
  type ProblemDetails,
  type ProblemDetailsConflitoVersao,
  type ReconhecerAlertaRequisicao,
  type ReconhecerAlertaResposta,
  type ResultadoAvaliacao,
} from "./index.js";

// Caminho do YAML relativo a este arquivo de teste (packages/contratos/src/../openapi.yaml).
const openapiPath = fileURLToPath(new URL("../openapi.yaml", import.meta.url));

describe("@intensicare/contratos (fundação executável)", () => {
  it("exporta uma versão de pacote não vazia", () => {
    expect(packageVersion).toBe("0.0.0");
  });

  it("declara as convenções mínimas de erro, idempotência e concorrência", () => {
    expect(IDEMPOTENCY_KEY_HEADER).toBe("Idempotency-Key");
    expect(IDEMPOTENCY_REPLAYED_HEADER).toBe("Idempotency-Replayed");
    expect(IF_MATCH_HEADER).toBe("If-Match");
    expect(PROBLEM_JSON_MIME_TYPE).toBe("application/problem+json");

    const problem: ProblemDetails = {
      type: "about:blank",
      title: "Erro de exemplo",
      status: 500,
    };
    expect(problem.status).toBe(500);
  });
});

describe("tipos do contrato SPR-G7-2 (checagem de forma em tempo de compilação + amostra em runtime)", () => {
  it("ProblemDetailsConflitoVersao carrega versão e estado corrente para redecisão (ADR-0009 W3)", () => {
    const conflito: ProblemDetailsConflitoVersao = {
      type: "about:blank",
      title: "Conflito de versão",
      status: 412,
      versaoAtual: 3,
      estadoAtual: "reconhecido",
    };
    expect(conflito.versaoAtual).toBe(3);
  });

  it("IngestaoObservacoesRequisicao/Resposta usam apenas referências sintéticas (SYNTH-)", () => {
    const requisicao: IngestaoObservacoesRequisicao = {
      encontroId: "SYNTH-ENC-0001",
      leitoId: "SYNTH-LEITO-01",
      pacienteRef: "SYNTH-PSR-0001",
      observacoes: [
        { parametro: "FC", valor: 118, unidade: "bpm", coletadoEm: "2026-08-16T12:00:00Z" },
      ],
    };
    expect(requisicao.pacienteRef.startsWith("SYNTH-")).toBe(true);

    const quarentena: ObservacaoEmQuarentena = {
      entrada: { parametro: "desconhecido" },
      motivo: "parâmetro fora do catálogo aceito",
    };
    expect(quarentena.motivo.length).toBeGreaterThan(0);
  });

  it("ResultadoAvaliacao nunca produz escore/banda quando status != 'valido'", () => {
    const avaliacaoIndisponivel: ResultadoAvaliacao = {
      status: "indisponivel",
      parametrosAusentes: ["FC", "PAS", "SpO2"],
      parametros: [
        { parametro: "FC", presente: false, statusParametro: "missing", motivo: "missing_required_input:pulse" },
        { parametro: "PAS", presente: false, statusParametro: "missing", motivo: "missing_required_input:sbp" },
        { parametro: "SpO2", presente: false, statusParametro: "missing", motivo: "missing_required_input:spo2" },
      ],
      escore: null,
      banda: null,
      avaliadoEm: "2026-08-16T12:00:00Z",
      motivos: ["missing_required_input:pulse", "missing_required_input:sbp", "missing_required_input:spo2"],
      anotacoes: [],
      explicacao: "NEWS2 não avaliado — insumos obrigatórios ausentes; ausência nunca significa normalidade.",
      parametroVermelho: false,
      versaoRegra: "RULE-NEWS2@0.2.0",
    };
    expect(avaliacaoIndisponivel.escore).toBeNull();
    expect(avaliacaoIndisponivel.banda).toBeNull();
  });

  it("StatusAvaliacao espelha os cinco estados da ADR-0008 — 'parcial' reservado (inalcançável para NEWS2, N-8)", () => {
    const estados: ResultadoAvaliacao["status"][] = [
      "valido",
      "parcial",
      "indisponivel",
      "desatualizado",
      "invalido",
    ];
    expect(estados).toHaveLength(5);
  });

  it("EstadoItemTrabalho cobre os oito estados nucleares do ADR-0009 W1", () => {
    const estados: EstadoItemTrabalho[] = [
      "nao-atribuido",
      "atribuido",
      "reconhecido",
      "escalado",
      "sobreposto",
      "resolvido",
      "suprimido",
      "reaberto",
    ];
    expect(estados).toHaveLength(8);
  });

  it("ItemTrabalho e ReconhecerAlertaRequisicao/Resposta compõem coerentemente", () => {
    const item: ItemTrabalho = {
      id: "SYNTH-ALERTA-0001",
      estado: "reconhecido",
      versao: 2,
      tenantId: "SYNTH-TENANT-A",
      encontroId: "SYNTH-ENC-0001",
      leitoId: "SYNTH-LEITO-01",
      pacienteRef: "SYNTH-PSR-0001",
      escore: 7,
      banda: "alerta",
      motivo: "escore acima do limiar ilustrativo",
      criadoEm: "2026-08-16T12:00:00Z",
      atualizadoEm: "2026-08-16T12:05:00Z",
      reconhecidoPor: "SYNTH-USER-01",
      reconhecidoEm: "2026-08-16T12:05:00Z",
    };
    const requisicao: ReconhecerAlertaRequisicao = { comentario: "ciência registrada" };
    const resposta: ReconhecerAlertaResposta = { item };
    expect(resposta.item.versao).toBe(2);
    expect(requisicao.comentario).toBeDefined();
  });

  it("GradeLeitosResposta/EntradaGradeLeitos representam leito sem avaliação sem inventar normal", () => {
    const entradaSemAvaliacao: EntradaGradeLeitos = {
      leitoId: "SYNTH-LEITO-02",
      encontroId: null,
      pacienteRef: null,
      escore: null,
      banda: null,
      statusAvaliacao: null,
      frescor: "desatualizado",
      atualizadoEm: null,
      alerta: null,
    };
    const grade: GradeLeitosResposta = { leitos: [entradaSemAvaliacao] };
    expect(grade.leitos[0]?.banda).toBeNull();
  });

  it("AvaliacoesPacienteResposta, EventoFluxo e HealthzResposta têm a forma esperada", () => {
    const avaliacoes: AvaliacoesPacienteResposta = {
      pacienteRef: "SYNTH-PSR-0001",
      avaliacoes: [],
    };
    const evento: EventoFluxo = {
      sequencia: 1,
      tipo: "alerta-criado",
      tenantId: "SYNTH-TENANT-A",
      ocorridoEm: "2026-08-16T12:00:00Z",
      dados: { id: "SYNTH-ALERTA-0001" },
    };
    const saude: HealthzResposta = { status: "ok" };
    expect(avaliacoes.avaliacoes).toEqual([]);
    expect(evento.sequencia).toBe(1);
    expect(saude.status).toBe("ok");
  });

  it("IngestaoObservacoesResposta compõe avaliação e alerta opcional", () => {
    const resposta: IngestaoObservacoesResposta = {
      encontroId: "SYNTH-ENC-0001",
      recebidoEm: "2026-08-16T12:00:00Z",
      aceitas: [],
      quarentena: [],
      avaliacao: {
        // "indisponivel" (não "parcial"): parcial é reservado a classes 2+
        // do ADR-0026 e é inalcançável para NEWS2 (N-8/GDEC-0007).
        status: "indisponivel",
        parametrosAusentes: ["PAS"],
        parametros: [],
        escore: null,
        banda: null,
        avaliadoEm: "2026-08-16T12:00:00Z",
        motivos: ["missing_required_input:sbp"],
        anotacoes: [],
        explicacao: "NEWS2 não avaliado — PAS ausente; ausência nunca significa normalidade.",
        parametroVermelho: false,
        versaoRegra: "RULE-NEWS2@0.2.0",
      },
      alerta: null,
    };
    expect(resposta.alerta).toBeNull();
  });
});

describe("openapi.yaml (contrato legível por humanos e por gerador)", () => {
  const conteudo = readFileSync(openapiPath, "utf-8");

  it("declara OpenAPI 3.1 e os cinco caminhos exigidos pela tarefa mais o fluxo de eventos", () => {
    expect(conteudo).toContain("openapi: 3.1.0");
    expect(conteudo).toContain("/v1/ingestao/observacoes:");
    expect(conteudo).toContain("/v1/projecoes/grade-leitos:");
    expect(conteudo).toContain("/v1/pacientes/{pacienteRef}/avaliacoes:");
    expect(conteudo).toContain("/v1/alertas/{id}/reconhecer:");
    expect(conteudo).toContain("/v1/healthz:");
    expect(conteudo).toContain("/v1/eventos/stream:");
  });

  it("usa problem+json e cabeçalhos de idempotência/concorrência em pt-BR", () => {
    expect(conteudo).toContain("application/problem+json");
    expect(conteudo).toContain("Idempotency-Key");
    expect(conteudo).toContain("If-Match");
  });

  it("não contém nenhuma referência de paciente fora do padrão sintético SYNTH-", () => {
    const referenciasPaciente = conteudo.match(/pacienteRef:\s*SYNTH-[A-Za-z0-9-]+/g) ?? [];
    expect(referenciasPaciente.length).toBeGreaterThan(0);
    // Nenhuma linha de exemplo usa "amh:psr:v1:" seguido de algo que não seja SYNTH-.
    expect(conteudo).not.toMatch(/amh:psr:v1:(?!SYNTH-)[0-9a-fA-F-]{20,}/);
  });
});
