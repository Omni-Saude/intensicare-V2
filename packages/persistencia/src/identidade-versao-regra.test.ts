/**
 * packages/persistencia/src/identidade-versao-regra.test.ts — MAJ-5 (ORQ-5):
 * a identidade do algoritmo que de facto correu tem que ser durável e
 * consultável em nível SQL, não apenas dentro do blob `kernel_record`.
 *
 * ADR-0025 (§2.1 E3) registra a fraqueza: "a versão persistida não identifica
 * o algoritmo que de fato rodou". Hoje `ruleId`/`ruleVersion` (ex.
 * `RULE-NEWS2@0.2.0`, `kernel-clinico/src/types.ts:204-206`) só existe DENTRO
 * do JSON `kernel_record` (0002_g7_integration.sql:24-37) — nenhuma fatia SQL
 * de retenção, vigilância de deriva ou recomputação consegue selecionar por
 * identidade de regra. O remédio é a migração `0007` (direção da própria
 * ADR-0025 §5.2 item 4: a identidade é de ID DE REGRA; variante é NOVO ID):
 *
 *   (a) uma avaliação persistida expõe `rule_id`/`rule_versao` (e `rule_ref`
 *       gerada `ruleId@ruleVersion`) como COLUNAS, escritas na MESMA inserção
 *       que persiste `kernel_record`;
 *   (b) identidade AUSENTE (colunas sem valor) e FORJADA (colunas que
 *       contradizem o `kernel_record` que declara identidade) falham fechadas;
 *   (c) o backfill popula as colunas a partir do PRÓPRIO JSON legado, sem
 *       reescrevê-lo (disciplina append-only), com marcador honesto
 *       'desconhecida' onde o JSON não declara identidade — e é idempotente.
 *
 * Dados 100% sintéticos (marcador `SYNTH-`, política GDEC-0014).
 */

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { insertEvaluationRecord } from "./repositories/clinical-repository.js";
import { bootstrapDatabase, lerMigracoes, withTenantTransaction } from "./session.js";
import { seedMinimalTenant, syntheticInstant } from "./test-support.js";

const TEMPO_LIMITE_MS = 60_000;

describe("MAJ-5 — identidade de regra durável nas colunas de evaluation_records", () => {
  const TENANT = "SYNTH-TENANT-IDR";
  let db: PGlite;
  let encounterId: string;

  beforeAll(async () => {
    db = new PGlite();
    await bootstrapDatabase(db);
    const base = await seedMinimalTenant(db, TENANT);
    encounterId = base.encounterId;
  }, TEMPO_LIMITE_MS);

  afterAll(async () => {
    await db.close();
  });

  it(
    "(a) avaliação persistida expõe rule_id/rule_versao/rule_ref como colunas, não só no JSON",
    async () => {
      const kernelRecord = { status: "valid", ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" };
      await withTenantTransaction(db, TENANT, async (tx) => {
        await insertEvaluationRecord(tx, {
          id: "SYNTH-AVAL-IDR-01",
          tenantId: TENANT,
          encounterId,
          subjectRef: `amh:psr:v1:SYNTH-${TENANT}-P01`,
          status: "valido",
          totalScore: 3,
          riskTier: "atencao",
          redParameter: false,
          fires: false,
          evaluatedAt: syntheticInstant("2026-08-16T10:06:00.000Z"),
          result: { status: "valido", versaoRegra: "RULE-NEWS2@0.2.0" },
          kernelRecord,
          ruleId: "RULE-NEWS2",
          ruleVersion: "0.2.0",
        });
        const linha = await tx.query<{
          rule_id: string;
          rule_versao: string;
          rule_ref: string;
          kernel_record: Record<string, unknown>;
        }>(
          `select rule_id, rule_versao, rule_ref, kernel_record
             from evaluation_records where id = 'SYNTH-AVAL-IDR-01'`,
        );
        // As colunas existem e carregam a identidade — não é preciso parsear JSON.
        expect(linha.rows[0]?.rule_id).toBe("RULE-NEWS2");
        expect(linha.rows[0]?.rule_versao).toBe("0.2.0");
        expect(linha.rows[0]?.rule_ref).toBe("RULE-NEWS2@0.2.0");
        // O JSON segue integral (nada foi movido para fora dele).
        expect(linha.rows[0]?.kernel_record).toEqual(kernelRecord);
      });
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "(b1) identidade AUSENTE falha fechada: inserção sem rule_id é recusada pelo banco",
    async () => {
      await expect(
        withTenantTransaction(db, TENANT, (tx) =>
          tx.query(
            `insert into evaluation_records
               (id, tenant_id, encounter_id, subject_ref, status, evaluated_at, result, kernel_record)
             values ('SYNTH-AVAL-IDR-SEM-ID', $1, $2, 'amh:psr:v1:SYNTH-X', 'valido',
                     '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)`,
            [TENANT, encounterId],
          ),
        ),
      ).rejects.toThrow(/null value in column "rule_id"/);
    },
    TEMPO_LIMITE_MS,
  );

  it(
    "(b2) identidade FORJADA falha fechada: colunas que contradizem o kernel_record são recusadas",
    async () => {
      await expect(
        withTenantTransaction(db, TENANT, (tx) =>
          tx.query(
            `insert into evaluation_records
               (id, tenant_id, encounter_id, subject_ref, status, total_score, risk_tier,
                red_parameter, fires, evaluated_at, result, kernel_record, rule_id, rule_versao)
             values ('SYNTH-AVAL-IDR-FORJADA', $1, $2, 'amh:psr:v1:SYNTH-X', 'valido', 0, 'normal',
                     false, false, '{}'::jsonb, '{}'::jsonb, $3, 'RULE-MEWS', '9.9.9')`,
            [TENANT, encounterId, { status: "valid", ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" }],
          ),
        ),
      ).rejects.toThrow(/identidade_regra_coerente/);
    },
    TEMPO_LIMITE_MS,
  );
});

describe("MAJ-5 — backfill da identidade a partir do kernel_record legado", () => {
  it(
    "(c) popula as colunas a partir do JSON existente sem reescrevê-lo, é idempotente e deixa a falha fechada de pé",
    async () => {
      // Banco no estado 0001..0006: linhas legadas cuja identidade só existe
      // dentro do JSON. A migração 0007 ainda NÃO foi aplicada — ela é lida do
      // registro (`ARQUIVOS_DE_MIGRACAO`) e aplicada à mão aqui, para que o
      // backfill seja exercitado contra linhas pré-existentes de verdade.
      const db = new PGlite();
      try {
        for (const migracao of lerMigracoes("0006_ancora_isolada.sql")) {
          await db.exec(migracao.sql);
        }
        const base = await seedMinimalTenant(db, "SYNTH-TENANT-IDRB");
        const legadas: readonly (readonly [string, Record<string, unknown>])[] = [
          ["SYNTH-AVAL-IDRB-1", { status: "valid", ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" }],
          ["SYNTH-AVAL-IDRB-2", {}],
          ["SYNTH-AVAL-IDRB-3", { status: "valid", ruleId: "RULE-NEWS2" }],
        ];
        for (const [id, kernelRecord] of legadas) {
          await db.query(
            `insert into evaluation_records
               (id, tenant_id, encounter_id, subject_ref, status, evaluated_at, result, kernel_record)
             values ($1, $2, $3, 'amh:psr:v1:SYNTH-X', 'valido', '{}'::jsonb, '{}'::jsonb, $4)`,
            [id, base.tenantId, base.encounterId, kernelRecord],
          );
        }
        const jsonAntes = await db.query<{
          id: string;
          kernel_record: Record<string, unknown>;
        }>("select id, kernel_record from evaluation_records order by id");

        const migracao0007 = lerMigracoes("0007_identidade_versao_regra.sql").find(
          (m) => m.nome === "0007_identidade_versao_regra.sql",
        );
        expect(migracao0007, "a migração 0007 precisa existir no registro").toBeDefined();
        await db.exec(migracao0007!.sql);

        const depois = await db.query<{
          id: string;
          rule_id: string;
          rule_versao: string;
          rule_ref: string;
          kernel_record: Record<string, unknown>;
        }>(
          "select id, rule_id, rule_versao, rule_ref, kernel_record from evaluation_records order by id",
        );
        const porId = new Map(depois.rows.map((r) => [r.id, r]));
        // Linha com identidade no JSON → colunas com a MESMA identidade.
        expect(porId.get("SYNTH-AVAL-IDRB-1")).toMatchObject({
          rule_id: "RULE-NEWS2",
          rule_versao: "0.2.0",
          rule_ref: "RULE-NEWS2@0.2.0",
        });
        // Linha sem nenhuma identidade no JSON (recusa legada) → marcador
        // honesto, a identidade NÃO é inventada.
        expect(porId.get("SYNTH-AVAL-IDRB-2")).toMatchObject({
          rule_id: "desconhecida",
          rule_versao: "desconhecida",
          rule_ref: "desconhecida@desconhecida",
        });
        // Linha com identidade parcial (só ruleId) → backfill por chave.
        expect(porId.get("SYNTH-AVAL-IDRB-3")).toMatchObject({
          rule_id: "RULE-NEWS2",
          rule_versao: "desconhecida",
        });
        // Disciplina append-only: o JSON de CADA linha permanece byte a byte o
        // mesmo — só colunas novas foram preenchidas.
        for (const antes of jsonAntes.rows) {
          expect(porId.get(antes.id)?.kernel_record).toEqual(antes.kernel_record);
        }

        // Idempotente: reaplicar a 0007 não falha e não muda nada.
        await db.exec(migracao0007!.sql);
        const depoisDeNovo = await db.query<{
          id: string;
          rule_id: string;
          rule_versao: string;
        }>("select id, rule_id, rule_versao from evaluation_records order by id");
        expect(depoisDeNovo.rows).toEqual(
          depois.rows.map(({ id, rule_id, rule_versao }) => ({ id, rule_id, rule_versao })),
        );

        // A falha fechada permanece depois do backfill.
        await expect(
          db.query(
            `insert into evaluation_records
               (id, tenant_id, encounter_id, subject_ref, status, evaluated_at, result, kernel_record)
             values ('SYNTH-AVAL-IDRB-SEM-ID', $1, $2, 'amh:psr:v1:SYNTH-X', 'valido',
                     '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)`,
            [base.tenantId, base.encounterId],
          ),
        ).rejects.toThrow(/null value in column "rule_id"/);
      } finally {
        await db.close();
      }
    },
    TEMPO_LIMITE_MS,
  );
});
