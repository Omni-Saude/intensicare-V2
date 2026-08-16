/**
 * Testes das rotas `/v1/*` sobre a FIAÇÃO REAL (PGlite + kernel NEWS2 +
 * outbox + auditoria), via `fastify.inject` — sem porta de rede real. O
 * banco é semeado com o cenário sintético G7
 * (`@intensicare/fixtures-sinteticas`): todo id de encontro/leito/paciente
 * usado aqui vem do cenário, nunca é inventado.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  IDEMPOTENCY_REPLAYED_HEADER,
  type AvaliacoesPacienteResposta,
  type GradeLeitosResposta,
  type IngestaoObservacoesResposta,
  type ProblemDetailsConflitoVersao,
} from "@intensicare/contratos";
import { buildG7SyntheticScenario } from "@intensicare/fixtures-sinteticas";
import { buildServer } from "./index.js";
import { gerarTokenSintetico } from "./auth.js";

const scenario = buildG7SyntheticScenario();
const TENANT = scenario.organization.id; // SYNTH-TENANT-G7
const P001 = scenario.patients[0]!;
const ENC_P001 = scenario.encounters[0]!;
const P002 = scenario.patients[1]!;
const ENC_P002 = scenario.encounters[1]!;

const AUTH_A = { authorization: `Bearer ${gerarTokenSintetico(TENANT, "SYNTH-USER-A1")}` };
const AUTH_B = { authorization: `Bearer ${gerarTokenSintetico("SYNTH-TENANT-B", "SYNTH-USER-B1")}` };

// Tempo clínico SEMPRE posterior ao último instante das fixtures (11:30Z) e
// monotônico entre envelopes — evita conflito de duplicata entre testes e
// garante que a observação mais recente é a do teste, independentemente do
// relógio em que a suíte roda (tempo futuro tem idade 0 no kernel).
const FIXTURE_MAX_MS = Date.parse("2026-08-16T11:30:00.000Z");
let clinicalTimeCounter = 0;
function tempoClinicoFresco(): string {
  clinicalTimeCounter += 1;
  return new Date(Math.max(Date.now(), FIXTURE_MAX_MS) + clinicalTimeCounter * 60_000).toISOString();
}

/** Envelope completo (sete parâmetros) com valores de deterioração — NEWS2 real = 11 (banda critico). */
function envelopeCritico(overrides: Partial<Record<string, unknown>> = {}) {
  const t = tempoClinicoFresco();
  return {
    encontroId: ENC_P002.id,
    leitoId: ENC_P002.bedId,
    pacienteRef: P002.subjectRef,
    contexto: { idadeAnos: 62 },
    observacoes: [
      { parametro: "FR", valor: 26, unidade: "rpm", coletadoEm: t },
      { parametro: "SpO2", valor: 89, unidade: "%", coletadoEm: t },
      { parametro: "FluxoO2", valor: 0, unidade: "L/min", coletadoEm: t },
      { parametro: "PAS", valor: 92, unidade: "mmHg", coletadoEm: t },
      { parametro: "FC", valor: 122, unidade: "bpm", coletadoEm: t },
      { parametro: "NivelConsciencia", codigo: "A", coletadoEm: t },
      { parametro: "Temperatura", valor: 38.3, unidade: "Cel", coletadoEm: t },
    ],
    ...overrides,
  };
}

describe("rotas /v1 (fatia SPR-G7-2 — integração real: PGlite + kernel NEWS2)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  it("GET /v1/healthz responde 200 sem exigir autenticação", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/healthz" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("sem cabeçalho Authorization => 401, nunca 200", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/projecoes/grade-leitos" });
    expect(response.statusCode).toBe(401);
  });

  describe("caminho feliz: ingestão real → avaliação NEWS2 → alerta durável → reconhecer", () => {
    let alertaId: string;

    it("ingestão com série completa produz avaliação valido/critico (kernel real) e alerta 'nao-atribuido' v0", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH_A, "idempotency-key": "SYNTH-IDEM-FELIZ-01" },
        payload: envelopeCritico(),
      });
      expect(resposta.statusCode).toBe(201);
      expect(resposta.headers[IDEMPOTENCY_REPLAYED_HEADER.toLowerCase()]).toBe("false");
      const corpo = resposta.json() as IngestaoObservacoesResposta;
      expect(corpo.quarentena).toEqual([]);
      expect(corpo.avaliacao.status).toBe("valido");
      expect(corpo.avaliacao.escore).toBe(11);
      expect(corpo.avaliacao.banda).toBe("critico");
      expect(corpo.avaliacao.versaoRegra).toBe("RULE-NEWS2@0.2.0");
      expect(corpo.alerta).not.toBeNull();
      expect(corpo.alerta?.estado).toBe("nao-atribuido");
      expect(corpo.alerta?.versao).toBe(0);
      alertaId = corpo.alerta?.id as string;
    });

    it("a projeção de grade de leitos (lida do banco) reflete escore, banda e alerta ativo", async () => {
      const resposta = await app.inject({ method: "GET", url: "/v1/projecoes/grade-leitos", headers: AUTH_A });
      expect(resposta.statusCode).toBe(200);
      const grade = resposta.json() as GradeLeitosResposta;
      // As fixtures têm 4 leitos; todos aparecem (ocupados e vagos).
      expect(grade.leitos).toHaveLength(4);
      const entrada = grade.leitos.find((l) => l.leitoId === ENC_P002.bedId);
      expect(entrada?.statusAvaliacao).toBe("valido");
      expect(entrada?.escore).toBe(11);
      expect(entrada?.banda).toBe("critico");
      expect(entrada?.frescor).toBe("atual");
      expect(entrada?.alerta?.id).toBe(alertaId);
    });

    it("reconhecer com If-Match=0 (versão de criação) transiciona atribuido→reconhecido (v2) com ator identificado", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaId}/reconhecer`,
        headers: { ...AUTH_A, "if-match": "0" },
        payload: { comentario: "ciência registrada em teste" },
      });
      expect(resposta.statusCode).toBe(200);
      const corpo = resposta.json() as { item: { estado: string; versao: number; reconhecidoPor: string } };
      expect(corpo.item.estado).toBe("reconhecido");
      // v2: atribuição implícita ao ator (assign, v1) + reconhecimento (v2) —
      // o grafo do ADR-0009 W1 não admite nao_atribuido→reconhecido direto.
      expect(corpo.item.versao).toBe(2);
      expect(corpo.item.reconhecidoPor).toBe("SYNTH-USER-A1");
    });

    it("reconhecer de novo (estado 'reconhecido' não admite 'reconhecer') => 409 transição inválida", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaId}/reconhecer`,
        headers: { ...AUTH_A, "if-match": "2" },
      });
      expect(resposta.statusCode).toBe(409);
      expect(resposta.headers["content-type"]).toContain("application/problem+json");
    });

    it("histórico de avaliações do paciente vem do banco, mais recente primeiro", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
        headers: AUTH_A,
      });
      expect(resposta.statusCode).toBe(200);
      const corpo = resposta.json() as AvaliacoesPacienteResposta;
      expect(corpo.avaliacoes.length).toBeGreaterThanOrEqual(1);
      expect(corpo.avaliacoes[0]?.banda).toBe("critico");
    });
  });

  describe("degradado: status explícito, nunca escore/banda normal por omissão (HAZ-0005)", () => {
    it("contexto ausente => idade desconhecida => 'indisponivel' com razão unknown_age; nunca presume adulto", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH_A, "idempotency-key": "SYNTH-IDEM-DEG-01" },
        payload: envelopeCritico({ contexto: undefined }),
      });
      expect(resposta.statusCode).toBe(201);
      const corpo = resposta.json() as IngestaoObservacoesResposta;
      expect(corpo.avaliacao.status).toBe("indisponivel");
      expect(corpo.avaliacao.status).not.toBe("parcial");
      expect(corpo.avaliacao.motivos).toContain("unknown_age");
      expect(corpo.avaliacao.escore).toBeNull();
      expect(corpo.avaliacao.banda).toBeNull();
      expect(corpo.alerta).toBeNull();
    });

    it("unidade inmapeável => 'invalido' fail-closed (insumo nunca descartado para salvar a avaliação)", async () => {
      // Usa o encontro de SYNTH-P001: o fato com unidade inmapeável fica
      // PERSISTIDO (append-only) e tornaria inválidas as avaliações
      // futuras deste encontro — por isso não polui o encontro de P002
      // usado pelos demais testes.
      const envelope = envelopeCritico({
        encontroId: ENC_P001.id,
        leitoId: ENC_P001.bedId,
        pacienteRef: P001.subjectRef,
      });
      (envelope.observacoes as Array<Record<string, unknown>>)[4] = {
        parametro: "FC",
        valor: 122,
        unidade: "batimentos",
        coletadoEm: (envelope.observacoes as Array<Record<string, unknown>>)[4]?.["coletadoEm"],
      };
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH_A, "idempotency-key": "SYNTH-IDEM-DEG-02" },
        payload: envelope,
      });
      expect(resposta.statusCode).toBe(201);
      const corpo = resposta.json() as IngestaoObservacoesResposta;
      expect(corpo.avaliacao.status).toBe("invalido");
      expect(corpo.avaliacao.motivos).toContain("unmappable_unit:pulse");
      expect(corpo.avaliacao.escore).toBeNull();
      expect(corpo.alerta).toBeNull();
    });

    it("observação com forma errada (NivelConsciencia numérico) vai para quarentena; o resto é processado", async () => {
      const envelope = envelopeCritico();
      (envelope.observacoes as Array<Record<string, unknown>>).push({
        parametro: "NivelConsciencia",
        valor: 15,
        unidade: "GCS",
        coletadoEm: tempoClinicoFresco(),
      });
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH_A, "idempotency-key": "SYNTH-IDEM-DEG-03" },
        payload: envelope,
      });
      expect(resposta.statusCode).toBe(201);
      const corpo = resposta.json() as IngestaoObservacoesResposta;
      expect(corpo.quarentena).toHaveLength(1);
      expect(corpo.aceitas).toHaveLength(7);
    });

    it("ingestão para encontro inexistente => 404 problem+json (indistinguível de cross-tenant)", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH_A, "idempotency-key": "SYNTH-IDEM-DEG-04" },
        payload: envelopeCritico({ encontroId: "SYNTH-ENC-INEXISTENTE" }),
      });
      expect(resposta.statusCode).toBe(404);
      expect(resposta.headers["content-type"]).toContain("application/problem+json");
    });
  });

  describe("degradado: tenant errado => nunca vaza existência cross-tenant", () => {
    it("grade de leitos do tenant B não contém NENHUM leito do tenant G7", async () => {
      const resposta = await app.inject({ method: "GET", url: "/v1/projecoes/grade-leitos", headers: AUTH_B });
      expect(resposta.statusCode).toBe(200);
      const grade = resposta.json() as GradeLeitosResposta;
      expect(grade.leitos).toHaveLength(0);
    });

    it("avaliações de paciente do tenant G7 consultadas pelo tenant B => 404", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
        headers: AUTH_B,
      });
      expect(resposta.statusCode).toBe(404);
    });

    it("eventos do tenant G7 não aparecem no fluxo do tenant B", async () => {
      const resposta = await app.inject({ method: "GET", url: "/v1/eventos/stream?cursor=0", headers: AUTH_B });
      expect(resposta.statusCode).toBe(200);
      expect(resposta.body).not.toContain("event:");
    });
  });

  describe("idempotência com hash do corpo (correção 4 da revisão única; draft IETF)", () => {
    const chave = "SYNTH-IDEM-HASH-01";
    let payloadOriginal: Record<string, unknown>;
    let alertaOriginal: string | undefined;

    it("primeira chamada => 201 com Idempotency-Replayed: false", async () => {
      payloadOriginal = envelopeCritico();
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH_A, "idempotency-key": chave },
        payload: payloadOriginal,
      });
      expect(resposta.statusCode).toBe(201);
      expect(resposta.headers[IDEMPOTENCY_REPLAYED_HEADER.toLowerCase()]).toBe("false");
      alertaOriginal = (resposta.json() as IngestaoObservacoesResposta).alerta?.id;
      expect(alertaOriginal).toBeTruthy();
    });

    it("replay com corpo IDÊNTICO => resposta original + Idempotency-Replayed: true, sem duplicar alerta", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH_A, "idempotency-key": chave },
        payload: payloadOriginal,
      });
      expect(resposta.statusCode).toBe(201);
      expect(resposta.headers[IDEMPOTENCY_REPLAYED_HEADER.toLowerCase()]).toBe("true");
      const corpo = resposta.json() as IngestaoObservacoesResposta;
      expect(corpo.alerta?.id).toBe(alertaOriginal);
    });

    it("replay com corpo DIVERGENTE => 422 problem+json pt-BR, nenhum efeito executado", async () => {
      const divergente = { ...payloadOriginal, pacienteRef: P002.subjectRef, contexto: { idadeAnos: 45 } };
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH_A, "idempotency-key": chave },
        payload: divergente,
      });
      expect(resposta.statusCode).toBe(422);
      expect(resposta.headers["content-type"]).toContain("application/problem+json");
      const problema = resposta.json() as { title: string; detail: string };
      expect(problema.title).toContain("Idempotency-Key");
      expect(problema.detail).toContain("corpo");
    });

    it("POST sem Idempotency-Key responde 400 problem+json, sem processar a ingestão", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: AUTH_A,
        payload: envelopeCritico(),
      });
      expect(resposta.statusCode).toBe(400);
      expect(resposta.headers["content-type"]).toContain("application/problem+json");
    });
  });

  describe("concorrência: reconhecer com If-Match ausente/errado (ADR-0009 Q2-A; HAZ-0023)", () => {
    let alertaId: string;

    beforeAll(async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH_A, "idempotency-key": "SYNTH-IDEM-CONC-01" },
        payload: envelopeCritico(),
      });
      alertaId = String((resposta.json() as IngestaoObservacoesResposta).alerta?.id);
    });

    it("If-Match ausente => 428", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaId}/reconhecer`,
        headers: AUTH_A,
      });
      expect(resposta.statusCode).toBe(428);
    });

    it("If-Match com versão divergente => 412 com estado corrente no corpo, nunca sobrescreve silenciosamente", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaId}/reconhecer`,
        headers: { ...AUTH_A, "if-match": "99" },
      });
      expect(resposta.statusCode).toBe(412);
      const corpo = resposta.json() as ProblemDetailsConflitoVersao;
      expect(corpo.versaoAtual).toBe(0);
      expect(corpo.estadoAtual).toBe("nao-atribuido");
    });

    it("reconhecer de outro tenant => 404, não 200 (RLS nega a linha)", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaId}/reconhecer`,
        headers: { ...AUTH_B, "if-match": "0" },
      });
      expect(resposta.statusCode).toBe(404);
    });

    it("alerta inexistente => 404 mesmo com If-Match presente", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/alertas/SYNTH-ALERTA-inexistente/reconhecer",
        headers: { ...AUTH_A, "if-match": "0" },
      });
      expect(resposta.statusCode).toBe(404);
    });
  });

  describe("GET /v1/eventos/stream — replay do OUTBOX real por cursor", () => {
    it("retorna os eventos do outbox (ingestão, avaliação, alerta) em text/event-stream", async () => {
      const resposta = await app.inject({ method: "GET", url: "/v1/eventos/stream?cursor=0", headers: AUTH_A });
      expect(resposta.statusCode).toBe(200);
      expect(resposta.headers["content-type"]).toContain("text/event-stream");
      expect(resposta.body).toContain("event: observacao-clinica-registrada");
      expect(resposta.body).toContain("event: observacoes-ingeridas");
      expect(resposta.body).toContain("event: avaliacao-computada");
      expect(resposta.body).toContain("event: alerta-criado");
      expect(resposta.body).toContain("event: alerta-atualizado");
    });

    it("cursor além do último evento => corpo sem eventos", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/v1/eventos/stream?cursor=999999",
        headers: AUTH_A,
      });
      expect(resposta.statusCode).toBe(200);
      expect(resposta.body).not.toContain("event:");
    });
  });
});
