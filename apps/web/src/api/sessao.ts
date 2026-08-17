/**
 * apps/web/src/api/sessao.ts
 *
 * PORTA DE SESSÃO — o contrato que o frontend espera de quem resolve
 * autenticação. Este arquivo declara a interface; NÃO implementa
 * autenticação, e não decide IdP, formato de token, tempo de vida nem
 * política de renovação (autoridade fora da IA — contrato comum §3;
 * ADR-0015 está `not-started`).
 *
 * POR QUE ESTA PORTA EXISTE (ACH-07 §6.7). Até o ciclo 6,
 * `clienteHttp.ts:58` compilava `TOKEN_DEV` como constante de módulo e a
 * enviava em `authorization` em toda chamada. Isso (a) embute credencial no
 * bundle, (b) impede qualquer sessão real, e (c) é o anti-padrão 8 do
 * contrato comum ("fazer fallback de IAM/OIDC indisponível para token
 * local/sintético") na sua forma mais direta — não havia sequer um caminho
 * não-sintético a partir do qual cair.
 *
 * Com a porta, o cliente HTTP passa a RECEBER a sessão por injeção. O
 * especialista `ic-identidade-auth` implementa o provedor real do lado do
 * backend; enquanto ele não existe, o único provedor disponível fora de
 * desenvolvimento é `criarSessaoAusente()`, que recusa — nunca degrada para
 * um token sintético.
 *
 * REGRAS QUE A PORTA IMPÕE:
 *   S1. O provedor devolve o valor COMPLETO do cabeçalho `Authorization`
 *       (ex.: `"Bearer <token>"`), nunca o token cru. O chamador não
 *       manipula, não parseia e não registra credencial.
 *   S2. Ausência de sessão é `null` — nunca uma string vazia, nunca um
 *       fallback. O cliente traduz `null` em estado `proibido` (§11, 1ª
 *       família), visível ao usuário.
 *   S3. O provedor é a ÚNICA fonte do estado de sessão da 6ª família do §11.
 *       O frontend não infere expiração contando tempo por conta própria.
 *   S4. Nenhum comando é reenviado automaticamente após recuperação de
 *       sessão — a reapresentação exige confirmação humana (ADR-0009 W2;
 *       modelo-de-estados §4 `trabalho_nao_salvo_protegido`).
 *
 * Rastreio: ADR-0015, ADR-0016, ADR-0021 F1, ACH-07, MG-G4.
 */
import type { EstadoSessao } from "../domain/estados.js";

/**
 * Provedor de sessão. Implementado por quem resolve autenticação; consumido
 * por `criarClienteHttp` e pela casca do app.
 */
export interface ProvedorSessao {
  /** Estado corrente da sessão (§11, 6ª família). Nunca inferido pelo cliente. */
  estadoAtual(): EstadoSessao;

  /**
   * Valor completo do cabeçalho `Authorization` a enviar, ou `null` quando
   * não há sessão utilizável (S1/S2). Assíncrona porque um provedor real
   * pode precisar renovar o token antes de responder; recebe o `AbortSignal`
   * da requisição para que a renovação também seja cancelável.
   */
  cabecalhoAutorizacao(sinal?: AbortSignal): Promise<string | null>;

  /**
   * Informa ao provedor que a API respondeu 401/403. O provedor decide o que
   * isso significa (renovar, expirar, nada) — o cliente HTTP não decide.
   */
  registrarRespostaNaoAutorizada(status: number): void;

  /** Assina mudanças de estado. Devolve a função de cancelamento da assinatura. */
  assinar(ouvinte: (estado: EstadoSessao) => void): () => void;
}

/**
 * Provedor que NUNCA fornece credencial. É o default seguro fora de
 * desenvolvimento: sem provedor real configurado, o app recusa de forma
 * observável (o usuário vê `proibido` com explicação) em vez de emitir
 * requisição anônima ou cair para um dublê.
 */
export function criarSessaoAusente(): ProvedorSessao {
  return {
    estadoAtual: () => "expirada",
    cabecalhoAutorizacao: async () => null,
    registrarRespostaNaoAutorizada: () => {
      /* sem sessão para invalidar */
    },
    assinar: () => () => {
      /* estado imutável: nada a notificar */
    },
  };
}

/**
 * Provedor de teste com estado controlável. Vive no código de produção (e
 * não num arquivo de teste) porque a galeria de estados em desenvolvimento
 * também o usa para demonstrar a 6ª família do §11 sem simular expiração
 * real. Não contém credencial alguma: o cabeçalho é fornecido pelo chamador.
 */
export function criarSessaoControlada(
  inicial: EstadoSessao,
  cabecalho: string | null,
): ProvedorSessao & { definirEstado(estado: EstadoSessao): void } {
  let estado = inicial;
  const ouvintes = new Set<(estado: EstadoSessao) => void>();

  return {
    estadoAtual: () => estado,
    cabecalhoAutorizacao: async () => (estado === "expirada" ? null : cabecalho),
    registrarRespostaNaoAutorizada: () => {
      estado = "expirada";
      for (const ouvinte of ouvintes) ouvinte(estado);
    },
    assinar: (ouvinte) => {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
    definirEstado: (novo) => {
      estado = novo;
      for (const ouvinte of ouvintes) ouvinte(estado);
    },
  };
}
