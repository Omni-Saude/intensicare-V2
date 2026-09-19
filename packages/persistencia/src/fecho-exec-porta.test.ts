/**
 * Canário do fecho do `exec` de string crua na porta de transação.
 *
 * `ExecutorTenant` é um recorte deliberado de `Transaction` (PGlite) SEM
 * `exec`: produto não emite SQL não parametrizado pela porta de tenant —
 * o único fluxo bruto legítimo é o bootstrap de sessão superusuário
 * (`session.ts`), fora de transação. Este arquivo afirma o fecho nos dois
 * planos: COMPILAÇÃO (o tipo não tem a chave) e RUNTIME (o executor de
 * PostgreSQL real não tem o método — no simulador a inexistência é só de
 * tipo, pois o `tx` cru do PGlite segue com a própria API da biblioteca).
 *
 * Fecho do achado CWE-78 da varredura de segurança selada de 2026-09-19
 * (`exec` de `pool.ts` e o duplo de teste de `apps/api`). Se este teste
 * quebrar, alguém reapresentou o `exec` bruto — reverta, não acomode.
 * A verificação de que `TransacaoPostgres` AINDA serve onde
 * `ExecutorTenant` é pedido vive no canário `CompatibilidadeComRepositorios`
 * de `postgres/pool.ts`.
 */
import { describe, expect, expectTypeOf, it } from "vitest";
import { TransacaoPostgres } from "./postgres/pool.js";
import type { ExecutorTenant } from "./postgres/porta.js";

describe("a porta de transação não expõe exec de string crua", () => {
  it("COMPILAÇÃO: ExecutorTenant não tem a chave exec", () => {
    type TemExec = "exec" extends keyof ExecutorTenant ? true : false;
    expectTypeOf<TemExec>().toEqualTypeOf<false>();
  });

  it("RUNTIME: TransacaoPostgres não tem o método exec", () => {
    expect("exec" in TransacaoPostgres.prototype).toBe(false);
  });
});
