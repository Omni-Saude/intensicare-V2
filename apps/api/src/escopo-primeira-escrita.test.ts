/**
 * Contrato "o escopo de tenant é a PRIMEIRA escrita da transação", exercido —
 * não lido — em TODOS os pontos de `apps/api/**` que abrem transação.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------
 * `packages/persistencia/src/migrations/0004_escopo_selado.sql` ancora o selo
 * de escopo na ATRIBUIÇÃO DO ID DE TRANSAÇÃO: `instalar` recusa instalar
 * qualquer escopo se `pg_current_xact_id_if_assigned()` já for não-nulo sem
 * selo correspondente. O cabeçalho daquela migração afirmava que os caminhos de
 * transação do produto instalam o escopo como primeira instrução após `begin`,
 * e ele próprio REBAIXOU a afirmação a NÃO VERIFICADO, porque era leitura de
 * código e não teste.
 *
 * Ler não basta, e a razão é medida, não estilística: `nextval` atribui id de
 * transação de forma CONDICIONAL (só nas chamadas que gravam a tupla da
 * sequência em WAL — a primeira, e a seguinte a um `setval`; dentro da janela
 * de cache de 32 valores, não atribui). Logo uma instrução emitida ANTES do
 * `instalar` pode derrubar o contrato uma vez a cada 32 execuções, e passar nas
 * outras 31. Um teste que apenas exercitasse os caminhos e conferisse que eles
 * não falham herdaria exatamente essa intermitência.
 *
 * O QUE ESTE ARQUIVO ASSEVERA (dois detectores independentes, por transação)
 * -------------------------------------------------------------------------
 *   A) ORDEM — a instalação do escopo é a PRIMEIRA instrução SQL emitida na
 *      transação. Detector determinístico: pega qualquer instrução anterior,
 *      inclusive uma leitura pura ou um `nextval` dentro da janela de cache,
 *      que o motor NÃO recusaria.
 *   B) MOTOR — no instante em que o escopo foi instalado,
 *      `pg_current_xact_id_if_assigned()` ainda era NULL, isto é, nenhuma
 *      escrita (de heap ou de sequência) havia ocorrido. Detector que independe
 *      de quem emitiu a escrita — alcança até o que não passa pelo executor.
 *
 * (A) é estritamente mais forte que a recusa do próprio `instalar`; (B) é
 * estritamente mais forte que (A) contra escrita fora do executor. Nenhum dos
 * dois substitui o outro, e ambos são exercidos contra os dois lados (ver o
 * bloco "contraprova" ao final: com uma instrução injetada antes do escopo, o
 * detector correspondente REPROVA — sem isso este arquivo seria verde vácuo).
 *
 * LIMITE DE ALCANCE (declarado, não escondido)
 * -------------------------------------------
 * O motor aqui é o SIMULADOR PGlite, que é o motor que `apps/api` usa em teste
 * e em perfil sintético. O outro caminho de transação da porta —
 * `AdaptadorPostgres.comTenant`, contra PostgreSQL real — NÃO é exercido por
 * este arquivo: ele exige servidor externo e vive em `packages/persistencia`,
 * fora da fronteira de escrita deste agente. O que é comum aos dois é
 * `withTenantTransaction`; o que é exclusivo do adaptador de PostgreSQL (o par
 * `begin` + `instalar` em `pool.ts`) permanece NÃO VERIFICADO por teste.
 *
 * Rastreio: ACHADO-02/ACHADO-16 da 0004, THR-0050, THR-0002, ADR-0016 §4.1.
 */

import type { PGlite, Transaction } from "@electric-sql/pglite";
import type { IngestaoObservacoesResposta } from "@intensicare/contratos";
import { buildG7SyntheticScenario, loadIntoDatabase } from "@intensicare/fixtures-sinteticas";
import {
  AdaptadorPglite,
  bootstrapDatabase,
  createInMemoryDatabase,
  type ExecutorTenant,
  type PortaBancoDeDados,
} from "@intensicare/persistencia";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { gerarTokenSintetico } from "./auth.js";
import { dependenciaDeBancoDiferida } from "./composicao/prontidao.js";
import { acknowledgeAlert, getPatientEvaluations, projectBedGrid, replayEvents } from "./db.js";
import { buildServer } from "./index.js";
// Registro VAZIO (nenhuma regra registrada) — suficiente e correto aqui: os
// quatro sítios abaixo testam ORDEM DE ESCRITA/ESCOPO de transação
// (DETECTOR A/B), nunca dispacho de regra ou modo de despacho. `db.ts`
// tornou `registroDeRegras` OBRIGATÓRIO no tipo de `projectBedGrid`/
// `getPatientEvaluations` (ACH-REV8-3); um registro vazio ainda satisfaz o
// tipo e deixa a autoridade de leitura degradar para "sem autoridade" —
// mesmo ramo fail-closed que a ausência do parâmetro já produzia, sem
// mudar a contagem de linhas nem a ordem de instruções que estes testes
// observam. Mesmo padrão já usado em regras/exposicao.test.ts para os
// casos que não precisam de provedor nenhum registrado.
import { RegistroDeRegras } from "./regras/registro.js";

/** Trecho que identifica a instalação do escopo, qualquer que seja o chamador. */
const MARCA_DA_INSTALACAO = "intensicare_escopo.instalar";

interface InstrucaoObservada {
  /** Texto SQL emitido, na forma em que chegou ao executor da transação. */
  readonly sql: string;
  /**
   * `pg_current_xact_id_if_assigned()` já era NÃO-NULO no instante em que esta
   * instrução foi emitida — ou seja, a transação JÁ HAVIA ESCRITO antes dela.
   */
  readonly xidJaAtribuido: boolean;
}

interface TransacaoObservada {
  readonly instrucoes: InstrucaoObservada[];
}

/** Toda transação aberta sobre o PGlite espionado, na ordem de abertura. */
const transacoesObservadas: TransacaoObservada[] = [];

/**
 * Instrução injetada ANTES do corpo da transação — o único mecanismo de
 * mutação deste arquivo, usado só pelo bloco de contraprova. `null` em todo o
 * resto da suíte: os caminhos de produto rodam intocados.
 */
let injecaoAntesDoEscopo: string | null = null;

/**
 * Envolve o executor de transação do PGlite registrando, para CADA instrução,
 * o texto e o estado de atribuição do id de transação IMEDIATAMENTE ANTES de
 * ela ser emitida.
 *
 * A sondagem usa `select`, que não escreve e portanto não atribui id — medir
 * não perturba o que se mede.
 */
function envolverExecutor(tx: Transaction, registro: TransacaoObservada): ExecutorTenant {
  const registrar = async (sql: string): Promise<void> => {
    const sondagem = await tx.query<{ atribuido: boolean }>(
      "select pg_current_xact_id_if_assigned() is not null as atribuido",
    );
    registro.instrucoes.push({ sql, xidJaAtribuido: sondagem.rows[0]?.atribuido === true });
  };

  return {
    async query<T>(
      query: string,
      params?: unknown[],
      options?: Parameters<Transaction["query"]>[2],
    ) {
      await registrar(query);
      return tx.query<T>(query, params, options);
    },
    async sql<T>(sqlStrings: TemplateStringsArray, ...params: unknown[]) {
      await registrar(sqlStrings.join("$?"));
      return tx.sql<T>(sqlStrings, ...params);
    },
    async rollback() {
      await registrar("rollback");
      return tx.rollback();
    },
    async listen(channel: string, callback: (payload: string) => void) {
      await registrar(`listen ${channel}`);
      return tx.listen(channel, callback);
    },
    get closed() {
      return tx.closed;
    },
  };
}

/**
 * Espia um `PGlite` sem alterar seu comportamento: só `transaction` é
 * interceptado, para envolver o executor entregue ao corpo da transação. Todo
 * o resto é delegado ao objeto real (ligado a ele, porque `PGlite` usa campos
 * privados de classe).
 */
function espiarPGlite(real: PGlite): PGlite {
  return new Proxy(real, {
    get(alvo, propriedade) {
      if (propriedade === "transaction") {
        return async <T>(corpo: (tx: ExecutorTenant) => Promise<T>): Promise<T> =>
          alvo.transaction(async (tx) => {
            const registro: TransacaoObservada = { instrucoes: [] };
            transacoesObservadas.push(registro);
            const executor = envolverExecutor(tx, registro);
            if (injecaoAntesDoEscopo !== null) {
              await executor.query(injecaoAntesDoEscopo);
            }
            return corpo(executor);
          });
      }
      const valor = Reflect.get(alvo, propriedade, alvo) as unknown;
      return typeof valor === "function"
        ? (valor as (...a: unknown[]) => unknown).bind(alvo)
        : valor;
    },
  });
}

/** Executa `acao` e devolve as transações abertas durante ela. */
async function transacoesDe<T>(
  acao: () => Promise<T>,
): Promise<{ resultado: T; transacoes: TransacaoObservada[] }> {
  const inicio = transacoesObservadas.length;
  const resultado = await acao();
  return { resultado, transacoes: transacoesObservadas.slice(inicio) };
}

/** DETECTOR A — a instalação do escopo é a primeira instrução da transação. */
function exigirEscopoComoPrimeiraInstrucao(nome: string, t: TransacaoObservada): void {
  const primeira = t.instrucoes[0];
  expect(primeira, `${nome}: transação sem nenhuma instrução observada`).toBeDefined();
  expect(primeira?.sql, `${nome}: primeira instrução da transação`).toContain(MARCA_DA_INSTALACAO);
}

/** DETECTOR B — quando o escopo foi instalado, nada havia sido escrito ainda. */
function exigirNenhumaEscritaAntesDoEscopo(nome: string, t: TransacaoObservada): void {
  const instalacao = t.instrucoes.find((i) => i.sql.includes(MARCA_DA_INSTALACAO));
  expect(instalacao, `${nome}: a transação não instalou escopo nenhum`).toBeDefined();
  expect(
    instalacao?.xidJaAtribuido,
    `${nome}: id de transação já atribuído quando o escopo foi instalado`,
  ).toBe(false);
}

/**
 * Aplica os dois detectores a todas as transações da janela.
 *
 * A contagem é conferida como "ao menos uma" e não como igualdade: o contrato
 * é sobre a ORDEM DENTRO de cada transação, e amarrar o número exato tornaria
 * o teste refém de detalhes de agendamento (por exemplo, uma leitura de fundo
 * do gateway de eventos) que não dizem nada sobre o contrato.
 */
function exigirContrato(nome: string, transacoes: readonly TransacaoObservada[]): void {
  expect(transacoes.length, `${nome}: nenhuma transação foi aberta`).toBeGreaterThanOrEqual(1);
  transacoes.forEach((t, i) => {
    exigirEscopoComoPrimeiraInstrucao(`${nome} [txn ${String(i)}]`, t);
    exigirNenhumaEscritaAntesDoEscopo(`${nome} [txn ${String(i)}]`, t);
  });
}

const cenario = buildG7SyntheticScenario();
const TENANT = cenario.organization.id;
const P002 = cenario.patients[1]!;
const ENC_P002 = cenario.encounters[1]!;
const ATOR = "SYNTH-USER-ESCOPO";
const AUTH = { authorization: `Bearer ${gerarTokenSintetico(TENANT, ATOR)}` };

const INSTANTE_MAXIMO_DAS_FIXTURES = Date.parse("2026-08-16T11:30:00.000Z");
let contadorClinico = 0;
function tempoClinicoFresco(): string {
  contadorClinico += 1;
  return new Date(
    Math.max(Date.now(), INSTANTE_MAXIMO_DAS_FIXTURES) + contadorClinico * 60_000,
  ).toISOString();
}

function envelopeCritico(): Record<string, unknown> {
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
  };
}

describe("o escopo de tenant é a primeira escrita de toda transação de apps/api", () => {
  let espiao: PGlite;
  let porta: PortaBancoDeDados;
  let app: FastifyInstance;
  let alertaId: string;
  /** Transações abertas pela semeadura de fixtures (`loadIntoDatabase`). */
  let transacoesDaSemeadura: TransacaoObservada[];

  beforeAll(async () => {
    const bancoReal = createInMemoryDatabase();
    // Migrações rodam FORA do espião e como superusuário: elas precedem
    // qualquer escopo de tenant por desenho (ver `session.ts`).
    await bootstrapDatabase(bancoReal);

    espiao = espiarPGlite(bancoReal);
    // `loadIntoDatabase` é o caminho de transação que `prepareDatabase`
    // dispara quando `banco.semearFixturesSinteticas` está ligado — por isso
    // ele é semeado JÁ pelo espião.
    const semeadura = await transacoesDe(() => loadIntoDatabase(espiao));
    transacoesDaSemeadura = semeadura.transacoes;

    // `buildServer` com banco injetado ⇒ `prepareDatabase` devolve
    // `AdaptadorPglite(espiao)`: as rotas passam a usar o espião.
    app = await buildServer({ db: espiao });
    // Mesma conexão espionada, para os pontos de `db.ts` chamados diretamente.
    porta = new AdaptadorPglite(espiao);
  }, 60_000);

  // `app.close()` encerra a porta, e `AdaptadorPglite.encerrar` fecha o PGlite
  // subjacente — fechá-lo de novo aqui lançaria "PGlite is closed".
  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    injecaoAntesDoEscopo = null;
  });

  it("packages/fixtures-sinteticas/load.ts (disparado por prepareDatabase): semeadura", () => {
    exigirContrato("loadIntoDatabase", transacoesDaSemeadura);
  });

  it("routes.ts /v1/healthz: sonda de liveness com toque de banco", async () => {
    const { resultado, transacoes } = await transacoesDe(() =>
      app.inject({ method: "GET", url: "/v1/healthz" }),
    );
    expect(resultado.statusCode).toBe(200);
    exigirContrato("routes.ts /v1/healthz", transacoes);
  });

  it("composicao/prontidao.ts: dependência de banco da prontidão", async () => {
    const dependencia = dependenciaDeBancoDiferida(() => porta);
    // `DependenciaDeclarada.verificar` é tipado `() => Promise<boolean> |
    // boolean` de propósito (saude/portas.ts) — a porta aceita implementação
    // síncrona OU assíncrona; a `verificar` desta dependência específica É
    // `async` (composicao/prontidao.ts) e sempre devolve Promise de verdade.
    // `transacoesDe` exige `() => Promise<T>`; envolver em `async` normaliza
    // o tipo sem mudar comportamento (achado ACH-O3-2, sem impacto em
    // runtime — `await` sobre valor não-Promise já era no-op).
    const { resultado, transacoes } = await transacoesDe(async () => dependencia.verificar());
    expect(resultado).toBe(true);
    exigirContrato("composicao/prontidao.ts", transacoes);
  });

  it("db.ts ingestObservations (via POST /v1/ingestao/observacoes)", async () => {
    const { resultado, transacoes } = await transacoesDe(() =>
      app.inject({
        method: "POST",
        url: "/v1/ingestao/observacoes",
        headers: { ...AUTH, "idempotency-key": "SYNTH-IDEM-ESCOPO-01" },
        payload: envelopeCritico(),
      }),
    );
    expect(resultado.statusCode).toBe(201);
    const corpo = resultado.json() as IngestaoObservacoesResposta;
    // O alerta durável desta ingestão é o insumo do caminho de reconhecimento.
    expect(corpo.alerta).not.toBeNull();
    alertaId = corpo.alerta?.id ?? "";
    exigirContrato("db.ts ingestObservations", transacoes);
  });

  it("db.ts projectBedGrid", async () => {
    const { resultado, transacoes } = await transacoesDe(() =>
      projectBedGrid(porta, {
        tenantId: TENANT,
        actorId: ATOR,
        correlationId: "SYNTH-CORR-ESCOPO-GRADE",
        registroDeRegras: new RegistroDeRegras(),
      }),
    );
    expect(resultado.length).toBeGreaterThan(0);
    exigirContrato("db.ts projectBedGrid", transacoes);
  });

  it("db.ts getPatientEvaluations", async () => {
    const { resultado, transacoes } = await transacoesDe(() =>
      getPatientEvaluations(porta, {
        tenantId: TENANT,
        actorId: ATOR,
        pacienteRef: P002.subjectRef,
        correlationId: "SYNTH-CORR-ESCOPO-AVAL",
        registroDeRegras: new RegistroDeRegras(),
      }),
    );
    expect(resultado).not.toBeNull();
    exigirContrato("db.ts getPatientEvaluations", transacoes);
  });

  it("db.ts acknowledgeAlert", async () => {
    expect(alertaId, "o caminho de ingestão precisa ter produzido um alerta").not.toBe("");
    const { resultado, transacoes } = await transacoesDe(() =>
      acknowledgeAlert(porta, {
        tenantId: TENANT,
        actorId: ATOR,
        workItemId: alertaId,
        expectedVersion: 0,
        correlationId: "SYNTH-CORR-ESCOPO-ACK",
      }),
    );
    expect(resultado.kind).toBe("applied");
    exigirContrato("db.ts acknowledgeAlert", transacoes);
  });

  it("db.ts replayEvents", async () => {
    const { resultado, transacoes } = await transacoesDe(() =>
      replayEvents(porta, {
        tenantId: TENANT,
        actorId: ATOR,
        cursor: 0,
        correlationId: "SYNTH-CORR-ESCOPO-EVENTOS",
      }),
    );
    expect(resultado.length).toBeGreaterThan(0);
    exigirContrato("db.ts replayEvents", transacoes);
  });

  it("nenhuma transação observada durante toda a suíte viola o contrato", () => {
    // Rede de arrasto: pega qualquer transação aberta fora das janelas medidas
    // acima (por exemplo por um caminho de fundo que venha a existir).
    expect(transacoesObservadas.length).toBeGreaterThanOrEqual(8);
    exigirContrato("todas as transações da suíte", transacoesObservadas);
  });

  /**
   * CONTRAPROVA — sem ela, os testes acima poderiam estar verdes por
   * construção. Cada detector é exercido contra uma transação em que uma
   * instrução foi injetada ANTES do escopo, e precisa REPROVAR.
   */
  describe("contraprova: com instrução antes do escopo, os detectores reprovam", () => {
    it("leitura pura antes do escopo: o MOTOR aceita, o detector de ORDEM reprova", async () => {
      injecaoAntesDoEscopo = "select 1 as instrucao_injetada";
      const { resultado, transacoes } = await transacoesDe(() =>
        projectBedGrid(porta, {
          tenantId: TENANT,
          actorId: ATOR,
          correlationId: "SYNTH-CORR-ESCOPO-MUT-LEITURA",
          registroDeRegras: new RegistroDeRegras(),
        }),
      );

      // O motor NÃO recusa: uma leitura não atribui id de transação. É
      // exatamente a classe de instrução que a 0004 descreve como capaz de
      // derrubar o contrato de forma intermitente (o `nextval` dentro da
      // janela de cache está nesta classe) — e é por isso que o detector de
      // ordem existe.
      expect(resultado.length).toBeGreaterThan(0);

      const t = transacoes[0];
      expect(t, "a transação mutada precisa ter sido observada").toBeDefined();
      expect(t?.instrucoes[0]?.sql).toContain("instrucao_injetada");
      expect(() =>
        exigirEscopoComoPrimeiraInstrucao("mutante-leitura", t as TransacaoObservada),
      ).toThrowError(/primeira instrução da transação/);
      // O detector B continua aprovando: nenhuma ESCRITA houve. Registrar isso
      // é o que impede confundir os dois detectores.
      expect(() =>
        exigirNenhumaEscritaAntesDoEscopo("mutante-leitura", t as TransacaoObservada),
      ).not.toThrow();
    });

    it("escrita antes do escopo: o MOTOR recusa e AMBOS os detectores reprovam", async () => {
      // `pg_current_xact_id()` FORÇA a atribuição do id de transação — é a
      // forma determinística de encenar "a transação já escreveu", sem
      // depender da janela de cache de sequência.
      injecaoAntesDoEscopo = "select pg_current_xact_id() as forca_atribuicao";
      const inicio = transacoesObservadas.length;

      // NÃO MASCARADO (verificado por leitura de `withTenantTransaction`,
      // packages/persistencia/src/session.ts:163-171, antes deste conserto):
      // a instrução injetada roda no nível do `PGlite.transaction(...)`
      // interceptado por `espiarPGlite`, ANTES do corpo que
      // `withTenantTransaction` executa — e é ESSE corpo que primeiro chama
      // `intensicare_escopo.instalar(...)` e só DEPOIS invoca o callback de
      // `projectBedGrid` (onde `args.registroDeRegras` é lido). Com
      // `pg_current_xact_id()` já tendo forçado atribuição de xid, a
      // instalação do escopo reprova ANTES de o callback de `projectBedGrid`
      // rodar — `registroDeRegras`, presente ou ausente, nunca chega a ser
      // lido neste caminho. Por isso este teste já provava exatamente o que
      // o nome promete, mesmo antes do parâmetro abaixo existir; o parâmetro
      // é exigido pelo TIPO da função, não pelo comportamento observado aqui.
      await expect(
        projectBedGrid(porta, {
          tenantId: TENANT,
          actorId: ATOR,
          correlationId: "SYNTH-CORR-ESCOPO-MUT-ESCRITA",
          registroDeRegras: new RegistroDeRegras(),
        }),
      ).rejects.toThrowError(/o escopo deve ser a PRIMEIRA escrita da transação/);

      const t = transacoesObservadas.slice(inicio)[0];
      expect(t, "a transação mutada precisa ter sido observada").toBeDefined();
      expect(() =>
        exigirEscopoComoPrimeiraInstrucao("mutante-escrita", t as TransacaoObservada),
      ).toThrowError(/primeira instrução da transação/);
      expect(() =>
        exigirNenhumaEscritaAntesDoEscopo("mutante-escrita", t as TransacaoObservada),
      ).toThrowError(/id de transação já atribuído quando o escopo foi instalado/);
    });
  });
});
