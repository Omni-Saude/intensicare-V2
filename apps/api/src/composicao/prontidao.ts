/**
 * apps/api/src/composicao/prontidao.ts — adaptadores de prontidão que a
 * composição precisa fornecer e que `apps/api/src/saude/portas.ts` não pode
 * fornecer hoje.
 *
 * CONTRADIÇÃO OBSERVADA (registrada no handoff, não contornada em silêncio).
 * `saude/portas.ts` expõe `dependenciaDeBancoDeDadosDiferida(obter: () => PGlite
 * | null)` e implementa a verificação com `checkConnection(db)`, cuja
 * assinatura em `@intensicare/persistencia` é `(db: PGlite)`. Depois da troca
 * de motor (ACH-01), `apps/api/src/db.ts` deixou de circular `PGlite` e passou
 * a circular `PortaBancoDeDados` — que é justamente o ponto: a aplicação não
 * deve mais saber qual motor está atrás. Sob `AdaptadorPostgres` não existe
 * nenhum `PGlite` para entregar àquela função, e sob `AdaptadorPglite` o
 * `PGlite` interno é privado por desenho.
 *
 * A correção estrutural é alargar a porta de `saude/portas.ts` para
 * `PortaBancoDeDados` — arquivo fora da fronteira de escrita deste agente. Até
 * lá, a dependência é montada AQUI, reusando o mesmo identificador
 * (`ID_DEPENDENCIA_BANCO`) e a mesma varredura de segurança
 * (`assertIdDeDependenciaSeguro`) daquele módulo, para que a superfície de
 * `/v1/readyz` não divirja.
 *
 * POR QUE A SONDA ABRE UMA TRANSAÇÃO COM ESCOPO. A porta só oferece um caminho
 * de acesso: `comTenant`. Não existe — de propósito — consulta fora de escopo
 * de tenant, porque uma consulta sem escopo é exatamente o defeito que a RLS
 * existe para impedir (THR-0002). A sonda usa então um escopo de SONDAGEM que
 * não corresponde a tenant nenhum e executa `select 1`, que não toca tabela
 * clínica alguma. Se um dia tocasse, a RLS negaria toda linha — que é o
 * comportamento correto e não uma degradação.
 *
 * Rastreio: ADR-0020 O4 (prontidão é capacidade segura), ADR-0016 §4.1,
 * anti-padrão 10 do contrato comum.
 */

import type { PortaBancoDeDados } from "@intensicare/persistencia";
import {
  assertIdDeDependenciaSeguro,
  type DependenciaDeclarada,
  ID_DEPENDENCIA_BANCO,
} from "../saude/portas.js";

/**
 * Escopo usado apenas pela sonda. Não é um tenant: nenhum dado é semeado sob
 * ele e nenhuma linha lhe pertence. Carrega o prefixo `SYNTH-` porque é
 * material sintético como todo o resto desta fatia.
 */
export const ESCOPO_DE_SONDAGEM = "SYNTH-SONDA-PRONTIDAO";

/**
 * Dependência obrigatória de banco, lida por closure a cada verificação.
 *
 * Diferida porque as superfícies de saúde são registradas ANTES de o banco
 * abrir — sem isso `/v1/startupz` nunca observaria o estado `iniciando`.
 * Enquanto `obter()` devolve `null`, a dependência está INDISPONÍVEL: é a
 * leitura correta, e não um "ainda não sei" tratado como disponível.
 */
export function dependenciaDeBancoDiferida(
  obter: () => PortaBancoDeDados | null,
): DependenciaDeclarada {
  assertIdDeDependenciaSeguro(ID_DEPENDENCIA_BANCO);
  return {
    id: ID_DEPENDENCIA_BANCO,
    obrigatoria: true,
    verificar: async () => {
      const porta = obter();
      if (porta === null) return false;
      const resultado = await porta.comTenant(ESCOPO_DE_SONDAGEM, async (tx) => {
        const r = await tx.query<{ um: number }>("select 1 as um");
        return r.rows[0]?.um;
      });
      return Number(resultado) === 1;
    },
  };
}
