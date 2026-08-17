/**
 * Fronteira de isolamento de dados sobre PostgreSQL real.
 *
 * Ponto de entrada único do subsistema. Ver:
 *   - `porta.ts`          — a interface que os consumidores usam
 *   - `pool.ts`           — adaptador de PostgreSQL real (recusa identidade
 *                           privilegiada, escopo por transação, higiene de pool)
 *   - `adaptador-pglite.ts` — adaptador do SIMULADOR, rotulado como tal
 *   - `provisionamento.ts`  — papéis separados, banco com dono correto, migrações
 *   - `protocolo.ts`        — cliente mínimo do protocolo v3, sem dependências
 */

export { AdaptadorPglite } from "./adaptador-pglite.js";
export {
  AdaptadorPostgres,
  type ConfiguracaoPostgres,
  motivosDeRecusaDeIdentidade,
  PoolPostgres,
  TransacaoPostgres,
} from "./pool.js";
export {
  ErroIdentidadeInsegura,
  ErroTenantAusente,
  type ExecutorTenant,
  type PortaBancoDeDados,
  type RotuloAdaptador,
} from "./porta.js";
export {
  ConexaoPostgres,
  ErroConexaoPostgres,
  ErroPostgres,
  type OpcoesConexao,
  opcoesDaUrl,
  type ResultadoSql,
  urlCom,
} from "./protocolo.js";
export {
  aplicarMigracao,
  aplicarMigracoes,
  type BancoProvisionado,
  nomeDeBancoDeVerificacao,
  type OpcoesProvisionamento,
  PAPEL_APLICACAO,
  PAPEL_MIGRADOR,
  provisionarBanco,
} from "./provisionamento.js";
