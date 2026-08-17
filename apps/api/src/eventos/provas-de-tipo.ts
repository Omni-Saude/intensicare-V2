/**
 * apps/api/src/eventos/provas-de-tipo.ts — as provas de que "cross-tenant é
 * impossível POR TIPO" (ADR-0016 §4.1) são verificadas por gate.
 *
 * POR QUE ESTE ARQUIVO NÃO É UM `.test.ts`. `apps/api/tsconfig.json`
 * declara `"exclude": ["src/**\/*.test.ts"]`, e o vitest transpila sem
 * checar tipos: uma asserção `@ts-expect-error` dentro de um arquivo de
 * teste NÃO seria verificada por `pnpm typecheck` nem por `pnpm build` —
 * seria decoração. Aqui ela é verificada pelos dois.
 *
 * COMO A PROVA FUNCIONA. `@ts-expect-error` exige que a linha seguinte
 * tenha erro de tipo. Se alguém enfraquecer a marca nominal — passando a
 * aceitar uma `string` do chamador como tenant —, o erro desaparece e o
 * TypeScript passa a reprovar a DIRETIVA como não utilizada
 * (`Unused '@ts-expect-error' directive`). Ou seja: perder o isolamento
 * por tipo QUEBRA O BUILD. É o contrário do comentário que envelhece.
 *
 * Nada aqui é executado: a função existe para ser compilada, não chamada.
 */

import {
  type ChaveEscopadaPorTenant,
  criarChaveEscopada,
  RECURSO_CANAL_EVENTOS,
} from "./chave-escopada.js";
import { criarContextoVerificado, type FonteEventosDuraveis } from "./porta.js";

/**
 * Provas de tipo do canal escopado. NUNCA chamada em tempo de execução.
 *
 * @internal
 */
export function provasDeTipoDoCanalEscopado(fonte: FonteEventosDuraveis): void {
  // O caso real que isto impede: um tenant vindo de `request.query`,
  // de um cabeçalho customizado ou de um campo de corpo virando escopo
  // (regra dura §3-6 do prompt; ADR-0011 P2/P3).
  const tenantVindoDoChamador = "SYNTH-TENANT-B";

  // @ts-expect-error — `string` não é atribuível a `TenantId`: não existe
  // caminho por tipo para construir a chave a partir de valor do chamador.
  criarChaveEscopada({ tenantId: tenantVindoDoChamador }, RECURSO_CANAL_EVENTOS);

  // Forjar a chave "na mão" também não compila: falta a marca nominal.
  // (O literal fica numa constante à parte para que o erro caia na LINHA
  // da atribuição — em literal multilinha ele sairia na propriedade, e a
  // diretiva deixaria de ser adjacente ao erro que deve provar.)
  const literalSemMarca = {
    tenantId: tenantVindoDoChamador,
    recurso: RECURSO_CANAL_EVENTOS,
    valor: `tenant:${tenantVindoDoChamador}|recurso:${RECURSO_CANAL_EVENTOS}`,
  };
  // @ts-expect-error — objeto sem a marca nominal não é uma chave escopada.
  const chaveForjada: ChaveEscopadaPorTenant = literalSemMarca;
  void chaveForjada;

  // @ts-expect-error — a leitura do backbone exige a chave escopada; não
  // há sobrecarga que aceite o tenant como `string`.
  void fonte.lerDesde(tenantVindoDoChamador, 0, 10, "SYNTH-USER-A1");

  // O caminho LEGÍTIMO, e o único: contexto verificado ⇒ chave ⇒ leitura.
  const contexto = criarContextoVerificado({
    tenantIdVerificado: "SYNTH-TENANT-G7",
    atorId: "SYNTH-USER-A1",
  });
  const chave = criarChaveEscopada(contexto, RECURSO_CANAL_EVENTOS);
  void fonte.lerDesde(chave, 0, 10, contexto.atorId);
}
