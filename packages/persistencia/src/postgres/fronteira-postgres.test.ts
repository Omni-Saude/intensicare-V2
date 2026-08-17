/**
 * fronteira-postgres.test.ts — verificação ADVERSARIAL da fronteira de
 * isolamento de dados contra um PostgreSQL REAL e EFÊMERO.
 *
 * POR QUE ESTA SUÍTE EXISTE
 * -------------------------
 * A suíte irmã `../seguranca.test.ts` roda sobre o SIMULADOR PGlite, e lá o
 * isolamento não é fronteira: a conexão é única, o usuário autenticado é
 * superusuário, e `SET SESSION AUTHORIZATION` devolve o superusuário — que
 * ignora RLS mesmo com `FORCE ROW LEVEL SECURITY` (ACHADO-01, ADR-0016 §4.1,
 * THR-0050 P0). Generalizar RLS de PGlite para produção é anti-padrão
 * explícito do contrato de agentes (§6 item 6).
 *
 * Aqui a topologia é a de produção: a aplicação AUTENTICA-SE já como
 * `intensicare_app` (sem SUPERUSER, sem BYPASSRLS, sem propriedade de tabela),
 * contra um servidor de verdade, com SCRAM-SHA-256, e o papel dono do esquema
 * é outro (`intensicare_migrador`).
 *
 * O QUE ESTA SUÍTE **NÃO** FAZ
 * ----------------------------
 * Não fecha SEC-0009, SAF-0008, SEC-0001, THR-0001, THR-0002 nem THR-0050, e
 * não fecha o Gate G6. G6 exige verificador terceiro independente
 * (DEC-G0-02) e aceite humano nominal (MG-G6). O que ela faz é tornar o
 * controle EXERCITÁVEL e BLOQUEANTE: nenhuma falha P0 sobrevive aqui como
 * `expected fail` num gate que termina verde.
 *
 * DISPONIBILIDADE (ver `scripts/pg-efemero.mjs`)
 * ---------------------------------------------
 * O cluster é criado e destruído por esta suíte. Se `PG_TEST_URL`/`DATABASE_URL`
 * estiverem definidas, o servidor apontado por elas é reusado e nada é criado
 * (é o caminho de `services: postgres` no CI). Se o PostgreSQL não estiver
 * disponível:
 *   - em CI, ou com `IC_FRONTEIRA_PG=obrigatoria`, a suíte FALHA com as
 *     instruções exatas de provisionamento;
 *   - em desenvolvimento, é pulada com aviso RUIDOSO — nunca em silêncio.
 *
 * Dados 100% sintéticos (marcador `SYNTH-`, política GDEC-0014).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AdaptadorPostgres, type ConfiguracaoPostgres } from "./pool.js";
import { ErroIdentidadeInsegura, ErroTenantAusente, type ExecutorTenant } from "./porta.js";
import { ConexaoPostgres, ErroPostgres, opcoesDaUrl, urlCom } from "./protocolo.js";
import {
  aplicarMigracao,
  type BancoProvisionado,
  nomeDeBancoDeVerificacao,
  PAPEL_APLICACAO,
  PAPEL_MIGRADOR,
  provisionarBanco,
} from "./provisionamento.js";

const TEMPO_LIMITE_MS = 60_000;
const TEMPO_LIMITE_GANCHO_MS = 180_000;

/** As 13 tabelas sob RLS (0001_init.sql + 0002_g7_integration.sql). */
const TABELAS_SOB_RLS = [
  "alerts",
  "audit_events",
  "beds",
  "care_units",
  "clinical_observations",
  "encounters",
  "evaluation_records",
  "idempotency_records",
  "organizations",
  "outbox_events",
  "patient_identities",
  "source_envelopes",
  "work_items",
] as const;

/** Tabelas com coluna `id` de texto — alvo das sondagens IDOR. */
const TABELAS_COM_ID = [
  "alerts",
  "audit_events",
  "beds",
  "care_units",
  "clinical_observations",
  "encounters",
  "evaluation_records",
  "organizations",
  "patient_identities",
  "source_envelopes",
  "work_items",
] as const;

const TENANT_A = "SYNTH-TENANT-PG-A";
const TENANT_B = "SYNTH-TENANT-PG-B";

// ---------------------------------------------------------------------------
// Bancada: cluster efêmero
// ---------------------------------------------------------------------------

interface RespostaCluster {
  readonly disponivel: boolean;
  readonly efemero: boolean;
  readonly criado?: boolean;
  readonly urlSuperusuario: string | null;
  readonly versaoServidor: string | null;
  readonly motivoIndisponivel: string | null;
  readonly instrucoes: readonly string[];
}

function localizarScriptDoCluster(): string {
  let diretorio = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    const candidato = join(diretorio, "scripts", "pg-efemero.mjs");
    if (existsSync(candidato)) {
      return candidato;
    }
    diretorio = dirname(diretorio);
  }
  throw new Error("scripts/pg-efemero.mjs não encontrado a partir deste pacote");
}

function invocarCluster(comando: "up" | "down"): RespostaCluster {
  const script = localizarScriptDoCluster();
  const resultado = spawnSync(process.execPath, [script, comando, "--silencioso"], {
    encoding: "utf-8",
    timeout: 180_000,
  });
  const saida = (resultado.stdout ?? "").trim();
  try {
    return JSON.parse(saida) as RespostaCluster;
  } catch {
    return {
      disponivel: false,
      efemero: false,
      urlSuperusuario: null,
      versaoServidor: null,
      motivoIndisponivel: `pg-efemero.mjs ${comando} não devolveu JSON (código ${resultado.status}): ${
        (resultado.stderr ?? "").trim() || saida || "sem saída"
      }`,
      instrucoes: [],
    };
  }
}

/**
 * A fronteira é EXIGIDA em CI, ou quando pedida explicitamente. Em
 * desenvolvimento, sem PostgreSQL, a suíte é pulada — mas nunca em silêncio.
 */
const fronteiraExigida =
  process.env.IC_FRONTEIRA_PG === "obrigatoria" ||
  (process.env.CI !== undefined && process.env.CI !== "" && process.env.CI !== "false");

const cluster = invocarCluster("up");

if (!cluster.disponivel) {
  const instrucoes = [
    "FRONTEIRA DE ISOLAMENTO NÃO VERIFICADA NESTA EXECUÇÃO.",
    `motivo: ${cluster.motivoIndisponivel ?? "PostgreSQL indisponível"}`,
    ...cluster.instrucoes,
    "Para exigir a verificação (e falhar quando faltar): IC_FRONTEIRA_PG=obrigatoria",
  ].join("\n  ");

  if (fronteiraExigida) {
    describe("fronteira de isolamento contra PostgreSQL real", () => {
      it("PostgreSQL é OBRIGATÓRIO neste perfil e não está disponível", () => {
        throw new Error(instrucoes);
      });
    });
  } else {
    // Aviso RUIDOSO: pular em silêncio seria transformar uma verificação P0
    // ausente em pipeline verde (anti-padrão 7 e 16 do contrato).
    process.stderr.write(`\n${"=".repeat(78)}\n  ${instrucoes}\n${"=".repeat(78)}\n\n`);
    describe.skip(`fronteira de isolamento PULADA — ${cluster.motivoIndisponivel}`, () => {
      it("não executado", () => undefined);
    });
  }
} else {
  registrarSuite(cluster.urlSuperusuario as string);
}

// ---------------------------------------------------------------------------
// Semeadura sintética
// ---------------------------------------------------------------------------

interface TenantSemeado {
  readonly tenantId: string;
  readonly organizationId: string;
  readonly careUnitId: string;
  readonly bedId: string;
  readonly patientId: string;
  readonly encounterId: string;
  readonly envelopeId: string;
  readonly observationId: string;
  readonly evaluationId: string;
  readonly alertId: string;
  readonly workItemId: string;
  readonly auditId: string;
  readonly idempotencyKey: string;
}

function instante(utc: string): unknown {
  return { kind: "present", instant: { utc, offset: "-03:00" } };
}

/**
 * Semeia UMA linha em CADA uma das 13 tabelas sob RLS. É deliberado: se
 * alguma tabela ficasse vazia, "não vejo nada" seria um falso verde por
 * ausência de dado, não por isolamento.
 */
async function semearTenant(porta: AdaptadorPostgres, tenantId: string): Promise<TenantSemeado> {
  const t: TenantSemeado = {
    tenantId,
    organizationId: tenantId,
    careUnitId: `${tenantId}-UTI-01`,
    bedId: `${tenantId}-LEITO-01`,
    patientId: `${tenantId}-PAT-01`,
    encounterId: `${tenantId}-ENC-01`,
    envelopeId: `${tenantId}-ENV-01`,
    observationId: `${tenantId}-OBS-01`,
    evaluationId: `${tenantId}-AVAL-01`,
    alertId: `${tenantId}-ALERTA-01`,
    workItemId: `${tenantId}-WI-01`,
    auditId: `${tenantId}-AUDIT-01`,
    idempotencyKey: `${tenantId}-IDEM-01`,
  };
  const psr = `amh:psr:v1:SYNTH-${tenantId}-P01`;

  await porta.comTenant(tenantId, async (tx) => {
    await tx.query("insert into organizations (id, tenant_id, name) values ($1, $2, $3)", [
      t.organizationId,
      tenantId,
      `Organização Sintética ${tenantId}`,
    ]);
    await tx.query(
      "insert into care_units (id, tenant_id, organization_id, name) values ($1, $2, $3, $4)",
      [t.careUnitId, tenantId, t.organizationId, "UTI Sintética"],
    );
    await tx.query("insert into beds (id, tenant_id, care_unit_id, code) values ($1, $2, $3, $4)", [
      t.bedId,
      tenantId,
      t.careUnitId,
      "01",
    ]);
    await tx.query(
      "insert into patient_identities (id, tenant_id, subject_ref) values ($1, $2, $3)",
      [t.patientId, tenantId, psr],
    );
    await tx.query(
      "insert into encounters (id, tenant_id, patient_id, bed_id, admitted_at) values ($1, $2, $3, $4, $5)",
      [t.encounterId, tenantId, t.patientId, t.bedId, instante("2026-08-16T10:00:00.000Z")],
    );
    await tx.query(
      `insert into source_envelopes (id, tenant_id, source_system, received_at, raw_payload)
       values ($1, $2, $3, $4, $5)`,
      [
        t.envelopeId,
        tenantId,
        "SYNTH-SOURCE-PG",
        instante("2026-08-16T10:01:00.000Z"),
        { sintetico: true },
      ],
    );
    await tx.query(
      `insert into clinical_observations
         (id, tenant_id, subject_ref, encounter_id, concept, source_value, source_unit, quality,
          provenance, observed_at, effective_at, issued_at, received_at, persisted_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        t.observationId,
        tenantId,
        psr,
        t.encounterId,
        "SYNTH-CONCEPT-SPO2",
        96,
        "%",
        "valid",
        { sourceSystem: "SYNTH-SOURCE-PG", collector: "fronteira-postgres.test" },
        instante("2026-08-16T10:05:00.000Z"),
        instante("2026-08-16T10:05:00.000Z"),
        instante("2026-08-16T10:05:01.000Z"),
        instante("2026-08-16T10:05:02.000Z"),
        instante("2026-08-16T10:05:03.000Z"),
      ],
    );
    await tx.query(
      `insert into evaluation_records
         (id, tenant_id, encounter_id, subject_ref, status, evaluated_at, result, kernel_record)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        t.evaluationId,
        tenantId,
        t.encounterId,
        psr,
        "valido",
        instante("2026-08-16T10:06:00.000Z"),
        { status: "valido" },
        { status: "valid" },
      ],
    );
    await tx.query(
      `insert into alerts (id, tenant_id, encounter_id, raised_at, evaluated_at, severity, reason)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        t.alertId,
        tenantId,
        t.encounterId,
        instante("2026-08-16T10:07:00.000Z"),
        instante("2026-08-16T10:07:00.000Z"),
        "critico",
        "SYNTH-REASON-PG",
      ],
    );
    await tx.query(
      "insert into work_items (id, tenant_id, alert_id, state) values ($1, $2, $3, $4)",
      [t.workItemId, tenantId, t.alertId, "nao_atribuido"],
    );
    await tx.query(
      `insert into audit_events
         (id, tenant_id, actor_id, command, aggregate_type, aggregate_id, occurred_at, idempotency_key)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        t.auditId,
        tenantId,
        `${tenantId}-CLIN-01`,
        "leitura-grade-leitos",
        "tenant",
        tenantId,
        instante("2026-08-16T10:08:00.000Z"),
        `${tenantId}-CORR-01`,
      ],
    );
    await tx.query(
      `insert into outbox_events (tenant_id, ordering_scope, event_type, aggregate_type, aggregate_id, payload)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        tenantId,
        `encounter:${t.encounterId}`,
        "alerta-criado",
        "work_item",
        t.workItemId,
        { id: t.workItemId },
      ],
    );
    await tx.query(
      `insert into idempotency_records
         (tenant_id, idempotency_key, request_hash, status_code, response_body)
       values ($1, $2, $3, $4, $5)`,
      [tenantId, t.idempotencyKey, "SYNTH-HASH-PG", 201, { segredoDoTenant: tenantId }],
    );
  });

  return t;
}

// ---------------------------------------------------------------------------
// Rejeição TIPADA — por que `.rejects.toThrow()` sem tipo é verde falso
// ---------------------------------------------------------------------------

/**
 * `insufficient_privilege`. É o único SQLSTATE que prova "o servidor recusou
 * PORQUE o papel não tem o privilégio".
 */
const SQLSTATE_PRIVILEGIO_INSUFICIENTE = "42501";

/** `foreign_key_violation` — integridade referencial, não erro de sintaxe. */
const SQLSTATE_VIOLACAO_DE_CHAVE_ESTRANGEIRA = "23503";

/**
 * Classe 28 do SQLSTATE (`invalid_authorization_specification`,
 * `invalid_password`). Prova que o servidor REJEITOU a autenticação — e não
 * que o host caiu, que o banco não existe ou que o soquete fechou.
 */
const CLASSE_SQLSTATE_AUTENTICACAO = "28";

/**
 * Captura a rejeição e devolve o erro. Se a promessa CUMPRIR, falha com o
 * contexto — nenhum caminho de escalada pode ser aceito em silêncio.
 */
async function capturarRejeicao(promessa: Promise<unknown>, contexto: string): Promise<unknown> {
  try {
    await promessa;
  } catch (erro) {
    return erro;
  }
  throw new Error(`NÃO houve rejeição — ${contexto}`);
}

interface RecusaObservada {
  readonly sql: string;
  readonly sqlstate: string;
  readonly mensagem: string;
}

/**
 * Executa `sql` como a aplicação e devolve o SQLSTATE da recusa.
 *
 * POR QUE ISTO EXISTE (achado da terceira revisão adversarial): estas suítes
 * asseriam `.rejects.toThrow()` **sem tipo nem mensagem**, o que aceita
 * QUALQUER rejeição. Vários caminhos nomeiam objetos por nome literal
 * (`clinical_observations_tenant_isolation`, `audit_events_no_update`). O
 * PostgreSQL RESOLVE o nome antes de checar propriedade, então:
 *
 *   drop policy clinical_observations_tenant_isolation on clinical_observations;
 *     ERROR: must be owner of relation clinical_observations   -- 42501, controle EXERCIDO
 *   drop policy politica_que_alguem_renomeou on clinical_observations;
 *     ERROR: policy "..." does not exist                       -- 42704, controle NÃO exercido
 *
 * Sem o SQLSTATE, renomear um objeto troca o segundo caso pelo primeiro e o
 * teste segue verde medindo outra coisa. A existência dos objetos nomeados é
 * coberta pelo teste irmão "os objetos nomeados ... EXISTEM".
 */
async function recusaDe(
  porta: AdaptadorPostgres,
  tenantId: string,
  sql: string,
): Promise<RecusaObservada> {
  const erro = await capturarRejeicao(
    porta.comTenant(tenantId, (tx) => tx.query(sql)),
    `o servidor ACEITOU: ${sql}`,
  );
  expect(erro, `a recusa de '${sql}' não veio do servidor PostgreSQL`).toBeInstanceOf(ErroPostgres);
  const pg = erro as ErroPostgres;
  return { sql, sqlstate: pg.codigo, mensagem: pg.message };
}

/**
 * Assere que TODAS as recusas foram por privilégio insuficiente, relatando de
 * uma vez as que não foram (com SQLSTATE e mensagem), em vez de abortar na
 * primeira e esconder as demais.
 */
function exigirRecusaPorPrivilegio(recusas: readonly RecusaObservada[], esperadas: number): void {
  // `esperadas` TEM de ser um literal no ponto de chamada. Passar
  // `caminhos.length` — como esta função recebia — é uma IDENTIDADE: `recusas`
  // é construído 1:1 a partir de `caminhos`, então a asserção era sempre
  // verdadeira e a lista de caminhos podia ir a ZERO com o teste verde
  // (5ª revisão adversarial, ACHADO-05/P1). O guarda abaixo torna a vacuidade
  // impossível mesmo que alguém volte a derivar o número.
  expect(
    esperadas,
    "cardinalidade esperada precisa ser um literal maior que zero — derivá-la do próprio array torna a asserção vazia",
  ).toBeGreaterThan(0);
  expect(recusas).toHaveLength(esperadas);
  const forasDoControle = recusas.filter((r) => r.sqlstate !== SQLSTATE_PRIVILEGIO_INSUFICIENTE);
  expect(
    forasDoControle,
    "recusa que NÃO foi por privilégio insuficiente (42501): o comando falhou por outro motivo " +
      "(objeto inexistente, sintaxe, tipo) e o controle de privilégio NÃO foi exercido",
  ).toEqual([]);
}

// ---------------------------------------------------------------------------
// Suíte
// ---------------------------------------------------------------------------

function registrarSuite(urlSuperusuario: string): void {
  describe("fronteira de isolamento de dados contra PostgreSQL real e efêmero", () => {
    let banco: BancoProvisionado;
    let porta: AdaptadorPostgres;
    let tenantA: TenantSemeado;
    let tenantB: TenantSemeado;

    const config = (extra?: Partial<ConfiguracaoPostgres>): ConfiguracaoPostgres => ({
      url: banco.urlAplicacao,
      ...extra,
    });

    beforeAll(async () => {
      banco = await provisionarBanco({
        urlSuperusuario,
        banco: nomeDeBancoDeVerificacao(),
        recriarBanco: true,
      });
      porta = await AdaptadorPostgres.abrir({ url: banco.urlAplicacao, tamanhoMaximo: 4 });
      tenantA = await semearTenant(porta, TENANT_A);
      tenantB = await semearTenant(porta, TENANT_B);
    }, TEMPO_LIMITE_GANCHO_MS);

    afterAll(async () => {
      await (porta as AdaptadorPostgres | undefined)?.encerrar();
      // Só derruba o que ESTA execução criou: um cluster reusado (ou um
      // servidor externo de `PG_TEST_URL`) pertence a quem o subiu.
      if (cluster.efemero && cluster.criado !== false) {
        invocarCluster("down");
      }
    }, TEMPO_LIMITE_GANCHO_MS);

    // -----------------------------------------------------------------------
    // (a) A identidade da aplicação não recupera superusuário
    //     SEC-0009 | THR-0050 (P0) | ADR-0016 §4.1 | ACHADO-01
    // -----------------------------------------------------------------------

    describe("(a) a identidade da aplicação não recupera privilégio", () => {
      it(
        "conecta AUTENTICADA como intensicare_app — nunca rebaixada a partir de superusuário",
        async () => {
          const identidade = await porta.comTenant(TENANT_A, (tx) =>
            tx.query<{
              atual: string;
              sessao: string;
              super: boolean;
              bypass: boolean;
            }>(`select current_user::text as atual, session_user::text as sessao,
                        r.rolsuper as super, r.rolbypassrls as bypass
                   from pg_roles r where r.rolname = session_user`),
          );
          // `current_user === session_user` é o ponto: sob o simulador PGlite
          // esses dois divergem (autenticado postgres, corrente app) — e é
          // dessa divergência que nasce o ACHADO-01.
          expect(identidade.rows[0]).toEqual({
            atual: PAPEL_APLICACAO,
            sessao: PAPEL_APLICACAO,
            super: false,
            bypass: false,
          });
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "TODO caminho SQL de escalada é recusado pelo servidor",
        async () => {
          const caminhos = [
            "set session authorization postgres",
            `set session authorization ${PAPEL_MIGRADOR}`,
            "set role postgres",
            `set role ${PAPEL_MIGRADOR}`,
            `alter role ${PAPEL_APLICACAO} superuser`,
            `alter role ${PAPEL_APLICACAO} bypassrls`,
            `alter role ${PAPEL_APLICACAO} createrole`,
            "create role SYNTH_intruso superuser login",
            `grant ${PAPEL_MIGRADOR} to ${PAPEL_APLICACAO}`,
            "create table public.synth_intruso (id text)",
            "create function public.synth_escalar() returns void as $x$ begin end $x$ language plpgsql security definer",
            `alter table clinical_observations owner to ${PAPEL_APLICACAO}`,
            "alter table clinical_observations disable row level security",
            "alter table clinical_observations no force row level security",
            "drop policy clinical_observations_tenant_isolation on clinical_observations",
            "alter policy clinical_observations_tenant_isolation on clinical_observations using (true)",
            "drop trigger audit_events_no_update on audit_events",
            "alter table audit_events disable trigger all",
            "create or replace function public.intensicare_forbid_mutation() returns trigger as $x$ begin return new; end $x$ language plpgsql",
            "copy (select 1) to program 'id'",
            "select pg_read_file('/etc/hosts')",
            "truncate audit_events",
          ];
          // LITERAL, nunca `caminhos.length`: encolher a lista tem de FALHAR.
          expect(caminhos, "a lista de caminhos de escalada encolheu").toHaveLength(22);
          const recusas: RecusaObservada[] = [];
          for (const sql of caminhos) {
            recusas.push(await recusaDe(porta, TENANT_A, sql));
          }
          // Cada caminho tem de ser recusado POR PRIVILÉGIO (42501). Antes
          // isto era `.rejects.toThrow()` sem tipo: aceitava qualquer
          // rejeição, inclusive "objeto não existe" (42704).
          exigirRecusaPorPrivilegio(recusas, 22);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "os objetos nomeados nos caminhos de escalada EXISTEM (senão a recusa mediria outra coisa)",
        async () => {
          // Contraparte indispensável do teste acima. O PostgreSQL resolve o
          // NOME antes de checar propriedade: renomear a política ou o
          // gatilho troca 42501 ("must be owner") por 42704 ("does not
          // exist"), e sem esta verificação a suíte continuaria verde com o
          // controle desligado. Aqui a asserção é a existência do alvo.
          const alvos = await porta.comTenant(TENANT_A, async (tx) => ({
            politica: await tx.query<{ n: number }>(
              `select count(*)::int as n from pg_policy p
                 join pg_class c on c.oid = p.polrelid
                where c.relname = 'clinical_observations'
                  and p.polname = 'clinical_observations_tenant_isolation'`,
            ),
            gatilho: await tx.query<{ n: number }>(
              `select count(*)::int as n from pg_trigger t
                 join pg_class c on c.oid = t.tgrelid
                where c.relname = 'audit_events'
                  and t.tgname = 'audit_events_no_update'
                  and not t.tgisinternal`,
            ),
            funcao: await tx.query<{ n: number }>(
              `select count(*)::int as n from pg_proc p
                 join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public' and p.proname = 'intensicare_forbid_mutation'`,
            ),
            migrador: await tx.query<{ n: number }>(
              "select count(*)::int as n from pg_roles where rolname = $1",
              [PAPEL_MIGRADOR],
            ),
            tabelas: await tx.query<{ n: number }>(
              `select count(*)::int as n from pg_class c
                 join pg_namespace ns on ns.oid = c.relnamespace
                where ns.nspname = 'public' and c.relkind = 'r'
                  and c.relname in ('clinical_observations', 'audit_events')`,
            ),
          }));

          expect(
            alvos.politica.rows[0]?.n,
            "a política 'clinical_observations_tenant_isolation' não existe — " +
              "os caminhos que a nomeiam falhariam por 42704, não por privilégio",
          ).toBe(1);
          expect(
            alvos.gatilho.rows[0]?.n,
            "o gatilho 'audit_events_no_update' não existe — " +
              "os caminhos que o nomeiam falhariam por 42704, não por privilégio",
          ).toBe(1);
          expect(
            alvos.funcao.rows[0]?.n,
            "a função 'public.intensicare_forbid_mutation' não existe — " +
              "`create or replace` sobre ela não exerceria propriedade",
          ).toBe(1);
          expect(
            alvos.migrador.rows[0]?.n,
            `o papel '${PAPEL_MIGRADOR}' não existe — 'set role'/'grant' falhariam por 42704`,
          ).toBe(1);
          expect(
            alvos.tabelas.rows[0]?.n,
            "clinical_observations e/ou audit_events não existem",
          ).toBe(2);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "`reset session authorization` volta ao papel de aplicação, não ao superusuário",
        async () => {
          // Este é o caminho que PARECE inofensivo e é o que quebra sob PGlite:
          // lá ele restaura o usuário autenticado, que é superusuário.
          const depois = await porta.comTenant(TENANT_A, async (tx) => {
            await tx.query("reset session authorization");
            await tx.query("reset role");
            return tx.query<{ atual: string }>("select current_user::text as atual");
          });
          expect(depois.rows[0]?.atual).toBe(PAPEL_APLICACAO);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "depois de TODAS as tentativas, a RLS continua valendo (o estado não ficou aberto)",
        async () => {
          const visto = await porta.comTenant(TENANT_A, (tx) =>
            tx.query<{ n: number }>("select count(*)::int as n from organizations"),
          );
          expect(visto.rows[0]?.n).toBe(1);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "a CREDENCIAL da aplicação não autentica como superusuário nem como migrador",
        async () => {
          // Fecha o caminho que uma autenticação `trust` deixaria aberto:
          // não basta bloquear `SET ROLE` se bastasse reconectar com outro nome.
          for (const usuario of ["postgres", PAPEL_MIGRADOR]) {
            const urlForjada = urlCom(banco.urlAplicacao, { usuario });
            const erro = await capturarRejeicao(
              ConexaoPostgres.conectar(opcoesDaUrl(urlForjada, "SYNTH-intruso")),
              `a senha da aplicação autenticou como '${usuario}'`,
            );
            // Tipada: `.rejects.toThrow()` sem tipo aceitaria host inalcançável,
            // banco inexistente ou soquete fechado — nenhum deles prova que o
            // servidor RECUSOU a credencial. Só a classe 28 do SQLSTATE prova.
            expect(
              erro,
              `a rejeição de '${usuario}' não veio do servidor (transporte, não autenticação)`,
            ).toBeInstanceOf(ErroPostgres);
            const pg = erro as ErroPostgres;
            expect(
              pg.codigo.slice(0, 2),
              `autenticação como '${usuario}' falhou por SQLSTATE ${pg.codigo} (${pg.message}), ` +
                "que não é recusa de credencial",
            ).toBe(CLASSE_SQLSTATE_AUTENTICACAO);
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "A/B na MESMA base: a topologia ANTIGA (autenticar como superusuário e rebaixar) permite a escalada; a NOVA não",
        async () => {
          // Este é o par vermelho/verde do ACHADO-01, medido no mesmo servidor,
          // sobre os mesmos dados, no mesmo instante — a única diferença é COMO
          // a aplicação obtém o papel `intensicare_app`.

          // --- TOPOLOGIA ANTIGA: autentica como superusuário e se REBAIXA.
          //     É exatamente o que `downgradeToApplicationRole` faz no simulador.
          const antiga = await ConexaoPostgres.conectar(
            opcoesDaUrl(banco.urlSuperusuarioNoBanco, "SYNTH-topologia-antiga"),
          );
          try {
            await antiga.executar(`set session authorization ${PAPEL_APLICACAO}`);
            const rebaixado = await antiga.consultar<{ u: string }>(
              "select current_user::text as u",
            );
            expect(rebaixado.rows[0]?.u).toBe(PAPEL_APLICACAO);

            // O rebaixamento é REVERSÍVEL: o usuário autenticado é superusuário.
            await antiga.executar("set session authorization postgres");
            const restaurado = await antiga.consultar<{ u: string }>(
              "select current_user::text as u",
            );
            expect(
              restaurado.rows[0]?.u,
              "a escalada deveria funcionar na topologia antiga — se não funciona, este teste perdeu o sentido",
            ).toBe("postgres");

            // E, reescalado, a RLS deixa de valer para TODOS os tenants.
            const todosOsTenants = await antiga.consultar<{ tenant_id: string }>(
              "select tenant_id from organizations order by tenant_id",
            );
            expect(todosOsTenants.rows.map((r) => r.tenant_id)).toEqual([TENANT_A, TENANT_B]);
          } finally {
            await antiga.fechar();
          }

          // --- TOPOLOGIA NOVA: autentica JÁ como papel sem privilégio.
          const nova = await ConexaoPostgres.conectar(
            opcoesDaUrl(banco.urlAplicacao, "SYNTH-topologia-nova"),
          );
          try {
            // NÃO listado no despacho, mesma classe de defeito e mesmo arquivo:
            // este é o lado VERDE do par vermelho/verde do ACHADO-01, e
            // `.rejects.toThrow()` sem tipo aceitaria soquete fechado, erro de
            // sintaxe ou tempo esgotado como se fossem "escalada recusada".
            const erroDaEscalada = await capturarRejeicao(
              nova.executar("set session authorization postgres"),
              "a topologia NOVA permitiu a escalada",
            );
            expect(erroDaEscalada).toBeInstanceOf(ErroPostgres);
            const pgEscalada = erroDaEscalada as ErroPostgres;
            expect(
              pgEscalada.codigo,
              `a escalada foi recusada por SQLSTATE ${pgEscalada.codigo} ` +
                `("${pgEscalada.message}"), e não por privilégio insuficiente`,
            ).toBe(SQLSTATE_PRIVILEGIO_INSUFICIENTE);

            const aindaApp = await nova.consultar<{ u: string }>("select current_user::text as u");
            expect(aindaApp.rows[0]?.u).toBe(PAPEL_APLICACAO);

            // Sem escopo de tenant, e sem escalada possível: nenhuma linha.
            const semEscopo = await nova.consultar<{ n: number }>(
              "select count(*)::int as n from organizations",
            );
            expect(semEscopo.rows[0]?.n).toBe(0);
          } finally {
            await nova.fechar();
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "a aplicação RECUSA abrir sobre identidade privilegiada (superusuário ou dono do esquema)",
        async () => {
          await expect(
            AdaptadorPostgres.abrir({ url: banco.urlSuperusuarioNoBanco }),
          ).rejects.toThrow(ErroIdentidadeInsegura);
          await expect(AdaptadorPostgres.abrir({ url: banco.urlMigrador })).rejects.toThrow(
            ErroIdentidadeInsegura,
          );
        },
        TEMPO_LIMITE_MS,
      );
    });

    // -----------------------------------------------------------------------
    // (b) Sem app.tenant_id, nenhuma linha em nenhuma das 13 tabelas
    //     SEC-0001, SAF-0007 | THR-0002 (P0)
    // -----------------------------------------------------------------------

    describe("(b) fail-closed sem contexto de tenant", () => {
      it(
        "o esquema tem exatamente as 13 tabelas esperadas, todas com tenant_id + RLS + FORCE + política",
        async () => {
          const fitness = await porta.comTenant(TENANT_A, (tx) =>
            tx.query<{
              relname: string;
              rls: boolean;
              force: boolean;
              tem_tenant: boolean;
              tem_politica: boolean;
              dono: string;
            }>(`select c.relname,
                       c.relrowsecurity as rls,
                       c.relforcerowsecurity as force,
                       exists (select 1 from pg_attribute a
                                where a.attrelid = c.oid and a.attname = 'tenant_id'
                                  and a.attnum > 0 and not a.attisdropped) as tem_tenant,
                       exists (select 1 from pg_policy p where p.polrelid = c.oid) as tem_politica,
                       pg_get_userbyid(c.relowner)::text as dono
                  from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relkind = 'r'
                 order by c.relname`),
          );
          expect(fitness.rows.map((r) => r.relname)).toEqual([...TABELAS_SOB_RLS]);
          for (const linha of fitness.rows) {
            expect(linha.rls, `${linha.relname} sem RLS`).toBe(true);
            expect(linha.force, `${linha.relname} sem FORCE ROW LEVEL SECURITY`).toBe(true);
            expect(linha.tem_tenant, `${linha.relname} sem tenant_id`).toBe(true);
            expect(linha.tem_politica, `${linha.relname} sem política`).toBe(true);
            // A aplicação nunca é dona: dono ignora RLS quando FORCE cai.
            expect(linha.dono, `${linha.relname} pertence à aplicação`).toBe(PAPEL_MIGRADOR);
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "sem contexto, NENHUMA das 13 tabelas devolve linha — com dois tenants povoados",
        async () => {
          const conexao = await porta.pool.adquirir();
          try {
            for (const tabela of TABELAS_SOB_RLS) {
              const r = await conexao.consultar<{ n: number }>(
                `select count(*)::int as n from ${tabela}`,
              );
              expect(r.rows[0]?.n, `${tabela} vazou linhas sem contexto de tenant`).toBe(0);
            }
          } finally {
            await porta.pool.liberar(conexao);
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "sem contexto, a ESCRITA também é negada (WITH CHECK), não só a leitura",
        async () => {
          const conexao = await porta.pool.adquirir();
          try {
            await expect(
              conexao.consultar(
                `insert into audit_events
                   (id, tenant_id, actor_id, command, aggregate_type, aggregate_id, occurred_at, idempotency_key)
                 values ('SYNTH-SEM-CONTEXTO', $1, 'SYNTH-INTRUSO', 'forjar', 'tenant', 'x', '{}'::jsonb, 'k')`,
                [TENANT_A],
              ),
            ).rejects.toThrow(/row-level security/i);
          } finally {
            await porta.pool.liberar(conexao);
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "contexto VAZIO é tratado como contexto AUSENTE em todas as 13 tabelas",
        async () => {
          // Regressão do endurecimento feito na 0003. Sem `nullif(..., '')` na
          // política, `app.tenant_id = ''` seria um escopo VÁLIDO que casaria
          // com qualquer linha de `tenant_id = ''` — e uma conexão reciclada
          // cai exatamente nesse estado.
          const conexao = await porta.pool.adquirir();
          try {
            await conexao.executar("begin");
            await conexao.consultar("select set_config('app.tenant_id', '', true)");
            for (const tabela of TABELAS_SOB_RLS) {
              const r = await conexao.consultar<{ n: number }>(
                `select count(*)::int as n from ${tabela}`,
              );
              expect(r.rows[0]?.n, `${tabela} devolveu linha com escopo vazio`).toBe(0);
            }
            await expect(
              conexao.consultar(
                `insert into patient_identities (id, tenant_id, subject_ref)
                 values ('SYNTH-ESCOPO-VAZIO', '', 'amh:psr:v1:SYNTH-ESCOPO-VAZIO')`,
              ),
            ).rejects.toThrow(/row-level security/i);
            await conexao.executar("rollback");
          } finally {
            await porta.pool.liberar(conexao);
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "tenant vazio é recusado pela porta — nunca vira consulta sem predicado",
        async () => {
          await expect(porta.comTenant("", async () => undefined)).rejects.toThrow(
            ErroTenantAusente,
          );
          await expect(porta.comTenant("   ", async () => undefined)).rejects.toThrow(
            ErroTenantAusente,
          );
        },
        TEMPO_LIMITE_MS,
      );
    });

    // -----------------------------------------------------------------------
    // (c) Tenant A não lê nem escreve linha de B
    //     SEC-0009, SAF-0008 | THR-0001, THR-0002 (P0)
    // -----------------------------------------------------------------------

    describe("(c) isolamento entre tenants sob tentativa ativa de contorno", () => {
      it(
        "cada tenant lê exatamente 1 linha própria em cada tabela e 0 do vizinho",
        async () => {
          for (const [tenant, vizinho] of [
            [tenantA, tenantB],
            [tenantB, tenantA],
          ] as const) {
            await porta.comTenant(tenant.tenantId, async (tx) => {
              for (const tabela of TABELAS_SOB_RLS) {
                const proprias = await tx.query<{ n: number }>(
                  `select count(*)::int as n from ${tabela} where tenant_id = $1`,
                  [tenant.tenantId],
                );
                const alheias = await tx.query<{ n: number }>(
                  `select count(*)::int as n from ${tabela} where tenant_id = $1`,
                  [vizinho.tenantId],
                );
                const total = await tx.query<{ n: number }>(
                  `select count(*)::int as n from ${tabela}`,
                );
                expect(proprias.rows[0]?.n, `${tabela}: linha própria sumiu`).toBe(1);
                expect(alheias.rows[0]?.n, `${tabela} vazou linha do vizinho`).toBe(0);
                expect(total.rows[0]?.n, `${tabela}: total difere do próprio`).toBe(1);
              }
            });
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "escrita marcada com o tenant do vizinho é recusada pela política WITH CHECK",
        async () => {
          const tentativas: readonly (readonly [string, string, unknown[]])[] = [
            [
              "audit_events",
              `insert into audit_events
                 (id, tenant_id, actor_id, command, aggregate_type, aggregate_id, occurred_at, idempotency_key)
               values ($1, $2, 'SYNTH-INTRUSO', 'forjar', 'tenant', 'x', '{}'::jsonb, 'k')`,
              ["SYNTH-CROSS-AUDIT", TENANT_B],
            ],
            [
              "outbox_events",
              `insert into outbox_events (tenant_id, ordering_scope, event_type, aggregate_type, aggregate_id, payload)
               values ($1, 'forjado', 'alerta-criado', 'work_item', 'x', '{}'::jsonb)`,
              [TENANT_B],
            ],
            [
              "idempotency_records",
              `insert into idempotency_records (tenant_id, idempotency_key, request_hash, status_code, response_body)
               values ($1, 'SYNTH-CROSS-IDEM', 'h', 201, '{}'::jsonb)`,
              [TENANT_B],
            ],
            [
              // Sem chave estrangeira e sem restrição de unicidade em jogo: a
              // recusa observada é da POLÍTICA, não de outra restrição que
              // dispararia antes e daria um verde por motivo errado.
              "patient_identities",
              "insert into patient_identities (id, tenant_id, subject_ref) values ($1, $2, $3)",
              ["SYNTH-CROSS-PAT", TENANT_B, "amh:psr:v1:SYNTH-CROSS-PAT"],
            ],
          ];
          for (const [tabela, sql, params] of tentativas) {
            await expect(
              porta.comTenant(TENANT_A, (tx) => tx.query(sql, [...params])),
              `${tabela} aceitou escrita cross-tenant`,
            ).rejects.toThrow(/row-level security/i);
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "UPDATE cross-tenant por id conhecido não afeta nenhuma linha da vítima",
        async () => {
          const antes = await porta.comTenant(TENANT_B, (tx) =>
            tx.query<{ state: string; version: number }>(
              "select state, version from work_items where id = $1",
              [tenantB.workItemId],
            ),
          );
          const afetadas = await porta.comTenant(TENANT_A, async (tx) => {
            const r = await tx.query(
              "update work_items set state = 'resolvido', version = version + 1 where id = $1",
              [tenantB.workItemId],
            );
            return r.affectedRows;
          });
          expect(afetadas).toBe(0);

          const depois = await porta.comTenant(TENANT_B, (tx) =>
            tx.query<{ state: string; version: number }>(
              "select state, version from work_items where id = $1",
              [tenantB.workItemId],
            ),
          );
          expect(depois.rows[0]).toEqual(antes.rows[0]);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "o segredo do registro de idempotência do vizinho não é legível",
        async () => {
          const comoIntruso = await porta.comTenant(TENANT_A, (tx) =>
            tx.query<{ response_body: unknown }>(
              "select response_body from idempotency_records where idempotency_key = $1",
              [tenantB.idempotencyKey],
            ),
          );
          expect(comoIntruso.rows).toEqual([]);

          const comoDono = await porta.comTenant(TENANT_B, (tx) =>
            tx.query<{ response_body: unknown }>(
              "select response_body from idempotency_records where idempotency_key = $1",
              [tenantB.idempotencyKey],
            ),
          );
          expect(comoDono.rows[0]?.response_body).toEqual({ segredoDoTenant: TENANT_B });
        },
        TEMPO_LIMITE_MS,
      );

      it(
        // Nome preciso a pedido da 2ª revisão: o escopo NÃO é "imutável" em
        // sentido absoluto — um `ROLLBACK TO SAVEPOINT` anterior ao instalar
        // pode DESTRUÍ-LO (ver ACHADO-04). O que nunca acontece é ele ser
        // SUBSTITUÍDO por outro tenant. Destruir é degradação segura;
        // substituir seria vazamento.
        "ACHADO-02 — o escopo não pode ser SUBSTITUÍDO dentro da transação: SQL arbitrário não pivota para outro tenant",
        async () => {
          // Refutação de revisão adversarial independente: `app.tenant_id` era
          // um parâmetro de sessão que o PRÓPRIO papel de aplicação podia
          // reescrever. Dentro de `comTenant(A)`, um `set_config(...,'B',true)`
          // reescopava a transação em curso — e leitura E escrita cross-tenant
          // passavam. A migração 0003 fechou a recuperação de SUPERUSUÁRIO, não
          // a TROCA DE TENANT. Este teste fecha a segunda.
          //
          // O que se exige aqui é o que o banco PODE garantir: dentro de uma
          // transação já escopada, nada muda o escopo. Qual tenant a transação
          // recebe ao ABRIR continua sendo decisão da identidade autenticada
          // (SEC-0001) — ver o teste seguinte, que documenta esse limite.

          // 1) Reescrever o parâmetro de sessão não muda mais o que a RLS mostra.
          const aposReescrita = await porta.comTenant(TENANT_A, async (tx) => {
            await tx.query("select set_config('app.tenant_id', $1, true)", [TENANT_B]);
            return tx.query<{ id: string }>("select id from organizations order by id");
          });
          expect(
            aposReescrita.rows.map((r) => r.id),
            "reescrever app.tenant_id reescopou a transação — vazamento de leitura cross-tenant",
          ).toEqual([tenantA.organizationId]);

          // 2) Nem a ESCRITA passa a valer para o vizinho.
          await expect(
            porta.comTenant(TENANT_A, async (tx) => {
              await tx.query("select set_config('app.tenant_id', $1, true)", [TENANT_B]);
              await tx.query(
                "insert into care_units (id, tenant_id, organization_id, name) values ($1, $2, $3, $4)",
                ["SYNTH-INJETADA-EM-B", TENANT_B, tenantB.organizationId, "UTI forjada por A"],
              );
            }),
            "escrita cross-tenant passou após reescrever app.tenant_id",
          ).rejects.toThrow(/row-level security/i);

          // 3) E a vítima não recebeu nada.
          const vistoPorB = await porta.comTenant(TENANT_B, (tx) =>
            tx.query<{ id: string }>("select id from care_units order by id"),
          );
          expect(vistoPorB.rows.map((r) => r.id)).toEqual([tenantB.careUnitId]);

          // 4) Chamar o instalador de escopo para OUTRO tenant é recusado pelo
          //    servidor — não silenciosamente ignorado.
          await expect(
            porta.comTenant(TENANT_A, (tx) =>
              tx.query("select intensicare_escopo.instalar($1)", [TENANT_B]),
            ),
            "o instalador aceitou trocar o tenant no meio da transação",
          ).rejects.toThrow(/escopo de tenant já instalado/i);

          // 5) Reinstalar o MESMO tenant é inofensivo (idempotente).
          const mesmo = await porta.comTenant(TENANT_A, (tx) =>
            tx.query<{ instalar: string }>("select intensicare_escopo.instalar($1)", [TENANT_A]),
          );
          expect(mesmo.rows[0]?.instalar).toBe(TENANT_A);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "ACHADO-04 — ROLLBACK TO SAVEPOINT desfaz o selo, mas NÃO devolve o direito de instalar outro tenant",
        async () => {
          // Segunda revisão adversarial: o selo é uma LINHA, e
          // `rollback to savepoint` desfaz linhas. Com um savepoint ANTERIOR ao
          // `instalar`, o atacante desfazia o selo e instalava outro tenant na
          // MESMA transação — o que tornava falsa a palavra "write-once".
          //
          // Este caminho não é alcançável por `comTenant` (que instala ANTES de
          // `fn`), então o teste usa conexão crua para reproduzir o ataque
          // exatamente como o revisor o executou.
          const conexao = await porta.pool.adquirir();
          try {
            await conexao.executar("begin");
            await conexao.executar("savepoint s0");
            await conexao.consultar("select intensicare_escopo.instalar($1)", [TENANT_A]);
            const comoA = await conexao.consultar<{ id: string }>(
              "select id from organizations order by id",
            );
            expect(comoA.rows.map((r) => r.id)).toEqual([tenantA.organizationId]);

            await conexao.executar("rollback to savepoint s0");

            // Sem o selo, a transação fica SEM escopo — fail-closed, não "vê tudo".
            const semEscopo = await conexao.consultar<{ n: number }>(
              "select count(*)::int as n from organizations",
            );
            expect(semEscopo.rows[0]?.n).toBe(0);

            // E instalar OUTRO tenant precisa ser recusado: o marcador
            // não-transacional lembra que esta transação já instalou um escopo.
            await expect(
              conexao.consultar("select intensicare_escopo.instalar($1)", [TENANT_B]),
              "rollback to savepoint devolveu o direito de instalar outro tenant",
              // Regex específico do caso savepoint: não pode passar pela
              // mensagem genérica de "escopo já instalado", que cobre outro
              // caminho e daria um verde por motivo errado.
            ).rejects.toThrow(/já escreveu sem selo de escopo válido/i);

            await conexao.executar("rollback");
          } finally {
            await porta.pool.liberar(conexao);
          }

          // A vítima não recebeu nada.
          const vistoPorB = await porta.comTenant(TENANT_B, (tx) =>
            tx.query<{ id: string }>("select id from beds order by id"),
          );
          expect(vistoPorB.rows.map((r) => r.id)).toEqual([tenantB.bedId]);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "savepoint POSTERIOR ao escopo (uso legítimo) continua funcionando",
        async () => {
          // Guarda contra falso-positivo do controle acima: um repositório que
          // usa savepoint para retentativa não pode ser quebrado por ele.
          const visto = await porta.comTenant(TENANT_A, async (tx) => {
            await tx.query("savepoint s1");
            await tx.query("select 1");
            await tx.query("rollback to savepoint s1");
            return tx.query<{ id: string }>("select id from organizations order by id");
          });
          expect(visto.rows.map((r) => r.id)).toEqual([tenantA.organizationId]);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "a aplicação não pode escrever nem ler a tabela de selo que ancora o escopo",
        async () => {
          // Guarda contra falso-verde: sem esta asserção, TODAS as tentativas
          // abaixo passariam por "esquema não existe" em vez de por privilégio.
          const ancora = await porta.comTenant(TENANT_A, (tx) =>
            tx.query<{ n: number }>(
              `select count(*)::int as n from pg_class c
                 join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'intensicare_escopo' and c.relname = 'selo'`,
            ),
          );
          expect(ancora.rows[0]?.n, "a tabela de selo não existe — teste inconclusivo").toBe(1);

          const caminhosDaAncora = [
            "select * from intensicare_escopo.selo",
            "update intensicare_escopo.selo set tenant_id = 'SYNTH-TENANT-PG-B'",
            "delete from intensicare_escopo.selo",
            "insert into intensicare_escopo.selo (pid, inicio_txn, tenant_id) values (1, '1'::xid8, 'SYNTH-X')",
            "alter table intensicare_escopo.selo disable row level security",
            "drop function intensicare_escopo.instalar(text)",
            "create table intensicare_escopo.forjada (id text)",
          ];
          // LITERAL, nunca `caminhosDaAncora.length`.
          expect(caminhosDaAncora, "a lista de caminhos à âncora encolheu").toHaveLength(7);
          const recusas: RecusaObservada[] = [];
          for (const sql of caminhosDaAncora) {
            recusas.push(await recusaDe(porta, TENANT_A, sql));
          }
          // A âncora acima prova que o objeto EXISTE; esta prova que a recusa
          // foi por PRIVILÉGIO. Sem as duas, "esquema não existe" e "acesso
          // negado" produzem o mesmo verde.
          exigirRecusaPorPrivilegio(recusas, 7);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "LIMITE HONESTO: o banco não distingue troca legítima de tenant entre transações — isso é SEC-0001, não SEC-0009",
        async () => {
          // Não é defeito a consertar aqui: é a propriedade estrutural do
          // controle. A MESMA conexão, em transações DIFERENTES, atende
          // tenants diferentes — é assim que um pool multi-tenant funciona.
          // Quem escolhe o tenant ao abrir a transação é a identidade
          // autenticada (`apps/api`), e essa verificação NÃO está fechada
          // nesta fatia. A RLS impede a consulta sem predicado de tenant
          // (THR-0002); ela não substitui SEC-0001 (THR-0001).
          const solo = await AdaptadorPostgres.abrir(config({ tamanhoMaximo: 1 }));
          try {
            const comoA = await solo.comTenant(TENANT_A, (tx) =>
              tx.query<{ id: string }>("select id from organizations"),
            );
            const comoB = await solo.comTenant(TENANT_B, (tx) =>
              tx.query<{ id: string }>("select id from organizations"),
            );
            expect(comoA.rows.map((r) => r.id)).toEqual([tenantA.organizationId]);
            expect(comoB.rows.map((r) => r.id)).toEqual([tenantB.organizationId]);
          } finally {
            await solo.encerrar();
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "append-only por gatilho vale sob PostgreSQL real (UPDATE/DELETE barrados)",
        async () => {
          for (const tabela of [
            "source_envelopes",
            "clinical_observations",
            "evaluation_records",
            "alerts",
            "audit_events",
          ]) {
            await expect(
              porta.comTenant(TENANT_A, (tx) =>
                tx.query(`update ${tabela} set tenant_id = tenant_id`),
              ),
              `${tabela} aceitou UPDATE`,
            ).rejects.toThrow(/append-only/i);
            await expect(
              porta.comTenant(TENANT_A, (tx) => tx.query(`delete from ${tabela}`)),
              `${tabela} aceitou DELETE`,
            ).rejects.toThrow(/append-only/i);
          }
        },
        TEMPO_LIMITE_MS,
      );
    });

    // -----------------------------------------------------------------------
    // (e) IDOR sem oráculo de enumeração
    //     SEC-0003, SEC-0009 | THR-0019 (P0)
    // -----------------------------------------------------------------------

    describe("(e) sondagem IDOR sem oráculo de enumeração", () => {
      it(
        "id que EXISTE noutro tenant e id que NÃO EXISTE produzem resposta indistinguível",
        async () => {
          const inexistente = "SYNTH-ID-QUE-NAO-EXISTE-EM-LUGAR-NENHUM";
          // Identificadores REAIS e existentes do tenant vizinho: o adversário
          // já os conhece (vazaram por log, referência, ou adivinhação).
          const idsDoVizinho: Record<(typeof TABELAS_COM_ID)[number], string> = {
            alerts: tenantB.alertId,
            audit_events: tenantB.auditId,
            beds: tenantB.bedId,
            care_units: tenantB.careUnitId,
            clinical_observations: tenantB.observationId,
            encounters: tenantB.encounterId,
            evaluation_records: tenantB.evaluationId,
            organizations: tenantB.organizationId,
            patient_identities: tenantB.patientId,
            source_envelopes: tenantB.envelopeId,
            work_items: tenantB.workItemId,
          };
          await porta.comTenant(TENANT_A, async (tx) => {
            for (const tabela of TABELAS_COM_ID) {
              const existeNoVizinho = await tx.query(`select * from ${tabela} where id = $1`, [
                idsDoVizinho[tabela],
              ]);
              const naoExiste = await tx.query(`select * from ${tabela} where id = $1`, [
                inexistente,
              ]);
              expect(
                existeNoVizinho.rows,
                `${tabela}: resposta difere entre "existe noutro tenant" e "não existe"`,
              ).toEqual(naoExiste.rows);
              expect(existeNoVizinho.affectedRows).toEqual(naoExiste.affectedRows);
            }
          });
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "UPDATE em id do vizinho e em id inexistente devolvem o MESMO resultado (0 linhas, sem erro)",
        async () => {
          const doVizinho = await porta.comTenant(TENANT_A, (tx) =>
            tx.query("update work_items set state = 'resolvido' where id = $1", [
              tenantB.workItemId,
            ]),
          );
          const inexistente = await porta.comTenant(TENANT_A, (tx) =>
            tx.query("update work_items set state = 'resolvido' where id = $1", [
              "SYNTH-WI-INEXISTENTE",
            ]),
          );
          expect(doVizinho.affectedRows).toBe(0);
          expect(inexistente.affectedRows).toBe(0);
          expect(doVizinho.rows).toEqual(inexistente.rows);
        },
        TEMPO_LIMITE_MS,
      );
    });

    // -----------------------------------------------------------------------
    // (d) Reuso de pool e (f) transação abortada
    //     SEC-0001, SAF-0007 | THR-0002 (P0)
    // -----------------------------------------------------------------------

    describe("(d) conexão devolvida ao pool não carrega o tenant anterior", () => {
      it(
        "a MESMA conexão física, reusada, não enxerga o tenant da transação anterior",
        async () => {
          // `tamanhoMaximo: 1` garante que é a mesma conexão física — sem isso
          // o teste passaria por sorte (conexão nova, sempre limpa).
          const solo = await AdaptadorPostgres.abrir(config({ tamanhoMaximo: 1 }));
          try {
            const pidA = await solo.comTenant(TENANT_A, (tx) =>
              tx.query<{ pid: number; org: string }>(
                "select pg_backend_pid() as pid, (select id from organizations) as org",
              ),
            );
            const pidB = await solo.comTenant(TENANT_B, (tx) =>
              tx.query<{ pid: number; org: string }>(
                "select pg_backend_pid() as pid, (select id from organizations) as org",
              ),
            );
            expect(pidA.rows[0]?.pid, "o pool abriu conexão nova — teste inconclusivo").toBe(
              pidB.rows[0]?.pid,
            );
            expect(pidA.rows[0]?.org).toBe(tenantA.organizationId);
            expect(pidB.rows[0]?.org).toBe(tenantB.organizationId);
          } finally {
            await solo.encerrar();
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "mesmo um app.tenant_id posto em escopo de SESSÃO é apagado antes do reuso",
        async () => {
          // Ataque: código dentro da transação instala o escopo com
          // `is_local = false`, que SOBREVIVE ao commit. Só a higienização da
          // devolução (`DISCARD ALL`) impede que o próximo tenant o herde.
          const solo = await AdaptadorPostgres.abrir(config({ tamanhoMaximo: 1 }));
          try {
            await solo.comTenant(TENANT_A, async (tx) => {
              await tx.query("select set_config('app.tenant_id', $1, false)", [TENANT_A]);
            });
            const conexao = await solo.pool.adquirir();
            try {
              // OBSERVED em PostgreSQL real: depois de `DISCARD ALL`, um GUC
              // personalizado que JÁ foi definido volta ao "valor de reset",
              // que é a CADEIA VAZIA — não NULL. É por isso que a migração
              // 0003 envolve o `current_setting` em `nullif(..., '')`: sem
              // isso, contexto vazio e contexto ausente não seriam a mesma
              // coisa, e o fail-closed passaria a depender do conteúdo da
              // linha. O simulador PGlite nunca revelaria isto (conexão única,
              // nunca reciclada).
              const escopo = await conexao.consultar<{ tenant: string | null }>(
                "select current_setting('app.tenant_id', true) as tenant",
              );
              expect(escopo.rows[0]?.tenant ?? "").toBe("");
              const visivel = await conexao.consultar<{ n: number }>(
                "select count(*)::int as n from organizations",
              );
              expect(visivel.rows[0]?.n).toBe(0);
            } finally {
              await solo.pool.liberar(conexao);
            }
          } finally {
            await solo.encerrar();
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "o executor não pode ser guardado e reusado depois do fim da transação",
        async () => {
          let vazado: ExecutorTenant | undefined;
          await porta.comTenant(TENANT_A, async (tx) => {
            vazado = tx;
          });
          await expect(vazado?.query("select 1")).rejects.toThrow(/transação já encerrada/i);
        },
        TEMPO_LIMITE_MS,
      );
    });

    describe("(f) transação abortada não vaza contexto nem escrita", () => {
      it(
        "falha de integridade no meio da transação reverte tudo e devolve conexão limpa",
        async () => {
          const solo = await AdaptadorPostgres.abrir(config({ tamanhoMaximo: 1 }));
          try {
            const pidAntes = await solo.comTenant(TENANT_A, (tx) =>
              tx.query<{ pid: number }>("select pg_backend_pid() as pid"),
            );

            const erroDaTransacao = await capturarRejeicao(
              solo.comTenant(TENANT_A, async (tx) => {
                await tx.query(
                  `insert into audit_events
                     (id, tenant_id, actor_id, command, aggregate_type, aggregate_id, occurred_at, idempotency_key)
                   values ($1, $2, 'SYNTH-ATOR', 'cmd', 'tenant', 'x', '{}'::jsonb, $3)`,
                  ["SYNTH-AUDIT-ABORTADA", TENANT_A, "SYNTH-CORR-ABORTADA"],
                );
                // Passo seguinte do MESMO fluxo referencia encontro inexistente:
                // violação de chave estrangeira REAL, não um throw sintético.
                await tx.query(
                  `insert into alerts (id, tenant_id, encounter_id, raised_at, evaluated_at, severity, reason)
                   values ($1, $2, $3, '{}'::jsonb, '{}'::jsonb, 'critico', 'orfao')`,
                  ["SYNTH-ALERTA-ORFAO", TENANT_A, "SYNTH-ENC-INEXISTENTE"],
                );
              }),
              "a transação com violação de integridade foi CONFIRMADA",
            );
            // Tipada: sem o SQLSTATE, um erro de coluna inexistente, de tipo ou
            // de sintaxe no primeiro `insert` abortaria a transação do mesmo
            // jeito e o teste seguiria verde SEM nunca ter exercido a
            // integridade referencial que ele diz medir.
            expect(erroDaTransacao).toBeInstanceOf(ErroPostgres);
            const pgTransacao = erroDaTransacao as ErroPostgres;
            expect(
              pgTransacao.codigo,
              `a transação abortou por SQLSTATE ${pgTransacao.codigo} (${pgTransacao.message}), ` +
                "e não por violação de chave estrangeira",
            ).toBe(SQLSTATE_VIOLACAO_DE_CHAVE_ESTRANGEIRA);

            const conexao = await solo.pool.adquirir();
            try {
              const pidDepois = await conexao.consultar<{ pid: number }>(
                "select pg_backend_pid() as pid",
              );
              expect(
                pidDepois.rows[0]?.pid,
                "a conexão foi descartada — o teste não provou a higiene do reuso",
              ).toBe(pidAntes.rows[0]?.pid);
              // Ver nota sobre o "valor de reset" no caso anterior: o que
              // importa é que nenhum escopo REAL sobrevive à devolução.
              const escopo = await conexao.consultar<{ tenant: string | null }>(
                "select current_setting('app.tenant_id', true) as tenant",
              );
              expect(escopo.rows[0]?.tenant ?? "").toBe("");
              const visivel = await conexao.consultar<{ n: number }>(
                "select count(*)::int as n from organizations",
              );
              expect(visivel.rows[0]?.n).toBe(0);
            } finally {
              await solo.pool.liberar(conexao);
            }

            const persistiu = await solo.comTenant(TENANT_A, (tx) =>
              tx.query<{ n: number }>("select count(*)::int as n from audit_events where id = $1", [
                "SYNTH-AUDIT-ABORTADA",
              ]),
            );
            expect(persistiu.rows[0]?.n, "a escrita anterior ao erro persistiu").toBe(0);
          } finally {
            await solo.encerrar();
          }
        },
        TEMPO_LIMITE_MS,
      );
    });

    // -----------------------------------------------------------------------
    // (g) Migrações em instalação limpa E atualização
    // -----------------------------------------------------------------------

    describe("(g) migrações em instalação limpa e em atualização", () => {
      it(
        "instalação limpa: as cinco migrações aplicadas pelo papel migrador deixam o invariante de pé",
        async () => {
          expect(banco.migracoesAplicadas).toEqual([
            "0001_init.sql",
            "0002_g7_integration.sql",
            "0003_fronteira_papeis.sql",
            "0004_escopo_selado.sql",
            "0005_fecho_de_privilegio.sql",
          ]);
          const papel = await porta.comTenant(TENANT_A, (tx) =>
            tx.query<{
              rolsuper: boolean;
              rolbypassrls: boolean;
              rolcreaterole: boolean;
              rolcreatedb: boolean;
              rolreplication: boolean;
            }>(
              `select rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolreplication
                 from pg_roles where rolname = $1`,
              [PAPEL_APLICACAO],
            ),
          );
          expect(papel.rows[0]).toEqual({
            rolsuper: false,
            rolbypassrls: false,
            rolcreaterole: false,
            rolcreatedb: false,
            rolreplication: false,
          });
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "ACHADO-10 — atualização de banco legado do SUPERUSUÁRIO não aborta em sequência owned (bigserial)",
        async () => {
          // Achado do orquestrador. `ALTER SEQUENCE ... OWNER TO` é recusado
          // incondicionalmente para sequência OWNED (ligada a coluna por
          // `serial`/`bigserial`). O laço de reatribuição da 0003 enumerava
          // relkind 'S' e disparava sobre `outbox_events_id_seq`.
          //
          // POR QUE O TESTE ANTERIOR NÃO PEGOU (investigado antes de corrigir):
          // medido contra PostgreSQL 16.14, `alter sequence ... owner to
          // <dono ATUAL>` é NO-OP e NÃO ergue erro — o PostgreSQL só entra no
          // caminho que valida a ligação quando o dono muda de fato. Logo o
          // erro só aparece se a sequência for visitada ANTES da sua tabela;
          // se a tabela vier primeiro, ela já arrasta a sequência junto e a
          // segunda troca vira no-op. Como o laço não tinha ORDER BY, o
          // resultado dependia da ordem de varredura de `pg_class` — e o
          // cenário anterior criava o banco com dono `intensicare_migrador`,
          // caindo no lado sortudo. Este cenário usa `donoDoBanco:
          // "superusuario"`, que é o estado legado REAL.
          const legado = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_legado"),
            ateMigracao: "0002_g7_integration.sql",
            migrarComo: "superusuario",
            donoDoBanco: "superusuario",
            recriarBanco: true,
          });
          expect(legado.migracoesAplicadas).toEqual(["0001_init.sql", "0002_g7_integration.sql"]);

          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(legado.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            const antes = await administrativa.consultar<{ dono: string }>(
              // Inclui SEQUÊNCIAS ('S'), não só tabelas: era exatamente a
              // sequência `outbox_events_id_seq` (bigserial) que abortava a
              // migração, e uma asserção só sobre tabelas não a enxergava.
              `select distinct pg_get_userbyid(c.relowner)::text as dono
                 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relkind in ('r', 'S')`,
            );
            // Estado LEGADO real: tabelas do superusuário, não do migrador.
            expect(antes.rows.map((r) => r.dono)).toEqual(["postgres"]);

            await aplicarMigracao(legado.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql");
            await aplicarMigracao(legado.urlSuperusuarioNoBanco, "0004_escopo_selado.sql");

            const depois = await administrativa.consultar<{ dono: string }>(
              // Inclui SEQUÊNCIAS ('S'), não só tabelas: era exatamente a
              // sequência `outbox_events_id_seq` (bigserial) que abortava a
              // migração, e uma asserção só sobre tabelas não a enxergava.
              `select distinct pg_get_userbyid(c.relowner)::text as dono
                 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relkind in ('r', 'S')`,
            );
            expect(depois.rows.map((r) => r.dono)).toEqual([PAPEL_MIGRADOR]);

            // Reaplicar é inofensivo (idempotência) — e reaplicar a 0003 DEPOIS
            // da 0004 não pode rebaixar as políticas de volta ao parâmetro de
            // sessão regravável.
            await aplicarMigracao(legado.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql");
            await aplicarMigracao(legado.urlSuperusuarioNoBanco, "0004_escopo_selado.sql");
            // ACHADO-06 (5ª revisão): contar só as políticas NÃO ancoradas e
            // exigir zero passa por vacuidade — banco sem tabela nenhuma, ou
            // tabela sem política nenhuma, produz o mesmo zero. A regressão
            // MÁXIMA gerava o verde correto. Agora conta-se dos dois lados e
            // exige-se que a contagem ancorada bata com o número de relações.
            const politicas = await administrativa.consultar<{
              ancoradas: number;
              frouxas: number;
              relacoes: number;
            }>(
              `select
                 count(*) filter (
                   where pg_get_expr(pol.polqual, pol.polrelid) ilike '%tenant_atual%')::int as ancoradas,
                 count(*) filter (
                   where pg_get_expr(pol.polqual, pol.polrelid) not ilike '%tenant_atual%')::int as frouxas,
                 (select count(*)::int from pg_class c2
                    join pg_namespace n2 on n2.oid = c2.relnamespace
                   where n2.nspname = 'public' and c2.relkind in ('r','p')) as relacoes
               from pg_policy pol
               join pg_class c on c.oid = pol.polrelid
               join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public'`,
            );
            const contagem = politicas.rows[0];
            expect(contagem?.relacoes, "o esquema ficou sem relação nenhuma").toBe(13);
            expect(
              contagem?.ancoradas,
              "há relação em public sem política ancorada na função selada",
            ).toBe(13);
            expect(
              contagem?.frouxas,
              "reaplicar a 0003 rebaixou políticas já ancoradas na função selada",
            ).toBe(0);
          } finally {
            await administrativa.fechar();
          }

          // E, depois da atualização, o isolamento vale de verdade neste banco.
          const portaLegado = await AdaptadorPostgres.abrir({ url: legado.urlAplicacao });
          try {
            const a = await semearTenant(portaLegado, "SYNTH-TENANT-LEGADO-A");
            await semearTenant(portaLegado, "SYNTH-TENANT-LEGADO-B");
            const vistoPorB = await portaLegado.comTenant("SYNTH-TENANT-LEGADO-B", (tx) =>
              tx.query<{ n: number }>(
                "select count(*)::int as n from organizations where id = $1",
                [a.organizationId],
              ),
            );
            expect(vistoPorB.rows[0]?.n).toBe(0);
          } finally {
            await portaLegado.encerrar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "a 0003 RECUSA concluir se alguma tabela do esquema ficar sem isolamento (fail-closed)",
        async () => {
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_falha"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            // Alguém acrescenta uma tabela clínica sem RLS — o modo de falha
            // de THR-0002 ("basta um SELECT sem predicado de tenant").
            await administrativa.executar(
              "create table public.synth_sem_isolamento (id text primary key, tenant_id text not null)",
            );
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql"),
            ).rejects.toThrow(/sem isolamento completo/i);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-05 — matview, view sem security_invoker e foreign table em public são RECUSADAS (não podem carregar RLS)",
        async () => {
          // Segunda revisão adversarial: as guardas filtravam
          // `relkind in ('r','p')` e a auditoria só `'r'`. Uma MATERIALIZED VIEW
          // sobre tabela de tenant não suporta política de RLS, é invisível à
          // auditoria, e seu dono era invisível ao contador de papéis — e as
          // duas migrações concluíam exit 0 sobre esse banco.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_relkind"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            // (a) MATERIALIZED VIEW — nunca pode receber política.
            await administrativa.executar(
              "create materialized view public.synth_mv_beds as select * from public.beds",
            );
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql"),
              "matview em public atravessou a auditoria de isolamento",
            ).rejects.toThrow(/materializ|não pode(m)? receber política/i);
            await administrativa.executar("drop materialized view public.synth_mv_beds");

            // (b) FOREIGN TABLE — idem.
            await administrativa.executar("create extension if not exists postgres_fdw");
            await administrativa.executar(
              "create server synth_srv foreign data wrapper postgres_fdw options (host '127.0.0.1', dbname 'postgres')",
            );
            await administrativa.executar(
              "create foreign table public.synth_ft_beds (id text, tenant_id text) server synth_srv options (table_name 'beds')",
            );
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql"),
              "foreign table em public atravessou a auditoria de isolamento",
            ).rejects.toThrow(/estrangeira|foreign|não pode(m)? receber política/i);
            await administrativa.executar("drop foreign table public.synth_ft_beds");
            await administrativa.executar("drop server synth_srv cascade");

            // (c) VIEW sem `security_invoker` roda com os direitos do DONO e
            //     contorna a RLS de quem consulta.
            await administrativa.executar(
              "create view public.synth_v_beds as select * from public.beds",
            );
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql"),
              "view sem security_invoker atravessou a auditoria",
            ).rejects.toThrow(/security_invoker/i);

            // Com `security_invoker`, a RLS do chamador volta a valer e a
            // migração conclui.
            await administrativa.executar(
              "alter view public.synth_v_beds set (security_invoker = true)",
            );
            await aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql");
            await administrativa.executar("drop view public.synth_v_beds");
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-05 — um papel que possui APENAS uma matview também conta como dono alcançável",
        async () => {
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_dono_mv"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.executar("create role synth_dono_mv nosuperuser nologin");
            await administrativa.executar(
              "create materialized view public.synth_mv_dono as select * from public.beds",
            );
            await administrativa.executar(
              "alter materialized view public.synth_mv_dono owner to synth_dono_mv",
            );
            await administrativa.executar(`grant synth_dono_mv to ${PAPEL_APLICACAO}`);

            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() aceitou identidade que alcança o dono de uma matview",
            ).rejects.toThrow(ErroIdentidadeInsegura);
          } finally {
            await administrativa.executar(`revoke synth_dono_mv from ${PAPEL_APLICACAO}`);
            await administrativa.executar("drop materialized view if exists public.synth_mv_dono");
            await administrativa.executar("drop role if exists synth_dono_mv");
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-16 — `nextval` antes do escopo quebra o contrato de forma INTERMITENTE (medido, não suposto)",
        async () => {
          // Duas alegações circularam sobre isto e AS DUAS estavam erradas:
          // "nextval sempre atribui xid" (minha, na 4ª rodada) e "nextval não
          // atribui xid" (do orquestrador, na 5ª). O comportamento medido
          // contra PostgreSQL 16.14 é condicional: `nextval` atribui id de
          // transação de topo APENAS nas chamadas que precisam gravar a tupla
          // da sequência em WAL — a primeira, e depois de um `setval`; entre
          // elas (SEQ_LOG_VALS = 32 valores) NÃO atribui.
          //
          // A consequência é pior que qualquer das duas versões: um `nextval`
          // antes do `instalar` derruba o contrato "escopo é a primeira
          // escrita" de forma INTERMITENTE — cerca de uma vez a cada 32 —, que
          // é o modo de falha mais caro de diagnosticar. Este teste fixa as
          // duas metades do comportamento.
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(banco.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            const atual = await administrativa.consultar<{ v: string }>(
              "select last_value::text as v from public.outbox_events_id_seq",
            );
            // `setval` força a próxima chamada a gravar (e portanto a atribuir).
            await administrativa.consultar(
              "select setval('public.outbox_events_id_seq', $1, true)",
              [atual.rows[0]?.v ?? "1"],
            );

            const conexao = await porta.pool.adquirir();
            try {
              // (a) chamada que GRAVA: atribui xid, e o escopo passa a ser recusado.
              await conexao.executar("begin");
              await conexao.consultar("select nextval('public.outbox_events_id_seq')");
              const comXid = await conexao.consultar<{ x: string | null }>(
                "select pg_current_xact_id_if_assigned()::text as x",
              );
              expect(
                comXid.rows[0]?.x,
                "a chamada que grava a sequência deveria atribuir id de transação",
              ).not.toBeNull();
              await expect(
                conexao.consultar("select intensicare_escopo.instalar($1)", [TENANT_A]),
                "instalar após nextval que gravou deveria ser recusado",
              ).rejects.toThrow(/já escreveu sem selo de escopo válido/i);
              await conexao.executar("rollback");

              // (b) chamada seguinte, dentro da janela de cache: NÃO atribui, e
              //     o escopo instala normalmente.
              await conexao.executar("begin");
              await conexao.consultar("select nextval('public.outbox_events_id_seq')");
              const semXid = await conexao.consultar<{ x: string | null }>(
                "select pg_current_xact_id_if_assigned()::text as x",
              );
              expect(
                semXid.rows[0]?.x,
                "a chamada dentro da janela de cache não deveria atribuir id",
              ).toBeNull();
              const instalado = await conexao.consultar<{ v: string }>(
                "select intensicare_escopo.instalar($1) as v",
                [TENANT_A],
              );
              expect(instalado.rows[0]?.v).toBe(TENANT_A);
              await conexao.executar("rollback");
            } finally {
              await porta.pool.liberar(conexao);
            }
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "ACHADO-14 — matview no esquema intensicare_escopo é auditada como qualquer outra (5ª revisão, P1)",
        async () => {
          // O alargamento da 4ª rodada foi aplicado SÓ ao ramo relkind in
          // ('r','p'). Os ramos 'm'/'v'/'f' continuaram presos a
          // nspname='public' — e `intensicare_escopo` está na lista permitida
          // porque o app precisa de USAGE nele para chamar `instalar`. Sobrava
          // um esquema alcançável, permitido e NÃO auditado.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_mvesc"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.executar(
              `create materialized view intensicare_escopo.synth_vazamento
                 as select id, tenant_id, name from public.organizations`,
            );
            await administrativa.executar(
              `grant select on intensicare_escopo.synth_vazamento to ${PAPEL_APLICACAO}`,
            );
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql"),
              "matview em intensicare_escopo atravessou a auditoria",
            ).rejects.toThrow(/synth_vazamento|não podem receber política/i);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-15 — VIEW auto-atualizável sobre o selo não devolve o poder de forjar escopo (5ª revisão, P1)",
        async () => {
          // §6.2 avaliava has_table_privilege/has_column_privilege sobre a
          // RELAÇÃO `selo`. Uma view simples sobre ela é AUTO-ATUALIZÁVEL e
          // roda com os direitos do DONO (o migrador, dono do selo): o
          // privilégio fica sobre a VIEW, invisível às duas funções. Com ela,
          // o app reescrevia `tenant_id` do próprio selo e PIVOTAVA de tenant
          // dentro de uma transação — reabrindo o ACHADO-02.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_viewselo"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            // Guarda de não-vacuidade: sem a view, o pool TEM de abrir.
            const antes = await AdaptadorPostgres.abrir({ url: alvo.urlAplicacao });
            await antes.encerrar();

            await administrativa.executar(
              "create view intensicare_escopo.synth_selos as select * from intensicare_escopo.selo",
            );
            await administrativa.executar(
              `grant select, insert, update, delete on intensicare_escopo.synth_selos to ${PAPEL_APLICACAO}`,
            );

            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "o pool aceitou identidade que alcança o selo por view auto-atualizável",
            ).rejects.toThrow(ErroIdentidadeInsegura);

            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0004_escopo_selado.sql"),
              "a 0004 aceitou um caminho de privilégio que alcança o selo",
            ).rejects.toThrow(/selo|âncora/i);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-11 — partição em OUTRO esquema não escapa da auditoria (4ª revisão, P2)",
        async () => {
          // A auditoria e as guardas partiam de `nspname = 'public'`. Uma
          // partição de uma tabela particionada de `public` criada em OUTRO
          // esquema nasce sem RLS, sem FORCE e sem política — e nenhuma das
          // três camadas a via. O invariante correto não é sobre um ESQUEMA:
          // é sobre as relações ALCANÇÁVEIS pelo papel de aplicação.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_fora"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.executar("create schema synth_fora");
            await administrativa.executar(
              `create table public.synth_medicoes (tenant_id text not null, id text not null, dado text)
                 partition by list (tenant_id)`,
            );
            await administrativa.executar(
              "alter table public.synth_medicoes enable row level security",
            );
            await administrativa.executar(
              "alter table public.synth_medicoes force row level security",
            );
            await administrativa.executar(
              `create policy synth_medicoes_tenant_isolation on public.synth_medicoes
                 using (tenant_id = intensicare_escopo.tenant_atual())
                 with check (tenant_id = intensicare_escopo.tenant_atual())`,
            );
            // A partição vai para FORA de public — é o ponto do achado.
            await administrativa.executar(
              `create table synth_fora.synth_medicoes_b partition of public.synth_medicoes
                 for values in ('SYNTH-TENANT-PG-B')`,
            );
            await administrativa.executar(`grant usage on schema synth_fora to ${PAPEL_APLICACAO}`);
            await administrativa.executar(
              `grant select, insert on synth_fora.synth_medicoes_b to ${PAPEL_APLICACAO}`,
            );

            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql"),
              "partição fora de public atravessou a auditoria de isolamento",
            ).rejects.toThrow(/sem isolamento completo|synth_medicoes_b/i);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-11 — o pool RECUSA identidade com USAGE em esquema fora da lista permitida",
        async () => {
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_esquema"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            // Guarda contra falso-verde: sem USAGE o pool tem de ABRIR.
            const antes = await AdaptadorPostgres.abrir({ url: alvo.urlAplicacao });
            await antes.encerrar();

            await administrativa.executar("create schema synth_extra");
            await administrativa.executar(
              `grant usage on schema synth_extra to ${PAPEL_APLICACAO}`,
            );
            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "o pool aceitou identidade com alcance a esquema não previsto",
            ).rejects.toThrow(ErroIdentidadeInsegura);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-13 — a aplicação tem USAGE mas NÃO SELECT nas sequências (oráculo de volume cross-tenant)",
        async () => {
          // `select` em sequência expõe `last_value`, um contador GLOBAL sobre
          // todos os tenants — oráculo de volume. Só `usage` é necessário para
          // `nextval` nos `bigserial`.
          const privilegios = await porta.comTenant(TENANT_A, (tx) =>
            tx.query<{ nome: string; le: boolean; usa: boolean }>(
              // `offset 0` é cerca de otimização: sem ela o planejador pode
              // avaliar has_sequence_privilege antes do filtro relkind='S' e
              // estourar sobre uma tabela toast.
              `select seq.relname as nome,
                      has_sequence_privilege($1, seq.oid, 'SELECT') as le,
                      has_sequence_privilege($1, seq.oid, 'USAGE') as usa
                 from (
                   select c.oid, c.relname
                     from pg_class c join pg_namespace n on n.oid = c.relnamespace
                    where n.nspname = 'public' and c.relkind = 'S'
                    offset 0
                 ) seq
                order by seq.relname`,
              [PAPEL_APLICACAO],
            ),
          );
          expect(
            privilegios.rows.length,
            "nenhuma sequência encontrada — teste inconclusivo",
          ).toBeGreaterThan(0);
          for (const seq of privilegios.rows) {
            expect(seq.usa, `${seq.nome}: a aplicação precisa de USAGE para nextval`).toBe(true);
            expect(seq.le, `${seq.nome}: SELECT expõe last_value (oráculo de volume)`).toBe(false);
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "ACHADO-07 — tabela PARTICIONADA em public não escapa da auditoria (3ª revisão, P1)",
        async () => {
          // O alargamento da rodada 2 mexeu só nos CONTADORES. As três peças
          // que de fato isolam continuavam em relkind='r': o laço que cria
          // política na 0003, a auditoria de isolamento, e o laço da 0004. E a
          // verificação 6.1 da 0004 só inspecionava linhas JÁ existentes em
          // pg_policy — uma tabela SEM política nenhuma passava por vacuidade.
          // Resultado medido pelo revisor: leitura E escrita cross-tenant com
          // as duas migrações em exit 0.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_part"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            // Partições FORA de public: é assim que o vazamento atravessava as
            // duas migrações em silêncio (com elas em public, os filhos 'r'
            // eram pegos, mas o pai 'p' seguia sem política).
            await administrativa.executar("create schema synth_parte");
            await administrativa.executar(
              `create table public.synth_part (tenant_id text not null, id text not null, dado text)
                 partition by list (tenant_id)`,
            );
            await administrativa.executar(
              "create table synth_parte.synth_part_a partition of public.synth_part for values in ('SYNTH-TENANT-PG-A')",
            );
            await administrativa.executar(
              `grant select, insert, update, delete on public.synth_part to ${PAPEL_APLICACAO}`,
            );

            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql"),
              "tabela particionada sem isolamento atravessou a auditoria da 0003",
            ).rejects.toThrow(/sem isolamento completo/i);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-07 — pai particionado corretamente formado RECEBE política e não vaza entre tenants",
        async () => {
          // Contraparte positiva do teste anterior, e refutação direta do
          // vazamento medido pelo revisor (`SYNTH-A|1 E SYNTH-B|2` com escopo
          // em A, e `UPDATE 1` sobre linha de B). Aqui a tabela particionada é
          // formada corretamente e as migrações precisam POLICIÁ-LA — antes,
          // os laços em relkind='r' a ignoravam e ela ficava aberta.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_part_ok"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.executar(
              `create table public.synth_part (tenant_id text not null, id text not null, dado text)
                 partition by list (tenant_id)`,
            );
            await administrativa.executar(
              "create table public.synth_part_a partition of public.synth_part for values in ('SYNTH-TENANT-PG-A')",
            );
            await administrativa.executar(
              "create table public.synth_part_b partition of public.synth_part for values in ('SYNTH-TENANT-PG-B')",
            );
            for (const t of ["synth_part", "synth_part_a", "synth_part_b"]) {
              await administrativa.executar(`alter table public.${t} enable row level security`);
              await administrativa.executar(`alter table public.${t} force row level security`);
            }
            await administrativa.executar(
              `grant select, insert, update, delete on public.synth_part to ${PAPEL_APLICACAO}`,
            );
            // Semeado pelo SUPERUSUÁRIO, que ignora RLS — os dois tenants ficam
            // presentes de verdade, senão "não vejo nada" seria falso verde.
            await administrativa.consultar(
              "insert into public.synth_part (tenant_id, id, dado) values ($1,$2,$3), ($4,$5,$6)",
              [TENANT_A, "A1", "de A", TENANT_B, "B1", "de B"],
            );

            await aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql");
            await aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0004_escopo_selado.sql");

            const politica = await administrativa.consultar<{ n: number }>(
              `select count(*)::int as n from pg_policy pol
                 join pg_class c on c.oid = pol.polrelid
                where c.relname = 'synth_part'
                  and pg_get_expr(pol.polqual, pol.polrelid) ilike '%tenant_atual%'`,
            );
            expect(politica.rows[0]?.n, "o pai particionado ficou sem política").toBe(1);

            const portaPart = await AdaptadorPostgres.abrir({ url: alvo.urlAplicacao });
            try {
              const vistoPorA = await portaPart.comTenant(TENANT_A, (tx) =>
                tx.query<{ tenant_id: string }>(
                  "select tenant_id from public.synth_part order by tenant_id",
                ),
              );
              expect(
                vistoPorA.rows.map((r) => r.tenant_id),
                "leitura cross-tenant através do pai particionado",
              ).toEqual([TENANT_A]);

              const afetadas = await portaPart.comTenant(TENANT_A, async (tx) => {
                const r = await tx.query(
                  "update public.synth_part set dado = 'ESCRITO-POR-A' where tenant_id = $1",
                  [TENANT_B],
                );
                return r.affectedRows;
              });
              expect(afetadas, "escrita cross-tenant através do pai particionado").toBe(0);
            } finally {
              await portaPart.encerrar();
            }
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-08 — privilégio de COLUNA sobre a âncora é detectado (3ª revisão, P1)",
        async () => {
          // has_table_privilege responde só sobre privilégio de TABELA. Um
          // GRANT UPDATE (tenant_id) não aparece nele, o detector devolvia
          // false, o pool abria — e a aplicação reescrevia a coluna do selo.
          // UPDATE sem WHERE não exige SELECT.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_coluna"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.executar(
              `grant update (tenant_id) on intensicare_escopo.selo to ${PAPEL_APLICACAO}`,
            );
            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() é cego a privilégio de coluna sobre a âncora do escopo",
            ).rejects.toThrow(ErroIdentidadeInsegura);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-09 — DISCARD SEQUENCES não devolve o direito de instalar outro tenant (3ª revisão, P2)",
        async () => {
          // `DISCARD SEQUENCES` é irrestrito, session-local e PERMITIDO dentro
          // de bloco de transação. Ele apagava o estado de que `currval`
          // dependia, e o caminho de exceção tratava "indefinido" como "nunca
          // instalou" — fail-OPEN.
          const conexao = await porta.pool.adquirir();
          try {
            await conexao.executar("begin");
            await conexao.executar("savepoint sp");
            await conexao.consultar("select intensicare_escopo.instalar($1)", [TENANT_A]);
            await conexao.executar("rollback to savepoint sp");
            await conexao.executar("discard sequences");
            await expect(
              conexao.consultar("select intensicare_escopo.instalar($1)", [TENANT_B]),
              "DISCARD SEQUENCES devolveu o direito de instalar outro tenant",
            ).rejects.toThrow(/escopo/i);
            await conexao.executar("rollback");
          } finally {
            await porta.pool.liberar(conexao);
          }
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "ACHADO-06 — pg_write_all_data daria escrita sobre a âncora do escopo: o pool e a 0004 recusam",
        async () => {
          // Achado próprio, a partir da observação que a 2ª revisão deixou em
          // aberto sobre `pg_read_all_data`. O papel predefinido
          // `pg_write_all_data` concede INSERT/UPDATE/DELETE em TODAS as
          // tabelas — inclusive `intensicare_escopo.selo`, que por construção
          // NÃO tem RLS. Com ele, a aplicação FORJARIA o selo e escolheria
          // qualquer tenant. A checagem por `information_schema` não via isso,
          // porque privilégio herdado de papel predefinido não aparece como
          // concessão direta; `has_table_privilege` vê.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_ancora"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.executar(`grant pg_write_all_data to ${PAPEL_APLICACAO}`);
            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() aceitou identidade com escrita sobre a âncora do escopo",
            ).rejects.toThrow(ErroIdentidadeInsegura);
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0004_escopo_selado.sql"),
            ).rejects.toThrow(/âncora|selo/i);
          } finally {
            await administrativa.executar(`revoke pg_write_all_data from ${PAPEL_APLICACAO}`);
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-03 — a 0003 e o pool RECUSAM um papel de aplicação que alcance o papel DONO das tabelas",
        async () => {
          // Refutação de revisão adversarial independente: a checagem de
          // identidade só contava papéis alcançáveis que fossem SUPERUSER ou
          // BYPASSRLS, e só contava tabelas cujo dono fosse o PRÓPRIO
          // session_user. `intensicare_migrador` não é nem super nem
          // bypassrls — logo `GRANT intensicare_migrador TO intensicare_app`
          // passava despercebido pelos DOIS controles fail-closed. E o dono
          // escapa da RLS assim que o `FORCE` for removido por ele mesmo.
          //
          // O invariante correto é: o papel conectado não alcança NENHUM papel
          // que seja dono de tabela do esquema.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_dono"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.executar(`grant ${PAPEL_MIGRADOR} to ${PAPEL_APLICACAO}`);

            // 1) o runtime recusa abrir...
            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() aceitou identidade que alcança o DONO das tabelas",
            ).rejects.toThrow(ErroIdentidadeInsegura);

            // 2) ...e a migração recusa concluir.
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql"),
            ).rejects.toThrow(/dono de tabela|proprietári/i);
          } finally {
            await administrativa.executar(`revoke ${PAPEL_MIGRADOR} from ${PAPEL_APLICACAO}`);
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "a 0003 e o pool RECUSAM um papel de aplicação que alcance superusuário por SET ROLE",
        async () => {
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_escalada"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.executar("create role synth_papel_super superuser nologin");
            await administrativa.executar(`grant synth_papel_super to ${PAPEL_APLICACAO}`);

            // 1) a migração recusa concluir...
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql"),
            ).rejects.toThrow(/alcança \d+ papel\(is\) com superusuário/i);

            // 2) ...e o runtime recusa abrir, mesmo que a migração fosse pulada.
            await expect(AdaptadorPostgres.abrir({ url: alvo.urlAplicacao })).rejects.toThrow(
              ErroIdentidadeInsegura,
            );
          } finally {
            // Papéis são objetos do CLUSTER: desfazer é obrigatório para não
            // contaminar os demais bancos desta mesma execução.
            await administrativa.executar(`revoke synth_papel_super from ${PAPEL_APLICACAO}`);
            await administrativa.executar("drop role if exists synth_papel_super");
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      // ---------------------------------------------------------------------
      // ACHADO-17 (6ª revisão, F1) — função SECURITY DEFINER de TERCEIRO
      // ---------------------------------------------------------------------
      // O handoff da 5ª revisão registrou este limite por escrito e NÃO o
      // atacou: "função SECURITY DEFINER de terceiro que leia o selo não é
      // coberta pelo fecho de `pg_rewrite`; a aplicação não pode criar funções,
      // mas registro o limite". Os testes abaixo atacam as duas metades: a
      // premissa (o app não cria função) e o caminho (função criada por quem
      // pode).

      it(
        "a aplicação NÃO pode plantar função própria: sem CREATE em nenhum esquema alcançável e sem TEMP no banco",
        async () => {
          // Metade PREMISSA do ACHADO-17. Se um dia alguém conceder CREATE (ou
          // TEMPORARY, que abre `pg_temp`), este teste falha ALTO — em vez de o
          // argumento "o app não cria funções" envelhecer em silêncio num
          // comentário.
          const estado = await porta.comTenant(TENANT_A, async (tx) => ({
            esquemas: await tx.query<{ nspname: string }>(
              `select n.nspname::text
                 from pg_namespace n
                where exists (
                        select 1 from pg_roles alvo
                         where pg_has_role(session_user, alvo.oid, 'MEMBER')
                           and has_schema_privilege(alvo.oid, n.oid, 'CREATE'))
                order by 1`,
            ),
            banco: await tx.query<{ temp: boolean; criar: boolean }>(
              `select has_database_privilege(session_user, current_database(), 'TEMP') as temp,
                      has_database_privilege(session_user, current_database(), 'CREATE') as criar`,
            ),
          }));
          expect(
            estado.esquemas.rows.map((r) => r.nspname),
            "a aplicação alcança CREATE em algum esquema — poderia plantar a própria função SECURITY DEFINER (o que a torna dona, e portanto sem ganho de privilégio) ou sequestrar resolução de nome",
          ).toEqual([]);
          expect(
            estado.banco.rows[0],
            "TEMP no banco abre `pg_temp`, que está no search_path das funções seladas; CREATE no banco permite criar esquema novo",
          ).toEqual({ temp: false, criar: false });
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "ACHADO-17 — o conjunto de funções SECURITY DEFINER executáveis pela aplicação é EXATAMENTE o par selado",
        async () => {
          // Prova positiva, bloqueante: hoje o único código que roda com
          // privilégio de terceiro em nome da aplicação são `instalar` e
          // `tenant_atual`. Medido contra PostgreSQL 16.14: num banco recém
          // provisionado, o servidor NÃO traz nenhuma outra função
          // SECURITY DEFINER — nem em `pg_catalog`, nem em
          // `information_schema`. Logo a varredura pode ser sobre TODOS os
          // esquemas, sem lista de exceção, e um `GRANT EXECUTE` futuro (ou
          // uma extensão que instale função SECURITY DEFINER com EXECUTE para
          // PUBLIC) falha aqui.
          const alcancaveis = await porta.comTenant(TENANT_A, (tx) =>
            tx.query<{ esquema: string; funcao: string; dono: string }>(
              `select n.nspname::text as esquema, p.proname::text as funcao,
                      pg_get_userbyid(p.proowner)::text as dono
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where p.prosecdef
                  and pg_get_userbyid(p.proowner) <> session_user
                  and exists (
                        select 1 from pg_roles alvo
                         where pg_has_role(session_user, alvo.oid, 'MEMBER')
                           and has_function_privilege(alvo.oid, p.oid, 'EXECUTE'))
                order by 1, 2`,
            ),
          );
          expect(alcancaveis.rows).toEqual([
            { esquema: "intensicare_escopo", funcao: "instalar", dono: PAPEL_MIGRADOR },
            { esquema: "intensicare_escopo", funcao: "tenant_atual", dono: PAPEL_MIGRADOR },
          ]);
        },
        TEMPO_LIMITE_MS,
      );

      it(
        "ACHADO-17 — função SECURITY DEFINER de terceiro FORJA o selo e pivota de tenant; o pool e a 0005 recusam",
        async () => {
          // Metade CAMINHO do ACHADO-17, medida contra PostgreSQL 16.14.
          // O fecho de `pg_rewrite` da 0004 §6.2 cobre view e matview sobre o
          // selo. NÃO cobre função: o corpo de uma função em SQL/PL-pgSQL não
          // gera dependência em `pg_depend` sobre as tabelas que referencia
          // (só `BEGIN ATOMIC` o faz), e nenhuma análise estática resiste a SQL
          // dinâmico. Por isso a regra tem de ser de SUPERFÍCIE, não de alcance:
          // nenhuma função SECURITY DEFINER de terceiro é executável pelo app
          // fora do par selado.
          //
          // O detalhe que torna isto um pé-de-cabra e não uma hipótese: no
          // PostgreSQL, `CREATE FUNCTION` concede EXECUTE a PUBLIC por PADRÃO.
          // Nenhum GRANT é escrito abaixo — e ainda assim a aplicação chama.
          // Provisionado ATÉ a 0004: é o estado que a 5ª revisão deixou, e é
          // nele que o EXECUTE padrão para PUBLIC ainda está armado. A 0005
          // desarma o padrão (teste seguinte) — aqui o que se mede é o dano
          // enquanto ele existe, e as duas recusas que passam a fechá-lo.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_definer"),
            ateMigracao: "0004_escopo_selado.sql",
            recriarBanco: true,
          });
          const migradora = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlMigrador, "verificacao"),
          );
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            // Semeado pelo SUPERUSUÁRIO (ignora RLS): os dois tenants existem
            // de verdade, senão "não vejo nada" seria falso verde.
            await administrativa.consultar(
              "insert into organizations (id, tenant_id, name) values ($1,$1,$3), ($2,$2,$4)",
              [TENANT_A, TENANT_B, "Org A", "Org B"],
            );
            // Função "de diagnóstico" plausível, criada pelo MIGRADOR.
            await migradora.executar(
              `create function public.synth_marcar_escopo(p text) returns void
                 language sql security definer as $x$
                   update intensicare_escopo.selo set tenant_id = p where pid = pg_backend_pid()
                 $x$`,
            );

            // 1) SEM nenhum GRANT, a aplicação já pode executar.
            const podeExecutar = await administrativa.consultar<{ pode: boolean }>(
              `select has_function_privilege($1, 'public.synth_marcar_escopo(text)', 'EXECUTE') as pode`,
              [PAPEL_APLICACAO],
            );
            expect(
              podeExecutar.rows[0]?.pode,
              "sem EXECUTE para PUBLIC o cenário perde o sentido — o padrão do PostgreSQL é justamente conceder",
            ).toBe(true);

            // 2) E, executando, PIVOTA de tenant dentro da transação em voo —
            //    exatamente o ACHADO-02, reaberto por fora da 0004.
            //    Conexão CRUA: o ponto do teste é que o dano existe mesmo com
            //    o `comTenant` correto, e depois que o pool recusar abrir não
            //    haveria como demonstrá-lo por lá.
            const intrusa = await ConexaoPostgres.conectar(
              opcoesDaUrl(alvo.urlAplicacao, "SYNTH-intrusa"),
            );
            try {
              await intrusa.executar("begin");
              await intrusa.consultar("select intensicare_escopo.instalar($1)", [TENANT_A]);
              const antes = await intrusa.consultar<{ id: string }>(
                "select id from organizations order by id",
              );
              expect(antes.rows.map((r) => r.id)).toEqual([TENANT_A]);

              await intrusa.consultar("select public.synth_marcar_escopo($1)", [TENANT_B]);
              const depois = await intrusa.consultar<{ tenant: string }>(
                "select intensicare_escopo.tenant_atual() as tenant",
              );
              expect(
                depois.rows[0]?.tenant,
                "o selo NÃO foi forjado — se a 0004 já cobrisse função SECURITY DEFINER, este teste perderia o sentido e precisaria ser reescrito, não apagado",
              ).toBe(TENANT_B);
              const cruzado = await intrusa.consultar<{ id: string }>(
                "select id from organizations order by id",
              );
              expect(
                cruzado.rows.map((r) => r.id),
                "leitura cross-tenant por selo forjado via função SECURITY DEFINER de terceiro",
              ).toEqual([TENANT_B]);
              await intrusa.executar("rollback");
            } finally {
              await intrusa.fechar();
            }

            // 3) O pool RECUSA abrir sobre este banco...
            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() é cego a função SECURITY DEFINER de terceiro executável pela aplicação",
            ).rejects.toThrow(ErroIdentidadeInsegura);

            // 4) A 0005 aplicada CONCLUI — e conclui porque REPARA o caso: ela
            //    revoga o EXECUTE de PUBLIC antes de auditar. Medido: sem esta
            //    ordem, a auditoria acusaria uma condição que a própria
            //    migração acabaria de desfazer.
            await aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0005_fecho_de_privilegio.sql");
            const depoisDaMigracao = await administrativa.consultar<{ pode: boolean }>(
              `select has_function_privilege($1, 'public.synth_marcar_escopo(text)', 'EXECUTE') as pode`,
              [PAPEL_APLICACAO],
            );
            expect(
              depoisDaMigracao.rows[0]?.pode,
              "a 0005 não revogou o EXECUTE que o PostgreSQL havia concedido a PUBLIC",
            ).toBe(false);
            // E, reparado o padrão, a aplicação volta a poder abrir.
            const portaReparada = await AdaptadorPostgres.abrir({ url: alvo.urlAplicacao });
            await portaReparada.encerrar();

            // 5) O que a 0005 NÃO pode reparar sozinha é uma concessão NOMINAL
            //    ao papel de aplicação: revogar de PUBLIC não a alcança. Aí a
            //    migração RECUSA concluir, e o pool recusa abrir.
            await administrativa.executar(
              `grant execute on function public.synth_marcar_escopo(text) to ${PAPEL_APLICACAO}`,
            );
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0005_fecho_de_privilegio.sql"),
            ).rejects.toThrow(/security definer/i);
            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() aceitou concessão NOMINAL de EXECUTE sobre função SECURITY DEFINER de terceiro",
            ).rejects.toThrow(ErroIdentidadeInsegura);
          } finally {
            await migradora.fechar();
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-17 — a 0005 revoga o EXECUTE PADRÃO para PUBLIC, presente e futuro",
        async () => {
          // Detectar não basta: o padrão do PostgreSQL (`EXECUTE` para PUBLIC
          // em toda função nova) é o que transforma um `create function`
          // rotineiro numa concessão de privilégio. A 0005 desarma o padrão
          // para o papel de migração; a auditoria fica como rede.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_padrao"),
            recriarBanco: true,
          });
          const migradora = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlMigrador, "verificacao"),
          );
          try {
            await migradora.executar(
              `create function public.synth_funcao_nova() returns integer
                 language sql immutable as $x$ select 1 $x$`,
            );
            const acl = await migradora.consultar<{ pode: boolean }>(
              `select has_function_privilege($1, 'public.synth_funcao_nova()', 'EXECUTE') as pode`,
              [PAPEL_APLICACAO],
            );
            expect(
              acl.rows[0]?.pode,
              "função nova do migrador nasceu executável pela aplicação — o EXECUTE padrão para PUBLIC continua ligado",
            ).toBe(false);
            // CONTRAPARTE INDISPENSÁVEL: revogar o EXECUTE de PUBLIC não pode
            // quebrar o gatilho append-only, que é uma função de `public` sobre
            // a qual a aplicação passa a NÃO ter EXECUTE. Medido contra
            // PostgreSQL 16.14: a execução de função de GATILHO não passa por
            // verificação de EXECUTE do usuário corrente — o privilégio é
            // conferido na CRIAÇÃO do gatilho. Sem esta asserção, a 0005
            // poderia estar desligando o controle de auditoria em silêncio.
            const portaPadrao = await AdaptadorPostgres.abrir({ url: alvo.urlAplicacao });
            try {
              const semeado = await semearTenant(portaPadrao, TENANT_A);
              const acessoAoGatilho = await portaPadrao.comTenant(TENANT_A, (tx) =>
                tx.query<{ pode: boolean }>(
                  `select has_function_privilege(session_user,
                            'public.intensicare_forbid_mutation()', 'EXECUTE') as pode`,
                ),
              );
              expect(
                acessoAoGatilho.rows[0]?.pode,
                "a aplicação ainda tem EXECUTE na função de gatilho — o cenário não exerceu a revogação",
              ).toBe(false);
              const erro = await capturarRejeicao(
                portaPadrao.comTenant(TENANT_A, (tx) =>
                  tx.query("update audit_events set command = 'x' where id = $1", [
                    semeado.auditId,
                  ]),
                ),
                "o gatilho append-only não impediu o UPDATE",
              );
              expect(erro).toBeInstanceOf(ErroPostgres);
              expect((erro as ErroPostgres).message).toMatch(/append-only/i);
            } finally {
              await portaPadrao.encerrar();
            }
          } finally {
            await migradora.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-17 — GATILHO SECURITY DEFINER forja o selo SEM nenhum EXECUTE; o pool e a 0005 recusam",
        async () => {
          // Achado próprio, encontrado ATACANDO a própria correção acima: ela
          // contava `EXECUTE`, e há uma porta que não passa por `EXECUTE`
          // nenhum. Medido contra PostgreSQL 16.14 — e é a MESMA propriedade
          // que o teste anterior usa como garantia (o gatilho append-only
          // continua funcionando sem EXECUTE), agora do lado ofensivo.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_gatilho"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.consultar(
              "insert into organizations (id, tenant_id, name) values ($1,$1,$3), ($2,$2,$4)",
              [TENANT_A, TENANT_B, "Org A", "Org B"],
            );
            await administrativa.executar(
              `create function public.synth_gatilho_forja() returns trigger
                 language plpgsql security definer as $x$
                 begin
                   update intensicare_escopo.selo set tenant_id = '${TENANT_B}'
                    where pid = pg_backend_pid();
                   return new;
                 end $x$`,
            );
            // EXECUTE revogado de TODO MUNDO: é o ponto do teste.
            await administrativa.executar(
              "revoke execute on function public.synth_gatilho_forja() from public",
            );
            await administrativa.executar(
              `create trigger synth_forja before insert on public.audit_events
                 for each row execute function public.synth_gatilho_forja()`,
            );
            const semExecute = await administrativa.consultar<{ pode: boolean }>(
              `select has_function_privilege($1, 'public.synth_gatilho_forja()', 'EXECUTE') as pode`,
              [PAPEL_APLICACAO],
            );
            expect(
              semExecute.rows[0]?.pode,
              "a aplicação tem EXECUTE na função — o cenário não exerceria o caminho SEM EXECUTE",
            ).toBe(false);

            const intrusa = await ConexaoPostgres.conectar(
              opcoesDaUrl(alvo.urlAplicacao, "SYNTH-intrusa"),
            );
            try {
              await intrusa.executar("begin");
              await intrusa.consultar("select intensicare_escopo.instalar($1)", [TENANT_A]);
              await intrusa.consultar(
                `insert into audit_events
                   (id, tenant_id, actor_id, command, aggregate_type, aggregate_id, occurred_at, idempotency_key)
                 values ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  "SYNTH-AE-1",
                  TENANT_A,
                  `${TENANT_A}-CLIN-01`,
                  "leitura-grade-leitos",
                  "tenant",
                  TENANT_A,
                  instante("2026-08-16T10:08:00.000Z"),
                  "SYNTH-CORR-1",
                ],
              );
              const depois = await intrusa.consultar<{ tenant: string }>(
                "select intensicare_escopo.tenant_atual() as tenant",
              );
              expect(
                depois.rows[0]?.tenant,
                "o gatilho não forjou o selo — o cenário perdeu o sentido e precisa ser reescrito, não apagado",
              ).toBe(TENANT_B);
              await intrusa.executar("rollback");
            } finally {
              await intrusa.fechar();
            }

            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() só contou EXECUTE e ficou cego ao gatilho SECURITY DEFINER",
            ).rejects.toThrow(ErroIdentidadeInsegura);
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0005_fecho_de_privilegio.sql"),
            ).rejects.toThrow(/security definer/i);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      // ---------------------------------------------------------------------
      // ACHADO-18 (6ª revisão, F2) — herança anexada DEPOIS das migrações
      // ---------------------------------------------------------------------

      it(
        "ACHADO-18 — filha anexada DEPOIS das migrações, sob pai PROTEGIDO, é filtrada pela política do PAI (medido)",
        async () => {
          // Metade REFUTADA da hipótese F2. Medido contra PostgreSQL 16.14: numa
          // consulta ao PAI, a política do PAI é aplicada às linhas vindas das
          // FILHAS (o plano mostra `Filter: (tenant_id =
          // intensicare_escopo.tenant_atual())` sobre a filha). Anexar uma
          // tabela por herança DEPOIS da migração, portanto, NÃO vaza por si —
          // o que vaza é o sentido inverso, no teste seguinte.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_heranca_ok"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.consultar(
              "insert into organizations (id, tenant_id, name) values ($1,$1,$2)",
              [TENANT_A, "Org A"],
            );
            await administrativa.executar(
              `create table public.synth_filha (
                 id text not null, tenant_id text not null, name text not null,
                 created_at timestamptz not null default now(),
                 constraint organizations_tenant_is_self check (tenant_id = id))`,
            );
            // `organizations` carrega a restrição `tenant_id = id`, então a
            // linha da filha que pertence a A precisa MESMO ter id = TENANT_A
            // (chave primária não é herdada, logo o id repetido é aceito). É
            // por isso que a asserção adiante é sobre `name`, e não sobre `id`.
            await administrativa.consultar(
              "insert into public.synth_filha (id, tenant_id, name) values ($1,$1,$3), ($2,$2,$4)",
              [TENANT_A, TENANT_B, "filha de A", "filha de B"],
            );
            // ANEXADA DEPOIS de todas as migrações — nenhuma auditoria correu
            // depois deste instante.
            await administrativa.executar(
              "alter table public.synth_filha inherit public.organizations",
            );

            const portaHeranca = await AdaptadorPostgres.abrir({ url: alvo.urlAplicacao });
            try {
              const vistoPorA = await portaHeranca.comTenant(TENANT_A, (tx) =>
                tx.query<{ name: string }>("select name from organizations order by name"),
              );
              // A linha 'filha de A' SÓ existe na FILHA: se ela não aparecesse,
              // o teste passaria por vacuidade (herança ignorada) e não
              // provaria que a política do PAI é que está filtrando. E 'filha
              // de B' não pode aparecer: é o isolamento sob teste.
              expect(
                vistoPorA.rows.map((r) => r.name),
                "a filha não foi lida pelo pai (vacuidade) ou vazou a linha de B",
              ).toEqual(["Org A", "filha de A"]);
            } finally {
              await portaHeranca.encerrar();
            }
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-18 — tabela PROTEGIDA anexada a um PAI alcançável sem política vaza leitura e escrita; o pool e a 0005 recusam",
        async () => {
          // O caminho REAL, e ele é o INVERSO do que a hipótese F2 supunha.
          // Medido contra PostgreSQL 16.14: numa consulta ao PAI, valem as
          // políticas do PAI — as da FILHA são IGNORADAS. Logo, tornar
          // `organizations` filha de um pai novo e sem política entrega todas as
          // linhas de todos os tenants, e o plano nem sequer mostra filtro.
          //
          // O pai NÃO PRECISA ter coluna `tenant_id` (basta ter um subconjunto
          // das colunas da filha) — e era exatamente esse o ponto cego: a guarda
          // `relacoes_alcancaveis_sem_isolamento` do pool só olhava relações COM
          // coluna `tenant_id`, então este pai era invisível para ela.
          // Medido: o diagnóstico de `abrir()` devolvia ZERO em todos os
          // contadores num banco onde a aplicação lia e escrevia todos os
          // tenants.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_ancestral"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.consultar(
              "insert into organizations (id, tenant_id, name) values ($1,$1,$3), ($2,$2,$4)",
              [TENANT_A, TENANT_B, "Org A", "Org B"],
            );
            // Pai SEM `tenant_id`, sem RLS. Anexado DEPOIS das migrações.
            await administrativa.executar(
              "create table public.synth_ancestral (id text, name text)",
            );
            await administrativa.executar(
              "alter table public.organizations inherit public.synth_ancestral",
            );
            await administrativa.executar(
              `grant select, update on public.synth_ancestral to ${PAPEL_APLICACAO}`,
            );

            const intrusa = await ConexaoPostgres.conectar(
              opcoesDaUrl(alvo.urlAplicacao, "SYNTH-intrusa"),
            );
            try {
              await intrusa.executar("begin");
              await intrusa.consultar("select intensicare_escopo.instalar($1)", [TENANT_A]);
              const lido = await intrusa.consultar<{ id: string }>(
                "select id from public.synth_ancestral order by id",
              );
              expect(
                lido.rows.map((r) => r.id),
                "leitura cross-tenant pelo ancestral não ocorreu — o cenário perdeu o sentido e precisa ser reescrito, não apagado",
              ).toEqual([TENANT_A, TENANT_B]);

              const escrita = await intrusa.consultar(
                "update public.synth_ancestral set name = $1 where id = $2",
                ["ESCRITO-POR-A", TENANT_B],
              );
              expect(escrita.affectedRows, "escrita cross-tenant pelo ancestral não ocorreu").toBe(
                1,
              );
              await intrusa.executar("rollback");
            } finally {
              await intrusa.fechar();
            }

            // 1) O pool RECUSA abrir...
            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() é cego a ancestral alcançável sem política (o pai nem tem coluna tenant_id)",
            ).rejects.toThrow(ErroIdentidadeInsegura);

            // 2) ...e a migração de fecho RECUSA concluir.
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0005_fecho_de_privilegio.sql"),
            ).rejects.toThrow(/ancestr/i);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-18 — o ancestral alcançável é pego mesmo TRANSITIVAMENTE (avô → pai → tabela protegida)",
        async () => {
          // A exposição é transitiva: consultar o AVÔ expande a cadeia inteira
          // e aplica as políticas do AVÔ. Medido contra PostgreSQL 16.14.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_avo"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.executar("create table public.synth_meio (id text, name text)");
            await administrativa.executar("create table public.synth_avo (id text)");
            await administrativa.executar(
              "alter table public.organizations inherit public.synth_meio",
            );
            await administrativa.executar("alter table public.synth_meio inherit public.synth_avo");
            // Só o AVÔ é concedido: o elo do meio NÃO é alcançável por
            // privilégio nenhum, e ainda assim expõe a tabela protegida — é por
            // isso que a guarda não pode exigir que o elo vazador seja ele
            // próprio alcançável.
            await administrativa.executar(`grant select on public.synth_avo to ${PAPEL_APLICACAO}`);

            // O vazamento existe de fato antes de qualquer guarda opinar.
            const intrusa = await ConexaoPostgres.conectar(
              opcoesDaUrl(alvo.urlAplicacao, "SYNTH-intrusa"),
            );
            try {
              await administrativa.consultar(
                "insert into organizations (id, tenant_id, name) values ($1,$1,$2)",
                [TENANT_B, "Org B"],
              );
              await intrusa.executar("begin");
              await intrusa.consultar("select intensicare_escopo.instalar($1)", [TENANT_A]);
              const lido = await intrusa.consultar<{ id: string }>(
                "select id from public.synth_avo order by id",
              );
              expect(
                lido.rows.map((r) => r.id),
                "a cadeia avô→pai→tabela protegida não vazou — o cenário perdeu o sentido",
              ).toEqual([TENANT_B]);
              await intrusa.executar("rollback");
            } finally {
              await intrusa.fechar();
            }

            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() não viu o ancestral alcançável no topo da cadeia",
            ).rejects.toThrow(ErroIdentidadeInsegura);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );

      it(
        "ACHADO-18 — VIEW sobre ancestral NÃO alcançável também vaza; o pool e a 0005 recusam",
        async () => {
          // Segundo achado próprio desta rodada, encontrado atacando a própria
          // correção: a contagem de ancestrais exige que o ANCESTRAL seja
          // alcançável. Uma view do migrador sobre ele — sem
          // `security_invoker` — roda com os direitos do DONO e devolve todos
          // os tenants, com o ancestral inacessível à aplicação. A `0003` já
          // recusava esse objeto em tempo de MIGRAÇÃO; o runtime é que era cego.
          const alvo = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_visao"),
            recriarBanco: true,
          });
          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(alvo.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            await administrativa.consultar(
              "insert into organizations (id, tenant_id, name) values ($1,$1,$3), ($2,$2,$4)",
              [TENANT_A, TENANT_B, "Org A", "Org B"],
            );
            await administrativa.executar(
              "create table public.synth_ancestral (id text, name text)",
            );
            await administrativa.executar(
              `alter table public.synth_ancestral owner to ${PAPEL_MIGRADOR}`,
            );
            await administrativa.executar(
              "alter table public.organizations inherit public.synth_ancestral",
            );
            await administrativa.executar(
              "create view public.synth_visao as select id, name from public.synth_ancestral",
            );
            await administrativa.executar(
              `alter view public.synth_visao owner to ${PAPEL_MIGRADOR}`,
            );
            await administrativa.executar(
              `grant select on public.synth_visao to ${PAPEL_APLICACAO}`,
            );

            const intrusa = await ConexaoPostgres.conectar(
              opcoesDaUrl(alvo.urlAplicacao, "SYNTH-intrusa"),
            );
            try {
              await intrusa.executar("begin");
              await intrusa.consultar("select intensicare_escopo.instalar($1)", [TENANT_A]);
              const lido = await intrusa.consultar<{ id: string }>(
                "select id from public.synth_visao order by id",
              );
              expect(
                lido.rows.map((r) => r.id),
                "a view sobre o ancestral não vazou — o cenário perdeu o sentido",
              ).toEqual([TENANT_A, TENANT_B]);
              // E o ancestral em si permanece INALCANÇÁVEL: é isso que torna a
              // contagem de ancestrais, sozinha, insuficiente.
              const direto = await capturarRejeicao(
                intrusa.consultar("select id from public.synth_ancestral"),
                "o ancestral era alcançável — o cenário mediria outra coisa",
              );
              expect(direto).toBeInstanceOf(ErroPostgres);
              expect((direto as ErroPostgres).codigo).toBe(SQLSTATE_PRIVILEGIO_INSUFICIENTE);
              await intrusa.executar("rollback");
            } finally {
              await intrusa.fechar();
            }

            await expect(
              AdaptadorPostgres.abrir({ url: alvo.urlAplicacao }),
              "abrir() é cego a view sem security_invoker alcançável pela aplicação",
            ).rejects.toThrow(ErroIdentidadeInsegura);
            await expect(
              aplicarMigracao(alvo.urlSuperusuarioNoBanco, "0005_fecho_de_privilegio.sql"),
            ).rejects.toThrow(/security_invoker/i);
          } finally {
            await administrativa.fechar();
          }
        },
        TEMPO_LIMITE_GANCHO_MS,
      );
    });
  });
}
