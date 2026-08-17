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
import { ConexaoPostgres, opcoesDaUrl, urlCom } from "./protocolo.js";
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
          for (const sql of caminhos) {
            await expect(
              porta.comTenant(TENANT_A, (tx) => tx.query(sql)),
              `o servidor ACEITOU um caminho de escalada: ${sql}`,
            ).rejects.toThrow();
          }
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
            await expect(
              ConexaoPostgres.conectar(opcoesDaUrl(urlForjada, "SYNTH-intruso")),
              `a senha da aplicação autenticou como '${usuario}'`,
            ).rejects.toThrow();
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
            await expect(nova.executar("set session authorization postgres")).rejects.toThrow();
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
            ).rejects.toThrow(/já instalou um escopo e o selo foi desfeito/i);

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

          for (const sql of [
            "select * from intensicare_escopo.selo",
            "update intensicare_escopo.selo set tenant_id = 'SYNTH-TENANT-PG-B'",
            "delete from intensicare_escopo.selo",
            "insert into intensicare_escopo.selo (pid, inicio_txn, tenant_id) values (1, '1'::xid8, 'SYNTH-X')",
            "alter table intensicare_escopo.selo disable row level security",
            "drop function intensicare_escopo.instalar(text)",
            "create table intensicare_escopo.forjada (id text)",
          ]) {
            await expect(
              porta.comTenant(TENANT_A, (tx) => tx.query(sql)),
              `a aplicação alcançou a âncora do escopo: ${sql}`,
            ).rejects.toThrow();
          }
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

            await expect(
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
            ).rejects.toThrow();

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
        "instalação limpa: as quatro migrações aplicadas pelo papel migrador deixam o invariante de pé",
        async () => {
          expect(banco.migracoesAplicadas).toEqual([
            "0001_init.sql",
            "0002_g7_integration.sql",
            "0003_fronteira_papeis.sql",
            "0004_escopo_selado.sql",
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
        "atualização: banco legado em 0002 (migrado por superusuário) é consertado pela 0003",
        async () => {
          const legado = await provisionarBanco({
            urlSuperusuario,
            banco: nomeDeBancoDeVerificacao("intensicare_legado"),
            ateMigracao: "0002_g7_integration.sql",
            migrarComo: "superusuario",
            recriarBanco: true,
          });
          expect(legado.migracoesAplicadas).toEqual(["0001_init.sql", "0002_g7_integration.sql"]);

          const administrativa = await ConexaoPostgres.conectar(
            opcoesDaUrl(legado.urlSuperusuarioNoBanco, "verificacao"),
          );
          try {
            const antes = await administrativa.consultar<{ dono: string }>(
              `select distinct pg_get_userbyid(c.relowner)::text as dono
                 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relkind = 'r'`,
            );
            // Estado LEGADO real: tabelas do superusuário, não do migrador.
            expect(antes.rows.map((r) => r.dono)).toEqual(["postgres"]);

            await aplicarMigracao(legado.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql");
            await aplicarMigracao(legado.urlSuperusuarioNoBanco, "0004_escopo_selado.sql");

            const depois = await administrativa.consultar<{ dono: string }>(
              `select distinct pg_get_userbyid(c.relowner)::text as dono
                 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relkind = 'r'`,
            );
            expect(depois.rows.map((r) => r.dono)).toEqual([PAPEL_MIGRADOR]);

            // Reaplicar é inofensivo (idempotência) — e reaplicar a 0003 DEPOIS
            // da 0004 não pode rebaixar as políticas de volta ao parâmetro de
            // sessão regravável.
            await aplicarMigracao(legado.urlSuperusuarioNoBanco, "0003_fronteira_papeis.sql");
            await aplicarMigracao(legado.urlSuperusuarioNoBanco, "0004_escopo_selado.sql");
            const politicas = await administrativa.consultar<{ n: number }>(
              `select count(*)::int as n
                 from pg_policy pol join pg_class c on c.oid = pol.polrelid
                 join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public'
                  and pg_get_expr(pol.polqual, pol.polrelid) not ilike '%tenant_atual%'`,
            );
            expect(
              politicas.rows[0]?.n,
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
    });
  });
}
