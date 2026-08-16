/**
 * apps/api/src/seguranca.test.ts — verificação ADVERSARIAL, na borda HTTP,
 * dos controles de segurança e de segurança clínica de alta severidade que
 * a fatia sintética G7 consegue demonstrar hoje.
 *
 * Estes NÃO são testes felizes. Cada caso tenta ativamente contornar o
 * controle: token ausente/malformado/sem tenant, tenant declarado pelo
 * chamador em cabeçalho/query/corpo, identificador de recurso de outro
 * tenant, replay de chave de idempotência entre tenants, envelope com
 * insumo ausente/unidade impossível/forma trocada, e leitura de corpos de
 * erro em busca de PHI ou de detalhe interno. Cada teste cita no nome o
 * identificador do controle verificado.
 *
 * ESCOPO E LIMITE (regra dura): nada aqui fecha THR-*, SAF-*, SEC-*,
 * HAZ-* nem o Gate G6. G6 exige verificador terceiro independente
 * (DEC-G0-02) e aceite humano nominal (MG-G6). A lista honesta do que
 * esta fatia NÃO consegue verificar está em
 * `docs/11-security-privacy-compliance/verificacao-de-controles-fatia-g7.md`.
 *
 * ACHADOS registrados como `it.fails` (falha REAL de controle, deixada
 * visível; conserto do código de produção está fora do escopo deste agente):
 *   - ACHADO-02: o corpo `application/problem+json` ecoa o identificador de
 *     sujeito (PSR) no campo `instance`.
 *
 * Dados 100% sintéticos (marcador `SYNTH-`, política GDEC-0014).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import {
  type GradeLeitosResposta,
  type IngestaoObservacoesResposta,
  type ProblemDetails,
} from "@intensicare/contratos";
import { presentInstant } from "@intensicare/dominio";
import { buildG7SyntheticScenario, generateSyntheticPsr, loadIntoDatabase } from "@intensicare/fixtures-sinteticas";
import {
  bootstrapDatabase,
  createInMemoryDatabase,
  getWorkItem,
  insertBed,
  insertCareUnit,
  insertEncounter,
  insertOrganization,
  insertPatientIdentity,
  listAuditEvents,
  listClinicalObservations,
  listOutboxEvents,
  withTenantTransaction,
} from "@intensicare/persistencia";
import { buildServer } from "./index.js";
import { gerarTokenSintetico } from "./auth.js";

const TEMPO_LIMITE_MS = 60_000;

const cenario = buildG7SyntheticScenario();
const TENANT_G7 = cenario.organization.id;
const P002 = cenario.patients[1]!;
const ENC_P002 = cenario.encounters[1]!;

const ATOR_G7 = "SYNTH-MEDICO-SEG";
const AUTH_G7 = { authorization: `Bearer ${gerarTokenSintetico(TENANT_G7, ATOR_G7)}` };

/** Segundo tenant, provisionado por este teste — o "intruso" das sondagens. */
const TENANT_X = "SYNTH-TENANT-INTRUSO";
const ATOR_X = "SYNTH-USUARIO-INTRUSO";
const AUTH_X = { authorization: `Bearer ${gerarTokenSintetico(TENANT_X, ATOR_X)}` };
const LEITO_X = `${TENANT_X}-LEITO-01`;
const PACIENTE_X_ID = `${TENANT_X}-PAT-01`;
const PACIENTE_X_REF = generateSyntheticPsr("INTRUSO-01");
const ENC_X = `${TENANT_X}-ENC-01`;

/** Encontro do G7 SEM nenhuma observação prévia — base dos casos fail-closed. */
const PACIENTE_VAZIO_ID = `${TENANT_G7}-PAT-SEG-VAZIO`;
const PACIENTE_VAZIO_REF = generateSyntheticPsr("SEG-VAZIO");
const ENC_VAZIO = `${TENANT_G7}-ENC-SEG-VAZIO`;
const LEITO_VAZIO = cenario.beds[2]!.id;

/** Quarto leito do cenário: fica DESOCUPADO de propósito (nenhum encontro). */
const LEITO_DESOCUPADO = cenario.beds[3]!.id;

const INSTANTE_MAXIMO_FIXTURE = Date.parse("2026-08-16T11:30:00.000Z");
let contadorTempoClinico = 0;
/** Instante clínico sempre à frente das fixtures — evita degradação por frescor. */
function tempoClinicoFresco(): string {
  contadorTempoClinico += 1;
  return new Date(Math.max(Date.now(), INSTANTE_MAXIMO_FIXTURE) + contadorTempoClinico * 60_000).toISOString();
}

function serieCompleta(t: string): Record<string, unknown>[] {
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

/**
 * Termos que denunciariam vazamento de detalhe interno num corpo de erro
 * (SEC-0015: "typed problem details with no internal exception text").
 */
const TERMOS_INTERNOS_PROIBIDOS = [
  "select ",
  "insert into",
  "update ",
  "delete from",
  "pglite",
  "postgres",
  "row-level",
  "row level security",
  "relation ",
  "duplicate key",
  "constraint",
  "at object",
  ".ts:",
  "stack",
  "node_modules",
  "synth-concept",
] as const;

function corpoNaoVazaDetalheInterno(corpo: string, rotulo: string): void {
  const minusculo = corpo.toLowerCase();
  for (const termo of TERMOS_INTERNOS_PROIBIDOS) {
    expect(minusculo, `${rotulo} vazou o termo interno "${termo}"`).not.toContain(termo);
  }
}

async function contarEstadoDoTenant(db: PGlite, tenantId: string) {
  return withTenantTransaction(db, tenantId, async (tx) => ({
    observacoes: (await listClinicalObservations(tx)).length,
    outbox: (await listOutboxEvents(tx)).length,
    auditoria: (await listAuditEvents(tx)).length,
  }));
}

let db: PGlite;
let app: FastifyInstance;
/** Alerta REAL do tenant G7, criado no bootstrap — alvo das sondagens cross-tenant. */
let alertaG7: string;

beforeAll(async () => {
  db = createInMemoryDatabase();
  await bootstrapDatabase(db);
  await loadIntoDatabase(db);

  // Encontro do G7 sem histórico algum (casos fail-closed determinísticos).
  await withTenantTransaction(db, TENANT_G7, async (tx) => {
    await insertPatientIdentity(tx, {
      id: PACIENTE_VAZIO_ID,
      tenantId: TENANT_G7,
      subjectRef: PACIENTE_VAZIO_REF,
    });
    await insertEncounter(tx, {
      id: ENC_VAZIO,
      tenantId: TENANT_G7,
      patientId: PACIENTE_VAZIO_ID,
      bedId: LEITO_VAZIO,
      admittedAt: presentInstant({ utc: "2026-08-16T09:30:00.000Z", offset: "+00:00" }),
    });
  });

  // Tenant intruso, completo e legítimo do seu próprio lado — para que as
  // sondagens cross-tenant sejam de um chamador REAL, não de um vazio.
  await withTenantTransaction(db, TENANT_X, async (tx) => {
    await insertOrganization(tx, { id: TENANT_X, tenantId: TENANT_X, name: "Organização Sintética Intrusa" });
    await insertCareUnit(tx, {
      id: `${TENANT_X}-UTI-01`,
      tenantId: TENANT_X,
      organizationId: TENANT_X,
      name: "UTI Sintética Intrusa",
    });
    await insertBed(tx, { id: LEITO_X, tenantId: TENANT_X, careUnitId: `${TENANT_X}-UTI-01`, code: "01" });
    await insertPatientIdentity(tx, { id: PACIENTE_X_ID, tenantId: TENANT_X, subjectRef: PACIENTE_X_REF });
    await insertEncounter(tx, {
      id: ENC_X,
      tenantId: TENANT_X,
      patientId: PACIENTE_X_ID,
      bedId: LEITO_X,
      admittedAt: presentInstant({ utc: "2026-08-16T09:00:00.000Z", offset: "+00:00" }),
    });
  });

  app = await buildServer({ db });

  // Alerta real no G7 (série que cruza limiar) — alvo de F3/F6/I1/I2.
  const resposta = await app.inject({
    method: "POST",
    url: "/v1/ingestao/observacoes",
    headers: { ...AUTH_G7, "idempotency-key": "SYNTH-IDEM-SEG-BOOTSTRAP" },
    payload: {
      encontroId: ENC_P002.id,
      leitoId: ENC_P002.bedId,
      pacienteRef: P002.subjectRef,
      contexto: { idadeAnos: 62 },
      observacoes: serieCompleta(tempoClinicoFresco()),
    },
  });
  alertaG7 = String((resposta.json() as IngestaoObservacoesResposta).alerta?.id);
}, TEMPO_LIMITE_MS);

afterAll(async () => {
  await app.close();
});

// ---------------------------------------------------------------------------
// E. Autorização exigida em toda rota
//    SEC-0001, SEC-0002, SAF-0007 | THR-0021, THR-0022 (P0) | HAZ-0014
// ---------------------------------------------------------------------------

const ROTAS_PROTEGIDAS: readonly (readonly ["GET" | "POST", string])[] = [
  ["GET", "/v1/projecoes/grade-leitos"],
  ["GET", `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`],
  ["POST", "/v1/alertas/SYNTH-ALVO/reconhecer"],
  ["GET", "/v1/eventos/stream"],
  ["POST", "/v1/ingestao/observacoes"],
];

describe("E. autorização exigida em toda rota do contrato /v1", () => {
  it("SEC-0001/SAF-0007 — sem cabeçalho Authorization, TODA rota /v1 de dados responde 401 (fail-closed, jamais leitura degradada)", async () => {
    for (const [method, url] of ROTAS_PROTEGIDAS) {
      const r = await app.inject({ method, url });
      expect(r.statusCode, `${method} ${url} não exigiu autenticação`).toBe(401);
      expect(r.headers["content-type"]).toContain("problem+json");
    }
  }, TEMPO_LIMITE_MS);

  it("SEC-0004/SEC-0001 — token malformado, com esquema errado, sem tenant ou sem ator é recusado com 401 (nunca tenant padrão, nunca resultado parcial)", async () => {
    const tokensRuins: readonly string[] = [
      "Bearer ",
      "Bearer    ",
      "Basic SYNTH-TOKEN.T.A",
      "Bearer abc",
      "Bearer SYNTH-TOKEN",
      "Bearer SYNTH-TOKEN.",
      "Bearer SYNTH-TOKEN.SYNTH-TENANT-G7", // sem ator
      "Bearer SYNTH-TOKEN..SYNTH-ATOR", // sem tenant
      "Bearer SYNTH-TOKEN.SYNTH-TENANT-G7.", // ator vazio
      "Bearer SYNTH-TOKEN.SYNTH-TENANT-G7.SYNTH-ATOR.extra", // segmento extra
      "Bearer eyJhbGciOiJub25lIn0.eyJ0ZW5hbnQiOiJTWU5USC1URU5BTlQtRzcifQ.", // JWT alg=none
      `SYNTH-TOKEN.${TENANT_G7}.${ATOR_G7}`, // sem o esquema Bearer
    ];

    for (const authorization of tokensRuins) {
      const r = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: { authorization },
      });
      expect(r.statusCode, `token aceito indevidamente: ${JSON.stringify(authorization)}`).toBe(401);
      const problema = r.json() as ProblemDetails;
      expect(problema.status).toBe(401);
      // A recusa não pode revelar nada sobre o estado clínico: nem a
      // projeção, nem o tenant existente, nem qualquer sujeito.
      expect(r.body).not.toContain('"leitos"');
      expect(r.body).not.toContain(TENANT_G7);
      expect(r.body).not.toContain("amh:psr:v1:");
      corpoNaoVazaDetalheInterno(r.body, `401 para ${authorization}`);
    }
  }, TEMPO_LIMITE_MS);

  it("SEC-0015 — /v1/healthz é deliberadamente público e devolve exclusivamente {status:'ok'} (sem PHI, sem tenant, sem contagens)", async () => {
    const r = await app.inject({ method: "GET", url: "/v1/healthz" });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ status: "ok" });
    expect(r.body).not.toContain(TENANT_G7);
  }, TEMPO_LIMITE_MS);

  // ACHADO-03 CORRIGIDO no mesmo ciclo: a rota de demonstração
  // `POST /idempotency-example` (fundação SPR-G7-1) foi REMOVIDA. Superfície
  // de escrita sem fronteira de autenticação é defeito mesmo sem estado
  // clínico exposto. Este teste agora guarda a ausência dela.
  it("SEC-0002 — nenhuma superfície de escrita sem autenticação permanece exposta", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/idempotency-example",
      headers: { "idempotency-key": "SYNTH-SEM-AUTH" },
    });
    expect(r.statusCode).toBe(404);

    // E a rota de escrita real recusa antes de qualquer processamento.
    const real = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { "idempotency-key": "SYNTH-SEM-AUTH" },
      payload: {},
    });
    expect(real.statusCode).toBe(401);
  }, TEMPO_LIMITE_MS);
});

// ---------------------------------------------------------------------------
// F. Isolamento de tenant na borda HTTP, sob tentativa ATIVA de contorno
//    SEC-0001, SEC-0003, SEC-0009 | THR-0001, THR-0002, THR-0016 (P0) | HAZ-0013
// ---------------------------------------------------------------------------

describe("F. isolamento de tenant na API sob tentativa ativa de contorno", () => {
  it("SEC-0001/THR-0001 — tenant declarado pelo CHAMADOR (cabeçalho, query, corpo, subdomínio) é ignorado: o token continua mandando", async () => {
    const tentativas: readonly Record<string, string>[] = [
      { "x-tenant-id": TENANT_G7 },
      { "x-organization-id": TENANT_G7 },
      { "x-forwarded-host": `${TENANT_G7}.exemplo.invalid` },
      { host: `${TENANT_G7}.exemplo.invalid` },
      { "x-tenant-override": TENANT_G7, "x-cross-tenant-authorized": "true" },
    ];

    for (const cabecalhos of tentativas) {
      const r = await app.inject({
        method: "GET",
        url: `/v1/projecoes/grade-leitos?tenantId=${encodeURIComponent(TENANT_G7)}&organizationId=${encodeURIComponent(TENANT_G7)}`,
        headers: { ...AUTH_X, ...cabecalhos },
      });
      expect(r.statusCode).toBe(200);
      const grade = r.json() as GradeLeitosResposta;
      // O intruso enxerga o SEU leito e nada do G7 — o valor do chamador
      // não moveu a fronteira nem por um leito.
      expect(grade.leitos.map((l) => l.leitoId), `contorno aceito com ${JSON.stringify(cabecalhos)}`).toEqual([
        LEITO_X,
      ]);
      expect(r.body).not.toContain(P002.subjectRef);
    }
  }, TEMPO_LIMITE_MS);

  it("SEC-0003/SEC-0009 — paciente de OUTRO tenant devolve resposta indistinguível de paciente inexistente (sem oráculo de enumeração)", async () => {
    const existeNoutroTenant = await app.inject({
      method: "GET",
      url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
      headers: AUTH_X,
    });
    const naoExisteEmLugarNenhum = await app.inject({
      method: "GET",
      url: `/v1/pacientes/${encodeURIComponent(generateSyntheticPsr("NAO-EXISTE"))}/avaliacoes`,
      headers: AUTH_X,
    });

    expect(existeNoutroTenant.statusCode).toBe(404);
    expect(naoExisteEmLugarNenhum.statusCode).toBe(404);

    const a = existeNoutroTenant.json() as ProblemDetails;
    const b = naoExisteEmLugarNenhum.json() as ProblemDetails;
    // Mesmo título e mesmo detalhe: a resposta não distingue "existe mas
    // não é seu" de "não existe". (`instance` difere apenas por ecoar a URL
    // pedida — ver ACHADO-02 na suíte H.)
    expect(a.title).toBe(b.title);
    expect(a.detail).toBe(b.detail);
    expect(a.status).toBe(b.status);
  }, TEMPO_LIMITE_MS);

  it("SEC-0009/SAF-0017 — reconhecer alerta de OUTRO tenant devolve 404 e não altera o alerta da vítima", async () => {
    const antes = await withTenantTransaction(db, TENANT_G7, (tx) => getWorkItem(tx, alertaG7));
    expect(antes).toBeDefined();

    for (const ifMatch of ["0", "1", "999"]) {
      const r = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaG7}/reconhecer`,
        headers: { ...AUTH_X, "if-match": ifMatch },
      });
      expect(r.statusCode).toBe(404);
      expect(r.body).not.toContain(P002.subjectRef);
      corpoNaoVazaDetalheInterno(r.body, "404 cross-tenant de alerta");
    }

    const depois = await withTenantTransaction(db, TENANT_G7, (tx) => getWorkItem(tx, alertaG7));
    expect(depois?.state).toBe(antes?.state);
    expect(depois?.version).toBe(antes?.version);
    expect(depois?.assigneeId).toBe(antes?.assigneeId);
  }, TEMPO_LIMITE_MS);

  it("SEC-0009/SAF-0008 — ingestão do intruso contra encontro/leito/paciente do G7: 404 e ZERO linhas novas no tenant vítima", async () => {
    const antes = await contarEstadoDoTenant(db, TENANT_G7);

    const r = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_X, "idempotency-key": "SYNTH-IDEM-SEG-CROSS-ESCRITA" },
      payload: {
        encontroId: ENC_P002.id,
        leitoId: ENC_P002.bedId,
        pacienteRef: P002.subjectRef,
        contexto: { idadeAnos: 62 },
        observacoes: serieCompleta(tempoClinicoFresco()),
      },
    });
    expect(r.statusCode).toBe(404);

    const depois = await contarEstadoDoTenant(db, TENANT_G7);
    expect(depois.observacoes).toBe(antes.observacoes);
    expect(depois.outbox).toBe(antes.outbox);
    expect(depois.auditoria).toBe(antes.auditoria);

    // A recusa é auditada NO TENANT DO CHAMADOR, nunca no da vítima.
    const auditoriaIntruso = await withTenantTransaction(db, TENANT_X, (tx) => listAuditEvents(tx));
    expect(auditoriaIntruso.some((a) => a.newState === "recusada" && a.actorId === ATOR_X)).toBe(true);
  }, TEMPO_LIMITE_MS);

  it("SEC-0009/THR-0016 — o fluxo de eventos (superfície contínua) não entrega NENHUM evento do outro tenant", async () => {
    const r = await app.inject({ method: "GET", url: "/v1/eventos/stream?cursor=0", headers: AUTH_X });
    expect(r.statusCode).toBe(200);
    expect(r.body).not.toContain(P002.subjectRef);
    expect(r.body).not.toContain(ENC_P002.id);
    expect(r.body).not.toContain(alertaG7);
    expect(r.body).not.toContain(TENANT_G7);

    // Controle positivo: o dono VÊ os seus eventos — o vazio acima é
    // isolamento, não um fluxo quebrado.
    const doDono = await app.inject({ method: "GET", url: "/v1/eventos/stream?cursor=0", headers: AUTH_G7 });
    expect(doDono.body).toContain("event:");
  }, TEMPO_LIMITE_MS);

  it("SEC-0021/SEC-0009 — replay de Idempotency-Key de outro tenant não devolve a resposta original da vítima", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_X, "idempotency-key": "SYNTH-IDEM-SEG-BOOTSTRAP" },
      payload: {
        encontroId: ENC_X,
        leitoId: LEITO_X,
        pacienteRef: PACIENTE_X_REF,
        contexto: { idadeAnos: 40 },
        observacoes: serieCompleta(tempoClinicoFresco()),
      },
    });
    expect(r.statusCode).toBe(201);
    // A chave colide, mas o registro da vítima é invisível: nada do G7 sai.
    expect(r.body).not.toContain(alertaG7);
    expect(r.body).not.toContain(ENC_P002.id);
    expect(r.body).not.toContain(P002.subjectRef);
    expect((r.json() as IngestaoObservacoesResposta).encontroId).toBe(ENC_X);
  }, TEMPO_LIMITE_MS);
});

// ---------------------------------------------------------------------------
// G. Fail-closed do gate clínico — ausência JAMAIS vira normalidade
//    SAF-0001, SAF-0002, SAF-0006, SAF-0028, SEC-0026 | THR-0006 (P0) | HAZ-0005
// ---------------------------------------------------------------------------

describe("G. fail-closed do gate clínico: entrada ausente ou inválida jamais produz escore normal", () => {
  it("HAZ-0005/SAF-0002 — insumo obrigatório ausente com os demais sinais alarmantes: status explícito, escore null (NUNCA 0, NUNCA 'normal')", async () => {
    const t = tempoClinicoFresco();
    const semSpo2 = serieCompleta(t).filter((o) => o["parametro"] !== "SpO2");

    const r = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_G7, "idempotency-key": "SYNTH-IDEM-SEG-SEM-SPO2" },
      payload: {
        encontroId: ENC_VAZIO,
        leitoId: LEITO_VAZIO,
        pacienteRef: PACIENTE_VAZIO_REF,
        contexto: { idadeAnos: 58 },
        observacoes: semSpo2,
      },
    });
    expect(r.statusCode).toBe(201);
    const corpo = r.json() as IngestaoObservacoesResposta;

    expect(corpo.avaliacao.status).not.toBe("valido");
    expect(corpo.avaliacao.escore).toBeNull();
    expect(corpo.avaliacao.escore).not.toBe(0); // o modo de falha OCORRIDO no legado
    expect(corpo.avaliacao.banda).toBeNull();
    expect(corpo.avaliacao.banda).not.toBe("normal");
    expect(corpo.alerta).toBeNull();
    expect(corpo.avaliacao.parametrosAusentes).toContain("SpO2");
    expect(corpo.avaliacao.motivos.join(" ")).toContain("missing_required_input");
  }, TEMPO_LIMITE_MS);

  it("SAF-0028/SEC-0026 — unidade fora do catálogo é rejeitada alto (`unmappable_unit`), jamais coagida à unidade canônica", async () => {
    const t = tempoClinicoFresco();
    const observacoes = serieCompleta(t).map((o) =>
      o["parametro"] === "FR" ? { ...o, unidade: "furlongs/quinzena" } : o,
    );

    const r = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_G7, "idempotency-key": "SYNTH-IDEM-SEG-UNIDADE" },
      payload: {
        encontroId: ENC_VAZIO,
        leitoId: LEITO_VAZIO,
        pacienteRef: PACIENTE_VAZIO_REF,
        contexto: { idadeAnos: 58 },
        observacoes,
      },
    });
    expect(r.statusCode).toBe(201);
    const corpo = r.json() as IngestaoObservacoesResposta;
    expect(corpo.avaliacao.status).not.toBe("valido");
    expect(corpo.avaliacao.escore).toBeNull();
    expect(corpo.avaliacao.banda).toBeNull();
    expect(corpo.alerta).toBeNull();
    const fr = corpo.avaliacao.parametros.find((p) => p.parametro === "FR");
    expect(fr?.motivo).toContain("unmappable_unit");
    expect(fr?.presente).toBe(false);
  }, TEMPO_LIMITE_MS);

  it("SEC-0026/SAF-0010 — observações malformadas vão para QUARENTENA com motivo, nunca são coagidas nem descartadas em silêncio", async () => {
    const t = tempoClinicoFresco();
    const malformadas: Record<string, unknown>[] = [
      { parametro: "FR", valor: "vinte e seis", unidade: "rpm", coletadoEm: t }, // valor não numérico
      { parametro: "FR", valor: null, unidade: "rpm", coletadoEm: t }, // valor nulo
      { parametro: "FC", valor: 120, unidade: "", coletadoEm: t }, // unidade vazia
      { parametro: "PAS", valor: 90, coletadoEm: t }, // sem unidade
      { parametro: "Temperatura", valor: 38, unidade: "Cel", coletadoEm: "2026-02-30T10:00:00Z" }, // data impossível
      { parametro: "Temperatura", valor: 38, unidade: "Cel", coletadoEm: "2026-08-16T10:00:00" }, // sem fuso
      { parametro: "Temperatura", valor: 38, unidade: "Cel", coletadoEm: "" }, // sem instante
      { parametro: "NivelConsciencia", valor: 3, unidade: "pontos", coletadoEm: t }, // forma trocada
      { parametro: "FR", codigo: "A", coletadoEm: t }, // forma trocada (inverso)
      { parametro: "PressaoIntracraniana", valor: 12, unidade: "mmHg", coletadoEm: t }, // fora do catálogo
    ];

    const r = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_G7, "idempotency-key": "SYNTH-IDEM-SEG-QUARENTENA" },
      payload: {
        encontroId: ENC_VAZIO,
        leitoId: LEITO_VAZIO,
        pacienteRef: PACIENTE_VAZIO_REF,
        contexto: { idadeAnos: 58 },
        observacoes: malformadas,
      },
    });
    expect(r.statusCode).toBe(201);
    const corpo = r.json() as IngestaoObservacoesResposta;

    // TODAS foram para quarentena, cada uma com motivo legível — nenhuma
    // silenciosamente aceita e nenhuma silenciosamente sumida.
    expect(corpo.aceitas).toHaveLength(0);
    expect(corpo.quarentena).toHaveLength(malformadas.length);
    for (const item of corpo.quarentena) {
      expect(item.motivo.length).toBeGreaterThan(0);
    }
    // E, sem nenhum insumo aceito, a avaliação não pode ser válida.
    expect(corpo.avaliacao.status).not.toBe("valido");
    expect(corpo.avaliacao.escore).toBeNull();
    expect(corpo.alerta).toBeNull();
  }, TEMPO_LIMITE_MS);

  it("SAF-0001/SAF-0006 — invariante da projeção: nenhum leito exibe escore ou banda sem status de avaliação 'valido'", async () => {
    const r = await app.inject({ method: "GET", url: "/v1/projecoes/grade-leitos", headers: AUTH_G7 });
    expect(r.statusCode).toBe(200);
    const grade = r.json() as GradeLeitosResposta;
    expect(grade.leitos.length).toBeGreaterThan(0);

    for (const leito of grade.leitos) {
      if (leito.statusAvaliacao !== "valido") {
        expect(leito.escore, `leito ${leito.leitoId} exibiu escore sem status válido`).toBeNull();
        expect(leito.banda, `leito ${leito.leitoId} exibiu banda sem status válido`).toBeNull();
      }
      // Um leito nunca é "normal" por omissão de status.
      if (leito.statusAvaliacao === null) {
        expect(leito.banda).toBeNull();
      }
    }
  }, TEMPO_LIMITE_MS);

  it("SAF-0006 — leito DESOCUPADO aparece na própria categoria (status nulo, escore nulo), nunca dobrado em 'normal'", async () => {
    const r = await app.inject({ method: "GET", url: "/v1/projecoes/grade-leitos", headers: AUTH_G7 });
    const grade = r.json() as GradeLeitosResposta;
    const desocupado = grade.leitos.find((l) => l.leitoId === LEITO_DESOCUPADO);
    expect(desocupado).toBeDefined();
    expect(desocupado?.encontroId).toBeNull();
    expect(desocupado?.pacienteRef).toBeNull();
    expect(desocupado?.statusAvaliacao).toBeNull();
    expect(desocupado?.escore).toBeNull();
    expect(desocupado?.banda).toBeNull();
    expect(desocupado?.frescor).toBe("desatualizado");
  }, TEMPO_LIMITE_MS);
});

// ---------------------------------------------------------------------------
// H. Vazamento de PHI e de detalhe interno em superfícies de erro
//    SEC-0015, SEC-0016, SAF-0026 | THR-0023, THR-0028 | HAZ-0028
// ---------------------------------------------------------------------------

describe("H. superfícies de erro não vazam detalhe interno nem valor clínico", () => {
  it("SEC-0015 — nenhum corpo de erro (400/401/404/412/422/428) contém SQL, nome de tabela, texto de exceção ou conceito clínico", async () => {
    const respostas: readonly [string, Awaited<ReturnType<typeof app.inject>>][] = [
      ["401 sem token", await app.inject({ method: "GET", url: "/v1/projecoes/grade-leitos" })],
      [
        "400 sem Idempotency-Key",
        await app.inject({ method: "POST", url: "/v1/ingestao/observacoes", headers: AUTH_G7, payload: {} }),
      ],
      [
        "400 envelope malformado",
        await app.inject({
          method: "POST",
          url: "/v1/ingestao/observacoes",
          headers: { ...AUTH_G7, "idempotency-key": "SYNTH-IDEM-SEG-ERRO-1" },
          payload: { encontroId: "", leitoId: "", pacienteRef: "", observacoes: [] },
        }),
      ],
      [
        "404 alerta inexistente",
        await app.inject({
          method: "POST",
          url: "/v1/alertas/SYNTH-ALERTA-INEXISTENTE/reconhecer",
          headers: { ...AUTH_G7, "if-match": "0" },
        }),
      ],
      [
        "412 conflito de versão",
        await app.inject({
          method: "POST",
          url: `/v1/alertas/${alertaG7}/reconhecer`,
          headers: { ...AUTH_G7, "if-match": "77" },
        }),
      ],
      [
        "428 sem If-Match",
        await app.inject({ method: "POST", url: `/v1/alertas/${alertaG7}/reconhecer`, headers: AUTH_G7 }),
      ],
      [
        "422 envelope incoerente com o encontro",
        await app.inject({
          method: "POST",
          url: "/v1/ingestao/observacoes",
          headers: { ...AUTH_G7, "idempotency-key": "SYNTH-IDEM-SEG-ERRO-2" },
          payload: {
            encontroId: ENC_P002.id,
            leitoId: ENC_P002.bedId,
            pacienteRef: generateSyntheticPsr("OUTRO-PACIENTE"),
            observacoes: serieCompleta(tempoClinicoFresco()),
          },
        }),
      ],
    ];

    for (const [rotulo, r] of respostas) {
      expect(r.statusCode, `${rotulo} não devolveu erro`).toBeGreaterThanOrEqual(400);
      expect(r.headers["content-type"], `${rotulo} sem problem+json`).toContain("problem+json");
      corpoNaoVazaDetalheInterno(r.body, rotulo);
      const problema = r.json() as ProblemDetails;
      expect(problema.title.length).toBeGreaterThan(0);
      expect(problema.detail.length).toBeGreaterThan(0);
    }
  }, TEMPO_LIMITE_MS);

  it("SEC-0015 — falha interna do banco vira 500 genérico em problem+json, sem texto de exceção nem pista de tecnologia", async () => {
    // Servidor descartável, com o banco fechado por baixo: qualquer rota de
    // dados falha no acesso ao armazenamento.
    const dbQuebrado = createInMemoryDatabase();
    await bootstrapDatabase(dbQuebrado);
    await loadIntoDatabase(dbQuebrado);
    const appQuebrado = await buildServer({ db: dbQuebrado });
    await dbQuebrado.close();

    try {
      const r = await appQuebrado.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: AUTH_G7,
      });
      expect(r.statusCode).toBe(500);
      expect(r.headers["content-type"]).toContain("problem+json");
      corpoNaoVazaDetalheInterno(r.body, "500 interno");
      expect((r.json() as ProblemDetails).detail).toBe("Falha inesperada ao processar a requisição.");
    } finally {
      try {
        await appQuebrado.close();
      } catch {
        // o gancho onClose tenta fechar um banco já fechado — irrelevante aqui.
      }
    }
  }, TEMPO_LIMITE_MS);

  /**
   * ACHADO-02 (prioridade MÉDIA) — não consertado: consertar exige mexer em
   * `apps/api/src/routes.ts` (código de produção), fora do escopo deste
   * agente.
   *
   * SAF-0026 e SEC-0015 exigem que identificadores não apareçam em corpos de
   * erro. O envelope `application/problem+json` preenche `instance` com
   * `request.url`, e a rota de avaliações carrega o `portable_subject_ref`
   * no caminho — logo o identificador do sujeito volta dentro do corpo de
   * erro. Severidade limitada: o valor é o que o PRÓPRIO chamador enviou
   * (não há divulgação a terceiro NESTA resposta); mas corpos de erro são
   * rotineiramente registrados por proxies, consoles e coletores, e é
   * exatamente esse o caminho descrito em HAZ-0028.
   *
   * Encaminhamento sugerido (fora deste escopo): `instance` como referência
   * opaca de ocorrência (ex.: o id de correlação já emitido em
   * `x-correlation-id`) em vez da URL crua.
   */
  // ACHADO-02 CORRIGIDO no mesmo ciclo: `instance` passou a ser a URN opaca
  // de ocorrência (`urn:intensicare:requisicao:<id>`), correlacionável com a
  // auditoria pelo cabeçalho `x-correlation-id` — exatamente o
  // encaminhamento sugerido acima. O teste deixou de ser `it.fails`.
  it(
    "SAF-0026/SEC-0015 — o corpo de erro não contém o identificador de sujeito; `instance` é URN opaca de ocorrência",
    async () => {
      const r = await app.inject({
        method: "GET",
        url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
        headers: AUTH_X,
      });
      expect(r.statusCode).toBe(404);
      expect(decodeURIComponent(r.body)).not.toContain(P002.subjectRef);
      expect(r.json().instance).toMatch(/^urn:intensicare:requisicao:/);
    },
    TEMPO_LIMITE_MS,
  );
});

// ---------------------------------------------------------------------------
// I. Concorrência e atribuição em ação clínica
//    SEC-0027, SAF-0017 | THR-0043, THR-0044 | HAZ-0023
// ---------------------------------------------------------------------------

describe("I. ação clínica exige token de concorrência e ator identificado", () => {
  it("SEC-0027/SAF-0017 — sem If-Match (428) ou com If-Match não numérico (400) o comando é recusado e nada muda", async () => {
    const antes = await withTenantTransaction(db, TENANT_G7, (tx) => getWorkItem(tx, alertaG7));

    const semIfMatch = await app.inject({
      method: "POST",
      url: `/v1/alertas/${alertaG7}/reconhecer`,
      headers: AUTH_G7,
    });
    expect(semIfMatch.statusCode).toBe(428);

    for (const ifMatch of ["abc", "-1", "1.5", "0; drop table work_items", " ", "0 or 1=1"]) {
      const r = await app.inject({
        method: "POST",
        url: `/v1/alertas/${alertaG7}/reconhecer`,
        headers: { ...AUTH_G7, "if-match": ifMatch },
      });
      expect(r.statusCode, `If-Match aceito indevidamente: ${JSON.stringify(ifMatch)}`).toBe(400);
      corpoNaoVazaDetalheInterno(r.body, `400 If-Match ${ifMatch}`);
    }

    const depois = await withTenantTransaction(db, TENANT_G7, (tx) => getWorkItem(tx, alertaG7));
    expect(depois?.state).toBe(antes?.state);
    expect(depois?.version).toBe(antes?.version);
  }, TEMPO_LIMITE_MS);

  it("HAZ-0023/SEC-0027 — dois atores com a MESMA versão: o segundo recebe 412 e a atribuição do primeiro é preservada (nunca last-write-wins)", async () => {
    // Alerta próprio para esta corrida (o do bootstrap é usado por outros casos).
    const ingestao = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_G7, "idempotency-key": "SYNTH-IDEM-SEG-CORRIDA" },
      payload: {
        encontroId: ENC_P002.id,
        leitoId: ENC_P002.bedId,
        pacienteRef: P002.subjectRef,
        contexto: { idadeAnos: 62 },
        observacoes: serieCompleta(tempoClinicoFresco()),
      },
    });
    const alvo = String((ingestao.json() as IngestaoObservacoesResposta).alerta?.id);
    expect(alvo).not.toBe("undefined");

    const primeiroAtor = "SYNTH-MEDICO-PRIMEIRO";
    const segundoAtor = "SYNTH-MEDICO-SEGUNDO";

    const primeira = await app.inject({
      method: "POST",
      url: `/v1/alertas/${alvo}/reconhecer`,
      headers: { authorization: `Bearer ${gerarTokenSintetico(TENANT_G7, primeiroAtor)}`, "if-match": "0" },
    });
    expect(primeira.statusCode).toBe(200);

    // O segundo ator ainda via a versão 0 (leu a grade antes da primeira ação).
    const segunda = await app.inject({
      method: "POST",
      url: `/v1/alertas/${alvo}/reconhecer`,
      headers: { authorization: `Bearer ${gerarTokenSintetico(TENANT_G7, segundoAtor)}`, "if-match": "0" },
    });
    expect(segunda.statusCode).toBe(412);

    const item = await withTenantTransaction(db, TENANT_G7, (tx) => getWorkItem(tx, alvo));
    expect(item?.state).toBe("reconhecido");
    expect(item?.assigneeId).toBe(primeiroAtor);

    // A recusa do segundo ator ficou registrada com o ator correto.
    const auditoria = await withTenantTransaction(db, TENANT_G7, (tx) => listAuditEvents(tx));
    expect(
      auditoria.some((a) => a.actorId === segundoAtor && a.newState === "recusada" && a.aggregateId === alvo),
    ).toBe(true);
    // E nenhuma transição foi atribuída ao segundo ator.
    expect(auditoria.some((a) => a.actorId === segundoAtor && a.newState === "reconhecido")).toBe(false);
  }, TEMPO_LIMITE_MS);
});
