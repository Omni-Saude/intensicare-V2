/**
 * Bootstrap de sessão: migração + rebaixamento de papel + escopo de tenant
 * por transação.
 *
 * PREMISSA (reversível, GDEC-0015/0017 — OBSERVED por sondagem manual
 * contra PGlite 0.5.5, não documentado no README do pacote): `SET LOCAL
 * SESSION AUTHORIZATION` e `SET LOCAL ROLE`, dentro de uma transação
 * `db.transaction(...)`, NÃO revertem ao encerrar a transação nesta
 * versão do PGlite — divergência do comportamento padrão do PostgreSQL
 * (onde `LOCAL` escopa ao fim da transação). Por isso o rebaixamento de
 * papel de aplicação aqui é deliberadamente de escopo de SESSÃO (sem
 * `LOCAL`) e permanente para o tempo de vida da conexão — nunca por
 * transação: migrações rodam primeiro, com privilégio de superusuário;
 * depois a conexão é rebaixada uma única vez e todo uso subsequente roda
 * sob RLS. O escopo por tenant, que precisa mesmo variar por transação, usa
 * `set_config('app.tenant_id', ..., true)` (equivalente a `SET LOCAL`) via
 * `withTenantTransaction` — esse reset no commit/rollback FOI verificado
 * como correto na mesma sondagem.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PGlite, Transaction } from "@electric-sql/pglite";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(MODULE_DIR, "migrations");

/** Nome do papel de aplicação sem privilégio de superusuário (ver 0001_init.sql). */
export const APPLICATION_ROLE = "intensicare_app" as const;

/** Ordem de aplicação das migrações SQL puras. */
const MIGRATION_FILES = ["0001_init.sql", "0002_g7_integration.sql"] as const;

/**
 * Aplica as migrações SQL puras, nesta ordem, contra um PGlite recém
 * criado. Deve rodar ANTES de `downgradeToApplicationRole` — as migrações
 * exigem privilégio de superusuário (criação de papel, RLS, triggers,
 * grants).
 */
export async function runMigrations(db: PGlite): Promise<void> {
  for (const file of MIGRATION_FILES) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    await db.exec(sql);
  }
}

/**
 * Rebaixa PERMANENTEMENTE a conexão para o papel de aplicação
 * (`intensicare_app`, sem privilégio de superusuário) — depois desta
 * chamada, TODA consulta nesta conexão está sujeita à RLS por tenant
 * (ver nota de topo do módulo sobre por que o rebaixamento não é `LOCAL`).
 */
export async function downgradeToApplicationRole(db: PGlite): Promise<void> {
  await db.exec(`set session authorization ${APPLICATION_ROLE};`);
}

/**
 * Atalho de bootstrap para desenvolvimento/teste: migra e rebaixa a
 * conexão numa só chamada. Depois de chamar isto, `db` só deve ser usado
 * através de `withTenantTransaction`.
 */
export async function bootstrapDatabase(db: PGlite): Promise<void> {
  await runMigrations(db);
  await downgradeToApplicationRole(db);
}

/**
 * Executa `fn` dentro de uma transação com o contexto de tenant ativo
 * (`app.tenant_id`, local à transação — reverte automaticamente no
 * commit/rollback). Toda leitura/escrita em tabela clínica DEVE passar por
 * aqui: fora de uma transação com este contexto, a RLS nega qualquer linha
 * (nenhum tenant corresponde a um `current_setting` vazio).
 */
export async function withTenantTransaction<T>(
  db: PGlite,
  tenantId: string,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query("select set_config('app.tenant_id', $1, true)", [tenantId]);
    return fn(tx);
  });
}
