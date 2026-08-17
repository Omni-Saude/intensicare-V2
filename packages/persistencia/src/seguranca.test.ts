/**
 * packages/persistencia/src/seguranca.test.ts — verificação ADVERSARIAL,
 * na camada de armazenamento, dos controles de segurança de alta
 * severidade que a fatia sintética G7 consegue demonstrar hoje.
 *
 * Estes NÃO são testes felizes: cada caso tenta ativamente contornar o
 * controle (ler linha de outro tenant por id conhecido, gravar linha
 * marcada para outro tenant, agir sem contexto de sessão, adulterar
 * auditoria, remover o gatilho que a protege, deixar evento órfão no
 * outbox). Cada teste cita no nome o identificador do controle que
 * verifica.
 *
 * ESCOPO E LIMITE (regra dura): nada aqui fecha THR-*, SAF-*, SEC-* ou
 * HAZ-*, e nada aqui fecha o Gate G6. G6 exige verificador terceiro
 * independente (DEC-G0-02) e aceite humano nominal (MG-G6); a lista
 * honesta do que esta fatia NÃO consegue verificar está em
 * `docs/11-security-privacy-compliance/verificacao-de-controles-fatia-g7.md`.
 *
 * ESTE ARQUIVO RODA SOBRE O SIMULADOR PGlite. Sob PGlite o isolamento por
 * tenant NÃO é fronteira de segurança: a conexão é única e o usuário
 * autenticado é superusuário (ver o bloco A' adiante). A fronteira de
 * produção — aplicação AUTENTICADA já como papel sem privilégio contra
 * PostgreSQL real — é verificada, de forma BLOQUEANTE, em
 * `src/postgres/fronteira-postgres.test.ts`. Generalizar RLS de PGlite para
 * produção é anti-padrão explícito do contrato de agentes (§6 item 6).
 *
 * Controles exercitados aqui: SEC-0001/SAF-0007 (fail-closed sem contexto),
 * SEC-0009/SAF-0008 (isolamento de tenant no armazenamento, com evidência
 * adversarial), SEC-0003 (autorização por instância de recurso — sondagem
 * IDOR), SEC-0032/SAF-0023 (auditoria append-only), SEC-0023/SAF-0015
 * (durabilidade antes da entrega: outbox na MESMA transação),
 * SEC-0027/SAF-0017 (concorrência otimista), SEC-0021/SAF-0013
 * (idempotência não vaza entre tenants). Ameaças de referência: THR-0001,
 * THR-0002, THR-0015, THR-0019 (P0). Perigos: HAZ-0013, HAZ-0023, HAZ-0035.
 *
 * NENHUM `it.fails` neste arquivo. O ACHADO-01 (o papel de aplicação
 * reescala para superusuário na mesma conexão, anulando a RLS) deixou de ser
 * uma falha P0 marcada como "esperada" num gate verde — anti-padrão §6 item 7
 * do contrato — e passou a ser: (a) uma LIMITAÇÃO DO SIMULADOR afirmada
 * positivamente no bloco A' abaixo, e (b) um controle de produção
 * verificado de forma bloqueante em `src/postgres/fronteira-postgres.test.ts`.
 *
 * Dados 100% sintéticos (marcador `SYNTH-`, política GDEC-0014).
 */

import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getIdempotencyRecord,
  getWorkItem,
  insertAlert,
  insertAuditEvent,
  insertClinicalObservationWithOutbox,
  insertEvaluationRecord,
  insertIdempotencyRecord,
  insertOutboxEvent,
  insertWorkItem,
  listAuditEvents,
  listClinicalObservations,
  listOutboxEvents,
  transitionWorkItem,
} from "./repositories/clinical-repository.js";
import { withTenantTransaction } from "./session.js";
import {
  createTestDatabase,
  type SeededTenant,
  seedMinimalTenant,
  syntheticInstant,
} from "./test-support.js";

const TEMPO_LIMITE_MS = 60_000;

/** Toda tabela sob RLS nesta fatia (0001_init.sql + 0002_g7_integration.sql). */
const TABELAS_SOB_RLS = [
  "organizations",
  "care_units",
  "beds",
  "patient_identities",
  "encounters",
  "source_envelopes",
  "clinical_observations",
  "evaluation_records",
  "alerts",
  "work_items",
  "audit_events",
  "outbox_events",
  "idempotency_records",
] as const;

/** Tabelas append-only por gatilho (`intensicare_forbid_mutation`). */
const TABELAS_APPEND_ONLY = [
  "source_envelopes",
  "clinical_observations",
  "evaluation_records",
  "alerts",
  "audit_events",
] as const;

/**
 * `foreign_key_violation`. Erros do PGlite carregam `code`, `table` e
 * `constraint` — verificado neste repositório antes de escrever a asserção.
 */
const SQLSTATE_VIOLACAO_DE_CHAVE_ESTRANGEIRA = "23503";

/**
 * Captura a rejeição e devolve o erro; falha se a promessa CUMPRIR.
 *
 * Existe porque `.rejects.toThrow()` **sem tipo** aceita qualquer rejeição:
 * um erro de coluna inexistente, de tipo ou um `throw` do próprio repositório
 * abortariam a transação do mesmo jeito e o teste seguiria verde sem nunca
 * ter exercido a restrição que o seu nome promete.
 */
async function capturarRejeicao(promessa: Promise<unknown>, contexto: string): Promise<unknown> {
  try {
    await promessa;
  } catch (erro) {
    return erro;
  }
  throw new Error(`NÃO houve rejeição — ${contexto}`);
}

interface TenantSemeado extends SeededTenant {
  readonly observationId: string;
  readonly auditId: string;
  readonly alertId: string;
  readonly workItemId: string;
  readonly evaluationId: string;
  readonly idempotencyKey: string;
}

/**
 * Semeia um tenant com pelo menos UMA linha em cada tabela clínica, para
 * que "não vejo nada" nunca seja um falso verde por tabela vazia.
 */
async function semearTenantCompleto(db: PGlite, tenantId: string): Promise<TenantSemeado> {
  const base = await seedMinimalTenant(db, tenantId);
  const observationId = `${tenantId}-OBS-SEG-01`;
  const auditId = `${tenantId}-AUDIT-SEG-01`;
  const alertId = `${tenantId}-ALERTA-SEG-01`;
  const workItemId = `${tenantId}-WI-SEG-01`;
  const evaluationId = `${tenantId}-AVAL-SEG-01`;
  const idempotencyKey = `${tenantId}-IDEM-SEG-01`;

  await withTenantTransaction(db, tenantId, async (tx) => {
    await insertClinicalObservationWithOutbox(
      tx,
      {
        id: observationId,
        tenantId,
        subjectRef: `amh:psr:v1:SYNTH-${tenantId}-P01`,
        encounterId: base.encounterId,
        concept: "SYNTH-CONCEPT-SPO2",
        value: { sourceValue: 96, sourceUnit: "%" },
        quality: "valid",
        provenance: {
          sourceSystem: "SYNTH-SOURCE-SEG",
          sourceEnvelopeId: "SYNTH-ENV-SEG",
          transformation: "none",
          mappingVersion: "0.0.0",
          collector: "seguranca.test",
        },
        observedAt: syntheticInstant("2026-08-16T10:05:00.000Z"),
        effectiveAt: syntheticInstant("2026-08-16T10:05:00.000Z"),
        issuedAt: syntheticInstant("2026-08-16T10:05:01.000Z"),
        receivedAt: syntheticInstant("2026-08-16T10:05:02.000Z"),
        persistedAt: syntheticInstant("2026-08-16T10:05:03.000Z"),
      },
      `encounter:${base.encounterId}`,
    );
    await tx.query(
      `insert into source_envelopes (id, tenant_id, source_system, received_at, raw_payload)
       values ($1, $2, $3, $4, $5)`,
      [
        `${tenantId}-ENV-SEG-01`,
        tenantId,
        "SYNTH-SOURCE-SEG",
        syntheticInstant("2026-08-16T10:05:00.000Z"),
        { sintetico: true },
      ],
    );
    await insertEvaluationRecord(tx, {
      id: evaluationId,
      tenantId,
      encounterId: base.encounterId,
      subjectRef: `amh:psr:v1:SYNTH-${tenantId}-P01`,
      status: "valido",
      totalScore: 3,
      riskTier: "atencao",
      redParameter: false,
      fires: false,
      evaluatedAt: syntheticInstant("2026-08-16T10:06:00.000Z"),
      result: { status: "valido" },
      kernelRecord: { status: "valid" },
    });
    await insertAlert(tx, {
      id: alertId,
      tenantId,
      encounterId: base.encounterId,
      raisedAt: syntheticInstant("2026-08-16T10:07:00.000Z"),
      evaluatedAt: syntheticInstant("2026-08-16T10:07:00.000Z"),
      severity: "critico",
      reason: "SYNTH-REASON-SEG",
    });
    await insertWorkItem(tx, { id: workItemId, tenantId, alertId });
    await insertAuditEvent(tx, {
      id: auditId,
      tenantId,
      actorId: `${tenantId}-CLIN-01`,
      command: "leitura-grade-leitos",
      aggregateType: "tenant",
      aggregateId: tenantId,
      newState: "sucesso",
      occurredAt: syntheticInstant("2026-08-16T10:08:00.000Z"),
      idempotencyKey: `${tenantId}-CORR-01`,
    });
    await insertIdempotencyRecord(tx, {
      tenantId,
      idempotencyKey,
      requestHash: "SYNTH-HASH-SEG",
      statusCode: 201,
      responseBody: { segredoDoTenant: tenantId },
    });
  });

  return { ...base, observationId, auditId, alertId, workItemId, evaluationId, idempotencyKey };
}

// ---------------------------------------------------------------------------
// A. Isolamento de tenant sob tentativa ATIVA de contorno
//    SEC-0009, SEC-0001, SEC-0003, SAF-0007, SAF-0008 | THR-0001, THR-0002 (P0)
// ---------------------------------------------------------------------------

describe("A. isolamento de tenant no armazenamento sob tentativa ativa de contorno", () => {
  let db: PGlite;
  let tenantA: TenantSemeado;
  let tenantB: TenantSemeado;

  beforeAll(async () => {
    db = await createTestDatabase();
    tenantA = await semearTenantCompleto(db, "SYNTH-TENANT-SEG-A");
    tenantB = await semearTenantCompleto(db, "SYNTH-TENANT-SEG-B");
  }, TEMPO_LIMITE_MS);

  afterAll(async () => {
    await db.close();
  });

  it(
    "SEC-0001/SAF-0007 — sem contexto de sessão, NENHUMA tabela clínica devolve linha (fail-closed, não 'primeiro tenant')",
    async () => {
      // Adversário: consulta direta, fora de `withTenantTransaction`, com
      // linhas comprovadamente existentes em DOIS tenants. A ausência de
      // contexto não pode virar "vê tudo" nem "vê o primeiro".
      for (const tabela of TABELAS_SOB_RLS) {
        const linhas = await db.query<{ n: number }>(`select count(*)::int as n from ${tabela}`);
        expect(linhas.rows[0]?.n, `${tabela} vazou linhas sem contexto de tenant`).toBe(0);
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0001 — sem contexto de sessão, a ESCRITA também é negada (WITH CHECK), não apenas a leitura",
    async () => {
      await expect(
        db.query(`insert into audit_events
          (id, tenant_id, actor_id, command, aggregate_type, aggregate_id, occurred_at, idempotency_key)
        values ('SYNTH-SEM-CONTEXTO', 'SYNTH-TENANT-SEG-A', 'SYNTH-INTRUSO', 'forjar', 'tenant', 'x', '{}'::jsonb, 'k')`),
      ).rejects.toThrow(/row-level security/i);
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0009/SAF-0008 — dentro do tenant A, gravar linha marcada com o tenant de B é negado em toda tabela clínica testada",
    async () => {
      // Escrita cross-tenant explícita: o adversário conhece o tenant_id da
      // vítima e o escreve na coluna. A política WITH CHECK deve recusar.
      const tentativas: readonly [string, string, unknown[]][] = [
        [
          "audit_events",
          `insert into audit_events
           (id, tenant_id, actor_id, command, aggregate_type, aggregate_id, occurred_at, idempotency_key)
         values ($1, $2, 'SYNTH-INTRUSO', 'forjar', 'tenant', 'x', '{}'::jsonb, 'k')`,
          ["SYNTH-CROSS-AUDIT", tenantB.tenantId],
        ],
        [
          "outbox_events",
          `insert into outbox_events (tenant_id, ordering_scope, event_type, aggregate_type, aggregate_id, payload)
         values ($1, 'forjado', 'alerta-criado', 'work_item', 'x', '{}'::jsonb)`,
          [tenantB.tenantId],
        ],
        [
          "idempotency_records",
          `insert into idempotency_records (tenant_id, idempotency_key, request_hash, status_code, response_body)
         values ($1, 'SYNTH-CROSS-IDEM', 'h', 201, '{}'::jsonb)`,
          [tenantB.tenantId],
        ],
        [
          "alerts",
          `insert into alerts (id, tenant_id, encounter_id, raised_at, evaluated_at, severity, reason)
         values ($1, $2, $3, '{}'::jsonb, '{}'::jsonb, 'critico', 'forjado')`,
          ["SYNTH-CROSS-ALERTA", tenantB.tenantId, tenantB.encounterId],
        ],
        [
          "evaluation_records",
          `insert into evaluation_records
           (id, tenant_id, encounter_id, subject_ref, status, evaluated_at, result, kernel_record)
         values ($1, $2, $3, 'amh:psr:v1:SYNTH-X', 'valido', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)`,
          ["SYNTH-CROSS-AVAL", tenantB.tenantId, tenantB.encounterId],
        ],
        [
          "clinical_observations",
          `insert into clinical_observations
           (id, tenant_id, subject_ref, encounter_id, concept, source_value, source_unit, quality, provenance,
            observed_at, effective_at, issued_at, received_at, persisted_at)
         values ($1, $2, 'amh:psr:v1:SYNTH-X', $3, 'SYNTH-CONCEPT-SPO2', 99, '%', 'valid', '{}'::jsonb,
                 '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)`,
          ["SYNTH-CROSS-OBS", tenantB.tenantId, tenantB.encounterId],
        ],
      ];

      for (const [tabela, sql, params] of tentativas) {
        await expect(
          withTenantTransaction(db, tenantA.tenantId, (tx) => tx.query(sql, params)),
          `${tabela} aceitou escrita cross-tenant`,
        ).rejects.toThrow(/row-level security/i);
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0003/SEC-0009 — sondagem IDOR: id de recurso do tenant A, consultado com o contexto do tenant B, devolve zero linhas (nunca 'existe mas não pode')",
    async () => {
      // O adversário conhece os identificadores exatos da vítima. A resposta
      // deve ser indistinguível de "não existe" — sem oráculo de existência.
      const alvos: readonly [string, string][] = [
        ["clinical_observations", tenantA.observationId],
        ["audit_events", tenantA.auditId],
        ["alerts", tenantA.alertId],
        ["work_items", tenantA.workItemId],
        ["evaluation_records", tenantA.evaluationId],
        ["encounters", tenantA.encounterId],
        ["patient_identities", tenantA.patientId],
        ["beds", tenantA.bedId],
        ["organizations", tenantA.organizationId],
      ];

      await withTenantTransaction(db, tenantB.tenantId, async (tx) => {
        for (const [tabela, id] of alvos) {
          const r = await tx.query<{ n: number }>(
            `select count(*)::int as n from ${tabela} where id = $1`,
            [id],
          );
          expect(r.rows[0]?.n, `${tabela} vazou o recurso ${id} para outro tenant`).toBe(0);
        }
        // A mesma consulta, no tenant dono, encontra a linha — prova de que o
        // zero acima é isolamento, e não um seletor que nunca casa.
        const controle = await tx.query<{ n: number }>(
          `select count(*)::int as n from work_items where id = $1`,
          [tenantB.workItemId],
        );
        expect(controle.rows[0]?.n).toBe(1);
      });
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0009/SAF-0008 — ESCRITA cross-tenant por id conhecido não afeta nenhuma linha da vítima (work_items, única tabela mutável)",
    async () => {
      const antes = await withTenantTransaction(db, tenantA.tenantId, (tx) =>
        getWorkItem(tx, tenantA.workItemId),
      );

      const afetadas = await withTenantTransaction(db, tenantB.tenantId, async (tx) => {
        const r = await tx.query(
          `update work_items set state = 'resolvido', version = version + 1 where id = $1`,
          [tenantA.workItemId],
        );
        return r.affectedRows ?? 0;
      });
      expect(afetadas).toBe(0);

      const depois = await withTenantTransaction(db, tenantA.tenantId, (tx) =>
        getWorkItem(tx, tenantA.workItemId),
      );
      expect(depois?.state).toBe(antes?.state);
      expect(depois?.version).toBe(antes?.version);
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0021/SEC-0009 — registro de idempotência de um tenant não é legível por outro (replay cross-tenant não devolve o corpo da vítima)",
    async () => {
      const comoIntruso = await withTenantTransaction(db, tenantB.tenantId, (tx) =>
        getIdempotencyRecord(tx, tenantA.idempotencyKey),
      );
      expect(comoIntruso).toBeUndefined();

      const comoDono = await withTenantTransaction(db, tenantA.tenantId, (tx) =>
        getIdempotencyRecord(tx, tenantA.idempotencyKey),
      );
      expect(comoDono?.responseBody).toEqual({ segredoDoTenant: tenantA.tenantId });
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0009/SEC-0010/SAF-0008 — fitness de esquema: TODA tabela do esquema tem `tenant_id`, RLS habilitada E forçada, e política de isolamento",
    async () => {
      // Este é o teste que reprova a introdução FUTURA de uma tabela clínica
      // sem isolamento — o modo de falha do THR-0002 ("nenhum adversário é
      // necessário: basta um SELECT sem predicado de tenant").
      const tabelas = await db.query<{
        relname: string;
        relrowsecurity: boolean;
        relforcerowsecurity: boolean;
      }>(`select c.relname, c.relrowsecurity, c.relforcerowsecurity
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r'
         order by c.relname`);
      // A guarda saía do próprio catálogo declarado no arquivo: esvaziar
      // `TABELAS_SOB_RLS` a degradaria para `>= 0` e o laço abaixo perderia o
      // piso. As 13 tabelas são literal.
      expect(TABELAS_SOB_RLS).toHaveLength(13);
      expect(tabelas.rows.length).toBeGreaterThanOrEqual(13);

      const politicas = await db.query<{ tablename: string }>(
        `select tablename from pg_policies where schemaname = 'public'`,
      );
      const comPolitica = new Set(politicas.rows.map((r) => r.tablename));

      const colunasTenant = await db.query<{ table_name: string }>(
        `select table_name from information_schema.columns
        where table_schema = 'public' and column_name = 'tenant_id'`,
      );
      const comTenantId = new Set(colunasTenant.rows.map((r) => r.table_name));

      for (const { relname, relrowsecurity, relforcerowsecurity } of tabelas.rows) {
        expect(comTenantId.has(relname), `tabela ${relname} sem coluna tenant_id`).toBe(true);
        expect(relrowsecurity, `tabela ${relname} sem RLS habilitada`).toBe(true);
        expect(relforcerowsecurity, `tabela ${relname} sem FORCE ROW LEVEL SECURITY`).toBe(true);
        expect(comPolitica.has(relname), `tabela ${relname} sem política de isolamento`).toBe(true);
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0009 — o papel de aplicação não pode desligar a RLS nem remover a política de isolamento",
    async () => {
      for (const sql of [
        "alter table clinical_observations disable row level security",
        "drop policy clinical_observations_tenant_isolation on clinical_observations",
        "alter table clinical_observations no force row level security",
      ]) {
        await expect(
          db.exec(`${sql};`),
          `DDL permitida ao papel de aplicação: ${sql}`,
        ).rejects.toThrow(/must be owner|permission denied/i);
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0009 — o escopo instalado é IMUTÁVEL dentro da transação: reescrever `app.tenant_id` não reescopa (ACHADO-02 corrigido)",
    async () => {
      // ANTES da migração `0004_escopo_selado.sql`, este teste afirmava o
      // OPOSTO: que reescrever `app.tenant_id` no meio da transação trocava o
      // que a RLS mostrava. Revisão adversarial independente demonstrou que
      // isso era leitura E escrita cross-tenant a partir de SQL arbitrário no
      // processo (THR-0050). A asserção foi INVERTIDA — é estritamente mais
      // exigente do que era.
      const visto = await withTenantTransaction(db, tenantA.tenantId, async (tx) => {
        const antes = await tx.query<{ id: string }>(`select id from organizations`);
        await tx.query("select set_config('app.tenant_id', $1, true)", [tenantB.tenantId]);
        const depois = await tx.query<{ id: string }>(`select id from organizations`);
        return { antes: antes.rows.map((r) => r.id), depois: depois.rows.map((r) => r.id) };
      });
      expect(visto.antes).toEqual([tenantA.organizationId]);
      expect(
        visto.depois,
        "reescrever app.tenant_id reescopou a transação — vazamento cross-tenant",
      ).toEqual([tenantA.organizationId]);

      // Chamar o instalador para outro tenant é recusado, não ignorado.
      await expect(
        withTenantTransaction(db, tenantA.tenantId, (tx) =>
          tx.query("select intensicare_escopo.instalar($1)", [tenantB.tenantId]),
        ),
      ).rejects.toThrow(/escopo de tenant já instalado/i);
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0001 — LIMITE que permanece: a RLS não substitui SEC-0001 (quem ABRE a transação escolhe o tenant)",
    async () => {
      // Não é defeito a consertar aqui: é a propriedade estrutural do controle.
      // A RLS impede a consulta SEM predicado de tenant (THR-0002), e agora
      // também impede o pivô DENTRO de uma transação; mas NÃO impede que a
      // aplicação abra a transação seguinte com o tenant ERRADO (THR-0001) —
      // isso depende inteiramente de o tenant vir de identidade verificada.
      // Nesta fatia o token é um stub sem verificação criptográfica
      // (`apps/api/src/auth.ts`), logo SEC-0001 permanece NÃO VERIFICADO como
      // controle de fronteira.
      const comoA = await withTenantTransaction(db, tenantA.tenantId, (tx) =>
        tx.query<{ id: string }>(`select id from organizations`),
      );
      const comoB = await withTenantTransaction(db, tenantB.tenantId, (tx) =>
        tx.query<{ id: string }>(`select id from organizations`),
      );
      expect(comoA.rows.map((r) => r.id)).toEqual([tenantA.organizationId]);
      expect(comoB.rows.map((r) => r.id)).toEqual([tenantB.organizationId]);
    },
    TEMPO_LIMITE_MS,
  );
});

// ---------------------------------------------------------------------------
// A'. ACHADO-01 — reescalada de papel anula a RLS (falha REAL, isolada)
// ---------------------------------------------------------------------------

describe("A'. LIMITAÇÃO DO SIMULADOR PGlite — não é o controle de produção", () => {
  /**
   * ACHADO-01 — RESOLVIDO NA TOPOLOGIA DE PRODUÇÃO, PERSISTENTE NO SIMULADOR.
   *
   * O que se observa aqui é uma propriedade do SIMULADOR, não um defeito em
   * aberto do produto: o PGlite tem UMA conexão, cujo usuário AUTENTICADO é
   * `postgres` (superusuário). A aplicação só chega a `intensicare_app`
   * REBAIXANDO-SE (`set session authorization`), e o PostgreSQL permite
   * `SET SESSION AUTHORIZATION` de volta exatamente nessa condição
   * (`SET ROLE postgres` é negado, o que dá a falsa impressão de que o
   * caminho está fechado; não está). Superusuário ignora RLS mesmo com
   * `FORCE ROW LEVEL SECURITY`.
   *
   * O CONTROLE de produção vive noutra topologia e é verificado, de forma
   * BLOQUEANTE, contra PostgreSQL real e efêmero em
   * `src/postgres/fronteira-postgres.test.ts`: lá a aplicação AUTENTICA-SE
   * já como `intensicare_app` (sem SUPERUSER, sem BYPASSRLS, sem propriedade
   * de tabela, papel dono do esquema é outro — migração
   * `0003_fronteira_papeis.sql`), e todo caminho SQL de escalada é recusado
   * pelo servidor. Ver ADR-0016 §4.1, THR-0050 (P0), SEC-0009, SAF-0008.
   *
   * Por isso NÃO existe mais nenhum `it.fails` neste arquivo: uma falha P0
   * marcada como "esperada" dentro de um gate que termina verde é
   * anti-padrão explícito do contrato (§6 item 7). Os dois testes abaixo
   * AFIRMAM a limitação do simulador — passam de verdade, e falharão se o
   * simulador mudar de comportamento, obrigando a revisitar esta nota.
   */
  it(
    "SEC-0009 — no SIMULADOR (e só nele) o rebaixamento de papel é reversível: `set session authorization` devolve o superusuário",
    async () => {
      const db = await createTestDatabase();
      try {
        const antes = await db.query<{ current_user: string }>("select current_user");
        expect(antes.rows[0]?.current_user).toBe("intensicare_app");

        await db.exec("set session authorization postgres;");
        const depois = await db.query<{ current_user: string }>("select current_user");
        // Afirmação POSITIVA da limitação: se um dia o PGlite recusar isto, este
        // teste falha e a nota acima precisa ser reescrita — em vez de a
        // melhoria passar despercebida sob um `expected fail`.
        expect(
          depois.rows[0]?.current_user,
          "o simulador mudou de comportamento: revisite a nota do ACHADO-01",
        ).toBe("postgres");
      } finally {
        await db.close();
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0009 — consequência da limitação do simulador: reescalado, o processo lê linhas de TODOS os tenants",
    async () => {
      const db = await createTestDatabase();
      try {
        await seedMinimalTenant(db, "SYNTH-TENANT-SEG-C");
        await seedMinimalTenant(db, "SYNTH-TENANT-SEG-D");

        // Sob o papel de aplicação e sem contexto: nada (fail-closed correto).
        const semContexto = await db.query<{ n: number }>(
          `select count(*)::int as n from organizations`,
        );
        expect(semContexto.rows[0]?.n).toBe(0);

        // Reescalado: a RLS não se aplica a superusuário — dois tenants visíveis.
        await db.exec("set session authorization postgres;");
        const reescalado = await db.query<{ n: number }>(
          `select count(*)::int as n from organizations`,
        );
        expect(reescalado.rows[0]?.n).toBe(2);
      } finally {
        await db.close();
      }
    },
    TEMPO_LIMITE_MS,
  );
});

// ---------------------------------------------------------------------------
// B. Auditoria e fatos clínicos append-only
//    SEC-0032, SAF-0023, SAF-0014 | THR-0008, THR-0036 | HAZ-0035
// ---------------------------------------------------------------------------

describe("B. append-only e imutabilidade sob tentativa ativa de adulteração", () => {
  let db: PGlite;
  let tenant: TenantSemeado;

  beforeAll(async () => {
    db = await createTestDatabase();
    tenant = await semearTenantCompleto(db, "SYNTH-TENANT-SEG-E");
  }, TEMPO_LIMITE_MS);

  afterAll(async () => {
    await db.close();
  });

  it(
    "SEC-0032/SAF-0023 — UPDATE é bloqueado em TODA tabela append-only (auditoria, fato clínico, avaliação, alerta, envelope)",
    async () => {
      for (const tabela of TABELAS_APPEND_ONLY) {
        await expect(
          withTenantTransaction(db, tenant.tenantId, (tx) =>
            tx.query(`update ${tabela} set tenant_id = tenant_id`),
          ),
          `${tabela} aceitou UPDATE`,
        ).rejects.toThrow(/append-only/i);
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0032/SAF-0023 — DELETE é bloqueado em TODA tabela append-only",
    async () => {
      for (const tabela of TABELAS_APPEND_ONLY) {
        await expect(
          withTenantTransaction(db, tenant.tenantId, (tx) => tx.query(`delete from ${tabela}`)),
          `${tabela} aceitou DELETE`,
        ).rejects.toThrow(/append-only/i);
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0032 — TRUNCATE não é barrado pelo gatilho (que é FOR EACH ROW), mas sim pela ausência de privilégio",
    async () => {
      // Registro explícito de POR QUE o controle segura: se um papel futuro
      // ganhar TRUNCATE, o gatilho de append-only NÃO o impedirá. É uma
      // dependência de privilégio, não de invariante de dados.
      for (const tabela of TABELAS_APPEND_ONLY) {
        await expect(
          withTenantTransaction(db, tenant.tenantId, (tx) => tx.query(`truncate ${tabela}`)),
          `${tabela} aceitou TRUNCATE`,
        ).rejects.toThrow(/permission denied/i);
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0032 — o papel de aplicação não pode remover nem desabilitar o gatilho que impõe o append-only",
    async () => {
      for (const sql of [
        "drop trigger audit_events_no_update on audit_events",
        "drop trigger audit_events_no_delete on audit_events",
        "alter table audit_events disable trigger all",
        "create or replace function intensicare_forbid_mutation() returns trigger as $$ begin return new; end; $$ language plpgsql",
      ]) {
        await expect(
          db.exec(`${sql};`),
          `DDL permitida ao papel de aplicação: ${sql}`,
        ).rejects.toThrow(/must be owner|permission denied/i);
      }
    },
    TEMPO_LIMITE_MS,
  );

  /**
   * ACHADO-8b (5ª revisão adversarial) — ESTE TESTE FOI RENOMEADO PORQUE O
   * NOME ANTERIOR ALEGAVA UM COMPORTAMENTO QUE O PRODUTO NÃO TEM.
   *
   * Ele se chamava "a auditoria registra a RECUSA, não só o sucesso". Mas quem
   * inseria a linha `newState: "recusada"` era o PRÓPRIO TESTE, e só depois
   * afirmava que ela existia: se a aplicação parasse de registrar recusas, o
   * teste continuaria verde. Não negava nada.
   *
   * Investigado antes de renomear: o produto NÃO registra recusa.
   * `transitionWorkItem` (`repositories/clinical-repository.ts`) devolve
   * `{ outcome: "conflict" }` e RETORNA ANTES de chamar `insertAuditEvent` —
   * e o teste irmão "SEC-0027/SAF-0017" AFIRMA esse comportamento
   * (`auditoriaDepois` tem o mesmo tamanho de `auditoriaAntes`). Ou seja: o
   * nome antigo não era só improvável, era CONTRADITO por outro teste deste
   * mesmo arquivo.
   *
   * Exercitar o caminho que PRODUZ a recusa é, portanto, impossível daqui: o
   * caminho não existe. Fazê-lo existir é mudança de comportamento em
   * `clinical-repository.ts` (fora do meu escopo de escrita) e, mais do que
   * isso, é decisão de POLÍTICA DE AUDITORIA CLÍNICA — que eventos precisam
   * de rastro é matéria de SEC-0032/SAF-0023 e do titular, não de um agente.
   *
   * LACUNA REGISTRADA (não fechada): recusa de comando não deixa rastro
   * consultável. O que este teste prova é apenas o round-trip de
   * `insertAuditEvent` para um evento cujo `newState` é "recusada".
   */
  it(
    "SEC-0032 — round-trip de insertAuditEvent com newState 'recusada' (NÃO prova que o produto registre recusas — ver nota acima)",
    async () => {
      const antes = await withTenantTransaction(db, tenant.tenantId, (tx) => listAuditEvents(tx));
      expect(
        antes.some((a) => a.newState === "recusada"),
        "já havia evento 'recusada' antes da inserção — o teste mediria outra coisa",
      ).toBe(false);

      await withTenantTransaction(db, tenant.tenantId, (tx) =>
        insertAuditEvent(tx, {
          id: `${tenant.tenantId}-AUDIT-RECUSA`,
          tenantId: tenant.tenantId,
          actorId: `${tenant.tenantId}-CLIN-01`,
          command: "acknowledge",
          aggregateType: "work_item",
          aggregateId: tenant.workItemId,
          newState: "recusada",
          occurredAt: syntheticInstant("2026-08-16T10:09:00.000Z"),
          idempotencyKey: `${tenant.tenantId}-CORR-02`,
        }),
      );
      const depois = await withTenantTransaction(db, tenant.tenantId, (tx) => listAuditEvents(tx));
      expect(depois.some((a) => a.newState === "recusada")).toBe(true);
      expect(depois.length, "a inserção não acrescentou exatamente um evento").toBe(
        antes.length + 1,
      );
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0032 — LACUNA: uma recusa REAL do produto (conflito de versão) NÃO deixa rastro na auditoria",
    async () => {
      // Contraparte com dentes do teste acima: exercita o caminho que
      // realmente produz uma recusa e mede que ele não audita nada. Se alguém
      // implementar o registro de recusa, ESTE teste falha e obriga a
      // revisitar a lacuna — em vez de a melhoria passar despercebida.
      const auditoriaAntes = await withTenantTransaction(db, tenant.tenantId, (tx) =>
        listAuditEvents(tx),
      );
      const resultado = await withTenantTransaction(db, tenant.tenantId, (tx) =>
        transitionWorkItem(tx, {
          workItemId: tenant.workItemId,
          tenantId: tenant.tenantId,
          expectedVersion: 999,
          nextState: "reconhecido",
          actorId: `${tenant.tenantId}-CLIN-01`,
          command: "acknowledge",
          idempotencyKey: `${tenant.tenantId}-CORR-LACUNA`,
          occurredAt: syntheticInstant("2026-08-16T10:10:00.000Z"),
          outboxEventType: "alerta-atualizado",
          orderingScope: `work_item:${tenant.workItemId}`,
        }),
      );
      expect(resultado, "a transição deveria ter sido recusada por versão").toEqual({
        outcome: "conflict",
      });
      const auditoriaDepois = await withTenantTransaction(db, tenant.tenantId, (tx) =>
        listAuditEvents(tx),
      );
      // A linha de base precisa ser não-vazia: se a auditoria estivesse vazia
      // nos DOIS lados, "a recusa não deixou rastro" seria satisfeito por
      // ausência de auditoria inteira, e não pela lacuna que este teste mede.
      expect(auditoriaAntes.length, "auditoria vazia — o delta zero não mede nada").toBeGreaterThan(
        0,
      );
      expect(
        auditoriaDepois.length,
        "o produto passou a auditar recusas — a lacuna registrada acima foi fechada, revisite a nota",
      ).toBe(auditoriaAntes.length);
    },
    TEMPO_LIMITE_MS,
  );
});

describe("B'. SEC-0032 — append-only NÃO é evidência de adulteração (limite honesto do controle)", () => {
  it(
    "um adversário com o papel de tabela desliga o gatilho, altera a auditoria e RELIGA — e nada nos dados denuncia",
    async () => {
      /**
       * NÃO É UM DEFEITO A CONSERTAR NESTA FATIA — é a demonstração de que o
       * controle implementado (`append-only por gatilho`) cobre a metade
       * "append-only" de SEC-0032/SAF-0023 e NÃO cobre a metade
       * "tamper-evident" (cadeia de hash, WORM ou equivalente), que
       * permanece NÃO IMPLEMENTADA e portanto NÃO VERIFICADA.
       */
      const db = await createTestDatabase();
      try {
        const tenant = await semearTenantCompleto(db, "SYNTH-TENANT-SEG-F");
        const original = await withTenantTransaction(db, tenant.tenantId, (tx) =>
          listAuditEvents(tx),
        );
        const alvo = original.find((a) => a.id === tenant.auditId);
        expect(alvo?.command).toBe("leitura-grade-leitos");

        // Adversário com privilégio de dono da tabela (ver ACHADO-01: nesta
        // topologia ele está a um `set role` de distância).
        await db.exec("set session authorization postgres;");
        await db.exec(`alter table audit_events disable trigger all;`);
        await db.exec(
          `update audit_events set command = 'comando-forjado' where id = '${tenant.auditId}';`,
        );
        await db.exec(`alter table audit_events enable trigger all;`);

        const adulterado = await db.query<{ command: string }>(
          `select command from audit_events where id = $1`,
          [tenant.auditId],
        );
        expect(adulterado.rows[0]?.command).toBe("comando-forjado");

        // Não existe nenhuma coluna de encadeamento/assinatura no esquema —
        // logo não há como um verificador detectar a alteração pelos dados.
        const colunas = await db.query<{ column_name: string }>(
          `select column_name from information_schema.columns where table_name = 'audit_events'`,
        );
        const nomes = colunas.rows.map((r) => r.column_name);
        expect(nomes).not.toContain("previous_hash");
        expect(nomes).not.toContain("record_hash");
        expect(nomes).not.toContain("signature");
      } finally {
        await db.close();
      }
    },
    TEMPO_LIMITE_MS,
  );
});

// ---------------------------------------------------------------------------
// C. Atomicidade do outbox (durabilidade antes da entrega)
//    SEC-0023, SAF-0015, ADR-0010 B1 | THR-0012, THR-0015 (P0) | HAZ-0015
// ---------------------------------------------------------------------------

describe("C. atomicidade do outbox: nunca fato sem evento, nunca evento órfão", () => {
  it(
    "SEC-0023 — falha por VIOLAÇÃO DE RESTRIÇÃO depois da gravação clínica reverte fato E evento (não é um throw sintético)",
    async () => {
      const db = await createTestDatabase();
      try {
        const tenant = await seedMinimalTenant(db, "SYNTH-TENANT-SEG-G");

        const erro = await capturarRejeicao(
          withTenantTransaction(db, tenant.tenantId, async (tx) => {
            await insertClinicalObservationWithOutbox(
              tx,
              {
                id: "SYNTH-OBS-ATOMICO-FK",
                tenantId: tenant.tenantId,
                subjectRef: `amh:psr:v1:SYNTH-${tenant.tenantId}-P01`,
                encounterId: tenant.encounterId,
                concept: "SYNTH-CONCEPT-SPO2",
                value: { sourceValue: 88, sourceUnit: "%" },
                quality: "valid",
                provenance: {
                  sourceSystem: "SYNTH-SOURCE-SEG",
                  sourceEnvelopeId: "SYNTH-ENV-SEG",
                  transformation: "none",
                  mappingVersion: "0.0.0",
                  collector: "seguranca.test",
                },
                observedAt: syntheticInstant("2026-08-16T11:00:00.000Z"),
                effectiveAt: syntheticInstant("2026-08-16T11:00:00.000Z"),
                issuedAt: syntheticInstant("2026-08-16T11:00:01.000Z"),
                receivedAt: syntheticInstant("2026-08-16T11:00:02.000Z"),
                persistedAt: syntheticInstant("2026-08-16T11:00:03.000Z"),
              },
              `encounter:${tenant.encounterId}`,
            );
            // Passo seguinte do MESMO fluxo (alerta durável) referencia um
            // encontro inexistente: falha de integridade real, no meio da
            // transação, depois de o fato clínico já ter sido gravado.
            await insertAlert(tx, {
              id: "SYNTH-ALERTA-ORFAO",
              tenantId: tenant.tenantId,
              encounterId: `${tenant.tenantId}-ENC-INEXISTENTE`,
              raisedAt: syntheticInstant("2026-08-16T11:00:04.000Z"),
              evaluatedAt: syntheticInstant("2026-08-16T11:00:04.000Z"),
              severity: "critico",
              reason: "SYNTH-REASON-ORFAO",
            });
          }),
          "a transação com violação de integridade foi CONFIRMADA",
        );
        // O NOME deste teste promete "falha por VIOLAÇÃO DE RESTRIÇÃO ... não é
        // um throw sintético". `.rejects.toThrow()` sem tipo não verificava
        // nada disso. O SQLSTATE e a tabela verificam.
        const pg = erro as { readonly code?: unknown; readonly table?: unknown };
        expect(
          pg.code,
          `a transação abortou por SQLSTATE ${String(pg.code)} ` +
            `("${(erro as Error).message}"), e não por violação de chave estrangeira`,
        ).toBe(SQLSTATE_VIOLACAO_DE_CHAVE_ESTRANGEIRA);
        expect(
          pg.table,
          "a violação não ocorreu no `insert` de `alerts` — o passo que referencia " +
            "o encontro inexistente não foi o que abortou a transação",
        ).toBe("alerts");

        const [observacoes, outbox] = await withTenantTransaction(
          db,
          tenant.tenantId,
          async (tx) => [await listClinicalObservations(tx), await listOutboxEvents(tx)],
        );
        expect(observacoes).toHaveLength(0);
        expect(outbox).toHaveLength(0);
      } finally {
        await db.close();
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0023 — evento publicado e transação abortada em seguida NÃO deixa evento órfão (o inverso da mesma invariante)",
    async () => {
      const db = await createTestDatabase();
      try {
        const tenant = await seedMinimalTenant(db, "SYNTH-TENANT-SEG-H");

        await expect(
          withTenantTransaction(db, tenant.tenantId, async (tx) => {
            await insertOutboxEvent(tx, {
              tenantId: tenant.tenantId,
              orderingScope: `encounter:${tenant.encounterId}`,
              eventType: "alerta-criado",
              aggregateType: "work_item",
              aggregateId: "SYNTH-WI-NUNCA-EXISTIU",
              payload: { id: "SYNTH-WI-NUNCA-EXISTIU" },
            });
            throw new Error("falha simulada DEPOIS do evento, antes do commit");
          }),
        ).rejects.toThrow(/falha simulada/);

        const outbox = await withTenantTransaction(db, tenant.tenantId, (tx) =>
          listOutboxEvents(tx),
        );
        expect(outbox).toHaveLength(0);
      } finally {
        await db.close();
      }
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "SEC-0027/SAF-0017 — transição com o tenant ERRADO é conflito explícito, sem efeito, sem auditoria e sem evento",
    async () => {
      const db = await createTestDatabase();
      try {
        const vitima = await semearTenantCompleto(db, "SYNTH-TENANT-SEG-I");
        const intruso = await semearTenantCompleto(db, "SYNTH-TENANT-SEG-J");

        const auditoriaAntes = await withTenantTransaction(db, vitima.tenantId, (tx) =>
          listAuditEvents(tx),
        );
        const outboxAntes = await withTenantTransaction(db, vitima.tenantId, (tx) =>
          listOutboxEvents(tx),
        );

        // O intruso conhece o id do item de trabalho da vítima e a versão
        // correta (0). O predicado de tenant do comparação-e-troca deve barrar.
        const resultado = await withTenantTransaction(db, intruso.tenantId, (tx) =>
          transitionWorkItem(tx, {
            workItemId: vitima.workItemId,
            tenantId: intruso.tenantId,
            expectedVersion: 0,
            nextState: "reconhecido",
            actorId: `${intruso.tenantId}-INTRUSO`,
            command: "acknowledge",
            idempotencyKey: "SYNTH-CORR-INTRUSO",
            occurredAt: syntheticInstant("2026-08-16T11:30:00.000Z"),
            outboxEventType: "alerta-atualizado",
            orderingScope: `work_item:${vitima.workItemId}`,
          }),
        );
        expect(resultado).toEqual({ outcome: "conflict" });

        const item = await withTenantTransaction(db, vitima.tenantId, (tx) =>
          getWorkItem(tx, vitima.workItemId),
        );
        expect(item?.state).toBe("nao_atribuido");
        expect(item?.version).toBe(0);

        const auditoriaDepois = await withTenantTransaction(db, vitima.tenantId, (tx) =>
          listAuditEvents(tx),
        );
        const outboxDepois = await withTenantTransaction(db, vitima.tenantId, (tx) =>
          listOutboxEvents(tx),
        );
        // O esperado vem do próprio par antes/depois: se a semeadura falhasse
        // e as duas leituras fossem VAZIAS, "o intruso não escreveu nada"
        // passaria por ausência de dado — sem provar que o predicado de tenant
        // barrou coisa alguma. A linha de base precisa existir para que o
        // delta zero signifique alguma coisa.
        expect(outboxAntes.length, "semeadura não produziu outbox — teste inconclusivo").toBe(1);
        expect(auditoriaDepois).toHaveLength(auditoriaAntes.length);
        expect(outboxDepois).toHaveLength(outboxAntes.length);
      } finally {
        await db.close();
      }
    },
    TEMPO_LIMITE_MS,
  );
});
