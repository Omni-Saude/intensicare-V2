/**
 * Superfície pública do módulo de configuração de runtime (ACH-03, §6.3).
 *
 * Este é o ÚNICO ponto que o bootstrap precisa importar. A fiação em
 * `apps/api/src/index.ts` e `apps/api/src/db.ts` está descrita no handoff —
 * ambos os arquivos ficam fora do escopo de escrita deste módulo, por desenho:
 * quem define a política de configuração não deveria ser quem a aplica.
 *
 * Uso pretendido no bootstrap:
 *
 *   const config = carregarConfiguracaoDoAmbiente();   // lança se faltar algo
 *   if (config.banner !== null) {
 *     emitirBanner(config.banner, (linha) => process.stderr.write(`${linha}\n`));
 *   }
 *   const app = await buildServer({ config });
 *   await app.listen({ port: config.porta, host: "0.0.0.0" });
 *
 * A ordem importa: a configuração é validada ANTES de qualquer banco ser
 * criado e ANTES de a porta ser aberta.
 */
export type { BannerRuntime, EntradaBanner } from "./banner.js";
export { construirBanner, emitirBanner, formatarBanner, limitacoesDe } from "./banner.js";
export type { AmbienteBruto } from "./carregar.js";
export { carregarConfiguracao, carregarConfiguracaoDoAmbiente } from "./carregar.js";
export type { ProblemaConfiguracao } from "./erros.js";
export { ErroDeConfiguracao } from "./erros.js";
export type {
  ConfiguracaoBanco,
  ConfiguracaoBundleRegra,
  ConfiguracaoIdentidade,
  ConfiguracaoMigracao,
  ConfiguracaoRuntime,
} from "./esquema.js";
export { esquemaConfiguracaoRuntime } from "./esquema.js";
export type {
  PassoMigracao,
  PlanoMigracao,
  PortaMigracao,
  ResultadoMigracao,
  VeredictoCompatibilidade,
} from "./migracao.js";
export {
  executarMigracao,
  PRECONDICAO_BACKUP,
  planoDeMigracao,
  verificarCompatibilidade,
} from "./migracao.js";
export type { CapacidadesPerfil, ClassePerfil, Perfil } from "./perfis.js";
export {
  CAPACIDADES,
  capacidadesDe,
  ehPerfil,
  PERFIS,
  PERFIS_ENDURECIDOS,
  PERFIS_SINTETICOS,
} from "./perfis.js";
export { Segredo } from "./segredo.js";
export type {
  ClasseSensibilidade,
  ContextoRequisito,
  DescritorVariavel,
  ModoBanco,
  ModoIdentidade,
  ModoMigracao,
} from "./variaveis.js";
export {
  contextoCanonico,
  DESCRITORES,
  descritorDe,
  MODOS_BANCO,
  MODOS_IDENTIDADE,
  MODOS_MIGRACAO,
  variaveisExigidas,
} from "./variaveis.js";
