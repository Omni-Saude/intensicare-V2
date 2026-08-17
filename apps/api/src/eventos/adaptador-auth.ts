/**
 * apps/api/src/eventos/adaptador-auth.ts — ponte entre a PORTA DE
 * AUTENTICAÇÃO (de `ic-identidade-auth`, `apps/api/src/auth/**`) e a porta
 * de AUTORIZAÇÃO DE ENTREGA que este gateway consome.
 *
 * POR QUE TIPAGEM ESTRUTURAL, E NÃO `import` DIRETO. `apps/api/src/auth/**`
 * é escrito por outro agente, agora, em paralelo — e não é editável por
 * este. Declarar aqui a FORMA que consumimos (em vez de importar os
 * módulos dele) tem duas consequências desejáveis:
 *
 *   1. este arquivo compila mesmo enquanto aquele diretório está a meio
 *      caminho — a falha de um não vira falha do outro;
 *   2. o acoplamento fica explícito e mínimo: exatamente os campos que a
 *      entrega autorizada precisa, nada além.
 *
 * A `PortaDeAutenticacao` real é atribuível a `PortaDeAutenticacaoConsumida`
 * por compatibilidade estrutural — a fiação é uma linha, sem conversão.
 * A forma consumida foi lida de `apps/api/src/auth/porta.ts` e
 * `apps/api/src/auth/tipos.ts` (OBSERVADO em disco).
 *
 * Rastreio: ADR-0011 P3 (autorização a cada push; expiração de sessão
 * interrompe a entrega), ADR-0016 §4.1 (reavaliação por evento),
 * ADR-0015 (a porta em si — não é decidida aqui).
 */

import type { EventoFluxo, ProblemDetails } from "@intensicare/contratos";
import type {
  ContextoVerificado,
  DecisaoAutorizacao,
  PortaAutorizacaoEventos,
  ResultadoVerificacao,
} from "./porta.js";
import { criarContextoVerificado } from "./porta.js";

/** Forma mínima da requisição que a porta de autenticação lê. */
export interface RequisicaoConsumida {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly id: string;
}

/**
 * Contexto que a porta de autenticação devolve. Espelha
 * `ContextoAutenticado` de `apps/api/src/auth/tipos.ts`; campos que este
 * gateway não usa ficam de fora de propósito.
 */
export interface ContextoAutenticadoConsumido {
  readonly tenantId: string;
  readonly atorId: string;
  readonly papeis: readonly string[];
  readonly escopos: readonly string[];
  readonly finalidade: string | undefined;
  /** `exp` do token, em SEGUNDOS desde a época. */
  readonly expiraEm: number;
  readonly idSessao: string | undefined;
}

export type ResultadoAutenticacaoConsumido =
  | { readonly ok: true; readonly contexto: ContextoAutenticadoConsumido }
  | { readonly ok: false; readonly problema: ProblemDetails };

export interface PortaDeAutenticacaoConsumida {
  autenticar(request: RequisicaoConsumida): Promise<ResultadoAutenticacaoConsumido>;
}

/**
 * Ponto de fiação da REVOGAÇÃO e da MUDANÇA DE CONTEXTO (ADR-0011 P3:
 * "mudança de acesso, expiração de sessão ou mudança de contexto invalida a
 * decisão e interrompe a entrega — imposta pelo servidor").
 *
 * ESTADO HONESTO: a porta de autenticação atual registra `idSessao` como
 * "base para revogação futura (não implementada)". Portanto a revogação
 * NÃO está implementada em lugar nenhum — o que existe aqui é o ponto de
 * imposição, já chamado a cada pulsação e a cada evento, para que ligar a
 * lista de revogação seja uma linha e não um redesenho. O padrão é
 * permitir; nenhuma alegação de que revogação funciona é feita.
 */
export type VerificadorDeSessaoViva = (
  contexto: ContextoVerificado,
) => DecisaoAutorizacao | Promise<DecisaoAutorizacao>;

const SESSAO_SEMPRE_VIVA: VerificadorDeSessaoViva = () => ({ permitido: true });

export interface OpcoesAdaptadorAuth {
  readonly autenticacao: PortaDeAutenticacaoConsumida;
  /** Ver `VerificadorDeSessaoViva`. Padrão: permitir. */
  readonly sessaoViva?: VerificadorDeSessaoViva;
  /** Relógio injetável (ms). */
  readonly agora?: () => number;
}

/**
 * Constrói a porta de autorização de entrega sobre a porta de
 * autenticação. A expiração é verificada nos TRÊS momentos — inclusive
 * antes de cada evento escrito, que é o que P3 exige literalmente.
 */
export function criarPortaDeEventosSobreAutenticacao(
  opcoes: OpcoesAdaptadorAuth,
): PortaAutorizacaoEventos {
  const agora = opcoes.agora ?? Date.now;
  const sessaoViva = opcoes.sessaoViva ?? SESSAO_SEMPRE_VIVA;

  function avaliarSessao(
    contexto: ContextoVerificado,
  ): DecisaoAutorizacao | Promise<DecisaoAutorizacao> {
    const expiraEm = contexto.expiraEm;
    if (expiraEm !== null && expiraEm <= agora()) {
      return { permitido: false, motivo: "sessao-expirada" };
    }
    return sessaoViva(contexto);
  }

  return {
    async verificarSessao(request): Promise<ResultadoVerificacao> {
      const resultado = await opcoes.autenticacao.autenticar(request as RequisicaoConsumida);
      if (!resultado.ok) return { ok: false, problema: resultado.problema };
      const bruto = resultado.contexto;
      return {
        ok: true,
        contexto: criarContextoVerificado({
          tenantIdVerificado: bruto.tenantId,
          atorId: bruto.atorId,
          papeis: bruto.papeis,
          // `exp` vem em segundos; o gateway raciocina em milissegundos.
          expiraEm: bruto.expiraEm * 1_000,
          impressaoContexto: montarImpressao(bruto),
        }),
      };
    },

    revalidarSessao(contexto) {
      return avaliarSessao(contexto);
    },

    /**
     * ADR-0011 P3 na letra: a decisão é reavaliada NO MOMENTO DA ENTREGA,
     * por evento. ADR-0011 A1 permite cache de decisão desde que a
     * invalidação seja imposta pelo servidor — não usamos cache aqui, o
     * que é a leitura conservadora da cláusula.
     */
    async autorizarEntrega(contexto, evento: EventoFluxo) {
      const decisao = await avaliarSessao(contexto);
      if (!decisao.permitido) return decisao;
      // Defesa em profundidade: o gateway também reescopa pelo envelope
      // (ADR-0016 §4.1). Duas verificações independentes do mesmo
      // invariante, de propósito.
      if (evento.tenantId !== (contexto.tenantId as string)) {
        return { permitido: false, motivo: "escopo-divergente" };
      }
      return { permitido: true };
    },
  };
}

/**
 * Impressão do contexto de autorização. Muda quando papéis, escopos,
 * finalidade ou sessão mudam — o gatilho de `contexto-alterado` de P3.
 * NÃO contém credencial: só identificadores já verificados.
 */
function montarImpressao(contexto: ContextoAutenticadoConsumido): string {
  return [
    contexto.tenantId,
    contexto.atorId,
    [...contexto.papeis].sort().join(","),
    [...contexto.escopos].sort().join(","),
    contexto.finalidade ?? "",
    contexto.idSessao ?? "",
  ].join("|");
}
