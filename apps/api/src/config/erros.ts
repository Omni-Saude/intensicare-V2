/**
 * Erro fatal de configuração de runtime.
 *
 * Duas propriedades são deliberadas e ambas são asseveradas por teste:
 *
 * 1. TODOS os problemas são acumulados num único erro. Falhar no primeiro
 *    obrigaria o operador a descobrir a configuração faltante uma variável por
 *    vez, cada ciclo custando um boot — o modo mais eficiente de empurrar
 *    alguém para "deixa em dev-synthetic mesmo".
 *
 * 2. NENHUM valor de variável de ambiente aparece na mensagem. Só o NOME da
 *    variável e o que se esperava dela. Uma mensagem que ecoasse o valor
 *    inválido publicaria a senha do banco no log da primeira vez que alguém
 *    errasse uma vírgula (anti-padrão 12 do contrato comum). Quando o motivo
 *    precisa citar valores aceitos, cita os literais do código — nunca o que
 *    veio do ambiente.
 */
import type { Perfil } from "./perfis.js";

export interface ProblemaConfiguracao {
  /** Nome da variável de ambiente, ou `null` quando o problema não é de uma variável. */
  readonly variavel: string | null;
  readonly perfil: Perfil | null;
  /** Explicação SEM o valor observado — ver nota de topo do módulo. */
  readonly motivo: string;
}

function montarMensagem(problemas: readonly ProblemaConfiguracao[]): string {
  const linhas = problemas.map((p) => {
    const alvo = p.variavel ?? "(configuração)";
    const escopo = p.perfil === null ? "" : ` [perfil ${p.perfil}]`;
    return `  - ${alvo}${escopo}: ${p.motivo}`;
  });
  return [
    "Configuração de runtime inválida — inicialização abortada ANTES de abrir a porta.",
    "Nenhum default inseguro é aplicado no lugar de configuração ausente (ADR-0019 §5.2 P4).",
    `${problemas.length} problema(s):`,
    ...linhas,
  ].join("\n");
}

export class ErroDeConfiguracao extends Error {
  readonly problemas: readonly ProblemaConfiguracao[];

  constructor(problemas: readonly ProblemaConfiguracao[]) {
    super(montarMensagem(problemas));
    this.name = "ErroDeConfiguracao";
    this.problemas = Object.freeze([...problemas]);
  }

  /** Nomes das variáveis envolvidas, sem repetição e em ordem estável. */
  get variaveis(): readonly string[] {
    const nomes = new Set<string>();
    for (const problema of this.problemas) {
      if (problema.variavel !== null) nomes.add(problema.variavel);
    }
    return [...nomes].sort();
  }
}
