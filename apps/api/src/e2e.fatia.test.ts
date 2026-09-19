/**
 * Teste E2E da fatia G7 (item 11 da integração SPR-G7-2) — PGlite em
 * memória, kernel NEWS2 real, outbox transacional e auditoria append-only.
 *
 * Caminho FELIZ: semear fixtures → ingerir série de SYNTH-P002 que cruza
 * limiar → avaliação NEWS2 real → alerta criado + outbox gravado →
 * projeção mostra o leito em alerta → reconhecer com versão correta →
 * auditoria registra tudo.
 *
 * Caminhos DEGRADADOS: SpO2 ausente (encontro dedicado SEM histórico —
 * status explícito não-computável fail-closed, JAMAIS escore normal,
 * HAZ-0005), tenant errado (sem vazamento), If-Match errado (409/412) e
 * replay idempotente.
 *
 * Estes testes provam EC-R1.a–EC-R1.c de
 * docs/11-security-privacy-compliance/evidencia-carater-consultivo.md
 * (trilha de revisão humana; ADR-0009 §9 V1/V2/V3) em nível de fatia —
 * NÃO são os V1–V8 formais (TST-DOM-0005), que permanecem pendentes.
 */

import { setTimeout as dormir } from "node:timers/promises";
import type { PGlite } from "@electric-sql/pglite";
import {
  type GradeLeitosResposta,
  IDEMPOTENCY_REPLAYED_HEADER,
  type IngestaoObservacoesResposta,
  type ProblemDetailsConflitoVersao,
  type ReconhecerAlertaResposta,
} from "@intensicare/contratos";
import { presentInstant } from "@intensicare/dominio";
import {
  buildG7SyntheticScenario,
  generateSyntheticPsr,
  loadIntoDatabase,
} from "@intensicare/fixtures-sinteticas";
import {
  bootstrapDatabase,
  createInMemoryDatabase,
  insertEncounter,
  insertPatientIdentity,
  listAuditEvents,
  listOutboxEvents,
  withTenantTransaction,
} from "@intensicare/persistencia";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { gerarTokenSintetico } from "./auth.js";
import { buildServer } from "./index.js";

/**
 * Tipos de `EventoFluxo` do contrato. O fluxo de eventos deixou de ser replay
 * finito e passou a ser entrega CONTÍNUA (ADR-0011): uma conexão que não
 * termina não tem fim de corpo para `inject` esperar, então a verificação de
 * não vazamento lê um PREFIXO do fluxo contra a porta real.
 */
const TIPOS_DE_EVENTO_DE_DOMINIO = [
  "observacao-clinica-registrada",
  "observacoes-ingeridas",
  "avaliacao-computada",
  "alerta-criado",
  "alerta-atualizado",
] as const;

// `"estado":"online"` e NÃO `event: estado-conexao`: o servidor emite um quadro
// `estado-conexao` com `replaying` ANTES de drenar o backlog
// (`eventos/stream.ts`: `#emitirEstado("replaying")` na linha 194, `await
// this.#bombear()` só na 202) e outro com `online` DEPOIS (linha 205). Ancorar
// na substring nua do NOME do evento casava com o quadro de ABERTURA do
// catch-up — a asserção de ausência voltava a ser vácua sob produtor lento,
// backlog maior, TLS ou proxy, e só não falhava porque os dois quadros costumam
// chegar no mesmo pedaço de TCP. Achado P2 de terceira revisão adversarial.
//
// `degraded` (linha 205, quando a fila não esvaziou) significa backlog NÃO
// drenado e portanto NÃO conta como fim de catch-up — ancorar em `online`
// exclui os dois casos errados de uma vez.
const FIM_DO_CATCHUP = '"estado":"online"';

/** Abre o fluxo, acumula o prefixo ATÉ O FIM DO CATCH-UP e encerra do lado do cliente. */
async function lerPrefixoDoFluxo(
  base: string,
  headers: Record<string, string>,
  cursor = 0,
): Promise<{ status: number; texto: string }> {
  const controlador = new AbortController();
  const resposta = await fetch(`${base}/v1/eventos/stream?cursor=${String(cursor)}`, {
    headers: { ...headers, accept: "text/event-stream" },
    signal: controlador.signal,
  });
  let texto = "";
  if (resposta.body !== null) {
    const leitor = resposta.body.getReader();
    const decodificador = new TextDecoder();
    const teto = Date.now() + 5_000;
    for (;;) {
      if (texto.includes(FIM_DO_CATCHUP)) break;
      if (Date.now() > teto) break;
      const leitura = leitor
        .read()
        .catch(() => ({ done: true, value: undefined }) as ReadableStreamReadResult<Uint8Array>);
      const proximo = await Promise.race([leitura, dormir(500).then(() => "ocioso" as const)]);
      if (proximo === "ocioso" || proximo.done) break;
      texto += decodificador.decode(proximo.value, { stream: true });
    }
  }
  controlador.abort();
  return { status: resposta.status, texto };
}

const scenario = buildG7SyntheticScenario();
const TENANT = scenario.organization.id;
const P002 = scenario.patients[1]!;
const ENC_P002 = scenario.encounters[1]!;
/** Par VIRGEM (nenhum caso deste arquivo ingere para P001) — usado pelos degradados. */
const P001 = scenario.patients[0]!;
const ENC_P001 = scenario.encounters[0]!;

const ATOR = "SYNTH-MEDICO-E2E";
const AUTH = { authorization: `Bearer ${gerarTokenSintetico(TENANT, ATOR)}` };
const AUTH_OUTRO_TENANT = {
  authorization: `Bearer ${gerarTokenSintetico("SYNTH-TENANT-INTRUSO", "SYNTH-USER-X")}`,
};

// Encontro dedicado SEM histórico de observações — caso degradado de SpO2
// ausente determinístico (nenhuma SpO2 jamais existiu para este encontro).
const P003_ID = `${TENANT}-PAT-P003`;
const P003_REF = generateSyntheticPsr("P003");
const ENC_P003_ID = `${TENANT}-ENC-P003`;
const LEITO_P003 = scenario.beds[2]!.id;

const FIXTURE_MAX_MS = Date.parse("2026-08-16T11:30:00.000Z");
let clinicalTimeCounter = 0;
function tempoClinicoFresco(): string {
  clinicalTimeCounter += 1;
  return new Date(
    Math.max(Date.now(), FIXTURE_MAX_MS) + clinicalTimeCounter * 60_000,
  ).toISOString();
}

function serieCompleta(t: string) {
  return [
    { parametro: "FR", valor: 26, unidade: "rpm", coletadoEm: t },
    { parametro: "SpO2", valor: 89, unidade: "%", coletadoEm: t },
    { parametro: "FluxoO2", valor: 0, unidade: "L/min", coletadoEm: t },
    { parametro: "PAS", valor: 92, unidade: "mmHg", coletadoEm: t },
    { parametro: "FC", valor: 122, unidade: "bpm", coletadoEm: t },
    { parametro: "NivelConsciencia", codigo: "A", coletadoEm: t },
    { parametro: "Temperatura", valor: 38.3, unidade: "Cel", coletadoEm: t },
  ];
}

describe("E2E da fatia G7 — feliz e degradados sobre a fiação real", () => {
  let db: PGlite;
  let app: FastifyInstance;
  /** Base HTTP real — só o fluxo contínuo precisa dela; o resto usa `inject`. */
  let base: string;

  beforeAll(async () => {
    db = createInMemoryDatabase();
    await bootstrapDatabase(db);
    await loadIntoDatabase(db);
    // Semeadura adicional: paciente/encontro sem NENHUMA observação prévia.
    await withTenantTransaction(db, TENANT, async (tx) => {
      await insertPatientIdentity(tx, { id: P003_ID, tenantId: TENANT, subjectRef: P003_REF });
      await insertEncounter(tx, {
        id: ENC_P003_ID,
        tenantId: TENANT,
        patientId: P003_ID,
        bedId: LEITO_P003,
        admittedAt: presentInstant({ utc: "2026-08-16T09:30:00.000Z", offset: "+00:00" }),
      });
    });
    app = await buildServer({ db });
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

  describe("caminho FELIZ completo", () => {
    let alertaId: string;
    const chaveIngestao = "SYNTH-IDEM-E2E-FELIZ";

    it("série de SYNTH-P002 cruza o limiar → avaliação NEWS2 real valido/11/critico → alerta criado", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH, "idempotency-key": chaveIngestao },
        payload: {
          encontroId: ENC_P002.id,
          leitoId: ENC_P002.bedId,
          pacienteRef: P002.subjectRef,
          contexto: { idadeAnos: 62 },
          observacoes: serieCompleta(tempoClinicoFresco()),
        },
      });
      expect(resposta.statusCode).toBe(201);
      const corpo = resposta.json() as IngestaoObservacoesResposta;
      expect(corpo.avaliacao.status).toBe("valido");
      expect(corpo.avaliacao.escore).toBe(11);
      expect(corpo.avaliacao.banda).toBe("critico");
      expect(corpo.avaliacao.explicacao).toContain("consultiva");
      expect(corpo.alerta).not.toBeNull();
      alertaId = corpo.alerta?.id as string;
    });

    it("outbox foi gravado na MESMA transação: fato clínico, envelope, avaliação e alerta (ADR-0010 B1)", async () => {
      const outbox = await withTenantTransaction(db, TENANT, (tx) => listOutboxEvents(tx));
      const tipos = outbox.map((e) => e.eventType);
      expect(tipos).toContain("clinical_observation_recorded");
      expect(tipos).toContain("observacoes-ingeridas");
      expect(tipos).toContain("avaliacao-computada");
      expect(tipos).toContain("alerta-criado");
      const alertaEvento = outbox.find((e) => e.eventType === "alerta-criado");
      expect(alertaEvento?.aggregateId).toBe(alertaId);

      // REGISTRO IMUTÁVEL do despacho de regra, durável na MESMA transação
      // (achado §6.4 requisito 5): versão de regra, versão de bundle, digest
      // das entradas, razões, proveniência e correlação.
      const despacho = outbox.find((e) => e.eventType === "regra-despachada");
      expect(despacho).toBeDefined();
      const registro = despacho?.payload as Record<string, unknown>;
      expect(registro.chaveRegra).toBe("RULE-NEWS2@0.2.0");
      expect(registro.desfecho).toBe("avaliada");
      // Modo SOMBRA e NÃO acionável — o artefato local não tem cadeia de
      // assinatura (ADR-0007 C5 aberta). Estado factual imutável: 0 vias
      // clínicas acionáveis.
      expect(registro.modo).toBe("sombra");
      expect(registro.acionavel).toBe(false);
      const bundle = registro.bundle as Record<string, unknown>;
      expect(bundle.assinatura).toBe("assinatura_ausente");
      expect(bundle.bloqueiosDeAtivacao).toContain("assinatura_ausente_adr0007_c5");

      // O despacho NÃO é publicado no fluxo: não pertence ao vocabulário de
      // `EventoFluxo`, e rotulá-lo como observação clínica seria um quadro
      // SSE que mente sobre o que carrega.
      //
      // A asserção anterior era `expect(TIPOS_DE_EVENTO_DE_DOMINIO)
      // .not.toContain("regra-despachada")` — uma tautologia: verificava que um
      // literal `as const` declarado NESTE arquivo não continha uma string.
      // Não podia falhar e nada media sobre o servidor (achado P3 de segunda
      // revisão adversarial, 2026-08-17). Agora a asserção é sobre o FLUXO
      // REAL, lido até o fim do catch-up.
      const fluxo = await lerPrefixoDoFluxo(base, AUTH);
      expect(fluxo.texto).toContain(FIM_DO_CATCHUP);
      expect(fluxo.texto).not.toContain("event: regra-despachada");
      expect(fluxo.texto).not.toContain("regra-despachada");
    });

    it("a projeção de grade de leitos mostra o leito em alerta", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: AUTH,
      });
      expect(resposta.statusCode).toBe(200);
      const grade = resposta.json() as GradeLeitosResposta;
      const leito = grade.leitos.find((l) => l.leitoId === ENC_P002.bedId);
      expect(leito?.alerta?.id).toBe(alertaId);
      expect(leito?.alerta?.estado).toBe("nao-atribuido");
      expect(leito?.statusAvaliacao).toBe("valido");
      expect(leito?.escore).toBe(11);
    });

    it("reconhecer com a versão correta (If-Match: 0) transiciona com ator humano identificado (EC-R1.a)", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaId}/reconhecer`,
        headers: { ...AUTH, "if-match": "0" },
        payload: { comentario: "ciência do plantonista sintético" },
      });
      expect(resposta.statusCode).toBe(200);
      const corpo = resposta.json() as ReconhecerAlertaResposta;
      expect(corpo.item.estado).toBe("reconhecido");
      // v2: atribuição implícita ao ator (assign, v1) + reconhecimento (v2) —
      // o grafo do ADR-0009 W1 não admite nao_atribuido→reconhecido direto.
      expect(corpo.item.versao).toBe(2);
      expect(corpo.item.reconhecidoPor).toBe(ATOR);
    });

    it("a auditoria append-only registrou tudo: ingestão, leituras e a transição com ator e estados (EC-R1.b)", async () => {
      const auditoria = await withTenantTransaction(db, TENANT, (tx) => listAuditEvents(tx));
      const comandos = auditoria.map((a) => a.command);
      expect(comandos).toContain("ingestao-observacoes");
      expect(comandos).toContain("leitura-grade-leitos");
      expect(comandos).toContain("assign");
      expect(comandos).toContain("acknowledge");

      // Duas transições auditadas (atribuição implícita + reconhecimento),
      // ambas com o MESMO ator humano identificado (ADR-0009 W4/W6).
      const atribuicao = auditoria.find(
        (a) => a.command === "assign" && a.aggregateId === alertaId,
      );
      expect(atribuicao?.actorId).toBe(ATOR);
      expect(atribuicao?.previousState).toBe("nao_atribuido");
      expect(atribuicao?.newState).toBe("atribuido");

      const transicao = auditoria.find(
        (a) => a.command === "acknowledge" && a.newState === "reconhecido",
      );
      expect(transicao).toBeDefined();
      expect(transicao?.actorId).toBe(ATOR);
      expect(transicao?.previousState).toBe("atribuido");
      expect(transicao?.aggregateId).toBe(alertaId);
    });
  });

  describe("degradado: SpO2 ausente => fail-closed explícito, JAMAIS escore normal (HAZ-0005)", () => {
    it("encontro sem NENHUMA SpO2: demais sinais presentes e preocupantes => 'indisponivel' com razão, sem alerta", async () => {
      const t = tempoClinicoFresco();
      const semSpo2 = serieCompleta(t).filter((o) => o.parametro !== "SpO2");
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH, "idempotency-key": "SYNTH-IDEM-E2E-DEG-SPO2" },
        payload: {
          encontroId: ENC_P003_ID,
          leitoId: LEITO_P003,
          pacienteRef: P003_REF,
          contexto: { idadeAnos: 58 },
          observacoes: semSpo2,
        },
      });
      expect(resposta.statusCode).toBe(201);
      const corpo = resposta.json() as IngestaoObservacoesResposta;
      expect(corpo.avaliacao.status).toBe("indisponivel");
      expect(corpo.avaliacao.status).not.toBe("valido");
      expect(corpo.avaliacao.status).not.toBe("parcial");
      expect(corpo.avaliacao.motivos).toContain("missing_required_input:spo2");
      expect(corpo.avaliacao.parametrosAusentes).toContain("SpO2");
      // JAMAIS um escore/banda "normal" por omissão.
      expect(corpo.avaliacao.escore).toBeNull();
      expect(corpo.avaliacao.banda).toBeNull();
      expect(corpo.alerta).toBeNull();
      // A explicação declara que ausência de pontuação não é normalidade.
      expect(corpo.avaliacao.explicacao).toContain("não significa normalidade");
    });

    it("a projeção mostra o leito com status explícito não-computável (nunca 'normal')", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: AUTH,
      });
      const grade = resposta.json() as GradeLeitosResposta;
      const leito = grade.leitos.find((l) => l.leitoId === LEITO_P003);
      expect(leito?.statusAvaliacao).toBe("indisponivel");
      expect(leito?.escore).toBeNull();
      expect(leito?.banda).toBeNull();
    });
  });

  describe("degradado: tenant errado => sem vazamento", () => {
    it("grade vazia, avaliações 404 e reconhecer 404 para outro tenant", async () => {
      const grade = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: AUTH_OUTRO_TENANT,
      });
      expect((grade.json() as GradeLeitosResposta).leitos).toHaveLength(0);

      const avaliacoes = await app.inject({
        method: "GET",
        url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
        headers: AUTH_OUTRO_TENANT,
      });
      expect(avaliacoes.statusCode).toBe(404);

      // Asserção original: `not.toContain("event:")` sobre o corpo finito do
      // replay. O fluxo contínuo emite quadros de CONTROLE (`estado-conexao`,
      // `pulsacao`) sem dado clínico; o que não pode aparecer é evento de
      // DOMÍNIO — nem o tenant vítima em parte alguma do prefixo.
      const eventos = await lerPrefixoDoFluxo(base, AUTH_OUTRO_TENANT);
      // NÃO VACUIDADE: sem esta linha um prefixo vazio satisfaria todas as
      // asserções de ausência abaixo. A âncora prova que o catch-up do outro
      // tenant foi lido inteiro antes de afirmarmos que nada vazou.
      expect(eventos.texto).toContain(FIM_DO_CATCHUP);
      for (const tipo of TIPOS_DE_EVENTO_DE_DOMINIO) {
        expect(eventos.texto).not.toContain(`event: ${tipo}`);
      }
      expect(eventos.texto).not.toContain(TENANT);
      expect(eventos.texto).not.toContain(P002.subjectRef);
    });
  });

  describe("degradado: If-Match errado e replay idempotente", () => {
    let alertaId: string;
    const chave = "SYNTH-IDEM-E2E-REPLAY";
    let payloadOriginal: Record<string, unknown>;

    beforeAll(async () => {
      // Par VIRGEM (P001/ENC_P001): sob o gatilho de BORDA (ORQ-3/CRIT-1),
      // re-ingerir alto para o P002 NÃO cruza (anterior 11 do caminho feliz)
      // e o cooldown da emissão feliz suprimiria o rearme — a própria
      // série de degradados precisa de um alerta próprio, e a primeira
      // medição conhecida do paciente virgem acima do patamar ARMA o
      // gatilho (premissa reversível, dossiê RAT-EWS).
      payloadOriginal = {
        encontroId: ENC_P001.id,
        leitoId: ENC_P001.bedId,
        pacienteRef: P001.subjectRef,
        contexto: { idadeAnos: 62 },
        observacoes: serieCompleta(tempoClinicoFresco()),
      };
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH, "idempotency-key": chave },
        payload: payloadOriginal,
      });
      alertaId = String((resposta.json() as IngestaoObservacoesResposta).alerta?.id);
    });

    it("If-Match com versão errada => 412 com estado corrente; a versão do banco não muda (HAZ-0023)", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaId}/reconhecer`,
        headers: { ...AUTH, "if-match": "7" },
      });
      expect(resposta.statusCode).toBe(412);
      const corpo = resposta.json() as ProblemDetailsConflitoVersao;
      expect(corpo.versaoAtual).toBe(0);
      expect(corpo.estadoAtual).toBe("nao-atribuido");
    });

    it("reconhecer aplicado e repetido com a versão velha => 409/412 explícito, nunca sobrescrita silenciosa", async () => {
      const primeira = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaId}/reconhecer`,
        headers: { ...AUTH, "if-match": "0" },
      });
      expect(primeira.statusCode).toBe(200);

      const repetida = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaId}/reconhecer`,
        headers: { ...AUTH, "if-match": "0" },
      });
      // Versão velha => 412 (conflito). Se enviada a versão nova, seria 409
      // (transição ilegal reconhecido→reconhecido) — ambos explícitos.
      expect(repetida.statusCode).toBe(412);
    });

    it("replay da mesma chave com corpo idêntico => resposta original, sem novo alerta; corpo divergente => 422", async () => {
      const replay = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH, "idempotency-key": chave },
        payload: payloadOriginal,
      });
      expect(replay.statusCode).toBe(201);
      expect(replay.headers[IDEMPOTENCY_REPLAYED_HEADER.toLowerCase()]).toBe("true");
      expect((replay.json() as IngestaoObservacoesResposta).alerta?.id).toBe(alertaId);

      const divergente = await app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH, "idempotency-key": chave },
        payload: { ...payloadOriginal, contexto: { idadeAnos: 45 } },
      });
      expect(divergente.statusCode).toBe(422);
    });
  });
});
