/**
 * Porta comum de banco de dados — a interface que o resto do sistema usa sem
 * saber QUAL motor está por trás.
 *
 * Dois adaptadores a implementam:
 *
 *   - `AdaptadorPostgres` (`./pool.ts`): PostgreSQL real, conexão autenticada
 *     JÁ como papel de aplicação sem privilégio, pool com reset garantido.
 *     É a única topologia em que a RLS por tenant é uma fronteira de
 *     segurança verificável.
 *   - `AdaptadorPglite` (`./adaptador-pglite.ts`): o SIMULADOR embarcado
 *     (PGlite/WASM), útil para desenvolvimento e para os testes que não
 *     precisam de fronteira real. Rotulado como simulador em tempo de
 *     execução — nenhuma alegação de isolamento deriva dele (anti-padrão 6 do
 *     contrato de agentes: não generalizar RLS de PGlite para produção).
 *
 * POR QUE O CALLBACK RECEBE UM RECORTE DE `Transaction` DO PGlite
 * --------------------------------------------------------
 * Os repositórios deste pacote (`../repositories/*.ts`) estão escritos contra
 * `ExecutorTenant` e usam `query` (e, pontualmente, `sql`/`rollback`). O
 * recorte estrutural (`Pick`) mantém a troca de adaptador SEM impacto em
 * `apps/api/**` e nos repositórios — e mantém FORA da porta o `exec` de
 * string crua: produto não emite SQL não parametrizado por aqui; o único
 * fluxo bruto legítimo é o bootstrap de sessão superusuário (`session.ts`),
 * fora de transação de tenant. Fecho estrutural do achado CWE-78 na `exec`
 * de `TransacaoPostgres` (varredura de segurança selada de 2026-09-19).
 * É importação apenas de TIPO: o adaptador de PostgreSQL não carrega PGlite
 * em tempo de execução.
 */

import type { Transaction } from "@electric-sql/pglite";

/**
 * Executor SQL com escopo de tenant já instalado. Toda leitura/escrita de dado
 * clínico passa por aqui; fora deste escopo a RLS nega qualquer linha.
 *
 * Recorte DELIBERADO de `Transaction` (PGlite): sem `exec` de string crua.
 * Um `tx.exec("…")` em código de produto é erro de COMPILAÇÃO, não uma
 * convenção — quem precisa de DDL bruto está no caminho errado da porta.
 */
export type ExecutorTenant = Pick<Transaction, "query" | "sql" | "rollback" | "listen" | "closed">;

/**
 * Rótulo do adaptador em uso. Existe para que log, verificação de perfil e
 * teste possam distinguir motor real de simulador em tempo de execução — um
 * simulador nunca deve poder se passar por fronteira verificada
 * (anti-padrão 9: PGlite em perfil não-dev).
 */
export type RotuloAdaptador = "postgres" | "pglite-simulador";

export interface PortaBancoDeDados {
  /** Qual motor está por trás. Discriminante em tempo de execução. */
  readonly rotulo: RotuloAdaptador;

  /**
   * `false` no simulador: diz, no próprio objeto, que o isolamento observado
   * aqui NÃO é evidência transferível para produção.
   */
  readonly fronteiraDeIsolamentoVerificavel: boolean;

  /**
   * Executa `fn` numa transação com `app.tenant_id` instalado localmente.
   * O contexto é revertido no commit/rollback E a conexão é higienizada antes
   * de voltar ao pool. Sem contexto, a RLS nega toda linha (fail-closed).
   */
  comTenant<T>(tenantId: string, fn: (tx: ExecutorTenant) => Promise<T>): Promise<T>;

  /** Fecha conexões. Idempotente. */
  encerrar(): Promise<void>;
}

/** Erro de fronteira: a identidade conectada não é aceitável para a aplicação. */
export class ErroIdentidadeInsegura extends Error {
  readonly motivos: readonly string[];

  constructor(motivos: readonly string[]) {
    super(
      `identidade de banco recusada pela fronteira de isolamento: ${motivos.join("; ")}. ` +
        "A aplicação deve autenticar-se DIRETAMENTE como papel sem privilégio " +
        "(NOSUPERUSER, NOBYPASSRLS, sem propriedade de tabela) — ver migração " +
        "0003_fronteira_papeis.sql e ADR-0016 §4.1.",
    );
    this.name = "ErroIdentidadeInsegura";
    this.motivos = motivos;
  }
}

/** Erro de uso da porta: tenant ausente/vazio nunca vira "consulta sem escopo". */
export class ErroTenantAusente extends Error {
  constructor() {
    super(
      "comTenant exige um identificador de tenant não vazio — " +
        "um escopo vazio jamais deve virar consulta sem predicado de tenant (THR-0002).",
    );
    this.name = "ErroTenantAusente";
  }
}
