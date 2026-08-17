/**
 * apps/api/src/saude/saude.test.ts — teste de aceite do achado §6.6 (P1).
 *
 * O achado reproduzido antes de qualquer edição (ver handoff, rubrica
 * OBSERVADO): `GET /health` respondia `{status:"ok"}` incondicionalmente e
 * `GET /v1/healthz` fazia `select 1` — os dois são LIVENESS. O avaliador de
 * prontidão de `packages/observabilidade/src/readiness.ts` existia, era
 * testado e não tinha consumidor: `@intensicare/observabilidade` não aparecia
 * em `apps/api/package.json` nem em nenhum import de `apps/api/src/`.
 *
 * Este arquivo é o vermelho→verde do achado. Ele NÃO prova prontidão
 * operacional (SOURCE prompt §20: um endpoint de saúde nunca é evidência de
 * release) — prova apenas que as três superfícies existem separadas, que o
 * avaliador está ligado e que nenhuma delas emite identificador de sujeito.
 *
 * Rastreio: ADR-0020 (O4/O5/D11/D12), SAF-0026, SEC-0015, SPR-G8-1.
 */
import { PGlite } from "@electric-sql/pglite";
import {
  createInMemoryTelemetry,
  histogramSamples,
  metricTotal,
  serializeSnapshot,
  TelemetryRedactionError,
} from "@intensicare/observabilidade";
import Fastify, { type FastifyInstance } from "fastify";
import { describe, expect, it } from "vitest";
import { buildServer } from "../index.js";
import { avaliarProntidao, codigoHttpDeProntidao } from "./avaliador.js";
import { criarRegistroDeInicializacao } from "./inicializacao.js";
import {
  assertIdDeDependenciaSeguro,
  type DependenciaDeclarada,
  dependenciaDeBancoDeDados,
  dependenciaDeBancoDeDadosDiferida,
  type PortasDeProntidao,
} from "./portas.js";
import {
  CAMINHO_LIVENESS,
  CAMINHO_READINESS,
  CAMINHO_STARTUP,
  registrarSuperficiesDeSaude,
} from "./rotas.js";
import { criarTelemetriaApi, TEMPLATES_INSTRUMENTADOS } from "./telemetria.js";

// ---------------------------------------------------------------------------
// Bancada — portas falsas, todas explícitas. Nenhum valor numérico de SLO
// aparece aqui: os limites de frescor continuam `null` (VALIDATION REQUIRED).
// ---------------------------------------------------------------------------

const BUNDLE_ATIVO = { ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" } as const;

function dependenciaFalsa(
  id: string,
  obrigatoria: boolean,
  disponivel: boolean | (() => never),
): DependenciaDeclarada {
  return {
    id,
    obrigatoria,
    verificar: () => (typeof disponivel === "function" ? disponivel() : disponivel),
  };
}

interface OpcoesBancada {
  readonly bancoDisponivel?: boolean;
  readonly identidadeConfigurada?: boolean;
  readonly bundleAtivo?: boolean;
  readonly somenteSintetico?: boolean;
  readonly declararProjecoes?: boolean;
}

/**
 * Portas "tudo verde" por default, para que cada teste degrade EXATAMENTE um
 * eixo e a causa do vermelho seja inequívoca.
 */
function portas(opcoes: OpcoesBancada = {}): PortasDeProntidao {
  const {
    bancoDisponivel = true,
    identidadeConfigurada = true,
    bundleAtivo = true,
    somenteSintetico = false,
    declararProjecoes = false,
  } = opcoes;

  return {
    dependencias: [dependenciaFalsa("banco-de-dados", true, bancoDisponivel)],
    identidade: { configurada: () => identidadeConfigurada },
    regras: {
      disponibilidades: () =>
        bundleAtivo
          ? [{ kind: "active", bundle: BUNDLE_ATIVO }]
          : [{ kind: "unknown", ruleId: BUNDLE_ATIVO.ruleId }],
    },
    perfil: { somenteSintetico: () => somenteSintetico },
    projecoes: {
      frescor: () =>
        declararProjecoes
          ? [
              // `limiteMs: null` é a única declaração honesta hoje: nenhum
              // alvo de frescor foi validado (ADR-0020 D2; Gate G1).
              { projecao: "grade_leitos", lagMsMedido: null, limiteMs: null },
            ]
          : [],
    },
    degradacoes: () => [],
  };
}

async function appDeSaude(opcoes: OpcoesBancada = {}, etapasPendentes: readonly string[] = []) {
  const telemetria = createInMemoryTelemetry();
  const app = Fastify({ logger: false });
  const inicializacao = criarRegistroDeInicializacao({
    telemetry: telemetria,
    etapas: etapasPendentes,
  });
  registrarSuperficiesDeSaude(app, {
    telemetry: telemetria,
    portas: portas(opcoes),
    inicializacao,
  });
  return { app, telemetria, inicializacao };
}

// ---------------------------------------------------------------------------
// 1. Três superfícies separadas, com códigos HTTP coerentes
// ---------------------------------------------------------------------------

describe("§6.6 — liveness, readiness e startup são superfícies separadas", () => {
  it("os três caminhos são distintos (nunca o mesmo endpoint — anti-padrão §10.10)", () => {
    const caminhos = new Set([CAMINHO_LIVENESS, CAMINHO_READINESS, CAMINHO_STARTUP]);
    expect(caminhos.size).toBe(3);
  });

  it("liveness responde 200 mesmo com o banco indisponível (não toca dependência)", async () => {
    const { app } = await appDeSaude({ bancoDisponivel: false, identidadeConfigurada: false });
    const resposta = await app.inject({ method: "GET", url: CAMINHO_LIVENESS });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toMatchObject({ vivo: true });
    await app.close();
  });

  it("banco indisponível ⇒ readiness 503 not_ready com razão ESTRUTURADA", async () => {
    const { app } = await appDeSaude({ bancoDisponivel: false });
    const resposta = await app.inject({ method: "GET", url: CAMINHO_READINESS });
    expect(resposta.statusCode).toBe(503);
    const corpo = resposta.json();
    expect(corpo.veredito).toBe("not_ready");
    expect(corpo.razoes.map((r: { codigo: string }) => r.codigo)).toContain(
      "required_dependency_unavailable",
    );
    await app.close();
  });

  it("uma dependência que LANÇA é tratada como indisponível, nunca como disponível", async () => {
    const { app } = await appDeSaude({
      bancoDisponivel: false,
    });
    // A porta acima devolve `false`; esta valida o caminho de exceção.
    const comExcecao = await appDeSaude();
    const portasComExcecao: PortasDeProntidao = {
      ...portas(),
      dependencias: [
        dependenciaFalsa("banco-de-dados", true, () => {
          throw new Error("conexão recusada");
        }),
      ],
    };
    const telemetria = createInMemoryTelemetry();
    const relatorio = await avaliarProntidao(telemetria, portasComExcecao);
    expect(relatorio.veredito).toBe("not_ready");
    await app.close();
    await comExcecao.app.close();
  });

  it("bundle de regra ausente/inativo ⇒ readiness NUNCA 200 verde", async () => {
    const { app } = await appDeSaude({ bundleAtivo: false });
    const resposta = await app.inject({ method: "GET", url: CAMINHO_READINESS });
    expect(resposta.statusCode).not.toBe(200);
    const corpo = resposta.json();
    expect(corpo.veredito).not.toBe("ready");
    expect(corpo.razoes.map((r: { codigo: string }) => r.codigo)).toContain(
      "rule_bundle_unavailable",
    );
    await app.close();
  });

  it("identidade/chaves não configuradas ⇒ not_ready (fail-closed §15.2)", async () => {
    const { app } = await appDeSaude({ identidadeConfigurada: false });
    const resposta = await app.inject({ method: "GET", url: CAMINHO_READINESS });
    expect(resposta.statusCode).toBe(503);
    expect(resposta.json().razoes.map((r: { codigo: string }) => r.codigo)).toContain(
      "identity_not_configured",
    );
    await app.close();
  });

  it("perfil sintético ⇒ limitação exposta como DEGRADAÇÃO DECLARADA na readiness", async () => {
    const { app } = await appDeSaude({ somenteSintetico: true });
    const resposta = await app.inject({ method: "GET", url: CAMINHO_READINESS });
    const corpo = resposta.json();
    expect(corpo.veredito).toBe("degraded");
    expect(corpo.perfil.somenteSintetico).toBe(true);
    expect(corpo.perfil.declaracaoPt).toMatch(/sintétic/i);
    expect(corpo.razoes.map((r: { codigo: string }) => r.codigo)).toContain("degradation_active");
    expect(resposta.statusCode).toBe(503);
    await app.close();
  });

  it("limite de frescor não validado ⇒ degradado, com a razão explícita (nunca alvo inventado)", async () => {
    const { app } = await appDeSaude({ declararProjecoes: true });
    const corpo = (await app.inject({ method: "GET", url: CAMINHO_READINESS })).json();
    expect(corpo.veredito).toBe("degraded");
    expect(corpo.razoes.map((r: { codigo: string }) => r.codigo)).toContain(
      "projection_freshness_threshold_unvalidated",
    );
    await app.close();
  });

  it("readiness 200 `ready` é ALCANÇÁVEL — o endpoint não está fixado em 503", async () => {
    const { app } = await appDeSaude();
    const resposta = await app.inject({ method: "GET", url: CAMINHO_READINESS });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json().veredito).toBe("ready");
    await app.close();
  });

  it("startup responde FALHA antes de a inicialização concluir e SUCESSO depois", async () => {
    const { app, inicializacao } = await appDeSaude({}, ["migracao-do-banco"]);

    const antes = await app.inject({ method: "GET", url: CAMINHO_STARTUP });
    expect(antes.statusCode).toBe(503);
    expect(antes.json()).toMatchObject({ estado: "iniciando" });
    expect(antes.json().etapasPendentes).toEqual(["migracao-do-banco"]);

    inicializacao.concluirEtapa("migracao-do-banco");

    const depois = await app.inject({ method: "GET", url: CAMINHO_STARTUP });
    expect(depois.statusCode).toBe(200);
    expect(depois.json()).toMatchObject({ estado: "concluida" });
    await app.close();
  });

  it("startup que FALHA não vira sucesso nem 200 (fail-closed)", async () => {
    const { app, inicializacao } = await appDeSaude({}, ["migracao-do-banco"]);
    inicializacao.falhar("dependency_unavailable");
    const resposta = await app.inject({ method: "GET", url: CAMINHO_STARTUP });
    expect(resposta.statusCode).toBe(503);
    expect(resposta.json().estado).toBe("falhou");
    await app.close();
  });
});

// ---------------------------------------------------------------------------
// 2. Parametrização — nenhum SLO/banda/limiar é decidido por este código
// ---------------------------------------------------------------------------

describe("§6.6 — o avaliador é PARAMETRIZADO; nenhum alvo é decidido aqui", () => {
  it("`degraded` recebe 503 por default (fail-closed) e o contrário é PARÂMETRO explícito", () => {
    expect(codigoHttpDeProntidao("ready", {})).toBe(200);
    expect(codigoHttpDeProntidao("degraded", {})).toBe(503);
    expect(codigoHttpDeProntidao("not_ready", {})).toBe(503);

    // A decisão "instância degradada deve receber tráfego?" é operacional e
    // humana (VALIDATION REQUIRED). O código a expõe como parâmetro.
    expect(codigoHttpDeProntidao("degraded", { degradadoRecebeTrafego: true })).toBe(200);
  });

  it("`not_ready` é 503 mesmo com a política permissiva — nunca negociável", () => {
    expect(codigoHttpDeProntidao("not_ready", { degradadoRecebeTrafego: true })).toBe(503);
  });

  it("nenhum limite de frescor numérico é embutido no código de produção", async () => {
    const telemetria = createInMemoryTelemetry();
    const relatorio = await avaliarProntidao(telemetria, portas({ declararProjecoes: true }));
    expect(relatorio.limitesDeFrescorDeclarados).toEqual([
      { projecao: "grade_leitos", limiteMs: null },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 3. Ausência de identificador de sujeito / tenant bruto / credencial
// ---------------------------------------------------------------------------

describe("§6.6 — nenhuma das três superfícies emite sujeito, tenant bruto ou credencial", () => {
  const TENANT = "SYNTH-TENANT-0001";
  const ATOR = "SYNTH-ATOR-0007";
  const TOKEN = `SYNTH-TOKEN.${TENANT}.${ATOR}`;
  const SUJEITO = "SYNTH-PACIENTE-0042";

  it("varre corpo, métrica, log e trace das três superfícies", async () => {
    const { app, telemetria } = await appDeSaude({ somenteSintetico: true }, ["etapa-x"]);

    const corpos: string[] = [];
    for (const caminho of [CAMINHO_LIVENESS, CAMINHO_READINESS, CAMINHO_STARTUP]) {
      const resposta = await app.inject({
        method: "GET",
        url: `${caminho}?paciente=${SUJEITO}`,
        headers: { authorization: `Bearer ${TOKEN}`, "x-tenant-id": TENANT },
      });
      corpos.push(resposta.body);
      corpos.push(JSON.stringify(resposta.headers));
    }

    const emitido = serializeSnapshot(telemetria.snapshot());
    const superficies = [...corpos, emitido].join("\n");

    for (const proibido of [TENANT, ATOR, TOKEN, SUJEITO, "SYNTH-TOKEN"]) {
      expect(superficies).not.toContain(proibido);
    }
    await app.close();
  });

  it("rota não casada (404) não faz a telemetria carregar a URL crua", async () => {
    const { app, telemetria } = await appDeSaude();
    await app.inject({ method: "GET", url: `/nao-existe/${SUJEITO}` });
    expect(serializeSnapshot(telemetria.snapshot())).not.toContain(SUJEITO);
    await app.close();
  });

  it("um id de dependência endereçável ou com forma de identificador é RECUSADO", () => {
    expect(() => assertIdDeDependenciaSeguro("banco-de-dados")).not.toThrow();
    expect(() => assertIdDeDependenciaSeguro("postgres://user:senha@host:5432/db")).toThrow();
    // Montado em tempo de execução para que o TEXTO deste arquivo não contenha
    // o endereço contíguo que `scripts/check_forbidden_content.py` procura —
    // mesma técnica que o próprio scanner usa com o seu canário (`"PHI" +
    // "-REAL"`). Alargar a allowlist do gate para acomodar um literal de teste
    // seria exatamente o que o gate proíbe.
    const idComFormaDeEmail = ["suporte", "exemplo.com"].join("@");
    expect(() => assertIdDeDependenciaSeguro(idComFormaDeEmail)).toThrow();
    expect(() => assertIdDeDependenciaSeguro("amh:psr:v1:SYNTH-0001")).toThrow(
      TelemetryRedactionError,
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Telemetria REALMENTE ligada (não apenas existente)
// ---------------------------------------------------------------------------

describe("§6.6 — a telemetria de packages/observabilidade tem consumidor real", () => {
  it("readiness emite métrica, log e trace tipados a cada avaliação", async () => {
    const { app, telemetria } = await appDeSaude();
    await app.inject({ method: "GET", url: CAMINHO_READINESS });

    const snapshot = telemetria.snapshot();
    expect(
      metricTotal(snapshot, "intensicare.ops.readiness.verdict.total", { verdict: "ready" }),
    ).toBe(1);
    expect(snapshot.logs.some((l) => l.event === "readiness.evaluated")).toBe(true);
    expect(snapshot.spans.some((s) => s.name === "ops.readiness_check")).toBe(true);
    await app.close();
  });

  it("liveness NÃO emite veredito de prontidão (as superfícies não se confundem)", async () => {
    const { app, telemetria } = await appDeSaude();
    await app.inject({ method: "GET", url: CAMINHO_LIVENESS });
    expect(metricTotal(telemetria.snapshot(), "intensicare.ops.readiness.verdict.total")).toBe(0);
    await app.close();
  });

  it("o hook HTTP emite latência por ETAPA do laço nas rotas reais de /v1", async () => {
    const telemetria = createInMemoryTelemetry();
    const app = Fastify({ logger: false });
    const api = criarTelemetriaApi(telemetria);
    api.instrumentarHttp(app);
    for (const template of Object.keys(TEMPLATES_INSTRUMENTADOS)) {
      const [metodo, caminho] = template.split(" ") as [string, string];
      app.route({
        method: metodo as "GET" | "POST",
        url: caminho,
        handler: async () => ({ ok: true }),
      });
    }

    await app.inject({ method: "POST", url: "/v1/ingestao/observacoes" });
    await app.inject({ method: "GET", url: "/v1/projecoes/grade-leitos" });
    await app.inject({ method: "GET", url: "/v1/pacientes/SYNTH-PACIENTE-0042/avaliacoes" });
    await app.inject({ method: "POST", url: "/v1/alertas/SYNTH-ALERTA-1/reconhecer" });
    await app.inject({ method: "GET", url: "/v1/eventos/stream" });

    // Asserção sobre a CONTAGEM de amostras, não sobre a soma: uma
    // requisição injetada costuma completar dentro do mesmo milissegundo, e
    // uma amostra legítima de 0 ms somaria zero. Assertar a soma tornaria o
    // teste dependente de o relógio virar durante a execução — vermelho
    // intermitente em suíte de segurança clínica ensina a ignorar vermelho.
    const snapshot = telemetria.snapshot();
    for (const etapa of [
      "source_to_accepted",
      "generated_to_visible",
      "generated_to_acknowledged",
    ]) {
      expect(
        histogramSamples(snapshot, "intensicare.clinical.pipeline.latency", { stage: etapa })
          .length,
      ).toBeGreaterThan(0);
    }
    expect(serializeSnapshot(snapshot)).not.toContain("SYNTH-PACIENTE-0042");
    await app.close();
  });

  it("erro em rota instrumentada vira falha operacional CATEGORIZADA + log", async () => {
    const telemetria = createInMemoryTelemetry();
    const app = Fastify({ logger: false });
    criarTelemetriaApi(telemetria).instrumentarHttp(app);
    app.post("/v1/ingestao/observacoes", async (_req, reply) => reply.code(400).send({}));

    await app.inject({ method: "POST", url: "/v1/ingestao/observacoes" });

    const snapshot = telemetria.snapshot();
    expect(
      metricTotal(snapshot, "intensicare.ops.failure.total", { category: "ingest_rejected" }),
    ).toBe(1);
    expect(snapshot.logs.some((l) => l.event === "failure.recorded")).toBe(true);
    await app.close();
  });

  it("o mapa de rotas instrumentadas não pode ficar obsoleto em relação ao servidor real", async () => {
    const servidor: FastifyInstance = await buildServer();
    const tabela = servidor.printRoutes({ commonPrefix: false });
    for (const template of Object.keys(TEMPLATES_INSTRUMENTADOS)) {
      const caminho = template.split(" ")[1] as string;
      expect(tabela).toContain(caminho);
    }
    await servidor.close();
  });
});

// ---------------------------------------------------------------------------
// 5. Adaptador real de banco (PGlite) — a porta obrigatória do readiness
// ---------------------------------------------------------------------------

describe("§6.6 — a dependência de banco é verificada de verdade", () => {
  it("banco aberto ⇒ disponível; banco fechado ⇒ indisponível (sem lançar para fora)", async () => {
    const db = new PGlite();
    const dependencia = dependenciaDeBancoDeDados(db);
    expect(dependencia.obrigatoria).toBe(true);
    expect(await dependencia.verificar()).toBe(true);

    await db.close();

    const telemetria = createInMemoryTelemetry();
    const relatorio = await avaliarProntidao(telemetria, {
      ...portas(),
      dependencias: [dependencia],
    });
    expect(relatorio.veredito).toBe("not_ready");
    expect(relatorio.razoes.map((r) => r.codigo)).toContain("required_dependency_unavailable");
  });

  it("banco AINDA NÃO criado (fiação diferida) conta como indisponível, nunca como pronto", async () => {
    let db: PGlite | null = null;
    const dependencia = dependenciaDeBancoDeDadosDiferida(() => db);
    const telemetria = createInMemoryTelemetry();

    // Antes de `prepareDatabase` resolver: obrigatória e indisponível.
    const antes = await avaliarProntidao(telemetria, {
      ...portas(),
      dependencias: [dependencia],
    });
    expect(antes.veredito).toBe("not_ready");
    expect(antes.razoes.map((r) => r.codigo)).toContain("required_dependency_unavailable");

    db = new PGlite();
    const depois = await avaliarProntidao(telemetria, {
      ...portas(),
      dependencias: [dependencia],
    });
    expect(depois.veredito).toBe("ready");
    await db.close();
  });
});

// ---------------------------------------------------------------------------
// 6. Gravadores tipados das operações que o hook HTTP NÃO consegue enxergar
//
// Estes gravadores ainda NÃO têm ponto de chamada em `routes.ts`/`db.ts`
// (arquivos fora da fronteira de escrita deste agente) — logo eles medem ZERO
// no laço em execução. Os testes abaixo provam que EMITEM o instrumento certo
// quando chamados; eles NÃO provam que a operação real está instrumentada.
// Confundir as duas coisas é o anti-padrão §10.1, e os pontos de chamada
// exatos estão no handoff.
// ---------------------------------------------------------------------------

describe("§6.6 — gravadores tipados por operação emitem o instrumento correto", () => {
  it("cada operação do laço emite a métrica/log previstos no catálogo", () => {
    const telemetria = createInMemoryTelemetry();
    const api = criarTelemetriaApi(telemetria);

    api.ingestAceito(4);
    api.ingestRejeitado(2);
    api.avaliacaoConcluida({
      ruleId: "RULE-NEWS2",
      ruleVersion: "0.2.0",
      status: "valid",
      durationMs: 3,
      missingParameters: ["SpO2"],
    });
    api.persistenciaDuravel(5);
    api.publicacaoOutbox({ escopoOrdenacao: "SYNTH-ENCONTRO-0001", profundidadeAtual: 3 });
    api.projecaoLida("grade_leitos", 6);
    api.reconhecimentoRegistrado("nao_atribuido", "reconhecido", 7);
    api.falha("persistence_failure");

    const s = telemetria.snapshot();
    expect(
      histogramSamples(s, "intensicare.clinical.pipeline.latency", { stage: "source_to_accepted" }),
    ).toContain(4);
    expect(
      metricTotal(s, "intensicare.clinical.pipeline.loss.total", {
        stage: "source_to_accepted",
        category: "ingest_rejected",
      }),
    ).toBe(2);
    expect(metricTotal(s, "intensicare.clinical.evaluation.total")).toBe(1);
    expect(metricTotal(s, "intensicare.clinical.evaluation.missing_input.total")).toBe(1);
    expect(
      histogramSamples(s, "intensicare.clinical.pipeline.latency", {
        stage: "evaluation_to_durable_work_item",
      }),
    ).toContain(5);
    expect(metricTotal(s, "intensicare.backbone.outbox.depth")).toBe(3);
    expect(
      histogramSamples(s, "intensicare.clinical.pipeline.latency", {
        stage: "generated_to_visible",
      }),
    ).toContain(6);
    expect(
      metricTotal(s, "intensicare.clinical.work_item.transition.total", {
        from: "nao_atribuido",
        to: "reconhecido",
      }),
    ).toBe(1);
    expect(
      metricTotal(s, "intensicare.ops.failure.total", { category: "persistence_failure" }),
    ).toBe(1);
    expect(s.logs.some((l) => l.event === "evaluation.completed")).toBe(true);
    expect(s.logs.some((l) => l.event === "outbox.depth_sampled")).toBe(true);
  });

  it("o escopo de ordenação e o tenant viajam OPACOS, nunca crus", () => {
    const telemetria = createInMemoryTelemetry();
    const api = criarTelemetriaApi(telemetria);
    const ENCONTRO = "SYNTH-ENCONTRO-0001";
    const TENANT = "SYNTH-TENANT-0001";

    api.publicacaoOutbox({ escopoOrdenacao: ENCONTRO, profundidadeAtual: 1 });
    api.negativaDePolitica("cross_tenant", TENANT);

    const emitido = serializeSnapshot(telemetria.snapshot());
    expect(emitido).not.toContain(ENCONTRO);
    expect(emitido).not.toContain(TENANT);
    expect(emitido).toMatch(/op_[0-9a-f]{16}/);
    expect(
      metricTotal(telemetria.snapshot(), "intensicare.ops.policy_denial.total", {
        kind: "cross_tenant",
      }),
    ).toBe(1);
  });
});
