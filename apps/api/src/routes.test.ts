/**
 * Testes das rotas `/v1/*` sobre a FIAÇÃO REAL (PGlite + kernel NEWS2 +
 * outbox + auditoria), via `fastify.inject` — sem porta de rede real. O
 * banco é semeado com o cenário sintético G7
 * (`@intensicare/fixtures-sinteticas`): todo id de encontro/leito/paciente
 * usado aqui vem do cenário, nunca é inventado.
 *
 * EXCEÇÃO ao `inject`: o fluxo de eventos. `GET /v1/eventos/stream` deixou de
 * ser replay finito e passou a ser entrega CONTÍNUA (ADR-0011; o replay que
 * fechava a conexão após o catch-up era o anti-padrão §10-11). Uma conexão que
 * não termina não tem fim de corpo para `inject` esperar, então esses testes
 * abrem a porta real e leem um PREFIXO do fluxo — ver `lerPrefixoDoFluxo`.
 */

import { setTimeout as dormir } from "node:timers/promises";
import {
  type AvaliacoesPacienteResposta,
  type GradeLeitosResposta,
  IDEMPOTENCY_REPLAYED_HEADER,
  type IngestaoObservacoesResposta,
  type ProblemDetailsConflitoVersao,
} from "@intensicare/contratos";
import { buildG7SyntheticScenario } from "@intensicare/fixtures-sinteticas";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { gerarTokenSintetico } from "./auth.js";
import { buildServer } from "./index.js";

/**
 * Âncora de fim de catch-up. O servidor só emite `event: estado-conexao`
 * DEPOIS de drenar o backlog (`eventos/stream.ts`: `await this.#bombear()`
 * e então `#emitirEstado`). Ancorar nela é o que torna uma asserção de
 * AUSÊNCIA honesta.
 *
 * ACHADO P2 de revisão adversarial (2026-08-17): estas asserções paravam por
 * SILÊNCIO TEMPORAL (`ociosidadeMs`). Se o catch-up ficasse mais lento que a
 * janela — CPU concorrida, banco frio —, "nenhum evento do outro tenant"
 * passaria vacuamente, porque nada teria sido lido ainda. Silêncio não é
 * prova de ausência; o quadro de controle é.
 */
const FIM_DO_CATCHUP = "event: estado-conexao";
const catchUpConcluido = (texto: string): boolean => texto.includes(FIM_DO_CATCHUP);

/** Tipos de `EventoFluxo` do contrato — os únicos que o fluxo publica. */
const TIPOS_DE_EVENTO_DE_DOMINIO = [
  "observacao-clinica-registrada",
  "observacoes-ingeridas",
  "avaliacao-computada",
  "alerta-criado",
  "alerta-atualizado",
] as const;

interface PrefixoDeFluxo {
  readonly status: number;
  readonly contentType: string;
  readonly texto: string;
  /** `true` se o servidor fechou o corpo sozinho — o modo de falha antigo. */
  readonly encerrouSozinho: boolean;
}

/**
 * Abre o fluxo contínuo, acumula um PREFIXO e encerra do lado do cliente.
 *
 * Para quando `ate(texto)` fica verdadeiro, quando o servidor fecha o corpo ou
 * quando o fluxo fica em silêncio por `ociosidadeMs`. Afirmar ausência sobre
 * este prefixo é a mesma afirmação que as versões anteriores destes testes
 * faziam sobre o corpo finito do replay.
 */
async function lerPrefixoDoFluxo(
  base: string,
  headers: Record<string, string>,
  opcoes: {
    cursor?: number;
    ate?: (texto: string) => boolean;
    ociosidadeMs?: number;
    tetoMs?: number;
  } = {},
): Promise<PrefixoDeFluxo> {
  const controlador = new AbortController();
  const consulta = opcoes.cursor === undefined ? "" : `?cursor=${String(opcoes.cursor)}`;
  const resposta = await fetch(`${base}/v1/eventos/stream${consulta}`, {
    headers: { ...headers, accept: "text/event-stream" },
    signal: controlador.signal,
  });

  let texto = "";
  let encerrouSozinho = false;
  if (resposta.body !== null) {
    const leitor = resposta.body.getReader();
    const decodificador = new TextDecoder();
    const teto = Date.now() + (opcoes.tetoMs ?? 5_000);
    for (;;) {
      if (opcoes.ate?.(texto) === true) break;
      if (Date.now() > teto) break;
      const leitura = leitor
        .read()
        .catch(() => ({ done: true, value: undefined }) as ReadableStreamReadResult<Uint8Array>);
      const proximo = await Promise.race([
        leitura,
        dormir(opcoes.ociosidadeMs ?? 500).then(() => "ocioso" as const),
      ]);
      if (proximo === "ocioso") break;
      if (proximo.done) {
        encerrouSozinho = true;
        break;
      }
      texto += decodificador.decode(proximo.value, { stream: true });
    }
  }
  controlador.abort();

  return {
    status: resposta.status,
    contentType: resposta.headers.get("content-type") ?? "",
    texto,
    encerrouSozinho,
  };
}

const scenario = buildG7SyntheticScenario();
const TENANT = scenario.organization.id; // SYNTH-TENANT-G7
const P001 = scenario.patients[0]!;
const ENC_P001 = scenario.encounters[0]!;
const P002 = scenario.patients[1]!;
const ENC_P002 = scenario.encounters[1]!;

const AUTH_A = { authorization: `Bearer ${gerarTokenSintetico(TENANT, "SYNTH-USER-A1")}` };
const AUTH_B = {
  authorization: `Bearer ${gerarTokenSintetico("SYNTH-TENANT-B", "SYNTH-USER-B1")}`,
};

// Tempo clínico SEMPRE posterior ao último instante das fixtures (11:30Z) e
// monotônico entre envelopes — evita conflito de duplicata entre testes e
// garante que a observação mais recente é a do teste, independentemente do
// relógio em que a suíte roda (tempo futuro tem idade 0 no kernel).
const FIXTURE_MAX_MS = Date.parse("2026-08-16T11:30:00.000Z");
let clinicalTimeCounter = 0;
function tempoClinicoFresco(): string {
  clinicalTimeCounter += 1;
  return new Date(
    Math.max(Date.now(), FIXTURE_MAX_MS) + clinicalTimeCounter * 60_000,
  ).toISOString();
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
  /** Base HTTP real — necessária só para o fluxo contínuo; o resto usa `inject`. */
  let base: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const endereco = app.server.address();
    if (endereco === null || typeof endereco === "string") {
      throw new Error("porta efêmera não atribuída ao servidor de teste");
    }
    base = `http://127.0.0.1:${String(endereco.port)}`;
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
      const resposta = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: AUTH_A,
      });
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
      const corpo = resposta.json() as {
        item: { estado: string; versao: number; reconhecidoPor: string };
      };
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
        coletadoEm: (envelope.observacoes as Array<Record<string, unknown>>)[4]?.coletadoEm,
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
      const resposta = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: AUTH_B,
      });
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
      const fluxo = await lerPrefixoDoFluxo(base, AUTH_B, { cursor: 0, ate: catchUpConcluido });
      expect(fluxo.status).toBe(200);
      // NÃO VACUIDADE: sem esta linha, um prefixo vazio satisfaria todas as
      // asserções de ausência abaixo. A âncora prova que o catch-up inteiro
      // do tenant B foi lido antes de afirmarmos que nada de G7 apareceu.
      expect(fluxo.texto).toContain(FIM_DO_CATCHUP);
      // A asserção original era `not.toContain("event:")` sobre o corpo finito
      // do replay. O fluxo contínuo emite quadros de CONTROLE (`estado-conexao`,
      // `pulsacao`), que não carregam dado clínico; o que não pode aparecer é
      // evento de DOMÍNIO de outro tenant. A verificação ficou mais precisa,
      // não mais fraca.
      for (const tipo of TIPOS_DE_EVENTO_DE_DOMINIO) {
        expect(fluxo.texto).not.toContain(`event: ${tipo}`);
      }
      expect(fluxo.texto).not.toContain(TENANT);
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
      const divergente = {
        ...payloadOriginal,
        pacienteRef: P002.subjectRef,
        contexto: { idadeAnos: 45 },
      };
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

  /**
   * D2 — a sessão de desenvolvimento destrava o frontend, que não tem como
   * assinar um JWS por conta própria depois que o bearer deixou de ser texto
   * legível. Ela EXISTE aqui porque o perfil é `test`; em perfil endurecido a
   * rota não é registrada e a resposta é 404, não 403.
   */
  describe("POST /v1/dev/sessao — sessão sintética (dev-only)", () => {
    it("emite um token que de fato autentica uma rota /v1 real", async () => {
      const sessao = await app.inject({ method: "POST", url: "/v1/dev/sessao" });
      expect(sessao.statusCode).toBe(201);
      const corpo = sessao.json() as { token: string; expiraEm: string };
      expect(corpo.token.length).toBeGreaterThan(0);
      expect(sessao.headers["cache-control"]).toBe("no-store");

      // O token não é decoração: precisa abrir uma rota autenticada de verdade.
      const grade = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: { authorization: `Bearer ${corpo.token}` },
      });
      expect(grade.statusCode).toBe(200);
      // E precisa cair no tenant do cenário semeado — não em um tenant vazio.
      expect((grade.json() as GradeLeitosResposta).leitos.length).toBeGreaterThan(0);
    });

    it("expiraEm vem do exp da claim verificada e está no futuro", async () => {
      const sessao = await app.inject({ method: "POST", url: "/v1/dev/sessao" });
      const { expiraEm } = sessao.json() as { expiraEm: string };
      expect(Number.isNaN(Date.parse(expiraEm))).toBe(false);
      expect(Date.parse(expiraEm)).toBeGreaterThan(Date.now());
    });

    it("não aceita tenant do chamador — o corpo enviado é ignorado (anti-padrão §10.3)", async () => {
      const sessao = await app.inject({
        method: "POST",
        url: "/v1/dev/sessao",
        payload: { tenantId: "SYNTH-TENANT-B", atorId: "SYNTH-INTRUSO" },
      });
      expect(sessao.statusCode).toBe(201);
      const { token } = sessao.json() as { token: string };
      // Se o corpo tivesse efeito, esta leitura veria o tenant B (grade vazia).
      const grade = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: { authorization: `Bearer ${token}` },
      });
      expect((grade.json() as GradeLeitosResposta).leitos.length).toBeGreaterThan(0);
    });
  });

  describe("GET /v1/eventos/stream — entrega contínua sobre o OUTBOX real", () => {
    it("entrega os eventos do outbox (ingestão, avaliação, alerta) em text/event-stream", async () => {
      const fluxo = await lerPrefixoDoFluxo(base, AUTH_A, {
        cursor: 0,
        ate: (texto) => TIPOS_DE_EVENTO_DE_DOMINIO.every((t) => texto.includes(`event: ${t}`)),
      });
      expect(fluxo.status).toBe(200);
      expect(fluxo.contentType).toContain("text/event-stream");
      for (const tipo of TIPOS_DE_EVENTO_DE_DOMINIO) {
        expect(fluxo.texto).toContain(`event: ${tipo}`);
      }
      // Propriedade NOVA (ADR-0011, anti-padrão §10-11): depois do catch-up a
      // conexão PERMANECE ABERTA. O comportamento anterior — encerrar logo após
      // o backlog e chamar isso de tempo real — falharia aqui.
      expect(fluxo.encerrouSozinho).toBe(false);
    });

    it("cursor além do último evento => nenhum evento de domínio entregue", async () => {
      const fluxo = await lerPrefixoDoFluxo(base, AUTH_A, {
        cursor: 999_999,
        ate: catchUpConcluido,
      });
      expect(fluxo.status).toBe(200);
      // Não vacuidade — ver a nota em `FIM_DO_CATCHUP`.
      expect(fluxo.texto).toContain(FIM_DO_CATCHUP);
      for (const tipo of TIPOS_DE_EVENTO_DE_DOMINIO) {
        expect(fluxo.texto).not.toContain(`event: ${tipo}`);
      }
      // O cursor além do fim é do PRÓPRIO tenant; ainda assim nenhum
      // identificador de tenant deve viajar num quadro de controle.
      expect(fluxo.texto).not.toContain(TENANT);
    });
  });
});
