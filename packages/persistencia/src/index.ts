/**
 * @intensicare/persistencia
 *
 * Camada de persistência do IntensiCare V2. PREMISSA (reversível,
 * GDEC-0015/0017): classe PostgreSQL, com PGlite (`@electric-sql/pglite`)
 * em desenvolvimento e teste — Postgres real fica para ambientes futuros
 * (ver docs/06-architecture/premissas-de-construcao.md PRE-03).
 *
 * Esta fatia (SPR-G7-2) implementa: migrações SQL puras (tenancy, fato
 * clínico canônico, alerta/item de trabalho, auditoria, outbox — ADR-0003,
 * ADR-0005, ADR-0009, ADR-0010), RLS por tenant forçado em toda tabela
 * clínica, auditoria append-only por trigger, outbox transacional (mesma
 * transação da gravação clínica), e repositórios com transação. Nenhuma
 * alegação de efetividade clínica, conformidade regulatória ou segurança
 * comprovada é feita.
 */
import { PGlite } from "@electric-sql/pglite";

export const packageVersion = "0.0.0" as const;

/**
 * Cria um banco PGlite em memória (sem `dataDir`), adequado para
 * desenvolvimento e testes. Não é o formato de conexão de produção — a
 * classe PostgreSQL real fica para ambientes futuros (PRE-03). O banco
 * criado aqui ainda NÃO está migrado nem rebaixado de papel — ver
 * `bootstrapDatabase` em `./session.js`.
 */
export function createInMemoryDatabase(): PGlite {
  return new PGlite();
}

/**
 * Verificação trivial de saúde do banco: executa `select 1` e confirma a
 * resposta. Existe apenas para provar que a dependência real do banco
 * está corretamente conectada.
 */
export async function checkConnection(db: PGlite): Promise<boolean> {
  const result = await db.query<{ one: number }>("select 1 as one");
  return result.rows[0]?.one === 1;
}

export * from "./repositories/clinical-repository.js";
export * from "./repositories/tenancy-repository.js";
export * from "./session.js";
export * from "./temporal.js";
