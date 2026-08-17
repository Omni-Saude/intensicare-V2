/**
 * Adaptador da porta sobre o SIMULADOR PGlite.
 *
 * Existe para que o mesmo código de aplicação rode em desenvolvimento sem um
 * servidor externo — e para que o rótulo dessa escolha seja explícito em tempo
 * de execução (`rotulo: "pglite-simulador"`,
 * `fronteiraDeIsolamentoVerificavel: false`).
 *
 * LIMITE (OBSERVED, não hipótese): o PGlite tem UMA conexão, cujo usuário
 * autenticado é superusuário. A aplicação só chega ao papel `intensicare_app`
 * REBAIXANDO-SE (`set session authorization`), e desse estado
 * `SET SESSION AUTHORIZATION` devolve o superusuário — que ignora RLS mesmo
 * com `FORCE ROW LEVEL SECURITY`. Logo, o isolamento observado sob PGlite vale
 * contra o CÓDIGO DE APLICAÇÃO CORRETO, e NÃO contra um adversário capaz de
 * executar SQL arbitrário no processo (THR-0050, P0).
 *
 * Por isso `fronteiraDeIsolamentoVerificavel` é `false` aqui: quem precisar
 * afirmar isolamento deve usar `AdaptadorPostgres` e a suíte
 * `./fronteira-postgres.test.ts`. Generalizar RLS de PGlite para produção é
 * anti-padrão explícito (contrato de agentes §6 item 6).
 */

import type { PGlite } from "@electric-sql/pglite";
import { withTenantTransaction } from "../session.js";
import {
  ErroTenantAusente,
  type ExecutorTenant,
  type PortaBancoDeDados,
  type RotuloAdaptador,
} from "./porta.js";

export class AdaptadorPglite implements PortaBancoDeDados {
  readonly rotulo: RotuloAdaptador = "pglite-simulador";

  /**
   * Sempre `false`. Não é pessimismo: é o registro, no próprio objeto, de que
   * nenhuma evidência de isolamento colhida aqui é transferível para produção.
   */
  readonly fronteiraDeIsolamentoVerificavel = false;

  constructor(private readonly db: PGlite) {}

  comTenant<T>(tenantId: string, fn: (tx: ExecutorTenant) => Promise<T>): Promise<T> {
    if (typeof tenantId !== "string" || tenantId.trim() === "") {
      return Promise.reject(new ErroTenantAusente());
    }
    return withTenantTransaction(this.db, tenantId, fn);
  }

  async encerrar(): Promise<void> {
    await this.db.close();
  }
}
