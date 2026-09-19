/**
 * apps/api/src/db.test.ts — duas verificações independentes sobre `db.ts`:
 *
 * TAREFA 1 (abaixo, condicionada a PostgreSQL real): `prepareDatabase` RECUSA
 * o boot do perfil endurecido quando falta o FECHO DE RUNTIME da migração
 * `0006_ancora_isolada.sql`.
 *
 * ACH-O3-3 (no fim do arquivo, sem dependência de PostgreSQL real): o ramo de
 * REPLAY de `ingestObservations` não republica o blob de `idempotency_records`
 * verbatim, e o `status_code` da linha não decide o código HTTP.
 *
 * ---------------------------------------------------------------------------
 * TAREFA 1: prova que `prepareDatabase` (o boot real do perfil que usa
 * PostgreSQL) RECUSA quando o banco não tem o FECHO DE RUNTIME da migração
 * `packages/persistencia/src/migrations/0006_ancora_isolada.sql`.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * ----------------------------
 * `ConfiguracaoPostgres.exigirFechoDeRuntime`
 * (`packages/persistencia/src/postgres/pool.ts`) já existia e já era
 * exercitado — mas só do lado de `packages/persistencia`, chamando
 * `AdaptadorPostgres.abrir` diretamente. O que faltava não era o fecho: era a
 * FIAÇÃO. `apps/api/src/db.ts::prepareDatabase` nunca passava a opção
 * adiante, e por isso a AUSÊNCIA do fecho nunca era detectada em runtime pelo
 * processo real — o que o despacho descreve como "sem ela a ausência do fecho
 * não é detectada em runtime".
 *
 * Um teste que só verificasse que o campo foi passado ao objeto de
 * configuração seria asserção de FORMA — o despacho recusa explicitamente
 * esse tipo de prova. Este arquivo exercita COMPORTAMENTO: um banco real,
 * provisionado SEM o fecho, precisa fazer `prepareDatabase` — com uma
 * `ConfiguracaoRuntime` de perfil endurecido genuína, construída por
 * `carregarConfiguracao`, exatamente como o bootstrap real faria — REJEITAR,
 * nomeando (F1)/(F2). O MESMO banco, com o fecho instalado, precisa deixar
 * `prepareDatabase` abrir normalmente: a prova de que a guarda não está seguro
 * porque quebrou tudo.
 *
 * DISPONIBILIDADE DE POSTGRESQL REAL — leia antes de "pular" este arquivo
 * ------------------------------------------------------------------------
 * Este arquivo NÃO provisiona seu próprio cluster efêmero. Isso já é
 * responsabilidade de `packages/persistencia/src/postgres/
 * fronteira-postgres.test.ts` (via `scripts/pg-efemero.mjs`), e duplicar o
 * aparato de bootstrap aqui multiplicaria o custo — e o risco de duas
 * inicializações concorrentes disputando o mesmo ponteiro de cluster — de
 * rodar `pnpm verify`/`pnpm test` na raiz (REGRA DE MÁQUINA do despacho: a
 * fronteira real é a execução mais cara do repositório). Em vez disso, este
 * arquivo só ativa quando o ambiente JÁ anuncia um servidor pronto:
 * `PG_TEST_URL` ou `DATABASE_URL` — o mesmo par que `scripts/pg-efemero.mjs`
 * e a suíte de fronteira reconhecem, e o mesmo mecanismo que CI usa com
 * `services: postgres`. Sem um dos dois:
 *   - com `IC_FRONTEIRA_PG=obrigatoria` ou em CI, a suíte FALHA alto, com a
 *     instrução exata (nunca `expected fail`; anti-padrão 7/16);
 *   - em desenvolvimento comum, é pulada com aviso RUIDOSO — nunca em
 *     silêncio (anti-padrão 7/16 do contrato de agentes).
 *
 * Para rodar localmente (fora deste processo, sequencialmente — nunca junto
 * com outra suíte que também provisione cluster):
 *   1. node scripts/pg-efemero.mjs up --silencioso   # imprime JSON com a URL
 *   2. export PG_TEST_URL=<urlSuperusuario da saída acima>
 *   3. pnpm --filter @intensicare/api test -- --run src/db.test.ts
 *
 * Dados 100% sintéticos (marcador `SYNTH-`, política GDEC-0014).
 */
import { createHash } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import type { IngestaoObservacoesResposta } from "@intensicare/contratos";
import { buildG7SyntheticScenario, loadIntoDatabase } from "@intensicare/fixtures-sinteticas";
import {
  bootstrapDatabase,
  createInMemoryDatabase,
  ErroIdentidadeInsegura,
  nomeDeBancoDeVerificacao,
  opcoesDaUrl,
  provisionarBanco,
  withTenantTransaction,
} from "@intensicare/persistencia";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { gerarTokenSintetico } from "./auth.js";
import { carregarConfiguracao } from "./config/index.js";
import { prepareDatabase } from "./db.js";
import { buildServer } from "./index.js";

/** Provisionamento + migração de uma base real leva alguns segundos em rede local. */
const TEMPO_LIMITE_MS = 60_000;

const pgTestUrl = process.env.PG_TEST_URL ?? process.env.DATABASE_URL;

const fronteiraExigida =
  process.env.IC_FRONTEIRA_PG === "obrigatoria" ||
  (process.env.CI !== undefined && process.env.CI !== "" && process.env.CI !== "false");

/**
 * Ambiente mínimo COMPLETO de um perfil endurecido conectado a PostgreSQL
 * real, no MESMO padrão de `config/carregar.test.ts`
 * (`AMBIENTE_ENDURECIDO_COMPLETO`): host/emissor sintéticos no TLD reservado
 * `.invalid` (RFC 2606), e `IC_BANCO_URL` SEM credencial embutida (anti-padrão
 * 12) — a credencial do papel de aplicação vem separada, dos valores que
 * `provisionarBanco` devolveu, exatamente como `config/carregar.ts` exige.
 */
function ambienteComPostgresReal(
  urlAplicacao: string,
  sobrepor: Readonly<Record<string, string | undefined>> = {},
): Record<string, string | undefined> {
  const opcoes = opcoesDaUrl(urlAplicacao);
  return {
    PERFIL: "integration",
    IC_BANCO_MODO: "postgres",
    IC_BANCO_URL: `postgresql://${opcoes.host}:${String(opcoes.porta)}/${opcoes.banco}`,
    IC_BANCO_USUARIO: opcoes.usuario,
    IC_BANCO_SENHA: opcoes.senha,
    IC_BANCO_SEMEAR_FIXTURES: "nao",
    IC_IDENTIDADE_MODO: "oidc",
    IC_IDENTIDADE_EMISSOR: "https://identidade.invalid/realms/intensicare",
    IC_IDENTIDADE_AUDIENCIA: "intensicare-api",
    IC_IDENTIDADE_JWKS_URL: "https://identidade.invalid/realms/intensicare/jwks",
    IC_BUNDLE_REGRA_CAMINHO: "/opt/intensicare/bundles/news2.bundle",
    IC_BUNDLE_REGRA_CHAVE_PUBLICA: "SYNTH-CHAVE-PUBLICA-DE-TESTE",
    ...sobrepor,
  };
}

if (pgTestUrl === undefined) {
  const instrucoes =
    "PostgreSQL real não configurado nesta execução (PG_TEST_URL/DATABASE_URL ausentes). " +
    "Para exercitar: suba um cluster efêmero (node scripts/pg-efemero.mjs up --silencioso) " +
    "e exporte a URL de superusuário devolvida como PG_TEST_URL, ou aponte para um servidor " +
    "já existente. Para exigir a verificação (e falhar quando faltar): " +
    "IC_FRONTEIRA_PG=obrigatoria.";

  if (fronteiraExigida) {
    describe("prepareDatabase — fecho de runtime (0006) contra PostgreSQL real", () => {
      it("PostgreSQL é OBRIGATÓRIO nesta verificação e não está disponível", () => {
        throw new Error(instrucoes);
      });
    });
  } else {
    // Aviso RUIDOSO: pular em silêncio transformaria uma verificação P0
    // ausente em pipeline verde (anti-padrão 7 e 16 do contrato de agentes).
    process.stderr.write(`\n${"=".repeat(78)}\n  ${instrucoes}\n${"=".repeat(78)}\n\n`);
    describe.skip(`prepareDatabase contra PostgreSQL real PULADO — ${instrucoes}`, () => {
      it("não executado", () => undefined);
    });
  }
} else {
  describe("prepareDatabase — o fecho de runtime da 0006 é exigido fora de perfil sintético", () => {
    it(
      "banco SEM o fecho: prepareDatabase recusa o boot do perfil real, nomeando (F1) e (F2)",
      async () => {
        const banco = await provisionarBanco({
          urlSuperusuario: pgTestUrl,
          banco: nomeDeBancoDeVerificacao("intensicare_api_sem_fecho"),
          recriarBanco: true,
          fechoDeRuntime: false,
        });
        expect(
          banco.fechoDeRuntimeInstalado,
          "pré-condição do cenário: o banco de ataque precisa nascer SEM o fecho",
        ).toBe(false);

        const config = carregarConfiguracao(ambienteComPostgresReal(banco.urlAplicacao));
        expect(config.classePerfil).toBe("integracao");

        let erroCapturado: unknown;
        try {
          const porta = await prepareDatabase(config);
          await porta.encerrar();
        } catch (erro) {
          erroCapturado = erro;
        }

        expect(
          erroCapturado,
          "prepareDatabase ACEITOU um banco sem o fecho de runtime da 0006 — a fiação de " +
            "exigirFechoDeRuntime não está armada (ou não está armada para este perfil)",
        ).toBeInstanceOf(ErroIdentidadeInsegura);
        const motivos = (erroCapturado as ErroIdentidadeInsegura).motivos;
        expect(
          motivos.some((m) => m.includes("(F1)")),
          motivos.join(" | "),
        ).toBe(true);
        expect(
          motivos.some((m) => m.includes("(F2)")),
          motivos.join(" | "),
        ).toBe(true);
      },
      TEMPO_LIMITE_MS,
    );

    it(
      'banco COM o fecho: prepareDatabase abre normalmente — a guarda não está "segura porque quebrou tudo"',
      async () => {
        const banco = await provisionarBanco({
          urlSuperusuario: pgTestUrl,
          banco: nomeDeBancoDeVerificacao("intensicare_api_com_fecho"),
          recriarBanco: true,
        });
        expect(banco.fechoDeRuntimeInstalado).toBe(true);

        const config = carregarConfiguracao(ambienteComPostgresReal(banco.urlAplicacao));
        const porta = await prepareDatabase(config);
        try {
          expect(porta.rotulo).toBe("postgres");
          expect(porta.fronteiraDeIsolamentoVerificavel).toBe(true);
        } finally {
          await porta.encerrar();
        }
      },
      TEMPO_LIMITE_MS,
    );

    it(
      "perfil sintético apontado para PostgreSQL real NÃO exige o fecho (sem alegação de fronteira verificável)",
      async () => {
        // Mesma base "sem fecho" do primeiro caso — mas agora com um perfil
        // SINTÉTICO (`test`) apontado para ela via IC_BANCO_MODO=postgres.
        // `exigirFronteiraVerificavel` já retorna cedo para esta classe (não
        // há alegação de isolamento verificável a honrar), e por isso também
        // não exigimos o fecho de runtime — ligar isso globalmente decidiria
        // uma topologia que não é deste arquivo (contrato de agentes §3).
        const banco = await provisionarBanco({
          urlSuperusuario: pgTestUrl,
          banco: nomeDeBancoDeVerificacao("intensicare_api_sintetico_pg"),
          recriarBanco: true,
          fechoDeRuntime: false,
        });
        expect(banco.fechoDeRuntimeInstalado).toBe(false);

        const config = carregarConfiguracao(
          ambienteComPostgresReal(banco.urlAplicacao, {
            PERFIL: "test",
            IC_IDENTIDADE_MODO: "token-sintetico",
            IC_IDENTIDADE_EMISSOR: undefined,
            IC_IDENTIDADE_AUDIENCIA: undefined,
            IC_IDENTIDADE_JWKS_URL: undefined,
            IC_BUNDLE_REGRA_CAMINHO: undefined,
            IC_BUNDLE_REGRA_CHAVE_PUBLICA: undefined,
          }),
        );
        expect(config.classePerfil).toBe("sintetico");

        const porta = await prepareDatabase(config);
        try {
          expect(porta.rotulo).toBe("postgres");
        } finally {
          await porta.encerrar();
        }
      },
      TEMPO_LIMITE_MS,
    );
  });
}

// ===========================================================================
// ACH-O3-3 (P0) — o replay de idempotência republicava corpo E status do banco
// ===========================================================================
//
// O ACHADO, REPRODUZIDO ANTES DE QUALQUER EDIÇÃO
// ----------------------------------------------
// `ACH-REV8-3` foi fechado em DUAS superfícies de leitura
// (`getPatientEvaluations`, `projectBedGrid`). Existe uma TERCEIRA que nunca
// esteve naquele escopo: o ramo `replayed` de `ingestObservations`, que fazia
//
//   return { kind: "replayed", statusCode: existing.statusCode,
//            body: existing.responseBody }        // apps/api/src/db.ts
//   return reply.code(resultado.statusCode).send(resultado.body);  // routes.ts
//
// — os dois valores lidos de `idempotency_records`, sem `lerModoDeDespacho`,
// sem `resultadoPersistidoPublicavel`, SEM AUTORIDADE. A migração
// `packages/persistencia/src/migrations/0002_g7_integration.sql:72` concede
// `insert` nessa tabela ao papel da APLICAÇÃO, e a guarda
// `existing.requestHash !== args.requestHash` não protege nada: quem insere a
// linha escolhe o `request_hash`.
//
// Reprodução OBSERVADA em 2026-08-18 contra `HEAD` `700b13e`, com PGlite real
// e `buildServer` real:
//
//   BASELINE status = 201 ; despacho.acionavel = false ; rotuloPt = "SOMBRA — …"
//   FORJA    status = 200 ; despacho.acionavel = true  ;
//            rotuloPt = "ACIONÁVEL — conduta clínica autorizada."
//   FORJA    corpo contém "acionavel":true = true
//
// O QUE ESTE ARQUIVO EXIGE
// ------------------------
// 1. O corpo do replay é RECONSTRUÍDO por este processo, e a parte que alega
//    autoridade (`avaliacao.despacho`) passa pela MESMA submissão ao catálogo
//    do runtime que as outras duas leituras já sofrem
//    (`resultadoPersistidoPublicavel`, `apps/api/src/regras/exposicao.ts`).
// 2. O `status_code` da linha NÃO decide o código HTTP. O `openapi.yaml` já
//    declara 201 para o replay ("Cabeçalho `Idempotency-Replayed: false` numa
//    primeira chamada, `true` num reenvio da mesma chave", sob a resposta
//    "201"); ler o código do banco permitia à linha forjada emitir um status
//    que o contrato nem documenta.
// 3. Corpo armazenado que não reconstrói NÃO é publicado — nem "lavado".
//
// O QUE ESTE FECHO **NÃO** COBRE — `ACH-O3-1`, ABERTO
// ---------------------------------------------------
// Exatamente o mesmo limite já declarado em `regras/exposicao.ts` e
// `regras/autoridade.test.ts`: escore, banda, status, motivos, anotações e
// explicação do `avaliacao` persistido continuam republicados VERBATIM. Quem
// escreve no banco ainda fabrica UM ESCORE — só não fabrica uma RECOMENDAÇÃO
// ACIONÁVEL nem um código HTTP. O último caso deste bloco torna esse limite
// VISÍVEL por asserção; ele NÃO aprova o comportamento.
//
// Nada aqui torna via clínica alguma acionável: estado factual preservado —
// 0 vias acionáveis, 47/47 inelegíveis, ADR-0007 C5 ABERTA. Todo dado é
// sintético (prefixo `SYNTH-`).
//
// Rastreio: ACH-O3-3 (este fecho), ACH-REV8-3 (as duas superfícies anteriores),
// ACH-O3-1 (ABERTO), ADR-0007, ADR-0008 §8.3, ADR-0011 P8, QAS-0023, HAZ-0005.

const cenarioIdem = buildG7SyntheticScenario();
const TENANT_IDEM = cenarioIdem.organization.id;
const PACIENTE_IDEM = cenarioIdem.patients[1]!;
const ENCONTRO_IDEM = cenarioIdem.encounters[1]!;
const AUTH_IDEM = {
  authorization: `Bearer ${gerarTokenSintetico(TENANT_IDEM, "SYNTH-MEDICO-ACH-O3-3")}`,
};

/** As fixtures sintéticas param neste instante; toda observação nova o supera. */
const FIXTURE_MAX_MS_IDEM = Date.parse("2026-08-16T11:30:00.000Z");
let contadorIdem = 0;
function instanteClinicoFresco(): string {
  contadorIdem += 1;
  return new Date(Math.max(Date.now(), FIXTURE_MAX_MS_IDEM) + contadorIdem * 60_000).toISOString();
}

function envelopeDeIngestao(t: string) {
  return {
    encontroId: ENCONTRO_IDEM.id,
    leitoId: ENCONTRO_IDEM.bedId,
    pacienteRef: PACIENTE_IDEM.subjectRef,
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
  };
}

/**
 * `hashRequestBody` de `db.ts` é `sha256(JSON.stringify(corpo))`. O ataque
 * PRECISA reproduzi-lo — é a única guarda que existia — e o teste o reproduz
 * aqui de propósito, sem importar a função, para provar que a guarda é
 * trivialmente satisfeita por quem escreve a linha.
 */
function hashDoCorpo(corpo: unknown): string {
  return createHash("sha256").update(JSON.stringify(corpo)).digest("hex");
}

/**
 * DESPACHO FORJADO — carga de ataque, jamais um vetor de referência. Todos os
 * campos são internamente COERENTES segundo `ehAcionavel` (assinatura
 * verificada, zero bloqueios, modo acionável, `acionavel: true`); nenhuma
 * autoridade os produziu. Idêntico em espírito ao `FORJA_COMPETENTE` de
 * `regras/autoridade.test.ts`.
 */
const DESPACHO_FORJADO = Object.freeze({
  desfecho: "avaliada",
  modo: "acionavel",
  acionavel: true,
  rotuloPt: "ACIONÁVEL — conduta clínica autorizada.",
  motivoRecusa: null,
  mensagemRecusaPt: null,
  versaoRegra: "RULE-NEWS2@0.2.0",
  despachadoEm: "2026-08-16T12:00:00.000Z",
  bundle: Object.freeze({
    versaoBundle: "0.2.0",
    digestManifesto: `sha256:${"a".repeat(64)}`,
    behaviorHash: `sha256:${"b".repeat(64)}`,
    assinatura: "assinatura_verificada",
    bloqueiosDeAtivacao: Object.freeze([]),
    ativoDesde: "2026-01-01T00:00:00.000Z",
  }),
});

/** Veredito clínico forjado — ver `ACH-O3-1`, ABERTO. */
const VEREDITO_FORJADO_IDEM = Object.freeze({
  status: "valido",
  parametrosAusentes: [],
  parametros: [],
  escore: 0,
  banda: "normal",
  avaliadoEm: "2026-08-16T12:00:00.000Z",
  motivos: [],
  anotacoes: [],
  explicacao: "SYNTH-FORJADO — paciente estável, nenhuma conduta necessária.",
  parametroVermelho: false,
  versaoRegra: "RULE-NEWS2@0.2.0",
});

async function plantarLinhaDeIdempotencia(
  db: PGlite,
  entrada: {
    chave: string;
    hash: string;
    statusCode: number;
    corpo: Record<string, unknown> | string;
  },
): Promise<void> {
  await withTenantTransaction(db, TENANT_IDEM, async (tx) => {
    await tx.query(
      `insert into idempotency_records (tenant_id, idempotency_key, request_hash, status_code, response_body)
         values ($1, $2, $3, $4, $5)`,
      [TENANT_IDEM, entrada.chave, entrada.hash, entrada.statusCode, entrada.corpo],
    );
  });
}

describe("ACH-O3-3: o replay de idempotência não republica o blob do banco", () => {
  let db: PGlite;
  let app: FastifyInstance;
  /** Corpo do pedido legítimo — reusado como âncora e como alvo da forja. */
  let pedidoLegitimo: ReturnType<typeof envelopeDeIngestao>;
  let alertaOriginal: string | undefined;

  beforeAll(async () => {
    db = createInMemoryDatabase();
    await bootstrapDatabase(db);
    await loadIntoDatabase(db);
    app = await buildServer({ db });
    pedidoLegitimo = envelopeDeIngestao(instanteClinicoFresco());
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it("ÂNCORA DE NÃO-VACUIDADE: o caminho legítimo devolve 201 e NÃO acionável", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_IDEM, "idempotency-key": "SYNTH-IDEM-ACH-O3-3-BASE" },
      payload: pedidoLegitimo,
    });
    expect(resposta.statusCode).toBe(201);
    expect(resposta.headers["idempotency-replayed"]).toBe("false");

    const corpo = resposta.json() as IngestaoObservacoesResposta;
    // VALOR, não forma: a via NEWS2 despacha em SOMBRA neste runtime
    // (ADR-0007 C5 aberta ⇒ sem cadeia de assinatura ⇒ nada acionável).
    expect(corpo.avaliacao.despacho?.acionavel).toBe(false);
    expect(corpo.avaliacao.despacho?.modo).toBe("sombra");
    expect(resposta.body).not.toContain('"acionavel":true');
    alertaOriginal = corpo.alerta?.id;
    expect(alertaOriginal).toBeTruthy();
  });

  it("o replay LEGÍTIMO continua 201, com Idempotency-Replayed: true e o MESMO alerta", async () => {
    // Prova de que a correção não está "segura porque quebrou tudo": o replay
    // honesto continua devolvendo a resposta original, inclusive o envelope de
    // despacho em sombra — que é a representação visível da degradação
    // (QAS-0023) e NÃO pode ser apagada pelo fecho.
    const resposta = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_IDEM, "idempotency-key": "SYNTH-IDEM-ACH-O3-3-BASE" },
      payload: pedidoLegitimo,
    });
    expect(resposta.statusCode).toBe(201);
    expect(resposta.headers["idempotency-replayed"]).toBe("true");

    const corpo = resposta.json() as IngestaoObservacoesResposta;
    expect(corpo.alerta?.id).toBe(alertaOriginal);
    expect(corpo.encontroId).toBe(ENCONTRO_IDEM.id);
    expect(corpo.aceitas).toHaveLength(pedidoLegitimo.observacoes.length);
    expect(corpo.avaliacao.despacho?.acionavel).toBe(false);
    expect(corpo.avaliacao.despacho?.modo).toBe("sombra");
  });

  it("linha FORJADA: nem o corpo nem o status atravessam a fronteira HTTP", async () => {
    const chave = "SYNTH-IDEM-ACH-O3-3-FORJADA";
    const corpoForjado = {
      encontroId: ENCONTRO_IDEM.id,
      recebidoEm: "2026-08-16T12:00:00.000Z",
      aceitas: [],
      quarentena: [],
      avaliacao: { ...VEREDITO_FORJADO_IDEM, despacho: DESPACHO_FORJADO },
      alerta: null,
    };
    await plantarLinhaDeIdempotencia(db, {
      chave,
      hash: hashDoCorpo(pedidoLegitimo),
      // 200 é escolha do ATACANTE — e o contrato só documenta 201 no replay.
      statusCode: 200,
      corpo: corpoForjado,
    });

    // Âncora de não-vacuidade: a carga do atacante está mesmo persistida, com
    // a acionabilidade forjada intacta na linha.
    const plantado = await withTenantTransaction(db, TENANT_IDEM, async (tx) => {
      const r = await tx.query<{ response_body: Record<string, unknown>; status_code: number }>(
        "select response_body, status_code from idempotency_records where idempotency_key = $1",
        [chave],
      );
      return r.rows[0];
    });
    expect(plantado, "a linha forjada precisa existir no banco").toBeDefined();
    expect(plantado!.status_code).toBe(200);
    expect(
      (
        (plantado!.response_body.avaliacao as Record<string, unknown>).despacho as {
          acionavel: boolean;
        }
      ).acionavel,
    ).toBe(true);

    const resposta = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_IDEM, "idempotency-key": chave },
      payload: pedidoLegitimo,
    });

    // 1) O status é o do CONTRATO, não o da linha.
    expect(resposta.statusCode).toBe(201);
    expect(resposta.headers["idempotency-replayed"]).toBe("true");

    // 2) VALOR no corpo HTTP: a acionabilidade forjada e o rótulo escolhido
    // pelo atacante NÃO saem no fio.
    const corpo = resposta.json() as IngestaoObservacoesResposta;
    expect(corpo.avaliacao.despacho ?? null).toBeNull();
    expect(resposta.body).not.toContain('"acionavel":true');
    expect(resposta.body).not.toContain("conduta clínica autorizada");

    // 3) O corpo é RECONSTRUÍDO a partir do pedido desta requisição — que o
    // `request_hash` já provou ser idêntico ao original —, e não copiado do
    // blob: `aceitas` vinha vazio na linha forjada.
    expect(corpo.encontroId).toBe(ENCONTRO_IDEM.id);
    expect(corpo.aceitas).toHaveLength(pedidoLegitimo.observacoes.length);
  });

  it("alerta FANTASMA: identificador que não é item de trabalho deste tenant não atravessa", async () => {
    // Classe vizinha e independente do despacho: o atacante desiste da
    // acionabilidade e fabrica só o RESUMO DE ALERTA — id, estado do
    // vocabulário fechado e versão íntegros, apontando para item de trabalho
    // que não existe. Seria estado de fluxo de trabalho inventado numa
    // resposta de ingestão. `respostaDeReplayPublicavel` exige que o item
    // exista NESTE tenant (`getWorkItem`, mesma transação escopada).
    const chave = "SYNTH-IDEM-ACH-O3-3-ALERTA-FANTASMA";
    await plantarLinhaDeIdempotencia(db, {
      chave,
      hash: hashDoCorpo(pedidoLegitimo),
      statusCode: 201,
      corpo: {
        encontroId: ENCONTRO_IDEM.id,
        recebidoEm: "2026-08-16T12:00:00.000Z",
        aceitas: [],
        quarentena: [],
        avaliacao: { ...VEREDITO_FORJADO_IDEM, despacho: null },
        alerta: { id: "SYNTH-ALERTA-FORJADO", estado: "nao-atribuido", versao: 0 },
      },
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_IDEM, "idempotency-key": chave },
      payload: pedidoLegitimo,
    });
    expect(resposta.statusCode).toBe(500);
    expect(resposta.body).not.toContain("SYNTH-ALERTA-FORJADO");

    // Âncora de não-vacuidade: o MESMO resumo, apontando para o item de
    // trabalho REAL criado pela ingestão legítima, atravessa normalmente — a
    // recusa é do identificador fantasma, não de todo resumo de alerta.
    const chaveReal = "SYNTH-IDEM-ACH-O3-3-ALERTA-REAL";
    await plantarLinhaDeIdempotencia(db, {
      chave: chaveReal,
      hash: hashDoCorpo(pedidoLegitimo),
      statusCode: 201,
      corpo: {
        encontroId: ENCONTRO_IDEM.id,
        recebidoEm: "2026-08-16T12:00:00.000Z",
        aceitas: [],
        quarentena: [],
        avaliacao: { ...VEREDITO_FORJADO_IDEM, despacho: null },
        alerta: { id: alertaOriginal, estado: "nao-atribuido", versao: 0 },
      },
    });
    const comAlertaReal = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_IDEM, "idempotency-key": chaveReal },
      payload: pedidoLegitimo,
    });
    expect(comAlertaReal.statusCode).toBe(201);
    expect((comAlertaReal.json() as IngestaoObservacoesResposta).alerta?.id).toBe(alertaOriginal);
  });

  it("corpo armazenado que não reconstrói NÃO é publicado nem lavado", async () => {
    const chave = "SYNTH-IDEM-ACH-O3-3-DEFORMADA";
    await plantarLinhaDeIdempotencia(db, {
      chave,
      hash: hashDoCorpo(pedidoLegitimo),
      statusCode: 201,
      corpo: {
        encontroId: ENCONTRO_IDEM.id,
        recebidoEm: "SYNTH-INSTANTE-QUE-NAO-E-INSTANTE",
        aceitas: [],
        quarentena: [],
        avaliacao: "SYNTH-TEXTO-NO-LUGAR-DA-AVALIACAO",
        alerta: null,
      },
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_IDEM, "idempotency-key": chave },
      payload: pedidoLegitimo,
    });

    expect(resposta.statusCode).toBe(500);
    expect(resposta.headers["content-type"]).toContain("application/problem+json");
    expect(resposta.headers["idempotency-replayed"]).toBeUndefined();
    expect(resposta.body).not.toContain("SYNTH-TEXTO-NO-LUGAR-DA-AVALIACAO");
    expect(resposta.body).not.toContain("SYNTH-INSTANTE-QUE-NAO-E-INSTANTE");
  });

  it("o fecho é PARCIAL: neutraliza o despacho forjado e NÃO o veredito (ACH-O3-1, ABERTO)", async () => {
    // LIMITE CONHECIDO, NÃO COMPORTAMENTO DESEJADO. `resultadoPersistidoPublicavel`
    // submete à autoridade APENAS o envelope de despacho; escore, banda, status
    // e explicação vêm do mesmo blob controlado pelo atacante e são
    // republicados VERBATIM — exatamente como já ocorre em
    // `GET /v1/pacientes/{ref}/avaliacoes` (ACH-O3-1). Estas asserções existem
    // para que o limite FALHE ALTO se alguém o mudar em silêncio; elas NÃO o
    // aprovam. Fechá-lo exige integridade do registro persistido (assinatura de
    // linha, HMAC ou coluna de digest), que depende da MESMA custódia de chave
    // da ADR-0007 C5, ABERTA.
    const chave = "SYNTH-IDEM-ACH-O3-3-VEREDITO";
    await plantarLinhaDeIdempotencia(db, {
      chave,
      hash: hashDoCorpo(pedidoLegitimo),
      statusCode: 201,
      corpo: {
        encontroId: ENCONTRO_IDEM.id,
        recebidoEm: "2026-08-16T12:00:00.000Z",
        aceitas: [],
        quarentena: [],
        avaliacao: { ...VEREDITO_FORJADO_IDEM, despacho: DESPACHO_FORJADO },
        alerta: null,
      },
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH_IDEM, "idempotency-key": chave },
      payload: pedidoLegitimo,
    });
    expect(resposta.statusCode).toBe(201);
    const corpo = resposta.json() as IngestaoObservacoesResposta;

    // FECHADO: acionabilidade forjada não sobrevive.
    expect(corpo.avaliacao.despacho ?? null).toBeNull();
    // ABERTO: o veredito clínico forjado sobrevive.
    expect(corpo.avaliacao.escore).toBe(VEREDITO_FORJADO_IDEM.escore);
    expect(corpo.avaliacao.banda).toBe(VEREDITO_FORJADO_IDEM.banda);
    expect(corpo.avaliacao.explicacao).toBe(VEREDITO_FORJADO_IDEM.explicacao);
  });
});

// ===========================================================================
// ACH-O3-6 (P2) — `replayEvents` e a linha de outbox plantada
// ===========================================================================
//
// O QUE FOI REPRODUZIDO, E O QUE A REPRODUÇÃO REFUTOU
// ---------------------------------------------------
// Com `grant select, insert on outbox_events to intensicare_app`
// (`0001_init.sql:288`), uma linha plantada com `event_type` do mapa
// `OUTBOX_TO_CONTRACT_EVENT` sai no fio. OBSERVADO em 2026-08-18:
//
//   { sequencia: -7, tipo: "avaliacao-computada", tenantId: "SYNTH-TENANT-G7",
//     dados: { campoQueNaoExisteNoSchema: true,
//              despacho: { acionavel: true, rotuloPt: "ACIONÁVEL — …" } } }
//
// Duas coisas distintas nesse quadro, e só UMA delas é violação de contrato:
//
// 1. `dados` ARBITRÁRIO — NÃO é violação. O contrato declara este campo
//    explicitamente NÃO tipado por variante: `packages/contratos/asyncapi.yaml`
//    (schema `EventoFluxo`, campo `dados`: "NÃO é tipado por variante de
//    `tipo` nesta fatia — limitação OBSERVADA e declarada (catálogo §5.3)") e
//    `docs/09-api-events-and-mcp/catalogo-de-eventos.md` §5.3 ("`dados` ainda
//    não é tipado por variante, porque fechar o enum de `event_type` de
//    `WorkItem` depende de o catálogo §2.3 sair de `PROPOSAL`"). Não há
//    "alegação de conformidade" a quebrar: a lacuna está declarada. Validar
//    `dados` exigiria REDIGIR o esquema por variante — decisão de CONTRATO,
//    não tomada aqui (contrato de agentes §3). Ver o handoff.
//
// 2. `sequencia` NEGATIVO — É violação, de cláusula que o contrato NÃO declara
//    aberta: `asyncapi.yaml`, `EventoFluxo.sequencia`, `type: integer,
//    minimum: 0`, "cursor durável de retomada, monotônico e estritamente
//    crescente", que vai também no `id:` do quadro SSE. `id bigserial` começa
//    em 1: nenhum caminho legítimo produz `sequencia <= 0`. Um quadro assim vira
//    cursor de retomada FABRICADO no cliente — e um cliente que o persistisse
//    voltaria a pedir tudo a partir dele.
//
// Rastreio: ACH-O3-6 (fecho PARCIAL — item 2), ADR-0010 B3, ADR-0011 P4/P7.

describe("ACH-O3-6: quadro de fluxo com sequencia não publicável não é emitido", () => {
  it("linha de outbox plantada com id <= 0 não vira quadro; as legítimas continuam saindo", async () => {
    const db = createInMemoryDatabase();
    await bootstrapDatabase(db);
    await loadIntoDatabase(db);

    await withTenantTransaction(db, TENANT_IDEM, async (tx) => {
      await tx.query(
        `insert into outbox_events
           (id, tenant_id, ordering_scope, event_type, aggregate_type, aggregate_id, payload)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          -7,
          TENANT_IDEM,
          `encounter:${ENCONTRO_IDEM.id}`,
          "avaliacao-computada",
          "evaluation_record",
          "SYNTH-AVAL-PLANTADA",
          { despacho: DESPACHO_FORJADO },
        ],
      );
    });

    const { AdaptadorPglite } = await import("@intensicare/persistencia");
    const { replayEvents } = await import("./db.js");
    const eventos = await replayEvents(new AdaptadorPglite(db), {
      tenantId: TENANT_IDEM,
      actorId: "SYNTH-MEDICO-ACH-O3-6",
      cursor: -100,
      correlationId: "SYNTH-CORR-ACH-O3-6",
    });

    // ÂNCORA DE NÃO-VACUIDADE: as fixtures produzem eventos legítimos, e eles
    // continuam saindo — a guarda não está "segura porque calou tudo".
    expect(eventos.length).toBeGreaterThan(0);
    expect(eventos.every((e) => Number.isInteger(e.sequencia) && e.sequencia > 0)).toBe(true);

    // VALOR: a linha plantada não produziu quadro nenhum.
    expect(eventos.some((e) => e.sequencia === -7)).toBe(false);
    expect(JSON.stringify(eventos)).not.toContain("SYNTH-AVAL-PLANTADA");
    expect(JSON.stringify(eventos)).not.toContain("conduta clínica autorizada");
  }, 60_000);
});

// ---------------------------------------------------------------------------
// ORQ-3 — gatilho de borda + supressão de alerta (CRIT-1/CRIT-2)
//
// O QUÊ: a ingestão que cruza o gatilho de borda (catálogo irmão
// ALERT-EWS-NEWS2-DETERIORATION-01: cruzamento ascendente >=7 OU novo
// parâmetro vermelho) cria EXATAMENTE UM item de trabalho durável por janela
// de cooldown; ingestões seguintes acima do patamar DENTRO do cooldown
// continuam avaliando e auditando, e não criam itens duplicados. Queda
// abaixo de 7 + recruzamento após o cooldown REARMA.
//
// POR QUE ASSIM: tempestade de ingestão (≥5 acima do patamar dentro do
// cooldown) ⇒ 1 item + N−1 supressões AUDITADAS — supressão silenciosa é o
// mesmo defeito de alerta silencioso. Todo tempo é INJETADO (vi.setSystemTime):
// um teste de supressão que dorme é defeito de desenho.
//
// PREMISSA do substrato: a leitura do last-emit é EM-TRANSAÇÃO sobre itens
// de trabalho existentes do ENCONTRO (a consulta por paciente não existe em
// persistencia e este stream não pode criá-la) — premissa reversível
// documentada no PR (RAT-EWS). Dados 100% sintéticos (SYNTH-).
// ---------------------------------------------------------------------------

import { listAuditEvents, listWorkItemsWithAlerts } from "@intensicare/persistencia";
import { vi } from "vitest";

const cenarioOrq3 = buildG7SyntheticScenario();
const TENANT_ORQ3 = cenarioOrq3.organization.id;
const PACIENTE_ORQ3 = cenarioOrq3.patients[2] ?? cenarioOrq3.patients[1]!;
const ENCONTRO_ORQ3 = cenarioOrq3.encounters[2] ?? cenarioOrq3.encounters[1]!;

/** As fixtures sintéticas param neste instante; toda observação nova o supera. */
const FIXTURE_MAX_MS_ORQ3 = Date.parse("2026-08-16T11:30:00.000Z");
let contadorOrq3 = 0;
function instanteClinicoFrescoOrq3(): string {
  contadorOrq3 += 1;
  return new Date(Math.max(Date.now(), FIXTURE_MAX_MS_ORQ3) + contadorOrq3 * 60_000).toISOString();
}

/** Série acima do patamar: FR 26(3) SpO2 89(3) PAS 92(2) FC 122(2) T 38,3(1) = 11, vermelhos rr+spo2. */
function envelopeAltoOrq3(encontro = ENCONTRO_ORQ3, paciente = PACIENTE_ORQ3) {
  const t = instanteClinicoFrescoOrq3();
  return {
    encontroId: encontro.id,
    leitoId: encontro.bedId,
    pacienteRef: paciente.subjectRef,
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
  };
}

/** Série de QUEDA: todos os parâmetros 0 — total 0, sem vermelho. */
function envelopeDeQuedaOrq3(encontro = ENCONTRO_ORQ3, paciente = PACIENTE_ORQ3) {
  const t = instanteClinicoFrescoOrq3();
  return {
    encontroId: encontro.id,
    leitoId: encontro.bedId,
    pacienteRef: paciente.subjectRef,
    contexto: { idadeAnos: 62 },
    observacoes: [
      { parametro: "FR", valor: 16, unidade: "rpm", coletadoEm: t },
      { parametro: "SpO2", valor: 97, unidade: "%", coletadoEm: t },
      { parametro: "FluxoO2", valor: 0, unidade: "L/min", coletadoEm: t },
      { parametro: "PAS", valor: 120, unidade: "mmHg", coletadoEm: t },
      { parametro: "FC", valor: 70, unidade: "bpm", coletadoEm: t },
      { parametro: "NivelConsciencia", codigo: "A", coletadoEm: t },
      { parametro: "Temperatura", valor: 36.8, unidade: "Cel", coletadoEm: t },
    ],
  };
}

describe("ORQ-3: gatilho de borda + supressão de alerta durável (CRIT-1/CRIT-2)", () => {
  let db: PGlite;
  let app: FastifyInstance;

  beforeAll(async () => {
    db = createInMemoryDatabase();
    await bootstrapDatabase(db);
    await loadIntoDatabase(db);
    app = await buildServer({ db });
  }, 60_000);

  afterAll(async () => {
    await app.close();
    vi.useRealTimers();
  });

  async function ingerir(chave: string, payload: ReturnType<typeof envelopeAltoOrq3>) {
    // Token cunhado NO INSTANTE da chamada: sob relógio falso (+4h/+5h do
    // rearme), um token pré-emitido expira (`exp` contra o relógio simulado)
    // — o verificador está CERTO em recusar; o teste que se adapta.
    const auth = {
      authorization: `Bearer ${gerarTokenSintetico(TENANT_ORQ3, "SYNTH-MEDICO-ORQ-3")}`,
    };
    const resposta = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...auth, "idempotency-key": chave },
      payload,
    });
    expect(resposta.statusCode, resposta.body).toBe(201);
    return resposta.json() as IngestaoObservacoesResposta;
  }

  // ORDEM DE DECLARAÇÃO IMPORTA (cada teste usa par paciente/encontro
  // próprio; a suíte roda sequencial nesta ordem): 1) banda média em P001
  // virgem (nenhum item, nenhuma supressão); 2) tempestade em P002;
  // 3) rearme de volta em P001 (a supressão é contada por DELTA, não
  // absoluta, para não herdar a contagem da tempestade).
  it("banda média (5–6) não cria item de deterioração NEM supressão — rota da tendência (TV-2)", async () => {
    // Paciente e encontro PRÓPRIOS e VIRGENS: primeira medição, total 6.
    const pacienteMedio = cenarioOrq3.patients[0]!;
    const encontroMedio = cenarioOrq3.encounters[0]!;
    const t = instanteClinicoFrescoOrq3();
    const resposta = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: {
        authorization: `Bearer ${gerarTokenSintetico(TENANT_ORQ3, "SYNTH-MEDICO-ORQ-3")}`,
        "idempotency-key": "SYNTH-IDEM-ORQ3-MEDIA",
      },
      payload: {
        encontroId: encontroMedio.id,
        leitoId: encontroMedio.bedId,
        pacienteRef: pacienteMedio.subjectRef,
        contexto: { idadeAnos: 45 },
        observacoes: [
          { parametro: "FR", valor: 21, unidade: "rpm", coletadoEm: t },
          { parametro: "SpO2", valor: 94, unidade: "%", coletadoEm: t },
          { parametro: "FluxoO2", valor: 0, unidade: "L/min", coletadoEm: t },
          { parametro: "PAS", valor: 105, unidade: "mmHg", coletadoEm: t },
          { parametro: "FC", valor: 95, unidade: "bpm", coletadoEm: t },
          { parametro: "NivelConsciencia", codigo: "A", coletadoEm: t },
          { parametro: "Temperatura", valor: 38.5, unidade: "Cel", coletadoEm: t },
        ],
      },
    });
    expect(resposta.statusCode).toBe(201);
    const corpo = resposta.json() as IngestaoObservacoesResposta;
    expect(corpo.avaliacao.escore).toBe(6);
    expect(corpo.avaliacao.banda).toBe("alerta");
    expect(corpo.alerta).toBeNull();

    const contagem = await withTenantTransaction(db, TENANT_ORQ3, async (tx) => {
      const itens = (await listWorkItemsWithAlerts(tx)).filter(
        (i) => i.encounterId === encontroMedio.id,
      );
      return itens.length;
    });
    expect(contagem).toBe(0);
  }, 120_000);

  it("TEMPESTADE: 5 ingestões acima do patamar dentro do cooldown ⇒ 1 item durável + 4 supressões AUDITADAS", async () => {
    const corpos = [];
    for (let n = 1; n <= 5; n++) {
      corpos.push(await ingerir(`SYNTH-IDEM-ORQ3-TEMPESTADE-${n}`, envelopeAltoOrq3()));
    }

    // 1ª ingestão: primeira medição conhecida acima do patamar → emite.
    expect(corpos[0]!.alerta, "a 1ª ingestão cria o item durável").not.toBeNull();
    for (let n = 1; n <= 4; n++) {
      expect(corpos[n]!.alerta, `a ${n + 1}ª ingestão NÃO cria item duplicado`).toBeNull();
      // A avaliação CONTINUA acontecendo (não é no-fire silencioso).
      expect(corpos[n]!.avaliacao.escore).toBe(11);
    }

    const contagem = await withTenantTransaction(db, TENANT_ORQ3, async (tx) => {
      const itens = (await listWorkItemsWithAlerts(tx)).filter(
        (i) => i.encounterId === ENCONTRO_ORQ3.id,
      );
      const eventos = await listAuditEvents(tx);
      return {
        itens: itens.length,
        supressoes: eventos.filter((e) => e.command === "alerta-suprimido").length,
      };
    });
    expect(contagem.itens).toBe(1);
    expect(contagem.supressoes).toBe(4);
  }, 120_000);

  it("REARME: queda abaixo de 7 não emite; recruzamento após o cooldown re-emite (tempo injetado)", async () => {
    // Encontro e paciente PRÓPRIOS (P001 — o mesmo da banda média, cuja
    // avaliação anterior 6 torna o T0 um cruzamento legítimo).
    const encontroRearme = cenarioOrq3.encounters[0]!;
    const pacienteRearme = cenarioOrq3.patients[0]!;

    // T0 — emissão ORIGINAL (anterior 6 → agora 11: cruzamento): emite.
    const original = await ingerir(
      "SYNTH-IDEM-ORQ3-REARME-T0",
      envelopeAltoOrq3(encontroRearme, pacienteRearme),
    );
    expect(original.alerta, "a emissão original cria o item durável").not.toBeNull();

    // SOMENTE `Date` é falsificado: falsificar timers de verdade congela os
    // temporizadores internos de I/O (PGlite/fastify) e a ingestão pende.
    // Relógio é injeção de TESTE, não mudança de produto.
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      // +1h: recruzamento (a queda já ocorreu: anterior 0 → agora 11) — o
      // cooldown da emissão original ainda vale (1h < PT4H) ⇒ SUPRIMIDO e
      // AUDITADO, mesmo sendo cruzamento legítimo (o rearme exige também o
      // cooldown cumprido).
      vi.setSystemTime(Date.now() + 60 * 60 * 1000); // +1h < PT4H
      const cedo = await ingerir(
        "SYNTH-IDEM-ORQ3-REARME-CEDO",
        envelopeDeQuedaOrq3(encontroRearme, pacienteRearme),
      );
      // A queda em si não cruza (11 → 0) e não emite: nem item nem supressão.
      expect(cedo.alerta).toBeNull();

      // Recruzamento em +1h (anterior 0 → agora 11): cruzamento legítimo,
      // mas cooldown da emissão original (1h < PT4H) ⇒ SUPRIMIDO e AUDITADO.
      const supressoesPorDelta = async () => {
        return withTenantTransaction(db, TENANT_ORQ3, async (tx) => {
          const eventos = await listAuditEvents(tx);
          return eventos.filter((e) => e.command === "alerta-suprimido").length;
        });
      };
      const supressoesAntes = await supressoesPorDelta();
      const cedo2 = await ingerir(
        "SYNTH-IDEM-ORQ3-REARME-CEDO2",
        envelopeAltoOrq3(encontroRearme, pacienteRearme),
      );
      expect(cedo2.alerta).toBeNull();

      // DELTA (não absoluto): a tempestade anterior já deixou supressões
      // auditadas no tenant; este teste soma exatamente MAIS UMA.
      const supressoesDepois = await supressoesPorDelta();
      expect(supressoesDepois - supressoesAntes).toBe(1);

      // +2h: QUEDA abaixo de 7 (total 0) — sem cruzamento, sem emissão,
      // sem supressão: a queda ARMA o rearmamento.
      vi.setSystemTime(Date.now() + 60 * 60 * 1000); // +2h
      const queda = await ingerir(
        "SYNTH-IDEM-ORQ3-REARME-QUEDA",
        envelopeDeQuedaOrq3(encontroRearme, pacienteRearme),
      );
      expect(queda.alerta).toBeNull();

      // +5h: RECRUZAMENTO (anterior 0 → agora 11) após o cooldown da
      // emissão original (T0+5h > PT4H) ⇒ RE-EMITE (novo item durável).
      vi.setSystemTime(Date.now() + 3 * 60 * 60 * 1000); // +5h do rearme > PT4H
      const tarde = await ingerir(
        "SYNTH-IDEM-ORQ3-REARME-TARDE",
        envelopeAltoOrq3(encontroRearme, pacienteRearme),
      );
      expect(tarde.alerta, "recruzamento após queda + cooldown RE-EMITE").not.toBeNull();
    } finally {
      vi.useRealTimers();
    }

    const depois = await withTenantTransaction(db, TENANT_ORQ3, async (tx) => {
      return (await listWorkItemsWithAlerts(tx)).filter((i) => i.encounterId === encontroRearme.id)
        .length;
    });
    expect(depois).toBe(2);
  }, 120_000);
});
