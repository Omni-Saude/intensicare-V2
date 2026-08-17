/**
 * @intensicare/persistencia
 *
 * Camada de persistência do IntensiCare V2. PREMISSA (reversível,
 * GDEC-0015/0017): classe PostgreSQL. Há DOIS adaptadores atrás da mesma
 * porta (`./postgres/porta.ts`):
 *
 *   - `AdaptadorPostgres` — PostgreSQL real; a aplicação AUTENTICA-SE já como
 *     papel sem privilégio (`intensicare_app`), separado do papel dono do
 *     esquema (`intensicare_migrador`). É a única topologia em que a RLS por
 *     tenant é fronteira de segurança verificável, e é a exercitada contra
 *     servidor real e efêmero em `./postgres/fronteira-postgres.test.ts`.
 *   - `AdaptadorPglite` — o SIMULADOR embarcado (`@electric-sql/pglite`),
 *     para desenvolvimento e para os testes que não dependem da fronteira.
 *     Rotulado em tempo de execução (`fronteiraDeIsolamentoVerificavel:
 *     false`): nenhuma evidência de isolamento colhida nele é transferível
 *     para produção (ACHADO-01, THR-0050 P0).
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

export * from "./postgres/index.js";
export * from "./repositories/clinical-repository.js";
export * from "./repositories/tenancy-repository.js";
export * from "./session.js";
export * from "./temporal.js";
